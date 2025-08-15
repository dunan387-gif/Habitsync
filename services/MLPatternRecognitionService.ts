import AsyncStorage from '@react-native-async-storage/async-storage';
import { Habit, HabitMoodEntry, MoodEntry } from '@/types';

// ML Pattern Recognition Service for Advanced Notification Intelligence

export interface UserBehaviorPattern {
  id: string;
  userId: string;
  patternType: 'notification_response' | 'habit_completion' | 'mood_correlation' | 'timing_preference';
  features: {
    timeOfDay: number; // 0-23 hours
    dayOfWeek: number; // 0-6
    moodState: string;
    moodIntensity: number;
    habitCategory?: string;
    notificationType: string;
    responseType: 'opened' | 'dismissed' | 'completed' | 'ignored';
    responseTime: number; // seconds to respond
    completionRate: number; // 0-1
  };
  confidence: number; // 0-1
  lastUpdated: string;
  usageCount: number;
}

export interface MLPrediction {
  shouldSendNotification: boolean;
  optimalTime: string; // HH:MM format
  notificationType: 'reminder' | 'encouragement' | 'celebration' | 'check_in';
  messageTone: 'energetic' | 'calm' | 'supportive' | 'celebratory';
  urgency: 'low' | 'medium' | 'high';
  confidence: number;
  reasoning: string[];
}

export interface MLModelMetrics {
  accuracy: number;
  precision: number;
  recall: number;
  f1Score: number;
  lastTrained: string;
  trainingSamples: number;
  predictionCount: number;
}

class MLPatternRecognitionService {
  private patterns: UserBehaviorPattern[] = [];
  private modelMetrics: MLModelMetrics = {
    accuracy: 0,
    precision: 0,
    recall: 0,
    f1Score: 0,
    lastTrained: new Date().toISOString(),
    trainingSamples: 0,
    predictionCount: 0
  };

  // Initialize the ML service
  async initialize(): Promise<void> {
    try {
      await this.loadPatterns();
      await this.loadModelMetrics();

    } catch (error) {
      console.error('❌ Failed to initialize ML service:', error);
    }
  }

  // Data Collection: Gather user interaction data
  async recordUserInteraction(
    interaction: {
      habitId: string;
      notificationType: string;
      responseType: 'opened' | 'dismissed' | 'completed' | 'ignored';
      responseTime: number;
      moodState: string;
      moodIntensity: number;
      timeOfDay: number;
      dayOfWeek: number;
    }
  ): Promise<void> {
    try {
      const pattern: UserBehaviorPattern = {
        id: `pattern_${Date.now()}`,
        userId: 'current_user', // In real app, get from auth
        patternType: 'notification_response',
        features: {
          timeOfDay: interaction.timeOfDay,
          dayOfWeek: interaction.dayOfWeek,
          moodState: interaction.moodState,
          moodIntensity: interaction.moodIntensity,
          notificationType: interaction.notificationType,
          responseType: interaction.responseType,
          responseTime: interaction.responseTime,
          completionRate: interaction.responseType === 'completed' ? 1 : 0
        },
        confidence: 1.0,
        lastUpdated: new Date().toISOString(),
        usageCount: 1
      };

      this.patterns.push(pattern);
      await this.savePatterns();
      await this.updateModelMetrics();
      

    } catch (error) {
      console.error('❌ Failed to record user interaction:', error);
    }
  }

  // Main prediction function using ML patterns
  async predictOptimalNotification(
    habits: Habit[],
    moodEntries: MoodEntry[],
    habitMoodEntries: HabitMoodEntry[]
  ): Promise<MLPrediction> {
    try {
      const features = this.extractFeatures(habits, moodEntries, habitMoodEntries);
      const clustering = this.performPatternClustering();
      
      // Analyze patterns to make predictions
      const prediction = this.analyzePatternsForPrediction(features, clustering);
      
      // Update metrics
      this.modelMetrics.predictionCount++;
      await this.saveModelMetrics();
      
      return prediction;
      
    } catch (error) {
      console.error('❌ ML prediction failed:', error);
      return this.getDefaultPrediction();
    }
  }

  // Feature Extraction: Extract meaningful features from user data
  private extractFeatures(
    habits: Habit[],
    moodEntries: MoodEntry[],
    habitMoodEntries: HabitMoodEntry[]
  ): any {
    const now = new Date();
    const currentHour = now.getHours();
    const currentDay = now.getDay();

    // Time-based features
    const timeFeatures = {
      hourOfDay: currentHour,
      dayOfWeek: currentDay,
      isWeekend: currentDay === 0 || currentDay === 6,
      isMorning: currentHour >= 6 && currentHour < 12,
      isAfternoon: currentHour >= 12 && currentHour < 18,
      isEvening: currentHour >= 18 && currentHour < 22,
      isNight: currentHour >= 22 || currentHour < 6
    };

    // Mood-based features
    const currentMood = moodEntries[moodEntries.length - 1];
    const moodFeatures = {
      currentMoodState: currentMood?.moodState || 'neutral',
      currentMoodIntensity: currentMood?.intensity || 5,
      moodTrend: this.calculateMoodTrend(moodEntries),
      moodStability: this.calculateMoodStability(moodEntries)
    };

    // Habit-based features
    const habitFeatures = {
      totalHabits: habits.length,
      completedToday: habits.filter(h => h.completedToday).length,
      pendingHabits: habits.filter(h => !h.completedToday).length,
      averageStreak: habits.reduce((sum, h) => sum + h.streak, 0) / habits.length,
      completionRate: this.calculateCompletionRate(habits),
      habitCategories: this.extractHabitCategories(habits)
    };

    return {
      ...timeFeatures,
      ...moodFeatures,
      ...habitFeatures
    };
  }

  // Simple k-means clustering implementation
  private performPatternClustering(): any {
    if (this.patterns.length < 10) {
      return { clusters: [], centroids: [], clusterLabels: [] };
    }

    const k = Math.min(3, Math.floor(this.patterns.length / 10));
    const clusters = this.simpleKMeansClustering(k);
    
    return {
      clusters,
      centroids: this.calculateClusterCentroids(clusters),
      clusterLabels: this.labelClusters(clusters)
    };
  }

  private simpleKMeansClustering(k: number): UserBehaviorPattern[][] {
    const features = this.patterns.map(p => [
      p.features.timeOfDay,
      p.features.moodIntensity,
      p.features.completionRate
    ]);

    // Initialize centroids randomly
    let centroids: number[][] = [];
    for (let i = 0; i < k; i++) {
      const randomIndex = Math.floor(Math.random() * features.length);
      centroids.push([...features[randomIndex]]);
    }

    let clusters: UserBehaviorPattern[][] = Array(k).fill(null).map(() => []);
    let iterations = 0;
    const maxIterations = 50;

    while (iterations < maxIterations) {
      // Clear clusters
      clusters = Array(k).fill(null).map(() => []);

      // Assign points to nearest centroid
      features.forEach((feature, index) => {
        let minDistance = Infinity;
        let nearestCluster = 0;

        centroids.forEach((centroid, clusterIndex) => {
          const distance = this.calculateEuclideanDistance(feature, centroid);
          if (distance < minDistance) {
            minDistance = distance;
            nearestCluster = clusterIndex;
          }
        });

        clusters[nearestCluster].push(this.patterns[index]);
      });

      // Update centroids
      const newCentroids = clusters.map(cluster => {
        if (cluster.length === 0) return centroids[0];
        
        const avgFeatures = cluster.reduce((sum, pattern) => {
          return [
            sum[0] + pattern.features.timeOfDay,
            sum[1] + pattern.features.moodIntensity,
            sum[2] + pattern.features.completionRate
          ];
        }, [0, 0, 0]).map(val => val / cluster.length);

        return avgFeatures;
      });

      // Check convergence
      const centroidChanged = newCentroids.some((newCentroid, i) => {
        return this.calculateEuclideanDistance(newCentroid, centroids[i]) > 0.01;
      });

      if (!centroidChanged) break;
      centroids = newCentroids;
      iterations++;
    }

    return clusters;
  }

  // Calculate Euclidean distance between two points
  private calculateEuclideanDistance(point1: number[], point2: number[]): number {
    return Math.sqrt(
      point1.reduce((sum, val, i) => sum + Math.pow(val - point2[i], 2), 0)
    );
  }

  // Calculate cluster centroids
  private calculateClusterCentroids(clusters: any[][]): any[] {
    return clusters.map(cluster => {
      if (cluster.length === 0) return null;
      
      const avgFeatures = {
        timeOfDay: cluster.reduce((sum, p) => sum + p.features.timeOfDay, 0) / cluster.length,
        moodIntensity: cluster.reduce((sum, p) => sum + p.features.moodIntensity, 0) / cluster.length,
        completionRate: cluster.reduce((sum, p) => sum + p.features.completionRate, 0) / cluster.length
      };
      
      return avgFeatures;
    }).filter(centroid => centroid !== null);
  }

  // Label clusters based on their characteristics
  private labelClusters(clusters: any[][]): string[] {
    return clusters.map(cluster => {
      if (cluster.length === 0) return 'empty';
      
      const avgCompletionRate = cluster.reduce((sum, p) => sum + p.features.completionRate, 0) / cluster.length;
      const avgMoodIntensity = cluster.reduce((sum, p) => sum + p.features.moodIntensity, 0) / cluster.length;
      const avgTimeOfDay = cluster.reduce((sum, p) => sum + p.features.timeOfDay, 0) / cluster.length;

      if (avgCompletionRate > 0.8) return 'high_performers';
      if (avgMoodIntensity < 4) return 'struggling_users';
      if (avgTimeOfDay < 12) return 'morning_users';
      if (avgTimeOfDay > 18) return 'evening_users';
      
      return 'balanced_users';
    });
  }

  // Analyze patterns to generate predictions
  private analyzePatternsForPrediction(features: any, clustering: any): MLPrediction {
    const { clusters, centroids, clusterLabels } = clustering;
    
    if (clusters.length === 0) {
      return this.getDefaultPrediction();
    }

    // Find the most relevant cluster for current user state
    const currentState = [features.hourOfDay, features.currentMoodIntensity, features.completionRate];
    let bestClusterIndex = 0;
    let bestClusterScore = 0;

    centroids.forEach((centroid: any, index: number) => {
      const score = this.calculateClusterRelevance(currentState, centroid, clusters[index]);
      if (score > bestClusterScore) {
        bestClusterScore = score;
        bestClusterIndex = index;
      }
    });

    const bestCluster = clusters[bestClusterIndex];
    const clusterLabel = clusterLabels[bestClusterIndex];

    // Generate prediction based on cluster characteristics
    return this.generatePredictionFromCluster(bestCluster, features, clusterLabel);
  }

  // Calculate how relevant a cluster is to current user state
  private calculateClusterRelevance(currentState: number[], centroid: any, cluster: any[]): number {
    const distance = this.calculateEuclideanDistance(currentState, [centroid.timeOfDay, centroid.moodIntensity, centroid.completionRate]);
    const clusterSize = cluster.length;
    const avgConfidence = cluster.reduce((sum, p) => sum + p.confidence, 0) / clusterSize;
    
    // Higher score for closer, larger, more confident clusters
    return (1 / (1 + distance)) * Math.log(clusterSize + 1) * avgConfidence;
  }

  // Generate prediction from cluster analysis
  private generatePredictionFromCluster(cluster: any[], features: any, clusterLabel: string): MLPrediction {
    const clusterStats = this.calculateClusterStats(cluster);
    
    // Determine if we should send a notification
    const shouldSend = this.shouldSendNotification(clusterStats, features);
    
    // Determine optimal time
    const optimalTime = this.calculateOptimalTime(clusterStats, features);
    
    // Determine notification type and tone
    const { notificationType, messageTone } = this.determineNotificationType(clusterStats, features, clusterLabel);
    
    // Calculate urgency
    const urgency = this.calculateUrgency(clusterStats, features);
    
    // Calculate confidence
    const confidence = this.calculateConfidence(clusterStats, features);
    
    // Generate reasoning
    const reasoning = this.generateReasoning(clusterStats, features, clusterLabel);

    return {
      shouldSendNotification: shouldSend,
      optimalTime,
      notificationType,
      messageTone,
      urgency,
      confidence,
      reasoning
    };
  }

  // Calculate cluster statistics
  private calculateClusterStats(cluster: any[]): any {
    if (cluster.length === 0) {
      return {
        avgCompletionRate: 0.5,
        avgResponseTime: 300,
        avgMoodIntensity: 5,
        mostCommonTime: 12,
        mostCommonResponse: 'opened'
      };
    }

    const responses = cluster.map(p => p.features.responseType);
    const responseCounts = responses.reduce((acc, response) => {
      acc[response] = (acc[response] || 0) + 1;
      return acc;
    }, {} as any);

    return {
      avgCompletionRate: cluster.reduce((sum, p) => sum + p.features.completionRate, 0) / cluster.length,
      avgResponseTime: cluster.reduce((sum, p) => sum + p.features.responseTime, 0) / cluster.length,
      avgMoodIntensity: cluster.reduce((sum, p) => sum + p.features.moodIntensity, 0) / cluster.length,
      mostCommonTime: this.findMostCommon(cluster.map(p => p.features.timeOfDay)),
      mostCommonResponse: Object.keys(responseCounts).reduce((a, b) => responseCounts[a] > responseCounts[b] ? a : b)
    };
  }

  // Helper function to find most common value
  private findMostCommon(arr: number[]): number {
    const counts = arr.reduce((acc, val) => {
      acc[val] = (acc[val] || 0) + 1;
      return acc;
    }, {} as any);
    
    return parseInt(Object.keys(counts).reduce((a, b) => counts[a] > counts[b] ? a : b));
  }

  // Determine if notification should be sent
  private shouldSendNotification(clusterStats: any, features: any): boolean {
    const baseProbability = clusterStats.avgCompletionRate;
    const moodFactor = features.currentMoodIntensity / 10;
    const timeFactor = this.calculateTimeFactor(features.hourOfDay);
    const pendingFactor = features.pendingHabits / Math.max(features.totalHabits, 1);
    
    const probability = baseProbability * moodFactor * timeFactor * (1 + pendingFactor * 0.5);
    return probability > 0.3; // Threshold for sending notification
  }

  // Calculate optimal time for notification
  private calculateOptimalTime(clusterStats: any, features: any): string {
    const optimalHour = clusterStats.mostCommonTime;
    const optimalMinute = Math.floor(Math.random() * 60); // Add some randomness
    
    return `${optimalHour.toString().padStart(2, '0')}:${optimalMinute.toString().padStart(2, '0')}`;
  }

  // Determine notification type and tone
  private determineNotificationType(clusterStats: any, features: any, clusterLabel: string): { notificationType: 'reminder' | 'encouragement' | 'celebration' | 'check_in', messageTone: 'energetic' | 'calm' | 'supportive' | 'celebratory' } {
    if (clusterLabel === 'high_performers') {
      return { notificationType: 'celebration', messageTone: 'celebratory' };
    }
    
    if (clusterLabel === 'struggling_users') {
      return { notificationType: 'encouragement', messageTone: 'supportive' };
    }
    
    if (features.currentMoodIntensity < 4) {
      return { notificationType: 'encouragement', messageTone: 'supportive' };
    }
    
    if (features.completionRate > 0.8) {
      return { notificationType: 'celebration', messageTone: 'celebratory' };
    }
    
    return { notificationType: 'reminder', messageTone: 'energetic' };
  }

  // Calculate urgency level
  private calculateUrgency(clusterStats: any, features: any): 'low' | 'medium' | 'high' {
    const pendingRatio = features.pendingHabits / Math.max(features.totalHabits, 1);
    const moodFactor = (10 - features.currentMoodIntensity) / 10;
    const timeFactor = this.calculateTimeFactor(features.hourOfDay);
    
    const urgencyScore = pendingRatio * moodFactor * timeFactor;
    
    if (urgencyScore > 0.7) return 'high';
    if (urgencyScore > 0.4) return 'medium';
    return 'low';
  }

  // Calculate confidence in prediction
  private calculateConfidence(clusterStats: any, features: any): number {
    const patternConsistency = clusterStats.avgCompletionRate;
    const dataQuality = Math.min(this.patterns.length / 100, 1); // More data = higher confidence
    const featureRelevance = this.calculateFeatureRelevance(features);
    
    return (patternConsistency * 0.4 + dataQuality * 0.3 + featureRelevance * 0.3);
  }

  // Generate reasoning for prediction
  private generateReasoning(clusterStats: any, features: any, clusterLabel: string): string[] {
    const reasoning = [];
    
    reasoning.push(`Based on ${clusterLabel} pattern analysis`);
    reasoning.push(`Average completion rate: ${(clusterStats.avgCompletionRate * 100).toFixed(1)}%`);
    reasoning.push(`Optimal time: ${clusterStats.mostCommonTime}:00`);
    reasoning.push(`Current mood intensity: ${features.currentMoodIntensity}/10`);
    
    if (features.pendingHabits > 0) {
      reasoning.push(`${features.pendingHabits} habits pending completion`);
    }
    
    return reasoning;
  }

  // Helper functions for feature extraction
  private calculateMoodTrend(moodEntries: MoodEntry[]): 'improving' | 'declining' | 'stable' {
    if (moodEntries.length < 3) return 'stable';
    
    const recent = moodEntries.slice(-3);
    const firstAvg = (recent[0].intensity + recent[1].intensity) / 2;
    const lastAvg = (recent[1].intensity + recent[2].intensity) / 2;
    
    const difference = lastAvg - firstAvg;
    if (difference > 1) return 'improving';
    if (difference < -1) return 'declining';
    return 'stable';
  }

  private calculateMoodStability(moodEntries: MoodEntry[]): number {
    if (moodEntries.length < 2) return 1;
    
    const intensities = moodEntries.map(entry => entry.intensity);
    const variance = this.calculateVariance(intensities);
    return Math.max(0, 1 - variance / 25); // Normalize to 0-1
  }

  private calculateVariance(values: number[]): number {
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    return values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
  }

  private calculateCompletionRate(habits: Habit[]): number {
    if (habits.length === 0) return 0;
    return habits.filter(h => h.completedToday).length / habits.length;
  }

  private extractHabitCategories(habits: Habit[]): string[] {
    return [...new Set(habits.map(h => h.category).filter((category): category is string => Boolean(category)))];
  }

  private calculateTimeFactor(hour: number): number {
    // Peak productivity hours get higher scores
    if (hour >= 9 && hour <= 11) return 1.2; // Morning peak
    if (hour >= 14 && hour <= 16) return 1.1; // Afternoon peak
    if (hour >= 19 && hour <= 21) return 0.9; // Evening
    if (hour >= 22 || hour <= 6) return 0.3; // Night
    return 0.8; // Default
  }

  private calculateFeatureRelevance(features: any): number {
    // Calculate how relevant current features are to historical patterns
    const relevanceFactors = [
      features.currentMoodIntensity > 0 ? 1 : 0,
      features.totalHabits > 0 ? 1 : 0,
      features.pendingHabits > 0 ? 1 : 0,
      features.moodTrend !== 'stable' ? 1 : 0
    ];
    
    return relevanceFactors.reduce((sum, factor) => sum + factor, 0) / relevanceFactors.length;
  }

  // Get default prediction when ML fails
  private getDefaultPrediction(): MLPrediction {
    return {
      shouldSendNotification: true,
      optimalTime: '10:00',
      notificationType: 'reminder',
      messageTone: 'energetic',
      urgency: 'medium',
      confidence: 0.5,
      reasoning: ['Using default prediction due to insufficient data']
    };
  }

  // Data persistence
  private async savePatterns(): Promise<void> {
    try {
      await AsyncStorage.setItem('ml_patterns', JSON.stringify(this.patterns));
    } catch (error) {
      console.error('❌ Failed to save patterns:', error);
    }
  }

  private async loadPatterns(): Promise<void> {
    try {
      const patternsStr = await AsyncStorage.getItem('ml_patterns');
      if (patternsStr) {
        this.patterns = JSON.parse(patternsStr);
      }
    } catch (error) {
      console.error('❌ Failed to load patterns:', error);
      this.patterns = [];
    }
  }

  private async saveModelMetrics(): Promise<void> {
    try {
      await AsyncStorage.setItem('ml_model_metrics', JSON.stringify(this.modelMetrics));
    } catch (error) {
      console.error('❌ Failed to save model metrics:', error);
    }
  }

  private async loadModelMetrics(): Promise<void> {
    try {
      const metricsStr = await AsyncStorage.getItem('ml_model_metrics');
      if (metricsStr) {
        this.modelMetrics = JSON.parse(metricsStr);
      }
    } catch (error) {
      console.error('❌ Failed to load model metrics:', error);
    }
  }

  private async updateModelMetrics(): Promise<void> {
    this.modelMetrics.trainingSamples = this.patterns.length;
    await this.saveModelMetrics();
  }

  // Public API
  async getModelMetrics(): Promise<MLModelMetrics> {
    return this.modelMetrics;
  }

  async getPatterns(): Promise<UserBehaviorPattern[]> {
    return this.patterns;
  }

  async clearData(): Promise<void> {
    this.patterns = [];
    this.modelMetrics = {
      accuracy: 0,
      precision: 0,
      recall: 0,
      f1Score: 0,
      lastTrained: new Date().toISOString(),
      trainingSamples: 0,
      predictionCount: 0
    };
    
    await this.savePatterns();
    await this.saveModelMetrics();
    
  }
}

// Export singleton instance
export const mlPatternRecognitionService = new MLPatternRecognitionService();
