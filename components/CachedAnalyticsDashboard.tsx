import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useTheme } from '@/context/ThemeContext';
import { useLanguage } from '@/context/LanguageContext';
import { useAuth } from '@/context/AuthContext';
import { useHabits } from '@/context/HabitContext';
import { useCachedData, useCache } from '@/hooks/useCache';
import { CacheKeys, CacheExpiry } from '@/services/CacheService';
import { EnhancedAnalyticsService } from '@/services/EnhancedAnalyticsService';
import { WellnessIntegrationService } from '@/services/WellnessIntegrationService';
import {
  BarChart3,
  TrendingUp,
  Activity,
  RefreshCw,
  Database,
  Zap,
} from 'lucide-react-native';

interface CachedAnalyticsDashboardProps {
  timeframe?: '7d' | '30d' | '90d' | '365d';
}

export default function CachedAnalyticsDashboard({ 
  timeframe = '30d' 
}: CachedAnalyticsDashboardProps) {
  const { currentTheme } = useTheme();
  const { t } = useLanguage();
  const { user } = useAuth();
  const { habits } = useHabits();
  const { getStats, getHitRate, clearByPattern } = useCache();
  
  const [cacheStats, setCacheStats] = useState<any>(null);
  const [showCacheStats, setShowCacheStats] = useState(false);

  // Cached analytics data
  const {
    data: analyticsData,
    loading: analyticsLoading,
    error: analyticsError,
    refetch: refetchAnalytics
  } = useCachedData(
    CacheKeys.analytics(user?.id || 'anonymous', timeframe),
    async () => {
      const analyticsService = EnhancedAnalyticsService.getInstance();
      return await analyticsService.getAdvancedAnalytics(
        habits || [],
        [], // moodData - would come from context
        [], // habitMoodData - would come from context
        timeframe,
        user?.id || 'anonymous'
      );
    },
    {
      expiry: CacheExpiry.MEDIUM,
      dependencies: [habits?.length, timeframe]
    }
  );

  // Cached wellness data
  const {
    data: wellnessData,
    loading: wellnessLoading,
    error: wellnessError,
    refetch: refetchWellness
  } = useCachedData(
    CacheKeys.wellnessData(user?.id || 'anonymous', timeframe),
    async () => {
      return await WellnessIntegrationService.performComprehensiveWellnessAnalysis(timeframe);
    },
    {
      expiry: CacheExpiry.LONG,
      dependencies: [timeframe]
    }
  );

  useEffect(() => {
    updateCacheStats();
  }, []);

  const updateCacheStats = () => {
    const stats = getStats();
    const hitRate = getHitRate();
    setCacheStats({ ...stats, hitRate });
  };

  const handleRefresh = async () => {
    await Promise.all([
      refetchAnalytics(),
      refetchWellness()
    ]);
    updateCacheStats();
  };

  const handleClearCache = async () => {
    Alert.alert(
      t('common.confirm'),
      t('analytics.clearCacheConfirm'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.clear'),
          style: 'destructive',
          onPress: async () => {
            await clearByPattern(/analytics_|wellness_/);
            updateCacheStats();
            Alert.alert(t('common.success'), t('analytics.cacheCleared'));
          }
        }
      ]
    );
  };

  const styles = createStyles(currentTheme.colors);

  if (analyticsLoading || wellnessLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={currentTheme.colors.primary} />
        <Text style={styles.loadingText}>{t('common.loading')}</Text>
      </View>
    );
  }

  if (analyticsError || wellnessError) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{t('common.error')}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={handleRefresh}>
          <Text style={styles.retryButtonText}>{t('common.retry')}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Cache Performance Header */}
      <View style={styles.cacheHeader}>
        <View style={styles.cacheStatsRow}>
          <TouchableOpacity
            style={styles.cacheStatsButton}
            onPress={() => setShowCacheStats(!showCacheStats)}
          >
            <Database size={16} color={currentTheme.colors.primary} />
            <Text style={styles.cacheStatsText}>
              {t('analytics.cachePerformance')}
            </Text>
            <Zap size={16} color={currentTheme.colors.primary} />
          </TouchableOpacity>
        </View>

        {showCacheStats && cacheStats && (
          <View style={styles.cacheStatsContainer}>
            <View style={styles.cacheStat}>
              <Text style={styles.cacheStatLabel}>{t('analytics.cacheHits')}</Text>
              <Text style={styles.cacheStatValue}>{cacheStats.hits}</Text>
            </View>
            <View style={styles.cacheStat}>
              <Text style={styles.cacheStatLabel}>{t('analytics.cacheMisses')}</Text>
              <Text style={styles.cacheStatValue}>{cacheStats.misses}</Text>
            </View>
            <View style={styles.cacheStat}>
              <Text style={styles.cacheStatLabel}>{t('analytics.hitRate')}</Text>
              <Text style={styles.cacheStatValue}>
                {(cacheStats.hitRate * 100).toFixed(1)}%
              </Text>
            </View>
            <View style={styles.cacheStat}>
              <Text style={styles.cacheStatLabel}>{t('analytics.cacheSize')}</Text>
              <Text style={styles.cacheStatValue}>{cacheStats.size}</Text>
            </View>
          </View>
        )}
      </View>

      {/* Action Buttons */}
      <View style={styles.actionButtons}>
        <TouchableOpacity style={styles.actionButton} onPress={handleRefresh}>
          <RefreshCw size={16} color={currentTheme.colors.primary} />
          <Text style={styles.actionButtonText}>{t('common.refresh')}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionButton} onPress={handleClearCache}>
          <Database size={16} color={currentTheme.colors.error} />
          <Text style={[styles.actionButtonText, { color: currentTheme.colors.error }]}>
            {t('analytics.clearCache')}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Analytics Data Display */}
      {analyticsData && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('analytics.performanceMetrics')}</Text>
          <View style={styles.metricsGrid}>
            <View style={styles.metricCard}>
              <BarChart3 size={24} color={currentTheme.colors.primary} />
              <Text style={styles.metricValue}>{analyticsData.performanceMetrics.totalHabits}</Text>
              <Text style={styles.metricLabel}>{t('analytics.totalHabits')}</Text>
            </View>
            <View style={styles.metricCard}>
              <TrendingUp size={24} color={currentTheme.colors.success} />
              <Text style={styles.metricValue}>
                {analyticsData.performanceMetrics.completionRate.toFixed(1)}%
              </Text>
              <Text style={styles.metricLabel}>{t('analytics.completionRate')}</Text>
            </View>
            <View style={styles.metricCard}>
              <Activity size={24} color={currentTheme.colors.warning} />
              <Text style={styles.metricValue}>
                {analyticsData.performanceMetrics.averageStreak.toFixed(1)}
              </Text>
              <Text style={styles.metricLabel}>{t('analytics.averageStreak')}</Text>
            </View>
          </View>
        </View>
      )}

      {/* Wellness Data Display */}
      {wellnessData && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('wellness.comprehensiveAnalysis')}</Text>
          <View style={styles.wellnessCard}>
            <Text style={styles.wellnessScore}>
              {wellnessData.wellnessScore.overall.toFixed(1)}
            </Text>
            <Text style={styles.wellnessScoreLabel}>{t('wellness.overallScore')}</Text>
            <Text style={styles.wellnessDescription}>
              {t('wellness.trend.' + wellnessData.wellnessScore.trend)}
            </Text>
          </View>
        </View>
      )}

      {/* Cache Status Indicator */}
      <View style={styles.cacheStatus}>
        <View style={[styles.statusDot, { backgroundColor: currentTheme.colors.success }]} />
        <Text style={styles.cacheStatusText}>
          {t('analytics.cacheEnabled')} • {t('analytics.dataCached')}
        </Text>
      </View>
    </ScrollView>
  );
}

const createStyles = (colors: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: colors.textSecondary,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
    padding: 16,
  },
  errorText: {
    fontSize: 16,
    color: colors.error,
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: colors.surface,
    fontSize: 16,
    fontWeight: '600',
  },
  cacheHeader: {
    marginBottom: 16,
  },
  cacheStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cacheStatsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cacheStatsText: {
    marginHorizontal: 8,
    fontSize: 14,
    color: colors.text,
    fontWeight: '500',
  },
  cacheStatsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
    padding: 16,
    backgroundColor: colors.surface,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cacheStat: {
    alignItems: 'center',
  },
  cacheStatLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  cacheStatValue: {
    fontSize: 16,
    color: colors.text,
    fontWeight: '600',
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    flex: 1,
    marginHorizontal: 4,
  },
  actionButtonText: {
    marginLeft: 8,
    fontSize: 14,
    color: colors.text,
    fontWeight: '500',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 16,
  },
  metricsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  metricCard: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: colors.surface,
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    marginHorizontal: 4,
  },
  metricValue: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
    marginTop: 8,
  },
  metricLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 4,
  },
  wellnessCard: {
    backgroundColor: colors.surface,
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  wellnessScore: {
    fontSize: 48,
    fontWeight: '700',
    color: colors.primary,
  },
  wellnessScoreLabel: {
    fontSize: 16,
    color: colors.textSecondary,
    marginTop: 4,
  },
  wellnessDescription: {
    fontSize: 14,
    color: colors.text,
    textAlign: 'center',
    marginTop: 12,
    lineHeight: 20,
  },
  cacheStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  cacheStatusText: {
    fontSize: 12,
    color: colors.textSecondary,
  },
});
