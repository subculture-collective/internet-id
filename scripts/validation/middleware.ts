import { Request, Response, NextFunction } from "express";
import { z, ZodError } from "zod";

/**
 * Validation Middleware
 * 
 * Provides middleware functions to validate request body, query parameters,
 * and URL parameters against Zod schemas. Returns 400 Bad Request with
 * detailed validation errors in a consistent JSON format.
 */

/**
 * Format Zod validation errors into a user-friendly structure
 */
function formatZodErrors(error: ZodError): { field: string; message: string }[] {
  return error.errors.map((err) => ({
    field: err.path.join("."),
    message: err.message,
  }));
}

/**
 * Middleware factory to validate request body
 * @param schema Zod schema to validate against
 * @returns Express middleware function
 */
export function validateBody<T>(schema: z.ZodSchema<T>) {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      const validated = schema.parse(req.body);
      req.body = validated;
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        res.status(400).json({
          error: "Validation failed",
          errors: formatZodErrors(error),
        });
      } else {
        res.status(500).json({
          error: "Internal validation error",
        });
      }
    }
  };
}

/**
 * Middleware factory to validate query parameters
 * @param schema Zod schema to validate against
 * @returns Express middleware function
 */
export function validateQuery<T>(schema: z.ZodSchema<T>) {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      const validated = schema.parse(req.query);
      req.query = validated as any;
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        res.status(400).json({
          error: "Validation failed",
          errors: formatZodErrors(error),
        });
      } else {
        res.status(500).json({
          error: "Internal validation error",
        });
      }
    }
  };
}

/**
 * Middleware factory to validate URL parameters
 * @param schema Zod schema to validate against
 * @returns Express middleware function
 */
export function validateParams<T>(schema: z.ZodSchema<T>) {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      const validated = schema.parse(req.params);
      req.params = validated as any;
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        res.status(400).json({
          error: "Validation failed",
          errors: formatZodErrors(error),
        });
      } else {
        res.status(500).json({
          error: "Internal validation error",
        });
      }
    }
  };
}

/**
 * Middleware to validate uploaded file
 * Checks file size and MIME type against allowed values
 */
export function validateFile(options?: {
  required?: boolean;
  maxSize?: number;
  allowedMimeTypes?: string[];
}) {
  const maxSize = options?.maxSize || 1024 * 1024 * 1024; // 1GB default
  const required = options?.required !== false; // default true
  const allowedMimeTypes = options?.allowedMimeTypes;

  return (req: Request, res: Response, next: NextFunction): void => {
    // Check if file is required
    if (required && !req.file) {
      return res.status(400).json({
        error: "Validation failed",
        errors: [
          {
            field: "file",
            message: "File is required (multipart/form-data field 'file')",
          },
        ],
      });
    }

    // If no file and not required, continue
    if (!req.file) {
      return next();
    }

    // Validate file size
    if (req.file.size > maxSize) {
      return res.status(400).json({
        error: "Validation failed",
        errors: [
          {
            field: "file",
            message: `File size exceeds maximum allowed size of ${Math.round(maxSize / 1024 / 1024)}MB`,
          },
        ],
      });
    }

    // Validate MIME type if specified
    if (allowedMimeTypes && !allowedMimeTypes.includes(req.file.mimetype)) {
      return res.status(400).json({
        error: "Validation failed",
        errors: [
          {
            field: "file",
            message: `File type '${req.file.mimetype}' is not allowed. Allowed types: ${allowedMimeTypes.join(", ")}`,
          },
        ],
      });
    }

    // Validate filename - prevent path traversal
    if (req.file.originalname) {
      const filename = req.file.originalname;
      if (
        filename.includes("..") ||
        filename.includes("/") ||
        filename.includes("\\")
      ) {
        return res.status(400).json({
          error: "Validation failed",
          errors: [
            {
              field: "file",
              message: "Invalid filename: path traversal detected",
            },
          ],
        });
      }
    }

    next();
  };
}
