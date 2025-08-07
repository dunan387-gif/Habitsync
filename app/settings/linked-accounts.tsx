import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Alert,
  Switch,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { ArrowLeft, Link, Unlink } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '@/context/ThemeContext';
import { useLanguage } from '@/context/LanguageContext';
import { useAuth } from '@/context/AuthContext';
import { AuthService, LinkedAccount } from '@/services/AuthService';

export default function LinkedAccountsScreen() {
  const { currentTheme } = useTheme();
  const { t } = useLanguage();
  const { user } = useAuth();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [linkedAccounts, setLinkedAccounts] = useState<LinkedAccount[]>([]);
  const [isLoadingAccounts, setIsLoadingAccounts] = useState(true);

  const styles = createStyles(currentTheme.colors);

  // Load linked accounts on component mount
  useEffect(() => {
    loadLinkedAccounts();
  }, []);

  const loadLinkedAccounts = async () => {
    try {
      setIsLoadingAccounts(true);
      const accounts = await AuthService.getLinkedAccounts();
      setLinkedAccounts(accounts);
    } catch (error: any) {
      console.error('Failed to load linked accounts:', error);
      Alert.alert(t('linkedAccounts.alerts.error'), error.message);
    } finally {
      setIsLoadingAccounts(false);
    }
  };

  const handleToggleAccount = async (accountId: string, currentStatus: boolean) => {
    setIsLoading(true);
    try {
      const action = currentStatus ? 'unlink' : 'link';
      await AuthService.toggleLinkedAccount(accountId, action);
      
      // Refresh the accounts list
      await loadLinkedAccounts();
      
      const actionText = currentStatus ? t('linkedAccounts.alerts.successDisconnected') : t('linkedAccounts.alerts.successConnected');
      const account = linkedAccounts.find(acc => acc.id === accountId);
      Alert.alert(t('linkedAccounts.alerts.success'), `${actionText} ${account?.provider}`);
    } catch (error: any) {
      Alert.alert(t('linkedAccounts.alerts.error'), error.message || t('linkedAccounts.alerts.failedToUpdate'));
    } finally {
      setIsLoading(false);
    }
  };

  const renderAccountItem = (account: LinkedAccount) => (
    <View key={account.id} style={styles.accountItem}>
      <View style={styles.accountInfo}>
        <View style={styles.accountHeader}>
          <Text style={styles.providerName}>{account.provider}</Text>
          {account.isConnected ? (
            <Link size={20} color={currentTheme.colors.success} />
          ) : (
            <Unlink size={20} color={currentTheme.colors.textMuted} />
          )}
        </View>
        {account.email && (
          <Text style={styles.accountEmail}>{account.email}</Text>
        )}
        {account.connectedAt && (
          <Text style={styles.connectedDate}>
            {t('linkedAccounts.connectedOn')} {new Date(account.connectedAt).toLocaleDateString()}
          </Text>
        )}
      </View>
      <Switch
        value={account.isConnected}
        onValueChange={() => handleToggleAccount(account.id, account.isConnected)}
        disabled={isLoading}
        trackColor={{ false: currentTheme.colors.border, true: currentTheme.colors.primary }}
        thumbColor={currentTheme.colors.background}
      />
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: currentTheme.colors.background }]}>
      <StatusBar style={currentTheme.isDark ? 'light' : 'dark'} />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color={currentTheme.colors.text} />
        </TouchableOpacity>
        <Text style={styles.title}>{t('linkedAccounts.title')}</Text>
      </View>

      <View style={styles.content}>
        <View style={styles.futureUpdateNotice}>
          <Text style={styles.futureUpdateTitle}>{t('linkedAccounts.comingSoon')}</Text>
          <Text style={styles.futureUpdateText}>
            {t('linkedAccounts.comingSoonMessage')}
          </Text>
        </View>
        
        <Text style={styles.description}>
          {t('linkedAccounts.description')}
        </Text>
        
        <View style={styles.accountsList}>
          {linkedAccounts.map(renderAccountItem)}
        </View>
        
        <View style={styles.infoSection}>
          <Text style={styles.infoTitle}>{t('linkedAccounts.aboutTitle')}</Text>
          <Text style={styles.infoText}>
            {t('linkedAccounts.aboutText')}
          </Text>
        </View>
      </View>
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
    paddingTop: 50,
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
  description: {
    fontSize: 14,
    color: colors.textMuted,
    marginBottom: 24,
    lineHeight: 20,
  },
  accountsList: {
    marginBottom: 32,
  },
  accountItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: colors.card,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  accountInfo: {
    flex: 1,
  },
  accountHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  providerName: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.text,
    marginRight: 8,
  },
  accountEmail: {
    fontSize: 14,
    color: colors.textMuted,
    marginBottom: 2,
  },
  connectedDate: {
    fontSize: 12,
    color: colors.textMuted,
  },
  infoSection: {
    backgroundColor: colors.card,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.text,
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: colors.textMuted,
    lineHeight: 20,
  },
  futureUpdateNotice: {
    backgroundColor: colors.primary + '15',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: colors.primary + '30',
  },
  futureUpdateTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.primary,
    marginBottom: 4,
  },
  futureUpdateText: {
    fontSize: 14,
    color: colors.text,
    lineHeight: 18,
  },
});