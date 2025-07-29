import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { User, ProfileUpdateData } from '@/types';
import { OFFLINE_MODE } from '@/constants/api';
import { PrivacyService, PrivacySettings } from '@/services/PrivacyService';
import { useCallback } from 'react';



interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
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

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [privacySettings, setPrivacySettings] = useState<PrivacySettings | null>(null);

  useEffect(() => {
    checkAuthState();
    loadPrivacySettings();
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
      const userData = await AsyncStorage.getItem('userData');
      if (userData) {
        setUser(JSON.parse(userData));
      }
    } catch (error) {
      console.error('Auth check failed:', error);
    } finally {
      setIsLoading(false);
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
        // Original API login code (for future backend integration)
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
        // Original API register code
      }
    } catch (error) {
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      await SecureStore.deleteItemAsync('authToken');
      await AsyncStorage.removeItem('userData');
      setUser(null);
    } catch (error) {
      console.error('Logout failed:', error);
      throw error;
    }
  };

  const loginWithGoogle = async () => {
    // TODO: Implement Google login
    throw new Error('Google login not implemented yet');
  };

  const loginWithApple = async () => {
    // TODO: Implement Apple login
    throw new Error('Apple login not implemented yet');
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
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};