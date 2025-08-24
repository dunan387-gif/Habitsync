import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '@/context/ThemeContext';

interface BetaLabelProps {
  size?: 'small' | 'medium' | 'large';
}

export default function BetaLabel({ size = 'small' }: BetaLabelProps) {
  const { currentTheme } = useTheme();
  
  const styles = createStyles(currentTheme.colors, size);
  
  return (
    <View style={styles.betaContainer}>
      <Text style={styles.betaText}>BETA</Text>
    </View>
  );
}

const createStyles = (colors: any, size: string) => StyleSheet.create({
  betaContainer: {
    position: 'absolute',
    top: size === 'small' ? -6 : size === 'medium' ? -8 : -10,
    right: size === 'small' ? -4 : size === 'medium' ? -6 : -8,
    backgroundColor: colors.primary,
    paddingHorizontal: size === 'small' ? 4 : size === 'medium' ? 6 : 8,
    paddingVertical: size === 'small' ? 2 : size === 'medium' ? 3 : 4,
    borderRadius: size === 'small' ? 4 : size === 'medium' ? 6 : 8,
    zIndex: 10,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  betaText: {
    color: colors.background,
    fontSize: size === 'small' ? 8 : size === 'medium' ? 10 : 12,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
});
