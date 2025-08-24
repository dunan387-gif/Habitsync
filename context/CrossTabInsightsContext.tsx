import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { useHabits } from './HabitContext';
import { useAuth } from './AuthContext';
import { useLanguage } from './LanguageContext';

// Unified data structure for cross-tab insights
export interface CrossTabData {
  home: {
    todayCompletions: number;
    totalHabits: number;
    currentStreak: number;
    longestStreak: number;
    nextHabitRecommendation: string;
    streakContext: string;
  };
  library: {
    coursesCompleted: number;
    totalCourses: number;
    appliedTechniques: string[];
    courseImpact: string;
    nextCourseRecommendation: string;
  };
  gamification: {
    currentLevel: number;
    totalXP: number;
    recentAchievements: string[];
    nextMilestone: string;
    streakMotivation: string;
  };
  settings: {
    preferredTime: string;
    difficultyLevel: 'beginner' | 'intermediate' | 'advanced';
    focusAreas: string[];
    notificationStyle: 'gentle' | 'motivational' | 'strict';
  };
}

export interface TodayInsight {
  mainMetric: string;
  nextAction: string;
  motivation: string;
  context: string;
  priority: 'high' | 'medium' | 'low';
}

export interface WeeklyProgress {
  trend: 'improving' | 'stable' | 'declining';
  keyMetric: string;
  improvement: string;
  recommendation: string;
  percentageChange: number;
}

export interface LearningInsight {
  courseImpact: string;
  knowledgeApplied: string;
  nextLearning: string;
  impactScore: number;
}

interface CrossTabInsightsState {
  data: CrossTabData;
  todayInsight: TodayInsight | null;
  weeklyProgress: WeeklyProgress | null;
  learningInsight: LearningInsight | null;
  isLoading: boolean;
  error: string | null;
  lastUpdated: Date | null;
}

type CrossTabInsightsAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'UPDATE_HOME_DATA'; payload: Partial<CrossTabData['home']> }
  | { type: 'UPDATE_LIBRARY_DATA'; payload: Partial<CrossTabData['library']> }
  | { type: 'UPDATE_GAMIFICATION_DATA'; payload: Partial<CrossTabData['gamification']> }
  | { type: 'UPDATE_SETTINGS_DATA'; payload: Partial<CrossTabData['settings']> }
  | { type: 'SET_TODAY_INSIGHT'; payload: TodayInsight }
  | { type: 'SET_WEEKLY_PROGRESS'; payload: WeeklyProgress }
  | { type: 'SET_LEARNING_INSIGHT'; payload: LearningInsight }
  | { type: 'UPDATE_TIMESTAMP' };

const initialState: CrossTabInsightsState = {
  data: {
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
  },
  todayInsight: null,
  weeklyProgress: null,
  learningInsight: null,
  isLoading: false,
  error: null,
  lastUpdated: null,
};

function crossTabInsightsReducer(
  state: CrossTabInsightsState,
  action: CrossTabInsightsAction
): CrossTabInsightsState {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    case 'UPDATE_HOME_DATA':
      return {
        ...state,
        data: {
          ...state.data,
          home: { ...state.data.home, ...action.payload },
        },
      };
    case 'UPDATE_LIBRARY_DATA':
      return {
        ...state,
        data: {
          ...state.data,
          library: { ...state.data.library, ...action.payload },
        },
      };
    case 'UPDATE_GAMIFICATION_DATA':
      return {
        ...state,
        data: {
          ...state.data,
          gamification: { ...state.data.gamification, ...action.payload },
        },
      };
    case 'UPDATE_SETTINGS_DATA':
      return {
        ...state,
        data: {
          ...state.data,
          settings: { ...state.data.settings, ...action.payload },
        },
      };
    case 'SET_TODAY_INSIGHT':
      return { ...state, todayInsight: action.payload };
    case 'SET_WEEKLY_PROGRESS':
      return { ...state, weeklyProgress: action.payload };
    case 'SET_LEARNING_INSIGHT':
      return { ...state, learningInsight: action.payload };
    case 'UPDATE_TIMESTAMP':
      return { ...state, lastUpdated: new Date() };
    default:
      return state;
  }
}

interface CrossTabInsightsContextType {
  state: CrossTabInsightsState;
  dispatch: React.Dispatch<CrossTabInsightsAction>;
  updateHomeData: (data: Partial<CrossTabData['home']>) => void;
  updateLibraryData: (data: Partial<CrossTabData['library']>) => void;
  updateGamificationData: (data: Partial<CrossTabData['gamification']>) => void;
  updateSettingsData: (data: Partial<CrossTabData['settings']>) => void;
  generateTodayInsight: () => Promise<void>;
  generateWeeklyProgress: () => Promise<void>;
  generateLearningInsight: () => Promise<void>;
  refreshAllData: () => Promise<void>;
}

const CrossTabInsightsContext = createContext<CrossTabInsightsContextType | undefined>(undefined);

export function CrossTabInsightsProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(crossTabInsightsReducer, initialState);
  
  // Safely access contexts with fallbacks
  let habits: any[] = [];
  let user: any = null;
  let t: any = (key: string) => key; // Default translation function
  
  try {
    const habitContext = useHabits();
    habits = habitContext?.habits || [];
  } catch (error) {
    console.warn('useHabits not available:', error);
  }
  
  try {
    const authContext = useAuth();
    user = authContext?.user || null;
  } catch (error) {
    console.warn('useAuth not available:', error);
  }
  
  try {
    const languageContext = useLanguage();
    t = languageContext?.t || ((key: string) => key);
  } catch (error) {
    console.warn('useLanguage not available:', error);
  }

  // Update functions for each tab
  const updateHomeData = (data: Partial<CrossTabData['home']>) => {
    dispatch({ type: 'UPDATE_HOME_DATA', payload: data });
  };

  const updateLibraryData = (data: Partial<CrossTabData['library']>) => {
    dispatch({ type: 'UPDATE_LIBRARY_DATA', payload: data });
  };

  const updateGamificationData = (data: Partial<CrossTabData['gamification']>) => {
    dispatch({ type: 'UPDATE_GAMIFICATION_DATA', payload: data });
  };

  const updateSettingsData = (data: Partial<CrossTabData['settings']>) => {
    dispatch({ type: 'UPDATE_SETTINGS_DATA', payload: data });
  };

  // Generate today's insight based on cross-tab data
  const generateTodayInsight = async () => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      
      const todayCompletions = habits.filter(h => h.completedToday).length;
      const totalHabits = habits.length;
      const completionRate = totalHabits > 0 ? (todayCompletions / totalHabits) * 100 : 0;

      let mainMetric: string;
      let nextAction: string;
      let motivation: string;
      let context: string;
      let priority: 'high' | 'medium' | 'low';

      if (completionRate === 0) {
        mainMetric = t('analytics.insights.noCompletions');
        nextAction = t('analytics.insights.startFirstHabit');
        motivation = t('analytics.insights.everyJourneyStarts');
        context = t('analytics.insights.newDayOpportunity');
        priority = 'high';
      } else if (completionRate < 50) {
        mainMetric = `${todayCompletions}/${totalHabits} ${t('analytics.insights.habitsCompleted')}`;
        nextAction = t('analytics.insights.completeMoreHabits');
        motivation = t('analytics.insights.youreMakingProgress');
        context = t('analytics.insights.roomForImprovement');
        priority = 'medium';
      } else if (completionRate < 100) {
        mainMetric = `${todayCompletions}/${totalHabits} ${t('analytics.insights.habitsCompleted')}`;
        nextAction = t('analytics.insights.completeRemainingHabits');
        motivation = t('analytics.insights.almostThere');
        context = t('analytics.insights.greatProgress');
        priority = 'medium';
      } else {
        mainMetric = t('analytics.insights.allHabitsCompleted');
        nextAction = t('analytics.insights.maintainMomentum');
        motivation = t('analytics.insights.perfectDay');
        context = t('analytics.insights.excellentWork');
        priority = 'low';
      }

      const todayInsight: TodayInsight = {
        mainMetric,
        nextAction,
        motivation,
        context,
        priority,
      };

      dispatch({ type: 'SET_TODAY_INSIGHT', payload: todayInsight });
      dispatch({ type: 'UPDATE_TIMESTAMP' });
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: 'Failed to generate today insight' });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  // Generate weekly progress analysis
  const generateWeeklyProgress = async () => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });

      // Calculate weekly trends (simplified for now)
      const totalCompletions = habits.reduce((sum, habit) => sum + (habit.completedToday ? 1 : 0), 0);
      const averageCompletions = habits.length > 0 ? totalCompletions / habits.length : 0;

      let trend: 'improving' | 'stable' | 'declining';
      let improvement: string;
      let recommendation: string;
      let percentageChange: number;

      if (averageCompletions > 0.7) {
        trend = 'improving';
        improvement = t('analytics.progress.strongPerformance');
        recommendation = t('analytics.progress.keepConsistency');
        percentageChange = 15;
      } else if (averageCompletions > 0.4) {
        trend = 'stable';
        improvement = t('analytics.progress.steadyProgress');
        recommendation = t('analytics.progress.increaseEffort');
        percentageChange = 5;
      } else {
        trend = 'declining';
        improvement = t('analytics.progress.needsAttention');
        recommendation = t('analytics.progress.focusOnBasics');
        percentageChange = -10;
      }

      const weeklyProgress: WeeklyProgress = {
        trend,
        keyMetric: t('analytics.progress.completionRate'),
        improvement,
        recommendation,
        percentageChange,
      };

      dispatch({ type: 'SET_WEEKLY_PROGRESS', payload: weeklyProgress });
      dispatch({ type: 'UPDATE_TIMESTAMP' });
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: 'Failed to generate weekly progress' });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  // Generate learning insight
  const generateLearningInsight = async () => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });

      // Simplified learning insight for now
      const learningInsight: LearningInsight = {
        courseImpact: t('analytics.learning.noCoursesYet'),
        knowledgeApplied: t('analytics.learning.startLearning'),
        nextLearning: t('analytics.learning.exploreLibrary'),
        impactScore: 0,
      };

      dispatch({ type: 'SET_LEARNING_INSIGHT', payload: learningInsight });
      dispatch({ type: 'UPDATE_TIMESTAMP' });
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: 'Failed to generate learning insight' });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  // Refresh all cross-tab data
  const refreshAllData = async () => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'SET_ERROR', payload: null });

      // Update home data
      const todayCompletions = habits.filter(h => h.completedToday).length;
      const totalHabits = habits.length;
      const currentStreak = Math.max(...habits.map(h => h.currentStreak || 0), 0);
      const longestStreak = Math.max(...habits.map(h => h.longestStreak || 0), 0);

      updateHomeData({
        todayCompletions,
        totalHabits,
        currentStreak,
        longestStreak,
        nextHabitRecommendation: habits.find(h => !h.completedToday)?.title || '',
        streakContext: currentStreak > 0 ? `${currentStreak} day streak!` : 'Start your streak today!',
      });

      // Generate insights
      await Promise.all([
        generateTodayInsight(),
        generateWeeklyProgress(),
        generateLearningInsight(),
      ]);

      dispatch({ type: 'UPDATE_TIMESTAMP' });
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: 'Failed to refresh data' });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  // Auto-refresh data when habits change
  useEffect(() => {
    if (habits.length > 0) {
      refreshAllData();
    }
  }, [habits]);

  const value: CrossTabInsightsContextType = {
    state,
    dispatch,
    updateHomeData,
    updateLibraryData,
    updateGamificationData,
    updateSettingsData,
    generateTodayInsight,
    generateWeeklyProgress,
    generateLearningInsight,
    refreshAllData,
  };

  return (
    <CrossTabInsightsContext.Provider value={value}>
      {children}
    </CrossTabInsightsContext.Provider>
  );
}

export function useCrossTabInsights() {
  const context = useContext(CrossTabInsightsContext);
  if (context === undefined) {
    throw new Error('useCrossTabInsights must be used within a CrossTabInsightsProvider');
  }
  return context;
}
