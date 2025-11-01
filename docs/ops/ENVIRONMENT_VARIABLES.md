# Environment Variables Reference

Complete reference for all environment variables used in Internet-ID deployments. This document follows the [Twelve-Factor App](https://12factor.net/) methodology for configuration management.

## Table of Contents

- [Core Application](#core-application)
- [Database Configuration](#database-configuration)
- [Blockchain Configuration](#blockchain-configuration)
- [IPFS Configuration](#ipfs-configuration)
- [API Security](#api-security)
- [Authentication](#authentication)
- [Caching](#caching)
- [Logging & Observability](#logging--observability)
- [SSL/TLS](#ssltls)
- [Backup & Recovery](#backup--recovery)
- [Deployment](#deployment)

## Core Application

### NODE_ENV

**Description**: Specifies the runtime environment.

**Values**: `development` | `staging` | `production`

**Required**: Yes

**Default**: `development`

**Example**:

```bash
NODE_ENV=production
```

**Notes**: Affects logging levels, error handling, and performance optimizations.

---

### DOMAIN

**Description**: Primary domain name for the application.

**Required**: Yes (for production/staging)

**Example**:

```bash
DOMAIN=internet-id.example.com
```

**Notes**: Used for SSL certificates, CORS, and NextAuth URL configuration.

---

### PORT

**Description**: Port for API server.

**Required**: No

**Default**: `3001`

**Example**:

```bash
PORT=3001
```

---

### NEXT_PUBLIC_API_BASE

**Description**: Public-facing API URL for frontend.

**Required**: Yes (for web app)

**Example**:

```bash
NEXT_PUBLIC_API_BASE=https://internet-id.example.com/api
```

**Notes**: Must be publicly accessible. Used by browser clients.

---

### NEXT_PUBLIC_SITE_BASE

**Description**: Public-facing web application URL.

**Required**: Yes (for web app)

**Example**:

```bash
NEXT_PUBLIC_SITE_BASE=https://internet-id.example.com
```

**Notes**: Used for generating share links and QR codes.

---

## Database Configuration

### DATABASE_URL

**Description**: PostgreSQL connection string.

**Required**: Yes

**Format**: `postgresql://USER:PASSWORD@HOST:PORT/DATABASE?schema=SCHEMA`

**Example**:

```bash
DATABASE_URL=postgresql://internetid:securepass@db:5432/internetid?schema=public
```

**Security**: **NEVER** commit this to version control. Use secrets management.

**Notes**:

- For SQLite (dev only): `file:./dev.db`
- Include `?schema=public` for PostgreSQL
- Use connection pooling in production (e.g., PgBouncer)

---

### POSTGRES_USER

**Description**: PostgreSQL username.

**Required**: Yes (for Docker Compose)

**Example**:

```bash
POSTGRES_USER=internetid
```

---

### POSTGRES_PASSWORD

**Description**: PostgreSQL password.

**Required**: Yes (for Docker Compose)

**Security**: Use strong passwords (32+ characters, alphanumeric + special chars)

**Example**:

```bash
POSTGRES_PASSWORD=YOUR_SECURE_PASSWORD_HERE
```

**Generation**:

```bash
openssl rand -base64 32
```

---

### POSTGRES_DB

**Description**: PostgreSQL database name.

**Required**: Yes (for Docker Compose)

**Example**:

```bash
POSTGRES_DB=internetid
```

**Recommendations**:

- Staging: `internetid_staging`
- Production: `internetid`

---

## Blockchain Configuration

### PRIVATE_KEY

**Description**: Ethereum private key for deploying contracts and signing transactions.

**Required**: Yes

**Format**: 64-character hex string (with or without `0x` prefix)

**Security**: **CRITICAL** - Never expose this value

**Example**:

```bash
PRIVATE_KEY=0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890
```

**Generation**:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

**Notes**: Ensure the corresponding address has sufficient funds for gas fees.

---

### RPC_URL

**Description**: Blockchain RPC endpoint.

**Required**: Yes

**Example**:

```bash
# Staging (testnets)
RPC_URL=https://sepolia.base.org

# Production (mainnets)
RPC_URL=https://mainnet.base.org
```

**Recommended Providers**:

- **Alchemy**: https://alchemy.com
- **Infura**: https://infura.io
- **QuickNode**: https://quicknode.com
- **Public RPCs**: See [config/chains.ts](../../config/chains.ts)

**Notes**: Public RPCs may have rate limits. Use dedicated endpoints for production.

---

### Chain-Specific RPC URLs

Override default RPC URLs for specific chains:

```bash
# Ethereum
ETHEREUM_RPC_URL=https://eth.llamarpc.com
SEPOLIA_RPC_URL=https://ethereum-sepolia-rpc.publicnode.com

# Polygon
POLYGON_RPC_URL=https://polygon-rpc.com
POLYGON_AMOY_RPC_URL=https://rpc-amoy.polygon.technology

# Base
BASE_RPC_URL=https://mainnet.base.org
BASE_SEPOLIA_RPC_URL=https://sepolia.base.org

# Arbitrum
ARBITRUM_RPC_URL=https://arb1.arbitrum.io/rpc
ARBITRUM_SEPOLIA_RPC_URL=https://sepolia-rollup.arbitrum.io/rpc

# Optimism
OPTIMISM_RPC_URL=https://mainnet.optimism.io
OPTIMISM_SEPOLIA_RPC_URL=https://sepolia.optimism.io
```

---

## IPFS Configuration

### IPFS_PROVIDER

**Description**: IPFS provider to use.

**Required**: No

**Values**: `web3storage` | `pinata` | `infura` | `local`

**Default**: Auto-detect based on available credentials

**Example**:

```bash
IPFS_PROVIDER=web3storage
```

---

### WEB3_STORAGE_TOKEN

**Description**: Web3.Storage API token.

**Required**: If using Web3.Storage

**Example**:

```bash
WEB3_STORAGE_TOKEN=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Get Token**: https://web3.storage

---

### PINATA_JWT

**Description**: Pinata JWT token.

**Required**: If using Pinata

**Example**:

```bash
PINATA_JWT=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Get Token**: https://pinata.cloud

---

### IPFS_API_URL

**Description**: IPFS API endpoint.

**Required**: If using Infura or local IPFS

**Example**:

```bash
# Infura
IPFS_API_URL=https://ipfs.infura.io:5001

# Local
IPFS_API_URL=http://127.0.0.1:5001
```

---

### IPFS_PROJECT_ID

**Description**: Infura IPFS project ID.

**Required**: If using Infura IPFS

**Example**:

```bash
IPFS_PROJECT_ID=your_project_id
```

---

### IPFS_PROJECT_SECRET

**Description**: Infura IPFS project secret.

**Required**: If using Infura IPFS

**Security**: Keep confidential

**Example**:

```bash
IPFS_PROJECT_SECRET=your_project_secret
```

---

## API Security

### API_KEY

**Description**: API key for protected endpoints.

**Required**: Recommended for production

**Security**: Use strong, random keys

**Example**:

```bash
API_KEY=iid_prod_a1b2c3d4e5f6g7h8i9j0
```

**Generation**:

```bash
openssl rand -base64 32 | tr -d "=+/" | cut -c1-32
```

**Protected Endpoints**:

- `POST /api/upload`
- `POST /api/manifest`
- `POST /api/register`
- `POST /api/bind`

**Usage**:

```bash
curl -H "x-api-key: $API_KEY" https://api.example.com/api/upload
```

---

## Authentication

### NEXTAUTH_SECRET

**Description**: NextAuth.js secret for JWT signing.

**Required**: Yes (for web app)

**Security**: **CRITICAL** - Must be kept secret

**Example**:

```bash
NEXTAUTH_SECRET=your_secret_here
```

**Generation**:

```bash
openssl rand -base64 32
```

---

### NEXTAUTH_URL

**Description**: Canonical URL for NextAuth callbacks.

**Required**: Yes (for web app)

**Example**:

```bash
NEXTAUTH_URL=https://internet-id.example.com
```

---

### OAuth Provider Credentials

#### GitHub

```bash
GITHUB_ID=your_github_client_id
GITHUB_SECRET=your_github_client_secret
```

**Get Credentials**: https://github.com/settings/developers

---

#### Google

```bash
GOOGLE_ID=your_google_client_id.apps.googleusercontent.com
GOOGLE_SECRET=your_google_client_secret
```

**Get Credentials**: https://console.cloud.google.com/apis/credentials

---

#### Twitter/X

```bash
TWITTER_ID=your_twitter_client_id
TWITTER_SECRET=your_twitter_client_secret
```

---

## Caching

### REDIS_URL

**Description**: Redis connection URL.

**Required**: Recommended for production

**Example**:

```bash
REDIS_URL=redis://redis:6379
```

**With Authentication**:

```bash
REDIS_URL=redis://:password@redis:6379
```

**Notes**:

- Cache is optional but recommended for performance
- Gracefully degrades if Redis is unavailable

---

## Logging & Observability

### LOG_LEVEL

**Description**: Logging verbosity level.

**Required**: No

**Values**: `trace` | `debug` | `info` | `warn` | `error` | `fatal`

**Default**: `info`

**Recommendations**:

- Development: `debug`
- Staging: `debug`
- Production: `info`

**Example**:

```bash
LOG_LEVEL=info
```

---

### LOGTAIL_SOURCE_TOKEN

**Description**: Logtail (BetterStack) source token for log aggregation.

**Required**: No (recommended for production)

**Example**:

```bash
LOGTAIL_SOURCE_TOKEN=your_logtail_token
```

---

### DATADOG_API_KEY

**Description**: Datadog API key for metrics and logging.

**Required**: No

**Example**:

```bash
DATADOG_API_KEY=your_datadog_api_key
DATADOG_APP_KEY=your_datadog_app_key
DATADOG_SITE=datadoghq.com
```

---

### ELASTICSEARCH_URL

**Description**: Elasticsearch endpoint for log aggregation.

**Required**: No

**Example**:

```bash
ELASTICSEARCH_URL=https://elasticsearch.example.com:9200
ELASTICSEARCH_USERNAME=elastic
ELASTICSEARCH_PASSWORD=your_password
ELASTICSEARCH_INDEX=internet-id-logs
```

---

## SSL/TLS

### SSL_EMAIL

**Description**: Email for Let's Encrypt notifications.

**Required**: Yes (for production/staging)

**Example**:

```bash
SSL_EMAIL=ops@example.com
```

---

### SSL_ALERT_EMAIL

**Description**: Email for SSL certificate expiration alerts.

**Required**: No

**Example**:

```bash
SSL_ALERT_EMAIL=ops@example.com
```

---

### CERTBOT_STAGING

**Description**: Use Let's Encrypt staging environment.

**Required**: No

**Values**: `0` (production) | `1` (staging)

**Default**: `0`

**Example**:

```bash
CERTBOT_STAGING=1
```

**Notes**: Use staging for testing to avoid rate limits.

---

## Backup & Recovery

### BACKUP_DIR

**Description**: Directory for database backups.

**Required**: No

**Default**: `/var/lib/postgresql/backups`

**Example**:

```bash
BACKUP_DIR=/var/lib/postgresql/backups
```

---

### RETENTION_DAYS

**Description**: Number of days to retain backups.

**Required**: No

**Default**:

- Staging: `7`
- Production: `30`

**Example**:

```bash
RETENTION_DAYS=30
```

---

### S3_BUCKET

**Description**: S3 bucket for remote backup storage.

**Required**: Recommended for production

**Example**:

```bash
S3_BUCKET=internet-id-backups
S3_REGION=us-east-1
```

---

### AWS_ACCESS_KEY_ID

**Description**: AWS access key for S3 backups.

**Required**: If using S3

**Security**: Use IAM roles instead when possible

**Example**:

```bash
AWS_ACCESS_KEY_ID=AKIAIOSFODNN7EXAMPLE
AWS_SECRET_ACCESS_KEY=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY
```

---

## Deployment

### COMPOSE_FILE

**Description**: Docker Compose file to use.

**Required**: No

**Values**: `docker-compose.yml` | `docker-compose.staging.yml` | `docker-compose.production.yml`

**Example**:

```bash
COMPOSE_FILE=docker-compose.production.yml
```

---

## Environment File Templates

### Development (`.env`)

```bash
NODE_ENV=development
DATABASE_URL=file:./dev.db
RPC_URL=http://127.0.0.1:8545
PRIVATE_KEY=0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
LOG_LEVEL=debug
```

### Staging (`.env.staging`)

See [Deployment Playbook](./DEPLOYMENT_PLAYBOOK.md#environment-variables) for complete template.

### Production (`.env.production`)

See [Deployment Playbook](./DEPLOYMENT_PLAYBOOK.md#environment-variables) for complete template.

---

## Security Best Practices

1. **Never commit secrets** to version control
2. **Use secret management** systems (GitHub Secrets, AWS Secrets Manager, Vault)
3. **Rotate credentials** regularly (quarterly recommended)
4. **Use strong passwords** (32+ characters, random)
5. **Restrict access** to production secrets (need-to-know basis)
6. **Audit access** to secrets regularly
7. **Use environment-specific** keys (different for staging/production)
8. **Enable audit logging** for secret access

## References

- [Twelve-Factor App - Config](https://12factor.net/config)
- [Deployment Playbook](./DEPLOYMENT_PLAYBOOK.md)
- [Secret Management](./SECRET_MANAGEMENT.md)
- [Security Policy](../../SECURITY_POLICY.md)
