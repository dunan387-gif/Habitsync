import AsyncStorage from '@react-native-async-storage/async-storage';

interface UserPattern {
  userId: string;
  patternType: 'mood' | 'habit' | 'performance' | 'wellness';
  metric: string;
  value: number;
  timestamp: string;
  context?: Record<string, any>;
}

interface AdaptiveThreshold {
  patternType: string;
  metric: string;
  baseline: number;
  current: number;
  trend: 'increasing' | 'decreasing' | 'stable';
  confidence: number;
  lastUpdated: string;
  sampleSize: number;
}

interface ThresholdConfig {
  minSampleSize: number;
  learningRate: number;
  confidenceThreshold: number;
  updateFrequency: number; // hours
}

class AdaptiveThresholdService {
  private static instance: AdaptiveThresholdService;
  private patterns: Map<string, UserPattern[]> = new Map();
  private thresholds: Map<string, AdaptiveThreshold> = new Map();
  private config: ThresholdConfig = {
    minSampleSize: 10,
    learningRate: 0.1,
    confidenceThreshold: 0.7,
    updateFrequency: 24
  };

  static getInstance(): AdaptiveThresholdService {
    if (!AdaptiveThresholdService.instance) {
      AdaptiveThresholdService.instance = new AdaptiveThresholdService();
    }
    return AdaptiveThresholdService.instance;
  }

  /**
   * Record a new user pattern
   */
  async recordPattern(pattern: UserPattern): Promise<void> {
    const key = `${pattern.userId}-${pattern.patternType}-${pattern.metric}`;
    
    if (!this.patterns.has(key)) {
      this.patterns.set(key, []);
    }
    
    this.patterns.get(key)!.push(pattern);
    
    // Update threshold if we have enough data
    await this.updateThreshold(key);
    
    // Persist to storage
    await this.persistPatterns();
  }

  /**
   * Get adaptive threshold for a specific metric
   */
  getThreshold(userId: string, patternType: string, metric: string): AdaptiveThreshold | null {
    const key = `${userId}-${patternType}-${metric}`;
    return this.thresholds.get(key) || null;
  }

  /**
   * Get all thresholds for a user
   */
  getUserThresholds(userId: string): AdaptiveThreshold[] {
    const userThresholds: AdaptiveThreshold[] = [];
    
    this.thresholds.forEach((threshold, key) => {
      if (key.startsWith(userId)) {
        userThresholds.push(threshold);
      }
    });
    
    return userThresholds;
  }

  /**
   * Check if a value exceeds the adaptive threshold
   */
  isAboveThreshold(userId: string, patternType: string, metric: string, value: number): boolean {
    const threshold = this.getThreshold(userId, patternType, metric);
    if (!threshold || threshold.confidence < this.config.confidenceThreshold) {
      return false; // Not enough data to make a reliable comparison
    }
    
    return value > threshold.current;
  }

  /**
   * Check if a value is below the adaptive threshold
   */
  isBelowThreshold(userId: string, patternType: string, metric: string, value: number): boolean {
    const threshold = this.getThreshold(userId, patternType, metric);
    if (!threshold || threshold.confidence < this.config.confidenceThreshold) {
      return false;
    }
    
    return value < threshold.current;
  }

  /**
   * Get threshold recommendations based on user patterns
   */
  getThresholdRecommendations(userId: string): {
    type: string;
    metric: string;
    currentValue: number;
    recommendedThreshold: number;
    reasoning: string;
    priority: 'high' | 'medium' | 'low';
  }[] {
    const recommendations: {
      type: string;
      metric: string;
      currentValue: number;
      recommendedThreshold: number;
      reasoning: string;
      priority: 'high' | 'medium' | 'low';
    }[] = [];
    const userThresholds = this.getUserThresholds(userId);
    
    userThresholds.forEach(threshold => {
      const patterns = this.patterns.get(`${userId}-${threshold.patternType}-${threshold.metric}`) || [];
      const recentPatterns = patterns.slice(-30); // Last 30 data points
      
      if (recentPatterns.length >= this.config.minSampleSize) {
        const avgValue = recentPatterns.reduce((sum, p) => sum + p.value, 0) / recentPatterns.length;
        const variance = this.calculateVariance(recentPatterns.map(p => p.value));
        
        // Check if threshold needs adjustment
        const deviation = Math.abs(avgValue - threshold.current) / threshold.current;
        
        if (deviation > 0.2) { // 20% deviation
          recommendations.push({
            type: threshold.patternType,
            metric: threshold.metric,
            currentValue: threshold.current,
            recommendedThreshold: avgValue,
            reasoning: this.generateReasoning(threshold, avgValue, variance),
            priority: deviation > 0.5 ? 'high' : deviation > 0.3 ? 'medium' : 'low'
          });
        }
      }
    });
    
    return recommendations.sort((a, b) => {
      const priorityOrder: Record<'high' | 'medium' | 'low', number> = { high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });
  }

  /**
   * Update threshold based on recent patterns
   */
  private async updateThreshold(key: string): Promise<void> {
    const patterns = this.patterns.get(key);
    if (!patterns || patterns.length < this.config.minSampleSize) {
      return;
    }
    
    const recentPatterns = patterns.slice(-this.config.minSampleSize);
    const values = recentPatterns.map(p => p.value);
    const avgValue = values.reduce((sum, val) => sum + val, 0) / values.length;
    const variance = this.calculateVariance(values);
    
    const existingThreshold = this.thresholds.get(key);
    const baseline = existingThreshold?.baseline || avgValue;
    
    // Calculate new threshold using exponential moving average
    const newThreshold = existingThreshold 
      ? existingThreshold.current * (1 - this.config.learningRate) + avgValue * this.config.learningRate
      : avgValue;
    
    // Determine trend
    const trend = this.calculateTrend(values);
    
    // Calculate confidence based on variance and sample size
    const confidence = Math.min(1, Math.max(0.3, 
      1 - (variance / avgValue) + (recentPatterns.length / 100)
    ));
    
    const updatedThreshold: AdaptiveThreshold = {
      patternType: recentPatterns[0].patternType,
      metric: recentPatterns[0].metric,
      baseline,
      current: newThreshold,
      trend,
      confidence,
      lastUpdated: new Date().toISOString(),
      sampleSize: recentPatterns.length
    };
    
    this.thresholds.set(key, updatedThreshold);
    await this.persistThresholds();
  }

  /**
   * Calculate variance of values
   */
  private calculateVariance(values: number[]): number {
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const squaredDiffs = values.map(val => Math.pow(val - mean, 2));
    return squaredDiffs.reduce((sum, diff) => sum + diff, 0) / values.length;
  }

  /**
   * Calculate trend from values
   */
  private calculateTrend(values: number[]): 'increasing' | 'decreasing' | 'stable' {
    if (values.length < 3) return 'stable';
    
    const firstHalf = values.slice(0, Math.floor(values.length / 2));
    const secondHalf = values.slice(Math.floor(values.length / 2));
    
    const firstAvg = firstHalf.reduce((sum, val) => sum + val, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((sum, val) => sum + val, 0) / secondHalf.length;
    
    const change = (secondAvg - firstAvg) / firstAvg;
    
    if (Math.abs(change) < 0.05) return 'stable';
    return change > 0 ? 'increasing' : 'decreasing';
  }

  /**
   * Generate reasoning for threshold recommendation
   */
  private generateReasoning(threshold: AdaptiveThreshold, avgValue: number, variance: number): string {
    const deviation = Math.abs(avgValue - threshold.current) / threshold.current;
    
    if (deviation > 0.5) {
      return `Significant change detected (${Math.round(deviation * 100)}% deviation). Current threshold may not reflect recent patterns.`;
    } else if (deviation > 0.3) {
      return `Moderate change detected (${Math.round(deviation * 100)}% deviation). Consider adjusting threshold for better accuracy.`;
    } else {
      return `Minor change detected (${Math.round(deviation * 100)}% deviation). Threshold is generally accurate.`;
    }
  }

  /**
   * Persist patterns to storage
   */
  private async persistPatterns(): Promise<void> {
    try {
      const patternsData = Object.fromEntries(this.patterns);
      await AsyncStorage.setItem('adaptive_patterns', JSON.stringify(patternsData));
    } catch (error) {
      console.error('Failed to persist patterns:', error);
    }
  }

  /**
   * Persist thresholds to storage
   */
  private async persistThresholds(): Promise<void> {
    try {
      const thresholdsData = Object.fromEntries(this.thresholds);
      await AsyncStorage.setItem('adaptive_thresholds', JSON.stringify(thresholdsData));
    } catch (error) {
      console.error('Failed to persist thresholds:', error);
    }
  }

  /**
   * Load patterns from storage
   */
  async loadPatterns(): Promise<void> {
    try {
      const patternsData = await AsyncStorage.getItem('adaptive_patterns');
      if (patternsData) {
        this.patterns = new Map(Object.entries(JSON.parse(patternsData)));
      }
    } catch (error) {
      console.error('Failed to load patterns:', error);
    }
  }

  /**
   * Load thresholds from storage
   */
  async loadThresholds(): Promise<void> {
    try {
      const thresholdsData = await AsyncStorage.getItem('adaptive_thresholds');
      if (thresholdsData) {
        this.thresholds = new Map(Object.entries(JSON.parse(thresholdsData)));
      }
    } catch (error) {
      console.error('Failed to load thresholds:', error);
    }
  }

  /**
   * Update configuration
   */
  updateConfig(newConfig: Partial<ThresholdConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * Get current configuration
   */
  getConfig(): ThresholdConfig {
    return { ...this.config };
  }

  /**
   * Clear all data for a user
   */
  async clearUserData(userId: string): Promise<void> {
    // Remove patterns
    const patternKeysToRemove: string[] = [];
    this.patterns.forEach((_, key) => {
      if (key.startsWith(userId)) {
        patternKeysToRemove.push(key);
      }
    });
    patternKeysToRemove.forEach(key => this.patterns.delete(key));
    
    // Remove thresholds
    const thresholdKeysToRemove: string[] = [];
    this.thresholds.forEach((_, key) => {
      if (key.startsWith(userId)) {
        thresholdKeysToRemove.push(key);
      }
    });
    thresholdKeysToRemove.forEach(key => this.thresholds.delete(key));
    
    await this.persistPatterns();
    await this.persistThresholds();
  }
}

export default AdaptiveThresholdService; 