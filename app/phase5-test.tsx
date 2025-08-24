import React from 'react';
import { SafeAreaView, StatusBar } from 'react-native';
import Phase5TestComponent from '../components/Phase5TestComponent';

export default function Phase5TestPage() {
  return (
    <SafeAreaView style={{ flex: 1 }}>
      <StatusBar barStyle="dark-content" />
      <Phase5TestComponent />
    </SafeAreaView>
  );
}
