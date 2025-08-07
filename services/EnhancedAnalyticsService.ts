import { Habit, MoodEntry, HabitMoodEntry } from '../types';
import { useHabits } from '../context/HabitContext';

export interface AdvancedAnalyticsData {
  habitCompletions: {
    date: string;
    completed: number;
    total: number;
    completionRate: number;
    trend: 'up' | 'down' | 'stable';
  }[];
  streakData: {
    habitId: string;
    habitName: string;
    currentStreak: number;
    longestStreak: number;
    completionRate: number;
    trend: 'up' | 'down' | 'stable';
    confidence: number;
  }[];
  moodTrends: {
    date: string;
    averageMood: number;
    moodCount: number;
    dominantMood: string;
    moodStability: number;
  }[];
  performanceMetrics: {
    totalHabits: number;
    activeHabits: number;
    completionRate: number;
    averageStreak: number;
    bestPerformingHabit: string;
    needsAttention: string[];
    overallTrend: 'improving' | 'declining' | 'stable';
    confidence: number;
  };
  predictiveInsights: {
    nextWeekPrediction: {
      expectedCompletionRate: number;
      confidence: number;
      factors: string[];
    };
    habitOptimization: {
      recommendedChanges: string[];
      expectedImpact: number;
      implementationDifficulty: 'easy' | 'medium' | 'hard';
    };
    moodCorrelations: {
      strongestCorrelations: Array<{
        habit: string;
        mood: string;
        correlation: number;
        significance: number;
      }>;
    };
  };
  patternAnalysis: {
    cyclicalPatterns: Array<{
      type: 'weekly' | 'monthly' | 'seasonal';
      description: string;
      confidence: number;
      impact: number;
    }>;
    triggerAnalysis: Array<{
      trigger: string;
      affectedHabits: string[];
      frequency: number;
      impact: 'positive' | 'negative' | 'neutral';
    }>;
    habitChains: Array<{
      primaryHabit: string;
      dependentHabits: string[];
      chainStrength: number;
      successRate: number;
    }>;
  };
}

export interface AnalyticsCache {
  data: AdvancedAnalyticsData;
  timestamp: number;
  timeframe: string;
  userId: string;
}

export class EnhancedAnalyticsService {
  private static instance: EnhancedAnalyticsService;
  private cache: Map<string, AnalyticsCache> = new Map();
  private cacheExpiry = 5 * 60 * 1000; // 5 minutes
  private t?: (key: string) => string;

  static getInstance(): EnhancedAnalyticsService {
    if (!EnhancedAnalyticsService.instance) {
      EnhancedAnalyticsService.instance = new EnhancedAnalyticsService();
    }
    return EnhancedAnalyticsService.instance;
  }

  setTranslationFunction(t: (key: string) => string) {
    this.t = t;
  }

  private getText(key: string, fallback: string): string {
    return this.t ? this.t(key) : fallback;
  }

  async getAdvancedAnalytics(
    habits: Habit[],
    moodData: MoodEntry[],
    habitMoodData: HabitMoodEntry[],
    timeframe: '7d' | '30d' | '90d' | '365d',
    userId: string
  ): Promise<AdvancedAnalyticsData> {
    const cacheKey = `${userId}_${timeframe}`;
    const cached = this.cache.get(cacheKey);
    
    // Check if cache is still valid
    if (cached && Date.now() - cached.timestamp < this.cacheExpiry) {
      return cached.data;
    }

    // Calculate days based on timeframe
    const days = this.getDaysFromTimeframe(timeframe);
    
    // Generate real analytics data
    const analyticsData: AdvancedAnalyticsData = {
      habitCompletions: await this.calculateHabitCompletions(habits, days),
      streakData: await this.calculateStreakData(habits, days),
      moodTrends: await this.calculateMoodTrends(moodData, days),
      performanceMetrics: await this.calculatePerformanceMetrics(habits, moodData, habitMoodData, days),
      predictiveInsights: await this.generatePredictiveInsights(habits, moodData, habitMoodData, days),
      patternAnalysis: await this.analyzePatterns(habits, moodData, habitMoodData, days)
    };

    // Cache the results
    this.cache.set(cacheKey, {
      data: analyticsData,
      timestamp: Date.now(),
      timeframe,
      userId
    });

    return analyticsData;
  }

  private getDaysFromTimeframe(timeframe: string): number {
    switch (timeframe) {
      case '7d': return 7;
      case '30d': return 30;
      case '90d': return 90;
      case '365d': return 365;
      default: return 30;
    }
  }

  private async calculateHabitCompletions(habits: Habit[], days: number): Promise<AdvancedAnalyticsData['habitCompletions']> {
    const completions: AdvancedAnalyticsData['habitCompletions'] = [];
    const endDate = new Date();
    const startDate = new Date(endDate.getTime() - (days * 24 * 60 * 60 * 1000));

    for (let i = 0; i < days; i++) {
      const date = new Date(startDate.getTime() + (i * 24 * 60 * 60 * 1000));
      const dateStr = date.toISOString().split('T')[0];
      
      let completed = 0;
      let total = 0;

      habits.forEach(habit => {
        if (habit.createdAt <= dateStr) {
          total++;
          // Check if habit was completed on this date
          const wasCompleted = habit.completions?.some(completion => 
            completion.date === dateStr
          );
          if (wasCompleted) completed++;
        }
      });

      const completionRate = total > 0 ? (completed / total) * 100 : 0;
      
      // Calculate trend (simplified - in real implementation, use more sophisticated trend analysis)
      const trend = this.calculateTrend(completions, completionRate);

      completions.push({
        date: dateStr,
        completed,
        total,
        completionRate,
        trend
      });
    }

    return completions;
  }

  private async calculateStreakData(habits: Habit[], days: number): Promise<AdvancedAnalyticsData['streakData']> {
    return habits.map(habit => {
      const currentStreak = this.calculateCurrentStreak(habit);
      const longestStreak = this.calculateLongestStreak(habit);
      const completionRate = this.calculateHabitCompletionRate(habit, days);
      const trend = this.calculateHabitTrend(habit, days);
      const confidence = this.calculateConfidence(habit, days);

      return {
        habitId: habit.id,
        habitName: habit.name,
        currentStreak,
        longestStreak,
        completionRate,
        trend,
        confidence
      };
    });
  }

  private async calculateMoodTrends(moodData: MoodEntry[], days: number): Promise<AdvancedAnalyticsData['moodTrends']> {
    const trends: AdvancedAnalyticsData['moodTrends'] = [];
    const endDate = new Date();
    const startDate = new Date(endDate.getTime() - (days * 24 * 60 * 60 * 1000));

    // Group mood data by date
    const moodByDate = new Map<string, MoodEntry[]>();
    moodData.forEach(entry => {
      const date = entry.timestamp.split('T')[0];
      if (!moodByDate.has(date)) {
        moodByDate.set(date, []);
      }
      moodByDate.get(date)!.push(entry);
    });

    for (let i = 0; i < days; i++) {
      const date = new Date(startDate.getTime() + (i * 24 * 60 * 60 * 1000));
      const dateStr = date.toISOString().split('T')[0];
      const dayMoods = moodByDate.get(dateStr) || [];

      if (dayMoods.length > 0) {
        const averageMood = dayMoods.reduce((sum, entry) => sum + entry.mood, 0) / dayMoods.length;
        const dominantMood = this.getDominantMood(dayMoods);
        const moodStability = this.calculateMoodStability(dayMoods);

        trends.push({
          date: dateStr,
          averageMood,
          moodCount: dayMoods.length,
          dominantMood,
          moodStability
        });
      }
    }

    return trends;
  }

  private async calculatePerformanceMetrics(
    habits: Habit[], 
    moodData: MoodEntry[], 
    habitMoodData: HabitMoodEntry[], 
    days: number
  ): Promise<AdvancedAnalyticsData['performanceMetrics']> {
    const totalHabits = habits.length;
    const activeHabits = habits.filter(habit => 
      habit.createdAt <= new Date(Date.now() - (days * 24 * 60 * 60 * 1000)).toISOString().split('T')[0]
    ).length;

    const completionRate = habits.length > 0 
      ? habits.reduce((sum, habit) => sum + this.calculateHabitCompletionRate(habit, days), 0) / habits.length 
      : 0;

    const averageStreak = habits.length > 0 
      ? habits.reduce((sum, habit) => sum + this.calculateCurrentStreak(habit), 0) / habits.length 
      : 0;

    const bestPerformingHabit = this.findBestPerformingHabit(habits, days);
    const needsAttention = this.findHabitsNeedingAttention(habits, days);
    const overallTrend = this.calculateOverallTrend(habits, days);
    const confidence = this.calculateOverallConfidence(habits, moodData, days);

    return {
      totalHabits,
      activeHabits,
      completionRate,
      averageStreak,
      bestPerformingHabit,
      needsAttention,
      overallTrend,
      confidence
    };
  }

  private async generatePredictiveInsights(
    habits: Habit[], 
    moodData: MoodEntry[], 
    habitMoodData: HabitMoodEntry[], 
    days: number
  ): Promise<AdvancedAnalyticsData['predictiveInsights']> {
    // Next week prediction based on current trends
    const currentTrend = this.calculateOverallTrend(habits, days);
    const trendStrength = this.calculateTrendStrength(habits, days);
    
    let expectedCompletionRate = 0;
    let confidence = 0;
    const factors: string[] = [];

    if (currentTrend === 'improving') {
      expectedCompletionRate = Math.min(100, this.getCurrentCompletionRate(habits, days) + (trendStrength * 5));
      confidence = Math.min(95, 70 + (trendStrength * 10));
      factors.push(this.getText('analytics.predictive.trendingUp', 'Consistent improvement trend'));
    } else if (currentTrend === 'declining') {
      expectedCompletionRate = Math.max(0, this.getCurrentCompletionRate(habits, days) - (trendStrength * 3));
      confidence = Math.min(85, 60 + (trendStrength * 8));
      factors.push(this.getText('analytics.predictive.trendingDown', 'Declining performance trend'));
    } else {
      expectedCompletionRate = this.getCurrentCompletionRate(habits, days);
      confidence = 50;
      factors.push(this.getText('analytics.predictive.stable', 'Stable performance pattern'));
    }

    // Habit optimization recommendations
    const recommendedChanges = this.generateHabitOptimizationRecommendations(habits, moodData, habitMoodData);
    const expectedImpact = this.calculateExpectedImpact(recommendedChanges);
    const implementationDifficulty = this.assessImplementationDifficulty(recommendedChanges);

    // Mood correlations
    const strongestCorrelations = this.findMoodCorrelations(habits, moodData, habitMoodData);

    return {
      nextWeekPrediction: {
        expectedCompletionRate,
        confidence,
        factors
      },
      habitOptimization: {
        recommendedChanges,
        expectedImpact,
        implementationDifficulty
      },
      moodCorrelations: {
        strongestCorrelations
      }
    };
  }

  private async analyzePatterns(
    habits: Habit[], 
    moodData: MoodEntry[], 
    habitMoodData: HabitMoodEntry[], 
    days: number
  ): Promise<AdvancedAnalyticsData['patternAnalysis']> {
    const cyclicalPatterns = this.detectCyclicalPatterns(habits, moodData, days);
    const triggerAnalysis = this.analyzeTriggers(habits, moodData, habitMoodData, days);
    const habitChains = this.identifyHabitChains(habits, habitMoodData, days);

    return {
      cyclicalPatterns,
      triggerAnalysis,
      habitChains
    };
  }

  // Helper methods for calculations
  private calculateTrend(data: any[], currentValue: number): 'up' | 'down' | 'stable' {
    if (data.length < 3) return 'stable';
    
    const recentValues = data.slice(-3).map(d => d.completionRate || 0);
    const avg = recentValues.reduce((sum, val) => sum + val, 0) / recentValues.length;
    
    if (currentValue > avg * 1.1) return 'up';
    if (currentValue < avg * 0.9) return 'down';
    return 'stable';
  }

  private calculateCurrentStreak(habit: Habit): number {
    if (!habit.completions || habit.completions.length === 0) return 0;
    
    const sortedCompletions = habit.completions
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    
    let streak = 0;
    const today = new Date();
    
    for (let i = 0; i < sortedCompletions.length; i++) {
      const completionDate = new Date(sortedCompletions[i].date);
      const expectedDate = new Date(today.getTime() - (i * 24 * 60 * 60 * 1000));
      
      if (completionDate.toDateString() === expectedDate.toDateString()) {
        streak++;
      } else {
        break;
      }
    }
    
    return streak;
  }

  private calculateLongestStreak(habit: Habit): number {
    if (!habit.completions || habit.completions.length === 0) return 0;
    
    const sortedCompletions = habit.completions
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    
    let currentStreak = 0;
    let longestStreak = 0;
    let lastDate: Date | null = null;
    
    for (const completion of sortedCompletions) {
      const completionDate = new Date(completion.date);
      
      if (lastDate) {
        const daysDiff = Math.floor((completionDate.getTime() - lastDate.getTime()) / (24 * 60 * 60 * 1000));
        if (daysDiff === 1) {
          currentStreak++;
        } else {
          longestStreak = Math.max(longestStreak, currentStreak);
          currentStreak = 1;
        }
      } else {
        currentStreak = 1;
      }
      
      lastDate = completionDate;
    }
    
    return Math.max(longestStreak, currentStreak);
  }

  private calculateHabitCompletionRate(habit: Habit, days: number): number {
    if (!habit.completions || habit.completions.length === 0) return 0;
    
    const endDate = new Date();
    const startDate = new Date(endDate.getTime() - (days * 24 * 60 * 60 * 1000));
    
    const completionsInPeriod = habit.completions.filter(completion => {
      const completionDate = new Date(completion.date);
      return completionDate >= startDate && completionDate <= endDate;
    });
    
    return (completionsInPeriod.length / days) * 100;
  }

  private calculateHabitTrend(habit: Habit, days: number): 'up' | 'down' | 'stable' {
    // Simplified trend calculation - in real implementation, use more sophisticated analysis
    const recentRate = this.calculateHabitCompletionRate(habit, Math.floor(days / 2));
    const olderRate = this.calculateHabitCompletionRate(habit, days) - recentRate;
    
    if (recentRate > olderRate * 1.2) return 'up';
    if (recentRate < olderRate * 0.8) return 'down';
    return 'stable';
  }

  private calculateConfidence(habit: Habit, days: number): number {
    // Confidence based on data consistency and amount
    if (!habit.completions || habit.completions.length === 0) return 0;
    
    const completionRate = this.calculateHabitCompletionRate(habit, days);
    const dataPoints = Math.min(habit.completions.length, days);
    
    // Higher confidence with more data points and consistent patterns
    let confidence = Math.min(95, (dataPoints / days) * 100);
    
    // Adjust based on consistency
    const consistency = this.calculateConsistency(habit, days);
    confidence = confidence * (0.7 + consistency * 0.3);
    
    return Math.round(confidence);
  }

  private calculateConsistency(habit: Habit, days: number): number {
    if (!habit.completions || habit.completions.length === 0) return 0;
    
    const rates = [];
    const segmentSize = Math.floor(days / 4);
    
    for (let i = 0; i < 4; i++) {
      const startDay = i * segmentSize;
      const endDay = (i + 1) * segmentSize;
      const rate = this.calculateHabitCompletionRate(habit, endDay - startDay);
      rates.push(rate);
    }
    
    // Calculate standard deviation as a measure of consistency
    const mean = rates.reduce((sum, rate) => sum + rate, 0) / rates.length;
    const variance = rates.reduce((sum, rate) => sum + Math.pow(rate - mean, 2), 0) / rates.length;
    const stdDev = Math.sqrt(variance);
    
    // Convert to consistency score (0-1, where 1 is most consistent)
    return Math.max(0, 1 - (stdDev / 100));
  }

  private getDominantMood(moods: MoodEntry[]): string {
    if (moods.length === 0) return 'neutral';
    
    const moodCounts = new Map<string, number>();
    moods.forEach(mood => {
      const moodCategory = this.categorizeMood(mood.mood);
      moodCounts.set(moodCategory, (moodCounts.get(moodCategory) || 0) + 1);
    });
    
    let dominantMood = 'neutral';
    let maxCount = 0;
    
    moodCounts.forEach((count, mood) => {
      if (count > maxCount) {
        maxCount = count;
        dominantMood = mood;
      }
    });
    
    return dominantMood;
  }

  private categorizeMood(moodValue: number): string {
    if (moodValue >= 4) return 'positive';
    if (moodValue <= 2) return 'negative';
    return 'neutral';
  }

  private calculateMoodStability(moods: MoodEntry[]): number {
    if (moods.length < 2) return 1;
    
    const moodValues = moods.map(mood => mood.mood);
    const mean = moodValues.reduce((sum, val) => sum + val, 0) / moodValues.length;
    const variance = moodValues.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / moodValues.length;
    const stdDev = Math.sqrt(variance);
    
    // Convert to stability score (0-1, where 1 is most stable)
    return Math.max(0, 1 - (stdDev / 5));
  }

  private findBestPerformingHabit(habits: Habit[], days: number): string {
    if (habits.length === 0) return '';
    
    let bestHabit = habits[0];
    let bestRate = this.calculateHabitCompletionRate(habits[0], days);
    
    habits.forEach(habit => {
      const rate = this.calculateHabitCompletionRate(habit, days);
      if (rate > bestRate) {
        bestRate = rate;
        bestHabit = habit;
      }
    });
    
    return bestHabit.name;
  }

  private findHabitsNeedingAttention(habits: Habit[], days: number): string[] {
    return habits
      .filter(habit => this.calculateHabitCompletionRate(habit, days) < 30)
      .map(habit => habit.name)
      .slice(0, 3); // Return top 3
  }

  private calculateOverallTrend(habits: Habit[], days: number): 'improving' | 'declining' | 'stable' {
    if (habits.length === 0) return 'stable';
    
    const improvingHabits = habits.filter(habit => 
      this.calculateHabitTrend(habit, days) === 'up'
    ).length;
    
    const decliningHabits = habits.filter(habit => 
      this.calculateHabitTrend(habit, days) === 'down'
    ).length;
    
    const improvingRatio = improvingHabits / habits.length;
    const decliningRatio = decliningHabits / habits.length;
    
    if (improvingRatio > 0.4) return 'improving';
    if (decliningRatio > 0.4) return 'declining';
    return 'stable';
  }

  private calculateOverallConfidence(habits: Habit[], moodData: MoodEntry[], days: number): number {
    if (habits.length === 0) return 0;
    
    const habitConfidences = habits.map(habit => this.calculateConfidence(habit, days));
    const avgHabitConfidence = habitConfidences.reduce((sum, conf) => sum + conf, 0) / habitConfidences.length;
    
    // Factor in mood data availability
    const moodDataRatio = Math.min(1, moodData.length / (days * 0.5)); // Expect at least 50% mood data coverage
    
    return Math.round(avgHabitConfidence * 0.7 + moodDataRatio * 30);
  }

  private calculateTrendStrength(habits: Habit[], days: number): number {
    if (habits.length === 0) return 0;
    
    const trends = habits.map(habit => this.calculateHabitTrend(habit, days));
    const improvingCount = trends.filter(trend => trend === 'up').length;
    const decliningCount = trends.filter(trend => trend === 'down').length;
    
    const maxCount = Math.max(improvingCount, decliningCount);
    return maxCount / habits.length;
  }

  private getCurrentCompletionRate(habits: Habit[], days: number): number {
    if (habits.length === 0) return 0;
    
    const recentDays = Math.min(7, days);
    const totalCompletions = habits.reduce((sum, habit) => {
      if (!habit.completions) return sum;
      
      const recentCompletions = habit.completions.filter(completion => {
        const completionDate = new Date(completion.date);
        const cutoffDate = new Date(Date.now() - (recentDays * 24 * 60 * 60 * 1000));
        return completionDate >= cutoffDate;
      });
      
      return sum + recentCompletions.length;
    }, 0);
    
    return (totalCompletions / (habits.length * recentDays)) * 100;
  }

  private generateHabitOptimizationRecommendations(
    habits: Habit[], 
    moodData: MoodEntry[], 
    habitMoodData: HabitMoodEntry[]
  ): string[] {
    const recommendations: string[] = [];
    
    // Find habits with low completion rates
    const lowPerformingHabits = habits.filter(habit => 
      this.calculateHabitCompletionRate(habit, 30) < 50
    );
    
    if (lowPerformingHabits.length > 0) {
      recommendations.push(this.getText('analytics.recommendations.improveLowPerforming', 'Focus on improving low-performing habits'));
    }
    
    // Check for mood correlations
    if (moodData.length > 0 && habitMoodData.length > 0) {
      recommendations.push(this.getText('analytics.recommendations.moodOptimization', 'Optimize habit timing based on mood patterns'));
    }
    
    // Check for habit chains
    const habitChains = this.identifyHabitChains(habits, habitMoodData, 30);
    if (habitChains.length > 0) {
      recommendations.push(this.getText('analytics.recommendations.habitChaining', 'Leverage habit chains for better consistency'));
    }
    
    return recommendations.slice(0, 3); // Return top 3 recommendations
  }

  private calculateExpectedImpact(recommendations: string[]): number {
    // Simplified impact calculation - in real implementation, use ML models
    let impact = 0;
    
    recommendations.forEach(recommendation => {
      if (recommendation.includes('low-performing')) impact += 15;
      if (recommendation.includes('mood')) impact += 10;
      if (recommendation.includes('chains')) impact += 12;
    });
    
    return Math.min(100, impact);
  }

  private assessImplementationDifficulty(recommendations: string[]): 'easy' | 'medium' | 'hard' {
    // Simplified difficulty assessment
    const totalRecommendations = recommendations.length;
    
    if (totalRecommendations <= 1) return 'easy';
    if (totalRecommendations <= 2) return 'medium';
    return 'hard';
  }

  private findMoodCorrelations(
    habits: Habit[], 
    moodData: MoodEntry[], 
    habitMoodData: HabitMoodEntry[]
  ): Array<{habit: string, mood: string, correlation: number, significance: number}> {
    const correlations: Array<{habit: string, mood: string, correlation: number, significance: number}> = [];
    
    if (moodData.length === 0 || habitMoodData.length === 0) return correlations;
    
    // Simplified correlation analysis
    habits.forEach(habit => {
      const habitMoodEntries = habitMoodData.filter(entry => entry.habitId === habit.id);
      
      if (habitMoodEntries.length > 5) {
        const avgMood = habitMoodEntries.reduce((sum, entry) => sum + entry.mood, 0) / habitMoodEntries.length;
        const correlation = this.calculateCorrelation(habitMoodEntries);
        
        if (Math.abs(correlation) > 0.3) {
          correlations.push({
            habit: habit.name,
            mood: this.categorizeMood(avgMood),
            correlation: Math.abs(correlation),
            significance: Math.min(95, habitMoodEntries.length * 5)
          });
        }
      }
    });
    
    return correlations
      .sort((a, b) => b.correlation - a.correlation)
      .slice(0, 5); // Return top 5 correlations
  }

  private calculateCorrelation(entries: HabitMoodEntry[]): number {
    if (entries.length < 2) return 0;
    
    // Simplified correlation calculation
    const completionRates = entries.map(entry => entry.completed ? 1 : 0);
    const moods = entries.map(entry => entry.mood);
    
    const avgCompletion = completionRates.reduce((sum, val) => sum + val, 0) / completionRates.length;
    const avgMood = moods.reduce((sum, val) => sum + val, 0) / moods.length;
    
    let numerator = 0;
    let denominatorX = 0;
    let denominatorY = 0;
    
    for (let i = 0; i < entries.length; i++) {
      const xDiff = completionRates[i] - avgCompletion;
      const yDiff = moods[i] - avgMood;
      
      numerator += xDiff * yDiff;
      denominatorX += xDiff * xDiff;
      denominatorY += yDiff * yDiff;
    }
    
    if (denominatorX === 0 || denominatorY === 0) return 0;
    
    return numerator / Math.sqrt(denominatorX * denominatorY);
  }

  private detectCyclicalPatterns(
    habits: Habit[], 
    moodData: MoodEntry[], 
    days: number
  ): Array<{type: 'weekly' | 'monthly' | 'seasonal', description: string, confidence: number, impact: number}> {
    const patterns: Array<{type: 'weekly' | 'monthly' | 'seasonal', description: string, confidence: number, impact: number}> = [];
    
    // Weekly patterns
    if (days >= 7) {
      const weeklyPattern = this.analyzeWeeklyPattern(habits, moodData);
      if (weeklyPattern.confidence > 0.5) {
        patterns.push({
          type: 'weekly',
          description: this.getText('analytics.patterns.weekly', 'Weekly performance cycle detected'),
          confidence: weeklyPattern.confidence,
          impact: weeklyPattern.impact
        });
      }
    }
    
    // Monthly patterns
    if (days >= 30) {
      const monthlyPattern = this.analyzeMonthlyPattern(habits, moodData);
      if (monthlyPattern.confidence > 0.5) {
        patterns.push({
          type: 'monthly',
          description: this.getText('analytics.patterns.monthly', 'Monthly trend pattern identified'),
          confidence: monthlyPattern.confidence,
          impact: monthlyPattern.impact
        });
      }
    }
    
    return patterns;
  }

  private analyzeWeeklyPattern(habits: Habit[], moodData: MoodEntry[]): {confidence: number, impact: number} {
    // Simplified weekly pattern analysis
    const weekdays = [0, 0, 0, 0, 0, 0, 0]; // Sunday to Saturday
    const weekendDays = [0, 0, 0, 0, 0, 0, 0];
    
    habits.forEach(habit => {
      if (habit.completions) {
        habit.completions.forEach(completion => {
          const dayOfWeek = new Date(completion.date).getDay();
          weekdays[dayOfWeek]++;
        });
      }
    });
    
    const weekdayAvg = weekdays.slice(1, 6).reduce((sum, val) => sum + val, 0) / 5;
    const weekendAvg = (weekdays[0] + weekdays[6]) / 2;
    
    const difference = Math.abs(weekdayAvg - weekendAvg);
    const confidence = Math.min(0.9, difference / 10);
    const impact = Math.min(100, difference * 5);
    
    return { confidence, impact };
  }

  private analyzeMonthlyPattern(habits: Habit[], moodData: MoodEntry[]): {confidence: number, impact: number} {
    // Simplified monthly pattern analysis
    const monthlyCompletions = new Array(12).fill(0);
    
    habits.forEach(habit => {
      if (habit.completions) {
        habit.completions.forEach(completion => {
          const month = new Date(completion.date).getMonth();
          monthlyCompletions[month]++;
        });
      }
    });
    
    const avg = monthlyCompletions.reduce((sum, val) => sum + val, 0) / 12;
    const variance = monthlyCompletions.reduce((sum, val) => sum + Math.pow(val - avg, 2), 0) / 12;
    const stdDev = Math.sqrt(variance);
    
    const confidence = Math.min(0.8, stdDev / avg);
    const impact = Math.min(100, stdDev * 2);
    
    return { confidence, impact };
  }

  private analyzeTriggers(
    habits: Habit[], 
    moodData: MoodEntry[], 
    habitMoodData: HabitMoodEntry[], 
    days: number
  ): Array<{trigger: string, affectedHabits: string[], frequency: number, impact: 'positive' | 'negative' | 'neutral'}> {
    const triggers: Array<{trigger: string, affectedHabits: string[], frequency: number, impact: 'positive' | 'negative' | 'neutral'}> = [];
    
    // Analyze mood-based triggers
    if (moodData.length > 0) {
      const positiveMoodHabits = this.findMoodTriggeredHabits(habitMoodData, 'positive');
      const negativeMoodHabits = this.findMoodTriggeredHabits(habitMoodData, 'negative');
      
      if (positiveMoodHabits.length > 0) {
        triggers.push({
          trigger: this.getText('analytics.triggers.positiveMood', 'Positive mood'),
          affectedHabits: positiveMoodHabits,
          frequency: this.calculateTriggerFrequency(positiveMoodHabits, days),
          impact: 'positive'
        });
      }
      
      if (negativeMoodHabits.length > 0) {
        triggers.push({
          trigger: this.getText('analytics.triggers.negativeMood', 'Negative mood'),
          affectedHabits: negativeMoodHabits,
          frequency: this.calculateTriggerFrequency(negativeMoodHabits, days),
          impact: 'negative'
        });
      }
    }
    
    // Analyze time-based triggers
    const timeTriggers = this.analyzeTimeTriggers(habits, days);
    triggers.push(...timeTriggers);
    
    return triggers;
  }

  private findMoodTriggeredHabits(habitMoodData: HabitMoodEntry[], moodType: string): string[] {
    const habitIds = new Set<string>();
    
    habitMoodData.forEach(entry => {
      const entryMoodType = this.categorizeMood(entry.mood);
      if (entryMoodType === moodType && entry.completed) {
        habitIds.add(entry.habitId);
      }
    });
    
    return Array.from(habitIds);
  }

  private calculateTriggerFrequency(affectedHabits: string[], days: number): number {
    return Math.min(100, (affectedHabits.length / days) * 100);
  }

  private analyzeTimeTriggers(habits: Habit[], days: number): Array<{trigger: string, affectedHabits: string[], frequency: number, impact: 'positive' | 'negative' | 'neutral'}> {
    const triggers: Array<{trigger: string, affectedHabits: string[], frequency: number, impact: 'positive' | 'negative' | 'neutral'}> = [];
    
    // Analyze morning vs evening patterns
    const morningHabits: string[] = [];
    const eveningHabits: string[] = [];
    
    habits.forEach(habit => {
      if (habit.completions && habit.completions.length > 0) {
        const morningCompletions = habit.completions.filter(completion => {
          const hour = new Date(completion.date).getHours();
          return hour >= 6 && hour <= 10;
        }).length;
        
        const eveningCompletions = habit.completions.filter(completion => {
          const hour = new Date(completion.date).getHours();
          return hour >= 18 && hour <= 22;
        }).length;
        
        if (morningCompletions > eveningCompletions) {
          morningHabits.push(habit.name);
        } else if (eveningCompletions > morningCompletions) {
          eveningHabits.push(habit.name);
        }
      }
    });
    
    if (morningHabits.length > 0) {
      triggers.push({
        trigger: this.getText('analytics.triggers.morningTime', 'Morning time'),
        affectedHabits: morningHabits,
        frequency: this.calculateTriggerFrequency(morningHabits, days),
        impact: 'positive'
      });
    }
    
    if (eveningHabits.length > 0) {
      triggers.push({
        trigger: this.getText('analytics.triggers.eveningTime', 'Evening time'),
        affectedHabits: eveningHabits,
        frequency: this.calculateTriggerFrequency(eveningHabits, days),
        impact: 'positive'
      });
    }
    
    return triggers;
  }

  private identifyHabitChains(
    habits: Habit[], 
    habitMoodData: HabitMoodEntry[], 
    days: number
  ): Array<{primaryHabit: string, dependentHabits: string[], chainStrength: number, successRate: number}> {
    const chains: Array<{primaryHabit: string, dependentHabits: string[], chainStrength: number, successRate: number}> = [];
    
    // Simplified habit chain identification
    // In real implementation, use more sophisticated analysis
    habits.forEach(primaryHabit => {
      const dependentHabits = habits.filter(habit => 
        habit.id !== primaryHabit.id && 
        this.areHabitsRelated(primaryHabit, habit, habitMoodData)
      );
      
      if (dependentHabits.length > 0) {
        const chainStrength = this.calculateChainStrength(primaryHabit, dependentHabits, habitMoodData);
        const successRate = this.calculateChainSuccessRate(primaryHabit, dependentHabits, habitMoodData);
        
        if (chainStrength > 0.3) {
          chains.push({
            primaryHabit: primaryHabit.name,
            dependentHabits: dependentHabits.map(h => h.name),
            chainStrength,
            successRate
          });
        }
      }
    });
    
    return chains
      .sort((a, b) => b.chainStrength - a.chainStrength)
      .slice(0, 3); // Return top 3 chains
  }

  private areHabitsRelated(habit1: Habit, habit2: Habit, habitMoodData: HabitMoodEntry[]): boolean {
    // Simplified relationship detection
    // In real implementation, use correlation analysis
    const habit1Data = habitMoodData.filter(entry => entry.habitId === habit1.id);
    const habit2Data = habitMoodData.filter(entry => entry.habitId === habit2.id);
    
    if (habit1Data.length === 0 || habit2Data.length === 0) return false;
    
    // Check if they're completed on the same days
    const habit1Dates = new Set(habit1Data.map(entry => entry.date));
    const habit2Dates = new Set(habit2Data.map(entry => entry.date));
    
    const commonDates = Array.from(habit1Dates).filter(date => habit2Dates.has(date));
    const relationshipStrength = commonDates.length / Math.min(habit1Dates.size, habit2Dates.size);
    
    return relationshipStrength > 0.3;
  }

  private calculateChainStrength(primaryHabit: Habit, dependentHabits: Habit[], habitMoodData: HabitMoodEntry[]): number {
    if (dependentHabits.length === 0) return 0;
    
    let totalStrength = 0;
    
    dependentHabits.forEach(habit => {
      const strength = this.calculateHabitRelationshipStrength(primaryHabit, habit, habitMoodData);
      totalStrength += strength;
    });
    
    return totalStrength / dependentHabits.length;
  }

  private calculateHabitRelationshipStrength(habit1: Habit, habit2: Habit, habitMoodData: HabitMoodEntry[]): number {
    const habit1Data = habitMoodData.filter(entry => entry.habitId === habit1.id);
    const habit2Data = habitMoodData.filter(entry => entry.habitId === habit2.id);
    
    if (habit1Data.length === 0 || habit2Data.length === 0) return 0;
    
    // Calculate correlation between completion patterns
    const correlation = this.calculateCorrelationBetweenHabits(habit1Data, habit2Data);
    return Math.abs(correlation);
  }

  private calculateCorrelationBetweenHabits(habit1Data: HabitMoodEntry[], habit2Data: HabitMoodEntry[]): number {
    // Simplified correlation calculation
    const dates1 = new Set(habit1Data.map(entry => entry.date));
    const dates2 = new Set(habit2Data.map(entry => entry.date));
    
    const commonDates = Array.from(dates1).filter(date => dates2.has(date));
    const totalDates = new Set([...dates1, ...dates2]);
    
    return commonDates.length / totalDates.size;
  }

  private calculateChainSuccessRate(primaryHabit: Habit, dependentHabits: Habit[], habitMoodData: HabitMoodEntry[]): number {
    if (dependentHabits.length === 0) return 0;
    
    let totalSuccessRate = 0;
    
    dependentHabits.forEach(habit => {
      const habitData = habitMoodData.filter(entry => entry.habitId === habit.id);
      const successRate = habitData.length > 0 
        ? habitData.filter(entry => entry.completed).length / habitData.length 
        : 0;
      totalSuccessRate += successRate;
    });
    
    return (totalSuccessRate / dependentHabits.length) * 100;
  }

  // Cache management methods
  clearCache(userId?: string): void {
    if (userId) {
      // Clear cache for specific user
      for (const [key, cache] of this.cache.entries()) {
        if (cache.userId === userId) {
          this.cache.delete(key);
        }
      }
    } else {
      // Clear all cache
      this.cache.clear();
    }
  }

  getCacheStats(): {size: number, entries: number} {
    return {
      size: this.cache.size,
      entries: Array.from(this.cache.values()).length
    };
  }
}
