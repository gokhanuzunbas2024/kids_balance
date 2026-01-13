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
import { getFirebaseDb, COLLECTIONS } from '@/config/firebase';
import { Activity, CreateActivityDTO, UpdateActivityDTO, QueryOptions, ACTIVITY_PRESETS } from '@/types';
import { IActivityRepository } from '../interfaces/IActivityRepository';

export class FirebaseActivityRepository implements IActivityRepository {
  private db = getFirebaseDb();

  async getById(id: string): Promise<Activity | null> {
    const docRef = doc(this.db, COLLECTIONS.ACTIVITIES, id);
    const docSnap = await getDoc(docRef);
    
    if (!docSnap.exists()) return null;
    return { id: docSnap.id, ...docSnap.data() } as Activity;
  }

  async getByFamilyId(familyId: string, options?: QueryOptions): Promise<Activity[]> {
    let q = query(
      collection(this.db, COLLECTIONS.ACTIVITIES),
      where('familyId', '==', familyId),
      orderBy('category', 'asc'),
      orderBy('name', 'asc')
    );
    
    if (options?.limit) q = query(q, limit(options.limit));
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })) as Activity[];
  }

  async getActiveByFamilyId(familyId: string): Promise<Activity[]> {
    const q = query(
      collection(this.db, COLLECTIONS.ACTIVITIES),
      where('familyId', '==', familyId),
      where('isActive', '==', true),
      orderBy('category', 'asc'),
      orderBy('name', 'asc')
    );
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })) as Activity[];
  }

  async getByCategory(familyId: string, category: string): Promise<Activity[]> {
    const q = query(
      collection(this.db, COLLECTIONS.ACTIVITIES),
      where('familyId', '==', familyId),
      where('category', '==', category),
      where('isActive', '==', true),
      orderBy('name', 'asc')
    );
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })) as Activity[];
  }

  async create(data: CreateActivityDTO & { id: string }): Promise<Activity> {
    const { id, ...activityData } = data;
    
    const activity: Omit<Activity, 'id'> = {
      ...activityData,
      isDefault: false,
      isActive: true,
      createdAt: serverTimestamp() as Timestamp,
      updatedAt: serverTimestamp() as Timestamp,
    };
    
    await setDoc(doc(this.db, COLLECTIONS.ACTIVITIES, id), activity);
    return { id, ...activity } as Activity;
  }

  async update(id: string, data: UpdateActivityDTO): Promise<Activity> {
    const docRef = doc(this.db, COLLECTIONS.ACTIVITIES, id);
    
    await updateDoc(docRef, {
      ...data,
      updatedAt: serverTimestamp(),
    });
    
    const updated = await this.getById(id);
    if (!updated) throw new Error('Activity not found after update');
    return updated;
  }

  async delete(id: string): Promise<void> {
    await deleteDoc(doc(this.db, COLLECTIONS.ACTIVITIES, id));
  }

  async seedDefaults(familyId: string, createdBy: string): Promise<void> {
    // Check if defaults already exist for this family
    const existing = await this.getByFamilyId(familyId);
    const hasDefaults = existing.some(a => a.isDefault);
    
    if (hasDefaults) {
      console.log('Default activities already exist for this family');
      return;
    }

    // Create all preset activities
    const { v4: uuidv4 } = await import('uuid');
    const promises = ACTIVITY_PRESETS.map(async (preset) => {
      const id = uuidv4();
      const activity: Omit<Activity, 'id'> = {
        ...preset,
        familyId,
        createdBy,
        createdAt: serverTimestamp() as Timestamp,
        updatedAt: serverTimestamp() as Timestamp,
      };
      
      await setDoc(doc(this.db, COLLECTIONS.ACTIVITIES, id), activity);
    });

    await Promise.all(promises);
    console.log(`Seeded ${ACTIVITY_PRESETS.length} default activities for family ${familyId}`);
  }
}
