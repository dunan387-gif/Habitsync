import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, FlatList, Modal } from 'react-native';
import { useTheme } from '@/context/ThemeContext';
import { useLanguage } from '@/context/LanguageContext';
import { useSubscription } from '@/context/SubscriptionContext';
import { WellnessIntegrationService, SleepData, ExerciseData, NutritionData, MeditationData, SocialActivityData, WellnessCorrelation } from '@/services/WellnessIntegrationService';
import { MoodEntry } from '@/types';
import { Moon, Activity, Heart, Brain, Users, TrendingUp, AlertCircle, Plus, ArrowLeft, Calendar, Clock, Star, Crown } from 'lucide-react-native';

// Import the tracking forms
import SleepTrackingForm from './SleepTrackingForm';
import ExerciseTrackingForm from './ExerciseTrackingForm';
import NutritionTrackingForm from './NutritionTrackingForm';
import MeditationTrackingForm from './MeditationTrackingForm';
import SocialActivityTrackingForm from './SocialActivityTrackingForm';

interface WellnessIntegrationDashboardProps {
  moodData: MoodEntry[];
}

export default function WellnessIntegrationDashboard({ moodData }: WellnessIntegrationDashboardProps) {
  const { currentTheme } = useTheme();
  const { t } = useLanguage();
  const { canUseWellnessIntegration, showUpgradePrompt, isUpgradeTestingEnabled } = useSubscription();
  
  // Safety check for currentTheme
  if (!currentTheme || !currentTheme.colors) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>Loading...</Text>
      </View>
    );
  }
  
  const [sleepData, setSleepData] = useState<SleepData[]>([]);
  const [exerciseData, setExerciseData] = useState<ExerciseData[]>([]);
  const [nutritionData, setNutritionData] = useState<NutritionData[]>([]);
  const [meditationData, setMeditationData] = useState<MeditationData[]>([]);
  const [socialData, setSocialData] = useState<SocialActivityData[]>([]);
  const [selectedTab, setSelectedTab] = useState('overview');
  const [showDropdown, setShowDropdown] = useState(false);
  const [correlations, setCorrelations] = useState<WellnessCorrelation[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState<string | null>(null);

  const styles = createStyles(currentTheme.colors);

  // Check if user can access wellness integration
  // For closed testing, allow all features
  if (isUpgradeTestingEnabled && !canUseWellnessIntegration()) {
    return (
      <View style={styles.upgradeContainer}>
        <Crown size={48} color={currentTheme.colors.primary} />
        <Text style={styles.upgradeTitle}>{t('wellness.upgradeRequired')}</Text>
        <Text style={styles.upgradeMessage}>{t('wellness.upgradeMessage')}</Text>
        <TouchableOpacity 
          style={styles.upgradeButton}
          onPress={() => showUpgradePrompt('wellness_integration')}
        >
                      <Text style={styles.upgradeButtonText}>{t('premium.upgradeToPro')}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  useEffect(() => {
    loadWellnessData();
    // console.log('WellnessIntegrationDashboard - moodData changed or component mounted, refreshing data');
  }, [moodData.length]); // Keep this dependency on length only

  const loadWellnessData = async () => {
    try {
      setLoading(true);
          // console.log('Loading wellness data...');
    // console.log('Mood data received:', moodData.length, 'entries');
      
      // Add timeout protection
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Wellness data loading timed out')), 15000); // Increased timeout
      });
      
      // Log mood data details for debugging
      // console.log('Mood data details:', moodData.map(m => ({
      //   date: m.date,
      //   moodState: m.moodState,
      //   intensity: m.intensity
      // })));
      
      const [sleep, exercise, nutrition, meditation, social] = await Promise.race([
        Promise.all([
          WellnessIntegrationService.getSleepData(),
          WellnessIntegrationService.getExerciseData(),
          WellnessIntegrationService.getNutritionData(),
          WellnessIntegrationService.getMeditationData(),
          WellnessIntegrationService.getSocialActivityData()
        ]),
        timeoutPromise
      ]) as [SleepData[], ExerciseData[], NutritionData[], MeditationData[], SocialActivityData[]];

      // console.log('Wellness data loaded:', {
      //   sleep: sleep.length,
      //   exercise: exercise.length,
      //   nutrition: nutrition.length,
      //   meditation: meditation.length,
      //   social: social.length
      // });

      setSleepData(sleep);
      setExerciseData(exercise);
      setNutritionData(nutrition);
      setMeditationData(meditation);
      setSocialData(social);

      // Calculate correlations with debouncing
      // console.log('Calculating correlations...');
      const sleepCorr = await WellnessIntegrationService.analyzeSleepMoodCorrelation(sleep, moodData);
      const exerciseCorr = await WellnessIntegrationService.analyzeExerciseMoodCorrelation(exercise, moodData);
      const nutritionCorr = await WellnessIntegrationService.analyzeNutritionMoodCorrelation(nutrition, moodData);
      const meditationCorr = await WellnessIntegrationService.analyzeMeditationEffectiveness(meditation);
      const socialCorr = await WellnessIntegrationService.analyzeSocialActivityCorrelation(social);

      const newCorrelations = [sleepCorr, exerciseCorr, nutritionCorr, meditationCorr, socialCorr];
      // console.log('Correlations calculated:', newCorrelations.map(c => ({
      //   type: c.type,
      //   strength: c.correlationStrength,
      //   dataPoints: c.dataPoints
      // })));
      
      // Only update correlations if they've actually changed
      setCorrelations(prev => {
        const hasChanged = JSON.stringify(prev) !== JSON.stringify(newCorrelations);
        if (hasChanged) {
          // console.log('Correlations updated in state');
          return newCorrelations;
        }
        // console.log('Correlations unchanged, skipping state update');
        return prev;
      });
    } catch (error) {
      console.error('Error loading wellness data:', error);
      Alert.alert(t('common.error'), t('wellness.loadError'));
    } finally {
      setLoading(false);
    }
  };

  const getCorrelationColor = (strength: number) => {
    if (strength > 0.7) return currentTheme.colors.success;
    if (strength > 0.4) return currentTheme.colors.warning;
    if (strength > 0) return currentTheme.colors.accent;
    return currentTheme.colors.error;
  };

  const getCorrelationIcon = (type: string) => {
    switch (type) {
      case 'sleep': return Moon;
      case 'exercise': return Activity;
      case 'nutrition': return Heart;
      case 'meditation': return Brain;
      case 'social': return Users;
      default: return TrendingUp;
    }
  };

  const getTabDisplayName = (tab: string) => {
    const tabData = {
      overview: { icon: '📊', label: t('wellness.overview') },
      sleep: { icon: '🌙', label: t('wellness.sleep') },
      exercise: { icon: '💪', label: t('wellness.exercise') },
      nutrition: { icon: '🍎', label: t('wellness.nutrition') },
      meditation: { icon: '🧘', label: t('wellness.meditation') },
      social: { icon: '👥', label: t('wellness.social') }
    };
    const tabInfo = tabData[tab as keyof typeof tabData];
    return tabInfo ? `${tabInfo.icon} ${tabInfo.label}` : t('wellness.selectCategory');
  };

  const getActivityTypeLabel = (type: string, category: string) => {
    switch (category) {
      case 'exercise':
        switch (type) {
          case 'cardio': return t('wellnessForms.exercise.types.cardio');
          case 'strength': return t('wellnessForms.exercise.types.strength');
          case 'yoga': return t('wellnessForms.exercise.types.yoga');
          case 'walking': return t('wellnessForms.exercise.types.walking');
          case 'sports': return t('wellnessForms.exercise.types.sports');
          case 'other': return t('wellnessForms.exercise.types.other');
          default: return t('wellness.exercise');
        }
      case 'meditation':
        switch (type) {
          case 'mindfulness': return t('wellnessForms.meditation.types.mindfulness');
          case 'breathing': return t('wellnessForms.meditation.types.breathing');
          case 'guided': return t('wellnessForms.meditation.types.guided');
          case 'movement': return t('wellnessForms.meditation.types.movement');
          case 'other': return t('wellnessForms.meditation.types.other');
          default: return t('wellness.meditation');
        }
      case 'social':
        switch (type) {
          case 'family_time': return t('wellnessForms.social.activityTypes.familyTime');
          case 'friends_hangout': return t('wellnessForms.social.activityTypes.friends');
          case 'date_night': return t('wellnessForms.social.activityTypes.dateNight');
          case 'party': return t('wellnessForms.social.activityTypes.party');
          case 'networking': return t('wellnessForms.social.activityTypes.networking');
          case 'team_building': return t('wellnessForms.social.activityTypes.teamBuilding');
          case 'community_event': return t('wellnessForms.social.activityTypes.community');
          case 'volunteer_work': return t('wellnessForms.social.activityTypes.volunteer');
          case 'group_hobby': return t('wellnessForms.social.activityTypes.groupHobby');
          default: return t('wellness.social');
        }
      default:
        return type;
    }
  };

  const renderTabBar = () => (
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
          onPress={() => setShowDropdown(false)}
        >
          <View style={styles.modalDropdownMenu}>
            <ScrollView
              style={styles.modalDropdownScroll}
              showsVerticalScrollIndicator={false}
            >
              {['overview', 'sleep', 'exercise', 'nutrition', 'meditation', 'social'].map((tab) => {
                const Icon = getCorrelationIcon(tab === 'overview' ? 'default' : tab);
                return (
                  <TouchableOpacity
                    key={tab}
                    style={[styles.dropdownItem, selectedTab === tab && styles.activeDropdownItem]}
                    onPress={() => {
                      setSelectedTab(tab as any);
                      setShowDropdown(false);
                    }}
                  >
                    <Icon size={20} color={selectedTab === tab ? 'white' : currentTheme.colors.textSecondary} />
                    <Text style={[styles.dropdownItemText, selectedTab === tab && styles.activeDropdownItemText]}>
                      {t(`wellness.${tab}`)}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );

  const renderOverview = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{t('wellness.correlationOverview')}</Text>
      <View style={styles.correlationGrid}>
        {correlations.map((correlation, index) => {
          const Icon = getCorrelationIcon(correlation.type);
          return (
            <View key={index} style={styles.correlationCard}>
              <View style={styles.correlationHeader}>
                <Icon size={24} color={getCorrelationColor(Math.abs(correlation.correlationStrength))} />
                <Text style={styles.correlationType}>{t(`wellness.${correlation.type}`)}</Text>
              </View>
              <Text style={[styles.correlationStrength, { color: getCorrelationColor(Math.abs(correlation.correlationStrength)) }]}>
                {(correlation.correlationStrength * 100).toFixed(0)}%
              </Text>
              <Text style={styles.correlationLabel}>
                {correlation.correlationStrength > 0 ? t('wellness.positiveImpact') : t('wellness.negativeImpact')}
              </Text>
              <Text style={styles.dataPoints}>
                {correlation.dataPoints} {t('wellness.dataPoints')}
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );

  const renderInsights = (correlation: WellnessCorrelation) => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{t('wellness.insights')}</Text>
      
      {correlation.insights.positive_patterns.length > 0 && (
        <View style={styles.insightCard}>
          <View style={styles.insightHeader}>
            <TrendingUp size={20} color={currentTheme.colors.success} />
            <Text style={styles.insightTitle}>{t('wellness.positivePatterns')}</Text>
          </View>
          {correlation.insights.positive_patterns.map((pattern, index) => (
            <Text key={index} style={styles.insightText}>• {t(pattern)}</Text>
          ))}
        </View>
      )}

      {correlation.insights.negative_patterns.length > 0 && (
        <View style={styles.insightCard}>
          <View style={styles.insightHeader}>
            <AlertCircle size={20} color={currentTheme.colors.warning} />
            <Text style={styles.insightTitle}>{t('wellness.negativePatterns')}</Text>
          </View>
          {correlation.insights.negative_patterns.map((pattern, index) => (
            <Text key={index} style={styles.insightText}>• {t(pattern)}</Text>
          ))}
        </View>
      )}

      {correlation.insights.recommendations.length > 0 && (
        <View style={styles.insightCard}>
          <View style={styles.insightHeader}>
            <Brain size={20} color={currentTheme.colors.primary} />
            <Text style={styles.insightTitle}>{t('wellness.recommendations')}</Text>
          </View>
          {correlation.insights.recommendations.map((rec, index) => {
            // Handle translation keys with parameters (e.g., "wellness.insightsData.exercise.mostEffective:cardio")
            if (rec.includes(':')) {
              const [key, param] = rec.split(':');
              // Determine the category from the key to translate the parameter
              let translatedParam = param;
              if (key.includes('exercise.mostEffective')) {
                translatedParam = getActivityTypeLabel(param, 'exercise');
              } else if (key.includes('meditation.mostEffective')) {
                translatedParam = getActivityTypeLabel(param, 'meditation');
              } else if (key.includes('social.mostBeneficial')) {
                translatedParam = getActivityTypeLabel(param, 'social');
              }
              return (
                <Text key={index} style={styles.insightText}>
                  • {t(key, { type: translatedParam, technique: translatedParam })}
                </Text>
              );
            }
            return (
              <Text key={index} style={styles.insightText}>
                • {t(rec)}
              </Text>
            );
          })}
        </View>
      )}
    </View>
  );

  const renderAddDataButton = (type: string) => (
    <TouchableOpacity 
      style={styles.addButton}
      onPress={() => setShowForm(type)}
    >
      <Plus size={20} color={currentTheme.colors.primary} />
      <Text style={styles.addButtonText}>{t(`wellness.add${type.charAt(0).toUpperCase() + type.slice(1)}`)}</Text>
    </TouchableOpacity>
  );

  const renderTrackingForm = () => {
    const handleFormSave = async () => {
    setShowForm(null);
    // console.log('Form saved, refreshing wellness data');
    // Add a small delay to ensure the data is saved before refreshing
    setTimeout(() => {
      loadWellnessData(); // Refresh data after saving
    }, 300);
  };

    const handleFormCancel = () => {
      setShowForm(null);
    };

    switch (showForm) {
      case 'sleep':
        return <SleepTrackingForm onSave={handleFormSave} onCancel={handleFormCancel} />;
      case 'exercise':
        return <ExerciseTrackingForm onSave={handleFormSave} onCancel={handleFormCancel} />;
      case 'nutrition':
        return <NutritionTrackingForm onSave={handleFormSave} onCancel={handleFormCancel} />;
      case 'meditation':
        return <MeditationTrackingForm onSave={handleFormSave} onCancel={handleFormCancel} />;
      case 'social':
        return <SocialActivityTrackingForm onSave={handleFormSave} onCancel={handleFormCancel} />;
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>{t('wellness.loading')}</Text>
      </View>
    );
  }

  // Show tracking form if one is selected
  if (showForm) {
    return (
      <View style={styles.container}>
        <View style={styles.formHeader}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => setShowForm(null)}
          >
            <ArrowLeft size={24} color={currentTheme.colors.text} />
          </TouchableOpacity>
          <Text style={styles.formTitle}>
            {t(`wellness.add${showForm.charAt(0).toUpperCase() + showForm.slice(1)}`)}
          </Text>
        </View>
        {renderTrackingForm()}
      </View>
    );
  }

  // Add function to render individual history items
  const renderHistoryItem = (item: SleepData | ExerciseData | NutritionData | MeditationData | SocialActivityData, type: string) => {
    const getItemContent = () => {
      switch (type) {
        case 'sleep':
          const sleepItem = item as SleepData;
          return {
            primary: sleepItem.duration ? `${sleepItem.duration}h ${t('wellness.sleep')}` : t('wellness.logged'),
            secondary: `${t('wellness.quality')}: ${sleepItem.quality}/5`,
            tertiary: sleepItem.notes ? sleepItem.notes.substring(0, 50) + '...' : ''
          };
        case 'exercise':
          const exerciseItem = item as ExerciseData;
          return {
            primary: getActivityTypeLabel(exerciseItem.type || '', 'exercise'),
            secondary: `${exerciseItem.duration || 0} ${t('wellness.min')} • ${exerciseItem.intensity || t('wellnessForms.exercise.intensity.moderate')} ${t('wellness.intensity')}`,
            tertiary: exerciseItem.notes ? exerciseItem.notes.substring(0, 50) + '...' : ''
          };
        case 'nutrition':
          const nutritionItem = item as NutritionData;
          return {
            primary: `${nutritionItem.meals?.[0]?.type || t('wellnessForms.nutrition.mealTypes.breakfast')} ${t('wellness.logged')}`,
            secondary: `${nutritionItem.meals?.[0]?.calories || 0} cal • ${nutritionItem.waterIntake || 0} ${t('wellnessForms.nutrition.waterPresets.glass')} ${t('wellnessForms.nutrition.waterIntake')}`,
            tertiary: nutritionItem.notes ? nutritionItem.notes.substring(0, 50) + '...' : ''
          };
        case 'meditation':
          const meditationItem = item as MeditationData;
          return {
            primary: `${getActivityTypeLabel(meditationItem.type || '', 'meditation')} - ${meditationItem.duration || 0} ${t('wellness.min')}`,
            secondary: `${t('wellness.effectiveness')}: ${meditationItem.effectiveness || 0}/5`,
            tertiary: meditationItem.notes ? meditationItem.notes.substring(0, 50) + '...' : ''
          };
        case 'social':
          const socialItem = item as SocialActivityData;
          return {
            primary: getActivityTypeLabel(socialItem.type || '', 'social'),
            secondary: `${socialItem.duration || 0} ${t('wellness.min')} • ${t('wellness.satisfaction')}: ${socialItem.satisfaction || 0}/5`,
            tertiary: socialItem.notes ? socialItem.notes.substring(0, 50) + '...' : ''
          };
        default:
          return { primary: t('wellness.logged'), secondary: '', tertiary: '' };
      }
    };

    const content = getItemContent();
    const date = new Date(item.date);
    const isToday = date.toDateString() === new Date().toDateString();
    const isYesterday = date.toDateString() === new Date(Date.now() - 86400000).toDateString();
    
    const getDateLabel = () => {
      if (isToday) return t('wellness.today');
      if (isYesterday) return t('wellness.yesterday');
      return date.toLocaleDateString();
    };

    return (
      <View style={styles.historyItem}>
        <View style={styles.historyItemLeft}>
          <View style={[styles.historyItemDot, { backgroundColor: currentTheme.colors.primary }]} />
          <View style={styles.historyItemContent}>
            <Text style={styles.historyItemTitle}>{content.primary}</Text>
            <Text style={styles.historyItemSubtitle}>{content.secondary}</Text>
            {content.tertiary && (
              <Text style={styles.historyItemNotes}>{content.tertiary}</Text>
            )}
          </View>
        </View>
        <View style={styles.historyItemRight}>
          <Text style={styles.historyItemDate}>{getDateLabel()}</Text>
          <Text style={styles.historyItemTime}>{date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
        </View>
      </View>
    );
  };

  // Add new function to render individual tab content with history
  const renderTabContent = (tabType: string) => {
    const getTabData = (): (SleepData | ExerciseData | NutritionData | MeditationData | SocialActivityData)[] => {
      switch (tabType) {
        case 'sleep': return sleepData;
        case 'exercise': return exerciseData;
        case 'nutrition': return nutritionData;
        case 'meditation': return meditationData;
        case 'social': return socialData;
        default: return [];
      }
    };

    const getTabIcon = () => {
      switch (tabType) {
        case 'sleep': return Moon;
        case 'exercise': return Activity;
        case 'nutrition': return Heart;
        case 'meditation': return Brain;
        case 'social': return Users;
        default: return Activity;
      }
    };

    const data = getTabData();
    const Icon = getTabIcon();
    const selectedCorrelation = correlations.find(c => c.type === tabType);

    return (
      <View style={styles.section}>
        {/* Header with stats */}
        <View style={styles.tabHeader}>
          <View style={styles.tabHeaderLeft}>
            <Icon size={32} color={currentTheme.colors.primary} />
            <View style={styles.tabHeaderText}>
              <Text style={styles.tabTitle}>{t(`wellness.${tabType}`)}</Text>
              <Text style={styles.tabSubtitle}>
                {data.length} {t('wellness.entries')} • {selectedCorrelation?.dataPoints || 0} {t('wellness.correlations')}
              </Text>
            </View>
          </View>
          <TouchableOpacity 
            style={styles.addButtonSmall}
            onPress={() => setShowForm(tabType)}
          >
            <Plus size={20} color="white" />
          </TouchableOpacity>
        </View>

        {/* Quick Stats Card */}
        {selectedCorrelation && (
          <View style={styles.quickStatsCard}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>
                {(selectedCorrelation.correlationStrength * 100).toFixed(0)}%
              </Text>
              <Text style={styles.statLabel}>{t('wellness.moodCorrelation')}</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{data.length}</Text>
              <Text style={styles.statLabel}>{t('wellness.totalEntries')}</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>
                {data.length > 0 ? Math.ceil((Date.now() - new Date(data[data.length - 1].date).getTime()) / (1000 * 60 * 60 * 24)) : 0}
              </Text>
              <Text style={styles.statLabel}>{t('wellness.daysSinceLastEntry')}</Text>
            </View>
          </View>
        )}

        {/* History List */}
        <View style={styles.historySection}>
          <Text style={styles.historySectionTitle}>{t('wellness.recentActivity')}</Text>
          
          {data.length === 0 ? (
            <View style={styles.emptyState}>
              <Icon size={48} color={currentTheme.colors.textSecondary} style={styles.emptyIcon} />
              <Text style={styles.emptyTitle}>{t(`wellness.no${tabType.charAt(0).toUpperCase() + tabType.slice(1)}Data`)}</Text>
              <Text style={styles.emptySubtitle}>{t(`wellness.start${tabType.charAt(0).toUpperCase() + tabType.slice(1)}Tracking`)}</Text>
              <TouchableOpacity 
                style={styles.emptyActionButton}
                onPress={() => setShowForm(tabType)}
              >
                <Plus size={20} color="white" />
                <Text style={styles.emptyActionText}>{t(`wellness.addFirst${tabType.charAt(0).toUpperCase() + tabType.slice(1)}`)}</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <FlatList
              data={data.slice().reverse().slice(0, 10) as any} // Show last 10 entries
              keyExtractor={(item, index) => `${tabType}-${index}`}
              renderItem={({ item }) => renderHistoryItem(item, tabType)}
              showsVerticalScrollIndicator={false}
              scrollEnabled={false}
            />
          )}

          {data.length > 10 && (
            <TouchableOpacity style={styles.viewAllButton}>
              <Text style={styles.viewAllText}>{t('wellness.viewAllEntries')} ({data.length})</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Insights */}
        {selectedCorrelation && selectedCorrelation.insights && (
          <View style={styles.insightsSection}>
            {renderInsights(selectedCorrelation)}
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.content}>
        {renderTabBar()}
        {selectedTab === 'overview' ? (
          renderOverview()
        ) : (
          renderTabContent(selectedTab)
        )}
      </ScrollView>
    </View>
  );
}

const createStyles = (colors: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  loadingText: {
    fontSize: 16,
    color: colors.textSecondary,
  },
  content: {
    flex: 1,
  },
  // Dropdown styles
  dropdownContainer: {
    // backgroundColor: colors.card,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  dropdownButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    paddingHorizontal: 16,
    paddingVertical: 12,
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
    fontSize: 14,
    color: colors.textSecondary,
    marginLeft: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-start',
    paddingTop: 450, // Increase this value to move dropdown further down
  },
  modalDropdownMenu: {
    backgroundColor: colors.card,
    marginHorizontal: 16,
    borderRadius: 12,
    maxHeight: 300,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  modalDropdownScroll: {
    maxHeight: 280,
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.border + '30',
    gap: 12,
  },
  activeDropdownItem: {
    backgroundColor: colors.primary,
  },
  dropdownItemText: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.text,
    textTransform: 'capitalize',
  },
  activeDropdownItemText: {
    color: 'white',
    fontWeight: '600',
  },
  tabHeader: {
    backgroundColor: colors.card,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    borderRadius: 20,
    backgroundColor: colors.surface,
    gap: 6,
  },
  activeTab: {
    backgroundColor: colors.primary,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  activeTabText: {
    color: 'white',
  },
  section: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 16,
  },
  correlationGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  correlationCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: colors.card,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  correlationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  correlationType: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    textTransform: 'capitalize',
  },
  correlationStrength: {
    fontSize: 24,
    fontWeight: '800',
    marginBottom: 4,
  },
  correlationLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  dataPoints: {
    fontSize: 10,
    color: colors.textSecondary,
  },
  insightCard: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  insightHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  insightTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  insightText: {
    fontSize: 14,
    color: colors.text,
    marginBottom: 6,
    lineHeight: 20,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.card,
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.primary,
    borderStyle: 'dashed',
    gap: 8,
  },
  addButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.primary,
  },
  formHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: colors.card,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: 12,
  },
  backButton: {
    padding: 8,
  },
  formTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
  tabHeaderContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  tabHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  tabHeaderText: {
    marginLeft: 12,
    flex: 1,
  },
  tabTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
    textTransform: 'capitalize',
  },
  tabSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 2,
  },
  addButtonSmall: {
    backgroundColor: colors.primary,
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  quickStatsCard: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.text,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: colors.border,
    marginHorizontal: 16,
  },
  historySection: {
    marginBottom: 24,
  },
  historySectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 16,
  },
  historyItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border + '30',
  },
  historyItemLeft: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    flex: 1,
  },
  historyItemDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginTop: 6,
    marginRight: 12,
  },
  historyItemContent: {
    flex: 1,
  },
  historyItemTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  historyItemSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 2,
  },
  historyItemNotes: {
    fontSize: 12,
    color: colors.textSecondary,
    fontStyle: 'italic',
  },
  historyItemRight: {
    alignItems: 'flex-end',
  },
  historyItemDate: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.text,
  },
  historyItemTime: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 2,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  emptyIcon: {
    marginBottom: 16,
    opacity: 0.5,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  emptyActionButton: {
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
    gap: 8,
  },
  emptyActionText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  viewAllButton: {
    alignItems: 'center',
    paddingVertical: 16,
    marginTop: 8,
  },
  viewAllText: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '500',
  },
  insightsSection: {
    marginTop: 8,
  },
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
});