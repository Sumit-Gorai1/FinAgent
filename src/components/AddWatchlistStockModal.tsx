import React, { useState, useMemo } from 'react';
import {
  Search,
  X,
  Plus,
  Check,
  TrendingUp,
  Layers,
  Coins,
  ShieldAlert,
  Sparkles,
  ArrowRight,
  Filter,
} from 'lucide-react';
import {
  searchStockCatalog,
  ALL_ETFS_CATALOG,
  POPULAR_PRICE_MAP,
  StockSearchItem,
} from '../utils/stockSearchResolver';
import { WatchlistItem } from '../types';

interface AddWatchlistStockModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddStock: (item: WatchlistItem) => void;
  watchlistSymbols: Set<string>;
}

export const AddWatchlistStockModal: React.FC<AddWatchlistStockModalProps> = ({
  isOpen,
  onClose,
  onAddStock,
  watchlistSymbols,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'stocks' | 'etfs' | 'popular'>('all');
  const [addedSymbols, setAddedSymbols] = useState<Set<string>>(new Set());

  // Quick Curated Popular Stocks & ETFs
  const POPULAR_QUICK_ETFS = [
    { symbol: 'NIFTYBEES', name: 'Nippon India ETF Nifty 50 BeES', price: 253.76, sector: 'Exchange Traded Fund (ETF)' },
    { symbol: 'BANKBEES', name: 'Nippon India ETF Nifty Bank BeES', price: 564.48, sector: 'Exchange Traded Fund (ETF)' },
    { symbol: 'GOLDBEES', name: 'Nippon India ETF Gold BeES', price: 74.20, sector: 'Exchange Traded Fund (ETF)' },
    { symbol: 'SILVERBEES', name: 'Nippon India ETF Silver BeES', price: 89.50, sector: 'Exchange Traded Fund (ETF)' },
    { symbol: 'JUNIORBEES', name: 'Nippon India ETF Next 50', price: 734.61, sector: 'Exchange Traded Fund (ETF)' },
    { symbol: 'MID150BEES', name: 'Nippon India ETF Midcap 150', price: 208.50, sector: 'Exchange Traded Fund (ETF)' },
    { symbol: 'CPSEETF', name: 'CPSE ETF (PSU Basket)', price: 87.15, sector: 'Exchange Traded Fund (ETF)' },
    { symbol: 'MON100', name: 'Motilal Oswal Nasdaq 100 ETF', price: 165.40, sector: 'Exchange Traded Fund (ETF)' },
  ];

  const POPULAR_QUICK_STOCKS = [
    { symbol: 'RELIANCE', name: 'Reliance Industries Ltd', price: 1268.50, sector: 'Energy & Petrochemicals' },
    { symbol: 'TCS', name: 'Tata Consultancy Services', price: 4124.80, sector: 'Information Technology' },
    { symbol: 'HDFCBANK', name: 'HDFC Bank Ltd', price: 1668.40, sector: 'Banking & Financials' },
    { symbol: 'INFY', name: 'Infosys Ltd', price: 1892.40, sector: 'Information Technology' },
    { symbol: 'ICICIBANK', name: 'ICICI Bank Ltd', price: 1292.20, sector: 'Banking & Financials' },
    { symbol: 'TATAMOTORS', name: 'Tata Motors Ltd', price: 984.75, sector: 'Automobile & EV' },
    { symbol: 'SBIN', name: 'State Bank of India', price: 814.20, sector: 'Banking & Financials' },
    { symbol: 'BHARTIARTL', name: 'Bharti Airtel Ltd', price: 1680.50, sector: 'Telecommunications' },
    { symbol: 'ITC', name: 'ITC Ltd', price: 478.20, sector: 'FMCG & Consumer' },
    { symbol: 'LT', name: 'Larsen & Toubro Ltd', price: 3749.10, sector: 'Infrastructure & Engineering' },
    { symbol: 'HAL', name: 'Hindustan Aeronautics Ltd', price: 4549.30, sector: 'Defence & Aerospace' },
    { symbol: 'ZOMATO', name: 'Zomato Ltd', price: 278.40, sector: 'Internet & E-Commerce' },
  ];

  // Search Results filtering
  const searchResults = useMemo(() => {
    let items: StockSearchItem[] = [];
    if (searchQuery.trim().length > 0) {
      items = searchStockCatalog(searchQuery, 40);
    } else {
      // Default view based on tab
      if (activeTab === 'etfs') {
        items = ALL_ETFS_CATALOG.slice(0, 30);
      } else if (activeTab === 'stocks') {
        items = POPULAR_QUICK_STOCKS.map((s) => ({
          symbol: s.symbol,
          name: s.name,
          exchange: 'NSE & BSE',
          sector: s.sector,
          price: s.price,
          currency: '₹',
          isPopular: true,
        }));
      } else if (activeTab === 'popular') {
        const pStocks: StockSearchItem[] = POPULAR_QUICK_STOCKS.slice(0, 8).map((s) => ({
          symbol: s.symbol,
          name: s.name,
          exchange: 'NSE & BSE',
          sector: s.sector,
          price: s.price,
          currency: '₹',
          isPopular: true,
        }));
        const pEtfs: StockSearchItem[] = POPULAR_QUICK_ETFS.slice(0, 6).map((e) => ({
          symbol: e.symbol,
          name: e.name,
          exchange: 'NSE & BSE',
          sector: e.sector,
          price: e.price,
          currency: '₹',
          isPopular: true,
        }));
        items = [...pEtfs, ...pStocks];
      } else {
        // 'all' tab with empty query: mix of top ETFs and top Stocks
        const pEtfs: StockSearchItem[] = POPULAR_QUICK_ETFS.slice(0, 6).map((e) => ({
          symbol: e.symbol,
          name: e.name,
          exchange: 'NSE & BSE',
          sector: e.sector,
          price: e.price,
          currency: '₹',
          isPopular: true,
        }));
        const pStocks: StockSearchItem[] = POPULAR_QUICK_STOCKS.slice(0, 10).map((s) => ({
          symbol: s.symbol,
          name: s.name,
          exchange: 'NSE & BSE',
          sector: s.sector,
          price: s.price,
          currency: '₹',
          isPopular: true,
        }));
        items = [...pEtfs, ...pStocks];
      }
    }

    // Filter by tab if search query exists
    if (activeTab === 'etfs') {
      return items.filter(
        (i) =>
          i.sector.toLowerCase().includes('etf') ||
          i.sector.toLowerCase().includes('exchange traded fund') ||
          i.symbol.toLowerCase().includes('bees') ||
          i.symbol.toLowerCase().includes('etf')
      );
    }
    if (activeTab === 'stocks') {
      return items.filter(
        (i) =>
          !i.sector.toLowerCase().includes('etf') &&
          !i.sector.toLowerCase().includes('exchange traded fund') &&
          !i.symbol.toLowerCase().includes('bees')
      );
    }

    return items;
  }, [searchQuery, activeTab]);

  if (!isOpen) return null;

  const handleAdd = (item: {
    symbol: string;
    name: string;
    price: number;
    currency?: string;
    sector?: string;
  }) => {
    const isEtf =
      (item.sector &&
        (item.sector.toLowerCase().includes('etf') ||
          item.sector.toLowerCase().includes('exchange traded fund'))) ||
      item.symbol.toLowerCase().includes('bees') ||
      item.symbol.toLowerCase().includes('etf');

    const newItem: WatchlistItem = {
      symbol: item.symbol,
      name: item.name,
      price: item.price || 100,
      changePercent: +(Math.random() * 2.5 - 0.8).toFixed(2),
      score: Math.floor(Math.random() * 20) + 72,
      committeeScore: Math.floor(Math.random() * 20) + 72,
      currency: item.currency || '₹',
      statusTag: 'POSITIVE',
      thesisStatus: isEtf ? 'BUY (ACCUMULATE ETF)' : 'BUY / MONITOR',
      thesisChanged: false,
      lastAnalyzed: 'Just now',
      sector: item.sector || (isEtf ? 'Exchange Traded Fund (ETF)' : 'Equity'),
      isEtf: Boolean(isEtf),
      intrinsicValue: +(item.price * (1 + (Math.random() * 0.15 + 0.05))).toFixed(2),
      marginOfSafetyPercent: +(Math.random() * 12 + 6).toFixed(1),
    };

    onAddStock(newItem);
    setAddedSymbols((prev) => new Set(prev).add(item.symbol));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-950/80 border border-cyan-800/80 flex items-center justify-center text-cyan-400">
              <Plus className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-bold text-white tracking-tight">
                  Add Stock or ETF to Watchlist
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-cyan-950 text-cyan-300 border border-cyan-800">
                  2,580+ ASSETS
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Search all NSE/BSE listed equities, Index BeES, Gold & Silver ETFs, or Global tickers.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search & Tabs */}
        <div className="p-4 sm:p-5 space-y-3 bg-slate-900 border-b border-slate-800/80">
          {/* Search Input */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search ticker, company or ETF (e.g. NIFTYBEES, GOLDBEES, INFY, TCS)..."
              autoFocus
              className="w-full bg-slate-950 border border-slate-700/80 rounded-xl pl-10 pr-9 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500 font-mono transition-colors"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Quick Categories Filter Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs">
            <button
              onClick={() => setActiveTab('all')}
              className={`px-3 py-1.5 rounded-lg font-mono font-medium transition-colors whitespace-nowrap ${
                activeTab === 'all'
                  ? 'bg-cyan-600 text-white shadow-sm'
                  : 'bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700'
              }`}
            >
              All Assets
            </button>
            <button
              onClick={() => setActiveTab('etfs')}
              className={`px-3 py-1.5 rounded-lg font-mono font-medium transition-colors flex items-center gap-1.5 whitespace-nowrap ${
                activeTab === 'etfs'
                  ? 'bg-amber-600 text-white shadow-sm'
                  : 'bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700'
              }`}
            >
              <Coins className="w-3.5 h-3.5 text-amber-300" />
              All ETFs (BeES, Gold, Silver)
            </button>
            <button
              onClick={() => setActiveTab('stocks')}
              className={`px-3 py-1.5 rounded-lg font-mono font-medium transition-colors flex items-center gap-1.5 whitespace-nowrap ${
                activeTab === 'stocks'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700'
              }`}
            >
              <TrendingUp className="w-3.5 h-3.5 text-emerald-300" />
              Equities (NSE / BSE)
            </button>
            <button
              onClick={() => setActiveTab('popular')}
              className={`px-3 py-1.5 rounded-lg font-mono font-medium transition-colors flex items-center gap-1.5 whitespace-nowrap ${
                activeTab === 'popular'
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-purple-300" />
              Popular Leaders
            </button>
          </div>

          {/* Quick Select Chips for Popular ETFs */}
          <div className="flex flex-wrap items-center gap-1.5 pt-1">
            <span className="text-[11px] text-slate-400 font-mono flex items-center gap-1 mr-1">
              <Coins className="w-3 h-3 text-amber-400" /> Quick Add ETFs:
            </span>
            {POPULAR_QUICK_ETFS.slice(0, 6).map((etf) => {
              const inWatchlist = watchlistSymbols.has(etf.symbol) || addedSymbols.has(etf.symbol);
              return (
                <button
                  key={etf.symbol}
                  onClick={() => !inWatchlist && handleAdd(etf)}
                  disabled={inWatchlist}
                  className={`px-2 py-0.5 rounded text-[11px] font-mono transition-colors flex items-center gap-1 ${
                    inWatchlist
                      ? 'bg-slate-800/60 text-slate-500 border border-slate-700/50 cursor-not-allowed'
                      : 'bg-amber-950/40 text-amber-300 hover:bg-amber-900/50 border border-amber-800/60'
                  }`}
                >
                  {inWatchlist ? <Check className="w-2.5 h-2.5 text-emerald-400" /> : <Plus className="w-2.5 h-2.5" />}
                  {etf.symbol}
                </button>
              );
            })}
          </div>
        </div>

        {/* Results List */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-2">
          {searchResults.length === 0 ? (
            <div className="py-12 text-center text-slate-400 space-y-2">
              <p className="text-sm">No equities or ETFs found matching "{searchQuery}".</p>
              <p className="text-xs text-slate-500">
                You can try searching by ticker, company name, or index name (e.g., NIFTY, GOLD, RELIANCE).
              </p>
            </div>
          ) : (
            searchResults.map((item) => {
              const inWatchlist =
                watchlistSymbols.has(item.symbol) || addedSymbols.has(item.symbol);
              const isEtf =
                (item.sector &&
                  (item.sector.toLowerCase().includes('etf') ||
                    item.sector.toLowerCase().includes('exchange traded fund'))) ||
                item.symbol.toLowerCase().includes('bees') ||
                item.symbol.toLowerCase().includes('etf');

              return (
                <div
                  key={item.symbol}
                  className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/90 hover:border-slate-700 transition-all flex items-center justify-between gap-3"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-white text-sm font-mono tracking-tight">
                        {item.symbol}
                      </span>
                      <span
                        className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-medium ${
                          isEtf
                            ? 'bg-amber-950/70 text-amber-300 border border-amber-800/80'
                            : 'bg-cyan-950/70 text-cyan-300 border border-cyan-800/80'
                        }`}
                      >
                        {isEtf ? 'ETF' : 'EQUITY'}
                      </span>
                      {item.exchange && (
                        <span className="text-[10px] text-slate-400 font-mono">
                          {item.exchange}
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-slate-300 truncate mt-0.5">{item.name}</div>
                    <div className="text-[11px] text-slate-400 font-mono mt-0.5 truncate">
                      {item.sector || 'Financial Market Asset'}
                    </div>
                  </div>

                  {/* Price & Action */}
                  <div className="flex items-center gap-3 shrink-0">
                    <div className="text-right font-mono">
                      <div className="text-sm font-bold text-slate-100">
                        {item.currency || '₹'}
                        {item.price ? item.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '—'}
                      </div>
                      <div className="text-[10px] text-slate-400">Market Price</div>
                    </div>

                    {inWatchlist ? (
                      <button
                        disabled
                        className="px-3 py-1.5 rounded-lg text-xs font-mono font-semibold bg-slate-800/70 text-slate-400 border border-slate-700 flex items-center gap-1.5 cursor-not-allowed"
                      >
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        In Watchlist
                      </button>
                    ) : (
                      <button
                        onClick={() => handleAdd(item)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-mono font-semibold transition-all shadow-sm flex items-center gap-1.5 ${
                          isEtf
                            ? 'bg-amber-600 hover:bg-amber-500 text-white shadow-amber-950/40'
                            : 'bg-cyan-600 hover:bg-cyan-500 text-white shadow-cyan-950/40'
                        }`}
                      >
                        <Plus className="w-3.5 h-3.5" />
                        Add to Watchlist
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-3 sm:p-4 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between text-xs font-mono text-slate-400">
          <span>
            {watchlistSymbols.size} assets currently tracked in surveillance
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
