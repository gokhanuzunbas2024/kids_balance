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
