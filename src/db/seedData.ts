import { db } from './schema';
import { PRESET_ACTIVITIES } from '@/constants/presetActivities';
import { Activity } from '@/types';

export async function seedDatabase() {
  try {
    // Ensure database is open
    await db.open();
    
    // Check if activities already exist
    const allActivities = await db.activities.toArray();
    const presetActivities = allActivities.filter(a => a.isPreset);
    
    console.log(`📊 Current activities in DB: ${allActivities.length} (${presetActivities.length} preset)`);
    
    if (presetActivities.length === 0) {
      const activitiesToAdd: Activity[] = PRESET_ACTIVITIES.map(activity => ({
        ...activity,
        id: crypto.randomUUID(),
        createdAt: new Date(),
        isFavorite: false,
        isPreset: true,
        isArchived: false,
        createdBy: 'parent'
      }));

      console.log(`🌱 Seeding ${activitiesToAdd.length} preset activities...`);
      await db.activities.bulkAdd(activitiesToAdd);
      
      // Verify they were added
      const allAfter = await db.activities.toArray();
      const verify = allAfter.filter(a => a.isPreset);
      console.log(`✅ Seeded ${verify.length} preset activities (verified)`);
      return true;
    } else {
      console.log(`ℹ️  ${presetActivities.length} preset activities already exist`);
      return false;
    }
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    // Try to get more details
    if (error instanceof Error) {
      console.error('Error details:', error.message, error.stack);
    }
    throw error;
  }
}
