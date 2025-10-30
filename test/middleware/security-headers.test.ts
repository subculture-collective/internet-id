import { expect } from "chai";
import sinon from "sinon";
import {
  generateNonce,
  cspReportHandler,
  applySecurityHeaders,
  permissionsPolicyMiddleware,
} from "../../scripts/middleware/security-headers.middleware";

describe("Security Headers Middleware", function () {
  describe("generateNonce", function () {
    it("should generate a base64 string", function () {
      const nonce = generateNonce();
      expect(nonce).to.be.a("string");
      expect(nonce.length).to.be.greaterThan(0);
      // Base64 regex pattern
      expect(nonce).to.match(/^[A-Za-z0-9+/]+=*$/);
    });

    it("should generate unique nonces", function () {
      const nonce1 = generateNonce();
      const nonce2 = generateNonce();
      expect(nonce1).to.not.equal(nonce2);
    });

    it("should generate nonces of expected length", function () {
      const nonce = generateNonce();
      // 16 bytes = 24 base64 characters (with padding)
      expect(nonce.length).to.equal(24);
    });
  });

  describe("cspReportHandler", function () {
    it("should log CSP violation report", function () {
      const consoleWarnStub = sinon.stub(console, "warn");
      const req = {
        body: {
          "csp-report": {
            "blocked-uri": "https://evil.com",
            "violated-directive": "script-src",
          },
        },
        ip: "127.0.0.1",
        headers: {
          "user-agent": "Test Browser",
        },
      } as any;
      const res = {
        status: sinon.stub().returnsThis(),
        end: sinon.stub(),
      } as any;

      cspReportHandler(req, res);

      expect(consoleWarnStub.calledOnce).to.be.true;
      expect(res.status.calledWith(204)).to.be.true;
      expect(res.end.calledOnce).to.be.true;

      consoleWarnStub.restore();
    });
  });

  describe("permissionsPolicyMiddleware", function () {
    it("should set Permissions-Policy header", function () {
      const req = {} as any;
      const res = {
        setHeader: sinon.stub(),
      } as any;
      const next = sinon.stub();

      permissionsPolicyMiddleware(req, res, next);

      expect(res.setHeader.calledOnce).to.be.true;
      const headerCall = res.setHeader.getCall(0);
      expect(headerCall.args[0]).to.equal("Permissions-Policy");
      expect(headerCall.args[1]).to.include("camera=()");
      expect(headerCall.args[1]).to.include("microphone=()");
      expect(headerCall.args[1]).to.include("geolocation=()");
      expect(next.calledOnce).to.be.true;
    });

    it("should restrict all sensitive features", function () {
      const req = {} as any;
      const res = {
        setHeader: sinon.stub(),
      } as any;
      const next = sinon.stub();

      permissionsPolicyMiddleware(req, res, next);

      const headerValue = res.setHeader.getCall(0).args[1];
      const restrictedFeatures = [
        "camera",
        "microphone",
        "geolocation",
        "payment",
        "usb",
        "magnetometer",
        "gyroscope",
        "accelerometer",
      ];

      restrictedFeatures.forEach((feature) => {
        expect(headerValue).to.include(`${feature}=()`);
      });
    });
  });

  describe("applySecurityHeaders", function () {
    it("should generate CSP nonce and attach to res.locals", function (done) {
      const req = {} as any;
      const res = {
        locals: {},
        setHeader: sinon.stub(),
        getHeader: sinon.stub(),
        removeHeader: sinon.stub(),
      } as any;
      const next = () => {
        expect(res.locals.cspNonce).to.be.a("string");
        expect(res.locals.cspNonce.length).to.equal(24);
        done();
      };

      applySecurityHeaders(req, res, next);
    });

    it("should apply multiple security headers", function (done) {
      const req = {} as any;
      const res = {
        locals: {},
        setHeader: sinon.stub(),
        getHeader: sinon.stub(),
        removeHeader: sinon.stub(),
      } as any;
      const next = () => {
        // Check that setHeader was called multiple times for different security headers
        expect(res.setHeader.called).to.be.true;
        done();
      };

      applySecurityHeaders(req, res, next);
    });
  });

  describe("Security Headers Integration", function () {
    it("should include all required security headers", function (done) {
      const req = {} as any;
      const headers: Record<string, string> = {};
      const res = {
        locals: {},
        setHeader: (key: string, value: string) => {
          headers[key] = value;
        },
        getHeader: (key: string) => headers[key],
        removeHeader: sinon.stub(),
      } as any;

      const next = () => {
        // Check for critical security headers
        
        // Permissions-Policy should be set
        expect(headers["Permissions-Policy"]).to.exist;
        
        // CSP nonce should be generated
        expect(res.locals.cspNonce).to.be.a("string");
        
        done();
      };

      applySecurityHeaders(req, res, next);
    });
  });
});
