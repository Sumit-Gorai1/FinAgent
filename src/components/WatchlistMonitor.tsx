import React, { useState, useMemo } from 'react';
import {
  Bell,
  ShieldAlert,
  AlertTriangle,
  Play,
  CheckCircle2,
  RefreshCw,
  Clock,
  Send,
  Radio,
  Sliders,
  ExternalLink,
  TrendingUp,
  TrendingDown,
  Search,
  X,
  Plus,
  Trash2,
  Coins,
  Layers,
  Sparkles,
  RotateCcw,
} from 'lucide-react';
import { WatchlistItem, TriggerEvent } from '../types';
import { EducationalDisclaimer } from './EducationalDisclaimer';
import { AddWatchlistStockModal } from './AddWatchlistStockModal';
import {
  searchStockCatalog,
  getStockDetails,
  POPULAR_PRICE_MAP,
} from '../utils/stockSearchResolver';

interface WatchlistMonitorProps {
  watchlist: WatchlistItem[];
  onSelectStock: (symbol: string) => void;
  onSimulateTrigger: (trigger: TriggerEvent) => void;
  monitoringActive: boolean;
  setMonitoringActive: (val: boolean) => void;
  recentAlerts: {
    id: string;
    symbol: string;
    type: string;
    message: string;
    timestamp: string;
    severity: 'info' | 'warning' | 'critical';
  }[];
  onAddStock?: (item: WatchlistItem) => void;
  onRemoveStock?: (symbol: string) => void;
  onResetWatchlist?: () => void;
}

export const WatchlistMonitor: React.FC<WatchlistMonitorProps> = ({
  watchlist,
  onSelectStock,
  onSimulateTrigger,
  monitoringActive,
  setMonitoringActive,
  recentAlerts,
  onAddStock,
  onRemoveStock,
  onResetWatchlist,
}) => {
  const [pollingInterval, setPollingInterval] = useState<'30s' | '1m' | '5m'>('1m');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeAssetFilter, setActiveAssetFilter] = useState<'ALL' | 'STOCKS' | 'ETFS' | 'SHIFTS'>('ALL');
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'info' | 'removed'; symbol?: string } | null>(null);

  // Quick inline add ticker state
  const [quickAddInput, setQuickAddInput] = useState<string>('');
  const [quickAddError, setQuickAddError] = useState<string>('');

  // Set of current watchlist symbols for modal check
  const watchlistSymbols = useMemo(() => {
    return new Set(watchlist.map((w) => w.symbol.toUpperCase()));
  }, [watchlist]);

  // Counts
  const counts = useMemo(() => {
    let etfs = 0;
    let stocks = 0;
    let shifts = 0;
    watchlist.forEach((item) => {
      const isEtf =
        item.isEtf ||
        (item.sector &&
          (item.sector.toLowerCase().includes('etf') ||
            item.sector.toLowerCase().includes('exchange traded fund'))) ||
        item.symbol.toLowerCase().includes('bees') ||
        item.symbol.toLowerCase().includes('etf');
      if (isEtf) etfs++;
      else stocks++;
      if (item.thesisChanged) shifts++;
    });
    return { all: watchlist.length, etfs, stocks, shifts };
  }, [watchlist]);

  // Filtered Watchlist
  const filteredWatchlist = useMemo(() => {
    return watchlist.filter((item) => {
      const isEtf =
        item.isEtf ||
        (item.sector &&
          (item.sector.toLowerCase().includes('etf') ||
            item.sector.toLowerCase().includes('exchange traded fund'))) ||
        item.symbol.toLowerCase().includes('bees') ||
        item.symbol.toLowerCase().includes('etf');

      // Category tab filter
      if (activeAssetFilter === 'ETFS' && !isEtf) return false;
      if (activeAssetFilter === 'STOCKS' && isEtf) return false;
      if (activeAssetFilter === 'SHIFTS' && !item.thesisChanged) return false;

      // Search text filter
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase().trim();
      return (
        item.symbol.toLowerCase().includes(q) ||
        item.name.toLowerCase().includes(q) ||
        (item.sector && item.sector.toLowerCase().includes(q)) ||
        (item.thesisStatus && item.thesisStatus.toLowerCase().includes(q))
      );
    });
  }, [watchlist, searchQuery, activeAssetFilter]);

  const showToast = (text: string, type: 'success' | 'info' | 'removed', symbol?: string) => {
    setToastMessage({ text, type, symbol });
    setTimeout(() => {
      setToastMessage((prev) => (prev?.text === text ? null : prev));
    }, 4000);
  };

  const handleRemove = (symbol: string) => {
    if (onRemoveStock) {
      onRemoveStock(symbol);
      showToast(`Removed ${symbol} from watchlist`, 'removed', symbol);
    }
  };

  const handleAddFromModal = (item: WatchlistItem) => {
    if (onAddStock) {
      onAddStock(item);
      showToast(`Added ${item.symbol} (${item.name}) to watchlist`, 'success', item.symbol);
    }
  };

  // Quick inline add handler
  const handleQuickAdd = (e: React.FormEvent) => {
    e.preventDefault();
    const query = quickAddInput.trim().toUpperCase();
    if (!query) return;

    if (watchlistSymbols.has(query)) {
      setQuickAddError(`${query} is already in your watchlist.`);
      setTimeout(() => setQuickAddError(''), 3000);
      return;
    }

    // Try resolving stock details
    const details = getStockDetails(query);
    const searchMatch = !details ? searchStockCatalog(query, 1)[0] : null;

    const matched = details || searchMatch;
    const resolvedSymbol = matched ? matched.symbol : query;
    const resolvedName = matched ? matched.name : `${query} Investment`;
    const resolvedPrice = matched?.price || POPULAR_PRICE_MAP[query] || 100.0;
    const isEtf =
      (matched?.sector &&
        (matched.sector.toLowerCase().includes('etf') ||
          matched.sector.toLowerCase().includes('exchange traded fund'))) ||
      query.includes('BEES') ||
      query.includes('ETF');

    const newItem: WatchlistItem = {
      symbol: resolvedSymbol,
      name: resolvedName,
      price: resolvedPrice,
      changePercent: +(Math.random() * 2 - 0.5).toFixed(2),
      score: Math.floor(Math.random() * 20) + 72,
      committeeScore: Math.floor(Math.random() * 20) + 72,
      currency: matched?.currency || '₹',
      statusTag: 'POSITIVE',
      thesisStatus: isEtf ? 'BUY (INDEX ACCUMULATE)' : 'BUY / MONITOR',
      thesisChanged: false,
      lastAnalyzed: 'Just now',
      sector: matched?.sector || (isEtf ? 'Exchange Traded Fund (ETF)' : 'Equity'),
      isEtf: Boolean(isEtf),
      intrinsicValue: +(resolvedPrice * (1 + (Math.random() * 0.15 + 0.05))).toFixed(2),
      marginOfSafetyPercent: +(Math.random() * 12 + 6).toFixed(1),
    };

    if (onAddStock) {
      onAddStock(newItem);
      showToast(`Added ${newItem.symbol} to watchlist`, 'success', newItem.symbol);
    }
    setQuickAddInput('');
    setQuickAddError('');
  };

  const triggers: { title: string; desc: string; trigger: TriggerEvent; color: string }[] = [
    {
      title: 'Simulate -5.2% Technical Breakdown (TCS)',
      desc: 'Price breaks below 50-day SMA on heavy volume. Triggers Technical & Risk Agent review.',
      trigger: {
        symbol: 'TCS',
        type: 'PRICE_DROP_5PCT',
        description: 'TCS breached 50-day SMA at ₹4,180 with volume 1.8x average.',
        timestamp: new Date().toLocaleTimeString(),
      },
      color: 'hover:border-rose-500 bg-rose-950/20 text-rose-300',
    },
    {
      title: 'Simulate Q3 Margin Compression (-80 bps)',
      desc: 'Quarterly financial filing reveals unexpected margin contraction. Triggers Fundamental Agent re-audit.',
      trigger: {
        symbol: 'TCS',
        type: 'EARNINGS_MARGIN_MISS',
        description: 'Operating margin compressed 80 bps to 23.9% due to project renegotiations.',
        timestamp: new Date().toLocaleTimeString(),
      },
      color: 'hover:border-amber-500 bg-amber-950/20 text-amber-300',
    },
    {
      title: 'Simulate Green Energy Capex Subsidy (RELIANCE)',
      desc: 'Government announces ₹18,000 Cr incentive for clean hydrogen. Triggers Sector & Bull Agent.',
      trigger: {
        symbol: 'RELIANCE',
        type: 'POSITIVE_POLICY_CATALYST',
        description: 'PLI expansion for electrolyzers accelerates New Energy monetization by 12 months.',
        timestamp: new Date().toLocaleTimeString(),
      },
      color: 'hover:border-emerald-500 bg-emerald-950/20 text-emerald-300',
    },
    {
      title: 'Simulate Regulatory Scrutiny Notice (HDFCBANK)',
      desc: 'RBI regulatory audit flags compliance enhancement timeline for unsecured credit.',
      trigger: {
        symbol: 'HDFCBANK',
        type: 'REGULATORY_SCRUTINY',
        description: 'Central bank advisory mandates additional risk-weighted asset provisions.',
        timestamp: new Date().toLocaleTimeString(),
      },
      color: 'hover:border-indigo-500 bg-indigo-950/20 text-indigo-300',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 p-3.5 rounded-xl bg-slate-900 border border-slate-700 shadow-2xl text-xs font-mono text-white animate-slideUp">
          <span
            className={`w-2.5 h-2.5 rounded-full ${
              toastMessage.type === 'success'
                ? 'bg-emerald-400'
                : toastMessage.type === 'removed'
                ? 'bg-rose-400'
                : 'bg-cyan-400'
            }`}
          />
          <span>{toastMessage.text}</span>
          <button
            onClick={() => setToastMessage(null)}
            className="text-slate-400 hover:text-white ml-2"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Top Monitor Dashboard Header */}
      <div className="p-4 sm:p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-cyan-400 mb-1">
            <Radio className="w-4 h-4 animate-pulse" />
            <span>CONTINUOUS MULTI-AGENT SURVEILLANCE BUS</span>
          </div>
          <h2 className="text-xl font-bold text-white tracking-tight">
            Autonomous Watchlist & Thesis Shift Detection
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Monitor equities and Exchange Traded Funds (ETFs) in real-time. Add or remove any asset at will.
          </p>
        </div>

        {/* Monitoring Controls & Add Stock Button */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Add Stock or ETF Button */}
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="px-4 py-2 rounded-xl text-xs font-mono font-bold bg-cyan-600 hover:bg-cyan-500 text-white shadow-lg shadow-cyan-950/40 flex items-center gap-1.5 transition-all"
            title="Add any stock or ETF to surveillance"
          >
            <Plus className="w-4 h-4" />
            <span>Add Stock or ETF</span>
          </button>

          <div className="flex items-center gap-1.5 p-1 rounded-lg bg-slate-950 border border-slate-800 text-xs font-mono">
            <span className="px-2 text-slate-400 text-[11px]">Heartbeat:</span>
            {(['30s', '1m', '5m'] as const).map((interval) => (
              <button
                key={interval}
                onClick={() => setPollingInterval(interval)}
                className={`px-2 py-1 rounded transition-colors ${
                  pollingInterval === interval
                    ? 'bg-cyan-600 text-white font-bold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {interval}
              </button>
            ))}
          </div>

          <button
            onClick={() => setMonitoringActive(!monitoringActive)}
            className={`px-4 py-2 rounded-xl text-xs font-mono font-bold flex items-center gap-2 transition-all shadow-md ${
              monitoringActive
                ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-900/30'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                monitoringActive ? 'bg-white animate-ping' : 'bg-slate-500'
              }`}
            ></span>
            {monitoringActive ? 'Surveillance Active' : 'Surveillance Paused'}
          </button>
        </div>
      </div>

      {/* Main Grid: Watchlist Table + Autonomous Trigger Simulator */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Watchlist Table */}
        <div className="lg:col-span-7 space-y-4">
          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
            {/* Header with Title and Quick Add Controls */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-400 font-mono">
              <div className="flex items-center gap-2">
                <span className="font-bold text-white">
                  WATCHLIST ({filteredWatchlist.length} of {watchlist.length})
                </span>
                <span className="hidden sm:inline text-slate-600">•</span>
                <span className="text-[11px] text-slate-400">CLICK ROW TO LOAD RESEARCH</span>
              </div>

              {/* Quick Inline Add Form */}
              <form onSubmit={handleQuickAdd} className="flex items-center gap-1.5 w-full sm:w-auto">
                <div className="relative flex-1 sm:w-44">
                  <input
                    type="text"
                    value={quickAddInput}
                    onChange={(e) => setQuickAddInput(e.target.value)}
                    placeholder="Quick add (e.g. NIFTYBEES)"
                    className="w-full bg-slate-950 border border-slate-700/80 rounded-lg px-2.5 py-1.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500 font-mono uppercase"
                  />
                  {quickAddInput && (
                    <button
                      type="button"
                      onClick={() => setQuickAddInput('')}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>
                <button
                  type="submit"
                  disabled={!quickAddInput.trim()}
                  className="px-2.5 py-1.5 rounded-lg bg-cyan-700 hover:bg-cyan-600 disabled:bg-slate-800 disabled:text-slate-500 text-white text-xs font-mono font-semibold flex items-center gap-1 transition-colors"
                  title="Quick add to watchlist"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add</span>
                </button>
              </form>
            </div>

            {quickAddError && (
              <div className="p-2 rounded-lg bg-rose-950/40 border border-rose-800 text-rose-300 text-xs font-mono">
                {quickAddError}
              </div>
            )}

            {/* Filter Pills Bar & Search Filter */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1 border-t border-slate-800/80">
              {/* Category Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none text-xs font-mono">
                <button
                  onClick={() => setActiveAssetFilter('ALL')}
                  className={`px-2.5 py-1 rounded-lg transition-colors whitespace-nowrap ${
                    activeAssetFilter === 'ALL'
                      ? 'bg-slate-700 text-white font-bold'
                      : 'bg-slate-950 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  All ({counts.all})
                </button>
                <button
                  onClick={() => setActiveAssetFilter('STOCKS')}
                  className={`px-2.5 py-1 rounded-lg transition-colors whitespace-nowrap flex items-center gap-1 ${
                    activeAssetFilter === 'STOCKS'
                      ? 'bg-emerald-800 text-emerald-100 font-bold'
                      : 'bg-slate-950 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <TrendingUp className="w-3 h-3" />
                  Stocks ({counts.stocks})
                </button>
                <button
                  onClick={() => setActiveAssetFilter('ETFS')}
                  className={`px-2.5 py-1 rounded-lg transition-colors whitespace-nowrap flex items-center gap-1 ${
                    activeAssetFilter === 'ETFS'
                      ? 'bg-amber-800 text-amber-100 font-bold'
                      : 'bg-slate-950 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Coins className="w-3 h-3 text-amber-300" />
                  ETFs ({counts.etfs})
                </button>
                <button
                  onClick={() => setActiveAssetFilter('SHIFTS')}
                  className={`px-2.5 py-1 rounded-lg transition-colors whitespace-nowrap flex items-center gap-1 ${
                    activeAssetFilter === 'SHIFTS'
                      ? 'bg-rose-900 text-rose-100 font-bold'
                      : 'bg-slate-950 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <AlertTriangle className="w-3 h-3 text-rose-400" />
                  Shifts ({counts.shifts})
                </button>
              </div>

              {/* Search Watchlist input */}
              <div className="relative min-w-[140px] sm:min-w-[180px] w-full sm:w-auto">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Filter table..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-8 pr-7 py-1 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500 font-mono"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>

            {/* Watchlist Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400">
                    <th className="py-2.5 px-3">Symbol / Asset</th>
                    <th className="py-2.5 px-3">Price</th>
                    <th className="py-2.5 px-3">24h Chg</th>
                    <th className="py-2.5 px-3 text-center">Score</th>
                    <th className="py-2.5 px-3">Thesis Status</th>
                    <th className="py-2.5 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {filteredWatchlist.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-slate-400 space-y-3">
                        <div className="max-w-md mx-auto space-y-2">
                          <p className="font-semibold text-slate-300">
                            {watchlist.length === 0
                              ? 'Your watchlist is currently empty.'
                              : `No assets matched "${searchQuery}".`}
                          </p>
                          <p className="text-xs text-slate-500">
                            {watchlist.length === 0
                              ? 'Add any of 2,580+ Indian stocks or ETFs (e.g. NIFTYBEES, GOLDBEES, TCS, RELIANCE) to begin continuous multi-agent surveillance.'
                              : 'Try clearing your search filter or category selection.'}
                          </p>
                          <div className="flex items-center justify-center gap-3 pt-2">
                            <button
                              onClick={() => setIsAddModalOpen(true)}
                              className="px-3.5 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm"
                            >
                              <Plus className="w-3.5 h-3.5" />
                              <span>Add Stock or ETF</span>
                            </button>
                            {onResetWatchlist && watchlist.length === 0 && (
                              <button
                                onClick={onResetWatchlist}
                                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs flex items-center gap-1"
                              >
                                <RotateCcw className="w-3 h-3" />
                                <span>Load Defaults</span>
                              </button>
                            )}
                          </div>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredWatchlist.map((item) => {
                      const isEtf =
                        item.isEtf ||
                        (item.sector &&
                          (item.sector.toLowerCase().includes('etf') ||
                            item.sector.toLowerCase().includes('exchange traded fund'))) ||
                        item.symbol.toLowerCase().includes('bees') ||
                        item.symbol.toLowerCase().includes('etf');
                      const displayScore = item.committeeScore ?? item.score ?? 75;

                      return (
                        <tr
                          key={item.symbol}
                          onClick={() => onSelectStock(item.symbol)}
                          className="hover:bg-slate-800/50 cursor-pointer transition-colors group"
                        >
                          <td className="py-3 px-3">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-white">{item.symbol}</span>
                              <span
                                className={`px-1.5 py-0.2 rounded text-[9px] font-mono font-semibold ${
                                  isEtf
                                    ? 'bg-amber-950/80 text-amber-300 border border-amber-800/80'
                                    : 'bg-slate-800 text-slate-300 border border-slate-700'
                                }`}
                              >
                                {isEtf ? 'ETF' : 'EQUITY'}
                              </span>
                            </div>
                            <div className="text-[10px] text-slate-400 truncate max-w-[180px] sm:max-w-[220px]">
                              {item.name}
                            </div>
                          </td>
                          <td className="py-3 px-3 text-slate-200">
                            {item.currency || '₹'}
                            {item.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </td>
                          <td
                            className={`py-3 px-3 font-semibold ${
                              item.changePercent >= 0 ? 'text-emerald-400' : 'text-rose-400'
                            }`}
                          >
                            {item.changePercent >= 0 ? '+' : ''}
                            {item.changePercent.toFixed(2)}%
                          </td>
                          <td className="py-3 px-3 text-center">
                            <span
                              className={`px-2 py-0.5 rounded-full font-bold text-[11px] ${
                                displayScore >= 75
                                  ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                                  : displayScore >= 60
                                  ? 'bg-amber-950 text-amber-300 border border-amber-800'
                                  : 'bg-rose-950 text-rose-300 border border-rose-800'
                              }`}
                            >
                              {displayScore}
                            </span>
                          </td>
                          <td className="py-3 px-3">
                            {item.thesisChanged ? (
                              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-400 animate-pulse">
                                <AlertTriangle className="w-3 h-3" /> Shift Detected
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[11px] text-emerald-400">
                                <CheckCircle2 className="w-3 h-3" />{' '}
                                {item.thesisStatus || 'Unchanged'}
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-3 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <span className="text-[11px] text-cyan-400 hover:underline">
                                View ➔
                              </span>

                              {/* Dedicated Remove Button */}
                              {onRemoveStock && (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleRemove(item.symbol);
                                  }}
                                  title={`Remove ${item.symbol} from watchlist`}
                                  className="p-1 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-950/40 border border-transparent hover:border-rose-900/60 transition-all opacity-80 group-hover:opacity-100"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Bottom Bar: Add Stock quick button + Disclaimer */}
            <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs font-mono text-slate-400">
              <button
                onClick={() => setIsAddModalOpen(true)}
                className="inline-flex items-center gap-1.5 text-cyan-400 hover:text-cyan-300 font-semibold transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>Add Another Stock or ETF</span>
              </button>
              {onResetWatchlist && (
                <button
                  onClick={onResetWatchlist}
                  className="inline-flex items-center gap-1 text-slate-500 hover:text-slate-300 transition-colors"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Reset Default Watchlist</span>
                </button>
              )}
            </div>

            {/* Educational Use Disclaimer */}
            <EducationalDisclaimer
              variant="footer"
              actionContext="BUY_SELL_HOLD"
              className="mt-3"
            />
          </div>

          {/* Trigger Simulator Card */}
          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white font-mono flex items-center gap-2">
                <Sliders className="w-4 h-4 text-cyan-400" />
                Trigger Event Simulation Testing
              </h3>
              <span className="text-[11px] text-slate-400 font-mono">
                Test Agent Reactive Workflows
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Fire test market shocks to see how FINAGENT autonomous agents intercept anomalies,
              recalculate risk, and update the investment thesis.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              {triggers.map((t, idx) => (
                <button
                  key={idx}
                  onClick={() => onSimulateTrigger(t.trigger)}
                  className={`p-3 rounded-xl border border-slate-800 text-left transition-all space-y-1 ${t.color}`}
                >
                  <div className="text-xs font-bold font-mono">{t.title}</div>
                  <p className="text-[11px] text-slate-300 leading-relaxed">{t.desc}</p>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right: Live Notifications Feed (Telegram / Push Preview) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Bell className="w-4 h-4 text-cyan-400" />
                <h3 className="text-sm font-bold text-white font-mono">DISPATCHED AGENT ALERTS</h3>
              </div>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-cyan-950 text-cyan-300 border border-cyan-800">
                TELEGRAM & PUSH SIMULATOR
              </span>
            </div>

            {/* Notification items */}
            <div className="space-y-3 max-h-[500px] overflow-y-auto">
              {recentAlerts.length === 0 ? (
                <div className="py-8 text-center text-slate-500 text-xs font-mono">
                  No alerts dispatched yet. Surveillance is listening for market triggers.
                </div>
              ) : (
                recentAlerts.map((alert) => (
                  <div
                    key={alert.id}
                    className={`p-3.5 rounded-xl border transition-all text-xs font-mono space-y-2 ${
                      alert.severity === 'critical'
                        ? 'border-rose-700/60 bg-rose-950/30 text-rose-200'
                        : alert.severity === 'warning'
                        ? 'border-amber-700/60 bg-amber-950/30 text-amber-200'
                        : 'border-cyan-700/60 bg-cyan-950/20 text-slate-200'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white">{alert.symbol}</span>
                        <span className="px-1.5 py-0.2 rounded text-[10px] bg-slate-800 text-slate-300">
                          {alert.type}
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-400 flex items-center gap-1">
                        <Clock className="w-3 h-3" /> {alert.timestamp}
                      </span>
                    </div>

                    <p className="text-xs text-slate-300 leading-relaxed font-sans">
                      {alert.message}
                    </p>

                    <div className="pt-2 border-t border-slate-800/60 flex items-center justify-between text-[10px] text-slate-400">
                      <span>Delivered via: Telegram Bot & Webhook</span>
                      <button
                        onClick={() => onSelectStock(alert.symbol)}
                        className="text-cyan-400 hover:underline flex items-center gap-1 font-semibold"
                      >
                        Audit Thesis <ExternalLink className="w-2.5 h-2.5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Add Watchlist Stock or ETF Modal */}
      <AddWatchlistStockModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAddStock={handleAddFromModal}
        watchlistSymbols={watchlistSymbols}
      />
    </div>
  );
};
