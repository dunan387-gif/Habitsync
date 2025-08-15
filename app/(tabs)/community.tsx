import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, ScrollView } from 'react-native';
import { useTheme } from '@/context/ThemeContext';
import { useLanguage } from '@/context/LanguageContext';
import { useSubscription } from '@/context/SubscriptionContext';
// import SocialCommunityFeed from '@/components/SocialCommunityFeed'; // Temporarily disabled for Firebase migration
import LearningChallenges from '@/components/LearningChallenges';
import PeerMentorship from '@/components/PeerMentorship';
import SocialLearningCircles from '@/components/SocialLearningCircles';
import KnowledgeSharing from '@/components/KnowledgeSharing';
import CommunityAnalyticsDashboard from '@/components/CommunityAnalytics';
import { Users, Trophy, BookOpen, MessageSquare, TrendingUp } from 'lucide-react-native';

type CommunityTab = 'feed' | 'challenges' | 'mentorship' | 'knowledge' | 'circles' | 'analytics';

export default function CommunityScreen() {
  const { currentTheme } = useTheme();
  const { t } = useLanguage();
  const { canUseSocialFeatures, showUpgradePrompt } = useSubscription();
  const [activeTab, setActiveTab] = useState<CommunityTab>('feed');

  const styles = createStyles(currentTheme.colors);

  if (!canUseSocialFeatures) {
    return showUpgradePrompt('social_feature');
  }

  const renderTabContent = () => {
    switch (activeTab) {
      case 'feed':
        return (
          <View style={styles.comingSoonContainer}>
            <Text style={[styles.comingSoonTitle, { color: currentTheme.colors.text }]}>
              🔥 Community Feed
            </Text>
            <Text style={[styles.comingSoonDescription, { color: currentTheme.colors.textSecondary }]}>
              Coming soon! We're migrating to Firebase to bring you a better community experience.
            </Text>
          </View>
        );
      case 'challenges':
        return <LearningChallenges />;
      case 'mentorship':
        return <PeerMentorship />;
      case 'knowledge':
        return <KnowledgeSharing />;
      case 'circles':
        return <SocialLearningCircles />;
      case 'analytics':
        return <CommunityAnalyticsDashboard />;
      default:
        return (
          <View style={styles.comingSoonContainer}>
            <Text style={[styles.comingSoonTitle, { color: currentTheme.colors.text }]}>
              🔥 Community Feed
            </Text>
            <Text style={[styles.comingSoonDescription, { color: currentTheme.colors.textSecondary }]}>
              Coming soon! We're migrating to Firebase to bring you a better community experience.
            </Text>
          </View>
        );
    }
  };

  const tabs = [
    { key: 'feed' as CommunityTab, icon: Users, label: t('community.feed'), description: t('community.feedDesc') },
    { key: 'challenges' as CommunityTab, icon: Trophy, label: t('challenges.title'), description: t('challenges.description') },
    { key: 'mentorship' as CommunityTab, icon: BookOpen, label: t('mentorship.title'), description: t('mentorship.description') },
    { key: 'knowledge' as CommunityTab, icon: MessageSquare, label: t('knowledgeSharing.title'), description: t('knowledgeSharing.description') },
    { key: 'circles' as CommunityTab, icon: TrendingUp, label: t('learningCircles.title'), description: t('learningCircles.description') },
    { key: 'analytics' as CommunityTab, icon: TrendingUp, label: t('communityAnalytics.title'), description: t('communityAnalytics.description') },
  ];

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

      {/* Community Tabs */}
      <View style={styles.tabContainer}>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabScrollContent}
        >
          {tabs.map((tab) => {
            const IconComponent = tab.icon;
            const isActive = activeTab === tab.key;
            
            return (
              <TouchableOpacity
                key={tab.key}
                style={[
                  styles.tab,
                  isActive && styles.activeTab,
                  { borderColor: isActive ? currentTheme.colors.primary : 'transparent' }
                ]}
                onPress={() => setActiveTab(tab.key)}
              >
                <View style={[
                  styles.tabIcon,
                  { backgroundColor: isActive ? `${currentTheme.colors.primary}15` : `${currentTheme.colors.textMuted}10` }
                ]}>
                  <IconComponent 
                    size={20} 
                    color={isActive ? currentTheme.colors.primary : currentTheme.colors.textMuted} 
                  />
                </View>
                <Text style={[
                  styles.tabText,
                  isActive && styles.activeTabText,
                  { color: isActive ? currentTheme.colors.primary : currentTheme.colors.textMuted }
                ]}>
                  {tab.label}
                </Text>
                {isActive && (
                  <View style={[styles.tabIndicator, { backgroundColor: currentTheme.colors.primary }]} />
                )}
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Tab Content */}
      <View style={styles.contentContainer}>
        {renderTabContent()}
      </View>
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
  // Tab styles
  tabContainer: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  tabScrollContent: {
    paddingHorizontal: 20,
  },
  tab: {
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginRight: 8,
    borderRadius: 8,
    borderWidth: 1,
    minWidth: 80,
  },
  activeTab: {
    backgroundColor: colors.card,
  },
  tabIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  tabText: {
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
  },
  activeTabText: {
    fontWeight: '600',
  },
  tabIndicator: {
    position: 'absolute',
    bottom: -1,
    left: '50%',
    marginLeft: -4,
    width: 8,
    height: 2,
    borderRadius: 1,
  },
  contentContainer: {
    flex: 1,
  },
  comingSoonContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  comingSoonTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  comingSoonDescription: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
  },
  comingSoonText: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
});