import React, { useState } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, ScrollView, TextInput, Alert, Linking } from 'react-native';
import { useTheme } from '@/context/ThemeContext';
import { useLanguage } from '@/context/LanguageContext';
import { useGamification } from '@/context/GamificationContext';
import { X, Star, Send, MessageSquare } from 'lucide-react-native';
import LibraryAnalyticsService from '@/services/LibraryAnalyticsService';
import { useAuth } from '@/context/AuthContext';

interface LibraryFeedbackModalProps {
  visible: boolean;
  onClose: () => void;
}

export default function LibraryFeedbackModal({ visible, onClose }: LibraryFeedbackModalProps) {
  const { currentTheme } = useTheme();
  const { t } = useLanguage();
  const { user } = useAuth();
  const { trackLibraryFeedback } = useGamification();
  
  const [rating, setRating] = useState<number>(0);
  const [feedback, setFeedback] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const styles = createStyles(currentTheme.colors);

  const handleSubmit = async () => {
    if (rating === 0) {
      Alert.alert(t('library.feedback.ratingRequired'), t('library.feedback.pleaseRate'));
      return;
    }

    setIsSubmitting(true);
    try {
      // Track feedback internally
      const userId = user?.id || 'anonymous';
      await LibraryAnalyticsService.trackFeedback(userId, rating, feedback);
      await trackLibraryFeedback(rating, feedback);
      
      // Send email to your address
      const subject = encodeURIComponent('Library Feedback - Habit Tracker App');
      const ratingText = rating === 1 ? t('library.feedback.rating1').split(' - ')[0] : 
                        rating === 2 ? t('library.feedback.rating2').split(' - ')[0] : 
                        rating === 3 ? t('library.feedback.rating3').split(' - ')[0] : 
                        rating === 4 ? t('library.feedback.rating4').split(' - ')[0] : 
                        t('library.feedback.rating5').split(' - ')[0];
      const emailBody = encodeURIComponent(`Hello,\n\nI would like to share feedback about the Library section:\n\nRating: ${ratingText} (${rating}/5)\n\nFeedback:\n${feedback || 'No additional feedback provided'}\n\nUser ID: ${userId}\nSubmitted: ${new Date().toLocaleString()}\n\nThank you!`);
      
      const mailtoUrl = `mailto:sabbirhossainsm505@gmail.com?subject=${subject}&body=${emailBody}`;
      
      const canOpen = await Linking.canOpenURL(mailtoUrl);
      if (canOpen) {
        await Linking.openURL(mailtoUrl);
        Alert.alert(
          t('library.feedback.thankYou'),
          'Feedback submitted! Email app opened to send feedback to the development team.',
          [{ text: t('common.ok'), onPress: handleClose }]
        );
      } else {
        Alert.alert(
          t('library.feedback.thankYou'),
          'Feedback submitted! Please send feedback to: sabbirhossainsm505@gmail.com',
          [{ text: t('common.ok'), onPress: handleClose }]
        );
      }
    } catch (error) {
      console.error('Error submitting feedback:', error);
      Alert.alert(t('common.error'), t('library.feedback.submitError'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setRating(0);
    setFeedback('');
    onClose();
  };

  const renderStars = () => {
    return (
      <View style={styles.starsContainer}>
        {[1, 2, 3, 4, 5].map((star) => (
          <TouchableOpacity
            key={star}
            style={styles.starButton}
            onPress={() => setRating(star)}
            activeOpacity={0.7}
          >
            <Star
              size={32}
              color={star <= rating ? currentTheme.colors.warning : currentTheme.colors.border}
              fill={star <= rating ? currentTheme.colors.warning : 'transparent'}
            />
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <MessageSquare size={24} color={currentTheme.colors.primary} />
            <Text style={styles.headerTitle}>{t('library.feedback.title')}</Text>
          </View>
          <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
            <X size={24} color={currentTheme.colors.textSecondary} />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Introduction */}
          <View style={styles.introSection}>
            <Text style={styles.introTitle}>{t('library.feedback.introTitle')}</Text>
            <Text style={styles.introText}>{t('library.feedback.introText')}</Text>
          </View>

          {/* Rating Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t('library.feedback.rateExperience')}</Text>
            {renderStars()}
            <Text style={styles.ratingLabel}>
              {rating === 0 && t('library.feedback.selectRating')}
              {rating === 1 && t('library.feedback.rating1')}
              {rating === 2 && t('library.feedback.rating2')}
              {rating === 3 && t('library.feedback.rating3')}
              {rating === 4 && t('library.feedback.rating4')}
              {rating === 5 && t('library.feedback.rating5')}
            </Text>
          </View>

          {/* Feedback Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t('library.feedback.shareThoughts')}</Text>
            <Text style={styles.sectionSubtitle}>{t('library.feedback.optional')}</Text>
            
            <TextInput
              style={styles.feedbackInput}
              placeholder={t('library.feedback.placeholder')}
              placeholderTextColor={currentTheme.colors.textMuted}
              value={feedback}
              onChangeText={setFeedback}
              multiline
              numberOfLines={6}
              textAlignVertical="top"
            />
          </View>

          {/* Quick Feedback Options */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t('library.feedback.quickFeedback')}</Text>
            <View style={styles.quickFeedbackContainer}>
              {[
                { key: 'easy_to_use', label: t('library.feedback.easyToUse') },
                { key: 'needs_improvement', label: t('library.feedback.needsImprovement') },
                { key: 'more_habits', label: t('library.feedback.moreHabits') },
                { key: 'better_search', label: t('library.feedback.betterSearch') },
                { key: 'ai_suggestions', label: t('library.feedback.aiSuggestions') },
                { key: 'educational_content', label: t('library.feedback.educationalContent') },
              ].map((option) => (
                <TouchableOpacity
                  key={option.key}
                  style={styles.quickFeedbackButton}
                  onPress={() => {
                    if (!feedback.includes(option.label)) {
                      setFeedback(prev => prev ? `${prev}\n• ${option.label}` : `• ${option.label}`);
                    }
                  }}
                >
                  <Text style={styles.quickFeedbackText}>{option.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Submit Button */}
          <View style={styles.submitSection}>
            <TouchableOpacity
              style={[
                styles.submitButton,
                rating === 0 && styles.submitButtonDisabled
              ]}
              onPress={handleSubmit}
              disabled={rating === 0 || isSubmitting}
            >
              <Send size={20} color={currentTheme.colors.background} />
              <Text style={styles.submitButtonText}>
                {isSubmitting ? t('library.feedback.submitting') : t('library.feedback.submit')}
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    </Modal>
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
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
    marginLeft: 12,
  },
  closeButton: {
    padding: 4,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  introSection: {
    marginBottom: 32,
  },
  introTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 12,
  },
  introText: {
    fontSize: 16,
    color: colors.textSecondary,
    lineHeight: 24,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: colors.textMuted,
    marginBottom: 16,
  },
  starsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 16,
  },
  starButton: {
    padding: 8,
    marginHorizontal: 4,
  },
  ratingLabel: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  feedbackInput: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.border,
    minHeight: 120,
  },
  quickFeedbackContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  quickFeedbackButton: {
    backgroundColor: colors.surface,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
  },
  quickFeedbackText: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  submitSection: {
    marginTop: 20,
    marginBottom: 40,
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 24,
  },
  submitButtonDisabled: {
    backgroundColor: colors.border,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.background,
    marginLeft: 8,
  },
});
