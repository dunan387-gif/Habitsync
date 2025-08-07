import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Switch,
  Platform,
  Alert,
  KeyboardAvoidingView,
  StyleSheet,
} from 'react-native';
import { X, Save, Trash2, Clock, Calendar } from 'lucide-react-native';
import { useHabits } from '@/context/HabitContext';
import { useLanguage } from '@/context/LanguageContext';
import { useLocalSearchParams, useRouter } from 'expo-router';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useTheme } from '@/context/ThemeContext';

export default function HabitDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { getHabitById, updateHabit, deleteHabit } = useHabits();
  const { t, currentLanguage } = useLanguage();
  const { currentTheme } = useTheme();
  
  const habit = getHabitById(id as string);
  
  const [title, setTitle] = useState(habit?.title || '');
  const [notes, setNotes] = useState(habit?.notes || '');
  const [reminderEnabled, setReminderEnabled] = useState(habit?.reminderEnabled || false);
  const [reminderDays, setReminderDays] = useState<number[]>(habit?.reminderDays || []);
  const [reminderTime, setReminderTime] = useState(
    habit?.reminderTime 
      ? new Date(`2000-01-01T${habit.reminderTime}:00`) 
      : new Date(new Date().setHours(9, 0, 0, 0))
  );
  const [showTimePicker, setShowTimePicker] = useState(false);

  const daysOfWeek = [
    { id: 0, name: t('sunday'), short: t('sun') },
    { id: 1, name: t('monday'), short: t('mon') },
    { id: 2, name: t('tuesday'), short: t('tue') },
    { id: 3, name: t('wednesday'), short: t('wed') },
    { id: 4, name: t('thursday'), short: t('thu') },
    { id: 5, name: t('friday'), short: t('fri') },
    { id: 6, name: t('saturday'), short: t('sat') },
  ];
  
  const handleSave = () => {
    if (!habit) return;
    
    if (!title.trim()) {
      Alert.alert(t('error'), t('please_enter_habit_title'));
      return;
    }

    if (reminderEnabled && reminderDays.length === 0) {
      Alert.alert(t('error'), t('please_select_reminder_days'));
      return;
    }
    
    updateHabit(habit.id, {
      ...habit,
      title: title.trim(),
      notes: notes.trim(),
      reminderEnabled,
      reminderDays: reminderEnabled ? reminderDays : [],
      reminderTime: reminderEnabled ? 
        `${reminderTime.getHours().toString().padStart(2, '0')}:${reminderTime.getMinutes().toString().padStart(2, '0')}` : 
        undefined,
    });
    
    router.back();
  };

  const toggleReminderDay = (dayId: number) => {
    setReminderDays(prev => {
      if (prev.includes(dayId)) {
        return prev.filter(id => id !== dayId);
      } else {
        return [...prev, dayId].sort();
      }
    });
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
  
  const handleTimeChange = (event: any, selectedTime?: Date) => {
    setShowTimePicker(Platform.OS === 'ios');
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
  
  const handleDelete = () => {
    if (!habit) return;
    Alert.alert(
      t('delete_habit_title'),
      t('delete_habit_confirmation'),
      [
        { text: t('cancel'), style: 'cancel' },
        { 
          text: t('delete'), 
          style: 'destructive',
          onPress: () => {
            deleteHabit(habit.id);
            router.back();
          }
        }
      ]
    );
  };

  const styles = createStyles(currentTheme.colors);

  if (!habit) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.notFoundContainer}>
          <Text style={styles.notFoundText}>
            {t('habit_not_found')}
          </Text>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Text style={styles.backButtonText}>{t('go_back')}</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity 
            onPress={() => router.back()}
            style={styles.headerButton}
          >
            <X size={24} color={currentTheme.colors.text} />
          </TouchableOpacity>
          
          <Text style={styles.headerTitle}>
            {t('edit_habit')}
          </Text>
          
          <TouchableOpacity 
            onPress={handleSave}
            style={styles.headerButton}
          >
            <Save size={24} color={currentTheme.colors.primary} />
          </TouchableOpacity>
        </View>

        {/* Content */}
        <ScrollView 
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
        >
          {/* Title Section */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>
              {t('habit_name')}
            </Text>
            <TextInput
              style={styles.input}
              value={title}
              onChangeText={setTitle}
              placeholder={t('enter_habit_name')}
              placeholderTextColor={currentTheme.colors.textMuted}
            />
          </View>

          {/* Notes Section */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>
              {t('notes')}
            </Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={notes}
              onChangeText={setNotes}
              placeholder={t('add_notes_about_habit')}
              placeholderTextColor={currentTheme.colors.textMuted}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />
          </View>

          {/* Reminder Section - Using exact HabitForm structure */}
          <View style={styles.formGroup}>
            <View style={styles.reminderHeader}>
              <Text style={styles.label}>
                {t('custom_reminder')}
              </Text>
              <Switch
                value={reminderEnabled}
                onValueChange={setReminderEnabled}
                trackColor={{ false: currentTheme.colors.border, true: currentTheme.colors.primaryLight }}
                thumbColor={reminderEnabled ? currentTheme.colors.primary : currentTheme.colors.textMuted}
              />
            </View>
            
            {reminderEnabled && (
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
          </View>

          {/* Delete Button */}
          <TouchableOpacity 
            style={styles.deleteButton}
            onPress={handleDelete}
          >
            <Trash2 size={20} color="#FFFFFF" style={styles.deleteIcon} />
            <Text style={styles.deleteButtonText}>
              {t('delete_habit')}
            </Text>
          </TouchableOpacity>
        </ScrollView>

        {/* Time Picker Modal */}
        {showTimePicker && (
          <DateTimePicker
            value={reminderTime}
            mode="time"
            is24Hour={currentLanguage.code === 'zh'}
            display="default"
            onChange={handleTimeChange}
          />
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// Using the exact same styles as HabitForm for consistency
const createStyles = (colors: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  keyboardView: {
    flex: 1,
  },
  notFoundContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  notFoundText: {
    fontSize: 18,
    color: colors.textSecondary,
    marginBottom: 20,
    textAlign: 'center',
  },
  backButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
    minHeight: 48,
  },
  backButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.text,
  },
  scrollView: {
    flex: 1,
    padding: 20,
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
  timeIcon: {
    marginRight: 8,
  },
  timeText: {
    fontSize: 16,
    color: colors.text,
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
  deleteButton: {
    backgroundColor: '#FF6B6B',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    marginTop: 20,
  },
  deleteIcon: {
    marginRight: 8,
  },
  deleteButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});