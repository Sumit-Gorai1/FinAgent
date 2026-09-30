import React, { useState, useEffect, useRef } from 'react';
import {
  Plus,
  Search,
  X,
  TrendingUp,
  Building2,
  DollarSign,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Hash,
} from 'lucide-react';
import { PortfolioHolding } from '../types';
import { calculateListingIntrinsicValue } from '../utils/stockValuationHelper';
import {
  searchStockCatalog,
  getStockDetails,
  StockSearchItem,
  getMatchSegments,
} from '../utils/stockSearchResolver';

interface AddStockModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddHolding: (holding: PortfolioHolding) => void;
  existingHoldings?: PortfolioHolding[];
  cashBalance?: number;
}

export const AddStockModal: React.FC<AddStockModalProps> = ({
  isOpen,
  onClose,
  onAddHolding,
  existingHoldings = [],
  cashBalance,
}) => {
  // Stock Selection State (Clean: starts empty, no suggested pre-filled stock)
  const [symbolInput, setSymbolInput] = useState<string>('');
  const [selectedSymbol, setSelectedSymbol] = useState<string>('');
  const [companyName, setCompanyName] = useState<string>('');
  const [sector, setSector] = useState<string>('');
  const [exchange, setExchange] = useState<string>('NSE');

  const [showSearchResults, setShowSearchResults] = useState<boolean>(false);
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState<number>(-1);
  const [isFetchingInfo, setIsFetchingInfo] = useState<boolean>(false);
  const searchDropdownRef = useRef<HTMLDivElement>(null);

  // Form Fields
  const [shares, setShares] = useState<number>(1);
  const [currentBuyPrice, setCurrentBuyPrice] = useState<number>(0);
  const [marketPrice, setMarketPrice] = useState<number>(0);
  const [formError, setFormError] = useState<string>('');

  // Close search dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchDropdownRef.current && !searchDropdownRef.current.contains(e.target as Node)) {
        setShowSearchResults(false);
        setSelectedSuggestionIndex(-1);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Reset state when opening/closing
  useEffect(() => {
    if (!isOpen) {
      setSymbolInput('');
      setSelectedSymbol('');
      setCompanyName('');
      setSector('');
      setExchange('NSE');
      setShares(1);
      setCurrentBuyPrice(0);
      setMarketPrice(0);
      setFormError('');
      setShowSearchResults(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Search results only when user types
  const searchResults = symbolInput.trim().length > 0 ? searchStockCatalog(symbolInput, 6) : [];

  const handleSelectStock = async (sym: string, presetName?: string, presetSector?: string, presetPrice?: number) => {
    const cleanSym = sym.trim().toUpperCase();
    if (!cleanSym) return;

    setSelectedSymbol(cleanSym);
    setSymbolInput(cleanSym);
    setShowSearchResults(false);
    setSelectedSuggestionIndex(-1);
    setFormError('');

    // Local catalog lookup
    const local = getStockDetails(cleanSym);
    const resolvedName = presetName || local?.name || `${cleanSym} Limited`;
    const resolvedSector = presetSector || local?.sector || 'Diversified';
    const resolvedExchange = local?.exchange || 'NSE';
    const resolvedPrice = presetPrice || local?.price || 100.00;

    setCompanyName(resolvedName);
    setSector(resolvedSector);
    setExchange(resolvedExchange);
    setMarketPrice(resolvedPrice);
    if (currentBuyPrice <= 0) {
      setCurrentBuyPrice(resolvedPrice);
    }

    // Background live quote fetch
    setIsFetchingInfo(true);
    try {
      const res = await fetch(`/api/live-market/quote/${cleanSym}`);
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data) {
          if (json.data.name && json.data.name.length > 2) {
            setCompanyName(json.data.name);
          }
          if (json.data.price && json.data.price > 0) {
            const fetchedPrice = parseFloat(json.data.price.toFixed(2));
            setMarketPrice(fetchedPrice);
            if (currentBuyPrice <= 0) {
              setCurrentBuyPrice(fetchedPrice);
            }
          }
        }
      }
    } catch {
      // Retain resolved catalog data
    } finally {
      setIsFetchingInfo(false);
    }
  };

  const handleClearSelectedStock = () => {
    setSelectedSymbol('');
    setSymbolInput('');
    setCompanyName('');
    setSector('');
    setMarketPrice(0);
    setCurrentBuyPrice(0);
    setFormError('');
  };

  const safeHoldings = Array.isArray(existingHoldings) ? existingHoldings : [];
  const existingHolding = selectedSymbol
    ? safeHoldings.find((h) => h?.symbol && h.symbol.toUpperCase() === selectedSymbol.toUpperCase())
    : undefined;

  // Capital outlay and position calculations
  const totalCost = shares * currentBuyPrice;
  const positionValue = shares * marketPrice;
  const unrealizedPnL = (marketPrice - currentBuyPrice) * shares;
  const unrealizedPnLPercent = currentBuyPrice > 0 ? ((marketPrice - currentBuyPrice) / currentBuyPrice) * 100 : 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const sym = (selectedSymbol || symbolInput).trim().toUpperCase();

    if (!sym) {
      setFormError('Please enter a stock symbol (e.g. INFY, TCS, RELIANCE).');
      return;
    }

    if (shares <= 0 || isNaN(shares)) {
      setFormError('Quantity / Number of shares must be at least 1.');
      return;
    }

    if (currentBuyPrice <= 0 || isNaN(currentBuyPrice)) {
      setFormError('Buy price must be greater than ₹0.');
      return;
    }

    const effectiveMarketPrice = marketPrice > 0 ? marketPrice : currentBuyPrice;

    // Check if symbol already exists in portfolio to blend position
    const existingIndex = safeHoldings.findIndex(
      (h) => h?.symbol && h.symbol.toUpperCase() === sym
    );
    let newHolding: PortfolioHolding;

    if (existingIndex >= 0) {
      const existing = safeHoldings[existingIndex];
      const combinedShares = existing.shares + shares;
      const combinedTotalCost = (existing.shares * existing.avgBuyPrice) + (shares * currentBuyPrice);
      const blendedBuyPrice = combinedTotalCost / combinedShares;
      const newPnL = (effectiveMarketPrice - blendedBuyPrice) * combinedShares;
      const newPnLPercent = ((effectiveMarketPrice - blendedBuyPrice) / blendedBuyPrice) * 100;

      const val = calculateListingIntrinsicValue({
        symbol: sym,
        name: companyName || existing.name,
        sector: sector || existing.sector,
        price: effectiveMarketPrice,
      });

      newHolding = {
        ...existing,
        name: companyName || existing.name,
        sector: sector || existing.sector,
        shares: combinedShares,
        avgBuyPrice: parseFloat(blendedBuyPrice.toFixed(2)),
        currentPrice: parseFloat(effectiveMarketPrice.toFixed(2)),
        unrealizedPnL: parseFloat(newPnL.toFixed(2)),
        unrealizedPnLPercent: parseFloat(newPnLPercent.toFixed(2)),
        weightPercent: 0,
        intrinsicValue: val.blendedIntrinsicValue,
        marginOfSafetyPercent: val.marginOfSafetyPercent,
        valuationStatus: val.valuationStatus,
      };
    } else {
      const pnl = (effectiveMarketPrice - currentBuyPrice) * shares;
      const pnlPct = currentBuyPrice > 0 ? ((effectiveMarketPrice - currentBuyPrice) / currentBuyPrice) * 100 : 0;
      const val = calculateListingIntrinsicValue({
        symbol: sym,
        name: companyName || sym,
        sector: sector || 'Diversified',
        price: effectiveMarketPrice,
      });

      newHolding = {
        symbol: sym,
        name: companyName || sym,
        shares,
        avgBuyPrice: parseFloat(currentBuyPrice.toFixed(2)),
        currentPrice: parseFloat(effectiveMarketPrice.toFixed(2)),
        sector: sector || 'Diversified',
        score: 78,
        researchScore: 78,
        weightPercent: 0,
        unrealizedPnL: parseFloat(pnl.toFixed(2)),
        unrealizedPnLPercent: parseFloat(pnlPct.toFixed(2)),
        intrinsicValue: val.blendedIntrinsicValue,
        marginOfSafetyPercent: val.marginOfSafetyPercent,
        valuationStatus: val.valuationStatus,
      };
    }

    onAddHolding(newHolding);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn font-mono">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-5 max-h-[92vh] overflow-y-auto">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-800/80 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center border border-cyan-500/30">
              <Plus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white tracking-wider uppercase">
                Add Stock to Portfolio
              </h3>
              <p className="text-xs text-slate-400 font-sans">
                Enter stock ticker, quantity, and buy price
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Stock Symbol Input */}
          <div className="space-y-1.5" ref={searchDropdownRef}>
            <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
              <span>STOCK SYMBOL / TICKER</span>
              {selectedSymbol && (
                <button
                  type="button"
                  onClick={handleClearSelectedStock}
                  className="text-[10px] text-cyan-400 hover:text-cyan-300 underline font-normal"
                >
                  Change Stock
                </button>
              )}
            </label>

            <div className="relative">
              <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={symbolInput}
                onChange={(e) => {
                  setSymbolInput(e.target.value.toUpperCase());
                  setShowSearchResults(true);
                  setSelectedSuggestionIndex(-1);
                  if (selectedSymbol && e.target.value.toUpperCase() !== selectedSymbol) {
                    setSelectedSymbol('');
                  }
                }}
                onFocus={() => {
                  if (symbolInput.trim().length > 0) setShowSearchResults(true);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'ArrowDown') {
                    e.preventDefault();
                    if (!showSearchResults) setShowSearchResults(true);
                    setSelectedSuggestionIndex((prev) =>
                      prev < searchResults.length - 1 ? prev + 1 : 0
                    );
                  } else if (e.key === 'ArrowUp') {
                    e.preventDefault();
                    setSelectedSuggestionIndex((prev) =>
                      prev > 0 ? prev - 1 : searchResults.length - 1
                    );
                  } else if (e.key === 'Tab' || e.key === 'Enter') {
                    if (searchResults.length > 0 && showSearchResults) {
                      e.preventDefault();
                      const chosen =
                        selectedSuggestionIndex >= 0 && searchResults[selectedSuggestionIndex]
                          ? searchResults[selectedSuggestionIndex]
                          : searchResults[0];
                      handleSelectStock(chosen.symbol, chosen.name, chosen.sector, chosen.price);
                    } else if (e.key === 'Enter' && symbolInput.trim()) {
                      e.preventDefault();
                      handleSelectStock(symbolInput.trim());
                    }
                  } else if (e.key === 'Escape') {
                    setShowSearchResults(false);
                    setSelectedSuggestionIndex(-1);
                  }
                }}
                placeholder="Enter ticker (e.g. INFY, TCS, RELIANCE)..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-8 py-2.5 text-xs text-white uppercase placeholder:normal-case placeholder-slate-500 focus:outline-none focus:border-cyan-500 font-mono"
                autoFocus
              />

              {symbolInput && (
                <button
                  type="button"
                  onClick={handleClearSelectedStock}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 p-1"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}

              {/* Autocomplete dropdown while typing */}
              {showSearchResults && symbolInput.trim().length > 0 && searchResults.length > 0 && (
                <div className="absolute left-0 right-0 top-full mt-1.5 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl max-h-52 overflow-y-auto z-50 p-1 divide-y divide-slate-800 font-mono">
                  {searchResults.map((item, idx) => {
                    const isSelected = idx === selectedSuggestionIndex;
                    const symSeg = getMatchSegments(item.symbol, symbolInput);
                    const nameSeg = getMatchSegments(item.name, symbolInput);

                    return (
                      <button
                        key={item.symbol}
                        type="button"
                        onMouseEnter={() => setSelectedSuggestionIndex(idx)}
                        onClick={() => handleSelectStock(item.symbol, item.name, item.sector, item.price)}
                        className={`w-full text-left px-3 py-2 rounded-lg flex items-center justify-between text-xs transition-colors group ${
                          isSelected
                            ? 'bg-cyan-950/80 border-l-2 border-l-cyan-400 text-white'
                            : 'hover:bg-slate-800/80 text-slate-300'
                        }`}
                      >
                        <div className="min-w-0 flex-1 pr-2">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-white text-xs group-hover:text-cyan-400 font-mono">
                              {symSeg ? (
                                <>
                                  {symSeg.before}
                                  <span className="text-cyan-400 underline">{symSeg.match}</span>
                                  {symSeg.after}
                                </>
                              ) : (
                                item.symbol
                              )}
                            </span>
                            <span className="text-[10px] px-1 py-0.2 rounded bg-slate-800 text-slate-400 border border-slate-700">
                              {item.exchange}
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-400 font-sans truncate mt-0.5">
                            {nameSeg ? (
                              <>
                                {nameSeg.before}
                                <span className="text-cyan-300">{nameSeg.match}</span>
                                {nameSeg.after}
                              </>
                            ) : (
                              item.name
                            )}
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <div className="text-xs font-bold text-slate-200">
                            ₹{item.price.toLocaleString()}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Resolved Stock Details Tag */}
            {selectedSymbol && (
              <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-slate-950/60 border border-slate-800 text-xs">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="font-bold text-cyan-400">{selectedSymbol}</span>
                  <span className="text-slate-500">•</span>
                  <span className="text-slate-300 truncate font-sans text-[11px]">
                    {companyName || selectedSymbol}
                  </span>
                  {sector && (
                    <>
                      <span className="text-slate-500 hidden sm:inline">•</span>
                      <span className="text-slate-400 text-[10px] hidden sm:inline">{sector}</span>
                    </>
                  )}
                </div>
                {isFetchingInfo && (
                  <span className="text-[10px] text-cyan-400 flex items-center gap-1 shrink-0 animate-pulse">
                    <RefreshCw className="w-3 h-3 animate-spin" /> Fetching CMP
                  </span>
                )}
              </div>
            )}

            {/* Existing position indicator */}
            {existingHolding && (
              <div className="text-[11px] text-emerald-400/90 font-sans flex items-center gap-1.5 pt-0.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>
                  Currently holding {existingHolding.shares} shares @ ₹{existingHolding.avgBuyPrice}. New purchase will average into position.
                </span>
              </div>
            )}
          </div>

          {/* Form Grid: Shares, Buy Price, Current Price */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Shares / Quantity */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300">
                QUANTITY
              </label>
              <input
                type="number"
                min="1"
                step="1"
                value={shares || ''}
                onChange={(e) => setShares(Math.max(1, parseInt(e.target.value) || 0))}
                placeholder="Qty"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-bold focus:outline-none focus:border-cyan-500"
                required
              />
            </div>

            {/* Buy Price */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300">
                BUY PRICE (₹)
              </label>
              <input
                type="number"
                min="0.05"
                step="0.05"
                value={currentBuyPrice || ''}
                onChange={(e) => setCurrentBuyPrice(parseFloat(e.target.value) || 0)}
                placeholder="₹ Buy Price"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-bold focus:outline-none focus:border-cyan-500"
                required
              />
            </div>

            {/* Market Price (CMP) */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300">
                MARKET PRICE (₹)
              </label>
              <input
                type="number"
                min="0.05"
                step="0.05"
                value={marketPrice || ''}
                onChange={(e) => setMarketPrice(parseFloat(e.target.value) || 0)}
                placeholder="₹ CMP"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-bold focus:outline-none focus:border-cyan-500"
                required
              />
            </div>
          </div>

          {/* Clean Investment Summary (when shares and prices entered) */}
          {shares > 0 && currentBuyPrice > 0 && (
            <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800/80 space-y-1.5 text-xs">
              <div className="flex items-center justify-between text-slate-400">
                <span>Total Investment:</span>
                <span className="text-white font-bold">
                  ₹{totalCost.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                </span>
              </div>
              {marketPrice > 0 && (
                <>
                  <div className="flex items-center justify-between text-slate-400">
                    <span>Current Value:</span>
                    <span className="text-white font-bold">
                      ₹{positionValue.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-slate-400">
                    <span>Unrealized P&L:</span>
                    <span className={`font-bold ${unrealizedPnL >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {unrealizedPnL >= 0 ? '+' : ''}₹{unrealizedPnL.toLocaleString(undefined, { maximumFractionDigits: 2 })} ({unrealizedPnLPercent.toFixed(2)}%)
                    </span>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Form Error */}
          {formError && (
            <div className="p-2.5 rounded-xl bg-rose-950/60 border border-rose-800/80 text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end gap-2.5 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white bg-slate-800/80 hover:bg-slate-700 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex items-center gap-1.5 px-5 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 shadow-md shadow-cyan-950/50 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Add to Portfolio</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
