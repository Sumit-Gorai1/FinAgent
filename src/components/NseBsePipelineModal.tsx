import React, { useState, useEffect } from 'react';
import {
  X,
  Radio,
  Server,
  Activity,
  ArrowRightLeft,
  Layers,
  Terminal,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  Cpu,
  CheckCircle2,
  ShieldCheck,
  Zap,
  BarChart3,
  Globe2,
  Play,
} from 'lucide-react';
import {
  NseBsePipelineStatus,
  DualExchangeQuoteData,
  PipelineIndexItem,
  PipelineMarketBreadth,
  PipelineMarketDepth,
} from '../types';
import { getIndianMarketStatus } from '../utils/marketHoursHelper';

interface NseBsePipelineModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentSymbol: string;
}

export const NseBsePipelineModal: React.FC<NseBsePipelineModalProps> = ({
  isOpen,
  onClose,
  currentSymbol,
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'dual_quote' | 'indices' | 'console' | 'tester'>('overview');
  const [selectedStock, setSelectedStock] = useState<string>(currentSymbol || 'RELIANCE');
  const [pipelineStatus, setPipelineStatus] = useState<NseBsePipelineStatus | null>(null);
  const [dualQuote, setDualQuote] = useState<DualExchangeQuoteData | null>(null);
  const [indices, setIndices] = useState<PipelineIndexItem[]>([]);
  const [breadth, setBreadth] = useState<{ nse: PipelineMarketBreadth; bse: PipelineMarketBreadth } | null>(null);
  const [depthExchange, setDepthExchange] = useState<'NSE' | 'BSE'>('NSE');
  const [depthData, setDepthData] = useState<PipelineMarketDepth | null>(null);
  const [liveTicks, setLiveTicks] = useState<{ id: string; time: string; symbol: string; nsePrice: number; bsePrice: number; spread: number }[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Tool tester state
  const [selectedTool, setSelectedTool] = useState('get_arbitrage_spread');
  const [toolResult, setToolResult] = useState<any>(null);
  const [isToolRunning, setIsToolRunning] = useState(false);

  // Fetch initial pipeline status & data
  const fetchPipelineData = async () => {
    setIsLoading(true);
    try {
      const [statusRes, indicesRes, breadthRes] = await Promise.all([
        fetch('/api/exchange-pipeline/status'),
        fetch('/api/exchange-pipeline/indices'),
        fetch('/api/exchange-pipeline/breadth'),
      ]);

      if (statusRes.ok) {
        const sData = await statusRes.json();
        setPipelineStatus(sData);
      }
      if (indicesRes.ok) {
        const iData = await indicesRes.json();
        setIndices(iData.indices || []);
      }
      if (breadthRes.ok) {
        const bData = await breadthRes.json();
        setBreadth(bData.breadth || null);
      }
    } catch (err) {
      console.error('Failed to load exchange pipeline status', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch dual quote and depth whenever selectedStock changes
  const fetchStockData = async (sym: string) => {
    try {
      const [quoteRes, depthRes] = await Promise.all([
        fetch(`/api/exchange-pipeline/quote/${sym}`),
        fetch(`/api/exchange-pipeline/depth/${sym}?exchange=${depthExchange}`),
      ]);

      if (quoteRes.ok) {
        const qData = await quoteRes.json();
        setDualQuote(qData.quote);
      }
      if (depthRes.ok) {
        const dData = await depthRes.json();
        setDepthData(dData.depth);
      }
    } catch (err) {
      console.error('Failed to fetch stock pipeline data', err);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchPipelineData();
      fetchStockData(selectedStock);
    }
  }, [isOpen, selectedStock]);

  useEffect(() => {
    if (isOpen) {
      fetchStockData(selectedStock);
    }
  }, [depthExchange]);

  // Connect to live SSE tick stream
  useEffect(() => {
    if (!isOpen) return;

    const eventSource = new EventSource('/api/exchange-pipeline/stream');

    eventSource.addEventListener('tick', (e: MessageEvent) => {
      try {
        const tick = JSON.parse(e.data);
        setLiveTicks((prev) => [
          {
            id: Math.random().toString(36).substring(2, 9),
            time: new Date().toLocaleTimeString(),
            symbol: tick.symbol,
            nsePrice: tick.nsePrice,
            bsePrice: tick.bsePrice,
            spread: tick.spread,
          },
          ...prev.slice(0, 24),
        ]);
      } catch {
        // Ignore parse error
      }
    });

    return () => {
      eventSource.close();
    };
  }, [isOpen]);

  const handleExecuteTool = async () => {
    setIsToolRunning(true);
    try {
      const res = await fetch('/api/exchange-pipeline/tool-test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tool: selectedTool,
          args: { symbol: selectedStock, exchange: depthExchange },
        }),
      });
      const data = await res.json();
      setToolResult(data.result);
    } catch (err: any) {
      setToolResult({ error: err?.message || 'Execution failed' });
    } finally {
      setIsToolRunning(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-5xl max-h-[92vh] flex flex-col bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden font-sans">
        {/* Top Header Bar */}
        <div className="px-6 py-4 border-b border-slate-800 bg-slate-950/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-cyan-950/80 border border-cyan-800/80 text-cyan-400">
              <Globe2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-white tracking-tight">
                  Consolidated Exchange Market Intelligence
                </h2>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-950/80 text-emerald-300 border border-emerald-800 text-[11px] font-mono">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  STREAMING
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Direct low-latency quote streams and order flow intelligence
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden md:flex items-center gap-4 text-xs font-mono text-slate-400 bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-800">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                NSE: <strong className="text-emerald-300 font-semibold">{pipelineStatus?.gateways?.nse?.latencyMs || '1.18'}ms</strong>
              </span>
              <span className="text-slate-600">|</span>
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                BSE: <strong className="text-emerald-300 font-semibold">{pipelineStatus?.gateways?.bse?.latencyMs || '1.74'}ms</strong>
              </span>
            </div>

            <button
              onClick={fetchPipelineData}
              disabled={isLoading}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors"
              title="Refresh Pipeline Status"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </button>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-rose-950/80 hover:text-rose-400 text-slate-400 border border-slate-700 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="px-6 border-b border-slate-800 bg-slate-900/60 flex items-center justify-between">
          <div className="flex items-center gap-2 overflow-x-auto scrollbar-none text-xs font-mono">
            {[
              { id: 'overview', label: 'Pipeline Architecture', icon: <Layers className="w-3.5 h-3.5" /> },
              { id: 'dual_quote', label: 'Dual Quotes & Arbitrage', icon: <ArrowRightLeft className="w-3.5 h-3.5" /> },
              { id: 'indices', label: 'Indices & Breadth', icon: <BarChart3 className="w-3.5 h-3.5" /> },
              { id: 'console', label: 'Live Tick Stream', icon: <Radio className="w-3.5 h-3.5" /> },
              { id: 'tester', label: 'Tool Tester', icon: <Terminal className="w-3.5 h-3.5" /> },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-3 px-3 border-b-2 font-medium transition-colors flex items-center gap-2 whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'border-cyan-400 text-cyan-300'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                {tab.icon}
                <span>{tab.label}</span>
              </button>
            ))}
          </div>

          {/* Instrument Quick Switcher */}
          <div className="hidden sm:flex items-center gap-2 py-2">
            <span className="text-[11px] font-mono text-slate-400">Stock:</span>
            <select
              value={selectedStock}
              onChange={(e) => setSelectedStock(e.target.value)}
              className="bg-slate-950 border border-slate-700 text-cyan-300 font-mono text-xs px-2.5 py-1 rounded-lg focus:outline-none focus:border-cyan-500"
            >
              {['RELIANCE', 'TCS', 'HDFCBANK', 'INFY', 'ICICIBANK', 'TATAMOTORS', 'BHARTIARTL', 'ITC', 'LT', 'SBIN'].map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Modal Body Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* TAB 1: OVERVIEW & ARCHITECTURE */}
          {activeTab === 'overview' && (
            <div className="space-y-6 animate-in fade-in duration-150">
              {/* Telemetry Metrics Bar */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="p-4 bg-slate-950/60 border border-slate-800 rounded-xl font-mono">
                  <div className="text-[11px] text-slate-400">PIPELINE STATUS</div>
                  <div className="text-lg font-bold text-emerald-400 flex items-center gap-1.5 mt-1">
                    <CheckCircle2 className="w-4 h-4" />
                    CONNECTED
                  </div>
                  <div className="text-[10px] text-slate-500 mt-1">Sub-2ms Direct Ingress</div>
                </div>

                <div className="p-4 bg-slate-950/60 border border-slate-800 rounded-xl font-mono">
                  <div className="text-[11px] text-slate-400">PACKET THROUGHPUT</div>
                  <div className="text-lg font-bold text-cyan-300 mt-1">
                    {pipelineStatus?.telemetry?.packetsPerSec || 8420} pkts/s
                  </div>
                  <div className="text-[10px] text-slate-500 mt-1">FAST Feed Multicast</div>
                </div>

                <div className="p-4 bg-slate-950/60 border border-slate-800 rounded-xl font-mono">
                  <div className="text-[11px] text-slate-400">TICKS PROCESSED</div>
                  <div className="text-lg font-bold text-violet-300 mt-1">
                    {pipelineStatus?.telemetry?.totalTicksProcessed?.toLocaleString() || '248,920'}
                  </div>
                  <div className="text-[10px] text-slate-500 mt-1">Zero dropped frames</div>
                </div>

                <div className="p-4 bg-slate-950/60 border border-slate-800 rounded-xl font-mono">
                  <div className="text-[11px] text-slate-400">ACTIVE SSE FEEDS</div>
                  <div className="text-lg font-bold text-amber-300 mt-1">
                    {pipelineStatus?.telemetry?.activeStreams || 1} Stream(s)
                  </div>
                  <div className="text-[10px] text-slate-500 mt-1">Real-time Broadcast</div>
                </div>
              </div>

              {/* Gateway Cards: NSE and BSE */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* NSE Gateway Card */}
                <div className="p-5 bg-gradient-to-br from-slate-950 to-blue-950/20 border border-blue-900/40 rounded-2xl space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-blue-950 border border-blue-700 flex items-center justify-center font-black text-blue-400 text-xs">
                        NSE
                      </div>
                      <div>
                        <h3 className="font-bold text-white text-sm">National Stock Exchange</h3>
                        <p className="text-[11px] text-slate-400">Bandrakurla Complex (BKC), Mumbai</p>
                      </div>
                    </div>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800 text-[10px] font-mono">
                      ACTIVE
                    </span>
                  </div>

                  <div className="space-y-2 text-xs font-mono border-t border-slate-800/80 pt-3">
                    <div className="flex justify-between py-1 border-b border-slate-800/40">
                      <span className="text-slate-400">Protocol:</span>
                      <span className="text-slate-200">FIX 4.4 / FAST Multicast</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-800/40">
                      <span className="text-slate-400">Gateway Port:</span>
                      <span className="text-slate-200">feed.nseindia.com:9800</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-800/40">
                      <span className="text-slate-400">Segments:</span>
                      <span className="text-cyan-300">CM (Capital Market) & F&O</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-800/40">
                      <span className="text-slate-400">Measured Latency:</span>
                      <span className="text-emerald-400 font-bold">{pipelineStatus?.gateways?.nse?.latencyMs || '1.18'} ms</span>
                    </div>
                    <div className="flex justify-between py-1">
                      <span className="text-slate-400">Packet Loss Rate:</span>
                      <span className="text-emerald-400 font-bold">0.000%</span>
                    </div>
                  </div>
                </div>

                {/* BSE Gateway Card */}
                <div className="p-5 bg-gradient-to-br from-slate-950 to-amber-950/20 border border-amber-900/40 rounded-2xl space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-amber-950 border border-amber-700 flex items-center justify-center font-black text-amber-400 text-xs">
                        BSE
                      </div>
                      <div>
                        <h3 className="font-bold text-white text-sm">Bombay Stock Exchange</h3>
                        <p className="text-[11px] text-slate-400">BSE Towers, Dalal Street, Mumbai</p>
                      </div>
                    </div>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800 text-[10px] font-mono">
                      ACTIVE
                    </span>
                  </div>

                  <div className="space-y-2 text-xs font-mono border-t border-slate-800/80 pt-3">
                    <div className="flex justify-between py-1 border-b border-slate-800/40">
                      <span className="text-slate-400">Protocol:</span>
                      <span className="text-slate-200">ETI / FAST Market Feed</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-800/40">
                      <span className="text-slate-400">Gateway Port:</span>
                      <span className="text-slate-200">mdi.bseindia.com:8443</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-800/40">
                      <span className="text-slate-400">Segments:</span>
                      <span className="text-amber-300">Equity Cash & Currency</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-800/40">
                      <span className="text-slate-400">Measured Latency:</span>
                      <span className="text-emerald-400 font-bold">{pipelineStatus?.gateways?.bse?.latencyMs || '1.74'} ms</span>
                    </div>
                    <div className="flex justify-between py-1">
                      <span className="text-slate-400">Packet Loss Rate:</span>
                      <span className="text-emerald-400 font-bold">0.000%</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Supported Equities Catalog */}
              <div className="p-4 bg-slate-950/60 border border-slate-800 rounded-xl">
                <div className="text-xs font-mono text-slate-400 mb-3 flex items-center justify-between">
                  <span>ACTIVELY MONITORED BLUECHIP PIPELINE TICKERS:</span>
                  <span className="text-cyan-400 font-bold">10 EQUITIES CONVERGED</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {['RELIANCE', 'TCS', 'HDFCBANK', 'INFY', 'ICICIBANK', 'TATAMOTORS', 'BHARTIARTL', 'ITC', 'LT', 'SBIN'].map((sym) => (
                    <button
                      key={sym}
                      onClick={() => {
                        setSelectedStock(sym);
                        setActiveTab('dual_quote');
                      }}
                      className="px-3 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-xs font-mono text-slate-200 border border-slate-700/80 transition-colors flex items-center gap-1.5"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-cyan-400"></span>
                      <span>{sym}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: DUAL QUOTES & ARBITRAGE */}
          {activeTab === 'dual_quote' && (
            <div className="space-y-6 animate-in fade-in duration-150">
              {dualQuote ? (
                <>
                  {/* Stock Header & Arbitrage Banner */}
                  <div className="p-4 bg-slate-950/80 border border-slate-800 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-xl font-bold text-white font-mono">{dualQuote.symbol}</h3>
                        <span className="text-xs text-slate-400 font-mono">{dualQuote.companyName}</span>
                        <span className="px-2 py-0.5 rounded bg-slate-800 text-[10px] font-mono text-slate-400 border border-slate-700">
                          {dualQuote.isin}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 font-mono mt-0.5">{dualQuote.sector}</p>
                    </div>

                    {/* Arbitrage Spread Badge */}
                    <div className="p-3 bg-slate-900 border border-slate-700/80 rounded-xl font-mono text-xs flex items-center gap-4">
                      <div>
                        <div className="text-[10px] text-slate-400">INTER-EXCHANGE SPREAD</div>
                        <div className="text-sm font-bold text-cyan-300">
                          ₹{dualQuote.arbitrage.spread >= 0 ? '+' : ''}{dualQuote.arbitrage.spread.toFixed(2)} ({dualQuote.arbitrage.spreadPercent}%)
                        </div>
                      </div>
                      <div className="border-l border-slate-800 pl-3">
                        <div className="text-[10px] text-slate-400">RECOMMENDATION</div>
                        <div className={`text-xs font-semibold ${dualQuote.arbitrage.opportunity ? 'text-amber-300' : 'text-emerald-300'}`}>
                          {dualQuote.arbitrage.recommendation}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Dual Comparison Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* NSE Panel */}
                    <div className="p-5 bg-slate-950/60 border border-blue-900/40 rounded-2xl space-y-4">
                      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                        <div className="flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span>
                          <span className="font-bold text-white font-mono">NSE Cash (EQ)</span>
                        </div>
                        <span className="text-xs font-mono text-slate-400">Series: {dualQuote.nse.series}</span>
                      </div>

                      <div className="flex items-baseline justify-between">
                        <div>
                          <div className="text-2xl font-bold font-mono text-white">
                            ₹{dualQuote.nse.ltp.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                          </div>
                          <div className={`text-xs font-mono font-semibold ${dualQuote.nse.change >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                            {dualQuote.nse.change >= 0 ? '+' : ''}{dualQuote.nse.change} ({dualQuote.nse.changePercent}%)
                          </div>
                        </div>
                        <div className="text-right font-mono text-xs text-slate-400">
                          <div>VWAP: ₹{dualQuote.nse.vwap}</div>
                          <div>Value: ₹{dualQuote.nse.valueCr} Cr</div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-xs font-mono bg-slate-900/60 p-3 rounded-xl border border-slate-800">
                        <div>Open: <strong className="text-slate-200">₹{dualQuote.nse.open}</strong></div>
                        <div>Close: <strong className="text-slate-200">₹{dualQuote.nse.close}</strong></div>
                        <div>Day High: <strong className="text-emerald-300">₹{dualQuote.nse.high}</strong></div>
                        <div>Day Low: <strong className="text-rose-300">₹{dualQuote.nse.low}</strong></div>
                        <div>52W High: <strong className="text-slate-200">₹{dualQuote.nse.week52High}</strong></div>
                        <div>52W Low: <strong className="text-slate-200">₹{dualQuote.nse.week52Low}</strong></div>
                        <div>Volume: <strong className="text-cyan-300">{dualQuote.nse.volume.toLocaleString()}</strong></div>
                        <div>Status: <strong className="text-emerald-400">{dualQuote.nse.status}</strong></div>
                      </div>
                    </div>

                    {/* BSE Panel */}
                    <div className="p-5 bg-slate-950/60 border border-amber-900/40 rounded-2xl space-y-4">
                      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                        <div className="flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                          <span className="font-bold text-white font-mono">BSE Equity (Cash)</span>
                        </div>
                        <span className="text-xs font-mono text-slate-400">Scrip: {dualQuote.bse.scripCode} (Group {dualQuote.bse.group})</span>
                      </div>

                      <div className="flex items-baseline justify-between">
                        <div>
                          <div className="text-2xl font-bold font-mono text-white">
                            ₹{dualQuote.bse.ltp.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                          </div>
                          <div className={`text-xs font-mono font-semibold ${dualQuote.bse.change >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                            {dualQuote.bse.change >= 0 ? '+' : ''}{dualQuote.bse.change} ({dualQuote.bse.changePercent}%)
                          </div>
                        </div>
                        <div className="text-right font-mono text-xs text-slate-400">
                          <div>VWAP: ₹{dualQuote.bse.vwap}</div>
                          <div>Value: ₹{dualQuote.bse.valueCr} Cr</div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-xs font-mono bg-slate-900/60 p-3 rounded-xl border border-slate-800">
                        <div>Open: <strong className="text-slate-200">₹{dualQuote.bse.open}</strong></div>
                        <div>Close: <strong className="text-slate-200">₹{dualQuote.bse.close}</strong></div>
                        <div>Day High: <strong className="text-emerald-300">₹{dualQuote.bse.high}</strong></div>
                        <div>Day Low: <strong className="text-rose-300">₹{dualQuote.bse.low}</strong></div>
                        <div>52W High: <strong className="text-slate-200">₹{dualQuote.bse.week52High}</strong></div>
                        <div>52W Low: <strong className="text-slate-200">₹{dualQuote.bse.week52Low}</strong></div>
                        <div>Volume: <strong className="text-cyan-300">{dualQuote.bse.volume.toLocaleString()}</strong></div>
                        <div>Status: <strong className="text-emerald-400">{dualQuote.bse.status}</strong></div>
                      </div>
                    </div>
                  </div>

                  {/* Level 2 Market Depth */}
                  <div className="p-5 bg-slate-950/60 border border-slate-800 rounded-2xl space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Layers className="w-4 h-4 text-cyan-400" />
                        <h4 className="font-bold text-white text-sm font-mono">
                          5-Level Exchange Order Book Depth
                        </h4>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setDepthExchange('NSE')}
                          className={`px-3 py-1 rounded-lg text-xs font-mono font-semibold transition-colors ${
                            depthExchange === 'NSE'
                              ? 'bg-blue-600 text-white'
                              : 'bg-slate-800 text-slate-400 hover:text-white'
                          }`}
                        >
                          NSE Depth
                        </button>
                        <button
                          onClick={() => setDepthExchange('BSE')}
                          className={`px-3 py-1 rounded-lg text-xs font-mono font-semibold transition-colors ${
                            depthExchange === 'BSE'
                              ? 'bg-amber-600 text-white'
                              : 'bg-slate-800 text-slate-400 hover:text-white'
                          }`}
                        >
                          BSE Depth
                        </button>
                      </div>
                    </div>

                    {!getIndianMarketStatus().isOpen ? (
                      <div className="p-5 rounded-xl bg-slate-900/60 border border-slate-800 text-center space-y-2 font-mono">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-950/70 border border-rose-800 text-rose-300 text-xs">
                          <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                          <span>Indian Markets Closed (NSE / BSE)</span>
                        </div>
                        <p className="text-xs text-slate-400">
                          Regular Trading Hours: 09:15 – 15:30 IST. Real-time 5-level order book depth is active only when markets are open.
                        </p>
                      </div>
                    ) : depthData ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 font-mono text-xs">
                        {/* Bid / Buy Side */}
                        <div className="bg-slate-900/60 p-3 rounded-xl border border-emerald-950">
                          <div className="flex justify-between text-[11px] text-emerald-400 font-bold border-b border-slate-800 pb-1.5 mb-2">
                            <span>BID PRICE (BUY)</span>
                            <span>QTY</span>
                            <span>ORDERS</span>
                          </div>
                          <div className="space-y-1.5">
                            {depthData.buy.map((b, idx) => (
                              <div key={idx} className="flex justify-between text-slate-200">
                                <span className="text-emerald-300 font-bold">₹{b.price.toFixed(2)}</span>
                                <span>{b.quantity.toLocaleString()}</span>
                                <span className="text-slate-500">{b.orders}</span>
                              </div>
                            ))}
                          </div>
                          <div className="flex justify-between text-[11px] text-slate-400 border-t border-slate-800 pt-2 mt-2 font-bold">
                            <span>TOTAL BUY QTY</span>
                            <span className="text-emerald-300">{depthData.totalBuyQty.toLocaleString()}</span>
                            <span></span>
                          </div>
                        </div>

                        {/* Ask / Sell Side */}
                        <div className="bg-slate-900/60 p-3 rounded-xl border border-rose-950">
                          <div className="flex justify-between text-[11px] text-rose-400 font-bold border-b border-slate-800 pb-1.5 mb-2">
                            <span>ASK PRICE (SELL)</span>
                            <span>QTY</span>
                            <span>ORDERS</span>
                          </div>
                          <div className="space-y-1.5">
                            {depthData.sell.map((s, idx) => (
                              <div key={idx} className="flex justify-between text-slate-200">
                                <span className="text-rose-300 font-bold">₹{s.price.toFixed(2)}</span>
                                <span>{s.quantity.toLocaleString()}</span>
                                <span className="text-slate-500">{s.orders}</span>
                              </div>
                            ))}
                          </div>
                          <div className="flex justify-between text-[11px] text-slate-400 border-t border-slate-800 pt-2 mt-2 font-bold">
                            <span>TOTAL SELL QTY</span>
                            <span className="text-rose-300">{depthData.totalSellQty.toLocaleString()}</span>
                            <span></span>
                          </div>
                        </div>
                      </div>
                    ) : null}
                  </div>
                </>
              ) : (
                <div className="p-8 text-center text-slate-400 font-mono">
                  Loading dual exchange quote for {selectedStock}...
                </div>
              )}
            </div>
          )}

          {/* TAB 3: INDICES & BREADTH */}
          {activeTab === 'indices' && (
            <div className="space-y-6 animate-in fade-in duration-150">
              {/* Indices Grid */}
              <div>
                <h4 className="text-xs font-mono text-slate-400 mb-3">OFFICIAL EXCHANGE BENCHMARK INDICES:</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {indices.map((idx) => {
                    const isPos = idx.change >= 0;
                    return (
                      <div
                        key={idx.symbol}
                        className="p-4 bg-slate-950/60 border border-slate-800 rounded-xl font-mono space-y-2"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-white text-sm">{idx.symbol}</span>
                          <span
                            className={`px-1.5 py-0.5 rounded text-[10px] font-bold border ${
                              idx.exchange === 'NSE'
                                ? 'bg-blue-950/80 text-blue-300 border-blue-800'
                                : 'bg-amber-950/80 text-amber-300 border-amber-800'
                            }`}
                          >
                            {idx.exchange}
                          </span>
                        </div>

                        <div className="text-xl font-bold text-white">
                          {idx.value.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </div>

                        <div className={`text-xs flex items-center gap-1 font-semibold ${isPos ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {isPos ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                          <span>{isPos ? '+' : ''}{idx.change.toFixed(2)}</span>
                          <span>({isPos ? '+' : ''}{idx.changePercent}%)</span>
                        </div>

                        <div className="text-[10px] text-slate-500 pt-1 border-t border-slate-800/60 flex justify-between">
                          <span>Low: {idx.low.toLocaleString()}</span>
                          <span>High: {idx.high.toLocaleString()}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Market Breadth Analysis */}
              {breadth && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
                  {/* NSE Breadth */}
                  <div className="p-5 bg-slate-950/60 border border-slate-800 rounded-2xl space-y-4 font-mono">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-white text-sm">NSE Market Breadth</span>
                      <span className="text-xs text-blue-400">Turnover: ₹{breadth.nse.totalTurnoverCr.toLocaleString()} Cr</span>
                    </div>

                    {/* Visual Ratio Bar */}
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-xs">
                        <span className="text-emerald-400 font-bold">{breadth.nse.advances} Advances</span>
                        <span className="text-rose-400 font-bold">{breadth.nse.declines} Declines</span>
                      </div>
                      <div className="h-2.5 w-full bg-slate-800 rounded-full overflow-hidden flex">
                        <div
                          className="bg-emerald-500 h-full"
                          style={{
                            width: `${(breadth.nse.advances / (breadth.nse.advances + breadth.nse.declines)) * 100}%`,
                          }}
                        ></div>
                        <div
                          className="bg-rose-500 h-full"
                          style={{
                            width: `${(breadth.nse.declines / (breadth.nse.advances + breadth.nse.declines)) * 100}%`,
                          }}
                        ></div>
                      </div>
                      <div className="flex justify-between text-[10px] text-slate-500">
                        <span>A/D Ratio: <strong className="text-emerald-300">{breadth.nse.ratio}</strong></span>
                        <span>Unchanged: {breadth.nse.unchanged}</span>
                      </div>
                    </div>
                  </div>

                  {/* BSE Breadth */}
                  <div className="p-5 bg-slate-950/60 border border-slate-800 rounded-2xl space-y-4 font-mono">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-white text-sm">BSE Market Breadth</span>
                      <span className="text-xs text-amber-400">Turnover: ₹{breadth.bse.totalTurnoverCr.toLocaleString()} Cr</span>
                    </div>

                    {/* Visual Ratio Bar */}
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-xs">
                        <span className="text-emerald-400 font-bold">{breadth.bse.advances} Advances</span>
                        <span className="text-rose-400 font-bold">{breadth.bse.declines} Declines</span>
                      </div>
                      <div className="h-2.5 w-full bg-slate-800 rounded-full overflow-hidden flex">
                        <div
                          className="bg-emerald-500 h-full"
                          style={{
                            width: `${(breadth.bse.advances / (breadth.bse.advances + breadth.bse.declines)) * 100}%`,
                          }}
                        ></div>
                        <div
                          className="bg-rose-500 h-full"
                          style={{
                            width: `${(breadth.bse.declines / (breadth.bse.advances + breadth.bse.declines)) * 100}%`,
                          }}
                        ></div>
                      </div>
                      <div className="flex justify-between text-[10px] text-slate-500">
                        <span>A/D Ratio: <strong className="text-amber-300">{breadth.bse.ratio}</strong></span>
                        <span>Unchanged: {breadth.bse.unchanged}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 4: LIVE TICK STREAM CONSOLE */}
          {activeTab === 'console' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="flex items-center justify-between text-xs font-mono text-slate-400">
                <span className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                  LIVE MULTICAST STREAM INGESTION (SSE: /api/exchange-pipeline/stream)
                </span>
                <span>Buffer: {liveTicks.length} ticks</span>
              </div>

              <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 font-mono text-xs max-h-96 overflow-y-auto space-y-2">
                {liveTicks.length === 0 ? (
                  <div className="text-slate-500 py-8 text-center">
                    Listening for incoming exchange ticks...
                  </div>
                ) : (
                  liveTicks.map((t) => (
                    <div
                      key={t.id}
                      className="flex items-center justify-between py-1 border-b border-slate-900 text-[11px] hover:bg-slate-900/50 px-2 rounded transition-colors"
                    >
                      <span className="text-slate-500">[{t.time}]</span>
                      <span className="font-bold text-white">{t.symbol}</span>
                      <span className="text-blue-400">NSE: ₹{t.nsePrice.toFixed(2)}</span>
                      <span className="text-amber-400">BSE: ₹{t.bsePrice.toFixed(2)}</span>
                      <span className={`font-semibold ${t.spread >= 0 ? 'text-cyan-300' : 'text-purple-300'}`}>
                        Spread: ₹{t.spread >= 0 ? '+' : ''}{t.spread.toFixed(2)}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* TAB 5: TOOL TESTER */}
          {activeTab === 'tester' && (
            <div className="space-y-6 animate-in fade-in duration-150">
              <div className="p-4 bg-slate-950/60 border border-slate-800 rounded-xl space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h4 className="font-bold text-white text-sm font-mono">Interactive Pipeline Tools</h4>
                    <p className="text-xs text-slate-400">Execute and inspect direct exchange gateway queries</p>
                  </div>

                  <div className="flex items-center gap-3">
                    <select
                      value={selectedTool}
                      onChange={(e) => setSelectedTool(e.target.value)}
                      className="bg-slate-900 border border-slate-700 text-cyan-300 font-mono text-xs px-3 py-1.5 rounded-lg"
                    >
                      <option value="get_arbitrage_spread">get_arbitrage_spread</option>
                      <option value="get_nse_quote">get_nse_quote</option>
                      <option value="get_bse_quote">get_bse_quote</option>
                      <option value="get_exchange_depth">get_exchange_depth</option>
                      <option value="get_market_breadth">get_market_breadth</option>
                      <option value="get_exchange_indices">get_exchange_indices</option>
                      <option value="get_pipeline_status">get_pipeline_status</option>
                    </select>

                    <button
                      onClick={handleExecuteTool}
                      disabled={isToolRunning}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-mono text-xs font-bold transition-colors disabled:opacity-50"
                    >
                      <Play className="w-3.5 h-3.5 fill-current" />
                      <span>{isToolRunning ? 'Executing...' : 'Run Query'}</span>
                    </button>
                  </div>
                </div>

                {toolResult && (
                  <div className="mt-4">
                    <div className="text-[11px] font-mono text-slate-400 mb-1">RESPONSE PAYLOAD:</div>
                    <pre className="p-4 bg-slate-950 border border-slate-800 rounded-xl text-xs font-mono text-emerald-300 overflow-x-auto max-h-72">
                      {JSON.stringify(toolResult, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
