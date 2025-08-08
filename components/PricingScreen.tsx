import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Dimensions,
  Modal,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@/context/ThemeContext';
import { useLanguage } from '@/context/LanguageContext';
import { useSubscription } from '@/context/SubscriptionContext';
import { PRICING_PLANS, INTRODUCTORY_PRICING } from '@/constants/pricing';
import {
  Check,
  X,
  Crown,
  Star,
  Zap,
  TrendingUp,
  Users,
  Brain,
  Palette,
  Bell,
  BarChart3,
  Activity,
  Target,
  Heart,
  Shield,
  ArrowRight,
  ArrowLeft,
} from 'lucide-react-native';

const { width } = Dimensions.get('window');

interface PricingScreenProps {
  visible?: boolean;
  onClose?: () => void;
  showIntroductory?: boolean;
  inModal?: boolean; // New prop to indicate if it's in a Modal
}

const PricingScreen: React.FC<PricingScreenProps> = ({ 
  visible = true, 
  onClose, 
  showIntroductory = false,
  inModal = false
}) => {
  const { currentTheme } = useTheme();
  const { t } = useLanguage();
  const { upgradeToPro } = useSubscription();
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [selectedPlanDetails, setSelectedPlanDetails] = useState<any>(null);
  const [showPremiumKeyModal, setShowPremiumKeyModal] = useState(false);
  const [premiumKey, setPremiumKey] = useState('');
  const [isKeyValid, setIsKeyValid] = useState(true);

  const handleUpgrade = (planId: string) => {
    // Find the plan details
    const planDetails = PRICING_PLANS.find(plan => plan.id === planId);
    setSelectedPlan(planId);
    setSelectedPlanDetails(planDetails);
    setShowPremiumKeyModal(true);
    setPremiumKey('');
    setIsKeyValid(true);
  };

  const handlePremiumKeySubmit = async () => {
    const correctKey = 'nhlKMV';
    if (premiumKey.trim() === correctKey) {
      setIsKeyValid(true);
      setShowPremiumKeyModal(false);
      setSelectedPlan(null);
      setSelectedPlanDetails(null);
      
      try {
        // Actually upgrade the user to Pro with plan details
        await upgradeToPro({
          id: selectedPlanDetails?.id || 'pro-monthly',
          period: selectedPlanDetails?.period || 'monthly'
        });
        
        // Show success message with plan details
        const planPeriod = selectedPlanDetails?.period === 'yearly' ? t('pricing.year') : t('pricing.month');
        Alert.alert(
          t('pricing.successTitle'),
          `${t('pricing.successMessage')} (${planPeriod})`,
          [
            {
              text: t('common.ok'),
              onPress: () => {
                // Close the modal and return to settings
                if (onClose) {
                  onClose();
                }
              },
            },
          ]
        );
      } catch (error) {
        console.error('Failed to upgrade to Pro:', error);
        Alert.alert(
          t('pricing.errorTitle') || 'Error',
          t('pricing.errorMessage') || 'Failed to upgrade. Please try again.',
          [{ text: t('common.ok') }]
        );
      }
    } else {
      setIsKeyValid(false);
    }
  };

  const handlePremiumKeyCancel = () => {
    setShowPremiumKeyModal(false);
    setSelectedPlan(null);
    setSelectedPlanDetails(null);
    setPremiumKey('');
    setIsKeyValid(true);
  };

  const renderFeatureIcon = (feature: string) => {
    const iconProps = { size: 20, color: currentTheme.colors.success };
    
    switch (feature) {
      case 'pricing.features.unlimitedHabits':
        return <Target {...iconProps} />;
      case 'pricing.features.advancedAnalyticsFeature':
        return <BarChart3 {...iconProps} />;
      case 'pricing.features.aiSuggestionsFeature':
        return <Brain {...iconProps} />;
      case 'pricing.features.premiumThemesFeature':
        return <Palette {...iconProps} />;
      case 'pricing.features.unlimitedRemindersFeature':
        return <Bell {...iconProps} />;
      case 'pricing.features.socialFeaturesFeature':
        return <Users {...iconProps} />;
      case 'pricing.features.dataExportFeature':
        return <TrendingUp {...iconProps} />;
      case 'pricing.features.wellnessIntegrationFeature':
        return <Activity {...iconProps} />;
      case 'pricing.features.performanceAlertsFeature':
        return <Zap {...iconProps} />;
      case 'pricing.features.patternInsightsFeature':
        return <Heart {...iconProps} />;
      default:
        return <Check {...iconProps} />;
    }
  };

  const renderPlanCard = (plan: any, isPopular: boolean = false) => {
    const isSelected = selectedPlan === plan.id;
    const isPro = plan.id === 'pro';
    
    return (
      <View
        key={plan.id}
        style={[
          styles.planCard,
          {
            backgroundColor: currentTheme.colors.card,
            borderColor: isPopular 
              ? currentTheme.colors.primary 
              : currentTheme.colors.border,
            borderWidth: isPopular ? 2 : 1,
          },
          isSelected && {
            borderColor: currentTheme.colors.primary,
            borderWidth: 2,
          },
        ]}
      >
        {isPopular && (
          <View style={[styles.popularBadge, { backgroundColor: currentTheme.colors.primary }]}>
            <Crown size={16} color="#FFFFFF" />
            <Text style={[styles.popularText, { color: "#FFFFFF" }]}>
              {t('pricing.mostPopular')}
            </Text>
          </View>
        )}
        
        <View style={styles.planHeader}>
          <View style={styles.planTitleRow}>
            {isPro && <Crown size={24} color={currentTheme.colors.primary} />}
            <Text style={[styles.planTitle, { color: currentTheme.colors.text }]}>
              {t(plan.name)}
            </Text>
          </View>
          
          <View style={styles.priceContainer}>
            <Text style={[styles.price, { color: currentTheme.colors.text }]}>
              ${plan.price}
            </Text>
            <Text style={[styles.pricePeriod, { color: currentTheme.colors.textSecondary }]}>
              /{t('pricing.month')}
            </Text>
          </View>
          
          {plan.originalPrice && (
            <View style={styles.originalPriceContainer}>
              <Text style={[styles.originalPrice, { color: currentTheme.colors.textSecondary }]}>
                ${plan.originalPrice}
              </Text>
              <View style={[styles.savingsBadge, { backgroundColor: currentTheme.colors.success }]}>
                <Text style={[styles.savingsText, { color: "#FFFFFF" }]}>
                  {t('pricing.save')} {Math.round(((plan.originalPrice - plan.price) / plan.originalPrice) * 100)}%
                </Text>
              </View>
            </View>
          )}
        </View>

        <View style={styles.featuresList}>
          {plan.features.map((feature: string, index: number) => (
            <View key={index} style={styles.featureRow}>
              {renderFeatureIcon(feature)}
              <Text style={[styles.featureText, { color: currentTheme.colors.text }]}>
                {t(feature)}
              </Text>
            </View>
          ))}
        </View>

        <TouchableOpacity
          style={[
            styles.upgradeButton,
            {
              backgroundColor: isPopular 
                ? currentTheme.colors.primary 
                : currentTheme.colors.background,
              borderColor: currentTheme.colors.primary,
            },
            isSelected && {
              backgroundColor: currentTheme.colors.primary,
            },
          ]}
          onPress={() => handleUpgrade(plan.id)}
          disabled={isSelected}
        >
                      <Text
              style={[
                styles.upgradeButtonText,
                {
                  color: isPopular || isSelected 
                    ? "#FFFFFF" 
                    : currentTheme.colors.primary,
                },
              ]}
            >
            {isSelected ? t('pricing.upgrading') : t('pricing.upgrade')}
          </Text>
          {!isSelected && <ArrowRight size={16} color={currentTheme.colors.primary} />}
        </TouchableOpacity>
      </View>
    );
  };

  const renderComparisonTable = () => {
    const features = [
      { key: 'unlimitedHabits', free: '4', pro: t('pricing.unlimited') },
      { key: 'advancedAnalytics', free: '❌', pro: '✅' },
      { key: 'aiSuggestions', free: '5', pro: t('pricing.unlimited') },
      { key: 'premiumThemes', free: '3', pro: t('pricing.unlimited') },
      { key: 'unlimitedReminders', free: '1', pro: t('pricing.unlimited') },
      { key: 'socialFeatures', free: '❌', pro: '✅' },
      { key: 'dataExport', free: '❌', pro: '✅' },
      { key: 'wellnessIntegration', free: '❌', pro: '✅' },
      { key: 'performanceAlerts', free: '❌', pro: '✅' },
      { key: 'patternInsights', free: '❌', pro: '✅' },
    ];

    return (
      <View style={[styles.comparisonContainer, { backgroundColor: currentTheme.colors.card }]}>
        <Text style={[styles.comparisonTitle, { color: currentTheme.colors.text }]}>
          {t('pricing.detailedComparison')}
        </Text>
        
        <View style={styles.comparisonHeader}>
          <View style={styles.comparisonHeaderCell}>
            <Text style={[styles.comparisonHeaderText, { color: currentTheme.colors.textSecondary }]}>
              {t('pricing.feature')}
            </Text>
          </View>
          <View style={styles.comparisonHeaderCell}>
            <Text style={[styles.comparisonHeaderText, { color: currentTheme.colors.textSecondary }]}>
              {t('pricing.free')}
            </Text>
          </View>
          <View style={styles.comparisonHeaderCell}>
            <Text style={[styles.comparisonHeaderText, { color: currentTheme.colors.primary }]}>
              {t('pricing.pro')}
            </Text>
          </View>
        </View>

        {features.map((feature, index) => (
          <View key={index} style={styles.comparisonRow}>
            <View style={styles.comparisonCell}>
              <Text style={[styles.comparisonFeatureText, { color: currentTheme.colors.text }]}>
                {t(`pricing.features.${feature.key}`)}
              </Text>
            </View>
            <View style={styles.comparisonCell}>
              <Text style={[styles.comparisonValueText, { color: currentTheme.colors.textSecondary }]}>
                {feature.free}
              </Text>
            </View>
            <View style={styles.comparisonCell}>
              <Text style={[styles.comparisonValueText, { color: currentTheme.colors.primary }]}>
                {feature.pro}
              </Text>
            </View>
          </View>
        ))}
      </View>
    );
  };

  const Container = inModal ? View : SafeAreaView;
  
  // Don't render if not visible
  if (!visible) {
    return null;
  }
  
  return (
    <Container style={[styles.container, { backgroundColor: currentTheme.colors.background }]}>
      {/* Header with Back Button */}
      <View style={[styles.headerContainer, { borderBottomColor: currentTheme.colors.border }]}>
        {onClose && (
          <TouchableOpacity 
            style={styles.backButton} 
            onPress={onClose}
            activeOpacity={0.7}
          >
            <ArrowLeft size={24} color={currentTheme.colors.primary} />
            <Text style={[styles.backButtonText, { color: currentTheme.colors.primary }]}>
              {t('common.back')}
            </Text>
          </TouchableOpacity>
        )}
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: currentTheme.colors.text }]}>
            {t('pricing.chooseYourPlan')}
          </Text>
          <Text style={[styles.subtitle, { color: currentTheme.colors.textSecondary }]}>
            {t('pricing.subtitle')}
          </Text>
        </View>

        <View style={styles.plansContainer}>
          {PRICING_PLANS.map((plan, index) => 
            renderPlanCard(plan, plan.id === 'pro')
          )}
        </View>

        {renderComparisonTable()}

        <View style={styles.guaranteeContainer}>
          <Shield size={24} color={currentTheme.colors.success} />
          <Text style={[styles.guaranteeText, { color: currentTheme.colors.textSecondary }]}>
            {t('pricing.moneyBackGuarantee')}
          </Text>
        </View>
      </ScrollView>

      {/* Premium Key Modal */}
      <Modal
        visible={showPremiumKeyModal}
        transparent={true}
        animationType="fade"
        onRequestClose={handlePremiumKeyCancel}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContainer, { backgroundColor: currentTheme.colors.background }]}>
            <View style={styles.modalHeader}>
              <Crown size={24} color={currentTheme.colors.primary} />
              <Text style={[styles.modalTitle, { color: currentTheme.colors.text }]}>
                {t('pricing.enterPremiumKey')}
              </Text>
            </View>
            
            <Text style={[styles.modalDescription, { color: currentTheme.colors.textSecondary }]}>
              {t('pricing.premiumKeyDescription')}
            </Text>
            {selectedPlanDetails && (
              <View style={styles.selectedPlanInfo}>
                <Text style={[styles.selectedPlanText, { color: currentTheme.colors.primary }]}>
                  {t(selectedPlanDetails.name)} - ${selectedPlanDetails.price}/{selectedPlanDetails.period === 'yearly' ? t('pricing.year') : t('pricing.month')}
                </Text>
              </View>
            )}
            
            <TextInput
              style={[
                styles.keyInput,
                {
                  backgroundColor: currentTheme.colors.surface,
                  borderColor: isKeyValid ? currentTheme.colors.border : currentTheme.colors.error,
                  color: currentTheme.colors.text,
                },
              ]}
              placeholder={t('pricing.enterKeyPlaceholder')}
              placeholderTextColor={currentTheme.colors.textSecondary}
              value={premiumKey}
              onChangeText={setPremiumKey}
              autoCapitalize="characters"
              autoCorrect={false}
              secureTextEntry={false}
            />
            
            {!isKeyValid && (
              <Text style={[styles.errorText, { color: currentTheme.colors.error }]}>
                {t('pricing.invalidKey')}
              </Text>
            )}
            
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton, { borderColor: currentTheme.colors.border }]}
                onPress={handlePremiumKeyCancel}
              >
                <Text style={[styles.modalButtonText, { color: currentTheme.colors.textSecondary }]}>
                  {t('common.cancel')}
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.modalButton, styles.submitButton, { backgroundColor: currentTheme.colors.primary }]}
                onPress={handlePremiumKeySubmit}
              >
                <Text style={[styles.modalButtonText, { color: "#FFFFFF" }]}>
                  {t('pricing.activate')}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </Container>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 15,
    borderBottomWidth: 1,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  header: {
    padding: 20,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
  },
  plansContainer: {
    paddingHorizontal: 20,
    gap: 20,
  },
  planCard: {
    borderRadius: 16,
    padding: 20,
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  popularBadge: {
    position: 'absolute',
    top: -12,
    left: 20,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    gap: 4,
  },
  popularText: {
    fontSize: 12,
    fontWeight: '600',
  },
  planHeader: {
    alignItems: 'center',
    marginBottom: 20,
  },
  planTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  planTitle: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 8,
  },
  price: {
    fontSize: 36,
    fontWeight: 'bold',
  },
  pricePeriod: {
    fontSize: 16,
    marginLeft: 4,
  },
  originalPriceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  originalPrice: {
    fontSize: 16,
    textDecorationLine: 'line-through',
  },
  savingsBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  savingsText: {
    fontSize: 12,
    fontWeight: '600',
  },
  featuresList: {
    marginBottom: 24,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 12,
  },
  featureText: {
    fontSize: 16,
    flex: 1,
  },
  upgradeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    borderWidth: 2,
    gap: 8,
  },
  upgradeButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  comparisonContainer: {
    margin: 20,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  comparisonTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  comparisonHeader: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    paddingBottom: 12,
    marginBottom: 12,
  },
  comparisonHeaderCell: {
    flex: 1,
    alignItems: 'center',
  },
  comparisonHeaderText: {
    fontSize: 14,
    fontWeight: '600',
  },
  comparisonRow: {
    flexDirection: 'row',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  comparisonCell: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  comparisonFeatureText: {
    fontSize: 14,
    textAlign: 'center',
  },
  comparisonValueText: {
    fontSize: 14,
    fontWeight: '500',
  },
  guaranteeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    gap: 8,
  },
  guaranteeText: {
    fontSize: 14,
    textAlign: 'center',
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContainer: {
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    gap: 12,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
  },
  modalDescription: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  keyInput: {
    borderWidth: 2,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    marginBottom: 8,
  },
  errorText: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 16,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    borderWidth: 1,
    backgroundColor: 'transparent',
  },
  submitButton: {
    borderWidth: 0,
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  selectedPlanInfo: {
    alignItems: 'center',
    marginBottom: 16,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: 'rgba(0, 122, 255, 0.1)',
    borderRadius: 8,
  },
  selectedPlanText: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
});

export default PricingScreen; 