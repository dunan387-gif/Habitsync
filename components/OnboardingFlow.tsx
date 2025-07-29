import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Dimensions } from 'react-native';
import { ChevronRight, ChevronLeft, Heart, Target, TrendingUp, Shield, CheckCircle } from 'lucide-react-native';
import { useTheme } from '@/context/ThemeContext';
import { useLanguage } from '@/context/LanguageContext';
import { useGamification } from '@/context/GamificationContext';
import QuickMoodSelector from './QuickMoodSelector';
import { MoodData } from '@/types';

const { width } = Dimensions.get('window');

interface OnboardingFlowProps {
  onComplete: () => void;
}

const ONBOARDING_STEPS = [
  {
    id: 'welcome',
    titleKey: 'onboarding.welcome.title',
    subtitleKey: 'onboarding.welcome.description',
    icon: Heart,
    color: '#E91E63'
  },
  {
    id: 'features-overview',
    titleKey: 'onboarding.featuresOverview.title',
    subtitleKey: 'onboarding.featuresOverview.description',
    icon: Target,
    color: '#2196F3'
  },
  {
    id: 'ai-intelligence',
    titleKey: 'onboarding.aiIntelligence.title',
    subtitleKey: 'onboarding.aiIntelligence.description',
    icon: TrendingUp,
    color: '#4CAF50'
  },
  {
    id: 'mood-wellness',
    titleKey: 'onboarding.moodWellness.title',
    subtitleKey: 'onboarding.moodWellness.description',
    icon: Heart,
    color: '#FF9800'
  },
  {
    id: 'gamification',
    titleKey: 'onboarding.gamification.title',
    subtitleKey: 'onboarding.gamification.description',
    icon: CheckCircle,
    color: '#9C27B0'
  },
  {
    id: 'analytics-insights',
    titleKey: 'onboarding.analytics.title',
    subtitleKey: 'onboarding.analytics.description',
    icon: TrendingUp,
    color: '#FF5722'
  },
  {
    id: 'privacy-security',
    titleKey: 'onboarding.privacySecurity.title',
    subtitleKey: 'onboarding.privacySecurity.description',
    icon: Shield,
    color: '#607D8B'
  },
  {
    id: 'setup-wizard',
    titleKey: 'onboarding.setupWizard.title',
    subtitleKey: 'onboarding.setupWizard.description',
    icon: CheckCircle,
    color: '#4CAF50'
  }
];

const SAMPLE_INSIGHTS = [
  {
    titleKey: 'onboarding.analytics.insights.morningExercise.title',
    descriptionKey: 'onboarding.analytics.insights.morningExercise.description',
    impactKey: 'onboarding.analytics.insights.morningExercise.impact',
    color: '#4CAF50'
  },
  {
    titleKey: 'onboarding.analytics.insights.socialConnection.title',
    descriptionKey: 'onboarding.analytics.insights.socialConnection.description',
    impactKey: 'onboarding.analytics.insights.socialConnection.impact',
    color: '#E91E63'
  },
  {
    titleKey: 'onboarding.analytics.insights.stressTrigger.title',
    descriptionKey: 'onboarding.analytics.insights.stressTrigger.description',
    impactKey: 'onboarding.analytics.insights.stressTrigger.impact',
    color: '#FF5722'
  }
];

const PRIVACY_BENEFITS = [
  {
    icon: '🔒',
    titleKey: 'onboarding.privacy.benefits.encryption.title',
    descriptionKey: 'onboarding.privacy.benefits.encryption.description'
  },
  {
    icon: '📱',
    titleKey: 'onboarding.privacy.benefits.offlineFirst.title',
    descriptionKey: 'onboarding.privacy.benefits.offlineFirst.description'
  },
  {
    icon: '🎯',
    titleKey: 'onboarding.privacy.benefits.personalizedInsights.title',
    descriptionKey: 'onboarding.privacy.benefits.personalizedInsights.description'
  },
  {
    icon: '📈',
    titleKey: 'onboarding.privacy.benefits.progressTracking.title',
    descriptionKey: 'onboarding.privacy.benefits.progressTracking.description'
  }
];

export default function OnboardingFlow({ onComplete }: OnboardingFlowProps) {
  const { currentTheme } = useTheme();
  const { t } = useLanguage();
  const { addMoodEntry, addXP } = useGamification();
  const [currentStep, setCurrentStep] = useState(0);
  const [completedFirstMood, setCompletedFirstMood] = useState(false);
  
  const styles = createStyles(currentTheme.colors);
  const step = ONBOARDING_STEPS[currentStep];
  
  const handleSkipMoodEntry = () => {
    setCompletedFirstMood(true);
  };
  
  const handleNext = () => {
    if (currentStep < ONBOARDING_STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onComplete();
    }
  };
  
  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };
  
  const handleFirstMoodComplete = async (moodData: MoodData) => {
    try {
      // Save the mood entry to GamificationContext
      await addMoodEntry(
        mapToValidMoodState(moodData.moodState), 
        moodData.intensity, 
        moodData.note || undefined, 
        moodData.contextTags?.length > 0 ? filterValidTags(moodData.contextTags) : undefined
      );
      
      // Award XP for first mood entry
      await addXP(5, 'First mood check-in during onboarding!');
      
      setCompletedFirstMood(true);
    } catch (error) {
      console.error('Error saving onboarding mood entry:', error);
    }
  };
  
  const renderWelcomeStep = () => (
    <View style={styles.stepContent}>
      <View style={[styles.iconContainer, { backgroundColor: step.color + '20' }]}>
        <Heart size={48} color={step.color} />
      </View>
      <Text style={styles.stepTitle}>{t(step.titleKey)}</Text>
      <Text style={styles.stepSubtitle}>{t(step.subtitleKey)}</Text>
      
      <View style={styles.welcomeFeatures}>
        <View style={styles.featureItem}>
          <Text style={styles.featureEmoji}>😊</Text>
          <Text style={styles.featureText}>{t('onboarding.welcome.features.trackMoods')}</Text>
        </View>
        <View style={styles.featureItem}>
          <Text style={styles.featureEmoji}>🎯</Text>
          <Text style={styles.featureText}>{t('onboarding.welcome.features.buildHabits')}</Text>
        </View>
        <View style={styles.featureItem}>
          <Text style={styles.featureEmoji}>📊</Text>
          <Text style={styles.featureText}>{t('onboarding.welcome.features.discoverPatterns')}</Text>
        </View>
        <View style={styles.featureItem}>
          <Text style={styles.featureEmoji}>🚀</Text>
          <Text style={styles.featureText}>{t('onboarding.welcome.features.improveWellbeing')}</Text>
        </View>
      </View>
    </View>
  );
  
  const renderFeaturesOverviewStep = () => (
    <View style={styles.stepContent}>
      <View style={[styles.iconContainer, { backgroundColor: step.color + '20' }]}>
        <Target size={48} color={step.color} />
      </View>
      <Text style={styles.stepTitle}>{t(step.titleKey)}</Text>
      <Text style={styles.stepSubtitle}>{t(step.subtitleKey)}</Text>
      
      <View style={styles.featuresGrid}>
        <View style={styles.featureCard}>
          <Text style={styles.featureEmoji}>🎯</Text>
          <Text style={styles.featureTitle}>{t('onboarding.featuresOverview.smartHabits.title')}</Text>
          <Text style={styles.featureDescription}>{t('onboarding.featuresOverview.smartHabits.description')}</Text>
        </View>
        <View style={styles.featureCard}>
          <Text style={styles.featureEmoji}>📊</Text>
          <Text style={styles.featureTitle}>{t('onboarding.featuresOverview.analytics.title')}</Text>
          <Text style={styles.featureDescription}>{t('onboarding.featuresOverview.analytics.description')}</Text>
        </View>
        <View style={styles.featureCard}>
          <Text style={styles.featureEmoji}>🏆</Text>
          <Text style={styles.featureTitle}>{t('onboarding.featuresOverview.gamification.title')}</Text>
          <Text style={styles.featureDescription}>{t('onboarding.featuresOverview.gamification.description')}</Text>
        </View>
        <View style={styles.featureCard}>
          <Text style={styles.featureEmoji}>💚</Text>
          <Text style={styles.featureTitle}>{t('onboarding.featuresOverview.wellness.title')}</Text>
          <Text style={styles.featureDescription}>{t('onboarding.featuresOverview.wellness.description')}</Text>
        </View>
      </View>
    </View>
  );
  
  const renderAIIntelligenceStep = () => (
    <View style={styles.stepContent}>
      <View style={[styles.iconContainer, { backgroundColor: step.color + '20' }]}>
        <TrendingUp size={48} color={step.color} />
      </View>
      <Text style={styles.stepTitle}>{t(step.titleKey)}</Text>
      <Text style={styles.stepSubtitle}>{t(step.subtitleKey)}</Text>
      
      <View style={styles.aiFeatures}>
        <View style={styles.aiFeatureItem}>
          <Text style={styles.aiFeatureIcon}>🤖</Text>
          <View style={styles.aiFeatureText}>
            <Text style={styles.aiFeatureTitle}>{t('onboarding.aiIntelligence.smartSuggestions.title')}</Text>
            <Text style={styles.aiFeatureDescription}>{t('onboarding.aiIntelligence.smartSuggestions.description')}</Text>
          </View>
        </View>
        <View style={styles.aiFeatureItem}>
          <Text style={styles.aiFeatureIcon}>⏰</Text>
          <View style={styles.aiFeatureText}>
            <Text style={styles.aiFeatureTitle}>{t('onboarding.aiIntelligence.optimalTiming.title')}</Text>
            <Text style={styles.aiFeatureDescription}>{t('onboarding.aiIntelligence.optimalTiming.description')}</Text>
          </View>
        </View>
        <View style={styles.aiFeatureItem}>
          <Text style={styles.aiFeatureIcon}>🎯</Text>
          <View style={styles.aiFeatureText}>
            <Text style={styles.aiFeatureTitle}>{t('onboarding.aiIntelligence.predictiveInsights.title')}</Text>
            <Text style={styles.aiFeatureDescription}>{t('onboarding.aiIntelligence.predictiveInsights.description')}</Text>
          </View>
        </View>
      </View>
    </View>
  );
  
  const renderMoodEducationStep = () => (
    <View style={styles.stepContent}>
      <View style={[styles.iconContainer, { backgroundColor: step.color + '20' }]}>
        <TrendingUp size={48} color={step.color} />
      </View>
      <Text style={styles.stepTitle}>{t(step.titleKey)}</Text>
      <Text style={styles.stepSubtitle}>{t(step.subtitleKey)}</Text>
      
      <View style={styles.educationContent}>
        <View style={styles.educationItem}>
          <Text style={styles.educationNumber}>1</Text>
          <View style={styles.educationText}>
            <Text style={styles.educationTitle}>{t('onboarding.moodWellness.emotionalAwareness.title')}</Text>
            <Text style={styles.educationDescription}>
              {t('onboarding.moodWellness.emotionalAwareness.description')}
            </Text>
          </View>
        </View>
        
        <View style={styles.educationItem}>
          <Text style={styles.educationNumber}>2</Text>
          <View style={styles.educationText}>
            <Text style={styles.educationTitle}>{t('onboarding.moodWellness.patternRecognition.title')}</Text>
            <Text style={styles.educationDescription}>
              {t('onboarding.moodWellness.patternRecognition.description')}
            </Text>
          </View>
        </View>
        
        <View style={styles.educationItem}>
          <Text style={styles.educationNumber}>3</Text>
          <View style={styles.educationText}>
            <Text style={styles.educationTitle}>{t('onboarding.moodWellness.proactiveWellbeing.title')}</Text>
            <Text style={styles.educationDescription}>
              {t('onboarding.moodWellness.proactiveWellbeing.description')}
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
  
  const renderGamificationStep = () => (
    <View style={styles.stepContent}>
      <View style={[styles.iconContainer, { backgroundColor: step.color + '20' }]}>
        <CheckCircle size={48} color={step.color} />
      </View>
      <Text style={styles.stepTitle}>{t(step.titleKey)}</Text>
      <Text style={styles.stepSubtitle}>{t(step.subtitleKey)}</Text>
      
      <View style={styles.gamificationFeatures}>
        <View style={styles.gamificationItem}>
          <Text style={styles.gamificationIcon}>🏆</Text>
          <View style={styles.gamificationText}>
            <Text style={styles.gamificationTitle}>{t('onboarding.gamification.achievements.title')}</Text>
            <Text style={styles.gamificationDescription}>{t('onboarding.gamification.achievements.description')}</Text>
          </View>
        </View>
        <View style={styles.gamificationItem}>
          <Text style={styles.gamificationIcon}>⚡</Text>
          <View style={styles.gamificationText}>
            <Text style={styles.gamificationTitle}>{t('onboarding.gamification.xpLevels.title')}</Text>
            <Text style={styles.gamificationDescription}>{t('onboarding.gamification.xpLevels.description')}</Text>
          </View>
        </View>
        <View style={styles.gamificationItem}>
          <Text style={styles.gamificationIcon}>🔥</Text>
          <View style={styles.gamificationText}>
            <Text style={styles.gamificationTitle}>{t('onboarding.gamification.streaks.title')}</Text>
            <Text style={styles.gamificationDescription}>{t('onboarding.gamification.streaks.description')}</Text>
          </View>
        </View>
        <View style={styles.gamificationItem}>
          <Text style={styles.gamificationIcon}>🎯</Text>
          <View style={styles.gamificationText}>
            <Text style={styles.gamificationTitle}>{t('onboarding.gamification.challenges.title')}</Text>
            <Text style={styles.gamificationDescription}>{t('onboarding.gamification.challenges.description')}</Text>
          </View>
        </View>
      </View>
    </View>
  );
  
  const renderHabitConnectionStep = () => (
    <View style={styles.stepContent}>
      <View style={[styles.iconContainer, { backgroundColor: step.color + '20' }]}>
        <Target size={48} color={step.color} />
      </View>
      <Text style={styles.stepTitle}>{t(step.titleKey)}</Text>
      <Text style={styles.stepSubtitle}>{t(step.subtitleKey)}</Text>
      
      <View style={styles.connectionDemo}>
        <View style={styles.connectionItem}>
          <View style={styles.connectionMood}>
            <Text style={styles.connectionEmoji}>😴</Text>
            <Text style={styles.connectionLabel}>{t('onboarding.moodWellness.connectionDemo.tired')}</Text>
          </View>
          <View style={styles.connectionArrow}>
            <ChevronRight size={20} color={currentTheme.colors.textSecondary} />
          </View>
          <View style={styles.connectionHabit}>
            <Text style={styles.connectionEmoji}>☕</Text>
            <Text style={styles.connectionLabel}>{t('onboarding.moodWellness.connectionDemo.morningCoffee')}</Text>
          </View>
          <View style={styles.connectionArrow}>
            <ChevronRight size={20} color={currentTheme.colors.textSecondary} />
          </View>
          <View style={styles.connectionResult}>
            <Text style={styles.connectionEmoji}>⚡</Text>
            <Text style={styles.connectionLabel}>{t('onboarding.moodWellness.connectionDemo.energetic')}</Text>
          </View>
        </View>
        
        <View style={styles.connectionItem}>
          <View style={styles.connectionMood}>
            <Text style={styles.connectionEmoji}>😰</Text>
            <Text style={styles.connectionLabel}>{t('onboarding.moodWellness.connectionDemo.stressed')}</Text>
          </View>
          <View style={styles.connectionArrow}>
            <ChevronRight size={20} color={currentTheme.colors.textSecondary} />
          </View>
          <View style={styles.connectionHabit}>
            <Text style={styles.connectionEmoji}>🧘</Text>
            <Text style={styles.connectionLabel}>{t('onboarding.moodWellness.connectionDemo.meditation')}</Text>
          </View>
          <View style={styles.connectionArrow}>
            <ChevronRight size={20} color={currentTheme.colors.textSecondary} />
          </View>
          <View style={styles.connectionResult}>
            <Text style={styles.connectionEmoji}>😌</Text>
            <Text style={styles.connectionLabel}>{t('onboarding.moodWellness.connectionDemo.calm')}</Text>
          </View>
        </View>
      </View>
    </View>
  );
  
  const renderSampleInsightsStep = () => (
    <View style={styles.stepContent}>
      <View style={[styles.iconContainer, { backgroundColor: step.color + '20' }]}>
        <TrendingUp size={48} color={step.color} />
      </View>
      <Text style={styles.stepTitle}>{t(step.titleKey)}</Text>
      <Text style={styles.stepSubtitle}>{t(step.subtitleKey)}</Text>
      
      <ScrollView style={styles.insightsContainer}>
        {SAMPLE_INSIGHTS.map((insight, index) => (
          <View key={index} style={[styles.insightCard, { borderLeftColor: insight.color }]}>
            <Text style={styles.insightTitle}>{t(insight.titleKey)}</Text>
            <Text style={styles.insightDescription}>{t(insight.descriptionKey)}</Text>
            <View style={[styles.insightImpact, { backgroundColor: insight.color + '20' }]}>
              <Text style={[styles.insightImpactText, { color: insight.color }]}>
                {t(insight.impactKey)}
              </Text>
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  );
  
  const renderPrivacyBenefitsStep = () => (
    <View style={styles.stepContent}>
      <View style={[styles.iconContainer, { backgroundColor: step.color + '20' }]}>
        <Shield size={48} color={step.color} />
      </View>
      <Text style={styles.stepTitle}>{t(step.titleKey)}</Text>
      <Text style={styles.stepSubtitle}>{t(step.subtitleKey)}</Text>
      
      <View style={styles.benefitsGrid}>
        {PRIVACY_BENEFITS.map((benefit, index) => (
          <View key={index} style={styles.benefitCard}>
            <Text style={styles.benefitIcon}>{benefit.icon}</Text>
            <Text style={styles.benefitTitle}>{t(benefit.titleKey)}</Text>
            <Text style={styles.benefitDescription}>{t(benefit.descriptionKey)}</Text>
          </View>
        ))}
      </View>
    </View>
  );
  
  const renderSetupWizardStep = () => (
    <View style={styles.stepContent}>
      <View style={[styles.iconContainer, { backgroundColor: step.color + '20' }]}>
        <CheckCircle size={48} color={step.color} />
      </View>
      <Text style={styles.stepTitle}>{t(step.titleKey)}</Text>
      <Text style={styles.stepSubtitle}>{t('onboarding.setupWizard.tryFirstMood')}</Text>
      
      <View style={styles.setupContainer}>
        <QuickMoodSelector 
          onMoodSelect={handleFirstMoodComplete}
          showIntensitySlider={false}
          showContextTags={false}
          showAttachments={false}
          showVoiceOption={false}
          allowSkip={true}
          onSkip={handleSkipMoodEntry}
        />
        
        {completedFirstMood && (
          <View style={styles.completionMessage}>
            <CheckCircle size={24} color={step.color} />
            <Text style={styles.completionText}>
              {t('onboarding.setupWizard.completionMessage')}
            </Text>
          </View>
        )}
      </View>
    </View>
  );
  
  const renderStepContent = () => {
    switch (step.id) {
      case 'welcome':
        return renderWelcomeStep();
      case 'features-overview':
        return renderFeaturesOverviewStep();
      case 'ai-intelligence':
        return renderAIIntelligenceStep();
      case 'mood-wellness':
        return renderMoodEducationStep();
      case 'gamification':
        return renderGamificationStep();
      case 'analytics-insights':
        return renderSampleInsightsStep();
      case 'privacy-security':
        return renderPrivacyBenefitsStep();
      case 'setup-wizard':
        return renderSetupWizardStep();
      default:
        return renderWelcomeStep();
    }
  };
  
  return (
    <View style={styles.container}>
      {/* Progress Indicator */}
      <View style={styles.progressContainer}>
        {ONBOARDING_STEPS.map((_, index) => (
          <View 
            key={index}
            style={[
              styles.progressDot,
              index <= currentStep && styles.progressDotActive
            ]} 
          />
        ))}
      </View>
      
      {/* Step Content */}
      <ScrollView style={styles.contentContainer}>
        {renderStepContent()}
      </ScrollView>
      
      {/* Navigation */}
      <View style={styles.navigationContainer}>
        {currentStep > 0 && (
          <TouchableOpacity style={styles.backButton} onPress={handlePrevious}>
            <ChevronLeft size={20} color={currentTheme.colors.primary} />
            <Text style={styles.backButtonText}>{t('common.back')}</Text>
          </TouchableOpacity>
        )}
        
        <TouchableOpacity 
          style={[
            styles.nextButton,
            { backgroundColor: step.color },
            (step.id === 'setup-wizard' && !completedFirstMood) && styles.nextButtonDisabled
          ]}
          onPress={handleNext}
          disabled={step.id === 'setup-wizard' && !completedFirstMood}
        >
          <Text style={styles.nextButtonText}>
            {currentStep === ONBOARDING_STEPS.length - 1 ? t('common.getStarted') : t('common.continue')}
          </Text>
          <ChevronRight size={20} color="#FFFFFF" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const createStyles = (colors: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  progressContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingVertical: 20,
    paddingHorizontal: 20,
  },
  progressDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.border,
    marginHorizontal: 4,
  },
  progressDotActive: {
    backgroundColor: colors.primary,
  },
  contentContainer: {
    flex: 1,
    paddingHorizontal: 20,
  },
  stepContent: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  stepTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
    textAlign: 'center',
    marginBottom: 10,
  },
  stepSubtitle: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 30,
    lineHeight: 24,
  },
  welcomeFeatures: {
    width: '100%',
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    backgroundColor: colors.card,
    borderRadius: 12,
    marginBottom: 12,
  },
  featureEmoji: {
    fontSize: 24,
    marginRight: 15,
  },
  featureText: {
    fontSize: 16,
    color: colors.text,
    fontWeight: '500',
  },
  // Features Overview Styles
  featuresGrid: {
    width: '100%',
  },
  featureCard: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    alignItems: 'center',
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
    textAlign: 'center',
  },
  featureDescription: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  // AI Features Styles
  aiFeatures: {
    width: '100%',
  },
  aiFeatureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  aiFeatureIcon: {
    fontSize: 32,
    marginRight: 15,
  },
  aiFeatureText: {
    flex: 1,
  },
  aiFeatureTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  aiFeatureDescription: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  // Gamification Styles
  gamificationFeatures: {
    width: '100%',
  },
  gamificationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  gamificationIcon: {
    fontSize: 32,
    marginRight: 15,
  },
  gamificationText: {
    flex: 1,
  },
  gamificationTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  gamificationDescription: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  educationContent: {
    width: '100%',
  },
  educationItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  educationNumber: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: colors.primary,
    color: '#FFFFFF',
    textAlign: 'center',
    lineHeight: 30,
    fontSize: 16,
    fontWeight: 'bold',
    marginRight: 15,
  },
  educationText: {
    flex: 1,
  },
  educationTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 5,
  },
  educationDescription: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  connectionDemo: {
    width: '100%',
  },
  connectionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
    paddingVertical: 15,
    paddingHorizontal: 10,
    backgroundColor: colors.card,
    borderRadius: 12,
  },
  connectionMood: {
    alignItems: 'center',
    flex: 1,
  },
  connectionHabit: {
    alignItems: 'center',
    flex: 1,
  },
  connectionResult: {
    alignItems: 'center',
    flex: 1,
  },
  connectionArrow: {
    marginHorizontal: 5,
  },
  connectionEmoji: {
    fontSize: 24,
    marginBottom: 5,
  },
  connectionLabel: {
    fontSize: 12,
    color: colors.text,
    textAlign: 'center',
  },
  insightsContainer: {
    width: '100%',
    minHeight: 400,
  },
  insightCard: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
  },
  insightTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  insightDescription: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
    marginBottom: 10,
  },
  insightImpact: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  insightImpactText: {
    fontSize: 12,
    fontWeight: '600',
  },
  benefitsGrid: {
    width: '100%',
  },
  benefitCard: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    alignItems: 'center',
  },
  benefitIcon: {
    fontSize: 32,
    marginBottom: 10,
  },
  benefitTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
    textAlign: 'center',
  },
  benefitDescription: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  setupContainer: {
    width: '100%',
  },
  completionMessage: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary + '20',
    padding: 16,
    borderRadius: 12,
    marginTop: 20,
  },
  completionText: {
    fontSize: 16,
    color: colors.text,
    marginLeft: 10,
    flex: 1,
  },
  navigationContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  backButtonText: {
    fontSize: 16,
    color: colors.primary,
    marginLeft: 5,
  },
  nextButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 25,
    flex: 1,
    marginLeft: 20,
    justifyContent: 'center',
  },
  nextButtonDisabled: {
    opacity: 0.5,
  },
  nextButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginRight: 5,
  },
});

// Add these helper functions (copy from QuickMoodSelector)
const mapToValidMoodState = (state: string) => {
  const validStates = ['happy', 'sad', 'anxious', 'energetic', 'tired', 'stressed', 'calm'] as const;
  return validStates.includes(state as any) ? state as any : 'calm';
};

const filterValidTags = (tags: string[]) => {
  const validTags = ['work', 'relationships', 'health', 'weather', 'sleep', 'exercise', 'social'] as const;
  return tags.filter(tag => validTags.includes(tag as any)) as any[];
};