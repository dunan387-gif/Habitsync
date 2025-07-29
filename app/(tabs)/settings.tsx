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
  MessageCircle,
  UserPlus,
  Trophy,
  Star,
  Zap
} from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '@/context/ThemeContext';
import { useLanguage } from '@/context/LanguageContext';
import ThemeSelector from '@/components/ThemeSelector';
import LanguageSelector from '@/components/LanguageSelector';
import SocialCommunityFeed from '@/components/SocialCommunityFeed';
import InviteFriends from '@/components/InviteFriends';
import ShareProgress from '@/components/ShareProgress';
import ProfessionalDashboard from '@/components/ProfessionalDashboard';
import { useCelebration } from '@/context/CelebrationContext';
import { useAuth } from '@/context/AuthContext';
import { DataExportService } from '@/services/DataExportService';
import { PrivacyService } from '@/services/PrivacyService';
import { ProfessionalIntegrationService } from '@/services/ProfessionalIntegrationService';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function MoreScreen() {
  const { currentTheme } = useTheme();
  const { t } = useLanguage();
  const { user, logout } = useAuth(); // Remove isPremiumUser from here
  const { isPremiumUser } = useTheme(); // Add this line to get isPremiumUser from ThemeContext
  const router = useRouter();
  const [showThemeSelector, setShowThemeSelector] = useState(false);
  const [showLanguageSelector, setShowLanguageSelector] = useState(false);
  const [showCommunityFeed, setShowCommunityFeed] = useState(false);
  const [showInviteFriends, setShowInviteFriends] = useState(false);
  const [showShareProgress, setShowShareProgress] = useState(false);
  const [showProfessionalDashboard, setShowProfessionalDashboard] = useState(false);
  const { animationsEnabled, setAnimationsEnabled } = useCelebration();
  
  // Settings states
  const [professionalSharingEnabled, setProfessionalSharingEnabled] = useState(false);
  const [wellnessTrackingEnabled, setWellnessTrackingEnabled] = useState(true);
  const [communityFeaturesEnabled, setCommunityFeaturesEnabled] = useState(true);
  const [anonymousDataSharing, setAnonymousDataSharing] = useState(false);

  const styles = createStyles(currentTheme.colors);

  // Load professional sharing setting on component mount
  useEffect(() => {
    const loadProfessionalSetting = async () => {
      try {
        const saved = await AsyncStorage.getItem('professionalSharingEnabled');
        if (saved !== null) {
          setProfessionalSharingEnabled(JSON.parse(saved));
        }
      } catch (error) {
        console.error('Error loading professional sharing setting:', error);
      }
    };
    loadProfessionalSetting();
  }, []);

  // Handle professional sharing toggle
  const handleProfessionalSharingToggle = async (value: boolean) => {
    try {
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
                await AsyncStorage.setItem('professionalSharingEnabled', 'true');
                
                // Show professional dashboard after enabling
                setTimeout(() => {
                  setShowProfessionalDashboard(true);
                }, 500);
              }
            }
          ]
        );
      } else {
        // Disable without confirmation
        setProfessionalSharingEnabled(false);
        await AsyncStorage.setItem('professionalSharingEnabled', 'false');
        
        Alert.alert(
          'Professional Sharing Disabled',
          'Professional data sharing has been disabled. Your data will remain private.',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('Error updating professional sharing setting:', error);
      Alert.alert('Error', 'Failed to update professional sharing setting.');
    }
  };

  // Handle professional dashboard access
  const handleProfessionalDashboard = () => {
    if (professionalSharingEnabled) {
      setShowProfessionalDashboard(true);
    } else {
      Alert.alert(
        'Professional Sharing Disabled',
        'Please enable Professional Sharing first to access the dashboard.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Enable Now',
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
            router.replace('/(auth)/login');
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
      Alert.alert('Exporting...', 'Please wait while we prepare your data.');
      
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
          exportedBy: 'Habit Tracker App',
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
          accountCreated: userData.user_created_at || 'Unknown',
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
                  title: habit.title || 'Unnamed Habit',
                  category: habit.category || 'Uncategorized',
                  createdDate: habit.createdAt || 'Unknown',
                  currentStreak: habit.streak || 0,
                  bestStreak: habit.bestStreak || 0,
                  totalCompletions: habit.completedDates?.length || 0,
                  completionRate: habit.completedDates?.length ? 
                    ((habit.completedDates.length / Math.max(1, Math.ceil((new Date().getTime() - new Date(habit.createdAt || Date.now()).getTime()) / (1000 * 60 * 60 * 24)))) * 100).toFixed(1) + '%' : '0%',
                  reminderSettings: {
                    enabled: habit.reminderEnabled || false,
                    time: habit.reminderTime || 'Not set',
                    days: habit.reminderDays || []
                  },
                  recentActivity: habit.completedDates?.slice(-7) || []
                };
              } catch {
                return { title: 'Invalid habit data', error: 'Could not parse habit data' };
              }
            })
        },
        
        // Mood tracking data (organized by date)
        moodData: {
          summary: {
            totalEntries: moodData.length,
            dateRange: {
              earliest: moodData.length > 0 ? moodData[0]?.date : 'No data',
              latest: moodData.length > 0 ? moodData[moodData.length - 1]?.date : 'No data'
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
              description: entry.note || 'No note'
            },
            triggers: entry.triggers || [],
            context: entry.context || 'No context provided'
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
            notes: entry.note || 'No notes'
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
          dataPrivacy: 'This export contains your personal habit and mood data. Please keep it secure.',
          dataFormat: 'All dates are in ISO format (YYYY-MM-DD). Times are in 24-hour format.',
          moodScale: 'Mood intensity is rated on a scale of 1-10, where 1 is very low and 10 is very high.',
          completionRate: 'Completion rates are calculated from the habit creation date to today.',
          support: 'If you have questions about this data, please contact our support team.'
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
          dialogTitle: 'Export Your Habit Tracker Data'
        });
      }
      
      Alert.alert(
        'Export Complete! 📊',
        `Your data has been exported successfully!\n\n📈 ${exportData.userSummary.totalDaysActive} days of data\n🎯 ${exportData.habitsData.summary.totalHabits} habits tracked\n😊 ${exportData.moodData.summary.totalEntries} mood entries\n\nThe file is organized with clear sections and summaries for easy reading.`
      );
    } catch (error) {
      console.error('Export error:', error);
      Alert.alert(
        'Export Failed',
        'There was an error exporting your data. Please try again.'
      );
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style={currentTheme.isDark ? 'light' : 'dark'} />
      
      {/* Modern Header with User Info */}
      <View style={styles.header}>
        <View style={styles.userSection}>
          <View style={styles.avatarContainer}>
            <User size={24} color={currentTheme.colors.primary} />
          </View>
          <View style={styles.userInfo}>
            <Text style={styles.userName}>Welcome back!</Text>
            <Text style={styles.userEmail}>{user?.email || 'Guest User'}</Text>
          </View>
          {isPremiumUser && (
            <View style={styles.premiumBadge}>
              <Crown size={16} color={currentTheme.colors.warning} />
              <Text style={styles.premiumText}>Pro</Text>
            </View>
          )}
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Quick Actions Grid */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.quickGrid}>
            <TouchableOpacity style={styles.quickItem} onPress={() => setShowThemeSelector(true)}>
              <View style={[styles.quickIcon, { backgroundColor: `${currentTheme.colors.primary}15` }]}>
                <Palette size={20} color={currentTheme.colors.primary} />
              </View>
              <Text style={styles.quickText}>Themes</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.quickItem} onPress={() => setShowLanguageSelector(true)}>
              <View style={[styles.quickIcon, { backgroundColor: `${currentTheme.colors.success}15` }]}>
                <Globe size={20} color={currentTheme.colors.success} />
              </View>
              <Text style={styles.quickText}>Language</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.quickItem} onPress={handleProfilePress}>
              <View style={[styles.quickIcon, { backgroundColor: `${currentTheme.colors.accent}15` }]}>
                <User size={20} color={currentTheme.colors.accent} />
              </View>
              <Text style={styles.quickText}>Profile</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.quickItem} onPress={handleNotificationSettings}>
              <View style={[styles.quickIcon, { backgroundColor: `${currentTheme.colors.warning}15` }]}>
                <Bell size={20} color={currentTheme.colors.warning} />
              </View>
              <Text style={styles.quickText}>Notifications</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Premium Upgrade Banner */}
        {!isPremiumUser && (
          <TouchableOpacity style={styles.premiumBanner}>
            <View style={styles.premiumContent}>
              <View style={styles.premiumIconContainer}>
                <Crown size={24} color={currentTheme.colors.warning} />
              </View>
              <View style={styles.premiumInfo}>
                <Text style={styles.premiumTitle}>Upgrade to Pro</Text>
                <Text style={styles.premiumSubtitle}>Unlock all features & advanced analytics</Text>
              </View>
              <View style={styles.premiumArrow}>
                <ChevronRight size={20} color={currentTheme.colors.warning} />
              </View>
            </View>
          </TouchableOpacity>
        )}

        {/* Community & Social */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Users size={20} color={currentTheme.colors.accent} />
            <Text style={styles.sectionTitle}>Community & Social</Text>
          </View>
          
          <View style={styles.card}>
            <TouchableOpacity style={styles.menuItem} onPress={() => setShowCommunityFeed(true)}>
              <MessageCircle size={20} color={currentTheme.colors.textSecondary} />
              <Text style={styles.menuText}>Community Feed</Text>
              <ChevronRight size={16} color={currentTheme.colors.textSecondary} />
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.menuItem} onPress={() => setShowInviteFriends(true)}>
              <UserPlus size={20} color={currentTheme.colors.textSecondary} />
              <Text style={styles.menuText}>Invite Friends</Text>
              <ChevronRight size={16} color={currentTheme.colors.textSecondary} />
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.menuItem} onPress={() => setShowShareProgress(true)}>
              <Share2 size={20} color={currentTheme.colors.textSecondary} />
              <Text style={styles.menuText}>Share Progress</Text>
              <ChevronRight size={16} color={currentTheme.colors.textSecondary} />
            </TouchableOpacity>
            
            <View style={[styles.menuItem, { borderBottomWidth: 0 }]}>
              <Users size={20} color={currentTheme.colors.textSecondary} />
              <Text style={styles.menuText}>Community Features</Text>
              <Switch
                value={communityFeaturesEnabled}
                onValueChange={setCommunityFeaturesEnabled}
                trackColor={{ false: currentTheme.colors.surface, true: `${currentTheme.colors.accent}50` }}
                thumbColor={communityFeaturesEnabled ? currentTheme.colors.accent : currentTheme.colors.textSecondary}
              />
            </View>
          </View>
        </View>

        {/* App Experience */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <SettingsIcon size={20} color={currentTheme.colors.primary} />
            <Text style={styles.sectionTitle}>App Experience</Text>
          </View>
          
          <View style={styles.card}>
            <View style={styles.menuItem}>
              <Sparkles size={20} color={currentTheme.colors.textSecondary} />
              <Text style={styles.menuText}>Animations</Text>
              <Switch
                value={animationsEnabled}
                onValueChange={setAnimationsEnabled}
                trackColor={{ false: currentTheme.colors.surface, true: `${currentTheme.colors.primary}50` }}
                thumbColor={animationsEnabled ? currentTheme.colors.primary : currentTheme.colors.textSecondary}
              />
            </View>
            
            <View style={styles.menuItem}>
              <Activity size={20} color={currentTheme.colors.textSecondary} />
              <Text style={styles.menuText}>Wellness Tracking</Text>
              <Switch
                value={wellnessTrackingEnabled}
                onValueChange={setWellnessTrackingEnabled}
                trackColor={{ false: currentTheme.colors.surface, true: `${currentTheme.colors.success}50` }}
                thumbColor={wellnessTrackingEnabled ? currentTheme.colors.success : currentTheme.colors.textSecondary}
              />
            </View>
            
            <View style={[styles.menuItem, { borderBottomWidth: 0 }]}>
              <Stethoscope size={20} color={currentTheme.colors.textSecondary} />
              <Text style={styles.menuText}>Professional Sharing</Text>
              <Switch
                value={professionalSharingEnabled}
                onValueChange={handleProfessionalSharingToggle}
                trackColor={{ false: currentTheme.colors.surface, true: `${currentTheme.colors.primary}50` }}
                thumbColor={professionalSharingEnabled ? currentTheme.colors.primary : currentTheme.colors.textSecondary}
              />
            </View>
          </View>
        </View>

        {/* Professional Dashboard Access - Show when enabled */}
        {professionalSharingEnabled && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Stethoscope size={20} color={currentTheme.colors.primary} />
              <Text style={styles.sectionTitle}>Professional Tools</Text>
            </View>
            
            <View style={styles.card}>
              <TouchableOpacity style={styles.menuItem} onPress={handleProfessionalDashboard}>
                <Users size={20} color={currentTheme.colors.textSecondary} />
                <Text style={styles.menuText}>Professional Dashboard</Text>
                <ChevronRight size={20} color={currentTheme.colors.textSecondary} />
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Account & Security */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Shield size={20} color={currentTheme.colors.primary} />
            <Text style={styles.sectionTitle}>Account & Security</Text>
          </View>
          
          <View style={styles.card}>
            <TouchableOpacity style={styles.menuItem} onPress={handleChangePassword}>
              <Lock size={20} color={currentTheme.colors.textSecondary} />
              <Text style={styles.menuText}>Change Password</Text>
              <ChevronRight size={16} color={currentTheme.colors.textSecondary} />
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.menuItem} onPress={handleLinkedAccounts}>
              <Link size={20} color={currentTheme.colors.textSecondary} />
              <Text style={styles.menuText}>Linked Accounts</Text>
              <ChevronRight size={16} color={currentTheme.colors.textSecondary} />
            </TouchableOpacity>
            
            <TouchableOpacity style={[styles.menuItem, { borderBottomWidth: 0 }]} onPress={handlePrivacySettings}>
              <Shield size={20} color={currentTheme.colors.textSecondary} />
              <Text style={styles.menuText}>Privacy Settings</Text>
              <ChevronRight size={16} color={currentTheme.colors.textSecondary} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Data & Support */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Info size={20} color={currentTheme.colors.primary} />
            <Text style={styles.sectionTitle}>Data & Support</Text>
          </View>
          
          <View style={styles.card}>
            <TouchableOpacity style={styles.menuItem} onPress={handleDataExport}>
              <Download size={20} color={currentTheme.colors.textSecondary} />
              <Text style={styles.menuText}>Export Data</Text>
              <ChevronRight size={16} color={currentTheme.colors.textSecondary} />
            </TouchableOpacity>
            
            <View style={styles.menuItem}>
              <Text style={styles.menuText}>App Version</Text>
              <Text style={styles.versionText}>1.0.0</Text>
            </View>
            
            <TouchableOpacity 
              style={[styles.menuItem, styles.dangerItem, { borderBottomWidth: 0 }]} 
              onPress={handleAccountDeletion}
            >
              <Trash2 size={20} color={currentTheme.colors.error} />
              <Text style={[styles.menuText, styles.dangerText]}>Delete Account</Text>
              <ChevronRight size={16} color={currentTheme.colors.error} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Sign Out */}
        <TouchableOpacity style={styles.signOutButton} onPress={handleLogout}>
          <LogOut size={20} color={currentTheme.colors.error} />
          <Text style={styles.signOutText}>Sign Out</Text>
        </TouchableOpacity>

        <View style={styles.bottomSpacing} />
      </ScrollView>

      {/* Modals */}
      {showThemeSelector && (
        <ThemeSelector
          visible={showThemeSelector}
          onClose={() => setShowThemeSelector(false)}
        />
      )}
      
      {showLanguageSelector && (
        <LanguageSelector
          visible={showLanguageSelector}
          onClose={() => setShowLanguageSelector(false)}
        />
      )}
      
      {showCommunityFeed && (
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Community Feed</Text>
              <TouchableOpacity onPress={() => setShowCommunityFeed(false)}>
                <Text style={styles.modalClose}>Close</Text>
              </TouchableOpacity>
            </View>
            <SocialCommunityFeed isModal={true} />
          </View>
        </View>
      )}
      
      {showInviteFriends && (
        <InviteFriends onClose={() => setShowInviteFriends(false)} />
      )}
      
      {showShareProgress && (
        <ShareProgress
          visible={showShareProgress}
          onClose={() => setShowShareProgress(false)}
        />
      )}
      
      {/* Professional Dashboard Modal - Updated for better UX */}
      {showProfessionalDashboard && (
        <View style={styles.fullScreenModalContainer}>
          <View style={styles.fullScreenModalContent}>
            <View style={styles.fullScreenModalHeader}>
              <Text style={styles.fullScreenModalTitle}>Professional Dashboard</Text>
              <TouchableOpacity 
                style={styles.closeButton}
                onPress={() => setShowProfessionalDashboard(false)}
              >
                <Text style={styles.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.dashboardContainer}>
              <ProfessionalDashboard 
                clientId={user?.id || 'demo-user'} 
                userRole="healthcare_provider" 
              />
            </View>
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
    width: 48,
    height: 48,
    borderRadius: 24,
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
    fontWeight: '700',
    color: colors.text,
    marginBottom: 2,
  },
  userEmail: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  premiumBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: `${colors.warning}15`,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: `${colors.warning}30`,
  },
  premiumText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.warning,
    marginLeft: 4,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  section: {
    marginTop: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginLeft: 8,
  },
  quickGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  quickItem: {
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 6,
  },
  quickIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  quickText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.text,
    textAlign: 'center',
  },
  premiumBanner: {
    marginTop: 24,
    backgroundColor: `${colors.warning}08`,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: `${colors.warning}20`,
    overflow: 'hidden',
  },
  premiumContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
  },
  premiumIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: `${colors.warning}15`,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  premiumInfo: {
    flex: 1,
  },
  premiumTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 4,
  },
  premiumSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  premiumArrow: {
    marginLeft: 12,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: 16,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    overflow: 'hidden',
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
    fontSize: 16,
    fontWeight: '500',
    color: colors.text,
    marginLeft: 12,
    flex: 1,
  },
  versionText: {
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  dangerItem: {
    borderBottomColor: `${colors.error}20`,
  },
  dangerText: {
    color: colors.error,
  },
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: `${colors.error}10`,
    marginTop: 32,
    paddingVertical: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: `${colors.error}20`,
  },
  signOutText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.error,
    marginLeft: 8,
  },
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
  bottomSpacing: {
    height: 40,
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
});