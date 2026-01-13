# Part 2: Type Definitions

Complete TypeScript type definitions for the multi-user system.

---

## Core Types

### `src/types/user.ts`

```typescript
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
```

### `src/types/family.ts`

```typescript
import { Timestamp } from 'firebase/firestore';

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
```

### `src/types/auth.ts`

```typescript
import { User as FirebaseUser } from 'firebase/auth';
import { User, UserRole } from './user';

export interface AuthState {
  user: User | null;
  firebaseUser: FirebaseUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isInitialized: boolean;
  error: AuthError | null;
}

export interface AuthError {
  code: string;
  message: string;
  field?: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface PinLoginCredentials {
  odisplayName: string;
  pin: string;
  familyId: string;
}

export interface RegisterCredentials {
  email: string;
  password: string;
  displayName: string;
  familyName: string;
}

export interface AddChildCredentials {
  displayName: string;
  pin: string;
  dateOfBirth?: string;
  avatarUrl?: string;
}

export interface Session {
  userId: string;
  familyId: string;
  role: UserRole;
  token: string;
  refreshToken: string;
  expiresAt: number;
  createdAt: number;
}

export interface PasswordResetRequest {
  email: string;
}

export type AuthAction =
  | { type: 'AUTH_START' }
  | { type: 'AUTH_SUCCESS'; payload: { user: User; firebaseUser: FirebaseUser } }
  | { type: 'AUTH_ERROR'; payload: AuthError }
  | { type: 'AUTH_LOGOUT' }
  | { type: 'AUTH_INITIALIZED' };
```

### `src/types/activity.ts`

```typescript
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
```

### `src/types/sync.ts`

```typescript
export type SyncStatus = 'idle' | 'syncing' | 'success' | 'error' | 'offline';

export interface SyncState {
  status: SyncStatus;
  lastSyncedAt: number | null;
  pendingChanges: number;
  error: string | null;
  isOnline: boolean;
}

export interface PendingChange {
  id: string;
  type: 'create' | 'update' | 'delete';
  collection: string;
  documentId: string;
  data: Record<string, unknown>;
  timestamp: number;
  retryCount: number;
}

export interface SyncConflict {
  id: string;
  localData: Record<string, unknown>;
  remoteData: Record<string, unknown>;
  collection: string;
  documentId: string;
  resolvedAt?: number;
  resolution?: 'local' | 'remote' | 'merged';
}

export type ConflictResolution = 'last-write-wins' | 'local-first' | 'remote-first' | 'manual';
```

### `src/types/index.ts`

```typescript
// Re-export all types
export * from './user';
export * from './family';
export * from './auth';
export * from './activity';
export * from './sync';

// Common utility types
export type Nullable<T> = T | null;
export type Optional<T> = T | undefined;

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

export interface DateRange {
  start: Date;
  end: Date;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
}

// Form validation types
export interface ValidationError {
  field: string;
  message: string;
}

export interface FormState<T> {
  values: T;
  errors: ValidationError[];
  isSubmitting: boolean;
  isValid: boolean;
}

// Generic repository interface
export interface Repository<T, CreateDTO, UpdateDTO> {
  getById(id: string): Promise<T | null>;
  getAll(): Promise<T[]>;
  create(data: CreateDTO): Promise<T>;
  update(id: string, data: UpdateDTO): Promise<T>;
  delete(id: string): Promise<void>;
}

// Query options for list operations
export interface QueryOptions {
  limit?: number;
  offset?: number;
  orderBy?: string;
  orderDirection?: 'asc' | 'desc';
  filters?: Record<string, unknown>;
}
```

---

## Validation Schemas with Zod

### `src/utils/validation.ts`

```typescript
import { z } from 'zod';

// ============ User Validation ============

export const emailSchema = z
  .string()
  .email('Please enter a valid email address')
  .min(1, 'Email is required');

export const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number');

export const pinSchema = z
  .string()
  .length(4, 'PIN must be exactly 4 digits')
  .regex(/^\d+$/, 'PIN must contain only numbers');

export const displayNameSchema = z
  .string()
  .min(2, 'Name must be at least 2 characters')
  .max(50, 'Name must be less than 50 characters')
  .regex(/^[a-zA-Z\s'-]+$/, 'Name can only contain letters, spaces, hyphens, and apostrophes');

// ============ Auth Schemas ============

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password is required'),
  rememberMe: z.boolean().optional(),
});

export const registerSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  confirmPassword: z.string(),
  displayName: displayNameSchema,
  familyName: z.string().min(1, 'Family name is required').max(100),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

export const childLoginSchema = z.object({
  displayName: displayNameSchema,
  pin: pinSchema,
  familyId: z.string().min(1, 'Family ID is required'),
});

export const addChildSchema = z.object({
  displayName: displayNameSchema,
  pin: pinSchema,
  confirmPin: z.string(),
  dateOfBirth: z.string().optional(),
  avatarUrl: z.string().url().optional().or(z.literal('')),
}).refine((data) => data.pin === data.confirmPin, {
  message: "PINs don't match",
  path: ['confirmPin'],
});

export const forgotPasswordSchema = z.object({
  email: emailSchema,
});

export const resetPasswordSchema = z.object({
  password: passwordSchema,
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

// ============ Activity Schemas ============

export const activityCategorySchema = z.enum([
  'physical',
  'creative', 
  'educational',
  'social',
  'screen',
  'chores',
  'rest',
  'other',
]);

export const createActivitySchema = z.object({
  name: z.string().min(1, 'Activity name is required').max(100),
  category: activityCategorySchema,
  coefficient: z.number().min(0.5).max(5.0),
  icon: z.string().min(1, 'Please select an icon'),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Please select a valid color'),
  description: z.string().max(500).optional(),
});

export const logActivitySchema = z.object({
  activityId: z.string().min(1, 'Please select an activity'),
  durationMinutes: z.number().min(1, 'Duration must be at least 1 minute').max(480, 'Duration cannot exceed 8 hours'),
  notes: z.string().max(500).optional(),
  mood: z.number().min(1).max(5).optional(),
  loggedAt: z.date().optional(),
});

// ============ Family Schemas ============

export const createFamilySchema = z.object({
  name: z.string().min(1, 'Family name is required').max(100),
});

export const updateFamilySettingsSchema = z.object({
  timezone: z.string().optional(),
  weekStartsOn: z.union([z.literal(0), z.literal(1), z.literal(6)]).optional(),
  dailyGoalMinutes: z.number().min(30).max(480).optional(),
  allowChildActivityCreation: z.boolean().optional(),
  requireParentApproval: z.boolean().optional(),
  maxScreenTimeMinutes: z.number().min(0).max(480).optional(),
});

export const joinFamilySchema = z.object({
  inviteCode: z.string().length(8, 'Invite code must be 8 characters'),
});

// ============ Type exports ============

export type LoginFormData = z.infer<typeof loginSchema>;
export type RegisterFormData = z.infer<typeof registerSchema>;
export type ChildLoginFormData = z.infer<typeof childLoginSchema>;
export type AddChildFormData = z.infer<typeof addChildSchema>;
export type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;
export type CreateActivityFormData = z.infer<typeof createActivitySchema>;
export type LogActivityFormData = z.infer<typeof logActivitySchema>;
export type CreateFamilyFormData = z.infer<typeof createFamilySchema>;
export type UpdateFamilySettingsFormData = z.infer<typeof updateFamilySettingsSchema>;
export type JoinFamilyFormData = z.infer<typeof joinFamilySchema>;

// ============ Validation helper ============

export function validateForm<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; errors: z.ZodError } {
  const result = schema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  }
  return { success: false, errors: result.error };
}

export function getFieldError(errors: z.ZodError, field: string): string | undefined {
  const fieldError = errors.errors.find((e) => e.path.join('.') === field);
  return fieldError?.message;
}
```

---

## Next Steps

Continue to Part 3 for Firebase configuration and security rules.
