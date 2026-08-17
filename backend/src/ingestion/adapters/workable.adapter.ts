import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';
import { AtsProvider, WorkplaceType } from '@prisma/client';
import { AtsAdapter, NormalizedJob } from '../interfaces/ats-adapter.interface';
import { extractTechTags, inferRoleCategory, inferSeniority, inferWorkplaceType } from '../utils/tech-classifier.util';

@Injectable()
export class WorkableAdapter implements AtsAdapter {
  readonly provider = AtsProvider.WORKABLE;
  private readonly logger = new Logger(WorkableAdapter.name);

  async fetchJobs(slug: string): Promise<NormalizedJob[]> {
    const url = `https://apply.workable.com/api/v1/widget/accounts/${encodeURIComponent(slug)}`;
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
        const locationParts = [job.city, job.state, job.country].filter(Boolean);
        const location = locationParts.length > 0 ? locationParts.join(', ') : 'Unspecified';
        const description = [job.description, job.requirements, job.benefits].filter(Boolean).join('\n\n') || '';
        const fullContent = `${title} ${description}`;

        return {
          externalJobId: String(job.shortcode || job.id),
          atsProvider: this.provider,
          title,
          department: job.department || undefined,
          location,
          workplaceType: job.telecommuting ? WorkplaceType.REMOTE : inferWorkplaceType(location, job.workplace),
          description,
          applyUrl: job.url || `https://apply.workable.com/${slug}/j/${job.shortcode || job.id}/`,
          tags: extractTechTags(fullContent),
          roleCategory: inferRoleCategory(title),
          experienceLevel: inferSeniority(title),
          postedAt: job.published_on || job.created_at ? new Date(job.published_on || job.created_at) : undefined,
        };
      });
    } catch (error: any) {
      this.logger.error(`Failed fetching Workable jobs for slug ${slug}: ${error.message}`);
      return [];
    }
  }
}
