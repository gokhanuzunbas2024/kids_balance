import { v4 as uuidv4 } from 'uuid';
import { 
  collection, 
  doc, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  getDocs, 
  query, 
  where,
  orderBy,
  Timestamp,
  serverTimestamp,
  onSnapshot,
  Unsubscribe
} from 'firebase/firestore';
import { getFirebaseDb, COLLECTIONS } from '@/config/firebase';
import { localDb } from '@/db/schema';
import { SYNC_CONFIG } from '@/config/constants';
import { PendingChange, SyncStatus } from '@/types';

type SyncCallback = (status: SyncStatus, pendingCount: number) => void;

class SyncService {
  private db = getFirebaseDb();
  private isOnline = navigator.onLine;
  private syncInProgress = false;
  private listeners: Unsubscribe[] = [];
  private statusCallback: SyncCallback | null = null;

  constructor() {
    // Listen for online/offline events
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.syncPendingChanges();
    });
    
    window.addEventListener('offline', () => {
      this.isOnline = false;
      this.notifyStatus('offline', 0);
    });
  }

  // Set callback for status updates
  onStatusChange(callback: SyncCallback): () => void {
    this.statusCallback = callback;
    return () => {
      this.statusCallback = null;
    };
  }

  private notifyStatus(status: SyncStatus, pendingCount: number) {
    if (this.statusCallback) {
      this.statusCallback(status, pendingCount);
    }
  }

  // Queue a change for sync
  async queueChange(
    type: 'create' | 'update' | 'delete',
    collectionName: string,
    documentId: string,
    data: any
  ): Promise<void> {
    const change: PendingChange = {
      id: uuidv4(),
      type,
      collection: collectionName,
      documentId,
      data,
      timestamp: Date.now(),
      retryCount: 0,
    };

    await localDb.pendingChanges.add(change);
    
    // Update local data immediately
    await this.applyLocalChange(change);
    
    // Try to sync if online
    if (this.isOnline) {
      this.syncPendingChanges();
    } else {
      const count = await localDb.pendingChanges.count();
      this.notifyStatus('offline', count);
    }
  }

  // Apply change to local database
  private async applyLocalChange(change: PendingChange): Promise<void> {
    const table = this.getLocalTable(change.collection);
    if (!table) return;

    switch (change.type) {
      case 'create':
      case 'update':
        await table.put({
          ...change.data,
          id: change.documentId,
          _synced: false,
          _lastModified: Date.now(),
        });
        break;
      case 'delete':
        await table.delete(change.documentId);
        break;
    }
  }

  private getLocalTable(collectionName: string) {
    switch (collectionName) {
      case COLLECTIONS.USERS:
        return localDb.users;
      case COLLECTIONS.ACTIVITIES:
        return localDb.activities;
      case COLLECTIONS.ACTIVITY_LOGS:
        return localDb.activityLogs;
      default:
        return null;
    }
  }

  // Sync all pending changes
  async syncPendingChanges(): Promise<void> {
    if (!this.isOnline || this.syncInProgress) return;

    this.syncInProgress = true;
    this.notifyStatus('syncing', 0);

    try {
      const changes = await localDb.pendingChanges
        .orderBy('timestamp')
        .toArray();

      if (changes.length === 0) {
        this.notifyStatus('success', 0);
        this.syncInProgress = false;
        return;
      }

      this.notifyStatus('syncing', changes.length);

      for (const change of changes) {
        try {
          await this.processChange(change);
          
          // Remove from queue on success
          await localDb.pendingChanges.delete(change.id);
          
          // Mark as synced in local db
          const table = this.getLocalTable(change.collection);
          if (table && change.type !== 'delete') {
            await table.update(change.documentId, { _synced: true });
          }
        } catch (error) {
          console.error('Sync error for change:', change.id, error);
          
          // Increment retry count
          const newRetryCount = change.retryCount + 1;
          
          if (newRetryCount >= SYNC_CONFIG.MAX_RETRIES) {
            // Move to failed (or keep in queue for manual retry)
            console.error('Max retries reached for change:', change.id);
          } else {
            await localDb.pendingChanges.update(change.id, {
              retryCount: newRetryCount,
            });
          }
        }
      }

      const remaining = await localDb.pendingChanges.count();
      this.notifyStatus(remaining > 0 ? 'error' : 'success', remaining);
    } catch (error) {
      console.error('Sync failed:', error);
      const count = await localDb.pendingChanges.count();
      this.notifyStatus('error', count);
    } finally {
      this.syncInProgress = false;
    }
  }

  // Process a single change
  private async processChange(change: PendingChange): Promise<void> {
    const docRef = doc(this.db, change.collection, change.documentId);

    switch (change.type) {
      case 'create':
        await setDoc(docRef, {
          ...change.data,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
        break;
      case 'update':
        await updateDoc(docRef, {
          ...change.data,
          updatedAt: serverTimestamp(),
        });
        break;
      case 'delete':
        await deleteDoc(docRef);
        break;
    }
  }

  // Start real-time listeners for a family
  startFamilySync(familyId: string): void {
    // Clear existing listeners
    this.stopSync();

    // Listen to activities
    const activitiesQuery = query(
      collection(this.db, COLLECTIONS.ACTIVITIES),
      where('familyId', '==', familyId)
    );
    
    this.listeners.push(
      onSnapshot(activitiesQuery, async (snapshot) => {
        for (const change of snapshot.docChanges()) {
          const data = { id: change.doc.id, ...change.doc.data() };
          
          if (change.type === 'removed') {
            await localDb.activities.delete(change.doc.id);
          } else {
            await localDb.activities.put({
              ...data,
              _synced: true,
              _lastModified: Date.now(),
            } as any);
          }
        }
      })
    );

    // Listen to activity logs
    const logsQuery = query(
      collection(this.db, COLLECTIONS.ACTIVITY_LOGS),
      where('familyId', '==', familyId),
      orderBy('loggedAt', 'desc')
    );
    
    this.listeners.push(
      onSnapshot(logsQuery, async (snapshot) => {
        for (const change of snapshot.docChanges()) {
          const docData = change.doc.data();
          const data = { 
            id: change.doc.id, 
            ...docData,
            loggedAt: docData.loggedAt?.toMillis?.() || Date.now(),
          };
          
          if (change.type === 'removed') {
            await localDb.activityLogs.delete(change.doc.id);
          } else {
            await localDb.activityLogs.put({
              ...data,
              _synced: true,
              _lastModified: Date.now(),
            } as any);
          }
        }
      })
    );
  }

  // Stop all listeners
  stopSync(): void {
    this.listeners.forEach((unsubscribe) => unsubscribe());
    this.listeners = [];
  }

  // Get pending changes count
  async getPendingCount(): Promise<number> {
    return localDb.pendingChanges.count();
  }

  // Clear all local data
  async clearLocalData(): Promise<void> {
    await localDb.users.clear();
    await localDb.activities.clear();
    await localDb.activityLogs.clear();
    await localDb.pendingChanges.clear();
  }
}

export const syncService = new SyncService();
