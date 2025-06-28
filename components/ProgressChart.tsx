import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useHabits } from '@/context/HabitContext';

type ProgressChartProps = {
  chartType: 'bar' | 'line';
};

export default function ProgressChart({ chartType = 'bar' }: ProgressChartProps) {
  const { getDailyCompletionData } = useHabits();
  const dailyData = getDailyCompletionData(7);

  // Get max value for scaling bars and lines
  const maxValue = Math.max(...dailyData.map(day => day.completedCount), 1);

  const renderBarChart = () => (
    <View style={styles.chartContainer}>
      {dailyData.map((day, index) => (
        <View key={index} style={styles.dayColumn}>
          <View style={styles.barContainer}>
            <View 
              style={[
                styles.barFill, 
                {
                  height: `${(day.completedCount / maxValue) * 100}%`,
                  backgroundColor: day.completionRate >= 100 ? '#4ECDC4' : '#94A3B8',
                }
              ]} 
            />
          </View>
          <Text style={styles.dayLabel}>{day.dayShort}</Text>
        </View>
      ))}
    </View>
  );

  const renderLineChart = () => (
    <View style={styles.chartContainer}>
      {/* Line chart background grid */}
      <View style={styles.lineChartGrid}>
        {[0, 1, 2, 3].map((line) => (
          <View key={line} style={styles.gridLine} />
        ))}
      </View>
      
      {/* Line chart points and connections */}
      <View style={styles.lineChartContainer}>
        {dailyData.map((day, index) => {
          const heightPercentage = (day.completedCount / maxValue) * 100;
          const isFirst = index === 0;
          const isLast = index === dailyData.length - 1;
          const prevHeightPercentage = isFirst ? 0 : (dailyData[index - 1].completedCount / maxValue) * 100;
          
          return (
            <View key={index} style={styles.linePointColumn}>
              {/* Line connecting to previous point */}
              {!isFirst && (
                <View 
                  style={[
                    styles.lineConnector,
                    {
                      height: 2,
                      width: '100%',
                      position: 'absolute',
                      bottom: `${heightPercentage}%`,
                      transform: [{
                        rotate: `${Math.atan2(
                          heightPercentage - prevHeightPercentage,
                          100
                        ) * (180 / Math.PI)}deg`
                      }],
                      transformOrigin: 'left',
                      backgroundColor: '#4ECDC4',
                      zIndex: 1,
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
                    backgroundColor: day.completionRate >= 100 ? '#4ECDC4' : '#94A3B8',
                  }
                ]}
              />
              <Text style={styles.dayLabel}>{day.dayShort}</Text>
            </View>
          );
        })}
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      {dailyData.length === 0 ? (
        <Text style={styles.emptyText}>No data available yet</Text>
      ) : (
        chartType === 'bar' ? renderBarChart() : renderLineChart()
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    height: 200,
  },
  emptyText: {
    textAlign: 'center',
    fontSize: 16,
    color: '#94A3B8',
    paddingVertical: 48,
  },
  chartContainer: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingBottom: 24,
    position: 'relative',
  },
  dayColumn: {
    flex: 1,
    alignItems: 'center',
    height: '100%',
  },
  barContainer: {
    width: 24,
    height: '80%',
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  barFill: {
    width: '100%',
    backgroundColor: '#4ECDC4',
    borderRadius: 12,
  },
  dayLabel: {
    marginTop: 8,
    fontSize: 12,
    color: '#64748B',
  },
  lineChartContainer: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: '80%',
    position: 'absolute',
    bottom: 24,
    left: 0,
    right: 0,
  },
  lineChartGrid: {
    position: 'absolute',
    height: '80%',
    width: '100%',
    bottom: 24,
    justifyContent: 'space-between',
  },
  gridLine: {
    height: 1,
    width: '100%',
    backgroundColor: '#E2E8F0',
  },
  linePointColumn: {
    flex: 1,
    alignItems: 'center',
    height: '100%',
    position: 'relative',
  },
  lineConnector: {
    position: 'absolute',
    left: '-50%',
    width: '100%',
  },
  dataPoint: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#4ECDC4',
    position: 'absolute',
    zIndex: 2,
  },
});