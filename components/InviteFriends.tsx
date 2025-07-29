import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Share, Linking, Animated } from 'react-native';
import { useGamification } from '@/context/GamificationContext';
import { useTheme } from '@/context/ThemeContext';
import { Users, Gift, Share2, MessageCircle, Mail, Copy, Star, Trophy, Zap, ExternalLink, ArrowLeft } from 'lucide-react-native';
import * as Clipboard from 'expo-clipboard';
import { useRouter } from 'expo-router';

export default function InviteFriends({ onClose }: { onClose?: () => void }) {
  const { gamificationData, addXP } = useGamification();
  const { currentTheme } = useTheme();
  const router = useRouter();
  const [isSharing, setIsSharing] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [pulseAnim] = useState(new Animated.Value(1));

  const styles = createStyles(currentTheme.colors);

  const generateReferralCode = () => {
    const userId = 'USER123';
    return `HABIT${userId.slice(-3)}${Math.random().toString(36).substr(2, 4).toUpperCase()}`;
  };

  const referralCode = generateReferralCode();
  const appStoreUrl = 'https://apps.apple.com/app/habit-tracker';
  const playStoreUrl = 'https://play.google.com/store/apps/details?id=com.habittracker';

  const generateInviteMessage = () => {
    return `🎯 Join me on my habit-building journey!\n\n` +
           `I've been using this amazing Habit Tracker app and I'm already at Level ${gamificationData?.userLevel.level || 1}! 🚀\n\n` +
           `✨ Track daily habits\n` +
           `🏆 Earn achievements\n` +
           `📊 See your progress\n` +
           `🎮 Gamified experience\n\n` +
           `Use my referral code: ${referralCode}\n` +
           `We both get bonus XP when you join! 💪\n\n` +
           `Download here: ${appStoreUrl}`;
  };

  const startPulseAnimation = () => {
    Animated.sequence([
      Animated.timing(pulseAnim, {
        toValue: 1.1,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(pulseAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handleShare = async () => {
    setIsSharing(true);
    startPulseAnimation();
    try {
      const message = generateInviteMessage();
      const result = await Share.share({
        message,
        title: 'Join me in building better habits!'
      });
      
      if (result.action === Share.sharedAction) {
        await addXP(10, 'friend_invite');
        Alert.alert('Invite Sent! 🎉', 'You earned 10 XP for inviting a friend!');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to send invite. Please try again.');
    } finally {
      setIsSharing(false);
    }
  };

  const copyReferralCode = async () => {
    try {
      await Clipboard.setStringAsync(referralCode);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
      Alert.alert('Copied!', 'Referral code copied to clipboard');
    } catch (error) {
      Alert.alert('Error', 'Failed to copy referral code');
    }
  };

  const shareViaWhatsApp = () => {
    const message = encodeURIComponent(generateInviteMessage());
    Linking.openURL(`whatsapp://send?text=${message}`);
  };

  const shareViaEmail = () => {
    const subject = encodeURIComponent('Join me in building better habits!');
    const body = encodeURIComponent(generateInviteMessage());
    Linking.openURL(`mailto:?subject=${subject}&body=${body}`);
  };

  const handleBackToSettings = () => {
    if (onClose) {
      onClose();
    } else {
      router.back();
    }
  };

  const inviteOptions = [
    {
      icon: Share2,
      label: 'Share Anywhere',
      description: 'Share via any app',
      action: handleShare,
      color: currentTheme.colors.primary,
      gradient: true
    },
    {
      icon: MessageCircle,
      label: 'WhatsApp',
      description: 'Share with contacts',
      action: shareViaWhatsApp,
      color: '#25D366'
    },
    {
      icon: Mail,
      label: 'Email',
      description: 'Send via email',
      action: shareViaEmail,
      color: '#EA4335'
    }
  ];

  return (
    <View style={styles.container}>
      {/* Header Section with Back Button */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={handleBackToSettings}
        >
          <ArrowLeft size={24} color={currentTheme.colors.text} />
        </TouchableOpacity>
        <View style={styles.headerIcon}>
          <Users size={24} color={currentTheme.colors.primary} />
        </View>
        <View style={styles.headerContent}>
          <Text style={styles.title}>Invite Friends</Text>
          <View style={styles.xpBadge}>
            <Zap size={14} color={currentTheme.colors.accent} />
            <Text style={styles.xpText}>+10 XP per invite</Text>
          </View>
        </View>
      </View>

      <Text style={styles.subtitle}>
        Share your journey and earn rewards! Friends who join with your code get bonus XP too.
      </Text>

      {/* Stats Section */}
      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <Trophy size={20} color={currentTheme.colors.accent} />
          <Text style={styles.statNumber}>Level {gamificationData?.userLevel.level || 1}</Text>
          <Text style={styles.statLabel}>Your Level</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Star size={20} color={currentTheme.colors.primary} />
          <Text style={styles.statNumber}>{gamificationData?.userLevel?.totalXP || 0}</Text>
          <Text style={styles.statLabel}>Total XP</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Users size={20} color={currentTheme.colors.success} />
          <Text style={styles.statNumber}>0</Text>
          <Text style={styles.statLabel}>Friends Invited</Text>
        </View>
      </View>

      {/* Referral Code Section */}
      <View style={styles.referralSection}>
        <Text style={styles.referralLabel}>Your Referral Code</Text>
        <View style={styles.referralCodeContainer}>
          <Text style={styles.referralCode}>{referralCode}</Text>
          <TouchableOpacity 
            style={[styles.copyButton, copiedCode && styles.copiedButton]}
            onPress={copyReferralCode}
          >
            <Copy size={18} color={copiedCode ? currentTheme.colors.success : currentTheme.colors.primary} />
          </TouchableOpacity>
        </View>
        <Text style={styles.codeHint}>Share this code for bonus rewards</Text>
      </View>

      {/* Invite Options */}
      <View style={styles.inviteOptions}>
        <Text style={styles.optionsTitle}>Choose how to invite</Text>
        {inviteOptions.map((option, index) => (
          <Animated.View 
            key={index} 
            style={[{ transform: [{ scale: option.gradient ? pulseAnim : 1 }] }]}
          >
            <TouchableOpacity
              style={[
                styles.inviteButton,
                option.gradient && styles.primaryInviteButton,
                { borderColor: option.color }
              ]}
              onPress={option.action}
              disabled={isSharing}
            >
              <View style={[styles.buttonIcon, { backgroundColor: option.color + '20' }]}>
                <option.icon size={20} color={option.color} />
              </View>
              <View style={styles.buttonContent}>
                <Text style={[
                  styles.inviteButtonText,
                  option.gradient && styles.primaryButtonText
                ]}>
                  {option.label}
                </Text>
                <Text style={[
                  styles.buttonDescription,
                  option.gradient && styles.primaryButtonDescription
                ]}>
                  {option.description}
                </Text>
              </View>
              <ExternalLink 
                size={16} 
                color={option.gradient ? 'white' : currentTheme.colors.textSecondary} 
              />
            </TouchableOpacity>
          </Animated.View>
        ))}
      </View>

      {/* Rewards Info */}
      <View style={styles.rewardsInfo}>
        <Gift size={20} color={currentTheme.colors.accent} />
        <View style={styles.rewardsContent}>
          <Text style={styles.rewardsTitle}>Referral Rewards</Text>
          <Text style={styles.rewardsText}>
            You and your friend both get 50 XP when they complete their first habit!
          </Text>
        </View>
      </View>
    </View>
  );
}

const createStyles = (colors: any) => StyleSheet.create({
  container: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    backgroundColor: colors.surface,
  },
  headerIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primary + '20',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  headerContent: {
    flex: 1,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 4,
  },
  xpBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.accent + '20',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  xpText: {
    color: colors.accent,
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  subtitle: {
    fontSize: 15,
    color: colors.textSecondary,
    marginBottom: 20,
    lineHeight: 22,
  },
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginTop: 8,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  statDivider: {
    width: 1,
    backgroundColor: colors.border,
    marginHorizontal: 16,
  },
  referralSection: {
    marginBottom: 24,
  },
  referralLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 12,
  },
  referralCodeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
  },
  referralCode: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.primary,
    flex: 1,
    letterSpacing: 2,
  },
  copyButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: colors.primary + '20',
  },
  copiedButton: {
    backgroundColor: colors.success + '20',
  },
  codeHint: {
    fontSize: 12,
    color: colors.textSecondary,
    fontStyle: 'italic',
  },
  inviteOptions: {
    marginBottom: 20,
  },
  optionsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 16,
  },
  inviteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    backgroundColor: colors.surface,
  },
  primaryInviteButton: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  buttonIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  buttonContent: {
    flex: 1,
  },
  inviteButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 2,
  },
  primaryButtonText: {
    color: 'white',
  },
  buttonDescription: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  primaryButtonDescription: {
    color: 'rgba(255,255,255,0.8)',
  },
  rewardsInfo: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colors.accent + '10',
    borderRadius: 12,
    padding: 16,
  },
  rewardsContent: {
    flex: 1,
    marginLeft: 12,
  },
  rewardsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  rewardsText: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 18,
  },
});