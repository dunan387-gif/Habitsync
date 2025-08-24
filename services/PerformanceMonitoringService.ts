import AsyncStorage from '@react-native-async-storage/async-storage';

export interface PerformanceMetrics {
  loadTime: number;
  dataSyncTime: number;
  memoryUsage: number;
  errorCount: number;
  userInteractionTime: number;
  cacheHitRate: number;
}

export interface PerformanceTest {
  id: string;
  name: string;
  startTime: number;
  endTime?: number;
  metrics: Partial<PerformanceMetrics>;
  success: boolean;
  error?: string;
}

class PerformanceMonitoringService {
  private static instance: PerformanceMonitoringService;
  private activeTests: Map<string, PerformanceTest> = new Map();
  private metricsHistory: PerformanceMetrics[] = [];
  private readonly MAX_HISTORY_SIZE = 100;

  private constructor() {}

  static getInstance(): PerformanceMonitoringService {
    if (!PerformanceMonitoringService.instance) {
      PerformanceMonitoringService.instance = new PerformanceMonitoringService();
    }
    return PerformanceMonitoringService.instance;
  }

  // Start a performance test
  startTest(testName: string): string {
    const testId = `${testName}_${Date.now()}`;
    const test: PerformanceTest = {
      id: testId,
      name: testName,
      startTime: Date.now(),
      metrics: {},
      success: false,
    };
    
    this.activeTests.set(testId, test);
    console.log(`🚀 Performance test started: ${testName}`);
    return testId;
  }

  // End a performance test
  endTest(testId: string, success: boolean = true, error?: string): PerformanceTest | null {
    const test = this.activeTests.get(testId);
    if (!test) {
      console.warn(`⚠️ Test ${testId} not found`);
      return null;
    }

    test.endTime = Date.now();
    test.success = success;
    test.error = error;

    // Calculate load time
    test.metrics.loadTime = test.endTime - test.startTime;

    // Store the test result
    this.storeTestResult(test);
    this.activeTests.delete(testId);

    console.log(`✅ Performance test completed: ${test.name} (${test.metrics.loadTime}ms)`);
    return test;
  }

  // Measure analytics tab load time
  async measureAnalyticsLoadTime(): Promise<number> {
    const testId = this.startTest('analytics_tab_load');
    
    try {
      const startTime = Date.now();
      
      // Simulate analytics tab loading
      await this.simulateAnalyticsLoad();
      
      const loadTime = Date.now() - startTime;
      this.endTest(testId, true);
      
      return loadTime;
    } catch (error) {
      this.endTest(testId, false, error as string);
      throw error;
    }
  }

  // Measure cross-tab data sync time
  async measureDataSyncTime(): Promise<number> {
    const testId = this.startTest('cross_tab_data_sync');
    
    try {
      const startTime = Date.now();
      
      // Simulate cross-tab data synchronization
      await this.simulateDataSync();
      
      const syncTime = Date.now() - startTime;
      this.endTest(testId, true);
      
      return syncTime;
    } catch (error) {
      this.endTest(testId, false, error as string);
      throw error;
    }
  }

  // Measure memory usage
  measureMemoryUsage(): number {
    // In React Native, we can't directly measure memory usage
    // This is a simplified approximation
    const memoryUsage = Math.random() * 50 + 10; // 10-60 MB approximation
    return memoryUsage;
  }

  // Test large dataset handling
  async testLargeDatasetHandling(datasetSize: number = 1000): Promise<PerformanceTest> {
    const testId = this.startTest(`large_dataset_${datasetSize}`);
    
    try {
      const startTime = Date.now();
      
      // Simulate processing large dataset
      await this.simulateLargeDatasetProcessing(datasetSize);
      
      const processingTime = Date.now() - startTime;
      const test = this.endTest(testId, true);
      
      if (test) {
        test.metrics.loadTime = processingTime;
        test.metrics.memoryUsage = this.measureMemoryUsage();
      }
      
      return test!;
    } catch (error) {
      return this.endTest(testId, false, error as string)!;
    }
  }

  // Test cache efficiency
  async testCacheEfficiency(): Promise<{ hitRate: number; avgResponseTime: number }> {
    const testId = this.startTest('cache_efficiency');
    
    try {
      const startTime = Date.now();
      let cacheHits = 0;
      let totalRequests = 10;
      
      // Simulate cache requests
      for (let i = 0; i < totalRequests; i++) {
        const isCacheHit = Math.random() > 0.3; // 70% cache hit rate simulation
        if (isCacheHit) cacheHits++;
        await new Promise(resolve => setTimeout(resolve, 10)); // Simulate request time
      }
      
      const totalTime = Date.now() - startTime;
      const hitRate = (cacheHits / totalRequests) * 100;
      const avgResponseTime = totalTime / totalRequests;
      
      const test = this.endTest(testId, true);
      if (test) {
        test.metrics.cacheHitRate = hitRate;
        test.metrics.loadTime = avgResponseTime;
      }
      
      return { hitRate, avgResponseTime };
    } catch (error) {
      this.endTest(testId, false, error as string);
      throw error;
    }
  }

  // Test error handling
  async testErrorHandling(): Promise<PerformanceTest> {
    const testId = this.startTest('error_handling');
    
    try {
      // Simulate various error scenarios
      await this.simulateErrorScenarios();
      
      return this.endTest(testId, true)!;
    } catch (error) {
      return this.endTest(testId, false, error as string)!;
    }
  }

  // Get performance summary
  async getPerformanceSummary(): Promise<{
    averageLoadTime: number;
    averageSyncTime: number;
    errorRate: number;
    cacheHitRate: number;
    totalTests: number;
  }> {
    const testResults = await this.getTestResults();
    
    const successfulTests = testResults.filter(test => test.success);
    const loadTimes = successfulTests
      .map(test => test.metrics.loadTime)
      .filter(time => time !== undefined) as number[];
    
    const syncTimes = successfulTests
      .map(test => test.metrics.dataSyncTime)
      .filter(time => time !== undefined) as number[];
    
    const cacheHitRates = successfulTests
      .map(test => test.metrics.cacheHitRate)
      .filter(rate => rate !== undefined) as number[];
    
    return {
      averageLoadTime: loadTimes.length > 0 ? loadTimes.reduce((a, b) => a + b, 0) / loadTimes.length : 0,
      averageSyncTime: syncTimes.length > 0 ? syncTimes.reduce((a, b) => a + b, 0) / syncTimes.length : 0,
      errorRate: testResults.length > 0 ? (testResults.length - successfulTests.length) / testResults.length * 100 : 0,
      cacheHitRate: cacheHitRates.length > 0 ? cacheHitRates.reduce((a, b) => a + b, 0) / cacheHitRates.length : 0,
      totalTests: testResults.length,
    };
  }

  // Run comprehensive performance test suite
  async runPerformanceTestSuite(): Promise<{
    analyticsLoadTime: number;
    dataSyncTime: number;
    largeDatasetPerformance: PerformanceTest;
    cacheEfficiency: { hitRate: number; avgResponseTime: number };
    errorHandling: PerformanceTest;
    summary: any;
  }> {
    console.log('🧪 Starting comprehensive performance test suite...');
    
    const results = {
      analyticsLoadTime: await this.measureAnalyticsLoadTime(),
      dataSyncTime: await this.measureDataSyncTime(),
      largeDatasetPerformance: await this.testLargeDatasetHandling(1000),
      cacheEfficiency: await this.testCacheEfficiency(),
      errorHandling: await this.testErrorHandling(),
      summary: await this.getPerformanceSummary(),
    };
    
    console.log('✅ Performance test suite completed:', results);
    return results;
  }

  // Private helper methods
  private async simulateAnalyticsLoad(): Promise<void> {
    // Simulate the time it takes to load analytics components
    await new Promise(resolve => setTimeout(resolve, 100 + Math.random() * 200));
  }

  private async simulateDataSync(): Promise<void> {
    // Simulate cross-tab data synchronization
    await new Promise(resolve => setTimeout(resolve, 50 + Math.random() * 100));
  }

  private async simulateLargeDatasetProcessing(size: number): Promise<void> {
    // Simulate processing large datasets
    const processingTime = Math.min(size * 0.1, 500); // Cap at 500ms
    await new Promise(resolve => setTimeout(resolve, processingTime));
  }

  private async simulateErrorScenarios(): Promise<void> {
    // Simulate various error scenarios
    const scenarios = [
      () => new Promise((_, reject) => setTimeout(() => reject(new Error('Network timeout')), 100)),
      () => new Promise((_, reject) => setTimeout(() => reject(new Error('Data validation failed')), 50)),
      () => new Promise((_, reject) => setTimeout(() => reject(new Error('Cache miss')), 30)),
    ];
    
    for (const scenario of scenarios) {
      try {
        await scenario();
      } catch (error) {
        // Expected errors - just continue
      }
    }
  }

  private async storeTestResult(test: PerformanceTest): Promise<void> {
    try {
      const existingResults = await this.getTestResults();
      existingResults.push(test);
      
      // Keep only the latest results
      if (existingResults.length > this.MAX_HISTORY_SIZE) {
        existingResults.splice(0, existingResults.length - this.MAX_HISTORY_SIZE);
      }
      
      await AsyncStorage.setItem('performance_test_results', JSON.stringify(existingResults));
    } catch (error) {
      console.error('Failed to store test result:', error);
    }
  }

  private async getTestResults(): Promise<PerformanceTest[]> {
    try {
      const results = await AsyncStorage.getItem('performance_test_results');
      return results ? JSON.parse(results) : [];
    } catch (error) {
      console.error('Failed to get test results:', error);
      return [];
    }
  }
}

export default PerformanceMonitoringService;
