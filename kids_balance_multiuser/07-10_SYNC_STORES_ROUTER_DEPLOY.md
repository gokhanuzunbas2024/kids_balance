# Part 7-10: Sync Service, Stores, Router & Deployment

Complete implementation for offline sync, state management, routing, and deployment.

---

## Part 7: Sync Service & Offline Support

### `src/db/schema.ts` - Local Database

```typescript
import Dexie, { Table } from 'dexie';

interface LocalUser {
  id: string;
  email: string | null;
  displayName: string;
  avatarUrl: string | null;
  role: 'parent' | 'child';
  familyId: string;
  settings: any;
  _synced: boolean;
  _lastModified: number;
}

interface LocalActivity {
  id: string;
  familyId: string;
  name: string;
  category: string;
  coefficient: number;
  icon: string;
  color: string;
  isActive: boolean;
  _synced: boolean;
  _lastModified: number;
}

interface LocalActivityLog {
  id: string;
  activityId: string;
  userId: string;
  familyId: string;
  durationMinutes: number;
  qualityScore: number;
  loggedAt: number;
  activityName: string;
  activityCategory: string;
  activityIcon: string;
  activityColor: string;
  _synced: boolean;
  _lastModified: number;
}

interface PendingChange {
  id: string;
  type: 'create' | 'update' | 'delete';
  collection: string;
  documentId: string;
  data: any;
  timestamp: number;
  retryCount: number;
}

export class KidsBalanceDB extends Dexie {
  users!: Table<LocalUser>;
  activities!: Table<LocalActivity>;
  activityLogs!: Table<LocalActivityLog>;
  pendingChanges!: Table<PendingChange>;

  constructor() {
    super('KidsBalanceDB');
    
    this.version(1).stores({
      users: 'id, familyId, email, _synced',
      activities: 'id, familyId, category, isActive, _synced',
      activityLogs: 'id, userId, familyId, activityId, loggedAt, _synced',
      pendingChanges: 'id, collection, timestamp, retryCount',
    });
  }
}

export const localDb = new KidsBalanceDB();
```

### `src/services/syncService.ts` - Sync Engine

```typescript
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
```

### `src/hooks/useOnlineStatus.ts`

```typescript
import { useState, useEffect } from 'react';

export function useOnlineStatus(): boolean {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return isOnline;
}
```

---

## Part 8: Zustand Stores

### `src/stores/authStore.ts`

```typescript
import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { User, AuthError } from '@/types';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isInitialized: boolean;
  error: AuthError | null;
}

interface AuthActions {
  setUser: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
  setInitialized: (initialized: boolean) => void;
  setError: (error: AuthError | null) => void;
  clearError: () => void;
  reset: () => void;
}

const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
  isLoading: false,
  isInitialized: false,
  error: null,
};

export const useAuthStore = create<AuthState & AuthActions>()(
  devtools(
    persist(
      immer((set) => ({
        ...initialState,

        setUser: (user) =>
          set((state) => {
            state.user = user;
            state.isAuthenticated = !!user;
          }),

        setLoading: (loading) =>
          set((state) => {
            state.isLoading = loading;
          }),

        setInitialized: (initialized) =>
          set((state) => {
            state.isInitialized = initialized;
          }),

        setError: (error) =>
          set((state) => {
            state.error = error;
          }),

        clearError: () =>
          set((state) => {
            state.error = null;
          }),

        reset: () => set(initialState),
      })),
      {
        name: 'auth-storage',
        partialize: (state) => ({
          user: state.user,
          isAuthenticated: state.isAuthenticated,
        }),
      }
    ),
    { name: 'AuthStore' }
  )
);
```

### `src/stores/activityStore.ts`

```typescript
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { v4 as uuidv4 } from 'uuid';
import { Activity, CreateActivityDTO, UpdateActivityDTO, ActivityCategory } from '@/types';
import { FirebaseActivityRepository } from '@/repositories/firebase/ActivityRepository';
import { syncService } from '@/services/syncService';
import { COLLECTIONS } from '@/config/firebase';
import { localDb } from '@/db/schema';

interface ActivityState {
  activities: Activity[];
  isLoading: boolean;
  error: string | null;
  selectedCategory: ActivityCategory | 'all';
}

interface ActivityActions {
  fetchActivities: (familyId: string) => Promise<void>;
  createActivity: (data: CreateActivityDTO) => Promise<Activity>;
  updateActivity: (id: string, data: UpdateActivityDTO) => Promise<void>;
  deleteActivity: (id: string) => Promise<void>;
  setSelectedCategory: (category: ActivityCategory | 'all') => void;
  getActiveActivities: () => Activity[];
  getByCategory: (category: ActivityCategory) => Activity[];
}

const repository = new FirebaseActivityRepository();

export const useActivityStore = create<ActivityState & ActivityActions>()(
  devtools(
    immer((set, get) => ({
      activities: [],
      isLoading: false,
      error: null,
      selectedCategory: 'all',

      fetchActivities: async (familyId) => {
        set((state) => {
          state.isLoading = true;
          state.error = null;
        });

        try {
          // Try to get from local first
          const localActivities = await localDb.activities
            .where('familyId')
            .equals(familyId)
            .toArray();

          if (localActivities.length > 0) {
            set((state) => {
              state.activities = localActivities as any;
            });
          }

          // Then fetch from remote
          const activities = await repository.getByFamilyId(familyId);
          
          set((state) => {
            state.activities = activities;
            state.isLoading = false;
          });

          // Update local cache
          for (const activity of activities) {
            await localDb.activities.put({
              ...activity,
              _synced: true,
              _lastModified: Date.now(),
            } as any);
          }
        } catch (error) {
          set((state) => {
            state.error = (error as Error).message;
            state.isLoading = false;
          });
        }
      },

      createActivity: async (data) => {
        const id = uuidv4();
        
        // Optimistic update
        const optimisticActivity: Activity = {
          id,
          ...data,
          isDefault: false,
          isActive: true,
          createdAt: new Date() as any,
          updatedAt: new Date() as any,
        };

        set((state) => {
          state.activities.push(optimisticActivity);
        });

        try {
          // Queue for sync
          await syncService.queueChange('create', COLLECTIONS.ACTIVITIES, id, data);
          
          return optimisticActivity;
        } catch (error) {
          // Rollback
          set((state) => {
            state.activities = state.activities.filter((a) => a.id !== id);
          });
          throw error;
        }
      },

      updateActivity: async (id, data) => {
        // Store previous state for rollback
        const previous = get().activities.find((a) => a.id === id);
        
        // Optimistic update
        set((state) => {
          const index = state.activities.findIndex((a) => a.id === id);
          if (index !== -1) {
            state.activities[index] = { ...state.activities[index], ...data };
          }
        });

        try {
          await syncService.queueChange('update', COLLECTIONS.ACTIVITIES, id, data);
        } catch (error) {
          // Rollback
          if (previous) {
            set((state) => {
              const index = state.activities.findIndex((a) => a.id === id);
              if (index !== -1) {
                state.activities[index] = previous;
              }
            });
          }
          throw error;
        }
      },

      deleteActivity: async (id) => {
        const previous = get().activities.find((a) => a.id === id);
        
        set((state) => {
          state.activities = state.activities.filter((a) => a.id !== id);
        });

        try {
          await syncService.queueChange('delete', COLLECTIONS.ACTIVITIES, id, {});
        } catch (error) {
          if (previous) {
            set((state) => {
              state.activities.push(previous);
            });
          }
          throw error;
        }
      },

      setSelectedCategory: (category) =>
        set((state) => {
          state.selectedCategory = category;
        }),

      getActiveActivities: () => {
        return get().activities.filter((a) => a.isActive);
      },

      getByCategory: (category) => {
        return get().activities.filter(
          (a) => a.isActive && a.category === category
        );
      },
    })),
    { name: 'ActivityStore' }
  )
);
```

### `src/stores/syncStore.ts`

```typescript
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
```

---

## Part 9: App Router & Main Entry

### `src/App.tsx`

```typescript
import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';

// Providers
import { AuthProvider } from '@/contexts/AuthContext';

// Pages
import { LoginPage } from '@/pages/LoginPage';
import { RegisterPage } from '@/pages/RegisterPage';
import { ChildLoginPage } from '@/pages/ChildLoginPage';
import { ForgotPasswordPage } from '@/pages/ForgotPasswordPage';
import { DashboardPage } from '@/pages/DashboardPage';
import { LogActivityPage } from '@/pages/LogActivityPage';
import { ParentDashboardPage } from '@/pages/ParentDashboardPage';
import { SettingsPage } from '@/pages/SettingsPage';
import { NotFoundPage } from '@/pages/NotFoundPage';

// Components
import { ProtectedRoute, ParentRoute } from '@/components/Auth/ProtectedRoute';

// Services
import { initializeFirebase } from '@/config/firebase';
import { useSyncStore } from '@/stores/syncStore';

// Initialize Firebase
initializeFirebase();

function AppContent() {
  const initializeSync = useSyncStore((state) => state.initialize);

  useEffect(() => {
    initializeSync();
  }, [initializeSync]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/child-login" element={<ChildLoginPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />

        {/* Protected Routes - Any authenticated user */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/log"
          element={
            <ProtectedRoute>
              <LogActivityPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/settings"
          element={
            <ProtectedRoute>
              <SettingsPage />
            </ProtectedRoute>
          }
        />

        {/* Parent-only Routes */}
        <Route
          path="/parent/*"
          element={
            <ParentRoute>
              <ParentDashboardPage />
            </ParentRoute>
          }
        />

        {/* Redirects */}
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        
        {/* 404 */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>

      {/* Global Toast */}
      <Toaster
        position="top-center"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#363636',
            color: '#fff',
            borderRadius: '12px',
          },
          success: {
            iconTheme: {
              primary: '#22c55e',
              secondary: '#fff',
            },
          },
          error: {
            iconTheme: {
              primary: '#ef4444',
              secondary: '#fff',
            },
          },
        }}
      />
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </BrowserRouter>
  );
}
```

### `src/main.tsx`

```typescript
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

// Register service worker for PWA
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js')
      .then((registration) => {
        console.log('SW registered:', registration);
      })
      .catch((error) => {
        console.log('SW registration failed:', error);
      });
  });
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
```

### `src/pages/LoginPage.tsx`

```typescript
import React from 'react';
import { Navigate } from 'react-router-dom';
import { LoginForm } from '@/components/Auth/LoginForm';
import { useAuth } from '@/contexts/AuthContext';

export function LoginPage() {
  const { isAuthenticated, isInitialized } = useAuth();

  if (isInitialized && isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-indigo-600 rounded-2xl mb-4">
            <span className="text-3xl">⚖️</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Kids Balance</h1>
        </div>
        
        <LoginForm />
      </div>
    </div>
  );
}
```

### `src/pages/DashboardPage.tsx`

```typescript
import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Plus, Settings, LogOut, Wifi, WifiOff } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useActivityStore } from '@/stores/activityStore';
import { useSyncStore } from '@/stores/syncStore';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';

export function DashboardPage() {
  const { user, logout, isParent } = useAuth();
  const { activities, fetchActivities } = useActivityStore();
  const { status, pendingChanges } = useSyncStore();
  const isOnline = useOnlineStatus();

  useEffect(() => {
    if (user?.familyId) {
      fetchActivities(user.familyId);
    }
  }, [user?.familyId, fetchActivities]);

  return (
    <div className="min-h-screen pb-24">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm sticky top-0 z-10 border-b border-gray-100">
        <div className="max-w-lg mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-xl">
              {user?.avatarUrl || '👋'}
            </div>
            <div>
              <h1 className="font-semibold text-gray-900">Hi, {user?.displayName}!</h1>
              <p className="text-xs text-gray-500">Let's balance your day</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {/* Sync Status */}
            <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-gray-100">
              {isOnline ? (
                <Wifi className="h-4 w-4 text-green-500" />
              ) : (
                <WifiOff className="h-4 w-4 text-gray-400" />
              )}
              {pendingChanges > 0 && (
                <span className="text-xs text-gray-600">{pendingChanges}</span>
              )}
            </div>
            
            {isParent && (
              <Link
                to="/parent"
                className="p-2 rounded-full hover:bg-gray-100"
              >
                <Settings className="h-5 w-5 text-gray-600" />
              </Link>
            )}
            
            <button
              onClick={logout}
              className="p-2 rounded-full hover:bg-gray-100"
            >
              <LogOut className="h-5 w-5 text-gray-600" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-lg mx-auto px-4 py-6">
        {/* Today's Summary Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6"
        >
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Today's Balance</h2>
          
          {/* Placeholder for balance visualization */}
          <div className="h-32 bg-gradient-to-r from-indigo-100 to-purple-100 rounded-xl flex items-center justify-center">
            <p className="text-gray-500">Balance chart will appear here</p>
          </div>
        </motion.div>

        {/* Recent Activities */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6"
        >
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Activities</h2>
          
          <div className="space-y-3">
            {/* Placeholder */}
            <p className="text-gray-500 text-center py-8">
              No activities logged today yet.<br />
              Tap the + button to add one!
            </p>
          </div>
        </motion.div>
      </main>

      {/* Floating Action Button */}
      <Link
        to="/log"
        className="fixed bottom-6 right-6 w-14 h-14 bg-indigo-600 rounded-full shadow-lg flex items-center justify-center text-white hover:bg-indigo-700 transition-colors"
      >
        <Plus className="h-6 w-6" />
      </Link>
    </div>
  );
}
```

---

## Part 10: Deployment Guide

### Firebase Deployment

```bash
# Install Firebase CLI
npm install -g firebase-tools

# Login to Firebase
firebase login

# Initialize (if not done)
firebase init

# Build the app
npm run build

# Deploy to Firebase Hosting
firebase deploy

# Deploy only specific services
firebase deploy --only hosting
firebase deploy --only firestore:rules
firebase deploy --only firestore:indexes
```

### Environment Setup for Production

```bash
# .env.production
VITE_FIREBASE_API_KEY=your_production_api_key
VITE_FIREBASE_AUTH_DOMAIN=kids-balance-prod.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=kids-balance-prod
VITE_FIREBASE_STORAGE_BUCKET=kids-balance-prod.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_FIREBASE_MEASUREMENT_ID=G-XXXXXXXXXX
VITE_ENABLE_ANALYTICS=true
VITE_ENABLE_OFFLINE_MODE=true
```

### Netlify Deployment Alternative

Update `netlify.toml`:

```toml
[build]
  publish = "dist"
  command = "npm run build"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200

[build.environment]
  NODE_VERSION = "18"

[[headers]]
  for = "/*"
  [headers.values]
    X-Frame-Options = "DENY"
    X-Content-Type-Options = "nosniff"
    X-XSS-Protection = "1; mode=block"
```

### CI/CD with GitHub Actions

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Firebase

on:
  push:
    branches: [main]

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Build
        run: npm run build
        env:
          VITE_FIREBASE_API_KEY: ${{ secrets.FIREBASE_API_KEY }}
          VITE_FIREBASE_AUTH_DOMAIN: ${{ secrets.FIREBASE_AUTH_DOMAIN }}
          VITE_FIREBASE_PROJECT_ID: ${{ secrets.FIREBASE_PROJECT_ID }}
          VITE_FIREBASE_STORAGE_BUCKET: ${{ secrets.FIREBASE_STORAGE_BUCKET }}
          VITE_FIREBASE_MESSAGING_SENDER_ID: ${{ secrets.FIREBASE_MESSAGING_SENDER_ID }}
          VITE_FIREBASE_APP_ID: ${{ secrets.FIREBASE_APP_ID }}
      
      - name: Deploy to Firebase
        uses: FirebaseExtended/action-hosting-deploy@v0
        with:
          repoToken: '${{ secrets.GITHUB_TOKEN }}'
          firebaseServiceAccount: '${{ secrets.FIREBASE_SERVICE_ACCOUNT }}'
          channelId: live
          projectId: ${{ secrets.FIREBASE_PROJECT_ID }}
```

---

## Troubleshooting Common Login Issues

| Issue | Cause | Solution |
|-------|-------|----------|
| "User not found" after registration | User doc not created | Check Firestore rules, ensure user doc is created after Firebase Auth |
| PIN login fails | PIN hash mismatch | Verify salt is stored correctly, use same hashing algorithm |
| Session expires too quickly | Token refresh not working | Implement token refresh, check persistence settings |
| Offline login fails | No cached session | Store encrypted session in localStorage |
| "Permission denied" | Firestore rules too strict | Check rules match user's familyId |
| Concurrent login issues | Race condition in auth state | Use single source of truth, debounce auth changes |

---

## Summary

This implementation provides:

1. **Multi-user authentication** with parent (email/password) and child (PIN) login
2. **Family-based data isolation** with proper Firestore security rules
3. **Offline-first architecture** with Dexie local storage and background sync
4. **Optimistic updates** for instant UI feedback
5. **Type-safe development** with TypeScript and Zod validation
6. **Scalable state management** with Zustand stores
7. **Production-ready deployment** with Firebase Hosting

The architecture follows best practices from apps like Notion, Todoist, and Duolingo for handling large numbers of users with offline support.
