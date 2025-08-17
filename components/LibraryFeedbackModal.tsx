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
      Alert.alert(t('library.libraryFeedback.ratingRequired'), t('library.libraryFeedback.pleaseRate'));
      return;
    }

    setIsSubmitting(true);
    try {
      // Track feedback internally
      const userId = user?.id || 'anonymous';
      await LibraryAnalyticsService.trackFeedback(userId, rating, feedback);
      await trackLibraryFeedback(rating, feedback);
      
      // Send feedback directly to backend API
      const feedbackData = {
        type: 'library_feedback',
        rating,
        feedback: feedback.trim() || 'No additional feedback provided',
        userId,
        userEmail: user?.email || 'anonymous',
        timestamp: new Date().toISOString(),
        appVersion: '1.0.0',
        platform: 'mobile',
        deviceInfo: {
          platform: 'react-native',
          version: '1.0.0'
        }
      };

      const response = await fetch('https://your-backend-api.com/api/feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(feedbackData)
      });

      if (!response.ok) {
        throw new Error('Failed to send feedback');
      }

      console.log('Library feedback submitted successfully:', feedbackData);

      Alert.alert(
        t('library.libraryFeedback.thankYou'),
        t('library.libraryFeedback.submittedMessage'),
        [
          {
            text: t('common.great'),
            onPress: handleClose
          }
        ]
      );

    } catch (error) {
      console.error('Error submitting feedback:', error);
      
      // Fallback: Try to send via email if API fails
      try {
        const subject = encodeURIComponent('Library Feedback - Habit Tracker App');
        const ratingText = rating === 1 ? t('library.libraryFeedback.rating1').split(' - ')[0] :
          rating === 2 ? t('library.libraryFeedback.rating2').split(' - ')[0] :
          rating === 3 ? t('library.libraryFeedback.rating3').split(' - ')[0] :
          rating === 4 ? t('library.libraryFeedback.rating4').split(' - ')[0] :
          t('library.libraryFeedback.rating5').split(' - ')[0];
        
        const emailBody = encodeURIComponent(`Hello,\n\nI would like to share feedback about the Library section:\n\nRating: ${ratingText} (${rating}/5)\n\nFeedback:\n${feedback || 'No additional feedback provided'}\n\nUser ID: ${user?.id || 'anonymous'}\nSubmitted: ${new Date().toLocaleString()}\n\nThank you!`);
        
        const mailtoUrl = `mailto:your-email@domain.com?subject=${subject}&body=${emailBody}`;
        await Linking.openURL(mailtoUrl);
        
        Alert.alert(
          t('library.libraryFeedback.thankYou'),
          'Feedback sent via email as fallback. Thank you!',
          [{ text: t('common.ok'), onPress: handleClose }]
        );
      } catch (emailError) {
        Alert.alert(t('common.error'), t('library.libraryFeedback.submitError'));
      }
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
            <Text style={styles.headerTitle}>{t('library.libraryFeedback.title')}</Text>
          </View>
          <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
            <X size={24} color={currentTheme.colors.textSecondary} />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Introduction */}
          <View style={styles.introSection}>
            <Text style={styles.introTitle}>{t('library.libraryFeedback.introTitle')}</Text>
            <Text style={styles.introText}>{t('library.libraryFeedback.introText')}</Text>
          </View>

          {/* Rating Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t('library.libraryFeedback.rateExperience')}</Text>
            {renderStars()}
            <Text style={styles.ratingLabel}>
              {rating === 0 && t('library.libraryFeedback.selectRating')}
              {rating === 1 && t('library.libraryFeedback.rating1')}
              {rating === 2 && t('library.libraryFeedback.rating2')}
              {rating === 3 && t('library.libraryFeedback.rating3')}
              {rating === 4 && t('library.libraryFeedback.rating4')}
              {rating === 5 && t('library.libraryFeedback.rating5')}
            </Text>
          </View>

          {/* Feedback Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t('library.libraryFeedback.shareThoughts')}</Text>
            <Text style={styles.sectionSubtitle}>{t('library.libraryFeedback.optional')}</Text>
            
            <TextInput
              style={styles.feedbackInput}
              placeholder={t('library.libraryFeedback.placeholder')}
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
            <Text style={styles.sectionTitle}>{t('library.libraryFeedback.quickFeedback')}</Text>
            <View style={styles.quickFeedbackContainer}>
              {[
                { key: 'easy_to_use', label: t('library.libraryFeedback.easyToUse') },
                { key: 'needs_improvement', label: t('library.libraryFeedback.needsImprovement') },
                { key: 'more_habits', label: t('library.libraryFeedback.moreHabits') },
                { key: 'better_search', label: t('library.libraryFeedback.betterSearch') },
                { key: 'ai_suggestions', label: t('library.libraryFeedback.aiSuggestions') },
                { key: 'educational_content', label: t('library.libraryFeedback.educationalContent') },
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
                {isSubmitting ? t('library.libraryFeedback.submitting') : t('library.libraryFeedback.submit')}
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
