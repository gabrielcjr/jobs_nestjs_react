export type AtsProvider = 'GREENHOUSE' | 'LEVER' | 'ASHBY' | 'SMARTRECRUITERS';

export type WorkplaceType = 'REMOTE' | 'HYBRID' | 'ONSITE' | 'UNSPECIFIED';

export type ExperienceLevel =
  | 'INTERN'
  | 'JUNIOR'
  | 'MID'
  | 'SENIOR'
  | 'STAFF_PLUS'
  | 'LEAD'
  | 'UNSPECIFIED';

export type RoleCategory =
  | 'BACKEND'
  | 'FRONTEND'
  | 'FULLSTACK'
  | 'DEVOPS_SRE_INFRA'
  | 'MOBILE'
  | 'DATA_AI_ML'
  | 'SECURITY'
  | 'ENGINEERING_MANAGEMENT'
  | 'OTHER';

export interface Company {
  id: string;
  name: string;
  slug: string;
  atsProvider: AtsProvider;
  websiteUrl?: string | null;
  logoUrl?: string | null;
}

export interface Job {
  id: string;
  externalJobId: string;
  atsProvider: AtsProvider;
  title: string;
  slug: string;
  companyId: string;
  company: Company;
  roleCategory: RoleCategory;
  experienceLevel: ExperienceLevel;
  tags: string[];
  department?: string | null;
  location?: string | null;
  workplaceType: WorkplaceType;
  allowedLocations?: string[];
  description: string;
  applyUrl: string;
  minSalary?: number | null;
  maxSalary?: number | null;
  currency?: string | null;
  salarySummary?: string | null;
  postedAt?: string | null;
  firstSeenAt: string;
  lastSeenAt: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface JobFacets {
  roleCategoryCounts: Record<string, number>;
  experienceLevelCounts: Record<string, number>;
  workplaceTypeCounts: Record<string, number>;
  atsProviderCounts: Record<string, number>;
  topTags: { name: string; count: number }[];
}

export interface PaginatedJobsResponse {
  jobs: Job[];
  totalCount: number;
  page: number;
  totalPages: number;
  limit: number;
  facets: JobFacets;
}

export interface JobFilters {
  search: string;
  roleCategory?: RoleCategory | 'ALL';
  experienceLevel?: ExperienceLevel | 'ALL';
  tags: string[];
  workplaceType?: WorkplaceType | 'ALL';
  atsProvider?: AtsProvider | 'ALL';
  datePosted?: '24h' | '7d' | '30d' | 'all';
  minSalary?: number;
  latamUsdOnly?: boolean;
  sortBy?: 'postedAt' | 'firstSeenAt' | 'minSalary' | 'title';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}
