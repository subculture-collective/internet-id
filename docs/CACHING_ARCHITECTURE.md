# Caching Architecture

## Overview

The Internet-ID API implements a comprehensive caching layer using Redis to improve performance, reduce database load, and provide better scalability. The caching strategy follows the **cache-aside pattern** with automatic cache invalidation on write operations.

## Architecture

### Components

1. **Cache Service** (`scripts/services/cache.service.ts`)
   - Centralized Redis client management
   - Connection pooling and reconnection logic
   - Cache-aside pattern implementation
   - Metrics collection for observability

2. **Route Integration**
   - Transparent caching in API routes
   - Automatic cache invalidation on writes
   - Graceful degradation when Redis is unavailable

3. **Metrics Endpoint** (`/api/cache/metrics`)
   - Real-time cache hit/miss statistics
   - Hit rate calculation
   - Cache availability status

## Caching Strategy

### Data Types and TTL Configuration

Different data types have different access patterns and staleness tolerance:

| Data Type            | TTL        | Key Pattern                       | Rationale                                            |
| -------------------- | ---------- | --------------------------------- | ---------------------------------------------------- |
| Content Metadata     | 10 minutes | `content:{hash}`                  | Infrequently updated, frequently read                |
| Manifest Data        | 15 minutes | `manifest:{uri}`                  | Immutable once created, expensive to fetch from IPFS |
| Platform Bindings    | 3 minutes  | `binding:{platform}:{platformId}` | May change when new bindings created                 |
| Verification Results | 5 minutes  | `verifications:{hash}`            | Grows over time, needs periodic refresh              |
| IPFS Gateway URLs    | 30 minutes | `ipfs:{cid}`                      | Relatively stable gateway availability               |

### Cache-Aside Pattern

The cache-aside pattern is implemented via `cacheService.getOrSet()`:

```typescript
const data = await cacheService.getOrSet(
  cacheKey,
  async () => {
    // Fetch from database on cache miss
    return await prisma.content.findUnique({ where: { contentHash } });
  },
  { ttl: DEFAULT_TTL.CONTENT_METADATA }
);
```

**Flow:**

1. Check cache for key
2. If found (cache hit), return cached value
3. If not found (cache miss), execute fetch function
4. Cache the result and return it

### Cache Invalidation

Cache invalidation occurs on write operations to maintain consistency:

#### Content Registration

- **Trigger:** New content registered via `/api/register`
- **Action:** Invalidate `content:{hash}` key
- **Reason:** Content metadata updated

#### Platform Binding

- **Trigger:** New binding created via `/api/bind` or `/api/bind-many`
- **Action:** Invalidate `binding:{platform}:{platformId}` key
- **Reason:** New binding data available

#### Verification

- **Trigger:** New verification via `/api/verify` or `/api/proof`
- **Action:** Invalidate `verifications:{hash}` key
- **Reason:** New verification record added to list

## Redis Configuration

### Connection Settings

```typescript
// Connection pooling with automatic reconnection
const client = createClient({
  url: process.env.REDIS_URL,
  socket: {
    reconnectStrategy: (retries) => {
      // Exponential backoff: 50ms, 100ms, 200ms, ..., up to 3s
      return Math.min(50 * Math.pow(2, retries), 3000);
    },
    connectTimeout: 5000,
  },
});
```

### Eviction Policy

The cache service automatically configures Redis with LRU (Least Recently Used) eviction:

```typescript
await client.configSet("maxmemory-policy", "allkeys-lru");
await client.configSet("maxmemory", "268435456"); // 256MB
```

- **Policy:** `allkeys-lru` - Evict least recently used keys when memory limit reached
- **Max Memory:** 256MB (configurable)
- **Benefit:** Ensures most frequently accessed data remains cached

## Usage Examples

### Content Metadata Caching

```typescript
// GET /api/contents/:hash
const item = await cacheService.getOrSet(
  `content:${hash}`,
  async () => {
    return await prisma.content.findUnique({
      where: { contentHash: hash },
      include: { bindings: true },
    });
  },
  { ttl: DEFAULT_TTL.CONTENT_METADATA }
);
```

### Platform Binding Resolution

```typescript
// GET /api/resolve
const entry = await cacheService.getOrSet(
  `binding:${platform}:${platformId}`,
  async () => {
    return await resolveByPlatform(registryAddress, platform, platformId, provider);
  },
  { ttl: DEFAULT_TTL.PLATFORM_BINDING }
);
```

### Manifest Fetching

```typescript
// GET /api/public-verify
const manifest = await cacheService.getOrSet(
  `manifest:${manifestURI}`,
  async () => {
    return await fetchManifest(manifestURI);
  },
  { ttl: DEFAULT_TTL.MANIFEST }
);
```

### Cache Invalidation on Write

```typescript
// POST /api/register
await prisma.content.upsert({
  where: { contentHash: fileHash },
  create: {
    /* ... */
  },
  update: {
    /* ... */
  },
});

// Invalidate cache after write
await cacheService.delete(`content:${fileHash}`);
```

## Observability

### Cache Metrics Endpoint

**GET /api/cache/metrics**

Returns real-time cache statistics:

```json
{
  "cacheEnabled": true,
  "hits": 1234,
  "misses": 567,
  "sets": 890,
  "deletes": 45,
  "errors": 2,
  "hitRate": 68.5
}
```

**Metrics Explanation:**

- `cacheEnabled`: Whether Redis connection is active
- `hits`: Number of successful cache retrievals
- `misses`: Number of cache misses (had to fetch from source)
- `sets`: Number of values written to cache
- `deletes`: Number of cache deletions/invalidations
- `errors`: Number of Redis errors encountered
- `hitRate`: Percentage of requests served from cache (hits / (hits + misses))

### Integration with Observability Dashboard

Cache metrics can be integrated into the observability dashboard (issue #13) via:

1. **Prometheus/Grafana:**
   - Poll `/api/cache/metrics` endpoint
   - Create dashboards for hit rate trends
   - Set alerts for low hit rates or high error counts

2. **Application Logs:**
   - Cache connection status logged on startup
   - Errors logged with `[Cache]` prefix
   - Rate limit hits include cache availability status

3. **Performance Monitoring:**
   - Track response times before/after caching
   - Monitor database query reduction
   - Measure API throughput improvements

## Graceful Degradation

The caching layer is designed to fail gracefully:

- **Redis Unavailable:** All operations fall back to database queries
- **Connection Loss:** Automatic reconnection with exponential backoff
- **Cache Errors:** Logged but don't break API functionality
- **Missing REDIS_URL:** Cache service disabled, logs info message

Example:

```typescript
if (!cacheService.isAvailable()) {
  // Falls back to direct database query
  return await prisma.content.findUnique({ where: { contentHash } });
}
```

## Configuration

### Environment Variables

```bash
# Required for caching
REDIS_URL=redis://localhost:6379

# Optional: Separate cache for rate limiting
# (both can use same Redis instance)
```

### TTL Customization

Modify `DEFAULT_TTL` in `cache.service.ts`:

```typescript
export const DEFAULT_TTL = {
  CONTENT_METADATA: 10 * 60, // 10 minutes
  MANIFEST: 15 * 60, // 15 minutes
  VERIFICATION_STATUS: 5 * 60, // 5 minutes
  PLATFORM_BINDING: 3 * 60, // 3 minutes
  USER_SESSION: 24 * 60 * 60, // 24 hours
  IPFS_GATEWAY: 30 * 60, // 30 minutes
};
```

### Memory Limits

Adjust Redis max memory in `cache.service.ts`:

```typescript
// Default: 256MB
await client.configSet("maxmemory", "268435456");

// For larger deployments, increase to 512MB or 1GB:
await client.configSet("maxmemory", "536870912"); // 512MB
await client.configSet("maxmemory", "1073741824"); // 1GB
```

## Performance Impact

### Expected Improvements

- **Database Load:** 60-80% reduction in read queries
- **API Response Time:** 30-50% faster for cached endpoints
- **Throughput:** 2-3x increase in requests per second
- **IPFS Gateway Load:** Reduced manifest fetches from IPFS

### Monitoring Targets

- **Hit Rate:** Target 70%+ after warm-up period
- **P95 Latency:** Sub-50ms for cached requests
- **Error Rate:** <0.1% cache errors

## Testing

Run cache service tests:

```bash
# Start Redis (required for tests)
docker compose up -d redis

# Run tests
npm test -- test/services/cache.test.ts
```

Tests cover:

- Basic cache operations (get/set/delete)
- Cache-aside pattern
- Metrics collection
- Pattern-based deletion
- Graceful degradation

## Troubleshooting

### Cache Not Working

1. **Check Redis Connection:**

   ```bash
   redis-cli ping
   # Should return: PONG
   ```

2. **Verify Environment Variable:**

   ```bash
   echo $REDIS_URL
   # Should output: redis://localhost:6379
   ```

3. **Check API Logs:**
   ```
   [Cache] Redis client connected
   [Cache] Redis configured with LRU eviction policy
   ```

### Low Hit Rate

1. **Warm-up Period:** Cache needs time to populate (5-10 minutes)
2. **TTL Too Short:** Increase TTLs if data changes infrequently
3. **High Write Volume:** Frequent invalidations reduce hit rate
4. **Memory Pressure:** Increase max memory if evictions are high

### High Memory Usage

1. **Check Redis Memory:**

   ```bash
   redis-cli info memory
   ```

2. **Adjust Max Memory:**
   - Reduce in `cache.service.ts` if needed
   - Or increase if server has capacity

3. **Review TTLs:**
   - Shorter TTLs = less memory usage
   - Balance freshness vs. memory

## Future Enhancements

1. **Cache Warming:** Pre-populate cache with frequently accessed data on startup
2. **Cache Tags:** Group related keys for bulk invalidation
3. **Multi-tier Caching:** Add in-memory L1 cache for ultra-hot data
4. **Cache Stampede Protection:** Prevent multiple simultaneous fetches for same key
5. **Conditional Caching:** Cache only data above certain size/complexity threshold

## Related Issues

- Issue #14: Implement caching layer (this feature)
- Issue #13: Observability dashboard (metrics integration)
- Issue #10: Optimization roadmap (performance improvements)
