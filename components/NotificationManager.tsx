import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
} from 'react-native';
import { Bell, CheckCircle, AlertCircle, Trash2, Activity } from 'lucide-react-native';
import { useTheme } from '@/context/ThemeContext';
import { useLanguage } from '@/context/LanguageContext';
import { useHabits } from '@/context/HabitContext';
import { 
  checkNotificationHealth, 
  cleanupOrphanedNotifications,
  requestNotificationPermissions 
} from '@/services/NotificationService';

interface NotificationHealth {
  totalScheduled: number;
  activeNotifications: number;
  failedNotifications: number;
  orphanedNotifications: number;
}

export default function NotificationManager() {
  const { currentTheme } = useTheme();
  const { t } = useLanguage();
  const { habits } = useHabits();
  const [health, setHealth] = useState<NotificationHealth | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [permissionStatus, setPermissionStatus] = useState<boolean | null>(null);

  const styles = createStyles(currentTheme.colors);

  useEffect(() => {
    checkHealth();
    checkPermissions();
  }, []);

  const checkHealth = async () => {
    setIsLoading(true);
    try {
      const healthData = await checkNotificationHealth();
      setHealth(healthData);
    } catch (error) {
      console.error('Failed to check notification health:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const checkPermissions = async () => {
    try {
      const hasPermission = await requestNotificationPermissions();
      setPermissionStatus(hasPermission);
    } catch (error) {
      console.error('Failed to check notification permissions:', error);
    }
  };

  const handleCleanup = async () => {
    Alert.alert(
      t('notificationManager.cleanupTitle'),
      t('notificationManager.cleanupMessage'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.cleanup'),
          style: 'destructive',
          onPress: async () => {
            setIsLoading(true);
            try {
              const cleanedCount = await cleanupOrphanedNotifications();
              Alert.alert(
                t('notificationManager.cleanupComplete'),
                t('notificationManager.cleanedCount', { count: cleanedCount })
              );
              await checkHealth(); // Refresh health data
            } catch (error) {
              Alert.alert(t('common.error'), t('notificationManager.cleanupFailed'));
            } finally {
              setIsLoading(false);
            }
          }
        }
      ]
    );
  };

  const getStatusColor = (status: 'good' | 'warning' | 'error') => {
    switch (status) {
      case 'good':
        return currentTheme.colors.success;
      case 'warning':
        return currentTheme.colors.warning;
      case 'error':
        return currentTheme.colors.error;
      default:
        return currentTheme.colors.text;
    }
  };

  const getStatusIcon = (status: 'good' | 'warning' | 'error') => {
    switch (status) {
      case 'good':
        return <CheckCircle size={20} color={getStatusColor(status)} />;
      case 'warning':
        return <AlertCircle size={20} color={getStatusColor(status)} />;
      case 'error':
        return <AlertCircle size={20} color={getStatusColor(status)} />;
      default:
        return <Activity size={20} color={currentTheme.colors.text} />;
    }
  };

  const getOverallStatus = () => {
    if (!health) return 'unknown';
    if (health.failedNotifications > 0 || health.orphanedNotifications > 5) return 'error';
    if (health.orphanedNotifications > 0) return 'warning';
    return 'good';
  };

  const overallStatus = getOverallStatus();

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Bell size={24} color={currentTheme.colors.primary} />
        <Text style={styles.title}>{t('notificationManager.title')}</Text>
      </View>

      {/* Permission Status */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('notificationManager.permissions')}</Text>
        <View style={styles.statusRow}>
          <Text style={styles.statusLabel}>{t('notificationManager.permissionStatus')}</Text>
          <View style={styles.statusValue}>
            {permissionStatus === true ? (
              <CheckCircle size={16} color={currentTheme.colors.success} />
            ) : permissionStatus === false ? (
              <AlertCircle size={16} color={currentTheme.colors.error} />
            ) : (
              <Activity size={16} color={currentTheme.colors.text} />
            )}
            <Text style={[
              styles.statusText,
              { color: permissionStatus === true ? currentTheme.colors.success : 
                       permissionStatus === false ? currentTheme.colors.error : 
                       currentTheme.colors.text }
            ]}>
              {permissionStatus === true ? t('notificationManager.granted') :
               permissionStatus === false ? t('notificationManager.denied') :
               t('notificationManager.checking')}
            </Text>
          </View>
        </View>
      </View>

      {/* Health Status */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>{t('notificationManager.healthStatus')}</Text>
          <TouchableOpacity onPress={checkHealth} disabled={isLoading}>
            <Activity size={16} color={currentTheme.colors.primary} />
          </TouchableOpacity>
        </View>

        {health ? (
          <>
            <View style={styles.healthGrid}>
              <View style={styles.healthItem}>
                <Text style={styles.healthLabel}>{t('notificationManager.totalScheduled')}</Text>
                <Text style={styles.healthValue}>{health.totalScheduled}</Text>
              </View>
              <View style={styles.healthItem}>
                <Text style={styles.healthLabel}>{t('notificationManager.active')}</Text>
                <Text style={[styles.healthValue, { color: currentTheme.colors.success }]}>
                  {health.activeNotifications}
                </Text>
              </View>
              <View style={styles.healthItem}>
                <Text style={styles.healthLabel}>{t('notificationManager.failed')}</Text>
                <Text style={[styles.healthValue, { color: currentTheme.colors.error }]}>
                  {health.failedNotifications}
                </Text>
              </View>
              <View style={styles.healthItem}>
                <Text style={styles.healthLabel}>{t('notificationManager.orphaned')}</Text>
                <Text style={[styles.healthValue, { color: currentTheme.colors.warning }]}>
                  {health.orphanedNotifications}
                </Text>
              </View>
            </View>

            {/* Overall Status */}
            <View style={styles.overallStatus}>
              {getStatusIcon(overallStatus as 'good' | 'warning' | 'error')}
              <Text style={[styles.overallStatusText, { color: getStatusColor(overallStatus as 'good' | 'warning' | 'error') }]}>
                {overallStatus === 'good' ? t('notificationManager.statusGood') :
                 overallStatus === 'warning' ? t('notificationManager.statusWarning') :
                 t('notificationManager.statusError')}
              </Text>
            </View>
          </>
        ) : (
          <Text style={styles.loadingText}>
            {isLoading ? t('notificationManager.loading') : t('notificationManager.noData')}
          </Text>
        )}
      </View>

      {/* Actions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('notificationManager.actions')}</Text>
        
        <TouchableOpacity 
          style={styles.actionButton} 
          onPress={handleCleanup}
          disabled={isLoading}
        >
          <Trash2 size={16} color={currentTheme.colors.error} />
          <Text style={[styles.actionButtonText, { color: currentTheme.colors.error }]}>
            {t('notificationManager.cleanupOrphaned')}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.actionButton} 
          onPress={checkPermissions}
          disabled={isLoading}
        >
          <Bell size={16} color={currentTheme.colors.primary} />
          <Text style={[styles.actionButtonText, { color: currentTheme.colors.primary }]}>
            {t('notificationManager.requestPermissions')}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Habit Notifications Summary */}
      {habits && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('notificationManager.habitSummary')}</Text>
          <View style={styles.habitSummary}>
            <Text style={styles.summaryText}>
              {t('notificationManager.totalHabits', { count: habits.length })}
            </Text>
            <Text style={styles.summaryText}>
              {t('notificationManager.habitsWithReminders', { 
                count: habits.filter(h => h.reminderEnabled).length 
              })}
            </Text>
            <Text style={styles.summaryText}>
              {t('notificationManager.habitsWithTracking', { 
                count: habits.filter(h => h.notificationIds && h.notificationIds.length > 0).length 
              })}
            </Text>
          </View>
        </View>
      )}
    </ScrollView>
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
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
    marginLeft: 8,
  },
  section: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusLabel: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  statusValue: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusText: {
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 4,
  },
  healthGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  healthItem: {
    width: '48%',
    backgroundColor: colors.card,
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  healthLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  healthValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
  },
  overallStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    padding: 12,
    borderRadius: 8,
  },
  overallStatusText: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
  loadingText: {
    fontSize: 14,
    color: colors.textSecondary,
    fontStyle: 'italic',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 8,
  },
  habitSummary: {
    backgroundColor: colors.card,
    padding: 12,
    borderRadius: 8,
  },
  summaryText: {
    fontSize: 14,
    color: colors.text,
    marginBottom: 4,
  },
});
