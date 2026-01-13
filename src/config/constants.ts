// App-wide constants

export const APP_CONFIG = {
  name: import.meta.env.VITE_APP_NAME || 'Kids Balance',
  version: import.meta.env.VITE_APP_VERSION || '2.0.0',
} as const;

// Authentication
export const AUTH_CONFIG = {
  SESSION_DURATION_MS: 7 * 24 * 60 * 60 * 1000, // 7 days
  PIN_LENGTH: 4,
  MIN_PASSWORD_LENGTH: 8,
  MAX_LOGIN_ATTEMPTS: 5,
  LOCKOUT_DURATION_MS: 15 * 60 * 1000, // 15 minutes
  INVITE_CODE_LENGTH: 8,
  INVITE_EXPIRY_DAYS: 7,
} as const;

// Activity scoring
export const SCORING_CONFIG = {
  MIN_COEFFICIENT: 0.5,
  MAX_COEFFICIENT: 5.0,
  DEFAULT_COEFFICIENT: 1.0,
  DAILY_GOAL_MINUTES: 120,
  MAX_ACTIVITY_DURATION: 480, // 8 hours
} as const;

// Balance thresholds
export const BALANCE_THRESHOLDS = {
  EXCELLENT: { minScore: 300, minCategories: 4 },
  GOOD: { minScore: 200, minCategories: 3 },
  FAIR: { minScore: 100, minCategories: 2 },
  NEEDS_WORK: { minScore: 0, minCategories: 1 },
} as const;

// Category definitions with display info
export const CATEGORY_INFO = {
  physical: { name: 'Physical', icon: '🏃', color: '#22c55e' },
  creative: { name: 'Creative', icon: '🎨', color: '#f59e0b' },
  educational: { name: 'Educational', icon: '📚', color: '#3b82f6' },
  social: { name: 'Social', icon: '👥', color: '#ec4899' },
  screen: { name: 'Screen Time', icon: '📱', color: '#64748b' },
  chores: { name: 'Chores', icon: '🧹', color: '#84cc16' },
  rest: { name: 'Rest', icon: '😴', color: '#a78bfa' },
  other: { name: 'Other', icon: '📌', color: '#6b7280' },
} as const;

// Sync configuration
export const SYNC_CONFIG = {
  DEBOUNCE_MS: 1000,
  RETRY_DELAYS: [1000, 2000, 5000, 10000, 30000],
  MAX_RETRIES: 5,
  BATCH_SIZE: 50,
} as const;

// UI constants
export const UI_CONFIG = {
  TOAST_DURATION: 4000,
  ANIMATION_DURATION: 300,
  DEBOUNCE_INPUT_MS: 300,
  PAGE_SIZE: 20,
} as const;

// Child-friendly avatars
export const AVATAR_OPTIONS = [
  '🦁', '🐯', '🐻', '🐼', '🐨', '🐸',
  '🐵', '🦊', '🐰', '🐶', '🐱', '🦄',
  '🐲', '🦋', '🐢', '🐬', '🦉', '🐝',
] as const;

// Duration quick-select options (in minutes)
export const DURATION_OPTIONS = [
  { label: '15 min', value: 15 },
  { label: '30 min', value: 30 },
  { label: '45 min', value: 45 },
  { label: '1 hour', value: 60 },
  { label: '1.5 hours', value: 90 },
  { label: '2 hours', value: 120 },
] as const;
