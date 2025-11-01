import { createClient, RedisClientType } from "redis";

/**
 * Cache service for frequently accessed data
 * Implements cache-aside pattern with Redis backend
 */

export interface CacheMetrics {
  hits: number;
  misses: number;
  sets: number;
  deletes: number;
  errors: number;
  hitRate: number;
}

export interface CacheOptions {
  ttl?: number; // Time to live in seconds
  prefix?: string; // Key prefix for namespacing
}

// Default TTLs per data type (in seconds)
export const DEFAULT_TTL = {
  CONTENT_METADATA: 10 * 60, // 10 minutes
  MANIFEST: 15 * 60, // 15 minutes
  VERIFICATION_STATUS: 5 * 60, // 5 minutes
  PLATFORM_BINDING: 3 * 60, // 3 minutes
  USER_SESSION: 24 * 60 * 60, // 24 hours (NextAuth handles this, but available if needed)
  IPFS_GATEWAY: 30 * 60, // 30 minutes
};

class CacheService {
  private client: RedisClientType | null = null;
  private isConnected = false;
  private metrics: Omit<CacheMetrics, "hitRate"> = {
    hits: 0,
    misses: 0,
    sets: 0,
    deletes: 0,
    errors: 0,
  };

  /**
   * Initialize Redis client with connection pooling
   */
  async connect(): Promise<void> {
    if (this.isConnected) return;

    const redisUrl = process.env.REDIS_URL;
    if (!redisUrl) {
      console.log(
        "[Cache] REDIS_URL not configured, caching disabled (will use database fallback)"
      );
      return;
    }

    try {
      // Create Redis client with connection pooling and timeout settings
      this.client = createClient({
        url: redisUrl,
        socket: {
          reconnectStrategy: (retries) => {
            // Stop after 3 attempts
            if (retries >= 3) return false;
            // Exponential backoff: 50ms, 100ms, 200ms, ..., up to 3s
            const delay = Math.min(50 * Math.pow(2, retries), 3000);
            console.log(`[Cache] Reconnecting to Redis (attempt ${retries + 1})...`);
            return delay;
          },
          connectTimeout: 3000, // 3 second connection timeout
        },
      });

      this.client.on("error", (err) => {
        console.error("[Cache] Redis client error:", err);
        this.metrics.errors++;
      });

      this.client.on("connect", () => {
        console.log("[Cache] Redis client connected");
      });

      this.client.on("ready", () => {
        console.log("[Cache] Redis client ready");
        this.isConnected = true;
      });

      this.client.on("reconnecting", () => {
        console.log("[Cache] Redis client reconnecting...");
      });

      // Add timeout wrapper for connect
      let timeoutId: NodeJS.Timeout;
      await Promise.race([
        this.client.connect(),
        new Promise((_, reject) => {
          timeoutId = setTimeout(() => reject(new Error("Connection timeout")), 3000);
        }),
      ]).finally(() => {
        if (timeoutId) clearTimeout(timeoutId);
      });

      // Configure Redis for LRU eviction
      // maxmemory-policy: allkeys-lru evicts any key using LRU when max memory is reached
      try {
        await this.client.configSet("maxmemory-policy", "allkeys-lru");
        // Set max memory to 256MB (adjust based on your needs)
        await this.client.configSet("maxmemory", "268435456"); // 256MB in bytes
        console.log("[Cache] Redis configured with LRU eviction policy and 256MB max memory");
      } catch (err) {
        console.warn("[Cache] Could not configure Redis maxmemory settings:", err);
      }
    } catch (error: any) {
      console.warn("[Cache] Failed to connect to Redis:", error?.message || error);
      this.client = null;
      this.isConnected = false;
    }
  }

  /**
   * Disconnect from Redis
   */
  async disconnect(): Promise<void> {
    if (this.client && this.isConnected) {
      await this.client.quit();
      this.isConnected = false;
      console.log("[Cache] Redis client disconnected");
    }
  }

  /**
   * Check if cache is available
   */
  isAvailable(): boolean {
    return this.isConnected && this.client !== null;
  }

  /**
   * Get value from cache
   * @param key Cache key
   * @returns Cached value or null if not found
   */
  async get<T>(key: string): Promise<T | null> {
    if (!this.isAvailable()) return null;

    try {
      const value = await this.client!.get(key);
      if (value === null) {
        this.metrics.misses++;
        return null;
      }

      this.metrics.hits++;
      return JSON.parse(value) as T;
    } catch (error: any) {
      // Sanitize key for logging to prevent potential format string issues
      const safeKey = String(key).replace(/[^\w:.-]/g, "_");
      console.error(`[Cache] Error getting key ${safeKey}:`, error);
      this.metrics.errors++;
      return null;
    }
  }

  /**
   * Set value in cache with TTL
   * @param key Cache key
   * @param value Value to cache (will be JSON stringified)
   * @param options Cache options (TTL, prefix)
   */
  async set(key: string, value: any, options: CacheOptions = {}): Promise<boolean> {
    if (!this.isAvailable()) return false;

    try {
      const { ttl = DEFAULT_TTL.CONTENT_METADATA, prefix = "" } = options;
      const fullKey = prefix ? `${prefix}:${key}` : key;

      await this.client!.setEx(fullKey, ttl, JSON.stringify(value));
      this.metrics.sets++;
      return true;
    } catch (error: any) {
      // Sanitize key for logging to prevent potential format string issues
      const safeKey = String(key).replace(/[^\w:.-]/g, "_");
      console.error(`[Cache] Error setting key ${safeKey}:`, error);
      this.metrics.errors++;
      return false;
    }
  }

  /**
   * Delete value from cache
   * @param key Cache key or pattern (supports wildcards with del method)
   */
  async delete(key: string): Promise<boolean> {
    if (!this.isAvailable()) return false;

    try {
      await this.client!.del(key);
      this.metrics.deletes++;
      return true;
    } catch (error: any) {
      // Sanitize key for logging to prevent potential format string issues
      const safeKey = String(key).replace(/[^\w:.-]/g, "_");
      console.error(`[Cache] Error deleting key ${safeKey}:`, error);
      this.metrics.errors++;
      return false;
    }
  }

  /**
   * Delete multiple keys matching a pattern
   * @param pattern Key pattern (e.g., "content:*")
   */
  async deletePattern(pattern: string): Promise<number> {
    if (!this.isAvailable()) return 0;

    try {
      const keys = await this.client!.keys(pattern);
      if (keys.length === 0) return 0;

      await this.client!.del(keys);
      this.metrics.deletes += keys.length;
      return keys.length;
    } catch (error: any) {
      // Sanitize pattern for logging to prevent potential format string issues
      const safePattern = String(pattern).replace(/[^\w:.*-]/g, "_");
      console.error(`[Cache] Error deleting pattern ${safePattern}:`, error);
      this.metrics.errors++;
      return 0;
    }
  }

  /**
   * Get or set pattern - cache-aside pattern
   * Attempts to get from cache first, if miss, fetches from source and caches
   * @param key Cache key
   * @param fetchFn Function to fetch data if cache miss
   * @param options Cache options
   */
  async getOrSet<T>(
    key: string,
    fetchFn: () => Promise<T>,
    options: CacheOptions = {}
  ): Promise<T> {
    // Try to get from cache first
    const cached = await this.get<T>(key);
    if (cached !== null) {
      return cached;
    }

    // Cache miss - fetch from source
    const value = await fetchFn();

    // Cache the result (fire and forget)
    this.set(key, value, options).catch((err) => {
      // Sanitize key for logging to prevent potential format string issues
      const safeKey = String(key).replace(/[^\w:.-]/g, "_");
      console.warn(`[Cache] Failed to cache key ${safeKey}:`, err);
    });

    return value;
  }

  /**
   * Get cache metrics for observability
   */
  getMetrics(): CacheMetrics {
    const hitRate =
      this.metrics.hits + this.metrics.misses > 0
        ? (this.metrics.hits / (this.metrics.hits + this.metrics.misses)) * 100
        : 0;

    return {
      ...this.metrics,
      hitRate: parseFloat(hitRate.toFixed(2)),
    };
  }

  /**
   * Reset metrics (useful for testing)
   */
  resetMetrics(): void {
    this.metrics = {
      hits: 0,
      misses: 0,
      sets: 0,
      deletes: 0,
      errors: 0,
    };
  }

  /**
   * Flush all cache data (use with caution!)
   */
  async flushAll(): Promise<boolean> {
    if (!this.isAvailable()) return false;

    try {
      await this.client!.flushAll();
      console.log("[Cache] All cache data flushed");
      return true;
    } catch (error) {
      console.error("[Cache] Error flushing cache:", error);
      this.metrics.errors++;
      return false;
    }
  }
}

// Singleton instance
export const cacheService = new CacheService();

// Helper functions for specific data types with appropriate TTLs and key prefixes

/**
 * Cache content metadata
 */
export async function cacheContent(contentHash: string, data: any): Promise<boolean> {
  return cacheService.set(`content:${contentHash}`, data, {
    ttl: DEFAULT_TTL.CONTENT_METADATA,
  });
}

export async function getCachedContent(contentHash: string): Promise<any | null> {
  return cacheService.get(`content:${contentHash}`);
}

export async function invalidateContent(contentHash: string): Promise<boolean> {
  return cacheService.delete(`content:${contentHash}`);
}

/**
 * Cache manifest data
 */
export async function cacheManifest(manifestUri: string, data: any): Promise<boolean> {
  const key = `manifest:${manifestUri}`;
  return cacheService.set(key, data, {
    ttl: DEFAULT_TTL.MANIFEST,
  });
}

export async function getCachedManifest(manifestUri: string): Promise<any | null> {
  return cacheService.get(`manifest:${manifestUri}`);
}

/**
 * Cache verification status
 */
export async function cacheVerification(contentHash: string, data: any): Promise<boolean> {
  return cacheService.set(`verification:${contentHash}`, data, {
    ttl: DEFAULT_TTL.VERIFICATION_STATUS,
  });
}

export async function getCachedVerification(contentHash: string): Promise<any | null> {
  return cacheService.get(`verification:${contentHash}`);
}

/**
 * Cache platform binding
 */
export async function cachePlatformBinding(
  platform: string,
  platformId: string,
  data: any
): Promise<boolean> {
  return cacheService.set(`binding:${platform}:${platformId}`, data, {
    ttl: DEFAULT_TTL.PLATFORM_BINDING,
  });
}

export async function getCachedPlatformBinding(
  platform: string,
  platformId: string
): Promise<any | null> {
  return cacheService.get(`binding:${platform}:${platformId}`);
}

export async function invalidatePlatformBinding(
  platform: string,
  platformId: string
): Promise<boolean> {
  return cacheService.delete(`binding:${platform}:${platformId}`);
}

/**
 * Cache IPFS gateway availability/URLs
 */
export async function cacheIpfsGateway(cid: string, gatewayUrl: string): Promise<boolean> {
  return cacheService.set(`ipfs:${cid}`, gatewayUrl, {
    ttl: DEFAULT_TTL.IPFS_GATEWAY,
  });
}

export async function getCachedIpfsGateway(cid: string): Promise<string | null> {
  return cacheService.get(`ipfs:${cid}`);
}

/**
 * Invalidate all content-related caches (on content update)
 */
export async function invalidateContentCaches(contentHash: string): Promise<void> {
  // Delete content and verification cache
  await Promise.all([
    cacheService.delete(`content:${contentHash}`),
    cacheService.delete(`verification:${contentHash}`),
  ]);

  // Delete all bindings that might reference this content
  // Using deletePattern to remove any binding keys
  await cacheService.deletePattern(`binding:*:*`);
}
