import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, SafeAreaView, TextInput, Alert } from 'react-native';
import { useTheme } from '@/context/ThemeContext';
import { useLanguage } from '@/context/LanguageContext';
import { useHabits } from '@/context/HabitContext';
import AsyncStorage from '@react-native-async-storage/async-storage';

type SimpleMoodTab = 'how-are-you' | 'your-patterns' | 'what-helps';

interface MoodOption {
  emoji: string;
  label: string;
  value: number;
  color: string;
}

interface MoodPattern {
  type: 'streak' | 'dayOfWeek' | 'trigger' | 'improvement';
  title: string;
  description: string;
  icon: string;
  color: string;
  actionable?: boolean;
}

interface MoodBooster {
  title: string;
  icon: string;
  duration: string;
  category: 'physical' | 'mental' | 'social' | 'creative';
  description: string;
  steps: string[];
}

interface Recommendation {
  title: string;
  description: string;
  icon: string;
  color: string;
  actionable: boolean;
  actionText?: string;
  type: 'pattern' | 'streak' | 'stability' | 'improvement';
}

export default function SimpleMoodAnalytics() {
  const { currentTheme } = useTheme();
  const { t } = useLanguage();
  const { getMoodHabitAnalytics } = useHabits();
  
  const [selectedTab, setSelectedTab] = useState<SimpleMoodTab>('how-are-you');
  const [moodData, setMoodData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedMood, setSelectedMood] = useState<MoodOption | null>(null);
  const [moodNote, setMoodNote] = useState('');
  const [todayMood, setTodayMood] = useState<any>(null);
  const [isLoggingMood, setIsLoggingMood] = useState(false);
  const [showMoodAlert, setShowMoodAlert] = useState(false);
  const [moodAlert, setMoodAlert] = useState<any>(null);
  const [showCelebration, setShowCelebration] = useState(false);
  const [celebration, setCelebration] = useState<any>(null);
  const [lastMoodLogDate, setLastMoodLogDate] = useState<string | null>(null);

  // Mood options
  const moodOptions: MoodOption[] = [
    { emoji: '😊', label: 'Happy', value: 8, color: '#4CAF50' },
    { emoji: '😌', label: 'Calm', value: 7, color: '#2196F3' },
    { emoji: '😴', label: 'Tired', value: 4, color: '#FF9800' },
    { emoji: '😰', label: 'Stressed', value: 3, color: '#F44336' },
    { emoji: '😔', label: 'Sad', value: 2, color: '#9C27B0' },
  ];

  // Load mood data
  useEffect(() => {
    const loadMoodData = async () => {
      try {
        const analytics = await getMoodHabitAnalytics();
        setMoodData(analytics.moodTrends || []);
        
        // Get today's mood
        const today = new Date().toISOString().split('T')[0];
        const todayMoodEntry = analytics.moodTrends?.find((mood: any) => mood.date === today);
        setTodayMood(todayMoodEntry);
        
        // Check for mood alerts and celebrations
        checkMoodAlerts(analytics.moodTrends || []);
        await checkCelebrations(analytics.moodTrends || []);
        
        // Check last mood log date
        const lastLog = await AsyncStorage.getItem('lastMoodLogDate');
        setLastMoodLogDate(lastLog);
        
        setIsLoading(false);
      } catch (error) {
        console.error('Error loading mood data:', error);
        setMoodData([]);
        setIsLoading(false);
      }
    };

    loadMoodData();
  }, [getMoodHabitAnalytics]);

  // Check for mood alerts
  const checkMoodAlerts = (moodTrends: any[]) => {
    const negativeStreak = detectNegativeStreak();
    const today = new Date().toISOString().split('T')[0];
    const lastLog = lastMoodLogDate;
    
    // Alert for negative streak
    if (negativeStreak >= 3) {
      setMoodAlert({
        type: 'negative_streak',
        title: 'We Notice You\'ve Been Feeling Down',
                 message: `You&apos;ve been feeling down for ${negativeStreak} days. Would you like to try some mood boosters?`,
        icon: '💙',
        color: '#F44336',
        action: 'Try Mood Boosters',
      });
      setShowMoodAlert(true);
    }
    
    // Alert for not logging mood
    if (!lastLog || lastLog !== today) {
      const daysSinceLastLog = lastLog ? 
        Math.floor((new Date().getTime() - new Date(lastLog).getTime()) / (1000 * 60 * 60 * 24)) : 1;
      
      if (daysSinceLastLog >= 2) {
        setMoodAlert({
          type: 'logging_reminder',
          title: 'How Are You Feeling?',
          message: `It&apos;s been ${daysSinceLastLog} days since you logged your mood. Taking a moment to check in can help you understand your patterns.`,
          icon: '📝',
          color: '#2196F3',
          action: 'Log My Mood',
        });
        setShowMoodAlert(true);
      }
    }
  };

  // Check for celebrations
  const checkCelebrations = async (moodTrends: any[]) => {
    const moodStreak = getMoodStreak();
    const today = new Date().toISOString().split('T')[0];
    const lastCelebration = await AsyncStorage.getItem('lastCelebrationDate');
    
    // Celebrate mood streaks
    if (moodStreak >= 7 && lastCelebration !== today) {
      setCelebration({
        type: 'mood_streak',
        title: 'Amazing Mood Streak! 🎉',
                 message: `You&apos;ve been feeling great for ${moodStreak} days in a row! Keep up the amazing work!`,
        icon: '🌟',
        color: '#4CAF50',
        action: 'Keep It Up!',
      });
      setShowCelebration(true);
      await AsyncStorage.setItem('lastCelebrationDate', today);
    }
    
    // Celebrate pattern breaking
    const negativeStreak = detectNegativeStreak();
    if (negativeStreak === 0 && moodTrends.length >= 7) {
      const recentMoods = moodTrends.slice(-7);
      const hadNegativeStreak = recentMoods.some((mood: any, index: number) => {
        if (index < 3) return false;
        return mood.averageMood < 5;
      });
      
      if (hadNegativeStreak) {
        setCelebration({
          type: 'pattern_break',
          title: 'You Broke the Pattern! 🎊',
          message: 'You&apos;ve turned things around and are feeling better! This is a big win!',
          icon: '🔄',
          color: '#FF9800',
          action: 'Celebrate!',
        });
        setShowCelebration(true);
      }
    }
  };

  // Log mood
  const logMood = async () => {
    if (!selectedMood) {
      Alert.alert('Select a mood', 'Please select how you\'re feeling today.');
      return;
    }

    setIsLoggingMood(true);
    try {
      const newMoodEntry = {
        id: Date.now().toString(),
        date: new Date().toISOString().split('T')[0],
        timestamp: new Date().toISOString(),
        moodState: selectedMood.label.toLowerCase(),
        intensity: selectedMood.value,
        note: moodNote.trim() || undefined,
      };

      // Get existing mood entries
      const existingMoodEntries = await AsyncStorage.getItem('moodEntries');
      const moodEntries = existingMoodEntries ? JSON.parse(existingMoodEntries) : [];
      
      // Add new entry
      const updatedMoodEntries = [...moodEntries, newMoodEntry];
      await AsyncStorage.setItem('moodEntries', JSON.stringify(updatedMoodEntries));

      // Update today's mood
      setTodayMood({
        date: newMoodEntry.date,
        averageMood: newMoodEntry.intensity,
        habitsCompleted: 0,
        habitsSkipped: 0,
      });

      // Update last mood log date
      const today = new Date().toISOString().split('T')[0];
      await AsyncStorage.setItem('lastMoodLogDate', today);
      setLastMoodLogDate(today);
      
      // Reset form
      setSelectedMood(null);
      setMoodNote('');
      
      Alert.alert('Mood Logged!', 'Thanks for checking in with us! 😊');
    } catch (error) {
      console.error('Error logging mood:', error);
      Alert.alert('Error', 'Failed to log your mood. Please try again.');
    } finally {
      setIsLoggingMood(false);
    }
  };

  // Get mood streak
  const getMoodStreak = () => {
    if (!moodData.length) return 0;
    
    let streak = 0;
    const today = new Date();
    
    for (let i = 0; i < 30; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      const moodEntry = moodData.find((mood: any) => mood.date === dateStr);
      if (moodEntry && moodEntry.averageMood >= 6) {
        streak++;
      } else {
        break;
      }
    }
    
    return streak;
  };

  // Get mood trend
  const getMoodTrend = () => {
    if (moodData.length < 2) return 'stable';
    
    const recentMoods = moodData.slice(-7);
    if (recentMoods.length < 2) return 'stable';
    
    const firstAvg = recentMoods[0].averageMood;
    const lastAvg = recentMoods[recentMoods.length - 1].averageMood;
    
    if (lastAvg > firstAvg + 1) return 'improving';
    if (lastAvg < firstAvg - 1) return 'declining';
    return 'stable';
  };

  // Get 7-day mood history
  const getMoodHistory = () => {
    const history = [];
    const today = new Date();
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      const moodEntry = moodData.find((mood: any) => mood.date === dateStr);
      history.push({
        date: dateStr,
        mood: moodEntry?.averageMood || null,
        dayName: date.toLocaleDateString('en-US', { weekday: 'short' }),
      });
    }
    
    return history;
  };

  // Pattern Recognition Engine
  const detectPatterns = (): MoodPattern[] => {
    const patterns: MoodPattern[] = [];
    
    if (!moodData.length) return patterns;

    // 1. Detect negative mood streaks
    const negativeStreak = detectNegativeStreak();
    if (negativeStreak > 0) {
      patterns.push({
        type: 'streak',
                 title: `You&apos;ve been feeling down for ${negativeStreak} days`,
        description: 'Consider reaching out to friends or trying a mood booster',
        icon: '⚠️',
        color: '#F44336',
        actionable: true,
      });
    }

    // 2. Detect day-of-week patterns
    const dayPatterns = detectDayOfWeekPatterns();
    patterns.push(...dayPatterns);

    // 3. Detect mood improvement patterns
    const improvementPatterns = detectImprovementPatterns();
    patterns.push(...improvementPatterns);

    // 4. Detect mood triggers from notes
    const triggerPatterns = detectTriggerPatterns();
    patterns.push(...triggerPatterns);

    return patterns;
  };

  // Detect negative mood streaks
  const detectNegativeStreak = (): number => {
    let streak = 0;
    const today = new Date();
    
    for (let i = 0; i < 7; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      const moodEntry = moodData.find((mood: any) => mood.date === dateStr);
      if (moodEntry && moodEntry.averageMood < 5) {
        streak++;
      } else {
        break;
      }
    }
    
    return streak;
  };

  // Detect day-of-week patterns
  const detectDayOfWeekPatterns = (): MoodPattern[] => {
    const patterns: MoodPattern[] = [];
    const dayAverages: { [key: number]: number[] } = {};
    
    // Group moods by day of week
    moodData.forEach((mood: any) => {
      const date = new Date(mood.date);
      const dayOfWeek = date.getDay();
      if (!dayAverages[dayOfWeek]) dayAverages[dayOfWeek] = [];
      dayAverages[dayOfWeek].push(mood.averageMood);
    });

    // Find best and worst days
    let bestDay = -1;
    let worstDay = -1;
    let bestAvg = -1;
    let worstAvg = 10;

    Object.entries(dayAverages).forEach(([day, moods]) => {
      const avg = moods.reduce((sum, mood) => sum + mood, 0) / moods.length;
      if (avg > bestAvg && moods.length >= 2) {
        bestAvg = avg;
        bestDay = parseInt(day);
      }
      if (avg < worstAvg && moods.length >= 2) {
        worstAvg = avg;
        worstDay = parseInt(day);
      }
    });

    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

    if (bestDay !== -1 && bestAvg >= 7) {
      patterns.push({
        type: 'dayOfWeek',
        title: `${dayNames[bestDay]}s are your best days`,
        description: `Your average mood is ${bestAvg.toFixed(1)}/10 on ${dayNames[bestDay]}s`,
        icon: '🌟',
        color: '#4CAF50',
      });
    }

    if (worstDay !== -1 && worstAvg <= 4) {
      patterns.push({
        type: 'dayOfWeek',
        title: `${dayNames[worstDay]}s are challenging`,
        description: `Your average mood is ${worstAvg.toFixed(1)}/10 on ${dayNames[worstDay]}s`,
        icon: '📉',
        color: '#FF9800',
        actionable: true,
      });
    }

    return patterns;
  };

  // Detect improvement patterns
  const detectImprovementPatterns = (): MoodPattern[] => {
    const patterns: MoodPattern[] = [];
    
    if (moodData.length < 7) return patterns;

    const recentMoods = moodData.slice(-7);
    const firstHalf = recentMoods.slice(0, 3);
    const secondHalf = recentMoods.slice(-3);

    const firstAvg = firstHalf.reduce((sum, mood) => sum + mood.averageMood, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((sum, mood) => sum + mood.averageMood, 0) / secondHalf.length;

    if (secondAvg > firstAvg + 1.5) {
      patterns.push({
        type: 'improvement',
        title: 'Your mood is improving!',
        description: `You've improved from ${firstAvg.toFixed(1)} to ${secondAvg.toFixed(1)} this week`,
        icon: '📈',
        color: '#4CAF50',
      });
    }

    return patterns;
  };

  // Detect trigger patterns from notes
  const detectTriggerPatterns = (): MoodPattern[] => {
    const patterns: MoodPattern[] = [];
    const triggers: { [key: string]: number } = {};
    
    // This would analyze mood notes for common triggers
    // For now, we'll create some example patterns
    if (moodData.length >= 5) {
      patterns.push({
        type: 'trigger',
        title: 'Work stress affects your mood',
        description: 'You tend to feel more stressed on weekdays',
        icon: '💼',
        color: '#FF9800',
        actionable: true,
      });
    }

    return patterns;
  };

  // Get weekly mood summary
  const getWeeklySummary = () => {
    if (!moodData.length) return null;

    const recentMoods = moodData.slice(-7);
    const goodDays = recentMoods.filter(mood => mood.averageMood >= 6).length;
    const challengingDays = recentMoods.filter(mood => mood.averageMood < 5).length;
    const avgMood = recentMoods.reduce((sum, mood) => sum + mood.averageMood, 0) / recentMoods.length;

    return {
      goodDays,
      challengingDays,
      avgMood: avgMood.toFixed(1),
      totalDays: recentMoods.length,
    };
  };

  // Get mood stability
  const getMoodStability = () => {
    if (moodData.length < 7) return 'insufficient';

    const recentMoods = moodData.slice(-7);
    const avgMood = recentMoods.reduce((sum, mood) => sum + mood.averageMood, 0) / recentMoods.length;
    const variance = recentMoods.reduce((sum, mood) => sum + Math.pow(mood.averageMood - avgMood, 2), 0) / recentMoods.length;
    const standardDeviation = Math.sqrt(variance);

    if (standardDeviation < 1) return 'very_stable';
    if (standardDeviation < 2) return 'stable';
    if (standardDeviation < 3) return 'moderate';
    return 'variable';
  };

  // Get mood boosters library
  const getMoodBoosters = (): MoodBooster[] => {
    return [
      {
        title: 'Deep Breathing',
        icon: '🫁',
        duration: '3 min',
        category: 'mental',
        description: 'Calm your mind with focused breathing',
        steps: ['Breathe in for 4 counts', 'Hold for 4 counts', 'Breathe out for 6 counts', 'Repeat 5 times'],
      },
      {
        title: 'Quick Walk',
        icon: '🚶',
        duration: '5 min',
        category: 'physical',
        description: 'Get your body moving and fresh air',
        steps: ['Step outside', 'Walk at a comfortable pace', 'Focus on your surroundings', 'Take deep breaths'],
      },
      {
        title: 'Gratitude List',
        icon: '📝',
        duration: '2 min',
        category: 'mental',
        description: 'Focus on positive aspects of your life',
        steps: ['Write 3 things you\'re grateful for', 'Be specific', 'Think about why each matters', 'Read them aloud'],
      },
      {
        title: 'Stretch Break',
        icon: '🤸',
        duration: '4 min',
        category: 'physical',
        description: 'Release tension and energize your body',
        steps: ['Neck rolls', 'Shoulder shrugs', 'Arm circles', 'Gentle back twist'],
      },
      {
        title: 'Text a Friend',
        icon: '💬',
        duration: '2 min',
        category: 'social',
        description: 'Connect with someone who cares',
        steps: ['Think of someone you care about', 'Send a friendly message', 'Share something positive', 'Express appreciation'],
      },
      {
        title: 'Mini Meditation',
        icon: '🧘',
        duration: '5 min',
        category: 'mental',
        description: 'Center yourself with mindfulness',
        steps: ['Sit comfortably', 'Close your eyes', 'Focus on your breath', 'Let thoughts pass without judgment'],
      },
    ];
  };

  // Get personalized recommendations
  const getPersonalizedRecommendations = (patterns: MoodPattern[], negativeStreak: number): Recommendation[] => {
    const recommendations: Recommendation[] = [];

    // Recommendations based on negative streaks
    if (negativeStreak >= 3) {
      recommendations.push({
        title: 'Break the Pattern',
                 description: `You&apos;ve been feeling down for ${negativeStreak} days. Try scheduling one mood booster daily.`,
        icon: '🔄',
        color: '#F44336',
        actionable: true,
        actionText: 'Set Daily Reminder',
        type: 'streak',
      });
    }

    // Recommendations based on day patterns
    const dayPattern = patterns.find(p => p.type === 'dayOfWeek' && p.actionable);
    if (dayPattern) {
      recommendations.push({
        title: 'Prepare for Challenging Days',
        description: dayPattern.description + '. Plan mood boosters for these days.',
        icon: '📅',
        color: '#FF9800',
        actionable: true,
        actionText: 'Plan Activities',
        type: 'pattern',
      });
    }

    // Recommendations for mood improvement
    const improvementPattern = patterns.find(p => p.type === 'improvement');
    if (improvementPattern) {
      recommendations.push({
        title: 'Keep the Momentum',
        description: 'Your mood is improving! Continue what you\'re doing and add one new positive habit.',
        icon: '📈',
        color: '#4CAF50',
        actionable: true,
        actionText: 'Add New Habit',
        type: 'improvement',
      });
    }

    // General recommendations
    if (moodData.length >= 7) {
      const moodStability = getMoodStability();
      if (moodStability === 'variable') {
        recommendations.push({
          title: 'Build Consistency',
          description: 'Your mood varies quite a bit. Try establishing a daily routine with mood boosters.',
          icon: '⚖️',
          color: '#2196F3',
          actionable: true,
          actionText: 'Create Routine',
          type: 'stability',
        });
      }
    }

    return recommendations;
  };

  // Handle booster press
  const handleBoosterPress = (booster: MoodBooster) => {
    Alert.alert(
      booster.title,
      booster.description + '\n\nSteps:\n' + booster.steps.map((step, i) => `${i + 1}. ${step}`).join('\n'),
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Start Now', onPress: () => startBoosterTimer(booster) },
      ]
    );
  };

  // Start booster timer
  const startBoosterTimer = (booster: MoodBooster) => {
    Alert.alert(
      'Timer Started!',
      `${booster.title} timer started for ${booster.duration}. Focus on the activity and we'll remind you when it's done.`,
      [{ text: 'OK' }]
    );
    // TODO: Implement actual timer functionality
  };

  // Handle recommendation action
  const handleRecommendationAction = (recommendation: Recommendation) => {
    Alert.alert(
      recommendation.title,
      `This will help you: ${recommendation.description}`,
      [
        { text: 'Later', style: 'cancel' },
        { text: recommendation.actionText, onPress: () => executeRecommendationAction(recommendation) },
      ]
    );
  };

  // Execute recommendation action
  const executeRecommendationAction = (recommendation: Recommendation) => {
    switch (recommendation.type) {
      case 'streak':
        Alert.alert('Daily Reminder Set!', 'We\'ll remind you to do a mood booster every day at 3 PM.');
        break;
      case 'pattern':
        Alert.alert('Planning Tool', 'This would open a planning tool to schedule activities for challenging days.');
        break;
      case 'improvement':
        Alert.alert('Habit Suggestions', 'This would show habit suggestions to maintain your positive momentum.');
        break;
      case 'stability':
        Alert.alert('Routine Builder', 'This would open a routine builder to help create consistent daily habits.');
        break;
      default:
        Alert.alert('Action', 'This action would be implemented based on the recommendation type.');
    }
  };

  // Handle alert action
  const handleAlertAction = (alert: any) => {
    setShowMoodAlert(false);
    
    switch (alert.type) {
      case 'negative_streak':
        setSelectedTab('what-helps');
        break;
      case 'logging_reminder':
        setSelectedTab('how-are-you');
        break;
      default:
        break;
    }
  };

  const styles = createStyles(currentTheme.colors);

  if (isLoading) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>{t('common.loading')}</Text>
      </View>
    );
  }

  const renderTabButton = (tab: SimpleMoodTab, title: string, icon: string) => (
    <TouchableOpacity
      style={[styles.tabButton, selectedTab === tab && styles.activeTabButton]}
      onPress={() => setSelectedTab(tab)}
    >
      <Text style={styles.tabIcon}>{icon}</Text>
      <Text style={[styles.tabText, selectedTab === tab && styles.activeTabText]}>
        {title}
      </Text>
    </TouchableOpacity>
  );

  const renderHowAreYou = () => {
    const moodStreak = getMoodStreak();
    const moodTrend = getMoodTrend();
    const moodHistory = getMoodHistory();

    return (
      <View style={styles.tabContent}>
        <Text style={styles.tabTitle}>How Are You?</Text>
        <Text style={styles.tabSubtitle}>Quick mood check-in and summary</Text>

        {/* Quick Mood Logging */}
        <View style={styles.moodLoggingSection}>
          <Text style={styles.sectionTitle}>How are you feeling right now?</Text>
          
                     {/* Emoji Mood Selector */}
           <View style={styles.moodSelector}>
             {moodOptions.map((mood) => (
               <TouchableOpacity
                 key={mood.label}
                 style={[
                   styles.moodOption,
                   selectedMood?.label === mood.label && styles.selectedMoodOption,
                   { borderColor: mood.color }
                 ]}
                 onPress={() => setSelectedMood(mood)}
               >
                 <Text style={styles.moodEmoji}>{mood.emoji}</Text>
               </TouchableOpacity>
             ))}
           </View>

          {/* Optional Note */}
          <View style={styles.noteSection}>
            <Text style={styles.noteLabel}>Add a quick note (optional)</Text>
            <TextInput
              style={styles.noteInput}
              placeholder="e.g., stressed about work meeting"
              value={moodNote}
              onChangeText={setMoodNote}
              maxLength={50}
              multiline
            />
          </View>

          {/* Log Mood Button */}
          <TouchableOpacity
            style={[styles.logMoodButton, !selectedMood && styles.logMoodButtonDisabled]}
            onPress={logMood}
            disabled={!selectedMood || isLoggingMood}
          >
            <Text style={styles.logMoodButtonText}>
              {isLoggingMood ? 'Logging...' : 'Log My Mood'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Today's Mood Summary */}
        {todayMood && (
          <View style={styles.todaySummary}>
            <Text style={styles.sectionTitle}>Today's Summary</Text>
            <View style={styles.summaryCard}>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Current Mood:</Text>
                <Text style={styles.summaryValue}>
                  {moodOptions.find(m => m.value === todayMood.averageMood)?.emoji} 
                  {moodOptions.find(m => m.value === todayMood.averageMood)?.label}
                </Text>
              </View>
              
              {moodStreak > 0 && (
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Good Mood Streak:</Text>
                  <Text style={styles.summaryValue}>{moodStreak} days! 🎉</Text>
                </View>
              )}
              
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Trend:</Text>
                <Text style={styles.summaryValue}>
                  {moodTrend === 'improving' ? '📈 Improving' : 
                   moodTrend === 'declining' ? '📉 Declining' : '📊 Stable'}
                </Text>
              </View>
            </View>
          </View>
        )}

                 {/* Mood Wins Section */}
         {moodStreak > 0 && (
           <View style={styles.moodWinsSection}>
             <Text style={styles.sectionTitle}>🎉 Mood Wins</Text>
             <View style={styles.winCard}>
               <Text style={styles.winIcon}>🔥</Text>
               <Text style={styles.winTitle}>{moodStreak}-Day Good Mood Streak!</Text>
               <Text style={styles.winDescription}>
                 You're on fire! Keep doing what's working for you.
               </Text>
             </View>
           </View>
         )}

         {/* 7-Day Mood History */}
         <View style={styles.moodHistorySection}>
           <Text style={styles.sectionTitle}>This Week's Mood</Text>
           <View style={styles.moodCalendar}>
             {moodHistory.map((day) => (
               <View key={day.date} style={styles.moodDay}>
                 <Text style={styles.dayName}>{day.dayName}</Text>
                 <View style={[
                   styles.moodDot,
                   day.mood ? { backgroundColor: getMoodColor(day.mood) } : styles.noMoodDot
                 ]} />
                 {day.mood && <Text style={styles.moodValue}>{day.mood}</Text>}
               </View>
             ))}
           </View>
         </View>
      </View>
    );
  };

  const renderYourPatterns = () => {
    const patterns = detectPatterns();
    const weeklySummary = getWeeklySummary();
    const moodStability = getMoodStability();

    return (
      <View style={styles.tabContent}>
        <Text style={styles.tabTitle}>Your Patterns</Text>
        <Text style={styles.tabSubtitle}>Discover your mood patterns and triggers</Text>

        {/* Weekly Summary */}
        {weeklySummary && (
          <View style={styles.patternSection}>
            <Text style={styles.sectionTitle}>This Week's Summary</Text>
            <View style={styles.summaryCard}>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Good Days:</Text>
                <Text style={styles.summaryValue}>{weeklySummary.goodDays} days</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Challenging Days:</Text>
                <Text style={styles.summaryValue}>{weeklySummary.challengingDays} days</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Average Mood:</Text>
                <Text style={styles.summaryValue}>{weeklySummary.avgMood}/10</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Mood Stability:</Text>
                <Text style={styles.summaryValue}>
                  {moodStability === 'very_stable' ? 'Very Stable' :
                   moodStability === 'stable' ? 'Stable' :
                   moodStability === 'moderate' ? 'Moderate' : 'Variable'}
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Pattern Cards */}
        <View style={styles.patternSection}>
          <Text style={styles.sectionTitle}>Patterns We Found</Text>
          {patterns.length > 0 ? (
            patterns.map((pattern, index) => (
              <View key={index} style={[styles.patternCard, { borderLeftColor: pattern.color }]}>
                <View style={styles.patternHeader}>
                  <Text style={styles.patternIcon}>{pattern.icon}</Text>
                  <Text style={styles.patternTitle}>{pattern.title}</Text>
                </View>
                <Text style={styles.patternDescription}>{pattern.description}</Text>
                {pattern.actionable && (
                  <View style={styles.actionableBadge}>
                    <Text style={styles.actionableText}>Actionable</Text>
                  </View>
                )}
              </View>
            ))
          ) : (
            <View style={styles.noPatternsCard}>
              <Text style={styles.noPatternsIcon}>📊</Text>
              <Text style={styles.noPatternsTitle}>No patterns yet</Text>
              <Text style={styles.noPatternsDescription}>
                Keep logging your mood for a few more days to discover your patterns!
              </Text>
            </View>
          )}
        </View>

        {/* Mood Calendar */}
        <View style={styles.patternSection}>
          <Text style={styles.sectionTitle}>30-Day Mood Calendar</Text>
          <View style={styles.moodCalendarLarge}>
            {Array.from({ length: 30 }, (_, i) => {
              const date = new Date();
              date.setDate(date.getDate() - (29 - i));
              const dateStr = date.toISOString().split('T')[0];
              const moodEntry = moodData.find((mood: any) => mood.date === dateStr);
              
              return (
                <View key={i} style={styles.calendarDay}>
                  <View style={[
                    styles.calendarDot,
                    moodEntry ? { backgroundColor: getMoodColor(moodEntry.averageMood) } : styles.noMoodDot
                  ]} />
                </View>
              );
            })}
          </View>
          <View style={styles.calendarLegend}>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: '#4CAF50' }]} />
              <Text style={styles.legendText}>Good (7-10)</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: '#FF9800' }]} />
              <Text style={styles.legendText}>Neutral (5-6)</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: '#F44336' }]} />
              <Text style={styles.legendText}>Challenging (1-4)</Text>
            </View>
          </View>
        </View>
      </View>
    );
  };

  const renderWhatHelps = () => {
    const patterns = detectPatterns();
    const moodStreak = getMoodStreak();
    const negativeStreak = detectNegativeStreak();
    
    // Get personalized recommendations based on patterns
    const recommendations = getPersonalizedRecommendations(patterns, negativeStreak);
    
    return (
      <View style={styles.tabContent}>
        <Text style={styles.tabTitle}>What Helps?</Text>
        <Text style={styles.tabSubtitle}>Get personalized mood boosters and recommendations</Text>

        {/* Quick Mood Boosters */}
        <View style={styles.boosterSection}>
          <Text style={styles.sectionTitle}>5-Minute Mood Boosters</Text>
          <Text style={styles.boosterSubtitle}>Quick activities to improve your mood right now</Text>
          
          <View style={styles.boosterGrid}>
            {getMoodBoosters().map((booster, index) => (
              <TouchableOpacity
                key={index}
                style={styles.boosterCard}
                onPress={() => handleBoosterPress(booster)}
              >
                <Text style={styles.boosterIcon}>{booster.icon}</Text>
                <Text style={styles.boosterTitle}>{booster.title}</Text>
                <Text style={styles.boosterDuration}>{booster.duration}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Personalized Recommendations */}
        {recommendations.length > 0 && (
          <View style={styles.recommendationSection}>
            <Text style={styles.sectionTitle}>Personalized for You</Text>
            <Text style={styles.recommendationSubtitle}>Based on your mood patterns</Text>
            
            {recommendations.map((rec, index) => (
              <View key={index} style={[styles.recommendationCard, { borderLeftColor: rec.color }]}>
                <View style={styles.recommendationHeader}>
                  <Text style={styles.recommendationIcon}>{rec.icon}</Text>
                  <View style={styles.recommendationContent}>
                    <Text style={styles.recommendationTitle}>{rec.title}</Text>
                    <Text style={styles.recommendationDescription}>{rec.description}</Text>
                  </View>
                </View>
                {rec.actionable && (
                  <TouchableOpacity
                    style={styles.recommendationAction}
                    onPress={() => handleRecommendationAction(rec)}
                  >
                    <Text style={styles.recommendationActionText}>{rec.actionText}</Text>
                  </TouchableOpacity>
                )}
              </View>
            ))}
          </View>
        )}

        {/* Emergency Support */}
        {negativeStreak >= 3 && (
          <View style={styles.emergencySection}>
            <Text style={styles.emergencyTitle}>Need Extra Support?</Text>
            <Text style={styles.emergencyDescription}>
              You&apos;ve been feeling down for {negativeStreak} days. Here are some resources that might help:
            </Text>
            
            <TouchableOpacity style={styles.emergencyButton}>
              <Text style={styles.emergencyButtonText}>Talk to Someone</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.emergencyButton}>
              <Text style={styles.emergencyButtonText}>Breathing Exercise</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Mood Tracking Motivation */}
        <View style={styles.motivationSection}>
          <Text style={styles.motivationIcon}>🎯</Text>
          <Text style={styles.motivationTitle}>Keep It Up!</Text>
          <Text style={styles.motivationText}>
            {moodStreak > 0 
              ? `You're on a ${moodStreak}-day good mood streak! Keep doing what's working.`
              : "Log your mood daily to get personalized recommendations that really work for you."
            }
          </Text>
        </View>
      </View>
    );
  };

  const getMoodColor = (moodValue: number) => {
    if (moodValue >= 7) return '#4CAF50'; // Green for good
    if (moodValue >= 5) return '#FF9800'; // Orange for neutral
    return '#F44336'; // Red for bad
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Tab Navigation */}
      <View style={styles.tabNavigation}>
        {renderTabButton('how-are-you', 'How Are You?', '😊')}
        {renderTabButton('your-patterns', 'Your Patterns', '📊')}
        {renderTabButton('what-helps', 'What Helps?', '💡')}
      </View>

      {/* Tab Content */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {selectedTab === 'how-are-you' && renderHowAreYou()}
        {selectedTab === 'your-patterns' && renderYourPatterns()}
        {selectedTab === 'what-helps' && renderWhatHelps()}
      </ScrollView>

      {/* Mood Alert Modal */}
      {showMoodAlert && moodAlert && (
        <View style={styles.modalOverlay}>
          <View style={[styles.alertModal, { borderLeftColor: moodAlert.color }]}>
            <Text style={styles.alertIcon}>{moodAlert.icon}</Text>
            <Text style={styles.alertTitle}>{moodAlert.title}</Text>
            <Text style={styles.alertMessage}>{moodAlert.message}</Text>
            <View style={styles.alertActions}>
              <TouchableOpacity
                style={[styles.alertButton, styles.alertButtonSecondary]}
                onPress={() => setShowMoodAlert(false)}
              >
                <Text style={styles.alertButtonTextSecondary}>Later</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.alertButton, { backgroundColor: moodAlert.color }]}
                onPress={() => handleAlertAction(moodAlert)}
              >
                <Text style={styles.alertButtonText}>{moodAlert.action}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

      {/* Celebration Modal */}
      {showCelebration && celebration && (
        <View style={styles.modalOverlay}>
          <View style={[styles.celebrationModal, { borderColor: celebration.color }]}>
            <Text style={styles.celebrationIcon}>{celebration.icon}</Text>
            <Text style={styles.celebrationTitle}>{celebration.title}</Text>
            <Text style={styles.celebrationMessage}>{celebration.message}</Text>
            <TouchableOpacity
              style={[styles.celebrationButton, { backgroundColor: celebration.color }]}
              onPress={() => setShowCelebration(false)}
            >
              <Text style={styles.celebrationButtonText}>{celebration.action}</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

const createStyles = (colors: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingText: {
    textAlign: 'center',
    marginTop: 50,
    color: colors.text,
    fontSize: 16,
  },
  tabNavigation: {
    flexDirection: 'row',
    backgroundColor: colors.card,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 8,
    marginHorizontal: 4,
  },
  activeTabButton: {
    backgroundColor: colors.primary,
  },
  tabIcon: {
    fontSize: 20,
    marginBottom: 4,
  },
  tabText: {
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: 'center',
    fontWeight: '500',
  },
  activeTabText: {
    color: colors.background,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  tabContent: {
    flex: 1,
  },
  tabTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 8,
  },
  tabSubtitle: {
    fontSize: 16,
    color: colors.textSecondary,
    marginBottom: 24,
  },
  placeholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  placeholderText: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  // Phase 2 styles
  moodLoggingSection: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 16,
  },
     moodSelector: {
     flexDirection: 'row',
     justifyContent: 'center',
     alignItems: 'center',
     marginBottom: 20,
     flexWrap: 'wrap',
   },
     moodOption: {
     alignItems: 'center',
     justifyContent: 'center',
     width: 60,
     height: 60,
     borderRadius: 30,
     borderWidth: 2,
     borderColor: colors.border,
     marginHorizontal: 8,
   },
   selectedMoodOption: {
     borderWidth: 3,
     backgroundColor: colors.primary + '20',
     transform: [{ scale: 1.1 }],
   },
   moodEmoji: {
     fontSize: 28,
   },
  noteSection: {
    marginBottom: 20,
  },
  noteLabel: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 8,
  },
  noteInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: 12,
    color: colors.text,
    backgroundColor: colors.background,
    minHeight: 40,
  },
  logMoodButton: {
    backgroundColor: colors.primary,
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
  },
  logMoodButtonDisabled: {
    backgroundColor: colors.border,
  },
  logMoodButtonText: {
    color: colors.background,
    fontSize: 16,
    fontWeight: '600',
  },
  todaySummary: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  summaryCard: {
    backgroundColor: colors.background,
    borderRadius: 8,
    padding: 12,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  summaryLabel: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  summaryValue: {
    fontSize: 14,
    color: colors.text,
    fontWeight: '500',
  },
  moodHistorySection: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  moodCalendar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  moodDay: {
    alignItems: 'center',
    flex: 1,
  },
  dayName: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 8,
  },
  moodDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    marginBottom: 4,
  },
  noMoodDot: {
    backgroundColor: colors.border,
  },
  moodValue: {
    fontSize: 10,
    color: colors.textSecondary,
  },
  // Phase 3 styles
  patternSection: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  patternCard: {
    backgroundColor: colors.background,
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    borderLeftWidth: 4,
  },
  patternHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  patternIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  patternTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    flex: 1,
  },
  patternDescription: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 8,
  },
  actionableBadge: {
    alignSelf: 'flex-start',
    backgroundColor: colors.primary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  actionableText: {
    fontSize: 12,
    color: colors.background,
    fontWeight: '500',
  },
  noPatternsCard: {
    alignItems: 'center',
    padding: 24,
  },
  noPatternsIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  noPatternsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  noPatternsDescription: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  moodCalendarLarge: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  calendarDay: {
    width: '3%',
    aspectRatio: 1,
    marginBottom: 4,
  },
  calendarDot: {
    width: '100%',
    height: '100%',
    borderRadius: 2,
  },
  calendarLegend: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 6,
  },
  legendText: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  // Phase 4 styles - What Helps
  boosterSection: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  boosterSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 16,
  },
  boosterGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  boosterCard: {
    width: '48%',
    backgroundColor: colors.background,
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  boosterIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  boosterTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    textAlign: 'center',
    marginBottom: 4,
  },
  boosterDuration: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  recommendationSection: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  recommendationSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 16,
  },
  recommendationCard: {
    backgroundColor: colors.background,
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    borderLeftWidth: 4,
  },
  recommendationHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  recommendationIcon: {
    fontSize: 20,
    marginRight: 12,
    marginTop: 2,
  },
  recommendationContent: {
    flex: 1,
  },
  recommendationTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  recommendationDescription: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  recommendationAction: {
    backgroundColor: colors.primary,
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    alignSelf: 'flex-start',
  },
  recommendationActionText: {
    fontSize: 14,
    color: colors.background,
    fontWeight: '500',
  },
  emergencySection: {
    backgroundColor: '#FFF3E0',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#FF9800',
  },
  emergencyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#E65100',
    marginBottom: 8,
  },
  emergencyDescription: {
    fontSize: 14,
    color: '#BF360C',
    marginBottom: 16,
    lineHeight: 20,
  },
  emergencyButton: {
    backgroundColor: '#FF9800',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    alignItems: 'center',
  },
  emergencyButtonText: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  motivationSection: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    marginBottom: 20,
  },
  motivationIcon: {
    fontSize: 40,
    marginBottom: 12,
  },
  motivationTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  motivationText: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  // Phase 5 styles - Modals and Alerts
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  alertModal: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 20,
    margin: 20,
    borderLeftWidth: 4,
    maxWidth: 320,
    alignItems: 'center',
  },
  alertIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  alertTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    textAlign: 'center',
    marginBottom: 12,
  },
  alertMessage: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  alertActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  alertButton: {
    flex: 1,
    borderRadius: 8,
    padding: 12,
    marginHorizontal: 4,
    alignItems: 'center',
  },
  alertButtonSecondary: {
    backgroundColor: colors.border,
  },
  alertButtonText: {
    fontSize: 16,
    color: colors.background,
    fontWeight: '600',
  },
  alertButtonTextSecondary: {
    fontSize: 16,
    color: colors.text,
    fontWeight: '500',
  },
  celebrationModal: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 24,
    margin: 20,
    borderWidth: 3,
    maxWidth: 320,
    alignItems: 'center',
  },
  celebrationIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  celebrationTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
    textAlign: 'center',
    marginBottom: 12,
  },
  celebrationMessage: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  celebrationButton: {
    borderRadius: 12,
    paddingHorizontal: 24,
    paddingVertical: 12,
    alignItems: 'center',
  },
  celebrationButtonText: {
    fontSize: 18,
    color: colors.background,
    fontWeight: '600',
  },
  // Mood Wins styles
  moodWinsSection: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  winCard: {
    backgroundColor: '#E8F5E8',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#4CAF50',
  },
  winIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  winTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2E7D32',
    textAlign: 'center',
    marginBottom: 4,
  },
  winDescription: {
    fontSize: 14,
    color: '#388E3C',
    textAlign: 'center',
  },
});
