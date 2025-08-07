import { Tabs } from 'expo-router';
import { Home, BookOpen, BarChart3, Trophy, MoreHorizontal, Users } from 'lucide-react-native';
import { useTheme } from '@/context/ThemeContext';
import { useLanguage } from '@/context/LanguageContext';

export default function TabLayout() {
  const { currentTheme } = useTheme();
  const { t } = useLanguage();

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
          title: t('tabs.home'),
          tabBarIcon: ({ color, focused }) => (
            <Home size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen 
        name="library"
        options={{
          title: t('tabs.library'),
          tabBarIcon: ({ color, focused }) => (
            <BookOpen size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen 
        name="community"
        options={{
          title: t('tabs.community'),
          tabBarIcon: ({ color, focused }) => (
            <Users size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen 
        name="stats"
        options={{
          title: t('tabs.analytics'),
          tabBarIcon: ({ color, focused }) => (
            <BarChart3 size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen 
        name="gamification"
        options={{
          title: t('tabs.gamification'),
          tabBarIcon: ({ color, focused }) => (
            <Trophy size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen 
        name="settings"
        options={{
          title: t('tabs.more'),
          tabBarIcon: ({ color, focused }) => (
            <MoreHorizontal size={24} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
