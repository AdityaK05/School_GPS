import { describe, it, expect, vi } from 'vitest';
import { SupabaseRealtimeClient } from '../packages/client-sdk/src/realtime';
import { FcmNotificationProvider } from '../apps/api/src/domain/notifications/fcm.provider';
import { SupabaseClient } from '@supabase/supabase-js';

describe('Real Supabase Realtime Client', () => {
  it('subscribes to bus locations with deduplication', () => {
    let capturedCallback: any;
    const mockChannel = {
      on: vi.fn().mockImplementation((event, filter, callback) => {
        capturedCallback = callback;
        return mockChannel;
      }),
      subscribe: vi.fn().mockImplementation((statusCallback) => {
        statusCallback('SUBSCRIBED');
        return mockChannel;
      }),
    };

    const mockSupabaseClient = {
      channel: vi.fn().mockReturnValue(mockChannel),
      removeChannel: vi.fn(),
    } as unknown as SupabaseClient;

    const realtime = new SupabaseRealtimeClient({ supabaseClient: mockSupabaseClient });
    const receivedLocations: any[] = [];

    const unsubscribe = realtime.subscribeBusLocations('bus_123', (loc) => {
      receivedLocations.push(loc);
    });

    expect(realtime.getStatus()).toBe('CONNECTED');
    expect(mockSupabaseClient.channel).toHaveBeenCalledWith('realtime:bus_locations:bus_123');

    // Simulate location payload from Supabase
    capturedCallback({
      new: {
        id: 'loc_001',
        bus_id: 'bus_123',
        school_id: 'sch_001',
        latitude: 12.9716,
        longitude: 77.5946,
        speed: 35.5,
        heading: 180,
        recorded_at: '2026-11-15T12:00:00Z',
      },
    });

    expect(receivedLocations).toHaveLength(1);
    expect(receivedLocations[0].busId).toBe('bus_123');
    expect(receivedLocations[0].speed).toBe(35.5);

    // Simulate duplicate payload with same id (must be deduplicated)
    capturedCallback({
      new: {
        id: 'loc_001',
        bus_id: 'bus_123',
        school_id: 'sch_001',
        latitude: 12.9716,
        longitude: 77.5946,
      },
    });

    expect(receivedLocations).toHaveLength(1); // Not duplicated!

    unsubscribe();
    expect(mockSupabaseClient.removeChannel).toHaveBeenCalled();
  });

  it('subscribes to journey events and exceptions', () => {
    let eventCallback: any;
    let exceptionCallback: any;

    const mockChannelEvents = {
      on: vi.fn().mockImplementation((e, f, cb) => {
        eventCallback = cb;
        return mockChannelEvents;
      }),
      subscribe: vi.fn().mockImplementation((cb) => {
        cb('SUBSCRIBED');
        return mockChannelEvents;
      }),
    };

    const mockChannelExceptions = {
      on: vi.fn().mockImplementation((e, f, cb) => {
        exceptionCallback = cb;
        return mockChannelExceptions;
      }),
      subscribe: vi.fn().mockImplementation((cb) => {
        cb('SUBSCRIBED');
        return mockChannelExceptions;
      }),
    };

    const mockSupabaseClient = {
      channel: vi.fn().mockImplementation((name: string) => {
        if (name.includes('journey_events')) return mockChannelEvents;
        if (name.includes('exceptions')) return mockChannelExceptions;
        return mockChannelEvents;
      }),
      removeChannel: vi.fn(),
    } as unknown as SupabaseClient;

    const realtime = new SupabaseRealtimeClient({ supabaseClient: mockSupabaseClient });

    const events: any[] = [];
    const exceptions: any[] = [];

    realtime.subscribeTripJourneyEvents('trip_01', (evt) => events.push(evt));
    realtime.subscribeSchoolExceptions('sch_01', (exc) => exceptions.push(exc));

    eventCallback({
      new: {
        id: 'evt_01',
        school_id: 'sch_01',
        trip_id: 'trip_01',
        student_id: 'std_01',
        event_type: 'STUDENT_BOARDING',
        source: 'RFID',
        idempotency_key: '018f0000-0000-7000-0000-000000000099',
      },
    });

    exceptionCallback({
      new: {
        id: 'exc_01',
        school_id: 'sch_01',
        trip_id: 'trip_01',
        type: 'WRONG_BUS',
        severity: 'CRITICAL',
        status: 'OPEN',
        description: 'Wrong bus boarding attempted',
      },
    });

    expect(events).toHaveLength(1);
    expect(events[0].eventType).toBe('STUDENT_BOARDING');
    expect(exceptions).toHaveLength(1);
    expect(exceptions[0].type).toBe('WRONG_BUS');
    expect(exceptions[0].severity).toBe('CRITICAL');

    realtime.disconnect();
    expect(realtime.getStatus()).toBe('DISCONNECTED');
  });
});

describe('FCM Push Notification Provider', () => {
  it('formats FCM HTTP v1 payload with high priority and notification channel', () => {
    const provider = new FcmNotificationProvider({
      tokenResolver: { getTokensForUser: vi.fn() },
      dryRun: true,
    });

    const payload = provider.formatFcmPayload('device_token_abc123', {
      userId: 'usr_parent_01',
      title: 'Student Boarded Bus 04',
      body: 'Aarav Sharma safely boarded bus at Main Gate.',
      data: {
        studentId: 'std_01',
        tripId: 'trip_01',
        eventType: 'STUDENT_BOARDING',
      },
    });

    expect(payload).toEqual({
      message: {
        token: 'device_token_abc123',
        notification: {
          title: 'Student Boarded Bus 04',
          body: 'Aarav Sharma safely boarded bus at Main Gate.',
        },
        data: {
          studentId: 'std_01',
          tripId: 'trip_01',
          eventType: 'STUDENT_BOARDING',
        },
        android: {
          priority: 'high',
          notification: {
            channelId: 'student_transport_alerts',
            sound: 'default',
            priority: 'max',
          },
        },
        apns: {
          payload: {
            aps: {
              sound: 'default',
              badge: 1,
            },
          },
        },
      },
    });
  });

  it('safely handles dry-run dispatch when credentials are not configured', async () => {
    const mockTokenResolver = {
      getTokensForUser: vi.fn().mockResolvedValue(['token_1', 'token_2']),
    };

    const provider = new FcmNotificationProvider({
      tokenResolver: mockTokenResolver,
      dryRun: true,
    });

    const result = await provider.sendPush({
      userId: 'usr_parent_02',
      title: 'Bus Approaching Stop',
      body: 'Bus 04 is 5 minutes away from Main Gate.',
    });

    expect(mockTokenResolver.getTokensForUser).toHaveBeenCalledWith('usr_parent_02');
    expect(result.success).toBe(true);
    expect(result.messageId).toContain('fcm_dry_');
  });

  it('returns NO_ACTIVE_DEVICE_TOKENS when recipient has no registered FCM tokens', async () => {
    const mockTokenResolver = {
      getTokensForUser: vi.fn().mockResolvedValue([]),
    };

    const provider = new FcmNotificationProvider({
      tokenResolver: mockTokenResolver,
      dryRun: true,
    });

    const result = await provider.sendPush({
      userId: 'usr_unregistered',
      title: 'Alert',
      body: 'Test alert',
    });

    expect(result.success).toBe(false);
    expect(result.error).toBe('NO_ACTIVE_DEVICE_TOKENS');
  });
});
