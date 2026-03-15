import { Platform } from 'react-native';
import { SyncQueueItem, NewVehicleForm } from '../types';
import { SYNC_STORAGE_KEY, MAX_RETRY_COUNT } from '../constants';
import { vehicleApi } from './api';

/**
 * Lazy AsyncStorage getter — never evaluated during SSR (Node.js web render).
 */
function getStorage() {
  if (Platform.OS === 'web' && typeof window === 'undefined') {
    // SSR no-op
    return {
      getItem: async (_key: string) => null,
      setItem: async (_key: string, _value: string) => {},
      removeItem: async (_key: string) => {},
    };
  }
  if (Platform.OS === 'web') {
    return {
      getItem: async (key: string) => window.localStorage.getItem(key),
      setItem: async (key: string, value: string) => window.localStorage.setItem(key, value),
      removeItem: async (key: string) => window.localStorage.removeItem(key),
    };
  }
  // Native
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  return require('@react-native-async-storage/async-storage').default;
}

export class SyncQueueService {
  private static instance: SyncQueueService;

  static getInstance(): SyncQueueService {
    if (!SyncQueueService.instance) {
      SyncQueueService.instance = new SyncQueueService();
    }
    return SyncQueueService.instance;
  }

  async getQueue(): Promise<SyncQueueItem[]> {
    try {
      const storage = getStorage();
      const raw = await storage.getItem(SYNC_STORAGE_KEY);
      if (!raw) return [];
      return JSON.parse(raw) as SyncQueueItem[];
    } catch {
      return [];
    }
  }

  async saveQueue(queue: SyncQueueItem[]): Promise<void> {
    const storage = getStorage();
    await storage.setItem(SYNC_STORAGE_KEY, JSON.stringify(queue));
  }

  async enqueue(payload: NewVehicleForm, idempotency_key: string): Promise<SyncQueueItem> {
    const item: SyncQueueItem = {
      id: idempotency_key,
      idempotency_key,
      payload,
      created_at: new Date().toISOString(),
      retry_count: 0,
      status: 'pending',
    };
    const queue = await this.getQueue();
    const alreadyQueued = queue.some((q) => q.idempotency_key === idempotency_key);
    if (!alreadyQueued) {
      queue.push(item);
      await this.saveQueue(queue);
    }
    return item;
  }

  async remove(idempotency_key: string): Promise<void> {
    const queue = await this.getQueue();
    await this.saveQueue(queue.filter((q) => q.idempotency_key !== idempotency_key));
  }

  async markFailed(idempotency_key: string, error: string): Promise<void> {
    const queue = await this.getQueue();
    await this.saveQueue(
      queue.map((q) =>
        q.idempotency_key === idempotency_key
          ? { ...q, status: 'failed' as const, error, retry_count: q.retry_count + 1 }
          : q
      )
    );
  }

  async markSyncing(idempotency_key: string): Promise<void> {
    const queue = await this.getQueue();
    await this.saveQueue(
      queue.map((q) =>
        q.idempotency_key === idempotency_key
          ? { ...q, status: 'syncing' as const }
          : q
      )
    );
  }

  async processQueue(onProgress?: (synced: number, total: number) => void): Promise<number> {
    const queue = await this.getQueue();
    const pending = queue.filter(
      (q) => q.status === 'pending' || (q.status === 'failed' && q.retry_count < MAX_RETRY_COUNT)
    );
    let synced = 0;
    for (const item of pending) {
      try {
        await this.markSyncing(item.idempotency_key);
        await vehicleApi.createVehicle({ ...item.payload, idempotency_key: item.idempotency_key });
        await this.remove(item.idempotency_key);
        synced++;
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Unknown error';
        await this.markFailed(item.idempotency_key, msg);
      }
      onProgress?.(synced, pending.length);
    }
    return synced;
  }

  async clearAll(): Promise<void> {
    const storage = getStorage();
    await storage.removeItem(SYNC_STORAGE_KEY);
  }
}

export const syncQueueService = SyncQueueService.getInstance();