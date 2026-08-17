import { AtsProvider, ExperienceLevel, RoleCategory, WorkplaceType } from '@prisma/client';

export interface NormalizedJob {
  externalJobId: string;
  atsProvider: AtsProvider;
  title: string;
  department?: string;
  location?: string;
  workplaceType: WorkplaceType;
  allowedLocations?: string[];
  description: string;
  applyUrl: string;
  tags: string[];
  roleCategory: RoleCategory;
  experienceLevel: ExperienceLevel;
  salarySummary?: string;
  minSalary?: number;
  maxSalary?: number;
  currency?: string;
  postedAt?: Date;
}

export interface AtsAdapter {
  readonly provider: AtsProvider;
  fetchJobs(slug: string): Promise<NormalizedJob[]>;
}
