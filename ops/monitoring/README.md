# Internet-ID Monitoring Stack

This directory contains configuration files for the production monitoring and alerting infrastructure.

## Directory Structure

```
monitoring/
├── prometheus/
│   ├── prometheus.yml    # Prometheus configuration
│   └── alerts.yml        # Alert rule definitions
├── alertmanager/
│   └── alertmanager.yml  # Alertmanager routing configuration
├── blackbox/
│   └── blackbox.yml      # Blackbox exporter configuration
└── grafana/
    ├── provisioning/     # Grafana provisioning configs (to be added)
    └── dashboards/       # Dashboard JSON files (to be added)
```

## Quick Start

### 1. Start Monitoring Stack

```bash
# From repository root
docker compose -f docker-compose.monitoring.yml up -d
```

### 2. Access Dashboards

- **Prometheus**: http://localhost:9090
- **Alertmanager**: http://localhost:9093
- **Grafana**: http://localhost:3001 (admin/admin)

### 3. Configure Alerts

Edit environment variables in `.env.monitoring`:

```bash
# PagerDuty
PAGERDUTY_SERVICE_KEY=your_key

# Slack
SLACK_WEBHOOK_URL=your_webhook

# Email
ALERT_EMAIL=ops@example.com
SMTP_USERNAME=your_username
SMTP_PASSWORD=your_password
```

## Configuration Files

### Prometheus (prometheus/prometheus.yml)

Defines:

- Scrape targets and intervals
- Alert rule files
- Alertmanager integration
- Metric retention

### Alert Rules (prometheus/alerts.yml)

Defines alert conditions for:

- Service availability (>2 consecutive failures)
- High error rates (>5% of requests)
- Queue depth (>100 pending jobs)
- Database connection pool exhaustion (>80% usage)
- IPFS upload failures (>20% failure rate)
- Blockchain transaction failures (>10% failure rate)
- High response times (P95 >5 seconds)
- Resource usage (CPU >80%, Memory >85%)

### Alertmanager (alertmanager/alertmanager.yml)

Configures:

- Alert routing rules
- Notification channels (PagerDuty, Slack, Email)
- Alert grouping and inhibition
- On-call schedules

### Blackbox Exporter (blackbox/blackbox.yml)

Configures external monitoring:

- HTTP/HTTPS endpoint checks
- TCP connectivity checks
- DNS checks
- ICMP ping checks

## Alert Severity Levels

| Severity | Response Time | Notification Channel |
| -------- | ------------- | -------------------- |
| Critical | Immediate     | PagerDuty + Slack    |
| Warning  | 15 minutes    | Slack                |
| Info     | 1 hour        | Email                |

## Metrics Collected

### Application Metrics (API)

- `http_request_duration_seconds` - Request latency histogram
- `http_requests_total` - Total HTTP requests counter
- `verification_total` - Verification outcomes counter
- `verification_duration_seconds` - Verification duration histogram
- `ipfs_uploads_total` - IPFS upload counter
- `ipfs_upload_duration_seconds` - IPFS upload duration histogram
- `blockchain_transactions_total` - Blockchain transaction counter
- `blockchain_transaction_duration_seconds` - Transaction duration histogram
- `cache_hits_total` - Cache hit counter
- `cache_misses_total` - Cache miss counter
- `db_query_duration_seconds` - Database query duration histogram
- `health_check_status` - Health check status gauge
- `queue_depth` - Queue depth gauge

### Infrastructure Metrics

- **PostgreSQL** (via postgres_exporter)
  - Connection count and pool usage
  - Query performance metrics
  - Transaction rates
  - Database size and growth

- **Redis** (via redis_exporter)
  - Memory usage
  - Hit rate
  - Commands per second
  - Connected clients

- **System** (via node_exporter)
  - CPU usage
  - Memory usage
  - Disk I/O
  - Network traffic

- **Containers** (via cAdvisor)
  - Container CPU usage
  - Container memory usage
  - Container network I/O
  - Container filesystem usage

## Alert Rules Summary

### Critical Alerts

- **ServiceDown**: Service unreachable for >2 minutes
- **DatabaseDown**: Database unreachable for >1 minute
- **CriticalErrorRate**: Error rate >10% for >2 minutes
- **CriticalQueueDepth**: >500 pending jobs for >2 minutes
- **DatabaseConnectionPoolCritical**: >95% connections used
- **CriticalIpfsFailureRate**: >50% IPFS upload failures
- **BlockchainRPCDown**: >50% blockchain requests failing
- **CriticalMemoryUsage**: >95% memory used

### Warning Alerts

- **HighErrorRate**: Error rate >5% for >5 minutes
- **HighQueueDepth**: >100 pending jobs for >5 minutes
- **DatabaseConnectionPoolExhaustion**: >80% connections used
- **HighDatabaseLatency**: P95 query latency >1 second
- **HighIpfsFailureRate**: >20% IPFS upload failures
- **BlockchainTransactionFailures**: >10% transaction failures
- **HighResponseTime**: P95 response time >5 seconds
- **HighMemoryUsage**: >85% memory used
- **HighCPUUsage**: CPU >80% for >5 minutes
- **RedisDown**: Redis unreachable for >2 minutes

### Info Alerts

- **LowCacheHitRate**: Cache hit rate <50% for >10 minutes
- **ServiceHealthDegraded**: Service reporting degraded status

## Customizing Alerts

### Adjusting Thresholds

Edit `prometheus/alerts.yml`:

```yaml
# Example: Adjust high error rate threshold
- alert: HighErrorRate
  expr: |
    (sum(rate(http_requests_total{status_code=~"5.."}[5m]))
    / sum(rate(http_requests_total[5m]))) > 0.03  # Changed from 0.05 to 0.03 (3%)
  for: 5m
```

### Adding New Alerts

Add to `prometheus/alerts.yml`:

```yaml
- alert: CustomAlert
  expr: your_metric > threshold
  for: duration
  labels:
    severity: warning
    service: your_service
  annotations:
    summary: "Brief description"
    description: "Detailed description"
    runbook_url: "https://github.com/.../ALERTING_RUNBOOK.md#custom-alert"
```

### Customizing Notification Channels

Edit `alertmanager/alertmanager.yml`:

```yaml
# Add a new receiver
receivers:
  - name: "custom-receiver"
    slack_configs:
      - api_url: "${CUSTOM_SLACK_WEBHOOK}"
        channel: "#custom-channel"
```

## Testing

### Test Alert Generation

```bash
# Stop a service to trigger ServiceDown alert
docker compose stop api

# Wait 2+ minutes for alert to fire
# Check Alertmanager: http://localhost:9093

# Restore service
docker compose up -d api
```

### Test Notification Channels

```bash
# Send test alert to Alertmanager
curl -X POST http://localhost:9093/api/v1/alerts -d '[{
  "labels": {
    "alertname": "TestAlert",
    "severity": "warning"
  },
  "annotations": {
    "summary": "Test alert from monitoring setup"
  }
}]'
```

## Troubleshooting

### Prometheus Not Scraping

```bash
# Check targets
curl http://localhost:9090/api/v1/targets

# Check logs
docker compose logs prometheus
```

### Alerts Not Firing

```bash
# Check alert rules
curl http://localhost:9090/api/v1/rules

# Check Alertmanager
curl http://localhost:9093/api/v1/status
```

### No Metrics in Grafana

1. Verify Prometheus data source configuration
2. Check Prometheus is collecting metrics
3. Verify time range in dashboard

## Documentation

- [Monitoring Setup Guide](../../docs/ops/MONITORING_SETUP.md)
- [Alerting Runbook](../../docs/ops/ALERTING_RUNBOOK.md)
- [Observability Guide](../../docs/OBSERVABILITY.md)

## External Resources

- [Prometheus Documentation](https://prometheus.io/docs/)
- [Alertmanager Documentation](https://prometheus.io/docs/alerting/latest/alertmanager/)
- [Grafana Documentation](https://grafana.com/docs/)
- [PagerDuty Integration](https://www.pagerduty.com/docs/guides/prometheus-integration-guide/)
