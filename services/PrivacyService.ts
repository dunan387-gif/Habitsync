import AsyncStorage from '@react-native-async-storage/async-storage';

export interface PrivacySettings {
  publicProfile: boolean;
  showStreakCount: boolean;
  showHabitList: boolean;
  analyticsCollection: boolean;
  crashReports: boolean;
  performanceData: boolean;
  socialSharing: boolean;
  friendRecommendations: boolean;
}

export class PrivacyService {
  private static readonly PRIVACY_SETTINGS_KEY = 'privacySettings';
  private static readonly USER_PREFERENCES_KEY = 'userPreferences';

  static async getPrivacySettings(): Promise<PrivacySettings> {
    try {
      const settings = await AsyncStorage.getItem(this.PRIVACY_SETTINGS_KEY);
      if (settings) {
        return JSON.parse(settings);
      }
      return this.getDefaultSettings();
    } catch (error) {
      console.error('Error getting privacy settings:', error);
      return this.getDefaultSettings();
    }
  }

  static async updatePrivacySetting(key: keyof PrivacySettings, value: boolean): Promise<void> {
    try {
      const currentSettings = await this.getPrivacySettings();
      const updatedSettings = { ...currentSettings, [key]: value };
      
      await AsyncStorage.setItem(this.PRIVACY_SETTINGS_KEY, JSON.stringify(updatedSettings));
      await this.applyPrivacySetting(key, value);
    } catch (error) {
      console.error('Error updating privacy setting:', error);
      throw error;
    }
  }

  static async isFeatureEnabled(feature: keyof PrivacySettings): Promise<boolean> {
    try {
      const settings = await this.getPrivacySettings();
      return settings[feature];
    } catch (error) {
      console.error('Error checking feature status:', error);
      return false;
    }
  }

  static async shouldShowProfileData(): Promise<boolean> {
    const settings = await this.getPrivacySettings();
    return settings.publicProfile;
  }

  static async shouldShowStreaks(): Promise<boolean> {
    const settings = await this.getPrivacySettings();
    return settings.showStreakCount;
  }

  static async shouldShowHabits(): Promise<boolean> {
    const settings = await this.getPrivacySettings();
    return settings.showHabitList;
  }

  static async canCollectAnalytics(): Promise<boolean> {
    const settings = await this.getPrivacySettings();
    return settings.analyticsCollection;
  }

  static async canSendCrashReports(): Promise<boolean> {
    const settings = await this.getPrivacySettings();
    return settings.crashReports;
  }

  static async canShareSocially(): Promise<boolean> {
    const settings = await this.getPrivacySettings();
    return settings.socialSharing;
  }

  private static getDefaultSettings(): PrivacySettings {
    return {
      publicProfile: false,
      showStreakCount: true,
      showHabitList: false,
      analyticsCollection: true,
      crashReports: true,
      performanceData: false,
      socialSharing: true,
      friendRecommendations: false,
    };
  }

  private static async applyPrivacySetting(key: keyof PrivacySettings, value: boolean): Promise<void> {
    try {
      // Apply the setting immediately to relevant app features
      switch (key) {
        case 'analyticsCollection':
          await AsyncStorage.setItem('analyticsEnabled', value.toString());
          break;
        case 'crashReports':
          await AsyncStorage.setItem('crashReportsEnabled', value.toString());
          break;
        case 'socialSharing':
          await AsyncStorage.setItem('socialSharingEnabled', value.toString());
          break;
        case 'publicProfile':
          await AsyncStorage.setItem('publicProfileEnabled', value.toString());
          break;
        case 'showStreakCount':
          await AsyncStorage.setItem('showStreakCount', value.toString());
          break;
        case 'showHabitList':
          await AsyncStorage.setItem('showHabitList', value.toString());
          break;
        case 'performanceData':
          await AsyncStorage.setItem('performanceDataEnabled', value.toString());
          break;
        case 'friendRecommendations':
          await AsyncStorage.setItem('friendRecommendationsEnabled', value.toString());
          break;
      }
    } catch (error) {
      console.error('Error applying privacy setting:', error);
    }
  }

  static async exportUserData(): Promise<any> {
    try {
      const allKeys = await AsyncStorage.getAllKeys();
      const userData: any = {};
      
      for (const key of allKeys) {
        if (key.startsWith('user_') || key.includes('habit') || key.includes('mood')) {
          const value = await AsyncStorage.getItem(key);
          userData[key] = value;
        }
      }
      
      return userData;
    } catch (error) {
      console.error('Error exporting user data:', error);
      throw error;
    }
  }

  static async deleteAllUserData(): Promise<void> {
    try {
      const allKeys = await AsyncStorage.getAllKeys();
      const userDataKeys = allKeys.filter(key => 
        key.startsWith('user_') || 
        key.includes('habit') || 
        key.includes('mood') ||
        key.includes('privacy') ||
        key.includes('preferences')
      );
      
      await AsyncStorage.multiRemove(userDataKeys);
    } catch (error) {
      console.error('Error deleting user data:', error);
      throw error;
    }
  }
}