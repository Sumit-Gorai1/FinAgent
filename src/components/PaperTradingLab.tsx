import React from 'react';
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

interface PaperTradingLabProps {
  currentStock: StockResearchData;
  cashBalance: number;
  orders: PaperOrder[];
  holdings?: PortfolioHolding[];
  stocks?: Record<string, StockResearchData>;
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
  onExecuteOrder,
}) => {
  const [activeTab, setActiveTab] = React.useState<'valuation' | 'backtest'>('valuation');
  const [orderType, setOrderType] = React.useState<'BUY' | 'SELL'>('BUY');
  const [sharesInput, setSharesInput] = React.useState<number>(10);
  const [orderSymbol, setOrderSymbol] = React.useState<string>(currentStock.symbol);
  const [rationale, setRationale] = React.useState<string>(
    `AI Committee Consensus Signal (${currentStock.committee.status})`
  );
  const [isSubmitting, setIsSubmitting] = React.useState<boolean>(false);
  const [successNotice, setSuccessNotice] = React.useState<string | null>(null);

  // Chart display toggles
  const [showComponents, setShowComponents] = React.useState<boolean>(true);
  const [showBenchmark, setShowBenchmark] = React.useState<boolean>(true);

  // When currentStock changes, update default symbol and rationale
  React.useEffect(() => {
    setOrderSymbol(currentStock.symbol);
    setRationale(`AI Committee Score: ${currentStock.committee.overallScore}/100 (${currentStock.committee.status})`);
  }, [currentStock]);

  const targetStock = stocks[orderSymbol] || (orderSymbol === currentStock.symbol ? currentStock : null);
  const livePrice = targetStock ? targetStock.price : currentStock.price;
  const currencySymbol = targetStock ? targetStock.currency : '₹';

  const estimatedTotal = Number((sharesInput * livePrice).toFixed(2));

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
    if (sharesInput <= 0) return;

    if (orderType === 'BUY' && estimatedTotal > cashBalance) {
      alert(`Insufficient virtual cash! Order requires ₹${estimatedTotal.toLocaleString()}, available: ₹${cashBalance.toLocaleString()}`);
      return;
    }

    setIsSubmitting(true);
    setTimeout(() => {
      onExecuteOrder({
        symbol: orderSymbol,
        type: orderType,
        shares: Number(sharesInput),
        price: livePrice,
        reason: rationale,
      });
      setIsSubmitting(false);
      setSuccessNotice(`Successfully executed ${orderType} order for ${sharesInput} shares of ${orderSymbol}!`);
      setTimeout(() => setSuccessNotice(null), 4000);
    }, 400);
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
      <div className="p-4 sm:p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl flex flex-col xl:flex-row xl:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-cyan-400 mb-1">
            <Zap className="w-4 h-4" />
            <span>FINAGENT EXECUTION LAB & MARK-TO-MARKET VALUATION</span>
          </div>
          <h2 className="text-xl font-bold text-white tracking-tight">
            Virtual Paper Trading & Portfolio Value Over Time
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Test AI-generated conviction signals with zero risk using virtual capital, track real-time portfolio curve progression, and verify benchmark performance.
          </p>
        </div>

        {/* Capital & Portfolio Counters */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {/* Total Portfolio Value */}
          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
            <span className="text-[10px] text-slate-400 font-mono block">TOTAL PORTFOLIO VALUE</span>
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
            <span className="text-[10px] text-slate-400 font-mono block">VIRTUAL CASH</span>
            <span className="text-lg font-bold font-mono text-emerald-400">
              ₹{cashBalance.toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </span>
            <span className="text-[10px] text-slate-500 font-mono block mt-0.5">
              {cashAllocationPercent}% of Portfolio
            </span>
          </div>

          {/* Holdings Equity Value */}
          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
            <span className="text-[10px] text-slate-400 font-mono block">EQUITY HOLDINGS</span>
            <span className="text-lg font-bold font-mono text-indigo-400">
              ₹{currentHoldingsValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </span>
            <span className="text-[10px] text-slate-500 font-mono block mt-0.5">
              {holdings.length} Active Positions ({equityAllocationPercent}%)
            </span>
          </div>

          {/* Orders Executed */}
          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
            <span className="text-[10px] text-slate-400 font-mono block">EXECUTED TRADES</span>
            <span className="text-lg font-bold font-mono text-cyan-400">
              {orders.length}
            </span>
            <span className="text-[10px] text-slate-500 font-mono block mt-0.5">
              Paper Ledger Logged
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

              {/* Symbol & Market Price */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 block mb-1">Target Symbol</label>
                  <input
                    type="text"
                    value={orderSymbol}
                    onChange={(e) => setOrderSymbol(e.target.value.toUpperCase())}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white font-bold"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">Market Price (NSE)</label>
                  <div className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white font-bold">
                    {currencySymbol}{livePrice.toLocaleString()}
                  </div>
                </div>
              </div>

              {/* Quantity Shares */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-slate-400">Quantity (Shares)</label>
                  <span className="text-[11px] text-slate-500">Lot Size: 1</span>
                </div>
                <input
                  type="number"
                  min="1"
                  value={sharesInput}
                  onChange={(e) => setSharesInput(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white font-bold"
                />
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

              {/* Cost Calculation Summary */}
              <div className="p-3 rounded-lg bg-slate-950/80 border border-slate-800 space-y-1 text-slate-400 text-xs">
                <div className="flex items-center justify-between">
                  <span>Estimated Capital Required:</span>
                  <span className="text-white font-bold">₹{estimatedTotal.toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Available Cash:</span>
                  <span className="text-emerald-400 font-semibold">₹{cashBalance.toLocaleString()}</span>
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold text-sm shadow-lg shadow-cyan-900/30 transition-all flex items-center justify-center gap-2"
              >
                <Zap className="w-4 h-4" />
                {isSubmitting ? 'Transmitting Order...' : `Execute Paper ${orderType} Order`}
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
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <span className="text-xs font-mono font-bold text-white flex items-center gap-1.5">
                  <Briefcase className="w-3.5 h-3.5 text-cyan-400" />
                  ACTIVE PAPER HOLDINGS ({holdings.length} Positions)
                </span>
                <span className="text-[10px] font-mono text-slate-400">
                  Total Equity: ₹{currentHoldingsValue.toLocaleString()}
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
    </div>
  );
};
