import { ActivityCategory } from './activity.types';

export interface BalanceScore {
  diversityScore: number;              // 0-30 points
  qualityScore: number;                // 0-50 points
  varietyScore: number;                // 0-20 points
  totalScore: number;                  // 0-100 points
}

export interface DailyStats {
  date: string;                        // ISO date
  totalMinutes: number;
  categoryBreakdown: Record<ActivityCategory, number>;
  activitiesLogged: number;
  uniqueActivities: number;
  totalQualityPoints: number;
  averageQuality: number;
  balanceScore: BalanceScore;
  badgesEarned: string[];
  calculatedAt: Date;
}

export interface WeeklyStats {
  weekStartDate: string;                // ISO date (Monday)
  totalMinutes: number;
  averageDailyScore: number;
  daysActive: number;
  badgesEarned: string[];
  calculatedAt: Date;
}

export interface EarnedBadge {
  badgeId: string;
  date: string;
  earnedAt: Date;
}

export interface UserSettings {
  id?: number;
  childName?: string;
  dailyGoalMinutes?: number;
  enableNotifications?: boolean;
  theme?: 'light' | 'dark';
}
