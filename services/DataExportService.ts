import AsyncStorage from '@react-native-async-storage/async-storage';
import CryptoES from 'crypto-es';
import * as Crypto from 'expo-crypto';
import { EncryptionService } from './EncryptionService';
import { MoodEntry, HabitMoodEntry, EnhancedMoodEntry } from '../types';
import * as FileSystem from 'expo-file-system';
import * as Print from 'expo-print';

export class DataExportService {
  static async exportMoodData(format: 'json' | 'csv' | 'pdf'): Promise<string> {
    const moodData = await this.getAllMoodData();
    const habitMoodData = await this.getAllHabitMoodData();
    
    const exportData = {
      metadata: {
        exportDate: new Date().toISOString(),
        version: '1.0',
        dataTypes: ['mood_entries', 'habit_mood_correlations', 'analytics'],
        privacyLevel: 'full' // or 'anonymized'
      },
      moodEntries: moodData,
      habitMoodEntries: habitMoodData,
      analytics: await this.generateExportAnalytics(moodData, habitMoodData),
      insights: await this.generateExportInsights(moodData, habitMoodData)
    };
    
    switch (format) {
      case 'json':
        return JSON.stringify(exportData, null, 2);
      case 'csv':
        return this.convertToCSV(exportData);
      case 'pdf':
        return await this.generatePDF(exportData);
      default:
        throw new Error('Unsupported export format');
    }
  }
  
  static async getAllMoodData(): Promise<EnhancedMoodEntry[]> {
    try {
      const encryptedData = await AsyncStorage.getItem('mood_entries');
      if (!encryptedData) return [];
      
      const decryptedData = await EncryptionService.decryptMoodData(encryptedData);
      return decryptedData || [];
    } catch (error) {
      console.error('Error retrieving mood data:', error);
      return [];
    }
  }
  
  static async getAllHabitMoodData(): Promise<HabitMoodEntry[]> {
    try {
      const encryptedData = await AsyncStorage.getItem('habit_mood_entries');
      if (!encryptedData) return [];
      
      const decryptedData = await EncryptionService.decryptMoodData(encryptedData);
      return decryptedData || [];
    } catch (error) {
      console.error('Error retrieving habit mood data:', error);
      return [];
    }
  }
  
  static async generateExportAnalytics(moodData: EnhancedMoodEntry[], habitMoodData: HabitMoodEntry[]): Promise<any> {
    return {
      totalMoodEntries: moodData.length,
      totalHabitMoodEntries: habitMoodData.length,
      dateRange: {
        start: moodData.length > 0 ? Math.min(...moodData.map(m => new Date(m.date).getTime())) : null,
        end: moodData.length > 0 ? Math.max(...moodData.map(m => new Date(m.date).getTime())) : null
      },
      averageMoodIntensity: moodData.length > 0 ? moodData.reduce((sum, m) => sum + m.intensity, 0) / moodData.length : 0,
      moodDistribution: this.calculateMoodDistribution(moodData),
      habitCompletionRate: this.calculateHabitCompletionRate(habitMoodData)
    };
  }
  
  static async generateExportInsights(moodData: EnhancedMoodEntry[], habitMoodData: HabitMoodEntry[]): Promise<any> {
    return {
      patterns: {
        weeklyTrends: this.analyzeWeeklyTrends(moodData),
        habitMoodCorrelations: this.analyzeHabitMoodCorrelations(habitMoodData),
        triggerAnalysis: this.analyzeTriggers(moodData)
      },
      recommendations: this.generateRecommendations(moodData, habitMoodData)
    };
  }
  
  static convertToCSV(exportData: any): string {
    const headers = ['Date', 'MoodState', 'Intensity', 'Note', 'Triggers', 'Location', 'Weather', 'Context'];
    const csvRows = [headers.join(',')];
    
    exportData.moodEntries.forEach((entry: EnhancedMoodEntry) => {
      const row = [
        entry.date,
        entry.moodState,
        entry.intensity.toString(),
        entry.note || '',
        entry.triggers?.join(';') || '',
        entry.location?.address || '',
        entry.weather?.condition || '',
        entry.context?.activity || ''
      ];
      csvRows.push(row.map(field => `"${field}"`).join(','));
    });
    
    return csvRows.join('\n');
  }
  
  static async generatePDF(exportData: any): Promise<string> {
    const htmlContent = `
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            h1, h2 { color: #333; }
            table { border-collapse: collapse; width: 100%; margin: 20px 0; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f2f2f2; }
          </style>
        </head>
        <body>
          <h1>Mood & Habit Data Export</h1>
          <p>Export Date: ${exportData.metadata.exportDate}</p>
          <h2>Summary</h2>
          <p>Total Mood Entries: ${exportData.analytics.totalMoodEntries}</p>
          <p>Average Mood Intensity: ${exportData.analytics.averageMoodIntensity.toFixed(2)}</p>
          <h2>Recent Mood Entries</h2>
          <table>
            <tr><th>Date</th><th>Mood State</th><th>Intensity</th><th>Note</th></tr>
            ${exportData.moodEntries.slice(0, 20).map((entry: EnhancedMoodEntry) => 
              `<tr><td>${entry.date}</td><td>${entry.moodState}</td><td>${entry.intensity}</td><td>${entry.note || 'N/A'}</td></tr>`
            ).join('')}
          </table>
        </body>
      </html>
    `;
    
    const { uri } = await Print.printToFileAsync({ html: htmlContent });
    return uri;
  }
  
  // Helper methods
  static calculateMoodDistribution(moodData: EnhancedMoodEntry[]): Record<string, number> {
    const distribution: Record<string, number> = {};
    moodData.forEach(entry => {
      distribution[entry.moodState] = (distribution[entry.moodState] || 0) + 1;
    });
    return distribution;
  }
  
  static calculateHabitCompletionRate(habitMoodData: HabitMoodEntry[]): number {
    if (habitMoodData.length === 0) return 0;
    const completed = habitMoodData.filter(entry => entry.action === 'completed').length;
    return (completed / habitMoodData.length) * 100;
  }
  
  static analyzeWeeklyTrends(moodData: EnhancedMoodEntry[]): any {
    // Simplified weekly trend analysis
    const weeklyData: Record<number, number[]> = {};
    moodData.forEach(entry => {
      const dayOfWeek = new Date(entry.date).getDay();
      if (!weeklyData[dayOfWeek]) weeklyData[dayOfWeek] = [];
      weeklyData[dayOfWeek].push(entry.intensity);
    });
    
    const trends: Record<number, number> = {};
    Object.keys(weeklyData).forEach(day => {
      const dayNum = parseInt(day);
      const intensities = weeklyData[dayNum];
      trends[dayNum] = intensities.reduce((sum, intensity) => sum + intensity, 0) / intensities.length;
    });
    
    return trends;
  }
  
  static analyzeHabitMoodCorrelations(habitMoodData: HabitMoodEntry[]): any {
    // Simplified correlation analysis
    const validEntries = habitMoodData.filter(entry => entry.preMood && entry.postMood);
    
    if (validEntries.length === 0) {
      return {
        preMoodAverage: 0,
        postMoodAverage: 0,
        moodImprovement: 0
      };
    }
    
    return {
      preMoodAverage: validEntries.reduce((sum, entry) => sum + (entry.preMood?.intensity || 0), 0) / validEntries.length,
      postMoodAverage: validEntries.reduce((sum, entry) => sum + (entry.postMood?.intensity || 0), 0) / validEntries.length,
      moodImprovement: validEntries.filter(entry => 
        (entry.postMood?.intensity || 0) > (entry.preMood?.intensity || 0)
      ).length
    };
  }
  
  static analyzeTriggers(moodData: EnhancedMoodEntry[]): any {
    const triggerCounts: Record<string, number> = {};
    moodData.forEach(entry => {
      if (entry.triggers) {
        entry.triggers.forEach(trigger => {
          triggerCounts[trigger] = (triggerCounts[trigger] || 0) + 1;
        });
      }
    });
    return triggerCounts;
  }
  
  static generateRecommendations(moodData: EnhancedMoodEntry[], habitMoodData: HabitMoodEntry[]): string[] {
    const recommendations: string[] = [];
    
    if (moodData.length > 0) {
      const avgIntensity = moodData.reduce((sum, m) => sum + m.intensity, 0) / moodData.length;
      if (avgIntensity < 5) {
        recommendations.push('Consider focusing on mood-boosting activities');
      }
    }
    
    if (habitMoodData.length > 0) {
      const completionRate = this.calculateHabitCompletionRate(habitMoodData);
      if (completionRate < 70) {
        recommendations.push('Try setting smaller, more achievable habit goals');
      }
    }
    
    return recommendations;
  }
  
  static async secureDataDeletion(): Promise<void> {
    // Multi-pass secure deletion
    const keysToDelete = [
      'mood_entries',
      'habit_mood_entries',
      'mood_analytics',
      'mood_patterns',
      'mood_predictions'
    ];
    
    for (const key of keysToDelete) {
      // Overwrite with random data multiple times
      for (let i = 0; i < 3; i++) {
        // Use expo-crypto instead of CryptoJS for random data
        const randomBytes = await Crypto.getRandomBytesAsync(128);
        const randomData = Array.from(randomBytes, byte => byte.toString(16).padStart(2, '0')).join('');
        await AsyncStorage.setItem(key, randomData);
      }
      
      // Final deletion
      await AsyncStorage.removeItem(key);
      await EncryptionService.secureDelete(key);
    }
    
    // Clear encryption keys
    await EncryptionService.secureDelete('mood_data_encryption_key');
    await EncryptionService.secureDelete('mood_data_salt');
  }
}