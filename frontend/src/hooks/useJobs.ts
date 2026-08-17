import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  fetchJobs,
  fetchJobByIdOrSlug,
  triggerDiscoverCompany,
  triggerDiscoverAndSync,
  triggerDiscoverBatch,
  startBackgroundCsvDiscovery,
  fetchDiscoveryStatus,
  fetchCsvSummary,
  fetchTopTags,
} from '../api/jobs.api';
import { JobFilters } from '../types/jobs';

export function useJobs(filters: JobFilters) {
  return useQuery({
    queryKey: ['jobs', filters],
    queryFn: () => fetchJobs(filters),
    staleTime: 1000 * 30, // 30 seconds
    refetchOnWindowFocus: false,
  });
}

export function useJobDetail(idOrSlug: string | null) {
  return useQuery({
    queryKey: ['job', idOrSlug],
    queryFn: () => (idOrSlug ? fetchJobByIdOrSlug(idOrSlug) : null),
    enabled: Boolean(idOrSlug),
    staleTime: 1000 * 60 * 2,
  });
}

export function useTopTags() {
  return useQuery({
    queryKey: ['tags'],
    queryFn: fetchTopTags,
    staleTime: 1000 * 60 * 5,
  });
}

export function useCsvSummary(tier: number = 1) {
  return useQuery({
    queryKey: ['csv-summary', tier],
    queryFn: () => fetchCsvSummary(tier),
    staleTime: 1000 * 60 * 10,
  });
}

export function useDiscoveryStatus() {
  return useQuery({
    queryKey: ['discovery-status'],
    queryFn: fetchDiscoveryStatus,
    refetchInterval: (query) => {
      const data = query.state.data;
      return data?.status === 'running' ? 1500 : false;
    },
  });
}

export function useStartBackgroundDiscovery() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ tier, limit }: { tier?: number; limit?: number }) =>
      startBackgroundCsvDiscovery(tier, limit),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['discovery-status'] });
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
      queryClient.invalidateQueries({ queryKey: ['tags'] });
    },
  });
}

export function useDiscoverAndSync() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ companyName, slug }: { companyName: string; slug?: string }) =>
      triggerDiscoverAndSync(companyName, slug),
    onSuccess: (res) => {
      if (res.success) {
        queryClient.invalidateQueries({ queryKey: ['jobs'] });
        queryClient.invalidateQueries({ queryKey: ['tags'] });
      }
    },
  });
}

export function useDiscoverBatch() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (companies: string[]) => triggerDiscoverBatch(companies),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
      queryClient.invalidateQueries({ queryKey: ['tags'] });
    },
  });
}
