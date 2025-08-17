import React, { createContext, useContext, useState, useEffect, ReactNode, useRef, useMemo } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Achievement, UserLevel, MoodEntry, StreakMilestone, GamificationData, Habit, HabitMoodEntry } from '@/types';
import { useCelebration } from '@/context/CelebrationContext';
import { useAuth } from '@/context/AuthContext';
import { getLocalDateString } from '@/utils/timezone';

// Helper function to get translated achievement content
const getTranslatedAchievementContent = (achievementId: string, language: string = 'en') => {
  const achievementContentMap: { [key: string]: { [key: string]: { title: string; description: string } } } = {
    'first_course': {
      en: { title: 'Knowledge Seeker', description: 'Enrolled in your first course' },
      es: { title: 'Buscador de Conocimiento', description: 'Te inscribiste en tu primer curso' },
      fr: { title: 'Chercheur de Connaissances', description: 'Inscrit à votre premier cours' },
      zh: { title: '知识探索者', description: '注册了您的第一个课程' }
    },
    'course_collector': {
      en: { title: 'Course Collector', description: 'Enrolled in 5 different courses' },
      es: { title: 'Coleccionista de Cursos', description: 'Te inscribiste en 5 cursos diferentes' },
      fr: { title: 'Collectionneur de Cours', description: 'Inscrit à 5 cours différents' },
      zh: { title: '课程收集者', description: '注册了5个不同的课程' }
    },
    'knowledge_seeker': {
      en: { title: 'Knowledge Seeker', description: 'Completed 3 course modules' },
      es: { title: 'Buscador de Conocimiento', description: 'Completaste 3 módulos de curso' },
      fr: { title: 'Chercheur de Connaissances', description: 'Terminé 3 modules de cours' },
      zh: { title: '知识探索者', description: '完成了3个课程模块' }
    },
    'guided_master': {
      en: { title: 'Guided Master', description: 'Completed 3 guided setups' },
      es: { title: 'Maestro Guiado', description: 'Completaste 3 configuraciones guiadas' },
      fr: { title: 'Maître Guidé', description: 'Terminé 3 configurations guidées' },
      zh: { title: '引导大师', description: '完成了3个引导设置' }
    },
    'learning_streak': {
      en: { title: 'Learning Streak', description: 'Learned for 5 consecutive days' },
      es: { title: 'Racha de Aprendizaje', description: 'Aprendiste durante 5 días consecutivos' },
      fr: { title: 'Série d\'Apprentissage', description: 'Appris pendant 5 jours consécutifs' },
      zh: { title: '学习连胜', description: '连续学习5天' }
    },
    'knowledge_sharer': {
      en: { title: 'Knowledge Sharer', description: 'Shared knowledge with the community' },
      es: { title: 'Compartidor de Conocimiento', description: 'Compartiste conocimiento con la comunidad' },
      fr: { title: 'Partageur de Connaissances', description: 'Partagé des connaissances avec la communauté' },
      zh: { title: '知识分享者', description: '与社区分享知识' }
    },
    'library_explorer': {
      en: { title: 'Library Explorer', description: 'Explored all library sections' },
      es: { title: 'Explorador de Biblioteca', description: 'Exploraste todas las secciones de la biblioteca' },
      fr: { title: 'Explorateur de Bibliothèque', description: 'Exploré toutes les sections de la bibliothèque' },
      zh: { title: '图书馆探索者', description: '探索了所有图书馆部分' }
    },
    'feedback_contributor': {
      en: { title: 'Feedback Contributor', description: 'Provided feedback on library content' },
      es: { title: 'Contribuidor de Comentarios', description: 'Proporcionaste comentarios sobre el contenido de la biblioteca' },
      fr: { title: 'Contributeur de Retours', description: 'Fourni des retours sur le contenu de la bibliothèque' },
      zh: { title: '反馈贡献者', description: '为图书馆内容提供反馈' }
    },
    'study_group_creator': {
      en: { title: 'Study Group Creator', description: 'Created your first study group' },
      es: { title: 'Creador de Grupo de Estudio', description: 'Creaste tu primer grupo de estudio' },
      fr: { title: 'Créateur de Groupe d\'Étude', description: 'Créé votre premier groupe d\'étude' },
      zh: { title: '学习小组创建者', description: '创建了您的第一个学习小组' }
    },
    'study_group_joiner': {
      en: { title: 'Study Group Joiner', description: 'Joined 3 different study groups' },
      es: { title: 'Miembro de Grupo de Estudio', description: 'Te uniste a 3 grupos de estudio diferentes' },
      fr: { title: 'Membre de Groupe d\'Étude', description: 'Rejoint 3 groupes d\'étude différents' },
      zh: { title: '学习小组成员', description: '加入了3个不同的学习小组' }
    },
    'learning_circle_leader': {
      en: { title: 'Learning Circle Leader', description: 'Led 5 study sessions' },
      es: { title: 'Líder del Círculo de Aprendizaje', description: 'Dirigiste 5 sesiones de estudio' },
      fr: { title: 'Leader du Cercle d\'Apprentissage', description: 'Dirigé 5 sessions d\'étude' },
      zh: { title: '学习圈领导者', description: '领导了5次学习会议' }
    },
    'peer_mentor': {
      en: { title: 'Peer Mentor', description: 'Helped 10 other learners' },
      es: { title: 'Mentor de Pares', description: 'Ayudaste a 10 otros estudiantes' },
      fr: { title: 'Mentor de Pairs', description: 'Aidé 10 autres apprenants' },
      zh: { title: '同伴导师', description: '帮助了10位其他学习者' }
    }
  };

  return achievementContentMap[achievementId]?.[language] || achievementContentMap[achievementId]?.['en'] || { title: '', description: '' };
};

// Add AdaptiveChallenge interface
interface AdaptiveChallenge {
  id: string;
  type: string;
  difficulty: 'easy' | 'medium' | 'hard';
  createdAt: string;
  completed: boolean;
  progress: number;
  target: number;
}

interface GamificationContextType {
  gamificationData: GamificationData | null;
  addXP: (amount: number, source: string) => Promise<void>;
  unlockAchievement: (achievementId: string) => Promise<void>;
  addMoodEntry: (moodState: 'happy' | 'sad' | 'anxious' | 'energetic' | 'tired' | 'stressed' | 'calm', intensity: number, note?: string, triggers?: ('work' | 'relationships' | 'health' | 'weather' | 'sleep' | 'exercise' | 'social')[], skipXP?: boolean) => Promise<void>;
  checkAchievements: (habits: Habit[]) => Promise<void>;
  getAvailableAchievements: () => Achievement[];
  getTodaysMoodEntry: () => MoodEntry | null;
  canCheckMoodToday: () => boolean;
  getXPForAction: (action: string) => number;
  // NEW: Habit-Mood Integration
  addHabitMoodEntry: (entry: HabitMoodEntry) => Promise<void>;
  getHabitMoodEntries: (habitId?: string) => HabitMoodEntry[];
  getMoodEntries: () => MoodEntry[];
  // New methods for adaptive challenges
  createAdaptiveChallenge: (type: string, difficulty: 'easy' | 'medium' | 'hard') => Promise<void>;
  completeAdaptiveChallenge: (challengeId: string) => Promise<void>;
  getActiveAdaptiveChallenges: () => AdaptiveChallenge[];
        // Level perks method
      getLevelPerks: (level: number) => string[];
  // Clear gamification data method
  clearGamificationData: () => Promise<void>;
  // Library & Learning Integration Methods
  trackCourseEnrollment: (courseId: string, courseTitle: string) => Promise<void>;
  trackCourseCompletion: (courseId: string, courseTitle: string) => Promise<void>;
  trackModuleCompletion: (courseId: string, moduleId: string, moduleTitle: string) => Promise<void>;
  trackGuidedSetupCompletion: (setupId: string, setupTitle: string) => Promise<void>;
  trackLibraryFeedback: (rating: number, feedbackText?: string) => Promise<void>;
  trackLearningStreak: (days: number) => Promise<void>;
  trackKnowledgeSharing: (type: 'course_insight' | 'community_post' | 'feedback') => Promise<void>;
  getLearningStats: () => {
    coursesCompleted: number;
    modulesCompleted: number;
    guidedSetupsCompleted: number;
    learningStreak: number;
    totalLearningTime: number;
    knowledgeShared: number;
  };
  // Phase 3B methods
  trackStudyGroupCreation: (groupId: string, groupName: string) => Promise<void>;
  trackStudyGroupJoin: (groupId: string, groupName: string) => Promise<void>;
  trackStudySessionCompletion: (sessionId: string, duration: number, participants: number) => Promise<void>;
  trackPeerRecommendation: (recommendationType: 'given' | 'received', courseId: string) => Promise<void>;
  trackLearningCircleContribution: (circleId: string, contributionType: string) => Promise<void>;
  getSocialLearningStats: () => Promise<{
    studyGroupsCreated: number;
    studyGroupsJoined: number;
    studySessionsCompleted: number;
    peerRecommendationsGiven: number;
    peerRecommendationsReceived: number;
    learningCircleContributions: number;
  }>;
}

const GamificationContext = createContext<GamificationContextType | undefined>(undefined);

// XP Rewards for different actions
const XP_REWARDS = {
  habit_completed: 10,
  streak_milestone: 50,
  mood_check: 5,
  community_post: 15,
  achievement_unlocked: 100,
  level_up: 200,
  social_interaction: 10,
  course_enrollment: 25,
  course_completion: 100,
  module_completion: 30,
  guided_setup_completion: 50,
  library_feedback: 15,
  course_recommendation: 20,
  learning_streak: 40,
  knowledge_sharing: 25,
  study_group_created: 75,
  study_group_joined: 30,
  study_session_completed: 45,
  peer_recommendation_given: 35,
  peer_recommendation_received: 25,
  learning_circle_contribution: 40,
  adaptive_challenge: 60,
} as const;

const LEVEL_TITLE_KEYS = [
  'gamification.levelTitles.habitBeginner',
  'gamification.levelTitles.routineBuilder', 
  'gamification.levelTitles.consistencySeeker',
  'gamification.levelTitles.habitEnthusiast',
  'gamification.levelTitles.routineMaster',
  'gamification.levelTitles.habitChampion',
  'gamification.levelTitles.lifestyleArchitect',
  'gamification.levelTitles.habitLegend'
];

const ACHIEVEMENTS = {
  // Existing achievements
  first_habit: {
    id: 'first_habit',
    title: 'First Steps',
    description: 'Created your first habit',
    category: 'habit' as const,
    xpReward: 50,
    icon: '🎯',
  },
  streak_7: {
    id: 'streak_7',
    title: 'Week Warrior',
    description: 'Maintained a 7-day streak',
    category: 'streak' as const,
    xpReward: 100,
    icon: '🔥',
  },
  streak_30: {
    id: 'streak_30',
    title: 'Monthly Master',
    description: 'Maintained a 30-day streak',
    category: 'streak' as const,
    xpReward: 300,
    icon: '👑',
  },
  mood_tracker: {
    id: 'mood_tracker',
    title: 'Mood Master',
    description: 'Tracked mood for 7 consecutive days',
    category: 'mood' as const,
    xpReward: 75,
    icon: '😊',
  },
  social_butterfly: {
    id: 'social_butterfly',
    title: 'Social Butterfly',
    description: 'Interacted with 5 community posts',
    category: 'social' as const,
    xpReward: 80,
    icon: '🦋',
  },
  habit_collector: {
    id: 'habit_collector',
    title: 'Habit Collector',
    description: 'Created 10 different habits',
    category: 'habit' as const,
    xpReward: 150,
    icon: '📚',
  },
  // Learning achievements (Phase 3A)
  first_course: {
    id: 'first_course',
    title: getTranslatedAchievementContent('first_course', 'en').title,
    description: getTranslatedAchievementContent('first_course', 'en').description,
    category: 'learning' as const,
    xpReward: 75,
    icon: '🎓',
  },
  course_collector: {
    id: 'course_collector',
    title: 'Course Collector',
    description: 'Enrolled in 5 different courses',
    category: 'learning' as const,
    xpReward: 200,
    icon: '📖',
  },
  knowledge_seeker: {
    id: 'knowledge_seeker',
    title: 'Knowledge Seeker',
    description: 'Completed 3 course modules',
    category: 'learning' as const,
    xpReward: 150,
    icon: '🔍',
  },
  guided_master: {
    id: 'guided_master',
    title: 'Guided Master',
    description: 'Completed 3 guided setups',
    category: 'learning' as const,
    xpReward: 180,
    icon: '🎯',
  },
  learning_streak: {
    id: 'learning_streak',
    title: 'Learning Streak',
    description: 'Learned for 5 consecutive days',
    category: 'learning' as const,
    xpReward: 120,
    icon: '📈',
  },
  knowledge_sharer: {
    id: 'knowledge_sharer',
    title: 'Knowledge Sharer',
    description: 'Shared knowledge with the community',
    category: 'learning' as const,
    xpReward: 100,
    icon: '🤝',
  },
  library_explorer: {
    id: 'library_explorer',
    title: 'Library Explorer',
    description: 'Explored all library sections',
    category: 'learning' as const,
    xpReward: 90,
    icon: '🔍',
  },
  feedback_contributor: {
    id: 'feedback_contributor',
    title: 'Feedback Contributor',
    description: 'Provided feedback on library content',
    category: 'learning' as const,
    xpReward: 60,
    icon: '💬',
  },
  // Phase 3B: Social Learning achievements
  study_group_creator: {
    id: 'study_group_creator',
    title: 'Study Group Creator',
    description: 'Created your first study group',
    category: 'learning' as const,
    xpReward: 150,
    icon: '👥',
  },
  study_group_joiner: {
    id: 'study_group_joiner',
    title: 'Study Group Joiner',
    description: 'Joined 3 different study groups',
    category: 'learning' as const,
    xpReward: 120,
    icon: '🤝',
  },
  learning_circle_leader: {
    id: 'learning_circle_leader',
    title: 'Learning Circle Leader',
    description: 'Led 5 study sessions',
    category: 'learning' as const,
    xpReward: 250,
    icon: '👑',
  },
  peer_mentor: {
    id: 'peer_mentor',
    title: 'Peer Mentor',
    description: 'Helped 10 other learners',
    category: 'learning' as const,
    xpReward: 200,
    icon: '🎓',
  },
  recommendation_expert: {
    id: 'recommendation_expert',
    title: 'Recommendation Expert',
    description: 'Made 20 helpful course recommendations',
    category: 'learning' as const,
    xpReward: 180,
    icon: '⭐',
  },
  community_educator: {
    id: 'community_educator',
    title: 'Community Educator',
    description: 'Shared educational content 15 times',
    category: 'learning' as const,
    xpReward: 220,
    icon: '📚',
  },
  collaborative_learner: {
    id: 'collaborative_learner',
    title: 'Collaborative Learner',
    description: 'Participated in 10 collaborative learning sessions',
    category: 'learning' as const,
    xpReward: 160,
    icon: '🤲',
  },
  knowledge_networker: {
    id: 'knowledge_networker',
    title: 'Knowledge Networker',
    description: 'Connected with 25 other learners',
    category: 'learning' as const,
    xpReward: 140,
    icon: '🌐',
  },
} as const;

// Convert ACHIEVEMENTS object to array for INITIAL_GAMIFICATION_DATA
const ACHIEVEMENTS_ARRAY: Achievement[] = Object.values(ACHIEVEMENTS).map(a => ({
  id: a.id,
  title: a.title,
  description: a.description,
  icon: a.icon,
  condition: a.description,
  category: a.category,
  xpReward: a.xpReward,
  rarity: 'common' as const
}));

const INITIAL_GAMIFICATION_DATA: GamificationData = {
  userLevel: {
    level: 1,
    currentXP: 0,
    xpToNextLevel: 100,
    totalXP: 0,
    title: '', // Will be set dynamically using translation keys
    perks: [] // Will be set dynamically using translation keys
  },
  achievements: ACHIEVEMENTS_ARRAY,
  unlockedAchievements: [],
  streakMilestones: [],
  moodEntries: [],
  habitMoodEntries: [], // Add missing property
  dailyXPEarned: 0,
  xp: 0 // Add missing xp property
};

export function GamificationProvider({ children }: { children: ReactNode }) {
  const [gamificationData, setGamificationData] = useState<GamificationData | null>(null);
  const [adaptiveChallenges, setAdaptiveChallenges] = useState<AdaptiveChallenge[]>([]);
  const { showCelebration } = useCelebration();
  const { user } = useAuth();
  
  const unlockedAchievementsRef = useRef<string[]>([]);
  const [isCheckingAchievements, setIsCheckingAchievements] = useState(false);

  // Helper function to safely get translations
  const getTranslation = (key: string, params?: Record<string, any>): string => {
    // For level titles and perks, return the key so they can be translated by the UI components
    if (key.startsWith('gamification.levelTitles.') || key.startsWith('gamification.perks.')) {
      return key;
    }
    
    // Fallback translations for messages
    const fallbackTranslations: Record<string, string> = {
      'gamification.messages.levelUp': 'Level Up! You reached level {level}!',
      'gamification.messages.achievementUnlocked': 'Achievement Unlocked: {title}!',
    };
    
    let translation = fallbackTranslations[key] || key;
    
    // Replace parameters
    if (params) {
      Object.keys(params).forEach(paramKey => {
        const placeholder = `{${paramKey}}`;
        translation = translation.replace(new RegExp(placeholder, 'g'), String(params[paramKey]));
      });
    }
    
    return translation;
  };

  // ✅ Update ref whenever gamificationData changes
  useEffect(() => {
    if (gamificationData) {
      unlockedAchievementsRef.current = gamificationData.unlockedAchievements;
    }
  }, [gamificationData]);

  useEffect(() => {
    loadGamificationData();
  }, []);

  // Reload gamification data when user changes
  useEffect(() => {
    loadGamificationData();
  }, [user?.id]);

  useEffect(() => {
    if (gamificationData) {
      // Debounce the save operation to avoid multiple rapid saves
      const timeoutId = setTimeout(() => {
        saveGamificationData();
      }, 100);
      
      return () => clearTimeout(timeoutId);
    }
  }, [gamificationData]);

  // Define getLevelPerks function before it's used in useMemo
  const getLevelPerks = (level: number): string[] => {
    const perks = [getTranslation('gamification.perks.dailyHabitTracking')];
    if (level >= 3) perks.push(getTranslation('gamification.perks.advancedStatistics'));
    if (level >= 5) perks.push(getTranslation('gamification.perks.customThemes'));
    if (level >= 10) perks.push(getTranslation('gamification.perks.aiHabitSuggestions'));
    if (level >= 15) perks.push(getTranslation('gamification.perks.premiumFeatures'));
    return perks;
  };

  // Compute translated title and perks using useMemo to avoid infinite loops
  const translatedGamificationData = useMemo(() => {
    if (!gamificationData) return gamificationData;
    
    return {
      ...gamificationData,
      userLevel: {
        ...gamificationData.userLevel,
        title: getTranslation(LEVEL_TITLE_KEYS[Math.min(gamificationData.userLevel.level - 1, LEVEL_TITLE_KEYS.length - 1)]),
        perks: getLevelPerks(gamificationData.userLevel.level)
      }
    };
  }, [gamificationData]);


  const loadGamificationData = async () => {
    try {
      if (!user) {
        // No user - use global key for anonymous state
        const stored = await AsyncStorage.getItem('gamificationData');
        if (stored) {
          const data = JSON.parse(stored);
          const loadedData = { ...INITIAL_GAMIFICATION_DATA, ...data, achievements: ACHIEVEMENTS_ARRAY };
          setGamificationData(loadedData);
        } else {
          const initialData = { ...INITIAL_GAMIFICATION_DATA, achievements: ACHIEVEMENTS_ARRAY };
          setGamificationData(initialData);
        }
      } else {
        // User exists - use user-specific key
        const userGamificationKey = `gamification_${user.id}`;
        const stored = await AsyncStorage.getItem(userGamificationKey);
        if (stored) {
          const data = JSON.parse(stored);
          const loadedData = { ...INITIAL_GAMIFICATION_DATA, ...data, achievements: ACHIEVEMENTS_ARRAY };
          setGamificationData(loadedData);
        } else {
          const initialData = { ...INITIAL_GAMIFICATION_DATA, achievements: ACHIEVEMENTS_ARRAY };
          setGamificationData(initialData);
        }
      }
    } catch (error) {
      console.error('Failed to load gamification data:', error);
      const fallbackData = { ...INITIAL_GAMIFICATION_DATA, achievements: ACHIEVEMENTS_ARRAY };
      setGamificationData(fallbackData);
    }
  };

  const saveGamificationData = async () => {
    if (!gamificationData) return;
    try {
      if (!user) {
        // No user - save to global key
        await AsyncStorage.setItem('gamificationData', JSON.stringify(gamificationData));
      } else {
        // User exists - save to user-specific key
        const userGamificationKey = `gamification_${user.id}`;
        await AsyncStorage.setItem(userGamificationKey, JSON.stringify(gamificationData));
      }
    } catch (error) {
      console.error('❌ Failed to save gamification data:', error);
    }
  };

  const calculateXPToNextLevel = (level: number): number => {
    return Math.floor(100 * Math.pow(1.5, level - 1));
  };

  const addXP = async (amount: number, source: string) => {
    if (!gamificationData) {
      console.error('❌ No gamification data available');
      return;
    }

    // ✅ Calculate all updates in one go to prevent race conditions
    const newTotalXP = gamificationData.userLevel.totalXP + amount;
    const newCurrentXP = gamificationData.userLevel.currentXP + amount;
    let newLevel = gamificationData.userLevel.level;
    let xpToNextLevel = gamificationData.userLevel.xpToNextLevel;

    // Check for level up
    while (newCurrentXP >= xpToNextLevel) {
      newLevel++;
      const remainingXP = newCurrentXP - xpToNextLevel;
      xpToNextLevel = calculateXPToNextLevel(newLevel);
      
      // Show level up celebration
      showCelebration('level_up', getTranslation('gamification.messages.levelUp', { level: newLevel }));
    }

    const updatedData = {
      ...gamificationData,
      userLevel: {
        level: newLevel,
        currentXP: newCurrentXP >= xpToNextLevel ? newCurrentXP - xpToNextLevel : newCurrentXP,
        xpToNextLevel,
        totalXP: newTotalXP,
        title: getTranslation(LEVEL_TITLE_KEYS[Math.min(newLevel - 1, LEVEL_TITLE_KEYS.length - 1)]),
        perks: getLevelPerks(newLevel)
      },
      dailyXPEarned: gamificationData.dailyXPEarned + amount
    };

    try {
      setGamificationData(updatedData);
    } catch (error) {
      console.error('❌ Error setting gamification data for XP:', error);
      throw error;
    }
  };

  const unlockAchievement = async (achievementId: string) => {
    // ✅ Check both state and ref for immediate synchronous check
    if (!gamificationData || 
        gamificationData.unlockedAchievements.includes(achievementId) ||
        unlockedAchievementsRef.current.includes(achievementId)) {
      return;
    }
  
    const achievement = ACHIEVEMENTS[achievementId as keyof typeof ACHIEVEMENTS];
    if (!achievement) {
      console.warn(`Achievement ${achievementId} not found`);
      return;
    }
  
    // ✅ Update ref immediately for synchronous access
    unlockedAchievementsRef.current = [...unlockedAchievementsRef.current, achievementId];
    
    // ✅ Calculate all updates in one go to prevent race conditions
    const newTotalXP = gamificationData.userLevel.totalXP + achievement.xpReward;
    const newCurrentXP = gamificationData.userLevel.currentXP + achievement.xpReward;
    let newLevel = gamificationData.userLevel.level;
    let xpToNextLevel = gamificationData.userLevel.xpToNextLevel;
  
        // Check for level up
    while (newCurrentXP >= xpToNextLevel) {
      newLevel++;
      const remainingXP = newCurrentXP - xpToNextLevel;
      xpToNextLevel = calculateXPToNextLevel(newLevel);
      
      // Show level up celebration
      showCelebration('level_up', getTranslation('gamification.messages.levelUp', { level: newLevel }));
    }

    // ✅ Update state with both achievement and XP in single update
    const updatedData = {
      ...gamificationData,
      unlockedAchievements: [...gamificationData.unlockedAchievements, achievementId],
      userLevel: {
        level: newLevel,
        currentXP: newCurrentXP >= xpToNextLevel ? newCurrentXP - xpToNextLevel : newCurrentXP,
        xpToNextLevel,
        totalXP: newTotalXP,
        title: getTranslation(LEVEL_TITLE_KEYS[Math.min(newLevel - 1, LEVEL_TITLE_KEYS.length - 1)]),
        perks: getLevelPerks(newLevel)
      },
      dailyXPEarned: gamificationData.dailyXPEarned + achievement.xpReward
    };

    try {
      setGamificationData(updatedData);
  
    } catch (error) {
      console.error('❌ Error setting gamification data for achievement:', error);
      throw error;
    }
    
    // ✅ Show celebration after state update
    showCelebration('achievement', getTranslation('gamification.messages.achievementUnlocked', { title: achievement.title }));
  };

  const checkAchievements = async (habits: Habit[]) => {
    if (!gamificationData || isCheckingAchievements) return;

    try {
      setIsCheckingAchievements(true);

      for (const achievement of Object.values(ACHIEVEMENTS)) {
        if (unlockedAchievementsRef.current.includes(achievement.id)) {
          continue;
        }
        
        let shouldUnlock = false;

        switch (achievement.category) {
          case 'habit':
            if (achievement.id === 'first_habit') {
              const totalCompletions = habits.reduce((sum, habit) => sum + habit.completedDates.length, 0);
              shouldUnlock = totalCompletions >= 1;
            } else if (achievement.id === 'habit_collector') {
              shouldUnlock = habits.length >= 10;
            }
            break;

          case 'streak':
            const maxStreak = Math.max(...habits.map(h => h.streak), 0);
            if (achievement.id === 'streak_7') {
              shouldUnlock = maxStreak >= 7;
            } else if (achievement.id === 'streak_30') {
              shouldUnlock = maxStreak >= 30;
            }
            break;

          case 'mood':
            if (achievement.id === 'mood_tracker') {
              const last7Days = Array.from({ length: 7 }, (_, i) => {
                const date = new Date();
                date.setDate(date.getDate() - i);
                const offset = date.getTimezoneOffset();
                const localDate = new Date(date.getTime() - (offset * 60 * 1000));
                return localDate.toISOString().split('T')[0];
              });
              const moodEntries = last7Days.every(date => 
                gamificationData.moodEntries.some(entry => entry.date === date)
              );
              shouldUnlock = moodEntries;
            }
            break;
        }

        if (shouldUnlock) {
          await unlockAchievement(achievement.id);
        }
      }
    } finally {
      setIsCheckingAchievements(false);
    }
  };

  // Helper function to analyze mood-habit correlations
  const analyzeHabitMoodCorrelations = () => {
    if (!gamificationData) return [];
    
    const correlations = [];
    const habitGroups = gamificationData.habitMoodEntries.reduce((acc, entry) => {
      if (!acc[entry.habitId]) acc[entry.habitId] = [];
      acc[entry.habitId].push(entry);
      return acc;
    }, {} as Record<string, HabitMoodEntry[]>);
    
    for (const [habitId, entries] of Object.entries(habitGroups)) {
      if (entries.length < 5) continue; // Need minimum data
      
      const moodSuccessRates = entries.reduce((acc, entry) => {
        if (entry.preMood) {
          const mood = entry.preMood.moodState;
          if (!acc[mood]) acc[mood] = { completed: 0, total: 0 };
          acc[mood].total++;
          if (entry.action === 'completed') acc[mood].completed++;
        }
        return acc;
      }, {} as Record<string, { completed: number; total: number }>);
      
      // Check if there's a significant correlation (>20% difference)
      const rates = Object.values(moodSuccessRates).map(r => r.completed / r.total);
      const maxRate = Math.max(...rates);
      const minRate = Math.min(...rates);
      
      if (maxRate - minRate > 0.2) {
        correlations.push({ habitId, correlation: maxRate - minRate });
      }
    }
    
    return correlations;
  };

  const addMoodEntry = async (
    moodState: 'happy' | 'sad' | 'anxious' | 'energetic' | 'tired' | 'stressed' | 'calm', 
    intensity: number, 
    note?: string, 
    triggers?: ('work' | 'relationships' | 'health' | 'weather' | 'sleep' | 'exercise' | 'social')[],
    skipXP?: boolean // Add parameter to skip automatic XP addition
  ): Promise<void> => {

    
    try {
      if (!gamificationData) {
        console.error('❌ No gamification data available');
        throw new Error('No gamification data available');
      }

      console.log('Adding mood entry:', { moodState, intensity, note, triggers, skipXP });

      const today = getLocalDateString();
      const existingEntryIndex = gamificationData.moodEntries.findIndex(entry => entry.date === today);
      
      let updatedEntries;
      if (existingEntryIndex !== -1) {
        // Update existing entry
        const existingEntry = gamificationData.moodEntries[existingEntryIndex];
        const updatedEntry: MoodEntry = {
          ...existingEntry,
          moodState,
          intensity,
          triggers: triggers || existingEntry.triggers,
          note: note || existingEntry.note,
          timestamp: new Date().toISOString() // Update timestamp
        };
        
        updatedEntries = [...gamificationData.moodEntries];
        updatedEntries[existingEntryIndex] = updatedEntry;

      } else {
        // Create new entry
        const newEntry: MoodEntry = {
          id: `mood_${Date.now()}`,
          date: today,
          moodState,
          intensity,
          triggers,
          note,
          timestamp: new Date().toISOString()
        };
        
        updatedEntries = [...gamificationData.moodEntries, newEntry];

      }
      
      const updatedData = {
        ...gamificationData,
        moodEntries: updatedEntries
      };
      
      try {
        setGamificationData(updatedData);
        console.log('✅ Mood entry saved successfully');
      } catch (error) {
        console.error('❌ Error setting gamification data:', error);
        throw error;
      }
      
      // Add XP for mood check-in only if not skipped (for quick mood check-ins)
      if (!skipXP) {
        setTimeout(async () => {
          try {
            await addXP(XP_REWARDS.mood_check, 'mood_checkin');
          } catch (error) {
            console.error('❌ Error adding XP:', error);
          }
        }, 50);
      }
      
    } catch (error) {
      console.error('❌ Error in addMoodEntry:', error);
      throw error;
    }
  };
  const addHabitMoodEntry = async (entry: HabitMoodEntry) => {
    if (!gamificationData) return;
    
    const updatedData = {
      ...gamificationData,
      habitMoodEntries: [...(gamificationData.habitMoodEntries || []), entry]
    };
    
    try {
      setGamificationData(updatedData);

    } catch (error) {
      console.error('❌ Error adding habit mood entry:', error);
      throw error;
    }
  };
  
  // NEW: Get habit-mood entries
  const getHabitMoodEntries = (habitId?: string): HabitMoodEntry[] => {
    if (!gamificationData) return [];
    
    const entries = gamificationData.habitMoodEntries || [];
    return habitId ? entries.filter(entry => entry.habitId === habitId) : entries;
  };

  const getMoodEntries = (): MoodEntry[] => {
    if (!gamificationData) {
      return [];
    }
    const entries = gamificationData.moodEntries || [];
    return entries;
  };

  const getAvailableAchievements = (): Achievement[] => {
    return Object.values(ACHIEVEMENTS).map(a => {
      const translatedContent = getTranslatedAchievementContent(a.id, 'en'); // Default to English for now
      return {
        id: a.id,
        titleKey: translatedContent.title || a.title,
        descriptionKey: translatedContent.description || a.description,
        icon: a.icon,
        condition: translatedContent.description || a.description, // Use description as condition for now
        category: a.category,
        xpReward: a.xpReward,
        rarity: 'common' // Default rarity
      };
    });
  };

  const getTodaysMoodEntry = (): MoodEntry | null => {
    if (!gamificationData) return null;
    const today = getLocalDateString();
    return gamificationData.moodEntries.find(entry => entry.date === today) || null;
  };

  const canCheckMoodToday = (): boolean => {
    // Always allow mood updates - the addMoodEntry function will handle updating existing entries
    return true;
  };

  const getXPForAction = (action: string): number => {
    return XP_REWARDS[action as keyof typeof XP_REWARDS] || 0;
  };

  // Adaptive Challenge Functions
  const createAdaptiveChallenge = async (type: string, difficulty: 'easy' | 'medium' | 'hard'): Promise<void> => {
    const newChallenge: AdaptiveChallenge = {
      id: `challenge_${Date.now()}`,
      type,
      difficulty,
      createdAt: new Date().toISOString(),
      completed: false,
      progress: 0,
      target: difficulty === 'easy' ? 3 : difficulty === 'medium' ? 5 : 7
    };
    
    try {
      setAdaptiveChallenges(prev => [...prev, newChallenge]);

      await addXP(XP_REWARDS.adaptive_challenge, 'adaptive_challenge_created');
    } catch (error) {
      console.error('❌ Error creating adaptive challenge:', error);
      throw error;
    }
  };

  const completeAdaptiveChallenge = async (challengeId: string): Promise<void> => {
    try {
      setAdaptiveChallenges(prev => 
        prev.map(challenge => 
          challenge.id === challengeId 
            ? { ...challenge, completed: true, progress: challenge.target }
            : challenge
        )
      );

      await addXP(XP_REWARDS.adaptive_challenge, 'adaptive_challenge_completed');
    } catch (error) {
      console.error('❌ Error completing adaptive challenge:', error);
      throw error;
    }
  };

  const getActiveAdaptiveChallenges = (): AdaptiveChallenge[] => {
    return adaptiveChallenges.filter(challenge => !challenge.completed);
  };

  const clearGamificationData = async (): Promise<void> => {
    try {
      // Reset to initial state
      const initialData = { ...INITIAL_GAMIFICATION_DATA, achievements: ACHIEVEMENTS_ARRAY };
      setGamificationData(initialData);
      
      // Clear from storage
      if (!user) {
        await AsyncStorage.removeItem('gamificationData');
      } else {
        const userGamificationKey = `gamification_${user.id}`;
        await AsyncStorage.removeItem(userGamificationKey);
      }
    } catch (error) {
      console.error('Failed to clear gamification data:', error);
    }
  };

  // Library & Learning Integration Methods
  const trackCourseEnrollment = async (courseId: string, courseTitle: string): Promise<void> => {
    try {
      await addXP(XP_REWARDS.course_enrollment, 'course_enrollment');
      
      // Check for first course achievement
      const completedCourses = gamificationData?.unlockedAchievements.filter(id => 
        id === 'first_course' || id === 'course_collector'
      ).length || 0;
      
      if (completedCourses === 0) {
        await unlockAchievement('first_course');
      }
    } catch (error) {
      console.error('❌ Error tracking course enrollment:', error);
    }
  };

  const trackCourseCompletion = async (courseId: string, courseTitle: string): Promise<void> => {
    try {
      await addXP(XP_REWARDS.course_completion, 'course_completion');
      
      // Check for course collector achievement
      const completedCourses = gamificationData?.unlockedAchievements.filter(id => 
        id === 'first_course' || id === 'course_collector'
      ).length || 0;
      
      if (completedCourses >= 4) { // 5th course completion
        await unlockAchievement('course_collector');
      }
    } catch (error) {
      console.error('❌ Error tracking course completion:', error);
    }
  };

  const trackModuleCompletion = async (courseId: string, moduleId: string, moduleTitle: string): Promise<void> => {
    try {
      await addXP(XP_REWARDS.module_completion, 'module_completion');
    } catch (error) {
      console.error('❌ Error tracking module completion:', error);
    }
  };

  const trackGuidedSetupCompletion = async (setupId: string, setupTitle: string): Promise<void> => {
    try {
      await addXP(XP_REWARDS.guided_setup_completion, 'guided_setup_completion');
      
      // Check for guided master achievement
      const completedSetups = gamificationData?.unlockedAchievements.filter(id => 
        id === 'guided_master'
      ).length || 0;
      
      if (completedSetups >= 9) { // 10th setup completion
        await unlockAchievement('guided_master');
      }
    } catch (error) {
      console.error('❌ Error tracking guided setup completion:', error);
    }
  };

  const trackLibraryFeedback = async (rating: number, feedbackText?: string): Promise<void> => {
    try {
      await addXP(XP_REWARDS.library_feedback, 'library_feedback');
      
      // Check for feedback contributor achievement
      const feedbackCount = gamificationData?.unlockedAchievements.filter(id => 
        id === 'feedback_contributor'
      ).length || 0;
      
      if (feedbackCount >= 2) { // 3rd feedback submission
        await unlockAchievement('feedback_contributor');
      }
    } catch (error) {
      console.error('❌ Error tracking library feedback:', error);
    }
  };

  const trackLearningStreak = async (days: number): Promise<void> => {
    try {
      if (days >= 7) {
        await addXP(XP_REWARDS.learning_streak, 'learning_streak');
        await unlockAchievement('learning_streak');
      }
    } catch (error) {
      console.error('❌ Error tracking learning streak:', error);
    }
  };

  const trackKnowledgeSharing = async (type: 'course_insight' | 'community_post' | 'feedback'): Promise<void> => {
    try {
      await addXP(XP_REWARDS.knowledge_sharing, 'knowledge_sharing');
      
      // Check for knowledge sharer achievement
      const sharingCount = gamificationData?.unlockedAchievements.filter(id => 
        id === 'knowledge_sharer'
      ).length || 0;
      
      if (sharingCount >= 4) { // 5th knowledge sharing
        await unlockAchievement('knowledge_sharer');
      }
    } catch (error) {
      console.error('❌ Error tracking knowledge sharing:', error);
    }
  };

  const getLearningStats = () => {
    if (!gamificationData) {
      return {
        coursesCompleted: 0,
        modulesCompleted: 0,
        guidedSetupsCompleted: 0,
        learningStreak: 0,
        totalLearningTime: 0,
        knowledgeShared: 0
      };
    }

    const completedCourses = gamificationData.unlockedAchievements.filter(id => 
      id === 'first_course' || id === 'course_collector'
    ).length;
    
    const completedSetups = gamificationData.unlockedAchievements.filter(id => 
      id === 'guided_master'
    ).length;
    
    const knowledgeShared = gamificationData.unlockedAchievements.filter(id => 
      id === 'knowledge_sharer'
    ).length;

    return {
      coursesCompleted: completedCourses,
      modulesCompleted: 0, // TODO: Track this separately
      guidedSetupsCompleted: completedSetups,
      learningStreak: 0, // TODO: Track this separately
      totalLearningTime: 0, // TODO: Track this separately
      knowledgeShared: knowledgeShared
    };
  };

  // Phase 3B: Social Learning tracking methods
  const trackStudyGroupCreation = async (groupId: string, groupName: string) => {
    try {
      await addXP(XP_REWARDS.study_group_created, 'study_group_created');
      
      // Check for study group creator achievement
      const currentData = gamificationData;
      if (currentData) {
        const studyGroupsCreated = currentData.studyGroupsCreated || 0;
        if (studyGroupsCreated === 0) {
          await unlockAchievement('study_group_creator');
        }
      }
      
      // Update study groups created count
      if (gamificationData) {
        const updatedData = {
          ...gamificationData,
          studyGroupsCreated: (gamificationData.studyGroupsCreated || 0) + 1,
        };
        setGamificationData(updatedData);
        await AsyncStorage.setItem('gamificationData', JSON.stringify(updatedData));
      }
    } catch (error) {
      console.error('Error tracking study group creation:', error);
    }
  };

  const trackStudyGroupJoin = async (groupId: string, groupName: string) => {
    try {
      await addXP(XP_REWARDS.study_group_joined, 'study_group_joined');
      
      // Check for study group joiner achievement
      const currentData = gamificationData;
      if (currentData) {
        const studyGroupsJoined = currentData.studyGroupsJoined || 0;
        if (studyGroupsJoined === 2) { // After joining 3rd group
          await unlockAchievement('study_group_joiner');
        }
      }
      
      // Update study groups joined count
      if (gamificationData) {
        const updatedData = {
          ...gamificationData,
          studyGroupsJoined: (gamificationData.studyGroupsJoined || 0) + 1,
        };
        setGamificationData(updatedData);
        await AsyncStorage.setItem('gamificationData', JSON.stringify(updatedData));
      }
    } catch (error) {
      console.error('Error tracking study group join:', error);
    }
  };

  const trackStudySessionCompletion = async (sessionId: string, duration: number, participants: number) => {
    try {
      await addXP(XP_REWARDS.study_session_completed, 'study_session_completed');
      
      // Check for learning circle leader achievement
      const currentData = gamificationData;
      if (currentData) {
        const studySessionsLed = currentData.studySessionsLed || 0;
        if (studySessionsLed === 4) { // After leading 5th session
          await unlockAchievement('learning_circle_leader');
        }
      }
      
      // Update study sessions completed count
      if (gamificationData) {
        const updatedData = {
          ...gamificationData,
          studySessionsCompleted: (gamificationData.studySessionsCompleted || 0) + 1,
        };
        setGamificationData(updatedData);
        await AsyncStorage.setItem('gamificationData', JSON.stringify(updatedData));
      }
    } catch (error) {
      console.error('Error tracking study session completion:', error);
    }
  };

  const trackPeerRecommendation = async (recommendationType: 'given' | 'received', courseId: string) => {
    try {
      if (recommendationType === 'given') {
        await addXP(XP_REWARDS.peer_recommendation_given, 'peer_recommendation_given');
        
        // Check for recommendation expert achievement
        const currentData = gamificationData;
        if (currentData) {
          const recommendationsGiven = currentData.peerRecommendationsGiven || 0;
          if (recommendationsGiven === 19) { // After giving 20th recommendation
            await unlockAchievement('recommendation_expert');
          }
        }
        
        // Update recommendations given count
        if (gamificationData) {
          const updatedData = {
            ...gamificationData,
            peerRecommendationsGiven: (gamificationData.peerRecommendationsGiven || 0) + 1,
          };
          setGamificationData(updatedData);
          await AsyncStorage.setItem('gamificationData', JSON.stringify(updatedData));
        }
      } else {
        await addXP(XP_REWARDS.peer_recommendation_received, 'peer_recommendation_received');
        
        // Update recommendations received count
        if (gamificationData) {
          const updatedData = {
            ...gamificationData,
            peerRecommendationsReceived: (gamificationData.peerRecommendationsReceived || 0) + 1,
          };
          setGamificationData(updatedData);
          await AsyncStorage.setItem('gamificationData', JSON.stringify(updatedData));
        }
      }
    } catch (error) {
      console.error('Error tracking peer recommendation:', error);
    }
  };

  const trackLearningCircleContribution = async (circleId: string, contributionType: string) => {
    try {
      await addXP(XP_REWARDS.learning_circle_contribution, 'learning_circle_contribution');
      
      // Check for collaborative learner achievement
      const currentData = gamificationData;
      if (currentData) {
        const collaborativeSessions = currentData.collaborativeSessions || 0;
        if (collaborativeSessions === 9) { // After 10th session
          await unlockAchievement('collaborative_learner');
        }
      }
      
      // Update learning circle contributions count
      if (gamificationData) {
        const updatedData = {
          ...gamificationData,
          learningCircleContributions: (gamificationData.learningCircleContributions || 0) + 1,
        };
        setGamificationData(updatedData);
        await AsyncStorage.setItem('gamificationData', JSON.stringify(updatedData));
      }
    } catch (error) {
      console.error('Error tracking learning circle contribution:', error);
    }
  };

  const getSocialLearningStats = async () => {
    try {
      const data = gamificationData;
      return {
        studyGroupsCreated: data?.studyGroupsCreated || 0,
        studyGroupsJoined: data?.studyGroupsJoined || 0,
        studySessionsCompleted: data?.studySessionsCompleted || 0,
        peerRecommendationsGiven: data?.peerRecommendationsGiven || 0,
        peerRecommendationsReceived: data?.peerRecommendationsReceived || 0,
        learningCircleContributions: data?.learningCircleContributions || 0,
      };
    } catch (error) {
      console.error('Error getting social learning stats:', error);
      return {
        studyGroupsCreated: 0,
        studyGroupsJoined: 0,
        studySessionsCompleted: 0,
        peerRecommendationsGiven: 0,
        peerRecommendationsReceived: 0,
        learningCircleContributions: 0,
      };
    }
  };

  return (
    <GamificationContext.Provider value={{
      gamificationData: translatedGamificationData,
      addXP,
      unlockAchievement,
      addMoodEntry,
      checkAchievements,
      getAvailableAchievements,
      getTodaysMoodEntry,
      canCheckMoodToday,
      getXPForAction,
      // NEW: Habit-Mood Integration
      addHabitMoodEntry,
      getHabitMoodEntries,
      getMoodEntries,
      // Adaptive challenge methods
      createAdaptiveChallenge,
      completeAdaptiveChallenge,
      getActiveAdaptiveChallenges,
      // Level perks method
      getLevelPerks,
      // Clear gamification data method
      clearGamificationData,
      // Library & Learning Integration Methods
      trackCourseEnrollment,
      trackCourseCompletion,
      trackModuleCompletion,
      trackGuidedSetupCompletion,
      trackLibraryFeedback,
      trackLearningStreak,
      trackKnowledgeSharing,
      getLearningStats,
      // Phase 3B methods
      trackStudyGroupCreation,
      trackStudyGroupJoin,
      trackStudySessionCompletion,
      trackPeerRecommendation,
      trackLearningCircleContribution,
      getSocialLearningStats
    }}>      {children}
    </GamificationContext.Provider>
  );
}

export function useGamification() {
  const context = useContext(GamificationContext);
  if (context === undefined) {
    throw new Error('useGamification must be used within a GamificationProvider');
  }
  return context;
}