# Database Index Migration - README

## Overview

This migration adds comprehensive database indexes to optimize query performance and prevent full table scans as the application scales.

**Migration:** `20251020124623_add_database_indexes`

## What's Changed

This migration adds 17 indexes across 6 models:
- 1 index on User
- 3 indexes on Content
- 3 indexes on PlatformBinding
- 6 indexes on Verification (including 2 composite)
- 3 indexes on Account (including 1 composite)
- 2 indexes on Session

## Applying the Migration

### Development Environment

```bash
# From root directory
npm run db:migrate
```

This will:
1. Apply the migration to your local database
2. Regenerate both Prisma clients (API and Web)
3. Update the migration history

### Production/Staging Environment

For production deployments, consider using `prisma migrate deploy` which doesn't prompt for confirmations:

```bash
npx prisma migrate deploy
```

### Adding Indexes Concurrently (PostgreSQL)

For large production databases, you may want to add indexes without locking tables. PostgreSQL supports `CREATE INDEX CONCURRENTLY`, which allows writes to continue during index creation.

**Manual approach (requires direct database access):**

```sql
-- Connect to your production database
psql $DATABASE_URL

-- Create indexes concurrently (one at a time)
CREATE INDEX CONCURRENTLY IF NOT EXISTS "User_createdAt_idx" ON "User"("createdAt");
CREATE INDEX CONCURRENTLY IF NOT EXISTS "Content_creatorId_idx" ON "Content"("creatorId");
-- ... etc for all indexes in migration.sql
```

**Note:** Prisma migrations don't support `CONCURRENTLY` keyword directly. For zero-downtime deployments:
1. Mark this migration as applied: `npx prisma migrate resolve --applied 20251020124623_add_database_indexes`
2. Run the above SQL commands with `CONCURRENTLY` manually
3. Verify indexes were created successfully

## Performance Impact

### Expected Improvements

- **Content listing**: 10-100x faster on large datasets (uses `Content_createdAt_idx`)
- **Verification queries**: 50-500x faster when filtering by hash or status
- **Account lookups**: Near-instant for userId+provider combinations
- **Foreign key joins**: Significantly faster across all models

### Before vs After (Estimated)

| Query | Before | After |
|-------|--------|-------|
| List 1000 recent contents | ~500ms | ~10ms |
| Get verifications by hash | ~200ms | ~5ms |
| Filter by status + sort | ~800ms | ~15ms |
| User account lookup | ~100ms | ~2ms |

*Based on ~100k records per table

### Monitoring

After applying, verify index usage with:

```sql
-- Check index usage statistics
SELECT schemaname, tablename, indexname, idx_scan, idx_tup_read
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
ORDER BY idx_scan DESC;

-- Check index sizes
SELECT schemaname, tablename, indexname,
       pg_size_pretty(pg_relation_size(indexrelid)) as size
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
ORDER BY pg_relation_size(indexrelid) DESC;
```

## Rollback (If Needed)

If you need to rollback these indexes:

```sql
-- Drop all indexes created by this migration
DROP INDEX IF EXISTS "User_createdAt_idx";
DROP INDEX IF EXISTS "Content_creatorId_idx";
DROP INDEX IF EXISTS "Content_createdAt_idx";
DROP INDEX IF EXISTS "Content_creatorAddress_idx";
DROP INDEX IF EXISTS "PlatformBinding_contentId_idx";
DROP INDEX IF EXISTS "PlatformBinding_platform_idx";
DROP INDEX IF EXISTS "PlatformBinding_createdAt_idx";
DROP INDEX IF EXISTS "Verification_contentHash_idx";
DROP INDEX IF EXISTS "Verification_status_idx";
DROP INDEX IF EXISTS "Verification_createdAt_idx";
DROP INDEX IF EXISTS "Verification_contentId_idx";
DROP INDEX IF EXISTS "Verification_contentHash_createdAt_idx";
DROP INDEX IF EXISTS "Verification_status_createdAt_idx";
DROP INDEX IF EXISTS "Account_userId_idx";
DROP INDEX IF EXISTS "Account_userId_provider_idx";
DROP INDEX IF EXISTS "Account_username_idx";
DROP INDEX IF EXISTS "Session_userId_idx";
DROP INDEX IF EXISTS "Session_expires_idx";
```

Then mark the migration as rolled back:
```bash
npx prisma migrate resolve --rolled-back 20251020124623_add_database_indexes
```

## Verification

After applying the migration, verify with:

```bash
# Check that schema is in sync
npx prisma migrate status

# Regenerate clients if needed
npm run db:generate
```

Test critical queries with `EXPLAIN ANALYZE`:

```sql
-- Example: Should show Index Scan on Verification_contentHash_createdAt_idx
EXPLAIN ANALYZE
SELECT * FROM "Verification"
WHERE "contentHash" = 'your-hash-here'
ORDER BY "createdAt" DESC
LIMIT 50;
```

## Related Documentation

- Full indexing strategy: See `docs/DATABASE_INDEXING_STRATEGY.md`
- Prisma migrations: https://www.prisma.io/docs/concepts/components/prisma-migrate
- PostgreSQL indexes: https://www.postgresql.org/docs/current/indexes.html

## Questions?

See issue #12 for background and discussion about this optimization.
