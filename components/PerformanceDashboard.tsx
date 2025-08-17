import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  RefreshControl,
} from 'react-native';
import { useTheme } from '@/context/ThemeContext';
import { useLanguage } from '@/context/LanguageContext';
import { usePerformanceMonitoring } from '@/hooks/usePerformanceMonitoring';
import { useMemoryManagement } from '@/hooks/useMemoryManagement';
import { useBundleOptimization } from '@/hooks/useBundleOptimization';
import { useNetworkOptimization } from '@/hooks/useNetworkOptimization';
import { useAndroidLifecycle } from '@/hooks/useAndroidLifecycle';
import AdvancedCacheService from '@/services/AdvancedCacheService';
import NetworkPerformanceService from '@/services/NetworkPerformanceService';
import BackgroundTaskService from '@/services/BackgroundTaskService';
import OptimizedLoading from './OptimizedLoading';

interface PerformanceMetric {
  label: string;
  value: string | number;
  unit?: string;
  status: 'excellent' | 'good' | 'warning' | 'critical';
  description?: string;
}

interface PerformanceSection {
  title: string;
  metrics: PerformanceMetric[];
  actions?: {
    label: string;
    onPress: () => void;
    type: 'primary' | 'secondary' | 'danger';
  }[];
}

export default function PerformanceDashboard() {
  const { currentTheme } = useTheme();
  const { t } = useLanguage();
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [sections, setSections] = useState<PerformanceSection[]>([]);

  // Performance hooks
  const { trackEvent } = usePerformanceMonitoring();
  const { memoryInfo, optimizeMemory, cleanupMemory } = useMemoryManagement();
  const { metrics: bundleMetrics, recommendations: bundleRecommendations, optimizeBundle } = useBundleOptimization();
  const { connectionQuality, connectionSpeed } = useNetworkOptimization();
  const { appState, isInBackground } = useAndroidLifecycle();

  // Services
  const cacheService = AdvancedCacheService.getInstance();
  const networkService = NetworkPerformanceService.getInstance();
  const backgroundService = BackgroundTaskService.getInstance();

  const loadPerformanceData = useCallback(async () => {
    try {
      setIsLoading(true);

      // Get cache stats
      const cacheStats = cacheService.getStats();
      
      // Get network stats
      const networkStats = networkService.getStats();
      
      // Get background task stats
      const backgroundStats = backgroundService.getTaskStats();

      // Create performance sections
      const newSections: PerformanceSection[] = [
        // Memory Performance
        {
          title: t('performance.memory.title') || 'Memory Performance',
          metrics: [
            {
              label: t('performance.memory.used') || 'Memory Used',
              value: memoryInfo?.usedMemoryMB || 0,
              unit: 'MB',
              status: getMemoryStatus(memoryInfo?.usedMemoryMB || 0),
              description: t('performance.memory.usedDesc') || 'Current memory usage',
            },
            {
              label: t('performance.memory.available') || 'Available Memory',
              value: memoryInfo?.availableMemoryMB || 0,
              unit: 'MB',
              status: getMemoryStatus(memoryInfo?.availableMemoryMB || 0, true),
              description: t('performance.memory.availableDesc') || 'Available system memory',
            },
            {
              label: t('performance.memory.percentage') || 'Usage Percentage',
              value: memoryInfo?.memoryUsagePercent || 0,
              unit: '%',
              status: getMemoryPercentageStatus(memoryInfo?.memoryUsagePercent || 0),
              description: t('performance.memory.percentageDesc') || 'Memory usage percentage',
            },
          ],
          actions: [
            {
              label: t('performance.memory.optimize') || 'Optimize Memory',
              onPress: () => {
                optimizeMemory();
                trackEvent('memory_optimization_manual', 0);
              },
              type: 'primary',
            },
            {
              label: t('performance.memory.cleanup') || 'Cleanup',
              onPress: () => {
                cleanupMemory();
                trackEvent('memory_cleanup_manual', 0);
              },
              type: 'secondary',
            },
          ],
        },

        // Bundle Performance
        {
          title: t('performance.bundle.title') || 'Bundle Performance',
          metrics: [
            {
              label: t('performance.bundle.size') || 'Bundle Size',
              value: (bundleMetrics.totalSize / 1024 / 1024).toFixed(1),
              unit: 'MB',
              status: getBundleSizeStatus(bundleMetrics.totalSize),
              description: t('performance.bundle.sizeDesc') || 'Total bundle size',
            },
            {
              label: t('performance.bundle.modules') || 'Modules',
              value: bundleMetrics.modulesCount,
              status: getModuleCountStatus(bundleMetrics.modulesCount),
              description: t('performance.bundle.modulesDesc') || 'Number of modules',
            },
            {
              label: t('performance.bundle.loadTime') || 'Load Time',
              value: bundleMetrics.loadTime.toFixed(0),
              unit: 'ms',
              status: getLoadTimeStatus(bundleMetrics.loadTime),
              description: t('performance.bundle.loadTimeDesc') || 'Bundle load time',
            },
          ],
          actions: [
            {
              label: t('performance.bundle.optimize') || 'Optimize Bundle',
              onPress: () => {
                optimizeBundle();
                trackEvent('bundle_optimization_manual', 0);
              },
              type: 'primary',
            },
          ],
        },

        // Network Performance
        {
          title: t('performance.network.title') || 'Network Performance',
          metrics: [
            {
              label: t('performance.network.quality') || 'Connection Quality',
              value: connectionQuality,
              status: getConnectionQualityStatus(connectionQuality),
              description: t('performance.network.qualityDesc') || 'Network connection quality',
            },
            {
              label: t('performance.network.speed') || 'Connection Speed',
              value: connectionSpeed.toFixed(1),
              unit: 'Mbps',
              status: getConnectionSpeedStatus(connectionSpeed),
              description: t('performance.network.speedDesc') || 'Network connection speed',
            },
            {
              label: t('performance.network.responseTime') || 'Avg Response Time',
              value: networkStats.averageResponseTime.toFixed(0),
              unit: 'ms',
              status: getResponseTimeStatus(networkStats.averageResponseTime),
              description: t('performance.network.responseTimeDesc') || 'Average network response time',
            },
            {
              label: t('performance.network.cacheHitRate') || 'Cache Hit Rate',
              value: (networkStats.cacheHitRate * 100).toFixed(1),
              unit: '%',
              status: getCacheHitRateStatus(networkStats.cacheHitRate),
              description: t('performance.network.cacheHitRateDesc') || 'Network cache hit rate',
            },
          ],
          actions: [
            {
              label: t('performance.network.clearCache') || 'Clear Cache',
              onPress: () => {
                networkService.clearCache();
                trackEvent('network_cache_cleared', 0);
              },
              type: 'secondary',
            },
          ],
        },

        // Cache Performance
        {
          title: t('performance.cache.title') || 'Cache Performance',
          metrics: [
            {
              label: t('performance.cache.entries') || 'Cache Entries',
              value: cacheStats.totalEntries,
              status: getCacheEntriesStatus(cacheStats.totalEntries),
              description: t('performance.cache.entriesDesc') || 'Number of cached items',
            },
            {
              label: t('performance.cache.size') || 'Cache Size',
              value: (cacheStats.totalSize / 1024 / 1024).toFixed(1),
              unit: 'MB',
              status: getCacheSizeStatus(cacheStats.totalSize),
              description: t('performance.cache.sizeDesc') || 'Total cache size',
            },
            {
              label: t('performance.cache.hitRate') || 'Hit Rate',
              value: (cacheStats.hitRate * 100).toFixed(1),
              unit: '%',
              status: getCacheHitRateStatus(cacheStats.hitRate),
              description: t('performance.cache.hitRateDesc') || 'Cache hit rate',
            },
          ],
          actions: [
            {
              label: t('performance.cache.clear') || 'Clear Cache',
              onPress: () => {
                cacheService.clear();
                trackEvent('cache_cleared', 0);
              },
              type: 'danger',
            },
          ],
        },

        // Background Tasks
        {
          title: t('performance.background.title') || 'Background Tasks',
          metrics: [
            {
              label: t('performance.background.total') || 'Total Tasks',
              value: backgroundStats.total,
              status: getBackgroundTasksStatus(backgroundStats.total),
              description: t('performance.background.totalDesc') || 'Total background tasks',
            },
            {
              label: t('performance.background.running') || 'Running Tasks',
              value: backgroundStats.running,
              status: getRunningTasksStatus(backgroundStats.running),
              description: t('performance.background.runningDesc') || 'Currently running tasks',
            },
            {
              label: t('performance.background.queued') || 'Queued Tasks',
              value: backgroundStats.queued,
              status: getQueuedTasksStatus(backgroundStats.queued),
              description: t('performance.background.queuedDesc') || 'Tasks waiting in queue',
            },
          ],
          actions: [
            {
              label: t('performance.background.clear') || 'Clear All Tasks',
              onPress: () => {
                backgroundService.clearAllTasks();
                trackEvent('background_tasks_cleared', 0);
              },
              type: 'danger',
            },
          ],
        },

        // App State
        {
          title: t('performance.appState.title') || 'App State',
          metrics: [
            {
              label: t('performance.appState.status') || 'Current State',
              value: appState,
              status: getAppStateStatus(appState),
              description: t('performance.appState.statusDesc') || 'Current application state',
            },
            {
              label: t('performance.appState.background') || 'Background Mode',
              value: isInBackground ? 'Yes' : 'No',
              status: isInBackground ? 'warning' : 'good',
              description: t('performance.appState.backgroundDesc') || 'App running in background',
            },
          ],
        },
      ];

      setSections(newSections);
    } catch (error) {
      console.error('Failed to load performance data:', error);
      Alert.alert(
        t('performance.error.title') || 'Error',
        t('performance.error.message') || 'Failed to load performance data'
      );
    } finally {
      setIsLoading(false);
    }
  }, [
    memoryInfo,
    bundleMetrics,
    connectionQuality,
    connectionSpeed,
    appState,
    isInBackground,
    t,
    trackEvent,
    optimizeMemory,
    cleanupMemory,
    optimizeBundle,
  ]);

  useEffect(() => {
    loadPerformanceData();
  }, [loadPerformanceData]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadPerformanceData();
    setRefreshing(false);
  }, [loadPerformanceData]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'excellent':
        return currentTheme.colors.success;
      case 'good':
        return currentTheme.colors.primary;
      case 'warning':
        return currentTheme.colors.warning;
      case 'critical':
        return currentTheme.colors.error;
      default:
        return currentTheme.colors.textMuted;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'excellent':
        return '✅';
      case 'good':
        return '✅';
      case 'warning':
        return '⚠️';
      case 'critical':
        return '🚨';
      default:
        return 'ℹ️';
    }
  };

  if (isLoading) {
    return <OptimizedLoading message={t('performance.loading') || 'Loading performance data...'} />;
  }

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: currentTheme.colors.background }]}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          colors={[currentTheme.colors.primary]}
          tintColor={currentTheme.colors.primary}
        />
      }
    >
      <View style={styles.header}>
        <Text style={[styles.title, { color: currentTheme.colors.text }]}>
          {t('performance.title') || 'Performance Dashboard'}
        </Text>
        <Text style={[styles.subtitle, { color: currentTheme.colors.textMuted }]}>
          {t('performance.subtitle') || 'Monitor and optimize app performance'}
        </Text>
      </View>

      {sections.map((section, sectionIndex) => (
        <View key={sectionIndex} style={[styles.section, { backgroundColor: currentTheme.colors.card }]}>
          <Text style={[styles.sectionTitle, { color: currentTheme.colors.text }]}>
            {section.title}
          </Text>

          {section.metrics.map((metric, metricIndex) => (
            <View key={metricIndex} style={styles.metricRow}>
              <View style={styles.metricInfo}>
                <Text style={[styles.metricLabel, { color: currentTheme.colors.text }]}>
                  {metric.label}
                </Text>
                {metric.description && (
                  <Text style={[styles.metricDescription, { color: currentTheme.colors.textMuted }]}>
                    {metric.description}
                  </Text>
                )}
              </View>
              <View style={styles.metricValue}>
                <Text style={[styles.metricValueText, { color: getStatusColor(metric.status) }]}>
                  {getStatusIcon(metric.status)} {metric.value}
                  {metric.unit && (
                    <Text style={[styles.metricUnit, { color: currentTheme.colors.textMuted }]}>
                      {metric.unit}
                    </Text>
                  )}
                </Text>
              </View>
            </View>
          ))}

          {section.actions && (
            <View style={styles.actions}>
              {section.actions.map((action, actionIndex) => (
                <TouchableOpacity
                  key={actionIndex}
                  style={[
                    styles.actionButton,
                    {
                      backgroundColor: action.type === 'primary' 
                        ? currentTheme.colors.primary 
                        : action.type === 'danger'
                        ? currentTheme.colors.error
                        : currentTheme.colors.border,
                    },
                  ]}
                  onPress={action.onPress}
                >
                  <Text style={[
                    styles.actionButtonText,
                    {
                      color: action.type === 'secondary' 
                        ? currentTheme.colors.text 
                        : currentTheme.colors.background,
                    },
                  ]}>
                    {action.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
      ))}
    </ScrollView>
  );
}

// Helper functions for status determination
function getMemoryStatus(memoryMB: number, isAvailable = false): 'excellent' | 'good' | 'warning' | 'critical' {
  if (isAvailable) {
    return memoryMB > 500 ? 'excellent' : memoryMB > 200 ? 'good' : memoryMB > 100 ? 'warning' : 'critical';
  }
  return memoryMB < 100 ? 'excellent' : memoryMB < 200 ? 'good' : memoryMB < 300 ? 'warning' : 'critical';
}

function getMemoryPercentageStatus(percentage: number): 'excellent' | 'good' | 'warning' | 'critical' {
  return percentage < 50 ? 'excellent' : percentage < 70 ? 'good' : percentage < 85 ? 'warning' : 'critical';
}

function getBundleSizeStatus(sizeBytes: number): 'excellent' | 'good' | 'warning' | 'critical' {
  const sizeMB = sizeBytes / 1024 / 1024;
  return sizeMB < 3 ? 'excellent' : sizeMB < 5 ? 'good' : sizeMB < 8 ? 'warning' : 'critical';
}

function getModuleCountStatus(count: number): 'excellent' | 'good' | 'warning' | 'critical' {
  return count < 500 ? 'excellent' : count < 800 ? 'good' : count < 1200 ? 'warning' : 'critical';
}

function getLoadTimeStatus(timeMs: number): 'excellent' | 'good' | 'warning' | 'critical' {
  return timeMs < 1000 ? 'excellent' : timeMs < 2000 ? 'good' : timeMs < 3000 ? 'warning' : 'critical';
}

function getConnectionQualityStatus(quality: string): 'excellent' | 'good' | 'warning' | 'critical' {
  return quality === 'excellent' ? 'excellent' : quality === 'good' ? 'good' : quality === 'poor' ? 'warning' : 'critical';
}

function getConnectionSpeedStatus(speedMbps: number): 'excellent' | 'good' | 'warning' | 'critical' {
  return speedMbps > 10 ? 'excellent' : speedMbps > 5 ? 'good' : speedMbps > 2 ? 'warning' : 'critical';
}

function getResponseTimeStatus(timeMs: number): 'excellent' | 'good' | 'warning' | 'critical' {
  return timeMs < 200 ? 'excellent' : timeMs < 500 ? 'good' : timeMs < 1000 ? 'warning' : 'critical';
}

function getCacheHitRateStatus(rate: number): 'excellent' | 'good' | 'warning' | 'critical' {
  return rate > 0.8 ? 'excellent' : rate > 0.6 ? 'good' : rate > 0.4 ? 'warning' : 'critical';
}

function getCacheEntriesStatus(count: number): 'excellent' | 'good' | 'warning' | 'critical' {
  return count < 100 ? 'excellent' : count < 300 ? 'good' : count < 500 ? 'warning' : 'critical';
}

function getCacheSizeStatus(sizeBytes: number): 'excellent' | 'good' | 'warning' | 'critical' {
  const sizeMB = sizeBytes / 1024 / 1024;
  return sizeMB < 10 ? 'excellent' : sizeMB < 25 ? 'good' : sizeMB < 50 ? 'warning' : 'critical';
}

function getBackgroundTasksStatus(count: number): 'excellent' | 'good' | 'warning' | 'critical' {
  return count < 10 ? 'excellent' : count < 25 ? 'good' : count < 50 ? 'warning' : 'critical';
}

function getRunningTasksStatus(count: number): 'excellent' | 'good' | 'warning' | 'critical' {
  return count < 3 ? 'excellent' : count < 6 ? 'good' : count < 10 ? 'warning' : 'critical';
}

function getQueuedTasksStatus(count: number): 'excellent' | 'good' | 'warning' | 'critical' {
  return count < 5 ? 'excellent' : count < 15 ? 'good' : count < 30 ? 'warning' : 'critical';
}

function getAppStateStatus(state: string): 'excellent' | 'good' | 'warning' | 'critical' {
  return state === 'active' ? 'excellent' : state === 'inactive' ? 'warning' : 'critical';
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 20,
    paddingBottom: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 10,
  },
  section: {
    margin: 15,
    padding: 15,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 15,
  },
  metricRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  metricInfo: {
    flex: 1,
  },
  metricLabel: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 2,
  },
  metricDescription: {
    fontSize: 12,
  },
  metricValue: {
    alignItems: 'flex-end',
  },
  metricValueText: {
    fontSize: 16,
    fontWeight: '600',
  },
  metricUnit: {
    fontSize: 14,
    fontWeight: '400',
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 15,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
  },
  actionButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    minWidth: 100,
    alignItems: 'center',
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
}); 