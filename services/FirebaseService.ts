import { firebaseAuth, firebaseFirestore } from '@/lib/firebase';
import { User, ProfileUpdateData } from '@/types';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  updateProfile,
  sendPasswordResetEmail,
  deleteUser,
  User as FirebaseUser
} from 'firebase/auth';
import { 
  doc, 
  setDoc, 
  getDoc, 
  updateDoc, 
  deleteDoc,
  collection,
  onSnapshot,
  query,
  where,
  orderBy,
  enableNetwork,
  disableNetwork,
  writeBatch
} from 'firebase/firestore';

export class FirebaseService {
  // Authentication methods
  static async signUpWithEmail(email: string, password: string, name: string): Promise<User> {
    const startTime = Date.now();
    console.log('⏱️ Starting Firebase registration for:', email);
    
    try {
      if (!firebaseAuth || !firebaseFirestore) {
        throw new Error('Firebase not initialized');
      }
      
      // Add timeout for Firebase operations
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Registration timeout')), 15000)
      );
      
      const registrationPromise = (async () => {
        const userCredential = await createUserWithEmailAndPassword(firebaseAuth, email, password);
        const firebaseUser = userCredential.user;
        
        // Update display name
        await updateProfile(firebaseUser, {
          displayName: name,
        });

        // Create user document in Firestore
        const userData: User = {
          id: firebaseUser.uid,
          email: firebaseUser.email!,
          name: name,
          joinedAt: new Date().toISOString(),
          onboardingCompleted: false,
          preferences: {
            notifications: true,
            emailUpdates: true,
            publicProfile: false,
          },
          stats: {
            totalHabits: 0,
            completedHabits: 0,
            currentStreak: 0,
            longestStreak: 0,
          },
        };

        console.log('⏱️ Creating user document in Firestore for:', firebaseUser.uid);
        await setDoc(doc(firebaseFirestore, 'users', firebaseUser.uid), userData);
        console.log('✅ User document created successfully in Firestore');
        return userData;
      })();

      const result = await Promise.race([registrationPromise, timeoutPromise]) as User;
      console.log(`⏱️ Firebase registration completed in ${Date.now() - startTime}ms`);
      return result;
    } catch (error: any) {
      console.error('Firebase signup error:', error);
      throw new Error(error.message || 'Signup failed');
    }
  }

  static async signInWithEmail(email: string, password: string): Promise<User> {
    const startTime = Date.now();
    console.log('⏱️ Starting Firebase sign-in for:', email);
    
    try {
      if (!firebaseAuth || !firebaseFirestore) {
        throw new Error('Firebase not initialized');
      }
      
      const userCredential = await signInWithEmailAndPassword(firebaseAuth, email, password);
      const firebaseUser = userCredential.user;
      
      // Get user data from Firestore
      const userDoc = await getDoc(doc(firebaseFirestore, 'users', firebaseUser.uid));

      if (!userDoc.exists()) {
        console.log('⚠️ User document not found in Firestore, creating it...');
        
        // Create the missing user document
        const newUser: User = {
          id: firebaseUser.uid,
          email: firebaseUser.email || email,
          name: firebaseUser.displayName || email.split('@')[0],
          joinedAt: new Date().toISOString(),
          onboardingCompleted: false,
          preferences: {
            notifications: true,
            emailUpdates: true,
            publicProfile: false,
          },
          stats: {
            totalHabits: 0,
            completedHabits: 0,
            currentStreak: 0,
            longestStreak: 0,
          },
        };
        
        // Save the user document to Firestore
        await setDoc(doc(firebaseFirestore, 'users', firebaseUser.uid), newUser);
        console.log('✅ Created missing user document for:', email);
        
        const result = newUser;
        console.log(`⏱️ Firebase sign-in completed in ${Date.now() - startTime}ms`);
        return result;
      }

      const result = userDoc.data() as User;
      console.log(`⏱️ Firebase sign-in completed in ${Date.now() - startTime}ms`);
      return result;
    } catch (error: any) {
      console.error('Firebase signin error:', error);
      throw new Error(error.message || 'Signin failed');
    }
  }

  static async signOut(): Promise<void> {
    try {
      if (!firebaseAuth) {
        throw new Error('Firebase not initialized');
      }
      
      await signOut(firebaseAuth);
    } catch (error: any) {
      console.error('Firebase signout error:', error);
      throw new Error(error.message || 'Signout failed');
    }
  }

  static async getCurrentUser(): Promise<User | null> {
    try {
      if (!firebaseAuth || !firebaseFirestore) {
        return null;
      }
      
      const firebaseUser = firebaseAuth.currentUser;
      if (!firebaseUser) {
        return null;
      }

      // Use the utility function to check and fix user document issues
      return await FirebaseService.checkAndFixUserDocument(firebaseUser);
    } catch (error: any) {
      console.error('Firebase getCurrentUser error:', error);
      return null;
    }
  }

  // User profile methods
  static async updateUserProfile(userId: string, data: ProfileUpdateData): Promise<void> {
    try {
      if (!firebaseFirestore) {
        throw new Error('Firebase not initialized');
      }
      
      // First check if the user document exists
      const userDocRef = doc(firebaseFirestore, 'users', userId);
      const userDoc = await getDoc(userDocRef);
      
      if (!userDoc.exists()) {
        console.log('⚠️ User document not found, creating it for:', userId);
        // Create the user document if it doesn't exist
        const newUser: User = {
          id: userId,
          email: '', // Will be updated by the caller
          name: data.name || '',
          joinedAt: new Date().toISOString(),
          onboardingCompleted: false,
          preferences: {
            notifications: true,
            emailUpdates: true,
            publicProfile: false,
          },
          stats: {
            totalHabits: 0,
            completedHabits: 0,
            currentStreak: 0,
            longestStreak: 0,
          },
        };
        
        await setDoc(userDocRef, newUser);
        console.log('✅ Created missing user document for profile update');
      }
      
      // Convert ProfileUpdateData to Firestore-compatible format
      const updateData: any = {};
      
      if (data.name !== undefined) updateData.name = data.name;
      if (data.bio !== undefined) updateData.bio = data.bio;
      if (data.dateOfBirth !== undefined) updateData.dateOfBirth = data.dateOfBirth;
      if (data.location !== undefined) updateData.location = data.location;
      if (data.avatar !== undefined) updateData.avatar = data.avatar;
      if (data.coverImage !== undefined) updateData.coverImage = data.coverImage;
      if (data.preferences !== undefined) updateData.preferences = data.preferences;
      
      console.log('⏱️ Updating user profile for:', userId, 'with data:', Object.keys(updateData));
      await updateDoc(userDocRef, updateData);
      console.log('✅ User profile updated successfully');
    } catch (error: any) {
      console.error('Firebase updateUserProfile error:', error);
      
      // Provide more specific error messages
      if (error.code === 'permission-denied') {
        throw new Error('Permission denied. Please make sure you are signed in and have permission to update your profile.');
      } else if (error.code === 'not-found') {
        throw new Error('User profile not found. Please try signing in again.');
      } else if (error.code === 'unavailable') {
        throw new Error('Service temporarily unavailable. Please check your internet connection and try again.');
      }
      
      throw new Error(error.message || 'Profile update failed');
    }
  }

  static async getUserProfile(userId: string): Promise<User | null> {
    try {
      if (!firebaseFirestore) {
        return null;
      }
      
      const userDoc = await getDoc(doc(firebaseFirestore, 'users', userId));

      if (!userDoc.exists()) {
        return null;
      }

      return userDoc.data() as User;
    } catch (error: any) {
      console.error('Firebase getUserProfile error:', error);
      return null;
    }
  }

  // Auth state listener
  static onAuthStateChanged(callback: (user: User | null) => void): () => void {
    if (!firebaseAuth || !firebaseFirestore) {
      console.warn('Firebase not initialized, auth state listener not available');
      return () => {}; // Return empty unsubscribe function
    }
    
    return onAuthStateChanged(firebaseAuth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          console.log('✅ Firebase auth state updated:', firebaseUser.email);
          
          // Use the utility function to check and fix user document issues
          const user = await FirebaseService.checkAndFixUserDocument(firebaseUser);
          callback(user);
        } catch (error) {
          console.error('Firebase auth state change error:', error);
          callback(null);
        }
      } else {
        console.log('🚪 Firebase auth state: no user');
        callback(null);
      }
    });
  }

  // Password reset
  static async resetPassword(email: string): Promise<void> {
    try {
      if (!firebaseAuth) {
        throw new Error('Firebase not initialized');
      }
      
      await sendPasswordResetEmail(firebaseAuth, email);
    } catch (error: any) {
      console.error('Firebase resetPassword error:', error);
      throw new Error(error.message || 'Password reset failed');
    }
  }

  // Delete account
  static async deleteAccount(): Promise<void> {
    try {
      if (!firebaseAuth || !firebaseFirestore) {
        throw new Error('Firebase not initialized');
      }
      
      const firebaseUser = firebaseAuth.currentUser;
      if (!firebaseUser) {
        throw new Error('No user logged in');
      }

      // Delete user document from Firestore
      await deleteDoc(doc(firebaseFirestore, 'users', firebaseUser.uid));

      // Delete Firebase user
      await deleteUser(firebaseUser);
    } catch (error: any) {
      console.error('Firebase deleteAccount error:', error);
      throw new Error(error.message || 'Account deletion failed');
    }
  }

  // Real-time data synchronization methods
  static subscribeToUserHabits(userId: string, callback: (habits: any[]) => void) {
    try {
      if (!firebaseFirestore) {
        console.warn('Firebase not initialized, habits subscription not available');
        return () => {}; // Return empty unsubscribe function
      }
      
      const q = query(
        collection(firebaseFirestore, 'habits'),
        where('userId', '==', userId),
        orderBy('createdAt', 'desc')
      );
      
      return onSnapshot(q, (snapshot) => {
        const habits: any[] = [];
        snapshot.forEach((doc) => {
          habits.push({ id: doc.id, ...doc.data() });
        });
        callback(habits);
      }, (error) => {
        console.error('Error in habits subscription:', error);
        // Return empty array on error
        callback([]);
      });
    } catch (error) {
      console.error('Error setting up habits subscription:', error);
      // Return a no-op unsubscribe function
      return () => {};
    }
  }

  static subscribeToUserMoodEntries(userId: string, callback: (entries: any[]) => void) {
    if (!firebaseFirestore) {
      console.warn('Firebase not initialized, mood entries subscription not available');
      return () => {}; // Return empty unsubscribe function
    }
    
    const q = query(
      collection(firebaseFirestore, 'mood_entries'),
      where('userId', '==', userId),
      orderBy('timestamp', 'desc')
    );
    
    return onSnapshot(q, (snapshot) => {
      const entries: any[] = [];
      snapshot.forEach((doc) => {
        entries.push({ id: doc.id, ...doc.data() });
      });
      callback(entries);
    });
  }

  // Offline support
  static async enableOfflineSupport() {
    try {
      if (!firebaseFirestore) {
        console.warn('Firebase not initialized, cannot enable offline support');
        return;
      }
      
      await enableNetwork(firebaseFirestore);
      console.log('Online mode enabled');
    } catch (error) {
      console.error('Error enabling online mode:', error);
    }
  }

  static async disableOfflineSupport() {
    try {
      if (!firebaseFirestore) {
        console.warn('Firebase not initialized, cannot disable offline support');
        return;
      }
      
      await disableNetwork(firebaseFirestore);
      console.log('Offline mode enabled');
    } catch (error) {
      console.error('Error enabling offline mode:', error);
    }
  }

  // Batch operations for better performance
  static async batchUpdateHabits(updates: { habitId: string, data: any }[]) {
    if (!firebaseFirestore) {
      throw new Error('Firebase not initialized');
    }
    
    const batch = writeBatch(firebaseFirestore);
    
    updates.forEach(({ habitId, data }) => {
      const habitRef = doc(firebaseFirestore, 'habits', habitId);
      batch.update(habitRef, data);
    });
    
    await batch.commit();
  }

  static async batchCreateHabits(habits: any[]) {
    if (!firebaseFirestore) {
      throw new Error('Firebase not initialized');
    }
    
    const batch = writeBatch(firebaseFirestore);
    
    habits.forEach((habit) => {
      const habitRef = doc(collection(firebaseFirestore, 'habits'));
      batch.set(habitRef, habit);
    });
    
    await batch.commit();
  }

  // Habit management methods
  static async createHabit(userId: string, habitData: any): Promise<string> {
    try {
      if (!firebaseFirestore) {
        throw new Error('Firebase not initialized');
      }
      
      const habitRef = doc(collection(firebaseFirestore, 'habits'));
      const habit = {
        ...habitData,
        userId,
        id: habitRef.id,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        isActive: true
      };
      
      await setDoc(habitRef, habit);
      return habitRef.id;
    } catch (error: any) {
      console.error('Firebase createHabit error:', error);
      // If it's a permission error, provide a more helpful message
      if (error.code === 'permission-denied') {
        throw new Error('Authentication required. Please sign in to create habits.');
      }
      throw new Error(error.message || 'Failed to create habit');
    }
  }

  static async updateHabit(habitId: string, data: any): Promise<void> {
    try {
      if (!firebaseFirestore) {
        throw new Error('Firebase not initialized');
      }
      
      const habitRef = doc(firebaseFirestore, 'habits', habitId);
      await updateDoc(habitRef, {
        ...data,
        updatedAt: new Date().toISOString()
      });
    } catch (error: any) {
      console.error('Firebase updateHabit error:', error);
      throw new Error(error.message || 'Failed to update habit');
    }
  }

  static async deleteHabit(habitId: string): Promise<void> {
    try {
      if (!firebaseFirestore) {
        throw new Error('Firebase not initialized');
      }
      
      await deleteDoc(doc(firebaseFirestore, 'habits', habitId));
    } catch (error: any) {
      console.error('Firebase deleteHabit error:', error);
      throw new Error(error.message || 'Failed to delete habit');
    }
  }

  // Mood tracking methods
  static async logMoodEntry(userId: string, moodData: any): Promise<string> {
    try {
      if (!firebaseFirestore) {
        throw new Error('Firebase not initialized');
      }
      
      const entryRef = doc(collection(firebaseFirestore, 'mood_entries'));
      const entry = {
        ...moodData,
        userId,
        id: entryRef.id,
        timestamp: new Date().toISOString()
      };
      
      await setDoc(entryRef, entry);
      return entryRef.id;
    } catch (error: any) {
      console.error('Firebase logMoodEntry error:', error);
      throw new Error(error.message || 'Failed to log mood entry');
    }
  }

  /**
   * Utility function to check and fix user document issues
   */
  static async checkAndFixUserDocument(firebaseUser: FirebaseUser): Promise<User> {
    try {
      if (!firebaseFirestore) {
        throw new Error('Firebase not initialized');
      }

      const userDoc = await getDoc(doc(firebaseFirestore, 'users', firebaseUser.uid));

      if (!userDoc.exists()) {
        console.log('🔧 Creating missing user document for:', firebaseUser.email);
        
        const newUser: User = {
          id: firebaseUser.uid,
          email: firebaseUser.email!,
          name: firebaseUser.displayName || firebaseUser.email!.split('@')[0],
          joinedAt: new Date().toISOString(),
          onboardingCompleted: false,
          preferences: {
            notifications: true,
            emailUpdates: true,
            publicProfile: false,
          },
          stats: {
            totalHabits: 0,
            completedHabits: 0,
            currentStreak: 0,
            longestStreak: 0,
          },
        };
        
        await setDoc(doc(firebaseFirestore, 'users', firebaseUser.uid), newUser);
        console.log('✅ User document created successfully');
        
        return newUser;
      }

      return userDoc.data() as User;
    } catch (error) {
      console.error('Error checking/fixing user document:', error);
      throw error;
    }
  }
}
