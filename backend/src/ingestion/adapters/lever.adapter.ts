import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';
import { AtsProvider } from '@prisma/client';
import { AtsAdapter, NormalizedJob } from '../interfaces/ats-adapter.interface';
import { extractTechTags, inferRoleCategory, inferSeniority, inferWorkplaceType, isItJob } from '../utils/tech-classifier.util';

@Injectable()
export class LeverAdapter implements AtsAdapter {
  readonly provider = AtsProvider.LEVER;
  private readonly logger = new Logger(LeverAdapter.name);

  async fetchJobs(slug: string): Promise<NormalizedJob[]> {
    const url = `https://api.lever.co/v0/postings/${encodeURIComponent(slug)}?mode=json`;
    try {
      const response = await axios.get(url, {
        timeout: 10000,
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'Mozilla/5.0 (compatible; JobBoardCrawler/1.0)',
        },
      });
      const rawJobs = Array.isArray(response.data) ? response.data : [];

      return rawJobs
        .filter((posting: any) => isItJob(posting.text || '', posting.categories?.department || posting.categories?.team))
        .map((posting: any): NormalizedJob => {
        const title = posting.text || 'Untitled';
        const location = posting.categories?.location || 'Unspecified';
        const workplace = posting.categories?.workplaceType || '';
        const description = [
          posting.descriptionPlain || posting.description || '',
          posting.additionalPlain || posting.additional || '',
          ...(posting.lists || []).map((l: any) => `${l.text}\n${l.content}`),
        ].filter(Boolean).join('\n\n');

        const fullContent = `${title} ${description}`;
        const salaryRange = posting.salaryRange;

        return {
          externalJobId: String(posting.id),
          atsProvider: this.provider,
          title,
          department: posting.categories?.department || posting.categories?.team || undefined,
          location,
          workplaceType: inferWorkplaceType(location, workplace),
          description,
          applyUrl: posting.applyUrl || posting.hostedUrl || `https://jobs.lever.co/${slug}/${posting.id}`,
          tags: extractTechTags(fullContent),
          roleCategory: inferRoleCategory(title),
          experienceLevel: inferSeniority(title),
          minSalary: salaryRange?.min ? Number(salaryRange.min) : undefined,
          maxSalary: salaryRange?.max ? Number(salaryRange.max) : undefined,
          currency: salaryRange?.currency || 'USD',
          salarySummary: salaryRange ? `${salaryRange.currency || '$'} ${Number(salaryRange.min).toLocaleString()} - ${Number(salaryRange.max).toLocaleString()}` : undefined,
          postedAt: posting.createdAt ? new Date(posting.createdAt) : undefined,
        };
      });
    } catch (error: any) {
      this.logger.error(`Failed fetching Lever jobs for slug ${slug}: ${error.message}`);
      return [];
    }
  }
}
