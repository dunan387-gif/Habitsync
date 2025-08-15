import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getAnalytics } from 'firebase/analytics';
import { getRemoteConfig } from 'firebase/remote-config';
// Import environment variables with fallbacks
let FIREBASE_API_KEY: string;
let FIREBASE_AUTH_DOMAIN: string;
let FIREBASE_PROJECT_ID: string;
let FIREBASE_STORAGE_BUCKET: string;
let FIREBASE_MESSAGING_SENDER_ID: string;
let FIREBASE_APP_ID: string;
let FIREBASE_MEASUREMENT_ID: string;
 // Use Expo's built-in environment variable support
try {
  FIREBASE_API_KEY = process.env.EXPO_PUBLIC_FIREBASE_API_KEY || 'AIzaSyCMTJy32lr_ItKHab895uamktkSV1KiLkY';
  FIREBASE_AUTH_DOMAIN = process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN || 'habitsync-7b08f.firebaseapp.com';
  FIREBASE_PROJECT_ID = process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || 'habitsync-7b08f';
  FIREBASE_STORAGE_BUCKET = process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET || 'habitsync-7b08f.appspot.com';
  FIREBASE_MESSAGING_SENDER_ID = process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '641731906688';
  FIREBASE_APP_ID = process.env.EXPO_PUBLIC_FIREBASE_APP_ID || '1:641731906688:web:f90a43606c0b0fd2816a65';
  FIREBASE_MEASUREMENT_ID = process.env.EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID || 'G-53N0W997QV';
  
  console.log('✅ Firebase environment variables loaded successfully');
} catch (error) {
  console.warn('⚠️ Firebase environment variables not found, using fallback configuration');
  // Fallback configuration
  FIREBASE_API_KEY = 'AIzaSyCMTJy32lr_ItKHab895uamktkSV1KiLkY';
  FIREBASE_AUTH_DOMAIN = 'habitsync-7b08f.firebaseapp.com';
  FIREBASE_PROJECT_ID = 'habitsync-7b08f';
  FIREBASE_STORAGE_BUCKET = 'habitsync-7b08f.appspot.com';
  FIREBASE_MESSAGING_SENDER_ID = '641731906688';
  FIREBASE_APP_ID = '1:641731906688:web:f90a43606c0b0fd2816a65';
  FIREBASE_MEASUREMENT_ID = 'G-53N0W997QV';
}

const firebaseConfig = {
  apiKey: FIREBASE_API_KEY,
  authDomain: FIREBASE_AUTH_DOMAIN,
  projectId: FIREBASE_PROJECT_ID,
  storageBucket: FIREBASE_STORAGE_BUCKET,
  messagingSenderId: FIREBASE_MESSAGING_SENDER_ID,
  appId: FIREBASE_APP_ID,
  measurementId: FIREBASE_MEASUREMENT_ID,
};

// Initialize Firebase with error handling
let app: any = null;
let firebaseAuth: any = null;
let firebaseFirestore: any = null;

try {
  app = initializeApp(firebaseConfig);
  firebaseAuth = getAuth(app);
  firebaseFirestore = getFirestore(app);
  console.log('Firebase initialized successfully');
} catch (error) {
  console.error('Failed to initialize Firebase:', error);
  // Create fallback objects to prevent crashes
  app = null;
  firebaseAuth = null;
  firebaseFirestore = null;
}

export { firebaseAuth, firebaseFirestore };

// Analytics - only initialize if in web environment and app exists
let firebaseAnalytics: any = null;
try {
  if (typeof document !== 'undefined' && app) {
    firebaseAnalytics = getAnalytics(app);
  }
} catch (error) {
  console.log('Analytics not available in React Native environment');
}

// Remote Config - only initialize if in web environment and app exists
let firebaseRemoteConfig: any = null;
try {
  if (typeof document !== 'undefined' && app) {
    firebaseRemoteConfig = getRemoteConfig(app);
  }
} catch (error) {
  console.log('Remote Config not available in React Native environment');
}

export { firebaseAnalytics, firebaseRemoteConfig };
export default app;
