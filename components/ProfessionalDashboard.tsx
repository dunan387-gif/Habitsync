import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator, Dimensions } from 'react-native';
import { useTheme } from '@/context/ThemeContext';
import { useLanguage } from '@/context/LanguageContext';
import { useRouter } from 'expo-router';
import { ProfessionalIntegrationService, ProfessionalDashboardData } from '@/services/ProfessionalIntegrationService';
import { 
  Activity, 
  AlertTriangle, 
  TrendingUp, 
  TrendingDown,
  Users, 
  FileText, 
  Share2, 
  Calendar,
  Heart,
  Brain,
  Target,
  BarChart3,
  Clock,
  CheckCircle,
  XCircle,
  Info
} from 'lucide-react-native';

interface ProfessionalDashboardProps {
  clientId: string;
  userRole: 'therapist' | 'coach' | 'healthcare_provider';
}

const { width } = Dimensions.get('window');

export default function ProfessionalDashboard({ clientId, userRole }: ProfessionalDashboardProps) {
  const { currentTheme } = useTheme();
  const { t } = useLanguage();
  const router = useRouter();
  const [dashboardData, setDashboardData] = useState<ProfessionalDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedTimeframe, setSelectedTimeframe] = useState<'week' | 'month' | 'quarter'>('month');
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const styles = createStyles(currentTheme.colors);

  useEffect(() => {
    loadDashboardData();
  }, [clientId, selectedTimeframe]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await ProfessionalIntegrationService.generateProfessionalDashboard(clientId);
      setDashboardData(data);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      setError('Failed to load dashboard data. Please try again.');
      // Don't show alert, just display error state
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadDashboardData();
    setRefreshing(false);
  };

  const getRiskLevelColor = (riskLevel: string) => {
    switch (riskLevel) {
      case 'low': return currentTheme.colors.success;
      case 'medium': return currentTheme.colors.warning;
      case 'high': return currentTheme.colors.error;
      case 'critical': return '#ff0000';
      default: return currentTheme.colors.textSecondary;
    }
  };

  const getMoodTrendIcon = (trend: string) => {
    switch (trend) {
      case 'improving': return <TrendingUp size={20} color={currentTheme.colors.success} />;
      case 'declining': return <TrendingDown size={20} color={currentTheme.colors.error} />;
      default: return <Activity size={20} color={currentTheme.colors.warning} />;
    }
  };

  const renderWelcomeHeader = () => (
    <View style={styles.welcomeHeader}>
      <View style={styles.headerContent}>
        <View style={styles.headerIcon}>
          <Heart size={24} color={currentTheme.colors.primary} />
        </View>
        <View style={styles.headerText}>
          <Text style={styles.welcomeTitle}>{t('professional.dashboard.title')}</Text>
          <Text style={styles.welcomeSubtitle}>
            {dashboardData?.clientName || t('professional.dashboard.clientOverview')}
          </Text>
        </View>
        <TouchableOpacity 
          style={styles.refreshButton} 
          onPress={handleRefresh}
          disabled={refreshing}
        >
          <Activity size={20} color={currentTheme.colors.primary} />
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderTimeframeSelector = () => (
    <View style={styles.timeframeSelectorContainer}>
      <Text style={styles.timeframeLabel}>Time Period</Text>
      <View style={styles.timeframeSelector}>
        {(['week', 'month', 'quarter'] as const).map((timeframe) => (
          <TouchableOpacity
            key={timeframe}
            style={[
              styles.timeframeButton,
              selectedTimeframe === timeframe && styles.selectedTimeframe
            ]}
            onPress={() => setSelectedTimeframe(timeframe)}
          >
            <Text style={[
              styles.timeframeText,
              selectedTimeframe === timeframe && styles.selectedTimeframeText
            ]}>
              {timeframe.charAt(0).toUpperCase() + timeframe.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const renderOverviewMetrics = () => {
    if (!dashboardData?.overviewMetrics) return null;

    const { overviewMetrics } = dashboardData;

    return (
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <BarChart3 size={24} color={currentTheme.colors.primary} />
          <Text style={styles.sectionTitle}>Overview Metrics</Text>
        </View>
        
        <View style={styles.metricsContainer}>
          <View style={styles.primaryMetricsRow}>
            <View style={styles.primaryMetricCard}>
              <View style={styles.metricHeader}>
                <Text style={styles.primaryMetricLabel}>Mood Score</Text>
                <View style={styles.trendIndicator}>
                  {getMoodTrendIcon(overviewMetrics.moodTrend)}
                </View>
              </View>
              <Text style={styles.primaryMetricValue}>
                {overviewMetrics.averageMoodScore.toFixed(1)}
              </Text>
              <Text style={styles.metricSubtext}>Average this {selectedTimeframe}</Text>
            </View>

            <View style={styles.primaryMetricCard}>
              <View style={styles.metricHeader}>
                <Text style={styles.primaryMetricLabel}>Habit Completion</Text>
                <View style={styles.trendIndicator}>
                  <Target size={16} color={currentTheme.colors.success} />
                </View>
              </View>
              <Text style={styles.primaryMetricValue}>
                {Math.round(overviewMetrics.habitCompletionRate * 100)}%
              </Text>
              <Text style={styles.metricSubtext}>Success rate</Text>
            </View>
          </View>
        </View>
      </View>
    );
  };

  const renderRiskAssessment = () => {
    if (!dashboardData?.overviewMetrics) return null;
    
    const { overviewMetrics } = dashboardData;

    return (
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <AlertTriangle size={24} color={currentTheme.colors.warning} />
          <Text style={styles.sectionTitle}>Risk Assessment</Text>
        </View>

        <View style={[
          styles.riskAssessmentCard,
          { borderLeftColor: getRiskLevelColor(overviewMetrics.riskLevel) }
        ]}>
          <View style={styles.riskHeader}>
            <AlertTriangle 
              size={20} 
              color={getRiskLevelColor(overviewMetrics.riskLevel)} 
            />
            <Text style={styles.riskTitle}>Current Risk Level</Text>
          </View>
          <View style={styles.riskContent}>
            <Text style={[
              styles.riskLevel,
              { color: getRiskLevelColor(overviewMetrics.riskLevel) }
            ]}>
              {overviewMetrics.riskLevel.toUpperCase()}
            </Text>
            <Text style={styles.riskDescription}>
              Based on recent mood patterns and activity levels
            </Text>
          </View>
        </View>
      </View>
    );
  };

  const renderAlerts = () => {
    const alerts = dashboardData?.alerts || [];

    return (
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <AlertTriangle size={24} color={currentTheme.colors.warning} />
          <Text style={styles.sectionTitle}>Alerts</Text>
          {alerts.length > 0 && (
            <View style={styles.alertBadge}>
              <Text style={styles.alertBadgeText}>{alerts.length}</Text>
            </View>
          )}
        </View>

        {alerts.length === 0 ? (
          <View style={styles.noAlertsCard}>
            <CheckCircle size={48} color={currentTheme.colors.success} />
            <Text style={styles.noAlertsText}>All Clear</Text>
            <Text style={styles.noAlertsSubtext}>
              No alerts or concerns at this time
            </Text>
          </View>
        ) : (
          alerts.map((alert, index) => (
            <View 
              key={index} 
              style={[
                styles.alertCard,
                { borderLeftColor: getRiskLevelColor(alert.severity) }
              ]}
            >
              <View style={styles.alertHeader}>
                <View style={styles.alertIconContainer}>
                  <AlertTriangle 
                    size={16} 
                    color={getRiskLevelColor(alert.severity)} 
                  />
                </View>
                <View style={styles.alertContent}>
                  <View style={styles.alertTitleRow}>
                    <Text style={[
                      styles.alertType,
                      { color: getRiskLevelColor(alert.severity) }
                    ]}>
                      {alert.type.replace('_', ' ').toUpperCase()}
                    </Text>
                    <Text style={styles.alertTime}>
                      {new Date(alert.timestamp).toLocaleDateString()}
                    </Text>
                  </View>
                  <Text style={styles.alertMessage}>{alert.message}</Text>
                  <TouchableOpacity 
                    style={[
                      styles.actionButton,
                      { backgroundColor: getRiskLevelColor(alert.severity) }
                    ]}
                    onPress={() => Alert.alert('Alert Action', `Taking action for: ${alert.type}`)}
                  >
                    <Text style={styles.actionButtonText}>Take Action</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          ))
        )}
      </View>
    );
  };

  const renderClinicalInsights = () => {
    if (!dashboardData?.clinicalInsights) return null;

    const { clinicalInsights: insights } = dashboardData;

    const getSignificanceColor = (significance: string) => {
      switch (significance) {
        case 'high': return currentTheme.colors.error;
        case 'medium': return currentTheme.colors.warning;
        case 'low': return currentTheme.colors.success;
        default: return currentTheme.colors.textSecondary;
      }
    };

    const getImpactColor = (impact: number | string) => {
      if (typeof impact === 'number') {
        if (impact > 0) return currentTheme.colors.success;
        if (impact < 0) return currentTheme.colors.error;
        return currentTheme.colors.warning;
      }
      
      switch (impact) {
        case 'positive': return currentTheme.colors.success;
        case 'negative': return currentTheme.colors.error;
        case 'neutral': return currentTheme.colors.warning;
        default: return currentTheme.colors.textSecondary;
      }
    };

    return (
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Brain size={24} color={currentTheme.colors.primary} />
          <Text style={styles.sectionTitle}>Clinical Insights</Text>
        </View>

        {insights.moodPatterns && insights.moodPatterns.length > 0 && (
          <View style={styles.insightCard}>
            <View style={styles.insightHeader}>
              <TrendingUp size={20} color={currentTheme.colors.primary} />
              <Text style={styles.insightTitle}>Behavioral Patterns</Text>
            </View>
            {insights.moodPatterns.map((pattern, index) => (
              <View key={index} style={styles.patternItem}>
                <Text style={styles.patternText}>{pattern.pattern}</Text>
                <View style={styles.patternMeta}>
                  <View style={styles.frequencyBadge}>
                    <Clock size={12} color={currentTheme.colors.textSecondary} />
                    <Text style={styles.frequencyText}>
                      {pattern.frequency} occurrences
                    </Text>
                  </View>
                  <View style={[
                    styles.significanceBadge,
                    { backgroundColor: `${getSignificanceColor(pattern.clinicalSignificance)}20` }
                  ]}>
                    <Text style={[
                      styles.significanceText,
                      { color: getSignificanceColor(pattern.clinicalSignificance) }
                    ]}>
                      {pattern.clinicalSignificance}
                    </Text>
                  </View>
                </View>
              </View>
            ))}
          </View>
        )}

        {insights.habitEffectiveness && insights.habitEffectiveness.length > 0 && (
          <View style={styles.insightCard}>
            <View style={styles.insightHeader}>
              <Target size={20} color={currentTheme.colors.primary} />
              <Text style={styles.insightTitle}>Habit Impact Analysis</Text>
            </View>
            {insights.habitEffectiveness.map((habit, index) => (
              <View key={index} style={styles.habitItem}>
                <View style={styles.habitHeader}>
                  <Text style={styles.habitName}>{habit.habitName}</Text>
                  <View style={[
                    styles.impactBadge,
                    { backgroundColor: `${getImpactColor(habit.moodImpact)}20` }
                  ]}>
                    <Text style={[
                      styles.impactText,
                      { color: getImpactColor(habit.moodImpact) }
                    ]}>
                      {habit.moodImpact}
                    </Text>
                  </View>
                </View>
                <View style={styles.habitMetrics}>
                  <View style={styles.habitMetric}>
                    <Text style={styles.habitMetricLabel}>Adherence Rate</Text>
                    <Text style={styles.habitMetricValue}>
                      {Math.round(habit.adherenceRate * 100)}%
                    </Text>
                  </View>
                  <View style={styles.habitMetric}>
                    <Text style={styles.habitMetricLabel}>Mood Impact</Text>
                    <Text style={styles.habitMetricValue}>
                      {habit.moodImpact > 0 ? '+' : ''}{habit.moodImpact.toFixed(2)}
                    </Text>
                  </View>
                </View>
                {habit.clinicalNotes && (
                  <Text style={styles.clinicalNotes}>
                    Clinical Note: {habit.clinicalNotes}
                  </Text>
                )}
              </View>
            ))}
          </View>
        )}

        {(!insights.moodPatterns || insights.moodPatterns.length === 0) && 
         (!insights.habitEffectiveness || insights.habitEffectiveness.length === 0) && (
          <View style={styles.emptyState}>
            <Info size={48} color={currentTheme.colors.textSecondary} />
            <Text style={styles.emptyStateText}>
              {t('professional.insufficientData')}
            </Text>
          </View>
        )}
      </View>
    );
  };

  const renderActionButtons = () => (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Share2 size={24} color={currentTheme.colors.primary} />
        <Text style={styles.sectionTitle}>{t('professional.quickActions')}</Text>
      </View>
      
      <View style={styles.actionsContainer}>
        <TouchableOpacity 
          style={styles.primaryActionCard}
          onPress={() => Alert.alert(t('professional.generateReport'), t('professional.generatingReport'))}
        >
          <View style={styles.actionIconContainer}>
            <FileText size={24} color="white" />
          </View>
          <View style={styles.actionContent}>
            <Text style={styles.primaryActionText}>{t('professional.generateReport')}</Text>
            <Text style={styles.actionSubtext}>{t('professional.createDetailedSummary')}</Text>
          </View>
        </TouchableOpacity>

        <View style={{ flexDirection: 'row', gap: 12 }}>
                  <TouchableOpacity 
          style={[styles.secondaryActionCard, { flex: 1 }]}
          onPress={() => Alert.alert(t('professional.shareData'), t('professional.sharingData'))}
        >
          <Share2 size={16} color={currentTheme.colors.primary} />
          <Text style={styles.secondaryActionText}>{t('professional.share')}</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.secondaryActionCard, { flex: 1 }]}
          onPress={() => Alert.alert(t('professional.scheduleSession'), t('professional.openingCalendar'))}
        >
          <Calendar size={16} color={currentTheme.colors.primary} />
          <Text style={styles.secondaryActionText}>{t('professional.schedule')}</Text>
        </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyStateContainer}>
      <View style={styles.emptyStateIcon}>
        <BarChart3 size={48} color={currentTheme.colors.textSecondary} />
      </View>
      <Text style={styles.emptyStateTitle}>{t('professional.noDataAvailable')}</Text>
      <Text style={styles.emptyStateMessage}>
        {t('professional.startTrackingMessage')}
      </Text>
      <TouchableOpacity 
        style={styles.emptyStateButton} 
        onPress={() => router.push('/')}
      >
        <Text style={styles.emptyStateButtonText}>{t('professional.getStarted')}</Text>
      </TouchableOpacity>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={currentTheme.colors.primary} />
        <Text style={styles.loadingText}>{t('professional.loadingDashboard')}</Text>
        <Text style={styles.loadingSubtext}>{t('professional.analyzingData')}</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <XCircle size={48} color={currentTheme.colors.error} />
        <Text style={styles.errorTitle}>{t('professional.unableToLoadDashboard')}</Text>
        <Text style={styles.errorMessage}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={loadDashboardData}>
          <Text style={styles.retryButtonText}>{t('professional.tryAgain')}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!dashboardData || (dashboardData.overviewMetrics?.totalMoodEntries === 0 && dashboardData.clinicalInsights?.habitEffectiveness?.length === 0)) {
    return (
      <View style={styles.container}>
        {renderWelcomeHeader()}
        {renderEmptyState()}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView 
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {renderWelcomeHeader()}
        {renderTimeframeSelector()}
        {renderOverviewMetrics()}
        {renderRiskAssessment()}
        {renderAlerts()}
        {renderClinicalInsights()}
        {renderActionButtons()}
        <View style={styles.bottomSpacing} />
      </ScrollView>
    </View>
  );
}

const createStyles = (colors: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
    padding: 40,
  },
  loadingText: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginTop: 16,
  },
  loadingSubtext: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 4,
  },
  welcomeHeader: {
    backgroundColor: colors.card,
    paddingVertical: 24,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: `${colors.primary}15`,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  headerText: {
    flex: 1,
  },
  welcomeTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 2,
  },
  welcomeSubtitle: {
    fontSize: 16,
    color: colors.textSecondary,
  },
  refreshButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: `${colors.primary}10`,
    justifyContent: 'center',
    alignItems: 'center',
  },
  timeframeSelectorContainer: {
    backgroundColor: colors.card,
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  timeframeLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 12,
  },
  timeframeSelector: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 4,
  },
  timeframeButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  selectedTimeframe: {
    backgroundColor: colors.primary,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  timeframeText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  selectedTimeframeText: {
    color: 'white',
  },
  section: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    marginLeft: 8,
    flex: 1,
  },
  metricsContainer: {
    gap: 16,
  },
  primaryMetricsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  primaryMetricCard: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  metricHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  trendIndicator: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 4,
  },
  primaryMetricValue: {
    fontSize: 32,
    fontWeight: '800',
    color: colors.text,
    marginBottom: 4,
  },
  primaryMetricLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 2,
  },
  metricSubtext: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  riskAssessmentCard: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 20,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  riskHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  riskTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginLeft: 8,
  },
  riskContent: {
    alignItems: 'flex-start',
  },
  riskLevel: {
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 4,
  },
  riskDescription: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  alertBadge: {
    backgroundColor: colors.warning,
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    minWidth: 24,
    alignItems: 'center',
  },
  alertBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: 'white',
  },
  noAlertsCard: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  noAlertsText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginTop: 12,
  },
  noAlertsSubtext: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 4,
    textAlign: 'center',
  },
  alertCard: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  alertHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  alertIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  alertContent: {
    flex: 1,
  },
  alertTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  alertType: {
    fontSize: 14,
    fontWeight: '700',
  },
  alertTime: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  alertMessage: {
    fontSize: 14,
    color: colors.text,
    lineHeight: 20,
    marginBottom: 12,
  },
  actionButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  actionButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  insightCard: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  insightHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  insightTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginLeft: 8,
  },
  patternItem: {
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  patternText: {
    fontSize: 15,
    color: colors.text,
    lineHeight: 22,
    marginBottom: 8,
  },
  patternMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  frequencyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  frequencyText: {
    fontSize: 12,
    color: colors.textSecondary,
    marginLeft: 4,
  },
  significanceBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  significanceText: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  habitItem: {
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  habitHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  habitName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    flex: 1,
  },
  impactBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  impactText: {
    fontSize: 12,
    fontWeight: '700',
  },
  habitMetrics: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  habitMetric: {
    marginRight: 20,
  },
  habitMetricLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 2,
  },
  habitMetricValue: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  clinicalNotes: {
    fontSize: 13,
    color: colors.textSecondary,
    fontStyle: 'italic',
    lineHeight: 18,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  emptyStateText: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 8,
  },
  actionsContainer: {
    gap: 12,
  },
  primaryActionCard: {
    backgroundColor: colors.primary,
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  actionIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  actionContent: {
    flex: 1,
  },
  primaryActionText: {
    fontSize: 18,
    fontWeight: '700',
    color: 'white',
    marginBottom: 2,
  },
  actionSubtext: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  secondaryActionCard: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    marginHorizontal: 4,
  },
  secondaryActionText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginLeft: 8,
  },
  bottomSpacing: {
    height: 20,
  },
  demoLabel: {
    color: colors.warning,
    fontWeight: '600',
  },
  demoNotice: {
    backgroundColor: `${colors.warning}15`,
    borderRadius: 8,
    padding: 12,
    marginTop: 16,
  },
  demoNoticeText: {
    fontSize: 14,
    color: colors.warning,
    textAlign: 'center',
    fontWeight: '500',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
    padding: 40,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    marginTop: 16,
    marginBottom: 8,
  },
  errorMessage: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
  },
  retryButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  emptyStateContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyStateIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: `${colors.textSecondary}10`,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  emptyStateTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 12,
  },
  emptyStateMessage: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  emptyStateButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
  },
  emptyStateButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});