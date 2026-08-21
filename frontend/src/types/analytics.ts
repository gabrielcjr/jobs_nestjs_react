export interface MarketOverview {
  totalActiveJobs: number;
  totalCompanies: number;
  salaryDisclosedCount: number;
  salaryDisclosedPercent: number;
  remoteJobsCount: number;
  remotePercent: number;
  latamEligibleCount: number;
}

export interface RoleSalaryStat {
  roleCategory: string;
  roleLabel: string;
  jobCount: number;
  avgMinSalary: number;
  avgMaxSalary: number;
}

export interface TechDemandStat {
  tag: string;
  jobCount: number;
  avgMaxSalary: number;
}
