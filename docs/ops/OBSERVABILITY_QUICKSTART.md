# Observability Quick Start Guide

This guide helps you set up monitoring and logging for Internet-ID in production.

## Prerequisites

- Internet-ID API server running
- Basic understanding of Prometheus and logging systems
- Access to deployment environment

## 5-Minute Setup (Local/Development)

### 1. Start the API Server

```bash
npm run start:api
```

### 2. Verify Observability Endpoints

```bash
# Health check
curl http://localhost:3001/api/health

# Metrics
curl http://localhost:3001/api/metrics

# Metrics (JSON format)
curl http://localhost:3001/api/metrics/json
```

### 3. View Logs

Logs are automatically printed to stdout with pretty formatting in development:

```bash
# View logs in real-time
npm run start:api

# Filter logs by level (in production)
npm run start:api | grep '"level":"error"'
```

### 4. Test Request Tracing

Make a request and observe the correlation ID in logs:

```bash
curl -X POST http://localhost:3001/api/upload \
  -H "x-api-key: supersecret" \
  -F "file=@test.txt"
```

Look for the `correlationId` in the log output - all logs for this request will share the same ID.

## Production Setup (30 Minutes)

### Option 1: Prometheus + Grafana Stack

#### 1. Install Prometheus

**Docker Compose:**

Create `docker-compose.monitoring.yml`:

```yaml
version: "3.8"

services:
  prometheus:
    image: prom/prometheus:latest
    ports:
      - "9090:9090"
    volumes:
      - ./prometheus.yml:/etc/prometheus/prometheus.yml
      - prometheus-data:/prometheus
    command:
      - "--config.file=/etc/prometheus/prometheus.yml"
      - "--storage.tsdb.path=/prometheus"

  grafana:
    image: grafana/grafana:latest
    ports:
      - "3000:3000"
    volumes:
      - grafana-data:/var/lib/grafana
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=admin
    depends_on:
      - prometheus

volumes:
  prometheus-data:
  grafana-data:
```

#### 2. Configure Prometheus

Create `prometheus.yml`:

```yaml
global:
  scrape_interval: 15s
  evaluation_interval: 15s

scrape_configs:
  - job_name: "internet-id-api"
    scrape_interval: 10s
    static_configs:
      - targets: ["host.docker.internal:3001"] # Use actual IP in production
    metrics_path: "/api/metrics"
```

#### 3. Start Monitoring Stack

```bash
docker-compose -f docker-compose.monitoring.yml up -d
```

#### 4. Access Dashboards

- **Prometheus**: http://localhost:9090
- **Grafana**: http://localhost:3000 (admin/admin)

#### 5. Configure Grafana

1. Add Prometheus data source:
   - URL: `http://prometheus:9090`
   - Click "Save & Test"

2. Create a new dashboard or import the template from `ops/monitoring/grafana-dashboard.json`

3. Key panels to add:
   - Request rate: `rate(http_requests_total[5m])`
   - P95 latency: `histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m]))`
   - Error rate: `rate(http_requests_total{status_code=~"5.."}[5m])`
   - Active connections: `active_connections`

### Option 2: Cloud Logging (Logtail/BetterStack)

#### 1. Sign up for Logtail

Visit https://betterstack.com/logs and create an account.

#### 2. Get Source Token

Create a new source and copy the source token.

#### 3. Install Logtail Transport

```bash
npm install @logtail/pino
```

#### 4. Configure Environment

Add to `.env`:

```bash
LOGTAIL_SOURCE_TOKEN=your_logtail_source_token
```

#### 5. Update Logger Configuration

Modify `scripts/services/logger.service.ts` to add Logtail transport:

```typescript
// Add after imports
const logtailToken = process.env.LOGTAIL_SOURCE_TOKEN;

const transport = isDevelopment
  ? {
      target: "pino-pretty",
      options: { colorize: true, translateTime: "HH:MM:ss Z" },
    }
  : logtailToken
    ? {
        target: "@logtail/pino",
        options: { sourceToken: logtailToken },
      }
    : undefined;
```

#### 6. Restart and Verify

Restart the API server and check Logtail dashboard for incoming logs.

### Option 3: Datadog Integration

#### 1. Get Datadog API Keys

Sign up at https://www.datadoghq.com/ and get your API key and App key.

#### 2. Configure Environment

Add to `.env`:

```bash
DATADOG_API_KEY=your_datadog_api_key
DATADOG_APP_KEY=your_datadog_app_key
DATADOG_SITE=datadoghq.com  # or datadoghq.eu
```

#### 3. Install Datadog Agent

**Docker:**

```yaml
services:
  datadog:
    image: gcr.io/datadoghq/agent:7
    environment:
      - DD_API_KEY=${DATADOG_API_KEY}
      - DD_SITE=${DATADOG_SITE}
      - DD_LOGS_ENABLED=true
      - DD_LOGS_CONFIG_CONTAINER_COLLECT_ALL=true
      - DD_AC_EXCLUDE="name:datadog-agent"
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock:ro
      - /proc/:/host/proc/:ro
      - /sys/fs/cgroup/:/host/sys/fs/cgroup:ro
```

#### 4. Configure Log Collection

The Datadog agent will automatically collect logs from stdout.

#### 5. Configure Metrics Collection

Add to `datadog.yaml` or configure via environment:

```yaml
prometheus_url: http://internet-id-api:3001/api/metrics
```

### Option 4: Self-Hosted ELK Stack

For a self-hosted solution, see the detailed ELK setup guide:
[ELK Stack Setup](./ELK_SETUP.md)

## Kubernetes Deployment

### 1. Add Health Checks

Update your deployment YAML:

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: internet-id-api
spec:
  template:
    spec:
      containers:
        - name: api
          image: internet-id-api:latest
          ports:
            - containerPort: 3001
          env:
            - name: LOG_LEVEL
              value: "info"
            - name: NODE_ENV
              value: "production"
          livenessProbe:
            httpGet:
              path: /api/health
              port: 3001
            initialDelaySeconds: 30
            periodSeconds: 10
            timeoutSeconds: 5
            failureThreshold: 3
          readinessProbe:
            httpGet:
              path: /api/health
              port: 3001
            initialDelaySeconds: 10
            periodSeconds: 5
            timeoutSeconds: 3
            failureThreshold: 3
```

### 2. Expose Metrics

Create a ServiceMonitor for Prometheus Operator:

```yaml
apiVersion: monitoring.coreos.com/v1
kind: ServiceMonitor
metadata:
  name: internet-id-api
  labels:
    app: internet-id-api
spec:
  selector:
    matchLabels:
      app: internet-id-api
  endpoints:
    - port: http
      path: /api/metrics
      interval: 30s
```

### 3. Configure Logging

Logs go to stdout and are automatically collected by your cluster logging system (Fluentd, Fluent Bit, etc.).

## Alerting Setup

### 1. Define Alert Rules

Create `prometheus/alerts.yml`:

```yaml
groups:
  - name: internet_id_api
    interval: 30s
    rules:
      # Service down
      - alert: APIDown
        expr: up{job="internet-id-api"} == 0
        for: 1m
        labels:
          severity: critical
        annotations:
          summary: "Internet-ID API is down"
          description: "API instance {{ $labels.instance }} is down"

      # High error rate
      - alert: HighErrorRate
        expr: |
          rate(http_requests_total{status_code=~"5.."}[5m]) > 0.05
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "High error rate detected"
          description: "Error rate is {{ $value | humanizePercentage }}"

      # High latency
      - alert: HighLatency
        expr: |
          histogram_quantile(0.95, 
            rate(http_request_duration_seconds_bucket[5m])
          ) > 5
        for: 10m
        labels:
          severity: warning
        annotations:
          summary: "High API latency"
          description: "P95 latency is {{ $value }}s"
```

### 2. Configure Alertmanager

Add to `prometheus.yml`:

```yaml
alerting:
  alertmanagers:
    - static_configs:
        - targets:
            - alertmanager:9093

rule_files:
  - "alerts.yml"
```

### 3. Configure Notifications

Create `alertmanager.yml`:

```yaml
global:
  resolve_timeout: 5m

route:
  group_by: ["alertname"]
  group_wait: 10s
  group_interval: 10s
  repeat_interval: 12h
  receiver: "email"

receivers:
  - name: "email"
    email_configs:
      - to: "ops@example.com"
        from: "alerts@example.com"
        smarthost: "smtp.gmail.com:587"
        auth_username: "alerts@example.com"
        auth_password: "your-app-password"
```

For Slack notifications:

```yaml
receivers:
  - name: "slack"
    slack_configs:
      - api_url: "https://hooks.slack.com/services/YOUR/WEBHOOK/URL"
        channel: "#alerts"
        title: "{{ .GroupLabels.alertname }}"
        text: "{{ .CommonAnnotations.description }}"
```

## Verification

### 1. Test Health Endpoint

```bash
curl http://your-api-host:3001/api/health
```

Expected response:

```json
{
  "status": "ok",
  "timestamp": "2025-10-31T03:17:28.870Z",
  "uptime": 3600.5,
  "services": {
    "database": { "status": "healthy" },
    "cache": { "status": "healthy", "enabled": true },
    "blockchain": { "status": "healthy", "blockNumber": 12345678 }
  }
}
```

### 2. Test Metrics Collection

```bash
curl http://your-api-host:3001/api/metrics | grep http_requests_total
```

Should show request counters.

### 3. Test Log Correlation

Make a request and grep for the correlation ID:

```bash
# Make request (note the response correlation ID if returned)
curl http://your-api-host:3001/api/health

# Or check logs directly
docker logs internet-id-api | grep correlationId | tail -5
```

### 4. Verify Prometheus Scraping

Visit http://your-prometheus:9090/targets and verify the `internet-id-api` target is UP.

### 5. Test Alerts

Trigger an alert by stopping the API:

```bash
docker stop internet-id-api
# Wait 1 minute
# Check Alertmanager UI at http://localhost:9093
```

## Troubleshooting

### Logs not appearing in external service

1. Check network connectivity
2. Verify API keys/tokens
3. Check log level (should be `info` or lower)
4. Look for errors in the API logs about transport failures

### Prometheus not scraping

1. Verify network connectivity from Prometheus to API
2. Check Prometheus logs for scrape errors
3. Verify `/api/metrics` endpoint is accessible
4. Check firewall rules

### High memory usage

1. Check metrics cardinality: `curl -s http://localhost:3001/api/metrics | grep -c '^[a-z]'`
2. If very high (>10k), reduce label combinations
3. Consider sampling for high-cardinality metrics

### Missing metrics

1. Verify the metric is being recorded in code
2. Check `/api/metrics/json` for the metric name
3. Verify Prometheus scrape interval and retention

## Next Steps

1. **Create Dashboards**: Build Grafana dashboards for your key metrics
2. **Set Up Alerts**: Define meaningful alerts with runbooks
3. **Configure Log Retention**: Set appropriate retention policies
4. **Document Runbooks**: Create incident response procedures
5. **Train Team**: Ensure team knows how to access logs and metrics

## Related Documentation

- [Full Observability Guide](../OBSERVABILITY.md)
- [Database Backup & Recovery](DATABASE_BACKUP_RECOVERY.md)
- [Disaster Recovery Runbook](DISASTER_RECOVERY_RUNBOOK.md)
- [Roadmap Issue #10](https://github.com/subculture-collective/internet-id/issues/10)
