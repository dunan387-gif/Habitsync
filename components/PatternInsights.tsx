import React, { useMemo } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { MoodEntry, HabitMoodEntry } from '../types';
import { useLanguage } from '@/context/LanguageContext';
import { useTheme } from '@/context/ThemeContext';
import { useSubscription } from '@/context/SubscriptionContext';
import { Crown } from 'lucide-react-native';

interface PatternInsightsProps {
  moodData: MoodEntry[];
  habitData: HabitMoodEntry[];
}

export default function PatternInsights({ moodData, habitData }: PatternInsightsProps) {
  const { t } = useLanguage();
  const { currentTheme } = useTheme();
  const { canUsePatternInsights, showUpgradePrompt } = useSubscription();
  
  // Safety check for currentTheme
  if (!currentTheme || !currentTheme.colors) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>Loading...</Text>
      </View>
    );
  }
  
  const styles = createStyles(currentTheme.colors);

  // Check if user can access pattern insights
  if (!canUsePatternInsights()) {
    return (
      <View style={styles.upgradeContainer}>
        <Crown size={48} color={currentTheme.colors.primary} />
        <Text style={styles.upgradeTitle}>{t('patternInsights.upgradeRequired')}</Text>
        <Text style={styles.upgradeMessage}>{t('patternInsights.upgradeMessage')}</Text>
        <TouchableOpacity 
          style={styles.upgradeButton}
          onPress={() => showUpgradePrompt('pattern_insights')}
        >
                      <Text style={styles.upgradeButtonText}>{t('premium.upgradeToPro')}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const patterns = useMemo(() => {
    return {
      weeklyPatterns: detectWeeklyPatterns(moodData),
      dailyRhythms: detectDailyRhythms(moodData),
      triggerPatterns: detectTriggerPatterns(moodData),
      habitSuccessPatterns: detectHabitSuccessPatterns(habitData),
      moodCycles: detectMoodCycles(moodData),
      environmentalCorrelations: detectEnvironmentalCorrelations(moodData)
    };
  }, [moodData, habitData]);
  
  return (
    <ScrollView>
      <View>
        <Text>{t('patternInsights.weeklyPatterns')}</Text>
        {patterns.weeklyPatterns.map(pattern => (
          <Text key={pattern.day}>
            {t(`patternInsights.weekdays.${pattern.day}`)}: {pattern.averageMood.toFixed(1)} {t('patternInsights.avgMood')}
          </Text>
        ))}
      </View>
      
      <View>
        <Text>{t('patternInsights.dailyRhythms')}</Text>
        {patterns.dailyRhythms.map(rhythm => (
          <Text key={rhythm.hour}>
            {rhythm.hour}:00 - {t(`patternInsights.${rhythm.moodTrend}`)}
          </Text>
        ))}
      </View>
      
      {/* ... additional pattern displays ... */}
    </ScrollView>
  );
}

function detectWeeklyPatterns(moodData: MoodEntry[]) {
  // Implementation for weekly pattern detection
  const weeklyData = moodData.reduce((acc, entry) => {
    const dayOfWeek = new Date(entry.date).getDay();
    if (!acc[dayOfWeek]) acc[dayOfWeek] = [];
    acc[dayOfWeek].push(entry.intensity);
    return acc;
  }, {} as Record<number, number[]>);
  
  const weekdayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  
  return Object.entries(weeklyData).map(([day, intensities]) => ({
    day: weekdayNames[parseInt(day)],
    averageMood: intensities.reduce((a, b) => a + b, 0) / intensities.length,
    variance: calculateVariance(intensities)
  }));
}

function detectDailyRhythms(moodData: MoodEntry[]) {
  // Implementation for daily rhythm detection
  const hourlyData = moodData.reduce((acc, entry) => {
    const hour = new Date(entry.timestamp).getHours();
    if (!acc[hour]) acc[hour] = [];
    acc[hour].push(entry.intensity);
    return acc;
  }, {} as Record<number, number[]>);
  
  return Object.entries(hourlyData).map(([hour, intensities]) => ({
    hour: parseInt(hour),
    averageMood: intensities.reduce((a, b) => a + b, 0) / intensities.length,
    moodTrend: intensities.length > 1 ? 
      (intensities[intensities.length - 1] > intensities[0] ? 'improving' : 'declining') : 'stable'
  }));
}

function detectTriggerPatterns(moodData: MoodEntry[]) {
  // Implementation for trigger pattern detection
  return moodData.filter(entry => entry.triggers && entry.triggers.length > 0)
    .reduce((acc, entry) => {
      entry.triggers?.forEach(trigger => {
        if (!acc[trigger]) acc[trigger] = { count: 0, totalIntensity: 0 };
        acc[trigger].count++;
        acc[trigger].totalIntensity += entry.intensity;
      });
      return acc;
    }, {} as Record<string, { count: number; totalIntensity: number }>);
}

function detectHabitSuccessPatterns(habitData: HabitMoodEntry[]) {
  // Implementation for habit success pattern detection
  return habitData.reduce((acc, entry) => {
    if (!acc[entry.habitId]) {
      acc[entry.habitId] = { completed: 0, total: 0, avgPreMood: 0 };
    }
    acc[entry.habitId].total++;
    if (entry.action === 'completed') {
      acc[entry.habitId].completed++;
    }
    if (entry.preMood) {
      acc[entry.habitId].avgPreMood += entry.preMood.intensity;
    }
    return acc;
  }, {} as Record<string, { completed: number; total: number; avgPreMood: number }>);
}

function detectMoodCycles(moodData: MoodEntry[]) {
  // Implementation for mood cycle detection
  if (moodData.length < 7) return [];
  
  const sortedData = moodData.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  const cycles = [];
  
  for (let i = 0; i < sortedData.length - 6; i++) {
    const week = sortedData.slice(i, i + 7);
    const avgMood = week.reduce((sum, entry) => sum + entry.intensity, 0) / 7;
    cycles.push({
      startDate: week[0].date,
      endDate: week[6].date,
      averageMood: avgMood,
      trend: week[6].intensity > week[0].intensity ? 'improving' : 'declining'
    });
  }
  
  return cycles;
}

function detectEnvironmentalCorrelations(moodData: MoodEntry[]) {
  // Implementation for environmental correlation detection
  return moodData.reduce((acc, entry) => {
    entry.triggers?.forEach(trigger => {
      if (['weather', 'sleep', 'exercise'].includes(trigger)) {
        if (!acc[trigger]) acc[trigger] = [];
        acc[trigger].push(entry.intensity);
      }
    });
    return acc;
  }, {} as Record<string, number[]>);
}

function calculateVariance(values: number[]): number {
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const squaredDiffs = values.map(value => Math.pow(value - mean, 2));
  return squaredDiffs.reduce((a, b) => a + b, 0) / values.length;
}

function createStyles(colors: any) {
  return StyleSheet.create({
    upgradeContainer: {
      flex: 1,
      justifyContent: 'center' as const,
      alignItems: 'center' as const,
      padding: 20,
      backgroundColor: colors.background,
    },
    upgradeTitle: {
      fontSize: 24,
      fontWeight: 'bold' as const,
      marginTop: 10,
      textAlign: 'center' as const,
      color: colors.text,
    },
    upgradeMessage: {
      fontSize: 16,
      marginTop: 5,
      textAlign: 'center' as const,
      color: colors.textSecondary,
    },
    upgradeButton: {
      backgroundColor: colors.primary,
      paddingVertical: 10,
      paddingHorizontal: 20,
      borderRadius: 8,
      marginTop: 20,
    },
    upgradeButtonText: {
      color: colors.onPrimary,
      fontSize: 18,
      fontWeight: 'bold' as const,
    },
  });
}