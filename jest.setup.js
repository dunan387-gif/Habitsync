import 'react-native-gesture-handler/jestSetup';

// Mock expo modules
jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(),
  setItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}));

jest.mock('expo-notifications', () => ({
  scheduleNotificationAsync: jest.fn(),
  cancelScheduledNotificationAsync: jest.fn(),
  getPermissionsAsync: jest.fn(() => Promise.resolve({ status: 'granted' })),
  requestPermissionsAsync: jest.fn(() => Promise.resolve({ status: 'granted' })),
  setNotificationHandler: jest.fn(),
}));

jest.mock('expo-crypto', () => ({
  getRandomBytesAsync: jest.fn(() => Promise.resolve(new Uint8Array(16))),
}));

jest.mock('expo-file-system', () => ({
  documentDirectory: '/mock/document/directory/',
  cacheDirectory: '/mock/cache/directory/',
  readAsStringAsync: jest.fn(),
  writeAsStringAsync: jest.fn(),
  deleteAsync: jest.fn(),
}));

jest.mock('expo-image-picker', () => ({
  launchImageLibraryAsync: jest.fn(),
  launchCameraAsync: jest.fn(),
}));

jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(),
  notificationAsync: jest.fn(),
  selectionAsync: jest.fn(),
}));

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

// Mock expo-router
jest.mock('expo-router', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
  }),
  useLocalSearchParams: () => ({}),
  Link: 'Link',
}));

// Mock react-native-reanimated
jest.mock('react-native-reanimated', () => {
  const Reanimated = require('react-native-reanimated/mock');
  Reanimated.default.call = () => {};
  return Reanimated;
});

// Mock lucide-react-native
jest.mock('lucide-react-native', () => ({
  Home: 'Home',
  Target: 'Target',
  BarChart3: 'BarChart3',
  Users: 'Users',
  Settings: 'Settings',
  Plus: 'Plus',
  Search: 'Search',
  ArrowLeft: 'ArrowLeft',
  Globe: 'Globe',
  Eye: 'Eye',
  Database: 'Database',
  Share: 'Share',
  Shield: 'Shield',
  Bell: 'Bell',
  Activity: 'Activity',
  Cpu: 'Cpu',
  HardDrive: 'HardDrive',
  Wifi: 'Wifi',
  AlertTriangle: 'AlertTriangle',
  CheckCircle: 'CheckCircle',
  TrendingUp: 'TrendingUp',
  TrendingDown: 'TrendingDown',
  Zap: 'Zap',
  RefreshCw: 'RefreshCw',
}));

// Global test setup
global.console = {
  ...console,
  // Uncomment to ignore a specific log level
  // log: jest.fn(),
  // debug: jest.fn(),
  // info: jest.fn(),
  // warn: jest.fn(),
  error: jest.fn(),
};

// Mock __DEV__
global.__DEV__ = false;
