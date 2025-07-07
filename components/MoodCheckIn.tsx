import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Alert } from 'react-native';
import { useGamification } from '@/context/GamificationContext';
import { useTheme } from '@/context/ThemeContext';
import { Heart, MessageCircle } from 'lucide-react-native';

const MOOD_EMOJIS = ['😢', '😕', '😐', '😊', '😄'];
const MOOD_LABELS = ['Very Bad', 'Bad', 'Okay', 'Good', 'Excellent'];
const MOOD_TAGS = [
  ['stressed', 'tired', 'overwhelmed'],
  ['anxious', 'frustrated', 'low'],
  ['neutral', 'calm', 'stable'],
  ['happy', 'motivated', 'positive'],
  ['energetic', 'excited', 'amazing']
];

export default function MoodCheckIn() {
  const { addMoodEntry, getTodaysMoodEntry, canCheckMoodToday } = useGamification();
  const { currentTheme } = useTheme();
  const [selectedMood, setSelectedMood] = useState<number | null>(null);
  const [note, setNote] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const todaysMood = getTodaysMoodEntry();
  const canCheck = canCheckMoodToday();

  // Reset form when mood is already recorded
  useEffect(() => {
    if (!canCheck && todaysMood) {
      setSelectedMood(null);
      setNote('');
      setSelectedTags([]);
    }
  }, [canCheck, todaysMood]);

  const styles = createStyles(currentTheme.colors);

  const handleMoodSelect = (mood: number) => {
    setSelectedMood(mood);
    setSelectedTags([]); // Reset tags when mood changes
  };

  const toggleTag = (tag: string) => {
    setSelectedTags(prev => 
      prev.includes(tag) 
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
  };

  const handleSubmit = async () => {
    if (selectedMood === null) {
      Alert.alert('Please select a mood', 'Choose how you\'re feeling today');
      return;
    }

    setIsSubmitting(true);
    try {
      await addMoodEntry(selectedMood + 1, note || undefined, selectedTags.length > 0 ? selectedTags : undefined);
      setSelectedMood(null);
      setNote('');
      setSelectedTags([]);
      Alert.alert('Mood Recorded! 🎉', 'Thanks for checking in. You earned 5 XP!');
    } catch (error) {
      // Handle the specific error message
      const errorMessage = error instanceof Error ? error.message : 'Failed to record mood. Please try again.';
      if (errorMessage.includes('already recorded')) {
        Alert.alert('Already Recorded', 'You have already recorded your mood for today. Come back tomorrow!');
      } else {
        Alert.alert('Error', errorMessage);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!canCheck && todaysMood) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Heart size={20} color={currentTheme.colors.primary} />
          <Text style={styles.title}>Today's Mood</Text>
        </View>
        <View style={styles.completedContainer}>
          <Text style={styles.completedEmoji}>{MOOD_EMOJIS[todaysMood.mood - 1]}</Text>
          <Text style={styles.completedLabel}>{MOOD_LABELS[todaysMood.mood - 1]}</Text>
          {todaysMood.note && (
            <Text style={styles.completedNote}>"{todaysMood.note}"</Text>
          )}
          {todaysMood.tags && todaysMood.tags.length > 0 && (
            <View style={styles.tagsContainer}>
              {todaysMood.tags.map(tag => (
                <View key={tag} style={styles.tag}>
                  <Text style={styles.tagText}>{tag}</Text>
                </View>
              ))}
            </View>
          )}
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Heart size={20} color={currentTheme.colors.primary} />
        <Text style={styles.title}>Daily Mood Check-in</Text>
        <Text style={styles.xpBadge}>+5 XP</Text>
      </View>
      
      <Text style={styles.question}>How are you feeling today?</Text>
      
      <View style={styles.moodSelector}>
        {MOOD_EMOJIS.map((emoji, index) => (
          <TouchableOpacity
            key={index}
            style={[
              styles.moodButton,
              selectedMood === index && styles.selectedMoodButton
            ]}
            onPress={() => handleMoodSelect(index)}
          >
            <Text style={styles.moodEmoji}>{emoji}</Text>
            <Text style={styles.moodLabel}>{MOOD_LABELS[index]}</Text>
          </TouchableOpacity>
        ))}
      </View>
      
      {selectedMood !== null && (
        <>
          <View style={styles.tagsSection}>
            <Text style={styles.tagsTitle}>How would you describe it?</Text>
            <View style={styles.tagsContainer}>
              {MOOD_TAGS[selectedMood].map(tag => (
                <TouchableOpacity
                  key={tag}
                  style={[
                    styles.tag,
                    selectedTags.includes(tag) && styles.selectedTag
                  ]}
                  onPress={() => toggleTag(tag)}
                >
                  <Text style={[
                    styles.tagText,
                    selectedTags.includes(tag) && styles.selectedTagText
                  ]}>
                    {tag}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
          
          <View style={styles.noteSection}>
            <Text style={styles.noteTitle}>Add a note (optional)</Text>
            <TextInput
              style={styles.noteInput}
              placeholder="What's on your mind?"
              placeholderTextColor={currentTheme.colors.textMuted}
              value={note}
              onChangeText={setNote}
              multiline
              maxLength={200}
            />
          </View>
          
          <TouchableOpacity
            style={[styles.submitButton, isSubmitting && styles.disabledButton]}
            onPress={handleSubmit}
            disabled={isSubmitting}
          >
            <Text style={styles.submitButtonText}>
              {isSubmitting ? 'Recording...' : 'Record Mood'}
            </Text>
          </TouchableOpacity>
        </>
      )}
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
  moodSelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  moodButton: {
    alignItems: 'center',
    padding: 8,
    borderRadius: 8,
    flex: 1,
    marginHorizontal: 2,
  },
  selectedMoodButton: {
    backgroundColor: colors.primary + '20',
  },
  moodEmoji: {
    fontSize: 24,
    marginBottom: 4,
  },
  moodLabel: {
    fontSize: 10,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  tagsSection: {
    marginBottom: 16,
  },
  tagsTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text,
    marginBottom: 8,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tag: {
    backgroundColor: colors.surface,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  selectedTag: {
    backgroundColor: colors.primary + '20',
    borderColor: colors.primary,
  },
  tagText: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  selectedTagText: {
    color: colors.primary,
    fontWeight: '500',
  },
  noteSection: {
    marginBottom: 16,
  },
  noteTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text,
    marginBottom: 8,
  },
  noteInput: {
    backgroundColor: colors.surface,
    borderRadius: 8,
    padding: 12,
    color: colors.text,
    fontSize: 14,
    minHeight: 60,
    textAlignVertical: 'top',
  },
  submitButton: {
    backgroundColor: colors.primary,
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
  },
  disabledButton: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
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
});