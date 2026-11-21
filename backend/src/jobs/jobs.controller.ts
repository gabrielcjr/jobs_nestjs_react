import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JobsService } from './jobs.service';
import { GetJobsQueryDto } from './dto/get-jobs-query.dto';
import {
  PruneJobsDto,
  PruneJobsResponse,
  PruneNonItJobsDto,
  PruneNonItJobsResponse,
} from './dto/prune-jobs.dto';
import { RedisCacheService } from '../redis/redis-cache.service';
import { RedisRateLimiterGuard } from '../redis/guards/redis-rate-limiter.guard';
import { LocalhostOnlyGuard } from '../common/guards/localhost-only.guard';
import { RateLimit } from '../redis/decorators/rate-limit.decorator';

@Controller('api/v1/jobs')
@UseGuards(RedisRateLimiterGuard)
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
  async getTags(@Query('limit') limit?: number | string) {
    const parsed = limit !== undefined && limit !== '' ? Number(limit) : 30;
    const numLimit = Number.isFinite(parsed)
      ? Math.min(Math.max(Math.trunc(parsed), 1), 100)
      : 30;
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

  @Post('prune')
  @HttpCode(HttpStatus.OK)
  @UseGuards(LocalhostOnlyGuard)
  @RateLimit({ limit: 10, ttlSeconds: 60, keyPrefix: 'jobs:prune' })
  async pruneStaleJobs(@Body() body: PruneJobsDto): Promise<PruneJobsResponse> {
    const data = await this.jobsService.pruneStaleJobs(body);
    const action = data.dryRun ? 'Audited' : 'Pruned';
    return {
      success: true,
      message: `${action} stale job postings (threshold: ${data.daysThreshold} days, deactivated: ${data.deactivatedCount})`,
      data,
    };
  }

  @Post('prune-non-it')
  @HttpCode(HttpStatus.OK)
  @UseGuards(LocalhostOnlyGuard)
  @RateLimit({ limit: 10, ttlSeconds: 60, keyPrefix: 'jobs:prune-non-it' })
  async pruneNonItJobs(@Body() body: PruneNonItJobsDto): Promise<PruneNonItJobsResponse> {
    const data = await this.jobsService.pruneNonItJobs(body);
    const action = data.dryRun ? 'Audited' : data.hardDelete ? 'Deleted' : 'Deactivated';
    return {
      success: true,
      message: `${action} ${data.deactivatedCount} non-IT jobs out of ${data.processedCount} processed`,
      data,
    };
  }
}
