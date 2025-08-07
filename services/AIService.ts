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

class AIService {
  private static userPatterns: Map<string, UserBehaviorPattern[]> = new Map();
  private static feedbackHistory: UserFeedback[] = [];
  private static adaptiveThresholds: Map<string, number> = new Map();

  /**
   * Generate AI-powered habit suggestions based on user's current habits and behavior
   */
  generateHabitSuggestions(userHabits: Habit[], t: (key: string, params?: any) => string): AIHabitSuggestion[] {
    console.log('AIService.generateHabitSuggestions called with userHabits:', userHabits);
    const suggestions: AIHabitSuggestion[] = [];
    
    // For testing: Always generate some suggestions even if user has no habits
    if (userHabits.length === 0) {
      console.log('AIService - No user habits, generating default suggestions');
      // Generate suggestions for missing categories
      const allCategories = habitCategories.map(cat => cat.id);
      allCategories.slice(0, 2).forEach(category => {
        const suggestionsForCategory = this.generateCategorySuggestions(category, [], t);
        console.log('AIService - suggestionsForCategory:', suggestionsForCategory);
        suggestionsForCategory.forEach(suggestion => {
          suggestions.push({
            id: `ai-gap-${Date.now()}-${Math.random()}`,
            title: suggestion.title,
            description: suggestion.description,
            reason: t('ai.mlGapFilling', { 
              category: category,
              preferences: []
            }),
            confidence: 0.6,
            category: category
          });
        });
      });
      console.log('AIService - Final suggestions:', suggestions);
      return suggestions.sort((a, b) => b.confidence - a.confidence);
    }
    
    // Analyze user's habit patterns with ML
    const userPatterns = this.analyzeUserPatterns(userHabits);
    const mlPredictions = this.generateMLPredictions(userHabits, userPatterns);
    
    // Suggestion 1: ML-optimized habit modifications
    mlPredictions.forEach(prediction => {
      if (prediction.successProbability < 0.6) {
        const habit = userHabits.find(h => h.id === prediction.habitId);
        if (habit) {
          suggestions.push({
            id: `ml-optimize-${habit.id}`,
            title: t('ai.mlOptimization.title', { habitTitle: habit.title }),
            description: t('ai.mlOptimization.description', { 
              probability: Math.round(prediction.successProbability * 100),
              optimalTime: prediction.optimalTime 
            }),
            reason: t('ai.mlOptimization.reason', { 
              habitTitle: habit.title,
              modifications: prediction.recommendedModifications.join(', ')
            }),
            confidence: prediction.confidence,
            category: habit.category || 'wellness',
            relatedHabitId: habit.id
          });
        }
      }
    });
    
    // Suggestion 2: Complement existing strong habits with ML insights
    const consistentHabits = userHabits.filter(habit => habit.streak >= 7);
    consistentHabits.forEach(habit => {
      const complementaryHabits = this.findComplementaryHabits(habit, userHabits, t);
      const mlInsights = this.getMLInsightsForHabit(habit.id);
      
      complementaryHabits.forEach(suggestion => {
        suggestions.push({
          id: `ai-complement-${Date.now()}-${Math.random()}`,
          title: suggestion.title,
          description: suggestion.description,
          reason: t('ai.mlComplementaryReason', { 
            habitTitle: habit.title, 
            streak: habit.streak,
            insights: mlInsights.join(', ')
          }),
          confidence: this.calculateConfidenceWithFeedback(habit.id, 'complementary'),
          category: suggestion.category || 'wellness',
          relatedHabitId: habit.id
        });
      });
    });
    
    // Suggestion 3: ML-based alternatives for struggling habits
    const strugglingHabits = userHabits.filter(habit => habit.streak < 3);
    strugglingHabits.forEach(habit => {
      const easierAlternatives = this.findEasierAlternatives(habit, t);
      const mlAnalysis = this.analyzeFailurePatterns(habit.id);
      
      easierAlternatives.forEach(alternative => {
        suggestions.push({
          id: `ai-alternative-${Date.now()}-${Math.random()}`,
          title: alternative.title,
          description: alternative.description,
          reason: t('ai.mlAlternativeReason', { 
            habitTitle: habit.title,
            analysis: mlAnalysis.reason,
            alternative: alternative.title
          }),
          confidence: this.calculateConfidenceWithFeedback(habit.id, 'alternative'),
          category: alternative.category || 'wellness'
        });
      });
    });
    
    // Suggestion 4: Fill gaps using ML pattern recognition
    const missingCategories = this.findMissingCategories(userHabits);
    const userPreferences = this.analyzeUserPreferences(userHabits);
    
    missingCategories.forEach(category => {
      const suggestionsForCategory = this.generateCategorySuggestions(category, userPreferences, t);
      suggestionsForCategory.forEach(suggestion => {
        suggestions.push({
          id: `ai-gap-${Date.now()}-${Math.random()}`,
          title: suggestion.title,
          description: suggestion.description,
          reason: t('ai.mlGapFilling', { 
            category: category,
            preferences: userPreferences.join(', ')
          }),
          confidence: this.calculateConfidenceWithFeedback(category, 'gap-filling'),
          category: category
        });
      });
    });
    
    return suggestions.sort((a, b) => b.confidence - a.confidence);
  }
  
  /**
   * Generate smart reminder time suggestions based on user's completion patterns
   */
  generateSmartReminderSuggestions(userHabits: Habit[], t: (key: string, params?: any) => string): SmartReminderSuggestion[] {
    const suggestions: SmartReminderSuggestion[] = [];
    
    userHabits.forEach(habit => {
      if (!habit.reminderEnabled && habit.completionTimes && habit.completionTimes.length > 0) {
        console.log('AIService - Processing habit:', habit.title, 'completionTimes:', habit.completionTimes);
        const optimalTime = this.findOptimalReminderTime(habit.completionTimes);
        console.log('AIService - Optimal time for', habit.title, ':', optimalTime);
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
    
    const complementaryHabits = [];
    
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
        title: t('ai.categorySuggestion', { category }),
        description: t('ai.categorySuggestionDescription', { category }),
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
    console.log('AIService - findOptimalReminderTime called with:', completionTimes);
    
    if (!completionTimes || completionTimes.length === 0) {
      // Default to morning if no completion times available
      console.log('AIService - No completion times, returning default 09:00');
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
          console.log('AIService - Parsed hour:', hour, 'from timeStr:', timeStr);
        }
      } catch (error) {
        // Skip invalid time strings
        console.warn('Invalid completion time:', timeStr, error);
      }
    });

    console.log('AIService - Hour counts:', hourCounts);

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

    console.log('AIService - Final optimal hour:', optimalHour);

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
}

export const aiService = new AIService();