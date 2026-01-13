# Part 5: Authentication UI Components

Complete React components for all authentication flows.

---

## Login Form (Parent)

### `src/components/Auth/LoginForm.tsx`

```typescript
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, Lock, Eye, EyeOff, AlertCircle, Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { loginSchema, LoginFormData, getFieldError } from '@/utils/validation';
import { z } from 'zod';

export function LoginForm() {
  const navigate = useNavigate();
  const { login, isLoading, error, clearError } = useAuth();

  const [formData, setFormData] = useState<LoginFormData>({
    email: '',
    password: '',
    rememberMe: false,
  });
  const [showPassword, setShowPassword] = useState(false);
  const [validationErrors, setValidationErrors] = useState<z.ZodError | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
    
    // Clear errors on input
    if (validationErrors) {
      setValidationErrors(null);
    }
    if (error) {
      clearError();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate form
    const result = loginSchema.safeParse(formData);
    if (!result.success) {
      setValidationErrors(result.error);
      return;
    }

    try {
      await login(formData);
      navigate('/dashboard');
    } catch (err) {
      // Error is handled by context
    }
  };

  const getError = (field: string): string | undefined => {
    if (validationErrors) {
      return getFieldError(validationErrors, field);
    }
    if (error?.field === field) {
      return error.message;
    }
    return undefined;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-md mx-auto"
    >
      <div className="bg-white rounded-2xl shadow-xl p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Welcome Back!</h1>
          <p className="text-gray-600 mt-2">Sign in to continue to Kids Balance</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Email Field */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              Email Address
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Mail className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className={`block w-full pl-10 pr-3 py-3 border rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors ${
                  getError('email') ? 'border-red-500 bg-red-50' : 'border-gray-300'
                }`}
                placeholder="parent@example.com"
                autoComplete="email"
              />
            </div>
            {getError('email') && (
              <motion.p
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-1 text-sm text-red-600 flex items-center gap-1"
              >
                <AlertCircle className="h-4 w-4" />
                {getError('email')}
              </motion.p>
            )}
          </div>

          {/* Password Field */}
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                className={`block w-full pl-10 pr-12 py-3 border rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors ${
                  getError('password') ? 'border-red-500 bg-red-50' : 'border-gray-300'
                }`}
                placeholder="••••••••"
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
              >
                {showPassword ? (
                  <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                ) : (
                  <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                )}
              </button>
            </div>
            {getError('password') && (
              <motion.p
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-1 text-sm text-red-600 flex items-center gap-1"
              >
                <AlertCircle className="h-4 w-4" />
                {getError('password')}
              </motion.p>
            )}
          </div>

          {/* Remember Me & Forgot Password */}
          <div className="flex items-center justify-between">
            <label className="flex items-center">
              <input
                type="checkbox"
                name="rememberMe"
                checked={formData.rememberMe}
                onChange={handleChange}
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

          {/* General Error */}
          {error && !error.field && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3"
            >
              <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-700">{error.message}</p>
            </motion.div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 border border-transparent rounded-xl shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                Signing in...
              </>
            ) : (
              'Sign In'
            )}
          </button>
        </form>

        {/* Divider */}
        <div className="relative my-8">
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

        {/* Register Link */}
        <p className="mt-8 text-center text-sm text-gray-600">
          Don't have an account?{' '}
          <Link to="/register" className="font-medium text-indigo-600 hover:text-indigo-500">
            Create Family Account
          </Link>
        </p>
      </div>
    </motion.div>
  );
}
```

---

## Registration Form

### `src/components/Auth/RegisterForm.tsx`

```typescript
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, Lock, User, Users, Eye, EyeOff, AlertCircle, Loader2, Check } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { registerSchema, RegisterFormData, getFieldError } from '@/utils/validation';
import { z } from 'zod';

export function RegisterForm() {
  const navigate = useNavigate();
  const { register, isLoading, error, clearError } = useAuth();

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    displayName: '',
    familyName: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [validationErrors, setValidationErrors] = useState<z.ZodError | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    
    if (validationErrors) setValidationErrors(null);
    if (error) clearError();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const result = registerSchema.safeParse(formData);
    if (!result.success) {
      setValidationErrors(result.error);
      return;
    }

    try {
      await register(formData);
      navigate('/dashboard');
    } catch (err) {
      // Error handled by context
    }
  };

  const getError = (field: string): string | undefined => {
    if (validationErrors) {
      return getFieldError(validationErrors, field);
    }
    if (error?.field === field) {
      return error.message;
    }
    return undefined;
  };

  // Password strength indicator
  const passwordStrength = React.useMemo(() => {
    const password = formData.password;
    let strength = 0;
    if (password.length >= 8) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[a-z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[^A-Za-z0-9]/.test(password)) strength++;
    return strength;
  }, [formData.password]);

  const strengthColors = ['bg-red-500', 'bg-orange-500', 'bg-yellow-500', 'bg-lime-500', 'bg-green-500'];
  const strengthLabels = ['Very Weak', 'Weak', 'Fair', 'Good', 'Strong'];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-md mx-auto"
    >
      <div className="bg-white rounded-2xl shadow-xl p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Create Account</h1>
          <p className="text-gray-600 mt-2">Set up your family account</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Display Name */}
          <div>
            <label htmlFor="displayName" className="block text-sm font-medium text-gray-700 mb-1">
              Your Name
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <User className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                id="displayName"
                name="displayName"
                value={formData.displayName}
                onChange={handleChange}
                className={`block w-full pl-10 pr-3 py-3 border rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${
                  getError('displayName') ? 'border-red-500 bg-red-50' : 'border-gray-300'
                }`}
                placeholder="John"
              />
            </div>
            {getError('displayName') && (
              <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                <AlertCircle className="h-4 w-4" />
                {getError('displayName')}
              </p>
            )}
          </div>

          {/* Family Name */}
          <div>
            <label htmlFor="familyName" className="block text-sm font-medium text-gray-700 mb-1">
              Family Name
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Users className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                id="familyName"
                name="familyName"
                value={formData.familyName}
                onChange={handleChange}
                className={`block w-full pl-10 pr-3 py-3 border rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${
                  getError('familyName') ? 'border-red-500 bg-red-50' : 'border-gray-300'
                }`}
                placeholder="The Smith Family"
              />
            </div>
            {getError('familyName') && (
              <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                <AlertCircle className="h-4 w-4" />
                {getError('familyName')}
              </p>
            )}
          </div>

          {/* Email */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              Email Address
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Mail className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className={`block w-full pl-10 pr-3 py-3 border rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${
                  getError('email') ? 'border-red-500 bg-red-50' : 'border-gray-300'
                }`}
                placeholder="parent@example.com"
              />
            </div>
            {getError('email') && (
              <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                <AlertCircle className="h-4 w-4" />
                {getError('email')}
              </p>
            )}
          </div>

          {/* Password */}
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                className={`block w-full pl-10 pr-12 py-3 border rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${
                  getError('password') ? 'border-red-500 bg-red-50' : 'border-gray-300'
                }`}
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
              >
                {showPassword ? (
                  <EyeOff className="h-5 w-5 text-gray-400" />
                ) : (
                  <Eye className="h-5 w-5 text-gray-400" />
                )}
              </button>
            </div>
            
            {/* Password Strength */}
            {formData.password && (
              <div className="mt-2">
                <div className="flex gap-1 mb-1">
                  {[...Array(5)].map((_, i) => (
                    <div
                      key={i}
                      className={`h-1 flex-1 rounded-full transition-colors ${
                        i < passwordStrength ? strengthColors[passwordStrength - 1] : 'bg-gray-200'
                      }`}
                    />
                  ))}
                </div>
                <p className="text-xs text-gray-500">
                  Password strength: {strengthLabels[passwordStrength - 1] || 'Too weak'}
                </p>
              </div>
            )}
            
            {getError('password') && (
              <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                <AlertCircle className="h-4 w-4" />
                {getError('password')}
              </p>
            )}
          </div>

          {/* Confirm Password */}
          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
              Confirm Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                id="confirmPassword"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                className={`block w-full pl-10 pr-12 py-3 border rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${
                  getError('confirmPassword') ? 'border-red-500 bg-red-50' : 'border-gray-300'
                }`}
                placeholder="••••••••"
              />
              {formData.confirmPassword && formData.password === formData.confirmPassword && (
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                  <Check className="h-5 w-5 text-green-500" />
                </div>
              )}
            </div>
            {getError('confirmPassword') && (
              <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                <AlertCircle className="h-4 w-4" />
                {getError('confirmPassword')}
              </p>
            )}
          </div>

          {/* General Error */}
          {error && !error.field && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3"
            >
              <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0" />
              <p className="text-sm text-red-700">{error.message}</p>
            </motion.div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 border border-transparent rounded-xl shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 font-medium transition-colors disabled:opacity-50"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                Creating Account...
              </>
            ) : (
              'Create Family Account'
            )}
          </button>
        </form>

        <p className="mt-8 text-center text-sm text-gray-600">
          Already have an account?{' '}
          <Link to="/login" className="font-medium text-indigo-600 hover:text-indigo-500">
            Sign in
          </Link>
        </p>
      </div>
    </motion.div>
  );
}
```

---

## Child Login with PIN

### `src/components/Auth/ChildLogin.tsx`

```typescript
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { PinPad } from './PinPad';

interface ChildProfile {
  id: string;
  displayName: string;
  avatarUrl: string | null;
  familyId: string;
}

// Mock data - replace with actual API call
const mockChildren: ChildProfile[] = [
  { id: '1', displayName: 'Emma', avatarUrl: null, familyId: 'family1' },
  { id: '2', displayName: 'Lucas', avatarUrl: null, familyId: 'family1' },
];

export function ChildLogin() {
  const navigate = useNavigate();
  const { loginChild, isLoading, error, clearError } = useAuth();

  const [step, setStep] = useState<'select' | 'pin'>('select');
  const [selectedChild, setSelectedChild] = useState<ChildProfile | null>(null);
  const [familyCode, setFamilyCode] = useState('');
  const [children, setChildren] = useState<ChildProfile[]>([]);
  const [isLoadingChildren, setIsLoadingChildren] = useState(false);

  // Avatars for children without custom avatar
  const defaultAvatars = ['🦁', '🐯', '🐻', '🐼', '🐨', '🐸', '🦊', '🐰'];

  const handleFamilyCodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoadingChildren(true);
    
    // TODO: Fetch children by family invite code
    // const family = await authService.validateInviteCode(familyCode);
    // const familyMembers = await authService.getFamilyMembers(family.id);
    // setChildren(familyMembers.filter(m => m.role === 'child'));
    
    // Mock for now
    setTimeout(() => {
      setChildren(mockChildren);
      setIsLoadingChildren(false);
    }, 500);
  };

  const handleSelectChild = (child: ChildProfile) => {
    setSelectedChild(child);
    setStep('pin');
    clearError();
  };

  const handlePinComplete = async (pin: string) => {
    if (!selectedChild) return;

    try {
      await loginChild({
        displayName: selectedChild.displayName,
        pin,
        familyId: selectedChild.familyId,
      });
      navigate('/dashboard');
    } catch (err) {
      // Error handled by context
    }
  };

  const handleBack = () => {
    if (step === 'pin') {
      setStep('select');
      setSelectedChild(null);
      clearError();
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-md mx-auto"
    >
      <div className="bg-white rounded-2xl shadow-xl p-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          {step === 'pin' && (
            <button
              onClick={handleBack}
              className="p-2 rounded-full hover:bg-gray-100 transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
          )}
          <div className="flex-1 text-center">
            <h1 className="text-3xl font-bold text-gray-900">
              {step === 'select' ? 'Who are you?' : `Hi, ${selectedChild?.displayName}!`}
            </h1>
            <p className="text-gray-600 mt-2">
              {step === 'select' ? 'Select your profile' : 'Enter your PIN'}
            </p>
          </div>
          {step === 'pin' && <div className="w-9" />} {/* Spacer for alignment */}
        </div>

        <AnimatePresence mode="wait">
          {step === 'select' ? (
            <motion.div
              key="select"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
            >
              {/* Family Code Input */}
              {children.length === 0 && (
                <form onSubmit={handleFamilyCodeSubmit} className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Enter your family code
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={familyCode}
                      onChange={(e) => setFamilyCode(e.target.value.toUpperCase())}
                      className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-center text-lg tracking-widest font-mono"
                      placeholder="ABCD1234"
                      maxLength={8}
                    />
                    <button
                      type="submit"
                      disabled={familyCode.length !== 8 || isLoadingChildren}
                      className="px-6 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isLoadingChildren ? (
                        <Loader2 className="h-5 w-5 animate-spin" />
                      ) : (
                        'Go'
                      )}
                    </button>
                  </div>
                </form>
              )}

              {/* Children Grid */}
              {children.length > 0 && (
                <div className="grid grid-cols-2 gap-4">
                  {children.map((child, index) => (
                    <motion.button
                      key={child.id}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: index * 0.1 }}
                      onClick={() => handleSelectChild(child)}
                      className="flex flex-col items-center p-6 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl hover:from-indigo-100 hover:to-purple-100 transition-colors border-2 border-transparent hover:border-indigo-300"
                    >
                      <div className="w-20 h-20 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-4xl mb-3">
                        {child.avatarUrl || defaultAvatars[index % defaultAvatars.length]}
                      </div>
                      <span className="text-lg font-semibold text-gray-900">
                        {child.displayName}
                      </span>
                    </motion.button>
                  ))}
                </div>
              )}

              {/* Change Family Link */}
              {children.length > 0 && (
                <button
                  onClick={() => setChildren([])}
                  className="w-full mt-4 text-sm text-gray-500 hover:text-gray-700"
                >
                  Not your family? Enter a different code
                </button>
              )}
            </motion.div>
          ) : (
            <motion.div
              key="pin"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="flex flex-col items-center"
            >
              {/* Selected Child Avatar */}
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-5xl mb-6">
                {selectedChild?.avatarUrl || '🦁'}
              </div>

              {/* PIN Pad */}
              <PinPad
                onComplete={handlePinComplete}
                isLoading={isLoading}
                error={error?.message}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Parent Login Link */}
        <div className="mt-8 pt-6 border-t border-gray-200 text-center">
          <Link
            to="/login"
            className="text-sm text-gray-600 hover:text-indigo-600"
          >
            👨‍👩‍👧 Parent? Sign in here
          </Link>
        </div>
      </div>
    </motion.div>
  );
}
```

---

## PIN Pad Component

### `src/components/Auth/PinPad.tsx`

```typescript
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Delete, Loader2 } from 'lucide-react';

interface PinPadProps {
  onComplete: (pin: string) => void;
  isLoading?: boolean;
  error?: string;
  length?: number;
}

export function PinPad({ onComplete, isLoading, error, length = 4 }: PinPadProps) {
  const [pin, setPin] = useState('');
  const [shake, setShake] = useState(false);

  // Trigger shake on error
  useEffect(() => {
    if (error) {
      setShake(true);
      setPin('');
      setTimeout(() => setShake(false), 500);
    }
  }, [error]);

  // Auto-submit when PIN is complete
  useEffect(() => {
    if (pin.length === length) {
      onComplete(pin);
    }
  }, [pin, length, onComplete]);

  const handleDigit = (digit: string) => {
    if (pin.length < length && !isLoading) {
      setPin((prev) => prev + digit);
    }
  };

  const handleDelete = () => {
    if (!isLoading) {
      setPin((prev) => prev.slice(0, -1));
    }
  };

  const handleClear = () => {
    if (!isLoading) {
      setPin('');
    }
  };

  const digits = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', 'del'];

  return (
    <div className="w-full max-w-xs">
      {/* PIN Dots */}
      <motion.div
        animate={shake ? { x: [-10, 10, -10, 10, 0] } : {}}
        transition={{ duration: 0.4 }}
        className="flex justify-center gap-4 mb-8"
      >
        {[...Array(length)].map((_, i) => (
          <motion.div
            key={i}
            initial={false}
            animate={{
              scale: pin.length > i ? 1.2 : 1,
              backgroundColor: pin.length > i ? '#6366f1' : '#e5e7eb',
            }}
            className="w-4 h-4 rounded-full"
          />
        ))}
      </motion.div>

      {/* Error Message */}
      <AnimatePresence>
        {error && (
          <motion.p
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="text-center text-red-500 text-sm mb-4"
          >
            {error}
          </motion.p>
        )}
      </AnimatePresence>

      {/* Loading */}
      {isLoading && (
        <div className="flex justify-center mb-4">
          <Loader2 className="h-6 w-6 animate-spin text-indigo-600" />
        </div>
      )}

      {/* Number Pad */}
      <div className="grid grid-cols-3 gap-3">
        {digits.map((digit, index) => {
          if (digit === '') {
            return <div key={index} />;
          }
          
          if (digit === 'del') {
            return (
              <motion.button
                key={index}
                whileTap={{ scale: 0.95 }}
                onClick={handleDelete}
                onDoubleClick={handleClear}
                disabled={isLoading}
                className="aspect-square rounded-2xl bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-600 transition-colors disabled:opacity-50"
              >
                <Delete className="h-6 w-6" />
              </motion.button>
            );
          }

          return (
            <motion.button
              key={index}
              whileTap={{ scale: 0.95 }}
              onClick={() => handleDigit(digit)}
              disabled={isLoading}
              className="aspect-square rounded-2xl bg-gray-100 hover:bg-indigo-100 text-2xl font-semibold text-gray-800 transition-colors disabled:opacity-50"
            >
              {digit}
            </motion.button>
          );
        })}
      </div>

      {/* Hint */}
      <p className="text-center text-xs text-gray-400 mt-4">
        Double-tap delete to clear
      </p>
    </div>
  );
}
```

---

## Protected Route Component

### `src/components/Auth/ProtectedRoute.tsx`

```typescript
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
```

---

## Forgot Password

### `src/components/Auth/ForgotPassword.tsx`

```typescript
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, ArrowLeft, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { forgotPasswordSchema } from '@/utils/validation';

export function ForgotPassword() {
  const { sendPasswordReset, isLoading, error, clearError } = useAuth();
  
  const [email, setEmail] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    const result = forgotPasswordSchema.safeParse({ email });
    if (!result.success) {
      setValidationError(result.error.errors[0].message);
      return;
    }

    try {
      await sendPasswordReset(email);
      setIsSubmitted(true);
    } catch (err) {
      // Error handled by context
    }
  };

  if (isSubmitted) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md mx-auto"
      >
        <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', delay: 0.2 }}
            className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6"
          >
            <CheckCircle className="h-8 w-8 text-green-600" />
          </motion.div>
          
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Check your email</h1>
          <p className="text-gray-600 mb-6">
            We've sent a password reset link to<br />
            <span className="font-medium text-gray-900">{email}</span>
          </p>
          
          <Link
            to="/login"
            className="inline-flex items-center gap-2 text-indigo-600 hover:text-indigo-500 font-medium"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to login
          </Link>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-md mx-auto"
    >
      <div className="bg-white rounded-2xl shadow-xl p-8">
        <Link
          to="/login"
          className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to login
        </Link>

        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Forgot Password?</h1>
          <p className="text-gray-600 mt-2">
            No worries, we'll send you reset instructions.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              Email Address
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Mail className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setValidationError(null);
                  if (error) clearError();
                }}
                className={`block w-full pl-10 pr-3 py-3 border rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${
                  validationError || error ? 'border-red-500 bg-red-50' : 'border-gray-300'
                }`}
                placeholder="parent@example.com"
              />
            </div>
            {(validationError || error) && (
              <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                <AlertCircle className="h-4 w-4" />
                {validationError || error?.message}
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 border border-transparent rounded-xl shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 font-medium transition-colors disabled:opacity-50"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                Sending...
              </>
            ) : (
              'Send Reset Link'
            )}
          </button>
        </form>
      </div>
    </motion.div>
  );
}
```

---

## Auth Components Index

### `src/components/Auth/index.tsx`

```typescript
export { LoginForm } from './LoginForm';
export { RegisterForm } from './RegisterForm';
export { ChildLogin } from './ChildLogin';
export { PinPad } from './PinPad';
export { ForgotPassword } from './ForgotPassword';
export { ProtectedRoute, ParentRoute, ChildRoute } from './ProtectedRoute';
```

---

## Next Steps

Continue to Part 6 for Repository Layer and Data Access implementation.
