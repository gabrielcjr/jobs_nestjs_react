import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';
import { AtsProvider } from '@prisma/client';
import { AtsAdapter, NormalizedJob } from '../interfaces/ats-adapter.interface';
import { extractTechTags, inferRoleCategory, inferSeniority, inferWorkplaceType } from '../utils/tech-classifier.util';

@Injectable()
export class SmartRecruitersAdapter implements AtsAdapter {
  readonly provider = AtsProvider.SMARTRECRUITERS;
  private readonly logger = new Logger(SmartRecruitersAdapter.name);

  async fetchJobs(slug: string): Promise<NormalizedJob[]> {
    const url = `https://api.smartrecruiters.com/v1/companies/${encodeURIComponent(slug)}/postings`;
    try {
      const response = await axios.get(url, {
        timeout: 10000,
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'Mozilla/5.0 (compatible; JobBoardCrawler/1.0)',
        },
      });
      const rawJobs = response.data?.content || [];

      return rawJobs.map((item: any): NormalizedJob => {
        const title = item.name || 'Untitled';
        const loc = item.location || {};
        const locationParts = [loc.city, loc.region, loc.country].filter(Boolean);
        const location = locationParts.length > 0 ? locationParts.join(', ') : 'Unspecified';
        const workplace = item.workplaceType || (loc.remote ? 'remote' : '');
        const fullContent = `${title} ${item.department?.label || ''} ${item.function?.label || ''}`;

        return {
          externalJobId: String(item.id),
          atsProvider: this.provider,
          title,
          department: item.department?.label || undefined,
          location,
          workplaceType: inferWorkplaceType(location, workplace),
          description: `<h3>Job Details</h3><p>Role: ${title}</p><p>Department: ${item.department?.label || 'General'}</p><p>Experience: ${item.experienceLevel?.label || 'Not specified'}</p><p>Type of Employment: ${item.typeOfEmployment?.label || 'Full-time'}</p>`,
          applyUrl: item.ref || `https://jobs.smartrecruiters.com/${slug}/${item.id}`,
          tags: extractTechTags(fullContent),
          roleCategory: inferRoleCategory(title),
          experienceLevel: inferSeniority(title),
          postedAt: item.releasedDate ? new Date(item.releasedDate) : undefined,
        };
      });
    } catch (error: any) {
      this.logger.error(`Failed fetching SmartRecruiters jobs for slug ${slug}: ${error.message}`);
      return [];
    }
  }
}
