# Part 3: Firebase Configuration & Security

Complete Firebase setup with security rules following best practices.

---

## Firebase Project Setup

### Step 1: Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Click "Add project"
3. Name: "kids-balance-app"
4. Enable Google Analytics (optional)
5. Create project

### Step 2: Enable Services

1. **Authentication**:
   - Go to Authentication → Sign-in method
   - Enable Email/Password
   - Enable Google (optional)
   - Enable Anonymous (for initial load)

2. **Firestore Database**:
   - Go to Firestore Database → Create database
   - Start in production mode
   - Select region closest to your users

3. **Get Configuration**:
   - Go to Project Settings → General
   - Scroll to "Your apps" → Add web app
   - Copy the config object

---

## Firebase Configuration

### `src/config/firebase.ts`

```typescript
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
```

### `src/config/constants.ts`

```typescript
// App-wide constants

export const APP_CONFIG = {
  name: import.meta.env.VITE_APP_NAME || 'Kids Balance',
  version: import.meta.env.VITE_APP_VERSION || '2.0.0',
} as const;

// Authentication
export const AUTH_CONFIG = {
  SESSION_DURATION_MS: 7 * 24 * 60 * 60 * 1000, // 7 days
  PIN_LENGTH: 4,
  MIN_PASSWORD_LENGTH: 8,
  MAX_LOGIN_ATTEMPTS: 5,
  LOCKOUT_DURATION_MS: 15 * 60 * 1000, // 15 minutes
  INVITE_CODE_LENGTH: 8,
  INVITE_EXPIRY_DAYS: 7,
} as const;

// Activity scoring
export const SCORING_CONFIG = {
  MIN_COEFFICIENT: 0.5,
  MAX_COEFFICIENT: 5.0,
  DEFAULT_COEFFICIENT: 1.0,
  DAILY_GOAL_MINUTES: 120,
  MAX_ACTIVITY_DURATION: 480, // 8 hours
} as const;

// Balance thresholds
export const BALANCE_THRESHOLDS = {
  EXCELLENT: { minScore: 300, minCategories: 4 },
  GOOD: { minScore: 200, minCategories: 3 },
  FAIR: { minScore: 100, minCategories: 2 },
  NEEDS_WORK: { minScore: 0, minCategories: 1 },
} as const;

// Category definitions with display info
export const CATEGORY_INFO = {
  physical: { name: 'Physical', icon: '🏃', color: '#22c55e' },
  creative: { name: 'Creative', icon: '🎨', color: '#f59e0b' },
  educational: { name: 'Educational', icon: '📚', color: '#3b82f6' },
  social: { name: 'Social', icon: '👥', color: '#ec4899' },
  screen: { name: 'Screen Time', icon: '📱', color: '#64748b' },
  chores: { name: 'Chores', icon: '🧹', color: '#84cc16' },
  rest: { name: 'Rest', icon: '😴', color: '#a78bfa' },
  other: { name: 'Other', icon: '📌', color: '#6b7280' },
} as const;

// Sync configuration
export const SYNC_CONFIG = {
  DEBOUNCE_MS: 1000,
  RETRY_DELAYS: [1000, 2000, 5000, 10000, 30000],
  MAX_RETRIES: 5,
  BATCH_SIZE: 50,
} as const;

// UI constants
export const UI_CONFIG = {
  TOAST_DURATION: 4000,
  ANIMATION_DURATION: 300,
  DEBOUNCE_INPUT_MS: 300,
  PAGE_SIZE: 20,
} as const;

// Child-friendly avatars
export const AVATAR_OPTIONS = [
  '🦁', '🐯', '🐻', '🐼', '🐨', '🐸',
  '🐵', '🦊', '🐰', '🐶', '🐱', '🦄',
  '🐲', '🦋', '🐢', '🐬', '🦉', '🐝',
] as const;

// Duration quick-select options (in minutes)
export const DURATION_OPTIONS = [
  { label: '15 min', value: 15 },
  { label: '30 min', value: 30 },
  { label: '45 min', value: 45 },
  { label: '1 hour', value: 60 },
  { label: '1.5 hours', value: 90 },
  { label: '2 hours', value: 120 },
] as const;
```

---

## Firestore Security Rules

### `firebase/firestore.rules`

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // ============ Helper Functions ============
    
    // Check if user is authenticated
    function isAuthenticated() {
      return request.auth != null;
    }
    
    // Get the current user's document
    function getUserData() {
      return get(/databases/$(database)/documents/users/$(request.auth.uid)).data;
    }
    
    // Check if user is a parent in their family
    function isParent() {
      return isAuthenticated() && getUserData().role == 'parent';
    }
    
    // Check if user is a child in their family
    function isChild() {
      return isAuthenticated() && getUserData().role == 'child';
    }
    
    // Check if user belongs to a specific family
    function belongsToFamily(familyId) {
      return isAuthenticated() && getUserData().familyId == familyId;
    }
    
    // Check if user is the owner of the family
    function isFamilyOwner(familyId) {
      let family = get(/databases/$(database)/documents/families/$(familyId)).data;
      return isAuthenticated() && family.ownerId == request.auth.uid;
    }
    
    // Check if user is a parent in the specified family
    function isParentInFamily(familyId) {
      return belongsToFamily(familyId) && isParent();
    }
    
    // Validate timestamp is server time
    function isValidTimestamp(field) {
      return request.resource.data[field] == request.time;
    }
    
    // Check if only allowed fields are being updated
    function onlyUpdates(allowedFields) {
      return request.resource.data.diff(resource.data).affectedKeys().hasOnly(allowedFields);
    }
    
    // ============ Users Collection ============
    
    match /users/{userId} {
      // Users can read their own profile
      allow read: if isAuthenticated() && request.auth.uid == userId;
      
      // Users can read profiles of family members
      allow read: if isAuthenticated() && 
        resource.data.familyId == getUserData().familyId;
      
      // Users can create their own profile during registration
      allow create: if isAuthenticated() && 
        request.auth.uid == userId &&
        request.resource.data.keys().hasAll(['email', 'displayName', 'role', 'familyId', 'createdAt']) &&
        request.resource.data.role in ['parent', 'child'];
      
      // Users can update their own profile (limited fields)
      allow update: if isAuthenticated() && 
        request.auth.uid == userId &&
        onlyUpdates(['displayName', 'avatarUrl', 'settings', 'updatedAt', 'lastLoginAt']);
      
      // Parents can update child profiles in their family
      allow update: if isParent() &&
        resource.data.familyId == getUserData().familyId &&
        resource.data.role == 'child';
      
      // Only parents can delete child accounts in their family
      allow delete: if isParent() &&
        resource.data.familyId == getUserData().familyId &&
        resource.data.role == 'child';
    }
    
    // ============ Families Collection ============
    
    match /families/{familyId} {
      // Family members can read their family
      allow read: if belongsToFamily(familyId);
      
      // Anyone authenticated can create a family (becomes owner)
      allow create: if isAuthenticated() &&
        request.resource.data.ownerId == request.auth.uid &&
        request.resource.data.keys().hasAll(['name', 'ownerId', 'memberIds', 'inviteCode', 'createdAt']);
      
      // Only family owner or parents can update
      allow update: if isFamilyOwner(familyId) || isParentInFamily(familyId);
      
      // Only owner can delete family
      allow delete: if isFamilyOwner(familyId);
    }
    
    // ============ Activities Collection ============
    
    match /activities/{activityId} {
      // Family members can read activities
      allow read: if belongsToFamily(resource.data.familyId);
      
      // Parents can create activities for their family
      allow create: if isParent() &&
        request.resource.data.familyId == getUserData().familyId &&
        request.resource.data.createdBy == request.auth.uid;
      
      // Parents can update activities in their family
      allow update: if isParentInFamily(resource.data.familyId);
      
      // Parents can delete non-default activities in their family
      allow delete: if isParentInFamily(resource.data.familyId) &&
        resource.data.isDefault == false;
    }
    
    // ============ Activity Logs Collection ============
    
    match /activityLogs/{logId} {
      // Users can read their own logs
      allow read: if isAuthenticated() && 
        resource.data.userId == request.auth.uid;
      
      // Parents can read all logs in their family
      allow read: if isParentInFamily(resource.data.familyId);
      
      // Users can create logs for themselves
      allow create: if isAuthenticated() &&
        request.resource.data.userId == request.auth.uid &&
        request.resource.data.familyId == getUserData().familyId &&
        request.resource.data.keys().hasAll(['activityId', 'userId', 'familyId', 'durationMinutes', 'createdAt']);
      
      // Users can update their own logs (within 24 hours)
      allow update: if isAuthenticated() &&
        resource.data.userId == request.auth.uid &&
        resource.data.createdAt > (request.time - duration.value(24, 'h'));
      
      // Parents can update any log in their family
      allow update: if isParentInFamily(resource.data.familyId);
      
      // Users can delete their own logs (within 1 hour)
      allow delete: if isAuthenticated() &&
        resource.data.userId == request.auth.uid &&
        resource.data.createdAt > (request.time - duration.value(1, 'h'));
      
      // Parents can delete any log in their family
      allow delete: if isParentInFamily(resource.data.familyId);
    }
    
    // ============ Daily Summaries Collection ============
    
    match /dailySummaries/{summaryId} {
      // Users can read their own summaries
      allow read: if isAuthenticated() &&
        resource.data.userId == request.auth.uid;
      
      // Parents can read all summaries in their family
      allow read: if isParentInFamily(resource.data.familyId);
      
      // System-generated only (via Cloud Functions)
      // Or allow users to create/update their own
      allow create, update: if isAuthenticated() &&
        request.resource.data.userId == request.auth.uid &&
        request.resource.data.familyId == getUserData().familyId;
      
      // No deletion allowed
      allow delete: if false;
    }
    
    // ============ Invites Collection ============
    
    match /invites/{inviteId} {
      // Anyone can read an invite by ID (for joining)
      allow read: if isAuthenticated();
      
      // Parents can create invites for their family
      allow create: if isParent() &&
        request.resource.data.familyId == getUserData().familyId &&
        request.resource.data.createdBy == request.auth.uid;
      
      // Update status when accepting
      allow update: if isAuthenticated() &&
        resource.data.email == request.auth.token.email &&
        resource.data.status == 'pending' &&
        request.resource.data.status == 'accepted';
      
      // Parents can delete pending invites in their family
      allow delete: if isParentInFamily(resource.data.familyId) &&
        resource.data.status == 'pending';
    }
    
    // ============ Sessions Collection (for child PIN auth) ============
    
    match /sessions/{sessionId} {
      // Users can read their own sessions
      allow read: if isAuthenticated() &&
        resource.data.userId == request.auth.uid;
      
      // Anyone can create a session (for PIN login)
      allow create: if true;
      
      // Users can delete their own sessions (logout)
      allow delete: if isAuthenticated() &&
        resource.data.userId == request.auth.uid;
    }
  }
}
```

---

## Firestore Indexes

### `firebase/firestore.indexes.json`

```json
{
  "indexes": [
    {
      "collectionGroup": "activityLogs",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "userId", "order": "ASCENDING" },
        { "fieldPath": "loggedAt", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "activityLogs",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "familyId", "order": "ASCENDING" },
        { "fieldPath": "loggedAt", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "activityLogs",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "userId", "order": "ASCENDING" },
        { "fieldPath": "activityCategory", "order": "ASCENDING" },
        { "fieldPath": "loggedAt", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "dailySummaries",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "userId", "order": "ASCENDING" },
        { "fieldPath": "date", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "dailySummaries",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "familyId", "order": "ASCENDING" },
        { "fieldPath": "date", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "activities",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "familyId", "order": "ASCENDING" },
        { "fieldPath": "isActive", "order": "ASCENDING" },
        { "fieldPath": "category", "order": "ASCENDING" }
      ]
    },
    {
      "collectionGroup": "users",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "familyId", "order": "ASCENDING" },
        { "fieldPath": "role", "order": "ASCENDING" }
      ]
    },
    {
      "collectionGroup": "invites",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "familyId", "order": "ASCENDING" },
        { "fieldPath": "status", "order": "ASCENDING" },
        { "fieldPath": "expiresAt", "order": "ASCENDING" }
      ]
    }
  ],
  "fieldOverrides": [
    {
      "collectionGroup": "activityLogs",
      "fieldPath": "loggedAt",
      "indexes": [
        { "order": "DESCENDING", "queryScope": "COLLECTION" },
        { "order": "DESCENDING", "queryScope": "COLLECTION_GROUP" }
      ]
    }
  ]
}
```

---

## Firebase Project Configuration

### `firebase/firebase.json`

```json
{
  "firestore": {
    "rules": "firestore.rules",
    "indexes": "firestore.indexes.json"
  },
  "hosting": {
    "public": "dist",
    "ignore": ["firebase.json", "**/.*", "**/node_modules/**"],
    "rewrites": [
      {
        "source": "**",
        "destination": "/index.html"
      }
    ],
    "headers": [
      {
        "source": "**/*.@(js|css|woff2)",
        "headers": [
          {
            "key": "Cache-Control",
            "value": "public, max-age=31536000, immutable"
          }
        ]
      },
      {
        "source": "**",
        "headers": [
          {
            "key": "X-Content-Type-Options",
            "value": "nosniff"
          },
          {
            "key": "X-Frame-Options",
            "value": "DENY"
          },
          {
            "key": "X-XSS-Protection",
            "value": "1; mode=block"
          },
          {
            "key": "Referrer-Policy",
            "value": "strict-origin-when-cross-origin"
          }
        ]
      }
    ]
  },
  "emulators": {
    "auth": {
      "port": 9099
    },
    "firestore": {
      "port": 8080
    },
    "hosting": {
      "port": 5000
    },
    "ui": {
      "enabled": true,
      "port": 4000
    }
  }
}
```

---

## Firebase CLI Commands

```bash
# Install Firebase CLI
npm install -g firebase-tools

# Login to Firebase
firebase login

# Initialize project (if not done)
firebase init

# Deploy security rules only
firebase deploy --only firestore:rules

# Deploy indexes only
firebase deploy --only firestore:indexes

# Deploy everything
firebase deploy

# Start emulators for local development
firebase emulators:start

# Export emulator data (for testing)
firebase emulators:export ./emulator-data
```

---

## Next Steps

Continue to Part 4 for Authentication Service implementation.
