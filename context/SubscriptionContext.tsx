import React, { createContext, useContext, useState, useEffect, ReactNode, useRef, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert } from 'react-native';
import { router } from 'expo-router';
import { SubscriptionStatus, SubscriptionTier, UpgradePrompt } from '@/types';
import { 
  SUBSCRIPTION_TIERS, 
  getTierById, 
  getFreeTier, 
  isFeatureAvailable, 
  getFeatureLimit 
} from '@/constants/pricing';
import { useAuth } from '@/context/AuthContext';
import { PaymentService, PaymentPlan } from '@/services/PaymentService';

interface SubscriptionContextType {
  // Current subscription state
  currentTier: string;
  subscriptionStatus: SubscriptionStatus | null;
  isLoading: boolean;
  isUpgrading: boolean;
  
  // Feature access methods
  canAddHabit: (currentHabitCount: number) => boolean;
  canAccessAnalytics: (days: number) => boolean;
  canAccessTimeframe: (timeframe: string) => boolean;
  canUseAI: (currentUsageThisWeek: number) => boolean;
  canUseTheme: (themeId: string) => boolean;
  canUseReminders: (currentReminders: number) => boolean;
  canUseSocialFeatures: () => boolean;
  canExportData: () => boolean;
  canUseWellnessIntegration: () => boolean;
  canUsePerformanceAlerts: () => boolean;
  canUsePatternInsights: () => boolean;
  canUseMoodHabitCorrelations: () => boolean;
  isFeatureAvailable: (feature: keyof SubscriptionTier['features']) => boolean;
  getFeatureLimit: (feature: keyof SubscriptionTier['limits']) => number;
  
  // Subscription management
  upgradeToPro: (planDetails?: { id: string; period: 'monthly' | 'yearly' }) => Promise<void>;
  downgradeToFree: () => Promise<void>;
  restorePurchases: () => Promise<void>;
  checkSubscriptionStatus: () => Promise<void>;
  getDaysUntilExpiry: () => number | null;
  
  // Upgrade prompts
  upgradePrompts: UpgradePrompt[];
  showUpgradePrompt: (trigger: UpgradePrompt['trigger']) => void;
  dismissUpgradePrompt: (id: string) => void;
  
  // Simple alert-based upgrade system
  showUpgradeAlert: (title: string, message: string, type?: 'default' | 'habit_limit' | 'analytics_limit' | 'ai_limit' | 'onboarding') => void;
  
  // Analytics
  trackFeatureUsage: (feature: string) => void;
  getUsageStats: () => any;
  
  // Testing functions
  testUpgradePrompt: () => void;
  testExpiringSubscription: () => Promise<void>;
  testSubscriptionPersistence: () => Promise<void>;
}

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined);

export function SubscriptionProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  
  // Development flag to enable upgrade system testing
  // Set to true to see upgrade prompts and free tier limitations
  // Set to false to enable all pro features
  const ENABLE_UPGRADE_TESTING = true; // Set to true to test upgrade prompts
  
  const [currentTier, setCurrentTier] = useState<string>('free'); // Will be updated when subscription data loads
  const [subscriptionStatus, setSubscriptionStatus] = useState<SubscriptionStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpgrading, setIsUpgrading] = useState(false);
  const [upgradePrompts, setUpgradePrompts] = useState<UpgradePrompt[]>([]);
  const [usageStats, setUsageStats] = useState<any>({});
  
  // Track previous user ID to prevent unnecessary reloading
  const previousUserIdRef = useRef<string | undefined>(undefined);
  
  // Get user-specific storage keys
  const getStorageKeys = () => {
    const userId = user?.id || 'anonymous';
    return {
      subscription: `@productivity_app_subscription_${userId}`,
      upgradePrompts: `@productivity_app_upgrade_prompts_${userId}`,
      usageStats: `@productivity_app_usage_stats_${userId}`
    };
  };

  // Load subscription data on app start or when user changes
  useEffect(() => {
    const currentUserId = user?.id;
    
    // Only load data if user is loaded and user ID has actually changed
    if (user !== undefined && currentUserId !== previousUserIdRef.current) {
  
      previousUserIdRef.current = currentUserId;
      loadSubscriptionData();
      loadUpgradePrompts();
      loadUsageStats();
      loadModalState();
    }
  }, [user?.id]);



  // User-friendly default reminder system - show alert after 24 hours for free users
  useEffect(() => {
    if (currentTier === 'free' && !isLoading) {
      const checkDefaultReminder = async () => {
        try {
          const keys = getStorageKeys();
          const lastReminder = await AsyncStorage.getItem(`${keys.subscription}_last_reminder`);
          const now = new Date().getTime();
          
          if (!lastReminder) {
            // First time user - show reminder after 24 hours
            await AsyncStorage.setItem(`${keys.subscription}_last_reminder`, now.toString());
            setTimeout(() => {
              if (currentTier === 'free') {
            
                showUpgradeAlert(
                  '🎉 You\'re Doing Great!',
                  'You\'ve been building amazing habits for 24 hours! Ready to unlock unlimited potential?',
                  'default'
                );
              }
            }, 24 * 60 * 60 * 1000); // 24 hours
          } else {
            const lastReminderTime = parseInt(lastReminder);
            const timeSinceLastReminder = now - lastReminderTime;
            const reminderInterval = 7 * 24 * 60 * 60 * 1000; // 7 days
            
            if (timeSinceLastReminder >= reminderInterval) {
          
              showUpgradeAlert(
                '🌟 Weekly Progress Check!',
                'Amazing work this week! You\'re building incredible habits. Ready for the next level?',
                'default'
              );
              await AsyncStorage.setItem(`${keys.subscription}_last_reminder`, now.toString());
            }
          }
        } catch (error) {
          console.error('Failed to check default reminder:', error);
        }
      };
      
      checkDefaultReminder();
    }
  }, [currentTier, isLoading]);

  // Load modal state from storage
  const loadModalState = async () => {
    try {
      const keys = getStorageKeys();
      const modalState = await AsyncStorage.getItem(`${keys.subscription}_modal_state`);
      if (modalState) {
        const state = JSON.parse(modalState);
    
        // Don't auto-restore modal state on app start
        // setIsUpgradeModalVisible(state.isVisible || false);
        // setCurrentUpgradeTrigger(state.trigger || null);
      }
    } catch (error) {
      console.error('Failed to load modal state:', error);
    }
  };

  // Check if subscription has expired
  const isSubscriptionExpired = (status: SubscriptionStatus): boolean => {
    if (status.tier === 'free' || !status.endDate) {
      return false; // Free tier never expires
    }
    
    const now = new Date();
    const endDate = new Date(status.endDate);
    return now > endDate;
  };

  // Check subscription status and handle expiration
  const checkSubscriptionStatus = useCallback(async () => {
    if (subscriptionStatus && subscriptionStatus.tier === 'pro') {
      if (isSubscriptionExpired(subscriptionStatus)) {
    
        
        if (subscriptionStatus.autoRenew && subscriptionStatus.period) {
          // Auto-renew logic
          const newEndDate = new Date(subscriptionStatus.endDate!);
          if (subscriptionStatus.period === 'monthly') {
            newEndDate.setMonth(newEndDate.getMonth() + 1);
          } else if (subscriptionStatus.period === 'yearly') {
            newEndDate.setFullYear(newEndDate.getFullYear() + 1);
          }
          
          const renewedStatus: SubscriptionStatus = {
            ...subscriptionStatus,
            startDate: new Date().toISOString(),
            endDate: newEndDate.toISOString(),
            isActive: true
          };
          
          setSubscriptionStatus(renewedStatus);
          setCurrentTier('pro');
          const keys = getStorageKeys();
          await AsyncStorage.setItem(keys.subscription, JSON.stringify(renewedStatus));
      
        } else {
          // Downgrade to free - implement inline to avoid dependency issues
          const freeStatus: SubscriptionStatus = {
            tier: 'free',
            isActive: true,
            startDate: new Date().toISOString(),
            autoRenew: false,
            platform: 'web'
          };
          
          setSubscriptionStatus(freeStatus);
          setCurrentTier('free');
          const keys = getStorageKeys();
          await AsyncStorage.setItem(keys.subscription, JSON.stringify(freeStatus));
        }
      }
    }
  }, [subscriptionStatus, isSubscriptionExpired]);

  const loadSubscriptionData = async () => {
    try {
      const keys = getStorageKeys();
      const stored = await AsyncStorage.getItem(keys.subscription);
      if (stored) {
        const status: SubscriptionStatus = JSON.parse(stored);
        
        // Check if subscription has expired
        if (isSubscriptionExpired(status)) {

          
          // Auto-renewal logic (if enabled)
          if (status.autoRenew && status.period) {

            // For now, just extend the subscription by the same period
            const newEndDate = new Date(status.endDate!);
            if (status.period === 'monthly') {
              newEndDate.setMonth(newEndDate.getMonth() + 1);
            } else if (status.period === 'yearly') {
              newEndDate.setFullYear(newEndDate.getFullYear() + 1);
            }
            
            const renewedStatus: SubscriptionStatus = {
              ...status,
              startDate: new Date().toISOString(),
              endDate: newEndDate.toISOString(),
              isActive: true
            };
            
            setSubscriptionStatus(renewedStatus);
            setCurrentTier('pro');
            await AsyncStorage.setItem(keys.subscription, JSON.stringify(renewedStatus));

          } else {
            // Downgrade to free tier
            const freeStatus: SubscriptionStatus = {
              tier: 'free',
              isActive: true,
              startDate: new Date().toISOString(),
              autoRenew: false,
              platform: 'web'
            };
            
            setSubscriptionStatus(freeStatus);
            setCurrentTier('free');
            await AsyncStorage.setItem(keys.subscription, JSON.stringify(freeStatus));

          }
        } else {
          // Subscription is still valid
          setSubscriptionStatus(status);
          setCurrentTier(status.tier);

        }
      } else {
        // No stored subscription data - create default free tier
        const defaultStatus: SubscriptionStatus = {
          tier: 'free',
          isActive: true,
          startDate: new Date().toISOString(),
          autoRenew: false,
          platform: 'web'
        };
        setSubscriptionStatus(defaultStatus);
        setCurrentTier('free');
        await AsyncStorage.setItem(keys.subscription, JSON.stringify(defaultStatus));

      }
    } catch (error) {
      console.error('Failed to load subscription data:', error);
      setCurrentTier('free');
    } finally {
      setIsLoading(false);
    }
  };

  const loadUpgradePrompts = async () => {
    try {
      const keys = getStorageKeys();
      const stored = await AsyncStorage.getItem(keys.upgradePrompts);
      if (stored) {
        const prompts = JSON.parse(stored);
        setUpgradePrompts(prompts);
      } else {
        // Initialize default prompts
        const defaultPrompts: UpgradePrompt[] = [
          {
            id: 'habit_limit',
            trigger: 'habit_limit',
            title: 'Upgrade to Pro',
            message: 'You\'ve reached the limit of 4 habits. Upgrade to Pro for unlimited habits and advanced features!',
            ctaText: 'Upgrade Now',
            dismissible: true,
            shownCount: 0
          },
          {
            id: 'analytics_limit',
            trigger: 'analytics_limit',
            title: 'Unlock Full Analytics',
            message: 'Get insights into your habits with 365-day analytics, trends, and advanced reporting.',
            ctaText: 'Upgrade to Pro',
            dismissible: true,
            shownCount: 0
          },
          {
            id: 'ai_limit',
            trigger: 'ai_limit',
            title: 'Get Daily AI Coaching',
            message: 'You\'ve used your weekly AI suggestions. Upgrade for unlimited AI coaching and personalized insights.',
            ctaText: 'Upgrade to Pro',
            dismissible: true,
            shownCount: 0
          },
          {
            id: 'theme_limit',
            trigger: 'theme_limit',
            title: 'Unlock Premium Themes',
            message: 'Access all premium themes and customize your app experience.',
            ctaText: 'Upgrade to Pro',
            dismissible: true,
            shownCount: 0
          },
          {
            id: 'social_feature',
            trigger: 'social_feature',
            title: 'Join the Community',
            message: 'Connect with others, share your progress, and get motivated by the community.',
            ctaText: 'Upgrade to Pro',
            dismissible: true,
            shownCount: 0
          },
          {
            id: 'data_export',
            trigger: 'data_export',
            title: 'Export Your Data',
            message: 'Download your habit and mood data for analysis and backup.',
            ctaText: 'Upgrade to Pro',
            dismissible: true,
            shownCount: 0
          },
          {
            id: 'wellness_integration',
            trigger: 'wellness_integration',
            title: 'Track Your Wellness',
            message: 'Monitor sleep, exercise, nutrition, and meditation to see how they affect your habits.',
            ctaText: 'Upgrade to Pro',
            dismissible: true,
            shownCount: 0
          },
          {
            id: 'pattern_insights',
            trigger: 'pattern_insights',
            title: 'Discover Patterns',
            message: 'Uncover hidden patterns in your habits and mood to optimize your daily routine.',
            ctaText: 'Upgrade to Pro',
            dismissible: true,
            shownCount: 0
          },
          {
            id: 'performance_alerts',
            trigger: 'performance_alerts',
            title: 'Performance Monitoring',
            message: 'Get real-time performance alerts and optimize your app experience.',
            ctaText: 'Upgrade to Pro',
            dismissible: true,
            shownCount: 0
          },
          {
            id: 'mood_correlations',
            trigger: 'mood_correlations',
            title: 'Mood-Habit Insights',
            message: 'Discover how your mood affects your habits and get personalized insights.',
            ctaText: 'Upgrade to Pro',
            dismissible: true,
            shownCount: 0
          }
        ];

        setUpgradePrompts(defaultPrompts);
        await AsyncStorage.setItem(keys.upgradePrompts, JSON.stringify(defaultPrompts));
      }
    } catch (error) {
      console.error('Failed to load upgrade prompts:', error);
    }
  };

  const loadUsageStats = async () => {
    try {
      const keys = getStorageKeys();
      const stored = await AsyncStorage.getItem(keys.usageStats);
      if (stored) {
        const stats = JSON.parse(stored);
        
        // Check if we need to reset weekly usage
        const currentDate = new Date().toISOString().split('T')[0];
        const lastResetDate = stats.lastResetDate;
        
        if (lastResetDate !== currentDate) {
          // Check if it's been more than 7 days since last reset
          const lastReset = new Date(lastResetDate);
          const current = new Date(currentDate);
          const daysDiff = Math.floor((current.getTime() - lastReset.getTime()) / (1000 * 60 * 60 * 24));
          
          if (daysDiff >= 7) {
            // Reset weekly usage
            const updatedStats = {
              ...stats,
              aiSuggestionsThisWeek: 0,
              lastResetDate: currentDate
            };
            setUsageStats(updatedStats);
            await AsyncStorage.setItem(keys.usageStats, JSON.stringify(updatedStats));
            return;
          }
        }
        
        setUsageStats(stats);
      } else {
        const defaultStats = {
          aiSuggestionsThisWeek: 0,
          lastResetDate: new Date().toISOString().split('T')[0],
          featureUsage: {}
        };
        setUsageStats(defaultStats);
        await AsyncStorage.setItem(keys.usageStats, JSON.stringify(defaultStats));
      }
    } catch (error) {
      console.error('Failed to load usage stats:', error);
    }
  };

  // Feature access methods
  const canAddHabit = useCallback((currentHabitCount: number): boolean => {
    const limit = getFeatureLimit('habits', currentTier);
    const canAdd = limit === -1 || currentHabitCount < limit;
    
    if (!canAdd && currentTier === 'free') {
  
      showUpgradeAlert(
        '🎯 You\'ve Mastered 4 Habits!',
        'That\'s incredible progress! You\'re building amazing habits.',
        'habit_limit'
      );
    }
    
    return canAdd;
  }, [currentTier]);

  const canAccessAnalytics = useCallback((days: number): boolean => {
    const limit = getFeatureLimit('analyticsDays', currentTier);
    return limit === -1 || days <= limit;
  }, [currentTier]);

  const canAccessTimeframe = useCallback((timeframe: string): boolean => {
    // Free users can only access week timeframe (7 days)
    if (currentTier === 'free') {
      return timeframe === 'week';
    }
    
    // Pro users can access all timeframes
    return true;
  }, [currentTier]);

  const canUseAI = useCallback((currentUsageThisWeek: number): boolean => {
    const limit = getFeatureLimit('aiSuggestionsPerWeek', currentTier);
    return limit === -1 || currentUsageThisWeek < limit;
  }, [currentTier]);

  const canUseTheme = useCallback((themeId: string): boolean => {
    const tier = getTierById(currentTier);
    if (!tier) return false;
    
    // Free users can only use first 3 themes
    if (currentTier === 'free') {
      const freeThemeIds = ['light', 'dark', 'pastel'];
      return freeThemeIds.includes(themeId);
    }
    
    return true; // Pro+ users can use all themes
  }, [currentTier]);

  const canUseReminders = useCallback((currentReminders: number): boolean => {
    const limit = getFeatureLimit('remindersPerHabit', currentTier);
    return limit === -1 || currentReminders < limit;
  }, [currentTier]);

  const canUseSocialFeatures = useCallback((): boolean => {
    return isFeatureAvailable('socialFeatures', currentTier);
  }, [currentTier]);

  const canExportData = useCallback((): boolean => {
    return isFeatureAvailable('dataExport', currentTier);
  }, [currentTier]);

  const canUseWellnessIntegration = useCallback((): boolean => {
    return isFeatureAvailable('wellnessIntegration', currentTier);
  }, [currentTier]);

  const canUsePerformanceAlerts = useCallback((): boolean => {
    return isFeatureAvailable('performanceAlerts', currentTier);
  }, [currentTier]);

  const canUsePatternInsights = useCallback((): boolean => {
    return isFeatureAvailable('patternInsights', currentTier);
  }, [currentTier]);

  const canUseMoodHabitCorrelations = useCallback((): boolean => {
    return isFeatureAvailable('moodHabitCorrelations', currentTier);
  }, [currentTier]);

  // Subscription management
  const upgradeToPro = async (planDetails?: { id: string; period: 'monthly' | 'yearly' }): Promise<void> => {
    try {
      setIsUpgrading(true);
      
      // Use PaymentService for actual payment processing
      const plan: PaymentPlan = {
        id: planDetails?.id || 'pro-monthly',
        name: planDetails?.period === 'yearly' ? 'Pro Yearly' : 'Pro Monthly',
        price: planDetails?.period === 'yearly' ? 99.99 : 9.99,
        period: planDetails?.period || 'monthly',
        features: [
          'Unlimited habits',
          'Advanced analytics',
          'AI coaching',
          'Premium themes',
          'Data export'
        ]
      };

      const paymentResult = await PaymentService.processPayment(plan);
      
      if (!paymentResult.success) {
        throw new Error(paymentResult.error || 'Payment processing failed');
      }

      if (paymentResult.subscriptionStatus) {
        setSubscriptionStatus(paymentResult.subscriptionStatus);
        setCurrentTier('pro');
        const keys = getStorageKeys();
        await AsyncStorage.setItem(keys.subscription, JSON.stringify(paymentResult.subscriptionStatus));
      }
    } catch (error) {
      console.error('Failed to upgrade to Pro:', error);
      throw error;
    } finally {
      setIsUpgrading(false);
    }
  };

  const downgradeToFree = async (): Promise<void> => {
    try {
      const newStatus: SubscriptionStatus = {
        tier: 'free',
        isActive: true,
        startDate: new Date().toISOString(),
        autoRenew: false,
        platform: 'web'
      };
      
      setSubscriptionStatus(newStatus);
      setCurrentTier('free');
      const keys = getStorageKeys();
      await AsyncStorage.setItem(keys.subscription, JSON.stringify(newStatus));
      
  
    } catch (error) {
      console.error('Failed to downgrade to Free:', error);
      throw error;
    }
  };

  const restorePurchases = async (): Promise<void> => {
    try {
      // Use PaymentService for actual purchase restoration
      const restoredSubscription = await PaymentService.restorePurchases();
      
      if (restoredSubscription) {
        setSubscriptionStatus(restoredSubscription);
        setCurrentTier(restoredSubscription.tier);
        const keys = getStorageKeys();
        await AsyncStorage.setItem(keys.subscription, JSON.stringify(restoredSubscription));
        
    
      } else {
        
      }
    } catch (error) {
      console.error('Failed to restore purchases:', error);
      throw error;
    }
  };

  const showUpgradeAlert = useCallback((title: string, message: string, type: 'default' | 'habit_limit' | 'analytics_limit' | 'ai_limit' | 'onboarding' = 'default') => {

    
    const getFeatureList = (alertType: string) => {
      switch (alertType) {
        case 'habit_limit':
          return [
            '✨ Unlimited habits (no more 4-habit limit)',
            '📊 Advanced analytics & insights',
            '🧠 AI-powered habit coaching',
            '🎨 Premium themes & customization',
            '📱 Smart reminders & notifications',
            '📈 Progress tracking & streaks'
          ];
        case 'analytics_limit':
          return [
            '📊 365-day analytics & trends',
            '📈 Advanced reporting & insights',
            '🎯 Performance optimization tips',
            '📱 Export data & reports',
            '🧠 AI-powered analysis',
            '📊 Custom date ranges'
          ];
        case 'ai_limit':
          return [
            '🧠 Unlimited AI coaching sessions',
            '💡 Personalized habit suggestions',
            '🎯 Smart optimization strategies',
            '📊 AI-powered analytics',
            '🔮 Predictive insights',
            '🎓 Learning from your patterns'
          ];
        case 'onboarding':
          return [
            '✨ Unlimited habits & tracking',
            '📊 Advanced analytics & insights',
            '🧠 AI-powered coaching',
            '🎨 Premium themes & customization',
            '📱 Smart reminders & notifications',
            '📈 Progress tracking & streaks'
          ];
        default:
          return [
            '✨ Unlimited access to all features',
            '📊 Advanced analytics & insights',
            '🧠 AI-powered coaching',
            '🎨 Premium themes & customization',
            '📱 Smart reminders & notifications',
            '📈 Progress tracking & streaks'
          ];
      }
    };

    const features = getFeatureList(type);
    const featureText = features.join('\n• ');
    
    const fullMessage = `${message}\n\n🚀 Upgrade to Pro and unlock:\n• ${featureText}\n\n💎 Only $4.99/month or $39.99/year`;
    
    Alert.alert(
      title,
      fullMessage,
      [
        {
          text: '💪 Maybe Later',
          style: 'cancel',
          onPress: () => {}
        },
        {
          text: '🚀 Upgrade Now',
          style: 'default',
          onPress: () => {
    
            // Navigate to settings with a parameter to show pricing screen
            router.push('/settings?showPricing=true');
          }
        }
      ],
      { cancelable: true }
    );
  }, []);

  // Upgrade prompt system
  const showUpgradePrompt = useCallback((trigger: UpgradePrompt['trigger']) => {

    
    if (currentTier === 'free') {
      
      
      const getTriggerData = (trigger: string) => {
        switch (trigger) {
          case 'habit_limit':
            return {
              title: '🎯 You\'ve Mastered 4 Habits!',
              message: 'That\'s incredible progress! You\'re building amazing habits.'
            };
          case 'analytics_limit':
            return {
              title: '📈 You\'re Loving the Insights!',
              message: 'Ready for deeper analytics and advanced reporting?'
            };
          case 'ai_limit':
            return {
              title: '🧠 You\'ve Discovered AI Coaching!',
              message: 'Ready for unlimited AI insights and personalized suggestions?'
            };
          case 'onboarding':
            return {
              title: '🚀 Start Your Pro Journey!',
              message: 'You\'ve seen what Pro can do! Ready to unlock unlimited potential?'
            };
          default:
            return {
              title: '🌟 Ready to Level Up?',
              message: 'You\'ve reached a limit! Ready to unlock unlimited potential?'
            };
        }
      };
      
      const triggerData = getTriggerData(trigger);
      showUpgradeAlert(triggerData.title, triggerData.message, trigger as any);
    }
  }, [currentTier, showUpgradeAlert]);

  const showDefaultReminder = useCallback(() => {

    showUpgradeAlert(
      '🎉 Amazing Progress!',
      'You\'re building incredible habits! Ready to unlock your full potential?',
      'default'
    );
  }, [showUpgradeAlert]);

  const dismissUpgradePrompt = useCallback((id: string) => {
    const updatedPrompts = upgradePrompts.map(p => 
      p.id === id ? { ...p, shownCount: p.shownCount + 1 } : p
    );
    setUpgradePrompts(updatedPrompts);
    const keys = getStorageKeys();
    AsyncStorage.setItem(keys.upgradePrompts, JSON.stringify(updatedPrompts));
  }, [upgradePrompts]);

  // Analytics
  const trackFeatureUsage = useCallback((feature: string) => {
    const updatedStats = {
      ...usageStats,
      featureUsage: {
        ...usageStats.featureUsage,
        [feature]: (usageStats.featureUsage[feature] || 0) + 1
      }
    };
    
    // Special handling for AI suggestions
    if (feature === 'ai_suggestion_used') {
      updatedStats.aiSuggestionsThisWeek = (updatedStats.aiSuggestionsThisWeek || 0) + 1;
    }
    
    setUsageStats(updatedStats);
    const keys = getStorageKeys();
    AsyncStorage.setItem(keys.usageStats, JSON.stringify(updatedStats));
  }, [usageStats]);

  const getUsageStats = useCallback(() => {
    return usageStats;
  }, [usageStats]);

  // Test function to manually trigger upgrade prompt
  const testUpgradePrompt = useCallback(() => {

    showUpgradePrompt('habit_limit');
  }, [showUpgradePrompt]);

  // Test function to create a subscription that expires in 1 minute (for testing)
  const testExpiringSubscription = useCallback(async () => {
    const startDate = new Date();
    const endDate = new Date(startDate.getTime() + 60 * 1000); // 1 minute from now
    
    const testStatus: SubscriptionStatus = {
      tier: 'pro',
      isActive: true,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      autoRenew: false, // Set to false to test expiration
      platform: 'web',
      period: 'monthly',
      planId: 'pro-monthly'
    };
    
    setSubscriptionStatus(testStatus);
    setCurrentTier('pro');
    const keys = getStorageKeys();
    await AsyncStorage.setItem(keys.subscription, JSON.stringify(testStatus));
    

  }, []);

  // Test function to verify subscription persistence
  const testSubscriptionPersistence = useCallback(async () => {
    try {
      
      
      const keys = getStorageKeys();
      const stored = await AsyncStorage.getItem(keys.subscription);
      
      
      if (stored) {
        const parsed = JSON.parse(stored);
        
        Alert.alert('Persistence Test', `Current tier: ${currentTier}\nStored tier: ${parsed.tier}\nStorage key: ${keys.subscription}`);
      } else {
        Alert.alert('Persistence Test', `Current tier: ${currentTier}\nNo stored data found\nStorage key: ${keys.subscription}`);
      }
    } catch (error) {
      console.error('Failed to test subscription persistence:', error);
      Alert.alert('Test Error', 'Failed to test subscription persistence');
    }
  }, [currentTier, subscriptionStatus]);

  // Get days until subscription expires
  const getDaysUntilExpiry = useCallback((): number | null => {
    if (!subscriptionStatus || subscriptionStatus.tier === 'free' || !subscriptionStatus.endDate) {
      return null; // Free tier or no end date
    }
    
    const now = new Date();
    const endDate = new Date(subscriptionStatus.endDate);
    const timeDiff = endDate.getTime() - now.getTime();
    const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));
    
    return daysDiff > 0 ? daysDiff : 0; // Return 0 if expired
  }, [subscriptionStatus]);

  const value: SubscriptionContextType = {
    currentTier,
    subscriptionStatus,
    isLoading,
    isUpgrading,
    canAddHabit,
    canAccessAnalytics,
    canAccessTimeframe,
    canUseAI,
    canUseTheme,
    canUseReminders,
    canUseSocialFeatures,
    canExportData,
    canUseWellnessIntegration,
    canUsePerformanceAlerts,
    canUsePatternInsights,
    canUseMoodHabitCorrelations,
    isFeatureAvailable: (feature) => isFeatureAvailable(feature, currentTier),
    getFeatureLimit: (feature) => getFeatureLimit(feature, currentTier),
    upgradeToPro,
    downgradeToFree,
    restorePurchases,
    checkSubscriptionStatus,
    getDaysUntilExpiry,
    upgradePrompts,
    showUpgradePrompt,
    dismissUpgradePrompt,
    showUpgradeAlert,
    trackFeatureUsage,
    getUsageStats,
    testUpgradePrompt,
    testExpiringSubscription,
    testSubscriptionPersistence
  };

  return (
    <SubscriptionContext.Provider value={value}>
      {children}
    </SubscriptionContext.Provider>
  );
}

export function useSubscription() {
  const context = useContext(SubscriptionContext);
  if (context === undefined) {
    // Return a default context instead of throwing an error
    return {
      currentTier: 'free',
      subscriptionStatus: null,
      isLoading: true,
      isUpgrading: false,
      canAddHabit: () => true,
      canAccessAnalytics: () => true,
      canAccessTimeframe: () => true,
      canUseAI: () => true,
      canUseTheme: () => true,
      canUseReminders: () => true,
      canUseSocialFeatures: () => true,
      canExportData: () => true,
      canUseWellnessIntegration: () => true,
      canUsePerformanceAlerts: () => true,
      canUsePatternInsights: () => true,
      canUseMoodHabitCorrelations: () => true,
      isFeatureAvailable: () => true,
      getFeatureLimit: () => -1,
      upgradeToPro: async () => { throw new Error('Subscription not initialized'); },
      downgradeToFree: async () => { throw new Error('Subscription not initialized'); },
      restorePurchases: async () => { throw new Error('Subscription not initialized'); },
      checkSubscriptionStatus: async () => { throw new Error('Subscription not initialized'); },
      getDaysUntilExpiry: () => null,
      upgradePrompts: [],
      showUpgradePrompt: () => {},
      dismissUpgradePrompt: () => {},
      showUpgradeAlert: () => {},
      trackFeatureUsage: () => {},
      getUsageStats: () => ({}),
      testUpgradePrompt: () => {},
      testExpiringSubscription: async () => { throw new Error('Subscription not initialized'); },
      testSubscriptionPersistence: async () => { throw new Error('Subscription not initialized'); }
    };
  }
  return context;
} 