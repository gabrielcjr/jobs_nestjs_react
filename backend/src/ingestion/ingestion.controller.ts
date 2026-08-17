import { Controller, Post, Body, Get, Query, Sse, MessageEvent, HttpCode, HttpStatus } from '@nestjs/common';
import { Observable, map } from 'rxjs';
import { IngestionService, SyncResult } from './ingestion.service';
import { AtsDiscoveryService, DiscoveryProbeResult, BackgroundDiscoveryJob } from './services/ats-discovery.service';
import { SyncCompanyDto } from './dto/sync-company.dto';
import { DiscoverCompanyDto, DiscoverBatchDto } from './dto/discover-company.dto';

@Controller('api/v1/ingest')
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
    const tierMax = tier ? parseInt(tier, 10) : 1;
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
  async startCsvDiscovery(
    @Body() body: { tier?: number; limit?: number; concurrency?: number },
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
  async discoverCompany(@Body() dto: DiscoverCompanyDto): Promise<{ success: boolean; data: DiscoveryProbeResult }> {
    const result = await this.discoveryService.discoverCompanyAts(dto.companyName, dto.slug);
    return {
      success: Boolean(result.hit),
      data: result,
    };
  }

  @Post('discover-and-sync')
  @HttpCode(HttpStatus.OK)
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
  async discoverBatch(
    @Body() dto: DiscoverBatchDto,
  ): Promise<{
    success: boolean;
    data: {
      totalInput: number;
      discoveredCount: number;
      totalJobsSynced: number;
      results: { company: string; hit?: any; sync?: SyncResult }[];
    };
  }> {
    const companies = dto.companies.map((c) => ({ name: c.trim() })).filter((c) => c.name.length > 0);
    const discoveries = await this.discoveryService.discoverBatch(companies);

    const results: { company: string; hit?: any; sync?: SyncResult }[] = [];
    let totalJobsSynced = 0;

    for (const d of discoveries) {
      if (d.hit) {
        const sync = await this.ingestionService.syncCompanyJobs(d.hit.slug, d.hit.provider, d.hit.company);
        if (sync.success) {
          totalJobsSynced += sync.upsertedCount;
        }
        results.push({ company: d.company, hit: d.hit, sync });
      } else {
        results.push({ company: d.company });
      }
    }

    const discoveredCount = results.filter((r) => Boolean(r.hit)).length;

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
