// Hook for background analytics processing using Web Workers

import { useCallback, useRef, useState, useEffect } from 'react';
import { usePerformanceMonitoring } from './usePerformanceMonitoring';

interface BackgroundTask {
  id: string;
  type: string;
  status: 'pending' | 'processing' | 'completed' | 'error';
  progress?: number;
  result?: any;
  error?: string;
  startTime: number;
  endTime?: number;
}

interface UseBackgroundAnalyticsOptions {
  maxConcurrentTasks?: number;
  enableProgressTracking?: boolean;
  autoCleanup?: boolean;
  cleanupInterval?: number; // in milliseconds
}

interface UseBackgroundAnalyticsReturn {
  tasks: BackgroundTask[];
  processAnalytics: (type: string, data: any) => Promise<any>;
  processCorrelations: (habits: any[], moodData: any[], habitMoodData: any[]) => Promise<any>;
  processPredictions: (habits: any[], habitMoodData: any[], moodData: any[]) => Promise<any>;
  processPatterns: (habits: any[], moodData: any[], habitMoodData: any[]) => Promise<any>;
  processStatistics: (habits: any[], moodData: any[], habitMoodData: any[]) => Promise<any>;
  processLargeDataset: (dataset: any[], filters: any, options: any) => Promise<any>;
  generateInsights: (userId: string, habits: any[], moodData: any[], habitMoodData: any[]) => Promise<any>;
  computeTrends: (habits: any[], moodData: any[], timeRange: any) => Promise<any>;
  analyzePerformance: (metrics: any, baseline: any) => Promise<any>;
  cancelTask: (taskId: string) => void;
  cancelAllTasks: () => void;
  clearCompletedTasks: () => void;
  getTaskStatus: (taskId: string) => BackgroundTask | null;
  isProcessing: boolean;
  activeTaskCount: number;
}

// Web Worker instance
let analyticsWorker: Worker | null = null;

// Initialize Web Worker
const initializeWorker = (): Worker => {
  if (!analyticsWorker) {
    try {
      analyticsWorker = new Worker('/workers/analytics-worker.js');
      
      // Handle worker errors
      analyticsWorker.onerror = (error) => {
        console.error('Analytics worker error:', error);
      };
      
      // Handle worker message errors
      analyticsWorker.onmessageerror = (error) => {
        console.error('Analytics worker message error:', error);
      };
    } catch (error) {
      console.error('Failed to initialize analytics worker:', error);
      throw new Error('Web Workers are not supported in this environment');
    }
  }
  return analyticsWorker;
};

// Generate unique task ID
const generateTaskId = (): string => {
  return `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

export const useBackgroundAnalytics = (options: UseBackgroundAnalyticsOptions = {}): UseBackgroundAnalyticsReturn => {
  const {
    maxConcurrentTasks = 3,
    enableProgressTracking = true,
    autoCleanup = true,
    cleanupInterval = 300000 // 5 minutes
  } = options;

  const [tasks, setTasks] = useState<BackgroundTask[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const workerRef = useRef<Worker | null>(null);
  const taskQueueRef = useRef<string[]>([]);
  const { trackEvent, trackAnalyticsLoad } = usePerformanceMonitoring();

  // Initialize worker
  useEffect(() => {
    try {
      workerRef.current = initializeWorker();
      
      // Set up message handler
      workerRef.current.onmessage = (event) => {
        const { type, id, result, error, timestamp } = event.data;
        
        setTasks(prevTasks => {
          const taskIndex = prevTasks.findIndex(task => task.id === id);
          if (taskIndex === -1) return prevTasks;
          
          const updatedTasks = [...prevTasks];
          const task = { ...updatedTasks[taskIndex] };
          
          if (type === 'SUCCESS') {
            task.status = 'completed';
            task.result = result;
            task.endTime = timestamp;
            
            // Track successful completion
            trackEvent('background_analytics_success', timestamp - task.startTime, {
              taskType: task.type,
              resultSize: JSON.stringify(result).length
            });
            
          } else if (type === 'ERROR') {
            task.status = 'error';
            task.error = error;
            task.endTime = timestamp;
            
            // Track error
            trackEvent('background_analytics_error', timestamp - task.startTime, {
              taskType: task.type,
              error
            });
          }
          
          updatedTasks[taskIndex] = task;
          return updatedTasks;
        });
        
        // Process next task in queue
        processNextTask();
      };
      
    } catch (error) {
      console.error('Failed to initialize background analytics:', error);
    }
    
    return () => {
      if (workerRef.current) {
        workerRef.current.terminate();
        workerRef.current = null;
      }
    };
  }, [trackEvent]);

  // Auto-cleanup completed tasks
  useEffect(() => {
    if (!autoCleanup) return;
    
    const interval = setInterval(() => {
      setTasks(prevTasks => {
        const now = Date.now();
        return prevTasks.filter(task => {
          // Keep tasks that are still processing or completed recently (within 1 hour)
          if (task.status === 'processing' || task.status === 'pending') return true;
          if (task.status === 'completed' && (now - (task.endTime || 0)) < 3600000) return true;
          return false;
        });
      });
    }, cleanupInterval);
    
    return () => clearInterval(interval);
  }, [autoCleanup, cleanupInterval]);

  // Process next task in queue
  const processNextTask = useCallback(() => {
    if (!workerRef.current || taskQueueRef.current.length === 0) {
      setIsProcessing(false);
      return;
    }
    
    const activeTasks = tasks.filter(task => task.status === 'processing');
    if (activeTasks.length >= maxConcurrentTasks) return;
    
    const nextTaskId = taskQueueRef.current.shift();
    if (!nextTaskId) return;
    
    const task = tasks.find(t => t.id === nextTaskId);
    if (!task) return;
    
    // Update task status to processing
    setTasks(prevTasks => 
      prevTasks.map(t => 
        t.id === nextTaskId 
          ? { ...t, status: 'processing' as const }
          : t
      )
    );
    
    setIsProcessing(true);
    
    // Send task to worker
    workerRef.current!.postMessage({
      type: task.type,
      data: task.result, // The data is stored in result field during creation
      id: task.id
    });
  }, [tasks, maxConcurrentTasks]);

  // Add task to queue
  const addTask = useCallback((type: string, data: any): string => {
    const taskId = generateTaskId();
    const startTime = Date.now();
    
    const newTask: BackgroundTask = {
      id: taskId,
      type,
      status: 'pending',
      startTime,
      result: data // Store data in result field temporarily
    };
    
    setTasks(prevTasks => [...prevTasks, newTask]);
    taskQueueRef.current.push(taskId);
    
    // Track task creation
    trackEvent('background_analytics_task_created', 0, {
      taskType: type,
      dataSize: JSON.stringify(data).length
    });
    
    // Start processing if not already processing
    if (!isProcessing) {
      processNextTask();
    }
    
    return taskId;
  }, [isProcessing, processNextTask, trackEvent]);

  // Generic analytics processing function
  const processAnalytics = useCallback(async (type: string, data: any): Promise<any> => {
    return new Promise((resolve, reject) => {
      const taskId = addTask(type, data);
      
      // Set up result listener
      const checkResult = () => {
        const task = tasks.find(t => t.id === taskId);
        
        if (!task) {
          reject(new Error('Task not found'));
          return;
        }
        
        if (task.status === 'completed') {
          trackAnalyticsLoad(type, task.endTime! - task.startTime);
          resolve(task.result);
        } else if (task.status === 'error') {
          reject(new Error(task.error || 'Task failed'));
        } else {
          // Check again in 100ms
          setTimeout(checkResult, 100);
        }
      };
      
      checkResult();
    });
  }, [addTask, tasks, trackAnalyticsLoad]);

  // Specific analytics functions
  const processCorrelations = useCallback(async (habits: any[], moodData: any[], habitMoodData: any[]): Promise<any> => {
    return processAnalytics('COMPUTE_CORRELATIONS', { habits, moodData, habitMoodData });
  }, [processAnalytics]);

  const processPredictions = useCallback(async (habits: any[], habitMoodData: any[], moodData: any[]): Promise<any> => {
    return processAnalytics('GENERATE_PREDICTIONS', { habits, habitMoodData, moodData });
  }, [processAnalytics]);

  const processPatterns = useCallback(async (habits: any[], moodData: any[], habitMoodData: any[]): Promise<any> => {
    return processAnalytics('ANALYZE_PATTERNS', { habits, moodData, habitMoodData });
  }, [processAnalytics]);

  const processStatistics = useCallback(async (habits: any[], moodData: any[], habitMoodData: any[]): Promise<any> => {
    return processAnalytics('COMPUTE_STATISTICS', { habits, moodData, habitMoodData });
  }, [processAnalytics]);

  const processLargeDataset = useCallback(async (dataset: any[], filters: any, options: any): Promise<any> => {
    return processAnalytics('PROCESS_LARGE_DATASET', { dataset, filters, options });
  }, [processAnalytics]);

  const generateInsights = useCallback(async (userId: string, habits: any[], moodData: any[], habitMoodData: any[]): Promise<any> => {
    return processAnalytics('GENERATE_INSIGHTS', { userId, habits, moodData, habitMoodData });
  }, [processAnalytics]);

  const computeTrends = useCallback(async (habits: any[], moodData: any[], timeRange: any): Promise<any> => {
    return processAnalytics('COMPUTE_TRENDS', { habits, moodData, timeRange });
  }, [processAnalytics]);

  const analyzePerformance = useCallback(async (metrics: any, baseline: any): Promise<any> => {
    return processAnalytics('ANALYZE_PERFORMANCE', { metrics, baseline });
  }, [processAnalytics]);

  // Task management functions
  const cancelTask = useCallback((taskId: string) => {
    setTasks(prevTasks => 
      prevTasks.map(task => 
        task.id === taskId && task.status === 'pending'
          ? { ...task, status: 'error' as const, error: 'Cancelled by user' }
          : task
      )
    );
    
    // Remove from queue
    taskQueueRef.current = taskQueueRef.current.filter(id => id !== taskId);
    
    trackEvent('background_analytics_task_cancelled', 0, { taskId });
  }, [trackEvent]);

  const cancelAllTasks = useCallback(() => {
    setTasks(prevTasks => 
      prevTasks.map(task => 
        task.status === 'pending' || task.status === 'processing'
          ? { ...task, status: 'error' as const, error: 'Cancelled by user' }
          : task
      )
    );
    
    taskQueueRef.current = [];
    setIsProcessing(false);
    
    trackEvent('background_analytics_all_tasks_cancelled', 0, {});
  }, [trackEvent]);

  const clearCompletedTasks = useCallback(() => {
    setTasks(prevTasks => 
      prevTasks.filter(task => 
        task.status === 'pending' || task.status === 'processing'
      )
    );
    
    trackEvent('background_analytics_completed_tasks_cleared', 0, {});
  }, [trackEvent]);

  const getTaskStatus = useCallback((taskId: string): BackgroundTask | null => {
    return tasks.find(task => task.id === taskId) || null;
  }, [tasks]);

  const activeTaskCount = tasks.filter(task => 
    task.status === 'pending' || task.status === 'processing'
  ).length;

  return {
    tasks,
    processAnalytics,
    processCorrelations,
    processPredictions,
    processPatterns,
    processStatistics,
    processLargeDataset,
    generateInsights,
    computeTrends,
    analyzePerformance,
    cancelTask,
    cancelAllTasks,
    clearCompletedTasks,
    getTaskStatus,
    isProcessing,
    activeTaskCount
  };
};

// Hook for specific analytics types
export const useBackgroundCorrelations = () => {
  const { processCorrelations, isProcessing, tasks } = useBackgroundAnalytics();
  
  const correlationTasks = tasks.filter(task => task.type === 'COMPUTE_CORRELATIONS');
  
  return {
    processCorrelations,
    isProcessing: isProcessing && correlationTasks.some(task => task.status === 'processing'),
    tasks: correlationTasks
  };
};

export const useBackgroundPredictions = () => {
  const { processPredictions, isProcessing, tasks } = useBackgroundAnalytics();
  
  const predictionTasks = tasks.filter(task => task.type === 'GENERATE_PREDICTIONS');
  
  return {
    processPredictions,
    isProcessing: isProcessing && predictionTasks.some(task => task.status === 'processing'),
    tasks: predictionTasks
  };
};

export const useBackgroundPatterns = () => {
  const { processPatterns, isProcessing, tasks } = useBackgroundAnalytics();
  
  const patternTasks = tasks.filter(task => task.type === 'ANALYZE_PATTERNS');
  
  return {
    processPatterns,
    isProcessing: isProcessing && patternTasks.some(task => task.status === 'processing'),
    tasks: patternTasks
  };
}; 