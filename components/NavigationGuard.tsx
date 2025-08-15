import { useEffect, useRef } from 'react';
import { useRouter, useSegments } from 'expo-router';
import { useAuth } from '@/context/AuthContext';

export default function NavigationGuard() {
  const { user, isLoading } = useAuth();
  const segments = useSegments();
  const router = useRouter();
  const navigationAttempted = useRef(false);
  const isInitialized = useRef(false);

  useEffect(() => {
    if (isLoading) {
      return;
    }

    // Wait for initial segments to be available
    if (!segments || segments.length < 1) {
      return;
    }

    const inAuthGroup = segments[0] === '(auth)';
    const inTabsGroup = segments[0] === '(tabs)';

    // Prevent multiple navigation attempts
    if (navigationAttempted.current) {
      return;
    }

    // Only navigate after initial load
    if (!isInitialized.current) {
      isInitialized.current = true;
      return; // Don't navigate on first initialization
    }

    try {
      console.log('🔍 NavigationGuard: User:', user ? 'exists' : 'null', 'Segments:', segments, 'InAuth:', inAuthGroup, 'InTabs:', inTabsGroup);
      
      if (!user) {
        // No user - should be in auth group
        if (!inAuthGroup) {
          console.log('🚀 NavigationGuard: Redirecting to login');
          navigationAttempted.current = true;
          router.replace('/(auth)/login');
        }
      } else {
        // User exists - should be in main app
        if (inAuthGroup) {
          console.log('🚀 NavigationGuard: Redirecting to tabs');
          navigationAttempted.current = true;
          // Use a more reliable navigation approach
          router.replace('/(tabs)' as any);
        }
      }
    } catch (error) {
      console.error('❌ NavigationGuard: Navigation error:', error);
      navigationAttempted.current = false;
    }
  }, [user, isLoading, segments, router]);

  // Reset navigation flag when user changes
  useEffect(() => {
    navigationAttempted.current = false;
  }, [user?.id]);

  return null; // This component doesn't render anything
}
