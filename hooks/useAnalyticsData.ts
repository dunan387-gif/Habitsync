// Custom hook for optimized analytics data processing

import { useMemo, useCallback, useState, useEffect } from 'react';
import { AnalyticsBackendService } from '@/services/AnalyticsBackendService';
import { 
  DailyAnalytics, 
  WeeklyAnalytics, 
  MonthlyAnalytics, 
  MoodHabitCorrelation,
  PredictiveAnalytics,
  UserStats,
  Habit,
  MoodEntry
} from '@/types/analytics';

interface UseAnalyticsDataOptions {
  enableCaching?: boolean;
  cacheTTL?: number; // in milliseconds
  debounceTime?: number; // in milliseconds
}

interface AnalyticsData {
  daily: DailyAnalytics | null;
  weekly: WeeklyAnalytics | null;
  monthly: MonthlyAnalytics | null;
  correlations: MoodHabitCorrelation[] | null;
  predictions: PredictiveAnalytics[] | null;
  userStats: UserStats | null;
}

interface UseAnalyticsDataReturn {
  data: AnalyticsData;
  loading: {
    daily: boolean;
    weekly: boolean;
    monthly: boolean;
    correlations: boolean;
    predictions: boolean;
    userStats: boolean;
  };
  error: string | null;
  refresh: (type?: keyof AnalyticsData) => Promise<void>;
  clearCache: () => void;
}

// In-memory cache for analytics data
const analyticsCache = new Map<string, { data: any; timestamp: number; ttl: number }>();

export const useAnalyticsData = (options: UseAnalyticsDataOptions = {}): UseAnalyticsDataReturn => {
  const {
    enableCaching = true,
    cacheTTL = 5 * 60 * 1000, // 5 minutes
    debounceTime = 300 // 300ms
  } = options;

  const [data, setData] = useState<AnalyticsData>({
    daily: null,
    weekly: null,
    monthly: null,
    correlations: null,
    predictions: null,
    userStats: null
  });

  const [loading, setLoading] = useState({
    daily: false,
    weekly: false,
    monthly: false,
    correlations: false,
    predictions: false,
    userStats: false
  });

  const [error, setError] = useState<string | null>(null);
  const [debounceTimers, setDebounceTimers] = useState<Map<string, NodeJS.Timeout>>(new Map());

  // Cache management functions
  const getCachedData = useCallback((key: string) => {
    if (!enableCaching) return null;
    
    const cached = analyticsCache.get(key);
    if (cached && Date.now() - cached.timestamp < cached.ttl) {
      return cached.data;
    }
    
    // Remove expired cache
    if (cached) {
      analyticsCache.delete(key);
    }
    
    return null;
  }, [enableCaching]);

  const setCachedData = useCallback((key: string, data: any, ttl: number = cacheTTL) => {
    if (!enableCaching) return;
    
    analyticsCache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    });
  }, [enableCaching, cacheTTL]);

  const clearCache = useCallback(() => {
    analyticsCache.clear();
    setData({
      daily: null,
      weekly: null,
      monthly: null,
      correlations: null,
      predictions: null,
      userStats: null
    });
  }, []);

  // Debounced data fetching
  const debouncedFetch = useCallback((type: keyof AnalyticsData, fetchFn: () => Promise<any>) => {
    const timerKey = `fetch_${type}`;
    
    // Clear existing timer
    const existingTimer = debounceTimers.get(timerKey);
    if (existingTimer) {
      clearTimeout(existingTimer);
    }
    
    // Set new timer
    const newTimer = setTimeout(async () => {
      try {
        setLoading(prev => ({ ...prev, [type]: true }));
        setError(null);
        
        const result = await fetchFn();
        setData(prev => ({ ...prev, [type]: result }));
        setCachedData(timerKey, result);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch analytics data');
        console.error(`Error fetching ${type} analytics:`, err);
      } finally {
        setLoading(prev => ({ ...prev, [type]: false }));
      }
    }, debounceTime);
    
    setDebounceTimers(prev => new Map(prev.set(timerKey, newTimer as any)));
  }, [debounceTimers, debounceTime, setCachedData]);

  // Optimized data fetching functions
  const fetchDailyAnalytics = useCallback(async () => {
    const cacheKey = 'daily_analytics';
    const cached = getCachedData(cacheKey);
    
    if (cached) {
      setData(prev => ({ ...prev, daily: cached }));
      return cached;
    }
    
    return await AnalyticsBackendService.getDailyAnalytics();
  }, [getCachedData]);

  const fetchWeeklyAnalytics = useCallback(async () => {
    const cacheKey = 'weekly_analytics';
    const cached = getCachedData(cacheKey);
    
    if (cached) {
      setData(prev => ({ ...prev, weekly: cached }));
      return cached;
    }
    
    return await AnalyticsBackendService.getWeeklyAnalytics();
  }, [getCachedData]);

  const fetchMonthlyAnalytics = useCallback(async () => {
    const cacheKey = 'monthly_analytics';
    const cached = getCachedData(cacheKey);
    
    if (cached) {
      setData(prev => ({ ...prev, monthly: cached }));
      return cached;
    }
    
    return await AnalyticsBackendService.getMonthlyAnalytics();
  }, [getCachedData]);

  const fetchCorrelations = useCallback(async () => {
    const cacheKey = 'correlations';
    const cached = getCachedData(cacheKey);
    
    if (cached) {
      setData(prev => ({ ...prev, correlations: cached }));
      return cached;
    }
    
    return await AnalyticsBackendService.getMoodHabitCorrelations();
  }, [getCachedData]);

  const fetchPredictions = useCallback(async () => {
    const cacheKey = 'predictions';
    const cached = getCachedData(cacheKey);
    
    if (cached) {
      setData(prev => ({ ...prev, predictions: cached }));
      return cached;
    }
    
    return await AnalyticsBackendService.getPredictiveAnalytics();
  }, [getCachedData]);

  const fetchUserStats = useCallback(async () => {
    const cacheKey = 'user_stats';
    const cached = getCachedData(cacheKey);
    
    if (cached) {
      setData(prev => ({ ...prev, userStats: cached }));
      return cached;
    }
    
    return await AnalyticsBackendService.getUserStats();
  }, [getCachedData]);

  // Main refresh function
  const refresh = useCallback(async (type?: keyof AnalyticsData) => {
    if (type) {
      // Refresh specific type
      switch (type) {
        case 'daily':
          debouncedFetch('daily', fetchDailyAnalytics);
          break;
        case 'weekly':
          debouncedFetch('weekly', fetchWeeklyAnalytics);
          break;
        case 'monthly':
          debouncedFetch('monthly', fetchMonthlyAnalytics);
          break;
        case 'correlations':
          debouncedFetch('correlations', fetchCorrelations);
          break;
        case 'predictions':
          debouncedFetch('predictions', fetchPredictions);
          break;
        case 'userStats':
          debouncedFetch('userStats', fetchUserStats);
          break;
      }
    } else {
      // Refresh all data
      debouncedFetch('daily', fetchDailyAnalytics);
      debouncedFetch('weekly', fetchWeeklyAnalytics);
      debouncedFetch('monthly', fetchMonthlyAnalytics);
      debouncedFetch('correlations', fetchCorrelations);
      debouncedFetch('predictions', fetchPredictions);
      debouncedFetch('userStats', fetchUserStats);
    }
  }, [
    debouncedFetch,
    fetchDailyAnalytics,
    fetchWeeklyAnalytics,
    fetchMonthlyAnalytics,
    fetchCorrelations,
    fetchPredictions,
    fetchUserStats
  ]);

  // Load initial data
  useEffect(() => {
    refresh();
  }, [refresh]);

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      debounceTimers.forEach(timer => clearTimeout(timer));
    };
  }, [debounceTimers]);

  // Memoized computed values
  const computedData = useMemo(() => {
    const { daily, weekly, monthly, correlations, predictions, userStats } = data;
    
    return {
      // Overall completion rate
      overallCompletionRate: daily?.completionRate || 0,
      
      // Mood trend
      moodTrend: daily?.averageMoodIntensity || 0,
      
      // Top performing habits
      topHabits: daily?.topPerformingHabits || [],
      
      // Struggling habits
      strugglingHabits: daily?.strugglingHabits || [],
      
      // Weekly insights
      weeklyInsights: weekly?.insights || [],
      
      // Monthly growth
      monthlyGrowth: monthly?.habitGrowth || [],
      
      // Best correlations
      bestCorrelations: correlations?.filter(c => c.moodImprovement > 0).slice(0, 3) || [],
      
      // High confidence predictions
      highConfidencePredictions: predictions?.filter(p => p.confidence > 0.8) || [],
      
      // User progress
      userProgress: userStats ? {
        level: userStats.currentLevel,
        xp: userStats.currentXP,
        totalHabits: userStats.totalHabits,
        activeHabits: userStats.activeHabits,
        completionRate: userStats.completionRate
      } : null
    };
  }, [data]);

  return {
    data: { ...data, ...computedData },
    loading,
    error,
    refresh,
    clearCache
  };
};

// Specialized hooks for specific analytics types
export const useDailyAnalytics = () => {
  const { data, loading, error, refresh } = useAnalyticsData();
  return {
    dailyAnalytics: data.daily,
    loading: loading.daily,
    error,
    refresh: () => refresh('daily')
  };
};

export const useWeeklyAnalytics = () => {
  const { data, loading, error, refresh } = useAnalyticsData();
  return {
    weeklyAnalytics: data.weekly,
    loading: loading.weekly,
    error,
    refresh: () => refresh('weekly')
  };
};

export const useMonthlyAnalytics = () => {
  const { data, loading, error, refresh } = useAnalyticsData();
  return {
    monthlyAnalytics: data.monthly,
    loading: loading.monthly,
    error,
    refresh: () => refresh('monthly')
  };
};

export const useUserStats = () => {
  const { data, loading, error, refresh } = useAnalyticsData();
  return {
    userStats: data.userStats,
    loading: loading.userStats,
    error,
    refresh: () => refresh('userStats')
  };
}; 