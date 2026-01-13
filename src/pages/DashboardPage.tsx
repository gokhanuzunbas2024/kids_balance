import React, { useEffect, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useActivityStore } from '@/stores/activityStore';
import { useLogsStore } from '@/stores/logsStore';
import { useStatsStore } from '@/stores/statsStore';
import { ActivityLogger } from '@/components/ActivityLogger/ActivityLogger';
import { QualityMeter } from '@/components/Dashboard/QualityMeter';
import { CategoryBreakdown } from '@/components/Dashboard/CategoryBreakdown';
import { EditLogModal } from '@/components/Dashboard/EditLogModal';
import { EditCoefficientModal } from '@/components/Dashboard/EditCoefficientModal';
import { TimeInputSelector } from '@/components/ActivityLogger/TimeInputSelector';
import { calculateBalanceScore } from '@/utils/scoreCalculator';
import { Plus, LogOut, Settings, Trophy, Clock, Activity, Edit2, Flame, Star } from 'lucide-react';
import { format } from 'date-fns';
import { ActivityLog, DailyStats, Activity as ActivityType } from '@/types';
import { motion, AnimatePresence } from 'framer-motion';

export function DashboardPage() {
  const { user, logout, isParent, isInitialized } = useAuth();
  const { activities, fetchActivities, isLoading: activitiesLoading, seedDefaults } = useActivityStore();
  const { logs, loadTodayLogs, isLoading: logsLoading } = useLogsStore();
  const { todayStats, loadTodayStats, isLoading: statsLoading, getStreak } = useStatsStore();
  const { createLog } = useLogsStore();
  const [view, setView] = useState<'dashboard' | 'logger'>('dashboard');
  const [editingLog, setEditingLog] = useState<ActivityLog | null>(null);
  const [selectedActivity, setSelectedActivity] = useState<ActivityType | null>(null);
  const [editingCoefficient, setEditingCoefficient] = useState<ActivityType | null>(null);
  const [streak, setStreak] = useState<number>(0);
  
  // Redirect parents to parent dashboard - this page is for children only
  // Must be after all hooks are called
  if (isInitialized && isParent) {
    return <Navigate to="/parent" replace />;
  }

  useEffect(() => {
    if (user?.familyId) {
      // Seed default activities if none exist
      fetchActivities(user.familyId).then(() => {
        if (activities.length === 0) {
          seedDefaults(user.familyId, user.id);
        }
      });
    }
  }, [user?.familyId, user?.id]);

  useEffect(() => {
    if (user?.id) {
      console.log('📊 Dashboard: Loading logs and stats for user:', user.id);
      loadTodayLogs(user.id);
      loadTodayStats(user.id);
      // Load streak separately
      getStreak(user.id).then((streakValue) => {
        setStreak(streakValue);
        console.log('✅ Dashboard: Streak loaded:', streakValue);
      });
    }
  }, [user?.id, loadTodayLogs, loadTodayStats, getStreak]);

  // Calculate derived values - must be before any conditional returns
  const today = format(new Date(), 'EEEE, MMMM d');
  const hasLogs = logs.length > 0;
  const calculatedTotalMinutes = logs.reduce((sum, log) => sum + log.durationMinutes, 0);
  const calculatedTotalScore = logs.reduce((sum, log) => sum + log.qualityScore, 0);
  const calculatedAverageQuality = calculatedTotalMinutes > 0 ? calculatedTotalScore / calculatedTotalMinutes : 0;
  const calculatedBalanceScore = hasLogs ? calculateBalanceScore(logs) : { diversityScore: 0, qualityScore: 0, varietyScore: 0, totalScore: 0 };
  const totalMinutes = hasLogs ? calculatedTotalMinutes : (todayStats?.totalMinutes ?? 0);
  const totalScore = hasLogs ? calculatedTotalScore : (todayStats?.totalQualityPoints ?? 0);
  const averageQuality = hasLogs ? calculatedAverageQuality : (todayStats?.averageQuality ?? 0);
  const balanceScore = hasLogs ? calculatedBalanceScore.totalScore : (todayStats?.balanceScore?.totalScore ?? 0);
  const displayStreak = streak > 0 ? streak : ((todayStats as any)?.streak ?? 0);
  const displayStats: DailyStats | null = hasLogs ? {
    date: format(new Date(), 'yyyy-MM-dd'),
    totalMinutes: calculatedTotalMinutes,
    categoryBreakdown: logs.reduce((acc, log) => {
      acc[log.activityCategory] = (acc[log.activityCategory] || 0) + log.durationMinutes;
      return acc;
    }, {
      'screen': 0,
      'physical': 0,
      'creative': 0,
      'educational': 0,
      'social': 0,
      'chores': 0,
      'rest': 0,
      'other': 0,
    } as Record<string, number>) as any,
    activitiesLogged: logs.length,
    uniqueActivities: new Set(logs.map(l => l.activityId)).size,
    totalQualityPoints: calculatedTotalScore,
    averageQuality: calculatedAverageQuality,
    balanceScore: calculatedBalanceScore,
    badgesEarned: [],
    calculatedAt: new Date(),
  } : (todayStats || null);

  // Debug logging - must be before any conditional returns
  useEffect(() => {
    console.log('📊 Dashboard State Update:', {
      logsCount: logs.length,
      hasLogs,
      totalMinutes,
      totalScore,
      averageQuality,
      balanceScore,
      displayStats: displayStats ? 'exists' : 'null',
      logsLoading,
      statsLoading,
      logsDetails: logs.map(log => ({
        id: log.id,
        name: log.activityName,
        duration: log.durationMinutes,
        qualityScore: log.qualityScore,
        coefficient: log.durationMinutes > 0 ? log.qualityScore / log.durationMinutes : 0,
      })),
    });
  }, [logs, hasLogs, totalMinutes, totalScore, averageQuality, balanceScore, displayStats, logsLoading, statsLoading]);

  // Early returns - must be after ALL hooks
  if (view === 'logger') {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-2xl mx-auto pb-20">
          <div className="sticky top-0 bg-white border-b border-gray-200 p-4 flex items-center justify-between z-10">
            <h2 className="text-xl font-bold text-gray-900">Log Activity</h2>
            <button
              onClick={() => setView('dashboard')}
              className="text-gray-600 hover:text-gray-900"
            >
              ← Back
            </button>
          </div>
          <ActivityLogger />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50 pb-24">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm sticky top-0 z-10 border-b border-gray-100">
        <div className="max-w-lg mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-xl">
              {user?.avatarUrl || '👋'}
            </div>
            <div>
              <h1 className="font-semibold text-gray-900">Hi, {user?.displayName}!</h1>
              <p className="text-xs text-gray-500">{today}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {isParent && (
              <Link
                to="/parent"
                className="p-2 rounded-full hover:bg-gray-100"
              >
                <Settings className="h-5 w-5 text-gray-600" />
              </Link>
            )}
            <button
              onClick={logout}
              className="p-2 rounded-full hover:bg-gray-100"
            >
              <LogOut className="h-5 w-5 text-gray-600" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-lg mx-auto px-4 py-6 space-y-6">
        {/* Loading State */}
        {(statsLoading || logsLoading) && (
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 text-center">
            <p className="text-gray-500">Loading dashboard data...</p>
          </div>
        )}

        {/* Quality Meter & Balance Score - Always show */}
        <QualityMeter
          averageQuality={averageQuality}
          totalScore={balanceScore}
        />

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 text-center">
            <Clock className="w-6 h-6 mx-auto mb-2 text-blue-500" />
            <div className="text-2xl font-bold text-gray-900">
              {Math.floor(totalMinutes / 60)}h {totalMinutes % 60}m
            </div>
            <div className="text-xs text-gray-500 mt-1">Total Time</div>
          </div>
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 text-center">
            <Activity className="w-6 h-6 mx-auto mb-2 text-green-500" />
            <div className="text-2xl font-bold text-gray-900">{logs.length}</div>
            <div className="text-xs text-gray-500 mt-1">Activities</div>
          </div>
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 text-center">
            <Flame className="w-6 h-6 mx-auto mb-2 text-orange-500" />
            <div className="text-2xl font-bold text-gray-900">{displayStreak}</div>
            <div className="text-xs text-gray-500 mt-1">Day Streak</div>
          </div>
        </div>

        {/* Category Breakdown - Always show, handles empty state internally */}
        {displayStats ? (
          <CategoryBreakdown stats={displayStats} />
        ) : (
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <h3 className="text-lg font-bold mb-4">Category Breakdown</h3>
            <div className="text-center text-gray-500 py-8">
              {statsLoading ? 'Loading...' : 'No activities logged today. Start logging to see your breakdown!'}
            </div>
          </div>
        )}

        {/* Today's Activities */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Today's Activities</h2>
            <span className="text-xs font-medium text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full">
              {format(new Date(), 'MMM d, yyyy')}
            </span>
          </div>
          
          {logsLoading ? (
            <p className="text-gray-500 text-center py-4">Loading...</p>
          ) : logs.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500 mb-4">
                No activities logged today yet.
              </p>
              <button
                onClick={() => setView('logger')}
                className="px-6 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 font-medium"
              >
                Log Your First Activity
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {logs.slice(0, 5).map((log) => {
                const coefficient = log.durationMinutes > 0 ? log.qualityScore / log.durationMinutes : 0;
                return (
                  <div
                    key={log.id}
                    className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
                  >
                    <div className="text-3xl">{log.activityIcon}</div>
                    <div className="flex-1">
                      <p className="font-semibold text-gray-900">{log.activityName}</p>
                      <p className="text-sm text-gray-500">
                        {log.durationMinutes} min • {Math.round(log.qualityScore)} pts
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-gray-500 mb-1">
                        {Array.from({ length: Math.floor(coefficient) }).map((_, i) => (
                          <span key={i}>⭐</span>
                        ))}
                      </div>
                    </div>
                    <button
                      onClick={() => setEditingLog(log)}
                      className="p-2 text-gray-500 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
                      title="Edit activity"
                    >
                      <Edit2 size={18} />
                    </button>
                  </div>
                );
              })}
              {logs.length > 5 && (
                <button
                  onClick={() => setView('logger')}
                  className="w-full py-2 text-sm text-indigo-600 hover:text-indigo-700"
                >
                  View all {logs.length} activities
                </button>
              )}
            </div>
          )}
        </div>

        {/* Available Activities */}
        {activitiesLoading ? (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <p className="text-gray-500 text-center">Loading activities...</p>
          </div>
        ) : activities.length > 0 && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Available Activities</h2>
            <div className="grid grid-cols-3 gap-3">
              {activities.slice(0, 6).map((activity) => (
                <div
                  key={activity.id}
                  className="relative flex flex-col items-center p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors group"
                >
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setSelectedActivity(activity)}
                    className="flex flex-col items-center w-full"
                  >
                    <div className="text-3xl mb-1">{activity.icon}</div>
                    <p className="text-xs font-medium text-gray-700 text-center">
                      {activity.name}
                    </p>
                    <div className="flex items-center gap-1 mt-1">
                      {Array.from({ length: Math.floor(activity.coefficient) }).map((_, i) => (
                        <span key={i} className="text-yellow-400 text-xs">⭐</span>
                      ))}
                    </div>
                  </motion.button>
                  {isParent && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingCoefficient(activity);
                      }}
                      className="absolute top-1 right-1 p-1.5 bg-white rounded-full shadow-sm opacity-0 group-hover:opacity-100 transition-opacity hover:bg-gray-100"
                      title="Edit quality coefficient"
                    >
                      <Edit2 size={14} className="text-gray-600" />
                    </button>
                  )}
                </div>
              ))}
            </div>
            {activities.length > 6 && (
              <button
                onClick={() => setView('logger')}
                className="w-full mt-4 py-2 text-sm text-indigo-600 hover:text-indigo-700"
              >
                View all {activities.length} activities
              </button>
            )}
          </div>
        )}
      </main>

      {/* Floating Action Button */}
      <button
        onClick={() => setView('logger')}
        className="fixed bottom-6 right-6 w-14 h-14 bg-indigo-600 rounded-full shadow-lg flex items-center justify-center text-white hover:bg-indigo-700 transition-colors z-20"
      >
        <Plus className="h-6 w-6" />
      </button>

      {/* Edit Log Modal */}
      {editingLog && (
        <EditLogModal
          log={editingLog}
          isOpen={!!editingLog}
          onClose={() => {
            setEditingLog(null);
            // Reload data after edit
            if (user?.id) {
              loadTodayLogs(user.id);
              loadTodayStats(user.id);
              // Reload streak after editing
              getStreak(user.id).then(setStreak);
            }
          }}
        />
      )}

      {/* Activity Time Selector Modal */}
      <AnimatePresence>
        {selectedActivity && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
            onClick={() => setSelectedActivity(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl w-full max-w-md overflow-hidden"
            >
              <TimeInputSelector
                activity={selectedActivity}
                onConfirm={async (duration) => {
                  if (!user?.id || !user?.familyId) return;
                  try {
                    await createLog({
                      activityId: selectedActivity.id,
                      userId: user.id,
                      familyId: user.familyId,
                      durationMinutes: duration,
                      loggedAt: new Date(),
                    });
                    setSelectedActivity(null);
                    // Reload data
                    await loadTodayLogs(user.id);
                    await loadTodayStats(user.id);
                    // Reload streak after logging activity
                    const newStreak = await getStreak(user.id);
                    setStreak(newStreak);
                  } catch (error) {
                    console.error('Error creating log:', error);
                  }
                }}
                onCancel={() => setSelectedActivity(null)}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Edit Coefficient Modal */}
      {editingCoefficient && (
        <EditCoefficientModal
          activity={editingCoefficient}
          isOpen={!!editingCoefficient}
          onClose={async () => {
            setEditingCoefficient(null);
            // Reload activities and stats to show updated values
            if (user?.familyId) {
              await fetchActivities(user.familyId);
            }
            if (user?.id) {
              await loadTodayLogs(user.id);
              await loadTodayStats(user.id);
            }
          }}
        />
      )}
    </div>
  );
}
