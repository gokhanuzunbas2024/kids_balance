import { create } from 'zustand';
import { UserSettings } from '@/types';
import { db } from '@/db/schema';

interface SettingsStore {
  settings: UserSettings | null;
  isLoading: boolean;
  loadSettings: () => Promise<void>;
  updateSettings: (updates: Partial<UserSettings>) => Promise<void>;
  setChildName: (name: string) => Promise<void>;
  hasChildName: () => boolean;
}

export const useSettingsStore = create<SettingsStore>((set, get) => ({
  settings: null,
  isLoading: false,

  loadSettings: async () => {
    set({ isLoading: true });
    try {
      const allSettings = await db.settings.toArray();
      let settings = allSettings[0] || null;
      if (!settings) {
        // Create default settings
        settings = {};
        const id = await db.settings.add(settings);
        settings.id = id;
      }
      set({ settings, isLoading: false });
    } catch (error) {
      console.error('Error loading settings:', error);
      set({ settings: null, isLoading: false });
    }
  },

  updateSettings: async (updates) => {
    const currentSettings = get().settings || {};
    const updatedSettings = { ...currentSettings, ...updates };
    
    if (currentSettings.id) {
      await db.settings.update(currentSettings.id, updatedSettings);
    } else {
      const id = await db.settings.add(updatedSettings);
      updatedSettings.id = id;
    }
    set({ settings: updatedSettings });
  },

  setChildName: async (name: string) => {
    await get().updateSettings({ childName: name });
  },

  hasChildName: () => {
    const settings = get().settings;
    return !!settings?.childName && settings.childName.trim().length > 0;
  }
}));
