import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getAnalytics } from 'firebase/analytics';
import { getRemoteConfig } from 'firebase/remote-config';
import {
  FIREBASE_API_KEY,
  FIREBASE_AUTH_DOMAIN,
  FIREBASE_PROJECT_ID,
  FIREBASE_STORAGE_BUCKET,
  FIREBASE_MESSAGING_SENDER_ID,
  FIREBASE_APP_ID,
  FIREBASE_MEASUREMENT_ID,
} from '@env';

const firebaseConfig = {
  apiKey: FIREBASE_API_KEY,
  authDomain: FIREBASE_AUTH_DOMAIN,
  projectId: FIREBASE_PROJECT_ID,
  storageBucket: FIREBASE_STORAGE_BUCKET,
  messagingSenderId: FIREBASE_MESSAGING_SENDER_ID,
  appId: FIREBASE_APP_ID,
  measurementId: FIREBASE_MEASUREMENT_ID,
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services with React Native compatibility
export const firebaseAuth = getAuth(app);
export const firebaseFirestore = getFirestore(app);

// Analytics - only initialize if in web environment
let firebaseAnalytics: any = null;
try {
  if (typeof document !== 'undefined') {
    firebaseAnalytics = getAnalytics(app);
  }
} catch (error) {
  console.log('Analytics not available in React Native environment');
}

// Remote Config - only initialize if in web environment
let firebaseRemoteConfig: any = null;
try {
  if (typeof document !== 'undefined') {
    firebaseRemoteConfig = getRemoteConfig(app);
  }
} catch (error) {
  console.log('Remote Config not available in React Native environment');
}

export { firebaseAnalytics, firebaseRemoteConfig };
export default app;
