# Database Indexing Strategy

This document outlines the indexing strategy for the Internet ID database schema to ensure optimal query performance at scale.

## Overview

The database schema uses PostgreSQL with Prisma ORM. Indexes are strategically placed to optimize common query patterns while avoiding index bloat.

## Index Categories

### 1. Primary Keys and Unique Constraints

All models have primary keys (`@id`) that are automatically indexed:
- `User.id` (cuid)
- `Content.id` (cuid)
- `PlatformBinding.id` (cuid)
- `Verification.id` (cuid)
- `Account.id` (cuid)
- `Session.id` (cuid)

Unique constraints (automatically indexed):
- `User.address`, `User.email`
- `Content.contentHash`
- `PlatformBinding.[platform, platformId]` (composite unique)
- `Account.[provider, providerAccountId]` (composite unique)
- `Session.sessionToken`
- `VerificationToken.[identifier, token]` (composite unique)
- `VerificationToken.token`

### 2. Foreign Key Indexes

Foreign keys improve JOIN performance and enforce referential integrity:

**Content model:**
- `@@index([creatorId])` - Optimizes queries filtering by user (Content.creator relation)
- `@@index([creatorAddress])` - Optimizes queries by blockchain address

**PlatformBinding model:**
- `@@index([contentId])` - Optimizes queries for bindings by content

**Verification model:**
- `@@index([contentId])` - Optimizes queries for verifications by content

**Account model:**
- `@@index([userId])` - Optimizes queries for accounts by user
- `@@index([userId, provider])` - Composite index for efficient user + provider lookups

**Session model:**
- `@@index([userId])` - Optimizes queries for sessions by user

### 3. Filter/Sort Indexes

These indexes optimize WHERE clauses and ORDER BY operations:

**Time-based sorting (createdAt):**
- `User.@@index([createdAt])`
- `Content.@@index([createdAt])`
- `PlatformBinding.@@index([createdAt])`
- `Verification.@@index([createdAt])`

**Status filtering:**
- `Verification.@@index([status])` - Filters by verification status (OK, WARN, FAIL)

**Session expiration:**
- `Session.@@index([expires])` - Optimizes cleanup queries for expired sessions

### 4. Lookup Field Indexes

**Content lookup:**
- `Verification.@@index([contentHash])` - Fast lookup of verifications by content hash

**Platform filtering:**
- `PlatformBinding.@@index([platform])` - Query all bindings for a specific platform (e.g., all YouTube bindings)

**Username lookup:**
- `Account.@@index([username])` - Fast lookup by platform username

### 5. Composite Indexes

Composite indexes optimize queries with multiple filters:

**Verification queries:**
- `@@index([contentHash, createdAt])` - Optimizes "get verifications for content X, ordered by time"
- `@@index([status, createdAt])` - Optimizes "get failed verifications, ordered by time"

**Account queries:**
- `@@index([userId, provider])` - Optimizes "get user's account for provider X"

## Query Optimization Guidelines

### Critical Query Patterns

1. **List content by recency:**
   ```typescript
   prisma.content.findMany({
     orderBy: { createdAt: "desc" },
     include: { bindings: true }
   })
   ```
   - Uses: `Content.createdAt` index
   - Related binding queries use: `PlatformBinding.contentId` index

2. **Get content by hash:**
   ```typescript
   prisma.content.findUnique({
     where: { contentHash: hash }
   })
   ```
   - Uses: `Content.contentHash` unique constraint (automatically indexed)

3. **List verifications for content:**
   ```typescript
   prisma.verification.findMany({
     where: { contentHash: hash },
     orderBy: { createdAt: "desc" }
   })
   ```
   - Uses: `Verification.[contentHash, createdAt]` composite index

4. **Filter verifications by status:**
   ```typescript
   prisma.verification.findMany({
     where: { status: "FAIL" },
     orderBy: { createdAt: "desc" }
   })
   ```
   - Uses: `Verification.[status, createdAt]` composite index

5. **Get user accounts by provider:**
   ```typescript
   prisma.account.findFirst({
     where: { userId, provider }
   })
   ```
   - Uses: `Account.[userId, provider]` composite index

6. **Lookup platform binding:**
   ```typescript
   prisma.platformBinding.upsert({
     where: { platform_platformId: { platform, platformId } }
   })
   ```
   - Uses: `PlatformBinding.[platform, platformId]` unique constraint (automatically indexed)

### Performance Recommendations

1. **Always use indexes for:**
   - WHERE clauses on large tables
   - ORDER BY operations
   - JOIN operations (foreign keys)
   - GROUP BY operations

2. **Avoid:**
   - Full table scans on tables with > 1000 rows
   - Non-indexed WHERE clauses on high-cardinality columns
   - Leading wildcards in LIKE queries (e.g., `%search`)

3. **Monitor and optimize:**
   - Use `EXPLAIN ANALYZE` to verify index usage
   - Monitor slow query logs in production
   - Add partial indexes for specific use cases if needed

### Example: Using EXPLAIN ANALYZE

To verify index usage in PostgreSQL:

```sql
EXPLAIN ANALYZE SELECT * FROM "Verification" 
WHERE "contentHash" = '0x123...' 
ORDER BY "createdAt" DESC;
```

Expected output should show:
- Index Scan using `Verification_contentHash_createdAt_idx`
- No "Seq Scan" on large tables

## Index Maintenance

### Creating New Indexes

When adding new indexes:
1. Analyze query patterns in production
2. Test with `EXPLAIN ANALYZE` first
3. Create migration: `npx prisma migrate dev --name add_index_name`
4. Monitor performance impact

### Partial Indexes (Future Consideration)

For common filter combinations, consider partial indexes:

```prisma
// Example: Index only failed verifications
@@index([createdAt], where: status = 'FAIL')
```

PostgreSQL supports partial indexes, but Prisma's support is limited. Use raw SQL migrations if needed.

### Index Size Monitoring

Monitor index sizes to prevent bloat:

```sql
SELECT schemaname, tablename, indexname, 
       pg_size_pretty(pg_relation_size(indexrelid)) as size
FROM pg_stat_user_indexes
ORDER BY pg_relation_size(indexrelid) DESC;
```

## Migration Strategy

### For Existing Databases

1. Add indexes during low-traffic periods
2. Use `CREATE INDEX CONCURRENTLY` in PostgreSQL (prevents table locking)
3. Monitor query performance before/after

### Schema Changes

Always run migrations with:
```bash
npm run db:migrate
```

This ensures:
- Both clients (API and Web) are updated
- Migration history is tracked
- Indexes are created properly

## Related Issues

- Issue #12: Database schema optimization with proper indexes
- Issue #13: Monitor slow query log in production
- Issue #10: Optimization roadmap
- Issue #5: Schema consolidation

## Performance Targets

With proper indexing, the system should handle:
- 100k+ content registrations
- 1M+ verifications
- Sub-100ms query response times for indexed queries
- Efficient pagination with offset/cursor-based approaches

## Future Optimizations

1. **Partial indexes** for common status filters
2. **Covering indexes** to avoid table lookups
3. **Index-only scans** for frequently accessed columns
4. **Materialized views** for complex aggregations
5. **Query result caching** at the application layer
