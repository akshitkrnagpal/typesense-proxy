interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

export interface CacheStats {
  size: number;
  maxSize: number;
  ttl: number;
  hits: number;
  misses: number;
  hitRate: number;
}

export class LRUCache<T = unknown> {
  private cache: Map<string, CacheEntry<T>>;
  private readonly maxSize: number;
  private readonly ttl: number;
  private hits = 0;
  private misses = 0;

  constructor(options: { maxSize: number; ttl: number }) {
    this.maxSize = options.maxSize;
    this.ttl = options.ttl * 1000; // Convert seconds to ms
    this.cache = new Map();
  }

  get(key: string): T | undefined {
    const entry = this.cache.get(key);
    if (!entry) {
      this.misses++;
      return undefined;
    }

    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      this.misses++;
      return undefined;
    }

    // Move to end (most recently used)
    this.cache.delete(key);
    this.cache.set(key, entry);
    this.hits++;
    return entry.value;
  }

  set(key: string, value: T): void {
    // Delete first to reset position if key exists
    this.cache.delete(key);

    // Evict oldest entries if at capacity
    while (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey !== undefined) {
        this.cache.delete(firstKey);
      }
    }

    this.cache.set(key, {
      value,
      expiresAt: Date.now() + this.ttl,
    });
  }

  invalidate(key?: string): void {
    if (key) {
      this.cache.delete(key);
    } else {
      this.cache.clear();
    }
  }

  stats(): CacheStats {
    // Clean expired entries before reporting
    const now = Date.now();
    for (const [key, entry] of this.cache) {
      if (now > entry.expiresAt) {
        this.cache.delete(key);
      }
    }

    const total = this.hits + this.misses;
    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      ttl: this.ttl / 1000,
      hits: this.hits,
      misses: this.misses,
      hitRate: total === 0 ? 0 : this.hits / total,
    };
  }
}
