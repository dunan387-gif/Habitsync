import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useTheme } from '@/context/ThemeContext';
import { useLanguage } from '@/context/LanguageContext';
import { useAuth } from '@/context/AuthContext';
import CommunityService from '@/services/CommunityService';
import { CommunityAnalytics } from '@/types';
import { 
  TrendingUp, 
  Users, 
  Trophy, 
  BookOpen, 
  MessageSquare, 
  Star,
  Activity,
  Target,
  Award,
  BarChart3,
  Calendar,
  Clock,
  Eye,
  Heart,
  Share2
} from 'lucide-react-native';

export default function CommunityAnalyticsDashboard() {
  const { currentTheme } = useTheme();
  const { t } = useLanguage();
  const { user } = useAuth();
  
  const [analytics, setAnalytics] = useState<CommunityAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month' | 'year'>('week');

  useEffect(() => {
    loadCommunityAnalytics();
  }, [selectedPeriod]);

  const loadCommunityAnalytics = async () => {
    try {
      const userId = user?.id || 'anonymous';
      CommunityService.getInstance().setUserId(userId);
      
      const data = await CommunityService.getInstance().getCommunityAnalytics();
      setAnalytics(data);
    } catch (error) {
      console.error('Error loading community analytics:', error);
      Alert.alert(t('common.error'), t('communityAnalytics.loadError'));
    } finally {
      setLoading(false);
    }
  };

  const getEngagementColor = (rate: number) => {
    if (rate >= 80) return currentTheme.colors.success;
    if (rate >= 60) return currentTheme.colors.warning;
    if (rate >= 40) return currentTheme.colors.primary;
    return currentTheme.colors.error;
  };

  const getEngagementLabel = (rate: number) => {
    if (rate >= 80) return t('communityAnalytics.excellent');
    if (rate >= 60) return t('communityAnalytics.good');
    if (rate >= 40) return t('communityAnalytics.fair');
    return t('communityAnalytics.needsImprovement');
  };

  const renderStatCard = (title: string, value: number | string, icon: React.ReactNode, color?: string) => (
    <View style={[styles.statCard, { backgroundColor: currentTheme.colors.card }]}>
      <View style={styles.statHeader}>
        <View style={[styles.statIcon, { backgroundColor: `${color || currentTheme.colors.primary}15` }]}>
          {icon}
        </View>
        <Text style={[styles.statTitle, { color: currentTheme.colors.textSecondary }]}>
          {title}
        </Text>
      </View>
      <Text style={[styles.statValue, { color: currentTheme.colors.text }]}>
        {value}
      </Text>
    </View>
  );

  const renderEngagementCard = () => {
    if (!analytics) return null;
    
    const engagementColor = getEngagementColor(analytics.engagementRate);
    const engagementLabel = getEngagementLabel(analytics.engagementRate);

    return (
      <View style={[styles.engagementCard, { backgroundColor: currentTheme.colors.card }]}>
        <View style={styles.engagementHeader}>
          <Activity size={24} color={engagementColor} />
          <Text style={[styles.engagementTitle, { color: currentTheme.colors.text }]}>
            {t('communityAnalytics.engagementRate')}
          </Text>
        </View>
        <View style={styles.engagementContent}>
          <Text style={[styles.engagementValue, { color: engagementColor }]}>
            {analytics.engagementRate}%
          </Text>
          <Text style={[styles.engagementLabel, { color: currentTheme.colors.textSecondary }]}>
            {engagementLabel}
          </Text>
        </View>
        <View style={styles.engagementBar}>
          <View 
            style={[
              styles.engagementProgress, 
              { 
                width: `${Math.min(analytics.engagementRate, 100)}%`,
                backgroundColor: engagementColor 
              }
            ]} 
          />
        </View>
      </View>
    );
  };

  const renderTopContributors = () => {
    if (!analytics || analytics.topContributors.length === 0) return null;

    return (
      <View style={[styles.sectionCard, { backgroundColor: currentTheme.colors.card }]}>
        <View style={styles.sectionHeader}>
          <Award size={20} color={currentTheme.colors.primary} />
          <Text style={[styles.sectionTitle, { color: currentTheme.colors.text }]}>
            {t('communityAnalytics.topContributors')}
          </Text>
        </View>
        {analytics.topContributors.slice(0, 5).map((contributor, index) => (
          <View key={contributor.userId} style={styles.contributorItem}>
            <View style={styles.contributorRank}>
              <Text style={[styles.rankText, { color: currentTheme.colors.textSecondary }]}>
                #{index + 1}
              </Text>
            </View>
            <View style={styles.contributorInfo}>
              <Text style={[styles.contributorName, { color: currentTheme.colors.text }]}>
                {contributor.name}
              </Text>
              <Text style={[styles.contributorStats, { color: currentTheme.colors.textSecondary }]}>
                {contributor.contributions} {t('communityAnalytics.contributions')} • {contributor.impact} {t('communityAnalytics.impact')}
              </Text>
            </View>
          </View>
        ))}
      </View>
    );
  };

  const renderPopularTopics = () => {
    if (!analytics || analytics.popularTopics.length === 0) return null;

    return (
      <View style={[styles.sectionCard, { backgroundColor: currentTheme.colors.card }]}>
        <View style={styles.sectionHeader}>
          <TrendingUp size={20} color={currentTheme.colors.primary} />
          <Text style={[styles.sectionTitle, { color: currentTheme.colors.text }]}>
            {t('communityAnalytics.popularTopics')}
          </Text>
        </View>
        {analytics.popularTopics.slice(0, 5).map((topic, index) => (
          <View key={topic.topic} style={styles.topicItem}>
            <View style={styles.topicRank}>
              <Text style={[styles.rankText, { color: currentTheme.colors.textSecondary }]}>
                #{index + 1}
              </Text>
            </View>
            <View style={styles.topicInfo}>
              <Text style={[styles.topicName, { color: currentTheme.colors.text }]}>
                {topic.topic}
              </Text>
              <Text style={[styles.topicEngagement, { color: currentTheme.colors.textSecondary }]}>
                {topic.engagement} {t('communityAnalytics.engagements')}
              </Text>
            </View>
          </View>
        ))}
      </View>
    );
  };

  const renderActivityMetrics = () => {
    if (!analytics) return null;

    return (
      <View style={styles.metricsGrid}>
        <View style={styles.metricsRow}>
          {renderStatCard(
            t('communityAnalytics.totalMembers'),
            analytics.totalMembers,
            <Users size={20} color={currentTheme.colors.primary} />,
            currentTheme.colors.primary
          )}
          {renderStatCard(
            t('communityAnalytics.activeMembers'),
            analytics.activeMembers,
            <Activity size={20} color={currentTheme.colors.success} />,
            currentTheme.colors.success
          )}
        </View>
        <View style={styles.metricsRow}>
          {renderStatCard(
            t('communityAnalytics.challengesCreated'),
            analytics.challengesCreated,
            <Trophy size={20} color={currentTheme.colors.warning} />,
            currentTheme.colors.warning
          )}
          {renderStatCard(
            t('communityAnalytics.challengesCompleted'),
            analytics.challengesCompleted,
            <Target size={20} color={currentTheme.colors.accent} />,
            currentTheme.colors.accent
          )}
        </View>
        <View style={styles.metricsRow}>
          {renderStatCard(
            t('communityAnalytics.mentorshipConnections'),
            analytics.mentorshipConnections,
            <BookOpen size={20} color={currentTheme.colors.primary} />,
            currentTheme.colors.primary
          )}
          {renderStatCard(
            t('communityAnalytics.knowledgeShares'),
            analytics.knowledgeShares,
            <MessageSquare size={20} color={currentTheme.colors.success} />,
            currentTheme.colors.success
          )}
        </View>
      </View>
    );
  };

  const renderPeriodSelector = () => (
    <View style={styles.periodSelector}>
      {(['week', 'month', 'year'] as const).map((period) => (
        <TouchableOpacity
          key={period}
          style={[
            styles.periodButton,
            selectedPeriod === period && { backgroundColor: currentTheme.colors.primary }
          ]}
          onPress={() => setSelectedPeriod(period)}
        >
          <Text style={[
            styles.periodButtonText,
            { color: selectedPeriod === period ? currentTheme.colors.background : currentTheme.colors.text }
          ]}>
            {t(`communityAnalytics.periods.${period}`)}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  const styles = createStyles(currentTheme.colors);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>{t('common.loading')}</Text>
      </View>
    );
  }

  if (!analytics) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{t('communityAnalytics.noData')}</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: currentTheme.colors.text }]}>
          {t('communityAnalytics.title')}
        </Text>
        <Text style={[styles.subtitle, { color: currentTheme.colors.textSecondary }]}>
          {t('communityAnalytics.description')}
        </Text>
      </View>

      {renderPeriodSelector()}

      {renderEngagementCard()}

      {renderActivityMetrics()}

      {renderTopContributors()}

      {renderPopularTopics()}

      <View style={styles.footer}>
        <Text style={[styles.footerText, { color: currentTheme.colors.textMuted }]}>
          {t('communityAnalytics.lastUpdated')}: {new Date().toLocaleDateString()}
        </Text>
      </View>
    </ScrollView>
  );
}

const createStyles = (colors: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: colors.textMuted,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: colors.textMuted,
    textAlign: 'center',
  },
  header: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    lineHeight: 22,
  },
  periodSelector: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 15,
    gap: 10,
  },
  periodButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  periodButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  engagementCard: {
    margin: 20,
    padding: 20,
    borderRadius: 12,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  engagementHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  engagementTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 8,
  },
  engagementContent: {
    alignItems: 'center',
    marginBottom: 16,
  },
  engagementValue: {
    fontSize: 48,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  engagementLabel: {
    fontSize: 14,
  },
  engagementBar: {
    height: 8,
    backgroundColor: colors.border,
    borderRadius: 4,
    overflow: 'hidden',
  },
  engagementProgress: {
    height: '100%',
    borderRadius: 4,
  },
  metricsGrid: {
    paddingHorizontal: 20,
  },
  metricsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 10,
  },
  statCard: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  statIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  statTitle: {
    fontSize: 12,
    fontWeight: '500',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  sectionCard: {
    margin: 20,
    padding: 20,
    borderRadius: 12,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 8,
  },
  contributorItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  contributorRank: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  rankText: {
    fontSize: 12,
    fontWeight: '600',
  },
  contributorInfo: {
    flex: 1,
  },
  contributorName: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 2,
  },
  contributorStats: {
    fontSize: 12,
  },
  topicItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  topicRank: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  topicInfo: {
    flex: 1,
  },
  topicName: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 2,
  },
  topicEngagement: {
    fontSize: 12,
  },
  footer: {
    padding: 20,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
  },
});
