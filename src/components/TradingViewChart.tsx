import React, { memo, useState } from 'react';
import { ExternalLink, BarChart2, Eye, X } from 'lucide-react';

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
  theme = 'dark',
  interval = 'D',
  height = 420,
}) => {
  const [showEmbeddedPreview, setShowEmbeddedPreview] = useState(false);
  const tvSymbol = getTradingViewSymbol(symbol);
  const externalTradingViewUrl = `https://in.tradingview.com/chart/?symbol=${encodeURIComponent(tvSymbol)}`;

  return (
    <div className="w-full relative rounded-2xl overflow-hidden border border-slate-800 bg-slate-900/90 shadow-xl flex flex-col">
      {/* Clickable Option Card (Default: Do not show chart, give clickable link) */}
      <div className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-900/40 to-cyan-900/40 border border-cyan-500/30 flex items-center justify-center shrink-0 shadow-inner">
            <BarChart2 className="w-6 h-6 text-cyan-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-sm font-bold text-white font-mono">
                TradingView Studio
              </h4>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-cyan-950 text-cyan-300 border border-cyan-800">
                {tvSymbol}
              </span>
            </div>
            <p className="text-xs text-slate-400 font-mono mt-0.5 max-w-lg">
              Open interactive candlestick chart with multi-timeframe intervals, Fibonacci tools, and technical overlays.
            </p>
          </div>
        </div>

        {/* Primary Clickable Option */}
        <div className="flex items-center gap-2.5 shrink-0">
          <a
            href={externalTradingViewUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-mono text-xs font-bold transition-all shadow-md hover:shadow-cyan-900/40"
            title={`Open ${tvSymbol} live chart in TradingView`}
          >
            <span>Open in TradingView</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>

          {!showEmbeddedPreview ? (
            <button
              onClick={() => setShowEmbeddedPreview(true)}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-750 text-slate-300 hover:text-white border border-slate-700 text-xs font-mono transition-colors"
              title="Preview embedded chart here"
            >
              <Eye className="w-3.5 h-3.5 text-slate-400" />
              <span>Preview</span>
            </button>
          ) : (
            <button
              onClick={() => setShowEmbeddedPreview(false)}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800/80 hover:bg-rose-950/60 text-slate-300 hover:text-rose-300 border border-slate-700 hover:border-rose-700 text-xs font-mono transition-colors"
              title="Hide embedded preview"
            >
              <X className="w-3.5 h-3.5" />
              <span>Hide</span>
            </button>
          )}
        </div>
      </div>

      {/* Embedded preview is strictly hidden by default unless explicitly triggered via preview button */}
      {showEmbeddedPreview && (
        <div
          style={{
            height: typeof height === 'number' ? `${height}px` : height,
            width: '100%',
            minHeight: '380px',
          }}
          className="relative w-full border-t border-slate-800 bg-slate-950"
        >
          <iframe
            title={`TradingView Chart for ${tvSymbol}`}
            src={`https://www.tradingview-widget.com/embed-widget/advanced-chart/?locale=en#${encodeURIComponent(
              JSON.stringify({
                autosize: true,
                symbol: tvSymbol,
                interval: interval || 'D',
                timezone: 'Asia/Kolkata',
                theme: theme || 'dark',
                style: '1',
                locale: 'en',
                enable_publishing: false,
                allow_symbol_change: true,
                calendar: false,
                support_host: 'https://www.tradingview.com',
              })
            )}`}
            className="w-full h-full border-0"
            style={{ width: '100%', height: '100%', display: 'block' }}
            allow="fullscreen"
            allowFullScreen
          />
        </div>
      )}
    </div>
  );
});
