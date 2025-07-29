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
        <Text style={styles.title}>Privacy Policy</Text>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.section}>
          <Text style={styles.lastUpdated}>Last updated: {new Date().toLocaleDateString()}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>1. Introduction</Text>
          <Text style={styles.sectionText}>
            Welcome to Productivity Habit Tracker ("we," "our," or "us"). We are committed to protecting your privacy and ensuring the security of your personal information. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our mobile application.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>2. Information We Collect</Text>
          
          <Text style={styles.subsectionTitle}>2.1 Personal Information</Text>
          <Text style={styles.sectionText}>
            • Account information (email address, username, profile picture){"\n"}
            • Habit tracking data and progress{"\n"}
            • Mood and wellness data{"\n"}
            • User preferences and settings{"\n"}
            • Device information and usage analytics
          </Text>

          <Text style={styles.subsectionTitle}>2.2 Automatically Collected Information</Text>
          <Text style={styles.sectionText}>
            • Device type, operating system, and version{"\n"}
            • App usage patterns and performance data{"\n"}
            • Crash reports and error logs{"\n"}
            • IP address and general location data
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>3. How We Use Your Information</Text>
          <Text style={styles.sectionText}>
            We use your information to:{"\n"}
            • Provide and maintain our services{"\n"}
            • Personalize your experience{"\n"}
            • Track your progress and provide insights{"\n"}
            • Send notifications and reminders{"\n"}
            • Improve our app and develop new features{"\n"}
            • Provide customer support{"\n"}
            • Ensure security and prevent fraud
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>4. Data Sharing and Disclosure</Text>
          <Text style={styles.sectionText}>
            We do not sell, trade, or rent your personal information to third parties. We may share your information only in the following circumstances:{"\n"}
            • With your explicit consent{"\n"}
            • For legal compliance or protection of rights{"\n"}
            • With service providers who assist in app functionality{"\n"}
            • In anonymized form for research and analytics
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>5. Data Security</Text>
          <Text style={styles.sectionText}>
            We implement appropriate technical and organizational measures to protect your personal information:{"\n"}
            • End-to-end encryption for sensitive data{"\n"}
            • Secure data transmission protocols{"\n"}
            • Regular security audits and updates{"\n"}
            • Limited access to personal data{"\n"}
            • Secure cloud storage with reputable providers
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>6. Your Privacy Rights</Text>
          <Text style={styles.sectionText}>
            You have the right to:{"\n"}
            • Access your personal data{"\n"}
            • Correct inaccurate information{"\n"}
            • Delete your account and data{"\n"}
            • Export your data{"\n"}
            • Opt-out of data collection{"\n"}
            • Control privacy settings
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>7. Data Retention</Text>
          <Text style={styles.sectionText}>
            We retain your personal information only as long as necessary to provide our services and comply with legal obligations. Habit tracking data is kept for the duration of your account unless you choose to delete it. Anonymous analytics data may be retained longer for research purposes.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>8. Children's Privacy</Text>
          <Text style={styles.sectionText}>
            Our app is not intended for children under 13 years of age. We do not knowingly collect personal information from children under 13. If you believe we have collected information from a child under 13, please contact us immediately.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>9. International Data Transfers</Text>
          <Text style={styles.sectionText}>
            Your information may be transferred to and processed in countries other than your own. We ensure appropriate safeguards are in place to protect your data during international transfers.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>10. Changes to This Policy</Text>
          <Text style={styles.sectionText}>
            We may update this Privacy Policy from time to time. We will notify you of any material changes by posting the new policy in the app and updating the "Last updated" date. Your continued use of the app constitutes acceptance of the updated policy.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>11. Contact Us</Text>
          <Text style={styles.sectionText}>
            If you have any questions about this Privacy Policy or our privacy practices, please contact us at:{"\n"}
            Email: privacy@habittracker.com{"\n"}
            Address: [Your Company Address]{"\n"}
            Phone: [Your Contact Number]
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>12. Specific Feature Privacy</Text>
          
          <Text style={styles.subsectionTitle}>Mood Tracking</Text>
          <Text style={styles.sectionText}>
            Mood data is encrypted and stored locally on your device by default. You can choose to sync this data to our secure servers for backup and cross-device access.
          </Text>

          <Text style={styles.subsectionTitle}>Social Features</Text>
          <Text style={styles.sectionText}>
            When you use social features, you can control what information is shared with other users through your privacy settings. Profile visibility and data sharing are opt-in features.
          </Text>

          <Text style={styles.subsectionTitle}>Analytics</Text>
          <Text style={styles.sectionText}>
            We collect anonymous usage analytics to improve our app. You can opt-out of analytics collection in your privacy settings without affecting app functionality.
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