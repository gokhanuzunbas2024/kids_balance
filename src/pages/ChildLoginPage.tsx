import React from 'react';
import { Navigate } from 'react-router-dom';
import { ChildLogin } from '@/components/Auth/ChildLogin';
import { useAuth } from '@/contexts/AuthContext';

export function ChildLoginPage() {
  const { isAuthenticated, isInitialized } = useAuth();

  if (isInitialized && isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-indigo-50 to-purple-50">
      <ChildLogin />
    </div>
  );
}
