import { initializeApp, getApp, getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getStorage, connectStorageEmulator } from 'firebase/storage';

if (!process.env.NEXT_PUBLIC_FIREBASE_API_KEY) {
  throw new Error('Firebase configuration is missing. Check your .env.local file.');
}

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Initialize Firebase only if it hasn't been initialized
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Initialize Auth
const auth = getAuth(app);

// Initialize Firestore
const db = getFirestore(app);

// Initialize Storage
const storage = getStorage(app);

// Only connect to emulators if explicitly enabled and running
if (process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATOR === 'true' && process.env.FIREBASE_EMULATOR_RUNNING === 'true') {
  console.log('Connecting to Firebase emulators...');
  connectFirestoreEmulator(db, 'localhost', 8080);
  connectStorageEmulator(storage, 'localhost', 9199);
}

export { app, auth, db, storage };
