import React, { useState } from 'react';
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
import { useAuth } from '@/context/AuthContext';

interface LinkedAccount {
  id: string;
  provider: string;
  email?: string;
  isConnected: boolean;
  connectedAt?: string;
}

export default function LinkedAccountsScreen() {
  const { currentTheme } = useTheme();
  const { user } = useAuth();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  
  // Mock data - replace with actual API data
  const [linkedAccounts, setLinkedAccounts] = useState<LinkedAccount[]>([
    {
      id: '1',
      provider: 'Google',
      email: 'user@gmail.com',
      isConnected: true,
      connectedAt: '2024-01-15',
    },
    {
      id: '2',
      provider: 'Apple',
      isConnected: false,
    },
    {
      id: '3',
      provider: 'Facebook',
      isConnected: false,
    },
  ]);

  const styles = createStyles(currentTheme.colors);

  const handleToggleAccount = async (accountId: string, currentStatus: boolean) => {
    setIsLoading(true);
    try {
      // TODO: Implement API call to connect/disconnect account
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setLinkedAccounts(prev => 
        prev.map(account => 
          account.id === accountId 
            ? { 
                ...account, 
                isConnected: !currentStatus,
                connectedAt: !currentStatus ? new Date().toISOString().split('T')[0] : undefined,
                email: !currentStatus ? `user@${account.provider.toLowerCase()}.com` : undefined
              }
            : account
        )
      );
      
      const action = currentStatus ? 'disconnected from' : 'connected to';
      const account = linkedAccounts.find(acc => acc.id === accountId);
      Alert.alert('Success', `Successfully ${action} ${account?.provider}`);
    } catch (error) {
      Alert.alert('Error', 'Failed to update account connection');
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
            Connected on {new Date(account.connectedAt).toLocaleDateString()}
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
        <Text style={styles.title}>Linked Accounts</Text>
      </View>

      <View style={styles.content}>
        <Text style={styles.description}>
          Connect your accounts to enable seamless sign-in and data synchronization.
        </Text>
        
        <View style={styles.accountsList}>
          {linkedAccounts.map(renderAccountItem)}
        </View>
        
        <View style={styles.infoSection}>
          <Text style={styles.infoTitle}>About Linked Accounts</Text>
          <Text style={styles.infoText}>
            • Linking accounts allows you to sign in with multiple providers{"\n"}
            • Your data remains secure and is not shared between providers{"\n"}
            • You can disconnect accounts at any time{"\n"}
            • Primary account cannot be disconnected
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
});