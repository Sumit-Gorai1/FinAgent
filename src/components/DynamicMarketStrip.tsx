import React, { useState, useEffect, useRef } from 'react';
import {
  TrendingUp,
  TrendingDown,
  Activity,
  Radio,
  CheckCircle2,
  Server,
  Zap,
  Globe2,
  Building2,
} from 'lucide-react';
import { StockResearchData } from '../types';

interface DynamicMarketStripProps {
  stocks: Record<string, StockResearchData>;
  selectedSymbol: string;
  onSelectSymbol: (symbol: string) => void;
  isLiveActive: boolean;
  onToggleLive: () => void;
  lastTickTime?: string;
  onOpenPipeline?: () => void;
  onOpenIndianStocksModal?: () => void;
  feedMode?: 'LIVE_MARKET' | 'SIMULATOR';
  onToggleFeedMode?: () => void;
  latencyMs?: number;
}

export const DynamicMarketStrip: React.FC<DynamicMarketStripProps> = ({
  stocks,
  selectedSymbol,
  onSelectSymbol,
  isLiveActive,
  onToggleLive,
  lastTickTime = 'Just now',
  onOpenPipeline,
  onOpenIndianStocksModal,
  feedMode = 'LIVE_MARKET',
  onToggleFeedMode,
  latencyMs,
}) => {
  const currentStock = stocks[selectedSymbol] || Object.values(stocks)[0];

  // Live Tick Subtle CSS Transition State
  const [priceFlash, setPriceFlash] = useState<'up' | 'down' | null>(null);
  const prevPriceRef = useRef<number | undefined>(currentStock?.price);
  const prevSymbolRef = useRef<string | undefined>(currentStock?.symbol);

  useEffect(() => {
    if (!currentStock) return;
    const currentPrice = currentStock.price;
    const symbol = currentStock.symbol;

    if (prevSymbolRef.current === symbol && prevPriceRef.current !== undefined) {
      if (currentPrice > prevPriceRef.current) {
        setPriceFlash('up');
      } else if (currentPrice < prevPriceRef.current) {
        setPriceFlash('down');
      }

      const timer = setTimeout(() => {
        setPriceFlash(null);
      }, 1000);

      prevPriceRef.current = currentPrice;
      return () => clearTimeout(timer);
    }

    prevSymbolRef.current = symbol;
    prevPriceRef.current = currentPrice;
  }, [currentStock?.price, currentStock?.symbol]);

  const isPositive = currentStock ? currentStock.change >= 0 : true;

  return (
    <div className="bg-slate-900/75 border-y border-slate-800/80 backdrop-blur-md px-3 sm:px-4 py-2 sm:py-2.5 w-full overflow-hidden shadow-lg">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-3 w-full">
        {/* Left: Feed Engine Controls & Active Instrument Telemetry */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <button
            onClick={onToggleLive}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg font-mono text-xs font-bold transition-all ${
              isLiveActive
                ? 'bg-emerald-950/90 text-emerald-300 border border-emerald-600 shadow-sm shadow-emerald-950'
                : 'bg-slate-800 text-slate-400 border border-slate-700 hover:text-slate-200'
            }`}
            title="Toggle Market Feed Stream"
          >
            <Radio
              className={`w-3.5 h-3.5 ${
                isLiveActive ? 'text-emerald-400 animate-pulse' : 'text-slate-500'
              }`}
            />
            <span>{isLiveActive ? 'FEED ACTIVE' : 'STREAM PAUSED'}</span>
            {isLiveActive && (
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
            )}
          </button>

          {/* Mode Switcher: Real Live Market vs Volatility Simulator */}
          {onToggleFeedMode && (
            <button
              onClick={onToggleFeedMode}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg font-mono text-[11px] font-bold border transition-all ${
                feedMode === 'LIVE_MARKET'
                  ? 'bg-cyan-950/80 text-cyan-300 border-cyan-500/70 shadow-sm shadow-cyan-950'
                  : 'bg-indigo-950/80 text-indigo-300 border-indigo-600/70'
              }`}
              title="Toggle between Real Live Market Feed and Volatility Simulator"
            >
              <Activity className="w-3.5 h-3.5 text-cyan-400" />
              <span>{feedMode === 'LIVE_MARKET' ? 'LIVE MARKET' : 'SIMULATOR'}</span>
            </button>
          )}

          {/* Real-time Gateway Latency Indicator */}
          {latencyMs !== undefined && (
            <div
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-mono text-[11px] font-semibold border ${
                latencyMs < 50
                  ? 'bg-emerald-950/40 text-emerald-300 border-emerald-800/60'
                  : latencyMs < 200
                  ? 'bg-cyan-950/40 text-cyan-300 border-cyan-800/60'
                  : 'bg-amber-950/40 text-amber-300 border-amber-800/60'
              }`}
              title={`Gateway Round-trip Latency: ${latencyMs}ms (Hot Memory Cache)`}
            >
              <Zap className="w-3 h-3 text-amber-400" />
              <span>{latencyMs < 1 ? '<1' : latencyMs.toFixed(1)}ms</span>
            </div>
          )}

          {/* Active Stock Live Quote Card */}
          {currentStock && (
            <div className="flex flex-wrap items-center gap-2 sm:gap-3 px-2.5 sm:px-3 py-1.5 bg-slate-950/80 border border-slate-800 rounded-xl font-mono text-xs max-w-full">
              <span className="font-bold text-white flex items-center gap-1.5">
                <span className="text-cyan-400">●</span>
                <span>{currentStock.symbol}</span>
                <span className="text-[10px] text-slate-400 font-normal truncate max-w-[120px] sm:max-w-[140px] hidden xs:inline">
                  {currentStock.name}
                </span>
              </span>

              <div className="flex items-center gap-2">
                <div
                  className={`relative px-2 py-0.5 rounded-lg border font-mono transition-all duration-700 ease-out flex items-center gap-1.5 ${
                    priceFlash === 'up'
                      ? 'bg-emerald-950/70 border-emerald-500/60 shadow-[0_0_12px_rgba(16,185,129,0.3)]'
                      : priceFlash === 'down'
                      ? 'bg-rose-950/70 border-rose-500/60 shadow-[0_0_12px_rgba(244,63,94,0.3)]'
                      : 'bg-slate-900/60 border-slate-800/80 shadow-none'
                  }`}
                >
                  <span
                    className={`font-bold transition-colors duration-500 ${
                      priceFlash === 'up'
                        ? 'text-emerald-300'
                        : priceFlash === 'down'
                        ? 'text-rose-300'
                        : 'text-white'
                    }`}
                  >
                    {currentStock.currency}
                    {currentStock.price.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </span>

                  {/* Micro tick direction indicator */}
                  {priceFlash === 'up' && (
                    <span className="inline-flex items-center text-emerald-400 text-[10px] animate-pulse font-bold">
                      ▲
                    </span>
                  )}
                  {priceFlash === 'down' && (
                    <span className="inline-flex items-center text-rose-400 text-[10px] animate-pulse font-bold">
                      ▼
                    </span>
                  )}
                </div>

                <span
                  className={`flex items-center text-[11px] font-bold transition-colors duration-500 ${
                    isPositive ? 'text-emerald-400' : 'text-rose-400'
                  }`}
                >
                  {isPositive ? (
                    <TrendingUp className="w-3 h-3 mr-0.5 inline" />
                  ) : (
                    <TrendingDown className="w-3 h-3 mr-0.5 inline" />
                  )}
                  {isPositive ? '+' : ''}
                  {currentStock.changePercent.toFixed(2)}%
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Right: Direct Search Box & Exchange Pipeline Ingress Status */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3 w-full md:w-auto">
          {onOpenPipeline && (
            <button
              onClick={onOpenPipeline}
              className="hidden sm:flex items-center gap-2 px-2.5 py-1 bg-slate-950/90 hover:bg-slate-900 border border-slate-700/80 hover:border-cyan-500/50 rounded-lg text-xs font-mono transition-all text-slate-300 group"
              title="Inspect Direct Exchange Market Data Feeds"
            >
              <Globe2 className="w-3.5 h-3.5 text-cyan-400 group-hover:rotate-45 transition-transform" />
              <span className="text-[11px] font-semibold text-slate-300">Market Feeds</span>
              <span className="px-1.5 py-0.2 rounded bg-emerald-950 text-emerald-300 border border-emerald-800 text-[10px] font-bold">
                1.2ms
              </span>
            </button>
          )}

          {/* Direct Button to open Indian Stock Directory (2,570+ Equities) */}
          {onOpenIndianStocksModal && (
            <button
              type="button"
              onClick={onOpenIndianStocksModal}
              className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/80 hover:border-emerald-500/60 rounded-lg text-xs font-mono flex items-center gap-1.5 transition-colors shrink-0"
              title="Open Master Directory of All 2,570+ Indian Listed Companies"
            >
              <Building2 className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden xl:inline font-medium">All Indian Stocks</span>
              <span className="text-[10px] px-1 rounded bg-emerald-950 text-emerald-300 border border-emerald-800 font-bold">
                2,570+
              </span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

