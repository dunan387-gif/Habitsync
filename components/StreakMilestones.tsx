import React from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';
import { useGamification } from '@/context/GamificationContext';
import { useHabits } from '@/context/HabitContext';
import { useTheme } from '@/context/ThemeContext';
import { Flame, Trophy, Star } from 'lucide-react-native';

export default function StreakMilestones() {
  const { gamificationData } = useGamification();
  const { habits } = useHabits();
  const { currentTheme } = useTheme();

  const styles = createStyles(currentTheme.colors);

  const milestones = gamificationData?.streakMilestones || [];
  const recentMilestones = milestones.slice(-5).reverse(); // Show last 5 milestones

  const getMilestoneIcon = (streakLength: number) => {
    if (streakLength >= 100) return <Trophy size={20} color="#F59E0B" />;
    if (streakLength >= 30) return <Star size={20} color="#8B5CF6" />;
    return <Flame size={20} color="#EF4444" />;
  };

  const getMilestoneColor = (streakLength: number) => {
    if (streakLength >= 100) return '#F59E0B';
    if (streakLength >= 30) return '#8B5CF6';
    return '#EF4444';
  };

  const renderMilestone = ({ item }: { item: any }) => {
    const habit = habits?.find(h => h.id === item.habitId);
    const milestoneColor = getMilestoneColor(item.streakLength);
    
    return (
      <View style={styles.milestoneCard}>
        <View style={[styles.iconContainer, { backgroundColor: milestoneColor + '20' }]}>
          {getMilestoneIcon(item.streakLength)}
        </View>
        <View style={styles.milestoneContent}>
          <Text style={styles.milestoneTitle}>
            {item.streakLength}-Day Streak!
          </Text>
          <Text style={styles.habitTitle}>{habit?.title || 'Unknown Habit'}</Text>
          <Text style={styles.milestoneDate}>
            {new Date(item.achievedAt).toLocaleDateString()}
          </Text>
        </View>
        <View style={styles.xpBadge}>
          <Text style={styles.xpText}>+{item.xpEarned}</Text>
        </View>
      </View>
    );
  };

  if (recentMilestones.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Flame size={20} color={currentTheme.colors.primary} />
          <Text style={styles.title}>Streak Milestones</Text>
        </View>
        <View style={styles.emptyState}>
          <Flame size={48} color={currentTheme.colors.textMuted} />
          <Text style={styles.emptyText}>No milestones yet</Text>
          <Text style={styles.emptySubtext}>Keep building streaks to unlock milestones!</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Flame size={20} color={currentTheme.colors.primary} />
        <Text style={styles.title}>Recent Streak Milestones</Text>
      </View>
      
      <FlatList
        data={recentMilestones}
        renderItem={renderMilestone}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContainer}
      />
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
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginLeft: 8,
  },
  listContainer: {
    paddingBottom: 8,
  },
  milestoneCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  milestoneContent: {
    flex: 1,
  },
  milestoneTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 2,
  },
  habitTitle: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 2,
  },
  milestoneDate: {
    fontSize: 10,
    color: colors.textMuted,
  },
  xpBadge: {
    backgroundColor: colors.accent + '20',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  xpText: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.accent,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.textMuted,
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 8,
    textAlign: 'center',
  },
});