# Testing Documentation

## Overview

This project uses **Mocha** and **Chai** for testing, integrated via Hardhat's test runner. Tests cover backend services, database operations, IPFS upload logic, manifest handling, and platform verification workflows.

## Running Tests

### Run all tests
```bash
npm test
```

### Run specific test files
```bash
npx hardhat test test/upload-ipfs.test.ts
npx hardhat test test/database.test.ts
npx hardhat test test/verify-youtube.test.ts
```

### Run tests with specific pattern
```bash
npx hardhat test --grep "IPFS"
npx hardhat test --grep "Database Operations"
```

## Test Structure

Tests are organized in the `/test` directory:

```
test/
├── ContentRegistry.ts              # Smart contract tests
├── api-upload.ts                   # API file upload streaming tests
├── database.test.ts                # Database operations tests (new)
├── upload-ipfs.test.ts            # IPFS upload with provider fallback tests (new)
├── verify-youtube.test.ts         # YouTube verification logic tests (new)
├── routes/
│   └── routes.test.ts             # API route tests
└── services/
    ├── services.test.ts           # Service layer tests (hash, platform)
    ├── file.test.ts               # File service tests (new)
    ├── manifest.test.ts           # Manifest service tests (new)
    └── registry.test.ts           # Registry service tests (new)
```

## Test Coverage

Current test coverage includes:

### IPFS Upload Service (`upload-ipfs.test.ts`)
- ✅ Provider configuration (Web3.Storage, Pinata, Infura, Local node)
- ✅ Provider fallback mechanism
- ✅ Retry logic with exponential backoff
- ✅ Error handling (5xx, 4xx, timeouts)
- ✅ Response parsing (single-line, multi-line NDJSON)
- ✅ Authentication header formation
- ✅ CID masking for security

### Manifest Service (`manifest.test.ts`)
- ✅ HTTP/HTTPS JSON fetching
- ✅ IPFS URI parsing and gateway resolution
- ✅ Manifest structure validation
- ✅ Content hash format validation
- ✅ DID format validation
- ✅ Timestamp format validation

### Registry Service (`registry.test.ts`)
- ✅ Provider creation and configuration
- ✅ Contract instance creation
- ✅ Registry address resolution
- ✅ Contract ABI definitions
- ✅ Registry entry structure validation
- ✅ Platform identification

### YouTube Verification (`verify-youtube.test.ts`)
- ✅ YouTube URL parsing (standard, short, shorts)
- ✅ Video ID extraction
- ✅ Signature verification and recovery
- ✅ Manifest hash validation
- ✅ Timestamp validation
- ✅ Edge case handling

### Database Operations (`database.test.ts`)
- ✅ User CRUD operations
- ✅ Content CRUD operations
- ✅ Platform binding operations
- ✅ Verification record operations
- ✅ Complex queries with relations
- ✅ Error handling (unique constraints, not found, connection errors)
- ✅ Upsert operations

### File Service (`file.test.ts`)
- ✅ Temporary file path generation
- ✅ Filename sanitization
- ✅ Unique filename generation
- ✅ Path formatting

## Testing Conventions

### 1. Test Organization
- Group related tests using `describe()` blocks
- Use descriptive test names starting with "should"
- Organize tests by feature/functionality

### 2. Mocking External Dependencies
Tests use **Sinon** for mocking:

```typescript
import sinon from "sinon";
import axios from "axios";

describe("My Test", function () {
  let axiosStub: sinon.SinonStub;

  beforeEach(function () {
    axiosStub = sinon.stub(axios, "post");
  });

  afterEach(function () {
    sinon.restore();
  });

  it("should call axios", function () {
    axiosStub.resolves({ data: { result: "success" } });
    // ... test code
  });
});
```

### 3. Database Mocking
Database tests use mock Prisma clients to avoid actual database connections:

```typescript
const mockPrisma = {
  user: {
    create: sinon.stub(),
    findUnique: sinon.stub(),
    upsert: sinon.stub(),
  },
  // ... other models
};
```

### 4. Assertions
Use Chai's expect syntax:

```typescript
import { expect } from "chai";

expect(value).to.equal(expected);
expect(value).to.exist;
expect(value).to.be.an("array");
expect(value).to.include("substring");
expect(value).to.match(/pattern/);
```

### 5. Async Testing
Handle async code properly:

```typescript
it("should handle async operations", async function () {
  const result = await someAsyncFunction();
  expect(result).to.exist;
});
```

### 6. Environment Variables
Clean up environment variables in tests:

```typescript
afterEach(function () {
  delete process.env.TEST_VAR;
});
```

## Adding New Tests

### Step 1: Create Test File
Create a new file in `/test` or `/test/services`:

```bash
touch test/my-feature.test.ts
```

### Step 2: Write Test Structure
```typescript
import { expect } from "chai";
import sinon from "sinon";

describe("My Feature", function () {
  afterEach(function () {
    sinon.restore();
  });

  describe("Feature Aspect", function () {
    it("should do something", function () {
      // Arrange
      const input = "test";
      
      // Act
      const result = myFunction(input);
      
      // Assert
      expect(result).to.equal("expected");
    });
  });
});
```

### Step 3: Run Tests
```bash
npm test
```

## Mocking Guidelines

### External HTTP Calls
Mock axios or https for external API calls:

```typescript
const axiosStub = sinon.stub(axios, "post");
axiosStub.resolves({ data: { cid: "QmTest" } });
```

### Blockchain Calls
Mock ethers.js providers and contracts:

```typescript
const mockProvider = {} as any;
const mockContract = {
  methodName: sinon.stub().resolves(result),
};
sinon.stub(ethers, "Contract").returns(mockContract as any);
```

### File System Operations
Avoid mocking fs operations when possible. Test logic separately from I/O.

## Coverage Goals

Target: **70% minimum code coverage** on core modules

Note: Coverage percentages below are estimates based on test count and scope. Run `npm run test:coverage` for actual measured coverage.

Estimated coverage:
- Upload IPFS logic: High coverage (provider config, fallback, error handling)
- Manifest service: High coverage (URI parsing, structure validation)
- Registry service: High coverage (provider creation, configuration)
- Platform parsing: High coverage (URL parsing, validation)
- Database operations: High coverage (CRUD, upserts, queries)
- Verification flows: High coverage (signature verification, validation)

## CI Integration

Tests run automatically on:
- Pull requests
- Pushes to main branch
- Manual workflow dispatch

CI configuration in `.github/workflows/` (see issue #11).

## Troubleshooting

### Tests Timing Out
Increase timeout for slow tests:

```typescript
it("slow test", async function () {
  this.timeout(10000); // 10 seconds
  // ... test code
});
```

### Stubbing Errors
Ensure stubs are restored after each test:

```typescript
afterEach(function () {
  sinon.restore();
});
```

### Module Import Issues
Use proper TypeScript imports:

```typescript
import * as module from "./module";  // For default exports
import { function } from "./module"; // For named exports
```

## Best Practices

1. **Keep tests focused**: Each test should verify one behavior
2. **Use descriptive names**: Test names should explain what is being tested
3. **Avoid test interdependence**: Tests should run independently
4. **Mock external dependencies**: Don't make real HTTP/DB calls in unit tests
5. **Clean up after tests**: Use `afterEach` to restore stubs and clean state
6. **Test edge cases**: Include tests for error conditions and boundary values
7. **Keep tests maintainable**: Don't duplicate code, use helper functions
8. **Update tests with code**: When changing functionality, update tests

## Resources

- [Mocha Documentation](https://mochajs.org/)
- [Chai Assertion Library](https://www.chaijs.com/)
- [Sinon Mocking Library](https://sinonjs.org/)
- [Hardhat Testing](https://hardhat.org/hardhat-runner/docs/guides/test-contracts)
- [Testing Best Practices](https://testingjavascript.com/)
