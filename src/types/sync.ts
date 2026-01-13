export type SyncStatus = 'idle' | 'syncing' | 'success' | 'error' | 'offline';

export interface SyncState {
  status: SyncStatus;
  lastSyncedAt: number | null;
  pendingChanges: number;
  error: string | null;
  isOnline: boolean;
}

export interface PendingChange {
  id: string;
  type: 'create' | 'update' | 'delete';
  collection: string;
  documentId: string;
  data: Record<string, unknown>;
  timestamp: number;
  retryCount: number;
}

export interface SyncConflict {
  id: string;
  localData: Record<string, unknown>;
  remoteData: Record<string, unknown>;
  collection: string;
  documentId: string;
  resolvedAt?: number;
  resolution?: 'local' | 'remote' | 'merged';
}

export type ConflictResolution = 'last-write-wins' | 'local-first' | 'remote-first' | 'manual';
