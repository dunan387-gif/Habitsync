import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Alert, ScrollView } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useGamification } from '@/context/GamificationContext';
import { useTheme } from '@/context/ThemeContext';
import { useLanguage } from '@/context/LanguageContext';
import { Heart, ArrowLeft } from 'lucide-react-native';
import { MoodEntry } from '@/types';

type MoodState = 'happy' | 'sad' | 'anxious' | 'energetic' | 'tired' | 'stressed' | 'calm';
type TriggerType = 'work' | 'relationships' | 'health' | 'weather' | 'sleep' | 'exercise' | 'social';

const MOOD_STATES: Array<{id: MoodState, emoji: string, color: string, labelKey: string}> = [
  { id: 'happy', emoji: '😊', color: '#10B981', labelKey: 'moodCheckIn.moodLabels.happy' },
  { id: 'sad', emoji: '😢', color: '#6B7280', labelKey: 'moodCheckIn.moodLabels.sad' },
  { id: 'anxious', emoji: '😰', color: '#F59E0B', labelKey: 'moodCheckIn.moodLabels.anxious' },
  { id: 'energetic', emoji: '⚡', color: '#EF4444', labelKey: 'moodCheckIn.moodLabels.energetic' },
  { id: 'tired', emoji: '😴', color: '#8B5CF6', labelKey: 'moodCheckIn.moodLabels.tired' },
  { id: 'stressed', emoji: '😤', color: '#DC2626', labelKey: 'moodCheckIn.moodLabels.stressed' },
  { id: 'calm', emoji: '😌', color: '#06B6D4', labelKey: 'moodCheckIn.moodLabels.calm' }
];

const TRIGGER_TAGS: Array<{id: TriggerType, labelKey: string, icon: string}> = [
  { id: 'work', labelKey: 'moodCheckIn.contextTags.work', icon: '💼' },
  { id: 'relationships', labelKey: 'moodCheckIn.contextTags.relationships', icon: '❤️' },
  { id: 'health', labelKey: 'moodCheckIn.contextTags.health', icon: '🏥' },
  { id: 'weather', labelKey: 'moodCheckIn.contextTags.weather', icon: '🌤️' },
  { id: 'sleep', labelKey: 'moodCheckIn.contextTags.sleep', icon: '😴' },
  { id: 'exercise', labelKey: 'moodCheckIn.contextTags.exercise', icon: '🏃' },
  { id: 'social', labelKey: 'moodCheckIn.contextTags.social', icon: '👥' }
];

export default function DetailedMoodTrackingScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { currentTheme } = useTheme();
  const { t } = useLanguage();
  const { addXP, addMoodEntry } = useGamification();
  
  // State management
  const [selectedMood, setSelectedMood] = useState<MoodState | null>(null);
  const [intensity, setIntensity] = useState(5);
  const [selectedTriggers, setSelectedTriggers] = useState<TriggerType[]>([]);
  const [note, setNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentStep, setCurrentStep] = useState<'mood' | 'details'>('mood');

  const styles = createStyles(currentTheme.colors);

  const handleMoodSelect = (moodId: MoodState) => {
    console.log('Mood selected:', moodId);
    setSelectedMood(moodId);
    setCurrentStep('details');
    console.log('Step changed to details');
  };

  const handleBackToMoodSelection = () => {
    setCurrentStep('mood');
    setSelectedMood(null);
    setIntensity(5);
    setSelectedTriggers([]);
    setNote('');
  };

  const handleTriggerToggle = (triggerId: TriggerType) => {
    setSelectedTriggers(prev => 
      prev.includes(triggerId) 
        ? prev.filter(id => id !== triggerId)
        : [...prev, triggerId]
    );
  };

  const handleSubmit = async () => {
    if (!selectedMood) return;

    setIsSubmitting(true);
    try {
      await addMoodEntry(
        selectedMood,
        intensity,
        note.trim() || undefined,
        selectedTriggers.length > 0 ? selectedTriggers : undefined
      );
      
      await addXP(10, t('moodCheckIn.alerts.detailedTrackingComplete'));

      Alert.alert(
        t('moodCheckIn.alerts.moodRecorded'),
        t('moodCheckIn.alerts.detailedTrackingMessage').replace('{mood}', t(MOOD_STATES.find(m => m.id === selectedMood)?.labelKey || '')),
        [{ text: t('common.great'), onPress: () => router.back() }]
      );
    } catch (error) {
      Alert.alert(t('common.error'), t('moodCheckIn.alerts.saveFailed'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <ArrowLeft size={24} color={currentTheme.colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('moodCheckIn.title')}</Text>
        <View style={styles.xpBadge}>
          <Text style={styles.xpBadgeText}>{t('moodCheckIn.xpReward').replace('5', '10')}</Text>
        </View>
      </View>

      <ScrollView 
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 20 }}
      >
        {currentStep === 'mood' ? (
          /* Step 1: Mood Selection */
          <View style={styles.stepContainer}>
            <View style={styles.stepHeader}>
              <View style={styles.stepIndicator}>
                <Text style={styles.stepNumber}>1</Text>
              </View>
              <Text style={styles.stepTitle}>{t('moodCheckIn.question')}</Text>
            </View>
            
            <View style={styles.enhancedMoodGrid}>
              {MOOD_STATES.map((mood) => (
                <TouchableOpacity
                  key={mood.id}
                  style={[
                    styles.enhancedMoodCard,
                    { borderColor: mood.color + '40' }
                  ]}
                  onPress={() => {
                    console.log('TouchableOpacity pressed for:', mood.id);
                    handleMoodSelect(mood.id as MoodState);
                  }}
                  activeOpacity={0.7}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Text style={styles.enhancedMoodEmoji}>{mood.emoji}</Text>
                  <Text style={[
                    styles.enhancedMoodLabel,
                    { color: mood.color }
                  ]}>
                    {t(mood.labelKey)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ) : (
          /* Step 2: Detailed Options */
          <>
            {/* Selected Mood Header */}
            <View style={styles.selectedMoodHeader}>
              <TouchableOpacity 
                style={styles.backToMoodButton}
                onPress={handleBackToMoodSelection}
              >
                <Text style={styles.backButtonText}>{t('moodCheckIn.quickMoodSelector.backToQuickSelect')}</Text>
              </TouchableOpacity>
              <View style={styles.selectedMoodDisplay}>
                <Text style={styles.selectedMoodEmoji}>
                  {MOOD_STATES.find(m => m.id === selectedMood)?.emoji}
                </Text>
                <Text style={styles.selectedMoodLabel}>
                  {t(MOOD_STATES.find(m => m.id === selectedMood)?.labelKey || '')}
                </Text>
              </View>
            </View>

            {/* Step 2: Intensity */}
            <View style={styles.stepContainer}>
              <View style={styles.stepHeader}>
                <View style={styles.stepIndicator}>
                  <Text style={styles.stepNumber}>2</Text>
                </View>
                <Text style={styles.stepTitle}>{t('moodCheckIn.quickMoodSelector.intensityLabel')}</Text>
              </View>
              
              <View style={styles.intensitySection}>
                <View style={styles.intensityLabels}>
                  <Text style={styles.intensityLabel}>{t('moodCheckIn.quickMoodSelector.intensityLow')}</Text>
                  <Text style={styles.intensityLabel}>{t('moodCheckIn.quickMoodSelector.intensityHigh')}</Text>
                </View>
                
                <View style={styles.enhancedIntensityScale}>
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((level) => {
                    const selectedMoodData = MOOD_STATES.find(m => m.id === selectedMood);
                    const isSelected = intensity === level;
                    const isInRange = level <= intensity;
                    
                    return (
                      <TouchableOpacity
                        key={level}
                        style={[
                          styles.enhancedIntensityButton,
                          isSelected && {
                            backgroundColor: selectedMoodData?.color,
                            borderColor: selectedMoodData?.color,
                          },
                          isInRange && !isSelected && {
                            backgroundColor: selectedMoodData?.color + '30',
                            borderColor: selectedMoodData?.color + '60',
                          }
                        ]}
                        onPress={() => setIntensity(level)}
                      >
                        <Text style={[
                          styles.enhancedIntensityText,
                          isSelected && styles.selectedIntensityText
                        ]}>
                          {level}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            </View>

            {/* Step 3: Triggers */}
            <View style={styles.stepContainer}>
              <View style={styles.stepHeader}>
                <View style={styles.stepIndicator}>
                  <Text style={styles.stepNumber}>3</Text>
                </View>
                <Text style={styles.stepTitle}>{t('moodCheckIn.tagsTitle')}</Text>
              </View>
              
              <View style={styles.enhancedTriggersGrid}>
                {TRIGGER_TAGS.map((trigger) => {
                  const isSelected = selectedTriggers.includes(trigger.id);
                  return (
                    <TouchableOpacity
                      key={trigger.id}
                      style={[
                        styles.enhancedTriggerTag,
                        isSelected && styles.selectedEnhancedTriggerTag
                      ]}
                      onPress={() => handleTriggerToggle(trigger.id)}
                    >
                      <View style={[
                        styles.triggerIconContainer,
                        isSelected && styles.selectedTriggerIconContainer
                      ]}>
                        <Text style={styles.enhancedTriggerIcon}>{trigger.icon}</Text>
                      </View>
                      <Text style={[
                        styles.enhancedTriggerText,
                        isSelected && styles.selectedEnhancedTriggerText
                      ]}>
                        {t(trigger.labelKey)}
                      </Text>
                      {isSelected && (
                        <View style={styles.checkmark}>
                          <Text style={styles.checkmarkText}>✓</Text>
                        </View>
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Step 4: Notes */}
            <View style={styles.stepContainer}>
              <View style={styles.stepHeader}>
                <View style={styles.stepIndicator}>
                  <Text style={styles.stepNumber}>4</Text>
                </View>
                <Text style={styles.stepTitle}>{t('moodCheckIn.noteTitle')}</Text>
              </View>
              
              <View style={styles.enhancedNoteSection}>
                <TextInput
                  style={styles.enhancedNoteInput}
                  placeholder={t('moodCheckIn.notePlaceholder')}
                  placeholderTextColor={currentTheme.colors.textSecondary}
                  value={note}
                  onChangeText={setNote}
                  multiline
                  maxLength={200}
                />
                <Text style={styles.characterCounter}>
                  {note.length}/200 {t('common.characters')}
                </Text>
              </View>
            </View>

            {/* Submit Button */}
            <View style={styles.submitSection}>
              <TouchableOpacity
                style={[
                  styles.enhancedSubmitButton,
                  { backgroundColor: currentTheme.colors.primary },
                  isSubmitting && styles.disabledButton
                ]}
                onPress={handleSubmit}
                disabled={isSubmitting}
              >
                <View style={styles.submitButtonContent}>
                  <Text style={styles.enhancedSubmitButtonText}>
                    {isSubmitting ? t('moodCheckIn.recording') : t('moodCheckIn.recordMood')}
                  </Text>
                  <Text style={styles.submitButtonSubtext}>+10 XP</Text>
                </View>
              </TouchableOpacity>
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
}

const createStyles = (colors: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingTop: 50,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 16,
  },
  xpBadge: {
    backgroundColor: colors.primary + '20',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  xpBadgeText: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  stepContainer: {
    marginVertical: 20,
  },
  stepHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  stepIndicator: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  stepNumber: {
    color: colors.background,
    fontSize: 16,
    fontWeight: '600',
  },
  stepTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    flex: 1,
  },
  enhancedMoodGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
    gap: 12,
    paddingVertical: 8,
  },
  enhancedMoodCard: {
    width: '28%',
    aspectRatio: 1,
    backgroundColor: colors.card,
    borderRadius: 16,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 12,
    marginBottom: 8,
  },
  enhancedMoodEmoji: {
    fontSize: 32,
    marginBottom: 8,
  },
  enhancedMoodLabel: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  selectedMoodHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginVertical: 16,
    padding: 16,
    backgroundColor: colors.card,
    borderRadius: 12,
  },
  backToMoodButton: {
    padding: 8,
  },
  backButtonText: {
    color: colors.primary,
    fontSize: 16,
  },
  selectedMoodDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  selectedMoodEmoji: {
    fontSize: 24,
    marginRight: 8,
  },
  selectedMoodLabel: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
  intensitySection: {
    marginTop: 16,
  },
  intensityLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  intensityLabel: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  intensityValue: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.primary,
  },
  enhancedIntensityScale: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  enhancedIntensityButton: {
    flex: 1,
    aspectRatio: 1,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: colors.card,
    justifyContent: 'center',
    alignItems: 'center',
  },
  enhancedIntensityText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  selectedIntensityText: {
    color: colors.background,
  },
  enhancedTriggersGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 16,
  },
  enhancedTriggerTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 2,
    borderColor: colors.border,
    minWidth: '45%',
  },
  selectedEnhancedTriggerTag: {
    backgroundColor: colors.primary + '20',
    borderColor: colors.primary,
  },
  triggerIconContainer: {
    marginRight: 8,
  },
  selectedTriggerIconContainer: {
    // Add any selected state styling if needed
  },
  enhancedTriggerIcon: {
    fontSize: 16,
  },
  enhancedTriggerText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text,
    flex: 1,
  },
  selectedEnhancedTriggerText: {
    color: colors.primary,
    fontWeight: '600',
  },
  checkmark: {
    marginLeft: 8,
  },
  checkmarkText: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: '600',
  },
  enhancedNoteSection: {
    marginTop: 16,
  },
  enhancedNoteInput: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: colors.text,
    minHeight: 100,
    textAlignVertical: 'top',
    borderWidth: 1,
    borderColor: colors.border,
  },
  characterCounter: {
    textAlign: 'right',
    marginTop: 8,
    fontSize: 12,
    color: colors.textSecondary,
  },
  submitSection: {
    marginTop: 32,
    marginBottom: 20,
  },
  enhancedSubmitButton: {
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
  },
  disabledButton: {
    opacity: 0.6,
  },
  submitButtonContent: {
    alignItems: 'center',
  },
  enhancedSubmitButtonText: {
    color: colors.background,
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  submitButtonSubtext: {
    color: colors.background,
    fontSize: 14,
    opacity: 0.8,
  },
}); 