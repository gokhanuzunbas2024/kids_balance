# Kids Balance App - Multi-User Implementation Guide

## Part 1: Project Structure & Configuration

This guide transforms the Kids Balance App from a single-user IndexedDB-based PWA to a full multi-user application with Firebase backend.

---

## New Project Structure

```
kids_balance/
├── src/
│   ├── components/
│   │   ├── ActivityLogger/
│   │   │   ├── ActivityCard.tsx
│   │   │   ├── ActivityGrid.tsx
│   │   │   ├── DurationPicker.tsx
│   │   │   └── index.tsx
│   │   ├── Dashboard/
│   │   │   ├── BalanceChart.tsx
│   │   │   ├── DailySummary.tsx
│   │   │   ├── WeeklyOverview.tsx
│   │   │   └── index.tsx
│   │   ├── Parent/
│   │   │   ├── ActivityManager.tsx
│   │   │   ├── ChildManager.tsx
│   │   │   ├── FamilySettings.tsx
│   │   │   ├── StatsOverview.tsx
│   │   │   └── index.tsx
│   │   ├── Auth/                    # NEW
│   │   │   ├── LoginForm.tsx
│   │   │   ├── RegisterForm.tsx
│   │   │   ├── ChildLogin.tsx
│   │   │   ├── PinPad.tsx
│   │   │   ├── ForgotPassword.tsx
│   │   │   ├── ProtectedRoute.tsx
│   │   │   └── index.tsx
│   │   └── shared/
│   │       ├── Avatar.tsx
│   │       ├── Button.tsx
│   │       ├── Card.tsx
│   │       ├── LoadingSpinner.tsx
│   │       ├── Modal.tsx
│   │       ├── Toast.tsx
│   │       └── index.tsx
│   │
│   ├── config/                       # NEW
│   │   ├── firebase.ts
│   │   └── constants.ts
│   │
│   ├── contexts/                     # NEW
│   │   ├── AuthContext.tsx
│   │   └── FamilyContext.tsx
│   │
│   ├── db/
│   │   ├── index.ts                  # Keep for offline cache
│   │   ├── schema.ts
│   │   └── seedData.ts
│   │
│   ├── hooks/                        # NEW
│   │   ├── useAuth.ts
│   │   ├── useFamily.ts
│   │   ├── useActivities.ts
│   │   ├── useActivityLogs.ts
│   │   ├── useOfflineSync.ts
│   │   └── useOnlineStatus.ts
│   │
│   ├── repositories/                 # NEW - Data access layer
│   │   ├── interfaces/
│   │   │   ├── IUserRepository.ts
│   │   │   ├── IFamilyRepository.ts
│   │   │   ├── IActivityRepository.ts
│   │   │   └── IActivityLogRepository.ts
│   │   ├── firebase/
│   │   │   ├── UserRepository.ts
│   │   │   ├── FamilyRepository.ts
│   │   │   ├── ActivityRepository.ts
│   │   │   └── ActivityLogRepository.ts
│   │   ├── local/
│   │   │   ├── LocalUserRepository.ts
│   │   │   ├── LocalActivityRepository.ts
│   │   │   └── LocalActivityLogRepository.ts
│   │   └── SyncedRepository.ts
│   │
│   ├── services/                     # NEW
│   │   ├── authService.ts
│   │   ├── syncService.ts
│   │   ├── notificationService.ts
│   │   └── analyticsService.ts
│   │
│   ├── stores/                       # UPDATE existing
│   │   ├── authStore.ts              # NEW
│   │   ├── familyStore.ts            # NEW
│   │   ├── activityStore.ts          # UPDATE
│   │   ├── logStore.ts               # UPDATE
│   │   ├── syncStore.ts              # NEW
│   │   └── uiStore.ts
│   │
│   ├── types/                        # UPDATE
│   │   ├── activity.ts
│   │   ├── user.ts                   # NEW
│   │   ├── family.ts                 # NEW
│   │   ├── auth.ts                   # NEW
│   │   ├── sync.ts                   # NEW
│   │   └── index.ts
│   │
│   ├── utils/
│   │   ├── balanceCalculator.ts
│   │   ├── dateUtils.ts
│   │   ├── validation.ts             # NEW
│   │   ├── encryption.ts             # NEW
│   │   └── errorHandler.ts           # NEW
│   │
│   ├── pages/                        # NEW - Route pages
│   │   ├── LoginPage.tsx
│   │   ├── RegisterPage.tsx
│   │   ├── ChildLoginPage.tsx
│   │   ├── DashboardPage.tsx
│   │   ├── LogActivityPage.tsx
│   │   ├── ParentDashboardPage.tsx
│   │   ├── SettingsPage.tsx
│   │   └── NotFoundPage.tsx
│   │
│   ├── App.tsx                       # UPDATE with routing
│   ├── main.tsx
│   └── index.css
│
├── public/
│   ├── manifest.json
│   ├── sw.js                         # UPDATE for sync
│   └── icons/
│
├── firebase/                         # NEW - Firebase config
│   ├── firestore.rules
│   ├── firestore.indexes.json
│   └── firebase.json
│
├── .env.example                      # NEW
├── .env.local                        # NEW (gitignored)
├── package.json                      # UPDATE
└── vite.config.ts                    # UPDATE
```

---

## Package.json Updates

Add these new dependencies:

```json
{
  "name": "kids-balance-app",
  "version": "2.0.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "lint": "eslint . --ext ts,tsx --report-unused-disable-directives --max-warnings 0",
    "test": "vitest",
    "test:coverage": "vitest --coverage",
    "firebase:deploy": "firebase deploy",
    "firebase:emulators": "firebase emulators:start"
  },
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-router-dom": "^6.20.0",
    
    "firebase": "^10.7.0",
    "firebase-admin": "^11.11.0",
    
    "zustand": "^4.4.7",
    "immer": "^10.0.3",
    
    "dexie": "^3.2.4",
    "dexie-react-hooks": "^1.1.6",
    
    "recharts": "^2.10.3",
    "framer-motion": "^10.16.16",
    
    "zod": "^3.22.4",
    "date-fns": "^2.30.0",
    "uuid": "^9.0.1",
    "crypto-js": "^4.2.0",
    
    "@tanstack/react-query": "^5.13.4",
    
    "react-hot-toast": "^2.4.1",
    "lucide-react": "^0.294.0"
  },
  "devDependencies": {
    "@types/react": "^18.2.43",
    "@types/react-dom": "^18.2.17",
    "@types/uuid": "^9.0.7",
    "@types/crypto-js": "^4.2.1",
    
    "@typescript-eslint/eslint-plugin": "^6.14.0",
    "@typescript-eslint/parser": "^6.14.0",
    "eslint": "^8.55.0",
    "eslint-plugin-react-hooks": "^4.6.0",
    "eslint-plugin-react-refresh": "^0.4.5",
    
    "typescript": "^5.3.3",
    "vite": "^5.0.8",
    "vite-plugin-pwa": "^0.17.4",
    
    "vitest": "^1.1.0",
    "@vitest/coverage-v8": "^1.1.0",
    
    "tailwindcss": "^3.3.6",
    "postcss": "^8.4.32",
    "autoprefixer": "^10.4.16"
  }
}
```

---

## Environment Configuration

### `.env.example`

```bash
# Firebase Configuration
VITE_FIREBASE_API_KEY=your_api_key_here
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_FIREBASE_MEASUREMENT_ID=G-XXXXXXXXXX

# App Configuration
VITE_APP_NAME="Kids Balance"
VITE_APP_VERSION=2.0.0
VITE_ENABLE_ANALYTICS=true
VITE_ENABLE_OFFLINE_MODE=true

# Feature Flags
VITE_FEATURE_PARENT_CONTROLS=true
VITE_FEATURE_ACHIEVEMENTS=true
VITE_FEATURE_DARK_MODE=true
```

### `.env.local` (create locally, gitignored)

```bash
# Copy from .env.example and fill in real values
VITE_FIREBASE_API_KEY=AIzaSy...actual_key
# ... etc
```

---

## Vite Configuration Update

### `vite.config.ts`

```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import path from 'path';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'masked-icon.svg'],
      manifest: {
        name: 'Kids Balance App',
        short_name: 'Kids Balance',
        description: 'Track and balance your daily activities',
        theme_color: '#6366f1',
        background_color: '#ffffff',
        display: 'standalone',
        orientation: 'portrait',
        scope: '/',
        start_url: '/',
        icons: [
          {
            src: 'icons/icon-72x72.png',
            sizes: '72x72',
            type: 'image/png'
          },
          {
            src: 'icons/icon-96x96.png',
            sizes: '96x96',
            type: 'image/png'
          },
          {
            src: 'icons/icon-128x128.png',
            sizes: '128x128',
            type: 'image/png'
          },
          {
            src: 'icons/icon-144x144.png',
            sizes: '144x144',
            type: 'image/png'
          },
          {
            src: 'icons/icon-152x152.png',
            sizes: '152x152',
            type: 'image/png'
          },
          {
            src: 'icons/icon-192x192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any maskable'
          },
          {
            src: 'icons/icon-384x384.png',
            sizes: '384x384',
            type: 'image/png'
          },
          {
            src: 'icons/icon-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/firestore\.googleapis\.com\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'firebase-cache',
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 60 * 24 // 24 hours
              },
              networkTimeoutSeconds: 10
            }
          }
        ]
      }
    })
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@components': path.resolve(__dirname, './src/components'),
      '@hooks': path.resolve(__dirname, './src/hooks'),
      '@stores': path.resolve(__dirname, './src/stores'),
      '@services': path.resolve(__dirname, './src/services'),
      '@repositories': path.resolve(__dirname, './src/repositories'),
      '@types': path.resolve(__dirname, './src/types'),
      '@utils': path.resolve(__dirname, './src/utils'),
      '@config': path.resolve(__dirname, './src/config'),
      '@contexts': path.resolve(__dirname, './src/contexts'),
      '@pages': path.resolve(__dirname, './src/pages')
    }
  },
  build: {
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom'],
          firebase: ['firebase/app', 'firebase/auth', 'firebase/firestore'],
          charts: ['recharts'],
          animations: ['framer-motion']
        }
      }
    }
  },
  server: {
    port: 3000,
    host: true
  }
});
```

---

## TypeScript Configuration Update

### `tsconfig.json`

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,

    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",

    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,

    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"],
      "@components/*": ["src/components/*"],
      "@hooks/*": ["src/hooks/*"],
      "@stores/*": ["src/stores/*"],
      "@services/*": ["src/services/*"],
      "@repositories/*": ["src/repositories/*"],
      "@types/*": ["src/types/*"],
      "@utils/*": ["src/utils/*"],
      "@config/*": ["src/config/*"],
      "@contexts/*": ["src/contexts/*"],
      "@pages/*": ["src/pages/*"]
    }
  },
  "include": ["src"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
```

---

## Next Steps

Continue to Part 2 for Firebase setup and authentication implementation.
