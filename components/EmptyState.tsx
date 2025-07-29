import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Plus } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '@/context/ThemeContext';

type EmptyStateProps = {
  title: string;
  message: string;
  actionLabel: string;
  onAction?: () => void; // Add optional onAction prop
};

export default function EmptyState({ title, message, actionLabel, onAction }: EmptyStateProps) {
  const router = useRouter();
  const { currentTheme } = useTheme();

  const handleAction = () => {
    if (onAction) {
      onAction(); // Use custom action if provided
    } else {
      router.push('/library'); // Default behavior
    }
  };

  const styles = createStyles(currentTheme.colors);

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.message}>{message}</Text>
        
        <TouchableOpacity 
          style={styles.button}
          onPress={handleAction}
        >
          <Plus size={20} color="#FFFFFF" style={styles.buttonIcon} />
          <Text style={styles.buttonText}>{actionLabel}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const createStyles = (colors: any) => StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  content: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
    textAlign: 'center',
  },
  message: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  buttonIcon: {
    marginRight: 8,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});