import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';
import { AtsProvider } from '@prisma/client';
import { AtsAdapter, NormalizedJob } from '../interfaces/ats-adapter.interface';
import { extractTechTags, inferRoleCategory, inferSeniority, inferWorkplaceType } from '../utils/tech-classifier.util';

@Injectable()
export class AshbyAdapter implements AtsAdapter {
  readonly provider = AtsProvider.ASHBY;
  private readonly logger = new Logger(AshbyAdapter.name);

  async fetchJobs(slug: string): Promise<NormalizedJob[]> {
    const url = `https://api.ashbyhq.com/posting-api/job-board/${encodeURIComponent(slug)}?includeCompensation=true`;
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
        const location = job.location || job.locationName || (job.secondaryLocations?.length ? job.secondaryLocations.join(', ') : 'Unspecified');
        const workplace = job.workplaceType || '';
        const description = job.descriptionHtml || job.descriptionPlain || '';
        const fullContent = `${title} ${description}`;

        let minSalary: number | undefined;
        let maxSalary: number | undefined;
        let currency: string | undefined = 'USD';
        let salarySummary = job.compensation?.summary || job.compensationSummary || undefined;

        if (job.compensation?.tierSummary) {
          salarySummary = job.compensation.tierSummary;
        }

        return {
          externalJobId: String(job.id),
          atsProvider: this.provider,
          title,
          department: job.department || job.departmentName || job.team || undefined,
          location,
          workplaceType: inferWorkplaceType(location, workplace),
          description,
          applyUrl: job.applyUrl || job.jobUrl || `https://jobs.ashbyhq.com/${slug}/${job.id}`,
          tags: extractTechTags(fullContent),
          roleCategory: inferRoleCategory(title),
          experienceLevel: inferSeniority(title),
          minSalary,
          maxSalary,
          currency,
          salarySummary,
          postedAt: job.publishedAt ? new Date(job.publishedAt) : undefined,
        };
      });
    } catch (error: any) {
      this.logger.error(`Failed fetching Ashby jobs for slug ${slug}: ${error.message}`);
      return [];
    }
  }
}
