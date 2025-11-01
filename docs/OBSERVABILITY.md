# Observability and Monitoring

This document describes the observability stack for Internet-ID, including structured logging, metrics collection, and monitoring setup.

## Overview

Internet-ID implements a comprehensive observability baseline to support incident response, performance monitoring, and system health tracking:

- **Structured Logging**: JSON-formatted logs with correlation IDs using [Pino](https://github.com/pinojs/pino)
- **Metrics Export**: Prometheus-compatible metrics using [prom-client](https://github.com/sifive/prom-client)
- **Health Checks**: Detailed service health endpoints
- **Request Tracing**: Automatic correlation ID generation for request tracking

## Quick Start

### Local Development

1. **Start the API server:**

   ```bash
   npm run start:api
   ```

2. **Access observability endpoints:**
   - Health check: http://localhost:3001/api/health
   - Prometheus metrics: http://localhost:3001/api/metrics
   - Metrics (JSON): http://localhost:3001/api/metrics/json

3. **View logs:**
   Logs are automatically printed to stdout with pretty formatting in development mode.

## Structured Logging

### Overview

The logging service uses [Pino](https://github.com/pinojs/pino), a high-performance JSON logger for Node.js. All logs include:

- **Timestamp**: ISO 8601 format
- **Log level**: trace, debug, info, warn, error, fatal
- **Service name**: `internet-id-api`
- **Environment**: development, production, etc.
- **Correlation ID**: Unique ID per request for tracing
- **Context**: Additional structured data

### Configuration

Configure logging via environment variables in `.env`:

```bash
# Log level (trace, debug, info, warn, error, fatal)
# Default: info
LOG_LEVEL=info

# Application environment
NODE_ENV=production
```

### Log Levels

- **trace**: Very verbose debugging (e.g., function entry/exit)
- **debug**: Detailed debugging information
- **info**: General informational messages (default)
- **warn**: Warning messages that don't prevent operation
- **error**: Error messages for handled exceptions
- **fatal**: Critical errors that cause service termination

### Usage in Code

```typescript
import { logger } from "./services/logger.service";

// Simple log message
logger.info("User registered successfully");

// Log with context
logger.info("File uploaded", {
  userId: "123",
  filename: "video.mp4",
  size: 1024000,
});

// Log errors
try {
  // ... some operation
} catch (error) {
  logger.error("Failed to process file", error, {
    userId: "123",
    operation: "upload",
  });
}

// Create child logger with persistent context
const childLogger = logger.child({
  module: "verification",
  userId: "123",
});
childLogger.info("Starting verification");
```

### Request Correlation

Every HTTP request automatically gets a correlation ID that appears in all logs for that request:

```json
{
  "level": "info",
  "time": "2025-10-31T03:17:28.870Z",
  "correlationId": "a1b2c3d4-e5f6-7890-1234-567890abcdef",
  "msg": "Incoming request",
  "method": "POST",
  "url": "/api/register",
  "userAgent": "Mozilla/5.0...",
  "ip": "192.168.1.1"
}
```

Access the correlation ID in request handlers:

```typescript
app.post("/api/example", (req, res) => {
  const correlationId = req.correlationId;
  req.log.info("Processing request"); // Uses request-specific logger
  // ...
});
```

### Sensitive Data Redaction

The logger automatically redacts sensitive fields from logs:

- `*.password`
- `*.secret`
- `*.token`
- `*.apiKey`
- `*.privateKey`
- `req.headers.authorization`
- `req.headers['x-api-key']`

These fields are completely removed from log output.

## Metrics

### Overview

Metrics are exposed in Prometheus format at `/api/metrics` for scraping by monitoring systems. The service tracks:

- HTTP request latency and counts
- Active connections
- Cache performance (hits/misses)
- Verification outcomes
- IPFS upload performance
- Database query performance

### Available Metrics

#### HTTP Metrics

```
# Request duration histogram (seconds)
http_request_duration_seconds{method="POST",route="/api/register",status_code="200"}

# Request count
http_requests_total{method="POST",route="/api/register",status_code="200"}

# Active connections
active_connections
```

#### Application Metrics

```
# Verification outcomes
verification_total{outcome="success",platform="youtube"}
verification_duration_seconds{outcome="success",platform="youtube"}

# IPFS uploads
ipfs_uploads_total{provider="pinata",status="success"}
ipfs_upload_duration_seconds{provider="pinata"}

# Cache performance
cache_hits_total{cache_type="redis"}
cache_misses_total{cache_type="redis"}

# Database queries
db_query_duration_seconds{operation="findMany",table="Content"}
```

#### Default Metrics

Node.js process metrics are automatically collected:

- `process_cpu_user_seconds_total`
- `process_cpu_system_seconds_total`
- `process_resident_memory_bytes`
- `process_heap_bytes`
- `nodejs_eventloop_lag_seconds`
- `nodejs_gc_duration_seconds`
- And more...

### Accessing Metrics

**Prometheus format (for scraping):**

```bash
curl http://localhost:3001/api/metrics
```

**JSON format (for debugging):**

```bash
curl http://localhost:3001/api/metrics/json
```

### Prometheus Configuration

To scrape metrics with Prometheus, add this job to your `prometheus.yml`:

```yaml
scrape_configs:
  - job_name: "internet-id-api"
    scrape_interval: 15s
    static_configs:
      - targets: ["localhost:3001"]
    metrics_path: "/api/metrics"
```

For production deployments with multiple instances, use service discovery:

```yaml
scrape_configs:
  - job_name: "internet-id-api"
    scrape_interval: 15s
    kubernetes_sd_configs:
      - role: pod
    relabel_configs:
      - source_labels: [__meta_kubernetes_pod_label_app]
        action: keep
        regex: internet-id-api
```

## Health Checks

### Endpoint

`GET /api/health`

Returns detailed health status of all service components:

```json
{
  "status": "ok",
  "timestamp": "2025-10-31T03:17:28.870Z",
  "uptime": 3600.5,
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

### Status Codes

- **200 OK**: All services healthy
- **503 Service Unavailable**: One or more services unhealthy or degraded

### Service Status Values

- **healthy**: Service operating normally
- **degraded**: Service operational but with issues (e.g., cache unavailable)
- **unhealthy**: Service not operational
- **disabled**: Service intentionally disabled

### Using Health Checks

**Kubernetes liveness probe:**

```yaml
livenessProbe:
  httpGet:
    path: /api/health
    port: 3001
  initialDelaySeconds: 30
  periodSeconds: 10
```

**Docker healthcheck:**

```dockerfile
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s \
  CMD curl -f http://localhost:3001/api/health || exit 1
```

## Log Shipping

### Production Log Destinations

For production deployments, ship logs to a centralized logging service. Configuration examples:

### Logtail (BetterStack)

```bash
# .env
LOGTAIL_SOURCE_TOKEN=your_logtail_source_token
```

To integrate Logtail, install the transport:

```bash
npm install @logtail/pino
```

Update `logger.service.ts` to add Logtail transport when token is present.

### Datadog

```bash
# .env
DATADOG_API_KEY=your_datadog_api_key
DATADOG_APP_KEY=your_datadog_app_key
DATADOG_SITE=datadoghq.com  # or datadoghq.eu for EU
```

To integrate Datadog, install the transport:

```bash
npm install pino-datadog
```

### ELK Stack (Elasticsearch)

```bash
# .env
ELASTICSEARCH_URL=https://your-elasticsearch-host:9200
ELASTICSEARCH_USERNAME=your_username
ELASTICSEARCH_PASSWORD=your_password
ELASTICSEARCH_INDEX=internet-id-logs
```

To integrate Elasticsearch, use Filebeat or Logstash to collect logs from stdout/files.

### File-based Logging

For file-based logging with rotation:

```bash
npm install pino-roll
```

Or use OS-level log rotation with rsyslog/logrotate.

### Docker/Kubernetes Logging

When running in containers, simply log to stdout (default). Container orchestration platforms automatically collect logs:

**Docker Compose:**

```yaml
services:
  api:
    image: internet-id-api
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"
```

**Kubernetes:**
Logs are automatically collected by the cluster logging system (Fluentd, Fluent Bit, etc.).

## Monitoring Dashboards

### Prometheus + Grafana

1. **Set up Prometheus** to scrape metrics (see configuration above)

2. **Install Grafana** and add Prometheus as a data source

3. **Import dashboard template:**

Create a dashboard with these panels:

**Request Rate & Latency:**

```promql
# Request rate
rate(http_requests_total[5m])

# P95 latency
histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m]))

# Error rate
rate(http_requests_total{status_code=~"5.."}[5m])
```

**Application Metrics:**

```promql
# Cache hit rate
rate(cache_hits_total[5m]) / (rate(cache_hits_total[5m]) + rate(cache_misses_total[5m]))

# Verification success rate
rate(verification_total{outcome="success"}[5m]) / rate(verification_total[5m])

# Active connections
active_connections
```

**System Metrics:**

```promql
# CPU usage
rate(process_cpu_user_seconds_total[5m])

# Memory usage
process_resident_memory_bytes

# Event loop lag
rate(nodejs_eventloop_lag_seconds[5m])
```

### Example Grafana Dashboard JSON

See `ops/monitoring/grafana-dashboard.json` (to be created) for a complete dashboard template.

## Alerting

### Prometheus Alerting Rules

Example alert rules for `prometheus/alerts.yml`:

```yaml
groups:
  - name: internet_id_api
    interval: 30s
    rules:
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

      # Service unavailable
      - alert: ServiceDown
        expr: up{job="internet-id-api"} == 0
        for: 1m
        labels:
          severity: critical
        annotations:
          summary: "Internet-ID API is down"

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

      # Low cache hit rate
      - alert: LowCacheHitRate
        expr: |
          rate(cache_hits_total[5m]) / 
          (rate(cache_hits_total[5m]) + rate(cache_misses_total[5m])) < 0.5
        for: 15m
        labels:
          severity: info
        annotations:
          summary: "Cache hit rate is low"
          description: "Hit rate: {{ $value | humanizePercentage }}"
```

## Best Practices

### Logging Best Practices

1. **Use structured logging**: Always log with context objects, not string concatenation

   ```typescript
   // Good
   logger.info("User registered", { userId, email });

   // Bad
   logger.info(`User ${userId} registered with email ${email}`);
   ```

2. **Choose appropriate log levels**: Don't log everything at `info` level

3. **Include correlation IDs**: Use the request logger (`req.log`) to maintain correlation

4. **Don't log sensitive data**: Even with redaction, be careful with PII and secrets

5. **Add context, not just messages**: Logs should be queryable and filterable

### Metrics Best Practices

1. **Use labels wisely**: Don't use unbounded values (like user IDs) as labels

2. **Keep cardinality low**: Limit the number of unique label combinations

3. **Prefer histograms over summaries**: Histograms are aggregatable across instances

4. **Use seconds for durations**: Prometheus convention

5. **Name metrics clearly**: Follow Prometheus naming conventions
   - `_total` suffix for counters
   - `_seconds` suffix for durations
   - `_bytes` suffix for sizes

### Monitoring Best Practices

1. **Monitor the golden signals**: Latency, Traffic, Errors, Saturation (Google SRE)

2. **Set meaningful alerts**: Avoid alert fatigue with actionable alerts only

3. **Document your alerts**: Include runbooks for each alert

4. **Test your alerts**: Verify alerts fire under expected conditions

5. **Monitor business metrics**: Track verification rates, registrations, etc.

## Troubleshooting

### Logs not appearing

**Check log level:**

```bash
echo $LOG_LEVEL  # Should be info or lower
```

**Check NODE_ENV:**

```bash
echo $NODE_ENV  # Pretty logs only in development
```

**Enable debug logging temporarily:**

```bash
LOG_LEVEL=debug npm run start:api
```

### Metrics not available

**Verify endpoint responds:**

```bash
curl http://localhost:3001/api/metrics
```

**Check Prometheus scrape status:**
Visit http://localhost:9090/targets in Prometheus UI

**View metrics in JSON for debugging:**

```bash
curl http://localhost:3001/api/metrics/json | jq
```

### High memory usage

Check for metrics cardinality explosion:

```bash
# Count unique metric series
curl -s http://localhost:3001/api/metrics | grep -c '^[a-z]'
```

If this number is very high (>10,000), you may have too many label combinations.

### Performance impact

**Logging**: Pino is extremely fast (minimal overhead)

- Use async logging in production for even better performance
- Avoid logging in tight loops

**Metrics**: Minimal overhead for most metrics

- Histograms are more expensive than counters/gauges
- Keep label cardinality low

## Related Documentation

- [Database Backup & Recovery](ops/DATABASE_BACKUP_RECOVERY.md)
- [Disaster Recovery Runbook](ops/DISASTER_RECOVERY_RUNBOOK.md)
- [Ops Scripts](../ops/README.md)
- [Roadmap Issue #10 - Ops Bucket](https://github.com/subculture-collective/internet-id/issues/10)

## References

- [Pino Documentation](https://getpino.io/)
- [Prometheus Documentation](https://prometheus.io/docs/)
- [Grafana Documentation](https://grafana.com/docs/)
- [Google SRE Book - Monitoring](https://sre.google/sre-book/monitoring-distributed-systems/)
- [The Twelve-Factor App - Logs](https://12factor.net/logs)
