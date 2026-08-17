import axios from 'axios';
import { AtsProvider, Job, JobFilters, PaginatedJobsResponse } from '../types/jobs';

const API_BASE = '/api/v1';

const apiClient = axios.create({
  baseURL: API_BASE,
  timeout: 30000,
});

export interface DiscoveredHit {
  company: string;
  provider: AtsProvider;
  slug: string;
  jobCount: number;
  endpoint: string;
}

export interface DiscoveryResult {
  company: string;
  candidateSlugs: string[];
  hit?: DiscoveredHit;
  testedCount: number;
  probedProviders: AtsProvider[];
}

export interface BackgroundDiscoveryJob {
  id: string;
  status: 'running' | 'completed' | 'failed';
  total: number;
  processed: number;
  discoveredCount: number;
  totalJobsSynced: number;
  currentCompany?: string;
  results: { company: string; hit?: DiscoveredHit; sync?: any }[];
  startTime: number;
  durationMs?: number;
}

export interface DiscoveryProgressEvent {
  type: 'progress' | 'hit' | 'complete' | 'error';
  current: number;
  total: number;
  company?: string;
  hit?: DiscoveredHit;
  totalDiscovered: number;
  totalJobsSynced: number;
  durationMs?: number;
}

export async function fetchJobs(filters: JobFilters): Promise<PaginatedJobsResponse> {
  const params: Record<string, any> = {
    page: filters.page || 1,
    limit: filters.limit || 20,
    sortBy: filters.sortBy || 'postedAt',
    sortOrder: filters.sortOrder || 'desc',
  };

  if (filters.search && filters.search.trim()) {
    params.search = filters.search.trim();
  }

  if (filters.roleCategory && filters.roleCategory !== 'ALL') {
    params.roleCategory = filters.roleCategory;
  }

  if (filters.experienceLevel && filters.experienceLevel !== 'ALL') {
    params.experienceLevel = filters.experienceLevel;
  }

  if (filters.workplaceType && filters.workplaceType !== 'ALL') {
    params.workplaceType = filters.workplaceType;
  }

  if (filters.atsProvider && filters.atsProvider !== 'ALL') {
    params.atsProvider = filters.atsProvider;
  }

  if (filters.datePosted && filters.datePosted !== 'all') {
    params.datePosted = filters.datePosted;
  }

  if (filters.minSalary && filters.minSalary > 0) {
    params.minSalary = filters.minSalary;
  }

  if (filters.latamUsdOnly) {
    params.latamUsdOnly = true;
  }

  if (filters.tags && filters.tags.length > 0) {
    params.tags = filters.tags.join(',');
  }

  const response = await apiClient.get<PaginatedJobsResponse>('/jobs', { params });
  return response.data;
}

export async function fetchJobByIdOrSlug(idOrSlug: string): Promise<Job> {
  const response = await apiClient.get<{ success: boolean; data: Job }>(`/jobs/${encodeURIComponent(idOrSlug)}`);
  return response.data.data;
}

export async function fetchTopTags(): Promise<{ name: string; count: number }[]> {
  const response = await apiClient.get<{ success: boolean; data: { name: string; count: number }[] }>('/jobs/tags');
  return response.data.data;
}

export async function fetchCsvSummary(tier: number = 1): Promise<{ totalRows: number; tier: number; sample: any[] }> {
  const response = await apiClient.get<{ success: boolean; data: { totalRows: number; tier: number; sample: any[] } }>(
    '/ingest/csv-summary',
    { params: { tier } }
  );
  return response.data.data;
}

export async function startBackgroundCsvDiscovery(
  tier: number = 1,
  limit?: number,
  concurrency: number = 8,
): Promise<{ success: boolean; data: BackgroundDiscoveryJob }> {
  const response = await apiClient.post('/ingest/start-csv-discovery', { tier, limit, concurrency });
  return response.data;
}

export async function fetchDiscoveryStatus(): Promise<BackgroundDiscoveryJob | null> {
  const response = await apiClient.get<{ success: boolean; data: BackgroundDiscoveryJob | null }>(
    '/ingest/discovery-status'
  );
  return response.data.data;
}

export async function triggerDiscoverCompany(companyName: string, slug?: string): Promise<{ success: boolean; data: DiscoveryResult }> {
  const response = await apiClient.post('/ingest/discover', { companyName, slug });
  return response.data;
}

export async function triggerDiscoverAndSync(
  companyName: string,
  slug?: string,
): Promise<{ success: boolean; data: { discovery: DiscoveryResult; sync?: any } }> {
  const response = await apiClient.post('/ingest/discover-and-sync', { companyName, slug });
  return response.data;
}

export async function triggerDiscoverBatch(companies: string[]): Promise<any> {
  const response = await apiClient.post('/ingest/discover-batch', { companies });
  return response.data;
}
