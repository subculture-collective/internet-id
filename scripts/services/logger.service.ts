import * as pino from "pino";
import { randomUUID } from "crypto";

/**
 * Centralized logging service with structured logging and correlation ID support
 * Uses Pino for high-performance JSON logging
 */

export interface LogContext {
  correlationId?: string;
  userId?: string;
  requestId?: string;
  [key: string]: any;
}

// Configure base logger with pretty-print in development
const isDevelopment = process.env.NODE_ENV !== "production";

// Log level from environment or default to 'info'
const logLevel = process.env.LOG_LEVEL || "info";

// Configure transport for pretty printing in development
const transport = isDevelopment
  ? {
      target: "pino-pretty",
      options: {
        colorize: true,
        translateTime: "HH:MM:ss Z",
        ignore: "pid,hostname",
      },
    }
  : undefined;

// Create base logger instance
const baseLogger = pino({
  level: logLevel,
  transport,
  base: {
    env: process.env.NODE_ENV || "development",
    service: "internet-id-api",
  },
  // Redact sensitive fields from logs
  redact: {
    paths: [
      "*.password",
      "*.secret",
      "*.token",
      "*.apiKey",
      "*.privateKey",
      "req.headers.authorization",
      "req.headers['x-api-key']",
    ],
    remove: true,
  },
});

/**
 * Logger service with context support
 */
class LoggerService {
  private logger: pino.Logger;

  constructor() {
    this.logger = baseLogger;
  }

  /**
   * Create a child logger with additional context
   */
  child(context: LogContext): pino.Logger {
    return this.logger.child(context);
  }

  /**
   * Generate a new correlation ID
   */
  generateCorrelationId(): string {
    return randomUUID();
  }

  /**
   * Log info message
   */
  info(msg: string, context?: LogContext): void {
    if (context) {
      this.logger.child(context).info(msg);
    } else {
      this.logger.info(msg);
    }
  }

  /**
   * Log error message
   */
  error(msg: string, error?: Error, context?: LogContext): void {
    const logContext = { ...context, error: error?.message, stack: error?.stack };
    this.logger.child(logContext).error(msg);
  }

  /**
   * Log warning message
   */
  warn(msg: string, context?: LogContext): void {
    if (context) {
      this.logger.child(context).warn(msg);
    } else {
      this.logger.warn(msg);
    }
  }

  /**
   * Log debug message
   */
  debug(msg: string, context?: LogContext): void {
    if (context) {
      this.logger.child(context).debug(msg);
    } else {
      this.logger.debug(msg);
    }
  }

  /**
   * Log trace message (very verbose)
   */
  trace(msg: string, context?: LogContext): void {
    if (context) {
      this.logger.child(context).trace(msg);
    } else {
      this.logger.trace(msg);
    }
  }

  /**
   * Get the underlying pino logger instance
   */
  getLogger(): pino.Logger {
    return this.logger;
  }
}

// Export singleton instance
export const logger = new LoggerService();

// Export express middleware for request logging
export function requestLoggerMiddleware() {
  return (req: any, res: any, next: any) => {
    const correlationId = logger.generateCorrelationId();
    const startTime = Date.now();

    // Attach correlation ID to request
    req.correlationId = correlationId;
    req.log = logger.child({ correlationId });

    // Log incoming request
    req.log.info({
      msg: "Incoming request",
      method: req.method,
      url: req.url,
      userAgent: req.headers["user-agent"],
      ip: req.ip || req.connection.remoteAddress,
    });

    // Capture response
    const originalSend = res.send;
    res.send = function (data: any) {
      res.send = originalSend;
      const duration = Date.now() - startTime;

      req.log.info({
        msg: "Request completed",
        method: req.method,
        url: req.url,
        statusCode: res.statusCode,
        duration,
      });

      return res.send(data);
    };

    next();
  };
}
