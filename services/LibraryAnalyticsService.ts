import AsyncStorage from '@react-native-async-storage/async-storage';
import { SocialSharingService } from './SocialSharingService';
// import SupabaseCommunityService from './SupabaseCommunityService'; // Temporarily disabled for Firebase migration

export interface LibraryAnalytics {
  totalVisits: number;
  timeSpentInLibrary: number; // in seconds
  lastVisitDate: string;
  habitsViewed: string[]; // habit IDs
  habitsAdded: string[]; // habit IDs
  categoriesViewed: string[]; // category IDs
  searchQueries: string[];
  myHabitsTabUsage: number;
  suggestionsTabUsage: number;
  aiSuggestionsViewed: number;
  aiSuggestionsAdded: number;
  feedbackSubmitted: boolean;
  feedbackRating?: number;
  feedbackText?: string;
  habitsFormed: string[];
  habitsAbandoned: string[];
  preferredCategories: string[];
  preferredDifficulty: 'beginner' | 'intermediate' | 'advanced';
  preferredTimeOfDay: 'morning' | 'afternoon' | 'evening' | 'anytime';
  // Enhanced integration fields
  coursesEnrolled: string[];
  coursesCompleted: string[];
  modulesCompleted: string[];
  guidedSetupsCompleted: string[];
  learningStreak: number;
  knowledgeShared: number;
  communityInteractions: number;
  crossFeatureUsage: {
    habitCreationFromLibrary: number;
    moodTrackingFromLibrary: number;
    communitySharingFromLibrary: number;
    analyticsFromLibrary: number;
  };
}

export interface LibraryEvent {
  eventType: 'visit' | 'habit_view' | 'habit_add' | 'category_view' | 'search' | 'ai_suggestion_view' | 'ai_suggestion_add' | 'feedback_submit' | 'tab_switch' | 'course_enroll' | 'course_complete' | 'module_complete' | 'guided_setup_complete' | 'knowledge_share' | 'community_interaction';
  timestamp: string;
  data: any;
}

export interface LibraryInsights {
  mostViewedCategories: string[];
  mostAddedHabits: string[];
  popularSearchTerms: string[];
  userEngagementScore: number;
  learningProgress: {
    coursesCompleted: number;
    modulesCompleted: number;
    guidedSetupsCompleted: number;
    averageCompletionTime: number;
  };
  communityImpact: {
    knowledgeShared: number;
    communityInteractions: number;
    influenceScore: number;
  };
  crossFeatureUsage: {
    habitCreationRate: number;
    moodTrackingRate: number;
    communitySharingRate: number;
  };
  recommendations: {
    suggestedCourses: string[];
    suggestedHabits: string[];
    suggestedCommunityActions: string[];
  };
}

class LibraryAnalyticsService {
  private static readonly ANALYTICS_KEY = '@library_analytics';
  private static readonly EVENTS_KEY = '@library_events';
  private static readonly USER_PREFERENCES_KEY = '@library_user_preferences';

  /**
   * Initialize analytics for a user
   */
  static async initializeAnalytics(userId: string): Promise<void> {
    try {
      const existing = await this.getAnalytics(userId);
      if (!existing) {
        const initialAnalytics: LibraryAnalytics = {
          totalVisits: 0,
          timeSpentInLibrary: 0,
          lastVisitDate: new Date().toISOString(),
          habitsViewed: [],
          habitsAdded: [],
          categoriesViewed: [],
          searchQueries: [],
          myHabitsTabUsage: 0,
          suggestionsTabUsage: 0,
          aiSuggestionsViewed: 0,
          aiSuggestionsAdded: 0,
          feedbackSubmitted: false,
          habitsFormed: [],
          habitsAbandoned: [],
          preferredCategories: [],
          preferredDifficulty: 'beginner',
          preferredTimeOfDay: 'anytime',
          coursesEnrolled: [],
          coursesCompleted: [],
          modulesCompleted: [],
          guidedSetupsCompleted: [],
          learningStreak: 0,
          knowledgeShared: 0,
          communityInteractions: 0,
          crossFeatureUsage: {
            habitCreationFromLibrary: 0,
            moodTrackingFromLibrary: 0,
            communitySharingFromLibrary: 0,
            analyticsFromLibrary: 0,
          },
        };
        
        await AsyncStorage.setItem(
          `${this.ANALYTICS_KEY}_${userId}`,
          JSON.stringify(initialAnalytics)
        );
      }
    } catch (error) {
      console.error('Error initializing Library analytics:', error);
    }
  }

  /**
   * Track a Library visit
   */
  static async trackVisit(userId: string): Promise<void> {
    try {
      const analytics = await this.getAnalytics(userId);
      if (analytics) {
        analytics.totalVisits += 1;
        analytics.lastVisitDate = new Date().toISOString();
        await this.saveAnalytics(userId, analytics);
        
        await this.logEvent(userId, {
          eventType: 'visit',
          timestamp: new Date().toISOString(),
          data: { visitNumber: analytics.totalVisits }
        });
      }
    } catch (error) {
      console.error('Error tracking Library visit:', error);
    }
  }

  /**
   * Track time spent in Library
   */
  static async trackTimeSpent(userId: string, seconds: number): Promise<void> {
    try {
      const analytics = await this.getAnalytics(userId);
      if (analytics) {
        analytics.timeSpentInLibrary += seconds;
        await this.saveAnalytics(userId, analytics);
      }
    } catch (error) {
      console.error('Error tracking time spent:', error);
    }
  }

  /**
   * Track habit view
   */
  static async trackHabitView(userId: string, habitId: string, habitTitle: string): Promise<void> {
    try {
      const analytics = await this.getAnalytics(userId);
      if (analytics && !analytics.habitsViewed.includes(habitId)) {
        analytics.habitsViewed.push(habitId);
        await this.saveAnalytics(userId, analytics);
        
        await this.logEvent(userId, {
          eventType: 'habit_view',
          timestamp: new Date().toISOString(),
          data: { habitId, habitTitle }
        });
      }
    } catch (error) {
      console.error('Error tracking habit view:', error);
    }
  }

  /**
   * Track habit addition
   */
  static async trackHabitAdd(userId: string, habitId: string, habitTitle: string, source: 'suggestion' | 'ai' | 'custom'): Promise<void> {
    try {
      const analytics = await this.getAnalytics(userId);
      if (analytics) {
        analytics.habitsAdded.push(habitId);
        await this.saveAnalytics(userId, analytics);
        
        await this.logEvent(userId, {
          eventType: 'habit_add',
          timestamp: new Date().toISOString(),
          data: { habitId, habitTitle, source }
        });
      }
    } catch (error) {
      console.error('Error tracking habit add:', error);
    }
  }

  /**
   * Track category view
   */
  static async trackCategoryView(userId: string, categoryId: string, categoryName: string): Promise<void> {
    try {
      const analytics = await this.getAnalytics(userId);
      if (analytics && !analytics.categoriesViewed.includes(categoryId)) {
        analytics.categoriesViewed.push(categoryId);
        await this.saveAnalytics(userId, analytics);
        
        await this.logEvent(userId, {
          eventType: 'category_view',
          timestamp: new Date().toISOString(),
          data: { categoryId, categoryName }
        });
      }
    } catch (error) {
      console.error('Error tracking category view:', error);
    }
  }

  /**
   * Track search query
   */
  static async trackSearch(userId: string, query: string): Promise<void> {
    try {
      const analytics = await this.getAnalytics(userId);
      if (analytics) {
        analytics.searchQueries.push(query);
        await this.saveAnalytics(userId, analytics);
        
        await this.logEvent(userId, {
          eventType: 'search',
          timestamp: new Date().toISOString(),
          data: { query }
        });
      }
    } catch (error) {
      console.error('Error tracking search:', error);
    }
  }

  /**
   * Track tab usage
   */
  static async trackTabUsage(userId: string, tab: 'my_habits' | 'suggestions'): Promise<void> {
    try {
      const analytics = await this.getAnalytics(userId);
      if (analytics) {
        if (tab === 'my_habits') {
          analytics.myHabitsTabUsage += 1;
        } else {
          analytics.suggestionsTabUsage += 1;
        }
        await this.saveAnalytics(userId, analytics);
        
        await this.logEvent(userId, {
          eventType: 'tab_switch',
          timestamp: new Date().toISOString(),
          data: { tab }
        });
      }
    } catch (error) {
      console.error('Error tracking tab usage:', error);
    }
  }

  /**
   * Track AI suggestion interaction
   */
  static async trackAISuggestion(userId: string, action: 'view' | 'add', suggestionId: string): Promise<void> {
    try {
      const analytics = await this.getAnalytics(userId);
      if (analytics) {
        if (action === 'view') {
          analytics.aiSuggestionsViewed += 1;
        } else {
          analytics.aiSuggestionsAdded += 1;
        }
        await this.saveAnalytics(userId, analytics);
        
        await this.logEvent(userId, {
          eventType: action === 'view' ? 'ai_suggestion_view' : 'ai_suggestion_add',
          timestamp: new Date().toISOString(),
          data: { suggestionId }
        });
      }
    } catch (error) {
      console.error('Error tracking AI suggestion:', error);
    }
  }

  /**
   * Track user feedback
   */
  static async trackFeedback(userId: string, rating: number, text?: string): Promise<void> {
    try {
      const analytics = await this.getAnalytics(userId);
      if (analytics) {
        analytics.feedbackSubmitted = true;
        analytics.feedbackRating = rating;
        analytics.feedbackText = text;
        await this.saveAnalytics(userId, analytics);
        
        await this.logEvent(userId, {
          eventType: 'feedback_submit',
          timestamp: new Date().toISOString(),
          data: { rating, text }
        });
      }
    } catch (error) {
      console.error('Error tracking feedback:', error);
    }
  }

  /**
   * Track habit formation success
   */
  static async trackHabitFormed(userId: string, habitId: string): Promise<void> {
    try {
      const analytics = await this.getAnalytics(userId);
      if (analytics && !analytics.habitsFormed.includes(habitId)) {
        analytics.habitsFormed.push(habitId);
        await this.saveAnalytics(userId, analytics);
      }
    } catch (error) {
      console.error('Error tracking habit formation:', error);
    }
  }

  /**
   * Track habit abandonment
   */
  static async trackHabitAbandoned(userId: string, habitId: string): Promise<void> {
    try {
      const analytics = await this.getAnalytics(userId);
      if (analytics && !analytics.habitsAbandoned.includes(habitId)) {
        analytics.habitsAbandoned.push(habitId);
        await this.saveAnalytics(userId, analytics);
      }
    } catch (error) {
      console.error('Error tracking habit abandonment:', error);
    }
  }

  /**
   * Update user preferences
   */
  static async updateUserPreferences(
    userId: string, 
    preferences: Partial<Pick<LibraryAnalytics, 'preferredCategories' | 'preferredDifficulty' | 'preferredTimeOfDay'>>
  ): Promise<void> {
    try {
      const analytics = await this.getAnalytics(userId);
      if (analytics) {
        Object.assign(analytics, preferences);
        await this.saveAnalytics(userId, analytics);
      }
    } catch (error) {
      console.error('Error updating user preferences:', error);
    }
  }

  /**
   * Get analytics for a user
   */
  static async getAnalytics(userId: string): Promise<LibraryAnalytics | null> {
    try {
      const data = await AsyncStorage.getItem(`${this.ANALYTICS_KEY}_${userId}`);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Error getting Library analytics:', error);
      return null;
    }
  }

  /**
   * Get all events for a user
   */
  static async getEvents(userId: string): Promise<LibraryEvent[]> {
    try {
      const data = await AsyncStorage.getItem(`${this.EVENTS_KEY}_${userId}`);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error getting Library events:', error);
      return [];
    }
  }

  /**
   * Get Library insights for a user
   */
  static async getLibraryInsights(userId: string): Promise<LibraryInsights> {
    try {
      const analytics = await this.getAnalytics(userId);
      const events = await this.getEvents(userId);
      
      if (!analytics) {
        return {
          mostViewedCategories: [],
          mostAddedHabits: [],
          popularSearchTerms: [],
          userEngagementScore: 0,
          learningProgress: {
            coursesCompleted: 0,
            modulesCompleted: 0,
            guidedSetupsCompleted: 0,
            averageCompletionTime: 0,
          },
          communityImpact: {
            knowledgeShared: 0,
            communityInteractions: 0,
            influenceScore: 0,
          },
          crossFeatureUsage: {
            habitCreationRate: 0,
            moodTrackingRate: 0,
            communitySharingRate: 0,
          },
          recommendations: {
            suggestedCourses: [],
            suggestedHabits: [],
            suggestedCommunityActions: [],
          },
        };
      }

      // Ensure all array properties exist and are arrays
      const safeAnalytics = {
        ...analytics,
        habitsAdded: Array.isArray(analytics.habitsAdded) ? analytics.habitsAdded : [],
        habitsFormed: Array.isArray(analytics.habitsFormed) ? analytics.habitsFormed : [],
        categoriesViewed: Array.isArray(analytics.categoriesViewed) ? analytics.categoriesViewed : [],
        searchQueries: Array.isArray(analytics.searchQueries) ? analytics.searchQueries : [],
        coursesCompleted: Array.isArray(analytics.coursesCompleted) ? analytics.coursesCompleted : [],
        modulesCompleted: Array.isArray(analytics.modulesCompleted) ? analytics.modulesCompleted : [],
        guidedSetupsCompleted: Array.isArray(analytics.guidedSetupsCompleted) ? analytics.guidedSetupsCompleted : [],
        knowledgeShared: typeof analytics.knowledgeShared === 'number' ? analytics.knowledgeShared : 0,
        communityInteractions: typeof analytics.communityInteractions === 'number' ? analytics.communityInteractions : 0,
      };

      // Calculate insights
      const habitFormationRate = safeAnalytics.habitsAdded.length > 0 
        ? (safeAnalytics.habitsFormed.length / safeAnalytics.habitsAdded.length) * 100 
        : 0;

      const averageTimeSpent = safeAnalytics.totalVisits > 0 
        ? safeAnalytics.timeSpentInLibrary / safeAnalytics.totalVisits 
        : 0;

      return {
        mostViewedCategories: safeAnalytics.categoriesViewed.slice(0, 3),
        mostAddedHabits: safeAnalytics.habitsAdded.slice(0, 5),
        popularSearchTerms: safeAnalytics.searchQueries.slice(-10), // Last 10 searches
        userEngagementScore: 0, // Placeholder, needs actual calculation
        learningProgress: {
          coursesCompleted: safeAnalytics.coursesCompleted.length,
          modulesCompleted: safeAnalytics.modulesCompleted.length,
          guidedSetupsCompleted: safeAnalytics.guidedSetupsCompleted.length,
          averageCompletionTime: 0, // Placeholder
        },
        communityImpact: {
          knowledgeShared: safeAnalytics.knowledgeShared,
          communityInteractions: safeAnalytics.communityInteractions,
          influenceScore: 0, // Placeholder
        },
        crossFeatureUsage: {
          habitCreationRate: 0, // Placeholder
          moodTrackingRate: 0, // Placeholder
          communitySharingRate: 0, // Placeholder
        },
        recommendations: {
          suggestedCourses: [], // Placeholder
          suggestedHabits: [], // Placeholder
          suggestedCommunityActions: [], // Placeholder
        },
      };
    } catch (error) {
      console.error('Error getting Library insights:', error);
      return {
        mostViewedCategories: [],
        mostAddedHabits: [],
        popularSearchTerms: [],
        userEngagementScore: 0,
        learningProgress: {
          coursesCompleted: 0,
          modulesCompleted: 0,
          guidedSetupsCompleted: 0,
          averageCompletionTime: 0,
        },
        communityImpact: {
          knowledgeShared: 0,
          communityInteractions: 0,
          influenceScore: 0,
        },
        crossFeatureUsage: {
          habitCreationRate: 0,
          moodTrackingRate: 0,
          communitySharingRate: 0,
        },
        recommendations: {
          suggestedCourses: [],
          suggestedHabits: [],
          suggestedCommunityActions: [],
        },
      };
    }
  }

  /**
   * Save analytics for a user
   */
  private static async saveAnalytics(userId: string, analytics: LibraryAnalytics): Promise<void> {
    try {
      await AsyncStorage.setItem(
        `${this.ANALYTICS_KEY}_${userId}`,
        JSON.stringify(analytics)
      );
    } catch (error) {
      console.error('Error saving Library analytics:', error);
    }
  }

  /**
   * Log an event
   */
  private static async logEvent(userId: string, event: LibraryEvent): Promise<void> {
    try {
      const events = await this.getEvents(userId);
      events.push(event);
      
      // Keep only last 1000 events
      if (events.length > 1000) {
        events.splice(0, events.length - 1000);
      }
      
      await AsyncStorage.setItem(
        `${this.EVENTS_KEY}_${userId}`,
        JSON.stringify(events)
      );
    } catch (error) {
      console.error('Error logging Library event:', error);
    }
  }

  /**
   * Clear analytics for a user (for privacy)
   */
  static async clearAnalytics(userId: string): Promise<void> {
    try {
      await AsyncStorage.removeItem(`${this.ANALYTICS_KEY}_${userId}`);
      await AsyncStorage.removeItem(`${this.EVENTS_KEY}_${userId}`);
    } catch (error) {
      console.error('Error clearing Library analytics:', error);
    }
  }

  /**
   * Track course enrollment
   */
  static async trackCourseEnrollment(userId: string, courseId: string, courseTitle: string): Promise<void> {
    try {
      await this.logEvent(userId, {
        eventType: 'course_enroll',
        timestamp: new Date().toISOString(),
        data: { courseId, courseTitle }
      });

      const analytics = await this.getAnalytics(userId);
      if (analytics) {
        if (!analytics.coursesEnrolled) {
          analytics.coursesEnrolled = [];
        }
        analytics.coursesEnrolled.push(courseId);
        await this.saveAnalytics(userId, analytics);
      }
    } catch (error) {
      console.error('Failed to track course enrollment:', error);
    }
  }

  /**
   * Track course completion
   */
  static async trackCourseCompletion(userId: string, courseId: string, courseTitle: string): Promise<void> {
    try {
      await this.logEvent(userId, {
        eventType: 'course_complete',
        timestamp: new Date().toISOString(),
        data: { courseId, courseTitle }
      });

      const analytics = await this.getAnalytics(userId);
      if (analytics) {
        if (!analytics.coursesCompleted) {
          analytics.coursesCompleted = [];
        }
        analytics.coursesCompleted.push(courseId);
        await this.saveAnalytics(userId, analytics);
      }
    } catch (error) {
      console.error('Failed to track course completion:', error);
    }
  }

  /**
   * Track module completion
   */
  static async trackModuleCompletion(userId: string, courseId: string, moduleId: string, moduleTitle: string): Promise<void> {
    try {
      await this.logEvent(userId, {
        eventType: 'module_complete',
        timestamp: new Date().toISOString(),
        data: { courseId, moduleId, moduleTitle }
      });

      const analytics = await this.getAnalytics(userId);
      if (analytics) {
        if (!analytics.modulesCompleted) {
          analytics.modulesCompleted = [];
        }
        analytics.modulesCompleted.push(moduleId);
        await this.saveAnalytics(userId, analytics);
      }
    } catch (error) {
      console.error('Failed to track module completion:', error);
    }
  }

  /**
   * Track guided setup completion
   */
  static async trackGuidedSetupCompletion(userId: string, setupId: string, setupTitle: string): Promise<void> {
    try {
      await this.logEvent(userId, {
        eventType: 'guided_setup_complete',
        timestamp: new Date().toISOString(),
        data: { setupId, setupTitle }
      });

      const analytics = await this.getAnalytics(userId);
      if (analytics) {
        if (!analytics.guidedSetupsCompleted) {
          analytics.guidedSetupsCompleted = [];
        }
        analytics.guidedSetupsCompleted.push(setupId);
        await this.saveAnalytics(userId, analytics);
      }
    } catch (error) {
      console.error('Failed to track guided setup completion:', error);
    }
  }

  /**
   * Track knowledge sharing
   */
  static async trackKnowledgeSharing(userId: string, type: 'course_insight' | 'community_post' | 'feedback', content?: string): Promise<void> {
    try {
      await this.logEvent(userId, {
        eventType: 'knowledge_share',
        timestamp: new Date().toISOString(),
        data: { type, content }
      });

      const analytics = await this.getAnalytics(userId);
      if (analytics) {
        analytics.knowledgeShared = (analytics.knowledgeShared || 0) + 1;
        await this.saveAnalytics(userId, analytics);
      }
    } catch (error) {
      console.error('Failed to track knowledge sharing:', error);
    }
  }

  /**
   * Track community interaction
   */
  static async trackCommunityInteraction(userId: string, interactionType: string, targetId?: string): Promise<void> {
    try {
      await this.logEvent(userId, {
        eventType: 'community_interaction',
        timestamp: new Date().toISOString(),
        data: { interactionType, targetId }
      });

      const analytics = await this.getAnalytics(userId);
      if (analytics) {
        analytics.communityInteractions = (analytics.communityInteractions || 0) + 1;
        await this.saveAnalytics(userId, analytics);
      }
    } catch (error) {
      console.error('Failed to track community interaction:', error);
    }
  }

  /**
   * Track cross-feature usage
   */
  static async trackCrossFeatureUsage(userId: string, feature: 'habit_creation' | 'mood_tracking' | 'community_sharing' | 'analytics'): Promise<void> {
    try {
      const analytics = await this.getAnalytics(userId);
      
      if (analytics) {
        if (!analytics.crossFeatureUsage) {
          analytics.crossFeatureUsage = {
            habitCreationFromLibrary: 0,
            moodTrackingFromLibrary: 0,
            communitySharingFromLibrary: 0,
            analyticsFromLibrary: 0,
          };
        }
        
        switch (feature) {
          case 'habit_creation':
            analytics.crossFeatureUsage.habitCreationFromLibrary += 1;
            break;
          case 'mood_tracking':
            analytics.crossFeatureUsage.moodTrackingFromLibrary += 1;
            break;
          case 'community_sharing':
            analytics.crossFeatureUsage.communitySharingFromLibrary += 1;
            break;
          case 'analytics':
            analytics.crossFeatureUsage.analyticsFromLibrary += 1;
            break;
        }
        
        await this.saveAnalytics(userId, analytics);
      }
    } catch (error) {
      console.error('Failed to track cross-feature usage:', error);
    }
  }

  /**
   * Get integrated insights combining Library and community data
   */
  static async getIntegratedInsights(userId: string): Promise<{
    libraryInsights: LibraryInsights;
    communityData: any;
    crossFeatureData: any;
  }> {
    try {
      const libraryInsights = await this.getLibraryInsights(userId);
      
      // Get community data - temporarily disabled for Firebase migration
      let communityData = {};
      try {
        // TODO: Implement community data retrieval with Firebase
        const userPosts: any[] = [];
        communityData = { posts: userPosts };
      } catch (communityError) {
        console.warn('Community service not available:', communityError);
      }
      
      // Get cross-feature usage data
      const analytics = await this.getAnalytics(userId);
      const crossFeatureData = {
        totalInteractions: analytics?.crossFeatureUsage ? 
          (analytics.crossFeatureUsage.habitCreationFromLibrary || 0) + 
          (analytics.crossFeatureUsage.moodTrackingFromLibrary || 0) + 
          (analytics.crossFeatureUsage.communitySharingFromLibrary || 0) + 
          (analytics.crossFeatureUsage.analyticsFromLibrary || 0) : 0,
        featureBreakdown: analytics?.crossFeatureUsage || {
          habitCreationFromLibrary: 0,
          moodTrackingFromLibrary: 0,
          communitySharingFromLibrary: 0,
          analyticsFromLibrary: 0,
        },
        integrationScore: 0 // Placeholder for calculated integration score
      };

      return {
        libraryInsights,
        communityData,
        crossFeatureData
      };
    } catch (error) {
      console.error('Failed to get integrated insights:', error);
      return {
        libraryInsights: await this.getLibraryInsights(userId),
        communityData: {},
        crossFeatureData: {}
      };
    }
  }
}

export default LibraryAnalyticsService;
