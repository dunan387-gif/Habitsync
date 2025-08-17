import React, { useState, useMemo, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions, Modal, Alert } from 'react-native';
import { useHabits } from '@/context/HabitContext';
import { useTheme } from '@/context/ThemeContext';
import { useLanguage } from '@/context/LanguageContext';
import { useSubscription } from '@/context/SubscriptionContext';
import { HabitMoodCorrelation, MoodHabitAnalytics } from '@/types';
import AdaptiveThresholdService from '@/services/AdaptiveThresholdService';
import RecommendationFeedback from '@/components/RecommendationFeedback';

const { width } = Dimensions.get('window');

export default function MoodHabitDashboard() {
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [selectedRecommendation, setSelectedRecommendation] = useState<any>(null);
  
  const { 
    getMoodHabitAnalytics, 
    getHabitMoodCorrelations, 
    habits,
    // NEW: AI-Powered Predictive Intelligence functions
    getHabitSuccessPredictions,
    getRiskAlerts,
    getOptimalTimingSuggestions,
    getMoodTriggeredRecommendations,
    getWeeklyForecast,
    getAIPredictiveAnalytics
  } = useHabits();
  const { currentTheme } = useTheme();
  const { t, currentLanguage } = useLanguage();
  const { canUseMoodHabitCorrelations, showUpgradePrompt } = useSubscription();
  
  // Safety check for currentTheme
  if (!currentTheme || !currentTheme.colors) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>Loading...</Text>
      </View>
    );
  }
  
  const styles = createStyles(currentTheme.colors);

  // Check if user can access mood-habit correlations
  if (!canUseMoodHabitCorrelations()) {
    return (
      <View style={styles.upgradeContainer}>
        <Text style={styles.upgradeTitle}>{t('moodAnalytics.upgradeRequired')}</Text>
        <Text style={styles.upgradeMessage}>{t('moodAnalytics.upgradeMessage')}</Text>
        <TouchableOpacity 
          style={styles.upgradeButton}
          onPress={() => showUpgradePrompt('mood_correlations')}
        >
                      <Text style={styles.upgradeButtonText}>{t('premium.upgradeToPro')}</Text>
        </TouchableOpacity>
      </View>
    );
  }
  
  // Initialize adaptive threshold service
  const adaptiveThresholdService = useMemo(() => {
    const service = AdaptiveThresholdService.getInstance();
    return service;
  }, []);

  // Load adaptive threshold data on component mount
  useEffect(() => {
    const loadThresholdData = async () => {
      await adaptiveThresholdService.loadPatterns();
      await adaptiveThresholdService.loadThresholds();
    };
    loadThresholdData();
  }, [adaptiveThresholdService]);


  
  // Debug translation function
  const translate = (key: string, fallback?: string) => {
    const translated = t(key);
    // If translation returns the key itself, use fallback or a default
    if (translated === key) {
      return fallback || key.split('.').pop() || key;
    }
    return translated;
  };

  // Helper function to translate dynamic content
  const translateDynamicContent = (content: string, type: 'reasoning' | 'moodBasedRecommendation' | 'activity' | 'suggestion') => {
    // If content is already a translation key (starts with 'dynamicContent.' or 'moodAnalytics.'), use it directly
    if (content.startsWith('dynamicContent.') || content.startsWith('moodAnalytics.')) {
      const translated = t(content);
      if (translated !== content) {
        return translated;
      }
    }
    
    // Try to find a matching translation key
    const contentLower = content.toLowerCase();
    
    // Map common patterns to translation keys
    const translationMap: Record<string, string> = {
      // Reasoning patterns
      'good mood': 'dynamicContent.reasoning.goodMood',
      'consistent time': 'dynamicContent.reasoning.consistentTime',
      'optimal conditions': 'dynamicContent.reasoning.optimalConditions',
      'momentum': 'dynamicContent.reasoning.momentum',
      'recovery': 'dynamicContent.reasoning.recovery',
      
      // Mood-based recommendation patterns
      'morning': 'dynamicContent.moodBasedRecommendation.morning',
      'afternoon': 'dynamicContent.moodBasedRecommendation.afternoon',
      'evening': 'dynamicContent.moodBasedRecommendation.evening',
      'high energy': 'dynamicContent.moodBasedRecommendation.highEnergy',
      'low energy': 'dynamicContent.moodBasedRecommendation.lowEnergy',
      'stressful': 'dynamicContent.moodBasedRecommendation.stressful',
      
      // Activity patterns
      'meditation': 'dynamicContent.activities.meditation',
      'exercise': 'dynamicContent.activities.exercise',
      'reading': 'dynamicContent.activities.reading',
      'walking': 'dynamicContent.activities.walking',
      'deep breathing': 'dynamicContent.activities.deepBreathing',
      'gratitude': 'dynamicContent.activities.gratitude',
      'social call': 'dynamicContent.activities.socialCall',
      'music': 'dynamicContent.activities.music',
      'nature': 'dynamicContent.activities.nature',
      'creative': 'dynamicContent.activities.creative',
      'plan your day': 'dynamicContent.activities.planYourDay',
      
      // Suggestion patterns
      'break it down': 'dynamicContent.suggestions.breakItDown',
      'set reminder': 'dynamicContent.suggestions.setReminder',
      'find accountability': 'dynamicContent.suggestions.findAccountability',
      'adjust timing': 'dynamicContent.suggestions.adjustTiming',
      'reduce complexity': 'dynamicContent.suggestions.reduceComplexity',
      'celebrate progress': 'dynamicContent.suggestions.celebrateProgress'
    };
    
    // Try to find a matching translation
    for (const [pattern, translationKey] of Object.entries(translationMap)) {
      if (contentLower.includes(pattern)) {
        const translated = t(translationKey);
        if (translated !== translationKey) {
          return translated;
        }
      }
    }
    
    // Fallback if no translation found
    return content;
  };
  
  const [selectedTab, setSelectedTab] = useState<TabKey>('dashboard');
  const [currentMood, setCurrentMood] = useState<{ moodState: string; intensity: number } | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);
  
  // Add these missing useState hooks at the top level
  const [analyticsView, setAnalyticsView] = useState<'trends' | 'success-rates' | 'distribution' | 'compare'>('trends');
  const [insightsView, setInsightsView] = useState<'smart' | 'ai' | 'recommendations'>('smart');
  const [progressView, setProgressView] = useState<'tracking' | 'improvement' | 'performance'>('tracking');
  const [correlationsView, setCorrelationsView] = useState<'habits' | 'heatmap' | 'success'>('habits');
  const [wellnessView, setWellnessView] = useState<'summary' | 'resilience' | 'trends'>('summary');
  const [reportsView, setReportsView] = useState<'monthly' | 'calendar'>('monthly');
  
  const analytics = useMemo(() => getMoodHabitAnalytics(), [getMoodHabitAnalytics]);
  const correlations = useMemo(() => getHabitMoodCorrelations(), [getHabitMoodCorrelations]);
  
  // Helper function to get month name with translation
  const getMonthName = (date: Date) => {
    const monthNames = [
      'january', 'february', 'march', 'april', 'may', 'june',
      'july', 'august', 'september', 'october', 'november', 'december'
    ];
    return t(`moodAnalytics.months.${monthNames[date.getMonth()]}`);
  };
  
  // Helper function to get mood state label with translation
  const getMoodStateLabel = (moodState: string) => {
    return t(`moodAnalytics.moodStates.${moodState.toLowerCase()}`);
  };
  
  // Calculate streak data from habits
  const streakData = useMemo(() => {
    if (!habits || habits.length === 0) {
      return { current: 0, longest: 0 };
    }
    
    const currentStreaks = habits.map(habit => habit.streak || 0);
    const longestStreaks = habits.map(habit => habit.bestStreak || 0);
    
    return {
      current: Math.max(...currentStreaks, 0),
      longest: Math.max(...longestStreaks, 0)
    };
  }, [habits]);
  
  // NEW: AI-powered data
  const aiPredictions = useMemo(() => {
    if (!currentMood) return getHabitSuccessPredictions();
    return getHabitSuccessPredictions(currentMood);
  }, [getHabitSuccessPredictions, currentMood]);
  
  const riskAlerts = useMemo(() => {
    if (!currentMood) return getRiskAlerts();
    return getRiskAlerts(currentMood);
  }, [getRiskAlerts, currentMood]);
  
  const timingSuggestions = useMemo(() => {
    if (!currentMood) return [];
    return getOptimalTimingSuggestions(currentMood);
  }, [getOptimalTimingSuggestions, currentMood]);
  
  const moodRecommendations = useMemo(() => {
    if (!currentMood) return null;
    return getMoodTriggeredRecommendations(currentMood);
  }, [getMoodTriggeredRecommendations, currentMood]);
  
  const weeklyForecast = useMemo(() => getWeeklyForecast(), [getWeeklyForecast]);
  
  const aiAnalytics = useMemo(() => {
    if (!currentMood) return getAIPredictiveAnalytics();
    return getAIPredictiveAnalytics(currentMood);
  }, [getAIPredictiveAnalytics, currentMood]);
  
  // Enhanced data processing functions
  const getWeeklyReport = () => {
    const weeklyData = analytics.moodTrends.slice(-7);
    const totalHabits = weeklyData.reduce((sum, day) => sum + day.habitsCompleted, 0);
    const avgMood = weeklyData.reduce((sum, day) => sum + day.averageMood, 0) / weeklyData.length;
    const bestDay = weeklyData.reduce((best, day) => 
      day.averageMood > best.averageMood ? day : best, weeklyData[0] || { averageMood: 0, date: '' }
    );
    const improvingTrend = weeklyData.length > 1 && weeklyData[weeklyData.length - 1].averageMood > weeklyData[0].averageMood;
    
    return {
      totalHabits,
      avgMood: avgMood.toFixed(1),
      bestDay: t(`moodAnalytics.weekdays.${['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][new Date(bestDay.date).getDay()]}`),
      improvingTrend,
      weeklyData
    };
  };
  
  const getTopInsights = () => {
    const weeklyReport = getWeeklyReport();
    const topHabits = correlations
      .filter(c => c.moodImprovement > 0)
      .sort((a, b) => b.moodImprovement - a.moodImprovement)
      .slice(0, 3);
    
    return {
      weeklyReport,
      topMoodBoosters: topHabits,
      bestMoodState: analytics.insights.bestMoodForHabits,
      challengingMood: analytics.insights.worstMoodForHabits
    };
  };
  
  // NEW: AI Insights rendering functions
 const renderAIInsights = () => {
  return (
    <View style={styles.section}>
      <View style={styles.aiInsightsHeader}>
        <Text style={styles.sectionTitle}>{t('moodAnalytics.aiInsights.title')}</Text>
        <Text style={styles.aiInsightsSubtitle}>{t('moodAnalytics.aiInsights.description')}</Text>
      </View>
      
      {/* Enhanced Mood Input Section */}
      <View style={styles.enhancedAnalysisCard}>
        <View style={styles.cardHeaderWithIcon}>
          <View style={styles.cardIconContainer}>
            <Text style={styles.cardIcon}>🎯</Text>
          </View>
          <View style={styles.cardHeaderText}>
            <Text style={styles.cardTitle}>{t('moodAnalytics.aiInsights.currentMoodCheckIn.title')}</Text>
            <Text style={styles.cardSubtitle}>{t('moodAnalytics.aiInsights.currentMoodCheckIn.subtitle')}</Text>
          </View>
        </View>
        {renderEnhancedMoodSelector()}
      </View>
      
      {/* Enhanced Success Predictions */}
      {aiPredictions.length > 0 && (
        <View style={styles.enhancedAnalysisCard}>
          <View style={styles.cardHeaderWithIcon}>
            <View style={styles.cardIconContainer}>
              <Text style={styles.cardIcon}>📊</Text>
            </View>
            <View style={styles.cardHeaderText}>
              <Text style={styles.cardTitle}>{t('moodAnalytics.aiInsights.successPredictions.title')}</Text>
              <Text style={styles.cardSubtitle}>{t('moodAnalytics.aiInsights.successPredictions.subtitle')}</Text>
            </View>
          </View>
          
          <View style={styles.predictionsGrid}>
            {aiPredictions.slice(0, 3).map((prediction, index) => (
              <View key={prediction.habitId} style={styles.enhancedPredictionItem}>
                <View style={styles.predictionHeader}>
                  <Text style={styles.predictionTitle}>{prediction.habitTitle}</Text>
                  <View style={[styles.enhancedPredictionBadge, { backgroundColor: getPredictionColor(prediction.predictedSuccessRate) }]}>
                    <Text style={styles.predictionBadgeText}>
                      {Math.round(prediction.predictedSuccessRate * 100)}%
                    </Text>
                  </View>
                </View>
                
                <Text style={styles.predictionReasoning}>{translateDynamicContent(prediction.reasoning, 'reasoning')}</Text>
                
                <View style={styles.enhancedFactorsContainer}>
                  <Text style={styles.factorsTitle}>{t('moodAnalytics.aiInsights.keyFactors')}</Text>
                  <View style={styles.factorsGrid}>
                    <View style={styles.enhancedFactor}>
                      <Text style={styles.factorLabel}>{t('moodAnalytics.aiInsights.moodAlignment')}</Text>
                      <View style={styles.factorProgressContainer}>
                        <View style={styles.factorBar}>
                          <View style={[styles.factorFill, { width: `${prediction.factors.moodAlignment * 100}%`, backgroundColor: currentTheme.colors.primary }]} />
                        </View>
                        <Text style={styles.factorPercentage}>{Math.round(prediction.factors.moodAlignment * 100)}%</Text>
                      </View>
                    </View>
                    <View style={styles.enhancedFactor}>
                      <Text style={styles.factorLabel}>{t('moodAnalytics.aiInsights.timing')}</Text>
                      <View style={styles.factorProgressContainer}>
                        <View style={styles.factorBar}>
                          <View style={[styles.factorFill, { width: `${prediction.factors.timeOfDay * 100}%`, backgroundColor: currentTheme.colors.accent }]} />
                        </View>
                        <Text style={styles.factorPercentage}>{Math.round(prediction.factors.timeOfDay * 100)}%</Text>
                      </View>
                    </View>
                  </View>
                </View>
              </View>
            ))}
          </View>
        </View>
      )}
      
      {/* Enhanced Risk Alerts */}
      {riskAlerts.length > 0 && (
        <View style={styles.enhancedAnalysisCard}>
          <View style={styles.cardHeaderWithIcon}>
            <View style={[styles.cardIconContainer, { backgroundColor: '#FFF3E0' }]}>
              <Text style={styles.cardIcon}>⚠️</Text>
            </View>
            <View style={styles.cardHeaderText}>
              <Text style={styles.cardTitle}>{t('moodAnalytics.aiInsights.riskAlerts.title')}</Text>
              <Text style={styles.cardSubtitle}>{t('moodAnalytics.aiInsights.riskAlerts.subtitle')}</Text>
            </View>
          </View>
          
          <View style={styles.riskAlertsContainer}>
            {riskAlerts.map((alert, index) => (
              <View key={alert.id} style={[styles.enhancedRiskAlert, { borderLeftColor: getRiskColor(alert.riskLevel) }]}>
                <View style={styles.riskHeader}>
                  <Text style={styles.riskTitle}>{alert.habitTitle}</Text>
                  <View style={[styles.enhancedRiskBadge, { backgroundColor: getRiskColor(alert.riskLevel) }]}>
                   <Text style={styles.riskBadgeText}>{t(`moodAnalytics.riskLevels.${alert.riskLevel}`)}</Text>
                  </View>
                </View>
                
                <View style={styles.riskUrgencyContainer}>
                  <Text style={styles.riskUrgencyLabel}>{t('moodAnalytics.aiInsights.urgencyLevel')}</Text>
                  <Text style={styles.riskUrgency}>{t(`moodAnalytics.urgencyLevels.${alert.urgency}`)}</Text>
                </View>
                
                <View style={styles.enhancedSuggestionsContainer}>
                  <Text style={styles.suggestionsTitle}>{t('moodAnalytics.aiInsights.suggestions')}</Text>
                  {alert.suggestions.map((suggestion, idx) => (
                    <View key={idx} style={styles.suggestionItem}>
                      <Text style={styles.suggestionBullet}>•</Text>
                      <Text style={styles.suggestion}>{translateDynamicContent(suggestion, 'suggestion')}</Text>
                    </View>
                  ))}
                </View>
              </View>
            ))}
          </View>
        </View>
      )}
      
      {/* Enhanced Optimal Timing */}
      {timingSuggestions.length > 0 && (
        <View style={styles.enhancedAnalysisCard}>
          <View style={styles.cardHeaderWithIcon}>
            <View style={[styles.cardIconContainer, { backgroundColor: '#E8F5E8' }]}>
              <Text style={styles.cardIcon}>⏰</Text>
            </View>
            <View style={styles.cardHeaderText}>
              <Text style={styles.cardTitle}>{t('moodAnalytics.aiInsights.optimalTiming.title')}</Text>
              <Text style={styles.cardSubtitle}>{t('moodAnalytics.aiInsights.optimalTiming.subtitle')}</Text>
            </View>
          </View>
          
          <View style={styles.timingSuggestionsContainer}>
            {timingSuggestions.map((timing, index) => (
              <View key={timing.habitId} style={styles.enhancedTimingItem}>
                <Text style={styles.timingTitle}>{timing.habitTitle}</Text>
                
                <View style={styles.bestTimeContainer}>
                  <Text style={styles.bestTimeLabel}>{t('moodAnalytics.aiInsights.bestTimeToday')}</Text>
                  <Text style={styles.timingBest}>{timing.bestTimeToday}</Text>
                </View>
                
                <Text style={styles.timingReason}>{translateDynamicContent(timing.moodBasedRecommendation, 'moodBasedRecommendation')}</Text>
                
                <View style={styles.enhancedAlternativeTimesContainer}>
                  <Text style={styles.alternativeLabel}>{t('moodAnalytics.aiInsights.alternativeTimes')}</Text>
                  <View style={styles.timeChips}>
                    {timing.alternativeTimes.map((time, idx) => (
                      <View key={idx} style={styles.enhancedTimeChip}>
                        <Text style={styles.timeChipText}>{time}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              </View>
            ))}
          </View>
        </View>
      )}
      
      {/* Enhanced Mood-Triggered Recommendations */}
      {moodRecommendations && (
        <View style={styles.enhancedAnalysisCard}>
          <View style={styles.cardHeaderWithIcon}>
            <View style={[styles.cardIconContainer, { backgroundColor: '#F3E5F5' }]}>
              <Text style={styles.cardIcon}>💡</Text>
            </View>
            <View style={styles.cardHeaderText}>
              <Text style={styles.cardTitle}>{t('moodAnalytics.aiInsights.moodBasedRecommendations.title')}</Text>
              <Text style={styles.cardSubtitle}>{t('moodAnalytics.aiInsights.moodBasedRecommendations.subtitle')}</Text>
            </View>
          </View>
          
          <View style={styles.enhancedMoodRecommendationsContainer}>
            {moodRecommendations.recommendedHabits.map((rec, index) => (
              <View key={rec.habitId} style={styles.enhancedRecommendationItem}>
                <View style={styles.recommendationHeader}>
                  <Text style={styles.recommendationTitle}>{rec.habitTitle}</Text>
                  <View style={[styles.enhancedUrgencyBadge, { backgroundColor: getUrgencyColor(rec.urgency) }]}>
                 <Text style={styles.urgencyText}>{t(`moodAnalytics.urgencyLevels.${rec.urgency}`)}</Text>
                  </View>
                </View>
                
                <Text style={styles.recommendationReason}>{translateDynamicContent(rec.reasoning, 'reasoning')}</Text>
                
                <View style={styles.enhancedBenefitContainer}>
                  <Text style={styles.benefitLabel}>{t('moodAnalytics.aiInsights.expectedMoodBoost')}</Text>
                  <View style={styles.benefitValueContainer}>
                    <Text style={styles.benefitValue}>+{Math.round(rec.expectedBenefit * 10)}</Text>
                    <Text style={styles.benefitScale}>/10</Text>
                  </View>
                </View>
              </View>
            ))}
            
            {moodRecommendations.moodBoostingActivities.length > 0 && (
              <View style={styles.enhancedBoostingActivitiesContainer}>
                <Text style={styles.boostingTitle}>{t('moodAnalytics.aiInsights.quickMoodBoosters')}</Text>
                <View style={styles.boostingActivitiesList}>
                  {moodRecommendations.moodBoostingActivities.map((activity, idx) => (
                    <View key={idx} style={styles.boostingActivityItem}>
                      <Text style={styles.boostingActivityBullet}>✨</Text>
                      <Text style={styles.boostingActivity}>{translateDynamicContent(activity, 'activity')}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}
          </View>
        </View>
      )}
      
      {/* Enhanced Weekly Forecast */}
      <View style={styles.enhancedAnalysisCard}>
        <View style={styles.cardHeaderWithIcon}>
          <View style={[styles.cardIconContainer, { backgroundColor: '#E3F2FD' }]}>
            <Text style={styles.cardIcon}>📅</Text>
          </View>
          <View style={styles.cardHeaderText}>
            <Text style={styles.cardTitle}>{t('moodAnalytics.aiInsights.weeklyForecast.title')}</Text>
            <Text style={styles.cardSubtitle}>{t('moodAnalytics.aiInsights.weeklyForecast.subtitle')}</Text>
          </View>
        </View>
        
        <View style={styles.enhancedForecastContainer}>
          {weeklyForecast.habitForecasts.slice(0, 3).map((forecast, index) => (
            <View key={forecast.habitId} style={styles.enhancedForecastItem}>
              <Text style={styles.forecastHabitTitle}>{forecast.habitTitle}</Text>
              
              <View style={styles.enhancedForecastStats}>
                <View style={styles.forecastStatCard}>
                  <Text style={styles.forecastStatValue}>{forecast.predictedCompletions}</Text>
                  <Text style={styles.forecastStatLabel}>{t('moodAnalytics.aiInsights.predictedCompletions')}</Text>
                </View>
                <View style={styles.forecastStatCard}>
                  <Text style={styles.forecastStatValue}>{Math.round(forecast.predictedSuccessRate * 100)}%</Text>
                  <Text style={styles.forecastStatLabel}>{t('moodAnalytics.aiInsights.successRate')}</Text>
                </View>
              </View>
              
              {forecast.riskDays.length > 0 && (
                <View style={styles.enhancedRiskDaysContainer}>
                  <Text style={styles.riskDaysTitle}>{t('moodAnalytics.aiInsights.riskDays')}</Text>
                  <View style={styles.riskDaysList}>
                    {forecast.riskDays.map((riskDay, idx) => (
                      <View key={idx} style={styles.riskDayChip}>
                        <Text style={styles.riskDayText}>
                          {t(`moodAnalytics.weekdays.${['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][new Date(riskDay.date).getDay()]}`).substring(0, 3)}
                        </Text>
                       <Text style={styles.riskDayLevel}>{t(`moodAnalytics.riskLevels.${riskDay.riskLevel}`)}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}
            </View>
          ))}
          
          {weeklyForecast.insights.length > 0 && (
            <View style={styles.enhancedWeeklyInsightsContainer}>
              <Text style={styles.weeklyInsightsTitle}>{t('moodAnalytics.aiInsights.weeklyInsights')}</Text>
              <View style={styles.weeklyInsightsList}>
                {weeklyForecast.insights.map((insight, idx) => (
                  <View key={idx} style={styles.weeklyInsightItem}>
                    <Text style={styles.weeklyInsightBullet}>💡</Text>
                    <Text style={styles.weeklyInsight}>{t(`moodAnalytics.weeklyInsights.${insight}`)}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}
        </View>
      </View>
    </View>
  );
};
  
  const renderEnhancedMoodSelector = () => {
  const moods = [
    { state: 'happy', emoji: '😊', color: '#4CAF50', label: t('moodCheckIn.moodTags.happy') },
    { state: 'calm', emoji: '😌', color: '#2196F3', label: t('moodCheckIn.moodTags.calm') },
    { state: 'energetic', emoji: '⚡', color: '#FF9800', label: t('moodCheckIn.moodTags.energetic') },
    { state: 'tired', emoji: '😴', color: '#9E9E9E', label: t('moodCheckIn.moodTags.tired') },
    { state: 'stressed', emoji: '😰', color: '#F44336', label: t('moodCheckIn.moodTags.stressed') },
    { state: 'anxious', emoji: '😟', color: '#FF5722', label: t('moodCheckIn.moodTags.anxious') },
    { state: 'sad', emoji: '😢', color: '#607D8B', label: t('moodCheckIn.moodTags.sad') }
  ];
  
  return (
    <View style={styles.enhancedMoodSelectorContainer}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.moodSelector}>
        {moods.map((mood) => (
          <TouchableOpacity
            key={mood.state}
            style={[
              styles.enhancedMoodOption,
              currentMood?.moodState === mood.state && { 
                backgroundColor: mood.color + '20', 
                borderColor: mood.color,
                transform: [{ scale: 1.05 }]
              }
            ]}
            onPress={() => setCurrentMood({ moodState: mood.state, intensity: 7 })}
          >
            <Text style={styles.moodEmoji}>{mood.emoji}</Text>
            <Text style={[styles.enhancedMoodLabel, { color: mood.color }]}>{mood.label}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
      
      {currentMood && (
        <View style={styles.enhancedIntensityContainer}>
          <Text style={styles.intensityLabel}>{t('moodAnalytics.weeklyInsights.intensity')}: {currentMood.intensity}/10</Text>
          <View style={styles.enhancedIntensitySlider}>
            {[1,2,3,4,5,6,7,8,9,10].map((level) => (
              <TouchableOpacity
                key={level}
                style={[
                  styles.enhancedIntensityDot,
                  currentMood.intensity >= level && { backgroundColor: currentTheme.colors.primary }
                ]}
                onPress={() => setCurrentMood({ ...currentMood, intensity: level })}
              >
                <Text style={styles.intensityDotText}>{level}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}
    </View>
  );
};
  

  // Mood Improvement Over Time Graphs Component
  const renderMoodImprovementGraphs = () => {
    const last30Days = analytics.moodTrends.slice(-30);
    const last90Days = analytics.moodTrends.slice(-90);
    
    const calculateMoodTrend = (data: any[]) => {
      if (data.length < 2) return 0;
      const firstWeek = data.slice(0, 7);
      const lastWeek = data.slice(-7);
      const firstAvg = firstWeek.reduce((sum, day) => sum + day.averageMood, 0) / firstWeek.length;
      const lastAvg = lastWeek.reduce((sum, day) => sum + day.averageMood, 0) / lastWeek.length;
      return ((lastAvg - firstAvg) / firstAvg) * 100;
    };

    const monthlyTrend = calculateMoodTrend(last30Days);
    const quarterlyTrend = calculateMoodTrend(last90Days);
    
    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('moodAnalytics.weeklyInsights.moodImprovementTracking')}</Text>
        
        {/* Trend Summary Cards */}
        <View style={styles.trendCardsContainer}>
          <View style={styles.trendCard}>
            <Text style={styles.trendCardTitle}>{t('moodAnalytics.weeklyInsights.thirtyDayTrend')}</Text>
            <Text style={[styles.trendCardValue, {
              color: monthlyTrend > 0 ? currentTheme.colors.success : 
                     monthlyTrend < 0 ? currentTheme.colors.error : currentTheme.colors.warning
            }]}>
              {monthlyTrend > 0 ? '+' : ''}{monthlyTrend.toFixed(1)}%
            </Text>
            <Text style={styles.trendCardLabel}>
              {monthlyTrend > 0 ? translate('moodAnalytics.emotionalWellnessTrends.improving', '📈 Improving') : 
               monthlyTrend < 0 ? translate('moodAnalytics.emotionalWellnessTrends.declining', '📉 Declining') : 
               translate('moodAnalytics.emotionalWellnessTrends.stable', '📊 Stable')}
            </Text>
          </View>
          
          <View style={styles.trendCard}>
            <Text style={styles.trendCardTitle}>{t('moodAnalytics.weeklyInsights.ninetyDayTrend')}</Text>
            <Text style={[styles.trendCardValue, {
              color: quarterlyTrend > 0 ? currentTheme.colors.success : 
                     quarterlyTrend < 0 ? currentTheme.colors.error : currentTheme.colors.warning
            }]}>
              {quarterlyTrend > 0 ? '+' : ''}{quarterlyTrend.toFixed(1)}%
            </Text>
            <Text style={styles.trendCardLabel}>
              {quarterlyTrend > 0 ? translate('moodAnalytics.trends.longTermGrowth', '🚀 Long-term Growth') : 
               quarterlyTrend < 0 ? translate('moodAnalytics.trends.needsAttention', '⚠️ Needs Attention') : 
               translate('moodAnalytics.trends.consistent', '🔄 Consistent')}
            </Text>
          </View>
        </View>
        
        {/* Weekly Mood Progress Chart */}
        <View style={styles.chartCard}>
          <Text style={styles.cardTitle}>{t('moodAnalytics.charts.weeklyMoodProgress')}</Text>
          <View style={styles.weeklyMoodChart}>
            {last30Days.filter((_, index) => index % 7 === 0).map((week, index) => {
              const weekData = last30Days.slice(index * 7, (index + 1) * 7);
              const avgMood = weekData.reduce((sum, day) => sum + day.averageMood, 0) / weekData.length;
              const height = (avgMood / 10) * 100;
              
              return (
                <View key={`week-${index}`} style={styles.moodChartBar}>
                  <View 
                    style={[styles.moodChartFill, {
                      height: `${height}%`,
                      backgroundColor: avgMood >= 7 ? currentTheme.colors.success :
                                     avgMood >= 5 ? currentTheme.colors.warning :
                                     currentTheme.colors.error
                    }]}
                  />
                  <Text style={styles.moodChartValue}>{avgMood.toFixed(1)}</Text>
                  <Text style={styles.moodChartLabel}>{t(`moodAnalytics.charts.weekLabels.week${index + 1}`)}</Text>
                </View>
              );
            })}
          </View>
        </View>
      </View>
    );
  };

  // Habit Success Rate by Emotional State Component
  const renderHabitSuccessByMood = () => {
    const correlations = getHabitMoodCorrelations();
    const moodStates = ['happy', 'calm', 'energetic', 'tired', 'stressed', 'anxious', 'sad'];
    
    // Helper function to get translated mood states
    const getTranslatedMoodStates = () => moodStates.map(mood => ({
      key: mood,
      label: t(`moodCheckIn.moodTags.${mood}`)
    }));
    
    const getMoodSuccessData = () => {
      const moodData: any = {};
      moodStates.forEach(mood => {
        const moodEntries = correlations.flatMap(habit => 
          habit.successfulMoods.filter(m => m.moodState === mood)
        );
        const avgSuccessRate = moodEntries.length > 0 
          ? moodEntries.reduce((sum, entry) => sum + entry.successRate, 0) / moodEntries.length
          : 0;
        moodData[mood] = {
          successRate: avgSuccessRate,
          totalEntries: moodEntries.reduce((sum, entry) => sum + entry.count, 0)
        };
      });
      return moodData;
    };
    
    const moodSuccessData = getMoodSuccessData();
    
    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('moodAnalytics.smartInsights.successByMoodState.title')}</Text>
        
        {/* Success Rate by Mood Chart */}
        <View style={styles.chartCard}>
          <Text style={styles.cardTitle}>{t('moodAnalytics.charts.successRatesByMood')}</Text>
          <View style={styles.moodSuccessChart}>
            {getTranslatedMoodStates().map(({ key, label }) => {
              const data = moodSuccessData[key];
              const successRate = data.successRate;
              const height = successRate;
              
              return (
                <View key={key} style={styles.moodSuccessBar}>
                  <View 
                    style={[styles.moodSuccessBarFill, {
                      height: `${height}%`,
                      backgroundColor: successRate >= 70 ? currentTheme.colors.success :
                                     successRate >= 50 ? currentTheme.colors.warning :
                                     currentTheme.colors.error
                    }]}
                  />
                  <Text style={styles.moodSuccessValue}>{Math.round(successRate)}%</Text>
                  <Text style={styles.moodSuccessLabel}>{label}</Text>
                </View>
              );
            })}
          </View>
        </View>
        
        {/* Best and Worst Performing Moods */}
        <View style={styles.moodPerformanceCards}>
          <View style={[styles.performanceCard, { backgroundColor: currentTheme.colors.success + '20' }]}>
            <Text style={styles.performanceCardTitle}>{t('moodAnalytics.smartInsights.bestMood')}</Text>
            <Text style={styles.performanceCardMood}>
              {t(`moodCheckIn.moodTags.${Object.entries(moodSuccessData)
                .sort(([,a], [,b]) => (b as { successRate: number }).successRate - (a as { successRate: number }).successRate)[0]?.[0] || 'happy'}`)}
            </Text>
            <Text style={styles.performanceCardRate}>
              {Math.round((Object.values(moodSuccessData)
                .sort((a, b) => (b as { successRate: number }).successRate - (a as { successRate: number }).successRate)[0] as { successRate: number })?.successRate || 0)}% {t('moodAnalytics.smartInsights.successRate')}
            </Text>
          </View>
          
          <View style={[styles.performanceCard, { backgroundColor: currentTheme.colors.error + '20' }]}>
            <Text style={styles.performanceCardTitle}>{t('moodAnalytics.smartInsights.challengingMood')}</Text>
            <Text style={styles.performanceCardMood}>
              {t(`moodCheckIn.moodTags.${Object.entries(moodSuccessData)
                .sort(([,a], [,b]) => (a as { successRate: number }).successRate - (b as { successRate: number }).successRate)[0]?.[0] || 'stressed'}`)}
            </Text>
            <Text style={styles.performanceCardRate}>
              {Math.round((Object.values(moodSuccessData)
                .sort((a, b) => (a as { successRate: number }).successRate - (b as { successRate: number }).successRate)[0] as { successRate: number })?.successRate || 0)}% {t('moodAnalytics.smartInsights.successRate')}
            </Text>
          </View>
        </View>
      </View>
    );
  };
  

  const renderMonthlyEmotionalPatterns = () => {
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  const monthNames = ['january', 'february', 'march', 'april', 'may', 'june', 
                     'july', 'august', 'september', 'october', 'november', 'december'];
  
  // Helper function to convert averageMood to mood state
  const getMoodState = (averageMood: number): string => {
    if (averageMood >= 8) return t('moodCheckIn.moodTags.happy');
    if (averageMood >= 6) return t('moodCheckIn.moodTags.calm');
    if (averageMood >= 4) return t('moodCheckIn.moodTags.tired');
    if (averageMood >= 2) return t('moodCheckIn.moodTags.sad');
    return t('moodCheckIn.moodTags.stressed');
  };
  

  
  // Get mood emoji and color
  const getMoodDisplay = (moodState: string) => {
    const moodMap: Record<string, { emoji: string; color: string; label: string }> = {
      happy: { emoji: '😊', color: '#4CAF50', label: getMoodStateLabel('happy') },
      calm: { emoji: '😌', color: '#2196F3', label: getMoodStateLabel('calm') },
      tired: { emoji: '😴', color: '#FF9800', label: getMoodStateLabel('tired') },
      sad: { emoji: '😢', color: '#9C27B0', label: getMoodStateLabel('sad') },
      stressed: { emoji: '😤', color: '#F44336', label: getMoodStateLabel('stressed') }
    };
    return moodMap[moodState] || { emoji: '😐', color: '#757575', label: getMoodStateLabel('neutral') };
  };
  
  // Calculate monthly patterns
  const monthlyData = analytics.moodTrends.filter(trend => {
    const trendDate = new Date(trend.date);
    return trendDate.getMonth() === currentMonth && trendDate.getFullYear() === currentYear;
  });
  
  const patterns = {
    dominantMood: monthlyData.reduce((acc, curr) => {
      const moodState = getMoodState(curr.averageMood);
      acc[moodState] = (acc[moodState] || 0) + 1;
      return acc;
    }, {} as Record<string, number>),
    weeklyTrends: Array.from({length: 4}, (_, week) => {
      const weekData = monthlyData.filter((_, index) => Math.floor(index / 7) === week);
      const avgMood = weekData.reduce((sum, d) => sum + d.averageMood, 0) / weekData.length || 0;
      return {
        week: week + 1,
        avgMood,
        moodState: getMoodState(avgMood),
        stability: weekData.length > 1 ? 
          1 - (Math.max(...weekData.map(d => d.averageMood)) - Math.min(...weekData.map(d => d.averageMood))) / 10 : 1,
        daysTracked: weekData.length
      };
    }),
    emotionalVolatility: monthlyData.length > 1 ? 
      monthlyData.reduce((sum, curr, index, arr) => {
        if (index === 0) return 0;
        return sum + Math.abs(curr.averageMood - arr[index - 1].averageMood);
      }, 0) / (monthlyData.length - 1) : 0,
    averageMood: monthlyData.reduce((sum, d) => sum + d.averageMood, 0) / monthlyData.length || 0,
    totalDaysTracked: monthlyData.length
  };
  
  const topMood = Object.entries(patterns.dominantMood)
    .sort(([,a], [,b]) => b - a)[0];
  const topMoodDisplay = topMood ? getMoodDisplay(topMood[0]) : null;
  
  const stabilityScore = ((1 - patterns.emotionalVolatility / 10) * 100);
  const getStabilityLevel = (score: number) => {
      if (score >= 80) return { label: t('moodAnalytics.stabilityLevels.veryStable'), color: '#4CAF50' };
      if (score >= 60) return { label: t('moodAnalytics.stabilityLevels.stable'), color: '#8BC34A' };
      if (score >= 40) return { label: t('moodAnalytics.stabilityLevels.moderate'), color: '#FF9800' };
      return { label: t('moodAnalytics.stabilityLevels.variable'), color: '#F44336' };
    };
  
  const stabilityLevel = getStabilityLevel(stabilityScore);
  
  return (
    <View style={styles.enhancedInsightCard}>
      {/* Header with month name and summary */}
      <View style={styles.enhancedInsightHeader}>
        <View style={styles.insightHeaderLeft}>
         <Text style={styles.enhancedInsightTitle}>{t('moodAnalytics.smartInsights.emotionalJourney.title', { month: getMonthName(new Date(currentYear, currentMonth)) })}</Text>
          <Text style={styles.enhancedInsightSubtitle}>
            {patterns.totalDaysTracked} {t('moodAnalytics.emotionalJourney.daysTracked')} • {t('moodAnalytics.emotionalJourney.overallMood')}: {patterns.averageMood.toFixed(1)}/10
          </Text>
        </View>
        <View style={styles.monthlyScoreContainer}>
          <Text style={styles.monthlyScoreValue}>{patterns.averageMood.toFixed(1)}</Text>
          <Text style={styles.monthlyScoreLabel}>{t('moodAnalytics.emotionalJourney.avgMood')}</Text>
        </View>
      </View>
      
      {/* Enhanced Pattern Grid */}
      <View style={styles.enhancedPatternGrid}>
        <View style={[styles.enhancedPatternCard, { borderLeftColor: topMoodDisplay?.color || '#757575' }]}>
          <View style={styles.patternCardHeader}>
            <Text style={styles.patternCardEmoji}>{topMoodDisplay?.emoji || '😐'}</Text>
            <View style={styles.patternCardInfo}>
              <Text style={styles.enhancedPatternLabel}>{t('moodAnalytics.emotionalJourney.dominantMood')}</Text>
              <Text style={[styles.enhancedPatternValue, { color: topMoodDisplay?.color || '#757575' }]}>
                {topMoodDisplay?.label || 'N/A'}
              </Text>
              <Text style={styles.enhancedPatternSubtext}>{topMood?.[1] || 0} {t('moodAnalytics.emotionalJourney.daysTracked')} ({((topMood?.[1] || 0) / patterns.totalDaysTracked * 100).toFixed(0)}%)</Text>
            </View>
          </View>
        </View>
        
        <View style={[styles.enhancedPatternCard, { borderLeftColor: stabilityLevel.color }]}>
          <View style={styles.patternCardHeader}>
            <Text style={styles.patternCardEmoji}>{stabilityScore >= 70 ? '🎯' : stabilityScore >= 50 ? '📈' : '📊'}</Text>
            <View style={styles.patternCardInfo}>
              <Text style={styles.enhancedPatternLabel}>{t('moodAnalytics.emotionalJourney.emotionalStability')}</Text>
              <Text style={[styles.enhancedPatternValue, { color: stabilityLevel.color }]}>
                {stabilityLevel.label}
              </Text>
              <Text style={styles.enhancedPatternSubtext}>{stabilityScore.toFixed(0)}% {t('moodAnalytics.emotionalJourney.consistent')}</Text>
            </View>
          </View>
          <View style={[styles.stabilityProgressBar, { backgroundColor: stabilityLevel.color + '20' }]}>
            <View style={[styles.stabilityProgressFill, { 
              width: `${stabilityScore}%`, 
              backgroundColor: stabilityLevel.color 
            }]} />
          </View>
        </View>
      </View>
      
      {/* Enhanced Weekly Progression */}
      <View style={styles.weeklyProgressionContainer}>
                <Text style={styles.enhancedSectionSubtitle}>{t('moodAnalytics.smartInsights.weeklyProgression.title')}</Text>
        <View style={styles.weeklyProgressionGrid}>
          {patterns.weeklyTrends.map((week, index) => {
            const weekMoodDisplay = getMoodDisplay(week.moodState);
            return (
              <View key={index} style={styles.enhancedWeeklyTrendItem}>
                <View style={styles.weeklyTrendHeader}>
                  <Text style={styles.enhancedWeekLabel}>{t(`moodAnalytics.charts.weekLabels.week${week.week}`)}</Text>
                  <Text style={styles.weeklyTrendEmoji}>{weekMoodDisplay.emoji}</Text>
                </View>
                <View style={styles.enhancedTrendMetrics}>
                  <View style={styles.weeklyMetricItem}>
                    <Text style={styles.weeklyMetricLabel}>{t('moodAnalytics.emotionalJourney.overallMood')}</Text>
                    <Text style={[styles.enhancedTrendScore, { color: weekMoodDisplay.color }]}>
                      {week.avgMood.toFixed(1)}
                    </Text>
                  </View>
                  <View style={styles.weeklyMetricItem}>
                    <Text style={styles.weeklyMetricLabel}>{t('moodAnalytics.emotionalJourney.daysTracked')}</Text>
                    <Text style={styles.enhancedTrendScore}>{week.daysTracked}</Text>
                  </View>
                </View>
                <View style={[styles.enhancedStabilityBar, { backgroundColor: weekMoodDisplay.color + '20' }]}>
                  <View style={[styles.enhancedStabilityFill, {
                    width: `${week.stability * 100}%`,
                    backgroundColor: weekMoodDisplay.color
                  }]} />
                </View>
              </View>
            );
          })}
        </View>
      </View>
      
      {/* Insights and Tips */}
      <View style={styles.monthlyInsightsContainer}>
        <Text style={styles.enhancedSectionSubtitle}>{t('moodAnalytics.smartInsights.monthlyInsights.title')}</Text>
        <View style={styles.insightTipsList}>
          {stabilityScore < 50 && (
            <View style={styles.insightTipItem}>
              <Text style={styles.insightTipIcon}>⚠️</Text>
              <Text style={styles.insightTipText}>
                {t('moodAnalytics.smartInsights.monthlyInsights.variableMoodTip')}
              </Text>
            </View>
          )}
          {patterns.averageMood >= 7 && (
            <View style={styles.insightTipItem}>
              <Text style={styles.insightTipIcon}>🌟</Text>
              <Text style={styles.insightTipText}>
                {t('moodAnalytics.smartInsights.monthlyInsights.greatMonthTip')}
              </Text>
            </View>
          )}
          {patterns.totalDaysTracked < 15 && (
            <View style={styles.insightTipItem}>
              <Text style={styles.insightTipIcon}>📝</Text>
              <Text style={styles.insightTipText}>
                {t('moodAnalytics.smartInsights.monthlyInsights.trackMoreTip')}
              </Text>
            </View>
          )}
        </View>
      </View>
    </View>
  );
};
  
  
  const renderMoodHabitCorrelations = () => {
    // Helper function to convert averageMood to mood state
    const getMoodState = (averageMood: number): string => {
      if (averageMood >= 8) return t('moodCheckIn.moodTags.happy');
      if (averageMood >= 6) return t('moodCheckIn.moodTags.calm');
      if (averageMood >= 4) return t('moodCheckIn.moodTags.tired');
      if (averageMood >= 2) return t('moodCheckIn.moodTags.sad');
      return t('moodCheckIn.moodTags.stressed');
    };
    
    // Calculate correlations between moods and habit completion
    const correlationData = analytics.moodTrends.map(trend => {
      const dayHabits = (habits || []).filter(habit => 
        habit.completedDates?.some(date => 
          new Date(date).toDateString() === new Date(trend.date).toDateString()
        )
      );
      return {
        mood: getMoodState(trend.averageMood),
        score: trend.averageMood,
        habitsCompleted: dayHabits.length,
        date: trend.date
      };
    });
    
        const discoveries = [
      {
        title: t('moodAnalytics.smartInsights.correlationDiscoveries.highEnergyCorrelation.title'),
        description: t('moodAnalytics.smartInsights.correlationDiscoveries.highEnergyCorrelation.description'),
        strength: 0.8,
        actionable: t('moodAnalytics.smartInsights.correlationDiscoveries.highEnergyCorrelation.actionable')
      },
      {
        title: t('moodAnalytics.smartInsights.correlationDiscoveries.morningMoodBoost.title'),
        description: t('moodAnalytics.smartInsights.correlationDiscoveries.morningMoodBoost.description'),
        strength: 0.7,
        actionable: t('moodAnalytics.smartInsights.correlationDiscoveries.morningMoodBoost.actionable')
      },
      {
        title: t('moodAnalytics.smartInsights.correlationDiscoveries.socialConnectionImpact.title'),
        description: t('moodAnalytics.smartInsights.correlationDiscoveries.socialConnectionImpact.description'),
        strength: 0.6,
        actionable: t('moodAnalytics.smartInsights.correlationDiscoveries.socialConnectionImpact.actionable')
      }
    ];
    
    return (
      <View style={styles.insightCard}>
        <Text style={styles.insightTitle}>{t('moodAnalytics.smartInsights.correlationDiscoveries.title')}</Text>
        
        {discoveries.map((discovery, index) => (
          <View key={index} style={styles.discoveryCard}>
            <View style={styles.discoveryHeader}>
              <Text style={styles.discoveryTitle}>{discovery.title}</Text>
              <View style={[styles.strengthIndicator, 
                {backgroundColor: discovery.strength > 0.7 ? '#4CAF50' : 
                 discovery.strength > 0.5 ? '#FF9800' : '#F44336'}]}>
                <Text style={styles.strengthText}>{(discovery.strength * 100).toFixed(0)}%</Text>
              </View>
            </View>
            <Text style={styles.discoveryDescription}>{discovery.description}</Text>
            <Text style={styles.discoveryAction}>💡 {discovery.actionable}</Text>
          </View>
        ))}
      </View>
    );
  };
  
  const renderEmotionalWellnessSummary = () => {
    const last30Days = analytics.moodTrends.slice(-30);
    const avgMood = last30Days.reduce((sum, trend) => sum + trend.averageMood, 0) / last30Days.length;
    const moodImprovement = last30Days.length > 15 ? 
      (last30Days.slice(-15).reduce((sum, trend) => sum + trend.averageMood, 0) / 15) -
      (last30Days.slice(0, 15).reduce((sum, trend) => sum + trend.averageMood, 0) / 15) : 0;
    
    const wellnessScore = Math.min(100, Math.max(0, 
      (avgMood / 10 * 40) + 
      (Math.max(0, moodImprovement) * 20) + 
      (streakData.current / Math.max(streakData.longest, 1) * 20) +
      (analytics.insights.moodBoostingHabits.length * 4)
    ));
    
    const progressMetrics = [
      {
        label: t('moodAnalytics.wellnessSummary.moodStability'),
        value: ((10 - (Math.max(...last30Days.map(d => d.averageMood)) - Math.min(...last30Days.map(d => d.averageMood)))) / 10 * 100),
        target: 80,
        unit: "%"
      },
      {
        label: t('moodAnalytics.wellnessSummary.habitConsistency'),
        value: (streakData.current / Math.max(streakData.longest, 1) * 100),
        target: 90,
        unit: "%"
      },
      {
        label: t('moodAnalytics.wellnessSummary.weeklyImprovement'),
        value: Math.max(0, moodImprovement * 10),
        target: 5,
        unit: t('moodAnalytics.emotionalWellnessSummary.points')
      }
    ];
    
    return (
      <View style={styles.insightCard}>
        <Text style={styles.insightTitle}>{t('moodAnalytics.emotionalWellnessSummary.title')}</Text>
        
        <View style={styles.wellnessScoreCard}>
          <Text style={styles.wellnessScoreLabel}>{t('moodAnalytics.emotionalWellnessSummary.overallWellnessScore')}</Text>
          <Text style={styles.wellnessScoreValue}>{wellnessScore.toFixed(0)}/100</Text>
          <View style={styles.wellnessScoreBar}>
            <View style={[styles.wellnessScoreFill, {width: `${wellnessScore}%`}]} />
          </View>
        </View>
        
        <View style={styles.progressMetricsContainer}>
          {progressMetrics.map((metric, index) => (
            <View key={index} style={styles.progressMetricItem}>
              <Text style={styles.metricLabel}>{metric.label}</Text>
              <View style={styles.metricValueContainer}>
                <Text style={styles.metricValue}>
                  {metric.value.toFixed(1)}{metric.unit}
                </Text>
                <Text style={styles.metricTarget}>{t('moodAnalytics.emotionalWellnessSummary.target')} {metric.target}{metric.unit}</Text>
              </View>
              <View style={styles.metricProgressBar}>
                <View style={[
                  styles.metricProgressFill,
                  {width: `${Math.min(100, (metric.value / metric.target) * 100)}%`},
                  {backgroundColor: metric.value >= metric.target ? '#4CAF50' : '#FF9800'}
                ]} />
              </View>
            </View>
          ))}
        </View>
      </View>
    );
  };
  
  const renderPersonalizedRecommendations = () => {
    // Generate dynamic recommendations based on actual user data
    const dynamicRecommendations = generateDynamicRecommendations();
    
    return (
      <View style={styles.insightCard}>
        <Text style={styles.insightTitle}>{t('moodAnalytics.personalizedRecommendations.title')}</Text>
        
        {dynamicRecommendations.map((recommendation, index) => (
          <View key={index} style={styles.recommendationCard}>
            <View style={styles.recommendationHeader}>
              <Text style={styles.recommendationCategory}>{recommendation.category}</Text>
              <View style={[styles.priorityBadge, { backgroundColor: getPriorityColor(recommendation.priority) }]}>
                <Text style={styles.priorityText}>{t(`moodAnalytics.moodPriorities.${recommendation.priority}`)}</Text>
              </View>
            </View>
            
            <Text style={styles.recommendationDescription}>{recommendation.description}</Text>
            
            <View style={styles.suggestionsContainer}>
              {recommendation.suggestions.map((suggestion, suggestionIndex) => (
                <View key={suggestionIndex} style={styles.suggestionItem}>
                  <Text style={styles.suggestionText}>• {suggestion}</Text>
                </View>
              ))}
            </View>
            
            <View style={styles.impactContainer}>
              <Text style={styles.impactLabel}>{t('moodAnalytics.moodRecommendations.expectedImpact')}</Text>
              <Text style={styles.impactValue}>{recommendation.expectedImpact}</Text>
            </View>
            
            {recommendation.confidence && (
              <View style={styles.confidenceContainer}>
                <Text style={styles.confidenceLabel}>{t('moodAnalytics.moodRecommendations.confidence')}</Text>
                <View style={styles.confidenceBar}>
                  <View style={[styles.confidenceFill, { width: `${recommendation.confidence * 100}%` }]} />
                </View>
                <Text style={styles.confidenceValue}>{Math.round(recommendation.confidence * 100)}%</Text>
              </View>
            )}
            
            <TouchableOpacity
              style={styles.feedbackButton}
              onPress={() => handleFeedbackRequest(recommendation)}
            >
              <Text style={styles.feedbackButtonText}>{t('moodAnalytics.moodRecommendations.provideFeedback')}</Text>
            </TouchableOpacity>
          </View>
        ))}
      </View>
    );
  };

  // Generate dynamic recommendations based on actual user data
  const generateDynamicRecommendations = () => {
    const recommendations = [];
    
    // Analyze current mood patterns
    const recentMoodData = analytics.moodTrends.slice(-7); // Last 7 days
    const avgMood = recentMoodData.reduce((sum, trend) => sum + trend.averageMood, 0) / recentMoodData.length;
    const moodVolatility = calculateMoodVolatility(recentMoodData);
    
    // Record mood pattern for adaptive thresholds
    adaptiveThresholdService.recordPattern({
      userId: 'current-user', // In real app, get from auth
      patternType: 'mood',
      metric: 'average_mood',
      value: avgMood,
      timestamp: new Date().toISOString(),
      context: { volatility: moodVolatility }
    });
    
    // Analyze habit completion patterns
    const habitCompletionRate = calculateHabitCompletionRate();
    const strugglingHabits = identifyStrugglingHabits();
    const successfulHabits = identifySuccessfulHabits();
    
    // Record habit completion pattern
    adaptiveThresholdService.recordPattern({
      userId: 'current-user',
      patternType: 'habit',
      metric: 'completion_rate',
      value: habitCompletionRate,
      timestamp: new Date().toISOString(),
      context: { strugglingCount: strugglingHabits.length, successfulCount: successfulHabits.length }
    });
    
    // Get adaptive thresholds for comparison
    const moodThreshold = adaptiveThresholdService.getThreshold('current-user', 'mood', 'average_mood');
    const habitThreshold = adaptiveThresholdService.getThreshold('current-user', 'habit', 'completion_rate');
    
    // Recommendation 1: Mood Stability (using adaptive thresholds)
    const moodVolatilityThreshold = 0.3;
    const shouldRecommendMoodStability = moodVolatility > moodVolatilityThreshold || 
      (moodThreshold && adaptiveThresholdService.isBelowThreshold('current-user', 'mood', 'average_mood', avgMood));
    
    if (shouldRecommendMoodStability) {
      const confidence = moodThreshold ? moodThreshold.confidence : 0.85;
      recommendations.push({
        category: t('moodAnalytics.moodRecommendations.categories.moodStability'),
        priority: 'high',
        description: t('moodAnalytics.moodRecommendations.descriptions.moodStability', { 
          volatility: Math.round(moodVolatility * 100),
          threshold: moodThreshold ? Math.round(moodThreshold.current * 10) / 10 : 5
        }),
        suggestions: generateMoodStabilitySuggestions(avgMood, moodVolatility),
        expectedImpact: t('moodAnalytics.moodRecommendations.impacts.moodStability'),
        confidence: confidence
      });
    }
    
    // Recommendation 2: Habit Optimization (using adaptive thresholds)
    const habitCompletionThreshold = 0.7;
    const shouldRecommendHabitOptimization = habitCompletionRate < habitCompletionThreshold || 
      (habitThreshold && adaptiveThresholdService.isBelowThreshold('current-user', 'habit', 'completion_rate', habitCompletionRate));
    
    if (shouldRecommendHabitOptimization) {
      const confidence = habitThreshold ? habitThreshold.confidence : 0.78;
      recommendations.push({
        category: t('moodAnalytics.moodRecommendations.categories.habitOptimization'),
        priority: 'high',
                  description: t('moodAnalytics.moodRecommendations.descriptions.habitOptimization', { 
          rate: Math.round(habitCompletionRate * 100),
          threshold: habitThreshold ? Math.round(habitThreshold.current * 100) : 70
        }),
        suggestions: generateHabitOptimizationSuggestions(strugglingHabits),
                  expectedImpact: t('moodAnalytics.moodRecommendations.impacts.habitCompletion'),
        confidence: confidence
      });
    }
    
    // Recommendation 3: Mood-Habit Synergy (based on correlations)
    const moodHabitCorrelations = getMoodHabitCorrelations();
    if (moodHabitCorrelations.length > 0) {
      recommendations.push({
        category: t('moodAnalytics.moodRecommendations.categories.moodHabitSynergy'),
        priority: 'medium',
                  description: t('moodAnalytics.moodRecommendations.descriptions.moodHabitSynergy'),
        suggestions: generateMoodHabitSynergySuggestions(moodHabitCorrelations),
                  expectedImpact: t('moodAnalytics.moodRecommendations.impacts.moodHabitSynergy'),
        confidence: 0.72
      });
    }
    
    // Recommendation 4: Wellness Integration (if gaps detected)
    const wellnessGaps = identifyWellnessGaps();
    if (wellnessGaps.length > 0) {
      recommendations.push({
        category: t('moodAnalytics.moodRecommendations.categories.wellnessIntegration'),
        priority: 'medium',
                  description: t('moodAnalytics.moodRecommendations.descriptions.wellnessIntegration'),
        suggestions: generateWellnessIntegrationSuggestions(wellnessGaps),
                  expectedImpact: t('moodAnalytics.moodRecommendations.impacts.wellnessIntegration'),
        confidence: 0.68
      });
    }
    
    return recommendations;
  };

  // Helper functions for dynamic recommendations
  const calculateMoodVolatility = (moodData: any[]) => {
    if (moodData.length < 2) return 0;
    const values = moodData.map(d => d.averageMood);
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
    return Math.sqrt(variance) / 10; // Normalize to 0-1
  };

  const calculateHabitCompletionRate = () => {
    if (!habits || habits.length === 0) return 0;
    const totalCompletions = habits.reduce((sum, habit) => sum + habit.completedDates.length, 0);
    const totalDays = habits.length * 30; // Assume 30 days of tracking
    return Math.min(1, totalCompletions / totalDays);
  };

  const identifyStrugglingHabits = () => {
    if (!habits) return [];
    return habits.filter(habit => habit.streak < 3 && habit.completedDates.length < 5);
  };

  const identifySuccessfulHabits = () => {
    if (!habits) return [];
    return habits.filter(habit => habit.streak >= 7 && habit.completedDates.length >= 10);
  };

  const getMoodHabitCorrelations = () => {
    // This would use the actual correlation data from analytics
    return analytics.insights.moodBoostingHabits || [];
  };

  const identifyWellnessGaps = (): string[] => {
    const gaps: string[] = [];
    const categories = ['physical', 'mental', 'social', 'creative', 'spiritual'];
    
    categories.forEach(category => {
      const categoryHabits = habits?.filter(h => h.category === category) || [];
      if (categoryHabits.length === 0) {
        gaps.push(category);
      }
    });
    
    return gaps;
  };

  const generateMoodStabilitySuggestions = (avgMood: number, volatility: number) => {
    const suggestions = [];
    
    if (avgMood < 5) {
              suggestions.push(t('moodAnalytics.moodRecommendations.suggestions.lowMoodActivities'));
        suggestions.push(t('moodAnalytics.moodRecommendations.suggestions.gratitudePractice'));
    }
    
    if (volatility > 0.5) {
              suggestions.push(t('moodAnalytics.moodRecommendations.suggestions.meditation'));
        suggestions.push(t('moodAnalytics.moodRecommendations.suggestions.breathingExercises'));
    }
    
            suggestions.push(t('moodAnalytics.moodRecommendations.suggestions.consistentSleep'));
    
    return suggestions;
  };

  const generateHabitOptimizationSuggestions = (strugglingHabits: any[]) => {
    const suggestions = [];
    
    if (strugglingHabits.length > 0) {
              suggestions.push(t('moodAnalytics.moodRecommendations.suggestions.simplifyHabits'));
        suggestions.push(t('moodAnalytics.moodRecommendations.suggestions.habitStacking'));
    }
    
            suggestions.push(t('moodAnalytics.moodRecommendations.suggestions.reminders'));
        suggestions.push(t('moodAnalytics.moodRecommendations.suggestions.progressTracking'));
    
    return suggestions;
  };

  const generateMoodHabitSynergySuggestions = (correlations: any[]) => {
    const suggestions = [];
    
    correlations.forEach(correlation => {
      if (correlation.correlation > 0.7) {
        suggestions.push(t('moodAnalytics.moodRecommendations.suggestions.leverageCorrelation', { 
          habit: correlation.habitTitle 
        }));
      }
    });
    
            suggestions.push(t('moodAnalytics.moodRecommendations.suggestions.moodBasedScheduling'));
    
    return suggestions;
  };

  const generateWellnessIntegrationSuggestions = (gaps: string[]) => {
    const suggestions = [];
    
    gaps.forEach(gap => {
              suggestions.push(t(`moodAnalytics.moodRecommendations.suggestions.add${gap.charAt(0).toUpperCase() + gap.slice(1)}Habits`));
    });
    
          suggestions.push(t('moodAnalytics.moodRecommendations.suggestions.balancedRoutine'));
    
    return suggestions;
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return '#FF6B6B';
      case 'medium': return '#FFA726';
      case 'low': return '#66BB6A';
      default: return '#9E9E9E';
    }
  };

  // Feedback handling functions
  const handleFeedbackRequest = (recommendation: any) => {
    setSelectedRecommendation(recommendation);
    setShowFeedbackModal(true);
  };

  const handleFeedbackSubmitted = (feedback: any) => {
    // The feedback is already recorded in the AI service
    // You can add additional analytics here
    setShowFeedbackModal(false);
    setSelectedRecommendation(null);
  };

  const handleFeedbackClose = () => {
    setShowFeedbackModal(false);
    setSelectedRecommendation(null);
  };
  
  const renderComparativePerformance = () => {
    const currentPeriod = analytics.moodTrends.slice(-30);
    const previousPeriod = analytics.moodTrends.slice(-60, -30);
    
    const comparison = {
      avgMood: {
        current: currentPeriod.reduce((sum, t) => sum + t.averageMood, 0) / currentPeriod.length,
        previous: previousPeriod.reduce((sum, t) => sum + t.averageMood, 0) / previousPeriod.length
      },
      habitCompletion: {
        current: streakData.current,
        previous: streakData.longest * 0.8 // Simulated previous period
      },
      moodStability: {
        current: currentPeriod.length > 1 ? 
          1 - (Math.max(...currentPeriod.map(d => d.averageMood)) - Math.min(...currentPeriod.map(d => d.averageMood))) / 10 : 1,
        previous: previousPeriod.length > 1 ? 
          1 - (Math.max(...previousPeriod.map(d => d.averageMood)) - Math.min(...previousPeriod.map(d => d.averageMood))) / 10 : 1
      }
    };
    
  // Around lines 1072 and 1080 - Replace hardcoded period names
const periods = [
  {
    name: t('moodAnalytics.performance.lastThirtyDays'),
    data: {
      avgMood: comparison.avgMood.current,
      habitCompletion: comparison.habitCompletion.current,
      stability: comparison.moodStability.current
    }
  },
  {
    name: t('moodAnalytics.performance.previousThirtyDays'),
    data: {
      avgMood: comparison.avgMood.previous,
      habitCompletion: comparison.habitCompletion.previous,
      stability: comparison.moodStability.previous
    }
  }
];
    
    return (
      <View style={styles.insightCard}>
        <Text style={styles.insightTitle}>{t('moodAnalytics.performance.title')}</Text>
        
        <View style={styles.trendOverviewCard}>
        <Text style={styles.trendOverviewTitle}>{t('moodAnalytics.performance.thirtyDayTrendAnalysis')}</Text>
          <View style={styles.trendMetricsGrid}>
            <View style={styles.trendMetricItem}>
            <Text style={styles.trendMetricLabel}>{t('moodAnalytics.performance.moodImprovement')}</Text>
              <Text style={[styles.trendMetricValue, 
                {color: comparison.avgMood.current > comparison.avgMood.previous ? '#4CAF50' : '#F44336'}]}>
                {comparison.avgMood.current > comparison.avgMood.previous ? '+' : ''}
                {((comparison.avgMood.current - comparison.avgMood.previous) * 10).toFixed(1)}%
              </Text>
            </View>
            
            <View style={styles.trendMetricItem}>
              <Text style={styles.trendMetricLabel}>{t('moodAnalytics.performance.habitProgress')}</Text>
              <Text style={[styles.trendMetricValue,
                {color: comparison.habitCompletion.current > comparison.habitCompletion.previous ? '#4CAF50' : '#F44336'}]}>
                {comparison.habitCompletion.current > comparison.habitCompletion.previous ? '+' : ''}
                {((comparison.habitCompletion.current - comparison.habitCompletion.previous) / comparison.habitCompletion.previous * 100).toFixed(1)}%
              </Text>
            </View>
          </View>
        </View>
        
        {periods.map((period, index) => (
          <View key={index} style={styles.periodComparisonCard}>
            <Text style={styles.periodTitle}>{period.name}</Text>
            <View style={styles.periodMetrics}>
              <View style={styles.periodMetric}>
                <Text style={styles.periodMetricLabel}>{t('moodAnalytics.common.avgMood')}</Text>
                <Text style={styles.periodMetricValue}>{period.data.avgMood.toFixed(1)}/10</Text>
              </View>
              <View style={styles.periodMetric}>
               <Text style={styles.periodMetricLabel}>{t('moodAnalytics.common.habits')}</Text>
               <Text style={styles.periodMetricValue}>{period.data.habitCompletion.toFixed(0)} {t('moodAnalytics.common.days')}</Text>
              </View>
              <View style={styles.periodMetric}>
                <Text style={styles.periodMetricLabel}>{t('moodAnalytics.performance.stability')}</Text>
                <Text style={styles.periodMetricValue}>{(period.data.stability * 100).toFixed(0)}%</Text>
              </View>
            </View>
          </View>
        ))}
      </View>
    );
  };

  // Enhanced Correlations View
  const renderCorrelations = () => {
    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('moodAnalytics.tabs.correlations')}</Text>
        
        {/* Sub-navigation */}
        <View style={styles.subNavContainer}>
          <TouchableOpacity
            style={[styles.subNavButton, correlationsView === 'habits' && styles.activeSubNav]}
            onPress={() => setCorrelationsView('habits')}
          >
            <Text style={[styles.subNavText, correlationsView === 'habits' && { color: currentTheme.colors.background }]}>
              {t('moodAnalytics.correlations.habitAnalysis')}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.subNavButton, correlationsView === 'heatmap' && styles.activeSubNav]}
            onPress={() => setCorrelationsView('heatmap')}
          >
            <Text style={[styles.subNavText, correlationsView === 'heatmap' && { color: currentTheme.colors.background }]}>
              {t('moodAnalytics.correlations.heatMap')}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.subNavButton, correlationsView === 'success' && styles.activeSubNav]}
            onPress={() => setCorrelationsView('success')}
          >
            <Text style={[styles.subNavText, correlationsView === 'success' && { color: currentTheme.colors.background }]}>
              {t('moodAnalytics.correlations.successRates')}
            </Text>
          </TouchableOpacity>
        </View>
        
        {/* Content based on selected sub-view */}
        {correlationsView === 'habits' && renderMoodHabitCorrelations()}
        {correlationsView === 'heatmap' && renderCorrelationHeatMap()}
        {correlationsView === 'success' && renderSuccessRatesByMood()}
      </View>
    );
  };
  
  // Success Rates by Mood Component
  const renderSuccessRatesByMood = () => {
    return renderHabitSuccessByMood();
  };
  
  // Mood-Habit Streak Tracking Component
  const renderStreakTracking = () => {
    const calculateStreaks = () => {
      const streakData: any = {};
      
      if (!habits) return streakData;
      
      habits.forEach(habit => {
        const completedDates = habit.completedDates.sort();
        let currentStreak = 0;
        let longestStreak = 0;
        let tempStreak = 0;
        
        for (let i = 0; i < completedDates.length; i++) {
          const currentDate = new Date(completedDates[i]);
          const prevDate = i > 0 ? new Date(completedDates[i - 1]) : null;
          
          if (prevDate && (currentDate.getTime() - prevDate.getTime()) === 24 * 60 * 60 * 1000) {
            tempStreak++;
          } else {
            tempStreak = 1;
          }
          
          longestStreak = Math.max(longestStreak, tempStreak);
          
          // Check if streak continues to today
          const today = new Date();
          const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
          if (currentDate.toDateString() === today.toDateString() || 
              currentDate.toDateString() === yesterday.toDateString()) {
            currentStreak = tempStreak;
          }
        }
        
        streakData[habit.id] = {
          title: habit.title,
          currentStreak,
          longestStreak,
          totalCompletions: completedDates.length
        };
      });
      
      return streakData;
    };
    
    const streakData = calculateStreaks();
    const topStreaks = Object.values(streakData)
      .sort((a: any, b: any) => b.currentStreak - a.currentStreak)
      .slice(0, 5);
    
    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🔥 {t('moodAnalytics.progress.streakTracking')}</Text>
        
        {/* Current Streaks */}
        <View style={styles.chartCard}>
          <Text style={styles.cardTitle}>{t('moodAnalytics.progress.activeStreaks')}</Text>
          {topStreaks.map((streak: any, index) => (
            <View key={`streak-${index}`} style={styles.streakItem}>
              <View style={styles.streakInfo}>
                <Text style={styles.streakTitle}>{streak.title}</Text>
                <Text style={styles.streakSubtitle}>
                  {t('moodAnalytics.progress.longestCurrent')}: {streak.longestStreak} {t('moodAnalytics.common.days')} • {t('moodAnalytics.common.total')}: {streak.totalCompletions}
                </Text>
              </View>
              <View style={styles.streakBadge}>
                <Text style={styles.streakDays}>{streak.currentStreak}</Text>
                <Text style={styles.streakLabel}>{t('moodAnalytics.common.days')}</Text>
              </View>
            </View>
          ))}
        </View>
        
        {/* Streak Statistics */}
        <View style={styles.streakStatsContainer}>
          <View style={styles.streakStatCard}>
            <Text style={styles.streakStatValue}>
              {Math.max(...Object.values(streakData).map((s: any) => s.currentStreak))}
            </Text>
            <Text style={styles.streakStatLabel}>{t('moodAnalytics.progress.longestCurrent')}</Text>
          </View>
          <View style={styles.streakStatCard}>
            <Text style={styles.streakStatValue}>
              {Math.max(...Object.values(streakData).map((s: any) => s.longestStreak))}
            </Text>
            <Text style={styles.streakStatLabel}>{t('moodAnalytics.progress.allTimeBest')}</Text>
          </View>
          <View style={styles.streakStatCard}>
            <Text style={styles.streakStatValue}>
              {Object.values(streakData).filter((s: any) => s.currentStreak > 0).length}
            </Text>
            <Text style={styles.streakStatLabel}>{t('moodAnalytics.progress.activeStreaksCount')}</Text>
          </View>
        </View>
      </View>
    );
  };

  // Monthly Mood-Wellness Reports Component
  const renderMonthlyReports = () => {
    const generateMonthlyReport = () => {
      const currentDate = new Date();
      const currentMonth = currentDate.getMonth();
      const currentYear = currentDate.getFullYear();
      
      const monthlyData = analytics.moodTrends.filter(trend => {
        const trendDate = new Date(trend.date);
        return trendDate.getMonth() === currentMonth && trendDate.getFullYear() === currentYear;
      });
      
      const avgMood = monthlyData.reduce((sum, day) => sum + day.averageMood, 0) / monthlyData.length;
      const totalHabits = monthlyData.reduce((sum, day) => sum + day.habitsCompleted, 0);
      const avgDailyHabits = totalHabits / monthlyData.length;
      
      const moodDistribution = monthlyData.reduce((acc, day) => {
        const moodRange = day.averageMood >= 8 ? 'excellent' :
                         day.averageMood >= 6 ? 'good' :
                         day.averageMood >= 4 ? 'fair' : 'poor';
        acc[moodRange] = (acc[moodRange] || 0) + 1;
        return acc;
      }, {} as any);
      
      return {
        avgMood,
        totalHabits,
        avgDailyHabits,
        moodDistribution,
        daysTracked: monthlyData.length
      };
    };
    
    const monthlyReport = generateMonthlyReport();
    const currentDate = new Date();
    const monthName = `${getMonthName(currentDate)} ${currentDate.getFullYear()}`;
    
    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('moodAnalytics.reports.monthlyWellnessReport')}</Text>
        <Text style={styles.reportSubtitle}>{monthName}</Text>
        
        {/* Monthly Overview Cards - 2x2 Grid */}
        <View style={styles.reportCardsContainer}>
          {/* First Row */}
          <View style={styles.reportCardRow}>
            <View style={styles.reportCard}>
              <Text style={styles.reportCardIcon}>😊</Text>
              <Text style={styles.reportCardValue}>{monthlyReport.avgMood.toFixed(1)}</Text>
              <Text style={styles.reportCardLabel}>{t('moodAnalytics.reports.averageMood')}</Text>
            </View>
            
            <View style={styles.reportCard}>
              <Text style={styles.reportCardIcon}>✅</Text>
              <Text style={styles.reportCardValue}>{monthlyReport.totalHabits}</Text>
              <Text style={styles.reportCardLabel}>{t('moodAnalytics.reports.habitsCompleted')}</Text>
            </View>
          </View>
          
          {/* Second Row */}
          <View style={styles.reportCardRow}>
            <View style={styles.reportCard}>
              <Text style={styles.reportCardIcon}>📈</Text>
              <Text style={styles.reportCardValue}>{monthlyReport.avgDailyHabits.toFixed(1)}</Text>
              <Text style={styles.reportCardLabel}>{t('moodAnalytics.reports.dailyAverage')}</Text>
            </View>
            
            <View style={styles.reportCard}>
              <Text style={styles.reportCardIcon}>📅</Text>
              <Text style={styles.reportCardValue}>{monthlyReport.daysTracked}</Text>
              <Text style={styles.reportCardLabel}>{t('moodAnalytics.reports.daysTracked')}</Text>
            </View>
          </View>
        </View>
        
        {/* Mood Distribution */}
        <View style={styles.chartCard}>
          <Text style={styles.cardTitle}>{t('moodAnalytics.reports.moodDistributionThisMonth')}</Text>
          <View style={styles.moodDistributionChart}>
            {Object.entries(monthlyReport.moodDistribution).map(([mood, count]) => {
              const percentage = ((count as number) / monthlyReport.daysTracked) * 100;
              return (
                <View key={mood} style={styles.distributionItem}>
                  <View style={styles.distributionBar}>
                    <View 
                      style={[styles.distributionBarFill, {
                        width: `${percentage}%`,
                        backgroundColor: mood === 'excellent' ? currentTheme.colors.success :
                                       mood === 'good' ? '#4CAF50' :
                                       mood === 'fair' ? currentTheme.colors.warning :
                                       currentTheme.colors.error
                      }]}
                    />
                  </View>
                  <Text style={styles.distributionLabel}>{mood}: {count as number} {t('advancedAnalytics.days')} ({percentage.toFixed(0)}%)</Text>
                </View>
              );
            })}
          </View>
        </View>
      </View>
    );
  };

  // Emotional Resilience Scoring Component
  const renderEmotionalResilience = () => {
    const calculateResilienceScore = () => {
      const last30Days = analytics.moodTrends.slice(-30);
      if (last30Days.length === 0) return { score: 0, factors: {} };
      
      // Factor 1: Mood Stability (lower variance = higher resilience)
      const moodValues = last30Days.map(d => d.averageMood);
      const avgMood = moodValues.reduce((sum, mood) => sum + mood, 0) / moodValues.length;
      const variance = moodValues.reduce((sum, mood) => sum + Math.pow(mood - avgMood, 2), 0) / moodValues.length;
      const stabilityScore = Math.max(0, 100 - (variance * 10)); // Lower variance = higher score
      
      // Factor 2: Recovery Rate (how quickly mood improves after low points)
      let recoveryScore = 0;
      let recoveryInstances = 0;
      for (let i = 1; i < last30Days.length - 1; i++) {
        if (last30Days[i].averageMood < 4 && last30Days[i + 1].averageMood > last30Days[i].averageMood) {
          recoveryScore += (last30Days[i + 1].averageMood - last30Days[i].averageMood) * 20;
          recoveryInstances++;
        }
      }
      recoveryScore = recoveryInstances > 0 ? recoveryScore / recoveryInstances : 50;
      
      // Factor 3: Habit Consistency during low moods
      const lowMoodDays = last30Days.filter(d => d.averageMood < 5);
      const avgHabitsOnLowDays = lowMoodDays.length > 0 
        ? lowMoodDays.reduce((sum, day) => sum + day.habitsCompleted, 0) / lowMoodDays.length
        : 0;
      const avgHabitsOverall = last30Days.reduce((sum, day) => sum + day.habitsCompleted, 0) / last30Days.length;
      const consistencyScore = avgHabitsOverall > 0 ? (avgHabitsOnLowDays / avgHabitsOverall) * 100 : 0;
      
      // Factor 4: Overall Mood Trend
      const firstWeek = last30Days.slice(0, 7);
      const lastWeek = last30Days.slice(-7);
      const firstAvg = firstWeek.reduce((sum, day) => sum + day.averageMood, 0) / firstWeek.length;
      const lastAvg = lastWeek.reduce((sum, day) => sum + day.averageMood, 0) / lastWeek.length;
      const trendScore = Math.max(0, Math.min(100, 50 + ((lastAvg - firstAvg) * 10)));
      
      const overallScore = (stabilityScore * 0.3 + recoveryScore * 0.25 + consistencyScore * 0.25 + trendScore * 0.2);
      
      return {
        score: Math.round(overallScore),
        factors: {
          stability: Math.round(stabilityScore),
          recovery: Math.round(recoveryScore),
          consistency: Math.round(consistencyScore),
          trend: Math.round(trendScore)
        }
      };
    };
    
    const resilience = calculateResilienceScore();
    
    const getResilienceLevel = (score: number) => {
      if (score >= 80) return { level: t('moodAnalytics.resilienceLevels.excellent'), color: currentTheme.colors.success, icon: '🛡️' };
      if (score >= 60) return { level: t('moodAnalytics.resilienceLevels.good'), color: '#4CAF50', icon: '💪' };
      if (score >= 40) return { level: t('moodAnalytics.resilienceLevels.moderate'), color: currentTheme.colors.warning, icon: '⚖️' };
      return { level: t('moodAnalytics.resilienceLevels.developing'), color: currentTheme.colors.error, icon: '🌱' };
    };
    
    const resilienceLevel = getResilienceLevel(resilience.score);
    
    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('moodAnalytics.resilience.title')}</Text>
        
        {/* Main Resilience Score */}
        <View style={styles.resilienceMainCard}>
          <Text style={styles.resilienceIcon}>{resilienceLevel.icon}</Text>
          <Text style={styles.resilienceScore}>{resilience.score}</Text>
          <Text style={[styles.resilienceLevel, { color: resilienceLevel.color }]}>
            {resilienceLevel.level}
          </Text>
          <Text style={styles.resilienceSubtext}>{t('moodAnalytics.resilience.emotionalResilienceScore')}</Text>
        </View>
        
        {/* Resilience Factors Breakdown */}
        <View style={styles.chartCard}>
          <Text style={styles.cardTitle}>{t('moodAnalytics.resilience.resilienceFactors')}</Text>
          {Object.entries(resilience.factors).map(([factor, score]) => {
            const factorNames: any = {
              stability: t('moodAnalytics.resilienceFactors.stability'),
              recovery: t('moodAnalytics.resilienceFactors.recovery'),
              consistency: t('moodAnalytics.resilienceFactors.consistency'),
              trend: t('moodAnalytics.resilienceFactors.trend')
            };
            
            return (
              <View key={factor} style={styles.resilienceFactorItem}>
                <View style={styles.resilienceFactorHeader}>
                  <Text style={styles.resilienceFactorName}>{factorNames[factor]}</Text>
                  <Text style={styles.resilienceFactorScore}>{score}/100</Text>
                </View>
                <View style={styles.resilienceFactorBar}>
                  <View 
                    style={[styles.resilienceFactorBarFill, {
                      width: `${score}%`,
                      backgroundColor: score >= 70 ? currentTheme.colors.success :
                                     score >= 50 ? currentTheme.colors.warning :
                                     currentTheme.colors.error
                    }]}
                  />
                </View>
              </View>
            );
          })}
        </View>
        
        {/* Resilience Tips */}
        <View style={styles.resilienceTipsCard}>
          <Text style={styles.cardTitle}>💡 {t('moodAnalytics.resilienceTips.title')}</Text>
          <View style={styles.resilienceTip}>
            <Text style={styles.resilienceTipIcon}>🧘</Text>
            <Text style={styles.resilienceTipText}>{t('moodAnalytics.resilienceTips.mindfulness')}</Text>
          </View>
          <View style={styles.resilienceTip}>
            <Text style={styles.resilienceTipIcon}>🔄</Text>
            <Text style={styles.resilienceTipText}>{t('moodAnalytics.resilienceTips.consistency')}</Text>
          </View>
          <View style={styles.resilienceTip}>
            <Text style={styles.resilienceTipIcon}>📈</Text>
            <Text style={styles.resilienceTipText}>{t('moodAnalytics.resilienceTips.improvement')}</Text>
          </View>
        </View>
      </View>
    );
  };

  // Helper functions for styling
  const getPredictionColor = (rate: number) => {
    if (rate >= 0.8) return currentTheme.colors.success;
    if (rate >= 0.6) return currentTheme.colors.warning;
    return currentTheme.colors.error;
  };
  
  const getRiskColor = (level: string) => {
    switch (level) {
      case 'low': return currentTheme.colors.success;
      case 'medium': return currentTheme.colors.warning;
      case 'high': return currentTheme.colors.error;
      case 'critical': return '#D32F2F';
      default: return currentTheme.colors.textSecondary;
    }
  };
  
  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'high': return currentTheme.colors.error;
      case 'medium': return currentTheme.colors.warning;
      case 'low': return currentTheme.colors.success;
      default: return currentTheme.colors.textSecondary;
    }
  };

  // Define the tab type to match the selectedTab union type
  type TabKey = 'dashboard' | 'analytics' | 'insights' | 'progress' | 'correlations' | 'wellness' | 'reports' | 'calendar';

  // Tab configuration with icons - properly typed
  const tabOptions: { key: TabKey; icon: string; label: string }[] = [
    { key: 'dashboard', icon: '📊', label: t('moodAnalytics.tabs.overview') },
    { key: 'analytics', icon: '📈', label: t('moodAnalytics.tabs.analytics') },
    { key: 'insights', icon: '🤖', label: t('moodAnalytics.tabs.aiInsights') },
    { key: 'progress', icon: '📋', label: t('moodAnalytics.tabs.progress') },
    { key: 'correlations', icon: '🔗', label: t('moodAnalytics.tabs.correlations') },
    { key: 'wellness', icon: '🌟', label: t('moodAnalytics.tabs.wellness') },
    { key: 'reports', icon: '📅', label: t('moodAnalytics.tabs.reports') },
    { key: 'calendar', icon: '🗓️', label: t('moodAnalytics.tabs.calendar') },
  ];
  
  const getTabDisplayName = (tabKey: TabKey) => {
    const tab = tabOptions.find(t => t.key === tabKey);
    return tab ? `${tab.icon} ${tab.label}` : t('moodAnalytics.selectView');
  };
  
  // Enhanced Dashboard View
  const renderDashboard = () => {
    const insights = getTopInsights();
    
    return (
      <View style={styles.section}>
        {/* Hero Stats */}
        <View style={styles.heroContainer}>
          <View style={styles.heroCard}>
          <Text style={styles.heroValue}>{insights.weeklyReport.avgMood}</Text>
          <Text style={styles.heroLabel}>{translate('moodAnalytics.dashboard.averageMood', 'Average Mood')}</Text>
          <Text style={[styles.heroTrend, {
            color: insights.weeklyReport.improvingTrend ? currentTheme.colors.success : currentTheme.colors.warning
          }]}>
            {insights.weeklyReport.improvingTrend ? translate('moodAnalytics.moodImprovement.improving', '📈 Improving') : translate('moodAnalytics.moodImprovement.stable', '📊 Stable')}
          </Text>
        </View>
        
        <View style={styles.heroCard}>
          <Text style={styles.heroValue}>{insights.weeklyReport.totalHabits}</Text>
                      <Text style={styles.heroLabel}>{t('moodAnalytics.dashboard.habitsThisWeek')}</Text>
          <Text style={styles.heroSubtext}>{t('moodAnalytics.dashboard.keepItUp')}</Text>
        </View>
        </View>
        
        {/* Quick Insights */}
        <View style={styles.quickInsightsContainer}>
          <Text style={styles.sectionTitle}>{translate('moodAnalytics.quickInsights.title', 'Quick Insights')}</Text>
        
        <View style={styles.insightRow}>
          <View style={[styles.miniCard, { backgroundColor: currentTheme.colors.success + '20' }]}>
            <Text style={styles.miniCardIcon}>🎯</Text>
            <Text style={styles.miniCardTitle}>{translate('moodAnalytics.quickInsights.bestMood', 'Best Mood')}</Text>
           <Text style={[styles.miniCardValue, { color: currentTheme.colors.success }]}>
  {t(`moodCheckIn.moodTags.${insights.bestMoodState}`)}
</Text>
          </View>
          
          <View style={[styles.miniCard, { backgroundColor: currentTheme.colors.warning + '20' }]}>
            <Text style={styles.miniCardIcon}>⚠️</Text>
            <Text style={styles.miniCardTitle}>{translate('moodAnalytics.quickInsights.watchOut', 'Watch Out')}</Text>
            <Text style={[styles.miniCardValue, { color: currentTheme.colors.warning }]}>
  {t(`moodCheckIn.moodTags.${insights.challengingMood}`)}
</Text>
          </View>
        </View>
        </View>
        
        {/* Top Mood Boosters */}
        <View style={styles.boostersContainer}>
          <Text style={styles.sectionTitle}>{t('moodAnalytics.topMoodBoosters.title')}</Text>
        {insights.topMoodBoosters.map((habit, index) => (
          <View key={habit.habitId} style={styles.boosterCard}>
            <View style={styles.boosterRank}>
              <Text style={styles.rankText}>{index + 1}</Text>
            </View>
            <View style={styles.boosterInfo}>
              <Text style={styles.boosterTitle}>{habit.habitTitle}</Text>
              <Text style={styles.boosterImpact}>
                {t('moodAnalytics.dashboard.moodBoost', { boost: habit.moodImprovement.toFixed(1) })}
              </Text>
            </View>
            <View style={styles.boosterStats}>
              <Text style={styles.boosterRate}>{habit.completionRate.toFixed(0)}%</Text>
              <Text style={styles.boosterLabel}>{t('common.success')}</Text>
            </View>
          </View>
        ))}
        </View>
        
        {/* Weekly Mood Chart */}
        <View style={styles.chartContainer}>
         <Text style={styles.sectionTitle}>{t('moodAnalytics.dashboard.thisWeeksMood')}</Text>
        <View style={styles.weeklyChart}>
          {insights.weeklyReport.weeklyData.map((day, index) => {
            const date = new Date(day.date);
            // Fix: Create a more comprehensive locale mapping
            const getLocale = (languageCode: string) => {
              switch (languageCode) {
                case 'zh': return 'zh-CN';
                case 'es': return 'es-ES';
                case 'fr': return 'fr-FR';
                case 'en': return 'en-US';
                default: return 'en-US';
              }
            };
            
            const getMoodColor = (mood: number) => {
              if (mood >= 8) return currentTheme.colors.success;
              if (mood >= 6) return '#4CAF50';
              if (mood >= 4) return currentTheme.colors.warning;
              if (mood >= 2) return '#FF9800';
              return currentTheme.colors.error;
            };
            
           const dayNames = [t('sun'), t('mon'), t('tue'), t('wed'), t('thu'), t('fri'), t('sat')];
const dayName = dayNames[date.getDay()];
            const moodHeight = (day.averageMood / 10) * 100;
            
            return (
              <View key={index} style={styles.chartDay}>
                <View style={styles.chartBar}>
                  <View style={[
                    styles.chartFill,
                    {
                      height: `${moodHeight}%`,
                      backgroundColor: getMoodColor(day.averageMood)
                    }
                  ]} />
                </View>
                <Text style={styles.chartValue}>{day.averageMood.toFixed(1)}</Text>
                <Text style={styles.chartLabel}>{dayName}</Text>
              </View>
            );
          })}
        </View>
        </View>
      </View>
    );
  };
  
  // Enhanced Analytics View with sub-navigation
 // Replace the analytics sub-navigation around line 1600
const renderAnalytics = () => {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{t('moodAnalytics.analytics.title')}</Text>
      
      {/* Sub-navigation */}
      <View style={styles.subNavContainer}>
        <TouchableOpacity 
          style={[styles.subNavButton, analyticsView === 'trends' && styles.activeSubNav]}
          onPress={() => setAnalyticsView('trends')}
        >
          <Text style={styles.subNavText}>{t('moodAnalytics.subTabs.trends')}</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.subNavButton, analyticsView === 'success-rates' && styles.activeSubNav]}
          onPress={() => setAnalyticsView('success-rates')}
        >
          <Text style={styles.subNavText}>{t('moodAnalytics.subTabs.successRates')}</Text>
        </TouchableOpacity>
      <TouchableOpacity 
  style={[styles.subNavButton, analyticsView === 'distribution' && styles.activeSubNav]}
  onPress={() => setAnalyticsView('distribution')}
>
  <Text style={styles.subNavText}>{t('moodAnalytics.analytics.distribution')}</Text>
</TouchableOpacity>
        <TouchableOpacity 
          style={[styles.subNavButton, analyticsView === 'compare' && styles.activeSubNav]}
          onPress={() => setAnalyticsView('compare')}
        >
          <Text style={styles.subNavText}>{t('moodAnalytics.analytics.compare')}</Text>
        </TouchableOpacity>
      </View>
      
      {/* Render content based on selected view */}
      {analyticsView === 'trends' && renderEmotionalWellnessTrends()}
      {analyticsView === 'success-rates' && renderSuccessRateCharts()}
      {analyticsView === 'distribution' && renderMoodDistributionChart()}
      {analyticsView === 'compare' && renderComparativePerformance()}
    </View>
  );
};

  // Enhanced Progress View
  const renderProgress = () => {
    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('moodAnalytics.tabs.progress')}</Text>
        
        {/* Sub-navigation */}
        <View style={styles.subNavContainer}>
          <TouchableOpacity
            style={[styles.subNavButton, progressView === 'tracking' && styles.activeSubNav]}
            onPress={() => setProgressView('tracking')}
          >
            <Text style={[styles.subNavText, progressView === 'tracking' && { color: currentTheme.colors.background }]}>
              {t('moodAnalytics.progress.streakTracking')}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.subNavButton, progressView === 'improvement' && styles.activeSubNav]}
            onPress={() => setProgressView('improvement')}
          >
            <Text style={[styles.subNavText, progressView === 'improvement' && { color: currentTheme.colors.background }]}>
              {t('moodAnalytics.progress.improvement')}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.subNavButton, progressView === 'performance' && styles.activeSubNav]}
            onPress={() => setProgressView('performance')}
          >
            <Text style={[styles.subNavText, progressView === 'performance' && { color: currentTheme.colors.background }]}>
              {t('moodAnalytics.progress.performance')}
            </Text>
          </TouchableOpacity>
        </View>
        
        {/* Content based on selected sub-view */}
        {progressView === 'tracking' && renderStreakTracking()}
        {progressView === 'improvement' && renderMoodImprovementGraphs()}
        {progressView === 'performance' && renderHabitSuccessByMood()}
      </View>
    );
  };
  
  // Enhanced Insights View
  const renderInsights = () => {
    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('moodAnalytics.smartInsights.title')}</Text>
        
        {/* Sub-navigation */}
        <View style={styles.subNavContainer}>
          <TouchableOpacity
            style={[styles.subNavButton, insightsView === 'smart' && styles.activeSubNav]}
            onPress={() => setInsightsView('smart')}
          >
            <Text style={[styles.subNavText, insightsView === 'smart' && { color: currentTheme.colors.background }]}>
              {t('moodAnalytics.insights.smartInsights')}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.subNavButton, insightsView === 'ai' && styles.activeSubNav]}
            onPress={() => setInsightsView('ai')}
          >
            <Text style={[styles.subNavText, insightsView === 'ai' && { color: currentTheme.colors.background }]}>
              {t('moodAnalytics.insights.aiAnalysis')}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.subNavButton, insightsView === 'recommendations' && styles.activeSubNav]}
            onPress={() => setInsightsView('recommendations')}
          >
            <Text style={[styles.subNavText, insightsView === 'recommendations' && { color: currentTheme.colors.background }]}>
              {t('moodAnalytics.insights.recommendations')}
            </Text>
          </TouchableOpacity>
        </View>
        
        {/* Content based on selected sub-view */}
        {insightsView === 'smart' && renderSmartInsights()}
        {insightsView === 'ai' && renderAIInsights()}
        {insightsView === 'recommendations' && renderPersonalizedRecommendations()}
      </View>
    );
  };
  
  // Smart Insights View
  const renderSmartInsights = () => {
    const successRates = correlations
      .flatMap(c => c.successfulMoods)
      .reduce((acc, mood) => {
        if (!acc[mood.moodState]) {
          acc[mood.moodState] = { total: 0, rate: 0, count: 0 };
        }
        acc[mood.moodState].rate += mood.successRate;
        acc[mood.moodState].count += 1;
        return acc;
      }, {} as any);
    
    const avgSuccessRates = Object.entries(successRates)
      .map(([mood, data]: [string, any]) => ({
        mood,
        rate: data.rate / data.count
      }))
      .sort((a, b) => b.rate - a.rate);
    
    return (
      <View>
        {/* Mood Success Analysis */}
        <View style={styles.analysisCard}>
          <Text style={styles.cardTitle}>{t('moodAnalytics.smartInsights.successByMoodState.title')}</Text>
          <Text style={styles.cardSubtitle}>{t('moodAnalytics.smartInsights.successByMoodState.subtitle')}</Text>
          
          {avgSuccessRates.slice(0, 5).map((item, index) => (
            <View key={index} style={styles.progressItem}>
              <View style={styles.progressHeader}>
                <Text style={styles.progressLabel}>{item.mood}</Text>
                <Text style={styles.progressValue}>{item.rate.toFixed(1)}%</Text>
              </View>
              <View style={styles.progressBarContainer}>
                <View style={[
                  styles.progressBar,
                  {
                    width: `${item.rate}%`,
                    backgroundColor: item.rate > 70 ? currentTheme.colors.success :
                                   item.rate > 50 ? currentTheme.colors.warning :
                                   currentTheme.colors.error
                  }
                ]} />
              </View>
            </View>
          ))}
        </View>
        
        {/* Personalized Recommendations */}
        <View style={styles.recommendationCard}>
         <Text style={styles.cardTitle}>{t('moodAnalytics.smartInsights.personalizedTips.title')}</Text>
          <View style={styles.tipContainer}>
            <View style={styles.tip}>
              <Text style={styles.tipIcon}>🌟</Text>
              <View style={styles.tipContent}>
                   <Text style={styles.tipTitle}>{t('moodAnalytics.smartInsights.personalizedTips.optimalTiming')}</Text>
                <Text style={styles.tipText}>
                  {t('moodAnalytics.smartInsights.personalizedTips.successfulWhenFeeling', { feeling: t(`moodCheckIn.moodTags.${analytics.insights.bestMoodForHabits}`) })}
                </Text>
              </View>
            </View>
            
            <View style={styles.tip}>
              <Text style={styles.tipIcon}>⚡</Text>
              <View style={styles.tipContent}>
                <Text style={styles.tipTitle}>{t('moodAnalytics.smartInsights.personalizedTips.moodBoosters')}</Text>
                <Text style={styles.tipText}>
                  {t('moodAnalytics.smartInsights.personalizedTips.tryToImproveMood', { habits: analytics.insights.moodBoostingHabits.slice(0, 2).join(' 或 ') })}
                </Text>
              </View>
            </View>
          </View>
        </View>
        
        {renderMonthlyEmotionalPatterns()}
        {renderMoodHabitCorrelations()}
      </View>
    );
  };
  
  // Enhanced Trends View
  const renderTrends = () => {
    const last30Days = analytics.moodTrends.slice(-30);
    const weeklyAverages = [];
    
    for (let i = 0; i < last30Days.length; i += 7) {
      const week = last30Days.slice(i, i + 7);
      const avgMood = week.reduce((sum, day) => sum + day.averageMood, 0) / week.length;
      const totalHabits = week.reduce((sum, day) => sum + day.habitsCompleted, 0);
      weeklyAverages.push({ avgMood, totalHabits, week: Math.floor(i / 7) + 1 });
    }
    
    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('moodAnalytics.trends.title')}</Text>
        
        {/* Trend Summary */}
        <View style={styles.trendSummaryCard}>
          <Text style={styles.cardTitle}>{t('moodAnalytics.trends.thirtyDayOverview')}</Text>
          <View style={styles.trendStats}>
            <View style={styles.trendStat}>
              <Text style={styles.trendStatValue}>
                {(last30Days.reduce((sum, day) => sum + day.averageMood, 0) / last30Days.length).toFixed(1)}
              </Text>
              <Text style={styles.trendStatLabel}>{t('moodAnalytics.trends.avgMood')}</Text>
            </View>
            <View style={styles.trendStat}>
              <Text style={styles.trendStatValue}>
                {last30Days.reduce((sum, day) => sum + day.habitsCompleted, 0)}
              </Text>
              <Text style={styles.trendStatLabel}>{t('moodAnalytics.trends.totalHabits')}</Text>
            </View>
          </View>
        </View>
        
        {/* Weekly Breakdown */}
        <View style={styles.weeklyBreakdownCard}>
          <Text style={styles.cardTitle}>{t('moodAnalytics.trends.weeklyBreakdown')}</Text>
          {weeklyAverages.map((week, index) => (
            <View key={index} style={styles.weekItem}>
              <Text style={styles.weekLabel}>{t('moodAnalytics.trends.week')} {week.week}</Text>
              <View style={styles.weekStats}>
                <View style={styles.weekStat}>
                  <Text style={styles.weekStatValue}>{week.avgMood.toFixed(1)}</Text>
                  <Text style={styles.weekStatLabel}>{t('moodAnalytics.trends.mood')}</Text>
                </View>
                <View style={styles.weekStat}>
                  <Text style={styles.weekStatValue}>{week.totalHabits}</Text>
                  <Text style={styles.weekStatLabel}>{t('moodAnalytics.trends.habits')}</Text>
                </View>
              </View>
            </View>
          ))}
        </View>
      </View>
    );
  };
  
  // Enhanced Habits View
  const renderHabits = () => {
    if (!habits || habits.length === 0) {
      return (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('moodAnalytics.habits.analytics')}</Text>
          <View style={styles.analysisCard}>
            <Text style={styles.cardTitle}>{t('moodAnalytics.habits.noHabitsFound')}</Text>
                          <Text style={styles.cardSubtitle}>{t('moodAnalytics.habits.startTrackingHabits')}</Text>
          </View>
        </View>
      );
    }

    const habitStats = habits.map(habit => {
      const completedDates = habit.completedDates || [];
      const totalDays = Math.max(1, Math.floor((Date.now() - new Date(habit.createdAt || Date.now()).getTime()) / (1000 * 60 * 60 * 24)));
      const completionRate = (completedDates.length / totalDays) * 100;
      
      return {
        ...habit,
        completionRate: Math.min(100, completionRate),
        totalCompletions: completedDates.length,
        streak: habit.streak || 0
      };
    }).sort((a, b) => b.completionRate - a.completionRate);

    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('moodAnalytics.habits.analytics')}</Text>
        
        {/* Habit Performance Overview */}
        <View style={styles.analysisCard}>
          <Text style={styles.cardTitle}>{t('moodAnalytics.habits.performanceOverview')}</Text>
                      <Text style={styles.cardSubtitle}>{t('moodAnalytics.habits.habitsRankedByCompletion')}</Text>
          
          {habitStats.slice(0, 5).map((habit, index) => (
            <View key={habit.id} style={styles.habitAnalysisCard}>
              <View style={styles.habitHeader}>
                <Text style={styles.habitTitle}>{habit.title}</Text>
                <View style={styles.habitScore}>
                  <Text style={[styles.scoreValue, { 
                    color: habit.completionRate >= 80 ? currentTheme.colors.success : 
                           habit.completionRate >= 60 ? currentTheme.colors.warning : 
                           currentTheme.colors.error 
                  }]}>
                    {habit.completionRate.toFixed(0)}%
                  </Text>
                  <Text style={styles.scoreLabel}>{t('moodAnalytics.common.success')}</Text>
                </View>
              </View>
              
              <View style={styles.habitMetrics}>
                <View style={styles.metric}>
                  <Text style={styles.metricValue}>{habit.totalCompletions}</Text>
                  <Text style={styles.metricLabel}>{t('moodAnalytics.habits.completions')}</Text>
                </View>
                <View style={styles.metric}>
                  <Text style={styles.metricValue}>{habit.streak}</Text>
                  <Text style={styles.metricLabel}>{t('moodAnalytics.habits.currentStreak')}</Text>
                </View>
                <View style={styles.metric}>
                  <Text style={styles.metricValue}>#{index + 1}</Text>
                  <Text style={styles.metricLabel}>{t('moodAnalytics.habits.rank')}</Text>
                </View>
              </View>
              
              {/* Progress Bar */}
              <View style={styles.progressItem}>
                <View style={styles.progressBarContainer}>
                  <View style={[
                    styles.progressBar, 
                    { 
                      width: `${habit.completionRate}%`,
                      backgroundColor: habit.completionRate >= 80 ? currentTheme.colors.success : 
                                     habit.completionRate >= 60 ? currentTheme.colors.warning : 
                                     currentTheme.colors.error
                    }
                  ]} />
                </View>
              </View>
            </View>
          ))}
        </View>
        
        {/* Quick Stats */}
        <View style={styles.analysisCard}>
          <Text style={styles.cardTitle}>{t('moodAnalytics.habits.quickStats')}</Text>
          <View style={styles.habitMetrics}>
            <View style={styles.metric}>
              <Text style={styles.metricValue}>{habits.length}</Text>
              <Text style={styles.metricLabel}>{t('moodAnalytics.habits.totalHabits')}</Text>
            </View>
            <View style={styles.metric}>
              <Text style={styles.metricValue}>
                {habitStats.filter(h => h.completionRate >= 80).length}
              </Text>
              <Text style={styles.metricLabel}>{t('moodAnalytics.habits.highPerformers')}</Text>
            </View>
            <View style={styles.metric}>
              <Text style={styles.metricValue}>
                {(habitStats.reduce((sum, h) => sum + h.completionRate, 0) / habits.length).toFixed(0)}%
              </Text>
              <Text style={styles.metricLabel}>{t('moodAnalytics.habits.averageRate')}</Text>
            </View>
          </View>
        </View>
      </View>
    );
  };
  
  // Mood Calendar Component
  const renderMoodCalendar = () => {
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();
    
    const calendarDays = [];
    
    // Empty cells for days before month starts
    for (let i = 0; i < firstDayOfMonth; i++) {
      calendarDays.push(null);
    }
    
    // Days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(currentYear, currentMonth, day);
      const dayData = analytics.moodTrends.find(trend => 
        new Date(trend.date).toDateString() === date.toDateString()
      );
      calendarDays.push({ day, data: dayData });
    }
    
    const getMoodColor = (mood: number) => {
      if (mood >= 8) return currentTheme.colors.success;
      if (mood >= 6) return '#4CAF50';
      if (mood >= 4) return currentTheme.colors.warning;
      if (mood >= 2) return '#FF9800';
      return currentTheme.colors.error;
    };
    
    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('moodAnalytics.calendar.title')}</Text>
        <View style={styles.calendarContainer}>
          <View style={styles.calendarHeader}>
            <Text style={styles.monthTitle}>
              {getMonthName(new Date(currentYear, currentMonth))} {currentYear}
            </Text>
          </View>
          
          {/* Day labels */}
          <View style={styles.dayLabelsRow}>
           {[t('sun'), t('mon'), t('tue'), t('wed'), t('thu'), t('fri'), t('sat')].map(day => (
              <Text key={day} style={styles.dayLabel}>{day}</Text>
            ))}
          </View>
          
          {/* Calendar grid */}
          <View style={styles.calendarGrid}>
            {calendarDays.map((dayInfo, index) => {
              if (!dayInfo) {
                return <View key={`empty-${index}`} style={styles.emptyDay} />;
              }
              
              const { day, data } = dayInfo;
              const moodColor = data ? getMoodColor(data.averageMood) : currentTheme.colors.border;
              const habitCount = data ? data.habitsCompleted : 0;
              
              return (
                <View key={`day-${day}`} style={[styles.calendarDay, { backgroundColor: moodColor + '20' }]}>
                  <Text style={[styles.dayNumber, { color: moodColor }]}>{day}</Text>
                  {habitCount > 0 && (
                    <View style={[styles.habitIndicator, { backgroundColor: moodColor }]}>
                      <Text style={styles.habitCount}>{habitCount}</Text>
                    </View>
                  )}
                </View>
              );
            })}
          </View>
          
          {/* Legend */}
          <View style={styles.calendarLegend}>
            <Text style={styles.legendTitle}>{t('moodAnalytics.calendar.moodScale')}</Text>
            <View style={styles.legendRow}>
              <View style={styles.legendItem}>
                <View style={[styles.legendColor, { backgroundColor: currentTheme.colors.success }]} />
                <Text style={styles.legendText}>{t('moodAnalytics.calendar.excellent')}</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendColor, { backgroundColor: currentTheme.colors.warning }]} />
                <Text style={styles.legendText}>{t('moodAnalytics.calendar.good')}</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendColor, { backgroundColor: currentTheme.colors.error }]} />
                <Text style={styles.legendText}>{t('moodAnalytics.calendar.poor')}</Text>
              </View>
            </View>
          </View>
        </View>
      </View>
    );
  };
  
  // Success Rate Charts Component
  const renderSuccessRateCharts = () => {
    const correlations = getHabitMoodCorrelations();
    const last7Days = analytics.moodTrends.slice(-7);
    
    return (
      <View style={styles.section}>
       <Text style={styles.sectionTitle}>{t('moodAnalytics.successRateAnalysis.title')}</Text>
        
        {/* Weekly Success Rate Chart */}
        <View style={styles.chartCard}>
         <Text style={styles.cardTitle}>{t('moodAnalytics.successRateAnalysis.weeklySuccessRates')}</Text>
          <View style={styles.weeklySuccessChart}>
            {last7Days.map((day, index) => {
              const totalHabits = day.habitsCompleted + day.habitsSkipped;
              const successRate = (day.habitsCompleted / Math.max(totalHabits, 1)) * 100;
              const dayNames = [t('sun'), t('mon'), t('tue'), t('wed'), t('thu'), t('fri'), t('sat')];
const dayName = dayNames[new Date(day.date).getDay()];
              
              return (
                <View key={index} style={styles.successChartDay}>
                  <View style={styles.successChartBar}>
                    <View 
                      style={[
                        styles.successChartFill,
                        {
                          height: `${successRate}%`,
                          backgroundColor: successRate > 70 ? currentTheme.colors.success :
                                         successRate > 40 ? currentTheme.colors.warning :
                                         currentTheme.colors.error
                        }
                      ]} 
                    />
                  </View>
                  <Text style={styles.successChartValue}>{Math.round(successRate)}%</Text>
                  <Text style={styles.successChartLabel}>{dayName}</Text>
                </View>
              );
            })}
          </View>
        </View>
        
        {/* Habit-specific Success Rates */}
        <View style={styles.chartCard}>
         <Text style={styles.cardTitle}>{t('moodAnalytics.successRateAnalysis.weeklySuccessRates')}</Text>
          {correlations.slice(0, 5).map(habit => (
            <View key={habit.habitId} style={styles.habitSuccessItem}>
              <View style={styles.habitSuccessHeader}>
                <Text style={styles.habitSuccessTitle}>{habit.habitTitle}</Text>
                <Text style={styles.habitSuccessRate}>{Math.round(habit.completionRate)}%</Text>
              </View>
              <View style={styles.habitSuccessBarContainer}>
                <View 
                  style={[
                    styles.habitSuccessBar,
                    {
                      width: `${habit.completionRate}%`,
                      backgroundColor: habit.completionRate > 70 ? currentTheme.colors.success :
                                     habit.completionRate > 40 ? currentTheme.colors.warning :
                                     currentTheme.colors.error
                    }
                  ]} 
                />
              </View>
            </View>
          ))}
        </View>
      </View>
    );
  };
  
  // Emotional Wellness Trend Lines Component
  const renderEmotionalWellnessTrends = () => {
    const last30Days = analytics.moodTrends.slice(-30);
    const maxMood = Math.max(...last30Days.map(d => d.averageMood));
    const minMood = Math.min(...last30Days.map(d => d.averageMood));
    
    const getTrendDirection = () => {
      const firstWeek = last30Days.slice(0, 7);
      const lastWeek = last30Days.slice(-7);
      const firstAvg = firstWeek.reduce((sum, day) => sum + day.averageMood, 0) / firstWeek.length;
      const lastAvg = lastWeek.reduce((sum, day) => sum + day.averageMood, 0) / lastWeek.length;
      return lastAvg > firstAvg ? 'improving' : lastAvg < firstAvg ? 'declining' : 'stable';
    };
    
    const trendDirection = getTrendDirection();
    
    return (
      <View style={styles.section}>
       <Text style={styles.sectionTitle}>{t('moodAnalytics.emotionalWellnessTrends.title')}</Text>
        
        {/* Trend Summary */}
        <View style={styles.trendSummaryCard}>
          <View style={styles.trendSummaryHeader}>
            <Text style={styles.cardTitle}>{t('moodAnalytics.emotionalWellnessTrends.thirtyDayMoodTrend')}</Text>
            <View style={[
              styles.trendBadge,
              {
                backgroundColor: trendDirection === 'improving' ? currentTheme.colors.success :
                               trendDirection === 'declining' ? currentTheme.colors.error :
                               currentTheme.colors.warning
              }
            ]}>
            <Text style={styles.trendBadgeText}>
  {trendDirection === 'improving' ? t('moodAnalytics.emotionalWellnessTrends.improving') :
   trendDirection === 'declining' ? t('moodAnalytics.emotionalWellnessTrends.declining') :
   t('moodAnalytics.emotionalWellnessTrends.stable')}
</Text>
            </View>
          </View>
          
          {/* Trend Line Chart */}
          <View style={styles.trendLineContainer}>
            <View style={styles.trendLineChart}>
              {last30Days.map((day, index) => {
                const normalizedHeight = ((day.averageMood - minMood) / (maxMood - minMood)) * 100;
                const isWeekend = new Date(day.date).getDay() === 0 || new Date(day.date).getDay() === 6;
                
                return (
                  <View key={index} style={styles.trendPoint}>
                    <View 
                      style={[
                        styles.trendDot,
                        {
                          bottom: `${normalizedHeight}%`,
                          backgroundColor: isWeekend ? currentTheme.colors.warning : currentTheme.colors.primary
                        }
                      ]} 
                    />
                    {index > 0 && (
                      <View 
                        style={[
                          styles.trendLine,
                          {
                            height: Math.abs(normalizedHeight - (((last30Days[index-1].averageMood - minMood) / (maxMood - minMood)) * 100)),
                            bottom: `${Math.min(normalizedHeight, ((last30Days[index-1].averageMood - minMood) / (maxMood - minMood)) * 100)}%`
                          }
                        ]} 
                      />
                    )}
                  </View>
                );
              })}
            </View>
            
            {/* Y-axis labels */}
            <View style={styles.yAxisLabels}>
              <Text style={styles.yAxisLabel}>{maxMood.toFixed(1)}</Text>
              <Text style={styles.yAxisLabel}>{((maxMood + minMood) / 2).toFixed(1)}</Text>
              <Text style={styles.yAxisLabel}>{minMood.toFixed(1)}</Text>
            </View>
          </View>
          
          {/* Trend Statistics */}
          <View style={styles.trendStats}>
            <View style={styles.trendStat}>
              <Text style={styles.trendStatValue}>{(last30Days.reduce((sum, day) => sum + day.averageMood, 0) / last30Days.length).toFixed(1)}</Text>
              <Text style={styles.trendStatLabel}>{t('moodAnalytics.emotionalWellnessTrends.averageMood')}</Text>
            </View>
            <View style={styles.trendStat}>
              <Text style={styles.trendStatValue}>{maxMood.toFixed(1)}</Text>
             <Text style={styles.trendStatLabel}>{t('moodAnalytics.emotionalWellnessTrends.peakMood')}</Text>
            </View>
            <View style={styles.trendStat}>
              <Text style={styles.trendStatValue}>{minMood.toFixed(1)}</Text>
              <Text style={styles.trendStatLabel}>{t('moodAnalytics.emotionalWellnessTrends.lowestMood')}</Text>
            </View>
          </View>
        </View>
      </View>
    );
  };
  
  // Mood Distribution Chart Component
  const renderMoodDistributionChart = () => {
    return renderMoodDistribution();
  };
  
  // Mood Distribution Pie Chart Component
  const renderMoodDistribution = () => {
    const moodCounts = analytics.moodTrends.reduce((acc, day) => {
      const moodCategory = day.averageMood >= 8 ? t('moodAnalytics.moodDistribution.categories.excellent') :
                          day.averageMood >= 6 ? t('moodAnalytics.moodDistribution.categories.good') :
                          day.averageMood >= 4 ? t('moodAnalytics.moodDistribution.categories.neutral') :
                          day.averageMood >= 2 ? t('moodAnalytics.moodDistribution.categories.poor') : 
                          t('moodAnalytics.moodDistribution.categories.veryPoor');
        acc[moodCategory] = (acc[moodCategory] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      
      const total = Object.values(moodCounts).reduce((sum, count) => sum + count, 0);
      const moodData = Object.entries(moodCounts).map(([mood, count]) => ({
        mood,
        count,
        percentage: (count / total) * 100
      }));
      
      const colors = {
    [t('moodAnalytics.moodDistribution.categories.excellent')]: currentTheme.colors.success,
    [t('moodAnalytics.moodDistribution.categories.good')]: '#4CAF50',
    [t('moodAnalytics.moodDistribution.categories.neutral')]: currentTheme.colors.warning,
    [t('moodAnalytics.moodDistribution.categories.poor')]: '#FF9800',
    [t('moodAnalytics.moodDistribution.categories.veryPoor')]: currentTheme.colors.error
  };
      
      let cumulativeAngle = 0;
      
      return (
        <View style={styles.section}>
         <Text style={styles.sectionTitle}>{t('moodAnalytics.moodDistribution.title')}</Text>
          
          <View style={styles.pieChartCard}>
          <Text style={styles.cardTitle}>{t('moodAnalytics.moodDistribution.lastThirtyDays')}</Text>
          
          <View style={styles.pieChartContainer}>
            {/* Pie Chart */}
            <View style={styles.pieChart}>
              {moodData.map((item, index) => {
                const angle = (item.percentage / 100) * 360;
                const startAngle = cumulativeAngle;
                cumulativeAngle += angle;
                
                return (
                  <View 
                    key={item.mood}
                    style={[
                      styles.pieSlice,
                      {
                        backgroundColor: colors[item.mood as keyof typeof colors],
                        transform: [
                          { rotate: `${startAngle}deg` }
                        ]
                      }
                    ]}
                  />
                );
              })}
              
              {/* Center circle */}
              <View style={styles.pieChartCenter}>
               <Text style={styles.pieChartCenterText}>{t('moodAnalytics.moodDistribution.mood')}</Text>
<Text style={styles.pieChartCenterSubtext}>{t('moodAnalytics.moodDistribution.distribution')}</Text>
              </View>
            </View>
            
            {/* Legend */}
            <View style={styles.pieChartLegend}>
              {moodData.map(item => (
                <View key={item.mood} style={styles.pieChartLegendItem}>
                  <View 
                    style={[
                      styles.pieChartLegendColor,
                      { backgroundColor: colors[item.mood as keyof typeof colors] }
                    ]} 
                  />
                  <Text style={styles.pieChartLegendText}>{item.mood}</Text>
                  <Text style={styles.pieChartLegendPercentage}>{item.percentage.toFixed(1)}%</Text>
                </View>
              ))}
            </View>
          </View>
          
          {/* Summary Stats */}
          <View style={styles.pieChartStats}>
            <View style={styles.pieChartStat}>
              <Text style={styles.pieChartStatValue}>{total}</Text>
             <Text style={styles.pieChartStatLabel}>{t('moodAnalytics.moodDistribution.totalDays')}</Text>
            </View>
            <View style={styles.pieChartStat}>
              <Text style={styles.pieChartStatValue}>
                {moodData.find(item => item.mood === t('moodAnalytics.moodDistribution.categories.excellent'))?.count || 0}
              </Text>
             <Text style={styles.pieChartStatLabel}>{t('moodAnalytics.moodDistribution.excellentDays')}</Text>
            </View>
            <View style={styles.pieChartStat}>
                            <Text style={styles.pieChartStatValue}>
                {((moodData.find(item => item.mood === t('moodAnalytics.moodDistribution.categories.excellent'))?.count || 0) +
                  (moodData.find(item => item.mood === t('moodAnalytics.moodDistribution.categories.good'))?.count || 0))}
              </Text>
              <Text style={styles.pieChartStatLabel}>{t('moodAnalytics.moodDistribution.goodPlusDays')}</Text>
            </View>
          </View>
        </View>
      </View>
    );
  };
  
  // Correlation Heat Map Component
  const renderCorrelationHeatMap = () => {
    const correlations = getHabitMoodCorrelations();
    const moodStates = ['happy', 'calm', 'energetic', 'tired', 'stressed', 'anxious', 'sad'];
    
    // Helper function to get translated mood states
    const getTranslatedMoodStates = () => moodStates.map(mood => ({
      key: mood,
      label: t(`moodCheckIn.moodTags.${mood}`)
    }));
    
    const getCorrelationColor = (correlation: number) => {
      const intensity = Math.abs(correlation);
      if (correlation > 0) {
        return `rgba(76, 175, 80, ${intensity})`; // Green for positive correlation
      } else {
        return `rgba(244, 67, 54, ${intensity})`; // Red for negative correlation
      }
    };
    
    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('moodAnalytics.correlationHeatMap.title')}</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.heatMapContainer}>
            {/* Header row with mood states */}
            <View style={styles.heatMapRow}>
              <View style={styles.heatMapCell} />
              {getTranslatedMoodStates().map(({ key, label }) => (
                <View key={key} style={styles.heatMapHeaderCell}>
                  <Text style={styles.heatMapHeaderText}>{label}</Text>
                </View>
              ))}
            </View>
            
            {/* Data rows */}
            {correlations.slice(0, 8).map(habit => (
              <View key={habit.habitId} style={styles.heatMapRow}>
                <View style={styles.heatMapLabelCell}>
                  <Text style={styles.heatMapLabelText}>{habit.habitTitle}</Text>
                </View>
                {getTranslatedMoodStates().map(({ key }) => {
                  const moodData = habit.successfulMoods.find(m => m.moodState === key);
                  const correlation = moodData ? (moodData.successRate - 50) / 50 : 0;
                  
                  return (
                    <View 
                      key={key} 
                      style={[
                        styles.heatMapDataCell,
                        { backgroundColor: getCorrelationColor(correlation) }
                      ]}
                    >
                      <Text style={styles.heatMapDataText}>
                        {moodData ? Math.round(moodData.successRate) : 0}%
                      </Text>
                    </View>
                  );
                })}
              </View>
            ))}
          </View>
        </ScrollView>
        
        {/* Heat map legend */}
        <View style={styles.heatMapLegend}>
          <Text style={styles.legendTitle}>{t('moodAnalytics.correlationHeatMap.correlationStrength')}</Text>
          <View style={styles.legendRow}>
            <View style={styles.legendItem}>
              <View style={[styles.legendColor, { backgroundColor: 'rgba(76, 175, 80, 0.8)' }]} />
              <Text style={styles.legendText}>{t('moodAnalytics.correlationHeatMap.strongPositive')}</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendColor, { backgroundColor: 'rgba(76, 175, 80, 0.3)' }]} />
              <Text style={styles.legendText}>{t('moodAnalytics.correlationHeatMap.weakPositive')}</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendColor, { backgroundColor: 'rgba(244, 67, 54, 0.3)' }]} />
              <Text style={styles.legendText}>{t('moodAnalytics.correlationHeatMap.weakNegative')}</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendColor, { backgroundColor: 'rgba(244, 67, 54, 0.8)' }]} />
              <Text style={styles.legendText}>{t('moodAnalytics.correlationHeatMap.strongNegative')}</Text>
            </View>
          </View>
        </View>
      </View>
    );
  };
  
  return (
    <View style={styles.container}>
      {/* Enhanced Header */}
      <View style={styles.header}>
        <Text style={styles.title}>{translate('moodAnalytics.title', 'Mood Analytics')}</Text>
        <Text style={styles.subtitle}>{translate('moodAnalytics.subtitle', 'Track your emotional wellness journey')}</Text>
        
        {/* Dropdown Navigation */}
        <View style={styles.dropdownContainer}>
          <TouchableOpacity 
            style={styles.dropdownButton}
            onPress={() => setShowDropdown(!showDropdown)}
          >
            <Text style={styles.dropdownButtonText}>
              {getTabDisplayName(selectedTab)}
            </Text>
            <Text style={styles.dropdownArrow}>{showDropdown ? '▲' : '▼'}</Text>
          </TouchableOpacity>
          
          <Modal
            visible={showDropdown}
            transparent={true}
            animationType="fade"
            onRequestClose={() => setShowDropdown(false)}
          >
            <TouchableOpacity 
              style={styles.modalOverlay}
              activeOpacity={1}
              onPress={() => setShowDropdown(false)}
            >
              <View style={styles.modalDropdownMenu}>
                <ScrollView 
                  style={styles.modalDropdownScroll}
                  showsVerticalScrollIndicator={true}
                  keyboardShouldPersistTaps="handled"
                >
                  {tabOptions.map((tab) => (
                    <TouchableOpacity
                      key={tab.key}
                      style={[styles.dropdownItem, selectedTab === tab.key && styles.activeDropdownItem]}
                      onPress={() => {
                        setSelectedTab(tab.key);
                        setShowDropdown(false);
                      }}
                    >
                      <Text style={styles.dropdownItemIcon}>{tab.icon}</Text>
                      <Text style={[styles.dropdownItemText, selectedTab === tab.key && styles.activeDropdownItemText]}>
                        {tab.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            </TouchableOpacity>
          </Modal>
        </View>
      </View>
      
      {/* Content */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {selectedTab === 'dashboard' && renderDashboard()}
        {selectedTab === 'analytics' && renderAnalytics()}
        {selectedTab === 'insights' && renderInsights()}
        {selectedTab === 'progress' && renderProgress()}
        {selectedTab === 'correlations' && renderCorrelations()}
        {selectedTab === 'wellness' && (
          <View style={styles.section}>
            {/* Sub-navigation for Wellness */}
            <View style={styles.subNavContainer}>
              <TouchableOpacity
                style={[styles.subNavButton, wellnessView === 'summary' && styles.activeSubNav]}
                onPress={() => setWellnessView('summary')}
              >
                <Text style={[styles.subNavText, wellnessView === 'summary' && { color: currentTheme.colors.background }]}>
                  {t('moodAnalytics.subTabs.summary')}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.subNavButton, wellnessView === 'resilience' && styles.activeSubNav]}
                onPress={() => setWellnessView('resilience')}
              >
                <Text style={[styles.subNavText, wellnessView === 'resilience' && { color: currentTheme.colors.background }]}>
                  {t('moodAnalytics.subTabs.resilience')}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.subNavButton, wellnessView === 'trends' && styles.activeSubNav]}
                onPress={() => setWellnessView('trends')}
              >
                <Text style={[styles.subNavText, wellnessView === 'trends' && { color: currentTheme.colors.background }]}>
                  {t('moodAnalytics.subTabs.trends')}
                </Text>
              </TouchableOpacity>
            </View>
            
            {/* Content based on selected sub-view */}
            {wellnessView === 'summary' && renderEmotionalWellnessSummary()}
            {wellnessView === 'resilience' && renderEmotionalResilience()}
            {wellnessView === 'trends' && renderEmotionalWellnessTrends()}
          </View>
        )}
        {selectedTab === 'reports' && renderMonthlyReports()}
        {selectedTab === 'calendar' && renderMoodCalendar()}
      </ScrollView>
      
      {/* Feedback Modal */}
      <Modal
        visible={showFeedbackModal}
        transparent={true}
        animationType="slide"
        onRequestClose={handleFeedbackClose}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.feedbackModalContent}>
            <Text style={styles.feedbackModalTitle}>
              {t('moodAnalytics.moodRecommendations.provideFeedback')}
            </Text>
            
            {selectedRecommendation && (
              <View style={styles.feedbackRecommendationInfo}>
                <Text style={styles.feedbackRecommendationCategory}>
                  {selectedRecommendation.category}
                </Text>
                <Text style={styles.feedbackRecommendationDescription}>
                  {selectedRecommendation.description}
                </Text>
              </View>
            )}
            
            <View style={styles.feedbackForm}>
              <Text style={styles.feedbackLabel}>
                {t('moodAnalytics.recommendationFeedback.howHelpful')}
              </Text>
              <View style={styles.feedbackRatingContainer}>
                {[1, 2, 3, 4, 5].map((rating) => (
                  <TouchableOpacity
                    key={rating}
                    style={styles.feedbackRatingButton}
                    onPress={() => handleFeedbackSubmitted({
                      recommendation: selectedRecommendation,
                      rating: rating,
                      timestamp: new Date().toISOString()
                    })}
                  >
                    <Text style={styles.feedbackRatingText}>{rating}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
            
            <TouchableOpacity
              style={styles.feedbackCancelButton}
              onPress={handleFeedbackClose}
            >
              <Text style={styles.feedbackCancelButtonText}>
                {t('common.cancel')}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const createStyles = (colors: any) => StyleSheet.create({
  upgradeContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: colors.background,
  },
  upgradeTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    marginTop: 16,
    textAlign: 'center',
  },
  upgradeMessage: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 8,
    textAlign: 'center',
    marginBottom: 24,
  },
  upgradeButton: {
    backgroundColor: colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 24,
  },
  upgradeButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    backgroundColor: colors.surface,
    paddingTop: 40,
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: colors.textSecondary,
    marginBottom: 20,
  },
  dropdownContainer: {
    position: 'relative',
    zIndex: 1000,
  },
  dropdownButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.card,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  dropdownButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    flex: 1,
  },
  dropdownArrow: {
    fontSize: 12,
    color: colors.textSecondary,
    marginLeft: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-start',
    paddingTop: 280, // Adjust based on header height
    paddingHorizontal: 20,
  },
  modalDropdownMenu: {
    backgroundColor: colors.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    maxHeight: 400,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
  },
  modalDropdownScroll: {
    maxHeight: 400,
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    minHeight: 52,
  },
  activeDropdownItem: {
    backgroundColor: colors.primary + '20',
  },
  dropdownItemIcon: {
    fontSize: 16,
    marginRight: 12,
  },
  dropdownItemText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text,
    flex: 1,
  },
  activeDropdownItemText: {
    color: colors.primary,
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  section: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 16,
  },
  
  // Dashboard Styles
  heroContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  heroCard: {
    flex: 1,
    backgroundColor: colors.card,
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  heroValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: 4,
  },
  heroLabel: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 8,
  },
  heroTrend: {
    fontSize: 12,
    fontWeight: '600',
  },
  heroSubtext: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  
  quickInsightsContainer: {
    marginBottom: 24,
  },
  insightRow: {
    flexDirection: 'row',
    gap: 12,
  },
  miniCard: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  miniCardIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  miniCardTitle: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  miniCardValue: {
    fontSize: 16,
    fontWeight: 'bold',
    textTransform: 'capitalize',
  },
  
  boostersContainer: {
    marginBottom: 24,
  },
  boosterCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
  },
  boosterRank: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  rankText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.background,
  },
  boosterInfo: {
    flex: 1,
  },
  boosterTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 2,
  },
  boosterImpact: {
    fontSize: 12,
    color: colors.success,
  },
  boosterStats: {
    alignItems: 'flex-end',
  },
  boosterRate: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.primary,
  },
  boosterLabel: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  
  chartContainer: {
    marginBottom: 24,
  },
  weeklyChart: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: colors.card,
    padding: 16,
    borderRadius: 12,
    height: 180,
  },
  chartDay: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  chartBar: {
    width: 24,
    height: 120,
    backgroundColor: colors.border,
    borderRadius: 12,
    justifyContent: 'flex-end',
    marginBottom: 8,
  },
  chartFill: {
    width: '100%',
    borderRadius: 12,
    minHeight: 4,
  },
  chartValue: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  chartLabel: {
    fontSize: 10,
    color: colors.textSecondary,
  },
  
  // Insights Styles
  analysisCard: {
    backgroundColor: colors.card,
    padding: 20,
    borderRadius: 16,
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 16,
  },
  progressItem: {
    marginBottom: 16,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  progressLabel: {
    fontSize: 14,
    color: colors.text,
    textTransform: 'capitalize',
  },
  progressValue: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: colors.border,
    borderRadius: 4,
  },
  progressBar: {
    height: '100%',
    borderRadius: 4,
  },
  
  recommendationCard: {
    backgroundColor: colors.card,
    padding: 20,
    borderRadius: 16,
    borderLeftWidth: 4,
    borderLeftColor: colors.primary,
  },
  recommendationDescription: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 12,
    lineHeight: 20,
  },
  impactContainer: {
    marginTop: 8,
    padding: 8,
    backgroundColor: colors.background,
    borderRadius: 6,
  },
  impactLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  impactValue: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  confidenceContainer: {
    marginTop: 8,
  },
  confidenceLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  confidenceBar: {
    height: 4,
    backgroundColor: colors.border,
    borderRadius: 2,
    marginBottom: 4,
  },
  confidenceFill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 2,
  },
  confidenceValue: {
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: 'right',
  },
  feedbackButton: {
    marginTop: 12,
    padding: 8,
    backgroundColor: colors.primary,
    borderRadius: 6,
    alignItems: 'center',
  },
  feedbackButtonText: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.background,
  },
  tipContainer: {
    gap: 16,
  },
  tip: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  tipIcon: {
    fontSize: 20,
    marginRight: 12,
    marginTop: 2,
  },
  tipContent: {
    flex: 1,
  },
  tipTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  tipText: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  
  // Trends Styles
  trendSummaryCard: {
    backgroundColor: colors.card,
    padding: 20,
    borderRadius: 16,
    marginBottom: 16,
  },
  trendStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 16,
  },
  trendStat: {
    alignItems: 'center',
  },
  trendStatValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: 4,
  },
  trendStatLabel: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  
  weeklyBreakdownCard: {
    backgroundColor: colors.card,
    padding: 20,
    borderRadius: 16,
  },
  weekItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  weekLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  weekStats: {
    flexDirection: 'row',
    gap: 20,
  },
  weekStat: {
    alignItems: 'center',
  },
  weekStatValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.primary,
  },
  weekStatLabel: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  
  // Habits Styles
  habitAnalysisCard: {
    backgroundColor: colors.card,
    padding: 20,
    borderRadius: 16,
    marginBottom: 16,
  },
  habitHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  habitTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    flex: 1,
    marginRight: 12,
  },
  habitScore: {
    alignItems: 'flex-end',
  },
  scoreValue: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  scoreLabel: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  
  habitMetrics: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
    paddingVertical: 16,
    backgroundColor: colors.background,
    borderRadius: 12,
  },
  metric: {
    alignItems: 'center',
  },
  metricValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: 4,
  },
  metricLabel: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  
  moodBreakdown: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  breakdownTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 12,
  },
  moodBreakdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  moodBreakdownLabel: {
    fontSize: 13,
    color: colors.textSecondary,
    width: 80,
    textTransform: 'capitalize',
  },
  moodBreakdownBar: {
    flex: 1,
    height: 6,
    backgroundColor: colors.border,
    borderRadius: 3,
    marginHorizontal: 12,
  },
  moodBreakdownFill: {
    height: '100%',
    borderRadius: 3,
  },
  moodBreakdownValue: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text,
    width: 40,
    textAlign: 'right',
  },
  
  // AI Insights Styles
  predictionItem: {
    marginBottom: 16,
    padding: 16,
    backgroundColor: colors.background,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  predictionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  predictionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    flex: 1,
  },
  predictionBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  predictionBadgeText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: colors.background,
  },
  predictionReasoning: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 12,
    lineHeight: 20,
  },
  factorsContainer: {
    gap: 8,
  },
  factor: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  factorLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    width: 80,
  },
  factorBar: {
    flex: 1,
    height: 6,
    backgroundColor: colors.border,
    borderRadius: 3,
  },
  factorFill: {
    height: '100%',
    borderRadius: 3,
  },
  
  // Risk Alert Styles
  riskAlert: {
    marginBottom: 16,
    padding: 16,
    backgroundColor: colors.background,
    borderRadius: 12,
    borderLeftWidth: 4,
  },
  riskHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  riskTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    flex: 1,
  },
  riskBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  riskBadgeText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: colors.background,
  },
  riskUrgency: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 8,
  },
  suggestionsContainer: {
    gap: 4,
  },
  suggestion: {
    fontSize: 14,
    color: colors.text,
    lineHeight: 20,
  },
  
  // Timing Styles
  timingItem: {
    marginBottom: 16,
    padding: 16,
    backgroundColor: colors.background,
    borderRadius: 12,
  },
  timingTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  timingBest: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
    marginBottom: 4,
  },
  timingReason: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 12,
    lineHeight: 20,
  },
  alternativeTimesContainer: {
    gap: 8,
  },
  alternativeLabel: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  timeChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  timeChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: colors.primary + '20',
    borderRadius: 16,
  },
  timeChipText: {
    fontSize: 12,
    color: colors.primary,
    fontWeight: '600',
  },
  
  // Mood Selector Styles
  moodSelectorContainer: {
    gap: 16,
  },
  moodSelector: {
    flexDirection: 'row',
  },
  moodOption: {
    alignItems: 'center',
    padding: 12,
    marginRight: 12,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'transparent',
    backgroundColor: colors.background,
  },
  moodEmoji: {
    fontSize: 24,
    marginBottom: 4,
  },
  moodLabel: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  intensityContainer: {
    alignItems: 'center',
    gap: 8,
  },
  intensityLabel: {
    fontSize: 14,
    color: colors.text,
    fontWeight: '600',
  },
  intensitySlider: {
    flexDirection: 'row',
    gap: 8,
  },
  intensityDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.border,
  },
  
  // Recommendation Styles
  moodRecommendationsContainer: {
    gap: 16,
  },
  recommendationItem: {
    padding: 16,
    backgroundColor: colors.background,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  recommendationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  recommendationTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    flex: 1,
  },
  urgencyBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  urgencyText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: colors.background,
    textTransform: 'uppercase',
  },
  recommendationReason: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 8,
    lineHeight: 20,
  },
  benefitContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  benefitLabel: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  benefitValue: {
    fontSize: 12,
    fontWeight: 'bold',
    color: colors.success,
  },
  boostingActivitiesContainer: {
    marginTop: 16,
    padding: 16,
    backgroundColor: colors.success + '10',
    borderRadius: 12,
  },
  boostingTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.success,
    marginBottom: 8,
  },
  boostingActivity: {
    fontSize: 14,
    color: colors.text,
    lineHeight: 20,
  },
  
  // Forecast Styles
  forecastContainer: {
    gap: 16,
  },
  forecastItem: {
    padding: 16,
    backgroundColor: colors.background,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  forecastHabitTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 12,
  },
  forecastStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 12,
  },
  forecastStat: {
    alignItems: 'center',
  },
  forecastStatValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: 4,
  },
  forecastStatLabel: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  riskDaysContainer: {
    marginTop: 12,
    padding: 12,
    backgroundColor: colors.error + '10',
    borderRadius: 8,
  },
  riskDaysTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.error,
    marginBottom: 8,
  },
  riskDay: {
    fontSize: 12,
    color: colors.text,
    lineHeight: 18,
  },
  weeklyInsightsContainer: {
    marginTop: 16,
    padding: 16,
    backgroundColor: colors.primary + '10',
    borderRadius: 12,
  },
  weeklyInsightsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
    marginBottom: 8,
  },
  weeklyInsight: {
    fontSize: 14,
    color: colors.text,
    lineHeight: 20,
  },
  
  // Calendar Styles
  calendarContainer: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  calendarHeader: {
    alignItems: 'center',
    marginBottom: 16,
  },
  monthTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
  },
  dayLabelsRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  dayLabel: {
    flex: 1,
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  emptyDay: {
    width: '14.28%',
    height: 50,
  },
  calendarDay: {
    width: '14.28%',
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    margin: 1,
    position: 'relative',
  },
  dayNumber: {
    fontSize: 14,
    fontWeight: '600',
  },
  habitIndicator: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  habitCount: {
    fontSize: 10,
    fontWeight: 'bold',
    color: colors.background,
  },
  calendarLegend: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  legendTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  legendRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendColor: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  legendText: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  
  // Heat Map Styles
  heatMapContainer: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 16,
    minWidth: width * 1.5,
  },
  heatMapRow: {
    flexDirection: 'row',
    marginBottom: 2,
  },
  heatMapCell: {
    width: 80,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heatMapHeaderCell: {
    width: 60,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
    marginHorizontal: 1,
    borderRadius: 4,
  },
  heatMapHeaderText: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.text,
    textAlign: 'center',
  },
  heatMapLabelCell: {
    width: 80,
    height: 40,
    alignItems: 'flex-end',
    justifyContent: 'center',
    paddingRight: 8,
  },
  heatMapLabelText: {
    fontSize: 11,
    color: colors.text,
    textAlign: 'right',
  },
  heatMapDataCell: {
    width: 60,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 1,
    borderRadius: 4,
  },
  heatMapDataText: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.text,
  },
  heatMapLegend: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  
  // Success Rate Chart Styles
  chartCard: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  weeklySuccessChart: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    height: 150,
    alignItems: 'flex-end',
    marginTop: 16,
  },
  successChartDay: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: 2,
  },
  successChartBar: {
    width: 24,
    height: 100,
    backgroundColor: colors.border,
    borderRadius: 12,
    justifyContent: 'flex-end',
    marginBottom: 8,
  },
  successChartFill: {
    width: '100%',
    borderRadius: 12,
    minHeight: 4,
  },
  successChartValue: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  successChartLabel: {
    fontSize: 10,
    color: colors.textSecondary,
  },
  habitSuccessItem: {
    marginBottom: 16,
  },
  habitSuccessHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  habitSuccessTitle: {
    fontSize: 14,
    color: colors.text,
    flex: 1,
  },
  habitSuccessRate: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
  },
  habitSuccessBarContainer: {
    height: 8,
    backgroundColor: colors.border,
    borderRadius: 4,
  },
  habitSuccessBar: {
    height: '100%',
    borderRadius: 4,
  },
  
  // Emotional Wellness Trends Styles
  trendSummaryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  trendBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  trendBadgeText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: colors.background,
  },
  trendLineContainer: {
    flexDirection: 'row',
    height: 120,
    marginBottom: 16,
  },
  trendLineChart: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-end',
    position: 'relative',
  },
  trendPoint: {
    flex: 1,
    height: '100%',
    position: 'relative',
  },
  trendDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    position: 'absolute',
    left: '50%',
    marginLeft: -3,
  },
  trendLine: {
    width: 2,
    backgroundColor: colors.primary,
    position: 'absolute',
    left: '50%',
    marginLeft: -1,
  },
  yAxisLabels: {
    width: 40,
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingRight: 8,
  },
  yAxisLabel: {
    fontSize: 10,
    color: colors.textSecondary,
  },
  
  // Pie Chart Styles
  pieChartCard: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 20,
  },
  pieChartContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
  },
  pieChart: {
    width: 120,
    height: 120,
    borderRadius: 60,
    position: 'relative',
    marginRight: 20,
  },
  pieSlice: {
    position: 'absolute',
    width: '50%',
    height: '50%',
    top: 0,
    left: '50%',
    transformOrigin: '0 100%',
  },
  pieChartCenter: {
    position: 'absolute',
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.background,
    top: 30,
    left: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pieChartCenterText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: colors.text,
  },
  pieChartCenterSubtext: {
    fontSize: 10,
    color: colors.textSecondary,
  },
  pieChartLegend: {
    flex: 1,
  },
  pieChartLegendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  pieChartLegendColor: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  pieChartLegendText: {
    flex: 1,
    fontSize: 12,
    color: colors.text,
  },
  pieChartLegendPercentage: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.primary,
  },
  pieChartStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  pieChartStat: {
    alignItems: 'center',
  },
  pieChartStatValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: 4,
  },
  pieChartStatLabel: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  
  // Mood Improvement Graphs Styles
  trendCardsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  trendCard: {
    flex: 1,
    backgroundColor: colors.card,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  trendCardTitle: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 8,
  },
  trendCardValue: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  trendCardLabel: {
    fontSize: 11,
    color: colors.textSecondary,
  },
  weeklyMoodChart: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-end',
    height: 120,
    paddingHorizontal: 10,
  },
  moodChartBar: {
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 2,
  },
  moodChartFill: {
    width: 20,
    borderRadius: 10,
    marginBottom: 8,
  },
  moodChartValue: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  moodChartLabel: {
    fontSize: 9,
    color: colors.textSecondary,
  },
  
  // Habit Success by Mood Styles
  moodSuccessChart: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-end',
    height: 150,
    paddingHorizontal: 10,
  },
  moodSuccessBar: {
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 1,
  },
  moodSuccessBarFill: {
    width: 16,
    borderRadius: 8,
    marginBottom: 8,
  },
  moodSuccessValue: {
    fontSize: 9,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  moodSuccessLabel: {
    fontSize: 8,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  moodPerformanceCards: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  performanceCard: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  performanceCardTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
    textAlign: 'center',
  },
  performanceCardMood: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: 4,
    textTransform: 'capitalize',
  },
  performanceCardRate: {
    fontSize: 11,
    color: colors.textSecondary,
  },
  
  // Streak Tracking Styles
  streakItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  streakInfo: {
    flex: 1,
  },
  streakTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  streakSubtitle: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  streakBadge: {
    backgroundColor: colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    alignItems: 'center',
    minWidth: 60,
  },
  streakDays: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.background,
  },
  streakLabel: {
    fontSize: 10,
    color: colors.background,
  },
  streakStatsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  streakStatCard: {
    flex: 1,
    backgroundColor: colors.card,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  streakStatValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: 4,
  },
  streakStatLabel: {
    fontSize: 11,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  
  // Monthly Reports Styles
  reportSubtitle: {
    fontSize: 16,
    color: colors.textSecondary,
    marginBottom: 20,
    textAlign: 'center',
  },
  reportCardsContainer: {
    gap: 12,
    marginBottom: 20,
  },
  reportCardRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  reportCard: {
    flex: 1,
    backgroundColor: colors.card,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  reportCardIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  reportCardValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: 4,
  },
  reportCardLabel: {
    fontSize: 11,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  moodDistributionChart: {
    gap: 12,
  },
  distributionItem: {
    marginBottom: 12,
  },
  distributionBar: {
    height: 8,
    backgroundColor: colors.border,
    borderRadius: 4,
    marginBottom: 4,
  },
  distributionBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  distributionLabel: {
    fontSize: 12,
    color: colors.text,
  },
  
  // Emotional Resilience Styles
  resilienceMainCard: {
    backgroundColor: colors.card,
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
    marginBottom: 20,
  },
  resilienceIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  resilienceScore: {
    fontSize: 48,
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: 8,
  },
  resilienceLevel: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  resilienceSubtext: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  resilienceFactorItem: {
    marginBottom: 16,
  },
  resilienceFactorHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  resilienceFactorName: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  resilienceFactorScore: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  resilienceFactorBar: {
    height: 8,
    backgroundColor: colors.border,
    borderRadius: 4,
  },
  resilienceFactorBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  resilienceTipsCard: {
    backgroundColor: colors.card,
    padding: 16,
    borderRadius: 12,
    marginTop: 16,
  },
  resilienceTip: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  resilienceTipIcon: {
    fontSize: 16,
    marginRight: 12,
    width: 24,
  },
  resilienceTipText: {
    flex: 1,
    fontSize: 13,
    color: colors.text,
  },
  
  // Sub-navigation styles
  subNavContainer: {
    flexDirection: 'row',
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 4,
    marginBottom: 20,
  },
  subNavButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 8,
    alignItems: 'center',
    minWidth: 85,
  },
  activeSubNav: {
    backgroundColor: colors.primary,
  },
  subNavText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textSecondary,
    textAlign: 'center',
  },
  
  // Enhanced AI Insights Styles
  aiInsightsHeader: {
    marginBottom: 24,
    alignItems: 'center',
  },
  aiInsightsSubtitle: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 22,
  },
  enhancedAnalysisCard: {
    backgroundColor: colors.card,
    padding: 24,
    borderRadius: 20,
    marginBottom: 20,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  cardHeaderWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  cardIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primary + '20',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  cardIcon: {
    fontSize: 24,
  },
  cardHeaderText: {
    flex: 1,
  },
  predictionsGrid: {
    gap: 16,
  },
  enhancedPredictionItem: {
    padding: 20,
    backgroundColor: colors.background,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  enhancedPredictionBadge: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    minWidth: 60,
    alignItems: 'center',
  },
  enhancedFactorsContainer: {
    marginTop: 16,
    padding: 16,
    backgroundColor: colors.background,
    borderRadius: 12,
  },
  factorsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 12,
  },
  factorsGrid: {
    gap: 12,
  },
  enhancedFactor: {
    gap: 8,
  },
  factorProgressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  factorPercentage: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.text,
    minWidth: 35,
  },
  riskAlertsContainer: {
    gap: 16,
  },
  enhancedRiskAlert: {
    padding: 20,
    backgroundColor: colors.background,
    borderRadius: 16,
    borderLeftWidth: 6,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  enhancedRiskBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    minWidth: 60,
    alignItems: 'center',
  },
  riskUrgencyContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  riskUrgencyLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  enhancedSuggestionsContainer: {
    marginTop: 12,
    padding: 16,
    backgroundColor: colors.primary + '05',
    borderRadius: 12,
  },
  suggestionsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
    marginBottom: 12,
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
    gap: 8,
  },
  suggestionBullet: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: 'bold',
    marginTop: 2,
  },
  timingSuggestionsContainer: {
    gap: 16,
  },
  enhancedTimingItem: {
    padding: 20,
    backgroundColor: colors.background,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  bestTimeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  bestTimeLabel: {
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  enhancedAlternativeTimesContainer: {
    marginTop: 16,
    padding: 16,
    backgroundColor: colors.success + '05',
    borderRadius: 12,
    gap: 12,
  },
  enhancedTimeChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: colors.primary + '15',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.primary + '30',
  },
  enhancedMoodRecommendationsContainer: {
    gap: 16,
  },
  enhancedRecommendationItem: {
    padding: 20,
    backgroundColor: colors.background,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  enhancedUrgencyBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    minWidth: 60,
    alignItems: 'center',
  },
  enhancedBenefitContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
    padding: 12,
    backgroundColor: colors.success + '10',
    borderRadius: 8,
  },
  benefitValueContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  benefitScale: {
    fontSize: 10,
    color: colors.textSecondary,
    marginLeft: 2,
  },
  enhancedBoostingActivitiesContainer: {
    marginTop: 20,
    padding: 20,
    backgroundColor: colors.success + '10',
    borderRadius: 16,
  },
  boostingActivitiesList: {
    gap: 8,
  },
  boostingActivityItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  boostingActivityBullet: {
    fontSize: 14,
    marginTop: 2,
  },
  enhancedForecastContainer: {
    gap: 20,
  },
  enhancedForecastItem: {
    padding: 20,
    backgroundColor: colors.background,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  enhancedForecastStats: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 16,
  },
  forecastStatCard: {
    flex: 1,
    padding: 16,
    backgroundColor: colors.primary + '10',
    borderRadius: 12,
    alignItems: 'center',
  },
  enhancedRiskDaysContainer: {
    marginTop: 16,
    padding: 16,
    backgroundColor: colors.warning + '10',
    borderRadius: 12,
  },
  riskDaysList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  riskDayChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: colors.warning + '20',
    borderRadius: 16,
    gap: 4,
  },
  riskDayText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.text,
  },
  riskDayLevel: {
    fontSize: 10,
    color: colors.warning,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  enhancedWeeklyInsightsContainer: {
    marginTop: 20,
    padding: 20,
    backgroundColor: colors.primary + '05',
    borderRadius: 16,
  },
  weeklyInsightsList: {
    gap: 12,
    marginTop: 12,
  },
  weeklyInsightItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  weeklyInsightBullet: {
    fontSize: 14,
    marginTop: 2,
  },
  enhancedMoodSelectorContainer: {
    gap: 20,
  },
  enhancedMoodOption: {
    alignItems: 'center',
    padding: 16,
    marginRight: 12,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: 'transparent',
    backgroundColor: colors.background,
    minWidth: 80,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  enhancedMoodLabel: {
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  enhancedIntensityContainer: {
    alignItems: 'center',
    gap: 16,
    padding: 20,
    backgroundColor: colors.background,
    borderRadius: 16,
  },
  enhancedIntensitySlider: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  enhancedIntensityDot: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  intensityDotText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.text,
  },
  
  // New styles for enhanced insights
  insightCard: {
    backgroundColor: colors.card,
    padding: 20,
    borderRadius: 16,
    marginBottom: 16,
  },
  insightTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 16,
  },
  sectionSubtitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 12,
    marginTop: 16,
  },
  weeklyTrendItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  trendMetrics: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  trendScore: {
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.primary,
    minWidth: 30,
  },
  stabilityBar: {
    height: 4,
    backgroundColor: colors.success,
    borderRadius: 2,
    minWidth: 20,
  },
  patternGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 15,
  },
  patternCard: {
    flex: 1,
    backgroundColor: colors.background,
    padding: 15,
    borderRadius: 12,
    marginHorizontal: 5,
    alignItems: 'center',
  },
  patternLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 5,
  },
  patternValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 2,
  },
  patternSubtext: {
    fontSize: 11,
    color: colors.textSecondary,
  },
  
  // Enhanced Monthly Emotional Patterns Styles
  enhancedInsightCard: {
    backgroundColor: colors.card,
    padding: 24,
    borderRadius: 20,
    marginBottom: 20,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 6,
  },
  enhancedInsightHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 24,
  },
  insightHeaderLeft: {
    flex: 1,
  },
  enhancedInsightTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 6,
  },
  enhancedInsightSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  monthlyScoreContainer: {
    alignItems: 'center',
    backgroundColor: colors.primary + '15',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 16,
  },
  monthlyScoreValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.primary,
  },
  monthlyScoreLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  enhancedPatternGrid: {
    gap: 16,
    marginBottom: 24,
  },
  enhancedPatternCard: {
    backgroundColor: colors.background,
    padding: 20,
    borderRadius: 16,
    borderLeftWidth: 4,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  patternCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  patternCardEmoji: {
    fontSize: 32,
  },
  patternCardInfo: {
    flex: 1,
  },
  enhancedPatternLabel: {
    fontSize: 13,
    color: colors.textSecondary,
    fontWeight: '600',
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  enhancedPatternValue: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  enhancedPatternSubtext: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  stabilityProgressBar: {
    height: 6,
    borderRadius: 3,
    marginTop: 12,
    overflow: 'hidden',
  },
  stabilityProgressFill: {
    height: '100%',
    borderRadius: 3,
  },
  weeklyProgressionContainer: {
    marginBottom: 24,
  },
  enhancedSectionSubtitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 16,
  },
  weeklyProgressionGrid: {
    gap: 12,
  },
  enhancedWeeklyTrendItem: {
    backgroundColor: colors.background,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  weeklyTrendHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  enhancedWeekLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  weeklyTrendEmoji: {
    fontSize: 20,
  },
  enhancedTrendMetrics: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  weeklyMetricItem: {
    alignItems: 'center',
    flex: 1,
  },
  weeklyMetricLabel: {
    fontSize: 11,
    color: colors.textSecondary,
    marginBottom: 4,
    textTransform: 'uppercase',
    fontWeight: '600',
  },
  enhancedTrendScore: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text,
  },
  enhancedStabilityBar: {
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
  },
  enhancedStabilityFill: {
    height: '100%',
    borderRadius: 2,
  },
  monthlyInsightsContainer: {
    backgroundColor: colors.primary + '05',
    padding: 20,
    borderRadius: 16,
  },
  insightTipsList: {
    gap: 12,
  },
  insightTipItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  insightTipIcon: {
    fontSize: 16,
    marginTop: 2,
  },
  insightTipText: {
    flex: 1,
    fontSize: 14,
    color: colors.text,
    lineHeight: 20,
  },
  discoveryCard: {
    backgroundColor: colors.background,
    padding: 15,
    borderRadius: 12,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: colors.primary,
  },
  discoveryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  discoveryTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text,
    flex: 1,
  },
  strengthIndicator: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    minWidth: 50,
    alignItems: 'center',
  },
  strengthText: {
    color: colors.background,
    fontSize: 12,
    fontWeight: 'bold',
  },
  discoveryDescription: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 8,
    lineHeight: 20,
  },
  discoveryAction: {
    fontSize: 13,
    color: colors.primary,
    fontStyle: 'italic',
  },
  wellnessScoreCard: {
    backgroundColor: colors.background,
    padding: 20,
    borderRadius: 15,
    marginBottom: 20,
    alignItems: 'center',
  },
  wellnessScoreLabel: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 8,
  },
  wellnessScoreValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: 10,
  },
  wellnessScoreBar: {
    width: '100%',
    height: 8,
    backgroundColor: colors.border,
    borderRadius: 4,
    overflow: 'hidden',
  },
  wellnessScoreFill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 4,
  },
  progressMetricsContainer: {
    marginTop: 10,
  },
  progressMetricItem: {
    marginBottom: 15,
  },
  metricValueContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5,
  },
  metricTarget: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  metricProgressBar: {
    width: '100%',
    height: 6,
    backgroundColor: colors.border,
    borderRadius: 3,
    overflow: 'hidden',
  },
  metricProgressFill: {
    height: '100%',
    borderRadius: 3,
  },
  recommendationDetailCard: {
    backgroundColor: colors.background,
    padding: 15,
    borderRadius: 12,
    marginBottom: 15,
    borderLeftWidth: 3,
    borderLeftColor: colors.primary,
  },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    minWidth: 50,
    alignItems: 'center',
  },
  priorityText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: colors.background,
  },
  recommendationCategory: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text,
    flex: 1,
  },
  suggestionText: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 5,
    lineHeight: 18,
  },
  expectedImpact: {
    fontSize: 13,
    color: colors.primary,
    fontWeight: '600',
    marginTop: 8,
  },
  trendOverviewCard: {
    backgroundColor: colors.background,
    padding: 15,
    borderRadius: 12,
    marginBottom: 15,
  },
  trendOverviewTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 10,
  },
  trendMetricsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  trendMetricItem: {
    alignItems: 'center',
    flex: 1,
  },
  trendMetricLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 5,
  },
  trendMetricValue: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  periodComparisonCard: {
    backgroundColor: colors.background,
    padding: 15,
    borderRadius: 12,
    marginBottom: 10,
  },
  periodTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 10,
  },
  periodMetrics: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  periodMetric: {
    alignItems: 'center',
    flex: 1,
  },
  periodMetricLabel: {
    fontSize: 11,
    color: colors.textSecondary,
    marginBottom: 3,
  },
  periodMetricValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.text,
  },
  // Feedback Modal Styles
  feedbackModalContent: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 24,
    marginHorizontal: 20,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
  },
  feedbackModalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 20,
    textAlign: 'center',
  },
  feedbackRecommendationInfo: {
    backgroundColor: colors.background,
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
  },
  feedbackRecommendationCategory: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 8,
  },
  feedbackRecommendationDescription: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  feedbackForm: {
    marginBottom: 24,
  },
  feedbackLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 16,
    textAlign: 'center',
  },
  feedbackRatingContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
  },
  feedbackRatingButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 4,
  },
  feedbackRatingText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.background,
  },
  feedbackCancelButton: {
    backgroundColor: colors.border,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
  },
  feedbackCancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
});