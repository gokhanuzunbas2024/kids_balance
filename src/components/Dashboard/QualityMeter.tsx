import React from 'react';
import { getQualityTier } from '@/utils/scoreCalculator';
import { motion } from 'framer-motion';

interface QualityMeterProps {
  averageQuality: number;
  totalScore: number;
}

export const QualityMeter: React.FC<QualityMeterProps> = ({ averageQuality, totalScore }) => {
  const tier = getQualityTier(averageQuality);

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm">
      <div className="text-center mb-4">
        <div className="text-6xl mb-2">{tier.emoji}</div>
        <h3 className="text-xl font-bold mb-1">{tier.tier}</h3>
        <p className="text-gray-600 text-sm">{tier.message}</p>
      </div>

      <div className="mt-6">
        <div className="flex justify-between text-sm mb-2">
          <span className="text-gray-600">Balance Score</span>
          <span className="font-bold" style={{ color: tier.color }}>
            {totalScore}/100
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${totalScore}%` }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            className="h-full rounded-full"
            style={{ backgroundColor: tier.color }}
          />
        </div>
      </div>

      <div className="mt-4">
        <div className="flex justify-between text-sm mb-2">
          <span className="text-gray-600">Average Quality</span>
          <span className="font-bold">{averageQuality.toFixed(1)}/5.0</span>
        </div>
        <div className="flex gap-1">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className={`flex-1 h-2 rounded ${
                i < Math.floor(averageQuality)
                  ? 'bg-yellow-400'
                  : i < averageQuality
                  ? 'bg-yellow-200'
                  : 'bg-gray-200'
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
};
