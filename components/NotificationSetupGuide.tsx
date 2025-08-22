import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  Linking,
  Platform,
} from 'react-native';
import { useTheme } from '@/context/ThemeContext';
import { useLanguage } from '@/context/LanguageContext';
import { pushNotificationService } from '@/services/PushNotificationService';
import { 
  Bell, 
  Battery, 
  Settings, 
  CheckCircle, 
  XCircle, 
  Info,
  Smartphone,
  Shield
} from 'lucide-react-native';

interface NotificationSetupGuideProps {
  visible: boolean;
  onClose: () => void;
  onComplete: () => void;
}

interface SetupStep {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  action: () => Promise<void>;
  isCompleted: boolean;
  isRequired: boolean;
}

export default function NotificationSetupGuide({ 
  visible, 
  onClose, 
  onComplete 
}: NotificationSetupGuideProps) {
  const { colors } = useTheme();
  const { t } = useLanguage();
  const [steps, setSteps] = useState<SetupStep[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (visible) {
      initializeSteps();
    }
  }, [visible]);

  const initializeSteps = () => {
    const setupSteps: SetupStep[] = [
      {
        id: 'permissions',
        title: t('notificationSetup.permissions.title') || 'Notification Permissions',
        description: t('notificationSetup.permissions.description') || 'Allow HabitSyncer to send you important reminders and notifications',
        icon: <Bell size={24} color={colors.primary} />,
        action: requestNotificationPermissions,
        isCompleted: false,
        isRequired: true
      },
      {
        id: 'battery_optimization',
        title: t('notificationSetup.battery.title') || 'Battery Optimization',
        description: t('notificationSetup.battery.description') || 'Disable battery optimization to ensure notifications work when the app is in the background',
        icon: <Battery size={24} color={colors.primary} />,
        action: requestBatteryOptimizationExemption,
        isCompleted: false,
        isRequired: Platform.OS === 'android'
      },
      {
        id: 'background_app_refresh',
        title: t('notificationSetup.background.title') || 'Background App Refresh',
        description: t('notificationSetup.background.description') || 'Enable background app refresh to receive notifications when the app is not active',
        icon: <Smartphone size={24} color={colors.primary} />,
        action: requestBackgroundAppRefresh,
        isCompleted: false,
        isRequired: Platform.OS === 'ios'
      },
      {
        id: 'do_not_disturb',
        title: t('notificationSetup.dnd.title') || 'Do Not Disturb Settings',
        description: t('notificationSetup.dnd.description') || 'Configure Do Not Disturb to allow important habit reminders',
        icon: <Shield size={24} color={colors.primary} />,
        action: configureDoNotDisturb,
        isCompleted: false,
        isRequired: false
      }
    ];

    setSteps(setupSteps);
  };

  const requestNotificationPermissions = async (): Promise<void> => {
    try {
      setIsLoading(true);
      
      // Request permissions through the push notification service
      await pushNotificationService.initialize();
      
      // Update step status
      setSteps(prev => prev.map(step => 
        step.id === 'permissions' 
          ? { ...step, isCompleted: true }
          : step
      ));
      
      Alert.alert(
        t('notificationSetup.success.title') || 'Success!',
        t('notificationSetup.success.permissions') || 'Notification permissions granted successfully!'
      );
    } catch (error) {
      console.error('Error requesting notification permissions:', error);
      Alert.alert(
        t('notificationSetup.error.title') || 'Error',
        t('notificationSetup.error.permissions') || 'Failed to request notification permissions. Please try again.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const requestBatteryOptimizationExemption = async (): Promise<void> => {
    try {
      setIsLoading(true);
      
      if (Platform.OS === 'android') {
        Alert.alert(
          t('notificationSetup.battery.alert.title') || 'Battery Optimization',
          t('notificationSetup.battery.alert.message') || 'To ensure you receive important habit reminders, please disable battery optimization for HabitSyncer in your device settings.',
          [
            { text: t('common.later') || 'Later', style: 'cancel' },
            { 
              text: t('notificationSetup.battery.alert.openSettings') || 'Open Settings', 
              onPress: () => {
                // Open battery optimization settings
                if (Platform.OS === 'android') {
                  Linking.openSettings();
                }
              }
            }
          ]
        );
      }
      
      // Update step status
      setSteps(prev => prev.map(step => 
        step.id === 'battery_optimization' 
          ? { ...step, isCompleted: true }
          : step
      ));
    } catch (error) {
      console.error('Error requesting battery optimization exemption:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const requestBackgroundAppRefresh = async (): Promise<void> => {
    try {
      setIsLoading(true);
      
      if (Platform.OS === 'ios') {
        Alert.alert(
          t('notificationSetup.background.alert.title') || 'Background App Refresh',
          t('notificationSetup.background.alert.message') || 'Please enable Background App Refresh for HabitSyncer in your device settings to receive notifications when the app is not active.',
          [
            { text: t('common.later') || 'Later', style: 'cancel' },
            { 
              text: t('notificationSetup.background.alert.openSettings') || 'Open Settings', 
              onPress: () => {
                Linking.openSettings();
              }
            }
          ]
        );
      }
      
      // Update step status
      setSteps(prev => prev.map(step => 
        step.id === 'background_app_refresh' 
          ? { ...step, isCompleted: true }
          : step
      ));
    } catch (error) {
      console.error('Error requesting background app refresh:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const configureDoNotDisturb = async (): Promise<void> => {
    try {
      setIsLoading(true);
      
      Alert.alert(
        t('notificationSetup.dnd.alert.title') || 'Do Not Disturb Settings',
        t('notificationSetup.dnd.alert.message') || 'To ensure you receive important habit reminders, please configure Do Not Disturb to allow notifications from HabitSyncer.',
        [
          { text: t('common.later') || 'Later', style: 'cancel' },
          { 
            text: t('notificationSetup.dnd.alert.openSettings') || 'Open Settings', 
            onPress: () => {
              Linking.openSettings();
            }
          }
        ]
      );
      
      // Update step status
      setSteps(prev => prev.map(step => 
        step.id === 'do_not_disturb' 
          ? { ...step, isCompleted: true }
          : step
      ));
    } catch (error) {
      console.error('Error configuring Do Not Disturb:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStepPress = async (step: SetupStep) => {
    if (isLoading) return;
    
    try {
      await step.action();
    } catch (error) {
      console.error(`Error executing step ${step.id}:`, error);
    }
  };

  const handleComplete = () => {
    const requiredSteps = steps.filter(step => step.isRequired);
    const completedRequiredSteps = requiredSteps.filter(step => step.isCompleted);
    
    if (completedRequiredSteps.length === requiredSteps.length) {
      onComplete();
    } else {
      Alert.alert(
        t('notificationSetup.incomplete.title') || 'Setup Incomplete',
        t('notificationSetup.incomplete.message') || 'Please complete all required steps to ensure notifications work properly.'
      );
    }
  };

  const getCompletionStatus = () => {
    const requiredSteps = steps.filter(step => step.isRequired);
    const completedRequiredSteps = requiredSteps.filter(step => step.isCompleted);
    return {
      completed: completedRequiredSteps.length,
      total: requiredSteps.length,
      percentage: requiredSteps.length > 0 ? (completedRequiredSteps.length / requiredSteps.length) * 100 : 100
    };
  };

  if (!visible) return null;

  const completionStatus = getCompletionStatus();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.card }]}>
        <View style={styles.headerContent}>
          <Text style={[styles.title, { color: colors.text }]}>
            {t('notificationSetup.title') || 'Notification Setup'}
          </Text>
          <Text style={[styles.subtitle, { color: colors.text + 'CC' }]}>
            {t('notificationSetup.subtitle') || 'Configure notifications to stay on track with your habits'}
          </Text>
        </View>
        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
          <XCircle size={24} color={colors.text} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Progress indicator */}
        <View style={[styles.progressContainer, { backgroundColor: colors.card }]}>
          <View style={styles.progressHeader}>
            <Text style={[styles.progressTitle, { color: colors.text }]}>
              {t('notificationSetup.progress.title') || 'Setup Progress'}
            </Text>
            <Text style={[styles.progressText, { color: colors.text + 'CC' }]}>
              {completionStatus.completed} of {completionStatus.total} required steps
            </Text>
          </View>
          <View style={[styles.progressBar, { backgroundColor: colors.border }]}>
            <View 
              style={[
                styles.progressFill, 
                { 
                  backgroundColor: colors.primary,
                  width: `${completionStatus.percentage}%`
                }
              ]} 
            />
          </View>
        </View>

        {/* Setup steps */}
        <View style={styles.stepsContainer}>
          {steps.map((step, index) => (
            <View 
              key={step.id} 
              style={[
                styles.stepContainer, 
                { 
                  backgroundColor: colors.card,
                  borderColor: step.isCompleted ? colors.primary : colors.border
                }
              ]}
            >
              <View style={styles.stepHeader}>
                <View style={styles.stepIcon}>
                  {step.icon}
                </View>
                <View style={styles.stepInfo}>
                  <Text style={[styles.stepTitle, { color: colors.text }]}>
                    {step.title}
                    {step.isRequired && (
                      <Text style={[styles.required, { color: colors.error }]}> *</Text>
                    )}
                  </Text>
                  <Text style={[styles.stepDescription, { color: colors.text + 'CC' }]}>
                    {step.description}
                  </Text>
                </View>
                <View style={styles.stepStatus}>
                  {step.isCompleted ? (
                    <CheckCircle size={24} color={colors.success} />
                  ) : (
                    <View style={[styles.pendingCircle, { borderColor: colors.border }]} />
                  )}
                </View>
              </View>
              
              {!step.isCompleted && (
                <TouchableOpacity
                  style={[
                    styles.stepButton,
                    { 
                      backgroundColor: colors.primary,
                      opacity: isLoading ? 0.6 : 1
                    }
                  ]}
                  onPress={() => handleStepPress(step)}
                  disabled={isLoading}
                >
                  <Text style={styles.stepButtonText}>
                    {t('notificationSetup.step.action') || 'Configure'}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          ))}
        </View>

        {/* Help text */}
        <View style={[styles.helpContainer, { backgroundColor: colors.card }]}>
          <Info size={20} color={colors.primary} />
          <Text style={[styles.helpText, { color: colors.text + 'CC' }]}>
            {t('notificationSetup.help.text') || 'These settings ensure you receive important habit reminders even when the app is in the background or closed.'}
          </Text>
        </View>
      </ScrollView>

      {/* Footer */}
      <View style={[styles.footer, { backgroundColor: colors.card }]}>
        <TouchableOpacity
          style={[
            styles.completeButton,
            { 
              backgroundColor: completionStatus.percentage === 100 ? colors.primary : colors.border,
              opacity: completionStatus.percentage === 100 ? 1 : 0.6
            }
          ]}
          onPress={handleComplete}
          disabled={completionStatus.percentage < 100}
        >
          <Text style={styles.completeButtonText}>
            {t('notificationSetup.complete') || 'Complete Setup'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  headerContent: {
    flex: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
  },
  closeButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    padding: 8,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  progressContainer: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
  },
  progressHeader: {
    marginBottom: 12,
  },
  progressTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  progressText: {
    fontSize: 14,
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  stepsContainer: {
    gap: 16,
  },
  stepContainer: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
  },
  stepHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  stepIcon: {
    marginRight: 12,
    marginTop: 2,
  },
  stepInfo: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  required: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  stepDescription: {
    fontSize: 14,
    lineHeight: 20,
  },
  stepStatus: {
    marginLeft: 12,
  },
  pendingCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
  },
  stepButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
  },
  stepButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  helpContainer: {
    flexDirection: 'row',
    padding: 16,
    borderRadius: 12,
    marginTop: 24,
    alignItems: 'flex-start',
  },
  helpText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
    marginLeft: 12,
  },
  footer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
  },
  completeButton: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  completeButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
});
