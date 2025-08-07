// Virtualized Habit List for better performance with large datasets

import React, { useMemo, useCallback, useState, useRef } from 'react';
import { View, Text, StyleSheet, Dimensions, RefreshControl } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { useHabits } from '@/context/HabitContext';
import { useTheme } from '@/context/ThemeContext';
import { useLanguage } from '@/context/LanguageContext';
import { usePerformanceMonitoring } from '@/hooks/usePerformanceMonitoring';
import HabitItem from './HabitItem';
import { Habit } from '@/types';

const { width, height } = Dimensions.get('window');

interface VirtualizedHabitListProps {
  habits: Habit[];
  onRefresh?: () => Promise<void>;
  onLoadMore?: () => Promise<void>;
  showCompleted?: boolean;
  searchQuery?: string;
  categoryFilter?: string;
  sortBy?: 'name' | 'streak' | 'created' | 'priority';
  sortOrder?: 'asc' | 'desc';
}

interface HabitSection {
  title: string;
  data: Habit[];
  type: 'completed' | 'incomplete' | 'overdue';
}

const ITEM_HEIGHT = 80; // Estimated height of each habit item
const ESTIMATED_LIST_SIZE = 1000; // Estimated total items for better performance

export default function VirtualizedHabitList({
  habits,
  onRefresh,
  onLoadMore,
  showCompleted = true,
  searchQuery = '',
  categoryFilter = '',
  sortBy = 'name',
  sortOrder = 'asc'
}: VirtualizedHabitListProps) {
  const { currentTheme } = useTheme();
  const { t } = useLanguage();
  const { trackRenderTime, trackEvent } = usePerformanceMonitoring();
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const listRef = useRef<FlashList<HabitSection>>(null);
  const renderStartTime = useRef<number>(0);

  // Memoized data processing for better performance
  const processedHabits = useMemo(() => {
    renderStartTime.current = performance.now();
    
    let filteredHabits = [...habits];

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filteredHabits = filteredHabits.filter(habit =>
        habit.title.toLowerCase().includes(query) ||
        habit.description?.toLowerCase().includes(query)
      );
    }

    // Apply category filter
    if (categoryFilter) {
      filteredHabits = filteredHabits.filter(habit =>
        habit.category === categoryFilter
      );
    }

    // Sort habits
    filteredHabits.sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case 'name':
          comparison = a.title.localeCompare(b.title);
          break;
        case 'streak':
          comparison = (a.currentStreak || 0) - (b.currentStreak || 0);
          break;
        case 'created':
          comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          break;
        case 'priority':
          comparison = (a.priority || 0) - (b.priority || 0);
          break;
      }
      
      return sortOrder === 'asc' ? comparison : -comparison;
    });

    // Group habits into sections
    const sections: HabitSection[] = [];
    
    // Incomplete habits
    const incompleteHabits = filteredHabits.filter(habit => !habit.completedToday);
    if (incompleteHabits.length > 0) {
      sections.push({
        title: t('to_complete'),
        data: incompleteHabits,
        type: 'incomplete'
      });
    }

    // Overdue habits (if any)
    const overdueHabits = incompleteHabits.filter(habit => {
      const lastCompletion = habit.completions?.[habit.completions.length - 1];
      if (!lastCompletion) return false;
      
      const daysSinceLastCompletion = Math.floor(
        (Date.now() - new Date(lastCompletion.date).getTime()) / (1000 * 60 * 60 * 24)
      );
      
      return daysSinceLastCompletion > (habit.frequency?.days || 1);
    });
    
    if (overdueHabits.length > 0) {
      sections.push({
        title: t('overdue'),
        data: overdueHabits,
        type: 'overdue'
      });
    }

    // Completed habits
    if (showCompleted) {
      const completedHabits = filteredHabits.filter(habit => habit.completedToday);
      if (completedHabits.length > 0) {
        sections.push({
          title: t('completed'),
          data: completedHabits,
          type: 'completed'
        });
      }
    }

    // Track render performance
    const renderDuration = performance.now() - renderStartTime.current;
    trackRenderTime('VirtualizedHabitList', renderDuration);

    return sections;
  }, [habits, searchQuery, categoryFilter, sortBy, sortOrder, showCompleted, t, trackRenderTime]);

  // Memoized render functions
  const renderSectionHeader = useCallback(({ section }: { section: HabitSection }) => {
    const styles = createStyles(currentTheme.colors);
    
    return (
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>{section.title}</Text>
        <View style={styles.sectionBadge}>
          <Text style={styles.sectionBadgeText}>{section.data.length}</Text>
        </View>
      </View>
    );
  }, [currentTheme.colors]);

  const renderHabitItem = useCallback(({ item }: { item: Habit }) => {
    return (
      <HabitItem
        habit={item}
        isMultiSelectMode={false}
        isSelected={false}
        onToggleSelection={() => {}}
      />
    );
  }, []);

  const renderEmptyState = useCallback(() => {
    const styles = createStyles(currentTheme.colors);
    
    return (
      <View style={styles.emptyState}>
        <Text style={styles.emptyStateTitle}>
          {searchQuery ? t('no_habits_found') : t('no_habits_yet')}
        </Text>
        <Text style={styles.emptyStateSubtitle}>
          {searchQuery ? t('try_different_search') : t('create_your_first_habit')}
        </Text>
      </View>
    );
  }, [currentTheme.colors, searchQuery, t]);

  const renderFooter = useCallback(() => {
    if (!loadingMore) return null;
    
    const styles = createStyles(currentTheme.colors);
    
    return (
      <View style={styles.loadingFooter}>
        <Text style={styles.loadingText}>{t('loading_more')}</Text>
      </View>
    );
  }, [loadingMore, currentTheme.colors, t]);

  // Event handlers
  const handleRefresh = useCallback(async () => {
    if (!onRefresh) return;
    
    setRefreshing(true);
    trackEvent('list_refresh', 0, { listType: 'habits' });
    
    try {
      await onRefresh();
    } catch (error) {
      console.error('Error refreshing habits:', error);
    } finally {
      setRefreshing(false);
    }
  }, [onRefresh, trackEvent]);

  const handleLoadMore = useCallback(async () => {
    if (!onLoadMore || loadingMore) return;
    
    setLoadingMore(true);
    trackEvent('list_load_more', 0, { listType: 'habits' });
    
    try {
      await onLoadMore();
    } catch (error) {
      console.error('Error loading more habits:', error);
    } finally {
      setLoadingMore(false);
    }
  }, [onLoadMore, loadingMore, trackEvent]);

  const handleScroll = useCallback((event: any) => {
    // Track scroll performance
    const scrollY = event.nativeEvent.contentOffset.y;
    trackEvent('list_scroll', 0, { 
      listType: 'habits', 
      scrollY,
      visibleItems: Math.floor(scrollY / ITEM_HEIGHT)
    });
  }, [trackEvent]);

  const handleViewableItemsChanged = useCallback(({ viewableItems }: any) => {
    // Track which items are visible for analytics
    const visibleHabitIds = viewableItems.map((item: any) => item.item?.id).filter(Boolean);
    
    if (visibleHabitIds.length > 0) {
      trackEvent('habits_visible', 0, { 
        visibleHabitIds,
        count: visibleHabitIds.length
      });
    }
  }, [trackEvent]);

  const styles = createStyles(currentTheme.colors);

  return (
    <View style={styles.container}>
      <FlashList
        ref={listRef}
        data={processedHabits}
        renderItem={({ item }) => (
          <View>
            {renderSectionHeader({ section: item })}
            <FlashList
              data={item.data}
              renderItem={renderHabitItem}
              estimatedItemSize={ITEM_HEIGHT}
              showsVerticalScrollIndicator={false}
              scrollEnabled={false}
              nestedScrollEnabled={true}
              removeClippedSubviews={true}
              keyExtractor={(habit) => habit.id}
              ListEmptyComponent={renderEmptyState}
            />
          </View>
        )}
        estimatedItemSize={ESTIMATED_LIST_SIZE}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[currentTheme.colors.primary]}
            tintColor={currentTheme.colors.primary}
          />
        }
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.1}
        onScroll={handleScroll}
        onViewableItemsChanged={handleViewableItemsChanged}
        viewabilityConfig={{
          itemVisiblePercentThreshold: 50,
          minimumViewTime: 100
        }}
        ListFooterComponent={renderFooter}
        keyExtractor={(section) => section.type}
        removeClippedSubviews={true}
        getItemType={(item) => item.type}
        overrideItemLayout={(layout, item) => {
          // Optimize layout for different section types
          switch (item.type) {
            case 'completed':
              layout.size = item.data.length * ITEM_HEIGHT + 60; // Header + items
              break;
            case 'incomplete':
              layout.size = item.data.length * ITEM_HEIGHT + 60;
              break;
            case 'overdue':
              layout.size = item.data.length * ITEM_HEIGHT + 60;
              break;
          }
        }}
      />
    </View>
  );
}

const createStyles = (colors: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    letterSpacing: 0.5,
  },
  sectionBadge: {
    backgroundColor: colors.primary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    minWidth: 24,
    alignItems: 'center',
  },
  sectionBadgeText: {
    color: colors.background,
    fontSize: 12,
    fontWeight: '700',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingVertical: 64,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.text,
    textAlign: 'center',
    marginBottom: 8,
  },
  emptyStateSubtitle: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
  },
  loadingFooter: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 14,
    color: colors.textSecondary,
  },
}); 