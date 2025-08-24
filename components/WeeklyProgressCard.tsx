import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useCrossTabInsights } from '@/context/CrossTabInsightsContext';
import { useTheme } from '@/context/ThemeContext';
import { useLanguage } from '@/context/LanguageContext';
import { TrendingUp, TrendingDown, Minus, BarChart3, ArrowUp, ArrowDown } from 'lucide-react-native';

interface WeeklyProgressCardProps {
  onRecommendationPress?: () => void;
  compact?: boolean;
}

export default function WeeklyProgressCard({ onRecommendationPress, compact = false }: WeeklyProgressCardProps) {
  const { state } = useCrossTabInsights();
  const { currentTheme } = useTheme();
  const { t } = useLanguage();

  const progress = state.weeklyProgress;
  const homeData = state.data.home;

  if (!progress) {
    return (
      <View style={[styles.container, { backgroundColor: currentTheme.colors.surface }]}>
        <View style={styles.header}>
          <BarChart3 size={20} color={currentTheme.colors.primary} />
          <Text style={[styles.title, { color: currentTheme.colors.text }]}>
            {t('analytics.weeklyProgress.title')}
          </Text>
        </View>
        <Text style={[styles.loadingText, { color: currentTheme.colors.textSecondary }]}>
          {t('analytics.weeklyProgress.loading')}
        </Text>
      </View>
    );
  }

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'improving':
        return <TrendingUp size={20} color={currentTheme.colors.success} />;
      case 'declining':
        return <TrendingDown size={20} color={currentTheme.colors.error} />;
      case 'stable':
        return <Minus size={20} color={currentTheme.colors.warning} />;
      default:
        return <BarChart3 size={20} color={currentTheme.colors.primary} />;
    }
  };

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case 'improving':
        return currentTheme.colors.success;
      case 'declining':
        return currentTheme.colors.error;
      case 'stable':
        return currentTheme.colors.warning;
      default:
        return currentTheme.colors.primary;
    }
  };

  const getPercentageIcon = (percentageChange: number) => {
    if (percentageChange > 0) {
      return <ArrowUp size={16} color={currentTheme.colors.success} />;
    } else if (percentageChange < 0) {
      return <ArrowDown size={16} color={currentTheme.colors.error} />;
    }
    return <Minus size={16} color={currentTheme.colors.warning} />;
  };

  return (
    <View style={[styles.container, { backgroundColor: currentTheme.colors.surface }]}>
      <View style={styles.header}>
        <BarChart3 size={20} color={currentTheme.colors.primary} />
        <Text style={[styles.title, { color: currentTheme.colors.text }]}>
          {t('analytics.weeklyProgress.title')}
        </Text>
        <View style={styles.trendBadge}>
          {getTrendIcon(progress.trend)}
          <Text style={[styles.trendText, { color: getTrendColor(progress.trend) }]}>
            {t(`analytics.trend.${progress.trend}`)}
          </Text>
        </View>
      </View>

      <View style={styles.content}>
        <View style={styles.metricSection}>
          <Text style={[styles.metricLabel, { color: currentTheme.colors.textSecondary }]}>
            {progress.keyMetric}
          </Text>
          <View style={styles.percentageContainer}>
            {getPercentageIcon(progress.percentageChange)}
            <Text style={[styles.percentageText, { color: getTrendColor(progress.trend) }]}>
              {progress.percentageChange > 0 ? '+' : ''}{progress.percentageChange}%
            </Text>
          </View>
        </View>

        <View style={styles.improvementSection}>
          <Text style={[styles.improvementText, { color: currentTheme.colors.text }]}>
            {progress.improvement}
          </Text>
        </View>

        {!compact && (
          <View style={styles.recommendationSection}>
            <Text style={[styles.recommendationLabel, { color: currentTheme.colors.textSecondary }]}>
              {t('analytics.weeklyProgress.recommendation')}
            </Text>
            <Text style={[styles.recommendationText, { color: currentTheme.colors.text }]}>
              {progress.recommendation}
            </Text>
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: currentTheme.colors.primary }]}
              onPress={onRecommendationPress}
            >
              <Text style={styles.actionButtonText}>
                {t('analytics.weeklyProgress.takeAction')}
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {compact && (
        <View style={styles.compactFooter}>
          <Text style={[styles.compactRecommendation, { color: currentTheme.colors.primary }]}>
            {progress.recommendation}
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    padding: 16,
    marginVertical: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 8,
    flex: 1,
  },
  trendBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
  },
  trendText: {
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 4,
  },
  content: {
    gap: 12,
  },
  metricSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  metricLabel: {
    fontSize: 16,
    fontWeight: '500',
  },
  percentageContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  percentageText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  improvementSection: {
    paddingVertical: 8,
  },
  improvementText: {
    fontSize: 16,
    fontWeight: '500',
    lineHeight: 22,
  },
  recommendationSection: {
    gap: 8,
  },
  recommendationLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  recommendationText: {
    fontSize: 14,
    lineHeight: 20,
  },
  actionButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 4,
  },
  actionButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  loadingText: {
    fontSize: 14,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  compactFooter: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.1)',
  },
  compactRecommendation: {
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
  },
});
