import { CrossTabData, TodayInsight, WeeklyProgress, LearningInsight } from '@/context/CrossTabInsightsContext';

interface CalculationMetrics {
  completionRate: number;
  streakEfficiency: number;
  learningImpact: number;
  gamificationEngagement: number;
  overallProgress: number;
}

interface TrendAnalysis {
  direction: 'up' | 'down' | 'stable';
  magnitude: number;
  confidence: number;
  factors: string[];
}

interface RecommendationEngine {
  priority: 'high' | 'medium' | 'low';
  category: 'habit' | 'learning' | 'gamification' | 'settings';
  action: string;
  reasoning: string;
  expectedImpact: number;
}

class AnalyticsCalculationService {
  private static instance: AnalyticsCalculationService;

  private constructor() {}

  static getInstance(): AnalyticsCalculationService {
    if (!AnalyticsCalculationService.instance) {
      AnalyticsCalculationService.instance = new AnalyticsCalculationService();
    }
    return AnalyticsCalculationService.instance;
  }

  // Calculate comprehensive metrics from cross-tab data
  calculateMetrics(data: CrossTabData): CalculationMetrics {
    const completionRate = this.calculateCompletionRate(data.home);
    const streakEfficiency = this.calculateStreakEfficiency(data.home);
    const learningImpact = this.calculateLearningImpact(data.library);
    const gamificationEngagement = this.calculateGamificationEngagement(data.gamification);
    const overallProgress = this.calculateOverallProgress(data);

    return {
      completionRate,
      streakEfficiency,
      learningImpact,
      gamificationEngagement,
      overallProgress,
    };
  }

  // Calculate habit completion rate
  private calculateCompletionRate(homeData: CrossTabData['home']): number {
    if (homeData.totalHabits === 0) return 0;
    return (homeData.todayCompletions / homeData.totalHabits) * 100;
  }

  // Calculate streak efficiency (current vs longest)
  private calculateStreakEfficiency(homeData: CrossTabData['home']): number {
    if (homeData.longestStreak === 0) return 0;
    return (homeData.currentStreak / homeData.longestStreak) * 100;
  }

  // Calculate learning impact based on course progress
  private calculateLearningImpact(libraryData: CrossTabData['library']): number {
    if (libraryData.totalCourses === 0) return 0;
    const courseProgress = (libraryData.coursesCompleted / libraryData.totalCourses) * 100;
    const techniqueApplication = libraryData.appliedTechniques.length * 10; // 10 points per technique
    return Math.min(100, courseProgress + techniqueApplication);
  }

  // Calculate gamification engagement
  private calculateGamificationEngagement(gamificationData: CrossTabData['gamification']): number {
    const levelProgress = Math.min(100, (gamificationData.currentLevel / 10) * 100); // Assuming max level 10
    const achievementProgress = Math.min(100, gamificationData.recentAchievements.length * 20); // 20 points per achievement
    const xpProgress = Math.min(100, (gamificationData.totalXP / 1000) * 100); // Assuming 1000 XP is max
    
    return (levelProgress + achievementProgress + xpProgress) / 3;
  }

  // Calculate overall progress (weighted average)
  private calculateOverallProgress(data: CrossTabData): number {
    const metrics = this.calculateMetrics(data);
    
    // Weighted average based on importance
    const weights = {
      completionRate: 0.4,      // 40% - most important
      streakEfficiency: 0.25,   // 25% - consistency
      learningImpact: 0.2,      // 20% - knowledge application
      gamificationEngagement: 0.15, // 15% - motivation
    };

    return (
      metrics.completionRate * weights.completionRate +
      metrics.streakEfficiency * weights.streakEfficiency +
      metrics.learningImpact * weights.learningImpact +
      metrics.gamificationEngagement * weights.gamificationEngagement
    );
  }

  // Analyze trends across different time periods
  analyzeTrends(data: CrossTabData, historicalData?: CrossTabData[]): TrendAnalysis {
    const currentMetrics = this.calculateMetrics(data);
    
    if (!historicalData || historicalData.length === 0) {
      // No historical data, analyze current state
      return this.analyzeCurrentState(currentMetrics);
    }

    // Compare with historical data
    const previousMetrics = this.calculateMetrics(historicalData[historicalData.length - 1]);
    
    const completionRateChange = currentMetrics.completionRate - previousMetrics.completionRate;
    const streakEfficiencyChange = currentMetrics.streakEfficiency - previousMetrics.streakEfficiency;
    const learningImpactChange = currentMetrics.learningImpact - previousMetrics.learningImpact;
    const overallProgressChange = currentMetrics.overallProgress - previousMetrics.overallProgress;

    // Determine trend direction
    let direction: 'up' | 'down' | 'stable';
    let magnitude: number;
    let confidence: number;
    let factors: string[] = [];

    if (overallProgressChange > 5) {
      direction = 'up';
      magnitude = Math.abs(overallProgressChange);
      confidence = 0.8;
      factors.push('Overall progress improving');
    } else if (overallProgressChange < -5) {
      direction = 'down';
      magnitude = Math.abs(overallProgressChange);
      confidence = 0.8;
      factors.push('Overall progress declining');
    } else {
      direction = 'stable';
      magnitude = Math.abs(overallProgressChange);
      confidence = 0.6;
      factors.push('Progress remains stable');
    }

    // Add specific factors
    if (completionRateChange > 10) factors.push('Habit completion improved');
    if (completionRateChange < -10) factors.push('Habit completion declined');
    if (streakEfficiencyChange > 20) factors.push('Streak efficiency increased');
    if (learningImpactChange > 15) factors.push('Learning impact enhanced');

    return {
      direction,
      magnitude,
      confidence,
      factors,
    };
  }

  // Analyze current state when no historical data is available
  private analyzeCurrentState(metrics: CalculationMetrics): TrendAnalysis {
    let direction: 'up' | 'down' | 'stable';
    let magnitude: number;
    let confidence: number;
    let factors: string[] = [];

    if (metrics.overallProgress > 70) {
      direction = 'up';
      magnitude = metrics.overallProgress;
      confidence = 0.7;
      factors.push('Strong current performance');
    } else if (metrics.overallProgress < 30) {
      direction = 'down';
      magnitude = 100 - metrics.overallProgress;
      confidence = 0.7;
      factors.push('Low current performance');
    } else {
      direction = 'stable';
      magnitude = 50;
      confidence = 0.5;
      factors.push('Moderate current performance');
    }

    // Add specific observations
    if (metrics.completionRate > 80) factors.push('High habit completion');
    if (metrics.completionRate < 20) factors.push('Low habit completion');
    if (metrics.streakEfficiency > 80) factors.push('Strong streak maintenance');
    if (metrics.learningImpact > 60) factors.push('Good learning progress');

    return {
      direction,
      magnitude,
      confidence,
      factors,
    };
  }

  // Generate personalized recommendations
  generateRecommendations(data: CrossTabData): RecommendationEngine[] {
    const metrics = this.calculateMetrics(data);
    const recommendations: RecommendationEngine[] = [];

    // Habit completion recommendations
    if (metrics.completionRate < 50) {
      recommendations.push({
        priority: 'high',
        category: 'habit',
        action: 'Focus on completing at least one habit today',
        reasoning: 'Low completion rate indicates need for immediate action',
        expectedImpact: 25,
      });
    } else if (metrics.completionRate < 80) {
      recommendations.push({
        priority: 'medium',
        category: 'habit',
        action: 'Try to complete 2-3 more habits today',
        reasoning: 'Good progress, but room for improvement',
        expectedImpact: 15,
      });
    }

    // Streak efficiency recommendations
    if (metrics.streakEfficiency < 30) {
      recommendations.push({
        priority: 'high',
        category: 'habit',
        action: 'Focus on maintaining your current streak',
        reasoning: 'Low streak efficiency suggests inconsistency',
        expectedImpact: 20,
      });
    }

    // Learning impact recommendations
    if (metrics.learningImpact < 30) {
      recommendations.push({
        priority: 'medium',
        category: 'learning',
        action: 'Start a course in the library',
        reasoning: 'Low learning impact - knowledge can improve habits',
        expectedImpact: 30,
      });
    }

    // Gamification engagement recommendations
    if (metrics.gamificationEngagement < 40) {
      recommendations.push({
        priority: 'low',
        category: 'gamification',
        action: 'Check your achievements and level progress',
        reasoning: 'Low engagement - gamification can boost motivation',
        expectedImpact: 10,
      });
    }

    // Sort by priority and expected impact
    return recommendations.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
      if (priorityDiff !== 0) return priorityDiff;
      return b.expectedImpact - a.expectedImpact;
    });
  }

  // Generate today's insight with enhanced logic
  generateTodayInsight(data: CrossTabData): TodayInsight {
    const metrics = this.calculateMetrics(data);
    const recommendations = this.generateRecommendations(data);
    const topRecommendation = recommendations[0];

    let mainMetric: string;
    let nextAction: string;
    let motivation: string;
    let context: string;
    let priority: 'high' | 'medium' | 'low';

    // Determine main metric based on current state
    if (metrics.completionRate === 0) {
      mainMetric = 'No habits completed today';
      nextAction = 'Start with your first habit';
      motivation = 'Every journey begins with a single step';
      context = 'New day, new opportunity to build better habits';
      priority = 'high';
    } else if (metrics.completionRate < 30) {
      mainMetric = `${data.home.todayCompletions}/${data.home.totalHabits} habits completed`;
      nextAction = topRecommendation?.action || 'Complete more habits today';
      motivation = 'You\'ve started - that\'s the hardest part!';
      context = 'Building momentum takes time';
      priority = 'high';
    } else if (metrics.completionRate < 70) {
      mainMetric = `${data.home.todayCompletions}/${data.home.totalHabits} habits completed`;
      nextAction = topRecommendation?.action || 'Complete remaining habits';
      motivation = 'Great progress! You\'re building consistency';
      context = 'You\'re on track for a productive day';
      priority = 'medium';
    } else if (metrics.completionRate < 100) {
      mainMetric = `${data.home.todayCompletions}/${data.home.totalHabits} habits completed`;
      nextAction = 'Complete your remaining habits';
      motivation = 'Almost there! You\'re doing amazing';
      context = 'Excellent progress today';
      priority = 'medium';
    } else {
      mainMetric = 'All habits completed! 🎉';
      nextAction = 'Maintain this momentum tomorrow';
      motivation = 'Perfect day! You\'re unstoppable';
      context = 'Outstanding work - you\'ve mastered today';
      priority = 'low';
    }

    return {
      mainMetric,
      nextAction,
      motivation,
      context,
      priority,
    };
  }

  // Generate weekly progress with trend analysis
  generateWeeklyProgress(data: CrossTabData, historicalData?: CrossTabData[]): WeeklyProgress {
    const trendAnalysis = this.analyzeTrends(data, historicalData);
    const metrics = this.calculateMetrics(data);

    let trend: 'improving' | 'stable' | 'declining';
    let improvement: string;
    let recommendation: string;
    let percentageChange: number;

    if (trendAnalysis.direction === 'up') {
      trend = 'improving';
      improvement = `Strong performance - ${trendAnalysis.factors.join(', ')}`;
      recommendation = 'Keep up the excellent work and maintain consistency';
      percentageChange = Math.round(trendAnalysis.magnitude);
    } else if (trendAnalysis.direction === 'down') {
      trend = 'declining';
      improvement = `Needs attention - ${trendAnalysis.factors.join(', ')}`;
      recommendation = 'Focus on the basics and rebuild momentum';
      percentageChange = -Math.round(trendAnalysis.magnitude);
    } else {
      trend = 'stable';
      improvement = `Steady progress - ${trendAnalysis.factors.join(', ')}`;
      recommendation = 'Try to increase your effort for better results';
      percentageChange = Math.round(trendAnalysis.magnitude);
    }

    return {
      trend,
      keyMetric: 'Overall Progress',
      improvement,
      recommendation,
      percentageChange,
    };
  }

  // Generate learning insight with impact analysis
  generateLearningInsight(data: CrossTabData): LearningInsight {
    const metrics = this.calculateMetrics(data);
    const learningProgress = data.library.totalCourses > 0 
      ? (data.library.coursesCompleted / data.library.totalCourses) * 100 
      : 0;

    let courseImpact: string;
    let knowledgeApplied: string;
    let nextLearning: string;
    let impactScore: number;

    if (learningProgress === 0) {
      courseImpact = 'No courses completed yet';
      knowledgeApplied = 'Start learning to improve your habits';
      nextLearning = 'Explore the library for beginner courses';
      impactScore = 0;
    } else if (learningProgress < 30) {
      courseImpact = 'Learning journey just beginning';
      knowledgeApplied = `Applied ${data.library.appliedTechniques.length} techniques`;
      nextLearning = 'Continue with beginner courses';
      impactScore = Math.min(100, learningProgress + data.library.appliedTechniques.length * 10);
    } else if (learningProgress < 70) {
      courseImpact = 'Good learning progress';
      knowledgeApplied = `Applied ${data.library.appliedTechniques.length} techniques`;
      nextLearning = 'Try intermediate courses for deeper insights';
      impactScore = Math.min(100, learningProgress + data.library.appliedTechniques.length * 15);
    } else {
      courseImpact = 'Excellent learning progress';
      knowledgeApplied = `Mastered ${data.library.appliedTechniques.length} techniques`;
      nextLearning = 'Review and practice advanced concepts';
      impactScore = Math.min(100, learningProgress + data.library.appliedTechniques.length * 20);
    }

    return {
      courseImpact,
      knowledgeApplied,
      nextLearning,
      impactScore,
    };
  }

  // Calculate performance score (0-100)
  calculatePerformanceScore(data: CrossTabData): number {
    const metrics = this.calculateMetrics(data);
    
    // Weighted scoring system
    const weights = {
      completionRate: 0.35,
      streakEfficiency: 0.25,
      learningImpact: 0.25,
      gamificationEngagement: 0.15,
    };

    const score = 
      metrics.completionRate * weights.completionRate +
      metrics.streakEfficiency * weights.streakEfficiency +
      metrics.learningImpact * weights.learningImpact +
      metrics.gamificationEngagement * weights.gamificationEngagement;

    return Math.round(score);
  }

  // Get performance level based on score
  getPerformanceLevel(score: number): 'excellent' | 'good' | 'fair' | 'needs_improvement' {
    if (score >= 80) return 'excellent';
    if (score >= 60) return 'good';
    if (score >= 40) return 'fair';
    return 'needs_improvement';
  }

  // Calculate improvement potential
  calculateImprovementPotential(data: CrossTabData): {
    areas: string[];
    potential: number;
    recommendations: string[];
  } {
    const metrics = this.calculateMetrics(data);
    const areas: string[] = [];
    const recommendations: string[] = [];
    let potential = 0;

    if (metrics.completionRate < 80) {
      areas.push('Habit Completion');
      potential += (80 - metrics.completionRate) * 0.4;
      recommendations.push('Focus on completing more habits daily');
    }

    if (metrics.streakEfficiency < 70) {
      areas.push('Streak Consistency');
      potential += (70 - metrics.streakEfficiency) * 0.25;
      recommendations.push('Work on maintaining longer streaks');
    }

    if (metrics.learningImpact < 60) {
      areas.push('Learning Application');
      potential += (60 - metrics.learningImpact) * 0.25;
      recommendations.push('Apply more techniques from courses');
    }

    if (metrics.gamificationEngagement < 50) {
      areas.push('Gamification Engagement');
      potential += (50 - metrics.gamificationEngagement) * 0.15;
      recommendations.push('Engage more with achievements and levels');
    }

    return {
      areas,
      potential: Math.round(potential),
      recommendations,
    };
  }
}

export default AnalyticsCalculationService;
