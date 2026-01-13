import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import { Activity, CreateActivityDTO, UpdateActivityDTO, ActivityCategory } from '@/types';
import { FirebaseActivityRepository } from '@/repositories/firebase/ActivityRepository';

interface ActivityStore {
  activities: Activity[];
  isLoading: boolean;
  error: string | null;
  selectedCategory: ActivityCategory | 'all';
  fetchActivities: (familyId: string) => Promise<void>;
  createActivity: (data: CreateActivityDTO) => Promise<Activity>;
  updateActivity: (id: string, data: UpdateActivityDTO) => Promise<void>;
  deleteActivity: (id: string) => Promise<void>;
  setSelectedCategory: (category: ActivityCategory | 'all') => void;
  getActiveActivities: () => Activity[];
  getByCategory: (category: ActivityCategory) => Activity[];
  seedDefaults: (familyId: string, createdBy: string) => Promise<void>;
}

const repository = new FirebaseActivityRepository();

export const useActivityStore = create<ActivityStore>((set, get) => ({
  activities: [],
  isLoading: false,
  error: null,
  selectedCategory: 'all',

  fetchActivities: async (familyId: string) => {
    set({ isLoading: true, error: null });
    try {
      const activities = await repository.getActiveByFamilyId(familyId);
      set({ activities, isLoading: false });
    } catch (error) {
      console.error('Error fetching activities:', error);
      set({ 
        error: (error as Error).message, 
        isLoading: false 
      });
    }
  },

  seedDefaults: async (familyId: string, createdBy: string) => {
    try {
      await repository.seedDefaults(familyId, createdBy);
      // Reload activities after seeding
      await get().fetchActivities(familyId);
    } catch (error) {
      console.error('Error seeding defaults:', error);
      throw error;
    }
  },

  createActivity: async (data: CreateActivityDTO) => {
    const id = uuidv4();
    try {
      const activity = await repository.create({ ...data, id });
      set(state => ({ activities: [...state.activities, activity] }));
      return activity;
    } catch (error) {
      console.error('Error creating activity:', error);
      throw error;
    }
  },

  updateActivity: async (id: string, data: UpdateActivityDTO) => {
    try {
      const updated = await repository.update(id, data);
      set(state => ({
        activities: state.activities.map(a =>
          a.id === id ? updated : a
        )
      }));
    } catch (error) {
      console.error('Error updating activity:', error);
      throw error;
    }
  },

  deleteActivity: async (id: string) => {
    try {
      await repository.delete(id);
      set(state => ({
        activities: state.activities.filter(a => a.id !== id)
      }));
    } catch (error) {
      console.error('Error deleting activity:', error);
      throw error;
    }
  },

  setSelectedCategory: (category) =>
    set({ selectedCategory: category }),

  getActiveActivities: () => {
    return get().activities.filter(a => a.isActive);
  },

  getByCategory: (category: ActivityCategory) => {
    return get().activities.filter(
      (a) => a.isActive && a.category === category
    );
  },
}));
