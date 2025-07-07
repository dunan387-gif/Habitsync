import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Share } from 'react-native';
import { useHabits } from '@/context/HabitContext';
import { useGamification } from '@/context/GamificationContext';
import { useTheme } from '@/context/ThemeContext';
import { Share2, Trophy, TrendingUp, Calendar, Target } from 'lucide-react-native';

export default function ShareProgress() {
  const { habits, getTotalCompletions, getOverallCompletionRate } = useHabits();
  const { gamificationData } = useGamification();
  const { currentTheme } = useTheme();
  const [isSharing, setIsSharing] = useState(false);

  const styles = createStyles(currentTheme.colors);

  // Add null check for habits
  if (!habits) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Loading habits...</Text>
      </View>
    );
  }

  const generateShareMessage = () => {
    const totalHabits = habits.length;
    const totalCompletions = getTotalCompletions();
    const completionRate = getOverallCompletionRate();
    const level = gamificationData?.userLevel.level || 1;
    const totalXP = gamificationData?.userLevel.totalXP || 0;
    const achievements = gamificationData?.unlockedAchievements.length || 0;
    const longestStreak = habits.length > 0 ? Math.max(...habits.map(h => h.bestStreak || 0), 0) : 0;

    return `🎯 My Habit Tracker Progress 🎯\n\n` +
           `📊 Level ${level} (${totalXP} XP)\n` +
           `🏆 ${achievements} Achievements Unlocked\n` +
           `📈 ${totalHabits} Active Habits\n` +
           `✅ ${totalCompletions} Total Completions\n` +
           `📅 ${longestStreak} Day Best Streak\n` +
           `💯 ${completionRate.toFixed(1)}% Success Rate\n\n` +
           `Join me in building better habits! 💪\n` +
           `#HabitTracker #PersonalGrowth #Productivity`;
  };

  const handleShare = async () => {
    setIsSharing(true);
    try {
      const message = generateShareMessage();
      const result = await Share.share({
        message,
        title: 'My Habit Tracker Progress'
      });
      
      if (result.action === Share.sharedAction) {
        Alert.alert('Success!', 'Your progress has been shared! 🎉');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to share progress. Please try again.');
    } finally {
      setIsSharing(false);
    }
  };

  const shareStats = [
    {
      icon: TrendingUp,
      label: 'Level',
      value: gamificationData?.userLevel.level || 1,
      color: currentTheme.colors.primary
    },
    {
      icon: Trophy,
      label: 'Achievements',
      value: gamificationData?.unlockedAchievements.length || 0,
      color: '#FFD700'
    },
    {
      icon: Target,
      label: 'Active Habits',
      value: habits.length,
      color: '#4ECDC4'
    },
    {
      icon: Calendar,
      label: 'Best Streak',
      value: habits.length > 0 ? Math.max(...habits.map(h => h.bestStreak || 0), 0) : 0,
      color: '#FF6B6B'
    }
  ];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Share2 size={20} color={currentTheme.colors.primary} />
        <Text style={styles.title}>Share Your Progress</Text>
      </View>
      
      <Text style={styles.subtitle}>Show off your achievements and inspire others!</Text>
      
      <View style={styles.statsGrid}>
        {shareStats.map((stat, index) => {
          const IconComponent = stat.icon;
          return (
            <View key={index} style={styles.statCard}>
              <IconComponent size={24} color={stat.color} />
              <Text style={styles.statValue}>{stat.value}</Text>
              <Text style={styles.statLabel}>{stat.label}</Text>
            </View>
          );
        })}
      </View>
      
      <TouchableOpacity
        style={[styles.shareButton, isSharing && styles.disabledButton]}
        onPress={handleShare}
        disabled={isSharing}
      >
        <Share2 size={20} color="white" />
        <Text style={styles.shareButtonText}>
          {isSharing ? 'Sharing...' : 'Share Progress'}
        </Text>
      </TouchableOpacity>
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
    marginBottom: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginLeft: 8,
  },
  subtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  statCard: {
    backgroundColor: colors.surface,
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    width: '48%',
    marginBottom: 8,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
    marginTop: 4,
  },
  statLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  shareButton: {
    backgroundColor: colors.primary,
    borderRadius: 8,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabledButton: {
    opacity: 0.6,
  },
  shareButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
});