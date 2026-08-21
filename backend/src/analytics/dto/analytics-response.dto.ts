export interface MarketOverviewDto {
  totalActiveJobs: number;
  totalCompanies: number;
  salaryDisclosedCount: number;
  salaryDisclosedPercent: number;
  remoteJobsCount: number;
  remotePercent: number;
  latamEligibleCount: number;
}

export interface RoleSalaryStatDto {
  roleCategory: string;
  roleLabel: string;
  jobCount: number;
  avgMinSalary: number;
  avgMaxSalary: number;
}

export interface TechDemandStatDto {
  tag: string;
  jobCount: number;
  avgMaxSalary: number;
}
