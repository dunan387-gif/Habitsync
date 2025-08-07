import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Switch,
  ScrollView,
  Alert,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { ArrowLeft, Shield, Eye, Database, Share } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '@/context/ThemeContext';
import { useLanguage } from '@/context/LanguageContext';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface PrivacySetting {
  id: string;
  titleKey: string;
  descriptionKey: string;
  enabled: boolean;
  category: 'visibility' | 'data' | 'sharing';
}

export default function PrivacySettingsScreen() {
  const { currentTheme } = useTheme();
  const { t } = useLanguage();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  
  const [privacySettings, setPrivacySettings] = useState<PrivacySetting[]>([
    {
      id: 'publicProfile',
      titleKey: 'privacySettings.settings.publicProfile.title',
      descriptionKey: 'privacySettings.settings.publicProfile.description',
      enabled: false,
      category: 'visibility',
    },
    {
      id: 'showStreakCount',
      titleKey: 'privacySettings.settings.showStreakCount.title',
      descriptionKey: 'privacySettings.settings.showStreakCount.description',
      enabled: true,
      category: 'visibility',
    },
    {
      id: 'showHabitList',
      titleKey: 'privacySettings.settings.showHabitList.title',
      descriptionKey: 'privacySettings.settings.showHabitList.description',
      enabled: false,
      category: 'visibility',
    },
    {
      id: 'analyticsCollection',
      titleKey: 'privacySettings.settings.analyticsCollection.title',
      descriptionKey: 'privacySettings.settings.analyticsCollection.description',
      enabled: true,
      category: 'data',
    },
    {
      id: 'crashReports',
      titleKey: 'privacySettings.settings.crashReports.title',
      descriptionKey: 'privacySettings.settings.crashReports.description',
      enabled: true,
      category: 'data',
    },
    {
      id: 'performanceData',
      titleKey: 'privacySettings.settings.performanceData.title',
      descriptionKey: 'privacySettings.settings.performanceData.description',
      enabled: false,
      category: 'data',
    },
    {
      id: 'socialSharing',
      titleKey: 'privacySettings.settings.socialSharing.title',
      descriptionKey: 'privacySettings.settings.socialSharing.description',
      enabled: true,
      category: 'sharing',
    },
    {
      id: 'friendRecommendations',
      titleKey: 'privacySettings.settings.friendRecommendations.title',
      descriptionKey: 'privacySettings.settings.friendRecommendations.description',
      enabled: false,
      category: 'sharing',
    },
  ]);

  const styles = createStyles(currentTheme.colors);

  // Load privacy settings from AsyncStorage on component mount
  useEffect(() => {
    loadPrivacySettings();
  }, []);

  const loadPrivacySettings = async () => {
    try {
      const savedSettings = await AsyncStorage.getItem('privacySettings');
      if (savedSettings) {
        const parsedSettings = JSON.parse(savedSettings);
        setPrivacySettings(prev => 
          prev.map(setting => {
            const savedSetting = parsedSettings.find((s: any) => s.id === setting.id);
            return savedSetting ? { ...setting, enabled: savedSetting.enabled } : setting;
          })
        );
      }
    } catch (error) {
      console.error('Error loading privacy settings:', error);
    }
  };

  const savePrivacySettings = async (updatedSettings: PrivacySetting[]) => {
    try {
      await AsyncStorage.setItem('privacySettings', JSON.stringify(updatedSettings));
      
      // Also save to user preferences
      const userPreferences = await AsyncStorage.getItem('userPreferences');
      const preferences = userPreferences ? JSON.parse(userPreferences) : {};
      
      preferences.privacy = updatedSettings.reduce((acc, setting) => {
        acc[setting.id] = setting.enabled;
        return acc;
      }, {} as Record<string, boolean>);
      
      await AsyncStorage.setItem('userPreferences', JSON.stringify(preferences));
    } catch (error) {
      console.error('Error saving privacy settings:', error);
      throw error;
    }
  };

  const handleToggleSetting = async (id: string) => {
    setIsLoading(true);
    try {
      const updatedSettings = privacySettings.map(setting => 
        setting.id === id 
          ? { ...setting, enabled: !setting.enabled }
          : setting
      );
      
      setPrivacySettings(updatedSettings);
      await savePrivacySettings(updatedSettings);
      
      // Apply privacy setting immediately
      await applyPrivacySetting(id, !privacySettings.find(s => s.id === id)?.enabled);
      
    } catch (error) {
      Alert.alert(t('privacySettings.alerts.error'), t('privacySettings.alerts.failedToUpdate'));
      // Revert the change on error
      loadPrivacySettings();
    } finally {
      setIsLoading(false);
    }
  };

  const applyPrivacySetting = async (settingId: string, enabled: boolean) => {
    try {
      switch (settingId) {
        case 'analyticsCollection':
          await AsyncStorage.setItem('analyticsEnabled', enabled.toString());
          break;
        case 'crashReports':
          await AsyncStorage.setItem('crashReportsEnabled', enabled.toString());
          break;
        case 'socialSharing':
          await AsyncStorage.setItem('socialSharingEnabled', enabled.toString());
          break;
        case 'publicProfile':
          await AsyncStorage.setItem('publicProfileEnabled', enabled.toString());
          break;
        case 'showStreakCount':
          await AsyncStorage.setItem('showStreakCount', enabled.toString());
          break;
        case 'showHabitList':
          await AsyncStorage.setItem('showHabitList', enabled.toString());
          break;
        case 'performanceData':
          await AsyncStorage.setItem('performanceDataEnabled', enabled.toString());
          break;
        case 'friendRecommendations':
          await AsyncStorage.setItem('friendRecommendationsEnabled', enabled.toString());
          break;
      }
    } catch (error) {
      console.error('Error applying privacy setting:', error);
    }
  };

  const handleViewPrivacyPolicy = () => {
    router.push('/settings/privacy-policy');
  };

  const handleViewTermsOfService = () => {
    router.push('/settings/terms-of-service');
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'visibility':
        return <Eye size={20} color={currentTheme.colors.primary} />;
      case 'data':
        return <Database size={20} color={currentTheme.colors.primary} />;
      case 'sharing':
        return <Share size={20} color={currentTheme.colors.primary} />;
      default:
        return <Shield size={20} color={currentTheme.colors.primary} />;
    }
  };

  const getCategoryTitle = (category: string) => {
    return t(`privacySettings.categories.${category}`);
  };

  const groupedSettings = privacySettings.reduce((acc, setting) => {
    if (!acc[setting.category]) {
      acc[setting.category] = [];
    }
    acc[setting.category].push(setting);
    return acc;
  }, {} as Record<string, PrivacySetting[]>);

  const renderSettingItem = (setting: PrivacySetting) => (
    <View key={setting.id} style={styles.settingItem}>
      <View style={styles.settingInfo}>
        <Text style={styles.settingTitle}>{t(setting.titleKey)}</Text>
        <Text style={styles.settingDescription}>{t(setting.descriptionKey)}</Text>
      </View>
      <Switch
        value={setting.enabled}
        onValueChange={() => handleToggleSetting(setting.id)}
        disabled={isLoading}
        trackColor={{ false: currentTheme.colors.border, true: currentTheme.colors.primary }}
        thumbColor={currentTheme.colors.background}
      />
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: currentTheme.colors.background }]}>
      <StatusBar style={currentTheme.isDark ? 'light' : 'dark'} />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color={currentTheme.colors.text} />
        </TouchableOpacity>
        <Text style={styles.title}>{t('privacySettings.title')}</Text>
      </View>

      <ScrollView style={styles.content}>
        {Object.entries(groupedSettings).map(([category, categorySettings]) => (
          <View key={category} style={styles.categorySection}>
            <View style={styles.categoryHeader}>
              {getCategoryIcon(category)}
              <Text style={styles.categoryTitle}>{getCategoryTitle(category)}</Text>
            </View>
            
            <View style={styles.categoryContent}>
              {categorySettings.map(renderSettingItem)}
            </View>
          </View>
        ))}
        
        <View style={styles.infoSection}>
          <Text style={styles.infoTitle}>{t('privacySettings.privacyInfo.title')}</Text>
          <Text style={styles.infoText}>
            {t('privacySettings.privacyInfo.description')}
          </Text>
          
          <TouchableOpacity style={styles.linkButton} onPress={handleViewPrivacyPolicy}>
            <Text style={styles.linkText}>{t('privacySettings.privacyInfo.viewPrivacyPolicy')}</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.linkButton} onPress={handleViewTermsOfService}>
            <Text style={styles.linkText}>{t('privacySettings.privacyInfo.viewTermsOfService')}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const createStyles = (colors: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingTop: 50,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: {
    marginRight: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.text,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  categorySection: {
    marginBottom: 32,
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  categoryTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginLeft: 8,
  },
  categoryContent: {
    backgroundColor: colors.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  settingInfo: {
    flex: 1,
    marginRight: 16,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.text,
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 14,
    color: colors.textMuted,
    lineHeight: 18,
  },
  infoSection: {
    backgroundColor: colors.card,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    marginTop: 16,
    marginBottom: 42, // Add this line for bottom spacing
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.text,
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: colors.textMuted,
    lineHeight: 20,
    marginBottom: 16,
  },
  linkButton: {
    paddingVertical: 8,
  },
  linkText: {
    fontSize: 14,
    color: colors.primary,
    textDecorationLine: 'underline',
  },
});

// Add to existing privacy settings
const moodPrivacySettings: PrivacySetting[] = [
  {
    id: 'mood_data_encryption',
    titleKey: 'privacySettings.settings.moodDataEncryption.title',
    descriptionKey: 'privacySettings.settings.moodDataEncryption.description',
    enabled: true,
    category: 'data'
  },
  {
    id: 'mood_analytics_sharing',
    titleKey: 'privacySettings.settings.moodAnalyticsSharing.title',
    descriptionKey: 'privacySettings.settings.moodAnalyticsSharing.description',
    enabled: false,
    category: 'sharing'
  },
  {
    id: 'anonymized_insights',
    titleKey: 'privacySettings.settings.anonymizedInsights.title',
    descriptionKey: 'privacySettings.settings.anonymizedInsights.description',
    enabled: true,
    category: 'data'
  },
  {
    id: 'mood_data_retention',
    titleKey: 'privacySettings.settings.moodDataRetention.title',
    descriptionKey: 'privacySettings.settings.moodDataRetention.description',
    enabled: true,
    category: 'data'
  }
];