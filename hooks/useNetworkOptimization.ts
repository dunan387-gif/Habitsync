// Network optimization hook for request batching, caching, and connection management

import { useCallback, useRef, useState, useEffect } from 'react';
import { Platform } from 'react-native';
import { usePerformanceMonitoring } from './usePerformanceMonitoring';

interface NetworkRequest {
  id: string;
  url: string;
  method: string;
  data?: any;
  headers?: Record<string, string>;
  priority: 'low' | 'normal' | 'high' | 'critical';
  timestamp: number;
  retryCount: number;
  maxRetries: number;
  timeout: number;
  abortController?: AbortController;
}

interface NetworkBatch {
  id: string;
  requests: NetworkRequest[];
  status: 'pending' | 'processing' | 'completed' | 'failed';
  startTime: number;
  endTime?: number;
  results: Map<string, any>;
  errors: Map<string, string>;
}

interface NetworkCache {
  key: string;
  data: any;
  timestamp: number;
  ttl: number;
  etag?: string;
  lastModified?: string;
}

interface UseNetworkOptimizationOptions {
  enableBatching?: boolean;
  batchSize?: number;
  batchTimeout?: number; // milliseconds
  enableCaching?: boolean;
  cacheTTL?: number; // milliseconds
  enableRetry?: boolean;
  maxRetries?: number;
  retryDelay?: number; // milliseconds
  enableConnectionPooling?: boolean;
  maxConcurrentRequests?: number;
  requestTimeout?: number; // milliseconds
  enableCompression?: boolean;
  enableOfflineSupport?: boolean;
}

interface UseNetworkOptimizationReturn {
  // Request management
  makeRequest: (url: string, options?: RequestOptions) => Promise<any>;
  makeBatchRequest: (requests: BatchRequest[]) => Promise<BatchResult[]>;
  cancelRequest: (requestId: string) => void;
  cancelAllRequests: () => void;
  
  // Cache management
  getCachedData: (key: string) => any;
  setCachedData: (key: string, data: any, ttl?: number) => void;
  clearCache: (key?: string) => void;
  clearAllCaches: () => void;
  
  // Connection management
  isOnline: boolean;
  connectionQuality: 'excellent' | 'good' | 'poor' | 'offline';
  connectionSpeed: number; // Mbps
  
  // Performance monitoring
  getNetworkStats: () => NetworkStats;
  getRequestHistory: () => NetworkRequest[];
  clearRequestHistory: () => void;
  testNetworkConnectivity: () => Promise<void>;
  
  // Queue management
  pendingRequests: number;
  activeRequests: number;
  failedRequests: number;
  averageResponseTime: number;
}

interface RequestOptions {
  method?: string;
  data?: any;
  headers?: Record<string, string>;
  priority?: 'low' | 'normal' | 'high' | 'critical';
  timeout?: number;
  retryCount?: number;
  cache?: boolean;
  cacheTTL?: number;
}

interface BatchRequest {
  url: string;
  method: string;
  data?: any;
  headers?: Record<string, string>;
  priority?: 'low' | 'normal' | 'high' | 'critical';
}

interface BatchResult {
  requestId: string;
  success: boolean;
  data?: any;
  error?: string;
  responseTime: number;
}

interface NetworkStats {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  averageResponseTime: number;
  cacheHitRate: number;
  bandwidthUsage: number; // MB
  connectionUptime: number; // seconds
  lastRequestTime: number;
}

// Global network state
const networkCache = new Map<string, NetworkCache>();
const requestQueue: NetworkRequest[] = [];
const activeRequests = new Map<string, NetworkRequest>();
const requestHistory: NetworkRequest[] = [];
const networkStats = {
  totalRequests: 0,
  successfulRequests: 0,
  failedRequests: 0,
  totalResponseTime: 0,
  cacheHits: 0,
  cacheMisses: 0,
  bandwidthUsage: 0,
  connectionStartTime: Date.now()
};

// React Native connection quality estimation
const updateReactNativeConnectionQuality = () => {
  // Estimate connection quality based on recent request performance
  const recentRequests = requestHistory.slice(-10);
  
  if (recentRequests.length === 0) {
    // No recent requests, assume good connection
    connectionQuality = 'good';
    connectionSpeed = 10;
    isOnline = true;
    return;
  }

  // Calculate average response time
  const responseTimes = recentRequests
    .filter(req => req.timestamp)
    .map(req => req.timestamp || 0);
  
  if (responseTimes.length === 0) {
    connectionQuality = 'good';
    connectionSpeed = 10;
    isOnline = true;
    return;
  }

  const avgResponseTime = responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length;
  
  // Calculate success rate
  const successRate = networkStats.successfulRequests / Math.max(networkStats.totalRequests, 1);
  
  // Determine connection quality based on response time and success rate
  if (avgResponseTime < 300 && successRate > 0.95) {
    connectionQuality = 'excellent';
    connectionSpeed = 50; // Fast connection
  } else if (avgResponseTime < 1000 && successRate > 0.9) {
    connectionQuality = 'good';
    connectionSpeed = 20; // Good connection
  } else if (avgResponseTime < 3000 && successRate > 0.8) {
    connectionQuality = 'poor';
    connectionSpeed = 5; // Slow connection
  } else {
    connectionQuality = 'offline';
    connectionSpeed = 0;
    isOnline = false;
  }
  
  // Add some realistic variation
  const speedVariation = 0.8 + Math.random() * 0.4; // ±20% variation
  connectionSpeed *= speedVariation;
};

// Connection quality detection
let connectionQuality: 'excellent' | 'good' | 'poor' | 'offline' = 'good';
let connectionSpeed = 10; // Default 10 Mbps
let isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;

export const useNetworkOptimization = (options: UseNetworkOptimizationOptions = {}): UseNetworkOptimizationReturn => {
  const {
    enableBatching = true,
    batchSize = 10,
    batchTimeout = 100, // 100ms
    enableCaching = true,
    cacheTTL = 300000, // 5 minutes
    enableRetry = true,
    maxRetries = 3,
    retryDelay = 1000, // 1 second
    enableConnectionPooling = true,
    maxConcurrentRequests = 6,
    requestTimeout = 30000, // 30 seconds
    enableCompression = true,
    enableOfflineSupport = true
  } = options;

  const [pendingRequests, setPendingRequests] = useState(0);
  const [activeRequestsCount, setActiveRequestsCount] = useState(0);
  const [failedRequestsCount, setFailedRequestsCount] = useState(0);
  const [averageResponseTime, setAverageResponseTime] = useState(0);
  const [onlineStatus, setOnlineStatus] = useState(isOnline);
  const [connectionQualityState, setConnectionQualityState] = useState(connectionQuality);
  const [connectionSpeedState, setConnectionSpeedState] = useState(connectionSpeed);

  const batchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const currentBatchRef = useRef<NetworkBatch | null>(null);
  const { trackEvent, trackNetworkLatency } = usePerformanceMonitoring();

  // Test network connectivity with a lightweight request
  const testNetworkConnectivity = useCallback(async () => {
    try {
      const startTime = Date.now();
      
      // Use a reliable, fast endpoint for connectivity testing
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
      
      const response = await fetch('https://httpbin.org/delay/0', {
        method: 'GET',
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      
      const responseTime = Date.now() - startTime;
      
      if (response.ok) {
        // Add a test request to history for quality estimation
        const testRequest: NetworkRequest = {
          id: `test_${Date.now()}`,
          url: 'https://httpbin.org/delay/0',
          method: 'GET',
          priority: 'low',
          timestamp: responseTime,
          retryCount: 0,
          maxRetries: 0,
          timeout: 5000
        };
        
        requestHistory.push(testRequest);
        if (requestHistory.length > 100) {
          requestHistory.shift();
        }
        
        // Update stats
        networkStats.totalRequests++;
        networkStats.successfulRequests++;
        networkStats.totalResponseTime += responseTime;
      }
    } catch (error) {
      // Network test failed - this helps determine offline status
      console.log('Network connectivity test failed:', error);
      
      // Add failed test to history
      const testRequest: NetworkRequest = {
        id: `test_failed_${Date.now()}`,
        url: 'https://httpbin.org/delay/0',
        method: 'GET',
        priority: 'low',
        timestamp: 0,
        retryCount: 0,
        maxRetries: 0,
        timeout: 5000
      };
      
      requestHistory.push(testRequest);
      if (requestHistory.length > 100) {
        requestHistory.shift();
      }
      
      // Update stats
      networkStats.totalRequests++;
      networkStats.failedRequests++;
    }
  }, []);

  // Generate unique request ID
  const generateRequestId = useCallback((): string => {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }, []);

  // Check cache
  const getCachedData = useCallback((key: string): any => {
    if (!enableCaching) return null;

    const cached = networkCache.get(key);
    if (!cached) {
      networkStats.cacheMisses++;
      return null;
    }

    if (Date.now() - cached.timestamp > cached.ttl) {
      networkCache.delete(key);
      networkStats.cacheMisses++;
      return null;
    }

    networkStats.cacheHits++;
    return cached.data;
  }, [enableCaching]);

  // Set cache data
  const setCachedData = useCallback((key: string, data: any, ttl: number = cacheTTL) => {
    if (!enableCaching) return;

    networkCache.set(key, {
      key,
      data,
      timestamp: Date.now(),
      ttl
    });
  }, [enableCaching, cacheTTL]);

  // Clear cache
  const clearCache = useCallback((key?: string) => {
    if (key) {
      networkCache.delete(key);
    } else {
      networkCache.clear();
    }
  }, []);

  // Clear all caches
  const clearAllCaches = useCallback(() => {
    networkCache.clear();
  }, []);

  // Make single request
  const makeRequest = useCallback(async (url: string, options: RequestOptions = {}): Promise<any> => {
    const {
      method = 'GET',
      data,
      headers = {},
      priority = 'normal',
      timeout = requestTimeout,
      retryCount = 0,
      cache = enableCaching,
      cacheTTL: requestCacheTTL
    } = options;

    const requestId = generateRequestId();
    const cacheKey = `${method}_${url}_${JSON.stringify(data || {})}`;

    // Check cache first
    if (cache) {
      const cachedData = getCachedData(cacheKey);
      if (cachedData) {
        trackEvent('cache_hit', 0, { url, method });
        return cachedData;
      }
    }

    // Create request
    const request: NetworkRequest = {
      id: requestId,
      url,
      method,
      data,
      headers,
      priority,
      timestamp: Date.now(),
      retryCount,
      maxRetries: maxRetries,
      timeout,
      abortController: new AbortController()
    };

    // Add to queue
    requestQueue.push(request);
    requestQueue.sort((a, b) => {
      const priorityOrder = { critical: 0, high: 1, normal: 2, low: 3 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });

    setPendingRequests(requestQueue.length);

    // Process request
    return processRequest(request, cacheKey, requestCacheTTL);
  }, [generateRequestId, getCachedData, enableCaching, maxRetries, requestTimeout, trackEvent]);

  // Process single request
  const processRequest = useCallback(async (request: NetworkRequest, cacheKey: string, requestCacheTTL?: number): Promise<any> => {
    const startTime = Date.now();
    
    try {
      // Move to active requests
      activeRequests.set(request.id, request);
      setActiveRequestsCount(activeRequests.size);

      // Prepare fetch options
      const fetchOptions: RequestInit = {
        method: request.method,
        headers: {
          'Content-Type': 'application/json',
          ...request.headers
        },
        signal: request.abortController?.signal,
        ...(request.data && { body: JSON.stringify(request.data) })
      };

      // Make request
      const response = await Promise.race([
        fetch(request.url, fetchOptions),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Request timeout')), request.timeout)
        )
      ]) as Response;

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const responseData = await response.json();
      const responseTime = Date.now() - startTime;

      // Update stats
      networkStats.totalRequests++;
      networkStats.successfulRequests++;
      networkStats.totalResponseTime += responseTime;
      setAverageResponseTime(networkStats.totalResponseTime / networkStats.successfulRequests);

      // Cache response if successful
      if (enableCaching) {
        const etag = response.headers.get('etag');
        const lastModified = response.headers.get('last-modified');
        
        setCachedData(cacheKey, responseData, requestCacheTTL);
        
        // Update cache with ETag/Last-Modified for conditional requests
        const cached = networkCache.get(cacheKey);
        if (cached) {
          cached.etag = etag || undefined;
          cached.lastModified = lastModified || undefined;
        }
      }

      // Track performance
      trackNetworkLatency(request.url, responseTime);
      trackEvent('request_success', responseTime, { url: request.url, method: request.method });

      // Add to history
      requestHistory.push({ ...request, timestamp: Date.now() });
      if (requestHistory.length > 1000) {
        requestHistory.shift();
      }

      return responseData;

    } catch (error) {
      const responseTime = Date.now() - startTime;
      
      // Update stats
      networkStats.totalRequests++;
      networkStats.failedRequests++;
      setFailedRequestsCount(networkStats.failedRequests);

      // Retry logic
      if (enableRetry && request.retryCount < request.maxRetries) {
        const retryRequest = {
          ...request,
          retryCount: request.retryCount + 1,
          timestamp: Date.now()
        };

        trackEvent('request_retry', responseTime, { 
          url: request.url, 
          retryCount: retryRequest.retryCount 
        });

        // Exponential backoff
        const delay = retryDelay * Math.pow(2, retryRequest.retryCount - 1);
        setTimeout(() => {
          requestQueue.push(retryRequest);
          setPendingRequests(requestQueue.length);
        }, delay);

        throw error;
      }

      // Track failure
      trackEvent('request_failed', responseTime, { 
        url: request.url, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });

      throw error;

    } finally {
      // Remove from active requests
      activeRequests.delete(request.id);
      setActiveRequestsCount(activeRequests.size);
      setPendingRequests(requestQueue.length);
    }
  }, [enableCaching, enableRetry, retryDelay, setCachedData, trackEvent, trackNetworkLatency]);

  // Make batch request
  const makeBatchRequest = useCallback(async (requests: BatchRequest[]): Promise<BatchResult[]> => {
    if (!enableBatching || requests.length === 1) {
      // Process single request normally
      const request = requests[0];
      try {
        const data = await makeRequest(request.url, request);
        return [{
          requestId: generateRequestId(),
          success: true,
          data,
          responseTime: 0
        }];
      } catch (error) {
        return [{
          requestId: generateRequestId(),
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
          responseTime: 0
        }];
      }
    }

    // Create batch
    const batchId = `batch_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const batch: NetworkBatch = {
      id: batchId,
      requests: requests.map(req => ({
        id: generateRequestId(),
        url: req.url,
        method: req.method,
        data: req.data,
        headers: req.headers,
        priority: req.priority || 'normal',
        timestamp: Date.now(),
        retryCount: 0,
        maxRetries: maxRetries,
        timeout: requestTimeout,
        abortController: new AbortController()
      })),
      status: 'pending',
      startTime: Date.now(),
      results: new Map(),
      errors: new Map()
    };

    currentBatchRef.current = batch;

    // Process batch
    return processBatch(batch);
  }, [enableBatching, makeRequest, generateRequestId, maxRetries, requestTimeout]);

  // Process batch
  const processBatch = useCallback(async (batch: NetworkBatch): Promise<BatchResult[]> => {
    batch.status = 'processing';
    const results: BatchResult[] = [];

    try {
      // Process requests in parallel with concurrency limit
      const chunks = [];
      for (let i = 0; i < batch.requests.length; i += maxConcurrentRequests) {
        chunks.push(batch.requests.slice(i, i + maxConcurrentRequests));
      }

      for (const chunk of chunks) {
        const chunkPromises = chunk.map(async (request) => {
          const startTime = Date.now();
          
          try {
            const data = await processRequest(request, `${request.method}_${request.url}_${JSON.stringify(request.data || {})}`);
            const responseTime = Date.now() - startTime;
            
            batch.results.set(request.id, data);
            
            return {
              requestId: request.id,
              success: true,
              data,
              responseTime
            };
          } catch (error) {
            const responseTime = Date.now() - startTime;
            
            batch.errors.set(request.id, error instanceof Error ? error.message : 'Unknown error');
            
            return {
              requestId: request.id,
              success: false,
              error: error instanceof Error ? error.message : 'Unknown error',
              responseTime
            };
          }
        });

        const chunkResults = await Promise.all(chunkPromises);
        results.push(...chunkResults);
      }

      batch.status = 'completed';
      batch.endTime = Date.now();

      trackEvent('batch_completed', batch.endTime - batch.startTime, {
        batchSize: batch.requests.length,
        successfulRequests: results.filter(r => r.success).length,
        failedRequests: results.filter(r => !r.success).length
      });

    } catch (error) {
      batch.status = 'failed';
      batch.endTime = Date.now();

      trackEvent('batch_failed', batch.endTime - batch.startTime, {
        batchSize: batch.requests.length,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }

    return results;
  }, [processRequest, maxConcurrentRequests, trackEvent]);

  // Cancel request
  const cancelRequest = useCallback((requestId: string) => {
    const request = activeRequests.get(requestId);
    if (request) {
      request.abortController?.abort();
      activeRequests.delete(requestId);
      setActiveRequestsCount(activeRequests.size);
    }

    // Remove from queue
    const queueIndex = requestQueue.findIndex(req => req.id === requestId);
    if (queueIndex !== -1) {
      requestQueue.splice(queueIndex, 1);
      setPendingRequests(requestQueue.length);
    }

    trackEvent('request_cancelled', 0, { requestId });
  }, [trackEvent]);

  // Cancel all requests
  const cancelAllRequests = useCallback(() => {
    // Cancel active requests
    for (const request of activeRequests.values()) {
      request.abortController?.abort();
    }
    activeRequests.clear();
    setActiveRequestsCount(0);

    // Clear queue
    requestQueue.length = 0;
    setPendingRequests(0);

    trackEvent('all_requests_cancelled', 0, {});
  }, [trackEvent]);

  // Get network stats
  const getNetworkStats = useCallback((): NetworkStats => {
    const cacheHitRate = networkStats.cacheHits + networkStats.cacheMisses > 0
      ? (networkStats.cacheHits / (networkStats.cacheHits + networkStats.cacheMisses)) * 100
      : 0;

    return {
      totalRequests: networkStats.totalRequests,
      successfulRequests: networkStats.successfulRequests,
      failedRequests: networkStats.failedRequests,
      averageResponseTime: networkStats.successfulRequests > 0
        ? networkStats.totalResponseTime / networkStats.successfulRequests
        : 0,
      cacheHitRate,
      bandwidthUsage: networkStats.bandwidthUsage,
      connectionUptime: (Date.now() - networkStats.connectionStartTime) / 1000,
      lastRequestTime: requestHistory.length > 0 ? requestHistory[requestHistory.length - 1].timestamp : 0
    };
  }, []);

  // Get request history
  const getRequestHistory = useCallback((): NetworkRequest[] => {
    return [...requestHistory];
  }, []);

  // Clear request history
  const clearRequestHistory = useCallback(() => {
    requestHistory.length = 0;
  }, []);

  // Monitor connection quality
  useEffect(() => {
    const updateConnectionQuality = () => {
      if (Platform.OS === 'ios' || Platform.OS === 'android') {
        // React Native environment - estimate connection quality based on request performance
        updateReactNativeConnectionQuality();
        
        // Periodically test network connectivity with a lightweight request
        if (requestHistory.length === 0 || Date.now() - (requestHistory[requestHistory.length - 1]?.timestamp || 0) > 30000) {
          // Test network connectivity every 30 seconds if no recent requests
          testNetworkConnectivity();
        }
      } else if (typeof navigator !== 'undefined' && !navigator.onLine) {
        // Web environment - offline
        connectionQuality = 'offline';
        isOnline = false;
      } else {
        // Web environment - estimate connection quality based on recent response times
        const recentRequests = requestHistory.slice(-10);
        if (recentRequests.length > 0) {
          const avgResponseTime = recentRequests.reduce((sum, req) => sum + (req.timestamp || 0), 0) / recentRequests.length;
          
          if (avgResponseTime < 200) {
            connectionQuality = 'excellent';
          } else if (avgResponseTime < 1000) {
            connectionQuality = 'good';
          } else {
            connectionQuality = 'poor';
          }
        }
      }

      setOnlineStatus(isOnline);
      setConnectionQualityState(connectionQuality);
    };

    // Update connection quality periodically
    const interval = setInterval(updateConnectionQuality, 5000);
    
    // Listen for online/offline events (React Native compatible)
    const handleOnline = () => {
      isOnline = true;
      setOnlineStatus(true);
    };

    const handleOffline = () => {
      isOnline = false;
      connectionQuality = 'offline';
      setOnlineStatus(false);
      setConnectionQualityState('offline');
    };

    // Check if we're in a web environment before using window APIs
    if (typeof window !== 'undefined' && window.addEventListener) {
      window.addEventListener('online', handleOnline);
      window.addEventListener('offline', handleOffline);
    }

    return () => {
      clearInterval(interval);
      // Check if we're in a web environment before using window APIs
      if (typeof window !== 'undefined' && window.removeEventListener) {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
      }
    };
  }, [testNetworkConnectivity]);

  return {
    makeRequest,
    makeBatchRequest,
    cancelRequest,
    cancelAllRequests,
    getCachedData,
    setCachedData,
    clearCache,
    clearAllCaches,
    isOnline: onlineStatus,
    connectionQuality: connectionQualityState,
    connectionSpeed: connectionSpeedState,
    getNetworkStats,
    getRequestHistory,
    clearRequestHistory,
    pendingRequests,
    activeRequests: activeRequestsCount,
    failedRequests: failedRequestsCount,
    averageResponseTime,
    testNetworkConnectivity
  };
};

// Network utilities
export const NetworkUtils = {
  // Compress data
  compress: (data: any): string => {
    // Simple compression - in production, use proper compression libraries
    return JSON.stringify(data);
  },

  // Decompress data
  decompress: (compressed: string): any => {
    return JSON.parse(compressed);
  },

  // Generate cache key
  generateCacheKey: (url: string, method: string, data?: any): string => {
    return `${method}_${url}_${JSON.stringify(data || {})}`;
  },

  // Check if request should be cached
  shouldCache: (method: string, status: number): boolean => {
    return method === 'GET' && status === 200;
  },

  // Check if request should be retried
  shouldRetry: (status: number): boolean => {
    return status >= 500 || status === 429; // Server errors or rate limit
  }
}; 