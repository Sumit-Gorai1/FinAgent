import React, { useState, useMemo } from 'react';
import {
  TrendingUp,
  TrendingDown,
  LayoutGrid,
  BarChart3,
  ListOrdered,
  Search,
  ArrowUpRight,
  ArrowDownRight,
  Filter,
  Layers,
  ChevronDown,
  Building2,
  ExternalLink,
  Info,
  Maximize2,
  Minimize2,
  Scale,
  Sparkles,
} from 'lucide-react';
import { StockResearchData } from '../types';
import { EducationalDisclaimer } from './EducationalDisclaimer';

export interface SectorHeatmapProps {
  stocks: Record<string, StockResearchData>;
  onSelectStock: (symbol: string) => void;
  selectedSymbol?: string;
  className?: string;
  isCompact?: boolean;
}

// Canonical Sector Classifications
export const SECTOR_TAXONOMY: Record<string, string> = {
  // Financials
  'Financial Services': 'Banking & Financials',
  'Banking': 'Banking & Financials',
  'Private Commercial Banking': 'Banking & Financials',
  'Banking & Financial Services': 'Banking & Financials',
  'NBFC': 'Banking & Financials',
  'Insurance': 'Banking & Financials',

  // Tech & Electronics
  'Information Technology': 'Information Technology',
  'Information Tech': 'Information Technology',
  'IT Services & Consulting': 'Information Technology',
  'Software': 'Information Technology',
  'Semiconductors': 'Information Technology',
  'Information Tech & AI Chips': 'Information Technology',

  // Energy & Utilities
  'Energy & Conglomerate': 'Energy & Utilities',
  'Energy, Oil & Power': 'Energy & Utilities',
  'Energy & Retail': 'Energy & Utilities',
  'Oil & Gas': 'Energy & Utilities',
  'Power': 'Energy & Utilities',
  'Renewable Energy': 'Energy & Utilities',
  'Utilities': 'Energy & Utilities',

  // Automotive
  'Automotive': 'Automotive & EV',
  'Automotive & EV': 'Automotive & EV',
  'Auto Components': 'Automotive & EV',

  // Healthcare
  'Healthcare & Pharma': 'Healthcare & Pharma',
  'Pharmaceuticals': 'Healthcare & Pharma',
  'Healthcare': 'Healthcare & Pharma',

  // Consumer Goods & FMCG
  'Consumer Goods': 'Consumer Goods & FMCG',
  'Consumer Goods & Retail': 'Consumer Goods & FMCG',
  'FMCG': 'Consumer Goods & FMCG',

  // Consumer Discretionary & Retail
  'Consumer Discretionary': 'Consumer Retail & Tech',
  'Consumer Services': 'Consumer Retail & Tech',
  'New-Age Tech & Internet': 'Consumer Retail & Tech',
  'Retail': 'Consumer Retail & Tech',

  // Capital Goods & Infra
  'Capital Goods & Infra': 'Infrastructure & Infra',
  'Infrastructure & Capital Goods': 'Infrastructure & Infra',
  'Engineering & Construction': 'Infrastructure & Infra',
  'Capital Goods': 'Infrastructure & Infra',

  // Metals & Mining
  'Metals & Mining': 'Metals & Mining',
  'Steel': 'Metals & Mining',
  'Mining': 'Metals & Mining',

  // Defence & Aerospace
  'Defence & Aerospace': 'Defence & Aerospace',
  'Defense': 'Defence & Aerospace',
  'Aerospace': 'Defence & Aerospace',

  // Telecommunications
  'Telecommunications': 'Telecommunications',
  'Telecommunications & Media': 'Telecommunications',
  'Telecom': 'Telecommunications',
};

export interface SectorAggregate {
  canonicalName: string;
  rawSectors: string[];
  stocks: StockResearchData[];
  totalMarketCapCr: number;
  totalVolume: number;
  avgChangePercent: number; // Market-cap weighted
  equalWeightChangePercent: number;
  advances: number;
  declines: number;
  unchanged: number;
  topGainer: StockResearchData | null;
  topLaggard: StockResearchData | null;
}

/**
 * Returns color classes and border styles based on performance percentage
 */
export function getPerformanceTileStyle(pct: number): {
  bgClass: string;
  borderClass: string;
  textClass: string;
  badgeBg: string;
} {
  if (pct >= 3.0) {
    return {
      bgClass: 'bg-emerald-900/90 hover:bg-emerald-800',
      borderClass: 'border-emerald-500/80',
      textClass: 'text-emerald-100',
      badgeBg: 'bg-emerald-500/20 text-emerald-200 border-emerald-500/40',
    };
  }
  if (pct >= 1.5) {
    return {
      bgClass: 'bg-emerald-800/80 hover:bg-emerald-700/90',
      borderClass: 'border-emerald-500/60',
      textClass: 'text-emerald-100',
      badgeBg: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
    };
  }
  if (pct >= 0.5) {
    return {
      bgClass: 'bg-emerald-700/60 hover:bg-emerald-600/70',
      borderClass: 'border-emerald-600/50',
      textClass: 'text-emerald-100',
      badgeBg: 'bg-emerald-600/20 text-emerald-300 border-emerald-600/30',
    };
  }
  if (pct > 0.0) {
    return {
      bgClass: 'bg-emerald-950/70 hover:bg-emerald-900/60',
      borderClass: 'border-emerald-700/50',
      textClass: 'text-emerald-200',
      badgeBg: 'bg-emerald-700/20 text-emerald-400 border-emerald-700/30',
    };
  }
  if (pct === 0.0) {
    return {
      bgClass: 'bg-slate-800/70 hover:bg-slate-700/70',
      borderClass: 'border-slate-700',
      textClass: 'text-slate-300',
      badgeBg: 'bg-slate-700/30 text-slate-300 border-slate-600/30',
    };
  }
  if (pct > -0.5) {
    return {
      bgClass: 'bg-rose-950/70 hover:bg-rose-900/60',
      borderClass: 'border-rose-700/50',
      textClass: 'text-rose-200',
      badgeBg: 'bg-rose-700/20 text-rose-400 border-rose-700/30',
    };
  }
  if (pct > -1.5) {
    return {
      bgClass: 'bg-rose-700/60 hover:bg-rose-600/70',
      borderClass: 'border-rose-600/50',
      textClass: 'text-rose-100',
      badgeBg: 'bg-rose-600/20 text-rose-300 border-rose-600/30',
    };
  }
  if (pct > -3.0) {
    return {
      bgClass: 'bg-rose-800/80 hover:bg-rose-700/90',
      borderClass: 'border-rose-500/60',
      textClass: 'text-rose-100',
      badgeBg: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
    };
  }
  return {
    bgClass: 'bg-rose-900/90 hover:bg-rose-800',
    borderClass: 'border-rose-500/80',
    textClass: 'text-rose-100',
    badgeBg: 'bg-rose-500/20 text-rose-200 border-rose-500/40',
  };
}

export const SectorHeatmap: React.FC<SectorHeatmapProps> = ({
  stocks,
  onSelectStock,
  selectedSymbol,
  className = '',
  isCompact = false,
}) => {
  const [viewMode, setViewMode] = useState<'treemap' | 'matrix' | 'ranking'>('treemap');
  const [weightMode, setWeightMode] = useState<'marketCap' | 'equal'>('marketCap');
  const [performanceFilter, setPerformanceFilter] = useState<'all' | 'gainers' | 'losers' | 'momentum'>('all');
  const [selectedSectorFilter, setSelectedSectorFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [hoveredStock, setHoveredStock] = useState<StockResearchData | null>(null);
  const [expandedSectors, setExpandedSectors] = useState<Record<string, boolean>>({});

  // 1. Group stocks by canonical sector taxonomy
  const sectorGroups = useMemo<SectorAggregate[]>(() => {
    const map = new Map<string, { rawSectors: Set<string>; stocks: StockResearchData[] }>();

    const stockList = Object.values(stocks) as StockResearchData[];
    for (const stock of stockList) {
      if (!stock || !stock.symbol) continue;
      const rawSector =
        stock.fundamentals?.sector ||
        stock.sectorMacro?.sectorName ||
        'Diversified & General';

      const canonical = SECTOR_TAXONOMY[rawSector] || rawSector;

      if (!map.has(canonical)) {
        map.set(canonical, { rawSectors: new Set<string>(), stocks: [] });
      }
      const entry = map.get(canonical)!;
      entry.rawSectors.add(rawSector);
      entry.stocks.push(stock);
    }

    const aggregates: SectorAggregate[] = [];

    for (const [canonicalName, { rawSectors, stocks: secStocks }] of map.entries()) {
      if (secStocks.length === 0) continue;

      let totalMarketCap = 0;
      let totalVolume = 0;
      let weightedChangeSum = 0;
      let equalChangeSum = 0;
      let advances = 0;
      let declines = 0;
      let unchanged = 0;

      let topGainer: StockResearchData | null = null;
      let topLaggard: StockResearchData | null = null;

      for (const s of secStocks) {
        const mcap = s.marketCapCr || 10000;
        const chg = s.changePercent ?? 0;

        totalMarketCap += mcap;
        totalVolume += s.volume || 0;
        weightedChangeSum += chg * mcap;
        equalChangeSum += chg;

        if (chg > 0.001) advances++;
        else if (chg < -0.001) declines++;
        else unchanged++;

        if (!topGainer || chg > (topGainer.changePercent ?? 0)) {
          topGainer = s;
        }
        if (!topLaggard || chg < (topLaggard.changePercent ?? 0)) {
          topLaggard = s;
        }
      }

      const avgChangePercent =
        totalMarketCap > 0
          ? Number((weightedChangeSum / totalMarketCap).toFixed(2))
          : 0;

      const equalWeightChangePercent = Number(
        (equalChangeSum / secStocks.length).toFixed(2)
      );

      // Sort constituent stocks inside sector by market cap desc
      const sortedStocks = [...secStocks].sort(
        (a, b) => (b.marketCapCr || 0) - (a.marketCapCr || 0)
      );

      aggregates.push({
        canonicalName,
        rawSectors: Array.from(rawSectors),
        stocks: sortedStocks,
        totalMarketCapCr: totalMarketCap,
        totalVolume,
        avgChangePercent,
        equalWeightChangePercent,
        advances,
        declines,
        unchanged,
        topGainer,
        topLaggard,
      });
    }

    // Default sort sectors by totalMarketCapCr descending
    return aggregates.sort((a, b) => b.totalMarketCapCr - a.totalMarketCapCr);
  }, [stocks]);

  // 2. Compute Market Breadth & Summary Statistics
  const marketStats = useMemo(() => {
    let totalCap = 0;
    let totalAdv = 0;
    let totalDec = 0;
    let totalFlat = 0;
    let weightedChg = 0;
    let totalStocks = 0;

    for (const sec of sectorGroups) {
      totalCap += sec.totalMarketCapCr;
      totalAdv += sec.advances;
      totalDec += sec.declines;
      totalFlat += sec.unchanged;
      totalStocks += sec.stocks.length;
      weightedChg += sec.avgChangePercent * sec.totalMarketCapCr;
    }

    const marketAverageChange = totalCap > 0 ? Number((weightedChg / totalCap).toFixed(2)) : 0;

    const sortedByPerf = [...sectorGroups].sort(
      (a, b) =>
        (weightMode === 'marketCap' ? b.avgChangePercent : b.equalWeightChangePercent) -
        (weightMode === 'marketCap' ? a.avgChangePercent : a.equalWeightChangePercent)
    );

    const topSector = sortedByPerf[0] || null;
    const laggardSector = sortedByPerf[sortedByPerf.length - 1] || null;

    return {
      totalCap,
      totalAdv,
      totalDec,
      totalFlat,
      totalStocks,
      marketAverageChange,
      topSector,
      laggardSector,
    };
  }, [sectorGroups, weightMode]);

  // 3. Filtered Sectors and Stocks based on search and filters
  const filteredSectors = useMemo(() => {
    return sectorGroups
      .map((sector) => {
        // Sector level filter
        if (selectedSectorFilter !== 'all' && sector.canonicalName !== selectedSectorFilter) {
          return null;
        }

        // Filter constituent stocks
        const matchingStocks = sector.stocks.filter((s) => {
          // Performance filter
          if (performanceFilter === 'gainers' && (s.changePercent ?? 0) <= 0) return false;
          if (performanceFilter === 'losers' && (s.changePercent ?? 0) >= 0) return false;
          if (performanceFilter === 'momentum' && Math.abs(s.changePercent ?? 0) < 1.5) return false;

          // Search query filter
          if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase().trim();
            const symMatch = s.symbol.toLowerCase().includes(q);
            const nameMatch = s.name.toLowerCase().includes(q);
            const secMatch = sector.canonicalName.toLowerCase().includes(q);
            return symMatch || nameMatch || secMatch;
          }

          return true;
        });

        if (matchingStocks.length === 0) return null;

        return {
          ...sector,
          stocks: matchingStocks,
        };
      })
      .filter((s): s is SectorAggregate => s !== null);
  }, [sectorGroups, selectedSectorFilter, performanceFilter, searchQuery]);

  const toggleSectorExpand = (secName: string) => {
    setExpandedSectors((prev) => ({
      ...prev,
      [secName]: !prev[secName],
    }));
  };

  const totalMarketCapForTreemap = useMemo(() => {
    return filteredSectors.reduce((sum, s) => sum + s.totalMarketCapCr, 0);
  }, [filteredSectors]);

  return (
    <div className={`space-y-4 font-sans ${className}`}>
      {/* 1. Market Breadth & Real-Time Sentiment Banner */}
      <div className="p-4 sm:p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-cyan-950 border border-cyan-800/80 text-cyan-400">
                <LayoutGrid className="w-4 h-4" />
              </span>
              <h2 className="text-base sm:text-lg font-bold text-white font-mono tracking-tight flex items-center gap-2">
                Industry Sector Performance Heatmap
                <span className="text-[11px] font-normal text-cyan-400 bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-800/50">
                  Real-Time Market Pulse
                </span>
              </h2>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Visualizing relative capital flows, momentum distribution, and sector market-cap weights across Indian & global benchmark securities.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
            {/* Market Average Badge */}
            <div className="px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center gap-2">
              <span className="text-slate-400">Composite Market:</span>
              <span
                className={`font-bold flex items-center gap-0.5 ${
                  marketStats.marketAverageChange >= 0 ? 'text-emerald-400' : 'text-rose-400'
                }`}
              >
                {marketStats.marketAverageChange >= 0 ? (
                  <ArrowUpRight className="w-3.5 h-3.5" />
                ) : (
                  <ArrowDownRight className="w-3.5 h-3.5" />
                )}
                {marketStats.marketAverageChange >= 0 ? '+' : ''}
                {marketStats.marketAverageChange.toFixed(2)}%
              </span>
            </div>

            {/* Total Cap Badge */}
            <div className="px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-300">
              <span className="text-slate-400 mr-1.5">Tracked Cap:</span>
              <strong className="text-white">
                ₹{(marketStats.totalCap / 100000).toFixed(1)} Lakh Cr
              </strong>
            </div>
          </div>
        </div>

        {/* Market Advance / Decline Breadth Bar */}
        <div className="space-y-1.5 text-xs font-mono">
          <div className="flex flex-wrap items-center justify-between text-slate-400">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-slate-300">Market Breadth:</span>
              <span className="text-emerald-400 font-bold">
                ▲ {marketStats.totalAdv} Advancing
              </span>
              <span>·</span>
              <span className="text-rose-400 font-bold">
                ▼ {marketStats.totalDec} Declining
              </span>
              {marketStats.totalFlat > 0 && (
                <>
                  <span>·</span>
                  <span className="text-slate-400">{marketStats.totalFlat} Flat</span>
                </>
              )}
            </div>

            {marketStats.topSector && marketStats.laggardSector && (
              <div className="hidden sm:flex items-center gap-3 text-[11px]">
                <span className="text-slate-400">
                  Leader:{' '}
                  <strong className="text-emerald-300">
                    {marketStats.topSector.canonicalName} (
                    {marketStats.topSector.avgChangePercent >= 0 ? '+' : ''}
                    {marketStats.topSector.avgChangePercent}%)
                  </strong>
                </span>
                <span>·</span>
                <span className="text-slate-400">
                  Laggard:{' '}
                  <strong className="text-rose-300">
                    {marketStats.laggardSector.canonicalName} (
                    {marketStats.laggardSector.avgChangePercent >= 0 ? '+' : ''}
                    {marketStats.laggardSector.avgChangePercent}%)
                  </strong>
                </span>
              </div>
            )}
          </div>

          {/* Visual Advance/Decline proportional bar */}
          <div className="w-full bg-slate-800 rounded-full h-2 flex overflow-hidden">
            {marketStats.totalStocks > 0 && (
              <>
                <div
                  className="bg-emerald-500 h-full transition-all duration-500"
                  style={{
                    width: `${(marketStats.totalAdv / marketStats.totalStocks) * 100}%`,
                  }}
                  title={`${marketStats.totalAdv} Advancing`}
                />
                <div
                  className="bg-slate-600 h-full transition-all duration-500"
                  style={{
                    width: `${(marketStats.totalFlat / marketStats.totalStocks) * 100}%`,
                  }}
                  title={`${marketStats.totalFlat} Flat`}
                />
                <div
                  className="bg-rose-500 h-full transition-all duration-500"
                  style={{
                    width: `${(marketStats.totalDec / marketStats.totalStocks) * 100}%`,
                  }}
                  title={`${marketStats.totalDec} Declining`}
                />
              </>
            )}
          </div>
        </div>

        {/* 2. Interactive Controls & Filtering Toolbar */}
        <div className="pt-2 flex flex-wrap items-center justify-between gap-3 text-xs">
          {/* Left: View Mode Segmented Controls */}
          <div className="flex items-center gap-1 p-1 bg-slate-950 rounded-xl border border-slate-800">
            <button
              onClick={() => setViewMode('treemap')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap font-medium ${
                viewMode === 'treemap'
                  ? 'bg-slate-800 text-cyan-300 shadow-sm font-semibold'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="Treemap view sized by market capitalisation"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Treemap Tiles</span>
            </button>

            <button
              onClick={() => setViewMode('matrix')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap font-medium ${
                viewMode === 'matrix'
                  ? 'bg-slate-800 text-cyan-300 shadow-sm font-semibold'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="Sector card matrix with constituent stock lists"
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span>Sector Matrix</span>
            </button>

            <button
              onClick={() => setViewMode('ranking')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap font-medium ${
                viewMode === 'ranking'
                  ? 'bg-slate-800 text-cyan-300 shadow-sm font-semibold'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="Ranked relative performance bar chart"
            >
              <ListOrdered className="w-3.5 h-3.5" />
              <span>Performance Ranking</span>
            </button>
          </div>

          {/* Weighting Switcher */}
          <div className="flex items-center gap-1 p-1 bg-slate-950 rounded-xl border border-slate-800">
            <button
              onClick={() => setWeightMode('marketCap')}
              className={`px-2.5 py-1.5 rounded-lg transition-colors whitespace-nowrap font-mono text-[11px] ${
                weightMode === 'marketCap'
                  ? 'bg-slate-800 text-cyan-300 font-semibold'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="Weighted by company market capitalization"
            >
              Cap-Weighted
            </button>
            <button
              onClick={() => setWeightMode('equal')}
              className={`px-2.5 py-1.5 rounded-lg transition-colors whitespace-nowrap font-mono text-[11px] ${
                weightMode === 'equal'
                  ? 'bg-slate-800 text-cyan-300 font-semibold'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="Equal weight per constituent stock"
            >
              Equal-Weight
            </button>
          </div>

          {/* Performance Filters */}
          <div className="flex items-center gap-1 p-1 bg-slate-950 rounded-xl border border-slate-800">
            {[
              { id: 'all', label: 'All' },
              { id: 'gainers', label: 'Gainers (▲)' },
              { id: 'losers', label: 'Losers (▼)' },
              { id: 'momentum', label: '|Δ| > 1.5%' },
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => setPerformanceFilter(f.id as any)}
                className={`px-2.5 py-1.5 rounded-lg transition-colors whitespace-nowrap font-mono text-[11px] ${
                  performanceFilter === f.id
                    ? 'bg-slate-800 text-white font-semibold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Search / Sector Filter */}
          <div className="flex items-center gap-2 w-full lg:w-auto">
            <div className="relative flex-1 lg:w-56">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Filter ticker or sector..."
                className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors font-mono"
              />
            </div>

            <select
              value={selectedSectorFilter}
              onChange={(e) => setSelectedSectorFilter(e.target.value)}
              className="px-2.5 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300 focus:outline-none focus:border-cyan-500 transition-colors font-mono"
            >
              <option value="all">All Sectors ({sectorGroups.length})</option>
              {sectorGroups.map((s) => (
                <option key={s.canonicalName} value={s.canonicalName}>
                  {s.canonicalName} ({s.stocks.length})
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* 3. Heatmap Color Legend */}
      <div className="px-4 py-2 rounded-xl bg-slate-900/60 border border-slate-800/80 flex flex-wrap items-center justify-between gap-3 text-[11px] font-mono">
        <span className="text-slate-400">Color Spectrum Performance Legend:</span>
        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none py-0.5">
          <span className="px-2 py-0.5 rounded bg-rose-900/90 text-rose-100 border border-rose-500/80 font-bold">
            &lt; -3%
          </span>
          <span className="px-2 py-0.5 rounded bg-rose-800/80 text-rose-100 border border-rose-500/60 font-semibold">
            -1.5% to -3%
          </span>
          <span className="px-2 py-0.5 rounded bg-rose-700/60 text-rose-100 border border-rose-600/50">
            -0.5% to -1.5%
          </span>
          <span className="px-2 py-0.5 rounded bg-rose-950/70 text-rose-200 border border-rose-700/50">
            0% to -0.5%
          </span>
          <span className="px-2 py-0.5 rounded bg-slate-800/70 text-slate-300 border border-slate-700">
            0.00%
          </span>
          <span className="px-2 py-0.5 rounded bg-emerald-950/70 text-emerald-200 border border-emerald-700/50">
            0% to +0.5%
          </span>
          <span className="px-2 py-0.5 rounded bg-emerald-700/60 text-emerald-100 border border-emerald-600/50">
            +0.5% to +1.5%
          </span>
          <span className="px-2 py-0.5 rounded bg-emerald-800/80 text-emerald-100 border border-emerald-500/60 font-semibold">
            +1.5% to +3%
          </span>
          <span className="px-2 py-0.5 rounded bg-emerald-900/90 text-emerald-100 border border-emerald-500/80 font-bold">
            &gt; +3%
          </span>
        </div>
      </div>

      {/* 4. MAIN VIEW REPRESENTATION: Treemap Grid */}
      {viewMode === 'treemap' && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredSectors.map((sector) => {
            const sectorPerf =
              weightMode === 'marketCap'
                ? sector.avgChangePercent
                : sector.equalWeightChangePercent;

            const sectorStyle = getPerformanceTileStyle(sectorPerf);
            const relativeWeight =
              totalMarketCapForTreemap > 0
                ? ((sector.totalMarketCapCr / totalMarketCapForTreemap) * 100).toFixed(1)
                : '0';

            return (
              <div
                key={sector.canonicalName}
                className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-lg flex flex-col justify-between space-y-3 transition-all hover:border-slate-700"
              >
                {/* Sector Header */}
                <div className="flex items-start justify-between gap-2 border-b border-slate-800/80 pb-2.5">
                  <div className="min-w-0">
                    <h3 className="text-sm font-bold text-white truncate flex items-center gap-1.5">
                      <span className="truncate">{sector.canonicalName}</span>
                      <span className="text-[10px] text-slate-400 font-mono shrink-0">
                        ({sector.stocks.length} stocks)
                      </span>
                    </h3>
                    <div className="flex items-center gap-2 text-[11px] text-slate-400 font-mono mt-0.5">
                      <span>₹{(sector.totalMarketCapCr / 100000).toFixed(2)}L Cr</span>
                      <span>·</span>
                      <span>{relativeWeight}% Weight</span>
                    </div>
                  </div>

                  {/* Sector Aggregate Return Badge */}
                  <div
                    className={`px-2.5 py-1 rounded-lg border text-xs font-mono font-bold flex items-center gap-1 shrink-0 ${sectorStyle.badgeBg}`}
                  >
                    {sectorPerf >= 0 ? (
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    ) : (
                      <ArrowDownRight className="w-3.5 h-3.5" />
                    )}
                    <span>
                      {sectorPerf >= 0 ? '+' : ''}
                      {sectorPerf.toFixed(2)}%
                    </span>
                  </div>
                </div>

                {/* Sized Constituent Stock Tiles inside Sector */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 flex-1">
                  {sector.stocks.map((stock) => {
                    const chg = stock.changePercent ?? 0;
                    const tileStyle = getPerformanceTileStyle(chg);
                    const isSelected = selectedSymbol === stock.symbol;

                    return (
                      <button
                        key={stock.symbol}
                        onClick={() => onSelectStock(stock.symbol)}
                        onMouseEnter={() => setHoveredStock(stock)}
                        onMouseLeave={() => setHoveredStock(null)}
                        className={`p-2.5 rounded-xl border text-left flex flex-col justify-between transition-all duration-200 group relative ${
                          tileStyle.bgClass
                        } ${tileStyle.borderClass} ${
                          isSelected ? 'ring-2 ring-cyan-400 shadow-lg scale-[1.02]' : 'hover:scale-[1.02]'
                        }`}
                        title={`${stock.symbol}: ${stock.name} (${chg >= 0 ? '+' : ''}${chg}%)`}
                      >
                        <div className="flex items-center justify-between gap-1">
                          <span className="font-bold text-xs sm:text-sm font-mono text-white tracking-wide group-hover:underline">
                            {stock.symbol}
                          </span>
                          <span className={`text-[11px] font-bold font-mono ${tileStyle.textClass}`}>
                            {chg >= 0 ? '+' : ''}
                            {chg.toFixed(2)}%
                          </span>
                        </div>

                        <div className="mt-2 flex items-baseline justify-between text-[11px] font-mono">
                          <span className="text-white/90 font-semibold">
                            {stock.currency}
                            {stock.price.toLocaleString(undefined, {
                              minimumFractionDigits: 1,
                              maximumFractionDigits: 2,
                            })}
                          </span>
                          <span className="text-[10px] text-white/60 truncate max-w-[65px]">
                            ₹{(stock.marketCapCr / 100000).toFixed(1)}L Cr
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Sector Footer Callouts */}
                <div className="pt-2 border-t border-slate-800/60 flex items-center justify-between text-[11px] font-mono text-slate-400">
                  <div className="flex items-center gap-1.5">
                    <span className="text-emerald-400">▲ {sector.advances}</span>
                    <span>/</span>
                    <span className="text-rose-400">▼ {sector.declines}</span>
                  </div>
                  {sector.topGainer && (
                    <span className="truncate max-w-[170px] text-right">
                      Top:{' '}
                      <strong className="text-emerald-300">
                        {sector.topGainer.symbol} (+
                        {(sector.topGainer.changePercent ?? 0).toFixed(1)}%)
                      </strong>
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 5. VIEW MODE: Sector Matrix Cards */}
      {viewMode === 'matrix' && (
        <div className="space-y-4">
          {filteredSectors.map((sector) => {
            const sectorPerf =
              weightMode === 'marketCap'
                ? sector.avgChangePercent
                : sector.equalWeightChangePercent;
            const sectorStyle = getPerformanceTileStyle(sectorPerf);
            const isExpanded = expandedSectors[sector.canonicalName] ?? true;

            return (
              <div
                key={sector.canonicalName}
                className="p-4 sm:p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-4"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-bold text-white font-mono flex items-center gap-2">
                        {sector.canonicalName}
                        <span className="text-xs text-slate-400 font-normal">
                          ({sector.stocks.length} tracked companies)
                        </span>
                      </h3>
                      <button
                        onClick={() => toggleSectorExpand(sector.canonicalName)}
                        className="p-1 rounded text-slate-400 hover:text-white transition-colors"
                        title={isExpanded ? 'Collapse' : 'Expand'}
                      >
                        <ChevronDown
                          className={`w-4 h-4 transition-transform duration-200 ${
                            isExpanded ? 'rotate-180' : ''
                          }`}
                        />
                      </button>
                    </div>
                    <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400 font-mono mt-1">
                      <span>Total Market Cap: <strong>₹{(sector.totalMarketCapCr / 100000).toFixed(2)} Lakh Cr</strong></span>
                      <span>·</span>
                      <span>Total Volume: <strong>{(sector.totalVolume / 1000000).toFixed(2)}M</strong></span>
                      <span>·</span>
                      <span className="text-emerald-400">▲ {sector.advances} Advancing</span>
                      <span>·</span>
                      <span className="text-rose-400">▼ {sector.declines} Declining</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <div
                      className={`px-3 py-1.5 rounded-xl border text-sm font-mono font-bold flex items-center gap-1.5 ${sectorStyle.badgeBg}`}
                    >
                      {sectorPerf >= 0 ? (
                        <ArrowUpRight className="w-4 h-4" />
                      ) : (
                        <ArrowDownRight className="w-4 h-4" />
                      )}
                      <span>
                        {sectorPerf >= 0 ? '+' : ''}
                        {sectorPerf.toFixed(2)}%
                      </span>
                    </div>
                  </div>
                </div>

                {/* Expanded Constituent Stock Grid */}
                {isExpanded && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2 border-t border-slate-800/80">
                    {sector.stocks.map((stock) => {
                      const chg = stock.changePercent ?? 0;
                      const tileStyle = getPerformanceTileStyle(chg);
                      const isSelected = selectedSymbol === stock.symbol;

                      return (
                        <div
                          key={stock.symbol}
                          onClick={() => onSelectStock(stock.symbol)}
                          className={`p-3 rounded-xl border cursor-pointer transition-all duration-200 group flex flex-col justify-between gap-2 ${
                            tileStyle.bgClass
                          } ${tileStyle.borderClass} ${
                            isSelected ? 'ring-2 ring-cyan-400 shadow-md scale-[1.01]' : 'hover:scale-[1.01]'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-1">
                            <div className="min-w-0">
                              <span className="font-bold text-sm font-mono text-white tracking-wide group-hover:underline flex items-center gap-1">
                                {stock.symbol}
                                <ArrowUpRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                              </span>
                              <div className="text-[11px] text-white/70 truncate max-w-[140px]">
                                {stock.name}
                              </div>
                            </div>
                            <span className={`text-xs font-mono font-bold shrink-0 ${tileStyle.textClass}`}>
                              {chg >= 0 ? '+' : ''}
                              {chg.toFixed(2)}%
                            </span>
                          </div>

                          <div className="flex items-center justify-between text-xs font-mono pt-1 border-t border-white/10">
                            <span className="font-bold text-white">
                              {stock.currency}{stock.price.toFixed(2)}
                            </span>
                            <span className="text-[10px] text-white/70">
                              Cap: ₹{(stock.marketCapCr / 100000).toFixed(1)}L Cr
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* 6. VIEW MODE: Performance Ranking Horizontal Bars */}
      {viewMode === 'ranking' && (
        <div className="p-4 sm:p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <h3 className="text-sm font-bold text-white font-mono">
              Sector Momentum & Relative Strength Leaderboard
            </h3>
            <span className="text-xs text-slate-400 font-mono">
              Sorted by {weightMode === 'marketCap' ? 'Cap-Weighted' : 'Equal-Weighted'} Return
            </span>
          </div>

          <div className="space-y-3">
            {[...filteredSectors]
              .sort(
                (a, b) =>
                  (weightMode === 'marketCap' ? b.avgChangePercent : b.equalWeightChangePercent) -
                  (weightMode === 'marketCap' ? a.avgChangePercent : a.equalWeightChangePercent)
              )
              .map((sector, rankIdx) => {
                const sectorPerf =
                  weightMode === 'marketCap'
                    ? sector.avgChangePercent
                    : sector.equalWeightChangePercent;
                const sectorStyle = getPerformanceTileStyle(sectorPerf);
                const maxAbsReturn = 4.0; // scale limit for visual bar
                const barWidth = Math.min(100, (Math.abs(sectorPerf) / maxAbsReturn) * 100);

                return (
                  <div
                    key={sector.canonicalName}
                    className="p-3 rounded-xl bg-slate-950/70 border border-slate-800/80 space-y-2 hover:border-slate-700 transition-colors"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs font-mono">
                      <div className="flex items-center gap-2">
                        <span className="w-5 text-center text-slate-500 font-bold">
                          #{rankIdx + 1}
                        </span>
                        <strong className="text-white text-sm">
                          {sector.canonicalName}
                        </strong>
                        <span className="text-slate-400 text-[11px]">
                          ({sector.stocks.length} stocks · ₹{(sector.totalMarketCapCr / 100000).toFixed(1)}L Cr)
                        </span>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
                          <span className="text-emerald-400">▲ {sector.advances}</span>
                          <span>/</span>
                          <span className="text-rose-400">▼ {sector.declines}</span>
                        </div>
                        <span
                          className={`px-2 py-0.5 rounded text-xs font-bold ${sectorStyle.badgeBg}`}
                        >
                          {sectorPerf >= 0 ? '+' : ''}
                          {sectorPerf.toFixed(2)}%
                        </span>
                      </div>
                    </div>

                    {/* Horizontal Comparative Bar */}
                    <div className="w-full bg-slate-900 rounded-full h-2 flex overflow-hidden">
                      {sectorPerf >= 0 ? (
                        <div
                          className="bg-emerald-500 h-full rounded-full transition-all duration-500 ml-[50%]"
                          style={{ width: `${barWidth / 2}%` }}
                        />
                      ) : (
                        <div
                          className="bg-rose-500 h-full rounded-full transition-all duration-500 mr-[50%] ml-auto"
                          style={{ width: `${barWidth / 2}%` }}
                        />
                      )}
                    </div>

                    {/* Quick constituent stock chips */}
                    <div className="flex flex-wrap items-center gap-1.5 pt-1 text-[11px] font-mono">
                      <span className="text-slate-500">Key Tickers:</span>
                      {sector.stocks.slice(0, 6).map((stock) => (
                        <button
                          key={stock.symbol}
                          onClick={() => onSelectStock(stock.symbol)}
                          className="px-2 py-0.5 rounded bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 transition-colors flex items-center gap-1"
                        >
                          <span>{stock.symbol}</span>
                          <span
                            className={
                              (stock.changePercent ?? 0) >= 0
                                ? 'text-emerald-400'
                                : 'text-rose-400'
                            }
                          >
                            {(stock.changePercent ?? 0) >= 0 ? '+' : ''}
                            {(stock.changePercent ?? 0).toFixed(1)}%
                          </span>
                        </button>
                      ))}
                      {sector.stocks.length > 6 && (
                        <span className="text-slate-500 text-[10px]">
                          +{sector.stocks.length - 6} more
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* Educational Use Disclaimer */}
      <EducationalDisclaimer
        variant="footer"
        actionContext="BUY_SELL_HOLD"
        className="mt-3"
      />

      {/* Floating Hover Card Detail on Desktop */}
      {hoveredStock && (
        <div className="p-3 rounded-xl bg-slate-900/95 border border-cyan-800 text-xs text-slate-300 font-mono shadow-2xl flex flex-wrap items-center justify-between gap-3 animate-in fade-in duration-150">
          <div className="flex items-center gap-3">
            <span className="text-base font-bold text-white font-mono">{hoveredStock.symbol}</span>
            <span className="text-slate-400">{hoveredStock.name}</span>
            <span className="px-1.5 py-0.2 rounded bg-slate-800 text-slate-300 border border-slate-700">
              {hoveredStock.exchange}
            </span>
          </div>
          <div className="flex items-center gap-4">
            <span>
              Price: <strong className="text-white">{hoveredStock.currency}{hoveredStock.price.toFixed(2)}</strong>
            </span>
            <span
              className={`font-bold ${
                (hoveredStock.changePercent ?? 0) >= 0 ? 'text-emerald-400' : 'text-rose-400'
              }`}
            >
              {(hoveredStock.changePercent ?? 0) >= 0 ? '+' : ''}
              {(hoveredStock.changePercent ?? 0).toFixed(2)}%
            </span>
            <button
              onClick={() => onSelectStock(hoveredStock.symbol)}
              className="px-2.5 py-1 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-bold transition-colors flex items-center gap-1"
            >
              <span>Analyze Stock</span>
              <ArrowUpRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
