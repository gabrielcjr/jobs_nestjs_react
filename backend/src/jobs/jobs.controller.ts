import { Controller, Get, Param, Query, UseGuards, UsePipes, ValidationPipe } from '@nestjs/common';
import { JobsService } from './jobs.service';
import { GetJobsQueryDto } from './dto/get-jobs-query.dto';
import { RedisCacheService } from '../redis/redis-cache.service';
import { RedisRateLimiterGuard } from '../redis/guards/redis-rate-limiter.guard';
import { RateLimit } from '../redis/decorators/rate-limit.decorator';

@Controller('api/v1/jobs')
@UseGuards(RedisRateLimiterGuard)
@UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
export class JobsController {
  constructor(
    private readonly jobsService: JobsService,
    private readonly redisCacheService: RedisCacheService,
  ) {}

  @Get()
  @RateLimit({ limit: 60, ttlSeconds: 60, keyPrefix: 'jobs:search' })
  async getJobs(@Query() query: GetJobsQueryDto) {
    const cacheKey = this.redisCacheService.generateCanonicalQueryKey('devats:cache:jobs:facets', query);
    return this.redisCacheService.getOrSet(cacheKey, 60, () => this.jobsService.findAll(query));
  }

  @Get('tags')
  @RateLimit({ limit: 60, ttlSeconds: 60, keyPrefix: 'jobs:tags' })
  async getTags(@Query('limit') limit?: number) {
    const numLimit = limit ? Number(limit) : 30;
    const cacheKey = `devats:cache:jobs:tags:${numLimit}`;

    return this.redisCacheService.getOrSet(cacheKey, 600, async () => {
      const topTags = await this.jobsService.getTopTags(numLimit);
      return {
        success: true,
        data: topTags,
      };
    });
  }

  @Get(':idOrSlug')
  @RateLimit({ limit: 60, ttlSeconds: 60, keyPrefix: 'jobs:detail' })
  async getJob(@Param('idOrSlug') idOrSlug: string) {
    const cacheKey = `devats:cache:jobs:detail:${idOrSlug}`;

    return this.redisCacheService.getOrSet(cacheKey, 300, async () => {
      const job = await this.jobsService.findOne(idOrSlug);
      return {
        success: true,
        data: job,
      };
    });
  }
}

