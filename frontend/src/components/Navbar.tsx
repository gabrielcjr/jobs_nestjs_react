import React from 'react';
import { Terminal, RefreshCw, Search, Database, Sparkles, Target } from 'lucide-react';

interface NavbarProps {
  onOpenSyncModal: () => void;
  totalJobsCount?: number;
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenSyncModal, totalJobsCount = 0 }) => {
  return (
    <header className="sticky top-0 z-40 bg-dark-900/90 backdrop-blur-md border-b border-dark-750 px-4 lg:px-8 py-3.5">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        {/* Brand Logo & Tagline */}
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-brand-600 via-indigo-500 to-purple-500 flex items-center justify-center shadow-lg shadow-brand-500/20 ring-1 ring-white/20">
            <Terminal className="h-5 w-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-bold text-lg text-white tracking-tight">DevATS</h1>
              <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full bg-brand-500/10 text-brand-400 border border-brand-500/30">
                v1.0 • Dynamic ATS Discovery
              </span>
            </div>
            <p className="text-xs text-slate-400 hidden sm:block">
              Dynamic Multi-ATS Prober • Greenhouse, Ashby, Lever, SmartRecruiters
            </p>
          </div>
        </div>

        {/* Live Counters & Action CTAs */}
        <div className="flex items-center gap-3">
          {/* Real-time DB Count Badge */}
          <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-dark-800 border border-dark-750 text-xs text-slate-300">
            <Database className="h-3.5 w-3.5 text-emerald-400 animate-pulse-subtle" />
            <span><strong className="text-white font-mono">{totalJobsCount}</strong> Active Jobs</span>
          </div>

          {/* Open Dynamic Discovery Modal CTA */}
          <button
            onClick={onOpenSyncModal}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white text-xs font-semibold shadow-lg shadow-brand-600/25 transition-all active:scale-95 cursor-pointer"
          >
            <Search className="h-3.5 w-3.5" />
            <span>Discover & Ingest ATS Boards</span>
          </button>
        </div>
      </div>
    </header>
  );
};
