import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { useHabits } from '@/context/HabitContext';
import { useTheme } from '@/context/ThemeContext';
import { useLanguage } from '@/context/LanguageContext';

type ProgressChartProps = {
  chartType: 'bar' | 'line';
};

const { width: screenWidth } = Dimensions.get('window');

export default function ProgressChart({ chartType = 'bar' }: ProgressChartProps) {
  const { getDailyCompletionData } = useHabits();
  const { currentTheme } = useTheme();
  const { t } = useLanguage();
  const dailyData = getDailyCompletionData(7);

  // Get max value for scaling bars and lines
  const maxValue = Math.max(...dailyData.map(day => day.completedCount), 1);
  const styles = createStyles(currentTheme.colors);

  const renderBarChart = () => (
    <View style={styles.chartContainer}>
      <View style={styles.yAxisContainer}>
        {[maxValue, Math.floor(maxValue * 0.75), Math.floor(maxValue * 0.5), Math.floor(maxValue * 0.25), 0].map((value, index) => (
          <Text key={index} style={styles.yAxisLabel}>{value}</Text>
        ))}
      </View>
      <View style={styles.chartArea}>
        {dailyData.map((day, index) => {
          const heightPercentage = (day.completedCount / maxValue) * 100;
          const isToday = index === dailyData.length - 1;
          
          return (
            <View key={index} style={styles.dayColumn}>
              <View style={styles.barContainer}>
                <View 
                  style={[
                    styles.barFill, 
                    {
                      height: `${heightPercentage}%`,
                      backgroundColor: isToday 
                        ? currentTheme.colors.primary
                        : day.completionRate >= 100 
                          ? currentTheme.colors.success 
                          : currentTheme.colors.border,
                    }
                  ]} 
                />
                {day.completedCount > 0 && (
                  <View style={styles.valueLabel}>
                    <Text style={styles.valueLabelText}>{day.completedCount}</Text>
                  </View>
                )}
              </View>
              <Text style={[
                styles.dayLabel,
                isToday && { color: currentTheme.colors.primary, fontWeight: '600' }
              ]}>
                {day.dayShort}
              </Text>
              <View style={[
                styles.completionIndicator,
                { backgroundColor: day.completionRate >= 100 ? currentTheme.colors.success : currentTheme.colors.border }
              ]} />
            </View>
          );
        })}
      </View>
    </View>
  );

  const renderLineChart = () => (
    <View style={styles.chartContainer}>
      <View style={styles.yAxisContainer}>
        {[maxValue, Math.floor(maxValue * 0.75), Math.floor(maxValue * 0.5), Math.floor(maxValue * 0.25), 0].map((value, index) => (
          <Text key={index} style={styles.yAxisLabel}>{value}</Text>
        ))}
      </View>
      <View style={styles.chartArea}>
        {/* Grid lines */}
        <View style={styles.lineChartGrid}>
          {[0, 1, 2, 3, 4].map((line) => (
            <View key={line} style={styles.gridLine} />
          ))}
        </View>
        
        {/* Line chart points and connections */}
        <View style={styles.lineChartContainer}>
          {dailyData.map((day, index) => {
            const heightPercentage = (day.completedCount / maxValue) * 100;
            const isFirst = index === 0;
            const isToday = index === dailyData.length - 1;
            
            return (
              <View key={index} style={styles.linePointColumn}>
                {/* Line connecting to next point */}
                {!isFirst && index < dailyData.length && (
                  <View 
                    style={[
                      styles.lineConnector,
                      {
                        bottom: `${heightPercentage}%`,
                        backgroundColor: currentTheme.colors.primary,
                      }
                    ]}
                  />
                )}
                
                {/* Data point */}
                <View 
                  style={[
                    styles.dataPoint,
                    {
                      bottom: `${heightPercentage}%`,
                      backgroundColor: isToday 
                        ? currentTheme.colors.primary
                        : day.completionRate >= 100 
                          ? currentTheme.colors.success 
                          : currentTheme.colors.border,
                      borderColor: currentTheme.colors.background,
                    }
                  ]}
                >
                  {day.completedCount > 0 && (
                    <Text style={styles.pointValue}>{day.completedCount}</Text>
                  )}
                </View>
                
                <Text style={[
                  styles.dayLabel,
                  isToday && { color: currentTheme.colors.primary, fontWeight: '600' }
                ]}>
                  {day.dayShort}
                </Text>
                <View style={[
                  styles.completionIndicator,
                  { backgroundColor: day.completionRate >= 100 ? currentTheme.colors.success : currentTheme.colors.border }
                ]} />
              </View>
            );
          })}
        </View>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      {dailyData.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyTitle}>{t('progressChart.noDataYet')}</Text>
          <Text style={styles.emptyText}>{t('progressChart.startCompletingHabits')}</Text>
        </View>
      ) : (
        <>
          <View style={styles.chartHeader}>
            <Text style={styles.chartTitle}>{t('progressChart.sevenDayProgress')}</Text>
            <View style={styles.legendContainer}>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: currentTheme.colors.success }]} />
                <Text style={styles.legendText}>{t('progressChart.completed')}</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: currentTheme.colors.primary }]} />
                <Text style={styles.legendText}>{t('progressChart.today')}</Text>
              </View>
            </View>
          </View>
          {chartType === 'bar' ? renderBarChart() : renderLineChart()}
        </>
      )}
    </View>
  );
}

const createStyles = (colors: any) => StyleSheet.create({
  container: {
    width: '100%',
    minHeight: 280,
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 16,
  },
  chartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
  legendContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    fontSize: 12,
    color: colors.textMuted,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  emptyText: {
    textAlign: 'center',
    fontSize: 14,
    color: colors.textMuted,
    lineHeight: 20,
  },
  chartContainer: {
    flex: 1,
    flexDirection: 'row',
    minHeight: 200,
  },
  yAxisContainer: {
    width: 30,
    justifyContent: 'space-between',
    paddingRight: 8,
    paddingBottom: 40,
  },
  yAxisLabel: {
    fontSize: 10,
    color: colors.textMuted,
    textAlign: 'right',
  },
  chartArea: {
    flex: 1,
    position: 'relative',
  },
  dayColumn: {
    flex: 1,
    alignItems: 'center',
    height: '100%',
    paddingHorizontal: 4,
  },
  barContainer: {
    width: '80%',
    maxWidth: 32,
    height: '75%',
    backgroundColor: colors.surface,
    borderRadius: 8,
    justifyContent: 'flex-end',
    overflow: 'hidden',
    position: 'relative',
  },
  barFill: {
    width: '100%',
    borderRadius: 8,
    minHeight: 4,
  },
  valueLabel: {
    position: 'absolute',
    top: -20,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  valueLabelText: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.text,
    backgroundColor: colors.background,
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 4,
  },
  dayLabel: {
    marginTop: 8,
    fontSize: 12,
    color: colors.textMuted,
    fontWeight: '500',
  },
  completionIndicator: {
    width: 4,
    height: 4,
    borderRadius: 2,
    marginTop: 4,
  },
  lineChartContainer: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: '75%',
    position: 'absolute',
    bottom: 40,
    left: 0,
    right: 0,
  },
  lineChartGrid: {
    position: 'absolute',
    height: '75%',
    width: '100%',
    bottom: 40,
    justifyContent: 'space-between',
  },
  gridLine: {
    height: 1,
    width: '100%',
    backgroundColor: colors.border,
    opacity: 0.3,
  },
  linePointColumn: {
    flex: 1,
    alignItems: 'center',
    height: '100%',
    position: 'relative',
    paddingHorizontal: 4,
  },
  lineConnector: {
    position: 'absolute',
    left: '50%',
    width: '100%',
    height: 3,
    borderRadius: 1.5,
  },
  dataPoint: {
    width: 16,
    height: 16,
    borderRadius: 8,
    position: 'absolute',
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  pointValue: {
    fontSize: 8,
    fontWeight: '600',
    color: colors.background,
  },
});