import React from 'react';
import { ActivityCategory, DailyStats } from '@/types';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

interface CategoryBreakdownProps {
  stats: DailyStats;
}

const CATEGORY_COLORS: Record<ActivityCategory, string> = {
  [ActivityCategory.SCREEN]: '#EF4444',
  [ActivityCategory.PHYSICAL]: '#10B981',
  [ActivityCategory.CREATIVE]: '#EC4899',
  [ActivityCategory.LEARNING]: '#059669',
  [ActivityCategory.SOCIAL]: '#3B82F6'
};

const CATEGORY_LABELS: Record<ActivityCategory, string> = {
  [ActivityCategory.SCREEN]: 'Screen',
  [ActivityCategory.PHYSICAL]: 'Physical',
  [ActivityCategory.CREATIVE]: 'Creative',
  [ActivityCategory.LEARNING]: 'Learning',
  [ActivityCategory.SOCIAL]: 'Social'
};

export const CategoryBreakdown: React.FC<CategoryBreakdownProps> = ({ stats }) => {
  const data = Object.entries(stats.categoryBreakdown)
    .filter(([_, minutes]) => minutes > 0)
    .map(([category, minutes]) => ({
      name: CATEGORY_LABELS[category as ActivityCategory],
      value: minutes,
      color: CATEGORY_COLORS[category as ActivityCategory]
    }));

  const formatMinutes = (minutes: number) => {
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  };

  if (data.length === 0) {
    return (
      <div className="bg-white rounded-2xl p-6 shadow-sm">
        <h3 className="text-lg font-bold mb-4">Category Breakdown</h3>
        <div className="text-center text-gray-500 py-8">
          No activities logged today
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm">
      <h3 className="text-lg font-bold mb-4">Category Breakdown</h3>
      <ResponsiveContainer width="100%" height={250}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
            outerRadius={80}
            fill="#8884d8"
            dataKey="value"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip formatter={(value: number) => formatMinutes(value)} />
        </PieChart>
      </ResponsiveContainer>
      <div className="mt-4 space-y-2">
        {Object.entries(stats.categoryBreakdown)
          .filter(([_, minutes]) => minutes > 0)
          .map(([category, minutes]) => (
            <div key={category} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div
                  className="w-4 h-4 rounded"
                  style={{ backgroundColor: CATEGORY_COLORS[category as ActivityCategory] }}
                />
                <span className="text-sm">{CATEGORY_LABELS[category as ActivityCategory]}</span>
              </div>
              <span className="text-sm font-semibold">{formatMinutes(minutes)}</span>
            </div>
          ))}
      </div>
    </div>
  );
};
