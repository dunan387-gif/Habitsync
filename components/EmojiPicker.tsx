import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Modal } from 'react-native';
import { X } from 'lucide-react-native';
import { useTheme } from '@/context/ThemeContext';
import { useLanguage } from '@/context/LanguageContext';

type EmojiPickerProps = {
  visible: boolean;
  onClose: () => void;
  onSelect: (emoji: string) => void;
  selectedEmoji?: string;
};

const HABIT_EMOJIS = [
  // Health & Fitness
  '💪', '🏃‍♂️', '🏃‍♀️', '🧘‍♂️', '🧘‍♀️', '🚴‍♂️', '🚴‍♀️', '🏊‍♂️', '🏊‍♀️', '🤸‍♂️',
  '🤸‍♀️', '🏋️‍♂️', '🏋️‍♀️', '🥗', '🍎', '🥕', '🥬', '💊', '🩺', '😴',
  
  // Learning & Reading
  '📚', '📖', '✍️', '📝', '🎓', '🧠', '💡', '🔬', '🎨', '🎵',
  '🎸', '🎹', '🎤', '📱', '💻', '⌨️', '🖥️', '📊', '📈', '📉',
  
  // Daily Life
  '🌅', '☀️', '🌙', '⭐', '🌟', '💧', '🚿', '🧼', '🪥', '🧴',
  '🍳', '🥘', '☕', '🫖', '🧹', '🧽', '🗑️', '📞', '💌', '📮',
  
  // Productivity
  '✅', '📋', '📌', '📎', '🗂️', '📁', '💼', '⏰', '⏲️', '📅',
  '🗓️', '📆', '🎯', '🏆', '🥇', '🏅', '⚡', '🔥', '💎', '🌈',
  
  // Nature & Environment
  '🌱', '🌿', '🌳', '🌲', '🌺', '🌸', '🌼', '🌻', '🌹', '🌷',
  '♻️', '🌍', '🌎', '🌏', '🌊', '🏔️', '🌤️', '⛅', '🌦️', '🌧️',
  
  // Social & Relationships
  '👥', '👫', '👬', '👭', '💕', '❤️', '💖', '💝', '🎁', '🤝',
  '🙏', '🤗', '😊', '😄', '😁', '🥰', '😍', '🤩', '😎', '🎉'
];

const EMOJI_CATEGORIES = [
  { name: 'emoji_category_health_fitness', emojis: HABIT_EMOJIS.slice(0, 20) },
  { name: 'emoji_category_learning_reading', emojis: HABIT_EMOJIS.slice(20, 40) },
  { name: 'emoji_category_daily_life', emojis: HABIT_EMOJIS.slice(40, 60) },
  { name: 'emoji_category_productivity', emojis: HABIT_EMOJIS.slice(60, 80) },
  { name: 'emoji_category_nature_environment', emojis: HABIT_EMOJIS.slice(80, 100) },
  { name: 'emoji_category_social_relationships', emojis: HABIT_EMOJIS.slice(100, 120) },
];

export default function EmojiPicker({ visible, onClose, onSelect, selectedEmoji }: EmojiPickerProps) {
  const { currentTheme } = useTheme();
  const { t } = useLanguage();
  const [selectedCategory, setSelectedCategory] = useState(0);
  
  const styles = createStyles(currentTheme.colors);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>{t('choose_icon')}</Text>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <X size={24} color={currentTheme.colors.text} />
            </TouchableOpacity>
          </View>

          {/* Category Tabs */}
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            style={styles.categoryContainer}
          >
            {EMOJI_CATEGORIES.map((category, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.categoryTab,
                  selectedCategory === index && styles.categoryTabActive
                ]}
                onPress={() => setSelectedCategory(index)}
              >
                <Text style={[
                  styles.categoryText,
                  selectedCategory === index && styles.categoryTextActive
                ]}>
                  {t(category.name)}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Emoji Grid */}
          <ScrollView style={styles.emojiContainer}>
            <View style={styles.emojiGrid}>
              {EMOJI_CATEGORIES[selectedCategory].emojis.map((emoji, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.emojiButton,
                    selectedEmoji === emoji && styles.emojiButtonSelected
                  ]}
                  onPress={() => onSelect(emoji)}
                >
                  <Text style={styles.emoji}>{emoji}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>

          {/* Clear Selection Button */}
          <TouchableOpacity
            style={styles.clearButton}
            onPress={() => onSelect('')}
          >
            <Text style={styles.clearButtonText}>{t('no_icon')}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const createStyles = (colors: any) => StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 20,
    paddingHorizontal: 20,
    paddingBottom: 40,
    maxHeight: '80%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.text,
  },
  closeButton: {
    padding: 4,
  },
  categoryContainer: {
    marginBottom: 20,
  },
  categoryTab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 12,
    borderRadius: 20,
    backgroundColor: colors.card,
  },
  categoryTabActive: {
    backgroundColor: colors.primary,
  },
  categoryText: {
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  categoryTextActive: {
    color: colors.background,
  },
  emojiContainer: {
    maxHeight: 400, // Set max height instead of flex
    marginBottom: 20,
  },
  emojiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 15,
  },
  emojiButton: {
    width: '20%', // Use percentage for responsive design
    aspectRatio: 1, // Keep square shape
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
    borderRadius: 8,
    backgroundColor: colors.card,
  },
  emoji: {
    fontSize: 28, // Larger emoji
  },
  emojiButtonSelected: {
    backgroundColor: colors.primaryLight,
    borderWidth: 2,
    borderColor: colors.primary,
  },
  clearButton: {
    backgroundColor: colors.card,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  clearButtonText: {
    color: colors.textSecondary,
    fontSize: 16,
    fontWeight: '500',
  },
});