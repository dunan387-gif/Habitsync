import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { Habit, MotivationalMessage } from '@/types';
import { aiService } from './AIService';

// Only configure notifications on native platforms
if (Platform.OS !== 'web') {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
}

export async function createNotificationChannels() {
  if (Platform.OS !== 'android') {
    return;
  }

  // Create multiple notification channels for different types of notifications
  const channels = [
    {
      id: 'habit-reminders',
      name: 'Habit Reminders',
      description: 'Reminders for daily habits and routines',
      importance: Notifications.AndroidImportance.HIGH,
      sound: 'default',
      showBadge: true,
      enableVibration: true,
      vibrationPattern: [0, 250, 250, 250]
    },
    {
      id: 'mood-check-ins',
      name: 'Mood Check-ins',
      description: 'Gentle reminders to track your mood',
      importance: Notifications.AndroidImportance.DEFAULT,
      sound: 'default',
      showBadge: false,
      enableVibration: false
    },
    {
      id: 'achievements',
      name: 'Achievements & Milestones',
      description: 'Celebrations for your progress and achievements',
      importance: Notifications.AndroidImportance.DEFAULT,
      sound: 'default',
      showBadge: true,
      enableVibration: true,
      vibrationPattern: [0, 500, 200, 500]
    },
    {
      id: 'motivational',
      name: 'Motivational Messages',
      description: 'Encouraging messages to keep you motivated',
      importance: Notifications.AndroidImportance.LOW,
      sound: null, // No sound for motivational messages
      showBadge: false,
      enableVibration: false
    },
    {
      id: 'analytics',
      name: 'Analytics & Insights',
      description: 'Weekly summaries and insights about your progress',
      importance: Notifications.AndroidImportance.LOW,
      sound: null,
      showBadge: false,
      enableVibration: false
    }
  ];

  // Create each channel
  for (const channel of channels) {
    const existingChannel = await Notifications.getNotificationChannelAsync(channel.id);
    
    if (!existingChannel) {
      await Notifications.setNotificationChannelAsync(channel.id, {
        name: channel.name,
        description: channel.description,
        importance: channel.importance,
        sound: channel.sound,
        showBadge: channel.showBadge,
        enableVibrate: channel.enableVibration,
        vibrationPattern: channel.vibrationPattern
      });
      
      console.log(`✅ Created Android notification channel: ${channel.name}`);
    }
  }
}

export async function createNotificationChannel() {
  // Legacy function for backward compatibility
  return createNotificationChannels();
}

export async function requestNotificationPermissions(): Promise<boolean> {
  if (Platform.OS === 'web') {
    return false;
  }
  // On Android 13+, creating a channel can trigger the permission prompt.
  // Ensure channel is created before requesting permissions.
  await createNotificationChannels();
  
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;
  
  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  
  if (Platform.OS === 'android' && finalStatus === 'granted' && Platform.Version >= 31) {
    // For Android 12+ (API 31+), the SCHEDULE_EXACT_ALARM permission is crucial for precise timing.
    // This permission is typically handled by Expo's config plugin if exact triggers are used,
    // but it's important to be aware of its necessity for reliable reminders.
  }
  
  if (finalStatus === 'granted') {
    // Notification permissions granted
  } else {
    console.warn('Notification permissions denied.');
  }
  
  return finalStatus === 'granted';
}

export async function scheduleHabitReminder(habit: Habit) {
  if (Platform.OS === 'web') {
    return null;
  }
  
  // Handle multiple reminders
  if (habit.reminders && habit.reminders.length > 0) {
    return await scheduleMultipleHabitReminders(habit);
  }
  
  // Handle single reminder (legacy)
  if (!habit.reminderEnabled || !habit.reminderTime || !habit.reminderDays || habit.reminderDays.length === 0) {
    return null;
  }

  try {
    // Cancel existing reminders using efficient ID tracking
    await cancelHabitReminder(habit.id, habit.notificationIds);

    const [hour, minute] = habit.reminderTime.split(':').map(Number);
    const identifiers: string[] = [];

    // Schedule a notification for each selected day
    for (const dayOfWeek of habit.reminderDays) {
      const identifier = await Notifications.scheduleNotificationAsync({
        content: {
          title: 'Habit Reminder',
          body: `Time to complete your habit: ${habit.title}`,
          data: { 
            habitId: habit.id,
            dayOfWeek: dayOfWeek,
            type: 'habit_reminder'
          },
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
          weekday: dayOfWeek + 1, // Expo uses 1-7 (Sunday=1), we use 0-6 (Sunday=0)
          hour,
          minute,
        },
        // Android-specific channel configuration
        ...(Platform.OS === 'android' && {
          android: {
            channelId: 'habit-reminders'
          }
        })
      });
      
      identifiers.push(identifier);
    }

    // Return the identifiers so they can be stored with the habit
    return identifiers;
  } catch (error) {
    console.error(`❌ Failed to schedule reminders for habit ${habit.title}:`, error);
    // Attempt retry once
    try {
      await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second
      return await scheduleHabitReminder(habit);
    } catch (retryError) {
      console.error(`❌ Retry failed for habit ${habit.title}:`, retryError);
      return null;
    }
  }
}

export async function scheduleMultipleHabitReminders(habit: Habit) {
  if (Platform.OS === 'web') {
    return null;
  }
  
  if (!habit.reminders || habit.reminders.length === 0) {
    return null;
  }

  try {
    // Cancel existing reminders using efficient ID tracking
    await cancelHabitReminder(habit.id, habit.notificationIds);

    const identifiers: string[] = [];

    // Schedule notifications for each reminder
    for (const reminder of habit.reminders) {
      if (!reminder.enabled || !reminder.time || !reminder.days || reminder.days.length === 0) {
        continue;
      }

      const [hour, minute] = reminder.time.split(':').map(Number);

      // Schedule a notification for each selected day
      for (const dayOfWeek of reminder.days) {
        const identifier = await Notifications.scheduleNotificationAsync({
          content: {
            title: 'Habit Reminder',
            body: reminder.message || `Time to complete your habit: ${habit.title}`,
            data: { 
              habitId: habit.id,
              reminderId: reminder.id,
              dayOfWeek: dayOfWeek,
              type: 'habit_reminder'
            },
          },
          trigger: {
            type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
            weekday: dayOfWeek + 1, // Expo uses 1-7 (Sunday=1), we use 0-6 (Sunday=0)
            hour,
            minute,
          },
        });
        
        identifiers.push(identifier);
      }
    }

    // Return the identifiers so they can be stored with the habit
    return identifiers;
  } catch (error) {
    console.error(`❌ Failed to schedule multiple reminders for habit ${habit.title}:`, error);
    // Attempt retry once
    try {
      await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second
      return await scheduleMultipleHabitReminders(habit);
    } catch (retryError) {
      console.error(`❌ Retry failed for habit ${habit.title}:`, retryError);
      return null;
    }
  }
}

export async function cancelHabitReminder(habitId: string, notificationIds?: string[]) {
  if (Platform.OS === 'web') {
    return;
  }

  // OPTION A (Most Efficient): Use stored notification IDs
  if (notificationIds && notificationIds.length > 0) {
    let cancelledCount = 0;
    for (const notificationId of notificationIds) {
      try {
        await Notifications.cancelScheduledNotificationAsync(notificationId);
        cancelledCount++;
      } catch (error) {
        console.warn(`⚠️ Failed to cancel notification ${notificationId} for habit ${habitId}:`, error);
        // Continue with other IDs
      }
    }
    
    if (cancelledCount > 0) {
      return;
    }
  }

  // OPTION B (Fallback): Scan all scheduled notifications
  try {
    const scheduledNotifications = await Notifications.getAllScheduledNotificationsAsync();
    let cancelledCount = 0;
    
    for (const notification of scheduledNotifications) {
      if (notification.content.data && 
          notification.content.data.habitId === habitId &&
          notification.content.data.type === 'habit_reminder') {
        try {
          await Notifications.cancelScheduledNotificationAsync(notification.identifier);
          cancelledCount++;
        } catch (error) {
          console.warn(`⚠️ Failed to cancel notification ${notification.identifier}:`, error);
        }
      }
    }
    
    // Notifications cancelled via scan
  } catch (error) {
    console.error(`❌ Error scanning notifications for habit ${habitId}:`, error);
  }
}

export async function cancelAllReminders() {
  if (Platform.OS === 'web') {
    return;
  }
  await Notifications.cancelAllScheduledNotificationsAsync();
}

export async function scheduleMotivationalNudge(
  message: MotivationalMessage, 
  delayMinutes: number = 30
) {
  if (Platform.OS === 'web') {
    return null;
  }
  const identifier = await Notifications.scheduleNotificationAsync({
    content: {
      title: '💪 Motivation Boost',
      body: message.message,
      data: { 
        type: 'motivational_nudge',
        messageId: message.id,
        messageType: message.type
      },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds: delayMinutes * 60,
    },
  });

  return identifier;
}

export async function scheduleSmartReminderSuggestion(
  habitTitle: string,
  suggestedTime: string,
  reason: string
) {
  if (Platform.OS === 'web') {
    return null;
  }
  const identifier = await Notifications.scheduleNotificationAsync({
    content: {
      title: '🧠 Smart Reminder Suggestion',
      body: `Consider setting a reminder for "${habitTitle}" at ${suggestedTime}. ${reason}`,
      data: { 
        type: 'smart_reminder_suggestion',
        suggestedTime,
        habitTitle
      },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds: 60, // Show after 1 minute
    },
  });

  return identifier;
}

export async function checkAndScheduleMotivationalSupport(habits: Habit[], t: (key: string, params?: any) => string) {
  if (Platform.OS === 'web') {
    return;
  }
  const motivationalMessage = aiService.generateMotivationalMessage(habits, t);
  
  if (motivationalMessage) {
    // Check if we've sent a nudge recently to avoid spam
    const lastNudgeTime = await getLastMotivationalNudgeTime();
    const now = new Date();
    const timeSinceLastNudge = lastNudgeTime ? now.getTime() - lastNudgeTime.getTime() : Infinity;
    
    // Only send if it's been more than 4 hours since last nudge
    if (timeSinceLastNudge > 4 * 60 * 60 * 1000) {
      await scheduleMotivationalNudge(motivationalMessage);
      await setLastMotivationalNudgeTime(now);
    }
  }
}

// Helper functions for tracking nudge frequency
async function getLastMotivationalNudgeTime(): Promise<Date | null> {
  try {
    const AsyncStorage = require('@react-native-async-storage/async-storage').default;
    const timeStr = await AsyncStorage.getItem('lastMotivationalNudge');
    return timeStr ? new Date(timeStr) : null;
  } catch {
    return null;
  }
}

async function setLastMotivationalNudgeTime(time: Date) {
  try {
    const AsyncStorage = require('@react-native-async-storage/async-storage').default;
    await AsyncStorage.setItem('lastMotivationalNudge', time.toISOString());
  } catch (error) {
    console.error('Failed to save last nudge time:', error);
  }
}

// Add these imports at the top
import { MoodAwareNotification, NotificationSchedule, MoodEntry, HabitMoodEntry, RiskAlert } from '@/types';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { mlPatternRecognitionService, MLPrediction } from './MLPatternRecognitionService';

// Add these new functions after the existing ones

// 1. Mood-aware reminder timing
export async function scheduleMoodAwareReminder(
  habit: Habit,
  currentMood: MoodEntry,
  moodHistory: MoodEntry[],
  t: (key: string, params?: any) => string
) {
  if (Platform.OS === 'web') {
    return null;
  }

  // Analyze optimal timing based on mood patterns
  const optimalTime = calculateOptimalReminderTime(habit, currentMood, moodHistory);
  const moodAwareMessage = generateMoodAwareReminderMessage(habit, currentMood, t);

  const identifier = await Notifications.scheduleNotificationAsync({
    content: {
      title: moodAwareMessage.title,
      body: moodAwareMessage.body,
      data: {
        type: 'mood_aware_reminder',
        habitId: habit.id,
        moodState: currentMood.moodState,
        moodIntensity: currentMood.intensity,
        optimalTime
      },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date: new Date(optimalTime),
    },
  });

  return identifier;
}

// 2. Encouragement messages for difficult mood days
export async function scheduleEncouragementForDifficultMood(
  currentMood: MoodEntry,
  strugglingHabits: Habit[],
  t: (key: string, params?: any) => string
) {
  if (Platform.OS === 'web') return null;

  // Only send if mood intensity is low (indicating difficulty)
  if (currentMood.intensity >= 6) return null;

  const encouragementMessage = generateEncouragementMessage(currentMood, strugglingHabits, t);
  
  const identifier = await Notifications.scheduleNotificationAsync({
    content: {
      title: '💙 You\'re Not Alone',
      body: encouragementMessage,
      data: {
        type: 'encouragement',
        moodState: currentMood.moodState,
        moodIntensity: currentMood.intensity,
        strugglingHabitsCount: strugglingHabits.length
      },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds: 30 * 60, // 30 minutes delay
    },
  });

  return identifier;
}

// 3. Celebration messages tailored to mood improvement
export async function scheduleMoodImprovementCelebration(
  previousMood: MoodEntry,
  currentMood: MoodEntry,
  completedHabits: Habit[],
  t: (key: string, params?: any) => string
) {
  if (Platform.OS === 'web') return null;

  const moodImprovement = currentMood.intensity - previousMood.intensity;
  
  // Only celebrate significant mood improvements
  if (moodImprovement < 2) return null;

  const celebrationMessage = generateMoodImprovementCelebration(
    previousMood, 
    currentMood, 
    completedHabits, 
    t
  );

  const identifier = await Notifications.scheduleNotificationAsync({
    content: {
      title: '🎉 Amazing Progress!',
      body: celebrationMessage,
      data: {
        type: 'mood_celebration',
        previousMoodIntensity: previousMood.intensity,
        currentMoodIntensity: currentMood.intensity,
        improvement: moodImprovement,
        completedHabitsCount: completedHabits.length
      },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds: 60, // 1 minute delay
    },
  });

  return identifier;
}

// 4. Check-in prompts when mood patterns suggest risk
export async function scheduleRiskPatternCheckIn(
  riskAlerts: RiskAlert[],
  moodHistory: MoodEntry[],
  t: (key: string, params?: any) => string
) {
  if (Platform.OS === 'web') return null;

  const highRiskAlerts = riskAlerts.filter(alert => 
    alert.riskLevel === 'high' || alert.riskLevel === 'critical'
  );

  if (highRiskAlerts.length === 0) return null;

  const checkInMessage = generateRiskPatternCheckInMessage(highRiskAlerts, moodHistory, t);

  const identifier = await Notifications.scheduleNotificationAsync({
    content: {
      title: '🤗 How Are You Feeling?',
      body: checkInMessage,
      data: {
        type: 'risk_check_in',
        riskLevel: 'high',
        affectedHabits: highRiskAlerts.map(alert => alert.habitId),
        urgency: 'high'
      },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds: 15 * 60, // 15 minutes delay
    },
  });

  return identifier;
}

// 5. Weekly mood-habit insight summaries
export async function scheduleWeeklyMoodHabitSummary(
  weeklyInsights: any,
  schedule: NotificationSchedule,
  t: (key: string, params?: any) => string
) {
  if (Platform.OS === 'web') return null;
  if (!schedule.weeklySummarySettings.enabled) return null;

  const summaryMessage = generateWeeklySummaryMessage(weeklyInsights, t);
  
  // Calculate next occurrence of the scheduled day and time
  const nextSummaryDate = calculateNextWeeklySummaryDate(
    schedule.weeklySummarySettings.dayOfWeek,
    schedule.weeklySummarySettings.time
  );

  const identifier = await Notifications.scheduleNotificationAsync({
    content: {
      title: generateWeeklySummaryMessage(weeklyInsights, t),
      body: 'Check out your weekly mood and habit insights!',
      data: {
        type: 'weekly_summary',
        weeklyInsights,
        includeInsights: schedule.weeklySummarySettings.includeInsights
      },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
      weekday: schedule.weeklySummarySettings.dayOfWeek + 1, // Expo uses 1-7 (Sunday=1)
      hour: parseInt(schedule.weeklySummarySettings.time.split(':')[0]),
      minute: parseInt(schedule.weeklySummarySettings.time.split(':')[1]),
    },
  });

  return identifier;
}

// Helper functions
function calculateOptimalReminderTime(
  habit: Habit,
  currentMood: MoodEntry,
  moodHistory: MoodEntry[]
): string {
  // Analyze when user typically completes habits in similar mood states
  const similarMoodEntries = moodHistory.filter(
    entry => entry.moodState === currentMood.moodState &&
    Math.abs(entry.intensity - currentMood.intensity) <= 2
  );

  if (habit.completionTimes && habit.completionTimes.length > 0) {
    // Use existing completion patterns
    return habit.completionTimes[0];
  }

  // Default optimal times based on mood state
  const moodOptimalTimes = {
    'energetic': '07:00',
    'happy': '09:00',
    'calm': '19:00',
    'tired': '20:00',
    'stressed': '18:00',
    'anxious': '16:00',
    'sad': '14:00'
  };

  const now = new Date();
  const optimalHour = moodOptimalTimes[currentMood.moodState as keyof typeof moodOptimalTimes] || '10:00';
  const [hour, minute] = optimalHour.split(':').map(Number);
  
  const optimalTime = new Date(now);
  optimalTime.setHours(hour, minute, 0, 0);
  
  // If optimal time has passed today, schedule for tomorrow
  if (optimalTime <= now) {
    optimalTime.setDate(optimalTime.getDate() + 1);
  }

  return optimalTime.toISOString();
}

function generateMoodAwareReminderMessage(
  habit: Habit,
  currentMood: MoodEntry,
  t: (key: string, params?: any) => string
): { title: string; body: string } {
  const moodMessages = {
    'energetic': {
      title: t('mood_reminder_energetic_title', { habit: habit.title }),
      body: t('mood_reminder_energetic_body', { habit: habit.title })
    },
    'happy': {
      title: t('mood_reminder_happy_title', { habit: habit.title }),
      body: t('mood_reminder_happy_body', { habit: habit.title })
    },
    'calm': {
      title: t('mood_reminder_calm_title', { habit: habit.title }),
      body: t('mood_reminder_calm_body', { habit: habit.title })
    },
    'tired': {
      title: t('mood_reminder_tired_title', { habit: habit.title }),
      body: t('mood_reminder_tired_body', { habit: habit.title })
    },
    'stressed': {
      title: t('mood_reminder_stressed_title', { habit: habit.title }),
      body: t('mood_reminder_stressed_body', { habit: habit.title })
    },
    'anxious': {
      title: t('mood_reminder_anxious_title', { habit: habit.title }),
      body: t('mood_reminder_anxious_body', { habit: habit.title })
    },
    'sad': {
      title: t('mood_reminder_sad_title', { habit: habit.title }),
      body: t('mood_reminder_sad_body', { habit: habit.title })
    }
  };

  return moodMessages[currentMood.moodState as keyof typeof moodMessages] || {
    title: t('mood_reminder_default_title', { habit: habit.title }),
    body: t('mood_reminder_default_body', { habit: habit.title })
  };
}

function generateEncouragementMessage(
  currentMood: MoodEntry,
  strugglingHabits: Habit[],
  t: (key: string, params?: any) => string
): string {
  const encouragementMessages = {
    'sad': t('encouragement_sad', { count: strugglingHabits.length }),
    'anxious': t('encouragement_anxious', { count: strugglingHabits.length }),
    'stressed': t('encouragement_stressed', { count: strugglingHabits.length }),
    'tired': t('encouragement_tired', { count: strugglingHabits.length })
  };

  return encouragementMessages[currentMood.moodState as keyof typeof encouragementMessages] || 
    t('encouragement_default', { count: strugglingHabits.length });
}

function generateMoodImprovementCelebration(
  previousMood: MoodEntry,
  currentMood: MoodEntry,
  completedHabits: Habit[],
  t: (key: string, params?: any) => string
): string {
  const improvement = currentMood.intensity - previousMood.intensity;
  return t('mood_improvement_celebration', {
    improvement,
    previousMood: previousMood.moodState,
    currentMood: currentMood.moodState,
    habitsCount: completedHabits.length
  });
}

function generateRiskPatternCheckInMessage(
  riskAlerts: RiskAlert[],
  moodHistory: MoodEntry[],
  t: (key: string, params?: any) => string
): string {
  const habitTitles = riskAlerts.map(alert => alert.habitTitle).join(', ');
  return t('risk_pattern_check_in', { habits: habitTitles });
}

function generateWeeklySummaryMessage(
  weeklyInsights: any,
  t: (key: string, params?: any) => string
): string {
  return t('weekly_summary_message', {
    completionRate: weeklyInsights.completionRate,
    moodTrend: weeklyInsights.moodTrend,
    topHabit: weeklyInsights.topHabit
  });
}

function calculateNextWeeklySummaryDate(dayOfWeek: number, time: string): Date {
  const now = new Date();
  const [hour, minute] = time.split(':').map(Number);
  
  const nextDate = new Date(now);
  nextDate.setHours(hour, minute, 0, 0);
  
  // Calculate days until target day of week
  const daysUntilTarget = (dayOfWeek - now.getDay() + 7) % 7;
  if (daysUntilTarget === 0 && nextDate <= now) {
    // If it's today but time has passed, schedule for next week
    nextDate.setDate(nextDate.getDate() + 7);
  } else {
    nextDate.setDate(nextDate.getDate() + daysUntilTarget);
  }
  
  return nextDate;
}

// Notification schedule management
export async function saveNotificationSchedule(schedule: NotificationSchedule): Promise<void> {
  try {
    await AsyncStorage.setItem('notificationSchedule', JSON.stringify(schedule));
  } catch (error) {
    console.error('Failed to save notification schedule:', error);
  }
}

export async function getNotificationSchedule(): Promise<NotificationSchedule | null> {
  try {
    const scheduleStr = await AsyncStorage.getItem('notificationSchedule');
    return scheduleStr ? JSON.parse(scheduleStr) : null;
  } catch (error) {
    console.error('Failed to load notification schedule:', error);
    return null;
  }
}

// NEW: Notification ID Management Utilities
export async function updateHabitNotificationIds(habitId: string, notificationIds: string[] | null): Promise<void> {
  try {
    const key: string = `habit_notifications_${habitId}`;
    if (notificationIds) {
      await AsyncStorage.setItem(key, JSON.stringify({
        notificationIds,
        updatedAt: new Date().toISOString()
      }));
    } else {
      await AsyncStorage.removeItem(key);
    }
  } catch (error) {
    console.error(`Failed to update notification IDs for habit ${habitId}:`, error);
  }
}

export async function getHabitNotificationIds(habitId: string): Promise<string[] | null> {
  try {
    const key = `habit_notifications_${habitId}`;
    const data = await AsyncStorage.getItem(key);
    if (data) {
      const parsed = JSON.parse(data);
      return parsed.notificationIds || null;
    }
    return null;
  } catch (error) {
    console.error(`Failed to get notification IDs for habit ${habitId}:`, error);
    return null;
  }
}

// NEW: Comprehensive Notification Status Tracking
export interface NotificationStatus {
  habitId: string;
  notificationIds: string[];
  lastScheduled: string;
  lastCancelled?: string;
  status: 'active' | 'cancelled' | 'failed' | 'pending';
  errorMessage?: string;
  retryCount: number;
}

export async function saveNotificationStatus(status: NotificationStatus): Promise<void> {
  try {
    const key: string = `notification_status_${status.habitId}`;
    await AsyncStorage.setItem(key, JSON.stringify(status));
  } catch (error) {
    console.error(`Failed to save notification status for habit ${status.habitId}:`, error);
  }
}

export async function getNotificationStatus(habitId: string): Promise<NotificationStatus | null> {
  try {
    const key = `notification_status_${habitId}`;
    const data = await AsyncStorage.getItem(key);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error(`Failed to get notification status for habit ${habitId}:`, error);
    return null;
  }
}

// NEW: ML-Enhanced Notification Scheduling with Status Tracking
export async function scheduleHabitReminderWithTracking(habit: Habit): Promise<string[] | null> {
  const status: NotificationStatus = {
    habitId: habit.id,
    notificationIds: [],
    lastScheduled: new Date().toISOString(),
    status: 'pending',
    retryCount: 0
  };

  try {
    // Cancel existing notifications first
    await cancelHabitReminder(habit.id, habit.notificationIds);
    
    // 🧠 NEW: Get ML prediction for optimal notification timing
    let mlPrediction: MLPrediction | null = null;
    try {
      // Get current habits and mood data for ML analysis
      const habits = await getCurrentHabits();
      const moodEntries = await getCurrentMoodEntries();
      const habitMoodEntries = await getCurrentHabitMoodEntries();
      
      if (habits && moodEntries && habitMoodEntries) {
        mlPrediction = await mlPatternRecognitionService.predictOptimalNotification(
          habits,
          moodEntries,
          habitMoodEntries
        );
      }
    } catch (mlError) {
      console.warn('⚠️ ML prediction failed, using default scheduling:', mlError);
    }
    
    // Schedule new notifications with ML optimization
    const identifiers = await scheduleHabitReminderWithMLOptimization(habit, mlPrediction);
    
    if (identifiers && identifiers.length > 0) {
      status.notificationIds = identifiers;
      status.status = 'active';
      
      // Update habit with new notification IDs
      await updateHabitNotificationIds(habit.id, identifiers);
      
    } else {
      status.status = 'failed';
      status.errorMessage = 'No notification identifiers returned';
    }
    
    await saveNotificationStatus(status);
    return identifiers;
    
  } catch (error) {
    status.status = 'failed';
    status.errorMessage = error instanceof Error ? error.message : 'Unknown error';
    status.retryCount++;
    
    await saveNotificationStatus(status);
    console.error(`❌ Failed to schedule notifications for habit ${habit.title}:`, error);
    
    // Retry logic
    if (status.retryCount < 3) {
      await new Promise(resolve => setTimeout(resolve, 2000 * status.retryCount)); // Exponential backoff
      return await scheduleHabitReminderWithTracking(habit);
    }
    
    return null;
  }
}

// NEW: ML-optimized notification scheduling
async function scheduleHabitReminderWithMLOptimization(habit: Habit, mlPrediction: MLPrediction | null): Promise<string[] | null> {
  if (Platform.OS === 'web') {
    return null;
  }
  
  if (!habit.reminderEnabled || !habit.reminderTime || !habit.reminderDays || habit.reminderDays.length === 0) {
    return null;
  }

  try {
    const identifiers: string[] = [];
    
    // Use ML prediction if available, otherwise use default scheduling
    if (mlPrediction && mlPrediction.shouldSendNotification) {
      
      // Schedule notifications based on ML prediction
      for (const dayOfWeek of habit.reminderDays) {
        const [optimalHour, optimalMinute] = mlPrediction.optimalTime.split(':').map(Number);
        
        const identifier = await Notifications.scheduleNotificationAsync({
          content: {
            title: generateMLOptimizedTitle(habit, mlPrediction),
            body: generateMLOptimizedBody(habit, mlPrediction),
            data: { 
              habitId: habit.id,
              dayOfWeek: dayOfWeek,
              type: 'ml_optimized_reminder',
              mlPrediction: JSON.stringify(mlPrediction)
            },
          },
          trigger: {
            type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
            weekday: dayOfWeek + 1, // Expo uses 1-7 (Sunday=1), we use 0-6 (Sunday=0)
            hour: optimalHour,
            minute: optimalMinute,
          },
        });
        
        identifiers.push(identifier);
      }
    } else {
      
      // Fall back to default scheduling
      const [hour, minute] = habit.reminderTime.split(':').map(Number);
      
      for (const dayOfWeek of habit.reminderDays) {
        const identifier = await Notifications.scheduleNotificationAsync({
          content: {
            title: 'Habit Reminder',
            body: `Time to complete your habit: ${habit.title}`,
            data: { 
              habitId: habit.id,
              dayOfWeek: dayOfWeek,
              type: 'habit_reminder'
            },
          },
          trigger: {
            type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
            weekday: dayOfWeek + 1,
            hour,
            minute,
          },
        });
        
        identifiers.push(identifier);
      }
    }

    return identifiers;
  } catch (error) {
    console.error(`❌ Failed to schedule ML-optimized notifications for habit ${habit.title}:`, error);
    return null;
  }
}

// Helper functions for ML-optimized notifications
function generateMLOptimizedTitle(habit: Habit, prediction: MLPrediction): string {
  const toneEmojis = {
    'energetic': '💪',
    'calm': '🧘',
    'supportive': '💙',
    'celebratory': '🎉'
  };
  
  const emoji = toneEmojis[prediction.messageTone] || '⏰';
  
  switch (prediction.notificationType) {
    case 'celebration':
      return `${emoji} Amazing progress with ${habit.title}!`;
    case 'encouragement':
      return `${emoji} You've got this - ${habit.title}`;
    case 'check_in':
      return `${emoji} How are you feeling about ${habit.title}?`;
    default:
      return `${emoji} Time for ${habit.title}`;
  }
}

function generateMLOptimizedBody(habit: Habit, prediction: MLPrediction): string {
  const urgencyIndicators = {
    'low': 'when you\'re ready',
    'medium': 'when convenient',
    'high': 'when you have a moment'
  };
  
  const urgency = urgencyIndicators[prediction.urgency] || 'when you\'re ready';
  
  switch (prediction.notificationType) {
    case 'celebration':
      return `Your consistency with ${habit.title} is inspiring! Keep up the great work!`;
    case 'encouragement':
      return `Remember, every small step counts. You can complete ${habit.title} ${urgency}.`;
    case 'check_in':
      return `How are you feeling about ${habit.title}? We\'re here to support you.`;
    default:
      return `Time to complete ${habit.title} ${urgency}. You\'ve got this!`;
  }
}

// Helper functions to get current data for ML analysis
async function getCurrentHabits(): Promise<Habit[] | null> {
  try {
    const habitsStr = await AsyncStorage.getItem('habits');
    return habitsStr ? JSON.parse(habitsStr) : null;
  } catch (error) {
    console.error('Failed to get current habits for ML analysis:', error);
    return null;
  }
}

async function getCurrentMoodEntries(): Promise<MoodEntry[] | null> {
  try {
    const moodStr = await AsyncStorage.getItem('moodEntries');
    return moodStr ? JSON.parse(moodStr) : null;
  } catch (error) {
    console.error('Failed to get current mood entries for ML analysis:', error);
    return null;
  }
}

async function getCurrentHabitMoodEntries(): Promise<HabitMoodEntry[] | null> {
  try {
    const habitMoodStr = await AsyncStorage.getItem('habitMoodEntries');
    return habitMoodStr ? JSON.parse(habitMoodStr) : null;
  } catch (error) {
    console.error('Failed to get current habit mood entries for ML analysis:', error);
    return null;
  }
}

// NEW: Notification Health Check
export async function checkNotificationHealth(): Promise<{
  totalScheduled: number;
  activeNotifications: number;
  failedNotifications: number;
  orphanedNotifications: number;
}> {
  try {
    const scheduledNotifications = await Notifications.getAllScheduledNotificationsAsync();
    const habitNotifications = scheduledNotifications.filter(n => 
      n.content.data?.type === 'habit_reminder'
    );
    
    let activeCount = 0;
    let failedCount = 0;
    let orphanedCount = 0;
    
    for (const notification of habitNotifications) {
      const habitId = notification.content.data?.habitId as string;
      if (habitId) {
        const status = await getNotificationStatus(habitId);
        if (status?.status === 'active') {
          activeCount++;
        } else if (status?.status === 'failed') {
          failedCount++;
        } else {
          orphanedCount++;
        }
      } else {
        orphanedCount++;
      }
    }
    
    return {
      totalScheduled: scheduledNotifications.length,
      activeNotifications: activeCount,
      failedNotifications: failedCount,
      orphanedNotifications: orphanedCount
    };
  } catch (error) {
    console.error('Failed to check notification health:', error);
    return {
      totalScheduled: 0,
      activeNotifications: 0,
      failedNotifications: 0,
      orphanedNotifications: 0
    };
  }
}

// NEW: Cleanup Orphaned Notifications
export async function cleanupOrphanedNotifications(): Promise<number> {
  try {
    const scheduledNotifications = await Notifications.getAllScheduledNotificationsAsync();
    let cleanedCount = 0;
    
    for (const notification of scheduledNotifications) {
      if (notification.content.data?.type === 'habit_reminder') {
        const habitId = notification.content.data?.habitId as string;
        if (habitId) {
          const status = await getNotificationStatus(habitId);
          // Clean up notifications for habits that no longer exist or have failed status
          if (!status || status.status === 'failed') {
            await Notifications.cancelScheduledNotificationAsync(notification.identifier);
            cleanedCount++;
          }
        }
      }
    }
    
    return cleanedCount;
  } catch (error) {
    console.error('Failed to cleanup orphaned notifications:', error);
    return 0;
  }
}

export async function schedulePostHabitMoodCheck(
  habitId: string,
  completionTime: string,
  delayMinutes: number
) {
  if (Platform.OS === 'web') {
    return null;
  }

  const identifier = `post-mood-${habitId}-${delayMinutes}`;
  
  try {
    const scheduledTime = new Date();
    scheduledTime.setMinutes(scheduledTime.getMinutes() + delayMinutes);

    await Notifications.scheduleNotificationAsync({
      identifier,
      content: {
        title: 'How are you feeling?',
        body: `It's been ${delayMinutes} minutes since you completed your habit. How do you feel now?`,
        data: {
          type: 'post_habit_mood_check',
          habitId,
          completionTime,
          delayMinutes
        },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: scheduledTime,
      },
    });

    return identifier;
  } catch (error) {
    console.error('Error scheduling post-habit mood check:', error);
    return null;
  }
}