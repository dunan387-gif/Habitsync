import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  ScrollView,
  Modal,
  ActivityIndicator,
  Linking,
} from 'react-native';
import { X, Send, MessageCircle, Bug, Star, Heart } from 'lucide-react-native';
import { useTheme } from '@/context/ThemeContext';
import { useLanguage } from '@/context/LanguageContext';
import { useAuth } from '@/context/AuthContext';

type FeedbackType = 'general' | 'bug' | 'feature' | 'praise';

interface FeedbackModalProps {
  visible: boolean;
  onClose: () => void;
}

const FEEDBACK_TYPES: Array<{
  id: FeedbackType;
  icon: React.ReactNode;
  labelKey: string;
  color: string;
}> = [
  {
    id: 'general',
    icon: <MessageCircle size={20} />,
    labelKey: 'feedback.types.general',
    color: '#3B82F6'
  },
  {
    id: 'bug',
    icon: <Bug size={20} />,
    labelKey: 'feedback.types.bug',
    color: '#EF4444'
  },
  {
    id: 'feature',
    icon: <Star size={20} />,
    labelKey: 'feedback.types.feature',
    color: '#F59E0B'
  },
  {
    id: 'praise',
    icon: <Heart size={20} />,
    labelKey: 'feedback.types.praise',
    color: '#10B981'
  }
];

export default function FeedbackModal({ visible, onClose }: FeedbackModalProps) {
  const { currentTheme } = useTheme();
  const { t } = useLanguage();
  const { user } = useAuth();
  
  const [selectedType, setSelectedType] = useState<FeedbackType>('general');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const styles = createStyles(currentTheme.colors);

  const handleSubmit = async () => {
    if (!subject.trim()) {
      Alert.alert(t('feedback.validation.subjectRequired'), t('feedback.validation.pleaseEnterSubject'));
      return;
    }

    if (!message.trim()) {
      Alert.alert(t('feedback.validation.messageRequired'), t('feedback.validation.pleaseEnterMessage'));
      return;
    }

    setIsSubmitting(true);

    try {
      // Create feedback object
      const feedbackData = {
        type: selectedType,
        subject: subject.trim(),
        message: message.trim(),
        userId: user?.id || 'anonymous',
        userEmail: user?.email || 'anonymous',
        timestamp: new Date().toISOString(),
        appVersion: '1.0.0',
        platform: 'mobile',
        deviceInfo: {
          platform: 'react-native',
          version: '1.0.0'
        }
      };

      // Send feedback directly to backend API
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

      console.log('Feedback submitted successfully:', feedbackData);

      // Show success message
      Alert.alert(
        t('feedback.success.title'),
        t('feedback.success.message'),
        [
          {
            text: t('common.great'),
            onPress: () => {
              // Reset form and close modal
              setSelectedType('general');
              setSubject('');
              setMessage('');
              onClose();
            }
          }
        ]
      );

    } catch (error) {
      console.error('Feedback submission error:', error);
      
      // Fallback: Try to send via email if API fails
      try {
        const subject = encodeURIComponent(`App Feedback - ${selectedType}`);
        const body = encodeURIComponent(`
Feedback Type: ${selectedType}
Subject: ${subject.trim()}
Message: ${message.trim()}
User ID: ${user?.id || 'anonymous'}
User Email: ${user?.email || 'anonymous'}
Timestamp: ${new Date().toLocaleString()}
        `);
        
        const mailtoUrl = `mailto:your-email@domain.com?subject=${subject}&body=${body}`;
        await Linking.openURL(mailtoUrl);
        
        Alert.alert(
          t('feedback.success.title'),
          'Feedback sent via email as fallback. Thank you!',
          [
            {
              text: t('common.great'),
              onPress: () => {
                setSelectedType('general');
                setSubject('');
                setMessage('');
                onClose();
              }
            }
          ]
        );
      } catch (emailError) {
        Alert.alert(
          t('feedback.error.title'),
          t('feedback.error.message')
        );
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (subject.trim() || message.trim()) {
      Alert.alert(
        t('feedback.discard.title'),
        t('feedback.discard.message'),
        [
          { text: t('common.cancel'), style: 'cancel' },
          {
            text: t('feedback.discard.confirm'),
            style: 'destructive',
            onPress: () => {
              setSelectedType('general');
              setSubject('');
              setMessage('');
              onClose();
            }
          }
        ]
      );
    } else {
      onClose();
    }
  };

  const getPlaceholderText = () => {
    switch (selectedType) {
      case 'bug':
        return t('feedback.placeholders.bug');
      case 'feature':
        return t('feedback.placeholders.feature');
      case 'praise':
        return t('feedback.placeholders.praise');
      default:
        return t('feedback.placeholders.general');
    }
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
          <Text style={styles.headerTitle}>{t('feedback.title')}</Text>
          <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
            <X size={24} color={currentTheme.colors.text} />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Feedback Type Selection */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t('feedback.typeSelection')}</Text>
            <View style={styles.typeGrid}>
              {FEEDBACK_TYPES.map((type) => (
                <TouchableOpacity
                  key={type.id}
                  style={[
                    styles.typeCard,
                    selectedType === type.id && {
                      backgroundColor: type.color + '20',
                      borderColor: type.color,
                    }
                  ]}
                  onPress={() => setSelectedType(type.id)}
                >
                  <View style={styles.typeIcon}>
                    {type.icon}
                  </View>
                  <Text style={[
                    styles.typeLabel,
                    selectedType === type.id && { color: type.color }
                  ]}>
                    {t(type.labelKey)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Subject Input */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t('feedback.subject')}</Text>
            <TextInput
              style={styles.subjectInput}
              placeholder={t('feedback.subjectPlaceholder')}
              placeholderTextColor={currentTheme.colors.textSecondary}
              value={subject}
              onChangeText={setSubject}
              maxLength={100}
            />
            <Text style={styles.characterCount}>
              {subject.length}/100 {t('common.characters')}
            </Text>
          </View>

          {/* Message Input */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t('feedback.message')}</Text>
            <TextInput
              style={styles.messageInput}
              placeholder={getPlaceholderText()}
              placeholderTextColor={currentTheme.colors.textSecondary}
              value={message}
              onChangeText={setMessage}
              multiline
              numberOfLines={8}
              maxLength={1000}
              textAlignVertical="top"
            />
            <Text style={styles.characterCount}>
              {message.length}/1000 {t('common.characters')}
            </Text>
          </View>

          {/* Submit Button */}
          <View style={styles.submitSection}>
            <TouchableOpacity
              style={[
                styles.submitButton,
                { backgroundColor: currentTheme.colors.primary },
                isSubmitting && styles.disabledButton
              ]}
              onPress={handleSubmit}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <ActivityIndicator color={currentTheme.colors.background} size="small" />
              ) : (
                <Send size={20} color={currentTheme.colors.background} />
              )}
              <Text style={styles.submitButtonText}>
                {isSubmitting ? t('feedback.submitting') : t('feedback.submit')}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Footer Info */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>{t('feedback.footer.info')}</Text>
            <Text style={styles.footerText}>{t('feedback.footer.response')}</Text>
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
    paddingTop: 50,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.card,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
  },
  closeButton: {
    padding: 8,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  section: {
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 12,
  },
  typeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  typeCard: {
    width: '48%',
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.border,
  },
  typeIcon: {
    marginBottom: 8,
  },
  typeLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text,
    textAlign: 'center',
  },
  subjectInput: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.border,
  },
  messageInput: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.border,
    minHeight: 120,
  },
  characterCount: {
    textAlign: 'right',
    marginTop: 8,
    fontSize: 12,
    color: colors.textSecondary,
  },
  submitSection: {
    marginTop: 32,
    marginBottom: 20,
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 18,
    borderRadius: 16,
    gap: 8,
  },
  disabledButton: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: colors.background,
    fontSize: 16,
    fontWeight: '600',
  },
  footer: {
    marginTop: 20,
    padding: 16,
    backgroundColor: colors.surface,
    borderRadius: 12,
    marginBottom: 40,
  },
  footerText: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 4,
  },
});
