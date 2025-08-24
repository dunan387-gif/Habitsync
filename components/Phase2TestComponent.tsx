import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useCrossTabInsights } from '@/context/CrossTabInsightsContext';
import { useTheme } from '@/context/ThemeContext';
import { useLanguage } from '@/context/LanguageContext';
import TodayFocusCard from './TodayFocusCard';
import WeeklyProgressCard from './WeeklyProgressCard';
import LearningImpactCard from './LearningImpactCard';

export default function Phase2TestComponent() {
  const { state, refreshAllData, generateTodayInsight, generateWeeklyProgress, generateLearningInsight } = useCrossTabInsights();
  const { currentTheme } = useTheme();
  const { t } = useLanguage();

  const handleRefresh = async () => {
    try {
      await refreshAllData();
    } catch (error) {
      console.error('Failed to refresh data:', error);
    }
  };

  const handleTodayAction = () => {
    console.log('Today action pressed');
    // Navigate to home tab or specific habit
  };

  const handleWeeklyAction = () => {
    console.log('Weekly action pressed');
    // Navigate to detailed analytics
  };

  const handleLearningAction = () => {
    console.log('Learning action pressed');
    // Navigate to library tab
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: currentTheme.colors.background }]}>
      <Text style={[styles.title, { color: currentTheme.colors.text }]}>
        Phase 2: Core Analytics Components
      </Text>
      
      <Text style={[styles.subtitle, { color: currentTheme.colors.textSecondary }]}>
        Testing the new simplified analytics components
      </Text>

      <View style={styles.statusSection}>
        <Text style={[styles.sectionTitle, { color: currentTheme.colors.text }]}>
          Component Status
        </Text>
        
        <View style={styles.statusRow}>
          <Text style={[styles.statusLabel, { color: currentTheme.colors.textSecondary }]}>
            Today's Insight:
          </Text>
          <Text style={[styles.statusValue, { color: currentTheme.colors.text }]}>
            {state.todayInsight ? '✅ Ready' : '⏳ Loading'}
          </Text>
        </View>

        <View style={styles.statusRow}>
          <Text style={[styles.statusLabel, { color: currentTheme.colors.textSecondary }]}>
            Weekly Progress:
          </Text>
          <Text style={[styles.statusValue, { color: currentTheme.colors.text }]}>
            {state.weeklyProgress ? '✅ Ready' : '⏳ Loading'}
          </Text>
        </View>

        <View style={styles.statusRow}>
          <Text style={[styles.statusLabel, { color: currentTheme.colors.textSecondary }]}>
            Learning Impact:
          </Text>
          <Text style={[styles.statusValue, { color: currentTheme.colors.text }]}>
            {state.learningInsight ? '✅ Ready' : '⏳ Loading'}
          </Text>
        </View>
      </View>

      <View style={styles.componentsSection}>
        <Text style={[styles.sectionTitle, { color: currentTheme.colors.text }]}>
          Today's Focus Card
        </Text>
        <TodayFocusCard onActionPress={handleTodayAction} />
      </View>

      <View style={styles.componentsSection}>
        <Text style={[styles.sectionTitle, { color: currentTheme.colors.text }]}>
          Weekly Progress Card
        </Text>
        <WeeklyProgressCard onRecommendationPress={handleWeeklyAction} />
      </View>

      <View style={styles.componentsSection}>
        <Text style={[styles.sectionTitle, { color: currentTheme.colors.text }]}>
          Learning Impact Card
        </Text>
        <LearningImpactCard onLearningPress={handleLearningAction} />
      </View>

      <View style={styles.componentsSection}>
        <Text style={[styles.sectionTitle, { color: currentTheme.colors.text }]}>
          Compact Versions
        </Text>
        
        <Text style={[styles.compactLabel, { color: currentTheme.colors.textSecondary }]}>
          Today's Focus (Compact)
        </Text>
        <TodayFocusCard onActionPress={handleTodayAction} compact={true} />
        
        <Text style={[styles.compactLabel, { color: currentTheme.colors.textSecondary }]}>
          Weekly Progress (Compact)
        </Text>
        <WeeklyProgressCard onRecommendationPress={handleWeeklyAction} compact={true} />
        
        <Text style={[styles.compactLabel, { color: currentTheme.colors.textSecondary }]}>
          Learning Impact (Compact)
        </Text>
        <LearningImpactCard onLearningPress={handleLearningAction} compact={true} />
      </View>

      <View style={styles.controlsSection}>
        <Text style={[styles.sectionTitle, { color: currentTheme.colors.text }]}>
          Test Controls
        </Text>
        
        <TouchableOpacity
          style={[styles.button, { backgroundColor: currentTheme.colors.primary }]}
          onPress={handleRefresh}
          disabled={state.isLoading}
        >
          <Text style={styles.buttonText}>
            {state.isLoading ? 'Refreshing...' : 'Refresh All Data'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, { backgroundColor: currentTheme.colors.accent }]}
          onPress={generateTodayInsight}
          disabled={state.isLoading}
        >
          <Text style={styles.buttonText}>
            Generate Today's Insight
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, { backgroundColor: currentTheme.colors.accent }]}
          onPress={generateWeeklyProgress}
          disabled={state.isLoading}
        >
          <Text style={styles.buttonText}>
            Generate Weekly Progress
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, { backgroundColor: currentTheme.colors.accent }]}
          onPress={generateLearningInsight}
          disabled={state.isLoading}
        >
          <Text style={styles.buttonText}>
            Generate Learning Insight
          </Text>
        </TouchableOpacity>
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
  statusSection: {
    marginBottom: 24,
    padding: 16,
    borderRadius: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  statusLabel: {
    fontSize: 14,
    flex: 1,
  },
  statusValue: {
    fontSize: 14,
    fontWeight: '500',
  },
  componentsSection: {
    marginBottom: 24,
  },
  compactLabel: {
    fontSize: 14,
    fontWeight: '500',
    marginTop: 16,
    marginBottom: 8,
  },
  controlsSection: {
    marginBottom: 24,
    gap: 12,
  },
  button: {
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});
