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
          <Text style={styles.sectionTitle}>1. Acceptance of Terms</Text>
          <Text style={styles.sectionText}>
            By downloading, installing, or using the Productivity Habit Tracker app ("the App"), you agree to be bound by these Terms of Service ("Terms"). If you do not agree to these Terms, please do not use the App.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>2. Description of Service</Text>
          <Text style={styles.sectionText}>
            The App is a productivity and habit tracking application that helps users build and maintain healthy habits, track mood patterns, and improve overall well-being through:
          </Text>
          <Text style={styles.bulletPoint}>• Habit creation and tracking</Text>
          <Text style={styles.bulletPoint}>• Mood monitoring and analytics</Text>
          <Text style={styles.bulletPoint}>• Progress visualization and statistics</Text>
          <Text style={styles.bulletPoint}>• Gamification features and achievements</Text>
          <Text style={styles.bulletPoint}>• Social sharing and community features</Text>
          <Text style={styles.bulletPoint}>• AI-powered insights and recommendations</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>3. User Accounts and Registration</Text>
          <Text style={styles.sectionText}>
            To access certain features of the App, you may need to create an account. You are responsible for:
          </Text>
          <Text style={styles.bulletPoint}>• Providing accurate and complete information</Text>
          <Text style={styles.bulletPoint}>• Maintaining the security of your account credentials</Text>
          <Text style={styles.bulletPoint}>• All activities that occur under your account</Text>
          <Text style={styles.bulletPoint}>• Notifying us immediately of any unauthorized use</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>4. Acceptable Use</Text>
          <Text style={styles.sectionText}>
            You agree to use the App only for lawful purposes and in accordance with these Terms. You agree not to:
          </Text>
          <Text style={styles.bulletPoint}>• Use the App for any illegal or unauthorized purpose</Text>
          <Text style={styles.bulletPoint}>• Interfere with or disrupt the App's functionality</Text>
          <Text style={styles.bulletPoint}>• Attempt to gain unauthorized access to the App or its systems</Text>
          <Text style={styles.bulletPoint}>• Upload or share harmful, offensive, or inappropriate content</Text>
          <Text style={styles.bulletPoint}>• Violate any applicable laws or regulations</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>5. Privacy and Data Protection</Text>
          <Text style={styles.sectionText}>
            Your privacy is important to us. Our collection, use, and protection of your personal information is governed by our Privacy Policy, which is incorporated into these Terms by reference. By using the App, you consent to the collection and use of your information as described in our Privacy Policy.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>6. Intellectual Property</Text>
          <Text style={styles.sectionText}>
            The App and its original content, features, and functionality are owned by us and are protected by international copyright, trademark, patent, trade secret, and other intellectual property laws. You may not modify, distribute, or create derivative works based on the App without our express written permission.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>7. User-Generated Content</Text>
          <Text style={styles.sectionText}>
            You retain ownership of any content you create or upload through the App. However, by sharing content through the App's social features, you grant us a non-exclusive, royalty-free license to use, display, and distribute such content within the App.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>8. Disclaimers and Limitations</Text>
          <Text style={styles.sectionText}>
            The App is provided "as is" without warranties of any kind. We do not guarantee that the App will be error-free, secure, or continuously available. The App is not intended to provide medical, psychological, or professional advice. Always consult with qualified professionals for health-related concerns.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>9. Limitation of Liability</Text>
          <Text style={styles.sectionText}>
            To the maximum extent permitted by law, we shall not be liable for any indirect, incidental, special, consequential, or punitive damages, including but not limited to loss of profits, data, or other intangible losses resulting from your use of the App.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>10. Termination</Text>
          <Text style={styles.sectionText}>
            We may terminate or suspend your account and access to the App at any time, with or without cause or notice. You may also terminate your account at any time by deleting the App and ceasing all use.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>11. Changes to Terms</Text>
          <Text style={styles.sectionText}>
            We reserve the right to modify these Terms at any time. We will notify users of any material changes through the App or other appropriate means. Your continued use of the App after such changes constitutes acceptance of the new Terms.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>12. Governing Law</Text>
          <Text style={styles.sectionText}>
            These Terms shall be governed by and construed in accordance with the laws of [Your Jurisdiction], without regard to its conflict of law provisions. Any disputes arising from these Terms or your use of the App shall be resolved in the courts of [Your Jurisdiction].
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>13. Contact Information</Text>
          <Text style={styles.sectionText}>
            If you have any questions about these Terms of Service, please contact us at:
          </Text>
          <Text style={styles.sectionText}>
            Email: sabbirhossainsm@gmail.com{"\n"}
            Address: 
          </Text>
        </View>

        <Text style={styles.lastUpdated}>
          Last updated: {new Date().toLocaleDateString()}
        </Text>
      </ScrollView>
    </View>
  );
}