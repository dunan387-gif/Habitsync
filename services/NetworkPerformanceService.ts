import { Platform } from 'react-native';
import { useNetworkOptimization } from '@/hooks/useNetworkOptimization';
import AdvancedCacheService from './AdvancedCacheService';

interface NetworkRequest {
  id: string;
  url: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  headers?: Record<string, string>;
  body?: any;
  priority: 'low' | 'normal' | 'high' | 'critical';
  timeout?: number;
  retries?: number;
  cacheable?: boolean;
  cacheTTL?: number;
}

interface NetworkResponse<T = any> {
  data: T;
  status: number;
  headers: Record<string, string>;
  responseTime: number;
  cached: boolean;
  retryCount: number;
}

interface ConnectionPool {
  id: string;
  host: string;
  maxConnections: number;
  currentConnections: number;
  requests: NetworkRequest[];
  lastUsed: number;
}

interface NetworkPerformanceConfig {
  maxConcurrentRequests: number;
  connectionPoolSize: number;
  requestTimeout: number;
  retryAttempts: number;
  retryDelay: number;
  enableCompression: boolean;
  enableCaching: boolean;
  cacheTTL: number;
  enableRequestPrioritization: boolean;
  enableConnectionPooling: boolean;
  enableRequestBatching: boolean;
  batchSize: number;
  batchTimeout: number;
}

interface NetworkStats {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  averageResponseTime: number;
  cacheHitRate: number;
  connectionPoolUtilization: number;
  bandwidthUsage: number;
  errorRate: number;
}

class NetworkPerformanceService {
  private static instance: NetworkPerformanceService;
  private config: NetworkPerformanceConfig;
  private connectionPools: Map<string, ConnectionPool> = new Map();
  private requestQueue: NetworkRequest[] = [];
  private activeRequests: Map<string, NetworkRequest> = new Map();
  private stats: {
    totalRequests: number;
    successfulRequests: number;
    failedRequests: number;
    totalResponseTime: number;
    cacheHits: number;
    cacheMisses: number;
    totalBandwidth: number;
  };
  private cacheService: AdvancedCacheService;

  private constructor() {
    this.config = {
      maxConcurrentRequests: 6,
      connectionPoolSize: 10,
      requestTimeout: 30000,
      retryAttempts: 3,
      retryDelay: 1000,
      enableCompression: true,
      enableCaching: true,
      cacheTTL: 300000, // 5 minutes
      enableRequestPrioritization: true,
      enableConnectionPooling: true,
      enableRequestBatching: true,
      batchSize: 5,
      batchTimeout: 100,
    };

    this.stats = {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      totalResponseTime: 0,
      cacheHits: 0,
      cacheMisses: 0,
      totalBandwidth: 0,
    };

    this.cacheService = AdvancedCacheService.getInstance();
    this.initializeService();
  }

  static getInstance(): NetworkPerformanceService {
    if (!NetworkPerformanceService.instance) {
      NetworkPerformanceService.instance = new NetworkPerformanceService();
    }
    return NetworkPerformanceService.instance;
  }

  configure(config: Partial<NetworkPerformanceConfig>): void {
    this.config = { ...this.config, ...config };
  }

  private initializeService(): void {
    // Platform-specific optimizations
    if (Platform.OS === 'android') {
      this.config.maxConcurrentRequests = 4; // Lower for Android
      this.config.connectionPoolSize = 6;
      this.config.requestTimeout = 45000; // Longer timeout for Android
    } else if (Platform.OS === 'ios') {
      this.config.maxConcurrentRequests = 8; // Higher for iOS
      this.config.connectionPoolSize = 12;
      this.config.requestTimeout = 25000;
    }

    // Initialize connection pools
    this.initializeConnectionPools();
  }

  private initializeConnectionPools(): void {
    const commonHosts = [
      'api.habitsyncer.com',
      'firebase.googleapis.com',
      'supabase.co',
    ];

    commonHosts.forEach(host => {
      this.connectionPools.set(host, {
        id: host,
        host,
        maxConnections: this.config.connectionPoolSize,
        currentConnections: 0,
        requests: [],
        lastUsed: Date.now(),
      });
    });
  }

  private getConnectionPool(host: string): ConnectionPool {
    let pool = this.connectionPools.get(host);
    if (!pool) {
      pool = {
        id: host,
        host,
        maxConnections: this.config.connectionPoolSize,
        currentConnections: 0,
        requests: [],
        lastUsed: Date.now(),
      };
      this.connectionPools.set(host, pool);
    }
    return pool;
  }

  private canMakeRequest(pool: ConnectionPool): boolean {
    return pool.currentConnections < pool.maxConnections &&
           this.activeRequests.size < this.config.maxConcurrentRequests;
  }

  private async executeRequest(request: NetworkRequest): Promise<NetworkResponse> {
    const startTime = Date.now();
    const host = new URL(request.url).hostname;
    const pool = this.getConnectionPool(host);

    // Check cache first
    if (this.config.enableCaching && request.cacheable !== false) {
      const cacheKey = this.generateCacheKey(request);
      const cachedData = await this.cacheService.get(cacheKey);
      if (cachedData) {
        this.stats.cacheHits++;
        return {
          data: cachedData,
          status: 200,
          headers: { 'x-cache': 'HIT' },
          responseTime: 0,
          cached: true,
          retryCount: 0,
        };
      }
      this.stats.cacheMisses++;
    }

    // Wait for available connection
    while (!this.canMakeRequest(pool)) {
      await this.delay(100);
    }

    // Acquire connection
    pool.currentConnections++;
    this.activeRequests.set(request.id, request);

    try {
      // Execute the actual request
      const response = await this.performRequest(request);
      
      // Cache successful responses
      if (this.config.enableCaching && request.cacheable !== false && response.status === 200) {
        const cacheKey = this.generateCacheKey(request);
        const ttl = request.cacheTTL || this.config.cacheTTL;
        await this.cacheService.set(cacheKey, response.data, ttl);
      }

      // Update stats
      const responseTime = Date.now() - startTime;
      this.stats.totalRequests++;
      this.stats.successfulRequests++;
      this.stats.totalResponseTime += responseTime;
      this.stats.totalBandwidth += this.estimateBandwidth(request, response);

      return {
        ...response,
        responseTime,
        cached: false,
        retryCount: 0,
      };
    } catch (error) {
      // Handle retries
      const retryCount = 0;
      const maxRetries = request.retries || this.config.retryAttempts;
      
      if (retryCount < maxRetries) {
        await this.delay(this.config.retryDelay * (retryCount + 1));
        return this.executeRequest(request);
      }

      // Update error stats
      this.stats.totalRequests++;
      this.stats.failedRequests++;
      
      throw error;
    } finally {
      // Release connection
      pool.currentConnections--;
      this.activeRequests.delete(request.id);
      pool.lastUsed = Date.now();
    }
  }

  private async performRequest(request: NetworkRequest): Promise<Omit<NetworkResponse, 'responseTime' | 'cached' | 'retryCount'>> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      ...request.headers,
    };

    if (this.config.enableCompression) {
      headers['Accept-Encoding'] = 'gzip, deflate';
    }

    const fetchOptions: RequestInit = {
      method: request.method,
      headers,
    };

    if (request.body && request.method !== 'GET') {
      fetchOptions.body = JSON.stringify(request.body);
    }

    // Handle timeout manually since it's not supported in RequestInit
    const timeout = request.timeout || this.config.requestTimeout;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(request.url, {
        ...fetchOptions,
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      const data = await response.json();

      return {
        data,
        status: response.status,
        headers: Object.fromEntries(response.headers.entries()),
      };
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  }

  private generateCacheKey(request: NetworkRequest): string {
    const { method, url, body } = request;
    const bodyHash = body ? JSON.stringify(body) : '';
    return `network_${method}_${url}_${bodyHash}`;
  }

  private estimateBandwidth(request: NetworkRequest, response: any): number {
    const requestSize = JSON.stringify(request.body || {}).length;
    const responseSize = JSON.stringify(response.data || {}).length;
    return requestSize + responseSize;
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async makeRequest<T>(request: Omit<NetworkRequest, 'id'>): Promise<NetworkResponse<T>> {
    const fullRequest: NetworkRequest = {
      ...request,
      id: this.generateRequestId(),
      priority: request.priority || 'normal',
      cacheable: request.cacheable ?? true,
    };

    // Add to queue with prioritization
    if (this.config.enableRequestPrioritization) {
      this.addToPriorityQueue(fullRequest);
    } else {
      this.requestQueue.push(fullRequest);
    }

    // Process queue
    return this.processQueue();
  }

  private addToPriorityQueue(request: NetworkRequest): void {
    const priorityOrder = { critical: 0, high: 1, normal: 2, low: 3 };
    
    let insertIndex = this.requestQueue.length;
    for (let i = 0; i < this.requestQueue.length; i++) {
      const currentPriority = priorityOrder[this.requestQueue[i].priority];
      const newPriority = priorityOrder[request.priority];
      
      if (newPriority < currentPriority) {
        insertIndex = i;
        break;
      }
    }
    
    this.requestQueue.splice(insertIndex, 0, request);
  }

  private async processQueue(): Promise<NetworkResponse> {
    if (this.requestQueue.length === 0) {
      throw new Error('No requests in queue');
    }

    const request = this.requestQueue.shift()!;
    return this.executeRequest(request);
  }

  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  async batchRequests(requests: Omit<NetworkRequest, 'id'>[]): Promise<NetworkResponse[]> {
    if (!this.config.enableRequestBatching) {
      // Execute requests individually
      return Promise.all(requests.map(req => this.makeRequest(req)));
    }

    const batches: NetworkRequest[][] = [];
    for (let i = 0; i < requests.length; i += this.config.batchSize) {
      const batch = requests.slice(i, i + this.config.batchSize).map(req => ({
        ...req,
        id: this.generateRequestId(),
        priority: req.priority || 'normal',
        cacheable: req.cacheable ?? true,
      }));
      batches.push(batch);
    }

    const results: NetworkResponse[] = [];
    for (const batch of batches) {
      const batchResults = await Promise.all(
        batch.map(req => this.executeRequest(req))
      );
      results.push(...batchResults);
      
      // Add delay between batches
      if (batches.indexOf(batch) < batches.length - 1) {
        await this.delay(this.config.batchTimeout);
      }
    }

    return results;
  }

  getStats(): NetworkStats {
    const totalRequests = this.stats.totalRequests;
    const cacheHitRate = totalRequests > 0 
      ? this.stats.cacheHits / (this.stats.cacheHits + this.stats.cacheMisses)
      : 0;
    const averageResponseTime = totalRequests > 0
      ? this.stats.totalResponseTime / totalRequests
      : 0;
    const errorRate = totalRequests > 0
      ? this.stats.failedRequests / totalRequests
      : 0;

    // Calculate connection pool utilization
    let totalConnections = 0;
    let usedConnections = 0;
    this.connectionPools.forEach(pool => {
      totalConnections += pool.maxConnections;
      usedConnections += pool.currentConnections;
    });
    const connectionPoolUtilization = totalConnections > 0
      ? usedConnections / totalConnections
      : 0;

    return {
      totalRequests,
      successfulRequests: this.stats.successfulRequests,
      failedRequests: this.stats.failedRequests,
      averageResponseTime,
      cacheHitRate,
      connectionPoolUtilization,
      bandwidthUsage: this.stats.totalBandwidth,
      errorRate,
    };
  }

  clearCache(): Promise<void> {
    return this.cacheService.clear();
  }

  // Platform-specific optimizations
  optimizeForPlatform(): void {
    if (Platform.OS === 'android') {
      // Android-specific network optimizations
      this.config.maxConcurrentRequests = 4;
      this.config.connectionPoolSize = 6;
      this.config.requestTimeout = 45000;
      this.config.retryAttempts = 4; // More retries for Android
    } else if (Platform.OS === 'ios') {
      // iOS-specific network optimizations
      this.config.maxConcurrentRequests = 8;
      this.config.connectionPoolSize = 12;
      this.config.requestTimeout = 25000;
      this.config.enableCompression = true;
    }
  }

  // Memory pressure handling
  handleMemoryPressure(): void {
    console.log('🔄 Handling memory pressure - clearing network cache');
    this.clearCache();
    this.requestQueue = [];
    this.activeRequests.clear();
  }
}

export default NetworkPerformanceService;
