import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { CheckCircle, Circle, TrendingUp, Heart, Zap } from 'lucide-react-native';
import { useTheme } from '@/context/ThemeContext';
import { useHabits } from '@/context/HabitContext';
import { useGamification } from '@/context/GamificationContext';
import { Habit, HabitMoodEntry } from '@/types';

interface MoodAwareHabitItemProps {
  habit: Habit;
  currentMood?: {
    moodState: string;
    intensity: number;
  };
  onMoodCapture?: (habitId: string, mood: { moodState: string; intensity: number }) => void;
}

const MOOD_HABIT_CORRELATIONS = {
  'happy': ['exercise', 'social', 'creative'],
  'energetic': ['exercise', 'productive', 'learning'],
  'calm': ['meditation', 'reading', 'nature'],
  'stressed': ['meditation', 'exercise', 'breathing'],
  'tired': ['rest', 'hydration', 'light-exercise'],
  'anxious': ['meditation', 'breathing', 'grounding'],
  'sad': ['social', 'creative', 'self-care']
};

const MOOD_COLORS = {
  'happy': '#4CAF50',
  'calm': '#2196F3',
  'energetic': '#FF9800',
  'tired': '#607D8B',
  'stressed': '#F44336',
  'anxious': '#FF5722',
  'sad': '#795548'
};

export default function MoodAwareHabitItem({ habit, currentMood, onMoodCapture }: MoodAwareHabitItemProps) {
  const { currentTheme } = useTheme();
  const { toggleHabitCompletion } = useHabits();
  const { getHabitMoodEntries } = useGamification();
  const [showMoodSelector, setShowMoodSelector] = useState(false);
  
  const styles = createStyles(currentTheme.colors);
  
  const isCompleted = habit.completedDates?.includes(new Date().toISOString().split('T')[0]);
  const habitMoodEntries = getHabitMoodEntries(habit.id || '');
  const recentEntries = habitMoodEntries.slice(-5);
  
  // Calculate mood-habit correlation score
  // Calculate mood-habit correlation score
  const getMoodHabitScore = () => {
    if (!currentMood) return 0;
    const correlatedCategories = MOOD_HABIT_CORRELATIONS[currentMood.moodState as keyof typeof MOOD_HABIT_CORRELATIONS] || [];
    return correlatedCategories.includes(habit.category || '') ? 85 + Math.random() * 15 : 30 + Math.random() * 40;
  };
  
  const moodHabitScore = getMoodHabitScore();
  const isRecommended = moodHabitScore > 70;
  
  // Calculate average mood improvement from this habit
  const getAverageMoodImprovement = () => {
    const validEntries = recentEntries.filter(entry => entry.preMood && entry.postMood);
    if (validEntries.length === 0) return 0;
    
    const improvements = validEntries.map(entry => 
      (entry.postMood?.intensity || 0) - (entry.preMood?.intensity || 0)
    );
    
    return improvements.reduce((sum, imp) => sum + imp, 0) / improvements.length;
  };
  
  const avgImprovement = getAverageMoodImprovement();
  
  const handleHabitToggle = async () => {
    if (!isCompleted && currentMood) {
      // Capture pre-mood
      const preMoodEntry: HabitMoodEntry = {
        id: Date.now().toString(),
        habitId: habit.id || '', // Fix: Handle potential undefined
        date: new Date().toISOString().split('T')[0],
        timestamp: new Date().toISOString(),
        action: 'completed', // Fix: Use valid action type
        preMood: {
          moodState: currentMood.moodState as any,
          intensity: currentMood.intensity
          // Fix: Remove timestamp property as it doesn't exist in the type
        }
      };
      
      if (onMoodCapture) {
        onMoodCapture(habit.id, currentMood);
      }
    }
    
    await toggleHabitCompletion(habit.id);
    
    if (isCompleted) {
      // Show post-mood capture option
      Alert.alert(
        'Habit Completed! 🎉',
        'Would you like to record how you feel after completing this habit?',
        [
          { text: 'Skip', style: 'cancel' },
          { text: 'Record Mood', onPress: () => setShowMoodSelector(true) }
        ]
      );
    }
  };
  
  const getMoodBadgeColor = () => {
    if (avgImprovement > 1) return '#4CAF50';
    if (avgImprovement > 0) return '#FF9800';
    return '#9E9E9E';
  };
  
  return (
    <View style={[
      styles.container,
      isRecommended && styles.recommendedContainer,
      isCompleted && styles.completedContainer
    ]}>
      {/* Mood Recommendation Badge */}
      {isRecommended && (
        <View style={[styles.recommendationBadge, { backgroundColor: MOOD_COLORS[currentMood?.moodState as keyof typeof MOOD_COLORS] || currentTheme.colors.primary }]}>
          <Heart size={12} color="#FFFFFF" />
          <Text style={styles.recommendationText}>Mood Match {Math.round(moodHabitScore)}%</Text>
        </View>
      )}
      
      <View style={styles.habitContent}>
        <TouchableOpacity 
          style={styles.habitMain}
          onPress={handleHabitToggle}
        >
          <View style={styles.habitIcon}>
            {isCompleted ? (
              <CheckCircle size={24} color={currentTheme.colors.primary} />
            ) : (
              <Circle size={24} color={currentTheme.colors.textSecondary} />
            )}
          </View>
          
          <View style={styles.habitInfo}>
            <Text style={[styles.habitTitle, isCompleted && styles.completedText]}>
              {habit.icon} {habit.title}
            </Text>
            
            {/* Mood Impact Indicator */}
            {avgImprovement !== 0 && (
              <View style={styles.moodImpact}>
                <TrendingUp size={14} color={getMoodBadgeColor()} />
                <Text style={[styles.moodImpactText, { color: getMoodBadgeColor() }]}>
                  {avgImprovement > 0 ? '+' : ''}{avgImprovement.toFixed(1)} mood boost
                </Text>
              </View>
            )}
            
            {/* Current Mood Indicator */}
            {currentMood && (
              <View style={styles.currentMoodIndicator}>
                <View style={[
                  styles.moodDot, 
                  { backgroundColor: MOOD_COLORS[currentMood.moodState as keyof typeof MOOD_COLORS] || '#9E9E9E' }
                ]} />
                <Text style={styles.currentMoodText}>
                  Current mood: {currentMood.moodState} ({currentMood.intensity}/10)
                </Text>
              </View>
            )}
          </View>
        </TouchableOpacity>
        
        {/* Mood History Dots */}
        {recentEntries.length > 0 && (
          <View style={styles.moodHistory}>
            {recentEntries.slice(-5).map((entry, index) => {
              const improvement = entry.postMood && entry.preMood 
                ? (entry.postMood.intensity - entry.preMood.intensity)
                : 0;
              
              return (
                <View 
                  key={index}
                  style={[
                    styles.moodHistoryDot,
                    { backgroundColor: improvement > 0 ? '#4CAF50' : improvement < 0 ? '#F44336' : '#9E9E9E' }
                  ]} 
                />
              );
            })}
          </View>
        )}
      </View>
      
      {/* Streak and Energy Indicator */}
      <View style={styles.habitStats}>
        <View style={styles.streakContainer}>
          <Zap size={16} color={currentTheme.colors.primary} />
          <Text style={styles.streakText}>{habit.streak}</Text>
        </View>
      </View>
    </View>
  );
}

const createStyles = (colors: any) => StyleSheet.create({
  container: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  recommendedContainer: {
    borderColor: colors.primary,
    borderWidth: 2,
    backgroundColor: colors.primary + '05',
  },
  completedContainer: {
    opacity: 0.7,
  },
  recommendationBadge: {
    position: 'absolute',
    top: -8,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    zIndex: 1,
  },
  recommendationText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '600',
    marginLeft: 4,
  },
  habitContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  habitMain: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  habitIcon: {
    marginRight: 12,
  },
  habitInfo: {
    flex: 1,
  },
  habitTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  completedText: {
    textDecorationLine: 'line-through',
    color: colors.textSecondary,
  },
  moodImpact: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  moodImpactText: {
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 4,
  },
  currentMoodIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  moodDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  currentMoodText: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  moodHistory: {
    flexDirection: 'row',
    marginLeft: 12,
  },
  moodHistoryDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginLeft: 2,
  },
  habitStats: {
    alignItems: 'center',
    marginLeft: 12,
  },
  streakContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary + '20',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  streakText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.primary,
    marginLeft: 4,
  },
});