export interface Badge {
  id: string;
  name: string;
  description: string;
  emoji: string;
  color: string;
  condition: (stats: any) => boolean;
}

export const BADGES: Badge[] = [
  {
    id: 'balanced-day',
    name: 'Balanced Day',
    description: 'Perfect balance across all categories',
    emoji: '⚖️',
    color: '#10B981',
    condition: (stats) => stats.balanceScore.totalScore >= 80
  },
  {
    id: 'quality-master',
    name: 'Quality Master',
    description: 'Average quality score above 4.0',
    emoji: '🌟',
    color: '#FBBF24',
    condition: (stats) => stats.averageQuality >= 4.0
  },
  {
    id: 'variety-explorer',
    name: 'Variety Explorer',
    description: 'Tried 5+ different activities',
    emoji: '🎯',
    color: '#8B5CF6',
    condition: (stats) => stats.uniqueActivities >= 5
  },
  {
    id: 'active-day',
    name: 'Active Day',
    description: 'Logged 3+ hours of activities',
    emoji: '💪',
    color: '#EF4444',
    condition: (stats) => stats.totalMinutes >= 180
  },
  {
    id: 'creative-genius',
    name: 'Creative Genius',
    description: '2+ hours of creative activities',
    emoji: '🎨',
    color: '#EC4899',
    condition: (stats) => stats.categoryBreakdown.creative >= 120
  },
  {
    id: 'learning-champion',
    name: 'Learning Champion',
    description: '2+ hours of learning activities',
    emoji: '📚',
    color: '#059669',
    condition: (stats) => stats.categoryBreakdown.learning >= 120
  },
  {
    id: 'social-butterfly',
    name: 'Social Butterfly',
    description: '2+ hours of social activities',
    emoji: '🦋',
    color: '#3B82F6',
    condition: (stats) => stats.categoryBreakdown.social >= 120
  },
  {
    id: 'physical-power',
    name: 'Physical Power',
    description: '2+ hours of physical activities',
    emoji: '🏃',
    color: '#10B981',
    condition: (stats) => stats.categoryBreakdown.physical >= 120
  }
];
