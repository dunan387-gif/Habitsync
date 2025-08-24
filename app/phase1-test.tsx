import React from 'react';
import { SafeAreaView, StatusBar } from 'react-native';
import Phase1TestComponent from '@/components/Phase1TestComponent';

export default function Phase1TestPage() {
  return (
    <SafeAreaView style={{ flex: 1 }}>
      <StatusBar barStyle="dark-content" />
      <Phase1TestComponent />
    </SafeAreaView>
  );
}
