import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, RoleCategory, ExperienceLevel, WorkplaceType, AtsProvider } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { GetJobsQueryDto, DatePostedWindow, JobSortBy, SortOrder } from './dto/get-jobs-query.dto';

export interface PaginatedJobsResponse {
  jobs: any[];
  totalCount: number;
  page: number;
  totalPages: number;
  limit: number;
  facets: {
    roleCategoryCounts: Record<string, number>;
    experienceLevelCounts: Record<string, number>;
    workplaceTypeCounts: Record<string, number>;
    atsProviderCounts: Record<string, number>;
    topTags: { name: string; count: number }[];
  };
}

@Injectable()
export class JobsService {
  constructor(private readonly prisma: PrismaService) {}

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
      sortBy = JobSortBy.POSTED_AT,
      sortOrder = SortOrder.DESC,
      page = 1,
      limit = 20,
      companySlug,
    } = query;

    const where: Prisma.JobWhereInput = {
      isActive: true,
    };

    // 1. Search Query (title, description, department, company name)
    if (search && search.trim()) {
      const term = search.trim();
      where.OR = [
        { title: { contains: term, mode: 'insensitive' } },
        { description: { contains: term, mode: 'insensitive' } },
        { department: { contains: term, mode: 'insensitive' } },
        { location: { contains: term, mode: 'insensitive' } },
        { company: { name: { contains: term, mode: 'insensitive' } } },
      ];
    }

    // 2. Role Category Filter (single or array)
    if (roleCategory) {
      if (Array.isArray(roleCategory) && roleCategory.length > 0) {
        where.roleCategory = { in: roleCategory };
      } else if (typeof roleCategory === 'string') {
        where.roleCategory = roleCategory;
      }
    }

    // 3. Experience Level Filter (single or array)
    if (experienceLevel) {
      if (Array.isArray(experienceLevel) && experienceLevel.length > 0) {
        where.experienceLevel = { in: experienceLevel };
      } else if (typeof experienceLevel === 'string') {
        where.experienceLevel = experienceLevel;
      }
    }

    // 4. Tech Tags Filter (GIN indexed array hasSome / hasEvery)
    if (tags && tags.length > 0) {
      const tagList = Array.isArray(tags) ? tags : [tags];
      where.tags = {
        hasSome: tagList,
      };
    }

    // 5. Workplace Type Filter
    if (workplaceType) {
      if (Array.isArray(workplaceType) && workplaceType.length > 0) {
        where.workplaceType = { in: workplaceType };
      } else if (typeof workplaceType === 'string') {
        where.workplaceType = workplaceType;
      }
    }

    // 6. ATS Provider Filter
    if (atsProvider) {
      if (Array.isArray(atsProvider) && atsProvider.length > 0) {
        where.atsProvider = { in: atsProvider };
      } else if (typeof atsProvider === 'string') {
        where.atsProvider = atsProvider;
      }
    }

    // 7. Company Slug Filter
    if (companySlug) {
      where.company = { slug: companySlug.toLowerCase() };
    }

    // 8. Date Posted Preset Windows
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
        where.OR = [
          { postedAt: { gte: threshold } },
          { firstSeenAt: { gte: threshold } },
        ];
      }
    }

    // 9. Minimum Salary Filter
    if (minSalary !== undefined && minSalary > 0) {
      where.OR = [
        { minSalary: { gte: minSalary } },
        { maxSalary: { gte: minSalary } },
      ];
    }

    // Sorting
    const orderBy: Prisma.JobOrderByWithRelationInput = {};
    if (sortBy === JobSortBy.POSTED_AT) {
      orderBy.postedAt = sortOrder;
    } else if (sortBy === JobSortBy.FIRST_SEEN_AT) {
      orderBy.firstSeenAt = sortOrder;
    } else if (sortBy === JobSortBy.MIN_SALARY) {
      orderBy.minSalary = sortOrder;
    } else if (sortBy === JobSortBy.TITLE) {
      orderBy.title = sortOrder;
    } else {
      orderBy.postedAt = 'desc';
    }

    const skip = (page - 1) * limit;

    const [totalCount, jobs, facetStats] = await Promise.all([
      this.prisma.job.count({ where }),
      this.prisma.job.findMany({
        where,
        include: {
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
      this.computeFacets(where),
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

  async getTopTags(limit: number = 30): Promise<{ name: string; count: number }[]> {
    const jobs = await this.prisma.job.findMany({
      where: { isActive: true },
      select: { tags: true },
    });

    const tagCounts = new Map<string, number>();
    for (const j of jobs) {
      for (const t of j.tags) {
        tagCounts.set(t, (tagCounts.get(t) || 0) + 1);
      }
    }

    return Array.from(tagCounts.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, limit);
  }

  private async computeFacets(currentWhere: Prisma.JobWhereInput) {
    // Base active count for facets
    const [allRoleGroups, allExpGroups, allWorkplaceGroups, allAtsGroups, allJobsTags] = await Promise.all([
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
      this.prisma.job.findMany({
        where: { isActive: true },
        select: { tags: true },
      }),
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

    const tagCounts = new Map<string, number>();
    for (const j of allJobsTags) {
      for (const t of j.tags) {
        tagCounts.set(t, (tagCounts.get(t) || 0) + 1);
      }
    }

    const topTags = Array.from(tagCounts.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 20);

    return {
      roleCategoryCounts,
      experienceLevelCounts,
      workplaceTypeCounts,
      atsProviderCounts,
      topTags,
    };
  }
}
