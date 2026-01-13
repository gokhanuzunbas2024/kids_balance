import { create } from 'zustand';
import { DailyStats, DailySummary } from '@/types';
import { FirebaseActivityLogRepository } from '@/repositories/firebase/ActivityLogRepository';
import { calculateBalanceScore } from '@/utils/scoreCalculator';
import { format } from 'date-fns';
import { query, collection, where, orderBy, limit, getDocs } from 'firebase/firestore';
import { getFirebaseDb, COLLECTIONS } from '@/config/firebase';

interface StatsStore {
  todayStats: DailyStats | null;
  isLoading: boolean;
  loadTodayStats: (userId: string) => Promise<void>;
  loadStatsForDate: (userId: string, date: string) => Promise<DailyStats | null>;
  getStreak: (userId: string, date?: string) => Promise<number>;
}

const repository = new FirebaseActivityLogRepository();

// Convert DailySummary (Firebase) to DailyStats (legacy format for components)
function convertSummaryToStats(summary: DailySummary, logs: any[]): DailyStats {
  // Convert categoryBreakdown array to Record format
  const categoryBreakdown: Record<string, number> = {};
  summary.categoryBreakdown.forEach((item) => {
    categoryBreakdown[item.category] = item.minutes;
  });

  // Calculate balance score properly
  const balanceScore = calculateBalanceScore(logs);

  return {
    date: summary.date,
    totalMinutes: summary.totalMinutes,
    categoryBreakdown: categoryBreakdown as any,
    activitiesLogged: logs.length,
    uniqueActivities: new Set(logs.map((l: any) => l.activityId)).size,
    totalQualityPoints: summary.totalScore,
    averageQuality: summary.totalMinutes > 0 ? summary.totalScore / summary.totalMinutes : 0,
    balanceScore,
    badgesEarned: [], // TODO: Get from summary if available
    calculatedAt: (summary.updatedAt as any)?.toDate?.() || new Date(),
  };
}

export const useStatsStore = create<StatsStore>((set, get) => ({
  todayStats: null,
  isLoading: false,

  loadTodayStats: async (userId: string) => {
    const today = format(new Date(), 'yyyy-MM-dd');
    await get().loadStatsForDate(userId, today);
  },

  loadStatsForDate: async (userId: string, date: string) => {
    set({ isLoading: true });
    try {
      // Get logs for the date first
      const dayStart = new Date(date);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(date);
      dayEnd.setHours(23, 59, 59, 999);
      const logs = await repository.getByDateRange(userId, {
        start: dayStart,
        end: dayEnd,
      });

      // Get daily summary from Firebase
      let summary = await repository.getDailySummary(userId, date);
      
      // If no summary exists but we have logs, create one
      // If no logs and no summary, create empty summary
      if (!summary) {
        if (logs.length > 0) {
          summary = await repository.updateDailySummary(userId, date);
        } else {
          // Create empty stats for days with no logs
          const emptyBalanceScore = calculateBalanceScore([]);
          
          const emptyStats: DailyStats = {
            date,
            totalMinutes: 0,
            categoryBreakdown: {
              'screen': 0,
              'physical': 0,
              'creative': 0,
              'educational': 0,
              'social': 0,
              'chores': 0,
              'rest': 0,
              'other': 0,
            } as any,
            activitiesLogged: 0,
            uniqueActivities: 0,
            totalQualityPoints: 0,
            averageQuality: 0,
            balanceScore: emptyBalanceScore,
            badgesEarned: [],
            calculatedAt: new Date(),
          };

          if (date === format(new Date(), 'yyyy-MM-dd')) {
            set({ todayStats: emptyStats, isLoading: false });
          } else {
            set({ isLoading: false });
          }
          return emptyStats;
        }
      }

      // Convert to DailyStats format
      const stats = convertSummaryToStats(summary, logs);

      if (date === format(new Date(), 'yyyy-MM-dd')) {
        set({ todayStats: stats, isLoading: false });
      } else {
        set({ isLoading: false });
      }

      return stats;
    } catch (error) {
      console.error('Error loading stats:', error);
      // Return empty stats on error so UI doesn't break
      const emptyBalanceScore = calculateBalanceScore([]);
      const emptyStats: DailyStats = {
        date,
        totalMinutes: 0,
        categoryBreakdown: {
          'screen': 0,
          'physical': 0,
          'creative': 0,
          'educational': 0,
          'social': 0,
          'chores': 0,
          'rest': 0,
          'other': 0,
        } as any,
        activitiesLogged: 0,
        uniqueActivities: 0,
        totalQualityPoints: 0,
        averageQuality: 0,
        balanceScore: emptyBalanceScore,
        badgesEarned: [],
        calculatedAt: new Date(),
      };
      
      if (date === format(new Date(), 'yyyy-MM-dd')) {
        set({ todayStats: emptyStats, isLoading: false });
      } else {
        set({ isLoading: false });
      }
      return emptyStats;
    }
  },

  getStreak: async (userId: string, date?: string) => {
    try {
      const targetDate = date || format(new Date(), 'yyyy-MM-dd');
      
      // Get the daily summary to get the streak
      const summary = await repository.getDailySummary(userId, targetDate);
      
      if (summary && summary.streak) {
        return summary.streak;
      }
      
      // If no summary exists, calculate streak from past summaries
      // This mimics the calculateStreak logic from the repository
      const db = getFirebaseDb();
      
      const recentQuery = query(
        collection(db, COLLECTIONS.DAILY_SUMMARIES),
        where('userId', '==', userId),
        where('date', '<', targetDate),
        orderBy('date', 'desc'),
        limit(30)
      );
      
      const snapshot = await getDocs(recentQuery);
      if (snapshot.empty) return 1; // First day
      
      let streak = 1;
      const dates = snapshot.docs.map((doc) => doc.data().date);
      
      const yesterday = format(
        new Date(new Date(targetDate).getTime() - 24 * 60 * 60 * 1000),
        'yyyy-MM-dd'
      );
      
      // If yesterday doesn't have a summary, streak is 1 (today is day 1)
      if (dates[0] !== yesterday) return 1;
      
      // Yesterday exists, so streak is at least 2
      streak = 2;
      
      // Count backwards to find consecutive days
      for (let i = 1; i < dates.length; i++) {
        const expectedDate = format(
          new Date(new Date(dates[i - 1]).getTime() - 24 * 60 * 60 * 1000),
          'yyyy-MM-dd'
        );
        if (dates[i] === expectedDate) {
          streak++;
        } else {
          break; // Gap found, streak ends
        }
      }
      
      return streak;
    } catch (error) {
      console.error('Error calculating streak:', error);
      return 1; // Default to 1 on error
    }
  },
}));
