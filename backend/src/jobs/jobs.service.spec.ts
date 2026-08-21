import { Test, TestingModule } from '@nestjs/testing';
import { JobsService } from './jobs.service';
import { PrismaService } from '../prisma/prisma.service';
import { RedisCacheService } from '../redis/redis-cache.service';
import { RoleCategory, ExperienceLevel, WorkplaceType, AtsProvider } from '@prisma/client';

describe('JobsService (Integration)', () => {
  let service: JobsService;
  let prisma: PrismaService;
  let redisCacheService: RedisCacheService;

  const mockPrismaService = {
    job: {
      findMany: jest.fn(),
      count: jest.fn(),
      findFirst: jest.fn(),
      groupBy: jest.fn(),
      updateMany: jest.fn(),
    },
    $queryRaw: jest.fn(),
  };

  const mockRedisCacheService = {
    invalidatePattern: jest.fn().mockResolvedValue(1),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JobsService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: RedisCacheService, useValue: mockRedisCacheService },
      ],
    }).compile();

    service = module.get<JobsService>(JobsService);
    prisma = module.get<PrismaService>(PrismaService);
    redisCacheService = module.get<RedisCacheService>(RedisCacheService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('should query jobs with pagination and facets', async () => {
      const mockJobs = [
        {
          id: 'job-1',
          title: 'Senior Backend Engineer',
          roleCategory: RoleCategory.BACKEND,
          company: { name: 'Acme', slug: 'acme' },
          tags: ['Go', 'PostgreSQL'],
        },
      ];

      mockPrismaService.job.findMany.mockResolvedValue(mockJobs);
      mockPrismaService.job.count.mockResolvedValue(1);
      mockPrismaService.job.groupBy.mockResolvedValue([]);

      const result = await service.findAll({
        page: 1,
        limit: 10,
        roleCategory: RoleCategory.BACKEND,
      });

      expect(result.jobs).toEqual(mockJobs);
      expect(result.totalCount).toBe(1);
      expect(result.page).toBe(1);
      expect(mockPrismaService.job.findMany).toHaveBeenCalled();
    });

    it('should apply full text search filter when provided', async () => {
      mockPrismaService.job.findMany.mockResolvedValue([]);
      mockPrismaService.job.count.mockResolvedValue(0);
      mockPrismaService.job.groupBy.mockResolvedValue([]);

      await service.findAll({ search: 'Rust' });

      expect(mockPrismaService.job.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            AND: expect.arrayContaining([
              expect.objectContaining({
                OR: expect.arrayContaining([
                  expect.objectContaining({ title: { contains: 'Rust', mode: 'insensitive' } }),
                ]),
              }),
            ]),
          }),
        }),
      );
    });

    it('should apply LATAM USD Remote filter when latamUsdOnly is true using indexed flag', async () => {
      mockPrismaService.job.findMany.mockResolvedValue([]);
      mockPrismaService.job.count.mockResolvedValue(0);
      mockPrismaService.job.groupBy.mockResolvedValue([]);

      await service.findAll({ latamUsdOnly: true });

      expect(mockPrismaService.job.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            AND: expect.arrayContaining([
              expect.objectContaining({
                isLatamEligible: true,
              }),
            ]),
          }),
        }),
      );
    });
  });

  describe('findOne', () => {
    it('should find job by id or slug', async () => {
      const mockJob = { id: 'uuid-123', title: 'Staff Engineer' };
      mockPrismaService.job.findFirst.mockResolvedValue(mockJob);

      const result = await service.findOne('uuid-123');
      expect(result).toEqual(mockJob);
      expect(mockPrismaService.job.findFirst).toHaveBeenCalledWith({
        where: {
          OR: [{ id: 'uuid-123' }, { slug: 'uuid-123' }],
          isActive: true,
        },
        include: { company: true },
      });
    });
  });

  describe('pruneStaleJobs', () => {
    it('should perform dry-run audit without updating records', async () => {
      mockPrismaService.job.count.mockResolvedValue(15);

      const result = await service.pruneStaleJobs({ days: 45, dryRun: true });

      expect(result.dryRun).toBe(true);
      expect(result.deactivatedCount).toBe(15);
      expect(result.daysThreshold).toBe(45);
      expect(mockPrismaService.job.count).toHaveBeenCalledWith({
        where: {
          firstSeenAt: { lt: expect.any(Date) },
          isActive: true,
        },
      });
      expect(mockPrismaService.job.updateMany).not.toHaveBeenCalled();
      expect(mockRedisCacheService.invalidatePattern).not.toHaveBeenCalled();
    });

    it('should soft-delete stale jobs (>45 days since firstSeenAt) and invalidate Redis caches', async () => {
      mockPrismaService.job.updateMany.mockResolvedValue({ count: 28 });

      const result = await service.pruneStaleJobs({ days: 45, dryRun: false });

      expect(result.dryRun).toBe(false);
      expect(result.deactivatedCount).toBe(28);
      expect(result.daysThreshold).toBe(45);
      expect(mockPrismaService.job.updateMany).toHaveBeenCalledWith({
        where: {
          firstSeenAt: { lt: expect.any(Date) },
          isActive: true,
        },
        data: {
          isActive: false,
        },
      });
      expect(mockRedisCacheService.invalidatePattern).toHaveBeenCalledWith('devats:cache:jobs:*');
      expect(mockRedisCacheService.invalidatePattern).toHaveBeenCalledWith('devats:cache:analytics:*');
    });

    it('should handle custom retention threshold (e.g. 30 days)', async () => {
      mockPrismaService.job.updateMany.mockResolvedValue({ count: 5 });

      const result = await service.pruneStaleJobs({ days: 30 });

      expect(result.daysThreshold).toBe(30);
      expect(result.deactivatedCount).toBe(5);
      expect(mockPrismaService.job.updateMany).toHaveBeenCalled();
    });
  });
});
