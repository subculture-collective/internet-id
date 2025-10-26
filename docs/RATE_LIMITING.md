# Rate Limiting

This document describes the rate limiting implementation for the Internet-ID API to protect against abuse, DDoS attacks, and resource exhaustion.

## Overview

The API implements tiered rate limiting with different limits based on endpoint categories:

- **Strict limits**: For expensive operations (uploads, on-chain transactions)
- **Moderate limits**: For read operations (content queries, verification)
- **Relaxed limits**: For health checks and status endpoints

## Rate Limit Tiers

### Strict Limits (10 requests/minute)

Applied to expensive operations that consume significant resources:

- `POST /api/upload` - IPFS uploads
- `POST /api/manifest` - Manifest creation and upload
- `POST /api/register` - On-chain registration
- `POST /api/bind` - Platform binding
- `POST /api/bind-many` - Batch platform binding
- `POST /api/one-shot` - Complete registration flow
- `POST /api/verify` - Content verification with file upload
- `POST /api/proof` - Proof generation with file upload

### Moderate Limits (100 requests/minute)

Applied to read operations and queries:

- `GET /api/resolve` - Resolve platform bindings
- `GET /api/public-verify` - Public verification queries
- `GET /api/contents` - List content records
- `GET /api/contents/:hash` - Get content by hash
- `GET /api/contents/:hash/verifications` - Get verifications
- `GET /api/verifications` - List verifications
- `GET /api/verifications/:id` - Get verification by ID
- `GET /api/network` - Network information
- `GET /api/registry` - Registry address

### Relaxed Limits (1000 requests/minute)

Applied to lightweight status endpoints:

- `GET /api/health` - Health check

## Configuration

### Environment Variables

Configure rate limiting behavior in your `.env` file:

```bash
# Redis URL for distributed rate limiting (optional)
# If not set, uses in-memory store (not suitable for multi-instance deployments)
REDIS_URL=redis://localhost:6379

# API key that exempts from rate limiting (optional)
# Useful for internal services or trusted clients
RATE_LIMIT_EXEMPT_API_KEY=internal_service_key
```

### Redis Store

For production deployments with multiple API instances, Redis is **strongly recommended** to ensure consistent rate limiting across all instances.

**Without Redis**: Each API instance maintains its own in-memory rate limit counters. This means:

- A client could make 10 requests/minute to Instance A and 10 requests/minute to Instance B
- Rate limits are reset when the API restarts
- Not suitable for load-balanced deployments

**With Redis**: All API instances share a centralized rate limit store:

- Rate limits are enforced consistently across all instances
- Limits persist through API restarts
- Suitable for production use with load balancing

#### Setting up Redis

**Using Docker:**

```bash
docker run -d --name redis -p 6379:6379 redis:7-alpine
```

**Using Docker Compose** (add to `docker-compose.yml`):

```yaml
services:
  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    restart: unless-stopped

volumes:
  redis_data:
```

Then set in `.env`:

```bash
REDIS_URL=redis://localhost:6379
```

For managed Redis services (AWS ElastiCache, Redis Cloud, etc.), use the connection URL provided by your service:

```bash
REDIS_URL=redis://username:password@hostname:port
```

## Response Format

When rate limits are exceeded, the API returns:

**Status Code**: `429 Too Many Requests`

**Headers**:

- `Retry-After`: Seconds until the rate limit resets
- `RateLimit-Limit`: Maximum requests allowed in the window
- `RateLimit-Remaining`: Requests remaining in current window
- `RateLimit-Reset`: Timestamp when the rate limit resets

**Response Body**:

```json
{
  "error": "Too Many Requests",
  "message": "Rate limit exceeded. Please try again later.",
  "retryAfter": 45
}
```

## Client Implementation

### Handling Rate Limits

Clients should:

1. Check `RateLimit-Remaining` header to track remaining quota
2. When receiving `429`, read `Retry-After` header
3. Implement exponential backoff for retries
4. Cache responses where appropriate to reduce API calls

### Example (JavaScript/TypeScript)

```typescript
async function makeRequest(url: string, options: RequestInit = {}) {
  const response = await fetch(url, options);

  // Check rate limit headers
  const remaining = response.headers.get("RateLimit-Remaining");
  const limit = response.headers.get("RateLimit-Limit");
  console.log(`Rate limit: ${remaining}/${limit} remaining`);

  if (response.status === 429) {
    const retryAfter = response.headers.get("Retry-After");
    console.warn(`Rate limited. Retry after ${retryAfter} seconds`);

    // Wait and retry
    await new Promise((resolve) => setTimeout(resolve, Number(retryAfter) * 1000));
    return makeRequest(url, options);
  }

  return response;
}
```

### Example (curl)

```bash
# Make a request and view rate limit headers
curl -i https://api.example.com/api/health

# Example response headers:
# RateLimit-Limit: 1000
# RateLimit-Remaining: 999
# RateLimit-Reset: 1635360000
```

## Authenticated User Exemptions

Trusted clients can be exempted from rate limiting by setting `RATE_LIMIT_EXEMPT_API_KEY`:

1. Generate a secure API key:

   ```bash
   openssl rand -hex 32
   ```

2. Set in `.env`:

   ```bash
   RATE_LIMIT_EXEMPT_API_KEY=your_secure_key_here
   ```

3. Include in requests:
   ```bash
   curl -H "x-api-key: your_secure_key_here" https://api.example.com/api/upload
   ```

**Security Notes**:

- Keep exempt API keys secure and rotate regularly
- Only provide to trusted internal services
- Monitor usage of exempt keys for abuse
- Consider separate keys for different services

## Monitoring

### Rate Limit Hits

When rate limits are exceeded, the API logs:

```
[RATE_LIMIT_HIT] IP: 192.168.1.100, Path: /api/upload, Time: 2024-01-15T10:30:00.000Z
```

### Recommended Monitoring

Monitor these metrics in production:

- Rate limit hit frequency by endpoint
- Top IP addresses hitting rate limits
- Rate limit hit patterns (time of day, specific endpoints)
- Redis connection health (if using Redis)

### Example Log Aggregation Query

If using a log aggregation service (e.g., CloudWatch, Datadog, ELK):

```
[RATE_LIMIT_HIT]
| count by IP, Path
| sort count desc
```

## Testing Rate Limits

### Manual Testing

Test rate limits with curl:

```bash
# Test strict limit (10 req/min) on upload endpoint
for i in {1..15}; do
  echo "Request $i"
  curl -X POST \
    -H "x-api-key: supersecret" \
    -F "file=@test.txt" \
    http://localhost:3001/api/upload
  sleep 1
done
```

Expected: First 10 succeed, remaining fail with 429.

### Automated Tests

See `test/middleware/rate-limit.test.ts` for comprehensive test coverage:

- Rate limit enforcement for each tier
- Redis vs in-memory store behavior
- Authenticated exemptions
- Header validation
- Error message format

Run tests:

```bash
npm test -- test/middleware/rate-limit.test.ts
```

## Production Recommendations

1. **Use Redis**: Essential for multi-instance deployments
2. **Monitor logs**: Track rate limit hits to identify abuse patterns
3. **Set exemptions carefully**: Only for trusted internal services
4. **Adjust limits**: Based on actual usage patterns and capacity
5. **Alert on anomalies**: High rate limit hit rates may indicate attacks
6. **Document for users**: Include rate limits in API documentation

## Troubleshooting

### Rate limits not working

- Check Redis connection if `REDIS_URL` is set
- Verify middleware is applied to routes
- Check logs for initialization errors

### Too strict / too lenient

- Adjust limits in `scripts/middleware/rate-limit.middleware.ts`
- Consider user feedback and actual usage patterns
- Monitor API performance under load

### Redis connection issues

- Verify Redis is running: `redis-cli ping`
- Check network connectivity
- Review Redis logs for errors
- API will fall back to in-memory if Redis fails

### Rate limits reset unexpectedly

- Using in-memory store without Redis (resets on API restart)
- Redis data eviction policy too aggressive
- Check Redis `maxmemory` and `maxmemory-policy` settings

## Further Reading

- [express-rate-limit documentation](https://github.com/express-rate-limit/express-rate-limit)
- [rate-limit-redis documentation](https://github.com/express-rate-limit/rate-limit-redis)
- [Redis best practices](https://redis.io/docs/manual/patterns/)
- [HTTP 429 Too Many Requests](https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/429)
