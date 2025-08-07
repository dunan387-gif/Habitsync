import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { ArrowLeft } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '@/context/ThemeContext';
import { useLanguage } from '@/context/LanguageContext';

export default function PrivacyPolicyScreen() {
  const { currentTheme } = useTheme();
  const { t } = useLanguage();
  const router = useRouter();
  const styles = createStyles(currentTheme.colors);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: currentTheme.colors.background }]}>
      <StatusBar style={currentTheme.isDark ? 'light' : 'dark'} />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color={currentTheme.colors.text} />
        </TouchableOpacity>
        <Text style={styles.title}>{t('privacyPolicy.title')}</Text>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.section}>
          <Text style={styles.lastUpdated}>{t('privacyPolicy.lastUpdated')} {new Date().toLocaleDateString()}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('privacyPolicy.sections.introduction.title')}</Text>
          <Text style={styles.sectionText}>
            {t('privacyPolicy.sections.introduction.content')}
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('privacyPolicy.sections.informationCollection.title')}</Text>
          
          <Text style={styles.subsectionTitle}>{t('privacyPolicy.sections.informationCollection.personalInfo.title')}</Text>
          <Text style={styles.sectionText}>
            {t('privacyPolicy.sections.informationCollection.personalInfo.content')}
          </Text>

          <Text style={styles.subsectionTitle}>{t('privacyPolicy.sections.informationCollection.automaticInfo.title')}</Text>
          <Text style={styles.sectionText}>
            {t('privacyPolicy.sections.informationCollection.automaticInfo.content')}
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('privacyPolicy.sections.informationUse.title')}</Text>
          <Text style={styles.sectionText}>
            {t('privacyPolicy.sections.informationUse.content')}
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('privacyPolicy.sections.dataSharing.title')}</Text>
          <Text style={styles.sectionText}>
            {t('privacyPolicy.sections.dataSharing.content')}
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('privacyPolicy.sections.dataSecurity.title')}</Text>
          <Text style={styles.sectionText}>
            {t('privacyPolicy.sections.dataSecurity.content')}
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('privacyPolicy.sections.privacyRights.title')}</Text>
          <Text style={styles.sectionText}>
            {t('privacyPolicy.sections.privacyRights.content')}
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('privacyPolicy.sections.dataRetention.title')}</Text>
          <Text style={styles.sectionText}>
            {t('privacyPolicy.sections.dataRetention.content')}
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('privacyPolicy.sections.childrenPrivacy.title')}</Text>
          <Text style={styles.sectionText}>
            {t('privacyPolicy.sections.childrenPrivacy.content')}
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('privacyPolicy.sections.internationalTransfers.title')}</Text>
          <Text style={styles.sectionText}>
            {t('privacyPolicy.sections.internationalTransfers.content')}
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('privacyPolicy.sections.policyChanges.title')}</Text>
          <Text style={styles.sectionText}>
            {t('privacyPolicy.sections.policyChanges.content')}
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('privacyPolicy.sections.contactUs.title')}</Text>
          <Text style={styles.sectionText}>
            {t('privacyPolicy.sections.contactUs.content')}
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('privacyPolicy.sections.featurePrivacy.title')}</Text>
          
          <Text style={styles.subsectionTitle}>{t('privacyPolicy.sections.featurePrivacy.moodTracking.title')}</Text>
          <Text style={styles.sectionText}>
            {t('privacyPolicy.sections.featurePrivacy.moodTracking.content')}
          </Text>

          <Text style={styles.subsectionTitle}>{t('privacyPolicy.sections.featurePrivacy.socialFeatures.title')}</Text>
          <Text style={styles.sectionText}>
            {t('privacyPolicy.sections.featurePrivacy.socialFeatures.content')}
          </Text>

          <Text style={styles.subsectionTitle}>{t('privacyPolicy.sections.featurePrivacy.analytics.title')}</Text>
          <Text style={styles.sectionText}>
            {t('privacyPolicy.sections.featurePrivacy.analytics.content')}
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
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
    paddingTop: 60,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: {
    marginRight: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.text,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  section: {
    marginBottom: 24,
  },
  lastUpdated: {
    fontSize: 14,
    color: colors.textMuted,
    fontStyle: 'italic',
    textAlign: 'center',
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 12,
  },
  subsectionTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.text,
    marginBottom: 8,
    marginTop: 12,
  },
  sectionText: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
    textAlign: 'justify',
  },
});