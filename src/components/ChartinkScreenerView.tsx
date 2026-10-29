import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  TrendingUp,
  Flame,
  ExternalLink,
  RefreshCw,
  Search,
  Filter,
  SlidersHorizontal,
  Activity,
  ShieldCheck,
  Star,
  Copy,
  Check,
  Radio,
  ArrowUpRight,
  ArrowDownRight,
  Layers,
  Zap,
  Info,
  Clock,
  Sparkles,
  BarChart3,
  ChevronRight,
  ChevronDown,
  X,
  Send,
  AlertTriangle,
} from 'lucide-react';
import { WatchlistItem, StockResearchData } from '../types';

export interface ChartinkStockItem {
  sr: number;
  symbol: string;
  name: string;
  close: number;
  per_chg: number;
  volume: number;
  market_cap?: number;
  sector?: string;
  breakoutScore?: number;
}

export interface ChartinkScreenerData {
  success: boolean;
  source: string;
  screenerUrl: string;
  scanName: string;
  description: string;
  timestamp: string;
  count: number;
  stocks: ChartinkStockItem[];
  atlasQuery?: string;
  error?: string;
}

export interface ChartinkPreset {
  id: string;
  name: string;
  slug: string;
  url: string;
  description: string;
  category: string;
}

interface ChartinkScreenerViewProps {
  onSelectStock: (symbol: string) => void;
  onOpenPaperTrade: (symbol: string) => void;
  onAddToWatchlist: (item: WatchlistItem) => void;
  watchlist: WatchlistItem[];
  stocks?: Record<string, StockResearchData>;
}

export const ChartinkScreenerView: React.FC<ChartinkScreenerViewProps> = ({
  onSelectStock,
  onOpenPaperTrade,
  onAddToWatchlist,
  watchlist,
  stocks = {},
}) => {
  const [activeUrl, setActiveUrl] = useState<string>('https://chartink.com/screener/trendline-breakout');
  const [customInputUrl, setCustomInputUrl] = useState<string>('https://chartink.com/screener/trendline-breakout');
  const [data, setData] = useState<ChartinkScreenerData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [minGainFilter, setMinGainFilter] = useState<number | 'all'>('all');
  const [sortBy, setSortBy] = useState<'score' | 'gain' | 'volume' | 'price'>('score');
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');
  const [autoRefreshInterval, setAutoRefreshInterval] = useState<number>(0); // 0 = off, 30 = 30s, 60 = 60s
  const [showWebhookModal, setShowWebhookModal] = useState<boolean>(false);
  const [showQueryDetails, setShowQueryDetails] = useState<boolean>(false);
  const [copiedWebhookUrl, setCopiedWebhookUrl] = useState<boolean>(false);
  const [webhookAlerts, setWebhookAlerts] = useState<any[]>([]);
  const [testWebhookStatus, setTestWebhookStatus] = useState<string>('');
  const [addedSymbols, setAddedSymbols] = useState<Set<string>>(new Set());

  // Presets
  const presets: ChartinkPreset[] = useMemo(
    () => [
      {
        id: 'trendline-breakout',
        name: 'Trendline Breakout',
        slug: 'trendline-breakout',
        url: 'https://chartink.com/screener/trendline-breakout',
        description: 'Shares breaking out above 20-day high resistance with bullish expansion',
        category: 'Breakout & Momentum',
      },
      {
        id: 'supertrend-breakout',
        name: 'Supertrend Crossover',
        slug: 'supertrend-positive-breakout-scan',
        url: 'https://chartink.com/screener/supertrend-positive-breakout-scan',
        description: 'Fresh bullish Supertrend (7, 3) breakout with volume surge',
        category: 'Trend Following',
      },
      {
        id: '52-week-high',
        name: '52-Week High Breakout',
        slug: '52-week-high-breakout',
        url: 'https://chartink.com/screener/52-week-high-breakout',
        description: 'Equities breaking through 250-day annual high resistances',
        category: 'High Momentum',
      },
      {
        id: 'volume-shockers',
        name: 'Volume Shockers',
        slug: 'volume-shockers',
        url: 'https://chartink.com/screener/volume-shockers',
        description: 'Surge in trading volume > 2.5x 20-DMA with positive price action',
        category: 'Volume & Liquidity',
      },
    ],
    []
  );

  // Fetch screener data
  const loadScreener = useCallback(
    async (urlToFetch: string) => {
      setLoading(true);
      setError(null);
      try {
        const encodedUrl = encodeURIComponent(urlToFetch);
        const res = await fetch(`/api/chartink/screener?url=${encodedUrl}`);
        if (!res.ok) {
          throw new Error(`Failed to fetch from Chartink: status ${res.status}`);
        }
        const json: ChartinkScreenerData = await res.json();
        setData(json);
      } catch (err: any) {
        console.error('Error fetching Chartink screener:', err);
        setError(err.message || 'Unable to fetch Chartink screener. Using cached breakout candidates.');
      } finally {
        setLoading(false);
      }
    },
    []
  );

  // Fetch recent webhook alerts
  const loadWebhookAlerts = useCallback(async () => {
    try {
      const res = await fetch('/api/chartink/webhook/alerts');
      if (res.ok) {
        const json = await res.json();
        if (json.alerts) {
          setWebhookAlerts(json.alerts);
        }
      }
    } catch {}
  }, []);

  // Initial load
  useEffect(() => {
    loadScreener(activeUrl);
    loadWebhookAlerts();
  }, [activeUrl, loadScreener, loadWebhookAlerts]);

  // Auto-refresh interval
  useEffect(() => {
    if (autoRefreshInterval <= 0) return;
    const interval = setInterval(() => {
      loadScreener(activeUrl);
      loadWebhookAlerts();
    }, autoRefreshInterval * 1000);
    return () => clearInterval(interval);
  }, [autoRefreshInterval, activeUrl, loadScreener, loadWebhookAlerts]);

  // Handle preset select
  const handleSelectPreset = (preset: ChartinkPreset) => {
    setActiveUrl(preset.url);
    setCustomInputUrl(preset.url);
  };

  // Handle custom URL submit
  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customInputUrl.trim()) return;
    setActiveUrl(customInputUrl.trim());
  };

  // 1-Click Add to Watchlist
  const handleQuickAddToWatchlist = (stock: ChartinkStockItem) => {
    onAddToWatchlist({
      symbol: stock.symbol,
      name: stock.name,
      price: stock.close,
      changePercent: stock.per_chg,
      score: stock.breakoutScore || 85,
      committeeScore: stock.breakoutScore || 85,
      currency: '₹',
      statusTag: stock.per_chg > 5 ? 'STRONG_BUY' : 'POSITIVE',
      thesisStatus: `BREAKOUT CONFIRMED (+${stock.per_chg.toFixed(1)}%)`,
      thesisChanged: true,
      lastAnalyzed: 'Just now',
      sector: stock.sector || 'Indian Equity',
      intrinsicValue: +(stock.close * 1.15).toFixed(2),
      marginOfSafetyPercent: 15,
    });
    setAddedSymbols((prev) => new Set([...prev, stock.symbol]));
    setTimeout(() => {
      setAddedSymbols((prev) => {
        const next = new Set(prev);
        next.delete(stock.symbol);
        return next;
      });
    }, 2500);
  };

  // Test webhook trigger
  const handleTestWebhook = async () => {
    setTestWebhookStatus('Sending test breakout alert...');
    try {
      const res = await fetch('/api/chartink/webhook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scan_name: 'Trendline Breakout (Live Test)',
          stocks: 'ADANIPORTS,NILKAMAL,SANOFI,BLUESTARCO',
          triggered_at: new Date().toISOString(),
          prices: '1872.0,2003.9,3189.5,1673.0',
        }),
      });
      const resJson = await res.json();
      if (resJson.success) {
        setTestWebhookStatus(`✓ Test Alert dispatched! Processed ${resJson.alert?.stocks?.length || 4} symbols.`);
        loadWebhookAlerts();
      } else {
        setTestWebhookStatus(`Alert failed: ${resJson.error || 'Unknown'}`);
      }
    } catch (e: any) {
      setTestWebhookStatus(`Error: ${e.message}`);
    }
    setTimeout(() => setTestWebhookStatus(''), 4000);
  };

  // Filtered and sorted stocks
  const displayedStocks = useMemo(() => {
    if (!data?.stocks) return [];
    let list = [...data.stocks];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (s) => s.symbol.toLowerCase().includes(q) || s.name.toLowerCase().includes(q)
      );
    }

    if (minGainFilter !== 'all') {
      list = list.filter((s) => s.per_chg >= minGainFilter);
    }

    list.sort((a, b) => {
      if (sortBy === 'score') {
        return (b.breakoutScore || 0) - (a.breakoutScore || 0);
      }
      if (sortBy === 'gain') {
        return b.per_chg - a.per_chg;
      }
      if (sortBy === 'volume') {
        return b.volume - a.volume;
      }
      if (sortBy === 'price') {
        return b.close - a.close;
      }
      return 0;
    });

    return list;
  }, [data?.stocks, searchQuery, minGainFilter, sortBy]);

  // Derived metrics
  const metrics = useMemo(() => {
    const raw = data?.stocks || [];
    if (!raw.length) {
      return { total: 0, avgGain: 0, topGainer: null, highConvictionCount: 0 };
    }
    const total = raw.length;
    const avgGain = raw.reduce((sum, s) => sum + s.per_chg, 0) / total;
    const sortedByGain = [...raw].sort((a, b) => b.per_chg - a.per_chg);
    const topGainer = sortedByGain[0];
    const highConvictionCount = raw.filter((s) => (s.breakoutScore || 0) >= 90).length;
    return {
      total,
      avgGain,
      topGainer,
      highConvictionCount,
    };
  }, [data?.stocks]);

  // Format volume
  const formatVol = (vol: number) => {
    if (!vol) return '—';
    if (vol >= 10000000) return `${(vol / 10000000).toFixed(2)} Cr`;
    if (vol >= 100000) return `${(vol / 100000).toFixed(2)} L`;
    if (vol >= 1000) return `${(vol / 1000).toFixed(1)}k`;
    return vol.toLocaleString('en-IN');
  };

  const webhookEndpointUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/api/chartink/webhook`
    : 'https://your-domain.com/api/chartink/webhook';

  const copyWebhookToClipboard = () => {
    navigator.clipboard.writeText(webhookEndpointUrl);
    setCopiedWebhookUrl(true);
    setTimeout(() => setCopiedWebhookUrl(false), 2000);
  };

  const isCurrentActiveUrlCustom = !presets.some((p) => p.url === activeUrl);

  return (
    <div className="space-y-5 animate-in fade-in duration-300">
      {/* Top Banner / Integration Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950/80 to-slate-900 border border-indigo-700/40 p-5 shadow-xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-rose-500/10 rounded-full blur-3xl pointer-events-none -ml-20 -mb-20"></div>

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-amber-500/20 to-rose-500/20 border border-amber-500/40 text-amber-300 font-semibold text-xs tracking-wide shadow-sm">
                <Flame className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
                CHARTINK LIVE BREAKOUT SCANNER
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-950/80 border border-emerald-600/60 text-emerald-300 font-mono text-[11px]">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
                LIVE ATLAS ENGINE
              </span>
              <span className="text-xs text-slate-400 font-mono">
                Source: <span className="text-cyan-300 font-medium">{data?.source || 'chartink.com'}</span>
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-2">
              <span>Trendline Breakout Intelligence</span>
              <span className="text-xs font-normal px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 border border-slate-700">
                NSE & BSE Cash
              </span>
            </h1>

            <p className="text-sm text-slate-300 mt-1 max-w-2xl">
              Live automated scanning of Chartink&apos;s trendline breakout criteria for high-momentum bullish setups.
              Filter, analyze in the 10-Agent Cockpit, or 1-click paper trade in the isolated sandbox.
            </p>

            <div className="flex items-center gap-2 mt-2 text-xs text-slate-400">
              <span>Target Screener:</span>
              <a
                href={activeUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-cyan-400 hover:text-cyan-300 hover:underline font-mono bg-slate-800/80 px-2 py-0.5 rounded border border-slate-700 max-w-md truncate"
                title="Open live on Chartink.com"
              >
                <span>{activeUrl}</span>
                <ExternalLink className="w-3 h-3 shrink-0" />
              </a>
            </div>
          </div>

          {/* Quick Actions & Controls */}
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => setShowWebhookModal(true)}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800/90 hover:bg-slate-750 text-slate-200 border border-slate-700 text-xs font-medium transition-all shadow-sm"
              title="Configure real-time Chartink webhook alerts"
            >
              <Radio className="w-3.5 h-3.5 text-rose-400 animate-pulse" />
              <span>Webhook Alerts</span>
              {webhookAlerts.length > 0 && (
                <span className="px-1.5 py-0.2 rounded-full bg-rose-500/20 text-rose-300 text-[10px] font-bold">
                  {webhookAlerts.length}
                </span>
              )}
            </button>

            <div className="flex items-center bg-slate-800/80 rounded-xl border border-slate-700 p-0.5 text-xs">
              <span className="px-2 py-1 text-slate-400 font-mono text-[11px] flex items-center gap-1">
                <Clock className="w-3 h-3 text-cyan-400" />
                Auto:
              </span>
              {[
                { label: 'Off', val: 0 },
                { label: '30s', val: 30 },
                { label: '60s', val: 60 },
              ].map((opt) => (
                <button
                  key={opt.val}
                  onClick={() => setAutoRefreshInterval(opt.val)}
                  className={`px-2 py-1 rounded-lg font-medium transition-colors ${
                    autoRefreshInterval === opt.val
                      ? 'bg-cyan-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            <button
              onClick={() => loadScreener(activeUrl)}
              disabled={loading}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-xs font-bold transition-all shadow-md shadow-cyan-900/30 disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>{loading ? 'Scanning...' : 'Refresh Scan'}</span>
            </button>
          </div>
        </div>

        {/* Screener Presets Strip */}
        <div className="mt-4 pt-3 border-t border-slate-800/80 flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1 mr-1">
            <Layers className="w-3.5 h-3.5 text-indigo-400" />
            Screener Presets:
          </span>

          {presets.map((preset) => {
            const isSelected = activeUrl === preset.url;
            return (
              <button
                key={preset.id}
                onClick={() => handleSelectPreset(preset)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  isSelected
                    ? 'bg-cyan-600 text-white shadow-md shadow-cyan-900/40 border border-cyan-400/30'
                    : 'bg-slate-800/80 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/60'
                }`}
              >
                {preset.id === 'trendline-breakout' && <Flame className="w-3 h-3 text-amber-400" />}
                <span>{preset.name}</span>
                {isSelected && (
                  <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping"></span>
                )}
              </button>
            );
          })}

          <button
            onClick={() => setShowQueryDetails((prev) => !prev)}
            className="ml-auto text-xs text-slate-400 hover:text-slate-200 flex items-center gap-1 transition-colors"
          >
            <Info className="w-3.5 h-3.5 text-cyan-400" />
            <span>Atlas Logic</span>
            <ChevronDown className={`w-3 h-3 transition-transform ${showQueryDetails ? 'rotate-180' : ''}`} />
          </button>
        </div>

        {/* Custom URL Input Bar */}
        <form onSubmit={handleCustomSubmit} className="mt-3 flex items-center gap-2">
          <div className="relative flex-1">
            <input
              type="text"
              value={customInputUrl}
              onChange={(e) => setCustomInputUrl(e.target.value)}
              placeholder="Paste any custom Chartink screener URL (e.g., https://chartink.com/screener/...)"
              className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-950/80 border border-slate-700 focus:border-cyan-500 focus:outline-none text-xs text-slate-200 font-mono"
            />
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
          </div>
          <button
            type="submit"
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-600 text-slate-200 text-xs font-medium transition-colors shrink-0 flex items-center gap-1.5"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Run Custom Chartink URL</span>
          </button>
        </form>

        {/* Expanded Atlas Logic Details */}
        {showQueryDetails && (
          <div className="mt-3 p-3 rounded-xl bg-slate-950/90 border border-slate-800 text-xs text-slate-300 font-mono space-y-1.5 animate-in fade-in duration-200">
            <div className="flex items-center justify-between text-[11px] text-slate-400">
              <span className="font-semibold text-cyan-400">Chartink Atlas Query Formula:</span>
              <span>Updated: {data?.timestamp || 'Live'}</span>
            </div>
            <p className="bg-slate-900 p-2.5 rounded-lg border border-slate-800 text-cyan-300 text-[11px] break-all leading-relaxed">
              {data?.atlasQuery ||
                '( {cash} ( ( {cash} ( latest close > 3 days ago max( 20 , latest high ) and 1 day ago close <= 4 days ago max( 20 , latest high ) and 4 days ago high < 3 days ago max( 20 , latest high ) ) ) ) )'}
            </p>
            <p className="text-[11px] text-slate-400">
              Breakout Rule: Current candle close exceeds the maximum 20-day high from 3 days ago, while yesterday closed below the previous resistance, confirming a fresh trendline breakout today.
            </p>
          </div>
        )}
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 flex items-center justify-between">
          <div>
            <div className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Breakouts Found</div>
            <div className="text-xl font-bold text-white mt-0.5">{metrics.total} Stocks</div>
            <div className="text-[10px] text-slate-400 mt-0.5 font-mono">Matched by Chartink</div>
          </div>
          <div className="w-9 h-9 rounded-lg bg-cyan-950/80 border border-cyan-800/60 flex items-center justify-center text-cyan-400">
            <Flame className="w-5 h-5 text-amber-400" />
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 flex items-center justify-between">
          <div>
            <div className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Average Breakout Gain</div>
            <div className="text-xl font-bold text-emerald-400 mt-0.5">
              +{metrics.avgGain > 0 ? metrics.avgGain.toFixed(2) : '0.00'}%
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5 font-mono">Today&apos;s intraday move</div>
          </div>
          <div className="w-9 h-9 rounded-lg bg-emerald-950/80 border border-emerald-800/60 flex items-center justify-center text-emerald-400">
            <ArrowUpRight className="w-5 h-5" />
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 flex items-center justify-between">
          <div>
            <div className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Top Momentum Stock</div>
            <div className="text-xl font-bold text-cyan-300 mt-0.5 truncate max-w-[120px]">
              {metrics.topGainer ? metrics.topGainer.symbol : '—'}
            </div>
            <div className="text-[10px] text-emerald-400 mt-0.5 font-mono">
              {metrics.topGainer ? `+${metrics.topGainer.per_chg.toFixed(2)}%` : '—'}
            </div>
          </div>
          <div className="w-9 h-9 rounded-lg bg-indigo-950/80 border border-indigo-800/60 flex items-center justify-center text-indigo-400">
            <Zap className="w-5 h-5 text-amber-400" />
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 flex items-center justify-between">
          <div>
            <div className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">High Conviction</div>
            <div className="text-xl font-bold text-purple-300 mt-0.5">{metrics.highConvictionCount} Setups</div>
            <div className="text-[10px] text-slate-400 mt-0.5 font-mono">Breakout Score ≥ 90</div>
          </div>
          <div className="w-9 h-9 rounded-lg bg-purple-950/80 border border-purple-800/60 flex items-center justify-center text-purple-400">
            <ShieldCheck className="w-5 h-5 text-purple-400" />
          </div>
        </div>
      </div>

      {/* Filter and Control Toolbar */}
      <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 flex flex-wrap items-center justify-between gap-3">
        {/* Search */}
        <div className="relative flex-1 min-w-[220px]">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search breakout symbol (e.g., ADANIPORTS, NILKAMAL)..."
            className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-slate-950 border border-slate-700/80 focus:border-cyan-500 focus:outline-none text-xs text-slate-200 font-mono"
          />
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2" />
        </div>

        {/* Min Gain Filter */}
        <div className="flex items-center gap-1.5 text-xs text-slate-300">
          <span className="text-slate-400 flex items-center gap-1">
            <Filter className="w-3 h-3" />
            Min Gain:
          </span>
          <div className="flex items-center bg-slate-950 rounded-lg border border-slate-800 p-0.5">
            {[
              { label: 'All', val: 'all' as const },
              { label: '>2%', val: 2 },
              { label: '>4%', val: 4 },
              { label: '>6%', val: 6 },
            ].map((f) => (
              <button
                key={f.label}
                onClick={() => setMinGainFilter(f.val)}
                className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors ${
                  minGainFilter === f.val
                    ? 'bg-cyan-600 text-white font-semibold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Sort By */}
        <div className="flex items-center gap-1.5 text-xs text-slate-300">
          <span className="text-slate-400 flex items-center gap-1">
            <SlidersHorizontal className="w-3 h-3" />
            Sort:
          </span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="bg-slate-950 border border-slate-700/80 rounded-lg px-2 py-1 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
          >
            <option value="score">Breakout Score (High)</option>
            <option value="gain">% Gain (High to Low)</option>
            <option value="volume">Trading Volume</option>
            <option value="price">Share Price (CMP)</option>
          </select>
        </div>

        {/* View Mode */}
        <div className="flex items-center bg-slate-950 rounded-lg border border-slate-800 p-0.5">
          <button
            onClick={() => setViewMode('table')}
            className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
              viewMode === 'table' ? 'bg-cyan-600 text-white' : 'text-slate-400 hover:text-slate-200'
            }`}
            title="Table View"
          >
            Table
          </button>
          <button
            onClick={() => setViewMode('cards')}
            className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
              viewMode === 'cards' ? 'bg-cyan-600 text-white' : 'text-slate-400 hover:text-slate-200'
            }`}
            title="Card Grid View"
          >
            Cards
          </button>
        </div>
      </div>

      {/* Error / Notice Display */}
      {error && (
        <div className="p-3 rounded-xl bg-amber-950/40 border border-amber-800/60 text-amber-300 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
            <span>{error}</span>
          </div>
          <button
            onClick={() => loadScreener(activeUrl)}
            className="text-amber-200 underline font-semibold hover:text-white"
          >
            Retry Live
          </button>
        </div>
      )}

      {/* Main Results Table or Cards */}
      {loading ? (
        <div className="p-12 text-center rounded-2xl bg-slate-900/60 border border-slate-800">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-cyan-950 border border-cyan-800 text-cyan-400 mb-3 animate-spin">
            <RefreshCw className="w-6 h-6" />
          </div>
          <h3 className="text-base font-semibold text-white">Scanning Chartink Breakouts...</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            Extracting session tokens and executing Atlas query against NSE cash equities.
          </p>
        </div>
      ) : displayedStocks.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-slate-900/60 border border-slate-800">
          <Filter className="w-10 h-10 text-slate-500 mx-auto mb-2" />
          <h3 className="text-base font-semibold text-white">No breakout stocks match your filters</h3>
          <p className="text-xs text-slate-400 mt-1">
            Try adjusting your search query or minimum gain filter.
          </p>
          <button
            onClick={() => {
              setSearchQuery('');
              setMinGainFilter('all');
            }}
            className="mt-3 px-3 py-1.5 rounded-lg bg-slate-800 text-slate-200 text-xs hover:bg-slate-700"
          >
            Reset Filters
          </button>
        </div>
      ) : viewMode === 'table' ? (
        <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-900/90 shadow-xl">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/80 text-[11px] font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-800">
              <tr>
                <th className="py-3 px-3 w-10 text-center">#</th>
                <th className="py-3 px-3">Stock / Company</th>
                <th className="py-3 px-3 text-right">CMP (₹)</th>
                <th className="py-3 px-3 text-right">% Change</th>
                <th className="py-3 px-3 text-right">Volume</th>
                <th className="py-3 px-3 text-center">Breakout Score</th>
                <th className="py-3 px-3 text-center">Actions & Sandbox</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80 font-mono">
              {displayedStocks.map((stock, idx) => {
                const isWatchlisted = watchlist.some(
                  (w) => w.symbol.toUpperCase() === stock.symbol.toUpperCase()
                );
                const isJustAdded = addedSymbols.has(stock.symbol);
                const isHighConviction = (stock.breakoutScore || 0) >= 90;

                return (
                  <tr
                    key={stock.symbol}
                    className="hover:bg-slate-850/60 transition-colors group"
                  >
                    <td className="py-3 px-3 text-center text-slate-500 text-[11px]">
                      {stock.sr || idx + 1}
                    </td>

                    <td className="py-3 px-3">
                      <div className="flex items-center gap-2">
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-white group-hover:text-cyan-300 transition-colors">
                              {stock.symbol}
                            </span>
                            {isHighConviction && (
                              <span className="px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 text-[9px] font-bold border border-amber-500/40">
                                90+ SETUP
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-slate-400 font-sans truncate max-w-[200px] sm:max-w-[260px]">
                            {stock.name}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="py-3 px-3 text-right font-bold text-white">
                      ₹{stock.close.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>

                    <td className="py-3 px-3 text-right">
                      <span
                        className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full font-bold text-[11px] ${
                          stock.per_chg >= 0
                            ? 'bg-emerald-950/90 text-emerald-300 border border-emerald-800'
                            : 'bg-rose-950/90 text-rose-300 border border-rose-800'
                        }`}
                      >
                        {stock.per_chg >= 0 ? '+' : ''}
                        {stock.per_chg.toFixed(2)}%
                      </span>
                    </td>

                    <td className="py-3 px-3 text-right text-slate-300 text-[11px]">
                      {formatVol(stock.volume)}
                    </td>

                    <td className="py-3 px-3">
                      <div className="flex flex-col items-center">
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`font-bold text-xs ${
                              (stock.breakoutScore || 0) >= 90
                                ? 'text-amber-400'
                                : (stock.breakoutScore || 0) >= 80
                                ? 'text-emerald-400'
                                : 'text-cyan-400'
                            }`}
                          >
                            {stock.breakoutScore || 85}
                          </span>
                          <span className="text-[10px] text-slate-500">/ 100</span>
                        </div>
                        <div className="w-16 h-1.5 bg-slate-800 rounded-full overflow-hidden mt-1">
                          <div
                            className={`h-full rounded-full ${
                              (stock.breakoutScore || 0) >= 90
                                ? 'bg-gradient-to-r from-amber-500 to-rose-500'
                                : (stock.breakoutScore || 0) >= 80
                                ? 'bg-emerald-500'
                                : 'bg-cyan-500'
                            }`}
                            style={{ width: `${Math.min(stock.breakoutScore || 85, 100)}%` }}
                          />
                        </div>
                      </div>
                    </td>

                    <td className="py-3 px-3">
                      <div className="flex items-center justify-center gap-1.5 font-sans">
                        {/* 1-click Cockpit Analysis */}
                        <button
                          onClick={() => onSelectStock(stock.symbol)}
                          className="px-2.5 py-1 rounded-lg bg-cyan-600/90 hover:bg-cyan-500 text-white font-medium text-[11px] transition-colors flex items-center gap-1 shadow-sm"
                          title={`Launch 10-Agent Cockpit Analysis for ${stock.symbol}`}
                        >
                          <TrendingUp className="w-3 h-3" />
                          <span>Cockpit</span>
                        </button>

                        {/* 1-click Isolated Paper Trade */}
                        <button
                          onClick={() => onOpenPaperTrade(stock.symbol)}
                          className="px-2.5 py-1 rounded-lg bg-indigo-600/90 hover:bg-indigo-500 text-white font-medium text-[11px] transition-colors flex items-center gap-1 shadow-sm"
                          title={`Open ${stock.symbol} in isolated Paper Trading sandbox`}
                        >
                          <Activity className="w-3 h-3 text-cyan-300" />
                          <span>Paper Trade</span>
                        </button>

                        {/* 1-click Add to Watchlist */}
                        <button
                          onClick={() => handleQuickAddToWatchlist(stock)}
                          disabled={isWatchlisted}
                          className={`p-1.5 rounded-lg border transition-colors ${
                            isJustAdded
                              ? 'bg-emerald-600 text-white border-emerald-500'
                              : isWatchlisted
                              ? 'bg-slate-800 text-amber-400 border-amber-500/40 opacity-70 cursor-default'
                              : 'bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border-slate-700'
                          }`}
                          title={isWatchlisted ? 'In Watchlist' : 'Add to Watchlist'}
                        >
                          {isJustAdded ? (
                            <Check className="w-3.5 h-3.5" />
                          ) : (
                            <Star className={`w-3.5 h-3.5 ${isWatchlisted ? 'fill-amber-400' : ''}`} />
                          )}
                        </button>

                        {/* Direct link to Chartink stock page */}
                        <a
                          href={`https://chartink.com/stocks/${stock.symbol.toLowerCase()}.html`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-cyan-300 border border-slate-700 transition-colors"
                          title="Open Chartink interactive chart"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        /* Card Grid View */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {displayedStocks.map((stock) => {
            const isWatchlisted = watchlist.some(
              (w) => w.symbol.toUpperCase() === stock.symbol.toUpperCase()
            );
            const isJustAdded = addedSymbols.has(stock.symbol);
            const isHighConviction = (stock.breakoutScore || 0) >= 90;

            return (
              <div
                key={stock.symbol}
                className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 hover:border-cyan-500/50 transition-all flex flex-col justify-between shadow-lg group"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-base text-white group-hover:text-cyan-300 transition-colors">
                          {stock.symbol}
                        </span>
                        {isHighConviction && (
                          <span className="px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 text-[9px] font-bold border border-amber-500/40">
                            90+ SETUP
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-slate-400 truncate max-w-[200px] mt-0.5">
                        {stock.name}
                      </div>
                    </div>

                    <span
                      className={`inline-flex items-center gap-0.5 px-2.5 py-0.5 rounded-full font-bold text-xs font-mono ${
                        stock.per_chg >= 0
                          ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                          : 'bg-rose-950 text-rose-300 border border-rose-800'
                      }`}
                    >
                      {stock.per_chg >= 0 ? '+' : ''}
                      {stock.per_chg.toFixed(2)}%
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 mt-3 p-2.5 rounded-lg bg-slate-950/80 border border-slate-800 text-xs font-mono">
                    <div>
                      <div className="text-[10px] text-slate-500 uppercase">CMP</div>
                      <div className="font-bold text-white">₹{stock.close.toLocaleString('en-IN')}</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-slate-500 uppercase">Volume</div>
                      <div className="text-slate-300">{formatVol(stock.volume)}</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-slate-500 uppercase">Score</div>
                      <div className="font-bold text-cyan-300">{stock.breakoutScore || 85}/100</div>
                    </div>
                  </div>
                </div>

                <div className="mt-3.5 pt-3 border-t border-slate-800/80 flex items-center gap-2">
                  <button
                    onClick={() => onSelectStock(stock.symbol)}
                    className="flex-1 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-xs transition-colors flex items-center justify-center gap-1 shadow-sm"
                  >
                    <TrendingUp className="w-3.5 h-3.5" />
                    <span>Cockpit</span>
                  </button>

                  <button
                    onClick={() => onOpenPaperTrade(stock.symbol)}
                    className="flex-1 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition-colors flex items-center justify-center gap-1 shadow-sm"
                  >
                    <Activity className="w-3.5 h-3.5 text-cyan-300" />
                    <span>Paper Trade</span>
                  </button>

                  <button
                    onClick={() => handleQuickAddToWatchlist(stock)}
                    disabled={isWatchlisted}
                    className={`p-1.5 rounded-lg border transition-colors ${
                      isJustAdded
                        ? 'bg-emerald-600 text-white border-emerald-500'
                        : isWatchlisted
                        ? 'bg-slate-800 text-amber-400 border-amber-500/40 opacity-70 cursor-default'
                        : 'bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border-slate-700'
                    }`}
                    title={isWatchlisted ? 'In Watchlist' : 'Add to Watchlist'}
                  >
                    {isJustAdded ? (
                      <Check className="w-3.5 h-3.5" />
                    ) : (
                      <Star className={`w-3.5 h-3.5 ${isWatchlisted ? 'fill-amber-400' : ''}`} />
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Webhook Configuration Modal */}
      {showWebhookModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-2xl rounded-2xl bg-slate-900 border border-slate-700 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Radio className="w-5 h-5 text-rose-400 animate-pulse" />
                <h3 className="text-lg font-bold text-white">Chartink Real-Time Webhook Listener</h3>
              </div>
              <button
                onClick={() => setShowWebhookModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              You can connect Chartink&apos;s alert notifications directly to FINAGENT. Whenever a stock breaks out in real-time, Chartink will fire a POST request to this webhook, immediately updating your scanner and alerting your autonomous agents.
            </p>

            {/* Webhook Endpoint */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-400">Webhook Receiver URL</label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={webhookEndpointUrl}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs font-mono text-cyan-300"
                />
                <button
                  onClick={copyWebhookToClipboard}
                  className="px-3 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold flex items-center gap-1.5 shrink-0"
                >
                  {copiedWebhookUrl ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  <span>{copiedWebhookUrl ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
            </div>

            {/* Step-by-Step Instructions */}
            <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 text-xs space-y-2">
              <div className="font-semibold text-cyan-400 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                How to set up in Chartink:
              </div>
              <ol className="list-decimal list-inside space-y-1 text-slate-300">
                <li>
                  Open <span className="font-mono text-cyan-300">{activeUrl}</span> on Chartink.
                </li>
                <li>Click <strong>&quot;Create Alert&quot;</strong> on Chartink.</li>
                <li>Under <strong>Notification Webhook</strong>, paste the receiver URL above.</li>
                <li>Set notification trigger frequency (e.g. Every 5 Minutes or On Candle Close).</li>
              </ol>
            </div>

            {/* Test Trigger Button */}
            <div className="flex items-center justify-between pt-2">
              <button
                onClick={handleTestWebhook}
                className="px-4 py-2 rounded-xl bg-rose-600/90 hover:bg-rose-500 text-white text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Fire Test Breakout Webhook</span>
              </button>

              {testWebhookStatus && (
                <span className="text-xs text-emerald-400 font-mono animate-in fade-in">
                  {testWebhookStatus}
                </span>
              )}

              <button
                onClick={() => setShowWebhookModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
              >
                Close
              </button>
            </div>

            {/* Recent Webhook Alerts Log */}
            {webhookAlerts.length > 0 && (
              <div className="mt-4 pt-3 border-t border-slate-800 space-y-2">
                <div className="text-xs font-semibold text-slate-400">
                  Recent Webhook Triggers ({webhookAlerts.length})
                </div>
                <div className="max-h-40 overflow-y-auto space-y-1.5">
                  {webhookAlerts.map((alert) => (
                    <div
                      key={alert.id}
                      className="p-2 rounded-lg bg-slate-950 border border-slate-800/80 text-[11px] font-mono flex items-center justify-between"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-rose-400 font-bold">{alert.scanName}</span>
                        <span className="text-slate-400">({alert.stocks?.join(', ')})</span>
                      </div>
                      <span className="text-slate-500 text-[10px]">
                        {new Date(alert.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
