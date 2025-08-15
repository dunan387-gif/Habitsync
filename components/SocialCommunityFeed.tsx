import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, FlatList, StyleSheet, Alert, TextInput, Modal, ActivityIndicator, RefreshControl } from 'react-native';
import { useTheme } from '@/context/ThemeContext';
import { useLanguage } from '@/context/LanguageContext';
import { useHabits } from '@/context/HabitContext';
import SupabaseCommunityService, { CommunityPost, CommunityFilters } from '@/services/SupabaseCommunityService';
import { FirebaseService } from '@/services/FirebaseService';
import { Heart, MessageCircle, Share2, Plus, Send } from 'lucide-react-native';

export default function SocialCommunityFeed() {
  const { currentTheme } = useTheme();
  const { t } = useLanguage();
  const { habits } = useHabits();
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showCreatePost, setShowCreatePost] = useState(false);
  const [newPostText, setNewPostText] = useState('');
  const [selectedPostType, setSelectedPostType] = useState<string>('motivation');
  const [filters, setFilters] = useState<CommunityFilters>({
    sortBy: 'latest'
  });

  const styles = createStyles(currentTheme.colors);

  useEffect(() => {
    loadPosts();
  }, [filters]);

  const loadPosts = async () => {
    try {
      setLoading(true);
      const data = await SupabaseCommunityService.getPosts(filters);
      setPosts(data);
    } catch (error) {
      console.error('Failed to load posts:', error);
      Alert.alert(t('community.error'), t('community.loadFailed'));
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadPosts();
    setRefreshing(false);
  };

  const handleLike = async (postId: string) => {
    try {
      const user = await FirebaseService.getCurrentUser();
      if (!user) {
        Alert.alert(t('community.error'), t('community.loginRequired'));
        return;
      }

      await SupabaseCommunityService.likePost(postId, user.id);
      Alert.alert(t('community.success'), t('community.liked'));
      // Refresh posts to show updated likes
      loadPosts();
    } catch (error) {
      console.error('Error toggling like:', error);
      Alert.alert(t('community.error'), t('community.failedToUpdateLike'));
    }
  };

  const handleCreatePost = async () => {
    if (newPostText.trim()) {
      try {
        const user = await FirebaseService.getCurrentUser();
        if (!user) {
          Alert.alert(t('community.error'), t('community.loginRequired'));
          return;
        }

        const postData = {
          userId: user.id,
          userName: user.name || user.email?.split('@')[0] || 'User',
          userAvatar: user.avatar,
          content: newPostText,
          type: selectedPostType as 'achievement' | 'milestone' | 'tip' | 'question' | 'motivation',
          tags: [selectedPostType, 'community']
        };

        const newPost = await SupabaseCommunityService.createPost(postData);
        
        if (newPost) {
          Alert.alert(t('community.success'), t('community.postCreated'));
          setNewPostText('');
          setSelectedPostType('motivation');
          setShowCreatePost(false);
          loadPosts(); // Refresh feed
        } else {
          Alert.alert(t('community.error'), t('community.failedToCreatePost'));
        }
      } catch (error) {
        console.error('Error creating post:', error);
        Alert.alert(t('community.error'), t('community.failedToCreatePost'));
      }
    }
  };

  const renderPost = ({ item }: { item: CommunityPost }) => (
    <View style={styles.postContainer}>
      <View style={styles.postHeader}>
        <Text style={styles.userName}>{item.userName}</Text>
        <Text style={styles.postTime}>
          {new Date(item.createdAt).toLocaleDateString()}
        </Text>
      </View>
      
      <Text style={styles.postContent}>{item.content}</Text>
      
      <View style={styles.postFooter}>
        <TouchableOpacity 
          style={styles.actionButton} 
          onPress={() => handleLike(item.id)}
        >
          <Heart size={16} color={currentTheme.colors.text} />
          <Text style={styles.actionText}>{item.likes}</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.actionButton}>
          <MessageCircle size={16} color={currentTheme.colors.text} />
          <Text style={styles.actionText}>{item.comments}</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.actionButton}>
          <Share2 size={16} color={currentTheme.colors.text} />
        </TouchableOpacity>
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={currentTheme.colors.primary} />
        <Text style={styles.loadingText}>{t('community.loading')}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{t('community.title')}</Text>
        <TouchableOpacity 
          style={styles.createButton}
          onPress={() => setShowCreatePost(true)}
        >
          <Plus size={20} color={currentTheme.colors.background} />
        </TouchableOpacity>
      </View>

      <FlatList
        data={posts}
        renderItem={renderPost}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[currentTheme.colors.primary]}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>{t('community.noPosts')}</Text>
          </View>
        }
      />

      <Modal
        visible={showCreatePost}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowCreatePost(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{t('community.createPost')}</Text>
            
            <TextInput
              style={styles.postInput}
              placeholder={t('community.postPlaceholder')}
              value={newPostText}
              onChangeText={setNewPostText}
              multiline
              numberOfLines={4}
              placeholderTextColor={currentTheme.colors.textSecondary}
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={styles.cancelButton}
                onPress={() => setShowCreatePost(false)}
              >
                <Text style={styles.cancelButtonText}>{t('common.cancel')}</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.sendButton}
                onPress={handleCreatePost}
              >
                <Send size={16} color={currentTheme.colors.background} />
                <Text style={styles.sendButtonText}>{t('common.send')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const createStyles = (colors: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
  },
  createButton: {
    backgroundColor: colors.primary,
    padding: 8,
    borderRadius: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: colors.textSecondary,
  },
  postContainer: {
    backgroundColor: colors.surface,
    margin: 8,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  postHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  userName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text,
  },
  postTime: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  postContent: {
    fontSize: 14,
    color: colors.text,
    lineHeight: 20,
    marginBottom: 12,
  },
  postFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
  },
  actionText: {
    marginLeft: 4,
    fontSize: 14,
    color: colors.textSecondary,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyText: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
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
    padding: 24,
    width: '90%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 16,
  },
  postInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: colors.text,
    backgroundColor: colors.background,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  cancelButton: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    flex: 1,
    marginRight: 8,
  },
  cancelButtonText: {
    textAlign: 'center',
    fontSize: 14,
    color: colors.text,
  },
  sendButton: {
    backgroundColor: colors.primary,
    padding: 12,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    marginLeft: 8,
  },
  sendButtonText: {
    color: colors.background,
    fontSize: 14,
    fontWeight: 'bold',
    marginLeft: 4,
  },
});