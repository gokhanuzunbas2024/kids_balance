import React, { useState } from 'react';
import { ActivityCategory, CreateActivityDTO } from '@/types';
import { useActivityStore } from '@/stores/activityStore';
import { useAuth } from '@/contexts/AuthContext';
import { Modal } from '../shared/Modal';
import { Button } from '../shared/Button';
import { Plus } from 'lucide-react';

const CATEGORY_OPTIONS = [
  { value: 'screen' as ActivityCategory, label: 'Screen', emoji: '📺', color: '#64748b' },
  { value: 'physical' as ActivityCategory, label: 'Physical', emoji: '🏃', color: '#22c55e' },
  { value: 'creative' as ActivityCategory, label: 'Creative', emoji: '🎨', color: '#f59e0b' },
  { value: 'educational' as ActivityCategory, label: 'Educational', emoji: '📚', color: '#3b82f6' },
  { value: 'social' as ActivityCategory, label: 'Social', emoji: '👫', color: '#ec4899' },
  { value: 'chores' as ActivityCategory, label: 'Chores', emoji: '🧹', color: '#84cc16' },
  { value: 'rest' as ActivityCategory, label: 'Rest', emoji: '😴', color: '#a78bfa' },
  { value: 'other' as ActivityCategory, label: 'Other', emoji: '📌', color: '#6b7280' },
];

const ICON_OPTIONS = ['📺', '🎮', '📚', '🎹', '🏃', '🚴', '🎨', '🧱', '👫', '🎲', '✍️', '🔬', '⚽', '🎯', '🎪', '🎭', '🎵', '🎬', '🧩', '🎪', '🏀', '⚾', '🎾', '🏊', '🧘', '🎤', '🎸', '🎺', '🥁', '🎻'];

export const AddActivityButton: React.FC = () => {
  const { user } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { createActivity, fetchActivities } = useActivityStore();
  const [formData, setFormData] = useState<Omit<CreateActivityDTO, 'familyId' | 'createdBy'>>({
    name: '',
    category: 'creative',
    icon: '🎨',
    color: '#f59e0b',
    coefficient: 3.0,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !user?.familyId) return;

    try {
      await createActivity({
        ...formData,
        familyId: user.familyId,
        createdBy: user.id,
      });
      await fetchActivities(user.familyId); // Reload to show new activity
      setIsModalOpen(false);
      setFormData({
        name: '',
        category: 'creative',
        icon: '🎨',
        color: '#f59e0b',
        coefficient: 3.0,
      });
    } catch (error) {
      console.error('Error creating activity:', error);
    }
  };

  const selectedCategory = CATEGORY_OPTIONS.find(c => c.value === formData.category);

  return (
    <>
      <button
        onClick={() => setIsModalOpen(true)}
        className="fixed bottom-28 right-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-full p-4 shadow-xl hover:shadow-2xl hover:scale-110 transition-all z-20"
        aria-label="Add new activity"
        title="Add your own activity"
      >
        <Plus size={28} strokeWidth={3} />
      </button>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Create Your Own Activity! 🎉"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold mb-2">What's the activity called?</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., Playing Soccer"
              className="w-full px-4 py-3 text-lg border-2 border-gray-300 rounded-xl focus:border-blue-500 focus:outline-none"
              required
              maxLength={30}
            />
          </div>

          <div>
            <label className="block text-sm font-semibold mb-2">What type is it?</label>
            <div className="grid grid-cols-2 gap-2">
              {CATEGORY_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => {
                    setFormData({
                      ...formData,
                      category: option.value,
                      color: option.color
                    });
                  }}
                  className={`p-3 rounded-xl border-2 transition-all ${
                    formData.category === option.value
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="text-2xl mb-1">{option.emoji}</div>
                  <div className="text-sm font-semibold">{option.label}</div>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold mb-2">Pick an emoji!</label>
            <div className="grid grid-cols-8 gap-2 max-h-40 overflow-y-auto">
              {ICON_OPTIONS.map((icon) => (
                <button
                  key={icon}
                  type="button"
                  onClick={() => setFormData({ ...formData, icon })}
                  className={`text-2xl p-2 rounded-lg border-2 transition-all ${
                    formData.icon === icon
                      ? 'border-blue-500 bg-blue-50 scale-110'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  {icon}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold mb-2">
              How valuable is this? {formData.coefficient.toFixed(1)} ⭐
            </label>
            <input
              type="range"
              min="1"
              max="5"
              step="0.5"
              value={formData.coefficient}
              onChange={(e) => setFormData({ ...formData, coefficient: parseFloat(e.target.value) })}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>Just for fun (1⭐)</span>
              <span>Super valuable! (5⭐)</span>
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setIsModalOpen(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button type="submit" className="flex-1">
              Create! ✨
            </Button>
          </div>
        </form>
      </Modal>
    </>
  );
};
