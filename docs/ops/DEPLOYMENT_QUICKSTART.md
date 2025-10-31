# Deployment Quick Start Guide

Quick reference for deploying Internet-ID to staging and production environments.

## Prerequisites Checklist

- [ ] GitHub repository secrets configured (see [Deployment Playbook](./DEPLOYMENT_PLAYBOOK.md#access-requirements))
- [ ] Server infrastructure provisioned (Docker, Docker Compose installed)
- [ ] Environment variables configured on servers
- [ ] SSL certificates obtained and configured
- [ ] Database backups verified

## Staging Deployment

### Automatic (on merge to main)

1. Merge PR to `main` branch
2. GitHub Actions automatically:
   - Builds Docker images
   - Deploys to staging
   - Runs database migrations
   - Seeds test data
   - Executes smoke tests

### Manual Trigger

```bash
# Via GitHub UI
1. Go to Actions → Deploy to Staging
2. Click "Run workflow"
3. Select branch (default: main)
4. Click "Run workflow"
```

### Verify Deployment

```bash
# Health check
curl https://staging.internet-id.example.com/api/health

# Smoke tests (from local machine)
cd scripts
./smoke-test.sh https://staging.internet-id.example.com
```

## Production Deployment

### Deploy New Version

```bash
# Via GitHub UI
1. Go to Actions → Deploy to Production
2. Click "Run workflow"
3. Enter version tag (e.g., v1.0.0 or git SHA)
4. Review configuration
5. Click "Run workflow"
6. **WAIT for approval gate**
7. Review validation results
8. Click "Approve" to proceed
```

### Verify Deployment

```bash
# Health check
curl https://internet-id.example.com/api/health

# Comprehensive check
curl https://internet-id.example.com/api/metrics

# Smoke tests (from local machine)
cd scripts
./smoke-test.sh https://internet-id.example.com
```

### Monitor Deployment

```bash
# SSH to production server
ssh production-server

# View logs
cd /opt/internet-id
docker compose -f docker-compose.production.yml logs -f --tail=100

# Check container health
docker compose -f docker-compose.production.yml ps

# Check resource usage
docker stats
```

## Rollback

### Quick Rollback (No Database Changes)

```bash
# Via GitHub UI
1. Go to Actions → Deploy to Production
2. Click "Run workflow"
3. Enter previous version tag
4. Approve deployment
```

### Emergency Rollback (SSH)

```bash
# SSH to production
ssh production-server
cd /opt/internet-id

# Rollback code
PREV_VERSION=$(cat .deployment-backup)
git checkout $PREV_VERSION

# Restart containers
docker compose -f docker-compose.production.yml up -d --force-recreate

# Verify
sleep 30
curl https://internet-id.example.com/api/health
```

### Database Rollback

```bash
# SSH to production
ssh production-server
cd /opt/internet-id

# Stop services
docker compose -f docker-compose.production.yml down

# Restore database
docker compose -f docker-compose.production.yml up -d db
sleep 10

docker compose -f docker-compose.production.yml exec backup \
  /opt/backup-scripts/restore-database.sh full

# Restart all services
docker compose -f docker-compose.production.yml up -d
```

## Common Tasks

### Update Environment Variables

```bash
# SSH to server
ssh staging-server  # or production-server

# Edit environment file
cd /opt/internet-id
nano .env.staging  # or .env.production

# Restart services
docker compose -f docker-compose.staging.yml restart
```

### View Logs

```bash
# All services
docker compose logs -f

# Specific service
docker compose logs -f api
docker compose logs -f web

# Last 100 lines
docker compose logs --tail=100

# Error logs only
docker compose logs | grep -i error
```

### Database Migrations

```bash
# SSH to server
ssh production-server
cd /opt/internet-id

# Check migration status
docker compose exec api npx prisma migrate status

# Apply pending migrations
docker compose exec api npx prisma migrate deploy

# Rollback migration (DANGEROUS)
docker compose exec api npx prisma migrate reset
```

### Scale Services

```bash
# Scale up (more instances)
docker compose -f docker-compose.production.yml up -d \
  --scale api=4 --scale web=4

# Scale down
docker compose -f docker-compose.production.yml up -d \
  --scale api=2 --scale web=2
```

### Manual Backup

```bash
# SSH to server
ssh production-server

# Full backup
docker compose -f docker-compose.production.yml exec backup \
  /opt/backup-scripts/backup-database.sh full

# Verify backup
docker compose -f docker-compose.production.yml exec backup \
  /opt/backup-scripts/verify-backup.sh
```

### Certificate Renewal

```bash
# SSH to server
ssh production-server

# Check certificate expiration
cd /opt/internet-id/ops/ssl
./check-cert-expiry.sh

# Renew certificate
./manage-certs.sh renew

# Restart nginx
docker compose restart nginx
```

## Troubleshooting

### Service Won't Start

```bash
# Check logs
docker compose logs api

# Restart service
docker compose restart api

# Rebuild if needed
docker compose up -d --build api
```

### Database Connection Issues

```bash
# Check database status
docker compose ps db

# View database logs
docker compose logs db

# Restart database
docker compose restart db
```

### High Memory/CPU Usage

```bash
# Check resource usage
docker stats

# Scale up if needed
docker compose up -d --scale api=4 --scale web=4

# Or restart services
docker compose restart
```

### SSL Certificate Issues

```bash
# Test SSL configuration
cd ops/ssl
./test-ssl-config.sh

# Renew certificate
./manage-certs.sh renew

# Restart nginx
docker compose restart nginx
```

## Emergency Contacts

- **Primary On-Call**: ops@example.com, +1-555-0100
- **Backup On-Call**: backup-ops@example.com, +1-555-0200
- **Slack Channel**: #internet-id-ops
- **PagerDuty**: https://example.pagerduty.com/incidents

## Useful Links

- [Full Deployment Playbook](./DEPLOYMENT_PLAYBOOK.md)
- [Environment Variables Reference](./ENVIRONMENT_VARIABLES.md)
- [Disaster Recovery Runbook](./DISASTER_RECOVERY_RUNBOOK.md)
- [Observability Guide](../OBSERVABILITY.md)
- [Database Backup & Recovery](./DATABASE_BACKUP_RECOVERY.md)

## Deployment Checklist

### Pre-Deployment

- [ ] All tests passing in CI
- [ ] Code reviewed and approved
- [ ] Database migrations tested in staging
- [ ] Breaking changes documented
- [ ] Rollback plan prepared
- [ ] Stakeholders notified
- [ ] Backup verified
- [ ] Monitoring configured

### Post-Deployment

- [ ] Health checks passing
- [ ] Smoke tests successful
- [ ] Logs reviewed for errors
- [ ] Metrics monitoring normal
- [ ] Database performance normal
- [ ] No alerts triggered
- [ ] Stakeholders notified
- [ ] Documentation updated
