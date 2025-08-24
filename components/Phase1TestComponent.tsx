import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useCrossTabInsights } from '@/context/CrossTabInsightsContext';
import { useTheme } from '@/context/ThemeContext';
import { useLanguage } from '@/context/LanguageContext';

export default function Phase1TestComponent() {
  const { state, refreshAllData, generateTodayInsight } = useCrossTabInsights();
  const { currentTheme } = useTheme();
  const { t } = useLanguage();

  const handleRefresh = async () => {
    try {
      await refreshAllData();
    } catch (error) {
      console.error('Failed to refresh data:', error);
    }
  };

  const handleGenerateInsight = async () => {
    try {
      await generateTodayInsight();
    } catch (error) {
      console.error('Failed to generate insight:', error);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: currentTheme.colors.background }]}>
      <Text style={[styles.title, { color: currentTheme.colors.text }]}>
        Phase 1 Test Component
      </Text>
      
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: currentTheme.colors.text }]}>
          Cross-Tab Data Status
        </Text>
        
        <View style={styles.dataRow}>
          <Text style={[styles.label, { color: currentTheme.colors.textSecondary }]}>
            Loading:
          </Text>
          <Text style={[styles.value, { color: currentTheme.colors.text }]}>
            {state.isLoading ? 'Yes' : 'No'}
          </Text>
        </View>

        <View style={styles.dataRow}>
          <Text style={[styles.label, { color: currentTheme.colors.textSecondary }]}>
            Error:
          </Text>
          <Text style={[styles.value, { color: currentTheme.colors.text }]}>
            {state.error || 'None'}
          </Text>
        </View>

        <View style={styles.dataRow}>
          <Text style={[styles.label, { color: currentTheme.colors.textSecondary }]}>
            Last Updated:
          </Text>
          <Text style={[styles.value, { color: currentTheme.colors.text }]}>
            {state.lastUpdated ? state.lastUpdated.toLocaleTimeString() : 'Never'}
          </Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: currentTheme.colors.text }]}>
          Home Data
        </Text>
        
        <View style={styles.dataRow}>
          <Text style={[styles.label, { color: currentTheme.colors.textSecondary }]}>
            Today Completions:
          </Text>
          <Text style={[styles.value, { color: currentTheme.colors.text }]}>
            {state.data.home.todayCompletions}
          </Text>
        </View>

        <View style={styles.dataRow}>
          <Text style={[styles.label, { color: currentTheme.colors.textSecondary }]}>
            Total Habits:
          </Text>
          <Text style={[styles.value, { color: currentTheme.colors.text }]}>
            {state.data.home.totalHabits}
          </Text>
        </View>

        <View style={styles.dataRow}>
          <Text style={[styles.label, { color: currentTheme.colors.textSecondary }]}>
            Current Streak:
          </Text>
          <Text style={[styles.value, { color: currentTheme.colors.text }]}>
            {state.data.home.currentStreak}
          </Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: currentTheme.colors.text }]}>
          Today's Insight
        </Text>
        
        {state.todayInsight ? (
          <>
            <View style={styles.dataRow}>
              <Text style={[styles.label, { color: currentTheme.colors.textSecondary }]}>
                Main Metric:
              </Text>
              <Text style={[styles.value, { color: currentTheme.colors.text }]}>
                {state.todayInsight.mainMetric}
              </Text>
            </View>

            <View style={styles.dataRow}>
              <Text style={[styles.label, { color: currentTheme.colors.textSecondary }]}>
                Next Action:
              </Text>
              <Text style={[styles.value, { color: currentTheme.colors.text }]}>
                {state.todayInsight.nextAction}
              </Text>
            </View>

            <View style={styles.dataRow}>
              <Text style={[styles.label, { color: currentTheme.colors.textSecondary }]}>
                Motivation:
              </Text>
              <Text style={[styles.value, { color: currentTheme.colors.text }]}>
                {state.todayInsight.motivation}
              </Text>
            </View>

            <View style={styles.dataRow}>
              <Text style={[styles.label, { color: currentTheme.colors.textSecondary }]}>
                Priority:
              </Text>
              <Text style={[styles.value, { color: currentTheme.colors.text }]}>
                {state.todayInsight.priority}
              </Text>
            </View>
          </>
        ) : (
          <Text style={[styles.noData, { color: currentTheme.colors.textSecondary }]}>
            No insight generated yet
          </Text>
        )}
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.button, { backgroundColor: currentTheme.colors.primary }]}
          onPress={handleRefresh}
          disabled={state.isLoading}
        >
          <Text style={styles.buttonText}>
            {state.isLoading ? 'Refreshing...' : 'Refresh All Data'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, { backgroundColor: currentTheme.colors.accent }]}
          onPress={handleGenerateInsight}
          disabled={state.isLoading}
        >
          <Text style={styles.buttonText}>
            Generate Today's Insight
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  section: {
    marginBottom: 20,
    padding: 16,
    borderRadius: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  dataRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  label: {
    fontSize: 14,
    flex: 1,
  },
  value: {
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
    textAlign: 'right',
  },
  noData: {
    fontSize: 14,
    fontStyle: 'italic',
    textAlign: 'center',
  },
  buttonContainer: {
    gap: 12,
  },
  button: {
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});
