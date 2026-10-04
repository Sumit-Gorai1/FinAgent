import React, { useState, useEffect } from 'react';
import {
  Cpu,
  Activity,
  ShieldAlert,
  PieChart,
  GitBranch,
  TrendingUp,
  HelpCircle,
  Sparkles,
  Bell,
  Zap,
  Bug,
  Mail,
  User,
  LogOut,
  CreditCard,
  X,
  Radio,
  Globe2,
  Building2,
  LayoutGrid,
  Layers,
} from 'lucide-react';
import { UserProfile } from '../types';
import { DynamicLogo } from './DynamicLogo';

interface HeaderProps {
  activeView: 'research' | 'workflow' | 'watchlist' | 'portfolio' | 'papertrading' | 'all-stocks' | 'sectors';
  setActiveView: (view: 'research' | 'workflow' | 'watchlist' | 'portfolio' | 'papertrading' | 'all-stocks' | 'sectors') => void;
  selectedSymbol: string;
  onSearchSymbol?: (sym: string) => void;
  onOpenCompliance: () => void;
  isAnalyzing: boolean;
  alertsCount?: number;
  onOpenAlerts?: () => void;
  onOpenBugAgent?: () => void;
  onOpenPipeline?: () => void;
  onOpenIndianStocksModal?: () => void;
  onOpenSnapshots?: () => void;
  user?: UserProfile | null;
  onOpenLogin?: () => void;
  onLogout?: () => void;
}

export interface MarketBenchmarkItem {
  id: string;
  name: string;
  symbol: string;
  value: number;
  formattedValue: string;
  change: number;
  changePercent: number;
  currency: string;
  isPositive: boolean;
  unit?: string;
  secondaryInfo?: string;
  timestamp?: string;
}

const DEFAULT_BENCHMARKS: Record<string, MarketBenchmarkItem> = {
  nifty50: {
    id: 'nifty50',
    name: 'NIFTY 50',
    symbol: 'NIFTY 50',
    value: 23270.60,
    formattedValue: '23,270.60',
    change: 152.00,
    changePercent: 0.66,
    currency: '',
    isPositive: true,
  },
  sensex: {
    id: 'sensex',
    name: 'SENSEX',
    symbol: 'SENSEX',
    value: 74314.59,
    formattedValue: '74,314.59',
    change: 310.79,
    changePercent: 0.42,
    currency: '',
    isPositive: true,
  },
  giftNifty: {
    id: 'giftNifty',
    name: 'GIFT NIFTY',
    symbol: 'GIFT NIFTY',
    value: 23312.00,
    formattedValue: '23,312.00',
    change: 148.50,
    changePercent: 0.64,
    currency: '',
    isPositive: true,
  },
  usdInr: {
    id: 'usdInr',
    name: 'USD/INR',
    symbol: 'USD/INR',
    value: 95.92,
    formattedValue: '₹95.92',
    change: -0.02,
    changePercent: -0.02,
    currency: '₹',
    isPositive: false,
  },
  brentCrude: {
    id: 'brentCrude',
    name: 'BRENT CRUDE',
    symbol: 'BRENT CRUDE',
    value: 102.81,
    formattedValue: '$102.81',
    unit: '/bbl',
    change: -3.02,
    changePercent: -2.85,
    currency: '$',
    isPositive: false,
  },
  gold: {
    id: 'gold',
    name: 'GOLD',
    symbol: 'GOLD',
    value: 4412.20,
    formattedValue: '$4,412.20',
    unit: '/oz',
    secondaryInfo: 'MCX ~₹75,850/10g',
    change: 24.70,
    changePercent: 0.56,
    currency: '$',
    isPositive: true,
  },
  silver: {
    id: 'silver',
    name: 'SILVER',
    symbol: 'SILVER',
    value: 66.50,
    formattedValue: '$66.50',
    unit: '/oz',
    secondaryInfo: 'MCX ~₹92,400/kg',
    change: 1.58,
    changePercent: 2.43,
    currency: '$',
    isPositive: true,
  },
};

export const Header: React.FC<HeaderProps> = ({
  activeView,
  setActiveView,
  selectedSymbol,
  onSearchSymbol,
  onOpenCompliance,
  isAnalyzing,
  alertsCount = 0,
  onOpenAlerts,
  onOpenBugAgent,
  onOpenPipeline,
  onOpenIndianStocksModal,
  onOpenSnapshots,
  user,
  onOpenLogin,
  onLogout,
}) => {
  const [benchmarks, setBenchmarks] = React.useState<Record<string, MarketBenchmarkItem>>(DEFAULT_BENCHMARKS);
  const [isBenchmarksLive, setIsBenchmarksLive] = React.useState(true);

  // Poll real-time market benchmark feeds (NIFTY 50, SENSEX, GIFT NIFTY, USD/INR, BRENT CRUDE, GOLD, SILVER)
  React.useEffect(() => {
    let isMounted = true;

    const fetchBenchmarks = async () => {
      try {
        const res = await fetch('/api/market-benchmarks');
        if (res.ok) {
          const data = await res.json();
          if (data.success && data.benchmarks && isMounted) {
            setBenchmarks(data.benchmarks);
            setIsBenchmarksLive(true);
          }
        }
      } catch {
        // Fallback already populated
      }
    };

    fetchBenchmarks();
    const interval = setInterval(fetchBenchmarks, 6000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  return (
    <header className="border-b border-slate-800 bg-slate-950/95 backdrop-blur sticky top-0 z-40">
      {/* Ticker tape bar */}
      <div className="border-b border-slate-800/80 bg-slate-900/60 text-xs py-1.5 px-4 overflow-x-auto whitespace-nowrap scrollbar-none flex items-center gap-6 justify-between">
        <div className="flex items-center gap-5 text-slate-400 font-mono text-[11px]">
          <span className="flex items-center gap-1.5 shrink-0">
            <span className={`w-2 h-2 rounded-full ${isBenchmarksLive ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`}></span>
            <span className="text-slate-300 font-semibold text-[11px] font-mono">MARKET LIVE</span>
          </span>

          <span className="inline-flex items-center gap-1">
            <span className="text-slate-400">NIFTY 50:</span>
            <strong className={benchmarks.nifty50.isPositive ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
              {benchmarks.nifty50.formattedValue}
            </strong>
            <span className={benchmarks.nifty50.isPositive ? 'text-emerald-400 text-[10px]' : 'text-rose-400 text-[10px]'}>
              ({benchmarks.nifty50.changePercent >= 0 ? '+' : ''}{benchmarks.nifty50.changePercent.toFixed(2)}%)
            </span>
          </span>

          <span className="inline-flex items-center gap-1">
            <span className="text-slate-400">SENSEX:</span>
            <strong className={benchmarks.sensex.isPositive ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
              {benchmarks.sensex.formattedValue}
            </strong>
            <span className={benchmarks.sensex.isPositive ? 'text-emerald-400 text-[10px]' : 'text-rose-400 text-[10px]'}>
              ({benchmarks.sensex.changePercent >= 0 ? '+' : ''}{benchmarks.sensex.changePercent.toFixed(2)}%)
            </span>
          </span>

          <span className="inline-flex items-center gap-1">
            <span className="text-slate-400">GIFT NIFTY:</span>
            <strong className={benchmarks.giftNifty.isPositive ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
              {benchmarks.giftNifty.formattedValue}
            </strong>
            <span className={benchmarks.giftNifty.isPositive ? 'text-emerald-400 text-[10px]' : 'text-rose-400 text-[10px]'}>
              ({benchmarks.giftNifty.changePercent >= 0 ? '+' : ''}{benchmarks.giftNifty.changePercent.toFixed(2)}%)
            </span>
          </span>

          <span className="inline-flex items-center gap-1">
            <span className="text-slate-400">USD/INR:</span>
            <strong className={benchmarks.usdInr.isPositive ? 'text-emerald-400 font-bold' : 'text-slate-200 font-bold'}>
              {benchmarks.usdInr.formattedValue}
            </strong>
            <span className={benchmarks.usdInr.isPositive ? 'text-emerald-400 text-[10px]' : 'text-rose-400 text-[10px]'}>
              ({benchmarks.usdInr.changePercent >= 0 ? '+' : ''}{benchmarks.usdInr.changePercent.toFixed(2)}%)
            </span>
          </span>

          <span className="inline-flex items-center gap-1">
            <span className="text-slate-400">BRENT CRUDE:</span>
            <strong className={benchmarks.brentCrude.isPositive ? 'text-emerald-400 font-bold' : 'text-amber-400 font-bold'}>
              {benchmarks.brentCrude.formattedValue}{benchmarks.brentCrude.unit || ''}
            </strong>
            <span className={benchmarks.brentCrude.isPositive ? 'text-emerald-400 text-[10px]' : 'text-rose-400 text-[10px]'}>
              ({benchmarks.brentCrude.changePercent >= 0 ? '+' : ''}{benchmarks.brentCrude.changePercent.toFixed(2)}%)
            </span>
          </span>

          <span className="inline-flex items-center gap-1">
            <span className="text-amber-300 font-medium">GOLD:</span>
            <strong className="text-amber-400 font-bold">
              {benchmarks.gold.formattedValue}{benchmarks.gold.unit || ''}
            </strong>
            <span className={benchmarks.gold.isPositive ? 'text-emerald-400 text-[10px]' : 'text-rose-400 text-[10px]'}>
              ({benchmarks.gold.changePercent >= 0 ? '+' : ''}{benchmarks.gold.changePercent.toFixed(2)}%)
            </span>
            {benchmarks.gold.secondaryInfo && (
              <span className="text-[10px] text-amber-200/90 bg-amber-950/60 px-1.5 py-0.5 rounded border border-amber-800/50">
                {benchmarks.gold.secondaryInfo}
              </span>
            )}
          </span>

          <span className="inline-flex items-center gap-1">
            <span className="text-slate-300 font-medium">SILVER:</span>
            <strong className="text-slate-200 font-bold">
              {benchmarks.silver.formattedValue}{benchmarks.silver.unit || ''}
            </strong>
            <span className={benchmarks.silver.isPositive ? 'text-emerald-400 text-[10px]' : 'text-rose-400 text-[10px]'}>
              ({benchmarks.silver.changePercent >= 0 ? '+' : ''}{benchmarks.silver.changePercent.toFixed(2)}%)
            </span>
            {benchmarks.silver.secondaryInfo && (
              <span className="text-[10px] text-slate-300/90 bg-slate-800/70 px-1.5 py-0.5 rounded border border-slate-700/70">
                {benchmarks.silver.secondaryInfo}
              </span>
            )}
          </span>
        </div>

        <div className="flex items-center gap-3">
          {onOpenAlerts && (
            <button
              onClick={onOpenAlerts}
              className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-[11px] font-mono transition-colors"
              title="View Price Threshold Alerts"
            >
              <Bell className="w-3 h-3 text-amber-400" />
              <span>Threshold Alerts</span>
              {alertsCount > 0 && (
                <span className="px-1.5 py-0.2 rounded-full bg-amber-500/20 text-amber-300 font-bold text-[10px]">
                  {alertsCount}
                </span>
              )}
            </button>
          )}

          {onOpenBugAgent && (
            <button
              id="header-bug-agent-btn"
              onClick={onOpenBugAgent}
              className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-violet-950/90 hover:bg-violet-900 text-violet-300 border border-violet-700/70 text-[11px] font-mono transition-colors shadow-sm"
              title="Open Autonomous Bug Agent (System Health & Auto-Repair)"
            >
              <Bug className="w-3 h-3 text-violet-400" />
              <span className="font-semibold">Bug Agent</span>
              <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-pulse"></span>
            </button>
          )}

          {onOpenPipeline && (
            <button
              id="header-pipeline-btn"
              onClick={onOpenPipeline}
              className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-950/90 hover:bg-blue-900 text-blue-300 border border-blue-700/70 text-[11px] font-mono transition-colors shadow-sm"
              title="Inspect Direct Exchange Market Data Feeds"
            >
              <Globe2 className="w-3 h-3 text-cyan-400" />
              <span className="font-semibold">Market Feeds</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
            </button>
          )}

          {onOpenSnapshots && (
            <button
              id="header-snapshots-btn"
              onClick={onOpenSnapshots}
              className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-cyan-950/90 hover:bg-cyan-900 text-cyan-300 border border-cyan-700/70 text-[11px] font-mono transition-colors shadow-sm"
              title="View Interactive Dashboard Snapshots & Visual Architecture Guide"
            >
              <Layers className="w-3 h-3 text-cyan-400" />
              <span className="font-semibold">Snapshots</span>
            </button>
          )}

          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-cyan-950/80 text-cyan-300 border border-cyan-800/60 text-[11px] font-mono">
            <Cpu className="w-3 h-3 text-cyan-400" />
            10-Agent Autonomous Swarm Active
          </span>
          <button
            onClick={onOpenCompliance}
            className="text-[11px] text-slate-400 hover:text-slate-200 flex items-center gap-1 transition-colors"
          >
            <HelpCircle className="w-3.5 h-3.5" />
            SEBI / Disclaimer
          </button>

          {/* User Email Authentication / Profile Option */}
          {user ? (
            <div className="flex items-center gap-1.5 pl-2 border-l border-slate-800">
              <button
                onClick={onOpenLogin}
                className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-slate-800/90 hover:bg-slate-750 text-slate-200 border border-slate-700 text-[11px] font-mono transition-colors"
                title="Account Profile & Settings"
              >
                <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                <span className="truncate max-w-[130px] font-semibold text-cyan-300">{user.email}</span>
                <span className="px-1 py-0.2 bg-emerald-950 text-emerald-300 rounded text-[9px] font-bold border border-emerald-800">
                  ACTIVE
                </span>
              </button>
              {onLogout && (
                <button
                  onClick={onLogout}
                  className="p-1 rounded text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors"
                  title="Sign Out"
                >
                  <LogOut className="w-3 h-3" />
                </button>
              )}
            </div>
          ) : (
            <button
              onClick={onOpenLogin}
              className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-[11px] font-medium transition-all shadow-sm shadow-cyan-900/40"
              title="Sign in with Email"
            >
              <Mail className="w-3 h-3" />
              <span>Email Login</span>
            </button>
          )}
        </div>
      </div>

      {/* Main navigation and search */}
      <div className="max-w-7xl mx-auto px-4 py-3 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <DynamicLogo
          size="md"
          showBadge={true}
          showSubtitle={true}
          onClick={() => setActiveView('research')}
        />

        {/* View Switcher Tabs and User Action */}
        <div className="w-full md:w-auto overflow-x-auto scrollbar-none pb-1">
          <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800 text-xs font-medium w-max">
            <button
              onClick={() => setActiveView('research')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all whitespace-nowrap shrink-0 ${
                activeView === 'research'
                  ? 'bg-cyan-600 text-white shadow-sm font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <TrendingUp className="w-3.5 h-3.5" />
              Research Cockpit
            </button>

            <button
              id="nav-all-stocks-tab"
              onClick={() => setActiveView('all-stocks')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all whitespace-nowrap shrink-0 ${
                activeView === 'all-stocks'
                  ? 'bg-gradient-to-r from-emerald-600 to-cyan-600 text-white shadow-sm font-semibold'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Building2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>All Indian Stocks</span>
              <span className="px-1.5 py-0.2 rounded-full bg-emerald-500/20 text-emerald-300 font-bold text-[10px]">
                2,570+
              </span>
            </button>

            <button
              id="nav-sector-heatmap-tab"
              onClick={() => setActiveView('sectors')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all whitespace-nowrap shrink-0 ${
                activeView === 'sectors'
                  ? 'bg-cyan-600 text-white shadow-sm font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5 text-cyan-400" />
              <span>Sector Heatmap</span>
            </button>

            <button
              onClick={() => setActiveView('workflow')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all whitespace-nowrap shrink-0 ${
                activeView === 'workflow'
                  ? 'bg-cyan-600 text-white shadow-sm font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <GitBranch className="w-3.5 h-3.5" />
              10-Agent DAG
            </button>

            <button
              onClick={() => setActiveView('watchlist')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all relative whitespace-nowrap shrink-0 ${
                activeView === 'watchlist'
                  ? 'bg-cyan-600 text-white shadow-sm font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <ShieldAlert className="w-3.5 h-3.5" />
              Monitor & Alerts
              <span className="w-2 h-2 rounded-full bg-rose-500 absolute -top-0.5 -right-0.5 animate-pulse"></span>
            </button>

            <button
              onClick={() => setActiveView('portfolio')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all whitespace-nowrap shrink-0 ${
                activeView === 'portfolio'
                  ? 'bg-cyan-600 text-white shadow-sm font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <PieChart className="w-3.5 h-3.5" />
              Portfolio AI
            </button>

            <button
              onClick={() => setActiveView('papertrading')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all whitespace-nowrap shrink-0 ${
                activeView === 'papertrading'
                  ? 'bg-cyan-600 text-white shadow-sm font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Activity className="w-3.5 h-3.5" />
              Paper Trade & Backtest
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
