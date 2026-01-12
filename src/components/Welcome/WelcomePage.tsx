import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useSettingsStore } from '@/stores/settingsStore';
import { Sparkles, Star } from 'lucide-react';

export const WelcomePage: React.FC = () => {
  const [name, setName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { setChildName } = useSettingsStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsSubmitting(true);
    try {
      console.log('👤 Setting child name:', name.trim());
      await setChildName(name.trim());
      console.log('✅ Child name set');
      // Small delay for smooth transition
      await new Promise(resolve => setTimeout(resolve, 200));
    } catch (error) {
      console.error('❌ Error setting child name:', error);
      alert('Error setting name. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-400 via-purple-500 to-pink-500 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="bg-white rounded-3xl shadow-2xl p-8 md:p-12 max-w-md w-full"
      >
        <div className="text-center mb-8">
          <motion.div
            animate={{ rotate: [0, 10, -10, 10, 0] }}
            transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
            className="text-7xl mb-4"
          >
            🌟
          </motion.div>
          <h1 className="text-4xl font-bold text-gray-800 mb-2">
            Welcome!
          </h1>
          <p className="text-lg text-gray-600">
            Let's track your awesome activities!
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="name" className="block text-sm font-semibold text-gray-700 mb-2">
              What's your name?
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter your name"
              className="w-full px-4 py-4 text-lg border-2 border-gray-300 rounded-2xl focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 transition-all"
              autoFocus
              maxLength={20}
              disabled={isSubmitting}
            />
          </div>

          <motion.button
            type="submit"
            disabled={!name.trim() || isSubmitting}
            whileTap={{ scale: 0.95 }}
            whileHover={{ scale: 1.02 }}
            className="w-full py-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white text-lg font-bold rounded-2xl shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <>
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                >
                  ⏳
                </motion.div>
                <span>Getting ready...</span>
              </>
            ) : (
              <>
                <Sparkles size={20} />
                <span>Let's Go!</span>
              </>
            )}
          </motion.button>
        </form>

        <div className="mt-8 text-center">
          <div className="flex justify-center gap-2 text-yellow-400">
            <Star size={16} fill="currentColor" />
            <Star size={16} fill="currentColor" />
            <Star size={16} fill="currentColor" />
            <Star size={16} fill="currentColor" />
            <Star size={16} fill="currentColor" />
          </div>
          <p className="text-xs text-gray-500 mt-2">
            Your name helps personalize your experience
          </p>
        </div>
      </motion.div>
    </div>
  );
};
