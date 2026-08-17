import React from 'react';
import { Search, X, SlidersHorizontal, ArrowUpDown, DollarSign, Calendar, MapPin, Building2, UserCheck } from 'lucide-react';
import { AtsProvider, ExperienceLevel, JobFilters, WorkplaceType } from '../types/jobs';

interface FilterBarProps {
  filters: JobFilters;
  onFilterChange: (newFilters: Partial<JobFilters>) => void;
  onResetFilters: () => void;
  hasActiveFilters: boolean;
}

export const FilterBar: React.FC<FilterBarProps> = ({
  filters,
  onFilterChange,
  onResetFilters,
  hasActiveFilters,
}) => {
  return (
    <div className="bg-dark-900/80 rounded-2xl border border-dark-750 p-3 lg:p-4 space-y-3">
      {/* Primary Search Input */}
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        <input
          type="text"
          value={filters.search}
          onChange={(e) => onFilterChange({ search: e.target.value, page: 1 })}
          placeholder="Search by title, skills (e.g. Go, React, Rust), company, or location..."
          className="w-full bg-dark-950 border border-dark-700 focus:border-brand-500 focus:ring-1 focus:ring-brand-500/50 rounded-xl pl-10 pr-10 py-2.5 text-sm text-slate-100 placeholder-slate-500 transition-all outline-none"
        />
        {filters.search && (
          <button
            onClick={() => onFilterChange({ search: '', page: 1 })}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-200 transition-colors"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {/* Multi-faceted Dropdowns Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 pt-1">
        {/* 1. Seniority Level */}
        <div className="relative">
          <label className="block text-[10px] uppercase font-mono text-slate-400 mb-1 flex items-center gap-1">
            <UserCheck className="h-3 w-3 text-indigo-400" /> Seniority
          </label>
          <select
            value={filters.experienceLevel || 'ALL'}
            onChange={(e) =>
              onFilterChange({
                experienceLevel: e.target.value as ExperienceLevel | 'ALL',
                page: 1,
              })
            }
            className="w-full bg-dark-850 border border-dark-700 hover:border-dark-600 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 outline-none focus:border-brand-500 cursor-pointer"
          >
            <option value="ALL">All Levels</option>
            <option value="INTERN">Intern</option>
            <option value="JUNIOR">Junior</option>
            <option value="MID">Mid-Level</option>
            <option value="SENIOR">Senior</option>
            <option value="STAFF_PLUS">Staff / Principal</option>
            <option value="LEAD">Lead / Architect</option>
          </select>
        </div>

        {/* 2. Workplace Type */}
        <div className="relative">
          <label className="block text-[10px] uppercase font-mono text-slate-400 mb-1 flex items-center gap-1">
            <MapPin className="h-3 w-3 text-emerald-400" /> Workplace
          </label>
          <select
            value={filters.workplaceType || 'ALL'}
            onChange={(e) =>
              onFilterChange({
                workplaceType: e.target.value as WorkplaceType | 'ALL',
                page: 1,
              })
            }
            className="w-full bg-dark-850 border border-dark-700 hover:border-dark-600 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 outline-none focus:border-brand-500 cursor-pointer"
          >
            <option value="ALL">All Workplaces</option>
            <option value="REMOTE">Remote</option>
            <option value="HYBRID">Hybrid</option>
            <option value="ONSITE">On-site</option>
          </select>
        </div>

        {/* 3. ATS Source Provider */}
        <div className="relative">
          <label className="block text-[10px] uppercase font-mono text-slate-400 mb-1 flex items-center gap-1">
            <Building2 className="h-3 w-3 text-cyan-400" /> ATS Source
          </label>
          <select
            value={filters.atsProvider || 'ALL'}
            onChange={(e) =>
              onFilterChange({
                atsProvider: e.target.value as AtsProvider | 'ALL',
                page: 1,
              })
            }
            className="w-full bg-dark-850 border border-dark-700 hover:border-dark-600 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 outline-none focus:border-brand-500 cursor-pointer"
          >
            <option value="ALL">All ATS Sources</option>
            <option value="GREENHOUSE">Greenhouse</option>
            <option value="LEVER">Lever</option>
            <option value="ASHBY">Ashby</option>
            <option value="WORKABLE">Workable</option>
            <option value="SMARTRECRUITERS">SmartRecruiters</option>
          </select>
        </div>

        {/* 4. Date Posted Preset */}
        <div className="relative">
          <label className="block text-[10px] uppercase font-mono text-slate-400 mb-1 flex items-center gap-1">
            <Calendar className="h-3 w-3 text-purple-400" /> Date Posted
          </label>
          <select
            value={filters.datePosted || 'all'}
            onChange={(e) =>
              onFilterChange({
                datePosted: e.target.value as any,
                page: 1,
              })
            }
            className="w-full bg-dark-850 border border-dark-700 hover:border-dark-600 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 outline-none focus:border-brand-500 cursor-pointer"
          >
            <option value="all">Anytime</option>
            <option value="24h">Past 24 Hours</option>
            <option value="7d">Past 7 Days</option>
            <option value="30d">Past 30 Days</option>
          </select>
        </div>

        {/* 5. Minimum Salary */}
        <div className="relative">
          <label className="block text-[10px] uppercase font-mono text-slate-400 mb-1 flex items-center gap-1">
            <DollarSign className="h-3 w-3 text-amber-400" /> Min Salary
          </label>
          <select
            value={filters.minSalary || 0}
            onChange={(e) =>
              onFilterChange({
                minSalary: Number(e.target.value) || undefined,
                page: 1,
              })
            }
            className="w-full bg-dark-850 border border-dark-700 hover:border-dark-600 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 outline-none focus:border-brand-500 cursor-pointer"
          >
            <option value="0">Any Salary</option>
            <option value="100000">$100k+ / yr</option>
            <option value="140000">$140k+ / yr</option>
            <option value="180000">$180k+ / yr</option>
            <option value="220000">$220k+ / yr</option>
          </select>
        </div>

        {/* 6. Sorting Order */}
        <div className="relative">
          <label className="block text-[10px] uppercase font-mono text-slate-400 mb-1 flex items-center gap-1">
            <ArrowUpDown className="h-3 w-3 text-slate-400" /> Sort By
          </label>
          <select
            value={`${filters.sortBy}:${filters.sortOrder}`}
            onChange={(e) => {
              const [sortBy, sortOrder] = e.target.value.split(':');
              onFilterChange({
                sortBy: sortBy as any,
                sortOrder: sortOrder as any,
                page: 1,
              });
            }}
            className="w-full bg-dark-850 border border-dark-700 hover:border-dark-600 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 outline-none focus:border-brand-500 cursor-pointer"
          >
            <option value="postedAt:desc">Date Posted (Newest)</option>
            <option value="firstSeenAt:desc">First Ingested (Newest)</option>
            <option value="minSalary:desc">Highest Salary</option>
            <option value="title:asc">Role Title (A-Z)</option>
          </select>
        </div>
      </div>

      {/* Active Filters Summary & Reset Button */}
      {hasActiveFilters && (
        <div className="flex items-center justify-between pt-1 border-t border-dark-800 text-xs">
          <span className="text-slate-400 flex items-center gap-1.5">
            <SlidersHorizontal className="h-3.5 w-3.5 text-brand-400" />
            <span>Filters active</span>
          </span>
          <button
            onClick={onResetFilters}
            className="text-xs text-brand-400 hover:text-brand-300 font-medium transition-colors hover:underline flex items-center gap-1"
          >
            <X className="h-3 w-3" /> Reset all filters
          </button>
        </div>
      )}
    </div>
  );
};
