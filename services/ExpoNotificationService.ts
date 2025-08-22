import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform, Alert } from 'react-native';
import { firebaseAuth, firebaseFirestore } from '@/lib/firebase';
import { doc, updateDoc } from 'firebase/firestore';

// Configure notification handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export interface ExpoNotification {
  title: string;
  body: string;
  data?: Record<string, any>;
  sound?: string;
  badge?: number;
  channelId?: string;
  tag?: string;
}

export class ExpoNotificationService {
  private static instance: ExpoNotificationService;
  private expoPushToken: string | null = null;
  private notificationListener: any = null;
  private responseListener: any = null;

  static getInstance(): ExpoNotificationService {
    if (!ExpoNotificationService.instance) {
      ExpoNotificationService.instance = new ExpoNotificationService();
    }
    return ExpoNotificationService.instance;
  }

  // Initialize push notifications
  async initialize(): Promise<void> {
    try {
      console.log('🚀 Initializing Expo notification service...');
      
      // Request permissions
      const hasPermission = await this.requestPermissions();
      if (!hasPermission) {
        console.warn('⚠️ Push notification permissions not granted');
        return;
      }

      // Get Expo push token
      await this.getExpoPushToken();
      
      // Set up listeners
      this.setupNotificationListeners();
      
      // Create notification channels
      await this.createNotificationChannels();
      
      console.log('✅ Expo notification service initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize Expo notification service:', error);
    }
  }

  // Request notification permissions
  private async requestPermissions(): Promise<boolean> {
    if (Platform.OS === 'web') {
      return false;
    }

    try {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      
      if (finalStatus !== 'granted') {
        Alert.alert(
          'Permission Required',
          'Please enable notifications to receive habit reminders and motivational messages.',
          [{ text: 'OK' }]
        );
        return false;
      }

      console.log('📱 Notification permissions granted');
      return true;
    } catch (error) {
      console.error('❌ Error requesting notification permissions:', error);
      return false;
    }
  }

  // Get Expo push token
  private async getExpoPushToken(): Promise<void> {
    try {
      if (Platform.OS === 'web') {
        return;
      }

      if (!Device.isDevice) {
        console.log('⚠️ Expo push tokens work only on physical devices');
        return;
      }

      const token = await Notifications.getExpoPushTokenAsync({
        projectId: 'f998d5c5-325b-4f01-9a46-55f617407d56', // Your Expo project ID from app.json
      });
      
      this.expoPushToken = token.data;
      console.log('📱 Expo Push Token:', token.data);
      
      // Save token to Firestore
      await this.saveTokenToFirestore(token.data);
      
    } catch (error) {
      console.error('❌ Error getting Expo push token:', error);
    }
  }

  // Save Expo push token to Firestore
  private async saveTokenToFirestore(token: string): Promise<void> {
    try {
      if (!firebaseAuth.currentUser) {
        console.log('⚠️ No user logged in, skipping token save');
        return;
      }

      const userId = firebaseAuth.currentUser.uid;
      
      // Update Expo push token and device info in Firestore
      const userDocRef = doc(firebaseFirestore, 'users', userId);
      await updateDoc(userDocRef, {
        expoPushToken: token,
        lastTokenUpdate: new Date().toISOString(),
        deviceInfo: {
          platform: Platform.OS,
          version: Platform.Version,
          brand: Device.brand,
          model: Device.modelName,
        }
      });
      
      console.log('✅ Expo push token saved to Firestore');
    } catch (error) {
      console.error('❌ Error saving Expo push token to Firestore:', error);
    }
  }

  // Set up notification listeners
  private setupNotificationListeners(): void {
    // Foreground notification listener
    this.notificationListener = Notifications.addNotificationReceivedListener(notification => {
      console.log('📱 Foreground notification received:', notification);
      this.handleNotificationReceived(notification);
    });

    // Notification response listener (when user taps notification)
    this.responseListener = Notifications.addNotificationResponseReceivedListener(response => {
      console.log('👆 Notification response received:', response);
      this.handleNotificationResponse(response);
    });
  }

  // Create notification channels (Android)
  private async createNotificationChannels(): Promise<void> {
    if (Platform.OS !== 'android') {
      return;
    }

    const channels = [
      {
        id: 'habit-reminders',
        name: 'Habit Reminders',
        description: 'Reminders for daily habits and routines',
        importance: Notifications.AndroidImportance.HIGH,
        sound: 'default',
        showBadge: true,
        enableVibration: true,
        vibrationPattern: [0, 250, 250, 250],
        lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC
      },
      {
        id: 'mood-check-ins',
        name: 'Mood Check-ins',
        description: 'Gentle reminders to track your mood',
        importance: Notifications.AndroidImportance.DEFAULT,
        sound: 'default',
        showBadge: false,
        enableVibration: false,
        lockscreenVisibility: Notifications.AndroidNotificationVisibility.PRIVATE
      },
      {
        id: 'achievements',
        name: 'Achievements & Milestones',
        description: 'Celebrations for your progress and achievements',
        importance: Notifications.AndroidImportance.DEFAULT,
        sound: 'default',
        showBadge: true,
        enableVibration: true,
        vibrationPattern: [0, 500, 200, 500],
        lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC
      },
      {
        id: 'motivational',
        name: 'Motivational Messages',
        description: 'Encouraging messages to keep you motivated',
        importance: Notifications.AndroidImportance.LOW,
        sound: null,
        showBadge: false,
        enableVibration: false,
        lockscreenVisibility: Notifications.AndroidNotificationVisibility.PRIVATE
      }
    ];

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
          vibrationPattern: channel.vibrationPattern,
          lockscreenVisibility: channel.lockscreenVisibility
        });
        
        console.log(`✅ Created notification channel: ${channel.name}`);
      }
    }
  }

  // Show local notification
  async showLocalNotification(notification: ExpoNotification): Promise<string | null> {
    try {
      const identifier = await Notifications.scheduleNotificationAsync({
        content: {
          title: notification.title,
          body: notification.body,
          data: notification.data || {},
          sound: notification.sound || 'default',
          badge: notification.badge,
        },
        trigger: null, // Show immediately
        ...(Platform.OS === 'android' && notification.channelId && {
          android: {
            channelId: notification.channelId
          }
        })
      });

      console.log('📱 Local notification scheduled:', identifier);
      return identifier;
    } catch (error) {
      console.error('❌ Error showing local notification:', error);
      return null;
    }
  }

  // Schedule habit reminder
  async scheduleHabitReminder(habit: any): Promise<string[]> {
    const identifiers: string[] = [];

    try {
      if (habit.reminders && habit.reminders.length > 0) {
        for (const reminder of habit.reminders) {
          const [hour, minute] = reminder.time.split(':').map(Number);
          
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
                weekday: dayOfWeek + 1,
                hour,
                minute,
              },
              ...(Platform.OS === 'android' && {
                android: {
                  channelId: 'habit-reminders'
                }
              })
            });
            
            identifiers.push(identifier);
          }
        }
      }

      console.log(`✅ Scheduled ${identifiers.length} notifications for habit: ${habit.title}`);
      return identifiers;
    } catch (error) {
      console.error(`❌ Error scheduling habit reminder for ${habit.title}:`, error);
      return identifiers;
    }
  }

  // Handle notification received
  private handleNotificationReceived(notification: Notifications.Notification): void {
    const { data } = notification.request.content;
    
    switch (data?.type) {
      case 'habit_reminder':
        console.log('📱 Habit reminder received:', data);
        break;
      case 'motivational_nudge':
        console.log('📱 Motivational nudge received:', data);
        break;
      case 'achievement':
        console.log('📱 Achievement notification received:', data);
        break;
      default:
        console.log('📱 Unknown notification type received:', data);
    }
  }

  // Handle notification response (user tap)
  private handleNotificationResponse(response: Notifications.NotificationResponse): void {
    const { data } = response.notification.request.content;
    
    // Navigate based on notification type
    switch (data?.type) {
      case 'habit_reminder':
        console.log('👆 User tapped habit reminder, navigating to habit:', data.habitId);
        break;
      case 'motivational_nudge':
        console.log('👆 User tapped motivational nudge');
        break;
      case 'achievement':
        console.log('👆 User tapped achievement notification');
        break;
      default:
        console.log('👆 User tapped notification:', data);
    }
  }

  // Get current Expo push token
  getCurrentExpoPushToken(): string | null {
    return this.expoPushToken;
  }

  // Request battery optimization exemption
  async requestBatteryOptimizationExemption(): Promise<void> {
    if (Platform.OS !== 'android') {
      return;
    }

    try {
      Alert.alert(
        'Battery Optimization',
        'To ensure you receive important habit reminders, please disable battery optimization for HabitSyncer in your device settings.',
        [
          { text: 'Later', style: 'cancel' },
          { text: 'Open Settings', onPress: () => {
            console.log('Opening device settings...');
          }}
        ]
      );
    } catch (error) {
      console.error('❌ Error requesting battery optimization exemption:', error);
    }
  }

  // Clean up listeners
  cleanup(): void {
    if (this.notificationListener) {
      Notifications.removeNotificationSubscription(this.notificationListener);
    }
    if (this.responseListener) {
      Notifications.removeNotificationSubscription(this.responseListener);
    }
  }
}

// Export singleton instance
export const expoNotificationService = ExpoNotificationService.getInstance();
