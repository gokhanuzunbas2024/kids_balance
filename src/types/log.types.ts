import { ActivityCategory } from './activity.types';

export interface ActivityLog {
  id: string;
  activityId: string;
  duration: number;                    // Minutes
  loggedAt: Date;
  activityDate: string;                // ISO date (YYYY-MM-DD)
  note?: string;
  
  // Denormalized for performance
  activityName: string;
  activityCategory: ActivityCategory;
  activityCoefficient: number;
  activityIcon: string;
  activityColor: string;
  
  // Computed
  qualityPoints: number;               // duration * coefficient
}

export interface CreateLogInput {
  activityId: string;
  duration: number;
  activityDate?: string;
  note?: string;
}

export interface UpdateLogInput {
  duration?: number;
  activityDate?: string;
  note?: string;
}
