import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated, Pressable } from 'react-native';
import { useRef, useEffect } from 'react';
import { Check, ChevronRight } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useHabits } from '@/context/HabitContext';
import { useTheme } from '@/context/ThemeContext';
import { Habit } from '@/types';

type HabitItemProps = {
  habit: Habit;
  onLongPress?: () => void;
  isActive?: boolean;
};

export default function HabitItem({ habit, onLongPress, isActive }: HabitItemProps) {
  const router = useRouter();
  const { toggleHabitCompletion } = useHabits();
  const { currentTheme } = useTheme();
  
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const checkOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (habit.completedToday) {
      Animated.sequence([
        Animated.timing(scaleAnim, {
          toValue: 1.1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();

      Animated.timing(checkOpacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } else {
      checkOpacity.setValue(0);
    }
  }, [habit.completedToday]);

  const handleToggle = () => {
    toggleHabitCompletion(habit.id);
  };

  const navigateToDetail = () => {
    router.push(`/habit/${habit.id}`);
  };

  const styles = createStyles(currentTheme.colors);

  return (
    <Pressable
      style={({ pressed }) => [
        styles.container,
        isActive && styles.activeContainer,
        pressed && { opacity: 0.8 }
      ]}
      onPress={navigateToDetail}
      onLongPress={onLongPress}
      delayLongPress={100}
    >
      <TouchableOpacity
        style={styles.checkboxContainer}
        onPress={handleToggle}
        activeOpacity={0.7}
      >
        <Animated.View 
          style={[
            styles.checkbox,
            habit.completedToday && styles.checkboxCompleted,
            { transform: [{ scale: scaleAnim }] }
          ]}
        >
          <Animated.View style={{ opacity: checkOpacity }}>
            <Check size={18} color="#FFFFFF" />
          </Animated.View>
        </Animated.View>
      </TouchableOpacity>
      
      <View style={styles.content}>
        <View style={styles.habitInfo}>
          <View style={styles.titleRow}>
            {habit.icon && (
              <View style={styles.iconContainer}>
                <Text style={styles.habitIcon}>{habit.icon}</Text>
              </View>
            )}
            <Text 
              style={[
                styles.title,
                !habit.icon && styles.titleNoIcon,
                habit.completedToday && styles.titleCompleted
              ]}
            >
              {habit.title}
            </Text>
          </View>
          
          <View style={styles.streakContainer}>
            <View style={styles.streakBadge}>
              <Text style={styles.streakText}>
                {habit.streak} day{habit.streak !== 1 ? 's' : ''}
              </Text>
            </View>
          </View>
        </View>
        
        <ChevronRight size={20} color={currentTheme.colors.textMuted} />
      </View>
    </Pressable>
  );
}

const createStyles = (colors: any) => StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: 12,
    marginBottom: 12,
    padding: 4,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  checkboxContainer: {
    padding: 12,
  },
  checkbox: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.card,
  },
  checkboxCompleted: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  content: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingRight: 16,
  },
  habitInfo: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  habitIcon: {
    fontSize: 22,
    textAlign: 'center',
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    flex: 1,
  },
  titleNoIcon: {
    marginLeft: 0,
  },
  titleCompleted: {
    textDecorationLine: 'line-through',
    color: colors.textMuted,
  },
  streakContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  streakBadge: {
    backgroundColor: colors.surface,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  streakText: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  dragging: {
    opacity: 0.8,
    transform: [{ scale: 1.02 }],
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  activeContainer: {
    transform: [{ scale: 1.05 }],
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    zIndex: 1000,
  },
});