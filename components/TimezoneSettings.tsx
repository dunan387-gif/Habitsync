import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@/context/ThemeContext';
import { useLanguage } from '@/context/LanguageContext';
import { timezoneManager, TimezoneInfo } from '@/utils/timezone';
import { Globe, Check, X } from 'lucide-react-native';

interface TimezoneSettingsProps {
  visible: boolean;
  onClose: () => void;
}

export default function TimezoneSettings({ visible, onClose }: TimezoneSettingsProps) {
  const { currentTheme } = useTheme();
  const { t } = useLanguage();
  const [currentTimezone, setCurrentTimezone] = useState<TimezoneInfo | null>(null);
  const [availableTimezones, setAvailableTimezones] = useState<TimezoneInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const styles = createStyles(currentTheme.colors);

  useEffect(() => {
    loadTimezoneData();
  }, []);

  const loadTimezoneData = async () => {
    try {
      setIsLoading(true);
      
      // Wait for timezone manager to initialize
      await timezoneManager.initialize();
      
      const current = timezoneManager.getCurrentTimezone();
      const available = timezoneManager.getAvailableTimezones();
      
      setCurrentTimezone(current);
      setAvailableTimezones(available);
    } catch (error) {
      console.error('Error loading timezone data:', error);
      Alert.alert(t('common.error'), t('settings.timezone.error'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleTimezoneChange = async (timezone: TimezoneInfo) => {
    try {
      await timezoneManager.setTimezone(timezone);
      setCurrentTimezone(timezone);
      Alert.alert(
        t('common.success'),
        t('settings.timezone.success'),
        [{ text: t('common.ok') }]
      );
    } catch (error) {
      console.error('Error changing timezone:', error);
      Alert.alert(t('common.error'), t('settings.timezone.error'));
    }
  };

  const getTimezoneDisplayName = (timezone: TimezoneInfo): string => {
    const offset = timezone.offset >= 0 ? `+${timezone.offset}` : `${timezone.offset}`;
    const city = timezone.city || timezone.timezone.split('/').pop() || timezone.timezone;
    return `${city} (UTC${offset})`;
  };

  const getCurrentTime = (): string => {
    if (!currentTimezone) return '';
    
    try {
      const now = new Date();
      return now.toLocaleTimeString('en-US', {
        timeZone: currentTimezone.timezone,
        hour12: false,
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return new Date().toLocaleTimeString('en-US', { hour12: false });
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Globe size={24} color={currentTheme.colors.primary} />
          <Text style={styles.title}>{t('settings.timezone.title')}</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <X size={24} color={currentTheme.colors.textSecondary} />
          </TouchableOpacity>
        </View>

        {isLoading ? (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>{t('settings.timezone.loading')}</Text>
          </View>
        ) : (
          <>
            {currentTimezone && (
              <View style={styles.currentTimezoneContainer}>
                <Text style={styles.currentTimezoneLabel}>{t('settings.timezone.currentTimezone')}</Text>
                <View style={styles.currentTimezoneCard}>
                  <Text style={styles.currentTimezoneName}>
                    {getTimezoneDisplayName(currentTimezone)}
                  </Text>
                  <Text style={styles.currentTime}>
                    {t('settings.timezone.currentTime')}: {getCurrentTime()}
                  </Text>
                </View>
              </View>
            )}

            <Text style={styles.sectionTitle}>{t('settings.timezone.selectTimezone')}</Text>
            
            <ScrollView style={styles.timezoneList} showsVerticalScrollIndicator={false}>
              {availableTimezones.map((timezone) => (
                <TouchableOpacity
                  key={timezone.timezone}
                  style={[
                    styles.timezoneItem,
                    currentTimezone?.timezone === timezone.timezone && styles.selectedTimezone
                  ]}
                  onPress={() => handleTimezoneChange(timezone)}
                >
                  <View style={styles.timezoneInfo}>
                    <Text style={styles.timezoneName}>
                      {getTimezoneDisplayName(timezone)}
                    </Text>
                    <Text style={styles.timezoneRegion}>
                      {timezone.region} {timezone.city && `• ${timezone.city}`}
                    </Text>
                  </View>
                  {currentTimezone?.timezone === timezone.timezone && (
                    <Check size={20} color={currentTheme.colors.primary} />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </>
        )}
      </SafeAreaView>
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
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginLeft: 12,
    flex: 1,
  },
  closeButton: {
    padding: 8,
  },
  closeButtonText: {
    fontSize: 18,
    color: colors.textSecondary,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: colors.textSecondary,
  },
  currentTimezoneContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  currentTimezoneLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: 8,
  },
  currentTimezoneCard: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.primary + '30',
  },
  currentTimezoneName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  currentTime: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  timezoneList: {
    flex: 1,
    paddingHorizontal: 20,
  },
  timezoneItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  selectedTimezone: {
    borderColor: colors.primary,
    backgroundColor: colors.primary + '10',
  },
  timezoneInfo: {
    flex: 1,
  },
  timezoneName: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.text,
    marginBottom: 4,
  },
  timezoneRegion: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  footer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  footerText: {
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
  },
});
