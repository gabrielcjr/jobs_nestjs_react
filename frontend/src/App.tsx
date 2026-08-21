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
import { useBookmarks } from './hooks/useBookmarks';
import { Job, JobFilters } from './types/jobs';

const INITIAL_FILTERS: JobFilters = {
  search: '',
  roleCategory: 'ALL',
  experienceLevel: 'ALL',
  workplaceType: 'ALL',
  atsProvider: 'ALL',
  datePosted: 'all',
  tags: [],
  minSalary: undefined,
  latamUsdOnly: false,
  sortBy: 'postedAt',
  sortOrder: 'desc',
  page: 1,
  limit: 20,
};

export const App: React.FC = () => {
  const [filters, setFilters] = useState<JobFilters>(INITIAL_FILTERS);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [isSyncModalOpen, setIsSyncModalOpen] = useState(false);
  const [showSavedOnly, setShowSavedOnly] = useState(false);

  // Bookmarks and viewed state engine
  const {
    isBookmarked,
    toggleBookmark,
    isViewed,
    markAsViewed,
    bookmarkCount,
    updateStatus,
    getBookmark,
  } = useBookmarks();

  // Debounce search input for snappy typing
  const debouncedSearch = useDebounce(filters.search, 300);

  // Query jobs with active debounced filters
  const { data, isLoading } = useJobs({
    ...filters,
    search: debouncedSearch,
  });

  // Query top tags for tech pills
  const { data: topTags } = useTopTags();

  const rawJobs = data?.jobs || [];
  const totalCount = data?.totalCount || 0;
  const totalPages = data?.totalPages || 1;
  const facets = data?.facets;

  // Filter jobs if "Saved Only" is active
  const jobs = showSavedOnly ? rawJobs.filter((j) => isBookmarked(j.id)) : rawJobs;
  const displayTotalCount = showSavedOnly ? jobs.length : totalCount;

  // Auto-select first job and mark as viewed
  useEffect(() => {
    if (jobs.length > 0) {
      if (!selectedJob || !jobs.some((j) => j.id === selectedJob.id)) {
        setSelectedJob(jobs[0]);
        markAsViewed(jobs[0].id);
      }
    } else {
      setSelectedJob(null);
    }
  }, [jobs, selectedJob, markAsViewed]);

  const handleSelectJob = (job: Job) => {
    setSelectedJob(job);
    markAsViewed(job.id);
  };

  const handleFilterChange = (newFilters: Partial<JobFilters>) => {
    if (showSavedOnly) setShowSavedOnly(false);
    setFilters((prev) => ({ ...prev, ...newFilters }));
  };

  const handleToggleTag = (tag: string) => {
    if (showSavedOnly) setShowSavedOnly(false);
    setFilters((prev) => {
      const exists = prev.tags.includes(tag);
      const nextTags = exists
        ? prev.tags.filter((t) => t !== tag)
        : [...prev.tags, tag];
      return { ...prev, tags: nextTags, page: 1 };
    });
  };

  const handleResetFilters = () => {
    setShowSavedOnly(false);
    setFilters(INITIAL_FILTERS);
  };

  const handleToggleBookmarkJob = (job: Job) => {
    toggleBookmark({
      id: job.id,
      slug: job.slug,
      title: job.title,
      companyName: job.company.name,
      atsProvider: job.atsProvider,
      location: job.location,
      workplaceType: job.workplaceType,
    });
  };

  const hasActiveFilters = Boolean(
    showSavedOnly ||
      filters.search ||
      filters.roleCategory !== 'ALL' ||
      filters.experienceLevel !== 'ALL' ||
      filters.workplaceType !== 'ALL' ||
      filters.atsProvider !== 'ALL' ||
      filters.datePosted !== 'all' ||
      filters.latamUsdOnly ||
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
        {/* Role Category Tabs & Saved Tab */}
        <RoleCategoryTabs
          selectedRole={filters.roleCategory}
          onSelectRole={(roleCategory) => handleFilterChange({ roleCategory, page: 1 })}
          roleCounts={facets?.roleCategoryCounts}
          totalCount={totalCount}
          savedCount={bookmarkCount}
          showSavedOnly={showSavedOnly}
          onToggleSavedOnly={() => setShowSavedOnly((prev) => !prev)}
        />

        {/* Popular Tech Stack Pills */}
        <TechStackPills
          selectedTags={filters.tags}
          onToggleTag={handleToggleTag}
          availableTags={facets?.topTags || topTags}
        />

        {/* Global Multi-facet Filter Bar */}
        <FilterBar
          filters={filters}
          onFilterChange={handleFilterChange}
          onResetFilters={handleResetFilters}
          hasActiveFilters={hasActiveFilters}
        />

        {/* Dual-Pane Master Detail Split Screen */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-5 min-h-0 pt-1">
          {/* Left Master List (40% width on Desktop) */}
          <section className="lg:col-span-5 h-[calc(100vh-320px)] min-h-[500px] flex flex-col">
            <JobList
              jobs={jobs}
              totalCount={displayTotalCount}
              currentPage={filters.page || 1}
              totalPages={totalPages}
              isLoading={isLoading}
              selectedJob={selectedJob}
              onSelectJob={handleSelectJob}
              onPageChange={(page) => handleFilterChange({ page })}
              onResetFilters={handleResetFilters}
              onOpenSyncModal={() => setIsSyncModalOpen(true)}
              isBookmarked={isBookmarked}
              isViewed={isViewed}
              getStatus={(jobId) => getBookmark(jobId)?.status}
              onToggleBookmark={handleToggleBookmarkJob}
            />
          </section>

          {/* Right Detail Pane (60% width on Desktop) */}
          <section className="lg:col-span-7 h-[calc(100vh-320px)] min-h-[500px]">
            <JobDetail
              job={selectedJob}
              onTagClick={handleToggleTag}
              isBookmarked={selectedJob ? isBookmarked(selectedJob.id) : false}
              isViewed={selectedJob ? isViewed(selectedJob.id) : false}
              status={selectedJob ? getBookmark(selectedJob.id)?.status : 'SAVED'}
              onToggleBookmark={selectedJob ? () => handleToggleBookmarkJob(selectedJob) : undefined}
              onUpdateStatus={selectedJob ? (status) => updateStatus(selectedJob.id, status) : undefined}
            />
          </section>
        </div>
      </main>

      {/* Ingestion & Crawling Modal */}
      <IngestionModal
        isOpen={isSyncModalOpen}
        onClose={() => setIsSyncModalOpen(false)}
      />
    </div>
  );
};

export default App;
