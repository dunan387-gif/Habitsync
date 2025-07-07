import React, { useState } from 'react';
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
  Settings as SettingsIcon
} from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '@/context/ThemeContext';
import { useLanguage } from '@/context/LanguageContext';
import ThemeSelector from '@/components/ThemeSelector';
import LanguageSelector from '@/components/LanguageSelector';
import { useCelebration } from '@/context/CelebrationContext';
import { useAuth } from '@/context/AuthContext';

export default function SettingsScreen() {
  const { currentTheme, isPremiumUser } = useTheme();
  const { currentLanguage, t } = useLanguage();
  const { user, logout } = useAuth();
  const router = useRouter();
  const [showThemeSelector, setShowThemeSelector] = useState(false);
  const [showLanguageSelector, setShowLanguageSelector] = useState(false);
  const { animationsEnabled, setAnimationsEnabled } = useCelebration();

  const styles = createStyles(currentTheme.colors);
  
  const handleLogout = async () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Logout', 
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
    // Navigate to change password screen
    router.push('/settings/change-password');
  };

  const handleLinkedAccounts = () => {
    // Navigate to linked accounts screen
    router.push('/settings/linked-accounts');
  };

  const handleNotificationSettings = () => {
    // Navigate to notification settings screen
    router.push('/settings/notification-preferences');
  };

  const handlePrivacySettings = () => {
    // Navigate to privacy settings screen
    router.push('/settings/privacy-settings');
  };

  const handleAccountDeletion = () => {
    Alert.alert(
      'Delete Account',
      'This action cannot be undone. All your data will be permanently deleted.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete Account', 
          style: 'destructive', 
          onPress: () => router.push('/settings/delete-account')
        },
      ]
    );
  };

  const handleExportData = () => {
    Alert.alert(
      'Export Data',
      'Your data will be prepared for download. This may take a few minutes.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Export', onPress: () => {
          // Implement data export logic
          Alert.alert('Export Started', 'You will receive an email when your data is ready for download.');
        }},
      ]
    );
  };
  
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: currentTheme.colors.background }]}>
      <StatusBar style={currentTheme.isDark ? 'light' : 'dark'} />
      
      <ScrollView style={styles.content}>
        {user && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>⚙️ Account & Settings</Text>
            
            {/* Edit Profile */}
            <TouchableOpacity
              style={styles.settingItem}
              onPress={handleProfilePress}
            >
              <View style={styles.settingLeft}>
                <User size={20} color={currentTheme.colors.primary} />
                <View style={styles.settingText}>
                  <Text style={styles.settingTitle}>Edit Profile</Text>
                  <Text style={styles.settingSubtitle}>
                    Manage your profile and preferences
                  </Text>
                </View>
              </View>
              <ChevronRight size={16} color={currentTheme.colors.textMuted} />
            </TouchableOpacity>

            {/* Change Password */}
            <TouchableOpacity
              style={styles.settingItem}
              onPress={handleChangePassword}
            >
              <View style={styles.settingLeft}>
                <Lock size={20} color={currentTheme.colors.primary} />
                <View style={styles.settingText}>
                  <Text style={styles.settingTitle}>Change Password</Text>
                  <Text style={styles.settingSubtitle}>
                    Update your account password
                  </Text>
                </View>
              </View>
              <ChevronRight size={16} color={currentTheme.colors.textMuted} />
            </TouchableOpacity>

            {/* Linked Accounts */}
            <TouchableOpacity
              style={styles.settingItem}
              onPress={handleLinkedAccounts}
            >
              <View style={styles.settingLeft}>
                <Link size={20} color={currentTheme.colors.primary} />
                <View style={styles.settingText}>
                  <Text style={styles.settingTitle}>Linked Accounts</Text>
                  <Text style={styles.settingSubtitle}>
                    Google, Apple, and other connections
                  </Text>
                </View>
              </View>
              <ChevronRight size={16} color={currentTheme.colors.textMuted} />
            </TouchableOpacity>
          </View>
        )}

        {/* Appearance & Preferences */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Appearance & Preferences</Text>
          
          {/* Language Selection */}
          <TouchableOpacity
            style={styles.settingItem}
            onPress={() => setShowLanguageSelector(true)}
          >
            <View style={styles.settingLeft}>
              <Globe size={20} color={currentTheme.colors.primary} />
              <View style={styles.settingText}>
                <Text style={styles.settingTitle}>Language Selection</Text>
                <Text style={styles.settingSubtitle}>
                  {currentLanguage.nativeName}
                </Text>
              </View>
            </View>
            <ChevronRight size={16} color={currentTheme.colors.textMuted} />
          </TouchableOpacity>
          
          {/* Theme Selection */}
          <TouchableOpacity
            style={styles.settingItem}
            onPress={() => setShowThemeSelector(true)}
          >
            <View style={styles.settingLeft}>
              <Palette size={20} color={currentTheme.colors.primary} />
              <View style={styles.settingText}>
                <Text style={styles.settingTitle}>Theme Selection</Text>
                <Text style={styles.settingSubtitle}>
                  {currentTheme.name}
                  {currentTheme.isPremium && ' • Premium'}
                </Text>
              </View>
            </View>
            <ChevronRight size={16} color={currentTheme.colors.textMuted} />
          </TouchableOpacity>
        </View>

        {/* Notifications & Communication */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notifications & Communication</Text>
          
          {/* Notification Preferences */}
          <TouchableOpacity
            style={styles.settingItem}
            onPress={handleNotificationSettings}
          >
            <View style={styles.settingLeft}>
              <Bell size={20} color={currentTheme.colors.primary} />
              <View style={styles.settingText}>
                <Text style={styles.settingTitle}>Notification Preferences</Text>
                <Text style={styles.settingSubtitle}>
                  Manage push notifications and reminders
                </Text>
              </View>
            </View>
            <ChevronRight size={16} color={currentTheme.colors.textMuted} />
          </TouchableOpacity>

          {/* Email Update Settings */}
          <View style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <Mail size={20} color={currentTheme.colors.primary} />
              <View style={styles.settingText}>
                <Text style={styles.settingTitle}>Email Updates</Text>
                <Text style={styles.settingSubtitle}>
                  Receive progress reports and tips
                </Text>
              </View>
            </View>
            <Switch
              value={user?.preferences?.emailUpdates || false}
              onValueChange={(value) => {
                // Update email preferences
                console.log('Email updates:', value);
              }}
              trackColor={{ 
                false: currentTheme.colors.border, 
                true: `${currentTheme.colors.primary}40` 
              }}
              thumbColor={user?.preferences?.emailUpdates ? currentTheme.colors.primary : currentTheme.colors.textMuted}
            />
          </View>
        </View>

        {/* Privacy & Security */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Privacy & Security</Text>
          
          {/* Privacy Settings */}
          <TouchableOpacity
            style={styles.settingItem}
            onPress={handlePrivacySettings}
          >
            <View style={styles.settingLeft}>
              <Shield size={20} color={currentTheme.colors.primary} />
              <View style={styles.settingText}>
                <Text style={styles.settingTitle}>Privacy Settings</Text>
                <Text style={styles.settingSubtitle}>
                  Profile visibility and analytics preferences
                </Text>
              </View>
            </View>
            <ChevronRight size={16} color={currentTheme.colors.textMuted} />
          </TouchableOpacity>
        </View>
        
        {/* Premium */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Premium</Text>
          
          <View style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <Crown size={20} color={currentTheme.colors.warning} />
              <View style={styles.settingText}>
                <Text style={styles.settingTitle}>
                  {isPremiumUser ? 'Premium Active' : 'Upgrade to Premium'}
                </Text>
                <Text style={styles.settingSubtitle}>
                  {isPremiumUser 
                    ? 'Enjoy unlimited features and themes'
                    : 'Unlock advanced features and premium themes'
                  }
                </Text>
              </View>
            </View>
          </View>
        </View>
        
        {/* Animations */}
        <View style={styles.animationsSection}>
          <View style={styles.animationsSectionHeader}>
            <View style={styles.animationsIconContainer}>
              <Text style={styles.animationsIcon}>✨</Text>
            </View>
            <View style={styles.animationsTitleContainer}>
              <Text style={styles.animationsSectionTitle}>Animations</Text>
              <Text style={styles.animationsSectionSubtitle}>Enhance your experience</Text>
            </View>
          </View>
          
          <View style={styles.animationsSettingCard}>
            <View style={styles.animationsSettingContent}>
              <View style={styles.animationsSettingInfo}>
                <Text style={styles.animationsSettingLabel}>Celebration Animations</Text>
                <Text style={styles.animationsSettingDescription}>
                  Show celebratory effects when completing habits
                </Text>
              </View>
              <View style={styles.switchContainer}>
                <Switch
                  value={animationsEnabled}
                  onValueChange={setAnimationsEnabled}
                  trackColor={{ 
                    false: currentTheme.colors.border, 
                    true: `${currentTheme.colors.primary}40` 
                  }}
                  thumbColor={animationsEnabled ? currentTheme.colors.primary : currentTheme.colors.textMuted}
                  ios_backgroundColor={currentTheme.colors.border}
                />
              </View>
            </View>
            {animationsEnabled && (
              <View style={styles.animationsPreview}>
                <Text style={styles.previewText}>🎉 Celebrations enabled!</Text>
              </View>
            )}
          </View>
        </View>

        {/* Data & Account Management */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Data & Account Management</Text>
          
          {/* Export Data */}
          <TouchableOpacity
            style={styles.settingItem}
            onPress={handleExportData}
          >
            <View style={styles.settingLeft}>
              <Download size={20} color={currentTheme.colors.primary} />
              <View style={styles.settingText}>
                <Text style={styles.settingTitle}>Export Data</Text>
                <Text style={styles.settingSubtitle}>
                  Download your habits and progress data
                </Text>
              </View>
            </View>
            <ChevronRight size={16} color={currentTheme.colors.textMuted} />
          </TouchableOpacity>

          {/* Account Deletion */}
          <TouchableOpacity
            style={[styles.settingItem, styles.dangerItem]}
            onPress={handleAccountDeletion}
          >
            <View style={styles.settingLeft}>
              <Trash2 size={20} color={currentTheme.colors.error} />
              <View style={styles.settingText}>
                <Text style={[styles.settingTitle, styles.dangerText]}>Delete Account</Text>
                <Text style={styles.settingSubtitle}>
                  Permanently delete your account and data
                </Text>
              </View>
            </View>
            <ChevronRight size={16} color={currentTheme.colors.error} />
          </TouchableOpacity>
        </View>
        
        {/* About */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About</Text>
          
          <View style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <Info size={20} color={currentTheme.colors.textSecondary} />
              <View style={styles.settingText}>
                <Text style={styles.settingTitle}>Version</Text>
                <Text style={styles.settingSubtitle}>1.0.0</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Logout */}
        {user && (
          <View style={styles.section}>
            <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
              <View style={styles.settingLeft}>
                <LogOut size={20} color={currentTheme.colors.error} />
                <View style={styles.settingText}>
                  <Text style={styles.logoutText}>Logout</Text>
                  <Text style={styles.settingSubtitle}>Sign out of your account</Text>
                </View>
              </View>
            </TouchableOpacity>
          </View>
        )}
        
        <ThemeSelector
          visible={showThemeSelector}
          onClose={() => setShowThemeSelector(false)}
        />
        
        <LanguageSelector
          visible={showLanguageSelector}
          onClose={() => setShowLanguageSelector(false)}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const createStyles = (colors: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingTop: 20,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: 16,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.card,
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingText: {
    marginLeft: 12,
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.text,
    marginBottom: 2,
  },
  settingSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  dangerItem: {
    borderWidth: 1,
    borderColor: colors.error + '20',
  },
  dangerText: {
    color: colors.error,
  },
  // Enhanced animations section styles
  animationsSection: {
    marginBottom: 32,
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: colors.text,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  animationsSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  animationsIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: `${colors.primary}15`,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  animationsIcon: {
    fontSize: 24,
  },
  animationsTitleContainer: {
    flex: 1,
  },
  animationsSectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 2,
  },
  animationsSectionSubtitle: {
    fontSize: 14,
    color: colors.textMuted,
    fontWeight: '500',
  },
  animationsSettingCard: {
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  animationsSettingContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  animationsSettingInfo: {
    flex: 1,
    marginRight: 16,
  },
  animationsSettingLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 6,
  },
  animationsSettingDescription: {
    fontSize: 14,
    color: colors.textMuted,
    lineHeight: 20,
  },
  switchContainer: {
    padding: 4,
  },
  animationsPreview: {
    marginTop: 16,
    padding: 12,
    backgroundColor: `${colors.success}10`,
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: colors.success,
  },
  previewText: {
    fontSize: 14,
    color: colors.success,
    fontWeight: '500',
    textAlign: 'center',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.card,
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colors.error + '20',
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.error,
    marginBottom: 2,
  },
});
// Remove these lines (lines 371-388):
// In your component:
// const { user, logout } = useAuth();
// 
// const handleLogout = async () => {
//   Alert.alert(
//     'Logout',
//     'Are you sure you want to logout?',
//     [
//       { text: 'Cancel', style: 'cancel' },
//       { text: 'Logout', style: 'destructive', onPress: logout },
//     ]
//   );
// };
// 
// // Add logout button in your settings UI
// <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
//   <Text style={styles.logoutText}>Logout</Text>
// </TouchableOpacity>
