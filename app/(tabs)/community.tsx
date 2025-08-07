import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity } from 'react-native';
import { useTheme } from '@/context/ThemeContext';
import { useLanguage } from '@/context/LanguageContext';
import { useSubscription } from '@/context/SubscriptionContext';
import SocialCommunityFeed from '@/components/SocialCommunityFeed';

export default function CommunityScreen() {
  const { currentTheme } = useTheme();
  const { t } = useLanguage();
  const { canUseSocialFeatures, showUpgradePrompt } = useSubscription();

  const styles = createStyles(currentTheme.colors);

  // Check if user can access social features
  if (!canUseSocialFeatures()) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.upgradeContainer}>
          <Text style={styles.upgradeTitle}>{t('community.upgradeRequired')}</Text>
          <Text style={styles.upgradeMessage}>{t('community.upgradeMessage')}</Text>
          <TouchableOpacity 
            style={styles.upgradeButton}
            onPress={() => showUpgradePrompt('social_feature')}
          >
            <Text style={styles.upgradeButtonText}>{t('premium.upgradeToPro')}</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Beta Badge */}
      <View style={styles.betaContainer}>
        <View style={styles.betaBadge}>
          <Text style={styles.betaText}>{t('community.beta.badge')}</Text>
        </View>
        <Text style={styles.betaDescription}>
          {t('community.beta.description')}
        </Text>
      </View>
      
      <SocialCommunityFeed />
    </SafeAreaView>
  );
}

const createStyles = (colors: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingTop: 30,
  },
  upgradeContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  upgradeTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
    textAlign: 'center',
    marginBottom: 10,
  },
  upgradeMessage: {
    fontSize: 18,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 20,
  },
  upgradeButton: {
    backgroundColor: colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    marginTop: 20,
  },
  upgradeButtonText: {
    color: colors.background,
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  // Beta badge styles
  betaContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: colors.primary + '10',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  betaBadge: {
    backgroundColor: colors.primary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 8,
  },
  betaText: {
    color: colors.background,
    fontSize: 10,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  betaDescription: {
    color: colors.textSecondary,
    fontSize: 12,
    flex: 1,
  },
});