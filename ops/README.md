# Operations (Ops) Directory

This directory contains operational scripts and tools for managing the Internet-ID database backup and disaster recovery system.

## Directory Structure

```
ops/
├── backup/
│   ├── backup-database.sh      # Main backup script (full & incremental)
│   ├── verify-backup.sh        # Backup integrity verification
│   └── crontab.example         # Example cron configuration
├── restore/
│   └── restore-database.sh     # Restore script (full, PITR, partial)
└── README.md                   # This file
```

## Quick Start

### Running a Backup

```bash
# Full backup
cd ops/backup
./backup-database.sh full

# Incremental backup (WAL archiving)
./backup-database.sh incremental

# Verify backups
./verify-backup.sh
```

### Restoring Database

```bash
cd ops/restore

# Full restore (from latest backup)
./restore-database.sh full

# Point-in-time recovery
export RESTORE_TARGET_TIME="2025-10-24 18:30:00"
./restore-database.sh pitr

# Partial table restore
export RESTORE_TABLES="Content,PlatformBinding"
./restore-database.sh partial
```

## Scripts Overview

### backup-database.sh

**Purpose**: Perform automated database backups

**Features**:

- Full backups using `pg_dump` (compressed with gzip)
- Incremental backups via WAL archiving
- Automatic upload to S3 (if configured)
- Backup metadata and logging
- Automatic cleanup based on retention policy

**Usage**:

```bash
./backup-database.sh [full|incremental]
```

**Environment Variables**:

- `POSTGRES_HOST` - Database host (default: localhost)
- `POSTGRES_PORT` - Database port (default: 5432)
- `POSTGRES_DB` - Database name (default: internetid)
- `POSTGRES_USER` - Database user (default: internetid)
- `POSTGRES_PASSWORD` - Database password
- `BACKUP_DIR` - Backup directory (default: /var/lib/postgresql/backups)
- `RETENTION_DAYS` - Backup retention period (default: 30)
- `S3_BUCKET` - S3 bucket for remote backups (optional)
- `S3_REGION` - S3 region (default: us-east-1)

### verify-backup.sh

**Purpose**: Verify backup integrity and report status

**Features**:

- Check backup age
- Verify backup file integrity (gzip test)
- Monitor backup sizes for anomalies
- Check WAL archiving status
- Monitor storage usage
- Send alerts on failures
- Generate backup status reports

**Usage**:

```bash
./verify-backup.sh
```

**Environment Variables**:

- `BACKUP_DIR` - Backup directory
- `RETENTION_DAYS` - Expected retention period
- `ALERT_EMAIL` - Email for alerts (optional)

### restore-database.sh

**Purpose**: Restore database from backups

**Features**:

- Full database restore from backup
- Point-in-time recovery (PITR)
- Partial table restore
- Download from S3 support
- Automatic verification after restore
- Database consistency checks

**Usage**:

```bash
# Full restore
./restore-database.sh full

# PITR
RESTORE_TARGET_TIME="2025-10-24 18:30:00" ./restore-database.sh pitr

# Partial restore
RESTORE_TABLES="Content,User" ./restore-database.sh partial
```

**Environment Variables**:

- `POSTGRES_HOST`, `POSTGRES_PORT`, `POSTGRES_DB`, `POSTGRES_USER`, `POSTGRES_PASSWORD`
- `BACKUP_DIR` - Backup directory
- `BACKUP_FILE` - Specific backup file to restore (optional)
- `RESTORE_TARGET_TIME` - Target time for PITR (format: YYYY-MM-DD HH:MM:SS)
- `RESTORE_TABLES` - Comma-separated list of tables for partial restore

## Scheduling Backups

### Using Cron (Linux)

1. Copy the example crontab:

   ```bash
   sudo cp ops/backup/crontab.example /etc/cron.d/postgres-backup
   ```

2. Edit to match your environment:

   ```bash
   sudo nano /etc/cron.d/postgres-backup
   ```

3. Restart cron service:
   ```bash
   sudo systemctl restart cron
   ```

### Using Docker Compose

The included `docker-compose.yml` already has a backup service configured:

```bash
# Start with backup service
docker compose up -d

# View backup logs
docker compose logs backup

# Manually trigger backup
docker compose exec backup /opt/backup-scripts/backup-database.sh full
```

### Using Kubernetes CronJob

```yaml
apiVersion: batch/v1
kind: CronJob
metadata:
  name: postgres-backup
spec:
  schedule: "0 2 * * *" # Daily at 2 AM
  jobTemplate:
    spec:
      template:
        spec:
          containers:
            - name: backup
              image: postgres:16-alpine
              command: ["/opt/backup-scripts/backup-database.sh", "full"]
              volumeMounts:
                - name: backup-scripts
                  mountPath: /opt/backup-scripts
                - name: backup-storage
                  mountPath: /var/lib/postgresql/backups
          volumes:
            - name: backup-scripts
              configMap:
                name: backup-scripts
            - name: backup-storage
              persistentVolumeClaim:
                claimName: backup-pvc
          restartPolicy: OnFailure
```

## Configuration

### Environment Files

Create `/etc/backup.env` for production:

```bash
POSTGRES_HOST=db.production.example.com
POSTGRES_PORT=5432
POSTGRES_DB=internetid
POSTGRES_USER=internetid
POSTGRES_PASSWORD=your_secure_password
BACKUP_DIR=/var/lib/postgresql/backups
RETENTION_DAYS=30

# S3 Configuration
S3_BUCKET=internet-id-backups
S3_REGION=us-east-1

# Alerts
ALERT_EMAIL=ops@example.com
```

### PostgreSQL Configuration

Enable WAL archiving in `postgresql.conf`:

```conf
wal_level = replica
archive_mode = on
archive_command = 'test ! -f /var/lib/postgresql/backups/wal_archive/%f && cp %p /var/lib/postgresql/backups/wal_archive/%f'
archive_timeout = 3600
```

## Monitoring

See [docs/ops/BACKUP_MONITORING.md](../../docs/ops/BACKUP_MONITORING.md) for:

- Prometheus metrics
- Grafana dashboards
- CloudWatch integration
- Alert configuration
- Health checks

## Security

1. **Permissions**: Scripts should be owned by `postgres` user

   ```bash
   sudo chown -R postgres:postgres /opt/internet-id/ops
   sudo chmod 750 /opt/internet-id/ops/backup/*.sh
   sudo chmod 750 /opt/internet-id/ops/restore/*.sh
   ```

2. **Credentials**: Use environment files with restricted permissions

   ```bash
   sudo chmod 600 /etc/backup.env
   ```

3. **S3 Access**: Use IAM roles instead of access keys when possible

4. **Encryption**: Enable encryption at rest for S3 buckets

## Testing

### Test Backup

```bash
# Run manual backup
cd ops/backup
./backup-database.sh full

# Verify backup was created
ls -lh /var/lib/postgresql/backups/full/

# Verify backup integrity
./verify-backup.sh
```

### Test Restore

```bash
# Create test database
psql -h localhost -U internetid -d postgres -c "CREATE DATABASE test_restore;"

# Restore to test database
export POSTGRES_DB=test_restore
cd ops/restore
./restore-database.sh full

# Verify data
psql -h localhost -U internetid -d test_restore -c "SELECT COUNT(*) FROM Content;"

# Cleanup
psql -h localhost -U internetid -d postgres -c "DROP DATABASE test_restore;"
```

## Troubleshooting

### Common Issues

1. **Permission Denied**
   - Ensure scripts are executable: `chmod +x *.sh`
   - Check directory ownership: `chown postgres:postgres /var/lib/postgresql/backups`

2. **Cannot Connect to PostgreSQL**
   - Verify PostgreSQL is running: `systemctl status postgresql`
   - Test connection: `psql -h localhost -U internetid -d internetid -c "SELECT 1;"`

3. **Disk Space Full**
   - Check usage: `df -h /var/lib/postgresql/backups`
   - Reduce retention: `export RETENTION_DAYS=15`
   - Clean old backups: `find /var/lib/postgresql/backups/full -mtime +30 -delete`

4. **S3 Upload Fails**
   - Verify AWS credentials: `aws sts get-caller-identity`
   - Check bucket access: `aws s3 ls s3://internet-id-backups/`

### Logs

- Backup logs: `/var/lib/postgresql/backups/backup.log`
- Restore logs: `/var/lib/postgresql/backups/restore.log`
- Verification logs: `/var/lib/postgresql/backups/verify.log`
- PostgreSQL logs: `/var/log/postgresql/postgresql-16-main.log`

## Documentation

- [Database Backup & Recovery Guide](../../docs/ops/DATABASE_BACKUP_RECOVERY.md) - Complete setup and usage
- [Disaster Recovery Runbook](../../docs/ops/DISASTER_RECOVERY_RUNBOOK.md) - Emergency procedures
- [Backup Monitoring](../../docs/ops/BACKUP_MONITORING.md) - Monitoring and alerting setup

## Support

For issues or questions:

1. Check the troubleshooting section above
2. Review logs in `/var/lib/postgresql/backups/`
3. Consult documentation in `docs/ops/`
4. Open an issue on GitHub

## License

Same as parent project (Internet-ID)
