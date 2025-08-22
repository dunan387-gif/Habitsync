import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function SimpleTest() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Simple Test</Text>
      <Text style={styles.info}>This is a basic test without any hooks</Text>
      <Text style={styles.info}>If you can see this, the app is loading</Text>
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
