import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useTheme } from '@/context/ThemeContext';
import { useLanguage } from '@/context/LanguageContext';
import { useHomeAnalytics } from '@/hooks/useHomeAnalytics';
import { useLibraryAnalytics } from '@/hooks/useLibraryAnalytics';
import { useGamificationAnalytics } from '@/hooks/useGamificationAnalytics';
import { useSettingsAnalytics } from '@/hooks/useSettingsAnalytics';

export default function Phase3TestComponent() {
  const { currentTheme } = useTheme();
  const { t } = useLanguage();
  
  // Use all the cross-tab analytics hooks
  const homeAnalytics = useHomeAnalytics();
  const libraryAnalytics = useLibraryAnalytics();
  const gamificationAnalytics = useGamificationAnalytics();
  const settingsAnalytics = useSettingsAnalytics();

  return (
    <ScrollView style={[styles.container, { backgroundColor: currentTheme.colors.background }]}>
      <Text style={[styles.title, { color: currentTheme.colors.text }]}>
        Phase 3: Cross-Tab Integration
      </Text>
      
      <Text style={[styles.subtitle, { color: currentTheme.colors.textSecondary }]}>
        Testing cross-tab analytics hooks and data integration
      </Text>

      {/* Home Analytics Section */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: currentTheme.colors.text }]}>
          🏠 Home Analytics
        </Text>
        
        <View style={[styles.card, { backgroundColor: currentTheme.colors.surface }]}>
          <Text style={[styles.metricLabel, { color: currentTheme.colors.textSecondary }]}>
            Today's Completions
          </Text>
          <Text style={[styles.metricValue, { color: currentTheme.colors.text }]}>
            {homeAnalytics.todayCompletions} / {homeAnalytics.totalHabits}
          </Text>
          <Text style={[styles.metricSubtext, { color: currentTheme.colors.textSecondary }]}>
            {homeAnalytics.completionRate.toFixed(1)}% completion rate
          </Text>
        </View>

        <View style={[styles.card, { backgroundColor: currentTheme.colors.surface }]}>
          <Text style={[styles.metricLabel, { color: currentTheme.colors.textSecondary }]}>
            Current Streak
          </Text>
          <Text style={[styles.metricValue, { color: currentTheme.colors.text }]}>
            {homeAnalytics.currentStreak} days
          </Text>
          <Text style={[styles.metricSubtext, { color: currentTheme.colors.textSecondary }]}>
            Longest: {homeAnalytics.longestStreak} days
          </Text>
        </View>

        <View style={[styles.card, { backgroundColor: currentTheme.colors.surface }]}>
          <Text style={[styles.metricLabel, { color: currentTheme.colors.textSecondary }]}>
            Next Habit Recommendation
          </Text>
          <Text style={[styles.metricValue, { color: currentTheme.colors.text }]}>
            {homeAnalytics.nextHabitRecommendation}
          </Text>
        </View>

        <View style={[styles.card, { backgroundColor: currentTheme.colors.surface }]}>
          <Text style={[styles.metricLabel, { color: currentTheme.colors.textSecondary }]}>
            Motivation
          </Text>
          <Text style={[styles.metricValue, { color: currentTheme.colors.text }]}>
            {homeAnalytics.motivation}
          </Text>
        </View>
      </View>

      {/* Library Analytics Section */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: currentTheme.colors.text }]}>
          📚 Library Analytics
        </Text>
        
        <View style={[styles.card, { backgroundColor: currentTheme.colors.surface }]}>
          <Text style={[styles.metricLabel, { color: currentTheme.colors.textSecondary }]}>
            Course Progress
          </Text>
          <Text style={[styles.metricValue, { color: currentTheme.colors.text }]}>
            {libraryAnalytics.coursesCompleted} / {libraryAnalytics.totalCourses}
          </Text>
          <Text style={[styles.metricSubtext, { color: currentTheme.colors.textSecondary }]}>
            {libraryAnalytics.completionRate.toFixed(1)}% completion rate
          </Text>
        </View>

        <View style={[styles.card, { backgroundColor: currentTheme.colors.surface }]}>
          <Text style={[styles.metricLabel, { color: currentTheme.colors.textSecondary }]}>
            Course Impact
          </Text>
          <Text style={[styles.metricValue, { color: currentTheme.colors.text }]}>
            {libraryAnalytics.courseImpact}
          </Text>
        </View>

        <View style={[styles.card, { backgroundColor: currentTheme.colors.surface }]}>
          <Text style={[styles.metricLabel, { color: currentTheme.colors.textSecondary }]}>
            Next Course Recommendation
          </Text>
          <Text style={[styles.metricValue, { color: currentTheme.colors.text }]}>
            {libraryAnalytics.nextCourseRecommendation}
          </Text>
        </View>

        <View style={[styles.card, { backgroundColor: currentTheme.colors.surface }]}>
          <Text style={[styles.metricLabel, { color: currentTheme.colors.textSecondary }]}>
            Impact Score
          </Text>
          <Text style={[styles.metricValue, { color: currentTheme.colors.text }]}>
            {libraryAnalytics.impactScore}/100
          </Text>
        </View>
      </View>

      {/* Gamification Analytics Section */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: currentTheme.colors.text }]}>
          🏆 Gamification Analytics
        </Text>
        
        <View style={[styles.card, { backgroundColor: currentTheme.colors.surface }]}>
          <Text style={[styles.metricLabel, { color: currentTheme.colors.textSecondary }]}>
            Current Level
          </Text>
          <Text style={[styles.metricValue, { color: currentTheme.colors.text }]}>
            Level {gamificationAnalytics.currentLevel}
          </Text>
          <Text style={[styles.metricSubtext, { color: currentTheme.colors.textSecondary }]}>
            {gamificationAnalytics.levelProgress.toFixed(1)}% to next level
          </Text>
        </View>

        <View style={[styles.card, { backgroundColor: currentTheme.colors.surface }]}>
          <Text style={[styles.metricLabel, { color: currentTheme.colors.textSecondary }]}>
            Total XP
          </Text>
          <Text style={[styles.metricValue, { color: currentTheme.colors.text }]}>
            {gamificationAnalytics.totalXP} XP
          </Text>
        </View>

        <View style={[styles.card, { backgroundColor: currentTheme.colors.surface }]}>
          <Text style={[styles.metricLabel, { color: currentTheme.colors.textSecondary }]}>
            Next Milestone
          </Text>
          <Text style={[styles.metricValue, { color: currentTheme.colors.text }]}>
            {gamificationAnalytics.nextMilestone.title}
          </Text>
          <Text style={[styles.metricSubtext, { color: currentTheme.colors.textSecondary }]}>
            {gamificationAnalytics.nextMilestone.xpRequired} XP needed
          </Text>
        </View>

        <View style={[styles.card, { backgroundColor: currentTheme.colors.surface }]}>
          <Text style={[styles.metricLabel, { color: currentTheme.colors.textSecondary }]}>
            Streak Motivation
          </Text>
          <Text style={[styles.metricValue, { color: currentTheme.colors.text }]}>
            {gamificationAnalytics.streakMotivation}
          </Text>
        </View>
      </View>

      {/* Settings Analytics Section */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: currentTheme.colors.text }]}>
          ⚙️ Settings Analytics
        </Text>
        
        <View style={[styles.card, { backgroundColor: currentTheme.colors.surface }]}>
          <Text style={[styles.metricLabel, { color: currentTheme.colors.textSecondary }]}>
            Personalization Score
          </Text>
          <Text style={[styles.metricValue, { color: currentTheme.colors.text }]}>
            {settingsAnalytics.personalizationScore}/100
          </Text>
        </View>

        <View style={[styles.card, { backgroundColor: currentTheme.colors.surface }]}>
          <Text style={[styles.metricLabel, { color: currentTheme.colors.textSecondary }]}>
            Difficulty Level
          </Text>
          <Text style={[styles.metricValue, { color: currentTheme.colors.text }]}>
            {settingsAnalytics.difficultyLevel}
          </Text>
        </View>

        <View style={[styles.card, { backgroundColor: currentTheme.colors.surface }]}>
          <Text style={[styles.metricLabel, { color: currentTheme.colors.textSecondary }]}>
            Habit Alignment
          </Text>
          <Text style={[styles.metricValue, { color: currentTheme.colors.text }]}>
            {settingsAnalytics.habitAlignment.alignedHabits} / {settingsAnalytics.habitAlignment.totalHabits}
          </Text>
          <Text style={[styles.metricSubtext, { color: currentTheme.colors.textSecondary }]}>
            {settingsAnalytics.habitAlignment.alignmentScore.toFixed(1)}% aligned
          </Text>
        </View>

        <View style={[styles.card, { backgroundColor: currentTheme.colors.surface }]}>
          <Text style={[styles.metricLabel, { color: currentTheme.colors.textSecondary }]}>
            Optimal Habit Count
          </Text>
          <Text style={[styles.metricValue, { color: currentTheme.colors.text }]}>
            {settingsAnalytics.performanceInsights.optimalHabitCount} habits
          </Text>
        </View>
      </View>

      {/* Cross-Tab Integration Summary */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: currentTheme.colors.text }]}>
          🔗 Cross-Tab Integration Summary
        </Text>
        
        <View style={[styles.card, { backgroundColor: currentTheme.colors.surface }]}>
          <Text style={[styles.metricLabel, { color: currentTheme.colors.textSecondary }]}>
            Data Sources Connected
          </Text>
          <Text style={[styles.metricValue, { color: currentTheme.colors.text }]}>
            4/4 Tabs
          </Text>
          <Text style={[styles.metricSubtext, { color: currentTheme.colors.textSecondary }]}>
            Home • Library • Gamification • Settings
          </Text>
        </View>

        <View style={[styles.card, { backgroundColor: currentTheme.colors.surface }]}>
          <Text style={[styles.metricLabel, { color: currentTheme.colors.textSecondary }]}>
            Analytics Hooks Created
          </Text>
          <Text style={[styles.metricValue, { color: currentTheme.colors.text }]}>
            4 Hooks
          </Text>
          <Text style={[styles.metricSubtext, { color: currentTheme.colors.textSecondary }]}>
            useHomeAnalytics • useLibraryAnalytics • useGamificationAnalytics • useSettingsAnalytics
          </Text>
        </View>

        <View style={[styles.card, { backgroundColor: currentTheme.colors.surface }]}>
          <Text style={[styles.metricLabel, { color: currentTheme.colors.textSecondary }]}>
            Cross-Tab Insights
          </Text>
          <Text style={[styles.metricValue, { color: currentTheme.colors.text }]}>
            Active
          </Text>
          <Text style={[styles.metricSubtext, { color: currentTheme.colors.textSecondary }]}>
            Real-time data sharing and correlation
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 24,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 12,
  },
  card: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  metricLabel: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 4,
  },
  metricValue: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  metricSubtext: {
    fontSize: 12,
    fontStyle: 'italic',
  },
});


