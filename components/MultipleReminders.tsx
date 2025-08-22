import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Switch, Platform, Alert, ScrollView } from 'react-native';
import { Plus, X, Clock, Calendar } from 'lucide-react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { HabitReminder } from '@/types';
import { useTheme } from '@/context/ThemeContext';
import { useLanguage } from '@/context/LanguageContext';

type MultipleRemindersProps = {
  reminders: HabitReminder[];
  onRemindersChange: (reminders: HabitReminder[]) => void;
  maxReminders?: number;
};

export default function MultipleReminders({ 
  reminders, 
  onRemindersChange, 
  maxReminders = 3 
}: MultipleRemindersProps) {
  console.log('🎯 MultipleReminders component rendered with:', { reminders, maxReminders });
  const { currentTheme } = useTheme();
  const { t, currentLanguage } = useLanguage();
  
  const [showTimePicker, setShowTimePicker] = useState<string | null>(null);
  const [showDayPicker, setShowDayPicker] = useState<string | null>(null);
  const scrollViewRef = React.useRef<ScrollView>(null);

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

  const addReminder = () => {
    if (reminders.length >= maxReminders) {
      Alert.alert(t('error_general'), t('max_reminders_reached'));
      return;
    }

    const newReminder: HabitReminder = {
      id: Date.now().toString(),
      time: '09:00',
      enabled: true,
      days: [1, 2, 3, 4, 5], // Default to weekdays
      message: '',
    };

    onRemindersChange([...reminders, newReminder]);
    
    // Let maintainVisibleContentPosition handle the scroll behavior
    // This will keep existing reminders visible while showing the new one
  };

  const removeReminder = (id: string) => {
    onRemindersChange(reminders.filter(r => r.id !== id));
  };

  const updateReminder = (id: string, updates: Partial<HabitReminder>) => {
    onRemindersChange(reminders.map(r => 
      r.id === id ? { ...r, ...updates } : r
    ));
  };

  const toggleReminderEnabled = (id: string, enabled: boolean) => {
    updateReminder(id, { enabled });
  };

  const toggleReminderDay = (reminderId: string, dayId: number) => {
    const reminder = reminders.find(r => r.id === reminderId);
    if (!reminder) return;

    const newDays = reminder.days.includes(dayId)
      ? reminder.days.filter(id => id !== dayId)
      : [...reminder.days, dayId];

    updateReminder(reminderId, { days: newDays });
  };

  const handleTimeChange = (event: any, selectedTime?: Date) => {
    if (Platform.OS === 'android') {
      setShowTimePicker(null);
    }
    
    if (selectedTime && showTimePicker) {
      const timeString = `${selectedTime.getHours().toString().padStart(2, '0')}:${selectedTime.getMinutes().toString().padStart(2, '0')}`;
      updateReminder(showTimePicker, { time: timeString });
    }
  };

  const formatTime = (timeString: string): string => {
    const [hours, minutes] = timeString.split(':').map(Number);
    
    if (currentLanguage.code === 'zh') {
      // Chinese format: 24-hour format
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
    } else {
      // English format: 12-hour format with AM/PM
      const ampm = hours >= 12 ? 'PM' : 'AM';
      const displayHours = hours % 12 || 12;
      return `${displayHours}:${minutes.toString().padStart(2, '0')} ${ampm}`;
    }
  };

  const formatDays = (days: number[]): string => {
    if (days.length === 7) return t('every_day');
    if (days.length === 5 && days.includes(1) && days.includes(2) && days.includes(3) && days.includes(4) && days.includes(5)) {
      return t('weekdays');
    }
    if (days.length === 2 && days.includes(0) && days.includes(6)) {
      return t('weekends');
    }
    return days.map(dayId => daysOfWeek[dayId].short).join(', ');
  };

  const selectAllDays = (reminderId: string) => {
    updateReminder(reminderId, { days: [0, 1, 2, 3, 4, 5, 6] });
  };

  const selectWeekdays = (reminderId: string) => {
    updateReminder(reminderId, { days: [1, 2, 3, 4, 5] });
  };

  const selectWeekends = (reminderId: string) => {
    updateReminder(reminderId, { days: [0, 6] });
  };

  const styles = createStyles(currentTheme.colors);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{t('reminders')}</Text>
        <TouchableOpacity 
          style={styles.addButton} 
          onPress={addReminder}
          disabled={reminders.length >= maxReminders}
        >
          <Plus size={20} color={currentTheme.colors.primary} />
          <Text style={styles.addButtonText}>{t('add_reminder')}</Text>
        </TouchableOpacity>
      </View>

      {reminders.length === 0 ? (
        <View style={styles.emptyState}>
          <Clock size={24} color={currentTheme.colors.textSecondary} />
          <Text style={styles.emptyText}>{t('no_reminders_set')}</Text>
        </View>
      ) : (
        <View style={styles.scrollContainer}>
          <ScrollView 
            ref={scrollViewRef}
            style={styles.remindersList} 
            showsVerticalScrollIndicator={true}
            contentContainerStyle={{ flexGrow: 1, paddingBottom: 20 }}
            maintainVisibleContentPosition={{
              minIndexForVisible: 0,
              autoscrollToTopThreshold: 10
            }}
          >
            {reminders.map((reminder, index) => (
            <View key={reminder.id} style={styles.reminderItem}>
              <View style={styles.reminderHeader}>
                <View style={styles.reminderInfo}>
                  <Text style={styles.reminderNumber}>{t('reminder')} {index + 1}</Text>
                  <Switch
                    value={reminder.enabled}
                    onValueChange={(value) => toggleReminderEnabled(reminder.id, value)}
                    trackColor={{ false: currentTheme.colors.border, true: currentTheme.colors.primary }}
                    thumbColor={currentTheme.colors.background}
                  />
                </View>
                <TouchableOpacity 
                  style={styles.removeButton}
                  onPress={() => removeReminder(reminder.id)}
                >
                  <X size={16} color={currentTheme.colors.error || '#ef4444'} />
                </TouchableOpacity>
              </View>

              <View style={styles.reminderContent}>
                {/* Time Selection */}
                <TouchableOpacity 
                  style={styles.timeButton}
                  onPress={() => setShowTimePicker(reminder.id)}
                >
                  <Clock size={16} color={currentTheme.colors.primary} />
                  <Text style={styles.timeText}>{formatTime(reminder.time)}</Text>
                </TouchableOpacity>

                {/* Days Selection */}
                <View style={styles.daysSection}>
                  <Text style={styles.daysLabel}>{t('repeat_on')}</Text>
                  <Text style={styles.daysText}>{formatDays(reminder.days)}</Text>
                  
                  <View style={styles.dayButtons}>
                    <TouchableOpacity 
                      style={styles.dayPresetButton}
                      onPress={() => selectAllDays(reminder.id)}
                    >
                      <Text style={styles.dayPresetText}>{t('all')}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={styles.dayPresetButton}
                      onPress={() => selectWeekdays(reminder.id)}
                    >
                      <Text style={styles.dayPresetText}>{t('weekdays')}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={styles.dayPresetButton}
                      onPress={() => selectWeekends(reminder.id)}
                    >
                      <Text style={styles.dayPresetText}>{t('weekends')}</Text>
                    </TouchableOpacity>
                  </View>

                  <View style={styles.daysGrid}>
                    {daysOfWeek.map(day => (
                      <TouchableOpacity
                        key={day.id}
                        style={[
                          styles.dayButton,
                          reminder.days.includes(day.id) && styles.dayButtonSelected
                        ]}
                        onPress={() => toggleReminderDay(reminder.id, day.id)}
                      >
                        <Text style={[
                          styles.dayButtonText,
                          reminder.days.includes(day.id) && styles.dayButtonTextSelected
                        ]}>
                          {day.short}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              </View>
                         </View>
           ))}
           </ScrollView>
         </View>
       )}

      {/* Time Picker Modal */}
      {showTimePicker && (
        <DateTimePicker
          value={(() => {
            const reminder = reminders.find(r => r.id === showTimePicker);
            if (!reminder) return new Date();
            const [hours, minutes] = reminder.time.split(':').map(Number);
            const date = new Date();
            date.setHours(hours, minutes, 0, 0);
            return date;
          })()}
          mode="time"
          is24Hour={currentLanguage.code === 'zh'}
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={handleTimeChange}
        />
      )}
    </View>
  );
}

const createStyles = (colors: any) => StyleSheet.create({
  container: {
    marginVertical: 10,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  addButtonText: {
    marginLeft: 4,
    fontSize: 14,
    color: colors.primary,
    fontWeight: '500',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  emptyText: {
    marginTop: 8,
    fontSize: 14,
    color: colors.textSecondary,
  },
  scrollContainer: {
    flex: 1,
  },
  remindersList: {
    maxHeight: 850,
  },
  reminderItem: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  reminderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  reminderInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  reminderNumber: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginRight: 12,
  },
  removeButton: {
    padding: 4,
  },
  reminderContent: {
    gap: 12,
  },
  timeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: colors.background,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  timeText: {
    marginLeft: 8,
    fontSize: 16,
    color: colors.text,
    fontWeight: '500',
  },
  daysSection: {
    gap: 8,
  },
  daysLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text,
  },
  daysText: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  dayButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  dayPresetButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: colors.background,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.border,
  },
  dayPresetText: {
    fontSize: 12,
    color: colors.text,
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  dayButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
  },
  dayButtonSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  dayButtonText: {
    fontSize: 12,
    color: colors.text,
    fontWeight: '500',
  },
  dayButtonTextSelected: {
    color: colors.background,
  },
});
