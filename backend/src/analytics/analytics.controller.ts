import { Controller, Get } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { RedisCacheService } from '../redis/redis-cache.service';
import {
  MarketOverviewDto,
  RoleSalaryStatDto,
  TechDemandStatDto,
} from './dto/analytics-response.dto';

const ANALYTICS_CACHE_TTL = 3600; // 1 hour

@Controller('api/v1/analytics')
export class AnalyticsController {
  constructor(
    private readonly analyticsService: AnalyticsService,
    private readonly cacheService: RedisCacheService,
  ) {}

  @Get('overview')
  async getMarketOverview(): Promise<MarketOverviewDto> {
    const cacheKey = 'devats:cache:analytics:overview';
    return this.cacheService.getOrSet(
      cacheKey,
      ANALYTICS_CACHE_TTL,
      () => this.analyticsService.getMarketOverview(),
    );
  }

  @Get('salary-by-role')
  async getSalaryByRole(): Promise<RoleSalaryStatDto[]> {
    const cacheKey = 'devats:cache:analytics:salary-by-role';
    return this.cacheService.getOrSet(
      cacheKey,
      ANALYTICS_CACHE_TTL,
      () => this.analyticsService.getSalaryByRole(),
    );
  }

  @Get('tech-demand')
  async getTechDemand(): Promise<TechDemandStatDto[]> {
    const cacheKey = 'devats:cache:analytics:tech-demand';
    return this.cacheService.getOrSet(
      cacheKey,
      ANALYTICS_CACHE_TTL,
      () => this.analyticsService.getTechDemand(),
    );
  }
}
