import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useCrossTabInsights } from '@/context/CrossTabInsightsContext';
import { useTheme } from '@/context/ThemeContext';
import { useLanguage } from '@/context/LanguageContext';
import { TrendingUp, TrendingDown, Minus, Target, Zap } from 'lucide-react-native';

interface TodayFocusCardProps {
  onActionPress?: () => void;
  compact?: boolean;
}

export default function TodayFocusCard({ onActionPress, compact = false }: TodayFocusCardProps) {
  const { state } = useCrossTabInsights();
  const { currentTheme } = useTheme();
  const { t } = useLanguage();

  const insight = state.todayInsight;
  const homeData = state.data.home;

  if (!insight) {
    return (
      <View style={[styles.container, { backgroundColor: currentTheme.colors.surface }]}>
        <View style={styles.header}>
          <Target size={20} color={currentTheme.colors.primary} />
          <Text style={[styles.title, { color: currentTheme.colors.text }]}>
            {t('analytics.todayFocus.title')}
          </Text>
        </View>
        <Text style={[styles.loadingText, { color: currentTheme.colors.textSecondary }]}>
          {t('analytics.todayFocus.loading')}
        </Text>
      </View>
    );
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return currentTheme.colors.error;
      case 'medium':
        return currentTheme.colors.warning;
      case 'low':
        return currentTheme.colors.success;
      default:
        return currentTheme.colors.primary;
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'high':
        return <Zap size={16} color={getPriorityColor(priority)} />;
      case 'medium':
        return <Target size={16} color={getPriorityColor(priority)} />;
      case 'low':
        return <TrendingUp size={16} color={getPriorityColor(priority)} />;
      default:
        return <Target size={16} color={getPriorityColor(priority)} />;
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: currentTheme.colors.surface }]}>
      <View style={styles.header}>
        <Target size={20} color={currentTheme.colors.primary} />
        <Text style={[styles.title, { color: currentTheme.colors.text }]}>
          {t('analytics.todayFocus.title')}
        </Text>
        <View style={styles.priorityBadge}>
          {getPriorityIcon(insight.priority)}
          <Text style={[styles.priorityText, { color: getPriorityColor(insight.priority) }]}>
            {t(`analytics.priority.${insight.priority}`)}
          </Text>
        </View>
      </View>

      <View style={styles.content}>
        <View style={styles.metricSection}>
          <Text style={[styles.metricLabel, { color: currentTheme.colors.textSecondary }]}>
            {t('analytics.todayFocus.mainMetric')}
          </Text>
          <Text style={[styles.metricValue, { color: currentTheme.colors.text }]}>
            {insight.mainMetric}
          </Text>
        </View>

        <View style={styles.contextSection}>
          <Text style={[styles.contextText, { color: currentTheme.colors.textSecondary }]}>
            {insight.context}
          </Text>
        </View>

        <View style={styles.motivationSection}>
          <Text style={[styles.motivationText, { color: currentTheme.colors.text }]}>
            {insight.motivation}
          </Text>
        </View>

        {!compact && (
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: currentTheme.colors.primary }]}
            onPress={onActionPress}
          >
            <Text style={styles.actionButtonText}>
              {insight.nextAction}
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {compact && (
        <View style={styles.compactFooter}>
          <Text style={[styles.compactAction, { color: currentTheme.colors.primary }]}>
            {insight.nextAction}
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
  priorityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
  },
  priorityText: {
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 4,
  },
  content: {
    gap: 12,
  },
  metricSection: {
    gap: 4,
  },
  metricLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  metricValue: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  contextSection: {
    paddingVertical: 8,
  },
  contextText: {
    fontSize: 14,
    lineHeight: 20,
  },
  motivationSection: {
    paddingVertical: 8,
  },
  motivationText: {
    fontSize: 16,
    fontWeight: '500',
    lineHeight: 22,
  },
  actionButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  actionButtonText: {
    color: 'white',
    fontSize: 16,
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
  compactAction: {
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
  },
});
