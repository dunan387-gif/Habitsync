import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from './AuthContext';
import { 
  Habit, 
  AIHabitSuggestion, 
  SmartReminderSuggestion, 
  HabitMoodCorrelation, 
  MoodHabitAnalytics, 
  HabitMoodEntry, 
  HabitSuccessPrediction, 
  RiskAlert, 
  OptimalTimingSuggestion, 
  MoodTriggeredRecommendation, 
  WeeklyForecast, 
  AIPredictiveAnalytics,
  MoodSpecificHabitModification,
  EmotionalHabitStackingSuggestion,
  MoodImprovementHabitRecommendation,
  PersonalizedMotivationalMessage,
  AdaptiveHabitSchedule,
  PersonalizedCoachingData
} from '@/types';
import { 
  scheduleHabitReminder, 
  scheduleHabitReminderWithTracking,
  cancelHabitReminder, 
  requestNotificationPermissions,
  checkAndScheduleMotivationalSupport,
  scheduleSmartReminderSuggestion,
  scheduleMoodAwareReminder,
  scheduleEncouragementForDifficultMood,
  scheduleMoodImprovementCelebration,
  scheduleRiskPatternCheckIn,
  scheduleWeeklyMoodHabitSummary,
  saveNotificationSchedule,
  getNotificationSchedule,
  schedulePostHabitMoodCheck,
  updateHabitNotificationIds,
  getHabitNotificationIds,
  checkNotificationHealth,
  cleanupOrphanedNotifications
} from '@/services/NotificationService';
import { aiService } from '@/services/AIService';
import { mlPatternRecognitionService } from '@/services/MLPatternRecognitionService';
import { useCelebration } from '@/context/CelebrationContext';
import { useLanguage } from './LanguageContext';
import { useGamification } from './GamificationContext';
import { useSubscription } from './SubscriptionContext';
import { useError } from './ErrorContext';
import { ErrorType } from '@/utils/errorHandler';
import { getLocalDateString, isToday, timezoneManager } from '@/utils/timezone';


type HabitContextType = {
  habits: Habit[] | null;
  isLoading: boolean;
  addHabit: (habit: Habit) => void;
  updateHabit: (id: string, updatedHabit: Habit) => void;
  deleteHabit: (id: string) => void;
  deleteMultipleHabits: (ids: string[]) => void;
  toggleHabitCompletion: (id: string, preMood?: { moodState: string; intensity: number }) => void;
  reorderHabits: (habits: Habit[]) => void;
  getHabitById: (id: string) => Habit | undefined;
  getCompletionRate: (days: number) => number;
  getDailyCompletionData: (days: number) => DailyCompletionData[];
  getMonthlyCompletionData: (month: number, year: number) => MonthlyCompletionData[];
  getAIHabitSuggestions: () => AIHabitSuggestion[];
  getSmartReminderSuggestions: () => SmartReminderSuggestion[];
  triggerMotivationalCheck: () => void;
  getTotalCompletions: () => number;
  getOverallCompletionRate: () => number;
  // NEW: Habit-Mood Integration methods
  addPostHabitMood: (habitId: string, postMood: { moodState: string; intensity: number; timeAfter: number }) => Promise<void>;
  getHabitMoodCorrelations: () => HabitMoodCorrelation[];
  getMoodHabitAnalytics: () => MoodHabitAnalytics;
  getAdvancedMoodHabitAnalytics: () => any;
  // NEW: AI-Powered Predictive Intelligence methods
  getHabitSuccessPredictions: (currentMood?: { moodState: string; intensity: number }) => HabitSuccessPrediction[];
  getRiskAlerts: (currentMood?: { moodState: string; intensity: number }) => RiskAlert[];
  getOptimalTimingSuggestions: (currentMood: { moodState: string; intensity: number }) => OptimalTimingSuggestion[];
  getMoodTriggeredRecommendations: (currentMood: { moodState: string; intensity: number }) => MoodTriggeredRecommendation;
  getWeeklyForecast: () => WeeklyForecast;
  getAIPredictiveAnalytics: (currentMood?: { moodState: string; intensity: number }) => AIPredictiveAnalytics;
  // NEW: Personalized Coaching methods
  getMoodSpecificHabitModifications: (habitId: string, currentMood: { moodState: string; intensity: number }) => MoodSpecificHabitModification | null;
  getEmotionalHabitStackingSuggestions: (targetMood: string, currentMood: { moodState: string; intensity: number }) => EmotionalHabitStackingSuggestion[];
  getMoodImprovementRecommendations: (currentMood: { moodState: string; intensity: number }, targetMood?: { moodState: string; intensity: number }) => MoodImprovementHabitRecommendation;
  getPersonalizedMotivationalMessage: (currentMood: { moodState: string; intensity: number }) => PersonalizedMotivationalMessage;
  getAdaptiveHabitSchedule: (habitId: string) => AdaptiveHabitSchedule | null;
  updateAdaptiveSchedule: (habitId: string, feedback: { rating: number; comment?: string }) => void;
  getPersonalizedCoachingData: () => PersonalizedCoachingData;
  triggerSmartNotifications: () => Promise<void>;
};

type DailyCompletionData = {
  date: string;
  dayShort: string;
  totalCount: number;
  completedCount: number;
  completionRate: number;
};

type MonthlyCompletionData = {
  day: number;
  completionRate: number;
};

const HabitContext = createContext<HabitContextType | undefined>(undefined);

export function HabitProvider({ children }: { children: ReactNode }) {
  const [habits, setHabits] = useState<Habit[] | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const { showCelebration } = useCelebration();
  const { t } = useLanguage();
  const { showError } = useError();
  const { user } = useAuth();

  // Make gamification optional
  let addXP: ((amount: number, source: string) => Promise<void>) | undefined;
  let checkAchievements: ((habits: Habit[]) => Promise<void>) | undefined;
  let addHabitMoodEntry: ((entry: HabitMoodEntry) => Promise<void>) | undefined;
  let getHabitMoodEntries: ((habitId?: string) => HabitMoodEntry[]) | undefined;
  let getMoodEntries: (() => any[]) | undefined;

  try {
    const gamification = useGamification();
    addXP = gamification.addXP;
    checkAchievements = gamification.checkAchievements;
    addHabitMoodEntry = gamification.addHabitMoodEntry;
    getHabitMoodEntries = gamification.getHabitMoodEntries;
    getMoodEntries = gamification.getMoodEntries;
  } catch (error) {
    // GamificationContext not available yet
  }

  // Make subscription optional
  let canAddHabit: ((currentHabitCount: number) => boolean) | undefined;
  let showUpgradePrompt: ((trigger: any) => void) | undefined;
  let trackFeatureUsage: ((feature: string) => void) | undefined;

  try {
    const subscription = useSubscription();
    canAddHabit = subscription.canAddHabit;
    showUpgradePrompt = subscription.showUpgradePrompt;
    trackFeatureUsage = subscription.trackFeatureUsage;
  } catch (error) {
    // SubscriptionContext not available yet
  }

  // Load habits from storage on mount and when user changes
  useEffect(() => {
    // Only load data if auth is not loading
    if (user?.id) {
      // Initialize timezone manager first
      timezoneManager.initialize().then(() => {
        loadHabits();
      }).catch(error => {
        console.error('Failed to initialize timezone manager:', error);
        loadHabits(); // Still load habits even if timezone fails
      });
    }
  }, [user?.id]); // Reload habits when user ID changes

  // Separate effect for date checking that runs after habits are loaded
  useEffect(() => {
    if (habits === null) return; // Don't run until habits are loaded
    
    let isMounted = true;
    
    // Reset completedToday flag at midnight
    const checkDate = async () => {
      if (!isMounted) return; // Prevent state updates if component unmounted
      
      try {
        // Ensure timezone manager is initialized
        await timezoneManager.initialize();
        
        const now = new Date();
        const today = getLocalDateString(now);
        
        const dateKey = user ? `lastCheckDate_${user.id}` : 'lastCheckDate_anonymous';
        const lastDate = await AsyncStorage.getItem(dateKey);
        
        console.log('🔍 Date check:', { today, lastDate, shouldReset: lastDate !== today });
        
        if (lastDate !== today && isMounted) {
          console.log('🔄 Resetting completedToday flags for new date');
          await resetCompletedToday();
          await AsyncStorage.setItem(dateKey, today);
        }
      } catch (error) {
        console.error('Failed to check date:', error);
      }
    };
    
    checkDate();
    const interval = setInterval(checkDate, 60000); // Check every minute
    
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [habits, user?.id]); // Add proper dependencies

  const loadHabits = async () => {
    try {
      // Use user-specific storage key
      const storageKey = user ? `habits_${user.id}` : 'habits_anonymous';
      const storedHabits = await AsyncStorage.getItem(storageKey);
      
      console.log('📂 Loading habits from storage:', { storageKey, hasData: !!storedHabits });
      
      if (storedHabits) {
        const parsedHabits = JSON.parse(storedHabits);
        
        // Ensure all habits have the order property for backward compatibility
        const habitsWithOrder = parsedHabits.map((habit: any, index: number) => ({
          ...habit,
          order: habit.order !== undefined ? habit.order : index
        }));
        
        console.log('📋 Loaded habits:', { 
          count: habitsWithOrder.length,
          completedTodayCount: habitsWithOrder.filter((h: any) => h.completedToday).length
        });
        
        setHabits(habitsWithOrder);
      } else {
        console.log('📭 No habits found in storage');
        setHabits([]);
      }
    } catch (error) {
      console.error('Failed to load habits:', error);
      showError(error as Error, {
        retryable: true,
      });
      setHabits([]);
    } finally {
      setIsLoading(false);
    }
  };
  
  const saveHabits = async (updatedHabits: Habit[]) => {
    try {
      // Use user-specific storage key
      const storageKey = user ? `habits_${user.id}` : 'habits_anonymous';
      const habitsData = JSON.stringify(updatedHabits);
      await AsyncStorage.setItem(storageKey, habitsData);
      
      console.log('💾 Habits saved successfully:', { 
        storageKey, 
        habitCount: updatedHabits.length,
        completedTodayCount: updatedHabits.filter(h => h.completedToday).length
      });
    } catch (error) {
      console.error('Failed to save habits:', error);
      showError(error as Error, {
        retryable: true,
      });
    }
  };
  
  const resetCompletedToday = async () => {
    if (!habits || habits.length === 0) return;
    
    try {
      const updatedHabits = habits.map(habit => ({
        ...habit,
        completedToday: false,
      }));
      
      setHabits(updatedHabits);
      await saveHabits(updatedHabits);
  
    } catch (error) {
      console.error('Failed to reset completed today:', error);
    }
  };
  
  // Update the addHabit function
  const addHabit = async (habit: Habit) => {
    if (!habits) return;
    
    try {
      // Check subscription limits
      if (canAddHabit && !canAddHabit(habits.length)) {
        showUpgradePrompt?.('habit_limit');
        throw new Error('Habit limit reached. Please upgrade to Pro for unlimited habits.');
      }
      
      const newHabit = {
        ...habit,
        order: habits.length // Set order to the end
      };
      const updatedHabits = [...habits, newHabit];
      setHabits(updatedHabits);
      await saveHabits(updatedHabits);
      
      // Track feature usage
      trackFeatureUsage?.('habit_created');
      
      // Schedule reminder if enabled with tracking
      if ((habit.reminderEnabled && habit.reminderTime) || (habit.reminders && habit.reminders.length > 0)) {
        const hasPermission = await requestNotificationPermissions();
        if (hasPermission) {
          const notificationIds = await scheduleHabitReminderWithTracking(newHabit);
          if (notificationIds) {
            // Update habit with notification IDs
            const habitWithNotifications = {
              ...newHabit,
              notificationIds,
              lastNotificationUpdate: new Date().toISOString()
            };
            const updatedHabitsWithNotifications = habits.map(h => 
              h.id === newHabit.id ? habitWithNotifications : h
            );
            setHabits(updatedHabitsWithNotifications);
            await saveHabits(updatedHabitsWithNotifications);
          }
        }
      }
    } catch (error) {
      console.error('Failed to add habit:', error);
      throw error; // Re-throw to handle in UI
    }
  };
  
  // Update the updateHabit function
  const updateHabit = async (id: string, updatedHabit: Habit) => {
    if (!habits) return;
    
    try {
      const updatedHabits = habits.map(habit => 
        habit.id === id ? updatedHabit : habit
      );
      
      setHabits(updatedHabits);
      await saveHabits(updatedHabits);
      
      // Handle reminder changes with tracking
      if ((updatedHabit.reminderEnabled && updatedHabit.reminderTime) || (updatedHabit.reminders && updatedHabit.reminders.length > 0)) {
        const hasPermission = await requestNotificationPermissions();
        if (hasPermission) {
          const notificationIds = await scheduleHabitReminderWithTracking(updatedHabit);
          if (notificationIds) {
            // Update habit with new notification IDs
            const habitWithNotifications = {
              ...updatedHabit,
              notificationIds,
              lastNotificationUpdate: new Date().toISOString()
            };
            const updatedHabitsWithNotifications = habits.map(h => 
              h.id === id ? habitWithNotifications : h
            );
            setHabits(updatedHabitsWithNotifications);
            await saveHabits(updatedHabitsWithNotifications);
          }
        }
      } else {
        await cancelHabitReminder(id, updatedHabit.notificationIds);
        // Clear notification IDs from habit
        const habitWithoutNotifications = {
          ...updatedHabit,
          notificationIds: undefined,
          lastNotificationUpdate: new Date().toISOString()
        };
        const updatedHabitsWithoutNotifications = habits.map(h => 
          h.id === id ? habitWithoutNotifications : h
        );
        setHabits(updatedHabitsWithoutNotifications);
        await saveHabits(updatedHabitsWithoutNotifications);
      }
    } catch (error) {
      console.error('Failed to update habit:', error);
    }
  };
  
  // Update the deleteHabit function
  const deleteHabit = async (id: string) => {
    if (!habits) return;
    
    try {
      const habitToDelete = habits.find(habit => habit.id === id);
      const updatedHabits = habits.filter(habit => habit.id !== id);
      setHabits(updatedHabits);
      await saveHabits(updatedHabits);
      
      // Cancel any reminders for this habit using stored IDs
      if (habitToDelete) {
        await cancelHabitReminder(id, habitToDelete.notificationIds);
      }
    } catch (error) {
      console.error('Failed to delete habit:', error);
    }
  };
  
  // Bulk delete function
  const deleteMultipleHabits = async (ids: string[]) => {
    if (!habits || ids.length === 0) return;
    
    try {
      const habitsToDelete = habits.filter(habit => ids.includes(habit.id));
      const updatedHabits = habits.filter(habit => !ids.includes(habit.id));
      setHabits(updatedHabits);
      await saveHabits(updatedHabits);
      
      // Cancel reminders for all deleted habits using stored IDs
      for (const habit of habitsToDelete) {
        await cancelHabitReminder(habit.id, habit.notificationIds);
      }
    } catch (error) {
      console.error('Failed to delete multiple habits:', error);
    }
  };
  
  // Enhanced toggleHabitCompletion with gamification integration
  const toggleHabitCompletion = async (id: string, preMood?: { moodState: string; intensity: number }) => {
    if (!habits) return;
    
    try {
      // Ensure timezone manager is initialized
      await timezoneManager.initialize();
      
      const now = new Date();
      const today = getLocalDateString(now);
      const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
      
      console.log('🔄 Toggling habit completion:', { id, today, currentTime });
      
      // Add post-mood tracking function
      const schedulePostMoodCheck = (habitId: string, completionTime: string) => {
        // Schedule notifications at 15min, 1hr, and 3hr intervals
        const intervals = [15, 60, 180]; // minutes
        
        intervals.forEach(minutes => {
          setTimeout(() => {
            // Trigger post-mood check notification
            schedulePostHabitMoodCheck(habitId, completionTime, minutes);
          }, minutes * 60 * 1000);
        });
      };
      
      const updatedHabits = habits.map(habit => {
        if (habit.id === id) {
          const wasCompleted = habit.completedToday;
          const completedDates = wasCompleted
            ? habit.completedDates.filter(date => date !== today)
            : [...habit.completedDates, today];
          
          // Track completion times for AI analysis
          const completionTimes = wasCompleted
            ? (habit.completionTimes || []).slice(0, -1) // Remove last time if uncompleting
            : [...(habit.completionTimes || []), currentTime]; // Add current time
          
          // Calculate streak
          let streak = 0;
          let isNewStreakRecord = false;
          if (!wasCompleted) {
            const sortedDates = [...completedDates].sort();
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);
            const yesterdayStr = getLocalDateString(yesterday);
            
            if (sortedDates.includes(yesterdayStr)) {
              streak = habit.streak + 1;
            } else {
              streak = 1;
            }
            
            // Check if this is a new streak record
            isNewStreakRecord = streak > (habit.bestStreak || 0);
          } else {
            streak = Math.max(0, habit.streak - 1);
          }
          
          // NEW: Create habit-mood entry
          const habitMoodEntry: HabitMoodEntry = {
            id: `habit_mood_${Date.now()}`,
            habitId: id,
            date: today,
            timestamp: now.toISOString(),
            action: wasCompleted ? 'skipped' : 'completed', // If was completed, we're now skipping it
            preMood: preMood ? {
              moodState: preMood.moodState as any,
              intensity: preMood.intensity
            } : undefined,
            triggers: [], // Can be filled later
            note: undefined
          };
          
          // Add mood entry to habit
          const updatedMoodEntries = [...(habit.moodEntries || []), habitMoodEntry];
          
          // Store in gamification context as well
          if (addHabitMoodEntry) {
            addHabitMoodEntry(habitMoodEntry);
          }
          
          return {
            ...habit,
            completedToday: !wasCompleted,
            completedDates,
            completionTimes: completionTimes.slice(-10), // Keep last 10 completion times
            streak,
            bestStreak: isNewStreakRecord ? streak : (habit.bestStreak || streak),
            isNewStreakRecord, // Temporary flag for celebration
            moodEntries: updatedMoodEntries
          };
        }
        return habit;
      });
      
      setHabits(updatedHabits);
      await saveHabits(updatedHabits);
      
      // Debug logging in development
      if (__DEV__) {
        console.log('🔄 Habit completion toggled:', {
          habitId: id,
          isCompleted: updatedHabits.find(h => h.id === id)?.completedToday,
          totalCompleted: updatedHabits.filter(h => h.completedToday).length
        });
      }
      
      // Schedule post-mood check if habit was completed
      const completedHabit = updatedHabits.find(h => h.id === id);
      if (completedHabit && completedHabit.completedToday) {
        schedulePostMoodCheck(id, currentTime);
      }
      
      // Make gamification calls conditional
      if (completedHabit && completedHabit.completedToday && addXP) {
        // Use the correct XP amount from gamification system
        await addXP(10, 'habit_completion'); // Changed from 20 to 10
        
        // Bonus XP for streaks
        if (completedHabit.streak > 0) {
          const bonusXP = Math.min(completedHabit.streak * 2, 50);
          await addXP(bonusXP, 'streak_bonus');
        }
      }
      
      // Check for achievements - this should happen AFTER XP is awarded
      if (checkAchievements) {
        await checkAchievements(updatedHabits);
      }
      
      // Check for celebrations
      checkForCelebrations(updatedHabits, id);
      
      // ✅ Make AI analysis truly asynchronous
      setTimeout(async () => {
        try {
          await checkAndScheduleMotivationalSupport(updatedHabits, t);
          
          // Process AI suggestions in smaller batches
          const suggestions = aiService.generateSmartReminderSuggestions(updatedHabits, t);
          const topSuggestion = suggestions[0]; // Only process the top suggestion
          
          if (topSuggestion) {
            const habit = updatedHabits.find(h => h.id === topSuggestion.habitId);
            if (habit) {
              await scheduleSmartReminderSuggestion(
                habit.title,
                topSuggestion.suggestedTime,
                topSuggestion.reason
              );
            }
          }

                // 🧠 NEW: Trigger smart notifications after habit completion
      // This will analyze mood patterns and send intelligent notifications
      setTimeout(async () => {
        try {
          await triggerSmartNotifications();
        } catch (error) {
          console.error('❌ Failed to trigger smart notifications after completion:', error);
        }
      }, 3000); // Additional delay to ensure mood data is processed

      // 📊 NEW: Record user interaction pattern for ML analysis
      setTimeout(async () => {
        try {
          const now = new Date();
          const completedHabit = updatedHabits.find(h => h.id === id);
          await mlPatternRecognitionService.recordUserInteraction({
            habitId: id,
            notificationType: 'habit_completion',
            responseType: completedHabit?.completedToday ? 'completed' : 'ignored',
            responseTime: 0, // Immediate response
            moodState: preMood?.moodState || 'neutral',
            moodIntensity: preMood?.intensity || 5,
            timeOfDay: now.getHours(),
            dayOfWeek: now.getDay()
          });
        } catch (error) {
          console.error('❌ Failed to record user interaction pattern:', error);
        }
      }, 1000);
        } catch (error) {
          console.error('AI analysis error:', error);
        }
      }, 2000); // Delay to avoid overwhelming user
    } catch (error) {
      console.error('Failed to toggle habit completion:', error);
    }
  };
  
  const checkForCelebrations = (updatedHabits: Habit[], completedHabitId: string) => {
    const completedHabit = updatedHabits.find(h => h.id === completedHabitId);
    
    if (!completedHabit || !completedHabit.completedToday) {
      return;
    }
    
    // Check for streak milestones
    if (completedHabit.isNewStreakRecord && completedHabit.streak >= 7) {
      const streakMessage = getStreakMessage(completedHabit.streak);
      console.log('🔥 Showing streak celebration:', streakMessage);
      showCelebration('streak', streakMessage);
      return; // Only show streak celebration
    }
    
    // Check if all habits are completed today
    const allCompleted = updatedHabits.every(habit => habit.completedToday);
    if (allCompleted && updatedHabits.length > 0) {
      console.log('🎉 Showing all complete celebration!');
      showCelebration('allComplete', '🎉 All habits complete today! You\'re crushing it!');
      return;
    }
    
    // Check for specific milestones
    if (completedHabit.streak === 30) {
      console.log('🏆 Showing 30-day milestone celebration!');
      showCelebration('milestone', '🏆 30-day streak! You\'re a habit master!');
    } else if (completedHabit.streak === 100) {
      console.log('💎 Showing 100-day milestone celebration!');
      showCelebration('milestone', '💎 100-day streak! Absolutely legendary!');
    }
    
    console.log('✅ Celebration check completed');
  };
  
  const getStreakMessage = (streak: number): string => {
    if (streak >= 100) return `💎 ${streak}-day streak! You're absolutely legendary!`;
    if (streak >= 50) return `🏆 ${streak}-day streak! You're a champion!`;
    if (streak >= 30) return `⭐ ${streak}-day streak! You're on fire!`;
    if (streak >= 14) return `🔥 ${streak}-day streak! Keep it burning!`;
    if (streak >= 7) return `🚀 ${streak}-day streak! You're unstoppable!`;
    return `🎯 ${streak}-day streak! Great momentum!`;
  };
      
      // AI Feature methods
      const getAIHabitSuggestions = useCallback((): AIHabitSuggestion[] => {
        if (!habits) return [];
        return aiService.generateHabitSuggestions(habits, t);
      }, [habits, t]);
  
      const getSmartReminderSuggestions = (): SmartReminderSuggestion[] => {
        if (!habits) return [];
        return aiService.generateSmartReminderSuggestions(habits, t);
      };
  
      const triggerMotivationalCheck = () => {
        if (habits) {
          checkAndScheduleMotivationalSupport(habits, t);
        }
      };
  
      const getHabitById = (id: string) => {
        if (!habits) return undefined;
        return habits.find(habit => habit.id === id);
      };
  
      const getCompletionRate = (days: number) => {
        if (!habits || habits.length === 0) return 0;
        
        const today = new Date();
        let totalPossible = 0;
        let totalCompleted = 0;
        
        // For each day in the range
        for (let i = 0; i < days; i++) {
          const date = new Date();
          date.setDate(today.getDate() - i);
          const dateStr = getLocalDateString(date);
          
          // For each habit, check if it was completed on this date
          habits.forEach(habit => {
            // Only count habits that existed on this date
            const habitCreationDate = new Date(habit.createdAt);
            if (habitCreationDate <= date) {
              totalPossible++;
              if (habit.completedDates.includes(dateStr)) {
                totalCompleted++;
              }
            }
          });
        }
        
        return totalPossible > 0 ? Math.round((totalCompleted / totalPossible) * 100) : 0;
      };
  
      const getDailyCompletionData = (days: number): DailyCompletionData[] => {
        if (!habits || habits.length === 0) return [];
        
        const data: DailyCompletionData[] = [];
        const today = new Date();
        
        // For each day in the range, starting from days ago to today
        for (let i = days - 1; i >= 0; i--) {
          const date = new Date();
          date.setDate(today.getDate() - i);
          const dateStr = getLocalDateString(date);
          const dayShort = date.toLocaleDateString('en-US', { weekday: 'short' }).charAt(0);
          
          let totalCount = 0;
          let completedCount = 0;
          
          // For each habit, check if it was completed on this date
          habits.forEach(habit => {
            // Only count habits that existed on this date
            const habitCreationDate = new Date(habit.createdAt);
            if (habitCreationDate <= date) {
              totalCount++;
              if (habit.completedDates.includes(dateStr)) {
                completedCount++;
              }
            }
          });
          
          const completionRate = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;
          
          data.push({
            date: dateStr,
            dayShort,
            totalCount,
            completedCount,
            completionRate,
          });
        }
        
        return data;
      };
  
      const getMonthlyCompletionData = (month: number, year: number): MonthlyCompletionData[] => {
        if (!habits || habits.length === 0) return [];
        
        const data: MonthlyCompletionData[] = [];
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        
        // For each day in the month
        for (let day = 1; day <= daysInMonth; day++) {
          const date = new Date(year, month, day);
          const dateStr = getLocalDateString(date);
          
          let totalCount = 0;
          let completedCount = 0;
          
          // For each habit, check if it was completed on this date
          habits.forEach(habit => {
            // Only count habits that existed on this date
            const habitCreationDate = new Date(habit.createdAt);
            if (habitCreationDate <= date) {
              totalCount++;
              if (habit.completedDates.includes(dateStr)) {
                completedCount++;
              }
            }
          });
          
          const completionRate = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;
          
          data.push({
            day,
            completionRate,
          });
        }
        
        return data;
      };
  
      const reorderHabits = useCallback((reorderedHabits: Habit[]) => {
        if (!habits) return;
        
        try {
          const updatedHabits = reorderedHabits.map((habit, index) => ({
            ...habit,
            order: index
          }));
          
          // Update state immediately for smooth UI
          setHabits(updatedHabits);
          
          // Debounce the save operation to avoid excessive writes
          const timeoutId = setTimeout(() => {
            saveHabits(updatedHabits).catch(error => {
              console.error('Failed to save reordered habits:', error);
            });
          }, 100);
          
          // Cleanup timeout if component unmounts
          return () => clearTimeout(timeoutId);
        } catch (error) {
          console.error('Failed to reorder habits:', error);
        }
      }, [habits, saveHabits]);
  
      const getTotalCompletions = (): number => {
        if (!habits || habits.length === 0) return 0;
        
        let totalCompletions = 0;
        habits.forEach(habit => {
          totalCompletions += habit.completedDates.length;
        });
        
        return totalCompletions;
      };
      
      const getOverallCompletionRate = (): number => {
        if (!habits || habits.length === 0) return 0;
        
        const today = new Date();
        let totalPossible = 0;
        let totalCompleted = 0;
        
        habits.forEach(habit => {
          const habitCreationDate = new Date(habit.createdAt);
          const daysSinceCreation = Math.floor((today.getTime() - habitCreationDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
          
          totalPossible += daysSinceCreation;
          totalCompleted += habit.completedDates.length;
        });
        
        return totalPossible > 0 ? Math.round((totalCompleted / totalPossible) * 100) : 0;
      };
  
      // NEW: Habit-Mood Integration functions
      const addPostHabitMood = async (habitId: string, postMood: { moodState: string; intensity: number; timeAfter: number }): Promise<void> => {
        try {
          if (addHabitMoodEntry) {
            // Validate moodState to ensure it matches the expected union type
            const validMoodStates = ['happy', 'sad', 'anxious', 'energetic', 'tired', 'stressed', 'calm'] as const;
            const moodState = validMoodStates.includes(postMood.moodState as any) 
              ? postMood.moodState as 'happy' | 'sad' | 'anxious' | 'energetic' | 'tired' | 'stressed' | 'calm'
              : 'calm'; // Default fallback
            
            const habitMoodEntry: HabitMoodEntry = {
              id: Date.now().toString(),
              habitId,
              date: getLocalDateString(), // Add required date field
              timestamp: new Date().toISOString(),
              action: 'completed', // Add required action field
              preMood: undefined,
              postMood: {
                moodState,
                intensity: postMood.intensity,
                timeAfter: postMood.timeAfter
              }
              // Remove completedAt - it doesn't exist in HabitMoodEntry
            };
            await addHabitMoodEntry(habitMoodEntry);
          }
        } catch (error) {
          console.error('Error adding post-habit mood:', error);
        }
      };
  
      const getHabitMoodCorrelations = useCallback((): HabitMoodCorrelation[] => {
  try {
    if (!getHabitMoodEntries || !habits) return [];
    
    const moodEntries = getHabitMoodEntries();
    const correlations: HabitMoodCorrelation[] = [];
    
    habits.forEach(habit => {
      const habitEntries = moodEntries.filter(entry => entry.habitId === habit.id);
      
      if (habitEntries.length > 0) {
        const completedEntries = habitEntries.filter(entry => entry.action === 'completed');
        const completionRate = completedEntries.length / habitEntries.length;
        
        // Calculate pre-mood averages
        const preMoodEntries = habitEntries.filter(entry => entry.preMood);
        const averagePreMoodIntensity = preMoodEntries.length > 0
          ? preMoodEntries.reduce((sum, entry) => sum + entry.preMood!.intensity, 0) / preMoodEntries.length
          : 0;
        
        // Calculate post-mood averages
        const postMoodEntries = habitEntries.filter(entry => entry.postMood);
        const averagePostMoodIntensity = postMoodEntries.length > 0
          ? postMoodEntries.reduce((sum, entry) => sum + entry.postMood!.intensity, 0) / postMoodEntries.length
          : 0;
        
        const moodImprovement = averagePostMoodIntensity - averagePreMoodIntensity;
        
        // Analyze successful moods (completed habits)
        const successfulMoodCounts: { [key: string]: number } = {};
        completedEntries.forEach(entry => {
          if (entry.preMood) {
            const mood = entry.preMood.moodState;
            successfulMoodCounts[mood] = (successfulMoodCounts[mood] || 0) + 1;
          }
        });
        
        const successfulMoods = Object.entries(successfulMoodCounts).map(([moodState, count]) => ({
          moodState,
          count,
          successRate: count / completedEntries.length
        }));
        
        // Analyze failed moods (skipped habits)
        const failedEntries = habitEntries.filter(entry => entry.action === 'skipped');
        const failedMoodCounts: { [key: string]: number } = {};
        failedEntries.forEach(entry => {
          if (entry.preMood) {
            const mood = entry.preMood.moodState;
            failedMoodCounts[mood] = (failedMoodCounts[mood] || 0) + 1;
          }
        });
        
        const failedMoods = Object.entries(failedMoodCounts).map(([moodState, count]) => ({
          moodState,
          count,
          failureRate: count / failedEntries.length
        }));
        
        // Find best and worst moods for success
        const bestMoodForSuccess = successfulMoods.length > 0
          ? successfulMoods.reduce((best, current) => 
              current.successRate > best.successRate ? current : best
            ).moodState
          : 'calm';
        
        const worstMoodForSuccess = successfulMoods.length > 0
          ? successfulMoods.reduce((worst, current) => 
              current.successRate < worst.successRate ? current : worst
            ).moodState
          : 'stressed';
        
        correlations.push({
          habitId: habit.id,
          habitTitle: habit.title,
          totalEntries: habitEntries.length,
          completionRate,
          averagePreMoodIntensity,
          averagePostMoodIntensity,
          moodImprovement,
          successfulMoods,
          failedMoods,
          bestMoodForSuccess,
          worstMoodForSuccess
        });
      }
    });
    
    // Sort by mood improvement instead of correlationStrength
    return correlations.sort((a, b) => b.moodImprovement - a.moodImprovement);
  } catch (error) {
    console.error('Error getting habit mood correlations:', error);
    return [];
  }
}, [habits, getHabitMoodEntries]);
  
      const getMoodHabitAnalytics = useCallback((): MoodHabitAnalytics => {
  try {
    if (!getHabitMoodEntries) {
      return {
        overallCorrelations: [],
        moodTrends: [],
        insights: {
          bestMoodForHabits: 'calm',
          worstMoodForHabits: 'stressed',
          moodBoostingHabits: [],
          moodDrainingHabits: [],
          optimalCompletionMoods: {}
        }
      };
    }
    
    const moodEntries = getHabitMoodEntries();
    const correlations = getHabitMoodCorrelations();
    
    // Generate mood trends for the last 30 days
    const last30Days = Array.from({ length: 30 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - i);
      return getLocalDateString(date);
    }).reverse();
    
    const moodTrends = last30Days.map(date => {
      const dayEntries = moodEntries.filter(entry => 
        entry.timestamp.startsWith(date)
      );
      
      const completedEntries = dayEntries.filter(entry => entry.action === 'completed');
      const skippedEntries = dayEntries.filter(entry => entry.action === 'skipped');
      
      // Calculate average mood for the day
      const moodValues = dayEntries
        .filter(entry => entry.preMood)
        .map(entry => entry.preMood!.intensity);
      
      const averageMood = moodValues.length > 0 
        ? moodValues.reduce((sum, mood) => sum + mood, 0) / moodValues.length
        : 5; // Default neutral mood
      
      return {
        date,
        averageMood,
        habitsCompleted: completedEntries.length,
        habitsSkipped: skippedEntries.length
      };
    });
    
    // Generate insights
    const moodSuccessRates: { [mood: string]: { total: number; completed: number } } = {};
    
    moodEntries.forEach(entry => {
      if (entry.preMood) {
        const mood = entry.preMood.moodState;
        if (!moodSuccessRates[mood]) {
          moodSuccessRates[mood] = { total: 0, completed: 0 };
        }
        moodSuccessRates[mood].total++;
        if (entry.action === 'completed') {
          moodSuccessRates[mood].completed++;
        }
      }
    });
    
    // Find best and worst moods for habits
    let bestMoodForHabits = 'calm';
    let worstMoodForHabits = 'stressed';
    let bestSuccessRate = 0;
    let worstSuccessRate = 1;
    
    Object.entries(moodSuccessRates).forEach(([mood, data]) => {
      const successRate = data.total > 0 ? data.completed / data.total : 0;
      if (successRate > bestSuccessRate) {
        bestSuccessRate = successRate;
        bestMoodForHabits = mood;
      }
      if (successRate < worstSuccessRate) {
        worstSuccessRate = successRate;
        worstMoodForHabits = mood;
      }
    });
    
    // Find mood boosting and draining habits
    const moodBoostingHabits = correlations
      .filter(c => c.moodImprovement > 0.5)
      .sort((a, b) => b.moodImprovement - a.moodImprovement)
      .slice(0, 3)
      .map(c => c.habitTitle);
    
    const moodDrainingHabits = correlations
      .filter(c => c.moodImprovement < -0.5)
      .sort((a, b) => a.moodImprovement - b.moodImprovement)
      .slice(0, 3)
      .map(c => c.habitTitle);
    
    // Find optimal completion moods for each habit
    const optimalCompletionMoods: { [habitId: string]: string } = {};
    correlations.forEach(correlation => {
      if (correlation.successfulMoods.length > 0) {
        const bestMood = correlation.successfulMoods.reduce((best, current) => 
          current.successRate > best.successRate ? current : best
        );
        optimalCompletionMoods[correlation.habitId] = bestMood.moodState;
      }
    });
    
    return {
      overallCorrelations: correlations,
      moodTrends,
      insights: {
        bestMoodForHabits,
        worstMoodForHabits,
        moodBoostingHabits,
        moodDrainingHabits,
        optimalCompletionMoods
      }
    };
  } catch (error) {
    console.error('Error getting mood habit analytics:', error);
    return {
      overallCorrelations: [],
      moodTrends: [],
      insights: {
        bestMoodForHabits: 'calm',
        worstMoodForHabits: 'stressed',
        moodBoostingHabits: [],
        moodDrainingHabits: [],
        optimalCompletionMoods: {}
      }
    };
  }
}, [getHabitMoodEntries, getHabitMoodCorrelations]);

      const getAdvancedMoodHabitAnalytics = useCallback(() => {
        if (!getHabitMoodEntries) return null;
        
        const entries = getHabitMoodEntries();
        
        // Pearson correlation coefficient calculation
        const calculateCorrelation = (x: number[], y: number[]): number => {
          const n = x.length;
          const sumX = x.reduce((a, b) => a + b, 0);
          const sumY = y.reduce((a, b) => a + b, 0);
          const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
          const sumX2 = x.reduce((sum, xi) => sum + xi * xi, 0);
          const sumY2 = y.reduce((sum, yi) => sum + yi * yi, 0);
          
          const numerator = n * sumXY - sumX * sumY;
          const denominator = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));
          
          return denominator === 0 ? 0 : numerator / denominator;
        };
        
        // Time-series analysis for trend detection
        const detectTrends = (data: number[]): 'increasing' | 'decreasing' | 'stable' => {
          if (data.length < 3) return 'stable';
          
          const slopes = [];
          for (let i = 1; i < data.length; i++) {
            slopes.push(data[i] - data[i-1]);
          }
          
          const avgSlope = slopes.reduce((a, b) => a + b, 0) / slopes.length;
          
          if (avgSlope > 0.1) return 'increasing';
          if (avgSlope < -0.1) return 'decreasing';
          return 'stable';
        };
        
        // Seasonal pattern detection
        const detectSeasonalPatterns = (entries: HabitMoodEntry[]) => {
          const monthlyData = entries.reduce((acc, entry) => {
            const month = new Date(entry.date).getMonth();
            if (!acc[month]) acc[month] = [];
            acc[month].push(entry);
            return acc;
          }, {} as Record<number, HabitMoodEntry[]>);
          
          return Object.entries(monthlyData).map(([month, data]) => ({
            month: parseInt(month),
            averageMood: data.reduce((sum, entry) => 
              sum + (entry.preMood?.intensity || 0), 0) / data.length,
            completionRate: data.filter(e => e.action === 'completed').length / data.length
          }));
        };
        
        // Calculate correlations for each habit
        const calculateCorrelations = (entries: HabitMoodEntry[]) => {
          const habitGroups = entries.reduce((acc, entry) => {
            if (!acc[entry.habitId]) acc[entry.habitId] = [];
            acc[entry.habitId].push(entry);
            return acc;
          }, {} as Record<string, HabitMoodEntry[]>);
          
          return Object.entries(habitGroups).map(([habitId, habitEntries]) => {
            const preMoods = habitEntries.filter(e => e.preMood).map(e => e.preMood!.intensity);
            const postMoods = habitEntries.filter(e => e.postMood).map(e => e.postMood!.intensity);
            const completions = habitEntries.map(e => e.action === 'completed' ? 1 : 0);
            
            return {
              habitId,
              moodCompletionCorrelation: preMoods.length > 0 ? calculateCorrelation(preMoods, completions.slice(0, preMoods.length)) : 0,
              moodImprovementCorrelation: preMoods.length > 0 && postMoods.length > 0 ? 
                calculateCorrelation(preMoods.slice(0, postMoods.length), postMoods) : 0
            };
          });
        };
        
        return {
          correlations: calculateCorrelations(entries),
          trends: detectTrends(entries.map(e => e.preMood?.intensity || 0)),
          seasonalPatterns: detectSeasonalPatterns(entries),
          totalEntries: entries.length,
          analysisDate: new Date().toISOString()
        };
      }, [getHabitMoodEntries]);
  
      // NEW: AI-Powered Predictive Intelligence Functions
      const getHabitSuccessPredictions = useCallback((currentMood?: { moodState: string; intensity: number }): HabitSuccessPrediction[] => {
        if (!habits || !currentMood) return [];
        
        try {
          const correlations = getHabitMoodCorrelations();
          const now = new Date();
          const currentHour = now.getHours();
          
          return habits.map(habit => {
            const correlation = correlations.find(c => c.habitId === habit.id);
            if (!correlation) {
              return {
                habitId: habit.id,
                habitTitle: habit.title,
                currentMood: currentMood.moodState,
                currentMoodIntensity: currentMood.intensity,
                predictedSuccessRate: 0.5,
                confidence: 0.3,
                factors: { moodAlignment: 0.5, timeOfDay: 0.5, recentPattern: 0.5, streakMomentum: 0.5 },
                recommendation: 'proceed',
                reasoning: t('moodAnalytics.aiInsights.successPredictionMessages.insufficientData')
              };
            }
            
            // Calculate mood alignment
            const moodMatch = correlation.successfulMoods.find(m => m.moodState === currentMood.moodState);
            const moodAlignment = moodMatch ? moodMatch.successRate : 0.3;
            
            // Calculate time of day factor
            const completionTimes = habit.completionTimes || [];
            const timeAlignment = completionTimes.length > 0 ? 
              Math.max(...completionTimes.map(time => {
                const [hour] = time.split(':').map(Number);
                return 1 - Math.abs(hour - currentHour) / 12;
              })) : 0.5;
            
            // Calculate recent pattern
            const recentDates = habit.completedDates.slice(-7);
            const recentPattern = recentDates.length / 7;
            
            // Calculate streak momentum
            const streakMomentum = Math.min(habit.streak / 30, 1);
            
            // Combine factors
            const factors = {
              moodAlignment,
              timeOfDay: timeAlignment,
              recentPattern,
              streakMomentum
            };
            
            const predictedSuccessRate = (
              moodAlignment * 0.4 +
              timeAlignment * 0.2 +
              recentPattern * 0.2 +
              streakMomentum * 0.2
            );
            
            const confidence = Math.min(correlation.totalEntries / 20, 1);
            
            let recommendation: 'proceed' | 'wait' | 'modify_approach' = 'proceed';
            let reasoning = '';
            
            if (predictedSuccessRate < 0.3) {
              recommendation = 'wait';
              reasoning = t('moodAnalytics.aiInsights.successPredictionMessages.lowSuccessRate', { moodState: t(`moodAnalytics.moodStates.${currentMood.moodState}`) });
            } else if (predictedSuccessRate < 0.6) {
              recommendation = 'modify_approach';
              reasoning = t('moodAnalytics.aiInsights.successPredictionMessages.moderateSuccess');
            } else {
                              reasoning = t('moodAnalytics.aiInsights.successPredictionMessages.goodConditions');
            }
            
            return {
              habitId: habit.id,
              habitTitle: habit.title,
              currentMood: currentMood.moodState,
              currentMoodIntensity: currentMood.intensity,
              predictedSuccessRate,
              confidence,
              factors,
              recommendation,
              reasoning
            };
          });
        } catch (error) {
          console.error('Error getting habit success predictions:', error);
          return [];
        }
      }, [habits, getHabitMoodCorrelations]);
  
      const getRiskAlerts = useCallback((currentMood?: { moodState: string; intensity: number }): RiskAlert[] => {
        if (!habits || !currentMood) return [];
        
        try {
          const correlations = getHabitMoodCorrelations();
          const alerts: RiskAlert[] = [];
          
          habits.forEach(habit => {
            const correlation = correlations.find(c => c.habitId === habit.id);
            if (!correlation) return;
            
            // Check mood mismatch
            const moodMatch = correlation.successfulMoods.find(m => m.moodState === currentMood.moodState);
            const moodMismatch = moodMatch ? (1 - moodMatch.successRate) : 0.8;
            
            // Check recent skips
            const recentDates = habit.completedDates.slice(-7);
            const recentSkips = (7 - recentDates.length) / 7;
            
            // Check streak vulnerability
            const streakVulnerability = habit.streak > 0 ? Math.min(habit.streak / 30, 1) : 0;
            
            // Calculate risk score
            const riskScore = (
              moodMismatch * 0.4 +
              recentSkips * 0.3 +
              streakVulnerability * 0.3
            );
            
            if (riskScore > 0.5) {
              let riskLevel: 'low' | 'medium' | 'high' | 'critical' = 'low';
              let urgency: 'immediate' | 'today' | 'this_week' = 'this_week';
              
              if (riskScore > 0.8) {
                riskLevel = 'critical';
                urgency = 'immediate';
              } else if (riskScore > 0.7) {
                riskLevel = 'high';
                urgency = 'today';
              } else if (riskScore > 0.6) {
                riskLevel = 'medium';
                urgency = 'today';
              }
              
              const suggestions = [
                            t('moodAnalytics.aiInsights.riskAlertMessages.trySmallerVersion'),
            t('moodAnalytics.aiInsights.riskAlertMessages.waitForBetterMood', { bestMood: t(`moodAnalytics.moodStates.${correlation.bestMoodForSuccess}`) }),
            t('moodAnalytics.aiInsights.riskAlertMessages.changeEnvironment'),
            t('moodAnalytics.aiInsights.riskAlertMessages.setReminder')
              ];
              
              alerts.push({
                id: `risk_${habit.id}_${Date.now()}`,
                habitId: habit.id,
                habitTitle: habit.title,
                riskLevel,
                riskScore,
                currentMood: currentMood.moodState,
                currentMoodIntensity: currentMood.intensity,
                factors: {
                  moodMismatch,
                  timeDeviation: 0.5, // Placeholder
                  recentSkips,
                  streakVulnerability
                },
                suggestions,
                urgency,
                createdAt: new Date().toISOString()
              });
            }
          });
          
          return alerts.sort((a, b) => b.riskScore - a.riskScore);
        } catch (error) {
          console.error('Error getting risk alerts:', error);
          return [];
        }
      }, [habits, getHabitMoodCorrelations]);
  
      const getOptimalTimingSuggestions = useCallback((currentMood: { moodState: string; intensity: number }): OptimalTimingSuggestion[] => {
        if (!habits) return [];
        
        try {
          const correlations = getHabitMoodCorrelations();
          
          return habits.map(habit => {
            const correlation = correlations.find(c => c.habitId === habit.id);
            const completionTimes = habit.completionTimes || [];
            
            // Generate suggested times based on historical data
          const suggestedTimes: {
            time: string;
            successProbability: number;
            moodAlignment: number;
            reasoning: string;
          }[] = [];
          
          if (completionTimes.length > 0) {
            // Use historical completion times
            const timeFrequency: { [time: string]: number } = {};
            completionTimes.forEach(time => {
              // Validate time format and extract hour safely
              if (time && typeof time === 'string' && time.includes(':')) {
                const hour = time.split(':')[0];
                // Ensure hour is a valid number
                if (hour && !isNaN(parseInt(hour)) && parseInt(hour) >= 0 && parseInt(hour) <= 23) {
                  timeFrequency[hour] = (timeFrequency[hour] || 0) + 1;
                }
              }
            });
            
            // Only process if we have valid time frequencies
            if (Object.keys(timeFrequency).length > 0) {
              Object.entries(timeFrequency)
                .sort(([,a], [,b]) => b - a)
                .slice(0, 3)
                .forEach(([hour, frequency]) => {
                  const successProbability = frequency / completionTimes.length;
                  const moodAlignment = correlation ? 
                    (correlation.successfulMoods.find(m => m.moodState === currentMood.moodState)?.successRate || 0.5) : 0.5;
                  
                  suggestedTimes.push({
                    time: `${hour}:00`,
                    successProbability,
                    moodAlignment,
                    reasoning: t('moodAnalytics.aiInsights.optimalTimingMessages.successfulCompletion', { time: `${hour}:00`, frequency: frequency })
                  });
                });
            }
                      }
            
            // If no valid times were found from historical data, use default mood-based times
            if (suggestedTimes.length === 0) {
              const moodBasedTimes = {
                'energetic': ['07:00', '10:00', '14:00'],
                'calm': ['06:00', '20:00', '21:00'],
                'happy': ['08:00', '12:00', '16:00'],
                'tired': ['09:00', '13:00', '19:00'],
                'stressed': ['06:00', '12:00', '18:00'],
                'anxious': ['07:00', '11:00', '15:00'],
                'sad': ['10:00', '14:00', '17:00']
              };
              
              const times = moodBasedTimes[currentMood.moodState as keyof typeof moodBasedTimes] || ['09:00', '13:00', '18:00'];
              times.forEach(time => {
                suggestedTimes.push({
                  time,
                  successProbability: 0.6,
                  moodAlignment: 0.7,
                  reasoning: t('moodAnalytics.aiInsights.optimalTimingMessages.optimalTimeForMood', { moodState: t(`moodAnalytics.moodStates.${currentMood.moodState}`) })
                });
              });
            }
            
            return {
              habitId: habit.id,
              habitTitle: habit.title,
              currentMood: currentMood.moodState,
              suggestedTimes,
              bestTimeToday: suggestedTimes[0]?.time || '09:00',
              alternativeTimes: suggestedTimes.slice(1).map(t => t.time),
              moodBasedRecommendation: t('moodAnalytics.aiInsights.optimalTimingMessages.moodBasedRecommendation', { 
                moodState: t(`moodAnalytics.moodStates.${currentMood.moodState}`), 
                reasoning: suggestedTimes[0]?.reasoning || t('moodAnalytics.aiInsights.optimalTimingMessages.morningHoursWorkBest')
              })
            };
          });
        } catch (error) {
          console.error('Error getting optimal timing suggestions:', error);
          return [];
        }
      }, [habits, getHabitMoodCorrelations]);
  
      const getMoodTriggeredRecommendations = useCallback((currentMood: { moodState: string; intensity: number }): MoodTriggeredRecommendation => {
        if (!habits) {
          return {
            id: `mood_rec_${Date.now()}`,
            currentMood: currentMood.moodState,
            currentMoodIntensity: currentMood.intensity,
            recommendedHabits: [],
            moodBoostingActivities: [],
            avoidanceRecommendations: [],
            createdAt: new Date().toISOString()
          };
        }
        
        try {
          const correlations = getHabitMoodCorrelations();
          
          const recommendedHabits = habits
            .map(habit => {
              const correlation = correlations.find(c => c.habitId === habit.id);
              if (!correlation) return null;
              
              const moodMatch = correlation.successfulMoods.find(m => m.moodState === currentMood.moodState);
              const matchScore = moodMatch ? moodMatch.successRate : 0.3;
              const expectedBenefit = correlation.moodImprovement;
              
              let urgency: 'high' | 'medium' | 'low' = 'low';
              if (matchScore > 0.8) urgency = 'high';
              else if (matchScore > 0.6) urgency = 'medium';
              
              return {
                habitId: habit.id,
                habitTitle: habit.title,
                matchScore,
                expectedBenefit,
                reasoning: t('moodAnalytics.aiInsights.moodTriggeredRecommendationsMessages.successRateWhenMood', { moodState: t(`moodAnalytics.moodStates.${currentMood.moodState}`), successRate: Math.round(matchScore * 100) }),
                urgency
              };
            })
            .filter(Boolean)
            .sort((a, b) => (b?.matchScore || 0) - (a?.matchScore || 0))
            .slice(0, 5) as any[];
          
          // Mood-specific activity suggestions using translation keys
          const moodActivities = {
            'stressed': ['dynamicContent.activities.take5DeepBreaths', 'dynamicContent.activities.goForShortWalk', 'dynamicContent.activities.listenToCalmingMusic'],
            'anxious': ['dynamicContent.activities.practiceMindfulness', 'dynamicContent.activities.writeInJournal', 'dynamicContent.activities.doGentleStretching'],
            'sad': ['dynamicContent.activities.callFriend', 'dynamicContent.activities.watchSomethingUplifting', 'dynamicContent.activities.practiceGratitude'],
            'tired': ['dynamicContent.activities.takePowerNap', 'dynamicContent.activities.drinkWater', 'dynamicContent.activities.getFreshAir'],
            'energetic': ['dynamicContent.activities.exercise', 'dynamicContent.activities.tackleChallengingTasks', 'dynamicContent.activities.beCreative'],
            'happy': ['dynamicContent.activities.shareMood', 'dynamicContent.activities.trySomethingNew', 'dynamicContent.activities.helpOthers'],
            'calm': ['dynamicContent.activities.meditation', 'dynamicContent.activities.reading', 'dynamicContent.activities.planYourDay']
          };
          
          const avoidanceMap = {
            'stressed': ['dynamicContent.avoidance.avoidOverwhelmingTasks', 'dynamicContent.avoidance.skipIntenseWorkouts'],
            'anxious': ['dynamicContent.avoidance.avoidCaffeine', 'dynamicContent.avoidance.skipSocialMedia'],
            'sad': ['dynamicContent.avoidance.avoidIsolation', 'dynamicContent.avoidance.skipNegativeContent'],
            'tired': ['dynamicContent.avoidance.avoidHeavyMeals', 'dynamicContent.avoidance.skipLateNightActivities'],
            'energetic': ['dynamicContent.avoidance.avoidSittingTooLong', 'dynamicContent.avoidance.skipBoringTasks'],
            'happy': ['dynamicContent.avoidance.avoidOvercommitting', 'dynamicContent.avoidance.skipRiskyDecisions'],
            'calm': ['dynamicContent.avoidance.avoidRushing', 'dynamicContent.avoidance.skipStressfulConversations']
          };
          
          return {
            id: `mood_rec_${Date.now()}`,
            currentMood: currentMood.moodState,
            currentMoodIntensity: currentMood.intensity,
            recommendedHabits,
            moodBoostingActivities: moodActivities[currentMood.moodState as keyof typeof moodActivities] || [],
            avoidanceRecommendations: avoidanceMap[currentMood.moodState as keyof typeof avoidanceMap] || [],
            createdAt: new Date().toISOString()
          };
        } catch (error) {
          console.error('Error getting mood triggered recommendations:', error);
          return {
            id: `mood_rec_${Date.now()}`,
            currentMood: currentMood.moodState,
            currentMoodIntensity: currentMood.intensity,
            recommendedHabits: [],
            moodBoostingActivities: [],
            avoidanceRecommendations: [],
            createdAt: new Date().toISOString()
          };
        }
      }, [habits, getHabitMoodCorrelations]);
  
      const getWeeklyForecast = useCallback((): WeeklyForecast => {
        const startOfWeek = new Date();
        startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(endOfWeek.getDate() + 6);
        
        if (!habits) {
          return {
            weekStartDate: startOfWeek.toISOString(),
            weekEndDate: endOfWeek.toISOString(),
            habitForecasts: [],
            overallMoodTrend: [],
            weeklyGoals: [],
            insights: []
          };
        }
        
        try {
          const correlations = getHabitMoodCorrelations();
          
          const habitForecasts = habits.map(habit => {
            const correlation = correlations.find(c => c.habitId === habit.id);
            const recentCompletionRate = habit.completedDates.slice(-7).length / 7;
            
            // Predict completions based on recent patterns
            const predictedCompletions = Math.round(recentCompletionRate * 7);
            const predictedSuccessRate = correlation ? correlation.completionRate : recentCompletionRate;
            
            // Generate risk and optimal days
            const riskDays = [];
            const optimalDays = [];
            
            for (let i = 0; i < 7; i++) {
              const date = new Date(startOfWeek);
              date.setDate(date.getDate() + i);
              
              // Simple mood prediction based on day of week patterns
              const dayMoods = ['calm', 'energetic', 'focused', 'tired', 'stressed', 'happy', 'relaxed'];
              const predictedMood = dayMoods[i];
              
              const moodMatch = correlation?.successfulMoods.find(m => m.moodState === predictedMood);
              const successProbability = moodMatch ? moodMatch.successRate : 0.5;
              
              if (successProbability < 0.4) {
                riskDays.push({
                  date: getLocalDateString(date),
                  riskLevel: 'high' as const,
                  predictedMood,
                  suggestions: [t('moodAnalytics.aiInsights.weeklyForecastMessages.modifyApproachOnMoodDays', { predictedMood: t(`moodAnalytics.moodStates.${predictedMood}`) })]
                });
              } else if (successProbability > 0.7) {
                optimalDays.push({
                  date: getLocalDateString(date),
                  predictedMood,
                  successProbability
                });
              }
            }
            
            return {
              habitId: habit.id,
              habitTitle: habit.title,
              predictedCompletions,
              predictedSuccessRate,
              riskDays,
              optimalDays
            };
          });
          
          // Generate overall mood trend
          const overallMoodTrend = [];
          for (let i = 0; i < 7; i++) {
            const date = new Date(startOfWeek);
            date.setDate(date.getDate() + i);
            
            const dayMoods = ['calm', 'energetic', 'focused', 'tired', 'stressed', 'happy', 'relaxed'];
            const moodIntensities = [7, 8, 7, 5, 4, 8, 7];
            
            overallMoodTrend.push({
              date: getLocalDateString(date),
              predictedMood: dayMoods[i],
              predictedIntensity: moodIntensities[i],
              confidence: 0.6
            });
          }
          
          // Generate weekly goals
          const weeklyGoals = habits.map(habit => {
            const recentRate = habit.completedDates.slice(-7).length / 7;
            const recommendedTarget = Math.min(Math.ceil(recentRate * 7) + 1, 7);
            
            return {
              habitId: habit.id,
              recommendedTarget,
              reasoning: `Based on your recent ${Math.round(recentRate * 100)}% completion rate`
            };
          });
          
          const insights = [
            'tuesdayWednesdayOptimal',
            'fridayChallenging',
            'weekendPotential'
          ];
          
          return {
            weekStartDate: startOfWeek.toISOString(),
            weekEndDate: endOfWeek.toISOString(),
            habitForecasts,
            overallMoodTrend,
            weeklyGoals,
            insights
          };
        } catch (error) {
          console.error('Error generating weekly forecast:', error);
          return {
            weekStartDate: startOfWeek.toISOString(),
            weekEndDate: endOfWeek.toISOString(),
            habitForecasts: [],
            overallMoodTrend: [],
            weeklyGoals: [],
            insights: []
          };
        }
      }, [habits, getHabitMoodCorrelations]);
  
      const getAIPredictiveAnalytics = useCallback((currentMood?: { moodState: string; intensity: number }): AIPredictiveAnalytics => {
        const defaultMood = currentMood || { moodState: 'calm', intensity: 5 };
        
        return {
          predictions: getHabitSuccessPredictions(defaultMood),
          riskAlerts: getRiskAlerts(defaultMood),
          timingSuggestions: getOptimalTimingSuggestions(defaultMood),
          moodRecommendations: [getMoodTriggeredRecommendations(defaultMood)],
          weeklyForecast: getWeeklyForecast(),
          lastUpdated: new Date().toISOString()
        };
      }, [getHabitSuccessPredictions, getRiskAlerts, getOptimalTimingSuggestions, getMoodTriggeredRecommendations, getWeeklyForecast]);

     // NEW: Personalized Coaching Functions
      const getMoodSpecificHabitModifications = useCallback((habitId: string, currentMood: { moodState: string; intensity: number }): MoodSpecificHabitModification | null => {
        const habit = getHabitById(habitId);
        if (!habit) return null;

        const correlations = getHabitMoodCorrelations();
        const habitCorrelation = correlations.find(c => c.habitId === habitId);
        
        if (!habitCorrelation) return null;

        const moodMatch = habitCorrelation.successfulMoods.find(m => m.moodState === currentMood.moodState);
        
        if (!moodMatch || moodMatch.successRate > 0.7) return null;

        const moodBasedVersions = [];
        
        if (currentMood.moodState === 'stressed' || currentMood.moodState === 'anxious') {
          moodBasedVersions.push({
            moodState: currentMood.moodState as 'happy' | 'sad' | 'anxious' | 'energetic' | 'tired' | 'stressed' | 'calm',
            modifiedVersion: {
              title: `${habit.title} (Stress-Adapted)`,
              description: `Simplified version of ${habit.title} for when you're feeling stressed`,
              difficulty: 'easy' as const,
              estimatedTime: Math.max((habit.duration || 30) * 0.5, 5),
              modifications: ['Reduced duration', 'Lower intensity', 'Focus on completion over perfection'],
              reasoning: 'Reduce duration when feeling stressed to maintain consistency'
            },
            applicableIntensityRange: {
              min: currentMood.intensity - 2,
              max: currentMood.intensity + 2
            }
          });
        }
        
        if (currentMood.moodState === 'tired' || currentMood.intensity < 4) {
          moodBasedVersions.push({
            moodState: currentMood.moodState as 'happy' | 'sad' | 'anxious' | 'energetic' | 'tired' | 'stressed' | 'calm',
            modifiedVersion: {
              title: `${habit.title} (Energy-Adapted)`,
              description: `Low-energy version of ${habit.title}`,
              difficulty: 'easy' as const,
              estimatedTime: Math.max((habit.duration || 30) * 0.7, 10),
              modifications: ['Lower intensity', 'Shorter duration', 'Gentler approach'],
              reasoning: 'Lower intensity when energy is low'
            },
            applicableIntensityRange: {
              min: 1,
              max: 4
            }
          });
        }
        
        if (currentMood.moodState === 'sad' || currentMood.moodState === 'depressed') {
          moodBasedVersions.push({
            moodState: currentMood.moodState as 'happy' | 'sad' | 'anxious' | 'energetic' | 'tired' | 'stressed' | 'calm',
            modifiedVersion: {
              title: `${habit.title} (Mood-Boosting)`,
              description: `Social version of ${habit.title} for emotional support`,
              difficulty: habit.difficulty as 'easy' | 'medium' | 'hard' || 'medium',
              estimatedTime: habit.duration || 30,
              modifications: ['Add social element', 'Focus on mood improvement', 'Include self-compassion'],
              reasoning: 'Consider doing this habit with others for emotional support'
            },
            applicableIntensityRange: {
              min: currentMood.intensity - 1,
              max: currentMood.intensity + 3
            }
          });
        }

        return moodBasedVersions.length > 0 ? {
          id: `mod-${habitId}-${Date.now()}`,
          habitId,
          habitTitle: habit.title,
          originalHabit: {
            title: habit.title,
            description: habit.notes || `Complete ${habit.title}`,
            difficulty: habit.difficulty as 'easy' | 'medium' | 'hard' || 'medium',
            estimatedTime: habit.duration || 30
          },
          moodBasedVersions,
          createdAt: new Date().toISOString()
        } : null;
      }, [getHabitById, getHabitMoodCorrelations]);

      const getEmotionalHabitStackingSuggestions = useCallback((targetMood: string, currentMood: { moodState: string; intensity: number }): EmotionalHabitStackingSuggestion[] => {
        if (!habits) return [];

        const correlations = getHabitMoodCorrelations();
        const moodImprovingHabits = habits.filter(habit => {
          const correlation = correlations.find(c => c.habitId === habit.id);
          return correlation?.moodImprovement && correlation.moodImprovement > 0.3;
        });

        const suggestions = [];
        
        for (let i = 0; i < moodImprovingHabits.length - 1; i++) {
          const primaryHabit = moodImprovingHabits[i];
          const secondaryHabit = moodImprovingHabits[i + 1];
          
          suggestions.push({
            id: `stack-${primaryHabit.id}-${secondaryHabit.id}`,
            primaryHabitId: primaryHabit.id,
            primaryHabitTitle: primaryHabit.title,
            targetMood: targetMood as 'happy' | 'sad' | 'anxious' | 'energetic' | 'tired' | 'stressed' | 'calm',
            stackingChain: [
              {
                order: 1,
                habitId: primaryHabit.id,
                habitTitle: primaryHabit.title,
                purpose: 'preparation' as const,
                timing: 'before' as const,
                waitTime: 5,
                emotionalBenefit: 'Prepares mind and body for the main habit',
                successRate: 0.8
              },
              {
                order: 2,
                habitId: secondaryHabit.id,
                habitTitle: secondaryHabit.title,
                purpose: 'amplification' as const,
                timing: 'after' as const,
                waitTime: 0,
                emotionalBenefit: 'Amplifies the positive effects of the first habit',
                successRate: 0.7
              }
            ],
            overallBenefit: {
              moodImprovement: 7,
              stressReduction: 6,
              energyBoost: 5,
              confidenceIncrease: 6
            },
            bestTimeOfDay: ['morning', 'afternoon'],
            estimatedTotalTime: (primaryHabit.duration || 30) + (secondaryHabit.duration || 30),
            confidence: 0.7,
            reasoning: `Combining ${primaryHabit.title} with ${secondaryHabit.title} can help transition from ${currentMood.moodState} to ${targetMood}`,
            createdAt: new Date().toISOString()
          });
        }

        return suggestions.slice(0, 3);
      }, [habits, getHabitMoodCorrelations]);

      const getMoodImprovementRecommendations = useCallback((currentMood: { moodState: string; intensity: number }, targetMood?: { moodState: string; intensity: number }): MoodImprovementHabitRecommendation => {
        if (!habits) {
          return {
            id: `mood-rec-${Date.now()}`,
            currentMood: currentMood.moodState as 'happy' | 'sad' | 'anxious' | 'energetic' | 'tired' | 'stressed' | 'calm',
            currentMoodIntensity: currentMood.intensity,
            targetMood: (targetMood?.moodState || 'happy') as 'happy' | 'sad' | 'anxious' | 'energetic' | 'tired' | 'stressed' | 'calm',
            targetMoodIntensity: targetMood?.intensity || 7,
            recommendedHabits: [],
            emergencyTechniques: [
              {
                technique: 'Deep Breathing',
                description: 'Take 5 deep breaths, focusing on exhaling slowly',
                timeRequired: 2,
                effectiveness: 7
              }
            ],
            avoidanceList: ['Avoid overwhelming tasks', 'Limit social media'],
            followUpRecommendations: ['Start with small habits', 'Track your progress'],
            createdAt: new Date().toISOString()
          };
        }

        const correlations = getHabitMoodCorrelations();
        const effectiveHabits = habits.filter(habit => {
          const correlation = correlations.find(c => c.habitId === habit.id);
          return correlation?.moodImprovement && correlation.moodImprovement > 0.2;
        }).map(habit => {
          const correlation = correlations.find(c => c.habitId === habit.id)!;
          return {
            habitId: habit.id,
            title: habit.title,
            description: habit.notes || `Complete ${habit.title}`,
            category: 'physical' as const,
            immediateImpact: Math.round((correlation.moodImprovement || 0.3) * 10),
            longTermBenefit: Math.round((correlation.moodImprovement || 0.3) * 10),
            effortRequired: habit.difficulty as 'low' | 'medium' | 'high' || 'medium',
            timeRequired: habit.duration || 30,
            scientificBasis: 'Based on your personal habit completion patterns',
            personalizedReason: `This habit has improved your mood by ${Math.round((correlation.moodImprovement || 0.3) * 100)}% in the past`,
            successProbability: correlation.completionRate || 0.5
          };
        }).sort((a, b) => b.immediateImpact - a.immediateImpact).slice(0, 3);

        return {
          id: `mood-rec-${Date.now()}`,
          currentMood: currentMood.moodState as 'happy' | 'sad' | 'anxious' | 'energetic' | 'tired' | 'stressed' | 'calm',
          currentMoodIntensity: currentMood.intensity,
          targetMood: (targetMood?.moodState || 'happy') as 'happy' | 'sad' | 'anxious' | 'energetic' | 'tired' | 'stressed' | 'calm',
          targetMoodIntensity: targetMood?.intensity || 7,
          recommendedHabits: effectiveHabits,
          emergencyTechniques: [
            {
              technique: 'Deep Breathing',
              description: 'Take 5 deep breaths, focusing on exhaling slowly',
              timeRequired: 2,
              effectiveness: 8
            },
            {
              technique: 'Quick Walk',
              description: 'Take a 5-minute walk, preferably outdoors',
              timeRequired: 5,
              effectiveness: 7
            }
          ],
          avoidanceList: ['Avoid overwhelming tasks', 'Limit negative content consumption'],
          followUpRecommendations: ['Track your mood after completing habits', 'Celebrate small wins'],
          createdAt: new Date().toISOString()
        };
      }, [habits, getHabitMoodCorrelations]);

      const getPersonalizedMotivationalMessage = useCallback((currentMood: { moodState: string; intensity: number }): PersonalizedMotivationalMessage => {
        const completionRate = getOverallCompletionRate();
        const recentStreak = habits ? Math.max(...habits.map(h => h.streak || 0)) : 0;
        
        const messages = {
          stressed: [
            "Take it one step at a time. Small progress is still progress.",
            "You've handled stress before and succeeded. You can do this.",
            "Remember: consistency over perfection."
          ],
          tired: [
            "Rest is part of the journey. Do what you can today.",
            "Even 5 minutes counts. You're building lasting habits.",
            "Your future self will thank you for not giving up."
          ],
          sad: [
            "Your habits are here to support you, especially on tough days.",
            "You've shown strength by maintaining your habits. Keep going.",
            "Small actions can lead to big mood improvements."
          ],
          happy: [
            "Great energy! This is perfect for building momentum.",
            "You're in a great headspace to tackle your goals.",
            "Ride this positive wave and make it count!"
          ],
          default: [
            "Every day is a new opportunity to grow.",
            "You're building something amazing, one habit at a time.",
            "Consistency is your superpower."
          ]
        };

        const moodMessages = messages[currentMood.moodState as keyof typeof messages] || messages.default;
        const selectedMessage = moodMessages[Math.floor(Math.random() * moodMessages.length)];

        return {
          id: `msg-${Date.now()}`,
          userId: 'current-user',
          currentMood: currentMood.moodState as 'happy' | 'sad' | 'anxious' | 'energetic' | 'tired' | 'stressed' | 'calm',
          currentMoodIntensity: currentMood.intensity,
          context: {
            timeOfDay: new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 17 ? 'afternoon' : 'evening',
            dayOfWeek: new Date().toLocaleDateString('en-US', { weekday: 'long' }),
            recentHabitPerformance: completionRate > 0.8 ? 'excellent' : completionRate > 0.6 ? 'good' : completionRate > 0.4 ? 'average' : 'poor',
            currentStreak: recentStreak,
            strugglingHabits: habits?.filter(h => h.streak < 3).map(h => h.id) || [],
            successfulHabits: habits?.filter(h => h.streak >= 7).map(h => h.id) || []
          },
          message: {
            primary: selectedMessage,
            secondary: `You're at ${Math.round(completionRate * 100)}% completion rate`,
            actionable: 'Focus on one habit at a time today',
            affirmation: 'You have the strength to build lasting positive changes'
          },
          tone: currentMood.intensity > 6 ? 'encouraging' : 'empathetic',
          personalizationFactors: {
            userPreferences: ['consistency', 'progress'],
            pastSuccesses: [`${recentStreak}-day streak`],
            currentChallenges: ['maintaining consistency'],
            personalityTraits: ['determined', 'growth-minded']
          },
          deliveryTiming: {
            immediate: true,
            triggers: ['mood_check']
          },
          effectiveness: {
            expectedImpact: Math.min(currentMood.intensity + 2, 10),
            confidence: 0.8
          },
          createdAt: new Date().toISOString()
        };
      }, [getOverallCompletionRate, habits]);

      const getAdaptiveHabitSchedule = useCallback((habitId: string): AdaptiveHabitSchedule | null => {
        const habit = getHabitById(habitId);
        if (!habit) return null;

        const correlations = getHabitMoodCorrelations();
        const habitCorrelation = correlations.find(c => c.habitId === habitId);
        
        const emotionalPatterns: AdaptiveHabitSchedule['emotionalPatterns'] = [];
        const weeklySchedule = [];
        
        // Generate emotional patterns based on mood data
        if (habitCorrelation) {
          const bestMoods = habitCorrelation.successfulMoods
            .filter(m => m.successRate > 0.7)
            .sort((a, b) => b.successRate - a.successRate);
          
          bestMoods.forEach((mood) => {
            emotionalPatterns.push({
              moodState: mood.moodState as 'happy' | 'sad' | 'anxious' | 'energetic' | 'tired' | 'stressed' | 'calm',
              optimalTimes: [
                {
                  timeSlot: '09:00',
                  successRate: mood.successRate,
                  averageMoodAfter: 7,
                  energyLevel: 6,
                  stressLevel: 3
                }
              ],
              avoidTimes: [
                {
                  timeSlot: '22:00',
                  riskLevel: 'high' as const,
                  reasoning: 'Late evening typically shows lower success rates'
                }
              ]
            });
          });
        }

        // Generate weekly schedule
        for (let day = 0; day < 7; day++) {
          weeklySchedule.push({
            dayOfWeek: day,
            recommendedTimes: [
              {
                time: habit.reminderTime || '09:00',
                predictedMood: 'calm',
                successProbability: 0.7,
                reasoning: 'Based on your historical patterns',
                flexibility: 'flexible' as const
              }
            ],
            moodBasedAlternatives: [
              {
                ifMood: 'tired',
                alternativeTime: '10:00',
                reasoning: 'Allow extra time to wake up when tired'
              }
            ]
          });
        }

        return {
          id: `schedule-${habitId}`,
          userId: 'current-user',
          habitId,
          habitTitle: habit.title,
          emotionalPatterns,
          weeklySchedule,
          adaptiveRules: [
            {
              condition: 'if mood is sad and intensity > 7',
              action: 'modify_habit',
              parameters: {
                reasoning: 'Modify habit to be gentler when feeling very sad'
              }
            }
          ],
          learningData: {
            totalAttempts: habit.completedDates.length,
            successfulAdaptations: Math.floor(habit.completedDates.length * 0.8),
            userFeedback: []
          },
          lastUpdated: new Date().toISOString(),
          nextReviewDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
        };
      }, [getHabitById, getHabitMoodCorrelations]);

      const updateAdaptiveSchedule = useCallback((habitId: string, feedback: { rating: number; comment?: string }) => {
        // This would typically update the schedule based on user feedback
        // For now, we'll just log the feedback
    
      }, []);

      const getPersonalizedCoachingData = useCallback((): PersonalizedCoachingData => {
        if (!habits) {
          return {
            moodSpecificModifications: [],
            emotionalHabitStacking: [],
            moodImprovementRecommendations: [],
            personalizedMessages: [],
            adaptiveSchedules: [],
            lastUpdated: new Date().toISOString()
          };
        }

        const currentMood = { moodState: 'neutral', intensity: 5 };
        
        // ✅ PERFORMANCE FIX: Limit processing to prevent UI freeze
        const limitedHabits = habits.slice(0, 5); // Process only first 5 habits
        
        return {
          moodSpecificModifications: limitedHabits
            .map(h => getMoodSpecificHabitModifications(h.id, currentMood))
            .filter(Boolean) as MoodSpecificHabitModification[],
          emotionalHabitStacking: getEmotionalHabitStackingSuggestions('happy', currentMood).slice(0, 3), // Limit to 3
          moodImprovementRecommendations: [getMoodImprovementRecommendations(currentMood)],
          personalizedMessages: [getPersonalizedMotivationalMessage(currentMood)],
          adaptiveSchedules: limitedHabits
            .map(h => getAdaptiveHabitSchedule(h.id))
            .filter(Boolean) as AdaptiveHabitSchedule[],
          lastUpdated: new Date().toISOString()
        };
      }, [habits, getMoodSpecificHabitModifications, getEmotionalHabitStackingSuggestions, getMoodImprovementRecommendations, getPersonalizedMotivationalMessage, getAdaptiveHabitSchedule]);

      // Smart notification trigger function
      const triggerSmartNotifications = async () => {
        if (!habits || !getMoodEntries || !getHabitMoodEntries) return;
        
        try {
          const moodEntries = getMoodEntries();
          const habitMoodEntries = getHabitMoodEntries();
          
          if (moodEntries.length === 0) {
            return;
          }
          
          const currentMood = moodEntries[moodEntries.length - 1];
          const previousMood = moodEntries.length > 1 ? moodEntries[moodEntries.length - 2] : null;
          
          // Get pending habits that need attention
          const pendingHabits = habits.filter(habit => !habit.completedToday && habit.reminderEnabled);
          
          if (pendingHabits.length === 0) {
            return;
          }

          // 1. Mood-aware reminders for pending habits
          for (const habit of pendingHabits) {
            try {
              // Check if we should send a mood-aware reminder
              const shouldSendReminder = await shouldSendMoodAwareReminder(habit, currentMood, moodEntries);
              
              if (shouldSendReminder) {
                await scheduleMoodAwareReminder(habit, currentMood, moodEntries, t);
              }
            } catch (error) {
              console.error(`❌ Failed to schedule mood-aware reminder for ${habit.title}:`, error);
            }
          }

          // 2. Encouragement for difficult mood days
          if (currentMood.intensity < 5) {
            const strugglingHabits = pendingHabits.filter(habit => 
              habit.streak > 0 && !habit.completedToday
            );
            
            if (strugglingHabits.length > 0) {
              try {
                await scheduleEncouragementForDifficultMood(currentMood, strugglingHabits, t);
              } catch (error) {
                console.error('❌ Failed to schedule encouragement:', error);
              }
            }
          }

          // 3. Mood improvement celebration
          if (previousMood && currentMood.intensity > previousMood.intensity + 1) {
            const completedHabits = habits.filter(habit => habit.completedToday);
            if (completedHabits.length > 0) {
              try {
                await scheduleMoodImprovementCelebration(previousMood, currentMood, completedHabits, t);
              } catch (error) {
                console.error('❌ Failed to schedule mood celebration:', error);
              }
            }
          }

          // 4. Risk pattern check-in
          const riskAlerts = getRiskAlerts(currentMood);
          if (riskAlerts.length > 0) {
            try {
              await scheduleRiskPatternCheckIn(riskAlerts, moodEntries, t);
            } catch (error) {
              console.error('❌ Failed to schedule risk check-in:', error);
            }
          }

        } catch (error) {
          console.error('❌ Smart notifications error:', error);
        }
      };

      // Helper function to determine if we should send a mood-aware reminder
      const shouldSendMoodAwareReminder = async (
        habit: Habit, 
        currentMood: any, 
        moodHistory: any[]
      ): Promise<boolean> => {
        try {
          // Don't send if habit was completed recently
          if (habit.completedToday) return false;

          // Don't send if we already sent a reminder recently (within 2 hours)
          const lastReminderTime = habit.lastMotivationalNudge;
          if (lastReminderTime) {
            const timeSinceLastReminder = Date.now() - new Date(lastReminderTime).getTime();
            if (timeSinceLastReminder < 2 * 60 * 60 * 1000) { // 2 hours
              return false;
            }
          }

          // Check if this is a good time based on mood and habit patterns
          const optimalTime = calculateOptimalReminderTime(habit, currentMood, moodHistory);
          const now = new Date();
          const optimalDate = new Date(optimalTime);
          
          // Only send if we're within 30 minutes of optimal time
          const timeDiff = Math.abs(now.getTime() - optimalDate.getTime());
          if (timeDiff > 30 * 60 * 1000) { // 30 minutes
            return false;
          }

          // Check if user typically completes this habit in similar mood states
          const habitMoodEntries = getHabitMoodEntries ? getHabitMoodEntries() : [];
          const similarMoodCompletions = habitMoodEntries.filter((entry: any) => 
            entry.habitId === habit.id &&
            entry.preMood?.moodState === currentMood.moodState &&
            Math.abs(entry.preMood.intensity - currentMood.intensity) <= 2 &&
            entry.action === 'completed'
          );

          // Send if user has successfully completed this habit in similar mood states
          return similarMoodCompletions.length > 0;
          
        } catch (error) {
          console.error('Error checking if should send mood-aware reminder:', error);
          return false;
        }
      };

      // Helper function to calculate optimal reminder time
      const calculateOptimalReminderTime = (
        habit: Habit, 
        currentMood: any, 
        moodHistory: any[]
      ): string => {
        // Analyze when user typically completes habits in similar mood states
        const similarMoodEntries = moodHistory.filter(entry => 
          entry.moodState === currentMood.moodState &&
          Math.abs(entry.intensity - currentMood.intensity) <= 2
        );

        if (habit.completionTimes && habit.completionTimes.length > 0) {
          // Use existing completion patterns
          return habit.completionTimes[0];
        }

        // Default optimal times based on mood state
        const moodOptimalTimes = {
          'energetic': '07:00',
          'happy': '09:00',
          'calm': '19:00',
          'tired': '20:00',
          'stressed': '18:00',
          'anxious': '16:00',
          'sad': '14:00'
        };

        const now = new Date();
        const optimalHour = moodOptimalTimes[currentMood.moodState as keyof typeof moodOptimalTimes] || '10:00';
        const [hour, minute] = optimalHour.split(':').map(Number);
        
        const optimalTime = new Date(now);
        optimalTime.setHours(hour, minute, 0, 0);
        
        // If optimal time has passed today, schedule for tomorrow
        if (optimalTime <= now) {
          optimalTime.setDate(optimalTime.getDate() + 1);
        }

        return optimalTime.toISOString();
      };

      // NEW: Notification health check and cleanup functions
      const checkNotificationHealthStatus = async () => {
        try {
          const health = await checkNotificationHealth();
          return health;
        } catch (error) {
          console.error('❌ Failed to check notification health:', error);
          return null;
        }
      };

      const cleanupOrphanedNotificationsStatus = async () => {
        try {
          const cleanedCount = await cleanupOrphanedNotifications();
          return cleanedCount;
        } catch (error) {
          console.error('❌ Failed to cleanup orphaned notifications:', error);
          return 0;
        }
      };


      // Add to the context value and provider
     const value: HabitContextType = {
        habits: habits ? [...habits].sort((a, b) => (a.order || 0) - (b.order || 0)) : null,
        isLoading,
        addHabit,
        updateHabit,
        deleteHabit,
        deleteMultipleHabits,
        toggleHabitCompletion,
        reorderHabits,
        getHabitById,
        getCompletionRate,
        getDailyCompletionData,
        getMonthlyCompletionData,
        getAIHabitSuggestions,
        getSmartReminderSuggestions,
        triggerMotivationalCheck,
        getTotalCompletions,
        getOverallCompletionRate,
        // NEW: Habit-Mood Integration methods
        addPostHabitMood,
        getHabitMoodCorrelations,
        getMoodHabitAnalytics,
        getAdvancedMoodHabitAnalytics,
        // NEW: AI-Powered Predictive Intelligence methods
        getHabitSuccessPredictions,
        getRiskAlerts,
        getOptimalTimingSuggestions,
        getMoodTriggeredRecommendations,
        getWeeklyForecast,
        getAIPredictiveAnalytics,
        // NEW: Personalized Coaching methods
        getMoodSpecificHabitModifications,
        getEmotionalHabitStackingSuggestions,
        getMoodImprovementRecommendations,
        getPersonalizedMotivationalMessage,
        getAdaptiveHabitSchedule,
        updateAdaptiveSchedule,
        getPersonalizedCoachingData,
        triggerSmartNotifications
      };

      // Debug function to check habit state
      const debugHabitState = async () => {
        try {
          const storageKey = user ? `habits_${user.id}` : 'habits_anonymous';
          const storedHabits = await AsyncStorage.getItem(storageKey);
          const now = new Date();
          const today = getLocalDateString(now);
          
          console.log('🔍 DEBUG - Current habit state:', {
            storageKey,
            today,
            currentTime: now.toISOString(),
            hasStoredData: !!storedHabits,
            currentHabitsCount: habits?.length || 0,
            currentCompletedCount: habits?.filter(h => h.completedToday).length || 0
          });
          
          if (storedHabits) {
            const parsedHabits = JSON.parse(storedHabits);
            console.log('🔍 DEBUG - Stored habits:', {
              storedCount: parsedHabits.length,
              storedCompletedCount: parsedHabits.filter((h: any) => h.completedToday).length,
              storedHabits: parsedHabits.map((h: any) => ({
                id: h.id,
                title: h.title,
                completedToday: h.completedToday,
                completedDates: h.completedDates
              }))
            });
          }
        } catch (error) {
          console.error('Debug error:', error);
        }
      };

      // Force reload habits from storage (for debugging)
      const forceReloadHabits = async () => {
        console.log('🔄 Force reloading habits from storage...');
        await loadHabits();
      };

      // Export debug functions for development
      useEffect(() => {
        if (__DEV__) {
          (global as any).debugHabitState = debugHabitState;
          (global as any).forceReloadHabits = forceReloadHabits;
        }
      }, [habits, user?.id]);

      return (
        <HabitContext.Provider value={value}>
          {children}
        </HabitContext.Provider>
      );
    }

    export function useHabits() {
      const context = useContext(HabitContext);
      if (context === undefined) {
        throw new Error('useHabits must be used within a HabitProvider');
      }
      return context;
    }

    