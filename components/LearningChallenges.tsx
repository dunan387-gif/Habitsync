import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Modal, TextInput, ScrollView, Alert } from 'react-native';
import { useTheme } from '@/context/ThemeContext';
import { useLanguage } from '@/context/LanguageContext';
import { useAuth } from '@/context/AuthContext';
import { useGamification } from '@/context/GamificationContext';
import CommunityService from '@/services/CommunityService';
import { LearningChallenge, ChallengeParticipant } from '@/types';
import { 
  Trophy, 
  Users, 
  Calendar, 
  Target, 
  Plus, 
  X, 
  Star, 
  Clock, 
  Award,
  TrendingUp,
  CheckCircle
} from 'lucide-react-native';

export default function LearningChallenges() {
  const { currentTheme } = useTheme();
  const { t } = useLanguage();
  const { user } = useAuth();
  const { addXP, unlockAchievement } = useGamification();
  
  const [challenges, setChallenges] = useState<LearningChallenge[]>([]);
  const [participants, setParticipants] = useState<ChallengeParticipant[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [loading, setLoading] = useState(true);
  
  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<'habit' | 'wellness' | 'productivity' | 'learning' | 'social'>('habit');
  const [difficulty, setDifficulty] = useState<'beginner' | 'intermediate' | 'advanced'>('beginner');
  const [duration, setDuration] = useState('7');
  const [maxParticipants, setMaxParticipants] = useState('50');

  useEffect(() => {
    loadChallenges();
  }, []);

  const loadChallenges = async () => {
    try {
      const userId = user?.id || 'anonymous';
      CommunityService.getInstance().setUserId(userId);
      
      const [challengesData, participantsData] = await Promise.all([
        CommunityService.getInstance().getChallenges(),
        CommunityService.getInstance().getChallengeParticipants()
      ]);
      
      setChallenges(challengesData);
      setParticipants(participantsData);
    } catch (error) {
      console.error('Error loading challenges:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateChallenge = async () => {
    if (!title.trim() || !description.trim()) {
      Alert.alert(t('common.error'), t('challenges.fillAllFields'));
      return;
    }

    try {
      const newChallenge = await CommunityService.getInstance().createChallenge({
        title: title.trim(),
        description: description.trim(),
        category,
        difficulty,
        duration: parseInt(duration),
        maxParticipants: parseInt(maxParticipants),
        participants: 0,
        startDate: new Date().toISOString(),
        endDate: new Date(Date.now() + parseInt(duration) * 24 * 60 * 60 * 1000).toISOString(),
        rewards: {
          xp: getXPReward(difficulty),
          badges: [`challenge_${category}`],
          achievements: [`challenge_completed_${difficulty}`]
        },
        requirements: {
          habits: [],
          streakDays: 0,
          completionRate: 0
        },
        createdBy: user?.id || 'anonymous'
      });

      setChallenges(prev => [newChallenge, ...prev]);
      setShowCreateModal(false);
      resetForm();
      
      // Add XP for creating challenge
      addXP(50, 'challenge_creation');
      
      Alert.alert(t('common.success'), t('challenges.createdSuccessfully'));
    } catch (error) {
      console.error('Error creating challenge:', error);
      Alert.alert(t('common.error'), t('challenges.creationFailed'));
    }
  };

  const handleJoinChallenge = async (challenge: LearningChallenge) => {
    try {
      const participant = await CommunityService.getInstance().joinChallenge(challenge.id);
      setParticipants(prev => [...prev, participant]);
      
      // Add XP for joining challenge
      addXP(25, 'challenge_join');
      
      Alert.alert(t('common.success'), t('challenges.joinedSuccessfully'));
    } catch (error) {
      console.error('Error joining challenge:', error);
      Alert.alert(t('common.error'), t('challenges.joinFailed'));
    }
  };

  const handleUpdateProgress = async (challengeId: string, day: number) => {
    try {
      await CommunityService.getInstance().updateChallengeProgress(challengeId, day);
      
      // Update local state
      setParticipants(prev => prev.map(p => 
        p.challengeId === challengeId && p.userId === user?.id
          ? { ...p, progress: { ...p.progress, currentDay: day, completedDays: [...p.progress.completedDays, day] } }
          : p
      ));
      
      // Add XP for progress
      addXP(10, 'challenge_progress');
      
      Alert.alert(t('common.success'), t('challenges.progressUpdated'));
    } catch (error) {
      console.error('Error updating progress:', error);
      Alert.alert(t('common.error'), t('challenges.progressUpdateFailed'));
    }
  };

  const getXPReward = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return 100;
      case 'intermediate': return 250;
      case 'advanced': return 500;
      default: return 100;
    }
  };

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setCategory('habit');
    setDifficulty('beginner');
    setDuration('7');
    setMaxParticipants('50');
  };

  const getParticipantProgress = (challengeId: string) => {
    const participant = participants.find(p => p.challengeId === challengeId && p.userId === user?.id);
    return participant?.progress || null;
  };

  const renderChallengeCard = ({ item }: { item: LearningChallenge }) => {
    const progress = getParticipantProgress(item.id);
    const isParticipant = progress !== null;
    const isCompleted = progress?.completedDays.length === item.duration;

    return (
      <View style={[styles.challengeCard, { backgroundColor: currentTheme.colors.card }]}>
        <View style={styles.challengeHeader}>
          <View style={styles.challengeTitleContainer}>
            <Trophy size={20} color={getDifficultyColor(item.difficulty)} />
            <Text style={[styles.challengeTitle, { color: currentTheme.colors.text }]}>
              {item.title}
            </Text>
          </View>
          <View style={[styles.difficultyBadge, { backgroundColor: `${getDifficultyColor(item.difficulty)}20` }]}>
            <Text style={[styles.difficultyText, { color: getDifficultyColor(item.difficulty) }]}>
              {t(`challenges.difficulty.${item.difficulty}`)}
            </Text>
          </View>
        </View>

        <Text style={[styles.challengeDescription, { color: currentTheme.colors.textSecondary }]}>
          {item.description}
        </Text>

        <View style={styles.challengeStats}>
          <View style={styles.statItem}>
            <Users size={16} color={currentTheme.colors.textMuted} />
            <Text style={[styles.statText, { color: currentTheme.colors.textMuted }]}>
              {item.participants}/{item.maxParticipants || '∞'}
            </Text>
          </View>
          <View style={styles.statItem}>
            <Calendar size={16} color={currentTheme.colors.textMuted} />
            <Text style={[styles.statText, { color: currentTheme.colors.textMuted }]}>
              {item.duration} {t('challenges.days')}
            </Text>
          </View>
          <View style={styles.statItem}>
            <Award size={16} color={currentTheme.colors.textMuted} />
            <Text style={[styles.statText, { color: currentTheme.colors.textMuted }]}>
              {item.rewards.xp} XP
            </Text>
          </View>
        </View>

        {isParticipant && (
          <View style={styles.progressContainer}>
            <View style={styles.progressHeader}>
              <Text style={[styles.progressText, { color: currentTheme.colors.text }]}>
                {t('challenges.progress')}: {progress?.currentDay || 0}/{item.duration}
              </Text>
              <Text style={[styles.progressPercentage, { color: currentTheme.colors.primary }]}>
                {Math.round(((progress?.currentDay || 0) / item.duration) * 100)}%
              </Text>
            </View>
            <View style={[styles.progressBar, { backgroundColor: currentTheme.colors.surface }]}>
              <View 
                style={[
                  styles.progressFill, 
                  { 
                    width: `${Math.min(((progress?.currentDay || 0) / item.duration) * 100, 100)}%`,
                    backgroundColor: currentTheme.colors.primary 
                  }
                ]} 
              />
            </View>
          </View>
        )}

        <View style={styles.challengeActions}>
          {!isParticipant ? (
            <TouchableOpacity
              style={[styles.joinButton, { backgroundColor: currentTheme.colors.primary }]}
              onPress={() => handleJoinChallenge(item)}
            >
              <Text style={[styles.joinButtonText, { color: currentTheme.colors.background }]}>
                {t('challenges.join')}
              </Text>
            </TouchableOpacity>
          ) : !isCompleted ? (
            <TouchableOpacity
              style={[styles.progressButton, { backgroundColor: currentTheme.colors.success }]}
              onPress={() => handleUpdateProgress(item.id, (progress?.currentDay || 0) + 1)}
            >
              <Text style={[styles.progressButtonText, { color: currentTheme.colors.background }]}>
                {t('challenges.updateProgress')}
              </Text>
            </TouchableOpacity>
          ) : (
            <View style={[styles.completedBadge, { backgroundColor: currentTheme.colors.success }]}>
              <CheckCircle size={16} color={currentTheme.colors.background} />
              <Text style={[styles.completedText, { color: currentTheme.colors.background }]}>
                {t('challenges.completed')}
              </Text>
            </View>
          )}
        </View>
      </View>
    );
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return currentTheme.colors.success;
      case 'intermediate': return currentTheme.colors.warning;
      case 'advanced': return currentTheme.colors.error;
      default: return currentTheme.colors.primary;
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
          {t('challenges.title')}
        </Text>
        <TouchableOpacity
          style={[styles.createButton, { backgroundColor: currentTheme.colors.primary }]}
          onPress={() => setShowCreateModal(true)}
        >
          <Plus size={20} color={currentTheme.colors.background} />
          <Text style={[styles.createButtonText, { color: currentTheme.colors.background }]}>
            {t('challenges.create')}
          </Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={challenges}
        renderItem={renderChallengeCard}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContainer}
      />

      {/* Create Challenge Modal */}
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
                {t('challenges.createNew')}
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
                placeholder={t('challenges.titlePlaceholder')}
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
                placeholder={t('challenges.descriptionPlaceholder')}
                placeholderTextColor={currentTheme.colors.textMuted}
                value={description}
                onChangeText={setDescription}
                multiline
                numberOfLines={4}
              />

              <Text style={[styles.label, { color: currentTheme.colors.text }]}>
                {t('challenges.category')}
              </Text>
              <View style={styles.categoryContainer}>
                {(['habit', 'wellness', 'productivity', 'learning', 'social'] as const).map((cat) => (
                  <TouchableOpacity
                    key={cat}
                    style={[
                      styles.categoryButton,
                      category === cat && { backgroundColor: currentTheme.colors.primary }
                    ]}
                    onPress={() => setCategory(cat)}
                  >
                    <Text style={[
                      styles.categoryText,
                      { color: category === cat ? currentTheme.colors.background : currentTheme.colors.text }
                    ]}>
                      {t(`challenges.categories.${cat}`)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={[styles.label, { color: currentTheme.colors.text }]}>
                {t('challenges.difficulty')}
              </Text>
              <View style={styles.difficultyContainer}>
                {(['beginner', 'intermediate', 'advanced'] as const).map((diff) => (
                  <TouchableOpacity
                    key={diff}
                    style={[
                      styles.difficultyButton,
                      difficulty === diff && { backgroundColor: getDifficultyColor(diff) }
                    ]}
                    onPress={() => setDifficulty(diff)}
                  >
                    <Text style={[
                      styles.difficultyButtonText,
                      { color: difficulty === diff ? currentTheme.colors.background : currentTheme.colors.text }
                    ]}>
                      {t(`challenges.difficulty.${diff}`)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <View style={styles.row}>
                <View style={styles.halfWidth}>
                  <Text style={[styles.label, { color: currentTheme.colors.text }]}>
                    {t('challenges.duration')} ({t('challenges.days')})
                  </Text>
                  <TextInput
                    style={[styles.input, { 
                      backgroundColor: currentTheme.colors.surface,
                      color: currentTheme.colors.text,
                      borderColor: currentTheme.colors.border
                    }]}
                    placeholder="7"
                    placeholderTextColor={currentTheme.colors.textMuted}
                    value={duration}
                    onChangeText={setDuration}
                    keyboardType="numeric"
                  />
                </View>
                <View style={styles.halfWidth}>
                  <Text style={[styles.label, { color: currentTheme.colors.text }]}>
                    {t('challenges.maxParticipants')}
                  </Text>
                  <TextInput
                    style={[styles.input, { 
                      backgroundColor: currentTheme.colors.surface,
                      color: currentTheme.colors.text,
                      borderColor: currentTheme.colors.border
                    }]}
                    placeholder="50"
                    placeholderTextColor={currentTheme.colors.textMuted}
                    value={maxParticipants}
                    onChangeText={setMaxParticipants}
                    keyboardType="numeric"
                  />
                </View>
              </View>
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
                onPress={handleCreateChallenge}
              >
                <Text style={[styles.createModalButtonText, { color: currentTheme.colors.background }]}>
                  {t('challenges.create')}
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
  challengeCard: {
    marginBottom: 16,
    padding: 16,
    borderRadius: 12,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  challengeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  challengeTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  challengeTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 8,
  },
  difficultyBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  difficultyText: {
    fontSize: 12,
    fontWeight: '600',
  },
  challengeDescription: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  challengeStats: {
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
  progressContainer: {
    marginBottom: 12,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  progressText: {
    fontSize: 14,
    fontWeight: '500',
  },
  progressPercentage: {
    fontSize: 14,
    fontWeight: '600',
  },
  progressBar: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  challengeActions: {
    alignItems: 'center',
  },
  joinButton: {
    paddingHorizontal: 24,
    paddingVertical: 8,
    borderRadius: 8,
  },
  joinButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  progressButton: {
    paddingHorizontal: 24,
    paddingVertical: 8,
    borderRadius: 8,
  },
  progressButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  completedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  completedText: {
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
  categoryText: {
    fontSize: 12,
    fontWeight: '500',
  },
  difficultyContainer: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  difficultyButton: {
    flex: 1,
    paddingVertical: 8,
    marginHorizontal: 4,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  difficultyButtonText: {
    fontSize: 12,
    fontWeight: '600',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  halfWidth: {
    width: '48%',
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
