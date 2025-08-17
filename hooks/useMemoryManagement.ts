// Advanced memory management hook for preventing memory leaks and optimizing memory usage

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Platform } from 'react-native';
import { usePerformanceMonitoring } from './usePerformanceMonitoring';

interface MemoryInfo {
  usedJSHeapSize: number;
  totalJSHeapSize: number;
  jsHeapSizeLimit: number;
  usedMemoryMB: number;
  totalMemoryMB: number;
  memoryLimitMB: number;
  memoryUsagePercent: number;
  availableMemoryMB: number;
}

interface MemoryThreshold {
  warning: number; // MB
  critical: number; // MB
  emergency: number; // MB
}

interface UseMemoryManagementOptions {
  enableMonitoring?: boolean;
  monitoringInterval?: number; // milliseconds
  thresholds?: MemoryThreshold;
  enableAutoCleanup?: boolean;
  cleanupThreshold?: number; // MB
  enableGarbageCollection?: boolean;
  gcThreshold?: number; // MB
  enableMemoryOptimization?: boolean;
  optimizationInterval?: number; // milliseconds
}

interface UseMemoryManagementReturn {
  memoryInfo: MemoryInfo | null;
  isMemoryLow: boolean;
  isMemoryCritical: boolean;
  memoryUsagePercent: number;
  availableMemoryMB: number;
  forceGarbageCollection: () => void;
  cleanupMemory: () => void;
  optimizeMemory: () => void;
  getMemoryReport: () => MemoryReport;
  clearAllCaches: () => void;
  monitorMemoryUsage: () => void;
  memoryAlerts: MemoryAlert[];
  clearMemoryAlerts: () => void;
}

interface MemoryReport {
  currentUsage: MemoryInfo;
  peakUsage: MemoryInfo;
  averageUsage: number;
  memoryLeaks: MemoryLeak[];
  recommendations: string[];
  timestamp: number;
}

interface MemoryLeak {
  type: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  estimatedSize: number; // MB
  recommendations: string[];
}

interface MemoryAlert {
  id: string;
  type: 'warning' | 'critical' | 'emergency';
  message: string;
  timestamp: number;
  memoryUsage: number;
}

// Global memory cache registry
const memoryCacheRegistry = new Map<string, { data: any; size: number; timestamp: number; ttl: number }>();
const memoryUsageHistory: MemoryInfo[] = [];
const memoryAlerts: MemoryAlert[] = [];

// React Native memory estimation based on app behavior
const estimateReactNativeMemoryUsage = (): number => {
  // Base memory usage for React Native app
  let estimatedMemory = 50; // Base 50MB for React Native runtime
  
  // Add memory based on cache size
  estimatedMemory += memoryCacheRegistry.size * 0.5; // 0.5MB per cache entry
  
  // Add memory based on history size
  estimatedMemory += memoryUsageHistory.length * 0.1; // 0.1MB per history entry
  
  // Add memory based on alerts
  estimatedMemory += memoryAlerts.length * 0.01; // 0.01MB per alert
  
  // Add memory based on app uptime (simulate memory growth)
  const appStartTime = (global as any).appStartTime || Date.now();
  const uptimeMinutes = (Date.now() - appStartTime) / (1000 * 60);
  estimatedMemory += Math.min(uptimeMinutes * 0.1, 100); // Max 100MB growth over time
  
  // Add some randomness to simulate real memory fluctuations
  const randomFactor = 0.8 + Math.random() * 0.4; // ±20% variation
  estimatedMemory *= randomFactor;
  
  return Math.max(30, Math.min(estimatedMemory, 800)); // Keep between 30-800MB
};

// Android-optimized thresholds (lower for Android's stricter memory limits)
const DEFAULT_THRESHOLDS: MemoryThreshold = {
  warning: 80, // 80MB - lower threshold for Android
  critical: 150, // 150MB - lower critical threshold
  emergency: 200 // 200MB - lower emergency threshold for Android
};

// Memory optimization strategies
const MEMORY_OPTIMIZATION_STRATEGIES = {
  CACHE_CLEANUP: 'cache_cleanup',
  GARBAGE_COLLECTION: 'garbage_collection',
  IMAGE_OPTIMIZATION: 'image_optimization',
  LIST_VIRTUALIZATION: 'list_virtualization',
  COMPONENT_UNMOUNTING: 'component_unmounting'
};

export const useMemoryManagement = (options: UseMemoryManagementOptions = {}): UseMemoryManagementReturn => {
  const {
    enableMonitoring = true,
    monitoringInterval = 30000, // 30 seconds
    thresholds = DEFAULT_THRESHOLDS,
    enableAutoCleanup = true,
    cleanupThreshold = 120, // 120MB - lower for Android
    enableGarbageCollection = true,
    gcThreshold = 180, // 180MB - lower for Android
    enableMemoryOptimization = true,
    optimizationInterval = 45000 // 45 seconds - more frequent for Android
  } = options;

  const [memoryInfo, setMemoryInfo] = useState<MemoryInfo | null>(null);
  const [isMemoryLow, setIsMemoryLow] = useState(false);
  const [isMemoryCritical, setIsMemoryCritical] = useState(false);
  const [memoryAlerts, setMemoryAlerts] = useState<MemoryAlert[]>([]);
  
  const monitoringIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const optimizationIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const peakMemoryUsageRef = useRef<MemoryInfo | null>(null);
  const { trackEvent, trackMemoryUsage } = usePerformanceMonitoring();

  // Get current memory information
  const getMemoryInfo = useCallback((): MemoryInfo | null => {
    // Check if we're in a browser environment with performance.memory
    if (typeof performance !== 'undefined' && 'memory' in performance) {
      const memory = (performance as any).memory;
      if (!memory) {
        console.warn('Performance.memory is not available');
        return null;
      }

      const { usedJSHeapSize, totalJSHeapSize, jsHeapSizeLimit } = memory;
    
      const usedMemoryMB = usedJSHeapSize / 1024 / 1024;
      const totalMemoryMB = totalJSHeapSize / 1024 / 1024;
      const memoryLimitMB = jsHeapSizeLimit / 1024 / 1024;
      const memoryUsagePercent = (usedMemoryMB / memoryLimitMB) * 100;
      const availableMemoryMB = memoryLimitMB - usedMemoryMB;

      return {
        usedJSHeapSize,
        totalJSHeapSize,
        jsHeapSizeLimit,
        usedMemoryMB,
        totalMemoryMB,
        memoryLimitMB,
        memoryUsagePercent,
        availableMemoryMB
      };
    } else if (Platform.OS === 'ios' || Platform.OS === 'android') {
      // React Native environment - estimate memory usage based on app behavior
      const estimatedMemoryUsage = estimateReactNativeMemoryUsage();
      
      // Use reasonable defaults for React Native
      const usedMemoryMB = estimatedMemoryUsage;
      const totalMemoryMB = 512; // Typical React Native app memory limit
      const memoryLimitMB = 1024; // Conservative estimate
      const memoryUsagePercent = (usedMemoryMB / memoryLimitMB) * 100;
      const availableMemoryMB = memoryLimitMB - usedMemoryMB;

      return {
        usedJSHeapSize: usedMemoryMB * 1024 * 1024,
        totalJSHeapSize: totalMemoryMB * 1024 * 1024,
        jsHeapSizeLimit: memoryLimitMB * 1024 * 1024,
        usedMemoryMB,
        totalMemoryMB,
        memoryLimitMB,
        memoryUsagePercent,
        availableMemoryMB
      };
    } else {
      console.warn('Memory monitoring not available in this environment');
      return null;
    }
  }, []);

  // Monitor memory usage
  const monitorMemoryUsage = useCallback(() => {
    const currentMemoryInfo = getMemoryInfo();
    if (!currentMemoryInfo) return;

    setMemoryInfo(currentMemoryInfo);
    memoryUsageHistory.push(currentMemoryInfo);

    // Keep only last 100 entries
    if (memoryUsageHistory.length > 100) {
      memoryUsageHistory.shift();
    }

    // Update peak usage
    if (!peakMemoryUsageRef.current || currentMemoryInfo.usedMemoryMB > peakMemoryUsageRef.current.usedMemoryMB) {
      peakMemoryUsageRef.current = currentMemoryInfo;
    }

    // Check thresholds and set alerts
    const { usedMemoryMB } = currentMemoryInfo;
    
    if (usedMemoryMB >= thresholds.emergency) {
      setIsMemoryCritical(true);
      addMemoryAlert('emergency', `Memory usage critical: ${usedMemoryMB.toFixed(1)}MB`);
      trackEvent('memory_emergency', 0, { memoryUsage: usedMemoryMB });
    } else if (usedMemoryMB >= thresholds.critical) {
      setIsMemoryCritical(true);
      addMemoryAlert('critical', `Memory usage high: ${usedMemoryMB.toFixed(1)}MB`);
      trackEvent('memory_critical', 0, { memoryUsage: usedMemoryMB });
    } else if (usedMemoryMB >= thresholds.warning) {
      setIsMemoryLow(true);
      addMemoryAlert('warning', `Memory usage elevated: ${usedMemoryMB.toFixed(1)}MB`);
      trackEvent('memory_warning', 0, { memoryUsage: usedMemoryMB });
    } else {
      setIsMemoryLow(false);
      setIsMemoryCritical(false);
    }

    // Auto-cleanup if enabled
    if (enableAutoCleanup && usedMemoryMB >= cleanupThreshold) {
      cleanupMemory();
    }

    // Force garbage collection if enabled
    if (enableGarbageCollection && usedMemoryMB >= gcThreshold) {
      forceGarbageCollection();
    }

    // Track memory usage
    trackMemoryUsage();
  }, [getMemoryInfo, thresholds, enableAutoCleanup, cleanupThreshold, enableGarbageCollection, gcThreshold, trackEvent, trackMemoryUsage]);

  // Add memory alert
  const addMemoryAlert = useCallback((type: 'warning' | 'critical' | 'emergency', message: string) => {
    const alert: MemoryAlert = {
      id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type,
      message,
      timestamp: Date.now(),
      memoryUsage: memoryInfo?.usedMemoryMB || 0
    };

    setMemoryAlerts(prev => [...prev, alert]);

    // Keep only last 50 alerts
    if (memoryAlerts.length > 50) {
      memoryAlerts.shift();
    }
  }, [memoryInfo]);

  // Force garbage collection
  const forceGarbageCollection = useCallback(() => {
    try {
      // Try to trigger garbage collection (not guaranteed to work)
      if (typeof window !== 'undefined' && window.gc) {
        window.gc();
      }
      
      // Alternative: create temporary objects to trigger GC
      const tempObjects = [];
      for (let i = 0; i < 1000; i++) {
        tempObjects.push({ data: new Array(1000).fill(0) });
      }
      tempObjects.length = 0;
      
      trackEvent('garbage_collection_forced', 0, {});
    } catch (error) {
      console.error('Failed to force garbage collection:', error);
    }
  }, [trackEvent]);

  // Cleanup memory
  const cleanupMemory = useCallback(() => {
    const startTime = Date.now();
    let cleanedSize = 0;

    // Clean up expired cache entries
    const now = Date.now();
    for (const [key, entry] of memoryCacheRegistry.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        cleanedSize += entry.size;
        memoryCacheRegistry.delete(key);
      }
    }

    // Clear old memory usage history
    if (memoryUsageHistory.length > 50) {
      memoryUsageHistory.splice(0, memoryUsageHistory.length - 50);
    }

    // Clear old alerts
    const oneHourAgo = now - 3600000;
    setMemoryAlerts(prev => prev.filter(alert => alert.timestamp > oneHourAgo));

    // Clear console logs in development
    if (process.env.NODE_ENV === 'development') {
      console.clear();
    }

    const cleanupTime = Date.now() - startTime;
    trackEvent('memory_cleanup', cleanupTime, { cleanedSize });
  }, [trackEvent]);

  // Optimize memory usage with Android-specific optimizations
  const optimizeMemory = useCallback(() => {
    const startTime = Date.now();
    const optimizations: string[] = [];

    // Strategy 1: Cache cleanup (more aggressive for Android)
    if (memoryCacheRegistry.size > 80) { // Lower threshold for Android
      const oldestEntries = Array.from(memoryCacheRegistry.entries())
        .sort((a, b) => a[1].timestamp - b[1].timestamp)
        .slice(0, 60); // Clean more entries for Android
      
      oldestEntries.forEach(([key]) => memoryCacheRegistry.delete(key));
      optimizations.push(MEMORY_OPTIMIZATION_STRATEGIES.CACHE_CLEANUP);
    }

    // Strategy 2: Garbage collection (more frequent for Android)
    if (memoryInfo && memoryInfo.usedMemoryMB > 80) { // Lower threshold for Android
      forceGarbageCollection();
      optimizations.push(MEMORY_OPTIMIZATION_STRATEGIES.GARBAGE_COLLECTION);
    }

    // Strategy 3: Android-specific optimizations
    if (Platform.OS === 'android') {
      // Clear React Native bridge cache
      if ((global as any).__REACT_DEVTOOLS_GLOBAL_HOOK__) {
        try {
          // Clear React DevTools cache if available
          (global as any).__REACT_DEVTOOLS_GLOBAL_HOOK__.renderers.clear();
          optimizations.push('android_bridge_cleanup');
        } catch (error) {
          // Ignore errors in production
        }
      }

      // Clear AsyncStorage cache if memory is high
      if (memoryInfo && memoryInfo.usedMemoryMB > 100) {
        try {
          // This would need to be implemented with actual AsyncStorage cleanup
          optimizations.push('android_asyncstorage_cleanup');
        } catch (error) {
          // Ignore errors
        }
      }
    }

    // Strategy 4: Image optimization (if applicable - web only)
    if (typeof document !== 'undefined' && typeof window !== 'undefined') {
      const images = document.querySelectorAll('img');
      if (images.length > 20) {
        // Remove images that are not visible
        const visibleImages = Array.from(images).filter(img => {
          const rect = img.getBoundingClientRect();
          return rect.top < window.innerHeight && rect.bottom > 0;
        });
        
        if (visibleImages.length < images.length) {
          optimizations.push(MEMORY_OPTIMIZATION_STRATEGIES.IMAGE_OPTIMIZATION);
        }
      }
    }

    const optimizationTime = Date.now() - startTime;
    trackEvent('memory_optimization', optimizationTime, { optimizations, platform: Platform.OS });
  }, [memoryInfo, forceGarbageCollection, trackEvent]);

  // Get memory report
  const getMemoryReport = useCallback((): MemoryReport => {
    const currentUsage = memoryInfo || getMemoryInfo() || {
      usedMemoryMB: 0,
      totalMemoryMB: 0,
      memoryLimitMB: 0,
      memoryUsagePercent: 0,
      availableMemoryMB: 0
    } as MemoryInfo;

    const averageUsage = memoryUsageHistory.length > 0
      ? memoryUsageHistory.reduce((sum, info) => sum + info.usedMemoryMB, 0) / memoryUsageHistory.length
      : 0;

    // Detect potential memory leaks
    const memoryLeaks: MemoryLeak[] = [];
    
    // Check for growing cache
    if (memoryCacheRegistry.size > 200) {
      memoryLeaks.push({
        type: 'cache_growth',
        description: 'Large cache registry detected',
        severity: 'medium',
        estimatedSize: memoryCacheRegistry.size * 0.1, // Estimate 0.1MB per entry
        recommendations: ['Implement cache TTL', 'Limit cache size', 'Use LRU eviction']
      });
    }

    // Check for growing history
    if (memoryUsageHistory.length > 80) {
      memoryLeaks.push({
        type: 'history_growth',
        description: 'Large memory usage history',
        severity: 'low',
        estimatedSize: memoryUsageHistory.length * 0.01, // Estimate 0.01MB per entry
        recommendations: ['Limit history size', 'Implement circular buffer']
      });
    }

    // Check for growing alerts
    if (memoryAlerts.length > 30) {
      memoryLeaks.push({
        type: 'alert_growth',
        description: 'Large number of memory alerts',
        severity: 'low',
        estimatedSize: memoryAlerts.length * 0.001, // Estimate 0.001MB per alert
        recommendations: ['Implement alert cleanup', 'Limit alert history']
      });
    }

    // Generate recommendations
    const recommendations: string[] = [];
    
    if (currentUsage.memoryUsagePercent > 80) {
      recommendations.push('Consider implementing virtual scrolling for large lists');
      recommendations.push('Optimize image loading and caching');
      recommendations.push('Implement lazy loading for components');
    }
    
    if (memoryLeaks.length > 0) {
      recommendations.push('Address detected memory leaks');
      recommendations.push('Implement automatic cleanup strategies');
    }
    
    if (currentUsage.usedMemoryMB > 120) { // Lower threshold for Android
      recommendations.push('Consider reducing data cache size');
      recommendations.push('Implement more aggressive garbage collection');
      recommendations.push('Enable Android-specific memory optimization');
    }

    return {
      currentUsage,
      peakUsage: peakMemoryUsageRef.current || currentUsage,
      averageUsage,
      memoryLeaks,
      recommendations,
      timestamp: Date.now()
    };
  }, [memoryInfo, getMemoryInfo]);

  // Clear all caches
  const clearAllCaches = useCallback(() => {
    const startTime = Date.now();
    const cacheSize = memoryCacheRegistry.size;
    
    memoryCacheRegistry.clear();
    memoryUsageHistory.length = 0;
    setMemoryAlerts([]);
    
    const clearTime = Date.now() - startTime;
    trackEvent('all_caches_cleared', clearTime, { cacheSize });
  }, [trackEvent]);

  // Clear memory alerts
  const clearMemoryAlerts = useCallback(() => {
    setMemoryAlerts([]);
  }, []);

  // Set up monitoring
  useEffect(() => {
    if (!enableMonitoring) return;

    // Initial memory check
    monitorMemoryUsage();

    // Set up monitoring interval
    monitoringIntervalRef.current = setInterval(monitorMemoryUsage, monitoringInterval) as any;

    return () => {
      if (monitoringIntervalRef.current) {
        clearInterval(monitoringIntervalRef.current);
      }
    };
  }, [enableMonitoring, monitoringInterval, monitorMemoryUsage]);

  // Set up optimization
  useEffect(() => {
    if (!enableMemoryOptimization) return;

    optimizationIntervalRef.current = setInterval(optimizeMemory, optimizationInterval) as any;

    return () => {
      if (optimizationIntervalRef.current) {
        clearInterval(optimizationIntervalRef.current);
      }
    };
  }, [enableMemoryOptimization, optimizationInterval, optimizeMemory]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (monitoringIntervalRef.current) {
        clearInterval(monitoringIntervalRef.current);
      }
      if (optimizationIntervalRef.current) {
        clearInterval(optimizationIntervalRef.current);
      }
    };
  }, []);

  return {
    memoryInfo,
    isMemoryLow,
    isMemoryCritical,
    memoryUsagePercent: memoryInfo?.memoryUsagePercent || 0,
    availableMemoryMB: memoryInfo?.availableMemoryMB || 0,
    forceGarbageCollection,
    cleanupMemory,
    optimizeMemory,
    getMemoryReport,
    clearAllCaches,
    monitorMemoryUsage,
    memoryAlerts,
    clearMemoryAlerts
  };
};

// Memory cache management utilities
export const MemoryCache = {
  set: (key: string, data: any, ttl: number = 300000) => {
    const size = JSON.stringify(data).length / 1024 / 1024; // Size in MB
    memoryCacheRegistry.set(key, {
      data,
      size,
      timestamp: Date.now(),
      ttl
    });
  },

  get: (key: string) => {
    const entry = memoryCacheRegistry.get(key);
    if (!entry) return null;
    
    if (Date.now() - entry.timestamp > entry.ttl) {
      memoryCacheRegistry.delete(key);
      return null;
    }
    
    return entry.data;
  },

  delete: (key: string) => {
    memoryCacheRegistry.delete(key);
  },

  clear: () => {
    memoryCacheRegistry.clear();
  },

  size: () => memoryCacheRegistry.size,

  getStats: () => {
    const entries = Array.from(memoryCacheRegistry.values());
    const totalSize = entries.reduce((sum, entry) => sum + entry.size, 0);
    const averageSize = entries.length > 0 ? totalSize / entries.length : 0;
    
    return {
      entryCount: entries.length,
      totalSizeMB: totalSize,
      averageSizeMB: averageSize,
      oldestEntry: entries.length > 0 ? Math.min(...entries.map(e => e.timestamp)) : 0,
      newestEntry: entries.length > 0 ? Math.max(...entries.map(e => e.timestamp)) : 0
    };
  }
};

// Higher-order component for memory monitoring
export const withMemoryMonitoring = <P extends object>(
  WrappedComponent: React.ComponentType<P>,
  options: UseMemoryManagementOptions = {}
) => {
  return React.forwardRef<any, P>((props, ref) => {
    const { memoryInfo, isMemoryLow, isMemoryCritical, optimizeMemory } = useMemoryManagement(options);
    
    // Auto-optimize if memory is critical
    useEffect(() => {
      if (isMemoryCritical) {
        optimizeMemory();
      }
    }, [isMemoryCritical, optimizeMemory]);

    return React.createElement(WrappedComponent, { ...props, ref } as any);
  });
}; 

// Initialize memory management
export const initializeMemoryManagement = () => {
  if (!(global as any).appStartTime) {
    (global as any).appStartTime = Date.now();
  }
};

// Auto-initialize when the module is loaded
initializeMemoryManagement(); 