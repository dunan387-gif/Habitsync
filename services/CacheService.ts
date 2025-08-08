import AsyncStorage from '@react-native-async-storage/async-storage';

export interface CacheEntry<T = any> {
  data: T;
  timestamp: number;
  expiry: number;
  version: string;
  metadata?: {
    source: string;
    userId?: string;
    params?: any;
  };
}

export interface CacheConfig {
  defaultExpiry: number;
  maxSize: number;
  version: string;
  enablePersistent?: boolean;
}

export interface CacheStats {
  hits: number;
  misses: number;
  size: number;
  lastCleanup: number;
}

export type CacheKey = string;

export class CacheService {
  private static instance: CacheService;
  private cache: Map<CacheKey, CacheEntry> = new Map();
  private config: CacheConfig;
  private stats: CacheStats;
  private cleanupInterval: number | null = null;

  constructor(config: Partial<CacheConfig> = {}) {
    this.config = {
      defaultExpiry: 5 * 60 * 1000, // 5 minutes
      maxSize: 1000,
      version: '1.0.0',
      enablePersistent: true,
      ...config
    };

    this.stats = {
      hits: 0,
      misses: 0,
      size: 0,
      lastCleanup: Date.now()
    };

    this.startCleanupInterval();
    this.loadPersistentCache();
  }

  static getInstance(config?: Partial<CacheConfig>): CacheService {
    if (!CacheService.instance) {
      CacheService.instance = new CacheService(config);
    }
    return CacheService.instance;
  }

  async set<T>(
    key: CacheKey, 
    data: T, 
    expiry?: number,
    metadata?: CacheEntry['metadata']
  ): Promise<void> {
    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      expiry: expiry || this.config.defaultExpiry,
      version: this.config.version,
      metadata
    };

    if (this.cache.size >= this.config.maxSize) {
      this.evictOldest();
    }

    this.cache.set(key, entry);
    this.stats.size = this.cache.size;

    if (this.config.enablePersistent) {
      await this.saveToPersistent(key, entry);
    }
  }

  async get<T>(key: CacheKey): Promise<T | null> {
    const entry = this.cache.get(key) as CacheEntry<T> | undefined;

    if (!entry) {
      this.stats.misses++;
      return null;
    }

    if (Date.now() - entry.timestamp > entry.expiry) {
      this.cache.delete(key);
      this.stats.misses++;
      return null;
    }

    if (entry.version !== this.config.version) {
      this.cache.delete(key);
      this.stats.misses++;
      return null;
    }

    this.stats.hits++;
    return entry.data;
  }

  async getOrSet<T>(
    key: CacheKey,
    fallback: () => Promise<T>,
    expiry?: number,
    metadata?: CacheEntry['metadata']
  ): Promise<T> {
    const cached = await this.get<T>(key);
    if (cached !== null) {
      return cached;
    }

    const data = await fallback();
    await this.set(key, data, expiry, metadata);
    return data;
  }

  has(key: CacheKey): boolean {
    const entry = this.cache.get(key);
    if (!entry) return false;

    if (Date.now() - entry.timestamp > entry.expiry) {
      this.cache.delete(key);
      return false;
    }

    return entry.version === this.config.version;
  }

  delete(key: CacheKey): boolean {
    const deleted = this.cache.delete(key);
    if (deleted && this.config.enablePersistent) {
      this.removeFromPersistent(key);
    }
    this.stats.size = this.cache.size;
    return deleted;
  }

  async clear(): Promise<void> {
    this.cache.clear();
    this.stats.size = 0;
    this.stats.hits = 0;
    this.stats.misses = 0;

    if (this.config.enablePersistent) {
      await AsyncStorage.multiRemove(
        Array.from(this.cache.keys()).map(key => `cache_${key}`)
      );
    }
  }

  async clearByPattern(pattern: RegExp): Promise<void> {
    const keysToDelete: CacheKey[] = [];
    
    const keys = Array.from(this.cache.keys());
    for (const key of keys) {
      if (pattern.test(key)) {
        keysToDelete.push(key);
      }
    }

    keysToDelete.forEach(key => this.delete(key));
  }

  async clearByUser(userId: string): Promise<void> {
    const keysToDelete: CacheKey[] = [];
    
    const entries = Array.from(this.cache.entries());
    for (const [key, entry] of entries) {
      if (entry.metadata?.userId === userId) {
        keysToDelete.push(key);
      }
    }

    keysToDelete.forEach(key => this.delete(key));
  }

  getStats(): CacheStats {
    return { ...this.stats };
  }

  getHitRate(): number {
    const total = this.stats.hits + this.stats.misses;
    return total > 0 ? this.stats.hits / total : 0;
  }

  private evictOldest(): void {
    const entries = Array.from(this.cache.entries());
    entries.sort((a, b) => a[1].timestamp - b[1].timestamp);
    
    const toEvict = Math.ceil(this.config.maxSize * 0.1);
    for (let i = 0; i < toEvict && i < entries.length; i++) {
      this.cache.delete(entries[i][0]);
    }
  }

  private startCleanupInterval(): void {
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, 60 * 1000);
  }

  private cleanup(): void {
    const now = Date.now();
    const keysToDelete: CacheKey[] = [];

    const entries = Array.from(this.cache.entries());
    for (const [key, entry] of entries) {
      if (now - entry.timestamp > entry.expiry) {
        keysToDelete.push(key);
      }
    }

    keysToDelete.forEach(key => this.cache.delete(key));
    this.stats.size = this.cache.size;
    this.stats.lastCleanup = now;
  }

  private async saveToPersistent(key: CacheKey, entry: CacheEntry): Promise<void> {
    try {
      const storageKey = `cache_${key}`;
      await AsyncStorage.setItem(storageKey, JSON.stringify(entry));
    } catch (error) {
      console.warn('Failed to save cache entry:', error);
    }
  }

  private async removeFromPersistent(key: CacheKey): Promise<void> {
    try {
      const storageKey = `cache_${key}`;
      await AsyncStorage.removeItem(storageKey);
    } catch (error) {
      console.warn('Failed to remove cache entry:', error);
    }
  }

  private async loadPersistentCache(): Promise<void> {
    if (!this.config.enablePersistent) return;

    try {
      const keys = await AsyncStorage.getAllKeys();
      const cacheKeys = keys.filter(key => key.startsWith('cache_'));
      
      if (cacheKeys.length === 0) return;

      const entries = await AsyncStorage.multiGet(cacheKeys);
      
      for (const [key, value] of entries) {
        if (value) {
          try {
            const entry: CacheEntry = JSON.parse(value);
            const cacheKey = key.replace('cache_', '');
            
            if (Date.now() - entry.timestamp <= entry.expiry && 
                entry.version === this.config.version) {
              this.cache.set(cacheKey, entry);
            } else {
              await AsyncStorage.removeItem(key);
            }
          } catch (error) {
            console.warn('Failed to parse cache entry:', error);
            await AsyncStorage.removeItem(key);
          }
        }
      }

      this.stats.size = this.cache.size;
    } catch (error) {
      console.warn('Failed to load persistent cache:', error);
    }
  }

  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    this.cache.clear();
  }
}

export const CacheKeys = {
  analytics: (userId: string, timeframe: string) => `analytics_${userId}_${timeframe}`,
  habits: (userId: string) => `habits_${userId}`,
  moodData: (userId: string, timeframe: string) => `mood_data_${userId}_${timeframe}`,
  wellnessData: (userId: string, timeframe: string) => `wellness_data_${userId}_${timeframe}`,
  professionalDashboard: (userId: string, clientId: string) => `professional_dashboard_${userId}_${clientId}`,
  coachingSession: (userId: string, sessionType: string) => `coaching_session_${userId}_${sessionType}`,
  aiSuggestions: (userId: string, type: string) => `ai_suggestions_${userId}_${type}`,
  userPreferences: (userId: string) => `user_preferences_${userId}`,
};

export const CacheExpiry = {
  SHORT: 1 * 60 * 1000,
  MEDIUM: 5 * 60 * 1000,
  LONG: 15 * 60 * 1000,
  VERY_LONG: 60 * 60 * 1000,
  DAY: 24 * 60 * 60 * 1000,
};
