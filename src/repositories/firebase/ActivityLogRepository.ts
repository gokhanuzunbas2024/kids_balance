import {
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  collection,
  where,
  orderBy,
  limit,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import { startOfDay, endOfDay, format, startOfWeek, endOfWeek } from 'date-fns';
import { getFirebaseDb, COLLECTIONS } from '@/config/firebase';
import {
  ActivityLog,
  CreateActivityLogDTO,
  DailySummary,
  DateRange,
  QueryOptions,
  CategoryBreakdown,
  BalanceStatus,
} from '@/types';
import { IActivityLogRepository } from '../interfaces/IActivityLogRepository';
import { BALANCE_THRESHOLDS } from '@/config/constants';

export class FirebaseActivityLogRepository implements IActivityLogRepository {
  private db = getFirebaseDb();

  async getById(id: string): Promise<ActivityLog | null> {
    const docRef = doc(this.db, COLLECTIONS.ACTIVITY_LOGS, id);
    const docSnap = await getDoc(docRef);
    
    if (!docSnap.exists()) return null;
    return { id: docSnap.id, ...docSnap.data() } as ActivityLog;
  }

  async getByUserId(userId: string, options?: QueryOptions): Promise<ActivityLog[]> {
    let q = query(
      collection(this.db, COLLECTIONS.ACTIVITY_LOGS),
      where('userId', '==', userId),
      orderBy('loggedAt', 'desc')
    );
    
    if (options?.limit) q = query(q, limit(options.limit));
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })) as ActivityLog[];
  }

  async getByFamilyId(familyId: string, options?: QueryOptions): Promise<ActivityLog[]> {
    try {
      console.log('🔍 Querying logs by familyId:', { familyId, limit: options?.limit });
      let q = query(
        collection(this.db, COLLECTIONS.ACTIVITY_LOGS),
        where('familyId', '==', familyId),
        orderBy('loggedAt', 'desc')
      );
      
      if (options?.limit) q = query(q, limit(options.limit));
      
      const snapshot = await getDocs(q);
      console.log('✅ Query by familyId successful:', { count: snapshot.docs.length });
      
      const logs = snapshot.docs.map((doc) => {
        const data = doc.data();
        return { 
          id: doc.id, 
          ...data,
          loggedAt: data.loggedAt?.toMillis ? new Date(data.loggedAt.toMillis()) : data.loggedAt,
        };
      }) as ActivityLog[];
      
      console.log('✅ Parsed logs by familyId:', logs.map(l => ({ id: l.id, userId: l.userId, activityName: l.activityName })));
      return logs;
    } catch (error) {
      console.error('❌ Error in getByFamilyId:', error);
      console.error('❌ Error details:', {
        message: (error as Error).message,
        code: (error as any).code,
        stack: (error as Error).stack,
      });
      // If it's an index error, try without orderBy
      if ((error as any).code === 'failed-precondition') {
        console.log('⚠️ Index missing, trying query without orderBy');
        try {
          let q = query(
            collection(this.db, COLLECTIONS.ACTIVITY_LOGS),
            where('familyId', '==', familyId)
          );
          
          if (options?.limit) q = query(q, limit(options.limit));
          
          const snapshot = await getDocs(q);
          const logs = snapshot.docs.map((doc) => {
            const data = doc.data();
            return { 
              id: doc.id, 
              ...data,
              loggedAt: data.loggedAt?.toMillis ? new Date(data.loggedAt.toMillis()) : data.loggedAt,
            };
          }) as ActivityLog[];
          
          // Sort manually
          logs.sort((a, b) => {
            const aTime = a.loggedAt instanceof Date ? a.loggedAt.getTime() : (a.loggedAt as any)?.toMillis?.() || 0;
            const bTime = b.loggedAt instanceof Date ? b.loggedAt.getTime() : (b.loggedAt as any)?.toMillis?.() || 0;
            return bTime - aTime;
          });
          
          console.log('✅ Query without orderBy successful:', { count: logs.length });
          return logs;
        } catch (fallbackError) {
          console.error('❌ Fallback query also failed:', fallbackError);
          throw fallbackError;
        }
      }
      throw error;
    }
  }

  async getByDateRange(userId: string, range: DateRange): Promise<ActivityLog[]> {
    try {
      console.log('🔍 Querying logs:', { userId, start: range.start, end: range.end });
      const q = query(
        collection(this.db, COLLECTIONS.ACTIVITY_LOGS),
        where('userId', '==', userId),
        where('loggedAt', '>=', Timestamp.fromDate(range.start)),
        where('loggedAt', '<=', Timestamp.fromDate(range.end)),
        orderBy('loggedAt', 'desc')
      );
      
      const snapshot = await getDocs(q);
      console.log('✅ Query successful:', { count: snapshot.docs.length });
      const logs = snapshot.docs.map((doc) => {
        const data = doc.data();
        return { 
          id: doc.id, 
          ...data,
          loggedAt: data.loggedAt?.toMillis ? new Date(data.loggedAt.toMillis()) : data.loggedAt,
        };
      }) as ActivityLog[];
      console.log('✅ Parsed logs:', logs);
      return logs;
    } catch (error) {
      console.error('❌ Error in getByDateRange:', error);
      console.error('❌ Error details:', {
        message: (error as Error).message,
        code: (error as any).code,
      });
      throw error;
    }
  }

  async getToday(userId: string): Promise<ActivityLog[]> {
    const today = new Date();
    return this.getByDateRange(userId, {
      start: startOfDay(today),
      end: endOfDay(today),
    });
  }

  async create(data: CreateActivityLogDTO & { id: string }): Promise<ActivityLog> {
    const { id, activityId, userId, familyId, durationMinutes, notes, mood, loggedAt } = data;
    
    // Get activity for denormalization
    const activityDoc = await getDoc(doc(this.db, COLLECTIONS.ACTIVITIES, activityId));
    if (!activityDoc.exists()) throw new Error('Activity not found');
    
    const activity = activityDoc.data() as any;
    const qualityScore = durationMinutes * activity.coefficient;
    
    const log: Omit<ActivityLog, 'id'> = {
      activityId,
      userId,
      familyId,
      durationMinutes,
      qualityScore,
      ...(notes && { notes }), // Only include if provided
      ...(mood && { mood }), // Only include if provided
      loggedAt: loggedAt ? Timestamp.fromDate(loggedAt) : serverTimestamp() as Timestamp,
      createdAt: serverTimestamp() as Timestamp,
      activityName: activity.name,
      activityCategory: activity.category,
      activityIcon: activity.icon,
      activityColor: activity.color,
    };
    
    await setDoc(doc(this.db, COLLECTIONS.ACTIVITY_LOGS, id), log);
    
    // Update daily summary
    const dateStr = format(loggedAt || new Date(), 'yyyy-MM-dd');
    await this.updateDailySummary(userId, dateStr);
    
    return { id, ...log } as ActivityLog;
  }

  async update(id: string, data: Partial<ActivityLog>): Promise<ActivityLog> {
    const docRef = doc(this.db, COLLECTIONS.ACTIVITY_LOGS, id);
    
    if (data.durationMinutes) {
      const current = await this.getById(id);
      if (current) {
        const activityDoc = await getDoc(doc(this.db, COLLECTIONS.ACTIVITIES, current.activityId));
        if (activityDoc.exists()) {
          const activity = activityDoc.data() as any;
          data.qualityScore = data.durationMinutes * activity.coefficient;
        }
      }
    }
    
    // Remove undefined values from update data (Firestore doesn't allow undefined)
    const updateData: Record<string, any> = {
      updatedAt: serverTimestamp(),
    };
    
    // Only include fields that are actually provided (not undefined)
    Object.keys(data).forEach((key) => {
      if (data[key as keyof typeof data] !== undefined) {
        updateData[key] = data[key as keyof typeof data];
      }
    });
    
    await updateDoc(docRef, updateData);
    
    const updated = await this.getById(id);
    if (!updated) throw new Error('Activity log not found after update');
    
    // Update daily summary if duration changed
    if (data.durationMinutes) {
      const dateStr = format((updated.loggedAt as Timestamp).toDate(), 'yyyy-MM-dd');
      await this.updateDailySummary(updated.userId, dateStr);
    }
    
    return updated;
  }

  async delete(id: string): Promise<void> {
    const log = await this.getById(id);
    await deleteDoc(doc(this.db, COLLECTIONS.ACTIVITY_LOGS, id));
    
    if (log) {
      const dateStr = format((log.loggedAt as Timestamp).toDate(), 'yyyy-MM-dd');
      await this.updateDailySummary(log.userId, dateStr);
    }
  }

  async getDailySummary(userId: string, date: string): Promise<DailySummary | null> {
    const q = query(
      collection(this.db, COLLECTIONS.DAILY_SUMMARIES),
      where('userId', '==', userId),
      where('date', '==', date)
    );
    
    const snapshot = await getDocs(q);
    if (snapshot.empty) return null;
    
    const doc = snapshot.docs[0];
    return { id: doc.id, ...doc.data() } as DailySummary;
  }

  async getWeeklySummaries(userId: string, weekStart: Date): Promise<DailySummary[]> {
    const start = startOfWeek(weekStart, { weekStartsOn: 1 });
    const end = endOfWeek(weekStart, { weekStartsOn: 1 });
    
    const q = query(
      collection(this.db, COLLECTIONS.DAILY_SUMMARIES),
      where('userId', '==', userId),
      where('date', '>=', format(start, 'yyyy-MM-dd')),
      where('date', '<=', format(end, 'yyyy-MM-dd')),
      orderBy('date', 'asc')
    );
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })) as DailySummary[];
  }

  async updateDailySummary(userId: string, date: string): Promise<DailySummary> {
    const dayStart = startOfDay(new Date(date));
    const dayEnd = endOfDay(new Date(date));
    const logs = await this.getByDateRange(userId, { start: dayStart, end: dayEnd });
    
    let totalMinutes = 0;
    let totalScore = 0;
    const categoryMap: Record<string, { minutes: number; score: number }> = {};
    
    for (const log of logs) {
      totalMinutes += log.durationMinutes;
      totalScore += log.qualityScore;
      
      if (!categoryMap[log.activityCategory]) {
        categoryMap[log.activityCategory] = { minutes: 0, score: 0 };
      }
      categoryMap[log.activityCategory].minutes += log.durationMinutes;
      categoryMap[log.activityCategory].score += log.qualityScore;
    }
    
    const categoryBreakdown: CategoryBreakdown[] = Object.entries(categoryMap).map(
      ([category, data]) => ({
        category: category as any,
        minutes: data.minutes,
        score: data.score,
        percentage: totalMinutes > 0 ? Math.round((data.minutes / totalMinutes) * 100) : 0,
      })
    );
    
    const uniqueCategories = Object.keys(categoryMap).length;
    let balanceStatus: BalanceStatus = 'needs_work';
    
    if (totalScore >= BALANCE_THRESHOLDS.EXCELLENT.minScore && 
        uniqueCategories >= BALANCE_THRESHOLDS.EXCELLENT.minCategories) {
      balanceStatus = 'excellent';
    } else if (totalScore >= BALANCE_THRESHOLDS.GOOD.minScore && 
               uniqueCategories >= BALANCE_THRESHOLDS.GOOD.minCategories) {
      balanceStatus = 'good';
    } else if (totalScore >= BALANCE_THRESHOLDS.FAIR.minScore && 
               uniqueCategories >= BALANCE_THRESHOLDS.FAIR.minCategories) {
      balanceStatus = 'fair';
    }
    
    const userDoc = await getDoc(doc(this.db, COLLECTIONS.USERS, userId));
    const familyId = userDoc.exists() ? (userDoc.data() as any).familyId : '';
    
    const existing = await this.getDailySummary(userId, date);
    
    const summaryData = {
      userId,
      familyId,
      date,
      totalMinutes,
      totalScore,
      categoryBreakdown,
      balanceStatus,
      streak: await this.calculateStreak(userId, date),
      updatedAt: serverTimestamp(),
    };
    
    if (existing) {
      await updateDoc(doc(this.db, COLLECTIONS.DAILY_SUMMARIES, existing.id), summaryData);
      return { ...existing, ...summaryData } as DailySummary;
    } else {
      const summaryId = `${userId}_${date}`;
      await setDoc(doc(this.db, COLLECTIONS.DAILY_SUMMARIES, summaryId), {
        ...summaryData,
        createdAt: serverTimestamp(),
      });
      return { id: summaryId, ...summaryData, createdAt: serverTimestamp() } as DailySummary;
    }
  }

  private async calculateStreak(userId: string, currentDate: string): Promise<number> {
    const recentQuery = query(
      collection(this.db, COLLECTIONS.DAILY_SUMMARIES),
      where('userId', '==', userId),
      where('date', '<', currentDate),
      orderBy('date', 'desc'),
      limit(30)
    );
    
    const snapshot = await getDocs(recentQuery);
    if (snapshot.empty) return 1;
    
    let streak = 1;
    const dates = snapshot.docs.map((doc) => doc.data().date);
    
    const yesterday = format(
      new Date(new Date(currentDate).getTime() - 24 * 60 * 60 * 1000),
      'yyyy-MM-dd'
    );
    
    if (dates[0] !== yesterday) return 1;
    
    streak = 2;
    for (let i = 1; i < dates.length; i++) {
      const expectedDate = format(
        new Date(new Date(dates[i - 1]).getTime() - 24 * 60 * 60 * 1000),
        'yyyy-MM-dd'
      );
      if (dates[i] === expectedDate) streak++;
      else break;
    }
    
    return streak;
  }
}
