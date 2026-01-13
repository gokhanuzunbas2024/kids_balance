import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Plus, Settings, LogOut, Users, Activity, BarChart3, UserPlus, Edit2, Trash2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { authService } from '@/services/authService';
import { useActivityStore } from '@/stores/activityStore';
import { useLogsStore } from '@/stores/logsStore';
import { useStatsStore } from '@/stores/statsStore';
import { ActivityManager } from '@/components/Parent/ActivityManager';
import { Modal } from '@/components/shared/Modal';
import { Button } from '@/components/shared/Button';
import { query, collection, where, getDocs, doc, getDoc, orderBy, limit, Timestamp } from 'firebase/firestore';
import { getFirebaseDb, COLLECTIONS } from '@/config/firebase';
import { User, AddChildCredentials, ActivityLog } from '@/types';
import { format, subDays } from 'date-fns';
import toast from 'react-hot-toast';
import { FirebaseActivityLogRepository } from '@/repositories/firebase/ActivityLogRepository';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, LineChart, Line } from 'recharts';
import { calculateBalanceScore } from '@/utils/scoreCalculator';

export function ParentDashboardPage() {
  const { user, logout, isParent } = useAuth();
  const navigate = useNavigate();
  const { activities, fetchActivities } = useActivityStore();
  const { loadTodayLogs } = useLogsStore();
  const { loadTodayStats } = useStatsStore();
  
  const [activeTab, setActiveTab] = useState<'overview' | 'children' | 'activities' | 'settings'>('overview');
  const [children, setChildren] = useState<User[]>([]);
  const [isLoadingChildren, setIsLoadingChildren] = useState(false);
  const [isAddChildModalOpen, setIsAddChildModalOpen] = useState(false);
  const [familyCode, setFamilyCode] = useState('');
  const [familyStats, setFamilyStats] = useState<any>(null);
  const [childStats, setChildStats] = useState<Record<string, any>>({});
  const [recentActivities, setRecentActivities] = useState<any[]>([]);
  const [isLoadingActivities, setIsLoadingActivities] = useState(false);
  const [selectedChildFilter, setSelectedChildFilter] = useState<string | 'all'>('all');
  const [weeklyTrends, setWeeklyTrends] = useState<Record<string, any[]>>({});
  const [isLoadingTrends, setIsLoadingTrends] = useState(false);
  
  // Add child form
  const [childForm, setChildForm] = useState<AddChildCredentials>({
    displayName: '',
    pin: '',
    confirmPin: '',
    avatarUrl: null,
    dateOfBirth: null,
  });

  useEffect(() => {
    if (user?.familyId) {
      console.log('🔄 ParentDashboard: Initial load for family:', user.familyId);
      fetchActivities(user.familyId);
      loadFamilyChildren();
      loadFamilyCode();
      // Don't call loadFamilyStats here - it will be called after children are loaded
    }
  }, [user?.familyId]);

  const loadFamilyChildren = async () => {
    if (!user?.familyId) return;
    
    setIsLoadingChildren(true);
    try {
      const db = getFirebaseDb();
      const usersQuery = query(
        collection(db, COLLECTIONS.USERS),
        where('familyId', '==', user.familyId),
        where('role', '==', 'child')
      );
      
      const snapshot = await getDocs(usersQuery);
      const childUsers = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as User[];
      
      setChildren(childUsers);
    } catch (error) {
      console.error('Error loading children:', error);
      toast.error('Failed to load children');
    } finally {
      setIsLoadingChildren(false);
    }
  };

  const loadFamilyCode = async () => {
    if (!user?.familyId) return;
    
    try {
      const db = getFirebaseDb();
      const familyDoc = await getDoc(doc(db, COLLECTIONS.FAMILIES, user.familyId));
      if (familyDoc.exists()) {
        const familyData = familyDoc.data();
        setFamilyCode(familyData.inviteCode || '');
      }
    } catch (error) {
      console.error('Error loading family code:', error);
    }
  };

  const loadFamilyStats = async () => {
    if (!user?.familyId || children.length === 0) {
      console.log('⏸️ loadFamilyStats skipped:', { hasFamilyId: !!user?.familyId, childrenCount: children.length });
      return;
    }
    
    try {
      console.log('📊 Loading family stats for children:', children.map(c => ({ id: c.id, name: c.displayName })));
      // Get all children's stats for today
      const today = format(new Date(), 'yyyy-MM-dd');
      console.log('📅 Loading stats for date:', today);
      
      const statsPromises = children.map(async (child) => {
        try {
          console.log(`📊 Loading stats for child: ${child.displayName} (${child.id})`);
          const stats = await useStatsStore.getState().loadStatsForDate(child.id, today);
          console.log(`✅ Stats loaded for ${child.displayName}:`, {
            totalMinutes: stats?.totalMinutes,
            activitiesLogged: stats?.activitiesLogged,
            balanceScore: stats?.balanceScore?.totalScore,
          });
          return { childId: child.id, stats };
        } catch (error) {
          console.error(`❌ Error loading stats for child ${child.displayName}:`, error);
          return { childId: child.id, stats: null };
        }
      });
      const results = await Promise.all(statsPromises);
      
      // Store individual child stats
      const childStatsMap: Record<string, any> = {};
      results.forEach(({ childId, stats }) => {
        childStatsMap[childId] = stats;
      });
      setChildStats(childStatsMap);
      console.log('✅ Child stats map:', childStatsMap);
      
      // Calculate family totals (today only)
      const stats = results.map(r => r.stats).filter(s => s !== null);
      const totalMinutes = stats.reduce((sum, s) => sum + (s?.totalMinutes || 0), 0);
      const totalActivities = stats.reduce((sum, s) => sum + (s?.activitiesLogged || 0), 0);
      const avgScore = stats.length > 0 
        ? stats.reduce((sum, s) => sum + (s?.balanceScore?.totalScore || 0), 0) / stats.length 
        : 0;
      
      const familyStatsData = {
        totalMinutes,
        totalActivities,
        avgScore,
        childrenCount: children.length,
      };
      console.log('✅ Family stats calculated:', familyStatsData);
      setFamilyStats(familyStatsData);
    } catch (error) {
      console.error('❌ Error loading family stats:', error);
      console.error('❌ Error details:', {
        message: (error as Error).message,
        code: (error as any).code,
        stack: (error as Error).stack,
      });
    }
  };

  const loadRecentActivities = async () => {
    if (!user?.familyId) {
      console.log('⏸️ loadRecentActivities skipped: no familyId');
      return;
    }
    
    setIsLoadingActivities(true);
    try {
      console.log('📋 Loading recent activities for family:', user.familyId);
      const repository = new FirebaseActivityLogRepository();
      // Get recent activities from all family members (last 20)
      const logs = await repository.getByFamilyId(user.familyId, { limit: 20 });
      console.log('✅ Loaded activities:', { count: logs.length, logs: logs.map(l => ({ id: l.id, userId: l.userId, activityName: l.activityName })) });
      
      // Get child names for display
      const childMap = new Map(children.map(c => [c.id, c.displayName]));
      console.log('👥 Child map:', Array.from(childMap.entries()));
      
      // Format activities with child names
      const formattedActivities = logs.map((log: ActivityLog) => {
        const childName = childMap.get(log.userId) || 'Unknown';
        const logDate = log.loggedAt instanceof Timestamp 
          ? log.loggedAt.toDate() 
          : (log.loggedAt instanceof Date ? log.loggedAt : new Date(log.loggedAt));
        
        return {
          ...log,
          childName,
          formattedTime: format(logDate, 'h:mm a'),
          formattedDate: format(logDate, 'MMM d'),
        };
      });
      
      console.log('✅ Formatted activities:', formattedActivities.length);
      setRecentActivities(formattedActivities);
    } catch (error) {
      console.error('❌ Error loading recent activities:', error);
      console.error('❌ Error details:', {
        message: (error as Error).message,
        code: (error as any).code,
        stack: (error as Error).stack,
      });
      toast.error('Failed to load recent activities');
    } finally {
      setIsLoadingActivities(false);
    }
  };

  useEffect(() => {
    if (children.length > 0) {
      loadFamilyStats();
      loadRecentActivities();
      loadWeeklyTrends();
    }
  }, [children.length, user?.familyId]);

  useEffect(() => {
    // Reload activities when children change
    if (user?.familyId && children.length > 0) {
      loadRecentActivities();
    }
  }, [children.map(c => c.id).join(',')]);

  const loadWeeklyTrends = async () => {
    if (!user?.familyId || children.length === 0) {
      console.log('⏸️ loadWeeklyTrends skipped:', { hasFamilyId: !!user?.familyId, childrenCount: children.length });
      return;
    }
    
    setIsLoadingTrends(true);
    try {
      console.log('📈 Loading weekly trends for children:', children.map(c => c.displayName));
      const repository = new FirebaseActivityLogRepository();
      const trendsMap: Record<string, any[]> = {};
      
      // Load weekly stats for each child
      for (const child of children) {
        console.log(`📈 Loading trends for ${child.displayName} (${child.id})`);
        const stats = [];
        for (let i = 6; i >= 0; i--) {
          const date = format(subDays(new Date(), i), 'yyyy-MM-dd');
          const dayStart = new Date(date);
          dayStart.setHours(0, 0, 0, 0);
          const dayEnd = new Date(date);
          dayEnd.setHours(23, 59, 59, 999);
          
          try {
            const dayLogs = await repository.getByDateRange(child.id, {
              start: dayStart,
              end: dayEnd,
            });
            console.log(`  📅 ${date}: ${dayLogs.length} logs`);
            
            const totalMinutes = dayLogs.reduce((sum, log) => sum + log.durationMinutes, 0);
            const balanceScore = calculateBalanceScore(dayLogs);
            
            stats.push({
              date: format(new Date(date), 'MMM d'),
              fullDate: date,
              minutes: totalMinutes,
              activities: dayLogs.length,
              score: balanceScore.totalScore,
            });
          } catch (error) {
            console.error(`  ❌ Error loading logs for ${date}:`, error);
            stats.push({
              date: format(new Date(date), 'MMM d'),
              fullDate: date,
              minutes: 0,
              activities: 0,
              score: 0,
            });
          }
        }
        trendsMap[child.id] = stats;
        console.log(`✅ Trends loaded for ${child.displayName}:`, stats);
      }
      
      console.log('✅ All weekly trends loaded:', trendsMap);
      setWeeklyTrends(trendsMap);
    } catch (error) {
      console.error('❌ Error loading weekly trends:', error);
      console.error('❌ Error details:', {
        message: (error as Error).message,
        code: (error as any).code,
        stack: (error as Error).stack,
      });
    } finally {
      setIsLoadingTrends(false);
    }
  };

  const handleAddChild = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user?.familyId) return;
    
    if (childForm.pin !== childForm.confirmPin) {
      toast.error('PINs do not match');
      return;
    }
    
    if (childForm.pin.length !== 4) {
      toast.error('PIN must be 4 digits');
      return;
    }
    
    try {
      await authService.addChild(user.familyId, {
        displayName: childForm.displayName,
        pin: childForm.pin,
        avatarUrl: childForm.avatarUrl,
        dateOfBirth: childForm.dateOfBirth,
      });
      
      toast.success(`Added ${childForm.displayName} to your family!`);
      setIsAddChildModalOpen(false);
      setChildForm({
        displayName: '',
        pin: '',
        confirmPin: '',
        avatarUrl: null,
        dateOfBirth: null,
      });
      await loadFamilyChildren();
    } catch (error: any) {
      console.error('Error adding child:', error);
      toast.error(error.message || 'Failed to add child');
    }
  };

  const handleDeleteChild = async (childId: string, childName: string) => {
    if (!confirm(`Are you sure you want to remove ${childName} from your family?`)) {
      return;
    }
    
    try {
      // TODO: Implement delete child in authService
      toast.error('Delete child functionality not yet implemented');
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete child');
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50 pb-24">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm sticky top-0 z-10 border-b border-gray-100">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Parent Dashboard</h1>
              <p className="text-sm text-gray-600">Manage your family and activities</p>
            </div>
            <div className="flex items-center gap-2">
              <Link
                to="/dashboard"
                className="p-2 rounded-full hover:bg-gray-100"
                title="Child Dashboard"
              >
                <Activity className="h-5 w-5 text-gray-600" />
              </Link>
              <button
                onClick={logout}
                className="p-2 rounded-full hover:bg-gray-100"
              >
                <LogOut className="h-5 w-5 text-gray-600" />
              </button>
            </div>
          </div>
          
          {/* Tabs */}
          <div className="flex gap-2 border-b">
            <button
              onClick={() => setActiveTab('overview')}
              className={`px-4 py-2 font-semibold border-b-2 transition-colors ${
                activeTab === 'overview'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab('children')}
              className={`px-4 py-2 font-semibold border-b-2 transition-colors ${
                activeTab === 'children'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              Children ({children.length})
            </button>
            <button
              onClick={() => setActiveTab('activities')}
              className={`px-4 py-2 font-semibold border-b-2 transition-colors ${
                activeTab === 'activities'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              Activities
            </button>
            <button
              onClick={() => setActiveTab('settings')}
              className={`px-4 py-2 font-semibold border-b-2 transition-colors ${
                activeTab === 'settings'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              Settings
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 py-6">
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Family Code Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100"
            >
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Family Invite Code</h2>
              <div className="flex items-center gap-4">
                <div className="flex-1 px-4 py-3 bg-gray-50 rounded-xl border-2 border-dashed border-gray-300">
                  <p className="text-sm text-gray-600 mb-1">Share this code with your children</p>
                  <p className="text-2xl font-mono font-bold text-gray-900 tracking-widest">
                    {familyCode || 'Loading...'}
                  </p>
                </div>
                <Button
                  onClick={() => {
                    if (familyCode) {
                      navigator.clipboard.writeText(familyCode);
                      toast.success('Family code copied!');
                    }
                  }}
                  disabled={!familyCode}
                >
                  Copy
                </Button>
              </div>
            </motion.div>

            {/* Family Stats */}
            {familyStats && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100"
              >
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-gray-900">Family Overview</h2>
                  <span className="text-xs font-medium text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full">
                    Today • {format(new Date(), 'MMM d, yyyy')}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-4 mb-6">
                  <div className="text-center p-4 bg-blue-50 rounded-xl">
                    <div className="text-3xl font-bold text-blue-600">{familyStats.totalMinutes}</div>
                    <div className="text-sm text-gray-600 mt-1">Minutes Today</div>
                  </div>
                  <div className="text-center p-4 bg-green-50 rounded-xl">
                    <div className="text-3xl font-bold text-green-600">{familyStats.totalActivities}</div>
                    <div className="text-sm text-gray-600 mt-1">Activities Today</div>
                  </div>
                  <div className="text-center p-4 bg-purple-50 rounded-xl">
                    <div className="text-3xl font-bold text-purple-600">{Math.round(familyStats.avgScore)}</div>
                    <div className="text-sm text-gray-600 mt-1">Avg Score Today</div>
                  </div>
                </div>

                {/* Per-Child Stats */}
                {children.length > 0 && (
                  <div>
                    <h3 className="text-md font-semibold text-gray-700 mb-3">Per-Child Stats</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {children.map((child) => {
                        const stats = childStats[child.id];
                        return (
                          <div
                            key={child.id}
                            className="p-4 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl border border-indigo-100"
                          >
                            <div className="flex items-center gap-3 mb-3">
                              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-xl">
                                {child.avatarUrl || '👤'}
                              </div>
                              <div>
                                <h4 className="font-semibold text-gray-900">{child.displayName}</h4>
                                <p className="text-xs text-gray-600">Today's Activity</p>
                              </div>
                            </div>
                            {stats ? (
                              <div className="grid grid-cols-3 gap-2 text-center">
                                <div>
                                  <div className="text-lg font-bold text-blue-600">{stats.totalMinutes || 0}</div>
                                  <div className="text-xs text-gray-600">min</div>
                                </div>
                                <div>
                                  <div className="text-lg font-bold text-green-600">{stats.activitiesLogged || 0}</div>
                                  <div className="text-xs text-gray-600">acts</div>
                                </div>
                                <div>
                                  <div className="text-lg font-bold text-purple-600">
                                    {Math.round(stats.balanceScore?.totalScore || 0)}
                                  </div>
                                  <div className="text-xs text-gray-600">score</div>
                                </div>
                              </div>
                            ) : (
                              <p className="text-sm text-gray-500 text-center py-2">No activities today</p>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </motion.div>
            )}

            {/* Weekly Trends Chart */}
            {Object.keys(weeklyTrends).length > 0 && children.length > 0 && (() => {
              // Combine all children's data into a single array
              const firstChildData = weeklyTrends[children[0]?.id] || [];
              const combinedData = firstChildData.map((day, i) => {
                const dayData: any = { date: day.date };
                children.forEach((child) => {
                  const childData = weeklyTrends[child.id] || [];
                  const childDay = childData[i];
                  dayData[`${child.displayName}_score`] = childDay?.score || 0;
                  dayData[`${child.displayName}_minutes`] = childDay?.minutes || 0;
                });
                return dayData;
              });

              return (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15 }}
                  className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100"
                >
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">Weekly Trends - Balance Scores</h2>
                  {isLoadingTrends ? (
                    <div className="text-center py-8">
                      <p className="text-gray-500">Loading trends...</p>
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={combinedData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis yAxisId="left" />
                        <Tooltip />
                        <Legend />
                        {children.map((child, index) => {
                          const colors = ['#6366f1', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6'];
                          const color = colors[index % colors.length];
                          return (
                            <Line
                              key={child.id}
                              yAxisId="left"
                              type="monotone"
                              dataKey={`${child.displayName}_score`}
                              stroke={color}
                              name={child.displayName}
                              strokeWidth={2}
                              dot={{ r: 4 }}
                            />
                          );
                        })}
                      </LineChart>
                    </ResponsiveContainer>
                  )}
                </motion.div>
              );
            })()}

            {/* Recent Activities Feed */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100"
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">Recent Activities</h2>
                {children.length > 1 && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => setSelectedChildFilter('all')}
                      className={`px-3 py-1 text-xs rounded-lg transition-colors ${
                        selectedChildFilter === 'all'
                          ? 'bg-indigo-600 text-white'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      All
                    </button>
                    {children.map((child) => (
                      <button
                        key={child.id}
                        onClick={() => setSelectedChildFilter(child.id)}
                        className={`px-3 py-1 text-xs rounded-lg transition-colors ${
                          selectedChildFilter === child.id
                            ? 'bg-indigo-600 text-white'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                      >
                        {child.displayName}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              {isLoadingActivities ? (
                <div className="text-center py-8">
                  <p className="text-gray-500">Loading activities...</p>
                </div>
              ) : recentActivities.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500">No activities logged yet today</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {recentActivities
                    .filter((activity) => 
                      selectedChildFilter === 'all' || activity.userId === selectedChildFilter
                    )
                    .map((activity) => (
                      <div
                        key={activity.id}
                        className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
                      >
                        <div className="text-3xl">{activity.activityIcon}</div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-gray-900">{activity.childName}</span>
                            <span className="text-gray-400">•</span>
                            <span className="text-sm text-gray-600">{activity.activityName}</span>
                          </div>
                          <p className="text-sm text-gray-500">
                            {activity.durationMinutes} min • {activity.formattedTime} • {activity.formattedDate}
                          </p>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-semibold text-indigo-600">
                            {Math.round(activity.qualityScore)} pts
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </motion.div>

            {/* Quick Actions */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100"
            >
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => setActiveTab('children')}
                  className="flex items-center gap-3 p-4 bg-indigo-50 rounded-xl hover:bg-indigo-100 transition-colors"
                >
                  <UserPlus className="h-6 w-6 text-indigo-600" />
                  <span className="font-semibold text-gray-900">Add Child</span>
                </button>
                <button
                  onClick={() => setActiveTab('activities')}
                  className="flex items-center gap-3 p-4 bg-green-50 rounded-xl hover:bg-green-100 transition-colors"
                >
                  <Activity className="h-6 w-6 text-green-600" />
                  <span className="font-semibold text-gray-900">Manage Activities</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {activeTab === 'children' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-900">Family Members</h2>
              <Button onClick={() => setIsAddChildModalOpen(true)}>
                <UserPlus className="h-4 w-4 mr-2" />
                Add Child
              </Button>
            </div>

            {isLoadingChildren ? (
              <div className="text-center py-12">
                <p className="text-gray-500">Loading children...</p>
              </div>
            ) : children.length === 0 ? (
              <div className="bg-white rounded-2xl p-12 text-center shadow-sm border border-gray-100">
                <Users className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No children yet</h3>
                <p className="text-gray-600 mb-6">Add your first child to start tracking their activities!</p>
                <Button onClick={() => setIsAddChildModalOpen(true)}>
                  <UserPlus className="h-4 w-4 mr-2" />
                  Add Your First Child
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {children.map((child) => (
                  <motion.div
                    key={child.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-4">
                        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-3xl">
                          {child.avatarUrl || '👤'}
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">{child.displayName}</h3>
                          <p className="text-sm text-gray-600">Child Account</p>
                          {child.dateOfBirth && (
                            <p className="text-xs text-gray-500 mt-1">
                              Born: {format(new Date(child.dateOfBirth), 'MMM d, yyyy')}
                            </p>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={() => handleDeleteChild(child.id, child.displayName)}
                        className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        title="Remove child"
                      >
                        <Trash2 className="h-5 w-5" />
                      </button>
                    </div>
                    {/* Child Stats Preview */}
                    {childStats[child.id] && (
                      <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                        <p className="text-xs text-gray-600 mb-2">Today's Activity</p>
                        <div className="grid grid-cols-3 gap-2 text-center">
                          <div>
                            <div className="text-lg font-bold text-blue-600">
                              {childStats[child.id]?.totalMinutes || 0}
                            </div>
                            <div className="text-xs text-gray-600">min</div>
                          </div>
                          <div>
                            <div className="text-lg font-bold text-green-600">
                              {childStats[child.id]?.activitiesLogged || 0}
                            </div>
                            <div className="text-xs text-gray-600">acts</div>
                          </div>
                          <div>
                            <div className="text-lg font-bold text-purple-600">
                              {Math.round(childStats[child.id]?.balanceScore?.totalScore || 0)}
                            </div>
                            <div className="text-xs text-gray-600">score</div>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    <div className="flex gap-2">
                      <Button
                        variant="secondary"
                        onClick={() => {
                          navigate(`/parent/child/${child.id}`);
                        }}
                        className="flex-1"
                      >
                        <Activity className="h-4 w-4 mr-2" />
                        View Dashboard
                      </Button>
                      <Button
                        variant="secondary"
                        onClick={() => {
                          toast.info('Edit child functionality coming soon');
                        }}
                        className="flex-1"
                      >
                        <Edit2 className="h-4 w-4 mr-2" />
                        Edit
                      </Button>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'activities' && <ActivityManager />}

        {activeTab === 'settings' && (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Family Settings</h2>
              <p className="text-gray-600">Settings coming soon...</p>
            </div>
          </div>
        )}
      </main>

      {/* Add Child Modal */}
      <Modal
        isOpen={isAddChildModalOpen}
        onClose={() => {
          setIsAddChildModalOpen(false);
          setChildForm({
            displayName: '',
            pin: '',
            confirmPin: '',
            avatarUrl: null,
            dateOfBirth: null,
          });
        }}
        title="Add Child to Family"
      >
        <form onSubmit={handleAddChild} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Child's Name
            </label>
            <input
              type="text"
              value={childForm.displayName}
              onChange={(e) => setChildForm({ ...childForm, displayName: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="Emma"
              required
              maxLength={30}
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              PIN (4 digits)
            </label>
            <input
              type="text"
              value={childForm.pin}
              onChange={(e) => {
                const value = e.target.value.replace(/\D/g, '').slice(0, 4);
                setChildForm({ ...childForm, pin: value });
              }}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-center text-2xl tracking-widest font-mono"
              placeholder="1234"
              required
              maxLength={4}
            />
            <p className="text-xs text-gray-500 mt-1">Child will use this PIN to log in</p>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Confirm PIN
            </label>
            <input
              type="text"
              value={childForm.confirmPin}
              onChange={(e) => {
                const value = e.target.value.replace(/\D/g, '').slice(0, 4);
                setChildForm({ ...childForm, confirmPin: value });
              }}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-center text-2xl tracking-widest font-mono"
              placeholder="1234"
              required
              maxLength={4}
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Date of Birth (Optional)
            </label>
            <input
              type="date"
              value={childForm.dateOfBirth || ''}
              onChange={(e) => setChildForm({ ...childForm, dateOfBirth: e.target.value || null })}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setIsAddChildModalOpen(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button type="submit" className="flex-1">
              Add Child
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
