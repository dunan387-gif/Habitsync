import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useAuth } from '@/context/AuthContext';

export default function TestAuth() {
  try {
    const { user, isLoading } = useAuth();
    
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Auth Test</Text>
        <Text style={styles.info}>Loading: {isLoading ? 'Yes' : 'No'}</Text>
        <Text style={styles.info}>Has User: {user ? 'Yes' : 'No'}</Text>
        <Text style={styles.info}>User ID: {user?.id || 'None'}</Text>
        <Text style={styles.info}>User Email: {user?.email || 'None'}</Text>
      </View>
    );
  } catch (error) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Auth Test - ERROR</Text>
        <Text style={styles.error}>Error: {error instanceof Error ? error.message : 'Unknown error'}</Text>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#333',
  },
  info: {
    fontSize: 16,
    marginBottom: 10,
    color: '#666',
  },
  error: {
    fontSize: 16,
    marginBottom: 10,
    color: '#ff0000',
  },
});
