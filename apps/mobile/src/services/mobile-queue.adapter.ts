import { IDurableStorageAdapter } from '@school-transport-platform/client-sdk';
import * as SQLite from 'expo-sqlite';

export interface KeyValueStore {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
  removeItem(key: string): Promise<void>;
}

export class KeyValueDurableStorageAdapter implements IDurableStorageAdapter {
  constructor(
    private store: KeyValueStore,
    private storageKey: string = '@school_transport_offline_queue'
  ) {}

  async read(): Promise<string | null> {
    return this.store.getItem(this.storageKey);
  }

  async write(data: string): Promise<void> {
    await this.store.setItem(this.storageKey, data);
  }
}

export class SqliteDurableStorageAdapter implements IDurableStorageAdapter {
  private initialized: Promise<void>;

  constructor(private databaseName: string = 'aegis_offline_queue.db') {
    this.initialized = this.initialize();
  }

  private async initialize(): Promise<void> {
    const database = await SQLite.openDatabaseAsync(this.databaseName);
    await database.execAsync(
      'CREATE TABLE IF NOT EXISTS durable_kv (key TEXT PRIMARY KEY NOT NULL, value TEXT NOT NULL);'
    );
  }

  async read(): Promise<string | null> {
    await this.initialized;
    const database = await SQLite.openDatabaseAsync(this.databaseName);
    const row = await database.getFirstAsync<{ value: string }>(
      'SELECT value FROM durable_kv WHERE key = ?;',
      ['offline_event_queue']
    );
    return row?.value ?? null;
  }

  async write(data: string): Promise<void> {
    await this.initialized;
    const database = await SQLite.openDatabaseAsync(this.databaseName);
    await database.runAsync(
      'INSERT INTO durable_kv (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value;',
      ['offline_event_queue', data]
    );
  }
}
