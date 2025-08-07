import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Alert } from 'react-native';
import { Star, ThumbsUp, ThumbsDown, MessageSquare, Send } from 'lucide-react-native';
import { useTheme } from '@/context/ThemeContext';
import { useLanguage } from '@/context/LanguageContext';
import { aiService } from '@/services/AIService';

interface RecommendationFeedbackProps {
  suggestionId: string;
  suggestionTitle: string;
  onFeedbackSubmitted: (feedback: any) => void;
  onClose: () => void;
}

export default function RecommendationFeedback({
  suggestionId,
  suggestionTitle,
  onFeedbackSubmitted,
  onClose
}: RecommendationFeedbackProps) {
  const { currentTheme } = useTheme();
  const { t } = useLanguage();
  const [rating, setRating] = useState(0);
  const [implemented, setImplemented] = useState(false);
  const [effectiveness, setEffectiveness] = useState(5);
  const [comments, setComments] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmitFeedback = async () => {
    if (rating === 0) {
      Alert.alert(t('feedback.validation.title'), t('feedback.validation.ratingRequired'));
      return;
    }

    setIsSubmitting(true);

    try {
      const feedback = {
        suggestionId,
        rating,
        implemented,
        effectiveness,
        comments: comments.trim() || undefined,
        timestamp: new Date().toISOString()
      };

      // Record feedback in AI service
      aiService.recordFeedback(feedback);

      // Notify parent component
      onFeedbackSubmitted(feedback);

      Alert.alert(
        t('feedback.success.title'),
        t('feedback.success.message'),
        [{ text: t('common.ok'), onPress: onClose }]
      );
    } catch (error) {
      Alert.alert(t('feedback.error.title'), t('feedback.error.message'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const styles = createStyles(currentTheme.colors);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{t('feedback.title')}</Text>
        <Text style={styles.subtitle}>{suggestionTitle}</Text>
      </View>

      {/* Rating Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('feedback.rating.title')}</Text>
        <View style={styles.starsContainer}>
          {[1, 2, 3, 4, 5].map((star) => (
            <TouchableOpacity
              key={star}
              onPress={() => setRating(star)}
              style={styles.starButton}
            >
              <Star
                size={32}
                fill={star <= rating ? currentTheme.colors.primary : 'transparent'}
                color={star <= rating ? currentTheme.colors.primary : currentTheme.colors.text}
              />
            </TouchableOpacity>
          ))}
        </View>
        <Text style={styles.ratingLabel}>
          {rating > 0 ? t(`feedback.rating.labels.${rating}`) : t('feedback.rating.select')}
        </Text>
      </View>

      {/* Implementation Status */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('feedback.implementation.title')}</Text>
        <View style={styles.implementationButtons}>
          <TouchableOpacity
            style={[
              styles.implementationButton,
              implemented && styles.implementationButtonActive
            ]}
            onPress={() => setImplemented(true)}
          >
            <ThumbsUp
              size={20}
              color={implemented ? currentTheme.colors.background : currentTheme.colors.text}
            />
            <Text style={[
              styles.implementationButtonText,
              implemented && styles.implementationButtonTextActive
            ]}>
              {t('feedback.implementation.implemented')}
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[
              styles.implementationButton,
              !implemented && styles.implementationButtonActive
            ]}
            onPress={() => setImplemented(false)}
          >
            <ThumbsDown
              size={20}
              color={!implemented ? currentTheme.colors.background : currentTheme.colors.text}
            />
            <Text style={[
              styles.implementationButtonText,
              !implemented && styles.implementationButtonTextActive
            ]}>
              {t('feedback.implementation.notImplemented')}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Effectiveness Rating */}
      {implemented && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('feedback.effectiveness.title')}</Text>
          <View style={styles.effectivenessContainer}>
            <Text style={styles.effectivenessLabel}>
              {t('feedback.effectiveness.label')}
            </Text>
            <View style={styles.effectivenessSlider}>
              <TouchableOpacity
                style={styles.effectivenessButton}
                onPress={() => setEffectiveness(Math.max(1, effectiveness - 1))}
              >
                <Text style={styles.effectivenessButtonText}>-</Text>
              </TouchableOpacity>
              
              <Text style={styles.effectivenessValue}>{effectiveness}/10</Text>
              
              <TouchableOpacity
                style={styles.effectivenessButton}
                onPress={() => setEffectiveness(Math.min(10, effectiveness + 1))}
              >
                <Text style={styles.effectivenessButtonText}>+</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

      {/* Comments */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('feedback.comments.title')}</Text>
        <View style={styles.commentsContainer}>
          <MessageSquare size={20} color={currentTheme.colors.text} />
          <TextInput
            style={styles.commentsInput}
            placeholder={t('feedback.comments.placeholder')}
            placeholderTextColor={currentTheme.colors.textSecondary}
            value={comments}
            onChangeText={setComments}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
          />
        </View>
      </View>

      {/* Submit Button */}
      <View style={styles.actions}>
        <TouchableOpacity
          style={styles.cancelButton}
          onPress={onClose}
          disabled={isSubmitting}
        >
          <Text style={styles.cancelButtonText}>{t('common.cancel')}</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
          onPress={handleSubmitFeedback}
          disabled={isSubmitting}
        >
          <Send size={16} color={currentTheme.colors.background} />
          <Text style={styles.submitButtonText}>
            {isSubmitting ? t('feedback.submitting') : t('feedback.submit')}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const createStyles = (colors: any) => StyleSheet.create({
  container: {
    backgroundColor: colors.background,
    borderRadius: 16,
    padding: 20,
    margin: 16,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: colors.textSecondary,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 12,
  },
  starsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 8,
  },
  starButton: {
    padding: 4,
  },
  ratingLabel: {
    textAlign: 'center',
    fontSize: 14,
    color: colors.textSecondary,
  },
  implementationButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  implementationButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 8,
  },
  implementationButtonActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  implementationButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text,
  },
  implementationButtonTextActive: {
    color: colors.background,
  },
  effectivenessContainer: {
    alignItems: 'center',
  },
  effectivenessLabel: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 8,
  },
  effectivenessSlider: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  effectivenessButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  effectivenessButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.background,
  },
  effectivenessValue: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    minWidth: 40,
    textAlign: 'center',
  },
  commentsContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  commentsInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: colors.text,
    minHeight: 80,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  cancelButton: {
    flex: 1,
    padding: 14,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.text,
  },
  submitButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 14,
    borderRadius: 8,
    backgroundColor: colors.primary,
    gap: 8,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.background,
  },
}); 