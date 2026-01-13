import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { PinPad } from './PinPad';
import { query, collection, where, getDocs } from 'firebase/firestore';
import { getFirebaseDb, COLLECTIONS } from '@/config/firebase';
import { User } from '@/types';

interface ChildProfile {
  id: string;
  displayName: string;
  avatarUrl: string | null;
  familyId: string;
}

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
    clearError();
    
    try {
      // Query families by invite code
      const db = getFirebaseDb();
      const familiesQuery = query(
        collection(db, COLLECTIONS.FAMILIES),
        where('inviteCode', '==', familyCode.toUpperCase())
      );
      
      const familiesSnapshot = await getDocs(familiesQuery);
      
      if (familiesSnapshot.empty) {
        setChildren([]);
        setIsLoadingChildren(false);
        return;
      }

      const family = familiesSnapshot.docs[0];
      const familyId = family.id;

      // Query children in this family
      const usersQuery = query(
        collection(db, COLLECTIONS.USERS),
        where('familyId', '==', familyId),
        where('role', '==', 'child')
      );

      const usersSnapshot = await getDocs(usersQuery);
      const childProfiles: ChildProfile[] = usersSnapshot.docs.map((doc) => {
        const data = doc.data() as User;
        return {
          id: doc.id,
          displayName: data.displayName,
          avatarUrl: data.avatarUrl,
          familyId: data.familyId,
        };
      });

      setChildren(childProfiles);
    } catch (err) {
      console.error('Error loading children:', err);
      setChildren([]);
    } finally {
      setIsLoadingChildren(false);
    }
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
                  {error && (
                    <p className="mt-2 text-sm text-red-600">{error.message}</p>
                  )}
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
                  onClick={() => {
                    setChildren([]);
                    setFamilyCode('');
                  }}
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
