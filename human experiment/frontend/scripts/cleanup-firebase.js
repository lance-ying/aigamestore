#!/usr/bin/env node

/**
 * Cleanup script for Firebase Storage and Firestore
 * Usage: node scripts/cleanup-firebase.js [options]
 *
 * Options:
 *   --storage-only    Only delete Storage files
 *   --firestore-only  Only delete Firestore collections
 *   --all             Delete everything (Storage + Firestore)
 *   --dry-run         Show what would be deleted without actually deleting
 */

const admin = require('firebase-admin');
const readline = require('readline');
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
let db = app.firestore('ai-gamestore-database');

// Parse command line arguments
const args = process.argv.slice(2);
const options = {
  storageOnly: args.includes('--storage-only'),
  firestoreOnly: args.includes('--firestore-only'),
  all: args.includes('--all'),
  dryRun: args.includes('--dry-run'),
};

// If no specific option, default to --all
if (!options.storageOnly && !options.firestoreOnly && !options.all) {
  options.all = true;
}

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

async function deleteFirestoreCollection(collectionName) {
  const batchSize = 500;
  let deletedCount = 0;

  try {
    const collectionRef = db.collection(collectionName);
    const query = collectionRef.limit(batchSize);

    return new Promise((resolve, reject) => {
      deleteQueryBatch(query, resolve, reject);
    });

    async function deleteQueryBatch(query, resolve, reject) {
      try {
        const snapshot = await query.get();

        if (snapshot.size === 0) {
          resolve(deletedCount);
          return;
        }

        const batch = db.batch();
        snapshot.docs.forEach((doc) => {
          batch.delete(doc.ref);
        });

        await batch.commit();
        deletedCount += snapshot.size;

        if (deletedCount % 100 === 0 || snapshot.size < batchSize) {
          console.log(`  Deleted ${deletedCount} documents from ${collectionName}...`);
        }

        if (snapshot.size < batchSize) {
          resolve(deletedCount);
        } else {
          process.nextTick(() => {
            deleteQueryBatch(query, resolve, reject);
          });
        }
      } catch (error) {
        reject(error);
      }
    }
  } catch (error) {
    console.error(`  Error deleting collection ${collectionName}:`, error.message);
    return 0;
  }
}

async function cleanupFirestore() {
  console.log('\nCleaning up Firestore...\n');

  const collections = ['gameplay_sessions', 'users', 'games', 'end-study-feedback'];
  let totalDeleted = 0;

  for (const collectionName of collections) {
    try {
      // Check if collection exists and has documents
      const snapshot = await db.collection(collectionName).limit(1).get();

      if (snapshot.empty) {
        console.log(`  ${collectionName}: No documents to delete`);
        continue;
      }

      if (options.dryRun) {
        const count = await db.collection(collectionName).count().get();
        console.log(`  Would delete ~${count.data().count} documents from ${collectionName}`);
      } else {
        const deletedCount = await deleteFirestoreCollection(collectionName);
        totalDeleted += deletedCount;
        console.log(`  Deleted ${deletedCount} documents from ${collectionName}`);
      }
    } catch (error) {
      console.error(`  Error with collection ${collectionName}:`, error.message);
    }
  }

  if (!options.dryRun) {
    console.log(`\nTotal Firestore documents deleted: ${totalDeleted}\n`);
  }
}

async function cleanupStorage() {
  console.log('\nCleaning up Storage...\n');

  const bucket = storage.bucket();

  try {
    // Get all files
    const [files] = await bucket.getFiles();

    console.log(`Found ${files.length} files in Storage\n`);

    if (files.length === 0) {
      console.log('  No files to delete\n');
      return;
    }

    if (options.dryRun) {
      console.log('  Would delete the following files:\n');
      files.forEach((file, index) => {
        if (index < 20) {
          console.log(`     - ${file.name}`);
        }
      });
      if (files.length > 20) {
        console.log(`     ... and ${files.length - 20} more files`);
      }
      console.log();
      return;
    }

    // Ask for confirmation before deleting Storage files
    const answer = await question(
      `About to delete ${files.length} files from Storage. Are you sure? (yes/no): `
    );

    if (answer.toLowerCase() !== 'yes') {
      console.log('Cancelled Storage cleanup\n');
      return;
    }

    let deletedCount = 0;

    // Delete files in batches
    for (const file of files) {
      try {
        await file.delete();
        deletedCount++;

        if (deletedCount % 10 === 0) {
          console.log(`  Deleted ${deletedCount}/${files.length} files...`);
        }
      } catch (error) {
        console.error(`  Failed to delete ${file.name}:`, error.message);
      }
    }

    console.log(`\nDeleted ${deletedCount} files from Storage\n`);
  } catch (error) {
    console.error('Storage cleanup failed:', error.message);
  }
}

async function cleanup() {
  try {
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('Firebase Cleanup Script');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    if (options.dryRun) {
      console.log('DRY RUN MODE - No changes will be made\n');
    }

    console.log('Options:');
    console.log(`  Storage: ${options.all || options.storageOnly ? 'Yes' : 'No'}`);
    console.log(`  Firestore: ${options.all || options.firestoreOnly ? 'Yes' : 'No'}`);
    console.log(`  Dry Run: ${options.dryRun ? 'Yes' : 'No'}\n`);

    // Cleanup Firestore
    if (options.all || options.firestoreOnly) {
      await cleanupFirestore();
    }

    // Cleanup Storage
    if (options.all || options.storageOnly) {
      await cleanupStorage();
    }

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('CLEANUP COMPLETE!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    rl.close();
    process.exit(0);
  } catch (error) {
    console.error('Cleanup failed:', error.message);
    rl.close();
    process.exit(1);
  }
}

cleanup();
