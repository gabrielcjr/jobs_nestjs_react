import React, { useState } from 'react';
import {
  ExternalLink,
  Share2,
  Check,
  Building,
  MapPin,
  DollarSign,
  Calendar,
  Layers,
  Sparkles,
  Shield,
  Briefcase,
  Globe,
  Clock,
} from 'lucide-react';
import { Job } from '../types/jobs';
import { CompanyAvatar } from './CompanyAvatar';
import { sanitizeHtml } from '../utils/sanitize';
import {
  formatSalary,
  formatTimeAgo,
  getAtsBadgeStyles,
  getExperienceLevelLabel,
  getRoleCategoryLabel,
  getWorkplaceTypeLabel,
  isNewJob,
} from '../utils/formatters';

interface JobDetailProps {
  job: Job | null;
  onTagClick?: (tag: string) => void;
}

export const JobDetail: React.FC<JobDetailProps> = ({ job, onTagClick }) => {
  const [copied, setCopied] = useState(false);

  if (!job) {
    return (
      <div className="h-full min-h-[500px] flex flex-col items-center justify-center p-8 rounded-2xl bg-dark-900/60 border border-dark-800 text-center">
        <div className="h-14 w-14 rounded-2xl bg-dark-800 border border-dark-750 flex items-center justify-center text-slate-500 mb-4">
          <Briefcase className="h-7 w-7" />
        </div>
        <h3 className="text-base font-semibold text-slate-200 mb-1">Select a job to view details</h3>
        <p className="text-xs text-slate-400 max-w-sm">
          Browse through the ingested listings on the left to inspect tech stack auto-extractions, salary info, and full descriptions.
        </p>
      </div>
    );
  }

  const atsBadge = getAtsBadgeStyles(job.atsProvider);
  const isNew = isNewJob(job.firstSeenAt);
  const salaryText = formatSalary(job.minSalary, job.maxSalary, job.currency || 'USD', job.salarySummary);
  const cleanHtml = sanitizeHtml(job.description);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="h-full flex flex-col bg-dark-900/90 rounded-2xl border border-dark-750 overflow-hidden">
      {/* Sticky Header Section */}
      <div className="sticky top-0 z-20 bg-dark-900/95 backdrop-blur-md border-b border-dark-750 p-5 lg:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          {/* Company & Role Title */}
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              {/* Company Avatar & Name */}
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-300">
                <CompanyAvatar name={job.company.name} size="sm" />
                <span>{job.company.name}</span>
              </div>

              {/* ATS Provider Badge */}
              <span
                className={`px-2 py-0.5 rounded text-[10px] font-mono font-medium border ${atsBadge.bg} ${atsBadge.text} ${atsBadge.border}`}
              >
                {atsBadge.label}
              </span>

              {/* NEW Badge */}
              {isNew && (
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500/15 text-amber-300 border border-amber-500/40">
                  <Sparkles className="h-2.5 w-2.5 text-amber-400" />
                  NEW (48h)
                </span>
              )}
            </div>

            <h2 className="text-xl lg:text-2xl font-bold text-white tracking-tight leading-tight">
              {job.title}
            </h2>
          </div>

          {/* Action CTAs: Apply and Share */}
          <div className="flex items-center gap-2.5 shrink-0">
            {/* Share / Copy Link */}
            <button
              onClick={handleCopyLink}
              title="Copy link to job"
              className="p-2.5 rounded-xl bg-dark-800 hover:bg-dark-750 border border-dark-700 hover:border-dark-600 text-slate-300 hover:text-white transition-all active:scale-95"
            >
              {copied ? (
                <Check className="h-4 w-4 text-emerald-400" />
              ) : (
                <Share2 className="h-4 w-4" />
              )}
            </button>

            {/* Quick Apply CTA */}
            <a
              href={job.applyUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white text-xs font-semibold shadow-lg shadow-brand-500/25 transition-all active:scale-95"
            >
              <span>Apply on {atsBadge.label}</span>
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </div>
        </div>
      </div>

      {/* Main Scrollable Content */}
      <div className="flex-1 overflow-y-auto p-5 lg:p-6 space-y-6">
        {/* Key Metadata Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {/* 1. Role Category */}
          <div className="p-3 rounded-xl bg-dark-850 border border-dark-750/80">
            <span className="block text-[10px] font-mono uppercase text-slate-400 mb-0.5">
              Role Domain
            </span>
            <span className="text-xs font-semibold text-slate-200">
              {getRoleCategoryLabel(job.roleCategory)}
            </span>
          </div>

          {/* 2. Seniority */}
          <div className="p-3 rounded-xl bg-dark-850 border border-dark-750/80">
            <span className="block text-[10px] font-mono uppercase text-slate-400 mb-0.5">
              Seniority
            </span>
            <span className="text-xs font-semibold text-slate-200">
              {getExperienceLevelLabel(job.experienceLevel)}
            </span>
          </div>

          {/* 3. Workplace Type */}
          <div className="p-3 rounded-xl bg-dark-850 border border-dark-750/80">
            <span className="block text-[10px] font-mono uppercase text-slate-400 mb-0.5">
              Workplace
            </span>
            <span className="text-xs font-semibold text-slate-200">
              {getWorkplaceTypeLabel(job.workplaceType)}
            </span>
          </div>

          {/* 4. Compensation */}
          <div className="p-3 rounded-xl bg-dark-850 border border-dark-750/80">
            <span className="block text-[10px] font-mono uppercase text-slate-400 mb-0.5">
              Compensation
            </span>
            <span className="text-xs font-semibold text-emerald-400">
              {salaryText || 'Competitive'}
            </span>
          </div>

          {/* 5. Location */}
          <div className="p-3 rounded-xl bg-dark-850 border border-dark-750/80">
            <span className="block text-[10px] font-mono uppercase text-slate-400 mb-0.5">
              Location
            </span>
            <span className="text-xs font-semibold text-slate-200 truncate block">
              {job.location || 'Unspecified'}
            </span>
          </div>

          {/* 6. Department */}
          <div className="p-3 rounded-xl bg-dark-850 border border-dark-750/80">
            <span className="block text-[10px] font-mono uppercase text-slate-400 mb-0.5">
              Department
            </span>
            <span className="text-xs font-semibold text-slate-200 truncate block">
              {job.department || 'Engineering'}
            </span>
          </div>

          {/* 7. Date Posted */}
          <div className="p-3 rounded-xl bg-dark-850 border border-dark-750/80">
            <span className="block text-[10px] font-mono uppercase text-slate-400 mb-0.5">
              Posted Date
            </span>
            <span className="text-xs font-semibold text-slate-200">
              {formatTimeAgo(job.postedAt || job.firstSeenAt)}
            </span>
          </div>

          {/* 8. First Ingested */}
          <div className="p-3 rounded-xl bg-dark-850 border border-dark-750/80">
            <span className="block text-[10px] font-mono uppercase text-slate-400 mb-0.5">
              First Ingested
            </span>
            <span className="text-xs font-semibold text-slate-200">
              {formatTimeAgo(job.firstSeenAt)}
            </span>
          </div>
        </div>

        {/* Full Extracted Tech Stack Section */}
        {job.tags.length > 0 && (
          <div className="p-4 rounded-xl bg-dark-850/80 border border-dark-750">
            <div className="flex items-center gap-2 mb-2.5">
              <Layers className="h-4 w-4 text-brand-400" />
              <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider font-mono">
                Auto-Extracted Tech Stack ({job.tags.length})
              </h4>
            </div>
            <div className="flex flex-wrap items-center gap-1.5">
              {job.tags.map((tag) => (
                <button
                  key={tag}
                  onClick={() => onTagClick && onTagClick(tag)}
                  title={`Filter jobs by ${tag}`}
                  className="px-2.5 py-1 rounded-lg bg-dark-950 hover:bg-brand-500/20 text-slate-200 hover:text-brand-300 text-xs font-mono border border-dark-700 hover:border-brand-500/50 transition-all cursor-pointer"
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Sanitized Job Description */}
        <div className="p-5 lg:p-6 rounded-2xl bg-dark-850/40 border border-dark-750/60">
          <h4 className="text-sm font-bold text-slate-100 uppercase tracking-wider font-mono mb-4 pb-2 border-b border-dark-750 flex items-center justify-between">
            <span>Job Description</span>
            <span className="text-[10px] font-normal text-slate-500 lowercase">
              Sanitized with DOMPurify
            </span>
          </h4>

          {cleanHtml ? (
            <div
              className="prose-job-desc"
              dangerouslySetInnerHTML={{ __html: cleanHtml }}
            />
          ) : (
            <p className="text-xs text-slate-400 italic">No description provided.</p>
          )}
        </div>

        {/* Bottom CTA Card */}
        <div className="p-6 rounded-2xl bg-gradient-to-br from-brand-950/40 via-dark-850 to-dark-900 border border-brand-500/20 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <h4 className="text-sm font-semibold text-white">Interested in this position?</h4>
            <p className="text-xs text-slate-400">
              Apply directly on {job.company.name}'s official {atsBadge.label} portal.
            </p>
          </div>

          <a
            href={job.applyUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold shadow-lg shadow-brand-600/25 transition-all shrink-0 active:scale-95"
          >
            <span>Proceed to Application</span>
            <ExternalLink className="h-4 w-4" />
          </a>
        </div>
      </div>
    </div>
  );
};
