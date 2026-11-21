import { Controller, Post, Body, Get, Query, Sse, MessageEvent, HttpCode, HttpStatus, UseGuards } from '@nestjs/common';
import { Observable, map } from 'rxjs';
import { IngestionService, SyncResult } from './ingestion.service';
import {
  AtsDiscoveryService,
  DiscoveredAtsHit,
  DiscoveryProbeResult,
  BackgroundDiscoveryJob,
} from './services/ats-discovery.service';
import { DiscoverCompanyDto, DiscoverBatchDto, StartCsvDiscoveryDto } from './dto/discover-company.dto';
import { RedisRateLimiterGuard } from '../redis/guards/redis-rate-limiter.guard';
import { LocalhostOnlyGuard } from '../common/guards/localhost-only.guard';
import { RateLimit } from '../redis/decorators/rate-limit.decorator';

@Controller('api/v1/ingest')
@UseGuards(RedisRateLimiterGuard)
export class IngestionController {
  constructor(
    private readonly ingestionService: IngestionService,
    private readonly discoveryService: AtsDiscoveryService,
  ) {}

  @Get('providers')
  getProviders() {
    return {
      success: true,
      data: this.ingestionService.getAvailableProviders(),
    };
  }

  @Get('csv-summary')
  getCsvSummary(@Query('tier') tier?: string) {
    const parsedTier = tier ? parseInt(tier, 10) : 1;
    const tierMax = Number.isFinite(parsedTier) ? Math.min(Math.max(parsedTier, 1), 5) : 1;
    const rows = this.discoveryService.readCompanyCsv(tierMax);
    return {
      success: true,
      data: {
        totalRows: rows.length,
        tier: tierMax,
        sample: rows.slice(0, 10),
      },
    };
  }

  @Get('discovery-status')
  getDiscoveryStatus(): { success: boolean; data: BackgroundDiscoveryJob | null } {
    return {
      success: true,
      data: this.discoveryService.getActiveJob(),
    };
  }

  @Sse('discovery-stream')
  streamDiscoveryEvents(): Observable<MessageEvent> {
    return this.discoveryService.getProgressObservable().pipe(
      map((event) => ({
        data: event,
      }))
    );
  }

  @Post('start-csv-discovery')
  @HttpCode(HttpStatus.OK)
  @UseGuards(LocalhostOnlyGuard)
  @RateLimit({ limit: 5, ttlSeconds: 60, keyPrefix: 'ingest:csv-discovery' })
  async startCsvDiscovery(
    @Body() body: StartCsvDiscoveryDto,
  ): Promise<{ success: boolean; message: string; data: BackgroundDiscoveryJob }> {
    const tier = body.tier || 1;
    const limit = body.limit;
    const concurrency = body.concurrency || 8;

    const job = await this.discoveryService.startBackgroundCsvDiscovery(
      tier,
      limit,
      concurrency,
      async (hit) => {
        return this.ingestionService.syncCompanyJobs(hit.slug, hit.provider, hit.company);
      },
    );

    return {
      success: true,
      message: `Started automated background ATS discovery across ${job.total} companies`,
      data: job,
    };
  }

  @Post('discover')
  @HttpCode(HttpStatus.OK)
  @UseGuards(LocalhostOnlyGuard)
  @RateLimit({ limit: 10, ttlSeconds: 60, keyPrefix: 'ingest:discover' })
  async discoverCompany(@Body() dto: DiscoverCompanyDto): Promise<{ success: boolean; data: DiscoveryProbeResult }> {
    const result = await this.discoveryService.discoverCompanyAts(dto.companyName, dto.slug);
    return {
      success: Boolean(result.hit),
      data: result,
    };
  }

  @Post('discover-and-sync')
  @HttpCode(HttpStatus.OK)
  @UseGuards(LocalhostOnlyGuard)
  @RateLimit({ limit: 10, ttlSeconds: 60, keyPrefix: 'ingest:discover-and-sync' })
  async discoverAndSync(
    @Body() dto: DiscoverCompanyDto,
  ): Promise<{ success: boolean; data: { discovery: DiscoveryProbeResult; sync?: SyncResult } }> {
    const discovery = await this.discoveryService.discoverCompanyAts(dto.companyName, dto.slug);

    if (!discovery.hit) {
      return {
        success: false,
        data: { discovery },
      };
    }

    const sync = await this.ingestionService.syncCompanyJobs(
      discovery.hit.slug,
      discovery.hit.provider,
      discovery.hit.company,
    );

    return {
      success: sync.success,
      data: { discovery, sync },
    };
  }

  @Post('discover-batch')
  @HttpCode(HttpStatus.OK)
  @UseGuards(LocalhostOnlyGuard)
  @RateLimit({ limit: 5, ttlSeconds: 60, keyPrefix: 'ingest:discover-batch' })
  async discoverBatch(
    @Body() dto: DiscoverBatchDto,
  ): Promise<{
    success: boolean;
    data: {
      totalInput: number;
      discoveredCount: number;
      totalJobsSynced: number;
      results: { company: string; hit?: DiscoveredAtsHit; sync?: SyncResult }[];
    };
  }> {
    const companies = dto.companies.map((c) => ({ name: c.trim() })).filter((c) => c.name.length > 0);
    const discoveries = await this.discoveryService.discoverBatch(companies);

    const results: { company: string; hit?: DiscoveredAtsHit; sync?: SyncResult }[] = new Array(discoveries.length);
    let totalJobsSynced = 0;

    // Sync discovered companies with bounded concurrency (4 concurrent sync workers)
    const SYNC_CONCURRENCY = 4;
    let cursor = 0;

    const runSyncWorker = async () => {
      while (cursor < discoveries.length) {
        const idx = cursor++;
        const d = discoveries[idx];
        if (d.hit) {
          const sync = await this.ingestionService.syncCompanyJobs(d.hit.slug, d.hit.provider, d.hit.company);
          if (sync.success) {
            totalJobsSynced += sync.upsertedCount;
          }
          results[idx] = { company: d.company, hit: d.hit, sync };
        } else {
          results[idx] = { company: d.company };
        }
      }
    };

    const workers = Array.from({ length: Math.min(SYNC_CONCURRENCY, discoveries.length) }, () => runSyncWorker());
    await Promise.all(workers);

    const discoveredCount = results.filter((r) => Boolean(r?.hit)).length;

    return {
      success: true,
      data: {
        totalInput: companies.length,
        discoveredCount,
        totalJobsSynced,
        results,
      },
    };
  }
}

