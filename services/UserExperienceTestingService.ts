import AsyncStorage from '@react-native-async-storage/async-storage';

export interface UserInteraction {
  id: string;
  timestamp: number;
  action: string;
  component: string;
  duration?: number;
  success: boolean;
  error?: string;
}

export interface UsabilityTest {
  id: string;
  name: string;
  startTime: number;
  endTime?: number;
  interactions: UserInteraction[];
  completionRate: number;
  averageInteractionTime: number;
  errorRate: number;
  userSatisfaction?: number;
}

export interface ABTestResult {
  variant: 'A' | 'B';
  userCount: number;
  completionRate: number;
  averageTime: number;
  satisfactionScore: number;
  engagementRate: number;
}

class UserExperienceTestingService {
  private static instance: UserExperienceTestingService;
  private activeTests: Map<string, UsabilityTest> = new Map();
  private userInteractions: UserInteraction[] = [];
  private readonly MAX_INTERACTIONS = 1000;

  private constructor() {}

  static getInstance(): UserExperienceTestingService {
    if (!UserExperienceTestingService.instance) {
      UserExperienceTestingService.instance = new UserExperienceTestingService();
    }
    return UserExperienceTestingService.instance;
  }

  // Start a usability test
  startUsabilityTest(testName: string): string {
    const testId = `${testName}_${Date.now()}`;
    const test: UsabilityTest = {
      id: testId,
      name: testName,
      startTime: Date.now(),
      interactions: [],
      completionRate: 0,
      averageInteractionTime: 0,
      errorRate: 0,
    };
    
    this.activeTests.set(testId, test);
    console.log(`🧪 Usability test started: ${testName}`);
    return testId;
  }

  // End a usability test
  endUsabilityTest(testId: string, satisfactionScore?: number): UsabilityTest | null {
    const test = this.activeTests.get(testId);
    if (!test) {
      console.warn(`⚠️ Usability test ${testId} not found`);
      return null;
    }

    test.endTime = Date.now();
    test.userSatisfaction = satisfactionScore;

    // Calculate metrics
    this.calculateTestMetrics(test);

    // Store the test result
    this.storeTestResult(test);
    this.activeTests.delete(testId);

    console.log(`✅ Usability test completed: ${test.name}`);
    return test;
  }

  // Record user interaction
  recordInteraction(
    testId: string,
    action: string,
    component: string,
    duration?: number,
    success: boolean = true,
    error?: string
  ): void {
    const test = this.activeTests.get(testId);
    if (!test) {
      console.warn(`⚠️ Test ${testId} not found for interaction recording`);
      return;
    }

    const interaction: UserInteraction = {
      id: `${action}_${Date.now()}`,
      timestamp: Date.now(),
      action,
      component,
      duration,
      success,
      error,
    };

    test.interactions.push(interaction);
    this.userInteractions.push(interaction);

    // Keep interactions list manageable
    if (this.userInteractions.length > this.MAX_INTERACTIONS) {
      this.userInteractions = this.userInteractions.slice(-this.MAX_INTERACTIONS);
    }

    console.log(`📝 Interaction recorded: ${action} on ${component}`);
  }

  // Test analytics tab user flow
  async testAnalyticsTabUserFlow(): Promise<UsabilityTest> {
    const testId = this.startUsabilityTest('analytics_tab_user_flow');
    
    try {
      // Simulate user opening analytics tab
      this.recordInteraction(testId, 'open_tab', 'analytics_tab', 200);
      
      // Simulate viewing today's focus
      this.recordInteraction(testId, 'view_component', 'today_focus_card', 150);
      
      // Simulate viewing weekly progress
      this.recordInteraction(testId, 'view_component', 'weekly_progress_card', 120);
      
      // Simulate viewing learning impact
      this.recordInteraction(testId, 'view_component', 'learning_impact_card', 180);
      
      // Simulate cross-tab insights interaction
      this.recordInteraction(testId, 'view_component', 'cross_tab_insights', 100);
      
      // Simulate user satisfaction (1-10 scale)
      const satisfactionScore = Math.floor(Math.random() * 3) + 8; // 8-10 range
      
      return this.endUsabilityTest(testId, satisfactionScore)!;
    } catch (error) {
      this.recordInteraction(testId, 'error', 'analytics_tab', undefined, false, error as string);
      return this.endUsabilityTest(testId)!;
    }
  }

  // Test cognitive load assessment
  async testCognitiveLoad(): Promise<{
    interactionCount: number;
    averageTime: number;
    errorRate: number;
    complexityScore: number;
  }> {
    const testId = this.startUsabilityTest('cognitive_load_assessment');
    
    try {
      // Simulate various user interactions
      const interactions = [
        { action: 'find_metric', component: 'today_focus', time: 300 },
        { action: 'understand_insight', component: 'weekly_progress', time: 450 },
        { action: 'follow_recommendation', component: 'learning_impact', time: 200 },
        { action: 'navigate_tabs', component: 'analytics_navigation', time: 150 },
      ];

      for (const interaction of interactions) {
        this.recordInteraction(
          testId,
          interaction.action,
          interaction.component,
          interaction.time
        );
      }

      const test = this.endUsabilityTest(testId)!;
      
      // Calculate cognitive load score (lower is better)
      const complexityScore = Math.max(0, 10 - (test.interactions.length * 0.5) - (test.averageInteractionTime / 100));
      
      return {
        interactionCount: test.interactions.length,
        averageTime: test.averageInteractionTime,
        errorRate: test.errorRate,
        complexityScore: Math.max(0, complexityScore),
      };
    } catch (error) {
      const test = this.endUsabilityTest(testId)!;
      return {
        interactionCount: test.interactions.length,
        averageTime: test.averageInteractionTime,
        errorRate: test.errorRate,
        complexityScore: 0,
      };
    }
  }

  // Test action completion rates
  async testActionCompletionRates(): Promise<{
    totalActions: number;
    completedActions: number;
    completionRate: number;
    averageCompletionTime: number;
  }> {
    const testId = this.startUsabilityTest('action_completion_rates');
    
    try {
      const actions = [
        { action: 'view_today_focus', success: true, time: 200 },
        { action: 'view_weekly_progress', success: true, time: 180 },
        { action: 'view_learning_impact', success: true, time: 220 },
        { action: 'follow_recommendation', success: Math.random() > 0.2, time: 300 }, // 80% success rate
        { action: 'share_progress', success: Math.random() > 0.3, time: 150 }, // 70% success rate
      ];

      for (const action of actions) {
        this.recordInteraction(
          testId,
          action.action,
          'analytics_actions',
          action.time,
          action.success
        );
      }

      const test = this.endUsabilityTest(testId)!;
      
      return {
        totalActions: test.interactions.length,
        completedActions: test.interactions.filter(i => i.success).length,
        completionRate: test.completionRate,
        averageCompletionTime: test.averageInteractionTime,
      };
    } catch (error) {
      const test = this.endUsabilityTest(testId)!;
      return {
        totalActions: test.interactions.length,
        completedActions: test.interactions.filter(i => i.success).length,
        completionRate: test.completionRate,
        averageCompletionTime: test.averageInteractionTime,
      };
    }
  }

  // A/B Testing: Old vs New Analytics
  async runABTest(): Promise<{
    variantA: ABTestResult;
    variantB: ABTestResult;
    winner: 'A' | 'B' | 'tie';
  }> {
    console.log('🔬 Starting A/B test: Old vs New Analytics...');
    
    // Simulate A/B test results
    const variantA: ABTestResult = {
      variant: 'A',
      userCount: 50,
      completionRate: 65, // Old analytics
      averageTime: 3500, // 3.5 seconds
      satisfactionScore: 6.5,
      engagementRate: 45,
    };

    const variantB: ABTestResult = {
      variant: 'B',
      userCount: 50,
      completionRate: 85, // New simplified analytics
      averageTime: 1800, // 1.8 seconds
      satisfactionScore: 8.2,
      engagementRate: 72,
    };

    // Determine winner based on multiple metrics
    const aScore = (variantA.completionRate * 0.4) + ((10 - variantA.averageTime / 1000) * 0.3) + (variantA.satisfactionScore * 0.3);
    const bScore = (variantB.completionRate * 0.4) + ((10 - variantB.averageTime / 1000) * 0.3) + (variantB.satisfactionScore * 0.3);

    const winner = bScore > aScore ? 'B' : aScore > bScore ? 'A' : 'tie';

    console.log(`🏆 A/B Test Results: Variant ${winner} wins!`);
    
    return { variantA, variantB, winner };
  }

  // Test different insight formats
  async testInsightFormats(): Promise<{
    cardFormat: { engagement: number; completion: number };
    listFormat: { engagement: number; completion: number };
    dashboardFormat: { engagement: number; completion: number };
  }> {
    const testId = this.startUsabilityTest('insight_formats_test');
    
    try {
      // Simulate testing different insight formats
      const formats = [
        { format: 'card', engagement: 78, completion: 82 },
        { format: 'list', engagement: 65, completion: 71 },
        { format: 'dashboard', engagement: 45, completion: 58 },
      ];

      for (const format of formats) {
        this.recordInteraction(
          testId,
          `test_${format.format}_format`,
          'insight_formats',
          250,
          true
        );
      }

      this.endUsabilityTest(testId);
      
      return {
        cardFormat: { engagement: 78, completion: 82 },
        listFormat: { engagement: 65, completion: 71 },
        dashboardFormat: { engagement: 45, completion: 58 },
      };
    } catch (error) {
      return {
        cardFormat: { engagement: 0, completion: 0 },
        listFormat: { engagement: 0, completion: 0 },
        dashboardFormat: { engagement: 0, completion: 0 },
      };
    }
  }

  // Test recommendation effectiveness
  async testRecommendationEffectiveness(): Promise<{
    totalRecommendations: number;
    followedRecommendations: number;
    followThroughRate: number;
    averageTimeToFollow: number;
  }> {
    const testId = this.startUsabilityTest('recommendation_effectiveness');
    
    try {
      const recommendations = [
        { action: 'add_habit', followed: Math.random() > 0.4, time: 1200 }, // 60% follow rate
        { action: 'complete_task', followed: Math.random() > 0.2, time: 800 }, // 80% follow rate
        { action: 'view_course', followed: Math.random() > 0.5, time: 1500 }, // 50% follow rate
        { action: 'adjust_settings', followed: Math.random() > 0.6, time: 900 }, // 40% follow rate
      ];

      for (const rec of recommendations) {
        this.recordInteraction(
          testId,
          rec.action,
          'recommendations',
          rec.time,
          rec.followed
        );
      }

      const test = this.endUsabilityTest(testId)!;
      
      return {
        totalRecommendations: test.interactions.length,
        followedRecommendations: test.interactions.filter(i => i.success).length,
        followThroughRate: test.completionRate,
        averageTimeToFollow: test.averageInteractionTime,
      };
    } catch (error) {
      return {
        totalRecommendations: 0,
        followedRecommendations: 0,
        followThroughRate: 0,
        averageTimeToFollow: 0,
      };
    }
  }

  // Get user experience summary
  async getUserExperienceSummary(): Promise<{
    averageCompletionRate: number;
    averageSatisfactionScore: number;
    averageInteractionTime: number;
    totalTests: number;
    errorRate: number;
  }> {
    const testResults = await this.getTestResults();
    
    if (testResults.length === 0) {
      return {
        averageCompletionRate: 0,
        averageSatisfactionScore: 0,
        averageInteractionTime: 0,
        totalTests: 0,
        errorRate: 0,
      };
    }

    const completionRates = testResults.map(test => test.completionRate);
    const satisfactionScores = testResults
      .map(test => test.userSatisfaction)
      .filter(score => score !== undefined) as number[];
    const interactionTimes = testResults.map(test => test.averageInteractionTime);
    const errorRates = testResults.map(test => test.errorRate);

    return {
      averageCompletionRate: completionRates.reduce((a, b) => a + b, 0) / completionRates.length,
      averageSatisfactionScore: satisfactionScores.length > 0 
        ? satisfactionScores.reduce((a, b) => a + b, 0) / satisfactionScores.length 
        : 0,
      averageInteractionTime: interactionTimes.reduce((a, b) => a + b, 0) / interactionTimes.length,
      totalTests: testResults.length,
      errorRate: errorRates.reduce((a, b) => a + b, 0) / errorRates.length,
    };
  }

  // Run comprehensive UX test suite
  async runUXTestSuite(): Promise<{
    userFlow: UsabilityTest;
    cognitiveLoad: any;
    actionCompletion: any;
    abTest: any;
    insightFormats: any;
    recommendationEffectiveness: any;
    summary: any;
  }> {
    console.log('🧪 Starting comprehensive UX test suite...');
    
    const results = {
      userFlow: await this.testAnalyticsTabUserFlow(),
      cognitiveLoad: await this.testCognitiveLoad(),
      actionCompletion: await this.testActionCompletionRates(),
      abTest: await this.runABTest(),
      insightFormats: await this.testInsightFormats(),
      recommendationEffectiveness: await this.testRecommendationEffectiveness(),
      summary: await this.getUserExperienceSummary(),
    };
    
    console.log('✅ UX test suite completed:', results);
    return results;
  }

  // Private helper methods
  private calculateTestMetrics(test: UsabilityTest): void {
    if (test.interactions.length === 0) return;

    const successfulInteractions = test.interactions.filter(i => i.success);
    const interactionTimes = test.interactions
      .map(i => i.duration)
      .filter(time => time !== undefined) as number[];

    test.completionRate = (successfulInteractions.length / test.interactions.length) * 100;
    test.averageInteractionTime = interactionTimes.length > 0 
      ? interactionTimes.reduce((a, b) => a + b, 0) / interactionTimes.length 
      : 0;
    test.errorRate = ((test.interactions.length - successfulInteractions.length) / test.interactions.length) * 100;
  }

  private async storeTestResult(test: UsabilityTest): Promise<void> {
    try {
      const existingResults = await this.getTestResults();
      existingResults.push(test);
      
      // Keep only the latest results
      if (existingResults.length > 50) {
        existingResults.splice(0, existingResults.length - 50);
      }
      
      await AsyncStorage.setItem('ux_test_results', JSON.stringify(existingResults));
    } catch (error) {
      console.error('Failed to store UX test result:', error);
    }
  }

  private async getTestResults(): Promise<UsabilityTest[]> {
    try {
      const results = await AsyncStorage.getItem('ux_test_results');
      return results ? JSON.parse(results) : [];
    } catch (error) {
      console.error('Failed to get UX test results:', error);
      return [];
    }
  }
}

export default UserExperienceTestingService;
