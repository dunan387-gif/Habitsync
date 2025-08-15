import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Modal, TextInput, ScrollView, Alert } from 'react-native';
import { useTheme } from '@/context/ThemeContext';
import { useLanguage } from '@/context/LanguageContext';
import { useAuth } from '@/context/AuthContext';
import { useGamification } from '@/context/GamificationContext';
import CommunityService from '@/services/CommunityService';
import { PeerMentor, MentorshipRequest } from '@/types';
import { 
  Users, 
  Star, 
  Clock, 
  MessageSquare, 
  Plus, 
  X, 
  Award,
  Calendar,
  CheckCircle,
  UserPlus,
  BookOpen,
  TrendingUp
} from 'lucide-react-native';

export default function PeerMentorship() {
  const { currentTheme } = useTheme();
  const { t } = useLanguage();
  const { user } = useAuth();
  const { addXP } = useGamification();
  
  const [mentors, setMentors] = useState<PeerMentor[]>([]);
  const [requests, setRequests] = useState<MentorshipRequest[]>([]);
  const [showCreateMentorModal, setShowCreateMentorModal] = useState(false);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [loading, setLoading] = useState(true);
  
  // Form state for mentor profile
  const [expertise, setExpertise] = useState<string[]>([]);
  const [experience, setExperience] = useState('2');
  const [bio, setBio] = useState('');
  const [availability, setAvailability] = useState({
    days: ['monday', 'wednesday', 'friday'],
    timeSlots: ['09:00', '14:00', '18:00']
  });

  // Form state for mentorship request
  const [selectedMentor, setSelectedMentor] = useState<PeerMentor | null>(null);
  const [topic, setTopic] = useState('');
  const [description, setDescription] = useState('');
  const [goals, setGoals] = useState<string[]>([]);
  const [preferredTimes, setPreferredTimes] = useState<string[]>([]);

  useEffect(() => {
    loadMentorshipData();
  }, []);

  const loadMentorshipData = async () => {
    try {
      const userId = user?.id || 'anonymous';
      CommunityService.getInstance().setUserId(userId);
      
      const [mentorsData, requestsData] = await Promise.all([
        CommunityService.getInstance().getMentors(),
        CommunityService.getInstance().getMentorshipRequests()
      ]);
      
      setMentors(mentorsData);
      setRequests(requestsData);
    } catch (error) {
      console.error('Error loading mentorship data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateMentorProfile = async () => {
    if (!bio.trim() || expertise.length === 0) {
      Alert.alert(t('common.error'), t('mentorship.fillAllFields'));
      return;
    }

    try {
      const newMentor = await CommunityService.getInstance().createMentorProfile({
        userId: user?.id || 'anonymous',
        expertise,
        experience: parseInt(experience),
        rating: 0,
        menteesCount: 0,
        availability,
        bio: bio.trim(),
        achievements: [],
        isActive: true
      });

      setMentors(prev => [newMentor, ...prev]);
      setShowCreateMentorModal(false);
      resetMentorForm();
      
      // Add XP for creating mentor profile
      addXP(100, 'mentor_profile_creation');
      
      Alert.alert(t('common.success'), t('mentorship.profileCreatedSuccessfully'));
    } catch (error) {
      console.error('Error creating mentor profile:', error);
      Alert.alert(t('common.error'), t('mentorship.profileCreationFailed'));
    }
  };

  const handleRequestMentorship = async () => {
    if (!selectedMentor || !topic.trim() || !description.trim() || goals.length === 0) {
      Alert.alert(t('common.error'), t('mentorship.fillAllFields'));
      return;
    }

    try {
      const newRequest = await CommunityService.getInstance().requestMentorship({
        menteeId: user?.id || 'anonymous',
        mentorId: selectedMentor.id,
        topic: topic.trim(),
        description: description.trim(),
        goals,
        preferredTimes,
        status: 'pending'
      });

      setRequests(prev => [newRequest, ...prev]);
      setShowRequestModal(false);
      resetRequestForm();
      
      // Add XP for requesting mentorship
      addXP(50, 'mentorship_request');
      
      Alert.alert(t('common.success'), t('mentorship.requestSentSuccessfully'));
    } catch (error) {
      console.error('Error requesting mentorship:', error);
      Alert.alert(t('common.error'), t('mentorship.requestFailed'));
    }
  };

  const resetMentorForm = () => {
    setExpertise([]);
    setExperience('2');
    setBio('');
    setAvailability({
      days: ['monday', 'wednesday', 'friday'],
      timeSlots: ['09:00', '14:00', '18:00']
    });
  };

  const resetRequestForm = () => {
    setSelectedMentor(null);
    setTopic('');
    setDescription('');
    setGoals([]);
    setPreferredTimes([]);
  };

  const renderMentorCard = ({ item }: { item: PeerMentor }) => {
    const isCurrentUser = item.userId === user?.id;
    const hasActiveRequest = requests.some(r => r.mentorId === item.id && r.menteeId === user?.id && r.status === 'pending');

    return (
      <View style={[styles.mentorCard, { backgroundColor: currentTheme.colors.card }]}>
        <View style={styles.mentorHeader}>
          <View style={styles.mentorInfo}>
            <View style={styles.avatarContainer}>
              <Users size={24} color={currentTheme.colors.primary} />
            </View>
            <View style={styles.mentorDetails}>
              <Text style={[styles.mentorName, { color: currentTheme.colors.text }]}>
                {isCurrentUser ? t('mentorship.you') : `Mentor ${item.userId.slice(-4)}`}
              </Text>
              <Text style={[styles.mentorExperience, { color: currentTheme.colors.textSecondary }]}>
                {item.experience} {t('mentorship.yearsExperience')}
              </Text>
            </View>
          </View>
          <View style={styles.ratingContainer}>
            <Star size={16} color={currentTheme.colors.warning} />
            <Text style={[styles.ratingText, { color: currentTheme.colors.text }]}>
              {item.rating.toFixed(1)}
            </Text>
          </View>
        </View>

        <Text style={[styles.mentorBio, { color: currentTheme.colors.textSecondary }]}>
          {item.bio}
        </Text>

        <View style={styles.expertiseContainer}>
          {item.expertise.map((skill, index) => (
            <View key={index} style={[styles.expertiseTag, { backgroundColor: `${currentTheme.colors.primary}15` }]}>
              <Text style={[styles.expertiseText, { color: currentTheme.colors.primary }]}>
                {skill}
              </Text>
            </View>
          ))}
        </View>

        <View style={styles.mentorStats}>
          <View style={styles.statItem}>
            <Users size={16} color={currentTheme.colors.textMuted} />
            <Text style={[styles.statText, { color: currentTheme.colors.textMuted }]}>
              {item.menteesCount} {t('mentorship.mentees')}
            </Text>
          </View>
          <View style={styles.statItem}>
            <Clock size={16} color={currentTheme.colors.textMuted} />
            <Text style={[styles.statText, { color: currentTheme.colors.textMuted }]}>
              {item.availability.days.length} {t('mentorship.daysAvailable')}
            </Text>
          </View>
        </View>

        {!isCurrentUser && !hasActiveRequest && (
          <TouchableOpacity
            style={[styles.requestButton, { backgroundColor: currentTheme.colors.primary }]}
            onPress={() => {
              setSelectedMentor(item);
              setShowRequestModal(true);
            }}
          >
            <MessageSquare size={16} color={currentTheme.colors.background} />
            <Text style={[styles.requestButtonText, { color: currentTheme.colors.background }]}>
              {t('mentorship.requestMentorship')}
            </Text>
          </TouchableOpacity>
        )}

        {hasActiveRequest && (
          <View style={[styles.pendingBadge, { backgroundColor: currentTheme.colors.warning }]}>
            <Clock size={16} color={currentTheme.colors.background} />
            <Text style={[styles.pendingText, { color: currentTheme.colors.background }]}>
              {t('mentorship.requestPending')}
            </Text>
          </View>
        )}
      </View>
    );
  };

  const renderRequestCard = ({ item }: { item: MentorshipRequest }) => {
    const mentor = mentors.find(m => m.id === item.mentorId);
    const isMentee = item.menteeId === user?.id;
    const isMentor = mentor?.userId === user?.id;

    return (
      <View style={[styles.requestCard, { backgroundColor: currentTheme.colors.card }]}>
        <View style={styles.requestHeader}>
          <Text style={[styles.requestTopic, { color: currentTheme.colors.text }]}>
            {item.topic}
          </Text>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
            <Text style={[styles.statusText, { color: currentTheme.colors.background }]}>
              {t(`mentorship.status.${item.status}`)}
            </Text>
          </View>
        </View>

        <Text style={[styles.requestDescription, { color: currentTheme.colors.textSecondary }]}>
          {item.description}
        </Text>

        <View style={styles.requestDetails}>
          <Text style={[styles.requestLabel, { color: currentTheme.colors.text }]}>
            {isMentee ? t('mentorship.mentor') : t('mentorship.mentee')}:
          </Text>
          <Text style={[styles.requestValue, { color: currentTheme.colors.textSecondary }]}>
            {isMentee ? `Mentor ${mentor?.userId.slice(-4)}` : `Mentee ${item.menteeId.slice(-4)}`}
          </Text>
        </View>

        {item.goals.length > 0 && (
          <View style={styles.goalsContainer}>
            <Text style={[styles.goalsLabel, { color: currentTheme.colors.text }]}>
              {t('mentorship.goals')}:
            </Text>
            {item.goals.map((goal, index) => (
              <Text key={index} style={[styles.goalText, { color: currentTheme.colors.textSecondary }]}>
                • {goal}
              </Text>
            ))}
          </View>
        )}

        {isMentor && item.status === 'pending' && (
          <View style={styles.requestActions}>
            <TouchableOpacity
              style={[styles.acceptButton, { backgroundColor: currentTheme.colors.success }]}
              onPress={() => handleUpdateRequestStatus(item.id, 'accepted')}
            >
              <CheckCircle size={16} color={currentTheme.colors.background} />
              <Text style={[styles.acceptButtonText, { color: currentTheme.colors.background }]}>
                {t('mentorship.accept')}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.rejectButton, { backgroundColor: currentTheme.colors.error }]}
              onPress={() => handleUpdateRequestStatus(item.id, 'rejected')}
            >
              <X size={16} color={currentTheme.colors.background} />
              <Text style={[styles.rejectButtonText, { color: currentTheme.colors.background }]}>
                {t('mentorship.reject')}
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };

  const handleUpdateRequestStatus = async (requestId: string, status: 'accepted' | 'rejected') => {
    try {
      // Update the request status in the local state
      setRequests(prev => prev.map(r => 
        r.id === requestId ? { ...r, status, acceptedAt: status === 'accepted' ? new Date().toISOString() : undefined } : r
      ));
      
      // Add XP for accepting mentorship
      if (status === 'accepted') {
        addXP(75, 'mentorship_accepted');
      }
      
      Alert.alert(t('common.success'), t(`mentorship.request${status.charAt(0).toUpperCase() + status.slice(1)}`));
    } catch (error) {
      console.error('Error updating request status:', error);
      Alert.alert(t('common.error'), t('mentorship.statusUpdateFailed'));
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return currentTheme.colors.warning;
      case 'accepted': return currentTheme.colors.success;
      case 'rejected': return currentTheme.colors.error;
      case 'completed': return currentTheme.colors.primary;
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
          {t('mentorship.title')}
        </Text>
        <TouchableOpacity
          style={[styles.createButton, { backgroundColor: currentTheme.colors.primary }]}
          onPress={() => setShowCreateMentorModal(true)}
        >
          <Plus size={20} color={currentTheme.colors.background} />
          <Text style={[styles.createButtonText, { color: currentTheme.colors.background }]}>
            {t('mentorship.becomeMentor')}
          </Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={mentors}
        renderItem={renderMentorCard}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContainer}
        ListHeaderComponent={
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: currentTheme.colors.text }]}>
              {t('mentorship.availableMentors')} ({mentors.length})
            </Text>
          </View>
        }
      />

      {/* Create Mentor Profile Modal */}
      <Modal
        visible={showCreateMentorModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowCreateMentorModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: currentTheme.colors.card }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: currentTheme.colors.text }]}>
                {t('mentorship.becomeMentor')}
              </Text>
              <TouchableOpacity onPress={() => setShowCreateMentorModal(false)}>
                <X size={24} color={currentTheme.colors.textMuted} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              <TextInput
                style={[styles.textArea, { 
                  backgroundColor: currentTheme.colors.surface,
                  color: currentTheme.colors.text,
                  borderColor: currentTheme.colors.border
                }]}
                placeholder={t('mentorship.bioPlaceholder')}
                placeholderTextColor={currentTheme.colors.textMuted}
                value={bio}
                onChangeText={setBio}
                multiline
                numberOfLines={4}
              />

              <Text style={[styles.label, { color: currentTheme.colors.text }]}>
                {t('mentorship.expertise')}
              </Text>
              <View style={styles.expertiseInputContainer}>
                {['Habits', 'Wellness', 'Productivity', 'Learning', 'Motivation'].map((skill) => (
                  <TouchableOpacity
                    key={skill}
                    style={[
                      styles.expertiseInputButton,
                      expertise.includes(skill) && { backgroundColor: currentTheme.colors.primary }
                    ]}
                    onPress={() => {
                      if (expertise.includes(skill)) {
                        setExpertise(expertise.filter(s => s !== skill));
                      } else {
                        setExpertise([...expertise, skill]);
                      }
                    }}
                  >
                    <Text style={[
                      styles.expertiseInputText,
                      { color: expertise.includes(skill) ? currentTheme.colors.background : currentTheme.colors.text }
                    ]}>
                      {skill}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={[styles.label, { color: currentTheme.colors.text }]}>
                {t('mentorship.experience')} ({t('mentorship.years')})
              </Text>
              <TextInput
                style={[styles.input, { 
                  backgroundColor: currentTheme.colors.surface,
                  color: currentTheme.colors.text,
                  borderColor: currentTheme.colors.border
                }]}
                placeholder="2"
                placeholderTextColor={currentTheme.colors.textMuted}
                value={experience}
                onChangeText={setExperience}
                keyboardType="numeric"
              />
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={[styles.cancelButton, { borderColor: currentTheme.colors.border }]}
                onPress={() => setShowCreateMentorModal(false)}
              >
                <Text style={[styles.cancelButtonText, { color: currentTheme.colors.text }]}>
                  {t('common.cancel')}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.createModalButton, { backgroundColor: currentTheme.colors.primary }]}
                onPress={handleCreateMentorProfile}
              >
                <Text style={[styles.createModalButtonText, { color: currentTheme.colors.background }]}>
                  {t('mentorship.becomeMentor')}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Request Mentorship Modal */}
      <Modal
        visible={showRequestModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowRequestModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: currentTheme.colors.card }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: currentTheme.colors.text }]}>
                {t('mentorship.requestMentorship')}
              </Text>
              <TouchableOpacity onPress={() => setShowRequestModal(false)}>
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
                placeholder={t('mentorship.topicPlaceholder')}
                placeholderTextColor={currentTheme.colors.textMuted}
                value={topic}
                onChangeText={setTopic}
              />

              <TextInput
                style={[styles.textArea, { 
                  backgroundColor: currentTheme.colors.surface,
                  color: currentTheme.colors.text,
                  borderColor: currentTheme.colors.border
                }]}
                placeholder={t('mentorship.descriptionPlaceholder')}
                placeholderTextColor={currentTheme.colors.textMuted}
                value={description}
                onChangeText={setDescription}
                multiline
                numberOfLines={4}
              />

              <Text style={[styles.label, { color: currentTheme.colors.text }]}>
                {t('mentorship.goals')}
              </Text>
              <View style={styles.goalsInputContainer}>
                {['Improve habits', 'Better wellness', 'Increase productivity', 'Learn new skills'].map((goal) => (
                  <TouchableOpacity
                    key={goal}
                    style={[
                      styles.goalInputButton,
                      goals.includes(goal) && { backgroundColor: currentTheme.colors.primary }
                    ]}
                    onPress={() => {
                      if (goals.includes(goal)) {
                        setGoals(goals.filter(g => g !== goal));
                      } else {
                        setGoals([...goals, goal]);
                      }
                    }}
                  >
                    <Text style={[
                      styles.goalInputText,
                      { color: goals.includes(goal) ? currentTheme.colors.background : currentTheme.colors.text }
                    ]}>
                      {goal}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={[styles.cancelButton, { borderColor: currentTheme.colors.border }]}
                onPress={() => setShowRequestModal(false)}
              >
                <Text style={[styles.cancelButtonText, { color: currentTheme.colors.text }]}>
                  {t('common.cancel')}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.createModalButton, { backgroundColor: currentTheme.colors.primary }]}
                onPress={handleRequestMentorship}
              >
                <Text style={[styles.createModalButtonText, { color: currentTheme.colors.background }]}>
                  {t('mentorship.sendRequest')}
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
  mentorCard: {
    marginBottom: 16,
    padding: 16,
    borderRadius: 12,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  mentorHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  mentorInfo: {
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
  mentorDetails: {
    flex: 1,
  },
  mentorName: {
    fontSize: 16,
    fontWeight: '600',
  },
  mentorExperience: {
    fontSize: 14,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: {
    marginLeft: 4,
    fontSize: 14,
    fontWeight: '600',
  },
  mentorBio: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  expertiseContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 12,
  },
  expertiseTag: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 8,
    marginBottom: 4,
  },
  expertiseText: {
    fontSize: 12,
    fontWeight: '500',
  },
  mentorStats: {
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
  requestButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  requestButtonText: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: '600',
  },
  pendingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  pendingText: {
    marginLeft: 4,
    fontSize: 14,
    fontWeight: '600',
  },
  requestCard: {
    marginBottom: 16,
    padding: 16,
    borderRadius: 12,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  requestHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  requestTopic: {
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
  requestDescription: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  requestDetails: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  requestLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginRight: 8,
  },
  requestValue: {
    fontSize: 14,
  },
  goalsContainer: {
    marginBottom: 12,
  },
  goalsLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  goalText: {
    fontSize: 14,
    marginLeft: 8,
  },
  requestActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  acceptButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    marginRight: 8,
  },
  acceptButtonText: {
    marginLeft: 4,
    fontSize: 14,
    fontWeight: '600',
  },
  rejectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
  },
  rejectButtonText: {
    marginLeft: 4,
    fontSize: 14,
    fontWeight: '600',
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
  expertiseInputContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 16,
  },
  expertiseInputButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  expertiseInputText: {
    fontSize: 12,
    fontWeight: '500',
  },
  goalsInputContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 16,
  },
  goalInputButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  goalInputText: {
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
