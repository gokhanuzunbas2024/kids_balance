import { 
  ActivityLog, 
  CreateActivityLogDTO, 
  DailySummary,
  DateRange,
  QueryOptions 
} from '@/types';

export interface IActivityLogRepository {
  getById(id: string): Promise<ActivityLog | null>;
  getByUserId(userId: string, options?: QueryOptions): Promise<ActivityLog[]>;
  getByFamilyId(familyId: string, options?: QueryOptions): Promise<ActivityLog[]>;
  getByDateRange(userId: string, range: DateRange): Promise<ActivityLog[]>;
  getToday(userId: string): Promise<ActivityLog[]>;
  create(data: CreateActivityLogDTO & { id: string }): Promise<ActivityLog>;
  update(id: string, data: Partial<ActivityLog>): Promise<ActivityLog>;
  delete(id: string): Promise<void>;
  getDailySummary(userId: string, date: string): Promise<DailySummary | null>;
  getWeeklySummaries(userId: string, weekStart: Date): Promise<DailySummary[]>;
  updateDailySummary(userId: string, date: string): Promise<DailySummary>;
}
