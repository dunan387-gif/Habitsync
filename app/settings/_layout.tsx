import { Stack } from 'expo-router';
import { useLanguage } from '@/context/LanguageContext';

export default function SettingsLayout() {
  const { t } = useLanguage();

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen 
        name="notification-preferences" 
        options={{ 
          title: t('notificationPreferences.title'),
          headerShown: false 
        }} 
      />
      <Stack.Screen 
        name="change-password" 
        options={{ 
          title: t('changePassword.title'),
          headerShown: false 
        }} 
      />
      <Stack.Screen 
        name="privacy-settings" 
        options={{ 
          title: t('privacySettings.title'),
          headerShown: false 
        }} 
      />
      <Stack.Screen 
        name="delete-account" 
        options={{ 
          title: t('deleteAccount.title'),
          headerShown: false 
        }} 
      />
      <Stack.Screen 
        name="linked-accounts" 
        options={{ 
          title: t('linkedAccounts.title'),
          headerShown: false 
        }} 
      />
      <Stack.Screen 
        name="privacy-policy" 
        options={{ 
          title: t('privacyPolicy.title'),
          headerShown: false 
        }} 
      />
      <Stack.Screen 
        name="terms-of-service" 
        options={{ 
          title: t('termsOfService.title'),
          headerShown: false 
        }} 
      />
    </Stack>
  );
} 