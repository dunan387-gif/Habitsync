import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert } from 'react-native';
import { useTheme } from '@/context/ThemeContext';
import { useLanguage } from '@/context/LanguageContext';
import { WellnessIntegrationService, ExerciseData } from '@/services/WellnessIntegrationService';
import { Activity, Clock, Zap, Heart, Timer, Target } from 'lucide-react-native';

interface ExerciseTrackingFormProps {
  onSave?: () => void;
  onCancel?: () => void;
}

export default function ExerciseTrackingForm({ onSave, onCancel }: ExerciseTrackingFormProps) {
  const { currentTheme } = useTheme();
  const { t } = useLanguage();
  const [formData, setFormData] = useState<Partial<ExerciseData>>({
    date: new Date().toISOString().split('T')[0],
    type: 'cardio',
    duration: 30,
    intensity: 'moderate',
    caloriesBurned: undefined,
    heartRate: undefined,
    notes: ''
  });
  const [loading, setLoading] = useState(false);

  const styles = createStyles(currentTheme.colors);

  const exerciseTypes = [
    { value: 'cardio', label: t('wellnessForms.exercise.types.cardio'), icon: '🏃', color: '#FF6B6B' },
    { value: 'strength', label: t('wellnessForms.exercise.types.strength'), icon: '💪', color: '#4ECDC4' },
    { value: 'yoga', label: t('wellnessForms.exercise.types.yoga'), icon: '🧘', color: '#45B7D1' },
    { value: 'walking', label: t('wellnessForms.exercise.types.walking'), icon: '🚶', color: '#96CEB4' },
    { value: 'sports', label: t('wellnessForms.exercise.types.sports'), icon: '⚽', color: '#FFEAA7' },
    { value: 'other', label: t('wellnessForms.exercise.types.other'), icon: '🏋️', color: '#DDA0DD' }
  ];

  const intensityLevels = [
    { value: 'low', label: t('wellnessForms.exercise.intensity.low'), description: t('wellnessForms.exercise.intensity.lowDesc'), color: '#4CAF50', icon: '😌' },
    { value: 'moderate', label: t('wellnessForms.exercise.intensity.moderate'), description: t('wellnessForms.exercise.intensity.moderateDesc'), color: '#FF9800', icon: '😊' },
    { value: 'high', label: t('wellnessForms.exercise.intensity.high'), description: t('wellnessForms.exercise.intensity.highDesc'), color: '#F44336', icon: '😤' }
  ];

  const durationPresets = [15, 30, 45, 60, 90, 120];

  const handleSave = async () => {
    if (!formData.duration || formData.duration <= 0) {
      Alert.alert(t('wellnessForms.exercise.missingInfo'), t('wellnessForms.exercise.missingInfoMessage'));
      return;
    }

    try {
      setLoading(true);
      const exerciseData: ExerciseData = {
        id: Date.now().toString(),
        date: formData.date!,
        type: formData.type!,
        duration: formData.duration!,
        intensity: formData.intensity!,
        caloriesBurned: formData.caloriesBurned,
        heartRate: formData.heartRate,
        notes: formData.notes
      };

      await WellnessIntegrationService.saveExerciseData(exerciseData);
      Alert.alert(t('wellnessForms.exercise.success'), t('wellnessForms.exercise.successMessage'));
      if (onSave) onSave();
    } catch (error) {
      Alert.alert(t('wellnessForms.exercise.error'), t('wellnessForms.exercise.errorMessage'));
    } finally {
      setLoading(false);
    }
  };

  const renderTypeSelector = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{t('wellnessForms.exercise.exerciseType')}</Text>
      <View style={styles.typeGrid}>
        {exerciseTypes.map((type) => (
          <TouchableOpacity
            key={type.value}
            style={[
              styles.typeCard,
              formData.type === type.value && { 
                backgroundColor: type.color + '20', 
                borderColor: type.color 
              }
            ]}
            onPress={() => setFormData({ ...formData, type: type.value as any })}
          >
            <Text style={styles.typeIcon}>{type.icon}</Text>
            <Text style={[
              styles.typeLabel,
              formData.type === type.value && { color: type.color }
            ]}>
              {type.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const renderDurationSelector = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{t('wellnessForms.exercise.duration')}</Text>
      <View style={styles.durationContainer}>
        <TouchableOpacity
          style={styles.durationButton}
          onPress={() => setFormData({ ...formData, duration: Math.max(5, (formData.duration || 0) - 5) })}
        >
          <Text style={styles.durationButtonText}>-5</Text>
        </TouchableOpacity>
        <View style={styles.durationDisplay}>
          <Timer size={20} color={currentTheme.colors.primary} />
          <Text style={styles.durationValue}>{formData.duration}</Text>
          <Text style={styles.durationUnit}>{t('wellnessForms.exercise.minutes')}</Text>
        </View>
        <TouchableOpacity
          style={styles.durationButton}
          onPress={() => setFormData({ ...formData, duration: (formData.duration || 0) + 5 })}
        >
          <Text style={styles.durationButtonText}>+5</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.presetContainer}>
        {durationPresets.map((duration) => (
          <TouchableOpacity
            key={duration}
            style={[
              styles.presetButton,
              formData.duration === duration && styles.selectedPreset
            ]}
            onPress={() => setFormData({ ...formData, duration })}
          >
            <Text style={[
              styles.presetText,
              formData.duration === duration && styles.selectedPresetText
            ]}>
              {duration}m
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const renderIntensitySelector = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{t('wellnessForms.exercise.intensityLevel')}</Text>
      <View style={styles.intensityContainer}>
        {intensityLevels.map((level) => (
          <TouchableOpacity
            key={level.value}
            style={[
              styles.intensityCard,
              formData.intensity === level.value && {
                backgroundColor: level.color + '20',
                borderColor: level.color
              }
            ]}
            onPress={() => setFormData({ ...formData, intensity: level.value as any })}
          >
            <Text style={styles.intensityIcon}>{level.icon}</Text>
            <Text style={[
              styles.intensityLabel,
              formData.intensity === level.value && { color: level.color }
            ]}>
              {level.label}
            </Text>
            <Text style={styles.intensityDescription}>{level.description}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <View style={styles.headerIcon}>
          <Activity size={28} color={currentTheme.colors.primary} />
        </View>
        <View>
          <Text style={styles.title}>{t('wellnessForms.exercise.title')}</Text>
          <Text style={styles.subtitle}>{t('wellnessForms.exercise.subtitle')}</Text>
        </View>
      </View>

      {/* Date Card */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>{t('wellnessForms.exercise.workoutDate')}</Text>
        <TextInput
          style={styles.dateInput}
          value={formData.date}
          onChangeText={(text) => setFormData({ ...formData, date: text })}
          placeholder="YYYY-MM-DD"
          placeholderTextColor={currentTheme.colors.textSecondary}
        />
      </View>

      {/* Exercise Type */}
      <View style={styles.card}>
        {renderTypeSelector()}
      </View>

      {/* Duration */}
      <View style={styles.card}>
        {renderDurationSelector()}
      </View>

      {/* Intensity */}
      <View style={styles.card}>
        {renderIntensitySelector()}
      </View>

      {/* Optional Details */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>{t('wellnessForms.exercise.additionalDetails')}</Text>
        <View style={styles.optionalRow}>
          <View style={styles.optionalField}>
            <Text style={styles.fieldLabel}>{t('wellnessForms.exercise.caloriesBurned')}</Text>
            <TextInput
              style={styles.optionalInput}
              value={formData.caloriesBurned?.toString()}
              onChangeText={(text) => setFormData({ ...formData, caloriesBurned: parseInt(text) || undefined })}
              placeholder="300"
              keyboardType="numeric"
              placeholderTextColor={currentTheme.colors.textSecondary}
            />
          </View>
        </View>
        
        {/* Heart Rate Section */}
        <Text style={[styles.fieldLabel, { marginTop: 16 }]}>{t('wellnessForms.exercise.heartRate')}</Text>
        <View style={styles.optionalRow}>
          <View style={styles.optionalField}>
            <Text style={styles.fieldLabel}>{t('wellnessForms.exercise.average')}</Text>
            <TextInput
              style={styles.optionalInput}
              value={formData.heartRate?.average?.toString()}
              onChangeText={(text) => setFormData({ 
                ...formData, 
                heartRate: { 
                  ...formData.heartRate, 
                  average: parseInt(text) || 0,
                  max: formData.heartRate?.max || 0 // Ensure max is always set
                } 
              })}
              placeholder="140"
              keyboardType="numeric"
              placeholderTextColor={currentTheme.colors.textSecondary}
            />
          </View>
          <View style={styles.optionalField}>
            <Text style={styles.fieldLabel}>{t('wellnessForms.exercise.maximum')}</Text>
            <TextInput
              style={styles.optionalInput}
              value={formData.heartRate?.max?.toString()}
              onChangeText={(text) => setFormData({ 
                ...formData, 
                heartRate: { 
                  ...formData.heartRate, 
                  max: parseInt(text) || 0,
                  average: formData.heartRate?.average || 0 // Ensure average is always set
                } 
              })}
              placeholder="160"
              keyboardType="numeric"
              placeholderTextColor={currentTheme.colors.textSecondary}
            />
          </View>
        </View>
      </View>

      {/* Notes */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>{t('wellnessForms.exercise.workoutNotes')}</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={formData.notes}
          onChangeText={(text) => setFormData({ ...formData, notes: text })}
          placeholder={t('wellnessForms.exercise.notesPlaceholder')}
          placeholderTextColor={currentTheme.colors.textSecondary}
          multiline
        />
      </View>

      {/* Action Buttons */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.cancelButton} onPress={onCancel}>
          <Text style={styles.cancelButtonText}>{t('wellnessForms.exercise.cancel')}</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.saveButton, loading && styles.disabledButton]} 
          onPress={handleSave}
          disabled={loading}
        >
          <Text style={styles.saveButtonText}>
            {loading ? t('wellnessForms.exercise.saving') : t('wellnessForms.exercise.save')}
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
    marginBottom: 16,
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
  typeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  typeCard: {
    flex: 1,
    minWidth: '30%',
    backgroundColor: colors.surface,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  typeIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  typeLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    textAlign: 'center',
  },
  durationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 24,
    marginBottom: 16,
  },
  durationButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  durationButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
  },
  durationDisplay: {
    alignItems: 'center',
    gap: 8,
  },
  durationValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: colors.text,
  },
  durationUnit: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  presetContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'center',
  },
  presetButton: {
    backgroundColor: colors.surface,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
  },
  selectedPreset: {
    backgroundColor: colors.primary + '20',
    borderColor: colors.primary,
  },
  presetText: {
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  selectedPresetText: {
    color: colors.primary,
    fontWeight: 'bold',
  },
  intensityContainer: {
    gap: 12,
  },
  intensityCard: {
    backgroundColor: colors.surface,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  intensityIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  intensityLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  intensityDescription: {
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  optionalRow: {
    flexDirection: 'row',
    gap: 16,
  },
  optionalField: {
    flex: 1,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.textSecondary,
    marginBottom: 8,
  },
  optionalInput: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 12,
    fontSize: 16,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.border,
    textAlign: 'center',
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