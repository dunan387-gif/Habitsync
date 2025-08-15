import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { AlertTriangle, Wifi, Shield, RefreshCw, AlertCircle } from 'lucide-react-native';
import { useTheme } from '@/context/ThemeContext';
import { useLanguage } from '@/context/LanguageContext';
import { useError, useAsyncError } from '@/context/ErrorContext';
import { ErrorType } from '@/utils/errorHandler';

export default function ErrorHandlingExample() {
  const { currentTheme } = useTheme();
  const { t } = useLanguage();
  const { showError } = useError();
  const { handleAsync, handleAsyncWithRetry } = useAsyncError();
  const [isLoading, setIsLoading] = useState(false);

  const styles = createStyles(currentTheme.colors);

  const simulateNetworkError = async () => {
    setIsLoading(true);
    try {
      // Simulate a network request that fails
      await new Promise((_, reject) => {
        setTimeout(() => {
          reject(new Error(t('error.messages.networkConnectionFailed')));
        }, 1000);
      });
    } catch (error) {
      showError(error as Error, {
        retryable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const simulateValidationError = () => {
    showError(t('error.messages.validationError'));
  };

  const simulateServerError = async () => {
    setIsLoading(true);
    try {
      // Simulate a server error
      await new Promise((_, reject) => {
        setTimeout(() => {
          const error = new Error(t('error.messages.internalServerError'));
          (error as any).status = 500;
          reject(error);
        }, 1000);
      });
    } catch (error) {
      showError(error as Error, {
        retryable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const simulateAuthenticationError = () => {
    showError(t('error.messages.authenticationError'));
  };

  const simulateAsyncErrorWithRetry = async () => {
    setIsLoading(true);
    
    const result = await handleAsyncWithRetry(
      async () => {
        // Simulate an operation that might fail
        const random = Math.random();
        if (random < 0.7) {
          throw new Error('Operation failed, retrying...');
        }
        return 'Success after retry!';
      },
      3, // maxRetries
      1000, // delay
      {}
    );

    if (result) {
      // Operation succeeded
    }
    
    setIsLoading(false);
  };

  const simulateClientError = () => {
    showError(t('error.messages.somethingWentWrongInApp'));
  };

  const triggerErrorBoundary = () => {
    // This will trigger the error boundary
    throw new Error('This is a test error to demonstrate the error boundary');
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <AlertCircle size={24} color={currentTheme.colors.primary} />
        <Text style={styles.title}>{t('error.examples.title')}</Text>
        <Text style={styles.subtitle}>
          {t('error.examples.subtitle')}
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('error.examples.networkErrors')}</Text>
        <TouchableOpacity 
          style={[styles.button, styles.networkButton]} 
          onPress={simulateNetworkError}
          disabled={isLoading}
        >
          <Wifi size={20} color={currentTheme.colors.background} />
          <Text style={styles.buttonText}>{t('error.examples.simulateNetworkError')}</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('error.examples.validationErrors')}</Text>
        <TouchableOpacity 
          style={[styles.button, styles.validationButton]} 
          onPress={simulateValidationError}
        >
          <AlertTriangle size={20} color={currentTheme.colors.background} />
          <Text style={styles.buttonText}>{t('error.examples.simulateValidationError')}</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('error.examples.serverErrors')}</Text>
        <TouchableOpacity 
          style={[styles.button, styles.serverButton]} 
          onPress={simulateServerError}
          disabled={isLoading}
        >
          <Shield size={20} color={currentTheme.colors.background} />
          <Text style={styles.buttonText}>{t('error.examples.simulateServerError')}</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('error.examples.authenticationErrors')}</Text>
        <TouchableOpacity 
          style={[styles.button, styles.authButton]} 
          onPress={simulateAuthenticationError}
        >
          <Shield size={20} color={currentTheme.colors.background} />
          <Text style={styles.buttonText}>{t('error.examples.simulateAuthError')}</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('error.examples.clientErrors')}</Text>
        <TouchableOpacity 
          style={[styles.button, styles.clientButton]} 
          onPress={simulateClientError}
        >
                      <AlertCircle size={20} color={currentTheme.colors.background} />
          <Text style={styles.buttonText}>{t('error.examples.simulateClientError')}</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('error.examples.asyncOperationsWithRetry')}</Text>
        <TouchableOpacity 
          style={[styles.button, styles.retryButton]} 
          onPress={simulateAsyncErrorWithRetry}
          disabled={isLoading}
        >
          <RefreshCw size={20} color={currentTheme.colors.background} />
          <Text style={styles.buttonText}>{t('error.examples.testAsyncRetry')}</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('error.examples.errorBoundaryTest')}</Text>
        <TouchableOpacity 
          style={[styles.button, styles.boundaryButton]} 
          onPress={triggerErrorBoundary}
        >
          <AlertTriangle size={20} color={currentTheme.colors.background} />
          <Text style={styles.buttonText}>{t('error.examples.triggerErrorBoundary')}</Text>
        </TouchableOpacity>
        <Text style={styles.note}>
          {t('error.examples.errorBoundaryNote')}
        </Text>
      </View>

      <View style={styles.infoSection}>
        <Text style={styles.infoTitle}>{t('error.examples.featuresTitle')}</Text>
        <Text style={styles.infoText}>{t('error.examples.globalErrorBoundary')}</Text>
        <Text style={styles.infoText}>{t('error.examples.userFriendlyToasts')}</Text>
        <Text style={styles.infoText}>{t('error.examples.automaticCategorization')}</Text>
        <Text style={styles.infoText}>{t('error.examples.asyncErrorHandling')}</Text>
        <Text style={styles.infoText}>{t('error.examples.errorHistoryTracking')}</Text>
        <Text style={styles.infoText}>{t('error.examples.consistentErrorMessages')}</Text>
      </View>
    </ScrollView>
  );
}

const createStyles = (colors: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
    paddingVertical: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
    marginTop: 12,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 12,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    gap: 12,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.background,
  },
  networkButton: {
    backgroundColor: colors.warning,
  },
  validationButton: {
    backgroundColor: colors.warning,
  },
  serverButton: {
    backgroundColor: colors.error,
  },
  authButton: {
    backgroundColor: colors.error,
  },
  clientButton: {
    backgroundColor: colors.warning,
  },
  retryButton: {
    backgroundColor: colors.primary,
  },
  boundaryButton: {
    backgroundColor: colors.error,
  },
  note: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 8,
    fontStyle: 'italic',
  },
  infoSection: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 20,
    marginTop: 20,
    marginBottom: 100,
    borderWidth: 1,
    borderColor: colors.border,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 12,
  },
  infoText: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 6,
    lineHeight: 20,
  },
}); 