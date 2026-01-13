# Part 6: Repository Layer & Data Access

Complete data access layer with Firebase and local storage implementations.

---

## Repository Interfaces

### `src/repositories/interfaces/IUserRepository.ts`

```typescript
import { User, CreateUserDTO, UpdateUserDTO } from '@/types';

export interface IUserRepository {
  getById(id: string): Promise<User | null>;
  getByEmail(email: string): Promise<User | null>;
  getByFamilyId(familyId: string): Promise<User[]>;
  create(data: CreateUserDTO & { id: string }): Promise<User>;
  update(id: string, data: UpdateUserDTO): Promise<User>;
  delete(id: string): Promise<void>;
}
```

### `src/repositories/interfaces/IActivityRepository.ts`

```typescript
import { Activity, CreateActivityDTO, UpdateActivityDTO, QueryOptions } from '@/types';

export interface IActivityRepository {
  getById(id: string): Promise<Activity | null>;
  getByFamilyId(familyId: string, options?: QueryOptions): Promise<Activity[]>;
  getActiveByFamilyId(familyId: string): Promise<Activity[]>;
  getByCategory(familyId: string, category: string): Promise<Activity[]>;
  create(data: CreateActivityDTO & { id: string }): Promise<Activity>;
  update(id: string, data: UpdateActivityDTO): Promise<Activity>;
  delete(id: string): Promise<void>;
  seedDefaults(familyId: string, createdBy: string): Promise<void>;
}
```

### `src/repositories/interfaces/IActivityLogRepository.ts`

```typescript
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
```

---

## Firebase Activity Log Repository

### `src/repositories/firebase/ActivityLogRepository.ts`

```typescript
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
    let q = query(
      collection(this.db, COLLECTIONS.ACTIVITY_LOGS),
      where('familyId', '==', familyId),
      orderBy('loggedAt', 'desc')
    );
    
    if (options?.limit) q = query(q, limit(options.limit));
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })) as ActivityLog[];
  }

  async getByDateRange(userId: string, range: DateRange): Promise<ActivityLog[]> {
    const q = query(
      collection(this.db, COLLECTIONS.ACTIVITY_LOGS),
      where('userId', '==', userId),
      where('loggedAt', '>=', Timestamp.fromDate(range.start)),
      where('loggedAt', '<=', Timestamp.fromDate(range.end)),
      orderBy('loggedAt', 'desc')
    );
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })) as ActivityLog[];
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
    
    const activity = activityDoc.data();
    const qualityScore = durationMinutes * activity.coefficient;
    
    const log: Omit<ActivityLog, 'id'> = {
      activityId,
      userId,
      familyId,
      durationMinutes,
      qualityScore,
      notes: notes || undefined,
      mood: mood || undefined,
      loggedAt: loggedAt ? Timestamp.fromDate(loggedAt) : serverTimestamp() as any,
      createdAt: serverTimestamp() as any,
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
          data.qualityScore = data.durationMinutes * activityDoc.data().coefficient;
        }
      }
    }
    
    await updateDoc(docRef, data);
    
    const updated = await this.getById(id);
    if (!updated) throw new Error('Activity log not found after update');
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
    const familyId = userDoc.exists() ? userDoc.data().familyId : '';
    
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
```

---

## Local Dexie Database (Offline Cache)

### `src/db/schema.ts`

```typescript
import Dexie, { Table } from 'dexie';
import { User, Family, Activity, ActivityLog, DailySummary, PendingChange } from '@/types';

export class KidsBalanceDB extends Dexie {
  users!: Table<User>;
  families!: Table<Family>;
  activities!: Table<Activity>;
  activityLogs!: Table<ActivityLog>;
  dailySummaries!: Table<DailySummary>;
  pendingChanges!: Table<PendingChange>;

  constructor() {
    super('KidsBalanceDB');
    
    this.version(1).stores({
      users: 'id,