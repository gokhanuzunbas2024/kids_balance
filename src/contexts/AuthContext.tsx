import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { User as FirebaseUser } from 'firebase/auth';
import { authService } from '@/services/authService';
import {
  User,
  AuthState,
  AuthError,
  LoginCredentials,
  RegisterCredentials,
  PinLoginCredentials,
  AddChildCredentials,
  PasswordResetRequest,
} from '@/types';

interface AuthContextType extends AuthState {
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (credentials: RegisterCredentials) => Promise<void>;
  loginChild: (credentials: PinLoginCredentials) => Promise<void>;
  addChild: (familyId: string, credentials: AddChildCredentials) => Promise<User>;
  sendPasswordReset: (request: PasswordResetRequest) => Promise<void>;
  logout: () => Promise<void>;
  clearError: () => void;
  isParent: boolean;
  isChild: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);
  const [error, setError] = useState<AuthError | null>(null);

  // Initialize auth state
  useEffect(() => {
    let unsubscribe: (() => void) | null = null;

    const initAuth = async () => {
      try {
        unsubscribe = authService.onAuthStateChanged((user) => {
          setUser(user);
          setFirebaseUser(user ? ({} as FirebaseUser) : null); // Simplified for now
          setIsLoading(false);
          setIsInitialized(true);
        });
      } catch (err) {
        console.error('Error initializing auth:', err);
        setIsLoading(false);
        setIsInitialized(true);
      }
    };

    initAuth();

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, []);

  const handleError = useCallback((err: any, field?: string) => {
    const authError: AuthError = {
      code: err.code || 'unknown',
      message: err.message || 'An error occurred',
      field,
    };
    setError(authError);
    throw err;
  }, []);

  const login = useCallback(async (credentials: LoginCredentials) => {
    try {
      setIsLoading(true);
      setError(null);
      const user = await authService.login(credentials);
      setUser(user);
    } catch (err: any) {
      handleError(err, 'email');
    } finally {
      setIsLoading(false);
    }
  }, [handleError]);

  const register = useCallback(async (credentials: RegisterCredentials) => {
    try {
      setIsLoading(true);
      setError(null);
      const user = await authService.register(credentials);
      setUser(user);
    } catch (err: any) {
      handleError(err);
    } finally {
      setIsLoading(false);
    }
  }, [handleError]);

  const loginChild = useCallback(async (credentials: PinLoginCredentials) => {
    try {
      setIsLoading(true);
      setError(null);
      const user = await authService.loginChild(credentials);
      setUser(user);
    } catch (err: any) {
      handleError(err, 'pin');
    } finally {
      setIsLoading(false);
    }
  }, [handleError]);

  const addChild = useCallback(async (familyId: string, credentials: AddChildCredentials) => {
    try {
      setError(null);
      const child = await authService.addChild(familyId, credentials);
      return child;
    } catch (err: any) {
      handleError(err);
      throw err;
    }
  }, [handleError]);

  const sendPasswordReset = useCallback(async (request: PasswordResetRequest) => {
    try {
      setError(null);
      await authService.sendPasswordReset(request);
    } catch (err: any) {
      handleError(err, 'email');
      throw err;
    }
  }, [handleError]);

  const logout = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      await authService.logout();
      setUser(null);
      setFirebaseUser(null);
    } catch (err: any) {
      handleError(err);
    } finally {
      setIsLoading(false);
    }
  }, [handleError]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const value: AuthContextType = {
    user,
    firebaseUser,
    isAuthenticated: !!user,
    isLoading,
    isInitialized,
    error,
    login,
    register,
    loginChild,
    addChild,
    sendPasswordReset,
    logout,
    clearError,
    isParent: user?.role === 'parent',
    isChild: user?.role === 'child',
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
