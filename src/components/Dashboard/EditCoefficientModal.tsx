import React, { useState } from 'react';
import { Activity } from '@/types';
import { useActivityStore } from '@/stores/activityStore';
import { useLogsStore } from '@/stores/logsStore';
import { Modal } from '../shared/Modal';
import { Button } from '../shared/Button';
import { useAuth } from '@/contexts/AuthContext';
import { FirebaseActivityLogRepository } from '@/repositories/firebase/ActivityLogRepository';
import { startOfDay, endOfDay, format } from 'date-fns';
import { query, collection, where, getDocs, updateDoc, doc, Timestamp } from 'firebase/firestore';
import { getFirebaseDb, COLLECTIONS } from '@/config/firebase';

interface EditCoefficientModalProps {
  activity: Activity;
  isOpen: boolean;
  onClose: () => void;
}

export const EditCoefficientModal: React.FC<EditCoefficientModalProps> = ({
  activity,
  isOpen,
  onClose,
}) => {
  const { updateActivity, fetchActivities } = useActivityStore();
  const { user } = useAuth();
  const { loadTodayLogs } = useLogsStore();
  const [coefficient, setCoefficient] = useState<number>(activity.coefficient);
  const [isSaving, setIsSaving] = useState(false);
  const [recalculateExisting, setRecalculateExisting] = useState(true);

  // Recalculate quality scores for existing logs with this activity
  const recalculateExistingLogs = async (newCoefficient: number) => {
    if (!user?.id || !recalculateExisting) return;

    try {
      const db = getFirebaseDb();
      const logRepository = new FirebaseActivityLogRepository();
      
      // Get all logs for this activity (today and past)
      // Note: This query might need an index on (activityId, userId)
      const logsQuery = query(
        collection(db, COLLECTIONS.ACTIVITY_LOGS),
        where('activityId', '==', activity.id),
        where('userId', '==', user.id)
      );
      
      const logsSnapshot = await getDocs(logsQuery);
      const logsToUpdate = logsSnapshot.docs.filter((logDoc) => {
        const logData = logDoc.data();
        const newQualityScore = logData.durationMinutes * newCoefficient;
        // Only update if there's a meaningful difference
        return Math.abs(newQualityScore - logData.qualityScore) > 0.01;
      });
      
      console.log(`🔄 Recalculating ${logsToUpdate.length} existing logs for activity ${activity.name}...`);
      
      if (logsToUpdate.length === 0) {
        console.log('✅ No logs need recalculation');
        return;
      }
      
      // Track unique dates that need summary updates
      const datesToUpdate = new Set<string>();
      
      // Update each log's qualityScore
      const updatePromises = logsToUpdate.map(async (logDoc) => {
        const logData = logDoc.data();
        const newQualityScore = logData.durationMinutes * newCoefficient;
        
        await updateDoc(doc(db, COLLECTIONS.ACTIVITY_LOGS, logDoc.id), {
          qualityScore: newQualityScore,
        });
        
        // Track date for summary update
        const logDate = (logData.loggedAt as Timestamp).toDate();
        const dateStr = format(logDate, 'yyyy-MM-dd');
        datesToUpdate.add(dateStr);
      });
      
      await Promise.all(updatePromises);
      console.log(`✅ Updated ${logsToUpdate.length} logs`);
      
      // Update daily summaries for all affected dates (batch to avoid duplicates)
      console.log(`🔄 Updating daily summaries for ${datesToUpdate.size} dates...`);
      const summaryUpdatePromises = Array.from(datesToUpdate).map((dateStr) =>
        logRepository.updateDailySummary(user.id, dateStr)
      );
      await Promise.all(summaryUpdatePromises);
      console.log(`✅ Updated ${datesToUpdate.size} daily summaries`);
      
      // Reload today's data
      if (user.id) {
        await loadTodayLogs(user.id);
      }
    } catch (error: any) {
      console.error('Error recalculating existing logs:', error);
      // If it's an index error, show a helpful message but don't fail completely
      if (error?.code === 'failed-precondition') {
        console.warn('⚠️ Firestore index may be needed. Query requires index on (activityId, userId)');
        // Don't throw - allow the coefficient update to succeed even if recalculation fails
        // The user can manually trigger recalculation later
      } else {
        // For other errors, still allow the coefficient update to succeed
        console.warn('⚠️ Could not recalculate all existing logs, but coefficient was updated');
      }
    }
  };

  const handleSave = async () => {
    if (!user?.familyId) return;
    
    setIsSaving(true);
    try {
      // Update the activity coefficient
      await updateActivity(activity.id, { coefficient });
      
      // Recalculate existing logs if requested
      if (recalculateExisting && coefficient !== activity.coefficient) {
        await recalculateExistingLogs(coefficient);
      }
      
      // Reload activities to reflect the change
      await fetchActivities(user.familyId);
      
      // Reload today's logs to show updated average quality
      // Note: Stats will be recalculated when dashboard re-renders
      
      onClose();
    } catch (error) {
      console.error('Error updating coefficient:', error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Edit ${activity.name} Quality`}
    >
      <div className="space-y-6">
        <div className="text-center">
          <div className="text-6xl mb-4">{activity.icon}</div>
          <h3 className="text-xl font-bold mb-2">{activity.name}</h3>
          <p className="text-gray-600 text-sm">
            Adjust the quality coefficient for this activity. Higher values mean more quality points per minute.
          </p>
        </div>

        <div>
          <div className="flex items-center justify-between mb-4">
            <label className="block text-sm font-semibold">
              Quality Coefficient
            </label>
            <div className="text-2xl font-bold" style={{ color: activity.color }}>
              {coefficient.toFixed(1)} ⭐
            </div>
          </div>
          
          <input
            type="range"
            min="0.5"
            max="5.0"
            step="0.1"
            value={coefficient}
            onChange={(e) => setCoefficient(parseFloat(e.target.value))}
            className="w-full h-3 bg-gray-200 rounded-lg appearance-none cursor-pointer"
            style={{
              background: `linear-gradient(to right, ${activity.color} 0%, ${activity.color} ${((coefficient - 0.5) / 4.5) * 100}%, #e5e7eb ${((coefficient - 0.5) / 4.5) * 100}%, #e5e7eb 100%)`
            }}
          />
          
          <div className="flex justify-between text-xs text-gray-500 mt-2">
            <span>Just for fun (0.5⭐)</span>
            <span>Super valuable! (5.0⭐)</span>
          </div>

          {/* Visual stars */}
          <div className="flex justify-center gap-1 mt-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <span
                key={i}
                className={`text-2xl ${
                  i < Math.floor(coefficient)
                    ? 'text-yellow-400'
                    : i < coefficient
                    ? 'text-yellow-200'
                    : 'text-gray-200'
                }`}
              >
                ⭐
              </span>
            ))}
          </div>

          {/* Quality description */}
          <div className="mt-4 p-3 bg-blue-50 rounded-lg text-center">
            <p className="text-sm text-gray-700">
              {coefficient >= 4.0 && '🌟 Exceptional quality activity!'}
              {coefficient >= 3.0 && coefficient < 4.0 && '⭐ Great quality activity!'}
              {coefficient >= 2.0 && coefficient < 3.0 && '✨ Good quality activity'}
              {coefficient >= 1.0 && coefficient < 2.0 && '💫 Moderate quality activity'}
              {coefficient < 1.0 && '💭 Low quality activity'}
            </p>
            <p className="text-xs text-gray-600 mt-1">
              {coefficient} points per minute logged
            </p>
          </div>

          {/* Option to recalculate existing logs */}
          {coefficient !== activity.coefficient && (
            <div className="mt-4 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
              <label className="flex items-start gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={recalculateExisting}
                  onChange={(e) => setRecalculateExisting(e.target.checked)}
                  className="mt-1"
                />
                <div className="flex-1">
                  <p className="text-sm font-semibold text-gray-900">
                    Update existing activity logs
                  </p>
                  <p className="text-xs text-gray-600 mt-1">
                    Recalculate quality scores for all past logs of this activity using the new coefficient. 
                    This will update your average quality and balance scores.
                  </p>
                </div>
              </label>
            </div>
          )}
        </div>

        <div className="flex gap-3 pt-4">
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
            className="flex-1"
            disabled={isSaving}
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleSave}
            className="flex-1"
            disabled={isSaving || coefficient === activity.coefficient}
            style={
              coefficient !== activity.coefficient
                ? { backgroundColor: activity.color }
                : undefined
            }
          >
            {isSaving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </div>
    </Modal>
  );
};
