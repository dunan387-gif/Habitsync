import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
} from 'react-native';
import { Brain, Bell, Zap, Activity } from 'lucide-react-native';
import { useTheme } from '@/context/ThemeContext';
import { useLanguage } from '@/context/LanguageContext';
import { useHabits } from '@/context/HabitContext';

export default function SmartNotificationTester() {
  const { currentTheme } = useTheme();
  const { t } = useLanguage();
  const { habits, triggerSmartNotifications } = useHabits();
  const [isTriggering, setIsTriggering] = useState(false);

  const styles = createStyles(currentTheme.colors);

  const handleTriggerSmartNotifications = async () => {
    setIsTriggering(true);
    try {
      await triggerSmartNotifications();
      Alert.alert(
        'Smart Notifications Triggered',
        'Check your notification settings and logs for details.'
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to trigger smart notifications');
      console.error('Smart notification trigger error:', error);
    } finally {
      setIsTriggering(false);
    }
  };

  const getHabitStats = () => {
    if (!habits) return { total: 0, pending: 0, completed: 0, withReminders: 0 };
    
    return {
      total: habits.length,
      pending: habits.filter(h => !h.completedToday).length,
      completed: habits.filter(h => h.completedToday).length,
      withReminders: habits.filter(h => h.reminderEnabled).length
    };
  };

  const stats = getHabitStats();

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Brain size={24} color={currentTheme.colors.primary} />
        <Text style={styles.title}>Smart Notification Tester</Text>
      </View>

      {/* Stats Overview */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Habit Overview</Text>
        <View style={styles.statsGrid}>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Total Habits</Text>
            <Text style={styles.statValue}>{stats.total}</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Pending Today</Text>
            <Text style={[styles.statValue, { color: currentTheme.colors.warning }]}>
              {stats.pending}
            </Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Completed Today</Text>
            <Text style={[styles.statValue, { color: currentTheme.colors.success }]}>
              {stats.completed}
            </Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>With Reminders</Text>
            <Text style={[styles.statValue, { color: currentTheme.colors.primary }]}>
              {stats.withReminders}
            </Text>
          </View>
        </View>
      </View>

      {/* Smart Notification Trigger */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Trigger Smart Notifications</Text>
        <Text style={styles.description}>
          This will analyze your current mood, habits, and patterns to send intelligent, 
          mood-aware notifications at optimal times.
        </Text>
        
        <TouchableOpacity 
          style={[styles.triggerButton, isTriggering && styles.triggerButtonDisabled]}
          onPress={handleTriggerSmartNotifications}
          disabled={isTriggering}
        >
          {isTriggering ? (
            <Activity size={20} color={currentTheme.colors.background} />
          ) : (
            <Zap size={20} color={currentTheme.colors.background} />
          )}
          <Text style={styles.triggerButtonText}>
            {isTriggering ? 'Triggering...' : 'Trigger Smart Notifications'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* What Smart Notifications Do */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>What Smart Notifications Do</Text>
        
        <View style={styles.featureList}>
          <View style={styles.featureItem}>
            <Bell size={16} color={currentTheme.colors.primary} />
            <Text style={styles.featureText}>
              <Text style={styles.featureTitle}>Mood-Aware Reminders:</Text> Send notifications 
              when your mood matches optimal completion patterns
            </Text>
          </View>
          
          <View style={styles.featureItem}>
            <Brain size={16} color={currentTheme.colors.primary} />
            <Text style={styles.featureText}>
              <Text style={styles.featureTitle}>Encouragement:</Text> Provide support when 
              you're struggling with low mood or multiple pending habits
            </Text>
          </View>
          
          <View style={styles.featureItem}>
            <Zap size={16} color={currentTheme.colors.primary} />
            <Text style={styles.featureText}>
              <Text style={styles.featureTitle}>Celebrations:</Text> Celebrate mood improvements 
              and habit completions to reinforce positive patterns
            </Text>
          </View>
          
          <View style={styles.featureItem}>
            <Activity size={16} color={currentTheme.colors.primary} />
            <Text style={styles.featureText}>
              <Text style={styles.featureTitle}>Risk Check-ins:</Text> Monitor for concerning 
              patterns and prompt wellness check-ins when needed
            </Text>
          </View>
        </View>
      </View>

      {/* Requirements */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Requirements</Text>
        <View style={styles.requirementsList}>
          <Text style={styles.requirementText}>• Notification permissions granted</Text>
          <Text style={styles.requirementText}>• At least one habit with reminders enabled</Text>
          <Text style={styles.requirementText}>• Mood tracking data available</Text>
          <Text style={styles.requirementText}>• Pending habits to complete</Text>
        </View>
      </View>

      {/* Debug Info */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Debug Information</Text>
        <Text style={styles.debugText}>
          Check the console logs for detailed information about:
        </Text>
        <View style={styles.debugList}>
          <Text style={styles.debugItem}>• Mood analysis results</Text>
          <Text style={styles.debugItem}>• Optimal timing calculations</Text>
          <Text style={styles.debugItem}>• Notification scheduling decisions</Text>
          <Text style={styles.debugItem}>• Success/failure status</Text>
        </View>
      </View>
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
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 12,
  },
  description: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statItem: {
    width: '48%',
    backgroundColor: colors.card,
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
  },
  triggerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    padding: 16,
    borderRadius: 8,
    marginTop: 8,
  },
  triggerButtonDisabled: {
    opacity: 0.6,
  },
  triggerButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.background,
    marginLeft: 8,
  },
  featureList: {
    gap: 12,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  featureText: {
    fontSize: 14,
    color: colors.text,
    lineHeight: 20,
    marginLeft: 8,
    flex: 1,
  },
  featureTitle: {
    fontWeight: '600',
    color: colors.primary,
  },
  requirementsList: {
    gap: 8,
  },
  requirementText: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  debugText: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 8,
  },
  debugList: {
    gap: 4,
  },
  debugItem: {
    fontSize: 12,
    color: colors.textSecondary,
    fontFamily: 'monospace',
  },
});
