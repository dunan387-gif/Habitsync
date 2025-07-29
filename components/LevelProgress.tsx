import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useGamification } from '@/context/GamificationContext';
import { useTheme } from '@/context/ThemeContext';
import { useLanguage } from '@/context/LanguageContext';
import { TrendingUp, Zap } from 'lucide-react-native';

export default function LevelProgress() {
  const { gamificationData } = useGamification();
  const { currentTheme } = useTheme();
  const { t } = useLanguage();

  if (!gamificationData) return null;

  const { userLevel } = gamificationData;
  const progressPercentage = (userLevel.currentXP / userLevel.xpToNextLevel) * 100;

  const styles = createStyles(currentTheme.colors);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.levelBadge}>
          <TrendingUp size={16} color={currentTheme.colors.primary} />
          <Text style={styles.levelText}>{t('gamification.levelProgress.level')} {userLevel.level}</Text>
        </View>
        <View style={styles.xpContainer}>
          <Zap size={14} color={currentTheme.colors.accent} />
          <Text style={styles.xpText}>+{gamificationData.dailyXPEarned} {t('gamification.levelProgress.xpToday')}</Text>
        </View>
      </View>
      
      <Text style={styles.title}>{userLevel.title}</Text>
      
      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <View 
            style={[styles.progressFill, { width: `${progressPercentage}%` }]} 
          />
        </View>
        <Text style={styles.progressText}>
          {userLevel.currentXP} / {userLevel.xpToNextLevel} {t('gamification.levelProgress.xp')}
        </Text>
      </View>
      
      <View style={styles.perksContainer}>
        <Text style={styles.perksTitle}>{t('gamification.levelProgress.levelPerks')}</Text>
        {userLevel.perks.map((perk, index) => (
          <Text key={index} style={styles.perk}>• {perk}</Text>
        ))}
      </View>
    </View>
  );
}

const createStyles = (colors: any) => StyleSheet.create({
  container: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  levelBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary + '20',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  levelText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
    marginLeft: 4,
  },
  xpContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  xpText: {
    fontSize: 12,
    color: colors.accent,
    marginLeft: 4,
    fontWeight: '500',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 12,
  },
  progressContainer: {
    marginBottom: 16,
  },
  progressBar: {
    height: 8,
    backgroundColor: colors.surface,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 4,
  },
  progressText: {
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  perksContainer: {
    backgroundColor: colors.surface,
    borderRadius: 8,
    padding: 12,
  },
  perksTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  perk: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 4,
  },
});