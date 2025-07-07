import React, { useState } from 'react';
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

interface PrivacySetting {
  id: string;
  title: string;
  description: string;
  enabled: boolean;
  category: 'visibility' | 'data' | 'sharing';
}

export default function PrivacySettingsScreen() {
  const { currentTheme } = useTheme();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  
  const [privacySettings, setPrivacySettings] = useState<PrivacySetting[]>([
    {
      id: '1',
      title: 'Public Profile',
      description: 'Allow others to view your profile and achievements',
      enabled: false,
      category: 'visibility',
    },
    {
      id: '2',
      title: 'Show Streak Count',
      description: 'Display your current streaks on your profile',
      enabled: true,
      category: 'visibility',
    },
    {
      id: '3',
      title: 'Show Habit List',
      description: 'Allow others to see what habits you\'re tracking',
      enabled: false,
      category: 'visibility',
    },
    {
      id: '4',
      title: 'Analytics Collection',
      description: 'Help improve the app by sharing anonymous usage data',
      enabled: true,
      category: 'data',
    },
    {
      id: '5',
      title: 'Crash Reports',
      description: 'Automatically send crash reports to help fix bugs',
      enabled: true,
      category: 'data',
    },
    {
      id: '6',
      title: 'Performance Data',
      description: 'Share app performance data to improve user experience',
      enabled: false,
      category: 'data',
    },
    {
      id: '7',
      title: 'Social Sharing',
      description: 'Allow sharing achievements to social media',
      enabled: true,
      category: 'sharing',
    },
    {
      id: '8',
      title: 'Friend Recommendations',
      description: 'Suggest friends based on your contacts',
      enabled: false,
      category: 'sharing',
    },
  ]);

  const styles = createStyles(currentTheme.colors);

  const handleToggleSetting = async (id: string) => {
    setIsLoading(true);
    try {
      // TODO: Implement API call to update privacy settings
      await new Promise(resolve => setTimeout(resolve, 500));
      
      setPrivacySettings(prev => 
        prev.map(setting => 
          setting.id === id 
            ? { ...setting, enabled: !setting.enabled }
            : setting
        )
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to update privacy settings');
    } finally {
      setIsLoading(false);
    }
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
    switch (category) {
      case 'visibility':
        return 'Profile Visibility';
      case 'data':
        return 'Data Collection';
      case 'sharing':
        return 'Sharing & Social';
      default:
        return 'Privacy';
    }
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
        <Text style={styles.settingTitle}>{setting.title}</Text>
        <Text style={styles.settingDescription}>{setting.description}</Text>
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
        <Text style={styles.title}>Privacy Settings</Text>
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
          <Text style={styles.infoTitle}>Privacy Information</Text>
          <Text style={styles.infoText}>
            Your privacy is important to us. These settings control how your data is used and shared. You can change these settings at any time.
          </Text>
          
          <TouchableOpacity style={styles.linkButton}>
            <Text style={styles.linkText}>View Privacy Policy</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.linkButton}>
            <Text style={styles.linkText}>View Terms of Service</Text>
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