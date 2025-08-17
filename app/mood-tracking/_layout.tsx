import { Stack } from 'expo-router';

export default function MoodTrackingLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen 
        name="detailed" 
        options={{ 
          title: 'Detailed Mood Tracking',
          headerShown: false,
          presentation: 'modal'
        }} 
      />
    </Stack>
  );
} 