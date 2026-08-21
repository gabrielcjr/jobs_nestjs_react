import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  MarketOverviewDto,
  RoleSalaryStatDto,
  TechDemandStatDto,
} from './dto/analytics-response.dto';

const ROLE_LABELS: Record<string, string> = {
  BACKEND: 'Backend Engineering',
  FRONTEND: 'Frontend Engineering',
  FULLSTACK: 'Full Stack Engineering',
  DEVOPS_SRE_INFRA: 'DevOps, SRE & Cloud',
  DATA_AI_ML: 'AI, Machine Learning & Data',
  MOBILE: 'Mobile (iOS & Android)',
  SECURITY: 'Security & AppSec',
  ENGINEERING_MANAGEMENT: 'Engineering Management',
  OTHER: 'Other Software Roles',
};

@Injectable()
export class AnalyticsService {
  private readonly logger = new Logger(AnalyticsService.name);

  constructor(private readonly prisma: PrismaService) {}

  async getMarketOverview(): Promise<MarketOverviewDto> {
    const [
      totalActiveJobs,
      totalCompanies,
      salaryDisclosedCount,
      remoteJobsCount,
      latamEligibleCount,
    ] = await Promise.all([
      this.prisma.job.count({ where: { isActive: true } }),
      this.prisma.company.count(),
      this.prisma.job.count({
        where: { isActive: true, maxSalary: { not: null } },
      }),
      this.prisma.job.count({
        where: { isActive: true, workplaceType: 'REMOTE' },
      }),
      this.prisma.job.count({
        where: { isActive: true, isLatamEligible: true },
      }),
    ]);

    const salaryDisclosedPercent =
      totalActiveJobs > 0
        ? Math.round((salaryDisclosedCount / totalActiveJobs) * 100)
        : 0;

    const remotePercent =
      totalActiveJobs > 0
        ? Math.round((remoteJobsCount / totalActiveJobs) * 100)
        : 0;

    return {
      totalActiveJobs,
      totalCompanies,
      salaryDisclosedCount,
      salaryDisclosedPercent,
      remoteJobsCount,
      remotePercent,
      latamEligibleCount,
    };
  }

  async getSalaryByRole(): Promise<RoleSalaryStatDto[]> {
    type RawRoleStat = {
      roleCategory: string;
      count: number;
      avgMinSalary: number | null;
      avgMaxSalary: number | null;
    };

    const results: RawRoleStat[] = await this.prisma.$queryRaw`
      SELECT
        "roleCategory"::text as "roleCategory",
        COUNT(*)::int as "count",
        ROUND(AVG("minSalary")::numeric, 0)::int as "avgMinSalary",
        ROUND(AVG("maxSalary")::numeric, 0)::int as "avgMaxSalary"
      FROM "Job"
      WHERE "isActive" = true AND "maxSalary" IS NOT NULL AND "maxSalary" > 0
      GROUP BY "roleCategory"
      ORDER BY "avgMaxSalary" DESC NULLS LAST;
    `;

    return results.map((row) => ({
      roleCategory: row.roleCategory,
      roleLabel: ROLE_LABELS[row.roleCategory] || row.roleCategory,
      jobCount: row.count,
      avgMinSalary: row.avgMinSalary || 0,
      avgMaxSalary: row.avgMaxSalary || 0,
    }));
  }

  async getTechDemand(): Promise<TechDemandStatDto[]> {
    type RawTechStat = {
      tag: string;
      count: number;
      avgSalary: number | null;
    };

    const results: RawTechStat[] = await this.prisma.$queryRaw`
      SELECT
        tag,
        COUNT(*)::int as "count",
        ROUND(AVG("maxSalary")::numeric, 0)::int as "avgSalary"
      FROM "Job", unnest("tags") as tag
      WHERE "isActive" = true
      GROUP BY tag
      ORDER BY "count" DESC
      LIMIT 15;
    `;

    return results.map((row) => ({
      tag: row.tag,
      jobCount: row.count,
      avgMaxSalary: row.avgSalary || 0,
    }));
  }
}
