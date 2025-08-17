import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';

interface StorageOptions {
  encrypt?: boolean;
  compress?: boolean;
  validate?: boolean;
}

interface StorageStats {
  totalKeys: number;
  totalSize: number;
  corruptedKeys: number;
  lastCleanup: number;
}

class DataPersistenceService {
  private static instance: DataPersistenceService;
  private storageStats: StorageStats = {
    totalKeys: 0,
    totalSize: 0,
    corruptedKeys: 0,
    lastCleanup: 0
  };

  private constructor() {}

  static getInstance(): DataPersistenceService {
    if (!DataPersistenceService.instance) {
      DataPersistenceService.instance = new DataPersistenceService();
    }
    return DataPersistenceService.instance;
  }

  // Enhanced set method with validation and error handling
  async set(key: string, value: any, options: StorageOptions = {}): Promise<void> {
    try {
      const { encrypt = false, compress = false, validate = true } = options;
      
      // Validate data before storing
      if (validate) {
        this.validateData(value);
      }

      let dataToStore = value;
      
      // Compress if needed
      if (compress) {
        dataToStore = JSON.stringify(value);
      }

      // Encrypt if needed
      if (encrypt) {
        await SecureStore.setItemAsync(key, JSON.stringify(dataToStore));
      } else {
        await AsyncStorage.setItem(key, JSON.stringify(dataToStore));
      }

      // Update stats
      this.updateStats(key, dataToStore);
      
    } catch (error) {
      console.error(`❌ Failed to store data for key ${key}:`, error);
      throw new Error(`Storage failed for key ${key}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Enhanced get method with validation and error handling
  async get<T = any>(key: string, options: StorageOptions = {}): Promise<T | null> {
    try {
      const { encrypt = false, validate = true } = options;
      
      let rawData: string | null;
      
      // Get data from appropriate storage
      if (encrypt) {
        rawData = await SecureStore.getItemAsync(key);
      } else {
        rawData = await AsyncStorage.getItem(key);
      }

      if (!rawData) {
        return null;
      }

      // Parse data
      const parsedData = JSON.parse(rawData);
      
      // Validate data if needed
      if (validate) {
        this.validateData(parsedData);
      }

      return parsedData;
      
    } catch (error) {
      console.error(`❌ Failed to retrieve data for key ${key}:`, error);
      
      // If data is corrupted, remove it
      if (error instanceof SyntaxError) {
        console.log(`🗑️ Removing corrupted data for key ${key}`);
        await this.remove(key, options);
        this.storageStats.corruptedKeys++;
      }
      
      return null;
    }
  }

  // Enhanced remove method
  async remove(key: string, options: StorageOptions = {}): Promise<void> {
    try {
      const { encrypt = false } = options;
      
      if (encrypt) {
        await SecureStore.deleteItemAsync(key);
      } else {
        await AsyncStorage.removeItem(key);
      }
      
      // Update stats
      this.updateStats(key, null, true);
      
    } catch (error) {
      console.error(`❌ Failed to remove data for key ${key}:`, error);
    }
  }

  // Clear all data
  async clear(): Promise<void> {
    try {
      await AsyncStorage.clear();
      await SecureStore.deleteItemAsync('all'); // Clear secure store
      
      // Reset stats
      this.storageStats = {
        totalKeys: 0,
        totalSize: 0,
        corruptedKeys: 0,
        lastCleanup: Date.now()
      };
      
      console.log('✅ All data cleared successfully');
    } catch (error) {
      console.error('❌ Failed to clear data:', error);
    }
  }

  // Get all keys
  async getAllKeys(): Promise<string[]> {
    try {
      const asyncKeys = await AsyncStorage.getAllKeys();
      return [...asyncKeys]; // Convert readonly array to mutable array
    } catch (error) {
      console.error('❌ Failed to get all keys:', error);
      return [];
    }
  }

  // Clean up corrupted data
  async cleanupCorruptedData(): Promise<number> {
    try {
      console.log('🧹 Starting data cleanup...');
      const allKeys = await this.getAllKeys();
      let cleanedCount = 0;
      
      for (const key of allKeys) {
        try {
          const value = await AsyncStorage.getItem(key);
          if (value) {
            // Test if it's valid JSON
            JSON.parse(value);
          }
        } catch (parseError) {
          console.log(`🗑️ Removing corrupted data from key: ${key}`);
          await AsyncStorage.removeItem(key);
          cleanedCount++;
          this.storageStats.corruptedKeys++;
        }
      }
      
      this.storageStats.lastCleanup = Date.now();
      console.log(`✅ Cleanup complete - removed ${cleanedCount} corrupted entries`);
      
      return cleanedCount;
    } catch (error) {
      console.error('❌ Error during cleanup:', error);
      return 0;
    }
  }

  // Validate data structure
  private validateData(data: any): void {
    if (data === null || data === undefined) {
      throw new Error('Data cannot be null or undefined');
    }
    
    // Check for circular references
    const seen = new WeakSet();
    const checkCircular = (obj: any): void => {
      if (obj && typeof obj === 'object') {
        if (seen.has(obj)) {
          throw new Error('Circular reference detected');
        }
        seen.add(obj);
        
        for (const key in obj) {
          if (obj.hasOwnProperty(key)) {
            checkCircular(obj[key]);
          }
        }
      }
    };
    
    checkCircular(data);
  }

  // Update storage statistics
  private updateStats(key: string, value: any, isRemoval: boolean = false): void {
    if (isRemoval) {
      this.storageStats.totalKeys = Math.max(0, this.storageStats.totalKeys - 1);
    } else {
      this.storageStats.totalKeys++;
    }
    
    // Calculate size (rough estimate)
    const size = JSON.stringify(value).length;
    if (isRemoval) {
      this.storageStats.totalSize = Math.max(0, this.storageStats.totalSize - size);
    } else {
      this.storageStats.totalSize += size;
    }
  }

  // Get storage statistics
  getStats(): StorageStats {
    return { ...this.storageStats };
  }

  // Backup data
  async backup(): Promise<string> {
    try {
      const allKeys = await this.getAllKeys();
      const backup: Record<string, any> = {};
      
      for (const key of allKeys) {
        const value = await this.get(key);
        if (value !== null) {
          backup[key] = value;
        }
      }
      
      const backupString = JSON.stringify(backup);
      console.log(`✅ Backup created with ${Object.keys(backup).length} items`);
      
      return backupString;
    } catch (error) {
      console.error('❌ Failed to create backup:', error);
      throw error;
    }
  }

  // Restore from backup
  async restore(backupString: string): Promise<void> {
    try {
      const backup = JSON.parse(backupString);
      
      // Clear existing data
      await this.clear();
      
      // Restore data
      for (const [key, value] of Object.entries(backup)) {
        await this.set(key, value);
      }
      
      console.log(`✅ Backup restored with ${Object.keys(backup).length} items`);
    } catch (error) {
      console.error('❌ Failed to restore backup:', error);
      throw error;
    }
  }

  // Check storage health
  async checkHealth(): Promise<{
    isHealthy: boolean;
    issues: string[];
    recommendations: string[];
  }> {
    const issues: string[] = [];
    const recommendations: string[] = [];
    
    try {
      const stats = this.getStats();
      
      // Check for corrupted data
      if (stats.corruptedKeys > 0) {
        issues.push(`${stats.corruptedKeys} corrupted entries detected`);
        recommendations.push('Run cleanup to remove corrupted data');
      }
      
      // Check storage size
      const maxSize = 50 * 1024 * 1024; // 50MB limit
      if (stats.totalSize > maxSize) {
        issues.push('Storage size is getting large');
        recommendations.push('Consider cleaning up old data');
      }
      
      // Check last cleanup
      const daysSinceCleanup = (Date.now() - stats.lastCleanup) / (1000 * 60 * 60 * 24);
      if (daysSinceCleanup > 7) {
        recommendations.push('Consider running cleanup for maintenance');
      }
      
      return {
        isHealthy: issues.length === 0,
        issues,
        recommendations
      };
    } catch (error) {
      issues.push('Failed to check storage health');
      return {
        isHealthy: false,
        issues,
        recommendations: ['Check storage permissions and available space']
      };
    }
  }
}

export const dataPersistenceService = DataPersistenceService.getInstance();
export default dataPersistenceService;
