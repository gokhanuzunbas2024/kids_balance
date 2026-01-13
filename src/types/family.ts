import { Timestamp } from 'firebase/firestore';
import { User } from './user';

export interface Family {
  id: string;
  name: string;
  ownerId: string; // Parent who created the family
  memberIds: string[];
  inviteCode: string; // Unique code for joining
  createdAt: Timestamp;
  updatedAt: Timestamp;
  settings: FamilySettings;
}

export interface FamilySettings {
  timezone: string;
  weekStartsOn: 0 | 1 | 6; // Sunday, Monday, or Saturday
  dailyGoalMinutes: number;
  allowChildActivityCreation: boolean;
  requireParentApproval: boolean;
  maxScreenTimeMinutes: number;
}

export interface CreateFamilyDTO {
  name: string;
  ownerId: string;
}

export interface UpdateFamilyDTO {
  name?: string;
  settings?: Partial<FamilySettings>;
}

export interface FamilyMember {
  user: User;
  role: 'owner' | 'parent' | 'child';
  joinedAt: Timestamp;
}

export interface FamilyInvite {
  id: string;
  familyId: string;
  email: string;
  role: 'parent' | 'child';
  expiresAt: Timestamp;
  createdBy: string;
  status: 'pending' | 'accepted' | 'expired';
}
