import { Test, TestingModule } from '@nestjs/testing';
import { RedisCacheService } from './redis-cache.service';
import { RedisService } from './redis.service';

describe('RedisCacheService', () => {
  let cacheService: RedisCacheService;
  let mockRedisClient: any;
  let mockRedisService: Partial<RedisService>;

  beforeEach(async () => {
    mockRedisClient = {
      get: jest.fn(),
      setex: jest.fn().mockResolvedValue('OK'),
      del: jest.fn().mockResolvedValue(1),
      scan: jest.fn(),
      pipeline: jest.fn(),
    };

    mockRedisService = {
      getClient: jest.fn().mockReturnValue(mockRedisClient),
      isAvailable: jest.fn().mockReturnValue(true),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RedisCacheService,
        {
          provide: RedisService,
          useValue: mockRedisService,
        },
      ],
    }).compile();

    cacheService = module.get<RedisCacheService>(RedisCacheService);
  });

  describe('generateCanonicalQueryKey', () => {
    it('should generate identical hashes regardless of query parameter insertion order', () => {
      const query1 = { roleCategory: 'BACKEND', page: 1, limit: 10 };
      const query2 = { limit: 10, roleCategory: 'BACKEND', page: 1 };

      const key1 = cacheService.generateCanonicalQueryKey('devats:cache:jobs:facets', query1);
      const key2 = cacheService.generateCanonicalQueryKey('devats:cache:jobs:facets', query2);

      expect(key1).toEqual(key2);
      expect(key1).toMatch(/^devats:cache:jobs:facets:[a-f0-9]{16}$/);
    });

    it('should ignore undefined, null, and empty string properties', () => {
      const query1 = { roleCategory: 'BACKEND', search: '', workplaceType: undefined };
      const query2 = { roleCategory: 'BACKEND' };

      const key1 = cacheService.generateCanonicalQueryKey('devats:cache:jobs:facets', query1);
      const key2 = cacheService.generateCanonicalQueryKey('devats:cache:jobs:facets', query2);

      expect(key1).toEqual(key2);
    });

    it('should return default key for empty query object', () => {
      const key = cacheService.generateCanonicalQueryKey('devats:cache:jobs:facets', {});
      expect(key).toBe('devats:cache:jobs:facets:default');
    });
  });

  describe('get', () => {
    it('should return parsed JSON object on cache hit', async () => {
      const mockData = { id: 'job-123', title: 'Senior Backend Engineer' };
      mockRedisClient.get.mockResolvedValue(JSON.stringify(mockData));

      const result = await cacheService.get('devats:cache:jobs:detail:job-123');

      expect(result).toEqual(mockData);
      expect(mockRedisClient.get).toHaveBeenCalledWith('devats:cache:jobs:detail:job-123');
    });

    it('should return null on cache miss', async () => {
      mockRedisClient.get.mockResolvedValue(null);

      const result = await cacheService.get('devats:cache:jobs:detail:nonexistent');

      expect(result).toBeNull();
    });

    it('should return null and not throw if Redis client is unavailable', async () => {
      (mockRedisService.isAvailable as jest.Mock).mockReturnValue(false);

      const result = await cacheService.get('devats:cache:jobs:detail:job-123');

      expect(result).toBeNull();
      expect(mockRedisClient.get).not.toHaveBeenCalled();
    });

    it('should gracefully return null if Redis get throws an exception', async () => {
      mockRedisClient.get.mockRejectedValue(new Error('Connection reset by peer'));

      const result = await cacheService.get('devats:cache:jobs:detail:job-123');

      expect(result).toBeNull();
    });
  });

  describe('set', () => {
    it('should serialize value to JSON and call setex with specified TTL', async () => {
      const payload = { total: 100, jobs: [] };
      await cacheService.set('devats:cache:jobs:facets:abc', payload, 120);

      expect(mockRedisClient.setex).toHaveBeenCalledWith(
        'devats:cache:jobs:facets:abc',
        120,
        JSON.stringify(payload),
      );
    });

    it('should not throw if Redis setex fails', async () => {
      mockRedisClient.setex.mockRejectedValue(new Error('OOM command not allowed'));

      await expect(
        cacheService.set('devats:cache:jobs:facets:abc', { data: 1 }),
      ).resolves.not.toThrow();
    });
  });

  describe('getOrSet (Cache-Aside Pattern)', () => {
    it('should return cached value on hit without executing fetchFn', async () => {
      const cached = { cached: true, total: 42 };
      mockRedisClient.get.mockResolvedValue(JSON.stringify(cached));
      const fetchFn = jest.fn().mockResolvedValue({ cached: false });

      const result = await cacheService.getOrSet('test-key', 60, fetchFn);

      expect(result).toEqual(cached);
      expect(fetchFn).not.toHaveBeenCalled();
    });

    it('should call fetchFn and populate cache on cache miss', async () => {
      mockRedisClient.get.mockResolvedValue(null);
      const fresh = { cached: false, data: 'fresh-data' };
      const fetchFn = jest.fn().mockResolvedValue(fresh);

      const result = await cacheService.getOrSet('test-key', 60, fetchFn);

      expect(result).toEqual(fresh);
      expect(fetchFn).toHaveBeenCalledTimes(1);
      expect(mockRedisClient.setex).toHaveBeenCalledWith('test-key', 60, JSON.stringify(fresh));
    });

    it('should fail-open: return fetchFn result if Redis is disconnected', async () => {
      (mockRedisService.isAvailable as jest.Mock).mockReturnValue(false);
      const fresh = { data: 'fallback-from-db' };
      const fetchFn = jest.fn().mockResolvedValue(fresh);

      const result = await cacheService.getOrSet('test-key', 60, fetchFn);

      expect(result).toEqual(fresh);
      expect(fetchFn).toHaveBeenCalledTimes(1);
    });
  });

  describe('invalidatePattern', () => {
    it('should iterate with SCAN and unlink matching keys in batch', async () => {
      // First iteration returns 2 keys and next cursor '10', second returns 1 key and '0'
      mockRedisClient.scan
        .mockResolvedValueOnce(['10', ['devats:cache:jobs:1', 'devats:cache:jobs:2']])
        .mockResolvedValueOnce(['0', ['devats:cache:jobs:3']]);

      const mockPipeline = {
        unlink: jest.fn(),
        exec: jest.fn().mockResolvedValue([]),
      };
      mockRedisClient.pipeline.mockReturnValue(mockPipeline);

      const count = await cacheService.invalidatePattern('devats:cache:jobs:*');

      expect(count).toBe(3);
      expect(mockPipeline.unlink).toHaveBeenCalledTimes(3);
      expect(mockPipeline.exec).toHaveBeenCalledTimes(2);
    });

    it('should return 0 when no keys match', async () => {
      mockRedisClient.scan.mockResolvedValueOnce(['0', []]);

      const count = await cacheService.invalidatePattern('devats:cache:nonexistent:*');

      expect(count).toBe(0);
    });
  });
});
