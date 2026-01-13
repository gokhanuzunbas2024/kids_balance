import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import { ActivityLog, CreateActivityLogDTO } from '@/types';
import { FirebaseActivityLogRepository } from '@/repositories/firebase/ActivityLogRepository';
import { startOfDay, endOfDay } from 'date-fns';

interface LogsStore {
  logs: ActivityLog[];
  isLoading: boolean;
  error: string | null;
  createLog: (input: CreateActivityLogDTO) => Promise<ActivityLog>;
  updateLog: (id: string, data: Partial<ActivityLog>) => Promise<void>;
  deleteLog: (id: string) => Promise<void>;
  loadLogsForDate: (userId: string, date: string) => Promise<void>;
  loadTodayLogs: (userId: string) => Promise<void>;
  getTodayLogs: (userId: string) => Promise<ActivityLog[]>;
}

const repository = new FirebaseActivityLogRepository();

export const useLogsStore = create<LogsStore>((set, get) => ({
  logs: [],
  isLoading: false,
  error: null,

  createLog: async (input: CreateActivityLogDTO) => {
    const id = uuidv4();
    try {
      console.log('📝 Creating log:', { id, ...input });
      const log = await repository.create({ ...input, id });
      console.log('✅ Log created:', log);
      // Optimistically add to logs
      set(state => ({ logs: [...state.logs, log] }));
      return log;
    } catch (error) {
      console.error('❌ Error creating log:', error);
      console.error('❌ Error details:', {
        message: (error as Error).message,
        code: (error as any).code,
        stack: (error as Error).stack,
      });
      set({ error: (error as Error).message });
      throw error;
    }
  },

  updateLog: async (id: string, data: Partial<ActivityLog>) => {
    try {
      const updated = await repository.update(id, data);
      set(state => ({
        logs: state.logs.map(l =>
          l.id === id ? updated : l
        )
      }));
    } catch (error) {
      console.error('Error updating log:', error);
      set({ error: (error as Error).message });
      throw error;
    }
  },

  deleteLog: async (id: string) => {
    try {
      await repository.delete(id);
      set(state => ({ logs: state.logs.filter(l => l.id !== id) }));
    } catch (error) {
      console.error('Error deleting log:', error);
      set({ error: (error as Error).message });
      throw error;
    }
  },

  loadLogsForDate: async (userId: string, date: string) => {
    set({ isLoading: true, error: null });
    try {
      console.log('📥 Loading logs for date:', { userId, date });
      // Parse date string (YYYY-MM-DD) in local timezone to avoid timezone issues
      const [year, month, day] = date.split('-').map(Number);
      const dateObj = new Date(year, month - 1, day); // month is 0-indexed, use local timezone
      const dayStart = startOfDay(dateObj);
      const dayEnd = endOfDay(dateObj);
      console.log('📥 Date range:', { 
        dateString: date,
        parsedDate: dateObj.toLocaleString(),
        start: dayStart.toLocaleString(), 
        end: dayEnd.toLocaleString() 
      });
      const logs = await repository.getByDateRange(userId, {
        start: dayStart,
        end: dayEnd,
      });
      console.log('✅ Logs loaded successfully:', { count: logs.length, logs });
      
      // Merge with existing logs to preserve optimistic updates
      // BUT only keep optimistic logs that are within the date range
      const currentLogs = get().logs;
      const queryLogIds = new Set(logs.map(l => l.id));
      
      // Find logs in current state that aren't in query results (optimistic updates)
      // AND filter to only include logs within the date range
      const optimisticLogs = currentLogs.filter(l => {
        // Skip if already in query results
        if (queryLogIds.has(l.id)) return false;
        
        // Check if log is within the date range
        const logDate = l.loggedAt instanceof Date 
          ? l.loggedAt 
          : (l.loggedAt as any)?.toDate?.() 
            ? (l.loggedAt as any).toDate() 
            : new Date(l.loggedAt);
        
        const logTime = logDate.getTime();
        const startTime = dayStart.getTime();
        const endTime = dayEnd.getTime();
        
        return logTime >= startTime && logTime <= endTime;
      });
      
      console.log('🔄 Filtered optimistic logs:', { 
        totalCurrent: currentLogs.length,
        optimisticCount: optimisticLogs.length,
        dateRange: { start: dayStart.toISOString(), end: dayEnd.toISOString() }
      });
      
      // Combine query results with filtered optimistic logs, removing duplicates
      const mergedLogs = [...logs, ...optimisticLogs];
      // Sort by loggedAt descending
      mergedLogs.sort((a, b) => {
        const aTime = a.loggedAt instanceof Date ? a.loggedAt.getTime() : (a.loggedAt as any)?.toMillis?.() || 0;
        const bTime = b.loggedAt instanceof Date ? b.loggedAt.getTime() : (b.loggedAt as any)?.toMillis?.() || 0;
        return bTime - aTime;
      });
      
      console.log('🔄 Merged logs:', { 
        queryCount: logs.length, 
        optimisticCount: optimisticLogs.length,
        mergedCount: mergedLogs.length 
      });
      
      // Always update logs, even if empty (to clear stale data)
      set({ logs: mergedLogs, isLoading: false, error: null });
    } catch (error) {
      console.error('❌ Error loading logs:', error);
      console.error('❌ Error details:', {
        message: (error as Error).message,
        code: (error as any).code,
        stack: (error as Error).stack,
      });
      // Don't clear logs on error - keep existing logs (including optimistic updates)
      // Only update error state, keep logs as they were
      set({ 
        error: (error as Error).message, 
        isLoading: false,
        // Keep existing logs - don't clear them
      });
    }
  },

  loadTodayLogs: async (userId: string) => {
    // Use local date, not UTC, to match the loggedAt timestamps
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    const todayStr = `${year}-${month}-${day}`;
    console.log('📅 Loading today logs:', { todayStr, localDate: today.toLocaleDateString() });
    await get().loadLogsForDate(userId, todayStr);
  },

  getTodayLogs: async (userId: string) => {
    return await repository.getToday(userId);
  },
}));
