import { Stack } from 'expo-router';

export default function MoodTrackingLayout() {
  return (
    <Stack>
      <Stack.Screen 
        name="detailed" 
        options={{ 
          title: 'Detailed Mood Tracking',
          headerShown: false 
        }} 
      />
    </Stack>
  );
} 