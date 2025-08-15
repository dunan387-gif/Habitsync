import AsyncStorage from '@react-native-async-storage/async-storage';
import { MoodEntry, HabitMoodEntry, Habit } from '@/types';
import { WellnessIntegrationService } from './WellnessIntegrationService';

export interface MoodForecast {
  date: string;
  predictedMood: string;
  confidence: number;
  factors: PredictionFactor[];
  trend: 'improving' | 'declining' | 'stable';
  riskLevel: 'low' | 'medium' | 'high';
}

export interface PredictionFactor {
  name: string;
  impact: number; // -1 to 1, negative = negative impact, positive = positive impact
  confidence: number;
  description: string;
}

export interface SuccessPrediction {
  habitId: string;
  habitTitle: string;
  successProbability: number;
  confidence: number;
  recommendations: string[];
  optimalTime?: string;
  riskFactors: string[];
  opportunityFactors: string[];
}

export interface RiskAlert {
  id: string;
  type: 'habit_failure' | 'mood_dip' | 'streak_risk' | 'wellness_decline';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  suggestions: string[];
  predictedImpact: number; // 1-10 scale
  timeframe: 'immediate' | 'today' | 'this_week';
  createdAt: string;
}

export interface TimingSuggestion {
  habitId: string;
  habitTitle: string;
  optimalTimes: {
    time: string; // HH:MM format
    successProbability: number;
    reasoning: string;
  }[];
  avoidTimes: {
    time: string;
    riskLevel: 'low' | 'medium' | 'high';
    reasoning: string;
  }[];
  dailyPattern: {
    morning: number; // 0-1 success probability
    afternoon: number;
    evening: number;
    night: number;
  };
}

export interface PredictionContext {
  currentMood?: {
    moodState: string;
    intensity: number;
  };
  timeOfDay?: string;
  dayOfWeek?: number;
  recentCompletions?: number;
  currentStreak?: number;
  weather?: {
    condition: string;
    temperature: number;
  };
  sleepQuality?: number;
  stressLevel?: number;
}

class PredictiveAnalyticsService {
  private static instance: PredictiveAnalyticsService;
  private userId: string | null = null;
  private modelCache: Map<string, any> = new Map();
  
  static getInstance(): PredictiveAnalyticsService {
    if (!PredictiveAnalyticsService.instance) {
      PredictiveAnalyticsService.instance = new PredictiveAnalyticsService();
    }
    return PredictiveAnalyticsService.instance;
  }

  setUserId(userId: string) {
    this.userId = userId;
  }

  private getStorageKey(key: string): string {
    return this.userId ? `predictive_analytics_${this.userId}_${key}` : `predictive_analytics_${key}`;
  }

  // Mood Forecasting Algorithm
  async predictMoodForecast(userId: string, days: number = 7): Promise<MoodForecast[]> {
    try {
      const moodData = await this.getMoodData(userId);
      const wellnessData = await this.getWellnessData(userId);
      
      if (moodData.length < 7) {
        return this.generateDefaultForecast(days);
      }

      const forecasts: MoodForecast[] = [];
      const currentDate = new Date();

      for (let i = 1; i <= days; i++) {
        const targetDate = new Date(currentDate);
        targetDate.setDate(targetDate.getDate() + i);

        const forecast = await this.generateMoodForecast(targetDate, moodData, wellnessData);
        forecasts.push(forecast);
      }

      return forecasts;
    } catch (error) {
      console.error('Error predicting mood forecast:', error);
      return this.generateDefaultForecast(days);
    }
  }

  // Habit Success Prediction
  async predictHabitSuccess(
    habitId: string, 
    context: PredictionContext = {}
  ): Promise<SuccessPrediction> {
    try {
      const habitData = await this.getHabitData(habitId);
      const moodData = await this.getMoodData(this.userId || '');
      
      if (!habitData || moodData.length === 0) {
        return this.generateDefaultSuccessPrediction(habitId);
      }

      const successProbability = this.calculateSuccessProbability(habitData, context);
      const confidence = this.calculateConfidence(habitData, moodData);
      const recommendations = this.generateRecommendations(habitData, context);
      const riskFactors = this.identifyRiskFactors(habitData, context);
      const opportunityFactors = this.identifyOpportunityFactors(habitData, context);
    
    return {
      habitId,
        habitTitle: (habitData as Habit).title || 'Unknown Habit',
        successProbability,
        confidence,
        recommendations,
        optimalTime: this.suggestOptimalTime(habitData, context),
        riskFactors,
        opportunityFactors
      };
    } catch (error) {
      console.error('Error predicting habit success:', error);
      return this.generateDefaultSuccessPrediction(habitId);
    }
  }

  // Risk Alert System
  async generateRiskAlerts(userId: string): Promise<RiskAlert[]> {
    try {
      const alerts: RiskAlert[] = [];
      const moodData = await this.getMoodData(userId);
      const habitData = await this.getHabitData();
      const wellnessData = await this.getWellnessData(userId);

      // Mood dip detection
      const moodAlerts = this.detectMoodDips(moodData);
      alerts.push(...moodAlerts);

      // Habit failure risk
      const habitAlerts = this.detectHabitFailureRisk(habitData, moodData);
      alerts.push(...habitAlerts);

      // Streak risk detection
      const streakAlerts = this.detectStreakRisk(habitData);
      alerts.push(...streakAlerts);

      // Wellness decline detection
      const wellnessAlerts = this.detectWellnessDecline(wellnessData);
      alerts.push(...wellnessAlerts);

      return alerts.sort((a, b) => this.getSeverityScore(b.severity) - this.getSeverityScore(a.severity));
    } catch (error) {
      console.error('Error generating risk alerts:', error);
      return [];
    }
  }

  // Optimal Timing Suggestions
  async suggestOptimalTiming(habitId: string): Promise<TimingSuggestion> {
    try {
      const habitData = await this.getHabitData(habitId);
      const moodData = await this.getMoodData(this.userId || '');
      
      if (!habitData) {
        return this.generateDefaultTimingSuggestion(habitId);
      }

      const optimalTimes = this.analyzeOptimalTimes(habitData, moodData);
      const avoidTimes = this.analyzeAvoidTimes(habitData, moodData);
      const dailyPattern = this.analyzeDailyPattern(habitData, moodData);

    return {
      habitId,
        habitTitle: (habitData as Habit).title || 'Unknown Habit',
        optimalTimes,
        avoidTimes,
        dailyPattern
      };
    } catch (error) {
      console.error('Error suggesting optimal timing:', error);
      return this.generateDefaultTimingSuggestion(habitId);
    }
  }

  // Private helper methods
  private async getMoodData(userId: string): Promise<MoodEntry[]> {
    try {
      const storageKey = this.getStorageKey('mood_data');
      const data = await AsyncStorage.getItem(storageKey);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error getting mood data:', error);
      return [];
    }
  }

  private async getHabitData(habitId?: string): Promise<Habit | Habit[] | null> {
    try {
      const storageKey = this.getStorageKey('habit_data');
      const data = await AsyncStorage.getItem(storageKey);
      const habits = data ? JSON.parse(data) : [];
      
      if (habitId) {
        return habits.find((h: Habit) => h.id === habitId) || null;
      }
      return habits;
    } catch (error) {
      console.error('Error getting habit data:', error);
      return habitId ? null : [];
    }
  }

  private async getWellnessData(userId: string): Promise<any> {
    try {
      return await WellnessIntegrationService.performComprehensiveWellnessAnalysis('30d');
    } catch (error) {
      console.error('Error getting wellness data:', error);
      return {};
    }
  }

  private async generateMoodForecast(
    targetDate: Date, 
    moodData: MoodEntry[], 
    wellnessData: any
  ): Promise<MoodForecast> {
    // Simple linear regression for mood prediction
    const recentMoods = moodData.slice(-7).map(entry => entry.intensity);
    const trend = this.calculateTrend(recentMoods);
    
    const baseMood = recentMoods.length > 0 ? recentMoods[recentMoods.length - 1] : 5;
    const predictedMood = Math.max(1, Math.min(10, baseMood + trend * 0.1));
    
    const factors: PredictionFactor[] = [
      {
        name: 'Recent Mood Trend',
        impact: trend,
        confidence: 0.7,
        description: `Mood has been ${trend > 0 ? 'improving' : trend < 0 ? 'declining' : 'stable'} recently`
      }
    ];

    return {
      date: targetDate.toISOString().split('T')[0],
      predictedMood: this.getMoodStateFromIntensity(predictedMood),
      confidence: 0.6,
      factors,
      trend: trend > 0.1 ? 'improving' : trend < -0.1 ? 'declining' : 'stable',
      riskLevel: predictedMood < 4 ? 'high' : predictedMood < 6 ? 'medium' : 'low'
    };
  }

  private calculateSuccessProbability(habitData: Habit | Habit[] | null, context: PredictionContext): number {
    let probability = 0.5; // Base probability

    // Mood factor
    if (context.currentMood) {
      const moodImpact = (context.currentMood.intensity - 5) / 5; // -1 to 1
      probability += moodImpact * 0.2;
    }

    // Time of day factor
    if (context.timeOfDay) {
      const hour = parseInt(context.timeOfDay.split(':')[0]);
      const timeFactor = this.getTimeOfDayFactor(hour);
      probability += timeFactor * 0.15;
    }

    // Streak factor
    if (context.currentStreak) {
      const streakFactor = Math.min(context.currentStreak / 10, 1);
      probability += streakFactor * 0.1;
    }

    // Recent completions factor
    if (context.recentCompletions) {
      const completionFactor = Math.min(context.recentCompletions / 5, 1);
      probability += completionFactor * 0.1;
    }

    return Math.max(0, Math.min(1, probability));
  }

  private calculateConfidence(habitData: Habit | Habit[] | null, moodData: MoodEntry[]): number {
    const dataPoints = moodData.length + ((habitData as Habit)?.completedDates?.length || 0);
    return Math.min(dataPoints / 50, 1); // Max confidence at 50 data points
  }

  private generateRecommendations(habitData: Habit | Habit[] | null, context: PredictionContext): string[] {
    const recommendations: string[] = [];

    if (context.currentMood && context.currentMood.intensity < 4) {
      recommendations.push('Consider a lighter version of this habit given your current mood');
    }

    if (context.currentStreak && context.currentStreak > 5) {
      recommendations.push('Great streak! Keep up the momentum');
    }

    if (context.timeOfDay) {
      const hour = parseInt(context.timeOfDay.split(':')[0]);
      if (hour < 8 || hour > 22) {
        recommendations.push('Consider scheduling this habit during your peak energy hours');
      }
    }

    return recommendations;
  }

  private identifyRiskFactors(habitData: Habit | Habit[] | null, context: PredictionContext): string[] {
    const riskFactors: string[] = [];

    if (context.currentMood && context.currentMood.intensity < 3) {
      riskFactors.push('Low mood may affect motivation');
    }

    if (context.currentStreak && context.currentStreak === 0) {
      riskFactors.push('No current streak - may need extra motivation');
    }

    return riskFactors;
  }

  private identifyOpportunityFactors(habitData: Habit | Habit[] | null, context: PredictionContext): string[] {
    const opportunities: string[] = [];

    if (context.currentMood && context.currentMood.intensity > 7) {
      opportunities.push('High energy - great time for challenging habits');
    }

    if (context.currentStreak && context.currentStreak > 3) {
      opportunities.push('Strong momentum - capitalize on your streak');
    }

    return opportunities;
  }

  private suggestOptimalTime(habitData: Habit | Habit[] | null, context: PredictionContext): string | undefined {
    // Simple heuristic based on habit type and user patterns
    const completionTimes = (habitData as Habit)?.completionTimes || [];
    
    if (completionTimes.length > 0) {
      // Return the most common completion time
      const timeCounts = completionTimes.reduce((acc: any, time: string) => {
        acc[time] = (acc[time] || 0) + 1;
        return acc;
      }, {});
      
      const optimalTime = Object.keys(timeCounts).reduce((a, b) => 
        timeCounts[a] > timeCounts[b] ? a : b
      );
      
      return optimalTime;
    }

    return undefined;
  }

  private detectMoodDips(moodData: MoodEntry[]): RiskAlert[] {
    const alerts: RiskAlert[] = [];
    const recentMoods = moodData.slice(-3);

    if (recentMoods.length >= 3) {
      const avgMood = recentMoods.reduce((sum, entry) => sum + entry.intensity, 0) / recentMoods.length;
      
      if (avgMood < 4) {
        alerts.push({
          id: `mood_dip_${Date.now()}`,
          type: 'mood_dip',
          severity: avgMood < 2 ? 'high' : 'medium',
          message: 'Your mood has been consistently low recently',
          suggestions: [
            'Consider light exercise or meditation',
            'Reach out to friends or family',
            'Try a mood-boosting activity'
          ],
          predictedImpact: 10 - avgMood,
          timeframe: 'immediate',
          createdAt: new Date().toISOString()
        });
      }
    }

    return alerts;
  }

  private detectHabitFailureRisk(habitData: Habit | Habit[] | null, moodData: MoodEntry[]): RiskAlert[] {
    const alerts: RiskAlert[] = [];
    
    if (Array.isArray(habitData)) {
      habitData.forEach((habit: Habit) => {
        if (habit.streak === 0 && habit.completedDates?.length === 0) {
          alerts.push({
            id: `habit_failure_${habit.id}`,
            type: 'habit_failure',
            severity: 'medium',
            message: `${habit.title} hasn't been started yet`,
            suggestions: [
              'Start with a smaller, more manageable version',
              'Set a specific time for this habit',
              'Find an accountability partner'
            ],
            predictedImpact: 5,
            timeframe: 'today',
            createdAt: new Date().toISOString()
          });
        }
      });
    }

    return alerts;
  }

  private detectStreakRisk(habitData: Habit | Habit[] | null): RiskAlert[] {
    const alerts: RiskAlert[] = [];
    
    if (Array.isArray(habitData)) {
      habitData.forEach((habit: Habit) => {
        if (habit.streak > 0 && !habit.completedToday) {
          alerts.push({
            id: `streak_risk_${habit.id}`,
            type: 'streak_risk',
            severity: habit.streak > 7 ? 'high' : 'medium',
            message: `Your ${habit.streak}-day streak for ${habit.title} is at risk`,
            suggestions: [
              'Complete the habit now to maintain your streak',
              'Set a reminder for later today',
              'Consider a quick version if time is limited'
            ],
            predictedImpact: habit.streak,
            timeframe: 'today',
            createdAt: new Date().toISOString()
          });
        }
      });
    }

    return alerts;
  }

  private detectWellnessDecline(wellnessData: any): RiskAlert[] {
    const alerts: RiskAlert[] = [];
    
    // Add wellness decline detection logic here
    // This would analyze sleep, exercise, nutrition, and other wellness metrics
    
    return alerts;
  }

  private analyzeOptimalTimes(habitData: Habit | Habit[] | null, moodData: MoodEntry[]): TimingSuggestion['optimalTimes'] {
    const completionTimes = (habitData as Habit)?.completionTimes || [];
    const optimalTimes: TimingSuggestion['optimalTimes'] = [];

    if (completionTimes.length > 0) {
      // Group completion times by hour and calculate success rates
      const timeGroups = completionTimes.reduce((acc: any, time: string) => {
        const hour = parseInt(time.split(':')[0]);
        if (!acc[hour]) acc[hour] = [];
        acc[hour].push(time);
        return acc;
      }, {});

      Object.entries(timeGroups).forEach(([hour, times]) => {
        const successRate = (times as string[]).length / completionTimes.length;
        if (successRate > 0.1) { // Only include times with >10% success rate
          optimalTimes.push({
            time: `${hour.padStart(2, '0')}:00`,
            successProbability: successRate,
            reasoning: `Historically successful at ${hour}:00`
          });
        }
      });
    }

    return optimalTimes;
  }

  private analyzeAvoidTimes(habitData: Habit | Habit[] | null, moodData: MoodEntry[]): TimingSuggestion['avoidTimes'] {
    const avoidTimes: TimingSuggestion['avoidTimes'] = [];
    
    // Add logic to identify times to avoid based on historical data
    // This would analyze when habits are most likely to fail
    
    return avoidTimes;
  }

  private analyzeDailyPattern(habitData: Habit | Habit[] | null, moodData: MoodEntry[]): TimingSuggestion['dailyPattern'] {
    return {
      morning: 0.6,
      afternoon: 0.7,
      evening: 0.5,
      night: 0.3
    };
  }

  private calculateTrend(values: number[]): number {
    if (values.length < 2) return 0;
    
    const n = values.length;
    const sumX = (n * (n - 1)) / 2;
    const sumY = values.reduce((sum, val) => sum + val, 0);
    const sumXY = values.reduce((sum, val, i) => sum + (i * val), 0);
    const sumX2 = values.reduce((sum, _, i) => sum + (i * i), 0);
    
    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    return slope;
  }

  private getMoodStateFromIntensity(intensity: number): string {
    if (intensity >= 8) return 'happy';
    if (intensity >= 6) return 'calm';
    if (intensity >= 4) return 'neutral';
    if (intensity >= 2) return 'sad';
    return 'anxious';
  }

  private getTimeOfDayFactor(hour: number): number {
    // Peak energy hours: 9-11 AM and 2-4 PM
    if (hour >= 9 && hour <= 11) return 0.3;
    if (hour >= 14 && hour <= 16) return 0.2;
    if (hour >= 7 && hour <= 8) return 0.1;
    if (hour >= 12 && hour <= 13) return 0.0;
    if (hour >= 17 && hour <= 19) return -0.1;
    return -0.2; // Late night/early morning
  }

  private getSeverityScore(severity: string): number {
    switch (severity) {
      case 'critical': return 4;
      case 'high': return 3;
      case 'medium': return 2;
      case 'low': return 1;
      default: return 0;
    }
  }

  private generateDefaultForecast(days: number): MoodForecast[] {
    const forecasts: MoodForecast[] = [];
    const currentDate = new Date();

    for (let i = 1; i <= days; i++) {
      const targetDate = new Date(currentDate);
      targetDate.setDate(targetDate.getDate() + i);

      forecasts.push({
        date: targetDate.toISOString().split('T')[0],
        predictedMood: 'neutral',
        confidence: 0.3,
        factors: [],
        trend: 'stable',
        riskLevel: 'low'
      });
    }

    return forecasts;
  }

  private generateDefaultSuccessPrediction(habitId: string): SuccessPrediction {
    return {
      habitId,
      habitTitle: 'Unknown Habit',
      successProbability: 0.5,
      confidence: 0.3,
      recommendations: ['Start with small, manageable steps'],
      riskFactors: ['Insufficient data for accurate prediction'],
      opportunityFactors: []
    };
  }

  private generateDefaultTimingSuggestion(habitId: string): TimingSuggestion {
    return {
      habitId,
      habitTitle: 'Unknown Habit',
      optimalTimes: [],
      avoidTimes: [],
      dailyPattern: {
        morning: 0.5,
        afternoon: 0.5,
        evening: 0.5,
        night: 0.5
      }
    };
  }
}

export default PredictiveAnalyticsService;