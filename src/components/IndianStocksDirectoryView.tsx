import React, { useState, useMemo, useEffect } from 'react';
import {
  Search,
  Building2,
  X,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  Filter,
  ArrowUpRight,
  SlidersHorizontal,
  Sparkles,
  Grid,
  List,
  Layers,
  ArrowRight,
  Activity,
  CheckCircle2,
  RefreshCw,
} from 'lucide-react';
import {
  INDIAN_STOCKS_MASTER,
  StockSearchItem,
  filterIndianStocks,
} from '../utils/stockSearchResolver';
import { EducationalDisclaimer } from './EducationalDisclaimer';

interface IndianStocksDirectoryViewProps {
  onSelectStock: (symbol: string) => void;
  currentSymbol?: string;
}

export const IndianStocksDirectoryView: React.FC<IndianStocksDirectoryViewProps> = ({
  onSelectStock,
  currentSymbol,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSector, setSelectedSector] = useState<string>('ALL');
  const [selectedExchange, setSelectedExchange] = useState<string>('ALL');
  const [sortBy, setSortBy] = useState<'symbol' | 'name' | 'price'>('symbol');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(36);
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  // Live current prices fetched directly from live market exchange
  const [currentPrices, setCurrentPrices] = useState<
    Record<string, { price: number; change?: number; changePercent?: number }>
  >({});
  const [isFetchingPrices, setIsFetchingPrices] = useState<boolean>(false);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedSector, selectedExchange, sortBy, sortOrder, pageSize]);

  // Execute filtering & pagination
  const { items, total, totalPages, sectors, exchangeCounts } = useMemo(() => {
    return filterIndianStocks({
      search: searchTerm,
      sector: selectedSector,
      exchange: selectedExchange,
      sortBy,
      sortOrder,
      page: currentPage,
      pageSize,
    });
  }, [searchTerm, selectedSector, selectedExchange, sortBy, sortOrder, currentPage, pageSize]);

  // Fetch current price exclusively for visible companies on the active page
  useEffect(() => {
    let isCancelled = false;
    const symbols = items.slice(0, 50).map((s) => s.symbol);
    if (symbols.length === 0) return;

    setIsFetchingPrices(true);
    fetch(`/api/live-market/quotes?symbols=${encodeURIComponent(symbols.join(','))}`)
      .then((res) => res.json())
      .then((resData) => {
        if (isCancelled) return;
        if (resData.success && resData.quotes) {
          setCurrentPrices((prev) => {
            const next = { ...prev };
            Object.entries(resData.quotes).forEach(([sym, q]: [string, any]) => {
              if (q && typeof q.price === 'number') {
                next[sym] = {
                  price: q.price,
                  change: q.change,
                  changePercent: q.changePercent,
                };
              }
            });
            return next;
          });
        }
      })
      .catch(() => {})
      .finally(() => {
        if (!isCancelled) setIsFetchingPrices(false);
      });

    // Auto-poll to keep visible stock prices freshly updated
    const interval = setInterval(() => {
      fetch(`/api/live-market/quotes?symbols=${encodeURIComponent(symbols.join(','))}`)
        .then((res) => res.json())
        .then((resData) => {
          if (isCancelled) return;
          if (resData.success && resData.quotes) {
            setCurrentPrices((prev) => {
              const next = { ...prev };
              Object.entries(resData.quotes).forEach(([sym, q]: [string, any]) => {
                if (q && typeof q.price === 'number') {
                  next[sym] = {
                    price: q.price,
                    change: q.change,
                    changePercent: q.changePercent,
                  };
                }
              });
              return next;
            });
          }
        })
        .catch(() => {});
    }, 10000);

    return () => {
      isCancelled = true;
      clearInterval(interval);
    };
  }, [items]);

  const handleManualRefreshPrices = () => {
    const symbols = items.slice(0, 50).map((s) => s.symbol);
    if (symbols.length === 0) return;
    setIsFetchingPrices(true);
    fetch(`/api/live-market/quotes?symbols=${encodeURIComponent(symbols.join(','))}`)
      .then((res) => res.json())
      .then((resData) => {
        if (resData.success && resData.quotes) {
          setCurrentPrices((prev) => {
            const next = { ...prev };
            Object.entries(resData.quotes).forEach(([sym, q]: [string, any]) => {
              if (q && typeof q.price === 'number') {
                next[sym] = {
                  price: q.price,
                  change: q.change,
                  changePercent: q.changePercent,
                };
              }
            });
            return next;
          });
        }
      })
      .catch(() => {})
      .finally(() => setIsFetchingPrices(false));
  };

  // Quick sector pill list
  const popularSectors = useMemo(() => {
    return [
      { id: 'ALL', label: 'All Companies (2,570+)' },
      { id: 'POPULAR', label: '★ Market Leaders' },
      { id: 'Banking & Financial Services', label: 'Banks & Finance' },
      { id: 'Information Technology', label: 'IT & Tech' },
      { id: 'Automotive & EV', label: 'Automotive & EV' },
      { id: 'Energy, Oil & Power', label: 'Energy & Power' },
      { id: 'Healthcare & Pharma', label: 'Pharma & Biotech' },
      { id: 'Defence & Aerospace', label: 'Defence & Aerospace' },
      { id: 'Infrastructure & Capital Goods', label: 'Infra & Capital Goods' },
      { id: 'New-Age Tech & Internet', label: 'New-Age Tech' },
      { id: 'Consumer Goods & Retail', label: 'Consumer & Retail' },
      { id: 'Metals & Mining', label: 'Metals & Mining' },
      { id: 'Chemicals & Fertilizers', label: 'Chemicals' },
    ];
  }, []);

  return (
    <div id="indian-stocks-directory-view" className="space-y-6 font-mono">
      {/* Top Banner with Exchange Overview */}
      <div className="p-4 sm:p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900/95 to-slate-950 border border-slate-800 shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-96 bg-gradient-to-l from-emerald-500/5 to-transparent pointer-events-none" />
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-500/20 to-cyan-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shrink-0 shadow-lg">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-2xl font-bold text-white tracking-tight">
                  Indian Exchanges Listed Companies
                </h1>
                <span className="text-xs font-semibold text-emerald-400 bg-emerald-950/80 border border-emerald-700/60 px-2.5 py-0.5 rounded-full inline-flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  NSE & BSE Master Universe
                </span>
              </div>
              <p className="text-sm text-slate-400 font-sans mt-1 max-w-3xl leading-relaxed">
                Explore, search, and analyze all 2,570+ publicly traded companies listed on the National Stock Exchange of India (NSE) and Bombay Stock Exchange (BSE). Select any company to instantly load real-time market data and trigger autonomous AI multi-agent research.
              </p>
            </div>
          </div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 text-xs font-mono w-full sm:w-auto">
            <div className="p-2 sm:p-2.5 rounded-xl bg-slate-950/80 border border-slate-800 text-center min-w-0">
              <span className="text-slate-400 text-[10px] block truncate">Total Listed</span>
              <strong className="text-base text-white font-bold">{(exchangeCounts?.total ?? INDIAN_STOCKS_MASTER.length).toLocaleString()}</strong>
            </div>
            <div className="p-2 sm:p-2.5 rounded-xl bg-slate-950/80 border border-slate-800 text-center min-w-0">
              <span className="text-slate-400 text-[10px] block truncate">NSE Active</span>
              <strong className="text-base text-emerald-400 font-bold">{(exchangeCounts?.nse ?? 2578).toLocaleString()}</strong>
            </div>
            <div className="p-2 sm:p-2.5 rounded-xl bg-slate-950/80 border border-slate-800 text-center min-w-0">
              <span className="text-slate-400 text-[10px] block truncate">BSE Active</span>
              <strong className="text-base text-amber-400 font-bold">{(exchangeCounts?.bse ?? 2584).toLocaleString()}</strong>
            </div>
            <div className="p-2 sm:p-2.5 rounded-xl bg-slate-950/80 border border-slate-800 text-center min-w-0">
              <span className="text-slate-400 text-[10px] block truncate">Dual-Listed</span>
              <strong className="text-base text-cyan-400 font-bold">{(exchangeCounts?.dual ?? 2578).toLocaleString()}</strong>
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filters Section */}
      <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-lg space-y-4">
        <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
          {/* Main Search Input */}
          <div className="relative flex-1">
            <Search className="w-5 h-5 text-cyan-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              id="directory-search-input"
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by Ticker (SUZLON, TATAMOTORS, HAL), BSE Code (500325), Company Name, Sector, or ISIN..."
              className="w-full bg-slate-950 border border-slate-700/80 rounded-xl pl-11 pr-24 py-3 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 font-mono transition-colors shadow-inner"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 p-1"
                title="Clear search"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Exchange Filter */}
          <div className="flex items-center gap-1 shrink-0 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs overflow-x-auto">
            <span className="text-slate-500 text-[11px] px-2 hidden lg:inline">Exchanges:</span>
            {[
              { id: 'ALL', label: `All (${exchangeCounts?.total ?? 2590})` },
              { id: 'NSE', label: `NSE (${exchangeCounts?.nse ?? 2578})` },
              { id: 'BSE', label: `BSE (${exchangeCounts?.bse ?? 2584})` },
              { id: 'DUAL', label: `Dual (${exchangeCounts?.dual ?? 2578})` },
              { id: 'BSE_ONLY', label: `BSE Only (${exchangeCounts?.bseExclusive ?? 6})` },
            ].map((ex) => (
              <button
                key={ex.id}
                type="button"
                onClick={() => setSelectedExchange(ex.id)}
                className={`px-2.5 py-1.5 rounded-lg font-mono text-[11px] whitespace-nowrap transition-colors ${
                  selectedExchange === ex.id
                    ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white font-bold shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {ex.label}
              </button>
            ))}
          </div>

          {/* Sort Dropdown */}
          <div className="flex items-center gap-2 shrink-0 bg-slate-950 p-1.5 rounded-xl border border-slate-800 text-xs">
            <SlidersHorizontal className="w-3.5 h-3.5 text-slate-400 ml-1.5" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-transparent text-slate-200 border-none focus:outline-none font-mono text-xs pr-1 cursor-pointer"
            >
              <option value="symbol" className="bg-slate-900 text-slate-200">Sort: Symbol (A-Z)</option>
              <option value="name" className="bg-slate-900 text-slate-200">Sort: Company Name</option>
              <option value="price" className="bg-slate-900 text-slate-200">Sort: Market Price</option>
            </select>
            <button
              type="button"
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-cyan-300 rounded text-xs font-bold font-mono transition-colors"
              title={`Order: ${sortOrder.toUpperCase()}`}
            >
              {sortOrder === 'asc' ? '▲ ASC' : '▼ DESC'}
            </button>
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center bg-slate-950 border border-slate-800 rounded-xl p-1">
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg text-xs transition-colors ${
                viewMode === 'grid' ? 'bg-cyan-900/60 text-cyan-300 font-semibold' : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Grid Cards View"
            >
              <Grid className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-lg text-xs transition-colors ${
                viewMode === 'table' ? 'bg-cyan-900/60 text-cyan-300 font-semibold' : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Dense Table View"
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Sector Quick Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
          {popularSectors.map((sec) => (
            <button
              key={sec.id}
              type="button"
              onClick={() => setSelectedSector(sec.id)}
              className={`px-3 py-1.5 rounded-lg text-xs whitespace-nowrap transition-all flex items-center gap-1.5 ${
                selectedSector === sec.id
                  ? 'bg-cyan-950 border border-cyan-500 text-cyan-300 font-bold shadow-sm shadow-cyan-950'
                  : 'bg-slate-950/70 border border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
              }`}
            >
              <span>{sec.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Results Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-400 px-1">
        <div className="flex items-center gap-3 flex-wrap">
          <div>
            Showing <strong className="text-white">{items.length}</strong> of{' '}
            <strong className="text-cyan-400">{total.toLocaleString()}</strong> companies
            {searchTerm && (
              <span>
                {' '}matching &ldquo;<strong className="text-slate-200">{searchTerm}</strong>&rdquo;
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={handleManualRefreshPrices}
            disabled={isFetchingPrices}
            title="Fetch Current Prices directly from exchange"
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 hover:border-cyan-500/50 text-slate-300 hover:text-white transition-all text-[11px]"
          >
            <RefreshCw className={`w-3 h-3 ${isFetchingPrices ? 'animate-spin text-cyan-400' : 'text-emerald-400'}`} />
            <span>{isFetchingPrices ? 'Fetching Current Prices...' : 'Refresh Current Prices'}</span>
          </button>
        </div>
        <div className="flex items-center gap-3">
          <span>
            Page <strong className="text-white">{currentPage}</strong> of{' '}
            <strong className="text-white">{totalPages}</strong>
          </span>
          <div className="flex items-center gap-1">
            <span>Per page:</span>
            {[24, 36, 60, 100].map((sz) => (
              <button
                key={sz}
                type="button"
                onClick={() => setPageSize(sz)}
                className={`px-2 py-0.5 rounded text-xs ${
                  pageSize === sz ? 'bg-cyan-900/80 text-cyan-300 font-bold' : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                {sz}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Stock Display: Grid or Table */}
      {items.length === 0 ? (
        <div className="p-12 rounded-2xl bg-slate-900/70 border border-slate-800 text-center space-y-4">
          <Building2 className="w-16 h-16 text-slate-600 mx-auto" />
          <h3 className="text-lg font-bold text-slate-200">No Listed Companies Matched</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto font-sans">
            We couldn&apos;t find any stock matching &ldquo;{searchTerm}&rdquo; under the current filters. Try searching by symbol or analyzing this ticker directly on the exchange.
          </p>
          {searchTerm && (
            <button
              type="button"
              onClick={() => onSelectStock(searchTerm.trim().toUpperCase())}
              className="mt-2 px-5 py-2.5 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white rounded-xl text-xs font-bold font-mono inline-flex items-center gap-2 shadow-lg shadow-cyan-950/50"
            >
              <Sparkles className="w-4 h-4" />
              <span>Analyze &ldquo;{searchTerm.toUpperCase()}&rdquo; in Research Cockpit</span>
            </button>
          )}
        </div>
      ) : viewMode === 'grid' ? (
        /* Grid View */
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {items.map((stock) => {
            const isSelected = currentSymbol === stock.symbol;
            const price = currentPrices[stock.symbol]?.price ?? stock.price;

            return (
              <div
                key={stock.symbol}
                id={`dir-stock-${stock.symbol}`}
                onClick={() => onSelectStock(stock.symbol)}
                className={`p-4 rounded-2xl border transition-all cursor-pointer group flex flex-col justify-between ${
                  isSelected
                    ? 'bg-cyan-950/40 border-cyan-500/80 shadow-lg shadow-cyan-950/50 scale-[1.01]'
                    : 'bg-slate-900/85 border-slate-800 hover:border-cyan-500/50 hover:bg-slate-850 hover:shadow-xl hover:scale-[1.01]'
                }`}
              >
                <div>
                  {/* Top Header */}
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-base font-bold text-white group-hover:text-cyan-400 font-mono tracking-wide">
                        {stock.symbol}
                      </span>
                      {stock.bseCode && (
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-950/70 text-amber-300 border border-amber-800/70 font-mono font-semibold" title="BSE Scrip Code">
                          BSE: {stock.bseCode}
                        </span>
                      )}
                      {stock.series && (
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-400 border border-slate-700">
                          {stock.series}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded border font-mono whitespace-nowrap ${
                          stock.exchange === 'NSE & BSE'
                            ? 'bg-gradient-to-r from-emerald-950/90 to-cyan-950/90 text-cyan-300 border-cyan-700/80 shadow-xs'
                            : stock.exchange === 'BSE'
                            ? 'bg-amber-950/80 text-amber-300 border-amber-800/80'
                            : 'bg-emerald-950/80 text-emerald-300 border-emerald-800/80'
                        }`}
                      >
                        {stock.exchange === 'NSE & BSE' ? 'NSE & BSE Dual' : stock.exchange}
                      </span>
                      {stock.isPopular && (
                        <span className="text-amber-400 text-xs" title="Featured Market Leader">
                          ★
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Company Name */}
                  <h4 className="text-xs text-slate-300 font-sans font-medium line-clamp-2 min-h-[36px] group-hover:text-slate-100 transition-colors">
                    {stock.name}
                  </h4>

                  {/* Sector & ISIN */}
                  <div className="mt-3 flex items-center justify-between gap-2 text-xs text-slate-500">
                    <span className="px-2 py-0.5 rounded-md bg-slate-950 border border-slate-800 text-slate-400 truncate max-w-[180px]">
                      {stock.sector}
                    </span>
                    {stock.isin && (
                      <span className="text-[11px] text-slate-600 font-mono truncate">
                        {stock.isin.slice(0, 8)}...
                      </span>
                    )}
                  </div>
                </div>

                {/* Bottom Price & Market Info */}
                <div className="mt-4 pt-3 border-t border-slate-800/70 flex flex-col gap-2.5">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-slate-400 block font-sans">Current Price</span>
                      <div className="flex items-baseline gap-1.5">
                        <span className="font-bold text-emerald-400 font-mono text-base">
                          {stock.currency}
                          {price.toLocaleString(undefined, {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </span>
                        {currentPrices[stock.symbol]?.changePercent !== undefined && (
                          <span
                            className={`text-xs font-mono font-semibold ${
                              (currentPrices[stock.symbol]?.change ?? 0) >= 0 ? 'text-emerald-400' : 'text-rose-400'
                            }`}
                          >
                            {(currentPrices[stock.symbol]?.change ?? 0) >= 0 ? '+' : ''}
                            {currentPrices[stock.symbol].changePercent?.toFixed(2)}%
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] text-slate-400 block font-sans">Exchange Status</span>
                      <span className="inline-flex items-center gap-1 text-[10px] font-mono text-emerald-400 font-semibold bg-emerald-950/60 border border-emerald-800/60 px-2 py-0.5 rounded-full">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        TRADING ACTIVE
                      </span>
                    </div>
                  </div>

                  {/* Stock Meta details & Action */}
                  <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1.5 border-t border-slate-800/50">
                    <span className="font-mono text-slate-500 truncate max-w-[190px]">
                      Series: <strong className="text-slate-300">{stock.series || 'EQ'}</strong>{stock.bseCode ? ` · Scrip: ${stock.bseCode}` : ''}
                    </span>
                    <button
                      type="button"
                      className="px-2.5 py-1 bg-slate-800 group-hover:bg-cyan-600 text-slate-300 group-hover:text-white rounded-lg text-xs font-semibold flex items-center gap-1 transition-all shadow-sm shrink-0"
                    >
                      <span>Analyze</span>
                      <ArrowUpRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Table View */
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950/80 text-slate-400 font-mono">
                <th className="py-3 px-4">Symbol</th>
                <th className="py-3 px-4">Company Legal Name</th>
                <th className="py-3 px-4">Exchange</th>
                <th className="py-3 px-4">Sector</th>
                <th className="py-3 px-4 text-right">Current Price</th>
                <th className="py-3 px-4 text-right">24h Change</th>
                <th className="py-3 px-4">BSE Scrip / Series</th>
                <th className="py-3 px-4">ISIN</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {items.map((stock) => {
                const isSelected = currentSymbol === stock.symbol;
                const price = currentPrices[stock.symbol]?.price ?? stock.price;
                const change = currentPrices[stock.symbol]?.change;
                const changePercent = currentPrices[stock.symbol]?.changePercent;

                return (
                  <tr
                    key={stock.symbol}
                    onClick={() => onSelectStock(stock.symbol)}
                    className={`hover:bg-slate-800/60 cursor-pointer transition-colors ${
                      isSelected ? 'bg-cyan-950/30' : ''
                    }`}
                  >
                    <td className="py-3 px-4 font-bold text-white font-mono flex items-center gap-1.5 flex-wrap">
                      <span>{stock.symbol}</span>
                      {stock.bseCode && (
                        <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-950/70 text-amber-300 border border-amber-800/80 font-mono" title="BSE Scrip Code">
                          {stock.bseCode}
                        </span>
                      )}
                      {stock.isPopular && <span className="text-amber-400 text-xs">★</span>}
                    </td>
                    <td className="py-3 px-4 text-slate-300 font-sans max-w-sm truncate">
                      {stock.name}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded border whitespace-nowrap ${
                          stock.exchange === 'NSE & BSE'
                            ? 'bg-gradient-to-r from-emerald-950/90 to-cyan-950/90 text-cyan-300 border-cyan-700/80'
                            : stock.exchange === 'BSE'
                            ? 'bg-amber-950/80 text-amber-300 border-amber-800/80'
                            : 'bg-emerald-950/80 text-emerald-300 border-emerald-800/80'
                        }`}
                      >
                        {stock.exchange === 'NSE & BSE' ? 'NSE & BSE Dual' : stock.exchange}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-400">{stock.sector}</td>
                    <td className="py-3 px-4 text-right font-bold text-emerald-400 font-mono">
                      {stock.currency}
                      {price.toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </td>
                    <td className="py-3 px-4 text-right font-mono">
                      {changePercent !== undefined ? (
                        <span
                          className={`text-xs font-semibold ${
                            (change ?? 0) >= 0 ? 'text-emerald-400' : 'text-rose-400'
                          }`}
                        >
                          {(change ?? 0) >= 0 ? '+' : ''}
                          {changePercent.toFixed(2)}%
                        </span>
                      ) : (
                        <span className="text-slate-500">—</span>
                      )}
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-400 text-[11px]">
                      {stock.bseCode ? `${stock.bseCode} · ` : ''}{stock.series || 'EQ'}
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-500 text-[11px] truncate max-w-[120px]">
                      {stock.isin || '—'}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        type="button"
                        className="px-3 py-1 bg-cyan-950 hover:bg-cyan-600 text-cyan-300 hover:text-white border border-cyan-800 hover:border-cyan-600 rounded-lg text-xs font-semibold transition-all inline-flex items-center gap-1"
                      >
                        <span>Analyze</span>
                        <ArrowUpRight className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination Footer */}
      <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-mono">
        <div className="text-slate-400 flex items-center gap-2">
          <span>
            Page <strong className="text-white">{currentPage}</strong> of{' '}
            <strong className="text-white">{totalPages}</strong>
          </span>
          <span className="text-slate-600">•</span>
          <span>Total: <strong>{total.toLocaleString()}</strong> listed equities</span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={currentPage <= 1}
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            className="px-4 py-2 rounded-xl bg-slate-850 hover:bg-slate-750 text-slate-200 border border-slate-700 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Previous</span>
          </button>

          <div className="flex items-center gap-1.5 px-3">
            <span className="text-slate-400">Page:</span>
            <input
              type="number"
              min={1}
              max={totalPages}
              value={currentPage}
              onChange={(e) => {
                const val = parseInt(e.target.value, 10);
                if (!isNaN(val) && val >= 1 && val <= totalPages) {
                  setCurrentPage(val);
                }
              }}
              className="w-16 bg-slate-950 border border-slate-700 rounded-lg px-2 py-1 text-center text-white font-mono focus:outline-none focus:border-cyan-500"
            />
            <span className="text-slate-500">/ {totalPages}</span>
          </div>

          <button
            type="button"
            disabled={currentPage >= totalPages}
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            className="px-4 py-2 rounded-xl bg-slate-850 hover:bg-slate-750 text-slate-200 border border-slate-700 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5 transition-colors"
          >
            <span>Next</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Educational Use Disclaimer */}
      <EducationalDisclaimer
        variant="footer"
        actionContext="BUY_SELL_HOLD"
        className="mt-3"
      />
    </div>
  );
};
