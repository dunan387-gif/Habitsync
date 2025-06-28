import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useLanguage } from '@/context/LanguageContext';
import { useTheme } from '@/context/ThemeContext';

type StreakSummaryProps = {
  completedCount: number;
  totalCount: number;
};

export default function StreakSummary({ completedCount, totalCount }: StreakSummaryProps) {
  const { t } = useLanguage();
  const { currentTheme } = useTheme();
  const progress = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

  const styles = createStyles(currentTheme.colors);

  return (
    <View style={styles.container}>
      <View style={styles.progressContainer}>
        <View style={styles.progressBackground}>
          <View style={[styles.progressFill, { width: `${progress}%` }]} />
        </View>
      </View>
      
      <View style={styles.textContainer}>
        <Text style={styles.title}>{t('today_progress')}</Text>
        <Text style={styles.subtitle}>
          {completedCount} {t('of')} {totalCount} {t('habits_completed')}
        </Text>
      </View>
    </View>
  );
}

const createStyles = (colors: any) => StyleSheet.create({
  container: {
    padding: 16,
  },
  progressContainer: {
    marginBottom: 12,
  },
  progressBackground: {
    height: 8,
    backgroundColor: colors.border,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 4,
  },
  textContainer: {
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.textMuted, // Now uses same color as date text
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: colors.textMuted, // Uses theme color
  },
  card: {
    borderRadius: 16,
    overflow: 'hidden',
    padding: 16,
  },
  content: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  progressCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  progressBar: {
    height: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 4,
    marginTop: 16,
    overflow: 'hidden',
  },
});