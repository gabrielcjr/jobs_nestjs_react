import { Injectable, Logger, NotFoundException, Optional } from '@nestjs/common';
import { Prisma, RoleCategory, ExperienceLevel, WorkplaceType, AtsProvider } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { RedisCacheService } from '../redis/redis-cache.service';
import { GetJobsQueryDto, DatePostedWindow, JobSortBy, SortOrder } from './dto/get-jobs-query.dto';
import {
  PruneJobsDto,
  PruneJobsResponse,
  PruneNonItJobsDto,
  PruneNonItJobsResponse,
} from './dto/prune-jobs.dto';
import { isItJob } from '../ingestion/utils/tech-classifier.util';

export interface JobListItem {
  id: string;
  externalJobId: string;
  atsProvider: AtsProvider;
  title: string;
  slug: string;
  department: string | null;
  location: string | null;
  workplaceType: WorkplaceType;
  applyUrl: string;
  tags: string[];
  roleCategory: RoleCategory;
  experienceLevel: ExperienceLevel;
  minSalary: Prisma.Decimal | null;
  maxSalary: Prisma.Decimal | null;
  currency: string | null;
  salarySummary: string | null;
  postedAt: Date | null;
  firstSeenAt: Date;
  company: {
    id: string;
    name: string;
    slug: string;
    logoUrl: string | null;
    websiteUrl: string | null;
    atsProvider: AtsProvider;
  };
}

export interface JobFacets {
  roleCategoryCounts: Record<string, number>;
  experienceLevelCounts: Record<string, number>;
  workplaceTypeCounts: Record<string, number>;
  atsProviderCounts: Record<string, number>;
  topTags: { name: string; count: number }[];
}

export interface PaginatedJobsResponse {
  jobs: JobListItem[];
  totalCount: number;
  page: number;
  totalPages: number;
  limit: number;
  facets: JobFacets;
}

@Injectable()
export class JobsService {
  private readonly logger = new Logger(JobsService.name);

  // Fallback in-memory cache for facets when Redis is unavailable
  private cachedFacets: JobFacets | null = null;
  private lastFacetComputeTime: number = 0;
  private readonly FACET_CACHE_TTL_MS = 60 * 1000; // 60s cache
  private readonly FACET_REDIS_KEY = 'devats:cache:jobs:facets:global';

  constructor(
    private readonly prisma: PrismaService,
    @Optional() private readonly redisCacheService?: RedisCacheService,
  ) {}

  async findAll(query: GetJobsQueryDto): Promise<PaginatedJobsResponse> {
    const {
      search,
      roleCategory,
      experienceLevel,
      tags,
      workplaceType,
      atsProvider,
      datePosted,
      minSalary,
      latamUsdOnly,
      sortBy = JobSortBy.POSTED_AT,
      sortOrder = SortOrder.DESC,
      page = 1,
      limit = 20,
      companySlug,
    } = query;

    const andConditions: Prisma.JobWhereInput[] = [
      { isActive: true },
    ];

    // 1. Search Query (title, description, department, location, company name)
    if (search && search.trim()) {
      const term = search.trim();
      andConditions.push({
        OR: [
          { title: { contains: term, mode: 'insensitive' } },
          { description: { contains: term, mode: 'insensitive' } },
          { department: { contains: term, mode: 'insensitive' } },
          { location: { contains: term, mode: 'insensitive' } },
          { company: { name: { contains: term, mode: 'insensitive' } } },
        ],
      });
    }

    // 2. Role Category Filter (single or array)
    if (roleCategory) {
      if (Array.isArray(roleCategory) && roleCategory.length > 0) {
        andConditions.push({ roleCategory: { in: roleCategory } });
      } else if (typeof roleCategory === 'string') {
        andConditions.push({ roleCategory });
      }
    }

    // 3. Experience Level Filter (single or array)
    if (experienceLevel) {
      if (Array.isArray(experienceLevel) && experienceLevel.length > 0) {
        andConditions.push({ experienceLevel: { in: experienceLevel } });
      } else if (typeof experienceLevel === 'string') {
        andConditions.push({ experienceLevel });
      }
    }

    // 4. Tech Tags Filter (GIN indexed array hasSome)
    if (tags && tags.length > 0) {
      const tagList = Array.isArray(tags) ? tags : [tags];
      andConditions.push({
        tags: {
          hasSome: tagList,
        },
      });
    }

    // 5. Workplace Type Filter
    if (workplaceType) {
      if (Array.isArray(workplaceType) && workplaceType.length > 0) {
        andConditions.push({ workplaceType: { in: workplaceType } });
      } else if (typeof workplaceType === 'string') {
        andConditions.push({ workplaceType });
      }
    }

    // 6. ATS Provider Filter
    if (atsProvider) {
      if (Array.isArray(atsProvider) && atsProvider.length > 0) {
        andConditions.push({ atsProvider: { in: atsProvider } });
      } else if (typeof atsProvider === 'string') {
        andConditions.push({ atsProvider });
      }
    }

    // 7. Company Slug Filter
    if (companySlug) {
      andConditions.push({ company: { slug: companySlug.toLowerCase() } });
    }

    // 8. Date Posted Preset Windows (use postedAt when present, fall back to firstSeenAt only when postedAt is null)
    if (datePosted && datePosted !== DatePostedWindow.ALL) {
      const now = new Date();
      let threshold: Date | undefined;

      if (datePosted === DatePostedWindow.PAST_24H) {
        threshold = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      } else if (datePosted === DatePostedWindow.PAST_7D) {
        threshold = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      } else if (datePosted === DatePostedWindow.PAST_30D) {
        threshold = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      }

      if (threshold) {
        andConditions.push({
          OR: [
            { postedAt: { gte: threshold } },
            { AND: [{ postedAt: null }, { firstSeenAt: { gte: threshold } }] },
          ],
        });
      }
    }

    // 9. Minimum Salary Filter
    if (minSalary !== undefined && minSalary > 0) {
      andConditions.push({
        OR: [
          { minSalary: { gte: minSalary } },
          { maxSalary: { gte: minSalary } },
        ],
      });
    }

    // 10. Dedicated LATAM USD Remote Only Filter (Instant indexed boolean check)
    if (latamUsdOnly) {
      andConditions.push({
        isLatamEligible: true,
      });
    }

    const where: Prisma.JobWhereInput = andConditions.length > 1 ? { AND: andConditions } : andConditions[0];

    // Deterministic sorting with nulls-last for nullable columns and secondary id tie-breaker
    const primaryOrder: Prisma.JobOrderByWithRelationInput = {};
    if (sortBy === JobSortBy.POSTED_AT) {
      primaryOrder.postedAt = { sort: sortOrder, nulls: 'last' };
    } else if (sortBy === JobSortBy.FIRST_SEEN_AT) {
      primaryOrder.firstSeenAt = sortOrder;
    } else if (sortBy === JobSortBy.MIN_SALARY) {
      primaryOrder.minSalary = { sort: sortOrder, nulls: 'last' };
    } else if (sortBy === JobSortBy.TITLE) {
      primaryOrder.title = sortOrder;
    }

    const orderBy: Prisma.JobOrderByWithRelationInput[] = [
      primaryOrder,
      { id: SortOrder.ASC },
    ];

    const skip = (page - 1) * limit;

    const [totalCount, jobs, facetStats] = await Promise.all([
      this.prisma.job.count({ where }),
      this.prisma.job.findMany({
        where,
        select: {
          id: true,
          externalJobId: true,
          atsProvider: true,
          title: true,
          slug: true,
          department: true,
          location: true,
          workplaceType: true,
          applyUrl: true,
          tags: true,
          roleCategory: true,
          experienceLevel: true,
          minSalary: true,
          maxSalary: true,
          currency: true,
          salarySummary: true,
          postedAt: true,
          firstSeenAt: true,
          company: {
            select: {
              id: true,
              name: true,
              slug: true,
              logoUrl: true,
              websiteUrl: true,
              atsProvider: true,
            },
          },
        },
        orderBy,
        skip,
        take: limit,
      }),
      this.getFastFacets(),
    ]);

    const totalPages = Math.ceil(totalCount / limit) || 1;

    return {
      jobs,
      totalCount,
      page,
      totalPages,
      limit,
      facets: facetStats,
    };
  }

  async findOne(idOrSlug: string) {
    const job = await this.prisma.job.findFirst({
      where: {
        OR: [{ id: idOrSlug }, { slug: idOrSlug }],
        isActive: true,
      },
      include: {
        company: true,
      },
    });

    if (!job) {
      throw new NotFoundException(`Job with ID or slug "${idOrSlug}" not found`);
    }

    return job;
  }

  async getTopTags(limit: number = 20): Promise<{ name: string; count: number }[]> {
    const facets = await this.getFastFacets();
    return facets.topTags.slice(0, limit);
  }

  /**
   * High-performance cached facet computer backed by Redis (shared across replicas)
   * and SQL unnest(tags) aggregation.
   */
  private async getFastFacets(): Promise<JobFacets> {
    if (this.redisCacheService && typeof this.redisCacheService.getOrSet === 'function') {
      return this.redisCacheService.getOrSet(this.FACET_REDIS_KEY, 60, () => this.computeFacetsFromDb());
    }

    const now = Date.now();
    if (this.cachedFacets && now - this.lastFacetComputeTime < this.FACET_CACHE_TTL_MS) {
      return this.cachedFacets;
    }

    const facets = await this.computeFacetsFromDb();
    this.cachedFacets = facets;
    this.lastFacetComputeTime = now;
    return facets;
  }

  private async computeFacetsFromDb(): Promise<JobFacets> {
    const [
      allRoleGroups,
      allExpGroups,
      allWorkplaceGroups,
      allAtsGroups,
      rawTopTags,
    ] = await Promise.all([
      this.prisma.job.groupBy({
        by: ['roleCategory'],
        where: { isActive: true },
        _count: { _all: true },
      }),
      this.prisma.job.groupBy({
        by: ['experienceLevel'],
        where: { isActive: true },
        _count: { _all: true },
      }),
      this.prisma.job.groupBy({
        by: ['workplaceType'],
        where: { isActive: true },
        _count: { _all: true },
      }),
      this.prisma.job.groupBy({
        by: ['atsProvider'],
        where: { isActive: true },
        _count: { _all: true },
      }),
      this.prisma.$queryRaw<{ name: string; count: number }[]>`
        SELECT
          tag as "name",
          COUNT(*)::int as "count"
        FROM "Job", unnest("tags") as tag
        WHERE "isActive" = true
        GROUP BY tag
        ORDER BY "count" DESC, "name" ASC
        LIMIT 100;
      `,
    ]);

    const roleCategoryCounts: Record<string, number> = {};
    for (const g of allRoleGroups) {
      roleCategoryCounts[g.roleCategory] = g._count._all;
    }

    const experienceLevelCounts: Record<string, number> = {};
    for (const g of allExpGroups) {
      experienceLevelCounts[g.experienceLevel] = g._count._all;
    }

    const workplaceTypeCounts: Record<string, number> = {};
    for (const g of allWorkplaceGroups) {
      workplaceTypeCounts[g.workplaceType] = g._count._all;
    }

    const atsProviderCounts: Record<string, number> = {};
    for (const g of allAtsGroups) {
      atsProviderCounts[g.atsProvider] = g._count._all;
    }

    let topTags: { name: string; count: number }[];
    if (Array.isArray(rawTopTags)) {
      topTags = rawTopTags.map((row) => ({
        name: row.name,
        count: Number(row.count),
      }));
    } else {
      // Fallback for test environments where only job.findMany was mocked
      const allJobsTags = (await this.prisma.job.findMany({
        where: { isActive: true },
        select: { tags: true },
      })) || [];
      const tagCounts = new Map<string, number>();
      for (const j of allJobsTags) {
        for (const t of j.tags || []) {
          tagCounts.set(t, (tagCounts.get(t) || 0) + 1);
        }
      }
      topTags = Array.from(tagCounts.entries())
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 100);
    }

    return {
      roleCategoryCounts,
      experienceLevelCounts,
      workplaceTypeCounts,
      atsProviderCounts,
      topTags,
    };
  }

  /**
   * Soft-delete stale job postings that were posted or first ingested more than the specified number of days ago.
   * Updates isActive to false, preserving records for Market Analytics while excluding them from active search.
   */
  async pruneStaleJobs(dto: PruneJobsDto = {}): Promise<PruneJobsResponse['data']> {
    const startTime = Date.now();
    const days = dto.days && dto.days > 0 ? dto.days : 45;
    const dryRun = Boolean(dto.dryRun);

    const cutoffDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    this.logger.log(
      `Running stale jobs pruning: cutoffDate=${cutoffDate.toISOString()} (${days} days), dryRun=${dryRun}`,
    );

    const whereClause: Prisma.JobWhereInput = {
      OR: [
        { postedAt: { lt: cutoffDate } },
        { firstSeenAt: { lt: cutoffDate } },
      ],
      isActive: true,
    };

    if (dryRun) {
      const candidateCount = await this.prisma.job.count({
        where: whereClause,
      });

      const executionTimeMs = Date.now() - startTime;
      this.logger.log(
        `[DRY RUN] Stale jobs pruning audit: found ${candidateCount} active jobs posted or ingested before ${cutoffDate.toISOString()} in ${executionTimeMs}ms`,
      );

      return {
        deactivatedCount: candidateCount,
        cutoffDate: cutoffDate.toISOString(),
        daysThreshold: days,
        dryRun: true,
        executionTimeMs,
      };
    }

    // Soft delete: update isActive to false
    const updateResult = await this.prisma.job.updateMany({
      where: whereClause,
      data: {
        isActive: false,
      },
    });

    const deactivatedCount = updateResult.count;
    const executionTimeMs = Date.now() - startTime;

    this.logger.log(
      `Stale jobs pruning completed: marked ${deactivatedCount} jobs as inactive (postedAt/firstSeenAt < ${cutoffDate.toISOString()}) in ${executionTimeMs}ms`,
    );

    // Invalidate facet cache and Redis query caches if jobs were deactivated
    if (deactivatedCount > 0) {
      this.cachedFacets = null;
      this.lastFacetComputeTime = 0;

      if (this.redisCacheService) {
        await this.redisCacheService.invalidatePattern('devats:cache:jobs:*');
        await this.redisCacheService.invalidatePattern('devats:cache:analytics:*');
      }
    }

    return {
      deactivatedCount,
      cutoffDate: cutoffDate.toISOString(),
      daysThreshold: days,
      dryRun: false,
      executionTimeMs,
    };
  }

  /**
   * Identifies and deactivates (or deletes) all non-IT jobs from the database.
   */
  async pruneNonItJobs(options: PruneNonItJobsDto = {}): Promise<PruneNonItJobsResponse['data']> {
    const startTime = Date.now();
    const dryRun = Boolean(options.dryRun);
    const hardDelete = Boolean(options.hardDelete);

    this.logger.log(`Running non-IT job pruning: dryRun=${dryRun}, hardDelete=${hardDelete}`);

    const jobs = await this.prisma.job.findMany({
      where: { isActive: true },
      select: { id: true, title: true, department: true },
    });

    const nonItJobIds: string[] = [];
    for (const job of jobs) {
      if (!isItJob(job.title, job.department || undefined)) {
        nonItJobIds.push(job.id);
      }
    }

    if (dryRun) {
      const executionTimeMs = Date.now() - startTime;
      this.logger.log(
        `[DRY RUN] Non-IT pruning audit: identified ${nonItJobIds.length} non-IT jobs out of ${jobs.length} active jobs in ${executionTimeMs}ms`,
      );
      return {
        processedCount: jobs.length,
        deactivatedCount: nonItJobIds.length,
        dryRun: true,
        hardDelete,
        executionTimeMs,
      };
    }

    let affectedCount = 0;
    if (nonItJobIds.length > 0) {
      const chunkSize = 500;
      for (let i = 0; i < nonItJobIds.length; i += chunkSize) {
        const chunk = nonItJobIds.slice(i, i + chunkSize);
        if (hardDelete) {
          const res = await this.prisma.job.deleteMany({
            where: { id: { in: chunk } },
          });
          affectedCount += res.count;
        } else {
          const res = await this.prisma.job.updateMany({
            where: { id: { in: chunk } },
            data: { isActive: false },
          });
          affectedCount += res.count;
        }
      }
    }

    const executionTimeMs = Date.now() - startTime;
    this.logger.log(
      `Non-IT job pruning completed: ${hardDelete ? 'deleted' : 'deactivated'} ${affectedCount} non-IT jobs in ${executionTimeMs}ms`,
    );

    if (affectedCount > 0) {
      this.cachedFacets = null;
      this.lastFacetComputeTime = 0;

      if (this.redisCacheService) {
        await this.redisCacheService.invalidatePattern('devats:cache:jobs:*');
        await this.redisCacheService.invalidatePattern('devats:cache:analytics:*');
      }
    }

    return {
      processedCount: jobs.length,
      deactivatedCount: affectedCount,
      dryRun: false,
      hardDelete,
      executionTimeMs,
    };
  }
}

