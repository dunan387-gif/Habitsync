import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Share, Linking } from 'react-native';
import { useGamification } from '@/context/GamificationContext';
import { useTheme } from '@/context/ThemeContext';
import { Users, Gift, Share2, MessageCircle, Mail, Copy } from 'lucide-react-native';
import * as Clipboard from 'expo-clipboard';

export default function InviteFriends() {
  const { gamificationData, addXP } = useGamification();
  const { currentTheme } = useTheme();
  const [isSharing, setIsSharing] = useState(false);

  const styles = createStyles(currentTheme.colors);

  // Generate a unique referral code (in a real app, this would come from your backend)
  const generateReferralCode = () => {
    const userId = 'USER123'; // This would be the actual user ID
    return `HABIT${userId.slice(-3)}${Math.random().toString(36).substr(2, 4).toUpperCase()}`;
  };

  const referralCode = generateReferralCode();
  const appStoreUrl = 'https://apps.apple.com/app/habit-tracker'; // Replace with actual URL
  const playStoreUrl = 'https://play.google.com/store/apps/details?id=com.habittracker'; // Replace with actual URL

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

  const handleShare = async () => {
    setIsSharing(true);
    try {
      const message = generateInviteMessage();
      const result = await Share.share({
        message,
        title: 'Join me in building better habits!'
      });
      
      if (result.action === Share.sharedAction) {
        // Award XP for sharing
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

  const inviteOptions = [
    {
      icon: Share2,
      label: 'Share Anywhere',
      action: handleShare,
      color: currentTheme.colors.primary
    },
    {
      icon: MessageCircle,
      label: 'WhatsApp',
      action: shareViaWhatsApp,
      color: '#25D366'
    },
    {
      icon: Mail,
      label: 'Email',
      action: shareViaEmail,
      color: '#EA4335'
    }
  ];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Users size={20} color={currentTheme.colors.primary} />
        <Text style={styles.title}>Invite Friends</Text>
        <View style={styles.xpBadge}>
          <Gift size={12} color={currentTheme.colors.accent} />
          <Text style={styles.xpText}>+10 XP</Text>
        </View>
      </View>
      
      <Text style={styles.subtitle}>
        Invite friends and earn XP together! Both you and your friend get bonus XP when they join.
      </Text>
      
      <View style={styles.referralSection}>
        <Text style={styles.referralLabel}>Your Referral Code</Text>
        <View style={styles.referralCodeContainer}>
          <Text style={styles.referralCode}>{referralCode}</Text>
          <TouchableOpacity style={styles.copyButton} onPress={copyReferralCode}>
            <Copy size={16} color={currentTheme.colors.primary} />
          </TouchableOpacity>
        </View>
      </View>
      
      <View style={styles.inviteOptions}>
        {inviteOptions.map((option, index) => {
          const IconComponent = option.icon;
          return (
            <TouchableOpacity
              key={index}
              style={[styles.inviteButton, { borderColor: option.color }]}
              onPress={option.action}
              disabled={isSharing}
            >
              <IconComponent size={20} color={option.color} />
              <Text style={[styles.inviteButtonText, { color: option.color }]}>
                {option.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
      
      <View style={styles.rewardsInfo}>
        <Gift size={16} color={currentTheme.colors.accent} />
        <Text style={styles.rewardsText}>
          You get 10 XP for each invite sent, and 50 XP when they join!
        </Text>
      </View>
    </View>
  );
}

const createStyles = (colors: any) => StyleSheet.create({
  container: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginLeft: 8,
    flex: 1,
  },
  xpBadge: {
    backgroundColor: colors.accent + '20',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  xpText: {
    color: colors.accent,
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  subtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 16,
    lineHeight: 20,
  },
  referralSection: {
    marginBottom: 20,
  },
  referralLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text,
    marginBottom: 8,
  },
  referralCodeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 8,
    padding: 12,
  },
  referralCode: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.primary,
    flex: 1,
    letterSpacing: 1,
  },
  copyButton: {
    padding: 4,
  },
  inviteOptions: {
    marginBottom: 16,
  },
  inviteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  inviteButtonText: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
  rewardsInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.accent + '10',
    borderRadius: 8,
    padding: 12,
  },
  rewardsText: {
    fontSize: 12,
    color: colors.textSecondary,
    marginLeft: 8,
    flex: 1,
  },
});