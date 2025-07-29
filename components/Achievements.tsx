import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useGamification } from '@/context/GamificationContext';
import { useTheme } from '@/context/ThemeContext';
import { useLanguage } from '@/context/LanguageContext';
import { Achievement } from '@/types';
import { Award, Lock, Star } from 'lucide-react-native';

export default function Achievements() {
  const { gamificationData, getAvailableAchievements } = useGamification();
  const { currentTheme } = useTheme();
  const { t } = useLanguage();

  const achievements = getAvailableAchievements();
  const unlockedIds = gamificationData?.unlockedAchievements || [];

  const styles = createStyles(currentTheme.colors);

  const getRarityColor = (rarity: Achievement['rarity']) => {
    switch (rarity) {
      case 'common': return currentTheme.colors.textMuted;
      case 'rare': return '#3B82F6';
      case 'epic': return '#8B5CF6';
      case 'legendary': return '#F59E0B';
      default: return currentTheme.colors.textMuted;
    }
  };

  const renderAchievement = (item: Achievement) => {
    const isUnlocked = unlockedIds.includes(item.id);
    const rarityColor = getRarityColor(item.rarity);

    return (
      <TouchableOpacity 
        key={item.id}
        style={[styles.achievementCard, isUnlocked && styles.unlockedCard]}
        disabled={!isUnlocked}
      >
        <View style={styles.achievementHeader}>
          <View style={[styles.iconContainer, { backgroundColor: isUnlocked ? rarityColor + '20' : currentTheme.colors.surface }]}>
            {isUnlocked ? (
              <Text style={styles.achievementIcon}>{item.icon}</Text>
            ) : (
              <Lock size={24} color={currentTheme.colors.textMuted} />
            )}
          </View>
          <View style={styles.achievementInfo}>
            <Text style={[styles.achievementTitle, !isUnlocked && styles.lockedText]}>
              {item.title}
            </Text>
            <Text style={[styles.achievementDescription, !isUnlocked && styles.lockedText]}>
              {item.description}
            </Text>
          </View>
        </View>
        <View style={styles.achievementFooter}>
          <View style={[styles.rarityBadge, { backgroundColor: rarityColor + '20' }]}>
            <Star size={12} color={rarityColor} />
            <Text style={[styles.rarityText, { color: rarityColor }]}>
              {item.rarity.toUpperCase()}
            </Text>
          </View>
          <Text style={styles.xpReward}>+{item.xpReward} {t('gamification.achievements.xp')}</Text>
        </View>
      </TouchableOpacity>
    );
  };
  
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Award size={24} color={currentTheme.colors.primary} />
        <Text style={styles.title}>{t('gamification.achievements.title')}</Text>
        <Text style={styles.progress}>
          {unlockedIds.length}/{achievements.length}
        </Text>
      </View>
      
      <View style={styles.listContainer}>
        {achievements.map(renderAchievement)}
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
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginLeft: 8,
    flex: 1,
  },
  progress: {
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  listContainer: {
    paddingBottom: 16,
  },
  achievementCard: {
    backgroundColor: colors.surface,
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    opacity: 0.6,
  },
  unlockedCard: {
    opacity: 1,
    borderWidth: 1,
    borderColor: colors.primary + '30',
  },
  achievementHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  achievementIcon: {
    fontSize: 24,
  },
  achievementInfo: {
    flex: 1,
  },
  achievementTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 2,
  },
  achievementDescription: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  lockedText: {
    color: colors.textMuted,
  },
  achievementFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  rarityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  rarityText: {
    fontSize: 10,
    fontWeight: '600',
    marginLeft: 4,
  },
  xpReward: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.accent,
  },
});