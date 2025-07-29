import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, TextInput, Modal, RefreshControl, FlatList } from 'react-native';
import { useTheme } from '@/context/ThemeContext';
import { useLanguage } from '@/context/LanguageContext';
import { SocialSharingService, AnonymousPattern, SuccessStory, CommunitySupport, AccountabilityPartner, CelebrationShare } from '@/services/SocialSharingService';
import { Heart, MessageCircle, Share2, Users, Trophy, Lightbulb, HandHeart, Filter, Plus, Search, TrendingUp, Clock, Star, UserPlus, Bookmark } from 'lucide-react-native';

export default function SocialCommunityFeed({ isModal = false }: { isModal?: boolean }) {
  const { currentTheme } = useTheme();
  const { t } = useLanguage();
  const [feedData, setFeedData] = useState<{
    patterns: AnonymousPattern[];
    stories: SuccessStory[];
    support: CommunitySupport[];
    celebrations: CelebrationShare[];
  }>({ patterns: [], stories: [], support: [], celebrations: [] });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedTab, setSelectedTab] = useState<'feed' | 'trending' | 'stories' | 'support' | 'partners'>('feed');
  const [partners, setPartners] = useState<AccountabilityPartner[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [bookmarkedPosts, setBookmarkedPosts] = useState<string[]>([]);
  const [filters, setFilters] = useState({
    timeframe: 'week' as 'today' | 'week' | 'month' | 'all',
    sortBy: 'recent' as 'recent' | 'popular' | 'helpful',
    category: [] as string[]
  });

  const styles = createStyles(currentTheme.colors);

  useEffect(() => {
    loadCommunityData();
  }, [filters]);

  const loadCommunityData = async () => {
    try {
      setLoading(true);
      const data = await SocialSharingService.getCommunityFeed(filters);
      setFeedData(data);
      
      const partnerData = await SocialSharingService.findAccountabilityPartner({
        goals: ['mood_improvement', 'habit_building'],
        supportStyle: {
          encouragement: true,
          accountability: true,
          advice: true,
          celebration: true
        },
        availability: ['morning', 'evening'],
        experience: 'intermediate'
      });
      setPartners(partnerData);
    } catch (error) {
      console.error('Error loading community data:', error);
      Alert.alert('Error', 'Failed to load community data');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadCommunityData();
    setRefreshing(false);
  };

  const handleLike = async (type: string, id: string) => {
    Alert.alert('Success', 'Liked!');
  };

  const handleBookmark = (id: string) => {
    setBookmarkedPosts(prev => 
      prev.includes(id) 
        ? prev.filter(postId => postId !== id)
        : [...prev, id]
    );
  };

  const handleShare = async (item: any) => {
    Alert.alert('Share', 'Sharing functionality coming soon!');
  };

  const renderHeader = () => (
    <View style={styles.header}>
      <View style={styles.headerTop}>
        <Text style={styles.headerTitle}>Community</Text>
        <TouchableOpacity style={styles.notificationButton}>
          <View style={styles.notificationDot} />
        </TouchableOpacity>
      </View>
      <Text style={styles.headerSubtitle}>Connect, share, and grow together</Text>
    </View>
  );

  const renderTabBar = () => (
    <View style={styles.tabContainer}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabBar}>
        {[
          { key: 'feed', icon: Heart, label: 'Feed', count: 24 },
          { key: 'trending', icon: TrendingUp, label: 'Trending', count: 8 },
          { key: 'stories', icon: Trophy, label: 'Success', count: 12 },
          { key: 'support', icon: HandHeart, label: 'Support', count: 6 },
          { key: 'partners', icon: Users, label: 'Partners', count: 3 }
        ].map(({ key, icon: Icon, label, count }) => (
          <TouchableOpacity
            key={key}
            style={[styles.tab, selectedTab === key && styles.activeTab]}
            onPress={() => setSelectedTab(key as any)}
          >
            <View style={styles.tabContent}>
              <Icon size={18} color={selectedTab === key ? 'white' : currentTheme.colors.textSecondary} />
              <Text style={[styles.tabText, selectedTab === key && styles.activeTabText]}>
                {label}
              </Text>
              {count > 0 && (
                <View style={[styles.tabBadge, selectedTab === key && styles.activeTabBadge]}>
                  <Text style={[styles.tabBadgeText, selectedTab === key && styles.activeTabBadgeText]}>
                    {count}
                  </Text>
                </View>
              )}
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );

  const renderSearchAndFilters = () => (
    <View style={styles.searchContainer}>
      <View style={styles.searchBar}>
        <Search size={20} color={currentTheme.colors.textSecondary} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search posts, topics, or users..."
          placeholderTextColor={currentTheme.colors.textSecondary}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>
      <TouchableOpacity 
        style={[styles.filterButton, showFilters && styles.activeFilterButton]}
        onPress={() => setShowFilters(!showFilters)}
      >
        <Filter size={20} color={showFilters ? 'white' : currentTheme.colors.textSecondary} />
      </TouchableOpacity>
    </View>
  );

  const renderPostCard = (item: any, type: string) => (
    <View style={styles.postCard}>
      <View style={styles.postHeader}>
        <View style={styles.postAuthor}>
          <View style={styles.avatarPlaceholder}>
            <Text style={styles.avatarText}>{item.author?.[0] || 'A'}</Text>
          </View>
          <View style={styles.authorInfo}>
            <Text style={styles.authorName}>{item.author || 'Anonymous'}</Text>
            <View style={styles.postMeta}>
              <Clock size={12} color={currentTheme.colors.textSecondary} />
              <Text style={styles.timeAgo}>{item.timeAgo || '2h ago'}</Text>
              <View style={styles.categoryBadge}>
                <Text style={styles.categoryText}>{type}</Text>
              </View>
            </View>
          </View>
        </View>
        <TouchableOpacity 
          style={styles.bookmarkButton}
          onPress={() => handleBookmark(item.id)}
        >
          <Bookmark 
            size={20} 
            color={bookmarkedPosts.includes(item.id) ? currentTheme.colors.primary : currentTheme.colors.textSecondary}
            fill={bookmarkedPosts.includes(item.id) ? currentTheme.colors.primary : 'none'}
          />
        </TouchableOpacity>
      </View>

      <Text style={styles.postTitle}>{item.title || item.pattern || 'Untitled'}</Text>
      <Text style={styles.postContent}>{item.description || item.content || item.message}</Text>

      {item.tags && (
        <View style={styles.tags}>
          {item.tags.slice(0, 3).map((tag: string, index: number) => (
            <View key={index} style={styles.tag}>
              <Text style={styles.tagText}>#{tag}</Text>
            </View>
          ))}
        </View>
      )}

      <View style={styles.postActions}>
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => handleLike(type, item.id)}
        >
          <Heart size={18} color={currentTheme.colors.textSecondary} />
          <Text style={styles.actionText}>{item.likes || 12}</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.actionButton}>
          <MessageCircle size={18} color={currentTheme.colors.textSecondary} />
          <Text style={styles.actionText}>{item.comments || 5}</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => handleShare(item)}
        >
          <Share2 size={18} color={currentTheme.colors.textSecondary} />
          <Text style={styles.actionText}>Share</Text>
        </TouchableOpacity>

        <View style={styles.helpfulBadge}>
          <Star size={14} color={currentTheme.colors.accent} />
          <Text style={styles.helpfulText}>Helpful</Text>
        </View>
      </View>
    </View>
  );

  const renderContent = () => {
    let data: any[] = [];
    
    switch (selectedTab) {
      case 'feed':
        data = [...feedData.patterns, ...feedData.celebrations].slice(0, 10);
        break;
      case 'trending':
        data = [...feedData.stories, ...feedData.patterns].slice(0, 8);
        break;
      case 'stories':
        data = feedData.stories;
        break;
      case 'support':
        data = feedData.support;
        break;
      case 'partners':
        return renderPartners();
      default:
        data = [];
    }

    return (
      <FlatList
        data={data}
        keyExtractor={(item, index) => `${selectedTab}-${index}`}
        renderItem={({ item }) => renderPostCard(item, selectedTab)}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
      />
    );
  };

  const renderPartners = () => (
    <ScrollView 
      style={styles.partnersContainer}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      {partners.map((partner, index) => (
        <View key={index} style={styles.partnerCard}>
          <View style={styles.partnerHeader}>
            <View style={styles.partnerAvatar}>
              <Users size={24} color={currentTheme.colors.primary} />
            </View>
            <View style={styles.partnerInfo}>
              // Fix the partner type display (line 272)
              <Text style={styles.partnerType}>{partner.connectionType.replace('_', ' ')}</Text>
              
              // Fix the sharedGoals mapping (lines 285-287)
              {partner.sharedGoals?.habitIds?.map((habitId: string, idx: number) => (
                <Text key={idx} style={styles.goalText}>• Habit: {habitId}</Text>
              ))}
              {partner.sharedGoals?.moodTargets?.map((target: string, idx: number) => (
                <Text key={`mood-${idx}`} style={styles.goalText}>• Mood Target: {target}</Text>
              ))}
              
              <View style={styles.matchContainer}>
                <Star size={16} color={currentTheme.colors.accent} />
                <Text style={styles.matchScore}>{partner.matchScore}% match</Text>
              </View>
            </View>
            <TouchableOpacity style={styles.connectButton}>
              <UserPlus size={20} color='white' />
            </TouchableOpacity>
          </View>
          
          <View style={styles.sharedGoals}>
            <Text style={styles.goalsTitle}>Shared Goals</Text>
            // Replace line 295 and the following lines with:
            {(() => {
              const allGoals = [
                ...(partner.sharedGoals?.habitIds?.map((id: string) => `Habit: ${id}`) || []),
                ...(partner.sharedGoals?.moodTargets?.map((target: string) => `Mood Target: ${target}`) || [])
              ];
              return allGoals.map((goal: string, idx: number) => (
                <Text key={idx} style={styles.goalText}>• {goal}</Text>
              ));
            })()}
          </View>
          
          <View style={styles.supportStyles}>
            {Object.entries(partner.supportStyle || {}).map(([key, value]) => 
              value && (
                <View key={key} style={styles.supportStyleTag}>
                  <Text style={styles.supportStyleText}>{key}</Text>
                </View>
              )
            )}
          </View>
        </View>
      ))}
    </ScrollView>
  );

  // Render coming soon message
  const renderComingSoon = () => (
    <View style={styles.comingSoonContainer}>
      <View style={styles.comingSoonIcon}>
        <Users size={48} color={currentTheme.colors.primary} />
      </View>
      <Text style={styles.comingSoonTitle}>Community Feed</Text>
      <Text style={styles.comingSoonSubtitle}>Coming Soon!</Text>
      <Text style={styles.comingSoonDescription}>
        We're working hard to bring you an amazing community experience. 
        Stay tuned for the next update!
      </Text>
      <View style={styles.comingSoonFeatures}>
        <View style={styles.featureItem}>
          <Heart size={16} color={currentTheme.colors.accent} />
          <Text style={styles.featureText}>Share your progress</Text>
        </View>
        <View style={styles.featureItem}>
          <MessageCircle size={16} color={currentTheme.colors.accent} />
          <Text style={styles.featureText}>Connect with others</Text>
        </View>
        <View style={styles.featureItem}>
          <Trophy size={16} color={currentTheme.colors.accent} />
          <Text style={styles.featureText}>Celebrate achievements</Text>
        </View>
      </View>
    </View>
  );

  return (
    <View style={[styles.container, isModal && styles.modalContainer]}>
      {renderComingSoon()}
    </View>
  );
}

const createStyles = (colors: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  modalContainer: {
    flex: 0,
    height: 500,
    backgroundColor: colors.background,
  },
  header: {
    backgroundColor: colors.card,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.text,
  },
  headerSubtitle: {
    fontSize: 16,
    color: colors.textSecondary,
  },
  notificationButton: {
    position: 'relative',
    padding: 8,
  },
  notificationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.accent,
  },
  tabContainer: {
    backgroundColor: colors.card,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  tabBar: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  tab: {
    marginRight: 12,
    borderRadius: 24,
    backgroundColor: colors.surface,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  activeTab: {
    backgroundColor: colors.primary,
  },
  tabContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  activeTabText: {
    color: 'white',
  },
  tabBadge: {
    backgroundColor: colors.accent,
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    minWidth: 20,
    alignItems: 'center',
  },
  activeTabBadge: {
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  tabBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: 'white',
  },
  activeTabBadgeText: {
    color: 'white',
  },
  searchContainer: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
    backgroundColor: colors.background,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 12,
    paddingHorizontal: 16,
    gap: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: colors.text,
    paddingVertical: 14,
  },
  filterButton: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeFilterButton: {
    backgroundColor: colors.primary,
  },
  content: {
    flex: 1,
  },
  listContent: {
    padding: 16,
    paddingBottom: 100,
  },
  postCard: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  postHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  postAuthor: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '700',
  },
  authorInfo: {
    flex: 1,
  },
  authorName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  postMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  timeAgo: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  categoryBadge: {
    backgroundColor: colors.primary + '20',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  categoryText: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.primary,
    textTransform: 'uppercase',
  },
  bookmarkButton: {
    padding: 4,
  },
  postTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 12,
    lineHeight: 24,
  },
  postContent: {
    fontSize: 15,
    color: colors.textSecondary,
    lineHeight: 22,
    marginBottom: 16,
  },
  tags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  tag: {
    backgroundColor: colors.surface,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  tagText: {
    fontSize: 12,
    color: colors.primary,
    fontWeight: '500',
  },
  postActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  actionText: {
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  helpfulBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginLeft: 'auto',
    backgroundColor: colors.accent + '20',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  helpfulText: {
    fontSize: 12,
    color: colors.accent,
    fontWeight: '600',
  },
  partnersContainer: {
    padding: 16,
  },
  partnerCard: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: colors.primary + '30',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  partnerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  partnerAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: colors.primary + '20',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  partnerInfo: {
    flex: 1,
  },
  partnerType: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 4,
  },
  matchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  matchScore: {
    fontSize: 14,
    color: colors.accent,
    fontWeight: '600',
  },
  connectButton: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sharedGoals: {
    marginBottom: 16,
  },
  goalsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  goalText: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  supportStyles: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  supportStyleTag: {
    backgroundColor: colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  supportStyleText: {
    fontSize: 12,
    color: 'white',
    fontWeight: '600',
  },
  fab: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  comingSoonContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  comingSoonIcon: {
    marginBottom: 24,
  },
  comingSoonTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
    textAlign: 'center',
    marginBottom: 8,
  },
  comingSoonSubtitle: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
  },
  comingSoonDescription: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 32,
  },
  featuresList: {
    alignItems: 'center',
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    paddingHorizontal: 16,
  },
  featureText: {
    fontSize: 14,
    color: colors.text,
    marginLeft: 12,
    fontWeight: '500',
  },
  comingSoonFeatures: {
    alignItems: 'center',
    marginTop: 16,
  },
});