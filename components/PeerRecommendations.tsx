import React, { useState, useEffect, useCallback } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  Pressable,
  Alert, 
  TextInput, 
  Modal, 
  FlatList,
  ActivityIndicator,
  RefreshControl
} from 'react-native';
import StarRating from 'react-native-star-rating-widget';
import { useTheme } from '@/context/ThemeContext';
import { useLanguage } from '@/context/LanguageContext';
import { useAuth } from '@/context/AuthContext';
import { 
  BookOpen, 
  Star, 
  Users, 
  MessageSquare, 
  Plus, 
  Heart, 
  Share2, 
  Search, 
  Filter,
  Clock,
  Target,
  TrendingUp,
  ThumbsUp,
  ThumbsDown,
  Calendar,
  Tag,
  Trash2
} from 'lucide-react-native';
import { PeerRecommendation, RecommendationComment } from '@/services/SocialLearningService';
import SocialLearningService from '@/services/SocialLearningService';

interface PeerRecommendationsProps {
  onClose?: () => void;
}

const RECOMMENDATION_CATEGORIES = [
  'all',
  'productivity',
  'healthFitness',
  'learning',
  'mindfulness',
  'relationships',
  'career',
  'finance',
  'creativity'
];

const DIFFICULTY_LEVELS = [
  { value: 'beginner', labelKey: 'peerRecommendations.difficultyLevels.beginner', color: '#4CAF50' },
  { value: 'intermediate', labelKey: 'peerRecommendations.difficultyLevels.intermediate', color: '#FF9800' },
  { value: 'advanced', labelKey: 'peerRecommendations.difficultyLevels.advanced', color: '#F44336' }
];

export default function PeerRecommendations({ onClose }: PeerRecommendationsProps) {
  const { currentTheme } = useTheme();
  const { t, currentLanguage } = useLanguage();
  const { user } = useAuth();
  const [recommendations, setRecommendations] = useState<PeerRecommendation[]>([]);
  const [featuredRecommendations, setFeaturedRecommendations] = useState<PeerRecommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showCommentModal, setShowCommentModal] = useState(false);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [selectedRecommendation, setSelectedRecommendation] = useState<PeerRecommendation | null>(null);
  const [selectedRecommendationForRating, setSelectedRecommendationForRating] = useState<PeerRecommendation | null>(null);
  const [currentRating, setCurrentRating] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sortBy, setSortBy] = useState<'newest' | 'rating' | 'popular'>('newest');
  
  const [newRecommendation, setNewRecommendation] = useState({
    title: '',
    description: '',
    personalExperience: '',
    category: 'productivity',
    difficultyLevel: 'beginner' as 'beginner' | 'intermediate' | 'advanced',
    timeCommitment: '',
    tags: [] as string[],
    newTag: ''
  });

  const [newComment, setNewComment] = useState('');

  const socialLearningService = SocialLearningService.getInstance();

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: currentTheme.colors.background,
      paddingTop: 8,
    },
    mainScrollView: {
      flex: 1,
    },
    mainScrollContent: {
      paddingHorizontal: 16,
      paddingBottom: 20,
    },
    loadingContainer: {
      justifyContent: 'center',
      alignItems: 'center',
    },
    loadingText: {
      fontSize: 16,
      color: currentTheme.colors.textSecondary,
      marginTop: 8,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: 16,
      borderBottomWidth: 1,
      borderBottomColor: currentTheme.colors.border,
    },
    title: {
      fontSize: 24,
      fontWeight: 'bold',
      color: currentTheme.colors.text,
    },
    createButton: {
      padding: 8,
    },
    searchContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 16,
      gap: 12,
    },
    searchInputContainer: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: currentTheme.colors.card,
      borderRadius: 12,
      paddingHorizontal: 12,
      borderWidth: 1,
      borderColor: currentTheme.colors.border,
    },
    searchInput: {
      flex: 1,
      paddingVertical: 12,
      paddingHorizontal: 8,
      color: currentTheme.colors.text,
      fontSize: 16,
    },
    filterButton: {
      padding: 12,
      backgroundColor: currentTheme.colors.card,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: currentTheme.colors.border,
    },
                   categoryScroll: {
        maxHeight: 50,
        marginBottom: 6,
      },
                       categoryContainer: {
      paddingHorizontal: 16,
      paddingVertical: 6,
      gap: 0,
    },
    categoryDisplayContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
                   categoryPill: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        backgroundColor: currentTheme.colors.card,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: currentTheme.colors.border,
        marginRight: 8,
        shadowColor: currentTheme.colors.text,
        shadowOffset: {
          width: 0,
          height: 1,
        },
        shadowOpacity: 0.08,
        shadowRadius: 2,
        elevation: 2,
        minWidth: 80,
        alignItems: 'center',
        justifyContent: 'center',
      },
     activeCategoryPill: {
       backgroundColor: currentTheme.colors.primary,
       borderColor: currentTheme.colors.primary,
       shadowColor: currentTheme.colors.primary,
       shadowOpacity: 0.3,
       shadowRadius: 8,
       elevation: 6,
       transform: [{ scale: 1.05 }],
     },
           categoryPillText: {
        fontSize: 13,
        color: currentTheme.colors.textSecondary,
        fontWeight: '500',
        textAlign: 'center',
        letterSpacing: 0.3,
      },
     activeCategoryPillText: {
       color: currentTheme.colors.background,
       fontWeight: '700',
     },
    featuredSection: {
      paddingVertical: 16,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      color: currentTheme.colors.text,
      paddingHorizontal: 16,
      marginBottom: 12,
    },
    content: {
      paddingHorizontal: 16,
      paddingTop: 8,
    },
    emptyContainer: {
      alignItems: 'center',
      paddingVertical: 40,
    },
    emptyTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      color: currentTheme.colors.text,
      marginTop: 16,
      marginBottom: 8,
    },
    emptyText: {
      fontSize: 14,
      color: currentTheme.colors.textSecondary,
      textAlign: 'center',
      paddingHorizontal: 32,
    },
    recommendationCard: {
      backgroundColor: currentTheme.colors.card,
      borderRadius: 16,
      padding: 16,
      marginBottom: 16,
      borderWidth: 1,
      borderColor: currentTheme.colors.border,
    },
    cardHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: 12,
    },
    titleContainer: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    recommendationTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      color: currentTheme.colors.text,
      flex: 1,
    },
    featuredBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: currentTheme.colors.primary + '20',
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 12,
      gap: 4,
    },
    featuredText: {
      fontSize: 10,
      color: currentTheme.colors.primary,
      fontWeight: '600',
    },
    ratingContainer: {
      alignItems: 'center',
      gap: 4,
    },
    headerActions: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    deleteButton: {
      padding: 4,
    },
    starsContainer: {
      flexDirection: 'row',
      gap: 2,
    },
    ratingText: {
      fontSize: 12,
      color: currentTheme.colors.textSecondary,
    },
    metaContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      marginBottom: 12,
      flexWrap: 'wrap',
    },
    categoryText: {
      fontSize: 12,
      color: currentTheme.colors.primary,
      fontWeight: '500',
    },
    difficultyBadge: {
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 8,
    },
    difficultyText: {
      fontSize: 12,
      fontWeight: '500',
    },
    timeContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    timeText: {
      fontSize: 12,
      color: currentTheme.colors.textSecondary,
    },
    description: {
      fontSize: 14,
      color: currentTheme.colors.text,
      lineHeight: 20,
      marginBottom: 12,
    },
    experienceSection: {
      marginBottom: 12,
    },
    experienceTitle: {
      fontSize: 14,
      fontWeight: '600',
      color: currentTheme.colors.text,
      marginBottom: 4,
    },
    experienceText: {
      fontSize: 14,
      color: currentTheme.colors.textSecondary,
      lineHeight: 20,
      fontStyle: 'italic',
    },
    tagsContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
      marginBottom: 12,
    },
    tag: {
      backgroundColor: currentTheme.colors.border,
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 12,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    tagText: {
      fontSize: 12,
      color: currentTheme.colors.textSecondary,
    },
    removeTagText: {
      fontSize: 12,
      color: currentTheme.colors.error,
      fontWeight: 'bold',
    },
    cardFooter: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      flexWrap: 'wrap',
      gap: 8,
    },
    userInfo: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    userName: {
      fontSize: 12,
      color: currentTheme.colors.textSecondary,
    },
    actionButtons: {
      flexDirection: 'row',
      gap: 12,
      flexWrap: 'wrap',
    },
    actionButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      paddingHorizontal: 8,
      paddingVertical: 4,
    },
    actionButtonText: {
      fontSize: 12,
      color: currentTheme.colors.primary,
      fontWeight: '500',
    },
    commentContainer: {
      backgroundColor: currentTheme.colors.card,
      borderRadius: 12,
      padding: 12,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: currentTheme.colors.border,
    },
    commentHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 8,
    },
    commentAuthor: {
      fontSize: 14,
      fontWeight: '600',
      color: currentTheme.colors.text,
    },
    commentDate: {
      fontSize: 12,
      color: currentTheme.colors.textSecondary,
    },
    commentText: {
      fontSize: 14,
      color: currentTheme.colors.text,
      lineHeight: 20,
      marginBottom: 8,
    },
    commentActions: {
      flexDirection: 'row',
      justifyContent: 'flex-end',
    },
    voteButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    voteText: {
      fontSize: 12,
      color: currentTheme.colors.textSecondary,
    },
    modalContainer: {
      flex: 1,
    },
    modalHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: 16,
      borderBottomWidth: 1,
      borderBottomColor: currentTheme.colors.border,
    },
    modalTitle: {
      fontSize: 20,
      fontWeight: 'bold',
      color: currentTheme.colors.text,
    },
    closeButton: {
      fontSize: 24,
      color: currentTheme.colors.text,
      fontWeight: 'bold',
    },
    modalContent: {
      flex: 1,
      padding: 16,
    },
    formField: {
      marginBottom: 20,
    },
    fieldLabel: {
      fontSize: 16,
      fontWeight: '600',
      color: currentTheme.colors.text,
      marginBottom: 8,
    },
    formInput: {
      backgroundColor: currentTheme.colors.card,
      borderWidth: 1,
      borderColor: currentTheme.colors.border,
      borderRadius: 12,
      padding: 12,
      color: currentTheme.colors.text,
      fontSize: 16,
    },
    textArea: {
      minHeight: 80,
      textAlignVertical: 'top',
    },
    pickerContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
    },
    pickerButton: {
      paddingHorizontal: 16,
      paddingVertical: 8,
      backgroundColor: currentTheme.colors.card,
      borderWidth: 1,
      borderColor: currentTheme.colors.border,
      borderRadius: 20,
    },
    pickerButtonSelected: {
      backgroundColor: currentTheme.colors.primary,
      borderColor: currentTheme.colors.primary,
    },
    pickerButtonText: {
      fontSize: 14,
      color: currentTheme.colors.text,
    },
    pickerButtonTextSelected: {
      color: currentTheme.colors.background,
    },
    tagInputContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    tagInput: {
      flex: 1,
      backgroundColor: currentTheme.colors.card,
      borderWidth: 1,
      borderColor: currentTheme.colors.border,
      borderRadius: 12,
      padding: 12,
      color: currentTheme.colors.text,
      fontSize: 16,
    },
    addTagButton: {
      padding: 12,
      backgroundColor: currentTheme.colors.primary,
      borderRadius: 12,
    },
    modalFooter: {
      padding: 16,
      borderTopWidth: 1,
      borderTopColor: currentTheme.colors.border,
    },
    submitButton: {
      backgroundColor: currentTheme.colors.primary,
      paddingVertical: 16,
      borderRadius: 12,
      alignItems: 'center',
    },
    submitButtonText: {
      fontSize: 16,
      fontWeight: '600',
      color: currentTheme.colors.background,
    },
    noCommentsText: {
      fontSize: 16,
      color: currentTheme.colors.textSecondary,
      textAlign: 'center',
      paddingVertical: 40,
    },
    commentInputContainer: {
      flexDirection: 'row',
      alignItems: 'flex-end',
      padding: 16,
      gap: 12,
      borderTopWidth: 1,
      borderTopColor: currentTheme.colors.border,
    },
    commentInput: {
      flex: 1,
      backgroundColor: currentTheme.colors.card,
      borderWidth: 1,
      borderColor: currentTheme.colors.border,
      borderRadius: 20,
      paddingHorizontal: 16,
      paddingVertical: 12,
      color: currentTheme.colors.text,
      fontSize: 16,
      maxHeight: 100,
      textAlignVertical: 'top',
    },
    sendCommentButton: {
      backgroundColor: currentTheme.colors.primary,
      paddingHorizontal: 20,
      paddingVertical: 12,
      borderRadius: 20,
    },
    sendCommentButtonDisabled: {
      backgroundColor: currentTheme.colors.border,
    },
         sendCommentButtonText: {
       fontSize: 14,
       fontWeight: '600',
       color: currentTheme.colors.background,
     },
     ratingModalContent: {
       alignItems: 'center',
       paddingVertical: 40,
     },
     ratingModalTitle: {
       fontSize: 20,
       fontWeight: 'bold',
       color: currentTheme.colors.text,
       textAlign: 'center',
       marginBottom: 16,
       paddingHorizontal: 20,
     },
     ratingModalDescription: {
       fontSize: 16,
       color: currentTheme.colors.textSecondary,
       textAlign: 'center',
       marginBottom: 32,
       paddingHorizontal: 20,
     },
     starRatingContainer: {
       marginBottom: 24,
     },
     ratingModalText: {
       fontSize: 18,
       fontWeight: '600',
       color: currentTheme.colors.primary,
       textAlign: 'center',
     },
     submitButtonDisabled: {
       backgroundColor: currentTheme.colors.border,
     },
   });

  useEffect(() => {
    if (user?.id) {
      socialLearningService.setUserId(user.id);
    }
    loadRecommendations();
  }, [user?.id, currentLanguage.code]);

  const loadRecommendations = async () => {
    try {
      setLoading(true);
      
      // Clear stored recommendations to force regeneration with new language
      await socialLearningService.clearStoredRecommendations();
      
      const [activeRecs, featuredRecs] = await Promise.all([
        socialLearningService.getActiveRecommendations(currentLanguage.code),
        socialLearningService.getFeaturedRecommendations(currentLanguage.code)
      ]);
      setRecommendations(activeRecs);
      setFeaturedRecommendations(featuredRecs);
    } catch (error) {
      console.error('Error loading recommendations:', error);
      Alert.alert('Error', t('peerRecommendations.alerts.loadError'));
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadRecommendations();
    setRefreshing(false);
  }, []);

  const handleCreateRecommendation = async () => {
    if (!newRecommendation.title || !newRecommendation.description || !newRecommendation.personalExperience) {
      Alert.alert('Error', t('peerRecommendations.form.requiredFieldsError'));
      return;
    }

    try {
      const recommendation = await socialLearningService.createUserRecommendation({
        title: newRecommendation.title,
        description: newRecommendation.description,
        personalExperience: newRecommendation.personalExperience,
        category: newRecommendation.category,
        difficultyLevel: newRecommendation.difficultyLevel,
        timeCommitment: newRecommendation.timeCommitment,
        tags: newRecommendation.tags,
        userName: user?.name || 'Anonymous User'
      });
      
      setRecommendations([recommendation, ...recommendations]);
      setShowCreateModal(false);
      setNewRecommendation({
        title: '',
        description: '',
        personalExperience: '',
        category: 'productivity',
        difficultyLevel: 'beginner',
        timeCommitment: '',
        tags: [],
        newTag: ''
      });
      Alert.alert('Success', t('peerRecommendations.alerts.createSuccess'));
    } catch (error) {
      console.error('Error creating recommendation:', error);
      Alert.alert('Error', t('peerRecommendations.alerts.createError'));
    }
  };

  const handleRateRecommendation = async (recommendation: PeerRecommendation) => {
    setSelectedRecommendationForRating(recommendation);
    setCurrentRating(0);
    setShowRatingModal(true);
  };

  const handleSubmitRating = async () => {
    if (!selectedRecommendationForRating || currentRating === 0) {
      Alert.alert('Error', t('peerRecommendations.rating.selectRatingError'));
      return;
    }

    try {
      const success = await socialLearningService.rateRecommendation(selectedRecommendationForRating.id, currentRating, currentLanguage.code);
      if (success) {
        // Update local state instead of reloading everything
        const updatedRecommendations = recommendations.map(rec => {
          if (rec.id === selectedRecommendationForRating.id) {
            const newTotalRatings = (rec.totalRatings || 0) + 1;
            const newAverageRating = ((rec.averageRating || 0) * (rec.totalRatings || 0) + currentRating) / newTotalRatings;
            return {
              ...rec,
              totalRatings: newTotalRatings,
              averageRating: newAverageRating
            };
          }
          return rec;
        });
        
        setRecommendations(updatedRecommendations);
        setShowRatingModal(false);
        setSelectedRecommendationForRating(null);
        setCurrentRating(0);
        Alert.alert('Success', t('peerRecommendations.alerts.ratingSuccess'));
      } else {
        Alert.alert('Error', t('peerRecommendations.alerts.ratingError'));
      }
    } catch (error) {
      console.error('Error rating recommendation:', error);
      Alert.alert('Error', t('peerRecommendations.alerts.ratingError'));
    }
  };

  const handleDeleteRecommendation = async (recommendation: PeerRecommendation) => {
    // Only the creator can delete their own recommendations
    if (recommendation.fromUserId !== user?.id) {
      Alert.alert(t('common.error'), t('peerRecommendations.alerts.onlyCreatorCanDelete'));
      return;
    }

    Alert.alert(
      t('peerRecommendations.deleteRecommendation'),
      t('peerRecommendations.deleteRecommendationConfirm', { title: recommendation.title }),
      [
        {
          text: t('common.cancel'),
          style: 'cancel',
        },
        {
          text: t('peerRecommendations.deleteRecommendation'),
          style: 'destructive',
          onPress: async () => {
            try {
              const success = await socialLearningService.deletePeerRecommendation(recommendation.id);
              if (success) {
                // Remove it from the local state
                setRecommendations(recommendations.filter(r => r.id !== recommendation.id));
                setFeaturedRecommendations(featuredRecommendations.filter(r => r.id !== recommendation.id));
                Alert.alert(t('common.success'), t('peerRecommendations.alerts.deleteSuccess'));
              } else {
                Alert.alert(t('common.error'), t('peerRecommendations.alerts.deleteError'));
              }
            } catch (error) {
              console.error('Error deleting recommendation:', error);
              Alert.alert(t('common.error'), t('peerRecommendations.alerts.deleteError'));
            }
          },
        },
      ]
    );
  };

  const handleAddComment = useCallback(async () => {
    if (!selectedRecommendation || !newComment.trim()) {
      Alert.alert('Error', t('peerRecommendations.alerts.commentRequired'));
      return;
    }

    const commentText = newComment.trim();
    const userName = user?.name || 'Anonymous User';
    
    // Clear the input immediately to prevent UI issues
    setNewComment('');
    
    try {
      const success = await socialLearningService.addComment(
        selectedRecommendation.id, 
        commentText, 
        userName,
        currentLanguage.code
      );
      if (success) {
        // Update the local state instead of reloading everything
        const updatedRecommendations = recommendations.map(rec => {
          if (rec.id === selectedRecommendation.id) {
            const newComment: RecommendationComment = {
              id: `comment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
              userId: user?.id || 'anonymous',
              userName: userName,
              comment: commentText,
              createdAt: new Date().toISOString(),
              helpfulVotes: 0,
            };
            return {
              ...rec,
              comments: [...(rec.comments || []), newComment]
            };
          }
          return rec;
        });
        
        setRecommendations(updatedRecommendations);
        
        // Update selected recommendation if it's still open
        if (selectedRecommendation) {
          const updatedSelected = updatedRecommendations.find(rec => rec.id === selectedRecommendation.id);
          if (updatedSelected) {
            setSelectedRecommendation(updatedSelected);
          }
        }
        
        setShowCommentModal(false);
        setSelectedRecommendation(null);
      } else {
        Alert.alert('Error', t('peerRecommendations.alerts.commentError'));
        // Restore the comment text if it failed
        setNewComment(commentText);
      }
    } catch (error) {
      console.error('Error adding comment:', error);
      Alert.alert('Error', t('peerRecommendations.alerts.commentError'));
      // Restore the comment text if it failed
      setNewComment(commentText);
    }
  }, [selectedRecommendation, newComment, user, recommendations]);

  const handleVoteComment = useCallback(async (recommendationId: string, commentId: string, isHelpful: boolean) => {
    try {
      const success = await socialLearningService.voteComment(recommendationId, commentId, isHelpful, currentLanguage.code);
      if (success) {
        // Update the local state instead of reloading everything
        const updatedRecommendations = recommendations.map(rec => {
          if (rec.id === recommendationId) {
            return {
              ...rec,
              comments: rec.comments?.map(comment => {
                if (comment.id === commentId) {
                  return {
                    ...comment,
                    helpfulVotes: comment.helpfulVotes + (isHelpful ? 1 : -1)
                  };
                }
                return comment;
              })
            };
          }
          return rec;
        });
        
        setRecommendations(updatedRecommendations);
        
        // Update selected recommendation if it's still open
        if (selectedRecommendation && selectedRecommendation.id === recommendationId) {
          const updatedSelected = updatedRecommendations.find(rec => rec.id === recommendationId);
          if (updatedSelected) {
            setSelectedRecommendation(updatedSelected);
          }
        }
      }
    } catch (error) {
      console.error('Error voting on comment:', error);
    }
  }, [recommendations, selectedRecommendation]);

  const addTag = () => {
    if (newRecommendation.newTag.trim() && !newRecommendation.tags.includes(newRecommendation.newTag.trim())) {
      setNewRecommendation(prev => ({
        ...prev,
        tags: [...prev.tags, newRecommendation.newTag.trim()],
        newTag: ''
      }));
    }
  };

  const removeTag = (tagToRemove: string) => {
    setNewRecommendation(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const getFilteredRecommendations = () => {
    let filtered = recommendations;

    // Filter by category
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(rec => rec.category === selectedCategory);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(rec => 
        rec.title.toLowerCase().includes(query) ||
        rec.description.toLowerCase().includes(query) ||
        rec.personalExperience.toLowerCase().includes(query) ||
        rec.tags?.some(tag => tag.toLowerCase().includes(query))
      );
    }

    // Sort
    switch (sortBy) {
      case 'rating':
        filtered = filtered.sort((a, b) => (b.averageRating || 0) - (a.averageRating || 0));
        break;
      case 'popular':
        filtered = filtered.sort((a, b) => (b.totalRatings || 0) - (a.totalRatings || 0));
        break;
      case 'newest':
      default:
        filtered = filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        break;
    }

    return filtered;
  };

  const renderStars = (rating: number, size: number = 16) => {
    return (
      <View style={styles.starsContainer}>
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            size={size}
            fill={star <= rating ? currentTheme.colors.primary : 'transparent'}
            color={star <= rating ? currentTheme.colors.primary : currentTheme.colors.textSecondary}
          />
        ))}
      </View>
    );
  };

  const renderDifficultyBadge = (level: string) => {
    const difficulty = DIFFICULTY_LEVELS.find(d => d.value === level);
    if (!difficulty) return null;

    return (
      <View style={[styles.difficultyBadge, { backgroundColor: difficulty.color + '20' }]}>
        <Text style={[styles.difficultyText, { color: difficulty.color }]}>
          {t(difficulty.labelKey)}
        </Text>
      </View>
    );
  };

  const renderRecommendationCard = (recommendation: PeerRecommendation) => {
    const isCreator = recommendation.fromUserId === user?.id;
    
    return (
      <View key={recommendation.id} style={styles.recommendationCard}>
        <View style={styles.cardHeader}>
          <View style={styles.titleContainer}>
            <Text style={styles.recommendationTitle}>{recommendation.title}</Text>
            {recommendation.featured && (
              <View style={styles.featuredBadge}>
                <TrendingUp size={12} color={currentTheme.colors.primary} />
                <Text style={styles.featuredText}>{t('peerRecommendations.featured')}</Text>
              </View>
            )}
          </View>
          <View style={styles.headerActions}>
            <View style={styles.ratingContainer}>
              {renderStars(recommendation.averageRating || 0)}
              <Text style={styles.ratingText}>
                {recommendation.averageRating?.toFixed(1) || '0.0'} ({recommendation.totalRatings || 0})
              </Text>
            </View>
            {isCreator && (
              <TouchableOpacity
                style={styles.deleteButton}
                onPress={() => handleDeleteRecommendation(recommendation)}
              >
                <Trash2 size={16} color="#EF4444" />
              </TouchableOpacity>
            )}
          </View>
        </View>

      <View style={styles.metaContainer}>
        <View style={styles.categoryDisplayContainer}>
          <Tag size={14} color={currentTheme.colors.textSecondary} />
          <Text style={styles.categoryText}>{recommendation.category}</Text>
        </View>
        {renderDifficultyBadge(recommendation.difficultyLevel)}
        <View style={styles.timeContainer}>
          <Clock size={14} color={currentTheme.colors.textSecondary} />
          <Text style={styles.timeText}>{recommendation.timeCommitment}</Text>
        </View>
      </View>

      <Text style={styles.description}>{recommendation.description}</Text>
      
      <View style={styles.experienceSection}>
        <Text style={styles.experienceTitle}>{t('peerRecommendations.card.personalExperience')}</Text>
        <Text style={styles.experienceText}>{recommendation.personalExperience}</Text>
      </View>

      {recommendation.tags && recommendation.tags.length > 0 && (
        <View style={styles.tagsContainer}>
          {recommendation.tags.map((tag, index) => (
            <View key={index} style={styles.tag}>
              <Text style={styles.tagText}>#{t(tag)}</Text>
            </View>
          ))}
        </View>
      )}

      <View style={styles.cardFooter}>
        <View style={styles.userInfo}>
          <Users size={14} color={currentTheme.colors.textSecondary} />
          <Text style={styles.userName}>{recommendation.userName || t('peerRecommendations.card.anonymous')}</Text>
        </View>
        
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => {
              setSelectedRecommendation(recommendation);
              setShowCommentModal(true);
            }}
          >
            <MessageSquare size={16} color={currentTheme.colors.primary} />
            <Text style={styles.actionButtonText}>
              {recommendation.comments?.length || 0} {t('peerRecommendations.card.comments')}
            </Text>
          </TouchableOpacity>
          
                     <TouchableOpacity
             style={styles.actionButton}
             onPress={() => handleRateRecommendation(recommendation)}
           >
             <Star size={16} color={currentTheme.colors.primary} />
             <Text style={styles.actionButtonText}>{t('peerRecommendations.card.rate')}</Text>
           </TouchableOpacity>
        </View>
      </View>
    </View>
  );
  };

  const renderComment = (comment: RecommendationComment) => (
    <View key={comment.id} style={styles.commentContainer}>
      <View style={styles.commentHeader}>
        <Text style={styles.commentAuthor}>{comment.userName}</Text>
        <Text style={styles.commentDate}>
          {new Date(comment.createdAt).toLocaleDateString()}
        </Text>
      </View>
      <Text style={styles.commentText}>{comment.comment}</Text>
      <View style={styles.commentActions}>
        <TouchableOpacity
          style={styles.voteButton}
          onPress={() => selectedRecommendation && handleVoteComment(selectedRecommendation.id, comment.id, true)}
        >
          <ThumbsUp size={14} color={currentTheme.colors.textSecondary} />
          <Text style={styles.voteText}>{comment.helpfulVotes} {t('peerRecommendations.comments.helpfulVotes')}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator size="large" color={currentTheme.colors.primary} />
        <Text style={styles.loadingText}>{t('peerRecommendations.loading')}</Text>
      </View>
    );
  }

  const filteredRecommendations = getFilteredRecommendations();

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.mainScrollView}
        showsVerticalScrollIndicator={true}
        nestedScrollEnabled={true}
        bounces={true}
        overScrollMode="always"
        contentContainerStyle={styles.mainScrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>{t('peerRecommendations.title')}</Text>
          <TouchableOpacity
            style={styles.createButton}
            onPress={() => setShowCreateModal(true)}
          >
            <Plus size={24} color={currentTheme.colors.primary} />
          </TouchableOpacity>
        </View>

        {/* Search and Filter */}
        <View style={styles.searchContainer}>
          <View style={styles.searchInputContainer}>
            <Search size={20} color={currentTheme.colors.textSecondary} />
            <TextInput
              style={styles.searchInput}
              placeholder={t('peerRecommendations.searchPlaceholder')}
              placeholderTextColor={currentTheme.colors.textSecondary}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>
          
          <TouchableOpacity
            style={styles.filterButton}
            onPress={() => {
              Alert.alert(
                t('peerRecommendations.sortBy'),
                'Choose sorting option',
                [
                  { text: 'Cancel', style: 'cancel' },
                  { text: t('peerRecommendations.sortOptions.newest'), onPress: () => setSortBy('newest') },
                  { text: t('peerRecommendations.sortOptions.highestRated'), onPress: () => setSortBy('rating') },
                  { text: t('peerRecommendations.sortOptions.mostPopular'), onPress: () => setSortBy('popular') },
                ]
              );
            }}
          >
            <Filter size={20} color={currentTheme.colors.primary} />
          </TouchableOpacity>
        </View>

        {/* Category Filter */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.categoryScroll}
          contentContainerStyle={styles.categoryContainer}
        >
                   {RECOMMENDATION_CATEGORIES.map((category) => (
             <Pressable
               key={category}
               style={({ pressed }) => [
                 styles.categoryPill,
                 selectedCategory === category && styles.activeCategoryPill,
                 pressed && {
                   opacity: 0.8,
                   transform: [{ scale: 0.95 }]
                 }
               ]}
               onPress={() => setSelectedCategory(category)}
             >
                                <Text style={[
                   styles.categoryPillText,
                   selectedCategory === category && styles.activeCategoryPillText
                 ]}>
                   {t(`peerRecommendations.categories.${category}`)}
                 </Text>
             </Pressable>
           ))}
        </ScrollView>

        {/* Featured Section */}
        {featuredRecommendations.length > 0 && (
          <View style={styles.featuredSection}>
            <Text style={styles.sectionTitle}>{t('peerRecommendations.featuredSection')}</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {featuredRecommendations.map(renderRecommendationCard)}
            </ScrollView>
          </View>
        )}

        {/* Main Content */}
        <View style={styles.content}>
          <Text style={styles.sectionTitle}>
            {t('peerRecommendations.weeklySection')} ({filteredRecommendations.length})
          </Text>
          
          {filteredRecommendations.length === 0 ? (
            <View style={styles.emptyContainer}>
              <BookOpen size={48} color={currentTheme.colors.textSecondary} />
              <Text style={styles.emptyTitle}>{t('peerRecommendations.emptyState.title')}</Text>
              <Text style={styles.emptyText}>
                {searchQuery || selectedCategory !== 'all' 
                  ? t('peerRecommendations.emptyState.searchMessage')
                  : t('peerRecommendations.emptyState.defaultMessage')
                }
              </Text>
            </View>
          ) : (
            filteredRecommendations.map(renderRecommendationCard)
          )}
        </View>
      </ScrollView>

      {/* Create Recommendation Modal */}
      <Modal
        visible={showCreateModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={[styles.modalContainer, { backgroundColor: currentTheme.colors.background }]}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{t('peerRecommendations.form.title')}</Text>
            <TouchableOpacity onPress={() => setShowCreateModal(false)}>
              <Text style={styles.closeButton}>✕</Text>
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.modalContent}>
            <View style={styles.formField}>
              <Text style={styles.fieldLabel}>{t('peerRecommendations.form.titleField')}</Text>
              <TextInput
                style={styles.formInput}
                placeholder={t('peerRecommendations.form.titlePlaceholder')}
                placeholderTextColor={currentTheme.colors.textSecondary}
                value={newRecommendation.title}
                onChangeText={(text) => setNewRecommendation(prev => ({ ...prev, title: text }))}
              />
            </View>

            <View style={styles.formField}>
              <Text style={styles.fieldLabel}>{t('peerRecommendations.form.descriptionField')}</Text>
              <TextInput
                style={[styles.formInput, styles.textArea]}
                placeholder={t('peerRecommendations.form.descriptionPlaceholder')}
                placeholderTextColor={currentTheme.colors.textSecondary}
                value={newRecommendation.description}
                onChangeText={(text) => setNewRecommendation(prev => ({ ...prev, description: text }))}
                multiline
                numberOfLines={3}
              />
            </View>

            <View style={styles.formField}>
              <Text style={styles.fieldLabel}>{t('peerRecommendations.form.experienceField')}</Text>
              <TextInput
                style={[styles.formInput, styles.textArea]}
                placeholder={t('peerRecommendations.form.experiencePlaceholder')}
                placeholderTextColor={currentTheme.colors.textSecondary}
                value={newRecommendation.personalExperience}
                onChangeText={(text) => setNewRecommendation(prev => ({ ...prev, personalExperience: text }))}
                multiline
                numberOfLines={4}
              />
            </View>

            <View style={styles.formField}>
              <Text style={styles.fieldLabel}>{t('peerRecommendations.form.categoryField')}</Text>
              <View style={styles.pickerContainer}>
                {RECOMMENDATION_CATEGORIES.slice(1).map((category) => (
                  <TouchableOpacity
                    key={category}
                    style={[
                      styles.pickerButton,
                      newRecommendation.category === category && styles.pickerButtonSelected
                    ]}
                    onPress={() => setNewRecommendation(prev => ({ ...prev, category }))}
                  >
                    <Text style={[
                      styles.pickerButtonText,
                      newRecommendation.category === category && styles.pickerButtonTextSelected
                    ]}>
                      {t(`peerRecommendations.categories.${category}`)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.formField}>
              <Text style={styles.fieldLabel}>{t('peerRecommendations.form.difficultyField')}</Text>
              <View style={styles.pickerContainer}>
                {DIFFICULTY_LEVELS.map((level) => (
                  <TouchableOpacity
                    key={level.value}
                    style={[
                      styles.pickerButton,
                      newRecommendation.difficultyLevel === level.value && styles.pickerButtonSelected
                    ]}
                    onPress={() => setNewRecommendation(prev => ({ ...prev, difficultyLevel: level.value as 'beginner' | 'intermediate' | 'advanced' }))}
                  >
                    <Text style={[
                      styles.pickerButtonText,
                      newRecommendation.difficultyLevel === level.value && styles.pickerButtonTextSelected
                    ]}>
                      {t(level.labelKey)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.formField}>
              <Text style={styles.fieldLabel}>{t('peerRecommendations.form.timeField')}</Text>
              <TextInput
                style={styles.formInput}
                placeholder={t('peerRecommendations.form.timePlaceholder')}
                placeholderTextColor={currentTheme.colors.textSecondary}
                value={newRecommendation.timeCommitment}
                onChangeText={(text) => setNewRecommendation(prev => ({ ...prev, timeCommitment: text }))}
              />
            </View>

            <View style={styles.formField}>
              <Text style={styles.fieldLabel}>{t('peerRecommendations.form.tagsField')}</Text>
              <View style={styles.tagInputContainer}>
                <TextInput
                  style={styles.tagInput}
                  placeholder={t('peerRecommendations.form.tagPlaceholder')}
                  placeholderTextColor={currentTheme.colors.textSecondary}
                  value={newRecommendation.newTag}
                  onChangeText={(text) => setNewRecommendation(prev => ({ ...prev, newTag: text }))}
                  onSubmitEditing={addTag}
                />
                <TouchableOpacity style={styles.addTagButton} onPress={addTag}>
                  <Plus size={16} color={currentTheme.colors.primary} />
                </TouchableOpacity>
              </View>
              {newRecommendation.tags.length > 0 && (
                <View style={styles.tagsContainer}>
                  {newRecommendation.tags.map((tag, index) => (
                    <TouchableOpacity
                      key={index}
                      style={styles.tag}
                      onPress={() => removeTag(tag)}
                    >
                      <Text style={styles.tagText}>#{t(tag)}</Text>
                      <Text style={styles.removeTagText}>✕</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>
          </ScrollView>

          <View style={styles.modalFooter}>
            <TouchableOpacity
              style={styles.submitButton}
              onPress={handleCreateRecommendation}
            >
              <Text style={styles.submitButtonText}>{t('peerRecommendations.form.submitButton')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Comments Modal */}
      <Modal
        visible={showCommentModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowCommentModal(false)}
      >
        <View style={[styles.modalContainer, { backgroundColor: currentTheme.colors.background }]}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{t('peerRecommendations.comments.title')}</Text>
            <TouchableOpacity onPress={() => setShowCommentModal(false)}>
              <Text style={styles.closeButton}>✕</Text>
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.modalContent}>
            {selectedRecommendation?.comments && selectedRecommendation.comments.length > 0 ? (
              selectedRecommendation.comments.map(renderComment)
            ) : (
              <Text style={styles.noCommentsText}>{t('peerRecommendations.comments.noComments')}</Text>
            )}
          </ScrollView>

          <View style={styles.commentInputContainer}>
            <TextInput
              style={styles.commentInput}
              placeholder={t('peerRecommendations.comments.addComment')}
              placeholderTextColor={currentTheme.colors.textSecondary}
              value={newComment}
              onChangeText={setNewComment}
              multiline
              blurOnSubmit={false}
              returnKeyType="default"
            />
            <TouchableOpacity
              style={[styles.sendCommentButton, !newComment.trim() && styles.sendCommentButtonDisabled]}
              onPress={handleAddComment}
              disabled={!newComment.trim()}
            >
              <Text style={styles.sendCommentButtonText}>{t('peerRecommendations.comments.sendButton')}</Text>
            </TouchableOpacity>
                     </View>
         </View>
       </Modal>

       {/* Rating Modal */}
       <Modal
         visible={showRatingModal}
         animationType="slide"
         presentationStyle="pageSheet"
         onRequestClose={() => setShowRatingModal(false)}
       >
         <View style={[styles.modalContainer, { backgroundColor: currentTheme.colors.background }]}>
           <View style={styles.modalHeader}>
             <Text style={styles.modalTitle}>{t('peerRecommendations.rating.title')}</Text>
             <TouchableOpacity onPress={() => setShowRatingModal(false)}>
               <Text style={styles.closeButton}>✕</Text>
             </TouchableOpacity>
           </View>
           
           <View style={styles.modalContent}>
             {selectedRecommendationForRating && (
               <View style={styles.ratingModalContent}>
                 <Text style={styles.ratingModalTitle}>{selectedRecommendationForRating.title}</Text>
                 <Text style={styles.ratingModalDescription}>
                   {t('peerRecommendations.rating.description')}
                 </Text>
                 
                 <View style={styles.starRatingContainer}>
                   <StarRating
                     rating={currentRating}
                     onChange={setCurrentRating}
                     maxStars={5}
                     starSize={40}
                     color={currentTheme.colors.primary}
                     emptyColor={currentTheme.colors.border}
                     starStyle={{ marginHorizontal: 4 }}
                   />
                 </View>
                 
                 <Text style={styles.ratingModalText}>
                   {currentRating === 0 && t('peerRecommendations.rating.selectRating')}
                   {currentRating === 1 && t('peerRecommendations.rating.poor')}
                   {currentRating === 2 && t('peerRecommendations.rating.fair')}
                   {currentRating === 3 && t('peerRecommendations.rating.good')}
                   {currentRating === 4 && t('peerRecommendations.rating.veryGood')}
                   {currentRating === 5 && t('peerRecommendations.rating.excellent')}
                 </Text>
               </View>
             )}
           </View>

           <View style={styles.modalFooter}>
             <TouchableOpacity
               style={[styles.submitButton, currentRating === 0 && styles.submitButtonDisabled]}
               onPress={handleSubmitRating}
               disabled={currentRating === 0}
             >
               <Text style={styles.submitButtonText}>{t('peerRecommendations.rating.submitButton')}</Text>
             </TouchableOpacity>
           </View>
         </View>
       </Modal>
     </View>
   );
 }
