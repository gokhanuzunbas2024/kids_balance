import { Timestamp } from 'firebase/firestore';

export type UserRole = 'parent' | 'child';

export interface User {
  id: string;
  email: string | null;
  displayName: string;
  avatarUrl: string | null;
  role: UserRole;
  familyId: string;
  pin?: string; // Hashed PIN for child accounts
  dateOfBirth?: string; // ISO date string
  createdAt: Timestamp;
  updatedAt: Timestamp;
  lastLoginAt: Timestamp | null;
  settings: UserSettings;
}

export interface UserSettings {
  theme: 'light' | 'dark' | 'system';
  notifications: boolean;
  soundEffects: boolean;
  language: string;
}

export interface CreateUserDTO {
  email?: string;
  displayName: string;
  role: UserRole;
  familyId: string;
  pin?: string;
  dateOfBirth?: string;
}

export interface UpdateUserDTO {
  displayName?: string;
  avatarUrl?: string;
  pin?: string;
  settings?: Partial<UserSettings>;
}

// Serializable version for local storage
export interface SerializedUser {
  id: string;
  email: string | null;
  displayName: string;
  avatarUrl: string | null;
  role: UserRole;
  familyId: string;
  createdAt: string;
  updatedAt: string;
  lastLoginAt: string | null;
  settings: UserSettings;
}
