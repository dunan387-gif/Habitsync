import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { expoNotificationService } from '@/services/ExpoNotificationService';

export default function NotificationTest() {
  const testLocalNotification = async () => {
    try {
      const identifier = await expoNotificationService.showLocalNotification({
        title: 'Test Notification',
        body: 'This is a test notification from HabitSyncer!',
        data: { type: 'test' },
        channelId: 'habit-reminders'
      });
      
      if (identifier) {
        Alert.alert('Success', 'Test notification sent! Check your notification tray.');
      } else {
        Alert.alert('Error', 'Failed to send test notification.');
      }
    } catch (error) {
      console.error('Error sending test notification:', error);
      Alert.alert('Error', 'Failed to send test notification.');
    }
  };

  const getToken = () => {
    const token = expoNotificationService.getCurrentExpoPushToken();
    if (token) {
      Alert.alert('Expo Push Token', `Token: ${token.substring(0, 50)}...`);
    } else {
      Alert.alert('No Token', 'Expo push token not available. Make sure you\'re on a physical device.');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Notification Test</Text>
      
      <TouchableOpacity style={styles.button} onPress={testLocalNotification}>
        <Text style={styles.buttonText}>Send Test Notification</Text>
      </TouchableOpacity>
      
      <TouchableOpacity style={styles.button} onPress={getToken}>
        <Text style={styles.buttonText}>Get Expo Push Token</Text>
      </TouchableOpacity>
      
      <Text style={styles.info}>
        Make sure you're running this on a physical device to test notifications properly.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: '#f5f5f5',
    borderRadius: 10,
    margin: 10,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
  },
  buttonText: {
    color: 'white',
    textAlign: 'center',
    fontWeight: '600',
  },
  info: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    marginTop: 10,
  },
});
