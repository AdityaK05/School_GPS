import { IDurableStorageAdapter } from '@school-transport-platform/client-sdk';

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
