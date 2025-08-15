import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { User, ProfileUpdateData } from '@/types';
import { FIREBASE_MODE } from '@/constants/api';
import { PrivacyService, PrivacySettings } from '@/services/PrivacyService';
import { FirebaseService } from '@/services/FirebaseService';
import { useCallback } from 'react';

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
    
    for (const key of allKeys) {
      const value = await AsyncStorage.getItem(key);
      if (value) {
        try {
          JSON.parse(value); // Test if it's valid JSON
        } catch (parseError) {
          console.log(`🗑️ Removing corrupted data from key: ${key}`);
          await AsyncStorage.removeItem(key);
        }
      }
    }
    console.log('✅ Cleanup complete');
  } catch (error) {
    console.error('❌ Error during cleanup:', error);
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

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Debug user state changes
  useEffect(() => {
    console.log('👤 User state changed:', { 
      hasUser: !!user, 
      userEmail: user?.email, 
      userId: user?.id 
    });
  }, [user]);

  // Add development flag for debugging
  const isDevelopment = __DEV__;
  const [privacySettings, setPrivacySettings] = useState<PrivacySettings | null>(null);
  const [preventGuestCreation, setPreventGuestCreation] = useState(false);
  const [isRestoringAuth, setIsRestoringAuth] = useState(false);

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
          setUser(userData);
          return true;
        }
        return false;
      }

      // First try to restore from cached user data (faster for hot reloads)
      const cachedUser = await AsyncStorage.getItem(keys.lastAuthenticatedUser);
      if (cachedUser) {
        try {
          const userData = JSON.parse(cachedUser);
          setUser(userData);
          console.log('✅ User restored from cache during hot reload:', userData.email);
          return true;
        } catch (error) {
          console.log('❌ Cached user data corrupted, trying Firebase...');
        }
      }

      // Check Firebase session
      const firebaseUser = await FirebaseService.getCurrentUser();
      if (firebaseUser) {
        await migrateGuestDataToUser(firebaseUser.id);
        await saveLastAuthenticatedUser(firebaseUser);
        setUser(firebaseUser);
        console.log('✅ User authenticated from Firebase:', firebaseUser.email);
        return true;
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
          setUser(userData);
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
          setUser(guestUser);
          console.log('✅ Guest user created automatically');
        }
      } else {
        // Try to restore from last authenticated user if Firebase user is not available
        const lastUser = await AsyncStorage.getItem(keys.lastAuthenticatedUser);
        if (lastUser) {
          try {
            const userData = JSON.parse(lastUser);
            setUser(userData);
            console.log('✅ User restored from last authenticated session:', userData.email);
          } catch (error) {
            console.log('❌ Last authenticated user data corrupted, clearing...');
            await AsyncStorage.removeItem(keys.lastAuthenticatedUser);
            setUser(null);
          }
        } else {
          // Set user to null to trigger auth flow
          setUser(null);
        }
      }
    } catch (error) {
      console.error('Failed to check auth state:', error);
      // Set user to null on error to trigger auth flow
      setUser(null);
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
    
    const setupAuth = async () => {
      console.log('🚀 Setting up authentication...');
      setPreventGuestCreation(false);
      
      // Remove debug calls that might interfere with auth restoration
      // await debugAsyncStorage();
      
      if (FIREBASE_MODE) {
        const immediateRestored = await checkExistingAuthSession();
        
        // Set up Firebase auth state listener
        unsubscribe = FirebaseService.onAuthStateChanged(async (firebaseUser: User | null) => {
          if (isRestoringAuth) {
            console.log('🔄 Skipping Firebase auth state change during restoration');
            return;
          }
          
          if (firebaseUser) {
            try {
              await migrateGuestDataToUser(firebaseUser.id);
              await saveLastAuthenticatedUser(firebaseUser);
              setUser(firebaseUser);
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
                setUser(null);
              } else {
                console.log('🔄 Restoring cached user during hot reload');
                try {
                  const userData = JSON.parse(cachedUser);
                  setUser(userData);
                } catch (error) {
                  console.log('🚪 Cached user data corrupted, signing out');
                  setUser(null);
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
    };
    
    setupAuth();
    
    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, []);

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
        await migrateGuestDataToUser(firebaseUser.id);
        await saveLastAuthenticatedUser(firebaseUser);
        setUser(firebaseUser);
        console.log('✅ User registered:', firebaseUser.email);
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
    // TODO: Implement Google OAuth with Supabase
    throw new Error('Google login not implemented yet');
  }, []);

  const loginWithApple = useCallback(async () => {
    // TODO: Implement Apple OAuth with Supabase
    throw new Error('Apple login not implemented yet');
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
    // TODO: Implement avatar upload with Supabase Storage
    throw new Error('Avatar upload not implemented yet');
  }, []);

  const deleteAccount = useCallback(async () => {
    if (!user) throw new Error('No user logged in');
    
    try {
      if (!FIREBASE_MODE) {
        await AsyncStorage.removeItem(keys.user);
        setUser(null);
        return;
      }

      // TODO: Implement account deletion with Supabase
      throw new Error('Account deletion not implemented yet');
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
      
      // Update in AsyncStorage
      await AsyncStorage.setItem(keys.user, JSON.stringify(updatedUser));
      await AsyncStorage.setItem(`userData_${user.id}`, JSON.stringify(updatedUser));
      await AsyncStorage.setItem(keys.lastAuthenticatedUser, JSON.stringify(updatedUser));
      
      // Update in development cache
      if (__DEV__) {
        await AsyncStorage.setItem('dev_last_user', JSON.stringify({
          ...updatedUser,
          timestamp: Date.now()
        }));
      }
      
      setUser(updatedUser);
      console.log('✅ Onboarding marked as completed locally');
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

  const restoreAuthWithToken = useCallback(async () => {
    // TODO: Implement token-based auth restoration
    return false;
  }, []);



  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated: !!user,
    isGuestUser: false, // Simplified for now
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