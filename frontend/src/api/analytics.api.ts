import axios from 'axios';
import { MarketOverview, RoleSalaryStat, TechDemandStat } from '../types/analytics';

const apiClient = axios.create({
  baseURL: '/api/v1/analytics',
  timeout: 15000,
});

export async function fetchMarketOverview(): Promise<MarketOverview> {
  const { data } = await apiClient.get<MarketOverview>('/overview');
  return data;
}

export async function fetchSalaryByRole(): Promise<RoleSalaryStat[]> {
  const { data } = await apiClient.get<RoleSalaryStat[]>('/salary-by-role');
  return data;
}

export async function fetchTechDemand(): Promise<TechDemandStat[]> {
  const { data } = await apiClient.get<TechDemandStat[]>('/tech-demand');
  return data;
}
