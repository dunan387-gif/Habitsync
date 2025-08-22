import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { User, ProfileUpdateData } from '@/types';
import { FIREBASE_MODE } from '@/constants/api';
import { PrivacyService, PrivacySettings } from '@/services/PrivacyService';
import { FirebaseService } from '@/services/FirebaseService';
import { useCallback } from 'react';
import { AuthService } from '@/services/AuthService'; // Added import for AuthService

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isGuestUser: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  logout: () => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  loginWithApple: () => Promise<void>;
  updateProfile: (data: ProfileUpdateData) => Promise<void>;
  uploadAvatar: (imageUri: string) => Promise<void>;
  deleteAccount: () => Promise<void>;
  clearGuestUser: () => Promise<void>;
  markOnboardingCompleted: () => Promise<void>;
  privacySettings: PrivacySettings | null;
  updatePrivacySetting: (key: keyof PrivacySettings, value: boolean) => Promise<void>;
  canShowProfileData: () => Promise<boolean>;
  canCollectAnalytics: () => Promise<boolean>;
  checkAndRestoreAuth: () => Promise<boolean>;
  forceAuthRestore: () => Promise<boolean>;
  reAuthenticateWithSupabase: () => Promise<boolean>;
  restoreAuthWithToken: () => Promise<boolean>;
  restoreAuthFromToken: (token: string) => Promise<User>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Storage keys
const keys = {
  user: 'user_data',
  guestUser: 'guest_user_data',
  lastAuthenticatedUser: 'last_authenticated_user',
  privacySettings: 'privacy_settings',
  subscription: 'subscription_status',
};

// Function to clean up corrupted AsyncStorage data
const cleanupCorruptedData = async () => {
  try {
    console.log('🧹 Cleaning up corrupted AsyncStorage data...');
    const allKeys = await AsyncStorage.getAllKeys();
    let cleanedCount = 0;
    
    // Only check auth-related keys during registration
    const authKeys = [keys.user, keys.guestUser, keys.lastAuthenticatedUser];
    const keysToCheck = allKeys.filter(key => 
      authKeys.includes(key) || key.includes('userData_') || key.includes('habits_')
    );
    
    for (const key of keysToCheck) {
      const value = await AsyncStorage.getItem(key);
      if (value) {
        try {
          JSON.parse(value);
        } catch (parseError) {
          console.log(`🗑️ Removing corrupted data from key: ${key}`);
          await AsyncStorage.removeItem(key);
          cleanedCount++;
        }
      }
    }
    console.log(`✅ Cleanup complete - removed ${cleanedCount} corrupted entries`);
    return cleanedCount;
  } catch (error) {
    console.error('❌ Error during cleanup:', error);
    return 0;
  }
};

// Debug function to check AsyncStorage contents
const debugAsyncStorage = async () => {
  try {
    console.log('🔍 Debugging AsyncStorage contents...');
    const allKeys = await AsyncStorage.getAllKeys();
    console.log('📋 All AsyncStorage keys:', allKeys);
    
    for (const key of allKeys) {
      const value = await AsyncStorage.getItem(key);
      if (value) {
        try {
          const parsed = JSON.parse(value);
          console.log(`📦 ${key}:`, parsed);
        } catch (parseError) {
          console.log(`📦 ${key}: [INVALID JSON]`, value.substring(0, 100) + '...');
        }
      } else {
        console.log(`📦 ${key}: null`);
      }
    }
  } catch (error) {
    console.error('❌ Error debugging AsyncStorage:', error);
  }
};

// Helper function to clear corrupted auth data
const clearCorruptedAuthData = async () => {
  try {
    const userData = await AsyncStorage.getItem(keys.user);
    if (userData) {
      const parsed = JSON.parse(userData);
      console.log('🔍 Checking user data validity:', { 
        hasId: !!parsed.id, 
        hasEmail: !!parsed.email, 
        id: parsed.id,
        email: parsed.email 
      });
      if (!parsed.id || !parsed.email) {
        console.log('🧹 Clearing corrupted user data');
        await AsyncStorage.removeItem(keys.user);
      } else {
        console.log('✅ User data is valid, keeping it');
      }
    } else {
      console.log('📭 No user data found in storage');
    }
  } catch (error) {
    console.log('🧹 Clearing corrupted user data due to parse error:', error);
    await AsyncStorage.removeItem(keys.user);
  }
};

  // Helper function to migrate guest data to user
  const migrateGuestDataToUser = async (userId: string) => {
    try {
      const guestData = await AsyncStorage.getItem(keys.guestUser);
      if (guestData) {
        // Here you would migrate guest data to the authenticated user
        // This could include habits, preferences, etc.
        console.log('🔄 Migrating guest data to user:', userId);
        await AsyncStorage.removeItem(keys.guestUser);
      }
    } catch (error) {
      console.error('Failed to migrate guest data:', error);
    }
  };

  // Helper function to migrate user data when user ID changes
  const migrateUserData = async (oldUserId: string, newUserId: string) => {
    try {
      console.log('🔄 Migrating user data from', oldUserId, 'to', newUserId);
      
      // Migrate user data
      const oldUserData = await AsyncStorage.getItem(`userData_${oldUserId}`);
      if (oldUserData) {
        await AsyncStorage.setItem(`userData_${newUserId}`, oldUserData);
        await AsyncStorage.removeItem(`userData_${oldUserId}`);
      }
      
      // Migrate habits data
      const oldHabitsData = await AsyncStorage.getItem(`habits_${oldUserId}`);
      if (oldHabitsData) {
        await AsyncStorage.setItem(`habits_${newUserId}`, oldHabitsData);
        await AsyncStorage.removeItem(`habits_${oldUserId}`);
      }
      
      // Migrate mood reminder data
      const oldReminderData = await AsyncStorage.getItem(`lastMoodReminderDate_${oldUserId}`);
      if (oldReminderData) {
        await AsyncStorage.setItem(`lastMoodReminderDate_${newUserId}`, oldReminderData);
        await AsyncStorage.removeItem(`lastMoodReminderDate_${oldUserId}`);
      }
      
      console.log('✅ User data migration completed');
    } catch (error) {
      console.error('❌ Error migrating user data:', error);
    }
  };

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isInitializing, setIsInitializing] = useState(true);
  
  // Debug user state changes
  useEffect(() => {
    console.log('👤 User state changed:', { 
      hasUser: !!user, 
      userEmail: user?.email, 
      userId: user?.id,
      userType: user ? (user.id.startsWith('guest-') ? 'Guest' : 'Authenticated') : 'No user',
      onboardingCompleted: user?.onboardingCompleted,
      timestamp: new Date().toISOString()
    });
  }, [user]);

  // Add development flag for debugging
  const isDevelopment = __DEV__;
  const [privacySettings, setPrivacySettings] = useState<PrivacySettings | null>(null);
  const [preventGuestCreation, setPreventGuestCreation] = useState(false);
  const [isRestoringAuth, setIsRestoringAuth] = useState(false);

  // Utility function to safely update user state
  const safeSetUser = useCallback((newUser: User | null) => {
    if (!user && !newUser) return; // Both null, no change needed
    if (!user && newUser) {
      setUser(newUser);
      return;
    }
    if (user && !newUser) {
      setUser(null);
      return;
    }
    if (user && newUser && user.id !== newUser.id) {
      setUser(newUser);
      return;
    }
    // Users are the same, no update needed
  }, [user]);

  // Helper function to save last authenticated user
  const saveLastAuthenticatedUser = async (user: User) => {
    try {
      await AsyncStorage.setItem(keys.lastAuthenticatedUser, JSON.stringify(user));
      
      // In development, also save to a development-specific key for hot reload persistence
      if (isDevelopment) {
        await AsyncStorage.setItem('dev_last_user', JSON.stringify({
          ...user,
          timestamp: Date.now()
        }));
      }
    } catch (error) {
      console.error('Failed to save last authenticated user:', error);
    }
  };

  // Check existing auth session
  const checkExistingAuthSession = async (): Promise<boolean> => {
    try {
      if (!FIREBASE_MODE) {
        const storedUser = await AsyncStorage.getItem(keys.user);
        if (storedUser) {
          const userData = JSON.parse(storedUser);
          safeSetUser(userData);
          return true;
        }
        return false;
      }

      // First try to restore from cached user data (faster for hot reloads)
      const cachedUser = await AsyncStorage.getItem(keys.lastAuthenticatedUser);
      if (cachedUser) {
        try {
          const userData = JSON.parse(cachedUser);
          safeSetUser(userData);
          console.log('✅ User restored from cache during hot reload:', userData.email);
          return true;
        } catch (error) {
          console.log('❌ Cached user data corrupted, trying Firebase...');
        }
      }

      // Check Firebase session with enhanced persistence check
      console.log('🔍 Checking Firebase auth persistence...');
      const firebaseUser = await FirebaseService.getCurrentUser();
      if (firebaseUser) {
        console.log('✅ Firebase auth persistence working - user found:', firebaseUser.email);
        
        // Check if we have a different user ID for the same email
        const lastUser = await AsyncStorage.getItem(keys.lastAuthenticatedUser);
        if (lastUser) {
          try {
            const lastUserData = JSON.parse(lastUser);
            if (lastUserData.email === firebaseUser.email && lastUserData.id !== firebaseUser.id) {
              console.log('🔄 User ID changed for same email:', {
                oldId: lastUserData.id,
                newId: firebaseUser.id,
                email: firebaseUser.email
              });
              
              // Migrate data from old user ID to new user ID
              await migrateUserData(lastUserData.id, firebaseUser.id);
            }
          } catch (error) {
            console.warn('⚠️ Error checking user ID migration:', error);
          }
        }
        
        await migrateGuestDataToUser(firebaseUser.id);
        await saveLastAuthenticatedUser(firebaseUser);
        safeSetUser(firebaseUser);
        console.log('✅ User authenticated from Firebase with persistence:', firebaseUser.email);
        return true;
      } else {
        console.log('⚠️ Firebase auth persistence issue - no user found, checking AsyncStorage backup...');
        
        // Fallback to AsyncStorage if Firebase auth is not persisting
        const backupUser = await AsyncStorage.getItem(keys.lastAuthenticatedUser);
        if (backupUser) {
          try {
            const userData = JSON.parse(backupUser);
            console.log('🔄 Using AsyncStorage backup for user:', userData.email);
            safeSetUser(userData);
            return true;
          } catch (error) {
            console.error('❌ Backup user data corrupted:', error);
          }
        }
      }
      return false;
    } catch (error) {
      console.error('Failed to check existing auth session:', error);
      return false;
    }
  };

  // Check auth state
  const checkAuthState = async () => {
    try {
      if (!FIREBASE_MODE) {
        console.log('🔍 Checking auth state in OFFLINE_MODE...');
        const storedUser = await AsyncStorage.getItem(keys.user);
        if (storedUser) {
          console.log('✅ Found stored user, restoring...');
          const userData = JSON.parse(storedUser);
          safeSetUser(userData);
          console.log('✅ User restored:', userData.email);
        } else {
          console.log('📭 No stored user found, creating guest user...');
          // Create a guest user automatically in offline mode
          const guestUser: User = {
            id: 'guest-user', // Use a stable ID instead of timestamp
            email: 'guest@example.com',
            name: 'Guest User',
            joinedAt: new Date().toISOString(),
            onboardingCompleted: true, // Skip onboarding for guest
            preferences: {
              notifications: true,
              emailUpdates: false,
              publicProfile: false,
            },
            stats: {
              totalHabits: 0,
              completedHabits: 0,
              currentStreak: 0,
              longestStreak: 0,
            },
                  };
        await AsyncStorage.setItem(keys.user, JSON.stringify(guestUser));
        safeSetUser(guestUser);
        console.log('✅ Guest user created automatically');
        }
      } else {
        // Try to restore from last authenticated user if Firebase user is not available
        const lastUser = await AsyncStorage.getItem(keys.lastAuthenticatedUser);
        if (lastUser) {
                  try {
          const userData = JSON.parse(lastUser);
          safeSetUser(userData);
          console.log('✅ User restored from last authenticated session:', userData.email);
        } catch (error) {
                      console.log('❌ Last authenticated user data corrupted, clearing...');
          await AsyncStorage.removeItem(keys.lastAuthenticatedUser);
          safeSetUser(null);
        }
      } else {
        // Set user to null to trigger auth flow
        safeSetUser(null);
      }
      }
    } catch (error) {
      console.error('Failed to check auth state:', error);
      // Set user to null on error to trigger auth flow
      safeSetUser(null);
    }
  };

  // Load privacy settings
  const loadPrivacySettings = async () => {
    try {
      const settings = await PrivacyService.getPrivacySettings();
      setPrivacySettings(settings);
    } catch (error) {
      console.error('Failed to load privacy settings:', error);
    }
  };

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;
    let isMounted = true;
    
    const setupAuth = async () => {
      console.log('🚀 Setting up authentication...');
      setPreventGuestCreation(false);
      
      // Skip cleanup during registration for better performance
      if (!user) {
        const cleanedCount = await cleanupCorruptedData();
        if (cleanedCount > 0) {
          console.log(`🧹 Cleaned up ${cleanedCount} corrupted entries`);
        }
      }
      
      // Remove debug calls that might interfere with auth restoration
      // await debugAsyncStorage();
      
      if (FIREBASE_MODE) {
        const immediateRestored = await checkExistingAuthSession();
        
        // Set up Firebase auth state listener
        unsubscribe = FirebaseService.onAuthStateChanged(async (firebaseUser: User | null) => {
          if (!isMounted) return; // Prevent state updates on unmounted component
          
          if (isRestoringAuth) {
            console.log('🔄 Skipping Firebase auth state change during restoration');
            return;
          }
          
          if (firebaseUser) {
            try {
              await migrateGuestDataToUser(firebaseUser.id);
              await saveLastAuthenticatedUser(firebaseUser);
              safeSetUser(firebaseUser);
              console.log('✅ Firebase auth state updated:', firebaseUser.email);
            } catch (error) {
              console.error('❌ Error processing Firebase user:', error);
            }
          } else {
            // Only set user to null if we're not in the middle of restoration
            // and if we don't have a cached user
            if (!isRestoringAuth) {
              const cachedUser = await AsyncStorage.getItem(keys.lastAuthenticatedUser);
              if (!cachedUser) {
                console.log('🚪 User signed out');
                safeSetUser(null);
              } else {
                console.log('🔄 Restoring cached user during hot reload');
                try {
                  const userData = JSON.parse(cachedUser);
                  safeSetUser(userData);
                } catch (error) {
                  console.log('🚪 Cached user data corrupted, signing out');
                  safeSetUser(null);
                }
              }
            } else {
              console.log('🔄 Ignoring Firebase sign-out during restoration');
            }
          }
        });
        
        if (!immediateRestored) {
          await checkAuthState();
        }
      } else {
        console.log('🔄 Running in OFFLINE_MODE, checking auth state...');
        await checkAuthState();
      }
      await loadPrivacySettings();
      
      // Ensure loading is set to false after all setup is complete
      console.log('✅ Authentication setup complete');
      setIsLoading(false);
      setIsInitializing(false);
    };
    
    // CRITICAL: Add timeout to prevent infinite loading
    const setupTimeout = setTimeout(() => {
      console.warn('⚠️ Auth setup timeout reached, forcing completion');
      setIsLoading(false);
      setIsInitializing(false);
    }, 15000); // 15 second timeout
    
    setupAuth().finally(() => {
      clearTimeout(setupTimeout);
    });
    
    return () => {
      isMounted = false;
      clearTimeout(setupTimeout);
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [isRestoringAuth]); // REMOVED 'user' from dependencies - this was causing the infinite loop

  const login = useCallback(async (email: string, password: string) => {
    try {
    setIsLoading(true);
      
      if (!FIREBASE_MODE) {
        // Simulate login for offline mode
        const mockUser: User = {
          id: 'offline-user-' + Date.now(),
          email,
          name: email.split('@')[0],
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
        
        await AsyncStorage.setItem(keys.user, JSON.stringify(mockUser));
        setUser(mockUser);
        return;
      }

      const firebaseUser = await FirebaseService.signInWithEmail(email, password);
      if (firebaseUser) {
        await migrateGuestDataToUser(firebaseUser.id);
        await saveLastAuthenticatedUser(firebaseUser);
        setUser(firebaseUser);
        console.log('✅ User logged in:', firebaseUser.email);
      }
    } catch (error: any) {
      console.error('Login failed:', error);
      throw new Error(error.message || 'Login failed');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const register = useCallback(async (email: string, password: string, name: string) => {
    try {
      setIsLoading(true);
      
      if (!FIREBASE_MODE) {
        // Simulate registration for offline mode
        const mockUser: User = {
          id: 'offline-user-' + Date.now(),
          email,
          name,
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
        
        await AsyncStorage.setItem(keys.user, JSON.stringify(mockUser));
        setUser(mockUser);
        return;
      }

      const firebaseUser = await FirebaseService.signUpWithEmail(email, password, name);
      if (firebaseUser) {
        // Only save to essential keys during registration
        await AsyncStorage.setItem(keys.lastAuthenticatedUser, JSON.stringify(firebaseUser));
        setUser(firebaseUser);
        console.log('✅ User registered:', firebaseUser.email);
        
        // Perform additional operations after successful registration
        setTimeout(async () => {
          try {
            await migrateGuestDataToUser(firebaseUser.id);
            await AsyncStorage.setItem(keys.user, JSON.stringify(firebaseUser));
          } catch (error) {
            console.warn('Non-critical operations failed:', error);
          }
        }, 100);
      }
    } catch (error: any) {
      console.error('Registration failed:', error);
      throw new Error(error.message || 'Registration failed');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      setIsLoading(true);
      
      if (!FIREBASE_MODE) {
        await AsyncStorage.removeItem(keys.user);
        setUser(null);
        return;
      }

      await FirebaseService.signOut();
      setUser(null);
      console.log('✅ User logged out');
    } catch (error: any) {
      console.error('Logout failed:', error);
      throw new Error(error.message || 'Logout failed');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const loginWithGoogle = useCallback(async () => {
    try {
      if (!FIREBASE_MODE) {
        // Simulate Google login for offline mode
        const mockUser: User = {
          id: 'google-user-' + Date.now(),
          email: 'user@gmail.com',
          name: 'Google User',
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
        await AsyncStorage.setItem(keys.user, JSON.stringify(mockUser));
        setUser(mockUser);
        return;
      }

      // TODO: Implement Google OAuth with Firebase
      // This requires additional setup with @react-native-google-signin/google-signin
      throw new Error('Google OAuth requires additional setup. Please implement with @react-native-google-signin/google-signin');
    } catch (error: any) {
      console.error('Google login failed:', error);
      throw new Error(error.message || 'Google login failed');
    }
  }, []);

  const loginWithApple = useCallback(async () => {
    try {
      if (!FIREBASE_MODE) {
        // Simulate Apple login for offline mode
        const mockUser: User = {
          id: 'apple-user-' + Date.now(),
          email: 'user@icloud.com',
          name: 'Apple User',
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
        await AsyncStorage.setItem(keys.user, JSON.stringify(mockUser));
        setUser(mockUser);
        return;
      }

      // TODO: Implement Apple OAuth with Firebase
      // This requires additional setup with expo-apple-authentication
      throw new Error('Apple OAuth requires additional setup. Please implement with expo-apple-authentication');
    } catch (error: any) {
      console.error('Apple login failed:', error);
      throw new Error(error.message || 'Apple login failed');
    }
  }, []);

  const updateProfile = useCallback(async (data: ProfileUpdateData) => {
    if (!user) throw new Error('No user logged in');
    
    try {
      if (!FIREBASE_MODE) {
        const updatedUser: User = { 
          ...user, 
          ...data,
          preferences: {
            ...user.preferences,
            ...(data.preferences || {})
          }
        };
        await AsyncStorage.setItem(keys.user, JSON.stringify(updatedUser));
        setUser(updatedUser);
        return;
      }

      await FirebaseService.updateUserProfile(user.id, data);
      const updatedUser: User = { 
        ...user, 
        ...data,
        preferences: {
          ...user.preferences,
          ...(data.preferences || {})
        }
      };
      setUser(updatedUser);
    } catch (error: any) {
      console.error('Profile update failed:', error);
      throw new Error(error.message || 'Profile update failed');
    }
  }, [user]);

  const uploadAvatar = useCallback(async (imageUri: string) => {
    try {
      if (!user) {
        throw new Error('No user logged in');
      }

      if (!FIREBASE_MODE) {
        // Simulate avatar upload for offline mode
        const updatedUser = { ...user, avatar: imageUri };
        await AsyncStorage.setItem(keys.user, JSON.stringify(updatedUser));
        setUser(updatedUser);
        return;
      }

      // TODO: Implement avatar upload with Firebase Storage
      // This requires additional setup with Firebase Storage
      throw new Error('Avatar upload requires Firebase Storage setup. Please implement with Firebase Storage');
    } catch (error: any) {
      console.error('Avatar upload failed:', error);
      throw new Error(error.message || 'Avatar upload failed');
    }
  }, [user]);

  const deleteAccount = useCallback(async () => {
    if (!user) throw new Error('No user logged in');
    
    try {
      if (!FIREBASE_MODE) {
        await AsyncStorage.removeItem(keys.user);
        setUser(null);
        return;
      }

      // Use the AuthService for account deletion
      await AuthService.deleteAccount(''); // Password will be prompted in UI
      setUser(null);
    } catch (error: any) {
      console.error('Account deletion failed:', error);
      throw new Error(error.message || 'Account deletion failed');
    }
  }, [user]);

  const clearGuestUser = useCallback(async () => {
    try {
      await AsyncStorage.removeItem(keys.guestUser);
      setPreventGuestCreation(false);
    } catch (error) {
      console.error('Failed to clear guest user:', error);
    }
  }, []);

  const markOnboardingCompleted = useCallback(async () => {
    if (!user) throw new Error('No user logged in');
    
    try {
      console.log('🔄 Marking onboarding completed for user:', user.email, 'ID:', user.id);
      
      if (!FIREBASE_MODE) {
        const updatedUser = { ...user, onboardingCompleted: true };
        await AsyncStorage.setItem(keys.user, JSON.stringify(updatedUser));
        setUser(updatedUser);
        return;
      }

      // Try to update Firebase, but don't fail if it doesn't work
      try {
        await FirebaseService.updateUserProfile(user.id, { onboardingCompleted: true });
        console.log('✅ Onboarding status updated in Firebase');
      } catch (firebaseError: any) {
        console.warn('⚠️ Firebase update failed, but continuing with local update:', firebaseError.message);
        // Continue with local update even if Firebase fails
      }

      // Always update locally regardless of Firebase success
      const updatedUser = { ...user, onboardingCompleted: true };
      
      // Update in AsyncStorage with multiple keys for redundancy
      await AsyncStorage.setItem(keys.user, JSON.stringify(updatedUser));
      await AsyncStorage.setItem(`userData_${user.id}`, JSON.stringify(updatedUser));
      await AsyncStorage.setItem(keys.lastAuthenticatedUser, JSON.stringify(updatedUser));
      
      // Also save with email-based key for user ID changes
      if (user.email) {
        await AsyncStorage.setItem(`userData_email_${user.email}`, JSON.stringify(updatedUser));
      }
      
      // Update in development cache
      if (__DEV__) {
        await AsyncStorage.setItem('dev_last_user', JSON.stringify({
          ...updatedUser,
          timestamp: Date.now()
        }));
      }
      
      // Add a small delay to ensure state updates are processed
      await new Promise(resolve => setTimeout(resolve, 100));
      
      setUser(updatedUser);
      console.log('✅ Onboarding marked as completed locally');
      
      // Force a re-render to ensure the UI updates
      setTimeout(() => {
        console.log('🔄 Forcing re-render after onboarding completion');
      }, 200);
      
    } catch (error: any) {
      console.error('Failed to mark onboarding completed:', error);
      throw new Error(error.message || 'Failed to mark onboarding completed');
    }
  }, [user]);

  const updatePrivacySetting = useCallback(async (key: keyof PrivacySettings, value: boolean) => {
    try {
      await PrivacyService.updatePrivacySetting(key, value);
      const updatedSettings = await PrivacyService.getPrivacySettings();
      setPrivacySettings(updatedSettings);
    } catch (error: any) {
      console.error('Failed to update privacy setting:', error);
      throw new Error(error.message || 'Failed to update privacy setting');
    }
  }, []);

  const canShowProfileData = useCallback(async () => {
    return await PrivacyService.shouldShowProfileData();
  }, []);
  
  const canCollectAnalytics = useCallback(async () => {
    return await PrivacyService.canCollectAnalytics();
  }, []);

  const checkAndRestoreAuth = useCallback(async () => {
    try {
      setIsRestoringAuth(true);
      
      // In development, try to restore from cache first for faster hot reloads
      if (isDevelopment) {
        const cachedUser = await AsyncStorage.getItem(keys.lastAuthenticatedUser);
        if (cachedUser) {
          try {
            const userData = JSON.parse(cachedUser);
            setUser(userData);
            console.log('✅ User restored from cache (dev mode):', userData.email);
            return true;
          } catch (error) {
            console.log('❌ Cached user data corrupted, trying Firebase...');
          }
        }
      }
      
      const restored = await checkExistingAuthSession();
      return restored;
    } finally {
      setIsRestoringAuth(false);
    }
  }, [isDevelopment]);

  const forceAuthRestore = useCallback(async () => {
    try {
      setIsRestoringAuth(true);
      const restored = await checkExistingAuthSession();
      if (!restored) {
        await checkAuthState();
      }
      return restored;
        } finally {
          setIsRestoringAuth(false);
        }
  }, []);

  const reAuthenticateWithSupabase = useCallback(async () => {
    try {
      setIsRestoringAuth(true);
      const restored = await checkExistingAuthSession();
      return restored;
    } finally {
      setIsRestoringAuth(false);
    }
  }, []);

  // Token-based auth restoration
  const restoreAuthFromToken = useCallback(async (token: string) => {
    try {
      if (!FIREBASE_MODE) {
        // For offline mode, try to restore from stored token
        const storedToken = await SecureStore.getItemAsync('auth_token');
        if (storedToken === token) {
          const userData = await AsyncStorage.getItem(keys.user);
          if (userData) {
            const user = JSON.parse(userData);
            setUser(user);
            return user;
          }
        }
        throw new Error('Invalid or expired token');
      }

      // TODO: Implement token-based auth restoration with Firebase
      // This would typically involve verifying the token with Firebase Auth
      throw new Error('Token-based auth restoration requires Firebase Auth setup');
    } catch (error: any) {
      console.error('Token-based auth restoration failed:', error);
      throw new Error(error.message || 'Auth restoration failed');
    }
  }, []);

  const restoreAuthWithToken = useCallback(async () => {
    // TODO: Implement token-based auth restoration
    return false;
  }, []);



  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated: !!user,
    isGuestUser: user?.id?.startsWith('guest-') || user?.id === 'guest-user' || false,
    login,
    register,
    logout,
    loginWithGoogle,
    loginWithApple,
    updateProfile,
    uploadAvatar,
    deleteAccount,
    clearGuestUser,
    markOnboardingCompleted,
    privacySettings,
    updatePrivacySetting,
    canShowProfileData,
    canCollectAnalytics,
    checkAndRestoreAuth,
    forceAuthRestore,
    reAuthenticateWithSupabase,
    restoreAuthWithToken,
    restoreAuthFromToken,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}