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
      deleteMany: jest.fn(),
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

  describe('getTopTags', () => {
    it('should return top tags dynamically up to requested limit', async () => {
      mockPrismaService.job.groupBy.mockResolvedValue([]);
      mockPrismaService.job.findMany.mockResolvedValue([
        { tags: ['TypeScript', 'Node.js', 'React'] },
        { tags: ['TypeScript', 'React', 'Go'] },
        { tags: ['TypeScript', 'Python'] },
      ]);

      const tags = await service.getTopTags(2);
      expect(tags).toHaveLength(2);
      expect(tags[0].name).toBe('TypeScript');
      expect(tags[0].count).toBe(3);
      expect(tags[1].name).toBe('React');
      expect(tags[1].count).toBe(2);
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
          OR: [
            { postedAt: { lt: expect.any(Date) } },
            { firstSeenAt: { lt: expect.any(Date) } },
          ],
          isActive: true,
        },
      });
      expect(mockPrismaService.job.updateMany).not.toHaveBeenCalled();
      expect(mockRedisCacheService.invalidatePattern).not.toHaveBeenCalled();
    });

    it('should soft-delete stale jobs (>45 days since postedAt or firstSeenAt) and invalidate Redis caches', async () => {
      mockPrismaService.job.updateMany.mockResolvedValue({ count: 28 });

      const result = await service.pruneStaleJobs({ days: 45, dryRun: false });

      expect(result.dryRun).toBe(false);
      expect(result.deactivatedCount).toBe(28);
      expect(result.daysThreshold).toBe(45);
      expect(mockPrismaService.job.updateMany).toHaveBeenCalledWith({
        where: {
          OR: [
            { postedAt: { lt: expect.any(Date) } },
            { firstSeenAt: { lt: expect.any(Date) } },
          ],
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

  describe('pruneNonItJobs', () => {
    it('should audit non-IT jobs without modifying database in dry-run mode', async () => {
      mockPrismaService.job.findMany.mockResolvedValue([
        { id: 'job-1', title: 'Account Executive, AI Sales', department: 'Sales' },
        { id: 'job-2', title: 'Senior Software Engineer', department: 'Engineering' },
        { id: 'job-3', title: 'Lead Technical Recruiter', department: 'HR' },
      ]);

      const result = await service.pruneNonItJobs({ dryRun: true });

      expect(result.processedCount).toBe(3);
      expect(result.deactivatedCount).toBe(2);
      expect(result.dryRun).toBe(true);
      expect(mockPrismaService.job.updateMany).not.toHaveBeenCalled();
      expect(mockPrismaService.job.deleteMany).not.toHaveBeenCalled();
    });

    it('should deactivate non-IT jobs when dryRun is false', async () => {
      mockPrismaService.job.findMany.mockResolvedValue([
        { id: 'job-1', title: 'Account Executive, AI Sales', department: 'Sales' },
        { id: 'job-2', title: 'Senior Software Engineer', department: 'Engineering' },
      ]);
      mockPrismaService.job.updateMany.mockResolvedValue({ count: 1 });

      const result = await service.pruneNonItJobs({ dryRun: false });

      expect(result.deactivatedCount).toBe(1);
      expect(result.dryRun).toBe(false);
      expect(mockPrismaService.job.updateMany).toHaveBeenCalledWith({
        where: { id: { in: ['job-1'] } },
        data: { isActive: false },
      });
      expect(mockRedisCacheService.invalidatePattern).toHaveBeenCalledWith('devats:cache:jobs:*');
    });

    it('should hard delete non-IT jobs when hardDelete is true', async () => {
      mockPrismaService.job.deleteMany = jest.fn().mockResolvedValue({ count: 1 });
      mockPrismaService.job.findMany.mockResolvedValue([
        { id: 'job-1', title: 'Performance Marketing Manager', department: 'Marketing' },
        { id: 'job-2', title: 'Staff DevOps Engineer', department: 'Cloud' },
      ]);

      const result = await service.pruneNonItJobs({ dryRun: false, hardDelete: true });

      expect(result.deactivatedCount).toBe(1);
      expect(result.hardDelete).toBe(true);
      expect(mockPrismaService.job.deleteMany).toHaveBeenCalledWith({
        where: { id: { in: ['job-1'] } },
      });
    });
  });
});
