import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  Alert,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { X, Edit3, Save, Camera, User, Upload } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { useLanguage } from '@/context/LanguageContext';
import { ProfileUpdateData } from '@/types';

const { width: screenWidth } = Dimensions.get('window');

export default function ProfileScreen() {
  const { currentTheme } = useTheme();
  const { t } = useLanguage();
  const { user, updateProfile, uploadAvatar } = useAuth();
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lastPressTime, setLastPressTime] = useState(0);
  const [formData, setFormData] = useState<ProfileUpdateData>({
    name: user?.name || '',
    bio: user?.bio || '',
    location: user?.location || '',
    preferences: user?.preferences || {
      notifications: true,
      emailUpdates: false,
      publicProfile: false,
    },
  });
  
  const styles = createStyles(currentTheme.colors);
  
  const handleSave = async () => {
    if (isSubmitting) return;
    
    setIsSubmitting(true);
    try {
      await updateProfile(formData);
      setIsEditing(false);
      Alert.alert(t('profile.success'), t('profile.profileUpdated'));
    } catch (error) {
      Alert.alert(t('profile.error'), t('profile.failedToUpdate'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      name: user?.name || '',
      bio: user?.bio || '',
      location: user?.location || '',
      preferences: user?.preferences || {
        notifications: true,
        emailUpdates: false,
        publicProfile: false,
      },
    });
    setIsEditing(false);
  };

  const handleAvatarUpload = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert(t('profile.permissionRequired'), t('profile.photoLibraryAccess'));
        return;
      }
      
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
      });
      
      if (!result.canceled && result.assets && result.assets.length > 0) {
        const selectedImage = result.assets[0];
        await uploadAvatar(selectedImage.uri);
      }
    } catch (error) {
      console.error('Error uploading avatar:', error);
      Alert.alert(t('profile.uploadFailed'), t('profile.avatarUploadFailed'));
    }
  };

  const handleCoverImageUpload = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert(t('profile.permissionRequired'), t('profile.coverImageAccess'));
        return;
      }
      
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [16, 9],
        quality: 0.8,
      });
      
      if (!result.canceled && result.assets && result.assets.length > 0) {
        const selectedImage = result.assets[0];
        setFormData({ ...formData, coverImage: selectedImage.uri });
      }
    } catch (error) {
      console.error('Error uploading cover image:', error);
      Alert.alert(t('profile.uploadFailed'), t('profile.coverUploadFailed'));
    }
  };

  const handleBackPress = () => {
    if (isSubmitting) return; // Don't allow back during save
    router.back();
  };

  const handleEditToggle = () => {
    if (isSubmitting) return;
    
    if (isEditing) {
      handleSave();
    } else {
      setIsEditing(true);
    }
  };

  // REMOVE this duplicate function completely:
  // const handleSaveFromToggle = async () => {
  //    if (isSubmitting) return; // Prevent multiple saves
  //    
  //    setIsSubmitting(true);
  //    try {
  //      await updateProfile(formData);
  //      setIsEditing(false);
  //      Alert.alert(t('Success'), t('Profile updated successfully!'));
  //    } catch (error) {
  //      Alert.alert(t('Error'), t('Failed to update profile. Please try again.'));
  //    } finally {
  //      setIsSubmitting(false);
  //    }
  //  };

  if (!user) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: currentTheme.colors.background }]}>
        <StatusBar style={currentTheme.isDark ? 'light' : 'dark'} />
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{t('profile.pleaseLogin')}</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: currentTheme.colors.background }]}>
      <StatusBar style={currentTheme.isDark ? 'light' : 'dark'} />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          onPress={handleBackPress}
          style={styles.backButton}
          activeOpacity={0.7}
          hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }} // Increased from 10
          pressRetentionOffset={{ top: 15, bottom: 15, left: 15, right: 15 }} // Increased from 10
        >
          <X size={24} color={currentTheme.colors.text} />
        </TouchableOpacity>
        
        <TouchableOpacity
          onPress={handleEditToggle}
          style={[styles.actionButton, isSubmitting && styles.disabledActionButton]}
          disabled={isSubmitting}
          activeOpacity={isSubmitting ? 1 : 0.7}
          hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }} // Increased from 10
          pressRetentionOffset={{ top: 15, bottom: 15, left: 15, right: 15 }} // Increased from 10
        >
          {isEditing ? (
            isSubmitting ? (
              <ActivityIndicator size="small" color={currentTheme.colors.primary} />
            ) : (
              <Save size={24} color={currentTheme.colors.primary} />
            )
          ) : (
            <Edit3 size={24} color={currentTheme.colors.primary} />
          )}
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Cover Image Section */}
        <View style={styles.coverSection}>
          {formData.coverImage || user.coverImage ? (
            <Image 
              source={{ uri: formData.coverImage || user.coverImage }} 
              style={styles.coverImage} 
            />
          ) : (
            <View style={styles.coverPlaceholder}>
              <Upload size={32} color={currentTheme.colors.textMuted} />
              <Text style={styles.coverPlaceholderText}>{t('profile.addCoverPhoto')}</Text>
            </View>
          )}
          {isEditing && (
            <TouchableOpacity 
              style={styles.coverEditButton} 
              onPress={handleCoverImageUpload}
              activeOpacity={0.8}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Camera size={18} color={currentTheme.colors.background} />
            </TouchableOpacity>
          )}
        </View>

        {/* Avatar Section */}
        <View style={styles.avatarSection}>
          <View style={styles.avatarContainer}>
            {user.avatar ? (
              <Image source={{ uri: user.avatar }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <User size={50} color={currentTheme.colors.textMuted} />
              </View>
            )}
            {isEditing && (
              <TouchableOpacity 
                style={styles.cameraButton} 
                onPress={handleAvatarUpload}
                activeOpacity={0.8}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                pressRetentionOffset={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Camera size={20} color={currentTheme.colors.background} />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Basic Profile Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('profile.basicProfileInfo')}</Text>
          
          {/* Name & Username */}
          <View style={styles.field}>
            <Text style={styles.fieldLabel}>{t('profile.name')}</Text>
            {isEditing ? (
              <TextInput
                style={styles.input}
                value={formData.name}
                onChangeText={(text) => setFormData({ ...formData, name: text })}
                placeholder={t('profile.enterName')}
                placeholderTextColor={currentTheme.colors.textMuted}
              />
            ) : (
              <Text style={styles.fieldValue}>{user.name || t('common.notSet')}</Text>
            )}
          </View>

          {/* Email Address */}
          <View style={styles.field}>
            <Text style={styles.fieldLabel}>{t('profile.emailAddress')}</Text>
            <View style={styles.emailContainer}>
              <Text style={styles.fieldValue}>{user.email}</Text>
              <Text style={styles.readOnlyLabel}>{t('profile.readOnly')}</Text>
            </View>
          </View>

          {/* Location */}
          <View style={styles.field}>
            <Text style={styles.fieldLabel}>{t('profile.location')}</Text>
            {isEditing ? (
              <TextInput
                style={styles.input}
                value={formData.location}
                onChangeText={(text) => setFormData({ ...formData, location: text })}
                placeholder={t('profile.enterLocation')}
                placeholderTextColor={currentTheme.colors.textMuted}
              />
            ) : (
              <Text style={styles.fieldValue}>{user.location || t('common.notSet')}</Text>
            )}
          </View>

          {/* Bio */}
          <View style={styles.field}>
            <Text style={styles.fieldLabel}>{t('profile.bioDescription')}</Text>
            {isEditing ? (
              <TextInput
                style={[styles.input, styles.textArea]}
                value={formData.bio}
                onChangeText={(text) => setFormData({ ...formData, bio: text })}
                placeholder={t('profile.tellAboutYourself')}
                placeholderTextColor={currentTheme.colors.textMuted}
                multiline
                numberOfLines={4}
                maxLength={500}
              />
            ) : (
              <Text style={styles.fieldValue}>{user.bio || t('profile.noBioAdded')}</Text>
            )}
            {isEditing && (
              <Text style={styles.characterCount}>
                {formData.bio?.length || 0}/500 {t('profile.charactersRemaining')}
              </Text>
            )}
          </View>
        </View>

        {/* Action Buttons */}
        {isEditing && (
          <View style={styles.buttonContainer}>
            <TouchableOpacity 
              style={styles.cancelButton} 
              onPress={handleCancel}
              activeOpacity={0.8}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              pressRetentionOffset={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Text style={styles.cancelButtonText}>{t('common.cancel')}</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.saveButton, isSubmitting && styles.disabledButton]} 
              onPress={handleSave}
              disabled={isSubmitting}
              activeOpacity={isSubmitting ? 1 : 0.8}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              pressRetentionOffset={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              {isSubmitting ? (
                <ActivityIndicator size="small" color={currentTheme.colors.background} />
              ) : (
                <Text style={styles.saveButtonText}>{t('profile.saveChanges')}</Text>
              )}
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const createStyles = (colors: any) =>
  StyleSheet.create({
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
      borderBottomColor: colors.border,
    },
    backButton: {
      padding: 16, // Increased from 12
      borderRadius: 12, // Increased from 8
      minWidth: 56, // Increased from 44
      minHeight: 56, // Increased from 44
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'transparent', // Add explicit background
    },
    actionButton: {
      padding: 16, // Increased from 12
      borderRadius: 12, // Increased from 8
      minWidth: 56, // Increased from 44
      minHeight: 56, // Increased from 44
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'transparent', // Add explicit background
    },
    coverEditButton: {
      position: 'absolute',
      bottom: 16,
      right: 16,
      backgroundColor: colors.primary,
      width: 48, // Increased from 40
      height: 48, // Increased from 40
      borderRadius: 24, // Increased from 20
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 3,
      borderColor: colors.background,
      shadowColor: colors.shadow || '#000',
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.25,
      shadowRadius: 3.84,
      elevation: 5,
    },
    cameraButton: {
      position: 'absolute',
      bottom: 0,
      right: 0,
      backgroundColor: colors.primary,
      width: 48, // Increased from 40
      height: 48, // Increased from 40
      borderRadius: 24, // Increased from 20
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 3,
      borderColor: colors.background,
      shadowColor: colors.shadow || '#000',
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.25,
      shadowRadius: 3.84,
      elevation: 5,
    },
    title: {
      fontSize: 20,
      fontWeight: '600',
      color: colors.text,
    },
    disabledActionButton: {
      opacity: 0.5,
    },
    content: {
      flex: 1,
    },
    coverSection: {
      position: 'relative',
      height: 200,
      backgroundColor: colors.card,
    },
    coverImage: {
      width: '100%',
      height: '100%',
      resizeMode: 'cover',
    },
    coverPlaceholder: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.card,
    },
    coverPlaceholderText: {
      marginTop: 8,
      fontSize: 16,
      color: colors.textMuted,
    },
    // Remove this entire commented block (lines 469-485)
    avatarSection: {
      alignItems: 'center',
      paddingVertical: 20,
      marginTop: -60, // Overlap with cover image
    },
    avatarContainer: {
      position: 'relative',
    },
    avatar: {
      width: 120,
      height: 120,
      borderRadius: 60,
      borderWidth: 4,
      borderColor: colors.background,
    },
    avatarPlaceholder: {
      width: 120,
      height: 120,
      borderRadius: 60,
      backgroundColor: colors.card,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 4,
      borderColor: colors.background,
    },
    section: {
      paddingHorizontal: 20,
      marginBottom: 32,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 20,
    },
    field: {
      marginBottom: 24,
    },
    fieldLabel: {
      fontSize: 14,
      fontWeight: '500',
      color: colors.text,
      marginBottom: 8,
    },
    fieldValue: {
      fontSize: 16,
      color: colors.textMuted,
      lineHeight: 24,
    },
    emailContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    readOnlyLabel: {
      fontSize: 12,
      color: colors.textMuted,
      fontStyle: 'italic',
    },
    input: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 12,
      paddingHorizontal: 16,
      paddingVertical: 12,
      fontSize: 16,
      color: colors.text,
      backgroundColor: colors.card,
    },
    textArea: {
      height: 100,
      textAlignVertical: 'top',
    },
    characterCount: {
      fontSize: 12,
      color: colors.textMuted,
      textAlign: 'right',
      marginTop: 4,
    },
    buttonContainer: {
      flexDirection: 'row',
      gap: 16,
      paddingHorizontal: 20,
      paddingVertical: 24,
      paddingBottom: 32,
    },
    cancelButton: {
      flex: 1,
      paddingVertical: 18,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
      alignItems: 'center',
      minHeight: 52,
    },
    cancelButtonText: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.text,
    },
    saveButton: {
      flex: 1,
      paddingVertical: 18,
      borderRadius: 12,
      backgroundColor: colors.primary,
      alignItems: 'center',
      minHeight: 52,
      shadowColor: colors.shadow || '#000',
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.25,
      shadowRadius: 3.84,
      elevation: 5,
    },
    saveButtonText: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.background,
    },
    errorContainer: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 20,
    },
    errorText: {
      fontSize: 16,
      color: colors.textMuted,
      textAlign: 'center',
    },
    disabledButton: {
      opacity: 0.6,
      shadowOpacity: 0,
      elevation: 0,
    },
  });