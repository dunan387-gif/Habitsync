import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, ScrollView, TextInput, Alert } from 'react-native';
import { useTheme } from '@/context/ThemeContext';
import { useLanguage } from '@/context/LanguageContext';
import { useHabits } from '@/context/HabitContext';
import { useGamification } from '@/context/GamificationContext';
import HabitEducationService, { GuidedSetup, SetupStep } from '@/services/HabitEducationService';
import { X, ChevronLeft, ChevronRight, Clock, CheckCircle, Target, Star } from 'lucide-react-native';

interface GuidedSetupWizardProps {
  visible: boolean;
  onClose: () => void;
  setupId?: string;
}

export default function GuidedSetupWizard({ visible, onClose, setupId }: GuidedSetupWizardProps) {
  const { currentTheme } = useTheme();
  const { t, currentLanguage } = useLanguage();
  const { trackGuidedSetupCompletion } = useGamification();
  const { addHabit } = useHabits();
  
  const [setup, setSetup] = useState<GuidedSetup | null>(null);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [stepAnswers, setStepAnswers] = useState<Record<string, any>>({});
  const [isLoading, setIsLoading] = useState(false);

  const styles = createStyles(currentTheme.colors);

  useEffect(() => {
    if (visible && setupId) {
      loadSetup();
    }
  }, [visible, setupId]);

  const loadSetup = async () => {
    if (!setupId) return;
    
    setIsLoading(true);
    try {
      const setupData = await HabitEducationService.getGuidedSetup(setupId, currentLanguage.code);
      setSetup(setupData);
      setCurrentStepIndex(0);
      setStepAnswers({});
    } catch (error) {
      console.error('Error loading setup:', error);
      Alert.alert(t('common.error'), t('guidedSetup.loadError'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setCurrentStepIndex(0);
    setStepAnswers({});
    setSetup(null);
    onClose();
  };

  const handleNext = () => {
    if (currentStepIndex < (setup?.steps.length || 0) - 1) {
      setCurrentStepIndex(currentStepIndex + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrevious = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(currentStepIndex - 1);
    }
  };

  const handleStepAnswer = (stepId: string, answer: any) => {
    setStepAnswers(prev => ({
      ...prev,
      [stepId]: answer
    }));
  };

  const handleComplete = async () => {
    if (!setup) return;

    try {
      // Create habit based on setup answers
      const habitData = createHabitFromAnswers(setup, stepAnswers);
      
      if (habitData) {
        await addHabit(habitData);
        await trackGuidedSetupCompletion(setup.id, setup.title);
        
        Alert.alert(
          t('guidedSetup.successTitle'),
          t('guidedSetup.successMessage'),
          [{ text: t('common.ok'), onPress: handleClose }]
        );
      } else {
        console.error('❌ No habit data created for setup:', setup.id);
        Alert.alert(t('common.error'), 'Failed to create habit from setup answers');
      }
    } catch (error) {
      console.error('Error creating habit:', error);
      Alert.alert(t('common.error'), t('guidedSetup.createError'));
    }
  };

  const createHabitFromAnswers = (setup: GuidedSetup, answers: Record<string, any>) => {
    if (setup.id === 'first-habit-setup') {
      const goal = answers['goal-setting'] || '';
      const habitType = answers['habit-selection'] || '';
      const specificity = answers['specificity'] || '';
      const cue = answers['cue-identification'] || '';
      const reward = answers['reward-planning'] || '';

      return {
        id: Date.now().toString(),
        title: `${habitType} - ${goal}`,
        notes: `${t('guidedSetups.first-habit-setup.steps.goal-setting.title')}: ${goal}\n${t('guidedSetups.first-habit-setup.steps.specificity.title')}: ${specificity}\n${t('guidedSetups.first-habit-setup.steps.cue-identification.title')}: ${cue}\n${t('guidedSetups.first-habit-setup.steps.reward-planning.title')}: ${reward}`,
        streak: 0,
        createdAt: new Date().toISOString(),
        completedToday: false,
        completedDates: [],
        reminderEnabled: false,
        order: 0,
      };
    }

    if (setup.id === 'productivity-setup') {
      const assessment = answers['productivity-assessment'] || '';
      const goals = answers['productivity-goals'] || '';
      const selectedHabit = answers['habit-selection'] || '';
      const implementationPlan = answers['implementation-plan'] || '';

      return {
        id: Date.now().toString(),
        title: `${t('guidedSetups.productivity-setup.title')} - ${selectedHabit}`,
        notes: `${t('guidedSetups.productivity-setup.steps.productivity-assessment.title')}: ${assessment}\n${t('guidedSetups.productivity-setup.steps.productivity-goals.title')}: ${goals}\n${t('guidedSetups.productivity-setup.steps.habit-selection.title')}: ${selectedHabit}\n${t('guidedSetups.productivity-setup.steps.implementation-plan.title')}: ${implementationPlan}`,
        streak: 0,
        createdAt: new Date().toISOString(),
        completedToday: false,
        completedDates: [],
        reminderEnabled: false,
        order: 0,
      };
    }

    return null;
  };

  const renderStepContent = (step: SetupStep) => {
    switch (step.type) {
      case 'question':
        return (
          <View style={styles.stepContent}>
            <Text style={styles.stepDescription}>{step.description}</Text>
            <View style={styles.ratingContainer}>
              {[1, 2, 3, 4, 5].map((rating) => (
                <TouchableOpacity
                  key={rating}
                  style={styles.ratingButton}
                  onPress={() => handleStepAnswer(step.id, rating)}
                >
                  <Star 
                    size={24} 
                    color={stepAnswers[step.id] >= rating ? currentTheme.colors.warning : currentTheme.colors.border} 
                    fill={stepAnswers[step.id] >= rating ? currentTheme.colors.warning : 'transparent'} 
                  />
                </TouchableOpacity>
              ))}
            </View>
          </View>
        );

      case 'selection':
        return (
          <View style={styles.stepContent}>
            <Text style={styles.stepDescription}>{step.description}</Text>
            <View style={styles.optionsContainer}>
              {step.options?.map((option) => (
                <TouchableOpacity
                  key={option}
                  style={[
                    styles.optionButton,
                    stepAnswers[step.id] === option && styles.selectedOption
                  ]}
                  onPress={() => handleStepAnswer(step.id, option)}
                >
                  <Text style={[
                    styles.optionText,
                    stepAnswers[step.id] === option && styles.selectedOptionText
                  ]}>
                    {option}
                  </Text>
                  {stepAnswers[step.id] === option && (
                    <CheckCircle size={20} color={currentTheme.colors.background} />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>
        );

      case 'input':
        return (
          <View style={styles.stepContent}>
            <Text style={styles.stepDescription}>{step.description}</Text>
            <TextInput
              style={styles.inputField}
              placeholder={t('guidedSetup.enterYourAnswer')}
              placeholderTextColor={currentTheme.colors.textMuted}
              value={stepAnswers[step.id] || ''}
              onChangeText={(text) => handleStepAnswer(step.id, text)}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>
        );

      case 'confirmation':
        return (
          <View style={styles.stepContent}>
            <Text style={styles.stepDescription}>{step.description}</Text>
            <View style={styles.summaryContainer}>
              {Object.entries(stepAnswers).map(([stepId, answer]) => {
                const step = setup?.steps.find(s => s.id === stepId);
                return (
                  <View key={stepId} style={styles.summaryItem}>
                    <Text style={styles.summaryLabel}>{step?.title}</Text>
                    <Text style={styles.summaryValue}>{answer}</Text>
                  </View>
                );
              })}
            </View>
          </View>
        );

      default:
        return null;
    }
  };

  const canProceed = () => {
    if (!setup) return false;
    
    const currentStep = setup.steps[currentStepIndex];
    const answer = stepAnswers[currentStep.id];
    

    
    switch (currentStep.type) {
      case 'question':
        return answer && answer > 0;
      case 'selection':
        return answer && answer.length > 0;
      case 'input':
        const isValid = answer && answer.trim().length > 0;
        return isValid;
      case 'confirmation':
        return true;
      default:
        return true;
    }
  };

  if (!setup) {
    return null;
  }

  const currentStep = setup.steps[currentStepIndex];
  const progress = ((currentStepIndex + 1) / setup.steps.length) * 100;
  const isLastStep = currentStepIndex === setup.steps.length - 1;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
              <X size={24} color={currentTheme.colors.textSecondary} />
            </TouchableOpacity>
            <View style={styles.headerContent}>
              <Text style={styles.headerTitle}>{setup.title}</Text>
              <Text style={styles.headerSubtitle}>
                {t('guidedSetup.step')} {currentStepIndex + 1} {t('guidedSetup.of')} {setup.steps.length}
              </Text>
            </View>
          </View>
          <View style={styles.headerRight}>
            <Clock size={16} color={currentTheme.colors.textSecondary} />
            <Text style={styles.timeEstimate}>{setup.estimatedTime} {t('guidedSetup.minutes')}</Text>
          </View>
        </View>

        {/* Progress Bar */}
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${progress}%` }]} />
          </View>
          <Text style={styles.progressText}>{Math.round(progress)}%</Text>
        </View>

        {/* Content */}
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Step Title */}
          <View style={styles.stepHeader}>
            <View style={styles.stepIcon}>
              <Target size={24} color={currentTheme.colors.primary} />
            </View>
            <Text style={styles.stepTitle}>{currentStep.title}</Text>
          </View>

          {/* Step Content */}
          {renderStepContent(currentStep)}

          {/* Navigation */}
          <View style={styles.navigation}>
            {currentStepIndex > 0 && (
              <TouchableOpacity
                style={styles.navButton}
                onPress={handlePrevious}
              >
                <ChevronLeft size={20} color={currentTheme.colors.text} />
                <Text style={styles.navButtonText}>{t('guidedSetup.previous')}</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={[
                styles.navButton,
                styles.primaryNavButton,
                !canProceed() && styles.disabledButton
              ]}
              onPress={handleNext}
              disabled={!canProceed()}
            >
              <Text style={styles.primaryNavButtonText}>
                {isLastStep ? t('guidedSetup.complete') : t('guidedSetup.next')}
              </Text>
              {!isLastStep && <ChevronRight size={20} color={currentTheme.colors.background} />}
              {isLastStep && <CheckCircle size={20} color={currentTheme.colors.background} />}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
}

const createStyles = (colors: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
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
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  closeButton: {
    padding: 4,
    marginRight: 12,
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 2,
  },
  headerSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timeEstimate: {
    fontSize: 12,
    color: colors.textSecondary,
    marginLeft: 4,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: colors.surface,
  },
  progressBar: {
    flex: 1,
    height: 4,
    backgroundColor: colors.border,
    borderRadius: 2,
    marginRight: 12,
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 2,
  },
  progressText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  stepHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  stepIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primary + '20',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  stepTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
    flex: 1,
  },
  stepContent: {
    marginBottom: 32,
  },
  stepDescription: {
    fontSize: 16,
    color: colors.textSecondary,
    lineHeight: 24,
    marginBottom: 24,
  },
  ratingContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  ratingButton: {
    padding: 8,
  },
  optionsContainer: {
    gap: 12,
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: colors.card,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.border,
  },
  selectedOption: {
    borderColor: colors.primary,
    backgroundColor: colors.primary + '10',
  },
  optionText: {
    fontSize: 16,
    color: colors.text,
    flex: 1,
  },
  selectedOptionText: {
    color: colors.primary,
    fontWeight: '600',
  },
  inputField: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.border,
    minHeight: 100,
  },
  summaryContainer: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
  },
  summaryItem: {
    marginBottom: 16,
  },
  summaryLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 16,
    color: colors.text,
  },
  navigation: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 20,
  },
  navButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: colors.surface,
  },
  navButtonText: {
    fontSize: 16,
    color: colors.text,
    marginLeft: 8,
  },
  primaryNavButton: {
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
  },
  primaryNavButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.background,
    marginRight: 8,
  },
  disabledButton: {
    backgroundColor: colors.border,
  },
});
