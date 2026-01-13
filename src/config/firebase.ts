import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { 
  getAuth, 
  connectAuthEmulator, 
  Auth,
  browserLocalPersistence,
  browserSessionPersistence,
  setPersistence
} from 'firebase/auth';
import { 
  getFirestore, 
  connectFirestoreEmulator,
  Firestore,
  enableIndexedDbPersistence,
  CACHE_SIZE_UNLIMITED
} from 'firebase/firestore';
import { getAnalytics, Analytics, isSupported } from 'firebase/analytics';

// Firebase configuration from environment variables
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

// Validate configuration
function validateConfig(): void {
  const requiredFields = ['apiKey', 'authDomain', 'projectId'] as const;
  const missing = requiredFields.filter(field => !firebaseConfig[field]);
  
  if (missing.length > 0) {
    throw new Error(`Missing Firebase configuration: ${missing.join(', ')}`);
  }
}

// Singleton instances
let app: FirebaseApp;
let auth: Auth;
let db: Firestore;
let analytics: Analytics | null = null;

// Initialize Firebase
export function initializeFirebase(): { app: FirebaseApp; auth: Auth; db: Firestore } {
  validateConfig();
  
  // Only initialize if not already done
  if (getApps().length === 0) {
    app = initializeApp(firebaseConfig);
    
    // Initialize Auth
    auth = getAuth(app);
    
    // Initialize Firestore with settings
    db = getFirestore(app);
    
    // Enable offline persistence
    if (import.meta.env.VITE_ENABLE_OFFLINE_MODE === 'true') {
      enableIndexedDbPersistence(db, {
        cacheSizeBytes: CACHE_SIZE_UNLIMITED
      }).catch((err) => {
        if (err.code === 'failed-precondition') {
          // Multiple tabs open, persistence can only be enabled in one tab
          console.warn('Firestore persistence failed: Multiple tabs open');
        } else if (err.code === 'unimplemented') {
          // Browser doesn't support persistence
          console.warn('Firestore persistence not supported');
        }
      });
    }
    
    // Connect to emulators in development
    if (import.meta.env.DEV && import.meta.env.VITE_USE_EMULATORS === 'true') {
      connectAuthEmulator(auth, 'http://localhost:9099');
      connectFirestoreEmulator(db, 'localhost', 8080);
      console.log('Connected to Firebase emulators');
    }
    
    // Initialize Analytics (only in production)
    if (import.meta.env.PROD && import.meta.env.VITE_ENABLE_ANALYTICS === 'true') {
      isSupported().then((supported) => {
        if (supported) {
          analytics = getAnalytics(app);
        }
      });
    }
  } else {
    app = getApps()[0];
    auth = getAuth(app);
    db = getFirestore(app);
  }
  
  return { app, auth, db };
}

// Getter functions for Firebase instances
export function getFirebaseApp(): FirebaseApp {
  if (!app) initializeFirebase();
  return app;
}

export function getFirebaseAuth(): Auth {
  if (!auth) initializeFirebase();
  return auth;
}

export function getFirebaseDb(): Firestore {
  if (!db) initializeFirebase();
  return db;
}

export function getFirebaseAnalytics(): Analytics | null {
  return analytics;
}

// Auth persistence helper
export async function setAuthPersistence(rememberMe: boolean): Promise<void> {
  const auth = getFirebaseAuth();
  await setPersistence(
    auth, 
    rememberMe ? browserLocalPersistence : browserSessionPersistence
  );
}

// Collection references (typed)
export const COLLECTIONS = {
  USERS: 'users',
  FAMILIES: 'families',
  ACTIVITIES: 'activities',
  ACTIVITY_LOGS: 'activityLogs',
  DAILY_SUMMARIES: 'dailySummaries',
  INVITES: 'invites',
  SESSIONS: 'sessions',
} as const;

export type CollectionName = typeof COLLECTIONS[keyof typeof COLLECTIONS];
