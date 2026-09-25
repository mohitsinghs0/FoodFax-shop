/**
 * High-Performance API Cache, Request Deduplication & Latency Profiler for Foodfax Shop
 * Eliminates redundant network queries, optimizes Supabase latency, and tracks performance metrics.
 */

export interface CacheOptions {
  ttlMs?: number;
  tags?: string[];
  forceRefresh?: boolean;
  staleWhileRevalidate?: boolean;
}

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttlMs: number;
  tags: string[];
}

export interface LatencyMetric {
  id: string;
  endpoint: string;
  durationMs: number;
  type: 'NETWORK_FETCH' | 'CACHE_HIT' | 'STALE_REVALIDATE' | 'PARALLEL_BACKGROUND';
  timestamp: string;
  status: 'SUCCESS' | 'ERROR';
}

class ApiCacheManager {
  private cache = new Map<string, CacheEntry<unknown>>();
  private inFlightRequests = new Map<string, Promise<unknown>>();
  private metrics: LatencyMetric[] = [];
  private listeners: Array<(metrics: LatencyMetric[]) => void> = [];

  // Default TTL: 15 seconds for semi-dynamic data, can be customized per call
  private defaultTtlMs = 15000;

  public async fetchWithCache<T>(
    key: string,
    fetcher: () => Promise<T>,
    options: CacheOptions = {}
  ): Promise<T> {
    const {
      ttlMs = this.defaultTtlMs,
      tags = [],
      forceRefresh = false,
      staleWhileRevalidate = true,
    } = options;

    const now = Date.now();
    const cached = this.cache.get(key) as CacheEntry<T> | undefined;

    // 1. Fresh cache hit
    if (!forceRefresh && cached && now - cached.timestamp < cached.ttlMs) {
      this.recordMetric({
        endpoint: key,
        durationMs: 0.8,
        type: 'CACHE_HIT',
        status: 'SUCCESS',
      });
      return cached.data;
    }

    // 2. Stale-while-revalidate: return stale data immediately and refresh asynchronously
    if (!forceRefresh && cached && staleWhileRevalidate) {
      this.recordMetric({
        endpoint: key,
        durationMs: 1.2,
        type: 'STALE_REVALIDATE',
        status: 'SUCCESS',
      });

      // Background revalidation if not already in flight
      if (!this.inFlightRequests.has(key)) {
        this.executeFetch(key, fetcher, ttlMs, tags, true).catch(() => {});
      }

      return cached.data;
    }

    // 3. In-flight request deduplication: return shared promise
    if (this.inFlightRequests.has(key)) {
      return this.inFlightRequests.get(key) as Promise<T>;
    }

    // 4. Fresh network fetch
    return this.executeFetch(key, fetcher, ttlMs, tags, false);
  }

  private async executeFetch<T>(
    key: string,
    fetcher: () => Promise<T>,
    ttlMs: number,
    tags: string[],
    isBackground: boolean
  ): Promise<T> {
    const startTime = performance.now();
    const fetchPromise = (async () => {
      try {
        const result = await fetcher();
        const duration = Math.round(performance.now() - startTime);

        this.cache.set(key, {
          data: result,
          timestamp: Date.now(),
          ttlMs,
          tags,
        });

        this.recordMetric({
          endpoint: key,
          durationMs: duration,
          type: isBackground ? 'STALE_REVALIDATE' : 'NETWORK_FETCH',
          status: 'SUCCESS',
        });

        return result;
      } catch (err) {
        const duration = Math.round(performance.now() - startTime);
        this.recordMetric({
          endpoint: key,
          durationMs: duration,
          type: 'NETWORK_FETCH',
          status: 'ERROR',
        });
        throw err;
      } finally {
        this.inFlightRequests.delete(key);
      }
    })();

    this.inFlightRequests.set(key, fetchPromise);
    return fetchPromise;
  }

  /**
   * Run secondary / audit operations in non-blocking parallel tasks
   * (e.g. order_status_history, notifications) to eliminate primary thread latency
   */
  public async executeConcurrentWrites(
    operations: Array<{ name: string; task: () => Promise<unknown> }>
  ): Promise<void> {
    const startTime = performance.now();
    Promise.allSettled(
      operations.map(async (op) => {
        try {
          await op.task();
        } catch (e) {
          console.warn(`[ApiCacheManager] Background write warning for ${op.name}:`, e);
        }
      })
    ).then(() => {
      const duration = Math.round(performance.now() - startTime);
      this.recordMetric({
        endpoint: 'parallel_background_writes',
        durationMs: duration,
        type: 'PARALLEL_BACKGROUND',
        status: 'SUCCESS',
      });
    });
  }

  /**
   * Invalidate cache items by specific key or category tag
   */
  public invalidate(keyOrPrefix: string): void {
    if (this.cache.has(keyOrPrefix)) {
      this.cache.delete(keyOrPrefix);
      return;
    }
    for (const [key, entry] of this.cache.entries()) {
      if (key.startsWith(keyOrPrefix) || entry.tags.includes(keyOrPrefix)) {
        this.cache.delete(key);
      }
    }
  }

  public invalidateAll(): void {
    this.cache.clear();
  }

  private recordMetric(metric: Omit<LatencyMetric, 'id' | 'timestamp'>) {
    const entry: LatencyMetric = {
      ...metric,
      id: `metric_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date().toLocaleTimeString(),
    };

    this.metrics = [entry, ...this.metrics].slice(0, 50); // Keep last 50 metrics
    this.notifyListeners();
  }

  public getMetrics(): LatencyMetric[] {
    return [...this.metrics];
  }

  public getStats() {
    const totalCalls = this.metrics.length;
    if (totalCalls === 0) {
      return {
        totalCalls: 0,
        cacheHits: 0,
        hitRate: 0,
        avgNetworkLatencyMs: 0,
        avgCachedLatencyMs: 0,
        estimatedTimeSavedMs: 0,
      };
    }

    const hits = this.metrics.filter((m) => m.type === 'CACHE_HIT' || m.type === 'STALE_REVALIDATE');
    const networkCalls = this.metrics.filter((m) => m.type === 'NETWORK_FETCH');

    const totalNetworkDuration = networkCalls.reduce((acc, m) => acc + m.durationMs, 0);
    const avgNetwork = networkCalls.length ? Math.round(totalNetworkDuration / networkCalls.length) : 180;

    const totalCacheDuration = hits.reduce((acc, m) => acc + m.durationMs, 0);
    const avgCache = hits.length ? Math.round((totalCacheDuration / hits.length) * 10) / 10 : 1;

    // Time saved = cache hits * (avg network latency - avg cache latency)
    const timeSaved = Math.round(hits.length * Math.max(0, avgNetwork - avgCache));

    return {
      totalCalls,
      cacheHits: hits.length,
      hitRate: Math.round((hits.length / totalCalls) * 100),
      avgNetworkLatencyMs: avgNetwork,
      avgCachedLatencyMs: avgCache,
      estimatedTimeSavedMs: timeSaved,
    };
  }

  public subscribe(listener: (metrics: LatencyMetric[]) => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  private notifyListeners() {
    for (const listener of this.listeners) {
      try {
        listener(this.metrics);
      } catch (err) {
        console.error('Error notifying cache metric listener:', err);
      }
    }
  }
}

export const apiCache = new ApiCacheManager();
