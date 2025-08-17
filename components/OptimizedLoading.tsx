import React, { useEffect, useRef } from 'react';
import { View, ActivityIndicator, Text, StyleSheet, Animated, Dimensions } from 'react-native';
import { useTheme } from '@/context/ThemeContext';
import { useLanguage } from '@/context/LanguageContext';

const { width } = Dimensions.get('window');

interface OptimizedLoadingProps {
  message?: string;
  size?: 'small' | 'large';
  type?: 'spinner' | 'dots' | 'pulse';
  showMessage?: boolean;
  containerStyle?: any;
}

export default function OptimizedLoading({
  message,
  size = 'large',
  type = 'spinner',
  showMessage = true,
  containerStyle
}: OptimizedLoadingProps) {
  const { currentTheme } = useTheme();
  const { t } = useLanguage();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Fade in animation
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
    ]).start();

    // Pulse animation for pulse type
    if (type === 'pulse') {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.2,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
        ])
      ).start();
    }
  }, [fadeAnim, scaleAnim, pulseAnim, type]);

  const renderSpinner = () => (
    <ActivityIndicator 
      size={size} 
      color={currentTheme.colors.primary}
      style={styles.spinner}
    />
  );

  const renderDots = () => (
    <View style={styles.dotsContainer}>
      {[0, 1, 2].map((index) => (
        <Animated.View
          key={index}
          style={[
            styles.dot,
            {
              backgroundColor: currentTheme.colors.primary,
              transform: [
                {
                  scale: pulseAnim.interpolate({
                    inputRange: [1, 1.2],
                    outputRange: [1, 1.2],
                  }),
                },
              ],
            },
          ]}
        />
      ))}
    </View>
  );

  const renderPulse = () => (
    <Animated.View
      style={[
        styles.pulse,
        {
          backgroundColor: currentTheme.colors.primary,
          transform: [{ scale: pulseAnim }],
        },
      ]}
    />
  );

  const renderLoader = () => {
    switch (type) {
      case 'dots':
        return renderDots();
      case 'pulse':
        return renderPulse();
      default:
        return renderSpinner();
    }
  };

  return (
    <Animated.View
      style={[
        styles.container,
        {
          backgroundColor: currentTheme.colors.background,
          opacity: fadeAnim,
          transform: [{ scale: scaleAnim }],
        },
        containerStyle,
      ]}
    >
      {renderLoader()}
      {showMessage && (
        <Animated.Text
          style={[
            styles.message,
            {
              color: currentTheme.colors.textMuted,
              opacity: fadeAnim,
            },
          ]}
        >
          {message || t('common.loading')}
        </Animated.Text>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  spinner: {
    marginBottom: 16,
  },
  dotsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginHorizontal: 4,
  },
  pulse: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginBottom: 16,
  },
  message: {
    fontSize: 16,
    textAlign: 'center',
    fontWeight: '500',
  },
});
