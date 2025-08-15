import { Tabs } from 'expo-router';
import { Home, BookOpen, BarChart3, Trophy, MoreHorizontal, Users } from 'lucide-react-native';
import { View, ActivityIndicator } from 'react-native';
import { useTheme } from '@/context/ThemeContext';
import { useLanguage } from '@/context/LanguageContext';

export default function TabLayout() {
  const { currentTheme } = useTheme();
  const { t, isLoading } = useLanguage();

  // Safe title function that ensures we always return a string
  const safeTitle = (key: string) => {
    try {
      const result = t(key);
      return typeof result === 'string' && result.length > 0 ? result : key;
    } catch (error) {
      console.warn('Translation error for key:', key, error);
      return key;
    }
  };

  // Don't render tabs until translations are loaded
  if (isLoading) {
    return (
      <View style={{ 
        flex: 1, 
        justifyContent: 'center', 
        alignItems: 'center', 
        backgroundColor: currentTheme.colors.background
      }}>
        <ActivityIndicator size="large" color={currentTheme.colors.primary} />
      </View>
    );
  }

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: currentTheme.colors.primary,
        tabBarInactiveTintColor: currentTheme.colors.textMuted,
        tabBarStyle: {
          backgroundColor: currentTheme.colors.card,
          borderTopColor: currentTheme.colors.border,
        },
        headerShown: false,
        headerStyle: {
          backgroundColor: currentTheme.colors.background,
        },
        headerTintColor: currentTheme.colors.text,
      }}
    >
      <Tabs.Screen 
        name="index"
        options={{
          title: safeTitle('tabs.home'),
          tabBarIcon: ({ color, focused }) => (
            <Home size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen 
        name="library"
        options={{
          title: safeTitle('tabs.library'),
          tabBarIcon: ({ color, focused }) => (
            <BookOpen size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen 
        name="community"
        options={{
          title: safeTitle('tabs.community'),
          tabBarIcon: ({ color, focused }) => (
            <Users size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen 
        name="stats"
        options={{
          title: safeTitle('tabs.analytics'),
          tabBarIcon: ({ color, focused }) => (
            <BarChart3 size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen 
        name="gamification"
        options={{
          title: safeTitle('tabs.gamification'),
          tabBarIcon: ({ color, focused }) => (
            <Trophy size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen 
        name="settings"
        options={{
          title: safeTitle('tabs.more'),
          tabBarIcon: ({ color, focused }) => (
            <MoreHorizontal size={24} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
