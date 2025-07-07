import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { User, ProfileUpdateData } from '@/types';
import { getApiUrl, API_CONFIG } from '@/constants/api';

// Remove this duplicate interface definition:
// interface User {
//   id: string;
//   email: string;
//   name: string;
//   avatar?: string;
// }

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
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkAuthState();
  }, []);

  const checkAuthState = async () => {
    try {
      const token = await SecureStore.getItemAsync('authToken');
      if (token) {
        const userData = await AsyncStorage.getItem('userData');
        if (userData) {
          setUser(JSON.parse(userData));
        }
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
      const response = await fetch(getApiUrl(API_CONFIG.ENDPOINTS.LOGIN), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });
  
      const data = await response.json();
      
      if (response.ok) {
        await SecureStore.setItemAsync('authToken', data.token);
        await AsyncStorage.setItem('userData', JSON.stringify(data.user));
        setUser(data.user);
      } else {
        throw new Error(data.message || 'Login failed');
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
      const response = await fetch(getApiUrl(API_CONFIG.ENDPOINTS.REGISTER), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password, name }),
      });
  
      const data = await response.json();
      
      if (response.ok) {
        await SecureStore.setItemAsync('authToken', data.token);
        await AsyncStorage.setItem('userData', JSON.stringify(data.user));
        setUser(data.user);
      } else {
        throw new Error(data.message || 'Registration failed');
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
    }
  };

  const loginWithGoogle = async () => {
    // Implement Google Sign-In
    // This requires additional setup with Google Console
  };

  const loginWithApple = async () => {
    // Implement Apple Sign-In
    // This requires additional setup with Apple Developer
  };

  const updateProfile = async (data: ProfileUpdateData) => {
    if (!user) throw new Error('No user logged in');
    
    setIsLoading(true);
    try {
      // In a real app, this would be an API call
      const updatedUser: User = {
        ...user,
        ...data,
        // Ensure preferences are properly merged with existing values
        preferences: {
          ...user.preferences,
          ...data.preferences,
        },
      };
      
      // Update local storage
      await AsyncStorage.setItem('userData', JSON.stringify(updatedUser));
      setUser(updatedUser);
      
      // TODO: Send to backend API
      // await api.updateProfile(user.id, data);
    } catch (error) {
      console.error('Profile update failed:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const uploadAvatar = async (imageUri: string) => {
    if (!user) throw new Error('No user logged in');
    
    setIsLoading(true);
    try {
      // In a real app, upload to cloud storage and get URL
      const avatarUrl = imageUri; // For now, use local URI
      
      await updateProfile({ avatar: avatarUrl });
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
      // TODO: Call backend API to delete account
      // await api.deleteAccount(user.id);
      
      // Clear local data
      await SecureStore.deleteItemAsync('authToken');
      await AsyncStorage.multiRemove(['userData', 'habitData']);
      setUser(null);
    } catch (error) {
      console.error('Account deletion failed:', error);
      throw error;
    }
  };

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