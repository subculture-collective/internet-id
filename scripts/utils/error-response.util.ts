import { Response } from "express";
import { logger } from "../services/logger.service";
import { sentryService } from "../services/sentry.service";

/**
 * Error response context for logging and tracking
 */
export interface ErrorContext {
  correlationId?: string;
  userId?: string;
  operation?: string;
  path?: string;
  method?: string;
  [key: string]: any;
}

/**
 * Sends a sanitized error response to the client
 * - In production: Returns generic error message
 * - In development: Returns detailed error message
 * - Always logs full error details server-side
 * - Always captures errors in Sentry
 *
 * @param res - Express response object
 * @param error - The error that occurred
 * @param statusCode - HTTP status code (default: 500)
 * @param context - Additional context for logging
 */
export function sendErrorResponse(
  res: Response,
  error: Error | unknown,
  statusCode = 500,
  context?: ErrorContext
): void {
  const errorObj = error instanceof Error ? error : new Error(String(error));
  const isProd = process.env.NODE_ENV === "production";

  // Prepare context for logging
  const logContext: ErrorContext = {
    ...context,
    statusCode,
    errorMessage: errorObj.message,
    errorStack: errorObj.stack,
  };

  // Log error server-side with full details
  logger.error("Error occurred", errorObj, logContext);

  // Capture in Sentry
  sentryService.captureException(errorObj, logContext);

  // Determine response message
  const clientMessage = isProd
    ? getGenericErrorMessage(statusCode)
    : errorObj.message;

  // Send response
  res.status(statusCode).json({
    error: clientMessage,
    correlationId: context?.correlationId,
  });
}

/**
 * Get a generic error message based on status code
 */
function getGenericErrorMessage(statusCode: number): string {
  switch (statusCode) {
    case 400:
      return "Bad request";
    case 401:
      return "Unauthorized";
    case 403:
      return "Forbidden";
    case 404:
      return "Not found";
    case 409:
      return "Conflict";
    case 422:
      return "Validation failed";
    case 429:
      return "Too many requests";
    case 500:
    default:
      return "Internal server error";
  }
}

/**
 * Sends a validation error response
 *
 * @param res - Express response object
 * @param errors - Validation errors
 * @param context - Additional context for logging
 */
export function sendValidationErrorResponse(
  res: Response,
  errors: Array<{ field: string; message: string }>,
  context?: ErrorContext
): void {
  logger.warn("Validation error", {
    ...context,
    errors,
  });

  res.status(400).json({
    error: "Validation failed",
    errors,
    correlationId: context?.correlationId,
  });
}
