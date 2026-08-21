import { Injectable, Logger, Optional } from '@nestjs/common';
import { AtsProvider, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { RedisCacheService } from '../redis/redis-cache.service';
import { AtsAdapter } from './interfaces/ats-adapter.interface';
import { GreenhouseAdapter } from './adapters/greenhouse.adapter';
import { LeverAdapter } from './adapters/lever.adapter';
import { AshbyAdapter } from './adapters/ashby.adapter';
import { cleanCompanyName, isLatamUsdEligible } from './utils/tech-classifier.util';
import slugify from 'slugify';

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
  successful: number;
  failed: number;
  totalJobsUpserted: number;
  results: SyncResult[];
}

export const ALL_PRESET_COMPANIES: { slug: string; provider: AtsProvider; name: string }[] = [
  // Greenhouse
  { slug: 'stripe', provider: AtsProvider.GREENHOUSE, name: 'Stripe' },
  { slug: 'figma', provider: AtsProvider.GREENHOUSE, name: 'Figma' },
  { slug: 'airbnb', provider: AtsProvider.GREENHOUSE, name: 'Airbnb' },
  { slug: 'discord', provider: AtsProvider.GREENHOUSE, name: 'Discord' },
  { slug: 'datadog', provider: AtsProvider.GREENHOUSE, name: 'Datadog' },
  { slug: 'hashicorp', provider: AtsProvider.GREENHOUSE, name: 'HashiCorp' },
  { slug: 'gitlab', provider: AtsProvider.GREENHOUSE, name: 'GitLab' },
  { slug: 'elastic', provider: AtsProvider.GREENHOUSE, name: 'Elastic' },
  { slug: 'cloudflare', provider: AtsProvider.GREENHOUSE, name: 'Cloudflare' },
  { slug: 'coinbase', provider: AtsProvider.GREENHOUSE, name: 'Coinbase' },
  { slug: 'reddit', provider: AtsProvider.GREENHOUSE, name: 'Reddit' },
  { slug: 'pinterest', provider: AtsProvider.GREENHOUSE, name: 'Pinterest' },
  { slug: 'dropbox', provider: AtsProvider.GREENHOUSE, name: 'Dropbox' },
  { slug: 'doorndash', provider: AtsProvider.GREENHOUSE, name: 'DoorDash' },
  { slug: 'instacart', provider: AtsProvider.GREENHOUSE, name: 'Instacart' },
  { slug: 'lyft', provider: AtsProvider.GREENHOUSE, name: 'Lyft' },
  { slug: 'snap', provider: AtsProvider.GREENHOUSE, name: 'Snap' },
  { slug: 'robinhood', provider: AtsProvider.GREENHOUSE, name: 'Robinhood' },
  { slug: 'plaid', provider: AtsProvider.GREENHOUSE, name: 'Plaid' },
  { slug: 'gusto', provider: AtsProvider.GREENHOUSE, name: 'Gusto' },
  { slug: 'brex', provider: AtsProvider.GREENHOUSE, name: 'Brex' },
  { slug: 'ramp', provider: AtsProvider.GREENHOUSE, name: 'Ramp' },
  { slug: 'affirm', provider: AtsProvider.GREENHOUSE, name: 'Affirm' },
  { slug: 'chime', provider: AtsProvider.GREENHOUSE, name: 'Chime' },
  { slug: 'samsara', provider: AtsProvider.GREENHOUSE, name: 'Samsara' },
  { slug: 'remotecom', provider: AtsProvider.GREENHOUSE, name: 'Remote' },
  { slug: 'automattic', provider: AtsProvider.GREENHOUSE, name: 'Automattic' },
  { slug: 'canonical', provider: AtsProvider.GREENHOUSE, name: 'Canonical' },
  { slug: 'zapier', provider: AtsProvider.GREENHOUSE, name: 'Zapier' },
  { slug: 'duckduckgo', provider: AtsProvider.GREENHOUSE, name: 'DuckDuckGo' },
  { slug: 'auth0', provider: AtsProvider.GREENHOUSE, name: 'Auth0' },

  // Lever
  { slug: 'spotify', provider: AtsProvider.LEVER, name: 'Spotify' },
  { slug: 'netflix', provider: AtsProvider.LEVER, name: 'Netflix' },
  { slug: 'atlassian', provider: AtsProvider.LEVER, name: 'Atlassian' },
  { slug: 'twitch', provider: AtsProvider.LEVER, name: 'Twitch' },
  { slug: 'coupa', provider: AtsProvider.LEVER, name: 'Coupa' },
  { slug: 'palantir', provider: AtsProvider.LEVER, name: 'Palantir' },
  { slug: 'box', provider: AtsProvider.LEVER, name: 'Box' },

  // Ashby
  { slug: 'linear', provider: AtsProvider.ASHBY, name: 'Linear' },
  { slug: 'retool', provider: AtsProvider.ASHBY, name: 'Retool' },
  { slug: 'notion', provider: AtsProvider.ASHBY, name: 'Notion' },
  { slug: 'anthropic', provider: AtsProvider.ASHBY, name: 'Anthropic' },
  { slug: 'openai', provider: AtsProvider.ASHBY, name: 'OpenAI' },
  { slug: 'scale', provider: AtsProvider.ASHBY, name: 'Scale AI' },
  { slug: 'per-plexity', provider: AtsProvider.ASHBY, name: 'Perplexity' },
  { slug: 'cursor', provider: AtsProvider.ASHBY, name: 'Cursor' },
  { slug: 'posthog', provider: AtsProvider.ASHBY, name: 'PostHog' },
  { slug: 'clerk', provider: AtsProvider.ASHBY, name: 'Clerk' },
  { slug: 'supabase', provider: AtsProvider.ASHBY, name: 'Supabase' },
  { slug: 'modal', provider: AtsProvider.ASHBY, name: 'Modal' },
  { slug: 'fal', provider: AtsProvider.ASHBY, name: 'Fal' },
];

@Injectable()
export class IngestionService {
  private readonly logger = new Logger(IngestionService.name);
  private readonly adapters: Map<AtsProvider, AtsAdapter> = new Map();

  constructor(
    private readonly prisma: PrismaService,
    greenhouse: GreenhouseAdapter,
    lever: LeverAdapter,
    ashby: AshbyAdapter,
    @Optional() private readonly redisCacheService?: RedisCacheService,
  ) {
    this.adapters.set(AtsProvider.GREENHOUSE, greenhouse);
    this.adapters.set(AtsProvider.LEVER, lever);
    this.adapters.set(AtsProvider.ASHBY, ashby);
  }

  getAvailableProviders(): { provider: AtsProvider; name: string; description: string }[] {
    return [
      {
        provider: AtsProvider.GREENHOUSE,
        name: 'Greenhouse',
        description: 'Boards API (`boards-api.greenhouse.io/v1/boards/{slug}/jobs?content=true`)',
      },
      {
        provider: AtsProvider.LEVER,
        name: 'Lever',
        description: 'Postings API (`api.lever.co/v0/postings/{slug}?mode=json`)',
      },
      {
        provider: AtsProvider.ASHBY,
        name: 'Ashby',
        description: 'Job Board API (`api.ashbyhq.com/posting-api/job-board/{slug}`)',
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
        },
      });

      const jobs = await adapter.fetchJobs(cleanSlug);
      this.logger.log(`Fetched ${jobs.length} jobs for ${cleanSlug} from ${provider}`);

      let upsertedCount = 0;
      const now = new Date();

      for (const job of jobs) {
        const isLatam = isLatamUsdEligible(
          job.location || '',
          job.description || '',
          job.currency || 'USD',
          job.workplaceType,
        );

        const jobSlug = slugify(`${formattedName}-${job.title}-${job.externalJobId}`, {
          lower: true,
          strict: true,
          trim: true,
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
            isLatamEligible: isLatam,
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
            isLatamEligible: isLatam,
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

      // Invalidate cached jobs, facets, and analytics if new jobs were upserted
      if (upsertedCount > 0 && this.redisCacheService) {
        await this.redisCacheService.invalidatePattern('devats:cache:jobs:*');
        await this.redisCacheService.invalidatePattern('devats:cache:analytics:*');
      }


      return {
        companySlug: cleanSlug,
        provider,
        totalFetched: jobs.length,
        upsertedCount,
        success: true,
      };
    } catch (error: any) {
      this.logger.error(`Failed syncing jobs for ${companySlug} via ${provider}: ${error.message}`);
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
    const results: SyncResult[] = [];
    let totalJobsUpserted = 0;
    let successful = 0;
    let failed = 0;

    this.logger.log(`Starting batch synchronization for ${ALL_PRESET_COMPANIES.length} preset companies...`);

    for (const preset of ALL_PRESET_COMPANIES) {
      const result = await this.syncCompanyJobs(preset.slug, preset.provider, preset.name);
      results.push(result);

      if (result.success) {
        successful++;
        totalJobsUpserted += result.upsertedCount;
      } else {
        failed++;
      }

      // Small polite delay between batch company syncs
      await new Promise((resolve) => setTimeout(resolve, 200));
    }

    return {
      totalCompanies: ALL_PRESET_COMPANIES.length,
      successful,
      failed,
      totalJobsUpserted,
      results,
    };
  }
}
