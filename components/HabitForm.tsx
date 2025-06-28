import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Modal, Switch, Platform, Alert } from 'react-native';
import { X, Clock, Smile } from 'lucide-react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Habit } from '@/types';
import EmojiPicker from './EmojiPicker';
import { useTheme } from '@/context/ThemeContext';
import { useLanguage } from '@/context/LanguageContext';

type HabitFormProps = {
  visible: boolean;
  onClose: () => void;
  onSave: (habit: Omit<Habit, 'id' | 'createdAt' | 'completedDates' | 'streak' | 'completedToday'>) => void;
  initialValues?: {
    id?: string;
    title: string;
    icon?: string;
    notes?: string;
    reminderTime?: string;
    reminderEnabled?: boolean;
    streak?: number;
    completedToday?: boolean;
    createdAt?: string;
    order?: number;
  };
  isEditing?: boolean;
};

export default function HabitForm({ visible, onClose, onSave, initialValues, isEditing = false }: HabitFormProps) {
  const { currentTheme } = useTheme();
  const { t } = useLanguage();
  const [title, setTitle] = useState('');
  const [icon, setIcon] = useState('');
  const [notes, setNotes] = useState('');
  const [reminderEnabled, setReminderEnabled] = useState(false);
  const [reminderTime, setReminderTime] = useState(new Date(new Date().setHours(9, 0, 0, 0)));
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  // Reset form when modal opens
  useEffect(() => {
    if (visible) {
      if (isEditing && initialValues) {
        // Populate form with existing values for editing
        setTitle(initialValues.title || '');
        setIcon(initialValues.icon || '');
        setNotes(initialValues.notes || '');
        setReminderEnabled(initialValues.reminderEnabled || false);
        setReminderTime(
          initialValues.reminderTime 
            ? new Date(`2000-01-01T${initialValues.reminderTime}:00`) 
            : new Date(new Date().setHours(9, 0, 0, 0))
        );
      } else {
        // Reset form for new habit creation
        setTitle('');
        setIcon('');
        setNotes('');
        setReminderEnabled(false);
        setReminderTime(new Date(new Date().setHours(9, 0, 0, 0)));
      }
    }
  }, [visible, isEditing, initialValues]);

  // Add this function before the handleSave function
  const formatTimeToHHMM = (date: Date): string => {
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  };
  
  // In the handleSave function, add order field
  const handleSave = () => {
    if (!title.trim()) {
      Alert.alert('Error', 'Please enter a habit title');
      return;
    }
  
    const habitData = {
      title: title.trim(),
      icon,
      notes: notes.trim(),
      reminderEnabled,
      reminderTime: formatTimeToHHMM(reminderTime), // ✅ Now this will work
      order: initialValues?.order || 0,
    };
  
    onSave(habitData);
  };

  const handleTimeChange = (event: any, selectedTime?: Date) => {
    setShowTimePicker(Platform.OS === 'ios');
    if (selectedTime) {
      setReminderTime(selectedTime);
    }
  };

  const formatTime = (date: Date): string => {
    let hours = date.getHours();
    const minutes = date.getMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    
    hours = hours % 12;
    hours = hours ? hours : 12; // the hour '0' should be '12'
    
    return `${hours}:${minutes.toString().padStart(2, '0')} ${ampm}`;
  };

  const styles = createStyles(currentTheme.colors);

  return (
    <>
      <Modal
        visible={visible}
        animationType="slide"
        transparent={true}
        onRequestClose={onClose}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.header}>
              <Text style={styles.headerTitle}>{isEditing ? t('edit_habit') : t('create_new_habit')}</Text>
              <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                <X size={24} color={currentTheme.colors.text} />
              </TouchableOpacity>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>{t('icon')}</Text>
              <TouchableOpacity 
                style={styles.iconSelector}
                onPress={() => setShowEmojiPicker(true)}
              >
                <View style={styles.iconDisplay}>
                  {icon ? (
                    <Text style={styles.selectedIcon}>{icon}</Text>
                  ) : (
                    <Smile size={24} color={currentTheme.colors.textMuted} />
                  )}
                </View>
                <Text style={styles.iconSelectorText}>
                  {icon ? t('change_icon') : t('choose_icon')}
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>{t('title')}</Text>
              <TextInput
                style={styles.input}
                value={title}
                onChangeText={setTitle}
                placeholder={t('enter_habit_title')}
                placeholderTextColor={currentTheme.colors.textMuted}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>{t('notes_optional')}</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={notes}
                onChangeText={setNotes}
                placeholder={t('add_notes_habit')}
                placeholderTextColor={currentTheme.colors.textMuted}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />
            </View>

            <View style={styles.formGroup}>
              <View style={styles.reminderHeader}>
                <Text style={styles.label}>{t('daily_reminder')}</Text>
                <Switch
                  value={reminderEnabled}
                  onValueChange={setReminderEnabled}
                  trackColor={{ false: currentTheme.colors.border, true: currentTheme.colors.primaryLight }}
                  thumbColor={reminderEnabled ? currentTheme.colors.primary : currentTheme.colors.textMuted}
                />
              </View>
              
              {reminderEnabled && (
                <TouchableOpacity 
                  style={styles.timeSelector}
                  onPress={() => setShowTimePicker(true)}
                >
                  <Clock size={20} color={currentTheme.colors.textSecondary} style={styles.timeIcon} />
                  <Text style={styles.timeText}>{formatTime(reminderTime)}</Text>
                </TouchableOpacity>
              )}
            </View>

            {showTimePicker && (
              <DateTimePicker
                value={reminderTime}
                mode="time"
                is24Hour={false}
                display="default"
                onChange={handleTimeChange}
              />
            )}

            <View style={styles.buttonContainer}>
              <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
                <Text style={styles.cancelButtonText}>{t('cancel')}</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.saveButton, !title.trim() && styles.saveButtonDisabled]} 
                onPress={handleSave}
                disabled={!title.trim()}
              >
                <Text style={styles.saveButtonText}>
                  {isEditing ? t('update_habit') : t('create_habit')}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <EmojiPicker
        visible={showEmojiPicker}
        onClose={() => setShowEmojiPicker(false)}
        onSelect={(selectedEmoji) => {
          console.log('EmojiPicker - Selected emoji:', selectedEmoji);
          setIcon(selectedEmoji);
          setShowEmojiPicker(false);
        }}
        selectedEmoji={icon}
      />
    </>
  );
}

const createStyles = (colors: any) => StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    minHeight: '60%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.text,
  },
  closeButton: {
    padding: 4,
  },
  formGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.textSecondary,
    marginBottom: 8,
  },
  input: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 12,
    fontSize: 16,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.border,
  },
  textArea: {
    height: 120,
  },
  reminderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  timeSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  iconSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  iconDisplay: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  selectedIcon: {
    fontSize: 24,
  },
  iconSelectorText: {
    fontSize: 16,
    color: colors.text,
    fontWeight: '500',
  },
  timeIcon: {
    marginRight: 8,
  },
  timeText: {
    fontSize: 16,
    color: colors.text,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  cancelButtonText: {
    color: colors.textSecondary,
    fontSize: 16,
    fontWeight: '600',
  },
  saveButton: {
    flex: 1,
    backgroundColor: colors.primary,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  saveButtonDisabled: {
    backgroundColor: colors.border,
    opacity: 0.6,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});