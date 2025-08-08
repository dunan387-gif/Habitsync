import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Dimensions,
  Animated,
  StatusBar,
  Platform,
  SafeAreaView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '@/context/ThemeContext';
import {
  Crown,
  X,
  Star,
  Zap,
  TrendingUp,
  Brain,
  Palette,
  Target,
  Heart,
  Sparkles,
} from 'lucide-react-native';

const { width, height } = Dimensions.get('window');

interface StyledReminderProps {
  visible: boolean;
  onClose: () => void;
  onUpgrade: () => void;
  title: string;
  message: string;
  type?: 'default' | 'habit_limit' | 'analytics_limit' | 'ai_limit';
}

const StyledReminder: React.FC<StyledReminderProps> = ({
  visible,
  onClose,
  onUpgrade,
  title,
  message,
  type = 'default',
}) => {
  const { currentTheme } = useTheme();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const modalOpenTime = useRef<number>(0);

  useEffect(() => {

    if (visible) {
      
      modalOpenTime.current = Date.now();
      // Reset animations
      fadeAnim.setValue(0);
      scaleAnim.setValue(0.8);
      
      // Start entrance animation
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 100,
          friction: 8,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      
      // Start exit animation
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 0.8,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible, fadeAnim, scaleAnim]);

  const handleRequestClose = () => {
    const timeSinceOpen = Date.now() - modalOpenTime.current;
    // Only allow closing if modal has been open for at least 500ms
    if (timeSinceOpen > 500) {
      
      onClose();
    }
  };

  const getGradientColors = (): [string, string] => {
    switch (type) {
      case 'habit_limit':
        return ['#667eea', '#764ba2'];
      case 'analytics_limit':
        return ['#f093fb', '#f5576c'];
      case 'ai_limit':
        return ['#4facfe', '#00f2fe'];
      default:
        return ['#667eea', '#764ba2'];
    }
  };

  const getIcon = () => {
    switch (type) {
      case 'habit_limit':
        return <Target size={32} color="#FFFFFF" />;
      case 'analytics_limit':
        return <TrendingUp size={32} color="#FFFFFF" />;
      case 'ai_limit':
        return <Brain size={32} color="#FFFFFF" />;
      default:
        return <Crown size={32} color="#FFFFFF" />;
    }
  };

  const getFeatures = () => {
    switch (type) {
      case 'habit_limit':
        return [
          { icon: <Target size={20} color="#FFFFFF" />, text: 'Unlimited habits' },
          { icon: <TrendingUp size={20} color="#FFFFFF" />, text: 'Advanced analytics' },
          { icon: <Brain size={20} color="#FFFFFF" />, text: 'AI coaching' },
          { icon: <Palette size={20} color="#FFFFFF" />, text: 'Premium themes' },
        ];
      case 'analytics_limit':
        return [
          { icon: <TrendingUp size={20} color="#FFFFFF" />, text: '365-day trends' },
          { icon: <Star size={20} color="#FFFFFF" />, text: 'Advanced reporting' },
          { icon: <Target size={20} color="#FFFFFF" />, text: 'Performance insights' },
          { icon: <Brain size={20} color="#FFFFFF" />, text: 'AI-powered analysis' },
        ];
      case 'ai_limit':
        return [
          { icon: <Brain size={20} color="#FFFFFF" />, text: 'Daily AI coaching' },
          { icon: <Sparkles size={20} color="#FFFFFF" />, text: 'Personalized suggestions' },
          { icon: <Target size={20} color="#FFFFFF" />, text: 'Smart optimization' },
          { icon: <TrendingUp size={20} color="#FFFFFF" />, text: 'Predictive analytics' },
        ];
      default:
        return [
          { icon: <Crown size={20} color="#FFFFFF" />, text: 'Unlimited access' },
          { icon: <TrendingUp size={20} color="#FFFFFF" />, text: 'Advanced features' },
          { icon: <Brain size={20} color="#FFFFFF" />, text: 'AI coaching' },
          { icon: <Palette size={20} color="#FFFFFF" />, text: 'Premium themes' },
        ];
    }
  };


  if (!visible) {
    return null;
  }

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="none"
      onRequestClose={handleRequestClose}
      statusBarTranslucent={true}
      hardwareAccelerated={true}
      presentationStyle="overFullScreen"
    >
      <SafeAreaView style={styles.safeArea}>
        <StatusBar 
          backgroundColor="rgba(0, 0, 0, 0.5)" 
          barStyle="light-content" 
          translucent={true}
        />
        
        {/* Backdrop */}
        <Animated.View 
          style={[
            styles.backdrop,
            { opacity: fadeAnim }
          ]}
        />
        
        {/* Modal Content */}
        <View style={styles.modalContainer}>
          <Animated.View 
            style={[
              styles.modalContent,
              { 
                transform: [{ scale: scaleAnim }],
                opacity: fadeAnim,
              }
            ]}
          >
            {/* Header with gradient */}
            <LinearGradient
              colors={getGradientColors()}
              style={styles.header}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <View style={styles.headerContent}>
                <View style={styles.iconContainer}>
                  {getIcon()}
                </View>
                <TouchableOpacity 
                  onPress={() => {
                    onClose();
                  }} 
                  style={styles.closeButton}
                  activeOpacity={0.7}
                >
                  <X size={24} color="#FFFFFF" />
                </TouchableOpacity>
              </View>
            </LinearGradient>

            {/* Content */}
            <View style={styles.content}>
              <Text style={[styles.title, { color: currentTheme.colors.text }]}>
                {title}
              </Text>
              
              <Text style={[styles.message, { color: currentTheme.colors.textSecondary }]}>
                {message}
              </Text>

              {/* Features list */}
              <View style={styles.featuresContainer}>
                {getFeatures().map((feature, index) => (
                  <View key={index} style={styles.featureRow}>
                    <View style={styles.featureIcon}>
                      {feature.icon}
                    </View>
                    <Text style={[styles.featureText, { color: currentTheme.colors.text }]}>
                      {feature.text}
                    </Text>
                  </View>
                ))}
              </View>

              {/* Social proof */}
              <View style={[styles.socialProof, { backgroundColor: currentTheme.colors.surface }]}>
                <Star size={16} color={currentTheme.colors.warning} />
                <Text style={[styles.socialProofText, { color: currentTheme.colors.textSecondary }]}>
                  Join thousands of users who've upgraded!
                </Text>
              </View>
            </View>

            {/* Action buttons */}
            <View style={styles.actions}>
              <TouchableOpacity
                style={[styles.secondaryButton, { borderColor: currentTheme.colors.border }]}
                onPress={() => {
                  onClose();
                }}
                activeOpacity={0.7}
              >
                <Text style={[styles.secondaryButtonText, { color: currentTheme.colors.textSecondary }]}>
                  💪 Maybe Later
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.primaryButton}
                onPress={() => {
                  onUpgrade();
                }}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={getGradientColors()}
                  style={styles.primaryButtonGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  <Crown size={20} color="#FFFFFF" />
                  <Text style={styles.primaryButtonText}>
                    🚀 Upgrade Now
                  </Text>
                  <Zap size={20} color="#FFFFFF" />
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </View>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    zIndex: 1000,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 40,
    zIndex: 1001,
  },
  modalContent: {
    width: Math.min(width - 40, 400),
    maxHeight: height * 0.8,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { 
      width: 0, 
      height: Platform.OS === 'ios' ? 10 : 20 
    },
    shadowOpacity: 0.3,
    shadowRadius: Platform.OS === 'ios' ? 20 : 30,
    elevation: Platform.OS === 'android' ? 25 : 0,
    overflow: 'hidden',
    zIndex: 1002,
  },
  header: {
    padding: 20,
    paddingTop: 30,
    paddingBottom: 30,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  iconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  content: {
    padding: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 12,
  },
  message: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  featuresContainer: {
    marginBottom: 20,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    paddingVertical: 4,
  },
  featureIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(102, 126, 234, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  featureText: {
    fontSize: 16,
    fontWeight: '500',
    flex: 1,
  },
  socialProof: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
  },
  socialProofText: {
    fontSize: 14,
    fontStyle: 'italic',
    flex: 1,
    marginLeft: 8,
  },
  actions: {
    flexDirection: 'row',
    padding: 24,
    paddingTop: 0,
    gap: 12,
  },
  secondaryButton: {
    flex: 1,
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '500',
  },
  primaryButton: {
    flex: 2,
    borderRadius: 12,
    overflow: 'hidden',
  },
  primaryButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginHorizontal: 8,
  },
});

export default StyledReminder;