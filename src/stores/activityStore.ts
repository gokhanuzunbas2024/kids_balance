import { create } from 'zustand';
import { Activity, ActivityFormData } from '@/types';
import { db } from '@/db/schema';

interface ActivityStore {
  activities: Activity[];
  isLoading: boolean;
  loadActivities: () => Promise<void>;
  forceSeedActivities: () => Promise<void>;
  createActivity: (data: ActivityFormData) => Promise<Activity>;
  updateActivity: (id: string, data: Partial<Activity>) => Promise<void>;
  deleteActivity: (id: string) => Promise<void>;
  toggleFavorite: (id: string) => Promise<void>;
}

export const useActivityStore = create<ActivityStore>((set, get) => ({
  activities: [],
  isLoading: false,

  loadActivities: async () => {
    set({ isLoading: true });
    try {
      const allActivities = await db.activities.toArray();
      const activeActivities = allActivities.filter(a => !a.isArchived);
      
      console.log(`✅ Loaded ${activeActivities.length} activities`);
      
      set({ activities: activeActivities, isLoading: false });
    } catch (error) {
      console.error('❌ Error loading activities:', error);
      set({ activities: [], isLoading: false });
    }
  },

  forceSeedActivities: async () => {
    try {
      console.log('🔄 Force seeding activities...');
      // Clear existing preset activities first
      const allActivities = await db.activities.toArray();
      const existingPresets = allActivities.filter(a => a.isPreset);
      if (existingPresets.length > 0) {
        console.log(`🗑️  Clearing ${existingPresets.length} existing preset activities...`);
        await db.activities.bulkDelete(existingPresets.map(a => a.id));
      }
      
      // Seed fresh activities
      const { seedDatabase } = await import('@/db/seedData');
      await seedDatabase();
      
      // Reload activities
      await get().loadActivities();
      console.log('✅ Force seed completed');
    } catch (error) {
      console.error('❌ Error force seeding activities:', error);
      throw error;
    }
  },

  createActivity: async (data) => {
    const activity: Activity = {
      ...data,
      id: crypto.randomUUID(),
      createdAt: new Date(),
      isFavorite: false,
      isPreset: false,
      isArchived: false
    };
    await db.activities.add(activity);
    set(state => ({ activities: [...state.activities, activity] }));
    return activity;
  },

  updateActivity: async (id, data) => {
    await db.activities.update(id, data);
    set(state => ({
      activities: state.activities.map(a =>
        a.id === id ? { ...a, ...data } : a
      )
    }));
  },

  deleteActivity: async (id) => {
    await db.activities.update(id, { isArchived: true });
    set(state => ({
      activities: state.activities.filter(a => a.id !== id)
    }));
  },

  toggleFavorite: async (id) => {
    const activity = get().activities.find(a => a.id === id);
    if (activity) {
      await db.activities.update(id, { isFavorite: !activity.isFavorite });
      set(state => ({
        activities: state.activities.map(a =>
          a.id === id ? { ...a, isFavorite: !a.isFavorite } : a
        )
      }));
    }
  }
}));
