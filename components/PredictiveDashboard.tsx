import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useTheme } from '@/context/ThemeContext';
import { useLanguage } from '@/context/LanguageContext';
import { useAuth } from '@/context/AuthContext';
import { useHabits } from '@/context/HabitContext';
import {
  TrendingUp,
  AlertTriangle,
  Clock,
  Brain,
  Target,
  BarChart3,
  Zap,
  Shield,
} from 'lucide-react-native';
import PredictiveAnalyticsService, {
  MoodForecast,
  SuccessPrediction,
  RiskAlert,
  TimingSuggestion,
} from '@/services/PredictiveAnalyticsService';

interface PredictiveDashboardProps {
  onClose?: () => void;
}

const PredictiveDashboard: React.FC<PredictiveDashboardProps> = ({ onClose }) => {
  const { currentTheme } = useTheme();
  const { t } = useLanguage();
  const { user } = useAuth();
  const { habits } = useHabits();

  const [loading, setLoading] = useState(true);
  const [moodForecasts, setMoodForecasts] = useState<MoodForecast[]>([]);
  const [successPredictions, setSuccessPredictions] = useState<SuccessPrediction[]>([]);
  const [riskAlerts, setRiskAlerts] = useState<RiskAlert[]>([]);
  const [timingSuggestions, setTimingSuggestions] = useState<TimingSuggestion[]>([]);
  const [activeTab, setActiveTab] = useState<'predictions' | 'alerts' | 'timing' | 'insights'>('predictions');

  const predictiveService = PredictiveAnalyticsService.getInstance();

  useEffect(() => {
    if (user?.id) {
      predictiveService.setUserId(user.id);
      loadPredictiveData();
    }
  }, [user?.id, habits]);

  const loadPredictiveData = async () => {
    try {
      setLoading(true);
      
      const [forecasts, alerts] = await Promise.all([
        predictiveService.predictMoodForecast(user?.id || '', 7),
        predictiveService.generateRiskAlerts(user?.id || ''),
      ]);

      setMoodForecasts(forecasts);
      setRiskAlerts(alerts);

      // Generate success predictions for each habit
      if (habits && habits.length > 0) {
        const predictions = await Promise.all(
          habits.map(habit => 
            predictiveService.predictHabitSuccess(habit.id, {
              currentMood: { moodState: 'neutral', intensity: 5 },
              timeOfDay: new Date().toLocaleTimeString('en-US', { hour12: false }).slice(0, 5),
              currentStreak: habit.streak || 0,
            })
          )
        );
        setSuccessPredictions(predictions);

        // Generate timing suggestions for each habit
        const suggestions = await Promise.all(
          habits.map(habit => predictiveService.suggestOptimalTiming(habit.id))
        );
        setTimingSuggestions(suggestions);
      }
    } catch (error) {
      console.error('Error loading predictive data:', error);
      Alert.alert('Error', 'Failed to load predictive insights');
    } finally {
      setLoading(false);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return currentTheme.colors.error;
      case 'high': return '#f97316';
      case 'medium': return '#eab308';
      case 'low': return currentTheme.colors.success;
      default: return currentTheme.colors.textSecondary;
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return currentTheme.colors.success;
    if (confidence >= 0.6) return '#eab308';
    return currentTheme.colors.error;
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'improving': return <TrendingUp size={16} color={currentTheme.colors.success} />;
      case 'declining': return <TrendingUp size={16} color={currentTheme.colors.error} style={{ transform: [{ rotate: '180deg' }] }} />;
      default: return <BarChart3 size={16} color={currentTheme.colors.textSecondary} />;
    }
  };

  const renderMoodForecasts = () => (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Brain size={20} color={currentTheme.colors.primary} />
        <Text style={[styles.sectionTitle, { color: currentTheme.colors.text }]}>
          {t('predictive.moodForecast')}
        </Text>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        {moodForecasts.map((forecast, index) => (
          <View key={forecast.date} style={[styles.forecastCard, { backgroundColor: currentTheme.colors.card }]}>
            <Text style={[styles.forecastDate, { color: currentTheme.colors.textSecondary }]}>
              {new Date(forecast.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
            </Text>
            <View style={styles.forecastContent}>
              <Text style={[styles.forecastMood, { color: currentTheme.colors.text }]}>
                {forecast.predictedMood}
              </Text>
              <View style={styles.forecastTrend}>
                {getTrendIcon(forecast.trend)}
                <Text style={[styles.forecastTrendText, { color: currentTheme.colors.textSecondary }]}>
                  {forecast.trend}
                </Text>
              </View>
            </View>
            <View style={styles.confidenceBar}>
              <View 
                style={[
                  styles.confidenceFill, 
                  { 
                    width: `${forecast.confidence * 100}%`,
                    backgroundColor: getConfidenceColor(forecast.confidence)
                  }
                ]} 
              />
            </View>
            <Text style={[styles.confidenceText, { color: currentTheme.colors.textSecondary }]}>
              {Math.round(forecast.confidence * 100)}% confidence
            </Text>
          </View>
        ))}
      </ScrollView>
    </View>
  );

  const renderSuccessPredictions = () => (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Target size={20} color={currentTheme.colors.primary} />
        <Text style={[styles.sectionTitle, { color: currentTheme.colors.text }]}>
          {t('predictive.habitPredictions')}
        </Text>
      </View>
      {successPredictions.map((prediction) => (
        <View key={prediction.habitId} style={[styles.predictionCard, { backgroundColor: currentTheme.colors.card }]}>
          <View style={styles.predictionHeader}>
            <Text style={[styles.predictionTitle, { color: currentTheme.colors.text }]}>
              {prediction.habitTitle}
            </Text>
            <View style={styles.predictionScore}>
              <Text style={[styles.predictionPercentage, { color: getConfidenceColor(prediction.successProbability) }]}>
                {Math.round(prediction.successProbability * 100)}%
              </Text>
            </View>
          </View>
          <View style={styles.predictionBar}>
            <View 
              style={[
                styles.predictionFill, 
                { 
                  width: `${prediction.successProbability * 100}%`,
                  backgroundColor: getConfidenceColor(prediction.successProbability)
                }
              ]} 
            />
          </View>
          {prediction.recommendations.length > 0 && (
            <View style={styles.recommendations}>
              <Text style={[styles.recommendationsTitle, { color: currentTheme.colors.textSecondary }]}>
                Recommendations:
              </Text>
              {prediction.recommendations.slice(0, 2).map((rec, index) => (
                <Text key={index} style={[styles.recommendation, { color: currentTheme.colors.textSecondary }]}>
                  • {rec}
                </Text>
              ))}
            </View>
          )}
        </View>
      ))}
    </View>
  );

  const renderRiskAlerts = () => (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <AlertTriangle size={20} color={currentTheme.colors.error} />
        <Text style={[styles.sectionTitle, { color: currentTheme.colors.text }]}>
          {t('predictive.riskAlerts')} ({riskAlerts.length})
        </Text>
      </View>
      {riskAlerts.length === 0 ? (
        <View style={[styles.emptyState, { backgroundColor: currentTheme.colors.card }]}>
          <Shield size={32} color={currentTheme.colors.success} />
          <Text style={[styles.emptyStateText, { color: currentTheme.colors.textSecondary }]}>
            No risk alerts at this time
          </Text>
        </View>
      ) : (
        riskAlerts.map((alert) => (
          <View key={alert.id} style={[styles.alertCard, { backgroundColor: currentTheme.colors.card }]}>
            <View style={styles.alertHeader}>
              <View style={[styles.severityIndicator, { backgroundColor: getSeverityColor(alert.severity) }]} />
              <Text style={[styles.alertType, { color: currentTheme.colors.text }]}>
                {alert.type.replace('_', ' ').toUpperCase()}
              </Text>
              <Text style={[styles.alertSeverity, { color: getSeverityColor(alert.severity) }]}>
                {alert.severity}
              </Text>
            </View>
            <Text style={[styles.alertMessage, { color: currentTheme.colors.text }]}>
              {alert.message}
            </Text>
            {alert.suggestions.length > 0 && (
              <View style={styles.suggestions}>
                {alert.suggestions.slice(0, 2).map((suggestion, index) => (
                  <Text key={index} style={[styles.suggestion, { color: currentTheme.colors.textSecondary }]}>
                    • {suggestion}
                  </Text>
                ))}
              </View>
            )}
          </View>
        ))
      )}
    </View>
  );

  const renderTimingSuggestions = () => (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Clock size={20} color={currentTheme.colors.primary} />
        <Text style={[styles.sectionTitle, { color: currentTheme.colors.text }]}>
          {t('predictive.optimalTiming')}
        </Text>
      </View>
      {timingSuggestions.map((suggestion) => (
        <View key={suggestion.habitId} style={[styles.timingCard, { backgroundColor: currentTheme.colors.card }]}>
          <Text style={[styles.timingTitle, { color: currentTheme.colors.text }]}>
            {suggestion.habitTitle}
          </Text>
          {suggestion.optimalTimes.length > 0 && (
            <View style={styles.optimalTimes}>
              <Text style={[styles.timingSectionTitle, { color: currentTheme.colors.textSecondary }]}>
                Optimal Times:
              </Text>
              {suggestion.optimalTimes.slice(0, 3).map((time, index) => (
                <View key={index} style={styles.timeItem}>
                  <Text style={[styles.timeText, { color: currentTheme.colors.text }]}>
                    {time.time}
                  </Text>
                  <Text style={[styles.timeProbability, { color: currentTheme.colors.textSecondary }]}>
                    {Math.round(time.successProbability * 100)}% success
                  </Text>
                </View>
              ))}
            </View>
          )}
        </View>
      ))}
    </View>
  );

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: currentTheme.colors.background }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={currentTheme.colors.primary} />
          <Text style={[styles.loadingText, { color: currentTheme.colors.textSecondary }]}>
            Loading AI insights...
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: currentTheme.colors.background }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: currentTheme.colors.text }]}>
          {t('predictive.title')}
        </Text>
        <Text style={[styles.subtitle, { color: currentTheme.colors.textSecondary }]}>
          {t('predictive.subtitle')}
        </Text>
      </View>

      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'predictions' && styles.activeTab]}
          onPress={() => setActiveTab('predictions')}
        >
          <Brain size={16} color={activeTab === 'predictions' ? currentTheme.colors.primary : currentTheme.colors.textSecondary} />
          <Text style={[styles.tabText, activeTab === 'predictions' && styles.activeTabText]}>
            Predictions
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'alerts' && styles.activeTab]}
          onPress={() => setActiveTab('alerts')}
        >
          <AlertTriangle size={16} color={activeTab === 'alerts' ? currentTheme.colors.primary : currentTheme.colors.textSecondary} />
          <Text style={[styles.tabText, activeTab === 'alerts' && styles.activeTabText]}>
            Alerts
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'timing' && styles.activeTab]}
          onPress={() => setActiveTab('timing')}
        >
          <Clock size={16} color={activeTab === 'timing' ? currentTheme.colors.primary : currentTheme.colors.textSecondary} />
          <Text style={[styles.tabText, activeTab === 'timing' && styles.activeTabText]}>
            Timing
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {activeTab === 'predictions' && (
          <>
            {renderMoodForecasts()}
            {renderSuccessPredictions()}
          </>
        )}
        {activeTab === 'alerts' && renderRiskAlerts()}
        {activeTab === 'timing' && renderTimingSuggestions()}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 20,
    paddingBottom: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
  },
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    marginHorizontal: 4,
    borderRadius: 8,
  },
  activeTab: {
    backgroundColor: 'rgba(0, 122, 255, 0.1)',
  },
  tabText: {
    marginLeft: 6,
    fontSize: 14,
    fontWeight: '500',
  },
  activeTabText: {
    color: '#007AFF',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 8,
  },
  forecastCard: {
    width: 120,
    padding: 12,
    borderRadius: 12,
    marginRight: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  forecastDate: {
    fontSize: 12,
    marginBottom: 8,
  },
  forecastContent: {
    alignItems: 'center',
    marginBottom: 8,
  },
  forecastMood: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  forecastTrend: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  forecastTrendText: {
    fontSize: 12,
    marginLeft: 4,
  },
  confidenceBar: {
    height: 4,
    backgroundColor: '#f0f0f0',
    borderRadius: 2,
    marginBottom: 4,
  },
  confidenceFill: {
    height: '100%',
    borderRadius: 2,
  },
  confidenceText: {
    fontSize: 10,
    textAlign: 'center',
  },
  predictionCard: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
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
  },
  predictionScore: {
    backgroundColor: 'rgba(0, 122, 255, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  predictionPercentage: {
    fontSize: 14,
    fontWeight: '600',
  },
  predictionBar: {
    height: 6,
    backgroundColor: '#f0f0f0',
    borderRadius: 3,
    marginBottom: 8,
  },
  predictionFill: {
    height: '100%',
    borderRadius: 3,
  },
  recommendations: {
    marginTop: 8,
  },
  recommendationsTitle: {
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 4,
  },
  recommendation: {
    fontSize: 12,
    marginLeft: 8,
  },
  alertCard: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  alertHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  severityIndicator: {
    width: 4,
    height: 16,
    borderRadius: 2,
    marginRight: 8,
  },
  alertType: {
    fontSize: 12,
    fontWeight: '500',
    flex: 1,
  },
  alertSeverity: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  alertMessage: {
    fontSize: 14,
    marginBottom: 8,
  },
  suggestions: {
    marginTop: 8,
  },
  suggestion: {
    fontSize: 12,
    marginLeft: 8,
  },
  timingCard: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  timingTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  optimalTimes: {
    marginTop: 8,
  },
  timingSectionTitle: {
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 6,
  },
  timeItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  timeText: {
    fontSize: 14,
    fontWeight: '500',
  },
  timeProbability: {
    fontSize: 12,
  },
  emptyState: {
    alignItems: 'center',
    padding: 32,
    borderRadius: 12,
  },
  emptyStateText: {
    fontSize: 14,
    marginTop: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    marginTop: 16,
  },
});

export default PredictiveDashboard;
