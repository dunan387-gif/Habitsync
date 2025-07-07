export interface Habit {
  id: string;
  title: string;
  icon?: string;
  notes?: string;
  streak: number;
  bestStreak?: number;
  createdAt: string;
  completedToday: boolean;
  completedDates: string[]; // ISO date strings
  reminderTime?: string; // Time in 24-hour format (HH:MM)
  reminderEnabled: boolean;
  order: number; // Add this field for drag & drop ordering
  // AI Enhancement fields
  category?: string;
  difficulty?: 'easy' | 'medium' | 'hard';
  completionTimes?: string[]; // Track when user typically completes habits
  lastMotivationalNudge?: string; // ISO date string
  // Add this missing property:
  isNewStreakRecord?: boolean; // Flag to indicate if current streak is a new record
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
  coverImage?: string; // Add this new field
  joinedAt: string;
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
  coverImage?: string; // Add this new field
  preferences: Partial<User['preferences']>;
}

export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  bio?: string;
  dateOfBirth?: string;
  location?: string;
  coverImage?: string; // Add this new field
  joinedAt: string;
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

// Add these new gamification types
// Gamification Types
export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  category: 'streak' | 'completion' | 'consistency' | 'milestone' | 'special';
  requirement: {
    type: 'streak' | 'total_completions' | 'consecutive_days' | 'habit_count' | 'perfect_week';
    value: number;
    habitId?: string; // For habit-specific achievements
  };
  xpReward: number;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  unlockedAt?: string; // ISO date string
}

export interface UserLevel {
  level: number;
  currentXP: number;
  xpToNextLevel: number;
  totalXP: number;
  title: string;
  perks: string[];
}

export interface MoodEntry {
  id: string;
  date: string; // ISO date string
  mood: 1 | 2 | 3 | 4 | 5; // 1 = very bad, 5 = excellent
  note?: string;
  tags?: string[]; // e.g., ['stressed', 'energetic', 'focused']
}

export interface StreakMilestone {
  id: string;
  habitId: string;
  streakLength: number;
  achievedAt: string; // ISO date string
  xpEarned: number;
  celebrationShown: boolean;
}

export interface GamificationData {
  userLevel: UserLevel;
  achievements: Achievement[];
  unlockedAchievements: string[]; // Achievement IDs
  streakMilestones: StreakMilestone[];
  moodEntries: MoodEntry[];
  dailyXPEarned: number;
  lastMoodCheckIn?: string; // ISO date string
}
