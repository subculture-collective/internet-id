# Integration Tests

This directory contains integration tests that validate the complete flow of API routes, database operations, and blockchain interactions.

## Overview

Integration tests cover:

- **Content Registration Workflow**: Upload file → generate manifest → register on-chain → verify status
- **Platform Binding Workflow**: Bind platform account → resolve binding → verify ownership
- **API Endpoints**: Full HTTP API testing with database and blockchain integration
- **Error Scenarios**: Failed transactions, database conflicts, invalid inputs

## Prerequisites

### Required

- Node.js >= 20
- Hardhat (installed via npm)

### Optional (for full database integration)

- PostgreSQL database (can use Docker Compose)
- Redis (for rate limiting tests)

## Running Integration Tests

### Quick Start (Minimum Setup)

Integration tests can run with minimal setup. They will use Hardhat's in-process blockchain network:

```bash
# Run all integration tests
npm run test:integration

# Run all tests (including integration)
npm test
```

Note: Without a database connection, some tests will be skipped automatically.

### Full Setup with Database

For complete integration testing including database operations:

1. **Start PostgreSQL with Docker Compose:**

   ```bash
   docker compose up -d db
   ```

2. **Set environment variables:**

   ```bash
   export DATABASE_URL="postgresql://internetid:internetid@localhost:5432/internetid?schema=public"
   ```

3. **Run migrations:**

   ```bash
   npm run db:migrate
   ```

4. **Run integration tests:**
   ```bash
   npm run test:integration
   ```

### Test Database Setup

For isolated testing, you can use a separate test database:

```bash
# Create test database
createdb internetid_test

# Set test database URL
export DATABASE_URL="postgresql://internetid:internetid@localhost:5432/internetid_test?schema=public"

# Run migrations
npm run db:migrate

# Run tests
npm run test:integration
```

## Test Structure

### Fixtures and Factories

Located in `test/fixtures/`:

- **factories.ts**: Factory functions for creating test data (users, content, bindings)
- **helpers.ts**: Test environment setup utilities (database, blockchain, server)

Example usage:

```typescript
import { createTestUser, createTestContent, createTestFile } from "../fixtures/factories";
import { IntegrationTestEnvironment } from "../fixtures/helpers";

const env = new IntegrationTestEnvironment();
await env.setup();

const user = createTestUser({ email: "test@example.com" });
const content = createTestContent({ creatorAddress: user.address });
```

### Test Files

- **content-workflow.test.ts**: Tests complete content registration lifecycle
- **binding-workflow.test.ts**: Tests platform binding and resolution
- **api-endpoints.test.ts**: Tests HTTP API endpoints

## Environment Variables

Integration tests use these environment variables:

```bash
# Database (required for full tests)
DATABASE_URL="postgresql://user:password@localhost:5432/dbname"

# Blockchain (automatic for tests)
RPC_URL="http://127.0.0.1:8545"  # Set automatically to Hardhat network

# Optional
API_KEY="test-api-key"  # For testing authenticated endpoints
REDIS_URL="redis://localhost:6379"  # For rate limiting tests
```

## Cleanup and Isolation

Integration tests use several strategies for test isolation:

1. **Database Cleanup**: After each test, all database tables are cleared
2. **Blockchain Reset**: Each test uses fresh contract deployments
3. **Environment Restoration**: Original environment variables are restored after tests

## Continuous Integration

Integration tests run automatically in CI on every pull request. See `.github/workflows/ci.yml` for configuration.

### CI Requirements

The CI environment includes:

- PostgreSQL service container
- All required environment variables
- Hardhat for blockchain testing

## Writing New Integration Tests

### Basic Structure

```typescript
import { expect } from "chai";
import { IntegrationTestEnvironment } from "../fixtures/helpers";
import { createTestFile } from "../fixtures/factories";

describe("Integration: My Feature", function () {
  this.timeout(30000); // Blockchain operations can be slow

  let env: IntegrationTestEnvironment;
  let registryAddress: string;

  before(async function () {
    env = new IntegrationTestEnvironment();
    await env.setup();

    // Deploy contracts and setup
    const creator = env.blockchain.getSigner(0);
    registryAddress = await env.blockchain.deployRegistry(creator);
  });

  after(async function () {
    await env.teardown();
  });

  afterEach(async function () {
    await env.cleanup();
  });

  it("should test my feature", async function () {
    // Test implementation
  });
});
```

### Testing API Endpoints

```typescript
import request from "supertest";

const app = env.server.getApp();

const response = await request(app).get("/api/health").expect(200);

expect(response.body).to.deep.equal({ ok: true });
```

### Testing Blockchain Operations

```typescript
const registry = env.blockchain.getRegistry();
const tx = await registry.register(contentHash, manifestUri);
const receipt = await tx.wait();

expect(receipt.status).to.equal(1);
```

### Testing Database Operations

```typescript
const prisma = env.db.getClient();

await prisma.content.create({
  data: {
    contentHash: testFile.hash,
    manifestUri: "ipfs://QmTest",
    creatorAddress: creator.address,
  },
});

const content = await prisma.content.findUnique({
  where: { contentHash: testFile.hash },
});

expect(content).to.exist;
```

## Debugging Failed Tests

### View Test Output

```bash
# Run with verbose output
npm test -- --reporter spec

# Run specific test file
npx hardhat test test/integration/content-workflow.test.ts

# Run specific test
npx hardhat test --grep "should complete full workflow"
```

### Common Issues

1. **Database Connection Errors**
   - Ensure PostgreSQL is running: `docker compose ps`
   - Check DATABASE_URL is set correctly
   - Verify migrations are applied: `npm run db:migrate`

2. **Blockchain Errors**
   - Hardhat network starts automatically
   - If issues persist, try: `npm run clean && npm run build`

3. **Timeout Errors**
   - Increase timeout in test: `this.timeout(60000)`
   - Check for hanging promises or missing awaits

4. **Rate Limit Errors**
   - Tests use in-memory rate limiting by default
   - Set REDIS_URL for distributed rate limiting tests

## Performance

Integration tests typically complete in:

- Content workflow: ~5-10 seconds
- Binding workflow: ~5-10 seconds
- API endpoints: ~5-10 seconds
- Full suite: ~20-30 seconds

## Best Practices

1. **Use Factories**: Always use factory functions for test data
2. **Clean Between Tests**: Use `afterEach` for cleanup
3. **Descriptive Names**: Test names should clearly describe what's being tested
4. **Test Isolation**: Each test should be independent
5. **Error Testing**: Include negative test cases for error scenarios
6. **Timeouts**: Set appropriate timeouts for blockchain operations

## Troubleshooting

### Tests Hang

Check for:

- Missing `await` keywords
- Unclosed database connections
- Unresolved promises

### Tests Fail Intermittently

Possible causes:

- Race conditions (ensure proper sequencing)
- Shared state between tests (improve cleanup)
- External service issues (add retries)

### Database Schema Mismatch

```bash
# Reset database
npm run db:migrate -- --name reset

# Generate fresh Prisma client
npm run db:generate
```

## Additional Resources

- [Hardhat Testing Guide](https://hardhat.org/tutorial/testing-contracts)
- [Prisma Testing Guide](https://www.prisma.io/docs/guides/testing)
- [Supertest Documentation](https://github.com/visionmedia/supertest)
- [Mocha Documentation](https://mochajs.org/)
