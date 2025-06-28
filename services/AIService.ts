import { Habit, AIHabitSuggestion, MotivationalMessage, SmartReminderSuggestion } from '@/types';
import { habitCategories } from '@/data/habitSuggestions';

class AIService {
  /**
   * Generate AI-powered habit suggestions based on user's current habits and behavior
   */
  generateHabitSuggestions(userHabits: Habit[], t: (key: string, params?: any) => string): AIHabitSuggestion[] {
    const suggestions: AIHabitSuggestion[] = [];
    
    // Analyze user's habit patterns
    const userCategories = this.analyzeUserCategories(userHabits);
    const consistentHabits = userHabits.filter(habit => habit.streak >= 7);
    const strugglingHabits = userHabits.filter(habit => habit.streak < 3);
    
    // Suggestion 1: Complement existing strong habits
    consistentHabits.forEach(habit => {
      const complementaryHabits = this.findComplementaryHabits(habit, userHabits);
      complementaryHabits.forEach(suggestion => {
        suggestions.push({
          id: `ai-${Date.now()}-${Math.random()}`,
          title: suggestion.title,
          description: suggestion.description,
          reason: t('ai_consistent_pairs_well', { habitTitle: habit.title, streak: habit.streak }),
          confidence: 0.8,
          category: suggestion.category || 'wellness',
          relatedHabitId: habit.id
        });
      });
    });
    
    // Suggestion 2: Easier alternatives for struggling habits
    strugglingHabits.forEach(habit => {
      const easierAlternatives = this.findEasierAlternatives(habit);
      easierAlternatives.forEach(alternative => {
        suggestions.push({
          id: `ai-${Date.now()}-${Math.random()}`,
          title: alternative.title,
          description: alternative.description,
          reason: t('ai_trouble_easier_version', { habitTitle: habit.title }),
          confidence: 0.7,
          category: alternative.category || 'wellness'
        });
      });
    });
    
    // Suggestion 3: Fill gaps in user's routine
    const missingCategories = this.findMissingCategories(userCategories);
    missingCategories.forEach(category => {
      const categoryHabits = habitCategories.find(cat => cat.id === category)?.habits || [];
      if (categoryHabits.length > 0) {
        const randomHabit = categoryHabits[Math.floor(Math.random() * categoryHabits.length)];
        suggestions.push({
          id: `ai-${Date.now()}-${Math.random()}`,
          title: randomHabit.title,
          description: randomHabit.description,
          reason: t('ai_no_category_habits', { category: t(`category_${category}`) }),
          confidence: 0.6,
          category: category
        });
      }
    });
    
    // Return top 3 suggestions sorted by confidence
    return suggestions
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, 3);
  }
  
  /**
   * Generate smart reminder time suggestions based on user's completion patterns
   */
  generateSmartReminderSuggestions(userHabits: Habit[]): SmartReminderSuggestion[] {
    const suggestions: SmartReminderSuggestion[] = [];
    
    userHabits.forEach(habit => {
      if (!habit.reminderEnabled && habit.completionTimes && habit.completionTimes.length > 0) {
        const optimalTime = this.findOptimalReminderTime(habit.completionTimes);
        suggestions.push({
          habitId: habit.id,
          suggestedTime: optimalTime,
          reason: `Based on your completion pattern, ${optimalTime} seems to work best for you.`,
          confidence: this.calculateTimeConfidence(habit.completionTimes, optimalTime)
        });
      }
    });
    
    return suggestions.sort((a, b) => b.confidence - a.confidence);
  }
  
  /**
   * Generate motivational messages based on user's current state
   */
  generateMotivationalMessage(userHabits: Habit[]): MotivationalMessage | null {
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
        message: `🎉 Amazing! You've hit a ${habit.streak}-day streak with "${habit.title}"! You're building real momentum.`,
        type: 'milestone',
        condition: 'streak_milestone'
      };
    }
    
    if (completionRate === 1.0 && totalHabits > 0) {
      return {
        id: `motivational-${Date.now()}`,
        message: `🌟 Perfect day! You've completed all your habits. You're unstoppable!`,
        type: 'encouragement',
        condition: 'perfect_day'
      };
    }
    
    if (strugglingHabits.length > 0 && completionRate < 0.5) {
      return {
        id: `motivational-${Date.now()}`,
        message: `💪 Every expert was once a beginner. Start small today - even 1% progress counts!`,
        type: 'streak_recovery',
        condition: 'low_completion'
      };
    }
    
    if (longestStreak >= 3) {
      return {
        id: `motivational-${Date.now()}`,
        message: `🔥 Your ${longestStreak}-day streak shows you've got what it takes. Keep the momentum going!`,
        type: 'encouragement',
        condition: 'good_streak'
      };
    }
    
    // Default encouraging message
    const encouragingMessages = [
      "🌱 Small steps lead to big changes. You've got this!",
      "⭐ Progress, not perfection. Every day is a new opportunity.",
      "🚀 You're building the future you want, one habit at a time.",
      "💎 Consistency is the mother of mastery. Keep going!",
      "🌈 Your future self will thank you for the work you do today."
    ];
    
    return {
      id: `motivational-${Date.now()}`,
      message: encouragingMessages[Math.floor(Math.random() * encouragingMessages.length)],
      type: 'encouragement',
      condition: 'general'
    };
  }
  
  // Helper methods
  private analyzeUserCategories(habits: Habit[]): string[] {
    const categories = new Set<string>();
    habits.forEach(habit => {
      if (habit.category) {
        categories.add(habit.category);
      } else {
        // Infer category from title/content
        const inferredCategory = this.inferCategory(habit.title);
        categories.add(inferredCategory);
      }
    });
    return Array.from(categories);
  }
  
  private inferCategory(title: string): string {
    const titleLower = title.toLowerCase();
    if (titleLower.includes('water') || titleLower.includes('exercise') || titleLower.includes('sleep')) {
      return 'wellness';
    }
    if (titleLower.includes('read') || titleLower.includes('learn') || titleLower.includes('study')) {
      return 'learning';
    }
    if (titleLower.includes('meditat') || titleLower.includes('mindful') || titleLower.includes('breath')) {
      return 'mindfulness';
    }
    if (titleLower.includes('plan') || titleLower.includes('organize') || titleLower.includes('clean')) {
      return 'productivity';
    }
    return 'wellness'; // default
  }
  
  private findComplementaryHabits(habit: Habit, existingHabits: Habit[]) {
    const existingTitles = new Set(existingHabits.map(h => h.title.toLowerCase()));
    const category = habit.category || this.inferCategory(habit.title);
    
    const complementaryMap: Record<string, any[]> = {
      wellness: [
        { title: 'Take a 5-minute walk', description: 'Light movement to complement your wellness routine', category: 'wellness' },
        { title: 'Drink a glass of water', description: 'Stay hydrated throughout the day', category: 'wellness' }
      ],
      mindfulness: [
        { title: 'Practice gratitude', description: 'Write down 3 things you\'re grateful for', category: 'mindfulness' },
        { title: 'Deep breathing exercise', description: '5 minutes of focused breathing', category: 'mindfulness' }
      ],
      learning: [
        { title: 'Review daily notes', description: 'Spend 5 minutes reviewing what you learned', category: 'learning' },
        { title: 'Practice a new skill', description: 'Dedicate time to skill development', category: 'learning' }
      ]
    };
    
    return (complementaryMap[category] || [])
      .filter(suggestion => !existingTitles.has(suggestion.title.toLowerCase()));
  }
  
  private findEasierAlternatives(habit: Habit) {
    const title = habit.title.toLowerCase();
    const alternatives = [];
    
    if (title.includes('exercise') || title.includes('workout')) {
      alternatives.push({
        title: 'Do 5 jumping jacks',
        description: 'A quick burst of movement to get started',
        category: 'wellness'
      });
    }
    
    if (title.includes('read')) {
      alternatives.push({
        title: 'Read one page',
        description: 'Start small with just one page per day',
        category: 'learning'
      });
    }
    
    if (title.includes('meditat')) {
      alternatives.push({
        title: 'Take 3 deep breaths',
        description: 'A micro-meditation to build the habit',
        category: 'mindfulness'
      });
    }
    
    return alternatives;
  }
  
  private findMissingCategories(userCategories: string[]): string[] {
    const allCategories = ['wellness', 'productivity', 'learning', 'mindfulness', 'fitness'];
    return allCategories.filter(cat => !userCategories.includes(cat));
  }
  
  private findOptimalReminderTime(completionTimes: string[]): string {
    // Convert times to minutes for easier calculation
    const timeInMinutes = completionTimes.map(time => {
      const [hours, minutes] = time.split(':').map(Number);
      return hours * 60 + minutes;
    });
    
    // Find the most common time range (within 30 minutes)
    const timeRanges: Record<string, number> = {};
    timeInMinutes.forEach(time => {
      const roundedTime = Math.round(time / 30) * 30; // Round to nearest 30 minutes
      const timeKey = `${Math.floor(roundedTime / 60)}:${(roundedTime % 60).toString().padStart(2, '0')}`;
      timeRanges[timeKey] = (timeRanges[timeKey] || 0) + 1;
    });
    
    // Return the most frequent time, or suggest 30 minutes before average time
    const mostFrequentTime = Object.entries(timeRanges)
      .sort(([,a], [,b]) => b - a)[0]?.[0];
    
    if (mostFrequentTime) {
      const [hours, minutes] = mostFrequentTime.split(':').map(Number);
      const reminderTime = new Date();
      reminderTime.setHours(hours, minutes - 30, 0, 0); // 30 minutes before
      return `${reminderTime.getHours().toString().padStart(2, '0')}:${reminderTime.getMinutes().toString().padStart(2, '0')}`;
    }
    
    return '09:00'; // Default fallback
  }
  
  private calculateTimeConfidence(completionTimes: string[], suggestedTime: string): number {
    if (completionTimes.length < 3) return 0.3;
    
    const [suggestedHours, suggestedMinutes] = suggestedTime.split(':').map(Number);
    const suggestedInMinutes = suggestedHours * 60 + suggestedMinutes;
    
    const closeMatches = completionTimes.filter(time => {
      const [hours, minutes] = time.split(':').map(Number);
      const timeInMinutes = hours * 60 + minutes;
      return Math.abs(timeInMinutes - suggestedInMinutes) <= 60; // Within 1 hour
    });
    
    return Math.min(0.9, closeMatches.length / completionTimes.length);
  }
}

export const aiService = new AIService();