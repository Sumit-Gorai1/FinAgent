import React, { useState } from 'react';
import {
  X,
  TrendingUp,
  Plus,
  Minus,
  Edit3,
  DollarSign,
  AlertCircle,
  CheckCircle2,
  Wallet,
  ArrowRight,
} from 'lucide-react';
import { PortfolioHolding } from '../types';
import { EducationalDisclaimer } from './EducationalDisclaimer';

export type PositionActionType = 'BUY' | 'TRIM' | 'EDIT';

interface PositionActionModalProps {
  isOpen: boolean;
  onClose: () => void;
  holding: PortfolioHolding | null;
  initialAction: PositionActionType;
  cashBalance: number;
  onExecuteTrade: (symbol: string, action: 'BUY' | 'TRIM', shares: number, price: number) => void;
  onUpdatePosition: (symbol: string, newShares: number, newAvgBuyPrice: number) => void;
}

export const PositionActionModal: React.FC<PositionActionModalProps> = ({
  isOpen,
  onClose,
  holding,
  initialAction,
  cashBalance,
  onExecuteTrade,
  onUpdatePosition,
}) => {
  if (!isOpen || !holding) return null;

  const [action, setAction] = useState<PositionActionType>(initialAction);
  const [tradeShares, setTradeShares] = useState<number>(
    initialAction === 'TRIM' ? Math.max(1, Math.floor(holding.shares / 2)) : 10
  );
  const [editShares, setEditShares] = useState<number>(holding.shares);
  const [editAvgPrice, setEditAvgPrice] = useState<number>(holding.avgBuyPrice);
  const [errorMessage, setErrorMessage] = useState<string>('');

  const currentPrice = holding.currentPrice;

  // Calculation for Buy
  const buyTotalCost = tradeShares * currentPrice;
  const isBuyAffordable = cashBalance >= buyTotalCost;
  const postBuyShares = holding.shares + tradeShares;
  const postBuyAvgPrice =
    postBuyShares > 0
      ? (holding.shares * holding.avgBuyPrice + buyTotalCost) / postBuyShares
      : holding.avgBuyPrice;

  // Calculation for Trim
  const trimSharesClamped = Math.min(holding.shares, Math.max(1, tradeShares));
  const trimProceeds = trimSharesClamped * currentPrice;
  const postTrimShares = holding.shares - trimSharesClamped;
  const realizedTrimPnL = (currentPrice - holding.avgBuyPrice) * trimSharesClamped;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (action === 'BUY') {
      if (tradeShares <= 0) {
        setErrorMessage('Please specify a positive number of shares to buy.');
        return;
      }
      onExecuteTrade(holding.symbol, 'BUY', tradeShares, currentPrice);
      onClose();
    } else if (action === 'TRIM') {
      if (trimSharesClamped <= 0) {
        setErrorMessage('Please specify shares to trim.');
        return;
      }
      onExecuteTrade(holding.symbol, 'TRIM', trimSharesClamped, currentPrice);
      onClose();
    } else {
      // EDIT
      if (editShares <= 0) {
        setErrorMessage('Shares must be greater than 0 (or remove position from table).');
        return;
      }
      if (editAvgPrice <= 0) {
        setErrorMessage('Average purchase price must be greater than 0.');
        return;
      }
      onUpdatePosition(holding.symbol, editShares, editAvgPrice);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn font-mono">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-5 max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center border border-cyan-500/40">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-base font-bold text-white tracking-wide">
                  {holding.symbol}
                </span>
                <span className="text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                  {holding.sector}
                </span>
              </div>
              <p className="text-xs text-slate-400 font-sans mt-0.5 truncate max-w-xs">
                {holding.name} • CMP: ₹{currentPrice.toLocaleString()}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Action Switcher Tabs */}
        <div className="grid grid-cols-3 gap-2 bg-slate-950 p-1 rounded-2xl border border-slate-800 text-xs">
          <button
            type="button"
            onClick={() => {
              setAction('BUY');
              setErrorMessage('');
            }}
            className={`py-2 rounded-xl font-bold flex items-center justify-center gap-1.5 transition-all ${
              action === 'BUY'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-950/50'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Buy More</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setAction('TRIM');
              setErrorMessage('');
            }}
            className={`py-2 rounded-xl font-bold flex items-center justify-center gap-1.5 transition-all ${
              action === 'TRIM'
                ? 'bg-rose-600 text-white shadow-md shadow-rose-950/50'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Minus className="w-3.5 h-3.5" />
            <span>Trim / Sell</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setAction('EDIT');
              setErrorMessage('');
            }}
            className={`py-2 rounded-xl font-bold flex items-center justify-center gap-1.5 transition-all ${
              action === 'EDIT'
                ? 'bg-cyan-600 text-white shadow-md shadow-cyan-950/50'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>Edit Position</span>
          </button>
        </div>

        {/* Current Position Snapshot */}
        <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800 grid grid-cols-3 gap-2 text-xs">
          <div>
            <span className="text-[10px] text-slate-500">CURRENT SHARES</span>
            <div className="text-white font-bold text-sm mt-0.5">{holding.shares}</div>
          </div>
          <div>
            <span className="text-[10px] text-slate-500">AVG BUY PRICE</span>
            <div className="text-white font-bold text-sm mt-0.5">₹{holding.avgBuyPrice.toLocaleString()}</div>
          </div>
          <div>
            <span className="text-[10px] text-slate-500">POSITION VALUE</span>
            <div className="text-white font-bold text-sm mt-0.5">
              ₹{(holding.shares * currentPrice).toLocaleString()}
            </div>
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          {action === 'BUY' && (
            <div className="space-y-3">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <label className="text-slate-300 font-semibold">SHARES TO BUY</label>
                  <span className="text-slate-400 text-[11px] flex items-center gap-1">
                    <Wallet className="w-3 h-3 text-cyan-400" />
                    Cash: ₹{cashBalance.toLocaleString()}
                  </span>
                </div>
                <input
                  type="number"
                  step="any"
                  value={tradeShares}
                  onChange={(e) => setTradeShares(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-white font-bold focus:outline-none focus:border-emerald-500"
                />
                <div className="flex items-center gap-1 pt-1">
                  {[5, 10, 25, 50, 100].map((qty) => (
                    <button
                      key={qty}
                      type="button"
                      onClick={() => setTradeShares(qty)}
                      className="flex-1 py-1 rounded-lg text-[10px] bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors"
                    >
                      {qty} sh
                    </button>
                  ))}
                </div>
              </div>

              {/* Order Preview */}
              <div className="p-3.5 rounded-2xl bg-emerald-950/20 border border-emerald-900/40 text-xs space-y-1.5">
                <div className="flex items-center justify-between text-slate-300">
                  <span>Execution Price (CMP):</span>
                  <span className="text-white font-bold">₹{currentPrice.toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between text-slate-300">
                  <span>Total Capital Outlay:</span>
                  <span className="text-emerald-400 font-bold">
                    ₹{buyTotalCost.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="flex items-center justify-between text-slate-400 text-[11px] pt-1 border-t border-emerald-900/30">
                  <span>New Blended Avg Price:</span>
                  <span className="text-white font-semibold">
                    ₹{postBuyAvgPrice.toFixed(2)} ({postBuyShares} shares)
                  </span>
                </div>
              </div>
            </div>
          )}

          {action === 'TRIM' && (
            <div className="space-y-3">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <label className="text-slate-300 font-semibold">SHARES TO TRIM / SELL</label>
                  <span className="text-slate-400 text-[11px]">
                    Max Sellable: {holding.shares} shares
                  </span>
                </div>
                <input
                  type="number"
                  step="any"
                  value={trimSharesClamped}
                  onChange={(e) => setTradeShares(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-white font-bold focus:outline-none focus:border-rose-500"
                />
                <div className="flex items-center gap-1 pt-1">
                  {[
                    { label: '25%', frac: 0.25 },
                    { label: '50%', frac: 0.5 },
                    { label: '75%', frac: 0.75 },
                    { label: '100% (Exit)', frac: 1.0 },
                  ].map((preset) => (
                    <button
                      key={preset.label}
                      type="button"
                      onClick={() => setTradeShares(Math.max(1, Math.round(holding.shares * preset.frac)))}
                      className="flex-1 py-1 rounded-lg text-[10px] bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors"
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Order Preview */}
              <div className="p-3.5 rounded-2xl bg-rose-950/20 border border-rose-900/40 text-xs space-y-1.5">
                <div className="flex items-center justify-between text-slate-300">
                  <span>Cash Return to Balance:</span>
                  <span className="text-emerald-400 font-bold">
                    +₹{trimProceeds.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="flex items-center justify-between text-slate-300">
                  <span>Realized P&L on Sale:</span>
                  <span
                    className={`font-bold ${
                      realizedTrimPnL >= 0 ? 'text-emerald-400' : 'text-rose-400'
                    }`}
                  >
                    {realizedTrimPnL >= 0 ? '+' : ''}₹{realizedTrimPnL.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="flex items-center justify-between text-slate-400 text-[11px] pt-1 border-t border-rose-900/30">
                  <span>Remaining Position:</span>
                  <span className="text-white font-semibold">
                    {postTrimShares} shares ({postTrimShares === 0 ? 'Position Closed' : `₹${(postTrimShares * currentPrice).toLocaleString()}`})
                  </span>
                </div>
              </div>
            </div>
          )}

          {action === 'EDIT' && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-slate-300 font-semibold text-xs">TOTAL SHARES</label>
                  <input
                    type="number"
                    step="any"
                    value={editShares}
                    onChange={(e) => setEditShares(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-white font-bold focus:outline-none focus:border-cyan-500"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-slate-300 font-semibold text-xs">AVG BUY PRICE (₹)</label>
                  <input
                    type="number"
                    step="any"
                    value={editAvgPrice}
                    onChange={(e) => setEditAvgPrice(parseFloat(e.target.value) || 0)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-white font-bold focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-cyan-950/20 border border-cyan-900/40 text-xs space-y-1.5">
                <div className="flex items-center justify-between text-slate-300">
                  <span>Updated Invested Cost:</span>
                  <span className="text-white font-bold">
                    ₹{(editShares * editAvgPrice).toLocaleString()}
                  </span>
                </div>
                <div className="flex items-center justify-between text-slate-300">
                  <span>Recalculated P&L:</span>
                  <span
                    className={`font-bold ${
                      currentPrice >= editAvgPrice ? 'text-emerald-400' : 'text-rose-400'
                    }`}
                  >
                    {currentPrice >= editAvgPrice ? '+' : ''}₹{((currentPrice - editAvgPrice) * editShares).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Error notice */}
          {errorMessage && (
            <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-800 text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold text-white shadow-lg transition-all ${
                action === 'BUY'
                  ? 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-950/50'
                  : action === 'TRIM'
                  ? 'bg-rose-600 hover:bg-rose-500 shadow-rose-950/50'
                  : 'bg-cyan-600 hover:bg-cyan-500 shadow-cyan-950/50'
              }`}
            >
              <span>
                {action === 'BUY'
                  ? `Execute Buy (+${tradeShares} shares)`
                  : action === 'TRIM'
                  ? `Confirm Trim (-${trimSharesClamped} shares)`
                  : 'Save Position Changes'}
              </span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <EducationalDisclaimer
            variant="footer"
            actionContext="BUY_SELL_HOLD"
            className="pt-2 border-t border-slate-800"
          />
        </form>
      </div>
    </div>
  );
};
