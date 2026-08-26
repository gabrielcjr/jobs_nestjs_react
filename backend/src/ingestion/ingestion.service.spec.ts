import { Test, TestingModule } from '@nestjs/testing';
import { IngestionService } from './ingestion.service';
import { PrismaService } from '../prisma/prisma.service';
import { GreenhouseAdapter } from './adapters/greenhouse.adapter';
import { LeverAdapter } from './adapters/lever.adapter';
import { AshbyAdapter } from './adapters/ashby.adapter';
import { RedisCacheService } from '../redis/redis-cache.service';
import { AtsProvider } from '@prisma/client';

describe('IngestionService (Stale Ingestion Safeguards)', () => {
  let service: IngestionService;
  let prisma: PrismaService;
  let greenhouseAdapter: GreenhouseAdapter;

  const mockPrismaService = {
    company: {
      upsert: jest.fn().mockResolvedValue({ id: 'comp-1', name: 'Acme', slug: 'acme' }),
    },
    job: {
      upsert: jest.fn().mockResolvedValue({ id: 'job-1' }),
    },
  };

  const mockGreenhouseAdapter = {
    provider: AtsProvider.GREENHOUSE,
    fetchJobs: jest.fn(),
  };

  const mockRedisCacheService = {
    invalidatePattern: jest.fn().mockResolvedValue(1),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        IngestionService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: GreenhouseAdapter, useValue: mockGreenhouseAdapter },
        { provide: LeverAdapter, useValue: {} },
        { provide: AshbyAdapter, useValue: {} },
        { provide: RedisCacheService, useValue: mockRedisCacheService },
      ],
    }).compile();

    service = module.get<IngestionService>(IngestionService);
    prisma = module.get<PrismaService>(PrismaService);
    greenhouseAdapter = module.get<GreenhouseAdapter>(GreenhouseAdapter);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should not re-admit soft-deleted stale jobs when postedAt is >45 days ago', async () => {
    const sixtyDaysAgo = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000);
    mockGreenhouseAdapter.fetchJobs.mockResolvedValue([
      {
        externalJobId: 'old-123',
        atsProvider: AtsProvider.GREENHOUSE,
        title: 'Old Staff Engineer',
        location: 'Remote',
        description: 'Old job description',
        applyUrl: 'https://example.com/apply',
        tags: ['TypeScript'],
        postedAt: sixtyDaysAgo,
      },
    ]);

    await service.syncCompanyJobs('acme', AtsProvider.GREENHOUSE, 'Acme Corp');

    expect(mockPrismaService.job.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          atsProvider_externalJobId: {
            atsProvider: AtsProvider.GREENHOUSE,
            externalJobId: 'old-123',
          },
        },
        update: expect.objectContaining({
          isActive: false, // Ensures existing stale job stays soft-deleted
        }),
        create: expect.objectContaining({
          isActive: false, // Ensures new old job is created inactive
        }),
      }),
    );
  });

  it('should not overwrite existing isActive status when postedAt is undefined (leaves deleted jobs deleted)', async () => {
    mockGreenhouseAdapter.fetchJobs.mockResolvedValue([
      {
        externalJobId: 'no-date-123',
        atsProvider: AtsProvider.GREENHOUSE,
        title: 'Software Engineer',
        location: 'San Francisco',
        description: 'Job description',
        applyUrl: 'https://example.com/apply',
        tags: ['Go'],
        postedAt: undefined,
      },
    ]);

    await service.syncCompanyJobs('acme', AtsProvider.GREENHOUSE, 'Acme Corp');

    expect(mockPrismaService.job.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          atsProvider_externalJobId: {
            atsProvider: AtsProvider.GREENHOUSE,
            externalJobId: 'no-date-123',
          },
        },
        update: expect.objectContaining({
          isActive: undefined, // Prisma no-op: does not touch or reactivate existing isActive state
        }),
        create: expect.objectContaining({
          isActive: true, // Brand-new jobs with no postedAt date start active
        }),
      }),
    );
  });

  it('should activate fresh jobs when postedAt is within the 45-day window', async () => {
    const fiveDaysAgo = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000);
    mockGreenhouseAdapter.fetchJobs.mockResolvedValue([
      {
        externalJobId: 'fresh-123',
        atsProvider: AtsProvider.GREENHOUSE,
        title: 'Fresh Senior Engineer',
        location: 'Remote',
        description: 'Fresh job description',
        applyUrl: 'https://example.com/apply',
        tags: ['React'],
        postedAt: fiveDaysAgo,
      },
    ]);

    await service.syncCompanyJobs('acme', AtsProvider.GREENHOUSE, 'Acme Corp');

    expect(mockPrismaService.job.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        update: expect.objectContaining({
          isActive: true,
        }),
        create: expect.objectContaining({
          isActive: true,
        }),
      }),
    );
  });
});
