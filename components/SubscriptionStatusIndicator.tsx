import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { useSubscription } from '../context/SubscriptionContext';
import {
  Crown,
  Star,
  Zap,
  TrendingUp,
  Users,
  Brain,
  Palette,
  Bell,
  BarChart3,
  Activity,
  Target,
  Heart,
  Sparkles,
} from 'lucide-react-native';

const { width } = Dimensions.get('window');

interface SubscriptionStatusIndicatorProps {
  variant?: 'compact' | 'detailed' | 'banner';
  showUpgradeButton?: boolean;
  onUpgradePress?: () => void;
}

const SubscriptionStatusIndicator: React.FC<SubscriptionStatusIndicatorProps> = ({
  variant = 'compact',
  showUpgradeButton = false,
  onUpgradePress,
}) => {
  const { currentTheme } = useTheme();
  const { t } = useLanguage();
  const { currentTier, subscriptionStatus } = useSubscription();

  const isPro = currentTier === 'pro';
  const isActive = subscriptionStatus?.isActive || false;

  const getTierIcon = () => {
    if (isPro) {
      return <Crown size={16} color={currentTheme.colors.primary} />;
    }
    return <Star size={16} color={currentTheme.colors.textSecondary} />;
  };

  const getTierColor = () => {
    if (isPro && isActive) {
      return currentTheme.colors.primary;
    }
    return currentTheme.colors.textSecondary;
  };

  const getTierText = () => {
    if (isPro && isActive) {
      return t('subscription.proActive');
    } else if (isPro && !isActive) {
      return t('subscription.proExpired');
    }
    return t('subscription.free');
  };

  const getFeatureIcons = () => {
    if (isPro && isActive) {
      return [
        <Target key="habits" size={12} color={currentTheme.colors.success} />,
        <Brain key="ai" size={12} color={currentTheme.colors.accent} />,
        <BarChart3 key="analytics" size={12} color={currentTheme.colors.primary} />,
        <Users key="social" size={12} color={currentTheme.colors.warning} />,
      ];
    }
    return [
      <Target key="habits" size={12} color={currentTheme.colors.textSecondary} />,
      <Brain key="ai" size={12} color={currentTheme.colors.textSecondary} />,
      <BarChart3 key="analytics" size={12} color={currentTheme.colors.textSecondary} />,
      <Users key="social" size={12} color={currentTheme.colors.textSecondary} />,
    ];
  };

  if (variant === 'compact') {
    return (
      <View style={styles.compactContainer}>
        {getTierIcon()}
        <Text style={[styles.compactText, { color: getTierColor() }]}>
          {getTierText()}
        </Text>
      </View>
    );
  }

  if (variant === 'detailed') {
    return (
      <View style={[styles.detailedContainer, { backgroundColor: currentTheme.colors.card }]}>
        <View style={styles.detailedHeader}>
          <View style={styles.tierInfo}>
            {getTierIcon()}
            <Text style={[styles.detailedTitle, { color: currentTheme.colors.text }]}>
              {getTierText()}
            </Text>
          </View>
          {showUpgradeButton && !isPro && (
            <TouchableOpacity
              style={[styles.upgradeButton, { backgroundColor: currentTheme.colors.primary }]}
              onPress={onUpgradePress}
            >
              <Text style={[styles.upgradeButtonText, { color: "#FFFFFF" }]}>
                {t('subscription.upgrade')}
              </Text>
            </TouchableOpacity>
          )}
        </View>
        
        <View style={styles.featuresRow}>
          {getFeatureIcons().map((icon, index) => (
            <View key={index} style={styles.featureIcon}>
              {icon}
            </View>
          ))}
        </View>
        
        {isPro && subscriptionStatus?.endDate && (
          <Text style={[styles.expiryText, { color: currentTheme.colors.textSecondary }]}>
            {t('subscription.expiresOn')} {new Date(subscriptionStatus.endDate).toLocaleDateString()}
          </Text>
        )}
      </View>
    );
  }

  if (variant === 'banner') {
    if (isPro && isActive) {
      return (
        <View style={[styles.bannerContainer, { backgroundColor: currentTheme.colors.success + '20' }]}>
          <Crown size={20} color={currentTheme.colors.success} />
          <Text style={[styles.bannerText, { color: currentTheme.colors.success }]}>
            {t('subscription.proActiveBanner')}
          </Text>
        </View>
      );
    }
    
    return (
      <View style={[styles.bannerContainer, { backgroundColor: currentTheme.colors.primary + '20' }]}>
        <Star size={20} color={currentTheme.colors.primary} />
        <Text style={[styles.bannerText, { color: currentTheme.colors.primary }]}>
          {t('subscription.upgradeBanner')}
        </Text>
        {showUpgradeButton && (
          <TouchableOpacity
            style={[styles.bannerUpgradeButton, { backgroundColor: currentTheme.colors.primary }]}
            onPress={onUpgradePress}
          >
            <Text style={[styles.bannerUpgradeText, { color: "#FFFFFF" }]}>
              {t('subscription.upgrade')}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    );
  }

  return null;
};

const styles = StyleSheet.create({
  compactContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  compactText: {
    fontSize: 12,
    fontWeight: '500',
  },
  detailedContainer: {
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  detailedHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  tierInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailedTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  upgradeButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  upgradeButtonText: {
    fontSize: 12,
    fontWeight: '600',
  },
  featuresRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  featureIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  expiryText: {
    fontSize: 12,
    fontStyle: 'italic',
  },
  bannerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    marginHorizontal: 16,
    marginVertical: 8,
  },
  bannerText: {
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
    marginLeft: 8,
  },
  bannerUpgradeButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  bannerUpgradeText: {
    fontSize: 12,
    fontWeight: '600',
  },
});

export default SubscriptionStatusIndicator; 