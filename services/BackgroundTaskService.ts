import { AppState, AppStateStatus, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface BackgroundTask {
  id: string;
  type: 'sync' | 'cleanup' | 'analytics' | 'notification';
  priority: 'low' | 'normal' | 'high' | 'critical';
  execute: () => Promise<void>;
  retryCount: number;
  maxRetries: number;
  lastExecuted: number;
  nextExecution: number;
}

interface BackgroundTaskServiceConfig {
  maxConcurrentTasks?: number;
  taskTimeout?: number;
  retryDelay?: number;
  enableBatching?: boolean;
  batchSize?: number;
  batchTimeout?: number;
}

class BackgroundTaskService {
  private static instance: BackgroundTaskService;
  private tasks: Map<string, BackgroundTask> = new Map();
  private isRunning = false;
  private currentTasks: Set<string> = new Set();
  private appState: AppStateStatus = AppState.currentState;
  private config: Required<BackgroundTaskServiceConfig>;

  private constructor() {
    this.config = {
      maxConcurrentTasks: 3,
      taskTimeout: 30000, // 30 seconds
      retryDelay: 5000, // 5 seconds
      enableBatching: true,
      batchSize: 5,
      batchTimeout: 1000, // 1 second
    };

    this.setupAppStateListener();
  }

  static getInstance(): BackgroundTaskService {
    if (!BackgroundTaskService.instance) {
      BackgroundTaskService.instance = new BackgroundTaskService();
    }
    return BackgroundTaskService.instance;
  }

  configure(config: BackgroundTaskServiceConfig): void {
    this.config = { ...this.config, ...config };
  }

  private setupAppStateListener(): void {
    AppState.addEventListener('change', this.handleAppStateChange);
  }

  private handleAppStateChange = (nextAppState: AppStateStatus): void => {
    const wasActive = this.appState === 'active';
    const isActive = nextAppState === 'active';
    
    this.appState = nextAppState;

    if (wasActive && !isActive) {
      // App going to background - pause non-critical tasks
      this.pauseNonCriticalTasks();
    } else if (!wasActive && isActive) {
      // App coming to foreground - resume tasks
      this.resumeTasks();
    }
  };

  private pauseNonCriticalTasks(): void {
    // Pause low and normal priority tasks
    this.tasks.forEach((task) => {
      if (task.priority === 'low' || task.priority === 'normal') {
        // Mark for later execution
        task.nextExecution = Date.now() + this.config.retryDelay;
      }
    });
  }

  private resumeTasks(): void {
    // Resume paused tasks
    this.processTasks();
  }

  addTask(task: Omit<BackgroundTask, 'retryCount' | 'lastExecuted' | 'nextExecution'>): void {
    const fullTask: BackgroundTask = {
      ...task,
      retryCount: 0,
      lastExecuted: 0,
      nextExecution: Date.now(),
    };

    this.tasks.set(task.id, fullTask);
    this.processTasks();
  }

  removeTask(taskId: string): void {
    this.tasks.delete(taskId);
  }

  private async processTasks(): Promise<void> {
    if (this.isRunning || this.currentTasks.size >= this.config.maxConcurrentTasks) {
      return;
    }

    this.isRunning = true;

    try {
      const readyTasks = Array.from(this.tasks.values())
        .filter(task => 
          task.nextExecution <= Date.now() &&
          !this.currentTasks.has(task.id)
        )
        .sort((a, b) => {
          // Sort by priority, then by next execution time
          const priorityOrder = { critical: 0, high: 1, normal: 2, low: 3 };
          const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
          if (priorityDiff !== 0) return priorityDiff;
          return a.nextExecution - b.nextExecution;
        });

      if (this.config.enableBatching && readyTasks.length > this.config.batchSize) {
        // Process tasks in batches
        const batches = this.createBatches(readyTasks, this.config.batchSize);
        for (const batch of batches) {
          await this.processBatch(batch);
          await this.delay(this.config.batchTimeout);
        }
      } else {
        // Process tasks individually
        for (const task of readyTasks.slice(0, this.config.maxConcurrentTasks - this.currentTasks.size)) {
          this.executeTask(task);
        }
      }
    } finally {
      this.isRunning = false;
    }
  }

  private createBatches<T>(items: T[], batchSize: number): T[][] {
    const batches: T[][] = [];
    for (let i = 0; i < items.length; i += batchSize) {
      batches.push(items.slice(i, i + batchSize));
    }
    return batches;
  }

  private async processBatch(tasks: BackgroundTask[]): Promise<void> {
    const promises = tasks.map(task => this.executeTask(task));
    await Promise.allSettled(promises);
  }

  private async executeTask(task: BackgroundTask): Promise<void> {
    if (this.currentTasks.has(task.id)) {
      return;
    }

    this.currentTasks.add(task.id);
    task.lastExecuted = Date.now();

    try {
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Task timeout')), this.config.taskTimeout);
      });

      await Promise.race([task.execute(), timeoutPromise]);
      
      // Task completed successfully
      this.tasks.delete(task.id);
      console.log(`✅ Background task completed: ${task.id}`);
    } catch (error) {
      console.error(`❌ Background task failed: ${task.id}`, error);
      
      // Handle retry logic
      if (task.retryCount < task.maxRetries) {
        task.retryCount++;
        task.nextExecution = Date.now() + this.config.retryDelay * task.retryCount;
        console.log(`🔄 Retrying task: ${task.id} (${task.retryCount}/${task.maxRetries})`);
      } else {
        // Max retries reached, remove task
        this.tasks.delete(task.id);
        console.error(`💀 Task failed permanently: ${task.id}`);
      }
    } finally {
      this.currentTasks.delete(task.id);
      this.processTasks(); // Process next batch
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  getTaskStats(): {
    total: number;
    running: number;
    queued: number;
    byPriority: Record<string, number>;
  } {
    const byPriority: Record<string, number> = {};
    
    this.tasks.forEach(task => {
      byPriority[task.priority] = (byPriority[task.priority] || 0) + 1;
    });

    return {
      total: this.tasks.size,
      running: this.currentTasks.size,
      queued: this.tasks.size - this.currentTasks.size,
      byPriority,
    };
  }

  clearAllTasks(): void {
    this.tasks.clear();
    this.currentTasks.clear();
  }

  // Cleanup on app termination
  cleanup(): void {
    // Note: AppState.removeEventListener is deprecated in newer React Native versions
    // The listener will be automatically cleaned up when the app terminates
    this.clearAllTasks();
  }
}

export default BackgroundTaskService;
