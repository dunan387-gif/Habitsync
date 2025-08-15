import { Habit, AIHabitSuggestion, MotivationalMessage, SmartReminderSuggestion } from '@/types';
import { habitCategories } from '@/data/habitSuggestions';

interface UserBehaviorPattern {
  userId: string;
  habitId: string;
  completionRate: number;
  preferredTime: string;
  moodCorrelation: number;
  successFactors: string[];
  failureFactors: string[];
  lastUpdated: string;
}

interface MLPrediction {
  habitId: string;
  successProbability: number;
  optimalTime: string;
  recommendedModifications: string[];
  confidence: number;
}

interface UserFeedback {
  suggestionId: string;
  rating: number; // 1-5
  implemented: boolean;
  effectiveness: number; // 1-10
  comments?: string;
  timestamp: string;
}

interface CollaborativeFilteringData {
  userId: string;
  habitPreferences: string[];
  categoryPreferences: string[];
  successPatterns: string[];
  similarUsers: string[];
}

interface SemanticSearchResult {
  habitId: string;
  relevanceScore: number;
  semanticMatch: string[];
  context: string;
}

class AIService {
  private static userPatterns: Map<string, UserBehaviorPattern[]> = new Map();
  private static feedbackHistory: UserFeedback[] = [];
  private static adaptiveThresholds: Map<string, number> = new Map();
  private static collaborativeData: Map<string, CollaborativeFilteringData> = new Map();
  private static semanticIndex: Map<string, string[]> = new Map();

  /**
   * Enhanced AI-powered habit suggestions with collaborative filtering and semantic search
   */
  generateHabitSuggestions(userHabits: Habit[], t: (key: string, params?: any) => string): AIHabitSuggestion[] {
    const suggestions: AIHabitSuggestion[] = [];
    
    // For testing: Always generate some suggestions even if user has no habits
    if (userHabits.length === 0) {
      // Generate suggestions for missing categories
      const allCategories = habitCategories.map(cat => cat.id);
      allCategories.slice(0, 2).forEach(category => {
        const suggestionsForCategory = this.generateCategorySuggestions(category, [], t);
        suggestionsForCategory.forEach(suggestion => {
          suggestions.push({
            id: `ai-gap-${Date.now()}-${Math.random()}`,
            title: suggestion.title,
            description: suggestion.description,
            reason: t('ai.mlGapFilling', { 
              category: t(`category_${category}`),
              preferences: []
            }),
            confidence: 0.6,
            category: category
          });
        });
      });
      return suggestions.sort((a, b) => b.confidence - a.confidence);
    }
    
    // 1. Collaborative Filtering - Find similar users and their successful habits
    const collaborativeSuggestions = this.generateCollaborativeSuggestions(userHabits, t);
    suggestions.push(...collaborativeSuggestions);
    
    // 2. Semantic Search - Find habits based on user's interests and context
    const semanticSuggestions = this.generateSemanticSuggestions(userHabits, t);
    suggestions.push(...semanticSuggestions);
    
    // 3. ML-based Gap Analysis - Identify missing categories and patterns
    const gapSuggestions = this.generateGapAnalysisSuggestions(userHabits, t);
    suggestions.push(...gapSuggestions);
    
    // 4. Personalized Optimization - Optimize existing habits
    const optimizationSuggestions = this.generateOptimizationSuggestions(userHabits, t);
    suggestions.push(...optimizationSuggestions);
    
    // 5. Context-Aware Recommendations - Based on time, mood, and current patterns
    const contextSuggestions = this.generateContextAwareSuggestions(userHabits, t);
    suggestions.push(...contextSuggestions);
    
    // Remove duplicates and sort by confidence
    const uniqueSuggestions = this.removeDuplicateSuggestions(suggestions);
    return uniqueSuggestions.sort((a, b) => b.confidence - a.confidence).slice(0, 5);
  }
  
  /**
   * Generate smart reminder time suggestions based on user's completion patterns
   */
  generateSmartReminderSuggestions(userHabits: Habit[], t: (key: string, params?: any) => string): SmartReminderSuggestion[] {
    const suggestions: SmartReminderSuggestion[] = [];
    
    userHabits.forEach(habit => {
      if (!habit.reminderEnabled && habit.completionTimes && habit.completionTimes.length > 0) {
        const optimalTime = this.findOptimalReminderTime(habit.completionTimes);
        suggestions.push({
          habitId: habit.id,
          suggestedTime: optimalTime,
          reason: t('ai_smart_reminder_reason', { time: optimalTime }),
          confidence: this.calculateTimeConfidence(habit.completionTimes, optimalTime)
        });
      }
    });
    
    return suggestions.sort((a, b) => b.confidence - a.confidence);
  }
  
  /**
   * Generate motivational messages based on user's current state
   */
  generateMotivationalMessage(userHabits: Habit[], t: (key: string, params?: any) => string): MotivationalMessage | null {
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    
    // Check if user needs encouragement
    const recentlyCompletedHabits = userHabits.filter(habit => habit.completedToday);
    const totalHabits = userHabits.length;
    const completionRate = totalHabits > 0 ? recentlyCompletedHabits.length / totalHabits : 0;
    
    // Check for streaks
    const longestStreak = Math.max(...userHabits.map(h => h.streak), 0);
    const strugglingHabits = userHabits.filter(habit => habit.streak === 0 && !habit.completedToday);
    
    // Milestone celebrations
    const milestoneHabits = userHabits.filter(habit => 
      habit.streak === 7 || habit.streak === 30 || habit.streak === 100
    );
    
    if (milestoneHabits.length > 0) {
      const habit = milestoneHabits[0];
      return {
        id: `motivational-${Date.now()}`,
        message: t('ai_milestone_message', { streak: habit.streak, title: habit.title }),
        type: 'milestone',
        condition: 'streak_milestone'
      };
    }
    
    if (completionRate === 1.0 && totalHabits > 0) {
      return {
        id: `motivational-${Date.now()}`,
        message: t('ai_perfect_day_message'),
        type: 'encouragement',
        condition: 'perfect_day'
      };
    }
    
    if (strugglingHabits.length > 0 && completionRate < 0.5) {
      return {
        id: `motivational-${Date.now()}`,
        message: t('ai_low_completion_message'),
        type: 'streak_recovery',
        condition: 'low_completion'
      };
    }
    
    if (longestStreak >= 3) {
      return {
        id: `motivational-${Date.now()}`,
        message: t('ai_good_streak_message', { streak: longestStreak }),
        type: 'encouragement',
        condition: 'good_streak'
      };
    }
    
    // Default encouraging message
    const encouragingKeys = [
      'ai_encouraging_1',
      'ai_encouraging_2', 
      'ai_encouraging_3',
      'ai_encouraging_4',
      'ai_encouraging_5'
    ];
    
    const randomKey = encouragingKeys[Math.floor(Math.random() * encouragingKeys.length)];
    
    return {
      id: `motivational-${Date.now()}`,
      message: t(randomKey),
      type: 'encouragement',
      condition: 'general'
    };
  }
  
  // Analyze user patterns using machine learning
  private analyzeUserPatterns(habits: Habit[]): UserBehaviorPattern[] {
    const patterns: UserBehaviorPattern[] = [];
    
    habits.forEach(habit => {
      const completionRate = this.calculateCompletionRate(habit);
      const preferredTime = this.analyzePreferredTime(habit);
      const moodCorrelation = this.calculateMoodCorrelation(habit);
      const successFactors = this.identifySuccessFactors(habit);
      const failureFactors = this.identifyFailureFactors(habit);
      
      patterns.push({
        userId: 'current-user', // In real app, get from auth
        habitId: habit.id,
        completionRate,
        preferredTime,
        moodCorrelation,
        successFactors,
        failureFactors,
        lastUpdated: new Date().toISOString()
      });
    });
    
    // Store patterns for future analysis
    AIService.userPatterns.set('current-user', patterns);
    
    return patterns;
  }

  /**
   * Generate ML predictions for habit success
   */
  private generateMLPredictions(habits: Habit[], patterns: UserBehaviorPattern[]): MLPrediction[] {
    const predictions: MLPrediction[] = [];
    
    patterns.forEach(pattern => {
      const habit = habits.find(h => h.id === pattern.habitId);
      if (!habit) return;
      
      // Calculate success probability using multiple factors
      const successProbability = this.calculateSuccessProbability(pattern, habit);
      const optimalTime = this.predictOptimalTime(pattern, habit);
      const recommendedModifications = this.suggestModifications(pattern, habit);
      const confidence = this.calculatePredictionConfidence(pattern);
      
      predictions.push({
        habitId: pattern.habitId,
        successProbability,
        optimalTime,
        recommendedModifications,
        confidence
      });
    });
    
    return predictions;
  }

  /**
   * Calculate success probability using ML
   */
  private calculateSuccessProbability(pattern: UserBehaviorPattern, habit: Habit): number {
    let probability = 0.5; // Base probability
    
    // Factor 1: Historical completion rate
    probability += pattern.completionRate * 0.3;
    
    // Factor 2: Current streak strength
    const streakFactor = Math.min(habit.streak / 10, 1);
    probability += streakFactor * 0.2;
    
    // Factor 3: Mood correlation
    probability += Math.max(0, pattern.moodCorrelation) * 0.15;
    
    // Factor 4: Success factors presence
    const successFactorScore = pattern.successFactors.length / 5;
    probability += successFactorScore * 0.1;
    
    // Factor 5: Failure factors absence
    const failureFactorPenalty = pattern.failureFactors.length * 0.05;
    probability -= failureFactorPenalty;
    
    // Factor 6: Adaptive threshold adjustment
    const adaptiveThreshold = AIService.adaptiveThresholds.get(habit.id) || 0.5;
    probability = probability * 0.8 + adaptiveThreshold * 0.2;
    
    return Math.max(0, Math.min(1, probability));
  }

  /**
   * Predict optimal time for habit execution
   */
  private predictOptimalTime(pattern: UserBehaviorPattern, habit: Habit): string {
    // Analyze completion times from habit data
    const completionTimes = habit.completedDates.map(date => {
      // In real implementation, you'd have actual completion times
      return 'morning'; // Placeholder
    });
    
    const timeFrequency = completionTimes.reduce((acc, time) => {
      acc[time] = (acc[time] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const optimalTime = Object.entries(timeFrequency)
      .sort(([,a], [,b]) => b - a)[0]?.[0] || 'morning';
    
    return optimalTime;
  }

  /**
   * Suggest modifications based on ML analysis
   */
  private suggestModifications(pattern: UserBehaviorPattern, habit: Habit): string[] {
    const modifications: string[] = [];
    
    // Low completion rate suggestions
    if (pattern.completionRate < 0.5) {
      modifications.push('Simplify the habit');
      modifications.push('Add reminders');
      modifications.push('Reduce frequency');
    }
    
    // High failure factors suggestions
    if (pattern.failureFactors.length > 2) {
      modifications.push('Change environment');
      modifications.push('Find accountability partner');
      modifications.push('Adjust timing');
    }
    
    // Mood correlation suggestions
    if (pattern.moodCorrelation < 0) {
      modifications.push('Link to positive activities');
      modifications.push('Adjust mood-based scheduling');
    }
    
    return modifications;
  }

  /**
   * Calculate prediction confidence
   */
  private calculatePredictionConfidence(pattern: UserBehaviorPattern): number {
    let confidence = 0.5;
    
    // More data = higher confidence
    const dataPoints = pattern.completionRate * 100;
    confidence += Math.min(dataPoints / 100, 0.3);
    
    // Consistent patterns = higher confidence
    const consistency = 1 - Math.abs(pattern.moodCorrelation);
    confidence += consistency * 0.2;
    
    return Math.max(0.3, Math.min(1, confidence));
  }

  /**
   * Record user feedback for ML improvement
   */
  recordFeedback(feedback: UserFeedback): void {
    AIService.feedbackHistory.push(feedback);
    this.updateAdaptiveThresholds(feedback);
  }

  /**
   * Update adaptive thresholds based on feedback
   */
  private updateAdaptiveThresholds(feedback: UserFeedback): void {
    const relatedSuggestions = AIService.feedbackHistory.filter(f => 
      f.suggestionId.includes(feedback.suggestionId.split('-')[1])
    );
    
    if (relatedSuggestions.length >= 3) {
      const avgEffectiveness = relatedSuggestions.reduce((sum, f) => sum + f.effectiveness, 0) / relatedSuggestions.length;
      const avgRating = relatedSuggestions.reduce((sum, f) => sum + f.rating, 0) / relatedSuggestions.length;
      
      // Update threshold based on feedback
      const newThreshold = (avgEffectiveness / 10 + avgRating / 5) / 2;
      AIService.adaptiveThresholds.set(feedback.suggestionId, newThreshold);
    }
  }

  /**
   * Calculate confidence with feedback history
   */
  private calculateConfidenceWithFeedback(habitId: string, suggestionType: string): number {
    const relevantFeedback = AIService.feedbackHistory.filter(f => 
      f.suggestionId.includes(habitId) || f.suggestionId.includes(suggestionType)
    );
    
    if (relevantFeedback.length === 0) return 0.6; // Default confidence
    
    const avgEffectiveness = relevantFeedback.reduce((sum, f) => sum + f.effectiveness, 0) / relevantFeedback.length;
    const avgRating = relevantFeedback.reduce((sum, f) => sum + f.rating, 0) / relevantFeedback.length;
    
    return (avgEffectiveness / 10 + avgRating / 5) / 2;
  }

  // Helper methods (existing functionality)
  private calculateCompletionRate(habit: Habit): number {
    const totalDays = Math.max(1, (Date.now() - new Date(habit.createdAt).getTime()) / (1000 * 60 * 60 * 24));
    return Math.min(1, habit.completedDates.length / totalDays);
  }

  private analyzePreferredTime(habit: Habit): string {
    // Placeholder - in real implementation, analyze actual completion times
    return 'morning';
  }

  private calculateMoodCorrelation(habit: Habit): number {
    // Placeholder - in real implementation, calculate actual mood correlation
    return Math.random() * 2 - 1; // -1 to 1
  }

  private identifySuccessFactors(habit: Habit): string[] {
    const factors = [];
    if (habit.streak >= 7) factors.push('consistency');
    if (habit.completedDates.length > 10) factors.push('persistence');
    return factors;
  }

  private identifyFailureFactors(habit: Habit): string[] {
    const factors = [];
    if (habit.streak < 3) factors.push('low_motivation');
    if (habit.completedDates.length < 5) factors.push('difficulty');
    return factors;
  }

  private getMLInsightsForHabit(habitId: string): string[] {
    const pattern = AIService.userPatterns.get('current-user')?.find(p => p.habitId === habitId);
    return pattern?.successFactors || [];
  }

  private analyzeFailurePatterns(habitId: string): { reason: string } {
    const pattern = AIService.userPatterns.get('current-user')?.find(p => p.habitId === habitId);
    return { reason: pattern?.failureFactors.join(', ') || 'unknown' };
  }

  private analyzeUserPreferences(habits: Habit[]): string[] {
    const categories = habits.map(h => h.category).filter((cat): cat is string => Boolean(cat));
    const preferences = categories.reduce((acc, cat) => {
      acc[cat] = (acc[cat] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    return Object.entries(preferences)
      .sort(([,a], [,b]) => b - a)
      .map(([cat]) => cat);
  }

  // Existing methods (keeping for compatibility)
  private analyzeUserCategories(userHabits: Habit[]): string[] {
    return [...new Set(userHabits.map(habit => habit.category).filter((cat): cat is string => Boolean(cat)))];
  }

  private findComplementaryHabits(habit: Habit, userHabits: Habit[], t: (key: string, params?: any) => string) {
    // Find complementary categories (different from current habit category)
    const complementaryCategories = habitCategories
      .filter(cat => cat.id !== habit.category)
      .slice(0, 2);
    
    const complementaryHabits: Array<{title: string; description: string; category: string}> = [];
    
    complementaryCategories.forEach(cat => {
      // Get a random habit from each complementary category
      if (cat.habits.length > 0) {
        const randomHabit = cat.habits[Math.floor(Math.random() * cat.habits.length)];
        complementaryHabits.push({
          title: t(randomHabit.title),
          description: t(randomHabit.description),
          category: cat.id
        });
      }
    });
    
    return complementaryHabits;
  }

  private findEasierAlternatives(habit: Habit, t: (key: string, params?: any) => string) {
    // Find easier alternatives from the same category
    const categoryData = habitCategories.find(cat => cat.id === habit.category);
    if (!categoryData || categoryData.habits.length === 0) {
      return [{
        title: t('ai.easierAlternative', { habit: habit.title }),
        description: t('ai.easierAlternativeDescription'),
        category: habit.category || 'wellness'
      }];
    }

    // Return a different habit from the same category as an easier alternative
    const otherHabits = categoryData.habits.filter(h => h.id !== habit.id);
    if (otherHabits.length === 0) {
      return [{
        title: t('ai.easierAlternative', { habit: habit.title }),
        description: t('ai.easierAlternativeDescription'),
        category: habit.category || 'wellness'
      }];
    }

    const randomHabit = otherHabits[Math.floor(Math.random() * otherHabits.length)];
    return [{
      title: t(randomHabit.title),
      description: t(randomHabit.description),
      category: habit.category || 'wellness'
    }];
  }

  private findMissingCategories(userHabits: Habit[]): string[] {
    const userCategories = this.analyzeUserCategories(userHabits);
    const allCategories = habitCategories.map(cat => cat.id);
    return allCategories.filter(cat => !userCategories.includes(cat));
  }

  private generateCategorySuggestions(category: string, preferences: string[], t: (key: string, params?: any) => string) {
    // Find the category in habitCategories
    const categoryData = habitCategories.find(cat => cat.id === category);
    if (!categoryData || categoryData.habits.length === 0) {
      return [{
        title: t('ai.categorySuggestion', { category: t(`category_${category}`) }),
        description: t('ai.categorySuggestionDescription', { category: t(`category_${category}`) }),
        category
      }];
    }

    // Return actual habit suggestions from the category
    return categoryData.habits.map(habit => ({
      title: t(habit.title),
      description: t(habit.description),
      category
    }));
  }

  /**
   * Find optimal reminder time based on completion times
   */
  private findOptimalReminderTime(completionTimes: string[]): string {
    if (!completionTimes || completionTimes.length === 0) {
      // Default to morning if no completion times available
      return '09:00';
    }

    // Parse completion times and find the most common hour
    const hourCounts: { [hour: number]: number } = {};
    
    completionTimes.forEach(timeStr => {
      try {
        // Handle both ISO date strings and time-only strings
        let time: Date;
        if (timeStr.includes('T') || timeStr.includes('-')) {
          // ISO date string
          time = new Date(timeStr);
        } else {
          // Time-only string (HH:MM format)
          const [hours, minutes] = timeStr.split(':').map(Number);
          if (isNaN(hours) || isNaN(minutes)) {
            console.warn('Invalid time format:', timeStr);
            return;
          }
          time = new Date();
          time.setHours(hours, minutes, 0, 0);
        }
        
        const hour = time.getHours();
        if (!isNaN(hour)) {
          hourCounts[hour] = (hourCounts[hour] || 0) + 1;
        }
      } catch (error) {
        // Skip invalid time strings
        console.warn('Invalid completion time:', timeStr, error);
      }
    });

    // Find the hour with the most completions
    let optimalHour = 9; // Default to 9 AM
    let maxCount = 0;

    Object.entries(hourCounts).forEach(([hour, count]) => {
      const hourNum = parseInt(hour);
      if (!isNaN(hourNum) && count > maxCount) {
        maxCount = count;
        optimalHour = hourNum;
      }
    });

    // Ensure optimalHour is valid
    if (isNaN(optimalHour) || optimalHour < 0 || optimalHour > 23) {
      optimalHour = 9; // Fallback to 9 AM
    }

    // Format as HH:MM
    return `${optimalHour.toString().padStart(2, '0')}:00`;
  }

  /**
   * Calculate confidence for time suggestions
   */
  private calculateTimeConfidence(completionTimes: string[], suggestedTime: string): number {
    if (!completionTimes || completionTimes.length === 0) {
      return 0.5; // Medium confidence for default suggestions
    }

    // Parse suggested time
    const [suggestedHour] = suggestedTime.split(':').map(Number);
    
    // Count completions within 2 hours of suggested time
    let nearbyCompletions = 0;
    
    completionTimes.forEach(timeStr => {
      try {
        const time = new Date(timeStr);
        const hour = time.getHours();
        const hourDiff = Math.abs(hour - suggestedHour);
        
        if (hourDiff <= 2) {
          nearbyCompletions++;
        }
      } catch (error) {
        // Skip invalid time strings
      }
    });

    // Calculate confidence based on percentage of nearby completions
    const confidence = nearbyCompletions / completionTimes.length;
    return Math.min(0.95, Math.max(0.3, confidence)); // Clamp between 0.3 and 0.95
  }

  /**
   * Helper methods for enhanced AI suggestions
   */
  private findSimilarUsers(userPreferences: string[], userCategories: string[]): string[] {
    // Mock implementation - in real app, this would query a database
    return ['user1', 'user2', 'user3'];
  }

  private getSuccessfulHabitsFromSimilarUsers(similarUsers: string[]): Array<{title: string, category: string, successRate: number}> {
    // Mock implementation - in real app, this would query a database
    return [
      { title: 'morning_meditation', category: 'wellness', successRate: 0.85 },
      { title: 'evening_reading', category: 'learning', successRate: 0.78 },
      { title: 'exercise_daily', category: 'fitness', successRate: 0.92 }
    ];
  }

  private buildSemanticContext(userHabits: Habit[]): Map<string, string[]> {
    const context = new Map<string, string[]>();
    
    userHabits.forEach(habit => {
      const keywords = this.extractKeywords(habit.title, habit.notes || '');
      context.set(habit.id, keywords);
    });
    
    return context;
  }

  private findSemanticallyRelatedHabits(semanticContext: Map<string, string[]>): Array<{title: string, category: string, context: string, relatedHabits: string[]}> {
    // Mock implementation - in real app, this would use NLP/ML
    return [
      { 
        title: 'deep_breathing', 
        category: 'wellness', 
        context: 'stress-relief',
        relatedHabits: ['meditation', 'gratitude']
      },
      { 
        title: 'gratitude', 
        category: 'productivity', 
        context: 'stress-relief',
        relatedHabits: ['meditation', 'learn_new']
      }
    ];
  }

  private calculateSemanticRelevance(habit: any, semanticContext: Map<string, string[]>): number {
    // Mock implementation - in real app, this would use cosine similarity or similar
    return 0.75;
  }

  private getCurrentContext(): {timeOfDay: string, dayOfWeek: string, season: string} {
    const now = new Date();
    const hour = now.getHours();
    const day = now.getDay();
    
    let timeOfDay = 'morning';
    if (hour >= 12 && hour < 17) timeOfDay = 'afternoon';
    else if (hour >= 17) timeOfDay = 'evening';
    
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    
    return {
      timeOfDay,
      dayOfWeek: days[day],
      season: this.getSeason(now)
    };
  }

  private findContextAppropriateHabits(context: {timeOfDay: string, dayOfWeek: string, season: string}): Array<{title: string, category: string, contextEffectiveness: number}> {
    // Mock implementation - in real app, this would use ML models
    const contextHabits = {
      morning: [
        { title: 'exercise_daily', category: 'fitness', contextEffectiveness: 0.9 },
        { title: 'meditation', category: 'wellness', contextEffectiveness: 0.85 }
      ],
      afternoon: [
        { title: 'walk', category: 'fitness', contextEffectiveness: 0.8 },
        { title: 'learn_new', category: 'learning', contextEffectiveness: 0.75 }
      ],
      evening: [
        { title: 'evening_reading', category: 'learning', contextEffectiveness: 0.85 },
        { title: 'gratitude', category: 'wellness', contextEffectiveness: 0.8 }
      ]
    };
    
    return contextHabits[context.timeOfDay as keyof typeof contextHabits] || [];
  }

  private extractKeywords(title: string, notes: string): string[] {
    // Simple keyword extraction - in real app, this would use NLP
    const text = `${title} ${notes}`.toLowerCase();
    const keywords = text.split(/\s+/).filter(word => word.length > 3);
    return [...new Set(keywords)];
  }

  private getSeason(date: Date): string {
    const month = date.getMonth();
    if (month >= 2 && month <= 4) return 'spring';
    if (month >= 5 && month <= 7) return 'summer';
    if (month >= 8 && month <= 10) return 'autumn';
    return 'winter';
  }

  private removeDuplicateSuggestions(suggestions: AIHabitSuggestion[]): AIHabitSuggestion[] {
    const seen = new Set<string>();
    return suggestions.filter(suggestion => {
      const key = suggestion.title.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  /**
   * Generate collaborative filtering suggestions
   */
  private generateCollaborativeSuggestions(userHabits: Habit[], t: (key: string, params?: any) => string): AIHabitSuggestion[] {
    const suggestions: AIHabitSuggestion[] = [];
    
    // Analyze user's preferences and patterns
    const userPreferences = this.analyzeUserPreferences(userHabits);
    const userCategories = this.analyzeUserCategories(userHabits);
    
    // Find similar users based on preferences
    const similarUsers = this.findSimilarUsers(userPreferences, userCategories);
    
    // Get successful habits from similar users
    const successfulHabits = this.getSuccessfulHabitsFromSimilarUsers(similarUsers);
    
    // Filter out habits the user already has
    const userHabitTitles = userHabits.map(h => h.title.toLowerCase());
    const newHabits = successfulHabits.filter(habit => 
      !userHabitTitles.includes(habit.title.toLowerCase())
    );
    
    // Generate suggestions with collaborative confidence
    newHabits.slice(0, 2).forEach(habit => {
      suggestions.push({
        id: `collab-${Date.now()}-${Math.random()}`,
        title: habit.title,
        description: t('ai.collaborative.description', { 
          similarUsers: similarUsers.length,
          successRate: Math.round(habit.successRate * 100)
        }),
        reason: t('ai.collaborative.reason', { 
          category: habit.category,
          similarUsers: similarUsers.length
        }),
        confidence: Math.min(0.9, 0.6 + (similarUsers.length * 0.1)),
        category: habit.category
      });
    });
    
    return suggestions;
  }

  /**
   * Generate semantic search suggestions
   */
  private generateSemanticSuggestions(userHabits: Habit[], t: (key: string, params?: any) => string): AIHabitSuggestion[] {
    const suggestions: AIHabitSuggestion[] = [];
    
    // Build semantic context from user's current habits
    const semanticContext = this.buildSemanticContext(userHabits);
    
    // Find semantically related habits
    const relatedHabits = this.findSemanticallyRelatedHabits(semanticContext);
    
    // Generate suggestions based on semantic relevance
    relatedHabits.slice(0, 2).forEach(habit => {
      const relevanceScore = this.calculateSemanticRelevance(habit, semanticContext);
      
      suggestions.push({
        id: `semantic-${Date.now()}-${Math.random()}`,
        title: habit.title,
        description: t('ai.semantic.description', { 
          relevance: Math.round(relevanceScore * 100),
          context: habit.context
        }),
        reason: t('ai.semantic.reason', { 
          relatedHabits: habit.relatedHabits.map(h => t(h)).join(', '),
          context: t(habit.context)
        }),
        confidence: relevanceScore,
        category: habit.category
      });
    });
    
    return suggestions;
  }

  /**
   * Generate gap analysis suggestions
   */
  private generateGapAnalysisSuggestions(userHabits: Habit[], t: (key: string, params?: any) => string): AIHabitSuggestion[] {
    const suggestions: AIHabitSuggestion[] = [];
    
    // Find missing categories
    const missingCategories = this.findMissingCategories(userHabits);
    
    // Analyze user's current patterns
    const userPatterns = this.analyzeUserPatterns(userHabits);
    
    // Generate suggestions for missing categories
    missingCategories.slice(0, 2).forEach(category => {
      const categorySuggestions = this.generateCategorySuggestions(category, userPatterns.map(p => p.preferredTime), t);
      
      categorySuggestions.forEach(suggestion => {
        suggestions.push({
          id: `gap-${Date.now()}-${Math.random()}`,
          title: suggestion.title,
          description: t('ai.gapAnalysis.description', { 
            category: t(`category_${category}`),
            benefits: suggestion.description
          }),
          reason: t('ai.gapAnalysis.reason', { 
            category: t(`category_${category}`),
            currentHabits: userHabits.length
          }),
          confidence: 0.7,
          category: category
        });
      });
    });
    
    return suggestions;
  }

  /**
   * Generate optimization suggestions
   */
  private generateOptimizationSuggestions(userHabits: Habit[], t: (key: string, params?: any) => string): AIHabitSuggestion[] {
    const suggestions: AIHabitSuggestion[] = [];
    
    // Analyze user's habit patterns
    const userPatterns = this.analyzeUserPatterns(userHabits);
    const mlPredictions = this.generateMLPredictions(userHabits, userPatterns);
    
    // Generate optimization suggestions
    mlPredictions.forEach(prediction => {
      if (prediction.successProbability < 0.6) {
        const habit = userHabits.find(h => h.id === prediction.habitId);
        if (habit) {
          suggestions.push({
            id: `optimize-${habit.id}`,
            title: t('ai.optimization.title', { habitTitle: t(habit.title) }),
            description: t('ai.optimization.description', { 
              probability: Math.round(prediction.successProbability * 100),
              optimalTime: prediction.optimalTime 
            }),
            reason: t('ai.optimization.reason', { 
              habitTitle: t(habit.title),
              modifications: prediction.recommendedModifications.join(', ')
            }),
            confidence: prediction.confidence,
            category: habit.category || 'wellness',
            relatedHabitId: habit.id
          });
        }
      }
    });
    
    return suggestions;
  }

  /**
   * Generate context-aware suggestions
   */
  private generateContextAwareSuggestions(userHabits: Habit[], t: (key: string, params?: any) => string): AIHabitSuggestion[] {
    const suggestions: AIHabitSuggestion[] = [];
    
    // Get current context (time, day, etc.)
    const currentContext = this.getCurrentContext();
    
    // Find habits that work well in current context
    const contextAppropriateHabits = this.findContextAppropriateHabits(currentContext);
    
    // Generate context-aware suggestions
    contextAppropriateHabits.slice(0, 2).forEach(habit => {
      suggestions.push({
        id: `context-${Date.now()}-${Math.random()}`,
        title: habit.title,
        description: t('ai.contextAware.description', { 
          context: t(currentContext.timeOfDay),
          effectiveness: Math.round(habit.contextEffectiveness * 100)
        }),
        reason: t('ai.contextAware.reason', { 
          context: t(currentContext.timeOfDay),
          habitTitle: t(habit.title)
        }),
        confidence: habit.contextEffectiveness,
        category: habit.category
      });
    });
    
    return suggestions;
  }
}

export const aiService = new AIService();