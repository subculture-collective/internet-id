# Database Seed Data

This directory contains seed data for local development and testing.

## Overview

The seed script (`seed.ts`) populates your local database with deterministic test data to make development and testing easier. Instead of manually creating users, contents, bindings, and verifications through API calls, you can use the seed script to set up a complete test environment.

## What Gets Seeded

The seed script creates:

1. **5 Test Users (Creator Accounts)**
   - Each with a deterministic Ethereum address
   - Associated email addresses: `creator1@example.com` through `creator5@example.com`
   - Display names: "Test Creator 1" through "Test Creator 5"

2. **5 Test Content Entries**
   - Sample video, image, audio, document, and tutorial files
   - Each with a content hash, IPFS URI, and manifest CID
   - Linked to creator accounts
   - Mock on-chain transaction hashes

3. **10 Platform Bindings**
   - YouTube (3 bindings)
   - TikTok (2 bindings)
   - GitHub (2 bindings)
   - Instagram (1 binding)
   - Discord (1 binding)
   - LinkedIn (1 binding)

4. **3 Verification Records**
   - Mix of verified and failed verifications
   - Linked to content entries

## Usage

### Initial Seed

After setting up your database for the first time:

```bash
# Generate Prisma client
npm run db:generate

# Run migrations
npm run db:migrate

# Seed the database
npm run db:seed
```

### Reset Database

To clear all data and reseed:

```bash
npm run db:reset
```

This command will:

1. Drop the database
2. Recreate it
3. Run all migrations
4. Execute the seed script

**⚠️ WARNING:** This will delete ALL data in your database!

### Manual Seed Only

If you just want to add seed data to an existing database (without dropping):

```bash
npm run db:seed
```

Note: This uses `upsert` operations, so it won't create duplicates if run multiple times.

## Test Data Details

### Test Wallets

All test wallets are derived from the public test mnemonic:

```
test test test test test test test test test test test junk
```

**⚠️ SECURITY WARNING:** These wallets are for testing ONLY. Never use them with real funds!

Test addresses (first 5):

- Creator 1: `0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266`
- Creator 2: `0x70997970C51812dc3A010C7d01b50e0d17dc79C8`
- Creator 3: `0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC`
- Creator 4: `0x90F79bf6EB2c4f870365E785982E1f101E93b906`
- Creator 5: `0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65`

### Sample Content

| Type     | Description       | Content Hash (prefix) | Platform Bindings    |
| -------- | ----------------- | --------------------- | -------------------- |
| Video    | Promotional video | 0x6c60...             | YouTube, TikTok      |
| Image    | Artwork image     | 0x5269...             | YouTube, Instagram   |
| Audio    | Podcast episode   | 0x1f60...             | TikTok, Discord      |
| Document | Whitepaper        | 0xba17...             | GitHub (2), LinkedIn |
| Video    | Tutorial video    | 0x4b8b...             | YouTube              |

### Platform Binding Examples

You can test verification flows with these bindings:

**YouTube:**

- `dQw4w9WgXcQ` → Promotional video
- `jNQXAC9IVRw` → Artwork image
- `9bZkp7q19f0` → Tutorial video

**TikTok:**

- `7123456789012345678` → Promotional video
- `7234567890123456789` → Podcast episode

**GitHub:**

- `octocat/Hello-World` → Whitepaper
- `torvalds/linux` → Whitepaper

**Instagram:**

- `CTestPost123` → Artwork image

**Discord:**

- `123456789012345678` → Podcast episode

**LinkedIn:**

- `test-article-123` → Whitepaper

## Development Tips

### Verify Seeded Data

Use Prisma Studio to browse the seeded data:

```bash
npm run db:studio
```

### Test API Endpoints

With seeded data, you can test API endpoints without creating data first:

```bash
# Start the API server
npm run start:api

# Verify a YouTube binding
curl http://localhost:3001/api/resolve?platform=youtube&platformId=dQw4w9WgXcQ

# Get all contents
curl http://localhost:3001/api/contents

# Get verifications
curl http://localhost:3001/api/verifications
```

### Integration Tests

The seed data uses the same factory functions as the test suite (`test/fixtures/factories.ts`), ensuring consistency between development and testing environments.

### Front-End Development

Front-end developers can use the seeded data to:

- Test content listing pages
- Verify platform binding lookups
- Display verification status
- Test user account displays

No on-chain writes are required during development since the seed data includes mock transaction hashes.

## Safety & Production

### Safe for Development

The seed script is designed to be safe for local development:

- ✅ Uses deterministic but fake data
- ✅ No real private keys or secrets
- ✅ All test accounts are public knowledge
- ✅ IPFS URIs are mock data
- ✅ Uses `upsert` to avoid duplicates

### NOT for Production

**❌ NEVER run this seed script in production:**

- The data is for testing only
- Test accounts have publicly known keys
- Content hashes are fake
- Platform IDs may conflict with real data

### Environment Detection

Consider adding environment checks to your deployment scripts to prevent accidental seeding in production:

```typescript
if (process.env.NODE_ENV === "production") {
  console.error("Cannot seed in production!");
  process.exit(1);
}
```

## Customization

To modify the seed data:

1. Edit `prisma/seed.ts`
2. Adjust the number of users, contents, or bindings
3. Change platform IDs to match your test cases
4. Run `npm run db:reset` to apply changes

## Troubleshooting

### Database Connection Error

If you see database connection errors:

```bash
# Check your DATABASE_URL in .env
cat .env | grep DATABASE_URL

# For PostgreSQL, ensure Docker is running
docker compose up -d

# For SQLite, check file permissions
ls -la dev.db
```

### Prisma Client Not Generated

```bash
# Regenerate the Prisma client
npm run db:generate
```

### Duplicate Key Errors

The seed script uses `upsert`, so this shouldn't happen. If it does:

```bash
# Reset the database completely
npm run db:reset
```

### TypeScript Errors

```bash
# Ensure ts-node is installed
npm install --legacy-peer-deps

# Rebuild
npm run build
```

## Related Documentation

- [Prisma Schema](./schema.prisma) - Database models
- [Contributor Onboarding Guide](../docs/CONTRIBUTOR_ONBOARDING.md) - Setup instructions
- [Test Fixtures](../test/fixtures/) - Test data factories
- [API Documentation](../README.md#api-reference-summary) - API endpoints

## Support

For issues or questions about seed data:

1. Check the [main README](../README.md)
2. Review the [Contributor Onboarding Guide](../docs/CONTRIBUTOR_ONBOARDING.md)
3. Open an issue on GitHub
