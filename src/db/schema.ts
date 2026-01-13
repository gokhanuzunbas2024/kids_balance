import Dexie, { Table } from 'dexie';
import { Activity, ActivityLog, DailyStats, WeeklyStats, EarnedBadge, UserSettings } from '@/types';
import { PendingChange } from '@/types';

// Local database interfaces for offline sync
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

// Legacy database (kept for backward compatibility)
export class ActivityTrackerDB extends Dexie {
  activities!: Table<Activity, string>;
  activityLogs!: Table<ActivityLog, string>;
  settings!: Table<UserSettings, number>;
  dailyStats!: Table<DailyStats, string>;
  weeklyStats!: Table<WeeklyStats, string>;
  earnedBadges!: Table<EarnedBadge, string>;

  constructor() {
    super('ActivityTrackerDB');
    
    this.version(1).stores({
      activities: 'id, name, category, isPreset, isArchived, isFavorite',
      activityLogs: 'id, activityId, activityDate, loggedAt, activityCategory',
      settings: '++id',
      dailyStats: 'date, calculatedAt',
      weeklyStats: 'weekStartDate, calculatedAt',
      earnedBadges: 'badgeId, date, earnedAt'
    });
  }
}

// New local database for offline sync
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

export const db = new ActivityTrackerDB();
export const localDb = new KidsBalanceDB();

// Note: Database will be opened explicitly in App.tsx
// Don't auto-open here to avoid migration issues during module load
