import { SupabaseClient, RealtimeChannel } from '@supabase/supabase-js';
import { GPSLocation, JourneyEvent, JourneyException } from '@school-transport-platform/shared-types';

export type RealtimeStatus = 'DISCONNECTED' | 'CONNECTING' | 'CONNECTED' | 'RECONNECTING';

export type RealtimeEventHandler<T = unknown> = (payload: T) => void;

export class RealtimeClient {
  private status: RealtimeStatus = 'DISCONNECTED';
  private subscriptions = new Map<string, Set<RealtimeEventHandler>>();
  private processedEventIds = new Set<string>();
  private reconnectTimer?: ReturnType<typeof setTimeout>;

  public getStatus(): RealtimeStatus {
    return this.status;
  }

  public connect(): void {
    if (this.status === 'CONNECTED' || this.status === 'CONNECTING') return;
    this.status = 'CONNECTING';

    // Simulate immediate successful socket connection
    setTimeout(() => {
      this.status = 'CONNECTED';
    }, 10);
  }

  public disconnect(): void {
    this.status = 'DISCONNECTED';
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
  }

  public simulateDisconnectAndReconnect(onReconnect?: () => void): void {
    this.status = 'RECONNECTING';
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    this.reconnectTimer = setTimeout(() => {
      this.status = 'CONNECTED';
      if (onReconnect) onReconnect();
    }, 50);
  }

  public subscribe<T = unknown>(channel: string, handler: RealtimeEventHandler<T>): () => void {
    if (!this.subscriptions.has(channel)) {
      this.subscriptions.set(channel, new Set());
    }
    const handlers = this.subscriptions.get(channel)!;
    handlers.add(handler as RealtimeEventHandler);

    return () => {
      handlers.delete(handler as RealtimeEventHandler);
      if (handlers.size === 0) {
        this.subscriptions.delete(channel);
      }
    };
  }

  /**
   * Broadcasts a real-time event to subscribers.
   * Deduplicates using eventId to prevent duplicate event execution on reconnection.
   */
  public emitEvent<T extends { eventId?: string; id?: string }>(channel: string, payload: T): boolean {
    const id = payload.eventId || payload.id;
    if (id) {
      if (this.processedEventIds.has(id)) {
        return false; // Safely deduplicate
      }
      this.processedEventIds.add(id);
    }

    const handlers = this.subscriptions.get(channel);
    if (!handlers || handlers.size === 0) return false;

    handlers.forEach((handler) => handler(payload));
    return true;
  }
}

export interface ISupabaseRealtimeOptions {
  supabaseClient: SupabaseClient;
  onStatusChange?: (status: RealtimeStatus) => void;
}

export class SupabaseRealtimeClient {
  private client: SupabaseClient;
  private status: RealtimeStatus = 'DISCONNECTED';
  private channels = new Map<string, RealtimeChannel>();
  private processedEventIds = new Set<string>();
  private onStatusChange?: (status: RealtimeStatus) => void;

  constructor(options: ISupabaseRealtimeOptions) {
    this.client = options.supabaseClient;
    this.onStatusChange = options.onStatusChange;
  }

  public getStatus(): RealtimeStatus {
    return this.status;
  }

  public subscribeBusLocations(
    busId: string,
    onLocation: (location: GPSLocation) => void
  ): () => void {
    const channelName = `realtime:bus_locations:${busId}`;
    const channel = this.client
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'gps_locations',
          filter: `bus_id=eq.${busId}`,
        },
        (payload: any) => {
          const row = payload.new;
          if (!row) return;
          if (row.id && this.processedEventIds.has(row.id)) return;
          if (row.id) this.processedEventIds.add(row.id);

          const loc: GPSLocation = {
            id: row.id,
            busId: row.bus_id,
            schoolId: row.school_id,
            latitude: Number(row.latitude),
            longitude: Number(row.longitude),
            location: {
              type: 'Point',
              coordinates: [Number(row.longitude), Number(row.latitude)],
            },
            speed: row.speed !== undefined ? Number(row.speed) : undefined,
            heading: row.heading !== undefined ? Number(row.heading) : undefined,
            accuracy: row.accuracy !== undefined ? Number(row.accuracy) : undefined,
            recordedAt: row.recorded_at || row.timestamp || new Date().toISOString(),
            receivedAt: row.received_at || row.created_at || new Date().toISOString(),
          };
          onLocation(loc);
        }
      )
      .subscribe((status: string) => {
        if (status === 'SUBSCRIBED') {
          this.status = 'CONNECTED';
          this.onStatusChange?.('CONNECTED');
        } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          this.status = 'RECONNECTING';
          this.onStatusChange?.('RECONNECTING');
        } else if (status === 'CLOSED') {
          this.status = 'DISCONNECTED';
          this.onStatusChange?.('DISCONNECTED');
        }
      });

    this.channels.set(channelName, channel);

    return () => {
      this.client.removeChannel(channel);
      this.channels.delete(channelName);
    };
  }

  public subscribeTripJourneyEvents(
    tripId: string,
    onEvent: (event: JourneyEvent) => void
  ): () => void {
    const channelName = `realtime:journey_events:${tripId}`;
    const channel = this.client
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'journey_events',
          filter: `trip_id=eq.${tripId}`,
        },
        (payload: any) => {
          const row = payload.new;
          if (!row) return;
          const dedupeKey = row.idempotency_key || row.id;
          if (dedupeKey && this.processedEventIds.has(dedupeKey)) return;
          if (dedupeKey) this.processedEventIds.add(dedupeKey);

          const evt: JourneyEvent = {
            id: row.id,
            schoolId: row.school_id,
            tripId: row.trip_id,
            studentId: row.student_id,
            busId: row.bus_id,
            stopId: row.stop_id,
            eventType: row.event_type,
            source: row.source || 'SYSTEM',
            deviceId: row.device_id,
            latitude: row.latitude ? Number(row.latitude) : undefined,
            longitude: row.longitude ? Number(row.longitude) : undefined,
            eventTimestamp: row.event_timestamp || row.created_at || new Date().toISOString(),
            idempotencyKey: row.idempotency_key || row.id,
            metadata: row.metadata,
          };
          onEvent(evt);
        }
      )
      .subscribe((status: string) => {
        if (status === 'SUBSCRIBED') {
          this.status = 'CONNECTED';
          this.onStatusChange?.('CONNECTED');
        }
      });

    this.channels.set(channelName, channel);

    return () => {
      this.client.removeChannel(channel);
      this.channels.delete(channelName);
    };
  }

  public subscribeSchoolExceptions(
    schoolId: string,
    onException: (exc: JourneyException) => void
  ): () => void {
    const channelName = `realtime:exceptions:${schoolId}`;
    const channel = this.client
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'exceptions',
          filter: `school_id=eq.${schoolId}`,
        },
        (payload: any) => {
          const row = payload.new;
          if (!row) return;
          if (row.id && this.processedEventIds.has(row.id)) return;
          if (row.id) this.processedEventIds.add(row.id);

          const exc: JourneyException = {
            id: row.id,
            schoolId: row.school_id,
            tripId: row.trip_id,
            studentId: row.student_id,
            busId: row.bus_id,
            type: row.type || row.exception_type,
            severity: row.severity,
            status: row.status,
            description: row.description,
            metadata: row.metadata,
            createdAt: row.created_at || new Date().toISOString(),
            resolvedAt: row.resolved_at,
            resolvedBy: row.resolved_by || row.resolved_by_user_id,
            resolutionReason: row.resolution_reason,
          };
          onException(exc);
        }
      )
      .subscribe((status: string) => {
        if (status === 'SUBSCRIBED') {
          this.status = 'CONNECTED';
          this.onStatusChange?.('CONNECTED');
        }
      });

    this.channels.set(channelName, channel);

    return () => {
      this.client.removeChannel(channel);
      this.channels.delete(channelName);
    };
  }

  public disconnect(): void {
    for (const channel of this.channels.values()) {
      this.client.removeChannel(channel);
    }
    this.channels.clear();
    this.status = 'DISCONNECTED';
    this.onStatusChange?.('DISCONNECTED');
  }
}
