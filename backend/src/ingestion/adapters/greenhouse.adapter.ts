import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';
import { AtsProvider } from '@prisma/client';
import { AtsAdapter, NormalizedJob } from '../interfaces/ats-adapter.interface';
import { extractTechTags, inferRoleCategory, inferSeniority, inferWorkplaceType, unescapeHtml } from '../utils/tech-classifier.util';

@Injectable()
export class GreenhouseAdapter implements AtsAdapter {
  readonly provider = AtsProvider.GREENHOUSE;
  private readonly logger = new Logger(GreenhouseAdapter.name);

  async fetchJobs(slug: string): Promise<NormalizedJob[]> {
    const url = `https://boards-api.greenhouse.io/v1/boards/${encodeURIComponent(slug)}/jobs?content=true`;
    try {
      const response = await axios.get(url, {
        timeout: 10000,
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'Mozilla/5.0 (compatible; JobBoardCrawler/1.0)',
        },
      });
      const rawJobs = response.data?.jobs || [];

      return rawJobs.map((job: any): NormalizedJob => {
        const title = job.title || 'Untitled';
        const description = job.content ? unescapeHtml(String(job.content)) : '';
        const location = job.location?.name || 'Unspecified';
        const fullContent = `${title} ${description}`;

        return {
          externalJobId: String(job.id),
          atsProvider: this.provider,
          title,
          department: job.departments?.[0]?.name || undefined,
          location,
          workplaceType: inferWorkplaceType(location),
          description,
          applyUrl: job.absolute_url || `https://boards.greenhouse.io/${slug}/jobs/${job.id}`,
          tags: extractTechTags(fullContent),
          roleCategory: inferRoleCategory(title),
          experienceLevel: inferSeniority(title),
          postedAt: job.updated_at ? new Date(job.updated_at) : undefined,
        };
      });
    } catch (error: any) {
      this.logger.error(`Failed fetching Greenhouse jobs for slug ${slug}: ${error.message}`);
      return [];
    }
  }
}
