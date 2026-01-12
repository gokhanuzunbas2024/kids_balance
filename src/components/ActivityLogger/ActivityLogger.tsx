import React, { useEffect, useState, useRef } from 'react';
import { Activity } from '@/types';
import { useActivityStore } from '@/stores/activityStore';
import { useLogsStore } from '@/stores/logsStore';
import { useSettingsStore } from '@/stores/settingsStore';
import { ActivityGrid } from './ActivityGrid';
import { TimeInputSelector } from './TimeInputSelector';
import { AddActivityButton } from './AddActivityButton';
import { motion, AnimatePresence } from 'framer-motion';

export const ActivityLogger: React.FC = () => {
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null);
  const { activities, loadActivities, isLoading } = useActivityStore();
  const { createLog, isLoading: isLogging } = useLogsStore();
  const { settings } = useSettingsStore();
  const initializedRef = useRef(false);

  const retryLoadActivities = async () => {
    try {
      const { forceSeedActivities } = useActivityStore.getState();
      await forceSeedActivities();
    } catch (error) {
      console.error('Error retrying load:', error);
      // Fallback: try manual load
      await loadActivities();
    }
  };

  useEffect(() => {
    // Prevent multiple initializations (React StrictMode causes double mount in dev)
    if (initializedRef.current) {
      console.log('⏭️ Skipping ActivityLogger initialization (already initialized)');
      return;
    }
    initializedRef.current = true;

    // Ensure activities are loaded after seeding
    const loadData = async () => {
      try {
        console.log('🔄 Initializing ActivityLogger...');
        // First ensure database is seeded
        const { seedDatabase } = await import('@/db/seedData');
        const seeded = await seedDatabase();
        console.log(`🌱 Seeding result: ${seeded ? 'seeded' : 'already existed'}`);
        // Then load activities
        await loadActivities();
        console.log('✅ ActivityLogger initialized');
      } catch (error) {
        console.error('❌ Error initializing ActivityLogger:', error);
        initializedRef.current = false; // Allow retry on error
      }
    };
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty dependency array - only run once on mount

  const handleTimeConfirm = async (duration: number) => {
    if (!selectedActivity) return;
    try {
      await createLog({
        activityId: selectedActivity.id,
        duration,
        activityDate: new Date().toISOString().split('T')[0]
      });
      setSelectedActivity(null);
    } catch (error) {
      console.error('Error creating log:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-500">Loading activities...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <AnimatePresence mode="wait">
        {selectedActivity ? (
          <motion.div
            key="time-selector"
            initial={{ opacity: 0, x: 300 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -300 }}
          >
            <TimeInputSelector
              activity={selectedActivity}
              onConfirm={handleTimeConfirm}
              onCancel={() => setSelectedActivity(null)}
            />
          </motion.div>
        ) : (
          <motion.div
            key="activity-grid"
            initial={{ opacity: 0, x: -300 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 300 }}
            className="p-4 pb-8"
          >
            <h1 className="text-3xl font-bold mb-2 mt-4">
              {settings?.childName ? `Hi ${settings.childName}! 👋` : 'What did you just do?'}
            </h1>
            <p className="text-gray-600 mb-6">
              {settings?.childName 
                ? 'What did you just do? Tap an activity to log it'
                : 'Tap an activity to log it'}
            </p>
            <ActivityGrid
              activities={activities}
              onActivitySelect={setSelectedActivity}
              onRetryLoad={retryLoadActivities}
            />
            <AddActivityButton />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
