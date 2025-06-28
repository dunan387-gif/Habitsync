import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  Switch,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Palette, Crown, Info, Globe } from 'lucide-react-native';
import { useTheme } from '@/context/ThemeContext';
import { useLanguage } from '@/context/LanguageContext';
import ThemeSelector from '@/components/ThemeSelector';
import LanguageSelector from '@/components/LanguageSelector';
import { useCelebration } from '@/context/CelebrationContext';
import { useState } from 'react';

export default function SettingsScreen() {
  const { currentTheme, isPremiumUser } = useTheme();
  const { currentLanguage, t } = useLanguage();
  const [showThemeSelector, setShowThemeSelector] = useState(false);
  const [showLanguageSelector, setShowLanguageSelector] = useState(false);
  const { animationsEnabled, setAnimationsEnabled } = useCelebration();

  const styles = createStyles(currentTheme.colors);
  
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: currentTheme.colors.background }]}>
      <StatusBar style={currentTheme.isDark ? 'light' : 'dark'} />
      
      <ScrollView style={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('appearance')}</Text>
          
          <TouchableOpacity
            style={styles.settingItem}
            onPress={() => setShowLanguageSelector(true)}
          >
            <View style={styles.settingLeft}>
              <Globe size={20} color={currentTheme.colors.primary} />
              <View style={styles.settingText}>
                <Text style={styles.settingTitle}>{t('language')}</Text>
                <Text style={styles.settingSubtitle}>
                  {t('current_language')}{currentLanguage.nativeName}
                </Text>
              </View>
            </View>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.settingItem}
            onPress={() => setShowThemeSelector(true)}
          >
            <View style={styles.settingLeft}>
              <Palette size={20} color={currentTheme.colors.primary} />
              <View style={styles.settingText}>
                <Text style={styles.settingTitle}>{t('theme')}</Text>
                <Text style={styles.settingSubtitle}>
                  {currentTheme.name}
                  {currentTheme.isPremium && ' • Premium'}
                </Text>
              </View>
            </View>
          </TouchableOpacity>
        </View>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('premium')}</Text>
          
          <View style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <Crown size={20} color={currentTheme.colors.warning} />
              <View style={styles.settingText}>
                <Text style={styles.settingTitle}>
                  {isPremiumUser ? t('premium_active') : t('upgrade_to_premium')}
                </Text>
                <Text style={styles.settingSubtitle}>
                  {isPremiumUser 
                    ? t('premium_active_desc')
                    : t('premium_upgrade_desc')
                  }
                </Text>
              </View>
            </View>
          </View>
        </View>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('about')}</Text>
          
          <View style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <Info size={20} color={currentTheme.colors.textSecondary} />
              <View style={styles.settingText}>
                <Text style={styles.settingTitle}>{t('version')}</Text>
                <Text style={styles.settingSubtitle}>1.0.0</Text>
              </View>
            </View>
          </View>
        </View>
        
        <View style={styles.animationsSection}>
          <View style={styles.animationsSectionHeader}>
            <View style={styles.animationsIconContainer}>
              <Text style={styles.animationsIcon}>✨</Text>
            </View>
            <View style={styles.animationsTitleContainer}>
              <Text style={styles.animationsSectionTitle}>{t('animations')}</Text>
              <Text style={styles.animationsSectionSubtitle}>Enhance your experience</Text>
            </View>
          </View>
          
          <View style={styles.animationsSettingCard}>
            <View style={styles.animationsSettingContent}>
              <View style={styles.animationsSettingInfo}>
                <Text style={styles.animationsSettingLabel}>{t('celebration_animations')}</Text>
                <Text style={styles.animationsSettingDescription}>
                  {t('celebration_animations_desc')}
                </Text>
              </View>
              <View style={styles.switchContainer}>
                <Switch
                  value={animationsEnabled}
                  onValueChange={setAnimationsEnabled}
                  trackColor={{ 
                    false: currentTheme.colors.border, 
                    true: `${currentTheme.colors.primary}40` 
                  }}
                  thumbColor={animationsEnabled ? currentTheme.colors.primary : currentTheme.colors.textMuted}
                  ios_backgroundColor={currentTheme.colors.border}
                />
              </View>
            </View>
            {animationsEnabled && (
              <View style={styles.animationsPreview}>
                <Text style={styles.previewText}>🎉 Celebrations enabled!</Text>
              </View>
            )}
          </View>
        </View>
        
        <ThemeSelector
          visible={showThemeSelector}
          onClose={() => setShowThemeSelector(false)}
        />
        
        <LanguageSelector
          visible={showLanguageSelector}
          onClose={() => setShowLanguageSelector(false)}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const createStyles = (colors: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingTop: 20,
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.text,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: 16,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.card,
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingText: {
    marginLeft: 12,
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.text,
    marginBottom: 2,
  },
  settingSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  settingInfo: {
    flex: 1,
    marginRight: 12,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 14,
    opacity: 0.7,
  },
  // Enhanced animations section styles
  animationsSection: {
    marginBottom: 32,
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: colors.text,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  animationsSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  animationsIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: `${colors.primary}15`,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  animationsIcon: {
    fontSize: 24,
  },
  animationsTitleContainer: {
    flex: 1,
  },
  animationsSectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 2,
  },
  animationsSectionSubtitle: {
    fontSize: 14,
    color: colors.textMuted,
    fontWeight: '500',
  },
  animationsSettingCard: {
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  animationsSettingContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  animationsSettingInfo: {
    flex: 1,
    marginRight: 16,
  },
  animationsSettingLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 6,
  },
  animationsSettingDescription: {
    fontSize: 14,
    color: colors.textMuted,
    lineHeight: 20,
  },
  switchContainer: {
    padding: 4,
  },
  animationsPreview: {
    marginTop: 16,
    padding: 12,
    backgroundColor: `${colors.success}10`,
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: colors.success,
  },
  previewText: {
    fontSize: 14,
    color: colors.success,
    fontWeight: '500',
    textAlign: 'center',
  },
});