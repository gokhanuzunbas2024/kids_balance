import { ActivityLog, BalanceScore } from '@/types';
import { ActivityCategory } from '@/types';

export function calculateBalanceScore(logs: ActivityLog[]): BalanceScore {
  const totalMinutes = logs.reduce((sum, log) => sum + log.durationMinutes, 0);
  
  if (totalMinutes === 0) {
    return { diversityScore: 0, qualityScore: 0, varietyScore: 0, totalScore: 0 };
  }

  // 1. Diversity Score (0-30): Penalizes if one category dominates
  const categoryMinutes: Record<ActivityCategory, number> = {
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
    categoryMinutes[log.activityCategory] = 
      (categoryMinutes[log.activityCategory] || 0) + log.durationMinutes;
  });
  
  const maxCategoryPercentage = Math.max(
    ...Object.values(categoryMinutes).map(mins => mins / totalMinutes)
  );
  
  const diversityScore = maxCategoryPercentage <= 0.3 
    ? 30 
    : 30 * (1 - ((maxCategoryPercentage - 0.3) / 0.7));

  // 2. Quality Score (0-50): Based on quality-weighted average
  const totalQualityPoints = logs.reduce(
    (sum, log) => sum + log.qualityScore, 0
  );
  const averageQuality = totalQualityPoints / totalMinutes;
  const qualityScore = (averageQuality / 5.0) * 50;

  // 3. Variety Score (0-20): Rewards trying different activities
  const uniqueActivities = new Set(logs.map(log => log.activityId)).size;
  const varietyScore = Math.min(20, uniqueActivities * 4);

  return {
    diversityScore: Math.round(diversityScore),
    qualityScore: Math.round(qualityScore),
    varietyScore: Math.round(varietyScore),
    totalScore: Math.round(diversityScore + qualityScore + varietyScore)
  };
}

export function getQualityTier(averageQuality: number) {
  if (averageQuality >= 4.0) {
    return {
      tier: 'Exceptional',
      emoji: '🌟',
      message: 'Amazing! You did lots of valuable activities!',
      color: '#FBBF24'
    };
  } else if (averageQuality >= 3.0) {
    return {
      tier: 'Great',
      emoji: '⭐',
      message: 'Great balance of fun and learning!',
      color: '#60A5FA'
    };
  } else if (averageQuality >= 2.0) {
    return {
      tier: 'Good',
      emoji: '✨',
      message: 'Good mix today! Try adding more creative activities.',
      color: '#A78BFA'
    };
  } else {
    return {
      tier: 'Room to Grow',
      emoji: '💫',
      message: 'You had fun! Tomorrow, mix in some learning or creative time.',
      color: '#F472B6'
    };
  }
}
