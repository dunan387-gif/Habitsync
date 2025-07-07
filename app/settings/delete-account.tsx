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
import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';

export default function DeleteAccountScreen() {
  const { currentTheme } = useTheme();
  const { user, logout } = useAuth();
  const router = useRouter();
  const [confirmationText, setConfirmationText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState<'warning' | 'confirmation'>('warning');

  const styles = createStyles(currentTheme.colors);

  const handleDeleteAccount = async () => {
    if (confirmationText !== 'DELETE') {
      Alert.alert('Error', 'Please type "DELETE" to confirm account deletion');
      return;
    }

    Alert.alert(
      'Final Confirmation',
      'Are you absolutely sure you want to delete your account? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete Account',
          style: 'destructive',
          onPress: async () => {
            setIsLoading(true);
            try {
              // TODO: Implement account deletion API call
              await new Promise(resolve => setTimeout(resolve, 2000));
              
              Alert.alert(
                'Account Deleted',
                'Your account has been successfully deleted.',
                [
                  {
                    text: 'OK',
                    onPress: () => {
                      logout();
                      router.replace('/(auth)/login');
                    },
                  },
                ]
              );
            } catch (error) {
              Alert.alert('Error', 'Failed to delete account. Please try again.');
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
        <Text style={styles.warningTitle}>Delete Account</Text>
        <Text style={styles.warningSubtitle}>
          This action will permanently delete your account and all associated data.
        </Text>
      </View>

      <View style={styles.consequencesSection}>
        <Text style={styles.sectionTitle}>What will be deleted:</Text>
        <View style={styles.consequencesList}>
          <Text style={styles.consequenceItem}>• All your habits and tracking data</Text>
          <Text style={styles.consequenceItem}>• Your profile information and settings</Text>
          <Text style={styles.consequenceItem}>• All streak records and achievements</Text>
          <Text style={styles.consequenceItem}>• Any premium subscription benefits</Text>
          <Text style={styles.consequenceItem}>• All app data and preferences</Text>
        </View>
      </View>

      <View style={styles.alternativesSection}>
        <Text style={styles.sectionTitle}>Consider these alternatives:</Text>
        <View style={styles.alternativesList}>
          <TouchableOpacity style={styles.alternativeItem}>
            <Text style={styles.alternativeTitle}>Export Your Data</Text>
            <Text style={styles.alternativeDescription}>
              Download a copy of your data before deleting
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.alternativeItem}>
            <Text style={styles.alternativeTitle}>Temporarily Disable</Text>
            <Text style={styles.alternativeDescription}>
              Take a break without losing your data
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <TouchableOpacity
        style={styles.continueButton}
        onPress={() => setStep('confirmation')}
      >
        <Text style={styles.continueButtonText}>Continue with Deletion</Text>
      </TouchableOpacity>
    </ScrollView>
  );

  const renderConfirmationStep = () => (
    <View style={styles.content}>
      <View style={styles.confirmationSection}>
        <Trash2 size={48} color={currentTheme.colors.error} />
        <Text style={styles.confirmationTitle}>Final Step</Text>
        <Text style={styles.confirmationSubtitle}>
          To confirm account deletion, please type "DELETE" in the field below:
        </Text>
      </View>

      <View style={styles.inputSection}>
        <Text style={styles.inputLabel}>Type "DELETE" to confirm:</Text>
        <TextInput
          style={styles.confirmationInput}
          value={confirmationText}
          onChangeText={setConfirmationText}
          placeholder="DELETE"
          placeholderTextColor={currentTheme.colors.textMuted}
          autoCapitalize="characters"
        />
      </View>

      <View style={styles.buttonSection}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => setStep('warning')}
        >
          <Text style={styles.backButtonText}>Go Back</Text>
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
            {isLoading ? 'Deleting...' : 'Delete Account'}
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
        <Text style={styles.title}>Delete Account</Text>
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