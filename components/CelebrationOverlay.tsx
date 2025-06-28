import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Dimensions } from 'react-native';
import ConfettiCannon from 'react-native-confetti-cannon';
import { useTheme } from '@/context/ThemeContext';

type CelebrationType = 'streak' | 'allComplete' | 'milestone';

type CelebrationOverlayProps = {
  visible: boolean;
  type: CelebrationType;
  message: string;
  onComplete: () => void;
};

const { width, height } = Dimensions.get('window');

export default function CelebrationOverlay({ visible, type, message, onComplete }: CelebrationOverlayProps) {
  const { currentTheme } = useTheme();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.5)).current;
  const confettiRef = useRef<any>(null);

  useEffect(() => {
    if (visible) {
      // Start confetti
      if (confettiRef.current) {
        confettiRef.current.start();
      }

      // Animate message appearance
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 100,
          friction: 8,
          useNativeDriver: true,
        }),
      ]).start();

      // Auto-hide after 3 seconds
      const timer = setTimeout(() => {
        hideAnimation();
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [visible]);

  const hideAnimation = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 0.5,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onComplete();
    });
  };

  const getConfettiColors = () => {
    switch (type) {
      case 'streak':
        return ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7'];
      case 'allComplete':
        return ['#00B894', '#00CEC9', '#6C5CE7', '#A29BFE', '#FD79A8'];
      case 'milestone':
        return ['#FDCB6E', '#E17055', '#74B9FF', '#81ECEC', '#FD79A8'];
      default:
        return ['#FF6B6B', '#4ECDC4', '#45B7D1'];
    }
  };

  const getEmoji = () => {
    switch (type) {
      case 'streak':
        return '🔥';
      case 'allComplete':
        return '🎉';
      case 'milestone':
        return '⭐';
      default:
        return '🎉';
    }
  };

  if (!visible) return null;

  const styles = createStyles(currentTheme.colors);

  return (
    <View style={styles.overlay}>
      <ConfettiCannon
        ref={confettiRef}
        count={type === 'allComplete' ? 200 : 100}
        origin={{ x: width / 2, y: 0 }}
        explosionSpeed={350}
        fallSpeed={2000}
        fadeOut={true}
        colors={getConfettiColors()}
        autoStart={false}
      />
      
      <Animated.View 
        style={[
          styles.messageContainer,
          {
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }]
          }
        ]}
      >
        <Text style={styles.emoji}>{getEmoji()}</Text>
        <Text style={styles.message}>{message}</Text>
      </Animated.View>
    </View>
  );
}

const createStyles = (colors: any) => StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1000,
    pointerEvents: 'none',
  },
  messageContainer: {
    position: 'absolute',
    top: height * 0.3,
    left: 20,
    right: 20,
    backgroundColor: colors.card,
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  emoji: {
    fontSize: 48,
    marginBottom: 12,
  },
  message: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    textAlign: 'center',
    lineHeight: 24,
  },
});