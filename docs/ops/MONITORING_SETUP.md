# Production Monitoring and Alerting Setup Guide

This guide provides comprehensive instructions for setting up production monitoring and alerting infrastructure for Internet-ID.

## Overview

The monitoring stack includes:

- **Prometheus** - Metrics collection and alerting
- **Grafana** - Metrics visualization and dashboards
- **Alertmanager** - Alert routing and management
- **Sentry** - Error tracking and performance monitoring
- **PagerDuty** - On-call management and incident response
- **Slack** - Team notifications and alerts

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Quick Start](#quick-start)
3. [Prometheus Setup](#prometheus-setup)
4. [Alertmanager Setup](#alertmanager-setup)
5. [Grafana Setup](#grafana-setup)
6. [Sentry Setup](#sentry-setup)
7. [PagerDuty Integration](#pagerduty-integration)
8. [Slack Integration](#slack-integration)
9. [Health Checks](#health-checks)
10. [Testing Alerts](#testing-alerts)
11. [Troubleshooting](#troubleshooting)

---

## Prerequisites

### Required Services

- Docker and Docker Compose
- Production deployment of Internet-ID
- Domain name (for external monitoring)

### Optional Services

- Sentry account (for error tracking)
- PagerDuty account (for on-call management)
- Slack workspace (for team notifications)

---

## Quick Start

### 1. Configure Environment Variables

Copy the example environment file and configure it:

```bash
cp .env.example .env.monitoring
```

Edit `.env.monitoring` with your configuration:

```bash
# Sentry (Error Tracking)
SENTRY_DSN=https://your-sentry-dsn@sentry.io/project-id
SENTRY_ENVIRONMENT=production
SENTRY_TRACES_SAMPLE_RATE=0.1

# PagerDuty (On-Call)
PAGERDUTY_SERVICE_KEY=your_pagerduty_service_key
PAGERDUTY_ROUTING_KEY=your_pagerduty_routing_key

# Slack (Notifications)
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/YOUR/WEBHOOK/URL
SLACK_CRITICAL_CHANNEL=#alerts-critical
SLACK_WARNINGS_CHANNEL=#alerts-warnings

# Email Alerts
ALERT_EMAIL=ops@example.com
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=your_smtp_username
SMTP_PASSWORD=your_smtp_password

# Grafana
GRAFANA_ADMIN_PASSWORD=changeme_strong_password
```

### 2. Start Monitoring Stack

```bash
# Start the main application
docker compose -f docker-compose.production.yml up -d

# Start the monitoring stack
docker compose -f docker-compose.monitoring.yml up -d
```

### 3. Verify Services

Check that all services are running:

```bash
docker compose -f docker-compose.monitoring.yml ps
```

Expected output:
```
NAME                IMAGE                                    STATUS
prometheus          prom/prometheus:v2.48.0                  Up (healthy)
alertmanager        prom/alertmanager:v0.26.0                Up (healthy)
grafana             grafana/grafana:10.2.2                   Up (healthy)
postgres-exporter   prometheuscommunity/postgres-exporter    Up (healthy)
redis-exporter      oliver006/redis_exporter                 Up (healthy)
node-exporter       prom/node-exporter                       Up (healthy)
cadvisor            gcr.io/cadvisor/cadvisor                 Up (healthy)
blackbox-exporter   prom/blackbox-exporter                   Up (healthy)
```

### 4. Access Monitoring Dashboards

- **Prometheus**: http://localhost:9090
- **Alertmanager**: http://localhost:9093
- **Grafana**: http://localhost:3001 (default credentials: admin/admin)

---

## Prometheus Setup

### Configuration

Prometheus is configured via `/ops/monitoring/prometheus/prometheus.yml`.

Key configuration sections:

1. **Scrape Targets**: Define which services to monitor
2. **Alert Rules**: Define alert conditions
3. **Alertmanager Integration**: Configure alert routing

### Scrape Intervals

- **API Service**: 15 seconds
- **Database**: 15 seconds
- **Redis**: 15 seconds
- **System Metrics**: 15 seconds

### Metrics Collected

#### Application Metrics (from API)

- HTTP request duration and count
- Verification outcomes
- IPFS upload metrics
- Cache hit/miss rates
- Database query duration

#### Infrastructure Metrics

- **PostgreSQL**: Connection count, query performance, transaction rates
- **Redis**: Memory usage, hit rate, commands per second
- **System**: CPU, memory, disk, network
- **Containers**: Resource usage per container

### Testing Prometheus

```bash
# Check Prometheus is scraping metrics
curl http://localhost:9090/api/v1/targets

# Query metrics
curl 'http://localhost:9090/api/v1/query?query=up'

# Check API metrics are being collected
curl http://localhost:3001/api/metrics
```

---

## Alertmanager Setup

### Configuration

Alertmanager routes alerts to different channels based on severity and type.

Configuration file: `/ops/monitoring/alertmanager/alertmanager.yml`

### Alert Routing

| Severity | Channels | Response Time |
|----------|----------|---------------|
| Critical | PagerDuty + Slack | Immediate |
| Warning | Slack | 15 minutes |
| Info | Email | 1 hour |

### Alert Grouping

Alerts are grouped by:
- `alertname` - Same type of alert
- `cluster` - Same cluster
- `service` - Same service

This prevents notification spam when multiple instances fail.

### Inhibition Rules

Certain alerts suppress others:
- Critical alerts suppress warnings for same service
- Service down alerts suppress related alerts
- Database down suppresses connection pool alerts

### Testing Alertmanager

```bash
# Check Alertmanager status
curl http://localhost:9093/api/v1/status

# Send test alert
curl -H "Content-Type: application/json" -d '[{
  "labels": {
    "alertname": "TestAlert",
    "severity": "warning"
  },
  "annotations": {
    "summary": "Test alert from monitoring setup"
  }
}]' http://localhost:9093/api/v1/alerts
```

---

## Grafana Setup

### Initial Configuration

1. Access Grafana at http://localhost:3001
2. Login with admin credentials (from `.env.monitoring`)
3. Add Prometheus data source:
   - URL: http://prometheus:9090
   - Save & Test

### Pre-built Dashboards

Import recommended dashboards:

1. **Node Exporter Full** (ID: 1860)
   - System metrics overview
   
2. **PostgreSQL Database** (ID: 9628)
   - Database performance metrics
   
3. **Redis Dashboard** (ID: 11835)
   - Cache performance metrics

4. **Docker Container & Host Metrics** (ID: 179)
   - Container resource usage

### Custom Internet-ID Dashboard

Create a custom dashboard with panels for:

1. **API Health**
   - Request rate
   - Error rate
   - Response time (P50, P95, P99)

2. **Verification Metrics**
   - Verification success/failure rate
   - Verification duration

3. **IPFS Metrics**
   - Upload success/failure rate
   - Upload duration by provider

4. **Database Metrics**
   - Connection pool usage
   - Query latency
   - Transaction rate

5. **Cache Metrics**
   - Hit rate
   - Memory usage
   - Keys count

### Setting Up Alerts in Grafana

Grafana can also send alerts. To configure:

1. Go to Alerting → Notification channels
2. Add channels (email, Slack, PagerDuty)
3. Create alert rules on dashboard panels
4. Test notification channels

---

## Sentry Setup

### Creating a Sentry Project

1. Sign up at https://sentry.io
2. Create a new project for "Node.js"
3. Copy the DSN (Data Source Name)

### Configuration

Add to `.env`:

```bash
SENTRY_DSN=https://your-key@sentry.io/project-id
SENTRY_ENVIRONMENT=production
SENTRY_TRACES_SAMPLE_RATE=0.1
```

### Features

#### Error Tracking

- Automatic error capture
- Stack traces with source maps
- Error grouping and deduplication
- Release tracking

#### Performance Monitoring

- Transaction tracing
- Slow query detection
- External API monitoring

#### Breadcrumbs

- User actions
- API calls
- Database queries
- Cache operations

### Testing Sentry

```bash
# Restart API to load Sentry configuration
docker compose restart api

# Trigger a test error
curl -X POST http://localhost:3001/api/test-error

# Check Sentry dashboard for the error
```

### Sentry Best Practices

1. **Source Maps**: Upload source maps for better stack traces
2. **Release Tracking**: Tag errors with release versions
3. **User Context**: Include user IDs for better debugging
4. **Breadcrumbs**: Add custom breadcrumbs for important events
5. **Sampling**: Use sampling in production to control costs

---

## PagerDuty Integration

### Setting Up PagerDuty

1. Create a PagerDuty account at https://www.pagerduty.com
2. Create a service for "Internet-ID Production"
3. Get the Integration Key

### Configuration

Add to `.env.monitoring`:

```bash
PAGERDUTY_SERVICE_KEY=your_integration_key
PAGERDUTY_ROUTING_KEY=your_routing_key
```

### On-Call Schedule

Set up an on-call rotation:

1. Go to People → On-Call Schedules
2. Create a new schedule
3. Add team members
4. Configure rotation (e.g., weekly)

### Escalation Policies

Create escalation rules:

1. **Level 1**: Primary on-call (5 min response)
2. **Level 2**: Secondary on-call (15 min escalation)
3. **Level 3**: Engineering lead (30 min escalation)

### Alert Routing

Configure which alerts go to PagerDuty:

- **Critical severity**: Immediate page
- **Database alerts**: Database team
- **Service down**: Primary on-call

### Testing PagerDuty

```bash
# Send test alert to PagerDuty
curl -X POST https://events.pagerduty.com/v2/enqueue \
  -H 'Content-Type: application/json' \
  -d '{
    "routing_key": "your_routing_key",
    "event_action": "trigger",
    "payload": {
      "summary": "Test alert from Internet-ID monitoring",
      "severity": "warning",
      "source": "monitoring-setup"
    }
  }'
```

---

## Slack Integration

### Creating a Slack Webhook

1. Go to https://api.slack.com/messaging/webhooks
2. Create a new Slack app
3. Enable Incoming Webhooks
4. Add webhook to your workspace
5. Copy the webhook URL

### Configuration

Add to `.env.monitoring`:

```bash
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/YOUR/WEBHOOK/URL
SLACK_CRITICAL_CHANNEL=#alerts-critical
SLACK_WARNINGS_CHANNEL=#alerts-warnings
```

### Slack Channels

Create dedicated channels:

- `#alerts-critical` - Critical alerts requiring immediate attention
- `#alerts-warnings` - Warning alerts needing review
- `#alerts-info` - Informational alerts
- `#incidents` - Active incident coordination

### Alert Formatting

Slack alerts include:

- **Summary**: Brief description
- **Severity**: Visual indicator (🔴 critical, ⚠️ warning)
- **Service**: Affected service
- **Description**: Detailed information
- **Runbook Link**: Link to resolution steps

### Testing Slack

```bash
# Send test message to Slack
curl -X POST ${SLACK_WEBHOOK_URL} \
  -H 'Content-Type: application/json' \
  -d '{
    "text": "Test alert from Internet-ID monitoring",
    "attachments": [{
      "color": "warning",
      "title": "Test Alert",
      "text": "This is a test alert to verify Slack integration"
    }]
  }'
```

---

## Health Checks

### API Health Endpoint

The API provides a comprehensive health check endpoint:

```bash
curl http://localhost:3001/api/health
```

Response includes:

```json
{
  "status": "ok",
  "timestamp": "2025-10-31T20:00:00.000Z",
  "uptime": 3600,
  "services": {
    "database": {
      "status": "healthy"
    },
    "cache": {
      "status": "healthy",
      "enabled": true
    },
    "blockchain": {
      "status": "healthy",
      "blockNumber": 12345678
    }
  }
}
```

### Health Check Intervals

- **Docker health checks**: 30 seconds
- **Prometheus monitoring**: 15 seconds (via blackbox exporter)
- **External uptime monitoring**: 1 minute (recommended)

### Custom Health Checks

To add custom health checks, modify `scripts/routes/health.routes.ts`:

```typescript
// Example: Check IPFS connectivity
try {
  await ipfsService.ping();
  checks.services.ipfs = { status: "healthy" };
} catch (error) {
  checks.services.ipfs = { 
    status: "unhealthy", 
    error: error.message 
  };
  checks.status = "degraded";
}
```

### External Uptime Monitoring

Consider using external uptime monitors:

- **UptimeRobot** (https://uptimerobot.com) - Free tier available
- **Pingdom** (https://www.pingdom.com) - Comprehensive monitoring
- **StatusCake** (https://www.statuscake.com) - Multi-region monitoring

Configure them to:
- Monitor `https://your-domain.com/api/health`
- Check interval: 1 minute
- Alert on 2 consecutive failures

---

## Testing Alerts

### Manual Alert Testing

#### 1. Test Service Down Alert

```bash
# Stop the API service
docker compose stop api

# Wait 2 minutes for alert to fire
# Check Alertmanager: http://localhost:9093
# Check Slack/PagerDuty for notifications

# Restore service
docker compose up -d api
```

#### 2. Test High Error Rate Alert

```bash
# Generate errors
for i in {1..100}; do
  curl -X POST http://localhost:3001/api/nonexistent
done

# Wait 5 minutes for alert to fire
```

#### 3. Test Database Connection Pool Alert

```bash
# Connect to database
docker compose exec db psql -U internetid -d internetid

# In psql, run:
SELECT pg_sleep(600) FROM generate_series(1, 90);

# This will hold 90 connections for 10 minutes
```

### Automated Alert Testing

Create a test script:

```bash
#!/bin/bash
# test-alerts.sh

echo "Testing monitoring alerts..."

# Test 1: Service health
echo "1. Testing service down alert..."
docker compose stop api
sleep 150
docker compose up -d api

# Test 2: Error rate
echo "2. Testing error rate alert..."
for i in {1..200}; do
  curl -s -X POST http://localhost:3001/api/nonexistent > /dev/null
done

echo "Alert tests complete. Check Alertmanager and notification channels."
```

---

## Troubleshooting

### Prometheus Not Scraping Metrics

**Symptoms:**
- Targets showing as "down" in Prometheus UI
- No metrics available in Grafana

**Solutions:**

1. Check target status:
   ```bash
   curl http://localhost:9090/api/v1/targets
   ```

2. Verify network connectivity:
   ```bash
   docker compose exec prometheus wget -O- http://api:3001/api/metrics
   ```

3. Check Prometheus logs:
   ```bash
   docker compose logs prometheus
   ```

### Alerts Not Firing

**Symptoms:**
- Conditions met but no alerts in Alertmanager
- Alerts not reaching notification channels

**Solutions:**

1. Check alert rules are loaded:
   ```bash
   curl http://localhost:9090/api/v1/rules
   ```

2. Verify Alertmanager configuration:
   ```bash
   curl http://localhost:9093/api/v1/status
   ```

3. Test alert manually:
   ```bash
   curl -X POST http://localhost:9093/api/v1/alerts -d '[{
     "labels": {"alertname": "Test"},
     "annotations": {"summary": "Test"}
   }]'
   ```

### Grafana Dashboard Empty

**Symptoms:**
- Grafana shows no data
- "No data" message in panels

**Solutions:**

1. Verify Prometheus data source:
   - Grafana → Configuration → Data Sources
   - Test connection

2. Check Prometheus has data:
   ```bash
   curl 'http://localhost:9090/api/v1/query?query=up'
   ```

3. Verify time range in dashboard

### Sentry Not Capturing Errors

**Symptoms:**
- No errors appearing in Sentry
- Test errors not showing up

**Solutions:**

1. Verify DSN is configured:
   ```bash
   docker compose exec api printenv | grep SENTRY
   ```

2. Check API logs:
   ```bash
   docker compose logs api | grep -i sentry
   ```

3. Test Sentry connection:
   ```bash
   curl -X POST https://sentry.io/api/YOUR_PROJECT_ID/store/ \
     -H "X-Sentry-Auth: Sentry sentry_key=YOUR_KEY" \
     -d '{"message":"test"}'
   ```

### PagerDuty Not Receiving Alerts

**Symptoms:**
- Alerts firing but no PagerDuty notifications
- PagerDuty shows no incidents

**Solutions:**

1. Verify integration key:
   ```bash
   docker compose exec alertmanager cat /etc/alertmanager/alertmanager.yml
   ```

2. Test PagerDuty API:
   ```bash
   curl -X POST https://events.pagerduty.com/v2/enqueue \
     -H 'Content-Type: application/json' \
     -d '{"routing_key":"YOUR_KEY","event_action":"trigger","payload":{"summary":"test"}}'
   ```

3. Check Alertmanager logs:
   ```bash
   docker compose logs alertmanager | grep -i pagerduty
   ```

---

## Production Checklist

Before going live, verify:

### Configuration
- [ ] All environment variables configured
- [ ] Sentry DSN set and tested
- [ ] PagerDuty integration keys configured
- [ ] Slack webhook URL configured
- [ ] Email SMTP credentials configured

### Services
- [ ] All monitoring containers running
- [ ] Prometheus scraping all targets
- [ ] Alertmanager connected to Prometheus
- [ ] Grafana showing metrics

### Alerts
- [ ] Alert rules loaded in Prometheus
- [ ] Test alerts reaching all channels
- [ ] On-call schedule configured
- [ ] Escalation policies set

### Health Checks
- [ ] API health endpoint responding
- [ ] Database health check working
- [ ] Cache health check working
- [ ] Blockchain health check working

### Dashboards
- [ ] Grafana dashboards imported
- [ ] Custom Internet-ID dashboard created
- [ ] Dashboard panels showing data

### Documentation
- [ ] Runbook reviewed by team
- [ ] On-call procedures documented
- [ ] Escalation contacts updated
- [ ] Team trained on alerts

---

## Next Steps

1. **Set Up External Monitoring**
   - Configure UptimeRobot or similar service
   - Monitor public endpoints

2. **Create Custom Dashboards**
   - Build business metrics dashboards
   - Add SLI/SLO tracking

3. **Tune Alert Thresholds**
   - Monitor for false positives
   - Adjust thresholds as needed

4. **Implement Log Analysis**
   - Set up ELK or similar for log aggregation
   - Create log-based alerts

5. **Schedule Post-Mortems**
   - Review incidents monthly
   - Update runbooks based on learnings

---

## Additional Resources

- [Alerting Runbook](./ALERTING_RUNBOOK.md) - Incident response procedures
- [Observability Guide](../OBSERVABILITY.md) - Logging and metrics details
- [Deployment Playbook](./DEPLOYMENT_PLAYBOOK.md) - Deployment procedures
- [Prometheus Documentation](https://prometheus.io/docs/)
- [Grafana Documentation](https://grafana.com/docs/)
- [Sentry Documentation](https://docs.sentry.io/)
- [PagerDuty Documentation](https://support.pagerduty.com/)

---

**Document Version:** 1.0  
**Last Updated:** 2025-10-31  
**Maintained By:** Operations Team
