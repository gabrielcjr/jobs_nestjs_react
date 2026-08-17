import React from 'react';
import { SearchX, RotateCcw, PlusCircle } from 'lucide-react';

interface EmptyStateProps {
  onResetFilters: () => void;
  onOpenSyncModal: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  onResetFilters,
  onOpenSyncModal,
}) => {
  return (
    <div className="py-16 px-6 text-center rounded-2xl bg-dark-900/60 border border-dark-800 flex flex-col items-center justify-center">
      <div className="h-16 w-16 rounded-2xl bg-dark-800 border border-dark-750 flex items-center justify-center text-slate-500 mb-4 shadow-inner">
        <SearchX className="h-8 w-8 text-slate-400" />
      </div>

      <h3 className="text-base font-bold text-slate-100 mb-1.5">
        No engineering positions match your criteria
      </h3>
      <p className="text-xs text-slate-400 max-w-sm mb-6 leading-relaxed">
        Try relaxing your search keywords, clearing role/seniority filters, or syncing additional live ATS boards into the database.
      </p>

      <div className="flex flex-wrap items-center justify-center gap-3">
        <button
          onClick={onResetFilters}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-dark-800 hover:bg-dark-750 border border-dark-700 hover:border-dark-600 text-xs font-medium text-slate-200 hover:text-white transition-all shadow-sm"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          <span>Clear All Filters</span>
        </button>

        <button
          onClick={onOpenSyncModal}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-xs font-medium text-white transition-all shadow-md shadow-brand-600/20"
        >
          <PlusCircle className="h-3.5 w-3.5" />
          <span>Sync New ATS Board</span>
        </button>
      </div>
    </div>
  );
};
