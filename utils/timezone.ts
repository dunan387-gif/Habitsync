import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Localization from 'expo-localization';

// Timezone interface
export interface TimezoneInfo {
  timezone: string;
  offset: number;
  region: string;
  city?: string;
}

// Default timezone data for common regions
const DEFAULT_TIMEZONES: Record<string, TimezoneInfo> = {
  'America/New_York': { timezone: 'America/New_York', offset: -5, region: 'US', city: 'New York' },
  'America/Chicago': { timezone: 'America/Chicago', offset: -6, region: 'US', city: 'Chicago' },
  'America/Denver': { timezone: 'America/Denver', offset: -7, region: 'US', city: 'Denver' },
  'America/Los_Angeles': { timezone: 'America/Los_Angeles', offset: -8, region: 'US', city: 'Los Angeles' },
  'Europe/London': { timezone: 'Europe/London', offset: 0, region: 'UK', city: 'London' },
  'Europe/Paris': { timezone: 'Europe/Paris', offset: 1, region: 'EU', city: 'Paris' },
  'Europe/Berlin': { timezone: 'Europe/Berlin', offset: 1, region: 'EU', city: 'Berlin' },
  'Asia/Tokyo': { timezone: 'Asia/Tokyo', offset: 9, region: 'JP', city: 'Tokyo' },
  'Asia/Shanghai': { timezone: 'Asia/Shanghai', offset: 8, region: 'CN', city: 'Shanghai' },
  'Asia/Kolkata': { timezone: 'Asia/Kolkata', offset: 5.5, region: 'IN', city: 'Mumbai' },
  'Australia/Sydney': { timezone: 'Australia/Sydney', offset: 10, region: 'AU', city: 'Sydney' },
  'Pacific/Auckland': { timezone: 'Pacific/Auckland', offset: 12, region: 'NZ', city: 'Auckland' },
};

// Storage key for user's timezone preference
const TIMEZONE_STORAGE_KEY = '@productivity_app_user_timezone';

class TimezoneManager {
  private userTimezone: TimezoneInfo | null = null;
  private isInitialized = false;

  /**
   * Initialize the timezone manager
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      // Try to load saved timezone preference
      const savedTimezone = await this.loadSavedTimezone();
      
      if (savedTimezone) {
        this.userTimezone = savedTimezone;
      } else {
        // Auto-detect timezone from device
        this.userTimezone = await this.detectUserTimezone();
        // Save the detected timezone
        await this.saveTimezone(this.userTimezone);
      }

      this.isInitialized = true;
      console.log('🌍 Timezone initialized:', this.userTimezone);
    } catch (error) {
      console.error('❌ Error initializing timezone:', error);
      // Fallback to device timezone
      this.userTimezone = await this.detectUserTimezone();
      this.isInitialized = true;
    }
  }

  /**
   * Detect user's timezone from device settings
   */
  private async detectUserTimezone(): Promise<TimezoneInfo> {
    try {
      // Get device locale and timezone
      const deviceLocale = (Localization as any).locale || 'en-US';
      const deviceTimezone = (Localization as any).timezone || Intl.DateTimeFormat().resolvedOptions().timeZone;
      
      console.log('🌍 Device locale:', deviceLocale);
      console.log('🌍 Device timezone:', deviceTimezone);

      // Try to match with known timezones
      if (deviceTimezone && DEFAULT_TIMEZONES[deviceTimezone]) {
        return DEFAULT_TIMEZONES[deviceTimezone];
      }

      // Fallback: determine timezone from locale
      const region = deviceLocale.split('-')[1] || deviceLocale.split('_')[1];
      const timezone = this.getTimezoneFromRegion(region, deviceTimezone);
      
      return timezone;
    } catch (error) {
      console.error('❌ Error detecting timezone:', error);
      // Ultimate fallback
      return {
        timezone: 'UTC',
        offset: 0,
        region: 'Unknown'
      };
    }
  }

  /**
   * Get timezone from region code
   */
  private getTimezoneFromRegion(region: string, deviceTimezone: string): TimezoneInfo {
    const regionMap: Record<string, string> = {
      'US': 'America/New_York',
      'CA': 'America/Toronto',
      'GB': 'Europe/London',
      'DE': 'Europe/Berlin',
      'FR': 'Europe/Paris',
      'JP': 'Asia/Tokyo',
      'CN': 'Asia/Shanghai',
      'IN': 'Asia/Kolkata',
      'AU': 'Australia/Sydney',
      'NZ': 'Pacific/Auckland',
    };

    const timezone = regionMap[region] || deviceTimezone || 'UTC';
    return DEFAULT_TIMEZONES[timezone] || {
      timezone,
      offset: new Date().getTimezoneOffset() / -60,
      region: region || 'Unknown'
    };
  }

  /**
   * Load saved timezone from storage
   */
  private async loadSavedTimezone(): Promise<TimezoneInfo | null> {
    try {
      const saved = await AsyncStorage.getItem(TIMEZONE_STORAGE_KEY);
      return saved ? JSON.parse(saved) : null;
    } catch (error) {
      console.error('❌ Error loading saved timezone:', error);
      return null;
    }
  }

  /**
   * Save timezone to storage
   */
  private async saveTimezone(timezone: TimezoneInfo): Promise<void> {
    try {
      await AsyncStorage.setItem(TIMEZONE_STORAGE_KEY, JSON.stringify(timezone));
    } catch (error) {
      console.error('❌ Error saving timezone:', error);
    }
  }

  /**
   * Get current user timezone
   */
  getCurrentTimezone(): TimezoneInfo {
    if (!this.isInitialized) {
      console.warn('⚠️ Timezone not initialized, using fallback');
      return {
        timezone: 'UTC',
        offset: 0,
        region: 'Unknown'
      };
    }
    return this.userTimezone!;
  }

  /**
   * Set user timezone manually
   */
  async setTimezone(timezone: TimezoneInfo): Promise<void> {
    this.userTimezone = timezone;
    await this.saveTimezone(timezone);
    console.log('🌍 Timezone updated:', timezone);
  }

  /**
   * Get available timezones
   */
  getAvailableTimezones(): TimezoneInfo[] {
    return Object.values(DEFAULT_TIMEZONES);
  }

  /**
   * Convert UTC date to user's local date string (YYYY-MM-DD)
   */
  toLocalDateString(date: Date = new Date()): string {
    const timezone = this.getCurrentTimezone();
    
    try {
      // Use Intl.DateTimeFormat to get the date in the user's timezone
      const formatter = new Intl.DateTimeFormat('en-CA', { 
        timeZone: timezone.timezone,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      });
      
      // This returns YYYY-MM-DD format directly
      const result = formatter.format(date);
      console.log('🌍 toLocalDateString:', { input: date, timezone: timezone.timezone, result });
      return result;
    } catch (error) {
      console.error('❌ Error converting to local date:', error);
      // Fallback to device timezone
      const now = new Date();
      const offset = now.getTimezoneOffset();
      const localDate = new Date(now.getTime() - (offset * 60 * 1000));
      const fallback = localDate.toISOString().split('T')[0];
      console.log('🌍 toLocalDateString fallback:', fallback);
      return fallback;
    }
  }

  /**
   * Convert user's local date string to UTC date
   */
  fromLocalDateString(dateString: string): Date {
    const timezone = this.getCurrentTimezone();
    
    try {
      // Parse the date string and create a date in user's timezone
      const [year, month, day] = dateString.split('-').map(Number);
      const localDate = new Date(year, month - 1, day);
      
      // Convert to UTC
      const utcDate = new Date(localDate.toLocaleString('en-US', { timeZone: 'UTC' }));
      return utcDate;
    } catch (error) {
      console.error('❌ Error converting from local date:', error);
      // Fallback
      return new Date(dateString);
    }
  }

  /**
   * Get current time in user's timezone
   */
  getCurrentTime(): Date {
    const timezone = this.getCurrentTimezone();
    
    try {
      return new Date(new Date().toLocaleString('en-US', { timeZone: timezone.timezone }));
    } catch (error) {
      console.error('❌ Error getting current time:', error);
      return new Date();
    }
  }

  /**
   * Check if a date is today in user's timezone
   */
  isToday(date: Date): boolean {
    const today = this.toLocalDateString();
    const dateStr = this.toLocalDateString(date);
    console.log('🔍 isToday check:', { today, dateStr, isToday: today === dateStr });
    return today === dateStr;
  }

  /**
   * Get start of day in user's timezone
   */
  getStartOfDay(date: Date = new Date()): Date {
    const localDateStr = this.toLocalDateString(date);
    const [year, month, day] = localDateStr.split('-').map(Number);
    return new Date(year, month - 1, day);
  }

  /**
   * Get end of day in user's timezone
   */
  getEndOfDay(date: Date = new Date()): Date {
    const startOfDay = this.getStartOfDay(date);
    startOfDay.setHours(23, 59, 59, 999);
    return startOfDay;
  }

  /**
   * Format date for display in user's timezone
   */
  formatDate(date: Date, options: Intl.DateTimeFormatOptions = {}): string {
    const timezone = this.getCurrentTimezone();
    
    try {
      return date.toLocaleDateString('en-US', {
        timeZone: timezone.timezone,
        ...options
      });
    } catch (error) {
      console.error('❌ Error formatting date:', error);
      return date.toLocaleDateString('en-US', options);
    }
  }

  /**
   * Format time for display in user's timezone
   */
  formatTime(date: Date, options: Intl.DateTimeFormatOptions = {}): string {
    const timezone = this.getCurrentTimezone();
    
    try {
      return date.toLocaleTimeString('en-US', {
        timeZone: timezone.timezone,
        ...options
      });
    } catch (error) {
      console.error('❌ Error formatting time:', error);
      return date.toLocaleTimeString('en-US', options);
    }
  }

  /**
   * Get timezone offset in hours
   */
  getTimezoneOffset(): number {
    return this.getCurrentTimezone().offset;
  }

  /**
   * Get timezone name
   */
  getTimezoneName(): string {
    return this.getCurrentTimezone().timezone;
  }

  /**
   * Get timezone region
   */
  getTimezoneRegion(): string {
    return this.getCurrentTimezone().region;
  }
}

// Create singleton instance
export const timezoneManager = new TimezoneManager();

// Export convenience functions
export const getLocalDateString = (date?: Date): string => {
  return timezoneManager.toLocalDateString(date);
};

export const isToday = (date: Date): boolean => {
  return timezoneManager.isToday(date);
};

export const getCurrentTimezone = (): TimezoneInfo => {
  return timezoneManager.getCurrentTimezone();
};

export const formatDate = (date: Date, options?: Intl.DateTimeFormatOptions): string => {
  return timezoneManager.formatDate(date, options);
};

export const formatTime = (date: Date, options?: Intl.DateTimeFormatOptions): string => {
  return timezoneManager.formatTime(date, options);
};

// Initialize timezone manager when module is imported
timezoneManager.initialize().catch(error => {
  console.error('❌ Failed to initialize timezone manager:', error);
});
