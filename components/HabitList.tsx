import React, { useState, useMemo, useCallback, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Animated } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import DraggableFlatList, { ScaleDecorator } from 'react-native-draggable-flatlist';
import { Trash2, X, CheckSquare } from 'lucide-react-native';
import HabitItem from './HabitItem';
import StreakSummary from './StreakSummary';
import { useHabits } from '@/context/HabitContext';
import { useTheme } from '@/context/ThemeContext';
import { useLanguage } from '@/context/LanguageContext';
import { Habit } from '@/types';

type HabitListProps = {
  habits: Habit[];
  completedCount?: number;
  totalCount?: number;
};

// Memoized sub-components for better performance
const MultiSelectHeader = React.memo(({ 
  selectedHabits, 
  onSelectAll, 
  onBulkDelete, 
  onCancel, 
  t, 
  colors 
}: {
  selectedHabits: string[];
  onSelectAll: () => void;
  onBulkDelete: () => void;
  onCancel: () => void;
  t: (key: string) => string;
  colors: any;
}) => {
  const styles = createStyles(colors);
  
  return (
    <View style={styles.multiSelectHeader}>
      <View style={styles.multiSelectInfo}>
        <Text style={styles.selectedCount}>
          {selectedHabits.length} {t('selected')}
        </Text>
        <TouchableOpacity 
          style={styles.selectAllButton}
          onPress={onSelectAll}
        >
          <CheckSquare size={20} color={colors.primary} />
          <Text style={styles.selectAllText}>{t('select_all')}</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.multiSelectActions}>
        <TouchableOpacity 
          style={[styles.actionButton, styles.deleteButton]}
          onPress={onBulkDelete}
          disabled={selectedHabits.length === 0}
        >
          <Trash2 size={20} color="#FFFFFF" />
          <Text style={styles.deleteButtonText}>{t('delete')}</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.actionButton, styles.cancelButton]}
          onPress={onCancel}
        >
          <X size={20} color={colors.text} />
        </TouchableOpacity>
      </View>
    </View>
  );
});

const MultiSelectToggle = React.memo(({ onPress, t, colors }: {
  onPress: () => void;
  t: (key: string) => string;
  colors: any;
}) => {
  const styles = createStyles(colors);
  
  return (
    <TouchableOpacity 
      style={styles.multiSelectToggle}
      onPress={onPress}
    >
      <CheckSquare size={20} color={colors.primary} />
      <Text style={styles.multiSelectToggleText}>{t('select_multiple')}</Text>
    </TouchableOpacity>
  );
});

const SectionHeader = React.memo(({ title, count, t, colors }: {
  title: string;
  count?: number;
  t: (key: string) => string;
  colors: any;
}) => {
  const styles = createStyles(colors);
  
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {count !== undefined && (
        <View style={styles.completedBadge}>
          <Text style={styles.completedBadgeText}>{count}</Text>
        </View>
      )}
    </View>
  );
});

export default function HabitList({ habits, completedCount = 0, totalCount = 0 }: HabitListProps) {
  const { reorderHabits, deleteMultipleHabits } = useHabits();
  const { currentTheme } = useTheme();
  const { t } = useLanguage();
  const [isMultiSelectMode, setIsMultiSelectMode] = useState(false);
  const [selectedHabits, setSelectedHabits] = useState<string[]>([]);
  const flatListRef = useRef<any>(null);
  
  // Memoized data processing - optimized for performance
  const { completedHabits, incompleteHabits } = useMemo(() => {
    if (!habits || habits.length === 0) {
      return { completedHabits: [], incompleteHabits: [] };
    }
    
    const completed: Habit[] = [];
    const incomplete: Habit[] = [];
    
    // Single pass through habits array for better performance
    for (let i = 0; i < habits.length; i++) {
      const habit = habits[i];
      if (habit.completedToday) {
        completed.push(habit);
      } else {
        incomplete.push(habit);
      }
    }
    
    return { completedHabits: completed, incompleteHabits: incomplete };
  }, [habits]);
  

  
  const toggleMultiSelectMode = useCallback(() => {
    setIsMultiSelectMode(!isMultiSelectMode);
    setSelectedHabits([]);
  }, [isMultiSelectMode]);
  
  const toggleHabitSelection = useCallback((habitId: string) => {
    setSelectedHabits(prev => 
      prev.includes(habitId) 
        ? prev.filter(id => id !== habitId)
        : [...prev, habitId]
    );
  }, []);
  
  const selectAllHabits = useCallback(() => {
    const allHabitIds = habits.map(habit => habit.id);
    setSelectedHabits(allHabitIds);
  }, [habits]);
  
  const handleBulkDelete = useCallback(() => {
    if (selectedHabits.length === 0) return;
    
    const count = selectedHabits.length;
    const plural = count > 1 ? 's' : '';
    
    Alert.alert(
      t('delete_habits'),
      t('delete_confirmation').replace('{{count}}', count.toString()).replace('{{plural}}', plural),
      [
        { text: t('cancel'), style: 'cancel' },
        {
          text: t('delete'),
          style: 'destructive',
          onPress: () => {
            deleteMultipleHabits(selectedHabits);
            setSelectedHabits([]);
            setIsMultiSelectMode(false);
          },
        },
      ]
    );
  }, [selectedHabits, deleteMultipleHabits, t]);

  // Drag and drop functions - optimized for performance
  const handleDragEnd = useCallback(({ data }: { data: Habit[] }) => {
    // Use requestAnimationFrame to defer the heavy work
    requestAnimationFrame(() => {
  
      // Combine with completed habits and update
      const allHabits = [...data, ...completedHabits];
      reorderHabits(allHabits);
    });
  }, [completedHabits, reorderHabits]);
  

  
  const styles = createStyles(currentTheme.colors);
  
  return (
    <GestureHandlerRootView style={styles.container}>
      {/* Multi-select header */}
      {isMultiSelectMode && (
        <MultiSelectHeader
          selectedHabits={selectedHabits}
          onSelectAll={selectAllHabits}
          onBulkDelete={handleBulkDelete}
          onCancel={toggleMultiSelectMode}
          t={t}
          colors={currentTheme.colors}
        />
      )}
      
      {/* Multi-select toggle button */}
      {!isMultiSelectMode && habits.length > 0 && (
        <View style={styles.toggleContainer}>
          <MultiSelectToggle
            onPress={toggleMultiSelectMode}
            t={t}
            colors={currentTheme.colors}
          />
        </View>
      )}
      
      {/* Use DraggableFlatList for better drag and drop handling */}
      <DraggableFlatList
        ref={flatListRef}
        data={incompleteHabits}
        keyExtractor={(item) => item.id}
        onDragEnd={handleDragEnd}
        renderItem={useCallback(({ item, drag, isActive }: any) => (
          <ScaleDecorator>
            <HabitItem 
              habit={item as Habit} 
              onLongPress={isMultiSelectMode ? undefined : drag}
              isActive={isActive}
              isMultiSelectMode={isMultiSelectMode}
              isSelected={selectedHabits.includes((item as Habit).id)}
              onToggleSelection={() => toggleHabitSelection((item as Habit).id)}
            />
          </ScaleDecorator>
        ), [isMultiSelectMode, selectedHabits, toggleHabitSelection])}
        showsVerticalScrollIndicator={false}
        removeClippedSubviews={true}
        maxToRenderPerBatch={5}
        windowSize={5}
        initialNumToRender={5}
        updateCellsBatchingPeriod={50}
        contentContainerStyle={styles.flatListContainer}
        ListHeaderComponent={() => (
          <View style={styles.headerContainer}>
            <StreakSummary 
              completedCount={completedCount} 
              totalCount={totalCount} 
            />
            {incompleteHabits.length > 0 && (
              <View style={styles.section}>
                <SectionHeader
                  title={t('to_complete')}
                  t={t}
                  colors={currentTheme.colors}
                />
              </View>
            )}
          </View>
        )}
        ListFooterComponent={() => (
          <View style={styles.footerContainer}>
            {completedHabits.length > 0 && (
              <View style={styles.section}>
                <SectionHeader
                  title={t('completed')}
                  count={completedHabits.length}
                  t={t}
                  colors={currentTheme.colors}
                />
                {completedHabits.map((habit) => (
                  <HabitItem 
                    key={habit.id} 
                    habit={habit} 
                    isMultiSelectMode={isMultiSelectMode}
                    isSelected={selectedHabits.includes(habit.id)}
                    onToggleSelection={() => toggleHabitSelection(habit.id)}
                  />
                ))}
              </View>
            )}
          </View>
        )}
      />
    </GestureHandlerRootView>
  );
}

const createStyles = (colors: any) => StyleSheet.create({
  container: {
    flex: 1,
  },
  toggleContainer: {
    paddingHorizontal: 4,
    paddingVertical: 8,
  },
  flatListContainer: {
    flexGrow: 1,
    paddingHorizontal: 4,
    paddingBottom: 100,
  },
  headerContainer: {
    paddingHorizontal: 4,
  },
  footerContainer: {
    paddingHorizontal: 4,
  },
  section: {
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
    paddingHorizontal: 8,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    letterSpacing: 0.5,
  },
  completedBadge: {
    backgroundColor: colors.success || colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    minWidth: 32,
    alignItems: 'center',
    // Shadows removed as requested
  },
  completedBadgeText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  multiSelectToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: colors.border,
    // Shadows removed as requested
  },
  multiSelectToggleText: {
    marginLeft: 8,
    fontSize: 16,
    fontWeight: '600',
    color: colors.primary,
  },
  multiSelectHeader: {
    backgroundColor: colors.card,
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  multiSelectInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  selectedCount: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginRight: 16,
  },
  selectAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  selectAllText: {
    marginLeft: 4,
    fontSize: 14,
    color: colors.primary,
    fontWeight: '500',
  },
  multiSelectActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    marginLeft: 8,
  },
  deleteButton: {
    backgroundColor: '#FF4444',
  },
  deleteButtonText: {
    marginLeft: 4,
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  cancelButton: {
    backgroundColor: colors.surface,
  },
});
