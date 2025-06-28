import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useLanguage } from '@/context/LanguageContext';
import { useTheme } from '@/context/ThemeContext';

export default function DateHeader() {
  const { currentLanguage } = useLanguage();
  const { currentTheme } = useTheme();
  
  const today = useMemo(() => {
    const date = new Date();
    
    if (currentLanguage.code === 'zh') {
      // 中文格式：使用数字月份
      const dayNames = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'];
      
      const day = dayNames[date.getDay()];
      const month = date.getMonth() + 1; // 1-12的数字
      const dateNum = date.getDate();
      
      return { day, month: `${month}月`, dateNum };
    } else {
      // 其他语言使用本地化格式
      const localeMap: Record<string, string> = {
        'en': 'en-US',
        'es': 'es-ES', 
        'fr': 'fr-FR'
      };
      const locale = localeMap[currentLanguage.code] || 'en-US';
      
      const day = date.toLocaleDateString(locale, { weekday: 'long' });
      const month = date.toLocaleDateString(locale, { month: 'long' });
      const dateNum = date.getDate();
      
      return { day, month, dateNum };
    }
  }, [currentLanguage.code]);

  const styles = createStyles(currentTheme.colors);

  return (
    <View style={styles.container}>
      <View style={styles.dateContainer}>
        <Text style={styles.day}>{today.day}</Text>
        <Text style={styles.date}>{today.month} {today.dateNum}</Text>
      </View>
    </View>
  );
}

const createStyles = (colors: any) => StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  dateContainer: {
    marginBottom: 8,
  },
  day: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.textMuted, // Now uses theme color (same as date)
  },
  date: {
    fontSize: 16,
    color: colors.textMuted, // Uses theme color
  },
});