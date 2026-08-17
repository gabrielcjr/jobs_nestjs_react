import { Injectable, Logger } from '@nestjs/common';
import { AtsProvider } from '@prisma/client';
import slugify from 'slugify';
import { PrismaService } from '../prisma/prisma.service';
import { AtsAdapter, NormalizedJob } from './interfaces/ats-adapter.interface';
import { GreenhouseAdapter } from './adapters/greenhouse.adapter';
import { LeverAdapter } from './adapters/lever.adapter';
import { AshbyAdapter } from './adapters/ashby.adapter';
import { WorkableAdapter } from './adapters/workable.adapter';
import { SmartRecruitersAdapter } from './adapters/smartrecruiters.adapter';
import { cleanCompanyName } from './utils/tech-classifier.util';

export interface SyncResult {
  companySlug: string;
  provider: AtsProvider;
  totalFetched: number;
  upsertedCount: number;
  success: boolean;
  error?: string;
}

export interface BatchSyncSummary {
  totalCompanies: number;
  successfulCompanies: number;
  failedCompanies: number;
  totalJobsIngested: number;
  results: SyncResult[];
  durationMs: number;
}

export const ALL_PRESET_COMPANIES: { slug: string; provider: AtsProvider; name: string }[] = [
  // 1. Greenhouse Boards
  { slug: 'stripe', provider: AtsProvider.GREENHOUSE, name: 'Stripe' },
  { slug: 'figma', provider: AtsProvider.GREENHOUSE, name: 'Figma' },
  { slug: 'cloudflare', provider: AtsProvider.GREENHOUSE, name: 'Cloudflare' },
  { slug: 'discord', provider: AtsProvider.GREENHOUSE, name: 'Discord' },
  { slug: 'airbnb', provider: AtsProvider.GREENHOUSE, name: 'Airbnb' },
  { slug: 'github', provider: AtsProvider.GREENHOUSE, name: 'GitHub' },
  { slug: 'reddit', provider: AtsProvider.GREENHOUSE, name: 'Reddit' },
  { slug: 'brex', provider: AtsProvider.GREENHOUSE, name: 'Brex' },
  { slug: 'vercel', provider: AtsProvider.GREENHOUSE, name: 'Vercel' },
  { slug: 'pinterest', provider: AtsProvider.GREENHOUSE, name: 'Pinterest' },

  // 2. Lever Boards
  { slug: 'spotify', provider: AtsProvider.LEVER, name: 'Spotify' },
  { slug: 'automattic', provider: AtsProvider.LEVER, name: 'Automattic' },
  { slug: 'postman', provider: AtsProvider.LEVER, name: 'Postman' },
  { slug: 'twitch', provider: AtsProvider.LEVER, name: 'Twitch' },
  { slug: 'datadog', provider: AtsProvider.LEVER, name: 'Datadog' },

  // 3. Ashby Boards
  { slug: 'openai', provider: AtsProvider.ASHBY, name: 'OpenAI' },
  { slug: 'linear', provider: AtsProvider.ASHBY, name: 'Linear' },
  { slug: 'ramp', provider: AtsProvider.ASHBY, name: 'Ramp' },
  { slug: 'replit', provider: AtsProvider.ASHBY, name: 'Replit' },
  { slug: 'cursor', provider: AtsProvider.ASHBY, name: 'Cursor' },
  { slug: 'monzo', provider: AtsProvider.ASHBY, name: 'Monzo' },
  { slug: 'synthesia', provider: AtsProvider.ASHBY, name: 'Synthesia' },

  // 4. Workable Boards
  { slug: 'pleo', provider: AtsProvider.WORKABLE, name: 'Pleo' },
  { slug: 'typeform', provider: AtsProvider.WORKABLE, name: 'Typeform' },
  { slug: 'invision', provider: AtsProvider.WORKABLE, name: 'InVision' },

  // 5. SmartRecruiters Boards
  { slug: 'square', provider: AtsProvider.SMARTRECRUITERS, name: 'Square' },
  { slug: 'visa', provider: AtsProvider.SMARTRECRUITERS, name: 'Visa' },
  { slug: 'ikea', provider: AtsProvider.SMARTRECRUITERS, name: 'IKEA' },
  { slug: 'bosch', provider: AtsProvider.SMARTRECRUITERS, name: 'Bosch' },
];

@Injectable()
export class IngestionService {
  private readonly logger = new Logger(IngestionService.name);
  private readonly adapters: Map<AtsProvider, AtsAdapter>;

  constructor(
    private readonly prisma: PrismaService,
    greenhouse: GreenhouseAdapter,
    lever: LeverAdapter,
    ashby: AshbyAdapter,
    workable: WorkableAdapter,
    smartRecruiters: SmartRecruitersAdapter,
  ) {
    this.adapters = new Map<AtsProvider, AtsAdapter>([
      [AtsProvider.GREENHOUSE, greenhouse],
      [AtsProvider.LEVER, lever],
      [AtsProvider.ASHBY, ashby],
      [AtsProvider.WORKABLE, workable],
      [AtsProvider.SMARTRECRUITERS, smartRecruiters],
    ]);
  }

  getAvailableProviders(): { provider: AtsProvider; name: string; sampleSlugs: string[] }[] {
    return [
      {
        provider: AtsProvider.GREENHOUSE,
        name: 'Greenhouse',
        sampleSlugs: ['stripe', 'figma', 'cloudflare', 'discord', 'airbnb', 'github', 'reddit', 'brex', 'vercel'],
      },
      {
        provider: AtsProvider.LEVER,
        name: 'Lever',
        sampleSlugs: ['spotify', 'automattic', 'postman', 'twitch', 'datadog'],
      },
      {
        provider: AtsProvider.ASHBY,
        name: 'Ashby',
        sampleSlugs: ['openai', 'linear', 'ramp', 'replit', 'cursor', 'monzo', 'synthesia'],
      },
      {
        provider: AtsProvider.WORKABLE,
        name: 'Workable',
        sampleSlugs: ['pleo', 'typeform', 'invision'],
      },
      {
        provider: AtsProvider.SMARTRECRUITERS,
        name: 'SmartRecruiters',
        sampleSlugs: ['square', 'visa', 'ikea', 'bosch'],
      },
    ];
  }

  getAllPresets() {
    return ALL_PRESET_COMPANIES;
  }

  async syncCompanyJobs(companySlug: string, provider: AtsProvider, overrideName?: string): Promise<SyncResult> {
    const adapter = this.adapters.get(provider);
    if (!adapter) {
      throw new Error(`Unsupported ATS provider: ${provider}`);
    }

    const cleanSlug = companySlug.trim().toLowerCase();
    const rawFormattedName = overrideName || cleanSlug
      .split(/[-_]/)
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ');
    
    // Apply legal suffix cleaner (e.g. Inc, LLC, Ltd, etc.)
    const formattedName = cleanCompanyName(rawFormattedName);

    try {
      // Ensure company exists in DB with cleaned name
      const company = await this.prisma.company.upsert({
        where: { slug: cleanSlug },
        update: {
          name: formattedName,
          atsProvider: provider,
        },
        create: {
          name: formattedName,
          slug: cleanSlug,
          atsProvider: provider,
          websiteUrl: `https://${cleanSlug}.com`,
          logoUrl: `https://logo.clearbit.com/${cleanSlug}.com`,
        },
      });

      const jobs = await adapter.fetchJobs(cleanSlug);
      this.logger.log(`Fetched ${jobs.length} jobs for ${cleanSlug} from ${provider}`);

      let upsertedCount = 0;
      const now = new Date();

      for (const job of jobs) {
        const jobSlug = slugify(`${cleanSlug}-${job.title}-${job.externalJobId}`, {
          lower: true,
          strict: true,
        });

        await this.prisma.job.upsert({
          where: {
            atsProvider_externalJobId: {
              atsProvider: job.atsProvider,
              externalJobId: job.externalJobId,
            },
          },
          update: {
            title: job.title,
            slug: jobSlug,
            department: job.department,
            location: job.location,
            workplaceType: job.workplaceType,
            allowedLocations: job.allowedLocations || [],
            description: job.description,
            applyUrl: job.applyUrl,
            tags: job.tags,
            roleCategory: job.roleCategory,
            experienceLevel: job.experienceLevel,
            minSalary: job.minSalary !== undefined ? job.minSalary : undefined,
            maxSalary: job.maxSalary !== undefined ? job.maxSalary : undefined,
            currency: job.currency || 'USD',
            salarySummary: job.salarySummary,
            lastSeenAt: now,
            isActive: true,
          },
          create: {
            externalJobId: job.externalJobId,
            atsProvider: job.atsProvider,
            title: job.title,
            slug: jobSlug,
            companyId: company.id,
            department: job.department,
            location: job.location,
            workplaceType: job.workplaceType,
            allowedLocations: job.allowedLocations || [],
            description: job.description,
            applyUrl: job.applyUrl,
            tags: job.tags,
            roleCategory: job.roleCategory,
            experienceLevel: job.experienceLevel,
            minSalary: job.minSalary !== undefined ? job.minSalary : undefined,
            maxSalary: job.maxSalary !== undefined ? job.maxSalary : undefined,
            currency: job.currency || 'USD',
            salarySummary: job.salarySummary,
            postedAt: job.postedAt || now,
            firstSeenAt: now,
            lastSeenAt: now,
            isActive: true,
          },
        });
        upsertedCount++;
      }

      return {
        companySlug: cleanSlug,
        provider,
        totalFetched: jobs.length,
        upsertedCount,
        success: true,
      };
    } catch (error: any) {
      this.logger.error(`Error syncing company ${cleanSlug} with provider ${provider}: ${error.message}`);
      return {
        companySlug: cleanSlug,
        provider,
        totalFetched: 0,
        upsertedCount: 0,
        success: false,
        error: error.message,
      };
    }
  }

  async syncAllPresets(): Promise<BatchSyncSummary> {
    const startTime = Date.now();
    const presets = ALL_PRESET_COMPANIES;
    this.logger.log(`Starting single-shot ingestion for all ${presets.length} preset ATS boards...`);

    const results: SyncResult[] = [];
    let totalJobsIngested = 0;

    // Process in batches of 4 concurrent requests to prevent throttling
    const batchSize = 4;
    for (let i = 0; i < presets.length; i += batchSize) {
      const chunk = presets.slice(i, i + batchSize);
      const chunkPromises = chunk.map((c) =>
        this.syncCompanyJobs(c.slug, c.provider, c.name).catch((err) => ({
          companySlug: c.slug,
          provider: c.provider,
          totalFetched: 0,
          upsertedCount: 0,
          success: false,
          error: err.message,
        }))
      );

      const chunkResults = await Promise.all(chunkPromises);
      for (const res of chunkResults) {
        results.push(res);
        if (res.success) {
          totalJobsIngested += res.upsertedCount;
        }
      }
    }

    const successfulCompanies = results.filter((r) => r.success && r.totalFetched > 0).length;
    const failedCompanies = results.length - successfulCompanies;
    const durationMs = Date.now() - startTime;

    this.logger.log(
      `Finished single-shot ingestion: ${totalJobsIngested} jobs ingested across ${successfulCompanies}/${presets.length} companies in ${(durationMs / 1000).toFixed(1)}s`
    );

    return {
      totalCompanies: presets.length,
      successfulCompanies,
      failedCompanies,
      totalJobsIngested,
      results,
      durationMs,
    };
  }

  async syncBatch(companies: { slug: string; provider: AtsProvider; name?: string }[]): Promise<SyncResult[]> {
    const results: SyncResult[] = [];
    for (const item of companies) {
      const res = await this.syncCompanyJobs(item.slug, item.provider, item.name);
      results.push(res);
    }
    return results;
  }
}
