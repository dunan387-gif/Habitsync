import { SubscriptionTier, PricingPlan } from '@/types';

// Subscription Tiers Configuration
export const SUBSCRIPTION_TIERS: SubscriptionTier[] = [
  {
    id: 'free',
    name: 'Free',
    price: {
      monthly: 0,
      yearly: 0,
      currency: 'USD'
    },
    features: {
      maxHabits: 4,
      analyticsDays: 7,
      aiSuggestionsPerWeek: 2,
      themes: 3,
      remindersPerHabit: 1,
      socialFeatures: false,
      dataExport: false,
      customReminders: false,
      moodHabitCorrelations: false,
      advancedAnalytics: false,
      wellnessIntegration: false,
      performanceAlerts: false,
      patternInsights: false,
      teamManagement: false,
      hipaaCompliance: false,
      whiteLabeling: false
    },
    limits: {
      habits: 4,
      analyticsDays: 7,
      aiSuggestionsPerWeek: 2,
      themes: 3,
      remindersPerHabit: 1
    },
    isActive: true
  },
  {
    id: 'pro',
    name: 'Pro',
    price: {
      monthly: 7.99,
      yearly: 59.99,
      currency: 'USD'
    },
    features: {
      maxHabits: -1, // Unlimited
      analyticsDays: 365,
      aiSuggestionsPerWeek: -1, // Unlimited
      themes: -1, // All themes
      remindersPerHabit: -1, // Unlimited
      socialFeatures: true,
      dataExport: true,
      customReminders: true,
      moodHabitCorrelations: true,
      advancedAnalytics: true,
      wellnessIntegration: true,
      performanceAlerts: true,
      patternInsights: true,
      teamManagement: false,
      hipaaCompliance: false,
      whiteLabeling: false
    },
    limits: {
      habits: -1,
      analyticsDays: 365,
      aiSuggestionsPerWeek: -1,
      themes: -1,
      remindersPerHabit: -1
    },
    isActive: true
  },
  {
    id: 'professional',
    name: 'Professional',
    price: {
      monthly: 24.99,
      yearly: 199.99,
      currency: 'USD'
    },
    features: {
      maxHabits: -1,
      analyticsDays: 365,
      aiSuggestionsPerWeek: -1,
      themes: -1,
      remindersPerHabit: -1,
      socialFeatures: true,
      dataExport: true,
      customReminders: true,
      moodHabitCorrelations: true,
      advancedAnalytics: true,
      wellnessIntegration: true,
      performanceAlerts: true,
      patternInsights: true,
      teamManagement: true,
      hipaaCompliance: true,
      whiteLabeling: false
    },
    limits: {
      habits: -1,
      analyticsDays: 365,
      aiSuggestionsPerWeek: -1,
      themes: -1,
      remindersPerHabit: -1
    },
    isActive: false // Will be enabled later
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: {
      monthly: 99.99,
      yearly: 999.99,
      currency: 'USD'
    },
    features: {
      maxHabits: -1,
      analyticsDays: 365,
      aiSuggestionsPerWeek: -1,
      themes: -1,
      remindersPerHabit: -1,
      socialFeatures: true,
      dataExport: true,
      customReminders: true,
      moodHabitCorrelations: true,
      advancedAnalytics: true,
      wellnessIntegration: true,
      performanceAlerts: true,
      patternInsights: true,
      teamManagement: true,
      hipaaCompliance: true,
      whiteLabeling: true
    },
    limits: {
      habits: -1,
      analyticsDays: 365,
      aiSuggestionsPerWeek: -1,
      themes: -1,
      remindersPerHabit: -1
    },
    isActive: false // Will be enabled later
  }
];

// Pricing Plans for Display
export const PRICING_PLANS: PricingPlan[] = [
  {
    id: 'pro-monthly',
    name: 'pricing.plans.proMonthly',
    price: 7.99,
    period: 'monthly',
    currency: 'USD',
    features: [
      'pricing.features.unlimitedHabitsFeature',
      'pricing.features.threeSixtyFiveDayAnalyticsFeature',
      'pricing.features.unlimitedAiSuggestionsFeature',
      'pricing.features.allPremiumThemesFeature',
      'pricing.features.socialFeaturesFeature',
      'pricing.features.dataExportFeature',
      'pricing.features.customRemindersFeature',
      'pricing.features.moodHabitCorrelationsFeature',
      'pricing.features.advancedAnalyticsFeature',
      'pricing.features.wellnessIntegrationFeature',
      'pricing.features.performanceAlertsFeature',
      'pricing.features.patternInsightsFeature'
    ],
    isPopular: true
  },
  {
    id: 'pro-yearly',
    name: 'pricing.plans.proYearly',
    price: 59.99,
    period: 'yearly',
    currency: 'USD',
    savings: 37,
    features: [
      'pricing.features.unlimitedHabitsFeature',
      'pricing.features.threeSixtyFiveDayAnalyticsFeature',
      'pricing.features.unlimitedAiSuggestionsFeature',
      'pricing.features.allPremiumThemesFeature',
      'pricing.features.socialFeaturesFeature',
      'pricing.features.dataExportFeature',
      'pricing.features.customRemindersFeature',
      'pricing.features.moodHabitCorrelationsFeature',
      'pricing.features.advancedAnalyticsFeature',
      'pricing.features.wellnessIntegrationFeature',
      'pricing.features.performanceAlertsFeature',
      'pricing.features.patternInsightsFeature',
      'pricing.features.savings'
    ],
    isPopular: true
  }
];

// Introductory Pricing (First 1000 users)
export const INTRODUCTORY_PRICING: PricingPlan[] = [
  {
    id: 'pro-monthly-intro',
    name: 'pricing.plans.proMonthly',
    price: 4.99,
    period: 'monthly',
    currency: 'USD',
    features: [
      'pricing.features.unlimitedHabitsFeature',
      'pricing.features.threeSixtyFiveDayAnalyticsFeature',
      'pricing.features.unlimitedAiSuggestionsFeature',
      'pricing.features.allPremiumThemesFeature',
      'pricing.features.socialFeaturesFeature',
      'pricing.features.dataExportFeature',
      'pricing.features.customRemindersFeature',
      'pricing.features.moodHabitCorrelationsFeature',
      'pricing.features.advancedAnalyticsFeature',
      'pricing.features.wellnessIntegrationFeature',
      'pricing.features.performanceAlertsFeature',
      'pricing.features.patternInsightsFeature',
      'pricing.features.limitedTimeOffer'
    ],
    isIntroductory: true
  },
  {
    id: 'pro-yearly-intro',
    name: 'pricing.plans.proYearly',
    price: 39.99,
    period: 'yearly',
    currency: 'USD',
    savings: 50,
    features: [
      'pricing.features.unlimitedHabitsFeature',
      'pricing.features.threeSixtyFiveDayAnalyticsFeature',
      'pricing.features.unlimitedAiSuggestionsFeature',
      'pricing.features.allPremiumThemesFeature',
      'pricing.features.socialFeaturesFeature',
      'pricing.features.dataExportFeature',
      'pricing.features.customRemindersFeature',
      'pricing.features.moodHabitCorrelationsFeature',
      'pricing.features.advancedAnalyticsFeature',
      'pricing.features.wellnessIntegrationFeature',
      'pricing.features.performanceAlertsFeature',
      'pricing.features.patternInsightsFeature',
      'pricing.features.fiftyPercentSavings'
    ],
    isIntroductory: true
  }
];

// Feature Gates for Access Control
export const FEATURE_GATES = {
  HABIT_LIMIT: {
    free: 4,
    pro: -1,
    professional: -1,
    enterprise: -1
  },
  ANALYTICS_DAYS: {
    free: 7,
    pro: 365,
    professional: 365,
    enterprise: 365
  },
  AI_SUGGESTIONS_PER_WEEK: {
    free: 2,
    pro: -1,
    professional: -1,
    enterprise: -1
  },
  THEMES: {
    free: 3,
    pro: -1,
    professional: -1,
    enterprise: -1
  },
  REMINDERS_PER_HABIT: {
    free: 1,
    pro: -1,
    professional: -1,
    enterprise: -1
  }
};

// Helper functions
export const getTierById = (id: string): SubscriptionTier | undefined => {
  return SUBSCRIPTION_TIERS.find(tier => tier.id === id);
};

export const getActiveTiers = (): SubscriptionTier[] => {
  return SUBSCRIPTION_TIERS.filter(tier => tier.isActive);
};

export const getFreeTier = (): SubscriptionTier => {
  return SUBSCRIPTION_TIERS.find(tier => tier.id === 'free')!;
};

export const getProTier = (): SubscriptionTier => {
  return SUBSCRIPTION_TIERS.find(tier => tier.id === 'pro')!;
};

export const isFeatureAvailable = (
  feature: keyof SubscriptionTier['features'],
  currentTier: string
): boolean => {
  const tier = getTierById(currentTier);
  return tier ? Boolean(tier.features[feature]) : false;
};

export const getFeatureLimit = (
  feature: keyof SubscriptionTier['limits'],
  currentTier: string
): number => {
  const tier = getTierById(currentTier);
  return tier ? tier.limits[feature] : 0;
}; 