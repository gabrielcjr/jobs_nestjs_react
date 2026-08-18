import React, { useState } from 'react';
import {
  X,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Search,
  Zap,
  Check,
  ExternalLink,
  Target,
  FileSpreadsheet,
  Layers,
  Sparkles,
  Radio,
} from 'lucide-react';
import { useStartBackgroundDiscovery, useDiscoveryStatus, useCsvSummary, useDiscoverAndSync } from '../hooks/useJobs';
import { getAtsBadgeStyles } from '../utils/formatters';

interface IngestionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const IngestionModal: React.FC<IngestionModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'CSV' | 'SEARCH'>('CSV');
  const [tierSelection, setTierSelection] = useState<number>(4);
  const [limitSelection, setLimitSelection] = useState<string>('all');

  // Single Search State
  const [singleName, setSingleName] = useState('');
  const [singleResult, setSingleResult] = useState<any | null>(null);

  const { data: csvSummary } = useCsvSummary(tierSelection);
  const { data: activeJob } = useDiscoveryStatus();
  const startBackgroundDiscoveryMutation = useStartBackgroundDiscovery();
  const discoverAndSyncMutation = useDiscoverAndSync();

  if (!isOpen) return null;

  const isRunning = activeJob?.status === 'running';
  const progressPercent = activeJob && activeJob.total > 0 
    ? Math.round((activeJob.processed / activeJob.total) * 100) 
    : 0;

  const handleCsvDiscovery = async () => {
    const limitNum = limitSelection === 'all' ? undefined : parseInt(limitSelection, 10);
    try {
      await startBackgroundDiscoveryMutation.mutateAsync({
        tier: tierSelection,
        limit: limitNum,
      });
    } catch (err) {
      console.error('CSV discovery error:', err);
    }
  };

  const handleSingleDiscovery = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!singleName.trim()) return;

    setSingleResult(null);
    try {
      const res = await discoverAndSyncMutation.mutateAsync({
        companyName: singleName.trim(),
      });
      setSingleResult(res);
    } catch (err: any) {
      setSingleResult({
        success: false,
        message: err.response?.data?.message || err.message || 'Discovery probe failed',
      });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-2xl rounded-2xl bg-dark-900 border border-dark-750 shadow-2xl p-6 overflow-hidden max-h-[90vh] flex flex-col">
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-4 border-b border-dark-800 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-brand-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-brand-500/25">
              <Zap className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Automated Multi-ATS Discovery Engine</h3>
              <p className="text-[11px] text-slate-400">
                Background candidate slug prober across 629 companies on Greenhouse, Ashby & Lever
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-dark-800 transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-1.5 mt-4 p-1 bg-dark-950 rounded-xl border border-dark-800 shrink-0">
          <button
            onClick={() => setActiveTab('CSV')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'CSV'
                ? 'bg-brand-600 text-white shadow-sm ring-1 ring-brand-400/40'
                : 'text-slate-400 hover:text-slate-200 hover:bg-dark-850'
            }`}
          >
            <FileSpreadsheet className="h-3.5 w-3.5" />
            <span>Discover from global-hiring-companies.csv</span>
          </button>

          <button
            onClick={() => setActiveTab('SEARCH')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'SEARCH'
                ? 'bg-brand-600 text-white shadow-sm ring-1 ring-brand-400/40'
                : 'text-slate-400 hover:text-slate-200 hover:bg-dark-850'
            }`}
          >
            <Search className="h-3.5 w-3.5" />
            <span>Probe Single Company Name</span>
          </button>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto mt-4 space-y-4 pr-1">
          {activeTab === 'CSV' ? (
            /* Mode 1: Automated Discovery from CSV */
            <div className="space-y-4">
              {/* Dataset Status Banner */}
              <div className="p-4 rounded-xl bg-dark-950 border border-dark-750 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white font-mono flex items-center gap-1.5">
                    <FileSpreadsheet className="h-4 w-4 text-emerald-400" />
                    Dataset: backend/global-hiring-companies.csv
                  </span>
                  <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-dark-800 text-emerald-300 border border-dark-700">
                    {csvSummary?.totalRows ?? 629} Companies Loaded
                  </span>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed">
                  Probes each company name & slug against Greenhouse, Lever, and Ashby with candidate slug variations, keeping whatever answers with real postings.
                </p>

                {/* Filters Row */}
                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="block text-[11px] font-mono text-slate-400 mb-1">
                      Filter by Tier:
                    </label>
                    <select
                      value={tierSelection}
                      disabled={isRunning}
                      onChange={(e) => setTierSelection(parseInt(e.target.value, 10))}
                      className="w-full bg-dark-850 border border-dark-700 text-xs text-slate-200 rounded-lg px-2.5 py-1.5 outline-none font-mono disabled:opacity-50"
                    >
                      <option value={1}>Tier 1 Only (307 Worldwide Matches)</option>
                      <option value={2}>Tier 1 & Tier 2 (380 Companies)</option>
                      <option value={4}>All Tiers (629 Companies)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-mono text-slate-400 mb-1">
                      Probing Scope:
                    </label>
                    <select
                      value={limitSelection}
                      disabled={isRunning}
                      onChange={(e) => setLimitSelection(e.target.value)}
                      className="w-full bg-dark-850 border border-dark-700 text-xs text-slate-200 rounded-lg px-2.5 py-1.5 outline-none font-mono disabled:opacity-50"
                    >
                      <option value="all">Probe All Selected ({csvSummary?.totalRows || 629} Companies)</option>
                      <option value="25">Test Probe First 25 Companies</option>
                      <option value="50">Probe First 50 Companies</option>
                      <option value="100">Probe First 100 Companies</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <div className="flex items-center justify-between p-4 rounded-xl bg-gradient-to-r from-brand-950/60 via-dark-850 to-dark-800 border border-brand-500/30 gap-4">
                <div>
                  <h4 className="text-sm font-bold text-white flex items-center gap-2">
                    <span>Asynchronous Multi-ATS Discovery</span>
                    {isRunning && (
                      <span className="flex items-center gap-1 text-[10px] font-mono font-normal px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                        <Radio className="h-2.5 w-2.5 text-emerald-400 animate-pulse" />
                        Running in Background
                      </span>
                    )}
                  </h4>
                  <p className="text-xs text-slate-300 mt-0.5">
                    Probes candidate slugs non-blocking, verifies endpoints, and streams results in real time.
                  </p>
                </div>

                <button
                  onClick={handleCsvDiscovery}
                  disabled={isRunning || startBackgroundDiscoveryMutation.isPending}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold shadow-lg shadow-brand-600/30 transition-all shrink-0 active:scale-95 disabled:opacity-50 cursor-pointer"
                >
                  <RefreshCw
                    className={`h-4 w-4 ${isRunning ? 'animate-spin' : ''}`}
                  />
                  <span>
                    {isRunning
                      ? `Probing (${progressPercent}%)...`
                      : 'Start Discovery Run'}
                  </span>
                </button>
              </div>

              {/* Live Background Progress Bar & Results */}
              {activeJob && (
                <div className="p-4 rounded-xl bg-dark-950 border border-emerald-500/40 space-y-3 animate-fade-in">
                  <div className="flex items-center justify-between pb-1">
                    <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5 font-mono">
                      {isRunning ? (
                        <>
                          <RefreshCw className="h-3.5 w-3.5 animate-spin text-brand-400" />
                          Probing: {activeJob.currentCompany || 'Starting...'}
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                          Discovery Finished {activeJob.durationMs ? `in ${(activeJob.durationMs / 1000).toFixed(1)}s` : ''}
                        </>
                      )}
                    </span>
                    <span className="text-xs font-mono text-slate-300">
                      Discovered <strong className="text-white">{activeJob.discoveredCount}</strong> Boards (<strong className="text-emerald-400">{activeJob.totalJobsSynced}</strong> Jobs Synced)
                    </span>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full bg-dark-800 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-brand-500 to-emerald-400 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-[10px] font-mono text-slate-400">
                    <span>{activeJob.processed} / {activeJob.total} companies probed</span>
                    <span>{progressPercent}% Complete</span>
                  </div>

                  {/* Confirmed Live Results List */}
                  <div className="max-h-56 overflow-y-auto space-y-1.5 pr-1 pt-1">
                    {activeJob.results.slice().reverse().map((r: any) => {
                      const atsBadge = r.hit ? getAtsBadgeStyles(r.hit.provider) : null;
                      return (
                        <div
                          key={`${r.company}-${r.hit?.provider || 'none'}`}
                          className="flex items-center justify-between p-2 rounded-lg bg-dark-850 border border-dark-750 text-xs"
                        >
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-slate-200 font-mono text-[11px]">
                              {r.company}
                            </span>
                            {atsBadge && (
                              <span
                                className={`px-1.5 py-0.2 rounded text-[9px] font-mono border ${atsBadge.bg} ${atsBadge.text} ${atsBadge.border}`}
                              >
                                {atsBadge.label}: {r.hit.slug}
                              </span>
                            )}
                          </div>

                          <div>
                            {r.hit ? (
                              <span className="text-[11px] font-mono text-emerald-400 flex items-center gap-1">
                                <Check className="h-3 w-3" />
                                {r.hit.jobCount} jobs
                              </span>
                            ) : (
                              <span className="text-[11px] font-mono text-slate-500">
                                No public ATS
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* Mode 2: Single Name Probe */
            <div className="space-y-4">
              <form onSubmit={handleSingleDiscovery} className="space-y-3">
                <div>
                  <label className="block text-xs font-mono uppercase text-slate-400 mb-1.5">
                    Company Name
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={singleName}
                      onChange={(e) => setSingleName(e.target.value)}
                      placeholder="e.g. Zapier, MailerLite, Rainforest QA, Sticker Mule"
                      required
                      className="flex-1 bg-dark-950 border border-dark-700 focus:border-brand-500 focus:ring-1 focus:ring-brand-500/50 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 placeholder-slate-500 outline-none transition-all font-mono"
                    />
                    <button
                      type="submit"
                      disabled={discoverAndSyncMutation.isPending || !singleName.trim()}
                      className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold shadow-lg shadow-brand-600/25 transition-all disabled:opacity-50 active:scale-95 shrink-0 cursor-pointer"
                    >
                      <Search
                        className={`h-3.5 w-3.5 ${discoverAndSyncMutation.isPending ? 'animate-spin' : ''}`}
                      />
                      <span>
                        {discoverAndSyncMutation.isPending ? 'Probing...' : 'Probe ATS'}
                      </span>
                    </button>
                  </div>
                </div>
              </form>

              {/* Single Result Details */}
              {singleResult && (
                <div className="p-4 rounded-xl bg-dark-950 border border-dark-750 space-y-3 animate-fade-in">
                  {singleResult.success && singleResult.data?.discovery?.hit ? (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between pb-2 border-b border-dark-800">
                        <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5 font-mono">
                          <CheckCircle2 className="h-4 w-4" />
                          Live ATS Board Verified & Synced!
                        </span>
                        <span className="text-xs font-mono text-slate-400">
                          Tested {singleResult.data.discovery.testedCount} candidate probes
                        </span>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-xs">
                        <div className="p-2.5 rounded-lg bg-dark-850 border border-dark-750">
                          <span className="block text-[10px] text-slate-400 font-mono">Company</span>
                          <span className="font-semibold text-slate-200">{singleResult.data.discovery.hit.company}</span>
                        </div>
                        <div className="p-2.5 rounded-lg bg-dark-850 border border-dark-750">
                          <span className="block text-[10px] text-slate-400 font-mono">ATS Provider</span>
                          <span className="font-semibold text-brand-400">{singleResult.data.discovery.hit.provider}</span>
                        </div>
                        <div className="p-2.5 rounded-lg bg-dark-850 border border-dark-750">
                          <span className="block text-[10px] text-slate-400 font-mono">Verified Slug</span>
                          <span className="font-mono text-slate-200">{singleResult.data.discovery.hit.slug}</span>
                        </div>
                        <div className="p-2.5 rounded-lg bg-dark-850 border border-dark-750">
                          <span className="block text-[10px] text-slate-400 font-mono">Jobs Ingested</span>
                          <span className="font-semibold text-emerald-400">{singleResult.data.discovery.hit.jobCount} jobs</span>
                        </div>
                      </div>

                      <div className="text-[11px] font-mono text-slate-400 truncate bg-dark-850 p-2.5 rounded-lg border border-dark-750 flex items-center justify-between">
                        <span className="truncate">{singleResult.data.discovery.hit.endpoint}</span>
                        <a
                          href={singleResult.data.discovery.hit.endpoint}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-brand-400 hover:text-brand-300 ml-2 shrink-0 flex items-center gap-1"
                        >
                          <span>JSON</span>
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-start gap-2.5 text-xs text-rose-400">
                      <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                      <div>
                        <p className="font-semibold">No active public ATS board found</p>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          Tested candidate slug variations across Greenhouse, Lever, and Ashby.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="pt-4 mt-2 border-t border-dark-800 flex items-center justify-end shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-dark-800 hover:bg-dark-750 border border-dark-700 text-xs font-medium text-slate-300 hover:text-white transition-all cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
