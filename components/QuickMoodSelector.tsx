import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, TextInput } from 'react-native';
import { Camera, Mic, Image, FileText } from 'lucide-react-native';
import { useTheme } from '@/context/ThemeContext';
import { useLanguage } from '@/context/LanguageContext';
import { useGamification } from '@/context/GamificationContext';
import Slider from '@react-native-community/slider';

// Add the MoodData interface definition
interface MoodData {
  moodState: string;
  intensity: number;
  emoji: string;
  color: string;
  contextTags: string[];
  note: string;
}

interface QuickMoodSelectorProps {
  onMoodSelect?: (mood: MoodData) => void;
  onMoodUpdate?: () => void;
  showIntensitySlider?: boolean;
  showContextTags?: boolean;
  showAttachments?: boolean;
  showVoiceOption?: boolean;
  allowSkip?: boolean;
  onSkip?: () => void;
}

// Define MOOD_OPTIONS constant
const MOOD_OPTIONS = [
  { state: 'happy', emoji: '😊', color: '#10B981', labelKey: 'moodCheckIn.moodTags.happy' },
  { state: 'calm', emoji: '😌', color: '#06B6D4', labelKey: 'moodCheckIn.moodTags.calm' },
  { state: 'energetic', emoji: '⚡', color: '#EF4444', labelKey: 'moodCheckIn.moodTags.energetic' },
  { state: 'excited', emoji: '🤩', color: '#F59E0B', labelKey: 'moodCheckIn.moodTags.excited' },
  { state: 'tired', emoji: '😴', color: '#8B5CF6', labelKey: 'moodCheckIn.moodTags.tired' },
  { state: 'stressed', emoji: '😤', color: '#DC2626', labelKey: 'moodCheckIn.moodTags.stressed' },
  { state: 'anxious', emoji: '😰', color: '#F59E0B', labelKey: 'moodCheckIn.moodTags.anxious' },
  { state: 'sad', emoji: '😢', color: '#6B7280', labelKey: 'moodCheckIn.moodTags.sad' },
  { state: 'frustrated', emoji: '😤', color: '#DC2626', labelKey: 'moodCheckIn.moodTags.frustrated' },
  { state: 'content', emoji: '😊', color: '#10B981', labelKey: 'moodCheckIn.moodTags.content' },
  { state: 'neutral', emoji: '😐', color: '#9CA3AF', labelKey: 'moodCheckIn.moodTags.neutral' },
  { state: 'overwhelmed', emoji: '😵', color: '#DC2626', labelKey: 'moodCheckIn.moodTags.overwhelmed' }
];

// Define CONTEXT_TAGS constant
const CONTEXT_TAGS = [
  { id: 'work', emoji: '💼', labelKey: 'moodCheckIn.contextTags.work' },
  { id: 'family', emoji: '👨‍👩‍👧‍👦', labelKey: 'moodCheckIn.contextTags.family' },
  { id: 'health', emoji: '🏥', labelKey: 'moodCheckIn.contextTags.health' },
  { id: 'social', emoji: '👥', labelKey: 'moodCheckIn.contextTags.social' },
  { id: 'finance', emoji: '💰', labelKey: 'moodCheckIn.contextTags.finance' },
  { id: 'exercise', emoji: '🏃‍♂️', labelKey: 'moodCheckIn.contextTags.exercise' },
  { id: 'sleep', emoji: '😴', labelKey: 'moodCheckIn.contextTags.sleep' },
  { id: 'weather', emoji: '🌤️', labelKey: 'moodCheckIn.contextTags.weather' },
  { id: 'relationships', emoji: '❤️', labelKey: 'moodCheckIn.contextTags.relationships' },
  { id: 'money', emoji: '💵', labelKey: 'moodCheckIn.contextTags.money' },
  { id: 'travel', emoji: '✈️', labelKey: 'moodCheckIn.contextTags.travel' },
  { id: 'food', emoji: '🍽️', labelKey: 'moodCheckIn.contextTags.food' },
  { id: 'entertainment', emoji: '🎬', labelKey: 'moodCheckIn.contextTags.entertainment' }
];

// Define filterValidTags function
const filterValidTags = (tags: string[]) => {
  const validTags = ['work', 'relationships', 'health', 'weather', 'sleep', 'exercise', 'social', 'family', 'finance', 'money', 'travel', 'food', 'entertainment'] as const;
  return tags.filter(tag => validTags.includes(tag as any)) as any[];
};

export default function QuickMoodSelector({ 
  onMoodSelect, 
  onMoodUpdate,
  showIntensitySlider = true,
  showContextTags = true, 
  showAttachments = false, 
  showVoiceOption = false,
  allowSkip = false,
  onSkip
}: QuickMoodSelectorProps) {
  const { currentTheme } = useTheme();
  const { t } = useLanguage();
  const { addMoodEntry } = useGamification();
  
  const [selectedMood, setSelectedMood] = useState<typeof MOOD_OPTIONS[0] | null>(null);
  const [intensity, setIntensity] = useState(5);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [note, setNote] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [showFullSelector, setShowFullSelector] = useState(false);
  const [submittedMood, setSubmittedMood] = useState<MoodData | null>(null);
  
  const styles = createStyles(currentTheme.colors);

  // Helper function to map mood states
  const mapToValidMoodState = (moodState: string): 'happy' | 'sad' | 'anxious' | 'energetic' | 'tired' | 'stressed' | 'calm' => {
    const moodMapping: { [key: string]: 'happy' | 'sad' | 'anxious' | 'energetic' | 'tired' | 'stressed' | 'calm' } = {
      'happy': 'happy',
      'calm': 'calm',
      'energetic': 'energetic',
      'excited': 'energetic',
      'content': 'happy',
      'neutral': 'calm',
      'tired': 'tired',
      'stressed': 'stressed',
      'anxious': 'anxious',
      'sad': 'sad',
      'frustrated': 'stressed',
      'overwhelmed': 'stressed'
    };
    
    return moodMapping[moodState] || 'calm';
  };

  const handleQuickMoodSelect = async (mood: typeof MOOD_OPTIONS[0]) => {
    const moodData: MoodData = {
      moodState: mood.state,
      intensity: 7,
      emoji: mood.emoji,
      color: mood.color,
      contextTags: [],
      note: ''
    };
    
    if (onMoodSelect) {
      onMoodSelect(moodData);
    } else {
      await addMoodEntry(mapToValidMoodState(mood.state), 7, undefined, undefined, true); // Skip automatic XP
      setSubmittedMood(moodData);
      Alert.alert(
        t('dailyMoodReminder.successTitle'), 
        `${mood.emoji} ${t(mood.labelKey)}\n${t('quickMoodSelector.intensityLabel')}: 7/10\n\n${t('quickMoodSelector.quickCheckinComplete')}`
      );
    }
    onMoodUpdate?.();
  };

  const handleDetailedSubmit = async () => {
    if (!selectedMood) return;
    
    const moodData: MoodData = {
      moodState: selectedMood.state,
      intensity,
      emoji: selectedMood.emoji,
      color: selectedMood.color,
      contextTags: selectedTags,
      note
    };
    
    if (onMoodSelect) {
      onMoodSelect(moodData);
    } else {
      await addMoodEntry(mapToValidMoodState(selectedMood.state), intensity, note || undefined, filterValidTags(selectedTags), true); // Skip automatic XP
      setSubmittedMood(moodData);
      
      let confirmationMessage = `${selectedMood.emoji} ${t(selectedMood.labelKey)}\n${t('quickMoodSelector.intensityLabel')}: ${intensity}/10`;
      
      if (selectedTags.length > 0) {
        const tagLabels = selectedTags.map(tagId => 
          CONTEXT_TAGS.find(tag => tag.id === tagId)?.labelKey ? t(CONTEXT_TAGS.find(tag => tag.id === tagId)!.labelKey) : ''
        ).filter(Boolean).join(', ');
        confirmationMessage += `\n${t('quickMoodSelector.triggersLabel')}: ${tagLabels}`;
      }
      
      if (note) {
        confirmationMessage += `\n${t('quickMoodSelector.noteLabel')}: \"${note}\"`;
      }
      
      confirmationMessage += `\n\n${t('quickMoodSelector.detailedCheckinComplete')}`;
      
      Alert.alert(t('dailyMoodReminder.successTitle'), confirmationMessage);
    }
    
    setSelectedMood(null);
    setIntensity(5);
    setSelectedTags([]);
    setNote('');
    setShowFullSelector(false);

    onMoodUpdate?.();
  };

  const toggleTag = (tagId: string) => {
    setSelectedTags(prev => 
      prev.includes(tagId) 
        ? prev.filter(id => id !== tagId)
        : [...prev, tagId]
    );
  };

  const renderSubmittedMood = () => {
    if (!submittedMood) return null;

    return (
      <View style={styles.submittedMoodContainer}>
        <Text style={styles.submittedMoodTitle}>{t('quickMoodSelector.todaysMoodEntry')}</Text>
        <View style={styles.submittedMoodCard}>
          <View style={styles.submittedMoodHeader}>
            <Text style={styles.submittedMoodEmoji}>{submittedMood.emoji}</Text>
            <View style={styles.submittedMoodInfo}>
              <Text style={styles.submittedMoodState}>{submittedMood.moodState.charAt(0).toUpperCase() + submittedMood.moodState.slice(1)}</Text>
              <Text style={styles.submittedMoodIntensity}>{t('quickMoodSelector.intensityLabel')}: {submittedMood.intensity}/10</Text>
            </View>
          </View>
          
          {submittedMood.contextTags && submittedMood.contextTags.length > 0 && (
            <View style={styles.submittedTagsContainer}>
              <Text style={styles.submittedTagsLabel}>{t('quickMoodSelector.triggersLabel')}</Text>
              <View style={styles.submittedTagsRow}>
                {submittedMood.contextTags.map((tagId: string, index: number) => {
                  const tag = CONTEXT_TAGS.find(t => t.id === tagId);
                  return (
                    <View key={index} style={styles.submittedTag}>
                      <Text style={styles.submittedTagText}>{tag?.labelKey ? t(tag.labelKey) : ''}</Text>
                    </View>
                  );
                })}
              </View>
            </View>
          )}
          
          {submittedMood.note && (
            <View style={styles.submittedNoteContainer}>
              <Text style={styles.submittedNoteLabel}>{t('quickMoodSelector.noteLabel')}:</Text>
              <Text style={styles.submittedNoteText}>{submittedMood.note}</Text>
            </View>
          )}
        </View>
      </View>
    );
  };

  const handleSkip = () => {
    if (onSkip) {
      onSkip();
    }
  };

  const handlePartialSubmit = async () => {
    if (!selectedMood) return;
    
    // Allow submission with minimal data
    const moodData: MoodData = {
      moodState: selectedMood.state,
      intensity: intensity || 5, // Default intensity if not set
      emoji: selectedMood.emoji,
      color: selectedMood.color,
      contextTags: selectedTags, // Can be empty
      note: note // Can be empty
    };
    
    if (onMoodSelect) {
      onMoodSelect(moodData);
    } else {
      await addMoodEntry(
        mapToValidMoodState(selectedMood.state), 
        intensity || 5, 
        note || undefined, 
        filterValidTags(selectedTags),
        true // Skip automatic XP
      );
      setSubmittedMood(moodData);
      
      Alert.alert(
        t('dailyMoodReminder.successTitle'), 
        `${selectedMood.emoji} ${t(selectedMood.labelKey)}\n${t('quickMoodSelector.intensityLabel')}: ${intensity || 5}/10\n\n${t('dailyMoodReminder.successMessage')}`
      );
    }
    
    // Reset form
    setSelectedMood(null);
    setIntensity(5);
    setSelectedTags([]);
    setNote('');
    setShowFullSelector(false);
    onMoodUpdate?.();
  };

  if (showFullSelector) {
    return (
      <ScrollView style={styles.container}>
        <Text style={styles.title}>{t('quickMoodSelector.title')}</Text>
        <Text style={styles.subtitle}>{t('quickMoodSelector.subtitle')}</Text>
        
        <View style={styles.moodGrid}>
          {MOOD_OPTIONS.map((mood, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.moodButton,
                { backgroundColor: mood.color + '20' },
                selectedMood?.state === mood.state && { 
                  backgroundColor: mood.color + '40', 
                  borderWidth: 3, 
                  borderColor: mood.color,
                  transform: [{ scale: 1.05 }]
                }
              ]}
              onPress={() => setSelectedMood(mood)}
            >
              <Text style={styles.moodEmoji}>{mood.emoji}</Text>
              <Text style={[styles.moodLabel, { color: mood.color }]}>{t(mood.labelKey)}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {selectedMood && (
          <>
            {showIntensitySlider && (
              <View style={styles.sliderContainer}>
                <Text style={styles.sliderLabel}>{t('quickMoodSelector.intensityLabel')}: {intensity}/10</Text>
                <Slider
                  style={styles.slider}
                  minimumValue={1}
                  maximumValue={10}
                  step={1}
                  value={intensity}
                  onValueChange={setIntensity}
                  minimumTrackTintColor={currentTheme.colors.primary}
                  maximumTrackTintColor={currentTheme.colors.border}
                  thumbTintColor={currentTheme.colors.primary}
                />
                <View style={styles.sliderLabels}>
                  <Text style={styles.sliderEndLabel}>{t('quickMoodSelector.lowLabel')}</Text>
                  <Text style={styles.sliderEndLabel}>{t('quickMoodSelector.highLabel')}</Text>
                </View>
              </View>
            )}
            
            {showContextTags && (
              <View style={styles.tagsContainer}>
                <Text style={styles.tagsTitle}>{t('quickMoodSelector.moodInfluenceTitle')} {t('quickMoodSelector.optionalLabel')}</Text>
                <View style={styles.tagsGrid}>
                  {CONTEXT_TAGS.map((tag) => (
                    <TouchableOpacity
                      key={tag.id}
                      style={[
                        styles.tagButton,
                        selectedTags.includes(tag.id) && styles.tagButtonSelected
                      ]}
                      onPress={() => toggleTag(tag.id)}
                    >
                      <Text style={styles.tagEmoji}>{tag.emoji}</Text>
                      <Text style={[
                        styles.tagLabel,
                        selectedTags.includes(tag.id) && styles.tagLabelSelected
                      ]}>
                        {t(tag.labelKey)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}
            
            <View style={styles.noteContainer}>
              <Text style={styles.noteLabel}>{t('quickMoodSelector.noteLabel')}</Text>
              <TextInput
                style={styles.noteInput}
                placeholder={t('quickMoodSelector.notePlaceholder')}
                placeholderTextColor={currentTheme.colors.textSecondary}
                value={note}
                onChangeText={setNote}
                multiline
                numberOfLines={3}
              />
            </View>
            
            <TouchableOpacity
              style={[styles.submitButton, { backgroundColor: selectedMood.color }]}
              onPress={handlePartialSubmit}
            >
              <Text style={styles.submitButtonText}>{t('quickMoodSelector.recordMoodButton')}</Text>
            </TouchableOpacity>
          </>
        )}
        
        <View style={styles.actionButtonsContainer}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => setShowFullSelector(false)}
          >
            <Text style={styles.backButtonText}>{t('quickMoodSelector.backButton')}</Text>
          </TouchableOpacity>
          
          {allowSkip && (
            <TouchableOpacity
              style={styles.skipButton}
              onPress={handleSkip}
            >
              <Text style={styles.skipButtonText}>{t('quickMoodSelector.skipButton')}</Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
    );
  }

  // Update the quick selector view to include skip option
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{t('quickMoodSelector.title')}</Text>
      <Text style={styles.subtitle}>{t('quickMoodSelector.subtitle')}</Text>
      
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.quickMoodContainer}>
        {MOOD_OPTIONS.slice(0, 6).map((mood, index) => (
          <TouchableOpacity
            key={index}
            style={[styles.quickMoodButton, { backgroundColor: mood.color + '20' }]}
            onPress={() => handleQuickMoodSelect(mood)}
          >
            <Text style={styles.quickMoodEmoji}>{mood.emoji}</Text>
            <Text style={[styles.quickMoodLabel, { color: mood.color }]}>{t(mood.labelKey)}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <View style={styles.actionButtonsContainer}>
        <TouchableOpacity
          style={styles.detailedButton}
          onPress={() => setShowFullSelector(true)}
        >
          <Text style={styles.detailedButtonText}>{t('quickMoodSelector.moreOptionsButton')}</Text>
        </TouchableOpacity>
        
        {allowSkip && (
          <TouchableOpacity
            style={styles.skipButton}
            onPress={handleSkip}
          >
            <Text style={styles.skipButtonText}>{t('quickMoodSelector.skipButton')}</Text>
          </TouchableOpacity>
        )}
      </View>

      {renderSubmittedMood()}
    </View>
  );
}

const createStyles = (colors: any) => StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: colors.background,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 6,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 16,
    textAlign: 'center',
  },
  quickMoodContainer: {
    marginBottom: 16,
    maxHeight: 80,
  },
  quickMoodButton: {
    alignItems: 'center',
    padding: 16,
    marginRight: 12,
    borderRadius: 20,
    minWidth: 80,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  quickMoodEmoji: {
    fontSize: 28,
    marginBottom: 6,
  },
  quickMoodLabel: {
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'center',
  },
  detailedButton: {
    backgroundColor: colors.primary,
    padding: 18,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  detailedButtonText: {
    color: colors.background,
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  actionButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 16,
  },
  skipButton: {
    padding: 12,
    borderRadius: 8,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  skipButtonText: {
    color: colors.textSecondary,
    fontSize: 14,
    fontWeight: '600',
  },
  moodGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 24,
    paddingHorizontal: 8,
    gap: 12,
  },
  moodButton: {
    width: '30%',
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 28,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
    borderWidth: 2,
    borderColor: 'transparent',
    backgroundColor: colors.card,
  },
  moodEmoji: {
    fontSize: 42,
    marginBottom: 10,
    textShadowColor: 'rgba(0, 0, 0, 0.15)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  moodLabel: {
    fontSize: 13,
    fontWeight: '800',
    textAlign: 'center',
    letterSpacing: 0.5,
    textTransform: 'capitalize',
  },
  sliderContainer: {
    marginBottom: 20,
  },
  sliderLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 10,
    textAlign: 'center',
  },
  slider: {
    width: '100%',
    height: 40,
  },
  sliderLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
  },
  sliderEndLabel: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  tagsContainer: {
    marginBottom: 20,
  },
  tagsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 10,
  },
  tagsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  tagButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    marginBottom: 8,
  },
  tagButtonSelected: {
    backgroundColor: colors.primary + '20',
    borderColor: colors.primary,
    borderWidth: 1,
  },
  tagEmoji: {
    fontSize: 16,
    marginRight: 5,
  },
  tagLabel: {
    fontSize: 14,
    color: colors.text,
  },
  tagLabelSelected: {
    color: colors.primary,
    fontWeight: '600',
  },
  noteContainer: {
    marginBottom: 20,
  },
  noteLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 10,
  },
  noteInput: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    color: colors.text,
    fontSize: 16,
    textAlignVertical: 'top',
    minHeight: 100,
    borderWidth: 1,
    borderColor: colors.border,
  },
  submitButton: {
    padding: 18,
    borderRadius: 16,
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  submitButtonText: {
    color: colors.background,
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  backButton: {
    alignItems: 'center',
    padding: 12,
  },
  backButtonText: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: '600',
  },
  submittedMoodContainer: {
    marginTop: 20,
    padding: 15,
    backgroundColor: colors.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  submittedMoodTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 10,
  },
  submittedMoodCard: {
    backgroundColor: colors.background,
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
    marginRight: 10,
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
  submittedTagsContainer: {
    marginTop: 8,
  },
  submittedTagsLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text,
    marginBottom: 4,
  },
  submittedTagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  submittedTag: {
    backgroundColor: colors.primary + '20',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginRight: 6,
    marginBottom: 4,
  },
  submittedTagText: {
    fontSize: 12,
    color: colors.primary,
    fontWeight: '500',
  },
  submittedNoteContainer: {
    marginTop: 8,
  },
  submittedNoteLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text,
    marginBottom: 4,
  },
  submittedNoteText: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 18,
  },
});