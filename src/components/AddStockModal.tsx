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
  Lock,
  Wallet,
  Coins,
  ShieldCheck,
  Zap,
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
  stocks?: Record<string, any>;
}

export const AddStockModal: React.FC<AddStockModalProps> = ({
  isOpen,
  onClose,
  onAddHolding,
  existingHoldings = [],
  cashBalance = 1000000,
  stocks,
}) => {
  // Stock Selection State
  const [symbolInput, setSymbolInput] = useState<string>('');
  const [selectedSymbol, setSelectedSymbol] = useState<string>('');
  const [companyName, setCompanyName] = useState<string>('');
  const [sector, setSector] = useState<string>('');
  const [exchange, setExchange] = useState<string>('NSE');

  const [showSearchResults, setShowSearchResults] = useState<boolean>(false);
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState<number>(-1);
  const searchDropdownRef = useRef<HTMLDivElement>(null);

  // Form Fields as strings for fluid, unrestricted typing
  const [amountInput, setAmountInput] = useState<string>('');
  const [sharesInput, setSharesInput] = useState<string>('1');
  const [buyPriceInput, setBuyPriceInput] = useState<string>('');

  // Synchronized refs to prevent closure stale state in async live quotes
  const sharesInputRef = useRef<string>(sharesInput);
  const amountInputRef = useRef<string>(amountInput);
  const buyPriceInputRef = useRef<string>(buyPriceInput);

  useEffect(() => {
    sharesInputRef.current = sharesInput;
  }, [sharesInput]);

  useEffect(() => {
    amountInputRef.current = amountInput;
  }, [amountInput]);

  useEffect(() => {
    buyPriceInputRef.current = buyPriceInput;
  }, [buyPriceInput]);
  
  // Market Price and Live Quote Metadata
  const [marketPrice, setMarketPrice] = useState<number>(0);
  const [isCustomStock, setIsCustomStock] = useState<boolean>(false);
  const [isFetchingQuote, setIsFetchingQuote] = useState<boolean>(false);
  const [liveQuoteTime, setLiveQuoteTime] = useState<string>('');
  const [liveQuoteChange, setLiveQuoteChange] = useState<number | null>(null);
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
      setAmountInput('');
      setSharesInput('1');
      setBuyPriceInput('');
      setMarketPrice(0);
      setIsCustomStock(false);
      setIsFetchingQuote(false);
      setLiveQuoteTime('');
      setLiveQuoteChange(null);
      setFormError('');
      setShowSearchResults(false);
    }
  }, [isOpen]);

  // Debounced auto-fetch: when user types any ticker or ETF, automatically resolve and fetch real price
  useEffect(() => {
    const clean = symbolInput.trim().toUpperCase();
    if (clean.length >= 2 && clean !== selectedSymbol) {
      const timer = setTimeout(() => {
        const item = getStockDetails(clean);
        if (item) {
          setSelectedSymbol(item.symbol);
          setCompanyName(item.name);
          setSector(item.sector);
          setExchange(item.exchange);
          setMarketPrice(item.price);
          setIsCustomStock(false);
          if (!buyPriceInputRef.current || parseFloat(buyPriceInputRef.current) <= 0) {
            setBuyPriceInput(item.price.toString());
          }
          const curShares = parseFloat(sharesInputRef.current) || 1;
          const userAmt = parseFloat(amountInputRef.current);
          if (isNaN(userAmt) || userAmt <= 0) {
            setAmountInput(parseFloat((curShares * item.price).toFixed(2)).toString());
          }
          fetchLiveQuote(item.symbol);
        } else {
          fetchLiveQuote(clean);
        }
      }, 350);
      return () => clearTimeout(timer);
    }
  }, [symbolInput, selectedSymbol]);

  if (!isOpen) return null;

  // Search results only when user types
  const searchResults = symbolInput.trim().length > 0 ? searchStockCatalog(symbolInput, 6) : [];

  /**
   * Asynchronously fetch real-time live market quote from server
   * and update market price, buy price, and calculate exact total amount!
   */
  const fetchLiveQuote = async (sym: string) => {
    const clean = sym.trim().toUpperCase();
    if (!clean) return;

    setIsFetchingQuote(true);
    try {
      const res = await fetch(`/api/live-market/quotes?symbols=${encodeURIComponent(clean)}`);
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.quotes && json.quotes[clean]) {
          const q = json.quotes[clean];
          if (typeof q.price === 'number' && q.price > 0) {
            const liveP = Number(q.price.toFixed(2));
            setMarketPrice(liveP);
            setLiveQuoteTime(
              new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
            );
            setLiveQuoteChange(q.change !== undefined ? Number(q.change.toFixed(2)) : null);

            // Update default buy price if user hasn't explicitly customized it
            setBuyPriceInput((prevBuy) => {
              const prevNum = parseFloat(prevBuy);
              if (!prevNum || prevNum <= 0) return liveP.toString();
              return prevBuy;
            });

            // Automatically recalculate the correct amount with the fetched live price
            const amtNum = parseFloat(amountInputRef.current);
            const currentSharesNum = parseFloat(sharesInputRef.current) || 1;
            if (!isNaN(amtNum) && amtNum > 0) {
              // User had entered an amount, recalculate shares for live price
              const computedSh =
                amtNum >= liveP
                  ? Math.max(1, Math.round(amtNum / liveP))
                  : Math.max(0.0001, parseFloat((amtNum / liveP).toFixed(4)));
              setSharesInput(computedSh.toString());
            } else {
              // Compute the exact investment amount from shares * live price
              setAmountInput(parseFloat((currentSharesNum * liveP).toFixed(2)).toString());
            }
          }
        }
      }
    } catch (e) {
      console.warn('Failed to fetch live quote in AddStockModal:', e);
    } finally {
      setIsFetchingQuote(false);
    }
  };

  /**
   * Select a stock, resolve its metadata, and fetch the real-time live price and amount.
   */
  const handleSelectStock = (sym: string, presetName?: string, presetSector?: string, presetPrice?: number) => {
    const cleanSym = sym.trim().toUpperCase();
    if (!cleanSym) return;

    setSelectedSymbol(cleanSym);
    setSymbolInput(cleanSym);
    setShowSearchResults(false);
    setSelectedSuggestionIndex(-1);
    setFormError('');

    // Catalog lookup for initial fallback
    const local = getStockDetails(cleanSym);
    const resolvedName = presetName || local?.name || `${cleanSym} Limited`;
    const resolvedSector = presetSector || local?.sector || 'Diversified';
    const resolvedExchange = local?.exchange || 'NSE';
    
    // Check if we have an active quote in cached stocks state
    const cachedStockPrice = stocks && stocks[cleanSym]?.price ? Number(stocks[cleanSym].price.toFixed(2)) : undefined;
    const initialCMP = parseFloat((presetPrice || cachedStockPrice || local?.price || 100.00).toFixed(2));

    setCompanyName(resolvedName);
    setSector(resolvedSector);
    setExchange(resolvedExchange);
    setIsCustomStock(!local && !presetPrice && !cachedStockPrice);

    // Set initial baseline price
    setMarketPrice(initialCMP);

    // If user hasn't set buy price yet, default it to CMP
    const existingBuyPriceNum = parseFloat(buyPriceInput);
    const effectiveBuyPrice = existingBuyPriceNum > 0 ? existingBuyPriceNum : initialCMP;
    if (!existingBuyPriceNum || existingBuyPriceNum <= 0) {
      setBuyPriceInput(initialCMP.toString());
    }

    // Preserve user's entered amount if already typed
    const userAmountNum = parseFloat(amountInputRef.current);
    if (!isNaN(userAmountNum) && userAmountNum > 0 && effectiveBuyPrice > 0) {
      const computedShares =
        userAmountNum >= effectiveBuyPrice
          ? Math.max(1, Math.round(userAmountNum / effectiveBuyPrice))
          : Math.max(0.0001, parseFloat((userAmountNum / effectiveBuyPrice).toFixed(4)));
      setSharesInput(computedShares.toString());
    } else {
      const currentShares = parseFloat(sharesInputRef.current) || 1;
      setSharesInput(currentShares.toString());
      setAmountInput((parseFloat((currentShares * effectiveBuyPrice).toFixed(2))).toString());
    }

    // Fetch real-time live market quote from feed to ensure 100% correct amount
    fetchLiveQuote(cleanSym);
  };

  const handleClearSelectedStock = () => {
    setSelectedSymbol('');
    setSymbolInput('');
    setCompanyName('');
    setSector('');
    setMarketPrice(0);
    setIsCustomStock(false);
    setLiveQuoteTime('');
    setLiveQuoteChange(null);
    setFormError('');
  };

  /**
   * Handle user typing in TOTAL INVESTMENT AMOUNT (₹):
   * Free to enter ANY amount. Automatically calculates shares based on live price.
   */
  const handleAmountChange = (rawVal: string) => {
    setAmountInput(rawVal);
    setFormError('');

    const parsedVal = parseFloat(rawVal);
    if (!isNaN(parsedVal) && parsedVal > 0) {
      const currentBuyPriceNum = parseFloat(buyPriceInput);
      const effectivePrice = currentBuyPriceNum > 0 ? currentBuyPriceNum : marketPrice > 0 ? marketPrice : 1;
      if (effectivePrice > 0) {
        const computedShares =
          parsedVal >= effectivePrice
            ? Math.max(1, Math.round(parsedVal / effectivePrice))
            : Math.max(0.0001, parseFloat((parsedVal / effectivePrice).toFixed(4)));
        setSharesInput(computedShares.toString());
      }
    }
  };

  /**
   * Handle user typing in QUANTITY (SHARES):
   * Automatically calculates exact amount = Shares × Price.
   */
  const handleSharesChange = (rawVal: string) => {
    setSharesInput(rawVal);
    setFormError('');

    const parsedShares = parseFloat(rawVal);
    if (!isNaN(parsedShares) && parsedShares > 0) {
      const currentBuyPriceNum = parseFloat(buyPriceInput);
      const effectivePrice = currentBuyPriceNum > 0 ? currentBuyPriceNum : marketPrice > 0 ? marketPrice : 0;
      if (effectivePrice > 0) {
        const computedAmount = parseFloat((parsedShares * effectivePrice).toFixed(2));
        setAmountInput(computedAmount.toString());
      }
    }
  };

  /**
   * Handle user typing in BUY PRICE (₹):
   * Automatically calculates exact amount = Shares × Buy Price.
   */
  const handleBuyPriceChange = (rawVal: string) => {
    setBuyPriceInput(rawVal);
    setFormError('');

    const parsedPrice = parseFloat(rawVal);
    if (!isNaN(parsedPrice) && parsedPrice > 0) {
      const currentShares = parseFloat(sharesInput) || 1;
      const computedAmount = parseFloat((currentShares * parsedPrice).toFixed(2));
      setAmountInput(computedAmount.toString());
    }
  };

  const safeHoldings = Array.isArray(existingHoldings) ? existingHoldings : [];
  const existingHolding = selectedSymbol
    ? safeHoldings.find((h) => h?.symbol && h.symbol.toUpperCase() === selectedSymbol.toUpperCase())
    : undefined;

  // Numerical derived values for summary
  const numericBuyPrice = parseFloat(buyPriceInput) > 0 ? parseFloat(buyPriceInput) : marketPrice > 0 ? marketPrice : 100;
  const numericShares = parseFloat(sharesInput) > 0 ? parseFloat(sharesInput) : 1;
  const numericAmount = parseFloat(amountInput) > 0 ? parseFloat(amountInput) : numericShares * numericBuyPrice;
  const positionValue = numericShares * (marketPrice > 0 ? marketPrice : numericBuyPrice);
  const unrealizedPnL = ((marketPrice > 0 ? marketPrice : numericBuyPrice) - numericBuyPrice) * numericShares;
  const unrealizedPnLPercent = numericBuyPrice > 0 ? (((marketPrice > 0 ? marketPrice : numericBuyPrice) - numericBuyPrice) / numericBuyPrice) * 100 : 0;

  /**
   * Submit handler:
   * Adds holding with correct fetched price and outlay, which automatically saves to portfolio storage.
   */
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const sym = (selectedSymbol || symbolInput).trim().toUpperCase();

    if (!sym) {
      setFormError('Please enter or select a stock symbol (e.g. INFY, TCS, RELIANCE).');
      return;
    }

    // Auto-resolve stock details if typed directly without clicking autocomplete
    const catalogItem = getStockDetails(sym);
    const resolvedCMP = marketPrice > 0 ? marketPrice : catalogItem?.price || 100;
    const finalBuyPrice = parseFloat(buyPriceInput) > 0 ? parseFloat(buyPriceInput) : resolvedCMP;
    const finalMarketPrice = resolvedCMP;

    // Determine final shares
    let finalShares = parseFloat(sharesInput);
    if (isNaN(finalShares) || finalShares <= 0) {
      const enteredAmount = parseFloat(amountInput);
      if (enteredAmount > 0 && finalBuyPrice > 0) {
        finalShares =
          enteredAmount >= finalBuyPrice
            ? Math.max(1, Math.round(enteredAmount / finalBuyPrice))
            : Math.max(0.0001, parseFloat((enteredAmount / finalBuyPrice).toFixed(4)));
      } else {
        finalShares = 1;
      }
    }

    // Check if symbol already exists in portfolio to blend position
    const existingIndex = safeHoldings.findIndex(
      (h) => h?.symbol && h.symbol.toUpperCase() === sym
    );
    let newHolding: PortfolioHolding;

    if (existingIndex >= 0) {
      const existing = safeHoldings[existingIndex];
      const combinedShares = existing.shares + finalShares;
      const combinedTotalCost = existing.shares * existing.avgBuyPrice + finalShares * finalBuyPrice;
      const blendedBuyPrice = combinedShares > 0 ? combinedTotalCost / combinedShares : finalBuyPrice;
      const newPnL = (finalMarketPrice - blendedBuyPrice) * combinedShares;
      const newPnLPercent = blendedBuyPrice > 0 ? ((finalMarketPrice - blendedBuyPrice) / blendedBuyPrice) * 100 : 0;

      const val = calculateListingIntrinsicValue({
        symbol: sym,
        name: companyName || existing.name,
        sector: sector || existing.sector,
        price: finalMarketPrice,
      });

      newHolding = {
        ...existing,
        name: companyName || existing.name,
        sector: sector || existing.sector,
        shares: combinedShares,
        avgBuyPrice: parseFloat(blendedBuyPrice.toFixed(2)),
        currentPrice: parseFloat(finalMarketPrice.toFixed(2)),
        unrealizedPnL: parseFloat(newPnL.toFixed(2)),
        unrealizedPnLPercent: parseFloat(newPnLPercent.toFixed(2)),
        weightPercent: 0,
        intrinsicValue: val.blendedIntrinsicValue,
        marginOfSafetyPercent: val.marginOfSafetyPercent,
        valuationStatus: val.valuationStatus,
      };
    } else {
      const pnl = (finalMarketPrice - finalBuyPrice) * finalShares;
      const pnlPct = finalBuyPrice > 0 ? ((finalMarketPrice - finalBuyPrice) / finalBuyPrice) * 100 : 0;
      const val = calculateListingIntrinsicValue({
        symbol: sym,
        name: companyName || catalogItem?.name || sym,
        sector: sector || catalogItem?.sector || 'Diversified',
        price: finalMarketPrice,
      });

      newHolding = {
        symbol: sym,
        name: companyName || catalogItem?.name || sym,
        shares: finalShares,
        avgBuyPrice: parseFloat(finalBuyPrice.toFixed(2)),
        currentPrice: parseFloat(finalMarketPrice.toFixed(2)),
        sector: sector || catalogItem?.sector || 'Diversified',
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
                Real-time price feed • Auto-saves to saved portfolio
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

        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          {/* Stock Symbol Search & Input */}
          <div className="space-y-1.5" ref={searchDropdownRef}>
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-300 flex items-center justify-between w-full">
                <span>STOCK OR ETF SYMBOL / TICKER</span>
                {selectedSymbol && (
                  <button
                    type="button"
                    onClick={handleClearSelectedStock}
                    className="text-[10px] text-cyan-400 hover:text-cyan-300 underline font-normal"
                  >
                    Change Symbol
                  </button>
                )}
              </label>
            </div>

            {/* Popular ETFs Quick Select Bar */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-[10px] text-slate-400">
                <span className="font-semibold text-cyan-400/90 flex items-center gap-1">
                  <Zap className="w-2.5 h-2.5 text-cyan-400" />
                  Popular ETFs (Index, Gold, Silver & US):
                </span>
                <span className="text-slate-500">1-click select</span>
              </div>
              <div className="flex flex-wrap items-center gap-1">
                {[
                  { sym: 'NIFTYBEES', label: 'Nifty BeES', price: 253.76 },
                  { sym: 'BANKBEES', label: 'Bank BeES', price: 564.48 },
                  { sym: 'GOLDBEES', label: 'Gold BeES', price: 120.94 },
                  { sym: 'SILVERBEES', label: 'Silver BeES', price: 205.87 },
                  { sym: 'ITBEES', label: 'IT BeES', price: 30.80 },
                  { sym: 'CPSEETF', label: 'CPSE ETF', price: 87.15 },
                  { sym: 'MON100', label: 'Nasdaq 100', price: 325.15 },
                  { sym: 'SPY', label: 'S&P 500 (US)', price: 774.63 },
                ].map((etf) => (
                  <button
                    key={etf.sym}
                    type="button"
                    onClick={() => handleSelectStock(etf.sym, etf.label, 'Exchange Traded Fund (ETF)', etf.price)}
                    className={`px-2 py-0.5 rounded-lg text-[10px] font-bold border transition-all ${
                      selectedSymbol === etf.sym
                        ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50 shadow-sm shadow-cyan-950'
                        : 'bg-slate-950 hover:bg-slate-800 text-slate-300 hover:text-white border-slate-800'
                    }`}
                  >
                    {etf.sym} <span className="text-[9px] text-slate-500 font-normal">₹{etf.price}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="relative">
              <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={symbolInput}
                onChange={(e) => {
                  const val = e.target.value.toUpperCase();
                  setSymbolInput(val);
                  setShowSearchResults(true);
                  setSelectedSuggestionIndex(-1);

                  // Quick lookup: if user typed a complete valid symbol or ETF, resolve immediately
                  const quickMatch = getStockDetails(val.trim());
                  if (quickMatch) {
                    setSelectedSymbol(quickMatch.symbol);
                    setCompanyName(quickMatch.name);
                    setSector(quickMatch.sector);
                    setExchange(quickMatch.exchange);
                    setMarketPrice(quickMatch.price);
                    setIsCustomStock(false);
                    if (!buyPriceInputRef.current || parseFloat(buyPriceInputRef.current) <= 0) {
                      setBuyPriceInput(quickMatch.price.toString());
                    }
                    const curShares = parseFloat(sharesInputRef.current) || 1;
                    const curAmt = parseFloat(amountInputRef.current);
                    if (isNaN(curAmt) || curAmt <= 0) {
                      setAmountInput((parseFloat((curShares * quickMatch.price).toFixed(2))).toString());
                    }
                    // Fetch real-time live price from server immediately
                    fetchLiveQuote(quickMatch.symbol);
                  } else if (selectedSymbol && val !== selectedSymbol) {
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
                placeholder="Enter ticker (e.g. INFY, TCS, RELIANCE, HDFCBANK)..."
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
                          <span className="text-[9px] text-emerald-400 font-medium">Live Feed</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Resolved Stock Details Tag */}
            {selectedSymbol && (
              <div className="flex flex-col sm:flex-row sm:items-center justify-between px-3 py-2 rounded-xl bg-slate-950/80 border border-slate-800 text-xs gap-1.5">
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

                <div className="flex items-center gap-2 shrink-0">
                  <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-emerald-950/80 border border-emerald-800/80 text-emerald-300 text-[10px] font-bold">
                    <Zap className="w-3 h-3 text-emerald-400" />
                    <span>Live CMP: ₹{marketPrice.toLocaleString()}</span>
                  </div>

                  <button
                    type="button"
                    onClick={() => fetchLiveQuote(selectedSymbol)}
                    disabled={isFetchingQuote}
                    className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-colors"
                    title="Refresh live market price"
                  >
                    <RefreshCw className={`w-3 h-3 ${isFetchingQuote ? 'animate-spin text-cyan-400' : ''}`} />
                  </button>
                </div>
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

          {/* TOTAL INVESTMENT AMOUNT (Free to enter any amount!) */}
          <div className="p-3.5 rounded-xl bg-slate-950/90 border border-cyan-500/30 space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-cyan-300 flex items-center gap-1.5">
                <Coins className="w-3.5 h-3.5 text-cyan-400" />
                <span>TOTAL INVESTMENT AMOUNT (₹)</span>
              </label>
              <div className="flex items-center gap-1.5">
                {isFetchingQuote && (
                  <span className="text-[10px] text-cyan-400 font-medium flex items-center gap-1">
                    <RefreshCw className="w-2.5 h-2.5 animate-spin" />
                    Fetching Live Amount...
                  </span>
                )}
                <span className="text-[10px] text-emerald-400 font-semibold bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/60 flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" />
                  Free to enter any amount
                </span>
              </div>
            </div>

            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-cyan-400 font-bold text-sm">₹</span>
              <input
                type="text"
                inputMode="decimal"
                value={amountInput}
                onChange={(e) => handleAmountChange(e.target.value)}
                placeholder="Enter any amount (e.g. 5000, 25000, 50000, 100000)..."
                className="w-full bg-slate-900 border border-cyan-500/50 rounded-xl pl-8 pr-3 py-2.5 text-sm text-white font-bold placeholder-slate-500 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-500/30"
              />
            </div>

            {/* Quick 1-click Amount Presets */}
            <div className="flex flex-wrap items-center gap-1.5 pt-1">
              <span className="text-[10px] text-slate-400 mr-1">Quick Add:</span>
              {[
                { label: '₹10,000', val: '10000' },
                { label: '₹25,000', val: '25000' },
                { label: '₹50,000', val: '50000' },
                { label: '₹1,00,000', val: '100000' },
                { label: '₹5,00,000', val: '500000' },
                { label: '₹10,00,000', val: '1000000' },
              ].map((preset) => (
                <button
                  key={preset.label}
                  type="button"
                  onClick={() => handleAmountChange(preset.val)}
                  className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-slate-900 hover:bg-cyan-950 text-slate-300 hover:text-cyan-300 border border-slate-800 hover:border-cyan-700 transition-colors"
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>

          {/* Form Grid: Shares, Buy Price, Fixed Market Price */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Shares / Quantity */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300">
                QUANTITY (SHARES)
              </label>
              <input
                type="text"
                inputMode="decimal"
                value={sharesInput}
                onChange={(e) => handleSharesChange(e.target.value)}
                placeholder="Shares"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-bold focus:outline-none focus:border-cyan-500 font-mono"
              />
            </div>

            {/* Buy Price */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300">
                BUY PRICE (₹)
              </label>
              <input
                type="text"
                inputMode="decimal"
                value={buyPriceInput}
                onChange={(e) => handleBuyPriceChange(e.target.value)}
                placeholder="₹ Buy Price"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-bold focus:outline-none focus:border-cyan-500 font-mono"
              />
            </div>

            {/* Market Price (Fetched Live CMP) */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-300 flex items-center gap-1">
                  <Lock className="w-3 h-3 text-emerald-400" />
                  <span>FETCHED CMP (₹)</span>
                </label>
                <span className="text-[9px] text-emerald-400 font-bold bg-emerald-950/80 px-1.5 py-0.2 rounded border border-emerald-800/80">
                  {isFetchingQuote ? 'SYNCING...' : 'LIVE'}
                </span>
              </div>
              <div className="relative">
                <input
                  type="text"
                  readOnly={!isCustomStock}
                  value={marketPrice > 0 ? marketPrice.toString() : ''}
                  onChange={(e) => {
                    if (isCustomStock) {
                      const p = parseFloat(e.target.value) || 0;
                      setMarketPrice(p);
                    }
                  }}
                  placeholder="Fetched CMP"
                  className={`w-full bg-slate-950 border border-emerald-800/60 rounded-xl px-3 py-2 text-xs text-emerald-300 font-bold font-mono focus:outline-none ${
                    !isCustomStock ? 'cursor-not-allowed bg-slate-950/90' : 'focus:border-emerald-500'
                  }`}
                  title="Current market price fetched directly from market feed"
                />
                <Lock className="w-3.5 h-3.5 text-emerald-400/80 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
              <p className="text-[9px] text-slate-400 font-sans">
                {liveQuoteTime ? `Updated at ${liveQuoteTime}` : 'Real-time market feed'}
              </p>
            </div>
          </div>

          {/* Investment Summary */}
          {numericShares > 0 && numericBuyPrice > 0 && (
            <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800/80 space-y-1.5 text-xs">
              <div className="flex items-center justify-between text-slate-400">
                <span>Calculated Investment Outlay:</span>
                <span className="text-white font-bold text-sm">
                  ₹{numericAmount.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                </span>
              </div>
              <div className="flex items-center justify-between text-slate-400 text-[11px]">
                <span>Shares Breakdown:</span>
                <span className="text-slate-300 font-medium">
                  {numericShares} shares @ ₹{numericBuyPrice.toLocaleString()}
                </span>
              </div>
              {marketPrice > 0 && (
                <>
                  <div className="flex items-center justify-between text-slate-400">
                    <span>Position Value @ Live CMP (₹{marketPrice.toLocaleString()}):</span>
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

          {/* Form Error (Only if ticker missing, NEVER for amount) */}
          {formError && (
            <div className="p-2.5 rounded-xl bg-rose-950/60 border border-rose-800 text-rose-300 text-xs flex items-center gap-2">
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
              className="flex items-center gap-1.5 px-5 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 shadow-md shadow-emerald-950/50 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Add Stock to Portfolio</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
