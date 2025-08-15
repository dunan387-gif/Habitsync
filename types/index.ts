export interface Habit {
  id: string;
  title: string;
  icon?: string;
  notes?: string;
  description?: string; // Add missing description property
  streak: number;
  currentStreak?: number; // Add missing currentStreak property
  bestStreak?: number;
  createdAt: string;
  completedToday: boolean;
  completedDates: string[]; // ISO date strings
  completions?: any[]; // Add missing completions property
  // Single reminder (legacy support)
  reminderTime?: string; // Time in 24-hour format (HH:MM)
  reminderEnabled: boolean;
  reminderDays?: number[]; // Days of week: 0=Sunday, 1=Monday, ..., 6=Saturday
  
  // Multiple reminders
  reminders?: HabitReminder[]; // Array of multiple reminders
  order: number; // Add this field for drag & drop ordering
  priority?: number; // Add missing priority property
  frequency?: { days: number }; // Add missing frequency property
  // AI Enhancement fields
  category?: string;
  difficulty?: 'easy' | 'medium' | 'hard';
  completionTimes?: string[]; // Track when user typically completes habits
  lastMotivationalNudge?: string; // ISO date string
  // Add this missing property:
  isNewStreakRecord?: boolean; // Flag to indicate if current streak is a new record
  duration?: number; // Duration in minutes for habit completion
  // NEW: Habit-Mood Integration fields
  moodEntries?: HabitMoodEntry[]; // Track mood at completion/skip
  // NEW: Notification ID tracking for efficient management
  notificationIds?: string[]; // Array of scheduled notification IDs for this habit
  lastNotificationUpdate?: string; // ISO timestamp of last notification schedule update
}

// NEW: Habit-Mood Integration interfaces
// NEW: Multiple Reminders interface
export interface HabitReminder {
  id: string;
  time: string; // Time in 24-hour format (HH:MM)
  enabled: boolean;
  days: number[]; // Days of week: 0=Sunday, 1=Monday, ..., 6=Saturday
  message?: string; // Custom reminder message
  notificationId?: string; // ID of scheduled notification
}

export interface HabitMoodEntry {
  id: string;
  habitId: string;
  date: string; // ISO date string
  timestamp: string; // Exact time of completion/skip
  action: 'completed' | 'skipped';
  preMood?: {
    moodState: 'happy' | 'sad' | 'anxious' | 'energetic' | 'tired' | 'stressed' | 'calm';
    intensity: number; // 1-10 scale
  };
  postMood?: {
    moodState: 'happy' | 'sad' | 'anxious' | 'energetic' | 'tired' | 'stressed' | 'calm';
    intensity: number; // 1-10 scale
    timeAfter: number; // Minutes after completion when mood was recorded
  };
  triggers?: ('work' | 'relationships' | 'health' | 'weather' | 'sleep' | 'exercise' | 'social')[];
  note?: string;
}

export interface HabitMoodCorrelation {
  habitId: string;
  habitTitle: string;
  totalEntries: number;
  completionRate: number;
  averagePreMoodIntensity: number;
  averagePostMoodIntensity: number;
  moodImprovement: number; // Difference between post and pre mood
  successfulMoods: {
    moodState: string;
    count: number;
    successRate: number;
  }[];
  failedMoods: {
    moodState: string;
    count: number;
    failureRate: number;
  }[];
  bestMoodForSuccess: string;
  worstMoodForSuccess: string;
}

export interface MoodHabitAnalytics {
  overallCorrelations: HabitMoodCorrelation[];
  moodTrends: {
    date: string;
    averageMood: number;
    habitsCompleted: number;
    habitsSkipped: number;
  }[];
  insights: {
    bestMoodForHabits: string;
    worstMoodForHabits: string;
    moodBoostingHabits: string[]; // Habits that improve mood most
    moodDrainingHabits: string[]; // Habits that worsen mood
    optimalCompletionMoods: { [habitId: string]: string };
  };
}

export type HabitSuggestion = {
  id: string;
  title: string;
  description: string;
  benefits?: string;
  category?: string;
  relatedHabits?: string[]; // IDs of habits that pair well together
  difficulty?: 'easy' | 'medium' | 'hard';
};

export type HabitCategory = {
  id: string;
  name: string;
  habits: HabitSuggestion[];
};

// New AI-specific types
export type AIHabitSuggestion = {
  id: string;
  title: string;
  description: string;
  reason: string; // Why this habit is suggested
  confidence: number; // 0-1 confidence score
  category: string;
  relatedHabitId?: string;
};

export type MotivationalMessage = {
  id: string;
  message: string;
  type: 'encouragement' | 'streak_recovery' | 'milestone' | 'tip';
  condition: string; // When to show this message
};

export type SmartReminderSuggestion = {
  habitId: string;
  suggestedTime: string; // HH:MM format
  reason: string;
  confidence: number;
};

// NEW: AI-Powered Predictive Intelligence Types
export interface HabitSuccessPrediction {
  habitId: string;
  habitTitle: string;
  currentMood: string;
  currentMoodIntensity: number;
  predictedSuccessRate: number; // 0-1 probability
  confidence: number; // 0-1 confidence in prediction
  factors: {
    moodAlignment: number; // How well current mood aligns with success patterns
    timeOfDay: number; // How optimal current time is
    recentPattern: number; // Recent completion pattern influence
    streakMomentum: number; // Current streak influence
  };
  recommendation: 'proceed' | 'wait' | 'modify_approach';
  reasoning: string;
}

export interface RiskAlert {
  id: string;
  habitId: string;
  habitTitle: string;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  riskScore: number; // 0-1 where 1 is highest risk
  currentMood: string;
  currentMoodIntensity: number;
  factors: {
    moodMismatch: number; // How much current mood differs from success patterns
    timeDeviation: number; // How much current time differs from optimal
    recentSkips: number; // Recent skip pattern influence
    streakVulnerability: number; // Risk to current streak
  };
  suggestions: string[];
  urgency: 'immediate' | 'today' | 'this_week';
  createdAt: string;
}

export interface OptimalTimingSuggestion {
  habitId: string;
  habitTitle: string;
  currentMood: string;
  suggestedTimes: {
    time: string; // HH:MM format
    successProbability: number;
    moodAlignment: number;
    reasoning: string;
  }[];
  bestTimeToday: string;
  alternativeTimes: string[];
  moodBasedRecommendation: string;
}

export interface MoodTriggeredRecommendation {
  id: string;
  currentMood: string;
  currentMoodIntensity: number;
  recommendedHabits: {
    habitId: string;
    habitTitle: string;
    matchScore: number; // How well this habit matches current mood
    expectedBenefit: number; // Expected mood improvement
    reasoning: string;
    urgency: 'high' | 'medium' | 'low';
  }[];
  moodBoostingActivities: string[];
  avoidanceRecommendations: string[]; // Habits to avoid in current mood
  createdAt: string;
}

export interface WeeklyForecast {
  weekStartDate: string;
  weekEndDate: string;
  habitForecasts: {
    habitId: string;
    habitTitle: string;
    predictedCompletions: number;
    predictedSuccessRate: number;
    riskDays: {
      date: string;
      riskLevel: 'low' | 'medium' | 'high';
      predictedMood: string;
      suggestions: string[];
    }[];
    optimalDays: {
      date: string;
      predictedMood: string;
      successProbability: number;
    }[];
  }[];
  overallMoodTrend: {
    date: string;
    predictedMood: string;
    predictedIntensity: number;
    confidence: number;
  }[];
  weeklyGoals: {
    habitId: string;
    recommendedTarget: number;
    reasoning: string;
  }[];
  insights: string[];
}

export interface AIPredictiveAnalytics {
  predictions: HabitSuccessPrediction[];
  riskAlerts: RiskAlert[];
  timingSuggestions: OptimalTimingSuggestion[];
  moodRecommendations: MoodTriggeredRecommendation[];
  weeklyForecast: WeeklyForecast;
  lastUpdated: string;
}

// Personalized Coaching types
export interface MoodSpecificHabitModification {
  id: string;
  habitId: string;
  habitTitle: string;
  originalHabit: {
    title: string;
    description: string;
    difficulty: 'easy' | 'medium' | 'hard';
    estimatedTime: number; // minutes
  };
  moodBasedVersions: {
    moodState: 'happy' | 'sad' | 'anxious' | 'energetic' | 'tired' | 'stressed' | 'calm';
    modifiedVersion: {
      title: string;
      description: string;
      difficulty: 'easy' | 'medium' | 'hard';
      estimatedTime: number; // minutes
      modifications: string[]; // What was changed
      reasoning: string; // Why this modification helps
    };
    applicableIntensityRange: {
      min: number; // 1-10 scale
      max: number; // 1-10 scale
    };
  }[];
  createdAt: string;
}

export interface EmotionalHabitStackingSuggestion {
  id: string;
  primaryHabitId: string;
  primaryHabitTitle: string;
  targetMood: 'happy' | 'sad' | 'anxious' | 'energetic' | 'tired' | 'stressed' | 'calm';
  stackingChain: {
    order: number;
    habitId: string;
    habitTitle: string;
    purpose: 'preparation' | 'amplification' | 'stabilization' | 'recovery';
    timing: 'before' | 'during' | 'after';
    waitTime?: number; // minutes to wait before next habit
    emotionalBenefit: string;
    successRate: number; // Historical success rate for this combination
  }[];
  overallBenefit: {
    moodImprovement: number; // Expected mood improvement (1-10)
    stressReduction: number; // Expected stress reduction (1-10)
    energyBoost: number; // Expected energy boost (1-10)
    confidenceIncrease: number; // Expected confidence increase (1-10)
  };
  bestTimeOfDay: string[];
  estimatedTotalTime: number; // minutes
  confidence: number; // 0-1 confidence in this suggestion
  reasoning: string;
  createdAt: string;
}

export interface MoodImprovementHabitRecommendation {
  id: string;
  currentMood: 'happy' | 'sad' | 'anxious' | 'energetic' | 'tired' | 'stressed' | 'calm';
  currentMoodIntensity: number; // 1-10 scale
  targetMood: 'happy' | 'sad' | 'anxious' | 'energetic' | 'tired' | 'stressed' | 'calm';
  targetMoodIntensity: number; // 1-10 scale
  recommendedHabits: {
    habitId?: string; // Existing habit ID if applicable
    title: string;
    description: string;
    category: 'physical' | 'mental' | 'social' | 'creative' | 'spiritual' | 'productive';
    immediateImpact: number; // 1-10 how quickly this helps
    longTermBenefit: number; // 1-10 long-term mood benefit
    effortRequired: 'low' | 'medium' | 'high';
    timeRequired: number; // minutes
    scientificBasis: string; // Brief explanation of why this works
    personalizedReason: string; // Why this is good for this specific user
    successProbability: number; // 0-1 based on user's history
  }[];
  emergencyTechniques: {
    technique: string;
    description: string;
    timeRequired: number; // minutes
    effectiveness: number; // 1-10
  }[];
  avoidanceList: string[]; // Things to avoid in current mood
  followUpRecommendations: string[];
  createdAt: string;
}

export interface PersonalizedMotivationalMessage {
  id: string;
  userId: string;
  currentMood: 'happy' | 'sad' | 'anxious' | 'energetic' | 'tired' | 'stressed' | 'calm';
  currentMoodIntensity: number; // 1-10 scale
  context: {
    timeOfDay: 'morning' | 'afternoon' | 'evening' | 'night';
    dayOfWeek: string;
    recentHabitPerformance: 'excellent' | 'good' | 'average' | 'poor';
    currentStreak: number;
    strugglingHabits: string[]; // Habit IDs user is struggling with
    successfulHabits: string[]; // Habit IDs user is succeeding with
  };
  message: {
    primary: string; // Main motivational message
    secondary?: string; // Additional supportive message
    actionable: string; // Specific action they can take
    affirmation: string; // Personal affirmation
  };
  tone: 'encouraging' | 'empathetic' | 'energizing' | 'calming' | 'inspiring' | 'practical';
  personalizationFactors: {
    userPreferences: string[]; // What motivates this user
    pastSuccesses: string[]; // Previous achievements to reference
    currentChallenges: string[]; // Current struggles to address
    personalityTraits: string[]; // Inferred personality traits
  };
  deliveryTiming: {
    immediate: boolean; // Show right now
    scheduled?: string; // ISO timestamp for scheduled delivery
    triggers: ('habit_completion' | 'habit_skip' | 'mood_check' | 'low_motivation' | 'streak_risk')[];
  };
  effectiveness: {
    expectedImpact: number; // 1-10 expected motivational impact
    confidence: number; // 0-1 confidence in this message
  };
  createdAt: string;
}

export interface AdaptiveHabitSchedule {
  id: string;
  userId: string;
  habitId: string;
  habitTitle: string;
  emotionalPatterns: {
    moodState: 'happy' | 'sad' | 'anxious' | 'energetic' | 'tired' | 'stressed' | 'calm';
    optimalTimes: {
      timeSlot: string; // HH:MM format
      successRate: number; // 0-1
      averageMoodAfter: number; // 1-10
      energyLevel: number; // 1-10
      stressLevel: number; // 1-10
    }[];
    avoidTimes: {
      timeSlot: string; // HH:MM format
      riskLevel: 'low' | 'medium' | 'high';
      reasoning: string;
    }[];
  }[];
  weeklySchedule: {
    dayOfWeek: number; // 0=Sunday, 1=Monday, etc.
    recommendedTimes: {
      time: string; // HH:MM format
      predictedMood: string;
      successProbability: number;
      reasoning: string;
      flexibility: 'fixed' | 'flexible' | 'optional';
    }[];
    moodBasedAlternatives: {
      ifMood: string;
      alternativeTime: string;
      reasoning: string;
    }[];
  }[];
  adaptiveRules: {
    condition: string; // e.g., "if mood is sad and intensity > 7"
    action: 'reschedule' | 'modify_habit' | 'skip_today' | 'add_support_habit';
    parameters: {
      newTime?: string;
      modificationId?: string;
      supportHabitId?: string;
      reasoning: string;
    };
  }[];
  learningData: {
    totalAttempts: number;
    successfulAdaptations: number;
    userFeedback: {
      rating: number; // 1-5
      comment?: string;
      timestamp: string;
    }[];
  };
  lastUpdated: string;
  nextReviewDate: string;
}

export interface PersonalizedCoachingData {
  moodSpecificModifications: MoodSpecificHabitModification[];
  emotionalHabitStacking: EmotionalHabitStackingSuggestion[];
  moodImprovementRecommendations: MoodImprovementHabitRecommendation[];
  personalizedMessages: PersonalizedMotivationalMessage[];
  adaptiveSchedules: AdaptiveHabitSchedule[];
  lastUpdated: string;
}

// Theme types
export type ThemeColors = {
  // Background colors
  background: string;
  surface: string;
  card: string;
  
  // Text colors
  text: string;
  textSecondary: string;
  textMuted: string;
  
  // Primary colors
  primary: string;
  primaryLight: string;
  primaryExtraLight: string;
  primaryDark: string;
  
  // Accent colors
  accent: string;
  accentLight: string;
  
  // Status colors
  success: string;
  warning: string;
  error: string;
  
  // UI colors
  border: string;
  shadow: string;
  overlay: string;
};

export type Theme = {
  id: string;
  name: string;
  colors: ThemeColors;
  isDark: boolean;
  isPremium?: boolean;
};

export type ThemePreference = {
  themeId: string;
  customColors?: Partial<ThemeColors>;
};

// Add these new types at the end of the file
export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  bio?: string;
  dateOfBirth?: string;
  location?: string;
  coverImage?: string;
  joinedAt: string;
  onboardingCompleted?: boolean; // Track if user has completed onboarding
  preferences: {
    notifications: boolean;
    emailUpdates: boolean;
    publicProfile: boolean;
  };
  stats: {
    totalHabits: number;
    completedHabits: number;
    currentStreak: number;
    longestStreak: number;
  };
}

export interface ProfileUpdateData {
  name?: string;
  bio?: string;
  dateOfBirth?: string;
  location?: string;
  avatar?: string;
  coverImage?: string;
  preferences?: Partial<User['preferences']>;
  onboardingCompleted?: boolean;
}

export interface MoodData {
  moodState: string;
  intensity: number;
  emoji: string;
  color: string;
  contextTags: string[];
  note?: string;
  voiceNote?: string;
  photo?: string;
}

export interface MoodAwareNotification {
  id: string;
  type: 'mood_reminder' | 'encouragement' | 'celebration' | 'check_in' | 'weekly_summary';
  title: string;
  body: string;
  scheduledFor: string; // ISO timestamp
  moodContext?: {
    targetMood: string;
    currentMoodIntensity?: number;
    moodPattern?: 'improving' | 'declining' | 'stable';
  };
  habitContext?: {
    habitId: string;
    habitTitle: string;
    riskLevel?: 'low' | 'medium' | 'high';
    streakDays?: number;
  };
  personalization: {
    tone: 'encouraging' | 'empathetic' | 'energizing' | 'calming' | 'celebratory';
    urgency: 'low' | 'medium' | 'high';
    timing: 'immediate' | 'optimal' | 'flexible';
  };
  data: Record<string, any>;
}

export interface NotificationSchedule {
  userId: string;
  moodBasedReminders: {
    moodState: string;
    optimalTimes: string[]; // HH:MM format
    frequency: 'daily' | 'weekly' | 'as_needed';
    enabled: boolean;
  }[];
  encouragementSettings: {
    lowMoodThreshold: number; // 1-10 scale
    consecutiveSkipsThreshold: number;
    enabled: boolean;
  };
  celebrationSettings: {
    moodImprovementThreshold: number;
    streakMilestones: number[];
    enabled: boolean;
  };
  checkInSettings: {
    riskPatternDetection: boolean;
    missedCheckInReminders: boolean;
    frequency: 'daily' | 'twice_daily' | 'weekly';
  };
  weeklySummarySettings: {
    dayOfWeek: number; // 0=Sunday
    time: string; // HH:MM
    includeInsights: boolean;
    enabled: boolean;
  };
}

export interface StreakMilestone {
  id: string;
  habitId: string;
  streakLength: number;
  achievedAt: string; // ISO date string
  xpEarned: number;
  celebrationShown: boolean;
}

// Add these interfaces before the GamificationData interface (around line 590)

export interface UserLevel {
  level: number;
  currentXP: number;
  xpToNextLevel: number;
  totalXP: number;
  title: string;
  perks: string[];
}

export interface Achievement {
  id: string;
  title?: string; // Keep for backward compatibility
  titleKey?: string; // Translation key for title
  description?: string; // Keep for backward compatibility
  descriptionKey?: string; // Translation key for description
  icon: string;
  xpReward: number;
  condition: string;
  category: 'habit' | 'streak' | 'mood' | 'social' | 'milestone' | 'learning';
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  unlockedAt?: string; // ISO date string
}

// Add this interface before EnhancedMoodEntry
export interface MoodEntry {
  id: string;
  date: string; // ISO date string
  moodState: 'happy' | 'sad' | 'anxious' | 'energetic' | 'tired' | 'stressed' | 'calm';
  intensity: number; // 1-10 scale
  note?: string;
  triggers?: ('work' | 'relationships' | 'health' | 'weather' | 'sleep' | 'exercise' | 'social')[];
  timestamp: string; // Exact time of mood entry
}

export interface EnhancedMoodEntry extends MoodEntry {
  id: string;
  date: string; // ISO date string
  moodState: 'happy' | 'sad' | 'anxious' | 'energetic' | 'tired' | 'stressed' | 'calm';
  intensity: number; // 1-10 scale
  note?: string;
  triggers?: ('work' | 'relationships' | 'health' | 'weather' | 'sleep' | 'exercise' | 'social')[];
  timestamp: string; // Exact time of mood entry
  location?: {
    latitude?: number;
    longitude?: number;
    address?: string;
  };
  weather?: {
    condition: string;
    temperature: number;
  };
  context: {
    activity: string;
    environment: 'home' | 'work' | 'outdoors' | 'social' | 'travel';
    socialContext: 'alone' | 'with_family' | 'with_friends' | 'with_colleagues';
  };
  deviceMetrics?: {
    batteryLevel?: number;
    screenTime?: number;
    stepCount?: number;
  };
}

export interface GamificationData {
  userLevel: UserLevel;
  achievements: Achievement[];
  unlockedAchievements: string[]; // Achievement IDs
  streakMilestones: StreakMilestone[];
  moodEntries: MoodEntry[];
  dailyXPEarned: number;
  lastMoodCheckIn?: string; // ISO date string
  // NEW: Habit-Mood Integration
  habitMoodEntries: HabitMoodEntry[]; // Track mood at habit completion/skip
  xp: number; // Add missing xp property
  // Phase 3A: Learning Integration
  coursesEnrolled?: string[];
  coursesCompleted?: string[];
  modulesCompleted?: string[];
  guidedSetupsCompleted?: string[];
  learningStreak?: number;
  knowledgeShared?: number;
  communityInteractions?: number;
  crossFeatureUsage?: {
    habitCreationFromLibrary: number;
    moodTrackingFromLibrary: number;
    communitySharingFromLibrary: number;
    analyticsFromLibrary: number;
  };
  // Phase 3B: Social Learning Integration
  studyGroupsCreated?: number;
  studyGroupsJoined?: number;
  studySessionsCompleted?: number;
  studySessionsLed?: number;
  peerRecommendationsGiven?: number;
  peerRecommendationsReceived?: number;
  learningCircleContributions?: number;
  collaborativeSessions?: number;
}

export interface MoodTrigger {
  id: string;
  category: 'internal' | 'external' | 'social' | 'environmental' | 'physiological';
  name: string;
  description: string;
  severity: 1 | 2 | 3 | 4 | 5; // Impact level
  frequency: number; // How often this trigger affects the user
  personalizedTags?: string[]; // User-defined custom tags
}

export interface TriggerPattern {
  triggerId: string;
  timePatterns: {
    hourOfDay: number[];
    dayOfWeek: number[];
    seasonality: 'spring' | 'summer' | 'fall' | 'winter';
  };
  correlatedMoods: string[];
  interventionStrategies: string[];
}

export interface SubscriptionTier {
  id: string;
  name: string;
  price: {
    monthly: number;
    yearly: number;
    currency: string;
  };
  features: {
    maxHabits: number;
    analyticsDays: number;
    aiSuggestionsPerWeek: number;
    themes: number;
    remindersPerHabit: number;
    socialFeatures: boolean;
    dataExport: boolean;
    customReminders: boolean;
    moodHabitCorrelations: boolean;
    advancedAnalytics: boolean;
    wellnessIntegration: boolean;
    performanceAlerts: boolean;
    patternInsights: boolean;
    teamManagement: boolean;
    hipaaCompliance: boolean;
    whiteLabeling: boolean;
  };
  limits: {
    habits: number;
    analyticsDays: number;
    aiSuggestionsPerWeek: number;
    themes: number;
    remindersPerHabit: number;
  };
  isActive: boolean;
}

export interface SubscriptionStatus {
  tier: string;
  isActive: boolean;
  startDate: string;
  endDate?: string;
  autoRenew: boolean;
  platform: 'ios' | 'android' | 'web' | 'google_pay';
  period?: 'monthly' | 'yearly'; // Add subscription period
  planId?: string; // Add plan ID for tracking which plan was selected
  transactionId?: string;
  receiptData?: string;
}

export interface PricingPlan {
  id: string;
  name: string;
  price: number;
  period: 'monthly' | 'yearly';
  currency: string;
  savings?: number; // Percentage savings for yearly
  features: string[];
  isPopular?: boolean;
  isIntroductory?: boolean;
}

export interface FeatureGate {
  feature: string;
  tier: 'free' | 'pro' | 'professional' | 'enterprise';
  limit?: number;
  message?: string;
}

export interface UpgradePrompt {
  id: string;
  trigger: 'habit_limit' | 'analytics_limit' | 'ai_limit' | 'theme_limit' | 'reminder_limit' | 'social_feature' | 'data_export' | 'wellness_integration' | 'pattern_insights' | 'performance_alerts' | 'mood_correlations' | 'onboarding' | 'courses';
  title: string;
  message: string;
  ctaText: string;
  dismissible: boolean;
  shownCount: number;
  lastShown?: string;
}

// Advanced Community Features Types
export interface LearningChallenge {
  id: string;
  title: string;
  description: string;
  category: 'habit' | 'wellness' | 'productivity' | 'learning' | 'social';
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  duration: number; // days
  participants: number;
  maxParticipants?: number;
  startDate: string;
  endDate: string;
  rewards: {
    xp: number;
    badges?: string[];
    achievements?: string[];
  };
  requirements: {
    habits?: string[];
    streakDays?: number;
    completionRate?: number;
  };
  progress: {
    completed: boolean;
    currentDay: number;
    totalDays: number;
    participantsCompleted: number;
  };
  createdBy: string;
  createdAt: string;
  isActive: boolean;
}

export interface ChallengeParticipant {
  userId: string;
  challengeId: string;
  joinedAt: string;
  progress: {
    currentDay: number;
    completedDays: number[];
    streak: number;
    lastActivity: string;
  };
  status: 'active' | 'completed' | 'abandoned';
  completedAt?: string;
}

export interface PeerMentor {
  id: string;
  userId: string;
  expertise: string[];
  experience: number; // years
  rating: number;
  menteesCount: number;
  availability: {
    days: string[];
    timeSlots: string[];
  };
  bio: string;
  achievements: string[];
  isActive: boolean;
  createdAt: string;
}

export interface MentorshipRequest {
  id: string;
  menteeId: string;
  mentorId: string;
  topic: string;
  description: string;
  goals: string[];
  preferredTimes: string[];
  status: 'pending' | 'accepted' | 'rejected' | 'completed';
  createdAt: string;
  acceptedAt?: string;
  completedAt?: string;
}

export interface KnowledgeShare {
  id: string;
  authorId: string;
  title: string;
  content: string;
  type: 'article' | 'tip' | 'experience' | 'tutorial';
  category: 'habits' | 'wellness' | 'productivity' | 'learning' | 'motivation';
  tags: string[];
  likes: number;
  shares: number;
  comments: number;
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CommunityAnalytics {
  totalMembers: number;
  activeMembers: number;
  challengesCreated: number;
  challengesCompleted: number;
  mentorshipConnections: number;
  knowledgeShares: number;
  engagementRate: number;
  topContributors: {
    userId: string;
    name: string;
    contributions: number;
    impact: number;
  }[];
  popularTopics: {
    topic: string;
    engagement: number;
  }[];
}

export interface SocialLearningCircle {
  id: string;
  name: string;
  description: string;
  category: 'study' | 'wellness' | 'productivity' | 'creative';
  maxMembers: number;
  currentMembers: number;
  topics: string[];
  meetingSchedule: {
    frequency: 'daily' | 'weekly' | 'biweekly';
    dayOfWeek?: number;
    time: string;
  };
  isPrivate: boolean;
  createdBy: string;
  createdAt: string;
  isActive: boolean;
}

export interface CircleMember {
  userId: string;
  circleId: string;
  role: 'leader' | 'moderator' | 'member';
  joinedAt: string;
  contributions: number;
  lastActivity: string;
}

export interface CircleSession {
  id: string;
  circleId: string;
  title: string;
  description: string;
  duration: number; // minutes
  scheduledAt: string; // ISO date string
  status: 'scheduled' | 'in-progress' | 'completed' | 'cancelled';
  participants: string[];
  materials: string[];
  notes?: string;
  createdBy: string;
  createdAt: string;
}
