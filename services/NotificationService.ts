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

export async function createNotificationChannel() {
  if (Platform.OS !== 'android') {
    return;
  }
  const channelId = 'habit-reminders'; // A unique ID for your channel
  const existingChannel = await Notifications.getNotificationChannelAsync(channelId);
  
  if (!existingChannel) {
    await Notifications.setNotificationChannelAsync(channelId, {
      name: 'Habit Reminders', // User-facing name for the channel
      importance: Notifications.AndroidImportance.HIGH, // High importance ensures prominent display
      sound: 'default', // Use default system sound
      showBadge: true, // Optional: show badge count on app icon
    });
    console.log('Android Notification Channel "habit-reminders" created.');
  } else {
    console.log('Android Notification Channel "habit-reminders" already exists.');
  }
}

export async function requestNotificationPermissions(): Promise<boolean> {
  if (Platform.OS === 'web') {
    console.log('Notifications not supported on web');
    return false;
  }
  // On Android 13+, creating a channel can trigger the permission prompt.
  // Ensure channel is created before requesting permissions.
  await createNotificationChannel();
  
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;
  
  if (existingStatus !== 'granted') {
    console.log('Initial notification permission status not granted. Requesting...');
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  
  if (Platform.OS === 'android' && finalStatus === 'granted' && Platform.Version >= 31) {
    // For Android 12+ (API 31+), the SCHEDULE_EXACT_ALARM permission is crucial for precise timing.
    // This permission is typically handled by Expo's config plugin if exact triggers are used,
    // but it's important to be aware of its necessity for reliable reminders.
    console.log('On Android 12+ (API 31+), ensure SCHEDULE_EXACT_ALARM permission is handled for precise timing.');
  }
  
  if (finalStatus === 'granted') {
    console.log('Notification permissions granted.');
  } else {
    console.warn('Notification permissions denied.');
  }
  
  return finalStatus === 'granted';
}

export async function scheduleHabitReminder(habit: Habit) {
  if (Platform.OS === 'web') {
    console.log('Notifications not supported on web');
    return null;
  }
  if (!habit.reminderEnabled || !habit.reminderTime || !habit.reminderDays || habit.reminderDays.length === 0) {
    return null;
  }

  // Always cancel any existing reminder for this habit before scheduling new ones
  await cancelHabitReminder(habit.id);

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
          dayOfWeek: dayOfWeek
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
    console.log(`Scheduled habit reminder for ${habit.title} on day ${dayOfWeek} at ${habit.reminderTime}. ID: ${identifier}`);
  }

  return identifiers;
}

export async function cancelHabitReminder(habitId: string) {
  if (Platform.OS === 'web') {
    console.log('Notifications not supported on web');
    return;
  }
  console.log(`Attempting to cancel reminders for habit ID: ${habitId}`);

  // OPTION A (Most Efficient): If you store the notificationId with your habit data,
  // you can directly cancel it without fetching all scheduled notifications.
  // This requires you to pass the notificationId or fetch the habit first.
  // Example (assuming habit object with notificationId is available):
  // if (habit?.notificationId) {
  //   try {
  //     await Notifications.cancelScheduledNotificationAsync(habit.notificationId);
  //     console.log(`Cancelled notification ${habit.notificationId} for habit ${habitId} directly.`);
  //     // Optionally, clear the stored notificationId from your habit data after successful cancellation
  //     // await updateHabitInStorage(habit.id, { notificationId: null });
  //     return; // Exit if successfully cancelled by ID
  //   } catch (error) {
  //     console.warn(`Failed to cancel by stored ID ${habit.notificationId}. Falling back to scan:`, error);
  //     // Continue to Option B if direct cancellation failed
  //   }
  // }

  // OPTION B (Fallback/Current Approach): Iterate through all scheduled notifications.
  // This is less efficient for a large number of notifications but ensures all matching ones are found.
  const scheduledNotifications = await Notifications.getAllScheduledNotificationsAsync();

  let cancelledCount = 0;
  for (const notification of scheduledNotifications) {
    // Ensure data and habitId exist before comparing
    if (notification.content.data && notification.content.data.habitId === habitId) {
      await Notifications.cancelScheduledNotificationAsync(notification.identifier);
      console.log(`Cancelled notification ${notification.identifier} for habit ${habitId} via scan.`);
      cancelledCount++;
    }
  }
  if (cancelledCount === 0) {
    console.log(`No scheduled notifications found for habit ID: ${habitId} (or already cancelled).`);
  }
}

export async function cancelAllReminders() {
  if (Platform.OS === 'web') {
    console.log('Notifications not supported on web');
    return;
  }
  await Notifications.cancelAllScheduledNotificationsAsync();
  console.log('All scheduled reminders cancelled.');
}

export async function scheduleMotivationalNudge(
  message: MotivationalMessage, 
  delayMinutes: number = 30
) {
  if (Platform.OS === 'web') {
    console.log('Notifications not supported on web');
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

  console.log(`Scheduled motivational nudge: ${message.message}`);
  return identifier;
}

export async function scheduleSmartReminderSuggestion(
  habitTitle: string,
  suggestedTime: string,
  reason: string
) {
  if (Platform.OS === 'web') {
    console.log('Notifications not supported on web');
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

  console.log(`Scheduled smart reminder suggestion for ${habitTitle}`);
  return identifier;
}

export async function checkAndScheduleMotivationalSupport(habits: Habit[], t: (key: string, params?: any) => string) {
  if (Platform.OS === 'web') {
    console.log('Notifications not supported on web');
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

// Add these new functions after the existing ones

// 1. Mood-aware reminder timing
export async function scheduleMoodAwareReminder(
  habit: Habit,
  currentMood: MoodEntry,
  moodHistory: MoodEntry[],
  t: (key: string, params?: any) => string
) {
  if (Platform.OS === 'web') {
    console.log('Notifications not supported on web');
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

  console.log(`Scheduled mood-aware reminder for ${habit.title} at ${optimalTime}`);
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

export async function schedulePostHabitMoodCheck(
  habitId: string,
  completionTime: string,
  delayMinutes: number
) {
  if (Platform.OS === 'web') {
    console.log('Notifications not supported on web');
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

    console.log(`Scheduled post-habit mood check for habit ${habitId} in ${delayMinutes} minutes`);
    return identifier;
  } catch (error) {
    console.error('Error scheduling post-habit mood check:', error);
    return null;
  }
}