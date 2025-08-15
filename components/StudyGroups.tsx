import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, TextInput, Modal, FlatList, Share, ActivityIndicator } from 'react-native';
import { useTheme } from '@/context/ThemeContext';
import { useLanguage } from '@/context/LanguageContext';
import { useAuth } from '@/context/AuthContext';
import { useGamification } from '@/context/GamificationContext';
import { Users, Plus, MessageSquare, Calendar, BarChart3, Settings, Send, Clock, UserPlus, Search, Filter, Share2, Crown, Star, Users2, BookOpen, Target, Heart, Zap, Trash2, ChevronRight } from 'lucide-react-native';
import { StudyGroup, StudySession, ChatMessage, StudyGroupAnalytics } from '@/services/SocialLearningService';
import SocialLearningService from '@/services/SocialLearningService';

interface StudyGroupsProps {
  onClose?: () => void;
}

export default function StudyGroups({ onClose }: StudyGroupsProps) {
  const { currentTheme } = useTheme();
  const { t, currentLanguage } = useLanguage();
  const { user } = useAuth();
  const { trackStudyGroupCreation, trackStudyGroupJoin } = useGamification();
  
  const [studyGroups, setStudyGroups] = useState<StudyGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showChatModal, setShowChatModal] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [showAnalyticsModal, setShowAnalyticsModal] = useState(false);
  const [showMembersModal, setShowMembersModal] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<StudyGroup | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const [newGroupData, setNewGroupData] = useState({
    name: '',
    description: '',
    category: 'productivity', // Will be translated when displayed
    maxMembers: 15,
    tags: [] as string[],
    rules: [] as string[],
    topics: [] as string[],
    meetingSchedule: {
      frequency: 'weekly' as 'daily' | 'weekly' | 'biweekly' | 'monthly',
      dayOfWeek: 1, // Monday
      time: '10:00',
      duration: 60
    },
    location: {
      type: 'virtual' as 'virtual' | 'physical',
      address: '',
      meetingLink: ''
    },
    contactInfo: {
      email: '',
      phone: ''
    },
    level: 'beginner' as 'beginner' | 'intermediate' | 'advanced',
    commitment: 'moderate' as 'casual' | 'moderate' | 'intensive'
  });

  const [formErrors, setFormErrors] = useState<{[key: string]: string}>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [newSessionData, setNewSessionData] = useState({
    title: '',
    description: '',
    date: new Date().toISOString().split('T')[0],
    startTime: '10:00',
    duration: 60,
    maxParticipants: 10,
    topics: [] as string[],
    materials: [] as string[]
  });

  // Group categories for better organization
  const groupCategories = useMemo(() => [
    { id: 'all', name: t('studyGroups.categories.all'), icon: Users2, color: '#6366F1' },
    { id: 'productivity', name: t('studyGroups.categories.productivity'), icon: Target, color: '#10B981' },
    { id: 'health', name: t('studyGroups.categories.health'), icon: Heart, color: '#EF4444' },
    { id: 'learning', name: t('studyGroups.categories.learning'), icon: BookOpen, color: '#F59E0B' },
    { id: 'motivation', name: t('studyGroups.categories.motivation'), icon: Zap, color: '#8B5CF6' }
  ], [t]);

  const socialLearningService = SocialLearningService.getInstance();

  useEffect(() => {
    if (user?.id) {
      socialLearningService.setUserId(user.id);
    }
    loadStudyGroups();
  }, [user?.id, currentLanguage.code]);

  // Clear cache when language changes to ensure fresh translated data
  useEffect(() => {
    const clearCacheAndReload = async () => {
      await socialLearningService.clearStoredGroups();
      await loadStudyGroups();
    };
    clearCacheAndReload();
  }, [currentLanguage.code]);

  const loadStudyGroups = async () => {
    try {
      setLoading(true);
      // Clear stored groups to ensure fresh translated data
      await socialLearningService.clearStoredGroups();
      const groups = await socialLearningService.getStudyGroups(currentLanguage.code);
      setStudyGroups(groups);
    } catch (error) {
      console.error('Error loading study groups:', error);
      Alert.alert(t('common.error'), t('studyGroups.groupCreatedError'));
    } finally {
      setLoading(false);
    }
  };

  const validateForm = () => {
    const errors: {[key: string]: string} = {};
    
    if (!newGroupData.name.trim()) {
      errors.name = t('studyGroups.groupNameRequired');
    } else if (newGroupData.name.length < 3) {
      errors.name = t('studyGroups.groupNameMinLength');
    }
    
    if (!newGroupData.description.trim()) {
      errors.description = t('studyGroups.descriptionRequired');
    } else if (newGroupData.description.length < 10) {
      errors.description = t('studyGroups.descriptionMinLength');
    }
    
    if (newGroupData.maxMembers < 2 || newGroupData.maxMembers > 50) {
      errors.maxMembers = t('studyGroups.maxMembersRange');
    }
    
    if (newGroupData.location.type === 'virtual' && !newGroupData.location.meetingLink.trim()) {
      errors.meetingLink = t('studyGroups.meetingLinkRequired');
    }
    
    if (newGroupData.location.type === 'physical' && !newGroupData.location.address.trim()) {
      errors.address = t('studyGroups.addressRequired');
    }
    
    if (newGroupData.contactInfo.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newGroupData.contactInfo.email)) {
      errors.email = t('studyGroups.invalidEmail');
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleCreateGroup = async () => {
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    try {
      const newGroup = await socialLearningService.createStudyGroup({
        ...newGroupData,
        createdBy: user?.id || 'unknown',
        isActive: true
      });
      
      // Track gamification
      await trackStudyGroupCreation(newGroup.id, newGroup.name);
      
      setStudyGroups([...studyGroups, newGroup]);
      setShowCreateModal(false);
      setFormErrors({});
      setNewGroupData({
        name: '',
        description: '',
        category: 'productivity', // Will be translated when displayed
        maxMembers: 15,
        tags: [],
        rules: [],
        topics: [],
        meetingSchedule: {
          frequency: 'weekly',
          dayOfWeek: 1,
          time: '10:00',
          duration: 60
        },
        location: {
          type: 'virtual',
          address: '',
          meetingLink: ''
        },
        contactInfo: {
          email: '',
          phone: ''
        },
        level: 'beginner',
        commitment: 'moderate'
      });
      Alert.alert(t('common.success'), t('studyGroups.groupCreatedSuccess'));
    } catch (error) {
      console.error('Error creating study group:', error);
      Alert.alert(t('common.error'), t('studyGroups.groupCreatedError'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleJoinGroup = async (groupId: string) => {
    try {
      const success = await socialLearningService.joinStudyGroup(groupId);
      if (success) {
        // Track gamification
        const group = studyGroups.find(g => g.id === groupId);
        if (group) {
          await trackStudyGroupJoin(groupId, group.name);
        }
        
        await loadStudyGroups();
        Alert.alert(t('common.success'), t('studyGroups.joinedGroupSuccess'));
      } else {
        Alert.alert(t('common.error'), t('studyGroups.joinedGroupError'));
      }
    } catch (error) {
      console.error('Error joining study group:', error);
      Alert.alert(t('common.error'), t('studyGroups.joinedGroupError'));
    }
  };

  const handleJoinGroupById = async () => {
    Alert.prompt(
      t('studyGroups.joinGroupById'),
      t('studyGroups.joinGroupByIdPrompt'),
      [
        {
          text: t('common.cancel'),
          style: 'cancel',
        },
        {
          text: t('studyGroups.joinGroup'),
          onPress: async (groupId?: string) => {
            if (!groupId || groupId.trim() === '') {
              Alert.alert(t('common.error'), t('studyGroups.joinGroupByIdError'));
              return;
            }
            
            try {
              const success = await socialLearningService.joinStudyGroup(groupId.trim());
              if (success) {
                await loadStudyGroups();
                Alert.alert(t('common.success'), t('studyGroups.joinedGroupSuccess'));
              } else {
                Alert.alert(t('common.error'), t('studyGroups.groupNotFound'));
              }
            } catch (error) {
              console.error('Error joining group by ID:', error);
              Alert.alert(t('common.error'), t('studyGroups.joinedGroupError'));
            }
          },
        },
      ],
      'plain-text'
    );
  };

  const handleShareGroup = async (group: StudyGroup) => {
    try {
      // Map category keys to translated category names
      const getTranslatedCategory = (category: string) => {
        const categoryMap: { [key: string]: string } = {
          'productivity': t('studyGroups.categories.productivity'),
          'health': t('studyGroups.categories.health'),
          'learning': t('studyGroups.categories.learning'),
          'motivation': t('studyGroups.categories.motivation')
        };
        return categoryMap[category] || category;
      };

      const shareMessage = t('studyGroups.shareMessage', {
        groupName: group.name,
        description: group.description,
        category: getTranslatedCategory(group.category),
        currentMembers: group.currentMembers,
        maxMembers: group.maxMembers,
        groupId: group.id
      });
      
      await Share.share({
        message: shareMessage,
        title: t('studyGroups.shareTitle', { groupName: group.name })
      });
    } catch (error) {
      console.error('Error sharing group:', error);
    }
  };

  const handleInviteMembers = async (group: StudyGroup) => {
    try {
      // Map category keys to translated category names
      const getTranslatedCategory = (category: string) => {
        const categoryMap: { [key: string]: string } = {
          'productivity': t('studyGroups.categories.productivity'),
          'health': t('studyGroups.categories.health'),
          'learning': t('studyGroups.categories.learning'),
          'motivation': t('studyGroups.categories.motivation')
        };
        return categoryMap[category] || category;
      };

      const inviteMessage = t('studyGroups.inviteMessage', {
        groupName: group.name,
        description: group.description,
        category: getTranslatedCategory(group.category),
        currentMembers: group.currentMembers,
        maxMembers: group.maxMembers,
        groupId: group.id
      });
      
      await Share.share({
        message: inviteMessage,
        title: t('studyGroups.inviteTitle', { groupName: group.name })
      });
    } catch (error) {
      console.error('Error inviting members:', error);
    }
  };

  // Filter groups based on search and category
  const filteredGroups = studyGroups.filter(group => {
    const matchesSearch = group.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         group.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         group.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    
    // Map category IDs to actual category names for comparison
    const getCategoryName = (categoryId: string) => {
      const categoryMap: { [key: string]: string } = {
        'productivity': t('studyGroups.categories.productivity'),
        'health': t('studyGroups.categories.health'),
        'learning': t('studyGroups.categories.learning'),
        'motivation': t('studyGroups.categories.motivation')
      };
      return categoryMap[categoryId] || categoryId;
    };
    
    const matchesCategory = selectedCategory === 'all' || 
                           group.category.toLowerCase() === getCategoryName(selectedCategory).toLowerCase();
    
    return matchesSearch && matchesCategory;
  });



  const handleSendMessage = useCallback(async () => {
    if (!selectedGroup || !newMessage.trim()) return;

    const messageText = newMessage.trim();
    
    // Clear the input immediately for better UX
    setNewMessage('');
    setIsTyping(false);

    try {
      // Send the message
      await socialLearningService.sendChatMessage(selectedGroup.id, messageText);
      
      // Update only the selected group's chat messages
      const updatedGroups = await socialLearningService.getStudyGroups();
      const updatedSelectedGroup = updatedGroups.find(group => group.id === selectedGroup.id);
      
      if (updatedSelectedGroup) {
        setSelectedGroup(updatedSelectedGroup);
        setStudyGroups(updatedGroups);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      Alert.alert(t('common.error'), t('studyGroups.chat.sendError'));
      // Restore the message if sending failed
      setNewMessage(messageText);
    }
  }, [selectedGroup, newMessage]);

  const handleTyping = useCallback((text: string) => {
    setNewMessage(text);
    if (!isTyping && text.length > 0) {
      setIsTyping(true);
      // In a real implementation, you would emit typing status to other users
      setTimeout(() => setIsTyping(false), 3000);
    } else if (isTyping && text.length === 0) {
      setIsTyping(false);
    }
  }, [isTyping]);

  // Demo typing users for demonstration
  useEffect(() => {
    if (showChatModal && selectedGroup) {
      // Simulate other users typing
      const demoUsers = ['Alice', 'Bob', 'Charlie'];
      const randomUser = demoUsers[Math.floor(Math.random() * demoUsers.length)];
      
      const typingTimer = setTimeout(() => {
        setTypingUsers([randomUser]);
        setTimeout(() => setTypingUsers([]), 2000);
      }, 3000);
      
      return () => clearTimeout(typingTimer);
    }
  }, [showChatModal, selectedGroup]);

  const handleCreateSession = async () => {
    if (!selectedGroup || !newSessionData.title || !newSessionData.description) {
      Alert.alert(t('common.error'), t('studyGroups.sessions.fillRequiredFields'));
      return;
    }

    try {
      const sessionData = {
        groupId: selectedGroup.id,
        title: newSessionData.title,
        description: newSessionData.description,
        date: newSessionData.date,
        startTime: newSessionData.startTime,
        duration: newSessionData.duration,
        maxParticipants: newSessionData.maxParticipants,
        leader: user?.id || 'unknown',
        topics: newSessionData.topics,
        materials: newSessionData.materials,
        isCompleted: false
      };

      const newSession = await socialLearningService.createStudySession(selectedGroup.id, sessionData);
      await loadStudyGroups();
      setShowScheduleModal(false);
      
      // Reset form
      setNewSessionData({
        title: '',
        description: '',
        date: new Date().toISOString().split('T')[0],
        startTime: '10:00',
        duration: 60,
        maxParticipants: 10,
        topics: [],
        materials: []
      });
      
      Alert.alert(t('common.success'), t('studyGroups.sessions.sessionCreatedSuccess'));
    } catch (error) {
      console.error('Error creating study session:', error);
      Alert.alert(t('common.error'), t('studyGroups.sessions.sessionCreatedError'));
    }
  };

  const handleJoinSession = async (sessionId: string) => {
    if (!selectedGroup) return;

    try {
      const success = await socialLearningService.joinStudySession(selectedGroup.id, sessionId);
      if (success) {
        await loadStudyGroups();
        Alert.alert(t('common.success'), t('studyGroups.sessions.joinedSessionSuccess'));
      } else {
        Alert.alert(t('common.error'), t('studyGroups.sessions.joinedSessionError'));
      }
    } catch (error) {
      console.error('Error joining study session:', error);
      Alert.alert(t('common.error'), t('studyGroups.sessions.joinedSessionError'));
    }
  };

  const handleDeleteGroup = async (group: StudyGroup) => {
    // Only group leaders can delete groups
    if (group.createdBy !== user?.id) {
      Alert.alert(t('common.error'), t('studyGroups.onlyLeaderCanDelete'));
      return;
    }

    Alert.alert(
      t('studyGroups.deleteGroup'),
      t('studyGroups.deleteGroupConfirm', { groupName: group.name }),
      [
        {
          text: t('common.cancel'),
          style: 'cancel',
        },
        {
          text: t('studyGroups.deleteGroup'),
          style: 'destructive',
          onPress: async () => {
            try {
              const success = await socialLearningService.deleteStudyGroup(group.id);
              if (success) {
                // Remove it from the local state
                setStudyGroups(studyGroups.filter(g => g.id !== group.id));
                Alert.alert(t('common.success'), t('studyGroups.groupDeletedSuccess'));
              } else {
                Alert.alert(t('common.error'), t('studyGroups.groupDeletedError'));
              }
            } catch (error) {
              console.error('Error deleting group:', error);
              Alert.alert(t('common.error'), t('studyGroups.groupDeletedError'));
            }
          },
        },
      ]
    );
  };

  const renderGroupCard = (group: StudyGroup) => {
    const isGroupLeader = group.createdBy === user?.id;
    const isMember = group.members?.some(member => member.id === user?.id);
    
    // Map category keys to translated category names
    const getTranslatedCategory = (category: string) => {
      const categoryMap: { [key: string]: string } = {
        'productivity': t('studyGroups.categories.productivity'),
        'health': t('studyGroups.categories.health'),
        'learning': t('studyGroups.categories.learning'),
        'motivation': t('studyGroups.categories.motivation')
      };
      return categoryMap[category] || category;
    };
    
    // Map category key to category ID for styling
    const getCategoryId = (category: string) => {
      // Since we're now using consistent category keys, we can just return the category directly
      return category || 'productivity';
    };
    
    const categoryInfo = groupCategories.find(cat => cat.id === getCategoryId(group.category)) || groupCategories[0];
    
    return (
      <View key={group.id} style={styles.groupCard}>
                 <View style={styles.groupHeader}>
           <Text style={styles.groupName}>{group.name}</Text>
           <View style={styles.groupHeaderActions}>
             <View style={[styles.groupCategory, { backgroundColor: categoryInfo.color }]}>
               <Text style={styles.groupCategoryText}>{getTranslatedCategory(group.category)}</Text>
             </View>
             {isGroupLeader && (
               <View style={styles.leaderActionsContainer}>
                 <View style={styles.leaderBadge}>
                   <Crown size={12} color="#F59E0B" />
                   <Text style={styles.leaderText}>{t('studyGroups.groupCard.leader')}</Text>
                 </View>
                 <TouchableOpacity
                   style={styles.deleteButton}
                   onPress={() => handleDeleteGroup(group)}
                 >
                   <Trash2 size={16} color="#EF4444" />
                 </TouchableOpacity>
               </View>
             )}
           </View>
         </View>
        
        <Text style={styles.groupDescription}>{group.description}</Text>
        
        {/* Tags */}
        {group.tags.length > 0 && (
          <View style={styles.tagsContainer}>
            {group.tags.slice(0, 3).map((tag, index) => (
              <View key={index} style={styles.tag}>
                <Text style={styles.tagText}>#{tag}</Text>
              </View>
            ))}
            {group.tags.length > 3 && (
              <Text style={styles.moreTagsText}>+{group.tags.length - 3} {t('studyGroups.more')}</Text>
            )}
          </View>
        )}
        
                 <View style={styles.groupStats}>
           <View style={styles.statItem}>
             <Users size={16} color={currentTheme.colors.textSecondary} />
             <Text style={styles.statText}>
               {group.currentMembers}/{group.maxMembers} {t('studyGroups.groupCard.members')}
             </Text>
           </View>
           {group.analytics && (
             <View style={styles.statItem}>
               <Star size={16} color={currentTheme.colors.textSecondary} />
               <Text style={styles.statText}>
                 {group.analytics.completionRate}% {t('studyGroups.groupCard.completion')}
               </Text>
             </View>
           )}
         </View>
         
         {/* Upcoming Sessions Preview - On New Line */}
         {group.upcomingSessions && group.upcomingSessions.length > 0 && (
           <View style={styles.sessionsPreview}>
             <View style={styles.sessionsPreviewHeader}>
               <Calendar size={12} color={currentTheme.colors.primary} />
               <Text style={styles.sessionsPreviewTitle}>{t('studyGroups.groupCard.upcomingSessions')}</Text>
             </View>
             {group.upcomingSessions.slice(0, 2).map((session) => (
               <View key={session.id} style={styles.sessionPreviewCard}>
                 <View style={styles.sessionPreviewCardHeader}>
                   <Text style={styles.sessionPreviewCardTitle}>{session.title}</Text>
                   <View style={styles.sessionPreviewBadge}>
                     <Clock size={10} color={currentTheme.colors.primary} />
                     <Text style={styles.sessionPreviewBadgeText}>
                       {session.duration}{t('studyGroups.groupCard.min')}
                     </Text>
                   </View>
                 </View>
                 <View style={styles.sessionPreviewCardDetails}>
                   <View style={styles.sessionPreviewDateTime}>
                     <Calendar size={10} color={currentTheme.colors.textSecondary} />
                     <Text style={styles.sessionPreviewDateTimeText}>
                       {new Date(session.date).toLocaleDateString('en-US', { 
                         month: 'short', 
                         day: 'numeric' 
                       })}
                     </Text>
                   </View>
                   <View style={styles.sessionPreviewDateTime}>
                     <Clock size={10} color={currentTheme.colors.textSecondary} />
                     <Text style={styles.sessionPreviewDateTimeText}>
                       {session.startTime}
                     </Text>
                   </View>
                   {session.participants && session.participants.length > 0 && (
                     <View style={styles.sessionPreviewParticipants}>
                       <Users size={10} color={currentTheme.colors.textSecondary} />
                       <Text style={styles.sessionPreviewParticipantsText}>
                         {session.participants.length}/{session.maxParticipants}
                       </Text>
                     </View>
                   )}
                 </View>
               </View>
             ))}
             {group.upcomingSessions.length > 2 && (
               <TouchableOpacity style={styles.sessionsPreviewMore}>
                 <Text style={styles.sessionsPreviewMoreText}>
                   {t('studyGroups.groupCard.viewMoreSessions', { count: group.upcomingSessions.length - 2 })}
                 </Text>
                 <Text style={styles.sessionsPreviewMoreIcon}>→</Text>
               </TouchableOpacity>
             )}
           </View>
         )}

        <View style={styles.groupActions}>
          {!isMember ? (
            <TouchableOpacity
              style={[styles.actionButton, styles.joinButton]}
              onPress={() => handleJoinGroup(group.id)}
            >
              <UserPlus size={16} color="white" />
              <Text style={styles.joinButtonText}>{t('studyGroups.groupCard.joinGroup')}</Text>
            </TouchableOpacity>
                     ) : (
             <TouchableOpacity
               style={[styles.actionButton, styles.memberButton]}
               onPress={() => {
                 setSelectedGroup(group);
                 setShowMembersModal(true);
               }}
             >
               <Users size={16} color={currentTheme.colors.primary} />
             </TouchableOpacity>
           )}
          
          <TouchableOpacity
            style={[styles.actionButton, styles.chatButton]}
            onPress={() => {
              setSelectedGroup(group);
              setShowChatModal(true);
            }}
          >
            <MessageSquare size={16} color={currentTheme.colors.primary} />
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.actionButton, styles.shareButton]}
            onPress={() => handleShareGroup(group)}
          >
            <Share2 size={16} color={currentTheme.colors.primary} />
          </TouchableOpacity>
          
                     {isGroupLeader && (
             <TouchableOpacity
               style={[styles.actionButton, styles.inviteButton]}
               onPress={() => handleInviteMembers(group)}
             >
               <UserPlus size={16} color={currentTheme.colors.primary} />
             </TouchableOpacity>
           )}
           
           {isMember && (
             <TouchableOpacity
               style={[styles.actionButton, styles.scheduleButton]}
               onPress={() => {
                 setSelectedGroup(group);
                 setShowScheduleModal(true);
               }}
             >
               <Calendar size={16} color={currentTheme.colors.primary} />
             </TouchableOpacity>
           )}
        </View>
      </View>
    );
  };

  const renderChatMessage = ({ item }: { item: ChatMessage }) => {
    const isOwnMessage = item.userId === user?.id;
    const messageTime = new Date(item.timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
    
    return (
      <View style={[
        styles.chatMessage,
        isOwnMessage ? styles.ownMessage : styles.otherMessage
      ]}>
        {!isOwnMessage && (
          <View style={styles.messageHeader}>
            <View style={styles.messageAvatar}>
              <Text style={styles.messageAvatarText}>
                {item.userName.charAt(0).toUpperCase()}
              </Text>
            </View>
            <Text style={styles.chatMessageUser}>{item.userName}</Text>
          </View>
        )}
        
        <View style={[
          styles.messageBubble,
          isOwnMessage ? styles.ownMessageBubble : styles.otherMessageBubble
        ]}>
          <Text style={[
            styles.chatMessageText,
            isOwnMessage ? styles.ownMessageText : styles.otherMessageText
          ]}>
            {item.message}
          </Text>
        </View>
        
        <Text style={[
          styles.chatMessageTime,
          isOwnMessage ? styles.ownMessageTime : styles.otherMessageTime
        ]}>
          {messageTime}
        </Text>
      </View>
    );
  };

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
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderBottomWidth: 1,
      borderBottomColor: currentTheme.colors.border,
    },
    title: {
      fontSize: 24,
      fontWeight: 'bold',
      color: currentTheme.colors.text,
      marginVertical: 0,
    },
    content: {
      flex: 1,
      padding: 16,
    },
    groupCard: {
      backgroundColor: currentTheme.colors.card,
      borderRadius: 12,
      padding: 16,
      marginBottom: 16,
      borderWidth: 1,
      borderColor: currentTheme.colors.border,
    },
    groupHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: 8,
    },
    groupTitleContainer: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    groupName: {
      fontSize: 18,
      fontWeight: 'bold',
      color: currentTheme.colors.text,
      flex: 1,
    },
    
    groupCategory: {
      backgroundColor: currentTheme.colors.primary,
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 8,
      marginLeft: 8,
    },
         groupCategoryText: {
       color: currentTheme.colors.background,
       fontSize: 12,
       fontWeight: '500',
     },
     groupHeaderActions: {
       flexDirection: 'row',
       alignItems: 'center',
       gap: 8,
     },
     leaderActionsContainer: {
       flexDirection: 'row',
       alignItems: 'center',
       gap: 8,
     },
           leaderBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F59E0B20',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
        gap: 4,
        flex: 0,
        justifyContent: 'center',
      },
      leaderText: {
        fontSize: 10,
        fontWeight: '600',
        color: '#F59E0B',
      },
      deleteButton: {
        padding: 8,
        borderRadius: 6,
        backgroundColor: '#EF444415',
        flex: 0,
        alignItems: 'center',
        justifyContent: 'center',
      },
    groupDescription: {
      fontSize: 14,
      color: currentTheme.colors.textSecondary,
      marginBottom: 12,
      lineHeight: 20,
    },
    groupStats: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 12,
    },
    statItem: {
      flexDirection: 'row',
      alignItems: 'center',
      marginRight: 16,
    },
    statText: {
      fontSize: 12,
      color: currentTheme.colors.textSecondary,
      marginLeft: 4,
    },
    tagsContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      alignItems: 'center',
      marginBottom: 12,
      gap: 6,
    },
    tag: {
      backgroundColor: currentTheme.colors.primary + '20',
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 12,
    },
    tagText: {
      fontSize: 11,
      color: currentTheme.colors.primary,
      fontWeight: '500',
    },
    moreTagsText: {
      fontSize: 11,
      color: currentTheme.colors.textSecondary,
      fontStyle: 'italic',
    },
    groupActions: {
      flexDirection: 'row',
      gap: 8,
    },
    actionButton: {
      flex: 1,
      paddingVertical: 8,
      paddingHorizontal: 12,
      borderRadius: 8,
      alignItems: 'center',
      justifyContent: 'center',
    },
    joinButton: {
      backgroundColor: currentTheme.colors.primary,
    },
    joinButtonText: {
      color: currentTheme.colors.background,
      fontSize: 14,
      fontWeight: '600',
    },
    chatButton: {
      backgroundColor: currentTheme.colors.surface,
      borderWidth: 1,
      borderColor: currentTheme.colors.border,
    },
    analyticsButton: {
      backgroundColor: currentTheme.colors.surface,
      borderWidth: 1,
      borderColor: currentTheme.colors.border,
    },
         memberButton: {
       backgroundColor: currentTheme.colors.surface,
       borderWidth: 1,
       borderColor: currentTheme.colors.border,
       alignItems: 'center',
       justifyContent: 'center',
     },
    shareButton: {
      backgroundColor: currentTheme.colors.surface,
      borderWidth: 1,
      borderColor: currentTheme.colors.border,
    },
         inviteButton: {
       backgroundColor: currentTheme.colors.surface,
       borderWidth: 1,
       borderColor: currentTheme.colors.border,
     },
     scheduleButton: {
       backgroundColor: currentTheme.colors.surface,
       borderWidth: 1,
       borderColor: currentTheme.colors.border,
     },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    loadingText: {
      fontSize: 16,
      color: currentTheme.colors.textSecondary,
      marginTop: 8,
    },
    chatMessage: {
      marginBottom: 12,
      paddingHorizontal: 16,
    },
    ownMessage: {
      alignItems: 'flex-end',
    },
    otherMessage: {
      alignItems: 'flex-start',
    },
    messageHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 4,
    },
    messageAvatar: {
      width: 24,
      height: 24,
      borderRadius: 12,
      backgroundColor: currentTheme.colors.primary,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 6,
    },
    messageAvatarText: {
      fontSize: 10,
      fontWeight: 'bold',
      color: 'white',
    },
    chatMessageUser: {
      fontSize: 11,
      fontWeight: '600',
      color: currentTheme.colors.textSecondary,
    },
    messageBubble: {
      maxWidth: '80%',
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 16,
      marginBottom: 2,
    },
    ownMessageBubble: {
      backgroundColor: currentTheme.colors.primary,
      borderBottomRightRadius: 4,
    },
    otherMessageBubble: {
      backgroundColor: currentTheme.colors.card,
      borderBottomLeftRadius: 4,
      borderWidth: 1,
      borderColor: currentTheme.colors.border,
    },
    chatMessageText: {
      fontSize: 14,
      lineHeight: 18,
    },
    ownMessageText: {
      color: 'white',
    },
    otherMessageText: {
      color: currentTheme.colors.text,
    },
    chatMessageTime: {
      fontSize: 10,
      marginTop: 2,
    },
    ownMessageTime: {
      color: currentTheme.colors.textSecondary,
      textAlign: 'right',
    },
    otherMessageTime: {
      color: currentTheme.colors.textSecondary,
      textAlign: 'left',
    },
    input: {
      height: 50,
      borderRadius: 8,
      paddingHorizontal: 12,
      marginBottom: 16,
      borderWidth: 1,
      borderColor: currentTheme.colors.border,
    },
    chatInputContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 12,
      borderTopWidth: 1,
      borderTopColor: currentTheme.colors.border,
    },
    chatInput: {
      flex: 1,
      height: 40,
      borderRadius: 8,
      paddingHorizontal: 12,
      borderWidth: 1,
      borderColor: currentTheme.colors.border,
      marginRight: 8,
    },
    sendButton: {
      padding: 8,
    },
    searchContainer: {
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: currentTheme.colors.border,
    },
    searchInputContainer: {
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
      height: 44,
      marginLeft: 8,
      fontSize: 16,
      color: currentTheme.colors.text,
    },
    categoryContainer: {
      borderBottomWidth: 1,
      borderBottomColor: currentTheme.colors.border,
      maxHeight: 60,
    },
    categoryContent: {
      paddingHorizontal: 16,
      paddingVertical: 8,
      gap: 6,
    },
    categoryPill: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: currentTheme.colors.border,
      backgroundColor: currentTheme.colors.surface,
      gap: 4,
      marginRight: 8,
    },
    categoryPillText: {
      fontSize: 12,
      fontWeight: '500',
      color: currentTheme.colors.text,
    },
    emptyContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingVertical: 60,
    },
    emptyTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      color: currentTheme.colors.text,
      marginTop: 16,
      marginBottom: 8,
    },
    emptySubtitle: {
      fontSize: 14,
      color: currentTheme.colors.textSecondary,
      textAlign: 'center',
      marginBottom: 24,
      paddingHorizontal: 32,
    },
    memberCard: {
      backgroundColor: currentTheme.colors.card,
      borderRadius: 12,
      padding: 16,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: currentTheme.colors.border,
    },
    memberInfo: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 8,
    },
    memberAvatar: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: currentTheme.colors.primary,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 12,
    },
    memberInitial: {
      fontSize: 16,
      fontWeight: 'bold',
      color: 'white',
    },
    memberDetails: {
      flex: 1,
    },
    memberName: {
      fontSize: 16,
      fontWeight: '600',
      color: currentTheme.colors.text,
      marginBottom: 2,
    },
    memberRole: {
      fontSize: 12,
      color: currentTheme.colors.textSecondary,
      textTransform: 'capitalize',
    },
    memberStats: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    memberScore: {
      fontSize: 12,
      color: currentTheme.colors.primary,
      fontWeight: '500',
    },
    memberJoined: {
      fontSize: 11,
      color: currentTheme.colors.textSecondary,
    },
    groupsListContainer: {
      flex: 1,
      backgroundColor: currentTheme.colors.background,
    },
    groupsScrollView: {
      flex: 1,
      paddingHorizontal: 16,
    },
    groupsContentContainer: {
      paddingVertical: 16,
      paddingBottom: 32,
    },
    chatList: {
      flex: 1,
      backgroundColor: currentTheme.colors.background,
    },
    chatListContent: {
      paddingVertical: 16,
    },
    typingIndicator: {
      paddingHorizontal: 16,
      paddingVertical: 8,
    },
    typingBubble: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: currentTheme.colors.card,
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: currentTheme.colors.border,
      maxWidth: '80%',
    },
    typingText: {
      fontSize: 12,
      color: currentTheme.colors.textSecondary,
      marginRight: 8,
    },
    typingDots: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    typingDot: {
      width: 4,
      height: 4,
      borderRadius: 2,
      backgroundColor: currentTheme.colors.textSecondary,
      marginHorizontal: 1,
    },
    typingDot1: {
      opacity: 0.4,
    },
    typingDot2: {
      opacity: 0.7,
    },
         typingDot3: {
       opacity: 1,
     },
     sessionFormRow: {
       flexDirection: 'row',
       gap: 12,
       marginBottom: 16,
     },
     sessionFormField: {
       flex: 1,
     },
     sessionFormLabel: {
       fontSize: 14,
       fontWeight: '600',
       color: currentTheme.colors.text,
       marginBottom: 8,
     },
                  sessionsPreview: {
         marginTop: 8,
         paddingTop: 8,
         borderTopWidth: 1,
         borderTopColor: currentTheme.colors.border,
       },
       sessionsPreviewHeader: {
         flexDirection: 'row',
         alignItems: 'center',
         marginBottom: 8,
         gap: 4,
       },
       sessionsPreviewTitle: {
         fontSize: 12,
         fontWeight: '600',
         color: currentTheme.colors.text,
       },
             sessionPreviewCard: {
         backgroundColor: currentTheme.colors.surface,
         borderRadius: 6,
         padding: 8,
         marginBottom: 6,
         borderWidth: 1,
         borderColor: currentTheme.colors.border,
       },
       sessionPreviewCardHeader: {
         flexDirection: 'row',
         justifyContent: 'space-between',
         alignItems: 'center',
         marginBottom: 4,
       },
       sessionPreviewCardTitle: {
         fontSize: 12,
         fontWeight: '600',
         color: currentTheme.colors.text,
         flex: 1,
         marginRight: 6,
       },
       sessionPreviewBadge: {
         flexDirection: 'row',
         alignItems: 'center',
         backgroundColor: currentTheme.colors.primary + '15',
         paddingHorizontal: 4,
         paddingVertical: 1,
         borderRadius: 3,
         gap: 1,
       },
       sessionPreviewBadgeText: {
         fontSize: 9,
         fontWeight: '500',
         color: currentTheme.colors.primary,
       },
       sessionPreviewCardDetails: {
         flexDirection: 'row',
         alignItems: 'center',
         gap: 8,
         flexWrap: 'wrap',
       },
             sessionPreviewDateTime: {
         flexDirection: 'row',
         alignItems: 'center',
         gap: 2,
       },
       sessionPreviewDateTimeText: {
         fontSize: 10,
         color: currentTheme.colors.textSecondary,
       },
       sessionPreviewParticipants: {
         flexDirection: 'row',
         alignItems: 'center',
         gap: 2,
       },
       sessionPreviewParticipantsText: {
         fontSize: 10,
         color: currentTheme.colors.textSecondary,
       },
      sessionsPreviewMore: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 8,
        marginTop: 4,
        gap: 4,
      },
      sessionsPreviewMoreText: {
        fontSize: 12,
        color: currentTheme.colors.primary,
        fontWeight: '500',
      },
           sessionsPreviewMoreIcon: {
       fontSize: 12,
       color: currentTheme.colors.primary,
       fontWeight: 'bold',
     },
     headerActions: {
       flexDirection: 'row',
       alignItems: 'center',
       gap: 12,
     },
     headerActionButton: {
       padding: 4,
       borderRadius: 6,
       backgroundColor: currentTheme.colors.surface,
       borderWidth: 1,
       borderColor: currentTheme.colors.border,
     },
     // Form Styles
     formSection: {
       marginBottom: 24,
     },
     sectionTitle: {
       fontSize: 18,
       fontWeight: 'bold',
       color: currentTheme.colors.text,
       marginBottom: 16,
       paddingBottom: 8,
       borderBottomWidth: 1,
       borderBottomColor: currentTheme.colors.border,
     },
     formField: {
       marginBottom: 16,
     },
     fieldLabel: {
       fontSize: 14,
       fontWeight: '600',
       color: currentTheme.colors.text,
       marginBottom: 8,
     },
     formInput: {
       height: 48,
       borderRadius: 8,
       paddingHorizontal: 12,
       borderWidth: 1,
       borderColor: currentTheme.colors.border,
       fontSize: 16,
     },
     textArea: {
       height: 80,
       paddingTop: 12,
       paddingBottom: 12,
       textAlignVertical: 'top',
     },
     inputError: {
       borderColor: '#EF4444',
       borderWidth: 2,
     },
     errorText: {
       fontSize: 12,
       color: '#EF4444',
       marginTop: 4,
       marginLeft: 4,
     },
     pickerContainer: {
       marginTop: 4,
     },
     pickerButton: {
       flexDirection: 'row',
       justifyContent: 'space-between',
       alignItems: 'center',
       height: 48,
       borderRadius: 8,
      paddingHorizontal: 12,
      borderWidth: 1,
     },
     pickerButtonText: {
       fontSize: 16,
       fontWeight: '500',
     },
     radioContainer: {
       flexDirection: 'row',
       gap: 16,
       marginTop: 8,
     },
     radioButton: {
       flexDirection: 'row',
       alignItems: 'center',
       paddingVertical: 8,
       paddingHorizontal: 12,
       borderRadius: 8,
       borderWidth: 1,
       borderColor: currentTheme.colors.border,
       backgroundColor: currentTheme.colors.surface,
     },
     radioButtonSelected: {
       backgroundColor: currentTheme.colors.primary + '20',
       borderColor: currentTheme.colors.primary,
     },
     radioCircle: {
       width: 16,
       height: 16,
       borderRadius: 8,
       borderWidth: 2,
       borderColor: currentTheme.colors.border,
       marginRight: 8,
     },
     radioCircleSelected: {
       borderColor: currentTheme.colors.primary,
       backgroundColor: currentTheme.colors.primary,
     },
     radioLabel: {
       fontSize: 14,
       fontWeight: '500',
     },
     submitSection: {
       marginTop: 32,
       marginBottom: 32,
     },
     submitButton: {
       height: 56,
       borderRadius: 12,
       alignItems: 'center',
       justifyContent: 'center',
       shadowColor: '#000',
       shadowOffset: { width: 0, height: 2 },
       shadowOpacity: 0.1,
       shadowRadius: 4,
       elevation: 3,
     },
     submitButtonDisabled: {
       opacity: 0.6,
     },
     submitButtonText: {
       fontSize: 18,
       fontWeight: 'bold',
       color: 'white',
     },
   });

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>{t('studyGroups.loading')}</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.mainScrollView}
        showsVerticalScrollIndicator={true}
        nestedScrollEnabled={true}
        bounces={true}
        overScrollMode="always"
        contentContainerStyle={styles.mainScrollContent}
      >
        <View style={styles.header}>
          <Text style={styles.title}>{t('studyGroups.title')}</Text>
          <View style={styles.headerActions}>
            <TouchableOpacity
              style={styles.headerActionButton}
              onPress={() => setShowCreateModal(true)}
            >
              <Plus size={24} color={currentTheme.colors.primary} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Search and Filter Section */}
        <View style={styles.searchContainer}>
          <View style={styles.searchInputContainer}>
            <Search size={20} color={currentTheme.colors.textSecondary} />
            <TextInput
              style={styles.searchInput}
              placeholder={t('studyGroups.searchPlaceholder')}
              placeholderTextColor={currentTheme.colors.textSecondary}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>
        </View>

        {/* Category Filters */}
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          style={styles.categoryContainer}
          contentContainerStyle={styles.categoryContent}
        >
          {groupCategories.map((category) => {
            const CategoryIcon = category.icon;
            const isSelected = selectedCategory === category.id;
            
            return (
              <TouchableOpacity
                key={category.id}
                style={[
                  styles.categoryPill,
                  isSelected && { backgroundColor: category.color }
                ]}
                onPress={() => setSelectedCategory(category.id)}
              >
                <CategoryIcon 
                  size={14} 
                  color={isSelected ? 'white' : category.color} 
                />
                <Text style={[
                  styles.categoryPillText,
                  isSelected && { color: 'white' }
                ]}>
                  {category.name}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Groups List */}
        <View style={styles.groupsListContainer}>
          {filteredGroups.length > 0 ? (
            filteredGroups.map(renderGroupCard)
          ) : (
            <View style={styles.emptyContainer}>
              <Users2 size={48} color={currentTheme.colors.textSecondary} />
              <Text style={styles.emptyTitle}>{t('studyGroups.noGroupsFound')}</Text>
              <Text style={styles.emptySubtitle}>
                {searchQuery || selectedCategory !== 'all' 
                  ? t('studyGroups.noGroupsFoundWithFilters')
                  : t('studyGroups.createFirstGroup')
                }
              </Text>
              {!searchQuery && selectedCategory === 'all' && (
                <TouchableOpacity
                  style={[styles.actionButton, styles.joinButton]}
                  onPress={() => setShowCreateModal(true)}
                >
                  <Plus size={20} color="white" />
                  <Text style={styles.joinButtonText}>{t('studyGroups.createStudyGroup')}</Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>
      </ScrollView>

      {/* Create Group Modal */}
      <Modal
        visible={showCreateModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={[styles.container, { backgroundColor: currentTheme.colors.background }]}>
          <View style={styles.header}>
            <Text style={styles.title}>{t('studyGroups.createStudyGroup')}</Text>
            <TouchableOpacity onPress={() => setShowCreateModal(false)}>
              <Text style={{ color: currentTheme.colors.text, fontSize: 24 }}>✕</Text>
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {/* Group Details Section */}
            <View style={styles.formSection}>
              <Text style={styles.sectionTitle}>{t('studyGroups.groupDetails')}</Text>
              
              <View style={styles.formField}>
                <Text style={styles.fieldLabel}>{t('studyGroups.groupName')}</Text>
                <TextInput
                  style={[
                    styles.formInput,
                    { backgroundColor: currentTheme.colors.card, color: currentTheme.colors.text },
                    formErrors.name && styles.inputError
                  ]}
                  placeholder={t('studyGroups.groupNamePlaceholder')}
                  placeholderTextColor={currentTheme.colors.textSecondary}
                  value={newGroupData.name}
                  onChangeText={(text) => {
                    setNewGroupData({ ...newGroupData, name: text });
                    if (formErrors.name) setFormErrors({ ...formErrors, name: '' });
                  }}
                />
                {formErrors.name && <Text style={styles.errorText}>{formErrors.name}</Text>}
              </View>
              
              <View style={styles.formField}>
                <Text style={styles.fieldLabel}>{t('studyGroups.description')}</Text>
                <TextInput
                  style={[
                    styles.formInput,
                    styles.textArea,
                    { backgroundColor: currentTheme.colors.card, color: currentTheme.colors.text },
                    formErrors.description && styles.inputError
                  ]}
                  placeholder={t('studyGroups.descriptionPlaceholder')}
                  placeholderTextColor={currentTheme.colors.textSecondary}
                  value={newGroupData.description}
                  onChangeText={(text) => {
                    setNewGroupData({ ...newGroupData, description: text });
                    if (formErrors.description) setFormErrors({ ...formErrors, description: '' });
                  }}
                  multiline
                  numberOfLines={4}
                />
                {formErrors.description && <Text style={styles.errorText}>{formErrors.description}</Text>}
              </View>
              
              <View style={styles.formField}>
                <Text style={styles.fieldLabel}>{t('studyGroups.category')}</Text>
                <View style={styles.pickerContainer}>
                  <TouchableOpacity
                    style={[
                      styles.pickerButton,
                      { backgroundColor: currentTheme.colors.card, borderColor: currentTheme.colors.border }
                    ]}
                    onPress={() => {
                      Alert.alert(
                        t('studyGroups.selectCategory'),
                        t('studyGroups.selectCategoryPrompt'),
                        [
                          { text: t('common.cancel'), style: 'cancel' },
                          { text: t('studyGroups.categories.productivity'), onPress: () => setNewGroupData({ ...newGroupData, category: 'productivity' }) },
                          { text: t('studyGroups.categories.health'), onPress: () => setNewGroupData({ ...newGroupData, category: 'health' }) },
                          { text: t('studyGroups.categories.learning'), onPress: () => setNewGroupData({ ...newGroupData, category: 'learning' }) },
                          { text: t('studyGroups.categories.motivation'), onPress: () => setNewGroupData({ ...newGroupData, category: 'motivation' }) }
                        ]
                      );
                    }}
                  >
                    <Text style={[styles.pickerButtonText, { color: currentTheme.colors.text }]}>
                      {newGroupData.category === 'productivity' ? t('studyGroups.categories.productivity') :
                       newGroupData.category === 'health' ? t('studyGroups.categories.health') :
                       newGroupData.category === 'learning' ? t('studyGroups.categories.learning') :
                       newGroupData.category === 'motivation' ? t('studyGroups.categories.motivation') :
                       newGroupData.category}
                    </Text>
                    <ChevronRight size={16} color={currentTheme.colors.textSecondary} />
                  </TouchableOpacity>
                </View>
              </View>
              
              <View style={styles.formField}>
                <Text style={styles.fieldLabel}>{t('studyGroups.maxMembers')}</Text>
                <TextInput
                  style={[
                    styles.formInput,
                    { backgroundColor: currentTheme.colors.card, color: currentTheme.colors.text },
                    formErrors.maxMembers && styles.inputError
                  ]}
                  placeholder={t('studyGroups.maxMembersPlaceholder')}
                  placeholderTextColor={currentTheme.colors.textSecondary}
                  value={newGroupData.maxMembers.toString()}
                  onChangeText={(text) => {
                    const value = parseInt(text) || 15;
                    setNewGroupData({ ...newGroupData, maxMembers: value });
                    if (formErrors.maxMembers) setFormErrors({ ...formErrors, maxMembers: '' });
                  }}
                  keyboardType="numeric"
                />
                {formErrors.maxMembers && <Text style={styles.errorText}>{formErrors.maxMembers}</Text>}
              </View>
            </View>

            {/* Meeting Information Section */}
            <View style={styles.formSection}>
              <Text style={styles.sectionTitle}>{t('studyGroups.meetingInformation')}</Text>
              
              <View style={styles.formField}>
                <Text style={styles.fieldLabel}>{t('studyGroups.meetingFrequency')}</Text>
                <View style={styles.pickerContainer}>
                  <TouchableOpacity
                    style={[
                      styles.pickerButton,
                      { backgroundColor: currentTheme.colors.card, borderColor: currentTheme.colors.border }
                    ]}
                    onPress={() => {
                      Alert.alert(
                        t('studyGroups.selectFrequency'),
                        t('studyGroups.selectFrequencyPrompt'),
                        [
                          { text: t('common.cancel'), style: 'cancel' },
                          { text: t('studyGroups.frequencies.daily'), onPress: () => setNewGroupData({ 
                            ...newGroupData, 
                            meetingSchedule: { ...newGroupData.meetingSchedule, frequency: 'daily' }
                          }) },
                          { text: t('studyGroups.frequencies.weekly'), onPress: () => setNewGroupData({ 
                            ...newGroupData, 
                            meetingSchedule: { ...newGroupData.meetingSchedule, frequency: 'weekly' }
                          }) },
                          { text: t('studyGroups.frequencies.biweekly'), onPress: () => setNewGroupData({ 
                            ...newGroupData, 
                            meetingSchedule: { ...newGroupData.meetingSchedule, frequency: 'biweekly' }
                          }) },
                          { text: t('studyGroups.frequencies.monthly'), onPress: () => setNewGroupData({ 
                            ...newGroupData, 
                            meetingSchedule: { ...newGroupData.meetingSchedule, frequency: 'monthly' }
                          }) }
                        ]
                      );
                    }}
                  >
                    <Text style={[styles.pickerButtonText, { color: currentTheme.colors.text }]}>
                      {newGroupData.meetingSchedule.frequency.charAt(0).toUpperCase() + newGroupData.meetingSchedule.frequency.slice(1)}
                    </Text>
                    <ChevronRight size={16} color={currentTheme.colors.textSecondary} />
                  </TouchableOpacity>
                </View>
              </View>
              
              <View style={styles.formField}>
                <Text style={styles.fieldLabel}>{t('studyGroups.meetingTime')}</Text>
                <TextInput
                  style={[
                    styles.formInput,
                    { backgroundColor: currentTheme.colors.card, color: currentTheme.colors.text }
                  ]}
                  placeholder={t('studyGroups.meetingTimePlaceholder')}
                  placeholderTextColor={currentTheme.colors.textSecondary}
                  value={newGroupData.meetingSchedule.time}
                  onChangeText={(text) => setNewGroupData({ 
                    ...newGroupData, 
                    meetingSchedule: { ...newGroupData.meetingSchedule, time: text }
                  })}
                />
              </View>
              
              <View style={styles.formField}>
                <Text style={styles.fieldLabel}>{t('studyGroups.duration')}</Text>
                <TextInput
                  style={[
                    styles.formInput,
                    { backgroundColor: currentTheme.colors.card, color: currentTheme.colors.text }
                  ]}
                  placeholder={t('studyGroups.durationPlaceholder')}
                  placeholderTextColor={currentTheme.colors.textSecondary}
                  value={newGroupData.meetingSchedule.duration.toString()}
                  onChangeText={(text) => {
                    const value = parseInt(text) || 60;
                    setNewGroupData({ 
                      ...newGroupData, 
                      meetingSchedule: { ...newGroupData.meetingSchedule, duration: value }
                    });
                  }}
                  keyboardType="numeric"
                />
              </View>
            </View>

            {/* Location Section */}
            <View style={styles.formSection}>
              <Text style={styles.sectionTitle}>{t('studyGroups.location')}</Text>
              
              <View style={styles.formField}>
                <Text style={styles.fieldLabel}>{t('studyGroups.meetingType')}</Text>
                <View style={styles.radioContainer}>
                  <TouchableOpacity
                    style={[
                      styles.radioButton,
                      newGroupData.location.type === 'virtual' && styles.radioButtonSelected
                    ]}
                    onPress={() => setNewGroupData({ 
                      ...newGroupData, 
                      location: { ...newGroupData.location, type: 'virtual' }
                    })}
                  >
                    <View style={[
                      styles.radioCircle,
                      newGroupData.location.type === 'virtual' && styles.radioCircleSelected
                    ]} />
                    <Text style={[styles.radioLabel, { color: currentTheme.colors.text }]}>{t('studyGroups.virtual')}</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    style={[
                      styles.radioButton,
                      newGroupData.location.type === 'physical' && styles.radioButtonSelected
                    ]}
                    onPress={() => setNewGroupData({ 
                      ...newGroupData, 
                      location: { ...newGroupData.location, type: 'physical' }
                    })}
                  >
                    <View style={[
                      styles.radioCircle,
                      newGroupData.location.type === 'physical' && styles.radioCircleSelected
                    ]} />
                    <Text style={[styles.radioLabel, { color: currentTheme.colors.text }]}>{t('studyGroups.physical')}</Text>
                  </TouchableOpacity>
                </View>
              </View>
              
              {newGroupData.location.type === 'virtual' && (
                <View style={styles.formField}>
                  <Text style={styles.fieldLabel}>{t('studyGroups.meetingLink')}</Text>
                  <TextInput
                    style={[
                      styles.formInput,
                      { backgroundColor: currentTheme.colors.card, color: currentTheme.colors.text },
                      formErrors.meetingLink && styles.inputError
                    ]}
                    placeholder={t('studyGroups.meetingLinkPlaceholder')}
                    placeholderTextColor={currentTheme.colors.textSecondary}
                    value={newGroupData.location.meetingLink}
                    onChangeText={(text) => {
                      setNewGroupData({ 
                        ...newGroupData, 
                        location: { ...newGroupData.location, meetingLink: text }
                      });
                      if (formErrors.meetingLink) setFormErrors({ ...formErrors, meetingLink: '' });
                    }}
                  />
                  {formErrors.meetingLink && <Text style={styles.errorText}>{formErrors.meetingLink}</Text>}
                </View>
              )}
              
              {newGroupData.location.type === 'physical' && (
                <View style={styles.formField}>
                  <Text style={styles.fieldLabel}>{t('studyGroups.address')}</Text>
                  <TextInput
                    style={[
                      styles.formInput,
                      styles.textArea,
                      { backgroundColor: currentTheme.colors.card, color: currentTheme.colors.text },
                      formErrors.address && styles.inputError
                    ]}
                    placeholder={t('studyGroups.addressPlaceholder')}
                    placeholderTextColor={currentTheme.colors.textSecondary}
                    value={newGroupData.location.address}
                    onChangeText={(text) => {
                      setNewGroupData({ 
                        ...newGroupData, 
                        location: { ...newGroupData.location, address: text }
                      });
                      if (formErrors.address) setFormErrors({ ...formErrors, address: '' });
                    }}
                    multiline
                    numberOfLines={3}
                  />
                  {formErrors.address && <Text style={styles.errorText}>{formErrors.address}</Text>}
                </View>
              )}
            </View>

            {/* Contact Information Section */}
            <View style={styles.formSection}>
              <Text style={styles.sectionTitle}>{t('studyGroups.modals.contactInformation')}</Text>
              
              <View style={styles.formField}>
                <Text style={styles.fieldLabel}>{t('studyGroups.modals.email')}</Text>
                <TextInput
                  style={[
                    styles.formInput,
                    { backgroundColor: currentTheme.colors.card, color: currentTheme.colors.text },
                    formErrors.email && styles.inputError
                  ]}
                  placeholder={t('studyGroups.modals.emailPlaceholder')}
                  placeholderTextColor={currentTheme.colors.textSecondary}
                  value={newGroupData.contactInfo.email}
                  onChangeText={(text) => {
                    setNewGroupData({ 
                      ...newGroupData, 
                      contactInfo: { ...newGroupData.contactInfo, email: text }
                    });
                    if (formErrors.email) setFormErrors({ ...formErrors, email: '' });
                  }}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
                {formErrors.email && <Text style={styles.errorText}>{formErrors.email}</Text>}
              </View>
              
              <View style={styles.formField}>
                <Text style={styles.fieldLabel}>{t('studyGroups.modals.phone')}</Text>
                <TextInput
                  style={[
                    styles.formInput,
                    { backgroundColor: currentTheme.colors.card, color: currentTheme.colors.text }
                  ]}
                  placeholder={t('studyGroups.modals.phonePlaceholder')}
                  placeholderTextColor={currentTheme.colors.textSecondary}
                  value={newGroupData.contactInfo.phone}
                  onChangeText={(text) => setNewGroupData({ 
                    ...newGroupData, 
                    contactInfo: { ...newGroupData.contactInfo, phone: text }
                  })}
                  keyboardType="phone-pad"
                />
              </View>
            </View>

            {/* Group Settings Section */}
            <View style={styles.formSection}>
              <Text style={styles.sectionTitle}>{t('studyGroups.modals.groupSettings')}</Text>
              
              <View style={styles.formField}>
                <Text style={styles.fieldLabel}>{t('studyGroups.modals.difficultyLevel')}</Text>
                <View style={styles.pickerContainer}>
                  <TouchableOpacity
                    style={[
                      styles.pickerButton,
                      { backgroundColor: currentTheme.colors.card, borderColor: currentTheme.colors.border }
                    ]}
                    onPress={() => {
                      Alert.alert(
                        t('studyGroups.modals.selectLevel'),
                        t('studyGroups.modals.selectLevelPrompt'),
                        [
                          { text: t('common.cancel'), style: 'cancel' },
                          { text: t('studyGroups.beginner'), onPress: () => setNewGroupData({ ...newGroupData, level: 'beginner' }) },
                          { text: t('studyGroups.intermediate'), onPress: () => setNewGroupData({ ...newGroupData, level: 'intermediate' }) },
                          { text: t('studyGroups.advanced'), onPress: () => setNewGroupData({ ...newGroupData, level: 'advanced' }) }
                        ]
                      );
                    }}
                  >
                    <Text style={[styles.pickerButtonText, { color: currentTheme.colors.text }]}>
                      {newGroupData.level.charAt(0).toUpperCase() + newGroupData.level.slice(1)}
                    </Text>
                    <ChevronRight size={16} color={currentTheme.colors.textSecondary} />
                  </TouchableOpacity>
                </View>
              </View>
              
              <View style={styles.formField}>
                <Text style={styles.fieldLabel}>{t('studyGroups.modals.commitmentLevel')}</Text>
                <View style={styles.pickerContainer}>
                  <TouchableOpacity
                    style={[
                      styles.pickerButton,
                      { backgroundColor: currentTheme.colors.card, borderColor: currentTheme.colors.border }
                    ]}
                    onPress={() => {
                      Alert.alert(
                        t('studyGroups.modals.selectCommitment'),
                        t('studyGroups.modals.selectCommitmentPrompt'),
                        [
                          { text: t('common.cancel'), style: 'cancel' },
                          { text: t('studyGroups.casual'), onPress: () => setNewGroupData({ ...newGroupData, commitment: 'casual' }) },
                          { text: t('studyGroups.moderate'), onPress: () => setNewGroupData({ ...newGroupData, commitment: 'moderate' }) },
                          { text: t('studyGroups.intensive'), onPress: () => setNewGroupData({ ...newGroupData, commitment: 'intensive' }) }
                        ]
                      );
                    }}
                  >
                    <Text style={[styles.pickerButtonText, { color: currentTheme.colors.text }]}>
                      {newGroupData.commitment.charAt(0).toUpperCase() + newGroupData.commitment.slice(1)}
                    </Text>
                    <ChevronRight size={16} color={currentTheme.colors.textSecondary} />
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            {/* Submit Button */}
            <View style={styles.submitSection}>
              <TouchableOpacity
                style={[
                  styles.submitButton,
                  { backgroundColor: currentTheme.colors.primary },
                  isSubmitting && styles.submitButtonDisabled
                ]}
                onPress={handleCreateGroup}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <ActivityIndicator color="white" size="small" />
                ) : (
                  <Text style={styles.submitButtonText}>{t('studyGroups.createGroup')}</Text>
                )}
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </Modal>

      {/* Chat Modal */}
      <Modal
        visible={showChatModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowChatModal(false)}
      >
        <View style={[styles.container, { backgroundColor: currentTheme.colors.background }]}>
          <View style={styles.header}>
            <Text style={styles.title}>{selectedGroup?.name} - {t('studyGroups.chat.title')}</Text>
            <TouchableOpacity onPress={() => setShowChatModal(false)}>
              <Text style={{ color: currentTheme.colors.text, fontSize: 24 }}>✕</Text>
            </TouchableOpacity>
          </View>
          
          <FlatList
            data={selectedGroup?.chatMessages || []}
            renderItem={renderChatMessage}
            keyExtractor={(item) => item.id}
            style={styles.chatList}
            contentContainerStyle={styles.chatListContent}
            showsVerticalScrollIndicator={false}
            inverted={false}
          />
          
          {/* Typing Indicator */}
          {typingUsers.length > 0 && (
            <View style={styles.typingIndicator}>
              <View style={styles.typingBubble}>
                <Text style={styles.typingText}>
                  {typingUsers.length === 1 
                    ? t('studyGroups.chat.typing', { user: typingUsers[0] })
                    : `${typingUsers.length} people are typing...`
                  }
                </Text>
                <View style={styles.typingDots}>
                  <View style={[styles.typingDot, styles.typingDot1]} />
                  <View style={[styles.typingDot, styles.typingDot2]} />
                  <View style={[styles.typingDot, styles.typingDot3]} />
                </View>
              </View>
            </View>
          )}
          
          <View style={styles.chatInputContainer}>
            <TextInput
              style={[styles.chatInput, { backgroundColor: currentTheme.colors.card, color: currentTheme.colors.text }]}
              placeholder={t('studyGroups.chat.placeholder')}
              placeholderTextColor={currentTheme.colors.textSecondary}
              value={newMessage}
              onChangeText={handleTyping}
              multiline
              maxLength={500}
              blurOnSubmit={false}
              returnKeyType="default"
            />
            <TouchableOpacity
              style={styles.sendButton}
              onPress={handleSendMessage}
              disabled={!newMessage.trim()}
            >
              <Send size={20} color={newMessage.trim() ? currentTheme.colors.primary : currentTheme.colors.textSecondary} />
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Members Modal */}
      <Modal
        visible={showMembersModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={[styles.container, { backgroundColor: currentTheme.colors.background }]}>
          <View style={styles.header}>
            <Text style={styles.title}>{selectedGroup?.name} - Members</Text>
            <TouchableOpacity onPress={() => setShowMembersModal(false)}>
              <Text style={{ color: currentTheme.colors.text, fontSize: 24 }}>✕</Text>
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.content}>
            {selectedGroup?.members && selectedGroup.members.length > 0 ? (
              selectedGroup.members.map((member) => (
                <View key={member.id} style={styles.memberCard}>
                  <View style={styles.memberInfo}>
                    <View style={styles.memberAvatar}>
                      <Text style={styles.memberInitial}>
                        {member.name.charAt(0).toUpperCase()}
                      </Text>
                    </View>
                    <View style={styles.memberDetails}>
                      <Text style={styles.memberName}>{member.name}</Text>
                      <Text style={styles.memberRole}>{member.role}</Text>
                    </View>
                  </View>
                  <View style={styles.memberStats}>
                    <Text style={styles.memberScore}>Score: {member.contributionScore}</Text>
                    <Text style={styles.memberJoined}>
                      Joined {new Date(member.joinedAt).toLocaleDateString()}
                    </Text>
                  </View>
                </View>
              ))
            ) : (
              <View style={styles.emptyContainer}>
                <Users size={48} color={currentTheme.colors.textSecondary} />
                <Text style={styles.emptyTitle}>{t('studyGroups.modals.noMembersYet')}</Text>
                <Text style={styles.emptySubtitle}>{t('studyGroups.modals.beFirstToJoin')}</Text>
              </View>
            )}
          </ScrollView>
                 </View>
       </Modal>

       {/* Session Scheduling Modal */}
       <Modal
         visible={showScheduleModal}
         animationType="slide"
         presentationStyle="pageSheet"
       >
         <View style={[styles.container, { backgroundColor: currentTheme.colors.background }]}>
           <View style={styles.header}>
             <Text style={styles.title}>{t('studyGroups.modals.scheduleStudySession')}</Text>
             <TouchableOpacity onPress={() => setShowScheduleModal(false)}>
               <Text style={{ color: currentTheme.colors.text, fontSize: 24 }}>✕</Text>
             </TouchableOpacity>
           </View>
           
           <ScrollView style={styles.content}>
             <TextInput
               style={[styles.input, { backgroundColor: currentTheme.colors.card, color: currentTheme.colors.text }]}
               placeholder={t('studyGroups.modals.sessionTitlePlaceholder')}
               placeholderTextColor={currentTheme.colors.textSecondary}
               value={newSessionData.title}
               onChangeText={(text) => setNewSessionData({ ...newSessionData, title: text })}
             />
             
             <TextInput
               style={[styles.input, { backgroundColor: currentTheme.colors.card, color: currentTheme.colors.text }]}
               placeholder={t('studyGroups.modals.descriptionPlaceholder')}
               placeholderTextColor={currentTheme.colors.textSecondary}
               value={newSessionData.description}
               onChangeText={(text) => setNewSessionData({ ...newSessionData, description: text })}
               multiline
             />
             
             <View style={styles.sessionFormRow}>
               <View style={styles.sessionFormField}>
                 <Text style={styles.sessionFormLabel}>{t('studyGroups.modals.date')}</Text>
                 <TextInput
                   style={[styles.input, { backgroundColor: currentTheme.colors.card, color: currentTheme.colors.text }]}
                   placeholder={t('studyGroups.modals.datePlaceholder')}
                   placeholderTextColor={currentTheme.colors.textSecondary}
                   value={newSessionData.date}
                   onChangeText={(text) => setNewSessionData({ ...newSessionData, date: text })}
                 />
               </View>
               
               <View style={styles.sessionFormField}>
                 <Text style={styles.sessionFormLabel}>{t('studyGroups.modals.time')}</Text>
                 <TextInput
                   style={[styles.input, { backgroundColor: currentTheme.colors.card, color: currentTheme.colors.text }]}
                   placeholder={t('studyGroups.modals.timePlaceholder')}
                   placeholderTextColor={currentTheme.colors.textSecondary}
                   value={newSessionData.startTime}
                   onChangeText={(text) => setNewSessionData({ ...newSessionData, startTime: text })}
                 />
               </View>
             </View>
             
             <View style={styles.sessionFormRow}>
               <View style={styles.sessionFormField}>
                 <Text style={styles.sessionFormLabel}>{t('studyGroups.modals.duration')}</Text>
                 <TextInput
                   style={[styles.input, { backgroundColor: currentTheme.colors.card, color: currentTheme.colors.text }]}
                   placeholder={t('studyGroups.modals.durationPlaceholder')}
                   placeholderTextColor={currentTheme.colors.textSecondary}
                   value={newSessionData.duration.toString()}
                   onChangeText={(text) => setNewSessionData({ ...newSessionData, duration: parseInt(text) || 60 })}
                   keyboardType="numeric"
                 />
               </View>
               
               <View style={styles.sessionFormField}>
                 <Text style={styles.sessionFormLabel}>{t('studyGroups.modals.maxParticipants')}</Text>
                 <TextInput
                   style={[styles.input, { backgroundColor: currentTheme.colors.card, color: currentTheme.colors.text }]}
                   placeholder={t('studyGroups.modals.maxParticipantsPlaceholder')}
                   placeholderTextColor={currentTheme.colors.textSecondary}
                   value={newSessionData.maxParticipants.toString()}
                   onChangeText={(text) => setNewSessionData({ ...newSessionData, maxParticipants: parseInt(text) || 10 })}
                   keyboardType="numeric"
                 />
               </View>
             </View>
             
             <TouchableOpacity
               style={[styles.actionButton, styles.joinButton]}
               onPress={handleCreateSession}
             >
               <Text style={styles.joinButtonText}>{t('studyGroups.modals.scheduleSession')}</Text>
             </TouchableOpacity>
           </ScrollView>
         </View>
       </Modal>
     </View>
   );
 }
