import React, { useState } from 'react';
import { ActivityLog } from '@/types';
import { useLogsStore } from '@/stores/logsStore';
import { Modal } from '../shared/Modal';
import { Button } from '../shared/Button';
import { Trash2 } from 'lucide-react';

interface EditLogModalProps {
  log: ActivityLog;
  isOpen: boolean;
  onClose: () => void;
}

export const EditLogModal: React.FC<EditLogModalProps> = ({ log, isOpen, onClose }) => {
  const { updateLog, deleteLog, loadTodayLogs } = useLogsStore();
  const [selectedDuration, setSelectedDuration] = useState<number>(log.duration);
  const [isDeleting, setIsDeleting] = useState(false);

  // Generate duration options based on activity's suggested durations or common values
  const durationOptions = [15, 30, 45, 60, 90, 120, 180];

  const formatDuration = (minutes: number): string => {
    if (minutes < 60) {
      return `${minutes} min`;
    }
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (mins === 0) {
      return `${hours} hr`;
    }
    return `${hours} hr ${mins} min`;
  };

  const handleSave = async () => {
    try {
      await updateLog(log.id, { duration: selectedDuration });
      await loadTodayLogs();
      onClose();
    } catch (error) {
      console.error('Error updating log:', error);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this activity log?')) {
      return;
    }
    setIsDeleting(true);
    try {
      await deleteLog(log.id);
      await loadTodayLogs();
      onClose();
    } catch (error) {
      console.error('Error deleting log:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Edit ${log.activityName}`}
    >
      <div className="space-y-6">
        <div className="text-center">
          <div className="text-6xl mb-4">{log.activityIcon}</div>
          <h3 className="text-xl font-bold">{log.activityName}</h3>
          <p className="text-gray-600 mt-2">Change how long you did this activity</p>
        </div>

        <div>
          <label className="block text-sm font-semibold mb-3 text-center">
            How long did you do this?
          </label>
          <div className="grid grid-cols-2 gap-3">
            {durationOptions.map((duration) => (
              <button
                key={duration}
                type="button"
                onClick={() => setSelectedDuration(duration)}
                className={`py-4 px-4 rounded-xl text-lg font-semibold transition-all ${
                  selectedDuration === duration
                    ? 'bg-blue-500 text-white shadow-lg scale-105'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
                style={
                  selectedDuration === duration
                    ? { backgroundColor: log.activityColor }
                    : undefined
                }
              >
                {formatDuration(duration)}
              </button>
            ))}
          </div>
        </div>

        <div className="bg-blue-50 rounded-lg p-4 text-center">
          <div className="text-sm text-gray-600 mb-1">Quality Points</div>
          <div className="text-2xl font-bold" style={{ color: log.activityColor }}>
            {(selectedDuration * log.activityCoefficient).toFixed(0)} pts
          </div>
          <div className="text-xs text-gray-500 mt-1">
            {selectedDuration} min × {log.activityCoefficient.toFixed(1)} quality
          </div>
        </div>

        <div className="flex gap-3">
          <Button
            type="button"
            variant="danger"
            onClick={handleDelete}
            disabled={isDeleting}
            className="flex-1"
          >
            <Trash2 size={18} className="inline mr-2" />
            Delete
          </Button>
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleSave}
            disabled={selectedDuration === log.duration}
            className="flex-1"
            style={
              selectedDuration !== log.duration
                ? { backgroundColor: log.activityColor }
                : undefined
            }
          >
            Save
          </Button>
        </div>
      </div>
    </Modal>
  );
};
