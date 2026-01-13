import { ActivityLog, DailyStats, ActivityCategory } from '@/types';
import { calculateBalanceScore } from './scoreCalculator';
import { calculateEarnedBadges } from './badgeEngine';

export function aggregateDailyStats(logs: ActivityLog[], date: string): DailyStats {
  const totalMinutes = logs.reduce((sum, log) => sum + log.durationMinutes, 0);
  
  const categoryBreakdown: Record<ActivityCategory, number> = {
    'screen': 0,
    'physical': 0,
    'creative': 0,
    'educational': 0,
    'social': 0,
    'chores': 0,
    'rest': 0,
    'other': 0
  };

  logs.forEach(log => {
    categoryBreakdown[log.activityCategory] += log.durationMinutes;
  });

  const uniqueActivities = new Set(logs.map(log => log.activityId)).size;
  const totalQualityPoints = logs.reduce((sum, log) => sum + log.qualityScore, 0);
  const averageQuality = totalMinutes > 0 ? totalQualityPoints / totalMinutes : 0;
  
  const balanceScore = calculateBalanceScore(logs);
  
  const stats: DailyStats = {
    date,
    totalMinutes,
    categoryBreakdown,
    activitiesLogged: logs.length,
    uniqueActivities,
    totalQualityPoints,
    averageQuality,
    balanceScore,
    badgesEarned: [],
    calculatedAt: new Date()
  };

  stats.badgesEarned = calculateEarnedBadges(stats);

  return stats;
}
