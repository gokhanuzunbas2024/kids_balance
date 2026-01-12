import { create } from 'zustand';
import { ActivityLog, CreateLogInput, UpdateLogInput } from '@/types';
import { db } from '@/db/schema';
import { useStatsStore } from './statsStore';

interface LogsStore {
  logs: ActivityLog[];
  isLoading: boolean;
  createLog: (input: CreateLogInput) => Promise<ActivityLog>;
  updateLog: (id: string, input: UpdateLogInput) => Promise<void>;
  deleteLog: (id: string) => Promise<void>;
  loadLogsForDate: (date: string) => Promise<void>;
  loadTodayLogs: () => Promise<void>;
}

export const useLogsStore = create<LogsStore>((set, get) => ({
  logs: [],
  isLoading: false,

  createLog: async (input) => {
    const activity = await db.activities.get(input.activityId);
    if (!activity) throw new Error('Activity not found');

    const activityDate = input.activityDate || new Date().toISOString().split('T')[0];

    const log: ActivityLog = {
      id: crypto.randomUUID(),
      activityId: input.activityId,
      duration: input.duration,
      loggedAt: new Date(),
      activityDate,
      note: input.note,
      activityName: activity.name,
      activityCategory: activity.category,
      activityCoefficient: activity.coefficient,
      activityIcon: activity.icon,
      activityColor: activity.color,
      qualityPoints: input.duration * activity.coefficient
    };

    await db.activityLogs.add(log);
    set(state => ({ logs: [...state.logs, log] }));
    
    // Trigger stats recalculation
    await useStatsStore.getState().loadTodayStats();
    
    return log;
  },

  updateLog: async (id, input) => {
    const existingLog = await db.activityLogs.get(id);
    if (!existingLog) throw new Error('Log not found');

    const activity = await db.activities.get(existingLog.activityId);
    if (!activity) throw new Error('Activity not found');

    const duration = input.duration ?? existingLog.duration;
    const updatedLog: Partial<ActivityLog> = {
      ...input,
      duration,
      qualityPoints: duration * activity.coefficient,
      activityName: activity.name,
      activityCategory: activity.category,
      activityCoefficient: activity.coefficient,
      activityIcon: activity.icon,
      activityColor: activity.color
    };

    await db.activityLogs.update(id, updatedLog);
    set(state => ({
      logs: state.logs.map(l =>
        l.id === id ? { ...l, ...updatedLog } : l
      )
    }));

    await useStatsStore.getState().loadTodayStats();
  },

  deleteLog: async (id) => {
    await db.activityLogs.delete(id);
    set(state => ({ logs: state.logs.filter(l => l.id !== id) }));
    await useStatsStore.getState().loadTodayStats();
  },

  loadLogsForDate: async (date: string) => {
    set({ isLoading: true });
    try {
      const logs = await db.activityLogs
        .where('activityDate')
        .equals(date)
        .toArray();
      set({ logs, isLoading: false });
    } catch (error) {
      console.error('Error loading logs:', error);
      set({ isLoading: false });
    }
  },

  loadTodayLogs: async () => {
    const today = new Date().toISOString().split('T')[0];
    await get().loadLogsForDate(today);
  }
}));
