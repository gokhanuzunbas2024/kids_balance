import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { initializeFirebase } from '@/config/firebase';
import { LoginPage } from '@/pages/LoginPage';
import { RegisterPage } from '@/pages/RegisterPage';
import { ChildLoginPage } from '@/pages/ChildLoginPage';
import { ForgotPasswordPage } from '@/pages/ForgotPasswordPage';
import { DashboardPage } from '@/pages/DashboardPage';
import { ParentDashboardPage } from '@/pages/ParentDashboardPage';
import { ChildDashboardPage } from '@/pages/ChildDashboardPage';
import { ProtectedRoute, ParentRoute } from '@/components/Auth/ProtectedRoute';
import { useSyncStore } from '@/stores/syncStore';
import { syncService } from '@/services/syncService';

console.log('✅ App.tsx: All imports successful');

// Initialize Firebase (with error handling - non-blocking)
if (typeof window !== 'undefined') {
  try {
    initializeFirebase();
    console.log('✅ Firebase initialized');
  } catch (error) {
    console.error('❌ Firebase initialization failed:', error);
    // Don't block app from loading - show error in UI instead
  }
}

function AppContent() {
  const { user, isAuthenticated } = useAuth();
  const initializeSync = useSyncStore((state) => state.initialize);

  useEffect(() => {
    // Initialize sync service
    initializeSync();
  }, [initializeSync]);

  useEffect(() => {
    // Start family sync when user is authenticated
    if (isAuthenticated && user?.familyId) {
      syncService.startFamilySync(user.familyId);
    } else {
      syncService.stopSync();
    }

    return () => {
      syncService.stopSync();
    };
  }, [isAuthenticated, user?.familyId]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/child-login" element={<ChildLoginPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />

        {/* Protected Routes */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          }
        />

        {/* Parent-only Routes */}
        <Route
          path="/parent"
          element={
            <ParentRoute>
              <ParentDashboardPage />
            </ParentRoute>
          }
        />
        <Route
          path="/parent/child/:childId"
          element={
            <ParentRoute>
              <ChildDashboardPage />
            </ParentRoute>
          }
        />

        {/* Redirects */}
        <Route path="/" element={<Navigate to="/login" replace />} />
      </Routes>

      {/* Global Toast */}
      <Toaster
        position="top-center"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#363636',
            color: '#fff',
            borderRadius: '12px',
          },
        }}
      />
    </div>
  );
}

export default function App() {
  console.log('🚀 App.tsx: App component rendering...');
  
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </BrowserRouter>
  );
}
