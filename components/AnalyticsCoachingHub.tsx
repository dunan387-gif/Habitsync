import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useTheme } from '@/context/ThemeContext';
import { useLanguage } from '@/context/LanguageContext';
import AdvancedAnalyticsDashboard from './AdvancedAnalyticsDashboard';
import EnhancedCoachingDashboard from './EnhancedCoachingDashboard';
import { MoodEntry, HabitMoodEntry } from '@/types';

interface AnalyticsCoachingHubProps {
  moodData: MoodEntry[];
  habitMoodData: HabitMoodEntry[];
}

export default function AnalyticsCoachingHub({ moodData, habitMoodData }: AnalyticsCoachingHubProps) {
  const { currentTheme } = useTheme();
  const { t } = useLanguage();
  const [activeView, setActiveView] = useState<'analytics' | 'coaching'>('analytics');
  
  const styles = createStyles(currentTheme.colors);

  return (
    <View style={styles.container}>
      {/* Main Navigation */}
      <View style={styles.navigationContainer}>
        <TouchableOpacity
          style={[styles.navButton, activeView === 'analytics' && styles.activeNavButton]}
          onPress={() => setActiveView('analytics')}
        >
          <Text style={[styles.navButtonText, activeView === 'analytics' && styles.activeNavButtonText]}>
            📊 Analytics
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.navButton, activeView === 'coaching' && styles.activeNavButton]}
          onPress={() => setActiveView('coaching')}
        >
          <Text style={[styles.navButtonText, activeView === 'coaching' && styles.activeNavButtonText]}>
            🤖 Coaching
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      {activeView === 'analytics' ? (
        <AdvancedAnalyticsDashboard moodData={moodData} habitMoodData={habitMoodData} />
      ) : (
        <EnhancedCoachingDashboard moodData={moodData} habitMoodData={habitMoodData} />
      )}
    </View>
  );
}

const createStyles = (colors: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  navigationContainer: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    paddingHorizontal: 20,
    paddingTop: 40,
    paddingBottom: 16,
    gap: 12,
  },
  navButton: {
    flex: 1,
    paddingVertical: 16,
    paddingHorizontal: 20,
    backgroundColor: colors.card,
    borderRadius: 12,
    alignItems: 'center',
  },
  activeNavButton: {
    backgroundColor: colors.primary,
  },
  navButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  activeNavButtonText: {
    color: colors.background,
  },
});