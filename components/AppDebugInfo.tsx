import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { useLanguage } from '@/context/LanguageContext';

export default function AppDebugInfo() {
  const { user, isLoading: authLoading } = useAuth();
  const { currentTheme } = useTheme();
  const { t, isLoading: languageLoading, currentLanguage } = useLanguage();

  const debugInfo = {
    auth: {
      loading: authLoading,
      hasUser: !!user,
      userId: user?.id,
      userEmail: user?.email,
      onboardingCompleted: user?.onboardingCompleted,
      userType: user ? (user.id.startsWith('guest-') ? 'Guest' : 'Authenticated') : 'No user'
    },
    language: {
      loading: languageLoading,
      currentLanguage: currentLanguage?.code,
      hasTranslations: !!t
    },
    theme: {
      isDark: currentTheme.isDark,
      primaryColor: currentTheme.colors.primary,
      backgroundColor: currentTheme.colors.background
    },
    app: {
      timestamp: new Date().toISOString(),
      platform: 'React Native'
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>App Debug Info</Text>
      <ScrollView style={styles.scrollView}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Authentication</Text>
          <Text style={styles.info}>Loading: {debugInfo.auth.loading ? 'Yes' : 'No'}</Text>
          <Text style={styles.info}>Has User: {debugInfo.auth.hasUser ? 'Yes' : 'No'}</Text>
          <Text style={styles.info}>User ID: {debugInfo.auth.userId || 'None'}</Text>
          <Text style={styles.info}>User Email: {debugInfo.auth.userEmail || 'None'}</Text>
          <Text style={styles.info}>User Type: {debugInfo.auth.userType}</Text>
          <Text style={styles.info}>Onboarding: {debugInfo.auth.onboardingCompleted ? 'Completed' : 'Not Completed'}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Language</Text>
          <Text style={styles.info}>Loading: {debugInfo.language.loading ? 'Yes' : 'No'}</Text>
          <Text style={styles.info}>Current Language: {debugInfo.language.currentLanguage || 'None'}</Text>
          <Text style={styles.info}>Has Translations: {debugInfo.language.hasTranslations ? 'Yes' : 'No'}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Theme</Text>
          <Text style={styles.info}>Dark Mode: {debugInfo.theme.isDark ? 'Yes' : 'No'}</Text>
          <Text style={styles.info}>Primary Color: {debugInfo.theme.primaryColor}</Text>
          <Text style={styles.info}>Background Color: {debugInfo.theme.backgroundColor}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>App Info</Text>
          <Text style={styles.info}>Timestamp: {debugInfo.app.timestamp}</Text>
          <Text style={styles.info}>Platform: {debugInfo.app.platform}</Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  scrollView: {
    flex: 1,
  },
  section: {
    backgroundColor: 'white',
    padding: 15,
    marginBottom: 15,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 10,
    color: '#333',
  },
  info: {
    fontSize: 14,
    marginBottom: 5,
    color: '#666',
  },
});
