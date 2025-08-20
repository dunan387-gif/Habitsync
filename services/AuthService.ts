import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { FIREBASE_MODE } from '@/constants/api';
import { FirebaseService } from './FirebaseService';
import { 
  updatePassword, 
  reauthenticateWithCredential, 
  EmailAuthProvider,
  linkWithCredential,
  unlink,
  OAuthProvider,
  GoogleAuthProvider,
  signInWithCredential,
  User as FirebaseUser,
  deleteUser
} from 'firebase/auth';
import { 
  doc, 
  getDoc, 
  updateDoc, 
  deleteDoc,
  collection,
  getDocs,
  query,
  where,
  writeBatch
} from 'firebase/firestore';
import { firebaseAuth, firebaseFirestore } from '@/lib/firebase';

export interface LinkedAccount {
  id: string;
  provider: string;
  email?: string;
  isConnected: boolean;
  connectedAt?: string;
}

export interface PrivacySettings {
  profileVisibility: 'public' | 'private' | 'friends';
  dataSharing: boolean;
  analyticsOptIn: boolean;
  emailNotifications: boolean;
  pushNotifications: boolean;
  locationSharing: boolean;
}

export class AuthService {
  /**
   * Change user password
   */
  static async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    if (FIREBASE_MODE) {
      try {
        if (!firebaseAuth) {
          throw new Error('Firebase not initialized');
        }

        const currentUser = firebaseAuth.currentUser;
        if (!currentUser || !currentUser.email) {
          throw new Error('No authenticated user found');
        }

        // Re-authenticate user before password change
        const credential = EmailAuthProvider.credential(currentUser.email, currentPassword);
        await reauthenticateWithCredential(currentUser, credential);

        // Update password
        await updatePassword(currentUser, newPassword);

        console.log('✅ Password changed successfully');
      } catch (error: any) {
        console.error('Password change error:', error);
        throw new Error(error.message || 'Password change failed');
      }
    } else {
      // Simulate password change for offline mode
      await new Promise(resolve => setTimeout(resolve, 1000));
      return;
    }
  }

  /**
   * Get linked accounts for the current user
   */
  static async getLinkedAccounts(): Promise<LinkedAccount[]> {
    try {
      if (!FIREBASE_MODE) {
        return [];
      }

      const user = await FirebaseService.getCurrentUser();
      if (!user) {
        return [];
      }

      const currentUser = firebaseAuth?.currentUser;
      if (!currentUser) {
        return [];
      }

      const linkedAccounts: LinkedAccount[] = [];

      // Check for email/password provider
      if (currentUser.providerData.some((provider: any) => provider.providerId === 'password')) {
        linkedAccounts.push({
          id: 'email',
          provider: 'email',
          email: currentUser.email || undefined,
          isConnected: true,
          connectedAt: new Date().toISOString(),
        });
      }

      // Check for Google provider
      if (currentUser.providerData.some((provider: any) => provider.providerId === 'google.com')) {
        const googleProvider = currentUser.providerData.find((provider: any) => provider.providerId === 'google.com');
        linkedAccounts.push({
          id: 'google',
          provider: 'google',
          email: googleProvider?.email,
          isConnected: true,
          connectedAt: new Date().toISOString(),
        });
      }

      // Check for Apple provider
      if (currentUser.providerData.some((provider: any) => provider.providerId === 'apple.com')) {
        const appleProvider = currentUser.providerData.find((provider: any) => provider.providerId === 'apple.com');
        linkedAccounts.push({
          id: 'apple',
          provider: 'apple',
          email: appleProvider?.email,
          isConnected: true,
          connectedAt: new Date().toISOString(),
        });
      }

      return linkedAccounts;
    } catch (error) {
      console.error('Error getting linked accounts:', error);
      return [];
    }
  }

  static async toggleLinkedAccount(accountId: string, action: 'link' | 'unlink'): Promise<void> {
    if (FIREBASE_MODE) {
      try {
        const currentUser = firebaseAuth?.currentUser;
        if (!currentUser) {
          throw new Error('No authenticated user found');
        }

        if (action === 'unlink') {
          await this.unlinkAccount(accountId);
        } else {
          await this.linkAccount(accountId);
        }
      } catch (error: any) {
        console.error('Toggle linked account error:', error);
        throw new Error(error.message || 'Failed to toggle linked account');
      }
    } else {
      // Simulate for offline mode
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  /**
   * Link a new account
   */
  static async linkAccount(provider: string): Promise<void> {
    if (FIREBASE_MODE) {
      try {
        const currentUser = firebaseAuth?.currentUser;
        if (!currentUser) {
          throw new Error('No authenticated user found');
        }

        // This would typically involve OAuth flow
        // For now, we'll throw an error indicating it needs OAuth implementation
        throw new Error(`Account linking for ${provider} requires OAuth implementation`);
      } catch (error: any) {
        console.error('Account linking error:', error);
        throw new Error(error.message || 'Account linking failed');
      }
    } else {
      // Simulate account linking for offline mode
      await new Promise(resolve => setTimeout(resolve, 2000));
      return;
    }
  }

  /**
   * Unlink an account
   */
  static async unlinkAccount(accountId: string): Promise<void> {
    if (FIREBASE_MODE) {
      try {
        const currentUser = firebaseAuth?.currentUser;
        if (!currentUser) {
          throw new Error('No authenticated user found');
        }

        // Map account ID to provider ID
        const providerMap: { [key: string]: string } = {
          'google': 'google.com',
          'apple': 'apple.com',
          'email': 'password'
        };

        const providerId = providerMap[accountId];
        if (!providerId) {
          throw new Error('Invalid account ID');
        }

        // Check if user has multiple providers before unlinking
        if (currentUser.providerData.length <= 1) {
          throw new Error('Cannot unlink the only authentication method');
        }

        await unlink(currentUser, providerId);
        console.log(`✅ Successfully unlinked ${accountId} account`);
      } catch (error: any) {
        console.error('Account unlinking error:', error);
        throw new Error(error.message || 'Account unlinking failed');
      }
    } else {
      // Simulate account unlinking for offline mode
      await new Promise(resolve => setTimeout(resolve, 1000));
      return;
    }
  }

  /**
   * Get user's privacy settings
   */
  static async getPrivacySettings(): Promise<PrivacySettings | null> {
    try {
      if (!FIREBASE_MODE) {
        return {
          profileVisibility: 'public',
          dataSharing: false,
          analyticsOptIn: true,
          emailNotifications: true,
          pushNotifications: true,
          locationSharing: false,
        };
      }

      const user = await FirebaseService.getCurrentUser();
      if (!user) {
        return null;
      }

      const userDoc = await getDoc(doc(firebaseFirestore!, 'users', user.id));
      if (!userDoc.exists()) {
        return null;
      }

      const userData = userDoc.data();
      return userData.privacySettings || {
        profileVisibility: 'public',
        dataSharing: false,
        analyticsOptIn: true,
        emailNotifications: true,
        pushNotifications: true,
        locationSharing: false,
      };
    } catch (error) {
      console.error('Error getting privacy settings:', error);
      return null;
    }
  }

  /**
   * Update user's privacy settings
   */
  static async updatePrivacySettings(settings: Partial<PrivacySettings>): Promise<void> {
    if (FIREBASE_MODE) {
      try {
        const user = await FirebaseService.getCurrentUser();
        if (!user) {
          throw new Error('No authenticated user found');
        }

        await updateDoc(doc(firebaseFirestore!, 'users', user.id), {
          privacySettings: settings,
          updatedAt: new Date().toISOString(),
        });

        console.log('✅ Privacy settings updated successfully');
      } catch (error: any) {
        console.error('Privacy settings update error:', error);
        throw new Error(error.message || 'Privacy settings update failed');
      }
    } else {
      // Simulate privacy settings update for offline mode
      await new Promise(resolve => setTimeout(resolve, 1000));
      return;
    }
  }

  /**
   * Delete user account
   */
  static async deleteAccount(password: string): Promise<void> {
    if (FIREBASE_MODE) {
      try {
        const currentUser = firebaseAuth?.currentUser;
        if (!currentUser) {
          throw new Error('No authenticated user found');
        }

        // Re-authenticate user before deletion
        if (currentUser.email) {
          const credential = EmailAuthProvider.credential(currentUser.email, password);
          await reauthenticateWithCredential(currentUser, credential);
        }

        // Delete user data from Firestore
        await this.deleteUserData(currentUser.uid);

        // Delete the user account
        await deleteUser(currentUser);

        console.log('✅ Account deleted successfully');
      } catch (error: any) {
        console.error('Account deletion error:', error);
        throw new Error(error.message || 'Account deletion failed');
      }
    } else {
      // Simulate account deletion for offline mode
      await new Promise(resolve => setTimeout(resolve, 2000));
      return;
    }
  }

  /**
   * Delete all user data from Firestore
   */
  private static async deleteUserData(userId: string): Promise<void> {
    if (!firebaseFirestore) {
      throw new Error('Firebase not initialized');
    }

    const batch = writeBatch(firebaseFirestore);

    // Delete user document
    batch.delete(doc(firebaseFirestore, 'users', userId));

    // Delete user's habits
    const habitsQuery = query(collection(firebaseFirestore, 'habits'), where('userId', '==', userId));
    const habitsSnapshot = await getDocs(habitsQuery);
    habitsSnapshot.forEach((doc) => {
      batch.delete(doc.ref);
    });

    // Delete user's analytics
    const analyticsQuery = query(collection(firebaseFirestore, 'analytics'), where('userId', '==', userId));
    const analyticsSnapshot = await getDocs(analyticsQuery);
    analyticsSnapshot.forEach((doc) => {
      batch.delete(doc.ref);
    });

    // Delete user's settings
    const settingsQuery = query(collection(firebaseFirestore, 'settings'), where('userId', '==', userId));
    const settingsSnapshot = await getDocs(settingsQuery);
    settingsSnapshot.forEach((doc) => {
      batch.delete(doc.ref);
    });

    // Commit the batch
    await batch.commit();
  }

  /**
   * Export user data
   */
  static async exportUserData(): Promise<any> {
    try {
      if (!FIREBASE_MODE) {
        // Return local data for offline mode
        const userData = await AsyncStorage.getItem('user');
        return userData ? JSON.parse(userData) : null;
      }

      const user = await FirebaseService.getCurrentUser();
      if (!user) {
        throw new Error('No authenticated user found');
      }

      // Get user document
      const userDoc = await getDoc(doc(firebaseFirestore!, 'users', user.id));
      let userData;
      if (!userDoc.exists()) {
        console.log('⚠️ User document not found during export, using current user data');
        userData = user;
      } else {
        userData = userDoc.data();
      }

      // Get user's habits
      const habitsQuery = query(collection(firebaseFirestore!, 'habits'), where('userId', '==', user.id));
      const habitsSnapshot = await getDocs(habitsQuery);
      const habits = habitsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      // Get user's analytics
      const analyticsQuery = query(collection(firebaseFirestore!, 'analytics'), where('userId', '==', user.id));
      const analyticsSnapshot = await getDocs(analyticsQuery);
      const analytics = analyticsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      // Get user's settings
      const settingsQuery = query(collection(firebaseFirestore!, 'settings'), where('userId', '==', user.id));
      const settingsSnapshot = await getDocs(settingsQuery);
      const settings = settingsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      return {
        user: userData,
        habits,
        analytics,
        settings,
        exportDate: new Date().toISOString(),
        version: '1.0.0',
      };
    } catch (error) {
      console.error('Error exporting user data:', error);
      throw new Error('Failed to export user data');
    }
  }
}
