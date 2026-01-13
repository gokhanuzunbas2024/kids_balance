import { Timestamp } from 'firebase/firestore';

export type ActivityCategory = 
  | 'physical'
  | 'creative'
  | 'educational'
  | 'social'
  | 'screen'
  | 'chores'
  | 'rest'
  | 'other';

export interface Activity {
  id: string;
  familyId: string;
  name: string;
  category: ActivityCategory;
  coefficient: number; // 0.5 - 5.0 quality multiplier
  icon: string;
  color: string;
  description?: string;
  isDefault: boolean; // System-provided vs family-created
  isActive: boolean;
  createdBy: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface CreateActivityDTO {
  familyId: string;
  name: string;
  category: ActivityCategory;
  coefficient: number;
  icon: string;
  color: string;
  description?: string;
  createdBy: string;
}

export interface UpdateActivityDTO {
  name?: string;
  category?: ActivityCategory;
  coefficient?: number;
  icon?: string;
  color?: string;
  description?: string;
  isActive?: boolean;
}

export interface ActivityLog {
  id: string;
  activityId: string;
  userId: string;
  familyId: string;
  durationMinutes: number;
  qualityScore: number; // Calculated: duration * coefficient
  notes?: string;
  mood?: 1 | 2 | 3 | 4 | 5;
  loggedAt: Timestamp;
  createdAt: Timestamp;
  
  // Denormalized for quick display
  activityName: string;
  activityCategory: ActivityCategory;
  activityIcon: string;
  activityColor: string;
}

export interface CreateActivityLogDTO {
  activityId: string;
  userId: string;
  familyId: string;
  durationMinutes: number;
  notes?: string;
  mood?: 1 | 2 | 3 | 4 | 5;
  loggedAt?: Date;
}

export interface DailySummary {
  id: string;
  userId: string;
  familyId: string;
  date: string; // YYYY-MM-DD
  totalMinutes: number;
  totalScore: number;
  categoryBreakdown: CategoryBreakdown[];
  balanceStatus: BalanceStatus;
  streak: number;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface CategoryBreakdown {
  category: ActivityCategory;
  minutes: number;
  score: number;
  percentage: number;
}

export type BalanceStatus = 'excellent' | 'good' | 'fair' | 'needs_work';

// Activity presets for different categories
export const ACTIVITY_PRESETS: Omit<Activity, 'id' | 'familyId' | 'createdBy' | 'createdAt' | 'updatedAt'>[] = [
  // Physical
  { name: 'Sports', category: 'physical', coefficient: 3.0, icon: '⚽', color: '#22c55e', isDefault: true, isActive: true },
  { name: 'Outdoor Play', category: 'physical', coefficient: 2.5, icon: '🌳', color: '#22c55e', isDefault: true, isActive: true },
  { name: 'Swimming', category: 'physical', coefficient: 3.0, icon: '🏊', color: '#06b6d4', isDefault: true, isActive: true },
  { name: 'Bike Riding', category: 'physical', coefficient: 2.5, icon: '🚴', color: '#22c55e', isDefault: true, isActive: true },
  
  // Creative
  { name: 'Drawing', category: 'creative', coefficient: 2.0, icon: '🎨', color: '#f59e0b', isDefault: true, isActive: true },
  { name: 'Music Practice', category: 'creative', coefficient: 2.5, icon: '🎵', color: '#8b5cf6', isDefault: true, isActive: true },
  { name: 'Building/Crafts', category: 'creative', coefficient: 2.0, icon: '🔧', color: '#f59e0b', isDefault: true, isActive: true },
  { name: 'Writing', category: 'creative', coefficient: 2.0, icon: '✏️', color: '#f59e0b', isDefault: true, isActive: true },
  
  // Educational
  { name: 'Reading', category: 'educational', coefficient: 2.5, icon: '📚', color: '#3b82f6', isDefault: true, isActive: true },
  { name: 'Homework', category: 'educational', coefficient: 2.0, icon: '📝', color: '#3b82f6', isDefault: true, isActive: true },
  { name: 'Learning App', category: 'educational', coefficient: 1.5, icon: '💡', color: '#3b82f6', isDefault: true, isActive: true },
  { name: 'Science Project', category: 'educational', coefficient: 3.0, icon: '🔬', color: '#3b82f6', isDefault: true, isActive: true },
  
  // Social
  { name: 'Family Time', category: 'social', coefficient: 2.5, icon: '👨‍👩‍👧', color: '#ec4899', isDefault: true, isActive: true },
  { name: 'Playing with Friends', category: 'social', coefficient: 2.0, icon: '👫', color: '#ec4899', isDefault: true, isActive: true },
  { name: 'Helping Others', category: 'social', coefficient: 3.0, icon: '🤝', color: '#ec4899', isDefault: true, isActive: true },
  
  // Screen Time
  { name: 'Educational Videos', category: 'screen', coefficient: 1.0, icon: '📺', color: '#64748b', isDefault: true, isActive: true },
  { name: 'Video Games', category: 'screen', coefficient: 0.5, icon: '🎮', color: '#64748b', isDefault: true, isActive: true },
  { name: 'Social Media', category: 'screen', coefficient: 0.5, icon: '📱', color: '#64748b', isDefault: true, isActive: true },
  
  // Chores
  { name: 'Cleaning Room', category: 'chores', coefficient: 2.0, icon: '🧹', color: '#84cc16', isDefault: true, isActive: true },
  { name: 'Helping with Meals', category: 'chores', coefficient: 2.5, icon: '🍳', color: '#84cc16', isDefault: true, isActive: true },
  { name: 'Pet Care', category: 'chores', coefficient: 2.5, icon: '🐕', color: '#84cc16', isDefault: true, isActive: true },
  
  // Rest
  { name: 'Nap', category: 'rest', coefficient: 1.5, icon: '😴', color: '#a78bfa', isDefault: true, isActive: true },
  { name: 'Quiet Time', category: 'rest', coefficient: 1.5, icon: '🧘', color: '#a78bfa', isDefault: true, isActive: true },
];
