import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Alert,
  TextInput,
  ScrollView,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { ArrowLeft, AlertTriangle, Trash2 } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import { AuthService } from '@/services/AuthService';

export default function DeleteAccountScreen() {
  const { currentTheme } = useTheme();
  const { user, logout } = useAuth();
  const { t } = useLanguage();
  const router = useRouter();
  const [confirmationText, setConfirmationText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState<'warning' | 'confirmation'>('warning');

  const styles = createStyles(currentTheme.colors);

  const handleDeleteAccount = async () => {
    if (confirmationText !== 'DELETE') {
      Alert.alert(t('deleteAccount.alerts.confirmationError.title'), t('deleteAccount.alerts.confirmationError.message'));
      return;
    }

    Alert.alert(
      t('deleteAccount.alerts.finalConfirmation.title'),
      t('deleteAccount.alerts.finalConfirmation.message'),
      [
        { text: t('deleteAccount.alerts.finalConfirmation.cancel'), style: 'cancel' },
        {
          text: t('deleteAccount.alerts.finalConfirmation.confirm'),
          style: 'destructive',
          onPress: async () => {
            setIsLoading(true);
            try {
              // Implement account deletion using AuthService
              await AuthService.deleteAccount();
              
              Alert.alert(
                t('deleteAccount.alerts.success.title'),
                t('deleteAccount.alerts.success.message'),
                [
                  {
                    text: t('deleteAccount.alerts.success.ok'),
                    onPress: () => {
                      logout();
                      router.replace('/(auth)/login' as any);
                    },
                  },
                ]
              );
            } catch (error: any) {
              console.error('Error deleting account:', error);
              Alert.alert(t('deleteAccount.alerts.error.title'), error.message || t('deleteAccount.alerts.error.message'));
            } finally {
              setIsLoading(false);
            }
          },
        },
      ]
    );
  };

  const renderWarningStep = () => (
    <ScrollView style={styles.content}>
      <View style={styles.warningSection}>
        <AlertTriangle size={48} color={currentTheme.colors.error} />
        <Text style={styles.warningTitle}>{t('deleteAccount.warning.title')}</Text>
        <Text style={styles.warningSubtitle}>
          {t('deleteAccount.warning.subtitle')}
        </Text>
      </View>

      <View style={styles.consequencesSection}>
        <Text style={styles.sectionTitle}>{t('deleteAccount.warning.whatWillBeDeleted')}</Text>
        <View style={styles.consequencesList}>
          <Text style={styles.consequenceItem}>{t('deleteAccount.warning.consequences.habits')}</Text>
          <Text style={styles.consequenceItem}>{t('deleteAccount.warning.consequences.profile')}</Text>
          <Text style={styles.consequenceItem}>{t('deleteAccount.warning.consequences.streaks')}</Text>
          <Text style={styles.consequenceItem}>{t('deleteAccount.warning.consequences.premium')}</Text>
          <Text style={styles.consequenceItem}>{t('deleteAccount.warning.consequences.appData')}</Text>
        </View>
      </View>

      <View style={styles.alternativesSection}>
        <Text style={styles.sectionTitle}>{t('deleteAccount.warning.alternatives.title')}</Text>
        <View style={styles.alternativesList}>
          <TouchableOpacity style={styles.alternativeItem}>
            <Text style={styles.alternativeTitle}>{t('deleteAccount.warning.alternatives.exportData.title')}</Text>
            <Text style={styles.alternativeDescription}>
              {t('deleteAccount.warning.alternatives.exportData.description')}
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.alternativeItem}>
            <Text style={styles.alternativeTitle}>{t('deleteAccount.warning.alternatives.temporaryDisable.title')}</Text>
            <Text style={styles.alternativeDescription}>
              {t('deleteAccount.warning.alternatives.temporaryDisable.description')}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <TouchableOpacity
        style={styles.continueButton}
        onPress={() => setStep('confirmation')}
      >
        <Text style={styles.continueButtonText}>{t('deleteAccount.warning.continueButton')}</Text>
      </TouchableOpacity>
    </ScrollView>
  );

  const renderConfirmationStep = () => (
    <View style={styles.content}>
      <View style={styles.confirmationSection}>
        <Trash2 size={48} color={currentTheme.colors.error} />
        <Text style={styles.confirmationTitle}>{t('deleteAccount.confirmation.title')}</Text>
        <Text style={styles.confirmationSubtitle}>
          {t('deleteAccount.confirmation.subtitle')}
        </Text>
      </View>

      <View style={styles.inputSection}>
        <Text style={styles.inputLabel}>{t('deleteAccount.confirmation.inputLabel')}</Text>
        <TextInput
          style={styles.confirmationInput}
          value={confirmationText}
          onChangeText={setConfirmationText}
          placeholder={t('deleteAccount.confirmation.placeholder')}
          placeholderTextColor={currentTheme.colors.textMuted}
          autoCapitalize="characters"
        />
      </View>

      <View style={styles.buttonSection}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => setStep('warning')}
        >
          <Text style={styles.backButtonText}>{t('deleteAccount.confirmation.backButton')}</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[
            styles.deleteButton,
            confirmationText !== 'DELETE' && styles.disabledButton,
            isLoading && styles.disabledButton,
          ]}
          onPress={handleDeleteAccount}
          disabled={confirmationText !== 'DELETE' || isLoading}
        >
          <Text style={styles.deleteButtonText}>
            {isLoading ? t('deleteAccount.confirmation.deleting') : t('deleteAccount.confirmation.deleteButton')}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: currentTheme.colors.background }]}>
      <StatusBar style={currentTheme.isDark ? 'light' : 'dark'} />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerBackButton}>
          <ArrowLeft size={24} color={currentTheme.colors.text} />
        </TouchableOpacity>
        <Text style={styles.title}>{t('deleteAccount.title')}</Text>
      </View>

      {step === 'warning' ? renderWarningStep() : renderConfirmationStep()}
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
  headerBackButton: {
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
  warningSection: {
    alignItems: 'center',
    marginBottom: 32,
  },
  warningTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.error,
    marginTop: 16,
    marginBottom: 8,
  },
  warningSubtitle: {
    fontSize: 16,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 22,
  },
  consequencesSection: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 16,
  },
  consequencesList: {
    backgroundColor: colors.card,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  consequenceItem: {
    fontSize: 14,
    color: colors.textMuted,
    lineHeight: 20,
    marginBottom: 8,
  },
  alternativesSection: {
    marginBottom: 32,
  },
  alternativesList: {
    gap: 12,
  },
  alternativeItem: {
    backgroundColor: colors.card,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  alternativeTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.text,
    marginBottom: 4,
  },
  alternativeDescription: {
    fontSize: 14,
    color: colors.textMuted,
    lineHeight: 18,
  },
  continueButton: {
    backgroundColor: colors.error,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  continueButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.background,
  },
  confirmationSection: {
    alignItems: 'center',
    marginBottom: 32,
  },
  confirmationTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
    marginTop: 16,
    marginBottom: 8,
  },
  confirmationSubtitle: {
    fontSize: 16,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 22,
  },
  inputSection: {
    marginBottom: 32,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.text,
    marginBottom: 8,
  },
  confirmationInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: colors.text,
    backgroundColor: colors.card,
  },
  buttonSection: {
    flexDirection: 'row',
    gap: 12,
  },
  backButton: {
    flex: 1,
    backgroundColor: colors.card,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  deleteButton: {
    flex: 1,
    backgroundColor: colors.error,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  deleteButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.background,
  },
  disabledButton: {
    opacity: 0.6,
  },
});