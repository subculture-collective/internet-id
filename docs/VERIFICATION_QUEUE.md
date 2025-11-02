# Asynchronous Verification Queue

This document describes the asynchronous verification queue system for Internet ID, which allows verification and proof generation tasks to be processed in the background using a job queue.

## Overview

The verification queue system provides:
- **Asynchronous processing**: Verification tasks are enqueued and processed by background workers
- **Job tracking**: Real-time status updates and progress tracking
- **Retry logic**: Automatic retries with exponential backoff for failed jobs
- **Resilience**: Better handling of load spikes and long-running verifications
- **Graceful degradation**: Falls back to synchronous processing when Redis is unavailable

## Architecture

The system consists of:
1. **Queue Service** (`verification-queue.service.ts`): Manages job queuing and processing using BullMQ
2. **API Routes** (`verification-jobs.routes.ts`): Endpoints for enqueuing jobs and polling status
3. **Database Table** (`VerificationJob`): Persistent storage for job metadata and results
4. **Redis**: Message broker and queue backend (optional, graceful fallback to sync mode)

## Prerequisites

### Required
- Node.js >= 16
- PostgreSQL database
- Redis server (optional, but recommended for production)

### Optional but Recommended
- Docker and Docker Compose (for local development)

## Local Development Setup

### Option 1: Using Docker Compose (Recommended)

1. **Start all services including Redis:**
   ```bash
   docker compose up -d
   ```

   This starts:
   - PostgreSQL database
   - Redis server
   - API server
   - Web application

2. **Verify Redis is running:**
   ```bash
   docker compose ps redis
   ```

3. **View logs:**
   ```bash
   # All services
   docker compose logs -f
   
   # Just the API
   docker compose logs -f api
   
   # Just Redis
   docker compose logs -f redis
   ```

### Option 2: Manual Setup

1. **Install and start Redis:**
   ```bash
   # macOS (using Homebrew)
   brew install redis
   brew services start redis
   
   # Ubuntu/Debian
   sudo apt-get install redis-server
   sudo systemctl start redis
   
   # Verify Redis is running
   redis-cli ping
   # Should return: PONG
   ```

2. **Configure environment variables:**
   Create a `.env` file in the project root:
   ```bash
   DATABASE_URL="postgresql://internetid:internetid@localhost:5432/internetid"
   REDIS_URL="redis://localhost:6379"
   RPC_URL="https://sepolia.base.org"
   API_KEY="your-secret-api-key"
   PRIVATE_KEY="your-wallet-private-key"
   ```

3. **Run database migrations:**
   ```bash
   npm run db:migrate
   ```

4. **Start the API server:**
   ```bash
   npm run start:api
   ```

## Usage

### Enqueuing Verification Jobs

#### Via API

**Verify endpoint (async mode):**
```bash
curl -X POST http://localhost:3001/api/verification-jobs/verify \
  -F "file=@/path/to/file.jpg" \
  -F "registryAddress=0x..." \
  -F "manifestURI=ipfs://..."
```

Response:
```json
{
  "mode": "async",
  "jobId": "1234567890",
  "status": "queued",
  "message": "Verification job queued successfully",
  "pollUrl": "/api/verification-jobs/1234567890"
}
```

**Proof endpoint (async mode):**
```bash
curl -X POST http://localhost:3001/api/verification-jobs/proof \
  -F "file=@/path/to/file.jpg" \
  -F "registryAddress=0x..." \
  -F "manifestURI=ipfs://..."
```

### Polling Job Status

```bash
curl http://localhost:3001/api/verification-jobs/1234567890
```

Response:
```json
{
  "id": "abc123",
  "jobId": "1234567890",
  "type": "verify",
  "status": "completed",
  "progress": 100,
  "contentHash": "0x...",
  "manifestUri": "ipfs://...",
  "result": {
    "status": "OK",
    "fileHash": "0x...",
    "recovered": "0x...",
    "onchain": { ... },
    "checks": {
      "manifestHashOk": true,
      "creatorOk": true,
      "manifestOk": true
    }
  },
  "createdAt": "2024-01-01T00:00:00.000Z",
  "completedAt": "2024-01-01T00:00:05.000Z"
}
```

### Listing Jobs

```bash
# All jobs
curl http://localhost:3001/api/verification-jobs

# Filter by status
curl http://localhost:3001/api/verification-jobs?status=completed

# Pagination
curl http://localhost:3001/api/verification-jobs?limit=20&offset=0
```

### Queue Statistics

```bash
curl http://localhost:3001/api/verification-jobs/stats
```

Response:
```json
{
  "available": true,
  "waiting": 5,
  "active": 2,
  "completed": 123,
  "failed": 3
}
```

## Job Lifecycle

1. **Queued**: Job is created and added to the queue
2. **Processing**: Worker picks up the job and begins execution
   - Progress updates: 10% → 30% → 50% → 70% → 90% → 100%
3. **Completed**: Job finished successfully, result is available
4. **Failed**: Job failed after retry attempts, error message is available

## Monitoring

### Queue Metrics

Monitor queue health using the stats endpoint:
```bash
watch -n 5 'curl -s http://localhost:3001/api/verification-jobs/stats | jq'
```

### Database Queries

Check recent jobs:
```sql
SELECT 
  id, 
  type, 
  status, 
  progress,
  DATE_PART('second', NOW() - "createdAt") as age_seconds
FROM "VerificationJob"
ORDER BY "createdAt" DESC
LIMIT 10;
```

Check failed jobs:
```sql
SELECT 
  id,
  type,
  status,
  error,
  "retryCount",
  "createdAt"
FROM "VerificationJob"
WHERE status = 'failed'
ORDER BY "createdAt" DESC;
```

### Redis CLI

Monitor queue activity in real-time:
```bash
# Connect to Redis
redis-cli

# Monitor all commands
MONITOR

# Check queue length
LLEN bull:verification:wait

# Get job details
HGETALL bull:verification:1234567890
```

### BullMQ Dashboard (Optional)

For a web UI to monitor queues, install and run Bull Board:

```bash
npm install @bull-board/api @bull-board/express
```

Add to your Express app:
```typescript
import { createBullBoard } from '@bull-board/api';
import { BullMQAdapter } from '@bull-board/api/bullMQAdapter';
import { ExpressAdapter } from '@bull-board/express';

const serverAdapter = new ExpressAdapter();
serverAdapter.setBasePath('/admin/queues');

createBullBoard({
  queues: [new BullMQAdapter(verificationQueue)],
  serverAdapter,
});

app.use('/admin/queues', serverAdapter.getRouter());
```

Access at: http://localhost:3001/admin/queues

## Configuration

### Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `REDIS_URL` | No | - | Redis connection URL. If not set, falls back to synchronous processing |
| `DATABASE_URL` | Yes | - | PostgreSQL connection URL |
| `RPC_URL` | Yes | - | Ethereum RPC endpoint |

### Queue Settings

Edit `scripts/services/verification-queue.service.ts`:

```typescript
const MAX_RETRY_ATTEMPTS = 3;  // Number of retry attempts
const RETRY_BACKOFF = {
  type: "exponential",
  delay: 5000,  // Initial delay in ms
};
```

### Worker Concurrency

Adjust the number of concurrent workers:
```typescript
concurrency: 3,  // Process up to 3 jobs simultaneously
```

## Troubleshooting

### Queue not processing jobs

1. **Check Redis connection:**
   ```bash
   redis-cli ping
   ```

2. **Check worker logs:**
   ```bash
   docker compose logs -f api | grep "Verification"
   ```

3. **Verify environment variables:**
   ```bash
   echo $REDIS_URL
   ```

### Jobs failing repeatedly

1. **Check job errors in database:**
   ```sql
   SELECT error, "retryCount" 
   FROM "VerificationJob" 
   WHERE status = 'failed';
   ```

2. **Common issues:**
   - Invalid RPC URL or network issues
   - Manifest not found (IPFS gateway issues)
   - Invalid registry address
   - File cleanup issues (temp files)

### Synchronous fallback

If Redis is unavailable, the API automatically falls back to synchronous processing:
```json
{
  "mode": "sync",
  "result": { ... }
}
```

To force async mode only, check `verificationQueueService.isAvailable()` before accepting requests.

## Performance Tuning

### For high load:
1. Increase worker concurrency
2. Scale horizontally (multiple API instances)
3. Optimize RPC provider (use paid tier or local node)
4. Implement result caching for repeated verifications

### For low latency:
1. Use local RPC node instead of public endpoints
2. Increase worker concurrency
3. Use faster Redis instance (Redis Cloud, AWS ElastiCache)

## Production Considerations

1. **Redis Persistence**: Enable AOF (Append-Only File) for data durability
   ```
   appendonly yes
   ```

2. **Redis High Availability**: Use Redis Sentinel or Redis Cluster

3. **Monitoring**: Set up alerts for:
   - Queue depth exceeding threshold
   - Job failure rate
   - Worker health

4. **Cleanup**: Set up periodic cleanup of old completed jobs:
   ```typescript
   removeOnComplete: {
     age: 3600 * 24 * 7,  // 7 days
     count: 1000,
   }
   ```

5. **Rate Limiting**: Apply rate limits to job submission endpoints

## Migration from Synchronous

The system supports both modes simultaneously:
- New clients can use `/api/verification-jobs/*` endpoints for async processing
- Legacy clients continue using `/api/verify` and `/api/proof` with synchronous processing
- Gradual migration path with no breaking changes

## Further Reading

- [BullMQ Documentation](https://docs.bullmq.io/)
- [Redis Documentation](https://redis.io/docs/)
- [Prisma Schema Reference](https://www.prisma.io/docs/reference/api-reference/prisma-schema-reference)
