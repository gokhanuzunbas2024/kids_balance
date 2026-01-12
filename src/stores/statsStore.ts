import { create } from 'zustand';
import { DailyStats } from '@/types';
import { db } from '@/db/schema';
import { aggregateDailyStats } from '@/utils/statsAggregator';

interface StatsStore {
  todayStats: DailyStats | null;
  isLoading: boolean;
  loadTodayStats: () => Promise<void>;
  loadStatsForDate: (date: string) => Promise<DailyStats | null>;
}

export const useStatsStore = create<StatsStore>((set, get) => ({
  todayStats: null,
  isLoading: false,

  loadTodayStats: async () => {
    const today = new Date().toISOString().split('T')[0];
    await get().loadStatsForDate(today);
  },

  loadStatsForDate: async (date: string) => {
    set({ isLoading: true });
    try {
      // Get logs for the date
      const logs = await db.activityLogs
        .where('activityDate')
        .equals(date)
        .toArray();

      // Calculate stats
      const stats = aggregateDailyStats(logs, date);

      // Save to database
      const existing = await db.dailyStats.get(date);
      
      if (existing) {
        await db.dailyStats.update(date, stats);
      } else {
        await db.dailyStats.add(stats);
      }

      if (date === new Date().toISOString().split('T')[0]) {
        set({ todayStats: stats, isLoading: false });
      } else {
        set({ isLoading: false });
      }

      return stats;
    } catch (error) {
      console.error('Error loading stats:', error);
      set({ isLoading: false });
      return null;
    }
  }
}));
