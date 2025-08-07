// Performance Alerts Settings Modal Component

import React from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, ScrollView, Switch } from 'react-native';
import { X, Bell, AlertTriangle, Info, Settings } from 'lucide-react-native';
import { usePerformanceAlerts } from '@/context/PerformanceAlertsContext';
import { useTheme } from '@/context/ThemeContext';
import { useLanguage } from '@/context/LanguageContext';

interface PerformanceAlertsSettingsProps {
  visible: boolean;
  onClose: () => void;
}

export default function PerformanceAlertsSettings({ visible, onClose }: PerformanceAlertsSettingsProps) {
  const { currentTheme } = useTheme();
  const { t } = useLanguage();
  const { settings, updateSettings } = usePerformanceAlerts();

  const styles = createStyles(currentTheme.colors);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Settings size={24} color={currentTheme.colors.primary} />
            <Text style={styles.headerTitle}>{t('performance.alerts.settings.title')}</Text>
          </View>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <X size={24} color={currentTheme.colors.textSecondary} />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content}>
          {/* General Settings */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t('performance.alerts.settings.generalSettings')}</Text>
            
            <View style={styles.settingItem}>
              <View style={styles.settingInfo}>
                <Bell size={20} color={currentTheme.colors.textSecondary} />
                <View style={styles.settingText}>
                  <Text style={styles.settingLabel}>{t('performance.alerts.settings.enableAlerts')}</Text>
                  <Text style={styles.settingDescription}>{t('performance.alerts.settings.enableAlertsDesc')}</Text>
                </View>
              </View>
              <Switch
                value={settings.enabled}
                onValueChange={(value) => updateSettings({ enabled: value })}
                trackColor={{ false: currentTheme.colors.border, true: currentTheme.colors.primary }}
                thumbColor={currentTheme.colors.background}
              />
            </View>

            <View style={styles.settingItem}>
              <View style={styles.settingInfo}>
                <Info size={20} color={currentTheme.colors.textSecondary} />
                <View style={styles.settingText}>
                  <Text style={styles.settingLabel}>{t('performance.alerts.settings.autoDismiss')}</Text>
                  <Text style={styles.settingDescription}>{t('performance.alerts.settings.autoDismissDesc')}</Text>
                </View>
              </View>
              <Switch
                value={settings.autoDismiss}
                onValueChange={(value) => updateSettings({ autoDismiss: value })}
                trackColor={{ false: currentTheme.colors.border, true: currentTheme.colors.primary }}
                thumbColor={currentTheme.colors.background}
              />
            </View>
          </View>

          {/* Alert Types */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t('performance.alerts.settings.alertTypes')}</Text>
            
            <View style={styles.settingItem}>
              <View style={styles.settingInfo}>
                <AlertTriangle size={20} color={currentTheme.colors.error} />
                <View style={styles.settingText}>
                  <Text style={styles.settingLabel}>{t('performance.alerts.settings.criticalAlerts')}</Text>
                  <Text style={styles.settingDescription}>{t('performance.alerts.settings.criticalAlertsDesc')}</Text>
                </View>
              </View>
              <Switch
                value={settings.showCriticalAlerts}
                onValueChange={(value) => updateSettings({ showCriticalAlerts: value })}
                trackColor={{ false: currentTheme.colors.border, true: currentTheme.colors.error }}
                thumbColor={currentTheme.colors.background}
              />
            </View>

            <View style={styles.settingItem}>
              <View style={styles.settingInfo}>
                <AlertTriangle size={20} color={currentTheme.colors.warning} />
                <View style={styles.settingText}>
                  <Text style={styles.settingLabel}>{t('performance.alerts.settings.warningAlerts')}</Text>
                  <Text style={styles.settingDescription}>{t('performance.alerts.settings.warningAlertsDesc')}</Text>
                </View>
              </View>
              <Switch
                value={settings.showWarningAlerts}
                onValueChange={(value) => updateSettings({ showWarningAlerts: value })}
                trackColor={{ false: currentTheme.colors.border, true: currentTheme.colors.warning }}
                thumbColor={currentTheme.colors.background}
              />
            </View>

            <View style={styles.settingItem}>
              <View style={styles.settingInfo}>
                <Info size={20} color={currentTheme.colors.primary} />
                <View style={styles.settingText}>
                  <Text style={styles.settingLabel}>{t('performance.alerts.settings.infoAlerts')}</Text>
                  <Text style={styles.settingDescription}>{t('performance.alerts.settings.infoAlertsDesc')}</Text>
                </View>
              </View>
              <Switch
                value={settings.showInfoAlerts}
                onValueChange={(value) => updateSettings({ showInfoAlerts: value })}
                trackColor={{ false: currentTheme.colors.border, true: currentTheme.colors.primary }}
                thumbColor={currentTheme.colors.background}
              />
            </View>
          </View>

          {/* Behavior Settings */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t('performance.alerts.settings.behavior')}</Text>
            
            <View style={styles.settingItem}>
              <View style={styles.settingInfo}>
                <Bell size={20} color={currentTheme.colors.textSecondary} />
                <View style={styles.settingText}>
                  <Text style={styles.settingLabel}>{t('performance.alerts.settings.soundNotifications')}</Text>
                  <Text style={styles.settingDescription}>{t('performance.alerts.settings.soundNotificationsDesc')}</Text>
                </View>
              </View>
              <Switch
                value={settings.soundEnabled}
                onValueChange={(value) => updateSettings({ soundEnabled: value })}
                trackColor={{ false: currentTheme.colors.border, true: currentTheme.colors.primary }}
                thumbColor={currentTheme.colors.background}
              />
            </View>

            <View style={styles.settingItem}>
              <View style={styles.settingInfo}>
                <Bell size={20} color={currentTheme.colors.textSecondary} />
                <View style={styles.settingText}>
                  <Text style={styles.settingLabel}>{t('performance.alerts.settings.vibration')}</Text>
                  <Text style={styles.settingDescription}>{t('performance.alerts.settings.vibrationDesc')}</Text>
                </View>
              </View>
              <Switch
                value={settings.vibrationEnabled}
                onValueChange={(value) => updateSettings({ vibrationEnabled: value })}
                trackColor={{ false: currentTheme.colors.border, true: currentTheme.colors.primary }}
                thumbColor={currentTheme.colors.background}
              />
            </View>
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
}

const createStyles = (colors: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
    marginLeft: 12,
  },
  closeButton: {
    padding: 4,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 16,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  settingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingText: {
    marginLeft: 12,
    flex: 1,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.text,
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 18,
  },
}); 