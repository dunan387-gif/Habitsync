import React, { useRef, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated, Alert } from 'react-native';
import { Plus, Edit2, Trash2, Check } from 'lucide-react-native';
import { HabitSuggestion as HabitSuggestionType, Habit } from '@/types';
import { useLanguage } from '@/context/LanguageContext';
import { useTheme } from '@/context/ThemeContext';

type HabitSuggestionProps = {
  habit: HabitSuggestionType;
  onAdd: () => void;
  userHabit?: Habit;
  onEdit?: (habit: Habit) => void;
  onDelete?: (habitId: string) => void;
};

export default function HabitSuggestion({ 
  habit, 
  onAdd, 
  userHabit, 
  onEdit, 
  onDelete 
}: HabitSuggestionProps) {
  const { t } = useLanguage();
  const { currentTheme } = useTheme();
  const isUserHabit = !!userHabit;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const [isAdded, setIsAdded] = useState(false);

  const handleAddPress = () => {
    // Scale animation
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.9,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1.1,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();

    // Show success state
    setIsAdded(true);
    
    // Call the original onAdd function
    onAdd();
    
    // Show success popup with properly translated title
    const habitTitle = habit.title.includes('_') ? t(habit.title) : habit.title;
    Alert.alert(
      t('success'),
      `"${habitTitle}" ${t('habit_added_message')}`,
      [{ text: t('great'), style: 'default' }],
      { cancelable: true }
    );
    
    // Reset success state after animation
    setTimeout(() => setIsAdded(false), 2000);
  };

  const styles = createStyles(currentTheme.colors);
  
  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>{isUserHabit ? habit.title : t(habit.title)}</Text>
        <Text style={styles.description}>{isUserHabit ? (habit.description || userHabit?.notes || '') : t(habit.description)}</Text>
        
        {habit.benefits && !isUserHabit && (
          <View style={styles.benefitsContainer}>
            <Text style={styles.benefitsLabel}>{t('benefits')}:</Text>
            <Text style={styles.benefitsText}>{t(habit.benefits)}</Text>
          </View>
        )}

        {isUserHabit && (
          <View style={styles.streakContainer}>
            <Text style={styles.streakText}>{userHabit.streak} {t('day_streak')}</Text>
          </View>
        )}
      </View>
      
      {isUserHabit ? (
        <View style={styles.actionsContainer}>
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => onEdit && userHabit && onEdit(userHabit)}
            activeOpacity={0.7}
          >
            <Edit2 size={18} color="#4ECDC4" />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.actionButton, styles.deleteButton]}
            onPress={() => onDelete && userHabit && onDelete(userHabit.id)}
            activeOpacity={0.7}
          >
            <Trash2 size={18} color="#EF4444" />
          </TouchableOpacity>
        </View>
      ) : (
        <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
          <TouchableOpacity 
            style={[styles.addButton, isAdded && styles.addedButton]}
            onPress={handleAddPress}
            activeOpacity={0.8}
          >
            {isAdded ? (
              <Check size={20} color="#FFFFFF" />
            ) : (
              <Plus size={20} color="#4ECDC4" />
            )}
          </TouchableOpacity>
        </Animated.View>
      )}
    </View>
  );
}

const createStyles = (colors: any) => StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: colors.card,
    borderRadius: 12,
    marginBottom: 12,
    marginHorizontal: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  content: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  description: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 8,
  },
  benefitsContainer: {
    backgroundColor: colors.surface,
    padding: 8,
    borderRadius: 8,
  },
  benefitsLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.primary,
    marginBottom: 2,
  },
  benefitsText: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  streakContainer: {
    backgroundColor: colors.surface,
    padding: 8,
    borderRadius: 8,
  },
  streakText: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 12,
    alignSelf: 'center',
    backgroundColor: colors.card,
  },
  addedButton: {
    backgroundColor: colors.success,
    borderColor: colors.success,
  },
  actionsContainer: {
    flexDirection: 'column',
    justifyContent: 'center',
    marginLeft: 12,
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    backgroundColor: colors.card,
  },
  deleteButton: {
    borderColor: colors.error,
  },
});