import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Dimensions,
} from 'react-native';
import { useTheme } from '@/context/ThemeContext';
import { useLanguage } from '@/context/LanguageContext';
import { useSubscription } from '@/context/SubscriptionContext';
import {
  Brain,
  Target,
  TrendingUp,
  Clock,
  Award,
  Zap,
  Activity,
  Heart,
  Users,
  MessageCircle,
  Lightbulb,
  ArrowRight,
  RefreshCw,
  Crown,
} from 'lucide-react-native';

const { width } = Dimensions.get('window');

interface CoachingInsight {
  id: string;
  type: 'habit' | 'mood' | 'performance' | 'motivation';
  title: string;
  description: string;
  action: string;
  priority: 'high' | 'medium' | 'low';
  timestamp: string;
}

interface AISuggestion {
  id: string;
  category: 'habit_optimization' | 'mood_improvement' | 'streak_recovery' | 'goal_setting';
  title: string;
  description: string;
  confidence: number;
  implementation: string[];
  expectedImpact: string;
}

const AICoachingHub: React.FC = () => {
  const { currentTheme } = useTheme();
  const { t } = useLanguage();
  const { canUseAI, showUpgradePrompt } = useSubscription();
  
  // Safety check for currentTheme
  if (!currentTheme || !currentTheme.colors) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>Loading...</Text>
      </View>
    );
  }
  
  // Safety check for currentTheme
  if (!currentTheme || !currentTheme.colors) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>Loading...</Text>
      </View>
    );
  }
  const [insights, setInsights] = useState<CoachingInsight[]>([]);
  const [suggestions, setSuggestions] = useState<AISuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  useEffect(() => {
    if (canUseAI(0)) {
      loadCoachingData();
    }
  }, []);

  const loadCoachingData = async () => {
    setIsLoading(true);
    try {
      // Simulate API call for coaching data
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Mock insights data
      const mockInsights: CoachingInsight[] = [
        {
          id: '1',
          type: 'habit',
          title: t('aiCoaching.insights.habitOptimization.title'),
          description: t('aiCoaching.insights.habitOptimization.description'),
          action: t('aiCoaching.insights.habitOptimization.action'),
          priority: 'high',
          timestamp: new Date().toISOString(),
        },
        {
          id: '2',
          type: 'mood',
          title: t('aiCoaching.insights.moodPattern.title'),
          description: t('aiCoaching.insights.moodPattern.description'),
          action: t('aiCoaching.insights.moodPattern.action'),
          priority: 'medium',
          timestamp: new Date(Date.now() - 86400000).toISOString(),
        },
        {
          id: '3',
          type: 'performance',
          title: t('aiCoaching.insights.streakRecovery.title'),
          description: t('aiCoaching.insights.streakRecovery.description'),
          action: t('aiCoaching.insights.streakRecovery.action'),
          priority: 'high',
          timestamp: new Date(Date.now() - 172800000).toISOString(),
        },
      ];

      // Mock suggestions data
      const mockSuggestions: AISuggestion[] = [
        {
          id: '1',
          category: 'habit_optimization',
          title: t('aiCoaching.suggestions.habitOptimization.title'),
          description: t('aiCoaching.suggestions.habitOptimization.description'),
          confidence: 0.85,
          implementation: [
            t('aiCoaching.suggestions.habitOptimization.step1'),
            t('aiCoaching.suggestions.habitOptimization.step2'),
            t('aiCoaching.suggestions.habitOptimization.step3'),
          ],
          expectedImpact: t('aiCoaching.suggestions.habitOptimization.impact'),
        },
        {
          id: '2',
          category: 'mood_improvement',
          title: t('aiCoaching.suggestions.moodImprovement.title'),
          description: t('aiCoaching.suggestions.moodImprovement.description'),
          confidence: 0.78,
          implementation: [
            t('aiCoaching.suggestions.moodImprovement.step1'),
            t('aiCoaching.suggestions.moodImprovement.step2'),
          ],
          expectedImpact: t('aiCoaching.suggestions.moodImprovement.impact'),
        },
        {
          id: '3',
          category: 'streak_recovery',
          title: t('aiCoaching.suggestions.streakRecovery.title'),
          description: t('aiCoaching.suggestions.streakRecovery.description'),
          confidence: 0.92,
          implementation: [
            t('aiCoaching.suggestions.streakRecovery.step1'),
            t('aiCoaching.suggestions.streakRecovery.step2'),
            t('aiCoaching.suggestions.streakRecovery.step3'),
          ],
          expectedImpact: t('aiCoaching.suggestions.streakRecovery.impact'),
        },
      ];

      setInsights(mockInsights);
      setSuggestions(mockSuggestions);
    } catch (error) {
      Alert.alert(t('aiCoaching.error'), t('aiCoaching.loadError'));
    } finally {
      setIsLoading(false);
    }
  };

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'habit':
        return <Target size={20} color={currentTheme.colors.primary} />;
      case 'mood':
        return <Heart size={20} color={currentTheme.colors.accent} />;
      case 'performance':
        return <TrendingUp size={20} color={currentTheme.colors.success} />;
      case 'motivation':
        return <Award size={20} color={currentTheme.colors.warning} />;
      default:
        return <Lightbulb size={20} color={currentTheme.colors.primary} />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return currentTheme.colors.error;
      case 'medium':
        return currentTheme.colors.warning;
      case 'low':
        return currentTheme.colors.success;
      default:
        return currentTheme.colors.textSecondary;
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return currentTheme.colors.success;
    if (confidence >= 0.6) return currentTheme.colors.warning;
    return currentTheme.colors.error;
  };

  const renderCategoryFilter = () => (
    <View style={styles.categoryFilter}>
      <Text style={[styles.sectionTitle, { color: currentTheme.colors.text }]}>
        {t('aiCoaching.categories')}
      </Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={styles.categoryButtons}>
          {[
            { key: 'all', label: t('aiCoaching.allCategories'), icon: <Brain size={16} /> },
            { key: 'habit_optimization', label: t('aiCoaching.habitOptimization'), icon: <Target size={16} /> },
            { key: 'mood_improvement', label: t('aiCoaching.moodImprovement'), icon: <Heart size={16} /> },
            { key: 'streak_recovery', label: t('aiCoaching.streakRecovery'), icon: <TrendingUp size={16} /> },
            { key: 'goal_setting', label: t('aiCoaching.goalSetting'), icon: <Award size={16} /> },
          ].map((category) => (
            <TouchableOpacity
              key={category.key}
              style={[
                styles.categoryButton,
                {
                  backgroundColor: selectedCategory === category.key 
                    ? currentTheme.colors.primary 
                    : currentTheme.colors.surface,
                  borderColor: currentTheme.colors.border,
                },
              ]}
              onPress={() => setSelectedCategory(category.key)}
            >
              {category.icon}
              <Text
                style={[
                  styles.categoryButtonText,
                  {
                    color: selectedCategory === category.key 
                      ? "#FFFFFF" 
                      : currentTheme.colors.text,
                  },
                ]}
              >
                {category.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </View>
  );

  const renderInsights = () => (
    <View style={[styles.section, { backgroundColor: currentTheme.colors.card }]}>
      <View style={styles.sectionHeader}>
        <Lightbulb size={24} color={currentTheme.colors.primary} />
        <Text style={[styles.sectionTitle, { color: currentTheme.colors.text }]}>
          {t('aiCoaching.insights.title')}
        </Text>
      </View>
      
      {insights.map((insight) => (
        <View key={insight.id} style={styles.insightCard}>
          <View style={styles.insightHeader}>
            <View style={styles.insightIconContainer}>
              {getInsightIcon(insight.type)}
            </View>
            <View style={styles.insightContent}>
              <Text style={[styles.insightTitle, { color: currentTheme.colors.text }]}>
                {insight.title}
              </Text>
              <Text style={[styles.insightDescription, { color: currentTheme.colors.textSecondary }]}>
                {insight.description}
              </Text>
            </View>
            <View style={[styles.priorityBadge, { backgroundColor: getPriorityColor(insight.priority) + '20' }]}>
              <Text style={[styles.priorityText, { color: getPriorityColor(insight.priority) }]}>
                {insight.priority.toUpperCase()}
              </Text>
            </View>
          </View>
          
          <TouchableOpacity
            style={[styles.insightAction, { backgroundColor: currentTheme.colors.primary }]}
            onPress={() => Alert.alert(t('aiCoaching.actionTaken'), insight.action)}
          >
            <Text style={[styles.insightActionText, { color: "#FFFFFF" }]}>
              {t('aiCoaching.takeAction')}
            </Text>
            <ArrowRight size={16} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      ))}
    </View>
  );

  const renderSuggestions = () => {
    const filteredSuggestions = selectedCategory === 'all' 
      ? suggestions 
      : suggestions.filter(s => s.category === selectedCategory);

    return (
      <View style={[styles.section, { backgroundColor: currentTheme.colors.card }]}>
        <View style={styles.sectionHeader}>
          <Brain size={24} color={currentTheme.colors.primary} />
          <Text style={[styles.sectionTitle, { color: currentTheme.colors.text }]}>
            {t('aiCoaching.suggestions.title')}
          </Text>
        </View>
        
        {filteredSuggestions.map((suggestion) => (
          <View key={suggestion.id} style={styles.suggestionCard}>
            <View style={styles.suggestionHeader}>
              <Text style={[styles.suggestionTitle, { color: currentTheme.colors.text }]}>
                {suggestion.title}
              </Text>
              <View style={[styles.confidenceBadge, { backgroundColor: getConfidenceColor(suggestion.confidence) + '20' }]}>
                <Text style={[styles.confidenceText, { color: getConfidenceColor(suggestion.confidence) }]}>
                  {Math.round(suggestion.confidence * 100)}%
                </Text>
              </View>
            </View>
            
            <Text style={[styles.suggestionDescription, { color: currentTheme.colors.textSecondary }]}>
              {suggestion.description}
            </Text>
            
            <View style={styles.implementationContainer}>
              <Text style={[styles.implementationTitle, { color: currentTheme.colors.text }]}>
                {t('aiCoaching.implementation')}:
              </Text>
              {suggestion.implementation.map((step, index) => (
                <View key={index} style={styles.implementationStep}>
                  <Text style={[styles.stepNumber, { color: currentTheme.colors.primary }]}>
                    {index + 1}.
                  </Text>
                  <Text style={[styles.stepText, { color: currentTheme.colors.text }]}>
                    {step}
                  </Text>
                </View>
              ))}
            </View>
            
            <View style={[styles.impactContainer, { backgroundColor: currentTheme.colors.surface }]}>
              <Text style={[styles.impactTitle, { color: currentTheme.colors.text }]}>
                {t('aiCoaching.expectedImpact')}:
              </Text>
              <Text style={[styles.impactText, { color: currentTheme.colors.textSecondary }]}>
                {suggestion.expectedImpact}
              </Text>
            </View>
          </View>
        ))}
      </View>
    );
  };

  const renderActionButtons = () => (
    <View style={styles.actionButtons}>
      <TouchableOpacity
        style={[styles.actionButton, { backgroundColor: currentTheme.colors.surface }]}
        onPress={loadCoachingData}
        disabled={isLoading}
      >
        <RefreshCw size={20} color={currentTheme.colors.primary} />
        <Text style={[styles.actionButtonText, { color: currentTheme.colors.primary }]}>
          {isLoading ? t('aiCoaching.refreshing') : t('aiCoaching.refresh')}
        </Text>
      </TouchableOpacity>
      
      <TouchableOpacity
        style={[styles.actionButton, { backgroundColor: currentTheme.colors.primary }]}
        onPress={() => Alert.alert(t('aiCoaching.chatTitle'), t('aiCoaching.chatMessage'))}
      >
        <MessageCircle size={20} color="#FFFFFF" />
        <Text style={[styles.actionButtonText, { color: "#FFFFFF" }]}>
          {t('aiCoaching.chatWithAI')}
        </Text>
      </TouchableOpacity>
    </View>
  );

  if (!canUseAI(0)) {
    return (
      <View style={styles.upgradeContainer}>
        <Brain size={48} color={currentTheme.colors.primary} />
        <Text style={[styles.upgradeTitle, { color: currentTheme.colors.text }]}>
          {t('aiCoaching.upgradeRequired')}
        </Text>
        <Text style={[styles.upgradeMessage, { color: currentTheme.colors.textSecondary }]}>
          {t('aiCoaching.upgradeMessage')}
        </Text>
        <TouchableOpacity
          style={[styles.upgradeButton, { backgroundColor: currentTheme.colors.primary }]}
          onPress={() => showUpgradePrompt('ai_limit')}
        >
          <Crown size={20} color="#FFFFFF" />
          <Text style={[styles.upgradeButtonText, { color: "#FFFFFF" }]}>
            {t('premium.upgradeToPro')}
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={[styles.container, { backgroundColor: currentTheme.colors.background }]}>
      {renderCategoryFilter()}
      {renderInsights()}
      {renderSuggestions()}
      {renderActionButtons()}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  upgradeContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  upgradeTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  upgradeMessage: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  upgradeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    gap: 8,
  },
  upgradeButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  categoryFilter: {
    padding: 20,
  },
  categoryButtons: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  categoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    gap: 6,
  },
  categoryButtonText: {
    fontSize: 12,
    fontWeight: '500',
  },
  section: {
    margin: 20,
    marginTop: 0,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  insightCard: {
    marginBottom: 16,
    padding: 16,
    borderRadius: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.02)',
  },
  insightHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  insightIconContainer: {
    marginRight: 12,
    marginTop: 2,
  },
  insightContent: {
    flex: 1,
  },
  insightTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  insightDescription: {
    fontSize: 14,
    lineHeight: 20,
  },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  priorityText: {
    fontSize: 10,
    fontWeight: '600',
  },
  insightAction: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
    gap: 6,
  },
  insightActionText: {
    fontSize: 14,
    fontWeight: '500',
  },
  suggestionCard: {
    marginBottom: 16,
    padding: 16,
    borderRadius: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.02)',
  },
  suggestionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  suggestionTitle: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
  },
  confidenceBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  confidenceText: {
    fontSize: 12,
    fontWeight: '600',
  },
  suggestionDescription: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  implementationContainer: {
    marginBottom: 12,
  },
  implementationTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  implementationStep: {
    flexDirection: 'row',
    marginBottom: 6,
  },
  stepNumber: {
    fontSize: 14,
    fontWeight: '600',
    marginRight: 8,
    minWidth: 20,
  },
  stepText: {
    fontSize: 14,
    flex: 1,
  },
  impactContainer: {
    padding: 12,
    borderRadius: 6,
  },
  impactTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  impactText: {
    fontSize: 14,
    lineHeight: 20,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    padding: 20,
    paddingTop: 0,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    gap: 8,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
});

export default AICoachingHub; 