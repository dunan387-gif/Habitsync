import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useHabits } from '@/context/HabitContext';
import { useTheme } from '@/context/ThemeContext';
import { CheckCircle, Calendar, Clock, TrendingUp } from 'lucide-react-native';

type ActivityItem = {
  id: string;
  type: 'completion' | 'streak' | 'milestone';
  habitTitle: string;
  date: string;
  description: string;
  icon: React.ReactNode;
};

export default function ActivityLog() {
  const { habits } = useHabits();
  const { currentTheme } = useTheme();

  const activityItems = useMemo(() => {
    if (!habits) return [];
    
    const items: ActivityItem[] = [];
    const today = new Date();
    
    // Generate activity items for the last 30 days
    for (let i = 0; i < 30; i++) {
      const date = new Date();
      date.setDate(today.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      const displayDate = date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric',
        weekday: 'short'
      });
      
      habits.forEach(habit => {
        // Check if habit was completed on this date
        if (habit.completedDates.includes(dateStr)) {
          items.push({
            id: `${habit.id}-${dateStr}`,
            type: 'completion',
            habitTitle: habit.title,
            date: displayDate,
            description: `Completed ${habit.title}`,
            icon: <CheckCircle size={20} color={currentTheme.colors.success} />
          });
        }
        
        // Check for streak milestones
        const completionIndex = habit.completedDates.indexOf(dateStr);
        if (completionIndex !== -1) {
          const streakAtTime = completionIndex + 1;
          if (streakAtTime % 7 === 0 && streakAtTime >= 7) {
            items.push({
              id: `${habit.id}-streak-${dateStr}`,
              type: 'milestone',
              habitTitle: habit.title,
              date: displayDate,
              description: `🎉 ${streakAtTime}-day streak milestone!`,
              icon: <TrendingUp size={20} color={currentTheme.colors.accent} />
            });
          }
        }
      });
    }
    
    // Sort by date (most recent first)
    return items.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 50);
  }, [habits, currentTheme.colors]);

  const styles = createStyles(currentTheme.colors);

  const renderActivityItem = (item: ActivityItem) => (
    <View key={item.id} style={styles.activityItem}>
      <View style={styles.iconContainer}>
        {item.icon}
      </View>
      <View style={styles.activityContent}>
        <Text style={styles.activityDescription}>{item.description}</Text>
        <Text style={styles.activityDate}>{item.date}</Text>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>📋 Activity Log</Text>
      {activityItems.length > 0 ? (
        <View style={styles.list}>
          {activityItems.map(renderActivityItem)}
        </View>
      ) : (
        <View style={styles.emptyState}>
          <Calendar size={48} color={currentTheme.colors.textMuted} />
          <Text style={styles.emptyText}>No activity yet</Text>
          <Text style={styles.emptySubtext}>Complete some habits to see your activity log</Text>
        </View>
      )}
    </View>
  );
}

const createStyles = (colors: any) => StyleSheet.create({
  container: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 16,
  },
  list: {
    // Remove maxHeight constraint since we're not using ScrollView
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  activityContent: {
    flex: 1,
  },
  activityDescription: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text,
    marginBottom: 2,
  },
  activityDate: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.textMuted,
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 8,
    textAlign: 'center',
  },
});