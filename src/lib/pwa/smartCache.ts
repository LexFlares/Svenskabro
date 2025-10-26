export interface CacheStrategy {
  name: string;
  maxAge: number;
  maxEntries: number;
  priority: number;
}

export interface CachedResource {
  url: string;
  data: any;
  timestamp: number;
  accessCount: number;
  lastAccessed: number;
  size: number;
  strategy: string;
}

export class SmartCacheService {
  private cache: Map<string, CachedResource> = new Map();
  private strategies: Map<string, CacheStrategy> = new Map();
  private maxCacheSize = 50 * 1024 * 1024;
  private currentCacheSize = 0;
  private predictionModel: Map<string, number> = new Map();

  constructor() {
    this.initializeStrategies();
    this.loadCacheFromStorage();
    this.startPredictivePreloading();
  }

  private initializeStrategies() {
    this.strategies.set('critical', {
      name: 'critical',
      maxAge: 24 * 60 * 60 * 1000,
      maxEntries: 100,
      priority: 10
    });

    this.strategies.set('frequent', {
      name: 'frequent',
      maxAge: 6 * 60 * 60 * 1000,
      maxEntries: 50,
      priority: 8
    });

    this.strategies.set('static', {
      name: 'static',
      maxAge: 7 * 24 * 60 * 60 * 1000,
      maxEntries: 200,
      priority: 5
    });

    this.strategies.set('temporary', {
      name: 'temporary',
      maxAge: 30 * 60 * 1000,
      maxEntries: 20,
      priority: 3
    });
  }

  async get(url: string): Promise<any> {
    const cached = this.cache.get(url);

    if (!cached) {
      return null;
    }

    const strategy = this.strategies.get(cached.strategy);
    if (!strategy) return null;

    const age = Date.now() - cached.timestamp;
    if (age > strategy.maxAge) {
      this.cache.delete(url);
      this.currentCacheSize -= cached.size;
      return null;
    }

    cached.accessCount++;
    cached.lastAccessed = Date.now();

    this.updatePredictionModel(url);

    return cached.data;
  }

  async set(url: string, data: any, strategy: string = 'temporary'): Promise<void> {
    const size = this.estimateSize(data);

    if (size > this.maxCacheSize * 0.1) {
      console.warn('Resource too large to cache:', url, size);
      return;
    }

    while (this.currentCacheSize + size > this.maxCacheSize) {
      this.evictLeastValuable();
    }

    const resource: CachedResource = {
      url,
      data,
      timestamp: Date.now(),
      accessCount: 1,
      lastAccessed: Date.now(),
      size,
      strategy
    };

    this.cache.set(url, resource);
    this.currentCacheSize += size;

    await this.persistToStorage();
  }

  async preloadBridge(bridgeId: string): Promise<void> {
    console.log('🔄 Preloading bridge data:', bridgeId);

    const endpoints = [
      `/api/bridges/${bridgeId}`,
      `/api/jobs?bridge_id=${bridgeId}`,
      `/api/deviations?bridge_id=${bridgeId}`
    ];

    await Promise.all(
      endpoints.map(async endpoint => {
        try {
          const response = await fetch(endpoint);
          const data = await response.json();
          await this.set(endpoint, data, 'frequent');
        } catch (error) {
          console.error('Failed to preload:', endpoint, error);
        }
      })
    );

    console.log('✅ Bridge data preloaded');
  }

  async preloadUserData(userId: string): Promise<void> {
    console.log('🔄 Preloading user data:', userId);

    const endpoints = [
      `/api/users/${userId}/profile`,
      `/api/users/${userId}/jobs`,
      `/api/users/${userId}/contacts`
    ];

    await Promise.all(
      endpoints.map(async endpoint => {
        try {
          const response = await fetch(endpoint);
          const data = await response.json();
          await this.set(endpoint, data, 'critical');
        } catch (error) {
          console.error('Failed to preload:', endpoint, error);
        }
      })
    );

    console.log('✅ User data preloaded');
  }

  private startPredictivePreloading() {
    if (typeof window === 'undefined') return;

    let navigationHistory: string[] = [];
    let currentPath = '';

    const observer = () => {
      const newPath = window.location.pathname;
      if (newPath !== currentPath) {
        navigationHistory.push(newPath);
        if (navigationHistory.length > 10) {
          navigationHistory.shift();
        }

        this.analyzePatternsAndPreload(navigationHistory);
        currentPath = newPath;
      }
    };

    if ('navigation' in window) {
      (window as any).navigation.addEventListener('navigate', observer);
    } else {
      window.addEventListener('popstate', observer);
    }

    setInterval(() => {
      this.predictAndPreload();
    }, 60000);
  }

  private analyzePatternsAndPreload(history: string[]) {
    if (history.length < 3) return;

    const patterns = new Map<string, string[]>();

    for (let i = 0; i < history.length - 1; i++) {
      const current = history[i];
      const next = history[i + 1];

      if (!patterns.has(current)) {
        patterns.set(current, []);
      }
      patterns.get(current)!.push(next);
    }

    const currentPage = history[history.length - 1];
    const likelyNext = patterns.get(currentPage);

    if (likelyNext && likelyNext.length > 0) {
      const mostLikely = this.getMostFrequent(likelyNext);
      this.preloadPage(mostLikely);
    }
  }

  private getMostFrequent(array: string[]): string {
    const frequency = new Map<string, number>();
    array.forEach(item => {
      frequency.set(item, (frequency.get(item) || 0) + 1);
    });

    let maxCount = 0;
    let mostFrequent = array[0];

    frequency.forEach((count, item) => {
      if (count > maxCount) {
        maxCount = count;
        mostFrequent = item;
      }
    });

    return mostFrequent;
  }

  private async preloadPage(path: string) {
    console.log('🔮 Predictively preloading:', path);

    const dataEndpoints = this.getDataEndpointsForPath(path);

    for (const endpoint of dataEndpoints) {
      try {
        const response = await fetch(endpoint);
        const data = await response.json();
        await this.set(endpoint, data, 'temporary');
      } catch (error) {
        console.error('Predictive preload failed:', endpoint);
      }
    }
  }

  private getDataEndpointsForPath(path: string): string[] {
    const endpoints: string[] = [];

    if (path.includes('/bridges')) {
      endpoints.push('/api/bridges');
    } else if (path.includes('/jobs')) {
      endpoints.push('/api/jobs');
    } else if (path.includes('/traffic')) {
      endpoints.push('/api/traffic/situations');
    } else if (path.includes('/contacts')) {
      endpoints.push('/api/contacts');
    } else if (path.includes('/documents')) {
      endpoints.push('/api/documents');
    }

    return endpoints;
  }

  private async predictAndPreload() {
    const topPredicted = Array.from(this.predictionModel.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([url]) => url);

    for (const url of topPredicted) {
      if (!this.cache.has(url)) {
        try {
          const response = await fetch(url);
          const data = await response.json();
          await this.set(url, data, 'frequent');
        } catch (error) {
          console.error('Prediction-based preload failed:', url);
        }
      }
    }
  }

  private updatePredictionModel(url: string) {
    const currentScore = this.predictionModel.get(url) || 0;
    this.predictionModel.set(url, currentScore + 1);

    if (this.predictionModel.size > 100) {
      const lowest = Array.from(this.predictionModel.entries())
        .sort((a, b) => a[1] - b[1])
        .slice(0, 20)
        .map(([url]) => url);

      lowest.forEach(url => this.predictionModel.delete(url));
    }
  }

  private evictLeastValuable() {
    if (this.cache.size === 0) return;

    let leastValuable: CachedResource | null = null;
    let leastValue = Infinity;

    this.cache.forEach(resource => {
      const strategy = this.strategies.get(resource.strategy);
      if (!strategy) return;

      const age = Date.now() - resource.lastAccessed;
      const value = (resource.accessCount * strategy.priority) / (age + 1);

      if (value < leastValue) {
        leastValue = value;
        leastValuable = resource;
      }
    });

    if (leastValuable) {
      this.cache.delete(leastValuable.url);
      this.currentCacheSize -= leastValuable.size;
      console.log('🗑️ Evicted:', leastValuable.url);
    }
  }

  private estimateSize(data: any): number {
    const json = JSON.stringify(data);
    return new Blob([json]).size;
  }

  private async persistToStorage() {
    if (typeof window === 'undefined') return;

    const serialized = Array.from(this.cache.entries());
    const compressed = serialized.slice(0, 50);

    try {
      localStorage.setItem('smart_cache_v1', JSON.stringify(compressed));
    } catch (error) {
      console.warn('Failed to persist cache:', error);
    }
  }

  private loadCacheFromStorage() {
    if (typeof window === 'undefined') return;

    try {
      const stored = localStorage.getItem('smart_cache_v1');
      if (!stored) return;

      const data = JSON.parse(stored);
      data.forEach(([url, resource]: [string, CachedResource]) => {
        this.cache.set(url, resource);
        this.currentCacheSize += resource.size;
      });

      console.log('✅ Loaded cache from storage:', this.cache.size, 'entries');
    } catch (error) {
      console.error('Failed to load cache from storage:', error);
    }
  }

  clear(strategy?: string) {
    if (strategy) {
      Array.from(this.cache.entries()).forEach(([url, resource]) => {
        if (resource.strategy === strategy) {
          this.cache.delete(url);
          this.currentCacheSize -= resource.size;
        }
      });
    } else {
      this.cache.clear();
      this.currentCacheSize = 0;
    }

    this.persistToStorage();
    console.log('🗑️ Cache cleared');
  }

  getStats() {
    return {
      entries: this.cache.size,
      size: this.currentCacheSize,
      maxSize: this.maxCacheSize,
      utilizationPercent: (this.currentCacheSize / this.maxCacheSize) * 100,
      strategies: Array.from(this.strategies.keys())
    };
  }
}

export const smartCache = new SmartCacheService();
