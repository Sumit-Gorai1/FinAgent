import React, { useState, useEffect } from 'react';
import { Layers, Activity, TrendingUp, TrendingDown, Clock, ShieldCheck } from 'lucide-react';
import { isOrderDepthActiveForStock } from '../utils/marketHoursHelper';

interface OrderLevel {
  price: number;
  shares: number;
  total: number;
  percent: number;
}

interface TradeTick {
  id: string;
  time: string;
  price: number;
  shares: number;
  type: 'BUY' | 'SELL';
}

interface DynamicOrderDepthProps {
  currentPrice: number;
  symbol: string;
  currency?: string;
  isLiveActive?: boolean;
}

export const DynamicOrderDepth: React.FC<DynamicOrderDepthProps> = ({
  currentPrice,
  symbol,
  currency = '₹',
  isLiveActive = true,
}) => {
  const isMarketOpen = isOrderDepthActiveForStock(symbol, currency);
  const [bids, setBids] = useState<OrderLevel[]>([]);
  const [asks, setAsks] = useState<OrderLevel[]>([]);
  const [recentTrades, setRecentTrades] = useState<TradeTick[]>([]);
  const [buyRatio, setBuyRatio] = useState<number>(56);

  // Generate order depth levels relative to currentPrice ONLY when market is open
  useEffect(() => {
    if (!isMarketOpen) return;

    const spread = 0.05;
    const generateLevels = () => {
      let cumulativeBid = 0;
      const newBids: OrderLevel[] = [1, 2, 3, 4, 5].map((idx) => {
        const p = Number((currentPrice - idx * spread - Math.random() * 0.1).toFixed(2));
        const s = Math.floor(200 + Math.random() * 850);
        cumulativeBid += s;
        return { price: p, shares: s, total: cumulativeBid, percent: 0 };
      });

      let cumulativeAsk = 0;
      const newAsks: OrderLevel[] = [1, 2, 3, 4, 5].map((idx) => {
        const p = Number((currentPrice + idx * spread + Math.random() * 0.1).toFixed(2));
        const s = Math.floor(180 + Math.random() * 750);
        cumulativeAsk += s;
        return { price: p, shares: s, total: cumulativeAsk, percent: 0 };
      });

      const maxBid = newBids[newBids.length - 1].total;
      const maxAsk = newAsks[newAsks.length - 1].total;
      const maxTotal = Math.max(maxBid, maxAsk, 1);

      newBids.forEach((b) => (b.percent = (b.total / maxTotal) * 100));
      newAsks.forEach((a) => (a.percent = (a.total / maxTotal) * 100));

      setBids(newBids);
      setAsks(newAsks);

      const ratio = Math.round((maxBid / (maxBid + maxAsk)) * 100);
      setBuyRatio(Math.min(Math.max(ratio, 35), 75));
    };

    generateLevels();

    if (!isLiveActive) return;

    // Simulate micro order flow ticks every 2.5 seconds
    const interval = setInterval(() => {
      const isBuy = Math.random() > 0.45;
      const slip = (Math.random() * 0.1 - 0.05);
      const tradePrice = Number((currentPrice + slip).toFixed(2));
      const tradeShares = Math.floor(25 + Math.random() * 200) * 5;

      setRecentTrades((prev) => [
        {
          id: Math.random().toString(36).substring(2, 7),
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
          price: tradePrice,
          shares: tradeShares,
          type: isBuy ? 'BUY' : 'SELL',
        },
        ...prev.slice(0, 5),
      ]);

      generateLevels();
    }, 2800);

    return () => clearInterval(interval);
  }, [currentPrice, isLiveActive, isMarketOpen]);

  // If market has closed/is over, do not show real-time orders depth
  if (!isMarketOpen) {
    return null;
  }

  return (
    <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-cyan-400" />
          <h3 className="text-xs font-bold text-white font-mono uppercase tracking-wider">
            Real-Time Order Depth (Level 2)
          </h3>
        </div>
        <span className="text-[10px] font-mono text-emerald-300 bg-emerald-950 border border-emerald-800 px-2 py-0.5 rounded flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
          NSE Order Book Live
        </span>
      </div>

      {/* Liquidity Imbalance Meter */}
      <div className="space-y-1.5">
        <div className="flex justify-between text-[11px] font-mono">
          <span className="text-emerald-400 font-bold">
            Buy Pressure: {buyRatio}%
          </span>
          <span className="text-rose-400 font-bold">
            Sell Pressure: {100 - buyRatio}%
          </span>
        </div>
        <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden flex">
          <div
            className="bg-gradient-to-r from-emerald-500 to-teal-400 h-full transition-all duration-500"
            style={{ width: `${buyRatio}%` }}
          ></div>
          <div
            className="bg-gradient-to-r from-rose-500 to-amber-500 h-full transition-all duration-500"
            style={{ width: `${100 - buyRatio}%` }}
          ></div>
        </div>
      </div>

      {/* Dual Bid/Ask Ladder */}
      <div className="grid grid-cols-2 gap-3 text-xs font-mono">
        {/* Bids (Green) */}
        <div className="space-y-1 bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/80">
          <div className="flex justify-between text-[10px] text-slate-400 font-bold pb-1 border-b border-slate-800">
            <span>Bid Price</span>
            <span>Shares</span>
          </div>
          {bids.map((b, idx) => (
            <div key={idx} className="relative flex justify-between items-center py-0.5 text-[11px]">
              <div
                className="absolute left-0 top-0 bottom-0 bg-emerald-950/50 rounded pointer-events-none transition-all"
                style={{ width: `${b.percent}%` }}
              ></div>
              <span className="relative z-10 text-emerald-400 font-bold">
                {currency}{b.price.toFixed(2)}
              </span>
              <span className="relative z-10 text-slate-300">
                {b.shares.toLocaleString()}
              </span>
            </div>
          ))}
        </div>

        {/* Asks (Red) */}
        <div className="space-y-1 bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/80">
          <div className="flex justify-between text-[10px] text-slate-400 font-bold pb-1 border-b border-slate-800">
            <span>Ask Price</span>
            <span>Shares</span>
          </div>
          {asks.map((a, idx) => (
            <div key={idx} className="relative flex justify-between items-center py-0.5 text-[11px]">
              <div
                className="absolute right-0 top-0 bottom-0 bg-rose-950/50 rounded pointer-events-none transition-all"
                style={{ width: `${a.percent}%` }}
              ></div>
              <span className="relative z-10 text-rose-400 font-bold">
                {currency}{a.price.toFixed(2)}
              </span>
              <span className="relative z-10 text-slate-300">
                {a.shares.toLocaleString()}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Live Trade Tape */}
      <div className="pt-2 border-t border-slate-800/80">
        <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono mb-1.5">
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3 text-cyan-400" />
            Time & Sales Tape
          </span>
          <span>Last 5 Executions</span>
        </div>

        <div className="space-y-1 font-mono text-[11px]">
          {recentTrades.length === 0 ? (
            <div className="text-slate-500 text-[10px] py-1 text-center">
              Listening to market order executions...
            </div>
          ) : (
            recentTrades.map((t) => (
              <div
                key={t.id}
                className="flex items-center justify-between py-0.5 px-2 rounded bg-slate-950/40 border border-slate-800/40"
              >
                <span className="text-slate-400 text-[10px]">{t.time}</span>
                <span
                  className={`font-bold ${
                    t.type === 'BUY' ? 'text-emerald-400' : 'text-rose-400'
                  }`}
                >
                  {currency}{t.price.toFixed(2)}
                </span>
                <span className="text-slate-300 text-[10px]">
                  {t.shares} sh
                </span>
                <span
                  className={`text-[9px] px-1 py-0.2 rounded font-bold ${
                    t.type === 'BUY'
                      ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                      : 'bg-rose-950 text-rose-300 border border-rose-800'
                  }`}
                >
                  {t.type}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
