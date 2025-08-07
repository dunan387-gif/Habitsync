// Performance Monitoring Dashboard Component

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions, Alert } from 'react-native';
import { Activity, Cpu, HardDrive, Wifi, AlertTriangle, CheckCircle, TrendingUp, TrendingDown, Zap, Shield, RefreshCw, Settings } from 'lucide-react-native';
import { usePerformanceMonitoring } from '@/hooks/usePerformanceMonitoring';
import { useMemoryManagement } from '@/hooks/useMemoryManagement';
import { useNetworkOptimization } from '@/hooks/useNetworkOptimization';
import { useTheme } from '@/context/ThemeContext';
import { useLanguage } from '@/context/LanguageContext';

const { width } = Dimensions.get('window');

export default function PerformanceDashboard() {
  const { currentTheme } = useTheme();
  const { t } = useLanguage();
  const [selectedTab, setSelectedTab] = useState<'overview' | 'memory' | 'network'>('overview');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdateTime, setLastUpdateTime] = useState(Date.now());

  // Performance monitoring hooks
  const { 
    metrics, 
    getAverageMetrics, 
    trackRenderTime, 
    trackEvent,
    startRenderTracking,
    endRenderTracking,
    clearEvents 
  } = usePerformanceMonitoring({
    enableTracking: true,
    enableMemoryTracking: true,
    enableNetworkLatencyTracking: true,
    enableRenderTimeTracking: true,
    enableCachePerformanceTracking: true
  });

  const { 
    memoryInfo, 
    isMemoryLow, 
    isMemoryCritical, 
    forceGarbageCollection,
    cleanupMemory,
    optimizeMemory,
    clearAllCaches,
    monitorMemoryUsage,
    memoryAlerts,
    clearMemoryAlerts
  } = useMemoryManagement({
    enableMonitoring: true,
    enableAutoCleanup: true,
    enableGarbageCollection: true,
    enableMemoryOptimization: true
  });

  const { 
    getNetworkStats, 
    isOnline, 
    connectionQuality,
    makeRequest,
    testNetworkConnectivity,
    clearAllCaches: clearNetworkCaches,
    getRequestHistory,
    clearRequestHistory
  } = useNetworkOptimization({
    enableBatching: true,
    enableCaching: true,
    enableRetry: true,
    enableConnectionPooling: true
  });

  // Track render time for this component
  useEffect(() => {
    startRenderTracking();
    return () => {
      endRenderTracking('PerformanceDashboard');
    };
  }, [startRenderTracking, endRenderTracking]);

  // Performance score calculation
  const performanceScore = useMemo(() => {
    // Memory score - higher usage = lower score
    const memoryScore = memoryInfo ? Math.max(0, 100 - memoryInfo.memoryUsagePercent) : 100;
    
    // Network score - based on connection quality
    const networkScore = isOnline ? (connectionQuality === 'excellent' ? 100 : connectionQuality === 'good' ? 80 : 60) : 0;
    
    // Render score - based on render time (60fps = 16ms)
    const renderScore = metrics.renderTime < 16 ? 100 : Math.max(0, 100 - (metrics.renderTime - 16) * 2);
    
    // Cache score - based on cache hit rate
    const cacheScore = metrics.cacheHitRate;
    
    // Calculate weighted average
    const weightedScore = (memoryScore * 0.3 + networkScore * 0.3 + renderScore * 0.3 + cacheScore * 0.1);
    
    return Math.round(weightedScore);
  }, [memoryInfo, isOnline, connectionQuality, metrics.renderTime, metrics.cacheHitRate]);

  const performanceStatus = useMemo(() => {
    if (performanceScore >= 90) return { 
      status: 'excellent', 
      color: currentTheme.colors.success, 
      icon: CheckCircle,
      message: t('performance.status.excellentMessage'),
      bgColor: currentTheme.colors.success + '15'
    };
    if (performanceScore >= 70) return { 
      status: 'good', 
      color: currentTheme.colors.warning, 
      icon: Activity,
      message: t('performance.status.goodMessage'),
      bgColor: currentTheme.colors.warning + '15'
    };
    return { 
      status: 'poor', 
      color: currentTheme.colors.error, 
      icon: AlertTriangle,
      message: t('performance.status.poorMessage'),
      bgColor: currentTheme.colors.error + '15'
    };
  }, [performanceScore, currentTheme.colors, t]);

  // Refresh performance data
  const refreshData = useCallback(async () => {
    setIsRefreshing(true);
    try {
      // Force memory monitoring update
      monitorMemoryUsage();
      
      // Test network connectivity
      await testNetworkConnectivity();
      
      // Track the refresh action
      trackEvent('dashboard_refresh', 0, { timestamp: Date.now() });
      
      setLastUpdateTime(Date.now());
    } catch (error) {
      console.error('Error refreshing performance data:', error);
    } finally {
      setIsRefreshing(false);
    }
  }, [monitorMemoryUsage, testNetworkConnectivity, trackEvent]);

  // Memory optimization actions
  const handleMemoryOptimization = useCallback(() => {
    Alert.alert(
      t('performance.recommendations.optimizeMemory'),
      t('performance.recommendations.criticalMemoryUsageMessage', { usage: memoryInfo?.memoryUsagePercent.toFixed(1) || '0' }),
      [
        { text: t('cancel'), style: 'cancel' },
        { 
          text: t('performance.recommendations.optimizeAll'), 
          onPress: () => {
            optimizeMemory();
            forceGarbageCollection();
            cleanupMemory();
            trackEvent('memory_optimization_manual', 0, {});
            Alert.alert(t('performance.recommendations.applied'), t('performance.recommendations.recommendationAppliedMessage', { title: t('performance.recommendations.optimizeMemory') }));
          }
        }
      ]
    );
  }, [memoryInfo, optimizeMemory, forceGarbageCollection, cleanupMemory, trackEvent, t]);

  // Clear all caches
  const handleClearCaches = useCallback(() => {
    Alert.alert(
      t('performance.recommendations.clearCaches'),
      t('performance.dialogs.clearCachesConfirm'),
      [
        { text: t('cancel'), style: 'cancel' },
        { 
          text: t('performance.recommendations.clearCaches'), 
          onPress: () => {
            clearAllCaches();
            clearNetworkCaches();
            trackEvent('all_caches_cleared_manual', 0, {});
            Alert.alert(t('performance.recommendations.applied'), t('performance.dialogs.cachesClearedSuccess'));
          }
        }
      ]
    );
  }, [clearAllCaches, clearNetworkCaches, trackEvent, t]);

  // Reset monitoring
  const handleResetMonitoring = useCallback(() => {
    Alert.alert(
      t('performance.recommendations.resetMonitoring'),
      t('performance.dialogs.resetMonitoringConfirm'),
      [
        { text: t('cancel'), style: 'cancel' },
        { 
          text: t('performance.recommendations.resetMonitoring'), 
          onPress: () => {
            clearEvents();
            clearRequestHistory();
            clearMemoryAlerts();
            trackEvent('monitoring_reset', 0, {});
            Alert.alert(t('performance.recommendations.applied'), t('performance.recommendations.renderOptimizationAppliedMessage'));
          }
        }
      ]
    );
  }, [clearEvents, clearRequestHistory, clearMemoryAlerts, trackEvent, t]);

  // Auto-refresh data every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      refreshData();
    }, 30000);

    return () => clearInterval(interval);
  }, [refreshData]);

  const styles = createStyles(currentTheme.colors);

  const renderOverview = () => (
    <View style={styles.section}>
      {/* Performance Score Card */}
      <View style={[styles.scoreCard, { backgroundColor: performanceStatus.bgColor }]}>
        <View style={styles.scoreHeader}>
          <View style={styles.scoreIconContainer}>
            <performanceStatus.icon size={24} color={performanceStatus.color} />
          </View>
          <View style={styles.scoreInfo}>
            <Text style={styles.scoreTitle}>{t('performance.dashboard.overallScore')}</Text>
            <Text style={styles.scoreMessage}>{performanceStatus.message}</Text>
          </View>
          <TouchableOpacity 
            style={styles.refreshButton} 
            onPress={refreshData}
            disabled={isRefreshing}
          >
            <RefreshCw 
              size={20} 
              color={currentTheme.colors.primary} 
              style={isRefreshing ? styles.rotating : undefined}
            />
          </TouchableOpacity>
        </View>
        
        <View style={styles.scoreDisplay}>
          <View style={[styles.scoreCircle, { borderColor: performanceStatus.color }]}>
            <Text style={[styles.scoreText, { color: performanceStatus.color }]}>
              {performanceScore}
            </Text>
            <Text style={styles.scoreLabel}>/100</Text>
          </View>
          <View style={styles.scoreBreakdown}>
            <Text style={styles.scoreStatus}>{t(`performance.status.${performanceStatus.status}`)}</Text>
            <View style={styles.scoreTrend}>
              <TrendingUp size={16} color={currentTheme.colors.success} />
              <Text style={styles.trendText}>+2.5%</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Quick Stats Grid */}
      <View style={styles.statsSection}>
        <Text style={styles.sectionTitle}>{t('performance.dashboard.quickStats')}</Text>
        <View style={styles.statsGrid}>
          <TouchableOpacity style={styles.statCard} onPress={() => setSelectedTab('memory')}>
            <View style={styles.statHeader}>
              <View style={[styles.statIcon, { backgroundColor: currentTheme.colors.primary + '20' }]}>
                <Cpu size={20} color={currentTheme.colors.primary} />
              </View>
              <Text style={styles.statTrend}>+5%</Text>
            </View>
            <Text style={styles.statValue}>{metrics.renderTime.toFixed(1)}ms</Text>
            <Text style={styles.statLabel}>{t('performance.dashboard.renderTime')}</Text>
            <View style={styles.progressBar}>
              <View 
                style={[
                  styles.progressFill, 
                  { 
                    width: `${Math.min(100, (metrics.renderTime / 50) * 100)}%`,
                    backgroundColor: metrics.renderTime > 30 ? currentTheme.colors.error : currentTheme.colors.success
                  }
                ]} 
              />
            </View>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.statCard} onPress={() => setSelectedTab('memory')}>
            <View style={styles.statHeader}>
              <View style={[styles.statIcon, { backgroundColor: currentTheme.colors.warning + '20' }]}>
                <HardDrive size={20} color={currentTheme.colors.warning} />
              </View>
              <Text style={styles.statTrend}>-2%</Text>
            </View>
            <Text style={styles.statValue}>{memoryInfo?.usedMemoryMB.toFixed(1) || '0'}MB</Text>
            <Text style={styles.statLabel}>{t('performance.dashboard.memoryUsage')}</Text>
            <View style={styles.progressBar}>
              <View 
                style={[
                  styles.progressFill, 
                  { 
                    width: `${memoryInfo?.memoryUsagePercent || 0}%`,
                    backgroundColor: isMemoryCritical ? currentTheme.colors.error : 
                                   isMemoryLow ? currentTheme.colors.warning : currentTheme.colors.success
                  }
                ]} 
              />
            </View>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.statCard} onPress={() => setSelectedTab('network')}>
            <View style={styles.statHeader}>
              <View style={[styles.statIcon, { backgroundColor: (isOnline ? currentTheme.colors.success : currentTheme.colors.error) + '20' }]}>
                <Wifi size={20} color={isOnline ? currentTheme.colors.success : currentTheme.colors.error} />
              </View>
              <Text style={styles.statTrend}>{isOnline ? '✓' : '✗'}</Text>
            </View>
            <Text style={styles.statValue}>{connectionQuality}</Text>
            <Text style={styles.statLabel}>{t('performance.dashboard.connection')}</Text>
            <View style={styles.connectionIndicator}>
              <View style={[styles.connectionDot, { backgroundColor: isOnline ? currentTheme.colors.success : currentTheme.colors.error }]} />
              <Text style={styles.connectionText}>
                {isOnline ? t('performance.network.online') : t('performance.network.offline')}
              </Text>
            </View>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.statCard} onPress={handleClearCaches}>
            <View style={styles.statHeader}>
              <View style={[styles.statIcon, { backgroundColor: currentTheme.colors.primary + '20' }]}>
                <Zap size={20} color={currentTheme.colors.primary} />
              </View>
              <Text style={styles.statTrend}>+8%</Text>
            </View>
            <Text style={styles.statValue}>{metrics.cacheHitRate.toFixed(1)}%</Text>
            <Text style={styles.statLabel}>{t('performance.network.cacheHitRate')}</Text>
            <View style={styles.progressBar}>
              <View 
                style={[
                  styles.progressFill, 
                  { 
                    width: `${metrics.cacheHitRate}%`,
                    backgroundColor: metrics.cacheHitRate > 80 ? currentTheme.colors.success : 
                                   metrics.cacheHitRate > 60 ? currentTheme.colors.warning : currentTheme.colors.error
                  }
                ]} 
              />
            </View>
          </TouchableOpacity>
        </View>
      </View>

      {/* Performance Alerts */}
      {(isMemoryCritical || isMemoryLow) && (
        <View style={styles.alertsSection}>
          <Text style={styles.sectionTitle}>{t('performance.dashboard.performanceAlerts')}</Text>
          <View style={styles.alertsContainer}>
            {isMemoryCritical && (
              <TouchableOpacity 
                style={[styles.alertCard, { backgroundColor: currentTheme.colors.error + '15', borderColor: currentTheme.colors.error }]}
                onPress={handleMemoryOptimization}
              >
                <View style={styles.alertHeader}>
                  <AlertTriangle size={20} color={currentTheme.colors.error} />
                  <Text style={[styles.alertTitle, { color: currentTheme.colors.error }]}>
                    {t('performance.dashboard.criticalMemoryUsage')}
                  </Text>
                </View>
                <Text style={styles.alertDescription}>
                  {t('performance.dashboard.criticalMemoryDescription')}
                </Text>
              </TouchableOpacity>
            )}
            {isMemoryLow && !isMemoryCritical && (
              <TouchableOpacity 
                style={[styles.alertCard, { backgroundColor: currentTheme.colors.warning + '15', borderColor: currentTheme.colors.warning }]}
                onPress={handleMemoryOptimization}
              >
                <View style={styles.alertHeader}>
                  <AlertTriangle size={20} color={currentTheme.colors.warning} />
                  <Text style={[styles.alertTitle, { color: currentTheme.colors.warning }]}>
                    {t('performance.dashboard.highMemoryUsage')}
                  </Text>
                </View>
                <Text style={styles.alertDescription}>
                  {t('performance.dashboard.highMemoryDescription')}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      )}

      {/* Performance Tips */}
      <View style={styles.tipsSection}>
        <Text style={styles.sectionTitle}>{t('performance.dashboard.performanceTips')}</Text>
        <View style={styles.tipsContainer}>
          <View style={styles.tipCard}>
            <Shield size={16} color={currentTheme.colors.primary} />
            <Text style={styles.tipText}>{t('performance.dashboard.tip1')}</Text>
          </View>
          <View style={styles.tipCard}>
            <Activity size={16} color={currentTheme.colors.primary} />
            <Text style={styles.tipText}>{t('performance.dashboard.tip2')}</Text>
          </View>
        </View>
      </View>

      {/* Last Updated */}
      <View style={styles.lastUpdatedSection}>
        <Text style={styles.lastUpdatedText}>
          {t('performance.dashboard.lastUpdated')}: {new Date(lastUpdateTime).toLocaleTimeString()}
        </Text>
      </View>
    </View>
  );

  const renderMemoryTab = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{t('performance.memory.title')}</Text>
      
      {memoryInfo && (
        <View style={styles.memoryCard}>
          <View style={styles.memoryHeader}>
            <View style={[styles.memoryIcon, { backgroundColor: currentTheme.colors.warning + '20' }]}>
              <HardDrive size={24} color={currentTheme.colors.warning} />
            </View>
            <View style={styles.memoryInfo}>
              <Text style={styles.memoryTitle}>{t('performance.memory.usage')}</Text>
              <Text style={styles.memorySubtitle}>
                {memoryInfo.usedMemoryMB.toFixed(1)} MB / {memoryInfo.memoryLimitMB.toFixed(1)} MB
              </Text>
            </View>
          </View>
          
          <View style={styles.memoryProgress}>
            <View style={styles.progressBar}>
              <View 
                style={[
                  styles.progressFill, 
                  { 
                    width: `${memoryInfo.memoryUsagePercent}%`,
                    backgroundColor: isMemoryCritical ? currentTheme.colors.error : 
                                   isMemoryLow ? currentTheme.colors.warning : currentTheme.colors.success
                  }
                ]} 
              />
            </View>
            <Text style={styles.progressText}>{memoryInfo.memoryUsagePercent.toFixed(1)}%</Text>
          </View>
          
          <View style={styles.memoryDetails}>
            <View style={styles.memoryRow}>
              <Text style={styles.memoryLabel}>{t('performance.memory.used')}</Text>
              <Text style={styles.memoryValue}>{memoryInfo.usedMemoryMB.toFixed(1)} MB</Text>
            </View>
            <View style={styles.memoryRow}>
              <Text style={styles.memoryLabel}>{t('performance.memory.available')}</Text>
              <Text style={styles.memoryValue}>{memoryInfo.availableMemoryMB.toFixed(1)} MB</Text>
            </View>
            <View style={styles.memoryRow}>
              <Text style={styles.memoryLabel}>{t('performance.memory.limit')}</Text>
              <Text style={styles.memoryValue}>{memoryInfo.memoryLimitMB.toFixed(1)} MB</Text>
            </View>
          </View>
        </View>
      )}

      {/* Memory Actions */}
      <View style={styles.actionsSection}>
        <Text style={styles.sectionTitle}>{t('performance.dialogs.memoryActions')}</Text>
        <View style={styles.actionsGrid}>
          <TouchableOpacity style={styles.actionButton} onPress={handleMemoryOptimization}>
            <Settings size={20} color={currentTheme.colors.primary} />
            <Text style={styles.actionText}>{t('performance.actions.optimizeMemory')}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton} onPress={forceGarbageCollection}>
            <RefreshCw size={20} color={currentTheme.colors.warning} />
            <Text style={styles.actionText}>{t('performance.actions.forceGC')}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton} onPress={handleClearCaches}>
            <Zap size={20} color={currentTheme.colors.error} />
            <Text style={styles.actionText}>{t('performance.actions.clearCaches')}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  const renderNetworkTab = () => {
    const networkStats = getNetworkStats();
    
    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('performance.network.title')}</Text>
        
        <View style={styles.networkCard}>
          <View style={styles.networkHeader}>
            <View style={[styles.networkIcon, { backgroundColor: (isOnline ? currentTheme.colors.success : currentTheme.colors.error) + '20' }]}>
              <Wifi size={24} color={isOnline ? currentTheme.colors.success : currentTheme.colors.error} />
            </View>
            <View style={styles.networkInfo}>
              <Text style={styles.networkTitle}>
                {isOnline ? t('performance.network.online') : t('performance.network.offline')}
              </Text>
              <Text style={styles.networkSubtitle}>{connectionQuality} {t('performance.network.connection')}</Text>
            </View>
          </View>
          
          <View style={styles.networkStats}>
            <View style={styles.networkStat}>
              <Text style={styles.networkStatLabel}>{t('performance.network.totalRequests')}</Text>
              <Text style={styles.networkStatValue}>{networkStats.totalRequests}</Text>
            </View>
            
            <View style={styles.networkStat}>
              <Text style={styles.networkStatLabel}>{t('performance.network.successRate')}</Text>
              <Text style={styles.networkStatValue}>
                {networkStats.totalRequests > 0 
                  ? ((networkStats.successfulRequests / networkStats.totalRequests) * 100).toFixed(1)
                  : '0'}%
              </Text>
            </View>
            
            <View style={styles.networkStat}>
              <Text style={styles.networkStatLabel}>{t('performance.network.averageResponseTime')}</Text>
              <Text style={styles.networkStatValue}>{networkStats.averageResponseTime.toFixed(0)}ms</Text>
            </View>
            
            <View style={styles.networkStat}>
              <Text style={styles.networkStatLabel}>{t('performance.network.cacheHitRate')}</Text>
              <Text style={styles.networkStatValue}>{networkStats.cacheHitRate.toFixed(1)}%</Text>
            </View>
          </View>
        </View>

        {/* Network Actions */}
        <View style={styles.actionsSection}>
          <Text style={styles.sectionTitle}>{t('performance.dialogs.networkActions')}</Text>
          <View style={styles.actionsGrid}>
            <TouchableOpacity style={styles.actionButton} onPress={testNetworkConnectivity}>
              <Wifi size={20} color={currentTheme.colors.primary} />
              <Text style={styles.actionText}>{t('performance.actions.testConnection')}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton} onPress={handleClearCaches}>
              <Zap size={20} color={currentTheme.colors.warning} />
              <Text style={styles.actionText}>{t('performance.actions.clearCaches')}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton} onPress={handleResetMonitoring}>
              <RefreshCw size={20} color={currentTheme.colors.error} />
              <Text style={styles.actionText}>{t('performance.actions.resetMonitoring')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  const renderContent = () => {
    switch (selectedTab) {
      case 'overview':
        return renderOverview();
      case 'memory':
        return renderMemoryTab();
      case 'network':
        return renderNetworkTab();
      default:
        return renderOverview();
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Text style={styles.title}>{t('performance.dashboard.title')}</Text>
          <Text style={styles.subtitle}>{t('performance.dashboard.subtitle')}</Text>
        </View>
      </View>

      {/* Tab Navigation */}
      <View style={styles.tabContainer}>
        {[
          { key: 'overview', label: t('performance.tabs.overview'), icon: Activity },
          { key: 'memory', label: t('performance.tabs.memory'), icon: HardDrive },
          { key: 'network', label: t('performance.tabs.network'), icon: Wifi }
        ].map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={[styles.tab, selectedTab === tab.key && styles.activeTab]}
            onPress={() => setSelectedTab(tab.key as any)}
          >
            <tab.icon size={18} color={selectedTab === tab.key ? currentTheme.colors.background : currentTheme.colors.textSecondary} />
            <Text style={[styles.tabText, selectedTab === tab.key && styles.activeTabText]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Content */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {renderContent()}
      </ScrollView>
    </View>
  );
}

const createStyles = (colors: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerContent: {
    flexDirection: 'column',
    alignItems: 'flex-start',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.text,
  },
  subtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 4,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 8,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: colors.card,
  },
  activeTab: {
    backgroundColor: colors.primary,
  },
  tabText: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  activeTabText: {
    color: colors.background,
  },
  content: {
    flex: 1,
  },
  section: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 16,
  },
  
  // Score Card Styles
  scoreCard: {
    padding: 20,
    borderRadius: 16,
    marginBottom: 24,
  },
  scoreHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  scoreIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  scoreInfo: {
    flex: 1,
  },
  scoreTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 4,
  },
  scoreMessage: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  refreshButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: colors.background,
  },
  rotating: {
    transform: [{ rotate: '360deg' }],
  },
  scoreDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  scoreCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 4,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 20,
    backgroundColor: colors.background,
  },
  scoreText: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  scoreLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: -4,
  },
  scoreBreakdown: {
    flex: 1,
  },
  scoreStatus: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  scoreTrend: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  trendText: {
    marginLeft: 4,
    fontSize: 14,
    color: colors.success,
    fontWeight: '600',
  },
  
  // Stats Section
  statsSection: {
    marginBottom: 24,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statCard: {
    flex: 1,
    minWidth: (width - 60) / 2,
    padding: 16,
    backgroundColor: colors.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  statHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  statIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statTrend: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.success,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 12,
  },
  progressBar: {
    height: 4,
    backgroundColor: colors.border,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  progressText: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 4,
    textAlign: 'right',
  },
  connectionIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  connectionDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  connectionText: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  
  // Alerts Section
  alertsSection: {
    marginBottom: 24,
  },
  alertsContainer: {
    gap: 12,
  },
  alertCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  alertHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  alertTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  alertDescription: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  
  // Tips Section
  tipsSection: {
    marginBottom: 24,
  },
  tipsContainer: {
    gap: 12,
  },
  tipCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: colors.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  tipText: {
    fontSize: 14,
    color: colors.textSecondary,
    marginLeft: 12,
    flex: 1,
  },
  
  // Last Updated Section
  lastUpdatedSection: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  lastUpdatedText: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  
  // Memory Tab Styles
  memoryCard: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 24,
  },
  memoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  memoryIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  memoryInfo: {
    flex: 1,
  },
  memoryTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 4,
  },
  memorySubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  memoryProgress: {
    marginBottom: 20,
  },
  memoryDetails: {
    gap: 12,
  },
  memoryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  memoryLabel: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  memoryValue: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  
  // Network Tab Styles
  networkCard: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 24,
  },
  networkHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  networkIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  networkInfo: {
    flex: 1,
  },
  networkTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 4,
  },
  networkSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  networkStats: {
    gap: 16,
  },
  networkStat: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  networkStatLabel: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  networkStatValue: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  
  // Actions Section
  actionsSection: {
    marginTop: 24,
  },
  actionsGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    backgroundColor: colors.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 8,
  },
  actionText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
}); 