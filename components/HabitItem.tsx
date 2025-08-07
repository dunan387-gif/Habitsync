import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated, Pressable, Modal, Alert } from 'react-native';
import { Check, ChevronRight, Square, CheckSquare } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useHabits } from '@/context/HabitContext';
import { useTheme } from '@/context/ThemeContext';
import { Habit } from '@/types';
import { useLanguage } from '@/context/LanguageContext';

type HabitItemProps = {
  habit: Habit;
  onLongPress?: () => void;
  isActive?: boolean;
  isMultiSelectMode?: boolean;
  isSelected?: boolean;
  onToggleSelection?: () => void;
};

// Add mood selection modal
const MoodSelectionModal = ({ visible, onClose, onSelect }: {
  visible: boolean;
  onClose: () => void;
  onSelect: (mood: { moodState: string; intensity: number }) => void;
}) => {
  const [selectedMood, setSelectedMood] = useState<string>('');
  const [intensity, setIntensity] = useState<number>(5);
  const { currentTheme } = useTheme();
  const { t } = useLanguage();
  
  const moods = [
    { state: 'happy', emoji: '😊', label: t('moodCheckIn.moodTags.happy') },
    { state: 'calm', emoji: '😌', label: t('moodCheckIn.moodTags.calm') },
    { state: 'energetic', emoji: '⚡', label: t('moodCheckIn.moodTags.energetic') },
    { state: 'tired', emoji: '😴', label: t('moodCheckIn.moodTags.tired') },
    { state: 'stressed', emoji: '😰', label: t('moodCheckIn.moodTags.stressed') },
    { state: 'anxious', emoji: '😟', label: t('moodCheckIn.moodTags.anxious') },
    { state: 'sad', emoji: '😢', label: t('moodCheckIn.moodTags.sad') },
  ];
  
  const handleSubmit = () => {
    if (!selectedMood) {
      Alert.alert(t('moodCheckIn.selectMood'), t('moodCheckIn.selectMoodMessage'));
      return;
    }
    
    onSelect({ moodState: selectedMood, intensity });
    onClose();
    setSelectedMood('');
    setIntensity(5);
  };
  
  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={modalStyles.modalOverlay}>
        <View style={[modalStyles.modalContent, { backgroundColor: currentTheme.colors.surface }]}>
          <Text style={[modalStyles.modalTitle, { color: currentTheme.colors.text }]}>
            {t('moodCheckIn.howAreYouFeeling')}
          </Text>
          
          <View style={modalStyles.moodGrid}>
            {moods.map((mood) => (
              <TouchableOpacity
                key={mood.state}
                style={[
                  modalStyles.moodOption,
                  selectedMood === mood.state && { backgroundColor: currentTheme.colors.primary }
                ]}
                onPress={() => setSelectedMood(mood.state)}
              >
                <Text style={modalStyles.moodEmoji}>{mood.emoji}</Text>
                <Text style={[
                  modalStyles.moodLabel,
                  { color: selectedMood === mood.state ? currentTheme.colors.background : currentTheme.colors.text }
                ]}>
                  {mood.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          
          <View style={modalStyles.intensitySection}>
            <Text style={[modalStyles.intensityLabel, { color: currentTheme.colors.text }]}>
              {t('moodCheckIn.intensity')}: {intensity}/10
            </Text>
            <View style={modalStyles.intensitySlider}>
              {Array.from({ length: 10 }, (_, i) => i + 1).map((value) => (
                <TouchableOpacity
                  key={value}
                  style={[
                    modalStyles.intensityDot,
                    {
                      backgroundColor: value <= intensity ? currentTheme.colors.primary : currentTheme.colors.border
                    }
                  ]}
                  onPress={() => setIntensity(value)}
                />
              ))}
            </View>
          </View>
          
          <View style={modalStyles.modalButtons}>
            <TouchableOpacity
              style={[modalStyles.modalButton, { backgroundColor: currentTheme.colors.border }]}
              onPress={onClose}
            >
              <Text style={[modalStyles.modalButtonText, { color: currentTheme.colors.text }]}>{t('cancel')}</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[modalStyles.modalButton, { backgroundColor: currentTheme.colors.primary }]}
              onPress={handleSubmit}
            >
              <Text style={[modalStyles.modalButtonText, { color: currentTheme.colors.background }]}>{t('moodCheckIn.submit')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default function HabitItem({ 
  habit, 
  onLongPress, 
  isActive, 
  isMultiSelectMode, 
  isSelected, 
  onToggleSelection 
}: HabitItemProps) {
  const router = useRouter();
  const { toggleHabitCompletion } = useHabits();
  const { currentTheme } = useTheme();
  const [showMoodModal, setShowMoodModal] = useState(false);
  
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const checkOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (habit.completedToday) {
      Animated.sequence([
        Animated.timing(scaleAnim, {
          toValue: 1.1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();

      Animated.timing(checkOpacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } else {
      checkOpacity.setValue(0);
    }
  }, [habit.completedToday]);

  const handleToggle = () => {
    if (!isMultiSelectMode) {
      if (!habit.completedToday) {
        // ✅ Use smart default, no modal needed
        const defaultMood = { moodState: 'neutral', intensity: 5 };
        toggleHabitCompletion(habit.id, defaultMood);
      } else {
        toggleHabitCompletion(habit.id);
      }
    }
  };

  const handleMoodSelection = (mood: { moodState: string; intensity: number }) => {
    toggleHabitCompletion(habit.id, mood);
    setShowMoodModal(false);
  };

  const handlePress = () => {
    if (isMultiSelectMode) {
      onToggleSelection?.();
    } else {
      router.push(`/habit/${habit.id}`);
    }
  };

  const componentStyles = createStyles(currentTheme.colors);

  return (
    <>
      <Pressable
        style={({ pressed }) => [
          componentStyles.container,
          isActive && componentStyles.activeContainer,
          isSelected && componentStyles.selectedContainer,
          pressed && { opacity: 0.8 }
        ]}
        onPress={handlePress}
        onLongPress={onLongPress}
        delayLongPress={500}
      >
        {/* Selection checkbox for multi-select mode */}
        {isMultiSelectMode && (
          <TouchableOpacity
            style={componentStyles.selectionContainer}
            onPress={onToggleSelection}
            activeOpacity={0.7}
          >
            {isSelected ? (
              <CheckSquare size={24} color={currentTheme.colors.primary} />
            ) : (
              <Square size={24} color={currentTheme.colors.textMuted} />
            )}
          </TouchableOpacity>
        )}
        
        {/* Completion checkbox */}
        {!isMultiSelectMode && (
          <TouchableOpacity
            style={componentStyles.checkboxContainer}
            onPress={handleToggle}
            activeOpacity={0.7}
          >
            <Animated.View 
              style={[
                componentStyles.checkbox,
                habit.completedToday && componentStyles.checkboxCompleted,
                { transform: [{ scale: scaleAnim }] }
              ]}
            >
              <Animated.View style={{ opacity: checkOpacity }}>
                <Check size={18} color="#FFFFFF" />
              </Animated.View>
            </Animated.View>
          </TouchableOpacity>
        )}
        
        <View style={componentStyles.content}>
          <View style={componentStyles.habitInfo}>
            <View style={componentStyles.titleRow}>
              {habit.icon && (
                <View style={componentStyles.iconContainer}>
                  <Text style={componentStyles.habitIcon}>{habit.icon}</Text>
                </View>
              )}
              <Text 
                style={[
                  componentStyles.title,
                  !habit.icon && componentStyles.titleNoIcon,
                  habit.completedToday && componentStyles.titleCompleted
                ]}
              >
                {habit.title}
              </Text>
            </View>
            
            <View style={componentStyles.streakContainer}>
              <View style={componentStyles.streakBadge}>
                <Text style={componentStyles.streakText}>
                  {habit.streak} day{habit.streak !== 1 ? 's' : ''}
                </Text>
              </View>
            </View>
          </View>
          
          {!isMultiSelectMode && (
            <ChevronRight size={20} color={currentTheme.colors.textMuted} />
          )}
        </View>
      </Pressable>
      
      <MoodSelectionModal
        visible={showMoodModal}
        onClose={() => setShowMoodModal(false)}
        onSelect={handleMoodSelection}
      />
    </>
  );
}

const createStyles = (colors: any) => StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: 12,
    marginBottom: 8,
    marginHorizontal: 4,
    padding: 4,
    // Remove shadow properties
    borderWidth: 1,
    borderColor: colors.border || colors.surface,
  },
  selectedContainer: {
    borderWidth: 2,
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight || colors.surface,
  },
  selectionContainer: {
    padding: 12,
  },
  checkboxContainer: {
    padding: 12,
  },
  checkbox: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.card,
  },
  checkboxCompleted: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  content: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14, // Reduced from 16 to 14
    paddingRight: 12, // Reduced from 16 to 12
  },
  habitInfo: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  habitIcon: {
    fontSize: 22,
    textAlign: 'center',
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    flex: 1,
  },
  titleNoIcon: {
    marginLeft: 0,
  },
  titleCompleted: {
    textDecorationLine: 'line-through',
    color: colors.textMuted,
  },
  streakContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  streakBadge: {
    backgroundColor: colors.surface,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  streakText: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  dragging: {
    opacity: 0.9, // Improved opacity for better visibility
    transform: [{ scale: 1.05 }], // Slightly larger scale
    backgroundColor: colors.primaryLight || colors.surface,
    borderWidth: 2,
    borderColor: colors.primary,
    // Remove shadow properties
  },
  activeContainer: {
    transform: [{ scale: 1.08 }], // More pronounced scale
    backgroundColor: colors.primaryLight || colors.surface,
    borderWidth: 2,
    borderColor: colors.primary,
    // Remove shadow properties
    zIndex: 1000,
  },
});

// Modal styles with different variable name to avoid conflicts
const modalStyles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '90%',
    maxWidth: 400,
    borderRadius: 16,
    padding: 24,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
  },
  moodGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  moodOption: {
    width: '30%',
    aspectRatio: 1,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  moodEmoji: {
    fontSize: 24,
    marginBottom: 4,
  },
  moodLabel: {
    fontSize: 12,
    fontWeight: '500',
  },
  intensitySection: {
    marginBottom: 24,
  },
  intensityLabel: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 12,
  },
  intensitySlider: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
  },
  intensityDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 8,
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});