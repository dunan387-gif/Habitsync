import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { Brain, Activity, TrendingUp, BarChart3, RefreshCw, Trash2 } from 'lucide-react-native';
import { useTheme } from '@/context/ThemeContext';
import { useLanguage } from '@/context/LanguageContext';
import { mlPatternRecognitionService, UserBehaviorPattern, MLModelMetrics } from '@/services/MLPatternRecognitionService';

export default function MLPatternVisualizer() {
  const { currentTheme } = useTheme();
  const { t } = useLanguage();
  const [patterns, setPatterns] = useState<UserBehaviorPattern[]>([]);
  const [metrics, setMetrics] = useState<MLModelMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const styles = createStyles(currentTheme.colors);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [patternsData, metricsData] = await Promise.all([
        mlPatternRecognitionService.getPatterns(),
        mlPatternRecognitionService.getModelMetrics()
      ]);
      setPatterns(patternsData);
      setMetrics(metricsData);
    } catch (error) {
      console.error('Failed to load ML data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearData = () => {
    Alert.alert(
      'Clear ML Data',
      'This will delete all collected patterns and reset the ML model. This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            try {
              await mlPatternRecognitionService.clearData();
              await loadData();
              Alert.alert('Success', 'ML data cleared successfully');
            } catch (error) {
              Alert.alert('Error', 'Failed to clear ML data');
            }
          }
        }
      ]
    );
  };

  const getPatternTypeStats = () => {
    const stats = patterns.reduce((acc, pattern) => {
      acc[pattern.patternType] = (acc[pattern.patternType] || 0) + 1;
      return acc;
    }, {} as any);

    return Object.entries(stats).map(([type, count]) => ({
      type,
      count: count as number,
      percentage: ((count as number) / patterns.length * 100).toFixed(1)
    }));
  };

  const getResponseTypeStats = () => {
    const stats = patterns.reduce((acc, pattern) => {
      acc[pattern.features.responseType] = (acc[pattern.features.responseType] || 0) + 1;
      return acc;
    }, {} as any);

    return Object.entries(stats).map(([type, count]) => ({
      type,
      count: count as number,
      percentage: ((count as number) / patterns.length * 100).toFixed(1)
    }));
  };

  const getTimeOfDayStats = () => {
    const timeSlots = {
      'Early Morning (6-9)': 0,
      'Morning (9-12)': 0,
      'Afternoon (12-15)': 0,
      'Late Afternoon (15-18)': 0,
      'Evening (18-21)': 0,
      'Night (21-6)': 0
    };

    patterns.forEach(pattern => {
      const hour = pattern.features.timeOfDay;
      if (hour >= 6 && hour < 9) timeSlots['Early Morning (6-9)']++;
      else if (hour >= 9 && hour < 12) timeSlots['Morning (9-12)']++;
      else if (hour >= 12 && hour < 15) timeSlots['Afternoon (12-15)']++;
      else if (hour >= 15 && hour < 18) timeSlots['Late Afternoon (15-18)']++;
      else if (hour >= 18 && hour < 21) timeSlots['Evening (18-21)']++;
      else timeSlots['Night (21-6)']++;
    });

    return Object.entries(timeSlots).map(([slot, count]) => ({
      slot,
      count,
      percentage: patterns.length > 0 ? (count / patterns.length * 100).toFixed(1) : '0'
    }));
  };

  const getMoodIntensityStats = () => {
    const moodRanges = {
      'Very Low (1-2)': 0,
      'Low (3-4)': 0,
      'Medium (5-6)': 0,
      'High (7-8)': 0,
      'Very High (9-10)': 0
    };

    patterns.forEach(pattern => {
      const intensity = pattern.features.moodIntensity;
      if (intensity <= 2) moodRanges['Very Low (1-2)']++;
      else if (intensity <= 4) moodRanges['Low (3-4)']++;
      else if (intensity <= 6) moodRanges['Medium (5-6)']++;
      else if (intensity <= 8) moodRanges['High (7-8)']++;
      else moodRanges['Very High (9-10)']++;
    });

    return Object.entries(moodRanges).map(([range, count]) => ({
      range,
      count,
      percentage: patterns.length > 0 ? (count / patterns.length * 100).toFixed(1) : '0'
    }));
  };

  const getConfidenceStats = () => {
    const confidenceRanges = {
      'Low (0-0.3)': 0,
      'Medium (0.3-0.7)': 0,
      'High (0.7-1.0)': 0
    };

    patterns.forEach(pattern => {
      const confidence = pattern.confidence;
      if (confidence <= 0.3) confidenceRanges['Low (0-0.3)']++;
      else if (confidence <= 0.7) confidenceRanges['Medium (0.3-0.7)']++;
      else confidenceRanges['High (0.7-1.0)']++;
    });

    return Object.entries(confidenceRanges).map(([range, count]) => ({
      range,
      count,
      percentage: patterns.length > 0 ? (count / patterns.length * 100).toFixed(1) : '0'
    }));
  };

  const patternTypeStats = getPatternTypeStats();
  const responseTypeStats = getResponseTypeStats();
  const timeOfDayStats = getTimeOfDayStats();
  const moodIntensityStats = getMoodIntensityStats();
  const confidenceStats = getConfidenceStats();

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Brain size={24} color={currentTheme.colors.primary} />
        <Text style={styles.title}>ML Pattern Analysis</Text>
      </View>

      {/* Model Metrics */}
      {metrics && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Model Performance</Text>
          <View style={styles.metricsGrid}>
            <View style={styles.metricItem}>
              <Text style={styles.metricLabel}>Accuracy</Text>
              <Text style={styles.metricValue}>{(metrics.accuracy * 100).toFixed(1)}%</Text>
            </View>
            <View style={styles.metricItem}>
              <Text style={styles.metricLabel}>Precision</Text>
              <Text style={styles.metricValue}>{(metrics.precision * 100).toFixed(1)}%</Text>
            </View>
            <View style={styles.metricItem}>
              <Text style={styles.metricLabel}>Recall</Text>
              <Text style={styles.metricValue}>{(metrics.recall * 100).toFixed(1)}%</Text>
            </View>
            <View style={styles.metricItem}>
              <Text style={styles.metricLabel}>F1 Score</Text>
              <Text style={styles.metricValue}>{(metrics.f1Score * 100).toFixed(1)}%</Text>
            </View>
          </View>
          <View style={styles.metricsInfo}>
            <Text style={styles.metricsText}>
              Training Samples: {metrics.trainingSamples}
            </Text>
            <Text style={styles.metricsText}>
              Predictions Made: {metrics.predictionCount}
            </Text>
            <Text style={styles.metricsText}>
              Last Trained: {new Date(metrics.lastTrained).toLocaleDateString()}
            </Text>
          </View>
        </View>
      )}

      {/* Pattern Overview */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Pattern Overview</Text>
        <View style={styles.overviewCard}>
          <Text style={styles.overviewText}>
            Total Patterns: {patterns.length}
          </Text>
          <Text style={styles.overviewText}>
            Data Quality: {patterns.length > 50 ? 'Excellent' : patterns.length > 20 ? 'Good' : 'Needs More Data'}
          </Text>
        </View>
      </View>

      {/* Pattern Types */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Pattern Types</Text>
        {patternTypeStats.map((stat, index) => (
          <View key={index} style={styles.statRow}>
            <Text style={styles.statLabel}>{stat.type.replace(/_/g, ' ')}</Text>
            <View style={styles.statValue}>
              <Text style={styles.statCount}>{stat.count}</Text>
              <Text style={styles.statPercentage}>({stat.percentage}%)</Text>
            </View>
          </View>
        ))}
      </View>

      {/* Response Types */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>User Response Patterns</Text>
        {responseTypeStats.map((stat, index) => (
          <View key={index} style={styles.statRow}>
            <Text style={styles.statLabel}>{stat.type}</Text>
            <View style={styles.statValue}>
              <Text style={styles.statCount}>{stat.count}</Text>
              <Text style={styles.statPercentage}>({stat.percentage}%)</Text>
            </View>
          </View>
        ))}
      </View>

      {/* Time of Day Analysis */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Optimal Times</Text>
        {timeOfDayStats.map((stat, index) => (
          <View key={index} style={styles.statRow}>
            <Text style={styles.statLabel}>{stat.slot}</Text>
            <View style={styles.statValue}>
              <Text style={styles.statCount}>{stat.count}</Text>
              <Text style={styles.statPercentage}>({stat.percentage}%)</Text>
            </View>
          </View>
        ))}
      </View>

      {/* Mood Intensity Analysis */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Mood Intensity Patterns</Text>
        {moodIntensityStats.map((stat, index) => (
          <View key={index} style={styles.statRow}>
            <Text style={styles.statLabel}>{stat.range}</Text>
            <View style={styles.statValue}>
              <Text style={styles.statCount}>{stat.count}</Text>
              <Text style={styles.statPercentage}>({stat.percentage}%)</Text>
            </View>
          </View>
        ))}
      </View>

      {/* Confidence Analysis */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Pattern Confidence</Text>
        {confidenceStats.map((stat, index) => (
          <View key={index} style={styles.statRow}>
            <Text style={styles.statLabel}>{stat.range}</Text>
            <View style={styles.statValue}>
              <Text style={styles.statCount}>{stat.count}</Text>
              <Text style={styles.statPercentage}>({stat.percentage}%)</Text>
            </View>
          </View>
        ))}
      </View>

      {/* Actions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Actions</Text>
        
        <TouchableOpacity 
          style={styles.actionButton} 
          onPress={loadData}
          disabled={isLoading}
        >
          <RefreshCw size={16} color={currentTheme.colors.primary} />
          <Text style={[styles.actionButtonText, { color: currentTheme.colors.primary }]}>
            {isLoading ? 'Loading...' : 'Refresh Data'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.actionButton} 
          onPress={handleClearData}
        >
          <Trash2 size={16} color={currentTheme.colors.error} />
          <Text style={[styles.actionButtonText, { color: currentTheme.colors.error }]}>
            Clear All Data
          </Text>
        </TouchableOpacity>
      </View>

      {/* Insights */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>AI Insights</Text>
        <View style={styles.insightsCard}>
          {patterns.length === 0 ? (
            <Text style={styles.insightText}>
              No patterns collected yet. Start using the app to build ML insights!
            </Text>
          ) : patterns.length < 20 ? (
            <Text style={styles.insightText}>
              Collecting initial patterns... Need more data for accurate predictions.
            </Text>
          ) : (
            <>
              <Text style={styles.insightText}>
                • Most active time: {timeOfDayStats.reduce((a, b) => a.count > b.count ? a : b).slot}
              </Text>
              <Text style={styles.insightText}>
                • Most common response: {responseTypeStats.reduce((a, b) => a.count > b.count ? a : b).type}
              </Text>
              <Text style={styles.insightText}>
                • Average mood intensity: {(patterns.reduce((sum, p) => sum + p.features.moodIntensity, 0) / patterns.length).toFixed(1)}/10
              </Text>
              <Text style={styles.insightText}>
                • Pattern confidence: {(patterns.reduce((sum, p) => sum + p.confidence, 0) / patterns.length * 100).toFixed(1)}%
              </Text>
            </>
          )}
        </View>
      </View>
    </ScrollView>
  );
}

const createStyles = (colors: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
    marginLeft: 8,
  },
  section: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 12,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  metricItem: {
    width: '48%',
    backgroundColor: colors.card,
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    alignItems: 'center',
  },
  metricLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  metricValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.primary,
  },
  metricsInfo: {
    backgroundColor: colors.card,
    padding: 12,
    borderRadius: 8,
  },
  metricsText: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  overviewCard: {
    backgroundColor: colors.card,
    padding: 16,
    borderRadius: 8,
  },
  overviewText: {
    fontSize: 14,
    color: colors.text,
    marginBottom: 4,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  statLabel: {
    fontSize: 14,
    color: colors.text,
    flex: 1,
  },
  statValue: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statCount: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginRight: 8,
  },
  statPercentage: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 8,
  },
  insightsCard: {
    backgroundColor: colors.card,
    padding: 16,
    borderRadius: 8,
  },
  insightText: {
    fontSize: 14,
    color: colors.text,
    marginBottom: 8,
    lineHeight: 20,
  },
});
