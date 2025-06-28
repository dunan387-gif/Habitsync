import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Plus, Edit2, Trash2 } from 'lucide-react-native';
import { HabitSuggestion as HabitSuggestionType, Habit } from '@/types';
import { useLanguage } from '@/context/LanguageContext';

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
  const isUserHabit = !!userHabit;

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
        <TouchableOpacity 
          style={styles.addButton}
          onPress={onAdd}
          activeOpacity={0.7}
        >
          <Plus size={20} color="#4ECDC4" />
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
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
    color: '#1E293B',
    marginBottom: 4,
  },
  description: {
    fontSize: 14,
    color: '#64748B',
    marginBottom: 8,
  },
  benefitsContainer: {
    backgroundColor: '#F1F5F9',
    padding: 8,
    borderRadius: 8,
  },
  benefitsLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4ECDC4',
    marginBottom: 2,
  },
  benefitsText: {
    fontSize: 12,
    color: '#64748B',
  },
  streakContainer: {
    backgroundColor: '#F1F5F9',
    padding: 8,
    borderRadius: 8,
  },
  streakText: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#4ECDC4',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 12,
    alignSelf: 'center',
    backgroundColor: '#FFFFFF',
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
    borderColor: '#4ECDC4',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    backgroundColor: '#FFFFFF',
  },
  deleteButton: {
    borderColor: '#EF4444',
  },
});