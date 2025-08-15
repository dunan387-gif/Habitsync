import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import AccessibilityWrapper, { useAccessibilityAnnouncement, useScreenReaderStatus } from './AccessibilityWrapper';

export default function AccessibilityExample() {
  const { announceForAccessibility } = useAccessibilityAnnouncement();
  const isScreenReaderEnabled = useScreenReaderStatus();

  const handleButtonPress = () => {
    // Announce to screen readers
    announceForAccessibility('Button pressed!');
    console.log('Button pressed');
  };

  return (
    <View style={styles.container}>
      {/* Basic accessibility wrapper */}
      <AccessibilityWrapper
        accessibilityLabel="Main content area"
        accessibilityHint="Contains the main content of the screen"
        accessibilityRole="header"
      >
        <Text style={styles.title}>Welcome to HabitSync</Text>
        <Text style={styles.subtitle}>Track your habits, transform your life</Text>
      </AccessibilityWrapper>

      {/* Interactive element with accessibility */}
      <AccessibilityWrapper
        accessibilityLabel="Start tracking habits button"
        accessibilityHint="Double tap to start tracking your first habit"
        accessibilityRole="button"
        accessibilityState={{ disabled: false }}
      >
        <TouchableOpacity style={styles.button} onPress={handleButtonPress}>
          <Text style={styles.buttonText}>Start Tracking</Text>
        </TouchableOpacity>
      </AccessibilityWrapper>

      {/* Status information */}
      <AccessibilityWrapper
        accessibilityLabel="Screen reader status"
        accessibilityLiveRegion="polite"
      >
        <Text style={styles.status}>
          Screen Reader: {isScreenReaderEnabled ? 'Enabled' : 'Disabled'}
        </Text>
      </AccessibilityWrapper>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 30,
  },
  button: {
    backgroundColor: '#4F46E5',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 20,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  status: {
    fontSize: 14,
    color: '#888',
    fontStyle: 'italic',
  },
});
