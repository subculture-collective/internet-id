# Debugging Guide

This guide covers debugging techniques for all components of Internet-ID: backend/API, frontend/web UI, and smart contracts.

## Table of Contents

- [General Debugging Tips](#general-debugging-tips)
- [Backend/API Debugging](#backendapi-debugging)
- [Frontend Debugging (Next.js)](#frontend-debugging-nextjs)
- [Smart Contract Debugging](#smart-contract-debugging)
- [Common Error Patterns](#common-error-patterns)
- [Performance Debugging](#performance-debugging)
- [Tools and Extensions](#tools-and-extensions)

## General Debugging Tips

### Enable Verbose Logging

```bash
# Set log level in .env
LOG_LEVEL=debug

# Or for trace-level logging (very verbose)
LOG_LEVEL=trace
```

### Use Correlation IDs

All API requests are logged with correlation IDs for request tracing:

```bash
# Search logs by correlation ID
grep "correlationId=abc-123" logs/app.log

# Or if using structured logging to external service
# Search by metadata.correlationId in your log viewer
```

### Check Health Endpoints

```bash
# API health check
curl http://localhost:3001/api/health

# Expected response:
{
  "status": "ok",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "uptime": 12345,
  "database": "connected",
  "cache": "connected",
  "blockchain": "connected"
}
```

## Backend/API Debugging

### Running with Debugger (VS Code)

1. **Create debug configuration** (`.vscode/launch.json`):

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "node",
      "request": "launch",
      "name": "Debug API Server",
      "runtimeExecutable": "npm",
      "runtimeArgs": ["run", "start:api"],
      "skipFiles": ["<node_internals>/**"],
      "env": {
        "LOG_LEVEL": "debug",
        "NODE_ENV": "development"
      },
      "console": "integratedTerminal",
      "internalConsoleOptions": "neverOpen"
    },
    {
      "type": "node",
      "request": "launch",
      "name": "Debug Tests",
      "program": "${workspaceFolder}/node_modules/.bin/hardhat",
      "args": ["test", "${file}"],
      "console": "integratedTerminal",
      "internalConsoleOptions": "neverOpen"
    },
    {
      "type": "node",
      "request": "launch",
      "name": "Debug Single Test",
      "program": "${workspaceFolder}/node_modules/.bin/hardhat",
      "args": ["test", "--grep", "${input:testName}"],
      "console": "integratedTerminal"
    }
  ],
  "inputs": [
    {
      "id": "testName",
      "type": "promptString",
      "description": "Test name pattern to run"
    }
  ]
}
```

2. **Set breakpoints** in your code (click in gutter)

3. **Start debugging** (F5 or Debug panel)

4. **Use debug controls**:
   - Continue (F5)
   - Step Over (F10)
   - Step Into (F11)
   - Step Out (Shift+F11)
   - Restart (Ctrl+Shift+F5)
   - Stop (Shift+F5)

### Using Node.js Built-in Debugger

```bash
# Run with inspect flag
node --inspect scripts/api.ts

# In another terminal
node inspect localhost:9229

# Or use Chrome DevTools
# Navigate to: chrome://inspect
# Click "inspect" under Remote Target
```

### Debugging with Console Logging

Strategic use of `console.log` (or logger):

```typescript
import logger from "./logger";

// Log with context
logger.info({ contentHash, manifestUri }, "Registering content");

// Log errors with stack trace
logger.error({ err, contentHash }, "Registration failed");

// Debug-level detailed logs
logger.debug({ request: req.body }, "Received registration request");
```

### Debugging IPFS Uploads

```typescript
// Add detailed logging to IPFS service
import logger from "./logger";

async function uploadToIPFS(file: Buffer): Promise<string> {
  logger.debug({ fileSize: file.length }, "Starting IPFS upload");
  
  try {
    const cid = await ipfsClient.add(file);
    logger.info({ cid: cid.toString() }, "IPFS upload successful");
    return cid.toString();
  } catch (error) {
    logger.error({ error, fileSize: file.length }, "IPFS upload failed");
    throw error;
  }
}
```

**Common IPFS issues**:
- Check provider credentials in `.env`
- Verify network connectivity
- Check file size limits
- Review provider status pages

### Debugging Blockchain Interactions

```typescript
// Enable Ethers.js debug logging
import { ethers } from "ethers";

const provider = new ethers.JsonRpcProvider(rpcUrl);

// Log transaction details before sending
logger.debug({
  to: contractAddress,
  data: encodedData,
  gasLimit: estimatedGas,
}, "Sending transaction");

try {
  const tx = await contract.register(contentHash, manifestUri);
  logger.info({ txHash: tx.hash }, "Transaction sent");
  
  const receipt = await tx.wait();
  logger.info({ 
    txHash: receipt.hash,
    blockNumber: receipt.blockNumber,
    gasUsed: receipt.gasUsed.toString()
  }, "Transaction confirmed");
} catch (error) {
  if (error.code === "CALL_EXCEPTION") {
    logger.error({ error, reason: error.reason }, "Contract call reverted");
  } else if (error.code === "INSUFFICIENT_FUNDS") {
    logger.error("Insufficient funds for transaction");
  } else {
    logger.error({ error }, "Transaction failed");
  }
}
```

**Common blockchain issues**:
- Insufficient gas: Increase gas limit or get testnet ETH
- RPC errors: Check RPC_URL connectivity
- Contract not found: Verify deployment and address
- Transaction reverted: Check contract logic and inputs

### Debugging Database Queries

Enable Prisma query logging:

```typescript
// prisma/client.ts
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient({
  log: ["query", "info", "warn", "error"],
});

export default prisma;
```

Prisma Studio for visual debugging:

```bash
# Open Prisma Studio
npm run db:studio

# Browse to http://localhost:5555
# View and edit data visually
```

### API Request/Response Debugging

Use `curl` with verbose output:

```bash
# Verbose request
curl -v http://localhost:3001/api/health

# With headers
curl -H "x-api-key: your-key" \
     -H "Content-Type: application/json" \
     -v http://localhost:3001/api/register

# Save response to file
curl -v http://localhost:3001/api/contents > response.json
```

Use Postman or Insomnia:
- Import OpenAPI spec from `/api/docs`
- Set up environment variables
- Create request collections
- Save and share debugging scenarios

### Debugging Rate Limiting

```bash
# Check rate limit headers in response
curl -v http://localhost:3001/api/verify

# Look for:
# X-RateLimit-Limit: 100
# X-RateLimit-Remaining: 99
# X-RateLimit-Reset: 1704556800

# Debug Redis rate limit store
redis-cli
> KEYS rate-limit:*
> GET rate-limit:127.0.0.1:/api/verify
```

## Frontend Debugging (Next.js)

### Using React DevTools

1. **Install extension**:
   - Chrome: [React Developer Tools](https://chrome.google.com/webstore/detail/react-developer-tools/fmkadmapgofadopljbjfkapdkoienihi)
   - Firefox: [React DevTools](https://addons.mozilla.org/en-US/firefox/addon/react-devtools/)

2. **Inspect components**:
   - Open DevTools (F12)
   - Select "Components" tab
   - Click on component in tree
   - View props, state, hooks

3. **Profile performance**:
   - Select "Profiler" tab
   - Click record button
   - Interact with app
   - Stop recording
   - Analyze render times

### Next.js Debug Mode

```bash
# Development with debug output
NODE_OPTIONS='--inspect' npm run dev

# Or set in web/.env.local
NODE_OPTIONS=--inspect
```

### Client-Side Debugging

```typescript
// app/components/UploadForm.tsx
"use client";

import { useState, useEffect } from "react";

export default function UploadForm() {
  const [file, setFile] = useState<File | null>(null);
  
  // Debug state changes
  useEffect(() => {
    console.log("File changed:", file);
  }, [file]);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Form submitted with file:", file);
    
    try {
      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });
      
      console.log("Upload response:", await response.json());
    } catch (error) {
      console.error("Upload failed:", error);
    }
  };
  
  return <form onSubmit={handleSubmit}>...</form>;
}
```

### Server Component Debugging

```typescript
// app/contents/page.tsx
import { getContents } from "@/lib/db";

export default async function ContentsPage() {
  // Server-side logging
  console.log("Fetching contents for page render");
  
  const contents = await getContents();
  
  console.log(`Fetched ${contents.length} contents`);
  
  return <div>...</div>;
}
```

### API Route Debugging

```typescript
// app/api/verify/route.ts
import { NextRequest, NextResponse } from "next/server";
import logger from "@/lib/logger";

export async function POST(request: NextRequest) {
  const body = await request.json();
  
  logger.debug({ body }, "Verify API called");
  
  try {
    const result = await verifyContent(body);
    logger.info({ result }, "Verification completed");
    return NextResponse.json(result);
  } catch (error) {
    logger.error({ error }, "Verification failed");
    return NextResponse.json(
      { error: "Verification failed" },
      { status: 500 }
    );
  }
}
```

### Network Requests (Browser DevTools)

1. Open DevTools (F12)
2. Select "Network" tab
3. Reload page or trigger requests
4. Click on request to see:
   - Headers (request & response)
   - Payload (request body)
   - Response (data returned)
   - Timing (performance)

### Browser Console Debugging

```typescript
// Add debug utilities to window object
if (typeof window !== "undefined") {
  (window as any).debug = {
    enableVerbose: () => localStorage.setItem("debug", "true"),
    disableVerbose: () => localStorage.removeItem("debug"),
    clearCache: () => localStorage.clear(),
  };
}

// Use in browser console:
// window.debug.enableVerbose()
```

## Smart Contract Debugging

### Using Hardhat Console

```bash
# Start Hardhat console
npx hardhat console --network localhost

# In console:
> const ContentRegistry = await ethers.getContractFactory("ContentRegistry");
> const registry = await ContentRegistry.attach("0x5FbDB2...");
> const entry = await registry.entries("0xabc123...");
> console.log(entry);
```

### Using Hardhat's `console.log` in Solidity

```solidity
// contracts/ContentRegistry.sol
import "hardhat/console.sol";

contract ContentRegistry {
    function register(bytes32 contentHash, string memory manifestUri) external {
        console.log("Registering content:");
        console.logBytes32(contentHash);
        console.log("Manifest URI:", manifestUri);
        console.log("Creator:", msg.sender);
        
        // Contract logic...
    }
}
```

Run tests to see console output:

```bash
npx hardhat test
```

### Debugging Test Failures

```typescript
// test/ContentRegistry.test.ts
import { expect } from "chai";
import { ethers } from "hardhat";

describe("ContentRegistry", function () {
  it("should register content", async function () {
    const [creator] = await ethers.getSigners();
    
    // Log test context
    console.log("Creator address:", creator.address);
    console.log("Creator balance:", await ethers.provider.getBalance(creator.address));
    
    const ContentRegistry = await ethers.getContractFactory("ContentRegistry");
    const registry = await ContentRegistry.deploy();
    await registry.waitForDeployment();
    
    const address = await registry.getAddress();
    console.log("Registry deployed at:", address);
    
    const contentHash = ethers.keccak256(ethers.toUtf8Bytes("test"));
    console.log("Content hash:", contentHash);
    
    // Send transaction
    const tx = await registry.register(contentHash, "ipfs://test");
    console.log("Transaction hash:", tx.hash);
    
    const receipt = await tx.wait();
    console.log("Gas used:", receipt?.gasUsed.toString());
    
    // Verify state
    const entry = await registry.entries(contentHash);
    console.log("Stored entry:", entry);
    
    expect(entry.creator).to.equal(creator.address);
  });
});
```

### Gas Profiling

```bash
# Enable gas reporting
REPORT_GAS=true npx hardhat test

# Output:
# ·----------------------------------------|---------------------------|-------------|-----------------------------·
# |  Solc version: 0.8.22                  ·  Optimizer enabled: true  ·  Runs: 200  ·  Block limit: 30000000 gas  │
# ·········································|···························|·············|······························
# |  Methods                               ·               10 gwei/gas               ·       1500.00 usd/eth       │
# ·························|···············|·············|·············|·············|···············|··············
# |  Contract              ·  Method       ·  Min        ·  Max        ·  Avg        ·  # calls      ·  usd (avg)  │
# ·························|···············|·············|·············|·············|···············|··············
# |  ContentRegistry       ·  register     ·      85000  ·     105000  ·      95000  ·           10  ·       1.43  │
```

### Debugging Reverts

```typescript
// Test for revert reasons
it("should revert with reason", async function () {
  await expect(
    registry.register("0x00", "")
  ).to.be.revertedWith("Invalid content hash");
});

// Or for custom errors
await expect(
  registry.register("0x00", "")
).to.be.revertedWithCustomError(registry, "InvalidHash");
```

### Debugging with Hardhat Network

```bash
# Start local node with verbose logging
npx hardhat node --verbose

# In another terminal, deploy and interact
npx hardhat run scripts/deploy.ts --network localhost
```

### Time Travel (Testing Time-Dependent Logic)

```typescript
import { time } from "@nomicfoundation/hardhat-network-helpers";

it("should expire after time limit", async function () {
  // Fast forward 1 day
  await time.increase(86400);
  
  // Check expired state
  const isExpired = await contract.isExpired(contentHash);
  expect(isExpired).to.be.true;
});
```

### Debugging Contract Interactions

```typescript
// Use provider event listeners
provider.on("block", (blockNumber) => {
  console.log("New block:", blockNumber);
});

registry.on("ContentRegistered", (hash, creator, uri, timestamp) => {
  console.log("Content registered:", { hash, creator, uri, timestamp });
});

// Call contract and wait for event
const tx = await registry.register(hash, uri);
await tx.wait();

// Events are logged by listener above
```

## Common Error Patterns

### 1. "Cannot find module" Errors

**Cause**: Missing dependency or incorrect import path

**Solution**:
```bash
# Install missing dependency
npm install <package-name>

# Or with legacy peer deps flag
npm install --legacy-peer-deps <package-name>

# Verify import path is correct
# Use absolute imports with @ alias when possible
```

### 2. "ECONNREFUSED" Errors

**Cause**: Service not running or wrong port

**Solution**:
```bash
# Check what's running on port
lsof -i :3001  # API port
lsof -i :3000  # Web port
lsof -i :5432  # Postgres port

# Start required services
npm run start:api
# Or
docker compose up -d
```

### 3. "PRIVATE_KEY is required" Error

**Cause**: Environment variable not set

**Solution**:
```bash
# Check .env file exists and has value
cat .env | grep PRIVATE_KEY

# If missing, generate one:
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Add to .env:
PRIVATE_KEY=0x<your-generated-key>
```

### 4. "Insufficient funds" Error

**Cause**: Wallet doesn't have enough tokens for gas

**Solution**:
```bash
# Get testnet ETH from faucet
# Base Sepolia: https://www.coinbase.com/faucets/base-ethereum-goerli-faucet
# Sepolia: https://sepoliafaucet.com/

# Check balance:
npx hardhat run scripts/check-balance.ts --network sepolia
```

### 5. "Transaction Reverted" Errors

**Cause**: Contract logic rejection

**Debug steps**:
1. Check revert reason in error message
2. Review contract requirements
3. Verify input parameters
4. Check contract state prerequisites
5. Test with Hardhat console

### 6. IPFS Upload Failures

**Cause**: Provider credentials or connectivity issues

**Solution**:
```bash
# Test each provider
curl -X POST https://api.web3.storage/upload \
  -H "Authorization: Bearer $WEB3_STORAGE_TOKEN" \
  -F file=@test.txt

# Check provider status pages
# Web3.Storage: https://status.web3.storage/
# Pinata: https://status.pinata.cloud/
# Infura: https://status.infura.io/
```

### 7. Database Migration Errors

**Cause**: Schema conflicts or migration history issues

**Solution**:
```bash
# Reset database (WARNING: deletes all data)
npm run db:reset

# Or manually fix:
rm -rf prisma/migrations/*
npx prisma migrate dev --name init

# Generate client
npm run db:generate
```

### 8. CORS Errors (Browser)

**Cause**: API not allowing frontend origin

**Solution**:
```typescript
// scripts/api.ts
import cors from "cors";

app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || 'http://localhost:3000',
  credentials: true,
}));
```

### 9. Next.js Hydration Errors

**Cause**: Mismatch between server and client render

**Solution**:
```typescript
// Use dynamic import with ssr: false
import dynamic from 'next/dynamic';

const WalletConnect = dynamic(
  () => import('@/components/WalletConnect'),
  { ssr: false }
);

// Or suppress warning if intentional
<div suppressHydrationWarning>{/* content */}</div>
```

### 10. TypeScript Type Errors

**Cause**: Type mismatch or missing types

**Solution**:
```bash
# Install type definitions
npm install --save-dev @types/<package-name>

# Check tsconfig.json includes correct paths
# Regenerate if needed
npx tsc --noEmit  # Type-check without compile
```

## Performance Debugging

### API Performance

```typescript
// Add timing middleware
app.use((req, res, next) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.info({
      method: req.method,
      path: req.path,
      status: res.statusCode,
      duration,
    }, 'Request completed');
    
    if (duration > 1000) {
      logger.warn({ method: req.method, path: req.path, duration }, 'Slow request');
    }
  });
  
  next();
});
```

### Database Query Performance

```bash
# Enable query logging and timing
DATABASE_URL="postgresql://user:pass@localhost:5432/db?connect_timeout=10&application_name=internet-id&options=-c%20log_statement%3Dall"

# Or use Prisma query analytics
npx prisma studio

# Check slow queries in logs
```

### Cache Hit Rates

```bash
# Check cache metrics
curl http://localhost:3001/api/cache/metrics

{
  "hits": 1250,
  "misses": 150,
  "hitRate": 0.893,
  "errors": 0
}
```

### Memory Leaks

```bash
# Profile memory usage
node --inspect --expose-gc scripts/api.ts

# Connect Chrome DevTools
# chrome://inspect

# Take heap snapshots periodically
# Compare snapshots to find leaks
```

## Tools and Extensions

### VS Code Extensions

- **ESLint**: Real-time linting
- **Prettier**: Auto-formatting
- **Solidity**: Syntax highlighting and IntelliSense
- **Prisma**: Schema formatting and IntelliSense
- **GitLens**: Git blame and history
- **REST Client**: Test API endpoints in editor

### Browser Extensions

- **React Developer Tools**: Component inspection
- **Redux DevTools**: State management debugging (if using Redux)
- **MetaMask**: Wallet interactions
- **IPFS Companion**: IPFS gateway resolution

### CLI Tools

```bash
# HTTP debugging
httpie  # http://localhost:3001/api/health

# JSON processing
jq  # curl http://localhost:3001/api/contents | jq '.[]'

# Database CLI
psql  # psql $DATABASE_URL

# Redis CLI
redis-cli  # redis-cli -u $REDIS_URL

# Process monitoring
htop  # or top
```

### Testing Tools

- **Hardhat**: Smart contract development and testing
- **Chai**: Assertion library
- **Supertest**: HTTP API testing
- **Playwright**: E2E browser testing

## Getting Help

If you're stuck:

1. **Check logs**: Look for error messages and stack traces
2. **Search documentation**: README, docs/, and guides
3. **Search issues**: GitHub issues for similar problems
4. **Ask for help**: GitHub Discussions or Discord
5. **Create minimal reproduction**: Isolate the problem

When asking for help, include:
- Error messages (full stack trace)
- Steps to reproduce
- Environment details (OS, Node version, etc.)
- What you've already tried

## Additional Resources

- [Node.js Debugging Guide](https://nodejs.org/en/docs/guides/debugging-getting-started/)
- [Chrome DevTools Documentation](https://developer.chrome.com/docs/devtools/)
- [Hardhat Debugging](https://hardhat.org/hardhat-runner/docs/guides/test-contracts#debugging)
- [Next.js Debugging](https://nextjs.org/docs/advanced-features/debugging)
- [React DevTools Guide](https://react.dev/learn/react-developer-tools)
