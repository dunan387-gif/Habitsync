import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import DraggableFlatList, { RenderItemParams, ScaleDecorator } from 'react-native-draggable-flatlist';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Trash2, X, CheckSquare } from 'lucide-react-native';
import HabitItem from './HabitItem';
import { useHabits } from '@/context/HabitContext';
import { useTheme } from '@/context/ThemeContext';
import { useLanguage } from '@/context/LanguageContext';
import { Habit } from '@/types';

type HabitListProps = {
  habits: Habit[];
};

export default function HabitList({ habits }: HabitListProps) {
  const { reorderHabits, deleteMultipleHabits } = useHabits();
  const { currentTheme } = useTheme();
  const { t } = useLanguage();
  const [isDragActive, setIsDragActive] = useState(false);
  const [isMultiSelectMode, setIsMultiSelectMode] = useState(false);
  const [selectedHabits, setSelectedHabits] = useState<string[]>([]);
  
  // Split habits into completed and incomplete sections
  const completedHabits = habits.filter(habit => habit.completedToday);
  const incompleteHabits = habits.filter(habit => !habit.completedToday);
  
  const handleDragEnd = ({ data }: { data: Habit[] }) => {
    requestAnimationFrame(() => {
      const reorderedIncomplete = data.filter(habit => !habit.completedToday);
      const allHabits = [...reorderedIncomplete, ...completedHabits];
      reorderHabits(allHabits);
      setIsDragActive(false);
    });
  };
  
  const handleDragBegin = () => {
    setIsDragActive(true);
  };
  
  const toggleMultiSelectMode = () => {
    setIsMultiSelectMode(!isMultiSelectMode);
    setSelectedHabits([]);
  };
  
  const toggleHabitSelection = (habitId: string) => {
    setSelectedHabits(prev => 
      prev.includes(habitId) 
        ? prev.filter(id => id !== habitId)
        : [...prev, habitId]
    );
  };
  
  const selectAllHabits = () => {
    const allHabitIds = habits.map(habit => habit.id);
    setSelectedHabits(allHabitIds);
  };
  
  const handleBulkDelete = () => {
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
  };
  
  const renderHabitItem = ({ item, drag, isActive }: RenderItemParams<Habit>) => {
    return (
      <ScaleDecorator>
        <HabitItem 
          habit={item} 
          onLongPress={!isMultiSelectMode ? drag : undefined}
          isActive={isActive}
          isMultiSelectMode={isMultiSelectMode}
          isSelected={selectedHabits.includes(item.id)}
          onToggleSelection={() => toggleHabitSelection(item.id)}
        />
      </ScaleDecorator>
    );
  };
  
  const styles = createStyles(currentTheme.colors);
  
  return (
    <GestureHandlerRootView style={styles.container}>
      {/* Multi-select header */}
      {isMultiSelectMode && (
        <View style={styles.multiSelectHeader}>
          <View style={styles.multiSelectInfo}>
            <Text style={styles.selectedCount}>
              {selectedHabits.length} {t('selected')}
            </Text>
            <TouchableOpacity 
              style={styles.selectAllButton}
              onPress={selectAllHabits}
            >
              <CheckSquare size={20} color={currentTheme.colors.primary} />
              <Text style={styles.selectAllText}>{t('select_all')}</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.multiSelectActions}>
            <TouchableOpacity 
              style={[styles.actionButton, styles.deleteButton]}
              onPress={handleBulkDelete}
              disabled={selectedHabits.length === 0}
            >
              <Trash2 size={20} color="#FFFFFF" />
              <Text style={styles.deleteButtonText}>{t('delete')}</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.actionButton, styles.cancelButton]}
              onPress={toggleMultiSelectMode}
            >
              <X size={20} color={currentTheme.colors.text} />
            </TouchableOpacity>
          </View>
        </View>
      )}
      
      <ScrollView 
        style={styles.scrollContainer}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
        bounces={true}
        keyboardShouldPersistTaps="handled"
        scrollEnabled={!isDragActive}
        nestedScrollEnabled={true}
      >
        {/* Multi-select toggle button */}
        {!isMultiSelectMode && habits.length > 0 && (
          <TouchableOpacity 
            style={styles.multiSelectToggle}
            onPress={toggleMultiSelectMode}
          >
            <CheckSquare size={20} color={currentTheme.colors.primary} />
            <Text style={styles.multiSelectToggleText}>{t('select_multiple')}</Text>
          </TouchableOpacity>
        )}
        
        {incompleteHabits.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>{t('to_complete')}</Text>
            </View>
            <View style={styles.draggableContainer}>
              <DraggableFlatList
                data={incompleteHabits}
                onDragEnd={handleDragEnd}
                onDragBegin={handleDragBegin}
                keyExtractor={(item) => item.id}
                renderItem={renderHabitItem}
                showsVerticalScrollIndicator={false}
                scrollEnabled={false}
                nestedScrollEnabled={true}
                removeClippedSubviews={false}
                maxToRenderPerBatch={10}
                windowSize={10}
                initialNumToRender={8}
                containerStyle={styles.flatListContainer}
                activationDistance={50} // Reduced from 100 for more responsive drag
                dragItemOverflow={true}
                autoscrollThreshold={80} // Increased for better auto-scroll
                autoscrollSpeed={150} // Increased speed for smoother scrolling
                simultaneousHandlers={[]}
                animationConfig={{
                  damping: 20, // Smoother animation
                  stiffness: 200, // More responsive
                  mass: 0.8, // Lighter feel
                }}
              />
            </View>
          </View>
        )}
        
        {completedHabits.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>{t('completed')}</Text>
              <View style={styles.completedBadge}>
                <Text style={styles.completedBadgeText}>{completedHabits.length}</Text>
              </View>
            </View>
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
      </ScrollView>
    </GestureHandlerRootView>
  );
}

const createStyles = (colors: any) => StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContainer: {
    flex: 1,
  },
  contentContainer: {
    paddingBottom: 100,
    paddingHorizontal: 4,
  },
  draggableContainer: {
    minHeight: 50,
  },
  flatListContainer: {
    flexGrow: 1,
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
