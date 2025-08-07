import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert } from 'react-native';
import { useTheme } from '@/context/ThemeContext';
import { useLanguage } from '@/context/LanguageContext';
import { WellnessIntegrationService, SocialActivityData } from '@/services/WellnessIntegrationService';
import { Users, Clock, Star, MapPin, Heart, Zap } from 'lucide-react-native';

interface SocialActivityTrackingFormProps {
  onSave?: () => void;
  onCancel?: () => void;
}

export default function SocialActivityTrackingForm({ onSave, onCancel }: SocialActivityTrackingFormProps) {
  const { currentTheme } = useTheme();
  const { currentLanguage, t } = useLanguage();
  const [saving, setSaving] = useState(false);
  
  const [formData, setFormData] = useState<SocialActivityData>({
    id: '', // Add the missing id field
    date: new Date().toISOString().split('T')[0],
    type: 'friends', // Default to 'friends' instead of undefined
    duration: 60,
    participants: 2,
    setting: 'home', // Default to 'home' instead of undefined
    satisfaction: 4,
    energyLevel: 'neutral', // Default to 'neutral' instead of undefined
    preMood: { state: '', intensity: 5 },
    postMood: { state: '', intensity: 5 },
    notes: ''
  });

  const activityTypes = [
    { value: 'family_time', label: t('wellnessForms.social.activityTypes.familyTime'), icon: '👨‍👩‍👧‍👦' },
    { value: 'friends_hangout', label: t('wellnessForms.social.activityTypes.friends'), icon: '👥' },
    { value: 'date_night', label: t('wellnessForms.social.activityTypes.dateNight'), icon: '💕' },
    { value: 'party', label: t('wellnessForms.social.activityTypes.party'), icon: '🎉' },
    { value: 'networking', label: t('wellnessForms.social.activityTypes.networking'), icon: '🤝' },
    { value: 'team_building', label: t('wellnessForms.social.activityTypes.teamBuilding'), icon: '⚽' },
    { value: 'community_event', label: t('wellnessForms.social.activityTypes.community'), icon: '🏘️' },
    { value: 'volunteer_work', label: t('wellnessForms.social.activityTypes.volunteer'), icon: '🤲' },
    { value: 'group_hobby', label: t('wellnessForms.social.activityTypes.groupHobby'), icon: '🎨' }
  ];

  const settings = [
    { value: 'home', label: t('wellnessForms.social.settings.home'), icon: '🏠' },
    { value: 'restaurant', label: t('wellnessForms.social.settings.restaurant'), icon: '🍽️' },
    { value: 'park', label: t('wellnessForms.social.settings.park'), icon: '🌳' },
    { value: 'cafe', label: t('wellnessForms.social.settings.cafe'), icon: '☕' },
    { value: 'gym', label: t('wellnessForms.social.settings.gym'), icon: '💪' },
    { value: 'office', label: t('wellnessForms.social.settings.office'), icon: '🏢' },
    { value: 'outdoors', label: t('wellnessForms.social.settings.outdoors'), icon: '🌲' },
    { value: 'online', label: t('wellnessForms.social.settings.online'), icon: '💻' }
  ];

  const energyLevels = [
    { value: 'drained', label: t('wellnessForms.social.energyLevels.drained'), color: '#ef4444' },
    { value: 'tired', label: t('wellnessForms.social.energyLevels.tired'), color: '#f97316' },
    { value: 'neutral', label: t('wellnessForms.social.energyLevels.neutral'), color: '#eab308' },
    { value: 'energized', label: t('wellnessForms.social.energyLevels.energized'), color: '#22c55e' },
    { value: 'pumped', label: t('wellnessForms.social.energyLevels.pumped'), color: '#3b82f6' }
  ];

  // Duration presets
  const durationPresets = [30, 60, 90, 120, 180];
  
  // Participant presets
  const participantPresets = [1, 2, 3, 5, 10];

  // Common mood states
  const commonMoods = [
  t('moodCheckIn.moodTags.happy'), t('moodCheckIn.moodTags.excited'), t('moodCheckIn.moodTags.calm'), 
  t('moodCheckIn.moodTags.anxious'), t('moodCheckIn.moodTags.tired'), t('moodCheckIn.moodTags.energetic'),
  t('moodCheckIn.moodTags.stressed'), t('moodCheckIn.moodTags.relaxed'), t('moodCheckIn.moodTags.confident'), 
  t('moodCheckIn.moodTags.nervous'), t('moodCheckIn.moodTags.content'), t('moodCheckIn.moodTags.overwhelmed')
];

  const handleSave = async () => {
    if (!formData.type || !formData.setting || !formData.date) {
      Alert.alert(t('wellnessForms.social.missingInfo'), t('wellnessForms.social.missingInfoMessage'));
      return;
    }

    setSaving(true);
    try {
      await WellnessIntegrationService.saveSocialActivityData(formData);
      Alert.alert(t('wellnessForms.social.success'), t('wellnessForms.social.successMessage'));
      onSave?.();
    } catch (error) {
      Alert.alert(t('wellnessForms.social.error'), t('wellnessForms.social.errorMessage'));
    } finally {
      setSaving(false);
    }
  };

  const renderStarRating = (value: number, onPress: (rating: number) => void) => (
    <View style={styles.starContainer}>
      {[1, 2, 3, 4, 5].map((star) => (
        <TouchableOpacity key={star} onPress={() => onPress(star)}>
          <Star
            size={32}
            color={currentTheme.colors.warning}
            fill={star <= value ? currentTheme.colors.warning : 'transparent'}
          />
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderMoodQuickSelect = (currentMood: string, onSelect: (mood: string) => void) => (
    <View style={styles.moodQuickSelect}>
      {commonMoods.map((mood) => (
        <TouchableOpacity
          key={mood}
          style={[
            styles.moodButton,
            currentMood === mood && styles.selectedMoodButton
          ]}
          onPress={() => onSelect(mood)}
        >
          <Text style={[
            styles.moodButtonText,
            currentMood === mood && styles.selectedMoodButtonText
          ]}>
            {mood}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  const styles = createStyles(currentTheme.colors);

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerIcon}>
          <Users size={28} color={currentTheme.colors.primary} />
        </View>
        <View>
          <Text style={styles.title}>{t('wellnessForms.social.title')}</Text>
          <Text style={styles.subtitle}>{t('wellnessForms.social.subtitle')}</Text>
        </View>
      </View>

      {/* Date Card */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Clock size={20} color={currentTheme.colors.primary} />
          <Text style={styles.cardTitle}>{t('wellnessForms.social.when')}</Text>
        </View>
        <TextInput
          style={styles.input}
          value={formData.date}
          onChangeText={(text) => setFormData(prev => ({ ...prev, date: text }))}
          placeholder="YYYY-MM-DD"
          placeholderTextColor={currentTheme.colors.textSecondary}
        />
      </View>

      {/* Activity Type Card */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Heart size={20} color={currentTheme.colors.primary} />
          <Text style={styles.cardTitle}>{t('wellnessForms.social.activityType')} *</Text>
        </View>
        <View style={styles.typeGrid}>
          {activityTypes.map((type) => (
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
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Duration & Participants Card */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Clock size={20} color={currentTheme.colors.primary} />
          <Text style={styles.cardTitle}>{t('wellnessForms.social.durationAndPeople')}</Text>
        </View>
        
        {/* Duration Section */}
        <View style={styles.section}>
          <Text style={styles.label}>{t('wellnessForms.social.duration')} *</Text>
          <View style={styles.presetContainer}>
            {durationPresets.map((preset) => (
              <TouchableOpacity
                key={preset}
                style={[
                  styles.presetButton,
                  formData.duration === preset && styles.selectedPresetButton
                ]}
                onPress={() => setFormData(prev => ({ ...prev, duration: preset }))}
              >
                <Text style={[
                  styles.presetButtonText,
                  formData.duration === preset && styles.selectedPresetButtonText
                ]}>
                  {preset}m
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <View style={styles.durationContainer}>
            <TouchableOpacity
              style={styles.durationButton}
              onPress={() => setFormData(prev => ({ ...prev, duration: Math.max(15, (prev.duration || 0) - 15) }))}
            >
              <Text style={styles.durationButtonText}>-15</Text>
            </TouchableOpacity>
            <Text style={styles.durationText}>{formData.duration}</Text>
            <TouchableOpacity
              style={styles.durationButton}
              onPress={() => setFormData(prev => ({ ...prev, duration: (prev.duration || 0) + 15 }))}
            >
              <Text style={styles.durationButtonText}>+15</Text>
            </TouchableOpacity>
          </View>
        </View>
        
        {/* Participants Section */}
        <View style={styles.section}>
          <Text style={styles.label}>{t('wellnessForms.social.numberOfParticipants')} *</Text>
          <View style={styles.presetContainer}>
            {participantPresets.map((preset) => (
              <TouchableOpacity
                key={preset}
                style={[
                  styles.presetButton,
                  formData.participants === preset && styles.selectedPresetButton
                ]}
                onPress={() => setFormData(prev => ({ ...prev, participants: preset }))}
              >
                <Text style={[
                  styles.presetButtonText,
                  formData.participants === preset && styles.selectedPresetButtonText
                ]}>
                  {preset}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <View style={styles.participantsContainer}>
            <TouchableOpacity
              style={styles.durationButton}
              onPress={() => setFormData(prev => ({ ...prev, participants: Math.max(1, (prev.participants || 0) - 1) }))}
            >
              <Text style={styles.durationButtonText}>-1</Text>
            </TouchableOpacity>
            <Text style={styles.durationText}>{formData.participants}</Text>
            <TouchableOpacity
              style={styles.durationButton}
              onPress={() => setFormData(prev => ({ ...prev, participants: (prev.participants || 0) + 1 }))}
            >
              <Text style={styles.durationButtonText}>+1</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Setting Card */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <MapPin size={20} color={currentTheme.colors.primary} />
          <Text style={styles.cardTitle}>{t('wellnessForms.social.setting')} *</Text>
        </View>
        <View style={styles.typeGrid}>
          {settings.map((setting) => (
            <TouchableOpacity
              key={setting.value}
              style={[
                styles.typeCard,
                formData.setting === setting.value && styles.selectedTypeCard
              ]}
              onPress={() => setFormData(prev => ({ ...prev, setting: setting.value as any }))}
            >
              <Text style={styles.typeIcon}>{setting.icon}</Text>
              <Text style={[
                styles.typeLabel,
                formData.setting === setting.value && styles.selectedTypeLabel
              ]}>
                {setting.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Pre-Activity Mood Card */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Heart size={20} color={currentTheme.colors.primary} />
          <Text style={styles.cardTitle}>{t('wellnessForms.social.preActivityMood')} *</Text>
        </View>
        <TextInput
          style={styles.input}
          value={formData.preMood?.state}
          onChangeText={(text) => setFormData(prev => ({
            ...prev,
            preMood: { ...prev.preMood!, state: text }
          }))}
          placeholder={t('wellnessForms.social.howWereYouFeelingBefore')}
          placeholderTextColor={currentTheme.colors.textSecondary}
        />
        <Text style={styles.subLabel}>{t('wellnessForms.social.quickSelect')}:</Text>
        {renderMoodQuickSelect(
          formData.preMood?.state || '',
          (mood) => setFormData(prev => ({
            ...prev,
            preMood: { ...prev.preMood!, state: mood }
          }))
        )}
        <Text style={styles.subLabel}>{t('wellnessForms.social.intensity')} (1-10)</Text>
        <View style={styles.sliderContainer}>
          <Text style={styles.sliderValue}>{formData.preMood?.intensity}</Text>
          <View style={styles.sliderButtons}>
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
              <TouchableOpacity
                key={num}
                style={[
                  styles.sliderButton,
                  formData.preMood?.intensity === num && styles.selectedSliderButton
                ]}
                onPress={() => setFormData(prev => ({
                  ...prev,
                  preMood: { ...prev.preMood!, intensity: num }
                }))}
              >
                <Text style={[
                  styles.sliderButtonText,
                  formData.preMood?.intensity === num && styles.selectedSliderButtonText
                ]}>
                  {num}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>

      {/* Post-Activity Mood Card */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Heart size={20} color={currentTheme.colors.primary} />
          <Text style={styles.cardTitle}>{t('wellnessForms.social.postActivityMood')} *</Text>
        </View>
        <TextInput
          style={styles.input}
          value={formData.postMood?.state}
          onChangeText={(text) => setFormData(prev => ({
            ...prev,
            postMood: { ...prev.postMood!, state: text }
          }))}
          placeholder={t('wellnessForms.social.howDoYouFeelNow')}
          placeholderTextColor={currentTheme.colors.textSecondary}
        />
        <Text style={styles.subLabel}>{t('wellnessForms.social.quickSelect')}:</Text>
        {renderMoodQuickSelect(
          formData.postMood?.state || '',
          (mood) => setFormData(prev => ({
            ...prev,
            postMood: { ...prev.postMood!, state: mood }
          }))
        )}
        <Text style={styles.subLabel}>{t('wellnessForms.social.intensity')} (1-10)</Text>
        <View style={styles.sliderContainer}>
          <Text style={styles.sliderValue}>{formData.postMood?.intensity}</Text>
          <View style={styles.sliderButtons}>
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
              <TouchableOpacity
                key={num}
                style={[
                  styles.sliderButton,
                  formData.postMood?.intensity === num && styles.selectedSliderButton
                ]}
                onPress={() => setFormData(prev => ({
                  ...prev,
                  postMood: { ...prev.postMood!, intensity: num }
                }))}
              >
                <Text style={[
                  styles.sliderButtonText,
                  formData.postMood?.intensity === num && styles.selectedSliderButtonText
                ]}>
                  {num}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>

      {/* Satisfaction Card */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Star size={20} color={currentTheme.colors.primary} />
          <Text style={styles.cardTitle}>{t('wellnessForms.social.satisfactionLevel')}</Text>
        </View>
        <View style={styles.ratingContainer}>
          {renderStarRating(formData.satisfaction || 4, (rating) => 
            setFormData(prev => ({ ...prev, satisfaction: rating as any }))
          )}
          <Text style={styles.ratingText}>
            {formData.satisfaction === 1 ? t('wellnessForms.social.satisfaction.poor') :
             formData.satisfaction === 2 ? t('wellnessForms.social.satisfaction.fair') :
             formData.satisfaction === 3 ? t('wellnessForms.social.satisfaction.good') :
             formData.satisfaction === 4 ? t('wellnessForms.social.satisfaction.veryGood') : t('wellnessForms.social.satisfaction.excellent')}
          </Text>
        </View>
      </View>

      {/* Energy Level Card */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Zap size={20} color={currentTheme.colors.primary} />
          <Text style={styles.cardTitle}>{t('wellnessForms.social.energyLevelAfter')}</Text>
        </View>
        <View style={styles.energyGridContainer}>
          {/* First row - 3 items */}
          <View style={styles.energyRow}>
            {energyLevels.slice(0, 3).map((level) => (
              <TouchableOpacity
                key={level.value}
                style={[
                  styles.energyGridButton,
                  { borderColor: level.color },
                  formData.energyLevel === level.value && { backgroundColor: level.color + '20' }
                ]}
                onPress={() => setFormData(prev => ({ ...prev, energyLevel: level.value as any }))}
              >
                <Text style={[
                  styles.energyGridText,
                  { color: level.color },
                  formData.energyLevel === level.value && styles.selectedEnergyText
                ]}>
                  {level.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          {/* Second row - 2 items */}
          <View style={styles.energyRow}>
            {energyLevels.slice(3, 5).map((level) => (
              <TouchableOpacity
                key={level.value}
                style={[
                  styles.energyGridButton,
                  styles.energyGridButtonWide,
                  { borderColor: level.color },
                  formData.energyLevel === level.value && { backgroundColor: level.color + '20' }
                ]}
                onPress={() => setFormData(prev => ({ ...prev, energyLevel: level.value as any }))}
              >
                <Text style={[
                  styles.energyGridText,
                  { color: level.color },
                  formData.energyLevel === level.value && styles.selectedEnergyText
                ]}>
                  {level.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>

      {/* Notes Card */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>{t('wellnessForms.social.notes')}</Text>
        <TextInput
          style={[styles.input, styles.notesInput]}
          value={formData.notes}
          onChangeText={(text) => setFormData(prev => ({ ...prev, notes: text }))}
          placeholder={t('wellnessForms.social.notesPlaceholder')}
          placeholderTextColor={currentTheme.colors.textSecondary}
          multiline
          numberOfLines={4}
        />
      </View>

      {/* Action Buttons */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.cancelButton} onPress={onCancel}>
          <Text style={styles.cancelButtonText}>{t('wellnessForms.social.cancel')}</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.saveButton, saving && styles.disabledButton]} 
          onPress={handleSave}
          disabled={saving}
        >
          <Text style={styles.saveButtonText}>
            {saving ? t('wellnessForms.social.saving') : t('wellnessForms.social.save')}
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
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
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
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.text,
  },
  subtitle: {
    fontSize: 16,
    color: colors.textSecondary,
    marginTop: 4,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 12,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },
  section: {
    marginBottom: 16,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 12,
  },
  subLabel: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 12,
    marginBottom: 8,
  },
  input: {
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.border,
  },
  notesInput: {
    height: 100,
    textAlignVertical: 'top',
  },
  typeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  typeCard: {
    flex: 1,
    minWidth: '30%',
    backgroundColor: colors.background,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.border,
  },
  selectedTypeCard: {
    borderColor: colors.primary,
    backgroundColor: colors.primary + '15',
  },
  typeIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  typeLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.text,
    textAlign: 'center',
  },
  selectedTypeLabel: {
    color: colors.primary,
    fontWeight: '700',
  },
  presetContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 12,
  },
  presetButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
  },
  selectedPresetButton: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  presetButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.text,
  },
  selectedPresetButtonText: {
    color: 'white',
  },
  durationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  durationButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  durationButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 14,
  },
  durationText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    minWidth: 50,
    textAlign: 'center',
  },
  participantsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  moodQuickSelect: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  moodButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
  },
  selectedMoodButton: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  moodButtonText: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.text,
  },
  selectedMoodButtonText: {
    color: 'white',
    fontWeight: '600',
  },
  sliderContainer: {
    alignItems: 'center',
  },
  sliderValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: 16,
  },
  sliderButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'center',
  },
  sliderButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  selectedSliderButton: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  sliderButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  selectedSliderButtonText: {
    color: 'white',
  },
  ratingContainer: {
    alignItems: 'center',
    gap: 12,
  },
  ratingText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.primary,
  },
  starContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  energyContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  energyButton: {
    flex: 1,
    padding: 12,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: 'center',
  },
  energyText: {
    fontSize: 12,
    fontWeight: '600',
  },
  selectedEnergyText: {
    fontWeight: 'bold',
  },
  energyGridContainer: {
    gap: 12,
  },
  energyRow: {
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'center',
  },
  energyGridButton: {
    flex: 1,
    padding: 12,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: 'center',
    minHeight: 48,
    justifyContent: 'center',
  },
  energyGridButtonWide: {
    flex: 1.5,
  },
  energyGridText: {
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
    marginBottom: 40,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: colors.card,
    padding: 18,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  saveButton: {
    flex: 1,
    backgroundColor: colors.primary,
    padding: 18,
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