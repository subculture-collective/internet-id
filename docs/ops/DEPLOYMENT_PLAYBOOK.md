# Deployment Playbook

This playbook provides step-by-step instructions for deploying Internet-ID to staging and production environments.

## Table of Contents

- [Overview](#overview)
- [Prerequisites](#prerequisites)
- [Environment Setup](#environment-setup)
- [Staging Deployment](#staging-deployment)
- [Production Deployment](#production-deployment)
- [Rollback Procedures](#rollback-procedures)
- [Monitoring and Validation](#monitoring-and-validation)
- [Troubleshooting](#troubleshooting)

## Overview

Internet-ID uses a two-tier deployment strategy:

- **Staging**: Automatic deployment on merge to `main` branch
- **Production**: Manual deployment with approval gates and health checks

Both environments use Docker containers orchestrated with Docker Compose, deployed via GitHub Actions.

## Prerequisites

### Infrastructure Requirements

- **Staging Server**: 4 CPU, 8GB RAM, 100GB SSD
- **Production Server**: 8 CPU, 16GB RAM, 500GB SSD
- **Database**: PostgreSQL 16+ with WAL archiving enabled
- **Cache**: Redis 7+ (optional but recommended)
- **Reverse Proxy**: Nginx with SSL/TLS (Let's Encrypt)
- **Container Registry**: GitHub Container Registry (ghcr.io)

### Access Requirements

1. **GitHub Secrets** (configured in repository settings):
   - `STAGING_HOST` - Staging server hostname/IP
   - `STAGING_USER` - SSH username for staging
   - `STAGING_SSH_KEY` - Private SSH key for staging access
   - `PRODUCTION_HOST` - Production server hostname/IP
   - `PRODUCTION_USER` - SSH username for production
   - `PRODUCTION_SSH_KEY` - Private SSH key for production access

2. **Server Setup**:
   - Docker 24+ installed
   - Docker Compose v2+ installed
   - SSH access configured
   - Firewall rules allowing HTTP/HTTPS traffic
   - SSL certificates configured (Let's Encrypt recommended)

3. **Environment Variables** (see [Environment Variables](#environment-variables))

## Environment Setup

### 1. Server Preparation

On both staging and production servers:

```bash
# Install Docker
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER

# Install Docker Compose
sudo apt-get update
sudo apt-get install docker-compose-plugin

# Create application directory
sudo mkdir -p /opt/internet-id
sudo chown $USER:$USER /opt/internet-id

# Clone repository
cd /opt/internet-id
git clone https://github.com/subculture-collective/internet-id.git .
```

### 2. Environment Variables

Create environment files for each environment:

**Staging** (`/opt/internet-id/.env.staging`):

```bash
# Node environment
NODE_ENV=staging

# Domain configuration
DOMAIN=staging.internet-id.example.com

# Database configuration
DATABASE_URL=postgresql://internetid:CHANGE_ME@db:5432/internetid_staging?schema=public
POSTGRES_USER=internetid
POSTGRES_PASSWORD=CHANGE_ME
POSTGRES_DB=internetid_staging

# API security
API_KEY=CHANGE_ME_staging_api_key

# Blockchain configuration
RPC_URL=https://sepolia.base.org
PRIVATE_KEY=CHANGE_ME

# IPFS configuration (choose one)
WEB3_STORAGE_TOKEN=CHANGE_ME
# OR
PINATA_JWT=CHANGE_ME

# Redis cache
REDIS_URL=redis://redis:6379

# NextAuth configuration
NEXTAUTH_SECRET=CHANGE_ME
NEXTAUTH_URL=https://staging.internet-id.example.com

# OAuth providers
GITHUB_ID=CHANGE_ME
GITHUB_SECRET=CHANGE_ME
GOOGLE_ID=CHANGE_ME
GOOGLE_SECRET=CHANGE_ME

# Logging
LOG_LEVEL=debug

# Backup configuration
RETENTION_DAYS=7
S3_BUCKET=internet-id-backups-staging
S3_REGION=us-east-1
AWS_ACCESS_KEY_ID=CHANGE_ME
AWS_SECRET_ACCESS_KEY=CHANGE_ME

# SSL/TLS
SSL_EMAIL=ops@example.com
```

**Production** (`/opt/internet-id/.env.production`):

```bash
# Node environment
NODE_ENV=production

# Domain configuration
DOMAIN=internet-id.example.com

# Database configuration
DATABASE_URL=postgresql://internetid:CHANGE_ME@db:5432/internetid?schema=public
POSTGRES_USER=internetid
POSTGRES_PASSWORD=CHANGE_ME
POSTGRES_DB=internetid

# API security
API_KEY=CHANGE_ME_production_api_key

# Blockchain configuration
RPC_URL=https://mainnet.base.org
PRIVATE_KEY=CHANGE_ME

# IPFS configuration
WEB3_STORAGE_TOKEN=CHANGE_ME
PINATA_JWT=CHANGE_ME

# Redis cache
REDIS_URL=redis://redis:6379

# NextAuth configuration
NEXTAUTH_SECRET=CHANGE_ME
NEXTAUTH_URL=https://internet-id.example.com

# OAuth providers
GITHUB_ID=CHANGE_ME
GITHUB_SECRET=CHANGE_ME
GOOGLE_ID=CHANGE_ME
GOOGLE_SECRET=CHANGE_ME

# Logging
LOG_LEVEL=info

# Backup configuration
RETENTION_DAYS=30
S3_BUCKET=internet-id-backups-production
S3_REGION=us-east-1
AWS_ACCESS_KEY_ID=CHANGE_ME
AWS_SECRET_ACCESS_KEY=CHANGE_ME

# SSL/TLS
SSL_EMAIL=ops@example.com
```

### 3. SSL Certificate Setup

```bash
# Obtain SSL certificate
cd /opt/internet-id/ops/ssl
export DOMAIN=your-domain.com
export SSL_EMAIL=admin@your-domain.com
./manage-certs.sh obtain

# Verify SSL configuration
./test-ssl-config.sh

# Setup auto-renewal
sudo cp certbot-cron /etc/cron.d/certbot-renewal
sudo systemctl restart cron
```

### 4. Initial Database Setup

```bash
# Start database service only
docker compose -f docker-compose.staging.yml up -d db

# Wait for database to be ready
sleep 10

# Run migrations
docker compose -f docker-compose.staging.yml run --rm api npx prisma migrate deploy

# Seed staging data (optional)
docker compose -f docker-compose.staging.yml run --rm api npm run db:seed
```

## Staging Deployment

### Automatic Deployment

Staging deploys automatically on every merge to the `main` branch:

1. **Trigger**: Push or merge to `main` branch
2. **CI/CD Process**:
   - Runs linting and tests
   - Builds Docker images
   - Pushes images to GitHub Container Registry
   - Deploys to staging server
   - Runs database migrations
   - Seeds test data
   - Executes smoke tests

### Manual Deployment

To manually trigger a staging deployment:

1. Go to **Actions** → **Deploy to Staging**
2. Click **Run workflow**
3. Select branch (default: `main`)
4. Optionally skip smoke tests
5. Click **Run workflow**

### Verification

After deployment, verify the staging environment:

```bash
# Check service health
curl https://staging.internet-id.example.com/api/health

# Verify API network connectivity
curl https://staging.internet-id.example.com/api/network

# Check web application
curl -I https://staging.internet-id.example.com

# View logs
ssh staging-server "cd /opt/internet-id && docker compose -f docker-compose.staging.yml logs -f --tail=100"
```

## Production Deployment

### Pre-deployment Checklist

- [ ] All changes tested in staging
- [ ] Database migrations tested and verified
- [ ] Breaking changes documented
- [ ] Rollback plan prepared
- [ ] Monitoring and alerting configured
- [ ] Stakeholders notified
- [ ] Backup verified and recent

### Manual Deployment Process

Production deployments are **manual only** with approval gates:

1. **Initiate Deployment**:
   - Go to **Actions** → **Deploy to Production**
   - Click **Run workflow**
   - Enter version tag (e.g., `v1.0.0` or git SHA)
   - Review deployment parameters
   - Click **Run workflow**

2. **Validation Phase**:
   - Pre-deployment validation runs
   - Database schema changes detected (if any)
   - Docker images built and pushed

3. **Approval Gate**:
   - Deployment pauses for manual approval
   - Review validation results
   - Confirm deployment readiness
   - Approve or reject deployment

4. **Deployment Phase**:
   - Pre-deployment backup created
   - Database migrations executed
   - Blue-green deployment (zero downtime)
   - Health checks performed
   - Old containers scaled down

5. **Validation Phase**:
   - Smoke tests executed
   - Service health verified
   - Monitoring checked

### Zero-Downtime Deployment

Production uses blue-green deployment strategy:

1. New containers started alongside old ones (4 instances each)
2. Health checks verify new containers
3. Traffic gradually shifted to new containers
4. Old containers scaled down (2 instances remain)
5. Final cleanup after stabilization period

### Post-Deployment Verification

```bash
# Check service health
curl https://internet-id.example.com/api/health

# Verify metrics endpoint
curl https://internet-id.example.com/api/metrics

# Check database connectivity
curl https://internet-id.example.com/api/network

# Verify content registry
curl https://internet-id.example.com/api/registry

# Monitor logs
ssh production-server "cd /opt/internet-id && docker compose -f docker-compose.production.yml logs -f --tail=100"
```

## Rollback Procedures

### Automatic Rollback

If deployment fails smoke tests, automatic rollback is triggered:

1. Previous version SHA restored from `.deployment-backup`
2. Containers rolled back to previous version
3. Database rollback evaluated (manual intervention may be required)
4. Health checks performed
5. Alerts sent to ops team

### Manual Rollback

To manually rollback a deployment:

#### Quick Rollback (No Database Changes)

```bash
# SSH to production server
ssh production-server

cd /opt/internet-id

# Get previous version
PREV_VERSION=$(cat .deployment-backup)

# Rollback code
git checkout $PREV_VERSION

# Restart containers
docker compose -f docker-compose.production.yml up -d --force-recreate

# Verify health
docker compose -f docker-compose.production.yml ps
```

#### Full Rollback (With Database Restore)

```bash
# SSH to production server
ssh production-server

cd /opt/internet-id

# Stop services
docker compose -f docker-compose.production.yml down

# Restore database from backup
docker compose -f docker-compose.production.yml up -d db
sleep 10

# Restore from most recent backup
docker compose -f docker-compose.production.yml exec backup \
  /opt/backup-scripts/restore-database.sh full

# Rollback code
PREV_VERSION=$(cat .deployment-backup)
git checkout $PREV_VERSION

# Start all services
docker compose -f docker-compose.production.yml up -d

# Verify health
sleep 30
curl https://internet-id.example.com/api/health
```

#### Point-in-Time Recovery

For surgical rollback to specific timestamp:

```bash
# Stop services
docker compose -f docker-compose.production.yml down

# Start database
docker compose -f docker-compose.production.yml up -d db
sleep 10

# Point-in-time recovery
export RESTORE_TARGET_TIME="2025-10-31 18:00:00"
docker compose -f docker-compose.production.yml exec backup \
  /opt/backup-scripts/restore-database.sh pitr

# Restart services
docker compose -f docker-compose.production.yml up -d
```

### Rollback Decision Matrix

| Scenario | Action | Database Restore |
|----------|--------|------------------|
| Service not starting | Quick rollback | No |
| API errors without DB changes | Quick rollback | No |
| Failed migration | Full rollback | Yes |
| Data corruption | Full rollback + PITR | Yes |
| Performance issues | Investigate first | Maybe |

## Monitoring and Validation

### Health Check Endpoints

- **API Health**: `GET /api/health` - Returns 200 if healthy
- **Metrics**: `GET /api/metrics` - Prometheus-format metrics
- **Network**: `GET /api/network` - Blockchain connectivity
- **Registry**: `GET /api/registry` - Contract registry address

### Key Metrics to Monitor

1. **Service Health**:
   - Container status (healthy/unhealthy)
   - Response times (p50, p95, p99)
   - Error rates (4xx, 5xx)

2. **Database**:
   - Connection pool utilization
   - Query performance
   - Replication lag

3. **Cache**:
   - Hit rate
   - Memory usage
   - Eviction rate

4. **Infrastructure**:
   - CPU utilization
   - Memory usage
   - Disk I/O
   - Network throughput

### Alerting

Configure alerts for:

- Service downtime (> 1 minute)
- High error rate (> 5%)
- Database connection failures
- High response times (p95 > 2s)
- Certificate expiration (< 14 days)
- Backup failures
- Disk space (> 80% full)

## Troubleshooting

### Common Issues

#### 1. Service Won't Start

```bash
# Check logs
docker compose logs api

# Common causes:
# - Missing environment variables
# - Database connection failure
# - Port already in use
# - Image pull failure

# Solutions:
docker compose down
docker compose pull
docker compose up -d
```

#### 2. Database Migration Failures

```bash
# Check migration status
docker compose exec api npx prisma migrate status

# Reset and retry (DANGEROUS - data loss)
docker compose exec api npx prisma migrate reset --force
docker compose exec api npx prisma migrate deploy
```

#### 3. SSL Certificate Issues

```bash
# Check certificate expiration
cd ops/ssl
./check-cert-expiry.sh

# Renew certificate
./manage-certs.sh renew

# Test SSL configuration
./test-ssl-config.sh
```

#### 4. Health Check Failures

```bash
# Check container status
docker compose ps

# Check logs for errors
docker compose logs --tail=100

# Restart unhealthy services
docker compose restart api web
```

#### 5. Performance Issues

```bash
# Check resource usage
docker stats

# Check database performance
docker compose exec db pg_stat_statements

# Check cache hit rate
curl http://localhost:3001/api/cache/metrics

# Scale up services
docker compose up -d --scale api=4 --scale web=4
```

### Emergency Contacts

- **Ops Lead**: ops@example.com
- **On-Call**: +1-555-0100
- **Slack**: #internet-id-ops
- **PagerDuty**: https://example.pagerduty.com

## References

- [Environment Variables Reference](./ENVIRONMENT_VARIABLES.md)
- [Database Backup & Recovery](./DATABASE_BACKUP_RECOVERY.md)
- [Disaster Recovery Runbook](./DISASTER_RECOVERY_RUNBOOK.md)
- [Observability Guide](../OBSERVABILITY.md)
- [Security Policy](../../SECURITY_POLICY.md)
- [Roadmap Issue #10](https://github.com/subculture-collective/internet-id/issues/10)
