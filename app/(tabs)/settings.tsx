import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  Switch,
  Alert,
  Modal,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import {
  Palette,
  Crown,
  Info,
  Globe,
  LogOut,
  User,
  Lock,
  Link,
  Bell,
  Mail,
  Shield,
  Trash2,
  Download,
  ChevronRight,
  Settings as SettingsIcon,
  Sparkles,
  Heart,
  Stethoscope,
  Activity,
  Users,
  Share2,
  Trophy,
  Star,
  Zap,
  AlertCircle,
  BarChart3,
  Target,
  FileText,
  Eye,
  Clock
} from 'lucide-react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useTheme } from '@/context/ThemeContext';
import { useLanguage } from '@/context/LanguageContext';
import { useSubscription } from '@/context/SubscriptionContext';
import { useCelebration } from '@/context/CelebrationContext';
import { useAuth } from '@/context/AuthContext';
import { usePerformanceAlerts } from '@/context/PerformanceAlertsContext';
import { DataExportService } from '@/services/DataExportService';
import { PrivacyService } from '@/services/PrivacyService';
import { ProfessionalIntegrationService } from '@/services/ProfessionalIntegrationService';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system';
import AsyncStorage from '@react-native-async-storage/async-storage';
import PricingScreen from '@/components/PricingScreen';
import PerformanceDashboard from '@/components/PerformanceDashboard';
import PerformanceRecommendations from '@/components/PerformanceRecommendations';
import ErrorHandlingExample from '@/components/ErrorHandlingExample';
import ThemeSelector from '@/components/ThemeSelector';
import LanguageSelector from '@/components/LanguageSelector';
import ProfessionalDashboard from '@/components/ProfessionalDashboard';
import TimezoneSettings from '@/components/TimezoneSettings';
import PerformanceAlertsSettings from '@/components/PerformanceAlertsSettings';

export default function MoreScreen() {
  const { currentTheme } = useTheme();
  const { t } = useLanguage();
  const { user, logout } = useAuth();
  const { currentTier, subscriptionStatus } = useSubscription();
  const router = useRouter();
  const { showPricing } = useLocalSearchParams();
  

  
  const [showThemeSelector, setShowThemeSelector] = useState(false);
  const [showLanguageSelector, setShowLanguageSelector] = useState(false);
  const [showTimezoneSettings, setShowTimezoneSettings] = useState(false);
  const [showProfessionalDashboard, setShowProfessionalDashboard] = useState(false);
  const [showPricingScreen, setShowPricingScreen] = useState(false);
  const [showPerformanceDashboard, setShowPerformanceDashboard] = useState(false);
  const [showPerformanceRecommendations, setShowPerformanceRecommendations] = useState(false);
  const [showErrorHandlingExample, setShowErrorHandlingExample] = useState(false);
  const [showAlertSettings, setShowAlertSettings] = useState(false);
  const { animationsEnabled, setAnimationsEnabled } = useCelebration();
  const { settings: alertSettings, toggleAlerts, updateSettings } = usePerformanceAlerts();
  
  // Settings states
  const [professionalSharingEnabled, setProfessionalSharingEnabled] = useState(false);
  const [wellnessTrackingEnabled, setWellnessTrackingEnabled] = useState(true);
  const [anonymousDataSharing, setAnonymousDataSharing] = useState(false);

  const styles = createStyles(currentTheme.colors);

  // Handle showPricing URL parameter - only for upgrade flow from alerts
  useEffect(() => {
    if (showPricing === 'true') {
      setShowPricingScreen(true);
      // Clear the URL parameter to prevent it from persisting
      router.setParams({ showPricing: undefined });
    }
  }, [showPricing, router]);

  // Load professional sharing setting on component mount
  useEffect(() => {
    const loadProfessionalSetting = async () => {
      try {
        const userId = user?.id || 'anonymous';
        const key = `professionalSharingEnabled_${userId}`;
        const saved = await AsyncStorage.getItem(key);
        if (saved !== null) {
          setProfessionalSharingEnabled(JSON.parse(saved));
        }
      } catch (error) {
        console.error('Error loading professional sharing setting:', error);
      }
    };
    loadProfessionalSetting();
  }, [user?.id]);

  // Handle professional sharing toggle
  const handleProfessionalSharingToggle = async (value: boolean) => {
    try {
      const userId = user?.id || 'anonymous';
      const key = `professionalSharingEnabled_${userId}`;
      
      if (value) {
        // Show confirmation dialog when enabling
        Alert.alert(
          t('settings.alerts.professionalSharing.title'), // Instead of 'Enable Professional Sharing'
          t('settings.alerts.professionalSharing.message'),
          [
            { text: t('common.cancel'), style: 'cancel' },
            {
              text: t('common.enable'),
              onPress: async () => {
                setProfessionalSharingEnabled(true);
                await AsyncStorage.setItem(key, 'true');
                
                // Show success message instead of automatically opening dashboard
                Alert.alert(
                  t('common.success'),
                  t('settings.professional.sharingEnabled'),
                  [{ text: t('common.ok') }]
                );
              }
            }
          ]
        );
      } else {
        // Disable without confirmation
        setProfessionalSharingEnabled(false);
        await AsyncStorage.setItem(key, 'false');
        
        Alert.alert(
          t('settings.export.professionalSharingDisabled'),
          t('settings.export.professionalSharingDisabledMessage'),
          [{ text: t('common.ok') }]
        );
      }
    } catch (error) {
      console.error('Error updating professional sharing setting:', error);
      Alert.alert(t('settings.export.error'), t('settings.export.failedToUpdateSetting'));
    }
  };

  // Handle professional dashboard access
  const handleProfessionalDashboard = () => {
    if (professionalSharingEnabled) {
      setShowProfessionalDashboard(true);
    } else {
      Alert.alert(
        t('settings.export.professionalSharingDisabled'),
        t('settings.export.professionalSharingDisabledAccess'),
        [
          { text: t('common.cancel'), style: 'cancel' },
          {
            text: t('settings.export.enableNow'),
            onPress: () => handleProfessionalSharingToggle(true)
          }
        ]
      );
    }
  };

  const handleLogout = async () => {
    Alert.alert(
      t('settings.alerts.logout.title'),
      t('settings.alerts.logout.message'),
      [
        { text: t('settings.alerts.logout.cancel'), style: 'cancel' },
        { 
          text: t('settings.alerts.logout.confirm'), 
          style: 'destructive', 
          onPress: async () => {
            await logout();
            router.replace('/(auth)/login' as any);
          }
        },
      ]
    );
  };

  const handleProfilePress = () => {
    router.push('/profile');
  };

  const handleChangePassword = () => {
    router.push('/settings/change-password');
  };

  const handleLinkedAccounts = () => {
    router.push('/settings/linked-accounts');
  };

  const handleNotificationSettings = () => {
    router.push('/settings/notification-preferences');
  };

  const handlePrivacySettings = () => {
    router.push('/settings/privacy-settings');
  };

  const handleAccountDeletion = () => {
    Alert.alert(
      t('settings.alerts.deleteAccount.title'),
      t('settings.alerts.deleteAccount.message'),
      [
        { text: t('settings.alerts.deleteAccount.cancel'), style: 'cancel' },
        { 
          text: t('settings.alerts.deleteAccount.confirm'), 
          style: 'destructive', 
          onPress: () => router.push('/settings/delete-account')
        },
      ]
    );
  };

  const handleDataExport = async () => {
    try {
      // Show loading state
      Alert.alert(t('settings.export.exporting'), t('settings.export.exportingMessage'));
      
      // Get all data
      const userData = await PrivacyService.exportUserData();
      const moodData = await DataExportService.getAllMoodData();
      const habitMoodData = await DataExportService.getAllHabitMoodData();
      const analytics = await DataExportService.generateExportAnalytics(moodData, habitMoodData);
      const insights = await DataExportService.generateExportInsights(moodData, habitMoodData);
      
      // Create organized export structure
      const exportData = {
        // Export metadata
        exportInfo: {
          exportDate: new Date().toISOString(),
          exportedBy: t('settings.export.appName'),
          appVersion: '1.0.0',
          dataVersion: '1.0',
          totalRecords: {
            habits: Object.keys(userData).filter(key => key.includes('habit')).length,
            moodEntries: moodData.length,
            habitMoodEntries: habitMoodData.length
          }
        },
        
        // User summary
        userSummary: {
          accountCreated: userData.user_created_at || t('common.unknown'),
          totalDaysActive: analytics.totalDaysActive || 0,
          overallStats: {
            totalHabitsCreated: analytics.totalHabitsCreated || 0,
            totalCompletions: analytics.totalCompletions || 0,
            averageCompletionRate: analytics.averageCompletionRate || 0,
            longestStreak: analytics.longestStreak || 0,
            currentActiveHabits: analytics.currentActiveHabits || 0
          }
        },
        
        // Habits data (organized and readable)
        habitsData: {
          summary: {
            totalHabits: Object.keys(userData).filter(key => key.includes('habit')).length,
            categoriesUsed: analytics.categoriesUsed || [],
            mostSuccessfulCategory: analytics.mostSuccessfulCategory || 'N/A'
          },
          habits: Object.entries(userData)
            .filter(([key]) => key.includes('habit') && !key.includes('mood'))
            .map(([key, value]) => {
              try {
                const habit = JSON.parse(value as string);
                return {
                  title: habit.title || t('common.unnamedHabit'),
                  category: habit.category || t('common.uncategorized'),
                  createdDate: habit.createdAt || t('common.unknown'),
                  currentStreak: habit.streak || 0,
                  bestStreak: habit.bestStreak || 0,
                  totalCompletions: habit.completedDates?.length || 0,
                  completionRate: habit.completedDates?.length ? 
                    ((habit.completedDates.length / Math.max(1, Math.ceil((new Date().getTime() - new Date(habit.createdAt || Date.now()).getTime()) / (1000 * 60 * 60 * 24)))) * 100).toFixed(1) + '%' : '0%',
                  reminderSettings: {
                    enabled: habit.reminderEnabled || false,
                    time: habit.reminderTime || t('common.notSet'),
                    days: habit.reminderDays || []
                  },
                  recentActivity: habit.completedDates?.slice(-7) || []
                };
                              } catch {
                  return { title: t('common.invalidData'), error: t('common.couldNotParse') };
                }
            })
        },
        
        // Mood tracking data (organized by date)
        moodData: {
          summary: {
            totalEntries: moodData.length,
            dateRange: {
              earliest: moodData.length > 0 ? moodData[0]?.date : t('common.noData'),
              latest: moodData.length > 0 ? moodData[moodData.length - 1]?.date : t('common.noData')
            },
            averageMoodIntensity: analytics.averageMoodIntensity || 0,
            mostCommonMood: analytics.mostCommonMood || 'N/A',
            moodDistribution: analytics.moodDistribution || {}
          },
          entries: moodData.map(entry => ({
            date: entry.date,
            timestamp: entry.timestamp,
            mood: {
              state: entry.moodState,
              intensity: entry.intensity,
              description: entry.note || t('common.noNote')
            },
            triggers: entry.triggers || [],
            context: entry.context || t('common.noContext')
          }))
        },
        
        // Habit-mood correlations (insights)
        habitMoodInsights: {
          summary: {
            totalCorrelationEntries: habitMoodData.length,
            habitsWithMoodTracking: [...new Set(habitMoodData.map(entry => entry.habitId))].length,
            averageMoodImprovement: insights.patterns?.habitMoodCorrelations?.moodImprovement || 0
          },
          correlations: habitMoodData.map(entry => ({
            date: entry.date,
            habitId: entry.habitId,
            action: entry.action,
            moodBefore: entry.preMood ? {
              state: entry.preMood.moodState,
              intensity: entry.preMood.intensity
            } : null,
            moodAfter: entry.postMood ? {
              state: entry.postMood.moodState,
              intensity: entry.postMood.intensity,
              timeAfterCompletion: entry.postMood.timeAfter + ' minutes'
            } : null,
            triggers: entry.triggers || [],
            notes: entry.note || t('common.noNotes')
          })),
          insights: {
            weeklyTrends: insights.patterns?.weeklyTrends || {},
            bestMoodsForHabits: insights.recommendations || [],
            moodBoostingHabits: analytics.moodBoostingHabits || []
          }
        },
        
        // Privacy and settings
        privacySettings: {
          dataCollectionSettings: userData.privacySettings ? JSON.parse(userData.privacySettings) : {},
          userPreferences: userData.userPreferences ? JSON.parse(userData.userPreferences) : {}
        },
        
        // Data export notes
        exportNotes: {
          dataPrivacy: t('settings.export.notes.dataPrivacy'),
          dataFormat: t('settings.export.notes.dataFormat'),
          moodScale: t('settings.export.notes.moodScale'),
          completionRate: t('settings.export.notes.completionRate'),
          support: t('settings.export.notes.support')
        }
      };
      
      // Create file with timestamp
      const timestamp = new Date().toISOString().split('T')[0];
      const fileName = `habit-tracker-export-${timestamp}.json`;
      const fileUri = FileSystem.documentDirectory + fileName;
      
      await FileSystem.writeAsStringAsync(
        fileUri, 
        JSON.stringify(exportData, null, 2)
      );
      
      // Share the file
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(fileUri, {
          mimeType: 'application/json',
          dialogTitle: t('settings.export.dialogTitle')
        });
      }
      
      Alert.alert(
        t('settings.export.exportComplete'),
        t('settings.export.exportCompleteMessage', {
          totalDays: exportData.userSummary.totalDaysActive,
          totalHabits: exportData.habitsData.summary.totalHabits,
          totalMoodEntries: exportData.moodData.summary.totalEntries
        })
      );
    } catch (error) {
      console.error('Export error:', error);
      Alert.alert(
        t('settings.export.exportFailed'),
        t('settings.export.exportFailedMessage')
      );
    }
  };


  
  return (
    <>
      <StatusBar style={currentTheme.isDark ? 'light' : 'dark'} />
      
      {/* Render either Settings OR PricingScreen, never both */}
      {showPricingScreen ? (
        // PricingScreen - Full screen when visible
        <View style={{
          flex: 1,
          backgroundColor: currentTheme.colors.background,
          width: '100%',
          height: '100%',
        }}>
          <PricingScreen
            visible={true}
            onClose={() => setShowPricingScreen(false)}
            showIntroductory={false}
            inModal={true}
          />
        </View>
      ) : (
        // Settings Content - Only when PricingScreen is NOT visible
        <SafeAreaView style={styles.container}>
          {/* Clean Header */}
          <View style={styles.header}>
            <View style={styles.userSection}>
              <View style={styles.avatarContainer}>
                <User size={28} color={currentTheme.colors.primary} />
              </View>
              <View style={styles.userInfo}>
                <Text style={styles.userName}>{user?.email || t('settings.user.guest')}</Text>
                <Text style={styles.userStatus}>{t('settings.user.status')}</Text>
              </View>
              {currentTier === 'pro' && (
                <View style={styles.proBadge}>
                  <Crown size={16} color={currentTheme.colors.warning} />
                  <Text style={styles.proText}>{t('settings.premium.pro')}</Text>
                </View>
              )}
            </View>
          </View>

          <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
            {/* Subscription Banner */}
            {currentTier === 'free' && (
              <TouchableOpacity 
                style={styles.premiumBanner}
                onPress={() => setShowPricingScreen(true)}
              >
                <View style={styles.premiumContent}>
                  <View style={styles.premiumIconContainer}>
                    <Crown size={24} color={currentTheme.colors.warning} />
                  </View>
                  <View style={styles.premiumInfo}>
                    <Text style={styles.premiumTitle}>{t('settings.premium.upgradeToPro')}</Text>
                    <Text style={styles.premiumSubtitle}>{t('settings.premium.unlockDescription')}</Text>
                  </View>
                  <ChevronRight size={20} color={currentTheme.colors.warning} />
                </View>
              </TouchableOpacity>
            )}

            {/* Account Settings */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>{t('settings.sections.account')}</Text>
              <View style={styles.card}>
                <TouchableOpacity style={styles.menuItem} onPress={handleProfilePress}>
                  <User size={20} color={currentTheme.colors.textSecondary} />
                  <Text style={styles.menuText}>{t('settings.account.profile')}</Text>
                  <ChevronRight size={20} color={currentTheme.colors.textSecondary} />
                </TouchableOpacity>
                
                <TouchableOpacity style={styles.menuItem} onPress={handleChangePassword}>
                  <Lock size={20} color={currentTheme.colors.textSecondary} />
                  <Text style={styles.menuText}>{t('settings.account.changePassword')}</Text>
                  <ChevronRight size={20} color={currentTheme.colors.textSecondary} />
                </TouchableOpacity>
                
                <TouchableOpacity style={styles.menuItem} onPress={handleLinkedAccounts}>
                  <Link size={20} color={currentTheme.colors.textSecondary} />
                  <Text style={styles.menuText}>{t('settings.account.linkedAccounts')}</Text>
                  <ChevronRight size={20} color={currentTheme.colors.textSecondary} />
                </TouchableOpacity>
                
                <TouchableOpacity style={styles.menuItem} onPress={handleNotificationSettings}>
                  <Bell size={20} color={currentTheme.colors.textSecondary} />
                  <Text style={styles.menuText}>{t('settings.account.notifications')}</Text>
                  <ChevronRight size={20} color={currentTheme.colors.textSecondary} />
                </TouchableOpacity>
              </View>
            </View>

            {/* App Preferences */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>{t('settings.sections.preferences')}</Text>
              <Text style={styles.sectionDescription}>{t('settings.preferences.description')}</Text>
              <View style={styles.card}>
                <TouchableOpacity style={styles.menuItem} onPress={() => setShowThemeSelector(true)}>
                  <Palette size={20} color={currentTheme.colors.textSecondary} />
                  <Text style={styles.menuText}>{t('settings.preferences.theme')}</Text>
                  <ChevronRight size={20} color={currentTheme.colors.textSecondary} />
                </TouchableOpacity>
                
                <TouchableOpacity style={styles.menuItem} onPress={() => setShowLanguageSelector(true)}>
                  <Globe size={20} color={currentTheme.colors.textSecondary} />
                  <Text style={styles.menuText}>{t('settings.preferences.language')}</Text>
                  <ChevronRight size={20} color={currentTheme.colors.textSecondary} />
                </TouchableOpacity>
                
                <TouchableOpacity style={styles.menuItem} onPress={() => setShowTimezoneSettings(true)}>
                  <Clock size={20} color={currentTheme.colors.textSecondary} />
                  <Text style={styles.menuText}>{t('settings.preferences.timezone')}</Text>
                  <ChevronRight size={20} color={currentTheme.colors.textSecondary} />
                </TouchableOpacity>
                
                <View style={styles.menuItem}>
                  <Sparkles size={20} color={currentTheme.colors.textSecondary} />
                  <Text style={styles.menuText}>{t('settings.preferences.animations')}</Text>
                  <Switch
                    value={animationsEnabled}
                    onValueChange={setAnimationsEnabled}
                    trackColor={{ false: currentTheme.colors.surface, true: `${currentTheme.colors.primary}50` }}
                    thumbColor={animationsEnabled ? currentTheme.colors.primary : currentTheme.colors.textSecondary}
                  />
                </View>
                
                <View style={styles.menuItem}>
                  <Activity size={20} color={currentTheme.colors.textSecondary} />
                  <Text style={styles.menuText}>{t('settings.preferences.wellnessTracking')}</Text>
                  <Switch
                    value={wellnessTrackingEnabled}
                    onValueChange={setWellnessTrackingEnabled}
                    trackColor={{ false: currentTheme.colors.surface, true: `${currentTheme.colors.success}50` }}
                    thumbColor={wellnessTrackingEnabled ? currentTheme.colors.success : currentTheme.colors.textSecondary}
                  />
                </View>
                
                <View style={styles.menuItem}>
                  <AlertCircle size={20} color={currentTheme.colors.textSecondary} />
                  <View style={styles.menuTextContainer}>
                    <Text style={styles.menuText}>{t('performance.alerts.settings.enableAlerts')}</Text>
                    <Text style={styles.menuSubtext}>{t('performance.alerts.settings.enableAlertsDesc')}</Text>
                  </View>
                  <Switch
                    value={alertSettings.enabled}
                    onValueChange={toggleAlerts}
                    trackColor={{ false: currentTheme.colors.surface, true: `${currentTheme.colors.primary}50` }}
                    thumbColor={alertSettings.enabled ? currentTheme.colors.primary : currentTheme.colors.textSecondary}
                  />
                </View>
                
                <TouchableOpacity style={styles.menuItem} onPress={() => setShowAlertSettings(true)}>
                  <AlertCircle size={20} color={currentTheme.colors.textSecondary} />
                  <Text style={styles.menuText}>{t('performance.alerts.settings.title')}</Text>
                  <ChevronRight size={20} color={currentTheme.colors.textSecondary} />
                </TouchableOpacity>
              </View>
            </View>

            {/* Professional Features */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>{t('settings.sections.professional')}</Text>
              <View style={styles.card}>
                <View style={styles.menuItem}>
                  <Stethoscope size={20} color={currentTheme.colors.textSecondary} />
                  <Text style={styles.menuText}>{t('settings.professional.sharing')}</Text>
                  <Switch
                    value={professionalSharingEnabled}
                    onValueChange={handleProfessionalSharingToggle}
                    trackColor={{ false: currentTheme.colors.surface, true: `${currentTheme.colors.primary}50` }}
                    thumbColor={professionalSharingEnabled ? currentTheme.colors.primary : currentTheme.colors.textSecondary}
                  />
                </View>
                
                {professionalSharingEnabled && (
                  <>
                    <TouchableOpacity style={styles.menuItem} onPress={handleProfessionalDashboard}>
                      <Users size={20} color={currentTheme.colors.textSecondary} />
                      <Text style={styles.menuText}>{t('settings.professional.dashboard')}</Text>
                      <ChevronRight size={20} color={currentTheme.colors.textSecondary} />
                    </TouchableOpacity>
                    
                    <TouchableOpacity style={styles.menuItem} onPress={() => setShowPerformanceDashboard(true)}>
                      <BarChart3 size={20} color={currentTheme.colors.textSecondary} />
                      <Text style={styles.menuText}>{t('settings.professional.performance')}</Text>
                      <ChevronRight size={20} color={currentTheme.colors.textSecondary} />
                    </TouchableOpacity>
                    
                    <TouchableOpacity style={styles.menuItem} onPress={() => setShowPerformanceRecommendations(true)}>
                      <Target size={20} color={currentTheme.colors.textSecondary} />
                      <Text style={styles.menuText}>{t('settings.professional.recommendations')}</Text>
                      <ChevronRight size={20} color={currentTheme.colors.textSecondary} />
                    </TouchableOpacity>
                  </>
                )}
              </View>
            </View>

            {/* Privacy & Data */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>{t('settings.sections.privacy')}</Text>
              <View style={styles.card}>
                <TouchableOpacity style={styles.menuItem} onPress={handlePrivacySettings}>
                  <Eye size={20} color={currentTheme.colors.textSecondary} />
                  <Text style={styles.menuText}>{t('settings.privacy.privacySettings')}</Text>
                  <ChevronRight size={20} color={currentTheme.colors.textSecondary} />
                </TouchableOpacity>
                
                <TouchableOpacity style={styles.menuItem} onPress={handleDataExport}>
                  <Download size={20} color={currentTheme.colors.textSecondary} />
                  <Text style={styles.menuText}>{t('settings.privacy.dataExport')}</Text>
                  <ChevronRight size={20} color={currentTheme.colors.textSecondary} />
                </TouchableOpacity>
              </View>
            </View>

            {/* Support */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>{t('settings.sections.support')}</Text>
              <View style={styles.card}>
                <TouchableOpacity style={styles.menuItem} onPress={() => router.push('/settings/terms-of-service')}>
                  <FileText size={20} color={currentTheme.colors.textSecondary} />
                  <Text style={styles.menuText}>{t('settings.support.termsOfService')}</Text>
                  <ChevronRight size={20} color={currentTheme.colors.textSecondary} />
                </TouchableOpacity>
                
                <TouchableOpacity style={styles.menuItem} onPress={() => router.push('/settings/privacy-policy')}>
                  <Shield size={20} color={currentTheme.colors.textSecondary} />
                  <Text style={styles.menuText}>{t('settings.support.privacyPolicy')}</Text>
                  <ChevronRight size={20} color={currentTheme.colors.textSecondary} />
                </TouchableOpacity>
                
                <TouchableOpacity style={styles.menuItem} onPress={() => setShowErrorHandlingExample(true)}>
                  <AlertCircle size={20} color={currentTheme.colors.textSecondary} />
                  <Text style={styles.menuText}>{t('settings.support.errorHandling')}</Text>
                  <ChevronRight size={20} color={currentTheme.colors.textSecondary} />
                </TouchableOpacity>
              </View>
            </View>



            {/* Danger Zone */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>{t('settings.sections.danger')}</Text>
              <View style={styles.card}>
                <TouchableOpacity style={styles.menuItem} onPress={handleAccountDeletion}>
                  <Trash2 size={20} color={currentTheme.colors.error} />
                  <Text style={[styles.menuText, { color: currentTheme.colors.error }]}>{t('settings.danger.deleteAccount')}</Text>
                  <ChevronRight size={20} color={currentTheme.colors.error} />
                </TouchableOpacity>
                
                <TouchableOpacity style={styles.menuItem} onPress={handleLogout}>
                  <LogOut size={20} color={currentTheme.colors.error} />
                  <Text style={[styles.menuText, { color: currentTheme.colors.error }]}>{t('settings.danger.signOut')}</Text>
                  <ChevronRight size={20} color={currentTheme.colors.error} />
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.bottomSpacing} />
          </ScrollView>

          {/* Modals */}
          <ThemeSelector 
            visible={showThemeSelector}
            onClose={() => setShowThemeSelector(false)}
          />

          <LanguageSelector 
            visible={showLanguageSelector}
            onClose={() => setShowLanguageSelector(false)}
          />

          <TimezoneSettings 
            visible={showTimezoneSettings}
            onClose={() => setShowTimezoneSettings(false)}
          />

          <PerformanceAlertsSettings
            visible={showAlertSettings}
            onClose={() => setShowAlertSettings(false)}
          />

          {showProfessionalDashboard && (
            <View style={styles.fullScreenModalContainer}>
              <View style={styles.fullScreenModalContent}>
                <View style={styles.fullScreenModalHeader}>
                  <Text style={styles.fullScreenModalTitle}>{t('professional.dashboard.title')}</Text>
                  <TouchableOpacity 
                    style={styles.closeButton}
                    onPress={() => setShowProfessionalDashboard(false)}
                  >
                    <Text style={styles.modalClose}>{t('common.close')}</Text>
                  </TouchableOpacity>
                </View>
                <View style={styles.dashboardContainer}>
                  <ProfessionalDashboard 
                    userRole="healthcare_provider"
                    clientId="demo-client"
                  />
                </View>
              </View>
            </View>
          )}

          {/* Performance Dashboard Modal */}
          {showPerformanceDashboard && (
            <View style={styles.fullScreenModalContainer}>
              <View style={styles.fullScreenModalContent}>
                <View style={styles.fullScreenModalHeader}>
                  <Text style={styles.fullScreenModalTitle}>{t('performance.dashboard.title')}</Text>
                  <TouchableOpacity 
                    style={styles.closeButton}
                    onPress={() => setShowPerformanceDashboard(false)}
                  >
                    <Text style={styles.modalClose}>{t('common.close')}</Text>
                  </TouchableOpacity>
                </View>
                <View style={styles.dashboardContainer}>
                  <PerformanceDashboard />
                </View>
              </View>
            </View>
          )}

          {/* Performance Recommendations Modal */}
          {showPerformanceRecommendations && (
            <View style={styles.fullScreenModalContainer}>
              <View style={styles.fullScreenModalContent}>
                <View style={styles.fullScreenModalHeader}>
                  <Text style={styles.fullScreenModalTitle}>{t('performance.recommendations.title')}</Text>
                  <TouchableOpacity 
                    style={styles.closeButton}
                    onPress={() => setShowPerformanceRecommendations(false)}
                  >
                    <Text style={styles.modalClose}>{t('common.close')}</Text>
                  </TouchableOpacity>
                </View>
                <View style={styles.dashboardContainer}>
                  <PerformanceRecommendations />
                </View>
              </View>
            </View>
          )}

          {/* Error Handling Examples Modal */}
          {showErrorHandlingExample && (
            <View style={styles.fullScreenModalContainer}>
              <View style={styles.fullScreenModalContent}>
                <View style={styles.fullScreenModalHeader}>
                  <Text style={styles.fullScreenModalTitle}>{t('error.examples.title')}</Text>
                  <TouchableOpacity 
                    style={styles.closeButton}
                    onPress={() => setShowErrorHandlingExample(false)}
                  >
                    <Text style={styles.modalClose}>{t('common.close')}</Text>
                  </TouchableOpacity>
                </View>
                <View style={styles.dashboardContainer}>
                  <ErrorHandlingExample />
                </View>
              </View>
            </View>
          )}
        </SafeAreaView>
      )}
    </>
  );
}

const createStyles = (colors: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingTop: 20,
  },
  header: {
    backgroundColor: colors.card,
    paddingTop: 20,
    paddingBottom: 24,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  userSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: `${colors.primary}15`,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  userStatus: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  proBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: `${colors.warning}15`,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 4,
  },
  proText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.warning,
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 20,
  },
  section: {
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  sectionDescription: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 12,
    paddingHorizontal: 4,
    lineHeight: 18,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  menuText: {
    flex: 1,
    fontSize: 16,
    color: colors.text,
    marginLeft: 16,
  },
  menuTextContainer: {
    flex: 1,
    marginLeft: 16,
  },
  menuSubtext: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  premiumBanner: {
    backgroundColor: `${colors.warning}10`,
    borderRadius: 16,
    padding: 20,
    marginTop: 20,
    borderWidth: 1,
    borderColor: `${colors.warning}30`,
  },
  premiumContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  premiumIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: `${colors.warning}20`,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  premiumInfo: {
    flex: 1,
  },
  premiumTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  premiumSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  bottomSpacing: {
    height: 40,
  },
  // Modal styles
  modalContainer: {
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
  modalContent: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 20,
    margin: 20,
    maxHeight: '80%',
    width: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
  },
  modalClose: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.primary,
  },
  fullScreenModalContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.background,
    zIndex: 1000,
  },
  fullScreenModalContent: {
    flex: 1,
    backgroundColor: colors.background,
  },
  fullScreenModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingTop: 50,
    backgroundColor: colors.card,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  fullScreenModalTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.text,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: `${colors.textSecondary}10`,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dashboardContainer: {
    flex: 1,
  },
  alertStatusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  alertStatus: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
});