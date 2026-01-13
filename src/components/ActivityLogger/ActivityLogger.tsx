import React, { useEffect, useState } from 'react';
import { Activity } from '@/types';
import { useActivityStore } from '@/stores/activityStore';
import { useLogsStore } from '@/stores/logsStore';
import { useAuth } from '@/contexts/AuthContext';
import { ActivityGrid } from './ActivityGrid';
import { TimeInputSelector } from './TimeInputSelector';
import { AddActivityButton } from './AddActivityButton';
import { motion, AnimatePresence } from 'framer-motion';

export const ActivityLogger: React.FC = () => {
  const { user } = useAuth();
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null);
  const { activities, fetchActivities, isLoading, seedDefaults } = useActivityStore();
  const { createLog, isLoading: isLogging } = useLogsStore();

  useEffect(() => {
    if (user?.familyId) {
      fetchActivities(user.familyId).then(() => {
        // Seed defaults if no activities exist
        if (activities.length === 0 && user.familyId) {
          seedDefaults(user.familyId, user.id);
        }
      });
    }
  }, [user?.familyId, user?.id]);

  const retryLoadActivities = async () => {
    if (user?.familyId) {
      await fetchActivities(user.familyId);
    }
  };

  const handleTimeConfirm = async (duration: number) => {
    if (!selectedActivity || !user) return;
    try {
      console.log('Creating log with:', {
        activityId: selectedActivity.id,
        userId: user.id,
        familyId: user.familyId,
        durationMinutes: duration,
      });
      const log = await createLog({
        activityId: selectedActivity.id,
        userId: user.id,
        familyId: user.familyId,
        durationMinutes: duration,
        loggedAt: new Date(),
      });
      console.log('✅ Log created successfully:', log);
      setSelectedActivity(null);
      // Reload today's logs - but don't fail if it errors
      try {
        console.log('🔄 Reloading logs after creation...');
        await useLogsStore.getState().loadTodayLogs(user.id);
        console.log('✅ Logs reloaded successfully');
      } catch (reloadError) {
        console.warn('⚠️ Failed to reload logs (but log was created):', reloadError);
        // Log was created successfully, so we can continue
        // The optimistic update should have already added it to the store
      }
    } catch (error) {
      console.error('Error creating log:', error);
      console.error('Error details:', {
        message: (error as Error).message,
        code: (error as any).code,
        stack: (error as Error).stack,
      });
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
              {user?.displayName ? `Hi ${user.displayName}! 👋` : 'What did you just do?'}
            </h1>
            <p className="text-gray-600 mb-6">
              Tap an activity to log it
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
