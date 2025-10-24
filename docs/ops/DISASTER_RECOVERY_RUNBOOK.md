# Disaster Recovery Runbook

## Overview

This runbook provides step-by-step procedures for recovering the Internet-ID database in various disaster scenarios.

**Recovery Time Objective (RTO):** 4 hours  
**Recovery Point Objective (RPO):** 1 hour

## Backup Strategy

### Automated Backups

1. **Full Backups**: Daily at 2:00 AM (scheduled via cron)
   - Uses `pg_dump` for logical backup
   - Compressed with gzip
   - Retained for 30 days
   - Stored locally and in S3 (encrypted)

2. **Incremental Backups**: Hourly via WAL archiving
   - PostgreSQL WAL files archived automatically
   - Enables point-in-time recovery (PITR)
   - Retained for 30 days

3. **Backup Verification**: Every 6 hours
   - Integrity checks on recent backups
   - Storage usage monitoring
   - Automated alerts on failures

### Storage Locations

- **Primary**: Local volume `/var/lib/postgresql/backups`
- **Secondary**: AWS S3 bucket (or compatible storage) in separate region
- **Encryption**: AES256 server-side encryption on S3

## Disaster Scenarios

### Scenario 1: Accidental Data Deletion or Corruption

**Detection:**

- User reports missing or incorrect data
- Application errors indicating data inconsistency

**Recovery Steps:**

1. **Assess the damage:**

   ```bash
   # Connect to database
   psql -h localhost -U internetid -d internetid

   # Check affected tables
   SELECT * FROM <affected_table> WHERE <conditions>;
   ```

2. **Determine recovery target time:**
   - Identify when corruption occurred
   - Select timestamp just before the incident

3. **Perform point-in-time recovery:**

   ```bash
   cd /opt/internet-id/ops/restore

   # Set recovery target time (format: YYYY-MM-DD HH:MM:SS)
   export RESTORE_TARGET_TIME="2025-10-24 18:30:00"

   # Run PITR
   sudo -u postgres ./restore-database.sh pitr
   ```

4. **Follow manual PITR steps** (output by script):
   - Stop PostgreSQL
   - Clear data directory
   - Extract base backup
   - Configure recovery.conf
   - Copy WAL files
   - Start PostgreSQL

5. **Verify recovery:**
   ```bash
   # Check restored data
   psql -h localhost -U internetid -d internetid \
     -c "SELECT COUNT(*) FROM <affected_table>;"
   ```

**Estimated Recovery Time:** 30-60 minutes

---

### Scenario 2: Complete Database Loss

**Detection:**

- Database server failure
- Data directory corruption or disk failure
- PostgreSQL won't start

**Recovery Steps:**

1. **Prepare new database server** (if hardware failure):

   ```bash
   # Install PostgreSQL 16
   sudo apt-get update
   sudo apt-get install postgresql-16

   # Or use Docker Compose
   cd /opt/internet-id
   docker compose up -d db
   ```

2. **Restore from latest full backup:**

   ```bash
   cd /opt/internet-id/ops/restore

   # Use default (latest) backup
   sudo -u postgres ./restore-database.sh full

   # Or specify a backup file
   export BACKUP_FILE=/var/lib/postgresql/backups/full/backup_20251024_020000.dump.gz
   sudo -u postgres ./restore-database.sh full
   ```

3. **Verify database integrity:**

   ```bash
   # Check table counts
   psql -h localhost -U internetid -d internetid \
     -c "SELECT schemaname, tablename, n_live_tup FROM pg_stat_user_tables;"

   # Test application connectivity
   cd /opt/internet-id
   npm run start:api
   ```

4. **Update application configuration** if needed:
   ```bash
   # Update DATABASE_URL in .env if hostname changed
   DATABASE_URL="postgresql://internetid:internetid@new-host:5432/internetid"
   ```

**Estimated Recovery Time:** 1-2 hours

---

### Scenario 3: Partial Table Recovery

**Detection:**

- Specific table(s) corrupted or dropped accidentally
- Other tables remain intact

**Recovery Steps:**

1. **Identify affected tables:**

   ```bash
   # List tables in database
   psql -h localhost -U internetid -d internetid -c "\dt"
   ```

2. **Restore specific tables:**

   ```bash
   cd /opt/internet-id/ops/restore

   # Set tables to restore (comma-separated)
   export RESTORE_TABLES="Content,PlatformBinding,Verification"

   # Run partial restore
   sudo -u postgres ./restore-database.sh partial
   ```

3. **Verify restored tables:**
   ```bash
   psql -h localhost -U internetid -d internetid \
     -c "SELECT COUNT(*) FROM Content;"
   ```

**Estimated Recovery Time:** 15-30 minutes

---

### Scenario 4: Region-Wide Outage

**Detection:**

- Primary AWS region unavailable
- Cannot access primary database or backups

**Recovery Steps:**

1. **Activate disaster recovery site** in secondary region:

   ```bash
   # Download backups from S3 in secondary region
   aws s3 sync s3://internet-id-backup-secondary/full/ \
     /var/lib/postgresql/backups/full/ \
     --region us-west-2
   ```

2. **Deploy database in secondary region:**

   ```bash
   # Use infrastructure as code (Terraform/CloudFormation)
   # Or manual deployment with Docker Compose
   cd /opt/internet-id
   docker compose up -d db
   ```

3. **Restore from S3 backup:**

   ```bash
   cd /opt/internet-id/ops/restore

   # Set backup file location
   export BACKUP_FILE=/var/lib/postgresql/backups/full/backup_latest.dump.gz
   sudo -u postgres ./restore-database.sh full
   ```

4. **Update DNS and load balancer:**
   - Point application to new database endpoint
   - Update DATABASE_URL in application configuration
   - Verify application functionality

5. **Communicate with users:**
   - Post status update on status page
   - Notify users via email/social media

**Estimated Recovery Time:** 2-4 hours

---

### Scenario 5: Backup Verification Failure

**Detection:**

- Automated backup verification alerts
- Backup integrity check fails

**Recovery Steps:**

1. **Investigate backup failure:**

   ```bash
   # Check verification logs
   tail -100 /var/lib/postgresql/backups/verify.log

   # Manually verify latest backup
   cd /opt/internet-id/ops/backup
   ./verify-backup.sh
   ```

2. **Test backup restoration:**

   ```bash
   # Create test database
   psql -h localhost -U internetid -d postgres \
     -c "CREATE DATABASE test_restore;"

   # Attempt restore to test database
   export POSTGRES_DB=test_restore
   cd /opt/internet-id/ops/restore
   ./restore-database.sh full

   # Drop test database after verification
   psql -h localhost -U internetid -d postgres \
     -c "DROP DATABASE test_restore;"
   ```

3. **If backup is corrupted, trigger immediate full backup:**

   ```bash
   cd /opt/internet-id/ops/backup
   sudo -u postgres ./backup-database.sh full
   ```

4. **Investigate root cause:**
   - Check disk space
   - Review backup logs
   - Verify PostgreSQL is running correctly
   - Check S3 credentials and connectivity

**Estimated Recovery Time:** 30-60 minutes

---

## Pre-Requisites Checklist

Before disaster strikes, ensure:

- [ ] Backup scripts are installed and have correct permissions
- [ ] Cron jobs are configured and running
- [ ] PostgreSQL user `postgres` can execute backup scripts
- [ ] Backup directory has sufficient space (monitor usage)
- [ ] S3 bucket is configured with correct permissions
- [ ] AWS credentials are configured (for S3 backups)
- [ ] Alert email is configured in backup scripts
- [ ] Team has access to this runbook
- [ ] Quarterly DR drills are scheduled

## Monitoring and Alerts

### Key Metrics to Monitor

1. **Backup Success Rate**
   - Alert if backup fails 2 consecutive times
   - Check: `/var/lib/postgresql/backups/backup.log`

2. **Backup Age**
   - Alert if latest backup is > 26 hours old
   - Check via: `./verify-backup.sh`

3. **Storage Usage**
   - Alert if > 85% disk usage
   - Check: `df -h /var/lib/postgresql/backups`

4. **WAL Archiving**
   - Alert if WAL files not being archived
   - Check: Count of files in `wal_archive/` directory

### Alert Configuration

Configure monitoring system (e.g., Prometheus, CloudWatch) with:

```yaml
# Example Prometheus alert rules
groups:
  - name: backup_alerts
    rules:
      - alert: BackupTooOld
        expr: time() - backup_last_success_timestamp > 93600
        for: 1h
        annotations:
          summary: "Database backup is too old"

      - alert: BackupFailed
        expr: backup_failure_count > 2
        annotations:
          summary: "Multiple backup failures detected"

      - alert: StorageAlmostFull
        expr: backup_storage_usage_percent > 85
        annotations:
          summary: "Backup storage usage high"
```

## Testing and Validation

### Quarterly DR Drill Procedure

**Schedule:** First Sunday of each quarter at 10:00 AM

1. **Week before drill:**
   - Notify all team members
   - Review and update this runbook
   - Verify backup monitoring is working

2. **Drill day:**
   - Select a disaster scenario (rotate each quarter)
   - Follow runbook procedures
   - Document time taken for each step
   - Note any issues or deviations

3. **Week after drill:**
   - Conduct post-drill review meeting
   - Update runbook based on lessons learned
   - Fix any identified issues
   - Update RTO/RPO if needed

### Test Restore Procedure (Monthly)

Run this test monthly to verify backup integrity:

```bash
#!/bin/bash
# Monthly test restore procedure

# 1. Create test database
psql -h localhost -U internetid -d postgres \
  -c "CREATE DATABASE test_restore_$(date +%Y%m);"

# 2. Restore latest backup
export POSTGRES_DB="test_restore_$(date +%Y%m)"
cd /opt/internet-id/ops/restore
./restore-database.sh full

# 3. Verify data
psql -h localhost -U internetid -d "test_restore_$(date +%Y%m)" \
  -c "SELECT COUNT(*) FROM Content;" \
  -c "SELECT COUNT(*) FROM User;" \
  -c "SELECT COUNT(*) FROM PlatformBinding;"

# 4. Cleanup
psql -h localhost -U internetid -d postgres \
  -c "DROP DATABASE test_restore_$(date +%Y%m);"

echo "Test restore completed successfully"
```

## Contact Information

**On-Call Engineer:** [Contact details]  
**Database Team Lead:** [Contact details]  
**Infrastructure Team:** [Contact details]  
**Escalation:** [Contact details]

## References

- PostgreSQL Backup Documentation: https://www.postgresql.org/docs/current/backup.html
- AWS S3 Documentation: https://docs.aws.amazon.com/s3/
- Project Repository: https://github.com/subculture-collective/internet-id

## Revision History

| Date       | Version | Changes                           | Author         |
| ---------- | ------- | --------------------------------- | -------------- |
| 2025-10-24 | 1.0     | Initial disaster recovery runbook | GitHub Copilot |

---

**Last Updated:** 2025-10-24  
**Next Review Date:** 2026-01-24
