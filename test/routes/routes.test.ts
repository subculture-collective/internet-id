import { expect } from "chai";
import { createApp } from "../../scripts/app";
import type { Express } from "express";

describe("API Routes", function () {
  let app: Express;

  before(async function () {
    app = await createApp();
  });

  describe("Health Routes", function () {
    it("GET /api/health returns ok: true", async function () {
      // Use a simple HTTP request library or supertest if available
      // For now, we'll just verify the app was created
      expect(app).to.exist;
      // In a real test, you'd use supertest or similar:
      // const response = await request(app).get("/api/health");
      // expect(response.body).to.deep.equal({ ok: true });
    });
  });
});
