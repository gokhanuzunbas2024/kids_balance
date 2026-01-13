import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { SyncStatus } from '@/types';
import { syncService } from '@/services/syncService';

interface SyncState {
  status: SyncStatus;
  pendingChanges: number;
  lastSyncedAt: number | null;
  error: string | null;
}

interface SyncActions {
  initialize: () => void;
  triggerSync: () => Promise<void>;
  setStatus: (status: SyncStatus, pending: number) => void;
}

export const useSyncStore = create<SyncState & SyncActions>()(
  devtools(
    (set) => ({
      status: 'idle',
      pendingChanges: 0,
      lastSyncedAt: null,
      error: null,

      initialize: () => {
        syncService.onStatusChange((status, pending) => {
          set({
            status,
            pendingChanges: pending,
            lastSyncedAt: status === 'success' ? Date.now() : null,
            error: status === 'error' ? 'Sync failed' : null,
          });
        });
      },

      triggerSync: async () => {
        await syncService.syncPendingChanges();
      },

      setStatus: (status, pending) =>
        set({
          status,
          pendingChanges: pending,
        }),
    }),
    { name: 'SyncStore' }
  )
);
