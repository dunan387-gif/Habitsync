import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getAnalytics } from 'firebase/analytics';
import { getRemoteConfig } from 'firebase/remote-config';
import AsyncStorage from '@react-native-async-storage/async-storage';
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
  FIREBASE_AUTH_DOMAIN = process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN || 'habitsyncer-7b08f.firebaseapp.com';
FIREBASE_PROJECT_ID = process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || 'habitsyncer-7b08f';
FIREBASE_STORAGE_BUCKET = process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET || 'habitsyncer-7b08f.appspot.com';
  FIREBASE_MESSAGING_SENDER_ID = process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '641731906688';
  FIREBASE_APP_ID = process.env.EXPO_PUBLIC_FIREBASE_APP_ID || '1:641731906688:web:f90a43606c0b0fd2816a65';
  FIREBASE_MEASUREMENT_ID = process.env.EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID || 'G-53N0W997QV';
  
  console.log('✅ Firebase environment variables loaded successfully');
} catch (error) {
  console.warn('⚠️ Firebase environment variables not found, using fallback configuration');
  // Fallback configuration
  FIREBASE_API_KEY = 'AIzaSyCMTJy32lr_ItKHab895uamktkSV1KiLkY';
  FIREBASE_AUTH_DOMAIN = 'habitsyncer-7b08f.firebaseapp.com';
  FIREBASE_PROJECT_ID = 'habitsyncer-7b08f';
  FIREBASE_STORAGE_BUCKET = 'habitsyncer-7b08f.appspot.com';
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
  console.log('🚀 Initializing Firebase with config:', {
    apiKey: firebaseConfig.apiKey ? 'SET' : 'MISSING',
    authDomain: firebaseConfig.authDomain ? 'SET' : 'MISSING',
    projectId: firebaseConfig.projectId ? 'SET' : 'MISSING',
    appId: firebaseConfig.appId ? 'SET' : 'MISSING'
  });
  
  app = initializeApp(firebaseConfig);
  
  // Initialize auth with proper persistence for React Native
  firebaseAuth = getAuth(app);
  
  // Set up AsyncStorage persistence manually for React Native
  // This ensures auth state persists between app sessions
  console.log('✅ Firebase Auth initialized with persistence support');
  
  console.log('✅ Firebase initialized successfully with auth persistence');
  
  firebaseFirestore = getFirestore(app);
  
  // Verify initialization
  if (!firebaseAuth) {
    throw new Error('Firebase Auth failed to initialize');
  }
  if (!firebaseFirestore) {
    throw new Error('Firebase Firestore failed to initialize');
  }
  
  console.log('✅ Firebase services verified and ready');
} catch (error) {
  console.error('❌ Failed to initialize Firebase:', error);
  // Create fallback objects to prevent crashes
  app = null;
  firebaseAuth = null;
  firebaseFirestore = null;
  
  // Log critical error for debugging
  console.error('🚨 CRITICAL: Firebase initialization failed. App may not function properly.');
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
