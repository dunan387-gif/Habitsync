import { useCallback, useEffect, useRef } from 'react';
import { CacheService, CacheKeys, CacheExpiry, CacheKey } from '../services/CacheService';
import { useAuth } from '../context/AuthContext';

export interface UseCacheOptions {
  expiry?: number;
  enabled?: boolean;
  dependencies?: any[];
}

export function useCache() {
  const cacheService = useRef(CacheService.getInstance());
  const { user } = useAuth();

  const get = useCallback(async <T>(key: CacheKey): Promise<T | null> => {
    return await cacheService.current.get<T>(key);
  }, []);

  const set = useCallback(async <T>(
    key: CacheKey, 
    data: T, 
    expiry?: number,
    metadata?: any
  ): Promise<void> => {
    await cacheService.current.set(key, data, expiry, {
      userId: user?.id,
      ...metadata
    });
  }, [user?.id]);

  const getOrSet = useCallback(async <T>(
    key: CacheKey,
    fallback: () => Promise<T>,
    expiry?: number,
    metadata?: any
  ): Promise<T> => {
    return await cacheService.current.getOrSet(key, fallback, expiry, {
      userId: user?.id,
      ...metadata
    });
  }, [user?.id]);

  const has = useCallback((key: CacheKey): boolean => {
    return cacheService.current.has(key);
  }, []);

  const deleteKey = useCallback((key: CacheKey): boolean => {
    return cacheService.current.delete(key);
  }, []);

  const clearByPattern = useCallback(async (pattern: RegExp): Promise<void> => {
    await cacheService.current.clearByPattern(pattern);
  }, []);

  const clearByUser = useCallback(async (userId: string): Promise<void> => {
    await cacheService.current.clearByUser(userId);
  }, []);

  const getStats = useCallback(() => {
    return cacheService.current.getStats();
  }, []);

  const getHitRate = useCallback(() => {
    return cacheService.current.getHitRate();
  }, []);

  return {
    get,
    set,
    getOrSet,
    has,
    delete: deleteKey,
    clearByPattern,
    clearByUser,
    getStats,
    getHitRate,
    CacheKeys,
    CacheExpiry
  };
}

export function useCachedData<T>(
  key: CacheKey,
  fetcher: () => Promise<T>,
  options: UseCacheOptions = {}
) {
  const { getOrSet, get } = useCache();
  const { expiry = CacheExpiry.MEDIUM, enabled = true, dependencies = [] } = options;
  const dataRef = useRef<T | null>(null);
  const loadingRef = useRef(false);
  const errorRef = useRef<Error | null>(null);

  const fetchData = useCallback(async () => {
    if (!enabled) return;

    try {
      loadingRef.current = true;
      errorRef.current = null;

      const cachedData = await get<T>(key);
      if (cachedData !== null) {
        dataRef.current = cachedData;
        return;
      }

      const freshData = await fetcher();
      await getOrSet(key, () => Promise.resolve(freshData), expiry);
      dataRef.current = freshData;
    } catch (error) {
      errorRef.current = error as Error;
    } finally {
      loadingRef.current = false;
    }
  }, [key, fetcher, expiry, enabled, get, getOrSet, ...dependencies]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    data: dataRef.current,
    loading: loadingRef.current,
    error: errorRef.current,
    refetch: fetchData
  };
}

export function useCachedCallback<T extends (...args: any[]) => Promise<any>>(
  callback: T,
  keyGenerator: (...args: Parameters<T>) => CacheKey,
  options: UseCacheOptions = {}
): T {
  const { getOrSet } = useCache();
  const { expiry = CacheExpiry.SHORT, dependencies = [] } = options;

  const cachedCallback = useCallback(async (...args: Parameters<T>): Promise<ReturnType<T>> => {
    const key = keyGenerator(...args);
    return await getOrSet(
      key,
      () => callback(...args),
      expiry
    );
  }, [callback, keyGenerator, getOrSet, expiry, ...dependencies]);

  return cachedCallback as T;
}
