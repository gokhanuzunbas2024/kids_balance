import React, { useEffect, useState } from 'react';
import { useStatsStore } from '@/stores/statsStore';
import { useLogsStore } from '@/stores/logsStore';
import { useAuth } from '@/contexts/AuthContext';
import { QualityMeter } from './QualityMeter';
import { CategoryBreakdown } from './CategoryBreakdown';
import { EditLogModal } from './EditLogModal';
import { ActivityLog } from '@/types';
import { Trophy, Clock, Activity, Edit2 } from 'lucide-react';
import { getBadgeById } from '@/utils/badgeEngine';
import { format } from 'date-fns';

export const BalanceDashboard: React.FC = () => {
  const { user } = useAuth();
  const { todayStats, loadTodayStats, isLoading } = useStatsStore();
  const { logs, loadTodayLogs } = useLogsStore();
  const [editingLog, setEditingLog] = useState<ActivityLog | null>(null);

  useEffect(() => {
    if (user?.id) {
      loadTodayLogs(user.id);
      loadTodayStats(user.id);
    }
  }, [user?.id, loadTodayLogs, loadTodayStats]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-500">Loading dashboard...</div>
      </div>
    );
  }

  if (!todayStats) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-3xl font-bold mb-2 mt-4">
            {user?.displayName ? `${user.displayName}'s Balance` : "Today's Balance"}
          </h1>
          <p className="text-gray-600 mb-6">{format(new Date(), 'EEEE, MMMM d')}</p>
          <div className="bg-white rounded-2xl p-8 shadow-sm text-center">
            <div className="text-6xl mb-4">📝</div>
            <h2 className="text-xl font-bold mb-2">No activities logged yet</h2>
            <p className="text-gray-600">Start logging activities to see your balance score!</p>
          </div>
        </div>
      </div>
    );
  }

  const formatMinutes = (minutes: number) => {
    if (minutes < 60) return `${minutes} min`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 pb-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-2 mt-4">
          {user?.displayName ? `${user.displayName}'s Balance` : "Today's Balance"}
        </h1>
        <p className="text-gray-600 mb-6">{format(new Date(), 'EEEE, MMMM d')}</p>

        <div className="space-y-4 mb-6">
          <QualityMeter
            averageQuality={todayStats.averageQuality}
            totalScore={todayStats.balanceScore.totalScore}
          />

          <div className="grid grid-cols-3 gap-4">
            <div className="bg-white rounded-2xl p-4 shadow-sm text-center">
              <Clock className="w-6 h-6 mx-auto mb-2 text-blue-500" />
              <div className="text-2xl font-bold">{formatMinutes(todayStats.totalMinutes)}</div>
              <div className="text-xs text-gray-500">Total Time</div>
            </div>
            <div className="bg-white rounded-2xl p-4 shadow-sm text-center">
              <Activity className="w-6 h-6 mx-auto mb-2 text-green-500" />
              <div className="text-2xl font-bold">{todayStats.activitiesLogged}</div>
              <div className="text-xs text-gray-500">Activities</div>
            </div>
            <div className="bg-white rounded-2xl p-4 shadow-sm text-center">
              <Trophy className="w-6 h-6 mx-auto mb-2 text-yellow-500" />
              <div className="text-2xl font-bold">{todayStats.badgesEarned.length}</div>
              <div className="text-xs text-gray-500">Badges</div>
            </div>
          </div>

          {todayStats.badgesEarned.length > 0 && (
            <div className="bg-white rounded-2xl p-6 shadow-sm">
              <h3 className="text-lg font-bold mb-4">Badges Earned Today</h3>
              <div className="flex flex-wrap gap-3">
                {todayStats.badgesEarned.map((badgeId) => {
                  const badge = getBadgeById(badgeId);
                  if (!badge) return null;
                  return (
                    <div
                      key={badgeId}
                      className="flex items-center gap-2 px-4 py-2 rounded-lg"
                      style={{ backgroundColor: `${badge.color}20` }}
                    >
                      <span className="text-2xl">{badge.emoji}</span>
                      <div>
                        <div className="font-semibold text-sm">{badge.name}</div>
                        <div className="text-xs text-gray-600">{badge.description}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <CategoryBreakdown stats={todayStats} />

          {logs.length > 0 && (
            <div className="bg-white rounded-2xl p-6 shadow-sm">
              <h3 className="text-lg font-bold mb-4">Today's Activities</h3>
              <div className="space-y-3">
                {logs.map((log) => (
                  <ActivityLogItem 
                    key={log.id} 
                    log={log} 
                    onEdit={() => setEditingLog(log)}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {editingLog && (
        <EditLogModal
          log={editingLog}
          isOpen={!!editingLog}
          onClose={() => setEditingLog(null)}
        />
      )}
    </div>
  );
};

interface ActivityLogItemProps {
  log: ActivityLog;
  onEdit: () => void;
}

const ActivityLogItem: React.FC<ActivityLogItemProps> = ({ log, onEdit }) => {
  const formatDuration = (minutes: number) => {
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  };

  // Calculate coefficient from qualityScore and durationMinutes
  const coefficient = log.durationMinutes > 0 ? log.qualityScore / log.durationMinutes : 0;

  return (
    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
      <div className="text-3xl">{log.activityIcon}</div>
      <div className="flex-1">
        <div className="font-semibold">{log.activityName}</div>
        <div className="text-sm text-gray-600">
          {formatDuration(log.durationMinutes)} • {log.activityCategory}
        </div>
      </div>
      <div className="text-right">
        <div className="font-bold text-sm" style={{ color: log.activityColor }}>
          {Math.round(log.qualityScore).toFixed(0)} pts
        </div>
        <div className="text-xs text-gray-500">
          {Array.from({ length: Math.floor(coefficient) }).map((_, i) => (
            <span key={i}>⭐</span>
          ))}
        </div>
      </div>
      <button
        onClick={onEdit}
        className="p-2 text-gray-500 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
        title="Edit time"
        aria-label="Edit activity log"
      >
        <Edit2 size={20} />
      </button>
    </div>
  );
};
