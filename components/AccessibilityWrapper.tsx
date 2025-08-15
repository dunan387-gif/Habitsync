import React from 'react';
import { AccessibilityInfo, View, ViewProps, AccessibilityRole } from 'react-native';

interface AccessibilityWrapperProps extends ViewProps {
  accessible?: boolean;
  accessibilityLabel?: string;
  accessibilityHint?: string;
  accessibilityRole?: AccessibilityRole;
  accessibilityState?: any;
  accessibilityValue?: any;
  accessibilityActions?: any[];
  onAccessibilityAction?: (event: any) => void;
  importantForAccessibility?: 'auto' | 'yes' | 'no' | 'no-hide-descendants';
  accessibilityLiveRegion?: 'none' | 'polite' | 'assertive';
  children: React.ReactNode;
}

export default function AccessibilityWrapper({
  accessible = true,
  accessibilityLabel,
  accessibilityHint,
  accessibilityRole,
  accessibilityState,
  accessibilityValue,
  accessibilityActions,
  onAccessibilityAction,
  importantForAccessibility = 'auto',
  accessibilityLiveRegion = 'none',
  children,
  style,
  ...props
}: AccessibilityWrapperProps) {
  return (
    <View
      accessible={accessible}
      accessibilityLabel={accessibilityLabel}
      accessibilityHint={accessibilityHint}
      accessibilityRole={accessibilityRole}
      accessibilityState={accessibilityState}
      accessibilityValue={accessibilityValue}
      accessibilityActions={accessibilityActions}
      onAccessibilityAction={onAccessibilityAction}
      importantForAccessibility={importantForAccessibility}
      accessibilityLiveRegion={accessibilityLiveRegion}
      style={style}
      {...props}
    >
      {children}
    </View>
  );
}

// Hook for accessibility announcements
export const useAccessibilityAnnouncement = () => {
  const announceForAccessibility = (announcement: string) => {
    AccessibilityInfo.announceForAccessibility(announcement);
  };

  return { announceForAccessibility };
};

// Hook for checking if screen reader is active
export const useScreenReaderStatus = () => {
  const [isScreenReaderEnabled, setIsScreenReaderEnabled] = React.useState(false);

  React.useEffect(() => {
    const checkScreenReader = async () => {
      const isEnabled = await AccessibilityInfo.isScreenReaderEnabled();
      setIsScreenReaderEnabled(isEnabled);
    };

    checkScreenReader();

    const subscription = AccessibilityInfo.addEventListener(
      'screenReaderChanged',
      setIsScreenReaderEnabled
    );

    return () => subscription?.remove();
  }, []);

  return isScreenReaderEnabled;
};
