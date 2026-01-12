import { Activity, ActivityCategory } from '@/types';

export const PRESET_ACTIVITIES: Omit<Activity, 'id' | 'createdAt' | 'isFavorite' | 'isPreset' | 'isArchived' | 'createdBy'>[] = [
  {
    name: 'Watching YouTube',
    category: ActivityCategory.SCREEN,
    icon: '📺',
    color: '#FF0000',
    coefficient: 1.0,
    suggestedDurations: [30, 60, 120]
  },
  {
    name: 'Playing Video Games',
    category: ActivityCategory.SCREEN,
    icon: '🎮',
    color: '#8B5CF6',
    coefficient: 1.5,
    suggestedDurations: [30, 60, 90]
  },
  {
    name: 'Reading Books',
    category: ActivityCategory.LEARNING,
    icon: '📚',
    color: '#059669',
    coefficient: 4.0,
    suggestedDurations: [15, 30, 60]
  },
  {
    name: 'Playing Piano',
    category: ActivityCategory.LEARNING,
    icon: '🎹',
    color: '#8B5CF6',
    coefficient: 4.0,
    suggestedDurations: [15, 30, 45, 60]
  },
  {
    name: 'Playing Outside',
    category: ActivityCategory.PHYSICAL,
    icon: '🏃',
    color: '#10B981',
    coefficient: 3.0,
    suggestedDurations: [30, 60, 90, 120]
  },
  {
    name: 'Riding Bike',
    category: ActivityCategory.PHYSICAL,
    icon: '🚴',
    color: '#10B981',
    coefficient: 3.5,
    suggestedDurations: [30, 60, 90]
  },
  {
    name: 'Drawing',
    category: ActivityCategory.CREATIVE,
    icon: '🎨',
    color: '#EC4899',
    coefficient: 4.0,
    suggestedDurations: [15, 30, 60]
  },
  {
    name: 'Building with Blocks',
    category: ActivityCategory.CREATIVE,
    icon: '🧱',
    color: '#F59E0B',
    coefficient: 3.0,
    suggestedDurations: [15, 30, 45, 60]
  },
  {
    name: 'Playing with Friends',
    category: ActivityCategory.SOCIAL,
    icon: '👫',
    color: '#3B82F6',
    coefficient: 3.5,
    suggestedDurations: [30, 60, 90, 120]
  },
  {
    name: 'Board Games',
    category: ActivityCategory.SOCIAL,
    icon: '🎲',
    color: '#6366F1',
    coefficient: 2.5,
    suggestedDurations: [30, 60, 90]
  },
  {
    name: 'Writing Stories',
    category: ActivityCategory.CREATIVE,
    icon: '✍️',
    color: '#EC4899',
    coefficient: 5.0,
    suggestedDurations: [15, 30, 45, 60]
  },
  {
    name: 'Science Projects',
    category: ActivityCategory.LEARNING,
    icon: '🔬',
    color: '#059669',
    coefficient: 5.0,
    suggestedDurations: [30, 60, 90]
  }
];
