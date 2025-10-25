# Database Backup and Recovery Documentation

## Overview

This document describes the automated backup and disaster recovery system for the Internet-ID PostgreSQL database.

## Table of Contents

1. [Backup Strategy](#backup-strategy)
2. [Setup and Configuration](#setup-and-configuration)
3. [Backup Operations](#backup-operations)
4. [Restore Operations](#restore-operations)
5. [Monitoring and Verification](#monitoring-and-verification)
6. [Production Deployment](#production-deployment)
7. [Troubleshooting](#troubleshooting)

## Backup Strategy

### Overview

The backup system implements a comprehensive three-tier approach:

1. **Daily Full Backups**: Complete database dump at 2:00 AM daily
2. **Hourly Incremental Backups**: WAL (Write-Ahead Log) archiving for point-in-time recovery
3. **Continuous Verification**: Automated integrity checks every 6 hours

### Recovery Capabilities

- **Full Restore**: Restore entire database from any full backup
- **Point-in-Time Recovery (PITR)**: Restore to any specific timestamp within retention period
- **Partial Restore**: Restore individual tables without affecting other data

### Retention Policy

- **Default**: 30 days for all backups
- **Configurable**: Set `RETENTION_DAYS` environment variable
- **Automatic Cleanup**: Old backups are automatically deleted based on retention policy

### Storage Strategy

#### Local Storage

- **Path**: `/var/lib/postgresql/backups/`
- **Structure**:
  ```
  /var/lib/postgresql/backups/
  ├── full/              # Full database backups
  │   ├── backup_20251024_020000.dump.gz
  │   ├── backup_20251024_020000.meta
  │   └── ...
  ├── incremental/       # Incremental backup metadata
  │   └── incremental_*.meta
  ├── wal_archive/       # WAL files for PITR
  │   ├── 000000010000000000000001
  │   └── ...
  ├── backup.log         # Backup operation logs
  ├── restore.log        # Restore operation logs
  └── verify.log         # Verification logs
  ```

#### Remote Storage (S3)

- **Primary Purpose**: Disaster recovery in separate region
- **Encryption**: AES256 server-side encryption
- **Storage Class**: STANDARD_IA (Infrequent Access) for cost optimization
- **Lifecycle**: Automatic deletion after retention period via S3 lifecycle policies

## Setup and Configuration

### Prerequisites

- PostgreSQL 16 or later
- Bash shell
- `pg_dump`, `pg_restore` utilities
- (Optional) AWS CLI for S3 backups
- (Optional) Email client for alerts

### Docker Compose Setup

The `docker-compose.yml` includes a pre-configured backup service:

```bash
# Start database with backup support
docker compose up -d

# The backup service will:
# - Run daily full backups automatically
# - Archive WAL files continuously
# - Store backups in the backup_data volume
```

### Manual Setup (Production)

1. **Create backup directories:**

   ```bash
   sudo mkdir -p /var/lib/postgresql/backups/{full,incremental,wal_archive}
   sudo chown -R postgres:postgres /var/lib/postgresql/backups
   sudo chmod 750 /var/lib/postgresql/backups
   ```

2. **Copy backup scripts:**

   ```bash
   sudo cp ops/backup/*.sh /opt/backup-scripts/
   sudo cp ops/restore/*.sh /opt/restore-scripts/
   sudo chmod +x /opt/backup-scripts/*.sh /opt/restore-scripts/*.sh
   sudo chown postgres:postgres /opt/backup-scripts/*.sh /opt/restore-scripts/*.sh
   ```

3. **Configure PostgreSQL for WAL archiving:**

   Edit `postgresql.conf`:

   ```conf
   wal_level = replica
   archive_mode = on
   archive_command = 'test ! -f /var/lib/postgresql/backups/wal_archive/%f && cp %p /var/lib/postgresql/backups/wal_archive/%f'
   archive_timeout = 3600  # Force WAL switch every hour
   ```

   Restart PostgreSQL:

   ```bash
   sudo systemctl restart postgresql
   ```

4. **Set up cron jobs:**

   ```bash
   # Copy crontab configuration
   sudo cp ops/backup/crontab.example /etc/cron.d/postgres-backup

   # Edit to match your environment
   sudo nano /etc/cron.d/postgres-backup

   # Restart cron
   sudo systemctl restart cron
   ```

5. **Configure environment variables:**

   Create `/etc/backup.env`:

   ```bash
   POSTGRES_HOST=localhost
   POSTGRES_PORT=5432
   POSTGRES_DB=internetid
   POSTGRES_USER=internetid
   POSTGRES_PASSWORD=your_secure_password
   BACKUP_DIR=/var/lib/postgresql/backups
   RETENTION_DAYS=30

   # Optional: S3 configuration
   S3_BUCKET=internet-id-backups
   S3_REGION=us-east-1

   # Optional: Alert email
   ALERT_EMAIL=ops@example.com
   ```

6. **Configure AWS credentials** (if using S3):
   ```bash
   # For postgres user
   sudo -u postgres aws configure
   # Enter AWS Access Key ID, Secret Access Key, and region
   ```

## Backup Operations

### Manual Full Backup

```bash
# Run immediate full backup
cd /opt/internet-id/ops/backup
sudo -u postgres ./backup-database.sh full
```

### Manual Incremental Backup

```bash
# Run incremental backup (archives current WAL files)
cd /opt/internet-id/ops/backup
sudo -u postgres ./backup-database.sh incremental
```

### Verify Backup

```bash
# Run backup verification
cd /opt/internet-id/ops/backup
sudo -u postgres ./verify-backup.sh
```

### Check Backup Status

```bash
# View recent backup logs
tail -100 /var/lib/postgresql/backups/backup.log

# List available backups
ls -lh /var/lib/postgresql/backups/full/

# Check backup metadata
cat /var/lib/postgresql/backups/full/backup_20251024_020000.meta
```

## Restore Operations

### Full Database Restore

**⚠️ WARNING**: This will replace the entire database!

```bash
# Restore from latest backup
cd /opt/internet-id/ops/restore
sudo -u postgres ./restore-database.sh full

# Restore from specific backup file
export BACKUP_FILE=/var/lib/postgresql/backups/full/backup_20251024_020000.dump.gz
sudo -u postgres ./restore-database.sh full
```

### Point-in-Time Recovery (PITR)

Restore database to a specific timestamp:

```bash
cd /opt/internet-id/ops/restore

# Set target recovery time
export RESTORE_TARGET_TIME="2025-10-24 18:30:00"

# Run PITR (provides manual steps)
sudo -u postgres ./restore-database.sh pitr

# Follow the output instructions:
# 1. Stop PostgreSQL
sudo systemctl stop postgresql

# 2. Clear data directory
sudo rm -rf /var/lib/postgresql/16/main/*

# 3. Extract base backup
cd /var/lib/postgresql/16/main
sudo -u postgres tar xzf /var/lib/postgresql/backups/full/backup_YYYYMMDD_HHMMSS.tar.gz

# 4. Copy recovery configuration
sudo cp /tmp/recovery_*.conf /var/lib/postgresql/16/main/recovery.conf

# 5. Copy WAL files
sudo cp -r /var/lib/postgresql/backups/wal_archive/* /var/lib/postgresql/16/main/pg_wal/

# 6. Start PostgreSQL (will replay WAL to target time)
sudo systemctl start postgresql

# 7. Verify recovery
psql -h localhost -U internetid -d internetid -c "SELECT now();"
```

### Partial Table Restore

Restore specific tables without affecting other data:

```bash
cd /opt/internet-id/ops/restore

# Set tables to restore (comma-separated)
export RESTORE_TABLES="Content,PlatformBinding"

# Optional: specify backup file
export BACKUP_FILE=/var/lib/postgresql/backups/full/backup_20251024_020000.dump.gz

# Run partial restore
sudo -u postgres ./restore-database.sh partial
```

### Restore from S3

```bash
# Download backup from S3
aws s3 cp s3://internet-id-backups/full/backup_20251024_020000.dump.gz \
  /var/lib/postgresql/backups/full/

# Restore as usual
export BACKUP_FILE=/var/lib/postgresql/backups/full/backup_20251024_020000.dump.gz
cd /opt/internet-id/ops/restore
sudo -u postgres ./restore-database.sh full
```

## Monitoring and Verification

### Automated Monitoring

The backup system includes automated monitoring with configurable alerts:

1. **Backup Age Check**: Alerts if latest backup is > 26 hours old
2. **Integrity Verification**: Checks backup file integrity (gzip -t)
3. **Size Monitoring**: Alerts on suspicious size changes (>50%)
4. **Storage Usage**: Alerts when disk usage exceeds 85%
5. **WAL Archiving**: Monitors WAL file archiving

### Manual Verification

```bash
# Run comprehensive verification
cd /opt/internet-id/ops/backup
sudo -u postgres ./verify-backup.sh

# View verification report
tail -50 /var/lib/postgresql/backups/verify.log
```

### Test Restore (Recommended Monthly)

```bash
#!/bin/bash
# Create test database and verify backup can be restored

# Create test database
psql -h localhost -U internetid -d postgres \
  -c "CREATE DATABASE test_restore;"

# Restore to test database
export POSTGRES_DB=test_restore
cd /opt/internet-id/ops/restore
./restore-database.sh full

# Verify data
psql -h localhost -U internetid -d test_restore \
  -c "SELECT COUNT(*) FROM Content;" \
  -c "SELECT COUNT(*) FROM User;"

# Cleanup
psql -h localhost -U internetid -d postgres \
  -c "DROP DATABASE test_restore;"
```

### Monitoring Integration

#### Prometheus Metrics

Configure PostgreSQL exporter to expose backup metrics:

```yaml
# Example metrics to track
- pg_backup_last_success_timestamp
- pg_backup_size_bytes
- pg_backup_duration_seconds
- pg_wal_archive_status
- pg_backup_storage_usage_percent
```

#### CloudWatch Alarms (AWS)

```bash
# Create CloudWatch alarm for old backups
aws cloudwatch put-metric-alarm \
  --alarm-name "InternetID-Backup-Age" \
  --alarm-description "Alert when backup is too old" \
  --metric-name BackupAge \
  --namespace InternetID \
  --statistic Maximum \
  --period 3600 \
  --threshold 93600 \
  --comparison-operator GreaterThanThreshold
```

## Production Deployment

### AWS Deployment

1. **S3 Bucket Setup:**

   ```bash
   # Create backup bucket in primary region
   aws s3 mb s3://internet-id-backups-us-east-1 --region us-east-1

   # Create backup bucket in secondary region (DR)
   aws s3 mb s3://internet-id-backups-us-west-2 --region us-west-2

   # Enable versioning
   aws s3api put-bucket-versioning \
     --bucket internet-id-backups-us-east-1 \
     --versioning-configuration Status=Enabled

   # Enable encryption
   aws s3api put-bucket-encryption \
     --bucket internet-id-backups-us-east-1 \
     --server-side-encryption-configuration \
     '{"Rules":[{"ApplyServerSideEncryptionByDefault":{"SSEAlgorithm":"AES256"}}]}'

   # Configure lifecycle policy
   aws s3api put-bucket-lifecycle-configuration \
     --bucket internet-id-backups-us-east-1 \
     --lifecycle-configuration file://lifecycle.json
   ```

   `lifecycle.json`:

   ```json
   {
     "Rules": [
       {
         "Id": "DeleteOldBackups",
         "Status": "Enabled",
         "Prefix": "",
         "Expiration": {
           "Days": 30
         }
       },
       {
         "Id": "TransitionToGlacier",
         "Status": "Enabled",
         "Prefix": "archive/",
         "Transitions": [
           {
             "Days": 7,
             "StorageClass": "GLACIER"
           }
         ]
       }
     ]
   }
   ```

2. **S3 Cross-Region Replication:**

   ```bash
   # Enable replication to DR region
   aws s3api put-bucket-replication \
     --bucket internet-id-backups-us-east-1 \
     --replication-configuration file://replication.json
   ```

3. **IAM Permissions:**
   ```json
   {
     "Version": "2012-10-17",
     "Statement": [
       {
         "Effect": "Allow",
         "Action": ["s3:PutObject", "s3:GetObject", "s3:DeleteObject", "s3:ListBucket"],
         "Resource": ["arn:aws:s3:::internet-id-backups-*/*", "arn:aws:s3:::internet-id-backups-*"]
       }
     ]
   }
   ```

### GCP Deployment

```bash
# Create GCS bucket
gsutil mb -l us-east1 gs://internet-id-backups-primary
gsutil mb -l us-west1 gs://internet-id-backups-secondary

# Enable versioning
gsutil versioning set on gs://internet-id-backups-primary

# Set lifecycle policy
gsutil lifecycle set lifecycle.json gs://internet-id-backups-primary
```

### Azure Deployment

```bash
# Create storage account
az storage account create \
  --name internetidbackups \
  --resource-group internet-id-rg \
  --location eastus \
  --sku Standard_GRS

# Create container
az storage container create \
  --name backups \
  --account-name internetidbackups

# Enable soft delete
az storage blob service-properties delete-policy update \
  --days-retained 30 \
  --account-name internetidbackups \
  --enable true
```

## Troubleshooting

### Backup Fails with Permission Denied

```bash
# Check directory permissions
ls -la /var/lib/postgresql/backups/

# Fix permissions
sudo chown -R postgres:postgres /var/lib/postgresql/backups
sudo chmod 750 /var/lib/postgresql/backups
```

### Cannot Connect to PostgreSQL

```bash
# Check PostgreSQL is running
sudo systemctl status postgresql

# Test connection
psql -h localhost -U internetid -d internetid -c "SELECT 1;"

# Check pg_hba.conf for authentication rules
sudo cat /etc/postgresql/16/main/pg_hba.conf
```

### WAL Archiving Not Working

```bash
# Check PostgreSQL configuration
psql -h localhost -U internetid -d postgres \
  -c "SHOW wal_level;" \
  -c "SHOW archive_mode;" \
  -c "SHOW archive_command;"

# Check WAL archive directory
ls -la /var/lib/postgresql/backups/wal_archive/

# View PostgreSQL logs
sudo tail -100 /var/log/postgresql/postgresql-16-main.log
```

### Backup Takes Too Long

```bash
# Check backup in progress
ps aux | grep pg_dump

# Check disk I/O
iostat -x 5

# Consider:
# 1. Parallel dump (pg_dump --jobs=4)
# 2. Compress after dump instead of during
# 3. Increase shared_buffers in postgresql.conf
```

### Restore Fails

```bash
# Check backup file integrity
gzip -t /var/lib/postgresql/backups/full/backup_*.dump.gz

# Check PostgreSQL error log
sudo tail -100 /var/log/postgresql/postgresql-16-main.log

# Try verbose restore for debugging
zcat backup.dump.gz | pg_restore -v -d internetid 2>&1 | tee restore_debug.log
```

### S3 Upload Fails

```bash
# Check AWS credentials
aws sts get-caller-identity

# Check S3 bucket access
aws s3 ls s3://internet-id-backups/

# Check network connectivity
curl https://s3.amazonaws.com

# Test manual upload
aws s3 cp test.txt s3://internet-id-backups/test.txt
```

### Disk Space Full

```bash
# Check disk usage
df -h /var/lib/postgresql/backups

# Find large files
du -sh /var/lib/postgresql/backups/*

# Clean up old backups manually
find /var/lib/postgresql/backups/full -type f -mtime +30 -delete

# Reduce retention period
export RETENTION_DAYS=15
```

## Security Best Practices

1. **Encrypt backups at rest**: Use S3 encryption or filesystem encryption
2. **Secure credentials**: Use AWS IAM roles or Kubernetes secrets
3. **Restrict access**: Limit backup directory permissions to postgres user
4. **Audit logging**: Enable logging of all backup/restore operations
5. **Regular testing**: Perform quarterly disaster recovery drills
6. **Separate storage**: Keep backups in different region/availability zone
7. **Access control**: Use IAM policies to limit who can access backups

## Performance Optimization

### Backup Performance

- Use `pg_dump --jobs=N` for parallel dumps on multi-core systems
- Schedule backups during low-traffic periods
- Use compression (gzip -9 for maximum compression)
- Consider using `pg_basebackup` for very large databases

### Restore Performance

- Use `pg_restore --jobs=N` for parallel restores
- Disable indexes during restore, rebuild after
- Increase `maintenance_work_mem` for faster index creation
- Use `--no-owner --no-acl` to skip ownership/permission restore

## References

- [PostgreSQL Backup Documentation](https://www.postgresql.org/docs/current/backup.html)
- [Point-in-Time Recovery](https://www.postgresql.org/docs/current/continuous-archiving.html)
- [Disaster Recovery Runbook](./DISASTER_RECOVERY_RUNBOOK.md)
- [AWS S3 Best Practices](https://docs.aws.amazon.com/AmazonS3/latest/userguide/backup-for-s3.html)

---

**Last Updated:** 2025-10-24  
**Version:** 1.0  
**Maintained By:** DevOps Team
