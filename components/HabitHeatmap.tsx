import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react-native';
import { useTheme } from '@/context/ThemeContext';
import { useLanguage } from '@/context/LanguageContext';

interface HeatmapData {
  date: string;
  count: number;
  habits?: string[];
}

interface HabitHeatmapProps {
  data?: HeatmapData[];
  onDayPress?: (date: string, count: number) => void;
}

const HabitHeatmap: React.FC<HabitHeatmapProps> = ({ 
  data = [], 
  onDayPress 
}) => {
  const { currentTheme } = useTheme();
   const { t } = useLanguage();
  const styles = createStyles(currentTheme.colors);
  
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showMonthPicker, setShowMonthPicker] = useState(false);

  // Generate calendar data for selected month only
  const generateMonthCalendarData = () => {
    const year = selectedDate.getFullYear();
    const month = selectedDate.getMonth();
    
    // Get first day of the month and last day
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    
    // Get first Sunday of the calendar (might be from previous month)
    const startDate = new Date(firstDay);
    startDate.setDate(firstDay.getDate() - firstDay.getDay());
    
    // Get last Saturday of the calendar (might be from next month)
    const endDate = new Date(lastDay);
    endDate.setDate(lastDay.getDate() + (6 - lastDay.getDay()));
    
    const weeks = [];
    let currentWeek = [];
    
    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().split('T')[0];
      const dayData = data.find(item => item.date === dateStr);
      const today = new Date();
      
      currentWeek.push({
        date: dateStr,
        count: dayData?.count || 0,
        habits: dayData?.habits || [],
        isCurrentMonth: d.getMonth() === month,
        isToday: dateStr === today.toISOString().split('T')[0],
        dayNumber: d.getDate()
      });
      
      if (currentWeek.length === 7) {
        weeks.push([...currentWeek]);
        currentWeek = [];
      }
    }
    
    return weeks;
  };

  const getIntensityColor = (count: number, isCurrentMonth: boolean) => {
    if (!isCurrentMonth) return currentTheme.colors.surface + '40';
    if (count === 0) return currentTheme.colors.surface;
    if (count <= 2) return `${currentTheme.colors.success}40`;
    if (count <= 4) return `${currentTheme.colors.success}60`;
    if (count <= 6) return `${currentTheme.colors.success}80`;
    return currentTheme.colors.success;
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    const newDate = new Date(selectedDate);
    if (direction === 'prev') {
      newDate.setMonth(newDate.getMonth() - 1);
    } else {
      newDate.setMonth(newDate.getMonth() + 1);
    }
    setSelectedDate(newDate);
  };

  const selectMonth = (monthIndex: number) => {
    const newDate = new Date(selectedDate);
    newDate.setMonth(monthIndex);
    setSelectedDate(newDate);
    setShowMonthPicker(false);
  };

  const weeks = generateMonthCalendarData();
  const monthNames = [
    t('habitHeatmap.months.january'), t('habitHeatmap.months.february'), t('habitHeatmap.months.march'), t('habitHeatmap.months.april'), t('habitHeatmap.months.may'), t('habitHeatmap.months.june'),
    t('habitHeatmap.months.july'), t('habitHeatmap.months.august'), t('habitHeatmap.months.september'), t('habitHeatmap.months.october'), t('habitHeatmap.months.november'), t('habitHeatmap.months.december')
  ];
const dayLabels = [t('habitHeatmap.weekdays.sun'), t('habitHeatmap.weekdays.mon'), t('habitHeatmap.weekdays.tue'), t('habitHeatmap.weekdays.wed'), t('habitHeatmap.weekdays.thu'), t('habitHeatmap.weekdays.fri'), t('habitHeatmap.weekdays.sat')];
  
  const currentMonthName = monthNames[selectedDate.getMonth()];
  const currentYear = selectedDate.getFullYear();

  return (
    <View style={styles.container}>
      {/* Month Navigation Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.navButton}
          onPress={() => navigateMonth('prev')}
        >
          <ChevronLeft size={20} color={currentTheme.colors.text} />
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.monthSelector}
          onPress={() => setShowMonthPicker(!showMonthPicker)}
        >
          <Text style={styles.monthTitle}>
            {currentMonthName} {currentYear}
          </Text>
          <ChevronDown 
            size={16} 
            color={currentTheme.colors.textMuted}
            style={[styles.chevron, showMonthPicker && styles.chevronUp]}
          />
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.navButton}
          onPress={() => navigateMonth('next')}
        >
          <ChevronRight size={20} color={currentTheme.colors.text} />
        </TouchableOpacity>
      </View>
      
      {/* Month Picker Dropdown */}
      {showMonthPicker && (
        <View style={styles.monthPicker}>
          <ScrollView 
            showsVerticalScrollIndicator={true}
            nestedScrollEnabled={true}
          >
            {monthNames.map((month, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.monthOption,
                  index === selectedDate.getMonth() && styles.selectedMonthOption
                ]}
                onPress={() => selectMonth(index)}
              >
                <Text style={[
                  styles.monthOptionText,
                  index === selectedDate.getMonth() && styles.selectedMonthOptionText
                ]}>
                  {month}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}
      
      {/* Day labels */}
      <View style={styles.dayLabels}>
        {dayLabels.map((day, index) => (
          <Text key={index} style={styles.dayLabel}>{day}</Text>
        ))}
      </View>
      
      {/* Calendar grid */}
      <View style={styles.grid}>
        {weeks.map((week, weekIndex) => (
          <View key={weekIndex} style={styles.week}>
            {week.map((day, dayIndex) => (
              <TouchableOpacity
                key={`${weekIndex}-${dayIndex}`}
                style={[
                  styles.day,
                  { backgroundColor: getIntensityColor(day.count, day.isCurrentMonth) },
                  day.isToday && styles.today,
                  !day.isCurrentMonth && styles.otherMonthDay
                ]}
                onPress={() => onDayPress?.(day.date, day.count)}
                activeOpacity={0.7}
              >
                <Text style={[
                  styles.dayNumber,
                  !day.isCurrentMonth && styles.otherMonthDayNumber
                ]}>
                  {day.dayNumber}
                </Text>
                {day.count > 0 && day.isCurrentMonth && (
                  <View style={styles.habitDot} />
                )}
              </TouchableOpacity>
            ))}
          </View>
        ))}
      </View>
      
      {/* Legend */}
      <View style={styles.legend}>
        <Text style={styles.legendText}>Less</Text>
        <View style={styles.legendColors}>
          <View style={[styles.legendSquare, { backgroundColor: currentTheme.colors.surface }]} />
          <View style={[styles.legendSquare, { backgroundColor: `${currentTheme.colors.success}40` }]} />
          <View style={[styles.legendSquare, { backgroundColor: `${currentTheme.colors.success}60` }]} />
          <View style={[styles.legendSquare, { backgroundColor: `${currentTheme.colors.success}80` }]} />
          <View style={[styles.legendSquare, { backgroundColor: currentTheme.colors.success }]} />
        </View>
        <Text style={styles.legendText}>More</Text>
      </View>
    </View>
  );
};

const createStyles = (colors: any) => StyleSheet.create({
  container: {
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
    paddingHorizontal: 8,
  },
  navButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: colors.surface,
  },
  monthSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: colors.surface,
    borderRadius: 12,
    gap: 8,
  },
  monthTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
  chevron: {
    transform: [{ rotate: '0deg' }],
  },
  chevronUp: {
    transform: [{ rotate: '180deg' }],
  },
  monthPicker: {
    backgroundColor: colors.card,
    borderRadius: 12,
    marginBottom: 16,
    maxHeight: 200,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  monthOption: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border + '20',
  },
  selectedMonthOption: {
    backgroundColor: colors.primary + '15',
  },
  monthOptionText: {
    fontSize: 16,
    color: colors.text,
  },
  selectedMonthOptionText: {
    color: colors.primary,
    fontWeight: '600',
  },
  dayLabels: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  dayLabel: {
    flex: 1,
    fontSize: 12,
    color: colors.textMuted,
    fontWeight: '500',
    textAlign: 'center',
  },
  grid: {
    marginBottom: 16,
  },
  week: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  day: {
    flex: 1,
    aspectRatio: 1,
    margin: 1,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border + '20',
    position: 'relative',
  },
  today: {
    borderColor: colors.primary,
    borderWidth: 2,
  },
  otherMonthDay: {
    opacity: 0.3,
  },
  dayNumber: {
    fontSize: 14,
    color: colors.text,
    fontWeight: '500',
  },
  otherMonthDayNumber: {
    color: colors.textMuted,
  },
  habitDot: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.primary,
  },
  legend: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
    gap: 4,
  },
  legendText: {
    fontSize: 10,
    color: colors.textMuted,
  },
  legendColors: {
    flexDirection: 'row',
    gap: 2,
    marginHorizontal: 8,
  },
  legendSquare: {
    width: 10,
    height: 10,
    borderRadius: 2,
    borderWidth: 1,
    borderColor: colors.border + '20',
  },
});

export default HabitHeatmap;