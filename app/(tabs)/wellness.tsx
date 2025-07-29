import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity } from 'react-native';
import { useTheme } from '@/context/ThemeContext';
import { useLanguage } from '@/context/LanguageContext';
import { useHabits } from '@/context/HabitContext';
import { useGamification } from '@/context/GamificationContext';
import { useRouter } from 'expo-router';
import { Heart, BarChart3, Brain, Activity } from 'lucide-react-native';
import WellnessIntegrationDashboard from '@/components/WellnessIntegrationDashboard';
import EnhancedCoachingDashboard from '@/components/EnhancedCoachingDashboard';
import MoodHabitDashboard from '@/components/MoodHabitDashboard';
import MoodCheckIn from '@/components/MoodCheckIn';
import QuickMoodSelector from '@/components/QuickMoodSelector';
import { MoodEntry, HabitMoodEntry } from '@/types';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';

// New component to display today's mood details
const TodaysMoodDisplay = ({ moodEntry }: { moodEntry: MoodEntry }) => {
  const { currentTheme } = useTheme();
  const { t } = useLanguage();
  const styles = createMoodDisplayStyles(currentTheme.colors);
  
  const getMoodEmoji = (mood: string) => {
    const moodEmojis: { [key: string]: string } = {
      happy: '😊',
      sad: '😢',
      anxious: '😰',
      energetic: '⚡',
      tired: '😴',
      stressed: '😤',
      calm: '😌'
    };
    return moodEmojis[mood] || '😐';
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <View style={styles.moodDisplayContainer}>
      <View style={styles.moodHeader}>
        <Text style={styles.moodEmoji}>{getMoodEmoji(moodEntry.moodState)}</Text>
        <View style={styles.moodInfo}>
          <Text style={styles.moodState}>{moodEntry.moodState.charAt(0).toUpperCase() + moodEntry.moodState.slice(1)}</Text>
          <Text style={styles.moodTime}>{t('wellness.recordedAt')} {formatTime(moodEntry.timestamp)}</Text>
        </View>
      </View>
      
      <View style={styles.intensityContainer}>
        <Text style={styles.intensityLabel}>{t('quickMoodSelector.intensityLabel')}:</Text>
        <View style={styles.intensityBar}>
          <View style={[styles.intensityFill, { width: `${(moodEntry.intensity / 10) * 100}%` }]} />
        </View>
        <Text style={styles.intensityValue}>{moodEntry.intensity}/10</Text>
      </View>

      {moodEntry.triggers && moodEntry.triggers.length > 0 && (
        <View style={styles.triggersContainer}>
          <Text style={styles.triggersLabel}>{t('quickMoodSelector.triggersLabel')}</Text>
          <View style={styles.triggersRow}>
            {moodEntry.triggers.map((trigger, index) => (
              <View key={index} style={styles.triggerTag}>
                <Text style={styles.triggerText}>{trigger}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {moodEntry.note && (
        <View style={styles.noteContainer}>
          <Text style={styles.noteLabel}>{t('quickMoodSelector.noteLabel')}:</Text>
          <Text style={styles.noteText}>{moodEntry.note}</Text>
        </View>
      )}
    </View>
  );
};

// Enhanced component for mood check-in confirmation
const MoodCheckInConfirmation = ({ moodEntry, onAddDetails, onSkip }: { 
  moodEntry: MoodEntry;
  onAddDetails: () => void;
  onSkip: () => void;
}) => {
  const { currentTheme } = useTheme();
  const { t } = useLanguage();
  const styles = createMoodDisplayStyles(currentTheme.colors);
  
  const getMoodEmoji = (mood: string) => {
    const moodEmojis: { [key: string]: string } = {
      happy: '😊',
      sad: '😢',
      anxious: '😰',
      energetic: '⚡',
      tired: '😴',
      stressed: '😤',
      calm: '😌'
    };
    return moodEmojis[mood] || '😐';
  };

  return (
    <View style={styles.confirmationContainer}>
      <View style={styles.successHeader}>
        <View style={styles.checkmarkContainer}>
          <Text style={styles.checkmark}>✓</Text>
        </View>
        <Text style={styles.successTitle}>{t('dailyMoodReminder.successTitle')}</Text>
      </View>
      
      <View style={styles.moodSummary}>
        <Text style={styles.moodEmoji}>{getMoodEmoji(moodEntry.moodState)}</Text>
        <View style={styles.moodDetails}>
          <Text style={styles.moodLabel}>
            {t('wellness.feeling')} {moodEntry.moodState.charAt(0).toUpperCase() + moodEntry.moodState.slice(1)}
          </Text>
          <Text style={styles.intensityText}>
            {t('wellness.intensity')}: {moodEntry.intensity}/10
          </Text>
        </View>
      </View>

      <Text style={styles.encouragementText}>
        {t('dailyMoodReminder.successMessage')}
      </Text>
      
      <Text style={styles.promptText}>
        {t('wellness.addDetailsPrompt')}
      </Text>
      
      <View style={styles.actionButtons}>
        <TouchableOpacity style={styles.primaryButton} onPress={onAddDetails}>
          <Text style={styles.primaryButtonText}>{t('wellness.addDetails')}</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.secondaryButton} onPress={onSkip}>
          <Text style={styles.secondaryButtonText}>{t('quickMoodSelector.skipButton')}</Text>
        </TouchableOpacity>
      </View>
      
      <Text style={styles.benefitsText}>
        {t('wellness.trackingBenefits')}
      </Text>
    </View>
  );
};

// Enhanced detailed mood prompt with better messaging
const DetailedMoodPrompt = ({ moodEntry, onMoodUpdate }: { moodEntry: MoodEntry; onMoodUpdate?: () => void }) => {
  const { currentTheme } = useTheme();
  const { t } = useLanguage();
  const router = useRouter();
  const styles = createMoodDisplayStyles(currentTheme.colors);
  
  const handleNavigateToDetailed = () => {
    router.push('/mood/detailed-mood-tracking');
  };
  
  return (
    <MoodCheckInConfirmation 
      moodEntry={moodEntry}
      onAddDetails={handleNavigateToDetailed}
      onSkip={() => onMoodUpdate?.()}
    />
  );
};

type TabType = 'mood-checkin' | 'mood-analysis' | 'ai-coaching' | 'wellness-integration';

export default function WellnessScreen() {
  const { currentTheme } = useTheme();
  const { t } = useLanguage();
  const { habits } = useHabits();
  const { getTodaysMoodEntry, canCheckMoodToday, getMoodEntries, getHabitMoodEntries, gamificationData } = useGamification();
  const router = useRouter();
  const [habitMoodData, setHabitMoodData] = useState<HabitMoodEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);
  const [activeTab, setActiveTab] = useState<TabType>('mood-checkin');

  const styles = createStyles(currentTheme.colors);
  const todaysMood = getTodaysMoodEntry();
  const canCheckMood = canCheckMoodToday();

  // Use useMemo to stabilize moodData reference
  const moodData = useMemo(() => {
    return getMoodEntries() || [];
  }, [gamificationData?.moodEntries]);

  // Calculate mood tracking streak
  const calculateMoodStreak = useMemo(() => {
    if (!moodData || moodData.length === 0) return 0;
    
    // Sort mood entries by date (most recent first)
    const sortedEntries = [...moodData].sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );
    
    // Get unique dates (in case there are multiple entries per day)
    const uniqueDates = [...new Set(sortedEntries.map(entry => entry.date))];
    
    let streak = 0;
    const today = new Date();
    
    for (let i = 0; i < uniqueDates.length; i++) {
      const entryDate = new Date(uniqueDates[i]);
      const expectedDate = new Date(today);
      expectedDate.setDate(today.getDate() - i);
      
      // Normalize dates to compare only year, month, and day
      const entryDateStr = entryDate.toISOString().split('T')[0];
      const expectedDateStr = expectedDate.toISOString().split('T')[0];
      
      if (entryDateStr === expectedDateStr) {
        streak++;
      } else {
        break;
      }
    }
    
    return streak;
  }, [moodData]);

  // Format streak text
  // Replace hardcoded text in getStreakText function (around line 230)
  const getStreakText = (streak: number) => {
    if (streak === 0) return t('wellness.startStreak');
    if (streak === 1) return t('wellness.oneDayStreak');
    return t('wellness.multiDayStreak', { count: streak });
  };

  useEffect(() => {
    loadHabitMoodData();
  }, [refreshKey]);
  
  // Simplified useFocusEffect that doesn't cause infinite loops
  useFocusEffect(
    React.useCallback(() => {
      console.log('WellnessScreen focused - refreshing data');
      setRefreshKey(prev => prev + 1);
      return () => {};
    }, [])
  );

  const handleMoodUpdate = () => {
    setRefreshKey(prev => prev + 1);
  };

  // Renamed and simplified to only handle habit mood data
  const loadHabitMoodData = async () => {
    try {
      setLoading(true);
      
      const habitMoodEntries = getHabitMoodEntries();
      
      console.log('Loaded mood data in wellness screen:', moodData.length, 'entries');
      console.log('Loaded habit mood data:', habitMoodEntries.length, 'entries');
      
      setHabitMoodData(habitMoodEntries);
    } catch (error) {
      console.error('Error loading habit mood data:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderMoodSection = () => {
    if (todaysMood) {
      const hasDetailedEntry = todaysMood.note || (todaysMood.triggers && todaysMood.triggers.length > 0);
      
      if (hasDetailedEntry) {
        return (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t('wellness.todaysMoodJourney')}</Text>
            <View style={createMoodDisplayStyles(currentTheme.colors).completedMoodContainer}>
              <View style={createMoodDisplayStyles(currentTheme.colors).completedHeader}>
                <Text style={createMoodDisplayStyles(currentTheme.colors).completedEmoji}>🎊</Text>
                <Text style={createMoodDisplayStyles(currentTheme.colors).completedTitle}>{t('wellness.amazingWork')}</Text>
              </View>
              <Text style={createMoodDisplayStyles(currentTheme.colors).completedSubtitle}>
                {t('wellness.completedDetailedCheckin')}
              </Text>
              <TodaysMoodDisplay moodEntry={todaysMood} />
            </View>
          </View>
        );
      } else {
        return (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t('wellness.moodCheckinTitle')}</Text>
            <MoodCheckInConfirmation 
              moodEntry={todaysMood}
              onAddDetails={() => {
                router.push('/mood/detailed-mood-tracking');
              }}
              onSkip={() => {
                handleMoodUpdate();
              }}
            />
          </View>
        );
      }
    } else {
      return (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('wellness.howFeelingToday')}</Text>
          <View style={createMoodDisplayStyles(currentTheme.colors).emptyMoodContainer}>
            <Text style={createMoodDisplayStyles(currentTheme.colors).emptyMoodEmoji}>🌅</Text>
            <Text style={createMoodDisplayStyles(currentTheme.colors).emptyMoodTitle}>{t('wellness.letsCheckin')}</Text>
            <Text style={createMoodDisplayStyles(currentTheme.colors).emptyMoodText}>
              {t('wellness.reflectionPrompt')}
            </Text>
            <QuickMoodSelector onMoodUpdate={handleMoodUpdate} />
          </View>
        </View>
      );
    }
  };

  const renderTabButton = (tab: TabType, icon: React.ReactNode, label: string) => (
    <TouchableOpacity
      style={[styles.tabButton, activeTab === tab && styles.activeTabButton]}
      onPress={() => setActiveTab(tab)}
    >
      <View style={styles.tabButtonContent}>
        {icon}
        <Text style={[styles.tabButtonText, activeTab === tab && styles.activeTabButtonText]}>
          {label}
        </Text>
      </View>
    </TouchableOpacity>
  );

  // Replace hardcoded texts around line 370-420
  const renderTabContent = () => {
    switch (activeTab) {
      case 'mood-checkin':
        return renderMoodSection();
      case 'mood-analysis':
        return (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t('wellness.tabs.analysis')}</Text>
            <MoodHabitDashboard />
          </View>
        );
      case 'ai-coaching':
        return (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t('wellness.tabs.aiCoach')}</Text>
            <EnhancedCoachingDashboard 
              moodData={moodData}
              habitMoodData={habitMoodData}
            />
          </View>
        );
      case 'wellness-integration':
        return (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t('wellness.tabs.integration')}</Text>
            <WellnessIntegrationDashboard moodData={moodData} />
          </View>
        );
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>{t('wellness.loading')}</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Text style={styles.title}>{t('wellness.title')}</Text>
          <Text style={styles.subtitle}>{t('wellness.subtitle')}</Text>
          <View style={styles.streakContainer}>
            <Text style={styles.streakEmoji}>🔥</Text>
            <Text style={styles.streakText}>{getStreakText(calculateMoodStreak)}</Text>
          </View>
        </View>
      </View>

      <View style={styles.tabContainer}>
        {renderTabButton(
          'mood-checkin',
          <Heart size={16} color={activeTab === 'mood-checkin' ? currentTheme.colors.primary : currentTheme.colors.textMuted} />,
          t('wellness.tabs.checkin')
        )}
        {renderTabButton(
          'mood-analysis',
          <BarChart3 size={16} color={activeTab === 'mood-analysis' ? currentTheme.colors.primary : currentTheme.colors.textMuted} />,
          t('wellness.tabs.analysis')
        )}
        {renderTabButton(
          'ai-coaching',
          <Brain size={16} color={activeTab === 'ai-coaching' ? currentTheme.colors.primary : currentTheme.colors.textMuted} />,
          t('wellness.tabs.aiCoach')
        )}
        {renderTabButton(
          'wellness-integration',
          <Activity size={16} color={activeTab === 'wellness-integration' ? currentTheme.colors.primary : currentTheme.colors.textMuted} />,
          t('wellness.tabs.integration')
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
    paddingTop: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: colors.textSecondary,
  },
  header: {
    padding: 24,
    backgroundColor: 'transparent',
    borderBottomWidth: 0,
  },
  headerContent: {
    alignItems: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: colors.text,
    marginBottom: 6,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 17,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 12,
  },
  streakContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary + '15',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginTop: 8,
  },
  streakEmoji: {
    fontSize: 16,
    marginRight: 6,
  },
  streakText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
  },
  tabContainer: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 4,
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginHorizontal: 20,
    marginVertical: 8,
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 4,
    borderRadius: 8,
    marginHorizontal: 2,
  },
  activeTabButton: {
    backgroundColor: colors.primary + '20',
  },
  tabButtonContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabButtonText: {
    fontSize: 10,
    fontWeight: '500',
    color: colors.textMuted,
    marginTop: 2,
    textAlign: 'center',
  },
  activeTabButtonText: {
    color: colors.primary,
    fontWeight: '600',
  },
  section: {
    padding: 16,
    marginBottom: 8,
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    paddingBottom: 20,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 20,
    textAlign: 'left',
  },
  emptyMoodContainer: {
    backgroundColor: colors.card,
    borderRadius: 24,
    padding: 28,
    alignItems: 'center',
    borderWidth: 0,
    shadowColor: colors.shadow || '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 6,
    marginHorizontal: 8, // Reduce horizontal margin
    width: '96%', // Set explicit width to make it wider
    alignSelf: 'center',
  },
  emptyMoodTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 12,
    textAlign: 'center',
  },
  emptyMoodText: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 24,
    maxWidth: '85%',
  },
});

// Enhanced styles for mood display components
const createMoodDisplayStyles = (colors: any) => StyleSheet.create({
  moodDisplayContainer: {
    backgroundColor: colors.card,
    borderRadius: 20,
    padding: 24,
    marginVertical: 12,
    marginHorizontal: 8, // Reduce horizontal margin to increase width
    borderWidth: 0,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 8,
    width: '96%', // Set explicit width to make it wider
    alignSelf: 'center',
  },
  moodHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  moodEmoji: {
    fontSize: 48,
    marginRight: 16,
  },
  moodInfo: {
    flex: 1,
  },
  moodState: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.text,
    textTransform: 'capitalize',
    marginBottom: 4,
  },
  moodTime: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 2,
  },
  intensityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  intensityLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text,
    marginRight: 8,
    minWidth: 60,
  },
  intensityBar: {
    flex: 1,
    height: 12,
    backgroundColor: colors.border,
    borderRadius: 8,
    marginRight: 12,
    overflow: 'hidden',
  },
  intensityFill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 8,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  intensityValue: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text,
    minWidth: 30,
  },
  triggersContainer: {
    marginBottom: 16,
  },
  triggersLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text,
    marginBottom: 8,
  },
  triggersRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  triggerTag: {
    backgroundColor: colors.primary + '15',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: colors.primary + '30',
    marginRight: 8,
    marginBottom: 8,
  },
  triggerText: {
    fontSize: 13,
    color: colors.primary,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  noteContainer: {
    marginTop: 8,
  },
  noteLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text,
    marginBottom: 8,
  },
  noteText: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
    fontStyle: 'italic',
  },
  // Confirmation styles
  confirmationContainer: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 20,
    marginVertical: 8,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  successHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  checkmarkContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  checkmark: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  successTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
  moodSummary: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  moodDetails: {
    marginLeft: 12,
  },
  moodLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    textTransform: 'capitalize',
  },
  intensityText: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 2,
  },
  encouragementText: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.primary,
    textAlign: 'center',
    marginBottom: 12,
  },
  promptText: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 20,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
    marginBottom: 12,
  },
  primaryButton: {
    flex: 1,
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    flex: 1,
    backgroundColor: colors.background,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  secondaryButtonText: {
    color: colors.textSecondary,
    fontSize: 16,
    fontWeight: '500',
  },
  benefitsText: {
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  completedMoodContainer: {
    backgroundColor: colors.card,
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    borderWidth: 0,
    shadowColor: colors.success || colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
    marginHorizontal: 8, // Reduce horizontal margin
    width: '96%', // Set explicit width to make it wider
    alignSelf: 'center',
  },
  completedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  completedEmoji: {
    fontSize: 36,
    marginRight: 12,
  },
  completedTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
  },
  completedSubtitle: {
    fontSize: 15,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 22,
  },
  emptyMoodContainer: {
    backgroundColor: colors.card,
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    borderWidth: 0,
    shadowColor: colors.shadow || '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  emptyMoodEmoji: {
    fontSize: 40,
    marginBottom: 12,
  },
  emptyMoodTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 8,
  },
  emptyMoodText: {
    fontSize: 15,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 22,
    maxWidth: '90%',
  },
});