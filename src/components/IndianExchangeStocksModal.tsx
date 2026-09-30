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
  CheckCircle2,
  Layers,
  IndianRupee,
  RefreshCw,
} from 'lucide-react';
import {
  INDIAN_STOCKS_MASTER,
  StockSearchItem,
  filterIndianStocks,
} from '../utils/stockSearchResolver';

interface IndianExchangeStocksModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectStock: (symbol: string) => void;
  currentSymbol?: string;
}

export const IndianExchangeStocksModal: React.FC<IndianExchangeStocksModalProps> = ({
  isOpen,
  onClose,
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

  // Real-time current market prices fetched directly from exchange gateway
  const [currentPrices, setCurrentPrices] = useState<
    Record<string, { price: number; change?: number; changePercent?: number }>
  >({});
  const [isFetchingPrices, setIsFetchingPrices] = useState<boolean>(false);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedSector, selectedExchange, sortBy, sortOrder, pageSize]);

  // Handle ESC key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

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

  // Fetch current price exclusively for visible companies when modal is open
  useEffect(() => {
    if (!isOpen) return;
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

    return () => {
      isCancelled = true;
    };
  }, [isOpen, items]);

  // Quick sector pill list
  const popularSectors = useMemo(() => {
    return [
      { id: 'ALL', label: 'All Companies' },
      { id: 'POPULAR', label: '★ Market Leaders' },
      { id: 'Banking & Financial Services', label: 'Banks & Finance' },
      { id: 'Information Technology', label: 'IT & Software' },
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

  if (!isOpen) return null;

  return (
    <div
      id="indian-stocks-modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        id="indian-stocks-modal-dialog"
        onClick={(e) => e.stopPropagation()}
        className="bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl w-full max-w-7xl h-[92vh] flex flex-col overflow-hidden font-mono"
      >
        {/* Modal Top Header Bar */}
        <div className="p-4 sm:p-5 border-b border-slate-800 bg-slate-950/70 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500/20 to-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shrink-0 shadow-inner">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
                  <span>Indian Exchanges Master Directory</span>
                  <span className="text-xs font-normal text-emerald-400 bg-emerald-950/80 border border-emerald-700/60 px-2 py-0.5 rounded-full inline-flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    NSE & BSE Listed
                  </span>
                </h2>
                <span className="text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700 font-bold">
                  {INDIAN_STOCKS_MASTER.length.toLocaleString()} Companies
                </span>
              </div>
              <p className="text-xs text-slate-400 font-sans mt-0.5">
                Complete directory of all equity shares listed on the National Stock Exchange of India and Bombay Stock Exchange.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 self-end md:self-auto">
            {/* View Mode Switcher */}
            <div className="flex items-center bg-slate-950 border border-slate-800 rounded-lg p-0.5">
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded text-xs transition-colors ${
                  viewMode === 'grid' ? 'bg-cyan-900/60 text-cyan-300 font-semibold' : 'text-slate-400 hover:text-slate-200'
                }`}
                title="Grid Cards View"
              >
                <Grid className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setViewMode('table')}
                className={`p-1.5 rounded text-xs transition-colors ${
                  viewMode === 'table' ? 'bg-cyan-900/60 text-cyan-300 font-semibold' : 'text-slate-400 hover:text-slate-200'
                }`}
                title="Dense Table View"
              >
                <List className="w-4 h-4" />
              </button>
            </div>

            {/* Close Button */}
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-slate-200 border border-slate-700 transition-colors"
              title="Close Directory (Esc)"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Search & Filter Controls Section */}
        <div className="p-4 border-b border-slate-800 bg-slate-900/60 flex flex-col gap-3">
          <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
            {/* Direct Instant Search Input */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-cyan-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                id="indian-stocks-search-input"
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search across all 2,570+ companies by ticker, legal name, sector, or ISIN (e.g. SUZLON, Tata Motors, HAL, Zomato, INE758T01015)..."
                className="w-full bg-slate-950 border border-slate-700/90 rounded-xl pl-10 pr-24 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 font-mono transition-colors shadow-inner"
                autoFocus
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

            {/* Exchange Filter Selector */}
            <div className="flex items-center gap-1 shrink-0 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs overflow-x-auto">
              <span className="text-slate-500 text-[11px] px-2 hidden sm:inline">Exchange:</span>
              {[
                { id: 'ALL', label: `All (${exchangeCounts?.total ?? 2584})` },
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
          </div>

          {/* Sector Filter Chips Carousel */}
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

        {/* Results Info & Count Bar */}
        <div className="px-4 py-2 border-b border-slate-800/80 bg-slate-950/40 text-xs flex flex-wrap items-center justify-between gap-2 text-slate-400">
          <div className="flex items-center gap-2.5 flex-wrap">
            <span>
              Showing <strong className="text-white">{items.length}</strong> of{' '}
              <strong className="text-cyan-400">{total.toLocaleString()}</strong> companies matching filters
            </span>
            {searchTerm && (
              <span className="text-slate-500 font-mono">
                for &ldquo;{searchTerm}&rdquo;
              </span>
            )}
            <button
              type="button"
              onClick={() => {
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
              }}
              disabled={isFetchingPrices}
              className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-[11px] hover:text-white transition-colors"
            >
              <RefreshCw className={`w-3 h-3 ${isFetchingPrices ? 'animate-spin text-cyan-400' : 'text-emerald-400'}`} />
              <span>{isFetchingPrices ? 'Fetching Prices...' : 'Refresh Quotes'}</span>
            </button>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-[11px] text-slate-500 hidden sm:inline">
              Page {currentPage} of {totalPages}
            </span>
            <div className="flex items-center gap-1 text-[11px]">
              <span className="text-slate-500">Per page:</span>
              {[24, 36, 60, 100].map((sz) => (
                <button
                  key={sz}
                  type="button"
                  onClick={() => setPageSize(sz)}
                  className={`px-1.5 py-0.5 rounded text-[11px] ${
                    pageSize === sz ? 'bg-cyan-900/80 text-cyan-300 font-bold' : 'text-slate-500 hover:text-slate-300'
                  }`}
                >
                  {sz}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Main Content Area: Grid or Table */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 bg-slate-950/20">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-center p-6">
              <Building2 className="w-12 h-12 text-slate-600 mb-3" />
              <h3 className="text-base font-bold text-slate-200">No Listed Companies Found</h3>
              <p className="text-xs text-slate-400 max-w-md mt-1 font-sans">
                No company matches &ldquo;{searchTerm}&rdquo; under the selected filters. You can also analyze any custom ticker directly on the exchange.
              </p>
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => {
                    onSelectStock(searchTerm.trim().toUpperCase());
                    onClose();
                  }}
                  className="mt-4 px-4 py-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white rounded-xl text-xs font-bold font-mono flex items-center gap-2"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Analyze &ldquo;{searchTerm.toUpperCase()}&rdquo; on Exchange</span>
                </button>
              )}
            </div>
          ) : viewMode === 'grid' ? (
            /* Grid View */
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-3.5">
              {items.map((stock) => {
                const isSelected = currentSymbol === stock.symbol;
                const price = currentPrices[stock.symbol]?.price ?? stock.price;

                return (
                  <div
                    key={stock.symbol}
                    id={`stock-card-${stock.symbol}`}
                    onClick={() => {
                      onSelectStock(stock.symbol);
                      onClose();
                    }}
                    className={`p-3.5 rounded-xl border transition-all cursor-pointer group flex flex-col justify-between ${
                      isSelected
                        ? 'bg-cyan-950/40 border-cyan-500/80 shadow-lg shadow-cyan-950/50'
                        : 'bg-slate-900/90 border-slate-800 hover:border-cyan-500/50 hover:bg-slate-850 hover:shadow-md'
                    }`}
                  >
                    <div>
                      {/* Top Row: Symbol, Exchange badge, Series, BSE code */}
                      <div className="flex items-center justify-between gap-2 mb-1.5">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-sm font-bold text-white group-hover:text-cyan-400 font-mono tracking-wide">
                            {stock.symbol}
                          </span>
                          {stock.bseCode && (
                            <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-950/70 text-amber-300 border border-amber-800/70 font-mono font-semibold" title="BSE Scrip Code">
                              BSE: {stock.bseCode}
                            </span>
                          )}
                          {stock.series && (
                            <span className="text-[10px] px-1 py-0.2 rounded bg-slate-800 text-slate-400 border border-slate-700">
                              {stock.series}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <span
                            className={`text-[10px] font-bold px-1.5 py-0.5 rounded border font-mono whitespace-nowrap ${
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
                      <h4 className="text-xs text-slate-300 font-sans font-medium line-clamp-2 min-h-[32px] group-hover:text-slate-100 transition-colors">
                        {stock.name}
                      </h4>

                      {/* Sector Badge & ISIN */}
                      <div className="mt-2 flex items-center justify-between gap-2 text-[11px] text-slate-500">
                        <span className="px-2 py-0.5 rounded-md bg-slate-950 border border-slate-800 text-slate-400 truncate max-w-[170px]">
                          {stock.sector}
                        </span>
                        {stock.isin && (
                          <span className="text-[10px] text-slate-600 font-mono truncate">
                            {stock.isin.slice(0, 7)}...
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Bottom Row: Price, 24h Change & Action */}
                    <div className="mt-3 pt-2.5 border-t border-slate-800/70 flex flex-col gap-2">
                      <div className="flex items-center justify-between text-xs">
                        <div>
                          <span className="text-[10px] text-slate-400 block font-sans">Current Price</span>
                          <div className="flex items-baseline gap-1.5">
                            <span className="font-bold text-emerald-400 font-mono text-sm">
                              {stock.currency}
                              {price.toLocaleString(undefined, {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              })}
                            </span>
                            {currentPrices[stock.symbol]?.changePercent !== undefined && (
                              <span
                                className={`text-[10px] font-mono font-medium ${
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
                          <span className="text-[10px] text-slate-400 block font-sans">Status</span>
                          <span className="inline-flex items-center gap-1 text-[10px] font-mono text-emerald-400 font-semibold bg-emerald-950/60 border border-emerald-800/60 px-1.5 py-0.2 rounded-full">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                            ACTIVE
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between gap-1.5 pt-1 border-t border-slate-800/40">
                        <span className="font-mono text-[10px] text-slate-500 truncate max-w-[160px]">
                          Series: {stock.series || 'EQ'}
                        </span>
                        <button
                          type="button"
                          className="px-2 py-0.5 bg-slate-800 group-hover:bg-cyan-600 text-slate-300 group-hover:text-white rounded text-[11px] font-semibold flex items-center gap-1 transition-all shrink-0"
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
            <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-inner">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-950/80 text-slate-400 font-mono">
                    <th className="py-2.5 px-4">Symbol</th>
                    <th className="py-2.5 px-4">Company Legal Name</th>
                    <th className="py-2.5 px-4">Exchange</th>
                    <th className="py-2.5 px-4">Sector</th>
                    <th className="py-2.5 px-4 text-right">Current Price</th>
                    <th className="py-2.5 px-4 text-right">24h Change</th>
                    <th className="py-2.5 px-4">BSE Scrip / Series</th>
                    <th className="py-2.5 px-4">ISIN</th>
                    <th className="py-2.5 px-4 text-right">Action</th>
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
                        onClick={() => {
                          onSelectStock(stock.symbol);
                          onClose();
                        }}
                        className={`hover:bg-slate-800/60 cursor-pointer transition-colors ${
                          isSelected ? 'bg-cyan-950/30' : ''
                        }`}
                      >
                        <td className="py-2.5 px-4 font-bold text-white font-mono flex items-center gap-1.5 flex-wrap">
                          <span>{stock.symbol}</span>
                          {stock.bseCode && (
                            <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-950/70 text-amber-300 border border-amber-800/80 font-mono" title="BSE Scrip Code">
                              {stock.bseCode}
                            </span>
                          )}
                          {stock.isPopular && <span className="text-amber-400 text-xs">★</span>}
                        </td>
                        <td className="py-2.5 px-4 text-slate-300 font-sans max-w-xs truncate">
                          {stock.name}
                        </td>
                        <td className="py-2.5 px-4">
                          <span
                            className={`text-[10px] font-bold px-1.5 py-0.5 rounded border whitespace-nowrap ${
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
                        <td className="py-2.5 px-4 text-slate-400">{stock.sector}</td>
                        <td className="py-2.5 px-4 text-right font-bold text-emerald-400 font-mono">
                          {stock.currency}
                          {price.toLocaleString(undefined, {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </td>
                        <td className="py-2.5 px-4 text-right font-mono">
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
                        <td className="py-2.5 px-4 font-mono text-slate-400 text-[11px]">
                          {stock.bseCode ? `${stock.bseCode} · ` : ''}{stock.series || 'EQ'}
                        </td>
                        <td className="py-2.5 px-4 font-mono text-slate-500 text-[11px] truncate max-w-[110px]">
                          {stock.isin || '—'}
                        </td>
                        <td className="py-2.5 px-4 text-right">
                          <button
                            type="button"
                            className="px-2.5 py-1 bg-cyan-950 hover:bg-cyan-600 text-cyan-300 hover:text-white border border-cyan-800 hover:border-cyan-600 rounded text-[11px] font-semibold transition-all inline-flex items-center gap-1"
                          >
                            <span>Research</span>
                            <ArrowUpRight className="w-3 h-3" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Modal Pagination Footer Bar */}
        <div className="p-3 sm:p-4 border-t border-slate-800 bg-slate-950/80 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <div className="text-slate-400 flex items-center gap-2">
            <span>
              Page <strong className="text-white">{currentPage}</strong> of{' '}
              <strong className="text-white">{totalPages}</strong>
            </span>
            <span className="text-slate-600">•</span>
            <span>Total: <strong>{total.toLocaleString()}</strong> listed equities</span>
          </div>

          {/* Navigation Buttons */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={currentPage <= 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className="px-3 py-1.5 rounded-lg bg-slate-850 hover:bg-slate-750 text-slate-200 border border-slate-700 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1 font-mono transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Previous</span>
            </button>

            {/* Quick Page Indicator */}
            <div className="flex items-center gap-1 px-2 font-mono text-xs">
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
                className="w-14 bg-slate-900 border border-slate-700 rounded px-1.5 py-0.5 text-center text-white font-mono focus:outline-none focus:border-cyan-500"
              />
              <span className="text-slate-500">/ {totalPages}</span>
            </div>

            <button
              type="button"
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              className="px-3 py-1.5 rounded-lg bg-slate-850 hover:bg-slate-750 text-slate-200 border border-slate-700 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1 font-mono transition-colors"
            >
              <span>Next</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
