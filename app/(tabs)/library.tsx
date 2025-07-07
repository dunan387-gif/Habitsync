import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TextInput, SafeAreaView, TouchableOpacity, ScrollView } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Search, Filter, Plus } from 'lucide-react-native';
import { useHabits } from '@/context/HabitContext';
import { useTheme } from '@/context/ThemeContext';
import { useLanguage } from '@/context/LanguageContext';
import HabitSuggestion from '@/components/HabitSuggestion';
import HabitForm from '@/components/HabitForm';
import { habitCategories } from '@/data/habitSuggestions';
import { Habit, HabitSuggestion as HabitSuggestionType } from '@/types';
import AIHabitSuggestions from '@/components/AIHabitSuggestions';
import { AIHabitSuggestion } from '@/types';

export default function Library() {
  const { habits, addHabit, updateHabit, deleteHabit } = useHabits();
  const { currentTheme } = useTheme();
  const { t } = useLanguage();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [showForm, setShowForm] = useState(false);
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null);
  const [showUserHabits, setShowUserHabits] = useState(true);

  const filteredCategories = activeCategory === 'all' 
    ? habitCategories 
    : habitCategories.filter(category => category.id === activeCategory);

  const handleAddHabit = (habitTitle: string) => {
    const currentHabitsCount = habits?.length || 0;
    addHabit({
      id: Date.now().toString(),
      title: habitTitle,
      streak: 0,
      createdAt: new Date().toISOString(),
      completedToday: false,
      completedDates: [],
      reminderEnabled: false,
      order: currentHabitsCount,
    });
  };

  const handleAddAISuggestion = (suggestion: AIHabitSuggestion) => {
    const currentHabitsCount = habits?.length || 0;
    addHabit({
      id: Date.now().toString(),
      title: suggestion.title,
      notes: suggestion.description,
      streak: 0,
      createdAt: new Date().toISOString(),
      completedToday: false,
      completedDates: [],
      reminderEnabled: false,
      category: suggestion.category,
      difficulty: 'easy',
      completionTimes: [],
      order: currentHabitsCount,
    });
  };

  const handleCreateHabit = (habitData: Omit<Habit, 'id' | 'createdAt' | 'completedDates' | 'streak' | 'completedToday'>) => {
    const currentHabitsCount = habits?.length || 0;
    addHabit({
      id: Date.now().toString(),
      title: habitData.title,
      icon: habitData.icon,
      notes: habitData.notes,
      streak: 0,
      createdAt: new Date().toISOString(),
      completedToday: false,
      completedDates: [],
      reminderTime: habitData.reminderTime,
      reminderEnabled: habitData.reminderEnabled || false,
      order: currentHabitsCount,
    });
    
    setShowForm(false);
    setEditingHabit(null);
  };

  const handleEditHabit = (habit: Habit) => {
    setEditingHabit(habit);
    setShowForm(true);
  };

  const handleSaveEdit = (habitData: Omit<Habit, 'id' | 'createdAt' | 'completedDates' | 'streak' | 'completedToday'>) => {
    if (!editingHabit) return;
    
    updateHabit(editingHabit.id, {
      ...editingHabit,
      title: habitData.title,
      icon: habitData.icon,
      notes: habitData.notes,
      reminderTime: habitData.reminderTime,
      reminderEnabled: habitData.reminderEnabled || false,
      order: editingHabit.order || 0,
    });
    
    setShowForm(false);
    setEditingHabit(null);
  };

  const handleDeleteHabit = (habitId: string) => {
    deleteHabit(habitId);
  };

  const filteredUserHabits = habits?.filter(habit => 
    habit.title.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  const userHabitSuggestions: HabitSuggestionType[] = filteredUserHabits.map(habit => ({
    id: habit.id,
    title: habit.title,
    description: habit.notes || 'No description',
  }));

  const styles = createStyles(currentTheme.colors);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style={currentTheme.isDark ? 'light' : 'dark'} />
      <View style={styles.header}>
        <Text style={styles.title}>{t('habit_library')}</Text>
        <Text style={styles.subtitle}>{t('discover_manage_habits')}</Text>
      </View>

      <View style={styles.searchContainer}>
        <Search size={20} color={currentTheme.colors.textSecondary} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder={t('search_habits')}
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholderTextColor={currentTheme.colors.textMuted}
        />
      </View>

      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, showUserHabits && styles.activeTab]}
          onPress={() => setShowUserHabits(true)}
        >
          <Text style={[styles.tabText, showUserHabits && styles.activeTabText]}>{t('my_habits')}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, !showUserHabits && styles.activeTab]}
          onPress={() => setShowUserHabits(false)}
        >
          <Text style={[styles.tabText, !showUserHabits && styles.activeTabText]}>{t('suggestions')}</Text>
        </TouchableOpacity>
      </View>

      {showUserHabits ? (
        <>
          <AIHabitSuggestions onAddSuggestion={handleAddAISuggestion} />
          
          <TouchableOpacity 
            style={styles.createButton}
            onPress={() => {
              setEditingHabit(null);
              setShowForm(true);
            }}
          >
            <Plus size={20} color="#FFFFFF" />
            <Text style={styles.createButtonText}>{t('create_new_habit')}</Text>
          </TouchableOpacity>

          {filteredUserHabits.length > 0 ? (
            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.listContent}
              nestedScrollEnabled={true}
            >
              {userHabitSuggestions.map((item) => {
                const userHabit = habits?.find(h => h.id === item.id);
                return (
                  <HabitSuggestion
                    key={item.id}
                    habit={item}
                    onAdd={() => {}}
                    userHabit={userHabit}
                    onEdit={handleEditHabit}
                    onDelete={handleDeleteHabit}
                  />
                );
              })}
            </ScrollView>
          ) : (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>{t('no_habits_found')}</Text>
              <Text style={styles.emptySubtext}>{t('create_habit_or_add_suggestion')}</Text>
            </View>
          )}
        </>
      ) : (
        <>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoryContainer}
          >
            <TouchableOpacity
              style={[
                styles.categoryPill,
                activeCategory === 'all' && styles.activeCategoryPill,
              ]}
              onPress={() => setActiveCategory('all')}
            >
              <Text
                style={[
                  styles.categoryText,
                  activeCategory === 'all' && styles.activeCategoryText,
                ]}
              >
                {t('all')}
              </Text>
            </TouchableOpacity>
            {habitCategories.map((category) => (
              <TouchableOpacity
                key={category.id}
                style={[
                  styles.categoryPill,
                  activeCategory === category.id && styles.activeCategoryPill,
                ]}
                onPress={() => setActiveCategory(category.id)}
              >
                <Text
                  style={[
                    styles.categoryText,
                    activeCategory === category.id && styles.activeCategoryText,
                  ]}
                >
                  {t(category.name)}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listContent}
            nestedScrollEnabled={true}
          >
            {filteredCategories.map((item) => (
              <View key={item.id} style={styles.categorySection}>
                <Text style={styles.categoryTitle}>{t(item.name)}</Text>
                {item.habits
                  .filter(habit => 
                    habit.title.toLowerCase().includes(searchQuery.toLowerCase())
                  )
                  .map((habit) => (
                    <HabitSuggestion
                      key={habit.id}
                      habit={habit}
                      onAdd={() => handleAddHabit(habit.title)}
                    />
                  ))}
              </View>
            ))}
          </ScrollView>
        </>
      )}

      <HabitForm
        visible={showForm}
        onClose={() => {
          setShowForm(false);
          setEditingHabit(null);
        }}
        onSave={editingHabit ? handleSaveEdit : handleCreateHabit}
        initialValues={editingHabit ? {
          title: editingHabit.title,
          icon: editingHabit.icon,
          notes: editingHabit.notes,
          reminderTime: editingHabit.reminderTime,
          reminderEnabled: editingHabit.reminderEnabled,
          order: editingHabit.order || 0,
        } : undefined}
        isEditing={!!editingHabit}
      />
    </SafeAreaView>
  );
}

const createStyles = (colors: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingTop: 20,
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 24,
    paddingBottom: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: colors.textSecondary,
    marginBottom: 16,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: 12,
    marginHorizontal: 16,
    paddingHorizontal: 12,
    height: 48,
    borderWidth: 1,
    borderColor: colors.border,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: '100%',
    fontSize: 16,
    color: colors.text,
  },
  tabContainer: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 8,
    borderRadius: 8,
    backgroundColor: colors.surface,
    padding: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 6,
  },
  activeTab: {
    backgroundColor: colors.card,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.textSecondary,
  },
  activeTabText: {
    color: colors.text,
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    borderRadius: 12,
    marginHorizontal: 16,
    marginVertical: 16,
    paddingVertical: 12,
  },
  createButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  categoryContainer: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    paddingBottom: 45,
  },
  categoryPill: {
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: colors.surface,
    borderRadius: 20,
    marginRight: 12,
    minHeight: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  activeCategoryPill: {
    backgroundColor: colors.primary,
    shadowColor: colors.primary,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  categoryText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.textSecondary,
    textAlign: 'center',
  },
  activeCategoryText: {
    color: '#FFFFFF',
  },
  categorySection: {
    marginBottom: 24,
  },
  categoryTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 12,
    paddingHorizontal: 16,
  },
  listContent: {
    paddingBottom: 32,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
  },
});
