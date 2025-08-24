import React from 'react';
import { SafeAreaView, StatusBar } from 'react-native';
import Phase3TestComponent from '@/components/Phase3TestComponent';

export default function Phase3TestPage() {
  return (
    <SafeAreaView style={{ flex: 1 }}>
      <StatusBar barStyle="dark-content" />
      <Phase3TestComponent />
    </SafeAreaView>
  );
}


