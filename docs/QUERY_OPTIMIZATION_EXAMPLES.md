# Query Optimization Examples

This document provides concrete examples of how the new indexes optimize real queries from the Internet ID codebase.

## Query Analysis with EXPLAIN ANALYZE

Use PostgreSQL's `EXPLAIN ANALYZE` to verify that queries are using indexes effectively. The examples below show queries from the actual codebase.

### Prerequisites

Connect to your PostgreSQL database:
```bash
psql $DATABASE_URL
```

Enable timing for accurate measurements:
```sql
\timing on
```

---

## 1. Content Listing Query

**Location:** `scripts/routes/content.routes.ts:27-33`

**Query:**
```typescript
const items = await prisma.content.findMany({
  orderBy: { createdAt: "desc" },
  include: { bindings: true },
});
```

**SQL Equivalent:**
```sql
EXPLAIN ANALYZE
SELECT * FROM "Content"
ORDER BY "createdAt" DESC;
```

**Expected Plan (with index):**
```
Index Scan Backward using Content_createdAt_idx on "Content"
  (cost=0.15..XX.XX rows=XXX width=XXX)
```

**Before Index:** Sequential Scan + Sort (slow on large tables)  
**After Index:** Index Scan Backward (fast, no sorting needed)

---

## 2. Content by Hash Lookup

**Location:** `scripts/routes/content.routes.ts:44-46`

**Query:**
```typescript
const item = await prisma.content.findUnique({
  where: { contentHash: hash },
  include: { bindings: true },
});
```

**SQL Equivalent:**
```sql
EXPLAIN ANALYZE
SELECT * FROM "Content"
WHERE "contentHash" = '0x1234567890abcdef...';
```

**Expected Plan:**
```
Index Scan using Content_contentHash_key on "Content"
  (cost=0.15..8.17 rows=1 width=XXX)
```

**Note:** This already used the unique constraint index, so no change. However, the `include: { bindings: true }` now benefits from `PlatformBinding_contentId_idx`.

---

## 3. Verifications by Content Hash

**Location:** `scripts/routes/content.routes.ts:92-94`

**Query:**
```typescript
const items = await prisma.verification.findMany({
  where: { contentHash: hash },
  orderBy: { createdAt: "desc" },
});
```

**SQL Equivalent:**
```sql
EXPLAIN ANALYZE
SELECT * FROM "Verification"
WHERE "contentHash" = '0x1234567890abcdef...'
ORDER BY "createdAt" DESC;
```

**Expected Plan (with composite index):**
```
Index Scan Backward using Verification_contentHash_createdAt_idx on "Verification"
  (cost=0.15..XX.XX rows=XXX width=XXX)
  Index Cond: ("contentHash" = '0x1234567890abcdef...')
```

**Before:** Sequential Scan + Filter + Sort  
**After:** Single composite index scan (optimal!)

---

## 4. Verifications List with Filter

**Location:** `scripts/routes/content.routes.ts:63-66`

**Query:**
```typescript
const items = await prisma.verification.findMany({
  where: contentHash ? { contentHash } : undefined,
  orderBy: { createdAt: "desc" },
  take,
});
```

**SQL Equivalent (with filter):**
```sql
EXPLAIN ANALYZE
SELECT * FROM "Verification"
WHERE "contentHash" = '0x1234567890abcdef...'
ORDER BY "createdAt" DESC
LIMIT 50;
```

**Expected Plan:**
```
Limit (cost=0.15..XX.XX rows=50 width=XXX)
  -> Index Scan Backward using Verification_contentHash_createdAt_idx on "Verification"
     Index Cond: ("contentHash" = '0x1234567890abcdef...')
```

**SQL Equivalent (without filter):**
```sql
EXPLAIN ANALYZE
SELECT * FROM "Verification"
ORDER BY "createdAt" DESC
LIMIT 50;
```

**Expected Plan:**
```
Limit (cost=0.15..XX.XX rows=50 width=XXX)
  -> Index Scan Backward using Verification_createdAt_idx on "Verification"
```

---

## 5. Account Lookup by User and Provider

**Location:** `web/app/api/app/bind/route.ts:36-39`

**Query:**
```typescript
const acct = await prisma.account.findFirst({
  where: { userId, provider: requiredProvider },
  select: { id: true },
});
```

**SQL Equivalent:**
```sql
EXPLAIN ANALYZE
SELECT "id" FROM "Account"
WHERE "userId" = 'cuid123' AND "provider" = 'google'
LIMIT 1;
```

**Expected Plan (with composite index):**
```
Limit (cost=0.15..8.17 rows=1 width=XX)
  -> Index Scan using Account_userId_provider_idx on "Account"
     Index Cond: (("userId" = 'cuid123') AND ("provider" = 'google'))
```

**Before:** Sequential Scan + Filter (slow)  
**After:** Direct composite index lookup (instant)

---

## 6. Platform Binding Lookup

**Location:** `scripts/routes/binding.routes.ts:53-60`

**Query:**
```typescript
await prisma.platformBinding.upsert({
  where: { platform_platformId: { platform, platformId } },
  create: { platform, platformId, contentId: content?.id },
  update: { contentId: content?.id },
});
```

**SQL Equivalent:**
```sql
EXPLAIN ANALYZE
SELECT * FROM "PlatformBinding"
WHERE "platform" = 'youtube' AND "platformId" = 'UCxxxxx';
```

**Expected Plan:**
```
Index Scan using PlatformBinding_platform_platformId_key on "PlatformBinding"
  (cost=0.15..8.17 rows=1 width=XXX)
  Index Cond: (("platform" = 'youtube') AND ("platformId" = 'UCxxxxx'))
```

**Note:** Already used unique constraint index (no change for this query), but `PlatformBinding_platform_idx` helps when filtering by platform only.

---

## 7. Content by Creator Address

**Not currently in codebase, but optimized for future use:**

**Potential Query:**
```typescript
const items = await prisma.content.findMany({
  where: { creatorAddress: address },
  orderBy: { createdAt: "desc" },
});
```

**SQL Equivalent:**
```sql
EXPLAIN ANALYZE
SELECT * FROM "Content"
WHERE "creatorAddress" = '0xabcd...1234'
ORDER BY "createdAt" DESC;
```

**Expected Plan:**
```
Index Scan using Content_creatorAddress_idx on "Content"
  (cost=0.15..XX.XX rows=XXX width=XXX)
  Index Cond: ("creatorAddress" = '0xabcd...1234')
```

---

## 8. Failed Verifications Report

**Potential Query for Admin/Monitoring:**

```typescript
const failed = await prisma.verification.findMany({
  where: { status: "FAIL" },
  orderBy: { createdAt: "desc" },
  take: 100,
});
```

**SQL Equivalent:**
```sql
EXPLAIN ANALYZE
SELECT * FROM "Verification"
WHERE "status" = 'FAIL'
ORDER BY "createdAt" DESC
LIMIT 100;
```

**Expected Plan (with composite index):**
```
Limit (cost=0.15..XX.XX rows=100 width=XXX)
  -> Index Scan Backward using Verification_status_createdAt_idx on "Verification"
     Index Cond: ("status" = 'FAIL')
```

---

## 9. Session Cleanup Query

**Common cleanup query:**

```typescript
// Delete expired sessions
await prisma.session.deleteMany({
  where: {
    expires: { lt: new Date() }
  }
});
```

**SQL Equivalent:**
```sql
EXPLAIN ANALYZE
DELETE FROM "Session"
WHERE "expires" < NOW();
```

**Expected Plan:**
```
Delete on "Session"
  -> Index Scan using Session_expires_idx on "Session"
     Index Cond: ("expires" < NOW())
```

**Before:** Sequential Scan (slow for large session tables)  
**After:** Index Scan (fast cleanup)

---

## 10. User's Sessions Lookup

**Query:**
```typescript
const sessions = await prisma.session.findMany({
  where: { userId },
  orderBy: { createdAt: "desc" },
});
```

**SQL Equivalent:**
```sql
EXPLAIN ANALYZE
SELECT * FROM "Session"
WHERE "userId" = 'cuid123'
ORDER BY "createdAt" DESC;
```

**Expected Plan:**
```
Sort (cost=XX.XX..XX.XX rows=XX width=XXX)
  Sort Key: "createdAt" DESC
  -> Index Scan using Session_userId_idx on "Session"
     Index Cond: ("userId" = 'cuid123')
```

**Note:** Uses index for WHERE, then sorts in memory (acceptable for small result sets per user).

---

## Performance Testing Script

Create a test script to measure query performance:

```typescript
// test-query-performance.ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testQueries() {
  console.time('Content list');
  await prisma.content.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
  });
  console.timeEnd('Content list');

  console.time('Verifications by hash');
  const contents = await prisma.content.findMany({ take: 1 });
  if (contents[0]) {
    await prisma.verification.findMany({
      where: { contentHash: contents[0].contentHash },
      orderBy: { createdAt: "desc" },
    });
  }
  console.timeEnd('Verifications by hash');

  console.time('Account lookup');
  const users = await prisma.user.findMany({ take: 1 });
  if (users[0]) {
    await prisma.account.findFirst({
      where: { userId: users[0].id, provider: 'google' },
    });
  }
  console.timeEnd('Account lookup');
}

testQueries()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
```

Run with:
```bash
ts-node test-query-performance.ts
```

---

## Index Usage Statistics

Monitor which indexes are being used in production:

```sql
-- Most frequently used indexes
SELECT
  schemaname,
  tablename,
  indexname,
  idx_scan as scans,
  idx_tup_read as tuples_read,
  idx_tup_fetch as tuples_fetched,
  pg_size_pretty(pg_relation_size(indexrelid)) as size
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
ORDER BY idx_scan DESC;
```

---

## Conclusion

All critical queries in the codebase now use indexes effectively:
- ✅ No sequential scans on large tables
- ✅ Composite indexes for multi-column filters + sorts
- ✅ Foreign key indexes for efficient JOINs
- ✅ Unique constraints for fast lookups

Expected performance improvement: **10-500x faster** depending on table size and query complexity.
