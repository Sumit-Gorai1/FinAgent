import React, { memo } from 'react';
import { ExternalLink, BarChart2 } from 'lucide-react';
import { EducationalDisclaimer } from './EducationalDisclaimer';

interface TradingViewWidgetProps {
  symbol: string;
  theme?: 'dark' | 'light';
  interval?: string;
  height?: number | string;
  autosize?: boolean;
}

// Maps stock tickers to proper TradingView exchanges (e.g. NSE, NASDAQ, NYSE, BSE)
export function getTradingViewSymbol(symbol: string): string {
  if (!symbol) return 'NSE:RELIANCE';
  const clean = symbol.trim().toUpperCase();

  // If already prefixed with an exchange (e.g. NSE:TCS, BSE:INFY, NASDAQ:NVDA)
  if (clean.includes(':')) {
    return clean;
  }

  // Major Indian Index Tickers
  if (clean === 'NIFTY' || clean === 'NIFTY 50' || clean === 'NIFTY50') {
    return 'NSE:NIFTY';
  }
  if (clean === 'BANKNIFTY' || clean === 'NIFTY BANK') {
    return 'NSE:BANKNIFTY';
  }
  if (clean === 'SENSEX' || clean === 'BSE SENSEX') {
    return 'BSE:SENSEX';
  }

  // Common US Tech & Indexes
  if (['NVDA', 'AAPL', 'MSFT', 'GOOGL', 'AMZN', 'META', 'TSLA', 'AMD', 'NFLX', 'INTC', 'CRM'].includes(clean)) {
    return `NASDAQ:${clean}`;
  }
  if (['SPY', 'QQQ', 'DIA'].includes(clean)) {
    return `AMEX:${clean}`;
  }

  // Crypto
  if (['BTC', 'BTCUSD', 'ETH', 'ETHUSD'].includes(clean)) {
    return `BINANCE:${clean.replace('USD', '')}USDT`;
  }

  // Default Indian Equities to NSE
  return `NSE:${clean}`;
}

export const TradingViewChart: React.FC<TradingViewWidgetProps> = memo(({
  symbol,
}) => {
  const tvSymbol = getTradingViewSymbol(symbol);
  const externalTradingViewUrl = `https://in.tradingview.com/chart/?symbol=${encodeURIComponent(tvSymbol)}`;

  return (
    <div className="w-full relative rounded-2xl overflow-hidden border border-slate-800 bg-slate-900/90 shadow-xl p-5 space-y-4">
      {/* Clickable Option Card (Only a clickable option; does not embed or render charts) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-900/40 to-cyan-900/40 border border-cyan-500/30 flex items-center justify-center shrink-0 shadow-inner">
            <BarChart2 className="w-6 h-6 text-cyan-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-sm font-bold text-white font-mono">
                TradingView Interactive Workspace
              </h4>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-cyan-950 text-cyan-300 border border-cyan-800">
                {tvSymbol}
              </span>
            </div>
            <p className="text-xs text-slate-400 font-mono mt-0.5 max-w-xl">
              Launch live multi-timeframe candlestick chart, Fibonacci retracements, multi-indicator overlays, and drawing tools directly in TradingView.
            </p>
          </div>
        </div>

        {/* Primary Clickable Option Only */}
        <div className="flex items-center gap-2.5 shrink-0">
          <a
            href={externalTradingViewUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-mono text-xs font-bold transition-all shadow-md hover:shadow-cyan-900/40 cursor-pointer"
            title={`Open ${tvSymbol} live chart in TradingView`}
          >
            <span>Open in TradingView</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>

      {/* Educational Use Disclaimer */}
      <EducationalDisclaimer
        variant="compact"
        actionContext="BUY_SELL_HOLD"
        customText="Educational-Use Disclaimer: Technical indicators, moving averages, and pattern signals viewed on TradingView or FINAGENT are strictly for simulated educational and research exploration only. Not SEBI-registered financial advisory."
      />
    </div>
  );
});
