import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, LogOut, Settings, Clock, Activity, Flame, Edit2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useActivityStore } from '@/stores/activityStore';
import { useLogsStore } from '@/stores/logsStore';
import { useStatsStore } from '@/stores/statsStore';
import { QualityMeter } from '@/components/Dashboard/QualityMeter';
import { CategoryBreakdown } from '@/components/Dashboard/CategoryBreakdown';
import { EditLogModal } from '@/components/Dashboard/EditLogModal';
import { calculateBalanceScore } from '@/utils/scoreCalculator';
import { format, subDays, startOfWeek, endOfWeek } from 'date-fns';
import { ActivityLog, DailyStats, Activity as ActivityType } from '@/types';
import { query, collection, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { getFirebaseDb, COLLECTIONS } from '@/config/firebase';
import { User } from '@/types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, LineChart, Line } from 'recharts';
import { FirebaseActivityLogRepository } from '@/repositories/firebase/ActivityLogRepository';

export function ChildDashboardPage() {
  const { childId } = useParams<{ childId: string }>();
  const navigate = useNavigate();
  const { user, logout, isParent } = useAuth();
  const { activities, fetchActivities } = useActivityStore();
  const { logs, loadTodayLogs, isLoading: logsLoading } = useLogsStore();
  const { todayStats, loadTodayStats, isLoading: statsLoading, getStreak } = useStatsStore();
  
  const [child, setChild] = useState<User | null>(null);
  const [isLoadingChild, setIsLoadingChild] = useState(true);
  const [streak, setStreak] = useState(0);
  const [editingLog, setEditingLog] = useState<ActivityLog | null>(null);
  const [weeklyStats, setWeeklyStats] = useState<any[]>([]);
  const [isLoadingWeekly, setIsLoadingWeekly] = useState(false);

  useEffect(() => {
    if (childId && user?.familyId) {
      loadChildData();
      fetchActivities(user.familyId);
    }
  }, [childId, user?.familyId]);

  useEffect(() => {
    if (child?.id) {
      loadTodayLogs(child.id);
      loadTodayStats(child.id);
      getStreak(child.id).then(setStreak);
      loadWeeklyStats();
    }
  }, [child?.id]);

  const loadChildData = async () => {
    if (!childId) return;
    
    setIsLoadingChild(true);
    try {
      const db = getFirebaseDb();
      const childDoc = await getDoc(doc(db, COLLECTIONS.USERS, childId));
      
      if (childDoc.exists()) {
        const childData = { id: childDoc.id, ...childDoc.data() } as User;
        // Verify child belongs to parent's family
        if (childData.familyId === user?.familyId) {
          setChild(childData);
        } else {
          navigate('/parent');
          return;
        }
      } else {
        navigate('/parent');
        return;
      }
    } catch (error) {
      console.error('Error loading child:', error);
      navigate('/parent');
    } finally {
      setIsLoadingChild(false);
    }
  };

  const loadWeeklyStats = async () => {
    if (!child?.id) return;
    
    setIsLoadingWeekly(true);
    try {
      const repository = new FirebaseActivityLogRepository();
      const stats = [];
      
      for (let i = 6; i >= 0; i--) {
        const date = format(subDays(new Date(), i), 'yyyy-MM-dd');
        const dayStart = new Date(date);
        dayStart.setHours(0, 0, 0, 0);
        const dayEnd = new Date(date);
        dayEnd.setHours(23, 59, 59, 999);
        
        const dayLogs = await repository.getByDateRange(child.id, {
          start: dayStart,
          end: dayEnd,
        });
        
        const totalMinutes = dayLogs.reduce((sum, log) => sum + log.durationMinutes, 0);
        const totalScore = dayLogs.reduce((sum, log) => sum + log.qualityScore, 0);
        const balanceScore = calculateBalanceScore(dayLogs);
        
        stats.push({
          date: format(new Date(date), 'MMM d'),
          fullDate: date,
          minutes: totalMinutes,
          activities: dayLogs.length,
          score: balanceScore.totalScore,
        });
      }
      
      setWeeklyStats(stats);
    } catch (error) {
      console.error('Error loading weekly stats:', error);
    } finally {
      setIsLoadingWeekly(false);
    }
  };

  if (!isParent) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">You don't have access to this page.</p>
          <Link to="/dashboard" className="text-indigo-600 hover:text-indigo-700">
            Go to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  if (isLoadingChild) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">Loading child data...</p>
      </div>
    );
  }

  if (!child) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Child not found</p>
          <Link to="/parent" className="text-indigo-600 hover:text-indigo-700">
            Back to Parent Dashboard
          </Link>
        </div>
      </div>
    );
  }

  const today = format(new Date(), 'EEEE, MMMM d');
  
  // Calculate stats from logs
  const hasLogs = logs.length > 0;
  const calculatedTotalMinutes = logs.reduce((sum, log) => sum + log.durationMinutes, 0);
  const calculatedTotalScore = logs.reduce((sum, log) => sum + log.qualityScore, 0);
  const calculatedAverageQuality = calculatedTotalMinutes > 0 ? calculatedTotalScore / calculatedTotalMinutes : 0;
  const calculatedBalanceScore = hasLogs ? calculateBalanceScore(logs) : { diversityScore: 0, qualityScore: 0, varietyScore: 0, totalScore: 0 };
  
  const totalMinutes = hasLogs ? calculatedTotalMinutes : (todayStats?.totalMinutes ?? 0);
  const totalScore = hasLogs ? calculatedTotalScore : (todayStats?.totalQualityPoints ?? 0);
  const averageQuality = hasLogs ? calculatedAverageQuality : (todayStats?.averageQuality ?? 0);
  const balanceScore = hasLogs ? calculatedBalanceScore.totalScore : (todayStats?.balanceScore?.totalScore ?? 0);
  
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50 pb-24">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm sticky top-0 z-10 border-b border-gray-100">
        <div className="max-w-lg mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/parent')}
              className="p-2 rounded-full hover:bg-gray-100"
            >
              <ArrowLeft className="h-5 w-5 text-gray-600" />
            </button>
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-xl">
              {child.avatarUrl || '👤'}
            </div>
            <div>
              <h1 className="font-semibold text-gray-900">{child.displayName}'s Dashboard</h1>
              <p className="text-xs text-gray-500">{today}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Link
              to="/parent"
              className="p-2 rounded-full hover:bg-gray-100"
              title="Parent Dashboard"
            >
              <Settings className="h-5 w-5 text-gray-600" />
            </Link>
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

        {/* Quality Meter & Balance Score */}
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
            <div className="text-2xl font-bold text-gray-900">{streak}</div>
            <div className="text-xs text-gray-500 mt-1">Day Streak</div>
          </div>
        </div>

        {/* Weekly Trends */}
        {weeklyStats.length > 0 && (
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <h3 className="text-lg font-bold mb-4">Weekly Trends</h3>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={weeklyStats}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis yAxisId="left" />
                <YAxis yAxisId="right" orientation="right" />
                <Tooltip />
                <Legend />
                <Line 
                  yAxisId="left" 
                  type="monotone" 
                  dataKey="score" 
                  stroke="#6366f1" 
                  name="Balance Score"
                  strokeWidth={2}
                />
                <Bar yAxisId="right" dataKey="minutes" fill="#10b981" name="Minutes" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Category Breakdown */}
        {displayStats ? (
          <CategoryBreakdown stats={displayStats} />
        ) : (
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <h3 className="text-lg font-bold mb-4">Category Breakdown</h3>
            <div className="text-center text-gray-500 py-8">
              {statsLoading ? 'Loading...' : 'No activities logged today.'}
            </div>
          </div>
        )}

        {/* Recent Activities */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Today's Activities</h2>
          
          {logsLoading ? (
            <p className="text-gray-500 text-center py-4">Loading...</p>
          ) : logs.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500 mb-4">
                No activities logged today yet.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {logs.map((log) => {
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
            </div>
          )}
        </div>
      </main>

      {/* Edit Log Modal */}
      {editingLog && (
        <EditLogModal
          log={editingLog}
          isOpen={!!editingLog}
          onClose={async () => {
            setEditingLog(null);
            // Reload data after edit
            if (child?.id) {
              await loadTodayLogs(child.id);
              await loadTodayStats(child.id);
              await getStreak(child.id).then(setStreak);
              await loadWeeklyStats();
            }
          }}
        />
      )}
    </div>
  );
}
