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
