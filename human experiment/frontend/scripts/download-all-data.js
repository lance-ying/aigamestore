#!/usr/bin/env node

/**
 * Download all gameplay data from Firebase Storage and Firestore
 * Usage: node scripts/download-all-data.js [output-dir]
 */

const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '.env.local' });

// Initialize Firebase Admin
const serviceAccount = {
  projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
  clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
  privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, '\n'),
};

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
});

const storage = admin.storage();
const app = admin.app();
// Initialize with named database by default (see lib/firebase/admin.ts)
let db = app.firestore('ai-gamestore-database');
let usingDefaultDb = false;

const outputDir = process.argv[2] || './downloads';

async function downloadAllData() {
  try {
    console.log('Starting download of all gameplay data...\n');

    // Create output directory
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // 1. Try to download Firestore data (skip if fails)
    let sessionsData = [];
    let usersData = [];
    let gamesData = [];

    try {
      console.log('Fetching Firestore data from named database...');
      const sessionsSnap = await db.collection('gameplay_sessions').get();
      const usersSnap = await db.collection('users').get();
      const gamesSnap = await db.collection('games').get();

      // Save Firestore collections as JSON
      const firestoreDir = path.join(outputDir, 'firestore');
      fs.mkdirSync(firestoreDir, { recursive: true });

      sessionsData = sessionsSnap.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));

      usersData = usersSnap.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));

      gamesData = gamesSnap.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));

      fs.writeFileSync(path.join(firestoreDir, 'gameplay_sessions.json'), JSON.stringify(sessionsData, null, 2));
      fs.writeFileSync(path.join(firestoreDir, 'users.json'), JSON.stringify(usersData, null, 2));
      fs.writeFileSync(path.join(firestoreDir, 'games.json'), JSON.stringify(gamesData, null, 2));

      console.log(`Downloaded ${sessionsData.length} sessions`);
      console.log(`Downloaded ${usersData.length} users`);
      console.log(`Downloaded ${gamesData.length} games\n`);
    } catch (firestoreError) {
      console.warn(`Named database not accessible: ${firestoreError.message}`);
      console.log('Trying default database as fallback...\n');

      try {
        db = app.firestore(); // Use default database
        usingDefaultDb = true;

        const sessionsSnap = await db.collection('gameplay_sessions').get();
        const usersSnap = await db.collection('users').get();
        const gamesSnap = await db.collection('games').get();

        // Save Firestore collections as JSON
        const firestoreDir = path.join(outputDir, 'firestore');
        fs.mkdirSync(firestoreDir, { recursive: true });

        sessionsData = sessionsSnap.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        }));

        usersData = usersSnap.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        }));

        gamesData = gamesSnap.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        }));

        fs.writeFileSync(path.join(firestoreDir, 'gameplay_sessions.json'), JSON.stringify(sessionsData, null, 2));
        fs.writeFileSync(path.join(firestoreDir, 'users.json'), JSON.stringify(usersData, null, 2));
        fs.writeFileSync(path.join(firestoreDir, 'games.json'), JSON.stringify(gamesData, null, 2));

        console.log(`Downloaded ${sessionsData.length} sessions (from default database)`);
        console.log(`Downloaded ${usersData.length} users (from default database)`);
        console.log(`Downloaded ${gamesData.length} games (from default database)\n`);
      } catch (defaultDbError) {
        console.warn(`Could not access default database either: ${defaultDbError.message}`);
        console.log('Continuing with Storage download only...\n');
      }
    }

    // 2. Download all Storage files
    console.log('Fetching Storage files...');
    const bucket = storage.bucket();
    const [files] = await bucket.getFiles();

    console.log(`Found ${files.length} files in Storage\n`);

    let downloadedCount = 0;

    for (const file of files) {
      const destination = path.join(outputDir, 'storage', file.name);
      const dir = path.dirname(destination);

      // Create directory if it doesn't exist
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      try {
        await file.download({ destination });
        downloadedCount++;

        // Show progress every 10 files
        if (downloadedCount % 10 === 0) {
          console.log(`  Downloaded ${downloadedCount}/${files.length} files...`);
        }
      } catch (error) {
        console.error(`  Failed to download ${file.name}:`, error.message);
      }
    }

    console.log(`\nDownloaded ${downloadedCount} files from Storage\n`);

    // 3. Create summary report
    const summary = {
      downloadedAt: new Date().toISOString(),
      totalSessions: sessionsData.length,
      totalUsers: usersData.length,
      totalGames: gamesData.length,
      totalStorageFiles: downloadedCount,
      directory: path.resolve(outputDir),
      structure: {
        firestore: {
          'gameplay_sessions.json': sessionsData.length + ' records',
          'users.json': usersData.length + ' records',
          'games.json': gamesData.length + ' records',
        },
        storage: downloadedCount + ' files in games/ directory',
      },
    };

    fs.writeFileSync(path.join(outputDir, 'DOWNLOAD_SUMMARY.json'), JSON.stringify(summary, null, 2));

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('DOWNLOAD COMPLETE!\n');
    console.log('Summary:');
    console.log(`   Sessions: ${sessionsData.length}`);
    console.log(`   Users: ${usersData.length}`);
    console.log(`   Games: ${gamesData.length}`);
    console.log(`   Storage Files: ${downloadedCount}`);
    console.log(`\nFiles saved to: ${path.resolve(outputDir)}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    process.exit(0);
  } catch (error) {
    console.error('Download failed:', error.message);
    process.exit(1);
  }
}

downloadAllData();
