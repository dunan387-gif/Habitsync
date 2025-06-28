import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, SafeAreaView, Switch, Platform } from 'react-native';
import { X, Save, Trash2, Clock } from 'lucide-react-native';
import { useHabits } from '@/context/HabitContext';
import { useLanguage } from '@/context/LanguageContext';
import { useLocalSearchParams, useRouter } from 'expo-router';
import DateTimePicker from '@react-native-community/datetimepicker';

export default function HabitDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { getHabitById, updateHabit, deleteHabit } = useHabits();
  const { t } = useLanguage();
  
  const habit = getHabitById(id as string);
  
  const [title, setTitle] = useState(habit?.title || '');
  const [notes, setNotes] = useState(habit?.notes || '');
  const [reminderEnabled, setReminderEnabled] = useState(habit?.reminderEnabled || false);
  const [reminderTime, setReminderTime] = useState(
    habit?.reminderTime 
      ? new Date(`2000-01-01T${habit.reminderTime}:00`) 
      : new Date(new Date().setHours(9, 0, 0, 0))
  );
  const [showTimePicker, setShowTimePicker] = useState(false);
  
  const handleSave = () => {
    if (!habit) return;
    
    updateHabit(habit.id, {
      ...habit,
      title,
      notes,
      reminderEnabled,
      reminderTime: reminderEnabled ? 
        `${reminderTime.getHours().toString().padStart(2, '0')}:${reminderTime.getMinutes().toString().padStart(2, '0')}` : 
        undefined,
    });
    
    router.back();
  };
  
  const handleTimeChange = (event: any, selectedTime?: Date) => {
    setShowTimePicker(Platform.OS === 'ios');
    if (selectedTime) {
      setReminderTime(selectedTime);
    }
  };
  
  const formatTime = (date: Date) => {
    let hours = date.getHours();
    const minutes = date.getMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    
    hours = hours % 12;
    hours = hours ? hours : 12;
    
    return `${hours}:${minutes.toString().padStart(2, '0')} ${ampm}`;
  };
  
  const handleDelete = () => {
    if (!habit) return;
    deleteHabit(habit.id);
    router.back();
  };

  if (!habit) {
    return (
      <SafeAreaView style={styles.container}>
        <Text>{t('habit_not_found')}</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <X size={24} color="#64748B" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{t('edit_habit')}</Text>
          <TouchableOpacity onPress={handleSave}>
            <Save size={24} color="#4ECDC4" />
          </TouchableOpacity>
        </View>

        {/* Form */}
        <View style={styles.form}>
          <View style={styles.formGroup}>
            <Text style={styles.label}>{t('habit_name')}</Text>
            <TextInput
              style={styles.input}
              value={title}
              onChangeText={setTitle}
              placeholder={t('enter_habit_name')}
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>{t('notes')}</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={notes}
              onChangeText={setNotes}
              placeholder={t('add_notes_about_habit')}
              multiline
            />
          </View>

          <View style={styles.formGroup}>
            <View style={styles.reminderHeader}>
              <Text style={styles.label}>{t('daily_reminder')}</Text>
              <Switch
                value={reminderEnabled}
                onValueChange={setReminderEnabled}
                trackColor={{ false: '#E2E8F0', true: '#4ECDC4' }}
                thumbColor="#FFFFFF"
              />
            </View>
            
            {reminderEnabled && (
              <TouchableOpacity 
                style={styles.timeSelector}
                onPress={() => setShowTimePicker(true)}
              >
                <Clock size={20} color="#64748B" style={styles.timeIcon} />
                <Text style={styles.timeText}>{formatTime(reminderTime)}</Text>
              </TouchableOpacity>
            )}
          
            {showTimePicker && (
              <DateTimePicker
                value={reminderTime}
                mode="time"
                is24Hour={false}
                display="default"
                onChange={handleTimeChange}
              />
            )}
          </View>
        </View>

        {/* Delete Button */}
        <TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
          <Trash2 size={20} color="#FFFFFF" style={styles.deleteIcon} />
          <Text style={styles.deleteText}>{t('delete_habit')}</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  content: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1E293B',
  },
  form: {
    padding: 16,
  },
  formGroup: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1E293B',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#1E293B',
  },
  textArea: {
    minHeight: 100,
  },
  statsContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginTop: 8,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 16,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  statLabel: {
    fontSize: 16,
    color: '#64748B',
  },
  statValue: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1E293B',
  },
  deleteButton: {
    backgroundColor: '#FF6B6B',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 8,
    marginBottom: 32,
  },
  deleteIcon: {
    marginRight: 8,
  },
  deleteText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  timeSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  timeIcon: {
    marginRight: 8,
  },
  timeText: {
    fontSize: 16,
    color: '#1E293B',
  },
  reminderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
});