import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { LRUCache } from "../lib/cache.js";

describe("LRUCache", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("should store and retrieve values", () => {
    const cache = new LRUCache({ maxSize: 10, ttl: 60 });
    cache.set("key1", "value1");
    expect(cache.get("key1")).toBe("value1");
  });

  it("should return undefined for missing keys", () => {
    const cache = new LRUCache({ maxSize: 10, ttl: 60 });
    expect(cache.get("nonexistent")).toBeUndefined();
  });

  it("should expire entries after TTL", () => {
    const cache = new LRUCache({ maxSize: 10, ttl: 5 });
    cache.set("key1", "value1");

    expect(cache.get("key1")).toBe("value1");

    // Advance time past TTL
    vi.advanceTimersByTime(6000);

    expect(cache.get("key1")).toBeUndefined();
  });

  it("should evict oldest entries when at capacity", () => {
    const cache = new LRUCache({ maxSize: 3, ttl: 60 });

    cache.set("a", 1);
    cache.set("b", 2);
    cache.set("c", 3);
    cache.set("d", 4); // Should evict "a"

    expect(cache.get("a")).toBeUndefined();
    expect(cache.get("b")).toBe(2);
    expect(cache.get("c")).toBe(3);
    expect(cache.get("d")).toBe(4);
  });

  it("should move accessed items to most-recently-used position", () => {
    const cache = new LRUCache({ maxSize: 3, ttl: 60 });

    cache.set("a", 1);
    cache.set("b", 2);
    cache.set("c", 3);

    // Access "a" to make it most recently used
    cache.get("a");

    // Add "d" — should evict "b" (now the least recently used)
    cache.set("d", 4);

    expect(cache.get("a")).toBe(1);
    expect(cache.get("b")).toBeUndefined();
    expect(cache.get("c")).toBe(3);
    expect(cache.get("d")).toBe(4);
  });

  it("should invalidate a specific key", () => {
    const cache = new LRUCache({ maxSize: 10, ttl: 60 });
    cache.set("a", 1);
    cache.set("b", 2);

    cache.invalidate("a");

    expect(cache.get("a")).toBeUndefined();
    expect(cache.get("b")).toBe(2);
  });

  it("should invalidate all keys when called without argument", () => {
    const cache = new LRUCache({ maxSize: 10, ttl: 60 });
    cache.set("a", 1);
    cache.set("b", 2);

    cache.invalidate();

    expect(cache.get("a")).toBeUndefined();
    expect(cache.get("b")).toBeUndefined();
  });

  it("should report correct stats", () => {
    const cache = new LRUCache({ maxSize: 100, ttl: 30 });

    cache.set("a", 1);
    cache.set("b", 2);

    cache.get("a"); // hit
    cache.get("b"); // hit
    cache.get("c"); // miss

    const stats = cache.stats();
    expect(stats.size).toBe(2);
    expect(stats.maxSize).toBe(100);
    expect(stats.ttl).toBe(30);
    expect(stats.hits).toBe(2);
    expect(stats.misses).toBe(1);
    expect(stats.hitRate).toBeCloseTo(2 / 3);
  });

  it("should report 0 hitRate when no requests made", () => {
    const cache = new LRUCache({ maxSize: 10, ttl: 60 });
    expect(cache.stats().hitRate).toBe(0);
  });

  it("should overwrite existing keys", () => {
    const cache = new LRUCache({ maxSize: 10, ttl: 60 });
    cache.set("key", "v1");
    cache.set("key", "v2");
    expect(cache.get("key")).toBe("v2");
  });
});
