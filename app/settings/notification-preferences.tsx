import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Switch,
  ScrollView,
  Alert,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { ArrowLeft, Bell, Mail, Smartphone } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '@/context/ThemeContext';

interface NotificationSetting {
  id: string;
  title: string;
  description: string;
  enabled: boolean;
  category: 'push' | 'email' | 'inApp';
}

export default function NotificationPreferencesScreen() {
  const { currentTheme } = useTheme();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  
  const [notifications, setNotifications] = useState<NotificationSetting[]>([
    {
      id: '1',
      title: 'Habit Reminders',
      description: 'Get reminded when it\'s time to complete your habits',
      enabled: true,
      category: 'push',
    },
    {
      id: '2',
      title: 'Streak Achievements',
      description: 'Celebrate when you reach new streak milestones',
      enabled: true,
      category: 'push',
    },
    {
      id: '3',
      title: 'Weekly Progress',
      description: 'Weekly summary of your habit progress',
      enabled: false,
      category: 'push',
    },
    {
      id: '4',
      title: 'Daily Summary',
      description: 'Daily recap of completed and missed habits',
      enabled: true,
      category: 'email',
    },
    {
      id: '5',
      title: 'Monthly Reports',
      description: 'Detailed monthly progress reports',
      enabled: true,
      category: 'email',
    },
    {
      id: '6',
      title: 'Tips & Motivation',
      description: 'Helpful tips and motivational content',
      enabled: false,
      category: 'email',
    },
  ]);

  const styles = createStyles(currentTheme.colors);

  const handleToggleNotification = async (id: string) => {
    setIsLoading(true);
    try {
      // TODO: Implement API call to update notification preferences
      await new Promise(resolve => setTimeout(resolve, 500));
      
      setNotifications(prev => 
        prev.map(notification => 
          notification.id === id 
            ? { ...notification, enabled: !notification.enabled }
            : notification
        )
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to update notification preferences');
    } finally {
      setIsLoading(false);
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'push':
        return <Smartphone size={20} color={currentTheme.colors.primary} />;
      case 'email':
        return <Mail size={20} color={currentTheme.colors.primary} />;
      default:
        return <Bell size={20} color={currentTheme.colors.primary} />;
    }
  };

  const getCategoryTitle = (category: string) => {
    switch (category) {
      case 'push':
        return 'Push Notifications';
      case 'email':
        return 'Email Notifications';
      default:
        return 'In-App Notifications';
    }
  };

  const groupedNotifications = notifications.reduce((acc, notification) => {
    if (!acc[notification.category]) {
      acc[notification.category] = [];
    }
    acc[notification.category].push(notification);
    return acc;
  }, {} as Record<string, NotificationSetting[]>);

  const renderNotificationItem = (notification: NotificationSetting) => (
    <View key={notification.id} style={styles.notificationItem}>
      <View style={styles.notificationInfo}>
        <Text style={styles.notificationTitle}>{notification.title}</Text>
        <Text style={styles.notificationDescription}>{notification.description}</Text>
      </View>
      <Switch
        value={notification.enabled}
        onValueChange={() => handleToggleNotification(notification.id)}
        disabled={isLoading}
        trackColor={{ false: currentTheme.colors.border, true: currentTheme.colors.primary }}
        thumbColor={currentTheme.colors.background}
      />
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: currentTheme.colors.background }]}>
      <StatusBar style={currentTheme.isDark ? 'light' : 'dark'} />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color={currentTheme.colors.text} />
        </TouchableOpacity>
        <Text style={styles.title}>Notification Preferences</Text>
      </View>

      <ScrollView style={styles.content}>
        {Object.entries(groupedNotifications).map(([category, categoryNotifications]) => (
          <View key={category} style={styles.categorySection}>
            <View style={styles.categoryHeader}>
              {getCategoryIcon(category)}
              <Text style={styles.categoryTitle}>{getCategoryTitle(category)}</Text>
            </View>
            
            <View style={styles.categoryContent}>
              {categoryNotifications.map(renderNotificationItem)}
            </View>
          </View>
        ))}
        
        <View style={styles.infoSection}>
          <Text style={styles.infoTitle}>Notification Settings</Text>
          <Text style={styles.infoText}>
            You can customize when and how you receive notifications. Push notifications require permission from your device settings.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const createStyles = (colors: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: {
    marginRight: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.text,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  categorySection: {
    marginBottom: 32,
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  categoryTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginLeft: 8,
  },
  categoryContent: {
    backgroundColor: colors.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  notificationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  notificationInfo: {
    flex: 1,
    marginRight: 16,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.text,
    marginBottom: 4,
  },
  notificationDescription: {
    fontSize: 14,
    color: colors.textMuted,
    lineHeight: 18,
  },
  infoSection: {
    backgroundColor: colors.card,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    marginTop: 16,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.text,
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: colors.textMuted,
    lineHeight: 20,
  },
});