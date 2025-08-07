import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Dimensions } from 'react-native';
import { AlertTriangle, X, RefreshCw } from 'lucide-react-native';
import { useTheme } from '@/context/ThemeContext';
import { useLanguage } from '@/context/LanguageContext';
import { AppError, ErrorType } from '@/utils/errorHandler';

interface ErrorToastProps {
  error: AppError | null;
  onRetry?: () => void;
  onDismiss?: () => void;
  autoHide?: boolean;
  autoHideDelay?: number;
  position?: 'top' | 'bottom';
}

const { width } = Dimensions.get('window');

export default function ErrorToast({
  error,
  onRetry,
  onDismiss,
  autoHide = true,
  autoHideDelay = 5000,
  position = 'top',
}: ErrorToastProps) {
  const { currentTheme } = useTheme();
  const { t } = useLanguage();
  const [isVisible, setIsVisible] = useState(false);
  const slideAnim = useRef(new Animated.Value(-100)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const autoHideTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (error) {
      showToast();
    } else {
      hideToast();
    }
  }, [error]);

  const showToast = () => {
    setIsVisible(true);
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();

    if (autoHide) {
      autoHideTimeout.current = setTimeout(() => {
        hideToast();
      }, autoHideDelay);
    }
  };

  const hideToast = () => {
    if (autoHideTimeout.current) {
      clearTimeout(autoHideTimeout.current);
      autoHideTimeout.current = null;
    }

    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: -100,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setIsVisible(false);
      onDismiss?.();
    });
  };

  const handleRetry = () => {
    hideToast();
    onRetry?.();
  };

  const handleDismiss = () => {
    hideToast();
  };

  if (!error || !isVisible) {
    return null;
  }

  const styles = createStyles(currentTheme.colors);
  const isRetryable = [ErrorType.NETWORK, ErrorType.SERVER].includes(error.type);

  return (
    <Animated.View
      style={[
        styles.container,
        position === 'top' ? styles.topContainer : styles.bottomContainer,
        {
          transform: [{ translateY: slideAnim }],
          opacity: opacityAnim,
        },
      ]}
    >
      <View style={[styles.toast, { borderLeftColor: getErrorColor(error.type, currentTheme.colors) }]}>
        <View style={styles.content}>
          <View style={styles.iconContainer}>
            <AlertTriangle size={20} color={getErrorColor(error.type, currentTheme.colors)} />
          </View>
          
          <View style={styles.textContainer}>
            <Text style={styles.title}>
              {getErrorTitle(error.type, t)}
            </Text>
            <Text style={styles.message} numberOfLines={2}>
              {error.userMessage}
            </Text>
          </View>

          <View style={styles.actions}>
            {isRetryable && onRetry && (
              <TouchableOpacity style={styles.retryButton} onPress={handleRetry}>
                <RefreshCw size={16} color={currentTheme.colors.primary} />
              </TouchableOpacity>
            )}
            
            <TouchableOpacity style={styles.dismissButton} onPress={handleDismiss}>
              <X size={16} color={currentTheme.colors.textSecondary} />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Animated.View>
  );
}

function getErrorColor(type: ErrorType, colors: any): string {
  switch (type) {
    case ErrorType.NETWORK:
      return colors.warning;
    case ErrorType.VALIDATION:
      return colors.warning;
    case ErrorType.AUTHENTICATION:
      return colors.error;
    case ErrorType.AUTHORIZATION:
      return colors.error;
    case ErrorType.NOT_FOUND:
      return colors.warning;
    case ErrorType.SERVER:
      return colors.error;
    case ErrorType.CLIENT:
      return colors.warning;
    default:
      return colors.error;
  }
}

function getErrorTitle(type: ErrorType, t: (key: string) => string): string {
  switch (type) {
    case ErrorType.NETWORK:
      return t('error.toast.network');
    case ErrorType.VALIDATION:
      return t('error.toast.validation');
    case ErrorType.AUTHENTICATION:
      return t('error.toast.authentication');
    case ErrorType.AUTHORIZATION:
      return t('error.toast.authorization');
    case ErrorType.NOT_FOUND:
      return t('error.toast.notFound');
    case ErrorType.SERVER:
      return t('error.toast.server');
    case ErrorType.CLIENT:
      return t('error.toast.client');
    default:
      return t('error.toast.unknown');
  }
}

const createStyles = (colors: any) => StyleSheet.create({
  container: {
    position: 'absolute',
    left: 16,
    right: 16,
    zIndex: 1000,
  },
  topContainer: {
    top: 50,
  },
  bottomContainer: {
    bottom: 100,
  },
  toast: {
    backgroundColor: colors.card,
    borderRadius: 12,
    borderLeftWidth: 4,
    shadowColor: colors.text,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  iconContainer: {
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
    marginRight: 12,
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 2,
  },
  message: {
    fontSize: 12,
    color: colors.textSecondary,
    lineHeight: 16,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  retryButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: colors.surface,
  },
  dismissButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: colors.surface,
  },
}); 