import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Modal, Switch, Platform, Alert, ScrollView } from 'react-native';
import { X, Clock, Smile, Calendar, Crown } from 'lucide-react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Habit, HabitReminder } from '@/types';
import EmojiPicker from './EmojiPicker';
import MultipleReminders from './MultipleReminders';
import { useTheme } from '@/context/ThemeContext';
import { useLanguage } from '@/context/LanguageContext';
import { useSubscription } from '@/context/SubscriptionContext';

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
    reminderDays?: number[];
    reminders?: HabitReminder[];
    streak?: number;
    completedToday?: boolean;
    createdAt?: string;
    order?: number;
  };
  isEditing?: boolean;
};

export default function HabitForm({ visible, onClose, onSave, initialValues, isEditing = false }: HabitFormProps) {
  const { currentTheme } = useTheme();
  const { t, currentLanguage } = useLanguage();
  const { canUseReminders, showUpgradePrompt, currentTier } = useSubscription();
  

  

  

  const [title, setTitle] = useState('');
  const [icon, setIcon] = useState('');
  const [notes, setNotes] = useState('');
  const [reminderEnabled, setReminderEnabled] = useState(false);
  const [reminderTime, setReminderTime] = useState(new Date(new Date().setHours(9, 0, 0, 0)));
  const [reminderDays, setReminderDays] = useState<number[]>([]);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  
  // Multiple reminders state
  const [reminders, setReminders] = useState<HabitReminder[]>([]);
  const [useMultipleReminders, setUseMultipleReminders] = useState(false);

  // Days of the week array
  const daysOfWeek = [
    { id: 0, name: t('sunday'), short: t('sun') },
    { id: 1, name: t('monday'), short: t('mon') },
    { id: 2, name: t('tuesday'), short: t('tue') },
    { id: 3, name: t('wednesday'), short: t('wed') },
    { id: 4, name: t('thursday'), short: t('thu') },
    { id: 5, name: t('friday'), short: t('fri') },
    { id: 6, name: t('saturday'), short: t('sat') },
  ];

  // Reset form when modal opens
  useEffect(() => {
    if (visible) {
      if (isEditing && initialValues) {
        // Populate form with existing values for editing
        setTitle(initialValues.title || '');
        setIcon(initialValues.icon || '');
        setNotes(initialValues.notes || '');
        setReminderEnabled(initialValues.reminderEnabled || false);
        setReminderDays(initialValues.reminderDays || []);
        setReminderTime(
          initialValues.reminderTime 
            ? new Date(`2000-01-01T${initialValues.reminderTime}:00`) 
            : new Date(new Date().setHours(9, 0, 0, 0))
        );
        
        // Handle multiple reminders
        if (initialValues.reminders && initialValues.reminders.length > 0) {
          setReminders(initialValues.reminders);
          setUseMultipleReminders(true);
        } else {
          setReminders([]);
          setUseMultipleReminders(false);
        }
      } else {
        // Reset form for new habit creation
        setTitle('');
        setIcon('');
        setNotes('');
        setReminderEnabled(false);
        setReminderDays([]);
        setReminderTime(new Date(new Date().setHours(9, 0, 0, 0)));
        setReminders([]);
        setUseMultipleReminders(false);
      }
    }
  }, [visible, isEditing, initialValues]);

  const formatTimeToHHMM = (date: Date): string => {
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  };
  
  const handleSave = () => {
    if (!title.trim()) {
      Alert.alert(t('error_general'), t('please_enter_habit_title'));
      return;
    }

    // Validate reminders
    if (useMultipleReminders && reminders.length === 0) {
      Alert.alert(t('error_general'), t('please_add_at_least_one_reminder'));
      return;
    }

    if (reminderEnabled && !useMultipleReminders && reminderDays.length === 0) {
      Alert.alert(t('error_general'), t('please_select_reminder_days'));
      return;
    }
  
    const habitData = {
      title: title.trim(),
      icon,
      notes: notes.trim(),
      reminderEnabled: useMultipleReminders ? reminders.some(r => r.enabled) : reminderEnabled,
      reminderTime: useMultipleReminders ? '' : formatTimeToHHMM(reminderTime),
      reminderDays: useMultipleReminders ? [] : (reminderEnabled ? reminderDays : []),
      reminders: useMultipleReminders ? reminders : [],
      order: initialValues?.order || 0,
    };
  
    onSave(habitData);
  };

  const toggleReminderDay = (dayId: number) => {
    if (reminderDays.includes(dayId)) {
      setReminderDays(reminderDays.filter(id => id !== dayId));
    } else {
      setReminderDays([...reminderDays, dayId]);
    }
  };

  const selectAllDays = () => {
    setReminderDays([0, 1, 2, 3, 4, 5, 6]);
  };

  const selectWeekdays = () => {
    setReminderDays([1, 2, 3, 4, 5]);
  };

  const selectWeekends = () => {
    setReminderDays([0, 6]);
  };

  const handleReminderToggle = (value: boolean) => {
    // Check if user can use reminders
    if (value && !canUseReminders(reminderDays.length)) {
      showUpgradePrompt('reminder_limit');
      return;
    }
    setReminderEnabled(value);
  };

  const handleTimeChange = (event: any, selectedTime?: Date) => {
    if (Platform.OS === 'android') {
      setShowTimePicker(false);
    }
    if (selectedTime) {
      setReminderTime(selectedTime);
    }
  };

  const formatTime = (date: Date): string => {
    let hours = date.getHours();
    const minutes = date.getMinutes();
    
    if (currentLanguage.code === 'zh') {
      // Chinese format: 24-hour format
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
    } else {
      // English format: 12-hour format with AM/PM
      const ampm = hours >= 12 ? 'PM' : 'AM';
      hours = hours % 12;
      hours = hours ? hours : 12;
      return `${hours}:${minutes.toString().padStart(2, '0')} ${ampm}`;
    }
  };

  const styles = createStyles(currentTheme.colors);

  return (
    <>
                    <Modal
          visible={visible}
          animationType="slide"
          transparent={true}
          onRequestClose={onClose}
          statusBarTranslucent={true}
        >
         <View style={styles.modalContainer}>
           <View style={[styles.modalContent, { backgroundColor: '#FFFFFF' }]}>
            <View style={styles.header}>
              <Text style={[styles.headerTitle, { color: currentTheme.colors.text || '#1E293B' }]}>
                {isEditing ? t('edit_habit') : t('create_new_habit')}
              </Text>
                             <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                <X size={24} color={currentTheme.colors.text || '#1E293B'} />
              </TouchableOpacity>
            </View>

            <ScrollView 
              showsVerticalScrollIndicator={false}
              style={{ flex: 1, maxHeight: '80%' }}
              contentContainerStyle={{ paddingBottom: 20 }}
            >
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
                <Text style={styles.label}>{t('title_general')}</Text>
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
                  <Text style={styles.label}>{t('custom_reminder')}</Text>
                  <Switch
                    value={reminderEnabled || useMultipleReminders}
                    onValueChange={(value) => {
                      if (value) {
                        setReminderEnabled(true);
                        setUseMultipleReminders(false);
                      } else {
                        setReminderEnabled(false);
                        setUseMultipleReminders(false);
                      }
                    }}
                    trackColor={{ false: currentTheme.colors.border, true: currentTheme.colors.primaryLight }}
                    thumbColor={(reminderEnabled || useMultipleReminders) ? currentTheme.colors.primary : currentTheme.colors.textMuted}
                  />
                </View>
                
                {(reminderEnabled || useMultipleReminders) && (
                  <>
                    {/* Multiple Reminders Toggle */}
                    <View style={styles.reminderTypeToggle}>
                      <TouchableOpacity
                        style={[
                          styles.reminderTypeButton,
                          !useMultipleReminders && styles.reminderTypeButtonActive
                        ]}
                        onPress={() => {
                          setUseMultipleReminders(false);
                          setReminders([]);
                        }}
                      >
                        <Text style={[
                          styles.reminderTypeText,
                          !useMultipleReminders && styles.reminderTypeTextActive
                        ]}>
                          {t('single_reminder')}
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[
                          styles.reminderTypeButton,
                          useMultipleReminders && styles.reminderTypeButtonActive
                        ]}
                        onPress={() => {
                          // For testing purposes, allow all users to use multiple reminders
                          setUseMultipleReminders(true);
                          setReminderEnabled(false);
                        }}
                      >
                        <View style={styles.reminderTypeButtonContent}>
                          <Text style={[
                            styles.reminderTypeText,
                            useMultipleReminders && styles.reminderTypeTextActive
                          ]}>
                            {t('multiple_reminders')}
                          </Text>
                        </View>
                      </TouchableOpacity>
                    </View>

                    {/* Single Reminder */}
                    {!useMultipleReminders && (
                      <>
                        <TouchableOpacity 
                          style={styles.timeSelector}
                          onPress={() => setShowTimePicker(true)}
                        >
                          <Clock size={20} color={currentTheme.colors.textSecondary} style={styles.timeIcon} />
                          <Text style={styles.timeText}>{formatTime(reminderTime)}</Text>
                        </TouchableOpacity>

                        <View style={styles.daysSection}>
                          <View style={styles.daysSectionHeader}>
                            <Calendar size={16} color={currentTheme.colors.textSecondary} />
                            <Text style={styles.daysLabel}>{t('reminder_days')}</Text>
                          </View>
                          
                          <View style={styles.quickSelectContainer}>
                            <TouchableOpacity style={styles.quickSelectButton} onPress={selectAllDays}>
                              <Text style={styles.quickSelectText}>{t('all_days')}</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.quickSelectButton} onPress={selectWeekdays}>
                              <Text style={styles.quickSelectText}>{t('weekdays')}</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.quickSelectButton} onPress={selectWeekends}>
                              <Text style={styles.quickSelectText}>{t('weekends')}</Text>
                            </TouchableOpacity>
                          </View>

                          <View style={styles.daysContainer}>
                            {daysOfWeek.map((day) => (
                              <TouchableOpacity
                                key={day.id}
                                style={[
                                  styles.dayButton,
                                  reminderDays.includes(day.id) && styles.dayButtonSelected
                                ]}
                                onPress={() => toggleReminderDay(day.id)}
                              >
                                <Text style={[
                                  styles.dayButtonText,
                                  reminderDays.includes(day.id) && styles.dayButtonTextSelected
                                ]}>
                                  {day.short}
                                </Text>
                              </TouchableOpacity>
                            ))}
                          </View>
                          
                          <Text style={styles.selectedDaysText}>
                            {reminderDays.length === 0 
                              ? t('no_days_selected')
                              : `${t('reminders_on')} ${reminderDays.map(id => daysOfWeek[id].name).join(', ')}`
                            }
                          </Text>
                        </View>
                      </>
                    )}

                    {/* Multiple Reminders */}
                    {useMultipleReminders && (
                      <MultipleReminders
                        reminders={reminders}
                        onRemindersChange={setReminders}
                        maxReminders={3}
                      />
                    )}
                  </>
                )}
              </View>
            </ScrollView>

            {showTimePicker && (
              <DateTimePicker
                value={reminderTime}
                mode="time"
                is24Hour={currentLanguage.code === 'zh'}
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={handleTimeChange}
              />
            )}

            {/* Button container outside ScrollView */}
            <View style={styles.buttonContainer}>
                             <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
                <Text style={[styles.cancelButtonText, { color: currentTheme.colors.textSecondary || '#475569' }]}>
                  {t('cancel')}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.saveButton, !title.trim() && styles.saveButtonDisabled]} 
                onPress={handleSave}
                disabled={!title.trim()}
              >
                <Text style={styles.saveButtonText}>
                  {isEditing ? t('save_changes') : t('create_habit')}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <EmojiPicker
        visible={showEmojiPicker}
        onClose={() => setShowEmojiPicker(false)}
        onSelect={(emoji) => {
          setIcon(emoji);
          setShowEmojiPicker(false);
        }}
      />
    </>
  );
}

const createStyles = (colors: any) => StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 10,
    paddingVertical: 10,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    width: '95%',
    minHeight: 900,
    maxHeight: '95%',
    borderWidth: 2,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
    paddingBottom: 10,
    borderBottomWidth: 2,
    borderBottomColor: colors.border || '#E2E8F0',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.text || '#1E293B',
  },
  closeButton: {
    padding: 10,
    backgroundColor: colors.card || colors.surface || '#F8FAFC',
    borderRadius: 25,
    borderWidth: 1,
    borderColor: colors.border || '#E2E8F0',
  },
  formGroup: {
    marginBottom: 15,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textSecondary || '#475569',
    marginBottom: 8,
  },
  input: {
    backgroundColor: colors.card || colors.surface || '#F8FAFC',
    borderRadius: 12,
    padding: 12,
    fontSize: 16,
    color: colors.text || '#1E293B',
    borderWidth: 2,
    borderColor: colors.border || '#E2E8F0',
    minHeight: 45,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  reminderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  iconSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card || colors.surface || '#F8FAFC',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.border || '#E2E8F0',
    // Add minimum height for better visibility
    minHeight: 50,
  },
  iconDisplay: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.background || '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    // Add border for better visibility
    borderWidth: 1,
    borderColor: colors.border || '#E2E8F0',
  },
  selectedIcon: {
    fontSize: 24,
  },
  iconSelectorText: {
    fontSize: 16,
    color: colors.text || '#1E293B',
    fontWeight: '500',
  },
  timeSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card || colors.surface || '#F8FAFC',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.border || '#E2E8F0',
    // Add minimum height for better visibility
    minHeight: 50,
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
    marginTop: 15,
    gap: 15,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: colors.border || '#E2E8F0',
  },
  cancelButton: {
    flex: 1,
    backgroundColor: colors.card || '#F8FAFC',
    borderRadius: 12,
    padding: 18,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.border || '#E2E8F0',
  },
  cancelButtonText: {
    color: colors.textSecondary || '#475569',
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
    backgroundColor: colors.border || '#E2E8F0',
    opacity: 0.6,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  reminderTypeToggle: {
    flexDirection: 'row',
    backgroundColor: colors.background,
    borderRadius: 8,
    padding: 4,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  reminderTypeButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    alignItems: 'center',
  },
  reminderTypeButtonActive: {
    backgroundColor: colors.primary,
  },
  reminderTypeText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.textSecondary,
  },
  reminderTypeTextActive: {
    color: colors.background,
  },
  reminderTypeButtonDisabled: {
    opacity: 0.6,
  },
  reminderTypeButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  reminderTypeTextDisabled: {
    color: colors.textMuted,
  },
  premiumIcon: {
    marginLeft: 4,
  },
  daysSection: {
    marginTop: 16,
  },
  daysSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  daysLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.textSecondary,
    marginLeft: 8,
  },
  quickSelectContainer: {
    flexDirection: 'row',
    marginBottom: 12,
    gap: 8,
  },
  quickSelectButton: {
    backgroundColor: colors.card,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  quickSelectText: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  daysContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  dayButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.card,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  dayButtonSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  dayButtonText: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.textSecondary,
  },
  dayButtonTextSelected: {
    color: '#FFFFFF',
  },
  selectedDaysText: {
    fontSize: 12,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: 8,
  },
});