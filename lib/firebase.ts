import { initializeApp, FirebaseApp, getApps } from 'firebase/app';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getAuth, Auth } from 'firebase/auth';

const firebaseConfig = {
  apiKey:            process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain:        process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId:         process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket:     process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId:             process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const requiredKeys = ['apiKey', 'authDomain', 'projectId'] as const;
requiredKeys.forEach((key) => {
  if (!firebaseConfig[key]) {
    console.error(`[Firebase] 환경변수 누락: NEXT_PUBLIC_FIREBASE_${key.toUpperCase()}`);
  }
});

let app: FirebaseApp;
let db: Firestore;
let auth: Auth;

try {
  app  = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
  db   = getFirestore(app);
  auth = getAuth(app);
} catch (error) {
  console.error('[Firebase] 초기화 실패:', error);
  throw error;
}

export const FUNCTIONS_BASE_URL =
  process.env.NEXT_PUBLIC_FUNCTIONS_BASE_URL ?? '';

export { app, db, auth };
