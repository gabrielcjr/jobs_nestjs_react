import React from 'react';
import {
  X,
  TrendingUp,
  DollarSign,
  Briefcase,
  Globe,
  Building2,
  Sparkles,
  Layers,
} from 'lucide-react';
import {
  useMarketOverview,
  useSalaryByRole,
  useTechDemand,
} from '../hooks/useAnalytics';

interface AnalyticsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

function formatCompactSalary(val: number): string {
  if (!val || val <= 0) return '$0';
  return `$${Math.round(val / 1000)}k`;
}

export const AnalyticsModal: React.FC<AnalyticsModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { data: overview, isLoading: isOverviewLoading } = useMarketOverview();
  const { data: salaryRoles, isLoading: isSalaryLoading } = useSalaryByRole();
  const { data: techDemand, isLoading: isTechLoading } = useTechDemand();

  if (!isOpen) return null;

  const maxSalaryValue =
    salaryRoles && salaryRoles.length > 0
      ? Math.max(...salaryRoles.map((r) => r.avgMaxSalary || 1))
      : 250000;

  return (
    <div
      data-testid="analytics-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200"
    >
      <div className="relative w-full max-w-4xl max-h-[90vh] bg-dark-900 border border-dark-750 rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-dark-750 bg-dark-900/90">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-brand-500/10 border border-brand-500/30 text-brand-400">
              <TrendingUp className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <span>Software Engineering Market Intelligence</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                  LIVE BENCHMARKS
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Aggregated compensation & tech stack distributions across active ATS listings
              </p>
            </div>
          </div>

          <button
            type="button"
            data-testid="close-analytics-modal"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-dark-800 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Section 1: KPI Cards */}
          <div
            data-testid="analytics-kpi-grid"
            className="grid grid-cols-2 md:grid-cols-4 gap-3.5"
          >
            {/* Card 1: Active Roles */}
            <div className="p-4 rounded-xl bg-dark-850 border border-dark-750">
              <div className="flex items-center justify-between text-slate-400 mb-2">
                <span className="text-[11px] font-mono uppercase">Live Roles</span>
                <Briefcase className="h-4 w-4 text-brand-400" />
              </div>
              <div className="text-2xl font-bold text-white">
                {isOverviewLoading ? '...' : overview?.totalActiveJobs || 0}
              </div>
              <span className="text-[10px] text-slate-500">
                Across {overview?.totalCompanies || 0} top tech employers
              </span>
            </div>

            {/* Card 2: Remote Friendly Ratio */}
            <div className="p-4 rounded-xl bg-dark-850 border border-dark-750">
              <div className="flex items-center justify-between text-slate-400 mb-2">
                <span className="text-[11px] font-mono uppercase">Remote Ratio</span>
                <Globe className="h-4 w-4 text-cyan-400" />
              </div>
              <div className="text-2xl font-bold text-cyan-300">
                {isOverviewLoading ? '...' : `${overview?.remotePercent || 0}%`}
              </div>
              <span className="text-[10px] text-slate-500">
                {overview?.remoteJobsCount || 0} remote roles available
              </span>
            </div>

            {/* Card 3: Salary Transparency */}
            <div className="p-4 rounded-xl bg-dark-850 border border-dark-750">
              <div className="flex items-center justify-between text-slate-400 mb-2">
                <span className="text-[11px] font-mono uppercase">Salary Disclosed</span>
                <DollarSign className="h-4 w-4 text-emerald-400" />
              </div>
              <div className="text-2xl font-bold text-emerald-400">
                {isOverviewLoading ? '...' : `${overview?.salaryDisclosedPercent || 0}%`}
              </div>
              <span className="text-[10px] text-slate-500">
                {overview?.salaryDisclosedCount || 0} roles with pay ranges
              </span>
            </div>

            {/* Card 4: LATAM Eligible */}
            <div className="p-4 rounded-xl bg-dark-850 border border-dark-750">
              <div className="flex items-center justify-between text-slate-400 mb-2">
                <span className="text-[11px] font-mono uppercase">LATAM Remote</span>
                <Sparkles className="h-4 w-4 text-amber-400" />
              </div>
              <div className="text-2xl font-bold text-amber-300">
                {isOverviewLoading ? '...' : overview?.latamEligibleCount || 0}
              </div>
              <span className="text-[10px] text-slate-500">
                USD compensation eligible
              </span>
            </div>
          </div>

          {/* Section 2: Compensation Benchmarks by Role */}
          <div
            data-testid="analytics-salary-role-chart"
            className="p-5 rounded-xl bg-dark-850/80 border border-dark-750 space-y-4"
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-white">
                  Average Compensation by Engineering Domain
                </h3>
                <p className="text-[11px] text-slate-400">
                  Showing average base salary ranges (USD) across role categories
                </p>
              </div>
            </div>

            {isSalaryLoading ? (
              <div className="py-8 text-center text-xs text-slate-500 font-mono">
                Calculating salary distributions from database...
              </div>
            ) : (
              <div className="space-y-3 pt-1">
                {salaryRoles && salaryRoles.length > 0 ? (
                  salaryRoles.map((role) => {
                    const maxBarPercent = Math.min(
                      100,
                      Math.round((role.avgMaxSalary / maxSalaryValue) * 100),
                    );
                    const minBarPercent = Math.min(
                      maxBarPercent,
                      Math.round((role.avgMinSalary / maxSalaryValue) * 100),
                    );

                    return (
                      <div key={role.roleCategory} className="space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-semibold text-slate-200">
                            {role.roleLabel}
                          </span>
                          <div className="flex items-center gap-2 font-mono text-[11px]">
                            <span className="text-slate-400">
                              {role.jobCount} roles
                            </span>
                            <span className="font-bold text-emerald-400">
                              {formatCompactSalary(role.avgMinSalary)} –{' '}
                              {formatCompactSalary(role.avgMaxSalary)}
                            </span>
                          </div>
                        </div>

                        {/* Salary Visual Bar */}
                        <div className="h-2.5 w-full bg-dark-950 rounded-full overflow-hidden flex border border-dark-750">
                          <div
                            style={{ width: `${minBarPercent}%` }}
                            className="bg-brand-500/40 h-full rounded-l-full"
                          />
                          <div
                            style={{
                              width: `${Math.max(
                                5,
                                maxBarPercent - minBarPercent,
                              )}%`,
                            }}
                            className="bg-emerald-500 h-full rounded-r-full shadow-sm shadow-emerald-500/50"
                          />
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="py-4 text-center text-xs text-slate-500">
                    No disclosed salary records found in database yet.
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Section 3: High-Demand Tech Skills */}
          <div
            data-testid="analytics-tech-ranking"
            className="p-5 rounded-xl bg-dark-850/80 border border-dark-750 space-y-4"
          >
            <div>
              <h3 className="text-sm font-bold text-white">
                Top In-Demand Technologies & Salary Premiums
              </h3>
              <p className="text-[11px] text-slate-400">
                Most requested skills extracted from ingested job requirements
              </p>
            </div>

            {isTechLoading ? (
              <div className="py-6 text-center text-xs text-slate-500 font-mono">
                Ranking tech stack extractions...
              </div>
            ) : (
              <div className="flex flex-wrap gap-2 pt-1">
                {techDemand && techDemand.length > 0 ? (
                  techDemand.map((tech, idx) => (
                    <div
                      key={tech.tag}
                      className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-dark-900 border border-dark-700 text-xs"
                    >
                      <span className="font-mono text-[10px] text-slate-500">
                        #{idx + 1}
                      </span>
                      <span className="font-semibold text-slate-200">
                        {tech.tag}
                      </span>
                      <span className="px-1.5 py-0.2 rounded bg-dark-800 text-[10px] font-mono text-brand-300">
                        {tech.jobCount} jobs
                      </span>
                      {tech.avgMaxSalary > 0 && (
                        <span className="font-mono text-[10px] font-semibold text-emerald-400">
                          {formatCompactSalary(tech.avgMaxSalary)}
                        </span>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="text-xs text-slate-500">
                    No tech tags indexed yet.
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
