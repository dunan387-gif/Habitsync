import { CacheService, CacheKeys, CacheExpiry, CacheKey } from './CacheService';

export interface CachedServiceConfig {
  defaultExpiry?: number;
  enableCaching?: boolean;
  serviceName: string;
}

export abstract class CachedService {
  protected cacheService: CacheService;
  protected config: CachedServiceConfig;

  constructor(config: CachedServiceConfig) {
    this.config = {
      defaultExpiry: CacheExpiry.MEDIUM,
      enableCaching: true,
      ...config
    };
    this.cacheService = CacheService.getInstance();
  }

  /**
   * Cache a method call with automatic key generation
   */
  protected async cachedCall<T>(
    methodName: string,
    params: any[],
    fallback: () => Promise<T>,
    expiry?: number
  ): Promise<T> {
    if (!this.config.enableCaching) {
      return await fallback();
    }

    const cacheKey = this.generateCacheKey(methodName, params);
    const finalExpiry = expiry || this.config.defaultExpiry || CacheExpiry.MEDIUM;

    return await this.cacheService.getOrSet(
      cacheKey,
      fallback,
      finalExpiry,
      {
        source: `${this.config.serviceName}.${methodName}`,
        params
      }
    );
  }

  /**
   * Generate a cache key for a method call
   */
  protected generateCacheKey(methodName: string, params: any[]): CacheKey {
    const paramString = params.map(p => 
      typeof p === 'object' ? JSON.stringify(p) : String(p)
    ).join('_');
    
    return `${this.config.serviceName}_${methodName}_${paramString}`;
  }

  /**
   * Clear cache for this service
   */
  protected async clearServiceCache(): Promise<void> {
    const pattern = new RegExp(`^${this.config.serviceName}_`);
    await this.cacheService.clearByPattern(pattern);
  }

  /**
   * Clear cache for a specific method
   */
  protected async clearMethodCache(methodName: string): Promise<void> {
    const pattern = new RegExp(`^${this.config.serviceName}_${methodName}_`);
    await this.cacheService.clearByPattern(pattern);
  }

  /**
   * Get cache statistics for this service
   */
  protected getServiceCacheStats() {
    return this.cacheService.getStats();
  }

  /**
   * Check if a method result is cached
   */
  protected isCached(methodName: string, params: any[]): boolean {
    const cacheKey = this.generateCacheKey(methodName, params);
    return this.cacheService.has(cacheKey);
  }

  /**
   * Preload cache with data
   */
  protected async preloadCache<T>(
    methodName: string,
    paramsList: any[][],
    dataLoader: (params: any[]) => Promise<T>
  ): Promise<void> {
    const promises = paramsList.map(async (params) => {
      try {
        await this.cachedCall(methodName, params, () => dataLoader(params));
      } catch (error) {
        console.warn(`Failed to preload cache for ${methodName}:`, error);
      }
    });

    await Promise.all(promises);
  }
}

// Note: Decorators have been removed due to TypeScript compatibility issues.
// Use the cachedCall method instead for caching functionality.
// Example usage:
// return await this.cachedCall('methodName', [param1, param2], async () => {
//   // Your method logic here
//   return result;
// }, CacheExpiry.SHORT);
