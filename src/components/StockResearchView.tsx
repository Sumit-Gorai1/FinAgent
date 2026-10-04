import React from 'react';
import {
  TrendingUp,
  TrendingDown,
  ShieldCheck,
  AlertTriangle,
  Scale,
  LineChart,
  BarChart2,
  BookOpen,
  Newspaper,
  Globe2,
  CheckCircle2,
  ArrowUpRight,
  ArrowDownRight,
  ExternalLink,
  History,
  Activity,
  Layers,
  Sparkles,
  Zap,
  Bell,
  Plus,
  Play,
  Trash2,
  Volume2,
  VolumeX,
  Search,
  X,
  Building2,
  RotateCw,
  Clock,
  Filter,
  CornerDownLeft,
  LayoutGrid,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  BarChart,
  Bar,
  Legend,
  ReferenceLine,
} from 'recharts';
import { StockResearchData, PriceAlert } from '../types';
import { PriceAlertModal } from './PriceAlertModal';
import { AIResearchAssistant } from './AIResearchAssistant';
import { DynamicOrderDepth } from './DynamicOrderDepth';
import { DynamicValuationModel } from './DynamicValuationModel';
import { TradingViewChart } from './TradingViewChart';
import { FinancialChart } from './FinancialChart';
import { SectorHeatmap } from './SectorHeatmap';
import { ErrorBoundary } from './ErrorBoundary';
import { playAlertChime } from '../utils/soundAlert';
import { searchStockCatalog, resolveStockQuery, getMatchSegments } from '../utils/stockSearchResolver';
import { getIndianMarketStatus, isOrderDepthActiveForStock } from '../utils/marketHoursHelper';

interface StockResearchViewProps {
  stock: StockResearchData;
  stocks?: Record<string, StockResearchData>;
  onOpenPaperTrade: () => void;
  onSelectRelatedSymbol?: (sym: string) => void;
  onSearchStock?: (sym: string) => void;
  onOpenIndianStocksModal?: () => void;
  onOpenSectorHeatmap?: () => void;
  alerts: PriceAlert[];
  onAddAlert: (newAlert: Omit<PriceAlert, 'id' | 'createdAt' | 'status'>) => void;
  onDeleteAlert: (alertId: string) => void;
  onTriggerSimulatedAlert: (alert: PriceAlert) => void;
}

export const StockResearchView: React.FC<StockResearchViewProps> = ({
  stock,
  stocks,
  onOpenPaperTrade,
  onSelectRelatedSymbol,
  onSearchStock,
  onOpenIndianStocksModal,
  onOpenSectorHeatmap,
  alerts,
  onAddAlert,
  onDeleteAlert,
  onTriggerSimulatedAlert,
}) => {
  const [macroSubView, setMacroSubView] = React.useState<'chain' | 'heatmap'>('chain');
  const [activeTab, setActiveTab] = React.useState<
    'overview' | 'valuation' | 'technicals' | 'fundamentals' | 'news' | 'macro' | 'debate' | 'risk' | 'alerts' | 'ai-copilot' | 'memory' | 'verifier'
  >('overview');

  // Indian Market Session status (Regular trading: Mon-Fri 09:15 - 15:30 IST)
  const [marketSession, setMarketSession] = React.useState(getIndianMarketStatus());

  React.useEffect(() => {
    const updateStatus = () => {
      setMarketSession(getIndianMarketStatus());
    };
    const timer = setInterval(updateStatus, 15000);
    return () => clearInterval(timer);
  }, []);

  const isOrderDepthVisible = isOrderDepthActiveForStock(stock.symbol, stock.currency);

  const handleSelectStock = (sym: string) => {
    if (onSearchStock) {
      onSearchStock(sym);
    } else if (onSelectRelatedSymbol) {
      onSelectRelatedSymbol(sym);
    }
  };

  const [isAlertModalOpen, setIsAlertModalOpen] = React.useState<boolean>(false);
  const [alertModalPreset, setAlertModalPreset] = React.useState<{
    targetPrice?: number;
    condition?: 'ABOVE' | 'BELOW';
    note?: string;
  }>({});
  const [isAIAssistantOpen, setIsAIAssistantOpen] = React.useState<boolean>(false);

  // Filter alerts for this specific stock
  const stockAlerts = alerts.filter((a) => a.symbol === stock.symbol);
  const activeStockAlerts = stockAlerts.filter((a) => a.status === 'ACTIVE');
  const triggeredStockAlerts = stockAlerts.filter((a) => a.status === 'TRIGGERED');

  const [simulatedTickPrice, setSimulatedTickPrice] = React.useState<number>(stock.price);
  const [timeframe, setTimeframe] = React.useState<'1D' | '1W' | '1M' | '1Y'>('1M');
  const [chartIndicators, setChartIndicators] = React.useState({
    showSMA20: true,
    showSMA50: true,
    showVolume: true,
  });
  const [lastPrice, setLastPrice] = React.useState<number>(stock.price);
  const [priceFlash, setPriceFlash] = React.useState<'up' | 'down' | null>(null);

  React.useEffect(() => {
    if (stock.price !== lastPrice) {
      setPriceFlash(stock.price > lastPrice ? 'up' : 'down');
      setLastPrice(stock.price);
      const timer = setTimeout(() => setPriceFlash(null), 1200);
      return () => clearTimeout(timer);
    }
  }, [stock.price, lastPrice]);

  const chartData = React.useMemo(() => {
    if (timeframe === '1M') {
      return stock.priceHistory;
    }
    if (timeframe === '1D') {
      const times = ['09:15', '09:45', '10:15', '10:45', '11:15', '11:45', '12:15', '12:45', '13:15', '13:45', '14:15', '14:45', '15:15', '15:30'];
      const openPrice = stock.open || stock.price * 0.995;
      const step = (stock.price - openPrice) / (times.length - 1);
      return times.map((t, idx) => {
        const noise = Math.sin(idx) * (stock.price * 0.002);
        const c = Number((openPrice + step * idx + noise).toFixed(2));
        return {
          date: t,
          close: idx === times.length - 1 ? stock.price : c,
          volume: Math.floor(stock.volume / times.length + Math.random() * 80000),
          sma20: Number((c * 0.998).toFixed(2)),
          sma50: Number((c * 0.995).toFixed(2)),
        };
      });
    }
    if (timeframe === '1W') {
      const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Today'];
      const base = stock.price * 0.985;
      const step = (stock.price - base) / 4;
      return days.map((d, i) => {
        const c = Number((base + step * i + (Math.cos(i) * stock.price * 0.004)).toFixed(2));
        return {
          date: d,
          close: i === 4 ? stock.price : c,
          volume: Math.floor(stock.volume * (0.85 + i * 0.05)),
          sma20: Number((c * 0.996).toFixed(2)),
          sma50: Number((c * 0.992).toFixed(2)),
        };
      });
    }
    // 1Y
    const months = ['Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep'];
    const minP = stock.fiftyTwoWeekLow;
    const maxP = stock.fiftyTwoWeekHigh;
    return months.map((m, i) => {
      const prog = i / (months.length - 1);
      const c = Number((minP + (maxP - minP) * (0.35 + 0.55 * prog) + Math.sin(i * 1.2) * (maxP - minP) * 0.06).toFixed(2));
      return {
        date: m,
        close: i === months.length - 1 ? stock.price : c,
        volume: Math.floor(stock.avgVolume * (0.75 + Math.random() * 0.4)),
        sma20: Number((c * 0.98).toFixed(2)),
        sma50: Number((c * 0.96).toFixed(2)),
      };
    });
  }, [timeframe, stock.priceHistory, stock.price, stock.open, stock.volume, stock.fiftyTwoWeekLow, stock.fiftyTwoWeekHigh, stock.avgVolume]);

  // Live News Intelligence — Current Fresh Market News Only (strictly within today / past 24 hours)
  const [liveNews, setLiveNews] = React.useState<any[]>([]);
  const [isFetchingNews, setIsFetchingNews] = React.useState<boolean>(false);
  const [newsFetchedTime, setNewsFetchedTime] = React.useState<string>('Live Wire');

  const fetchStockNews = React.useCallback(async (sym: string, name?: string) => {
    setIsFetchingNews(true);
    try {
      const res = await fetch(`/api/live-market/news/${encodeURIComponent(sym)}?name=${encodeURIComponent(name || '')}`);
      if (res.ok) {
        const payload = await res.json();
        if (payload && Array.isArray(payload.articles)) {
          const now = Date.now();
          // Strictly fresh news filter: Exclude 1-day news, yesterday news, or stale updates (< 24h strictly)
          const strictlyFresh = payload.articles.filter((a: any) => {
            const d = (a.date || '').toLowerCase();
            const title = (a.title || '').toLowerCase();
            if (
              d.includes('day') ||
              d.includes('yesterday') ||
              d.includes('week') ||
              d.includes('month') ||
              title.includes('yesterday') ||
              title.includes('1 day ago') ||
              title.includes('days ago')
            ) {
              return false;
            }
            if (a.timestamp && (now - a.timestamp) >= 24 * 60 * 60 * 1000) {
              return false;
            }
            return true;
          });
          setLiveNews(strictlyFresh);
          setNewsFetchedTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
        }
      }
    } catch (err) {
      console.warn('Failed to fetch fresh market news:', err);
    } finally {
      setIsFetchingNews(false);
    }
  }, []);

  React.useEffect(() => {
    // Fresh news updates only: clear previous stock news and fetch fresh articles directly
    setLiveNews([]);
    fetchStockNews(stock.symbol, stock.name);
  }, [stock.symbol, stock.name, fetchStockNews]);

  const [newsFilter, setNewsFilter] = React.useState<'ALL' | 'POSITIVE' | 'NEGATIVE' | 'NEUTRAL'>('ALL');

  const filteredNews = React.useMemo(() => {
    const now = Date.now();
    // Strictly fresh current news only (< 24h, no 1-day old news)
    const freshOnly = liveNews.filter((n) => {
      const d = (n.date || '').toLowerCase();
      const title = (n.title || '').toLowerCase();
      if (
        d.includes('day') ||
        d.includes('yesterday') ||
        d.includes('week') ||
        d.includes('month') ||
        title.includes('yesterday') ||
        title.includes('1 day ago') ||
        title.includes('days ago')
      ) {
        return false;
      }
      if (n.timestamp && (now - n.timestamp) >= 24 * 60 * 60 * 1000) {
        return false;
      }
      return true;
    });
    if (newsFilter === 'ALL') return freshOnly;
    return freshOnly.filter((n) => n.sentiment === newsFilter);
  }, [liveNews, newsFilter]);

  const scoreColor =
    stock.committee.overallScore >= 75
      ? 'text-emerald-400 border-emerald-500/40 bg-emerald-950/20'
      : stock.committee.overallScore >= 60
      ? 'text-amber-400 border-amber-500/40 bg-amber-950/20'
      : 'text-rose-400 border-rose-500/40 bg-rose-950/20';

  const statusBadgeColor =
    stock.committee.status.includes('POSITIVE')
      ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
      : stock.committee.status.includes('NEUTRAL')
      ? 'bg-amber-500/10 text-amber-300 border-amber-500/30'
      : 'bg-rose-500/10 text-rose-300 border-rose-500/30';

  return (
    <div className="space-y-6">
      {/* Top Stock Hero Header */}
      <div className="p-4 sm:p-6 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl flex flex-col lg:flex-row lg:items-center justify-between gap-4 sm:gap-6">
        <div>
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <span className="text-2xl font-bold font-mono text-white">{stock.symbol}</span>
            <span className="px-2 py-0.5 rounded text-xs font-mono bg-slate-800 text-slate-300 border border-slate-700">
              {stock.exchange}
            </span>
            <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${statusBadgeColor}`}>
              {stock.committee.status}
            </span>
            <button
              onClick={() => {
                if (onOpenSectorHeatmap) {
                  onOpenSectorHeatmap();
                } else {
                  setActiveTab('macro');
                  setMacroSubView('heatmap');
                }
              }}
              className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-800/90 hover:bg-slate-700 text-cyan-300 border border-slate-700 transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
              title="Open Real-Time Industry Sector Heatmap"
            >
              <LayoutGrid className="w-3.5 h-3.5 text-cyan-400" />
              <span>Sector Heatmap</span>
            </button>
            {stock.thesisChanged && (
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-500/20 text-rose-300 border border-rose-500/40 animate-pulse flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5" />
                Thesis Change Detected
              </span>
            )}
          </div>
          <h1 className="text-base sm:text-lg text-slate-300 mt-1">{stock.name}</h1>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-400 mt-2 font-mono">
            <span>Market Cap: <strong>₹{(stock.marketCapCr / 100000).toFixed(2)} Lakh Cr</strong></span>
            <span>52W Range: <strong>{stock.fiftyTwoWeekLow} - {stock.fiftyTwoWeekHigh}</strong></span>
            <span>Avg Volume: <strong>{(stock.avgVolume / 1000000).toFixed(1)}M</strong></span>
          </div>
        </div>

        {/* Live Price & Action */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 lg:gap-6">
          <div
            className={`p-3 rounded-2xl border transition-all duration-300 text-left sm:text-right ${
              priceFlash === 'up'
                ? 'bg-emerald-950/40 border-emerald-500/80 shadow-lg shadow-emerald-950/60 scale-[1.02]'
                : priceFlash === 'down'
                ? 'bg-rose-950/40 border-rose-500/80 shadow-lg shadow-rose-950/60 scale-[1.02]'
                : 'bg-slate-950/60 border-slate-800'
            }`}
          >
            <div className="text-3xl font-bold font-mono text-white flex items-center sm:justify-end gap-2">
              <span>{stock.currency}{stock.price.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
              {priceFlash && (
                <span
                  className={`text-xs px-1.5 py-0.5 rounded font-mono font-bold animate-pulse ${
                    priceFlash === 'up' ? 'bg-emerald-500 text-black' : 'bg-rose-500 text-white'
                  }`}
                >
                  {priceFlash === 'up' ? '▲ TICK' : '▼ TICK'}
                </span>
              )}
            </div>
            <div className="flex items-center sm:justify-end gap-2 mt-1">
              <div
                className={`flex items-center gap-1 text-sm font-semibold font-mono ${
                  stock.change >= 0 ? 'text-emerald-400' : 'text-rose-400'
                }`}
              >
                {stock.change >= 0 ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                <span>{stock.change >= 0 ? '+' : ''}{stock.change.toFixed(2)} ({stock.changePercent.toFixed(2)}%)</span>
              </div>
              <span className="px-1.5 py-0.2 rounded text-[10px] font-mono bg-emerald-950/90 text-emerald-300 border border-emerald-700/80 inline-flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                LIVE FEED
              </span>
            </div>
            <div className="text-[10px] text-slate-400 font-mono mt-1 sm:text-right">
              Bid: ₹{(stock.price - 0.05).toFixed(2)} | Ask: ₹{(stock.price + 0.05).toFixed(2)} • Sprd: ₹0.10
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Search Stock Button - focuses primary search bar in Header */}
            <button
              id="header-cockpit-search-btn"
              onClick={() => {
                const headerInput = document.querySelector('header input') as HTMLInputElement | null;
                if (headerInput) {
                  headerInput.focus();
                  headerInput.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                } else if (onOpenIndianStocksModal) {
                  onOpenIndianStocksModal();
                }
              }}
              className="px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 hover:border-cyan-500/60 text-xs font-mono font-semibold flex items-center gap-1.5 transition-all"
              title="Search Any Stock Across All 2,570+ Equities"
            >
              <Search className="w-4 h-4 text-cyan-400" />
              <span>Search Stock</span>
            </button>

            {/* Price Alert Quick Trigger */}
            <button
              id="header-price-alerts-btn"
              onClick={() => {
                setAlertModalPreset({});
                setIsAlertModalOpen(true);
              }}
              className="px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 hover:border-amber-500/60 text-xs font-mono font-semibold flex items-center gap-1.5 transition-all"
              title="Set Custom Price Threshold Alert"
            >
              <Bell className="w-4 h-4 text-amber-400" />
              <span>Alerts</span>
              {activeStockAlerts.length > 0 && (
                <span className="px-1.5 py-0.2 rounded-full bg-amber-500/20 text-amber-300 text-[10px] font-bold">
                  {activeStockAlerts.length}
                </span>
              )}
            </button>

            {/* AI Assistant Trigger */}
            <button
              id="header-ai-assistant-btn"
              onClick={() => setIsAIAssistantOpen(true)}
              className="px-3.5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-950/80 to-cyan-950/80 hover:from-indigo-900 hover:to-cyan-900 text-cyan-300 border border-cyan-500/40 text-xs font-mono font-semibold flex items-center gap-1.5 transition-all shadow-sm"
              title="Open FINAGENT AI Assistant"
            >
              <Sparkles className="w-4 h-4 text-cyan-400" />
              <span>AI Copilot</span>
            </button>

            <button
              id="header-paper-trade-btn"
              onClick={onOpenPaperTrade}
              className="px-4 py-2.5 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-semibold text-xs font-mono rounded-xl shadow-lg shadow-cyan-900/30 flex items-center gap-2 transition-all"
            >
              <Zap className="w-4 h-4" />
              Paper Trade
            </button>
          </div>
        </div>
      </div>

      {/* Thesis Change Warning Banner if Active */}
      {stock.thesisChanged && stock.thesisChangeAlert && (
        <div className="p-4 rounded-xl bg-gradient-to-r from-rose-950/70 via-slate-900 to-rose-950/40 border border-rose-700/60 shadow-lg flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
          <div className="flex-1 text-sm">
            <div className="flex items-center gap-2">
              <span className="font-bold text-white font-mono">🚨 AUTONOMOUS AGENT ALERT: THESIS CHANGE DETECTED</span>
              <span className="text-xs text-rose-300 font-mono">({stock.thesisChangeAlert.timestamp})</span>
            </div>
            <div className="text-slate-300 text-xs mt-1">
              Previous Thesis: <strong className="text-slate-200">{stock.thesisChangeAlert.previousStatus}</strong> → Current: <strong className="text-amber-300">{stock.thesisChangeAlert.currentStatus}</strong>
            </div>
            <ul className="list-disc list-inside text-xs text-slate-300 mt-1.5 space-y-0.5">
              {stock.thesisChangeAlert.reasons.map((r, i) => (
                <li key={i}>{r}</li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* Flagship Investment Committee Scorecard Hero Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Score Gauge & Confidence */}
        <div className="lg:col-span-4 p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs text-slate-400 font-mono mb-3">
              <span>INVESTMENT COMMITTEE SCORE</span>
              <span>10-AGENT SYNTHESIS</span>
            </div>

            <div className="text-center py-4">
              <div className={`inline-flex flex-col items-center justify-center w-36 h-36 rounded-full border-4 ${scoreColor} shadow-inner`}>
                <span className="text-4xl font-extrabold font-mono text-white tracking-tight">
                  {stock.committee.overallScore}
                </span>
                <span className="text-xs text-slate-400 font-mono mt-0.5">/ 100</span>
              </div>

              <div className="mt-4">
                <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold border font-mono ${statusBadgeColor}`}>
                  {stock.committee.status}
                </span>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-800/80 space-y-2 text-xs font-mono">
            <div className="flex items-center justify-between text-slate-400">
              <span>Agent Confidence:</span>
              <span className="text-cyan-400 font-bold">{stock.committee.confidencePercent}%</span>
            </div>
            <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
              <div
                className="bg-gradient-to-r from-cyan-500 to-emerald-400 h-full rounded-full transition-all duration-500"
                style={{ width: `${stock.committee.confidencePercent}%` }}
              ></div>
            </div>
            <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
              <span>Evidence Corroboration:</span>
              <span className="text-emerald-400 font-semibold">4 / 4 Agents Concur</span>
            </div>
          </div>
        </div>

        {/* Center/Right: Dimensional Breakdown & Key Drivers */}
        <div className="lg:col-span-8 p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs text-slate-400 font-mono mb-4">
              <span>MULTI-AGENT EVALUATION MATRIX</span>
              <span>INDEPENDENT SUB-SCORES</span>
            </div>

            {/* Score Breakdown Bars */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-5">
              {[
                { label: 'Fundamentals', score: stock.committee.breakdown.fundamental, color: 'from-emerald-500 to-teal-400', weight: 'High' },
                { label: 'Technical Setup', score: stock.committee.breakdown.technical, color: 'from-purple-500 to-indigo-400', weight: 'Med' },
                { label: 'News Intelligence', score: stock.committee.breakdown.news, color: 'from-blue-500 to-cyan-400', weight: 'Med' },
                { label: 'Sector & Macro', score: stock.committee.breakdown.sector, color: 'from-indigo-500 to-violet-400', weight: 'High' },
                { label: 'Risk Protection', score: stock.committee.breakdown.risk, color: 'from-rose-500 to-amber-500', weight: 'Critical' },
                { label: 'Bull Conviction', score: stock.committee.breakdown.bullCase, color: 'from-emerald-400 to-cyan-400', weight: 'Catalysts' },
              ].map((item) => (
                <div key={item.label} className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80">
                  <div className="flex items-center justify-between text-xs font-mono mb-1.5">
                    <span className="text-slate-300">{item.label}</span>
                    <span className="font-bold text-white">{item.score}/100</span>
                  </div>
                  <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                    <div
                      className={`bg-gradient-to-r ${item.color} h-full rounded-full transition-all duration-500`}
                      style={{ width: `${item.score}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>

            {/* Main Reasons and Main Risks Pills */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="p-3 rounded-xl bg-emerald-950/20 border border-emerald-800/40 space-y-1.5">
                <span className="font-bold text-emerald-400 flex items-center gap-1.5 font-mono">
                  <TrendingUp className="w-3.5 h-3.5" /> Primary Bull Drivers
                </span>
                <ul className="space-y-1 text-slate-300 list-disc list-inside">
                  {stock.committee.mainReasons.map((r, idx) => (
                    <li key={idx} className="leading-tight">{r}</li>
                  ))}
                </ul>
              </div>

              <div className="p-3 rounded-xl bg-rose-950/20 border border-rose-800/40 space-y-1.5">
                <span className="font-bold text-rose-400 flex items-center gap-1.5 font-mono">
                  <AlertTriangle className="w-3.5 h-3.5" /> Critical Vulnerabilities
                </span>
                <ul className="space-y-1 text-slate-300 list-disc list-inside">
                  {stock.committee.mainRisks.map((r, idx) => (
                    <li key={idx} className="leading-tight">{r}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          <div className="pt-3 mt-3 border-t border-slate-800/80 text-[11px] text-slate-400 leading-relaxed italic">
            "{stock.committee.executiveSummary}"
          </div>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="border-b border-slate-800 overflow-x-auto scrollbar-none flex items-center gap-2 text-xs font-semibold">
        {[
          { id: 'overview', label: 'Price & Technical Chart', icon: <LineChart className="w-3.5 h-3.5" /> },
          { id: 'valuation', label: 'DCF Financial Model', icon: <Scale className="w-3.5 h-3.5 text-emerald-400" /> },
          { id: 'alerts', label: `Price Alerts (${activeStockAlerts.length})`, icon: <Bell className="w-3.5 h-3.5 text-amber-400" /> },
          { id: 'ai-copilot', label: 'AI Copilot & Assistant', icon: <Sparkles className="w-3.5 h-3.5 text-cyan-400" /> },
          { id: 'technicals', label: 'Technical Indicators', icon: <Activity className="w-3.5 h-3.5" /> },
          { id: 'fundamentals', label: 'Fundamental Audit', icon: <BookOpen className="w-3.5 h-3.5" /> },
          { id: 'news', label: `News Intelligence (${isFetchingNews ? '...' : liveNews.length})`, icon: <Newspaper className="w-3.5 h-3.5" /> },
          { id: 'macro', label: 'Sector & Macro Chain', icon: <Globe2 className="w-3.5 h-3.5" /> },
          { id: 'debate', label: 'Bull vs Bear Debate', icon: <Scale className="w-3.5 h-3.5" /> },
          { id: 'risk', label: 'Risk Manager Matrix', icon: <ShieldCheck className="w-3.5 h-3.5" /> },
          { id: 'memory', label: 'Agent Memory & Timeline', icon: <History className="w-3.5 h-3.5" /> },
          { id: 'verifier', label: 'Verifier Audit Log', icon: <CheckCircle2 className="w-3.5 h-3.5" /> },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-1.5 px-4 py-2.5 border-b-2 transition-all whitespace-nowrap ${
              activeTab === tab.id
                ? 'border-cyan-500 text-cyan-400 font-bold bg-slate-900/40'
                : 'border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-700'
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* TAB CONTENT: Price Chart & Overview */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Market Status Notification when market is closed/over */}
          {!isOrderDepthVisible && (
            <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs font-mono">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0"></span>
                <span className="text-slate-200 font-semibold">{stock.exchange || 'NSE / BSE'} Market Closed</span>
                <span className="text-slate-600 hidden sm:inline">•</span>
                <span className="text-slate-400">Regular Hours: 09:15 – 15:30 IST (Mon–Fri)</span>
              </div>
              <div className="text-slate-400 text-[11px] flex items-center gap-1.5">
                <span>Real-time order depth offline</span>
                <span className="text-slate-600">•</span>
                <span className="text-cyan-400">{marketSession.nextSessionText}</span>
              </div>
            </div>
          )}

          {/* Main Chart Section + Real-Time Order Depth (Visible ONLY during active market hours) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Chart Container: spans full 12 cols when market is closed, or 8 cols when order depth is active */}
            <div className={isOrderDepthVisible ? "lg:col-span-8 space-y-4" : "lg:col-span-12 space-y-4"}>
              <FinancialChart stock={stock} height={isOrderDepthVisible ? 420 : 480} />

              {/* Quick Alert Presets / Reference Bar */}
              <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-slate-900 border border-slate-800 rounded-xl text-xs font-mono">
                <div className="flex items-center gap-2 overflow-x-auto scrollbar-none py-0.5">
                  <span className="text-slate-400 flex items-center gap-1 shrink-0">
                    <Bell className="w-3.5 h-3.5 text-amber-400" />
                    Chart Alert Anchors:
                  </span>
                  {activeStockAlerts.length === 0 ? (
                    <span className="text-slate-500 text-[11px]">None active</span>
                  ) : (
                    activeStockAlerts.map((a) => (
                      <span
                        key={a.id}
                        className={`px-2 py-0.5 rounded text-[11px] font-bold border shrink-0 ${
                          a.condition === 'ABOVE'
                            ? 'bg-emerald-950/60 border-emerald-800 text-emerald-300'
                            : 'bg-rose-950/60 border-rose-800 text-rose-300'
                        }`}
                      >
                        {a.condition === 'ABOVE' ? '≥' : '≤'} ₹{a.targetPrice.toLocaleString()}
                      </span>
                    ))
                  )}
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    onClick={() => {
                      setAlertModalPreset({
                        targetPrice: Math.round(stock.price * 1.05),
                        condition: 'ABOVE',
                        note: 'Breakout above resistance (+5%)',
                      });
                      setIsAlertModalOpen(true);
                    }}
                    className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-[11px] transition-colors"
                  >
                    +5% Target (₹{Math.round(stock.price * 1.05)})
                  </button>
                  <button
                    onClick={() => {
                      setAlertModalPreset({
                        targetPrice: Math.round(stock.price * 0.96),
                        condition: 'BELOW',
                        note: 'Protective Stop-Loss (-4%)',
                      });
                      setIsAlertModalOpen(true);
                    }}
                    className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-rose-300 hover:text-rose-200 text-[11px] transition-colors"
                  >
                    -4% Stop (₹{Math.round(stock.price * 0.96)})
                  </button>
                  <button
                    onClick={() => {
                      setAlertModalPreset({});
                      setIsAlertModalOpen(true);
                    }}
                    className="px-2.5 py-1 rounded bg-cyan-950 border border-cyan-800 text-cyan-300 text-[11px] font-bold hover:bg-cyan-900 transition-colors flex items-center gap-1"
                  >
                    <Plus className="w-3 h-3" />
                    Custom Alert
                  </button>
                </div>
              </div>
            </div>

            {/* Right 4-cols: Real-Time Order Depth Level 2 Simulation (ONLY shown when market is open) */}
            {isOrderDepthVisible && (
              <div className="lg:col-span-4">
                <DynamicOrderDepth
                  currentPrice={stock.price}
                  symbol={stock.symbol}
                  currency={stock.currency}
                  isLiveActive={true}
                />
              </div>
            )}
          </div>

          {/* Quick Indicator Callout Cards */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div
              className="p-4 rounded-xl bg-slate-900 border border-slate-800"
            >
              <span className="text-xs text-slate-400 font-mono flex items-center justify-between">
                <span>52-Week Range</span>
                <TrendingUp className="w-3 h-3 text-cyan-400" />
              </span>
              <div className="text-base font-bold font-mono text-cyan-400 mt-1 truncate">
                {stock.currency}{stock.fiftyTwoWeekLow} - {stock.currency}{stock.fiftyTwoWeekHigh}
              </div>
              <span className="text-[11px] font-semibold mt-0.5 block text-slate-400 font-mono">
                Day: {stock.currency}{stock.dayLow} - {stock.currency}{stock.dayHigh}
              </span>
            </div>

            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
              <span className="text-xs text-slate-400 font-mono">RSI (14-Day)</span>
              <div className="text-xl font-bold font-mono text-white mt-1">{stock.technicals.rsi}</div>
              <span className="text-[11px] font-semibold text-emerald-400 mt-0.5 block">{stock.technicals.rsiStatus}</span>
            </div>

            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
              <span className="text-xs text-slate-400 font-mono">MACD Signal</span>
              <div className="text-xl font-bold font-mono text-cyan-400 mt-1">{stock.technicals.macd.signal}</div>
              <span className="text-[11px] text-slate-400 font-mono mt-0.5 block">Hist: {stock.technicals.macd.histogram}</span>
            </div>

            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
              <span className="text-xs text-slate-400 font-mono">Trailing P/E</span>
              <div className="text-xl font-bold font-mono text-white mt-1">{stock.fundamentals.peRatio}x</div>
              <span className="text-[11px] text-slate-400 font-mono mt-0.5 block">Ind: {stock.fundamentals.industryPE}x</span>
            </div>

            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
              <span className="text-xs text-slate-400 font-mono">ROCE</span>
              <div className="text-xl font-bold font-mono text-emerald-400 mt-1">{stock.fundamentals.roce}%</div>
              <span className="text-[11px] text-slate-400 font-mono mt-0.5 block">ROE: {stock.fundamentals.roe}%</span>
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT: DCF Financial Model & Valuation Engine */}
      {activeTab === 'valuation' && (
        <div className="space-y-6">
          <DynamicValuationModel stock={stock} />
        </div>
      )}

      {/* TAB CONTENT: Technical Analyst Details */}
      {activeTab === 'technicals' && (
        <div className="space-y-6">
          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-white font-mono">
                  Agent 3 — Quantitative Technical Analysis
                </h3>
                <p className="text-xs text-slate-400">
                  Separation of concerns: Quantitative indicators calculated programmatically; AI Agent interprets signals.
                </p>
              </div>
              <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-purple-950 text-purple-300 border border-purple-800">
                Score: {stock.committee.breakdown.technical}/100
              </span>
            </div>

            {/* AI Agent Interpretation Callout */}
            <div className="p-4 rounded-xl bg-purple-950/20 border border-purple-800/40 text-sm text-slate-200 leading-relaxed font-mono">
              <div className="flex items-center gap-2 text-purple-300 font-bold text-xs mb-1">
                <Sparkles className="w-3.5 h-3.5" /> TECHNICAL AGENT NARRATIVE:
              </div>
              {stock.technicals.interpretation}
            </div>

            {/* Comprehensive Technical Indicator Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 text-xs font-mono">
              <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800">
                <span className="text-slate-400">SMA 20 (Short-Term)</span>
                <div className="text-base font-bold text-white mt-1">{stock.currency}{stock.technicals.sma20}</div>
                <span className={`text-[11px] ${stock.price >= stock.technicals.sma20 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {stock.price >= stock.technicals.sma20 ? 'Above SMA 20' : 'Below SMA 20'}
                </span>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800">
                <span className="text-slate-400">SMA 50 (Medium-Term)</span>
                <div className="text-base font-bold text-white mt-1">{stock.currency}{stock.technicals.sma50}</div>
                <span className={`text-[11px] ${stock.price >= stock.technicals.sma50 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {stock.price >= stock.technicals.sma50 ? 'Above SMA 50' : 'Below SMA 50'}
                </span>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800">
                <span className="text-slate-400">SMA 200 (Long-Term)</span>
                <div className="text-base font-bold text-white mt-1">{stock.currency}{stock.technicals.sma200}</div>
                <span className="text-[11px] text-emerald-400 font-semibold">Bull Trend Baseline</span>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800">
                <span className="text-slate-400">EMA 21 (Exponential)</span>
                <div className="text-base font-bold text-white mt-1">{stock.currency}{stock.technicals.ema21}</div>
                <span className="text-[11px] text-slate-400">Trend Guide</span>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800">
                <span className="text-slate-400">Bollinger Upper Band</span>
                <div className="text-base font-bold text-white mt-1">{stock.currency}{stock.technicals.bollingerBands.upper}</div>
                <span className="text-[11px] text-slate-400">Bandwidth: {stock.technicals.bollingerBands.bandwidth}%</span>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800">
                <span className="text-slate-400">Bollinger Lower Band</span>
                <div className="text-base font-bold text-white mt-1">{stock.currency}{stock.technicals.bollingerBands.lower}</div>
                <span className="text-[11px] text-slate-400">Support Envelope</span>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800">
                <span className="text-slate-400">ATR (14-Day Volatility)</span>
                <div className="text-base font-bold text-white mt-1">{stock.currency}{stock.technicals.atr14}</div>
                <span className="text-[11px] text-slate-400">Average True Range</span>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800">
                <span className="text-slate-400">Support / Resistance</span>
                <div className="text-sm font-bold text-white mt-1">
                  S: {stock.currency}{stock.technicals.supportLevel} | R: {stock.currency}{stock.technicals.resistanceLevel}
                </div>
                <span className="text-[11px] text-cyan-400">Key Pivot Zone</span>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800">
                <span className="text-slate-400">Volume Trend</span>
                <div className="text-base font-bold text-emerald-400 mt-1">{stock.technicals.volumeTrend}</div>
                <span className="text-[11px] text-slate-400">Vol Ratio: {(stock.volume / stock.avgVolume).toFixed(2)}x</span>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800">
                <span className="text-slate-400">30-Day Volatility</span>
                <div className="text-base font-bold text-white mt-1">{stock.technicals.volatility30d}%</div>
                <span className="text-[11px] text-slate-400">Annualized</span>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800">
                <span className="text-slate-400">1-Year Max Drawdown</span>
                <div className="text-base font-bold text-rose-400 mt-1">-{stock.technicals.maxDrawdown1y}%</div>
                <span className="text-[11px] text-slate-400">Peak-to-Trough</span>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800">
                <span className="text-slate-400">Momentum Score</span>
                <div className="text-base font-bold text-cyan-400 mt-1">{stock.technicals.momentumScore} / 100</div>
                <span className="text-[11px] text-slate-400">Multi-factor Blend</span>
              </div>
            </div>

            {/* TradingView Advanced Technicals Chart Embed */}
            <div className="pt-4 border-t border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <BarChart2 className="w-4 h-4 text-purple-400" />
                  <h4 className="text-sm font-bold text-white font-mono">
                    TradingView Interactive Technical Chart ({stock.symbol})
                  </h4>
                </div>
                <span className="text-[11px] font-mono text-purple-300 bg-purple-950/60 px-2.5 py-0.5 rounded border border-purple-800/60">
                  Full Technical Workspace
                </span>
              </div>
              <p className="text-xs text-slate-400 font-mono">
                Explore real-time candlestick intervals, Fibonacci retracements, multi-indicator overlays, and cross-hair measurement tools directly on {stock.symbol}.
              </p>
              <div className="w-full">
                <ErrorBoundary fallbackTitle="TradingView Technical Chart">
                  <TradingViewChart symbol={stock.symbol} height={460} theme="dark" />
                </ErrorBoundary>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT: Fundamental Analyst Details */}
      {activeTab === 'fundamentals' && (
        <div className="space-y-6">
          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-white font-mono">
                  Agent 4 — Fundamental & Financial Statement Audit
                </h3>
                <p className="text-xs text-slate-400">
                  Multi-year CAGR metrics, operational margins, capital efficiency, and debt audit.
                </p>
              </div>
              <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-emerald-950 text-emerald-300 border border-emerald-800">
                Score: {stock.committee.breakdown.fundamental}/100
              </span>
            </div>

            {/* AI Agent Interpretation Callout */}
            <div className="p-4 rounded-xl bg-emerald-950/20 border border-emerald-800/40 text-sm text-slate-200 leading-relaxed font-mono">
              <div className="flex items-center gap-2 text-emerald-300 font-bold text-xs mb-1">
                <Sparkles className="w-3.5 h-3.5" /> FUNDAMENTAL AGENT SYNTHESIS:
              </div>
              {stock.fundamentals.interpretation}
            </div>

            {/* Multi-Year Financials Statement Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400">
                    <th className="py-2.5 px-3">Metric ({stock.currency} Cr)</th>
                    {stock.fundamentals.annualMetrics.map((m) => (
                      <th key={m.year} className="py-2.5 px-3 text-right">{m.year}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-slate-300">
                  <tr>
                    <td className="py-2.5 px-3 font-semibold text-white">Revenue from Operations</td>
                    {stock.fundamentals.annualMetrics.map((m) => (
                      <td key={m.year} className="py-2.5 px-3 text-right font-mono">{m.revenue.toLocaleString()}</td>
                    ))}
                  </tr>
                  <tr>
                    <td className="py-2.5 px-3">Operating EBITDA</td>
                    {stock.fundamentals.annualMetrics.map((m) => (
                      <td key={m.year} className="py-2.5 px-3 text-right font-mono">{m.ebitda.toLocaleString()}</td>
                    ))}
                  </tr>
                  <tr>
                    <td className="py-2.5 px-3">Operating Margin (%)</td>
                    {stock.fundamentals.annualMetrics.map((m) => (
                      <td key={m.year} className="py-2.5 px-3 text-right font-mono text-cyan-400">{m.operatingMargin}%</td>
                    ))}
                  </tr>
                  <tr>
                    <td className="py-2.5 px-3 font-semibold text-white">Net Profit (PAT)</td>
                    {stock.fundamentals.annualMetrics.map((m) => (
                      <td key={m.year} className="py-2.5 px-3 text-right font-mono font-bold text-emerald-400">{m.netProfit.toLocaleString()}</td>
                    ))}
                  </tr>
                  <tr>
                    <td className="py-2.5 px-3">Earnings Per Share (EPS)</td>
                    {stock.fundamentals.annualMetrics.map((m) => (
                      <td key={m.year} className="py-2.5 px-3 text-right font-mono">{stock.currency}{m.eps}</td>
                    ))}
                  </tr>
                  <tr>
                    <td className="py-2.5 px-3">Free Cash Flow (FCF)</td>
                    {stock.fundamentals.annualMetrics.map((m) => (
                      <td key={m.year} className="py-2.5 px-3 text-right font-mono text-teal-300">{m.freeCashFlow.toLocaleString()}</td>
                    ))}
                  </tr>
                  <tr>
                    <td className="py-2.5 px-3">Debt to Equity Ratio</td>
                    {stock.fundamentals.annualMetrics.map((m) => (
                      <td key={m.year} className="py-2.5 px-3 text-right font-mono">{m.debtToEquity}x</td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Fundamental Valuation Multiple Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
              <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 text-xs font-mono">
                <span className="text-slate-400">3-Yr Revenue CAGR</span>
                <div className="text-base font-bold text-emerald-400 mt-1">+{stock.fundamentals.cagr3yRevenue}%</div>
              </div>
              <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 text-xs font-mono">
                <span className="text-slate-400">3-Yr Profit CAGR</span>
                <div className="text-base font-bold text-emerald-400 mt-1">+{stock.fundamentals.cagr3yProfit}%</div>
              </div>
              <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 text-xs font-mono">
                <span className="text-slate-400">Free Cash Flow Quality</span>
                <div className="text-base font-bold text-cyan-400 mt-1">{stock.fundamentals.freeCashFlowQuality}</div>
              </div>
              <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 text-xs font-mono">
                <span className="text-slate-400">Debt Trajectory</span>
                <div className="text-base font-bold text-white mt-1">{stock.fundamentals.debtTrend}</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT: News Intelligence */}
      {activeTab === 'news' && (
        <div className="space-y-6">
          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-3 border-b border-slate-800">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-base font-bold text-white font-mono flex items-center gap-2">
                    <Newspaper className="w-4 h-4 text-cyan-400" />
                    Agent 5 — Current Market News Wire
                  </h3>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-cyan-950 text-cyan-300 border border-cyan-800 inline-flex items-center gap-1">
                    <Zap className="w-3 h-3 text-cyan-400" />
                    Fresh Market News (Live / Today)
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  Continuously queries accredited financial media (Economic Times, LiveMint, Reuters, CNBC-TV18, Business Standard) for verified, real-time current market catalysts for {stock.symbol}. Stale 1-day+ articles are automatically excluded.
                </p>
              </div>

              {/* Action Buttons: Live Fetch & Horizon Status */}
              <div className="flex flex-wrap items-center gap-2">
                <div className="text-[11px] font-mono text-slate-400 hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                  <span>Wire: {newsFetchedTime}</span>
                </div>

                <button
                  onClick={() => fetchStockNews(stock.symbol, stock.name)}
                  disabled={isFetchingNews}
                  className="px-3.5 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 disabled:bg-slate-800 text-white text-xs font-mono font-bold flex items-center gap-1.5 transition-all shadow-md active:scale-95"
                  title="Fetch fresh market news from live RSS feeds"
                >
                  <RotateCw className={`w-3.5 h-3.5 ${isFetchingNews ? 'animate-spin' : ''}`} />
                  {isFetchingNews ? 'Fetching Fresh News...' : 'Fetch Fresh News'}
                </button>
              </div>
            </div>

            {/* Sub-header: Filters & Counter */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-1">
              <div className="flex items-center gap-1.5 text-xs font-mono">
                <span className="text-slate-500 text-[11px] mr-1 hidden sm:inline">Filter:</span>
                {(['ALL', 'POSITIVE', 'NEGATIVE', 'NEUTRAL'] as const).map((fil) => {
                  const count =
                    fil === 'ALL'
                      ? liveNews.length
                      : liveNews.filter((n) => n.sentiment === fil).length;
                  return (
                    <button
                      key={fil}
                      onClick={() => setNewsFilter(fil)}
                      className={`px-3 py-1 rounded-lg transition-all flex items-center gap-1.5 ${
                        newsFilter === fil
                          ? 'bg-cyan-600 text-white font-bold shadow-sm'
                          : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                      }`}
                    >
                      <span>{fil === 'ALL' ? 'Fresh Releases' : fil}</span>
                      <span className={`px-1.5 py-0.2 rounded text-[10px] ${newsFilter === fil ? 'bg-cyan-800/80 text-white' : 'bg-slate-800 text-slate-400'}`}>
                        {isFetchingNews ? '...' : count}
                      </span>
                    </button>
                  );
                })}
              </div>

              <div className="text-[11px] font-mono text-slate-400 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-cyan-400" />
                <span>Strict Fresh News Horizon (Today / &lt; 24h • 1-Day News Filtered Out)</span>
              </div>
            </div>

            {/* News Articles Cards */}
            <div className="space-y-3 pt-2">
              {isFetchingNews && liveNews.length === 0 ? (
                <div className="p-8 rounded-xl bg-slate-950/60 border border-slate-800/80 text-center space-y-3">
                  <div className="flex justify-center">
                    <RotateCw className="w-6 h-6 text-cyan-400 animate-spin" />
                  </div>
                  <p className="text-sm text-slate-200 font-mono font-bold">
                    Fetching current fresh market news for {stock.symbol} ({stock.name})...
                  </p>
                  <p className="text-xs text-slate-400 max-w-md mx-auto">
                    Connecting to live financial RSS wires and filtering strictly for releases published within today / past 24 hours (1-day news removed).
                  </p>
                </div>
              ) : filteredNews.length === 0 ? (
                <div className="p-8 rounded-xl bg-slate-950/60 border border-slate-800/80 text-center space-y-2">
                  <p className="text-sm text-slate-300 font-mono">
                    No fresh news updates found in the past 24 hours matching "{newsFilter}". (1-day and older news filtered out).
                  </p>
                  <p className="text-xs text-slate-500">
                    Click "Fetch Fresh News" above to re-query live financial feeds for {stock.symbol}.
                  </p>
                </div>
              ) : (
                filteredNews.map((art) => (
                  <div
                    key={art.id}
                    className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 hover:border-slate-700 transition-all space-y-2.5 group"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono ${
                            art.sentiment === 'POSITIVE'
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                              : art.sentiment === 'NEGATIVE'
                              ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                              : 'bg-slate-800 text-slate-300 border border-slate-700'
                          }`}
                        >
                          {art.sentiment}
                        </span>
                        <span className="text-xs font-semibold text-cyan-400 font-mono">[{art.event}]</span>
                      </div>

                      <div className="flex items-center gap-3 text-xs text-slate-400 font-mono">
                        <span className="text-slate-300">
                          Source: <strong className="text-white">{art.source}</strong>
                        </span>
                        <span>•</span>
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-cyan-950/60 border border-cyan-800/60 text-cyan-300 text-[11px] font-bold">
                          <Clock className="w-3 h-3 text-cyan-400" />
                          {art.date}
                        </span>
                      </div>
                    </div>

                    <div>
                      {art.url ? (
                        <a
                          href={art.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm font-semibold text-white leading-snug hover:text-cyan-300 transition-colors inline-flex items-center gap-1.5"
                          title="Open original news article in new tab"
                        >
                          <span>{art.title}</span>
                          <ExternalLink className="w-3.5 h-3.5 opacity-60 group-hover:opacity-100 shrink-0 text-cyan-400" />
                        </a>
                      ) : (
                        <h4 className="text-sm font-semibold text-white leading-snug hover:text-cyan-300 transition-colors">
                          {art.title}
                        </h4>
                      )}
                    </div>

                    <p className="text-xs text-slate-400 leading-relaxed">{art.summary}</p>

                    <div className="flex flex-wrap items-center justify-between pt-2 border-t border-slate-800/80 text-[11px] font-mono text-slate-400 gap-2">
                      <div className="flex items-center gap-2">
                        <span>Impact: <strong className="text-white">{art.impact}</strong></span>
                        <span>•</span>
                        <span>AI Confidence: <strong className="text-cyan-400">{(art.confidence * 100).toFixed(0)}%</strong></span>
                      </div>

                      <div className="flex flex-wrap items-center gap-1">
                        {art.tags.map((t: string) => (
                          <span key={t} className="px-1.5 py-0.5 rounded bg-slate-800 text-[10px] text-slate-300">
                            #{t}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT: Sector & Macro Chain */}
      {activeTab === 'macro' && (
        <div className="space-y-6">
          {/* Sub-view switcher between Macro Transmission Chain & Real-Time Sector Heatmap */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-2 rounded-xl bg-slate-900 border border-slate-800">
            <div className="flex items-center gap-1">
              <button
                onClick={() => setMacroSubView('chain')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  macroSubView === 'chain'
                    ? 'bg-slate-800 text-cyan-300 font-semibold shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Macro Transmission Chain
              </button>
              <button
                onClick={() => setMacroSubView('heatmap')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  macroSubView === 'heatmap'
                    ? 'bg-slate-800 text-cyan-300 font-semibold shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <LayoutGrid className="w-3.5 h-3.5 text-cyan-400" />
                <span>Sector Heatmap</span>
              </button>
            </div>

            {onOpenSectorHeatmap && (
              <button
                onClick={onOpenSectorHeatmap}
                className="hidden sm:flex items-center gap-1 text-xs text-cyan-400 hover:text-cyan-300 font-mono transition-colors"
              >
                <span>Full-Screen Heatmap</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {macroSubView === 'heatmap' && stocks ? (
            <SectorHeatmap
              stocks={stocks}
              onSelectStock={handleSelectStock}
              selectedSymbol={stock.symbol}
            />
          ) : (
            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-5">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-white font-mono">
                    Agent 6 — Sector & Macro Transmission Engine
                  </h3>
                  <p className="text-xs text-slate-400">
                    Analyzes external sensitivities: Sector growth, interest rates, commodity prices, and currency impacts.
                  </p>
                </div>
                <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-indigo-950 text-indigo-300 border border-indigo-800">
                  Environment: {stock.sectorMacro.environmentVerdict}
                </span>
              </div>

              {/* Visual Transmission Chain Diagram */}
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
                <div className="text-xs font-mono text-slate-400 mb-3">EXTERNAL SENSITIVITY TRANSMISSION PIPELINE:</div>
                <div className="flex flex-wrap items-center justify-center gap-2 text-xs font-mono font-semibold">
                  <span className="px-3 py-1.5 rounded-lg bg-cyan-950 text-cyan-300 border border-cyan-800">
                    {stock.symbol}
                  </span>
                  <span className="text-slate-600">➔</span>
                  <span className="px-3 py-1.5 rounded-lg bg-indigo-950 text-indigo-300 border border-indigo-800">
                    {stock.sectorMacro.sectorName}
                  </span>
                  <span className="text-slate-600">➔</span>
                  <span className="px-3 py-1.5 rounded-lg bg-blue-950 text-blue-300 border border-blue-800">
                    Macro Factors (Rates & Forex)
                  </span>
                  <span className="text-slate-600">➔</span>
                  <span className="px-3 py-1.5 rounded-lg bg-emerald-950 text-emerald-300 border border-emerald-800">
                    Final Net Impact: {stock.sectorMacro.environmentVerdict}
                  </span>
                </div>
              </div>

              {/* Macro Factors Table */}
              <div className="space-y-3">
                <h4 className="text-xs font-mono text-slate-400">KEY TRANSMISSION VARIABLES:</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {stock.sectorMacro.macroFactors.map((mf, i) => (
                    <div key={i} className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1 text-xs">
                      <div className="flex items-center justify-between font-mono">
                        <span className="font-bold text-white">{mf.factor}</span>
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                            mf.impactOnStock === 'Beneficial'
                              ? 'bg-emerald-500/20 text-emerald-300'
                              : mf.impactOnStock === 'Adverse'
                              ? 'bg-rose-500/20 text-rose-300'
                              : 'bg-slate-700 text-slate-300'
                          }`}
                        >
                          {mf.impactOnStock}
                        </span>
                      </div>
                      <div className="text-slate-400 font-mono text-[11px]">Trend: {mf.trend}</div>
                      <p className="text-slate-300 mt-1 leading-relaxed">{mf.detail}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Moat & Regulatory Outlook */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
                <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1">
                  <span className="text-slate-400">Competitive Moat:</span>
                  <p className="text-slate-200 leading-relaxed font-sans">{stock.sectorMacro.competitiveMoat}</p>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1">
                  <span className="text-slate-400">Regulatory Outlook:</span>
                  <p className="text-slate-200 leading-relaxed font-sans">{stock.sectorMacro.regulatoryOutlook}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB CONTENT: Bull vs Bear Debate Chamber */}
      {activeTab === 'debate' && (
        <div className="space-y-6">
          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-white font-mono flex items-center gap-2">
                  <Scale className="w-5 h-5 text-amber-400" />
                  Agents 8 & 9 — Adversarial Bull vs Bear Debate Chamber
                </h3>
                <p className="text-xs text-slate-400">
                  Two strictly independent agents challenge each other's assumptions and cite evidence.
                </p>
              </div>
              <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-amber-950 text-amber-300 border border-amber-800">
                Debate Active
              </span>
            </div>

            {/* Side by side comparison */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Bull Agent Column */}
              <div className="p-5 rounded-xl bg-emerald-950/20 border border-emerald-700/40 space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-emerald-800/40">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-emerald-400" />
                    <span className="text-base font-bold text-emerald-400 font-mono">Agent 8 — Bull Case</span>
                  </div>
                  <span className="text-xs font-mono font-bold text-emerald-300 bg-emerald-950 px-2 py-0.5 rounded border border-emerald-700">
                    Confidence: {stock.bullCase.confidenceScore}%
                  </span>
                </div>

                <div>
                  <h4 className="text-sm font-bold text-white leading-snug">{stock.bullCase.headline}</h4>
                  <div className="mt-2 text-xs font-mono text-emerald-400 font-semibold">
                    Target Upside: {stock.bullCase.targetUpside}
                  </div>
                </div>

                <div className="space-y-3">
                  <span className="text-xs font-mono text-slate-400">PRIMARY GROWTH CATALYSTS:</span>
                  {stock.bullCase.catalysts.map((cat, idx) => (
                    <div key={idx} className="p-3 rounded-lg bg-slate-950/60 border border-emerald-900/40 space-y-1 text-xs">
                      <div className="flex items-center justify-between font-mono">
                        <strong className="text-white">{cat.title}</strong>
                        <span className="text-emerald-400 text-[10px] font-semibold">{cat.timeframe}</span>
                      </div>
                      <p className="text-slate-300 text-[11px] leading-relaxed">Evidence: {cat.evidence}</p>
                    </div>
                  ))}
                </div>

                <div className="pt-2 border-t border-emerald-900/40 text-xs space-y-1">
                  <span className="text-slate-400 font-mono">What the Market Underestimates:</span>
                  <ul className="list-disc list-inside text-slate-300 space-y-0.5 text-[11px]">
                    {stock.bullCase.marketUnderestimates.map((mu, i) => (
                      <li key={i}>{mu}</li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Bear Agent Column */}
              <div className="p-5 rounded-xl bg-red-950/20 border border-red-700/40 space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-red-800/40">
                  <div className="flex items-center gap-2">
                    <TrendingDown className="w-5 h-5 text-red-400" />
                    <span className="text-base font-bold text-red-400 font-mono">Agent 9 — Bear Case</span>
                  </div>
                  <span className="text-xs font-mono font-bold text-red-300 bg-red-950 px-2 py-0.5 rounded border border-red-700">
                    Confidence: {stock.bearCase.confidenceScore}%
                  </span>
                </div>

                <div>
                  <h4 className="text-sm font-bold text-white leading-snug">{stock.bearCase.headline}</h4>
                  <div className="mt-2 text-xs font-mono text-red-400 font-semibold">
                    Downside Risk Estimate: {stock.bearCase.downsideRiskEstimate}
                  </div>
                </div>

                <div className="space-y-3">
                  <span className="text-xs font-mono text-slate-400">CRITICAL VULNERABILITIES:</span>
                  {stock.bearCase.vulnerabilities.map((vul, idx) => (
                    <div key={idx} className="p-3 rounded-lg bg-slate-950/60 border border-red-900/40 space-y-1 text-xs">
                      <div className="flex items-center justify-between font-mono">
                        <strong className="text-white">{vul.title}</strong>
                        <span className="text-red-400 text-[10px] font-semibold">{vul.threat}</span>
                      </div>
                      <p className="text-slate-300 text-[11px] leading-relaxed">Evidence: {vul.evidence}</p>
                    </div>
                  ))}
                </div>

                <div className="pt-2 border-t border-red-900/40 text-xs space-y-1">
                  <span className="text-slate-400 font-mono">Worst-Case Tail Risks:</span>
                  <ul className="list-disc list-inside text-slate-300 space-y-0.5 text-[11px]">
                    {stock.bearCase.worstCaseScenarios.map((wc, i) => (
                      <li key={i}>{wc}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT: Risk Manager Matrix */}
      {activeTab === 'risk' && (
        <div className="space-y-6">
          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-white font-mono">
                  Agent 7 — Independent Risk Manager Matrix
                </h3>
                <p className="text-xs text-slate-400">
                  Strictly independent stress-tester answering: "What can go wrong?"
                </p>
              </div>
              <div className="text-right">
                <span className="text-lg font-bold font-mono text-rose-400">
                  {stock.risk.overallRiskScore} / 10
                </span>
                <span className="text-xs text-slate-400 block font-mono">Level: {stock.risk.riskLevel}</span>
              </div>
            </div>

            {/* Risk Factor Bars */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              {[
                { label: 'Business', val: stock.risk.businessRisk },
                { label: 'Financial', val: stock.risk.financialRisk },
                { label: 'Valuation', val: stock.risk.valuationRisk },
                { label: 'Regulatory', val: stock.risk.regulatoryRisk },
                { label: 'Market Beta', val: stock.risk.marketRisk },
                { label: 'Liquidity', val: stock.risk.liquidityRisk },
              ].map((rf) => (
                <div key={rf.label} className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 text-xs font-mono">
                  <span className="text-slate-400">{rf.label}</span>
                  <div className="text-base font-bold text-white mt-1">{rf.val} / 10</div>
                  <div className="w-full bg-slate-800 rounded-full h-1 mt-1.5 overflow-hidden">
                    <div
                      className={`h-full rounded-full ${rf.val >= 7 ? 'bg-rose-500' : rf.val >= 5 ? 'bg-amber-500' : 'bg-emerald-400'}`}
                      style={{ width: `${rf.val * 10}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>

            {/* Major Risks & Mitigations Table */}
            <div className="space-y-3">
              <span className="text-xs font-mono text-slate-400">MAJOR RISKS & DEFENSIVE MITIGATIONS:</span>
              <div className="space-y-2">
                {stock.risk.majorRisks.map((mr, idx) => (
                  <div key={idx} className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 space-y-1.5 text-xs">
                    <div className="flex items-center justify-between font-mono">
                      <strong className="text-white font-semibold">{mr.title}</strong>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${mr.severity === 'High' ? 'bg-rose-950 text-rose-300' : 'bg-amber-950 text-amber-300'}`}>
                        {mr.severity} Severity
                      </span>
                    </div>
                    <p className="text-slate-300">{mr.description}</p>
                    <div className="text-[11px] text-emerald-400 font-mono">
                      <strong>Mitigating Factor:</strong> {mr.mitigation}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Stress Test Scenarios */}
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3 text-xs font-mono">
              <span className="text-slate-400">MACRO STRESS TEST SCENARIO SIMULATION:</span>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {stock.risk.stressTestScenarios.map((st, i) => (
                  <div key={i} className="p-3 rounded-lg bg-slate-900 border border-slate-800/80 space-y-1">
                    <div className="text-white font-semibold truncate">{st.scenario}</div>
                    <div className="text-rose-400 font-bold">Drawdown: {st.projectedDrawdown}</div>
                    <div className="text-slate-500 text-[10px]">Probability: {st.probability}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT: Agent Memory & Historical Timeline */}
      {activeTab === 'memory' && (
        <div className="space-y-6">
          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-5">
            <div>
              <h3 className="text-base font-bold text-white font-mono flex items-center gap-2">
                <History className="w-5 h-5 text-cyan-400" />
                Agent Memory: Investment Thesis Evolution Timeline
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Detects: "Did the thesis change, why did it change, and what evidence caused the change?"
              </p>
            </div>

            {/* Timeline Cards */}
            <div className="relative border-l-2 border-slate-800 ml-4 pl-6 space-y-6">
              {stock.thesisHistory.map((hist, idx) => (
                <div key={idx} className="relative group">
                  {/* Timeline dot */}
                  <div className={`absolute -left-[31px] top-1.5 w-4 h-4 rounded-full border-2 ${idx === stock.thesisHistory.length - 1 ? 'bg-cyan-500 border-cyan-300' : 'bg-slate-800 border-slate-600'}`}></div>

                  <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="text-sm font-bold text-white font-mono">{hist.period}</span>
                      <span className="px-2 py-0.5 rounded text-xs font-mono font-semibold bg-cyan-950 text-cyan-300 border border-cyan-800">
                        Score: {hist.overallScore}/100
                      </span>
                    </div>

                    <div className="flex items-center gap-4 text-xs font-mono text-slate-400">
                      <span>Fund: <strong className="text-white">{hist.fundamentalScore}</strong></span>
                      <span>Tech: <strong className="text-white">{hist.technicalScore}</strong></span>
                      <span>Risk: <strong className="text-white">{hist.riskScore}</strong></span>
                      <span>Verdict: <strong className="text-emerald-400">{hist.verdict}</strong></span>
                    </div>

                    <p className="text-xs text-slate-300 font-mono pt-1 border-t border-slate-800/80">
                      Primary Thesis Catalyst: {hist.keyDriver}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT: Verifier Agent Audit Log */}
      {activeTab === 'verifier' && (
        <div className="space-y-6">
          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-white font-mono flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-teal-400" />
                  Agent 11 — Verifier Agent Audit Certification
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Pre-publication audit: Calculation validation, SEC/NSE filing trace, and hallucination rejection gate.
                </p>
              </div>
              <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-teal-950 text-teal-300 border border-teal-800">
                AUDIT PASSED ({stock.verifier.score}/100)
              </span>
            </div>

            {/* Audit Checks Checklist */}
            <div className="space-y-2.5">
              {stock.verifier.checks.map((chk, i) => (
                <div key={i} className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-teal-950 border border-teal-600 flex items-center justify-center shrink-0 mt-0.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-teal-400" />
                  </div>
                  <div className="flex-1 text-xs">
                    <div className="flex items-center justify-between">
                      <strong className="text-white font-mono">{chk.checkName}</strong>
                      <span className="text-[10px] font-mono text-teal-400 font-semibold uppercase">VERIFIED</span>
                    </div>
                    <p className="text-slate-400 mt-1">{chk.evidence}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Verification Metadata Footer */}
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex flex-wrap items-center justify-between gap-4 text-xs font-mono text-slate-400">
              <div>
                <span>Calculation Integrity: </span>
                <strong className="text-teal-400">{stock.verifier.calculationIntegrity}</strong>
              </div>
              <div>
                <span>Hallucination Scan: </span>
                <strong className="text-teal-400">{stock.verifier.hallucinationRisk}</strong>
              </div>
              <div>
                <span>Audit Timestamp: </span>
                <strong className="text-slate-300">{stock.verifier.auditTimestamp}</strong>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT: Price Alerts Control Center */}
      {activeTab === 'alerts' && (
        <div className="space-y-6">
          {/* Header & Quick Create Card */}
          <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-bold text-white font-mono flex items-center gap-2">
                    <Bell className="w-5 h-5 text-amber-400" />
                    PRICE THRESHOLD ALERTS & NOTIFICATION ENGINE
                  </h2>
                  <span className="px-2 py-0.5 rounded text-xs font-mono bg-cyan-950 text-cyan-300 border border-cyan-800">
                    {stock.symbol}
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  Configure custom price targets (breakout triggers, resistance barriers, and defensive stop-losses). Receive real-time terminal audio chimes and interactive notification toasts.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setAlertModalPreset({});
                    setIsAlertModalOpen(true);
                  }}
                  className="px-4 py-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-mono font-bold text-xs rounded-xl shadow-lg flex items-center gap-2 transition-all"
                >
                  <Plus className="w-4 h-4" />
                  Create New Threshold Alert
                </button>
                <button
                  onClick={() => setIsAIAssistantOpen(true)}
                  className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-slate-700 rounded-xl text-xs font-mono font-semibold flex items-center gap-1.5 transition-all"
                >
                  <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                  Ask AI for Advice
                </button>
              </div>
            </div>

            {/* Current Price vs Alerts Distance Matrix */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 font-mono">
                <span className="text-xs text-slate-400">Current Market Price</span>
                <div className="text-xl font-bold text-white mt-1">
                  {stock.currency}{stock.price.toLocaleString()}
                </div>
                <span className={`text-xs font-semibold ${stock.change >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {stock.change >= 0 ? '+' : ''}{stock.changePercent.toFixed(2)}% Today
                </span>
              </div>

              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 font-mono">
                <span className="text-xs text-slate-400">Active Stock Alerts</span>
                <div className="text-xl font-bold text-cyan-400 mt-1">
                  {activeStockAlerts.length} Active
                </div>
                <span className="text-xs text-slate-400">
                  {triggeredStockAlerts.length} Triggered in history
                </span>
              </div>

              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 font-mono">
                <span className="text-xs text-slate-400">Audio Chime & Notifications</span>
                <div className="text-xl font-bold text-emerald-400 mt-1 flex items-center gap-2">
                  <Volume2 className="w-5 h-5 text-emerald-400" />
                  ONLINE
                </div>
                <span className="text-xs text-slate-400">Web Audio synthesis active</span>
              </div>
            </div>
          </div>

          {/* Active Alerts List */}
          <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
            <h3 className="text-sm font-bold text-white font-mono flex items-center gap-2">
              <Bell className="w-4 h-4 text-cyan-400" />
              Active Price Thresholds ({activeStockAlerts.length})
            </h3>

            {activeStockAlerts.length === 0 ? (
              <div className="text-center py-10 px-4 rounded-xl border border-dashed border-slate-800 text-slate-400">
                <Bell className="w-8 h-8 mx-auto text-slate-600 mb-2" />
                <p className="text-xs">No active price alerts set for {stock.symbol}.</p>
                <button
                  onClick={() => {
                    setAlertModalPreset({});
                    setIsAlertModalOpen(true);
                  }}
                  className="mt-3 px-4 py-2 bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-300 border border-cyan-500/40 text-xs font-mono font-bold rounded-lg transition-all"
                >
                  + Add Price Threshold Alert
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {activeStockAlerts.map((alert) => {
                  const isAbove = alert.condition === 'ABOVE';
                  const dist = ((alert.targetPrice - stock.price) / stock.price) * 100;

                  return (
                    <div
                      key={alert.id}
                      className="p-4 rounded-xl bg-slate-950 border border-slate-800 hover:border-slate-700 transition-all flex flex-col justify-between gap-3"
                    >
                      <div>
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <span
                              className={`p-1.5 rounded-lg text-xs font-mono font-bold flex items-center gap-1 ${
                                isAbove
                                  ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                                  : 'bg-rose-950 text-rose-400 border border-rose-800'
                              }`}
                            >
                              {isAbove ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                              {isAbove ? 'RISES ABOVE (≥)' : 'FALLS BELOW (≤)'}
                            </span>
                            <span className="text-base font-bold font-mono text-white">
                              {stock.currency}{alert.targetPrice.toLocaleString()}
                            </span>
                          </div>

                          <button
                            onClick={() => onDeleteAlert(alert.id)}
                            className="p-1 text-slate-500 hover:text-rose-400 rounded hover:bg-slate-800 transition-colors"
                            title="Delete Alert"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>

                        {alert.note && (
                          <p className="text-xs text-slate-300 italic mt-2 bg-slate-900/60 p-2 rounded border border-slate-800/80">
                            "{alert.note}"
                          </p>
                        )}

                        <div className="mt-3 flex items-center justify-between text-xs font-mono text-slate-400">
                          <span>Distance:</span>
                          <strong className={dist >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                            {dist >= 0 ? `+${dist.toFixed(2)}%` : `${dist.toFixed(2)}%`} (₹{Math.abs(alert.targetPrice - stock.price).toFixed(2)})
                          </strong>
                        </div>
                      </div>

                      <div className="pt-2 border-t border-slate-800/60 flex items-center justify-between gap-2">
                        <span className="text-[11px] text-slate-500 font-mono">
                          Created at: {alert.createdAt}
                        </span>
                        <button
                          onClick={() => {
                            onTriggerSimulatedAlert(alert);
                            playAlertChime('alert');
                          }}
                          className="px-2.5 py-1 rounded bg-slate-800 hover:bg-cyan-950 hover:text-cyan-400 border border-slate-700 hover:border-cyan-800 text-slate-300 text-xs font-mono flex items-center gap-1.5 transition-colors"
                        >
                          <Play className="w-3 h-3 text-cyan-400" />
                          Test Trigger
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Interactive Live Tick Simulation Sandbox */}
          <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white font-mono flex items-center gap-2">
                <Play className="w-4 h-4 text-cyan-400" />
                Live Price Tick Simulation Console
              </h3>
              <span className="text-xs font-mono text-cyan-400">Interactive Testing</span>
            </div>
            <p className="text-xs text-slate-400">
              Input a simulated market price tick for {stock.symbol} to test threshold evaluation, sound synthesis, and alert dispatch.
            </p>

            <div className="flex flex-wrap items-center gap-3 p-4 rounded-xl bg-slate-950 border border-slate-800">
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono text-slate-400">Simulate Price ({stock.currency}):</span>
                <input
                  type="number"
                  value={simulatedTickPrice}
                  onChange={(e) => setSimulatedTickPrice(Number(e.target.value))}
                  className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-white font-mono text-sm w-36 focus:border-cyan-500 focus:outline-none"
                />
              </div>

              <button
                onClick={() => {
                  let triggeredCount = 0;
                  activeStockAlerts.forEach((a) => {
                    const met =
                      (a.condition === 'ABOVE' && simulatedTickPrice >= a.targetPrice) ||
                      (a.condition === 'BELOW' && simulatedTickPrice <= a.targetPrice);
                    if (met) {
                      triggeredCount++;
                      onTriggerSimulatedAlert({
                        ...a,
                        triggeredPrice: simulatedTickPrice,
                      });
                      playAlertChime('alert');
                    }
                  });
                  if (triggeredCount === 0) {
                    playAlertChime('beep');
                  }
                }}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-mono text-xs font-bold transition-all shadow-md flex items-center gap-1.5"
              >
                <Play className="w-3.5 h-3.5" />
                Execute Price Tick Check
              </button>

              <div className="flex items-center gap-1 text-xs font-mono">
                <button
                  onClick={() => setSimulatedTickPrice(Math.round(stock.price * 1.06))}
                  className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px]"
                >
                  +6% Surge
                </button>
                <button
                  onClick={() => setSimulatedTickPrice(Math.round(stock.price * 0.94))}
                  className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-rose-300 text-[11px]"
                >
                  -6% Flash Drop
                </button>
                <button
                  onClick={() => setSimulatedTickPrice(stock.price)}
                  className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-400 text-[11px]"
                >
                  Reset
                </button>
              </div>
            </div>
          </div>

          {/* Triggered Alerts History */}
          {triggeredStockAlerts.length > 0 && (
            <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
              <h3 className="text-sm font-bold text-white font-mono flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                Triggered Alert History ({triggeredStockAlerts.length})
              </h3>
              <div className="space-y-3">
                {triggeredStockAlerts.map((alert) => (
                  <div
                    key={alert.id}
                    className="p-3.5 rounded-xl bg-slate-950 border border-amber-900/40 text-xs font-mono flex items-center justify-between gap-4"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-amber-400 font-bold uppercase">
                          [TRIGGERED] {alert.condition} {stock.currency}{alert.targetPrice.toLocaleString()}
                        </span>
                        {alert.triggeredAt && (
                          <span className="text-slate-400 text-[11px]">at {alert.triggeredAt}</span>
                        )}
                        {alert.triggeredPrice && (
                          <span className="text-white font-bold">
                            (Market: {stock.currency}{alert.triggeredPrice})
                          </span>
                        )}
                      </div>
                      {alert.note && <div className="text-slate-300 italic font-sans">"{alert.note}"</div>}
                    </div>

                    <button
                      onClick={() => onDeleteAlert(alert.id)}
                      className="p-1.5 text-slate-500 hover:text-rose-400 rounded hover:bg-slate-800 transition-colors"
                      title="Clear from history"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB CONTENT: Embedded AI Copilot & Assistant */}
      {activeTab === 'ai-copilot' && (
        <div className="space-y-6">
          <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl">
            <div className="mb-4">
              <h2 className="text-base font-bold text-white font-mono flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-cyan-400" />
                FINAGENT AI RESEARCH ASSISTANT & COPILOT
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Ask any question about {stock.name}, technical patterns (RSI, Moving Averages), fundamental valuation, or request mathematical price threshold recommendations.
              </p>
            </div>

            <AIResearchAssistant
              isFloating={false}
              isOpen={true}
              onClose={() => {}}
              stock={stock}
              alerts={alerts}
              onOpenAlertModalWithValues={(price, cond, note) => {
                setAlertModalPreset({ targetPrice: price, condition: cond, note });
                setIsAlertModalOpen(true);
              }}
            />
          </div>
        </div>
      )}

      {/* Modal: Custom Price Alert Creator */}
      {isAlertModalOpen && (
        <PriceAlertModal
          stock={stock}
          alerts={alerts}
          onClose={() => setIsAlertModalOpen(false)}
          onAddAlert={onAddAlert}
          onDeleteAlert={onDeleteAlert}
          onTriggerSimulatedAlert={onTriggerSimulatedAlert}
          initialTargetPrice={alertModalPreset.targetPrice}
          initialCondition={alertModalPreset.condition}
          initialNote={alertModalPreset.note}
        />
      )}

      {/* Floating AI Assistant Drawer */}
      {isAIAssistantOpen && (
        <AIResearchAssistant
          isFloating={true}
          isOpen={isAIAssistantOpen}
          onClose={() => setIsAIAssistantOpen(false)}
          stock={stock}
          alerts={alerts}
          onOpenAlertModalWithValues={(price, cond, note) => {
            setAlertModalPreset({ targetPrice: price, condition: cond, note });
            setIsAlertModalOpen(true);
          }}
        />
      )}

      {/* Floating Action Button for AI Assistant if closed */}
      {!isAIAssistantOpen && (
        <button
          onClick={() => setIsAIAssistantOpen(true)}
          className="fixed bottom-6 right-6 z-40 px-4 py-3 bg-gradient-to-r from-cyan-600 via-blue-600 to-indigo-600 hover:from-cyan-500 hover:to-blue-500 text-white font-mono font-bold text-xs rounded-full shadow-2xl shadow-cyan-950/80 flex items-center gap-2 border border-cyan-400/40 hover:scale-105 transition-all"
        >
          <Sparkles className="w-4 h-4 text-cyan-200 animate-pulse" />
          <span>Ask FINAGENT AI</span>
        </button>
      )}
    </div>
  );
};
