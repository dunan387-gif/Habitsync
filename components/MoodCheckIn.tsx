import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { useGamification } from '@/context/GamificationContext';
import { useTheme } from '@/context/ThemeContext';
import { useLanguage } from '@/context/LanguageContext';
import { useHabits } from '@/context/HabitContext';
import { Heart } from 'lucide-react-native';
import { MoodEntry } from '@/types';
import { useRouter } from 'expo-router';

type MoodState = 'happy' | 'sad' | 'anxious' | 'energetic' | 'tired' | 'stressed' | 'calm';

const MOOD_STATES: Array<{id: MoodState, emoji: string, color: string, labelKey: string}> = [
  { id: 'happy', emoji: '😊', color: '#10B981', labelKey: 'moodCheckIn.moodTags.happy' },
  { id: 'sad', emoji: '😢', color: '#6B7280', labelKey: 'moodCheckIn.moodTags.sad' },
  { id: 'anxious', emoji: '😰', color: '#F59E0B', labelKey: 'moodCheckIn.moodTags.anxious' },
  { id: 'energetic', emoji: '⚡', color: '#EF4444', labelKey: 'moodCheckIn.moodTags.energetic' },
  { id: 'tired', emoji: '😴', color: '#8B5CF6', labelKey: 'moodCheckIn.moodTags.tired' },
  { id: 'stressed', emoji: '😤', color: '#DC2626', labelKey: 'moodCheckIn.moodTags.stressed' },
  { id: 'calm', emoji: '😌', color: '#06B6D4', labelKey: 'moodCheckIn.moodTags.calm' }
];

interface MoodCheckInProps {
  onMoodSubmit?: () => void;
}

export default function MoodCheckIn({ onMoodSubmit }: MoodCheckInProps) {
  const router = useRouter();
  const { addMoodEntry, getTodaysMoodEntry, canCheckMoodToday } = useGamification();
  const { triggerSmartNotifications } = useHabits();
  const { currentTheme } = useTheme();
  const { t } = useLanguage();
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedMoodData, setSubmittedMoodData] = useState<any>(null);

  const canCheck = canCheckMoodToday();
  const styles = createStyles(currentTheme.colors);
  const todaysMood = getTodaysMoodEntry();

  // Update submittedMoodData when todaysMood changes (for detailed mood submissions)
  useEffect(() => {

    
    if (todaysMood && !submittedMoodData) {
      
      setSubmittedMoodData({
        moodState: todaysMood.moodState,
        intensity: todaysMood.intensity,
        triggers: todaysMood.triggers || [],
        note: todaysMood.note,
        timestamp: todaysMood.date
      });
    }
  }, [todaysMood, submittedMoodData]);

  const handleDetailedModePress = () => {
    try {
      router.navigate('/mood-tracking/detailed');
    } catch (error) {
      console.error('Navigation error:', error);
    }
  };

  const handleQuickMoodSelect = async (moodState: MoodState) => {
    if (!canCheck) return;
    

    setIsSubmitting(true);
    
    try {
      await addMoodEntry(moodState, 5, undefined, []);
      
      const moodData = {
        moodState,
        intensity: 5,
        triggers: [],
        note: undefined,
        timestamp: new Date().toISOString()
      };
      
      setSubmittedMoodData(moodData);

      
      // Trigger smart notifications in the background to avoid blocking the UI

      triggerSmartNotifications().catch(error => {
        console.error('Smart notifications error:', error);
      });
      

    } catch (error) {
      console.error('❌ Mood save error:', error);
      Alert.alert(t('common.error'), t('moodCheckIn.alerts.saveFailed'));
    } finally {
  
      setIsSubmitting(false);
    }

    onMoodSubmit?.();
  };

  const renderSubmittedMood = () => {
    // Use todaysMood if available, otherwise use submittedMoodData
    const moodDataToShow = todaysMood || submittedMoodData;

    if (!moodDataToShow) return null;

    const moodData = MOOD_STATES.find(m => m.id === moodDataToShow.moodState);

    return (
      <View style={styles.submittedMoodContainer}>
        <Text style={styles.submittedMoodTitle}>{t('moodCheckIn.quickMoodSelector.todaysMoodEntry')}</Text>
        <View style={styles.submittedMoodCard}>
          <View style={styles.submittedMoodHeader}>
            <Text style={styles.submittedMoodEmoji}>
              {moodData?.emoji}
            </Text>
            <View style={styles.submittedMoodInfo}>
              <Text style={styles.submittedMoodState}>
                {moodData ? t(moodData.labelKey) : ''}
              </Text>
              <Text style={styles.submittedMoodIntensity}>
                {t('moodCheckIn.quickMoodSelector.intensityLabel')}: {moodDataToShow.intensity}/10
              </Text>
              {moodDataToShow.note && (
                <Text style={styles.submittedMoodNote}>
                  {moodDataToShow.note}
                </Text>
              )}
              {moodDataToShow.triggers && moodDataToShow.triggers.length > 0 && (
                <Text style={styles.submittedMoodTriggers}>
                  {t('moodCheckIn.tagsTitle')}: {moodDataToShow.triggers.join(', ')}
                </Text>
              )}
            </View>
          </View>
        </View>
      </View>
    );
  };

  // Show completed state if mood already recorded today
  if (todaysMood) {
    const todayMoodData = MOOD_STATES.find(m => m.id === todaysMood.moodState);
    
    return (
      <View style={styles.container}>
        <View style={styles.completedContainer}>
          <Text style={styles.completedEmoji}>✅</Text>
          <Text style={styles.completedLabel}>{t('moodCheckIn.alerts.alreadyRecorded')}</Text>
          <Text style={styles.completedNote}>
            {todayMoodData?.emoji} {todayMoodData ? t(todayMoodData.labelKey) : todaysMood.moodState} ({t('moodCheckIn.quickMoodSelector.intensityLabel')}: {todaysMood.intensity}/10)
          </Text>
        </View>
        {renderSubmittedMood()}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Heart size={20} color={currentTheme.colors.primary} />
        <Text style={styles.title}>{t('moodCheckIn.question')}</Text>
        <Text style={styles.xpBadge}>{t('moodCheckIn.xpReward')}</Text>
      </View>

      <Text style={styles.question}>{t('moodCheckIn.quickMoodSelector.title')}</Text>

      {/* Mode Toggle */}
      <View style={styles.modeToggle}>
        <TouchableOpacity
          style={[styles.modeButton, styles.activeModeButton]}
        >
          <Text style={[styles.modeText, styles.activeModeText]}>{t('moodCheckIn.quickMoodSelector.quickMode')}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.modeButton}
          onPress={handleDetailedModePress}
        >
          <Text style={styles.modeText}>{t('moodCheckIn.quickMoodSelector.moreOptionsButton')}</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.moodGrid}>
        {MOOD_STATES.map((mood) => (
          <TouchableOpacity
            key={mood.id}
            style={styles.moodCard}
            onPress={() => handleQuickMoodSelect(mood.id)}
            disabled={isSubmitting}
          >
            <Text style={styles.moodCardEmoji}>{mood.emoji}</Text>
            <Text style={styles.moodCardLabel}>{t(mood.labelKey)}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {renderSubmittedMood()}
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
    flex: 1,
  },
  xpBadge: {
    backgroundColor: colors.accent + '20',
    color: colors.accent,
    fontSize: 12,
    fontWeight: '600',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  question: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 16,
    textAlign: 'center',
  },
  modeToggle: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: 8,
    padding: 4,
    marginBottom: 16,
  },
  modeButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    alignItems: 'center',
  },
  activeModeButton: {
    backgroundColor: colors.primary,
  },
  modeText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.textSecondary,
  },
  activeModeText: {
    color: colors.background,
  },
  moodGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  moodCard: {
    width: '30%',
    aspectRatio: 1,
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    padding: 8,
  },
  moodCardEmoji: {
    fontSize: 24,
    marginBottom: 4,
  },
  moodCardLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.text,
    textAlign: 'center',
  },
  completedContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  completedEmoji: {
    fontSize: 48,
    marginBottom: 8,
  },
  completedLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  completedNote: {
    fontSize: 14,
    color: colors.textSecondary,
    fontStyle: 'italic',
    textAlign: 'center',
    marginBottom: 12,
  },
  submittedMoodContainer: {
    marginTop: 20,
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
  },
  submittedMoodTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 12,
  },
  submittedMoodCard: {
    backgroundColor: colors.card,
    borderRadius: 8,
    padding: 12,
  },
  submittedMoodHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  submittedMoodEmoji: {
    fontSize: 24,
    marginRight: 12,
  },
  submittedMoodInfo: {
    flex: 1,
  },
  submittedMoodState: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  submittedMoodIntensity: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  submittedMoodNote: {
    fontSize: 14,
    color: colors.textSecondary,
    fontStyle: 'italic',
    marginTop: 4,
  },
  submittedMoodTriggers: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 4,
  },
});