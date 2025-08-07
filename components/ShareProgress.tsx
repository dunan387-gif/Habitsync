import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Share, ScrollView, Modal } from 'react-native';
import { useHabits } from '@/context/HabitContext';
import { useGamification } from '@/context/GamificationContext';
import { useTheme } from '@/context/ThemeContext';
import { useLanguage } from '@/context/LanguageContext';
import { Share2, Trophy, TrendingUp, Calendar, Target, Eye, X } from 'lucide-react-native';

interface ShareProgressProps {
  visible: boolean;
  onClose: () => void;
}

export default function ShareProgress({ visible, onClose }: ShareProgressProps) {
  const { habits, getTotalCompletions, getOverallCompletionRate } = useHabits();
  const { gamificationData } = useGamification();
  const { currentTheme } = useTheme();
  const { t } = useLanguage();
  const [isSharing, setIsSharing] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState('default');
  const [showPreview, setShowPreview] = useState(false);

  const styles = createStyles(currentTheme.colors);

  // Add null check for habits
  if (!habits) {
    return (
      <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{t('shareProgress.loading.loading_habits')}</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <X size={24} color={currentTheme.colors.text} />
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    );
  }

  // Helper function to get basic stats
  const getBasicStats = () => {
    const totalHabits = habits.length;
    const totalCompletions = getTotalCompletions();
    const completionRate = getOverallCompletionRate();
    const level = gamificationData?.userLevel.level || 1;
    const totalXP = gamificationData?.userLevel.totalXP || 0;
    const achievements = gamificationData?.unlockedAchievements.length || 0;
    const longestStreak = habits.length > 0 ? Math.max(...habits.map(h => h.bestStreak || 0), 0) : 0;
    
    return {
      totalHabits,
      totalCompletions,
      completionRate,
      level,
      totalXP,
      achievements,
      longestStreak
    };
  };

  // Template generator functions
  const generateDefaultMessage = () => {
    const stats = getBasicStats();
    return `${t('shareProgress.messages.default.title')} 🎯\n\n` +
           `📊 ${t('shareProgress.messages.default.level')} ${stats.level} (${stats.totalXP} XP)\n` +
           `🏆 ${stats.achievements} ${t('shareProgress.messages.default.achievements')}\n` +
           `📈 ${stats.totalHabits} ${t('shareProgress.messages.default.activeHabits')}\n` +
           `✅ ${stats.totalCompletions} ${t('shareProgress.messages.default.totalCompletions')}\n` +
           `📅 ${stats.longestStreak} ${t('shareProgress.messages.default.bestStreak')}\n` +
           `💯 ${stats.completionRate.toFixed(1)}% ${t('shareProgress.messages.default.successRate')}\n\n` +
           `${t('shareProgress.messages.default.callToAction')} 💪\n` +
           `#HabitTracker #PersonalGrowth #Productivity`;
  };

  const generateMinimalistMessage = () => {
    const stats = getBasicStats();
    return `🎯 ${t('shareProgress.messages.minimalist.title')}\n\n` +
           `${t('shareProgress.messages.minimalist.level')} ${stats.level} • ${stats.achievements} ${t('shareProgress.messages.minimalist.achievements')}\n` +
           `${stats.longestStreak}-${t('shareProgress.messages.minimalist.dayStreak')} • ${stats.completionRate.toFixed(0)}% ${t('shareProgress.messages.minimalist.successRate')}\n\n` +
           `#HabitTracker #PersonalGrowth`;
  };

  const generateAchievementMessage = () => {
    const stats = getBasicStats();
    const recentAchievementId = gamificationData?.unlockedAchievements[gamificationData.unlockedAchievements.length - 1];
    const recentAchievement = gamificationData?.achievements.find(a => a.id === recentAchievementId);
    const achievementText = recentAchievement ? `"${recentAchievement.title}"` : t('shareProgress.messages.achievement.newMilestone');
    
    return `🏆 ${t('shareProgress.messages.achievement.title')} 🏆\n\n` +
           `${t('shareProgress.messages.achievement.justEarned')} ${achievementText}! 💪\n\n` +
           `📊 ${t('shareProgress.messages.achievement.myProgress')}:\n` +
           `• ${t('shareProgress.messages.achievement.level')} ${stats.level} (${stats.totalXP} XP)\n` +
           `• ${stats.achievements} ${t('shareProgress.messages.achievement.achievements')}\n` +
           `• ${stats.totalHabits} ${t('shareProgress.messages.achievement.activeHabits')}\n\n` +
           `${t('shareProgress.messages.achievement.question')} 🔥\n` +
           `#HabitTracker #Achievement #Motivation`;
  };

  const generateMotivationalMessage = () => {
    const stats = getBasicStats();
    const habitList = habits.slice(0, 4).map(h => `✅ ${h.title}`).join('\n');
    
    return `💪 ${t('shareProgress.messages.motivational.title')} 💪\n\n` +
           `${t('shareProgress.messages.motivational.day')} ${stats.longestStreak} ${t('shareProgress.messages.motivational.buildingHabits')}:\n` +
           `${habitList}\n` +
           `${habits.length > 4 ? `...${t('shareProgress.messages.motivational.andMore', { count: habits.length - 4 })}!\n` : ''}\n` +
           `${t('shareProgress.messages.motivational.smallSteps')} ${t('shareProgress.messages.motivational.whoJoining')} 🚀\n` +
           `#DailyHabits #Motivation #GrowthMindset`;
  };

  const generateStatsMessage = () => {
    const stats = getBasicStats();
    return `📈 ${t('shareProgress.messages.stats.title')} 📈\n\n` +
           `🎯 ${t('shareProgress.messages.stats.level')}: ${stats.level} (${stats.totalXP} XP)\n` +
           `🏆 ${t('shareProgress.messages.stats.achievements')}: ${stats.achievements}/50\n` +
           `📅 ${t('shareProgress.messages.stats.bestStreak')}: ${stats.longestStreak} ${t('shareProgress.messages.stats.days')}\n` +
           `✅ ${t('shareProgress.messages.stats.totalCompletions')}: ${stats.totalCompletions}\n` +
           `💯 ${t('shareProgress.messages.stats.successRate')}: ${stats.completionRate.toFixed(1)}%\n` +
           `📊 ${t('shareProgress.messages.stats.activeHabits')}: ${stats.totalHabits}\n\n` +
           `${t('shareProgress.messages.stats.dataDriven')} 📊\n` +
           `#Analytics #HabitTracker #Progress`;
  };

  const generateMilestoneMessage = () => {
    const stats = getBasicStats();
    return `🎉 ${t('shareProgress.messages.milestone.title')} 🎉\n\n` +
           `🔥 ${stats.longestStreak}-${t('shareProgress.messages.milestone.dayStreak')} 🔥\n\n` +
           `${t('shareProgress.messages.milestone.journeyTaught')}:\n` +
           `• ${t('shareProgress.messages.milestone.consistency')}\n` +
           `• ${t('shareProgress.messages.milestone.smallWins')}\n` +
           `• ${t('shareProgress.messages.milestone.progressLinear')}\n\n` +
           `${t('shareProgress.messages.milestone.thankYou')} ${t('shareProgress.messages.milestone.nextHabit')} 💭\n` +
           `#${stats.longestStreak}DayChallenge #Milestone #Grateful`;
  };

  const generateWeeklyMessage = () => {
    const stats = getBasicStats();
    const weekScore = Math.floor(stats.completionRate * stats.totalHabits * 7 / 100);
    const maxScore = stats.totalHabits * 7;
    
    return `📅 ${t('shareProgress.messages.weekly.title')} 📅\n\n` +
           `${t('shareProgress.messages.weekly.thisWeek')}:\n` +
           `${habits.slice(0, 4).map(h => `${h.title} ${Math.floor(Math.random() * 3) + 5}/7 ${t('shareProgress.messages.weekly.days')}`).join('\n')}\n\n` +
           `${t('shareProgress.messages.weekly.weekScore')}: ${weekScore}/${maxScore} (${stats.completionRate.toFixed(0)}%)\n` +
           `${t('shareProgress.messages.weekly.nextWeekFocus')} 💪\n\n` +
           `#WeeklyReview #HabitTracker #Improvement`;
  };

  // Template configurations with translations - moved inside component
  const SHARE_TEMPLATES: Record<string, {
    name: string;
    description: string;
    generator: () => string;
  }> = {
    default: {
      name: t('shareProgress.templates.default.name'),
      description: t('shareProgress.templates.default.description'),
      generator: generateDefaultMessage
    },
    minimalist: {
      name: t('shareProgress.templates.minimalist.name'),
      description: t('shareProgress.templates.minimalist.description'),
      generator: generateMinimalistMessage
    },
    achievement: {
      name: t('shareProgress.templates.achievement.name'),
      description: t('shareProgress.templates.achievement.description'),
      generator: generateAchievementMessage
    },
    motivational: {
      name: t('shareProgress.templates.motivational.name'),
      description: t('shareProgress.templates.motivational.description'),
      generator: generateMotivationalMessage
    },
    statsHeavy: {
      name: t('shareProgress.templates.statsHeavy.name'),
      description: t('shareProgress.templates.statsHeavy.description'),
      generator: generateStatsMessage
    },
    milestone: {
      name: t('shareProgress.templates.milestone.name'),
      description: t('shareProgress.templates.milestone.description'),
      generator: generateMilestoneMessage
    },
    weeklySummary: {
      name: t('shareProgress.templates.weeklySummary.name'),
      description: t('shareProgress.templates.weeklySummary.description'),
      generator: generateWeeklyMessage
    }
  };

  type TemplateKey = keyof typeof SHARE_TEMPLATES;

  const handleDirectShare = async () => {
    await handleShare();
  };

  const handleShareFromPreview = async () => {
    await handleShare();
  };

  const handleShare = async () => {
    setIsSharing(true);
    try {
      const template = SHARE_TEMPLATES[selectedTemplate as TemplateKey];
      const message = template.generator();
      const result = await Share.share({
        message,
        title: t('shareProgress.alerts.shareTitle')
      });
      
      if (result.action === Share.sharedAction) {
        Alert.alert(t('shareProgress.alerts.success'), t('shareProgress.alerts.successMessage'));
        setShowPreview(false);
      }
    } catch (error) {
      Alert.alert(t('shareProgress.alerts.error'), t('shareProgress.alerts.errorMessage'));
    } finally {
      setIsSharing(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>{t('shareProgress.title')}</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <X size={24} color={currentTheme.colors.text} />
          </TouchableOpacity>
        </View>
        
        <ScrollView style={styles.previewContent}>
          <View style={styles.container}>
            <View style={styles.header}>
              <Share2 size={20} color={currentTheme.colors.primary} />
              <Text style={styles.title}>{t('shareProgress.title')}</Text>
            </View>
            <Text style={styles.subtitle}>{t('shareProgress.subtitle')}</Text>

            {/* Template Selection */}
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              style={styles.templateScroll}
              contentContainerStyle={styles.templateContainer}
            >
              {Object.entries(SHARE_TEMPLATES).map(([key, template]) => (
                <TouchableOpacity
                  key={key}
                  style={[
                    styles.templateCard,
                    selectedTemplate === key && styles.selectedTemplate
                  ]}
                  onPress={() => setSelectedTemplate(key)}
                >
                  <Text style={[
                    styles.templateName,
                    selectedTemplate === key && styles.selectedTemplateName
                  ]}>
                    {template.name}
                  </Text>
                  <Text style={[
                    styles.templateDesc,
                    selectedTemplate === key && styles.selectedTemplateDesc
                  ]}>
                    {template.description}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Quick Stats Display */}
            <View style={styles.statsGrid}>
              <View style={styles.statCard}>
                <Trophy size={16} color={currentTheme.colors.primary} />
                <Text style={styles.statValue}>{getBasicStats().totalHabits}</Text>
                <Text style={styles.statLabel}>{t('shareProgress.stats.totalHabits')}</Text>
              </View>
              <View style={styles.statCard}>
                <TrendingUp size={16} color={currentTheme.colors.success} />
                <Text style={styles.statValue}>{getBasicStats().longestStreak}</Text>
                <Text style={styles.statLabel}>{t('shareProgress.stats.bestStreak')}</Text>
              </View>
              <View style={styles.statCard}>
                <Calendar size={16} color={currentTheme.colors.warning} />
                <Text style={styles.statValue}>{getBasicStats().level}</Text>
                <Text style={styles.statLabel}>{t('shareProgress.stats.level')}</Text>
              </View>
              <View style={styles.statCard}>
                <Target size={16} color={currentTheme.colors.primary} />
                <Text style={styles.statValue}>{Math.round(getBasicStats().completionRate)}%</Text>
                <Text style={styles.statLabel}>{t('shareProgress.stats.successRate')}</Text>
              </View>
            </View>

            {/* Action Buttons */}
            <View style={styles.buttonRow}>
              <TouchableOpacity 
                style={styles.previewButton}
                onPress={() => setShowPreview(true)}
              >
                <Eye size={16} color={currentTheme.colors.primary} />
                <Text style={styles.previewButtonText}>{t('shareProgress.buttons.preview')}</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.shareButton, isSharing && styles.disabledButton]}
                onPress={handleDirectShare}
                disabled={isSharing}
              >
                <Share2 size={16} color="white" />
                <Text style={styles.shareButtonText}>
                  {isSharing ? t('shareProgress.buttons.sharing') : `${t('shareProgress.buttons.share')} ${SHARE_TEMPLATES[selectedTemplate as TemplateKey].name}`}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>

        {/* Preview Modal */}
        <Modal 
          visible={showPreview} 
          animationType="slide" 
          presentationStyle="pageSheet"
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{t('shareProgress.modal.previewTitle')}</Text>
              <TouchableOpacity onPress={() => setShowPreview(false)} style={styles.closeButton}>
                <X size={24} color={currentTheme.colors.text} />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.previewContent}>
              <View style={styles.previewCard}>
                <Text style={styles.previewText}>
                  {SHARE_TEMPLATES[selectedTemplate as TemplateKey].generator()}
                </Text>
              </View>
            </ScrollView>
            
            <View style={styles.modalActions}>
              <TouchableOpacity 
                style={styles.modalCancelButton}
                onPress={() => setShowPreview(false)}
              >
                <Text style={styles.modalCancelText}>{t('shareProgress.buttons.close')}</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.modalShareButton}
                onPress={handleShareFromPreview}
                disabled={isSharing}
              >
                <Share2 size={16} color="white" />
                <Text style={styles.modalShareText}>
                  {isSharing ? t('shareProgress.buttons.sharing') : t('shareProgress.buttons.shareNow')}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </View>
    </Modal>
  );
}

const createStyles = (colors: any) => StyleSheet.create({
  container: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    marginLeft: 12,
  },
  subtitle: {
    fontSize: 16,
    color: colors.textSecondary,
    marginBottom: 24,
    lineHeight: 22,
  },
  templateScroll: {
    marginBottom: 24,
  },
  templateContainer: {
    paddingRight: 16,
    paddingLeft: 4,
  },
  templateCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    marginRight: 12,
    minWidth: 140,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    transform: [{ scale: 1 }],
  },
  selectedTemplate: {
    backgroundColor: colors.primary + '15',
    borderColor: colors.primary,
    transform: [{ scale: 1.02 }],
    shadowColor: colors.primary,
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  templateName: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
    textAlign: 'center',
    marginBottom: 6,
  },
  selectedTemplateName: {
    color: colors.primary,
  },
  templateDesc: {
    fontSize: 11,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 14,
  },
  selectedTemplateDesc: {
    color: colors.primary,
    fontWeight: '500',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 28,
    gap: 12,
  },
  statCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    width: '47%',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.text,
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 4,
    fontWeight: '500',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 16,
  },
  previewButton: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.primary,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  previewButtonText: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: '700',
    marginLeft: 8,
  },
  shareButton: {
    flex: 1,
    backgroundColor: colors.primary,
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.primary,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  disabledButton: {
    opacity: 0.6,
    shadowOpacity: 0.1,
  },
  shareButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '700',
    marginLeft: 8,
  },
  // Enhanced Modal styles
  modalContainer: {
    flex: 1,
    backgroundColor: colors.background,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.card,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.text,
  },
  closeButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: colors.surface,
  },
  previewContent: {
    flex: 1,
    padding: 20,
  },
  previewCard: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  previewText: {
    fontSize: 16,
    color: colors.text,
    lineHeight: 24,
    fontFamily: 'System',
  },
  modalActions: {
    flexDirection: 'row',
    padding: 20,
    gap: 16,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.card,
  },
  modalCancelButton: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  modalCancelText: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '600',
  },
  modalShareButton: {
    flex: 1,
    backgroundColor: colors.primary,
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.primary,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  modalShareText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '700',
    marginLeft: 8,
  },
});

