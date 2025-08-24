import { useMemo } from 'react';
import { useHabits } from '@/context/HabitContext';
import { useCrossTabInsights } from '@/context/CrossTabInsightsContext';
import { useLanguage } from '@/context/LanguageContext';

export interface LibraryAnalytics {
  coursesCompleted: number;
  totalCourses: number;
  completionRate: number;
  courseImpact: string;
  appliedTechniques: string[];
  knowledgeApplied: string[];
  nextCourseRecommendation: string;
  habitCorrelation: Array<{
    habitId: string;
    habitTitle: string;
    courseImpact: number;
    techniquesApplied: string[];
  }>;
  learningStreak: number;
  recentLearning: string;
  impactScore: number;
}

export function useLibraryAnalytics(): LibraryAnalytics {
  const { habits } = useHabits();
  const { state } = useCrossTabInsights();
  const { t } = useLanguage();

  return useMemo(() => {
    const libraryData = state.data.library;
    const coursesCompleted = libraryData.coursesCompleted || 0;
    const totalCourses = libraryData.totalCourses || 10; // Mock total
    const completionRate = totalCourses > 0 ? (coursesCompleted / totalCourses) * 100 : 0;
    
    // Handle null habits
    if (!habits) {
      return {
        coursesCompleted,
        totalCourses,
        completionRate,
        courseImpact: 'No habits to analyze',
        appliedTechniques: [],
        knowledgeApplied: [],
        nextCourseRecommendation: t('analytics.learningImpact.foundationCourse'),
        habitCorrelation: [],
        learningStreak: 0,
        recentLearning: t('analytics.learningImpact.noRecentActivity'),
        impactScore: 0,
      };
    }
    
    // Analyze course impact on habits
    const courseImpact = analyzeCourseImpactOnHabits(habits, libraryData);
    
    // Track applied techniques
    const appliedTechniques = libraryData.appliedTechniques || [];
    const knowledgeApplied = appliedTechniques.map(technique => 
      `${technique} - ${t('analytics.learningImpact.applied')}`
    );
    
    // Generate next course recommendation
    const nextCourseRecommendation = recommendNextCourseBasedOnHabitStruggles(habits, appliedTechniques, t);
    
    // Calculate habit-course correlation
    const habitCorrelation = calculateHabitCorrelation(habits, appliedTechniques);
    
    // Calculate learning streak (mock data for now)
    const learningStreak = Math.floor(Math.random() * 7) + 1;
    
    // Get recent learning activity
    const recentLearning = getRecentLearningActivity(appliedTechniques, t);
    
    // Calculate overall impact score
    const impactScore = calculateImpactScore(coursesCompleted, appliedTechniques.length, habitCorrelation);

    return {
      coursesCompleted,
      totalCourses,
      completionRate,
      courseImpact,
      appliedTechniques,
      knowledgeApplied,
      nextCourseRecommendation,
      habitCorrelation,
      learningStreak,
      recentLearning,
      impactScore,
    };
  }, [habits, state.data.library, t]);
}

function analyzeCourseImpactOnHabits(habits: any[], libraryData: any): string {
  const appliedTechniques = libraryData.appliedTechniques || [];
  
  if (appliedTechniques.length === 0) {
    return 'No techniques applied yet';
  }
  
  const improvedHabits = habits.filter(habit => 
    habit.currentStreak > 0 && appliedTechniques.some((technique: string) => 
      habit.title.toLowerCase().includes(technique.toLowerCase())
    )
  );
  
  if (improvedHabits.length === 0) {
    return 'Learning not yet applied to habits';
  }
  
  const improvementRate = (improvedHabits.length / habits.length) * 100;
  
  if (improvementRate >= 50) {
    return `Strong impact: ${improvementRate.toFixed(0)}% of habits improved`;
  } else if (improvementRate >= 25) {
    return `Moderate impact: ${improvementRate.toFixed(0)}% of habits improved`;
  } else {
    return `Initial impact: ${improvementRate.toFixed(0)}% of habits improved`;
  }
}

function recommendNextCourseBasedOnHabitStruggles(habits: any[], appliedTechniques: string[], t: any): string {
  const strugglingHabits = habits.filter(habit => 
    habit.currentStreak === 0 || habit.currentStreak < 3
  );
  
  if (strugglingHabits.length === 0) {
    return t('analytics.learningImpact.advancedCourse');
  }
  
  const habitTypes = strugglingHabits.map(habit => habit.category || 'general');
  const mostCommonType = getMostCommon(habitTypes);
  
  const courseRecommendations: { [key: string]: string } = {
    'health': t('analytics.learningImpact.healthCourse'),
    'productivity': t('analytics.learningImpact.productivityCourse'),
    'mindfulness': t('analytics.learningImpact.mindfulnessCourse'),
    'general': t('analytics.learningImpact.foundationCourse'),
  };
  
  return courseRecommendations[mostCommonType] || courseRecommendations.general;
}

function calculateHabitCorrelation(habits: any[], appliedTechniques: string[]) {
  return habits.map(habit => {
    const relevantTechniques = appliedTechniques.filter(technique => 
      habit.title.toLowerCase().includes(technique.toLowerCase()) ||
      (habit.category && habit.category.toLowerCase().includes(technique.toLowerCase()))
    );
    
    const impactScore = relevantTechniques.length > 0 
      ? Math.min(relevantTechniques.length * 25, 100) 
      : 0;
    
    return {
      habitId: habit.id,
      habitTitle: habit.title,
      courseImpact: impactScore,
      techniquesApplied: relevantTechniques,
    };
  }).filter(correlation => correlation.courseImpact > 0);
}

function getRecentLearningActivity(appliedTechniques: string[], t: any): string {
  if (appliedTechniques.length === 0) {
    return t('analytics.learningImpact.noRecentActivity');
  }
  
  const recentTechnique = appliedTechniques[appliedTechniques.length - 1];
  return t('analytics.learningImpact.recentlyApplied', { technique: recentTechnique });
}

function calculateImpactScore(coursesCompleted: number, techniquesApplied: number, habitCorrelation: any[]): number {
  const courseScore = Math.min(coursesCompleted * 10, 40);
  const techniqueScore = Math.min(techniquesApplied * 5, 30);
  const correlationScore = Math.min(habitCorrelation.length * 10, 30);
  
  return Math.min(courseScore + techniqueScore + correlationScore, 100);
}

function getMostCommon(arr: string[]): string {
  const counts: { [key: string]: number } = {};
  arr.forEach(item => {
    counts[item] = (counts[item] || 0) + 1;
  });
  
  return Object.keys(counts).reduce((a, b) => 
    counts[a] > counts[b] ? a : b
  );
}
