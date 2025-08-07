import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { User, ProfileUpdateData } from '@/types';
import { OFFLINE_MODE } from '@/constants/api';
import { PrivacyService, PrivacySettings } from '@/services/PrivacyService';
import { useCallback } from 'react';
import { auth, db } from '@/lib/firebase';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User as FirebaseUser
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';



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
  privacySettings: PrivacySettings | null;
  updatePrivacySetting: (key: keyof PrivacySettings, value: boolean) => Promise<void>;
  canShowProfileData: () => Promise<boolean>;
  canCollectAnalytics: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Helper function to convert Firebase user to app user
const convertFirebaseUserToAppUser = async (firebaseUser: FirebaseUser): Promise<User> => {
  // Get user profile from Firestore
  const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
  const userData = userDoc.data();
  
  return {
    id: firebaseUser.uid,
    email: firebaseUser.email || '',
    name: userData?.name || firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'User',
    avatar: userData?.avatar || firebaseUser.photoURL || undefined,
    joinedAt: firebaseUser.metadata.creationTime || new Date().toISOString(),
    preferences: userData?.preferences || {
      notifications: true,
      emailUpdates: true,
      publicProfile: false,
    },
    stats: userData?.stats || {
      totalHabits: 0,
      completedHabits: 0,
      currentStreak: 0,
      longestStreak: 0,
    },
  };
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [privacySettings, setPrivacySettings] = useState<PrivacySettings | null>(null);

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;
    
    const setupAuth = async () => {
      if (!OFFLINE_MODE) {
        unsubscribe = await checkAuthState();
      } else {
        await checkAuthState();
      }
      await loadPrivacySettings();
    };
    
    setupAuth();
    
    // Cleanup function
    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, []);

  const loadPrivacySettings = async () => {
    try {
      const settings = await PrivacyService.getPrivacySettings();
      setPrivacySettings(settings);
    } catch (error) {
      console.error('Failed to load privacy settings:', error);
    }
  };

  const checkAuthState = async () => {
    try {
      if (OFFLINE_MODE) {
        const userData = await AsyncStorage.getItem('userData');
        if (userData) {
          setUser(JSON.parse(userData));
        }
        setIsLoading(false);
      } else {
        // First, check if we have a current Firebase user (for immediate restoration)
        const currentUser = auth.currentUser;
        console.log('🔥 Current Firebase user on app start:', currentUser ? 'User found' : 'No user');
        
        if (currentUser) {
          try {
            console.log('🔄 Converting current Firebase user to app user...');
            const user = await convertFirebaseUserToAppUser(currentUser);
            await migrateGuestDataToUser(user.id);
            await saveLastAuthenticatedUser(user);
            setUser(user);
            console.log('✅ Current Firebase user converted successfully:', user.id);
            setIsLoading(false);
          } catch (error) {
            console.error('❌ Error converting current Firebase user:', error);
            // Fall through to guest user creation
          }
        } else {
          // No current Firebase user, try to restore last authenticated user
          console.log('🔄 No current Firebase user, checking for last authenticated user...');
          const lastUser = await restoreLastAuthenticatedUser();
          if (lastUser) {
            console.log('✅ Restored last authenticated user:', lastUser.id);
            setUser(lastUser);
            setIsLoading(false);
          }
        }

        // Set up Firebase auth state listener for future changes
        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
          console.log('🔥 Firebase auth state changed:', firebaseUser ? 'User logged in' : 'No user');
          
          // Skip if we already have a user set from currentUser check
          if (user && !user.id.startsWith('guest-')) {
            console.log('ℹ️ User already set, skipping auth state change');
            return;
          }
          
          if (firebaseUser) {
            try {
              console.log('🔄 Converting Firebase user to app user...');
              const user = await convertFirebaseUserToAppUser(firebaseUser);
              await migrateGuestDataToUser(user.id);
              setUser(user);
              console.log('✅ Firebase user converted successfully:', user.id);
            } catch (error) {
              console.error('❌ Error converting Firebase user:', error);
              // If Firebase user conversion fails, create a guest user
              console.log('🔄 Falling back to guest user...');
              await createGuestUser();
            }
          } else {
            // No Firebase user, check if we have a guest user
            console.log('🔄 No Firebase user, checking for guest user...');
            await createGuestUser();
          }
          setIsLoading(false);
        });
        
        // Store the unsubscribe function for cleanup
        return unsubscribe;
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      // If auth check fails, create a guest user
      await createGuestUser();
      setIsLoading(false);
    }
  };

  const createGuestUser = async () => {
    try {
      console.log('🔍 Checking for existing guest user...');
      // Check if we already have a guest user
      const existingGuestUser = await AsyncStorage.getItem('guestUserData');
      if (existingGuestUser) {
        const guestUser = JSON.parse(existingGuestUser);
        console.log('✅ Found existing guest user:', guestUser.id);
        setUser(guestUser);
        return;
      }

      console.log('🆕 Creating new guest user...');
      // Create a new guest user
      const guestUser: User = {
        id: 'guest-' + Date.now(),
        email: 'guest@example.com',
        name: 'Guest User',
        avatar: undefined,
        joinedAt: new Date().toISOString(),
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

      // Save guest user data
      await AsyncStorage.setItem('guestUserData', JSON.stringify(guestUser));
      setUser(guestUser);
      console.log('✅ Created and saved guest user:', guestUser.id);
    } catch (error) {
      console.error('❌ Error creating guest user:', error);
      setUser(null);
    }
  };

  const migrateGuestDataToUser = async (newUserId: string) => {
    try {
      console.log('🔄 Attempting to migrate guest data to user:', newUserId);
      
      // Get guest user data
      const guestUserData = await AsyncStorage.getItem('guestUserData');
      if (!guestUserData) {
        console.log('ℹ️ No guest user data to migrate');
        return;
      }

      const guestUser = JSON.parse(guestUserData);
      console.log('📦 Found guest user data:', guestUser.id);

      // Get guest habits data
      const guestHabitsKey = `habits_${guestUser.id}`;
      const guestHabits = await AsyncStorage.getItem(guestHabitsKey);
      
      // Get guest gamification data
      const guestGamificationKey = `gamification_${guestUser.id}`;
      const guestGamification = await AsyncStorage.getItem(guestGamificationKey);

      // Migrate habits data
      if (guestHabits) {
        const newHabitsKey = `habits_${newUserId}`;
        await AsyncStorage.setItem(newHabitsKey, guestHabits);
        console.log('✅ Migrated habits data');
      }

      // Migrate gamification data
      if (guestGamification) {
        const newGamificationKey = `gamification_${newUserId}`;
        await AsyncStorage.setItem(newGamificationKey, guestGamification);
        console.log('✅ Migrated gamification data');
      }

      // Clear guest user data after migration
      await AsyncStorage.multiRemove([
        'guestUserData',
        guestHabitsKey,
        guestGamificationKey
      ]);
      
      console.log('✅ Guest data migration completed');
    } catch (error) {
      console.error('❌ Error migrating guest data:', error);
    }
  };

  const saveLastAuthenticatedUser = async (user: User) => {
    try {
      if (!user.id.startsWith('guest-')) {
        await AsyncStorage.setItem('lastAuthenticatedUser', JSON.stringify(user));
        console.log('💾 Saved last authenticated user:', user.id);
      }
    } catch (error) {
      console.error('❌ Error saving last authenticated user:', error);
    }
  };

  const restoreLastAuthenticatedUser = async (): Promise<User | null> => {
    try {
      const lastUserData = await AsyncStorage.getItem('lastAuthenticatedUser');
      if (lastUserData) {
        const lastUser = JSON.parse(lastUserData);
        console.log('🔄 Restoring last authenticated user:', lastUser.id);
        return lastUser;
      }
      return null;
    } catch (error) {
      console.error('❌ Error restoring last authenticated user:', error);
      return null;
    }
  };

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      if (OFFLINE_MODE) {
        const existingAccounts = await AsyncStorage.getItem('registeredAccounts');
        const accounts = existingAccounts ? JSON.parse(existingAccounts) : [];
        
        const existingUser = accounts.find((acc: any) => 
          acc.email === email && acc.password === password
        );
        
        if (!existingUser) {
          throw new Error('Invalid email or password');
        }
        
        const userData = await AsyncStorage.getItem(`userData_${existingUser.id}`);
        if (userData) {
          const user = JSON.parse(userData);
          await AsyncStorage.setItem('userData', userData);
          await SecureStore.setItemAsync('authToken', 'offline-token-' + Date.now());
          setUser(user);
        } else {
          throw new Error('User data not found');
        }
      } else {
        // Use Firebase authentication
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const user = await convertFirebaseUserToAppUser(userCredential.user);
        
        // Migrate guest data to real user account
        await migrateGuestDataToUser(user.id);
        
        // Save the authenticated user for future restoration
        await saveLastAuthenticatedUser(user);
        
        setUser(user);
        console.log('✅ User logged in successfully:', user.id);
      }
    } catch (error) {
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (email: string, password: string, name: string) => {
    setIsLoading(true);
    try {
      if (OFFLINE_MODE) {
        const existingAccounts = await AsyncStorage.getItem('registeredAccounts');
        const accounts = existingAccounts ? JSON.parse(existingAccounts) : [];
        
        if (accounts.find((acc: any) => acc.email === email)) {
          throw new Error('Email already registered');
        }
        
        const newUser: User = {
          id: Date.now().toString(),
          email,
          name,
          avatar: undefined,
          joinedAt: new Date().toISOString(), // Remove createdAt, use joinedAt instead
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
        
        accounts.push({ id: newUser.id, email, password });
        await AsyncStorage.setItem('registeredAccounts', JSON.stringify(accounts));
        await AsyncStorage.setItem(`userData_${newUser.id}`, JSON.stringify(newUser));
        await AsyncStorage.setItem('userData', JSON.stringify(newUser));
        await SecureStore.setItemAsync('authToken', 'offline-token-' + Date.now());
        setUser(newUser);
      } else {
        // Use Firebase authentication
        console.log('Attempting Firebase signup with:', { email, name });
        
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const firebaseUser = userCredential.user;
        
        console.log('Firebase signup successful:', firebaseUser.uid);
        
        // Create user profile in Firestore
        await setDoc(doc(db, 'users', firebaseUser.uid), {
          name: name,
          email: email,
          avatar: null,
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
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
        
        const user = await convertFirebaseUserToAppUser(firebaseUser);
        
        // Migrate guest data to real user account
        await migrateGuestDataToUser(user.id);
        
        // Save the authenticated user for future restoration
        await saveLastAuthenticatedUser(user);
        
        setUser(user);
        console.log('✅ User registered successfully:', user.id);
      }
    } catch (error) {
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      if (OFFLINE_MODE) {
        await SecureStore.deleteItemAsync('authToken');
        await AsyncStorage.removeItem('userData');
        setUser(null);
      } else {
        // Check if current user is a guest user
        if (user && user.id.startsWith('guest-')) {
          // For guest users, just clear the guest data and create a new guest
          await AsyncStorage.removeItem('guestUserData');
          await createGuestUser();
        } else {
          // Use Firebase logout for authenticated users
          await firebaseSignOut(auth);
          // Clear last authenticated user data
          await AsyncStorage.removeItem('lastAuthenticatedUser');
          setUser(null);
        }
      }
    } catch (error) {
      console.error('Logout failed:', error);
      throw error;
    }
  };

  const loginWithGoogle = async () => {
    try {
      if (OFFLINE_MODE) {
        // Simulate Google login for offline mode
        const mockUser: User = {
          id: 'google-user-' + Date.now(),
          email: 'user@gmail.com',
          name: 'Google User',
          avatar: 'https://via.placeholder.com/150',
          joinedAt: new Date().toISOString(),
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
        
        await AsyncStorage.setItem('userData', JSON.stringify(mockUser));
        await SecureStore.setItemAsync('authToken', 'google-token-' + Date.now());
        setUser(mockUser);
        return;
      }

      // Use Firebase Google authentication
      const { GoogleSignin } = require('@react-native-google-signin/google-signin');
      
      // Configure Google Sign-In
      GoogleSignin.configure({
        webClientId: 'YOUR_WEB_CLIENT_ID', // Replace with your actual web client ID
      });

      // Check if user is already signed in
      await GoogleSignin.hasPlayServices();
      const userInfo = await GoogleSignin.signIn();
      
      // Convert to app user format
      const appUser: User = {
        id: userInfo.user.id,
        email: userInfo.user.email,
        name: userInfo.user.name || userInfo.user.email?.split('@')[0] || 'User',
        avatar: userInfo.user.photo,
        joinedAt: new Date().toISOString(),
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

      // Migrate guest data to real user account
      await migrateGuestDataToUser(appUser.id);
      
      // Save user data
      await AsyncStorage.setItem('userData', JSON.stringify(appUser));
      await SecureStore.setItemAsync('authToken', userInfo.idToken);
      setUser(appUser);
      console.log('✅ Google user logged in successfully:', appUser.id);
    } catch (error: any) {
      console.error('Google login failed:', error);
      throw new Error('Google login failed: ' + error.message);
    }
  };

  const loginWithApple = async () => {
    try {
      if (OFFLINE_MODE) {
        // Simulate Apple login for offline mode
        const mockUser: User = {
          id: 'apple-user-' + Date.now(),
          email: 'user@icloud.com',
          name: 'Apple User',
          avatar: undefined,
          joinedAt: new Date().toISOString(),
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
        
        await AsyncStorage.setItem('userData', JSON.stringify(mockUser));
        await SecureStore.setItemAsync('authToken', 'apple-token-' + Date.now());
        setUser(mockUser);
        return;
      }

      // Use Expo Apple authentication
      const { AppleAuthentication } = require('expo-apple-authentication');
      
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });

      // Convert to app user format
      const appUser: User = {
        id: credential.user,
        email: credential.email || 'apple-user@icloud.com',
        name: credential.fullName?.givenName + ' ' + credential.fullName?.familyName || 'Apple User',
        avatar: undefined,
        joinedAt: new Date().toISOString(),
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

      // Migrate guest data to real user account
      await migrateGuestDataToUser(appUser.id);
      
      // Save user data
      await AsyncStorage.setItem('userData', JSON.stringify(appUser));
      await SecureStore.setItemAsync('authToken', credential.identityToken);
      setUser(appUser);
      console.log('✅ Apple user logged in successfully:', appUser.id);
    } catch (error: any) {
      console.error('Apple login failed:', error);
      throw new Error('Apple login failed: ' + error.message);
    }
  };

  const updateProfile = async (data: ProfileUpdateData) => {
    if (!user) throw new Error('No user logged in');
    
    try {
      const updatedUser = { 
        ...user, 
        ...data,
        preferences: {
          ...user.preferences,
          ...data.preferences
        }
      };
      await AsyncStorage.setItem('userData', JSON.stringify(updatedUser));
      await AsyncStorage.setItem(`userData_${user.id}`, JSON.stringify(updatedUser));
      setUser(updatedUser);
    } catch (error) {
      console.error('Profile update failed:', error);
      throw error;
    }
  };

  const uploadAvatar = async (imageUri: string) => {
    setIsLoading(true);
    try {
      const avatarUrl = imageUri;
      await updateProfile({ 
        avatar: avatarUrl,
        preferences: {}
      });
    } catch (error) {
      console.error('Avatar upload failed:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const deleteAccount = async () => {
    if (!user) throw new Error('No user logged in');
    
    try {
      await SecureStore.deleteItemAsync('authToken');
      await AsyncStorage.multiRemove(['userData', 'habitData']);
      setUser(null);
    } catch (error) {
      console.error('Account deletion failed:', error);
      throw error;
    }
  };

  const updatePrivacySetting = async (key: keyof PrivacySettings, value: boolean) => {
    try {
      await PrivacyService.updatePrivacySetting(key, value);
      const updatedSettings = await PrivacyService.getPrivacySettings();
      setPrivacySettings(updatedSettings);
    } catch (error) {
      console.error('Failed to update privacy setting:', error);
      throw error;
    }
  };

  // Fix line 219 - use correct method name
  const canShowProfileData = useCallback(async (): Promise<boolean> => {
    return await PrivacyService.shouldShowProfileData(); // Changed from canShowProfileData
  }, []);
  
  const canCollectAnalytics = useCallback(async (): Promise<boolean> => {
    return await PrivacyService.canCollectAnalytics();
  }, []);

  const value = {
    user,
    isLoading,
    isAuthenticated: !!user,
    isGuestUser: user ? user.id.startsWith('guest-') : false,
    login,
    register,
    logout,
    loginWithGoogle,
    loginWithApple,
    updateProfile,
    uploadAvatar,
    deleteAccount,
    privacySettings,
    updatePrivacySetting,
    canShowProfileData,
    canCollectAnalytics,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    // Return a default context instead of throwing an error
    return {
      user: null,
      isLoading: true,
      isAuthenticated: false,
      isGuestUser: false,
      login: async () => { throw new Error('Auth not initialized'); },
      register: async () => { throw new Error('Auth not initialized'); },
      logout: async () => { throw new Error('Auth not initialized'); },
      loginWithGoogle: async () => { throw new Error('Auth not initialized'); },
      loginWithApple: async () => { throw new Error('Auth not initialized'); },
      updateProfile: async () => { throw new Error('Auth not initialized'); },
      uploadAvatar: async () => { throw new Error('Auth not initialized'); },
      deleteAccount: async () => { throw new Error('Auth not initialized'); },
      privacySettings: null,
      updatePrivacySetting: async () => { throw new Error('Auth not initialized'); },
      canShowProfileData: async () => false,
      canCollectAnalytics: async () => false,
    };
  }
  return context;
};