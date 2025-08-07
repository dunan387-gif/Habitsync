// Analytics Types for Frontend

export interface AnalyticsRequest {
  userId: string;
  startDate?: string;
  endDate?: string;
  type: 'daily' | 'weekly' | 'monthly' | 'correlation' | 'prediction';
  filters?: Record<string, any>;
}

export interface AnalyticsResponse {
  success: boolean;
  data: any;
  cached: boolean;
  computedAt: string;
  error?: string;
}

export interface DailyAnalytics {
  date: string;
  totalHabits: number;
  completedHabits: number;
  completionRate: number;
  moodEntries: number;
  averageMoodIntensity: number;
  moodStates: Record<string, number>;
  topPerformingHabits: Array<{
    habitId: string;
    title: string;
    completed: boolean;
    streak: number;
  }>;
  strugglingHabits: Array<{
    habitId: string;
    title: string;
    daysSinceLastCompletion: number;
  }>;
}

export interface WeeklyAnalytics {
  weekStart: string;
  weekEnd: string;
  totalCompletions: number;
  averageCompletionRate: number;
  moodTrend: Array<{
    date: string;
    averageIntensity: number;
    dominantMood: string;
  }>;
  habitPerformance: Array<{
    habitId: string;
    title: string;
    completions: number;
    target: number;
    completionRate: number;
    streak: number;
  }>;
  achievements: Array<{
    id: string;
    title: string;
    description: string;
    unlockedAt: string;
  }>;
  insights: string[];
}

export interface MonthlyAnalytics {
  month: string;
  year: number;
  totalCompletions: number;
  averageCompletionRate: number;
  moodDistribution: Record<string, number>;
  habitGrowth: Array<{
    habitId: string;
    title: string;
    growthRate: number;
    trend: 'improving' | 'declining' | 'stable';
  }>;
  correlations: Array<{
    habitId: string;
    title: string;
    moodImprovement: number;
    successRate: number;
  }>;
  predictions: Array<{
    habitId: string;
    title: string;
    predictedSuccessRate: number;
    recommendations: string[];
  }>;
}

export interface MoodHabitCorrelation {
  habitId: string;
  habitTitle: string;
  totalEntries: number;
  completionRate: number;
  averagePreMoodIntensity: number;
  averagePostMoodIntensity: number;
  moodImprovement: number;
  successfulMoods: Array<{
    moodState: string;
    count: number;
    successRate: number;
  }>;
  failedMoods: Array<{
    moodState: string;
    count: number;
    failureRate: number;
  }>;
  bestMoodForSuccess: string;
  worstMoodForSuccess: string;
  recommendations: string[];
}

export interface PredictiveAnalytics {
  habitId: string;
  habitTitle: string;
  predictedSuccessRate: number;
  confidence: number;
  factors: {
    moodAlignment: number;
    timeOfDay: number;
    recentPattern: number;
    streakMomentum: number;
  };
  recommendations: string[];
  riskLevel: 'low' | 'medium' | 'high';
  optimalTiming: Array<{
    timeSlot: string;
    successProbability: number;
    reasoning: string;
  }>;
}

export interface UserStats {
  totalHabits: number;
  activeHabits: number;
  totalCompletions: number;
  currentStreak: number;
  longestStreak: number;
  totalMoodEntries: number;
  averageMoodIntensity: number;
  totalAchievements: number;
  currentLevel: number;
  currentXP: number;
  completionRate: number;
  moodTrend: 'improving' | 'declining' | 'stable';
}

export interface AnalyticsCache {
  userId: string;
  cacheKey: string;
  cacheType: string;
  data: any;
  computedAt: string;
  expiresAt: string;
}

// Database table interfaces
export interface UserProfile {
  id: string;
  email: string;
  name?: string;
  avatar?: string;
  bio?: string;
  dateOfBirth?: string;
  location?: string;
  timezone: string;
  preferences: Record<string, any>;
  stats: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface Habit {
  id: string;
  userId: string;
  title: string;
  description?: string;
  icon?: string;
  category?: string;
  frequency: string;
  targetCount: number;
  currentStreak: number;
  longestStreak: number;
  reminderTime?: string;
  reminderEnabled: boolean;
  reminderDays?: number[];
  orderIndex: number;
  difficulty: string;
  estimatedDuration?: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface HabitCompletion {
  id: string;
  habitId: string;
  userId: string;
  completionDate: string;
  completionTime: string;
  count: number;
  notes?: string;
  createdAt: string;
}

export interface MoodEntry {
  id: string;
  userId: string;
  entryDate: string;
  entryTime: string;
  moodState: string;
  intensity: number;
  note?: string;
  triggers?: string[];
  context: Record<string, any>;
  createdAt: string;
}

export interface HabitMoodCorrelation {
  id: string;
  habitId: string;
  userId: string;
  correlationDate: string;
  preMoodState?: string;
  preMoodIntensity?: number;
  postMoodState?: string;
  postMoodIntensity?: number;
  timeAfterCompletion?: number;
  triggers?: string[];
  notes?: string;
  createdAt: string;
}

export interface Achievement {
  id: string;
  userId: string;
  achievementType: string;
  title: string;
  description?: string;
  icon?: string;
  xpReward: number;
  unlockedAt: string;
  metadata: Record<string, any>;
}

export interface UserLevel {
  id: string;
  userId: string;
  level: number;
  currentXP: number;
  totalXP: number;
  xpToNextLevel: number;
  title: string;
  updatedAt: string;
}

export interface AnalyticsEvent {
  id: string;
  userId: string;
  eventType: string;
  eventData: Record<string, any>;
  sessionId?: string;
  timestamp: string;
} 