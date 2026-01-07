/**
 * Migration Script: Add merchantId to existing check-ins
 * 
 * This script updates all existing check-in documents in Firestore
 * to include the merchantId field from their associated venue.
 * 
 * Usage:
 * 1. Make sure you're in the web-admin directory
 * 2. Run: node scripts/migrate-checkins.js
 */

const admin = require('firebase-admin');
const serviceAccount = require('../serviceAccountKey.json'); // You need to download this from Firebase Console

// Initialize Firebase Admin
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function migrateCheckIns() {
  console.log('🚀 Starting check-in migration...\n');
  
  try {
    // Get all check-ins
    const checkInsSnapshot = await db.collection('checkIns').get();
    console.log(`📊 Found ${checkInsSnapshot.size} check-ins to process\n`);
    
    let updated = 0;
    let skipped = 0;
    let errors = 0;
    
    // Process each check-in
    for (const checkInDoc of checkInsSnapshot.docs) {
      const checkIn = checkInDoc.data();
      const checkInId = checkInDoc.id;
      
      // Skip if already has merchantId
      if (checkIn.merchantId) {
        skipped++;
        console.log(`⏭️  Skipping ${checkInId} - already has merchantId`);
        continue;
      }
      
      // Skip if no venueId
      if (!checkIn.venueId) {
        errors++;
        console.log(`❌ Error: Check-in ${checkInId} has no venueId`);
        continue;
      }
      
      try {
        // Get venue to find merchantId
        const venueDoc = await db.collection('venues').doc(checkIn.venueId).get();
        
        if (!venueDoc.exists) {
          errors++;
          console.log(`❌ Error: Venue ${checkIn.venueId} not found for check-in ${checkInId}`);
          continue;
        }
        
        const venue = venueDoc.data();
        
        if (!venue.merchantId) {
          errors++;
          console.log(`❌ Error: Venue ${checkIn.venueId} has no merchantId`);
          continue;
        }
        
        // Update check-in with merchantId
        await checkInDoc.ref.update({
          merchantId: venue.merchantId
        });
        
        updated++;
        console.log(`✅ Updated check-in ${checkInId} with merchantId: ${venue.merchantId}`);
        
      } catch (error) {
        errors++;
        console.error(`❌ Error processing check-in ${checkInId}:`, error.message);
      }
    }
    
    console.log('\n' + '='.repeat(50));
    console.log('📈 Migration Summary:');
    console.log('='.repeat(50));
    console.log(`✅ Updated: ${updated}`);
    console.log(`⏭️  Skipped: ${skipped}`);
    console.log(`❌ Errors: ${errors}`);
    console.log(`📊 Total: ${checkInsSnapshot.size}`);
    console.log('='.repeat(50));
    
    if (updated > 0) {
      console.log('\n✨ Migration completed successfully!');
      console.log('💡 Next steps:');
      console.log('   1. Create the required Firestore indexes (see FIREBASE_INDEXES_SETUP.md)');
      console.log('   2. Test the merchant panel check-ins page');
      console.log('   3. Verify analytics are showing correct data');
    } else {
      console.log('\n⚠️  No check-ins were updated. This could mean:');
      console.log('   - All check-ins already have merchantId');
      console.log('   - There are no check-ins in the database');
      console.log('   - There were errors (check the log above)');
    }
    
  } catch (error) {
    console.error('\n💥 Fatal error during migration:', error);
    process.exit(1);
  }
  
  process.exit(0);
}

// Run the migration
migrateCheckIns();

