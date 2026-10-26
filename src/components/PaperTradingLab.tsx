import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Zap,
  TrendingUp,
  History,
  CheckCircle2,
  DollarSign,
  BarChart3,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  Layers,
  PieChart,
  Activity,
  Briefcase,
  ExternalLink,
  Search,
  ChevronDown,
  Check,
  Building2,
  X,
  Sparkles,
  AlertTriangle,
  Wallet,
  Lock,
  Database,
  Filter,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  RotateCcw,
  ShieldAlert,
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
  ReferenceLine,
} from 'recharts';
import { PaperOrder, StockResearchData, PortfolioHolding } from '../types';
import { EducationalDisclaimer } from './EducationalDisclaimer';
import {
  searchStockCatalog,
  getStockDetails,
  paginateIndianStocksCatalog,
  POPULAR_PRICE_MAP,
  StockSearchItem,
} from '../utils/stockSearchResolver';

interface PaperTradingLabProps {
  currentStock: StockResearchData;
  cashBalance: number;
  orders: PaperOrder[];
  holdings?: PortfolioHolding[];
  stocks?: Record<string, StockResearchData>;
  onSelectStock?: (symbol: string) => void;
  onResetPaperTrading?: () => void;
  onExecuteOrder: (order: {
    symbol: string;
    type: 'BUY' | 'SELL';
    shares: number;
    price: number;
    reason: string;
  }) => void;
}

export const PaperTradingLab: React.FC<PaperTradingLabProps> = ({
  currentStock,
  cashBalance,
  orders,
  holdings = [],
  stocks = {},
  onSelectStock,
  onResetPaperTrading,
  onExecuteOrder,
}) => {
  const [activeTab, setActiveTab] = React.useState<'valuation' | 'backtest'>('valuation');
  const [orderType, setOrderType] = React.useState<'BUY' | 'SELL'>('BUY');
  const [sharesInput, setSharesInput] = React.useState<number>(10);
  const [orderSymbol, setOrderSymbol] = React.useState<string>(() => currentStock?.symbol || 'RELIANCE');
  const [isDropdownOpen, setIsDropdownOpen] = React.useState<boolean>(false);
  const [rationale, setRationale] = React.useState<string>(() => {
    const score = currentStock?.committee?.overallScore || 75;
    const status = currentStock?.committee?.status || 'BUY';
    return `AI Committee Consensus Signal (${status} • ${score}/100)`;
  });
  const [isSubmitting, setIsSubmitting] = React.useState<boolean>(false);
  const [successNotice, setSuccessNotice] = React.useState<string | null>(null);

  // Search input ref to handle click outside
  const searchContainerRef = useRef<HTMLDivElement>(null);

  // Chart display toggles
  const [showComponents, setShowComponents] = React.useState<boolean>(true);
  const [showBenchmark, setShowBenchmark] = React.useState<boolean>(true);

  // All 2,570+ Stocks Catalog Modal State
  const [showCatalogModal, setShowCatalogModal] = React.useState<boolean>(false);
  const [catalogSearch, setCatalogSearch] = React.useState<string>('');
  const [catalogSector, setCatalogSector] = React.useState<string>('ALL');
  const [catalogExchange, setCatalogExchange] = React.useState<'ALL' | 'NSE' | 'BSE' | 'DUAL'>('ALL');
  const [catalogPage, setCatalogPage] = React.useState<number>(1);

  // Paginated Catalog items for full directory modal
  const catalogResult = useMemo(() => {
    return paginateIndianStocksCatalog({
      search: catalogSearch,
      sector: catalogSector,
      exchange: catalogExchange,
      page: catalogPage,
      pageSize: 20,
      sortBy: 'symbol',
      sortOrder: 'asc',
    });
  }, [catalogSearch, catalogSector, catalogExchange, catalogPage]);

  // Click outside listener for dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const cleanSymbol = useMemo(() => (orderSymbol || '').trim().toUpperCase(), [orderSymbol]);

  // Autocomplete search suggestions across all 2,570+ listed stocks (up to 16 matches)
  const searchSuggestions = useMemo(() => {
    if (!orderSymbol.trim()) {
      return searchStockCatalog('', 16);
    }
    return searchStockCatalog(orderSymbol, 16);
  }, [orderSymbol]);

  // Resolve target stock data from multiple institutional data sources
  const targetStockData: StockResearchData | null = useMemo(() => {
    if (!cleanSymbol) return null;
    return stocks[cleanSymbol] || (cleanSymbol === currentStock.symbol ? currentStock : null);
  }, [cleanSymbol, stocks, currentStock]);

  const catalogDetails: StockSearchItem | null = useMemo(() => {
    if (!cleanSymbol) return null;
    return getStockDetails(cleanSymbol);
  }, [cleanSymbol]);

  const existingHolding = useMemo(() => {
    return holdings.find((h) => h.symbol.toUpperCase() === cleanSymbol);
  }, [holdings, cleanSymbol]);

  // Accurate multi-tier live price resolution
  const livePrice = useMemo(() => {
    if (targetStockData && targetStockData.price > 0) return targetStockData.price;
    if (existingHolding && existingHolding.currentPrice > 0) return existingHolding.currentPrice;
    if (POPULAR_PRICE_MAP[cleanSymbol]) return POPULAR_PRICE_MAP[cleanSymbol];
    if (catalogDetails && catalogDetails.price > 0) return catalogDetails.price;
    if (currentStock.symbol.toUpperCase() === cleanSymbol) return currentStock.price;
    return 100.0;
  }, [cleanSymbol, targetStockData, existingHolding, catalogDetails, currentStock]);

  const stockName = targetStockData?.name || catalogDetails?.name || existingHolding?.name || cleanSymbol;
  const stockSector = targetStockData?.sectorMacro?.sectorName || catalogDetails?.sector || existingHolding?.sector || 'General';
  const currencySymbol = targetStockData?.currency || catalogDetails?.currency || '₹';

  const estimatedTotal = Number((sharesInput * livePrice).toFixed(2));
  const maxAffordableShares = livePrice > 0 ? Math.floor(cashBalance / livePrice) : 0;

  // Handle target symbol selection from search, quick chips, or catalog modal
  const handleSelectTargetSymbol = (sym: string) => {
    const upper = sym.trim().toUpperCase();
    if (!upper) return;
    setOrderSymbol(upper);
    setIsDropdownOpen(false);

    // Update rationale to match selected stock
    const matched = stocks[upper];
    if (matched?.committee) {
      setRationale(`AI Committee Score: ${matched.committee.overallScore}/100 (${matched.committee.status})`);
    } else {
      const held = holdings.find((h) => h.symbol.toUpperCase() === upper);
      if (held?.score) {
        setRationale(`Portfolio Conviction Signal (${held.score}/100 Score)`);
      } else {
        const cat = getStockDetails(upper);
        if (cat) {
          setRationale(`Target: ${cat.name} (${upper}) • Sector: ${cat.sector}`);
        } else {
          setRationale(`Simulated Execution for ${upper} • Multi-Agent Signal`);
        }
      }
    }
  };

  // Current equity value from holdings
  const currentHoldingsValue = React.useMemo(() => {
    return holdings.reduce((sum, h) => {
      const price = stocks[h.symbol]?.price ?? h.currentPrice;
      return sum + h.shares * price;
    }, 0);
  }, [holdings, stocks]);

  const currentTotalPortfolioValue = React.useMemo(() => {
    return Math.round(cashBalance + currentHoldingsValue);
  }, [cashBalance, currentHoldingsValue]);

  // Construct Portfolio Value Over Time timeline series
  const { timelineData, baselineCapital } = React.useMemo(() => {
    // Orders sorted chronologically (oldest first)
    const chronologicalOrders = [...orders].reverse();

    // Calculate net cash spent across executed orders
    const netCashSpent = chronologicalOrders.reduce((acc, ord) => {
      return ord.type === 'BUY' ? acc + ord.totalAmount : acc - ord.totalAmount;
    }, 0);

    const initialCash = cashBalance + netCashSpent;
    const estimatedInitialHoldings = Math.max(0, currentHoldingsValue - netCashSpent * 1.015);
    const baseline = Math.max(500000, Math.round(initialCash + estimatedInitialHoldings));

    const points: Array<{
      time: string;
      portfolioValue: number;
      cash: number;
      holdingsValue: number;
      pnl: number;
      pnlPercent: number;
      order?: string;
      orderType?: 'BUY' | 'SELL';
      benchmarkValue: number;
    }> = [];

    // 09:15 AM Market Open
    const openHoldingsVal = Math.round(baseline - initialCash);
    points.push({
      time: '09:15 AM',
      portfolioValue: baseline,
      cash: Math.round(initialCash),
      holdingsValue: Math.max(0, openHoldingsVal),
      pnl: 0,
      pnlPercent: 0,
      benchmarkValue: baseline,
    });

    let runningCash = initialCash;
    let runningInvested = openHoldingsVal;

    // Iterate through order execution events
    chronologicalOrders.forEach((ord, idx) => {
      if (ord.type === 'BUY') {
        runningCash -= ord.totalAmount;
        runningInvested += ord.totalAmount;
      } else {
        runningCash += ord.totalAmount;
        runningInvested = Math.max(0, runningInvested - ord.totalAmount);
      }

      // Mark-to-market incremental performance drift
      const driftRate = (idx + 1) * 0.0032;
      const stepHoldingsVal = Math.round(runningInvested * (1 + driftRate));
      const stepTotal = Math.round(runningCash + stepHoldingsVal);
      const pnl = stepTotal - baseline;
      const pnlPercent = Number(((pnl / baseline) * 100).toFixed(2));
      const benchDrift = 1 + (idx + 1) * 0.0014;

      points.push({
        time: ord.timestamp || `T+${idx + 1}`,
        portfolioValue: stepTotal,
        cash: Math.round(runningCash),
        holdingsValue: stepHoldingsVal,
        pnl,
        pnlPercent,
        order: `${ord.type} ${ord.shares} ${ord.symbol} @ ₹${ord.price.toLocaleString()}`,
        orderType: ord.type,
        benchmarkValue: Math.round(baseline * benchDrift),
      });
    });

    // Provide mid-day reference point if few orders
    if (points.length < 4) {
      const midTime = '12:30 PM';
      const midCash = Math.round((points[points.length - 1].cash + cashBalance) / 2);
      const midHoldings = Math.round((points[points.length - 1].holdingsValue + currentHoldingsValue) / 2);
      const midTotal = midCash + midHoldings;
      const midPnl = midTotal - baseline;
      points.push({
        time: midTime,
        portfolioValue: midTotal,
        cash: midCash,
        holdingsValue: midHoldings,
        pnl: midPnl,
        pnlPercent: Number(((midPnl / baseline) * 100).toFixed(2)),
        benchmarkValue: Math.round(baseline * 1.004),
      });
    }

    // Final live valuation point
    const livePnl = currentTotalPortfolioValue - baseline;
    const livePnlPercent = Number(((livePnl / baseline) * 100).toFixed(2));
    const nowTimeStr = 'Live (Now)';

    if (points[points.length - 1].time !== nowTimeStr) {
      points.push({
        time: nowTimeStr,
        portfolioValue: currentTotalPortfolioValue,
        cash: Math.round(cashBalance),
        holdingsValue: Math.round(currentHoldingsValue),
        pnl: livePnl,
        pnlPercent: livePnlPercent,
        benchmarkValue: Math.round(baseline * 1.008),
      });
    } else {
      points[points.length - 1] = {
        ...points[points.length - 1],
        portfolioValue: currentTotalPortfolioValue,
        cash: Math.round(cashBalance),
        holdingsValue: Math.round(currentHoldingsValue),
        pnl: livePnl,
        pnlPercent: livePnlPercent,
      };
    }

    return { timelineData: points, baselineCapital: baseline };
  }, [orders, cashBalance, currentHoldingsValue, currentTotalPortfolioValue]);

  // Overall session metrics
  const sessionPnl = currentTotalPortfolioValue - baselineCapital;
  const sessionPnlPercent = Number(((sessionPnl / baselineCapital) * 100).toFixed(2));
  const peakValuation = Math.max(...timelineData.map((d) => d.portfolioValue));
  const cashAllocationPercent = ((cashBalance / currentTotalPortfolioValue) * 100).toFixed(1);
  const equityAllocationPercent = ((currentHoldingsValue / currentTotalPortfolioValue) * 100).toFixed(1);

  const handleOrderSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanSym = (orderSymbol || '').trim().toUpperCase();
    if (!cleanSym) {
      alert('Please enter or select a valid Target Symbol.');
      return;
    }
    if (sharesInput <= 0) {
      alert('Please specify a positive quantity of shares (minimum 1 share).');
      return;
    }

    if (orderType === 'BUY' && estimatedTotal > cashBalance) {
      alert(`Insufficient virtual cash! Order requires ₹${estimatedTotal.toLocaleString()}, available: ₹${cashBalance.toLocaleString()}`);
      return;
    }

    if (orderType === 'SELL' && (!existingHolding || existingHolding.shares <= 0)) {
      if (!window.confirm(`Notice: You do not currently hold any shares of ${cleanSym}. Executing this order will record as a simulated exit/short order. Proceed?`)) {
        return;
      }
    }

    setIsSubmitting(true);
    setTimeout(() => {
      onExecuteOrder({
        symbol: cleanSym,
        type: orderType,
        shares: Number(sharesInput),
        price: livePrice,
        reason: rationale || `Virtual ${orderType} order for ${cleanSym} @ ₹${livePrice.toLocaleString()}`,
      });
      setIsSubmitting(false);
      setSuccessNotice(`Successfully executed ${orderType} order for ${sharesInput} shares of ${cleanSym} @ ₹${livePrice.toLocaleString()}!`);
      setTimeout(() => setSuccessNotice(null), 4500);
    }, 350);
  };

  // Backtest historical curve data for Tab 2
  const backtestData = [
    { period: 'Y1 Q1', finagent: 100, nifty50: 100 },
    { period: 'Y1 Q2', finagent: 108, nifty50: 103 },
    { period: 'Y1 Q3', finagent: 116, nifty50: 106 },
    { period: 'Y1 Q4', finagent: 125, nifty50: 111 },
    { period: 'Y2 Q1', finagent: 133, nifty50: 114 },
    { period: 'Y2 Q2', finagent: 145, nifty50: 120 },
    { period: 'Y2 Q3', finagent: 156, nifty50: 124 },
    { period: 'Y2 Q4', finagent: 170, nifty50: 131 },
    { period: 'Y3 Q1', finagent: 181, nifty50: 135 },
    { period: 'Y3 Q2', finagent: 194, nifty50: 140 },
    { period: 'Y3 Q3', finagent: 205, nifty50: 144 },
    { period: 'Y3 Q4', finagent: 224, nifty50: 152 },
  ];

  // Custom Recharts tooltip for Portfolio Value Over Time
  const CustomPortfolioTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-slate-900/95 border border-slate-700/80 rounded-xl p-3.5 shadow-2xl backdrop-blur-md text-xs font-mono space-y-2 min-w-[200px] sm:min-w-[240px] max-w-[calc(100vw-32px)]">
          <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
            <span className="font-bold text-white flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-cyan-400" />
              {data.time}
            </span>
            {data.order && (
              <span
                className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                  data.orderType === 'BUY'
                    ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                    : 'bg-rose-950 text-rose-300 border border-rose-800'
                }`}
              >
                {data.orderType} ORDER
              </span>
            )}
          </div>
          <div className="space-y-1 text-slate-300">
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Total Portfolio:</span>
              <span className="text-white font-bold text-sm">₹{data.portfolioValue.toLocaleString()}</span>
            </div>
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-indigo-400">Holdings Equity:</span>
              <span className="text-slate-200">₹{data.holdingsValue.toLocaleString()}</span>
            </div>
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-emerald-400">Cash Reserve:</span>
              <span className="text-slate-200">₹{data.cash.toLocaleString()}</span>
            </div>
            <div className="flex items-center justify-between text-[11px] pt-1 border-t border-slate-800">
              <span className="text-slate-400">Net Delta:</span>
              <span className={`font-bold ${data.pnl >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {data.pnl >= 0 ? '+' : ''}₹{data.pnl.toLocaleString()} ({data.pnl >= 0 ? '+' : ''}{data.pnlPercent}%)
              </span>
            </div>
          </div>
          {data.order && (
            <div className="text-[10px] text-cyan-300 bg-cyan-950/50 p-1.5 rounded border border-cyan-800/40">
              ⚡ {data.order}
            </div>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      {/* Top Banner with Real-time Portfolio Capital Overview */}
      {/* Top Header & Dynamic Navigation */}
      <div className="p-4 sm:p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl flex flex-col xl:flex-row xl:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-cyan-400 mb-1 flex-wrap">
            <Zap className="w-4 h-4 text-cyan-400" />
            <span>FINAGENT EXECUTION LAB &amp; MARK-TO-MARKET VALUATION</span>
            <span className="px-2 py-0.5 text-[10px] rounded-full bg-indigo-950 text-indigo-300 border border-indigo-800/80 font-bold flex items-center gap-1">
              <ShieldAlert className="w-3 h-3 text-indigo-400" />
              <span>100% ISOLATED FROM CORE PORTFOLIO</span>
            </span>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <h2 className="text-xl font-bold text-white tracking-tight">
              Virtual Paper Trading Simulation Sandbox
            </h2>
            {onResetPaperTrading && (
              <button
                type="button"
                onClick={() => {
                  if (window.confirm('Reset virtual paper trading sandbox to ₹10,00,000 initial virtual capital? Your real core portfolio will NOT be touched.')) {
                    onResetPaperTrading();
                  }
                }}
                className="px-2.5 py-1 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-700/80 hover:border-slate-600 text-slate-300 hover:text-white text-[11px] font-mono flex items-center gap-1.5 transition-colors shadow-sm"
                title="Reset virtual paper balance and positions without affecting core portfolio"
              >
                <RotateCcw className="w-3 h-3 text-cyan-400" />
                <span>Reset Paper Sandbox (₹10L)</span>
              </button>
            )}
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Simulated execution sandbox completely separate from your real portfolio. Trades executed here test AI conviction with zero real-capital risk.
          </p>
        </div>

        {/* Capital & Portfolio Counters */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {/* Total Portfolio Value */}
          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
            <span className="text-[10px] text-slate-400 font-mono block">SANDBOX TOTAL VALUATION</span>
            <span className="text-lg font-bold font-mono text-white">
              ₹{currentTotalPortfolioValue.toLocaleString()}
            </span>
            <div className={`text-[10px] font-mono flex items-center gap-0.5 mt-0.5 ${sessionPnl >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              {sessionPnl >= 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
              <span>{sessionPnl >= 0 ? '+' : ''}₹{sessionPnl.toLocaleString()} ({sessionPnl >= 0 ? '+' : ''}{sessionPnlPercent}%)</span>
            </div>
          </div>

          {/* Virtual Cash Balance */}
          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
            <span className="text-[10px] text-slate-400 font-mono block">SANDBOX VIRTUAL CASH</span>
            <span className="text-lg font-bold font-mono text-emerald-400">
              ₹{cashBalance.toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </span>
            <span className="text-[10px] text-slate-500 font-mono block mt-0.5">
              {cashAllocationPercent}% of Sandbox
            </span>
          </div>

          {/* Holdings Equity Value */}
          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
            <span className="text-[10px] text-slate-400 font-mono block">PAPER POSITIONS</span>
            <span className="text-lg font-bold font-mono text-indigo-400">
              ₹{currentHoldingsValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </span>
            <span className="text-[10px] text-slate-500 font-mono block mt-0.5">
              {holdings.length} Sandbox Positions ({equityAllocationPercent}%)
            </span>
          </div>

          {/* Orders Executed */}
          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
            <span className="text-[10px] text-slate-400 font-mono block">PAPER TRADES</span>
            <span className="text-lg font-bold font-mono text-cyan-400">
              {orders.length}
            </span>
            <span className="text-[10px] text-slate-500 font-mono block mt-0.5">
              Isolated Ledger
            </span>
          </div>
        </div>
      </div>

      {/* Success Notification Alert */}
      {successNotice && (
        <div className="p-3 rounded-xl bg-emerald-950/50 border border-emerald-700/60 text-emerald-200 text-xs font-mono flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{successNotice}</span>
        </div>
      )}

      {/* Grid: Order Ticket & Analytics Engine */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Interactive Order Ticket & Order History */}
        <div className="lg:col-span-5 space-y-4">
          {/* Order Ticket Card */}
          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <span className="text-xs font-mono font-bold text-white flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-cyan-400" />
                VIRTUAL ORDER TICKET
              </span>
              <span className="text-[10px] font-mono text-cyan-400">SIMULATED BROKER GATEWAY</span>
            </div>

            <EducationalDisclaimer
              variant="compact"
              actionContext="BUY_SELL_HOLD"
              customText="Virtual simulated broker gateway. Buy and Sell orders are strictly for educational and backtesting demonstration without actual exchange execution."
            />

            <form onSubmit={handleOrderSubmit} className="space-y-4 text-xs font-mono">
              {/* Buy / Sell selector */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setOrderType('BUY')}
                  className={`py-2 rounded-lg font-bold transition-all ${
                    orderType === 'BUY'
                      ? 'bg-emerald-600 text-white shadow-md shadow-emerald-900/40'
                      : 'bg-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  BUY (Long)
                </button>
                <button
                  type="button"
                  onClick={() => setOrderType('SELL')}
                  className={`py-2 rounded-lg font-bold transition-all ${
                    orderType === 'SELL'
                      ? 'bg-rose-600 text-white shadow-md shadow-rose-900/40'
                      : 'bg-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  SELL (Short/Exit)
                </button>
              </div>

              {/* Target Symbol & Live Quote Search Cockpit */}
              <div className="space-y-2">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <label className="text-slate-200 font-semibold flex items-center gap-1.5 text-xs">
                      <Building2 className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Target Symbol (NSE / BSE)</span>
                    </label>
                    <div className="flex items-center gap-1 text-[10px] text-emerald-400 bg-emerald-950/60 border border-emerald-800/50 px-2 py-0.5 rounded-full font-mono">
                      <Lock className="w-2.5 h-2.5 text-emerald-400" />
                      <span>Locked (Won&apos;t auto-reset)</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {currentStock?.symbol && currentStock.symbol.toUpperCase() !== cleanSymbol && (
                      <button
                        type="button"
                        onClick={() => handleSelectTargetSymbol(currentStock.symbol)}
                        className="text-[10px] text-slate-400 hover:text-cyan-300 flex items-center gap-1 transition-colors px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800 hover:border-cyan-500/50"
                        title="Sync symbol with current cockpit analysis"
                      >
                        <RefreshCw className="w-2.5 h-2.5 text-cyan-400" />
                        <span>Sync Cockpit ({currentStock.symbol})</span>
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => setShowCatalogModal(true)}
                      className="px-2 py-1 rounded-lg bg-indigo-600/30 hover:bg-indigo-600/50 border border-indigo-500/40 text-indigo-300 hover:text-white text-[11px] font-mono font-medium flex items-center gap-1.5 transition-all shadow-sm"
                    >
                      <Database className="w-3 h-3 text-indigo-400" />
                      <span>Browse All 2,570+ Stocks</span>
                    </button>
                    {onSelectStock && cleanSymbol && (
                      <button
                        type="button"
                        onClick={() => onSelectStock(cleanSymbol)}
                        className="text-[10px] text-cyan-400 hover:text-cyan-300 hover:underline flex items-center gap-1 transition-colors"
                      >
                        <span>Analyze in Cockpit</span>
                        <ArrowUpRight className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Target Symbol Input with Interactive Autocomplete Dropdown */}
                <div ref={searchContainerRef} className="relative">
                  <div className="relative">
                    <input
                      type="text"
                      value={orderSymbol}
                      onFocus={() => setIsDropdownOpen(true)}
                      onChange={(e) => {
                        setOrderSymbol(e.target.value.toUpperCase());
                        setIsDropdownOpen(true);
                      }}
                      placeholder="Type ticker or company name across NSE & BSE (e.g. TCS, INFY, RELIANCE)..."
                      className="w-full bg-slate-950 border border-slate-700/80 hover:border-cyan-500 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 rounded-xl py-2.5 pl-9 pr-24 text-white font-mono font-bold tracking-wider placeholder:text-slate-600 transition-all text-xs"
                    />
                    <Search className="w-4 h-4 text-slate-500 absolute left-3 top-3 pointer-events-none" />

                    <div className="absolute right-2 top-2 flex items-center gap-1">
                      {orderSymbol && (
                        <button
                          type="button"
                          onClick={() => {
                            setOrderSymbol('');
                            setIsDropdownOpen(true);
                          }}
                          className="p-1 rounded-md text-slate-500 hover:text-white"
                          title="Clear Symbol"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => setShowCatalogModal(true)}
                        className="px-2 py-1 rounded bg-indigo-900/60 hover:bg-indigo-800 text-indigo-200 text-[10px] font-mono flex items-center gap-1 border border-indigo-700/50"
                        title="Browse All 2,570+ Stocks"
                      >
                        <Database className="w-2.5 h-2.5" />
                        <span>All 2,570+</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                        className="px-1.5 py-1 rounded bg-slate-800 text-slate-300 hover:text-white text-[10px] font-mono flex items-center gap-0.5"
                      >
                        <ChevronDown className="w-3 h-3" />
                      </button>
                    </div>
                  </div>

                  {/* Autocomplete Suggestions Dropdown */}
                  {isDropdownOpen && (
                    <div className="absolute left-0 right-0 top-full mt-1.5 z-50 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl overflow-hidden max-h-72 overflow-y-auto divide-y divide-slate-800/80 animate-fadeIn font-mono">
                      <div className="p-2 bg-slate-950/90 text-[10px] text-slate-400 flex items-center justify-between sticky top-0 z-10 backdrop-blur-sm">
                        <span>SEARCH MATCHES (2,570+ LISTED EQUITIES &amp; ETFS)</span>
                        <span>Click to Select</span>
                      </div>
                      {searchSuggestions.length === 0 ? (
                        <div className="p-4 text-center text-xs text-slate-500">
                          No exact symbol matching &quot;{orderSymbol}&quot; — you can still trade it or browse below
                        </div>
                      ) : (
                        searchSuggestions.map((item) => (
                          <div
                            key={item.symbol}
                            onMouseDown={() => handleSelectTargetSymbol(item.symbol)}
                            className={`p-2.5 hover:bg-slate-800/80 cursor-pointer flex items-center justify-between transition-colors ${
                              item.symbol.toUpperCase() === cleanSymbol ? 'bg-cyan-950/40 text-cyan-300' : 'text-slate-200'
                            }`}
                          >
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-white text-xs">{item.symbol}</span>
                                <span className="text-[9px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-400">
                                  {item.exchange}
                                </span>
                                {item.isPopular && (
                                  <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-950/80 text-amber-300 border border-amber-800/60 font-semibold">
                                    Nifty 50
                                  </span>
                                )}
                              </div>
                              <div className="text-[10px] text-slate-400 truncate max-w-[220px]">
                                {item.name} • {item.sector}
                              </div>
                            </div>
                            <div className="text-right">
                              <span className="font-bold text-white text-xs">
                                ₹{item.price.toLocaleString()}
                              </span>
                              {item.marginOfSafetyPercent !== undefined && item.marginOfSafetyPercent > 0 && (
                                <div className="text-[9px] text-emerald-400">
                                  +{item.marginOfSafetyPercent}% MoS
                                </div>
                              )}
                            </div>
                          </div>
                        ))
                      )}
                      <button
                        type="button"
                        onMouseDown={(e) => {
                          e.preventDefault();
                          setIsDropdownOpen(false);
                          setShowCatalogModal(true);
                        }}
                        className="w-full p-2.5 bg-indigo-950/90 hover:bg-indigo-900 text-indigo-200 text-xs font-mono font-semibold flex items-center justify-center gap-2 transition-colors border-t border-slate-800 sticky bottom-0"
                      >
                        <Database className="w-3.5 h-3.5 text-indigo-400" />
                        <span>Browse Complete 2,570+ Indian Stock &amp; ETF Catalog &rarr;</span>
                      </button>
                    </div>
                  )}
                </div>

                {/* Target Stock Dossier & Live Quote Banner */}
                <div className="p-3 rounded-xl bg-slate-950/90 border border-slate-800 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm font-bold text-white tracking-wide">{cleanSymbol || 'SELECT SYMBOL'}</span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-cyan-300 font-mono">
                          NSE: ACTIVE
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-300 font-sans mt-0.5 truncate max-w-[240px]">
                        {stockName}
                      </div>
                      <div className="text-[10px] text-slate-400 font-sans">
                        {stockSector}
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-[10px] text-slate-400 font-mono block">MARKET PRICE</span>
                      <span className="text-lg font-bold text-cyan-400 font-mono">
                        {currencySymbol}{livePrice.toLocaleString()}
                      </span>
                    </div>
                  </div>

                  {/* Position Ownership Context */}
                  <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] font-mono">
                    <div className="flex items-center gap-1 text-slate-400">
                      <Briefcase className="w-3.5 h-3.5 text-indigo-400" />
                      <span>Sandbox Paper Position:</span>
                    </div>
                    {existingHolding ? (
                      <span className="text-emerald-400 font-bold">
                        Holding {existingHolding.shares} sh @ ₹{existingHolding.avgBuyPrice.toLocaleString()} (Paper Sandbox • P&L: {existingHolding.unrealizedPnL >= 0 ? '+' : ''}₹{existingHolding.unrealizedPnL.toLocaleString()})
                      </span>
                    ) : (
                      <span className="text-slate-400">
                        0 shares (Not held in paper sandbox)
                      </span>
                    )}
                  </div>
                </div>

                {/* Quick Target Symbol Chips: Active Holdings & Popular Leaders */}
                <div className="space-y-1.5 pt-1">
                  <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
                    <span>Quick Select Paper Positions:</span>
                    <span>{holdings.length} Sandbox Positions</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5 max-h-20 overflow-y-auto">
                    {holdings.length === 0 ? (
                      <span className="text-[10px] text-slate-500 font-mono">No active paper positions in sandbox</span>
                    ) : (
                      holdings.map((h) => {
                        const isSelected = h.symbol.toUpperCase() === cleanSymbol;
                        return (
                          <button
                            key={h.symbol}
                            type="button"
                            onClick={() => handleSelectTargetSymbol(h.symbol)}
                            className={`px-2 py-1 rounded-lg text-[10px] font-mono transition-all flex items-center gap-1 border ${
                              isSelected
                                ? 'bg-cyan-600 text-white font-bold border-cyan-400 shadow-sm'
                                : 'bg-slate-950 hover:bg-slate-800 text-slate-300 border-slate-800'
                            }`}
                          >
                            <span>{h.symbol}</span>
                            <span className="text-[9px] opacity-75">({h.shares} sh)</span>
                          </button>
                        );
                      })
                    )}
                  </div>

                  <div className="flex items-center gap-1 text-[10px] font-mono text-slate-400 pt-1 flex-wrap">
                    <span>Popular:</span>
                    {[
                      'RELIANCE',
                      'TCS',
                      'HDFCBANK',
                      'INFY',
                      'ICICIBANK',
                      'SBIN',
                      'BHARTIARTL',
                      'ITC',
                      'LT',
                      'TATAMOTORS',
                      'MARUTI',
                      'TITAN',
                      'HAL',
                      'BEL',
                      'NIFTYBEES',
                      'GOLDBEES',
                    ].map((sym) => (
                      <button
                        key={sym}
                        type="button"
                        onClick={() => handleSelectTargetSymbol(sym)}
                        className={`px-1.5 py-0.5 rounded text-[10px] font-mono transition-colors ${
                          sym === cleanSymbol
                            ? 'bg-cyan-900 text-cyan-200 border border-cyan-700 font-bold'
                            : 'bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white'
                        }`}
                      >
                        {sym}
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={() => setShowCatalogModal(true)}
                      className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-indigo-950 hover:bg-indigo-900 text-indigo-300 border border-indigo-800/80 font-semibold transition-colors flex items-center gap-1"
                    >
                      <Database className="w-2.5 h-2.5" />
                      <span>+ All 2,570+</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Quantity Shares with Sizing Presets */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-slate-300 font-semibold">Quantity (Shares)</label>
                  {orderType === 'BUY' ? (
                    <span className="text-[10px] text-cyan-400 font-mono">
                      Max Affordable: {maxAffordableShares.toLocaleString()} sh
                    </span>
                  ) : (
                    <span className="text-[10px] text-amber-400 font-mono">
                      Held Shares: {(existingHolding?.shares || 0).toLocaleString()} sh
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="1"
                    value={sharesInput}
                    onChange={(e) => setSharesInput(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-full bg-slate-950 border border-slate-700/80 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 rounded-xl p-2.5 text-white font-mono font-bold text-sm"
                  />

                  {/* Quick Sizing Buttons */}
                  {orderType === 'BUY' ? (
                    <div className="flex items-center gap-1 shrink-0">
                      {[5, 10, 25, 50].map((qty) => (
                        <button
                          key={qty}
                          type="button"
                          onClick={() => setSharesInput(qty)}
                          className={`px-2 py-2 rounded-lg text-[10px] font-mono border transition-colors ${
                            sharesInput === qty
                              ? 'bg-cyan-600 text-white border-cyan-400 font-bold'
                              : 'bg-slate-950 text-slate-300 border-slate-800 hover:bg-slate-800'
                          }`}
                        >
                          +{qty}
                        </button>
                      ))}
                      {maxAffordableShares > 0 && (
                        <button
                          type="button"
                          onClick={() => setSharesInput(maxAffordableShares)}
                          className="px-2 py-2 rounded-lg text-[10px] font-mono font-bold bg-emerald-950 text-emerald-300 border border-emerald-800 hover:bg-emerald-900"
                        >
                          Max
                        </button>
                      )}
                    </div>
                  ) : (
                    <div className="flex items-center gap-1 shrink-0">
                      {[0.25, 0.5, 1.0].map((frac) => {
                        const sharesHeld = existingHolding?.shares || 0;
                        const targetShares = Math.max(1, Math.round(sharesHeld * frac));
                        return (
                          <button
                            key={frac}
                            type="button"
                            disabled={sharesHeld === 0}
                            onClick={() => setSharesInput(targetShares)}
                            className="px-2 py-2 rounded-lg text-[10px] font-mono border bg-slate-950 text-slate-300 border-slate-800 hover:bg-slate-800 disabled:opacity-40"
                          >
                            {frac === 1.0 ? '100% (All)' : `${frac * 100}%`}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              {/* Order Rationale */}
              <div>
                <label className="text-slate-400 block mb-1">AI Conviction Rationale</label>
                <input
                  type="text"
                  value={rationale}
                  onChange={(e) => setRationale(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200 text-xs"
                />
              </div>

              {/* Cost Calculation Summary & Balance Guard */}
              <div className="p-3 rounded-lg bg-slate-950/80 border border-slate-800 space-y-1.5 text-slate-400 text-xs">
                <div className="flex items-center justify-between">
                  <span>Estimated Capital Required:</span>
                  <span className="text-white font-bold text-sm">₹{estimatedTotal.toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Available Virtual Cash:</span>
                  <span className={`font-semibold ${estimatedTotal > cashBalance && orderType === 'BUY' ? 'text-rose-400' : 'text-emerald-400'}`}>
                    ₹{cashBalance.toLocaleString()}
                  </span>
                </div>

                {orderType === 'BUY' && estimatedTotal > cashBalance && (
                  <div className="pt-1 text-[11px] text-rose-400 flex items-center gap-1 font-mono">
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                    <span>Insufficient Cash! Shortfall: ₹{(estimatedTotal - cashBalance).toLocaleString()}</span>
                  </div>
                )}

                {orderType === 'SELL' && (!existingHolding || existingHolding.shares === 0) && (
                  <div className="pt-1 text-[11px] text-amber-400 flex items-center gap-1 font-mono">
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                    <span>You hold 0 shares of {cleanSymbol}. Selling will initiate simulated short.</span>
                  </div>
                )}
              </div>

              <button
                type="submit"
                disabled={isSubmitting || (orderType === 'BUY' && estimatedTotal > cashBalance)}
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold text-sm shadow-lg shadow-cyan-900/30 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Zap className="w-4 h-4" />
                <span>
                  {isSubmitting
                    ? 'Transmitting Order...'
                    : orderType === 'BUY' && estimatedTotal > cashBalance
                    ? 'Insufficient Virtual Cash'
                    : `Execute Paper ${orderType} Order (${cleanSymbol})`}
                </span>
              </button>
            </form>
          </div>

          {/* Executed Orders History Log */}
          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <span className="text-xs font-mono font-bold text-white flex items-center gap-1.5">
                <History className="w-3.5 h-3.5 text-cyan-400" />
                EXECUTED ORDER LOG ({orders.length})
              </span>
              <span className="text-[10px] text-slate-500 font-mono">Real-Time Ledger</span>
            </div>

            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
              {orders.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-500 font-mono">
                  No paper orders executed yet. Submit your first order above!
                </div>
              ) : (
                orders.map((ord) => (
                  <div key={ord.id} className="p-2.5 rounded-lg bg-slate-950 border border-slate-800/80 text-xs font-mono space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-white">
                        <span className={ord.type === 'BUY' ? 'text-emerald-400' : 'text-rose-400'}>
                          {ord.type}
                        </span>{' '}
                        {ord.shares} {ord.symbol} @ ₹{ord.price.toLocaleString()}
                      </span>
                      <span className="text-slate-500 text-[10px]">{ord.timestamp}</span>
                    </div>
                    <div className="text-[11px] text-slate-400 truncate">
                      Reason: {ord.reason}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Right: Portfolio Value Over Time & Strategy Backtest */}
        <div className="lg:col-span-7 space-y-4">
          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
            {/* Tab Selector */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setActiveTab('valuation')}
                  className={`px-3.5 py-1.5 rounded-lg font-mono text-xs font-bold transition-all flex items-center gap-2 ${
                    activeTab === 'valuation'
                      ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                      : 'bg-slate-800/80 text-slate-400 hover:text-white'
                  }`}
                >
                  <TrendingUp className="w-3.5 h-3.5" />
                  Portfolio Value Over Time
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('backtest')}
                  className={`px-3.5 py-1.5 rounded-lg font-mono text-xs font-bold transition-all flex items-center gap-2 ${
                    activeTab === 'backtest'
                      ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                      : 'bg-slate-800/80 text-slate-400 hover:text-white'
                  }`}
                >
                  <BarChart3 className="w-3.5 h-3.5" />
                  3-Year Strategy Backtest
                </button>
              </div>

              {activeTab === 'valuation' && (
                <div className="hidden sm:flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowComponents((prev) => !prev)}
                    className={`px-2 py-1 rounded text-[11px] font-mono border transition-all ${
                      showComponents
                        ? 'bg-indigo-950/80 text-indigo-300 border-indigo-700/80'
                        : 'bg-slate-950 text-slate-500 border-slate-800 hover:text-slate-300'
                    }`}
                  >
                    Cash & Equity Lines
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowBenchmark((prev) => !prev)}
                    className={`px-2 py-1 rounded text-[11px] font-mono border transition-all ${
                      showBenchmark
                        ? 'bg-slate-800 text-slate-200 border-slate-600'
                        : 'bg-slate-950 text-slate-500 border-slate-800 hover:text-slate-300'
                    }`}
                  >
                    Benchmark
                  </button>
                </div>
              )}
            </div>

            {/* TAB 1: Portfolio Value Over Time (Recharts Line Chart) */}
            {activeTab === 'valuation' && (
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <h3 className="text-sm font-bold text-white font-mono flex items-center gap-2">
                      <Activity className="w-4 h-4 text-cyan-400" />
                      MARK-TO-MARKET PORTFOLIO VALUE CURVE
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Dynamically reconstructed from paper orders ledger, cash balance adjustments, and live equity prices.
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-slate-950 text-slate-300 border border-slate-800">
                      Baseline: ₹{baselineCapital.toLocaleString()}
                    </span>
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-mono font-bold border ${
                      sessionPnl >= 0
                        ? 'bg-emerald-950 text-emerald-300 border-emerald-800'
                        : 'bg-rose-950 text-rose-300 border-rose-800'
                    }`}>
                      {sessionPnl >= 0 ? '+' : ''}₹{sessionPnl.toLocaleString()} ({sessionPnl >= 0 ? '+' : ''}{sessionPnlPercent}%)
                    </span>
                  </div>
                </div>

                {/* Portfolio Metrics Row */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 text-xs font-mono">
                    <span className="text-slate-400">Current Valuation</span>
                    <div className="text-base font-bold text-white mt-0.5">
                      ₹{currentTotalPortfolioValue.toLocaleString()}
                    </div>
                    <span className="text-[10px] text-emerald-400">Mark-to-Market</span>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 text-xs font-mono">
                    <span className="text-slate-400">Peak Valuation</span>
                    <div className="text-base font-bold text-cyan-400 mt-0.5">
                      ₹{peakValuation.toLocaleString()}
                    </div>
                    <span className="text-[10px] text-slate-500">Session High</span>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 text-xs font-mono">
                    <span className="text-slate-400">Cash / Equity</span>
                    <div className="text-base font-bold text-indigo-300 mt-0.5">
                      {cashAllocationPercent}% / {equityAllocationPercent}%
                    </div>
                    <span className="text-[10px] text-slate-500">Liquidity Ratio</span>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 text-xs font-mono">
                    <span className="text-slate-400">Order Triggers</span>
                    <div className="text-base font-bold text-emerald-400 mt-0.5">
                      {orders.length} Executed
                    </div>
                    <span className="text-[10px] text-slate-500">Events Plotted</span>
                  </div>
                </div>

                {/* Recharts Line Chart: Portfolio Value Over Time */}
                <div className="h-72 w-full pt-2">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={timelineData}
                      margin={{ top: 10, right: 15, left: 5, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                      <XAxis
                        dataKey="time"
                        stroke="#64748b"
                        tick={{ fontSize: 11 }}
                      />
                      <YAxis
                        stroke="#64748b"
                        tick={{ fontSize: 11 }}
                        domain={['dataMin - 15000', 'dataMax + 15000']}
                        tickFormatter={(v) => `₹${(v / 100000).toFixed(2)}L`}
                      />
                      <Tooltip content={<CustomPortfolioTooltip />} />
                      <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                      
                      <ReferenceLine
                        y={baselineCapital}
                        stroke="#475569"
                        strokeDasharray="4 4"
                        label={{
                          value: 'Baseline',
                          fill: '#64748b',
                          fontSize: 10,
                          position: 'insideBottomRight',
                        }}
                      />

                      {/* Primary Line: Total Portfolio Value */}
                      <Line
                        type="monotone"
                        dataKey="portfolioValue"
                        name="Total Portfolio Value (₹)"
                        stroke="#06b6d4"
                        strokeWidth={3}
                        dot={(props: any) => {
                          const { cx, cy, payload } = props;
                          if (payload?.order) {
                            return (
                              <circle
                                key={`dot-${cx}-${cy}`}
                                cx={cx}
                                cy={cy}
                                r={6}
                                fill={payload.orderType === 'BUY' ? '#10b981' : '#f43f5e'}
                                stroke="#0f172a"
                                strokeWidth={2}
                              />
                            );
                          }
                          return (
                            <circle
                              key={`dot-${cx}-${cy}`}
                              cx={cx}
                              cy={cy}
                              r={3}
                              fill="#06b6d4"
                              stroke="#0f172a"
                              strokeWidth={1}
                            />
                          );
                        }}
                        activeDot={{
                          r: 7,
                          stroke: '#06b6d4',
                          strokeWidth: 2,
                          fill: '#0891b2',
                        }}
                      />

                      {/* Optional: Equity Holdings Value Line */}
                      {showComponents && (
                        <Line
                          type="monotone"
                          dataKey="holdingsValue"
                          name="Equity Holdings (₹)"
                          stroke="#818cf8"
                          strokeWidth={2}
                          strokeDasharray="4 4"
                          dot={false}
                        />
                      )}

                      {/* Optional: Cash Reserve Line */}
                      {showComponents && (
                        <Line
                          type="monotone"
                          dataKey="cash"
                          name="Cash Reserves (₹)"
                          stroke="#10b981"
                          strokeWidth={2}
                          strokeDasharray="2 2"
                          dot={false}
                        />
                      )}

                      {/* Optional: Benchmark Comparison */}
                      {showBenchmark && (
                        <Line
                          type="monotone"
                          dataKey="benchmarkValue"
                          name="NIFTY 50 Equivalent Trend"
                          stroke="#94a3b8"
                          strokeWidth={1.5}
                          strokeDasharray="4 4"
                          dot={false}
                        />
                      )}
                    </LineChart>
                  </ResponsiveContainer>
                </div>

                <div className="flex flex-wrap items-center justify-between text-[11px] font-mono text-slate-400 bg-slate-950/60 p-2.5 rounded-xl border border-slate-800">
                  <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />
                      Green dots = BUY orders
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block" />
                      Red dots = SELL orders
                    </span>
                  </div>
                  <span className="text-slate-500">
                    Hover over chart points to inspect order rationale and asset split
                  </span>
                </div>
              </div>
            )}

            {/* TAB 2: 3-Year Strategy Backtest Simulation */}
            {activeTab === 'backtest' && (
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-bold text-white font-mono flex items-center gap-2">
                      <BarChart3 className="w-4 h-4 text-cyan-400" />
                      3-YEAR STRATEGY BACKTEST SIMULATION
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Comparing FINAGENT 10-Agent Conviction Strategy vs NIFTY 50 Total Return Benchmark.
                    </p>
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-emerald-950 text-emerald-300 border border-emerald-800">
                    Alpha: +10.6%
                  </span>
                </div>

                {/* Backtest Metrics Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 text-xs font-mono">
                    <span className="text-slate-400">FINAGENT 3Y CAGR</span>
                    <div className="text-lg font-bold text-emerald-400 mt-1">24.8%</div>
                    <span className="text-[10px] text-slate-500">Benchmark: 14.2%</span>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 text-xs font-mono">
                    <span className="text-slate-400">Sharpe Ratio</span>
                    <div className="text-lg font-bold text-white mt-1">1.84</div>
                    <span className="text-[10px] text-slate-500">NIFTY: 1.12</span>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 text-xs font-mono">
                    <span className="text-slate-400">Max Drawdown</span>
                    <div className="text-lg font-bold text-rose-400 mt-1">-11.8%</div>
                    <span className="text-[10px] text-slate-500">NIFTY: -18.4%</span>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 text-xs font-mono">
                    <span className="text-slate-400">Signal Win Rate</span>
                    <div className="text-lg font-bold text-cyan-400 mt-1">72.4%</div>
                    <span className="text-[10px] text-slate-500">Profit Factor: 2.65</span>
                  </div>
                </div>

                {/* Growth Curve Chart */}
                <div className="h-64 w-full pt-2">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={backtestData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                      <XAxis dataKey="period" stroke="#64748b" tick={{ fontSize: 11 }} />
                      <YAxis stroke="#64748b" tick={{ fontSize: 11 }} tickFormatter={(val) => `₹${val}`} />
                      <Tooltip
                        contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '12px' }}
                      />
                      <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                      <Line
                        type="monotone"
                        dataKey="finagent"
                        name="FINAGENT Multi-Agent Conviction (Base ₹100)"
                        stroke="#06b6d4"
                        strokeWidth={3}
                        dot={{ r: 3 }}
                      />
                      <Line
                        type="monotone"
                        dataKey="nifty50"
                        name="NIFTY 50 Benchmark (Base ₹100)"
                        stroke="#94a3b8"
                        strokeWidth={2}
                        strokeDasharray="4 4"
                        dot={false}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>

                <EducationalDisclaimer
                  variant="footer"
                  actionContext="BUY_SELL_HOLD"
                  customText="Educational-Use Disclaimer: Multi-year strategy backtests, simulated alpha, and Sharpe ratios are hypothetical mathematical calculations for educational analysis. Past simulated performance does not guarantee future results."
                />
              </div>
            )}
          </div>

          {/* Active Paper Portfolio Holdings Summary */}
          {holdings.length > 0 && (
            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800 flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-bold text-white flex items-center gap-1.5">
                    <Briefcase className="w-3.5 h-3.5 text-cyan-400" />
                    <span>ACTIVE SIMULATED PAPER HOLDINGS ({holdings.length} Positions)</span>
                  </span>
                  <span className="text-[9px] px-2 py-0.5 rounded-full bg-indigo-950/80 text-indigo-300 border border-indigo-800/60 font-mono font-semibold">
                    100% Isolated from Core Portfolio
                  </span>
                </div>
                <span className="text-[10px] font-mono text-slate-400">
                  Total Paper Equity: ₹{currentHoldingsValue.toLocaleString()}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                {holdings.map((h) => {
                  const currPrice = stocks[h.symbol]?.price ?? h.currentPrice;
                  const posValue = Math.round(h.shares * currPrice);
                  const pnl = Math.round(posValue - h.shares * h.avgBuyPrice);
                  const pnlPercent = Number(((pnl / (h.shares * h.avgBuyPrice)) * 100).toFixed(1));

                  return (
                    <div
                      key={h.symbol}
                      onClick={() => {
                        setOrderSymbol(h.symbol);
                        setOrderType('SELL');
                        setSharesInput(Math.min(h.shares, 20));
                        setRationale(`Trimming position in ${h.symbol} from Paper Trading Lab`);
                      }}
                      className="p-3 rounded-xl bg-slate-950/80 border border-slate-800/80 hover:border-slate-700 transition-all cursor-pointer group"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-white font-mono text-xs group-hover:text-cyan-400 transition-colors">
                          {h.symbol}
                        </span>
                        <span className={`text-[11px] font-mono font-bold ${pnl >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {pnl >= 0 ? '+' : ''}{pnlPercent}%
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-400 mt-1 flex items-center justify-between">
                        <span>{h.shares} shs @ ₹{h.avgBuyPrice}</span>
                        <span className="text-white font-medium">₹{posValue.toLocaleString()}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="text-[10px] font-mono text-slate-500 pt-1 text-right">
                💡 Click any holding card to populate the order ticket for exit or rebalancing
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ================================================================= */}
      {/* BROWSE ALL 2,570+ STOCKS & ETFS CATALOG MODAL                     */}
      {/* ================================================================= */}
      {showCatalogModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-3 sm:p-5 animate-fadeIn">
          <div className="relative w-full max-w-4xl max-h-[90vh] bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl flex flex-col overflow-hidden">
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/90">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
                  <Database className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white tracking-wide flex items-center gap-2">
                    <span>Indian Exchange Directory</span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-950 border border-indigo-800 text-indigo-300 font-mono">
                      2,570+ Stocks &amp; ETFs
                    </span>
                  </h3>
                  <p className="text-xs text-slate-400">
                    Select any listed stock across NSE &amp; BSE to execute virtual paper trades without automatic resets.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowCatalogModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                title="Close Modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Search & Filters */}
            <div className="p-4 bg-slate-900/95 border-b border-slate-800 space-y-3">
              <div className="flex items-center gap-2 flex-col sm:flex-row">
                {/* Search input */}
                <div className="relative flex-1 w-full">
                  <Search className="w-4 h-4 text-slate-500 absolute left-3 top-3 pointer-events-none" />
                  <input
                    type="text"
                    value={catalogSearch}
                    onChange={(e) => {
                      setCatalogSearch(e.target.value);
                      setCatalogPage(1);
                    }}
                    placeholder="Search by ticker (e.g. RELIANCE), company name (Tata), BSE Code (500325), or ISIN..."
                    className="w-full bg-slate-950 border border-slate-700 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 rounded-xl py-2 pl-9 pr-10 text-white font-mono text-xs placeholder:text-slate-600"
                    autoFocus
                  />
                  {catalogSearch && (
                    <button
                      type="button"
                      onClick={() => {
                        setCatalogSearch('');
                        setCatalogPage(1);
                      }}
                      className="absolute right-3 top-2.5 text-slate-400 hover:text-white"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {/* Exchange filter buttons */}
                <div className="flex items-center gap-1 self-start sm:self-auto bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs font-mono">
                  {(['ALL', 'NSE', 'BSE', 'DUAL'] as const).map((ex) => (
                    <button
                      key={ex}
                      type="button"
                      onClick={() => {
                        setCatalogExchange(ex);
                        setCatalogPage(1);
                      }}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all ${
                        catalogExchange === ex
                          ? 'bg-indigo-600 text-white shadow-sm'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      {ex === 'ALL' ? 'All (2,570+)' : ex}
                    </button>
                  ))}
                </div>
              </div>

              {/* Sector quick pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-[11px] font-mono no-scrollbar">
                <span className="text-slate-500 text-[10px] shrink-0 flex items-center gap-1">
                  <Filter className="w-3 h-3" /> Sector:
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setCatalogSector('ALL');
                    setCatalogPage(1);
                  }}
                  className={`px-2 py-0.5 rounded-lg shrink-0 transition-colors ${
                    catalogSector === 'ALL'
                      ? 'bg-cyan-950 text-cyan-300 border border-cyan-800 font-bold'
                      : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                  }`}
                >
                  All Sectors
                </button>
                {catalogResult.sectors.slice(0, 10).map((sec) => (
                  <button
                    key={sec.name}
                    type="button"
                    onClick={() => {
                      setCatalogSector(sec.name);
                      setCatalogPage(1);
                    }}
                    className={`px-2 py-0.5 rounded-lg shrink-0 transition-colors ${
                      catalogSector === sec.name
                        ? 'bg-cyan-950 text-cyan-300 border border-cyan-800 font-bold'
                        : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                    }`}
                  >
                    {sec.name} ({sec.count})
                  </button>
                ))}
              </div>
            </div>

            {/* Results List */}
            <div className="flex-1 overflow-y-auto divide-y divide-slate-800/80 p-3 sm:p-4">
              {catalogResult.items.length === 0 ? (
                <div className="p-8 text-center text-slate-400">
                  <AlertTriangle className="w-8 h-8 text-amber-400 mx-auto mb-2 opacity-80" />
                  <p className="text-sm font-semibold text-white">No listed stocks matched your filters</p>
                  <p className="text-xs text-slate-500 mt-1">Try clearing the search term or resetting the sector filter.</p>
                  <button
                    type="button"
                    onClick={() => {
                      setCatalogSearch('');
                      setCatalogSector('ALL');
                      setCatalogExchange('ALL');
                      setCatalogPage(1);
                    }}
                    className="mt-3 px-3 py-1.5 rounded-lg bg-slate-800 text-cyan-300 text-xs font-mono hover:bg-slate-700"
                  >
                    Reset All Filters
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                  {catalogResult.items.map((item) => {
                    const isSelected = item.symbol.toUpperCase() === cleanSymbol;
                    return (
                      <div
                        key={item.symbol}
                        className={`p-3 rounded-xl border transition-all flex items-center justify-between ${
                          isSelected
                            ? 'bg-cyan-950/30 border-cyan-500/60 shadow-md shadow-cyan-950/40'
                            : 'bg-slate-950/60 border-slate-800 hover:border-slate-700 hover:bg-slate-950'
                        }`}
                      >
                        <div className="min-w-0 flex-1 pr-2">
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-white font-mono text-sm tracking-wide">
                              {item.symbol}
                            </span>
                            <span className="text-[9px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-300 font-mono">
                              {item.exchange}
                            </span>
                            {item.isPopular && (
                              <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-950/80 text-amber-300 border border-amber-800/50 font-semibold font-mono">
                                Nifty 50
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-slate-300 truncate mt-0.5">
                            {item.name}
                          </div>
                          <div className="text-[10px] text-slate-400 font-mono mt-0.5 flex items-center gap-2">
                            <span>{item.sector}</span>
                            {item.bseCode && <span className="opacity-60">BSE: {item.bseCode}</span>}
                          </div>
                        </div>

                        <div className="text-right flex flex-col items-end gap-1.5 shrink-0">
                          <div className="font-bold text-white font-mono text-xs">
                            ₹{item.price.toLocaleString()}
                          </div>
                          {item.marginOfSafetyPercent !== undefined && item.marginOfSafetyPercent > 0 && (
                            <span className="text-[9px] text-emerald-400 font-mono font-medium">
                              +{item.marginOfSafetyPercent}% MoS
                            </span>
                          )}
                          <button
                            type="button"
                            onClick={() => {
                              handleSelectTargetSymbol(item.symbol);
                              setShowCatalogModal(false);
                            }}
                            className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold transition-all flex items-center gap-1 ${
                              isSelected
                                ? 'bg-cyan-500 text-slate-950 shadow-sm'
                                : 'bg-slate-800 hover:bg-cyan-600 text-slate-200 hover:text-white'
                            }`}
                          >
                            {isSelected ? (
                              <>
                                <Check className="w-3 h-3" />
                                <span>Selected</span>
                              </>
                            ) : (
                              <span>Select to Trade</span>
                            )}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Modal Pagination Footer */}
            <div className="p-3 sm:p-4 bg-slate-950/90 border-t border-slate-800 flex items-center justify-between flex-wrap gap-2 text-xs font-mono">
              <span className="text-slate-400">
                Showing {catalogResult.items.length > 0 ? (catalogResult.page - 1) * 20 + 1 : 0} -{' '}
                {Math.min(catalogResult.page * 20, catalogResult.total)} of{' '}
                <span className="text-white font-bold">{catalogResult.total.toLocaleString()}</span> stocks
              </span>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  disabled={catalogResult.page <= 1}
                  onClick={() => setCatalogPage((p) => Math.max(1, p - 1))}
                  className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="px-2 py-1 text-slate-300">
                  Page <strong className="text-white">{catalogResult.page}</strong> of{' '}
                  <strong className="text-white">{catalogResult.totalPages}</strong>
                </span>
                <button
                  type="button"
                  disabled={catalogResult.page >= catalogResult.totalPages}
                  onClick={() => setCatalogPage((p) => Math.min(catalogResult.totalPages, p + 1))}
                  className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
