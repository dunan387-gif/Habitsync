import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '@/context/ThemeContext';
import { useLanguage } from '@/context/LanguageContext';
import { useGamification } from '@/context/GamificationContext';
import { Heart, X, Calendar } from 'lucide-react-native';
import QuickMoodSelector from './QuickMoodSelector';

interface DailyMoodReminderProps {
  children: React.ReactNode;
}

export default function DailyMoodReminder({ children }: DailyMoodReminderProps) {
  const { currentTheme } = useTheme();
  const { t } = useLanguage();
  const { getTodaysMoodEntry } = useGamification();
  const [showMoodReminder, setShowMoodReminder] = useState(false);
  const [showMoodSelector, setShowMoodSelector] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  const styles = createStyles(currentTheme.colors);
  
  useEffect(() => {
    checkDailyMoodReminder();
  }, []);
  
  const checkDailyMoodReminder = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const lastReminderDate = await AsyncStorage.getItem('lastMoodReminderDate');
      const todaysMoodEntry = getTodaysMoodEntry();
      
      // Show reminder if:
      // 1. Haven't shown reminder today
      // 2. User hasn't logged mood today
      // 3. It's a new day
      const shouldShowReminder = 
        lastReminderDate !== today && 
        !todaysMoodEntry;
      
      if (shouldShowReminder) {
        setShowMoodReminder(true);
        await AsyncStorage.setItem('lastMoodReminderDate', today);
      }
    } catch (error) {
      console.error('Error checking daily mood reminder:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleMoodReminderResponse = (action: 'checkin' | 'later' | 'dismiss') => {
    setShowMoodReminder(false);
    
    if (action === 'checkin') {
      setShowMoodSelector(true);
    } else if (action === 'later') {
      // Set a reminder to show again in a few hours
      setTimeout(() => {
        setShowMoodReminder(true);
      }, 4 * 60 * 60 * 1000); // 4 hours
    }
  };
  
  const handleMoodComplete = () => {
    setShowMoodSelector(false);
    Alert.alert(
      t('dailyMoodReminder.successTitle'),
      t('dailyMoodReminder.successMessage'),
      [{ text: 'Continue', style: 'default' }]
    );
  };
  
  if (isLoading) {
    return <View style={styles.loadingContainer} />;
  }
  
  return (
    <>
      {children}
      
      {/* Daily Mood Reminder Modal */}
      <Modal
        visible={showMoodReminder}
        transparent
        animationType="fade"
        onRequestClose={() => handleMoodReminderResponse('dismiss')}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.reminderCard}>
            <TouchableOpacity 
              style={styles.closeButton}
              onPress={() => handleMoodReminderResponse('dismiss')}
            >
              <X size={24} color={currentTheme.colors.textSecondary} />
            </TouchableOpacity>
            
            <View style={styles.reminderHeader}>
              <Heart size={48} color={currentTheme.colors.primary} />
              <Text style={styles.reminderTitle}>{t('dailyMoodReminder.title')}</Text>
              <Text style={styles.reminderSubtitle}>
                {t('dailyMoodReminder.subtitle')}
              </Text>
            </View>
            
            <View style={styles.benefitsContainer}>
              <Text style={styles.benefitsTitle}>{t('dailyMoodReminder.whyTrack')}</Text>
              <View style={styles.benefitItem}>
                <Text style={styles.benefitEmoji}>🧠</Text>
                <Text style={styles.benefitText}>{t('dailyMoodReminder.benefit1')}</Text>
              </View>
              <View style={styles.benefitItem}>
                <Text style={styles.benefitEmoji}>📊</Text>
                <Text style={styles.benefitText}>{t('dailyMoodReminder.benefit2')}</Text>
              </View>
              <View style={styles.benefitItem}>
                <Text style={styles.benefitEmoji}>🎯</Text>
                <Text style={styles.benefitText}>{t('dailyMoodReminder.benefit3')}</Text>
              </View>
            </View>
            
            <View style={styles.buttonContainer}>
              <TouchableOpacity 
                style={[styles.button, styles.primaryButton]}
                onPress={() => handleMoodReminderResponse('checkin')}
              >
                <Calendar size={20} color="white" />
                <Text style={styles.primaryButtonText}>{t('dailyMoodReminder.checkinNow')}</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.button, styles.secondaryButton]}
                onPress={() => handleMoodReminderResponse('later')}
              >
                <Text style={styles.secondaryButtonText}>{t('dailyMoodReminder.remindLater')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      
      {/* Mood Selector Modal */}
      <Modal
        visible={showMoodSelector}
        transparent
        animationType="slide"
        onRequestClose={() => setShowMoodSelector(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.moodSelectorContainer}>
            <View style={styles.moodSelectorHeader}>
              <Text style={styles.moodSelectorTitle}>{t('dailyMoodReminder.howFeeling')}</Text>
              <TouchableOpacity onPress={() => setShowMoodSelector(false)}>
                <X size={24} color={currentTheme.colors.textSecondary} />
              </TouchableOpacity>
            </View>
            
            <QuickMoodSelector 
              onMoodSelect={handleMoodComplete}
              showIntensitySlider={true}
              showContextTags={true}
            />
          </View>
        </View>
      </Modal>
    </>
  );
}

const createStyles = (colors: any) => StyleSheet.create({
  loadingContainer: {
    flex: 1,
    backgroundColor: colors.background,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  reminderCard: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    position: 'relative',
  },
  closeButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    zIndex: 1,
  },
  reminderHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  reminderTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  reminderSubtitle: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  benefitsContainer: {
    marginBottom: 24,
  },
  benefitsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 16,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  benefitEmoji: {
    fontSize: 20,
    marginRight: 12,
  },
  benefitText: {
    fontSize: 14,
    color: colors.textSecondary,
    flex: 1,
  },
  buttonContainer: {
    gap: 12,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    gap: 8,
  },
  primaryButton: {
    backgroundColor: colors.primary,
  },
  primaryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
  },
  secondaryButtonText: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '500',
  },
  moodSelectorContainer: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 20,
    width: '100%',
    maxWidth: 400,
    maxHeight: '80%',
  },
  moodSelectorHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  moodSelectorTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
  },
});