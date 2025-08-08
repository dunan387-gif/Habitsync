import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useTheme } from '@/context/ThemeContext';
import { useLanguage } from '@/context/LanguageContext';
import { useCache } from '@/hooks/useCache';
import { CacheKeys, CacheExpiry } from '@/services/CacheService';
import { Database, Zap, RefreshCw } from 'lucide-react-native';

export default function CacheDemo() {
  const { currentTheme } = useTheme();
  const { t } = useLanguage();
  const { getStats, getHitRate, clearByPattern } = useCache();
  const [stats, setStats] = useState<any>(null);

  const updateStats = () => {
    setStats({
      ...getStats(),
      hitRate: getHitRate()
    });
  };

  const handleClearCache = async () => {
    await clearByPattern(/analytics_|wellness_/);
    updateStats();
  };

  const styles = createStyles(currentTheme.colors);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Database size={24} color={currentTheme.colors.primary} />
        <Text style={styles.title}>Cache Performance</Text>
        <Zap size={24} color={currentTheme.colors.primary} />
      </View>

      <TouchableOpacity style={styles.refreshButton} onPress={updateStats}>
        <RefreshCw size={16} color={currentTheme.colors.primary} />
        <Text style={styles.refreshText}>Refresh Stats</Text>
      </TouchableOpacity>

      {stats && (
        <View style={styles.statsContainer}>
          <View style={styles.statRow}>
            <Text style={styles.statLabel}>Cache Hits:</Text>
            <Text style={styles.statValue}>{stats.hits}</Text>
          </View>
          <View style={styles.statRow}>
            <Text style={styles.statLabel}>Cache Misses:</Text>
            <Text style={styles.statValue}>{stats.misses}</Text>
          </View>
          <View style={styles.statRow}>
            <Text style={styles.statLabel}>Hit Rate:</Text>
            <Text style={styles.statValue}>{(stats.hitRate * 100).toFixed(1)}%</Text>
          </View>
          <View style={styles.statRow}>
            <Text style={styles.statLabel}>Cache Size:</Text>
            <Text style={styles.statValue}>{stats.size}</Text>
          </View>
        </View>
      )}

      <TouchableOpacity style={styles.clearButton} onPress={handleClearCache}>
        <Text style={styles.clearButtonText}>Clear Analytics Cache</Text>
      </TouchableOpacity>
    </View>
  );
}

const createStyles = (colors: any) => StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginHorizontal: 8,
  },
  refreshButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  refreshText: {
    marginLeft: 8,
    color: colors.text,
    fontWeight: '500',
  },
  statsContainer: {
    backgroundColor: colors.surface,
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  statLabel: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  statValue: {
    fontSize: 14,
    color: colors.text,
    fontWeight: '600',
  },
  clearButton: {
    backgroundColor: colors.error,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  clearButtonText: {
    color: colors.surface,
    fontWeight: '600',
  },
});
