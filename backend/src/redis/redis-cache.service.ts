import { Injectable, Logger } from '@nestjs/common';
import * as crypto from 'crypto';
import { RedisService } from './redis.service';

@Injectable()
export class RedisCacheService {
  private readonly logger = new Logger(RedisCacheService.name);

  constructor(private readonly redisService: RedisService) {}

  /**
   * Generates a deterministic, canonical cache key for structured query objects.
   * Parameters are sorted alphabetically and stripped of empty values before SHA-256 hashing.
   */
  generateCanonicalQueryKey(prefix: string, query: Record<string, any> = {}): string {
    const keys = Object.keys(query)
      .filter((k) => query[k] !== undefined && query[k] !== null && query[k] !== '')
      .sort();

    const normalizedParts = keys.map((k) => {
      const val = Array.isArray(query[k]) ? query[k].sort().join(',') : String(query[k]);
      return `${encodeURIComponent(k)}=${encodeURIComponent(val)}`;
    });

    const normalizedQueryString = normalizedParts.join('&');
    if (!normalizedQueryString) {
      return `${prefix}:default`;
    }

    const hash = crypto.createHash('sha256').update(normalizedQueryString).digest('hex').substring(0, 16);
    return `${prefix}:${hash}`;
  }

  /**
   * Retrieve cached value by key. Returns null on cache miss or Redis failure.
   */
  async get<T>(key: string): Promise<T | null> {
    const client = this.redisService.getClient();
    if (!client || !this.redisService.isAvailable()) {
      return null;
    }

    try {
      const data = await client.get(key);
      if (!data) return null;
      return JSON.parse(data) as T;
    } catch (err: any) {
      this.logger.warn(`Redis get failed for key "${key}": ${err.message}`);
      return null;
    }
  }

  /**
   * Set a cached value with TTL in seconds.
   */
  async set<T>(key: string, value: T, ttlSeconds = 60): Promise<void> {
    const client = this.redisService.getClient();
    if (!client || !this.redisService.isAvailable()) {
      return;
    }

    try {
      const serialized = JSON.stringify(value);
      await client.setex(key, ttlSeconds, serialized);
    } catch (err: any) {
      this.logger.warn(`Redis set failed for key "${key}": ${err.message}`);
    }
  }

  /**
   * Cache-Aside orchestrator: Returns cached value if available; otherwise executes
   * fetchFn(), caches result, and returns data. Fail-open if Redis fails.
   */
  async getOrSet<T>(key: string, ttlSeconds: number, fetchFn: () => Promise<T>): Promise<T> {
    const cached = await this.get<T>(key);
    if (cached !== null) {
      return cached;
    }

    const fresh = await fetchFn();

    // Asynchronously write to cache (non-blocking)
    if (fresh !== undefined && fresh !== null) {
      this.set(key, fresh, ttlSeconds).catch((err) => {
        this.logger.warn(`Failed to asynchronously populate cache for key "${key}": ${err.message}`);
      });
    }

    return fresh;
  }

  /**
   * Delete a single key.
   */
  async del(key: string): Promise<void> {
    const client = this.redisService.getClient();
    if (!client || !this.redisService.isAvailable()) {
      return;
    }

    try {
      await client.del(key);
    } catch (err: any) {
      this.logger.warn(`Redis del failed for key "${key}": ${err.message}`);
    }
  }

  /**
   * Non-blocking batch invalidation of keys matching a glob pattern using SCAN.
   */
  async invalidatePattern(pattern: string): Promise<number> {
    const client = this.redisService.getClient();
    if (!client || !this.redisService.isAvailable()) {
      return 0;
    }

    try {
      let cursor = '0';
      let deletedCount = 0;

      do {
        const [nextCursor, keys] = await client.scan(cursor, 'MATCH', pattern, 'COUNT', 100);
        cursor = nextCursor;

        if (keys.length > 0) {
          const pipeline = client.pipeline();
          keys.forEach((k) => pipeline.unlink(k));
          await pipeline.exec();
          deletedCount += keys.length;
        }
      } while (cursor !== '0');

      if (deletedCount > 0) {
        this.logger.log(`Invalidated ${deletedCount} cache keys matching pattern "${pattern}"`);
      }

      return deletedCount;
    } catch (err: any) {
      this.logger.warn(`Redis invalidatePattern failed for "${pattern}": ${err.message}`);
      return 0;
    }
  }
}
