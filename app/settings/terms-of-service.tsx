import React from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';

export default function TermsOfServiceScreen() {
  const router = useRouter();
  const { currentTheme, colors } = useTheme(); // Changed from { theme } to { currentTheme, colors }
  const { t } = useLanguage();

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background, // Changed from theme.colors.background
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 16,
      paddingTop: 50,
      borderBottomWidth: 1,
      borderBottomColor: colors.border, // Changed from theme.colors.border
      backgroundColor: colors.surface, // Changed from theme.colors.surface
    },
    backButton: {
      marginRight: 16,
    },
    headerTitle: {
      fontSize: 20,
      fontWeight: '600',
      color: colors.text, // Changed from theme.colors.text
    },
    content: {
      flex: 1,
      padding: 16,
    },
    section: {
      marginBottom: 24,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.text, // Changed from theme.colors.text
      marginBottom: 12,
    },
    sectionText: {
      fontSize: 14,
      lineHeight: 20,
      color: colors.textSecondary, // Changed from theme.colors.textSecondary
      marginBottom: 8,
    },
    bulletPoint: {
      fontSize: 14,
      lineHeight: 20,
      color: colors.textSecondary, // Changed from theme.colors.textSecondary
      marginBottom: 4,
      marginLeft: 16,
    },
    lastUpdated: {
      fontSize: 12,
      color: colors.textMuted, // Changed from theme.colors.textMuted
      fontStyle: 'italic',
      textAlign: 'center',
      marginTop: 24,
      paddingBottom: 32, // Increased from 16 to 32 for more bottom spacing
    },
  });

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons
            name="arrow-back"
            size={24}
            color={colors.text} // Changed from theme.colors.text
          />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('settings.termsOfService')}</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('termsOfService.sections.acceptance.title')}</Text>
          <Text style={styles.sectionText}>
            {t('termsOfService.sections.acceptance.content')}
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('termsOfService.sections.description.title')}</Text>
          <Text style={styles.sectionText}>
            {t('termsOfService.sections.description.content')}
          </Text>
          {(() => {
            const features = t('termsOfService.sections.description.features');
            return Array.isArray(features) && features.map((feature: string, index: number) => (
              <Text key={index} style={styles.bulletPoint}>• {feature}</Text>
            ));
          })()}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('termsOfService.sections.accounts.title')}</Text>
          <Text style={styles.sectionText}>
            {t('termsOfService.sections.accounts.content')}
          </Text>
          {(() => {
            const responsibilities = t('termsOfService.sections.accounts.responsibilities');
            return Array.isArray(responsibilities) && responsibilities.map((responsibility: string, index: number) => (
              <Text key={index} style={styles.bulletPoint}>• {responsibility}</Text>
            ));
          })()}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('termsOfService.sections.acceptableUse.title')}</Text>
          <Text style={styles.sectionText}>
            {t('termsOfService.sections.acceptableUse.content')}
          </Text>
          {(() => {
            const prohibitions = t('termsOfService.sections.acceptableUse.prohibitions');
            return Array.isArray(prohibitions) && prohibitions.map((prohibition: string, index: number) => (
              <Text key={index} style={styles.bulletPoint}>• {prohibition}</Text>
            ));
          })()}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('termsOfService.sections.privacy.title')}</Text>
          <Text style={styles.sectionText}>
            {t('termsOfService.sections.privacy.content')}
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('termsOfService.sections.intellectualProperty.title')}</Text>
          <Text style={styles.sectionText}>
            {t('termsOfService.sections.intellectualProperty.content')}
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('termsOfService.sections.userContent.title')}</Text>
          <Text style={styles.sectionText}>
            {t('termsOfService.sections.userContent.content')}
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('termsOfService.sections.disclaimers.title')}</Text>
          <Text style={styles.sectionText}>
            {t('termsOfService.sections.disclaimers.content')}
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('termsOfService.sections.liability.title')}</Text>
          <Text style={styles.sectionText}>
            {t('termsOfService.sections.liability.content')}
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('termsOfService.sections.termination.title')}</Text>
          <Text style={styles.sectionText}>
            {t('termsOfService.sections.termination.content')}
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('termsOfService.sections.changes.title')}</Text>
          <Text style={styles.sectionText}>
            {t('termsOfService.sections.changes.content')}
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('termsOfService.sections.governingLaw.title')}</Text>
          <Text style={styles.sectionText}>
            {t('termsOfService.sections.governingLaw.content')}
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('termsOfService.sections.contact.title')}</Text>
          <Text style={styles.sectionText}>
            {t('termsOfService.sections.contact.content')}
          </Text>
          <Text style={styles.sectionText}>
            {t('termsOfService.sections.contact.email')}{"\n"}
            {t('termsOfService.sections.contact.address')}
          </Text>
        </View>

        <Text style={styles.lastUpdated}>
          {t('termsOfService.lastUpdated')} {new Date().toLocaleDateString()}
        </Text>
      </ScrollView>
    </View>
  );
}