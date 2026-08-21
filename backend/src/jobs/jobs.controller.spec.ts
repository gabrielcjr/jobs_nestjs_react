import { Test, TestingModule } from '@nestjs/testing';
import { JobsController } from './jobs.controller';
import { JobsService } from './jobs.service';
import { RedisCacheService } from '../redis/redis-cache.service';
import { RedisService } from '../redis/redis.service';
import { Reflector } from '@nestjs/core';

describe('JobsController', () => {
  let controller: JobsController;
  let mockJobsService: Partial<JobsService>;
  let mockRedisCacheService: Partial<RedisCacheService>;

  beforeEach(async () => {
    mockJobsService = {
      findAll: jest.fn().mockResolvedValue({
        jobs: [{ id: 'job-1', title: 'Fullstack Dev' }],
        totalCount: 1,
        page: 1,
        limit: 10,
        totalPages: 1,
        facets: {
          roleCategoryCounts: {},
          experienceLevelCounts: {},
          workplaceTypeCounts: {},
          atsProviderCounts: {},
          topTags: [],
        },
      } as any),
      findOne: jest.fn().mockResolvedValue({ id: 'job-1', title: 'Fullstack Dev' } as any),
      getTopTags: jest.fn().mockResolvedValue(['TypeScript', 'React', 'PostgreSQL']),
      pruneStaleJobs: jest.fn().mockResolvedValue({
        deactivatedCount: 12,
        cutoffDate: '2026-07-07T00:00:00.000Z',
        daysThreshold: 45,
        dryRun: false,
        executionTimeMs: 42,
      }),
    };

    mockRedisCacheService = {
      generateCanonicalQueryKey: jest.fn().mockReturnValue('devats:cache:jobs:facets:mockhash'),
      getOrSet: jest.fn().mockImplementation((key, ttl, fetchFn) => fetchFn()),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [JobsController],
      providers: [
        { provide: JobsService, useValue: mockJobsService },
        { provide: RedisCacheService, useValue: mockRedisCacheService },
        { provide: RedisService, useValue: { getClient: () => null, isAvailable: () => true } },
        Reflector,
      ],
    }).compile();

    controller = module.get<JobsController>(JobsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getJobs', () => {
    it('should generate canonical cache key and execute through getOrSet', async () => {
      const query = { page: 1, limit: 10 };
      const result = await controller.getJobs(query as any);

      expect(mockRedisCacheService.generateCanonicalQueryKey).toHaveBeenCalledWith(
        'devats:cache:jobs:facets',
        query,
      );
      expect(mockRedisCacheService.getOrSet).toHaveBeenCalledWith(
        'devats:cache:jobs:facets:mockhash',
        60,
        expect.any(Function),
      );
      expect(result.jobs).toHaveLength(1);
    });
  });

  describe('getTags', () => {
    it('should cache top tags for 600 seconds', async () => {
      const result = await controller.getTags(20);

      expect(mockRedisCacheService.getOrSet).toHaveBeenCalledWith(
        'devats:cache:jobs:tags:20',
        600,
        expect.any(Function),
      );
      expect(result.data).toEqual(['TypeScript', 'React', 'PostgreSQL']);
    });
  });

  describe('getJob', () => {
    it('should cache single job detail for 300 seconds', async () => {
      const result = await controller.getJob('job-1');

      expect(mockRedisCacheService.getOrSet).toHaveBeenCalledWith(
        'devats:cache:jobs:detail:job-1',
        300,
        expect.any(Function),
      );
      expect(result.data).toEqual({ id: 'job-1', title: 'Fullstack Dev' });
    });
  });

  describe('pruneStaleJobs', () => {
    it('should invoke jobsService.pruneStaleJobs and return formatted response', async () => {
      const dto = { days: 45, dryRun: false };
      const response = await controller.pruneStaleJobs(dto);

      expect(mockJobsService.pruneStaleJobs).toHaveBeenCalledWith(dto);
      expect(response.success).toBe(true);
      expect(response.message).toContain('Pruned stale job postings');
      expect(response.data.deactivatedCount).toBe(12);
    });

    it('should format message for dry-run auditing', async () => {
      (mockJobsService.pruneStaleJobs as jest.Mock).mockResolvedValueOnce({
        deactivatedCount: 15,
        cutoffDate: '2026-07-07T00:00:00.000Z',
        daysThreshold: 45,
        dryRun: true,
        executionTimeMs: 10,
      });

      const response = await controller.pruneStaleJobs({ days: 45, dryRun: true });

      expect(response.success).toBe(true);
      expect(response.message).toContain('Audited stale job postings');
      expect(response.data.dryRun).toBe(true);
    });
  });
});
