import React from 'react';
import { ForgotPassword } from '@/components/Auth/ForgotPassword';

export function ForgotPasswordPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-indigo-50 to-purple-50">
      <ForgotPassword />
    </div>
  );
}
