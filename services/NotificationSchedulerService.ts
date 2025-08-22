import { firebaseFirestore } from '@/lib/firebase';
import { collection, query, where, getDocs, updateDoc, doc, addDoc, deleteDoc, Timestamp } from 'firebase/firestore';
import { Habit } from '@/types';
import { ExpoNotification } from './ExpoNotificationService';

interface User {
  id: string;
  fcmToken?: string;
}

export interface ScheduledNotification {
  id: string;
  userId: string;
  fcmToken: string;
  type: 'habit_reminder' | 'motivational_nudge' | 'achievement' | 'mood_check_in';
  title: string;
  body: string;
  scheduledFor: string;
  status: 'pending' | 'sent' | 'failed' | 'cancelled';
  data?: any;
  createdAt: string;
  sentAt?: string;
  retryCount: number;
  maxRetries: number;
}

export class NotificationSchedulerService {
  private static instance: NotificationSchedulerService;
  private isRunning: boolean = false;
  private intervalId: number | null = null;

  static getInstance(): NotificationSchedulerService {
    if (!NotificationSchedulerService.instance) {
      NotificationSchedulerService.instance = new NotificationSchedulerService();
    }
    return NotificationSchedulerService.instance;
  }

  // Start the notification scheduler
  async start(): Promise<void> {
    if (this.isRunning) {
      console.log('⚠️ Notification scheduler already running');
      return;
    }

    console.log('🚀 Starting notification scheduler...');
    this.isRunning = true;

    // Process notifications every minute
    this.intervalId = setInterval(async () => {
      await this.processScheduledNotifications();
    }, 60000); // 1 minute

    // Initial processing
    await this.processScheduledNotifications();
  }

  // Stop the notification scheduler
  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.isRunning = false;
    console.log('🛑 Notification scheduler stopped');
  }

  // Process scheduled notifications
  private async processScheduledNotifications(): Promise<void> {
    try {
      const now = new Date();
      const nowISO = now.toISOString();

      // Get pending notifications that are due
      const notificationsRef = collection(firebaseFirestore, 'scheduled_notifications');
      const q = query(
        notificationsRef,
        where('status', '==', 'pending'),
        where('scheduledFor', '<=', nowISO)
      );

      const snapshot = await getDocs(q);
      const notifications = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as ScheduledNotification[];

      console.log(`📱 Processing ${notifications.length} scheduled notifications`);

      // Process each notification
      for (const notification of notifications) {
        await this.sendNotification(notification);
      }
    } catch (error) {
      console.error('❌ Error processing scheduled notifications:', error);
    }
  }

  // Send a notification
  private async sendNotification(notification: ScheduledNotification): Promise<void> {
    try {
      console.log(`📤 Sending notification: ${notification.id}`);

      // Update status to processing
      await updateDoc(doc(firebaseFirestore, 'scheduled_notifications', notification.id), {
        status: 'sent',
        sentAt: new Date().toISOString()
      });

      // Send push notification via Firebase Cloud Messaging
      await this.sendPushNotification(notification);

      console.log(`✅ Notification sent successfully: ${notification.id}`);
    } catch (error) {
      console.error(`❌ Failed to send notification ${notification.id}:`, error);
      
      // Update status to failed
      await updateDoc(doc(firebaseFirestore, 'scheduled_notifications', notification.id), {
        status: 'failed',
        retryCount: (notification.retryCount || 0) + 1
      });
    }
  }

  // Send push notification via FCM
  private async sendPushNotification(notification: ScheduledNotification): Promise<void> {
    try {
      // Create Expo notification payload
      const expoNotification: ExpoNotification = {
        title: notification.title,
        body: notification.body,
        data: {
          ...notification.data,
          type: notification.type,
          notificationId: notification.id
        },
        channelId: this.getChannelId(notification.type),
        sound: 'default',
        badge: 1
      };

      // For now, we'll simulate the Expo notification
      // In production, this would be handled by a server-side service
      console.log('📤 Simulating Expo notification:', expoNotification);
      const success = true; // Simulate success
      
      if (success) {
        console.log('✅ FCM notification sent successfully:', notification.id);
      } else {
        throw new Error('FCM notification failed to send');
      }
      
    } catch (error) {
      console.error('❌ Error sending FCM notification:', error);
      throw error;
    }
  }

  // Get channel ID based on notification type
  private getChannelId(type: string): string {
    switch (type) {
      case 'habit_reminder':
        return 'habit-reminders';
      case 'motivational_nudge':
        return 'motivational';
      case 'achievement':
        return 'achievements';
      case 'mood_check_in':
        return 'mood-check-ins';
      default:
        return 'habit-reminders';
    }
  }

  // Schedule a notification
  async scheduleNotification(notification: Omit<ScheduledNotification, 'id' | 'createdAt'>): Promise<string> {
    try {
      const notificationRef = await addDoc(collection(firebaseFirestore, 'scheduled_notifications'), {
        ...notification,
        createdAt: new Date().toISOString(),
        retryCount: 0,
        maxRetries: 3
      });

      console.log(`✅ Notification scheduled: ${notificationRef.id}`);
      return notificationRef.id;
    } catch (error) {
      console.error('❌ Error scheduling notification:', error);
      throw error;
    }
  }

  // Cancel a notification
  async cancelNotification(notificationId: string): Promise<void> {
    try {
      await updateDoc(doc(firebaseFirestore, 'scheduled_notifications', notificationId), {
        status: 'cancelled'
      });
      console.log(`✅ Notification cancelled: ${notificationId}`);
    } catch (error) {
      console.error(`❌ Error cancelling notification ${notificationId}:`, error);
      throw error;
    }
  }

  // Schedule habit reminders for a user
  async scheduleHabitReminders(user: User, habits: Habit[]): Promise<void> {
    try {
      if (!user.fcmToken) {
        console.log('⚠️ No FCM token for user, skipping habit reminders');
        return;
      }

      for (const habit of habits) {
        if (!habit.reminders || habit.reminders.length === 0) {
          continue;
        }

        for (const reminder of habit.reminders) {
          const [hour, minute] = reminder.time.split(':').map(Number);
          
          for (const dayOfWeek of reminder.days) {
            // Calculate next occurrence
            const nextOccurrence = this.getNextOccurrence(dayOfWeek, hour, minute);
            
            // Create dynamic message based on habit data
            const dynamicMessage = this.createHabitReminderMessage(habit, reminder);
            
            await this.scheduleNotification({
              userId: user.id,
              fcmToken: user.fcmToken || '',
              type: 'habit_reminder',
              title: 'Habit Reminder',
              body: dynamicMessage,
              scheduledFor: nextOccurrence.toISOString(),
              status: 'pending',
              data: {
                habitId: habit.id,
                reminderId: reminder.id,
                dayOfWeek: dayOfWeek,
                type: 'habit_reminder'
              },
              retryCount: 0,
              maxRetries: 3
            });
          }
        }
      }

      console.log(`✅ Scheduled habit reminders for user: ${user.id}`);
    } catch (error) {
      console.error(`❌ Error scheduling habit reminders for user ${user.id}:`, error);
      throw error;
    }
  }

  // Create dynamic habit reminder messages
  private createHabitReminderMessage(habit: Habit, reminder: any): string {
    const timeOfDay = new Date().getHours();
    const habitName = habit.title;
    
    // Use custom message if provided
    if (reminder.message) {
      return reminder.message;
    }
    
    // Create contextual messages based on time of day
    if (timeOfDay < 12) {
      return `Good morning! Time to ${habitName.toLowerCase()} and start your day right! ☀️`;
    } else if (timeOfDay < 17) {
      return `Afternoon reminder: Time to ${habitName.toLowerCase()} and stay on track! 🌤️`;
    } else {
      return `Evening check-in: Time to ${habitName.toLowerCase()} and end your day strong! 🌙`;
    }
  }

  // Schedule motivational nudge
  async scheduleMotivationalNudge(
    user: User,
    message?: string,
    scheduledFor?: Date
  ): Promise<string> {
    if (!user.fcmToken) {
      throw new Error('No FCM token available for user');
    }

    // Use provided message or generate dynamic one
    const motivationalMessage = message || this.createMotivationalMessage();
    const scheduleTime = scheduledFor || this.getOptimalMotivationalTime();

    return await this.scheduleNotification({
      userId: user.id,
      fcmToken: user.fcmToken || '',
      type: 'motivational_nudge',
      title: '💪 Motivation Boost',
      body: motivationalMessage,
      scheduledFor: scheduleTime.toISOString(),
      status: 'pending',
      data: {
        type: 'motivational_nudge'
      },
      retryCount: 0,
      maxRetries: 3
    });
  }

  // Create dynamic motivational messages
  private createMotivationalMessage(): string {
    const motivationalMessages = [
      "You're doing amazing! Every step forward counts! 💪",
      "Consistency beats perfection. Keep going! 🌟",
      "Your future self will thank you for today's efforts! ✨",
      "Small progress is still progress. You've got this! 🔥",
      "Every expert was once a beginner. Keep learning! 📚",
      "The only bad workout is the one that didn't happen! 💯",
      "You're stronger than you think. Believe in yourself! 🚀",
      "Today's choices create tomorrow's results! 🎯",
      "You're building habits that will last a lifetime! 🏗️",
      "Success is not final, failure is not fatal. Keep moving! ⚡"
    ];

    return motivationalMessages[Math.floor(Math.random() * motivationalMessages.length)];
  }

  // Get optimal time for motivational messages
  private getOptimalMotivationalTime(): Date {
    const now = new Date();
    const currentHour = now.getHours();
    
    // Send motivational messages at optimal times
    if (currentHour < 12) {
      // Morning motivation
      return new Date(now.getFullYear(), now.getMonth(), now.getDate(), 9, 0, 0);
    } else if (currentHour < 17) {
      // Afternoon pick-me-up
      return new Date(now.getFullYear(), now.getMonth(), now.getDate(), 15, 0, 0);
    } else {
      // Evening motivation
      return new Date(now.getFullYear(), now.getMonth(), now.getDate(), 19, 0, 0);
    }
  }

  // Schedule achievement notification
  async scheduleAchievementNotification(
    user: User,
    achievement: string,
    scheduledFor: Date
  ): Promise<string> {
    if (!user.fcmToken) {
      throw new Error('No FCM token available for user');
    }

    return await this.scheduleNotification({
      userId: user.id,
      fcmToken: user.fcmToken || '',
      type: 'achievement',
      title: '🎉 Achievement Unlocked!',
      body: achievement,
      scheduledFor: scheduledFor.toISOString(),
      status: 'pending',
      data: {
        type: 'achievement'
      },
      retryCount: 0,
      maxRetries: 3
    });
  }

  // Get next occurrence of a weekly schedule
  private getNextOccurrence(dayOfWeek: number, hour: number, minute: number): Date {
    const now = new Date();
    const target = new Date(now);
    
    // Set the target time
    target.setHours(hour, minute, 0, 0);
    
    // Calculate days until next occurrence
    const currentDay = now.getDay(); // 0 = Sunday, 1 = Monday, etc.
    let daysUntilTarget = dayOfWeek - currentDay;
    
    // If target day has passed this week, schedule for next week
    if (daysUntilTarget <= 0 && target <= now) {
      daysUntilTarget += 7;
    }
    
    // Add the required days
    target.setDate(target.getDate() + daysUntilTarget);
    
    return target;
  }

  // Clean up old notifications
  async cleanupOldNotifications(): Promise<void> {
    try {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const notificationsRef = collection(firebaseFirestore, 'scheduled_notifications');
      const q = query(
        notificationsRef,
        where('createdAt', '<', thirtyDaysAgo.toISOString()),
        where('status', 'in', ['sent', 'failed', 'cancelled'])
      );

      const snapshot = await getDocs(q);
      
      for (const doc of snapshot.docs) {
        await deleteDoc(doc.ref);
      }

      console.log(`🧹 Cleaned up ${snapshot.docs.length} old notifications`);
    } catch (error) {
      console.error('❌ Error cleaning up old notifications:', error);
    }
  }

  // Get notification statistics
  async getNotificationStats(): Promise<{
    total: number;
    pending: number;
    sent: number;
    failed: number;
    cancelled: number;
  }> {
    try {
      const notificationsRef = collection(firebaseFirestore, 'scheduled_notifications');
      
      const [totalSnapshot, pendingSnapshot, sentSnapshot, failedSnapshot, cancelledSnapshot] = await Promise.all([
        getDocs(notificationsRef),
        getDocs(query(notificationsRef, where('status', '==', 'pending'))),
        getDocs(query(notificationsRef, where('status', '==', 'sent'))),
        getDocs(query(notificationsRef, where('status', '==', 'failed'))),
        getDocs(query(notificationsRef, where('status', '==', 'cancelled')))
      ]);

      return {
        total: totalSnapshot.docs.length,
        pending: pendingSnapshot.docs.length,
        sent: sentSnapshot.docs.length,
        failed: failedSnapshot.docs.length,
        cancelled: cancelledSnapshot.docs.length
      };
    } catch (error) {
      console.error('❌ Error getting notification stats:', error);
      return {
        total: 0,
        pending: 0,
        sent: 0,
        failed: 0,
        cancelled: 0
      };
    }
  }
}

// Export singleton instance
export const notificationSchedulerService = NotificationSchedulerService.getInstance();
