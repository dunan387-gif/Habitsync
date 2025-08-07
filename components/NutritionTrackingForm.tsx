import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert } from 'react-native';
import { useTheme } from '@/context/ThemeContext';
import { useLanguage } from '@/context/LanguageContext';
import { WellnessIntegrationService, NutritionData } from '@/services/WellnessIntegrationService';
import { Heart, Plus, Minus, Droplets, Utensils, Clock, Zap } from 'lucide-react-native';

interface NutritionTrackingFormProps {
  onSave?: () => void;
  onCancel?: () => void;
}

export default function NutritionTrackingForm({ onSave, onCancel }: NutritionTrackingFormProps) {
  const { currentTheme } = useTheme();
  const { t } = useLanguage();
  const [formData, setFormData] = useState<Partial<NutritionData>>({
    date: new Date().toISOString().split('T')[0],
    meals: [],
    waterIntake: 0,
    supplements: [],
    notes: ''
  });
  const [loading, setLoading] = useState(false);

  const styles = createStyles(currentTheme.colors);

  const mealTypes = [
    { value: 'breakfast', label: t('wellnessForms.nutrition.mealTypes.breakfast'), icon: '🌅', color: '#FF9500' },
    { value: 'lunch', label: t('wellnessForms.nutrition.mealTypes.lunch'), icon: '☀️', color: '#34C759' },
    { value: 'dinner', label: t('wellnessForms.nutrition.mealTypes.dinner'), icon: '🌙', color: '#5856D6' },
    { value: 'snack', label: t('wellnessForms.nutrition.mealTypes.snack'), icon: '🍎', color: '#FF3B30' }
  ];

  const moodImpacts = [
    { value: 'positive', label: t('wellnessForms.nutrition.moodImpacts.positive'), icon: '😊', color: '#34C759' },
    { value: 'neutral', label: t('wellnessForms.nutrition.moodImpacts.neutral'), icon: '😐', color: '#FF9500' },
    { value: 'negative', label: t('wellnessForms.nutrition.moodImpacts.negative'), icon: '😞', color: '#FF3B30' }
  ];

  const waterPresets = [
    { amount: 250, label: t('wellnessForms.nutrition.waterPresets.glass'), icon: '🥛' },
    { amount: 500, label: t('wellnessForms.nutrition.waterPresets.bottle'), icon: '🍼' },
    { amount: 750, label: t('wellnessForms.nutrition.waterPresets.large'), icon: '🧴' },
    { amount: 1000, label: t('wellnessForms.nutrition.waterPresets.liter'), icon: '💧' }
  ];

  const addMeal = () => {
    const newMeal = {
      type: 'breakfast' as const,
      foods: [''],
      calories: undefined,
      mood_impact: 'neutral' as const,
      time: new Date().toTimeString().slice(0, 5)
    };
    setFormData({
      ...formData,
      meals: [...(formData.meals || []), newMeal]
    });
  };

  const removeMeal = (index: number) => {
    const updatedMeals = formData.meals?.filter((_, i) => i !== index) || [];
    setFormData({ ...formData, meals: updatedMeals });
  };

  const updateMeal = (index: number, field: string, value: any) => {
    const updatedMeals = [...(formData.meals || [])];
    updatedMeals[index] = { ...updatedMeals[index], [field]: value };
    setFormData({ ...formData, meals: updatedMeals });
  };

  const addFoodToMeal = (mealIndex: number) => {
    const updatedMeals = [...(formData.meals || [])];
    updatedMeals[mealIndex].foods.push('');
    setFormData({ ...formData, meals: updatedMeals });
  };

  const removeFoodFromMeal = (mealIndex: number, foodIndex: number) => {
    const updatedMeals = [...(formData.meals || [])];
    updatedMeals[mealIndex].foods = updatedMeals[mealIndex].foods.filter((_, i) => i !== foodIndex);
    setFormData({ ...formData, meals: updatedMeals });
  };

  const updateFood = (mealIndex: number, foodIndex: number, value: string) => {
    const updatedMeals = [...(formData.meals || [])];
    updatedMeals[mealIndex].foods[foodIndex] = value;
    setFormData({ ...formData, meals: updatedMeals });
  };

  const addWater = (amount: number) => {
    setFormData({
      ...formData,
      waterIntake: (formData.waterIntake || 0) + amount
    });
  };

  const subtractWater = (amount: number) => {
    const currentIntake = formData.waterIntake || 0;
    setFormData({
      ...formData,
      waterIntake: Math.max(0, currentIntake - amount)
    });
  };

  const resetWater = () => {
    setFormData({ ...formData, waterIntake: 0 });
  };

  const setCustomWater = (amount: string) => {
    const numAmount = parseInt(amount) || 0;
    setFormData({ ...formData, waterIntake: Math.max(0, numAmount) });
  };

  const addSupplement = () => {
    setFormData({
      ...formData,
      supplements: [...(formData.supplements || []), '']
    });
  };

  const removeSupplement = (index: number) => {
    const updatedSupplements = formData.supplements?.filter((_, i) => i !== index) || [];
    setFormData({ ...formData, supplements: updatedSupplements });
  };

  const updateSupplement = (index: number, value: string) => {
    const updatedSupplements = [...(formData.supplements || [])];
    updatedSupplements[index] = value;
    setFormData({ ...formData, supplements: updatedSupplements });
  };

  const handleSave = async () => {
    if (!formData.meals || formData.meals.length === 0) {
      Alert.alert(t('wellnessForms.nutrition.missingInfo'), t('wellnessForms.nutrition.missingInfoMessage'));
      return;
    }

    try {
      setLoading(true);
      const nutritionData: NutritionData = {
        id: Date.now().toString(),
        date: formData.date!,
        meals: formData.meals!,
        waterIntake: formData.waterIntake!,
        supplements: formData.supplements!,
        notes: formData.notes
      };

      await WellnessIntegrationService.saveNutritionData(nutritionData);
      Alert.alert(t('wellnessForms.nutrition.success'), t('wellnessForms.nutrition.successMessage'));
      if (onSave) {
        onSave();
      }
    } catch (error) {
      Alert.alert(t('wellnessForms.nutrition.error'), t('wellnessForms.nutrition.errorMessage'));
    } finally {
      setLoading(false);
    }
  };

  const renderMeal = (meal: any, index: number) => {
    const mealType = mealTypes.find(type => type.value === meal.type) || mealTypes[0];
    
    return (
      <View key={index} style={[styles.mealCard, { borderLeftColor: mealType.color, borderLeftWidth: 4 }]}>
        <View style={styles.mealHeader}>
          <View style={styles.mealTitleContainer}>
            <Text style={styles.mealIcon}>{mealType.icon}</Text>
            <Text style={styles.mealTitle}>{mealType.label} #{index + 1}</Text>
          </View>
          <TouchableOpacity onPress={() => removeMeal(index)} style={styles.removeButton}>
            <Minus size={18} color={currentTheme.colors.error} />
          </TouchableOpacity>
        </View>

        {/* Meal Type Selection */}
        <View style={styles.section}>
          <Text style={styles.subLabel}>{t('wellnessForms.nutrition.mealType')}</Text>
          <View style={styles.mealTypeGrid}>
            {mealTypes.map((type) => (
              <TouchableOpacity
                key={type.value}
                style={[
                  styles.mealTypeCard,
                  meal.type === type.value && { backgroundColor: type.color + '20', borderColor: type.color }
                ]}
                onPress={() => updateMeal(index, 'type', type.value)}
              >
                <Text style={styles.mealTypeIcon}>{type.icon}</Text>
                <Text style={[
                  styles.mealTypeText,
                  meal.type === type.value && { color: type.color, fontWeight: 'bold' }
                ]}>
                  {type.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Time and Calories Row */}
        <View style={styles.mealRow}>
          <View style={styles.timeSection}>
            <Text style={styles.subLabel}>🕐 {t('wellnessForms.nutrition.time')}</Text>
            <View style={styles.timeInputContainer}>
              <Clock size={16} color={currentTheme.colors.textSecondary} />
              <TextInput
                style={styles.timeInput}
                value={meal.time}
                onChangeText={(text) => updateMeal(index, 'time', text)}
                placeholder="12:00"
                placeholderTextColor={currentTheme.colors.textSecondary}
              />
            </View>
          </View>
          <View style={styles.caloriesSection}>
            <Text style={styles.subLabel}>🔥 {t('wellnessForms.nutrition.calories')}</Text>
            <View style={styles.caloriesInputContainer}>
              <Zap size={16} color={currentTheme.colors.textSecondary} />
              <TextInput
                style={styles.caloriesInput}
                value={meal.calories?.toString()}
                onChangeText={(text) => updateMeal(index, 'calories', parseInt(text) || undefined)}
                placeholder="500"
                placeholderTextColor={currentTheme.colors.textSecondary}
                keyboardType="numeric"
              />
            </View>
          </View>
        </View>

        {/* Foods Section */}
        <View style={styles.section}>
          <Text style={styles.subLabel}>🍽️ {t('wellnessForms.nutrition.foods')}</Text>
          {meal.foods.map((food: string, foodIndex: number) => (
            <View key={foodIndex} style={styles.foodRow}>
              <View style={styles.foodInputContainer}>
                <Utensils size={16} color={currentTheme.colors.textSecondary} />
                <TextInput
                  style={styles.foodInput}
                  value={food}
                  onChangeText={(text) => updateFood(index, foodIndex, text)}
                  placeholder={t('wellnessForms.nutrition.foodPlaceholder')}
                  placeholderTextColor={currentTheme.colors.textSecondary}
                />
              </View>
              {meal.foods.length > 1 && (
                <TouchableOpacity onPress={() => removeFoodFromMeal(index, foodIndex)} style={styles.removeButton}>
                  <Minus size={16} color={currentTheme.colors.error} />
                </TouchableOpacity>
              )}
            </View>
          ))}
          <TouchableOpacity onPress={() => addFoodToMeal(index)} style={styles.addFoodButton}>
            <Plus size={16} color={currentTheme.colors.primary} />
            <Text style={styles.addFoodText}>{t('wellnessForms.nutrition.addAnotherFood')}</Text>
          </TouchableOpacity>
        </View>

        {/* Mood Impact */}
        <View style={styles.section}>
          <Text style={styles.subLabel}>💭 {t('wellnessForms.nutrition.moodImpact')}</Text>
          <View style={styles.moodImpactGrid}>
            {moodImpacts.map((impact) => (
              <TouchableOpacity
                key={impact.value}
                style={[
                  styles.moodImpactCard,
                  meal.mood_impact === impact.value && {
                    backgroundColor: impact.color + '20',
                    borderColor: impact.color
                  }
                ]}
                onPress={() => updateMeal(index, 'mood_impact', impact.value)}
              >
                <Text style={styles.moodIcon}>{impact.icon}</Text>
                <Text style={[
                  styles.moodImpactText,
                  meal.mood_impact === impact.value && { color: impact.color, fontWeight: 'bold' }
                ]}>
                  {impact.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>
    );
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerIcon}>
          <Utensils size={28} color={currentTheme.colors.primary} />
        </View>
        <View>
          <Text style={styles.title}>{t('wellnessForms.nutrition.title')}</Text>
          <Text style={styles.subtitle}>{t('wellnessForms.nutrition.subtitle')}</Text>
        </View>
      </View>

      {/* Date Section */}
      <View style={styles.dateCard}>
        <Text style={styles.dateLabel}>📅 {t('wellnessForms.nutrition.date')}</Text>
        <TextInput
          style={styles.dateInput}
          value={formData.date}
          onChangeText={(text) => setFormData({ ...formData, date: text })}
          placeholder="YYYY-MM-DD"
          placeholderTextColor={currentTheme.colors.textSecondary}
        />
      </View>

      {/* Enhanced Water Intake Section */}
      <View style={styles.waterCard}>
        <View style={styles.waterHeader}>
          <View style={styles.waterTitleContainer}>
            <Text style={styles.waterIcon}>💧</Text>
            <View>
              <Text style={styles.waterTitle}>{t('wellnessForms.nutrition.waterIntake')}</Text>
              <Text style={styles.waterSubtitle}>{t('wellnessForms.nutrition.waterSubtitle')}</Text>
            </View>
          </View>
          <View style={styles.waterAmountContainer}>
            <Text style={styles.waterAmount}>{formData.waterIntake || 0}</Text>
            <Text style={styles.waterUnit}>{t('wellnessForms.nutrition.ml')}</Text>
          </View>
        </View>

        {/* Quick Add Buttons */}
        <View style={styles.waterQuickAdd}>
          <Text style={styles.waterSectionLabel}>{t('wellnessForms.nutrition.quickAdd')}</Text>
          <View style={styles.waterPresets}>
            {waterPresets.map((preset) => (
              <TouchableOpacity
                key={preset.amount}
                style={styles.waterPresetButton}
                onPress={() => addWater(preset.amount)}
              >
                <Text style={styles.waterPresetIcon}>{preset.icon}</Text>
                <Text style={styles.waterPresetLabel}>{preset.label}</Text>
                <Text style={styles.waterPresetAmount}>+{preset.amount}ml</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Custom Amount Input */}
        <View style={styles.waterCustomSection}>
          <Text style={styles.waterSectionLabel}>{t('wellnessForms.nutrition.customAmount')}</Text>
          <View style={styles.waterCustomControls}>
            <TextInput
              style={styles.waterCustomInput}
              value={(formData.waterIntake || 0).toString()}
              onChangeText={setCustomWater}
              placeholder="0"
              placeholderTextColor={currentTheme.colors.textSecondary}
              keyboardType="numeric"
            />
            <Text style={styles.waterCustomUnit}>{t('wellnessForms.nutrition.ml')}</Text>
          </View>
        </View>

        {/* Quick Subtract Buttons */}
        <View style={styles.waterSubtractSection}>
          <Text style={styles.waterSectionLabel}>{t('wellnessForms.nutrition.remove')}</Text>
          <View style={styles.waterSubtractButtons}>
            {[250, 500].map((amount) => (
              <TouchableOpacity
                key={amount}
                style={styles.waterSubtractButton}
                onPress={() => subtractWater(amount)}
              >
                <Minus size={14} color={currentTheme.colors.error} />
                <Text style={styles.waterSubtractText}>{amount}ml</Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity onPress={resetWater} style={styles.resetWaterButton}>
              <Text style={styles.resetWaterText}>{t('wellnessForms.nutrition.reset')}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Enhanced Progress Bar */}
        <View style={styles.waterProgress}>
          <View style={styles.waterProgressHeader}>
            <Text style={styles.waterProgressLabel}>{t('wellnessForms.nutrition.dailyGoalProgress')}</Text>
            <Text style={styles.waterProgressPercentage}>
              {Math.round((formData.waterIntake || 0) / 2000 * 100)}%
            </Text>
          </View>
          <View style={styles.waterProgressBar}>
            <View 
              style={[
                styles.waterProgressFill,
                { 
                  width: `${Math.min((formData.waterIntake || 0) / 2000 * 100, 100)}%`,
                  backgroundColor: (formData.waterIntake || 0) >= 2000 ? '#34C759' : currentTheme.colors.primary
                }
              ]}
            />
          </View>
          <View style={styles.waterProgressLabels}>
            <Text style={styles.waterProgressText}>0ml</Text>
            <Text style={styles.waterProgressText}>1000ml</Text>
            <Text style={styles.waterProgressText}>2000ml</Text>
          </View>
          {(formData.waterIntake || 0) >= 2000 && (
            <View style={styles.waterGoalAchieved}>
              <Text style={styles.waterGoalAchievedText}>{t('wellnessForms.nutrition.dailyGoalAchieved')}</Text>
            </View>
          )}
        </View>

        {/* Hydration Tips */}
        <View style={styles.waterTips}>
          <Text style={styles.waterTipsTitle}>💡 {t('wellnessForms.nutrition.hydrationTips')}</Text>
          <Text style={styles.waterTipsText}>
            {t('wellnessForms.nutrition.hydrationTipsText')}
          </Text>
        </View>
      </View>

      {/* Meals Section */}
      <View style={styles.mealsSection}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>🍽️ {t('wellnessForms.nutrition.meals')}</Text>
          <TouchableOpacity onPress={addMeal} style={styles.addMealButton}>
            <Plus size={20} color="white" />
            <Text style={styles.addMealText}>{t('wellnessForms.nutrition.addMeal')}</Text>
          </TouchableOpacity>
        </View>
        {formData.meals?.map((meal, index) => renderMeal(meal, index))}
        {(!formData.meals || formData.meals.length === 0) && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateIcon}>🍽️</Text>
            <Text style={styles.emptyStateText}>{t('wellnessForms.nutrition.noMealsAdded')}</Text>
            <Text style={styles.emptyStateSubtext}>{t('wellnessForms.nutrition.tapAddMeal')}</Text>
          </View>
        )}
      </View>

      {/* Supplements Section */}
      <View style={styles.supplementsCard}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>💊 {t('wellnessForms.nutrition.supplements')}</Text>
          <TouchableOpacity onPress={addSupplement} style={styles.addSupplementButton}>
            <Plus size={16} color={currentTheme.colors.primary} />
            <Text style={styles.addSupplementText}>{t('wellnessForms.nutrition.add')}</Text>
          </TouchableOpacity>
        </View>
        {formData.supplements?.map((supplement, index) => (
          <View key={index} style={styles.supplementRow}>
            <TextInput
              style={styles.supplementInput}
              value={supplement}
              onChangeText={(text) => updateSupplement(index, text)}
              placeholder={t('wellnessForms.nutrition.supplementPlaceholder')}
              placeholderTextColor={currentTheme.colors.textSecondary}
            />
            <TouchableOpacity onPress={() => removeSupplement(index)} style={styles.removeButton}>
              <Minus size={16} color={currentTheme.colors.error} />
            </TouchableOpacity>
          </View>
        ))}
      </View>

      {/* Notes Section */}
      <View style={styles.notesCard}>
        <Text style={styles.sectionTitle}>📝 {t('wellnessForms.nutrition.notes')}</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={formData.notes}
          onChangeText={(text) => setFormData({ ...formData, notes: text })}
          placeholder={t('wellnessForms.nutrition.notesPlaceholder')}
          placeholderTextColor={currentTheme.colors.textSecondary}
          multiline
          numberOfLines={4}
        />
      </View>

      {/* Action Buttons */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity onPress={onCancel} style={styles.cancelButton}>
          <Text style={styles.cancelButtonText}>{t('wellnessForms.nutrition.cancel')}</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          onPress={handleSave} 
          style={[styles.saveButton, loading && styles.disabledButton]}
          disabled={loading}
        >
          <Text style={styles.saveButtonText}>
            {loading ? t('wellnessForms.nutrition.saving') : t('wellnessForms.nutrition.save')}
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
    backgroundColor: colors.card,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: 16,
  },
  headerIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary + '20',
    alignItems: 'center',
    justifyContent: 'center',
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
  dateCard: {
    backgroundColor: colors.card,
    margin: 16,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  dateLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  dateInput: {
    backgroundColor: colors.surface,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.border,
  },
  waterCard: {
    backgroundColor: colors.card,
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  waterHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  waterTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  waterIcon: {
    fontSize: 24,
  },
  waterTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
  },
  waterSubtitle: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  waterAmountContainer: {
    alignItems: 'center',
    backgroundColor: colors.primary + '15',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
  },
  waterAmount: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.primary,
  },
  waterUnit: {
    fontSize: 12,
    color: colors.primary,
    fontWeight: '600',
  },
  waterQuickAdd: {
    marginBottom: 20,
  },
  waterSectionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  waterPresets: {
    flexDirection: 'row',
    gap: 8,
  },
  waterPresetButton: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: colors.surface,
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 4,
  },
  waterPresetIcon: {
    fontSize: 20,
  },
  waterPresetLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.text,
  },
  waterPresetAmount: {
    fontSize: 10,
    color: colors.primary,
    fontWeight: '500',
  },
  waterCustomSection: {
    marginBottom: 20,
  },
  waterCustomControls: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 8,
  },
  waterCustomInput: {
    flex: 1,
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    textAlign: 'center',
  },
  waterCustomUnit: {
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  waterSubtractSection: {
    marginBottom: 20,
  },
  waterSubtractButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  waterSubtractButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.error + '15',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 4,
  },
  waterSubtractText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.error,
  },
  resetWaterButton: {
    backgroundColor: colors.surface,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  resetWaterText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  waterProgress: {
    marginBottom: 16,
  },
  waterProgressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  waterProgressLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  waterProgressPercentage: {
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.primary,
  },
  waterProgressBar: {
    width: '100%',
    height: 12,
    backgroundColor: colors.surface,
    borderRadius: 6,
    overflow: 'hidden',
    marginBottom: 8,
  },
  waterProgressFill: {
    height: '100%',
    borderRadius: 6,
  },
  waterProgressLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  waterProgressText: {
    fontSize: 10,
    color: colors.textSecondary,
  },
  waterGoalAchieved: {
    alignItems: 'center',
    marginTop: 8,
    backgroundColor: '#34C759' + '15',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  waterGoalAchievedText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#34C759',
  },
  waterTips: {
    backgroundColor: colors.surface,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  waterTipsTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  waterTipsText: {
    fontSize: 11,
    color: colors.textSecondary,
    lineHeight: 16,
  },


  mealsSection: {
    marginHorizontal: 16,
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
  },
  addMealButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 4,
  },
  addMealText: {
    fontSize: 14,
    fontWeight: '600',
    color: 'white',
  },
  mealCard: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  mealHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  mealTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  mealIcon: {
    fontSize: 20,
  },
  mealTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
  },
  section: {
    marginBottom: 16,
  },
  subLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  mealTypeGrid: {
    flexDirection: 'row',
    gap: 8,
  },
  mealTypeCard: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: colors.surface,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 4,
  },
  mealTypeIcon: {
    fontSize: 16,
  },
  mealTypeText: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.textSecondary,
  },
  mealRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  timeSection: {
    flex: 1,
  },
  timeInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 8,
  },
  timeInput: {
    flex: 1,
    fontSize: 14,
    color: colors.text,
  },
  caloriesSection: {
    flex: 1,
  },
  caloriesInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 8,
  },
  caloriesInput: {
    flex: 1,
    fontSize: 14,
    color: colors.text,
  },
  foodRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  foodInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 8,
  },
  foodInput: {
    flex: 1,
    fontSize: 14,
    color: colors.text,
  },
  addFoodButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 8,
  },
  addFoodText: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '500',
  },
  moodImpactGrid: {
    flexDirection: 'row',
    gap: 8,
  },
  moodImpactCard: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: colors.surface,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 4,
  },
  moodIcon: {
    fontSize: 16,
  },
  moodImpactText: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.textSecondary,
  },
  emptyState: {
    alignItems: 'center',
    padding: 32,
    backgroundColor: colors.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    borderStyle: 'dashed',
  },
  emptyStateIcon: {
    fontSize: 48,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: 4,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  supplementsCard: {
    backgroundColor: colors.card,
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  addSupplementButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary + '20',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    gap: 4,
  },
  addSupplementText: {
    fontSize: 12,
    color: colors.primary,
    fontWeight: '600',
  },
  supplementRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  supplementInput: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.border,
  },
  notesCard: {
    backgroundColor: colors.card,
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  input: {
    backgroundColor: colors.surface,
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.border,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  removeButton: {
    backgroundColor: colors.error + '20',
    padding: 8,
    borderRadius: 6,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
    margin: 16,
    marginBottom: 32,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: colors.card,
    padding: 16,
    borderRadius: 8,
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
    borderRadius: 8,
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