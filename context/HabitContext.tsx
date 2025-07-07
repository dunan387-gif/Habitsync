import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Habit, AIHabitSuggestion, SmartReminderSuggestion } from '@/types';
import { 
  scheduleHabitReminder, 
  cancelHabitReminder, 
  requestNotificationPermissions,
  checkAndScheduleMotivationalSupport,
  scheduleSmartReminderSuggestion
} from '@/services/NotificationService';
import { aiService } from '@/services/AIService';
import { useCelebration } from './CelebrationContext';
import { useLanguage } from './LanguageContext';
import { useGamification } from './GamificationContext';


type HabitContextType = {
  habits: Habit[] | null;
  isLoading: boolean;
  addHabit: (habit: Habit) => void;
  updateHabit: (id: string, updatedHabit: Habit) => void;
  deleteHabit: (id: string) => void;
  toggleHabitCompletion: (id: string) => void;
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
  
  // Make gamification optional
  let addXP: ((amount: number, source: string) => Promise<void>) | undefined;
  let checkAchievements: ((habits: Habit[]) => Promise<void>) | undefined;
  
  try {
    const gamification = useGamification();
    addXP = gamification.addXP;
    checkAchievements = gamification.checkAchievements;
  } catch (error) {
    // GamificationContext not available yet
    console.log('GamificationContext not available');
  }

  // Load habits from storage on mount
  useEffect(() => {
    loadHabits();
  }, []);

  // Separate effect for date checking that runs after habits are loaded
  useEffect(() => {
    if (habits === null) return; // Don't run until habits are loaded
    
    // Reset completedToday flag at midnight
    const checkDate = async () => {
      try {
        const now = new Date();
        const today = now.toISOString().split('T')[0];
        
        const lastDate = await AsyncStorage.getItem('lastCheckDate');
        if (lastDate !== today) {
          await resetCompletedToday();
          await AsyncStorage.setItem('lastCheckDate', today);
        }
      } catch (error) {
        console.error('Failed to check date:', error);
      }
    };
    
    checkDate();
    const interval = setInterval(checkDate, 60000);
    
    return () => clearInterval(interval);
  }, [habits]); // Run this effect when habits change (including when first loaded)

  const loadHabits = async () => {
    try {
      const storedHabits = await AsyncStorage.getItem('habits');
      if (storedHabits) {
        setHabits(JSON.parse(storedHabits));
      } else {
        setHabits([]);
      }
    } catch (error) {
      console.error('Failed to load habits:', error);
      setHabits([]);
    } finally {
      setIsLoading(false);
    }
  };
  
  const saveHabits = async (updatedHabits: Habit[]) => {
    try {
      await AsyncStorage.setItem('habits', JSON.stringify(updatedHabits));
    } catch (error) {
      console.error('Failed to save habits:', error);
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
      console.log('Reset completed today for', updatedHabits.length, 'habits'); // Add logging
    } catch (error) {
      console.error('Failed to reset completed today:', error);
    }
  };
  
  // Update the addHabit function
  const addHabit = async (habit: Habit) => {
    if (!habits) return;
    
    try {
      const newHabit = {
        ...habit,
        order: habits.length // Set order to the end
      };
      const updatedHabits = [...habits, newHabit];
      setHabits(updatedHabits);
      await saveHabits(updatedHabits);
      
      // Schedule reminder if enabled
      if (habit.reminderEnabled && habit.reminderTime) {
        const hasPermission = await requestNotificationPermissions();
        if (hasPermission) {
          await scheduleHabitReminder(newHabit);
        }
      }
    } catch (error) {
      console.error('Failed to add habit:', error);
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
      
      // Handle reminder changes
      if (updatedHabit.reminderEnabled && updatedHabit.reminderTime) {
        const hasPermission = await requestNotificationPermissions();
        if (hasPermission) {
          await scheduleHabitReminder(updatedHabit);
        }
      } else {
        await cancelHabitReminder(id);
      }
    } catch (error) {
      console.error('Failed to update habit:', error);
    }
  };
  
  // Update the deleteHabit function
  const deleteHabit = async (id: string) => {
    if (!habits) return;
    
    try {
      const updatedHabits = habits.filter(habit => habit.id !== id);
      setHabits(updatedHabits);
      await saveHabits(updatedHabits);
      
      // Cancel any reminders for this habit
      await cancelHabitReminder(id);
    } catch (error) {
      console.error('Failed to delete habit:', error);
    }
  };
  
  // Enhanced toggleHabitCompletion with gamification integration
  const toggleHabitCompletion = async (id: string) => {
    if (!habits) return;
    
    try {
      const now = new Date();
      const today = now.toISOString().split('T')[0];
      const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
      
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
            const yesterdayStr = yesterday.toISOString().split('T')[0];
            
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
          
          return {
            ...habit,
            completedToday: !wasCompleted,
            completedDates,
            completionTimes: completionTimes.slice(-10), // Keep last 10 completion times
            streak,
            bestStreak: isNewStreakRecord ? streak : (habit.bestStreak || streak),
            isNewStreakRecord, // Temporary flag for celebration
          };
        }
        return habit;
      });
      
      setHabits(updatedHabits);
      await saveHabits(updatedHabits);
      
      // Make gamification calls conditional
      const completedHabit = updatedHabits.find(h => h.id === id);
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
      
      // Trigger AI analysis after habit completion
      setTimeout(() => {
        checkAndScheduleMotivationalSupport(updatedHabits);
        
        // Suggest smart reminders for habits without reminders
        const suggestions = aiService.generateSmartReminderSuggestions(updatedHabits);
        suggestions.slice(0, 1).forEach(suggestion => { // Only show top suggestion
          const habit = updatedHabits.find(h => h.id === suggestion.habitId);
          if (habit) {
            scheduleSmartReminderSuggestion(
              habit.title,
              suggestion.suggestedTime,
              suggestion.reason
            );
          }
        });
      }, 2000); // Delay to avoid overwhelming user
    } catch (error) {
      console.error('Failed to toggle habit completion:', error);
    }
  };
  
  const checkForCelebrations = (updatedHabits: Habit[], completedHabitId: string) => {
    const completedHabit = updatedHabits.find(h => h.id === completedHabitId);
    
    if (!completedHabit || !completedHabit.completedToday) return;
    
    // Check for streak milestones
    if (completedHabit.isNewStreakRecord && completedHabit.streak >= 7) {
      const streakMessage = getStreakMessage(completedHabit.streak);
      showCelebration('streak', streakMessage);
      return;
    }
    
    // Check if all habits are completed today
    const allCompleted = updatedHabits.every(habit => habit.completedToday);
    if (allCompleted && updatedHabits.length > 0) {
      showCelebration('allComplete', '🎉 All habits complete today! You\'re crushing it!');
      return;
    }
    
    // Check for other milestones
    if (completedHabit.streak === 30) {
      showCelebration('milestone', '🏆 30-day streak! You\'re a habit master!');
    } else if (completedHabit.streak === 100) {
      showCelebration('milestone', '💎 100-day streak! Absolutely legendary!');
    }
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
        return aiService.generateSmartReminderSuggestions(habits);
      };
  
      const triggerMotivationalCheck = () => {
        if (habits) {
          checkAndScheduleMotivationalSupport(habits);
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
          const dateStr = date.toISOString().split('T')[0];
          
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
          const dateStr = date.toISOString().split('T')[0];
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
          const dateStr = date.toISOString().split('T')[0];
          
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
  
      const reorderHabits = (reorderedHabits: Habit[]) => {
        if (!habits) return;
        
        try {
          const updatedHabits = reorderedHabits.map((habit, index) => ({
            ...habit,
            order: index
          }));
          
          // Update state immediately for smooth UI
          setHabits(updatedHabits);
          
          // Save to storage asynchronously without blocking
          saveHabits(updatedHabits).catch(error => {
            console.error('Failed to save reordered habits:', error);
          });
        } catch (error) {
          console.error('Failed to reorder habits:', error);
        }
      };
  
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
  
      const value: HabitContextType = {
        habits: habits ? [...habits].sort((a, b) => (a.order || 0) - (b.order || 0)) : null,
        isLoading,
        addHabit,
        updateHabit,
        deleteHabit,
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
      };
  
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

    