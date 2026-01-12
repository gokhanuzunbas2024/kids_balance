import React, { useState } from 'react';
import { ActivityManager } from './ActivityManager';
import { useStatsStore } from '@/stores/statsStore';
import { useLogsStore } from '@/stores/logsStore';
import { useSettingsStore } from '@/stores/settingsStore';
import { format, subDays } from 'date-fns';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Modal } from '../shared/Modal';
import { Button } from '../shared/Button';

export const ParentDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'overview' | 'activities' | 'settings'>('overview');
  const [isNameModalOpen, setIsNameModalOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const { todayStats } = useStatsStore();
  const { logs } = useLogsStore();
  const { settings, loadSettings, setChildName } = useSettingsStore();

  // Get last 7 days of stats
  const [weeklyStats, setWeeklyStats] = React.useState<any[]>([]);

  React.useEffect(() => {
    loadSettings();
    const loadWeeklyStats = async () => {
      const stats = [];
      for (let i = 6; i >= 0; i--) {
        const date = format(subDays(new Date(), i), 'yyyy-MM-dd');
        const stat = await useStatsStore.getState().loadStatsForDate(date);
        if (stat) {
          stats.push({
            date: format(new Date(date), 'MMM d'),
            score: stat.balanceScore.totalScore,
            minutes: stat.totalMinutes,
            activities: stat.activitiesLogged
          });
        }
      }
      setWeeklyStats(stats);
    };
    loadWeeklyStats();
  }, [logs, loadSettings]);

  const handleUpdateName = async () => {
    if (newName.trim()) {
      await setChildName(newName.trim());
      setIsNameModalOpen(false);
      setNewName('');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4">
          <h1 className="text-2xl font-bold py-4">Parent Dashboard</h1>
          <div className="flex gap-2 border-b">
            <button
              onClick={() => setActiveTab('overview')}
              className={`px-4 py-2 font-semibold border-b-2 transition-colors ${
                activeTab === 'overview'
                  ? 'border-blue-500 text-blue-500'
                  : 'border-transparent text-gray-600'
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab('activities')}
              className={`px-4 py-2 font-semibold border-b-2 transition-colors ${
                activeTab === 'activities'
                  ? 'border-blue-500 text-blue-500'
                  : 'border-transparent text-gray-600'
              }`}
            >
              Manage Activities
            </button>
            <button
              onClick={() => setActiveTab('settings')}
              className={`px-4 py-2 font-semibold border-b-2 transition-colors ${
                activeTab === 'settings'
                  ? 'border-blue-500 text-blue-500'
                  : 'border-transparent text-gray-600'
              }`}
            >
              Settings
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-4">
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {todayStats && (
              <div className="bg-white rounded-2xl p-6 shadow-sm">
                <h2 className="text-xl font-bold mb-4">Today's Summary</h2>
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-blue-500">{todayStats.totalMinutes}</div>
                    <div className="text-sm text-gray-600">Minutes</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-green-500">{todayStats.activitiesLogged}</div>
                    <div className="text-sm text-gray-600">Activities</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-yellow-500">{todayStats.balanceScore.totalScore}</div>
                    <div className="text-sm text-gray-600">Balance Score</div>
                  </div>
                </div>
              </div>
            )}

            {weeklyStats.length > 0 && (
              <div className="bg-white rounded-2xl p-6 shadow-sm">
                <h2 className="text-xl font-bold mb-4">Weekly Trends</h2>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={weeklyStats}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis yAxisId="left" />
                    <YAxis yAxisId="right" orientation="right" />
                    <Tooltip />
                    <Legend />
                    <Bar yAxisId="left" dataKey="score" fill="#3B82F6" name="Balance Score" />
                    <Bar yAxisId="right" dataKey="minutes" fill="#10B981" name="Total Minutes" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        )}

        {activeTab === 'activities' && <ActivityManager />}

        {activeTab === 'settings' && (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl p-6 shadow-sm">
              <h2 className="text-xl font-bold mb-4">Child Settings</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Child's Name
                  </label>
                  <div className="flex items-center gap-3">
                    <div className="flex-1 px-4 py-2 bg-gray-50 rounded-lg">
                      {settings?.childName || 'Not set'}
                    </div>
                    <Button
                      onClick={() => {
                        setNewName(settings?.childName || '');
                        setIsNameModalOpen(true);
                      }}
                    >
                      Change
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <Modal
        isOpen={isNameModalOpen}
        onClose={() => {
          setIsNameModalOpen(false);
          setNewName('');
        }}
        title="Change Child's Name"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              New Name
            </label>
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Enter child's name"
              className="w-full px-4 py-2 border rounded-lg"
              maxLength={20}
              autoFocus
            />
          </div>
          <div className="flex gap-3">
            <Button
              variant="secondary"
              onClick={() => {
                setIsNameModalOpen(false);
                setNewName('');
              }}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={handleUpdateName}
              disabled={!newName.trim()}
              className="flex-1"
            >
              Save
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
