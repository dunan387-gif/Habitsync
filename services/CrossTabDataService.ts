import AsyncStorage from '@react-native-async-storage/async-storage';
import { CrossTabData, TodayInsight, WeeklyProgress, LearningInsight } from '@/context/CrossTabInsightsContext';

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number; // Time to live in milliseconds
}

interface DataValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

class CrossTabDataService {
  private static instance: CrossTabDataService;
  private cache: Map<string, CacheEntry<any>> = new Map();
  private listeners: Map<string, Set<(data: any) => void>> = new Map();
  private syncInProgress = false;
  private lastSyncTime = 0;
  private readonly SYNC_INTERVAL = 30000; // 30 seconds
  private readonly CACHE_TTL = 300000; // 5 minutes

  private constructor() {
    this.initializeCache();
  }

  static getInstance(): CrossTabDataService {
    if (!CrossTabDataService.instance) {
      CrossTabDataService.instance = new CrossTabDataService();
    }
    return CrossTabDataService.instance;
  }

  // Initialize cache from AsyncStorage
  private async initializeCache(): Promise<void> {
    try {
      const cachedData = await AsyncStorage.getItem('crossTabDataCache');
      if (cachedData) {
        const parsed = JSON.parse(cachedData);
        this.cache = new Map(Object.entries(parsed));
      }
    } catch (error) {
      console.warn('Failed to initialize cache:', error);
    }
  }

  // Save cache to AsyncStorage
  private async persistCache(): Promise<void> {
    try {
      const cacheObject = Object.fromEntries(this.cache);
      await AsyncStorage.setItem('crossTabDataCache', JSON.stringify(cacheObject));
    } catch (error) {
      console.warn('Failed to persist cache:', error);
    }
  }

  // Get cached data with TTL validation
  async getCachedData<T>(key: string): Promise<T | null> {
    const entry = this.cache.get(key);
    if (!entry) return null;

    const now = Date.now();
    if (now - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      await this.persistCache();
      return null;
    }

    return entry.data;
  }

  // Set cached data with TTL
  async setCachedData<T>(key: string, data: T, ttl: number = this.CACHE_TTL): Promise<void> {
    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      ttl,
    };

    this.cache.set(key, entry);
    await this.persistCache();
  }

  // Real-time data synchronization
  async syncCrossTabData(): Promise<CrossTabData> {
    if (this.syncInProgress) {
      const cached = await this.getCachedData<CrossTabData>('crossTabData');
      return cached || this.getDefaultData();
    }

    const now = Date.now();
    if (now - this.lastSyncTime < this.SYNC_INTERVAL) {
      const cached = await this.getCachedData<CrossTabData>('crossTabData');
      return cached || this.getDefaultData();
    }

    try {
      this.syncInProgress = true;
      this.lastSyncTime = now;

      // Fetch data from all tabs
      const [homeData, libraryData, gamificationData, settingsData] = await Promise.all([
        this.fetchHomeData(),
        this.fetchLibraryData(),
        this.fetchGamificationData(),
        this.fetchSettingsData(),
      ]);

      const crossTabData: CrossTabData = {
        home: homeData,
        library: libraryData,
        gamification: gamificationData,
        settings: settingsData,
      };

      // Validate data consistency
      const validation = this.validateDataConsistency(crossTabData);
      if (!validation.isValid) {
        console.warn('Data consistency issues:', validation.errors);
      }

      // Cache the synchronized data
      await this.setCachedData('crossTabData', crossTabData);

      // Notify listeners
      this.notifyListeners('crossTabData', crossTabData);

      return crossTabData;
    } catch (error) {
      console.error('Failed to sync cross-tab data:', error);
      const cached = await this.getCachedData<CrossTabData>('crossTabData');
      return cached || this.getDefaultData();
    } finally {
      this.syncInProgress = false;
    }
  }

  // Fetch home tab data
  private async fetchHomeData(): Promise<CrossTabData['home']> {
    try {
      // This would integrate with your existing HabitContext
      // For now, returning default data
      return {
        todayCompletions: 0,
        totalHabits: 0,
        currentStreak: 0,
        longestStreak: 0,
        nextHabitRecommendation: '',
        streakContext: '',
      };
    } catch (error) {
      console.error('Failed to fetch home data:', error);
      return this.getDefaultData().home;
    }
  }

  // Fetch library tab data
  private async fetchLibraryData(): Promise<CrossTabData['library']> {
    try {
      // This would integrate with your existing library services
      return {
        coursesCompleted: 0,
        totalCourses: 0,
        appliedTechniques: [],
        courseImpact: '',
        nextCourseRecommendation: '',
      };
    } catch (error) {
      console.error('Failed to fetch library data:', error);
      return this.getDefaultData().library;
    }
  }

  // Fetch gamification tab data
  private async fetchGamificationData(): Promise<CrossTabData['gamification']> {
    try {
      // This would integrate with your existing gamification services
      return {
        currentLevel: 1,
        totalXP: 0,
        recentAchievements: [],
        nextMilestone: '',
        streakMotivation: '',
      };
    } catch (error) {
      console.error('Failed to fetch gamification data:', error);
      return this.getDefaultData().gamification;
    }
  }

  // Fetch settings tab data
  private async fetchSettingsData(): Promise<CrossTabData['settings']> {
    try {
      // This would integrate with your existing settings services
      return {
        preferredTime: 'morning',
        difficultyLevel: 'beginner',
        focusAreas: [],
        notificationStyle: 'motivational',
      };
    } catch (error) {
      console.error('Failed to fetch settings data:', error);
      return this.getDefaultData().settings;
    }
  }

  // Validate data consistency across tabs
  private validateDataConsistency(data: CrossTabData): DataValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Check for data integrity
    if (data.home.todayCompletions > data.home.totalHabits) {
      errors.push('Today completions cannot exceed total habits');
    }

    if (data.home.currentStreak > data.home.longestStreak) {
      warnings.push('Current streak exceeds longest streak - may need update');
    }

    if (data.library.coursesCompleted > data.library.totalCourses) {
      errors.push('Completed courses cannot exceed total courses');
    }

    if (data.gamification.currentLevel < 1) {
      errors.push('Current level must be at least 1');
    }

    // Check for missing required data
    if (!data.home.streakContext) {
      warnings.push('Missing streak context');
    }

    if (!data.gamification.nextMilestone) {
      warnings.push('Missing next milestone information');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  // Generate insights based on cross-tab data
  async generateInsights(data: CrossTabData): Promise<{
    todayInsight: TodayInsight;
    weeklyProgress: WeeklyProgress;
    learningInsight: LearningInsight;
  }> {
    try {
      const [todayInsight, weeklyProgress, learningInsight] = await Promise.all([
        this.generateTodayInsight(data),
        this.generateWeeklyProgress(data),
        this.generateLearningInsight(data),
      ]);

      return { todayInsight, weeklyProgress, learningInsight };
    } catch (error) {
      console.error('Failed to generate insights:', error);
      throw error;
    }
  }

  // Generate today's insight
  private async generateTodayInsight(data: CrossTabData): Promise<TodayInsight> {
    const completionRate = data.home.totalHabits > 0 
      ? (data.home.todayCompletions / data.home.totalHabits) * 100 
      : 0;

    let mainMetric: string;
    let nextAction: string;
    let motivation: string;
    let context: string;
    let priority: 'high' | 'medium' | 'low';

    if (completionRate === 0) {
      mainMetric = 'No habits completed today';
      nextAction = 'Start your first habit';
      motivation = 'Every journey begins with a single step';
      context = 'New day, new opportunity';
      priority = 'high';
    } else if (completionRate < 50) {
      mainMetric = `${data.home.todayCompletions}/${data.home.totalHabits} habits completed`;
      nextAction = 'Complete more habits today';
      motivation = 'You\'re making progress!';
      context = 'Room for improvement';
      priority = 'medium';
    } else if (completionRate < 100) {
      mainMetric = `${data.home.todayCompletions}/${data.home.totalHabits} habits completed`;
      nextAction = 'Complete remaining habits';
      motivation = 'Almost there!';
      context = 'Great progress today';
      priority = 'medium';
    } else {
      mainMetric = 'All habits completed!';
      nextAction = 'Maintain your momentum';
      motivation = 'Perfect day!';
      context = 'Excellent work';
      priority = 'low';
    }

    return {
      mainMetric,
      nextAction,
      motivation,
      context,
      priority,
    };
  }

  // Generate weekly progress
  private async generateWeeklyProgress(data: CrossTabData): Promise<WeeklyProgress> {
    // Simplified weekly analysis
    const averageCompletions = data.home.totalHabits > 0 
      ? data.home.todayCompletions / data.home.totalHabits 
      : 0;

    let trend: 'improving' | 'stable' | 'declining';
    let improvement: string;
    let recommendation: string;
    let percentageChange: number;

    if (averageCompletions > 0.7) {
      trend = 'improving';
      improvement = 'Strong performance this week';
      recommendation = 'Keep up the consistency';
      percentageChange = 15;
    } else if (averageCompletions > 0.4) {
      trend = 'stable';
      improvement = 'Steady progress maintained';
      recommendation = 'Try to increase your effort';
      percentageChange = 5;
    } else {
      trend = 'declining';
      improvement = 'Needs attention this week';
      recommendation = 'Focus on the basics';
      percentageChange = -10;
    }

    return {
      trend,
      keyMetric: 'Completion Rate',
      improvement,
      recommendation,
      percentageChange,
    };
  }

  // Generate learning insight
  private async generateLearningInsight(data: CrossTabData): Promise<LearningInsight> {
    const courseProgress = data.library.totalCourses > 0 
      ? (data.library.coursesCompleted / data.library.totalCourses) * 100 
      : 0;

    let courseImpact: string;
    let knowledgeApplied: string;
    let nextLearning: string;
    let impactScore: number;

    if (courseProgress === 0) {
      courseImpact = 'No courses completed yet';
      knowledgeApplied = 'Start learning to improve habits';
      nextLearning = 'Explore the library for courses';
      impactScore = 0;
    } else if (courseProgress < 30) {
      courseImpact = 'Learning journey just beginning';
      knowledgeApplied = 'Apply basic techniques';
      nextLearning = 'Continue with beginner courses';
      impactScore = 25;
    } else if (courseProgress < 70) {
      courseImpact = 'Good learning progress';
      knowledgeApplied = 'Applying intermediate techniques';
      nextLearning = 'Try advanced courses';
      impactScore = 60;
    } else {
      courseImpact = 'Excellent learning progress';
      knowledgeApplied = 'Mastering advanced techniques';
      nextLearning = 'Review and practice';
      impactScore = 90;
    }

    return {
      courseImpact,
      knowledgeApplied,
      nextLearning,
      impactScore,
    };
  }

  // Subscribe to data changes
  subscribe(key: string, callback: (data: any) => void): () => void {
    if (!this.listeners.has(key)) {
      this.listeners.set(key, new Set());
    }
    this.listeners.get(key)!.add(callback);

    // Return unsubscribe function
    return () => {
      const keyListeners = this.listeners.get(key);
      if (keyListeners) {
        keyListeners.delete(callback);
        if (keyListeners.size === 0) {
          this.listeners.delete(key);
        }
      }
    };
  }

  // Notify listeners of data changes
  private notifyListeners(key: string, data: any): void {
    const keyListeners = this.listeners.get(key);
    if (keyListeners) {
      keyListeners.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error('Error in listener callback:', error);
        }
      });
    }
  }

  // Get default data structure
  private getDefaultData(): CrossTabData {
    return {
      home: {
        todayCompletions: 0,
        totalHabits: 0,
        currentStreak: 0,
        longestStreak: 0,
        nextHabitRecommendation: '',
        streakContext: '',
      },
      library: {
        coursesCompleted: 0,
        totalCourses: 0,
        appliedTechniques: [],
        courseImpact: '',
        nextCourseRecommendation: '',
      },
      gamification: {
        currentLevel: 1,
        totalXP: 0,
        recentAchievements: [],
        nextMilestone: '',
        streakMotivation: '',
      },
      settings: {
        preferredTime: 'morning',
        difficultyLevel: 'beginner',
        focusAreas: [],
        notificationStyle: 'motivational',
      },
    };
  }

  // Clear all cached data
  async clearCache(): Promise<void> {
    this.cache.clear();
    await AsyncStorage.removeItem('crossTabDataCache');
  }

  // Get cache statistics
  getCacheStats(): {
    size: number;
    keys: string[];
    totalSize: number;
  } {
    const keys = Array.from(this.cache.keys());
    const totalSize = keys.reduce((sum, key) => {
      const entry = this.cache.get(key);
      return sum + (entry ? JSON.stringify(entry.data).length : 0);
    }, 0);

    return {
      size: this.cache.size,
      keys,
      totalSize,
    };
  }
}

export default CrossTabDataService;
