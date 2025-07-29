import React, { useState, useMemo, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import { useHabits } from '@/context/HabitContext';
import { useTheme } from '@/context/ThemeContext';
import { useLanguage } from '@/context/LanguageContext';
import { AdvancedAnalyticsService, DetailedCorrelationReport, PredictiveMoodHabitModel, AdvancedPatternRecognition, PersonalizedInsight } from '@/services/AdvancedAnalyticsService';
import { MoodEntry, HabitMoodEntry, Habit } from '@/types';

const { width } = Dimensions.get('window');

interface AdvancedAnalyticsDashboardProps {
  moodData: MoodEntry[];
  habitMoodData: HabitMoodEntry[];
}

export default function AdvancedAnalyticsDashboard({ moodData, habitMoodData }: AdvancedAnalyticsDashboardProps) {
  const { habits } = useHabits();
  const { currentTheme } = useTheme();
  const { t } = useLanguage();
  const [selectedTab, setSelectedTab] = useState<'correlations' | 'predictions' | 'patterns' | 'insights'>('correlations');
  const [selectedTimeframe, setSelectedTimeframe] = useState<'week' | 'month' | 'quarter'>('month');
  const [correlationReports, setCorrelationReports] = useState<DetailedCorrelationReport[]>([]);
  const [predictiveModels, setPredictiveModels] = useState<PredictiveMoodHabitModel[]>([]);
  const [patternRecognition, setPatternRecognition] = useState<AdvancedPatternRecognition | null>(null);
  const [customInsights, setCustomInsights] = useState<PersonalizedInsight[]>([]);
  
  const analyticsService = useMemo(() => AdvancedAnalyticsService.getInstance(), []);
  const styles = createStyles(currentTheme.colors);

  // Load analytics data
  useEffect(() => {
    const loadAnalyticsData = async () => {
      if (!habits || habits.length === 0) return;
      
      try {
        const [correlations, patterns, insights] = await Promise.all([
          analyticsService.generateDetailedCorrelationReport(habits, moodData, habitMoodData),
          analyticsService.performAdvancedPatternRecognition(habits, moodData, habitMoodData),
          analyticsService.generateCustomInsights('user-id', habits, moodData, habitMoodData)
        ]);
        
        // Generate predictive models for each habit
        const predictions: PredictiveMoodHabitModel[] = [];
        for (const habit of habits) {
          const habitEntries = habitMoodData.filter(entry => entry.habitId === habit.id);
          if (habitEntries.length > 0) {
            const prediction = await analyticsService.generatePredictiveMoodHabitModel(
              habit.id,
              habitEntries,
              moodData
            );
            predictions.push(prediction);
          }
        }
        
        setCorrelationReports(correlations);
        setPredictiveModels(predictions);
        setPatternRecognition(patterns);
        setCustomInsights(insights);
      } catch (error) {
        console.error('Error loading analytics data:', error);
      }
    };

    loadAnalyticsData();
  }, [habits, moodData, habitMoodData, analyticsService]);

  const getCorrelationStrengthColor = (strength: number) => {
    if (strength >= 0.7) return currentTheme.colors.success;
    if (strength >= 0.4) return currentTheme.colors.warning;
    return currentTheme.colors.error;
  };

  const renderTabBar = () => (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabScrollContainer}>
      <View style={styles.tabContentContainer}>
        {[
          { key: 'correlations', label: t('advancedAnalytics.tabs.correlations'), icon: '📊' },
          { key: 'predictions', label: t('advancedAnalytics.tabs.predictions'), icon: '🔮' },
          { key: 'patterns', label: t('advancedAnalytics.tabs.patterns'), icon: '🧩' },
          { key: 'insights', label: t('advancedAnalytics.tabs.insights'), icon: '💡' }
        ].map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={[styles.tab, selectedTab === tab.key && styles.activeTab]}
            onPress={() => setSelectedTab(tab.key as any)}
          >
            <Text style={[styles.tabIcon, selectedTab === tab.key && styles.activeTabIcon]}>
              {tab.icon}
            </Text>
            <Text style={[styles.tabText, selectedTab === tab.key && styles.activeTabText]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );

  const renderTimeframeSelector = () => (
    <View style={styles.timeframeContainer}>
      {['week', 'month', 'quarter'].map((timeframe) => (
        <TouchableOpacity
          key={timeframe}
          style={[styles.timeframeButton, selectedTimeframe === timeframe && styles.activeTimeframeButton]}
          onPress={() => setSelectedTimeframe(timeframe as any)}
        >
          <Text style={[styles.timeframeText, selectedTimeframe === timeframe && styles.activeTimeframeText]}>
            {t(`advancedAnalytics.timeframes.${timeframe}`)}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  const getCorrelationStrengthLabel = (strength: number) => {
    if (strength >= 0.7) return t('advancedAnalytics.correlations.strengthStrong');
    if (strength >= 0.4) return t('advancedAnalytics.correlations.strengthModerate');
    return t('advancedAnalytics.correlations.strengthWeak');
  };

  const renderCorrelationReports = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{t('advancedAnalytics.sections.correlationsTitle')}</Text>
      <View style={styles.correlationGrid}>
        {correlationReports.length > 0 ? correlationReports.map((report, index) => (
          <View key={index} style={styles.correlationCard}>
            <View style={styles.correlationHeader}>
              <Text style={styles.correlationTitle}>{report.habitTitle}</Text>
              <View style={[styles.strengthBadge, { backgroundColor: getCorrelationStrengthColor(report.correlationStrength) }]}>
                <Text style={styles.strengthText}>{getCorrelationStrengthLabel(report.correlationStrength)}</Text>
              </View>
            </View>
            <Text style={styles.correlationScore}>{report.correlationStrength > 0 ? '+' : ''}{report.correlationStrength.toFixed(2)}</Text>
            <Text style={styles.correlationDescription}>
              {report.correlationStrength > 0.5 ? t('advancedAnalytics.correlations.strongPositive') :
               report.correlationStrength > 0 ? t('advancedAnalytics.correlations.moderatePositive') :
               t('advancedAnalytics.correlations.negative')}
            </Text>
            <View style={styles.correlationMetrics}>
              <View style={styles.metricItem}>
                <Text style={styles.metricLabel}>{t('advancedAnalytics.correlations.bestTimes')}</Text>
                <Text style={styles.metricValue}>{report.timePatterns?.bestTimes?.[0] || t('advancedAnalytics.common.notAvailable')}</Text>
              </View>
              <View style={styles.metricItem}>
                <Text style={styles.metricLabel}>{t('advancedAnalytics.correlations.optimalMood')}</Text>
                <Text style={styles.metricValue}>{report.optimalMoodStates?.[0] || t('advancedAnalytics.common.notAvailable')}</Text>
              </View>
            </View>
          </View>
        )) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>{t('advancedAnalytics.correlations.noData')}</Text>
          </View>
        )}
      </View>
    </View>
  );

  const renderPredictiveModels = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>🔮 Habit Success Predictions</Text>
      <View style={styles.predictionGrid}>
        {predictiveModels.length > 0 ? predictiveModels.map((model, index) => {
          // Find the habit title from the habits array
          const habit = habits?.find(h => h.id === model.habitId);
          const habitTitle = habit?.title || 'Unknown Habit';
          
          // Calculate average success probability from predictions
          const avgSuccessProbability = model.predictions?.nextWeek?.length > 0 
            ? Math.round(model.predictions.nextWeek.reduce((sum, pred) => sum + pred.successProbability, 0) / model.predictions.nextWeek.length)
            : 50;

          return (
            <View key={index} style={styles.predictionCard}>
              <View style={styles.predictionHeader}>
                <Text style={styles.predictionTitle}>{habitTitle}</Text>
                <Text style={[styles.predictionProbability, { color: avgSuccessProbability >= 70 ? currentTheme.colors.success : avgSuccessProbability >= 40 ? currentTheme.colors.warning : currentTheme.colors.error }]}>
                  {avgSuccessProbability}%
                </Text>
              </View>
              <Text style={styles.predictionSubtitle}>Average Success Probability This Week</Text>
              <View style={styles.predictionFactors}>
                {model.riskFactors?.slice(0, 3).map((factor, factorIndex) => (
                  <Text key={factorIndex} style={styles.factorText}>• {factor.factor}: {factor.impact > 0 ? '+' : ''}{Math.round(factor.impact * 100)}%</Text>
                )) || [
                  <Text key="mood" style={styles.factorText}>• Current mood: {t('moodCheckIn.moodTags.calm')} (+15%)</Text>,
                  <Text key="time" style={styles.factorText}>• Time of day: Evening (+12%)</Text>,
                  <Text key="streak" style={styles.factorText}>• Recent streak: 5 days (+20%)</Text>
                ]}
              </View>
            </View>
          );
        }) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>Building predictive models... Complete more habits for accurate predictions!</Text>
          </View>
        )}
      </View>
    </View>
  );

  const renderPatternRecognition = () => {
    // Handle the case where patternRecognition is a single object, not an array
    const patterns = patternRecognition ? [
      ...patternRecognition.cyclicalPatterns.map(p => ({ type: 'Cyclical', title: p.pattern, description: p.description, recommendation: `Optimize for ${p.frequency} patterns` })),
      ...patternRecognition.triggerEvents.map(t => ({ type: 'Trigger', title: t.trigger, description: t.effect, recommendation: t.examples[0] || 'Monitor this trigger' })),
      ...patternRecognition.habitChains.map(h => ({ type: 'Chain', title: `${h.sequence.join(' → ')}`, description: `Success rate: ${Math.round(h.successRate * 100)}%`, recommendation: `Best timing: ${h.optimalTiming}` })),
      ...patternRecognition.moodCascades.map(m => ({ type: 'Mood Cascade', title: `${m.initialMood} cascade`, description: `Leads to ${m.resultingMoods.join(', ')} over ${m.timeframe}`, recommendation: m.interventionPoints[0] || 'Early intervention recommended' }))
    ] : [];

    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🧩 Advanced Pattern Recognition</Text>
        <View style={styles.patternGrid}>
          {patterns.length > 0 ? patterns.map((pattern, index) => (
            <View key={index} style={styles.patternCard}>
              <Text style={styles.patternType}>{pattern.type}</Text>
              <Text style={styles.patternTitle}>{pattern.title}</Text>
              <Text style={styles.patternDescription}>{pattern.description}</Text>
              <View style={styles.patternRecommendation}>
                <Text style={styles.recommendationText}>💡 {pattern.recommendation}</Text>
              </View>
            </View>
          )) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>Analyzing patterns... More data needed for pattern recognition!</Text>
            </View>
          )}
        </View>
      </View>
    );
  };

  const renderCustomInsights = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>💡 Personalized Insights</Text>
      <View style={styles.insightsContainer}>
        {customInsights.length > 0 ? customInsights.map((insight, index) => {
          const getInsightIcon = (type: string) => {
            switch (type) {
              case 'pattern': return '🔍';
              case 'opportunity': return '🎯';
              case 'warning': return '⚠️';
              case 'achievement': return '🏆';
              default: return '💡';
            }
          };

          return (
            <View key={index} style={styles.insightCard}>
              <View style={styles.insightHeader}>
                <Text style={styles.insightIcon}>{getInsightIcon(insight.type)}</Text>
                <View style={styles.insightContent}>
                  <Text style={styles.insightTitle}>{insight.title}</Text>
                  <Text style={styles.insightConfidence}>{insight.priority} priority</Text>
                </View>
              </View>
              <Text style={styles.insightDescription}>{insight.description}</Text>
              {insight.actionable && (
                <TouchableOpacity style={styles.insightAction}>
                  <Text style={styles.actionText}>Apply Suggestion</Text>
                </TouchableOpacity>
              )}
            </View>
          );
        }) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>Generating personalized insights... Keep tracking to unlock custom recommendations!</Text>
          </View>
        )}
      </View>
    </View>
  );

  const renderContent = () => {
    switch (selectedTab) {
      case 'correlations':
        return renderCorrelationReports();
      case 'predictions':
        return renderPredictiveModels();
      case 'patterns':
        return renderPatternRecognition();
      case 'insights':
        return renderCustomInsights();
      default:
        return renderCorrelationReports();
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{t('advancedAnalytics.title')}</Text>
        <Text style={styles.subtitle}>{t('advancedAnalytics.subtitle')}</Text>
        {renderTabBar()}
        {renderTimeframeSelector()}
      </View>
      <ScrollView style={styles.content}>
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
    backgroundColor: colors.surface,
    paddingTop: 40,
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: colors.textSecondary,
    marginBottom: 20,
  },
  tabScrollContainer: {
    marginHorizontal: -20,
    marginBottom: 16,
  },
  tabContentContainer: {
    paddingHorizontal: 20,
    flexDirection: 'row',
    gap: 12,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    minWidth: 100,
  },
  activeTab: {
    backgroundColor: colors.primary,
  },
  tabIcon: {
    fontSize: 16,
    marginRight: 6,
  },
  activeTabIcon: {
    fontSize: 16,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  activeTabText: {
    color: colors.background,
  },
  timeframeContainer: {
    flexDirection: 'row',
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 4,
  },
  timeframeButton: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 8,
  },
  activeTimeframeButton: {
    backgroundColor: colors.primary,
  },
  timeframeText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  activeTimeframeText: {
    color: colors.background,
  },
  content: {
    flex: 1,
  },
  section: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 16,
  },
  correlationGrid: {
    gap: 16,
  },
  correlationCard: {
    backgroundColor: colors.card,
    padding: 20,
    borderRadius: 16,
    borderLeftWidth: 4,
    borderLeftColor: colors.primary,
  },
  correlationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  correlationTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    flex: 1,
  },
  strengthBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  strengthText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: colors.background,
  },
  correlationScore: {
    fontSize: 32,
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: 8,
  },
  correlationDescription: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 16,
  },
  correlationMetrics: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  metricItem: {
    alignItems: 'center',
  },
  metricLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  metricValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.text,
  },
  predictionGrid: {
    gap: 16,
  },
  predictionCard: {
    backgroundColor: colors.card,
    padding: 20,
    borderRadius: 16,
  },
  predictionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  predictionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    flex: 1,
  },
  predictionProbability: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  predictionSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 16,
  },
  predictionFactors: {
    gap: 8,
  },
  factorText: {
    fontSize: 14,
    color: colors.text,
  },
  patternGrid: {
    gap: 16,
  },
  patternCard: {
    backgroundColor: colors.card,
    padding: 20,
    borderRadius: 16,
  },
  patternType: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.primary,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  patternTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 8,
  },
  patternDescription: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 16,
  },
  patternRecommendation: {
    backgroundColor: colors.background,
    padding: 12,
    borderRadius: 8,
  },
  recommendationText: {
    fontSize: 14,
    color: colors.text,
  },
  insightsContainer: {
    gap: 16,
  },
  insightCard: {
    backgroundColor: colors.card,
    padding: 20,
    borderRadius: 16,
  },
  insightHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  insightIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  insightContent: {
    flex: 1,
  },
  insightTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 4,
  },
  insightConfidence: {
    fontSize: 12,
    color: colors.success,
    fontWeight: '600',
  },
  insightDescription: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 16,
  },
  insightAction: {
    backgroundColor: colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  actionText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.background,
  },
  emptyState: {
    backgroundColor: colors.card,
    padding: 40,
    borderRadius: 16,
    alignItems: 'center',
  },
  emptyStateText: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
  },
});