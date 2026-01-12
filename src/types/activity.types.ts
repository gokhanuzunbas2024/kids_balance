export enum ActivityCategory {
  SCREEN = 'screen',
  PHYSICAL = 'physical',
  CREATIVE = 'creative',
  LEARNING = 'learning',
  SOCIAL = 'social'
}

export interface Activity {
  id: string;
  name: string;
  category: ActivityCategory;
  icon: string;                        // Emoji
  color: string;                       // Hex color
  coefficient: number;                 // 1.0 - 5.0 quality multiplier
  createdAt: Date;
  isFavorite: boolean;
  suggestedDurations: number[];        // Minutes [15, 30, 60]
  createdBy: 'parent' | 'child';
  isPreset: boolean;
  isArchived: boolean;
}

export interface ActivityFormData {
  name: string;
  category: ActivityCategory;
  icon: string;
  color: string;
  coefficient: number;
  suggestedDurations: number[];
  createdBy: 'parent' | 'child';
}
