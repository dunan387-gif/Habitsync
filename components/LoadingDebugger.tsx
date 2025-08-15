import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import { useTheme } from '@/context/ThemeContext';

export default function LoadingDebugger() {
  const { isLoading: authLoading, user } = useAuth();
  const { isLoading: languageLoading } = useLanguage();
  const { isLoading: themeLoading } = useTheme();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>🔍 Loading Debugger</Text>
      
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Authentication Context:</Text>
        <Text style={styles.status}>Loading: {authLoading ? '🔄 YES' : '✅ NO'}</Text>
        <Text style={styles.status}>User: {user ? `✅ ${user.email}` : '❌ None'}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Language Context:</Text>
        <Text style={styles.status}>Loading: {languageLoading ? '🔄 YES' : '✅ NO'}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Theme Context:</Text>
        <Text style={styles.status}>Loading: {themeLoading ? '🔄 YES' : '✅ NO'}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Overall Status:</Text>
        <Text style={styles.status}>
          {authLoading || languageLoading || themeLoading ? '🔄 STILL LOADING' : '✅ READY'}
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Debug Info:</Text>
        <Text style={styles.debugText}>
          Auth Loading: {authLoading.toString()}
        </Text>
        <Text style={styles.debugText}>
          Language Loading: {languageLoading.toString()}
        </Text>
        <Text style={styles.debugText}>
          Theme Loading: {themeLoading.toString()}
        </Text>
        <Text style={styles.debugText}>
          User ID: {user?.id || 'null'}
        </Text>
        <Text style={styles.debugText}>
          User Email: {user?.email || 'null'}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  section: {
    marginBottom: 15,
    padding: 10,
    backgroundColor: 'white',
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  status: {
    fontSize: 14,
    marginBottom: 2,
  },
  debugText: {
    fontSize: 12,
    fontFamily: 'monospace',
    marginBottom: 2,
  },
});
