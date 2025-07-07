import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView, TouchableOpacity } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useTheme } from '@/context/ThemeContext';
import { useGamification } from '@/context/GamificationContext';
import { Trophy, TrendingUp, Heart, Flame } from 'lucide-react-native';
import LevelProgress from '@/components/LevelProgress';
import Achievements from '@/components/Achievements';
import MoodCheckIn from '@/components/MoodCheckIn';
import StreakMilestones from '@/components/StreakMilestones';

type TabType = 'overview' | 'achievements' | 'mood' | 'milestones';

export default function GamificationScreen() {
  const { currentTheme } = useTheme();
  const { gamificationData } = useGamification();
  const [activeTab, setActiveTab] = useState<TabType>('overview');

  const styles = createStyles(currentTheme.colors);

  const renderTabButton = (tab: TabType, icon: React.ReactNode, label: string) => (
    <TouchableOpacity
      style={[styles.tabButton, activeTab === tab && styles.activeTabButton]}
      onPress={() => setActiveTab(tab)}
    >
      {icon}
    </TouchableOpacity>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <>
            <LevelProgress />
            <MoodCheckIn />
            <StreakMilestones />
          </>
        );
      case 'achievements':
        return <Achievements />;
      case 'mood':
        return <MoodCheckIn />;
      case 'milestones':
        return <StreakMilestones />;
      default:
        return null;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style={currentTheme.isDark ? 'light' : 'dark'} />
      
      <View style={styles.header}>
        <Text style={styles.title}>🎮 Gamification</Text>
        <Text style={styles.subtitle}>Level up your habit journey</Text>
      </View>

      <View style={styles.tabContainer}>
        {renderTabButton(
          'overview',
          <TrendingUp size={20} color={activeTab === 'overview' ? currentTheme.colors.primary : currentTheme.colors.textMuted} />,
          'Overview'
        )}
        {renderTabButton(
          'achievements',
          <Trophy size={20} color={activeTab === 'achievements' ? currentTheme.colors.primary : currentTheme.colors.textMuted} />,
          'Achievements'
        )}
        {renderTabButton(
          'mood',
          <Heart size={20} color={activeTab === 'mood' ? currentTheme.colors.primary : currentTheme.colors.textMuted} />,
          'Mood'
        )}
        {renderTabButton(
          'milestones',
          <Flame size={20} color={activeTab === 'milestones' ? currentTheme.colors.primary : currentTheme.colors.textMuted} />,
          'Milestones'
        )}
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {renderTabContent()}
      </ScrollView>
    </SafeAreaView>
  );
}

const createStyles = (colors: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    marginHorizontal: 20,
    marginVertical: 16,
    borderRadius: 12,
    padding: 4,
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  activeTabButton: {
    backgroundColor: colors.primary + '20',
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
});