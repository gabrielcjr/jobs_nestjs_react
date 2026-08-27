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
        let currency: string | undefined = job.compensation?.currency || 'USD';
        let salarySummary = job.compensation?.summary || job.compensationSummary || job.compensation?.tierSummary || job.compensationTierSummary || undefined;

        if (job.compensation?.minCompensation !== undefined) {
          minSalary = Number(job.compensation.minCompensation);
        } else if (job.compensation?.min !== undefined) {
          minSalary = Number(job.compensation.min);
        }

        if (job.compensation?.maxCompensation !== undefined) {
          maxSalary = Number(job.compensation.maxCompensation);
        } else if (job.compensation?.max !== undefined) {
          maxSalary = Number(job.compensation.max);
        }

        if ((minSalary === undefined || maxSalary === undefined) && Array.isArray(job.compensation?.compensationTiers) && job.compensation.compensationTiers.length > 0) {
          const tier = job.compensation.compensationTiers[0];
          if (minSalary === undefined) {
            const tierMin = tier.minCompensation ?? tier.minCompensationAmount ?? tier.min ?? tier.minSalary;
            if (tierMin !== undefined) minSalary = Number(tierMin);
          }
          if (maxSalary === undefined) {
            const tierMax = tier.maxCompensation ?? tier.maxCompensationAmount ?? tier.max ?? tier.maxSalary;
            if (tierMax !== undefined) maxSalary = Number(tierMax);
          }
          if (!currency && tier.currency) {
            currency = tier.currency;
          }
        }

        if ((minSalary === undefined || maxSalary === undefined) && salarySummary) {
          const matches = salarySummary.match(/(?:[\$€£]|USD|EUR|GBP)?\s*([\d,]+)(?:\s*(?:k|thousand))?\s*(?:-|to)\s*(?:[\$€£]|USD|EUR|GBP)?\s*([\d,]+)(?:\s*(?:k|thousand))?/i);
          if (matches) {
            let parsedMin = Number(matches[1].replace(/,/g, ''));
            let parsedMax = Number(matches[2].replace(/,/g, ''));
            if (/k|thousand/i.test(matches[0])) {
              if (parsedMin < 1000) parsedMin *= 1000;
              if (parsedMax < 1000) parsedMax *= 1000;
            }
            if (!isNaN(parsedMin) && minSalary === undefined) minSalary = parsedMin;
            if (!isNaN(parsedMax) && maxSalary === undefined) maxSalary = parsedMax;
          }
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
