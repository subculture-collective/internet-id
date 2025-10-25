# Database Backup Monitoring Configuration

This directory contains example monitoring and alerting configurations for the database backup system.

## Prometheus Monitoring

### PostgreSQL Exporter Setup

Install and configure the PostgreSQL exporter:

```bash
# Install postgres_exporter
wget https://github.com/prometheus-community/postgres_exporter/releases/download/v0.15.0/postgres_exporter-0.15.0.linux-amd64.tar.gz
tar xzf postgres_exporter-0.15.0.linux-amd64.tar.gz
sudo mv postgres_exporter-0.15.0.linux-amd64/postgres_exporter /usr/local/bin/

# Create systemd service
sudo cat > /etc/systemd/system/postgres_exporter.service <<EOF
[Unit]
Description=PostgreSQL Exporter
After=network.target

[Service]
Type=simple
User=postgres
Environment="DATA_SOURCE_NAME=postgresql://internetid:password@localhost:5432/internetid?sslmode=disable"
ExecStart=/usr/local/bin/postgres_exporter
Restart=always

[Install]
WantedBy=multi-user.target
EOF

# Start service
sudo systemctl daemon-reload
sudo systemctl enable postgres_exporter
sudo systemctl start postgres_exporter
```

### Custom Backup Metrics Script

Create a custom exporter for backup-specific metrics:

```bash
#!/bin/bash
# /opt/backup-scripts/backup_exporter.sh
# Exports backup metrics for Prometheus

BACKUP_DIR="/var/lib/postgresql/backups"
METRICS_FILE="/var/lib/postgresql/metrics/backup_metrics.prom"

mkdir -p $(dirname "$METRICS_FILE")

# Get latest backup timestamp
LATEST_BACKUP=$(ls -t "${BACKUP_DIR}/full"/backup_*.dump.gz 2>/dev/null | head -1)
if [ -n "$LATEST_BACKUP" ]; then
    BACKUP_TIMESTAMP=$(stat -c %Y "$LATEST_BACKUP" 2>/dev/null || stat -f %m "$LATEST_BACKUP")
    BACKUP_SIZE=$(stat -c %s "$LATEST_BACKUP" 2>/dev/null || stat -f %z "$LATEST_BACKUP")
    BACKUP_AGE=$(($(date +%s) - BACKUP_TIMESTAMP))
else
    BACKUP_TIMESTAMP=0
    BACKUP_SIZE=0
    BACKUP_AGE=999999
fi

# Count backups
BACKUP_COUNT=$(find "${BACKUP_DIR}/full" -name "backup_*.dump.gz" | wc -l)

# WAL metrics
WAL_COUNT=$(find "${BACKUP_DIR}/wal_archive" -type f 2>/dev/null | wc -l)
WAL_SIZE=$(du -sb "${BACKUP_DIR}/wal_archive" 2>/dev/null | cut -f1)

# Storage metrics
TOTAL_SIZE=$(du -sb "${BACKUP_DIR}" 2>/dev/null | cut -f1)
DISK_USAGE=$(df "${BACKUP_DIR}" | tail -1 | awk '{print $5}' | tr -d '%')

# Write metrics
cat > "$METRICS_FILE" <<EOF
# HELP pg_backup_last_success_timestamp Unix timestamp of last successful backup
# TYPE pg_backup_last_success_timestamp gauge
pg_backup_last_success_timestamp ${BACKUP_TIMESTAMP}

# HELP pg_backup_age_seconds Age of latest backup in seconds
# TYPE pg_backup_age_seconds gauge
pg_backup_age_seconds ${BACKUP_AGE}

# HELP pg_backup_size_bytes Size of latest backup in bytes
# TYPE pg_backup_size_bytes gauge
pg_backup_size_bytes ${BACKUP_SIZE}

# HELP pg_backup_count Total number of backups
# TYPE pg_backup_count gauge
pg_backup_count ${BACKUP_COUNT}

# HELP pg_wal_archive_count Number of WAL archive files
# TYPE pg_wal_archive_count gauge
pg_wal_archive_count ${WAL_COUNT}

# HELP pg_wal_archive_size_bytes Total size of WAL archives in bytes
# TYPE pg_wal_archive_size_bytes gauge
pg_wal_archive_size_bytes ${WAL_SIZE}

# HELP pg_backup_storage_size_bytes Total backup storage size in bytes
# TYPE pg_backup_storage_size_bytes gauge
pg_backup_storage_size_bytes ${TOTAL_SIZE}

# HELP pg_backup_disk_usage_percent Disk usage percentage for backup directory
# TYPE pg_backup_disk_usage_percent gauge
pg_backup_disk_usage_percent ${DISK_USAGE}
EOF

echo "Metrics updated at $(date)"
```

Add to crontab to run every 5 minutes:

```
*/5 * * * * /opt/backup-scripts/backup_exporter.sh
```

Configure Prometheus to scrape these metrics:

```yaml
# prometheus.yml
scrape_configs:
  - job_name: "postgres_backups"
    static_configs:
      - targets: ["localhost:9187"] # postgres_exporter

  - job_name: "backup_metrics"
    static_configs:
      - targets: ["localhost:9100"] # node_exporter for file metrics
    file_sd_configs:
      - files:
          - "/var/lib/postgresql/metrics/backup_metrics.prom"
```

### Alert Rules

Create Prometheus alert rules:

```yaml
# backup_alerts.yml
groups:
  - name: database_backup_alerts
    interval: 60s
    rules:
      # Alert if backup is too old
      - alert: BackupTooOld
        expr: time() - pg_backup_last_success_timestamp > 93600
        for: 30m
        labels:
          severity: critical
          component: backup
        annotations:
          summary: "Database backup is too old"
          description: "Latest backup is {{ humanizeDuration $value }} old (threshold: 26 hours)"

      # Alert if no recent backups
      - alert: NoRecentBackups
        expr: pg_backup_age_seconds > 172800
        for: 1h
        labels:
          severity: critical
          component: backup
        annotations:
          summary: "No backups in last 48 hours"
          description: "No successful backup in {{ humanizeDuration $value }}"

      # Alert on backup storage issues
      - alert: BackupStorageAlmostFull
        expr: pg_backup_disk_usage_percent > 85
        for: 15m
        labels:
          severity: warning
          component: backup
        annotations:
          summary: "Backup storage usage high"
          description: "Backup storage is {{ $value }}% full"

      # Alert on WAL archiving issues
      - alert: WALArchivingStalled
        expr: rate(pg_wal_archive_count[1h]) < 1
        for: 2h
        labels:
          severity: warning
          component: backup
        annotations:
          summary: "WAL archiving appears stalled"
          description: "No new WAL files archived in last 2 hours"

      # Alert on backup size anomaly
      - alert: BackupSizeAnomaly
        expr: abs(pg_backup_size_bytes - avg_over_time(pg_backup_size_bytes[7d])) / avg_over_time(pg_backup_size_bytes[7d]) > 0.5
        for: 1h
        labels:
          severity: warning
          component: backup
        annotations:
          summary: "Backup size significantly different from average"
          description: "Current backup size differs by >50% from 7-day average"
```

## Grafana Dashboards

### Import Dashboard

Create a Grafana dashboard for backup monitoring:

```json
{
  "dashboard": {
    "title": "Database Backup Monitoring",
    "panels": [
      {
        "title": "Backup Age",
        "targets": [
          {
            "expr": "pg_backup_age_seconds / 3600",
            "legendFormat": "Backup Age (hours)"
          }
        ],
        "type": "graph"
      },
      {
        "title": "Backup Size",
        "targets": [
          {
            "expr": "pg_backup_size_bytes / 1024 / 1024 / 1024",
            "legendFormat": "Backup Size (GB)"
          }
        ],
        "type": "graph"
      },
      {
        "title": "Storage Usage",
        "targets": [
          {
            "expr": "pg_backup_disk_usage_percent"
          }
        ],
        "type": "gauge",
        "options": {
          "max": 100,
          "thresholds": [
            { "value": 0, "color": "green" },
            { "value": 70, "color": "yellow" },
            { "value": 85, "color": "red" }
          ]
        }
      },
      {
        "title": "WAL Archive Count",
        "targets": [
          {
            "expr": "pg_wal_archive_count"
          }
        ],
        "type": "stat"
      }
    ]
  }
}
```

## CloudWatch Monitoring (AWS)

### Custom Metrics Script

```bash
#!/bin/bash
# Push backup metrics to CloudWatch

NAMESPACE="InternetID/Backups"
REGION="us-east-1"
BACKUP_DIR="/var/lib/postgresql/backups"

# Get metrics
LATEST_BACKUP=$(ls -t "${BACKUP_DIR}/full"/backup_*.dump.gz 2>/dev/null | head -1)
if [ -n "$LATEST_BACKUP" ]; then
    BACKUP_TIMESTAMP=$(stat -c %Y "$LATEST_BACKUP")
    BACKUP_AGE=$(($(date +%s) - BACKUP_TIMESTAMP))
    BACKUP_SIZE=$(stat -c %s "$LATEST_BACKUP")
else
    BACKUP_AGE=999999
    BACKUP_SIZE=0
fi

# Push to CloudWatch
aws cloudwatch put-metric-data \
  --namespace "$NAMESPACE" \
  --metric-name BackupAge \
  --value "$BACKUP_AGE" \
  --unit Seconds \
  --region "$REGION"

aws cloudwatch put-metric-data \
  --namespace "$NAMESPACE" \
  --metric-name BackupSize \
  --value "$BACKUP_SIZE" \
  --unit Bytes \
  --region "$REGION"

# Storage usage
DISK_USAGE=$(df "${BACKUP_DIR}" | tail -1 | awk '{print $5}' | tr -d '%')
aws cloudwatch put-metric-data \
  --namespace "$NAMESPACE" \
  --metric-name DiskUsage \
  --value "$DISK_USAGE" \
  --unit Percent \
  --region "$REGION"
```

Add to crontab:

```
*/5 * * * * /opt/backup-scripts/cloudwatch_metrics.sh
```

### CloudWatch Alarms

```bash
# Create alarm for old backup
aws cloudwatch put-metric-alarm \
  --alarm-name "InternetID-Backup-Too-Old" \
  --alarm-description "Alert when backup is older than 26 hours" \
  --metric-name BackupAge \
  --namespace InternetID/Backups \
  --statistic Maximum \
  --period 3600 \
  --threshold 93600 \
  --comparison-operator GreaterThanThreshold \
  --evaluation-periods 1 \
  --alarm-actions arn:aws:sns:us-east-1:123456789:backup-alerts

# Create alarm for disk space
aws cloudwatch put-metric-alarm \
  --alarm-name "InternetID-Backup-Storage-Full" \
  --alarm-description "Alert when backup storage exceeds 85%" \
  --metric-name DiskUsage \
  --namespace InternetID/Backups \
  --statistic Average \
  --period 300 \
  --threshold 85 \
  --comparison-operator GreaterThanThreshold \
  --evaluation-periods 2 \
  --alarm-actions arn:aws:sns:us-east-1:123456789:backup-alerts
```

## Email Alerts

### Configure SMTP

```bash
# Install mailutils
sudo apt-get install mailutils

# Configure postfix or use external SMTP
sudo dpkg-reconfigure postfix

# Test email
echo "Test backup alert" | mail -s "Test Alert" ops@example.com
```

### Alert Script

```bash
#!/bin/bash
# /opt/backup-scripts/send_alert.sh

ALERT_EMAIL="${ALERT_EMAIL:-ops@example.com}"
SUBJECT="$1"
MESSAGE="$2"

# Send email
echo "$MESSAGE" | mail -s "$SUBJECT" "$ALERT_EMAIL"

# Also log to syslog
logger -t backup_alert "$SUBJECT: $MESSAGE"

# Optional: Send to Slack
if [ -n "$SLACK_WEBHOOK" ]; then
    curl -X POST "$SLACK_WEBHOOK" \
      -H 'Content-Type: application/json' \
      -d "{\"text\":\"$SUBJECT\n$MESSAGE\"}"
fi
```

## Health Check Endpoint

### Simple HTTP Health Check

```bash
#!/bin/bash
# /opt/backup-scripts/health_check.sh
# Provides HTTP endpoint for health checks

PORT="${HEALTH_CHECK_PORT:-9090}"
BACKUP_DIR="/var/lib/postgresql/backups"

while true; do
    # Check backup age
    LATEST_BACKUP=$(ls -t "${BACKUP_DIR}/full"/backup_*.dump.gz 2>/dev/null | head -1)
    if [ -n "$LATEST_BACKUP" ]; then
        BACKUP_TIMESTAMP=$(stat -c %Y "$LATEST_BACKUP")
        BACKUP_AGE=$(($(date +%s) - BACKUP_TIMESTAMP))
    else
        BACKUP_AGE=999999
    fi

    # Determine health status
    if [ $BACKUP_AGE -lt 93600 ]; then
        STATUS="healthy"
        HTTP_CODE=200
    else
        STATUS="unhealthy"
        HTTP_CODE=503
    fi

    # Respond to health check
    echo -e "HTTP/1.1 $HTTP_CODE OK\r\nContent-Type: application/json\r\n\r\n{\"status\":\"$STATUS\",\"backup_age\":$BACKUP_AGE}" | nc -l -p $PORT
done
```

### Kubernetes Liveness Probe

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: backup-service
spec:
  containers:
    - name: backup
      image: postgres:16-alpine
      livenessProbe:
        exec:
          command:
            - /bin/sh
            - -c
            - |
              LATEST_BACKUP=$(ls -t /var/lib/postgresql/backups/full/backup_*.dump.gz | head -1)
              [ -n "$LATEST_BACKUP" ] && [ $(($(date +%s) - $(stat -c %Y "$LATEST_BACKUP"))) -lt 93600 ]
        initialDelaySeconds: 300
        periodSeconds: 3600
```

## Log Aggregation

### Filebeat Configuration

```yaml
# filebeat.yml
filebeat.inputs:
  - type: log
    enabled: true
    paths:
      - /var/lib/postgresql/backups/backup.log
      - /var/lib/postgresql/backups/restore.log
      - /var/lib/postgresql/backups/verify.log
    fields:
      component: backup
      service: internet-id

output.elasticsearch:
  hosts: ["localhost:9200"]
  index: "internet-id-backups-%{+yyyy.MM.dd}"
```

### Searching Logs

```bash
# Search for backup failures
curl -X GET "localhost:9200/internet-id-backups-*/_search" -H 'Content-Type: application/json' -d'
{
  "query": {
    "match": {
      "message": "ERROR"
    }
  }
}
'
```

## Summary

This monitoring configuration provides:

- **Real-time metrics**: Backup age, size, storage usage
- **Proactive alerts**: Before issues become critical
- **Multiple channels**: Email, Slack, PagerDuty integration
- **Centralized logging**: Backup operation logs aggregated
- **Health checks**: For orchestration platforms (Kubernetes, ECS)
- **Dashboards**: Visual monitoring via Grafana or CloudWatch

For complete setup instructions, see [DATABASE_BACKUP_RECOVERY.md](./DATABASE_BACKUP_RECOVERY.md).
