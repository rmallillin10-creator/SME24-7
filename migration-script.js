// Migration Script: Initial Data Load to Supabase
// Run this in browser console on admin page after Supabase is configured

async function migrateDataToSupabase() {
  console.log("Starting data migration to Supabase...");
  
  await initSupabase();
  
  // Migrate hardcoded therapist data
  console.log("Migrating therapists...");
  for (const therapist of therapistData) {
    const result = await saveTherapistToSupabase(therapist);
    if (result.error) {
      console.error(`Failed to migrate ${therapist.name}:`, result.error);
    } else {
      console.log(`✓ Migrated ${therapist.name}`);
    }
  }
  
  // Migrate localStorage settings to Supabase
  console.log("Migrating settings...");
  const localSettings = getSiteSettings();
  const result = await saveSiteSettingsToSupabase(localSettings);
  if (result.error) {
    console.error("Failed to migrate settings:", result.error);
  } else {
    console.log("✓ Migrated settings");
  }
  
  console.log("Migration complete!");
}

// Usage:
// 1. Open browser DevTools (F12)
// 2. Go to Console tab
// 3. Paste this script
// 4. Run: migrateDataToSupabase()
