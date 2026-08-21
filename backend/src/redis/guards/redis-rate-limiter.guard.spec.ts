import { ExecutionContext, HttpException, HttpStatus } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RedisRateLimiterGuard } from './redis-rate-limiter.guard';
import { RedisService } from '../redis.service';

describe('RedisRateLimiterGuard', () => {
  let guard: RedisRateLimiterGuard;
  let mockReflector: Partial<Reflector>;
  let mockRedisClient: any;
  let mockRedisService: Partial<RedisService>;

  const createMockContext = (ip = '127.0.0.1'): ExecutionContext => {
    const mockRequest = {
      ip,
      headers: {},
    };
    const mockResponse = {
      header: jest.fn(),
    };
    const mockHandler = () => {};
    Object.defineProperty(mockHandler, 'name', { value: 'testHandler' });

    return {
      switchToHttp: () => ({
        getRequest: () => mockRequest,
        getResponse: () => mockResponse,
      }),
      getHandler: () => mockHandler,
      getClass: () => ({ name: 'TestController' }),
    } as unknown as ExecutionContext;
  };

  beforeEach(() => {
    mockReflector = {
      getAllAndOverride: jest.fn(),
    };

    mockRedisClient = {
      incr: jest.fn(),
      expire: jest.fn().mockResolvedValue(1),
      ttl: jest.fn().mockResolvedValue(45),
    };

    mockRedisService = {
      getClient: jest.fn().mockReturnValue(mockRedisClient),
      isAvailable: jest.fn().mockReturnValue(true),
    };

    guard = new RedisRateLimiterGuard(
      mockReflector as Reflector,
      mockRedisService as RedisService,
    );
  });

  it('should allow request when no rate limit metadata is present', async () => {
    (mockReflector.getAllAndOverride as jest.Mock).mockReturnValue(undefined);
    const context = createMockContext();

    const allowed = await guard.canActivate(context);

    expect(allowed).toBe(true);
    expect(mockRedisClient.incr).not.toHaveBeenCalled();
  });

  it('should allow request and set TTL on first request', async () => {
    (mockReflector.getAllAndOverride as jest.Mock).mockReturnValue({
      limit: 10,
      ttlSeconds: 60,
      keyPrefix: 'test-endpoint',
    });
    mockRedisClient.incr.mockResolvedValue(1);

    const context = createMockContext();
    const allowed = await guard.canActivate(context);

    expect(allowed).toBe(true);
    expect(mockRedisClient.incr).toHaveBeenCalledWith('devats:ratelimit:127.0.0.1:test-endpoint');
    expect(mockRedisClient.expire).toHaveBeenCalledWith('devats:ratelimit:127.0.0.1:test-endpoint', 60);
  });

  it('should allow request when count is below limit', async () => {
    (mockReflector.getAllAndOverride as jest.Mock).mockReturnValue({
      limit: 5,
      ttlSeconds: 60,
    });
    mockRedisClient.incr.mockResolvedValue(4);

    const context = createMockContext();
    const allowed = await guard.canActivate(context);

    expect(allowed).toBe(true);
  });

  it('should throw HttpException 429 when count exceeds limit', async () => {
    (mockReflector.getAllAndOverride as jest.Mock).mockReturnValue({
      limit: 5,
      ttlSeconds: 60,
    });
    mockRedisClient.incr.mockResolvedValue(6);
    mockRedisClient.ttl.mockResolvedValue(42);

    const context = createMockContext();

    await expect(guard.canActivate(context)).rejects.toThrow(HttpException);

    try {
      await guard.canActivate(context);
    } catch (err: any) {
      expect(err.getStatus()).toBe(HttpStatus.TOO_MANY_REQUESTS);
      const response = err.getResponse();
      expect(response.message).toContain('Rate limit exceeded');
      expect(response.retryAfter).toBe(42);
    }
  });

  it('should fail-open and allow request if Redis client is unavailable', async () => {
    (mockReflector.getAllAndOverride as jest.Mock).mockReturnValue({ limit: 10 });
    (mockRedisService.isAvailable as jest.Mock).mockReturnValue(false);

    const context = createMockContext();
    const allowed = await guard.canActivate(context);

    expect(allowed).toBe(true);
  });

  it('should fail-open and allow request if Redis throws an unexpected error', async () => {
    (mockReflector.getAllAndOverride as jest.Mock).mockReturnValue({ limit: 10 });
    mockRedisClient.incr.mockRejectedValue(new Error('Redis cluster unreachable'));

    const context = createMockContext();
    const allowed = await guard.canActivate(context);

    expect(allowed).toBe(true);
  });
});
