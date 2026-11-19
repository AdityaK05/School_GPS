import { JourneyEvent } from '@school-transport-platform/shared-types';
import { generateUuidV7 } from '@school-transport-platform/utils';
import { ApiClient, ApiClientError } from './api-client';

export type QueueItemStatus = 'PENDING' | 'SYNCING' | 'SYNCED' | 'FAILED' | 'REJECTED';

export interface QueuedEvent {
  localId: string;
  idempotencyKey: string;
  event: Partial<JourneyEvent>;
  status: QueueItemStatus;
  retryCount: number;
  lastAttemptAt?: string;
  error?: string;
  createdAt: string;
}

export interface IQueueStorage {
  getAll(): Promise<QueuedEvent[]>;
  save(item: QueuedEvent): Promise<void>;
  update(localId: string, updates: Partial<QueuedEvent>): Promise<void>;
  remove(localId: string): Promise<void>;
}

export class MemoryQueueStorage implements IQueueStorage {
  private items = new Map<string, QueuedEvent>();

  async getAll(): Promise<QueuedEvent[]> {
    return Array.from(this.items.values());
  }
  async save(item: QueuedEvent): Promise<void> {
    this.items.set(item.localId, { ...item });
  }
  async update(localId: string, updates: Partial<QueuedEvent>): Promise<void> {
    const existing = this.items.get(localId);
    if (existing) {
      this.items.set(localId, { ...existing, ...updates });
    }
  }
  async remove(localId: string): Promise<void> {
    this.items.delete(localId);
  }
}

export interface IDurableStorageAdapter {
  read(): Promise<string | null>;
  write(data: string): Promise<void>;
}

export class PersistentQueueStorage implements IQueueStorage {
  private items = new Map<string, QueuedEvent>();
  private initialized = false;

  constructor(private adapter: IDurableStorageAdapter) {}

  public async init(): Promise<void> {
    if (this.initialized) return;
    const raw = await this.adapter.read();
    if (raw) {
      const parsed: unknown = JSON.parse(raw);
      if (!Array.isArray(parsed)) {
        throw new Error('Offline queue storage is corrupt: expected an event list');
      }
      for (const item of parsed as QueuedEvent[]) {
        if (!item || typeof item.localId !== 'string' || typeof item.idempotencyKey !== 'string') {
          throw new Error('Offline queue storage is corrupt: event identity is missing');
        }
        if (item.status === 'SYNCING') item.status = 'PENDING';
        this.items.set(item.localId, item);
      }
    }
    this.initialized = true;
  }

  private async persist(): Promise<void> {
    const list = Array.from(this.items.values());
    await this.adapter.write(JSON.stringify(list));
  }

  async getAll(): Promise<QueuedEvent[]> {
    if (!this.initialized) await this.init();
    return Array.from(this.items.values());
  }

  async save(item: QueuedEvent): Promise<void> {
    if (!this.initialized) await this.init();
    this.items.set(item.localId, { ...item });
    await this.persist();
  }

  async update(localId: string, updates: Partial<QueuedEvent>): Promise<void> {
    if (!this.initialized) await this.init();
    const existing = this.items.get(localId);
    if (existing) {
      this.items.set(localId, { ...existing, ...updates });
      await this.persist();
    }
  }

  async remove(localId: string): Promise<void> {
    if (!this.initialized) await this.init();
    this.items.delete(localId);
    await this.persist();
  }

  async purgeSynced(maxAgeMs: number = 86400000): Promise<number> {
    if (!this.initialized) await this.init();
    const now = Date.now();
    let purgedCount = 0;
    for (const [id, item] of this.items.entries()) {
      if (item.status === 'SYNCED') {
        const age = now - new Date(item.createdAt).getTime();
        if (age > maxAgeMs) {
          this.items.delete(id);
          purgedCount++;
        }
      }
    }
    if (purgedCount > 0) {
      await this.persist();
    }
    return purgedCount;
  }
}

export class OfflineSyncEngine {
  private isSyncing = false;

  constructor(
    private storage: IQueueStorage,
    private apiClient: ApiClient,
    private deviceId: string
  ) {}

  public getRetryDelayMs(retryCount: number): number {
    const baseDelayMs = 1000;
    const maxDelayMs = 60_000;
    return Math.min(maxDelayMs, baseDelayMs * 2 ** Math.max(0, retryCount));
  }

  /**
   * Enqueues an offline event locally with UUID v7 idempotency key.
   */
  public async enqueue(event: Partial<JourneyEvent>): Promise<QueuedEvent> {
    const idempotencyKey = event.idempotencyKey || generateUuidV7();
    const queued: QueuedEvent = {
      localId: generateUuidV7(),
      idempotencyKey,
      event: {
        ...event,
        idempotencyKey,
        eventTimestamp: event.eventTimestamp || new Date().toISOString(),
      },
      status: 'PENDING',
      retryCount: 0,
      createdAt: new Date().toISOString(),
    };

    await this.storage.save(queued);
    return queued;
  }

  public async getPendingCount(): Promise<number> {
    const all = await this.storage.getAll();
    return all.filter((i) => i.status === 'PENDING' || i.status === 'FAILED').length;
  }

  /**
   * Flushes pending items in batch to the backend.
   */
  public async flush(): Promise<{ synced: number; failed: number }> {
    if (this.isSyncing) return { synced: 0, failed: 0 };
    this.isSyncing = true;

    try {
      const all = await this.storage.getAll();
      const now = Date.now();
      const pendingItems = all.filter((item) => {
        if (item.status === 'PENDING') return true;
        if (item.status !== 'FAILED') return false;
        if (!item.lastAttemptAt) return true;
        const lastAttempt = new Date(item.lastAttemptAt).getTime();
        return Number.isFinite(lastAttempt) && now - lastAttempt >= this.getRetryDelayMs(item.retryCount);
      });

      if (pendingItems.length === 0) return { synced: 0, failed: 0 };

      // Mark SYNCING
      for (const item of pendingItems) {
        await this.storage.update(item.localId, { status: 'SYNCING', lastAttemptAt: new Date().toISOString() });
      }

      const eventsToSubmit = pendingItems.map((p) => p.event);
      let batchResponse: { accepted: string[]; rejected: Array<{ idempotencyKey: string; error: string }> };

      try {
        batchResponse = await this.apiClient.batchSyncEvents(this.deviceId, eventsToSubmit);
      } catch (err: unknown) {
        const permanentFailure = err instanceof ApiClientError && err.status >= 400 && err.status < 500;
        for (const item of pendingItems) {
          await this.storage.update(item.localId, {
            status: permanentFailure ? 'REJECTED' : 'FAILED',
            retryCount: item.retryCount + 1,
            error: err instanceof Error ? err.message : 'Batch synchronization failed',
          });
        }
        return { synced: 0, failed: pendingItems.length };
      }

      let syncedCount = 0;
      let failedCount = 0;

      for (const item of pendingItems) {
        if (batchResponse.accepted.includes(item.idempotencyKey)) {
          await this.storage.update(item.localId, { status: 'SYNCED' });
          syncedCount++;
        } else {
          const rejected = batchResponse.rejected.find((r) => r.idempotencyKey === item.idempotencyKey);
          await this.storage.update(item.localId, {
            status: 'REJECTED',
            retryCount: item.retryCount + 1,
            error: rejected?.error || 'Rejected by server validation',
          });
          failedCount++;
        }
      }

      return { synced: syncedCount, failed: failedCount };
    } finally {
      this.isSyncing = false;
    }
  }
}
