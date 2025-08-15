import React, { useState, useMemo, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions, Alert, Share, TextInput, Modal, Linking } from 'react-native';
import { useHabits } from '@/context/HabitContext';
import { useTheme } from '@/context/ThemeContext';
import { useLanguage } from '@/context/LanguageContext';
import { EnhancedCoachingService } from '@/services/EnhancedCoachingService';
import { MoodEntry, HabitMoodEntry, Habit } from '@/types';

const { width } = Dimensions.get('window');

interface EnhancedCoachingDashboardProps {
  moodData: MoodEntry[];
  habitMoodData: HabitMoodEntry[];
}

export default function EnhancedCoachingDashboard({ moodData, habitMoodData }: EnhancedCoachingDashboardProps) {
  const { habits } = useHabits();
  const { currentTheme } = useTheme();
  const { t } = useLanguage();
  
  const [selectedTab, setSelectedTab] = useState<'coaching' | 'strategies' | 'resilience' | 'plans'>('coaching');
  const [activeSession, setActiveSession] = useState<'daily_check_in' | 'habit_optimization' | 'mood_coaching' | 'resilience_training' | null>('daily_check_in');
  const [coachingSession, setCoachingSession] = useState<any>(null);
  const [personalizedStrategies, setPersonalizedStrategies] = useState<any[]>([]);
  const [resilienceTraining, setResilienceTraining] = useState<any>(null);
  const [moodOptimizedPlans, setMoodOptimizedPlans] = useState<any[]>([]);
  
  // New state for conversation flow
  const [conversationStep, setConversationStep] = useState(1);
  const [userResponses, setUserResponses] = useState<string[]>([]);
  const [aiMessages, setAiMessages] = useState<string[]>([]);
  const [sessionProgress, setSessionProgress] = useState(0);
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [sessionPaused, setSessionPaused] = useState(false);
  
  // Feedback modal state
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [feedbackRating, setFeedbackRating] = useState(0);
  const [feedbackText, setFeedbackText] = useState('');
  const [isSubmittingFeedback, setIsSubmittingFeedback] = useState(false);
  
  const coachingService = useMemo(() => EnhancedCoachingService.getInstance(), []);
  const styles = createStyles(currentTheme.colors);

  // Load initial data (strategies, resilience, plans)
  useEffect(() => {
    const loadInitialData = async () => {
      if (!habits || habits.length === 0) return;
      
      try {
        const [strategies, resilience, plans] = await Promise.all([
          coachingService.generatePersonalizedStrategies(habits, moodData, habitMoodData),
          coachingService.createEmotionalResilienceProgram('user-id', 'beginner', moodData, []),
          Promise.all(habits.map(habit => 
            coachingService.createMoodOptimizedHabitPlan(habit, moodData, habitMoodData)
          ))
        ]);
        
        setPersonalizedStrategies(strategies);
        setResilienceTraining(resilience);
        setMoodOptimizedPlans(plans);
      } catch (error) {
        console.error('Error loading initial data:', error);
      }
    };

    loadInitialData();
  }, [habits, moodData, habitMoodData, coachingService]);

  // Load coaching session data when activeSession changes
  useEffect(() => {
    const loadCoachingSession = async () => {
      if (!habits || habits.length === 0 || !activeSession) return;
      
      try {
        const session = await coachingService.generateCoachingSession('user-id', activeSession, {
          habits,
          moodData,
          habitMoodData
        });
        
        setCoachingSession(session);
      } catch (error) {
        console.error('Error loading coaching session:', error);
      }
    };

    loadCoachingSession();
  }, [activeSession, habits, moodData, habitMoodData, coachingService]);

  // Conversation handling functions
  const handleUserResponse = async (response: string) => {
    if (!activeSession) return;
    
    // Add user response to conversation
    setUserResponses(prev => [...prev, response]);
    
    // Generate AI response based on session type and user response
    const aiResponse = await generateAIResponse(activeSession, response, conversationStep);
    setAiMessages(prev => [...prev, aiResponse]);
    
    // Progress to next step
    const nextStep = conversationStep + 1;
    setConversationStep(nextStep);
    setSessionProgress((nextStep / 4) * 100);
    
    // If session is complete, show summary
    if (nextStep > 4) {
      await completeSession();
    }
  };

  const generateAIResponse = async (sessionType: string, userResponse: string, step: number): Promise<string> => {
    // Simulate AI response generation based on session type and step
    const responses = {
      daily_check_in: {
        1: "That's great to hear! Let's check in on your habits today. Which habit would you like to focus on?",
        2: "I see you're feeling motivated. Let's set some specific goals for today. What would you like to achieve?",
        3: "Perfect! Now let's think about potential obstacles. What might get in the way of completing this habit?",
        4: "Excellent planning! Here's your personalized action plan for today. You've got this!"
      },
      habit_optimization: {
        1: "I understand you want to improve your consistency. Let's analyze your current patterns first.",
        2: "Based on your response, I can see some opportunities. Let's identify the best time for this habit.",
        3: "Great insight! Now let's create a specific strategy to overcome this challenge.",
        4: "Perfect! Here's your optimized habit plan. Let's implement these changes step by step."
      },
      mood_coaching: {
        1: "I hear you're feeling stressed. Let's explore how this might be affecting your habits.",
        2: "That's a common challenge. Let's identify some mood-boosting activities that can help.",
        3: "Excellent! Now let's create a mood management strategy that supports your habits.",
        4: "Wonderful! Here's your personalized mood-habit integration plan. You're building great awareness!"
      },
      resilience_training: {
        1: "Stress management is crucial for habit success. Let's assess your current coping strategies.",
        2: "That's a great approach! Let's build on your strengths and add some new techniques.",
        3: "Perfect! Now let's practice some resilience exercises together.",
        4: "Excellent work! Here's your resilience toolkit. You're developing great mental strength!"
      }
    };
    
    return responses[sessionType as keyof typeof responses]?.[step as keyof typeof responses.daily_check_in] || 
           "Thank you for sharing that. Let's continue with our session.";
  };

  const completeSession = async () => {
    setIsSessionActive(false);
    setSessionProgress(100);
    
    // Save session data
    try {
      const sessionData = {
        type: activeSession,
        responses: userResponses,
        messages: aiMessages,
        completedAt: new Date().toISOString(),
        progress: sessionProgress
      };
      
      // Save to AsyncStorage or send to backend
      
      // Show completion message
      Alert.alert(
        'Session Complete! 🎉',
        'Great job! Your coaching session has been completed and saved.',
        [{ text: 'OK', onPress: () => resetSession() }]
      );
    } catch (error) {
      console.error('Error saving session:', error);
    }
  };

  const resetSession = () => {
    setConversationStep(1);
    setUserResponses([]);
    setAiMessages([]);
    setSessionProgress(0);
    setIsSessionActive(false);
    setSessionPaused(false);
  };

  const startSession = () => {
    setIsSessionActive(true);
    setSessionProgress(25);
  };

  const pauseSession = () => {
    setSessionPaused(!sessionPaused);
  };

  const saveSession = async () => {
    try {
      const sessionData = {
        type: activeSession,
        responses: userResponses,
        messages: aiMessages,
        progress: sessionProgress,
        savedAt: new Date().toISOString()
      };
      
      Alert.alert('Session Saved', 'Your progress has been saved successfully!');
    } catch (error) {
      console.error('Error saving session:', error);
      Alert.alert('Error', 'Failed to save session. Please try again.');
    }
  };

  const shareSession = async () => {
    try {
      const shareContent = `AI Coaching Session Summary\n\nSession Type: ${activeSession}\nProgress: ${sessionProgress}%\nCompleted: ${new Date().toLocaleDateString()}\n\nKey Insights:\n${aiMessages.slice(-2).join('\n')}`;
      
      await Share.share({
        message: shareContent,
        title: 'AI Coaching Session'
      });
    } catch (error) {
      console.error('Error sharing session:', error);
    }
  };

  const handleFeedback = () => {
    setShowFeedbackModal(true);
  };

  const submitFeedback = async () => {
    if (feedbackRating === 0) {
      Alert.alert(
        t('aiCoaching.beta.feedbackModal.validation.ratingRequired'),
        t('aiCoaching.beta.feedbackModal.validation.ratingRequired')
      );
      return;
    }

    setIsSubmittingFeedback(true);

    try {
      const subject = `AI Coaching Beta Feedback - Rating: ${feedbackRating}/5`;
      const body = `AI Coaching Beta Feedback

Rating: ${feedbackRating}/5 stars

Feedback:
${feedbackText || 'No additional feedback provided'}

---
Sent from Habit Tracker App
Date: ${new Date().toLocaleDateString()}
Time: ${new Date().toLocaleTimeString()}`;

      const mailtoUrl = `mailto:sabbirhossainsm505@gmail.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

      const canOpen = await Linking.canOpenURL(mailtoUrl);
      
      if (canOpen) {
        await Linking.openURL(mailtoUrl);
        Alert.alert(
          t('aiCoaching.beta.feedbackModal.success.title'),
          t('aiCoaching.beta.feedbackModal.success.message'),
          [{ text: 'OK', onPress: () => closeFeedbackModal() }]
        );
      } else {
        Alert.alert(
          t('aiCoaching.beta.feedbackModal.emailError.title'),
          t('aiCoaching.beta.feedbackModal.emailError.message'),
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('Error sending feedback:', error);
      Alert.alert(
        t('aiCoaching.beta.feedbackModal.error.title'),
        t('aiCoaching.beta.feedbackModal.error.message'),
        [{ text: 'OK' }]
      );
    } finally {
      setIsSubmittingFeedback(false);
    }
  };

  const closeFeedbackModal = () => {
    setShowFeedbackModal(false);
    setFeedbackRating(0);
    setFeedbackText('');
  };

  const renderTabBar = () => (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabScrollContainer}>
      <View style={styles.tabContentContainer}>
        {[
          { key: 'coaching', label: t('aiCoaching.tabs.coaching'), icon: '🤖' },
          { key: 'strategies', label: t('aiCoaching.tabs.strategies'), icon: '🎯' },
          { key: 'resilience', label: t('aiCoaching.tabs.resilience'), icon: '💪' },
          { key: 'plans', label: t('aiCoaching.tabs.plans'), icon: '📋' }
        ].map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={[styles.tab, selectedTab === tab.key && styles.activeTab]}
            onPress={() => setSelectedTab(tab.key as any)}
          >
            <Text style={[styles.tabIcon, selectedTab === tab.key && styles.activeTabIcon]}>
              {tab.icon}
            </Text>
            <Text style={[styles.tabText, selectedTab === tab.key && styles.activeTabText]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return currentTheme.colors.success;
      case 'medium': return currentTheme.colors.warning;
      case 'challenging': return currentTheme.colors.error;
      default: return currentTheme.colors.primary;
    }
  };

  const renderCoachingSession = () => (
    <View style={styles.section}>
      {/* Welcome Header */}
      <View style={styles.welcomeHeader}>
        <View style={styles.avatarContainer}>
          <Text style={styles.avatar}>🤖</Text>
          <View style={styles.onlineIndicator} />
        </View>
        <View style={styles.welcomeText}>
          <Text style={styles.welcomeTitle}>{t('aiCoaching.welcome.title')}</Text>
          <Text style={styles.welcomeSubtitle}>{t('aiCoaching.welcome.subtitle')}</Text>
        </View>
      </View>

      {/* Beta Notice */}
      <View style={styles.betaNotice}>
        <Text style={styles.betaNoticeIcon}>🧪</Text>
                 <View style={styles.betaNoticeContent}>
           <Text style={styles.betaNoticeTitle}>{t('aiCoaching.beta.title')}</Text>
           <Text style={styles.betaNoticeText}>
             {t('aiCoaching.beta.description')}
           </Text>
           <TouchableOpacity style={styles.feedbackButton} onPress={handleFeedback}>
             <Text style={styles.feedbackButtonText}>{t('aiCoaching.beta.feedbackButton')}</Text>
           </TouchableOpacity>
         </View>
      </View>

      {/* Quick Start Options */}
      <View style={styles.quickStartContainer}>
        <Text style={styles.quickStartTitle}>{t('aiCoaching.quickStart.title')}</Text>
        <View style={styles.quickStartGrid}>
                     <TouchableOpacity 
             style={[styles.quickStartCard, activeSession === 'daily_check_in' && styles.activeQuickStartCard]}
             onPress={() => {
               setActiveSession('daily_check_in');
               startSession();
             }}
           >
             <Text style={styles.quickStartIcon}>☀️</Text>
             <Text style={styles.quickStartLabel}>{t('aiCoaching.quickStart.dailyCheckIn')}</Text>
             <Text style={styles.quickStartTime}>2 min</Text>
           </TouchableOpacity>
          
                     <TouchableOpacity 
             style={[styles.quickStartCard, activeSession === 'habit_optimization' && styles.activeQuickStartCard]}
             onPress={() => {
               setActiveSession('habit_optimization');
               startSession();
             }}
           >
             <Text style={styles.quickStartIcon}>⚡</Text>
             <Text style={styles.quickStartLabel}>{t('aiCoaching.quickStart.habitOptimization')}</Text>
             <Text style={styles.quickStartTime}>5 min</Text>
           </TouchableOpacity>
          
                     <TouchableOpacity 
             style={[styles.quickStartCard, activeSession === 'mood_coaching' && styles.activeQuickStartCard]}
             onPress={() => {
               setActiveSession('mood_coaching');
               startSession();
             }}
           >
             <Text style={styles.quickStartIcon}>🧠</Text>
             <Text style={styles.quickStartLabel}>{t('aiCoaching.quickStart.moodCoaching')}</Text>
             <Text style={styles.quickStartTime}>3 min</Text>
           </TouchableOpacity>
          
                     <TouchableOpacity 
             style={[styles.quickStartCard, activeSession === 'resilience_training' && styles.activeQuickStartCard]}
             onPress={() => {
               setActiveSession('resilience_training');
               startSession();
             }}
           >
             <Text style={styles.quickStartIcon}>💪</Text>
             <Text style={styles.quickStartLabel}>{t('aiCoaching.quickStart.resilienceTraining')}</Text>
             <Text style={styles.quickStartTime}>8 min</Text>
           </TouchableOpacity>
        </View>
      </View>

      {/* Active Session Content */}
      {activeSession && (
        <View style={styles.sessionContainer}>
          {/* Session Header */}
          <View style={styles.sessionHeader}>
            <View style={styles.sessionInfo}>
              <Text style={styles.sessionType}>{t(`aiCoaching.sessionTypes.${activeSession}`)}</Text>
              <Text style={styles.sessionDuration}>
                {activeSession === 'daily_check_in' ? '2 min' :
                 activeSession === 'habit_optimization' ? '5 min' :
                 activeSession === 'mood_coaching' ? '3 min' : '8 min'}
              </Text>
            </View>
            <TouchableOpacity 
              style={styles.closeButton}
              onPress={() => setActiveSession(null)}
            >
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Conversation Interface */}
          <View style={styles.conversationContainer}>
            {/* AI Message */}
            <View style={styles.aiMessage}>
              <View style={styles.aiAvatar}>
                <Text style={styles.aiAvatarText}>🤖</Text>
              </View>
              <View style={styles.messageBubble}>
                <Text style={styles.messageText}>
                  {activeSession === 'daily_check_in' ? t('aiCoaching.messages.dailyCheckIn.greeting') :
                   activeSession === 'habit_optimization' ? t('aiCoaching.messages.habitOptimization.greeting') :
                   activeSession === 'mood_coaching' ? t('aiCoaching.messages.moodCoaching.greeting') :
                   t('aiCoaching.messages.resilienceTraining.greeting')}
                </Text>
              </View>
            </View>

            {/* User Response Options */}
            <View style={styles.responseOptions}>
              <Text style={styles.responseTitle}>{t('aiCoaching.response.title')}</Text>
              {activeSession === 'daily_check_in' && (
                <>
                  <TouchableOpacity 
                    style={styles.responseButton}
                    onPress={() => handleUserResponse(t('aiCoaching.response.dailyCheckIn.option1'))}
                  >
                    <Text style={styles.responseButtonText}>{t('aiCoaching.response.dailyCheckIn.option1')}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={styles.responseButton}
                    onPress={() => handleUserResponse(t('aiCoaching.response.dailyCheckIn.option2'))}
                  >
                    <Text style={styles.responseButtonText}>{t('aiCoaching.response.dailyCheckIn.option2')}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={styles.responseButton}
                    onPress={() => handleUserResponse(t('aiCoaching.response.dailyCheckIn.option3'))}
                  >
                    <Text style={styles.responseButtonText}>{t('aiCoaching.response.dailyCheckIn.option3')}</Text>
                  </TouchableOpacity>
                </>
              )}
              
              {activeSession === 'habit_optimization' && (
                <>
                  <TouchableOpacity 
                    style={styles.responseButton}
                    onPress={() => handleUserResponse(t('aiCoaching.response.habitOptimization.option1'))}
                  >
                    <Text style={styles.responseButtonText}>{t('aiCoaching.response.habitOptimization.option1')}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={styles.responseButton}
                    onPress={() => handleUserResponse(t('aiCoaching.response.habitOptimization.option2'))}
                  >
                    <Text style={styles.responseButtonText}>{t('aiCoaching.response.habitOptimization.option2')}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={styles.responseButton}
                    onPress={() => handleUserResponse(t('aiCoaching.response.habitOptimization.option3'))}
                  >
                    <Text style={styles.responseButtonText}>{t('aiCoaching.response.habitOptimization.option3')}</Text>
                  </TouchableOpacity>
                </>
              )}

              {activeSession === 'mood_coaching' && (
                <>
                  <TouchableOpacity 
                    style={styles.responseButton}
                    onPress={() => handleUserResponse(t('aiCoaching.response.moodCoaching.option1'))}
                  >
                    <Text style={styles.responseButtonText}>{t('aiCoaching.response.moodCoaching.option1')}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={styles.responseButton}
                    onPress={() => handleUserResponse(t('aiCoaching.response.moodCoaching.option2'))}
                  >
                    <Text style={styles.responseButtonText}>{t('aiCoaching.response.moodCoaching.option2')}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={styles.responseButton}
                    onPress={() => handleUserResponse(t('aiCoaching.response.moodCoaching.option3'))}
                  >
                    <Text style={styles.responseButtonText}>{t('aiCoaching.response.moodCoaching.option3')}</Text>
                  </TouchableOpacity>
                </>
              )}

              {activeSession === 'resilience_training' && (
                <>
                  <TouchableOpacity 
                    style={styles.responseButton}
                    onPress={() => handleUserResponse(t('aiCoaching.response.resilienceTraining.option1'))}
                  >
                    <Text style={styles.responseButtonText}>{t('aiCoaching.response.resilienceTraining.option1')}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={styles.responseButton}
                    onPress={() => handleUserResponse(t('aiCoaching.response.resilienceTraining.option2'))}
                  >
                    <Text style={styles.responseButtonText}>{t('aiCoaching.response.resilienceTraining.option2')}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={styles.responseButton}
                    onPress={() => handleUserResponse(t('aiCoaching.response.resilienceTraining.option3'))}
                  >
                    <Text style={styles.responseButtonText}>{t('aiCoaching.response.resilienceTraining.option3')}</Text>
                  </TouchableOpacity>
                </>
              )}
            </View>

            {/* Progress Indicator */}
            <View style={styles.progressContainer}>
              <View style={styles.progressBar}>
                <View style={[styles.progressFill, { width: `${sessionProgress}%` }]} />
              </View>
              <Text style={styles.progressText}>{t('aiCoaching.progress.step', { current: conversationStep, total: 4 })}</Text>
            </View>
          </View>

          {/* Session Actions */}
          <View style={styles.sessionActions}>
            <TouchableOpacity 
              style={[styles.actionButton, sessionPaused && styles.actionButtonActive]}
              onPress={pauseSession}
            >
              <Text style={styles.actionButtonText}>
                {sessionPaused ? t('aiCoaching.actions.resume') : t('aiCoaching.actions.pause')}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={saveSession}
            >
              <Text style={styles.actionButtonText}>{t('aiCoaching.actions.save')}</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={shareSession}
            >
              <Text style={styles.actionButtonText}>{t('aiCoaching.actions.share')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Recent Sessions */}
      <View style={styles.recentSessions}>
        <Text style={styles.recentTitle}>{t('aiCoaching.recent.title')}</Text>
        <View style={styles.recentList}>
          <View style={styles.recentItem}>
            <Text style={styles.recentIcon}>☀️</Text>
            <View style={styles.recentContent}>
              <Text style={styles.recentSessionName}>{t('aiCoaching.recent.dailyCheckIn')}</Text>
              <Text style={styles.recentTime}>2 hours ago</Text>
            </View>
            <Text style={styles.recentScore}>85%</Text>
          </View>
          <View style={styles.recentItem}>
            <Text style={styles.recentIcon}>⚡</Text>
            <View style={styles.recentContent}>
              <Text style={styles.recentSessionName}>{t('aiCoaching.recent.habitOptimization')}</Text>
              <Text style={styles.recentTime}>Yesterday</Text>
            </View>
            <Text style={styles.recentScore}>92%</Text>
          </View>
        </View>
      </View>
    </View>
  );

  const renderPersonalizedStrategies = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{t('aiCoaching.strategies.title')}</Text>
      
      <View style={styles.strategiesGrid}>
        {personalizedStrategies.length > 0 ? personalizedStrategies.map((strategy, index) => (
          <View key={index} style={styles.strategyCard}>
            <View style={styles.strategyHeader}>
              <Text style={styles.strategyIcon}>🌅</Text>
              <View style={styles.strategyContent}>
                <Text style={styles.strategyTitle}>{strategy.title || t('aiCoaching.sampleData.strategy.title')}</Text>
                <Text style={styles.strategyCategory}>{strategy.category || t('aiCoaching.sampleData.strategy.category')}</Text>
              </View>
              <View style={[styles.impactBadge, { backgroundColor: currentTheme.colors.primary }]}>
                <Text style={styles.impactText}>{t('aiCoaching.strategies.highImpact')}</Text>
              </View>
            </View>
            <Text style={styles.strategyDescription}>
              {strategy.description || t('aiCoaching.sampleData.strategy.description')}
            </Text>
            <View style={styles.strategyMetrics}>
              <Text style={styles.metricText}>{t('aiCoaching.strategies.expectedImprovement', { percentage: strategy.expectedImprovement || 34 })}</Text>
              <Text style={styles.metricText}>{t('aiCoaching.strategies.implementationTime', { timeframe: strategy.timeframe || t('aiCoaching.sampleData.defaultTimeframe') })}</Text>
            </View>
            <TouchableOpacity style={styles.applyButton}>
              <Text style={styles.applyButtonText}>{t('aiCoaching.strategies.applyStrategy')}</Text>
            </TouchableOpacity>
          </View>
        )) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>{t('aiCoaching.strategies.emptyState')}</Text>
          </View>
        )}
      </View>
    </View>
  );

  const renderResilienceTraining = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{t('aiCoaching.resilience.title')}</Text>
      
      {/* Resilience Score */}
      <View style={styles.resilienceScoreCard}>
        <Text style={styles.resilienceScoreLabel}>{t('aiCoaching.resilience.currentScore')}</Text>
        <Text style={styles.resilienceScoreValue}>{resilienceTraining?.currentScore?.toFixed(1) || t('aiCoaching.sampleData.defaultScore')}</Text>
        <Text style={styles.resilienceScoreSubtext}>
          {resilienceTraining?.level === 'beginner' ? t('aiCoaching.resilience.beginner') : t('aiCoaching.resilience.aboveAverage')}
        </Text>
        <View style={styles.resilienceProgress}>
          <View style={[styles.resilienceProgressFill, { width: `${(resilienceTraining?.currentScore || 7.2) * 10}%` }]} />
        </View>
      </View>

      {/* Training Modules */}
      <View style={styles.trainingModules}>
        <Text style={styles.subsectionTitle}>{t('aiCoaching.resilience.trainingModules')}</Text>
        
        {resilienceTraining?.modules?.map((module: any, index: number) => (
          <TouchableOpacity key={index} style={styles.moduleCard}>
            <View style={styles.moduleHeader}>
              <Text style={styles.moduleIcon}>{module.icon || '🧠'}</Text>
              <View style={styles.moduleContent}>
                <Text style={styles.moduleTitle}>
                  {module.title === 'Emotional Awareness' ? t('aiCoaching.resilience.modules.emotionalAwareness.title') : module.title}
                </Text>
                <Text style={styles.moduleProgress}>{module.progress || t('aiCoaching.resilience.newModule')}</Text>
              </View>
              <Text style={styles.moduleTime}>{module.duration || t('aiCoaching.resilience.moduleDuration.short')}</Text>
            </View>
            <Text style={styles.moduleDescription}>
              {module.title === 'Emotional Awareness' ? t('aiCoaching.resilience.modules.emotionalAwareness.description') : module.description}
            </Text>
          </TouchableOpacity>
        )) || [
          <TouchableOpacity key="cognitive" style={styles.moduleCard}>
            <View style={styles.moduleHeader}>
              <Text style={styles.moduleIcon}>🧠</Text>
              <View style={styles.moduleContent}>
                <Text style={styles.moduleTitle}>{t('aiCoaching.resilience.modules.cognitiveReframing.title')}</Text>
                <Text style={styles.moduleProgress}>{t('aiCoaching.sampleData.defaultProgress')} {t('aiCoaching.resilience.exercisesCompleted')}</Text>
              </View>
              <Text style={styles.moduleTime}>{t('aiCoaching.resilience.moduleDuration.short')}</Text>
            </View>
            <Text style={styles.moduleDescription}>
              {t('aiCoaching.resilience.modules.cognitiveReframing.description')}
            </Text>
          </TouchableOpacity>,
          <TouchableOpacity key="emotional" style={styles.moduleCard}>
            <View style={styles.moduleHeader}>
              <Text style={styles.moduleIcon}>🧠</Text>
              <View style={styles.moduleContent}>
                <Text style={styles.moduleTitle}>{t('aiCoaching.resilience.modules.emotionalAwareness.title')}</Text>
                <Text style={styles.moduleProgress}>{t('aiCoaching.resilience.newModule')}</Text>
              </View>
              <Text style={styles.moduleTime}>{t('aiCoaching.resilience.moduleDuration.short')}</Text>
            </View>
            <Text style={styles.moduleDescription}>
              {t('aiCoaching.resilience.modules.emotionalAwareness.description')}
            </Text>
          </TouchableOpacity>,
          <TouchableOpacity key="stress" style={styles.moduleCard}>
            <View style={styles.moduleHeader}>
              <Text style={styles.moduleIcon}>🎯</Text>
              <View style={styles.moduleContent}>
                <Text style={styles.moduleTitle}>{t('aiCoaching.resilience.modules.stressResponse.title')}</Text>
                <Text style={styles.moduleProgress}>{t('aiCoaching.resilience.newModule')}</Text>
              </View>
              <Text style={styles.moduleTime}>{t('aiCoaching.resilience.moduleDuration.medium')}</Text>
            </View>
            <Text style={styles.moduleDescription}>
              {t('aiCoaching.resilience.modules.stressResponse.description')}
            </Text>
          </TouchableOpacity>
        ]}
      </View>
    </View>
  );

  const renderMoodOptimizedPlans = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{t('aiCoaching.plans.title')}</Text>
      
      <View style={styles.plansContainer}>
        {moodOptimizedPlans.length > 0 ? moodOptimizedPlans.map((plan, index) => (
          <View key={index} style={styles.planCard}>
            <View style={styles.planHeader}>
              <Text style={styles.planTitle}>{plan.habitTitle || t('aiCoaching.plans.defaultHabitTitle')}</Text>
              <View style={[styles.adaptiveBadge, { backgroundColor: currentTheme.colors.warning }]}>
                <Text style={styles.adaptiveText}>{t('aiCoaching.plans.adaptive')}</Text>
              </View>
            </View>
            
            {/* Mood-based schedule */}
            <View style={styles.moodSchedule}>
              <Text style={styles.scheduleTitle}>{t('aiCoaching.plans.moodBasedSchedule')}</Text>
              
              {plan.moodBasedSchedule?.map((schedule: any, scheduleIndex: number) => (
                <View key={scheduleIndex} style={styles.moodScheduleItem}>
                  <Text style={styles.moodState}>{schedule.moodState}</Text>
                  <Text style={styles.moodTime}>{schedule.optimalTimes?.[0]} - {schedule.modifications?.[0]}</Text>
                </View>
              )) || [
                <View key="energetic" style={styles.moodScheduleItem}>
                  <Text style={styles.moodState}>{t('aiCoaching.sampleData.moodSchedule.energetic')}</Text>
                  <Text style={styles.moodTime}>{t('aiCoaching.sampleData.moodSchedule.times.energetic')}</Text>
                </View>,
                <View key="calm" style={styles.moodScheduleItem}>
                  <Text style={styles.moodState}>{t('aiCoaching.sampleData.moodSchedule.calm')}</Text>
                  <Text style={styles.moodTime}>{t('aiCoaching.sampleData.moodSchedule.times.calm')}</Text>
                </View>,
                <View key="low" style={styles.moodScheduleItem}>
                  <Text style={styles.moodState}>{t('aiCoaching.sampleData.moodSchedule.lowEnergy')}</Text>
                  <Text style={styles.moodTime}>{t('aiCoaching.sampleData.moodSchedule.times.lowEnergy')}</Text>
                </View>
              ]}
            </View>

            {/* Adaptive elements */}
            <View style={styles.adaptiveElements}>
              <Text style={styles.adaptiveTitle}>{t('aiCoaching.plans.adaptiveModifications')}</Text>
              {plan.adaptiveElements ? [
                ...plan.adaptiveElements.lowMoodAlternatives?.map((alt: string, i: number) => (
                  <Text key={`low-${i}`} style={styles.adaptiveText}>• {t('aiCoaching.sampleData.moodStates.lowMood')}: {alt}</Text>
                )),
                ...plan.adaptiveElements.highMoodEnhancements?.map((enh: string, i: number) => (
                  <Text key={`high-${i}`} style={styles.adaptiveText}>• {t('aiCoaching.sampleData.moodStates.highMood')}: {enh}</Text>
                )),
                ...plan.adaptiveElements.neutralMoodMaintenance?.map((main: string, i: number) => (
                  <Text key={`neutral-${i}`} style={styles.adaptiveText}>• {t('aiCoaching.sampleData.moodStates.neutralMood')}: {main}</Text>
                ))
              ] : [
                <Text key="low" style={styles.adaptiveText}>{t('aiCoaching.sampleData.adaptiveElements.lowMood')}</Text>,
                <Text key="high" style={styles.adaptiveText}>{t('aiCoaching.sampleData.adaptiveElements.highMood')}</Text>,
                <Text key="neutral" style={styles.adaptiveText}>{t('aiCoaching.sampleData.adaptiveElements.neutralMood')}</Text>
              ]}
            </View>
          </View>
        )) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>{t('aiCoaching.plans.emptyState')}</Text>
          </View>
        )}
      </View>
    </View>
  );

  const renderContent = () => {
    switch (selectedTab) {
      case 'coaching':
        return renderCoachingSession();
      case 'strategies':
        return renderPersonalizedStrategies();
      case 'resilience':
        return renderResilienceTraining();
      case 'plans':
        return renderMoodOptimizedPlans();
      default:
        return renderCoachingSession();
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <Text style={styles.title}>{t('aiCoaching.title')}</Text>
          <View style={styles.betaTag}>
            <Text style={styles.betaText}>BETA</Text>
          </View>
        </View>
        <Text style={styles.subtitle}>{t('aiCoaching.subtitle')}</Text>
        {renderTabBar()}
      </View>
      <ScrollView style={styles.content}>
        {renderContent()}
      </ScrollView>

      {/* Feedback Modal */}
      <Modal
        visible={showFeedbackModal}
        animationType="slide"
        transparent={true}
        onRequestClose={closeFeedbackModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.feedbackModal}>
            <View style={styles.feedbackModalHeader}>
              <Text style={styles.feedbackModalTitle}>{t('aiCoaching.beta.title')}</Text>
              <TouchableOpacity onPress={closeFeedbackModal} style={styles.closeModalButton}>
                <Text style={styles.closeModalButtonText}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.feedbackModalContent}>
                             <Text style={styles.feedbackModalSubtitle}>
                 {t('aiCoaching.beta.feedbackModal.subtitle')}
               </Text>

               {/* Rating Section */}
               <View style={styles.ratingSection}>
                 <Text style={styles.ratingTitle}>{t('aiCoaching.beta.feedbackModal.ratingTitle')}</Text>
                <View style={styles.ratingContainer}>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <TouchableOpacity
                      key={star}
                      style={styles.starButton}
                      onPress={() => setFeedbackRating(star)}
                    >
                      <Text style={[
                        styles.starIcon,
                        feedbackRating >= star ? styles.starFilled : styles.starEmpty
                      ]}>
                        ★
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
                                 <Text style={styles.ratingText}>
                   {feedbackRating === 0 ? t('aiCoaching.beta.feedbackModal.ratingLabels.select') :
                    feedbackRating === 1 ? t('aiCoaching.beta.feedbackModal.ratingLabels.poor') :
                    feedbackRating === 2 ? t('aiCoaching.beta.feedbackModal.ratingLabels.fair') :
                    feedbackRating === 3 ? t('aiCoaching.beta.feedbackModal.ratingLabels.good') :
                    feedbackRating === 4 ? t('aiCoaching.beta.feedbackModal.ratingLabels.veryGood') : t('aiCoaching.beta.feedbackModal.ratingLabels.excellent')}
                 </Text>
              </View>

                             {/* Feedback Text Input */}
               <View style={styles.feedbackInputSection}>
                 <Text style={styles.feedbackInputTitle}>{t('aiCoaching.beta.feedbackModal.feedbackTitle')}</Text>
                 <TextInput
                   style={styles.feedbackTextInput}
                   placeholder={t('aiCoaching.beta.feedbackModal.feedbackPlaceholder')}
                  placeholderTextColor={currentTheme.colors.textSecondary}
                  value={feedbackText}
                  onChangeText={setFeedbackText}
                  multiline={true}
                  numberOfLines={4}
                  textAlignVertical="top"
                />
              </View>
            </ScrollView>

            {/* Action Buttons */}
            <View style={styles.feedbackModalActions}>
                             <TouchableOpacity
                 style={styles.cancelButton}
                 onPress={closeFeedbackModal}
                 disabled={isSubmittingFeedback}
               >
                 <Text style={styles.cancelButtonText}>{t('aiCoaching.beta.feedbackModal.cancel')}</Text>
               </TouchableOpacity>
               <TouchableOpacity
                 style={[
                   styles.submitButton,
                   (feedbackRating === 0 || isSubmittingFeedback) && styles.submitButtonDisabled
                 ]}
                 onPress={submitFeedback}
                 disabled={feedbackRating === 0 || isSubmittingFeedback}
               >
                 <Text style={styles.submitButtonText}>
                   {isSubmittingFeedback ? t('aiCoaching.beta.feedbackModal.submitting') : t('aiCoaching.beta.feedbackModal.submit')}
                 </Text>
               </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const createStyles = (colors: any) => StyleSheet.create({
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
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.text,
  },
  betaTag: {
    backgroundColor: colors.primary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginLeft: 8,
  },
  betaText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: colors.background,
  },
  subtitle: {
    fontSize: 16,
    color: colors.textSecondary,
    marginBottom: 20,
  },
  tabScrollContainer: {
    marginHorizontal: -20,
  },
  tabContentContainer: {
    paddingHorizontal: 20,
    flexDirection: 'row',
    gap: 12,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    minWidth: 100,
  },
  activeTab: {
    backgroundColor: colors.primary,
  },
  tabIcon: {
    fontSize: 16,
    marginRight: 6,
  },
  activeTabIcon: {
    fontSize: 16,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  activeTabText: {
    color: colors.background,
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
  sessionTypeContainer: {
    marginBottom: 20,
  },
  sessionTypeRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  sessionTypeCard: {
    flex: 1,
    backgroundColor: colors.card,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  activeSessionTypeCard: {
    backgroundColor: colors.primary,
  },
  sessionIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  sessionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    textAlign: 'center',
  },


  insightsSection: {
    marginBottom: 24,
  },
  subsectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 12,
  },
  insightCard: {
    backgroundColor: colors.background,
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  insightText: {
    fontSize: 14,
    color: colors.text,
    marginBottom: 8,
    lineHeight: 20,
  },
  confidenceBadge: {
    alignSelf: 'flex-start',
    backgroundColor: colors.success,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  confidenceText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: colors.background,
  },
  recommendationsSection: {
    marginBottom: 24,
  },
  recommendationCard: {
    backgroundColor: colors.background,
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  recommendationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  recommendationTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text,
    flex: 1,
  },
  difficultyBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  difficultyText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: colors.background,
    textTransform: 'capitalize',
  },
  recommendationDescription: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 12,
    lineHeight: 20,
  },
  recommendationSteps: {
    gap: 4,
  },
  stepText: {
    fontSize: 14,
    color: colors.text,
  },
  exercisesSection: {
    marginBottom: 24,
  },
  exerciseCard: {
    backgroundColor: colors.background,
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  exerciseTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 8,
  },
  exerciseDescription: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 8,
    lineHeight: 20,
  },
  exerciseDuration: {
    fontSize: 12,
    color: colors.primary,
    fontWeight: '600',
  },
  strategiesGrid: {
    gap: 16,
  },
  strategyCard: {
    backgroundColor: colors.card,
    padding: 20,
    borderRadius: 16,
  },
  strategyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  strategyIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  strategyContent: {
    flex: 1,
  },
  strategyTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 4,
  },
  strategyCategory: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  impactBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  impactText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: colors.background,
  },
  strategyDescription: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 16,
    lineHeight: 20,
  },
  strategyMetrics: {
    marginBottom: 16,
    gap: 4,
  },
  metricText: {
    fontSize: 12,
    color: colors.text,
  },
  applyButton: {
    backgroundColor: colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  applyButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.background,
  },
  resilienceScoreCard: {
    backgroundColor: colors.card,
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
    marginBottom: 20,
  },
  resilienceScoreLabel: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 8,
  },
  resilienceScoreValue: {
    fontSize: 48,
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: 8,
  },
  resilienceScoreSubtext: {
    fontSize: 16,
    color: colors.text,
    marginBottom: 16,
  },
  resilienceProgress: {
    width: '100%',
    height: 8,
    backgroundColor: colors.border,
    borderRadius: 4,
    overflow: 'hidden',
  },
  resilienceProgressFill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 4,
  },
  trainingModules: {
    gap: 12,
  },
  moduleCard: {
    backgroundColor: colors.card,
    padding: 16,
    borderRadius: 12,
  },
  moduleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  moduleIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  moduleContent: {
    flex: 1,
  },
  moduleTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 4,
  },
  moduleProgress: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  moduleTime: {
    fontSize: 12,
    color: colors.primary,
    fontWeight: '600',
  },
  moduleDescription: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  plansContainer: {
    gap: 16,
  },
  planCard: {
    backgroundColor: colors.card,
    padding: 20,
    borderRadius: 16,
  },
  planHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  planTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
  },
  adaptiveBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  adaptiveText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: colors.background,
  },
  moodSchedule: {
    marginBottom: 16,
  },
  scheduleTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 12,
  },
  moodScheduleItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  moodState: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  moodTime: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  adaptiveElements: {
    backgroundColor: colors.background,
    padding: 12,
    borderRadius: 8,
  },
  adaptiveTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 8,
  },
  emptyState: {
    backgroundColor: colors.card,
    padding: 40,
    borderRadius: 16,
    alignItems: 'center',
  },
  emptyStateText: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
  },
  welcomeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  avatarContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatar: {
    fontSize: 28,
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.success,
  },
  welcomeText: {
    flex: 1,
  },
  welcomeTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 4,
  },
  welcomeSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  quickStartContainer: {
    marginBottom: 20,
  },
  quickStartTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 12,
  },
  quickStartGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
  },
  quickStartCard: {
    width: '48%', // Two cards per row
    backgroundColor: colors.card,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  activeQuickStartCard: {
    backgroundColor: colors.primary,
  },
  quickStartIcon: {
    fontSize: 28,
    marginBottom: 8,
  },
  quickStartLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    textAlign: 'center',
    marginBottom: 8,
  },
  quickStartTime: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  sessionContainer: {
    backgroundColor: colors.card,
    padding: 20,
    borderRadius: 16,
  },
  sessionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  sessionInfo: {
    flex: 1,
  },
  sessionType: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 4,
  },
  sessionDuration: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  closeButton: {
    padding: 8,
  },
  closeButtonText: {
    fontSize: 20,
    color: colors.textSecondary,
  },
  conversationContainer: {
    flex: 1,
    marginBottom: 20,
  },
  aiMessage: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  aiAvatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  aiAvatarText: {
    fontSize: 18,
  },
  messageBubble: {
    backgroundColor: colors.primaryLight,
    padding: 12,
    borderRadius: 12,
    maxWidth: '80%',
  },
  messageText: {
    fontSize: 14,
    color: colors.text,
    lineHeight: 20,
  },
  responseOptions: {
    marginBottom: 20,
  },
  responseTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 12,
  },
  responseButton: {
    backgroundColor: colors.primaryExtraLight,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 8,
    alignItems: 'center',
  },
  responseButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
  },
  progressContainer: {
    alignItems: 'center',
    marginTop: 20,
  },
  progressBar: {
    width: '100%',
    height: 8,
    backgroundColor: colors.border,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 4,
  },
  progressText: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 8,
  },
  sessionActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 20,
  },
  actionButton: {
    flex: 1,
    backgroundColor: colors.primaryExtraLight,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginHorizontal: 5,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
  },
  actionButtonActive: {
    backgroundColor: colors.primary,
  },
  recentSessions: {
    marginTop: 20,
  },
  recentTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 12,
  },
  recentList: {
    gap: 12,
  },
  recentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    padding: 16,
    borderRadius: 12,
  },
  recentIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  recentContent: {
    flex: 1,
  },
  recentSessionName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 4,
  },
  recentTime: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  recentScore: {
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.primary,
  },
  betaNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primaryExtraLight,
    padding: 12,
    borderRadius: 12,
    marginTop: 16,
    marginBottom: 20,
  },
  betaNoticeIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  betaNoticeContent: {
    flex: 1,
  },
  betaNoticeTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: 4,
  },
  betaNoticeText: {
    fontSize: 12,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  feedbackButton: {
    backgroundColor: colors.primary,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginTop: 12,
  },
  feedbackButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.background,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  feedbackModal: {
    backgroundColor: colors.card,
    borderRadius: 16,
    width: '90%',
    maxWidth: 400,
    overflow: 'hidden',
  },
  feedbackModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  feedbackModalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
  },
  closeModalButton: {
    padding: 8,
  },
  closeModalButtonText: {
    fontSize: 24,
    color: colors.textSecondary,
  },
  feedbackModalContent: {
    padding: 16,
  },
  feedbackModalSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 16,
    textAlign: 'center',
  },
  ratingSection: {
    alignItems: 'center',
    marginBottom: 20,
  },
  ratingTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 12,
  },
  ratingContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 12,
  },
  starButton: {
    padding: 8,
  },
  starIcon: {
    fontSize: 24,
  },
  starFilled: {
    color: colors.primary,
  },
  starEmpty: {
    color: colors.textSecondary,
  },
  ratingText: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  feedbackInputSection: {
    marginBottom: 20,
  },
  feedbackInputTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 8,
  },
  feedbackTextInput: {
    backgroundColor: colors.primaryExtraLight,
    padding: 12,
    borderRadius: 12,
    fontSize: 14,
    color: colors.text,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  feedbackModalActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: colors.primaryExtraLight,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginHorizontal: 5,
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
  },
  submitButton: {
    flex: 1,
    backgroundColor: colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginHorizontal: 5,
  },
  submitButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.background,
  },
     submitButtonDisabled: {
     backgroundColor: colors.textSecondary,
     opacity: 0.7,
   },
});