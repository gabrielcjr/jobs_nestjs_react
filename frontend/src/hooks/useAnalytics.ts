import { useQuery } from '@tanstack/react-query';
import {
  fetchMarketOverview,
  fetchSalaryByRole,
  fetchTechDemand,
} from '../api/analytics.api';

export function useMarketOverview() {
  return useQuery({
    queryKey: ['analytics', 'overview'],
    queryFn: fetchMarketOverview,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

export function useSalaryByRole() {
  return useQuery({
    queryKey: ['analytics', 'salary-by-role'],
    queryFn: fetchSalaryByRole,
    staleTime: 1000 * 60 * 5,
  });
}

export function useTechDemand() {
  return useQuery({
    queryKey: ['analytics', 'tech-demand'],
    queryFn: fetchTechDemand,
    staleTime: 1000 * 60 * 5,
  });
}
