import React, { memo, useState, useMemo } from 'react';
import { ExternalLink, RefreshCw } from 'lucide-react';

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
  height = 460,
}) => {
  const [reloadKey, setReloadKey] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const tvSymbol = getTradingViewSymbol(symbol);

  // Generate direct TradingView iframe widget URL without external loader scripts
  const iframeSrc = useMemo(() => {
    const config = {
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
      hide_top_toolbar: false,
      hide_legend: false,
      save_image: true,
      withdateranges: true,
      hide_side_toolbar: false,
      support_host: 'https://www.tradingview.com',
    };
    return `https://www.tradingview-widget.com/embed-widget/advanced-chart/?locale=en#${encodeURIComponent(JSON.stringify(config))}`;
  }, [tvSymbol, interval, theme]);

  const externalTradingViewUrl = `https://in.tradingview.com/chart/?symbol=${encodeURIComponent(tvSymbol)}`;

  return (
    <div className="w-full relative rounded-2xl overflow-hidden border border-slate-800 bg-slate-950 shadow-2xl flex flex-col">
      {/* Top Bar with TradingView ticker & External link */}
      <div className="flex items-center justify-between px-3 py-2 bg-slate-900 border-b border-slate-800 text-[11px] font-mono text-slate-400">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-white font-bold">{tvSymbol}</span>
          <span className="text-slate-500 hidden sm:inline">• Live TradingView Technical Chart</span>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              setIsLoading(true);
              setReloadKey((k) => k + 1);
            }}
            className="flex items-center gap-1 text-slate-400 hover:text-white transition-colors"
            title="Reload Chart Widget"
          >
            <RefreshCw className="w-3 h-3" />
            <span className="hidden sm:inline">Reload</span>
          </button>

          <a
            href={externalTradingViewUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-cyan-400 hover:text-cyan-300 font-semibold transition-colors"
            title="Open in TradingView Chart Studio"
          >
            <span>Open in TradingView</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </div>

      {/* Main TradingView Direct Embed Iframe */}
      <div
        style={{
          height: typeof height === 'number' ? `${height}px` : height,
          width: '100%',
          minHeight: '380px',
        }}
        className="relative w-full overflow-hidden bg-slate-950"
      >
        {isLoading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/80 z-10 text-slate-400 text-xs font-mono gap-2">
            <RefreshCw className="w-5 h-5 animate-spin text-cyan-400" />
            <span>Loading TradingView Chart...</span>
          </div>
        )}
        <iframe
          key={`${tvSymbol}-${reloadKey}`}
          title={`TradingView Chart for ${tvSymbol}`}
          src={iframeSrc}
          className="w-full h-full border-0"
          style={{ width: '100%', height: '100%', display: 'block' }}
          allow="fullscreen"
          allowFullScreen
          onLoad={() => setIsLoading(false)}
        />
      </div>
    </div>
  );
});
