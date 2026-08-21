import { Test, TestingModule } from '@nestjs/testing';
import { AnalyticsController } from './analytics.controller';
import { AnalyticsService } from './analytics.service';
import { RedisCacheService } from '../redis/redis-cache.service';
import {
  MarketOverviewDto,
  RoleSalaryStatDto,
  TechDemandStatDto,
} from './dto/analytics-response.dto';

describe('AnalyticsController', () => {
  let controller: AnalyticsController;
  let analyticsService: jest.Mocked<Partial<AnalyticsService>>;
  let redisCacheService: jest.Mocked<Partial<RedisCacheService>>;

  const mockOverview: MarketOverviewDto = {
    totalActiveJobs: 250,
    totalCompanies: 40,
    salaryDisclosedCount: 180,
    salaryDisclosedPercent: 72,
    remoteJobsCount: 190,
    remotePercent: 76,
    latamEligibleCount: 65,
  };

  const mockSalaryRoles: RoleSalaryStatDto[] = [
    {
      roleCategory: 'BACKEND',
      roleLabel: 'Backend Engineering',
      jobCount: 90,
      avgMinSalary: 140000,
      avgMaxSalary: 190000,
    },
    {
      roleCategory: 'FRONTEND',
      roleLabel: 'Frontend Engineering',
      jobCount: 60,
      avgMinSalary: 130000,
      avgMaxSalary: 175000,
    },
  ];

  const mockTechDemand: TechDemandStatDto[] = [
    { tag: 'TypeScript', jobCount: 120, avgMaxSalary: 185000 },
    { tag: 'Go', jobCount: 85, avgMaxSalary: 195000 },
    { tag: 'React', jobCount: 95, avgMaxSalary: 175000 },
  ];

  beforeEach(async () => {
    analyticsService = {
      getMarketOverview: jest.fn().mockResolvedValue(mockOverview),
      getSalaryByRole: jest.fn().mockResolvedValue(mockSalaryRoles),
      getTechDemand: jest.fn().mockResolvedValue(mockTechDemand),
    };

    redisCacheService = {
      getOrSet: jest.fn().mockImplementation((key, ttl, fetchFn) => fetchFn()),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AnalyticsController],
      providers: [
        { provide: AnalyticsService, useValue: analyticsService },
        { provide: RedisCacheService, useValue: redisCacheService },
      ],
    }).compile();

    controller = module.get<AnalyticsController>(AnalyticsController);
  });

  it('should return market overview from cache-aside layer', async () => {
    const result = await controller.getMarketOverview();
    expect(result).toEqual(mockOverview);
    expect(redisCacheService.getOrSet).toHaveBeenCalledWith(
      'devats:cache:analytics:overview',
      3600,
      expect.any(Function),
    );
  });

  it('should return salary benchmarks by role', async () => {
    const result = await controller.getSalaryByRole();
    expect(result).toEqual(mockSalaryRoles);
    expect(redisCacheService.getOrSet).toHaveBeenCalledWith(
      'devats:cache:analytics:salary-by-role',
      3600,
      expect.any(Function),
    );
  });

  it('should return tech demand and salary benchmarks', async () => {
    const result = await controller.getTechDemand();
    expect(result).toEqual(mockTechDemand);
    expect(redisCacheService.getOrSet).toHaveBeenCalledWith(
      'devats:cache:analytics:tech-demand',
      3600,
      expect.any(Function),
    );
  });
});
