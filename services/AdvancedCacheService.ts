import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { dataPersistenceService } from './DataPersistenceService';

interface CacheEntry<T = any> {
  data: T | null; // Allow null for compressed data
  timestamp: number;
  ttl: number; // Time to live in milliseconds
  size: number; // Size in bytes
  accessCount: number;
  lastAccessed: number;
  compressed?: boolean;
  version?: string; // For cache invalidation
}

interface CacheConfig {
  maxSize: number; // Maximum cache size in bytes
  maxAge: number; // Default TTL in milliseconds
  compressionThreshold: number; // Size threshold for compression
  enableCompression: boolean;
  enableLRU: boolean; // Least Recently Used eviction
  enableVersioning: boolean;
  cacheVersion: string;
}

interface CacheStats {
  totalEntries: number;
  totalSize: number;
  hitRate: number;
  missRate: number;
  evictions: number;
  compressions: number;
  averageAccessTime: number;
}

class AdvancedCacheService {
  private static instance: AdvancedCacheService;
  private cache: Map<string, CacheEntry> = new Map();
  private config: CacheConfig;
  private stats: {
    hits: number;
    misses: number;
    evictions: number;
    compressions: number;
    totalAccessTime: number;
    accessCount: number;
  };

  private constructor() {
    this.config = {
      maxSize: 50 * 1024 * 1024, // 50MB default
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
      compressionThreshold: 1024, // 1KB
      enableCompression: true,
      enableLRU: true,
      enableVersioning: true,
      cacheVersion: '1.0.0',
    };

    this.stats = {
      hits: 0,
      misses: 0,
      evictions: 0,
      compressions: 0,
      totalAccessTime: 0,
      accessCount: 0,
    };

    this.initializeCache();
  }

  static getInstance(): AdvancedCacheService {
    if (!AdvancedCacheService.instance) {
      AdvancedCacheService.instance = new AdvancedCacheService();
    }
    return AdvancedCacheService.instance;
  }

  configure(config: Partial<CacheConfig>): void {
    this.config = { ...this.config, ...config };
  }

  private async initializeCache(): Promise<void> {
    try {
      // Load cache from persistent storage
      const cachedData = await dataPersistenceService.get('advanced_cache');
      if (cachedData) {
        const parsed = JSON.parse(cachedData);
        if (parsed.version === this.config.cacheVersion) {
          this.cache = new Map(parsed.entries);
          this.stats = parsed.stats;
        }
      }

      // Clean up expired entries
      this.cleanupExpiredEntries();
    } catch (error) {
      console.warn('Failed to initialize cache:', error);
    }
  }

  private async persistCache(): Promise<void> {
    try {
      const cacheData = {
        version: this.config.cacheVersion,
        entries: Array.from(this.cache.entries()),
        stats: this.stats,
      };
      await dataPersistenceService.set('advanced_cache', JSON.stringify(cacheData));
    } catch (error) {
      console.warn('Failed to persist cache:', error);
    }
  }

  private compressData(data: any): string {
    if (!this.config.enableCompression) {
      return JSON.stringify(data);
    }

    try {
      // Simple compression for small data
      const jsonString = JSON.stringify(data);
      if (jsonString.length < this.config.compressionThreshold) {
        return jsonString;
      }

      // Use a simple compression algorithm for larger data
      const compressed = this.simpleCompress(jsonString);
      this.stats.compressions++;
      return compressed;
    } catch (error) {
      console.warn('Compression failed, using uncompressed data:', error);
      return JSON.stringify(data);
    }
  }

  private decompressData(compressedData: string, compressed: boolean): any {
    if (!compressed) {
      return JSON.parse(compressedData);
    }

    try {
      const decompressed = this.simpleDecompress(compressedData);
      return JSON.parse(decompressed);
    } catch (error) {
      console.warn('Decompression failed:', error);
      return null;
    }
  }

  private simpleCompress(data: string): string {
    // Simple run-length encoding for demonstration
    // In production, consider using a proper compression library
    let compressed = '';
    let count = 1;
    let current = data[0];

    for (let i = 1; i < data.length; i++) {
      if (data[i] === current && count < 9) {
        count++;
      } else {
        compressed += count + current;
        count = 1;
        current = data[i];
      }
    }
    compressed += count + current;

    return compressed.length < data.length ? compressed : data;
  }

  private simpleDecompress(compressed: string): string {
    // Simple run-length decoding
    let decompressed = '';
    for (let i = 0; i < compressed.length; i += 2) {
      const count = parseInt(compressed[i]);
      const char = compressed[i + 1];
      decompressed += char.repeat(count);
    }
    return decompressed;
  }

  private calculateSize(data: any): number {
    return new Blob([JSON.stringify(data)]).size;
  }

  private async evictLRU(): Promise<void> {
    if (!this.config.enableLRU) return;

    const entries = Array.from(this.cache.entries());
    entries.sort((a, b) => a[1].lastAccessed - b[1].lastAccessed);

    let currentSize = this.getCurrentSize();
    const targetSize = this.config.maxSize * 0.8; // Evict to 80% of max size

    for (const [key, entry] of entries) {
      if (currentSize <= targetSize) break;

      this.cache.delete(key);
      currentSize -= entry.size;
      this.stats.evictions++;
    }
  }

  private getCurrentSize(): number {
    let totalSize = 0;
    for (const entry of this.cache.values()) {
      totalSize += entry.size;
    }
    return totalSize;
  }

  private cleanupExpiredEntries(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        this.cache.delete(key);
      }
    }
  }

  async set<T>(key: string, data: T, ttl?: number): Promise<void> {
    const startTime = Date.now();
    
    try {
      // Check if we need to evict entries
      const dataSize = this.calculateSize(data);
      if (this.getCurrentSize() + dataSize > this.config.maxSize) {
        await this.evictLRU();
      }

      const compressed = dataSize > this.config.compressionThreshold;
      const compressedData = compressed ? this.compressData(data) : JSON.stringify(data);

      const entry: CacheEntry<T> = {
        data: compressed ? null : data, // Don't store uncompressed data in memory
        timestamp: Date.now(),
        ttl: ttl || this.config.maxAge,
        size: dataSize,
        accessCount: 0,
        lastAccessed: Date.now(),
        compressed,
        version: this.config.cacheVersion,
      };

      this.cache.set(key, entry);

      // Store compressed data separately for memory efficiency
      if (compressed) {
        await dataPersistenceService.set(`cache_compressed_${key}`, compressedData);
      }

      // Persist cache metadata
      await this.persistCache();
    } catch (error) {
      console.error('Failed to set cache entry:', error);
    }
  }

  async get<T>(key: string): Promise<T | null> {
    const startTime = Date.now();
    
    try {
      const entry = this.cache.get(key);
      if (!entry) {
        this.stats.misses++;
        return null;
      }

      // Check if expired
      if (Date.now() - entry.timestamp > entry.ttl) {
        this.cache.delete(key);
        this.stats.misses++;
        return null;
      }

      // Update access statistics
      entry.accessCount++;
      entry.lastAccessed = Date.now();
      this.stats.hits++;
      this.stats.accessCount++;
      this.stats.totalAccessTime += Date.now() - startTime;

      // Handle compressed data
      if (entry.compressed) {
        const compressedData = await dataPersistenceService.get(`cache_compressed_${key}`);
        if (compressedData) {
          return this.decompressData(compressedData, true);
        }
        return null;
      }

      return entry.data;
    } catch (error) {
      console.error('Failed to get cache entry:', error);
      this.stats.misses++;
      return null;
    }
  }

  async has(key: string): Promise<boolean> {
    const entry = this.cache.get(key);
    if (!entry) return false;
    
    return Date.now() - entry.timestamp <= entry.ttl;
  }

  async delete(key: string): Promise<void> {
    const entry = this.cache.get(key);
    if (entry?.compressed) {
      await dataPersistenceService.remove(`cache_compressed_${key}`);
    }
    this.cache.delete(key);
  }

  async clear(): Promise<void> {
    // Clear all compressed data
    const keys = await dataPersistenceService.getAllKeys();
    const compressedKeys = keys.filter((key: string) => key.startsWith('cache_compressed_'));
    for (const key of compressedKeys) {
      await dataPersistenceService.remove(key);
    }
    
    this.cache.clear();
    await dataPersistenceService.remove('advanced_cache');
  }

  getStats(): CacheStats {
    const totalEntries = this.cache.size;
    const totalSize = this.getCurrentSize();
    const totalRequests = this.stats.hits + this.stats.misses;
    const hitRate = totalRequests > 0 ? this.stats.hits / totalRequests : 0;
    const missRate = totalRequests > 0 ? this.stats.misses / totalRequests : 0;
    const averageAccessTime = this.stats.accessCount > 0 
      ? this.stats.totalAccessTime / this.stats.accessCount 
      : 0;

    return {
      totalEntries,
      totalSize,
      hitRate,
      missRate,
      evictions: this.stats.evictions,
      compressions: this.stats.compressions,
      averageAccessTime,
    };
  }

  // Platform-specific optimizations
  optimizeForPlatform(): void {
    if (Platform.OS === 'android') {
      // Android-specific optimizations
      this.config.maxSize = 30 * 1024 * 1024; // Lower cache size for Android
      this.config.compressionThreshold = 512; // Lower compression threshold
    } else if (Platform.OS === 'ios') {
      // iOS-specific optimizations
      this.config.maxSize = 100 * 1024 * 1024; // Higher cache size for iOS
      this.config.compressionThreshold = 2048; // Higher compression threshold
    }
  }

  // Memory pressure handling
  handleMemoryPressure(): void {
    console.log('🔄 Handling memory pressure - clearing cache');
    this.clear();
  }
}

export default AdvancedCacheService;
