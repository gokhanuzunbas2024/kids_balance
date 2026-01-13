import React, { useState, useEffect } from 'react';
import { Activity, ActivityCategory, CreateActivityDTO, UpdateActivityDTO } from '@/types';
import { useActivityStore } from '@/stores/activityStore';
import { useAuth } from '@/contexts/AuthContext';
import { Modal } from '../shared/Modal';
import { Button } from '../shared/Button';
import { Trash2, Star, Edit2 } from 'lucide-react';

const CATEGORY_OPTIONS = [
  { value: 'screen', label: 'Screen', color: '#EF4444' },
  { value: 'physical', label: 'Physical', color: '#10B981' },
  { value: 'creative', label: 'Creative', color: '#EC4899' },
  { value: 'educational', label: 'Educational', color: '#059669' },
  { value: 'social', label: 'Social', color: '#3B82F6' },
  { value: 'chores', label: 'Chores', color: '#84cc16' },
  { value: 'rest', label: 'Rest', color: '#a78bfa' },
  { value: 'other', label: 'Other', color: '#6b7280' },
];

const ICON_OPTIONS = ['📺', '🎮', '📚', '🎹', '🏃', '🚴', '🎨', '🧱', '👫', '🎲', '✍️', '🔬', '⚽', '🎯', '🎪', '🎭'];

export const ActivityManager: React.FC = () => {
  const { user } = useAuth();
  const { activities, createActivity, updateActivity, deleteActivity, fetchActivities } = useActivityStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingActivity, setEditingActivity] = useState<Activity | null>(null);
  const [formData, setFormData] = useState<Omit<CreateActivityDTO, 'familyId' | 'createdBy'>>({
    name: '',
    category: 'screen',
    icon: '📺',
    color: '#3B82F6',
    coefficient: 3.0,
  });

  useEffect(() => {
    if (user?.familyId) {
      fetchActivities(user.familyId);
    }
  }, [user?.familyId, fetchActivities]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.familyId || !user?.id) return;
    
    try {
      if (editingActivity) {
        await updateActivity(editingActivity.id, formData);
      } else {
        await createActivity({
          ...formData,
          familyId: user.familyId,
          createdBy: user.id,
        });
      }
      setIsModalOpen(false);
      setEditingActivity(null);
      setFormData({
        name: '',
        category: 'screen',
        icon: '📺',
        color: '#3B82F6',
        coefficient: 3.0,
      });
      // Reload activities
      if (user.familyId) {
        await fetchActivities(user.familyId);
      }
    } catch (error) {
      console.error('Error saving activity:', error);
    }
  };

  const handleEdit = (activity: Activity) => {
    setEditingActivity(activity);
    setFormData({
      name: activity.name,
      category: activity.category,
      icon: activity.icon,
      color: activity.color,
      coefficient: activity.coefficient,
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this activity?')) {
      await deleteActivity(id);
    }
  };

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Manage Activities</h2>
        <Button onClick={() => setIsModalOpen(true)}>Add Activity</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {activities.map((activity) => (
          <div
            key={activity.id}
            className="bg-white rounded-xl p-4 shadow-sm border-2 border-gray-100"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="text-4xl">{activity.icon}</div>
                <div>
                  <h3 className="font-bold text-lg">{activity.name}</h3>
                  <div className="text-sm text-gray-600 capitalize">{activity.category}</div>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleEdit(activity)}
                  className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <Edit2 size={20} />
                </button>
                {!activity.isDefault && (
                  <button
                    onClick={() => handleDelete(activity.id)}
                    className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 size={20} />
                  </button>
                )}
              </div>
            </div>
              <div className="flex items-center justify-between">
              <div className="flex gap-1">
                {Array.from({ length: Math.floor(activity.coefficient) }).map((_, i) => (
                  <span key={i} className="text-yellow-400">⭐</span>
                ))}
              </div>
              <div
                className="px-3 py-1 rounded-full text-xs font-semibold text-white"
                style={{ backgroundColor: activity.color }}
              >
                {activity.coefficient.toFixed(1)}x
              </div>
            </div>
            {!activity.isActive && (
              <div className="mt-2 text-xs text-gray-500 italic">Archived</div>
            )}
          </div>
        ))}
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingActivity(null);
        }}
        title={editingActivity ? 'Edit Activity' : 'Add Activity'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold mb-2">Activity Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-2 border rounded-lg"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-semibold mb-2">Category</label>
            <select
              value={formData.category}
              onChange={(e) => {
                const category = e.target.value as ActivityCategory;
                const option = CATEGORY_OPTIONS.find(opt => opt.value === category);
                setFormData({
                  ...formData,
                  category,
                  color: option?.color || formData.color
                });
              }}
              className="w-full px-4 py-2 border rounded-lg"
            >
              {CATEGORY_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold mb-2">Icon</label>
            <div className="grid grid-cols-8 gap-2">
              {ICON_OPTIONS.map((icon) => (
                <button
                  key={icon}
                  type="button"
                  onClick={() => setFormData({ ...formData, icon })}
                  className={`text-2xl p-2 rounded-lg border-2 ${
                    formData.icon === icon ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                  }`}
                >
                  {icon}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold mb-2">
              Quality Coefficient: {formData.coefficient.toFixed(1)}
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
              <span>Low (1.0)</span>
              <span>High (5.0)</span>
            </div>
          </div>


          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setIsModalOpen(false);
                setEditingActivity(null);
              }}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button type="submit" className="flex-1">
              {editingActivity ? 'Update' : 'Create'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
