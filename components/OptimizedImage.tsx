import React, { useState, useCallback, useRef } from 'react';
import { Image, ImageProps, View, ActivityIndicator, StyleSheet } from 'react-native';
import { useTheme } from '@/context/ThemeContext';

interface OptimizedImageProps extends Omit<ImageProps, 'source'> {
  source: { uri: string } | number;
  placeholder?: React.ReactNode;
  fallback?: React.ReactNode;
  onLoadStart?: () => void;
  onLoadEnd?: () => void;
  onError?: () => void;
  cachePolicy?: 'memory' | 'disk' | 'none';
  priority?: 'low' | 'normal' | 'high';
  resizeMode?: 'cover' | 'contain' | 'stretch' | 'repeat' | 'center';
}

export default function OptimizedImage({
  source,
  placeholder,
  fallback,
  onLoadStart,
  onLoadEnd,
  onError,
  cachePolicy = 'memory',
  priority = 'normal',
  resizeMode = 'cover',
  style,
  ...props
}: OptimizedImageProps) {
  const { currentTheme } = useTheme();
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const imageRef = useRef<Image>(null);

  const handleLoadStart = useCallback(() => {
    setIsLoading(true);
    setHasError(false);
    onLoadStart?.();
  }, [onLoadStart]);

  const handleLoadEnd = useCallback(() => {
    setIsLoading(false);
    onLoadEnd?.();
  }, [onLoadEnd]);

  const handleError = useCallback(() => {
    setIsLoading(false);
    setHasError(true);
    onError?.();
  }, [onError]);

  const handleLoad = useCallback(() => {
    setIsVisible(true);
  }, []);

  // Default placeholder
  const defaultPlaceholder = (
    <View style={[styles.placeholder, { backgroundColor: currentTheme.colors.card }]}>
      <ActivityIndicator size="small" color={currentTheme.colors.primary} />
    </View>
  );

  // Default fallback
  const defaultFallback = (
    <View style={[styles.fallback, { backgroundColor: currentTheme.colors.card }]}>
      <View style={[styles.fallbackIcon, { backgroundColor: currentTheme.colors.textMuted }]} />
    </View>
  );

  if (hasError) {
    return <>{fallback || defaultFallback}</>;
  }

  return (
    <View style={[styles.container, style]}>
      <Image
        ref={imageRef}
        source={source}
        style={[
          styles.image,
          { opacity: isVisible ? 1 : 0 },
          style
        ]}
        resizeMode={resizeMode}
        onLoadStart={handleLoadStart}
        onLoadEnd={handleLoadEnd}
        onError={handleError}
        onLoad={handleLoad}
        // Performance optimizations
        fadeDuration={0}
        progressiveRenderingEnabled={true}
        {...props}
      />
      
      {isLoading && (placeholder || defaultPlaceholder)}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  placeholder: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fallback: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fallbackIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
});
