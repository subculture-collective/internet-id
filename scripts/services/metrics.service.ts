import * as client from "prom-client";
import { logger } from "./logger.service";

/**
 * Metrics service for Prometheus/OpenTelemetry export
 * Tracks key application metrics like request latency, verification outcomes, etc.
 */

class MetricsService {
  private register: client.Registry;
  private httpRequestDuration: client.Histogram;
  private httpRequestTotal: client.Counter;
  private verificationTotal: client.Counter;
  private verificationDuration: client.Histogram;
  private ipfsUploadDuration: client.Histogram;
  private ipfsUploadTotal: client.Counter;
  private cacheHitTotal: client.Counter;
  private cacheMissTotal: client.Counter;
  private dbQueryDuration: client.Histogram;
  private activeConnections: client.Gauge;

  constructor() {
    // Create a new registry
    this.register = new client.Registry();

    // Add default metrics (CPU, memory, etc.)
    client.collectDefaultMetrics({ register: this.register });

    // HTTP request duration histogram
    this.httpRequestDuration = new client.Histogram({
      name: "http_request_duration_seconds",
      help: "Duration of HTTP requests in seconds",
      labelNames: ["method", "route", "status_code"],
      buckets: [0.001, 0.005, 0.01, 0.05, 0.1, 0.5, 1, 5, 10],
      registers: [this.register],
    });

    // HTTP request counter
    this.httpRequestTotal = new client.Counter({
      name: "http_requests_total",
      help: "Total number of HTTP requests",
      labelNames: ["method", "route", "status_code"],
      registers: [this.register],
    });

    // Verification outcome counter
    this.verificationTotal = new client.Counter({
      name: "verification_total",
      help: "Total number of verifications",
      labelNames: ["outcome", "platform"],
      registers: [this.register],
    });

    // Verification duration histogram
    this.verificationDuration = new client.Histogram({
      name: "verification_duration_seconds",
      help: "Duration of verification operations in seconds",
      labelNames: ["outcome", "platform"],
      buckets: [0.1, 0.5, 1, 2, 5, 10, 30],
      registers: [this.register],
    });

    // IPFS upload duration histogram
    this.ipfsUploadDuration = new client.Histogram({
      name: "ipfs_upload_duration_seconds",
      help: "Duration of IPFS uploads in seconds",
      labelNames: ["provider"],
      buckets: [1, 5, 10, 30, 60, 120, 300],
      registers: [this.register],
    });

    // IPFS upload counter
    this.ipfsUploadTotal = new client.Counter({
      name: "ipfs_uploads_total",
      help: "Total number of IPFS uploads",
      labelNames: ["provider", "status"],
      registers: [this.register],
    });

    // Cache hit counter
    this.cacheHitTotal = new client.Counter({
      name: "cache_hits_total",
      help: "Total number of cache hits",
      labelNames: ["cache_type"],
      registers: [this.register],
    });

    // Cache miss counter
    this.cacheMissTotal = new client.Counter({
      name: "cache_misses_total",
      help: "Total number of cache misses",
      labelNames: ["cache_type"],
      registers: [this.register],
    });

    // Database query duration histogram
    this.dbQueryDuration = new client.Histogram({
      name: "db_query_duration_seconds",
      help: "Duration of database queries in seconds",
      labelNames: ["operation", "table"],
      buckets: [0.001, 0.005, 0.01, 0.05, 0.1, 0.5, 1],
      registers: [this.register],
    });

    // Active connections gauge
    this.activeConnections = new client.Gauge({
      name: "active_connections",
      help: "Number of active connections",
      registers: [this.register],
    });

    logger.info("Metrics service initialized");
  }

  /**
   * Record HTTP request metrics
   */
  recordHttpRequest(
    method: string,
    route: string,
    statusCode: number,
    durationSeconds: number
  ): void {
    this.httpRequestDuration
      .labels(method, route, statusCode.toString())
      .observe(durationSeconds);
    this.httpRequestTotal
      .labels(method, route, statusCode.toString())
      .inc();
  }

  /**
   * Record verification outcome
   */
  recordVerification(
    outcome: "success" | "failure",
    platform: string,
    durationSeconds: number
  ): void {
    this.verificationTotal.labels(outcome, platform).inc();
    this.verificationDuration.labels(outcome, platform).observe(durationSeconds);
  }

  /**
   * Record IPFS upload
   */
  recordIpfsUpload(
    provider: string,
    status: "success" | "failure",
    durationSeconds: number
  ): void {
    this.ipfsUploadTotal.labels(provider, status).inc();
    this.ipfsUploadDuration.labels(provider).observe(durationSeconds);
  }

  /**
   * Record cache hit
   */
  recordCacheHit(cacheType: string): void {
    this.cacheHitTotal.labels(cacheType).inc();
  }

  /**
   * Record cache miss
   */
  recordCacheMiss(cacheType: string): void {
    this.cacheMissTotal.labels(cacheType).inc();
  }

  /**
   * Record database query duration
   */
  recordDbQuery(
    operation: string,
    table: string,
    durationSeconds: number
  ): void {
    this.dbQueryDuration.labels(operation, table).observe(durationSeconds);
  }

  /**
   * Increment active connections
   */
  incrementConnections(): void {
    this.activeConnections.inc();
  }

  /**
   * Decrement active connections
   */
  decrementConnections(): void {
    this.activeConnections.dec();
  }

  /**
   * Get metrics in Prometheus format
   */
  async getMetrics(): Promise<string> {
    return this.register.metrics();
  }

  /**
   * Get metrics as JSON
   */
  async getMetricsJson(): Promise<any[]> {
    return this.register.getMetricsAsJSON();
  }

  /**
   * Reset all metrics (useful for testing)
   */
  reset(): void {
    this.register.resetMetrics();
  }
}

// Export singleton instance
export const metricsService = new MetricsService();
