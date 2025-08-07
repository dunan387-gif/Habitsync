// Real-time Performance Alerts Component

import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Alert } from 'react-native';
import { AlertTriangle, CheckCircle, X, Bell, Settings, Crown } from 'lucide-react-native';
import { usePerformanceMonitoring } from '@/hooks/usePerformanceMonitoring';
import { useMemoryManagement } from '@/hooks/useMemoryManagement';
import { useNetworkOptimization } from '@/hooks/useNetworkOptimization';
import { useTheme } from '@/context/ThemeContext';
import { useLanguage } from '@/context/LanguageContext';
import { usePerformanceAlerts } from '@/context/PerformanceAlertsContext';
import { useSubscription } from '@/context/SubscriptionContext';
import PerformanceAlertsSettings from './PerformanceAlertsSettings';

interface PerformanceAlert {
  id: string;
  type: 'warning' | 'critical' | 'info' | 'success';
  title: string;
  message: string;
  timestamp: number;
  dismissed: boolean;
  action?: () => void;
  actionLabel?: string;
}

interface PerformanceAlertsProps {
  maxAlerts?: number;
  autoDismiss?: boolean;
  autoDismissDelay?: number; // milliseconds
  showSettings?: boolean;
}

export default function PerformanceAlerts({
  maxAlerts = 5,
  autoDismiss = true,
  autoDismissDelay = 10000, // 10 seconds
  showSettings = true
}: PerformanceAlertsProps) {
  const { currentTheme } = useTheme();
  const { t } = useLanguage();
  const { settings: alertSettings } = usePerformanceAlerts();
  const { canUsePerformanceAlerts, showUpgradePrompt } = useSubscription();
  
  // Safety check for currentTheme
  if (!currentTheme || !currentTheme.colors) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>Loading...</Text>
      </View>
    );
  }
  
  const styles = createStyles(currentTheme.colors);
  
  // Check if user can access performance alerts - only show upgrade prompt if there are actual alerts
  if (!canUsePerformanceAlerts()) {
    // Don't show upgrade prompt immediately, only when there are performance issues
    return null;
  }

  // ALWAYS call all hooks first, regardless of settings
  const [alerts, setAlerts] = useState<PerformanceAlert[]>([]);
  const [showAlerts, setShowAlerts] = useState(true);
  const [settingsVisible, setSettingsVisible] = useState(false);
  const slideAnim = new Animated.Value(0);

  // Performance monitoring hooks
  const { metrics, events } = usePerformanceMonitoring();
  const { memoryInfo, isMemoryLow, isMemoryCritical, memoryAlerts, optimizeMemory } = useMemoryManagement();
  const { getNetworkStats, isOnline, connectionQuality, clearRequestHistory } = useNetworkOptimization();

  // Alert thresholds
  const alertThresholds = useMemo(() => ({
    renderTime: 100, // ms
    memoryUsage: 80, // percentage
    networkFailures: 5, // count
    cacheHitRate: 50, // percentage
    responseTime: 2000 // ms
  }), []);

  // Generate alerts based on performance metrics
  useEffect(() => {
    const newAlerts: PerformanceAlert[] = [];

    // Render time alerts
    if (metrics.renderTime > alertThresholds.renderTime) {
      const alertType = metrics.renderTime > alertThresholds.renderTime * 2 ? 'critical' : 'warning';
      
      // Check if this type of alert should be shown
      if ((alertType === 'critical' && alertSettings.showCriticalAlerts) ||
          (alertType === 'warning' && alertSettings.showWarningAlerts)) {
        newAlerts.push({
          id: `render_${Date.now()}`,
          type: alertType,
          title: t('performance.alerts.slowRendering'),
          message: t('performance.alerts.slowRenderingMessage', { time: metrics.renderTime.toFixed(1), threshold: alertThresholds.renderTime }),
          timestamp: Date.now(),
          dismissed: false,
          action: () => {
            // In a real app, you might trigger performance optimization
            console.log('Optimizing render performance...');
          },
          actionLabel: t('performance.alerts.optimize')
        });
      }
    }

    // Memory alerts
    if (memoryInfo && memoryInfo.memoryUsagePercent > alertThresholds.memoryUsage) {
      const alertType = isMemoryCritical ? 'critical' : 'warning';
      
      // Check if this type of alert should be shown
      if ((alertType === 'critical' && alertSettings.showCriticalAlerts) ||
          (alertType === 'warning' && alertSettings.showWarningAlerts)) {
        newAlerts.push({
          id: `memory_${Date.now()}`,
          type: alertType,
          title: t('performance.alerts.highMemoryUsage'),
          message: t('performance.alerts.highMemoryUsageMessage', { usage: memoryInfo.memoryUsagePercent.toFixed(1), threshold: alertThresholds.memoryUsage }),
          timestamp: Date.now(),
          dismissed: false,
          action: optimizeMemory,
          actionLabel: t('performance.alerts.optimizeMemory')
        });
      }
    }

    // Network alerts
    const networkStats = getNetworkStats();
    if (networkStats.failedRequests > alertThresholds.networkFailures) {
      if (alertSettings.showWarningAlerts) {
        newAlerts.push({
          id: `network_${Date.now()}`,
          type: 'warning',
          title: t('performance.alerts.networkIssues'),
          message: t('performance.alerts.networkIssuesMessage', { count: networkStats.failedRequests }),
          timestamp: Date.now(),
          dismissed: false,
          action: clearRequestHistory,
          actionLabel: t('performance.alerts.clearHistory')
        });
      }
    }

    // Cache performance alerts
    if (metrics.cacheHitRate < alertThresholds.cacheHitRate) {
      if (alertSettings.showInfoAlerts) {
        newAlerts.push({
          id: `cache_${Date.now()}`,
          type: 'info',
          title: t('performance.alerts.lowCacheHitRate'),
          message: t('performance.alerts.lowCacheHitRateMessage', { rate: metrics.cacheHitRate.toFixed(1), threshold: alertThresholds.cacheHitRate }),
          timestamp: Date.now(),
          dismissed: false
        });
      }
    }

    // Connection quality alerts
    if (!isOnline) {
      if (alertSettings.showCriticalAlerts) {
        newAlerts.push({
          id: `connection_${Date.now()}`,
          type: 'critical',
          title: t('performance.alerts.noConnection'),
          message: t('performance.alerts.noConnectionMessage'),
          timestamp: Date.now(),
          dismissed: false
        });
      }
    } else if (connectionQuality === 'poor') {
      if (alertSettings.showWarningAlerts) {
        newAlerts.push({
          id: `quality_${Date.now()}`,
          type: 'warning',
          title: t('performance.alerts.poorConnection'),
          message: t('performance.alerts.poorConnectionMessage'),
          timestamp: Date.now(),
          dismissed: false
        });
      }
    }

    // Add new alerts
    if (newAlerts.length > 0) {
      setAlerts(prev => {
        const combined = [...prev, ...newAlerts];
        return combined
          .filter(alert => !alert.dismissed)
          .sort((a, b) => {
            // Sort by priority: critical > warning > info > success
            const priorityOrder = { critical: 0, warning: 1, info: 2, success: 3 };
            return priorityOrder[a.type] - priorityOrder[b.type];
          })
          .slice(0, alertSettings.maxAlerts);
      });
    }
  }, [metrics, memoryInfo, isMemoryLow, isMemoryCritical, getNetworkStats, isOnline, connectionQuality, alertThresholds, optimizeMemory, clearRequestHistory, maxAlerts]);

  // Auto-dismiss alerts
  useEffect(() => {
    if (!alertSettings.autoDismiss) return;

    const timer = setTimeout(() => {
      setAlerts(prev => prev.filter(alert => {
        const age = Date.now() - alert.timestamp;
        return age < alertSettings.autoDismissDelay;
      }));
    }, alertSettings.autoDismissDelay);

    return () => clearTimeout(timer);
  }, [alerts, alertSettings.autoDismiss, alertSettings.autoDismissDelay]);

  // Animate alerts in/out
  useEffect(() => {
    Animated.timing(slideAnim, {
      toValue: showAlerts && alerts.length > 0 ? 1 : 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [showAlerts, alerts.length, slideAnim]);

  // Dismiss alert
  const dismissAlert = (alertId: string) => {
    setAlerts(prev => prev.map(alert => 
      alert.id === alertId ? { ...alert, dismissed: true } : alert
    ));
  };

  // Dismiss all alerts
  const dismissAllAlerts = () => {
    setAlerts(prev => prev.map(alert => ({ ...alert, dismissed: true })));
  };

  // Handle alert action
  const handleAlertAction = (alert: PerformanceAlert) => {
    if (alert.action) {
      alert.action();
    }
    dismissAlert(alert.id);
  };

  // Get alert icon and color
  const getAlertStyle = (type: PerformanceAlert['type']) => {
    switch (type) {
      case 'critical':
        return {
          icon: AlertTriangle,
          color: currentTheme.colors.error,
          backgroundColor: currentTheme.colors.error + '20'
        };
      case 'warning':
        return {
          icon: AlertTriangle,
          color: currentTheme.colors.warning,
          backgroundColor: currentTheme.colors.warning + '20'
        };
      case 'info':
        return {
          icon: Bell,
          color: currentTheme.colors.primary,
          backgroundColor: currentTheme.colors.primary + '20'
        };
      case 'success':
        return {
          icon: CheckCircle,
          color: currentTheme.colors.success,
          backgroundColor: currentTheme.colors.success + '20'
        };
    }
  };

  // Settings modal
  const showSettingsModal = () => {
    setSettingsVisible(true);
  };

  // Don't render if alerts are disabled or if there are no alerts to show
  if (!alertSettings.enabled || (alerts.length === 0 && !settingsVisible)) {
    return null;
  }

  return (
    <>
      <Animated.View
      style={[
        styles.container,
        {
          transform: [{
            translateY: slideAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [-200, 0]
            })
          }]
        }
      ]}
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Bell size={20} color={currentTheme.colors.text} />
          <Text style={styles.headerTitle}>{t('performance.alerts.title')}</Text>
          <View style={styles.alertCount}>
            <Text style={styles.alertCountText}>{alerts.length}</Text>
          </View>
        </View>
        <View style={styles.headerRight}>
          {showSettings && (
            <TouchableOpacity
              style={styles.headerButton}
              onPress={showSettingsModal}
            >
              <Settings size={16} color={currentTheme.colors.textSecondary} />
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={styles.headerButton}
            onPress={dismissAllAlerts}
          >
            <X size={16} color={currentTheme.colors.textSecondary} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Alerts List */}
      <View style={styles.alertsList}>
        {alerts.map((alert) => {
          const alertStyle = getAlertStyle(alert.type);
          const AlertIcon = alertStyle.icon;

          return (
            <View
              key={alert.id}
              style={[
                styles.alertItem,
                { backgroundColor: alertStyle.backgroundColor }
              ]}
            >
              <View style={styles.alertContent}>
                <View style={styles.alertHeader}>
                  <View style={styles.alertIcon}>
                    <AlertIcon size={16} color={alertStyle.color} />
                  </View>
                  <View style={styles.alertText}>
                    <Text style={[styles.alertTitle, { color: alertStyle.color }]}>
                      {alert.title}
                    </Text>
                    <Text style={styles.alertMessage}>
                      {alert.message}
                    </Text>
                    <Text style={styles.alertTime}>
                      {new Date(alert.timestamp).toLocaleTimeString()}
                    </Text>
                  </View>
                </View>

                <View style={styles.alertActions}>
                  {alert.action && alert.actionLabel && (
                    <TouchableOpacity
                      style={[styles.actionButton, { backgroundColor: alertStyle.color }]}
                      onPress={() => handleAlertAction(alert)}
                    >
                      <Text style={styles.actionButtonText}>
                        {alert.actionLabel}
                      </Text>
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity
                    style={styles.dismissButton}
                    onPress={() => dismissAlert(alert.id)}
                  >
                    <X size={14} color={currentTheme.colors.textSecondary} />
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          );
        })}
      </View>
      </Animated.View>

      {/* Settings Modal */}
      <PerformanceAlertsSettings
        visible={settingsVisible}
        onClose={() => setSettingsVisible(false)}
      />
    </>
  );
}

const createStyles = (colors: any) => StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    zIndex: 1000,
    elevation: 5,
    shadowColor: colors.text,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: colors.background,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginLeft: 8,
  },
  alertCount: {
    backgroundColor: colors.primary,
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginLeft: 8,
  },
  alertCountText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.background,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerButton: {
    padding: 4,
    marginLeft: 8,
  },
  alertsList: {
    maxHeight: 300,
  },
  alertItem: {
    marginHorizontal: 16,
    marginBottom: 8,
    borderRadius: 8,
    overflow: 'hidden',
  },
  alertContent: {
    padding: 12,
  },
  alertHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  alertIcon: {
    marginRight: 12,
    marginTop: 2,
  },
  alertText: {
    flex: 1,
  },
  alertTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  alertMessage: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 4,
    lineHeight: 16,
  },
  alertTime: {
    fontSize: 10,
    color: colors.textSecondary,
  },
  alertActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginTop: 8,
  },
  actionButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
    marginRight: 8,
  },
  actionButtonText: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.background,
  },
  dismissButton: {
    padding: 4,
  },
  upgradeContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.surface,
    zIndex: 1000,
    elevation: 5,
    shadowColor: colors.text,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  upgradeTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
    marginTop: 16,
    textAlign: 'center',
  },
  upgradeMessage: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 8,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  upgradeButton: {
    backgroundColor: colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    marginTop: 20,
  },
  upgradeButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.background,
  },
}); 