# Contributor Onboarding Guide

Welcome to Internet-ID! This guide will help you set up your development environment and start contributing to the project.

## Prerequisites

### Required Tools

| Tool    | Minimum Version | Recommended | Check Version    |
| ------- | --------------- | ----------- | ---------------- |
| Node.js | 18.0.0          | 20.12.0+    | `node --version` |
| npm     | 9.0.0           | 10.0.0+     | `npm --version`  |
| Git     | 2.30.0          | Latest      | `git --version`  |

### Optional Tools

| Tool              | Purpose              | Installation                          |
| ----------------- | -------------------- | ------------------------------------- |
| Docker            | PostgreSQL, Redis    | [docker.com](https://www.docker.com/) |
| Docker Compose    | Orchestrate services | Included with Docker Desktop          |
| PostgreSQL Client | Database inspection  | `psql` or GUI tool                    |
| Redis Client      | Cache inspection     | `redis-cli` or RedisInsight           |

## Quick Start (5 Minutes)

```bash
# 1. Clone the repository
git clone https://github.com/subculture-collective/internet-id.git
cd internet-id

# 2. Install dependencies
npm install --legacy-peer-deps

# 3. Set up environment
cp .env.example .env
# Edit .env and set at minimum: PRIVATE_KEY, RPC_URL

# 4. Generate Prisma client and run migrations
npm run db:generate
npm run db:migrate

# 5. Compile smart contracts
npm run build

# 6. Run tests to verify setup
npm run test:unit

# 7. Start API server
npm run start:api
# API running at http://localhost:3001
```

## Detailed Setup

### 1. Repository Setup

```bash
# Fork the repository (if contributing)
# Click "Fork" on GitHub

# Clone your fork
git clone https://github.com/YOUR_USERNAME/internet-id.git
cd internet-id

# Add upstream remote
git remote add upstream https://github.com/subculture-collective/internet-id.git

# Install root dependencies
npm install --legacy-peer-deps

# Install web dependencies (if working on UI)
cd web
npm install
cd ..
```

**Note**: We use `--legacy-peer-deps` due to a peer dependency conflict between `@types/chai` versions in the Hardhat toolbox. This is safe and doesn't affect functionality.

### 2. Environment Configuration

#### Root Environment (`.env`)

Create `.env` from template:

```bash
cp .env.example .env
```

**Essential Variables**:

```bash
# Blockchain Configuration
PRIVATE_KEY=0x1234...  # Deployer/creator wallet private key (DO NOT commit!)
RPC_URL=https://sepolia.base.org  # Base Sepolia testnet (recommended)

# Database (choose one)
DATABASE_URL="file:./dev.db"  # SQLite (default, easiest)
# DATABASE_URL="postgresql://user:pass@localhost:5432/internetid"  # Postgres

# API Protection (optional)
API_KEY=supersecret  # Require x-api-key header on protected endpoints

# IPFS Provider (choose one)
# Option 1: Web3.Storage (easiest, free)
WEB3_STORAGE_TOKEN=your_token_here  # Get from https://web3.storage

# Option 2: Pinata (free tier)
PINATA_JWT=your_jwt_here  # Get from https://pinata.cloud

# Option 3: Infura IPFS
IPFS_API_URL=https://ipfs.infura.io:5001
IPFS_PROJECT_ID=your_project_id
IPFS_PROJECT_SECRET=your_project_secret

# Redis (optional, for caching and rate limiting)
REDIS_URL=redis://localhost:6379
```

**Multi-Chain Configuration** (optional):

```bash
# Override default RPC URLs for specific chains
ETHEREUM_RPC_URL=https://eth.llamarpc.com
POLYGON_RPC_URL=https://polygon-rpc.com
BASE_RPC_URL=https://mainnet.base.org
# See .env.example for all chains
```

#### Web Environment (`web/.env.local`)

Create `web/.env.local` for Next.js app:

```bash
cd web
cat > .env.local << 'EOF'
# API Configuration
NEXT_PUBLIC_API_BASE=http://localhost:3001
NEXT_PUBLIC_API_KEY=supersecret  # Must match root .env API_KEY
NEXT_PUBLIC_SITE_BASE=http://localhost:3000  # For badges/share links

# NextAuth Configuration
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=generate_random_string_here  # openssl rand -base64 32

# Database (same as root .env)
DATABASE_URL="file:../dev.db"
# Or for Postgres:
# DATABASE_URL="postgresql://user:pass@localhost:5432/internetid"

# OAuth Providers (optional, for sign-in)
# GitHub
GITHUB_ID=your_github_client_id
GITHUB_SECRET=your_github_client_secret

# Google
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

# Twitter/X
TWITTER_CLIENT_ID=your_twitter_client_id
TWITTER_CLIENT_SECRET=your_twitter_client_secret

# TikTok
TIKTOK_CLIENT_ID=your_tiktok_client_id
TIKTOK_CLIENT_SECRET=your_tiktok_client_secret
EOF
```

**Generate `NEXTAUTH_SECRET`**:

```bash
openssl rand -base64 32
```

**Getting OAuth Credentials**:

- **GitHub**: [github.com/settings/developers](https://github.com/settings/developers)
- **Google**: [console.cloud.google.com](https://console.cloud.google.com/) → APIs & Services → Credentials
- **Twitter**: [developer.twitter.com](https://developer.twitter.com/)
- **TikTok**: [developers.tiktok.com](https://developers.tiktok.com/)

### 3. Database Setup

#### Option A: SQLite (Recommended for Development)

Easiest setup, no separate database server needed:

```bash
# Set in .env
DATABASE_URL="file:./dev.db"

# Generate Prisma Client
npm run db:generate

# Run migrations (creates dev.db)
npm run db:migrate

# Optional: Open Prisma Studio to inspect data
npm run db:studio
# Opens http://localhost:5555
```

#### Option B: PostgreSQL (Production-like)

Better for testing production scenarios:

```bash
# Start PostgreSQL with Docker
docker compose up -d

# Verify it's running
docker compose ps

# Set in .env
POSTGRES_USER=internetid
POSTGRES_PASSWORD=internetid
POSTGRES_DB=internetid
DATABASE_URL="postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@localhost:5432/${POSTGRES_DB}?schema=public"

# Generate Prisma Client
npm run db:generate

# Run migrations
npm run db:migrate

# Optional: Connect with psql
docker compose exec db psql -U internetid -d internetid
```

**Important**: Both root and web packages use the **same Prisma schema** at `prisma/schema.prisma`. Never create a separate schema in `web/prisma/`.

#### Database Seeding (Recommended for Development)

The repository includes a comprehensive seed script that populates your database with test data:

```bash
# Seed the database with test data
npm run db:seed
```

This creates:
- **5 test creator accounts** with deterministic Ethereum addresses
- **5 sample content entries** (video, image, audio, document, tutorial)
- **10 platform bindings** (YouTube, TikTok, GitHub, Instagram, Discord, LinkedIn)
- **3 verification records** (mix of verified and failed)

**Benefits:**
- No need for manual API calls to create test data
- Deterministic data for consistent testing
- Ready-to-use platform bindings for verification testing
- Front-end developers can work without on-chain writes

**Reset Database:**

To clear all data and reseed:

```bash
npm run db:reset
```

**⚠️ Warning:** This deletes ALL data in your database!

**Documentation:**

For detailed information about the seed data structure, test accounts, and usage examples, see [prisma/SEED_DATA.md](../prisma/SEED_DATA.md).

### 4. Smart Contract Setup

```bash
# Compile contracts
npm run build
# Creates artifacts in artifacts/ and typechain-types/

# Run contract tests
npm run test
# Or just unit tests (faster)
npm run test:unit

# Start local Hardhat node (for testing without testnet faucets)
npm run node
# Runs on http://127.0.0.1:8545 with prefunded accounts

# Deploy to local node (in another terminal)
npm run deploy:local
# Creates deployed/localhost.json with contract address

# Deploy to testnet (Base Sepolia recommended)
npm run deploy:base-sepolia
# Creates deployed/baseSepolia.json
```

**Getting Testnet Tokens**:

- **Base Sepolia**: [faucet.quicknode.com/base/sepolia](https://faucet.quicknode.com/base/sepolia)
- **Ethereum Sepolia**: [sepoliafaucet.com](https://sepoliafaucet.com/)
- **Polygon Amoy**: [faucet.polygon.technology](https://faucet.polygon.technology/)

### 5. IPFS Setup

Choose one provider (or set up fallback chain):

#### Option A: Web3.Storage (Easiest)

```bash
# 1. Sign up at https://web3.storage
# 2. Create API token in dashboard
# 3. Add to .env
WEB3_STORAGE_TOKEN=eyJ...your_token
```

#### Option B: Pinata

```bash
# 1. Sign up at https://pinata.cloud
# 2. Generate JWT in API Keys section
# 3. Add to .env
PINATA_JWT=eyJ...your_jwt
```

#### Option C: Infura IPFS

```bash
# 1. Create IPFS project at https://infura.io
# 2. Get project ID and secret
# 3. Add to .env
IPFS_API_URL=https://ipfs.infura.io:5001
IPFS_PROJECT_ID=your_project_id
IPFS_PROJECT_SECRET=your_project_secret
```

#### Option D: Local IPFS Node

```bash
# Install Kubo (IPFS implementation)
# macOS: brew install ipfs
# Linux: https://docs.ipfs.tech/install/command-line/

# Initialize and start
ipfs init
ipfs daemon
# Runs on http://127.0.0.1:5001

# Add to .env
IPFS_PROVIDER=local
IPFS_API_URL=http://127.0.0.1:5001
```

### 6. Redis Setup (Optional)

For caching and distributed rate limiting:

```bash
# Option A: Docker (easiest)
docker compose up -d redis

# Option B: Local installation
# macOS: brew install redis && brew services start redis
# Linux: sudo apt install redis-server && sudo systemctl start redis

# Verify it's running
redis-cli ping
# Should return: PONG

# Add to .env
REDIS_URL=redis://localhost:6379
```

## Running the Application

### Development Mode

#### Terminal 1: API Server

```bash
# From root directory
npm run start:api
# API running at http://localhost:3001

# Test health endpoint
curl http://localhost:3001/api/health
# Should return: {"status":"ok"}
```

#### Terminal 2: Web UI

```bash
# From web directory
cd web
npm run dev
# Web UI at http://localhost:3000
```

#### Terminal 3: Local Blockchain (Optional)

```bash
# From root directory
npm run node
# Hardhat node at http://127.0.0.1:8545
# Provides 20 prefunded test accounts
```

### Production Build

```bash
# Build Next.js app
cd web
npm run build
npm start
# Runs optimized production build

# API server (no build needed, TypeScript run via ts-node)
cd ..
npm run start:api
```

## Development Workflow

### 1. Branch Strategy

```bash
# Create feature branch
git checkout -b feature/your-feature-name

# Or bug fix branch
git checkout -b fix/issue-description

# Keep branch up to date with main
git fetch upstream
git rebase upstream/main
```

### 2. Making Changes

```bash
# Run linter frequently
npm run lint

# Auto-fix linting issues
npm run lint:fix

# Check code formatting
npm run format:check

# Auto-format code
npm run format

# Run tests after changes
npm run test:unit  # Fast
npm run test       # All tests
```

### 3. Database Changes

If you modify `prisma/schema.prisma`:

```bash
# Create migration
npm run db:migrate
# Follow prompts to name migration

# Regenerate Prisma clients (root + web)
npm run db:generate
cd web && npm run prisma:generate

# Verify indexes (if adding/changing indexes)
npm run db:verify-indexes
```

### 4. Smart Contract Changes

If you modify `contracts/ContentRegistry.sol`:

```bash
# Recompile
npm run build

# Run tests
npm run test

# Optional: Run security scan (requires Slither)
npm run security:scan

# Redeploy to local network for testing
npm run deploy:local
```

### 5. Committing Changes

```bash
# Stage changes
git add .

# Commit with descriptive message
git commit -m "feat: add platform binding validation"
# Or: "fix: resolve cache invalidation bug"
# Or: "docs: update API examples"

# Push to your fork
git push origin feature/your-feature-name

# Create pull request on GitHub
```

### 6. Pull Request Guidelines

**Before submitting**:

- [ ] All tests pass (`npm run test`)
- [ ] Linting passes (`npm run lint`)
- [ ] Code is formatted (`npm run format`)
- [ ] Web builds successfully (`cd web && npm run build`)
- [ ] Documentation updated if needed
- [ ] Security scan clean (if contract changes)

**PR Description Template**:

```markdown
## Summary

Brief description of changes

## Changes Made

- Item 1
- Item 2

## Testing

- [ ] Unit tests added/updated
- [ ] Integration tests added/updated
- [ ] Manual testing completed

## Screenshots (if UI changes)

[Attach screenshots]

## Related Issues

Closes #123
```

## Testing Strategy

### Unit Tests

```bash
# Run all unit tests
npm run test:unit

# Run specific test file
npx hardhat test test/ContentRegistry.ts

# Run with coverage
npm run test:coverage
# Generates coverage report in coverage/index.html
```

### Integration Tests

```bash
# Run integration tests (slower, test full flows)
npm run test:integration

# Specific integration test
npx hardhat test test/integration/full-flow.test.ts
```

### API Testing

```bash
# Start API server
npm run start:api

# Test with curl
curl http://localhost:3001/api/health
curl -H "x-api-key: supersecret" \
  -F "file=@test.txt" \
  http://localhost:3001/api/upload

# Or use Postman/Insomnia
```

### Web Testing

```bash
cd web
npm run build
# Verifies Next.js builds without errors

# Manual testing
npm run dev
# Open http://localhost:3000 and test flows
```

## Troubleshooting

### Common Issues

#### 1. Database Connection Errors

**SQLite**:

```bash
# Check file exists
ls -la dev.db

# If missing, run migrations
npm run db:migrate
```

**PostgreSQL**:

```bash
# Check Docker container
docker compose ps

# View logs
docker compose logs db

# Restart
docker compose restart db

# Test connection
psql "postgresql://internetid:internetid@localhost:5432/internetid"
```

#### 2. Prisma Client Errors

```bash
# "Cannot find module '@prisma/client'"
npm run db:generate
cd web && npm run prisma:generate

# "Schema out of sync with database"
npm run db:migrate
```

#### 3. IPFS Upload Failures

```bash
# Test IPFS provider
node << EOF
require('dotenv').config();
const { uploadToIpfs } = require('./scripts/upload-ipfs');
uploadToIpfs('./README.md').then(console.log).catch(console.error);
EOF

# Try different provider
# Edit .env: IPFS_PROVIDER=pinata (or web3storage, infura)
```

#### 4. Smart Contract Deployment Fails

```bash
# Check RPC connection
curl -X POST $RPC_URL \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}'

# Check wallet has funds
# View balance at block explorer

# Try different RPC (if rate limited)
# Edit .env: RPC_URL=https://alternative-rpc.com
```

#### 5. Redis Connection Issues

```bash
# Check Redis is running
redis-cli ping

# If not running
docker compose up -d redis

# Test connection
redis-cli
> SET test "hello"
> GET test
> EXIT

# Disable Redis (fallback to memory)
# Comment out in .env: # REDIS_URL=redis://localhost:6379
```

#### 6. Web UI Build Errors

```bash
# Clear Next.js cache
cd web
rm -rf .next

# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install

# Ensure Prisma client generated
npm run prisma:generate

# Retry build
npm run build
```

#### 7. Port Already in Use

```bash
# Find process using port 3000/3001
lsof -ti:3000
lsof -ti:3001

# Kill process
kill -9 <PID>

# Or change port
# API: Edit scripts/api.ts (const PORT = 3002)
# Web: npm run dev -- -p 3002
```

## Project Structure

```
internet-id/
├── contracts/                 # Solidity smart contracts
│   └── ContentRegistry.sol
├── scripts/                   # CLI scripts and API server
│   ├── api.ts                # Express API entry point
│   ├── app.ts                # Express app factory (modular)
│   ├── deploy.ts             # Contract deployment
│   ├── register.ts           # Register content CLI
│   ├── verify.ts             # Verify content CLI
│   ├── services/             # Business logic
│   │   ├── cache.service.ts  # Redis caching
│   │   ├── ipfs.service.ts   # IPFS uploads
│   │   └── registry.service.ts # Blockchain interactions
│   ├── routes/               # API routes (modular)
│   ├── middleware/           # Express middleware
│   └── validation/           # Zod schemas
├── test/                      # Test files
│   ├── ContentRegistry.ts    # Smart contract tests
│   ├── routes/               # API route tests
│   └── integration/          # Full flow tests
├── prisma/                    # Database schema and migrations
│   ├── schema.prisma         # Single source of truth
│   └── migrations/           # Migration history
├── web/                       # Next.js web application
│   ├── app/                  # Next.js App Router pages
│   ├── lib/                  # Utility functions
│   └── middleware.ts         # Next.js middleware
├── docs/                      # Documentation
│   ├── ARCHITECTURE.md       # This file
│   ├── CONTRIBUTOR_ONBOARDING.md
│   └── ...                   # Other guides
├── deployed/                  # Deployed contract addresses (per network)
├── config/                    # Configuration files
│   └── chains.ts             # Multi-chain config
├── .env.example              # Environment template
├── hardhat.config.ts         # Hardhat configuration
├── package.json              # Root dependencies
└── README.md                 # Project overview
```

## Useful Commands Reference

### Development

```bash
npm run build              # Compile contracts
npm run test               # Run all tests
npm run test:unit          # Run unit tests only
npm run test:coverage      # Test coverage report
npm run lint               # Lint root + web
npm run lint:fix           # Auto-fix linting issues
npm run format             # Format all code
npm run format:check       # Check formatting
```

### Database

```bash
npm run db:generate        # Generate Prisma client
npm run db:migrate         # Run migrations
npm run db:studio          # Open Prisma Studio GUI
npm run db:verify-indexes  # Verify database indexes
```

### Smart Contracts

```bash
npm run node               # Start local Hardhat node
npm run deploy:local       # Deploy to local node
npm run deploy:base-sepolia # Deploy to Base Sepolia
npm run register           # Register content (CLI)
npm run verify             # Verify content (CLI)
```

### API & Web

```bash
npm run start:api          # Start API server (port 3001)
cd web && npm run dev      # Start web UI (port 3000)
cd web && npm run build    # Build web for production
cd web && npm start        # Run production web build
```

### Maintenance

```bash
npm run backup:full        # Backup database (full)
npm run backup:verify      # Verify backups
npm run restore:full       # Restore from backup
npm run security:scan      # Run security scan
```

## Getting Help

- **Documentation**: Check `/docs` directory for guides
- **Issues**: [github.com/subculture-collective/internet-id/issues](https://github.com/subculture-collective/internet-id/issues)
- **Discussions**: [github.com/subculture-collective/internet-id/discussions](https://github.com/subculture-collective/internet-id/discussions)
- **Architecture**: See [docs/ARCHITECTURE.md](./ARCHITECTURE.md)
- **Security**: Read [SECURITY_POLICY.md](../SECURITY_POLICY.md)

## Next Steps

1. Complete setup and run tests to verify your environment
2. Review [ARCHITECTURE.md](./ARCHITECTURE.md) to understand system design
3. Pick an issue labeled `good first issue` from GitHub
4. Join discussions to ask questions and share ideas
5. Submit your first pull request!

Welcome aboard! 🚀
