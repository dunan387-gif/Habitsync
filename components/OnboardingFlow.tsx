import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@/context/ThemeContext';
import { useLanguage } from '@/context/LanguageContext';
import { useSubscription } from '@/context/SubscriptionContext';
import {
  Crown,
  Star,
  Zap,
  TrendingUp,
  Users,
  Brain,
  Palette,
  Bell,
  BarChart3,
  Activity,
  Target,
  Heart,
  Sparkles,
  ArrowRight,
  Check,
  Globe,
} from 'lucide-react-native';

const { width, height } = Dimensions.get('window');

interface OnboardingStep {
  id: string;
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  features: string[];
  isPremium?: boolean;
}

interface OnboardingFlowProps {
  onComplete?: (skipped?: boolean) => void;
}

const OnboardingFlow: React.FC<OnboardingFlowProps> = ({ onComplete }) => {
  const { currentTheme } = useTheme();
  const { t, currentLanguage, setLanguage } = useLanguage();
  const { showUpgradePrompt, currentTier } = useSubscription();
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedLanguage, setSelectedLanguage] = useState(currentLanguage.code);

  const languageOptions = [
    { code: 'en', name: 'English', flag: '🇺🇸' },
    { code: 'es', name: 'Español', flag: '🇪🇸' },
    { code: 'fr', name: 'Français', flag: '🇫🇷' },
    { code: 'zh', name: '中文', flag: '🇨🇳' },
  ];

  const handleLanguageSelect = (languageCode: string) => {
    setSelectedLanguage(languageCode);
    setLanguage(languageCode);
  };

  // Function to reset onboarding for testing
  const resetOnboarding = () => {
    setCurrentStep(0);
  };

  // Expose reset function globally for testing
  if (typeof global !== 'undefined') {
    (global as any).resetOnboardingFlow = resetOnboarding;
  }

  const onboardingSteps: OnboardingStep[] = [
    {
      id: 'welcome',
      title: t('onboarding.welcome.title'),
      subtitle: t('onboarding.welcome.subtitle'),
      icon: <Target size={48} color={currentTheme.colors.primary} />,
      features: [
        t('onboarding.welcome.feature1'),
        t('onboarding.welcome.feature2'),
        t('onboarding.welcome.feature3'),
      ],
    },
    {
      id: 'language',
      title: t('onboarding.language.title'),
      subtitle: t('onboarding.language.subtitle'),
      icon: <Globe size={48} color={currentTheme.colors.accent} />,
      features: [
        t('onboarding.language.feature1'),
        t('onboarding.language.feature2'),
        t('onboarding.language.feature3'),
      ],
    },
    {
      id: 'free-features',
      title: t('onboarding.freeFeatures.title'),
      subtitle: t('onboarding.freeFeatures.subtitle'),
      icon: <Star size={48} color={currentTheme.colors.success} />,
      features: [
        t('onboarding.freeFeatures.feature1'),
        t('onboarding.freeFeatures.feature2'),
        t('onboarding.freeFeatures.feature3'),
        t('onboarding.freeFeatures.feature4'),
      ],
    },
    {
      id: 'pro-features',
      title: t('onboarding.proFeatures.title'),
      subtitle: t('onboarding.proFeatures.subtitle'),
      icon: <Crown size={48} color={currentTheme.colors.primary} />,
      features: [
        t('onboarding.proFeatures.feature1'),
        t('onboarding.proFeatures.feature2'),
        t('onboarding.proFeatures.feature3'),
        t('onboarding.proFeatures.feature4'),
        t('onboarding.proFeatures.feature5'),
      ],
      isPremium: true,
    },
    {
      id: 'get-started',
      title: t('onboarding.getStartedStep.title'),
      subtitle: t('onboarding.getStartedStep.subtitle'),
      icon: <Zap size={48} color={currentTheme.colors.accent} />,
      features: [
        t('onboarding.getStartedStep.feature1'),
        t('onboarding.getStartedStep.feature2'),
        t('onboarding.getStartedStep.feature3'),
      ],
    },
  ];
  
  const handleNext = () => {
    if (currentStep < onboardingSteps.length - 1) {
      const nextStep = currentStep + 1;
      setCurrentStep(nextStep);
    }
  };
  
  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };
  
  const handleSkip = () => {
    // Complete onboarding and navigate to login page
    if (onComplete) {
      onComplete(true); // Pass true to indicate it was skipped
    }
  };

  const handleUpgrade = () => {
    showUpgradePrompt('onboarding');
  };

  const currentStepData = onboardingSteps[currentStep];

  const renderFeatureIcon = (feature: string) => {
    const iconProps = { size: 20, color: currentTheme.colors.success };
    
    if (feature.includes('habits')) return <Target {...iconProps} />;
    if (feature.includes('analytics')) return <BarChart3 {...iconProps} />;
    if (feature.includes('AI')) return <Brain {...iconProps} />;
    if (feature.includes('themes')) return <Palette {...iconProps} />;
    if (feature.includes('reminders')) return <Bell {...iconProps} />;
    if (feature.includes('social')) return <Users {...iconProps} />;
    if (feature.includes('wellness')) return <Activity {...iconProps} />;
    if (feature.includes('patterns')) return <Sparkles {...iconProps} />;
    if (feature.includes('mood')) return <Heart {...iconProps} />;
    
    return <Check {...iconProps} />;
  };
  
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: currentTheme.colors.background }]}>
      {/* Progress Bar */}
        <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          {onboardingSteps.map((_, index) => (
            <View
              key={index}
              style={[
                styles.progressDot,
                {
                  backgroundColor: index <= currentStep 
                    ? currentTheme.colors.primary 
                    : currentTheme.colors.border,
                },
              ]}
            />
          ))}
          </View>
        <TouchableOpacity onPress={handleSkip} style={styles.skipButton}>
          <Text style={[styles.skipText, { color: currentTheme.colors.textSecondary }]}>
            {t('onboarding.skip')}
          </Text>
        </TouchableOpacity>
      </View>
      
      {/* Content */}
      <ScrollView 
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Icon */}
        <View style={styles.iconContainer}>
          {currentStepData.icon}
        </View>

        {/* Title */}
        <Text style={[styles.title, { color: currentTheme.colors.text }]}>
          {currentStepData.title}
        </Text>

        {/* Subtitle */}
        <Text style={[styles.subtitle, { color: currentTheme.colors.textSecondary }]}>
          {currentStepData.subtitle}
        </Text>

        {/* Language Selection */}
        {currentStepData.id === 'language' && (
          <View style={styles.languageContainer}>
            {languageOptions.map((language) => (
              <TouchableOpacity
                key={language.code}
                style={[
                  styles.languageOption,
                  {
                    backgroundColor: selectedLanguage === language.code 
                      ? currentTheme.colors.primary + '20' 
                      : currentTheme.colors.card,
                    borderColor: selectedLanguage === language.code 
                      ? currentTheme.colors.primary 
                      : currentTheme.colors.border,
                  },
                ]}
                onPress={() => handleLanguageSelect(language.code)}
              >
                <Text style={styles.languageFlag}>{language.flag}</Text>
                <Text style={[
                  styles.languageName,
                  { 
                    color: selectedLanguage === language.code 
                      ? currentTheme.colors.primary 
                      : currentTheme.colors.text 
                  }
                ]}>
                  {language.name}
                </Text>
                {selectedLanguage === language.code && (
                  <Check size={20} color={currentTheme.colors.primary} />
                )}
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Features */}
        <View style={styles.featuresContainer}>
          {currentStepData.features.map((feature, index) => (
            <View key={index} style={styles.featureRow}>
              {renderFeatureIcon(feature)}
              <Text style={[styles.featureText, { color: currentTheme.colors.text }]}>
                {feature}
              </Text>
            </View>
          ))}
        </View>

        {/* Premium Badge */}
        {currentStepData.isPremium && (
          <View style={[styles.premiumBadge, { backgroundColor: currentTheme.colors.primary + '20' }]}>
            <Crown size={16} color={currentTheme.colors.primary} />
            <Text style={[styles.premiumText, { color: currentTheme.colors.primary }]}>
              {t('onboarding.proFeature')}
            </Text>
          </View>
        )}
      </ScrollView>
      
      {/* Action Buttons */}
      <View style={styles.actions}>
        {currentStep > 0 && (
          <TouchableOpacity
            style={[styles.secondaryButton, { borderColor: currentTheme.colors.border }]}
            onPress={handlePrevious}
          >
            <Text style={[styles.secondaryButtonText, { color: currentTheme.colors.textSecondary }]}>
              {t('onboarding.previous')}
            </Text>
          </TouchableOpacity>
        )}
        
        {currentStep === onboardingSteps.length - 1 ? (
                            <TouchableOpacity
            style={[styles.primaryButton, { backgroundColor: currentTheme.colors.primary }]}
            onPress={() => {
              if (onComplete) {
                onComplete(false); // Pass false to indicate it was completed normally
              }
            }}
          >
          <Text style={[styles.primaryButtonText, { color: "#FFFFFF" }]}>
            {t('onboarding.getStarted')}
          </Text>
          <ArrowRight size={20} color="#FFFFFF" />
        </TouchableOpacity>
        ) : (
        <TouchableOpacity 
            style={[styles.primaryButton, { backgroundColor: currentTheme.colors.primary }]}
          onPress={handleNext}
          >
            <Text style={[styles.primaryButtonText, { color: "#FFFFFF" }]}>
              {t('onboarding.next')}
            </Text>
            <ArrowRight size={20} color="#FFFFFF" />
          </TouchableOpacity>
        )}

        {/* Upgrade Button for Pro Features Step */}
        {currentStepData.isPremium && (
          <TouchableOpacity
            style={[styles.upgradeButton, { backgroundColor: currentTheme.colors.accent }]}
            onPress={handleUpgrade}
          >
            <Crown size={20} color="#FFFFFF" />
            <Text style={[styles.upgradeButtonText, { color: "#FFFFFF" }]}>
              {t('onboarding.upgradeNow')}
          </Text>
        </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  progressContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  progressBar: {
    flexDirection: 'row',
    gap: 8,
  },
  progressDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  skipButton: {
    padding: 8,
  },
  skipText: {
    fontSize: 14,
    fontWeight: '500',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  iconContainer: {
    alignItems: 'center',
    marginTop: 40,
    marginBottom: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 36,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
    paddingHorizontal: 20,
  },
  featuresContainer: {
    marginBottom: 24,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 12,
  },
  featureText: {
    fontSize: 16,
    flex: 1,
    lineHeight: 22,
  },
  premiumBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    gap: 6,
    alignSelf: 'center',
  },
  premiumText: {
    fontSize: 14,
    fontWeight: '600',
  },
  actions: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    gap: 12,
  },
  secondaryButton: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '500',
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    gap: 8,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  upgradeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    gap: 8,
  },
  upgradeButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  languageContainer: {
    marginBottom: 24,
    gap: 12,
  },
  languageOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    borderWidth: 2,
    gap: 12,
  },
  languageFlag: {
    fontSize: 24,
  },
  languageName: {
    fontSize: 16,
    fontWeight: '500',
    flex: 1,
  },
});

export default OnboardingFlow;