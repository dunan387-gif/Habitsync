import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Modal, TextInput, ScrollView, Alert } from 'react-native';
import { useTheme } from '@/context/ThemeContext';
import { useLanguage } from '@/context/LanguageContext';
import { useAuth } from '@/context/AuthContext';
import { useGamification } from '@/context/GamificationContext';
import CommunityService from '@/services/CommunityService';
import { SocialLearningCircle, CircleMember, CircleSession } from '@/types';
import { 
  Users, 
  MessageSquare, 
  Calendar, 
  Clock, 
  Plus, 
  X, 
  BookOpen,
  Target,
  TrendingUp,
  UserPlus,
  Settings,
  Star,
  CheckCircle,
  Play
} from 'lucide-react-native';

export default function SocialLearningCircles() {
  const { currentTheme } = useTheme();
  const { t } = useLanguage();
  const { user } = useAuth();
  const { addXP } = useGamification();
  
  const [circles, setCircles] = useState<SocialLearningCircle[]>([]);
  const [members, setMembers] = useState<CircleMember[]>([]);
  const [sessions, setSessions] = useState<CircleSession[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [showSessionModal, setShowSessionModal] = useState(false);
  const [loading, setLoading] = useState(true);
  
  // Form state for creating circle
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [topic, setTopic] = useState('');
  const [maxMembers, setMaxMembers] = useState('10');
  const [meetingSchedule, setMeetingSchedule] = useState({
    frequency: 'weekly' as const,
    dayOfWeek: 1,
    time: '18:00'
  });

  // Form state for creating session
  const [sessionTitle, setSessionTitle] = useState('');
  const [sessionDescription, setSessionDescription] = useState('');
  const [sessionDuration, setSessionDuration] = useState('60');
  const [selectedCircle, setSelectedCircle] = useState<SocialLearningCircle | null>(null);

  useEffect(() => {
    loadCirclesData();
  }, []);

  const loadCirclesData = async () => {
    try {
      const userId = user?.id || 'anonymous';
      CommunityService.getInstance().setUserId(userId);
      
      const [circlesData, membersData, sessionsData] = await Promise.all([
        CommunityService.getInstance().getLearningCircles(),
        CommunityService.getInstance().getCircleMembers(),
        CommunityService.getInstance().getCircleSessions?.() || Promise.resolve([])
      ]);
      
      setCircles(circlesData);
      setMembers(membersData);
      setSessions(sessionsData);
    } catch (error) {
      console.error('Error loading circles data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCircle = async () => {
    if (!title.trim() || !description.trim() || !topic.trim()) {
      Alert.alert(t('common.error'), t('learningCircles.fillAllFields'));
      return;
    }

    try {
      const newCircle = await CommunityService.getInstance().createLearningCircle({
        name: title.trim(),
        description: description.trim(),
        topics: [topic.trim()],
        category: 'study',
        maxMembers: parseInt(maxMembers),
        meetingSchedule,
        createdBy: user?.id || 'anonymous',
        isPrivate: false
      });

      setCircles(prev => [newCircle, ...prev]);
      setShowCreateModal(false);
      resetCreateForm();
      
      // Add XP for creating circle
      addXP(100, 'circle_creation');
      
      Alert.alert(t('common.success'), t('learningCircles.circleCreatedSuccessfully'));
    } catch (error) {
      console.error('Error creating circle:', error);
      Alert.alert(t('common.error'), t('learningCircles.creationFailed'));
    }
  };

  const handleJoinCircle = async (circle: SocialLearningCircle) => {
    try {
      const member = await CommunityService.getInstance().joinLearningCircle(circle.id, 'member');
      setMembers(prev => [...prev, member]);
      
      // Update circle member count
      setCircles(prev => prev.map(c => 
        c.id === circle.id ? { ...c, currentMembers: c.currentMembers + 1 } : c
      ));
      
      // Add XP for joining circle
      addXP(50, 'circle_join');
      
      Alert.alert(t('common.success'), t('learningCircles.joinedSuccessfully'));
    } catch (error) {
      console.error('Error joining circle:', error);
      Alert.alert(t('common.error'), t('learningCircles.joinFailed'));
    }
  };

  const handleCreateSession = async () => {
    if (!selectedCircle || !sessionTitle.trim() || !sessionDescription.trim()) {
      Alert.alert(t('common.error'), t('learningCircles.fillAllFields'));
      return;
    }

    try {
      const newSession: CircleSession = {
        id: Date.now().toString(),
        circleId: selectedCircle.id,
        title: sessionTitle.trim(),
        description: sessionDescription.trim(),
        duration: parseInt(sessionDuration),
        scheduledAt: new Date().toISOString(),
        status: 'scheduled',
        participants: [],
        materials: [],
        notes: '',
        createdBy: user?.id || 'anonymous',
        createdAt: new Date().toISOString()
      };

      setSessions(prev => [newSession, ...prev]);
      setShowSessionModal(false);
      resetSessionForm();
      
      // Add XP for creating session
      addXP(75, 'session_creation');
      
      Alert.alert(t('common.success'), t('learningCircles.sessionCreatedSuccessfully'));
    } catch (error) {
      console.error('Error creating session:', error);
      Alert.alert(t('common.error'), t('learningCircles.sessionCreationFailed'));
    }
  };

  const resetCreateForm = () => {
    setTitle('');
    setDescription('');
    setTopic('');
    setMaxMembers('10');
    setMeetingSchedule({
      frequency: 'weekly',
      dayOfWeek: 1,
      time: '18:00'
    });
  };

  const resetSessionForm = () => {
    setSessionTitle('');
    setSessionDescription('');
    setSessionDuration('60');
    setSelectedCircle(null);
  };

  const getCircleMembers = (circleId: string) => {
    return members.filter(m => m.circleId === circleId);
  };

  const isCircleMember = (circleId: string) => {
    return members.some(m => m.circleId === circleId && m.userId === user?.id);
  };

  const isCircleLeader = (circleId: string) => {
    return members.some(m => m.circleId === circleId && m.userId === user?.id && m.role === 'leader');
  };

  const getCircleSessions = (circleId: string) => {
    return sessions.filter(s => s.circleId === circleId);
  };

  const renderCircleCard = ({ item }: { item: SocialLearningCircle }) => {
    const circleMembers = getCircleMembers(item.id);
    const circleSessions = getCircleSessions(item.id);
    const isMember = isCircleMember(item.id);
    const isLeader = isCircleLeader(item.id);

    return (
      <View style={[styles.circleCard, { backgroundColor: currentTheme.colors.card }]}>
        <View style={styles.circleHeader}>
          <View style={styles.circleInfo}>
            <View style={styles.avatarContainer}>
              <BookOpen size={24} color={currentTheme.colors.primary} />
            </View>
            <View style={styles.circleDetails}>
              <Text style={[styles.circleTitle, { color: currentTheme.colors.text }]}>
                {item.name}
              </Text>
              <Text style={[styles.circleTopic, { color: currentTheme.colors.textSecondary }]}>
                {item.topics[0]}
              </Text>
            </View>
          </View>
          {isLeader && (
            <View style={[styles.leaderBadge, { backgroundColor: currentTheme.colors.primary }]}>
              <Star size={12} color={currentTheme.colors.background} />
              <Text style={[styles.leaderText, { color: currentTheme.colors.background }]}>
                {t('learningCircles.leader')}
              </Text>
            </View>
          )}
        </View>

        <Text style={[styles.circleDescription, { color: currentTheme.colors.textSecondary }]}>
          {item.description}
        </Text>

        <View style={styles.circleStats}>
          <View style={styles.statItem}>
            <Users size={16} color={currentTheme.colors.textMuted} />
            <Text style={[styles.statText, { color: currentTheme.colors.textMuted }]}>
              {circleMembers.length}/{item.maxMembers}
            </Text>
          </View>
          <View style={styles.statItem}>
            <Calendar size={16} color={currentTheme.colors.textMuted} />
            <Text style={[styles.statText, { color: currentTheme.colors.textMuted }]}>
              {circleSessions.length} {t('learningCircles.sessions')}
            </Text>
          </View>
          <View style={styles.statItem}>
            <Clock size={16} color={currentTheme.colors.textMuted} />
            <Text style={[styles.statText, { color: currentTheme.colors.textMuted }]}>
              {item.meetingSchedule.frequency}
            </Text>
          </View>
        </View>

        <View style={styles.circleActions}>
          {!isMember ? (
            <TouchableOpacity
              style={[styles.joinButton, { backgroundColor: currentTheme.colors.primary }]}
              onPress={() => handleJoinCircle(item)}
            >
              <UserPlus size={16} color={currentTheme.colors.background} />
              <Text style={[styles.joinButtonText, { color: currentTheme.colors.background }]}>
                {t('learningCircles.joinCircle')}
              </Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.memberActions}>
              <TouchableOpacity
                style={[styles.sessionButton, { backgroundColor: currentTheme.colors.success }]}
                onPress={() => {
                  setSelectedCircle(item);
                  setShowSessionModal(true);
                }}
              >
                <Play size={16} color={currentTheme.colors.background} />
                <Text style={[styles.sessionButtonText, { color: currentTheme.colors.background }]}>
                  {t('learningCircles.createSession')}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.discussButton, { backgroundColor: currentTheme.colors.accent }]}
                onPress={() => {
                  // TODO: Navigate to discussion
                  Alert.alert(t('learningCircles.comingSoon'), t('learningCircles.discussionsComingSoon'));
                }}
              >
                <MessageSquare size={16} color={currentTheme.colors.background} />
                <Text style={[styles.discussButtonText, { color: currentTheme.colors.background }]}>
                  {t('learningCircles.discuss')}
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    );
  };

  const renderSessionCard = ({ item }: { item: CircleSession }) => {
    const circle = circles.find(c => c.id === item.circleId);
    const isCreator = item.createdBy === user?.id;

    return (
      <View style={[styles.sessionCard, { backgroundColor: currentTheme.colors.card }]}>
        <View style={styles.sessionHeader}>
          <Text style={[styles.sessionTitle, { color: currentTheme.colors.text }]}>
            {item.title}
          </Text>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
            <Text style={[styles.statusText, { color: currentTheme.colors.background }]}>
              {t(`learningCircles.status.${item.status}`)}
            </Text>
          </View>
        </View>

        <Text style={[styles.sessionDescription, { color: currentTheme.colors.textSecondary }]}>
          {item.description}
        </Text>

        <View style={styles.sessionDetails}>
          <Text style={[styles.sessionLabel, { color: currentTheme.colors.text }]}>
            {t('learningCircles.circle')}:
          </Text>
          <Text style={[styles.sessionValue, { color: currentTheme.colors.textSecondary }]}>
            {circle?.name || 'Unknown Circle'}
          </Text>
        </View>

        <View style={styles.sessionStats}>
          <View style={styles.statItem}>
            <Clock size={16} color={currentTheme.colors.textMuted} />
            <Text style={[styles.statText, { color: currentTheme.colors.textMuted }]}>
              {item.duration} {t('learningCircles.minutes')}
            </Text>
          </View>
          <View style={styles.statItem}>
            <Users size={16} color={currentTheme.colors.textMuted} />
            <Text style={[styles.statText, { color: currentTheme.colors.textMuted }]}>
              {item.participants.length} {t('learningCircles.participants')}
            </Text>
          </View>
        </View>
      </View>
    );
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled': return currentTheme.colors.warning;
      case 'in-progress': return currentTheme.colors.primary;
      case 'completed': return currentTheme.colors.success;
      case 'cancelled': return currentTheme.colors.error;
      default: return currentTheme.colors.textMuted;
    }
  };

  const styles = createStyles(currentTheme.colors);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>{t('common.loading')}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: currentTheme.colors.text }]}>
          {t('learningCircles.title')}
        </Text>
        <TouchableOpacity
          style={[styles.createButton, { backgroundColor: currentTheme.colors.primary }]}
          onPress={() => setShowCreateModal(true)}
        >
          <Plus size={20} color={currentTheme.colors.background} />
          <Text style={[styles.createButtonText, { color: currentTheme.colors.background }]}>
            {t('learningCircles.createCircle')}
          </Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={circles}
        renderItem={renderCircleCard}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContainer}
        ListHeaderComponent={
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: currentTheme.colors.text }]}>
              {t('learningCircles.availableCircles')} ({circles.length})
            </Text>
          </View>
        }
      />

      {/* Create Circle Modal */}
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
                {t('learningCircles.createCircle')}
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
                placeholder={t('learningCircles.titlePlaceholder')}
                placeholderTextColor={currentTheme.colors.textMuted}
                value={title}
                onChangeText={setTitle}
              />

              <TextInput
                style={[styles.textArea, { 
                  backgroundColor: currentTheme.colors.surface,
                  color: currentTheme.colors.text,
                  borderColor: currentTheme.colors.border
                }]}
                placeholder={t('learningCircles.descriptionPlaceholder')}
                placeholderTextColor={currentTheme.colors.textMuted}
                value={description}
                onChangeText={setDescription}
                multiline
                numberOfLines={4}
              />

              <TextInput
                style={[styles.input, { 
                  backgroundColor: currentTheme.colors.surface,
                  color: currentTheme.colors.text,
                  borderColor: currentTheme.colors.border
                }]}
                placeholder={t('learningCircles.topicPlaceholder')}
                placeholderTextColor={currentTheme.colors.textMuted}
                value={topic}
                onChangeText={setTopic}
              />

              <Text style={[styles.label, { color: currentTheme.colors.text }]}>
                {t('learningCircles.maxMembers')}
              </Text>
              <TextInput
                style={[styles.input, { 
                  backgroundColor: currentTheme.colors.surface,
                  color: currentTheme.colors.text,
                  borderColor: currentTheme.colors.border
                }]}
                placeholder="10"
                placeholderTextColor={currentTheme.colors.textMuted}
                value={maxMembers}
                onChangeText={setMaxMembers}
                keyboardType="numeric"
              />
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
                onPress={handleCreateCircle}
              >
                <Text style={[styles.createModalButtonText, { color: currentTheme.colors.background }]}>
                  {t('learningCircles.createCircle')}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Create Session Modal */}
      <Modal
        visible={showSessionModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowSessionModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: currentTheme.colors.card }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: currentTheme.colors.text }]}>
                {t('learningCircles.createSession')}
              </Text>
              <TouchableOpacity onPress={() => setShowSessionModal(false)}>
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
                placeholder={t('learningCircles.sessionTitlePlaceholder')}
                placeholderTextColor={currentTheme.colors.textMuted}
                value={sessionTitle}
                onChangeText={setSessionTitle}
              />

              <TextInput
                style={[styles.textArea, { 
                  backgroundColor: currentTheme.colors.surface,
                  color: currentTheme.colors.text,
                  borderColor: currentTheme.colors.border
                }]}
                placeholder={t('learningCircles.sessionDescriptionPlaceholder')}
                placeholderTextColor={currentTheme.colors.textMuted}
                value={sessionDescription}
                onChangeText={setSessionDescription}
                multiline
                numberOfLines={4}
              />

              <Text style={[styles.label, { color: currentTheme.colors.text }]}>
                {t('learningCircles.duration')} ({t('learningCircles.minutes')})
              </Text>
              <TextInput
                style={[styles.input, { 
                  backgroundColor: currentTheme.colors.surface,
                  color: currentTheme.colors.text,
                  borderColor: currentTheme.colors.border
                }]}
                placeholder="60"
                placeholderTextColor={currentTheme.colors.textMuted}
                value={sessionDuration}
                onChangeText={setSessionDuration}
                keyboardType="numeric"
              />
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={[styles.cancelButton, { borderColor: currentTheme.colors.border }]}
                onPress={() => setShowSessionModal(false)}
              >
                <Text style={[styles.cancelButtonText, { color: currentTheme.colors.text }]}>
                  {t('common.cancel')}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.createModalButton, { backgroundColor: currentTheme.colors.primary }]}
                onPress={handleCreateSession}
              >
                <Text style={[styles.createModalButtonText, { color: currentTheme.colors.background }]}>
                  {t('learningCircles.createSession')}
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
  circleCard: {
    marginBottom: 16,
    padding: 16,
    borderRadius: 12,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  circleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  circleInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatarContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: `${colors.primary}15`,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  circleDetails: {
    flex: 1,
  },
  circleTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  circleTopic: {
    fontSize: 14,
  },
  leaderBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  leaderText: {
    marginLeft: 4,
    fontSize: 12,
    fontWeight: '600',
  },
  circleDescription: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  circleStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statText: {
    fontSize: 12,
    marginLeft: 4,
  },
  circleActions: {
    alignItems: 'center',
  },
  joinButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    width: '100%',
  },
  joinButtonText: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: '600',
  },
  memberActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  sessionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    marginRight: 8,
  },
  sessionButtonText: {
    marginLeft: 4,
    fontSize: 14,
    fontWeight: '600',
  },
  discussButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
  },
  discussButtonText: {
    marginLeft: 4,
    fontSize: 14,
    fontWeight: '600',
  },
  sessionCard: {
    marginBottom: 16,
    padding: 16,
    borderRadius: 12,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sessionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  sessionTitle: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  sessionDescription: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  sessionDetails: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  sessionLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginRight: 8,
  },
  sessionValue: {
    fontSize: 14,
  },
  sessionStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
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
    minHeight: 80,
    textAlignVertical: 'top',
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
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
