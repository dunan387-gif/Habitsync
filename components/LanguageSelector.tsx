import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  SafeAreaView,
  ScrollView,
} from 'react-native';
import { X, Check, Globe } from 'lucide-react-native';
import { useLanguage } from '@/context/LanguageContext';
import { useTheme } from '@/context/ThemeContext';

type LanguageSelectorProps = {
  visible: boolean;
  onClose: () => void;
};

export default function LanguageSelector({ visible, onClose }: LanguageSelectorProps) {
  const { currentLanguage, availableLanguages, setLanguage, t } = useLanguage();
  const { currentTheme } = useTheme();

  const handleLanguageSelect = async (languageCode: string) => {
    try {
      await setLanguage(languageCode);
      onClose();
    } catch (error) {
      console.error('Failed to set language:', error);
    }
  };

  const styles = createStyles(currentTheme.colors);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Globe size={24} color={currentTheme.colors.primary} />
            <Text style={styles.title}>{t('languageSelector.selectLanguage')}</Text>
          </View>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <X size={24} color={currentTheme.colors.text} />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content}>
          {availableLanguages.map((language) => (
            <TouchableOpacity
              key={language.code}
              style={[
                styles.languageItem,
                currentLanguage.code === language.code && styles.selectedLanguageItem,
              ]}
              onPress={() => handleLanguageSelect(language.code)}
            >
              <View style={styles.languageInfo}>
                <Text style={styles.languageName}>{language.nativeName}</Text>
                <Text style={styles.languageSubtitle}>{language.name}</Text>
              </View>
              {currentLanguage.code === language.code && (
                <Check size={20} color={currentTheme.colors.primary} />
              )}
            </TouchableOpacity>
          ))}
        </ScrollView>
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
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
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
  languageItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.card,
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
  },
  selectedLanguageItem: {
    borderWidth: 2,
    borderColor: colors.primary,
  },
  languageInfo: {
    flex: 1,
  },
  languageName: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.text,
    marginBottom: 2,
  },
  languageSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
  },
});