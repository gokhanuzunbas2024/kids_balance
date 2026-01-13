import React, { useState, useEffect } from 'react';
import { Navigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { getFirebaseAuth } from '@/config/firebase';

export function LoginPage() {
  const { isAuthenticated, isInitialized, login, isLoading, error, user } = useAuth();
  const [firebaseReady, setFirebaseReady] = useState(false);
  const [configError, setConfigError] = useState<string | null>(null);
  const [formData, setFormData] = useState({ email: '', password: '', rememberMe: false });

  useEffect(() => {
    // Check if Firebase is properly configured
    try {
      const auth = getFirebaseAuth();
      setFirebaseReady(true);
      setConfigError(null);
    } catch (err: any) {
      setFirebaseReady(false);
      setConfigError(err.message || 'Firebase not configured');
      console.error('Firebase config error:', err);
    }
  }, []);

  // Redirect based on user role after login
  if (isInitialized && isAuthenticated) {
    // Parents go to parent dashboard, children go to child dashboard
    const redirectPath = user?.role === 'parent' ? '/parent' : '/dashboard';
    return <Navigate to={redirectPath} replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await login(formData);
    } catch (err) {
      // Error handled by context
    }
  };

  // Show setup message if Firebase is not configured
  if (!firebaseReady || configError) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-indigo-50 to-purple-50">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-indigo-600 rounded-2xl mb-4">
              <span className="text-3xl">⚖️</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Kids Balance</h1>
            <p className="text-gray-600 mt-2">Please configure Firebase to continue</p>
          </div>
          <div className="bg-white rounded-2xl shadow-xl p-8">
            {configError && (
              <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-700 font-medium">Configuration Error:</p>
                <p className="text-sm text-red-600 mt-1">{configError}</p>
              </div>
            )}
            <p className="text-center text-gray-600 mb-4">
              To use this app, you need to:
            </p>
            <ol className="list-decimal list-inside space-y-2 text-sm text-gray-600 mb-4">
              <li>Create a Firebase project</li>
              <li>Copy your Firebase config to <code className="bg-gray-100 px-2 py-1 rounded">.env.local</code></li>
              <li>Enable Authentication (Email/Password)</li>
              <li>Create Firestore database</li>
            </ol>
            <p className="text-xs text-gray-500 mt-4">
              After updating .env.local, restart the dev server (stop and run <code className="bg-gray-100 px-1 rounded">npm run dev</code> again)
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Show login form if Firebase is configured
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-indigo-50 to-purple-50">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-indigo-600 rounded-2xl mb-4">
            <span className="text-3xl">⚖️</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Kids Balance</h1>
          <p className="text-gray-600 mt-2">Sign in to continue</p>
        </div>
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email Address
              </label>
              <input
                type="email"
                id="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="parent@example.com"
                required
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <input
                type="password"
                id="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="••••••••"
                required
              />
            </div>
            <div className="flex items-center justify-between">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  id="rememberMe"
                  checked={formData.rememberMe}
                  onChange={(e) => setFormData({ ...formData, rememberMe: e.target.checked })}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                />
                <span className="ml-2 text-sm text-gray-600">Remember me</span>
              </label>
              <Link
                to="/forgot-password"
                className="text-sm font-medium text-indigo-600 hover:text-indigo-500"
              >
                Forgot password?
              </Link>
            </div>
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-700">{error.message}</p>
              </div>
            )}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 px-4 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-white text-gray-500">or</span>
            </div>
          </div>

          {/* Child Login Link */}
          <Link
            to="/child-login"
            className="w-full flex items-center justify-center gap-2 py-3 px-4 border-2 border-indigo-200 rounded-xl text-indigo-600 hover:bg-indigo-50 font-medium transition-colors"
          >
            🧒 I'm a Kid - Login with PIN
          </Link>

          <p className="mt-6 text-center text-sm text-gray-600">
            Don't have an account?{' '}
            <Link to="/register" className="font-medium text-indigo-600 hover:text-indigo-500">
              Create Family Account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
