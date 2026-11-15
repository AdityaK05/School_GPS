import { describe, it, expect, beforeEach } from 'vitest';
import {
  PersistentQueueStorage,
  IDurableStorageAdapter,
  QueuedEvent,
} from '../packages/client-sdk/src/offline-queue';

class MockDurableStorageAdapter implements IDurableStorageAdapter {
  public data: string | null = null;
  public writeCount = 0;

  async read(): Promise<string | null> {
    return this.data;
  }

  async write(data: string): Promise<void> {
    this.data = data;
    this.writeCount++;
  }
}

describe('Persistent Mobile Queue Storage', () => {
  let adapter: MockDurableStorageAdapter;
  let storage: PersistentQueueStorage;

  beforeEach(() => {
    adapter = new MockDurableStorageAdapter();
    storage = new PersistentQueueStorage(adapter);
  });

  it('saves offline events and persists atomically to durable storage', async () => {
    const item: QueuedEvent = {
      localId: 'loc_001',
      idempotencyKey: '018f0000-0000-7000-0000-000000000001',
      event: {
        eventType: 'STUDENT_BOARDING',
        studentId: 'std_01',
      },
      status: 'PENDING',
      retryCount: 0,
      createdAt: new Date().toISOString(),
    };

    await storage.save(item);

    const items = await storage.getAll();
    expect(items).toHaveLength(1);
    expect(items[0].localId).toBe('loc_001');
    expect(adapter.data).toBeTruthy();
    expect(JSON.parse(adapter.data!)).toHaveLength(1);
  });

  it('performs crash-recovery by resetting stuck SYNCING items to PENDING on restart', async () => {
    // Simulate app crashing while middle of a batch sync
    const crashedState: QueuedEvent[] = [
      {
        localId: 'loc_synced',
        idempotencyKey: 'key_1',
        event: { eventType: 'STUDENT_BOARDING' },
        status: 'SYNCED',
        retryCount: 0,
        createdAt: new Date().toISOString(),
      },
      {
        localId: 'loc_stuck_syncing',
        idempotencyKey: 'key_2',
        event: { eventType: 'STUDENT_EXIT' },
        status: 'SYNCING', // Was in-flight during crash/power-loss
        retryCount: 1,
        createdAt: new Date().toISOString(),
      },
    ];

    adapter.data = JSON.stringify(crashedState);

    // Boot fresh storage instance
    const newStorageInstance = new PersistentQueueStorage(adapter);
    await newStorageInstance.init();

    const items = await newStorageInstance.getAll();
    expect(items).toHaveLength(2);

    const recoveredItem = items.find((i) => i.localId === 'loc_stuck_syncing');
    expect(recoveredItem?.status).toBe('PENDING'); // Automatically restored to PENDING!

    const syncedItem = items.find((i) => i.localId === 'loc_synced');
    expect(syncedItem?.status).toBe('SYNCED');
  });

  it('updates item status and persists changes', async () => {
    const item: QueuedEvent = {
      localId: 'loc_002',
      idempotencyKey: 'key_update',
      event: { eventType: 'STUDENT_BOARDING' },
      status: 'PENDING',
      retryCount: 0,
      createdAt: new Date().toISOString(),
    };

    await storage.save(item);
    await storage.update('loc_002', { status: 'SYNCED' });

    const items = await storage.getAll();
    expect(items[0].status).toBe('SYNCED');
  });

  it('removes item and updates durable store', async () => {
    const item: QueuedEvent = {
      localId: 'loc_003',
      idempotencyKey: 'key_del',
      event: { eventType: 'STUDENT_BOARDING' },
      status: 'SYNCED',
      retryCount: 0,
      createdAt: new Date().toISOString(),
    };

    await storage.save(item);
    await storage.remove('loc_003');

    const items = await storage.getAll();
    expect(items).toHaveLength(0);
    expect(JSON.parse(adapter.data!)).toHaveLength(0);
  });

  it('purges expired synced events to prevent unbounded mobile disk growth', async () => {
    const twoDaysAgo = new Date(Date.now() - 2 * 86400000).toISOString();
    const recent = new Date().toISOString();

    const items: QueuedEvent[] = [
      {
        localId: 'loc_old_synced',
        idempotencyKey: 'key_old',
        event: { eventType: 'STUDENT_BOARDING' },
        status: 'SYNCED',
        retryCount: 0,
        createdAt: twoDaysAgo,
      },
      {
        localId: 'loc_recent_synced',
        idempotencyKey: 'key_rec',
        event: { eventType: 'STUDENT_EXIT' },
        status: 'SYNCED',
        retryCount: 0,
        createdAt: recent,
      },
      {
        localId: 'loc_pending',
        idempotencyKey: 'key_pend',
        event: { eventType: 'STUDENT_BOARDING' },
        status: 'PENDING',
        retryCount: 0,
        createdAt: twoDaysAgo, // Pending items should never be purged!
      },
    ];

    adapter.data = JSON.stringify(items);
    await storage.init();

    const purged = await storage.purgeSynced(86400000); // 24 hours max age
    expect(purged).toBe(1);

    const remaining = await storage.getAll();
    expect(remaining).toHaveLength(2);
    expect(remaining.some((i) => i.localId === 'loc_old_synced')).toBe(false);
    expect(remaining.some((i) => i.localId === 'loc_recent_synced')).toBe(true);
    expect(remaining.some((i) => i.localId === 'loc_pending')).toBe(true);
  });
});
