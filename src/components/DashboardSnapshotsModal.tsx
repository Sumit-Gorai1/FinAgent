import React, { useState } from 'react';
import {
  X,
  TrendingUp,
  PieChart,
  LayoutGrid,
  Building2,
  GitBranch,
  ShieldAlert,
  Activity,
  ExternalLink,
  Sparkles,
  Layers,
  ArrowRight,
  Maximize2,
  CheckCircle2,
  Clock,
  Zap,
} from 'lucide-react';

interface DashboardSnapshotsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateView: (
    view: 'research' | 'workflow' | 'watchlist' | 'portfolio' | 'papertrading' | 'all-stocks' | 'sectors'
  ) => void;
}

interface SnapshotItem {
  id: 'research' | 'portfolio' | 'sectors' | 'all-stocks' | 'workflow' | 'watchlist' | 'papertrading';
  title: string;
  badge: string;
  category: string;
  icon: React.ReactNode;
  image?: string;
  description: string;
  highlights: string[];
  viewTarget: 'research' | 'portfolio' | 'sectors' | 'all-stocks' | 'workflow' | 'watchlist' | 'papertrading';
}

const SNAPSHOTS: SnapshotItem[] = [
  {
    id: 'research',
    title: 'Multi-Agent Stock Research Cockpit',
    badge: 'Flagship Cockpit',
    category: 'Equity Intelligence',
    icon: <TrendingUp className="w-4 h-4 text-cyan-400" />,
    image: '/assets/research_cockpit.jpg',
    description:
      'Real-time multi-agent quantitative terminal synthesizing 10 independent analytical engines: Price & Level-2 Depth, Quantitative Technicals, Fundamental Forensics, strictly Fresh News Wire (< 24h), Macro-Economic Transmissions, Bull/Bear Debate Chamber, and DCF Financial Sensitivity Modeling.',
    highlights: [
      'Live LTP tick animation with real-time bid/ask order spread telemetry',
      '10-Agent Investment Committee Scorecard with circular consensus gauge (0–100)',
      'Multi-timeframe candlestick chart (1D to 5Y) with 20/50 SMAs, 21 EMA, and Volume',
      'Strictly fresh current market news wire (< 24h) with 1-day news automatically discarded',
      'Interactive DCF Parametric Model with live Margin of Safety (MoS) sliders',
    ],
    viewTarget: 'research',
  },
  {
    id: 'portfolio',
    title: 'Institutional Portfolio Intelligence & Health Heartbeat',
    badge: 'Portfolio Risk Engine',
    category: 'Capital Management',
    icon: <PieChart className="w-4 h-4 text-emerald-400" />,
    image: '/assets/portfolio_cockpit.jpg',
    description:
      'Institutional portfolio management cockpit tracking live multi-asset valuations, position weights, unrealized gains, sector risk exposures, Monte Carlo Value-at-Risk (VaR), and one-click export to branded PDF & Excel spreadsheets.',
    highlights: [
      'Real-time position P&L tracking benchmarked to live NSE/BSE tick feeds',
      'Asset allocation and industry sector concentration donut charts',
      'Integrated Position Action Modal for instant Buy More, Trim, and Edit operations',
      'Monte Carlo 95% Confidence VaR simulation and downside capital hurdles',
      'One-click export to executive PDF Investment Reports (jsPDF) and Excel (XLSX)',
    ],
    viewTarget: 'portfolio',
  },
  {
    id: 'sectors',
    title: 'Real-Time Industry Sector Performance Heatmap',
    badge: 'Macro Sector Engine',
    category: 'Market Breadth',
    icon: <LayoutGrid className="w-4 h-4 text-cyan-400" />,
    image: '/assets/sector_heatmap.jpg',
    description:
      'Hierarchical performance tree-map grouping all equities into canonical Indian industrial sectors (Banking & Financials, IT, Energy & Power, Automotive & EV, Pharma, FMCG, Metals, Infrastructure, Defence) with live capital flow indicators.',
    highlights: [
      'Color-coded performance gradients (Emerald for strong gains, Rose for pullbacks)',
      'Live market breadth counters: Advances, Declines, and Unchanged ratios',
      'Interactive stock tiles with instantaneous drill-down into 10-agent research',
      'Dual placement: Dedicated full-screen view and embedded in Research cockpit',
    ],
    viewTarget: 'sectors',
  },
  {
    id: 'all-stocks',
    title: 'All 2,570+ Listed Companies Master Directory',
    badge: 'Universe Coverage',
    category: 'Exchange Directory',
    icon: <Building2 className="w-4 h-4 text-emerald-400" />,
    description:
      'Instantaneous search and filtering across all 2,584 companies listed on the National Stock Exchange of India (NSE) and Bombay Stock Exchange (BSE), featuring verified 6-digit BSE scrip codes (e.g. 500325, 532540) and ISIN lookup.',
    highlights: [
      'Comprehensive master universe indexed with official legal names, sectors, and ISINs',
      'Dual-listing badge identification (NSE & BSE Dual vs. BSE Exclusive)',
      'Live batch price polling across active pagination rows',
      'Sub-millisecond client-side filtering by sector, exchange, and market cap',
    ],
    viewTarget: 'all-stocks',
  },
  {
    id: 'workflow',
    title: '10-Agent Directed Acyclic Graph (DAG) Pipeline',
    badge: 'Multi-Agent Telemetry',
    category: 'Autonomous Architecture',
    icon: <GitBranch className="w-4 h-4 text-violet-400" />,
    description:
      'Visual workflow diagram illustrating the orchestrated lifecycle of all 10 independent analytical agents from market ingestion through quantitative proofs, adversarial debate, proof audit, and committee consensus.',
    highlights: [
      'Step-by-step DAG visualization with real-time agent execution telemetry',
      'Strict segregation between deterministic math proofs and qualitative debate',
      'Independent adversarial chamber testing Bull catalysts vs. Bear vulnerabilities',
      'Proof & Audit Verifier ensuring no hallucinated numbers or false citations',
    ],
    viewTarget: 'workflow',
  },
  {
    id: 'watchlist',
    title: 'Continuous Watchlist & Strategic Trigger Monitor',
    badge: 'Autonomous Surveillance',
    category: 'Live Alerts',
    icon: <ShieldAlert className="w-4 h-4 text-amber-400" />,
    description:
      'Autonomous market surveillance engine tracking volume spikes, RSI extremes (>70 / <30), moving average breakouts, and user-defined price thresholds with synthesized Web Audio alert chimes.',
    highlights: [
      'Continuous streaming event log of institutional block activity and technical crosses',
      'Price threshold trigger anchors with Above/Below conditional rules',
      'Integrated Web Audio chimes for immediate notification without audio files',
      'Direct order routing from triggered alerts to the Paper Trading Lab',
    ],
    viewTarget: 'watchlist',
  },
  {
    id: 'papertrading',
    title: 'Virtual Paper Trading Lab & Strategy Backtester',
    badge: 'Execution Simulator',
    category: 'Quantitative Testing',
    icon: <Activity className="w-4 h-4 text-cyan-400" />,
    description:
      'Simulated trading workstation seeded with ₹10,00,000 Virtual INR, featuring live order routing, realistic execution slippage, portfolio transaction ledgers, and multi-year quantitative backtesting against the NIFTY 50 benchmark.',
    highlights: [
      '₹10 Lakhs Virtual INR demo account for testing conviction strategies risk-free',
      'Market and Limit order execution with automated portfolio cash balance deductions',
      '3-Year strategy backtester showing Alpha (+10.6%), Sharpe (1.84), and Max Drawdown',
      'Historical performance chart comparing FINAGENT alpha against NIFTY 50 benchmark',
    ],
    viewTarget: 'papertrading',
  },
];

export const DashboardSnapshotsModal: React.FC<DashboardSnapshotsModalProps> = ({
  isOpen,
  onClose,
  onNavigateView,
}) => {
  const [selectedSnapshotId, setSelectedSnapshotId] = useState<string>('research');
  const [imageErrors, setImageErrors] = useState<Record<string, boolean>>({});

  if (!isOpen) return null;

  const currentSnapshot =
    SNAPSHOTS.find((s) => s.id === selectedSnapshotId) || SNAPSHOTS[0];

  const handleLaunchCockpit = () => {
    onNavigateView(currentSnapshot.viewTarget);
    onClose();
  };

  const handleImageError = (id: string) => {
    setImageErrors((prev) => ({ ...prev, [id]: true }));
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-6xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden relative animate-in fade-in zoom-in-95 duration-200">
        {/* Header Bar */}
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-cyan-950/80 border border-cyan-800/80 text-cyan-400">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold font-mono text-white">
                  FINAGENT Workstation Dashboard Snapshots
                </h2>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-cyan-950 text-cyan-300 border border-cyan-800">
                  Visual Architecture
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Interactive preview gallery, visual schematics, and component breakdowns for all key cockpits.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleLaunchCockpit}
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-mono font-bold transition-all shadow-md shadow-cyan-950"
            >
              <span>Launch {currentSnapshot.title.split(' ')[0]} Cockpit</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              title="Close Snapshots"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Layout */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          {/* Left Sidebar: Snapshot Selector */}
          <div className="w-full md:w-80 border-r border-slate-800/80 bg-slate-950/40 p-3 overflow-y-auto space-y-1.5 shrink-0">
            <span className="text-[11px] font-mono text-slate-500 uppercase tracking-wider px-2 block mb-2 font-semibold">
              Available Cockpits & Views
            </span>

            {SNAPSHOTS.map((snap) => {
              const isSelected = snap.id === selectedSnapshotId;
              return (
                <button
                  key={snap.id}
                  onClick={() => setSelectedSnapshotId(snap.id)}
                  className={`w-full text-left p-3 rounded-2xl transition-all flex items-start gap-3 border ${
                    isSelected
                      ? 'bg-slate-800/90 border-cyan-500/80 shadow-md text-white'
                      : 'bg-slate-900/40 border-slate-800/60 text-slate-400 hover:bg-slate-850 hover:text-slate-200'
                  }`}
                >
                  <div className="p-2 rounded-xl bg-slate-950 border border-slate-800 shrink-0 mt-0.5">
                    {snap.icon}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-1 mb-0.5">
                      <span className="text-[10px] font-mono font-bold text-cyan-400 uppercase tracking-wider">
                        {snap.category}
                      </span>
                      <span className="text-[9px] px-1.5 py-0.2 rounded font-mono font-semibold bg-slate-800 text-slate-300">
                        {snap.badge}
                      </span>
                    </div>
                    <h3 className="text-xs font-bold text-slate-200 truncate">{snap.title}</h3>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Right Main Panel: Visual Preview & Architecture Breakdown */}
          <div className="flex-1 p-5 overflow-y-auto space-y-5 bg-slate-900/50">
            {/* Snapshot Title and Launch Banner */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-slate-950/80 border border-slate-800">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="p-1.5 rounded-lg bg-cyan-950 text-cyan-400 border border-cyan-800">
                    {currentSnapshot.icon}
                  </span>
                  <h3 className="text-base font-bold font-mono text-white">
                    {currentSnapshot.title}
                  </h3>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-cyan-950/80 text-cyan-300 border border-cyan-800">
                    {currentSnapshot.badge}
                  </span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed max-w-2xl">
                  {currentSnapshot.description}
                </p>
              </div>

              <button
                onClick={handleLaunchCockpit}
                className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-xs font-mono font-bold flex items-center justify-center gap-2 transition-all shadow-lg shadow-cyan-950 shrink-0"
              >
                <span>Open Active Cockpit</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            {/* Visual Image Showcase / Fallback Terminal Display */}
            <div className="rounded-2xl border border-slate-800 overflow-hidden bg-slate-950 shadow-xl relative group">
              {currentSnapshot.image && !imageErrors[currentSnapshot.id] ? (
                <div className="relative aspect-video w-full overflow-hidden bg-slate-950">
                  <img
                    src={currentSnapshot.image}
                    alt={currentSnapshot.title}
                    onError={() => handleImageError(currentSnapshot.id)}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.01]"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent pointer-events-none"></div>
                  <div className="absolute bottom-3 left-4 right-4 flex items-center justify-between text-xs font-mono text-slate-300">
                    <span className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                      High-Resolution Workstation Snapshot
                    </span>
                    <button
                      onClick={handleLaunchCockpit}
                      className="px-2.5 py-1 rounded-lg bg-slate-900/90 text-cyan-300 border border-slate-700 hover:border-cyan-500 text-[11px] font-bold transition-all"
                    >
                      Inspect Live Component →
                    </button>
                  </div>
                </div>
              ) : (
                /* Stylized Fallback Container if offline or image loading */
                <div className="p-8 aspect-video flex flex-col justify-between bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 border-t border-slate-800 text-left">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full bg-rose-500"></span>
                      <span className="w-3 h-3 rounded-full bg-amber-500"></span>
                      <span className="w-3 h-3 rounded-full bg-emerald-500"></span>
                      <span className="text-xs font-mono text-slate-400 ml-2">
                        FINAGENT // {currentSnapshot.id.toUpperCase()}_COCKPIT
                      </span>
                    </div>
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-cyan-950 text-cyan-300 border border-cyan-800">
                      LIVE SYSTEM READY
                    </span>
                  </div>

                  <div className="space-y-3 py-6 max-w-xl">
                    <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1">
                      <div className="text-xs font-mono text-cyan-400 font-bold uppercase">
                        {currentSnapshot.category} Engine Architecture
                      </div>
                      <div className="text-sm font-bold text-white">{currentSnapshot.title}</div>
                      <p className="text-xs text-slate-400 leading-relaxed">
                        {currentSnapshot.description}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-slate-800/80 text-xs font-mono text-slate-400">
                    <span>STATUS: ACTIVE & FULLY INTERACTIVE</span>
                    <button
                      onClick={handleLaunchCockpit}
                      className="text-cyan-400 hover:underline font-bold flex items-center gap-1"
                    >
                      Launch in Full Cockpit View →
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Architectural Highlights Checklist */}
            <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                  Key Functional Highlights & Telemetry
                </span>
                <span className="text-[11px] font-mono text-slate-500">
                  {currentSnapshot.highlights.length} Verified Capabilities
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                {currentSnapshot.highlights.map((highlight, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-xl bg-slate-900/70 border border-slate-800/80 flex items-start gap-2.5 text-xs text-slate-300 leading-relaxed"
                  >
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span>{highlight}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Actions Footer */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-2 text-xs font-mono text-slate-400">
              <div className="flex items-center gap-2">
                <Clock className="w-3.5 h-3.5 text-cyan-400" />
                <span>Reference Documentation: DASHBOARD_SNAPSHOTS.md</span>
              </div>
              <button
                onClick={handleLaunchCockpit}
                className="text-cyan-400 hover:text-cyan-300 font-bold flex items-center gap-1 transition-colors"
              >
                <span>Navigate directly to this view</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
