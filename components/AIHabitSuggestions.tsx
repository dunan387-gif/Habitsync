import React, { useRef, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Animated, Alert } from 'react-native';
import { Sparkles, Plus, Clock, Target, Check } from 'lucide-react-native';
import { useHabits } from '@/context/HabitContext';
import { useLanguage } from '@/context/LanguageContext';
import { useTheme } from '@/context/ThemeContext';
import { useSubscription } from '@/context/SubscriptionContext';
import { AIHabitSuggestion, SmartReminderSuggestion } from '@/types';

type AIHabitSuggestionsProps = {
  onAddSuggestion: (suggestion: AIHabitSuggestion) => void;
};

export default function AIHabitSuggestions({ onAddSuggestion }: AIHabitSuggestionsProps) {
  const { getAIHabitSuggestions, getSmartReminderSuggestions, getHabitById, updateHabit } = useHabits();
  const { t } = useLanguage();
  const { currentTheme } = useTheme();
  const { canUseAI, getUsageStats, trackFeatureUsage, showUpgradePrompt } = useSubscription();
  
  const habitSuggestions = getAIHabitSuggestions();
  const reminderSuggestions = getSmartReminderSuggestions();
  const [addedSuggestions, setAddedSuggestions] = useState<Set<string>>(new Set());

  // Get current AI usage
  const usageStats = getUsageStats();
  const currentAIUsage = usageStats.aiSuggestionsThisWeek || 0;

  console.log('AIHabitSuggestions - habitSuggestions:', habitSuggestions);
  console.log('AIHabitSuggestions - reminderSuggestions:', reminderSuggestions);

  if (habitSuggestions.length === 0 && reminderSuggestions.length === 0) {
    console.log('AIHabitSuggestions - No suggestions found, returning null');
    return null;
  }

  const styles = createStyles(currentTheme.colors);

  const handleAddSuggestion = (suggestion: AIHabitSuggestion) => {
    // Check if user can use AI suggestions
    if (!canUseAI(currentAIUsage)) {
      showUpgradePrompt('ai_limit');
      return;
    }

    // Track AI usage
    trackFeatureUsage('ai_suggestion_used');
    
    // Add to added suggestions set
    setAddedSuggestions(prev => new Set([...prev, suggestion.id]));
    
    // Call the original function
    onAddSuggestion(suggestion);
    
    // Show success popup with properly translated title
    const habitTitle = suggestion.title;
    Alert.alert(
      `🎉 ${t('awesome')}`,
      `"${habitTitle}" ${t('habit_added_ai_message')}`,
      [{ text: t('lets_go'), style: 'default' }],
      { cancelable: true }
    );
    
    // Reset after 3 seconds
    setTimeout(() => {
      setAddedSuggestions(prev => {
        const newSet = new Set(prev);
        newSet.delete(suggestion.id);
        return newSet;
      });
    }, 3000);
  };

  const handleSetReminder = async (suggestion: SmartReminderSuggestion) => {
    try {
      const habit = getHabitById(suggestion.habitId);
      if (!habit) {
        Alert.alert(t('error'), t('habit_not_found'));
        return;
      }

      // Update the habit with the suggested reminder time
      const updatedHabit = {
        ...habit,
        reminderTime: suggestion.suggestedTime,
        reminderEnabled: true
      };

      await updateHabit(suggestion.habitId, updatedHabit);

      // Show success message
      Alert.alert(
        `⏰ ${t('reminder_set')}`,
        `${t('reminder_set_for')} "${habit.title}" ${t('at')} ${suggestion.suggestedTime}`,
        [{ text: t('ok'), style: 'default' }],
        { cancelable: true }
      );
    } catch (error) {
      console.error('Failed to set reminder:', error);
      Alert.alert(t('error'), t('failed_to_set_reminder'));
    }
  };

  const AnimatedAddButton = ({ suggestion, children }: { suggestion: AIHabitSuggestion; children: React.ReactNode }) => {
    const scaleAnim = useRef(new Animated.Value(1)).current;
    const isAdded = addedSuggestions.has(suggestion.id);

    const handlePress = () => {
      // Scale animation
      Animated.sequence([
        Animated.timing(scaleAnim, {
          toValue: 0.95,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1.05,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 100,
          useNativeDriver: true,
        }),
      ]).start();

      handleAddSuggestion(suggestion);
    };

    return (
      <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
        <TouchableOpacity 
          style={[styles.addButton, isAdded && styles.addedButton]}
          onPress={handlePress}
          disabled={isAdded}
        >
                      {isAdded ? (
              <>
                <Check size={16} color={currentTheme.colors.background} />
                <Text style={[styles.addButtonText, { color: currentTheme.colors.background }]}>{t('added')}</Text>
              </>
            ) : (
              children
            )}
        </TouchableOpacity>
      </Animated.View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Sparkles size={20} color={currentTheme.colors.primary} />
        <Text style={styles.title}>{t('ai_suggestions')}</Text>
        {/* Show usage indicator for free users */}
        {currentAIUsage > 0 && (
          <View style={styles.usageIndicator}>
            <Text style={styles.usageText}>
              {currentAIUsage}/2 {t('this_week')}
            </Text>
          </View>
        )}
      </View>
      
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        {/* Habit Suggestions */}
        {habitSuggestions.map((suggestion) => (
          <View key={suggestion.id} style={styles.suggestionCard}>
            <View style={styles.cardHeader}>
              <Target size={16} color={currentTheme.colors.success} />
              <Text style={styles.cardTitle}>{t('new_habit')}</Text>
            </View>
            
            <Text style={styles.habitTitle}>{suggestion.title}</Text>
            <Text style={styles.reason}>{suggestion.description}</Text>
            
            <View style={styles.confidenceContainer}>
              <View style={[styles.confidenceBar, { width: `${suggestion.confidence * 100}%` }]} />
              <Text style={styles.confidenceText}>
                {Math.round(suggestion.confidence * 100)}% {t('match')}
              </Text>
            </View>
            
            <AnimatedAddButton suggestion={suggestion}>
              <Plus size={16} color={currentTheme.colors.background} />
              <Text style={styles.addButtonText}>{t('add_habit_button')}</Text>
            </AnimatedAddButton>
          </View>
        ))}
        
        {/* Smart Reminder Suggestions */}
        {reminderSuggestions.map((suggestion) => (
          <View key={`reminder-${suggestion.habitId}`} style={styles.suggestionCard}>
            <View style={styles.cardHeader}>
              <Clock size={16} color={currentTheme.colors.warning} />
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
            
            <TouchableOpacity 
              style={styles.addButton}
              onPress={() => handleSetReminder(suggestion)}
            >
              <Clock size={16} color={currentTheme.colors.background} />
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
  usageIndicator: {
    backgroundColor: colors.warning,
    borderRadius: 8,
    paddingVertical: 4,
    paddingHorizontal: 8,
    marginLeft: 10,
  },
  usageText: {
    color: colors.background,
    fontSize: 12,
    fontWeight: '500',
  },
  suggestionCard: {
    backgroundColor: colors.card,
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
    color: colors.textSecondary,
    textTransform: 'uppercase',
  },
  habitTitle: {
    fontSize: 15, // Reduced from 16
    fontWeight: '600',
    color: colors.text,
    marginBottom: 6, // Reduced from 8
  },
  reason: {
    fontSize: 13, // Reduced from 14
    color: colors.textSecondary,
    lineHeight: 18, // Reduced from 20
    marginBottom: 10, // Reduced from 12
  },
  confidenceContainer: {
    marginBottom: 12, // Reduced from 16
  },
  confidenceBar: {
    height: 3, // Reduced from 4
    backgroundColor: colors.success,
    borderRadius: 2,
    marginBottom: 4,
  },
  confidenceText: {
    fontSize: 11, // Reduced from 12
    color: colors.textSecondary,
  },
  addButton: {
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
  },
  addedButton: {
    backgroundColor: colors.success,
  },
  addButtonText: {
    color: colors.background,
    fontWeight: '500',
    fontSize: 13,
    marginLeft: 4,
  },
});