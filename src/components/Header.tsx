import React, { useState, useRef, useEffect } from 'react';
import {
  Cpu,
  Search,
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
  Crown,
  CreditCard,
  X,
  Radio,
  Globe2,
  Building2,
  CornerDownLeft,
  LayoutGrid,
} from 'lucide-react';
import { UserProfile } from '../types';
import { DynamicLogo } from './DynamicLogo';
import { searchStockCatalog, resolveStockQuery, INDIAN_STOCKS_MASTER, getMatchSegments } from '../utils/stockSearchResolver';

interface HeaderProps {
  activeView: 'research' | 'workflow' | 'watchlist' | 'portfolio' | 'papertrading' | 'pricing' | 'all-stocks' | 'sectors';
  setActiveView: (view: 'research' | 'workflow' | 'watchlist' | 'portfolio' | 'papertrading' | 'pricing' | 'all-stocks' | 'sectors') => void;
  selectedSymbol: string;
  onSearchSymbol: (sym: string) => void;
  onOpenCompliance: () => void;
  isAnalyzing: boolean;
  alertsCount?: number;
  onOpenAlerts?: () => void;
  onOpenBugAgent?: () => void;
  onOpenPipeline?: () => void;
  onOpenIndianStocksModal?: () => void;
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
  user,
  onOpenLogin,
  onLogout,
}) => {
  const [searchInput, setSearchInput] = React.useState('');
  const [showSuggestions, setShowSuggestions] = React.useState(false);
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = React.useState<number>(-1);
  const [benchmarks, setBenchmarks] = React.useState<Record<string, MarketBenchmarkItem>>(DEFAULT_BENCHMARKS);
  const [isBenchmarksLive, setIsBenchmarksLive] = React.useState(true);
  const searchContainerRef = React.useRef<HTMLDivElement>(null);

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

  React.useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
        setSelectedSuggestionIndex(-1);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const searchResults = searchStockCatalog(searchInput, 8);
  const topSuggestedStock = searchResults.length > 0 ? searchResults[0] : null;

  const handleSelectStock = (sym: string) => {
    onSearchSymbol(sym);
    setSearchInput('');
    setShowSuggestions(false);
    setSelectedSuggestionIndex(-1);
  };

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (!showSuggestions) setShowSuggestions(true);
      setSelectedSuggestionIndex((prev) =>
        prev < searchResults.length - 1 ? prev + 1 : 0
      );
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedSuggestionIndex((prev) =>
        prev > 0 ? prev - 1 : searchResults.length - 1
      );
    } else if (e.key === 'Tab') {
      if (searchResults.length > 0) {
        e.preventDefault();
        const chosen =
          selectedSuggestionIndex >= 0 && searchResults[selectedSuggestionIndex]
            ? searchResults[selectedSuggestionIndex]
            : searchResults[0];
        handleSelectStock(chosen.symbol);
      }
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (selectedSuggestionIndex >= 0 && searchResults[selectedSuggestionIndex]) {
        handleSelectStock(searchResults[selectedSuggestionIndex].symbol);
      } else if (searchResults.length > 0) {
        // Automatically select the top suggested stock! User does NOT need to type whole name
        handleSelectStock(searchResults[0].symbol);
      } else if (searchInput.trim()) {
        const sym = resolveStockQuery(searchInput.trim());
        handleSelectStock(sym);
      }
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
      setSelectedSuggestionIndex(-1);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedSuggestionIndex >= 0 && searchResults[selectedSuggestionIndex]) {
      handleSelectStock(searchResults[selectedSuggestionIndex].symbol);
    } else if (searchResults.length > 0) {
      handleSelectStock(searchResults[0].symbol);
    } else if (searchInput.trim()) {
      const sym = resolveStockQuery(searchInput.trim());
      handleSelectStock(sym);
    }
  };

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

          {/* Pricing & Subscription Hub Button */}
          <button
            onClick={() => setActiveView('pricing')}
            className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-mono transition-all shadow-sm ${
              activeView === 'pricing'
                ? 'bg-amber-500 text-slate-950 font-bold border border-amber-400'
                : 'bg-amber-950/80 hover:bg-amber-900 text-amber-300 border border-amber-700/70'
            }`}
            title="Subscription Model & Payment Gateway"
          >
            <Crown className="w-3 h-3 text-amber-400 fill-amber-400/30" />
            <span className="font-semibold">Pricing & Plans</span>
          </button>

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
                <span className="px-1 py-0.2 bg-cyan-950 text-cyan-300 rounded text-[9px] font-bold border border-cyan-800">
                  {user.tier === 'PRO_INVESTOR' ? 'PRO' : user.tier}
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

        {/* Direct Stock Search Input with Live Autocomplete */}
        <div ref={searchContainerRef} className="w-full flex-1 max-w-xl relative">
          <form onSubmit={handleSearchSubmit} className="relative w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchInput}
              onFocus={() => setShowSuggestions(true)}
              onKeyDown={handleSearchKeyDown}
              onChange={(e) => {
                setSearchInput(e.target.value);
                setShowSuggestions(true);
                setSelectedSuggestionIndex(-1);
              }}
              placeholder="Search ticker or company (e.g. INFY, Tata, Reliance, Apple)..."
              className="w-full bg-slate-900/90 border border-slate-700/80 rounded-lg pl-9 pr-28 sm:pr-36 py-2 text-xs sm:text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 font-mono transition-colors"
            />
            {searchInput && (
              <button
                type="button"
                onClick={() => {
                  setSearchInput('');
                  setShowSuggestions(false);
                  setSelectedSuggestionIndex(-1);
                }}
                className="absolute right-24 sm:right-28 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 p-0.5"
                title="Clear input"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
            <button
              type="submit"
              disabled={isAnalyzing}
              className="absolute right-1.5 top-1/2 -translate-y-1/2 px-2.5 sm:px-3 py-1 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-xs font-semibold rounded transition-all disabled:opacity-50 flex items-center gap-1 shadow-sm font-mono"
            >
              {isAnalyzing ? (
                <>
                  <Activity className="w-3 h-3 animate-spin" />
                  <span className="hidden sm:inline">Analyzing</span>
                </>
              ) : topSuggestedStock && searchInput.trim() ? (
                <>
                  <span className="truncate max-w-[85px] sm:max-w-[110px]">{topSuggestedStock.symbol}</span>
                  <CornerDownLeft className="w-3 h-3 text-cyan-200" />
                </>
              ) : (
                <>
                  <Sparkles className="w-3 h-3" />
                  <span>Research</span>
                </>
              )}
            </button>
          </form>

          {/* Autocomplete Results Dropdown */}
          {showSuggestions && searchResults.length > 0 && (
            <div className="absolute left-0 right-0 top-full mt-1.5 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl overflow-hidden z-50 py-1.5 font-mono backdrop-blur-lg">
              <div className="px-3 py-1.5 text-[10px] uppercase tracking-wider text-slate-400 font-semibold border-b border-slate-800 flex justify-between items-center bg-slate-950/50">
                <span className="flex items-center gap-1.5 text-cyan-300 font-bold">
                  <Sparkles className="w-3 h-3 text-cyan-400" />
                  {searchInput.trim()
                    ? `Matched Suggestions (${searchResults.length})`
                    : '⚡ Popular Market Leaders (Instant Switch)'}
                </span>
                <span className="text-[10px] text-slate-400 hidden sm:flex items-center gap-1">
                  <span className="px-1.5 py-0.2 rounded bg-slate-800 border border-slate-700 text-slate-300">↑↓</span> navigate
                  <span className="px-1.5 py-0.2 rounded bg-slate-800 border border-slate-700 text-slate-300 ml-1">Tab</span> / <span className="px-1.5 py-0.2 rounded bg-slate-800 border border-slate-700 text-slate-300">↵</span> auto-select
                </span>
              </div>
              {searchResults.map((item, idx) => {
                const isSelected = idx === selectedSuggestionIndex;
                const symSeg = getMatchSegments(item.symbol, searchInput);
                const nameSeg = getMatchSegments(item.name, searchInput);

                return (
                  <button
                    key={item.symbol}
                    type="button"
                    onMouseEnter={() => setSelectedSuggestionIndex(idx)}
                    onClick={() => handleSelectStock(item.symbol)}
                    className={`w-full text-left px-3 py-2.5 flex items-center justify-between text-xs transition-all group border-b border-slate-800/40 last:border-b-0 ${
                      isSelected
                        ? 'bg-cyan-950/70 border-l-4 border-l-cyan-400 text-white shadow-inner'
                        : 'hover:bg-slate-800/70 text-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0 pr-2">
                      <span className={`font-bold text-sm font-mono tracking-wider shrink-0 ${isSelected ? 'text-cyan-300' : 'text-white group-hover:text-cyan-400'}`}>
                        {symSeg ? (
                          <>
                            {symSeg.before}
                            <span className="text-cyan-400 font-black underline decoration-cyan-400/80 bg-cyan-950/90 px-0.5 rounded">{symSeg.match}</span>
                            {symSeg.after}
                          </>
                        ) : (
                          item.symbol
                        )}
                      </span>
                      <span className="font-sans truncate text-xs text-slate-300">
                        {nameSeg ? (
                          <>
                            {nameSeg.before}
                            <span className="text-cyan-300 font-semibold bg-cyan-950/70 px-0.5 rounded">{nameSeg.match}</span>
                            {nameSeg.after}
                          </>
                        ) : (
                          item.name
                        )}
                      </span>
                      <span className="text-[10px] text-slate-400 hidden sm:inline shrink-0">
                        ({item.sector})
                      </span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {isSelected ? (
                        <span className="text-[10px] px-2 py-0.5 rounded bg-cyan-500 text-slate-950 font-bold flex items-center gap-1 shadow-sm">
                          <CornerDownLeft className="w-3 h-3" /> Select
                        </span>
                      ) : (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700 font-mono">
                          {item.exchange}
                        </span>
                      )}
                      <span className="text-xs text-emerald-400 font-bold font-mono">
                        {item.currency}{item.price.toFixed(2)}
                      </span>
                    </div>
                  </button>
                );
              })}

              {/* All Indian Listed Stocks Directory Link */}
              <button
                type="button"
                onClick={() => {
                  setShowSuggestions(false);
                  if (onOpenIndianStocksModal) {
                    onOpenIndianStocksModal();
                  } else {
                    setActiveView('all-stocks');
                  }
                }}
                className="w-full text-left px-3 py-2.5 bg-gradient-to-r from-emerald-950/90 via-slate-900 to-cyan-950/80 hover:from-emerald-900 hover:to-slate-800 text-emerald-300 flex items-center justify-between text-xs transition-colors border-t border-slate-700/80 font-semibold"
              >
                <div className="flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Browse All 2,570+ Listed Companies in Indian Exchanges</span>
                </div>
                <span className="text-[10px] text-emerald-300 bg-emerald-900/60 px-2 py-0.5 rounded border border-emerald-700 shrink-0">
                  Open Master Directory →
                </span>
              </button>
            </div>
          )}
        </div>

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

            <button
              onClick={() => setActiveView('pricing')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all whitespace-nowrap shrink-0 ${
                activeView === 'pricing'
                  ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 shadow-sm font-bold'
                  : 'text-amber-400/90 hover:text-amber-300'
              }`}
            >
              <Crown className="w-3.5 h-3.5 text-amber-400 fill-amber-400/30" />
              Pricing & Pro
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
