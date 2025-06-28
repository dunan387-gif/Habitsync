import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import DraggableFlatList, { RenderItemParams, ScaleDecorator } from 'react-native-draggable-flatlist';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import HabitItem from './HabitItem';
import { useHabits } from '@/context/HabitContext';
import { useTheme } from '@/context/ThemeContext';
import { useLanguage } from '@/context/LanguageContext';
import { Habit } from '@/types';

type HabitListProps = {
  habits: Habit[];
};

export default function HabitList({ habits }: HabitListProps) {
  const { reorderHabits } = useHabits();
  const { currentTheme } = useTheme();
  const { t } = useLanguage();
  const [isDragActive, setIsDragActive] = useState(false);
  
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
  
  const renderHabitItem = ({ item, drag, isActive }: RenderItemParams<Habit>) => {
    return (
      <ScaleDecorator>
        <HabitItem 
          habit={item} 
          onLongPress={drag}
          isActive={isActive}
        />
      </ScaleDecorator>
    );
  };
  
  const styles = createStyles(currentTheme.colors);
  
  return (
    <GestureHandlerRootView style={styles.container}>
      <ScrollView 
        style={styles.scrollContainer}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
        bounces={true}
        keyboardShouldPersistTaps="handled"
        scrollEnabled={!isDragActive}
        nestedScrollEnabled={true}
      >
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
                activationDistance={100}
                dragItemOverflow={true}
                autoscrollThreshold={50}
                autoscrollSpeed={100}
                simultaneousHandlers={[]}
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
              <HabitItem key={habit.id} habit={habit} />
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
  },
  draggableContainer: {
    // No constraints
  },
  flatListContainer: {
    // No constraints
  },
  section: {
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginRight: 8,
  },
  completedBadge: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  completedBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
});
