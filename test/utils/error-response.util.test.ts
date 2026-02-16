import { expect } from "chai";
import { Request, Response } from "express";
import { sendErrorResponse, sendValidationErrorResponse } from "../../scripts/utils/error-response.util";
import { logger } from "../../scripts/services/logger.service";
import { sentryService } from "../../scripts/services/sentry.service";
import * as sinon from "sinon";

describe("Error Response Utilities", () => {
  let res: Partial<Response>;
  let statusStub: sinon.SinonStub;
  let jsonStub: sinon.SinonStub;
  let loggerStub: sinon.SinonStub;
  let sentryStub: sinon.SinonStub;
  let originalEnv: string | undefined;

  beforeEach(() => {
    // Store original NODE_ENV
    originalEnv = process.env.NODE_ENV;

    // Create response mock
    jsonStub = sinon.stub();
    statusStub = sinon.stub().returns({ json: jsonStub });
    res = {
      status: statusStub,
      json: jsonStub,
    };

    // Stub logger and sentry
    loggerStub = sinon.stub(logger, "error");
    sentryStub = sinon.stub(sentryService, "captureException");
  });

  afterEach(() => {
    // Restore NODE_ENV
    process.env.NODE_ENV = originalEnv;

    // Restore stubs
    loggerStub.restore();
    sentryStub.restore();
  });

  describe("sendErrorResponse", () => {
    it("should return generic message in production", () => {
      process.env.NODE_ENV = "production";
      const error = new Error("Internal database error with sensitive data");

      sendErrorResponse(res as Response, error, 500, {
        correlationId: "test-123",
        operation: "test-op",
      });

      expect(statusStub.calledWith(500)).to.be.true;
      expect(jsonStub.calledOnce).to.be.true;

      const response = jsonStub.firstCall.args[0];
      expect(response.error).to.equal("Internal server error");
      expect(response.correlationId).to.equal("test-123");
      expect(response.error).to.not.include("database");
      expect(response.error).to.not.include("sensitive");
    });

    it("should return detailed message in development", () => {
      process.env.NODE_ENV = "development";
      const error = new Error("Detailed error message");

      sendErrorResponse(res as Response, error, 500, {
        correlationId: "test-456",
      });

      expect(statusStub.calledWith(500)).to.be.true;
      expect(jsonStub.calledOnce).to.be.true;

      const response = jsonStub.firstCall.args[0];
      expect(response.error).to.equal("Detailed error message");
      expect(response.correlationId).to.equal("test-456");
    });

    it("should log full error details", () => {
      const error = new Error("Test error");
      const context = {
        correlationId: "test-789",
        operation: "test-operation",
        userId: "user-123",
      };

      sendErrorResponse(res as Response, error, 500, context);

      expect(loggerStub.calledOnce).to.be.true;
      expect(loggerStub.firstCall.args[0]).to.equal("Error occurred");
      expect(loggerStub.firstCall.args[1]).to.equal(error);

      const logContext = loggerStub.firstCall.args[2];
      expect(logContext.correlationId).to.equal("test-789");
      expect(logContext.operation).to.equal("test-operation");
      expect(logContext.userId).to.equal("user-123");
      expect(logContext.errorMessage).to.equal("Test error");
    });

    it("should capture error in Sentry", () => {
      const error = new Error("Test error");
      const context = {
        correlationId: "test-abc",
        operation: "test-op",
      };

      sendErrorResponse(res as Response, error, 500, context);

      expect(sentryStub.calledOnce).to.be.true;
      expect(sentryStub.firstCall.args[0]).to.equal(error);

      const sentryContext = sentryStub.firstCall.args[1];
      expect(sentryContext.correlationId).to.equal("test-abc");
      expect(sentryContext.operation).to.equal("test-op");
    });

    it("should handle non-Error objects", () => {
      const errorString = "String error";

      sendErrorResponse(res as Response, errorString, 500);

      expect(loggerStub.calledOnce).to.be.true;
      const loggedError = loggerStub.firstCall.args[1];
      expect(loggedError).to.be.instanceOf(Error);
      expect(loggedError.message).to.equal("String error");
    });

    it("should use correct generic message for 400 status", () => {
      process.env.NODE_ENV = "production";
      const error = new Error("Bad request details");

      sendErrorResponse(res as Response, error, 400);

      const response = jsonStub.firstCall.args[0];
      expect(response.error).to.equal("Bad request");
    });

    it("should use correct generic message for 401 status", () => {
      process.env.NODE_ENV = "production";
      const error = new Error("Auth failed");

      sendErrorResponse(res as Response, error, 401);

      const response = jsonStub.firstCall.args[0];
      expect(response.error).to.equal("Unauthorized");
    });

    it("should use correct generic message for 403 status", () => {
      process.env.NODE_ENV = "production";
      const error = new Error("Permission denied");

      sendErrorResponse(res as Response, error, 403);

      const response = jsonStub.firstCall.args[0];
      expect(response.error).to.equal("Forbidden");
    });

    it("should use correct generic message for 404 status", () => {
      process.env.NODE_ENV = "production";
      const error = new Error("Resource not found details");

      sendErrorResponse(res as Response, error, 404);

      const response = jsonStub.firstCall.args[0];
      expect(response.error).to.equal("Not found");
    });
  });

  describe("sendValidationErrorResponse", () => {
    let loggerWarnStub: sinon.SinonStub;

    beforeEach(() => {
      loggerWarnStub = sinon.stub(logger, "warn");
    });

    afterEach(() => {
      loggerWarnStub.restore();
    });

    it("should return validation errors with 400 status", () => {
      const errors = [
        { field: "email", message: "Invalid email format" },
        { field: "password", message: "Password too short" },
      ];

      sendValidationErrorResponse(res as Response, errors, {
        correlationId: "val-123",
      });

      expect(statusStub.calledWith(400)).to.be.true;
      expect(jsonStub.calledOnce).to.be.true;

      const response = jsonStub.firstCall.args[0];
      expect(response.error).to.equal("Validation failed");
      expect(response.errors).to.deep.equal(errors);
      expect(response.correlationId).to.equal("val-123");
    });

    it("should log validation errors as warnings", () => {
      const errors = [{ field: "name", message: "Name is required" }];

      sendValidationErrorResponse(res as Response, errors, {
        correlationId: "val-456",
        userId: "user-123",
      });

      expect(loggerWarnStub.calledOnce).to.be.true;
      expect(loggerWarnStub.firstCall.args[0]).to.equal("Validation error");

      const logContext = loggerWarnStub.firstCall.args[1];
      expect(logContext.correlationId).to.equal("val-456");
      expect(logContext.userId).to.equal("user-123");
      expect(logContext.errors).to.deep.equal(errors);
    });
  });
});
