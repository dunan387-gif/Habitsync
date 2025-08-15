import { logEvent, setUserId, setUserProperties } from 'firebase/analytics';
import { firebaseAnalytics } from '@/lib/firebase';

export class AnalyticsService {
  // Check if analytics is available (React Native compatibility)
  private static isAnalyticsAvailable(): boolean {
    try {
      // Check if we're in a React Native environment
      if (typeof document === 'undefined' || !document) {
        return false;
      }
      return true;
    } catch (error) {
      return false;
    }
  }

  // Helper method to safely execute analytics calls
  private static safeAnalyticsCall(callback: () => void, methodName: string) {
    if (!this.isAnalyticsAvailable()) {
      console.log(`📊 Analytics not available for ${methodName} in React Native environment`);
      return;
    }
    
    try {
      callback();
    } catch (error) {
      console.error(`Error in ${methodName}:`, error);
    }
  }

  // User identification
  static setUserProperties(userId: string, properties: any) {
    this.safeAnalyticsCall(() => {
      if (firebaseAnalytics) {
        setUserId(firebaseAnalytics, userId);
        setUserProperties(firebaseAnalytics, properties);
      }
    }, 'setUserProperties');
  }

  // Habit tracking events
  static trackHabitCreated(habitTitle: string, category?: string) {
    this.safeAnalyticsCall(() => {
      if (firebaseAnalytics) {
        logEvent(firebaseAnalytics, 'habit_created', {
          habit_title: habitTitle,
          category: category || 'general',
          timestamp: new Date().toISOString()
        });
      }
    }, 'trackHabitCreated');
  }

  static trackHabitCompleted(habitTitle: string, streak: number) {
    this.safeAnalyticsCall(() => {
      if (firebaseAnalytics) {
        logEvent(firebaseAnalytics, 'habit_completed', {
          habit_title: habitTitle,
          current_streak: streak,
          timestamp: new Date().toISOString()
        });
      }
    }, 'trackHabitCompleted');
  }

  static trackHabitSkipped(habitTitle: string, reason?: string) {
    this.safeAnalyticsCall(() => {
      if (firebaseAnalytics) {
        logEvent(firebaseAnalytics, 'habit_skipped', {
          habit_title: habitTitle,
          reason: reason || 'unknown',
          timestamp: new Date().toISOString()
        });
      }
    }, 'trackHabitSkipped');
  }

  static trackHabitDeleted(habitTitle: string, lifetime: number) {
    this.safeAnalyticsCall(() => {
      if (firebaseAnalytics) {
        logEvent(firebaseAnalytics, 'habit_deleted', {
          habit_title: habitTitle,
          lifetime_days: lifetime,
          timestamp: new Date().toISOString()
        });
      }
    }, 'trackHabitDeleted');
  }

  // Mood tracking events
  static trackMoodLogged(moodState: string, intensity: number, context?: string) {
    this.safeAnalyticsCall(() => {
      if (firebaseAnalytics) {
        logEvent(firebaseAnalytics, 'mood_logged', {
          mood_state: moodState,
          intensity: intensity,
          context: context || 'general',
          timestamp: new Date().toISOString()
        });
      }
    }, 'trackMoodLogged');
  }

  static trackMoodTrend(moodState: string, trend: 'improving' | 'declining' | 'stable') {
    this.safeAnalyticsCall(() => {
      if (firebaseAnalytics) {
        logEvent(firebaseAnalytics, 'mood_trend', {
          mood_state: moodState,
          trend: trend,
          timestamp: new Date().toISOString()
        });
      }
    }, 'trackMoodTrend');
  }

  // Feature usage events
  static trackFeatureUsed(featureName: string, additionalData?: any) {
    this.safeAnalyticsCall(() => {
      if (firebaseAnalytics) {
        logEvent(firebaseAnalytics, 'feature_used', {
          feature_name: featureName,
          ...additionalData,
          timestamp: new Date().toISOString()
        });
      }
    }, 'trackFeatureUsed');
  }

  static trackScreenView(screenName: string, screenClass?: string) {
    this.safeAnalyticsCall(() => {
      if (firebaseAnalytics) {
        logEvent(firebaseAnalytics, 'screen_view', {
          firebase_screen: screenName,
          firebase_screen_class: screenClass || screenName,
          timestamp: new Date().toISOString()
        });
      }
    }, 'trackScreenView');
  }

  // User engagement events
  static trackUserEngagement(engagementType: string, duration?: number) {
    this.safeAnalyticsCall(() => {
      if (firebaseAnalytics) {
        logEvent(firebaseAnalytics, 'user_engagement', {
          engagement_type: engagementType,
          duration_seconds: duration || 0,
          timestamp: new Date().toISOString()
        });
      }
    }, 'trackUserEngagement');
  }

  static trackStreakMilestone(streakLength: number, habitTitle: string) {
    this.safeAnalyticsCall(() => {
      if (firebaseAnalytics) {
        logEvent(firebaseAnalytics, 'streak_milestone', {
          streak_length: streakLength,
          habit_title: habitTitle,
          timestamp: new Date().toISOString()
        });
      }
    }, 'trackStreakMilestone');
  }

  // App performance events
  static trackAppPerformance(metric: string, value: number) {
    this.safeAnalyticsCall(() => {
      if (firebaseAnalytics) {
        logEvent(firebaseAnalytics, 'app_performance', {
          metric: metric,
          value: value,
          timestamp: new Date().toISOString()
        });
      }
    }, 'trackAppPerformance');
  }

  static trackError(errorType: string, errorMessage: string, context?: string) {
    this.safeAnalyticsCall(() => {
      if (firebaseAnalytics) {
        logEvent(firebaseAnalytics, 'app_error', {
          error_type: errorType,
          error_message: errorMessage,
          context: context || 'general',
          timestamp: new Date().toISOString()
        });
      }
    }, 'trackError');
  }

  // Subscription and monetization events
  static trackSubscriptionEvent(eventType: string, planName?: string, price?: number) {
    this.safeAnalyticsCall(() => {
      if (firebaseAnalytics) {
        logEvent(firebaseAnalytics, 'subscription_event', {
          event_type: eventType,
          plan_name: planName || 'free',
          price: price || 0,
          timestamp: new Date().toISOString()
        });
      }
    }, 'trackSubscriptionEvent');
  }

  // Onboarding events
  static trackOnboardingStep(stepNumber: number, stepName: string, completed: boolean) {
    this.safeAnalyticsCall(() => {
      if (firebaseAnalytics) {
        logEvent(firebaseAnalytics, 'onboarding_step', {
          step_number: stepNumber,
          step_name: stepName,
          completed: completed,
          timestamp: new Date().toISOString()
        });
      }
    }, 'trackOnboardingStep');
  }

  static trackOnboardingCompleted(totalSteps: number, timeSpent: number) {
    this.safeAnalyticsCall(() => {
      if (firebaseAnalytics) {
        logEvent(firebaseAnalytics, 'onboarding_completed', {
          total_steps: totalSteps,
          time_spent_seconds: timeSpent,
          timestamp: new Date().toISOString()
        });
      }
    }, 'trackOnboardingCompleted');
  }

  // Custom events for specific app features
  static trackAISuggestionUsed(suggestionType: string, accepted: boolean) {
    this.safeAnalyticsCall(() => {
      if (firebaseAnalytics) {
        logEvent(firebaseAnalytics, 'ai_suggestion_used', {
          suggestion_type: suggestionType,
          accepted: accepted,
          timestamp: new Date().toISOString()
        });
      }
    }, 'trackAISuggestionUsed');
  }

  static trackCommunityInteraction(interactionType: string, targetId?: string) {
    this.safeAnalyticsCall(() => {
      if (firebaseAnalytics) {
        logEvent(firebaseAnalytics, 'community_interaction', {
          interaction_type: interactionType,
          target_id: targetId || 'none',
          timestamp: new Date().toISOString()
        });
      }
    }, 'trackCommunityInteraction');
  }

  // Utility method to track multiple events at once
  static trackMultipleEvents(events: Array<{ name: string, parameters: any }>) {
    events.forEach(event => {
      this.safeAnalyticsCall(() => {
        if (firebaseAnalytics) {
          logEvent(firebaseAnalytics, event.name, {
            ...event.parameters,
            timestamp: new Date().toISOString()
          });
        }
      }, `trackMultipleEvents-${event.name}`);
    });
  }
}
