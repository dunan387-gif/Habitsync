import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import PerformanceMonitoringService from '../services/PerformanceMonitoringService';
import UserExperienceTestingService from '../services/UserExperienceTestingService';
import CrossTabIntegrationTestingService from '../services/CrossTabIntegrationTestingService';

interface TestResults {
  performance?: any;
  ux?: any;
  integration?: any;
  loading: boolean;
  error?: string;
}

const Phase5TestComponent: React.FC = () => {
  const { currentTheme } = useTheme();
  const { t } = useLanguage();
  const [testResults, setTestResults] = useState<TestResults>({ loading: false });
  const [activeTest, setActiveTest] = useState<string>('');

  const styles = createStyles(currentTheme.colors);

  const runPerformanceTests = async () => {
    setActiveTest('performance');
    setTestResults({ loading: true });
    
    try {
      const performanceService = PerformanceMonitoringService.getInstance();
      const results = await performanceService.runPerformanceTestSuite();
      
      setTestResults(prev => ({
        ...prev,
        performance: results,
        loading: false,
      }));
      
      Alert.alert(
        'Performance Tests Complete',
        `Analytics Load Time: ${results.analyticsLoadTime}ms\nData Sync Time: ${results.dataSyncTime}ms\nCache Hit Rate: ${results.cacheEfficiency.hitRate.toFixed(1)}%`
      );
    } catch (error) {
      setTestResults(prev => ({
        ...prev,
        loading: false,
        error: error as string,
      }));
      Alert.alert('Performance Test Error', error as string);
    }
  };

  const runUXTests = async () => {
    setActiveTest('ux');
    setTestResults({ loading: true });
    
    try {
      const uxService = UserExperienceTestingService.getInstance();
      const results = await uxService.runUXTestSuite();
      
      setTestResults(prev => ({
        ...prev,
        ux: results,
        loading: false,
      }));
      
      Alert.alert(
        'UX Tests Complete',
        `Completion Rate: ${results.summary.averageCompletionRate.toFixed(1)}%\nSatisfaction Score: ${results.summary.averageSatisfactionScore.toFixed(1)}/10\nA/B Test Winner: Variant ${results.abTest.winner}`
      );
    } catch (error) {
      setTestResults(prev => ({
        ...prev,
        loading: false,
        error: error as string,
      }));
      Alert.alert('UX Test Error', error as string);
    }
  };

  const runIntegrationTests = async () => {
    setActiveTest('integration');
    setTestResults({ loading: true });
    
    try {
      const integrationService = CrossTabIntegrationTestingService.getInstance();
      const results = await integrationService.runCrossTabIntegrationTestSuite();
      
      setTestResults(prev => ({
        ...prev,
        integration: results,
        loading: false,
      }));
      
      Alert.alert(
        'Integration Tests Complete',
        `Overall Success: ${results.summary.overallSuccess ? '✅' : '❌'}\nConsistency Score: ${results.summary.averageConsistencyScore.toFixed(1)}%\nAverage Response Time: ${results.summary.averageResponseTime.toFixed(0)}ms`
      );
    } catch (error) {
      setTestResults(prev => ({
        ...prev,
        loading: false,
        error: error as string,
      }));
      Alert.alert('Integration Test Error', error as string);
    }
  };

  const runAllTests = async () => {
    setActiveTest('all');
    setTestResults({ loading: true });
    
    try {
      // Run all test suites in parallel
      const [performanceResults, uxResults, integrationResults] = await Promise.all([
        PerformanceMonitoringService.getInstance().runPerformanceTestSuite(),
        UserExperienceTestingService.getInstance().runUXTestSuite(),
        CrossTabIntegrationTestingService.getInstance().runCrossTabIntegrationTestSuite(),
      ]);
      
      setTestResults({
        performance: performanceResults,
        ux: uxResults,
        integration: integrationResults,
        loading: false,
      });
      
      // Calculate overall success
      const overallSuccess = 
        performanceResults.summary.errorRate < 5 &&
        uxResults.summary.averageCompletionRate > 80 &&
        integrationResults.summary.overallSuccess;
      
      Alert.alert(
        'All Tests Complete',
        `Overall Status: ${overallSuccess ? '✅ PASSED' : '❌ NEEDS IMPROVEMENT'}\n\nPerformance: ${performanceResults.analyticsLoadTime < 2000 ? '✅' : '⚠️'}\nUX: ${uxResults.summary.averageSatisfactionScore > 7 ? '✅' : '⚠️'}\nIntegration: ${integrationResults.summary.overallSuccess ? '✅' : '❌'}`
      );
    } catch (error) {
      setTestResults({
        loading: false,
        error: error as string,
      });
      Alert.alert('Test Suite Error', error as string);
    }
  };

  const renderPerformanceResults = () => {
    if (!testResults.performance) return null;
    
    const { performance } = testResults;
    
    return (
      <View style={styles.resultsContainer}>
        <Text style={styles.resultsTitle}>🚀 Performance Test Results</Text>
        
        <View style={styles.metricRow}>
          <Text style={styles.metricLabel}>Analytics Load Time:</Text>
          <Text style={[styles.metricValue, performance.analyticsLoadTime < 2000 ? styles.success : styles.warning]}>
            {performance.analyticsLoadTime}ms
          </Text>
        </View>
        
        <View style={styles.metricRow}>
          <Text style={styles.metricLabel}>Data Sync Time:</Text>
          <Text style={[styles.metricValue, performance.dataSyncTime < 500 ? styles.success : styles.warning]}>
            {performance.dataSyncTime}ms
          </Text>
        </View>
        
        <View style={styles.metricRow}>
          <Text style={styles.metricLabel}>Cache Hit Rate:</Text>
          <Text style={[styles.metricValue, performance.cacheEfficiency.hitRate > 70 ? styles.success : styles.warning]}>
            {performance.cacheEfficiency.hitRate.toFixed(1)}%
          </Text>
        </View>
        
        <View style={styles.metricRow}>
          <Text style={styles.metricLabel}>Error Rate:</Text>
          <Text style={[styles.metricValue, performance.summary.errorRate < 5 ? styles.success : styles.error]}>
            {performance.summary.errorRate.toFixed(1)}%
          </Text>
        </View>
      </View>
    );
  };

  const renderUXResults = () => {
    if (!testResults.ux) return null;
    
    const { ux } = testResults;
    
    return (
      <View style={styles.resultsContainer}>
        <Text style={styles.resultsTitle}>👥 UX Test Results</Text>
        
        <View style={styles.metricRow}>
          <Text style={styles.metricLabel}>Completion Rate:</Text>
          <Text style={[styles.metricValue, ux.summary.averageCompletionRate > 80 ? styles.success : styles.warning]}>
            {ux.summary.averageCompletionRate.toFixed(1)}%
          </Text>
        </View>
        
        <View style={styles.metricRow}>
          <Text style={styles.metricLabel}>Satisfaction Score:</Text>
          <Text style={[styles.metricValue, ux.summary.averageSatisfactionScore > 7 ? styles.success : styles.warning]}>
            {ux.summary.averageSatisfactionScore.toFixed(1)}/10
          </Text>
        </View>
        
        <View style={styles.metricRow}>
          <Text style={styles.metricLabel}>A/B Test Winner:</Text>
          <Text style={[styles.metricValue, ux.abTest.winner === 'B' ? styles.success : styles.warning]}>
            Variant {ux.abTest.winner}
          </Text>
        </View>
        
        <View style={styles.metricRow}>
          <Text style={styles.metricLabel}>Recommendation Follow-through:</Text>
          <Text style={[styles.metricValue, ux.recommendationEffectiveness.followThroughRate > 25 ? styles.success : styles.warning]}>
            {ux.recommendationEffectiveness.followThroughRate.toFixed(1)}%
          </Text>
        </View>
      </View>
    );
  };

  const renderIntegrationResults = () => {
    if (!testResults.integration) return null;
    
    const { integration } = testResults;
    
    return (
      <View style={styles.resultsContainer}>
        <Text style={styles.resultsTitle}>🔄 Integration Test Results</Text>
        
        <View style={styles.metricRow}>
          <Text style={styles.metricLabel}>Overall Success:</Text>
          <Text style={[styles.metricValue, integration.summary.overallSuccess ? styles.success : styles.error]}>
            {integration.summary.overallSuccess ? '✅ PASSED' : '❌ FAILED'}
          </Text>
        </View>
        
        <View style={styles.metricRow}>
          <Text style={styles.metricLabel}>Data Consistency:</Text>
          <Text style={[styles.metricValue, integration.summary.averageConsistencyScore > 95 ? styles.success : styles.warning]}>
            {integration.summary.averageConsistencyScore.toFixed(1)}%
          </Text>
        </View>
        
        <View style={styles.metricRow}>
          <Text style={styles.metricLabel}>Average Response Time:</Text>
          <Text style={[styles.metricValue, integration.summary.averageResponseTime < 200 ? styles.success : styles.warning]}>
            {integration.summary.averageResponseTime.toFixed(0)}ms
          </Text>
        </View>
        
        <View style={styles.metricRow}>
          <Text style={styles.metricLabel}>Total Errors:</Text>
          <Text style={[styles.metricValue, integration.summary.totalErrors === 0 ? styles.success : styles.error]}>
            {integration.summary.totalErrors}
          </Text>
        </View>
      </View>
    );
  };

  const renderTestButtons = () => (
    <View style={styles.buttonContainer}>
      <TouchableOpacity
        style={[styles.testButton, activeTest === 'performance' && styles.activeButton]}
        onPress={runPerformanceTests}
        disabled={testResults.loading}
      >
        <Text style={styles.buttonText}>🚀 Performance Tests</Text>
      </TouchableOpacity>
      
      <TouchableOpacity
        style={[styles.testButton, activeTest === 'ux' && styles.activeButton]}
        onPress={runUXTests}
        disabled={testResults.loading}
      >
        <Text style={styles.buttonText}>👥 UX Tests</Text>
      </TouchableOpacity>
      
      <TouchableOpacity
        style={[styles.testButton, activeTest === 'integration' && styles.activeButton]}
        onPress={runIntegrationTests}
        disabled={testResults.loading}
      >
        <Text style={styles.buttonText}>🔄 Integration Tests</Text>
      </TouchableOpacity>
      
      <TouchableOpacity
        style={[styles.testButton, styles.runAllButton, activeTest === 'all' && styles.activeButton]}
        onPress={runAllTests}
        disabled={testResults.loading}
      >
        <Text style={styles.buttonText}>🧪 Run All Tests</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Phase 5: Testing & Optimization</Text>
        <Text style={styles.subtitle}>
          Comprehensive testing suite for performance, UX, and cross-tab integration
        </Text>
      </View>

      {renderTestButtons()}

      {testResults.loading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={currentTheme.colors.primary} />
          <Text style={styles.loadingText}>Running {activeTest} tests...</Text>
        </View>
      )}

      {testResults.error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>❌ Error: {testResults.error}</Text>
        </View>
      )}

      {renderPerformanceResults()}
      {renderUXResults()}
      {renderIntegrationResults()}

      <View style={styles.summaryContainer}>
        <Text style={styles.summaryTitle}>📊 Test Summary</Text>
        <Text style={styles.summaryText}>
          Phase 5 testing validates our simplified analytics system across three key areas:
        </Text>
        
        <View style={styles.summaryItem}>
          <Text style={styles.summaryItemTitle}>🚀 Performance</Text>
          <Text style={styles.summaryItemText}>
            • Analytics tab load time {'<'} 2 seconds{'\n'}
            • Cross-tab data sync {'<'} 500ms{'\n'}
            • Cache efficiency {'>'} 70%{'\n'}
            • Error rate {'<'} 5%
          </Text>
        </View>
        
        <View style={styles.summaryItem}>
          <Text style={styles.summaryItemTitle}>👥 User Experience</Text>
          <Text style={styles.summaryItemText}>
            • Completion rate {'>'} 80%{'\n'}
            • Satisfaction score {'>'} 7/10{'\n'}
            • A/B test validates improvements{'\n'}
            • Recommendation follow-through {'>'} 25%
          </Text>
        </View>
        
        <View style={styles.summaryItem}>
          <Text style={styles.summaryItemTitle}>🔄 Integration</Text>
          <Text style={styles.summaryItemText}>
            • Data consistency {'>'} 95%{'\n'}
            • Cross-tab response time {'<'} 200ms{'\n'}
            • Error recovery 100%{'\n'}
            • State consistency maintained
          </Text>
        </View>
      </View>
    </ScrollView>
  );
};

const createStyles = (colors: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: colors.textSecondary,
    lineHeight: 22,
  },
  buttonContainer: {
    padding: 20,
    gap: 12,
  },
  testButton: {
    backgroundColor: colors.card,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.border,
  },
  activeButton: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  runAllButton: {
    backgroundColor: colors.success,
    borderColor: colors.success,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: colors.textSecondary,
  },
  errorContainer: {
    margin: 20,
    padding: 16,
    backgroundColor: colors.error + '15',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.error,
  },
  errorText: {
    color: colors.error,
    fontSize: 14,
    fontWeight: '500',
  },
  resultsContainer: {
    margin: 20,
    padding: 16,
    backgroundColor: colors.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  resultsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 16,
  },
  metricRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  metricLabel: {
    fontSize: 14,
    color: colors.textSecondary,
    flex: 1,
  },
  metricValue: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  success: {
    color: colors.success,
  },
  warning: {
    color: colors.warning,
  },
  error: {
    color: colors.error,
  },
  summaryContainer: {
    margin: 20,
    padding: 16,
    backgroundColor: colors.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 12,
  },
  summaryText: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
    marginBottom: 16,
  },
  summaryItem: {
    marginBottom: 16,
  },
  summaryItemTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  summaryItemText: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 18,
  },
});

export default Phase5TestComponent;
