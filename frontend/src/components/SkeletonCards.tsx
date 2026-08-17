import React from 'react';

export const SkeletonCard: React.FC = () => {
  return (
    <div className="p-4 rounded-xl bg-dark-900 border border-dark-800 animate-pulse space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-6 w-6 rounded bg-dark-800" />
          <div className="h-3 w-20 rounded bg-dark-800" />
        </div>
        <div className="h-4 w-16 rounded bg-dark-800" />
      </div>

      <div className="h-4 w-3/4 rounded bg-dark-800" />

      <div className="flex gap-2">
        <div className="h-3 w-12 rounded bg-dark-800" />
        <div className="h-3 w-16 rounded bg-dark-800" />
        <div className="h-3 w-24 rounded bg-dark-800" />
      </div>

      <div className="flex gap-1.5 pt-1">
        <div className="h-4 w-12 rounded bg-dark-850" />
        <div className="h-4 w-14 rounded bg-dark-850" />
        <div className="h-4 w-10 rounded bg-dark-850" />
      </div>

      <div className="flex justify-between pt-2 border-t border-dark-800">
        <div className="h-3 w-20 rounded bg-dark-800" />
        <div className="h-3 w-12 rounded bg-dark-800" />
      </div>
    </div>
  );
};

export const SkeletonList: React.FC = () => {
  return (
    <div className="space-y-3">
      {[1, 2, 3, 4, 5].map((i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
};
