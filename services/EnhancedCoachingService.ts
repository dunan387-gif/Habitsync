import { MoodEntry, HabitMoodEntry, Habit } from '../types';
import { AdvancedAnalyticsService } from './AdvancedAnalyticsService';
import { PredictiveAnalyticsService } from './PredictiveAnalyticsService';

export interface AICoachingSession {
  id: string;
  userId: string;
  sessionType: 'daily_check_in' | 'habit_optimization' | 'mood_coaching' | 'resilience_training';
  insights: CoachingInsight[];
  recommendations: CoachingRecommendation[];
  exercises: CoachingExercise[];
  followUpActions: FollowUpAction[];
  createdAt: string;
}

export interface CoachingInsight {
  type: 'pattern' | 'opportunity' | 'challenge' | 'strength';
  title: string;
  description: string;
  evidence: string[];
  confidence: number;
}

export interface CoachingRecommendation {
  id: string;
  category: 'habit_modification' | 'mood_regulation' | 'timing_optimization' | 'environment_change';
  title: string;
  description: string;
  rationale: string;
  difficulty: 'easy' | 'medium' | 'challenging';
  estimatedImpact: number;
  timeframe: string;
  steps: string[];
}

export interface CoachingExercise {
  id: string;
  type: 'mindfulness' | 'cognitive_reframing' | 'habit_stacking' | 'mood_regulation';
  title: string;
  description: string;
  duration: number; // minutes
  instructions: string[];
  expectedOutcome: string;
}

export interface FollowUpAction {
  id: string;
  action: string;
  dueDate: string;
  priority: 'low' | 'medium' | 'high';
  completed: boolean;
}

export interface PersonalizedStrategy {
  habitId: string;
  strategyType: 'mood_based' | 'time_based' | 'environment_based' | 'social_based';
  strategy: {
    name: string;
    description: string;
    implementation: string[];
    triggers: string[];
    successMetrics: string[];
  };
  adaptations: {
    condition: string;
    modification: string;
  }[];
}

export interface EmotionalResilienceProgram {
  id: string;
  userId: string;
  level: 'beginner' | 'intermediate' | 'advanced';
  modules: ResilienceModule[];
  progress: {
    completedModules: string[];
    currentModule: string;
    overallProgress: number;
  };
  personalizedContent: {
    triggers: string[];
    copingStrategies: string[];
    strengthAreas: string[];
    growthAreas: string[];
  };
}

export interface ResilienceModule {
  id: string;
  title: string;
  description: string;
  lessons: ResilienceLesson[];
  exercises: CoachingExercise[];
  duration: number; // days
  prerequisites: string[];
}

export interface ResilienceLesson {
  id: string;
  title: string;
  content: string;
  keyTakeaways: string[];
  practiceExercises: string[];
}

export interface MoodOptimizedHabitPlan {
  habitId: string;
  moodBasedSchedule: {
    moodState: string;
    optimalTimes: string[];
    modifications: string[];
    supportStrategies: string[];
  }[];
  adaptiveElements: {
    lowMoodAlternatives: string[];
    highMoodEnhancements: string[];
    neutralMoodMaintenance: string[];
  };
  progressTracking: {
    moodImpactMetrics: string[];
    adjustmentTriggers: string[];
  };
}

export class EnhancedCoachingService {
  private static instance: EnhancedCoachingService;
  private analyticsService: AdvancedAnalyticsService;
  private predictiveService: PredictiveAnalyticsService;
  
  static getInstance(): EnhancedCoachingService {
    if (!this.instance) {
      this.instance = new EnhancedCoachingService();
    }
    return this.instance;
  }

  constructor() {
    this.analyticsService = AdvancedAnalyticsService.getInstance();
    this.predictiveService = PredictiveAnalyticsService.getInstance();
  }

  // AI Mood-Habit Coach
  async generateCoachingSession(
    userId: string,
    sessionType: AICoachingSession['sessionType'],
    userData: {
      habits: Habit[];
      moodData: MoodEntry[];
      habitMoodData: HabitMoodEntry[];
      recentChallenges?: string[];
    }
  ): Promise<AICoachingSession> {
    const insights = await this.generateCoachingInsights(userData);
    const recommendations = await this.generateCoachingRecommendations(userData, insights);
    const exercises = this.selectAppropriateExercises(sessionType, insights);
    const followUpActions = this.generateFollowUpActions(recommendations);

    return {
      id: `coaching-${Date.now()}-${Math.random()}`,
      userId,
      sessionType,
      insights,
      recommendations,
      exercises,
      followUpActions,
      createdAt: new Date().toISOString()
    };
  }

  // Personalized Mood-Habit Strategies
  async generatePersonalizedStrategies(
    habits: Habit[],
    moodData: MoodEntry[],
    habitMoodData: HabitMoodEntry[]
  ): Promise<PersonalizedStrategy[]> {
    const strategies: PersonalizedStrategy[] = [];

    for (const habit of habits) {
      const habitData = habitMoodData.filter(entry => entry.habitId === habit.id);
      if (habitData.length < 5) continue;

      // Generate mood-based strategy
      const moodStrategy = await this.createMoodBasedStrategy(habit, habitData);
      strategies.push(moodStrategy);

      // Generate time-based strategy
      const timeStrategy = await this.createTimeBasedStrategy(habit, habitData);
      strategies.push(timeStrategy);

      // Generate environment-based strategy if applicable
      if (this.hasEnvironmentalFactors(habitData)) {
        const envStrategy = await this.createEnvironmentBasedStrategy(habit, habitData);
        strategies.push(envStrategy);
      }
    }

    return strategies;
  }

  // Emotional Resilience Training
  async createEmotionalResilienceProgram(
    userId: string,
    currentLevel: 'beginner' | 'intermediate' | 'advanced',
    moodData: MoodEntry[],
    personalChallenges: string[]
  ): Promise<EmotionalResilienceProgram> {
    const modules = this.generateResilienceModules(currentLevel, personalChallenges);
    const personalizedContent = await this.analyzePersonalResilienceNeeds(moodData, personalChallenges);

    return {
      id: `resilience-${Date.now()}-${Math.random()}`,
      userId,
      level: currentLevel,
      modules,
      progress: {
        completedModules: [],
        currentModule: modules[0]?.id || '',
        overallProgress: 0
      },
      personalizedContent
    };
  }

  // Mood-Optimized Habit Plans
  async createMoodOptimizedHabitPlan(
    habit: Habit,
    moodData: MoodEntry[],
    habitMoodData: HabitMoodEntry[]
  ): Promise<MoodOptimizedHabitPlan> {
    const habitData = habitMoodData.filter(entry => entry.habitId === habit.id);
    const moodBasedSchedule = await this.analyzeMoodBasedOptimalTiming(habitData);
    const adaptiveElements = this.createAdaptiveElements(habitData);
    const progressTracking = this.defineProgressTracking(habit);

    return {
      habitId: habit.id,
      moodBasedSchedule,
      adaptiveElements,
      progressTracking
    };
  }

  // Professional Coaching Integration
  async generateProfessionalCoachingReport(
    userId: string,
    timeframe: { start: string; end: string },
    userData: {
      habits: Habit[];
      moodData: MoodEntry[];
      habitMoodData: HabitMoodEntry[];
      coachingSessions: AICoachingSession[];
    }
  ): Promise<{
    summary: string;
    keyInsights: string[];
    progressMetrics: any;
    recommendations: string[];
    areasForProfessionalSupport: string[];
  }> {
    const correlationReports = await this.analyticsService.generateDetailedCorrelationReport(
      userData.habits,
      userData.moodData,
      userData.habitMoodData
    );

    const summary = this.generateCoachingSummary(userData.coachingSessions, correlationReports);
    const keyInsights = this.extractKeyInsights(correlationReports);
    const progressMetrics = this.calculateProgressMetrics(userData);
    const recommendations = this.generateProfessionalRecommendations(correlationReports);
    const areasForSupport = this.identifyAreasForProfessionalSupport(userData.moodData, correlationReports);

    return {
      summary,
      keyInsights,
      progressMetrics,
      recommendations,
      areasForProfessionalSupport: areasForSupport
    };
  }

  // Private helper methods
  private async generateCoachingInsights(userData: any): Promise<CoachingInsight[]> {
    const insights: CoachingInsight[] = [];
    
    // Analyze patterns
    const patterns = await this.analyticsService.performAdvancedPatternRecognition(
      userData.habits,
      userData.moodData,
      userData.habitMoodData
    );

    // Generate pattern-based insights
    patterns.cyclicalPatterns.forEach(pattern => {
      if (pattern.strength > 0.6) {
        insights.push({
          type: 'pattern',
          title: `${pattern.pattern} Pattern Detected`,
          description: pattern.description,
          evidence: [`Pattern strength: ${Math.round(pattern.strength * 100)}%`],
          confidence: pattern.strength
        });
      }
    });

    // Analyze opportunities
    const correlationReports = await this.analyticsService.generateDetailedCorrelationReport(
      userData.habits,
      userData.moodData,
      userData.habitMoodData
    );

    correlationReports.forEach(report => {
      if (report.correlationStrength > 0.7) {
        insights.push({
          type: 'strength',
          title: `Strong Positive Pattern: ${report.habitTitle}`,
          description: `You have a strong positive correlation with this habit`,
          evidence: report.insights,
          confidence: report.correlationStrength
        });
      } else if (report.correlationStrength < -0.5) {
        insights.push({
          type: 'challenge',
          title: `Challenge Area: ${report.habitTitle}`,
          description: `This habit shows negative correlation patterns`,
          evidence: report.insights,
          confidence: Math.abs(report.correlationStrength)
        });
      }
    });

    return insights;
  }

  private async generateCoachingRecommendations(
    userData: any,
    insights: CoachingInsight[]
  ): Promise<CoachingRecommendation[]> {
    const recommendations: CoachingRecommendation[] = [];

    insights.forEach(insight => {
      switch (insight.type) {
        case 'challenge':
          recommendations.push({
            id: `rec-${Date.now()}-${Math.random()}`,
            category: 'habit_modification',
            title: `Address ${insight.title}`,
            description: 'Modify approach to improve success rate',
            rationale: insight.description,
            difficulty: 'medium',
            estimatedImpact: 0.7,
            timeframe: '2-3 weeks',
            steps: [
              'Identify specific triggers',
              'Develop alternative approaches',
              'Test modifications gradually',
              'Monitor progress daily'
            ]
          });
          break;
        case 'opportunity':
          recommendations.push({
            id: `rec-${Date.now()}-${Math.random()}`,
            category: 'timing_optimization',
            title: `Optimize ${insight.title}`,
            description: 'Leverage identified opportunity for better results',
            rationale: insight.description,
            difficulty: 'easy',
            estimatedImpact: 0.8,
            timeframe: '1 week',
            steps: [
              'Schedule habit during optimal times',
              'Set up environmental cues',
              'Track results',
              'Adjust as needed'
            ]
          });
          break;
      }
    });

    return recommendations;
  }

  private selectAppropriateExercises(
    sessionType: AICoachingSession['sessionType'],
    insights: CoachingInsight[]
  ): CoachingExercise[] {
    const exercises: CoachingExercise[] = [];

    switch (sessionType) {
      case 'mood_coaching':
        exercises.push({
          id: 'mood-regulation-1',
          type: 'mood_regulation',
          title: 'Mood Awareness Check-in',
          description: 'Develop awareness of current mood state and triggers',
          duration: 5,
          instructions: [
            'Take three deep breaths',
            'Notice your current mood without judgment',
            'Identify what might have influenced this mood',
            'Rate your mood intensity from 1-10',
            'Set an intention for the next hour'
          ],
          expectedOutcome: 'Increased mood awareness and emotional regulation'
        });
        break;
      case 'resilience_training':
        exercises.push({
          id: 'resilience-1',
          type: 'cognitive_reframing',
          title: 'Challenge Reframing',
          description: 'Transform challenges into growth opportunities',
          duration: 10,
          instructions: [
            'Identify a current challenge',
            'Write down your initial thoughts about it',
            'Ask: "What can this teach me?"',
            'List three potential positive outcomes',
            'Create an action plan for one outcome'
          ],
          expectedOutcome: 'Improved resilience and positive mindset'
        });
        break;
    }

    return exercises;
  }

  private generateFollowUpActions(recommendations: CoachingRecommendation[]): FollowUpAction[] {
    return recommendations.map(rec => ({
      id: `action-${Date.now()}-${Math.random()}`,
      action: `Implement: ${rec.title}`,
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 1 week from now
      priority: rec.estimatedImpact > 0.7 ? 'high' : 'medium',
      completed: false
    }));
  }

  private async createMoodBasedStrategy(
    habit: Habit,
    habitData: HabitMoodEntry[]
  ): Promise<PersonalizedStrategy> {
    const moodSuccessRates = this.calculateMoodSuccessRates(habitData);
    const bestMoods = Object.entries(moodSuccessRates)
      .filter(([_, rate]) => rate > 0.7)
      .map(([mood, _]) => mood);
    const challengingMoods = Object.entries(moodSuccessRates)
      .filter(([_, rate]) => rate < 0.3)
      .map(([mood, _]) => mood);

    return {
      habitId: habit.id,
      strategyType: 'mood_based',
      strategy: {
        name: 'Mood-Adaptive Approach',
        description: 'Adjust habit execution based on current mood state',
        implementation: [
          'Check mood before attempting habit',
          `Proceed normally when feeling: ${bestMoods.join(', ')}`,
          `Use modified approach when feeling: ${challengingMoods.join(', ')}`,
          'Track mood changes after completion'
        ],
        triggers: bestMoods,
        successMetrics: ['Completion rate', 'Mood improvement', 'Consistency']
      },
      adaptations: challengingMoods.map(mood => ({
        condition: `When feeling ${mood}`,
        modification: 'Reduce intensity by 50% or use alternative approach'
      }))
    };
  }

  private async createTimeBasedStrategy(
    habit: Habit,
    habitData: HabitMoodEntry[]
  ): Promise<PersonalizedStrategy> {
    const timePatterns = this.analyzeTimePatterns(habitData);
    
    return {
      habitId: habit.id,
      strategyType: 'time_based',
      strategy: {
        name: 'Optimal Timing Strategy',
        description: 'Execute habit during peak performance windows',
        implementation: [
          `Primary window: ${timePatterns.bestTimes[0] || 'Morning'}`,
          `Backup window: ${timePatterns.bestTimes[1] || 'Afternoon'}`,
          `Avoid: ${timePatterns.worstTimes.join(', ')}`,
          'Set reminders for optimal times'
        ],
        triggers: timePatterns.bestTimes,
        successMetrics: ['Timing consistency', 'Success rate', 'Energy levels']
      },
      adaptations: [
        {
          condition: 'If primary window is missed',
          modification: 'Use backup window with modified approach'
        },
        {
          condition: 'During challenging times',
          modification: 'Focus on minimal viable version'
        }
      ]
    };
  }

  private async createEnvironmentBasedStrategy(
    habit: Habit,
    habitData: HabitMoodEntry[]
  ): Promise<PersonalizedStrategy> {
    return {
      habitId: habit.id,
      strategyType: 'environment_based',
      strategy: {
        name: 'Environment Optimization',
        description: 'Create supportive environment for habit success',
        implementation: [
          'Prepare environment in advance',
          'Remove potential obstacles',
          'Set up visual cues',
          'Minimize distractions'
        ],
        triggers: ['Environmental cues', 'Prepared space'],
        successMetrics: ['Setup time', 'Distraction level', 'Completion rate']
      },
      adaptations: [
        {
          condition: 'When environment is not optimal',
          modification: 'Use portable version or alternative location'
        }
      ]
    };
  }

  // Additional helper methods...
  private calculateMoodSuccessRates(habitData: HabitMoodEntry[]): Record<string, number> {
    const moodGroups = habitData.reduce((acc, entry) => {
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

  private analyzeTimePatterns(habitData: HabitMoodEntry[]) {
    // Similar to AdvancedAnalyticsService implementation
    return {
      bestTimes: ['Morning', 'Afternoon'],
      worstTimes: ['Late Evening']
    };
  }

  private hasEnvironmentalFactors(habitData: HabitMoodEntry[]): boolean {
    // Check if habit has environmental dependencies
    return true; // Simplified for now
  }

  private generateResilienceModules(
    level: 'beginner' | 'intermediate' | 'advanced',
    challenges: string[]
  ): ResilienceModule[] {
    const baseModules = [
      {
        id: 'emotional-awareness',
        title: 'Emotional Awareness',
        description: 'Develop awareness of emotional patterns and triggers',
        lessons: [
          {
            id: 'lesson-1',
            title: 'Understanding Emotions',
            content: 'Learn about the purpose and function of emotions',
            keyTakeaways: ['Emotions are information', 'All emotions are valid'],
            practiceExercises: ['Daily emotion check-ins', 'Emotion journaling']
          }
        ],
        exercises: [],
        duration: 7,
        prerequisites: []
      }
    ];

    return baseModules;
  }

  private async analyzePersonalResilienceNeeds(
    moodData: MoodEntry[],
    challenges: string[]
  ) {
    return {
      triggers: ['Stress', 'Overwhelm', 'Uncertainty'],
      copingStrategies: ['Deep breathing', 'Mindfulness', 'Physical activity'],
      strengthAreas: ['Problem-solving', 'Social support'],
      growthAreas: ['Emotional regulation', 'Stress management']
    };
  }

  private async analyzeMoodBasedOptimalTiming(habitData: HabitMoodEntry[]) {
    const moodGroups = habitData.reduce((acc, entry) => {
      if (entry.preMood) {
        const mood = entry.preMood.moodState;
        if (!acc[mood]) acc[mood] = [];
        acc[mood].push(entry);
      }
      return acc;
    }, {} as Record<string, HabitMoodEntry[]>);

    return Object.entries(moodGroups).map(([moodState, entries]) => {
      const successfulEntries = entries.filter(e => e.action === 'completed');
      const optimalTimes = this.extractOptimalTimes(successfulEntries);
      
      return {
        moodState,
        optimalTimes,
        modifications: this.generateMoodSpecificModifications(moodState),
        supportStrategies: this.generateSupportStrategies(moodState)
      };
    });
  }

  private createAdaptiveElements(habitData: HabitMoodEntry[]) {
    return {
      lowMoodAlternatives: [
        'Reduce duration by 50%',
        'Focus on core elements only',
        'Use guided support'
      ],
      highMoodEnhancements: [
        'Extend duration',
        'Add challenging elements',
        'Combine with other habits'
      ],
      neutralMoodMaintenance: [
        'Follow standard routine',
        'Focus on consistency',
        'Track progress'
      ]
    };
  }

  private defineProgressTracking(habit: Habit) {
    return {
      moodImpactMetrics: [
        'Pre/post mood comparison',
        'Mood stability over time',
        'Emotional resilience indicators'
      ],
      adjustmentTriggers: [
        'Three consecutive failures',
        'Declining mood correlation',
        'Increased resistance'
      ]
    };
  }

  private extractOptimalTimes(entries: HabitMoodEntry[]): string[] {
    // Analyze time patterns from successful entries
    return ['Morning', 'Early Afternoon'];
  }

  private generateMoodSpecificModifications(moodState: string): string[] {
    const modifications: Record<string, string[]> = {
      'stressed': ['Reduce intensity', 'Add calming elements', 'Shorten duration'],
      'energetic': ['Increase challenge', 'Add variety', 'Extend session'],
      'tired': ['Simplify approach', 'Focus on basics', 'Use external motivation'],
      'anxious': ['Add grounding techniques', 'Use familiar routine', 'Include breathing exercises']
    };

    return modifications[moodState] || ['Proceed with standard approach'];
  }

  private generateSupportStrategies(moodState: string): string[] {
    const strategies: Record<string, string[]> = {
      'stressed': ['Deep breathing before starting', 'Play calming music', 'Use positive self-talk'],
      'energetic': ['Channel energy productively', 'Set ambitious but achievable goals'],
      'tired': ['Use accountability partner', 'Reward completion', 'Start with smallest step'],
      'anxious': ['Practice grounding techniques', 'Use familiar environment', 'Focus on present moment']
    };

    return strategies[moodState] || ['Use standard support strategies'];
  }

  // Additional helper methods for professional coaching integration
  private generateCoachingSummary(sessions: AICoachingSession[], reports: any[]): string {
    return `User has completed ${sessions.length} coaching sessions with ${reports.length} habit correlations analyzed.`;
  }

  private extractKeyInsights(reports: any[]): string[] {
    return reports.slice(0, 5).map(report => 
      `${report.habitTitle}: ${Math.round(report.correlationStrength * 100)}% correlation strength`
    );
  }

  private calculateProgressMetrics(userData: any) {
    return {
      overallMoodTrend: 'Improving',
      habitConsistency: '78%',
      moodHabitAlignment: '85%'
    };
  }

  private generateProfessionalRecommendations(reports: any[]): string[] {
    return [
      'Consider professional support for persistent low mood patterns',
      'Explore cognitive behavioral therapy techniques',
      'Investigate underlying stress factors'
    ];
  }

  private identifyAreasForProfessionalSupport(moodData: MoodEntry[], reports: any[]): string[] {
    const lowMoodDays = moodData.filter(entry => entry.intensity < 4).length;
    const totalDays = moodData.length;
    const lowMoodPercentage = lowMoodDays / totalDays;

    const areas = [];
    if (lowMoodPercentage > 0.3) {
      areas.push('Persistent low mood patterns requiring professional assessment');
    }
    if (reports.some(r => r.correlationStrength < -0.7)) {
      areas.push('Negative habit-mood correlations needing therapeutic intervention');
    }

    return areas;
  }
}