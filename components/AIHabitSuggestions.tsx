import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Sparkles, Plus, Clock, Target } from 'lucide-react-native';
import { useHabits } from '@/context/HabitContext';
import { useLanguage } from '@/context/LanguageContext';
import { useTheme } from '@/context/ThemeContext';
import { AIHabitSuggestion } from '@/types';

type AIHabitSuggestionsProps = {
  onAddSuggestion: (suggestion: AIHabitSuggestion) => void;
};

export default function AIHabitSuggestions({ onAddSuggestion }: AIHabitSuggestionsProps) {
  const { getAIHabitSuggestions, getSmartReminderSuggestions } = useHabits();
  const { t } = useLanguage();
  const { currentTheme } = useTheme();
  
  const habitSuggestions = getAIHabitSuggestions();
  const reminderSuggestions = getSmartReminderSuggestions();

  if (habitSuggestions.length === 0 && reminderSuggestions.length === 0) {
    return null;
  }

  const styles = createStyles(currentTheme.colors);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Sparkles size={20} color="#6366f1" />
        <Text style={styles.title}>{t('ai_suggestions')}</Text>
      </View>
      
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        {/* Habit Suggestions */}
        {habitSuggestions.map((suggestion) => (
          <View key={suggestion.id} style={styles.suggestionCard}>
            <View style={styles.cardHeader}>
              <Target size={16} color="#10b981" />
              <Text style={styles.cardTitle}>{t('new_habit')}</Text>
            </View>
            
            <Text style={styles.habitTitle}>{t(suggestion.title)}</Text>
            <Text style={styles.reason}>{suggestion.reason}</Text>
            
            <View style={styles.confidenceContainer}>
              <View style={[styles.confidenceBar, { width: `${suggestion.confidence * 100}%` }]} />
              <Text style={styles.confidenceText}>
                {Math.round(suggestion.confidence * 100)}% {t('match')}
              </Text>
            </View>
            
            <TouchableOpacity 
              style={styles.addButton}
              onPress={() => onAddSuggestion(suggestion)}
            >
              <Plus size={16} color="white" />
              <Text style={styles.addButtonText}>{t('add_habit_button')}</Text>
            </TouchableOpacity>
          </View>
        ))}
        
        {/* Smart Reminder Suggestions */}
        {reminderSuggestions.map((suggestion) => (
          <View key={`reminder-${suggestion.habitId}`} style={styles.suggestionCard}>
            <View style={styles.cardHeader}>
              <Clock size={16} color="#f59e0b" />
              <Text style={styles.cardTitle}>{t('smart_reminder')}</Text>
            </View>
            
            <Text style={styles.habitTitle}>{t('optimal_time')}: {suggestion.suggestedTime}</Text>
            <Text style={styles.reason}>{suggestion.reason}</Text>
            
            <View style={styles.confidenceContainer}>
              <View style={[styles.confidenceBar, { width: `${suggestion.confidence * 100}%` }]} />
              <Text style={styles.confidenceText}>
                {Math.round(suggestion.confidence * 100)}% {t('confidence')}
              </Text>
            </View>
            
            <TouchableOpacity style={styles.addButton}>
              <Clock size={16} color="white" />
              <Text style={styles.addButtonText}>{t('set_reminder')}</Text>
            </TouchableOpacity>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const createStyles = (colors: any) => StyleSheet.create({
  container: {
    marginTop: 12,
    marginBottom: 2,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    paddingHorizontal: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 8,
    color: colors.textMuted,
  },
  suggestionCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 12, // Reduced from 16
    marginHorizontal: 12,
    marginBottom: 12,
    width: 240, // Reduced from 280
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6, // Reduced from 8
  },
  cardTitle: {
    fontSize: 11, // Reduced from 12
    fontWeight: '500',
    marginLeft: 4,
    color: '#6b7280',
    textTransform: 'uppercase',
  },
  habitTitle: {
    fontSize: 15, // Reduced from 16
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 6, // Reduced from 8
  },
  reason: {
    fontSize: 13, // Reduced from 14
    color: '#6b7280',
    lineHeight: 18, // Reduced from 20
    marginBottom: 10, // Reduced from 12
  },
  confidenceContainer: {
    marginBottom: 12, // Reduced from 16
  },
  confidenceBar: {
    height: 3, // Reduced from 4
    backgroundColor: '#10b981',
    borderRadius: 2,
    marginBottom: 4,
  },
  confidenceText: {
    fontSize: 11, // Reduced from 12
    color: '#6b7280',
  },
  addButton: {
    backgroundColor: '#6366f1',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6, // Reduced from 8
    paddingHorizontal: 10, // Reduced from 12
    borderRadius: 8,
  },
  addButtonText: {
    color: 'white',
    fontWeight: '500',
    fontSize: 13, // Added smaller font size
    marginLeft: 4,
  },
});