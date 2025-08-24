import React from 'react';
import { SafeAreaView, StatusBar } from 'react-native';
import Phase2TestComponent from '@/components/Phase2TestComponent';

export default function Phase2TestPage() {
  return (
    <SafeAreaView style={{ flex: 1 }}>
      <StatusBar barStyle="dark-content" />
      <Phase2TestComponent />
    </SafeAreaView>
  );
}
