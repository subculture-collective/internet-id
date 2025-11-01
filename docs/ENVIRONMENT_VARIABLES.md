# Environment Variables Reference

Complete reference for all environment variables used in Internet-ID, including backend/API, web application, and deployment configurations.

## Table of Contents

- [Quick Reference](#quick-reference)
- [Backend/API Variables](#backendapi-variables)
- [Web Application Variables](#web-application-variables)
- [Deployment Variables](#deployment-variables)
- [CI/CD Variables](#cicd-variables)
- [Security Best Practices](#security-best-practices)

## Quick Reference

### Essential Variables (Minimum to Run)

**Backend (`.env`)**:

```bash
PRIVATE_KEY=0x...              # Deployer wallet private key
RPC_URL=https://...            # Blockchain RPC endpoint
DATABASE_URL=file:./dev.db     # Database connection string
WEB3_STORAGE_TOKEN=eyJ...      # IPFS provider token
```

**Web (`web/.env.local`)**:

```bash
NEXT_PUBLIC_API_BASE=http://localhost:3001
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=<32-char-random-string>
DATABASE_URL=file:../dev.db
```

### Optional but Recommended

```bash
# Backend
API_KEY=...                    # API protection
REDIS_URL=redis://...          # Caching and rate limiting
LOG_LEVEL=info                 # Logging verbosity

# Web
GITHUB_ID=...                  # OAuth providers
GITHUB_SECRET=...
NEXT_PUBLIC_SITE_BASE=https://... # For public URLs
```

## Backend/API Variables

Variables for the Express API server, contract deployment, and CLI tools.

### Blockchain Configuration

#### PRIVATE_KEY

**Required**: Yes  
**Type**: String (hex)  
**Example**: `0x1234567890abcdef...` (64 hex characters)

Private key of the wallet used for deploying contracts and signing transactions.

**Security**: 🔴 NEVER commit this to git! Keep it secret!

**How to get**:

```bash
# Generate new key (testing only)
node -e "console.log('0x' + require('crypto').randomBytes(32).toString('hex'))"

# Or export from MetaMask:
# MetaMask → Account Details → Export Private Key
```

**Usage**: Contract deployment, content registration, platform binding

---

#### RPC_URL

**Required**: Yes  
**Type**: String (URL)  
**Example**: `https://sepolia.base.org`

Default blockchain RPC endpoint for transactions.

**Recommended networks**:

- **Base Sepolia** (testnet): `https://sepolia.base.org` - Free, fast
- **Ethereum Sepolia** (testnet): `https://ethereum-sepolia-rpc.publicnode.com`
- **Polygon Amoy** (testnet): `https://rpc-amoy.polygon.technology`
- **Base Mainnet** (production): `https://mainnet.base.org`

**Custom RPC providers**:

- Alchemy: `https://base-sepolia.g.alchemy.com/v2/YOUR-API-KEY`
- Infura: `https://sepolia.infura.io/v3/YOUR-PROJECT-ID`
- QuickNode: `https://your-endpoint.quicknode.pro/...`

**Usage**: All blockchain interactions, contract calls, transaction broadcasting

---

### Multi-Chain RPC Configuration

Override default RPC URLs for specific chains (optional).

#### ETHEREUM_RPC_URL

**Type**: String (URL)  
**Default**: `https://eth.llamarpc.com`  
**Example**: `https://eth-mainnet.g.alchemy.com/v2/YOUR-API-KEY`

#### SEPOLIA_RPC_URL

**Type**: String (URL)  
**Default**: `https://ethereum-sepolia-rpc.publicnode.com`

#### POLYGON_RPC_URL

**Type**: String (URL)  
**Default**: `https://polygon-rpc.com`

#### POLYGON_AMOY_RPC_URL

**Type**: String (URL)  
**Default**: `https://rpc-amoy.polygon.technology`

#### BASE_RPC_URL

**Type**: String (URL)  
**Default**: `https://mainnet.base.org`

#### BASE_SEPOLIA_RPC_URL

**Type**: String (URL)  
**Default**: `https://sepolia.base.org`

#### ARBITRUM_RPC_URL

**Type**: String (URL)  
**Default**: `https://arb1.arbitrum.io/rpc`

#### ARBITRUM_SEPOLIA_RPC_URL

**Type**: String (URL)  
**Default**: `https://sepolia-rollup.arbitrum.io/rpc`

#### OPTIMISM_RPC_URL

**Type**: String (URL)  
**Default**: `https://mainnet.optimism.io`

#### OPTIMISM_SEPOLIA_RPC_URL

**Type**: String (URL)  
**Default**: `https://sepolia.optimism.io`

---

### Database Configuration

#### DATABASE_URL

**Required**: Yes  
**Type**: String (connection string)

Database connection string for Prisma.

**SQLite** (development):

```bash
DATABASE_URL="file:./dev.db"
```

**PostgreSQL** (production):

```bash
DATABASE_URL="postgresql://user:password@localhost:5432/dbname?schema=public"

# With connection pooling
DATABASE_URL="postgresql://user:password@localhost:5432/dbname?schema=public&connection_limit=10"

# With SSL
DATABASE_URL="postgresql://user:password@host:5432/dbname?sslmode=require"
```

**Components**:

- Protocol: `file:` (SQLite) or `postgresql:`
- User: Database username
- Password: Database password
- Host: Database server hostname
- Port: Database port (5432 for Postgres)
- Database: Database name
- Schema: Schema name (usually `public`)
- Options: Connection parameters

**Usage**: All database operations via Prisma ORM

---

### IPFS Configuration

#### WEB3_STORAGE_TOKEN

**Type**: String (JWT token)  
**Example**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

API token for Web3.Storage IPFS provider.

**How to get**:

1. Sign up at https://web3.storage
2. Create API token in dashboard
3. Copy token

**Usage**: Primary IPFS upload provider

---

#### PINATA_JWT

**Type**: String (JWT token)  
**Example**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

JWT token for Pinata IPFS provider.

**How to get**:

1. Sign up at https://pinata.cloud
2. Go to API Keys
3. Create new key with pinning permissions
4. Copy JWT

**Usage**: Fallback IPFS provider

---

#### IPFS_PROJECT_ID

**Type**: String  
**Example**: `2A1B3C4D5E6F7G8H`

Infura IPFS project ID.

**Usage**: Used with IPFS_PROJECT_SECRET for Infura IPFS

---

#### IPFS_PROJECT_SECRET

**Type**: String  
**Example**: `9a8b7c6d5e4f3g2h1i0j`

Infura IPFS project secret.

**Security**: Keep secret, don't commit to git

---

#### IPFS_API_URL

**Type**: String (URL)  
**Default**: `https://ipfs.infura.io:5001`  
**Example**: `http://127.0.0.1:5001` (local node)

IPFS API endpoint.

**Usage**:

- Infura IPFS API endpoint
- Local IPFS node API endpoint

---

#### IPFS_PROVIDER

**Type**: String (enum)  
**Options**: `web3storage`, `pinata`, `infura`, `local`  
**Example**: `web3storage`

Force a specific IPFS provider (disables automatic fallback).

**Usage**: Useful for testing or debugging specific provider

**Default behavior** (when not set):

1. Try Web3.Storage
2. Fallback to Pinata on 5xx errors
3. Fallback to Infura on 5xx errors

---

### API Configuration

#### API_KEY

**Type**: String  
**Example**: `supersecret123`

API key required for protected endpoints.

**Protected endpoints** (when set):

- `POST /api/upload`
- `POST /api/manifest`
- `POST /api/register`
- `POST /api/bind`
- `POST /api/bind-many`

**Public endpoints** (always):

- `GET /api/health`
- `POST /api/verify`
- `GET /api/contents`
- `GET /api/public-verify`

**Usage**: Include in request header: `x-api-key: YOUR_API_KEY`

**Example**:

```bash
curl -H "x-api-key: supersecret123" \
     -F file=@video.mp4 \
     http://localhost:3001/api/upload
```

---

#### PORT

**Type**: Number  
**Default**: `3001`  
**Example**: `8080`

Port for API server to listen on.

**Usage**: Change if default port is in use

---

### Caching Configuration

#### REDIS_URL

**Type**: String (connection string)  
**Example**: `redis://localhost:6379`

Redis connection URL for caching and rate limiting.

**Formats**:

```bash
# Local Redis
REDIS_URL=redis://localhost:6379

# With password
REDIS_URL=redis://:password@localhost:6379

# Redis cluster
REDIS_URL=redis://localhost:6379,localhost:6380

# Redis Sentinel
REDIS_URL=redis-sentinel://localhost:26379/mymaster

# Upstash (serverless)
REDIS_URL=rediss://default:password@host.upstash.io:6379

# AWS ElastiCache
REDIS_URL=rediss://master.xxx.cache.amazonaws.com:6379
```

**Features enabled**:

- Content metadata caching (10min TTL)
- Manifest caching (15min TTL)
- Platform binding caching (3min TTL)
- Rate limiting (per-IP, per-endpoint)

**Optional**: System works without Redis (falls back to database and in-memory)

---

### Logging Configuration

#### LOG_LEVEL

**Type**: String (enum)  
**Options**: `trace`, `debug`, `info`, `warn`, `error`, `fatal`  
**Default**: `info`

Logging verbosity level.

**Levels**:

- `trace`: Everything (very verbose)
- `debug`: Debugging information
- `info`: General information
- `warn`: Warnings
- `error`: Errors only
- `fatal`: Fatal errors only

**Example**:

```bash
# Development
LOG_LEVEL=debug

# Production
LOG_LEVEL=info

# Troubleshooting
LOG_LEVEL=trace
```

---

#### LOGTAIL_SOURCE_TOKEN

**Type**: String  
**Example**: `abc123def456`

BetterStack Logtail source token for log aggregation.

**How to get**:

1. Sign up at https://betterstack.com/logtail
2. Create source
3. Copy source token

**Usage**: Sends logs to BetterStack for analysis and alerting

---

#### DATADOG_API_KEY

**Type**: String  
**Example**: `1234567890abcdef`

Datadog API key for log forwarding.

**Usage**: Used with DATADOG_APP_KEY for Datadog integration

---

#### DATADOG_APP_KEY

**Type**: String  
**Example**: `abcdef1234567890`

Datadog application key.

---

#### DATADOG_SITE

**Type**: String  
**Default**: `datadoghq.com`  
**Example**: `datadoghq.eu`

Datadog site region.

---

#### ELASTICSEARCH_URL

**Type**: String (URL)  
**Example**: `https://elasticsearch.example.com:9200`

Elasticsearch endpoint for ELK stack logging.

**Usage**: Used with ELASTICSEARCH_USERNAME and ELASTICSEARCH_PASSWORD

---

#### ELASTICSEARCH_USERNAME

**Type**: String  
**Example**: `elastic`

---

#### ELASTICSEARCH_PASSWORD

**Type**: String

---

#### ELASTICSEARCH_INDEX

**Type**: String  
**Default**: `internet-id-logs`  
**Example**: `iid-prod-logs`

Elasticsearch index name for logs.

---

### Error Tracking

#### SENTRY_DSN

**Type**: String (DSN URL)  
**Example**: `https://abc123@o123456.ingest.sentry.io/7654321`

Sentry Data Source Name for error tracking.

**How to get**:

1. Sign up at https://sentry.io
2. Create project
3. Copy DSN from project settings

**Usage**: Automatic error reporting and performance monitoring

---

#### SENTRY_ENVIRONMENT

**Type**: String  
**Default**: `development`  
**Example**: `production`, `staging`

Environment name for Sentry error grouping.

---

### Email Configuration

#### EMAIL_FROM

**Type**: String (email address)  
**Example**: `noreply@internet-id.io`

Sender email address for notifications.

---

#### SENDGRID_API_KEY

**Type**: String  
**Example**: `SG.abcd1234efgh5678...`

SendGrid API key for email delivery.

**How to get**:

1. Sign up at https://sendgrid.com
2. Create API key with Mail Send permissions
3. Copy key

---

#### SMTP_HOST

**Type**: String  
**Example**: `smtp.gmail.com`

SMTP server hostname (alternative to SendGrid).

---

#### SMTP_PORT

**Type**: Number  
**Default**: `587`  
**Example**: `465` (SSL), `25` (no encryption)

---

#### SMTP_USER

**Type**: String  
**Example**: `your-email@gmail.com`

---

#### SMTP_PASSWORD

**Type**: String

SMTP authentication password or app password.

---

### SSL/TLS Configuration (Production)

#### DOMAIN

**Type**: String  
**Example**: `internet-id.io`

Primary domain name for SSL certificates.

---

#### SSL_EMAIL

**Type**: String (email address)  
**Example**: `admin@internet-id.io`

Email for Let's Encrypt certificate notifications.

---

#### SSL_ALERT_EMAIL

**Type**: String (email address)  
**Example**: `ops@internet-id.io`

Email for certificate expiration alerts.

---

#### CERT_WARNING_DAYS

**Type**: Number  
**Default**: `14`

Days before expiration to send warning alert.

---

#### CERT_CRITICAL_DAYS

**Type**: Number  
**Default**: `7`

Days before expiration to send critical alert.

---

#### CERTBOT_STAGING

**Type**: Number (0 or 1)  
**Default**: `0`  
**Example**: `1`

Use Let's Encrypt staging environment (for testing).

---

### Monitoring & Observability

#### PROMETHEUS_PORT

**Type**: Number  
**Default**: `9090`

Port for Prometheus metrics server.

---

#### GRAFANA_PORT

**Type**: Number  
**Default**: `3001`

Port for Grafana dashboard.

---

## Web Application Variables

Variables for Next.js web application (`web/.env.local`).

### API Configuration

#### NEXT_PUBLIC_API_BASE

**Required**: Yes  
**Type**: String (URL)  
**Example**: `http://localhost:3001`

Backend API base URL.

**Note**: `NEXT_PUBLIC_` prefix makes this available in browser.

**Environments**:

```bash
# Development
NEXT_PUBLIC_API_BASE=http://localhost:3001

# Staging
NEXT_PUBLIC_API_BASE=https://api-staging.internet-id.io

# Production
NEXT_PUBLIC_API_BASE=https://api.internet-id.io
```

---

#### NEXT_PUBLIC_API_KEY

**Type**: String  
**Example**: `supersecret123`

API key for protected endpoints (must match backend API_KEY).

**Note**: Available in browser - only use if API protection is needed on client

---

#### NEXT_PUBLIC_SITE_BASE

**Type**: String (URL)  
**Example**: `https://internet-id.io`

Public site URL for badges, share links, and QR codes.

**Development**: `http://localhost:3000`  
**Production**: Your production domain

---

### NextAuth Configuration

#### NEXTAUTH_URL

**Required**: Yes  
**Type**: String (URL)  
**Example**: `http://localhost:3000`

Canonical URL of your site (used for callbacks).

**Environments**:

```bash
# Development
NEXTAUTH_URL=http://localhost:3000

# Production
NEXTAUTH_URL=https://internet-id.io
```

---

#### NEXTAUTH_SECRET

**Required**: Yes  
**Type**: String (32+ characters)  
**Example**: `A7xB2yC9zD4wE1vF8uG5tH6sI3jK0l...`

Secret for encrypting session tokens.

**Generate**:

```bash
openssl rand -base64 32
```

**Security**: 🔴 Keep secret, unique per environment

---

### OAuth Providers

#### GITHUB_ID

**Type**: String  
**Example**: `Iv1.a1b2c3d4e5f6g7h8`

GitHub OAuth App client ID.

**How to get**:

1. Go to https://github.com/settings/developers
2. New OAuth App
3. Set callback: `http://localhost:3000/api/auth/callback/github`
4. Copy Client ID

---

#### GITHUB_SECRET

**Type**: String  
**Example**: `1234567890abcdef...`

GitHub OAuth App client secret.

---

#### GOOGLE_CLIENT_ID

**Type**: String  
**Example**: `123456789-abc.apps.googleusercontent.com`

Google OAuth client ID.

**How to get**:

1. Go to https://console.cloud.google.com
2. APIs & Services → Credentials
3. Create OAuth 2.0 Client ID (Web application)
4. Add redirect: `http://localhost:3000/api/auth/callback/google`

---

#### GOOGLE_CLIENT_SECRET

**Type**: String  
**Example**: `GOCSPX-abc123...`

---

#### TWITTER_CLIENT_ID

**Type**: String  
**Example**: `a1b2c3d4e5f6g7h8...`

Twitter OAuth 2.0 client ID.

---

#### TWITTER_CLIENT_SECRET

**Type**: String

---

#### TIKTOK_CLIENT_ID

**Type**: String

TikTok OAuth app key.

---

#### TIKTOK_CLIENT_SECRET

**Type**: String

---

### Database (Web)

#### DATABASE_URL

**Required**: Yes  
**Type**: String (connection string)

**Must match root `.env` DATABASE_URL**.

**For SQLite**:

```bash
DATABASE_URL="file:../dev.db"
```

**For PostgreSQL**:

```bash
DATABASE_URL="postgresql://user:password@localhost:5432/dbname?schema=public"
```

---

### Analytics & Tracking

#### NEXT_PUBLIC_GA_MEASUREMENT_ID

**Type**: String  
**Example**: `G-XXXXXXXXXX`

Google Analytics 4 measurement ID.

---

#### NEXT_PUBLIC_POSTHOG_KEY

**Type**: String  
**Example**: `phc_abc123...`

PostHog analytics project API key.

---

#### NEXT_PUBLIC_POSTHOG_HOST

**Type**: String  
**Default**: `https://app.posthog.com`

PostHog instance URL.

---

## Deployment Variables

Variables for Docker, CI/CD, and production deployments.

### Docker Configuration

#### NODE_ENV

**Type**: String (enum)  
**Options**: `development`, `staging`, `production`  
**Default**: `development`

Node.js environment mode.

**Effects**:

- `production`: Optimizations enabled, verbose logging disabled
- `development`: Debug mode, hot reload
- `staging`: Production-like with extra logging

---

#### COMPOSE_PROJECT_NAME

**Type**: String  
**Default**: `internet-id`

Docker Compose project name.

---

### Backup Configuration

#### S3_BUCKET

**Type**: String  
**Example**: `internet-id-backups`

S3-compatible bucket for database backups.

---

#### S3_ENDPOINT

**Type**: String  
**Example**: `https://s3.amazonaws.com`

S3 endpoint URL (AWS S3, MinIO, DigitalOcean Spaces, etc.).

---

#### S3_ACCESS_KEY

**Type**: String

S3 access key ID.

---

#### S3_SECRET_KEY

**Type**: String

S3 secret access key.

---

#### BACKUP_ENCRYPTION_KEY

**Type**: String (32 hex characters)

Encryption key for backup files.

**Generate**:

```bash
openssl rand -hex 32
```

---

## CI/CD Variables

Environment variables for GitHub Actions workflows.

### GitHub Actions Secrets

Set in repository: Settings → Secrets and variables → Actions

#### DOCKER_USERNAME

Docker Hub username for image publishing.

---

#### DOCKER_PASSWORD

Docker Hub personal access token.

---

#### DEPLOY_SSH_KEY

SSH private key for deployment to servers.

---

#### DEPLOY_HOST

Deployment server hostname.

---

#### DEPLOY_USER

SSH username for deployment.

---

## Security Best Practices

### Never Commit Secrets

**Always exclude from git**:

- `PRIVATE_KEY`
- `API_KEY`
- `NEXTAUTH_SECRET`
- OAuth secrets
- Database passwords
- API tokens

**Check `.gitignore`**:

```bash
.env
.env.*
!.env.example
web/.env.local
```

---

### Use Different Keys Per Environment

```bash
# Development (separate wallet)
PRIVATE_KEY=0x1111...

# Staging (separate wallet)
PRIVATE_KEY=0x2222...

# Production (separate wallet, hardware wallet recommended)
PRIVATE_KEY=0x3333...
```

---

### Rotate Secrets Regularly

**Schedule**:

- API keys: Every 90 days
- OAuth secrets: Every 180 days
- Database passwords: Every 90 days
- NEXTAUTH_SECRET: Every year

---

### Use Secret Management

**For production**, use:

- AWS Secrets Manager
- HashiCorp Vault
- Azure Key Vault
- Google Secret Manager

**Example** (AWS):

```bash
# Store secret
aws secretsmanager create-secret --name internet-id-private-key --secret-string "0x..."

# Retrieve in script
PRIVATE_KEY=$(aws secretsmanager get-secret-value --secret-id internet-id-private-key --query SecretString --output text)
```

---

### Validate Environment Variables

**Add validation script** (`scripts/validate-env.ts`):

```typescript
import dotenv from "dotenv";

dotenv.config();

const required = ["PRIVATE_KEY", "RPC_URL", "DATABASE_URL"];

for (const key of required) {
  if (!process.env[key]) {
    console.error(`❌ Missing required environment variable: ${key}`);
    process.exit(1);
  }
}

console.log("✅ All required environment variables are set");
```

Run before deployment:

```bash
npm run validate-env
```

---

### Use .env.example Template

Keep `.env.example` updated with:

- All variable names
- Example values (safe/dummy)
- Comments explaining usage

**Never put real secrets in `.env.example`!**

---

## Quick Setup Checklists

### Development Setup

```bash
# 1. Copy templates
cp .env.example .env
cd web && cp .env.example .env.local && cd ..

# 2. Essential variables
# Edit .env:
PRIVATE_KEY=<generate-or-use-test-key>
RPC_URL=https://sepolia.base.org
DATABASE_URL="file:./dev.db"
WEB3_STORAGE_TOKEN=<get-from-web3.storage>

# Edit web/.env.local:
NEXT_PUBLIC_API_BASE=http://localhost:3001
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=<openssl rand -base64 32>
DATABASE_URL="file:../dev.db"

# 3. Verify
source .env && echo $PRIVATE_KEY  # Should show key
```

### Production Setup

```bash
# All development variables +
REDIS_URL=redis://production-redis:6379
SENTRY_DSN=https://...@sentry.io/...
LOG_LEVEL=info
NODE_ENV=production
DATABASE_URL="postgresql://..."
NEXT_PUBLIC_SITE_BASE=https://your-domain.com
# + SSL certificates
# + Backup configuration
# + Monitoring
```

---

## Troubleshooting

### Variables Not Loading

```bash
# Check file exists
ls -la .env

# Check file has no BOM (byte order mark)
file .env  # Should be "ASCII text"

# Check syntax (no spaces around =)
cat .env | grep "PRIVATE_KEY ="  # WRONG
cat .env | grep "PRIVATE_KEY="   # CORRECT

# Force reload
source .env
echo $PRIVATE_KEY
```

### Variable Not Available in Process

```typescript
// Load dotenv at top of file
import dotenv from "dotenv";
dotenv.config();

// Then access
console.log(process.env.PRIVATE_KEY);
```

### Next.js Public Variables Not Working

**Must start with `NEXT_PUBLIC_`**:

```bash
# ❌ Not available in browser
API_BASE=http://localhost:3001

# ✅ Available in browser
NEXT_PUBLIC_API_BASE=http://localhost:3001
```

**Restart dev server** after changing .env.local.

---

## Additional Resources

- [dotenv Documentation](https://github.com/motdotla/dotenv)
- [Next.js Environment Variables](https://nextjs.org/docs/basic-features/environment-variables)
- [12-Factor App Config](https://12factor.net/config)
- [Security Policy](../SECURITY_POLICY.md)
- [Deployment Guide](./ops/DEPLOYMENT_PLAYBOOK.md)
