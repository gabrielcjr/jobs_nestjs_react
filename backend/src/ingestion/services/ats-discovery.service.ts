import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';
import * as fs from 'fs';
import * as path from 'path';
import { Subject, Observable } from 'rxjs';
import { AtsProvider } from '@prisma/client';
import { cleanCompanyName, LEGAL_SUFFIXES_REGEX } from '../utils/tech-classifier.util';

export interface DiscoveredAtsHit {
  company: string;
  provider: AtsProvider;
  slug: string;
  jobCount: number;
  endpoint: string;
}

export interface DiscoveryProbeResult {
  company: string;
  candidateSlugs: string[];
  hit?: DiscoveredAtsHit;
  testedCount: number;
  probedProviders: AtsProvider[];
}

export interface CsvCompanyRow {
  tier?: number;
  company: string;
  slug?: string;
  knownAts?: string;
  knownAtsSlug?: string;
  website?: string;
  careersUrl?: string;
}

export interface DiscoveryProgressEvent {
  type: 'progress' | 'hit' | 'complete' | 'error';
  current: number;
  total: number;
  company?: string;
  hit?: DiscoveredAtsHit;
  totalDiscovered: number;
  totalJobsSynced: number;
  durationMs?: number;
}

export interface BackgroundDiscoveryJob {
  id: string;
  status: 'running' | 'completed' | 'failed';
  total: number;
  processed: number;
  discoveredCount: number;
  totalJobsSynced: number;
  currentCompany?: string;
  results: { company: string; hit?: DiscoveredAtsHit; sync?: any }[];
  startTime: number;
  durationMs?: number;
}

@Injectable()
export class AtsDiscoveryService {
  private readonly logger = new Logger(AtsDiscoveryService.name);
  private readonly timeout = 5000; // 5s timeout per probe
  private activeJob: BackgroundDiscoveryJob | null = null;
  private readonly progressSubject = new Subject<DiscoveryProgressEvent>();

  getProgressObservable(): Observable<DiscoveryProgressEvent> {
    return this.progressSubject.asObservable();
  }

  getActiveJob(): BackgroundDiscoveryJob | null {
    return this.activeJob;
  }

  /**
   * Reads and parses global-hiring-companies.csv from the backend root.
   */
  readCompanyCsv(tierMax: number = 2, limit?: number): CsvCompanyRow[] {
    const csvPath = path.resolve(process.cwd(), 'global-hiring-companies.csv');
    if (!fs.existsSync(csvPath)) {
      this.logger.warn(`CSV file not found at ${csvPath}`);
      return [];
    }

    const content = fs.readFileSync(csvPath, 'utf-8');
    const lines = content.split('\n').filter((l) => l.trim().length > 0);
    if (lines.length < 2) return [];

    const header = lines[0].split(',').map((h) => h.trim().toLowerCase());
    const tierIdx = header.indexOf('tier');
    const companyIdx = header.indexOf('company');
    const slugIdx = header.indexOf('slug');
    const knownAtsIdx = header.indexOf('known_ats');
    const knownAtsSlugIdx = header.indexOf('known_ats_slug');
    const websiteIdx = header.indexOf('website');
    const careersIdx = header.indexOf('careers_url');

    const rows: CsvCompanyRow[] = [];

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i];
      const cols: string[] = [];
      let inQuotes = false;
      let cur = '';

      for (let c = 0; c < line.length; c++) {
        const char = line[c];
        if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
          cols.push(cur.trim());
          cur = '';
        } else {
          cur += char;
        }
      }
      cols.push(cur.trim());

      const tier = tierIdx !== -1 ? parseInt(cols[tierIdx], 10) : 1;
      const company = companyIdx !== -1 ? cols[companyIdx].replace(/^"|"$/g, '') : '';
      const slug = slugIdx !== -1 ? cols[slugIdx] : '';
      const knownAts = knownAtsIdx !== -1 ? cols[knownAtsIdx] : '';
      const knownAtsSlug = knownAtsSlugIdx !== -1 ? cols[knownAtsSlugIdx] : '';
      const website = websiteIdx !== -1 ? cols[websiteIdx] : '';
      const careersUrl = careersIdx !== -1 ? cols[careersIdx] : '';

      if (company || slug) {
        if (!isNaN(tier) && tier > tierMax) {
          continue;
        }
        rows.push({
          tier,
          company: company || slug,
          slug,
          knownAts,
          knownAtsSlug,
          website,
          careersUrl,
        });
      }
    }

    if (limit && limit > 0) {
      return rows.slice(0, limit);
    }
    return rows;
  }

  /**
   * Generates plausible candidate tenant slugs for a given company name.
   */
  generateCandidateSlugs(companyName: string, explicitSlug?: string, knownAtsSlug?: string): string[] {
    const base = companyName
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, ' ')
      .trim();

    const condensed = base ? base.replace(/\s+/g, '') : '';
    const hyphenated = base ? base.replace(/\s+/g, '-') : '';

    const stripped = base ? base.replace(LEGAL_SUFFIXES_REGEX, '').trim() : '';
    const strippedCondensed = stripped.replace(/\s+/g, '');
    const strippedHyphenated = stripped.replace(/\s+/g, '-');
    const firstWord = base ? base.split(' ')[0] : '';

    const candidates = [
      knownAtsSlug,
      explicitSlug,
      strippedCondensed,
      strippedHyphenated,
      condensed,
      hyphenated,
      firstWord,
      stripped,
    ];

    const seen = new Set<string>();
    const validSlugs: string[] = [];

    for (const c of candidates) {
      const clean = (c || '').replace(/^[,\s\-_.]+|[,\s\-_.]+$/g, '');
      if (clean && clean.length > 1 && !seen.has(clean)) {
        seen.add(clean);
        validSlugs.push(clean);
      }
    }

    return validSlugs;
  }

  /**
   * Probes a single candidate slug against an ATS provider endpoint.
   */
  async probeEndpoint(
    company: string,
    provider: AtsProvider,
    slug: string,
  ): Promise<DiscoveredAtsHit | null> {
    const config = this.getAtsEndpointConfig(provider, slug);
    if (!config) return null;

    try {
      const response = await axios.get(config.url, {
        timeout: this.timeout,
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'ats-slug-discovery/1.0 (DevATS public job crawler)',
        },
      });

      if (response.status !== 200) return null;

      const jobs = config.extractor(response.data);
      if (Array.isArray(jobs) && jobs.length > 0) {
        return {
          company: cleanCompanyName(company),
          provider,
          slug,
          jobCount: jobs.length,
          endpoint: config.url,
        };
      }
      return null;
    } catch (err) {
      return null;
    }
  }

  /**
   * Probes a company across candidate slug variations and all 5 ATS platforms.
   */
  async discoverCompanyAts(
    companyName: string,
    explicitSlug?: string,
    knownAtsSlug?: string,
  ): Promise<DiscoveryProbeResult> {
    const candidateSlugs = this.generateCandidateSlugs(companyName, explicitSlug, knownAtsSlug);
    const providers: AtsProvider[] = [
      AtsProvider.GREENHOUSE,
      AtsProvider.ASHBY,
      AtsProvider.LEVER,
      AtsProvider.SMARTRECRUITERS,
    ];

    let testedCount = 0;

    for (const slug of candidateSlugs) {
      for (const provider of providers) {
        testedCount++;
        const hit = await this.probeEndpoint(companyName, provider, slug);
        if (hit) {
          this.logger.log(
            `🎯 Discovered ATS board for "${companyName}": [${provider}] ${slug} (${hit.jobCount} open positions)`
          );
          return {
            company: cleanCompanyName(companyName),
            candidateSlugs,
            hit,
            testedCount,
            probedProviders: providers,
          };
        }
        await new Promise((resolve) => setTimeout(resolve, 80));
      }
    }

    return {
      company: cleanCompanyName(companyName),
      candidateSlugs,
      testedCount,
      probedProviders: providers,
    };
  }

  /**
   * Runs the background discovery and automatic ingestion across all CSV rows.
   * Emits live progress events and maintains the activeJob state.
   */
  async startBackgroundCsvDiscovery(
    tierMax: number = 2,
    limit?: number,
    concurrency: number = 8,
    syncCallback?: (hit: DiscoveredAtsHit) => Promise<any>,
  ): Promise<BackgroundDiscoveryJob> {
    const rows = this.readCompanyCsv(tierMax, limit);
    const jobId = `job_${Date.now()}`;
    const startTime = Date.now();

    this.activeJob = {
      id: jobId,
      status: 'running',
      total: rows.length,
      processed: 0,
      discoveredCount: 0,
      totalJobsSynced: 0,
      results: [],
      startTime,
    };

    this.logger.log(
      `🚀 Started Background ATS Discovery [${jobId}] for ${rows.length} companies (Concurrency: ${concurrency})...`
    );

    // Asynchronously process in background
    (async () => {
      for (let i = 0; i < rows.length; i += concurrency) {
        const chunk = rows.slice(i, i + concurrency);
        const chunkPromises = chunk.map(async (row) => {
          this.activeJob!.currentCompany = row.company;
          const probe = await this.discoverCompanyAts(row.company, row.slug, row.knownAtsSlug);
          
          let syncResult: any = null;
          if (probe.hit && syncCallback) {
            try {
              syncResult = await syncCallback(probe.hit);
              if (syncResult && syncResult.success) {
                this.activeJob!.totalJobsSynced += syncResult.upsertedCount || probe.hit.jobCount;
              }
            } catch (err) {
              this.logger.error(`Error auto-syncing jobs for ${row.company}: ${err}`);
            }
          }

          if (probe.hit) {
            this.activeJob!.discoveredCount++;
          }

          this.activeJob!.processed++;
          this.activeJob!.results.push({
            company: row.company,
            hit: probe.hit,
            sync: syncResult,
          });

          this.progressSubject.next({
            type: probe.hit ? 'hit' : 'progress',
            current: this.activeJob!.processed,
            total: this.activeJob!.total,
            company: row.company,
            hit: probe.hit,
            totalDiscovered: this.activeJob!.discoveredCount,
            totalJobsSynced: this.activeJob!.totalJobsSynced,
          });
        });

        await Promise.all(chunkPromises);
      }

      this.activeJob!.status = 'completed';
      this.activeJob!.durationMs = Date.now() - startTime;
      this.logger.log(
        `✅ Background Discovery [${jobId}] Completed in ${(this.activeJob!.durationMs / 1000).toFixed(1)}s! Discovered: ${this.activeJob!.discoveredCount} boards, Synced: ${this.activeJob!.totalJobsSynced} jobs.`
      );

      this.progressSubject.next({
        type: 'complete',
        current: this.activeJob!.total,
        total: this.activeJob!.total,
        totalDiscovered: this.activeJob!.discoveredCount,
        totalJobsSynced: this.activeJob!.totalJobsSynced,
        durationMs: this.activeJob!.durationMs,
      });
    })().catch((err) => {
      this.logger.error(`Background Discovery error: ${err.message}`);
      if (this.activeJob) {
        this.activeJob.status = 'failed';
      }
    });

    return this.activeJob;
  }

  /**
   * Batch discover across multiple company names.
   */
  async discoverBatch(
    companies: { name: string; slug?: string }[],
    concurrency: number = 6,
  ): Promise<DiscoveryProbeResult[]> {
    const results: DiscoveryProbeResult[] = [];

    for (let i = 0; i < companies.length; i += concurrency) {
      const chunk = companies.slice(i, i + concurrency);
      const chunkResults = await Promise.all(
        chunk.map((c) => this.discoverCompanyAts(c.name, c.slug))
      );
      results.push(...chunkResults);
    }

    return results;
  }

  private getAtsEndpointConfig(provider: AtsProvider, slug: string) {
    switch (provider) {
      case AtsProvider.GREENHOUSE:
        return {
          url: `https://boards-api.greenhouse.io/v1/boards/${encodeURIComponent(slug)}/jobs?content=true`,
          extractor: (d: any) => d?.jobs || [],
        };
      case AtsProvider.LEVER:
        return {
          url: `https://api.lever.co/v0/postings/${encodeURIComponent(slug)}?mode=json`,
          extractor: (d: any) => (Array.isArray(d) ? d : []),
        };
      case AtsProvider.ASHBY:
        return {
          url: `https://api.ashbyhq.com/posting-api/job-board/${encodeURIComponent(slug)}`,
          extractor: (d: any) => d?.jobs || [],
        };
      case AtsProvider.SMARTRECRUITERS:
        return {
          url: `https://api.smartrecruiters.com/v1/companies/${encodeURIComponent(slug)}/postings`,
          extractor: (d: any) => d?.content || [],
        };
      default:
        return null;
    }
  }
}
