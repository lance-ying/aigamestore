// Firebase Admin SDK Configuration
// This runs ONLY on the server-side (API routes) and should NEVER be exposed to the client

import { initializeApp, getApps, cert, App } from 'firebase-admin/app';
import { getStorage, Storage } from 'firebase-admin/storage';
import { getFirestore, Firestore } from 'firebase-admin/firestore';

let adminApp: App;
let adminStorage: Storage;
let adminFirestore: Firestore;

if (!getApps().length) {
  adminApp = initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
      clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  });
} else {
  adminApp = getApps()[0];
}

adminStorage = getStorage(adminApp);
adminFirestore = getFirestore(adminApp);

export { adminApp as app, adminStorage as storage, adminFirestore as db };
