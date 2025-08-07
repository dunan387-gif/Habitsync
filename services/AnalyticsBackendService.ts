// Analytics Backend Service for Frontend

import { createClient } from '@supabase/supabase-js';
import { 
  AnalyticsRequest, 
  AnalyticsResponse, 
  DailyAnalytics, 
  WeeklyAnalytics, 
  MonthlyAnalytics,
  MoodHabitCorrelation,
  PredictiveAnalytics,
  UserStats,
  Habit,
  HabitCompletion,
  MoodEntry,
  HabitMoodCorrelation as HabitMoodCorrelationType,
  UserProfile
} from '@/types/analytics';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

export class AnalyticsBackendService {
  // Get analytics with caching
  static async getAnalytics(request: Omit<AnalyticsRequest, 'userId'>): Promise<AnalyticsResponse> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const response = await fetch(`${supabaseUrl}/functions/v1/get-analytics`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await supabase.auth.getSession().then(s => s.data.session?.access_token)}`
        },
        body: JSON.stringify({
          ...request,
          userId: user.id
        })
      });

      if (!response.ok) {
        throw new Error(`Analytics request failed: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Analytics error:', error);
      throw error;
    }
  }

  // Get user stats
  static async getUserStats(): Promise<UserStats> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const response = await fetch(`${supabaseUrl}/functions/v1/get-user-stats`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${await supabase.auth.getSession().then(s => s.data.session?.access_token)}`
        }
      });

      if (!response.ok) {
        throw new Error(`User stats request failed: ${response.statusText}`);
      }

      const result = await response.json();
      return result.data;
    } catch (error) {
      console.error('User stats error:', error);
      throw error;
    }
  }

  // Update habit completion
  static async updateHabitCompletion(habitId: string, data: {
    count?: number;
    notes?: string;
    preMood?: { moodState: string; intensity: number; triggers?: string[] };
    postMood?: { moodState: string; intensity: number; timeAfter: number; triggers?: string[] };
  }): Promise<{ completionId: string; currentStreak: number; longestStreak: number }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const response = await fetch(`${supabaseUrl}/functions/v1/update-habit-completion`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await supabase.auth.getSession().then(s => s.data.session?.access_token)}`
        },
        body: JSON.stringify({
          habitId,
          ...data
        })
      });

      if (!response.ok) {
        throw new Error(`Habit completion request failed: ${response.statusText}`);
      }

      const result = await response.json();
      return result.data;
    } catch (error) {
      console.error('Habit completion error:', error);
      throw error;
    }
  }

  // CRUD operations for habits
  static async getHabits(): Promise<Habit[]> {
    try {
      const { data, error } = await supabase
        .from('habits')
        .select('*')
        .eq('is_active', true)
        .order('order_index');

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Get habits error:', error);
      throw error;
    }
  }

  static async createHabit(habit: Omit<Habit, 'id' | 'userId' | 'createdAt' | 'updatedAt'>): Promise<Habit> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('habits')
        .insert({
          ...habit,
          user_id: user.id
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Create habit error:', error);
      throw error;
    }
  }

  static async updateHabit(habitId: string, updates: Partial<Habit>): Promise<Habit> {
    try {
      const { data, error } = await supabase
        .from('habits')
        .update(updates)
        .eq('id', habitId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Update habit error:', error);
      throw error;
    }
  }

  static async deleteHabit(habitId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('habits')
        .update({ is_active: false })
        .eq('id', habitId);

      if (error) throw error;
    } catch (error) {
      console.error('Delete habit error:', error);
      throw error;
    }
  }

  // CRUD operations for mood entries
  static async getMoodEntries(startDate?: string, endDate?: string): Promise<MoodEntry[]> {
    try {
      let query = supabase
        .from('mood_entries')
        .select('*')
        .order('entry_date', { ascending: false });

      if (startDate) {
        query = query.gte('entry_date', startDate);
      }
      if (endDate) {
        query = query.lte('entry_date', endDate);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Get mood entries error:', error);
      throw error;
    }
  }

  static async createMoodEntry(moodEntry: Omit<MoodEntry, 'id' | 'userId' | 'createdAt'>): Promise<MoodEntry> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('mood_entries')
        .insert({
          ...moodEntry,
          user_id: user.id
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Create mood entry error:', error);
      throw error;
    }
  }

  // Get habit completions
  static async getHabitCompletions(habitId?: string, startDate?: string, endDate?: string): Promise<HabitCompletion[]> {
    try {
      let query = supabase
        .from('habit_completions')
        .select('*')
        .order('completion_date', { ascending: false });

      if (habitId) {
        query = query.eq('habit_id', habitId);
      }
      if (startDate) {
        query = query.gte('completion_date', startDate);
      }
      if (endDate) {
        query = query.lte('completion_date', endDate);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Get habit completions error:', error);
      throw error;
    }
  }

  // Get habit-mood correlations
  static async getHabitMoodCorrelations(habitId?: string): Promise<HabitMoodCorrelationType[]> {
    try {
      let query = supabase
        .from('habit_mood_correlations')
        .select('*')
        .order('correlation_date', { ascending: false });

      if (habitId) {
        query = query.eq('habit_id', habitId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Get habit-mood correlations error:', error);
      throw error;
    }
  }

  // User profile operations
  static async getUserProfile(): Promise<UserProfile | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') throw error; // PGRST116 = no rows returned
      return data;
    } catch (error) {
      console.error('Get user profile error:', error);
      throw error;
    }
  }

  static async updateUserProfile(updates: Partial<UserProfile>): Promise<UserProfile> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('user_profiles')
        .upsert({
          id: user.id,
          email: user.email!,
          ...updates
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Update user profile error:', error);
      throw error;
    }
  }

  // Analytics convenience methods
  static async getDailyAnalytics(): Promise<DailyAnalytics> {
    const response = await this.getAnalytics({ type: 'daily' });
    return response.data;
  }

  static async getWeeklyAnalytics(): Promise<WeeklyAnalytics> {
    const response = await this.getAnalytics({ type: 'weekly' });
    return response.data;
  }

  static async getMonthlyAnalytics(): Promise<MonthlyAnalytics> {
    const response = await this.getAnalytics({ type: 'monthly' });
    return response.data;
  }

  static async getMoodHabitCorrelations(): Promise<MoodHabitCorrelation[]> {
    const response = await this.getAnalytics({ type: 'correlation' });
    return response.data;
  }

  static async getPredictiveAnalytics(): Promise<PredictiveAnalytics[]> {
    const response = await this.getAnalytics({ type: 'prediction' });
    return response.data;
  }

  // Sync local data with backend
  static async syncLocalData(localHabits: any[], localMoodEntries: any[]): Promise<void> {
    try {
      // Sync habits
      for (const habit of localHabits) {
        if (habit.needsSync) {
          if (habit.id.startsWith('local_')) {
            // New habit
            await this.createHabit(habit);
          } else {
            // Update existing habit
            await this.updateHabit(habit.id, habit);
          }
        }
      }

      // Sync mood entries
      for (const moodEntry of localMoodEntries) {
        if (moodEntry.needsSync) {
          await this.createMoodEntry(moodEntry);
        }
      }
    } catch (error) {
      console.error('Sync error:', error);
      throw error;
    }
  }

  // Clear analytics cache
  static async clearAnalyticsCache(): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('analytics_cache')
        .delete()
        .eq('user_id', user.id);

      if (error) throw error;
    } catch (error) {
      console.error('Clear cache error:', error);
      throw error;
    }
  }
} 