import { useRef, useCallback, useEffect } from 'react';
import { Animated, Easing } from 'react-native';

interface AnimationConfig {
  duration?: number;
  easing?: any;
  useNativeDriver?: boolean;
  delay?: number;
}

interface UseOptimizedAnimationReturn {
  fadeAnim: Animated.Value;
  scaleAnim: Animated.Value;
  slideAnim: Animated.Value;
  rotateAnim: Animated.Value;
  pulseAnim: Animated.Value;
  fadeIn: (config?: AnimationConfig) => void;
  fadeOut: (config?: AnimationConfig) => void;
  scaleIn: (config?: AnimationConfig) => void;
  scaleOut: (config?: AnimationConfig) => void;
  slideIn: (direction?: 'left' | 'right' | 'up' | 'down', config?: AnimationConfig) => void;
  slideOut: (direction?: 'left' | 'right' | 'up' | 'down', config?: AnimationConfig) => void;
  rotate: (toValue?: number, config?: AnimationConfig) => void;
  pulse: (config?: AnimationConfig) => void;
  stopPulse: () => void;
  reset: () => void;
}

export const useOptimizedAnimation = (): UseOptimizedAnimationReturn => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  const defaultConfig: AnimationConfig = {
    duration: 300,
    easing: Easing.out(Easing.cubic),
    useNativeDriver: true,
    delay: 0,
  };

  const fadeIn = useCallback((config: AnimationConfig = {}) => {
    const finalConfig = { ...defaultConfig, ...config };
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: finalConfig.duration!,
      easing: finalConfig.easing,
      useNativeDriver: finalConfig.useNativeDriver!,
      delay: finalConfig.delay,
    }).start();
  }, [fadeAnim]);

  const fadeOut = useCallback((config: AnimationConfig = {}) => {
    const finalConfig = { ...defaultConfig, ...config };
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: finalConfig.duration!,
      easing: finalConfig.easing,
      useNativeDriver: finalConfig.useNativeDriver!,
      delay: finalConfig.delay,
    }).start();
  }, [fadeAnim]);

  const scaleIn = useCallback((config: AnimationConfig = {}) => {
    const finalConfig = { ...defaultConfig, ...config };
    Animated.spring(scaleAnim, {
      toValue: 1,
      tension: 50,
      friction: 7,
      useNativeDriver: finalConfig.useNativeDriver!,
      delay: finalConfig.delay,
    }).start();
  }, [scaleAnim]);

  const scaleOut = useCallback((config: AnimationConfig = {}) => {
    const finalConfig = { ...defaultConfig, ...config };
    Animated.timing(scaleAnim, {
      toValue: 0.8,
      duration: finalConfig.duration!,
      easing: finalConfig.easing,
      useNativeDriver: finalConfig.useNativeDriver!,
      delay: finalConfig.delay,
    }).start();
  }, [scaleAnim]);

  const slideIn = useCallback((direction: 'left' | 'right' | 'up' | 'down' = 'right', config: AnimationConfig = {}) => {
    const finalConfig = { ...defaultConfig, ...config };
    const toValue = direction === 'left' || direction === 'up' ? 1 : -1;
    
    Animated.timing(slideAnim, {
      toValue,
      duration: finalConfig.duration!,
      easing: finalConfig.easing,
      useNativeDriver: finalConfig.useNativeDriver!,
      delay: finalConfig.delay,
    }).start();
  }, [slideAnim]);

  const slideOut = useCallback((direction: 'left' | 'right' | 'up' | 'down' = 'right', config: AnimationConfig = {}) => {
    const finalConfig = { ...defaultConfig, ...config };
    const toValue = direction === 'left' || direction === 'up' ? -1 : 1;
    
    Animated.timing(slideAnim, {
      toValue,
      duration: finalConfig.duration!,
      easing: finalConfig.easing,
      useNativeDriver: finalConfig.useNativeDriver!,
      delay: finalConfig.delay,
    }).start();
  }, [slideAnim]);

  const rotate = useCallback((toValue: number = 1, config: AnimationConfig = {}) => {
    const finalConfig = { ...defaultConfig, ...config };
    Animated.timing(rotateAnim, {
      toValue,
      duration: finalConfig.duration!,
      easing: finalConfig.easing,
      useNativeDriver: finalConfig.useNativeDriver!,
      delay: finalConfig.delay,
    }).start();
  }, [rotateAnim]);

  const pulse = useCallback((config: AnimationConfig = {}) => {
    const finalConfig = { ...defaultConfig, ...config };
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.2,
          duration: finalConfig.duration! / 2,
          easing: finalConfig.easing,
          useNativeDriver: finalConfig.useNativeDriver!,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: finalConfig.duration! / 2,
          easing: finalConfig.easing,
          useNativeDriver: finalConfig.useNativeDriver!,
        }),
      ])
    ).start();
  }, [pulseAnim]);

  const stopPulse = useCallback(() => {
    pulseAnim.stopAnimation();
    pulseAnim.setValue(1);
  }, [pulseAnim]);

  const reset = useCallback(() => {
    fadeAnim.setValue(0);
    scaleAnim.setValue(0.8);
    slideAnim.setValue(0);
    rotateAnim.setValue(0);
    pulseAnim.setValue(1);
  }, [fadeAnim, scaleAnim, slideAnim, rotateAnim, pulseAnim]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      fadeAnim.stopAnimation();
      scaleAnim.stopAnimation();
      slideAnim.stopAnimation();
      rotateAnim.stopAnimation();
      pulseAnim.stopAnimation();
    };
  }, [fadeAnim, scaleAnim, slideAnim, rotateAnim, pulseAnim]);

  return {
    fadeAnim,
    scaleAnim,
    slideAnim,
    rotateAnim,
    pulseAnim,
    fadeIn,
    fadeOut,
    scaleIn,
    scaleOut,
    slideIn,
    slideOut,
    rotate,
    pulse,
    stopPulse,
    reset,
  };
};
