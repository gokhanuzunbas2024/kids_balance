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
  displayName: string;
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
