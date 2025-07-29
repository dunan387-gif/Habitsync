import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView, TouchableOpacity } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useTheme } from '@/context/ThemeContext';
import { useLanguage } from '@/context/LanguageContext';
import { useGamification } from '@/context/GamificationContext';
import { Trophy, TrendingUp, Flame } from 'lucide-react-native';
import LevelProgress from '@/components/LevelProgress';
import Achievements from '@/components/Achievements';
import MoodCheckIn from '@/components/MoodCheckIn';
import StreakMilestones from '@/components/StreakMilestones';

type TabType = 'overview' | 'achievements' | 'milestones';

export default function GamificationScreen() {
  const { currentTheme } = useTheme();
  const { t } = useLanguage();
  const { gamificationData } = useGamification();
  const [activeTab, setActiveTab] = useState<TabType>('overview');

  const styles = createStyles(currentTheme.colors);

  const renderTabButton = (tab: TabType, icon: React.ReactNode, labelKey: string) => (
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
        <Text style={styles.title}>🎮 {t('gamification.title')}</Text>
        <Text style={styles.subtitle}>{t('gamification.subtitle')}</Text>
      </View>

      <View style={styles.tabContainer}>
        {renderTabButton(
          'overview',
          <TrendingUp size={20} color={activeTab === 'overview' ? currentTheme.colors.primary : currentTheme.colors.textMuted} />,
          'gamification.tabs.overview'
        )}
        {renderTabButton(
          'achievements',
          <Trophy size={20} color={activeTab === 'achievements' ? currentTheme.colors.primary : currentTheme.colors.textMuted} />,
          'gamification.tabs.achievements'
        )}
        {renderTabButton(
          'milestones',
          <Flame size={20} color={activeTab === 'milestones' ? currentTheme.colors.primary : currentTheme.colors.textMuted} />,
          'gamification.tabs.milestones'
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
    paddingTop: 40,
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
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 4,
    flexDirection: 'row',
    justifyContent: 'center',
    height: 44, // Even more compact
    marginHorizontal: 20,
    marginVertical: 8, // Reduced margin
  },
  tabButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    paddingHorizontal: 6,
    borderRadius: 8,
    minWidth: 40,
    marginHorizontal: 18, // Increased from 1 to 4 for better spacing
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