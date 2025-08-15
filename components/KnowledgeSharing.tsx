import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Modal, TextInput, ScrollView, Alert } from 'react-native';
import { useTheme } from '@/context/ThemeContext';
import { useLanguage } from '@/context/LanguageContext';
import { useAuth } from '@/context/AuthContext';
import { useGamification } from '@/context/GamificationContext';
import CommunityService from '@/services/CommunityService';
import { KnowledgeShare } from '@/types';
import { 
  BookOpen, 
  Heart, 
  Share2, 
  MessageSquare, 
  Plus, 
  X, 
  Search,
  Filter,
  TrendingUp,
  Eye,
  Clock,
  User,
  Tag,
  Star
} from 'lucide-react-native';

export default function KnowledgeSharing() {
  const { currentTheme } = useTheme();
  const { t } = useLanguage();
  const { user } = useAuth();
  const { addXP } = useGamification();
  
  const [knowledgeShares, setKnowledgeShares] = useState<KnowledgeShare[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedType, setSelectedType] = useState<string>('all');
  
  // Form state for creating knowledge share
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState<'habits' | 'wellness' | 'productivity' | 'learning' | 'motivation'>('habits');
  const [type, setType] = useState<'article' | 'tip' | 'experience' | 'tutorial'>('article');
  const [tags, setTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState('');

  useEffect(() => {
    loadKnowledgeShares();
  }, []);

  const loadKnowledgeShares = async () => {
    try {
      const userId = user?.id || 'anonymous';
      CommunityService.getInstance().setUserId(userId);
      
      const shares = await CommunityService.getInstance().getKnowledgeShares();
      setKnowledgeShares(shares);
    } catch (error) {
      console.error('Error loading knowledge shares:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateKnowledgeShare = async () => {
    if (!title.trim() || !content.trim()) {
      Alert.alert(t('common.error'), t('knowledgeSharing.fillAllFields'));
      return;
    }

    try {
      const newShare = await CommunityService.getInstance().createKnowledgeShare({
        authorId: user?.id || 'anonymous',
        title: title.trim(),
        content: content.trim(),
        type,
        category,
        tags: tags.length > 0 ? tags : [category],
        isPublic: true
      });

      setKnowledgeShares(prev => [newShare, ...prev]);
      setShowCreateModal(false);
      resetCreateForm();
      
      // Add XP for creating knowledge share
      addXP(150, 'knowledge_share_creation');
      
      Alert.alert(t('common.success'), t('knowledgeSharing.shareCreatedSuccessfully'));
    } catch (error) {
      console.error('Error creating knowledge share:', error);
      Alert.alert(t('common.error'), t('knowledgeSharing.creationFailed'));
    }
  };

  const handleLikeKnowledgeShare = async (shareId: string) => {
    try {
      await CommunityService.getInstance().likeKnowledgeShare(shareId);
      
      // Update local state
      setKnowledgeShares(prev => prev.map(share => 
        share.id === shareId ? { ...share, likes: share.likes + 1 } : share
      ));
      
      // Add XP for liking
      addXP(10, 'knowledge_share_like');
    } catch (error) {
      console.error('Error liking knowledge share:', error);
    }
  };

  const handleAddTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      setTags([...tags, newTag.trim()]);
      setNewTag('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const resetCreateForm = () => {
    setTitle('');
    setContent('');
    setCategory('habits');
    setType('article');
    setTags([]);
    setNewTag('');
  };

  const getFilteredShares = () => {
    let filtered = knowledgeShares;

    // Filter by search query
    if (searchQuery.trim()) {
      filtered = filtered.filter(share => 
        share.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        share.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
        share.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }

    // Filter by category
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(share => share.category === selectedCategory);
    }

    // Filter by type
    if (selectedType !== 'all') {
      filtered = filtered.filter(share => share.type === selectedType);
    }

    return filtered;
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'habits': return currentTheme.colors.primary;
      case 'wellness': return currentTheme.colors.success;
      case 'productivity': return currentTheme.colors.warning;
      case 'learning': return currentTheme.colors.accent;
      case 'motivation': return currentTheme.colors.error;
      default: return currentTheme.colors.textMuted;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'article': return <BookOpen size={16} color={currentTheme.colors.textMuted} />;
      case 'tip': return <Star size={16} color={currentTheme.colors.textMuted} />;
      case 'experience': return <User size={16} color={currentTheme.colors.textMuted} />;
      case 'tutorial': return <TrendingUp size={16} color={currentTheme.colors.textMuted} />;
      default: return <BookOpen size={16} color={currentTheme.colors.textMuted} />;
    }
  };

  const renderKnowledgeShareCard = ({ item }: { item: KnowledgeShare }) => {
    const isLiked = false; // TODO: Implement liked state tracking
    const isAuthor = item.authorId === user?.id;

    return (
      <View style={[styles.shareCard, { backgroundColor: currentTheme.colors.card }]}>
        <View style={styles.shareHeader}>
          <View style={styles.shareInfo}>
            <View style={styles.typeIcon}>
              {getTypeIcon(item.type)}
            </View>
            <View style={styles.shareDetails}>
              <Text style={[styles.shareTitle, { color: currentTheme.colors.text }]}>
                {item.title}
              </Text>
              <View style={styles.shareMeta}>
                <Text style={[styles.shareAuthor, { color: currentTheme.colors.textSecondary }]}>
                  {isAuthor ? t('knowledgeSharing.you') : `User ${item.authorId.slice(-4)}`}
                </Text>
                <Text style={[styles.shareDate, { color: currentTheme.colors.textMuted }]}>
                  {new Date(item.createdAt).toLocaleDateString()}
                </Text>
              </View>
            </View>
          </View>
          <View style={[styles.categoryBadge, { backgroundColor: `${getCategoryColor(item.category)}15` }]}>
            <Text style={[styles.categoryText, { color: getCategoryColor(item.category) }]}>
              {t(`knowledgeSharing.categories.${item.category}`)}
            </Text>
          </View>
        </View>

        <Text style={[styles.shareContent, { color: currentTheme.colors.textSecondary }]} numberOfLines={3}>
          {item.content}
        </Text>

        {item.tags.length > 0 && (
          <View style={styles.tagsContainer}>
            {item.tags.slice(0, 3).map((tag, index) => (
              <View key={index} style={[styles.tag, { backgroundColor: `${currentTheme.colors.primary}15` }]}>
                <Tag size={12} color={currentTheme.colors.primary} />
                <Text style={[styles.tagText, { color: currentTheme.colors.primary }]}>
                  {tag}
                </Text>
              </View>
            ))}
            {item.tags.length > 3 && (
              <Text style={[styles.moreTags, { color: currentTheme.colors.textMuted }]}>
                +{item.tags.length - 3}
              </Text>
            )}
          </View>
        )}

        <View style={styles.shareStats}>
          <View style={styles.statItem}>
            <Eye size={16} color={currentTheme.colors.textMuted} />
            <Text style={[styles.statText, { color: currentTheme.colors.textMuted }]}>
              {Math.floor(Math.random() * 100) + 10}
            </Text>
          </View>
          <View style={styles.statItem}>
            <Heart size={16} color={currentTheme.colors.textMuted} />
            <Text style={[styles.statText, { color: currentTheme.colors.textMuted }]}>
              {item.likes}
            </Text>
          </View>
          <View style={styles.statItem}>
            <MessageSquare size={16} color={currentTheme.colors.textMuted} />
            <Text style={[styles.statText, { color: currentTheme.colors.textMuted }]}>
              {item.comments}
            </Text>
          </View>
          <View style={styles.statItem}>
            <Share2 size={16} color={currentTheme.colors.textMuted} />
            <Text style={[styles.statText, { color: currentTheme.colors.textMuted }]}>
              {item.shares}
            </Text>
          </View>
        </View>

        <View style={styles.shareActions}>
          <TouchableOpacity
            style={[styles.actionButton, isLiked && { backgroundColor: `${currentTheme.colors.error}15` }]}
            onPress={() => handleLikeKnowledgeShare(item.id)}
          >
            <Heart size={16} color={isLiked ? currentTheme.colors.error : currentTheme.colors.textMuted} />
            <Text style={[styles.actionText, { color: isLiked ? currentTheme.colors.error : currentTheme.colors.textMuted }]}>
              {t('knowledgeSharing.like')}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => {
              // TODO: Implement comment functionality
              Alert.alert(t('knowledgeSharing.comingSoon'), t('knowledgeSharing.commentsComingSoon'));
            }}
          >
            <MessageSquare size={16} color={currentTheme.colors.textMuted} />
            <Text style={[styles.actionText, { color: currentTheme.colors.textMuted }]}>
              {t('knowledgeSharing.comment')}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => {
              // TODO: Implement share functionality
              Alert.alert(t('knowledgeSharing.comingSoon'), t('knowledgeSharing.shareComingSoon'));
            }}
          >
            <Share2 size={16} color={currentTheme.colors.textMuted} />
            <Text style={[styles.actionText, { color: currentTheme.colors.textMuted }]}>
              {t('knowledgeSharing.share')}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const styles = createStyles(currentTheme.colors);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>{t('common.loading')}</Text>
      </View>
    );
  }

  const filteredShares = getFilteredShares();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: currentTheme.colors.text }]}>
          {t('knowledgeSharing.title')}
        </Text>
        <TouchableOpacity
          style={[styles.createButton, { backgroundColor: currentTheme.colors.primary }]}
          onPress={() => setShowCreateModal(true)}
        >
          <Plus size={20} color={currentTheme.colors.background} />
          <Text style={[styles.createButtonText, { color: currentTheme.colors.background }]}>
            {t('knowledgeSharing.createShare')}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Search and Filter Bar */}
      <View style={styles.searchContainer}>
        <View style={[styles.searchBar, { backgroundColor: currentTheme.colors.surface }]}>
          <Search size={20} color={currentTheme.colors.textMuted} />
          <TextInput
            style={[styles.searchInput, { color: currentTheme.colors.text }]}
            placeholder={t('knowledgeSharing.searchPlaceholder')}
            placeholderTextColor={currentTheme.colors.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
        <TouchableOpacity
          style={[styles.filterButton, { backgroundColor: currentTheme.colors.surface }]}
          onPress={() => setShowFilterModal(true)}
        >
          <Filter size={20} color={currentTheme.colors.textMuted} />
        </TouchableOpacity>
      </View>

      <FlatList
        data={filteredShares}
        renderItem={renderKnowledgeShareCard}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContainer}
        ListHeaderComponent={
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: currentTheme.colors.text }]}>
              {t('knowledgeSharing.recentShares')} ({filteredShares.length})
            </Text>
          </View>
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <BookOpen size={48} color={currentTheme.colors.textMuted} />
            <Text style={[styles.emptyTitle, { color: currentTheme.colors.text }]}>
              {t('knowledgeSharing.noShares')}
            </Text>
            <Text style={[styles.emptyDescription, { color: currentTheme.colors.textSecondary }]}>
              {t('knowledgeSharing.beFirstToShare')}
            </Text>
          </View>
        }
      />

      {/* Create Knowledge Share Modal */}
      <Modal
        visible={showCreateModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowCreateModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: currentTheme.colors.card }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: currentTheme.colors.text }]}>
                {t('knowledgeSharing.createShare')}
              </Text>
              <TouchableOpacity onPress={() => setShowCreateModal(false)}>
                <X size={24} color={currentTheme.colors.textMuted} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              <TextInput
                style={[styles.input, { 
                  backgroundColor: currentTheme.colors.surface,
                  color: currentTheme.colors.text,
                  borderColor: currentTheme.colors.border
                }]}
                placeholder={t('knowledgeSharing.titlePlaceholder')}
                placeholderTextColor={currentTheme.colors.textMuted}
                value={title}
                onChangeText={setTitle}
              />

              <Text style={[styles.label, { color: currentTheme.colors.text }]}>
                {t('knowledgeSharing.type')}
              </Text>
              <View style={styles.typeContainer}>
                {(['article', 'tip', 'experience', 'tutorial'] as const).map((typeOption) => (
                  <TouchableOpacity
                    key={typeOption}
                    style={[
                      styles.typeButton,
                      type === typeOption && { backgroundColor: currentTheme.colors.primary }
                    ]}
                    onPress={() => setType(typeOption)}
                  >
                    <Text style={[
                      styles.typeButtonText,
                      { color: type === typeOption ? currentTheme.colors.background : currentTheme.colors.text }
                    ]}>
                      {t(`knowledgeSharing.types.${typeOption}`)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={[styles.label, { color: currentTheme.colors.text }]}>
                {t('knowledgeSharing.category')}
              </Text>
              <View style={styles.categoryContainer}>
                {(['habits', 'wellness', 'productivity', 'learning', 'motivation'] as const).map((categoryOption) => (
                  <TouchableOpacity
                    key={categoryOption}
                    style={[
                      styles.categoryButton,
                      category === categoryOption && { backgroundColor: getCategoryColor(categoryOption) }
                    ]}
                    onPress={() => setCategory(categoryOption)}
                  >
                    <Text style={[
                      styles.categoryButtonText,
                      { color: category === categoryOption ? currentTheme.colors.background : currentTheme.colors.text }
                    ]}>
                      {t(`knowledgeSharing.categories.${categoryOption}`)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <TextInput
                style={[styles.textArea, { 
                  backgroundColor: currentTheme.colors.surface,
                  color: currentTheme.colors.text,
                  borderColor: currentTheme.colors.border
                }]}
                placeholder={t('knowledgeSharing.contentPlaceholder')}
                placeholderTextColor={currentTheme.colors.textMuted}
                value={content}
                onChangeText={setContent}
                multiline
                numberOfLines={6}
              />

              <Text style={[styles.label, { color: currentTheme.colors.text }]}>
                {t('knowledgeSharing.tags')}
              </Text>
              <View style={styles.tagsInputContainer}>
                <TextInput
                  style={[styles.tagInput, { 
                    backgroundColor: currentTheme.colors.surface,
                    color: currentTheme.colors.text,
                    borderColor: currentTheme.colors.border
                  }]}
                  placeholder={t('knowledgeSharing.tagPlaceholder')}
                  placeholderTextColor={currentTheme.colors.textMuted}
                  value={newTag}
                  onChangeText={setNewTag}
                  onSubmitEditing={handleAddTag}
                />
                <TouchableOpacity
                  style={[styles.addTagButton, { backgroundColor: currentTheme.colors.primary }]}
                  onPress={handleAddTag}
                >
                  <Plus size={16} color={currentTheme.colors.background} />
                </TouchableOpacity>
              </View>
              {tags.length > 0 && (
                <View style={styles.tagsDisplay}>
                  {tags.map((tag, index) => (
                    <View key={index} style={[styles.tag, { backgroundColor: `${currentTheme.colors.primary}15` }]}>
                      <Text style={[styles.tagText, { color: currentTheme.colors.primary }]}>
                        {tag}
                      </Text>
                      <TouchableOpacity onPress={() => handleRemoveTag(tag)}>
                        <X size={12} color={currentTheme.colors.primary} />
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              )}
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={[styles.cancelButton, { borderColor: currentTheme.colors.border }]}
                onPress={() => setShowCreateModal(false)}
              >
                <Text style={[styles.cancelButtonText, { color: currentTheme.colors.text }]}>
                  {t('common.cancel')}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.createModalButton, { backgroundColor: currentTheme.colors.primary }]}
                onPress={handleCreateKnowledgeShare}
              >
                <Text style={[styles.createModalButtonText, { color: currentTheme.colors.background }]}>
                  {t('knowledgeSharing.createShare')}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Filter Modal */}
      <Modal
        visible={showFilterModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowFilterModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: currentTheme.colors.card }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: currentTheme.colors.text }]}>
                {t('knowledgeSharing.filters')}
              </Text>
              <TouchableOpacity onPress={() => setShowFilterModal(false)}>
                <X size={24} color={currentTheme.colors.textMuted} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              <Text style={[styles.label, { color: currentTheme.colors.text }]}>
                {t('knowledgeSharing.category')}
              </Text>
              <View style={styles.filterContainer}>
                {(['all', 'habits', 'wellness', 'productivity', 'learning', 'motivation'] as const).map((categoryOption) => (
                  <TouchableOpacity
                    key={categoryOption}
                    style={[
                      styles.filterOptionButton,
                      selectedCategory === categoryOption && { backgroundColor: currentTheme.colors.primary }
                    ]}
                    onPress={() => setSelectedCategory(categoryOption)}
                  >
                    <Text style={[
                      styles.filterButtonText,
                      { color: selectedCategory === categoryOption ? currentTheme.colors.background : currentTheme.colors.text }
                    ]}>
                      {categoryOption === 'all' ? t('knowledgeSharing.allCategories') : t(`knowledgeSharing.categories.${categoryOption}`)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={[styles.label, { color: currentTheme.colors.text }]}>
                {t('knowledgeSharing.type')}
              </Text>
              <View style={styles.filterContainer}>
                {(['all', 'article', 'tip', 'experience', 'tutorial'] as const).map((typeOption) => (
                  <TouchableOpacity
                    key={typeOption}
                    style={[
                      styles.filterOptionButton,
                      selectedType === typeOption && { backgroundColor: currentTheme.colors.primary }
                    ]}
                    onPress={() => setSelectedType(typeOption)}
                  >
                    <Text style={[
                      styles.filterButtonText,
                      { color: selectedType === typeOption ? currentTheme.colors.background : currentTheme.colors.text }
                    ]}>
                      {typeOption === 'all' ? t('knowledgeSharing.allTypes') : t(`knowledgeSharing.types.${typeOption}`)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={[styles.cancelButton, { borderColor: currentTheme.colors.border }]}
                onPress={() => {
                  setSelectedCategory('all');
                  setSelectedType('all');
                  setShowFilterModal(false);
                }}
              >
                <Text style={[styles.cancelButtonText, { color: currentTheme.colors.text }]}>
                  {t('knowledgeSharing.clearFilters')}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.createModalButton, { backgroundColor: currentTheme.colors.primary }]}
                onPress={() => setShowFilterModal(false)}
              >
                <Text style={[styles.createModalButtonText, { color: currentTheme.colors.background }]}>
                  {t('knowledgeSharing.applyFilters')}
                </Text>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: colors.textMuted,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  createButtonText: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: '600',
  },
  searchContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 15,
    gap: 10,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 16,
  },
  filterButton: {
    padding: 8,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContainer: {
    padding: 20,
  },
  sectionHeader: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  shareCard: {
    marginBottom: 16,
    padding: 16,
    borderRadius: 12,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  shareHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  shareInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  typeIcon: {
    marginRight: 8,
  },
  shareDetails: {
    flex: 1,
  },
  shareTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  shareMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  shareAuthor: {
    fontSize: 12,
    marginRight: 8,
  },
  shareDate: {
    fontSize: 12,
  },
  categoryBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  categoryText: {
    fontSize: 12,
    fontWeight: '600',
  },
  shareContent: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 12,
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 8,
    marginBottom: 4,
  },
  tagText: {
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 4,
  },
  moreTags: {
    fontSize: 12,
    marginLeft: 4,
  },
  shareStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 12,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statText: {
    fontSize: 12,
    marginLeft: 4,
  },
  shareActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  actionText: {
    fontSize: 14,
    marginLeft: 4,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyDescription: {
    fontSize: 14,
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '90%',
    maxHeight: '80%',
    borderRadius: 12,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  modalBody: {
    padding: 20,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 16,
    marginBottom: 16,
  },
  textArea: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 16,
    marginBottom: 16,
    minHeight: 120,
    textAlignVertical: 'top',
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  typeContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 16,
  },
  typeButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  typeButtonText: {
    fontSize: 12,
    fontWeight: '500',
  },
  categoryContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 16,
  },
  categoryButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  categoryButtonText: {
    fontSize: 12,
    fontWeight: '500',
  },
  tagsInputContainer: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  tagInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 16,
    marginRight: 8,
  },
  addTagButton: {
    padding: 8,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tagsDisplay: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 16,
  },
  filterContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 16,
  },
  filterOptionButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  filterButtonText: {
    fontSize: 12,
    fontWeight: '500',
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    marginRight: 8,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  createModalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  createModalButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});
