import { getValue, fetchAndActivate } from 'firebase/remote-config';
import { firebaseRemoteConfig } from '@/lib/firebase';

// Default configuration values
const defaultConfig: { [key: string]: any } = {
  // Feature flags
  'ai_suggestions_enabled': true,
  'community_features_enabled': false,
  'advanced_analytics_enabled': true,
  'push_notifications_enabled': true,
  'mood_tracking_enabled': true,
  'streak_milestones_enabled': true,
  'social_sharing_enabled': false,
  'premium_features_enabled': true,
  
  // App settings
  'max_habits_per_user': 20,
  'streak_reminder_delay_hours': 24,
  'mood_checkin_reminder_enabled': true,
  'daily_reminder_time': '09:00',
  'weekly_report_enabled': true,
  'data_export_enabled': true,
  'performance_alerts_enabled': true,
  
  // UI/UX settings
  'theme_auto_switch_enabled': true,
  'animation_speed': 'normal',
  'accessibility_mode_enabled': false,
  'compact_mode_enabled': false,
  
  // Performance settings
  'cache_duration_hours': 24,
  'sync_interval_minutes': 15,
  'offline_mode_enabled': true,
  'batch_operations_enabled': true,
  
  // Content settings
  'motivational_messages_enabled': true,
  'achievement_notifications_enabled': true,
  'progress_insights_enabled': true,
  'habit_suggestions_enabled': true
};

export class RemoteConfigService {
  private static isInitialized = false;

  // Initialize Remote Config
  static async initialize(): Promise<void> {
    try {
      if (this.isInitialized) {
        console.log('Remote Config already initialized');
        return;
      }

      // Check if remote config is available
      if (!firebaseRemoteConfig) {
        console.log('⚠️ Remote Config not available in React Native environment, using default values');
        this.isInitialized = true;
        return;
      }

      // Set minimum fetch interval for development (0 = no cache)
      firebaseRemoteConfig.settings.minimumFetchIntervalMillis = 0;
      
      // For React Native, we need to handle the indexedDB error
      try {
        // Fetch and activate remote config
        await fetchAndActivate(firebaseRemoteConfig);
        this.isInitialized = true;
        console.log('✅ Remote Config initialized successfully');
      } catch (fetchError: any) {
        // If it's an indexedDB error, just use default values
        if (fetchError.message?.includes('indexedDB') || fetchError.message?.includes('Property \'indexedDB\' doesn\'t exist')) {
          console.log('⚠️ Remote Config fetch failed (indexedDB not available), using default values');
          this.isInitialized = true;
        } else {
          throw fetchError;
        }
      }
    } catch (error) {
      console.error('❌ Error initializing Remote Config:', error);
      // Continue with default values
      this.isInitialized = true;
    }
  }

  // Get boolean feature flags
  static getFeatureFlag(key: string): boolean {
    try {
      if (!firebaseRemoteConfig) {
        // Return default value if remote config is not available
        return defaultConfig[key] || false;
      }
      const value = getValue(firebaseRemoteConfig, key);
      return value.asBoolean();
    } catch (error) {
      console.error(`Error getting feature flag ${key}:`, error);
      // Return default value based on key
      return defaultConfig[key] || false;
    }
  }

  // Get string app settings
  static getAppSetting(key: string): string {
    try {
      if (!firebaseRemoteConfig) {
        return defaultConfig[key] || '';
      }
      const value = getValue(firebaseRemoteConfig, key);
      return value.asString();
    } catch (error) {
      console.error(`Error getting app setting ${key}:`, error);
      return defaultConfig[key] || '';
    }
  }

  // Get number settings
  static getNumber(key: string): number {
    try {
      if (!firebaseRemoteConfig) {
        return defaultConfig[key] || 0;
      }
      const value = getValue(firebaseRemoteConfig, key);
      return value.asNumber();
    } catch (error) {
      console.error(`Error getting number ${key}:`, error);
      return defaultConfig[key] || 0;
    }
  }

  // Get all feature flags as an object
  static getAllFeatureFlags(): { [key: string]: boolean } {
    const featureFlags = [
      'ai_suggestions_enabled',
      'community_features_enabled',
      'advanced_analytics_enabled',
      'push_notifications_enabled',
      'mood_tracking_enabled',
      'streak_milestones_enabled',
      'social_sharing_enabled',
      'premium_features_enabled',
      'mood_checkin_reminder_enabled',
      'weekly_report_enabled',
      'data_export_enabled',
      'performance_alerts_enabled',
      'theme_auto_switch_enabled',
      'accessibility_mode_enabled',
      'compact_mode_enabled',
      'offline_mode_enabled',
      'batch_operations_enabled',
      'motivational_messages_enabled',
      'achievement_notifications_enabled',
      'progress_insights_enabled',
      'habit_suggestions_enabled'
    ];

    const result: { [key: string]: boolean } = {};
    featureFlags.forEach(flag => {
      result[flag] = this.getFeatureFlag(flag);
    });

    return result;
  }

  // Get all app settings as an object
  static getAllAppSettings(): { [key: string]: any } {
    return {
      // Numbers
      max_habits_per_user: this.getNumber('max_habits_per_user'),
      streak_reminder_delay_hours: this.getNumber('streak_reminder_delay_hours'),
      cache_duration_hours: this.getNumber('cache_duration_hours'),
      sync_interval_minutes: this.getNumber('sync_interval_minutes'),
      
      // Strings
      daily_reminder_time: this.getAppSetting('daily_reminder_time'),
      animation_speed: this.getAppSetting('animation_speed'),
      
      // Booleans (already included in feature flags)
      ...this.getAllFeatureFlags()
    };
  }

  // Check if a specific feature is enabled
  static isFeatureEnabled(featureName: string): boolean {
    return this.getFeatureFlag(`${featureName}_enabled`);
  }

  // Get user-specific settings (for future use with user targeting)
  static getUserSetting(userId: string, key: string): any {
    // This could be extended to support user-specific remote config
    // For now, return the global setting
    return this.getFeatureFlag(key);
  }

  // Force refresh of remote config
  static async refresh(): Promise<void> {
    try {
      this.isInitialized = false;
      await this.initialize();
      console.log('✅ Remote Config refreshed successfully');
    } catch (error) {
      console.error('❌ Error refreshing Remote Config:', error);
    }
  }

  // Get configuration summary for debugging
  static getConfigSummary(): { [key: string]: any } {
    return {
      isInitialized: this.isInitialized,
      featureFlags: this.getAllFeatureFlags(),
      appSettings: this.getAllAppSettings(),
      lastFetchTime: new Date().toISOString()
    };
  }

  // Validate configuration
  static validateConfig(): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    // Check required feature flags
    const requiredFlags = [
      'ai_suggestions_enabled',
      'mood_tracking_enabled',
      'streak_milestones_enabled'
    ];
    
    requiredFlags.forEach(flag => {
      if (typeof this.getFeatureFlag(flag) !== 'boolean') {
        errors.push(`Invalid feature flag: ${flag}`);
      }
    });

    // Check required app settings
    const requiredSettings = [
      'max_habits_per_user',
      'streak_reminder_delay_hours'
    ];
    
    requiredSettings.forEach(setting => {
      const value = this.getNumber(setting);
      if (typeof value !== 'number' || value <= 0) {
        errors.push(`Invalid app setting: ${setting}`);
      }
    });

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}
