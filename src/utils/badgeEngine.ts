import { DailyStats } from '@/types';
import { BADGES } from '@/constants/badges';

export function calculateEarnedBadges(stats: DailyStats): string[] {
  return BADGES
    .filter(badge => badge.condition(stats))
    .map(badge => badge.id);
}

export function getBadgeById(badgeId: string) {
  return BADGES.find(badge => badge.id === badgeId);
}
