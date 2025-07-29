import * as SecureStore from 'expo-secure-store';
import * as Crypto from 'expo-crypto';
import CryptoES from 'crypto-es';

export class EncryptionService {
  private static encryptionKey: string | null = null;
  private static salt: string | null = null;
  private static isInitialized = false;
  private static migrationCompleted = false;

  static async initializeEncryption(): Promise<void> {
    try {
      // Try to get existing key and salt
      let key = await SecureStore.getItemAsync('encryption_key');
      let salt = await SecureStore.getItemAsync('encryption_salt');

      if (!key || !salt) {
        // Generate new key and salt using expo-crypto
        const randomBytes = await Crypto.getRandomBytesAsync(16);
        const saltBytes = await Crypto.getRandomBytesAsync(16);
        
        key = Array.from(randomBytes, byte => byte.toString(16).padStart(2, '0')).join('');
        salt = Array.from(saltBytes, byte => byte.toString(16).padStart(2, '0')).join('');
        
        await SecureStore.setItemAsync('encryption_key', key);
        await SecureStore.setItemAsync('encryption_salt', salt);
      }

      this.encryptionKey = key;
      this.salt = salt;
      this.isInitialized = true;
      
      console.log('Encryption initialized successfully');
    } catch (error) {
      console.error('Encryption initialization failed:', error);
      throw error;
    }
  }

  static async encryptMoodData(data: any): Promise<string> {
    if (!this.isInitialized) {
      await this.initializeEncryption();
    }

    if (!this.encryptionKey || !this.salt) {
      throw new Error('Encryption not properly initialized');
    }

    try {
      const jsonString = JSON.stringify(data);
      
      // Create encryption key using crypto-es SHA256
      const derivedKey = CryptoES.SHA256(this.encryptionKey + this.salt).toString();
      
      // Encrypt using crypto-es AES
      const encrypted = CryptoES.AES.encrypt(jsonString, derivedKey).toString();
      
      return encrypted;
    } catch (error) {
      console.error('Encryption failed:', error);
      throw error;
    }
  }

  static async decryptMoodData(encryptedData: string): Promise<any> {
    if (!this.isInitialized) {
      await this.initializeEncryption();
    }

    if (!this.encryptionKey || !this.salt) {
      throw new Error('Encryption not properly initialized');
    }

    try {
      // First try new crypto-es decryption
      const derivedKey = CryptoES.SHA256(this.encryptionKey + this.salt).toString();
      const decrypted = CryptoES.AES.decrypt(encryptedData, derivedKey);
      const jsonString = decrypted.toString(CryptoES.enc.Utf8);
      
      if (!jsonString) {
        throw new Error('Failed to decrypt data');
      }
      
      return JSON.parse(jsonString);
    } catch (error) {
      console.error('Decryption failed:', error);
      // If decryption fails, return null to indicate no data
      // This allows the app to start fresh without crashing
      return null;
    }
  }

  // New method to clear incompatible encrypted data
  static async clearIncompatibleData(): Promise<void> {
    try {
      const AsyncStorage = require('@react-native-async-storage/async-storage').default;
      
      const keysToCheck = [
        'wellness_sleep_data',
        'wellness_exercise_data',
        'wellness_nutrition_data',
        'wellness_meditation_data',
        'wellness_social_data',
        'mood_entries',
        'habit_mood_entries'
      ];

      for (const key of keysToCheck) {
        try {
          const data = await AsyncStorage.getItem(key);
          if (data) {
            // Try to decrypt with new method
            const decrypted = await this.decryptMoodData(data);
            if (!decrypted) {
              // If decryption fails, remove the incompatible data
              await AsyncStorage.removeItem(key);
              console.log(`Cleared incompatible data for key: ${key}`);
            }
          }
        } catch (error) {
          // If there's an error, remove the problematic data
          await AsyncStorage.removeItem(key);
          console.log(`Cleared problematic data for key: ${key}`);
        }
      }
      
      console.log('Data migration completed');
    } catch (error) {
      console.error('Error during data migration:', error);
    }
  }

  static async secureDelete(key: string): Promise<void> {
    try {
      // Generate random data to overwrite
      const randomBytes = await Crypto.getRandomBytesAsync(32);
      const randomData = Array.from(randomBytes, byte => byte.toString(16).padStart(2, '0')).join('');
      
      // Overwrite with random data multiple times
      for (let i = 0; i < 3; i++) {
        await SecureStore.setItemAsync(key, randomData);
      }
      
      // Finally delete the key
      await SecureStore.deleteItemAsync(key);
    } catch (error) {
      console.error('Secure deletion failed:', error);
      // Fallback to regular deletion
      try {
        await SecureStore.deleteItemAsync(key);
      } catch (fallbackError) {
        console.error('Fallback deletion failed:', fallbackError);
      }
    }
  }
}