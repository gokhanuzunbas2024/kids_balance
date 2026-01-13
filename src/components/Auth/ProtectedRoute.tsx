import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { UserRole } from '@/types';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: UserRole;
  redirectTo?: string;
}

export function ProtectedRoute({
  children,
  requiredRole,
  redirectTo = '/login',
}: ProtectedRouteProps) {
  const { isAuthenticated, isInitialized, isLoading, user } = useAuth();
  const location = useLocation();

  // Show loading while initializing
  if (!isInitialized || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 to-purple-50">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center"
        >
          <Loader2 className="h-12 w-12 animate-spin text-indigo-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading...</p>
        </motion.div>
      </div>
    );
  }

  // Redirect if not authenticated
  if (!isAuthenticated) {
    return <Navigate to={redirectTo} state={{ from: location }} replace />;
  }

  // Check role if required
  if (requiredRole && user?.role !== requiredRole) {
    // Redirect parents to parent dashboard, children to child dashboard
    const defaultRoute = user?.role === 'parent' ? '/parent' : '/dashboard';
    return <Navigate to={defaultRoute} replace />;
  }

  return <>{children}</>;
}

// Convenience wrappers
export function ParentRoute({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute requiredRole="parent" redirectTo="/dashboard">
      {children}
    </ProtectedRoute>
  );
}

export function ChildRoute({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute requiredRole="child" redirectTo="/parent">
      {children}
    </ProtectedRoute>
  );
}
