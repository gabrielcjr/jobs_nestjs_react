import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { RoleCategoryTabs } from './components/RoleCategoryTabs';
import { TechStackPills } from './components/TechStackPills';
import { FilterBar } from './components/FilterBar';
import { JobList } from './components/JobList';
import { JobDetail } from './components/JobDetail';
import { IngestionModal } from './components/IngestionModal';
import { useJobs, useTopTags } from './hooks/useJobs';
import { useDebounce } from './hooks/useDebounce';
import { Job, JobFilters, RoleCategory } from './types/jobs';

const INITIAL_FILTERS: JobFilters = {
  search: '',
  roleCategory: 'ALL',
  experienceLevel: 'ALL',
  workplaceType: 'ALL',
  atsProvider: 'ALL',
  datePosted: 'all',
  tags: [],
  minSalary: undefined,
  sortBy: 'postedAt',
  sortOrder: 'desc',
  page: 1,
  limit: 20,
};

export const App: React.FC = () => {
  const [filters, setFilters] = useState<JobFilters>(INITIAL_FILTERS);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [isSyncModalOpen, setIsSyncModalOpen] = useState(false);

  // Debounce search input for snappy typing
  const debouncedSearch = useDebounce(filters.search, 300);

  // Query jobs with active debounced filters
  const { data, isLoading, isFetching, error } = useJobs({
    ...filters,
    search: debouncedSearch,
  });

  // Query top tags for tech pills
  const { data: topTags } = useTopTags();

  const jobs = data?.jobs || [];
  const totalCount = data?.totalCount || 0;
  const totalPages = data?.totalPages || 1;
  const facets = data?.facets;

  // Auto-select the first job if none is currently selected or if the selected job isn't in the new list
  useEffect(() => {
    if (jobs.length > 0) {
      if (!selectedJob || !jobs.some((j) => j.id === selectedJob.id)) {
        setSelectedJob(jobs[0]);
      }
    } else {
      setSelectedJob(null);
    }
  }, [jobs]);

  const handleFilterChange = (newFilters: Partial<JobFilters>) => {
    setFilters((prev) => ({ ...prev, ...newFilters }));
  };

  const handleToggleTag = (tag: string) => {
    setFilters((prev) => {
      const exists = prev.tags.includes(tag);
      const nextTags = exists
        ? prev.tags.filter((t) => t !== tag)
        : [...prev.tags, tag];
      return { ...prev, tags: nextTags, page: 1 };
    });
  };

  const handleResetFilters = () => {
    setFilters(INITIAL_FILTERS);
  };

  const hasActiveFilters = Boolean(
    filters.search ||
      filters.roleCategory !== 'ALL' ||
      filters.experienceLevel !== 'ALL' ||
      filters.workplaceType !== 'ALL' ||
      filters.atsProvider !== 'ALL' ||
      filters.datePosted !== 'all' ||
      (filters.minSalary && filters.minSalary > 0) ||
      filters.tags.length > 0
  );

  return (
    <div className="min-h-screen flex flex-col bg-dark-950 text-slate-100 selection:bg-brand-500 selection:text-white">
      {/* Top Navbar */}
      <Navbar
        onOpenSyncModal={() => setIsSyncModalOpen(true)}
        totalJobsCount={totalCount}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 lg:px-8 py-5 flex flex-col gap-4">
        {/* Role Category Tabs */}
        <RoleCategoryTabs
          selectedRole={filters.roleCategory}
          onSelectRole={(role) => handleFilterChange({ roleCategory: role, page: 1 })}
          roleCounts={facets?.roleCategoryCounts}
          totalCount={totalCount}
        />

        {/* Filter Controls & Search */}
        <FilterBar
          filters={filters}
          onFilterChange={handleFilterChange}
          onResetFilters={handleResetFilters}
          hasActiveFilters={hasActiveFilters}
        />

        {/* Tech Stack Pills */}
        <TechStackPills
          selectedTags={filters.tags}
          onToggleTag={handleToggleTag}
          availableTags={topTags || facets?.topTags}
        />

        {/* Split-Screen Master-Detail Layout */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-5 min-h-[680px] mt-1">
          {/* Left Pane (40% width on desktop / 5 cols) */}
          <div className="lg:col-span-5 h-[720px] flex flex-col">
            <JobList
              jobs={jobs}
              totalCount={totalCount}
              currentPage={filters.page || 1}
              totalPages={totalPages}
              isLoading={isLoading}
              selectedJob={selectedJob}
              onSelectJob={setSelectedJob}
              onPageChange={(page) => handleFilterChange({ page })}
              onResetFilters={handleResetFilters}
              onOpenSyncModal={() => setIsSyncModalOpen(true)}
            />
          </div>

          {/* Right Pane (60% width on desktop / 7 cols) */}
          <div className="hidden lg:block lg:col-span-7 h-[720px] sticky top-[76px]">
            <JobDetail
              job={selectedJob}
              onTagClick={handleToggleTag}
            />
          </div>
        </div>

        {/* Mobile Detail Modal/Drawer if a job is selected on smaller screens */}
        <div className="lg:hidden mt-4">
          {selectedJob && (
            <div className="rounded-2xl border border-dark-750 bg-dark-900/90 overflow-hidden">
              <JobDetail
                job={selectedJob}
                onTagClick={handleToggleTag}
              />
            </div>
          )}
        </div>
      </main>

      {/* Public ATS Ingestion Modal */}
      <IngestionModal
        isOpen={isSyncModalOpen}
        onClose={() => setIsSyncModalOpen(false)}
      />
    </div>
  );
};
export default App;
