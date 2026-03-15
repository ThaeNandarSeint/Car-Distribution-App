import { create } from 'zustand';
import { Vehicle, SyncQueueItem, FilterOptions } from '../types';
import { vehicleApi } from '../services/api';
import { syncQueueService } from '../services/syncQueue';

interface VehicleStore {
  vehicles: Vehicle[];
  filteredVehicles: Vehicle[];
  isLoading: boolean;
  error: string | null;
  lastFetched: string | null;
  filters: FilterOptions;
  syncQueue: SyncQueueItem[];
  isSyncing: boolean;
  lastSyncedAt: string | null;
  isOnline: boolean;
  fetchVehicles: () => Promise<void>;
  applyFilters: (filters: FilterOptions) => void;
  addVehicleLocally: (vehicle: Vehicle) => void;
  setOnline: (online: boolean) => void;
  loadSyncQueue: () => Promise<void>;
  syncQueue_process: () => Promise<number>;
  clearError: () => void;
}

function applyFilterLogic(vehicles: Vehicle[], filters: FilterOptions): Vehicle[] {
  let result = [...vehicles];
  if (filters.search?.trim()) {
    const q = filters.search.toLowerCase();
    result = result.filter(
      (v) =>
        v.vin?.toLowerCase().includes(q) ||
        v.make?.toLowerCase().includes(q) ||
        v.model?.toLowerCase().includes(q) ||
        v.lot_number?.toLowerCase().includes(q) ||
        v.color?.toLowerCase().includes(q)
    );
  }
  if (filters.status && filters.status !== 'all') {
    result = result.filter((v) => v.status === filters.status);
  }
  if (filters.make && filters.make !== 'all') {
    result = result.filter((v) => v.make === filters.make);
  }
  if (filters.year) {
    result = result.filter((v) => v.year === filters.year);
  }
  return result;
}

export const useVehicleStore = create<VehicleStore>((set, get) => ({
  vehicles: [],
  filteredVehicles: [],
  isLoading: false,
  error: null,
  lastFetched: null,
  filters: { status: 'all' },
  syncQueue: [],
  isSyncing: false,
  lastSyncedAt: null,
  isOnline: true,

  fetchVehicles: async () => {
    set({ isLoading: true, error: null });
    try {
      const allVehicles: Vehicle[] = [];
      let page = 1;
      const limit = 100;
      while (true) {
        const batch = await vehicleApi.getVehicles(page, limit);
        if (!batch || batch.length === 0) break;
        allVehicles.push(...batch);
        if (batch.length < limit) break;
        page++;
      }
      const { filters } = get();
      set({
        vehicles: allVehicles,
        filteredVehicles: applyFilterLogic(allVehicles, filters),
        isLoading: false,
        lastFetched: new Date().toISOString(),
      });
    } catch (err) {
      set({ isLoading: false, error: err instanceof Error ? err.message : 'Failed to fetch vehicles' });
    }
  },

  applyFilters: (filters: FilterOptions) => {
    const { vehicles } = get();
    set({ filters, filteredVehicles: applyFilterLogic(vehicles, filters) });
  },

  addVehicleLocally: (vehicle: Vehicle) => {
    const { vehicles, filters } = get();
    const updated = [vehicle, ...vehicles];
    set({ vehicles: updated, filteredVehicles: applyFilterLogic(updated, filters) });
  },

  setOnline: (online: boolean) => set({ isOnline: online }),

  loadSyncQueue: async () => {
    const queue = await syncQueueService.getQueue();
    set({ syncQueue: queue });
  },

  syncQueue_process: async () => {
    if (!get().isOnline) return 0;
    set({ isSyncing: true });
    try {
      const synced = await syncQueueService.processQueue();
      const updatedQueue = await syncQueueService.getQueue();
      set({ syncQueue: updatedQueue, isSyncing: false, lastSyncedAt: new Date().toISOString() });
      if (synced > 0) get().fetchVehicles();
      return synced;
    } catch {
      set({ isSyncing: false });
      return 0;
    }
  },

  clearError: () => set({ error: null }),
}));
