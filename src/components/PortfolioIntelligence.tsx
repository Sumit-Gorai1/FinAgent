import React, { useState, useMemo } from 'react';
import {
  PieChart as PieChartIcon,
  ShieldAlert,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
  TrendingDown,
  Layers,
  ChevronRight,
  Sliders,
  Scale,
  Search,
  Plus,
  Trash2,
  Download,
  FileSpreadsheet,
  FileCode2,
  X,
  Filter,
  ExternalLink,
  Wallet,
  Zap,
  Scissors,
  Edit3,
  BarChart3,
  Activity,
  ArrowUpDown,
  Compass,
  FileText,
  RotateCcw,
} from 'lucide-react';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { PortfolioHolding } from '../types';
import { AutonomousRebalancer } from './AutonomousRebalancer';
import { PortfolioHeartbeatMonitor } from './PortfolioHeartbeatMonitor';
import { AddStockModal } from './AddStockModal';
import { PortfolioPerformanceChart } from './PortfolioPerformanceChart';
import { PositionActionModal, PositionActionType } from './PositionActionModal';
import { CashAdjustmentModal } from './CashAdjustmentModal';
import {
  exportPortfolioCSV,
  exportPortfolioJSON,
  exportPortfolioPDF,
  exportPortfolioExcel,
} from '../utils/portfolioExport';
import { EducationalDisclaimer } from './EducationalDisclaimer';

interface PortfolioIntelligenceProps {
  holdings: PortfolioHolding[];
  cashBalance?: number;
  stocks?: Record<string, any>;
  onSelectStock: (symbol: string) => void;
  onOpenPaperTrade: () => void;
  onExecuteBatchOrders?: (
    orders: Array<{ symbol: string; type: 'BUY' | 'SELL'; shares: number; price: number; reason: string }>
  ) => void;
  onExecuteOrder?: (order: { symbol: string; type: 'BUY' | 'SELL'; shares: number; price: number; reason: string }) => void;
  onAddHolding?: (holding: PortfolioHolding) => void;
  onRemoveHolding?: (symbol: string) => void;
  onUpdateHolding?: (symbol: string, newShares: number, newAvgBuyPrice?: number) => void;
  onQuickTrade?: (symbol: string, action: 'BUY' | 'TRIM', shares: number, price: number) => void;
  onUpdateCash?: (newBalance: number) => void;
  onResetPortfolio?: () => void;
  lastSavedTime?: string;
  onSavePortfolio?: () => void;
}

type SortOption = 'VALUE_DESC' | 'VALUE_ASC' | 'DAY_PNL_DESC' | 'DAY_PNL_ASC' | 'TOTAL_PNL_DESC' | 'WEIGHT_DESC' | 'SCORE_DESC' | 'MOS_DESC';
type FilterPreset = 'ALL' | 'GAINERS' | 'LOSERS' | 'PROFIT' | 'LOSS' | 'HIGH_CONVICTION' | 'UNDERVALUED' | 'OVERVALUED';

export const PortfolioIntelligence: React.FC<PortfolioIntelligenceProps> = ({
  holdings,
  cashBalance = 1000000,
  stocks,
  onSelectStock,
  onOpenPaperTrade,
  onExecuteBatchOrders,
  onExecuteOrder,
  onAddHolding,
  onRemoveHolding,
  onUpdateHolding,
  onQuickTrade,
  onUpdateCash,
  onResetPortfolio,
  lastSavedTime,
  onSavePortfolio,
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'rebalance' | 'heartbeat'>('overview');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedSectorFilter, setSelectedSectorFilter] = useState<string>('ALL');
  const [filterPreset, setFilterPreset] = useState<FilterPreset>('ALL');
  const [sortBy, setSortBy] = useState<SortOption>('VALUE_DESC');
  const [justSavedNotice, setJustSavedNotice] = useState<string>('');
  
  // Modals state
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [showExportMenu, setShowExportMenu] = useState<boolean>(false);
  const [exportNotice, setExportNotice] = useState<string>('');
  const [showCashModal, setShowCashModal] = useState<boolean>(false);
  
  // Position Quick Action Modal state
  const [actionModalHolding, setActionModalHolding] = useState<PortfolioHolding | null>(null);
  const [actionModalType, setActionModalType] = useState<PositionActionType>('BUY');
  const [showActionModal, setShowActionModal] = useState<boolean>(false);

  // Financial calculations
  const totalValue = holdings.reduce((sum, h) => sum + h.currentPrice * h.shares, 0);
  const totalCost = holdings.reduce((sum, h) => sum + h.avgBuyPrice * h.shares, 0);
  const totalPnl = totalValue - totalCost;
  const totalPnlPercent = totalCost > 0 ? (totalPnl / totalCost) * 100 : 0;
  const totalNetWorth = totalValue + cashBalance;

  // Day's aggregate P&L calculation
  const totalDayPnL = holdings.reduce((sum, h) => {
    if (h.dayPnL !== undefined) return sum + h.dayPnL;
    if (h.dayChange !== undefined) return sum + h.dayChange * h.shares;
    const prevCls = h.previousClose || h.avgBuyPrice;
    return sum + (h.currentPrice - prevCls) * h.shares;
  }, 0);
  const prevDayTotalValue = totalValue - totalDayPnL;
  const totalDayPnLPercent = prevDayTotalValue > 0 ? (totalDayPnL / prevDayTotalValue) * 100 : 0;

  // Sector allocation data for Recharts
  const sectorMap: Record<string, number> = {};
  holdings.forEach((h) => {
    sectorMap[h.sector] = (sectorMap[h.sector] || 0) + h.currentPrice * h.shares;
  });

  const sectorColors = ['#06b6d4', '#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ec4899', '#14b8a6', '#f43f5e'];
  const sectorData = Object.entries(sectorMap).map(([name, value], idx) => ({
    name,
    value: Math.round(value),
    percentage: totalValue > 0 ? ((value / totalValue) * 100).toFixed(1) : '0',
    color: sectorColors[idx % sectorColors.length],
  }));

  const uniqueSectors = Array.from(new Set(holdings.map((h) => h.sector)));

  // Dynamic Gainer/Loser Counts
  const gainersCount = holdings.filter((h) => (h.dayChange || 0) > 0).length;
  const losersCount = holdings.filter((h) => (h.dayChange || 0) < 0).length;
  const profitCount = holdings.filter((h) => h.currentPrice >= h.avgBuyPrice).length;
  const lossCount = holdings.filter((h) => h.currentPrice < h.avgBuyPrice).length;

  // Weighted Average Multi-Agent Research Score
  const weightedScore =
    totalValue > 0
      ? holdings.reduce((sum, h) => {
          const score = h.researchScore ?? h.score ?? 70;
          const weight = (h.currentPrice * h.shares) / totalValue;
          return sum + score * weight;
        }, 0)
      : 70;

  const hhi = Object.values(sectorMap).reduce((sum, val) => {
    const share = totalValue > 0 ? (val / totalValue) * 100 : 0;
    return sum + (share * share);
  }, 0);
  const diversificationScore = Math.max(20, Math.min(100, Math.round(100 - (hhi / 100))));
  const pnlScore = Math.max(10, Math.min(100, Math.round(50 + totalPnlPercent * 2.5)));
  const cashRatio = cashBalance / (totalValue + cashBalance);
  const cashScore = Math.min(100, Math.round(cashRatio * 200) + 50);

  const rawHealth =
    weightedScore * 0.45 +
    diversificationScore * 0.30 +
    pnlScore * 0.15 +
    cashScore * 0.10;
  const currentHealthScore = Math.round(Math.max(15, Math.min(99, rawHealth)));

  let dynamicBpm = 68;
  let dynamicRhythm = 'Steady High-Quality Rhythm';
  if (currentHealthScore >= 85) {
    dynamicBpm = 62;
    dynamicRhythm = 'Resting Zen Sinus Rhythm';
  } else if (currentHealthScore >= 75) {
    dynamicBpm = 68;
    dynamicRhythm = 'Steady High-Quality Rhythm';
  } else if (currentHealthScore >= 65) {
    dynamicBpm = 80;
    dynamicRhythm = 'Active Market Rhythm';
  } else if (currentHealthScore >= 50) {
    dynamicBpm = 98;
    dynamicRhythm = 'Elevated Tachycardia Warning';
  } else {
    dynamicBpm = 124;
    dynamicRhythm = 'Severe Stress Arrhythmia';
  }

  // Filter & Sort holdings dynamically
  const filteredAndSortedHoldings = useMemo(() => {
    const filtered = holdings.filter((h) => {
      const matchesSearch =
        searchQuery === '' ||
        h.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (h.name && h.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
        h.sector.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesSector =
        selectedSectorFilter === 'ALL' || h.sector === selectedSectorFilter;

      const posPnl = (h.currentPrice - h.avgBuyPrice) * h.shares;
      const dayChg = h.dayChange || 0;
      const score = h.researchScore ?? h.score ?? 70;

      let matchesPreset = true;
      if (filterPreset === 'GAINERS') matchesPreset = dayChg > 0;
      if (filterPreset === 'LOSERS') matchesPreset = dayChg < 0;
      if (filterPreset === 'PROFIT') matchesPreset = posPnl >= 0;
      if (filterPreset === 'LOSS') matchesPreset = posPnl < 0;
      if (filterPreset === 'HIGH_CONVICTION') matchesPreset = score >= 75;

      return matchesSearch && matchesSector && matchesPreset;
    });

    return filtered.sort((a, b) => {
      const valA = a.shares * a.currentPrice;
      const valB = b.shares * b.currentPrice;
      const pnlPctA = a.avgBuyPrice > 0 ? ((a.currentPrice - a.avgBuyPrice) / a.avgBuyPrice) * 100 : 0;
      const pnlPctB = b.avgBuyPrice > 0 ? ((b.currentPrice - b.avgBuyPrice) / b.avgBuyPrice) * 100 : 0;
      const dayPctA = a.dayChangePercent || 0;
      const dayPctB = b.dayChangePercent || 0;
      const scoreA = a.researchScore ?? a.score ?? 70;
      const scoreB = b.researchScore ?? b.score ?? 70;

      switch (sortBy) {
        case 'VALUE_DESC':
          return valB - valA;
        case 'VALUE_ASC':
          return valA - valB;
        case 'DAY_PNL_DESC':
          return dayPctB - dayPctA;
        case 'DAY_PNL_ASC':
          return dayPctA - dayPctB;
        case 'TOTAL_PNL_DESC':
          return pnlPctB - pnlPctA;
        case 'WEIGHT_DESC':
          return valB - valA;
        case 'SCORE_DESC':
          return scoreB - scoreA;
        default:
          return valB - valA;
      }
    });
  }, [holdings, searchQuery, selectedSectorFilter, filterPreset, sortBy]);

  const handleExportPDF = () => {
    try {
      exportPortfolioPDF(holdings, cashBalance, {
        healthScore: currentHealthScore,
        bpm: dynamicBpm,
        rhythmStatus: dynamicRhythm,
        totalValue,
        totalCost,
        totalPnl,
        totalPnlPercent,
        diversificationScore,
        weightedBeta: 0.94,
        sectorBreakdown: sectorMap,
      });
      setShowExportMenu(false);
      setExportNotice('Detailed 2-Page Landscape PDF Audit Report generated and downloaded.');
      setTimeout(() => setExportNotice(''), 4500);
    } catch (err) {
      console.error('Failed to export PDF:', err);
      setExportNotice('Error generating PDF report.');
      setTimeout(() => setExportNotice(''), 4000);
    }
  };

  const handleExportExcel = () => {
    try {
      exportPortfolioExcel(holdings, cashBalance, {
        healthScore: currentHealthScore,
        bpm: dynamicBpm,
        rhythmStatus: dynamicRhythm,
        totalValue,
        totalCost,
        totalPnl,
        totalPnlPercent,
        diversificationScore,
        weightedBeta: 0.94,
        sectorBreakdown: sectorMap,
      });
      setShowExportMenu(false);
      setExportNotice('Detailed 5-Tab Institutional Excel Workbook (.xlsx) generated and downloaded.');
      setTimeout(() => setExportNotice(''), 4500);
    } catch (err) {
      console.error('Failed to export Excel:', err);
      setExportNotice('Error generating Excel report.');
      setTimeout(() => setExportNotice(''), 4000);
    }
  };

  const handleExportCSV = () => {
    exportPortfolioCSV(holdings, cashBalance, {
      healthScore: currentHealthScore,
      bpm: dynamicBpm,
      rhythmStatus: dynamicRhythm,
      totalValue,
      totalCost,
      totalPnl,
      totalPnlPercent,
      diversificationScore,
      weightedBeta: 0.94,
      sectorBreakdown: sectorMap,
    });
    setShowExportMenu(false);
    setExportNotice('CSV report generated and downloaded.');
    setTimeout(() => setExportNotice(''), 4000);
  };

  const handleExportJSON = () => {
    exportPortfolioJSON(holdings, cashBalance, {
      healthScore: currentHealthScore,
      bpm: dynamicBpm,
      rhythmStatus: dynamicRhythm,
      totalValue,
      totalCost,
      totalPnl,
      totalPnlPercent,
      diversificationScore,
      weightedBeta: 0.94,
      sectorBreakdown: sectorMap,
    });
    setShowExportMenu(false);
    setExportNotice('JSON dossier generated and downloaded.');
    setTimeout(() => setExportNotice(''), 4000);
  };

  const handleOpenAction = (e: React.MouseEvent, holding: PortfolioHolding, action: PositionActionType) => {
    e.stopPropagation();
    setActionModalHolding(holding);
    setActionModalType(action);
    setShowActionModal(true);
  };

  const handleRemoveClick = (e: React.MouseEvent, symbol: string) => {
    e.stopPropagation();
    if (onRemoveHolding) {
      onRemoveHolding(symbol);
      setJustSavedNotice(`Removed ${symbol} • Changes Saved`);
      setTimeout(() => setJustSavedNotice(''), 3000);
    }
  };

  // Concentration check
  const topHolding = holdings.reduce((prev: PortfolioHolding | null, cur: PortfolioHolding) => {
    if (!prev) return cur;
    return cur.shares * cur.currentPrice > prev.shares * prev.currentPrice ? cur : prev;
  }, null as PortfolioHolding | null);
  const topHoldingWeight = topHolding && totalValue > 0 ? (topHolding.shares * topHolding.currentPrice / totalValue) * 100 : 0;

  return (
    <div className="space-y-6 font-sans">
      {/* Top Header & Dynamic Navigation */}
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 text-xs text-cyan-400 mb-1">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping"></span>
            <span className="font-bold tracking-wider">PORTFOLIO INTELLIGENCE & REAL-TIME WEALTH HUB</span>
          </div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <span>Dynamic Portfolio & Asset Intelligence</span>
            <span className="px-2 py-0.5 text-[10px] rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800 font-semibold">
              Live MTM Active
            </span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Real-time mark-to-market prices, portfolio health metrics, performance curve, quick position controls, and auto-rebalancing.
          </p>
        </div>

        {/* Aggregate Financial Metrics & Action Buttons */}
        <div className="flex flex-wrap items-center gap-4 sm:gap-6">
          {/* Day's P&L */}
          <div className="bg-slate-950/70 p-3 rounded-2xl border border-slate-800">
            <span className="text-[10px] text-slate-400 block font-semibold">DAY'S GAIN / LOSS</span>
            <div
              className={`flex items-center gap-1 text-base font-bold ${
                totalDayPnL >= 0 ? 'text-emerald-400' : 'text-rose-400'
              }`}
            >
              {totalDayPnL >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
              <span>
                {totalDayPnL >= 0 ? '+' : ''}₹{Math.abs(totalDayPnL).toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </span>
              <span className="text-xs font-normal">
                ({totalDayPnL >= 0 ? '+' : ''}{totalDayPnLPercent.toFixed(2)}%)
              </span>
            </div>
          </div>

          {/* Total Unrealized P&L */}
          <div className="bg-slate-950/70 p-3 rounded-2xl border border-slate-800">
            <span className="text-[10px] text-slate-400 block font-semibold">TOTAL RETURNS (ALL-TIME)</span>
            <div
              className={`flex items-center gap-1 text-base font-bold ${
                totalPnl >= 0 ? 'text-emerald-400' : 'text-rose-400'
              }`}
            >
              {totalPnl >= 0 ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
              <span>
                {totalPnl >= 0 ? '+' : ''}₹{Math.abs(totalPnl).toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </span>
              <span className="text-xs font-normal">
                ({totalPnl >= 0 ? '+' : ''}{totalPnlPercent.toFixed(2)}%)
              </span>
            </div>
          </div>

          {/* Action Row */}
          <div className="flex flex-wrap items-center gap-2 relative">
            {/* Generate PDF Report Button */}
            <button
              onClick={handleExportPDF}
              className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 shadow-lg shadow-cyan-950/40 transition-all border border-cyan-500/40"
              title="Generate comprehensive 2-page detailed PDF audit covering holdings, sector allocations, stress tests, and rebalancing"
            >
              <FileText className="w-4 h-4 text-cyan-200" />
              <span>Detailed PDF Report</span>
            </button>

            {/* Portfolio Auto-Saved indicator & Explicit Save Button */}
            <button
              onClick={() => {
                if (onSavePortfolio) {
                  onSavePortfolio();
                }
                setJustSavedNotice('✓ Saved to Storage');
                setTimeout(() => setJustSavedNotice(''), 3000);
              }}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-emerald-900/60 hover:border-emerald-700/80 text-[11px] text-emerald-400 font-semibold transition-all shadow-sm"
              title="Portfolio changes automatically save to your device. Click to save snapshot now."
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>
                {justSavedNotice || (lastSavedTime ? `Saved (${lastSavedTime})` : 'Portfolio Saved')}
              </span>
            </button>

            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 shadow-lg shadow-emerald-950/40 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Add Stock</span>
            </button>

            {/* Export Menu Dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowExportMenu(!showExportMenu)}
                className="flex items-center gap-1.5 px-3.5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-xl border border-slate-700 transition-all"
              >
                <Download className="w-3.5 h-3.5 text-cyan-400" />
                <span>Export / Actions</span>
              </button>

              {showExportMenu && (
                <div className="absolute right-0 mt-2 w-64 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl p-1.5 z-30 space-y-1 text-xs">
                  <button
                    onClick={handleExportPDF}
                    className="w-full text-left px-3 py-2 rounded-lg hover:bg-slate-800 text-slate-300 hover:text-white flex items-center gap-2 transition-colors"
                  >
                    <FileText className="w-4 h-4 text-cyan-400 shrink-0" />
                    <div>
                      <span className="block font-bold">Detailed PDF Audit Report</span>
                      <span className="text-[10px] text-slate-400">2-page dossier: Valuation, Sectors, Stress Tests, Rebalancing</span>
                    </div>
                  </button>

                  <button
                    onClick={handleExportExcel}
                    className="w-full text-left px-3 py-2 rounded-lg hover:bg-slate-800 text-slate-300 hover:text-white flex items-center gap-2 transition-colors"
                  >
                    <FileSpreadsheet className="w-4 h-4 text-emerald-400 shrink-0" />
                    <div>
                      <span className="block font-bold">Detailed Excel (.xlsx) Report</span>
                      <span className="text-[10px] text-slate-400">5 institutional tabs: KPIs, Valuation, Sectors, Stress Tests, Rebalance</span>
                    </div>
                  </button>

                  <button
                    onClick={handleExportCSV}
                    className="w-full text-left px-3 py-2 rounded-lg hover:bg-slate-800 text-slate-300 hover:text-white flex items-center gap-2 transition-colors"
                  >
                    <FileSpreadsheet className="w-4 h-4 text-teal-400 shrink-0" />
                    <div>
                      <span className="block font-bold">Export CSV Format</span>
                      <span className="text-[10px] text-slate-400">Raw tabular holdings & weights</span>
                    </div>
                  </button>

                  <button
                    onClick={handleExportJSON}
                    className="w-full text-left px-3 py-2 rounded-lg hover:bg-slate-800 text-slate-300 hover:text-white flex items-center gap-2 transition-colors"
                  >
                    <FileCode2 className="w-4 h-4 text-purple-400 shrink-0" />
                    <div>
                      <span className="block font-bold">Export Full JSON Dossier</span>
                      <span className="text-[10px] text-slate-400">All vitals & factor metrics</span>
                    </div>
                  </button>

                  {onResetPortfolio && (
                    <button
                      onClick={() => {
                        if (window.confirm('Reset portfolio to the default institutional benchmark template?')) {
                          onResetPortfolio();
                          setShowExportMenu(false);
                          setExportNotice('Portfolio has been reset to default template and saved.');
                        }
                      }}
                      className="w-full text-left px-3 py-2 rounded-lg hover:bg-rose-950/40 text-rose-400 hover:text-rose-300 flex items-center gap-2 transition-colors border-t border-slate-800 mt-1"
                    >
                      <RotateCcw className="w-4 h-4 text-rose-400 shrink-0" />
                      <div>
                        <span className="block font-bold">Reset to Default Portfolio</span>
                        <span className="text-[10px] text-rose-400/80">Restore demo benchmark holdings</span>
                      </div>
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Export Toast Notice */}
      {exportNotice && (
        <div className="p-3 bg-emerald-950/80 border border-emerald-800 rounded-xl text-emerald-300 text-xs flex items-center justify-between animate-fadeIn">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            <span>{exportNotice}</span>
          </div>
          <button onClick={() => setExportNotice('')} className="text-emerald-400 hover:text-white">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Main Tab Switcher */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-2 overflow-x-auto scrollbar-none">
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-3 sm:px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap shrink-0 ${
              activeTab === 'overview'
                ? 'bg-cyan-600 text-white shadow-md shadow-cyan-950/50'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span>Overview & Holdings</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-900 border border-slate-700">
              {holdings.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('rebalance')}
            className={`px-3 sm:px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap shrink-0 ${
              activeTab === 'rebalance'
                ? 'bg-cyan-600 text-white shadow-md shadow-cyan-950/50'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Scale className="w-3.5 h-3.5" />
            <span>Autonomous Rebalancer</span>
          </button>

          <button
            onClick={() => setActiveTab('heartbeat')}
            className={`px-3 sm:px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap shrink-0 ${
              activeTab === 'heartbeat'
                ? 'bg-cyan-600 text-white shadow-md shadow-cyan-950/50'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            <span>Portfolio Health</span>
            <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-emerald-950 text-emerald-300 border border-emerald-800">
              {currentHealthScore}/100
            </span>
          </button>
        </div>

        {/* Cash Balance Display & Quick Adjustment Trigger */}
        <div className="flex items-center gap-2.5 sm:gap-3 bg-slate-900 px-3 py-1.5 rounded-2xl border border-slate-800 text-xs">
          <div className="flex items-center gap-1.5 text-slate-400">
            <Wallet className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
            <span className="hidden sm:inline">Available Cash:</span>
            <span className="sm:hidden">Cash:</span>
            <span className="text-white font-bold">₹{cashBalance.toLocaleString()}</span>
          </div>
          <button
            onClick={() => setShowCashModal(true)}
            className="px-2 py-0.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-400 hover:text-cyan-300 font-bold text-[11px] border border-slate-700 transition-colors whitespace-nowrap"
          >
            +/- Adjust Cash
          </button>
        </div>
      </div>

      {/* Tab 1: Overview & Dynamic Holdings */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Dynamic Portfolio Growth Performance Curve */}
          <PortfolioPerformanceChart
            holdings={holdings}
            cashBalance={cashBalance}
            totalPortfolioValue={totalValue}
            totalInvestedCost={totalCost}
            totalDayPnL={totalDayPnL}
            totalDayPnLPercent={totalDayPnLPercent}
          />

          {/* Quick Dynamic Vitals Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-md">
              <span className="text-[10px] text-slate-400 font-semibold">TOTAL ASSET VALUE</span>
              <div className="text-xl font-bold text-white mt-1">
                ₹{totalValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </div>
              <div className="text-[11px] text-slate-400 mt-1 font-sans">
                Across {holdings.length} stocks • {uniqueSectors.length} sectors
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-md">
              <span className="text-[10px] text-slate-400 font-semibold flex items-center justify-between">
                <span>TOTAL INVESTED CAPITAL</span>
                <TrendingUp className="w-3.5 h-3.5 text-cyan-400" />
              </span>
              <div className="text-xl font-bold text-white mt-1">
                ₹{totalCost.toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </div>
              <div className="text-[11px] mt-1 flex items-center justify-between font-sans">
                <span className={`font-bold ${totalPnl >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {totalPnl >= 0 ? '+' : ''}₹{Math.abs(totalPnl).toLocaleString(undefined, { maximumFractionDigits: 0 })} ({totalPnlPercent.toFixed(1)}%)
                </span>
                <span className="text-slate-400">
                  Unrealized P&L
                </span>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-md">
              <span className="text-[10px] text-slate-400 font-semibold">NET WORTH (ASSETS + CASH)</span>
              <div className="text-xl font-bold text-white mt-1">
                ₹{totalNetWorth.toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </div>
              <div className="text-[11px] text-cyan-400 mt-1 flex items-center justify-between font-sans">
                <span>Cash: {((cashBalance / totalNetWorth) * 100).toFixed(1)}%</span>
                <span>Equity: {((totalValue / totalNetWorth) * 100).toFixed(1)}%</span>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-md">
              <span className="text-[10px] text-slate-400 font-semibold">AI RESEARCH CONVICTION</span>
              <div className="text-xl font-bold text-emerald-400 mt-1 flex items-center gap-1.5">
                <span>{weightedScore.toFixed(0)}/100</span>
                <span className="text-xs px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800 font-semibold">
                  HIGH
                </span>
              </div>
              <div className="text-[11px] text-slate-400 mt-1 font-sans">
                Weighted 12-agent research score
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-md">
              <span className="text-[10px] text-slate-400 font-semibold">PORTFOLIO HEALTH</span>
              <div className="text-xl font-bold text-emerald-400 mt-1 flex items-center gap-1.5">
                <span>{currentHealthScore}/100</span>
                <span
                  className={`text-xs px-2 py-0.5 rounded font-semibold ${
                    currentHealthScore >= 80
                      ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-800'
                      : currentHealthScore >= 65
                      ? 'bg-cyan-950/80 text-cyan-300 border border-cyan-800'
                      : 'bg-amber-950/80 text-amber-300 border border-amber-800'
                  }`}
                >
                  {currentHealthScore >= 80 ? 'EXCELLENT' : currentHealthScore >= 65 ? 'HEALTHY' : 'MODERATE'}
                </span>
              </div>
              <div className="text-[11px] text-slate-400 mt-1 truncate">
                Diversification: {diversificationScore}/100 • Beta: 0.94
              </div>
            </div>
          </div>

          {/* Holdings Section with Dynamic Controls */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Holdings Table - Left 2 Columns */}
            <div className="lg:col-span-2 space-y-4">
              <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
                {/* Search, Filter, Sort Controls */}
                <div className="space-y-3">
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                    {/* Search Input */}
                    <div className="relative flex-1">
                      <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        placeholder="Search holding by symbol, company, or sector..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-8 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                      />
                      {searchQuery && (
                        <button
                          onClick={() => setSearchQuery('')}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>

                    {/* Sort Selector */}
                    <div className="flex items-center gap-1.5">
                      <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
                      <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value as SortOption)}
                        className="bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-2 text-xs text-slate-300 font-semibold focus:outline-none focus:border-cyan-500"
                      >
                        <option value="VALUE_DESC">Sort: Value (High to Low)</option>
                        <option value="VALUE_ASC">Sort: Value (Low to High)</option>
                        <option value="MOS_DESC">Sort: Margin of Safety (High to Low)</option>
                        <option value="DAY_PNL_DESC">Sort: Today's Gainers</option>
                        <option value="DAY_PNL_ASC">Sort: Today's Losers</option>
                        <option value="TOTAL_PNL_DESC">Sort: Total Return %</option>
                        <option value="SCORE_DESC">Sort: AI Score</option>
                      </select>
                    </div>
                  </div>

                  {/* Filter Chips Bar */}
                  <div className="flex flex-wrap items-center gap-1.5 text-xs">
                    <button
                      onClick={() => setFilterPreset('ALL')}
                      className={`px-2.5 py-1 rounded-lg transition-all font-semibold ${
                        filterPreset === 'ALL'
                          ? 'bg-cyan-600 text-white shadow-sm'
                          : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                      }`}
                    >
                      All ({holdings.length})
                    </button>

                    <button
                      onClick={() => setFilterPreset('GAINERS')}
                      className={`px-2.5 py-1 rounded-lg transition-all font-semibold flex items-center gap-1 ${
                        filterPreset === 'GAINERS'
                          ? 'bg-emerald-600 text-white shadow-sm'
                          : 'bg-slate-950 text-slate-400 hover:text-emerald-400 border border-slate-800'
                      }`}
                    >
                      <TrendingUp className="w-3 h-3" />
                      <span>Today's Gainers ({gainersCount})</span>
                    </button>

                    <button
                      onClick={() => setFilterPreset('LOSERS')}
                      className={`px-2.5 py-1 rounded-lg transition-all font-semibold flex items-center gap-1 ${
                        filterPreset === 'LOSERS'
                          ? 'bg-rose-600 text-white shadow-sm'
                          : 'bg-slate-950 text-slate-400 hover:text-rose-400 border border-slate-800'
                      }`}
                    >
                      <TrendingDown className="w-3 h-3" />
                      <span>Today's Losers ({losersCount})</span>
                    </button>

                    <button
                      onClick={() => setFilterPreset('PROFIT')}
                      className={`px-2.5 py-1 rounded-lg transition-all font-semibold ${
                        filterPreset === 'PROFIT'
                          ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                          : 'bg-slate-950 text-slate-400 hover:text-emerald-400 border border-slate-800'
                      }`}
                    >
                      Overall Profit ({profitCount})
                    </button>

                    <button
                      onClick={() => setFilterPreset('LOSS')}
                      className={`px-2.5 py-1 rounded-lg transition-all font-semibold ${
                        filterPreset === 'LOSS'
                          ? 'bg-rose-950 text-rose-300 border border-rose-800'
                          : 'bg-slate-950 text-slate-400 hover:text-rose-400 border border-slate-800'
                      }`}
                    >
                      Overall Loss ({lossCount})
                    </button>

                    <button
                      onClick={() => setFilterPreset('HIGH_CONVICTION')}
                      className={`px-2.5 py-1 rounded-lg transition-all font-semibold flex items-center gap-1 ${
                        filterPreset === 'HIGH_CONVICTION'
                          ? 'bg-amber-950 text-amber-300 border border-amber-800'
                          : 'bg-slate-950 text-slate-400 hover:text-amber-400 border border-slate-800'
                      }`}
                    >
                      <Sparkles className="w-3 h-3" />
                      <span>Score ≥ 75</span>
                    </button>

                    {selectedSectorFilter !== 'ALL' && (
                      <button
                        onClick={() => setSelectedSectorFilter('ALL')}
                        className="px-2.5 py-1 rounded-lg bg-cyan-950 text-cyan-300 border border-cyan-800 flex items-center gap-1 font-semibold ml-auto"
                      >
                        <span>Sector: {selectedSectorFilter}</span>
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs font-sans">
                    <thead>
                      <tr className="border-b border-slate-800 text-slate-400">
                        <th className="py-2.5 px-3">Asset</th>
                        <th className="py-2.5 px-3">Shares</th>
                        <th className="py-2.5 px-3">Avg Buy</th>
                        <th className="py-2.5 px-3">CMP (Live)</th>
                        <th className="py-2.5 px-3">Day's P&L</th>
                        <th className="py-2.5 px-3">Total P&L</th>
                        <th className="py-2.5 px-3 text-center">Score</th>
                        <th className="py-2.5 px-3 text-right">Weight</th>
                        <th className="py-2.5 px-3 text-center">Quick Trade</th>
                        <th className="py-2.5 px-3 text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 text-slate-300">
                      {filteredAndSortedHoldings.length > 0 ? (
                        filteredAndSortedHoldings.map((h) => {
                          const posValue = h.shares * h.currentPrice;
                          const posPnl = (h.currentPrice - h.avgBuyPrice) * h.shares;
                          const posPnlPct =
                            h.avgBuyPrice > 0 ? ((h.currentPrice - h.avgBuyPrice) / h.avgBuyPrice) * 100 : 0;
                          const weightPct = totalValue > 0 ? (posValue / totalValue) * 100 : 0;
                          const score = h.researchScore ?? h.score ?? 70;

                          const dayChange = h.dayChange !== undefined ? h.dayChange : (h.previousClose ? h.currentPrice - h.previousClose : 0);
                          const dayChangePct = h.dayChangePercent !== undefined ? h.dayChangePercent : (h.previousClose ? (dayChange / h.previousClose) * 100 : 0);
                          const dayPnL = h.dayPnL !== undefined ? h.dayPnL : dayChange * h.shares;

                          const flashClass =
                            h.priceFlash === 'up'
                              ? 'bg-emerald-500/20 text-emerald-300 ring-1 ring-emerald-500/40 rounded px-1 transition-all duration-700'
                              : h.priceFlash === 'down'
                              ? 'bg-rose-500/20 text-rose-300 ring-1 ring-rose-500/40 rounded px-1 transition-all duration-700'
                              : '';

                          return (
                            <tr
                              key={h.symbol}
                              onClick={() => onSelectStock(h.symbol)}
                              className="hover:bg-slate-800/50 cursor-pointer transition-colors group"
                            >
                              <td className="py-3 px-3">
                                <div className="flex items-center gap-1.5 font-bold text-white group-hover:text-cyan-400 transition-colors">
                                  <span>{h.symbol}</span>
                                  <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity text-cyan-400" />
                                </div>
                                <div className="text-[10px] text-slate-400 truncate max-w-[130px]">
                                  {h.name || h.sector}
                                </div>
                              </td>
                              <td className="py-3 px-3">{h.shares}</td>
                              <td className="py-3 px-3">₹{h.avgBuyPrice.toLocaleString()}</td>
                              
                              {/* Live Price with Flash */}
                              <td className="py-3 px-3">
                                <span className={`font-semibold inline-block ${flashClass || 'text-white'}`}>
                                  ₹{h.currentPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </span>
                              </td>

                              {/* Day's P&L */}
                              <td
                                className={`py-3 px-3 font-semibold ${
                                  dayPnL >= 0 ? 'text-emerald-400' : 'text-rose-400'
                                }`}
                              >
                                <div>
                                  {dayPnL >= 0 ? '+' : ''}₹{Math.abs(dayPnL).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                                </div>
                                <div className="text-[10px] font-normal">
                                  {dayChangePct >= 0 ? '+' : ''}{dayChangePct.toFixed(2)}%
                                </div>
                              </td>

                              {/* Total P&L */}
                              <td
                                className={`py-3 px-3 font-semibold ${
                                  posPnl >= 0 ? 'text-emerald-400' : 'text-rose-400'
                                }`}
                              >
                                <div>
                                  {posPnl >= 0 ? '+' : ''}₹{Math.abs(posPnl).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                                </div>
                                <div className="text-[10px] font-normal">
                                  {posPnlPct >= 0 ? '+' : ''}{posPnlPct.toFixed(2)}%
                                </div>
                              </td>

                              {/* Score */}
                              <td className="py-3 px-3 text-center">
                                <span
                                  className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                                    score >= 75
                                      ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                                      : 'bg-amber-950 text-amber-300 border border-amber-800'
                                  }`}
                                >
                                  {score}
                                </span>
                              </td>

                              {/* Weight */}
                              <td className="py-3 px-3 text-right font-bold text-cyan-400">
                                {weightPct.toFixed(1)}%
                              </td>

                              {/* Quick Trade Buttons (+ / -) */}
                              <td className="py-3 px-3 text-center" onClick={(e) => e.stopPropagation()}>
                                <div className="flex items-center justify-center gap-1">
                                  <button
                                    onClick={(e) => handleOpenAction(e, h, 'BUY')}
                                    className="p-1 rounded bg-emerald-950/80 hover:bg-emerald-900 text-emerald-400 border border-emerald-800/80 transition-colors"
                                    title={`Quick Buy more ${h.symbol}`}
                                  >
                                    <Plus className="w-3 h-3" />
                                  </button>
                                  <button
                                    onClick={(e) => handleOpenAction(e, h, 'TRIM')}
                                    className="p-1 rounded bg-rose-950/80 hover:bg-rose-900 text-rose-400 border border-rose-800/80 transition-colors"
                                    title={`Quick Trim / Sell ${h.symbol}`}
                                  >
                                    <Scissors className="w-3 h-3" />
                                  </button>
                                </div>
                              </td>

                              {/* Edit & Delete Actions */}
                              <td className="py-3 px-3 text-center" onClick={(e) => e.stopPropagation()}>
                                <div className="flex items-center justify-center gap-1">
                                  <button
                                    onClick={(e) => handleOpenAction(e, h, 'EDIT')}
                                    className="p-1 rounded text-slate-400 hover:text-cyan-400 hover:bg-slate-800 transition-colors"
                                    title={`Edit ${h.symbol} position`}
                                  >
                                    <Edit3 className="w-3 h-3" />
                                  </button>
                                  <button
                                    onClick={(e) => handleRemoveClick(e, h.symbol)}
                                    className="p-1 rounded text-slate-500 hover:text-rose-400 hover:bg-rose-950/40 transition-colors"
                                    title={`Remove ${h.symbol} from portfolio`}
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })
                      ) : (
                        <tr>
                          <td colSpan={10} className="py-8 text-center text-slate-400 space-y-2">
                            <div>No holdings match your search or active filter.</div>
                            <button
                              onClick={() => {
                                setSearchQuery('');
                                setSelectedSectorFilter('ALL');
                                setFilterPreset('ALL');
                              }}
                              className="text-xs text-cyan-400 hover:underline font-bold"
                            >
                              Reset All Filters
                            </button>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                <EducationalDisclaimer
                  variant="footer"
                  actionContext="BUY_SELL_HOLD"
                  className="mt-3 pt-2"
                />
              </div>
            </div>

            {/* Right Column: Sector Breakdown & Risk Concentration */}
            <div className="space-y-6">
              {/* Sector Donut Chart */}
              <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <PieChartIcon className="w-4 h-4 text-cyan-400" />
                    <h3 className="text-xs font-bold text-white tracking-wide">
                      SECTOR ALLOCATION
                    </h3>
                  </div>
                  <span className="text-[10px] text-slate-400">Click slice to filter</span>
                </div>

                <div className="h-56 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={sectorData}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={75}
                        paddingAngle={3}
                        dataKey="value"
                        onClick={(entry) => {
                          setSelectedSectorFilter(
                            selectedSectorFilter === entry.name ? 'ALL' : entry.name
                          );
                        }}
                        className="cursor-pointer"
                      >
                        {sectorData.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={entry.color}
                            stroke={selectedSectorFilter === entry.name ? '#ffffff' : '#0f172a'}
                            strokeWidth={selectedSectorFilter === entry.name ? 2 : 1}
                          />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(val: any) => [`₹${Number(val).toLocaleString()}`, 'Value']}
                        contentStyle={{
                          backgroundColor: '#090d16',
                          borderColor: '#1e293b',
                          borderRadius: '8px',
                          fontSize: '11px',
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                {/* Sector Legend */}
                <div className="space-y-1.5 pt-2 border-t border-slate-800 text-xs">
                  {sectorData.map((s) => (
                    <div
                      key={s.name}
                      onClick={() =>
                        setSelectedSectorFilter(
                          selectedSectorFilter === s.name ? 'ALL' : s.name
                        )
                      }
                      className={`flex items-center justify-between p-1.5 rounded-lg cursor-pointer transition-colors ${
                        selectedSectorFilter === s.name
                          ? 'bg-slate-800 text-white font-bold'
                          : 'hover:bg-slate-800/40 text-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span
                          className="w-2.5 h-2.5 rounded-full"
                          style={{ backgroundColor: s.color }}
                        ></span>
                        <span className="truncate max-w-[130px]">{s.name}</span>
                      </div>
                      <span className="font-semibold text-cyan-400">{s.percentage}%</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Concentration & Factor Risk Card */}
              <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ShieldAlert className="w-4 h-4 text-amber-400" />
                    <h3 className="text-xs font-bold text-white tracking-wide">
                      PORTFOLIO RISK & CONCENTRATION
                    </h3>
                  </div>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                    <span className="text-slate-400">Top Asset Weight:</span>
                    <span
                      className={`font-bold ${
                        topHoldingWeight > 25 ? 'text-amber-400' : 'text-emerald-400'
                      }`}
                    >
                      {topHolding?.symbol} ({topHoldingWeight.toFixed(1)}%)
                    </span>
                  </div>

                  <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                    <span className="text-slate-400">Diversification HHI:</span>
                    <span className="text-emerald-400 font-bold">
                      {Math.round(hhi)} ({diversificationScore}/100)
                    </span>
                  </div>

                  <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                    <span className="text-slate-400">Portfolio Beta:</span>
                    <span className="text-cyan-400 font-bold">
                      0.94 (Optimal Stability)
                    </span>
                  </div>

                  {topHoldingWeight > 25 && (
                    <div className="p-2.5 rounded-xl bg-amber-950/40 border border-amber-800 text-amber-300 text-[11px] flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 shrink-0" />
                      <span>
                        {topHolding?.symbol} exceeds the 25% single-stock concentration threshold. Consider trimming.
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Autonomous Rebalancer (Agent 14) */}
      {activeTab === 'rebalance' && (
        <AutonomousRebalancer
          holdings={holdings}
          cashBalance={cashBalance}
          onSelectStock={onSelectStock}
          onOpenPaperTrade={onOpenPaperTrade}
          onExecuteBatchOrders={onExecuteBatchOrders}
          onExecuteOrder={onExecuteOrder}
        />
      )}

      {/* Tab 3: Portfolio Health & Vitals */}
      {activeTab === 'heartbeat' && (
        <PortfolioHeartbeatMonitor
          holdings={holdings}
          cashBalance={cashBalance}
        />
      )}

      {/* Add Stock Modal */}
      {showAddModal && (
        <AddStockModal
          isOpen={showAddModal}
          onClose={() => setShowAddModal(false)}
          existingHoldings={holdings || []}
          cashBalance={cashBalance}
          stocks={stocks}
          onAddHolding={(newH) => {
            if (onAddHolding) onAddHolding(newH);
            setShowAddModal(false);
          }}
        />
      )}

      {/* Position Quick Action Modal (Buy / Trim / Edit) */}
      {showActionModal && actionModalHolding && (
        <PositionActionModal
          isOpen={showActionModal}
          onClose={() => {
            setShowActionModal(false);
            setActionModalHolding(null);
          }}
          holding={actionModalHolding}
          initialAction={actionModalType}
          cashBalance={cashBalance}
          onExecuteTrade={(symbol, action, shares, price) => {
            if (onQuickTrade) {
              onQuickTrade(symbol, action, shares, price);
            }
          }}
          onUpdatePosition={(symbol, newShares, newAvgBuyPrice) => {
            if (onUpdateHolding) {
              onUpdateHolding(symbol, newShares, newAvgBuyPrice);
            }
          }}
        />
      )}

      {/* Virtual Cash Adjustment Modal */}
      {showCashModal && (
        <CashAdjustmentModal
          isOpen={showCashModal}
          onClose={() => setShowCashModal(false)}
          currentCash={cashBalance}
          onUpdateCash={(newBal) => {
            if (onUpdateCash) onUpdateCash(newBal);
          }}
        />
      )}
    </div>
  );
};
