import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, FlatList, TextInput, SafeAreaView, TouchableOpacity, ScrollView, Modal, Dimensions } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { Search, Filter, Plus, MessageSquare, Users, Star, Target, Lightbulb, BookOpen, Users2, Heart, TrendingUp, Check, Edit, Trash2 } from 'lucide-react-native';
import { useHabits } from '@/context/HabitContext';
import { useTheme } from '@/context/ThemeContext';
import { useLanguage } from '@/context/LanguageContext';
import { useSubscription } from '@/context/SubscriptionContext';
import { useAuth } from '@/context/AuthContext';
import HabitSuggestion from '@/components/HabitSuggestion';
import HabitForm from '@/components/HabitForm';
import { habitCategories } from '@/data/habitSuggestions';
import { Habit, HabitSuggestion as HabitSuggestionType } from '@/types';
import AIHabitSuggestions from '@/components/AIHabitSuggestions';
import { AIHabitSuggestion } from '@/types';
import LibraryFeedbackModal from '@/components/LibraryFeedbackModal';
import LibraryAnalyticsService from '@/services/LibraryAnalyticsService';
import HabitCourses from '@/components/HabitCourses';
import GuidedSetupWizard from '@/components/GuidedSetupWizard';
import StudyGroups from '@/components/StudyGroups';
import PeerRecommendations from '@/components/PeerRecommendations';

export default function Library() {
  const router = useRouter();
  const { habits, addHabit, updateHabit, deleteHabit } = useHabits();
  const { currentTheme } = useTheme();
  const { t } = useLanguage();
  const { showUpgradePrompt } = useSubscription();
  const { user } = useAuth();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [showForm, setShowForm] = useState(false);
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null);
  const [showUserHabits, setShowUserHabits] = useState(true);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [showCourses, setShowCourses] = useState(false);
  const [showGuidedSetup, setShowGuidedSetup] = useState(false);
  const [selectedSetupId, setSelectedSetupId] = useState<string | null>(null);
  const [showStudyGroups, setShowStudyGroups] = useState(false);
  const [showPeerRecommendations, setShowPeerRecommendations] = useState(false);
  
  // Analytics tracking
  const visitStartTime = useRef<number>(Date.now());
  const userId = user?.id || 'anonymous';

  // Initialize analytics on component mount
  useEffect(() => {
    const initializeAnalytics = async () => {
      // console.log('🔍 Library: Initializing analytics for user:', userId);
      await LibraryAnalyticsService.initializeAnalytics(userId);
      await LibraryAnalyticsService.trackVisit(userId);
      // console.log('✅ Library: Analytics initialized successfully');
    };
    initializeAnalytics();
  }, [userId]);

  // Track time spent when component unmounts
  useEffect(() => {
    return () => {
      const timeSpent = Math.floor((Date.now() - visitStartTime.current) / 1000);
      if (timeSpent > 5) { // Only track if spent more than 5 seconds
        LibraryAnalyticsService.trackTimeSpent(userId, timeSpent);
      }
    };
  }, [userId]);

  const filteredCategories = activeCategory === 'all' 
    ? habitCategories 
    : habitCategories.filter(category => category.id === activeCategory);

  const handleAddHabit = async (habitTitle: string) => {
    const currentHabitsCount = habits?.length || 0;
    const habitId = Date.now().toString();
    
    addHabit({
      id: habitId,
      title: t(habitTitle), // ✅ Translate the title
      streak: 0,
      createdAt: new Date().toISOString(),
      completedToday: false,
      completedDates: [],
      reminderEnabled: false,
      order: currentHabitsCount,
    });

    // Track habit addition
    await LibraryAnalyticsService.trackHabitAdd(userId, habitId, t(habitTitle), 'suggestion');
  };

  const handleAddAISuggestion = async (suggestion: AIHabitSuggestion) => {
    const currentHabitsCount = habits?.length || 0;
    const habitId = Date.now().toString();
    
    addHabit({
      id: habitId,
      title: t(suggestion.title), // ✅ Translate the title
      notes: t(suggestion.description), // ✅ Also translate the description
      streak: 0,
      createdAt: new Date().toISOString(),
      completedToday: false,
      completedDates: [],
      reminderEnabled: false,
      category: suggestion.category,
      difficulty: 'easy',
      completionTimes: [],
      order: currentHabitsCount,
    });

    // Track AI suggestion addition
    await LibraryAnalyticsService.trackHabitAdd(userId, habitId, t(suggestion.title), 'ai');
    await LibraryAnalyticsService.trackAISuggestion(userId, 'add', suggestion.id);
  };

  const handleCreateHabit = async (habitData: Omit<Habit, 'id' | 'createdAt' | 'completedDates' | 'streak' | 'completedToday'>) => {
    const currentHabitsCount = habits?.length || 0;
    const habitId = Date.now().toString();
    
    addHabit({
      id: habitId,
      title: habitData.title,
      icon: habitData.icon,
      notes: habitData.notes,
      streak: 0,
      createdAt: new Date().toISOString(),
      completedToday: false,
      completedDates: [],
      reminderTime: habitData.reminderTime,
      reminderEnabled: habitData.reminderEnabled || false,
      order: currentHabitsCount,
    });

    // Track custom habit creation
    await LibraryAnalyticsService.trackHabitAdd(userId, habitId, habitData.title, 'custom');
    
    setShowForm(false);
    setEditingHabit(null);
  };

  const handleEditHabit = (habit: Habit) => {
    setEditingHabit(habit);
    setShowForm(true);
  };

  const handleSaveEdit = (habitData: Omit<Habit, 'id' | 'createdAt' | 'completedDates' | 'streak' | 'completedToday'>) => {
    if (!editingHabit) return;
    
    updateHabit(editingHabit.id, {
      ...editingHabit,
      title: habitData.title,
      icon: habitData.icon,
      notes: habitData.notes,
      reminderTime: habitData.reminderTime,
      reminderEnabled: habitData.reminderEnabled || false,
      order: editingHabit.order || 0,
    });
    
    setShowForm(false);
    setEditingHabit(null);
  };

  const handleDeleteHabit = (habitId: string) => {
    deleteHabit(habitId);
  };

  const filteredUserHabits = habits?.filter(habit => 
    habit.title.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  // Track search queries
  useEffect(() => {
    if (searchQuery.trim()) {
      LibraryAnalyticsService.trackSearch(userId, searchQuery.trim());
    }
  }, [searchQuery, userId]);

  // Track tab switching
  const handleTabSwitch = async (tab: 'my_habits' | 'suggestions' | 'courses' | 'study_groups' | 'recommendations') => {
    // console.log('🔄 Library: Switching to tab:', tab);
    setShowUserHabits(tab === 'my_habits');
    setShowCourses(tab === 'courses');
    setShowStudyGroups(tab === 'study_groups');
    setShowPeerRecommendations(tab === 'recommendations');
    await LibraryAnalyticsService.trackTabUsage(userId, tab === 'courses' ? 'suggestions' : (tab === 'study_groups' || tab === 'recommendations' ? 'suggestions' : tab));
    // console.log('✅ Library: Tab switched successfully');
  };

  // Track category viewing
  const handleCategorySelect = async (categoryId: string) => {
    setActiveCategory(categoryId);
    if (categoryId !== 'all') {
      const category = habitCategories.find(cat => cat.id === categoryId);
      if (category) {
        await LibraryAnalyticsService.trackCategoryView(userId, categoryId, t(category.name));
      }
    }
  };

  // Navigation functions for quick action buttons
  const handleSetGoals = () => {
    setShowStudyGroups(true);
    setShowUserHabits(false);
    setShowCourses(false);
    setShowPeerRecommendations(false);
  };

  const handleViewStats = () => {
    router.push('/(tabs)/stats');
  };

  const userHabitSuggestions: HabitSuggestionType[] = filteredUserHabits.map(habit => ({
    id: habit.id,
    title: habit.title,
    description: habit.notes || t('noDescription'),
  }));

  const styles = createStyles(currentTheme.colors);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style={currentTheme.isDark ? 'light' : 'dark'} />
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Text style={styles.title}>{t('habit_library')}</Text>
          <Text style={styles.subtitle}>{t('discover_manage_habits')}</Text>
        </View>
        <TouchableOpacity 
          style={styles.feedbackButton}
          onPress={() => setShowFeedbackModal(true)}
        >
          <MessageSquare size={20} color={currentTheme.colors.primary} />
        </TouchableOpacity>
      </View>



      <View style={styles.searchContainer}>
        <Search size={20} color={currentTheme.colors.textSecondary} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder={t('search_habits')}
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholderTextColor={currentTheme.colors.textMuted}
        />
      </View>

      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, showUserHabits && !showCourses && styles.activeTab]}
          onPress={() => {
            setShowUserHabits(true);
            setShowCourses(false);
            setShowStudyGroups(false);
            setShowPeerRecommendations(false);
            handleTabSwitch('my_habits');
          }}
          accessibilityLabel={t('my_habits')}
          accessibilityRole="tab"
          accessibilityState={{ selected: showUserHabits && !showCourses }}
        >
          <Target 
            size={22} 
            color={showUserHabits && !showCourses ? currentTheme.colors.primary : currentTheme.colors.textSecondary} 
          />
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, (!showUserHabits && !showCourses && !showStudyGroups && !showPeerRecommendations) && styles.activeTab]}
          onPress={() => {
            setShowUserHabits(false);
            setShowCourses(false);
            setShowStudyGroups(false);
            setShowPeerRecommendations(false);
            handleTabSwitch('suggestions');
          }}
          accessibilityLabel={t('suggestions')}
          accessibilityRole="tab"
          accessibilityState={{ selected: (!showUserHabits && !showCourses && !showStudyGroups && !showPeerRecommendations) }}
        >
          <Lightbulb 
            size={22} 
            color={(!showUserHabits && !showCourses && !showStudyGroups && !showPeerRecommendations) ? currentTheme.colors.primary : currentTheme.colors.textSecondary} 
          />
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, showCourses && styles.activeTab]}
          onPress={() => {
            setShowCourses(true);
            setShowUserHabits(false);
            setShowStudyGroups(false);
            setShowPeerRecommendations(false);
            handleTabSwitch('courses');
          }}
          accessibilityLabel={t('courses_tab')}
          accessibilityRole="tab"
          accessibilityState={{ selected: showCourses }}
        >
          <View style={styles.tabContent}>
            <BookOpen 
              size={22} 
              color={showCourses ? currentTheme.colors.primary : currentTheme.colors.textSecondary} 
            />
            <Text style={[styles.betaLabel, { color: showCourses ? currentTheme.colors.primary : currentTheme.colors.textSecondary }]}>
              Beta
            </Text>
          </View>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, showStudyGroups && styles.activeTab]}
          onPress={() => {
            setShowUserHabits(false);
            setShowCourses(false);
            setShowStudyGroups(true);
            setShowPeerRecommendations(false);
            handleTabSwitch('study_groups');
          }}
          accessibilityLabel={t('study_groups')}
          accessibilityRole="tab"
          accessibilityState={{ selected: showStudyGroups }}
        >
          <View style={styles.tabContent}>
            <Users2 
              size={22} 
              color={showStudyGroups ? currentTheme.colors.primary : currentTheme.colors.textSecondary} 
            />
            <Text style={[styles.betaLabel, { color: showStudyGroups ? currentTheme.colors.primary : currentTheme.colors.textSecondary }]}>
              Beta
            </Text>
          </View>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, showPeerRecommendations && styles.activeTab]}
          onPress={() => {
            setShowUserHabits(false);
            setShowCourses(false);
            setShowStudyGroups(false);
            setShowPeerRecommendations(true);
            handleTabSwitch('recommendations');
          }}
          accessibilityLabel={t('recommendations')}
          accessibilityRole="tab"
          accessibilityState={{ selected: showPeerRecommendations }}
        >
          <Heart 
            size={22} 
            color={showPeerRecommendations ? currentTheme.colors.primary : currentTheme.colors.textSecondary} 
          />
        </TouchableOpacity>
      </View>

      {showUserHabits ? (
        <ScrollView 
          style={styles.habitsContainer}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.habitsContent}
        >
          {/* Daily Progress Overview */}
          <View style={styles.dailyProgressCard}>
            <View style={styles.progressHeader}>
              <Text style={styles.progressTitle}>{t('today_progress')}</Text>
              <Text style={styles.progressDate}>
                {(() => {
                  const date = new Date();
                  const { currentLanguage } = useLanguage();
                  const weekday = t(['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][date.getDay()]);
                  const month = t(['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december'][date.getMonth()]);
                  const day = date.getDate();
                  
                  // Format based on language
                  if (currentLanguage.code === 'zh') {
                    return `${weekday}，${month} ${day}日`;
                  } else {
                    return `${weekday}, ${month} ${day}`;
                  }
                })()}
              </Text>
            </View>
            
            <View style={styles.progressCircle}>
              <View style={styles.circleBackground}>
                <View style={[styles.circleProgress, { 
                  width: `${Math.min(100, (habits?.filter(h => h.completedToday).length || 0) / Math.max(1, habits?.length || 1) * 100)}%` 
                }]} />
                <View style={styles.circleContent}>
                  <Text style={styles.completedCount}>{habits?.filter(h => h.completedToday).length || 0}</Text>
                  <Text style={styles.totalCount}>/ {habits?.length || 0}</Text>
                </View>
              </View>
            </View>
            
            <View style={styles.streakContainer}>
              <Text style={styles.streakLabel}>{t('current_streak')}</Text>
              <Text style={styles.streakCount}>
                {habits && habits.length > 0 
                  ? Math.max(...habits.map(h => h.streak || 0)) 
                  : 0
                } {t('days')}
              </Text>
            </View>
          </View>

          {/* Quick Actions */}
          <View style={styles.quickActionsContainer}>
            <TouchableOpacity 
              style={styles.quickActionButton}
              onPress={() => {
                setEditingHabit(null);
                setShowForm(true);
              }}
            >
              <View style={styles.actionIcon}>
                <Plus size={24} color={currentTheme.colors.primary} />
              </View>
              <Text style={styles.actionText}>{t('add_new_habit')}</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.quickActionButton}
              onPress={handleSetGoals}
            >
              <View style={styles.actionIcon}>
                <Target size={24} color={currentTheme.colors.primary} />
              </View>
              <Text style={styles.actionText}>{t('set_goals')}</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.quickActionButton}
              onPress={handleViewStats}
            >
              <View style={styles.actionIcon}>
                <TrendingUp size={24} color={currentTheme.colors.primary} />
              </View>
              <Text style={styles.actionText}>{t('view_stats')}</Text>
            </TouchableOpacity>
          </View>

          {/* AI Suggestions */}
          <View style={styles.sectionContainer}>
            <AIHabitSuggestions 
              onAddSuggestion={handleAddAISuggestion} 
              onEditHabit={handleEditHabit}
            />
          </View>

          {/* Your Habits */}
          {filteredUserHabits.length > 0 ? (
            <View style={styles.sectionContainer}>
                              <View style={styles.habitsGrid}>
                  {filteredUserHabits.map((habit) => {
                    const userHabit = habits?.find(h => h.id === habit.id);
                    return (
                      <View key={habit.id} style={styles.dashboardHabitCard}>
                        <View style={styles.dashboardHabitHeader}>
                          <View style={styles.dashboardHabitIcon}>
                            {habit.icon ? (
                              <Text style={styles.dashboardHabitIconText}>{habit.icon}</Text>
                            ) : (
                              <Target size={16} color={currentTheme.colors.primary} />
                            )}
                          </View>
                          <View style={styles.dashboardHabitInfo}>
                            <Text style={styles.dashboardHabitTitle}>{habit.title}</Text>
                            <Text style={styles.dashboardHabitStreak}>🔥 {userHabit?.streak || 0} {t('days')}</Text>
                          </View>
                          <View style={styles.dashboardHabitButtons}>
                            <TouchableOpacity 
                              style={styles.dashboardEditButton}
                              onPress={() => handleEditHabit(habit)}
                            >
                              <Edit size={16} color={currentTheme.colors.background} />
                            </TouchableOpacity>
                            <TouchableOpacity 
                              style={styles.dashboardDeleteButton}
                              onPress={() => handleDeleteHabit(habit.id)}
                            >
                              <Trash2 size={16} color={currentTheme.colors.background} />
                            </TouchableOpacity>
                          </View>
                        </View>
                        
                        <View style={styles.dashboardHabitProgress}>
                          <View style={styles.dashboardProgressCircle}>
                            <View style={styles.dashboardProgressCircleBackground}>
                              <View style={[
                                styles.dashboardProgressCircleFill, 
                                { 
                                  opacity: Math.min(1, (userHabit?.streak || 0) / 7),
                                  transform: [{ scale: Math.min(1, (userHabit?.streak || 0) / 7) }]
                                }
                              ]} />
                            </View>
                            <View style={styles.dashboardProgressCircleContent}>
                              <Text style={styles.dashboardProgressCircleText}>
                                {Math.min(7, userHabit?.streak || 0)}/7
                              </Text>
                            </View>
                          </View>
                          <Text style={styles.dashboardProgressText}>{t('week_progress')}</Text>
                        </View>
                      </View>
                    );
                  })}
                </View>
            </View>
          ) : (
            <View style={styles.emptyStateContainer}>
              <View style={styles.emptyStateContent}>
                <View style={styles.emptyStateIcon}>
                  <Target size={48} color={currentTheme.colors.textSecondary} />
                </View>
                <Text style={styles.emptyStateTitle}>{t('no_habits_yet')}</Text>
                <Text style={styles.emptyStateSubtitle}>{t('start_building')}</Text>
                
                <TouchableOpacity 
                  style={styles.primaryButton}
                  onPress={() => {
                    setEditingHabit(null);
                    setShowForm(true);
                  }}
                >
                  <Plus size={20} color={currentTheme.colors.background} />
                  <Text style={styles.primaryButtonText}>{t('create_first_habit')}</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Motivation Section */}
          <View style={styles.motivationCard}>
            <Text style={styles.motivationTitle}>{t('keep_going')}</Text>
            <Text style={styles.motivationText}>
              "{t('motivation_quote')}"
            </Text>
          </View>
        </ScrollView>
      ) : showCourses ? (
        <HabitCourses
          onCourseSelect={(course) => {
            // Handle course selection - could open course detail modal
            // console.log('Course selected:', course.title);
          }}
          onGuidedSetupSelect={(setupId) => {
            setSelectedSetupId(setupId);
            setShowGuidedSetup(true);
          }}
        />
              ) : showStudyGroups ? (
        <StudyGroups />
      ) : showPeerRecommendations ? (
        <PeerRecommendations />
      ) : (
        <>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoryContainer}
          >
            <TouchableOpacity
              style={[
                styles.categoryPill,
                activeCategory === 'all' && styles.activeCategoryPill,
              ]}
              onPress={() => handleCategorySelect('all')}
            >
              <Text
                style={[
                  styles.categoryText,
                  activeCategory === 'all' && styles.activeCategoryText,
                ]}
              >
                {t('all')}
              </Text>
            </TouchableOpacity>
            {habitCategories.map((category) => (
              <TouchableOpacity
                key={category.id}
                style={[
                  styles.categoryPill,
                  activeCategory === category.id && styles.activeCategoryPill,
                ]}
                onPress={() => handleCategorySelect(category.id)}
              >
                <Text
                  style={[
                    styles.categoryText,
                    activeCategory === category.id && styles.activeCategoryText,
                  ]}
                >
                  {t(category.name)}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listContent}
            nestedScrollEnabled={true}
          >
            {filteredCategories.map((item) => (
              <View key={item.id} style={styles.categorySection}>
                <Text style={styles.categoryTitle}>{t(item.name)}</Text>
                {item.habits
                  .filter(habit => 
                    habit.title.toLowerCase().includes(searchQuery.toLowerCase())
                  )
                  .map((habit) => (
                    <HabitSuggestion
                      key={habit.id}
                      habit={habit}
                      onAdd={() => handleAddHabit(habit.title)}
                    />
                  ))}
              </View>
            ))}
          </ScrollView>
        </>
      )}

      <HabitForm
        visible={showForm}
        onClose={() => {
          setShowForm(false);
          setEditingHabit(null);
        }}
        onSave={editingHabit ? handleSaveEdit : handleCreateHabit}
        initialValues={editingHabit ? {
          title: editingHabit.title,
          icon: editingHabit.icon,
          notes: editingHabit.notes,
          reminderTime: editingHabit.reminderTime,
          reminderEnabled: editingHabit.reminderEnabled,
          order: editingHabit.order || 0,
        } : undefined}
        isEditing={!!editingHabit}
      />

              {/* Feedback Modal */}
        <LibraryFeedbackModal
          visible={showFeedbackModal}
          onClose={() => setShowFeedbackModal(false)}
        />

        {/* Guided Setup Wizard */}
        <GuidedSetupWizard
          visible={showGuidedSetup}
          onClose={() => setShowGuidedSetup(false)}
          setupId={selectedSetupId || undefined}
        />
      </SafeAreaView>
  );
}

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

const createStyles = (colors: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingTop: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
  },
  headerContent: {
    flex: 1,
  },
  feedbackButton: {
    padding: 8,
    backgroundColor: colors.surface,
    borderRadius: 8,
    marginLeft: 12,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.text,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: colors.textSecondary,
    marginBottom: 8,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: 16,
    marginHorizontal: 16,
    paddingHorizontal: 16,
    height: 52,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    height: '100%',
    fontSize: 16,
    color: colors.text,
  },
  tabContainer: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginTop: 20,
    marginBottom: 16,
    borderRadius: 16,
    backgroundColor: colors.surface,
    padding: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    minHeight: 48,
  },
  activeTab: {
    backgroundColor: colors.card,
    shadowColor: colors.primary,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  tabContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  betaLabel: {
    fontSize: 8,
    fontWeight: '600',
    marginTop: 2,
    textTransform: 'uppercase',
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    borderRadius: 16,
    marginHorizontal: 16,
    marginVertical: 20,
    paddingVertical: 16,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  createButtonText: {
    color: colors.background,
    fontSize: 16,
    fontWeight: '700',
    marginLeft: 8,
  },
  categoryContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingBottom: 20,
    marginBottom: 16,
  },
  categoryPill: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    backgroundColor: colors.surface,
    borderRadius: 16,
    marginRight: 10,
    minHeight: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  activeCategoryPill: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
    shadowColor: colors.primary,
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 6,
  },
  categoryText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
    textAlign: 'center',
  },
  activeCategoryText: {
    color: colors.background,
  },
  categorySection: {
    marginBottom: 24,
  },
  categoryTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 12,
    paddingHorizontal: 16,
  },
  listContent: {
    paddingBottom: 32,
    flexGrow: 1,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingTop: 20,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  placeholderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  placeholderTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
  },
  placeholderText: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  placeholderButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  placeholderButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
  },
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  modalContent: {
    flex: 1,
    padding: 16,
  },
  featureList: {
    marginTop: 16,
  },
  featureItem: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 8,
  },
  habitsContainer: {
    flex: 1,
    backgroundColor: colors.background,
    paddingTop: 20,
  },
  habitsContent: {
    paddingBottom: 32,
    minHeight: screenHeight * 0.8,
  },
  dailyProgressCard: {
    backgroundColor: colors.card,
    borderRadius: 14,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 16,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: colors.border,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  progressTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    textShadowColor: colors.primary,
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  progressDate: {
    fontSize: 13,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  progressCircle: {
    alignItems: 'center',
    marginBottom: 10,
  },
  circleBackground: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.border,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  circleProgress: {
    width: '100%',
    height: '100%',
    borderRadius: 38,
    backgroundColor: colors.primary,
    position: 'absolute',
    top: 0,
    left: 0,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 2,
  },
  circleContent: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  completedCount: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.text,
    textShadowColor: colors.primary,
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
    textAlign: 'center',
    lineHeight: 20,
  },
  totalCount: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '500',
    textAlign: 'center',
    lineHeight: 12,
  },
  streakContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
  },
  streakLabel: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  streakCount: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.primary,
  },
  quickActionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginHorizontal: 16,
    marginBottom: 20,
    gap: 10,
  },
  quickActionButton: {
    alignItems: 'center',
    width: (screenWidth - 64) / 3,
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: colors.border,
  },
  actionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  actionText: {
    fontSize: 11,
    color: colors.textSecondary,
    textAlign: 'center',
    fontWeight: '600',
  },
  sectionContainer: {
    marginBottom: 28,
  },
  sectionHeader: {
    marginBottom: 16,
    paddingHorizontal: 16,
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    borderLeftWidth: 4,
    borderLeftColor: colors.primary,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 6,
  },
  sectionSubtitle: {
    fontSize: 15,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  habitsGrid: {
    paddingHorizontal: 16,
  },
  habitCard: {
    backgroundColor: colors.card,
    borderRadius: 16,
    width: (screenWidth - 64) / 2 - 6,
    marginBottom: 16,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: colors.border,
  },
  habitHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  habitIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  habitIconText: {
    fontSize: 20,
    color: colors.primary,
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
  habitStreak: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  completionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  completionText: {
    color: colors.background,
    fontSize: 14,
    fontWeight: '700',
  },
  completedButton: {
    backgroundColor: colors.success || '#10B981',
    shadowColor: colors.success || '#10B981',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  habitProgress: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  progressBar: {
    height: 10,
    backgroundColor: colors.surface,
    borderRadius: 5,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  progressFill: {
    height: '100%',
    borderRadius: 5,
    backgroundColor: colors.primary,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
    elevation: 1,
  },
  progressText: {
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 8,
  },
  emptyStateContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
    backgroundColor: colors.background,
    minHeight: screenHeight * 0.4,
  },
  emptyStateContent: {
    alignItems: 'center',
  },
  emptyStateIcon: {
    marginBottom: 20,
    backgroundColor: colors.surface,
    borderRadius: 30,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  emptyStateTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 8,
  },
  emptyStateSubtitle: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 25,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 28,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 6,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  primaryButtonText: {
    color: colors.background,
    fontSize: 16,
    fontWeight: '700',
    marginLeft: 8,
  },
  motivationCard: {
    backgroundColor: colors.card,
    borderRadius: 20,
    padding: 24,
    marginHorizontal: 16,
    marginTop: 24,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  motivationTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 8,
  },
  motivationText: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  // Dashboard-style habit card styles
  dashboardHabitCard: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
    borderWidth: 1,
    borderColor: colors.border,
  },
  dashboardHabitHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  dashboardHabitIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  dashboardHabitIconText: {
    fontSize: 16,
    color: colors.primary,
  },
  dashboardHabitInfo: {
    flex: 1,
    marginRight: 8,
  },
  dashboardHabitTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  dashboardHabitStreak: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  dashboardHabitActions: {
    alignItems: 'center',
  },
  dashboardCompletionButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
  },
  dashboardCompletionText: {
    color: colors.background,
    fontSize: 16,
    fontWeight: '700',
  },
  dashboardCompletedButton: {
    backgroundColor: colors.success || '#10B981',
    shadowColor: colors.success || '#10B981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  dashboardHabitProgress: {
    marginBottom: 8,
  },
  dashboardProgressBar: {
    height: 8,
    backgroundColor: colors.surface,
    borderRadius: 4,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  dashboardProgressFill: {
    height: '100%',
    borderRadius: 4,
    backgroundColor: colors.primary,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
    elevation: 1,
  },
  dashboardProgressText: {
    fontSize: 11,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 4,
    fontWeight: '500',
  },
  dashboardProgressCircle: {
    width: 32,
    height: 32,
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dashboardProgressCircleBackground: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.surface,
    borderWidth: 2,
    borderColor: colors.primary,
    position: 'absolute',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  dashboardProgressCircleFill: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primary,
    position: 'absolute',
    top: 0,
    left: 0,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
    elevation: 1,
  },
  dashboardProgressCircleContent: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dashboardProgressCircleText: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.text,
  },
  dashboardHabitButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
  },
  dashboardEditButton: {
    width: 36,
    height: 36,
    backgroundColor: colors.primary,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },

  dashboardDeleteButton: {
    width: 36,
    height: 36,
    backgroundColor: colors.error || '#EF4444',
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.error || '#EF4444',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },

});
