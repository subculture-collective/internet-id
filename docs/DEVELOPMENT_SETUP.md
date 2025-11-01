# Development Environment Setup Guide

Complete guide for setting up a local development environment for Internet-ID, including prerequisites, step-by-step setup, common issues, and troubleshooting.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Initial Setup](#initial-setup)
- [Component-Specific Setup](#component-specific-setup)
- [Optional Services](#optional-services)
- [Verification](#verification)
- [Common Issues and Troubleshooting](#common-issues-and-troubleshooting)
- [Development Workflow](#development-workflow)
- [IDE Configuration](#ide-configuration)

## Prerequisites

### Required Software

#### Node.js and npm

**Minimum**: Node.js 18.0.0, npm 9.0.0  
**Recommended**: Node.js 20.12.0+, npm 10.0.0+

**Check installed versions**:

```bash
node --version  # Should be v18+ or v20+
npm --version   # Should be 9+ or 10+
```

**Installation**:

**macOS** (using Homebrew):

```bash
brew install node@20
```

**Ubuntu/Debian**:

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs
```

**Windows**:

- Download from [nodejs.org](https://nodejs.org/)
- Use [nvm-windows](https://github.com/coreybutler/nvm-windows) for version management

**Using nvm** (recommended for version management):

```bash
# Install nvm (macOS/Linux)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash

# Install Node.js 20
nvm install 20
nvm use 20
nvm alias default 20
```

#### Git

**Minimum**: Git 2.30.0  
**Recommended**: Latest stable version

**Check version**:

```bash
git --version
```

**Installation**:

**macOS**:

```bash
brew install git
```

**Ubuntu/Debian**:

```bash
sudo apt-get update
sudo apt-get install git
```

**Windows**:

- Download from [git-scm.com](https://git-scm.com/)

**Configuration**:

```bash
git config --global user.name "Your Name"
git config --global user.email "your.email@example.com"

# Optional: Set default branch name
git config --global init.defaultBranch main
```

### Optional but Recommended

#### Docker and Docker Compose

For running PostgreSQL, Redis, and other services in containers.

**Check versions**:

```bash
docker --version          # Docker 20.10+
docker compose version    # Docker Compose 2.0+
```

**Installation**:

**macOS**: [Docker Desktop for Mac](https://docs.docker.com/desktop/install/mac-install/)  
**Windows**: [Docker Desktop for Windows](https://docs.docker.com/desktop/install/windows-install/)  
**Linux**: [Docker Engine](https://docs.docker.com/engine/install/)

**Post-installation** (Linux):

```bash
# Add your user to docker group
sudo usermod -aG docker $USER

# Log out and back in for changes to take effect
```

**Verify Docker**:

```bash
docker run hello-world
```

#### Code Editor

**Recommended**: [Visual Studio Code](https://code.visualstudio.com/)

**VS Code Extensions** (recommended):

- ESLint
- Prettier - Code formatter
- Solidity (by Juan Blanco)
- Prisma
- GitLens
- REST Client
- Docker

Install extensions:

```bash
code --install-extension dbaeumer.vscode-eslint
code --install-extension esbenp.prettier-vscode
code --install-extension juanblanco.solidity
code --install-extension Prisma.prisma
code --install-extension eamodio.gitlens
code --install-extension humao.rest-client
code --install-extension ms-azuretools.vscode-docker
```

#### Other Useful Tools

**HTTPie** (better curl):

```bash
# macOS
brew install httpie

# Ubuntu/Debian
sudo apt-get install httpie

# Usage
http localhost:3001/api/health
```

**jq** (JSON processor):

```bash
# macOS
brew install jq

# Ubuntu/Debian
sudo apt-get install jq

# Usage
curl localhost:3001/api/contents | jq '.'
```

## Initial Setup

### 1. Clone the Repository

**Option A: HTTPS** (easier):

```bash
git clone https://github.com/subculture-collective/internet-id.git
cd internet-id
```

**Option B: SSH** (requires SSH key setup):

```bash
git clone git@github.com:subculture-collective/internet-id.git
cd internet-id
```

**For contributors** (fork first):

```bash
# Fork on GitHub, then:
git clone https://github.com/YOUR_USERNAME/internet-id.git
cd internet-id

# Add upstream remote
git remote add upstream https://github.com/subculture-collective/internet-id.git

# Verify remotes
git remote -v
```

### 2. Install Dependencies

```bash
# Install root dependencies
npm install --legacy-peer-deps

# Note: --legacy-peer-deps is needed due to a peer dependency
# conflict in @types/chai versions. This is safe and expected.
```

**If you get errors**:

```bash
# Clear npm cache
npm cache clean --force

# Delete node_modules and lockfile
rm -rf node_modules package-lock.json

# Reinstall
npm install --legacy-peer-deps
```

### 3. Environment Configuration

#### Root Environment (Backend/API/Contracts)

```bash
# Create .env from template
cp .env.example .env
```

**Edit `.env`** with your values:

**Minimal required configuration**:

```bash
# Blockchain - REQUIRED
PRIVATE_KEY=0x1234567890abcdef...  # Your wallet private key (DO NOT COMMIT!)
RPC_URL=https://sepolia.base.org    # Base Sepolia testnet (free)

# Database - REQUIRED
DATABASE_URL="file:./dev.db"        # SQLite (easiest for development)

# IPFS Provider - REQUIRED (choose one)
WEB3_STORAGE_TOKEN=eyJhbG...        # From https://web3.storage
# OR
PINATA_JWT=eyJhbG...                # From https://pinata.cloud
# OR
IPFS_PROJECT_ID=...                 # Infura IPFS project
IPFS_PROJECT_SECRET=...
```

**Optional configuration**:

```bash
# API Protection
API_KEY=supersecret                 # Require API key for protected endpoints

# Redis (for caching and rate limiting)
REDIS_URL=redis://localhost:6379

# Logging
LOG_LEVEL=debug                     # debug, info, warn, error

# Sentry (error tracking)
SENTRY_DSN=https://...@sentry.io/...
```

**Generate a private key** (for testing only):

```bash
node -e "console.log('0x' + require('crypto').randomBytes(32).toString('hex'))"
```

**Get testnet ETH**:

- Base Sepolia: https://www.coinbase.com/faucets/base-ethereum-goerli-faucet
- Ethereum Sepolia: https://sepoliafaucet.com/
- Polygon Amoy: https://faucet.polygon.technology/

**Get IPFS provider tokens**:

- Web3.Storage: https://web3.storage/ (free, recommended)
- Pinata: https://pinata.cloud/ (free tier available)
- Infura: https://infura.io/ (requires project setup)

#### Web Environment (Frontend)

```bash
cd web
cp .env.example .env.local
```

**Edit `web/.env.local`**:

**Minimal configuration**:

```bash
# API Configuration
NEXT_PUBLIC_API_BASE=http://localhost:3001
NEXT_PUBLIC_SITE_BASE=http://localhost:3000

# NextAuth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=generate_random_32_char_string_here

# Database (same as root)
DATABASE_URL="file:../dev.db"
```

**Generate NEXTAUTH_SECRET**:

```bash
openssl rand -base64 32
```

**Optional OAuth configuration**:

```bash
# GitHub OAuth
GITHUB_ID=your_github_client_id
GITHUB_SECRET=your_github_client_secret

# Google OAuth
GOOGLE_CLIENT_ID=your_google_client_id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your_google_client_secret

# Twitter OAuth
TWITTER_CLIENT_ID=your_twitter_client_id
TWITTER_CLIENT_SECRET=your_twitter_client_secret
```

**Getting OAuth credentials**:

- **GitHub**: [github.com/settings/developers](https://github.com/settings/developers) → New OAuth App
  - Homepage URL: `http://localhost:3000`
  - Callback URL: `http://localhost:3000/api/auth/callback/github`
- **Google**: [console.cloud.google.com](https://console.cloud.google.com/) → APIs & Services → Credentials
  - Authorized redirect URI: `http://localhost:3000/api/auth/callback/google`
- **Twitter**: [developer.twitter.com](https://developer.twitter.com/) → Apps → Create app

Return to root directory:

```bash
cd ..
```

### 4. Database Setup

#### Option A: SQLite (Recommended for Development)

Easiest option - no separate database server needed.

```bash
# Already configured if you used DATABASE_URL="file:./dev.db"

# Generate Prisma Client
npm run db:generate

# Run migrations (creates dev.db file)
npm run db:migrate

# Optional: Seed with test data
npm run db:seed

# Optional: Open Prisma Studio to view data
npm run db:studio
# Opens http://localhost:5555
```

#### Option B: PostgreSQL (Production-like)

More features, better for testing production scenarios.

**Start PostgreSQL with Docker**:

```bash
# Start services (Postgres + Redis)
docker compose up -d

# Verify running
docker compose ps
```

**Update `.env`**:

```bash
DATABASE_URL="postgresql://internetid:internetid@localhost:5432/internetid?schema=public"
```

**Run migrations**:

```bash
npm run db:generate
npm run db:migrate
npm run db:seed
```

**Access PostgreSQL**:

```bash
# Using psql
psql postgresql://internetid:internetid@localhost:5432/internetid

# Or using Prisma Studio
npm run db:studio
```

### 5. Compile Smart Contracts

```bash
# Compile Solidity contracts
npm run build

# This generates:
# - artifacts/ - Compiled contract artifacts
# - typechain-types/ - TypeScript type definitions
# - cache/ - Hardhat cache
```

Verify compilation:

```bash
ls artifacts/contracts/ContentRegistry.sol/
# Should see: ContentRegistry.json, ContentRegistry.dbg.json
```

### 6. Run Tests

```bash
# Run all tests
npm test

# Run unit tests only
npm run test:unit

# Run integration tests only
npm run test:integration

# Run with coverage
npm run test:coverage

# Open coverage report
open coverage/index.html
```

Expected output:

```
ContentRegistry
  ✓ should deploy successfully (150ms)
  ✓ should register content (250ms)
  ✓ should bind platform (200ms)
  ...

  45 passing (5s)
```

## Component-Specific Setup

### API Server

```bash
# Start API server
npm run start:api

# Server starts on http://localhost:3001
```

**Verify it's running**:

```bash
curl http://localhost:3001/api/health

# Expected:
# {"status":"ok","timestamp":"...","uptime":123}
```

**API endpoints**:

- Health: `GET http://localhost:3001/api/health`
- Network: `GET http://localhost:3001/api/network`
- Contents: `GET http://localhost:3001/api/contents`
- Docs: `GET http://localhost:3001/api/docs` (Swagger UI)

### Web Application

```bash
cd web

# Install web dependencies (if not done already)
npm install

# Start dev server
npm run dev

# Opens http://localhost:3000
```

**Verify it's running**:

- Open browser to http://localhost:3000
- Should see Internet-ID homepage

**Development features**:

- Hot reload on file changes
- React Fast Refresh
- Error overlay
- Source maps

### Local Blockchain Node (Optional)

For testing without testnet:

```bash
# Terminal 1: Start local Hardhat node
npm run node

# This starts a local blockchain on http://127.0.0.1:8545
# Provides 20 pre-funded test accounts

# Terminal 2: Deploy contracts to local node
npm run deploy:local

# Note the deployed contract address
```

**Use local node in `.env`**:

```bash
RPC_URL=http://127.0.0.1:8545
```

## Optional Services

### Redis (Caching and Rate Limiting)

**Start with Docker**:

```bash
docker compose up -d redis
```

**Or install locally**:

**macOS**:

```bash
brew install redis
brew services start redis
```

**Ubuntu/Debian**:

```bash
sudo apt-get install redis-server
sudo systemctl start redis-server
```

**Verify Redis**:

```bash
redis-cli ping
# Expected: PONG

# Set in .env:
REDIS_URL=redis://localhost:6379
```

**Check cache metrics**:

```bash
curl http://localhost:3001/api/cache/metrics
```

### Monitoring (Prometheus + Grafana)

For observability in development:

```bash
# Start monitoring stack
docker compose -f docker-compose.monitoring.yml up -d

# Access:
# - Prometheus: http://localhost:9090
# - Grafana: http://localhost:3001 (admin/admin)
```

See [Observability Guide](./OBSERVABILITY.md) for details.

## Verification

### Complete Setup Checklist

Run through this checklist to verify everything is working:

- [ ] **Dependencies installed**: `npm list` shows no errors
- [ ] **Environment configured**: `.env` and `web/.env.local` exist with required values
- [ ] **Database ready**: `npm run db:studio` opens Prisma Studio
- [ ] **Contracts compiled**: `artifacts/` directory exists with compiled contracts
- [ ] **Tests pass**: `npm test` shows all tests passing
- [ ] **API server starts**: `npm run start:api` runs without errors
- [ ] **Web app starts**: `cd web && npm run dev` runs without errors
- [ ] **Health check works**: `curl http://localhost:3001/api/health` returns OK
- [ ] **Web app loads**: http://localhost:3000 shows homepage

### Run Full Verification Script

Create `scripts/verify-setup.sh`:

```bash
#!/bin/bash
set -e

echo "🔍 Verifying Internet-ID development setup..."

# Check Node.js version
echo "✓ Checking Node.js version..."
node --version | grep -E "v(18|19|20|21)" || {
  echo "❌ Node.js 18+ required"
  exit 1
}

# Check dependencies
echo "✓ Checking dependencies..."
npm list --depth=0 > /dev/null || {
  echo "❌ Dependencies issue, run: npm install --legacy-peer-deps"
  exit 1
}

# Check environment files
echo "✓ Checking environment files..."
[ -f .env ] || {
  echo "❌ .env not found, run: cp .env.example .env"
  exit 1
}

# Check database
echo "✓ Checking database..."
npm run db:generate > /dev/null || {
  echo "❌ Database setup issue, run: npm run db:generate && npm run db:migrate"
  exit 1
}

# Compile contracts
echo "✓ Compiling contracts..."
npm run build > /dev/null || {
  echo "❌ Contract compilation failed"
  exit 1
}

# Run tests
echo "✓ Running tests..."
npm run test:unit > /dev/null || {
  echo "❌ Tests failed"
  exit 1
}

echo "✅ Setup verification complete! You're ready to develop."
echo ""
echo "Next steps:"
echo "  - Start API: npm run start:api"
echo "  - Start Web: cd web && npm run dev"
echo "  - Read docs: docs/CONTRIBUTOR_ONBOARDING.md"
```

Make executable and run:

```bash
chmod +x scripts/verify-setup.sh
./scripts/verify-setup.sh
```

## Common Issues and Troubleshooting

### Issue: "Cannot find module" errors

**Symptoms**:

```
Error: Cannot find module '@openzeppelin/contracts'
```

**Solutions**:

```bash
# Clear and reinstall
rm -rf node_modules package-lock.json
npm install --legacy-peer-deps

# Or install specific missing package
npm install --legacy-peer-deps @openzeppelin/contracts
```

### Issue: "PRIVATE_KEY is required" error

**Symptoms**:

```
Error: PRIVATE_KEY environment variable is required
```

**Solutions**:

```bash
# Check if .env exists
cat .env | grep PRIVATE_KEY

# Generate a test key
node -e "console.log('0x' + require('crypto').randomBytes(32).toString('hex'))"

# Add to .env:
echo "PRIVATE_KEY=0x<your-key>" >> .env
```

### Issue: "Insufficient funds" error

**Symptoms**:

```
Error: insufficient funds for gas * price + value
```

**Solutions**:

- Get testnet ETH from faucets (see Prerequisites)
- Verify you're using correct network
- Check wallet balance:
  ```bash
  npx hardhat run scripts/check-balance.ts
  ```

### Issue: Port already in use

**Symptoms**:

```
Error: listen EADDRINUSE: address already in use :::3001
```

**Solutions**:

```bash
# Find process using port
lsof -i :3001

# Kill process
kill -9 <PID>

# Or use different port
PORT=3002 npm run start:api
```

### Issue: Database connection errors

**Symptoms**:

```
Error: Can't reach database server at `localhost:5432`
```

**Solutions**:

**For SQLite**:

```bash
# Verify DATABASE_URL in .env
DATABASE_URL="file:./dev.db"

# Regenerate
npm run db:generate
npm run db:migrate
```

**For PostgreSQL**:

```bash
# Check Docker is running
docker compose ps

# Restart PostgreSQL
docker compose restart postgres

# Check connection
psql postgresql://internetid:internetid@localhost:5432/internetid
```

### Issue: IPFS upload failures

**Symptoms**:

```
Error: IPFS upload failed: 401 Unauthorized
```

**Solutions**:

```bash
# Verify token in .env
cat .env | grep -E "WEB3_STORAGE_TOKEN|PINATA_JWT|IPFS_PROJECT"

# Test Web3.Storage token
curl -X POST https://api.web3.storage/upload \
  -H "Authorization: Bearer $WEB3_STORAGE_TOKEN" \
  -F file=@test.txt

# Try different provider in .env
IPFS_PROVIDER=pinata  # or web3storage, infura
```

### Issue: TypeScript errors

**Symptoms**:

```
error TS2307: Cannot find module '@/lib/utils' or its corresponding type declarations
```

**Solutions**:

```bash
# Check tsconfig.json paths configuration
cat tsconfig.json | grep paths

# Regenerate type definitions
npm run build  # For contracts
npm run db:generate  # For Prisma

# Check VS Code TypeScript version
# In VS Code: Cmd/Ctrl + Shift + P → "TypeScript: Select TypeScript Version"
# Choose "Use Workspace Version"
```

### Issue: Web app build errors

**Symptoms**:

```
Error: Module not found: Can't resolve '@/components/Header'
```

**Solutions**:

```bash
cd web

# Clear Next.js cache
rm -rf .next

# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install

# Verify env vars
cat .env.local | grep NEXT_PUBLIC

# Rebuild
npm run build
```

### Issue: Hardhat network errors

**Symptoms**:

```
Error: could not detect network (event="noNetwork", code=NETWORK_ERROR)
```

**Solutions**:

```bash
# Check RPC_URL in .env
echo $RPC_URL

# Test RPC connection
curl -X POST $RPC_URL \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}'

# Try alternative RPC URLs (see .env.example)

# For local node
npm run node  # Terminal 1
npm run deploy:local  # Terminal 2
```

### Issue: ESLint/Prettier conflicts

**Symptoms**:

```
Delete `␍` prettier/prettier
```

**Solutions**:

```bash
# Fix line endings
npm run lint:fix
npm run format

# Configure git to handle line endings
git config --global core.autocrlf input  # macOS/Linux
git config --global core.autocrlf true   # Windows

# Re-checkout files
git rm --cached -r .
git reset --hard
```

### Getting More Help

If you're still stuck:

1. **Check logs**: Look for detailed error messages
2. **Search issues**: [GitHub Issues](https://github.com/subculture-collective/internet-id/issues)
3. **Ask for help**: [GitHub Discussions](https://github.com/subculture-collective/internet-id/discussions)
4. **Join Discord**: (if available)

When reporting issues, include:

- Operating system and version
- Node.js version (`node --version`)
- npm version (`npm --version`)
- Full error message and stack trace
- Steps to reproduce
- What you've already tried

## Development Workflow

### Daily Development

```bash
# 1. Update your local main branch
git checkout main
git pull upstream main

# 2. Create feature branch
git checkout -b feature/your-feature

# 3. Start services
npm run start:api     # Terminal 1
cd web && npm run dev # Terminal 2

# 4. Make changes, test frequently
npm run lint
npm test

# 5. Commit with conventional format
git add .
git commit -m "feat(api): add new endpoint"

# 6. Push and create PR
git push origin feature/your-feature
```

### Before Committing

```bash
# Lint and format
npm run lint:fix
npm run format

# Run tests
npm test

# Check types
npx tsc --noEmit

# Verify build
npm run build
cd web && npm run build
```

### Hot Reload and Fast Iteration

- **API**: Auto-restart with `nodemon` (if configured)
- **Web**: Next.js Fast Refresh (auto-reloads components)
- **Contracts**: Re-compile with `npm run build`

### Testing During Development

```bash
# Watch mode for tests (auto-rerun on changes)
npm test -- --watch

# Test specific file
npm test test/ContentRegistry.test.ts

# Test with specific pattern
npm test -- --grep "should register content"
```

## IDE Configuration

### VS Code

**Recommended settings** (`.vscode/settings.json`):

```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "[solidity]": {
    "editor.defaultFormatter": "JuanBlanco.solidity"
  },
  "solidity.compileUsingRemoteVersion": "v0.8.22",
  "files.associations": {
    "*.sol": "solidity"
  },
  "typescript.tsdk": "node_modules/typescript/lib",
  "eslint.workingDirectories": [".", "./web"]
}
```

**Debug configuration** (`.vscode/launch.json`):

See [Debugging Guide](./DEBUGGING.md#running-with-debugger-vs-code) for complete configuration.

### WebStorm / IntelliJ IDEA

1. **Enable Prettier**:
   - Settings → Languages & Frameworks → JavaScript → Prettier
   - Check "On save"
   - Set Prettier package path

2. **Enable ESLint**:
   - Settings → Languages & Frameworks → JavaScript → Code Quality Tools → ESLint
   - Select "Automatic ESLint configuration"

3. **Solidity Plugin**:
   - Settings → Plugins → Search "Solidity"
   - Install and restart

## Next Steps

Now that your development environment is set up:

1. **Read the guides**:
   - [Contributing Guidelines](../CONTRIBUTING.md)
   - [Architecture Overview](./ARCHITECTURE.md)
   - [Debugging Guide](./DEBUGGING.md)

2. **Explore the codebase**:
   - Smart contracts: `contracts/`
   - API server: `scripts/api.ts`
   - Web app: `web/app/`
   - Tests: `test/`

3. **Try example workflows**:
   - Register content: Follow [README](../README.md#quickstart)
   - Run tests: `npm test`
   - Deploy locally: `npm run node` + `npm run deploy:local`

4. **Join the community**:
   - GitHub Discussions
   - Discord (if available)
   - Weekly dev calls (if scheduled)

Happy coding! 🚀
