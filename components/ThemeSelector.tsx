import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  Modal,
} from 'react-native';
import { Check, Crown, Palette } from 'lucide-react-native';
import { useTheme } from '@/context/ThemeContext';
import { useLanguage } from '@/context/LanguageContext';
import { Theme } from '@/types';

type ThemeSelectorProps = {
  visible: boolean;
  onClose: () => void;
};

export default function ThemeSelector({ visible, onClose }: ThemeSelectorProps) {
  const { currentTheme, setTheme, availableThemes, isPremiumUser } = useTheme();
  const { t } = useLanguage();
  const [isChangingTheme, setIsChangingTheme] = useState(false);

  const handleThemeSelect = async (theme: Theme) => {
    if (theme.isPremium && !isPremiumUser) {
      Alert.alert(
        t('themeSelector.premiumTheme'),
        `"${theme.name}" ${t('themeSelector.premiumMessage')}`,
        [
          { text: t('themeSelector.maybeLater'), style: 'cancel' },
          { text: t('themeSelector.upgradeNow'), onPress: () => handleUpgrade() },
        ]
      );
      return;
    }

    setIsChangingTheme(true);
    try {
      await setTheme(theme.id);
    } catch (error) {
      Alert.alert(t('themeSelector.error'), t('themeSelector.failedToChange'));
    } finally {
      setIsChangingTheme(false);
    }
  };

  const handleUpgrade = () => {
    Alert.alert(t('themeSelector.comingSoon'), t('themeSelector.premiumFeatures'));
  };

  const renderThemeOption = (theme: Theme) => {
    const isSelected = currentTheme.id === theme.id;
    const isLocked = theme.isPremium && !isPremiumUser;

    return (
      <TouchableOpacity
        key={theme.id}
        style={[
          styles.themeOption,
          { backgroundColor: currentTheme.colors.card },
          isSelected && {
            borderColor: currentTheme.colors.primary,
            borderWidth: 2,
          },
        ]}
        onPress={() => handleThemeSelect(theme)}
        disabled={isChangingTheme}
      >
        <View style={styles.themePreview}>
          <View style={[
            styles.previewBackground,
            { backgroundColor: theme.colors.background }
          ]}>
            <View style={[
              styles.previewSurface,
              { backgroundColor: theme.colors.surface }
            ]}>
              <View style={[
                styles.previewPrimary,
                { backgroundColor: theme.colors.primary }
              ]} />
              <View style={[
                styles.previewAccent,
                { backgroundColor: theme.colors.accent }
              ]} />
            </View>
          </View>
        </View>
        
        <View style={styles.themeInfo}>
          <View style={styles.themeHeader}>
            <Text style={[
              styles.themeName,
              { color: currentTheme.colors.text }
            ]}>
              {theme.name}
            </Text>
            {isLocked && (
              <Crown size={16} color={currentTheme.colors.warning} />
            )}
            {isSelected && (
              <Check size={16} color={currentTheme.colors.primary} />
            )}
          </View>
          
          <Text style={[
            styles.themeDescription,
            { color: currentTheme.colors.textSecondary }
          ]}>
            {theme.isDark ? t('themeSelector.darkTheme') : t('themeSelector.lightTheme')}
            {theme.isPremium && ` • ${t('themeSelector.premium')}`}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={[
        styles.container,
        { backgroundColor: currentTheme.colors.background }
      ]}>
        <View style={[
          styles.header,
          { borderBottomColor: currentTheme.colors.border }
        ]}>
          <View style={styles.headerContent}>
            <Palette size={24} color={currentTheme.colors.primary} />
            <Text style={[
              styles.title,
              { color: currentTheme.colors.text }
            ]}>
              {t('themeSelector.title')}
            </Text>
          </View>
          
          <TouchableOpacity
            style={[
              styles.closeButton,
              { backgroundColor: currentTheme.colors.surface }
            ]}
            onPress={onClose}
          >
            <Text style={[
              styles.closeButtonText,
              { color: currentTheme.colors.textSecondary }
            ]}>
              {t('themeSelector.done')}
            </Text>
          </TouchableOpacity>
        </View>
        
        <ScrollView
          style={styles.content}
          showsVerticalScrollIndicator={false}
        >
          <Text style={[
            styles.sectionTitle,
            { color: currentTheme.colors.textSecondary }
          ]}>
            {t('themeSelector.availableThemes')}
          </Text>
          
          {availableThemes.map(renderThemeOption)}
          
          {!isPremiumUser && (
            <View style={[
              styles.premiumBanner,
              { backgroundColor: currentTheme.colors.surface }
            ]}>
              <Crown size={20} color={currentTheme.colors.warning} />
              <Text style={[
                styles.premiumText,
                { color: currentTheme.colors.text }
              ]}>
                {t('themeSelector.unlockPremium')}
              </Text>
              <TouchableOpacity
                style={[
                  styles.upgradeButton,
                  { backgroundColor: currentTheme.colors.primary }
                ]}
                onPress={handleUpgrade}
              >
                <Text style={styles.upgradeButtonText}>{t('themeSelector.upgrade')}</Text>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
  },
  closeButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  closeButtonText: {
    fontSize: 16,
    fontWeight: '500',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 16,
  },
  themeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  themePreview: {
    width: 60,
    height: 60,
    borderRadius: 8,
    overflow: 'hidden',
    marginRight: 16,
  },
  previewBackground: {
    flex: 1,
    padding: 4,
  },
  previewSurface: {
    flex: 1,
    borderRadius: 4,
    padding: 4,
    flexDirection: 'row',
    gap: 2,
  },
  previewPrimary: {
    flex: 1,
    borderRadius: 2,
  },
  previewAccent: {
    width: 8,
    borderRadius: 2,
  },
  themeInfo: {
    flex: 1,
  },
  themeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  themeName: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
  },
  themeDescription: {
    fontSize: 14,
  },
  premiumBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginTop: 20,
    gap: 12,
  },
  premiumText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
  },
  upgradeButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  upgradeButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
});