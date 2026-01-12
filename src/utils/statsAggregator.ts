import { ActivityLog, DailyStats, ActivityCategory } from '@/types';
import { calculateBalanceScore } from './scoreCalculator';
import { calculateEarnedBadges } from './badgeEngine';

export function aggregateDailyStats(logs: ActivityLog[], date: string): DailyStats {
  const totalMinutes = logs.reduce((sum, log) => sum + log.duration, 0);
  
  const categoryBreakdown: Record<ActivityCategory, number> = {
    [ActivityCategory.SCREEN]: 0,
    [ActivityCategory.PHYSICAL]: 0,
    [ActivityCategory.CREATIVE]: 0,
    [ActivityCategory.LEARNING]: 0,
    [ActivityCategory.SOCIAL]: 0
  };

  logs.forEach(log => {
    categoryBreakdown[log.activityCategory] += log.duration;
  });

  const uniqueActivities = new Set(logs.map(log => log.activityId)).size;
  const totalQualityPoints = logs.reduce((sum, log) => sum + log.qualityPoints, 0);
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
