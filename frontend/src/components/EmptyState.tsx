import React from 'react';
import { SearchX, RotateCcw, PlusCircle } from 'lucide-react';

interface EmptyStateProps {
  onResetFilters: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  onResetFilters,
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
        Try relaxing your search keywords or clearing role/seniority filters to view available engineering positions.
      </p>

      <div className="flex flex-wrap items-center justify-center gap-3">
        <button
          onClick={onResetFilters}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-dark-800 hover:bg-dark-750 border border-dark-700 hover:border-dark-600 text-xs font-medium text-slate-200 hover:text-white transition-all shadow-sm cursor-pointer"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          <span>Clear All Filters</span>
        </button>
      </div>
    </div>
  );
};
