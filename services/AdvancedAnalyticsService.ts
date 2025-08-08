import { MoodEntry, HabitMoodEntry, Habit } from '@/types';
import { PredictiveAnalyticsService } from './PredictiveAnalyticsService';
import { WellnessIntegrationService } from './WellnessIntegrationService';

export interface DetailedCorrelationReport {
  habitId: string;
  habitTitle: string;
  correlationStrength: number;
  moodImpactScore: number;
  optimalMoodStates: string[];
  problematicMoodStates: string[];
  timePatterns: {
    bestTimes: string[];
    worstTimes: string[];
  };
  weeklyPatterns: {
    bestDays: string[];
    challengingDays: string[];
  };
  insights: string[];
  recommendations: string[];
}

export interface PredictiveMoodHabitModel {
  habitId: string;
  predictions: {
    nextWeek: {
      date: string;
      predictedMood: string;
      successProbability: number;
      confidence: number;
    }[];
  };
  riskFactors: {
    factor: string;
    impact: number;
    mitigation: string;
  }[];
  opportunityWindows: {
    timeSlot: string;
    successRate: number;
    reasoning: string;
  }[];
}

export interface PersonalizedInsight {
  id: string;
  type: 'pattern' | 'opportunity' | 'warning' | 'achievement';
  title: string;
  description: string;
  actionable: boolean;
  priority: 'low' | 'medium' | 'high';
  data: any;
  generatedAt: string;
}

export interface AdvancedPatternRecognition {
  cyclicalPatterns: {
    pattern: string;
    frequency: 'daily' | 'weekly' | 'monthly';
    strength: number;
    description: string;
  }[];
  triggerEvents: {
    trigger: string;
    effect: string;
    confidence: number;
    examples: string[];
  }[];
  habitChains: {
    sequence: string[];
    successRate: number;
    optimalTiming: string;
  }[];
  moodCascades: {
    initialMood: string;
    resultingMoods: string[];
    timeframe: string;
    interventionPoints: string[];
  }[];
}

export class AdvancedAnalyticsService {
  private static instance: AdvancedAnalyticsService;
  
  static getInstance(): AdvancedAnalyticsService {
    if (!this.instance) {
      this.instance = new AdvancedAnalyticsService();
    }
    return this.instance;
  }

  // Detailed Mood-Habit Correlation Reports
  async generateDetailedCorrelationReport(
    habits: Habit[],
    moodData: MoodEntry[],
    habitMoodData: HabitMoodEntry[]
  ): Promise<DetailedCorrelationReport[]> {
    const reports: DetailedCorrelationReport[] = [];

    for (const habit of habits) {
      const habitEntries = habitMoodData.filter(entry => entry.habitId === habit.id);
      if (habitEntries.length < 10) continue; // Need sufficient data

      const report = await this.analyzeHabitCorrelation(habit, habitEntries, moodData);
      reports.push(report);
    }

    return reports.sort((a, b) => Math.abs(b.correlationStrength) - Math.abs(a.correlationStrength));
  }

  private async analyzeHabitCorrelation(
    habit: Habit,
    habitEntries: HabitMoodEntry[],
    moodData: MoodEntry[]
  ): Promise<DetailedCorrelationReport> {
    // Analyze mood states and success rates
    const moodSuccessRates = this.calculateMoodSuccessRates(habitEntries);
    const timePatterns = this.analyzeTimePatterns(habitEntries);
    const weeklyPatterns = this.analyzeWeeklyPatterns(habitEntries);
    
    // Calculate overall correlation strength
    const correlationStrength = this.calculateAdvancedCorrelation(habitEntries, moodData);
    
    // Generate insights and recommendations
    const insights = this.generateCorrelationInsights(moodSuccessRates, timePatterns, weeklyPatterns);
    const recommendations = this.generateCorrelationRecommendations(habit, moodSuccessRates, timePatterns);

    return {
      habitId: habit.id,
      habitTitle: habit.title,
      correlationStrength,
      moodImpactScore: this.calculateMoodImpactScore(habitEntries),
      optimalMoodStates: Object.entries(moodSuccessRates)
        .filter(([_, rate]) => rate > 0.7)
        .map(([mood, _]) => mood),
      problematicMoodStates: Object.entries(moodSuccessRates)
        .filter(([_, rate]) => rate < 0.3)
        .map(([mood, _]) => mood),
      timePatterns,
      weeklyPatterns,
      insights,
      recommendations
    };
  }

  // Predictive Mood-Habit Modeling
  async generatePredictiveMoodHabitModel(
    habitId: string,
    historicalData: HabitMoodEntry[],
    moodData: MoodEntry[]
  ): Promise<PredictiveMoodHabitModel> {
    const predictiveService = PredictiveAnalyticsService.getInstance();
    const predictions = [];
    
    // Generate predictions for next 7 days
    for (let i = 1; i <= 7; i++) {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + i);
      
      const predictedMood = await this.predictMoodForDate(futureDate, moodData);
      const contextualFactors = this.getContextualFactors(futureDate);
      
      const prediction = predictiveService.predictHabitSuccess(
        habitId,
        predictedMood,
        historicalData,
        contextualFactors
      );
      
      predictions.push({
        date: futureDate.toISOString().split('T')[0],
        predictedMood: predictedMood.moodState,
        successProbability: prediction.predictedSuccessRate,
        confidence: prediction.confidence
      });
    }

    return {
      habitId,
      predictions: { nextWeek: predictions },
      riskFactors: this.identifyRiskFactors(historicalData),
      opportunityWindows: this.identifyOpportunityWindows(historicalData)
    };
  }

  // Advanced Pattern Recognition
  async performAdvancedPatternRecognition(
    habits: Habit[],
    moodData: MoodEntry[],
    habitMoodData: HabitMoodEntry[]
  ): Promise<AdvancedPatternRecognition> {
    return {
      cyclicalPatterns: this.detectCyclicalPatterns(moodData, habitMoodData),
      triggerEvents: this.identifyTriggerEvents(moodData, habitMoodData),
      habitChains: this.analyzeHabitChains(habitMoodData),
      moodCascades: this.analyzeMoodCascades(moodData)
    };
  }

  // Custom Mood-Habit Insights
  async generateCustomInsights(
    userId: string,
    habits: Habit[],
    moodData: MoodEntry[],
    habitMoodData: HabitMoodEntry[]
  ): Promise<PersonalizedInsight[]> {
    const insights: PersonalizedInsight[] = [];

    // Pattern-based insights
    const patterns = await this.performAdvancedPatternRecognition(habits, moodData, habitMoodData);
    insights.push(...this.generatePatternInsights(patterns));

    // Opportunity insights
    insights.push(...this.generateOpportunityInsights(habits, habitMoodData));

    // Warning insights
    insights.push(...this.generateWarningInsights(moodData, habitMoodData));

    // Achievement insights
    insights.push(...this.generateAchievementInsights(habits, habitMoodData));

    return insights
      .sort((a, b) => this.getPriorityScore(b.priority) - this.getPriorityScore(a.priority))
      .slice(0, 10); // Top 10 insights
  }

  // Helper methods
  private calculateMoodSuccessRates(habitEntries: HabitMoodEntry[]): Record<string, number> {
    const moodGroups = habitEntries.reduce((acc, entry) => {
      if (entry.preMood) {
        const mood = entry.preMood.moodState;
        if (!acc[mood]) acc[mood] = { completed: 0, total: 0 };
        acc[mood].total++;
        if (entry.action === 'completed') acc[mood].completed++;
      }
      return acc;
    }, {} as Record<string, { completed: number; total: number }>);

    return Object.entries(moodGroups).reduce((acc, [mood, data]) => {
      acc[mood] = data.completed / data.total;
      return acc;
    }, {} as Record<string, number>);
  }

  private analyzeTimePatterns(habitEntries: HabitMoodEntry[]) {
    const timeSuccessRates = habitEntries.reduce((acc, entry) => {
      const hour = new Date(entry.timestamp).getHours();
      const timeSlot = this.getTimeSlot(hour);
      if (!acc[timeSlot]) acc[timeSlot] = { completed: 0, total: 0 };
      acc[timeSlot].total++;
      if (entry.action === 'completed') acc[timeSlot].completed++;
      return acc;
    }, {} as Record<string, { completed: number; total: number }>);

    const sortedTimes = Object.entries(timeSuccessRates)
      .map(([time, data]) => ({ time, rate: data.completed / data.total }))
      .sort((a, b) => b.rate - a.rate);

    return {
      bestTimes: sortedTimes.slice(0, 2).map(t => t.time),
      worstTimes: sortedTimes.slice(-2).map(t => t.time)
    };
  }

  private analyzeWeeklyPatterns(habitEntries: HabitMoodEntry[]) {
    const daySuccessRates = habitEntries.reduce((acc, entry) => {
      const day = new Date(entry.timestamp).toLocaleDateString('en-US', { weekday: 'long' });
      if (!acc[day]) acc[day] = { completed: 0, total: 0 };
      acc[day].total++;
      if (entry.action === 'completed') acc[day].completed++;
      return acc;
    }, {} as Record<string, { completed: number; total: number }>);

    const sortedDays = Object.entries(daySuccessRates)
      .map(([day, data]) => ({ day, rate: data.completed / data.total }))
      .sort((a, b) => b.rate - a.rate);

    return {
      bestDays: sortedDays.slice(0, 3).map(d => d.day),
      challengingDays: sortedDays.slice(-2).map(d => d.day)
    };
  }

  private calculateAdvancedCorrelation(habitEntries: HabitMoodEntry[], moodData: MoodEntry[]): number {
    // Implementation of advanced correlation calculation
    // This would include multiple correlation methods and weighted scoring
    return 0.75; // Placeholder
  }

  private calculateMoodImpactScore(habitEntries: HabitMoodEntry[]): number {
    const entriesWithMoodChange = habitEntries.filter(entry => 
      entry.preMood && entry.postMood && entry.action === 'completed'
    );

    if (entriesWithMoodChange.length === 0) return 0;

    const totalImpact = entriesWithMoodChange.reduce((sum, entry) => {
      const moodChange = entry.postMood!.intensity - entry.preMood!.intensity;
      return sum + moodChange;
    }, 0);

    return totalImpact / entriesWithMoodChange.length;
  }

  private getTimeSlot(hour: number): string {
    if (hour < 6) return 'Early Morning';
    if (hour < 12) return 'Morning';
    if (hour < 18) return 'Afternoon';
    return 'Evening';
  }

  private generateCorrelationInsights(
    moodSuccessRates: Record<string, number>,
    timePatterns: any,
    weeklyPatterns: any
  ): string[] {
    const insights = [];
    
    // Mood-based insights
    const bestMood = Object.entries(moodSuccessRates)
      .sort(([,a], [,b]) => b - a)[0];
    if (bestMood && bestMood[1] > 0.8) {
      insights.push(`You're ${Math.round(bestMood[1] * 100)}% more successful when feeling ${bestMood[0]}`);
    }

    // Time-based insights
    if (timePatterns.bestTimes.length > 0) {
      insights.push(`Your optimal performance window is during ${timePatterns.bestTimes.join(' and ')}`);
    }

    // Weekly pattern insights
    if (weeklyPatterns.bestDays.length > 0) {
      insights.push(`You consistently perform better on ${weeklyPatterns.bestDays.slice(0, 2).join(' and ')}`);
    }

    return insights;
  }

  private generateCorrelationRecommendations(
    habit: Habit,
    moodSuccessRates: Record<string, number>,
    timePatterns: any
  ): string[] {
    const recommendations = [];
    
    // Mood-based recommendations
    const problematicMoods = Object.entries(moodSuccessRates)
      .filter(([_, rate]) => rate < 0.3)
      .map(([mood, _]) => mood);
    
    if (problematicMoods.length > 0) {
      recommendations.push(`Consider mood-boosting activities before attempting ${habit.title} when feeling ${problematicMoods.join(' or ')}`);
    }

    // Timing recommendations
    if (timePatterns.bestTimes.length > 0) {
      recommendations.push(`Schedule ${habit.title} during your peak performance times: ${timePatterns.bestTimes.join(' or ')}`);
    }

    return recommendations;
  }

  // Additional helper methods for predictive modeling and pattern recognition
  private async predictMoodForDate(date: Date, historicalMoodData: MoodEntry[]): Promise<MoodEntry> {
    // Simplified mood prediction based on historical patterns
    const dayOfWeek = date.getDay();
    const similarDays = historicalMoodData.filter(entry => {
      const entryDate = new Date(entry.date);
      return entryDate.getDay() === dayOfWeek;
    });

    if (similarDays.length === 0) {
      return {
        id: 'predicted',
        date: date.toISOString().split('T')[0],
        moodState: 'calm',
        intensity: 5,
        timestamp: date.toISOString()
      };
    }

    const avgIntensity = similarDays.reduce((sum, entry) => sum + entry.intensity, 0) / similarDays.length;
    const mostCommonMood = this.getMostCommonMood(similarDays);

    return {
      id: 'predicted',
      date: date.toISOString().split('T')[0],
      moodState: mostCommonMood as 'happy' | 'sad' | 'anxious' | 'energetic' | 'tired' | 'stressed' | 'calm',
      intensity: Math.round(avgIntensity),
      timestamp: date.toISOString()
    };
  }

  private getContextualFactors(date: Date) {
    return {
      timeOfDay: date.getHours(),
      dayOfWeek: date.getDay(),
      recentPerformance: 0.7 // This would be calculated from recent data
    };
  }

  private identifyRiskFactors(historicalData: HabitMoodEntry[]) {
    // Analyze patterns that lead to habit failure
    return [
      {
        factor: 'Low mood intensity',
        impact: 0.8,
        mitigation: 'Use mood-boosting techniques before attempting habit'
      },
      {
        factor: 'Evening timing',
        impact: 0.6,
        mitigation: 'Consider moving habit to morning or afternoon'
      }
    ];
  }

  private identifyOpportunityWindows(historicalData: HabitMoodEntry[]) {
    // Identify optimal times for habit execution
    return [
      {
        timeSlot: 'Morning (8-10 AM)',
        successRate: 0.85,
        reasoning: 'Highest energy and motivation levels'
      },
      {
        timeSlot: 'After positive mood events',
        successRate: 0.78,
        reasoning: 'Momentum from positive experiences'
      }
    ];
  }

  private detectCyclicalPatterns(moodData: MoodEntry[], habitMoodData: HabitMoodEntry[]) {
    // Detect recurring patterns in mood and habit data
    return [
      {
        pattern: 'advancedAnalytics.patterns.sampleData.weeklyMoodCycle',
        frequency: 'weekly' as const,
        strength: 0.7,
        description: 'advancedAnalytics.patterns.sampleData.weeklyMoodCycleDesc'
      }
    ];
  }

  private identifyTriggerEvents(moodData: MoodEntry[], habitMoodData: HabitMoodEntry[]) {
    // Identify events that trigger mood or habit changes
    return [
      {
        trigger: 'advancedAnalytics.patterns.sampleData.completedMorningRoutine',
        effect: 'advancedAnalytics.patterns.sampleData.improvedMoodEffect',
        confidence: 0.8,
        examples: ['advancedAnalytics.patterns.sampleData.exerciseBetterMood', 'advancedAnalytics.patterns.sampleData.meditationCalmerState']
      }
    ];
  }

  private analyzeHabitChains(habitMoodData: HabitMoodEntry[]) {
    // Analyze sequences of habits that work well together
    return [
      {
        sequence: ['advancedAnalytics.patterns.sampleData.morningMeditationExerciseBreakfast'],
        successRate: 0.9,
        optimalTiming: 'advancedAnalytics.patterns.sampleData.within2Hours'
      }
    ];
  }

  private analyzeMoodCascades(moodData: MoodEntry[]) {
    // Analyze how moods cascade and change over time
    return [
      {
        initialMood: 'advancedAnalytics.patterns.sampleData.stressedCascade',
        resultingMoods: ['advancedAnalytics.patterns.sampleData.anxiousTiredOverwhelmed'],
        timeframe: 'advancedAnalytics.patterns.sampleData.twoToFourHours',
        interventionPoints: ['advancedAnalytics.patterns.sampleData.deepBreathing', 'advancedAnalytics.patterns.sampleData.shortWalk', 'advancedAnalytics.patterns.sampleData.mindfulness']
      }
    ];
  }

  private generatePatternInsights(patterns: AdvancedPatternRecognition): PersonalizedInsight[] {
    return patterns.cyclicalPatterns.map(pattern => ({
      id: `pattern-${Date.now()}-${Math.random()}`,
      type: 'pattern' as const,
      title: 'advancedAnalytics.patterns.sampleData.patternDetected',
      description: pattern.description,
      actionable: true,
      priority: pattern.strength > 0.7 ? 'high' as const : 'medium' as const,
      data: pattern,
      generatedAt: new Date().toISOString()
    }));
  }

  private generateOpportunityInsights(habits: Habit[], habitMoodData: HabitMoodEntry[]): PersonalizedInsight[] {
    // Generate insights about opportunities for improvement
    return [];
  }

  private generateWarningInsights(moodData: MoodEntry[], habitMoodData: HabitMoodEntry[]): PersonalizedInsight[] {
    // Generate warning insights about potential issues
    return [];
  }

  private generateAchievementInsights(habits: Habit[], habitMoodData: HabitMoodEntry[]): PersonalizedInsight[] {
    // Generate insights about achievements and progress
    return [];
  }

  private getPriorityScore(priority: string): number {
    switch (priority) {
      case 'high': return 3;
      case 'medium': return 2;
      case 'low': return 1;
      default: return 0;
    }
  }

  private getMostCommonMood(moodEntries: MoodEntry[]): 'happy' | 'sad' | 'anxious' | 'energetic' | 'tired' | 'stressed' | 'calm' {
    const moodCounts = moodEntries.reduce((acc, entry) => {
      acc[entry.moodState] = (acc[entry.moodState] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  
    const mostCommon = Object.entries(moodCounts)
      .sort(([,a], [,b]) => b - a)[0]?.[0];
    
    // Fallback to 'calm' if no mood found or invalid mood
    const validMoods: ('happy' | 'sad' | 'anxious' | 'energetic' | 'tired' | 'stressed' | 'calm')[] = 
      ['happy', 'sad', 'anxious', 'energetic', 'tired', 'stressed', 'calm'];
    
    return validMoods.includes(mostCommon as any) ? 
      mostCommon as 'happy' | 'sad' | 'anxious' | 'energetic' | 'tired' | 'stressed' | 'calm' : 
      'calm';
  }
}