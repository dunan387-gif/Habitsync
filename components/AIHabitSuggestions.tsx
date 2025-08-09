import React, { useRef, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Animated, Alert } from 'react-native';
import { Sparkles, Plus, Clock, Target, Check, Users, Brain, TrendingUp, Zap } from 'lucide-react-native';
import { useHabits } from '@/context/HabitContext';
import { useLanguage } from '@/context/LanguageContext';
import { useTheme } from '@/context/ThemeContext';
import { useSubscription } from '@/context/SubscriptionContext';
import { AIHabitSuggestion, SmartReminderSuggestion } from '@/types';
import { Habit } from '@/types';

type AIHabitSuggestionsProps = {
  onAddSuggestion: (suggestion: AIHabitSuggestion) => void;
  onEditHabit?: (habit: Habit) => void;
};

export default function AIHabitSuggestions({ onAddSuggestion, onEditHabit }: AIHabitSuggestionsProps) {
  const { getAIHabitSuggestions, getSmartReminderSuggestions, getHabitById, updateHabit } = useHabits();
  const { t } = useLanguage();
  const { currentTheme } = useTheme();
  const { canUseAI, getUsageStats, trackFeatureUsage, showUpgradePrompt } = useSubscription();
  
  const habitSuggestions = getAIHabitSuggestions();
  const reminderSuggestions = getSmartReminderSuggestions();
  const [addedSuggestions, setAddedSuggestions] = useState<Set<string>>(new Set());
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

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

      // If onEditHabit is provided, open the edit habit screen
      if (onEditHabit) {
        // Update the habit with the suggested reminder time first
        const updatedHabit = {
          ...habit,
          reminderTime: suggestion.suggestedTime,
          reminderEnabled: true
        };

        await updateHabit(suggestion.habitId, updatedHabit);

        // Then open the edit habit screen with the updated habit
        onEditHabit(updatedHabit);
      } else {
        // Fallback: just update the habit without opening edit screen
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
      }
    } catch (error) {
      console.error('Failed to set reminder:', error);
      Alert.alert(t('error'), t('failed_to_set_reminder'));
    }
  };

  const getSuggestionIcon = (suggestion: AIHabitSuggestion) => {
    if (suggestion.id.startsWith('collab')) return <Users size={16} color={currentTheme.colors.primary} />;
    if (suggestion.id.startsWith('semantic')) return <Brain size={16} color={currentTheme.colors.success} />;
    if (suggestion.id.startsWith('gap')) return <Target size={16} color={currentTheme.colors.warning} />;
    if (suggestion.id.startsWith('optimize')) return <TrendingUp size={16} color={currentTheme.colors.primary} />;
    if (suggestion.id.startsWith('context')) return <Zap size={16} color={currentTheme.colors.primary} />;
    return <Sparkles size={16} color={currentTheme.colors.primary} />;
  };

  const getSuggestionType = (suggestion: AIHabitSuggestion) => {
    if (suggestion.id.startsWith('collab')) return t('ai.collaborative.type');
    if (suggestion.id.startsWith('semantic')) return t('ai.semantic.type');
    if (suggestion.id.startsWith('gap')) return t('ai.gapAnalysis.type');
    if (suggestion.id.startsWith('optimize')) return t('ai.optimization.type');
    if (suggestion.id.startsWith('context')) return t('ai.contextAware.type');
    return t('ai.general.type');
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return currentTheme.colors.success;
    if (confidence >= 0.6) return currentTheme.colors.warning;
    return currentTheme.colors.error;
  };

  const AnimatedAddButton = ({ suggestion, children }: { suggestion: AIHabitSuggestion; children: React.ReactNode }) => {
    const scaleAnim = useRef(new Animated.Value(1)).current;
    const isAdded = addedSuggestions.has(suggestion.id);

    const handlePress = () => {
      if (isAdded) return;

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

      handleAddSuggestion(suggestion);
    };

    return (
      <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
        <TouchableOpacity
          style={[
            styles.addButton,
            isAdded && styles.addedButton
          ]}
          onPress={handlePress}
          disabled={isAdded}
        >
          {isAdded ? (
            <Check size={16} color={currentTheme.colors.background} />
          ) : (
            children
          )}
        </TouchableOpacity>
      </Animated.View>
    );
  };

  const filteredSuggestions = selectedCategory === 'all' 
    ? habitSuggestions 
    : habitSuggestions.filter(s => s.category === selectedCategory);

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

      {/* Category Filter */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryFilter}>
        <TouchableOpacity
          style={[styles.categoryChip, selectedCategory === 'all' && styles.activeCategoryChip]}
          onPress={() => setSelectedCategory('all')}
        >
          <Text style={[styles.categoryChipText, selectedCategory === 'all' && styles.activeCategoryChipText]}>
            {t('all')}
          </Text>
        </TouchableOpacity>
        {Array.from(new Set(habitSuggestions.map(s => s.category))).map(category => (
          <TouchableOpacity
            key={category}
            style={[styles.categoryChip, selectedCategory === category && styles.activeCategoryChip]}
            onPress={() => setSelectedCategory(category)}
          >
            <Text style={[styles.categoryChipText, selectedCategory === category && styles.activeCategoryChipText]}>
              {t(category)}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
      
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        {/* Enhanced Habit Suggestions */}
        {filteredSuggestions.map((suggestion) => (
          <View key={suggestion.id} style={styles.suggestionCard}>
            <View style={styles.cardHeader}>
              {getSuggestionIcon(suggestion)}
              <Text style={styles.cardTitle}>{getSuggestionType(suggestion)}</Text>
            </View>
            
            <Text style={styles.habitTitle}>{suggestion.title}</Text>
            <Text style={styles.reason}>{suggestion.description}</Text>
            
            <View style={styles.confidenceContainer}>
              <View style={[styles.confidenceBar, { 
                width: `${suggestion.confidence * 100}%`,
                backgroundColor: getConfidenceColor(suggestion.confidence)
              }]} />
              <Text style={[styles.confidenceText, { color: getConfidenceColor(suggestion.confidence) }]}>
                {Math.round(suggestion.confidence * 100)}% {t('match')}
              </Text>
            </View>

            {suggestion.reason && (
              <View style={styles.reasonContainer}>
                <Text style={styles.reasonLabel}>{t('ai.why_suggested')}:</Text>
                <Text style={styles.reasonText}>{suggestion.reason}</Text>
              </View>
            )}
            
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
            
            <Text style={styles.habitTitle}>
              {getHabitById(suggestion.habitId)?.title || t('unknown_habit')}
            </Text>
            <Text style={styles.reason}>
              {t('optimal_time_suggestion', { time: suggestion.suggestedTime })}
            </Text>
            
            <View style={styles.confidenceContainer}>
              <View style={[styles.confidenceBar, { 
                width: `${suggestion.confidence * 100}%`,
                backgroundColor: currentTheme.colors.warning
              }]} />
              <Text style={[styles.confidenceText, { color: currentTheme.colors.warning }]}>
                {Math.round(suggestion.confidence * 100)}% {t('accuracy')}
              </Text>
            </View>
            
            <TouchableOpacity
              style={styles.reminderButton}
              onPress={() => handleSetReminder(suggestion)}
            >
              <Clock size={16} color={currentTheme.colors.background} />
              <Text style={styles.reminderButtonText}>{t('set_reminder')}</Text>
            </TouchableOpacity>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const createStyles = (colors: any) => StyleSheet.create({
  container: {
    marginTop: 10,
    marginBottom: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    paddingHorizontal: 16,
  },
  title: {
    fontSize: 16,
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
  categoryFilter: {
    flexDirection: 'row',
    marginBottom: 8,
    paddingHorizontal: 16,
  },
  categoryChip: {
    backgroundColor: colors.card,
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 12,
    marginRight: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  activeCategoryChip: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  categoryChipText: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: '500',
  },
  activeCategoryChipText: {
    color: colors.background,
  },
  suggestionCard: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 20,
    marginHorizontal: 12,
    marginBottom: 5,
    marginTop: 5,
    width: 220,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  cardTitle: {
    fontSize: 10,
    fontWeight: '500',
    marginLeft: 4,
    color: colors.textSecondary,
    textTransform: 'uppercase',
  },
  habitTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  reason: {
    fontSize: 12,
    color: colors.textSecondary,
    lineHeight: 16,
    marginBottom: 8,
  },
  confidenceContainer: {
    marginBottom: 8,
  },
  confidenceBar: {
    height: 3,
    backgroundColor: colors.success,
    borderRadius: 2,
    marginBottom: 4,
  },
  confidenceText: {
    fontSize: 10,
    color: colors.textSecondary,
  },
  reasonContainer: {
    marginTop: 6,
    marginBottom: 8,
  },
  reasonLabel: {
    fontSize: 11,
    fontWeight: '500',
    color: colors.textSecondary,
    marginBottom: 2,
  },
  reasonText: {
    fontSize: 12,
    color: colors.textSecondary,
    lineHeight: 16,
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
    fontSize: 12,
    marginLeft: 4,
  },
  reminderButton: {
    backgroundColor: colors.warning,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
  },
  reminderButtonText: {
    color: colors.background,
    fontWeight: '500',
    fontSize: 12,
    marginLeft: 4,
  },
});