import { Test, TestingModule } from '@nestjs/testing';
import { JobsService } from './jobs.service';
import { PrismaService } from '../prisma/prisma.service';
import { RoleCategory, ExperienceLevel, WorkplaceType, AtsProvider } from '@prisma/client';

describe('JobsService (Integration)', () => {
  let service: JobsService;
  let prisma: PrismaService;

  const mockPrismaService = {
    job: {
      findMany: jest.fn(),
      count: jest.fn(),
      findFirst: jest.fn(),
      groupBy: jest.fn(),
    },
    $queryRaw: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JobsService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<JobsService>(JobsService);
    prisma = module.get<PrismaService>(PrismaService);
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
            OR: expect.arrayContaining([
              expect.objectContaining({ title: { contains: 'Rust', mode: 'insensitive' } }),
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
});
