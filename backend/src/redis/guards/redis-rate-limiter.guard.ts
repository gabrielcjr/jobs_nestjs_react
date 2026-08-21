import {
  Injectable,
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RATE_LIMIT_KEY, RateLimitOptions } from '../decorators/rate-limit.decorator';
import { RedisService } from '../redis.service';

@Injectable()
export class RedisRateLimiterGuard implements CanActivate {
  private readonly logger = new Logger(RedisRateLimiterGuard.name);

  constructor(
    private readonly reflector: Reflector,
    private readonly redisService: RedisService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const options = this.reflector.getAllAndOverride<RateLimitOptions>(RATE_LIMIT_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // If no rate limit metadata defined, allow request
    if (!options) {
      return true;
    }

    const client = this.redisService.getClient();
    if (!client || !this.redisService.isAvailable()) {
      // Fail-open: allow request if Redis is unavailable
      return true;
    }

    const req = context.switchToHttp().getRequest();
    const res = context.switchToHttp().getResponse();

    const ip =
      req.headers?.['x-forwarded-for']?.toString().split(',')[0].trim() ||
      req.ip ||
      req.raw?.socket?.remoteAddress ||
      '127.0.0.1';

    const handlerName = context.getHandler().name;
    const prefix = options.keyPrefix || handlerName;
    const key = `devats:ratelimit:${ip}:${prefix}`;
    const limit = options.limit;
    const ttlSeconds = options.ttlSeconds || 60;

    try {
      // Atomic increment & TTL setup
      const current = await client.incr(key);
      if (current === 1) {
        await client.expire(key, ttlSeconds);
      }

      const remaining = Math.max(0, limit - current);

      // Set rate limit headers if response header method is available
      if (res && typeof res.header === 'function') {
        res.header('X-RateLimit-Limit', limit);
        res.header('X-RateLimit-Remaining', remaining);
      }

      if (current > limit) {
        const ttl = await client.ttl(key);
        const retryAfter = ttl > 0 ? ttl : ttlSeconds;

        if (res && typeof res.header === 'function') {
          res.header('Retry-After', retryAfter);
        }

        throw new HttpException(
          {
            statusCode: HttpStatus.TOO_MANY_REQUESTS,
            message: `Rate limit exceeded. Try again in ${retryAfter} seconds.`,
            error: 'Too Many Requests',
            limit,
            retryAfter,
          },
          HttpStatus.TOO_MANY_REQUESTS,
        );
      }

      return true;
    } catch (err: any) {
      if (err instanceof HttpException) {
        throw err;
      }
      this.logger.warn(`Rate limiter Redis error for IP ${ip}: ${err.message}. Fail-open active.`);
      return true;
    }
  }
}
