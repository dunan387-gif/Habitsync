import React, { useState, useEffect } from 'react';
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
import { useLanguage } from '@/context/LanguageContext';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface NotificationSetting {
  id: string;
  title: string;
  description: string;
  enabled: boolean;
  category: 'push' | 'email' | 'inApp';
}

export default function NotificationPreferencesScreen() {
  const { currentTheme } = useTheme();
  const { t } = useLanguage();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  
  const [notifications, setNotifications] = useState<NotificationSetting[]>([
    {
      id: '1',
      title: t('notificationPreferences.habitReminders'),
      description: t('notificationPreferences.habitRemindersDesc'),
      enabled: true,
      category: 'push',
    },
    {
      id: '2',
      title: t('notificationPreferences.streakAchievements'),
      description: t('notificationPreferences.streakAchievementsDesc'),
      enabled: true,
      category: 'push',
    },
    {
      id: '3',
      title: t('notificationPreferences.weeklyProgress'),
      description: t('notificationPreferences.weeklyProgressDesc'),
      enabled: false,
      category: 'push',
    },
    {
      id: '4',
      title: t('notificationPreferences.dailySummary'),
      description: t('notificationPreferences.dailySummaryDesc'),
      enabled: true,
      category: 'email',
    },
    {
      id: '5',
      title: t('notificationPreferences.monthlyReports'),
      description: t('notificationPreferences.monthlyReportsDesc'),
      enabled: true,
      category: 'email',
    },
    {
      id: '6',
      title: t('notificationPreferences.tipsMotivation'),
      description: t('notificationPreferences.tipsMotivationDesc'),
      enabled: false,
      category: 'email',
    },
  ]);

  const styles = createStyles(currentTheme.colors);

  // Remove this duplicate import line:
  // import AsyncStorage from '@react-native-async-storage/async-storage';
  
  // Update handleToggleNotification function
  const handleToggleNotification = async (id: string) => {
    setIsLoading(true);
    try {
      const updatedNotifications = notifications.map(notification => 
        notification.id === id 
          ? { ...notification, enabled: !notification.enabled }
          : notification
      );
      
      setNotifications(updatedNotifications);
      
      // Save to persistent storage
      await AsyncStorage.setItem('notificationSettings', JSON.stringify(updatedNotifications));
      
    } catch (error) {
      Alert.alert(t('notificationPreferences.error'), t('notificationPreferences.failedToUpdate'));
    } finally {
      setIsLoading(false);
    }
  };

  // Load settings on component mount
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const saved = await AsyncStorage.getItem('notificationSettings');
        if (saved) {
          setNotifications(JSON.parse(saved));
        }
      } catch (error) {
        console.error('Failed to load notification settings:', error);
      }
    };
    loadSettings();
  }, []);

  const getCategoryTitle = (category: string) => {
    switch (category) {
      case 'push':
        return t('notificationPreferences.pushNotifications');
      case 'email':
        return t('notificationPreferences.emailNotifications');
      default:
        return t('notificationPreferences.inAppNotifications');
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
        <Text style={styles.title}>{t('notificationPreferences.title')}</Text>
      </View>

      <ScrollView 
        style={styles.content}
        contentContainerStyle={{ paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
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
          <Text style={styles.infoTitle}>{t('notificationPreferences.notificationSettings')}</Text>
          <Text style={styles.infoText}>
            {t('notificationPreferences.notificationInfo')}
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