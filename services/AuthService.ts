import { auth, db } from '@/lib/firebase';
import { 
  updatePassword, 
  reauthenticateWithCredential, 
  EmailAuthProvider,
  deleteUser,
  linkWithCredential,
  unlink,
  OAuthProvider,
  GoogleAuthProvider,
  signInWithPopup,
  User as FirebaseUser
} from 'firebase/auth';
import { doc, deleteDoc, updateDoc } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { OFFLINE_MODE } from '@/constants/api';

export interface LinkedAccount {
  id: string;
  provider: string;
  email?: string;
  isConnected: boolean;
  connectedAt?: string;
}

export class AuthService {
  /**
   * Change user password
   */
  static async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    if (OFFLINE_MODE) {
      // Simulate password change for offline mode
      await new Promise(resolve => setTimeout(resolve, 1000));
      return;
    }

    const user = auth.currentUser;
    if (!user || !user.email) {
      throw new Error('No authenticated user found');
    }

    try {
      // Re-authenticate user before changing password
      const credential = EmailAuthProvider.credential(user.email, currentPassword);
      await reauthenticateWithCredential(user, credential);
      
      // Change password
      await updatePassword(user, newPassword);
    } catch (error: any) {
      if (error.code === 'auth/wrong-password') {
        throw new Error('Current password is incorrect');
      } else if (error.code === 'auth/weak-password') {
        throw new Error('New password is too weak');
      } else {
        throw new Error('Failed to change password: ' + error.message);
      }
    }
  }

  /**
   * Get linked accounts for the current user
   */
  static async getLinkedAccounts(): Promise<LinkedAccount[]> {
    if (OFFLINE_MODE) {
      // Return mock data for offline mode
      return [
        {
          id: '1',
          provider: 'Google',
          email: 'user@gmail.com',
          isConnected: true,
          connectedAt: '2024-01-15',
        },
        {
          id: '2',
          provider: 'Apple',
          isConnected: false,
        },
        {
          id: '3',
          provider: 'Facebook',
          isConnected: false,
        },
      ];
    }

    const user = auth.currentUser;
    if (!user) {
      throw new Error('No authenticated user found');
    }

    try {
      // Get user's linked accounts from Firebase
      const providers = user.providerData;
      const linkedAccounts: LinkedAccount[] = [];

      // Check for Google
      const googleProvider = providers.find(p => p.providerId === 'google.com');
      linkedAccounts.push({
        id: 'google',
        provider: 'Google',
        email: googleProvider?.email || undefined,
        isConnected: !!googleProvider,
        connectedAt: googleProvider ? '2024-01-15' : undefined,
      });

      // Check for Apple
      const appleProvider = providers.find(p => p.providerId === 'apple.com');
      linkedAccounts.push({
        id: 'apple',
        provider: 'Apple',
        email: appleProvider?.email || undefined,
        isConnected: !!appleProvider,
        connectedAt: appleProvider ? '2024-01-15' : undefined,
      });

      // Check for Facebook
      const facebookProvider = providers.find(p => p.providerId === 'facebook.com');
      linkedAccounts.push({
        id: 'facebook',
        provider: 'Facebook',
        email: facebookProvider?.email || undefined,
        isConnected: !!facebookProvider,
        connectedAt: facebookProvider ? '2024-01-15' : undefined,
      });

      return linkedAccounts;
    } catch (error: any) {
      throw new Error('Failed to get linked accounts: ' + error.message);
    }
  }

  /**
   * Link or unlink an account
   */
  static async toggleLinkedAccount(providerId: string, action: 'link' | 'unlink'): Promise<void> {
    if (OFFLINE_MODE) {
      // Simulate account linking/unlinking for offline mode
      await new Promise(resolve => setTimeout(resolve, 1000));
      return;
    }

    const user = auth.currentUser;
    if (!user) {
      throw new Error('No authenticated user found');
    }

    try {
      if (action === 'link') {
        // Link account - this would typically involve OAuth flow
        // For now, we'll simulate the linking process
        throw new Error('Account linking requires OAuth implementation');
      } else {
        // Unlink account
        const provider = this.getProviderForId(providerId);
        if (provider) {
          await unlink(user, provider.providerId);
        }
      }
    } catch (error: any) {
      throw new Error(`Failed to ${action} account: ${error.message}`);
    }
  }

  /**
   * Delete user account and all associated data
   */
  static async deleteAccount(): Promise<void> {
    if (OFFLINE_MODE) {
      // Simulate account deletion for offline mode
      await new Promise(resolve => setTimeout(resolve, 2000));
      return;
    }

    const user = auth.currentUser;
    if (!user) {
      throw new Error('No authenticated user found');
    }

    try {
      // Delete user data from Firestore
      await deleteDoc(doc(db, 'users', user.uid));
      
      // Delete user from Firebase Auth
      await deleteUser(user);
      
      // Clear local storage
      await this.clearLocalData();
    } catch (error: any) {
      throw new Error('Failed to delete account: ' + error.message);
    }
  }

  /**
   * Clear all local data
   */
  static async clearLocalData(): Promise<void> {
    try {
      // Clear AsyncStorage
      await AsyncStorage.clear();
      
      // Clear SecureStore
      await SecureStore.deleteItemAsync('authToken');
      await SecureStore.deleteItemAsync('encryption_key');
      await SecureStore.deleteItemAsync('encryption_salt');
    } catch (error) {
      console.error('Error clearing local data:', error);
      // Don't throw error as this is cleanup
    }
  }

  /**
   * Get OAuth provider for provider ID
   */
  private static getProviderForId(providerId: string) {
    switch (providerId.toLowerCase()) {
      case 'google':
        return new GoogleAuthProvider();
      case 'apple':
        return new OAuthProvider('apple.com');
      case 'facebook':
        return new OAuthProvider('facebook.com');
      default:
        return null;
    }
  }

  /**
   * Link Google account
   */
  static async linkGoogleAccount(): Promise<void> {
    if (OFFLINE_MODE) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      return;
    }

    const user = auth.currentUser;
    if (!user) {
      throw new Error('No authenticated user found');
    }

    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (error: any) {
      throw new Error('Failed to link Google account: ' + error.message);
    }
  }

  /**
   * Link Apple account
   */
  static async linkAppleAccount(): Promise<void> {
    if (OFFLINE_MODE) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      return;
    }

    const user = auth.currentUser;
    if (!user) {
      throw new Error('No authenticated user found');
    }

    try {
      const provider = new OAuthProvider('apple.com');
      await signInWithPopup(auth, provider);
    } catch (error: any) {
      throw new Error('Failed to link Apple account: ' + error.message);
    }
  }
}
