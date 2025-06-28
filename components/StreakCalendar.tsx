import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useHabits } from '@/context/HabitContext';
import { useLanguage } from '@/context/LanguageContext';
import { useTheme } from '@/context/ThemeContext';

export default function StreakCalendar() {
  const { getMonthlyCompletionData } = useHabits();
  const { t } = useLanguage();
  const { currentTheme } = useTheme();
  const currentDate = new Date();
  const monthData = getMonthlyCompletionData(currentDate.getMonth(), currentDate.getFullYear());
  
  const weeks = useMemo(() => {
    const firstDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();
    const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
    
    const days = [];
    
    // Add empty days for the start of the month
    for (let i = 0; i < firstDay; i++) {
      days.push({ day: 0, completed: false, empty: true });
    }
    
    // Add days of the month
    for (let i = 1; i <= daysInMonth; i++) {
      const dayData = monthData.find(d => d.day === i);
      days.push({
        day: i,
        completed: dayData ? dayData.completionRate >= 100 : false,
        partial: dayData ? dayData.completionRate > 0 && dayData.completionRate < 100 : false,
        empty: false,
      });
    }
    
    // Group days into weeks
    const weeksArray = [];
    for (let i = 0; i < days.length; i += 7) {
      weeksArray.push(days.slice(i, i + 7));
    }
    
    return weeksArray;
  }, [monthData]);

  const getMonthName = () => {
    const monthNames = [
      'january', 'february', 'march', 'april', 'may', 'june',
      'july', 'august', 'september', 'october', 'november', 'december'
    ];
    return t(monthNames[currentDate.getMonth()]);
  };

  const weekdayLabels = [
    t('weekday_sun'),
    t('weekday_mon'),
    t('weekday_tue'),
    t('weekday_wed'),
    t('weekday_thu'),
    t('weekday_fri'),
    t('weekday_sat')
  ];

  const styles = createStyles(currentTheme.colors);

  return (
    <View style={styles.container}>
      <Text style={styles.monthTitle}>
        {getMonthName()} {currentDate.getFullYear()}
      </Text>
      
      <View style={styles.weekdayLabels}>
        {weekdayLabels.map((day, index) => (
          <Text key={index} style={styles.weekdayLabel}>{day}</Text>
        ))}
      </View>
      
      <View style={styles.calendar}>
        {weeks.map((week, weekIndex) => (
          <View key={weekIndex} style={styles.week}>
            {week.map((day, dayIndex) => (
              <View 
                key={dayIndex} 
                style={[
                  styles.dayCell,
                  day.empty && styles.emptyDay,
                  day.completed && styles.completedDay,
                  day.partial && styles.partialDay,
                  currentDate.getDate() === day.day && styles.currentDay,
                ]}
              >
                {!day.empty && (
                  <Text 
                    style={[
                      styles.dayText,
                      day.completed && styles.completedDayText,
                      day.partial && styles.partialDayText,
                      currentDate.getDate() === day.day && styles.currentDayText,
                    ]}
                  >
                    {day.day}
                  </Text>
                )}
              </View>
            ))}
          </View>
        ))}
      </View>
      
      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, styles.completedLegendDot]} />
          <Text style={styles.legendText}>{t('all_completed')}</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, styles.partialLegendDot]} />
          <Text style={styles.legendText}>{t('partially_completed')}</Text>
        </View>
      </View>
    </View>
  );
}

const createStyles = (colors: any) => StyleSheet.create({
  container: {
    width: '100%',
  },
  monthTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.textMuted,
    marginBottom: 16,
    textAlign: 'center',
  },
  weekdayLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  weekdayLabel: {
    flex: 1,
    textAlign: 'center',
    fontSize: 14,
    fontWeight: '500',
    color: '#64748B',
  },
  calendar: {
    width: '100%',
  },
  week: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  dayCell: {
    flex: 1,
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 2,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
  },
  emptyDay: {
    backgroundColor: 'transparent',
  },
  completedDay: {
    backgroundColor: '#4ECDC4',
  },
  partialDay: {
    backgroundColor: '#A7E8E4',
  },
  currentDay: {
    borderWidth: 2,
    borderColor: '#FF6B6B',
  },
  dayText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#64748B',
  },
  completedDayText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  partialDayText: {
    color: '#1E293B',
    fontWeight: '600',
  },
  currentDayText: {
    color: '#1E293B',
    fontWeight: '700',
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 16,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 8,
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 6,
  },
  completedLegendDot: {
    backgroundColor: '#4ECDC4',
  },
  partialLegendDot: {
    backgroundColor: '#A7E8E4',
  },
  legendText: {
    fontSize: 12,
    color: '#64748B',
  },
});