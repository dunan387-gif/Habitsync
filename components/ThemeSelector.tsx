import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, ScrollView, Alert, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Crown, X, Check, Palette, Star, Zap, TrendingUp } from 'lucide-react-native';
import { useTheme } from '@/context/ThemeContext';
import { useLanguage } from '@/context/LanguageContext';
import { useSubscription } from '@/context/SubscriptionContext';
import { Theme } from '@/types';

const { width: screenWidth } = Dimensions.get('window');

type ThemeSelectorProps = {
  visible: boolean;
  onClose: () => void;
};

export default function ThemeSelector({ visible, onClose }: ThemeSelectorProps) {
  const { currentTheme, setTheme, availableThemes } = useTheme();
  const { t } = useLanguage();
  const { canUseTheme, showUpgradePrompt, upgradeToPro } = useSubscription();
  const [isChangingTheme, setIsChangingTheme] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [isUpgrading, setIsUpgrading] = useState(false);


  const handleThemeSelect = async (theme: Theme) => {
    console.log('🎨 Theme selected:', theme.name, 'ID:', theme.id);
    console.log('🎨 Can use theme:', canUseTheme(theme.id));
    console.log('🎨 Theme is premium:', theme.isPremium);
    
    // Check if user can use this theme
    if (!canUseTheme(theme.id)) {
      console.log('🎨 User cannot use theme - showing upgrade reminder');
      setShowUpgradeModal(true);
      return;
    }

    console.log('🎨 User can use theme - changing theme');
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
    setShowUpgradeModal(false);
    
    // PricingScreen is now handled by the parent component
    console.log('🎯 Upgrade requested - handled by parent component');
  };

  const renderThemeOption = (theme: Theme) => {
    const isSelected = currentTheme.id === theme.id;
    const isLocked = !canUseTheme(theme.id);

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
          isLocked && styles.lockedThemeOption,
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

  const renderUpgradeModal = () => {
    if (!showUpgradeModal) return null;

    return (
      <Modal
        visible={showUpgradeModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowUpgradeModal(false)}
      >
        <View style={styles.upgradeModalOverlay}>
          <View style={[
            styles.upgradeModalContent,
            { backgroundColor: currentTheme.colors.card }
          ]}>
            {/* Header */}
            <View style={styles.upgradeModalHeader}>
              <View style={[
                styles.upgradeIconContainer,
                { backgroundColor: `${currentTheme.colors.primary}15` }
              ]}>
                <Crown size={32} color={currentTheme.colors.primary} />
              </View>
              <Text style={[
                styles.upgradeModalTitle,
                { color: currentTheme.colors.text }
              ]}>
                {t('themeSelector.premiumThemeTitle') || 'Premium Theme'}
              </Text>
              <Text style={[
                styles.upgradeModalSubtitle,
                { color: currentTheme.colors.textSecondary }
              ]}>
                {t('themeSelector.premiumThemeMessage') || 'This theme requires a Pro subscription. Upgrade to unlock all premium themes and features!'}
              </Text>
            </View>

            {/* Features */}
            <View style={styles.upgradeFeatures}>
              <View style={styles.upgradeFeature}>
                <View style={[
                  styles.featureIcon,
                  { backgroundColor: `${currentTheme.colors.success}15` }
                ]}>
                  <Palette size={20} color={currentTheme.colors.success} />
                </View>
                <Text style={[
                  styles.featureText,
                  { color: currentTheme.colors.text }
                ]}>
                  All Premium Themes
                </Text>
              </View>
              
              <View style={styles.upgradeFeature}>
                <View style={[
                  styles.featureIcon,
                  { backgroundColor: `${currentTheme.colors.primary}15` }
                ]}>
                  <TrendingUp size={20} color={currentTheme.colors.primary} />
                </View>
                <Text style={[
                  styles.featureText,
                  { color: currentTheme.colors.text }
                ]}>
                  Unlimited Habits
                </Text>
              </View>
              
              <View style={styles.upgradeFeature}>
                <View style={[
                  styles.featureIcon,
                  { backgroundColor: `${currentTheme.colors.accent}15` }
                ]}>
                  <Zap size={20} color={currentTheme.colors.accent} />
                </View>
                <Text style={[
                  styles.featureText,
                  { color: currentTheme.colors.text }
                ]}>
                  AI-Powered Insights
                </Text>
              </View>
              
              <View style={styles.upgradeFeature}>
                <View style={[
                  styles.featureIcon,
                  { backgroundColor: `${currentTheme.colors.warning}15` }
                ]}>
                  <Star size={20} color={currentTheme.colors.warning} />
                </View>
                <Text style={[
                  styles.featureText,
                  { color: currentTheme.colors.text }
                ]}>
                  Advanced Analytics
                </Text>
              </View>
            </View>

            {/* Action Buttons */}
            <View style={styles.upgradeModalActions}>
              <TouchableOpacity
                style={[
                  styles.upgradeModalButton,
                  styles.cancelButton,
                  { borderColor: currentTheme.colors.border }
                ]}
                onPress={() => setShowUpgradeModal(false)}
              >
                <Text style={[
                  styles.cancelButtonText,
                  { color: currentTheme.colors.textSecondary }
                ]}>
                  {t('themeSelector.maybeLater') || 'Maybe Later'}
                </Text>
              </TouchableOpacity>
              
                             <TouchableOpacity
                 style={[
                   styles.upgradeModalButton,
                   styles.upgradeButton,
                   { backgroundColor: currentTheme.colors.primary }
                 ]}
                 onPress={handleUpgrade}
               >
                 <Crown size={18} color="white" />
                 <Text style={styles.upgradeButtonText}>
                   {t('themeSelector.viewPricing') || 'View Pricing'}
                 </Text>
               </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    );
  };

  return (
    <>
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
            
            {/* Show upgrade banner for free users */}
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
                onPress={() => setShowUpgradeModal(true)}
              >
                <Text style={styles.upgradeButtonText}>{t('themeSelector.viewPricing')}</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </Modal>
      
      {renderUpgradeModal()}
    </>
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
  lockedThemeOption: {
    opacity: 0.6,
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
  // Upgrade Modal Styles
  upgradeModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  upgradeModalContent: {
    width: screenWidth * 0.9,
    maxWidth: 400,
    borderRadius: 20,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 15,
  },
  upgradeModalHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  upgradeIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  upgradeModalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
  },
  upgradeModalSubtitle: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 8,
  },
  upgradeFeatures: {
    marginBottom: 24,
  },
  upgradeFeature: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    paddingHorizontal: 8,
  },
  featureIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  featureText: {
    fontSize: 16,
    fontWeight: '500',
    flex: 1,
  },
  upgradeModalActions: {
    flexDirection: 'row',
    gap: 12,
  },
  upgradeModalButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  cancelButton: {
    borderWidth: 1,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  upgradeButtonDisabled: {
    opacity: 0.6,
  },
});