import React from 'react';
import { MapPin, DollarSign, Sparkles, Clock } from 'lucide-react';
import { Job } from '../types/jobs';
import { CompanyAvatar } from './CompanyAvatar';
import {
  formatSalary,
  formatTimeAgo,
  isNewJob,
  getAtsBadgeStyles,
  getExperienceLevelLabel,
  getWorkplaceTypeLabel,
} from '../utils/formatters';

interface JobCardProps {
  job: Job;
  isSelected: boolean;
  onSelect: (job: Job) => void;
}

export const JobCard: React.FC<JobCardProps> = ({ job, isSelected, onSelect }) => {
  const isNew = isNewJob(job.firstSeenAt);
  const salaryText = formatSalary(job.minSalary, job.maxSalary, job.currency || 'USD', job.salarySummary);
  const atsBadge = getAtsBadgeStyles(job.atsProvider);
  const timeAgo = formatTimeAgo(job.postedAt || job.firstSeenAt);

  // Maximum 4 visible tags + overflow count
  const visibleTags = job.tags.slice(0, 4);
  const overflowCount = job.tags.length > 4 ? job.tags.length - 4 : 0;

  return (
    <div
      onClick={() => onSelect(job)}
      className={`group relative p-4 rounded-xl cursor-pointer transition-all duration-150 border text-left ${
        isSelected
          ? 'bg-dark-850 border-brand-500/80 shadow-md shadow-brand-500/10 ring-1 ring-brand-500/40'
          : 'bg-dark-900 hover:bg-dark-850/80 border-dark-750 hover:border-dark-700'
      }`}
    >
      {/* Top Header: Company, ATS Badge, and NEW indicator */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex items-center gap-2 min-w-0">
          <CompanyAvatar name={job.company.name} size="sm" />
          <span className="font-semibold text-xs text-slate-300 truncate group-hover:text-white transition-colors">
            {job.company.name}
          </span>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {isNew && (
            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-amber-500/15 text-amber-300 border border-amber-500/40">
              <Sparkles className="h-2.5 w-2.5 text-amber-400" />
              NEW
            </span>
          )}
          <span
            className={`px-2 py-0.5 rounded text-[10px] font-mono font-medium border ${atsBadge.bg} ${atsBadge.text} ${atsBadge.border}`}
          >
            {atsBadge.label}
          </span>
        </div>
      </div>

      {/* Role Title */}
      <h3 className="font-semibold text-sm text-slate-100 group-hover:text-brand-300 transition-colors line-clamp-2 mb-2">
        {job.title}
      </h3>

      {/* Location & Seniority Badges */}
      <div className="flex items-center gap-2 text-[11px] text-slate-400 mb-3 flex-wrap">
        <span className="flex items-center gap-1 truncate max-w-[140px]">
          <MapPin className="h-3 w-3 text-slate-500 shrink-0" />
          <span className="truncate">{job.location || 'Remote'}</span>
        </span>
        <span className="text-dark-700">•</span>
        <span className="px-1.5 py-0.5 rounded bg-dark-800 border border-dark-750 text-[10px] font-medium text-slate-300">
          {getWorkplaceTypeLabel(job.workplaceType)}
        </span>
        <span className="px-1.5 py-0.5 rounded bg-dark-800 border border-dark-750 text-[10px] font-medium text-slate-300">
          {getExperienceLevelLabel(job.experienceLevel)}
        </span>
      </div>

      {/* Tech Stack Pills */}
      {visibleTags.length > 0 && (
        <div className="flex flex-wrap items-center gap-1 mb-3">
          {visibleTags.map((tag) => (
            <span
              key={tag}
              className="px-2 py-0.5 rounded-md bg-dark-950 text-slate-300 border border-dark-750 text-[10px] font-mono"
            >
              {tag}
            </span>
          ))}
          {overflowCount > 0 && (
            <span className="px-1.5 py-0.5 rounded-md bg-dark-800 text-slate-500 text-[10px] font-mono">
              +{overflowCount}
            </span>
          )}
        </div>
      )}

      {/* Footer: Salary & Time Ago */}
      <div className="flex items-center justify-between pt-2 border-t border-dark-800/80 text-[11px]">
        <div className="font-semibold text-emerald-400 truncate">
          {salaryText || 'Competitive Salary'}
        </div>
        <div className="flex items-center gap-1 text-slate-500 text-[10px] font-mono shrink-0">
          <Clock className="h-2.5 w-2.5" />
          <span>{timeAgo}</span>
        </div>
      </div>
    </div>
  );
};
