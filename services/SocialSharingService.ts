import AsyncStorage from '@react-native-async-storage/async-storage';
import { EncryptionService } from './EncryptionService';
import { MoodEntry, HabitMoodEntry, Habit } from '../types';

export interface AnonymousPattern {
  id: string;
  patternType: 'mood_improvement' | 'habit_success' | 'correlation_discovery' | 'streak_achievement';
  anonymizedData: {
    pattern: string;
    effectiveness: number; // 1-10
    duration: string; // e.g., "2 weeks", "1 month"
    category: string;
    tags: string[];
  };
  insights: string[];
  sharedAt: string;
  likes: number;
  helpfulCount: number;
  userRegion?: string; // Optional geographic context
  ageGroup?: '18-25' | '26-35' | '36-45' | '46-55' | '55+';
}

export interface SuccessStory {
  id: string;
  title: string;
  story: string;
  category: 'mood_transformation' | 'habit_building' | 'wellness_journey' | 'breakthrough_moment';
  timeline: string;
  keyFactors: string[];
  challenges: string[];
  outcomes: {
    moodImprovement: number; // 1-10
    habitConsistency: number; // 1-10
    overallWellbeing: number; // 1-10
  };
  anonymized: boolean;
  sharedAt: string;
  likes: number;
  comments: Comment[];
  inspirationLevel: 'motivating' | 'inspiring' | 'life_changing';
}

export interface Comment {
  id: string;
  content: string;
  authorId: string; // Anonymous ID
  createdAt: string;
  likes: number;
  supportive: boolean;
}

export interface CommunitySupport {
  id: string;
  type: 'encouragement' | 'advice' | 'check_in' | 'celebration' | 'crisis_support';
  content: string;
  authorId: string; // Anonymous ID
  targetAudience: {
    moodStates?: string[];
    challenges?: string[];
    goals?: string[];
  };
  supportLevel: 'peer' | 'experienced' | 'professional';
  createdAt: string;
  responses: {
    id: string;
    content: string;
    authorId: string;
    helpful: boolean;
    createdAt: string;
  }[];
  helpfulCount: number;
  tags: string[];
}

export interface AccountabilityPartner {
  id: string;
  partnerId: string; // Anonymous ID
  connectionType: 'mutual_goals' | 'complementary_strengths' | 'similar_challenges';
  sharedGoals: {
    habitIds: string[];
    moodTargets: string[];
    checkInFrequency: 'daily' | 'weekly' | 'bi_weekly';
  };
  supportStyle: {
    encouragement: boolean;
    accountability: boolean;
    advice: boolean;
    celebration: boolean;
  };
  matchScore: number; // 1-100 compatibility
  connectionDate: string;
  lastInteraction: string;
  mutualProgress: {
    partnerAProgress: number;
    partnerBProgress: number;
    sharedMilestones: string[];
  };
}

export interface CelebrationShare {
  id: string;
  type: 'mood_milestone' | 'habit_streak' | 'wellness_achievement' | 'breakthrough';
  achievement: {
    title: string;
    description: string;
    category: string;
    significance: 'small_win' | 'major_milestone' | 'life_changing';
  };
  moodJourney: {
    before: {
      state: string;
      intensity: number;
      timeframe: string;
    };
    after: {
      state: string;
      intensity: number;
      improvement: number;
    };
  };
  celebrationStyle: 'humble' | 'proud' | 'grateful' | 'excited';
  sharedAt: string;
  supportReceived: {
    congratulations: number;
    inspired: number;
    similar_experience: number;
  };
  anonymized: boolean;
}

export class SocialSharingService {
  // Anonymous Pattern Sharing
  static async shareAnonymousPattern(moodData: MoodEntry[], habitData: HabitMoodEntry[], habits: Habit[]): Promise<AnonymousPattern> {
    const pattern = this.detectShareablePattern(moodData, habitData, habits);
    
    const anonymousPattern: AnonymousPattern = {
      id: this.generateAnonymousId(),
      patternType: pattern.type,
      anonymizedData: {
        pattern: pattern.description,
        effectiveness: pattern.effectiveness,
        duration: pattern.duration,
        category: pattern.category,
        tags: pattern.tags
      },
      insights: pattern.insights,
      sharedAt: new Date().toISOString(),
      likes: 0,
      helpfulCount: 0,
      userRegion: await this.getAnonymizedRegion(),
      ageGroup: await this.getAnonymizedAgeGroup()
    };

    await this.saveSharedPattern(anonymousPattern);
    return anonymousPattern;
  }

  // Success Story Sharing
  static async shareSuccessStory(story: Omit<SuccessStory, 'id' | 'sharedAt' | 'likes' | 'comments'>): Promise<SuccessStory> {
    const successStory: SuccessStory = {
      ...story,
      id: this.generateAnonymousId(),
      sharedAt: new Date().toISOString(),
      likes: 0,
      comments: []
    };

    await this.saveSuccessStory(successStory);
    return successStory;
  }

  // Community Support
  static async postCommunitySupport(support: Omit<CommunitySupport, 'id' | 'authorId' | 'createdAt' | 'responses' | 'helpfulCount'>): Promise<CommunitySupport> {
    const communitySupport: CommunitySupport = {
      ...support,
      id: this.generateAnonymousId(),
      authorId: await this.getAnonymousUserId(),
      createdAt: new Date().toISOString(),
      responses: [],
      helpfulCount: 0
    };

    await this.saveCommunitySupport(communitySupport);
    return communitySupport;
  }

  // Accountability Partner Matching
  static async findAccountabilityPartner(userPreferences: {
    goals: string[];
    supportStyle: AccountabilityPartner['supportStyle'];
    availability: string[];
    experience: 'beginner' | 'intermediate' | 'advanced';
  }): Promise<AccountabilityPartner[]> {
    const availablePartners = await this.getAvailablePartners();
    
    return availablePartners
      .map(partner => ({
        ...partner,
        matchScore: this.calculatePartnerCompatibility(userPreferences, partner)
      }))
      .filter(partner => partner.matchScore > 60)
      .sort((a, b) => b.matchScore - a.matchScore)
      .slice(0, 5);
  }

  // Celebration Sharing
  static async shareCelebration(celebration: Omit<CelebrationShare, 'id' | 'sharedAt' | 'supportReceived'>): Promise<CelebrationShare> {
    const celebrationShare: CelebrationShare = {
      ...celebration,
      id: this.generateAnonymousId(),
      sharedAt: new Date().toISOString(),
      supportReceived: {
        congratulations: 0,
        inspired: 0,
        similar_experience: 0
      }
    };

    await this.saveCelebration(celebrationShare);
    return celebrationShare;
  }

  // Community Feed
  static async getCommunityFeed(filters: {
    type?: string[];
    category?: string[];
    timeframe?: 'today' | 'week' | 'month' | 'all';
    sortBy?: 'recent' | 'popular' | 'helpful';
  } = {}): Promise<{
    patterns: AnonymousPattern[];
    stories: SuccessStory[];
    support: CommunitySupport[];
    celebrations: CelebrationShare[];
  }> {
    const patterns = await this.getSharedPatterns(filters);
    const stories = await this.getSuccessStories(filters);
    const support = await this.getCommunitySupport(filters);
    const celebrations = await this.getCelebrations(filters);

    return { patterns, stories, support, celebrations };
  }

  // Helper Methods
  private static detectShareablePattern(moodData: MoodEntry[], habitData: HabitMoodEntry[], habits: Habit[]): any {
    // Analyze data to find meaningful patterns worth sharing
    const recentData = moodData.slice(-30); // Last 30 days
    const moodImprovement = this.calculateMoodImprovement(recentData);
    
    if (moodImprovement > 2) {
      return {
        type: 'mood_improvement' as const,
        description: 'Significant mood improvement through consistent habit practice',
        effectiveness: Math.min(10, Math.round(moodImprovement * 2)),
        duration: '30 days',
        category: 'mood_wellness',
        tags: ['mood_improvement', 'consistency', 'habits'],
        insights: [
          'Regular habit completion correlates with mood improvement',
          'Small daily actions compound into significant changes',
          'Tracking progress helps maintain motivation'
        ]
      };
    }

    // Check for habit success patterns
    const successfulHabits = habits.filter(habit => habit.streak > 7);
    if (successfulHabits.length > 0) {
      return {
        type: 'habit_success' as const,
        description: 'Successful habit building strategy',
        effectiveness: 8,
        duration: `${Math.max(...successfulHabits.map(h => h.streak))} days`,
        category: 'habit_building',
        tags: ['habit_formation', 'consistency', 'success'],
        insights: [
          'Starting small and building gradually works',
          'Consistency matters more than perfection',
          'Tracking streaks provides motivation'
        ]
      };
    }

    return {
      type: 'correlation_discovery' as const,
      description: 'Discovered personal mood-habit correlations',
      effectiveness: 6,
      duration: '2 weeks',
      category: 'self_discovery',
      tags: ['correlation', 'awareness', 'patterns'],
      insights: [
        'Self-awareness is the first step to improvement',
        'Personal patterns are unique to each individual',
        'Data helps reveal hidden connections'
      ]
    };
  }

  private static calculateMoodImprovement(moodData: MoodEntry[]): number {
    if (moodData.length < 7) return 0;
    
    const firstWeek = moodData.slice(0, 7);
    const lastWeek = moodData.slice(-7);
    
    const firstWeekAvg = firstWeek.reduce((sum, mood) => sum + mood.intensity, 0) / firstWeek.length;
    const lastWeekAvg = lastWeek.reduce((sum, mood) => sum + mood.intensity, 0) / lastWeek.length;
    
    return lastWeekAvg - firstWeekAvg;
  }

  private static calculatePartnerCompatibility(userPrefs: any, partner: AccountabilityPartner): number {
    let score = 0;
    
    // Goal overlap (40% of score)
    const goalOverlap = userPrefs.goals.filter((goal: string) => 
      partner.sharedGoals.habitIds.includes(goal) || 
      partner.sharedGoals.moodTargets.includes(goal)
    ).length;
    score += (goalOverlap / userPrefs.goals.length) * 40;
    
    // Support style compatibility (30% of score)
    const styleMatches = Object.keys(userPrefs.supportStyle).filter(
      key => userPrefs.supportStyle[key as keyof typeof userPrefs.supportStyle] === partner.supportStyle[key as keyof AccountabilityPartner['supportStyle']]
    ).length;
    score += (styleMatches / Object.keys(userPrefs.supportStyle).length) * 30;
    
    // Experience level compatibility (20% of score)
    score += 20; // Simplified for now
    
    // Availability overlap (10% of score)
    score += 10; // Simplified for now
    
    return Math.min(score, 100);
  }

  private static generateAnonymousId(): string {
    return 'anon_' + Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
  }

  private static async getAnonymousUserId(): Promise<string> {
    let userId = await AsyncStorage.getItem('anonymous_user_id');
    if (!userId) {
      userId = this.generateAnonymousId();
      await AsyncStorage.setItem('anonymous_user_id', userId);
    }
    return userId;
  }

  private static async getAnonymizedRegion(): Promise<string> {
    // Return general region without specific location
    return 'North America'; // Simplified for demo
  }

  private static async getAnonymizedAgeGroup(): Promise<'18-25' | '26-35' | '36-45' | '46-55' | '55+'> {
    // Return age group without specific age
    return '26-35'; // Simplified for demo
  }

  // Storage Methods
  private static async saveSharedPattern(pattern: AnonymousPattern): Promise<void> {
    const patterns = await this.getSharedPatterns();
    const updated = [...patterns, pattern];
    const encrypted = await EncryptionService.encryptMoodData(updated);
    await AsyncStorage.setItem('shared_patterns', encrypted);
  }

  private static async getSharedPatterns(filters: any = {}): Promise<AnonymousPattern[]> {
    try {
      const encrypted = await AsyncStorage.getItem('shared_patterns');
      if (!encrypted) return [];
      const patterns = await EncryptionService.decryptMoodData(encrypted) || [];
      return this.applyFilters(patterns, filters);
    } catch (error) {
      console.error('Error retrieving shared patterns:', error);
      return [];
    }
  }

  private static async saveSuccessStory(story: SuccessStory): Promise<void> {
    const stories = await this.getSuccessStories();
    const updated = [...stories, story];
    const encrypted = await EncryptionService.encryptMoodData(updated);
    await AsyncStorage.setItem('success_stories', encrypted);
  }

  private static async getSuccessStories(filters: any = {}): Promise<SuccessStory[]> {
    try {
      const encrypted = await AsyncStorage.getItem('success_stories');
      if (!encrypted) return [];
      const stories = await EncryptionService.decryptMoodData(encrypted) || [];
      return this.applyFilters(stories, filters);
    } catch (error) {
      console.error('Error retrieving success stories:', error);
      return [];
    }
  }

  private static async saveCommunitySupport(support: CommunitySupport): Promise<void> {
    const supports = await this.getCommunitySupport();
    const updated = [...supports, support];
    const encrypted = await EncryptionService.encryptMoodData(updated);
    await AsyncStorage.setItem('community_support', encrypted);
  }

  private static async getCommunitySupport(filters: any = {}): Promise<CommunitySupport[]> {
    try {
      const encrypted = await AsyncStorage.getItem('community_support');
      if (!encrypted) return [];
      const support = await EncryptionService.decryptMoodData(encrypted) || [];
      return this.applyFilters(support, filters);
    } catch (error) {
      console.error('Error retrieving community support:', error);
      return [];
    }
  }

  private static async saveCelebration(celebration: CelebrationShare): Promise<void> {
    const celebrations = await this.getCelebrations();
    const updated = [...celebrations, celebration];
    const encrypted = await EncryptionService.encryptMoodData(updated);
    await AsyncStorage.setItem('celebrations', encrypted);
  }

  private static async getCelebrations(filters: any = {}): Promise<CelebrationShare[]> {
    try {
      const encrypted = await AsyncStorage.getItem('celebrations');
      if (!encrypted) return [];
      const celebrations = await EncryptionService.decryptMoodData(encrypted) || [];
      return this.applyFilters(celebrations, filters);
    } catch (error) {
      console.error('Error retrieving celebrations:', error);
      return [];
    }
  }

  private static async getAvailablePartners(): Promise<AccountabilityPartner[]> {
    try {
      const encrypted = await AsyncStorage.getItem('available_partners');
      if (!encrypted) return [];
      return await EncryptionService.decryptMoodData(encrypted) || [];
    } catch (error) {
      console.error('Error retrieving available partners:', error);
      return [];
    }
  }

  private static applyFilters(data: any[], filters: any): any[] {
    let filtered = [...data];
    
    if (filters.timeframe) {
      const now = new Date();
      const timeLimits: Record<string, number> = {
        today: 1,
        week: 7,
        month: 30,
        all: Infinity
      };
      const timeLimit = timeLimits[filters.timeframe as keyof typeof timeLimits] || Infinity;
      
      filtered = filtered.filter(item => {
        const itemDate = new Date(item.sharedAt || item.createdAt);
        const daysDiff = (now.getTime() - itemDate.getTime()) / (1000 * 60 * 60 * 24);
        return daysDiff <= timeLimit;
      });
    }
    
    if (filters.type && filters.type.length > 0) {
      filtered = filtered.filter(item => 
        filters.type.includes(item.type || item.patternType || item.category)
      );
    }
    
    if (filters.sortBy) {
      filtered.sort((a, b) => {
        switch (filters.sortBy) {
          case 'recent':
            return new Date(b.sharedAt || b.createdAt).getTime() - new Date(a.sharedAt || a.createdAt).getTime();
          case 'popular':
            return (b.likes || 0) - (a.likes || 0);
          case 'helpful':
            return (b.helpfulCount || 0) - (a.helpfulCount || 0);
          default:
            return 0;
        }
      });
    }
    
    return filtered;
  }
}