import { expect } from "chai";
import {
  cacheService,
  DEFAULT_TTL,
  getCachedContent,
  cacheContent,
  invalidateContent,
  getCachedManifest,
  cacheManifest,
  getCachedPlatformBinding,
  cachePlatformBinding,
  invalidatePlatformBinding,
} from "../../scripts/services/cache.service";

describe("Cache Service", () => {
  before(async () => {
    // Connect to cache (will skip if REDIS_URL not set)
    await cacheService.connect();
  });

  after(async () => {
    // Clean up
    await cacheService.disconnect();
  });

  beforeEach(async () => {
    // Reset metrics before each test
    cacheService.resetMetrics();
    
    // Only flush if cache is available
    if (cacheService.isAvailable()) {
      await cacheService.flushAll();
    }
  });

  describe("Basic Cache Operations", () => {
    it("should return null for cache miss", async () => {
      const result = await cacheService.get("non-existent-key");
      expect(result).to.be.null;
    });

    it("should set and get a value", async function() {
      if (!cacheService.isAvailable()) {
        this.skip();
      }

      const key = "test-key";
      const value = { foo: "bar", num: 42 };
      
      await cacheService.set(key, value, { ttl: 60 });
      const result = await cacheService.get(key);
      
      expect(result).to.deep.equal(value);
    });

    it("should delete a value", async function() {
      if (!cacheService.isAvailable()) {
        this.skip();
      }

      const key = "test-key-delete";
      const value = { test: true };
      
      await cacheService.set(key, value, { ttl: 60 });
      await cacheService.delete(key);
      const result = await cacheService.get(key);
      
      expect(result).to.be.null;
    });

    it("should delete keys matching a pattern", async function() {
      if (!cacheService.isAvailable()) {
        this.skip();
      }

      await cacheService.set("test:1", { id: 1 }, { ttl: 60 });
      await cacheService.set("test:2", { id: 2 }, { ttl: 60 });
      await cacheService.set("other:1", { id: 3 }, { ttl: 60 });
      
      const deletedCount = await cacheService.deletePattern("test:*");
      
      expect(deletedCount).to.equal(2);
      expect(await cacheService.get("test:1")).to.be.null;
      expect(await cacheService.get("test:2")).to.be.null;
      expect(await cacheService.get("other:1")).to.not.be.null;
    });
  });

  describe("Cache-Aside Pattern", () => {
    it("should fetch from source on cache miss", async function() {
      if (!cacheService.isAvailable()) {
        this.skip();
      }

      const key = "test-aside";
      let fetchCalled = false;
      
      const result = await cacheService.getOrSet(
        key,
        async () => {
          fetchCalled = true;
          return { data: "from-source" };
        },
        { ttl: 60 }
      );
      
      expect(result).to.deep.equal({ data: "from-source" });
      expect(fetchCalled).to.be.true;
    });

    it("should return cached value on cache hit", async function() {
      if (!cacheService.isAvailable()) {
        this.skip();
      }

      const key = "test-aside-hit";
      const cachedValue = { data: "cached" };
      
      await cacheService.set(key, cachedValue, { ttl: 60 });
      
      let fetchCalled = false;
      const result = await cacheService.getOrSet(
        key,
        async () => {
          fetchCalled = true;
          return { data: "from-source" };
        },
        { ttl: 60 }
      );
      
      expect(result).to.deep.equal(cachedValue);
      expect(fetchCalled).to.be.false;
    });
  });

  describe("Metrics", () => {
    it("should track cache hits and misses", async function() {
      if (!cacheService.isAvailable()) {
        this.skip();
      }

      const key = "metrics-test";
      
      // Miss
      await cacheService.get(key);
      
      // Set
      await cacheService.set(key, { value: 1 }, { ttl: 60 });
      
      // Hit
      await cacheService.get(key);
      
      const metrics = cacheService.getMetrics();
      expect(metrics.hits).to.equal(1);
      expect(metrics.misses).to.equal(1);
      expect(metrics.sets).to.equal(1);
    });

    it("should calculate hit rate correctly", async function() {
      if (!cacheService.isAvailable()) {
        this.skip();
      }

      const key = "hitrate-test";
      await cacheService.set(key, { value: 1 }, { ttl: 60 });
      
      // 3 hits, 1 miss = 75% hit rate
      await cacheService.get(key);
      await cacheService.get(key);
      await cacheService.get(key);
      await cacheService.get("non-existent");
      
      const metrics = cacheService.getMetrics();
      expect(metrics.hitRate).to.equal(75);
    });

    it("should track deletes", async function() {
      if (!cacheService.isAvailable()) {
        this.skip();
      }

      const key = "delete-metrics";
      await cacheService.set(key, { value: 1 }, { ttl: 60 });
      await cacheService.delete(key);
      
      const metrics = cacheService.getMetrics();
      expect(metrics.deletes).to.equal(1);
    });
  });

  describe("Content Caching Helpers", () => {
    it("should cache and retrieve content", async function() {
      if (!cacheService.isAvailable()) {
        this.skip();
      }

      const contentHash = "0x1234567890abcdef";
      const contentData = {
        contentHash,
        manifestUri: "ipfs://test",
        creatorAddress: "0xabc",
      };
      
      await cacheContent(contentHash, contentData);
      const result = await getCachedContent(contentHash);
      
      expect(result).to.deep.equal(contentData);
    });

    it("should invalidate content cache", async function() {
      if (!cacheService.isAvailable()) {
        this.skip();
      }

      const contentHash = "0xabcdef123456";
      await cacheContent(contentHash, { test: true });
      await invalidateContent(contentHash);
      
      const result = await getCachedContent(contentHash);
      expect(result).to.be.null;
    });
  });

  describe("Manifest Caching Helpers", () => {
    it("should cache and retrieve manifest", async function() {
      if (!cacheService.isAvailable()) {
        this.skip();
      }

      const manifestUri = "ipfs://Qm123";
      const manifestData = {
        version: "1.0",
        content_hash: "0x123",
        signature: "0xsig",
      };
      
      await cacheManifest(manifestUri, manifestData);
      const result = await getCachedManifest(manifestUri);
      
      expect(result).to.deep.equal(manifestData);
    });
  });

  describe("Platform Binding Caching Helpers", () => {
    it("should cache and retrieve platform binding", async function() {
      if (!cacheService.isAvailable()) {
        this.skip();
      }

      const platform = "youtube";
      const platformId = "abc123";
      const bindingData = {
        creator: "0x123",
        contentHash: "0xabc",
        manifestURI: "ipfs://test",
      };
      
      await cachePlatformBinding(platform, platformId, bindingData);
      const result = await getCachedPlatformBinding(platform, platformId);
      
      expect(result).to.deep.equal(bindingData);
    });

    it("should invalidate platform binding", async function() {
      if (!cacheService.isAvailable()) {
        this.skip();
      }

      const platform = "youtube";
      const platformId = "test123";
      await cachePlatformBinding(platform, platformId, { test: true });
      await invalidatePlatformBinding(platform, platformId);
      
      const result = await getCachedPlatformBinding(platform, platformId);
      expect(result).to.be.null;
    });
  });

  describe("Graceful Degradation", () => {
    it("should handle operations when Redis is not available", async () => {
      // These operations should not throw even if Redis is not available
      const key = "test-key";
      const value = { test: true };
      
      const getResult = await cacheService.get(key);
      const setResult = await cacheService.set(key, value);
      const deleteResult = await cacheService.delete(key);
      
      // Should return null/false but not throw
      expect(getResult).to.be.null;
      expect(typeof setResult).to.equal("boolean");
      expect(typeof deleteResult).to.equal("boolean");
    });

    it("should still return data from fetchFn when cache is unavailable", async () => {
      const key = "unavailable-test";
      const expectedData = { source: "database" };
      
      const result = await cacheService.getOrSet(
        key,
        async () => expectedData,
        { ttl: 60 }
      );
      
      expect(result).to.deep.equal(expectedData);
    });
  });
});
