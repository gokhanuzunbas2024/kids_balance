import React, { useState } from 'react';
import { Activity } from '@/types';
import { Button } from '../shared/Button';
import { motion } from 'framer-motion';

interface TimeInputSelectorProps {
  activity: Activity;
  onConfirm: (duration: number) => void;
  onCancel: () => void;
}

export const TimeInputSelector: React.FC<TimeInputSelectorProps> = ({
  activity,
  onConfirm,
  onCancel
}) => {
  const [selectedDuration, setSelectedDuration] = useState<number | null>(null);
  // Use default presets since new Activity type doesn't have suggestedDurations
  const presets = [15, 30, 60, 120];

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

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center p-8 bg-white min-h-screen"
    >
      <div className="text-7xl mb-4">{activity.icon}</div>
      <h2 className="text-3xl font-bold mb-2">{activity.name}</h2>
      <p className="text-gray-600 mb-8">How long did you do this?</p>

      <div className="grid grid-cols-2 gap-4 w-full max-w-sm mb-8">
        {presets.map((duration) => (
          <motion.button
            key={duration}
            whileTap={{ scale: 0.95 }}
            onClick={() => setSelectedDuration(duration)}
            className={`py-6 px-4 rounded-2xl text-lg font-semibold transition-all ${
              selectedDuration === duration
                ? 'bg-blue-500 text-white shadow-lg'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
            style={
              selectedDuration === duration
                ? { backgroundColor: activity.color }
                : undefined
            }
          >
            {formatDuration(duration)}
          </motion.button>
        ))}
      </div>

      <div className="flex gap-4 w-full max-w-sm">
        <Button
          variant="secondary"
          onClick={onCancel}
          className="flex-1"
        >
          Cancel
        </Button>
        <Button
          variant="primary"
          onClick={() => selectedDuration && onConfirm(selectedDuration)}
          disabled={!selectedDuration}
          className="flex-1"
          style={
            selectedDuration
              ? { backgroundColor: activity.color }
              : undefined
          }
        >
          Done ✓
        </Button>
      </div>
    </motion.div>
  );
};
