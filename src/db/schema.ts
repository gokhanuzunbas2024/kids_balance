import Dexie, { Table } from 'dexie';
import { Activity, ActivityLog, DailyStats, WeeklyStats, EarnedBadge, UserSettings } from '@/types';

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

export const db = new ActivityTrackerDB();

// Note: Database will be opened explicitly in App.tsx
// Don't auto-open here to avoid migration issues during module load
