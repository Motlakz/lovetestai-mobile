import { getApp, getApps, initializeApp, type FirebaseApp } from 'firebase/app';
import { getDatabase, type Database } from 'firebase/database';
import { getFirestore, type Firestore } from 'firebase/firestore';
import { getAuth, GoogleAuthProvider, type Auth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  databaseURL: process.env.EXPO_PUBLIC_FIREBASE_DATABASE_URL,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

const isPlaceholderLike = (value?: string): boolean => {
  if (!value) return true;
  const v = value.trim().toLowerCase();
  return (
    v.length === 0 ||
    v.includes('your_') ||
    v.includes('example') ||
    v.includes('placeholder') ||
    v === 'changeme'
  );
};

const isConfigured = () => !!(
  !isPlaceholderLike(firebaseConfig.apiKey) &&
  !isPlaceholderLike(firebaseConfig.projectId) &&
  !isPlaceholderLike(firebaseConfig.appId) &&
  !isPlaceholderLike(firebaseConfig.authDomain)
);

export const isFirebaseAvailable = isConfigured();

export const app: FirebaseApp | null = isFirebaseAvailable
  ? getApps().length === 0
    ? initializeApp(firebaseConfig)
    : getApp()
  : null;

let auth: Auth | null = null;
let firestore: Firestore | null = null;
let database: Database | null = null;

if (app) {
  try {
    auth = getAuth(app);
  } catch (error) {
    console.warn('Firebase Auth initialization failed:', error);
  }

  try {
    firestore = getFirestore(app);
  } catch (error) {
    console.warn('Firebase Firestore initialization failed:', error);
  }

  try {
    database = firebaseConfig.databaseURL
      ? getDatabase(app, firebaseConfig.databaseURL)
      : getDatabase(app);
  } catch (error) {
    console.warn('Firebase Realtime Database initialization failed:', error);
  }
}

export { auth, database, firestore, GoogleAuthProvider };
