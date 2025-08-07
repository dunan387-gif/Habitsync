// Automated Performance Optimization Recommendations Component

import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { Lightbulb, Zap, TrendingUp, CheckCircle, Clock, AlertTriangle } from 'lucide-react-native';
import { usePerformanceMonitoring } from '@/hooks/usePerformanceMonitoring';
import { useMemoryManagement } from '@/hooks/useMemoryManagement';
import { useNetworkOptimization } from '@/hooks/useNetworkOptimization';
import { useTheme } from '@/context/ThemeContext';
import { useLanguage } from '@/context/LanguageContext';

interface PerformanceRecommendation {
  id: string;
  type: 'critical' | 'high' | 'medium' | 'low';
  category: 'memory' | 'network' | 'rendering' | 'caching' | 'general';
  title: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  effort: 'low' | 'medium' | 'high';
  estimatedImprovement: number; // percentage
  action?: () => void;
  actionLabel?: string;
  applied: boolean;
  timestamp: number;
}

interface PerformanceRecommendationsProps {
  maxRecommendations?: number;
  showApplied?: boolean;
  autoApply?: boolean;
}

export default function PerformanceRecommendations({
  maxRecommendations = 10,
  showApplied = false,
  autoApply = false
}: PerformanceRecommendationsProps) {
  const { currentTheme } = useTheme();
  const { t } = useLanguage();
  const [recommendations, setRecommendations] = useState<PerformanceRecommendation[]>([]);
  const [appliedRecommendations, setAppliedRecommendations] = useState<string[]>([]);

  // Performance monitoring hooks
  const { metrics, events, clearEvents } = usePerformanceMonitoring();
  const { memoryInfo, isMemoryLow, isMemoryCritical, optimizeMemory, forceGarbageCollection, clearAllCaches } = useMemoryManagement();
  const { getNetworkStats, clearRequestHistory, clearAllCaches: clearNetworkCaches } = useNetworkOptimization();

  // Performance thresholds - adjusted for React Native
  const thresholds = useMemo(() => ({
    renderTime: { warning: 33, critical: 66 }, // 30fps and 15fps thresholds
    memoryUsage: { warning: 60, critical: 80 }, // Lower thresholds for mobile
    cacheHitRate: { warning: 70, critical: 50 }, // Higher cache expectations
    networkFailures: { warning: 2, critical: 5 }, // Lower failure tolerance
    responseTime: { warning: 800, critical: 2000 } // Faster response expectations
  }), []);

  // Generate recommendations based on performance metrics
  useEffect(() => {
    const newRecommendations: PerformanceRecommendation[] = [];

    // Render performance recommendations
    if (metrics.renderTime > thresholds.renderTime.critical) {
      newRecommendations.push({
        id: `render_critical_${Date.now()}`,
        type: 'critical',
        category: 'rendering',
        title: t('performance.recommendations.criticalRenderIssue'),
        description: t('performance.recommendations.criticalRenderIssueMessage', { time: metrics.renderTime.toFixed(1) }),
        impact: 'high',
        effort: 'medium',
        estimatedImprovement: 60,
        action: () => {
          clearEvents();
          Alert.alert(
            t('performance.recommendations.renderOptimizationApplied'),
            t('performance.recommendations.renderOptimizationAppliedMessage')
          );
        },
        actionLabel: t('performance.recommendations.resetMonitoring'),
        applied: false,
        timestamp: Date.now()
      });
    } else if (metrics.renderTime > thresholds.renderTime.warning) {
      newRecommendations.push({
        id: `render_warning_${Date.now()}`,
        type: 'high',
        category: 'rendering',
        title: t('performance.recommendations.renderOptimization'),
        description: t('performance.messages.renderTimeOptimization', { time: metrics.renderTime.toFixed(1) }),
        impact: 'medium',
        effort: 'low',
        estimatedImprovement: 30,
        applied: false,
        timestamp: Date.now()
      });
    }

    // Memory recommendations
    if (memoryInfo) {
      if (memoryInfo.memoryUsagePercent > thresholds.memoryUsage.critical) {
        newRecommendations.push({
          id: `memory_critical_${Date.now()}`,
          type: 'critical',
          category: 'memory',
          title: t('performance.recommendations.criticalMemoryUsage'),
          description: t('performance.messages.memoryUsageCritical', { usage: memoryInfo.memoryUsagePercent.toFixed(1) }),
          impact: 'high',
          effort: 'low',
          estimatedImprovement: 40,
          action: optimizeMemory,
          actionLabel: t('performance.alerts.optimizeMemory'),
          applied: false,
          timestamp: Date.now()
        });
      } else if (memoryInfo.memoryUsagePercent > thresholds.memoryUsage.warning) {
        newRecommendations.push({
          id: `memory_warning_${Date.now()}`,
          type: 'high',
          category: 'memory',
          title: t('performance.recommendations.highMemoryUsage'),
          description: t('performance.messages.memoryUsageHigh', { usage: memoryInfo.memoryUsagePercent.toFixed(1) }),
          impact: 'medium',
          effort: 'low',
          estimatedImprovement: 25,
          action: forceGarbageCollection,
          actionLabel: t('performance.recommendations.forceGC'),
          applied: false,
          timestamp: Date.now()
        });
      }

      // Memory leak detection
      if (memoryInfo.usedMemoryMB > 200) {
        newRecommendations.push({
          id: `memory_leak_${Date.now()}`,
          type: 'medium',
          category: 'memory',
          title: t('performance.recommendations.potentialMemoryLeak'),
          description: t('performance.messages.potentialMemoryLeak'),
          impact: 'medium',
          effort: 'high',
          estimatedImprovement: 50,
          action: clearAllCaches,
          actionLabel: t('performance.recommendations.clearCaches'),
          applied: false,
          timestamp: Date.now()
        });
      }
    }

    // Cache performance recommendations
    if (metrics.cacheHitRate < thresholds.cacheHitRate.critical) {
      newRecommendations.push({
        id: `cache_critical_${Date.now()}`,
        type: 'critical',
        category: 'caching',
        title: t('performance.recommendations.poorCachePerformance'),
        description: t('performance.messages.cacheHitRatePoor', { rate: metrics.cacheHitRate.toFixed(1) }),
        impact: 'high',
        effort: 'medium',
        estimatedImprovement: 45,
        action: clearAllCaches,
        actionLabel: t('performance.recommendations.resetCache'),
        applied: false,
        timestamp: Date.now()
      });
    } else if (metrics.cacheHitRate < thresholds.cacheHitRate.warning) {
      newRecommendations.push({
        id: `cache_warning_${Date.now()}`,
        type: 'medium',
        category: 'caching',
        title: t('performance.recommendations.cacheOptimization'),
        description: t('performance.messages.cacheHitRateWarning', { rate: metrics.cacheHitRate.toFixed(1) }),
        impact: 'medium',
        effort: 'medium',
        estimatedImprovement: 20,
        applied: false,
        timestamp: Date.now()
      });
    }

    // Network recommendations
    const networkStats = getNetworkStats();
    if (networkStats.failedRequests > thresholds.networkFailures.critical) {
      newRecommendations.push({
        id: `network_critical_${Date.now()}`,
        type: 'critical',
        category: 'network',
        title: t('performance.recommendations.networkIssues'),
        description: t('performance.messages.networkRequestsFailed', { count: networkStats.failedRequests }),
        impact: 'high',
        effort: 'medium',
        estimatedImprovement: 35,
        action: clearRequestHistory,
        actionLabel: t('performance.recommendations.clearHistory'),
        applied: false,
        timestamp: Date.now()
      });
    } else if (networkStats.failedRequests > thresholds.networkFailures.warning) {
      newRecommendations.push({
        id: `network_warning_${Date.now()}`,
        type: 'medium',
        category: 'network',
        title: t('performance.recommendations.networkOptimization'),
        description: t('performance.messages.networkRequestsFailedWarning', { count: networkStats.failedRequests }),
        impact: 'medium',
        effort: 'low',
        estimatedImprovement: 15,
        applied: false,
        timestamp: Date.now()
      });
    }

    // Response time recommendations
    if (networkStats.averageResponseTime > thresholds.responseTime.critical) {
      newRecommendations.push({
        id: `response_critical_${Date.now()}`,
        type: 'critical',
        category: 'network',
        title: t('performance.recommendations.slowResponseTimes'),
        description: t('performance.messages.slowResponseTime', { time: networkStats.averageResponseTime.toFixed(0) }),
        impact: 'high',
        effort: 'high',
        estimatedImprovement: 40,
        applied: false,
        timestamp: Date.now()
      });
    }

    // General recommendations based on overall performance
    const overallScore = calculateOverallScore();
    if (overallScore < 50) {
      newRecommendations.push({
        id: `overall_critical_${Date.now()}`,
        type: 'critical',
        category: 'general',
        title: t('performance.recommendations.overallPerformanceIssues'),
        description: t('performance.messages.multiplePerformanceIssues'),
        impact: 'high',
        effort: 'high',
        estimatedImprovement: 60,
        action: () => {
          optimizeMemory();
          forceGarbageCollection();
          clearAllCaches();
          clearRequestHistory();
          clearEvents();
        },
        actionLabel: t('performance.recommendations.optimizeAll'),
        applied: false,
        timestamp: Date.now()
      });
    }

    // Add new recommendations
    setRecommendations(prev => {
      const combined = [...prev, ...newRecommendations];
      return combined
        .filter(rec => !rec.applied || showApplied)
        .sort((a, b) => {
          // Sort by priority: critical > high > medium > low
          const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
          return priorityOrder[a.type] - priorityOrder[b.type];
        })
        .slice(0, maxRecommendations);
    });
  }, [metrics, memoryInfo, getNetworkStats, thresholds, clearEvents, optimizeMemory, forceGarbageCollection, clearAllCaches, clearRequestHistory, showApplied, maxRecommendations]);

  // Calculate overall performance score
  const calculateOverallScore = () => {
    let score = 100;
    
    // Deduct points for performance issues
    if (metrics.renderTime > thresholds.renderTime.critical) score -= 30;
    else if (metrics.renderTime > thresholds.renderTime.warning) score -= 15;
    
    if (memoryInfo && memoryInfo.memoryUsagePercent > thresholds.memoryUsage.critical) score -= 25;
    else if (memoryInfo && memoryInfo.memoryUsagePercent > thresholds.memoryUsage.warning) score -= 10;
    
    if (metrics.cacheHitRate < thresholds.cacheHitRate.critical) score -= 20;
    else if (metrics.cacheHitRate < thresholds.cacheHitRate.warning) score -= 10;
    
    const networkStats = getNetworkStats();
    if (networkStats.failedRequests > thresholds.networkFailures.critical) score -= 25;
    else if (networkStats.failedRequests > thresholds.networkFailures.warning) score -= 10;
    
    return Math.max(0, score);
  };

  // Apply recommendation
  const applyRecommendation = (recommendation: PerformanceRecommendation) => {
    if (recommendation.action) {
      recommendation.action();
    }
    
    setAppliedRecommendations(prev => [...prev, recommendation.id]);
    setRecommendations(prev => prev.map(rec => 
      rec.id === recommendation.id ? { ...rec, applied: true } : rec
    ));
    
    Alert.alert(
      t('performance.recommendations.recommendationApplied'),
      t('performance.recommendations.recommendationAppliedMessage', { title: recommendation.title })
    );
  };

  // Get recommendation style
  const getRecommendationStyle = (type: PerformanceRecommendation['type']) => {
    switch (type) {
      case 'critical':
        return {
          icon: AlertTriangle,
          color: currentTheme.colors.error,
          backgroundColor: currentTheme.colors.error + '20'
        };
      case 'high':
        return {
          icon: TrendingUp,
          color: currentTheme.colors.warning,
          backgroundColor: currentTheme.colors.warning + '20'
        };
      case 'medium':
        return {
          icon: Lightbulb,
          color: currentTheme.colors.primary,
          backgroundColor: currentTheme.colors.primary + '20'
        };
      case 'low':
        return {
          icon: Clock,
          color: currentTheme.colors.textSecondary,
          backgroundColor: currentTheme.colors.textSecondary + '20'
        };
    }
  };

  // Get impact and effort indicators
  const getImpactEffortIndicator = (impact: string, effort: string) => {
    const impactColors = {
      high: currentTheme.colors.error,
      medium: currentTheme.colors.warning,
      low: currentTheme.colors.success
    };
    
    const effortColors = {
      high: currentTheme.colors.error,
      medium: currentTheme.colors.warning,
      low: currentTheme.colors.success
    };

    return {
      impactColor: impactColors[impact as keyof typeof impactColors],
      effortColor: effortColors[effort as keyof typeof effortColors]
    };
  };

  const styles = createStyles(currentTheme.colors);

  if (recommendations.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <CheckCircle size={48} color={currentTheme.colors.success} />
        <Text style={styles.emptyTitle}>{t('performance.recommendations.greatPerformance')}</Text>
                  <Text style={styles.emptyDescription}>
            {t('performance.recommendations.noOptimizationsNeeded')}
          </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Lightbulb size={24} color={currentTheme.colors.primary} />
          <Text style={styles.headerTitle}>{t('performance.recommendations.title')}</Text>
        </View>
        <View style={styles.headerRight}>
                      <Text style={styles.scoreText}>
              {t('performance.dashboard.score')}: {calculateOverallScore()}
            </Text>
        </View>
      </View>

      {/* Recommendations List */}
      <ScrollView style={styles.recommendationsList}>
        {recommendations.map((recommendation) => {
          const style = getRecommendationStyle(recommendation.type);
          const indicators = getImpactEffortIndicator(recommendation.impact, recommendation.effort);
          const RecommendationIcon = style.icon;

          return (
            <View
              key={recommendation.id}
              style={[
                styles.recommendationItem,
                { backgroundColor: style.backgroundColor },
                recommendation.applied && styles.appliedItem
              ]}
            >
              <View style={styles.recommendationHeader}>
                <View style={styles.recommendationIcon}>
                  <RecommendationIcon size={20} color={style.color} />
                </View>
                <View style={styles.recommendationContent}>
                  <Text style={[styles.recommendationTitle, { color: style.color }]}>
                    {recommendation.title}
                  </Text>
                  <Text style={styles.recommendationDescription}>
                    {recommendation.description}
                  </Text>
                  
                  {/* Impact and Effort Indicators */}
                  <View style={styles.indicators}>
                    <View style={styles.indicator}>
                      <Text style={styles.indicatorLabel}>{t('performance.recommendations.impact')}:</Text>
                      <View style={[styles.indicatorDot, { backgroundColor: indicators.impactColor }]} />
                      <Text style={styles.indicatorText}>{recommendation.impact}</Text>
                    </View>
                    <View style={styles.indicator}>
                      <Text style={styles.indicatorLabel}>{t('performance.recommendations.effort')}:</Text>
                      <View style={[styles.indicatorDot, { backgroundColor: indicators.effortColor }]} />
                      <Text style={styles.indicatorText}>{recommendation.effort}</Text>
                    </View>
                    <View style={styles.indicator}>
                      <Text style={styles.indicatorLabel}>{t('performance.recommendations.improvement')}:</Text>
                      <Text style={[styles.improvementText, { color: currentTheme.colors.success }]}>
                        +{recommendation.estimatedImprovement}%
                      </Text>
                    </View>
                  </View>
                </View>
              </View>

              {/* Action Button */}
              {recommendation.action && recommendation.actionLabel && !recommendation.applied && (
                <TouchableOpacity
                  style={[styles.actionButton, { backgroundColor: style.color }]}
                  onPress={() => applyRecommendation(recommendation)}
                >
                  <Zap size={16} color="#FFFFFF" />
                  <Text style={styles.actionButtonText}>
                    {recommendation.actionLabel}
                  </Text>
                </TouchableOpacity>
              )}

              {/* Applied Status */}
              {recommendation.applied && (
                <View style={styles.appliedStatus}>
                  <CheckCircle size={16} color={currentTheme.colors.success} />
                  <Text style={styles.appliedText}>{t('performance.recommendations.applied')}</Text>
                </View>
              )}
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}

const createStyles = (colors: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyDescription: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
    marginLeft: 12,
  },
  headerRight: {
    backgroundColor: colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  scoreText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.background,
  },
  recommendationsList: {
    flex: 1,
  },
  recommendationItem: {
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 12,
    padding: 16,
  },
  appliedItem: {
    opacity: 0.7,
  },
  recommendationHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  recommendationIcon: {
    marginRight: 12,
    marginTop: 2,
  },
  recommendationContent: {
    flex: 1,
  },
  recommendationTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  recommendationDescription: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 12,
    lineHeight: 20,
  },
  indicators: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  indicator: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  indicatorLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginRight: 4,
  },
  indicatorDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 4,
  },
  indicatorText: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.text,
    textTransform: 'capitalize',
  },
  improvementText: {
    fontSize: 12,
    fontWeight: '600',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    marginTop: 12,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    marginLeft: 6,
  },
  appliedStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
    paddingVertical: 8,
    backgroundColor: colors.success + '20',
    borderRadius: 8,
  },
  appliedText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.success,
    marginLeft: 6,
  },
}); 