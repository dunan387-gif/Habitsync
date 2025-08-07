import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Your Firebase configuration
// Using actual Firebase project credentials
const firebaseConfig = {
  apiKey: "AIzaSyD7ITq2ebyacgpw4a2wmJH3euDhlYErnuo",
  authDomain: "habitsync-backend.firebaseapp.com",
  projectId: "habitsync-backend",
  storageBucket: "habitsync-backend.firebasestorage.app",
  messagingSenderId: "283940410289",
  appId: "1:283940410289:web:50536e3d1e0f1f5ddc2390",
  measurementId: "G-PBRXMW6WTQ"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);

export default app; 