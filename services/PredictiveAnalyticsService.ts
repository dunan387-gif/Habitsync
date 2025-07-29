import { MoodEntry, HabitMoodEntry, HabitSuccessPrediction } from '../types';

export class PredictiveAnalyticsService {
  private static instance: PredictiveAnalyticsService;
  
  static getInstance(): PredictiveAnalyticsService {
    if (!this.instance) {
      this.instance = new PredictiveAnalyticsService();
    }
    return this.instance;
  }
  
  // Machine learning-inspired prediction algorithm
  predictHabitSuccess(
    habitId: string,
    currentMood: MoodEntry,
    historicalData: HabitMoodEntry[],
    contextualFactors: {
      timeOfDay: number;
      dayOfWeek: number;
      weather?: string;
      recentPerformance: number;
    }
  ): HabitSuccessPrediction {
    const habitData = historicalData.filter(entry => entry.habitId === habitId);
    
    if (habitData.length < 10) {
      return this.generateLowConfidencePrediction(habitId, currentMood);
    }
    
    // Feature extraction
    const features = this.extractFeatures(habitData, currentMood, contextualFactors);
    
    // Weighted scoring algorithm
    const weights = {
      moodAlignment: 0.35,
      timeOptimality: 0.25,
      recentPattern: 0.20,
      streakMomentum: 0.15,
      contextual: 0.05
    };
    
    const scores = {
      moodAlignment: this.calculateMoodAlignment(currentMood, habitData),
      timeOptimality: this.calculateTimeOptimality(contextualFactors.timeOfDay, habitData),
      recentPattern: this.calculateRecentPattern(habitData),
      streakMomentum: this.calculateStreakMomentum(habitData),
      contextual: this.calculateContextualScore(contextualFactors, habitData)
    };
    
    const predictedSuccessRate = Object.entries(weights).reduce(
      (sum, [factor, weight]) => sum + (scores[factor as keyof typeof scores] * weight),
      0
    );
    
    return {
      habitId,
      habitTitle: '', // Get from habit data
      currentMood: currentMood.moodState,
      currentMoodIntensity: currentMood.intensity,
      predictedSuccessRate,
      confidence: this.calculateConfidence(habitData.length, scores),
      factors: {
        moodAlignment: scores.moodAlignment,
        timeOfDay: scores.timeOptimality,
        recentPattern: scores.recentPattern,
        streakMomentum: scores.streakMomentum
      },
      recommendation: this.generateRecommendation(predictedSuccessRate, scores),
      reasoning: this.generateReasoning(scores, predictedSuccessRate)
    };
  }
  
  private calculateMoodAlignment(currentMood: MoodEntry, habitData: HabitMoodEntry[]): number {
    const successfulEntries = habitData.filter(entry => 
      entry.action === 'completed' && entry.preMood
    );
    
    if (successfulEntries.length === 0) return 0.5;
    
    const moodMatches = successfulEntries.filter(entry => 
      entry.preMood!.moodState === currentMood.moodState
    );
    
    const baseAlignment = moodMatches.length / successfulEntries.length;
    
    // Adjust for intensity similarity
    const intensityAlignment = moodMatches.reduce((sum, entry) => {
      const intensityDiff = Math.abs(entry.preMood!.intensity - currentMood.intensity);
      return sum + (1 - intensityDiff / 10);
    }, 0) / Math.max(moodMatches.length, 1);
    
    return (baseAlignment + intensityAlignment) / 2;
  }

  private generateLowConfidencePrediction(habitId: string, currentMood: MoodEntry): HabitSuccessPrediction {
    return {
      habitId,
      habitTitle: '',
      currentMood: currentMood.moodState,
      currentMoodIntensity: currentMood.intensity,
      predictedSuccessRate: 0.5,
      confidence: 0.3,
      factors: {
        moodAlignment: 0.5,
        timeOfDay: 0.5,
        recentPattern: 0.5,
        streakMomentum: 0.5
      },
      recommendation: 'proceed',
      reasoning: 'Insufficient historical data for accurate prediction. Proceed with caution.'
    };
  }

  private extractFeatures(
    habitData: HabitMoodEntry[], 
    currentMood: MoodEntry, 
    contextualFactors: any
  ): any {
    return {
      moodState: currentMood.moodState,
      intensity: currentMood.intensity,
      timeOfDay: contextualFactors.timeOfDay,
      dayOfWeek: contextualFactors.dayOfWeek,
      recentPerformance: contextualFactors.recentPerformance
    };
  }

  private calculateTimeOptimality(timeOfDay: number, habitData: HabitMoodEntry[]): number {
    const completedEntries = habitData.filter(entry => entry.action === 'completed');
    if (completedEntries.length === 0) return 0.5;

    const timeScores = completedEntries.map(entry => {
      const entryHour = new Date(entry.timestamp).getHours();
      const timeDiff = Math.abs(entryHour - timeOfDay);
      return Math.max(0, 1 - timeDiff / 12); // 12-hour window
    });

    return timeScores.reduce((sum, score) => sum + score, 0) / timeScores.length;
  }

  private calculateRecentPattern(habitData: HabitMoodEntry[]): number {
    const recentEntries = habitData
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 7); // Last 7 entries

    if (recentEntries.length === 0) return 0.5;

    const completionRate = recentEntries.filter(entry => entry.action === 'completed').length / recentEntries.length;
    return completionRate;
  }

  private calculateStreakMomentum(habitData: HabitMoodEntry[]): number {
    const sortedEntries = habitData
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    let currentStreak = 0;
    for (const entry of sortedEntries) {
      if (entry.action === 'completed') {
        currentStreak++;
      } else {
        break;
      }
    }

    // Normalize streak momentum (diminishing returns after 30 days)
    return Math.min(currentStreak / 30, 1);
  }

  private calculateContextualScore(contextualFactors: any, habitData: HabitMoodEntry[]): number {
    // Simple contextual scoring based on day of week patterns
    const dayEntries = habitData.filter(entry => {
      const entryDay = new Date(entry.timestamp).getDay();
      return entryDay === contextualFactors.dayOfWeek;
    });

    if (dayEntries.length === 0) return 0.5;

    const dayCompletionRate = dayEntries.filter(entry => entry.action === 'completed').length / dayEntries.length;
    return dayCompletionRate;
  }

  private calculateConfidence(dataPoints: number, scores: any): number {
    const dataConfidence = Math.min(dataPoints / 50, 1); // More data = higher confidence
    const scoreVariance = this.calculateScoreVariance(scores);
    const varianceConfidence = 1 - scoreVariance; // Lower variance = higher confidence
    
    return (dataConfidence + varianceConfidence) / 2;
  }

  private calculateScoreVariance(scores: any): number {
    const values = Object.values(scores) as number[];
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
    return Math.sqrt(variance);
  }

  private generateRecommendation(predictedSuccessRate: number, scores: any): 'proceed' | 'wait' | 'modify_approach' {
    if (predictedSuccessRate >= 0.7) return 'proceed';
    if (predictedSuccessRate >= 0.4) return 'modify_approach';
    return 'wait';
  }

  private generateReasoning(scores: any, predictedSuccessRate: number): string {
    const factors = [];
    
    if (scores.moodAlignment > 0.7) factors.push('current mood aligns well with success patterns');
    else if (scores.moodAlignment < 0.3) factors.push('current mood may hinder success');
    
    if (scores.timeOptimality > 0.7) factors.push('timing is optimal based on history');
    else if (scores.timeOptimality < 0.3) factors.push('timing may not be ideal');
    
    if (scores.recentPattern > 0.7) factors.push('recent performance is strong');
    else if (scores.recentPattern < 0.3) factors.push('recent performance shows struggles');
    
    if (factors.length === 0) factors.push('mixed indicators from historical data');
    
    return `Prediction based on: ${factors.join(', ')}. Success probability: ${Math.round(predictedSuccessRate * 100)}%`;
  }
}