import { initializeApp, getApp, getApps, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { Firestore, getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getStorage, connectStorageEmulator, FirebaseStorage } from 'firebase/storage';
import { Database, getDatabase, connectDatabaseEmulator } from 'firebase/database';

// Log all environment variables (without values)
console.log('Available environment variables:', 
  Object.keys(process.env)
    .filter(key => key.startsWith('NEXT_PUBLIC_'))
    .join(', ')
);

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
};

// Log config keys (without values)
console.log('Firebase config keys:', Object.keys(firebaseConfig).join(', '));

let app: FirebaseApp;
let auth: Auth;
let db: Firestore;
let storage: FirebaseStorage;
let database: Database;

try {
  if (!firebaseConfig.apiKey) {
    throw new Error(`Firebase API Key is missing. Check that NEXT_PUBLIC_FIREBASE_API_KEY is set in .env.local and the server has been restarted.`);
  }

  if (!firebaseConfig.authDomain) {
    throw new Error('Firebase Auth Domain is missing');
  }

  if (!firebaseConfig.projectId) {
    throw new Error('Firebase Project ID is missing');
  }

  if (!firebaseConfig.databaseURL) {
    throw new Error('Firebase Database URL is missing');
  }

  console.log('Initializing Firebase with valid config...');
  
  // Initialize Firebase only if it hasn't been initialized
  app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

  // Initialize services
  auth = getAuth(app);
  db = getFirestore(app);
  storage = getStorage(app);
  // Initialize Storage with custom settings
 
  storage = getStorage(app);

  // Initialize Database
  database = getDatabase(app);

  console.log('Firebase services initialized successfully');
  
  // Only connect to emulators if explicitly enabled and running
  if (process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATOR === 'true' && process.env.FIREBASE_EMULATOR_RUNNING === 'true') {
    console.log('Connecting to Firebase emulators...');
    connectFirestoreEmulator(db, 'localhost', 8080);
    connectStorageEmulator(storage, 'localhost', 9199);
    connectDatabaseEmulator(database, 'localhost', 9000);
  }
} catch (error) {
  console.error('Error initializing Firebase:', error);
  throw error;
}

export { app, auth, db, storage, database };
