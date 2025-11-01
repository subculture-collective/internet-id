# Database Schema Documentation

Complete documentation of the Internet-ID database schema, relationships, indexes, and design decisions.

## Table of Contents

- [Schema Overview](#schema-overview)
- [Core Tables](#core-tables)
- [Authentication Tables](#authentication-tables)
- [Relationships](#relationships)
- [Indexes](#indexes)
- [Design Decisions](#design-decisions)
- [Migrations](#migrations)

## Schema Overview

Internet-ID uses a relational database (PostgreSQL or SQLite) managed by Prisma ORM. The schema is defined in `prisma/schema.prisma`.

### Entity Relationship Diagram

```
┌─────────────────┐
│      User       │◄──────┐
│─────────────────│       │
│ id (PK)         │       │
│ email           │       │
│ name            │       │
│ walletAddress   │       │
│ createdAt       │       │
│ updatedAt       │       │
└────────┬────────┘       │
         │                │
         │ 1:N            │ 1:N
         │                │
┌────────▼────────┐       │
│    Content      │       │
│─────────────────│       │
│ id (PK)         │       │
│ contentHash     │────┐  │
│ manifestUri     │    │  │
│ creatorAddress  │    │  │
│ txHash          │    │  │
│ userId (FK)     │────┘  │
│ chainId         │       │
│ createdAt       │       │
└────────┬────────┘       │
         │                │
         │ 1:N            │
         │                │
┌────────▼────────────────┐
│  PlatformBinding        │
│─────────────────────────│
│ id (PK)                 │
│ platform                │
│ platformId              │
│ contentId (FK)          │
│ userId (FK)             │◄────┘
│ createdAt               │
└─────────────────────────┘

┌────────────────┐
│ Verification   │
│────────────────│
│ id (PK)        │
│ contentId (FK) │◄─── Content
│ verifiedAt     │
│ verified       │
│ ipAddress      │
└────────────────┘

┌──────────────────────────┐
│ NextAuth Tables          │
├──────────────────────────┤
│ Account                  │◄─── User (1:N)
│ Session                  │◄─── User (1:N)
│ VerificationToken        │
└──────────────────────────┘
```

## Core Tables

### Content

Stores registered content metadata.

```prisma
model Content {
  id              Int                @id @default(autoincrement())
  contentHash     String             @unique
  manifestUri     String
  creatorAddress  String
  txHash          String?
  userId          Int?
  chainId         Int                @default(1)
  createdAt       DateTime           @default(now())
  user            User?              @relation(fields: [userId], references: [id])
  bindings        PlatformBinding[]
  verifications   Verification[]

  @@index([creatorAddress])
  @@index([userId])
  @@index([createdAt])
}
```

**Fields**:

- `id`: Primary key, auto-increment integer
- `contentHash`: SHA-256 hash of content (hex string), unique
- `manifestUri`: IPFS URI to manifest JSON (e.g., `ipfs://Qm...`)
- `creatorAddress`: Ethereum address of content creator
- `txHash`: Blockchain transaction hash of registration (optional)
- `userId`: Foreign key to User table (optional, for authenticated users)
- `chainId`: EVM chain ID where content is registered (e.g., 1=Ethereum, 8453=Base)
- `createdAt`: Timestamp when record was created

**Indexes**:

- `contentHash`: Unique index for fast lookup
- `creatorAddress`: Non-unique index for filtering by creator
- `userId`: Foreign key index for user's content
- `createdAt`: Temporal queries (recent content)

**Use Cases**:

- Look up content by hash
- Find all content by a creator
- List user's registered content
- Query recent registrations

---

### PlatformBinding

Links platform-specific content (e.g., YouTube videos) to original content.

```prisma
model PlatformBinding {
  id          Int      @id @default(autoincrement())
  platform    String
  platformId  String
  contentId   Int
  userId      Int?
  createdAt   DateTime @default(now())
  content     Content  @relation(fields: [contentId], references: [id], onDelete: Cascade)
  user        User?    @relation(fields: [userId], references: [id])

  @@unique([platform, platformId])
  @@index([contentId])
  @@index([userId])
}
```

**Fields**:

- `id`: Primary key
- `platform`: Platform name (e.g., "youtube", "tiktok", "twitter")
- `platformId`: Platform-specific content ID (e.g., YouTube video ID)
- `contentId`: Foreign key to Content table
- `userId`: Foreign key to User table (who created the binding)
- `createdAt`: Binding creation timestamp

**Indexes**:

- `(platform, platformId)`: Unique composite index for fast platform binding lookup
- `contentId`: Foreign key index for content's bindings
- `userId`: Foreign key index for user's bindings

**Use Cases**:

- Resolve YouTube URL to original content: `SELECT * WHERE platform='youtube' AND platformId='dQw4w9WgXcQ'`
- List all bindings for a content: `SELECT * WHERE contentId=123`
- Find user's platform bindings

---

### Verification

Tracks verification attempts and results.

```prisma
model Verification {
  id         Int      @id @default(autoincrement())
  contentId  Int
  verifiedAt DateTime @default(now())
  verified   Boolean
  ipAddress  String?
  content    Content  @relation(fields: [contentId], references: [id], onDelete: Cascade)

  @@index([contentId])
  @@index([verifiedAt])
}
```

**Fields**:

- `id`: Primary key
- `contentId`: Foreign key to Content table
- `verifiedAt`: Timestamp of verification attempt
- `verified`: Verification result (true/false)
- `ipAddress`: IP address of verifier (for analytics, optional)

**Indexes**:

- `contentId`: Foreign key index for content's verification history
- `verifiedAt`: Temporal queries (recent verifications)

**Use Cases**:

- Verification history for content
- Analytics: verification success rate
- Time-series verification data

---

## Authentication Tables

### User

User accounts with OAuth provider linkage.

```prisma
model User {
  id               Int                @id @default(autoincrement())
  email            String?            @unique
  emailVerified    DateTime?
  name             String?
  image            String?
  walletAddress    String?            @unique
  createdAt        DateTime           @default(now())
  updatedAt        DateTime           @updatedAt
  accounts         Account[]
  sessions         Session[]
  contents         Content[]
  platformBindings PlatformBinding[]

  @@index([walletAddress])
}
```

**Fields**:

- `id`: Primary key
- `email`: User email (from OAuth or manual entry)
- `emailVerified`: Email verification timestamp (NextAuth)
- `name`: Display name
- `image`: Profile image URL
- `walletAddress`: Ethereum wallet address (optional, for Web3 login)
- `createdAt`: Account creation timestamp
- `updatedAt`: Last update timestamp

**Indexes**:

- `email`: Unique index for email-based lookup
- `walletAddress`: Unique index for wallet-based lookup

**Relationships**:

- One user has many accounts (OAuth providers)
- One user has many sessions
- One user has many registered contents
- One user has many platform bindings

---

### Account

OAuth provider accounts linked to users (NextAuth).

```prisma
model Account {
  id                Int     @id @default(autoincrement())
  userId            Int
  type              String
  provider          String
  providerAccountId String
  refresh_token     String? @db.Text
  access_token      String? @db.Text
  expires_at        Int?
  token_type        String?
  scope             String?
  id_token          String? @db.Text
  session_state     String?
  user              User    @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([provider, providerAccountId])
  @@index([userId])
}
```

**Fields**:

- `userId`: Foreign key to User table
- `type`: Account type (e.g., "oauth")
- `provider`: OAuth provider name (e.g., "github", "google")
- `providerAccountId`: Provider's user ID
- `refresh_token`, `access_token`: OAuth tokens (encrypted at rest)
- `expires_at`: Token expiration timestamp
- `token_type`, `scope`: OAuth metadata
- `id_token`, `session_state`: OpenID Connect data

**Indexes**:

- `(provider, providerAccountId)`: Unique composite for provider account lookup
- `userId`: Foreign key index

**Use Cases**:

- Link multiple OAuth accounts to one user
- Verify user owns a specific platform account
- Refresh expired OAuth tokens

---

### Session

Active user sessions (NextAuth).

```prisma
model Session {
  id           Int      @id @default(autoincrement())
  sessionToken String   @unique
  userId       Int
  expires      DateTime
  user         User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
}
```

**Fields**:

- `sessionToken`: Unique session identifier (JWT or database token)
- `userId`: Foreign key to User table
- `expires`: Session expiration timestamp

**Use Cases**:

- Maintain authenticated sessions
- Validate session tokens
- Expire old sessions

---

### VerificationToken

Email verification and password reset tokens (NextAuth).

```prisma
model VerificationToken {
  identifier String
  token      String   @unique
  expires    DateTime

  @@unique([identifier, token])
}
```

**Fields**:

- `identifier`: User identifier (email)
- `token`: Random verification token
- `expires`: Token expiration timestamp

**Use Cases**:

- Email verification on signup
- Password reset flows
- Magic link authentication

---

## Relationships

### User ↔ Content (1:N)

One user can register many contents.

```sql
-- Find all contents registered by user
SELECT * FROM Content WHERE userId = 123;

-- Find user who registered content
SELECT u.* FROM User u
JOIN Content c ON c.userId = u.id
WHERE c.contentHash = '0xabc...';
```

### Content ↔ PlatformBinding (1:N)

One content can have multiple platform bindings.

```sql
-- Find all bindings for content
SELECT * FROM PlatformBinding WHERE contentId = 456;

-- Find content for YouTube video
SELECT c.* FROM Content c
JOIN PlatformBinding pb ON pb.contentId = c.id
WHERE pb.platform = 'youtube' AND pb.platformId = 'dQw4w9WgXcQ';
```

### Content ↔ Verification (1:N)

One content can have multiple verification attempts.

```sql
-- Verification history for content
SELECT * FROM Verification
WHERE contentId = 789
ORDER BY verifiedAt DESC;

-- Verification success rate for content
SELECT
  contentId,
  COUNT(*) as total_verifications,
  SUM(CASE WHEN verified THEN 1 ELSE 0 END) as successful,
  CAST(SUM(CASE WHEN verified THEN 1 ELSE 0 END) AS FLOAT) / COUNT(*) as success_rate
FROM Verification
WHERE contentId = 789
GROUP BY contentId;
```

### User ↔ Account (1:N)

One user can link multiple OAuth accounts.

```sql
-- Find all OAuth accounts for user
SELECT provider, providerAccountId FROM Account WHERE userId = 123;

-- Find user by GitHub account
SELECT u.* FROM User u
JOIN Account a ON a.userId = u.id
WHERE a.provider = 'github' AND a.providerAccountId = '12345678';
```

## Indexes

### Performance Indexes

**17 total indexes** optimize query performance:

1. **Content.contentHash** (UNIQUE): Primary lookup key
2. **Content.creatorAddress**: Filter by creator
3. **Content.userId**: User's content
4. **Content.createdAt**: Recent content queries
5. **PlatformBinding.(platform, platformId)** (UNIQUE): Platform resolution
6. **PlatformBinding.contentId**: Content's bindings
7. **PlatformBinding.userId**: User's bindings
8. **Verification.contentId**: Content's verification history
9. **Verification.verifiedAt**: Recent verifications
10. **User.email** (UNIQUE): Email lookup
11. **User.walletAddress** (UNIQUE): Wallet lookup
12. **Account.(provider, providerAccountId)** (UNIQUE): OAuth account lookup
13. **Account.userId**: User's accounts
14. **Session.sessionToken** (UNIQUE): Session validation
15. **Session.userId**: User's sessions
16. **VerificationToken.token** (UNIQUE): Token lookup
17. **VerificationToken.(identifier, token)** (UNIQUE): Composite token lookup

### Index Strategy

- **Unique indexes**: Enforce data integrity and enable fast exact lookups
- **Foreign key indexes**: Optimize JOIN operations
- **Temporal indexes**: Support time-based queries (recent, historical)
- **Composite indexes**: Optimize multi-column WHERE clauses

See: [Database Indexing Strategy](./DATABASE_INDEXING_STRATEGY.md)

## Design Decisions

### Why contentHash instead of CID?

- **Platform Independence**: SHA-256 hash computed locally before IPFS upload
- **Consistency**: Same hash across all IPFS providers and gateways
- **Contract Compatibility**: Solidity handles bytes32 efficiently
- **Privacy**: Hash doesn't reveal content location

### Why optional userId?

- **Public Verification**: Anyone can verify content without account
- **Anonymous Registration**: Allow CLI/API usage without web login
- **Gradual Migration**: Add user accounts after initial MVP

### Why separate PlatformBinding table?

- **Normalization**: One content → many platform bindings
- **Flexibility**: Add new platforms without schema changes
- **Query Efficiency**: Fast platform-specific lookups with composite index

### Why track verifications?

- **Analytics**: Understand verification patterns and success rates
- **Debugging**: Diagnose verification failures
- **Metrics**: Content popularity and trust signals
- **Rate Limiting**: Prevent verification spam per content

### Why NextAuth schema?

- **Standard Pattern**: Follows NextAuth.js conventions
- **Proven Design**: Battle-tested schema for OAuth flows
- **Flexibility**: Support multiple providers easily
- **Security**: Built-in session management and CSRF protection

### Why SQLite and PostgreSQL support?

- **Development**: SQLite for easy local setup, no server needed
- **Production**: PostgreSQL for better performance, concurrency, features
- **Portability**: Same schema works on both (with minor type differences)

## Migrations

### Creating Migrations

```bash
# Create new migration after schema changes
npx prisma migrate dev --name description_of_changes

# Example
npx prisma migrate dev --name add_chain_id_to_content
```

### Applying Migrations

```bash
# Apply pending migrations (production)
npx prisma migrate deploy

# Reset database (development only - deletes all data!)
npx prisma migrate reset
```

### Migration History

Migrations are stored in `prisma/migrations/` with timestamps:

```
prisma/migrations/
├── 20240101_init/
│   └── migration.sql
├── 20240115_add_platform_bindings/
│   └── migration.sql
└── migration_lock.toml
```

### Migration Best Practices

1. **Never edit applied migrations**: Create new migration instead
2. **Test migrations**: On development database first
3. **Backup before migrating**: Always backup production data
4. **Review SQL**: Check generated SQL in migration files
5. **Incremental changes**: Small, focused migrations are safer

## Schema Validation

### Verify Schema Integrity

```bash
# Check schema is valid
npx prisma validate

# Generate Prisma Client (checks schema)
npx prisma generate

# Check database matches schema
npx prisma db pull  # Shows if database differs
```

### Check Indexes

```bash
# Verify indexes exist
npm run db:verify-indexes

# SQLite: View indexes
sqlite3 dev.db ".indexes"

# PostgreSQL: View indexes
psql $DATABASE_URL -c "\di"
```

## Query Examples

### Common Queries

**Find content by hash**:

```sql
SELECT * FROM "Content" WHERE "contentHash" = '0xabc123...';
```

**Resolve YouTube video to content**:

```sql
SELECT c.*
FROM "Content" c
JOIN "PlatformBinding" pb ON pb."contentId" = c.id
WHERE pb.platform = 'youtube' AND pb."platformId" = 'dQw4w9WgXcQ';
```

**List user's registered content**:

```sql
SELECT * FROM "Content"
WHERE "userId" = 123
ORDER BY "createdAt" DESC;
```

**Find content by creator address**:

```sql
SELECT * FROM "Content"
WHERE "creatorAddress" = '0x1234567890123456789012345678901234567890'
ORDER BY "createdAt" DESC;
```

**Verification statistics**:

```sql
SELECT
  c."contentHash",
  COUNT(v.id) as total_verifications,
  SUM(CASE WHEN v.verified THEN 1 ELSE 0 END) as successful_verifications,
  MAX(v."verifiedAt") as last_verification
FROM "Content" c
LEFT JOIN "Verification" v ON v."contentId" = c.id
GROUP BY c.id, c."contentHash";
```

**Recent verifications**:

```sql
SELECT c."contentHash", v.verified, v."verifiedAt", v."ipAddress"
FROM "Verification" v
JOIN "Content" c ON c.id = v."contentId"
WHERE v."verifiedAt" > NOW() - INTERVAL '24 hours'
ORDER BY v."verifiedAt" DESC;
```

**User's OAuth providers**:

```sql
SELECT u.email, a.provider, a."providerAccountId"
FROM "User" u
JOIN "Account" a ON a."userId" = u.id
WHERE u.id = 123;
```

## Performance Considerations

### Query Optimization

- Use indexed columns in WHERE clauses
- Avoid `SELECT *` in production (specify needed columns)
- Use LIMIT for pagination
- Index foreign keys used in JOINs

### Connection Pooling

Configure in `DATABASE_URL`:

```
postgresql://user:pass@host:5432/db?connection_limit=10
```

### Caching Layer

Use Redis to cache frequent queries:

- Content metadata (10min TTL)
- Platform bindings (3min TTL)
- User profiles (5min TTL)

See: [Caching Architecture](./CACHING_ARCHITECTURE.md)

## Backup and Recovery

### Backup Strategies

**SQLite**:

```bash
# Simple file copy
cp dev.db dev.db.backup

# Or use SQLite backup API
sqlite3 dev.db ".backup backup.db"
```

**PostgreSQL**:

```bash
# Full backup
pg_dump $DATABASE_URL > backup.sql

# Compressed backup
pg_dump $DATABASE_URL | gzip > backup.sql.gz

# Restore
psql $DATABASE_URL < backup.sql
```

See: [Database Backup & Recovery Guide](./ops/DATABASE_BACKUP_RECOVERY.md)

## Monitoring

### Database Health Checks

```typescript
// Check database connection
import prisma from "./prisma/client";

async function checkDatabase() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return { status: "connected" };
  } catch (error) {
    return { status: "error", error };
  }
}
```

### Slow Query Logging

**PostgreSQL**:

```sql
-- Enable slow query log (>1 second)
ALTER DATABASE internetid SET log_min_duration_statement = 1000;
```

**Prisma**:

```typescript
const prisma = new PrismaClient({
  log: [
    { emit: "event", level: "query" },
    { emit: "event", level: "error" },
  ],
});

prisma.$on("query", (e) => {
  if (e.duration > 1000) {
    console.warn("Slow query:", e.query, `(${e.duration}ms)`);
  }
});
```

## Additional Resources

- [Prisma Documentation](https://www.prisma.io/docs/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Database Indexing Strategy](./DATABASE_INDEXING_STRATEGY.md)
- [Query Optimization Examples](./QUERY_OPTIMIZATION_EXAMPLES.md)
- [Caching Architecture](./CACHING_ARCHITECTURE.md)
- [Database Backup & Recovery](./ops/DATABASE_BACKUP_RECOVERY.md)
