import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert } from 'react-native';
import { useTheme } from '@/context/ThemeContext';
import { useLanguage } from '@/context/LanguageContext';
import { WellnessIntegrationService, SleepData } from '@/services/WellnessIntegrationService';
import { Moon, Clock, Star, AlertCircle, Bed, Sun } from 'lucide-react-native';

interface SleepTrackingFormProps {
  onSave?: () => void;
  onCancel?: () => void;
}

export default function SleepTrackingForm({ onSave, onCancel }: SleepTrackingFormProps) {
  const { currentTheme } = useTheme();
  const { t } = useLanguage();
  const [formData, setFormData] = useState<Partial<SleepData>>({
    date: new Date().toISOString().split('T')[0],
    bedtime: '',
    wakeTime: '',
    duration: 0,
    quality: 3,
    interruptions: 0,
    notes: ''
  });
  const [loading, setLoading] = useState(false);

  const styles = createStyles(currentTheme.colors);

  const handleSave = async () => {
    if (!formData.bedtime || !formData.wakeTime) {
      Alert.alert('Missing Information', 'Please set both bedtime and wake time to continue.');
      return;
    }

    try {
      setLoading(true);
      const sleepData: SleepData = {
        id: Date.now().toString(),
        date: formData.date!,
        bedtime: formData.bedtime!,
        wakeTime: formData.wakeTime!,
        duration: calculateDuration(formData.bedtime!, formData.wakeTime!),
        quality: formData.quality!,
        interruptions: formData.interruptions!,
        notes: formData.notes
      };

      await WellnessIntegrationService.saveSleepData(sleepData);
      Alert.alert('Success! 🌙', 'Your sleep data has been saved successfully.');
      if (onSave) onSave();
    } catch (error) {
      Alert.alert('Error', 'Failed to save sleep data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const calculateDuration = (bedtime: string, wakeTime: string): number => {
    const bed = new Date(`2000-01-01 ${bedtime}`);
    const wake = new Date(`2000-01-01 ${wakeTime}`);
    if (wake < bed) wake.setDate(wake.getDate() + 1);
    return (wake.getTime() - bed.getTime()) / (1000 * 60 * 60);
  };

  const quickTimePresets = {
    bedtime: ['21:00', '21:30', '22:00', '22:30', '23:00', '23:30'],
    wakeTime: ['06:00', '06:30', '07:00', '07:30', '08:00', '08:30']
  };

  const renderTimeSelector = (type: 'bedtime' | 'wakeTime', icon: any, title: string) => (
    <View style={styles.timeSection}>
      <View style={styles.timeSectionHeader}>
        {icon}
        <Text style={styles.timeSectionTitle}>{title}</Text>
      </View>
      <TextInput
        style={styles.timeInput}
        value={type === 'bedtime' ? formData.bedtime : formData.wakeTime}
        onChangeText={(text) => setFormData({ ...formData, [type]: text })}
        placeholder="HH:MM"
        placeholderTextColor={currentTheme.colors.textSecondary}
      />
      <View style={styles.presetContainer}>
        {quickTimePresets[type].map((time) => (
          <TouchableOpacity
            key={time}
            style={styles.presetButton}
            onPress={() => setFormData({ ...formData, [type]: time })}
          >
            <Text style={styles.presetText}>{time}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const renderQualitySelector = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>How was your sleep quality?</Text>
      <View style={styles.qualityContainer}>
        {[1, 2, 3, 4, 5].map((rating) => (
          <TouchableOpacity
            key={rating}
            style={[styles.qualityButton, formData.quality === rating && styles.selectedQuality]}
            onPress={() => setFormData({ ...formData, quality: rating as 1 | 2 | 3 | 4 | 5 })}
          >
            <Star 
              size={28} 
              color={formData.quality === rating ? '#FFD700' : currentTheme.colors.textSecondary}
              fill={formData.quality === rating ? '#FFD700' : 'none'}
            />
            <Text style={[styles.qualityText, formData.quality === rating && styles.selectedQualityText]}>
              {['Poor', 'Fair', 'Good', 'Great', 'Excellent'][rating - 1]}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const renderInterruptionsCounter = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Sleep Interruptions</Text>
      <View style={styles.counterContainer}>
        <TouchableOpacity
          style={styles.counterButton}
          onPress={() => setFormData({ ...formData, interruptions: Math.max(0, (formData.interruptions || 0) - 1) })}
        >
          <Text style={styles.counterButtonText}>-</Text>
        </TouchableOpacity>
        <View style={styles.counterDisplay}>
          <Text style={styles.counterValue}>{formData.interruptions || 0}</Text>
          <Text style={styles.counterLabel}>times</Text>
        </View>
        <TouchableOpacity
          style={styles.counterButton}
          onPress={() => setFormData({ ...formData, interruptions: (formData.interruptions || 0) + 1 })}
        >
          <Text style={styles.counterButtonText}>+</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <View style={styles.headerIcon}>
          <Moon size={28} color={currentTheme.colors.primary} />
        </View>
        <View>
          <Text style={styles.title}>Sleep Tracker</Text>
          <Text style={styles.subtitle}>Log your sleep patterns</Text>
        </View>
      </View>

      {/* Date Card */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Date</Text>
        <TextInput
          style={styles.dateInput}
          value={formData.date}
          onChangeText={(text) => setFormData({ ...formData, date: text })}
          placeholder="YYYY-MM-DD"
          placeholderTextColor={currentTheme.colors.textSecondary}
        />
      </View>

      {/* Sleep Times */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Sleep Schedule</Text>
        <View style={styles.timeRow}>
          {renderTimeSelector('bedtime', <Bed size={20} color={currentTheme.colors.primary} />, 'Bedtime')}
          {renderTimeSelector('wakeTime', <Sun size={20} color={currentTheme.colors.warning} />, 'Wake Time')}
        </View>
        {formData.bedtime && formData.wakeTime && (
          <View style={styles.durationDisplay}>
            <Clock size={16} color={currentTheme.colors.textSecondary} />
            <Text style={styles.durationText}>
              {calculateDuration(formData.bedtime, formData.wakeTime).toFixed(1)} hours of sleep
            </Text>
          </View>
        )}
      </View>

      {/* Quality Rating */}
      <View style={styles.card}>
        {renderQualitySelector()}
      </View>

      {/* Interruptions */}
      <View style={styles.card}>
        {renderInterruptionsCounter()}
      </View>

      {/* Notes */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Notes (Optional)</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={formData.notes}
          onChangeText={(text) => setFormData({ ...formData, notes: text })}
          placeholder="How did you sleep? Any factors that affected your sleep?"
          placeholderTextColor={currentTheme.colors.textSecondary}
          multiline
        />
      </View>

      {/* Action Buttons */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.cancelButton} onPress={onCancel}>
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.saveButton, loading && styles.disabledButton]} 
          onPress={handleSave}
          disabled={loading}
        >
          <Text style={styles.saveButtonText}>
            {loading ? 'Saving...' : 'Save Sleep Data'}
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const createStyles = (colors: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    paddingBottom: 16,
    gap: 16,
  },
  headerIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
  },
  subtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 2,
  },
  card: {
    backgroundColor: colors.card,
    marginHorizontal: 20,
    marginBottom: 16,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 16,
  },
  section: {
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 12,
  },
  dateInput: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.border,
  },
  timeRow: {
    flexDirection: 'row',
    gap: 16,
  },
  timeSection: {
    flex: 1,
  },
  timeSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  timeSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  timeInput: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.border,
    textAlign: 'center',
    marginBottom: 12,
  },
  presetContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  presetButton: {
    backgroundColor: colors.surface,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  presetText: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  durationDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 16,
    padding: 12,
    backgroundColor: colors.primary + '10',
    borderRadius: 12,
  },
  durationText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.primary,
  },
  qualityContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  qualityButton: {
    flex: 1,
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    backgroundColor: colors.surface,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedQuality: {
    backgroundColor: '#FFD70020',
    borderColor: '#FFD700',
  },
  qualityText: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 8,
    fontWeight: '500',
    textAlign: 'center',
  },
  selectedQualityText: {
    color: '#FFD700',
    fontWeight: 'bold',
  },
  counterContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 24,
  },
  counterButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  counterButtonText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
  },
  counterDisplay: {
    alignItems: 'center',
    minWidth: 80,
  },
  counterValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: colors.text,
  },
  counterLabel: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 4,
  },
  input: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.border,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 16,
    margin: 20,
    marginTop: 8,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: colors.surface,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  saveButton: {
    flex: 2,
    backgroundColor: colors.primary,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
  disabledButton: {
    opacity: 0.6,
  },
});