// Web Worker for heavy analytics computations
// This runs in a separate thread to avoid blocking the UI

// Import analytics processing functions
importScripts('/workers/analytics-processors.js');

// Worker message handler
self.onmessage = function(e) {
  const { type, data, id } = e.data;
  
  try {
    let result;
    
    switch (type) {
      case 'PROCESS_ANALYTICS':
        result = processAnalyticsData(data);
        break;
        
      case 'COMPUTE_CORRELATIONS':
        result = computeHabitMoodCorrelations(data.habits, data.moodData, data.habitMoodData);
        break;
        
      case 'GENERATE_PREDICTIONS':
        result = generatePredictiveModels(data.habits, data.habitMoodData, data.moodData);
        break;
        
      case 'ANALYZE_PATTERNS':
        result = analyzePatterns(data.habits, data.moodData, data.habitMoodData);
        break;
        
      case 'COMPUTE_STATISTICS':
        result = computeAdvancedStatistics(data.habits, data.moodData, data.habitMoodData);
        break;
        
      case 'PROCESS_LARGE_DATASET':
        result = processLargeDataset(data.dataset, data.filters, data.options);
        break;
        
      case 'GENERATE_INSIGHTS':
        result = generatePersonalizedInsights(data.userId, data.habits, data.moodData, data.habitMoodData);
        break;
        
      case 'COMPUTE_TRENDS':
        result = computeTrendAnalysis(data.habits, data.moodData, data.timeRange);
        break;
        
      case 'ANALYZE_PERFORMANCE':
        result = analyzePerformanceMetrics(data.metrics, data.baseline);
        break;
        
      default:
        throw new Error(`Unknown worker task: ${type}`);
    }
    
    // Send result back to main thread
    self.postMessage({
      type: 'SUCCESS',
      id,
      result,
      timestamp: Date.now()
    });
    
  } catch (error) {
    // Send error back to main thread
    self.postMessage({
      type: 'ERROR',
      id,
      error: error.message,
      timestamp: Date.now()
    });
  }
};

// Analytics processing functions
function processAnalyticsData(data) {
  const { habits, moodData, habitMoodData, filters, options } = data;
  
  // Process habits data
  const processedHabits = habits.map(habit => ({
    ...habit,
    completionRate: calculateCompletionRate(habit),
    averageMood: calculateAverageMood(habit, habitMoodData),
    trend: calculateTrend(habit),
    performance: calculatePerformance(habit)
  }));
  
  // Process mood data
  const processedMoodData = moodData.map(mood => ({
    ...mood,
    intensity: calculateMoodIntensity(mood),
    trend: calculateMoodTrend(mood, moodData),
    triggers: identifyMoodTriggers(mood, habitMoodData)
  }));
  
  // Apply filters
  const filteredData = applyFilters(processedHabits, processedMoodData, filters);
  
  // Generate insights
  const insights = generateInsights(filteredData, options);
  
  return {
    processedHabits: filteredData.habits,
    processedMoodData: filteredData.moodData,
    insights,
    summary: generateSummary(filteredData),
    metadata: {
      totalHabits: processedHabits.length,
      totalMoodEntries: processedMoodData.length,
      processingTime: Date.now() - startTime
    }
  };
}

function computeHabitMoodCorrelations(habits, moodData, habitMoodData) {
  const correlations = [];
  
  for (const habit of habits) {
    const habitMoodEntries = habitMoodData.filter(entry => entry.habitId === habit.id);
    
    if (habitMoodEntries.length < 5) continue; // Need minimum data points
    
    const correlation = calculateCorrelation(habit, habitMoodEntries, moodData);
    
    if (correlation.strength > 0.1) { // Only include meaningful correlations
      correlations.push({
        habitId: habit.id,
        habitTitle: habit.title,
        correlationStrength: correlation.strength,
        correlationType: correlation.type,
        confidence: correlation.confidence,
        sampleSize: habitMoodEntries.length,
        timePatterns: analyzeTimePatterns(habitMoodEntries),
        moodPatterns: analyzeMoodPatterns(habitMoodEntries, moodData)
      });
    }
  }
  
  return correlations.sort((a, b) => Math.abs(b.correlationStrength) - Math.abs(a.correlationStrength));
}

function generatePredictiveModels(habits, habitMoodData, moodData) {
  const models = [];
  
  for (const habit of habits) {
    const habitEntries = habitMoodData.filter(entry => entry.habitId === habit.id);
    
    if (habitEntries.length < 10) continue; // Need sufficient data
    
    const model = buildPredictiveModel(habit, habitEntries, moodData);
    
    if (model.confidence > 0.6) { // Only include confident models
      models.push({
        habitId: habit.id,
        habitTitle: habit.title,
        predictions: model.predictions,
        confidence: model.confidence,
        factors: model.factors,
        riskFactors: model.riskFactors,
        recommendations: model.recommendations
      });
    }
  }
  
  return models;
}

function analyzePatterns(habits, moodData, habitMoodData) {
  const patterns = {
    cyclicalPatterns: [],
    triggerEvents: [],
    habitChains: [],
    moodCascades: []
  };
  
  // Analyze cyclical patterns
  patterns.cyclicalPatterns = detectCyclicalPatterns(habits, habitMoodData);
  
  // Analyze trigger events
  patterns.triggerEvents = detectTriggerEvents(habits, moodData, habitMoodData);
  
  // Analyze habit chains
  patterns.habitChains = detectHabitChains(habits, habitMoodData);
  
  // Analyze mood cascades
  patterns.moodCascades = detectMoodCascades(moodData, habitMoodData);
  
  return patterns;
}

function computeAdvancedStatistics(habits, moodData, habitMoodData) {
  return {
    habitStats: computeHabitStatistics(habits, habitMoodData),
    moodStats: computeMoodStatistics(moodData),
    correlationStats: computeCorrelationStatistics(habits, moodData, habitMoodData),
    trendStats: computeTrendStatistics(habits, moodData, habitMoodData),
    performanceStats: computePerformanceStatistics(habits, habitMoodData)
  };
}

function processLargeDataset(dataset, filters, options) {
  const startTime = Date.now();
  
  // Process data in chunks to avoid memory issues
  const chunkSize = options.chunkSize || 1000;
  const chunks = [];
  
  for (let i = 0; i < dataset.length; i += chunkSize) {
    chunks.push(dataset.slice(i, i + chunkSize));
  }
  
  const processedChunks = chunks.map(chunk => processChunk(chunk, filters));
  const combinedResult = combineChunks(processedChunks);
  
  return {
    ...combinedResult,
    metadata: {
      totalRecords: dataset.length,
      chunksProcessed: chunks.length,
      processingTime: Date.now() - startTime,
      memoryUsage: getMemoryUsage()
    }
  };
}

function generatePersonalizedInsights(userId, habits, moodData, habitMoodData) {
  const insights = [];
  
  // Generate habit-specific insights
  for (const habit of habits) {
    const habitInsights = generateHabitInsights(habit, habitMoodData, moodData);
    insights.push(...habitInsights);
  }
  
  // Generate mood-specific insights
  const moodInsights = generateMoodInsights(moodData, habitMoodData);
  insights.push(...moodInsights);
  
  // Generate cross-pattern insights
  const crossInsights = generateCrossPatternInsights(habits, moodData, habitMoodData);
  insights.push(...crossInsights);
  
  // Sort by priority and relevance
  return insights
    .sort((a, b) => b.priority - a.priority)
    .slice(0, 20); // Limit to top 20 insights
}

function computeTrendAnalysis(habits, moodData, timeRange) {
  const trends = {
    habitTrends: [],
    moodTrends: [],
    correlationTrends: [],
    performanceTrends: []
  };
  
  // Compute habit trends
  trends.habitTrends = habits.map(habit => computeHabitTrend(habit, timeRange));
  
  // Compute mood trends
  trends.moodTrends = computeMoodTrends(moodData, timeRange);
  
  // Compute correlation trends
  trends.correlationTrends = computeCorrelationTrends(habits, moodData, timeRange);
  
  // Compute performance trends
  trends.performanceTrends = computePerformanceTrends(habits, timeRange);
  
  return trends;
}

function analyzePerformanceMetrics(metrics, baseline) {
  const analysis = {
    improvements: [],
    regressions: [],
    anomalies: [],
    recommendations: []
  };
  
  // Compare against baseline
  for (const [key, value] of Object.entries(metrics)) {
    const baselineValue = baseline[key];
    
    if (baselineValue !== undefined) {
      const change = ((value - baselineValue) / baselineValue) * 100;
      
      if (change > 10) {
        analysis.improvements.push({ metric: key, change, value, baseline: baselineValue });
      } else if (change < -10) {
        analysis.regressions.push({ metric: key, change, value, baseline: baselineValue });
      }
    }
  }
  
  // Detect anomalies
  analysis.anomalies = detectAnomalies(metrics, baseline);
  
  // Generate recommendations
  analysis.recommendations = generateRecommendations(analysis);
  
  return analysis;
}

// Helper functions (these would be imported from analytics-processors.js)
function calculateCompletionRate(habit) {
  // Implementation for calculating completion rate
  return 0.85; // Placeholder
}

function calculateAverageMood(habit, habitMoodData) {
  // Implementation for calculating average mood
  return 7.2; // Placeholder
}

function calculateTrend(habit) {
  // Implementation for calculating trend
  return 'increasing'; // Placeholder
}

function calculatePerformance(habit) {
  // Implementation for calculating performance
  return 0.78; // Placeholder
}

function calculateMoodIntensity(mood) {
  // Implementation for calculating mood intensity
  return mood.intensity || 5; // Placeholder
}

function calculateMoodTrend(mood, moodData) {
  // Implementation for calculating mood trend
  return 'stable'; // Placeholder
}

function identifyMoodTriggers(mood, habitMoodData) {
  // Implementation for identifying mood triggers
  return []; // Placeholder
}

function applyFilters(habits, moodData, filters) {
  // Implementation for applying filters
  return { habits, moodData }; // Placeholder
}

function generateInsights(data, options) {
  // Implementation for generating insights
  return []; // Placeholder
}

function generateSummary(data) {
  // Implementation for generating summary
  return {}; // Placeholder
}

function calculateCorrelation(habit, habitMoodEntries, moodData) {
  // Implementation for calculating correlation
  return {
    strength: 0.65,
    type: 'positive',
    confidence: 0.8
  }; // Placeholder
}

function analyzeTimePatterns(habitMoodEntries) {
  // Implementation for analyzing time patterns
  return {}; // Placeholder
}

function analyzeMoodPatterns(habitMoodEntries, moodData) {
  // Implementation for analyzing mood patterns
  return {}; // Placeholder
}

function buildPredictiveModel(habit, habitEntries, moodData) {
  // Implementation for building predictive model
  return {
    predictions: [],
    confidence: 0.75,
    factors: [],
    riskFactors: [],
    recommendations: []
  }; // Placeholder
}

function detectCyclicalPatterns(habits, habitMoodData) {
  // Implementation for detecting cyclical patterns
  return []; // Placeholder
}

function detectTriggerEvents(habits, moodData, habitMoodData) {
  // Implementation for detecting trigger events
  return []; // Placeholder
}

function detectHabitChains(habits, habitMoodData) {
  // Implementation for detecting habit chains
  return []; // Placeholder
}

function detectMoodCascades(moodData, habitMoodData) {
  // Implementation for detecting mood cascades
  return []; // Placeholder
}

function computeHabitStatistics(habits, habitMoodData) {
  // Implementation for computing habit statistics
  return {}; // Placeholder
}

function computeMoodStatistics(moodData) {
  // Implementation for computing mood statistics
  return {}; // Placeholder
}

function computeCorrelationStatistics(habits, moodData, habitMoodData) {
  // Implementation for computing correlation statistics
  return {}; // Placeholder
}

function computeTrendStatistics(habits, moodData, habitMoodData) {
  // Implementation for computing trend statistics
  return {}; // Placeholder
}

function computePerformanceStatistics(habits, habitMoodData) {
  // Implementation for computing performance statistics
  return {}; // Placeholder
}

function processChunk(chunk, filters) {
  // Implementation for processing data chunk
  return chunk; // Placeholder
}

function combineChunks(processedChunks) {
  // Implementation for combining processed chunks
  return {}; // Placeholder
}

function getMemoryUsage() {
  // Implementation for getting memory usage
  return 0; // Placeholder
}

function generateHabitInsights(habit, habitMoodData, moodData) {
  // Implementation for generating habit insights
  return []; // Placeholder
}

function generateMoodInsights(moodData, habitMoodData) {
  // Implementation for generating mood insights
  return []; // Placeholder
}

function generateCrossPatternInsights(habits, moodData, habitMoodData) {
  // Implementation for generating cross-pattern insights
  return []; // Placeholder
}

function computeHabitTrend(habit, timeRange) {
  // Implementation for computing habit trend
  return {}; // Placeholder
}

function computeMoodTrends(moodData, timeRange) {
  // Implementation for computing mood trends
  return []; // Placeholder
}

function computeCorrelationTrends(habits, moodData, timeRange) {
  // Implementation for computing correlation trends
  return []; // Placeholder
}

function computePerformanceTrends(habits, timeRange) {
  // Implementation for computing performance trends
  return []; // Placeholder
}

function detectAnomalies(metrics, baseline) {
  // Implementation for detecting anomalies
  return []; // Placeholder
}

function generateRecommendations(analysis) {
  // Implementation for generating recommendations
  return []; // Placeholder
} 