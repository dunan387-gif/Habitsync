import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useTheme } from '@/context/ThemeContext';
import { useLanguage } from '@/context/LanguageContext';
import { useAuth } from '@/context/AuthContext';
import LibraryAnalyticsService from '@/services/LibraryAnalyticsService';
import { BookOpen, Clock, Users, Star, TrendingUp, Target } from 'lucide-react-native';

export default function LibraryAnalyticsDisplay() {
  const { currentTheme } = useTheme();
  const { t } = useLanguage();
  const { user } = useAuth();
  
  const [analytics, setAnalytics] = useState<any>(null);
  const [insights, setInsights] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadLibraryAnalytics();
  }, []);

  const loadLibraryAnalytics = async () => {
    try {
      const userId = user?.id || 'anonymous';
      
      // Initialize analytics first to ensure data structure exists
      await LibraryAnalyticsService.initializeAnalytics(userId);
      
      const [analyticsData, insightsData] = await Promise.all([
        LibraryAnalyticsService.getAnalytics(userId),
        LibraryAnalyticsService.getLibraryInsights(userId)
      ]);
      
      // Ensure we have valid data structures with proper defaults
      const safeAnalytics = analyticsData || {
        totalVisits: 0,
        timeSpentInLibrary: 0,
        habitsAdded: [],
        coursesCompleted: [],
        coursesEnrolled: [],
      };
      
      const safeInsights = insightsData || {
        popularSearchTerms: [],
        userEngagementScore: 0,
      };
      
      // Ensure arrays are actually arrays
      safeAnalytics.habitsAdded = Array.isArray(safeAnalytics.habitsAdded) ? safeAnalytics.habitsAdded : [];
      safeAnalytics.coursesCompleted = Array.isArray(safeAnalytics.coursesCompleted) ? safeAnalytics.coursesCompleted : [];
      safeAnalytics.coursesEnrolled = Array.isArray(safeAnalytics.coursesEnrolled) ? safeAnalytics.coursesEnrolled : [];
      safeInsights.popularSearchTerms = Array.isArray(safeInsights.popularSearchTerms) ? safeInsights.popularSearchTerms : [];
      
      setAnalytics(safeAnalytics);
      setInsights(safeInsights);
    } catch (error) {
      console.error('Error loading library analytics:', error);
      // Set default values on error
      const defaultAnalytics = {
        totalVisits: 0,
        timeSpentInLibrary: 0,
        habitsAdded: [],
        coursesCompleted: [],
        coursesEnrolled: [],
      };
      const defaultInsights = {
        popularSearchTerms: [],
        userEngagementScore: 0,
      };
      
      setAnalytics(defaultAnalytics);
      setInsights(defaultInsights);
    } finally {
      setIsLoading(false);
    }
  };

  const styles = createStyles(currentTheme.colors);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>{t('stats.library.loading')}</Text>
      </View>
    );
  }

  if (!analytics || typeof analytics !== 'object' || !insights || typeof insights !== 'object') {
    return (
      <View style={styles.emptyContainer}>
        <BookOpen size={48} color={currentTheme.colors.textMuted} />
        <Text style={styles.emptyTitle}>{t('stats.library.noData')}</Text>
        <Text style={styles.emptyDescription}>{t('stats.library.noDataDesc')}</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Library Usage Stats */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('stats.library.usageStats')}</Text>
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <BookOpen size={24} color={currentTheme.colors.primary} />
            <Text style={styles.statValue}>{analytics.totalVisits || 0}</Text>
            <Text style={styles.statLabel}>{t('stats.library.totalVisits')}</Text>
          </View>
          
          <View style={styles.statCard}>
            <Clock size={24} color={currentTheme.colors.warning} />
            <Text style={styles.statValue}>{Math.round((analytics.timeSpentInLibrary || 0) / 60)}</Text>
            <Text style={styles.statLabel}>{t('stats.library.timeSpent')}</Text>
          </View>
          
                     <View style={styles.statCard}>
             <Target size={24} color={currentTheme.colors.success} />
             <Text style={styles.statValue}>{analytics.habitsAdded ? analytics.habitsAdded.length : 0}</Text>
             <Text style={styles.statLabel}>{t('stats.library.habitsAdded')}</Text>
           </View>
           
           <View style={styles.statCard}>
             <Star size={24} color={currentTheme.colors.accent} />
             <Text style={styles.statValue}>{analytics.coursesCompleted ? analytics.coursesCompleted.length : 0}</Text>
             <Text style={styles.statLabel}>{t('stats.library.coursesCompleted')}</Text>
           </View>
        </View>
      </View>

             {/* Learning Progress */}
       {analytics.coursesEnrolled && Array.isArray(analytics.coursesEnrolled) && analytics.coursesEnrolled.length > 0 ? (
         <View style={styles.section}>
           <Text style={styles.sectionTitle}>{t('stats.library.learningProgress')}</Text>
           <View style={styles.progressCard}>
             <View style={styles.progressHeader}>
               <Text style={styles.progressTitle}>{t('stats.library.coursesEnrolled')}</Text>
               <Text style={styles.progressValue}>{analytics.coursesEnrolled.length}</Text>
             </View>
             <View style={styles.progressBar}>
               <View 
                 style={[
                   styles.progressFill, 
                   { 
                     width: `${(analytics.coursesCompleted?.length || 0) / (analytics.coursesEnrolled?.length || 1) * 100}%`,
                     backgroundColor: currentTheme.colors.primary
                   }
                 ]} 
               />
             </View>
             <Text style={styles.progressText}>
               {analytics.coursesCompleted?.length || 0} {t('stats.library.of')} {analytics.coursesEnrolled?.length || 0} {t('stats.library.completed')}
             </Text>
           </View>
         </View>
       ) : null}

             {/* Recent Activity */}
       {insights?.popularSearchTerms && Array.isArray(insights.popularSearchTerms) && insights.popularSearchTerms.length > 0 ? (
         <View style={styles.section}>
           <Text style={styles.sectionTitle}>{t('stats.library.recentActivity')}</Text>
           <View style={styles.activityCard}>
             <Text style={styles.activityTitle}>{t('stats.library.popularSearches')}</Text>
             <View style={styles.tagContainer}>
               {insights.popularSearchTerms.slice(0, 5).map((term: string, index: number) => (
                 <View key={index} style={styles.tag}>
                   <Text style={styles.tagText}>{term}</Text>
                 </View>
               ))}
             </View>
           </View>
         </View>
       ) : null}

      {/* Engagement Score */}
      {insights?.userEngagementScore !== undefined && typeof insights.userEngagementScore === 'number' ? (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('stats.library.engagementScore')}</Text>
          <View style={styles.engagementCard}>
            <View style={styles.engagementHeader}>
              <TrendingUp size={24} color={currentTheme.colors.primary} />
              <Text style={styles.engagementValue}>{Math.round(insights.userEngagementScore)}%</Text>
            </View>
            <Text style={styles.engagementDescription}>
              {t('stats.library.engagementDescription')}
            </Text>
          </View>
        </View>
      ) : null}
    </ScrollView>
  );
}

const createStyles = (colors: any) => StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    fontSize: 16,
    color: colors.textSecondary,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyDescription: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
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
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
    marginTop: 8,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  progressCard: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  progressTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  progressValue: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.primary,
  },
  progressBar: {
    height: 8,
    backgroundColor: colors.border,
    borderRadius: 4,
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  activityCard: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  activityTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 12,
  },
  tagContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tag: {
    backgroundColor: colors.primary + '20',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  tagText: {
    fontSize: 12,
    color: colors.primary,
    fontWeight: '500',
  },
  engagementCard: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  engagementHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  engagementValue: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.primary,
    marginLeft: 8,
  },
  engagementDescription: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
  },
});
