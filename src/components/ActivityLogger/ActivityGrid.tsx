import React from 'react';
import { Activity } from '@/types';
import { motion } from 'framer-motion';

interface ActivityGridProps {
  activities: Activity[];
  onActivitySelect: (activity: Activity) => void;
  onRetryLoad?: () => void;
}

export const ActivityGrid: React.FC<ActivityGridProps> = ({ activities, onActivitySelect, onRetryLoad }) => {
  const favorites = activities.filter(a => a.isFavorite);
  const others = activities.filter(a => !a.isFavorite);

  const handleRetry = async () => {
    if (onRetryLoad) {
      await onRetryLoad();
    }
  };

  if (activities.length === 0) {
    return (
      <div className="bg-white rounded-2xl p-8 shadow-sm text-center">
        <div className="text-6xl mb-4">📝</div>
        <h2 className="text-xl font-bold mb-2">No activities yet</h2>
        <p className="text-gray-600 mb-4">
          Activities are loading... Click the button below to try loading them again, or use the + button to create your own!
        </p>
        <button
          onClick={handleRetry}
          className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 font-semibold"
        >
          Load Activities
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {favorites.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-gray-500 mb-3">Favorites</h3>
          <div className="grid grid-cols-2 gap-3">
            {favorites.map((activity) => (
              <ActivityCard
                key={activity.id}
                activity={activity}
                onClick={() => onActivitySelect(activity)}
              />
            ))}
          </div>
        </div>
      )}

      <div>
        {favorites.length > 0 && (
          <h3 className="text-sm font-semibold text-gray-500 mb-3">All Activities</h3>
        )}
        <div className="grid grid-cols-2 gap-3">
          {others.map((activity) => (
            <ActivityCard
              key={activity.id}
              activity={activity}
              onClick={() => onActivitySelect(activity)}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

interface ActivityCardProps {
  activity: Activity;
  onClick: () => void;
}

const ActivityCard: React.FC<ActivityCardProps> = ({ activity, onClick }) => {
  return (
    <motion.button
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      className="flex flex-col items-center justify-center p-6 bg-white rounded-2xl shadow-sm border-2 border-gray-100 hover:border-blue-300 hover:shadow-md transition-all"
      style={{ borderColor: activity.isFavorite ? activity.color : undefined }}
    >
      <div className="text-5xl mb-2">{activity.icon}</div>
      <div className="text-sm font-semibold text-gray-800 text-center">
        {activity.name}
      </div>
      <div className="flex gap-1 mt-1">
        {Array.from({ length: Math.floor(activity.coefficient) }).map((_, i) => (
          <span key={i} className="text-yellow-400">⭐</span>
        ))}
      </div>
    </motion.button>
  );
};
