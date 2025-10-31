import * as Sentry from "@sentry/node";
import { ProfilingIntegration } from "@sentry/profiling-node";
import { logger } from "./logger.service";

/**
 * Sentry error tracking service
 * Provides centralized error tracking and performance monitoring
 */

class SentryService {
  private initialized = false;

  /**
   * Initialize Sentry with configuration
   */
  initialize(): void {
    const dsn = process.env.SENTRY_DSN;
    
    // Don't initialize if DSN is not configured
    if (!dsn) {
      logger.info("Sentry DSN not configured, error tracking disabled");
      return;
    }

    try {
      Sentry.init({
        dsn,
        environment: process.env.NODE_ENV || "development",
        
        // Performance monitoring
        tracesSampleRate: parseFloat(process.env.SENTRY_TRACES_SAMPLE_RATE || "0.1"),
        
        // Profiling (optional)
        profilesSampleRate: parseFloat(process.env.SENTRY_PROFILES_SAMPLE_RATE || "0.1"),
        integrations: [
          new ProfilingIntegration(),
        ],
        
        // Release tracking
        release: process.env.SENTRY_RELEASE || process.env.npm_package_version,
        
        // Additional configuration
        serverName: process.env.HOSTNAME || "internet-id-api",
        
        // Filter out sensitive data
        beforeSend(event) {
          // Remove sensitive headers
          if (event.request?.headers) {
            delete event.request.headers["authorization"];
            delete event.request.headers["x-api-key"];
            delete event.request.headers["cookie"];
          }
          
          // Remove sensitive query parameters
          if (event.request?.query_string) {
            const sensitiveParams = ["token", "key", "secret", "password", "apikey", "api_key"];
            let queryString = event.request.query_string;
            
            // Parse and filter query string
            sensitiveParams.forEach(param => {
              // Match param=value or param=value& patterns (case insensitive)
              const regex = new RegExp(`(${param}=[^&]*)`, "gi");
              queryString = queryString.replace(regex, `${param}=[FILTERED]`);
            });
            
            event.request.query_string = queryString;
          }
          
          return event;
        },
        
        // Ignore certain errors
        ignoreErrors: [
          // Browser errors
          "ResizeObserver loop limit exceeded",
          "Non-Error promise rejection captured",
          // Network errors
          "NetworkError",
          "Failed to fetch",
          // Common user errors
          "401",
          "403",
        ],
      });

      this.initialized = true;
      logger.info("Sentry error tracking initialized", {
        environment: process.env.NODE_ENV,
        release: process.env.SENTRY_RELEASE,
      });
    } catch (error) {
      logger.error("Failed to initialize Sentry", error);
    }
  }

  /**
   * Check if Sentry is initialized
   */
  isInitialized(): boolean {
    return this.initialized;
  }

  /**
   * Capture an exception
   */
  captureException(error: Error, context?: Record<string, any>): string | undefined {
    if (!this.initialized) {
      return undefined;
    }

    try {
      return Sentry.captureException(error, {
        extra: context,
      });
    } catch (err) {
      logger.error("Failed to capture exception in Sentry", err);
      return undefined;
    }
  }

  /**
   * Capture a message
   */
  captureMessage(
    message: string,
    level: Sentry.SeverityLevel = "info",
    context?: Record<string, any>
  ): string | undefined {
    if (!this.initialized) {
      return undefined;
    }

    try {
      return Sentry.captureMessage(message, {
        level,
        extra: context,
      });
    } catch (err) {
      logger.error("Failed to capture message in Sentry", err);
      return undefined;
    }
  }

  /**
   * Set user context
   */
  setUser(user: { id: string; email?: string; username?: string }): void {
    if (!this.initialized) {
      return;
    }

    try {
      Sentry.setUser(user);
    } catch (err) {
      logger.error("Failed to set user in Sentry", err);
    }
  }

  /**
   * Clear user context
   */
  clearUser(): void {
    if (!this.initialized) {
      return;
    }

    try {
      Sentry.setUser(null);
    } catch (err) {
      logger.error("Failed to clear user in Sentry", err);
    }
  }

  /**
   * Set custom tags
   */
  setTag(key: string, value: string): void {
    if (!this.initialized) {
      return;
    }

    try {
      Sentry.setTag(key, value);
    } catch (err) {
      logger.error("Failed to set tag in Sentry", err);
    }
  }

  /**
   * Set custom context
   */
  setContext(name: string, context: Record<string, any>): void {
    if (!this.initialized) {
      return;
    }

    try {
      Sentry.setContext(name, context);
    } catch (err) {
      logger.error("Failed to set context in Sentry", err);
    }
  }

  /**
   * Add breadcrumb
   */
  addBreadcrumb(breadcrumb: {
    message: string;
    category?: string;
    level?: Sentry.SeverityLevel;
    data?: Record<string, any>;
  }): void {
    if (!this.initialized) {
      return;
    }

    try {
      Sentry.addBreadcrumb(breadcrumb);
    } catch (err) {
      logger.error("Failed to add breadcrumb in Sentry", err);
    }
  }

  /**
   * Flush pending events (useful for serverless environments)
   */
  async flush(timeout = 2000): Promise<boolean> {
    if (!this.initialized) {
      return true;
    }

    try {
      return await Sentry.flush(timeout);
    } catch (err) {
      logger.error("Failed to flush Sentry events", err);
      return false;
    }
  }

  /**
   * Get Sentry request handler middleware (Express)
   */
  getRequestHandler(): ReturnType<typeof Sentry.Handlers.requestHandler> {
    if (!this.initialized) {
      return ((_req, _res, next) => next()) as ReturnType<typeof Sentry.Handlers.requestHandler>;
    }
    return Sentry.Handlers.requestHandler();
  }

  /**
   * Get Sentry tracing handler middleware (Express)
   */
  getTracingHandler(): ReturnType<typeof Sentry.Handlers.tracingHandler> {
    if (!this.initialized) {
      return ((_req, _res, next) => next()) as ReturnType<typeof Sentry.Handlers.tracingHandler>;
    }
    return Sentry.Handlers.tracingHandler();
  }

  /**
   * Get Sentry error handler middleware (Express)
   */
  getErrorHandler(): ReturnType<typeof Sentry.Handlers.errorHandler> {
    if (!this.initialized) {
      return ((_err, _req, _res, next) => next(_err)) as ReturnType<typeof Sentry.Handlers.errorHandler>;
    }
    return Sentry.Handlers.errorHandler({
      shouldHandleError() {
        // Capture all errors
        return true;
      },
    });
  }
}

// Export singleton instance
export const sentryService = new SentryService();
