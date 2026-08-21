import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Job } from '../types/jobs';
import { JobCard } from './JobCard';
import { SkeletonList } from './SkeletonCards';
import { EmptyState } from './EmptyState';
import { ApplicationStatus } from '../hooks/useBookmarks';

interface JobListProps {
  jobs: Job[];
  totalCount: number;
  currentPage: number;
  totalPages: number;
  isLoading: boolean;
  selectedJob: Job | null;
  onSelectJob: (job: Job) => void;
  onPageChange: (page: number) => void;
  onResetFilters: () => void;
  onOpenSyncModal: () => void;
  isBookmarked?: (jobId: string) => boolean;
  isViewed?: (jobId: string) => boolean;
  getStatus?: (jobId: string) => ApplicationStatus | undefined;
  onToggleBookmark?: (job: Job) => void;
}

export const JobList: React.FC<JobListProps> = ({
  jobs,
  totalCount,
  currentPage,
  totalPages,
  isLoading,
  selectedJob,
  onSelectJob,
  onPageChange,
  onResetFilters,
  onOpenSyncModal,
  isBookmarked,
  isViewed,
  getStatus,
  onToggleBookmark,
}) => {
  if (isLoading) {
    return <SkeletonList />;
  }

  if (jobs.length === 0) {
    return (
      <EmptyState
        onResetFilters={onResetFilters}
        onOpenSyncModal={onOpenSyncModal}
      />
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header Info */}
      <div className="flex items-center justify-between px-1 pb-3 text-xs text-slate-400">
        <div>
          Showing <span className="font-semibold text-slate-200">{jobs.length}</span> of{' '}
          <span className="font-semibold text-slate-200">{totalCount}</span> engineering jobs
        </div>
        <div className="text-[11px] font-mono text-slate-500">
          Page {currentPage} of {totalPages}
        </div>
      </div>

      {/* Scrollable Job Cards */}
      <div className="space-y-2.5 overflow-y-auto pr-1 flex-1 min-h-0">
        {jobs.map((job) => (
          <JobCard
            key={`${job.atsProvider}-${job.externalJobId}`}
            job={job}
            isSelected={selectedJob?.id === job.id}
            onSelect={onSelectJob}
            isBookmarked={isBookmarked ? isBookmarked(job.id) : false}
            isViewed={isViewed ? isViewed(job.id) : false}
            status={getStatus ? getStatus(job.id) : undefined}
            onToggleBookmark={onToggleBookmark ? () => onToggleBookmark(job) : undefined}
          />
        ))}
      </div>

      {/* Pagination Footer */}
      {totalPages > 1 && (
        <div className="pt-4 mt-2 border-t border-dark-800 flex items-center justify-between text-xs">
          <button
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage <= 1}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-dark-850 hover:bg-dark-800 border border-dark-700 disabled:opacity-40 disabled:cursor-not-allowed text-slate-300 hover:text-white transition-colors"
          >
            <ChevronLeft className="h-4 w-4" />
            <span>Previous</span>
          </button>

          <span className="font-mono text-xs text-slate-400">
            {currentPage} / {totalPages}
          </span>

          <button
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage >= totalPages}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-dark-850 hover:bg-dark-800 border border-dark-700 disabled:opacity-40 disabled:cursor-not-allowed text-slate-300 hover:text-white transition-colors"
          >
            <span>Next</span>
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
};
