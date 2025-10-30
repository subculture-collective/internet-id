/**
 * Integration tests for Badge API endpoints
 */

import { expect } from 'chai';
import request from 'supertest';
import { ethers } from 'ethers';
import { IntegrationTestEnvironment } from '../fixtures/helpers';
import { createTestFile } from '../fixtures/factories';

describe('Integration: Badge API Endpoints', function () {
  this.timeout(30000);

  let env: IntegrationTestEnvironment;
  let registryAddress: string;
  let creator: ethers.Wallet;
  let app: any;
  let testContentHash: string;

  before(async function () {
    env = new IntegrationTestEnvironment();
    await env.setup();

    creator = env.blockchain.getSigner(0) as ethers.Wallet;
    registryAddress = await env.blockchain.deployRegistry(creator);

    process.env.REGISTRY_ADDRESS = registryAddress;
    process.env.PRIVATE_KEY = creator.privateKey;

    app = env.server.getApp();

    // Create test content in database if available
    if (env.db.isDbAvailable()) {
      const prisma = env.db.getClient();
      const testFile = createTestFile('Badge test content');
      testContentHash = testFile.hash;

      await prisma.content.create({
        data: {
          contentHash: testContentHash,
          manifestUri: 'ipfs://QmBadgeTest123',
          creatorAddress: creator.address.toLowerCase(),
          registryAddress: registryAddress,
        },
      });
    }
  });

  after(async function () {
    await env.teardown();
  });

  afterEach(async function () {
    await env.cleanup();
  });

  describe('GET /api/badge/options', function () {
    it('should return available badge customization options', async function () {
      const response = await request(app).get('/api/badge/options').expect(200);

      expect(response.body).to.have.property('themes');
      expect(response.body).to.have.property('sizes');
      expect(response.body).to.have.property('styles');
      expect(response.body).to.have.property('customization');
      expect(response.body).to.have.property('examples');

      expect(response.body.themes).to.include('dark');
      expect(response.body.themes).to.include('light');
      expect(response.body.styles).to.include('rounded');
    });
  });

  describe('GET /api/badge/:hash/svg', function () {
    it('should generate SVG badge for valid hash', async function () {
      const hash = '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef';
      const response = await request(app).get(`/api/badge/${hash}/svg`).expect(200);

      expect(response.headers['content-type']).to.include('image/svg+xml');
      const body = response.text || response.body.toString();
      expect(body).to.include('<?xml');
      expect(body).to.include('<svg');
      expect(body).to.include('</svg>');
    });

    it('should include cache control headers', async function () {
      const hash = '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef';
      const response = await request(app).get(`/api/badge/${hash}/svg`).expect(200);

      expect(response.headers['cache-control']).to.include('public');
      expect(response.headers['cache-control']).to.include('max-age');
    });

    it('should accept theme query parameter', async function () {
      const hash = '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef';
      const response = await request(app)
        .get(`/api/badge/${hash}/svg?theme=light`)
        .expect(200);

      const body = response.text || response.body.toString();
      expect(body).to.include('fill="#ffffff"'); // light theme bg
    });

    it('should accept size query parameter', async function () {
      const hash = '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef';
      const response = await request(app).get(`/api/badge/${hash}/svg?size=large`).expect(200);

      const body = response.text || response.body.toString();
      expect(body).to.include('width="320"'); // large size
    });

    it('should accept style query parameter', async function () {
      const hash = '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef';
      const response = await request(app).get(`/api/badge/${hash}/svg?style=flat`).expect(200);

      const body = response.text || response.body.toString();
      expect(body).to.include('rx="0"'); // flat style has no border radius
    });

    it('should show verified status for registered content', async function () {
      if (!env.db.isDbAvailable() || !testContentHash) {
        this.skip();
      }

      const response = await request(app).get(`/api/badge/${testContentHash}/svg`).expect(200);

      const body = response.text || response.body.toString();
      expect(body).to.include('Verified');
      expect(body).to.include('✓');
    });
  });

  describe('GET /api/badge/:hash/embed', function () {
    it('should return embed codes', async function () {
      const hash = '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef';
      const response = await request(app).get(`/api/badge/${hash}/embed`).expect(200);

      expect(response.body).to.have.property('html');
      expect(response.body).to.have.property('markdown');
      expect(response.body).to.have.property('direct');
      expect(response.body).to.have.property('verify');
      expect(response.body).to.have.property('contentHash');
    });

    it('should include badge URL in html embed code', async function () {
      const hash = '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef';
      const response = await request(app).get(`/api/badge/${hash}/embed`).expect(200);

      expect(response.body.html).to.include('<a href=');
      expect(response.body.html).to.include('<img src=');
      expect(response.body.html).to.include('/api/badge/');
      expect(response.body.html).to.include('/verify');
    });

    it('should include badge URL in markdown embed code', async function () {
      const hash = '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef';
      const response = await request(app).get(`/api/badge/${hash}/embed`).expect(200);

      expect(response.body.markdown).to.include('[![');
      expect(response.body.markdown).to.include('](');
      expect(response.body.markdown).to.include('/api/badge/');
    });

    it('should respect theme parameter in embed URLs', async function () {
      const hash = '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef';
      const response = await request(app)
        .get(`/api/badge/${hash}/embed?theme=blue`)
        .expect(200);

      expect(response.body.direct).to.include('theme=blue');
    });
  });

  describe('GET /api/badge/:hash/status', function () {
    it('should return verification status', async function () {
      const hash = '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef';
      const response = await request(app).get(`/api/badge/${hash}/status`).expect(200);

      expect(response.body).to.have.property('contentHash');
      expect(response.body).to.have.property('verified');
      expect(response.body.contentHash).to.equal(hash);
    });

    it('should return verified=false for unregistered content', async function () {
      const hash = '0xdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeef';
      const response = await request(app).get(`/api/badge/${hash}/status`).expect(200);

      expect(response.body.verified).to.be.false;
    });

    it('should return verified=true for registered content', async function () {
      if (!env.db.isDbAvailable() || !testContentHash) {
        this.skip();
      }

      const response = await request(app).get(`/api/badge/${testContentHash}/status`).expect(200);

      expect(response.body.verified).to.be.true;
      expect(response.body).to.have.property('timestamp');
      expect(response.body).to.have.property('creator');
    });
  });

  describe('GET /api/badge/:hash/png', function () {
    it('should redirect to SVG endpoint', async function () {
      const hash = '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef';
      const response = await request(app).get(`/api/badge/${hash}/png`).expect(302);

      expect(response.headers.location).to.include('/svg');
    });
  });
});
