import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, TextInput, Modal, RefreshControl, FlatList } from 'react-native';
import { useTheme } from '@/context/ThemeContext';
import { useLanguage } from '@/context/LanguageContext';
import { useHabits } from '@/context/HabitContext';
import { FirebaseCommunityService, CommunityPost, CommunityFilters } from '@/services/FirebaseCommunityService';
import { auth } from '@/lib/firebase';
import { Heart, MessageCircle, Share2, Users, Trophy, Lightbulb, HandHeart, Filter, Plus, Search, TrendingUp, Clock, Star, UserPlus, Bookmark, Send, Camera, Image } from 'lucide-react-native';



export default function SocialCommunityFeed({ isModal = false }: { isModal?: boolean }) {
  const { currentTheme } = useTheme();
  const { t } = useLanguage();
  const { habits } = useHabits();
  
  const [feedData, setFeedData] = useState<{
    patterns: any[];
    stories: any[];
    support: any[];
    celebrations: any[];
  }>({ patterns: [], stories: [], support: [], celebrations: [] });
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedTab, setSelectedTab] = useState<'feed' | 'trending' | 'stories' | 'support' | 'partners'>('feed');
  const [partners, setPartners] = useState<any[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [bookmarkedPosts, setBookmarkedPosts] = useState<string[]>([]);
  const [showCreatePost, setShowCreatePost] = useState(false);
  const [newPostText, setNewPostText] = useState('');
  const [selectedPostType, setSelectedPostType] = useState<string>('habit');
  const [filters, setFilters] = useState<CommunityFilters>({
    timeframe: 'week',
    sortBy: 'recent'
  });

  const styles = createStyles(currentTheme.colors);

  // Post type options for tag selection
  const postTypeOptions = [
    { id: 'habit', label: t('community.habit'), emoji: '🎯' },
    { id: 'moodTarget', label: t('community.moodTarget'), emoji: '😊' },
    { id: 'match', label: t('community.match'), emoji: '🤝' },
    { id: 'sharedGoals', label: t('community.sharedGoals'), emoji: '🎯' },
    { id: 'encouragementSupport', label: 'Encouragement Support', emoji: '💪' }
  ];

  useEffect(() => {
    loadCommunityData();
  }, [filters]);

  const loadCommunityData = async () => {
    try {
      setLoading(true);
      const data = await FirebaseCommunityService.getFeed(filters);
      console.log('Loaded community data:', data);
      setFeedData(data);
      
      // Load bookmarked posts
      const bookmarked = await FirebaseCommunityService.getBookmarkedPosts();
      setBookmarkedPosts(bookmarked.map(post => post.id));
    } catch (error) {
      console.error('Failed to load community data:', error);
      Alert.alert(t('community.error'), t('community.loadFailed'));
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
    try {
      const result = await FirebaseCommunityService.toggleLike(id);
      if (result.liked) {
        Alert.alert(t('community.success'), t('community.liked'));
      }
      // Refresh data to show updated likes
      loadCommunityData();
    } catch (error) {
      console.error('Error toggling like:', error);
      Alert.alert(t('community.error'), t('community.failedToUpdateLike'));
    }
  };

  const handleBookmark = async (id: string) => {
    try {
      const result = await FirebaseCommunityService.toggleBookmark(id);
      setBookmarkedPosts(prev => 
        result.bookmarked 
          ? [...prev, id]
          : prev.filter(postId => postId !== id)
      );
    } catch (error) {
      console.error('Error toggling bookmark:', error);
      Alert.alert(t('community.error'), t('community.failedToUpdateBookmark'));
    }
  };

  const handleShare = async (item: any) => {
    Alert.alert(t('community.share'), t('community.sharingComingSoon'));
  };

  const handleCreatePost = async () => {
    if (newPostText.trim()) {
      try {
        const postData = {
          type: selectedPostType === 'encouragementSupport' ? 'encouragement' : selectedPostType,
          content: newPostText,
          targetAudience: {
            moodStates: ['motivated', 'struggling'],
            challenges: ['habit_building', 'mood_management'],
            goals: ['consistency', 'improvement']
          },
          supportLevel: 'peer',
          tags: [selectedPostType, 'community']
        };

        await FirebaseCommunityService.createPost('support', postData);
        
        Alert.alert(t('community.success'), t('community.postCreated'));
        setNewPostText('');
        setSelectedPostType('habit');
        setShowCreatePost(false);
        loadCommunityData(); // Refresh feed
      } catch (error) {
        console.error('Error creating post:', error);
        Alert.alert(t('community.error'), t('community.failedToCreatePost'));
      }
    }
  };

  const handleSearch = async () => {
    if (searchQuery.trim()) {
      try {
        const searchResults = await FirebaseCommunityService.searchPosts(searchQuery, filters);
        // Transform search results to match feed data format
        const transformedResults = {
          patterns: searchResults.filter(post => post.type === 'pattern'),
          stories: searchResults.filter(post => post.type === 'story'),
          support: searchResults.filter(post => post.type === 'support'),
          celebrations: searchResults.filter(post => post.type === 'celebration')
        };
        setFeedData(transformedResults);
      } catch (error) {
        console.error('Error searching posts:', error);
        Alert.alert(t('community.error'), t('community.searchFailed'));
      }
    } else {
      loadCommunityData(); // Reset to full feed
    }
  };

  const renderHeader = () => (
    <View style={styles.header}>
      <View style={styles.headerTop}>
        <Text style={styles.headerTitle}>{t('community.title')}</Text>
        <View style={styles.betaBadge}>
          <Text style={styles.betaText}>{t('community.beta.badge')}</Text>
        </View>
      </View>
      <Text style={styles.headerSubtitle}>{t('community.subtitle')}</Text>
    </View>
  );

  const renderTabBar = () => (
    <View style={styles.tabBar}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <TouchableOpacity
          style={[styles.tab, selectedTab === 'feed' && styles.activeTab]}
          onPress={() => setSelectedTab('feed')}
        >
          <Text style={[styles.tabText, selectedTab === 'feed' && styles.activeTabText]}>
            {t('community.tabs.feed')}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, selectedTab === 'trending' && styles.activeTab]}
          onPress={() => setSelectedTab('trending')}
        >
          <Text style={[styles.tabText, selectedTab === 'trending' && styles.activeTabText]}>
            {t('community.tabs.trending')}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, selectedTab === 'stories' && styles.activeTab]}
          onPress={() => setSelectedTab('stories')}
        >
          <Text style={[styles.tabText, selectedTab === 'stories' && styles.activeTabText]}>
            {t('community.tabs.stories')}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, selectedTab === 'support' && styles.activeTab]}
          onPress={() => setSelectedTab('support')}
        >
          <Text style={[styles.tabText, selectedTab === 'support' && styles.activeTabText]}>
            {t('community.tabs.support')}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, selectedTab === 'partners' && styles.activeTab]}
          onPress={() => setSelectedTab('partners')}
        >
          <Text style={[styles.tabText, selectedTab === 'partners' && styles.activeTabText]}>
            {t('community.tabs.partners')}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );

  const renderSearchAndFilters = () => (
    <View style={styles.searchContainer}>
      <View style={styles.searchBar}>
        <Search size={20} color={currentTheme.colors.text} />
        <TextInput
          style={styles.searchInput}
          placeholder={t('community.searchPlaceholder')}
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholderTextColor={currentTheme.colors.text + '80'}
        />
        <TouchableOpacity onPress={handleSearch}>
          <Text style={styles.searchButton}>{t('community.search')}</Text>
        </TouchableOpacity>
      </View>
      <TouchableOpacity
        style={styles.filterButton}
        onPress={() => setShowFilters(!showFilters)}
      >
        <Filter size={20} color={currentTheme.colors.primary} />
        <Text style={styles.filterButtonText}>{t('community.filters')}</Text>
      </TouchableOpacity>
    </View>
  );

  const renderCreatePostButton = () => (
    <TouchableOpacity
      style={styles.createPostButton}
      onPress={() => setShowCreatePost(true)}
    >
             <Plus size={24} color="#FFFFFF" />
      <Text style={styles.createPostButtonText}>{t('community.createPost')}</Text>
    </TouchableOpacity>
  );

  const renderCreatePostModal = () => (
    <Modal
      visible={showCreatePost}
      animationType="slide"
      transparent={true}
      onRequestClose={() => setShowCreatePost(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>{t('community.createPost')}</Text>
          
          {/* Post Type Selection */}
          <View style={styles.tagSelectionContainer}>
            <Text style={styles.tagSelectionTitle}>Select Post Type:</Text>
            <View style={styles.tagSelectionGrid}>
              {postTypeOptions.map((option) => (
                <TouchableOpacity
                  key={option.id}
                  style={[
                    styles.tagOption,
                    selectedPostType === option.id && styles.tagOptionSelected
                  ]}
                  onPress={() => setSelectedPostType(option.id)}
                >
                  <Text style={styles.tagOptionEmoji}>{option.emoji}</Text>
                  <Text style={[
                    styles.tagOptionText,
                    selectedPostType === option.id && styles.tagOptionTextSelected
                  ]}>
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <TextInput
            style={styles.postInput}
            placeholder={t('community.postPlaceholder')}
            value={newPostText}
            onChangeText={setNewPostText}
            multiline
            numberOfLines={4}
            placeholderTextColor={currentTheme.colors.text + '80'}
          />
          <View style={styles.modalButtons}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => {
                setShowCreatePost(false);
                setNewPostText('');
                setSelectedPostType('habit');
              }}
            >
              <Text style={styles.cancelButtonText}>{t('common.cancel')}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.postButton}
              onPress={handleCreatePost}
            >
              <Text style={styles.postButtonText}>{t('community.post')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  const renderPostCard = (item: CommunityPost, type: string) => (
    <View style={styles.postCard}>
      <View style={styles.postHeader}>
        <View style={styles.postAuthor}>
          <View style={styles.avatar} />
          <View>
            <Text style={styles.authorName}>{item.userName || t('community.anonymousUser')}</Text>
            <Text style={styles.postTime}>
              {item.created_at ? new Date(item.created_at.toDate()).toLocaleDateString() : t('community.justNow')}
            </Text>
          </View>
        </View>
        <TouchableOpacity onPress={() => handleBookmark(item.id)}>
          <Bookmark size={20} color={bookmarkedPosts.includes(item.id) ? currentTheme.colors.primary : currentTheme.colors.text} />
        </TouchableOpacity>
      </View>
      
      <View style={styles.postContent}>
        {type === 'pattern' && (
          <>
            <Text style={styles.postTitle}>{item.content?.anonymizedData?.pattern || t('community.patternDiscovery')}</Text>
            <Text style={styles.postDescription}>
              {t('community.effectiveness')}: {item.content?.anonymizedData?.effectiveness}/10 • {t('community.duration')}: {item.content?.anonymizedData?.duration}
            </Text>
          </>
        )}
        
        {type === 'story' && (
          <>
            <Text style={styles.postTitle}>{item.content?.title}</Text>
            <Text style={styles.postDescription}>{item.content?.story}</Text>
            <Text style={styles.postCategory}>{item.content?.category}</Text>
          </>
        )}
        
        {type === 'support' && (
          <>
            <Text style={styles.postTitle}>{item.content?.type} {t('community.support')}</Text>
            <Text style={styles.postDescription}>{item.content?.content}</Text>
            <Text style={styles.postCategory}>{item.content?.supportLevel}</Text>
          </>
        )}
        
        {type === 'celebration' && (
          <>
            <Text style={styles.postTitle}>{item.content?.achievement?.title}</Text>
            <Text style={styles.postDescription}>{item.content?.achievement?.description}</Text>
            <Text style={styles.postCategory}>{item.content?.celebrationStyle}</Text>
          </>
        )}
      </View>
      
      <View style={styles.postActions}>
        <TouchableOpacity style={styles.actionButton} onPress={() => handleLike(type, item.id)}>
          <Heart size={16} color={item.likes?.includes(auth.currentUser?.uid || '') ? currentTheme.colors.primary : currentTheme.colors.text} />
          <Text style={styles.actionText}>{item.likes?.length || 0}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton}>
          <MessageCircle size={16} color={currentTheme.colors.text} />
          <Text style={styles.actionText}>{item.comments_count || 0}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton} onPress={() => handleShare(item)}>
          <Share2 size={16} color={currentTheme.colors.text} />
          <Text style={styles.actionText}>{t('community.share')}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderContent = () => {
    if (loading) {
      return (
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>{t('common.loading')}</Text>
        </View>
      );
    }

    let currentData: CommunityPost[] = [];

    if (selectedTab === 'feed') {
      // Show all posts combined for the feed tab
      currentData = [
        ...feedData.patterns,
        ...feedData.stories,
        ...feedData.support,
        ...feedData.celebrations
      ].sort((a, b) => {
        // Sort by creation date, newest first
        const dateA = a.created_at?.toDate?.() || new Date(a.created_at);
        const dateB = b.created_at?.toDate?.() || new Date(b.created_at);
        return dateB.getTime() - dateA.getTime();
      });
    } else {
      // Show only posts from the selected tab
      currentData = feedData[selectedTab as keyof typeof feedData] || [];
    }

    if (currentData.length === 0) {
      return (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>{t('community.noPostsYet')}</Text>
          <Text style={styles.emptySubtext}>{t('community.beFirstToPost')}</Text>
        </View>
      );
    }

    return (
      <FlatList
        data={currentData}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => renderPostCard(item, item.type)}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[currentTheme.colors.primary]}
          />
        }
        showsVerticalScrollIndicator={false}
      />
    );
  };

  const renderPartners = () => (
    <View style={styles.partnersContainer}>
      <Text style={styles.sectionTitle}>{t('community.accountabilityPartners')}</Text>
      <Text style={styles.sectionSubtitle}>{t('community.findPartners')}</Text>
      <TouchableOpacity style={styles.findPartnersButton}>
                 <UserPlus size={20} color="#FFFFFF" />
        <Text style={styles.findPartnersButtonText}>{t('community.findPartners')}</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      {renderHeader()}
      {renderTabBar()}
      {renderSearchAndFilters()}
      {renderCreatePostButton()}
      {selectedTab === 'partners' ? renderPartners() : renderContent()}
      {renderCreatePostModal()}
    </View>
  );
}

const createStyles = (colors: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    padding: 20,
    paddingTop: 40,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.text,
    flex: 1,
  },
  headerSubtitle: {
    fontSize: 16,
    color: colors.text + 'CC',
  },
  betaBadge: {
    backgroundColor: colors.primary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 12,
  },
  betaText: {
    color: colors.background,
    fontSize: 10,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  tabBar: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingHorizontal: 20,
  },
  tab: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    marginRight: 10,
    borderRadius: 20,
  },
  activeTab: {
    backgroundColor: colors.primary + '20',
  },
  tabText: {
    fontSize: 14,
    color: colors.text + 'CC',
    fontWeight: '500',
  },
  activeTabText: {
    color: colors.primary,
    fontWeight: '600',
  },
  searchContainer: {
    flexDirection: 'row',
    padding: 20,
    alignItems: 'center',
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 25,
    paddingHorizontal: 15,
    paddingVertical: 10,
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    marginLeft: 10,
    color: colors.text,
    fontSize: 16,
  },
  searchButton: {
    color: colors.primary,
    fontWeight: '600',
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 10,
    backgroundColor: colors.surface,
    borderRadius: 20,
  },
  filterButtonText: {
    marginLeft: 5,
    color: colors.primary,
    fontWeight: '600',
  },
  createPostButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    marginHorizontal: 20,
    marginBottom: 20,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 25,
    alignSelf: 'flex-start',
  },
     createPostButtonText: {
     color: '#FFFFFF',
     fontWeight: '600',
     marginLeft: 8,
   },
  postCard: {
    backgroundColor: colors.surface,
    marginHorizontal: 20,
    marginBottom: 15,
    padding: 15,
    borderRadius: 12,
  },
  postHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  postAuthor: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary + '30',
    marginRight: 10,
  },
  authorName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  postTime: {
    fontSize: 12,
    color: colors.text + '80',
  },
     postContent: {
     marginBottom: 15,
   },
   postTitle: {
     fontSize: 18,
     fontWeight: '700',
     color: colors.text,
     marginBottom: 8,
   },
   postDescription: {
     fontSize: 14,
     color: colors.text + 'CC',
     marginBottom: 8,
   },
   postCategory: {
     fontSize: 14,
     color: colors.primary,
     fontWeight: '600',
     marginTop: 4,
   },
  postActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 10,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 5,
  },
  actionText: {
    marginLeft: 5,
    color: colors.text,
    fontSize: 14,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: colors.text,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    textAlign: 'center',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: colors.text + 'CC',
    textAlign: 'center',
  },
  partnersContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
    textAlign: 'center',
    marginBottom: 8,
  },
  sectionSubtitle: {
    fontSize: 16,
    color: colors.text + 'CC',
    textAlign: 'center',
    marginBottom: 30,
  },
  findPartnersButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 25,
  },
     findPartnersButtonText: {
     color: '#FFFFFF',
     fontWeight: '600',
     marginLeft: 8,
   },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 20,
    width: '90%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 15,
    textAlign: 'center',
  },
  postInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: 15,
    color: colors.text,
    fontSize: 16,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    marginRight: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cancelButtonText: {
    textAlign: 'center',
    color: colors.text,
    fontWeight: '600',
  },
  postButton: {
    flex: 1,
    backgroundColor: colors.primary,
    paddingVertical: 12,
    marginLeft: 10,
    borderRadius: 8,
  },
     postButtonText: {
     textAlign: 'center',
     color: '#FFFFFF',
     fontWeight: '600',
   },
  // Tag selection styles
  tagSelectionContainer: {
    marginBottom: 20,
  },
  tagSelectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 10,
  },
  tagSelectionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tagOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 8,
  },
  tagOptionSelected: {
    backgroundColor: colors.primary + '20',
    borderColor: colors.primary,
  },
  tagOptionEmoji: {
    fontSize: 16,
    marginRight: 6,
  },
  tagOptionText: {
    fontSize: 14,
    color: colors.text,
    fontWeight: '500',
  },
  tagOptionTextSelected: {
    color: colors.primary,
    fontWeight: '600',
  },
});