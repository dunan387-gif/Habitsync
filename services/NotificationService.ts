import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { Habit, MotivationalMessage } from '@/types';
import { aiService } from './AIService';

// Configure notifications handler
// This handler dictates how incoming notifications should behave when the app is in the foreground.
// It should be set up once, early in your app's lifecycle.
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true, // Show a banner/alert
    shouldPlaySound: true, // Play a sound
    shouldSetBadge: false, // Do not update the app icon badge
    shouldShowBanner: true, // Show a banner (Android)
    shouldShowList: true, // Show in notification list (Android)
  }),
});

/**
 * Creates an Android Notification Channel.
 * This is mandatory for Android 8.0+ (API level 26+) and crucial for user control.
 * On Android 13+ (API 33+), creating a channel can trigger the notification permission prompt.
 * This function should be called once, early in your app's lifecycle (e.g., in App.js useEffect).
 */
export async function createNotificationChannel() {
  if (Platform.OS === 'android') {
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
}

/**
 * Requests notification permissions from the user.
 * This function also ensures the Android notification channel is created.
 * On Android 12+ (API 31+), precise timing for notifications (like habit reminders)
 * relies on the SCHEDULE_EXACT_ALARM permission, which must be declared in AndroidManifest.xml.
 * Expo's build process generally handles this if your targetSdkVersion is 31 or higher and you use exact triggers.
 */
export async function requestNotificationPermissions(): Promise<boolean> {
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

/**
 * Schedules a daily habit reminder using the calendar trigger.
 * This is the recommended and most reliable approach for daily repeating notifications at a precise time.
 * It correctly handles the `repeats: true` requirement for calendar-based triggers on Android.
 * @param habit The habit object containing reminder details.
 * @returns The notification identifier if scheduled, or null if reminder is not enabled.
 */
export async function scheduleHabitReminder(habit: Habit) {
  if (!habit.reminderEnabled || !habit.reminderTime) {
    return null;
  }

  // Always cancel any existing reminder for this habit before scheduling a new one.
  // This prevents duplicate notifications if the habit reminder time is updated.
  await cancelHabitReminder(habit.id);

  const [hour, minute] = habit.reminderTime.split(':').map(Number);

  const identifier = await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Habit Reminder',
      body: `Time to complete your habit: ${habit.title}`,
      data: { habitId: habit.id }, // Essential for cancellation logic
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour,
      minute,
    },
  });

  console.log(`Scheduled habit reminder for ${habit.title} at ${habit.reminderTime}. ID: ${identifier}`);
  return identifier;
}

/**
 * Cancels scheduled reminders for a specific habit.
 * It first attempts to cancel by a stored notification ID (if available and passed in the habit object),
 * then falls back to scanning all scheduled notifications.
 * @param habitId The ID of the habit whose reminders should be cancelled.
 */
export async function cancelHabitReminder(habitId: string) {
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

/**
 * Cancels all scheduled notifications for the application.
 */
export async function cancelAllReminders() {
  await Notifications.cancelAllScheduledNotificationsAsync();
  console.log('All scheduled reminders cancelled.');
}

/**
 * Schedule motivational nudge notifications
 */
export async function scheduleMotivationalNudge(
  message: MotivationalMessage, 
  delayMinutes: number = 30
) {
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

/**
 * Schedule smart reminder suggestions
 */
export async function scheduleSmartReminderSuggestion(
  habitTitle: string,
  suggestedTime: string,
  reason: string
) {
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

/**
 * Check if user needs motivational support and schedule accordingly
 */
export async function checkAndScheduleMotivationalSupport(habits: Habit[]) {
  const motivationalMessage = aiService.generateMotivationalMessage(habits);
  
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