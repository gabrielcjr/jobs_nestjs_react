import { Global, Module } from '@nestjs/common';
import { RedisService } from './redis.service';
import { RedisCacheService } from './redis-cache.service';
import { RedisRateLimiterGuard } from './guards/redis-rate-limiter.guard';

@Global()
@Module({
  providers: [RedisService, RedisCacheService, RedisRateLimiterGuard],
  exports: [RedisService, RedisCacheService, RedisRateLimiterGuard],
})
export class RedisModule {}
