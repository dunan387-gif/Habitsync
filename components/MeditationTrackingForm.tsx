import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert } from 'react-native';
import { useTheme } from '@/context/ThemeContext';
import { useLanguage } from '@/context/LanguageContext';
import { WellnessIntegrationService, MeditationData } from '@/services/WellnessIntegrationService';
import { Brain, Clock, Star, Plus, X, Timer, Heart, Zap } from 'lucide-react-native';

interface MeditationTrackingFormProps {
  onSave?: () => void;
  onCancel?: () => void;
}

export default function MeditationTrackingForm({ onSave, onCancel }: MeditationTrackingFormProps) {
  const { currentTheme } = useTheme();
  const { t } = useLanguage();
  const [formData, setFormData] = useState<Partial<MeditationData>>({
    date: new Date().toISOString().split('T')[0],
    type: 'mindfulness',
    duration: 10,
    effectiveness: 3,
    techniques: [],
    preMood: { state: '', intensity: 5 },
    postMood: { state: '', intensity: 5 },
    notes: ''
  });
  const [newTechnique, setNewTechnique] = useState('');
  const [saving, setSaving] = useState(false);

  const styles = createStyles(currentTheme.colors);

  const meditationTypes = [
    { value: 'mindfulness', label: t('wellnessForms.meditation.types.mindfulness'), icon: '🧘', description: t('wellnessForms.meditation.types.mindfulnessDesc') },
    { value: 'breathing', label: t('wellnessForms.meditation.types.breathing'), icon: '💨', description: t('wellnessForms.meditation.types.breathingDesc') },
    { value: 'guided', label: t('wellnessForms.meditation.types.guided'), icon: '🎧', description: t('wellnessForms.meditation.types.guidedDesc') },
    { value: 'movement', label: t('wellnessForms.meditation.types.movement'), icon: '🤸', description: t('wellnessForms.meditation.types.movementDesc') },
    { value: 'other', label: t('wellnessForms.meditation.types.other'), icon: '✨', description: t('wellnessForms.meditation.types.otherDesc') }
  ];

  const durationPresets = [5, 10, 15, 20, 30, 45, 60];
  const commonTechniques = [
    t('wellnessForms.meditation.techniques.deepBreathing'),
    t('wellnessForms.meditation.techniques.bodyScan'),
    t('wellnessForms.meditation.techniques.lovingKindness'),
    t('wellnessForms.meditation.techniques.visualization'),
    t('wellnessForms.meditation.techniques.mantra')
  ];
const moodStates = [
  t('moodCheckIn.moodTags.stressed'), t('moodCheckIn.moodTags.anxious'), t('moodCheckIn.moodTags.calm'), 
  t('moodCheckIn.moodTags.peaceful'), t('moodCheckIn.moodTags.energetic'), t('moodCheckIn.moodTags.focused'), 
  t('moodCheckIn.moodTags.tired'), t('moodCheckIn.moodTags.happy')
];

  const handleSave = async () => {
    if (!formData.type || !formData.duration || !formData.preMood?.state || !formData.postMood?.state) {
      Alert.alert(t('wellnessForms.meditation.error'), t('wellnessForms.meditation.errorMessage'));
      return;
    }

    try {
      setSaving(true);
      const meditationData: MeditationData = {
        id: Date.now().toString(),
        date: formData.date!,
        type: formData.type as any,
        duration: formData.duration!,
        effectiveness: formData.effectiveness!,
        techniques: formData.techniques!,
        preMood: formData.preMood!,
        postMood: formData.postMood!,
        notes: formData.notes
      };

      await WellnessIntegrationService.saveMeditationData(meditationData);
      Alert.alert(t('wellnessForms.meditation.success'), t('wellnessForms.meditation.successMessage'));
      if (onSave) {
        onSave();
      }
    } catch (error) {
      Alert.alert(t('wellnessForms.meditation.error'), t('wellnessForms.meditation.errorMessage'));
    } finally {
      setSaving(false);
    }
  };

  const addTechnique = (technique?: string) => {
    const techniqueToAdd = technique || newTechnique.trim();
    if (techniqueToAdd && !formData.techniques?.includes(techniqueToAdd)) {
      setFormData(prev => ({
        ...prev,
        techniques: [...(prev.techniques || []), techniqueToAdd]
      }));
      if (!technique) setNewTechnique('');
    }
  };

  const removeTechnique = (index: number) => {
    setFormData(prev => ({
      ...prev,
      techniques: prev.techniques?.filter((_, i) => i !== index) || []
    }));
  };

  const setMoodState = (type: 'pre' | 'post', state: string) => {
    if (type === 'pre') {
      setFormData(prev => ({
        ...prev,
        preMood: { ...prev.preMood!, state }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        postMood: { ...prev.postMood!, state }
      }));
    }
  };

  const renderStarRating = (value: number, onPress: (rating: number) => void) => (
    <View style={styles.starContainer}>
      {[1, 2, 3, 4, 5].map((star) => (
        <TouchableOpacity key={star} onPress={() => onPress(star)}>
          <Star
            size={28}
            color={star <= value ? currentTheme.colors.warning : currentTheme.colors.border}
            fill={star <= value ? currentTheme.colors.warning : 'transparent'}
          />
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderIntensitySelector = (value: number, onPress: (intensity: number) => void) => (
    <View style={styles.intensityContainer}>
      <Text style={styles.intensityValue}>{value}/10</Text>
      <View style={styles.intensityButtons}>
        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
          <TouchableOpacity
            key={num}
            style={[
              styles.intensityButton,
              value === num && styles.selectedIntensityButton
            ]}
            onPress={() => onPress(num)}
          >
            <Text style={[
              styles.intensityButtonText,
              value === num && styles.selectedIntensityButtonText
            ]}>
              {num}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  return (
    <ScrollView style={styles.container}>
      {/* Enhanced Header */}
      <View style={styles.header}>
        <View style={styles.headerIcon}>
          <Brain size={28} color={currentTheme.colors.primary} />
        </View>
        <View style={styles.headerContent}>
          <Text style={styles.title}>{t('wellnessForms.meditation.title')}</Text>
          <Text style={styles.subtitle}>{t('wellnessForms.meditation.subtitle')}</Text>
        </View>
      </View>

      {/* Date Card */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>{t('wellnessForms.meditation.sessionDate')}</Text>
        <TextInput
          style={styles.dateInput}
          value={formData.date}
          onChangeText={(text) => setFormData(prev => ({ ...prev, date: text }))}
          placeholder="YYYY-MM-DD"
          placeholderTextColor={currentTheme.colors.textSecondary}
        />
      </View>

      {/* Meditation Type Card */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>{t('wellnessForms.meditation.meditationType')} *</Text>
        <View style={styles.typeGrid}>
          {meditationTypes.map((type) => (
            <TouchableOpacity
              key={type.value}
              style={[
                styles.typeCard,
                formData.type === type.value && styles.selectedTypeCard
              ]}
              onPress={() => setFormData(prev => ({ ...prev, type: type.value as any }))}
            >
              <Text style={styles.typeIcon}>{type.icon}</Text>
              <Text style={[
                styles.typeLabel,
                formData.type === type.value && styles.selectedTypeLabel
              ]}>
                {type.label}
              </Text>
              <Text style={styles.typeDescription}>{type.description}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Duration Card */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>{t('wellnessForms.meditation.duration')} *</Text>
        <View style={styles.durationSection}>
          <View style={styles.durationDisplay}>
            <Timer size={24} color={currentTheme.colors.primary} />
            <Text style={styles.durationValue}>{formData.duration}</Text>
            <Text style={styles.durationUnit}>{t('wellnessForms.meditation.minutes')}</Text>
          </View>
          <View style={styles.durationControls}>
            <TouchableOpacity
              style={styles.durationButton}
              onPress={() => setFormData(prev => ({ ...prev, duration: Math.max(1, (prev.duration || 0) - 5) }))}
            >
              <Text style={styles.durationButtonText}>-5</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.durationButton}
              onPress={() => setFormData(prev => ({ ...prev, duration: Math.max(1, (prev.duration || 0) - 1) }))}
            >
              <Text style={styles.durationButtonText}>-1</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.durationButton}
              onPress={() => setFormData(prev => ({ ...prev, duration: (prev.duration || 0) + 1 }))}
            >
              <Text style={styles.durationButtonText}>+1</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.durationButton}
              onPress={() => setFormData(prev => ({ ...prev, duration: (prev.duration || 0) + 5 }))}
            >
              <Text style={styles.durationButtonText}>+5</Text>
            </TouchableOpacity>
          </View>
        </View>
        <View style={styles.presetContainer}>
          {durationPresets.map((preset) => (
            <TouchableOpacity
              key={preset}
              style={[
                styles.presetButton,
                formData.duration === preset && styles.selectedPreset
              ]}
              onPress={() => setFormData(prev => ({ ...prev, duration: preset }))}
            >
              <Text style={[
                styles.presetText,
                formData.duration === preset && styles.selectedPresetText
              ]}>
                {preset}m
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Pre-Meditation Mood Card */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>{t('wellnessForms.meditation.preMeditationMood')} *</Text>
        <View style={styles.moodSection}>
          <View style={styles.moodStateContainer}>
            <Text style={styles.fieldLabel}>{t('wellnessForms.meditation.howWereYouFeeling')}</Text>
            <View style={styles.moodStatesGrid}>
              {moodStates.map((mood) => (
                <TouchableOpacity
                  key={mood}
                  style={[
                    styles.moodStateButton,
                    formData.preMood?.state === mood && styles.selectedMoodState
                  ]}
                  onPress={() => setMoodState('pre', mood)}
                >
                  <Text style={[
                    styles.moodStateText,
                    formData.preMood?.state === mood && styles.selectedMoodStateText
                  ]}>
                    {mood}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <TextInput
              style={styles.customMoodInput}
              value={formData.preMood?.state && !moodStates.includes(formData.preMood.state) ? formData.preMood.state : ''}
              onChangeText={(text) => setMoodState('pre', text)}
              placeholder={t('wellnessForms.meditation.describeMood')}
              placeholderTextColor={currentTheme.colors.textSecondary}
            />
          </View>
          <View style={styles.intensitySection}>
            <Text style={styles.fieldLabel}>{t('wellnessForms.meditation.intensity')}</Text>
            {renderIntensitySelector(formData.preMood?.intensity || 5, (intensity) => 
              setFormData(prev => ({
                ...prev,
                preMood: { ...prev.preMood!, intensity }
              }))
            )}
          </View>
        </View>
      </View>

      {/* Post-Meditation Mood Card */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>{t('wellnessForms.meditation.postMeditationMood')} *</Text>
        <View style={styles.moodSection}>
          <View style={styles.moodStateContainer}>
            <Text style={styles.fieldLabel}>{t('wellnessForms.meditation.howDoYouFeelNow')}</Text>
            <View style={styles.moodStatesGrid}>
              {moodStates.map((mood) => (
                <TouchableOpacity
                  key={mood}
                  style={[
                    styles.moodStateButton,
                    formData.postMood?.state === mood && styles.selectedMoodState
                  ]}
                  onPress={() => setMoodState('post', mood)}
                >
                  <Text style={[
                    styles.moodStateText,
                    formData.postMood?.state === mood && styles.selectedMoodStateText
                  ]}>
                    {mood}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <TextInput
              style={styles.customMoodInput}
              value={formData.postMood?.state && !moodStates.includes(formData.postMood.state) ? formData.postMood.state : ''}
              onChangeText={(text) => setMoodState('post', text)}
              placeholder={t('wellnessForms.meditation.describeMood')}
              placeholderTextColor={currentTheme.colors.textSecondary}
            />
          </View>
          <View style={styles.intensitySection}>
            <Text style={styles.fieldLabel}>{t('wellnessForms.meditation.intensity')}</Text>
            {renderIntensitySelector(formData.postMood?.intensity || 5, (intensity) => 
              setFormData(prev => ({
                ...prev,
                postMood: { ...prev.postMood!, intensity }
              }))
            )}
          </View>
        </View>
      </View>

      {/* Effectiveness Card */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>{t('wellnessForms.meditation.sessionEffectiveness')}</Text>
        <Text style={styles.fieldDescription}>{t('wellnessForms.meditation.howEffectiveWasSession')}</Text>
        <View style={styles.effectivenessContainer}>
          {renderStarRating(formData.effectiveness || 3, (rating) => 
            setFormData(prev => ({ ...prev, effectiveness: rating as any }))
          )}
          <Text style={styles.effectivenessText}>
            {formData.effectiveness === 1 ? t('wellnessForms.meditation.effectiveness.poor') :
             formData.effectiveness === 2 ? t('wellnessForms.meditation.effectiveness.fair') :
             formData.effectiveness === 3 ? t('wellnessForms.meditation.effectiveness.good') :
             formData.effectiveness === 4 ? t('wellnessForms.meditation.effectiveness.veryGood') : t('wellnessForms.meditation.effectiveness.excellent')}
          </Text>
        </View>
      </View>

      {/* Techniques Card */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>{t('wellnessForms.meditation.techniquesUsed')}</Text>
        <Text style={styles.fieldDescription}>{t('wellnessForms.meditation.whatTechniquesDidYouPractice')}</Text>
        
        {/* Quick Add Techniques */}
        <View style={styles.quickTechniquesContainer}>
          {commonTechniques.map((technique) => (
            <TouchableOpacity
              key={technique}
              style={[
                styles.quickTechniqueButton,
                formData.techniques?.includes(technique) && styles.selectedQuickTechnique
              ]}
              onPress={() => addTechnique(technique)}
            >
              <Text style={[
                styles.quickTechniqueText,
                formData.techniques?.includes(technique) && styles.selectedQuickTechniqueText
              ]}>
                {technique}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Custom Technique Input */}
        <View style={styles.techniqueInputContainer}>
          <TextInput
            style={[styles.input, { flex: 1 }]}
            value={newTechnique}
            onChangeText={setNewTechnique}
            placeholder={t('wellnessForms.meditation.addCustomTechnique')}
            placeholderTextColor={currentTheme.colors.textSecondary}
          />
          <TouchableOpacity style={styles.addButton} onPress={() => addTechnique()}>
            <Plus size={20} color={currentTheme.colors.primary} />
          </TouchableOpacity>
        </View>

        {/* Selected Techniques */}
        {formData.techniques && formData.techniques.length > 0 && (
          <View style={styles.techniquesList}>
            {formData.techniques.map((technique, index) => (
              <View key={index} style={styles.techniqueTag}>
                <Text style={styles.techniqueText}>{technique}</Text>
                <TouchableOpacity onPress={() => removeTechnique(index)}>
                  <X size={16} color={currentTheme.colors.textSecondary} />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}
      </View>

      {/* Notes Card */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>{t('wellnessForms.meditation.sessionNotes')}</Text>
        <Text style={styles.fieldDescription}>{t('wellnessForms.meditation.anyInsightsOrObservations')}</Text>
        <TextInput
          style={[styles.input, styles.notesInput]}
          value={formData.notes}
          onChangeText={(text) => setFormData(prev => ({ ...prev, notes: text }))}
          placeholder={t('wellnessForms.meditation.notesPlaceholder')}
          placeholderTextColor={currentTheme.colors.textSecondary}
          multiline
          numberOfLines={4}
        />
      </View>

      {/* Action Buttons */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.cancelButton} onPress={onCancel}>
          <Text style={styles.cancelButtonText}>{t('wellnessForms.meditation.cancel')}</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.saveButton, saving && styles.disabledButton]} 
          onPress={handleSave}
          disabled={saving}
        >
          <Text style={styles.saveButtonText}>
            {saving ? t('wellnessForms.meditation.saving') : t('wellnessForms.meditation.save')}
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
  headerContent: {
    flex: 1,
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
  fieldLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.textSecondary,
    marginBottom: 8,
  },
  fieldDescription: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 16,
    fontStyle: 'italic',
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
    minWidth: '45%',
    backgroundColor: colors.surface,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedTypeCard: {
    borderColor: colors.primary,
    backgroundColor: colors.primary + '20',
  },
  typeIcon: {
    fontSize: 28,
    marginBottom: 8,
  },
  typeLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    textAlign: 'center',
    marginBottom: 4,
  },
  selectedTypeLabel: {
    color: colors.primary,
  },
  typeDescription: {
    fontSize: 11,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  durationSection: {
    alignItems: 'center',
    gap: 16,
  },
  durationDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  durationValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: colors.text,
    minWidth: 60,
    textAlign: 'center',
  },
  durationUnit: {
    fontSize: 16,
    color: colors.textSecondary,
  },
  durationControls: {
    flexDirection: 'row',
    gap: 12,
  },
  durationButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    minWidth: 44,
    alignItems: 'center',
  },
  durationButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 14,
  },
  presetContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'center',
    marginTop: 16,
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
  moodSection: {
    gap: 20,
  },
  moodStateContainer: {
    gap: 12,
  },
  moodStatesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  moodStateButton: {
    backgroundColor: colors.surface,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  selectedMoodState: {
    backgroundColor: colors.primary + '20',
    borderColor: colors.primary,
  },
  moodStateText: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  selectedMoodStateText: {
    color: colors.primary,
    fontWeight: 'bold',
  },
  customMoodInput: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 12,
    fontSize: 14,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.border,
  },
  intensitySection: {
    alignItems: 'center',
  },
  intensityContainer: {
    alignItems: 'center',
    gap: 12,
  },
  intensityValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.primary,
  },
  intensityButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'center',
  },
  intensityButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  selectedIntensityButton: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  intensityButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.text,
  },
  selectedIntensityButtonText: {
    color: 'white',
  },
  effectivenessContainer: {
    alignItems: 'center',
    gap: 12,
  },
  starContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  effectivenessText: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.primary,
  },
  quickTechniquesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  quickTechniqueButton: {
    backgroundColor: colors.surface,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  selectedQuickTechnique: {
    backgroundColor: colors.primary + '20',
    borderColor: colors.primary,
  },
  quickTechniqueText: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  selectedQuickTechniqueText: {
    color: colors.primary,
    fontWeight: 'bold',
  },
  techniqueInputContainer: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
    marginBottom: 16,
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
  addButton: {
    backgroundColor: colors.surface,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  techniquesList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  techniqueTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary + '20',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 8,
  },
  techniqueText: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '500',
  },
  notesInput: {
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