import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useAuth } from '@/context/AuthContext';

export default function MinimalTest() {
  // This will test if useAuth works in a minimal component
  const auth = useAuth();
  
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Minimal Auth Test</Text>
      <Text style={styles.info}>Auth Loading: {auth.isLoading ? 'Yes' : 'No'}</Text>
      <Text style={styles.info}>Has User: {auth.user ? 'Yes' : 'No'}</Text>
      <Text style={styles.info}>User ID: {auth.user?.id || 'None'}</Text>
    </View>
  );
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
});
