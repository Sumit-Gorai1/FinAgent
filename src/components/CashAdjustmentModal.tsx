import React, { useState } from 'react';
import {
  X,
  Wallet,
  Plus,
  Minus,
  CheckCircle2,
  AlertCircle,
  IndianRupee,
  Sliders,
  ShieldCheck,
} from 'lucide-react';

interface CashAdjustmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentCash: number;
  onUpdateCash: (newBalance: number) => void;
}

export const CashAdjustmentModal: React.FC<CashAdjustmentModalProps> = ({
  isOpen,
  onClose,
  currentCash = 1000000,
  onUpdateCash,
}) => {
  if (!isOpen) return null;

  const [mode, setMode] = useState<'DEPOSIT' | 'WITHDRAW' | 'SET'>('DEPOSIT');
  const [amountInput, setAmountInput] = useState<string>('100000');
  const [error, setError] = useState<string>('');

  const numericValue = parseFloat(amountInput) || 0;

  const previewBalance =
    mode === 'SET'
      ? Math.max(0, numericValue)
      : mode === 'DEPOSIT'
      ? currentCash + numericValue
      : Math.max(0, currentCash - numericValue);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const parsed = parseFloat(amountInput);
    if (isNaN(parsed) || parsed < 0) {
      setError('Please enter a valid amount.');
      return;
    }

    if (mode === 'SET') {
      onUpdateCash(Math.max(0, parsed));
    } else if (mode === 'DEPOSIT') {
      onUpdateCash(currentCash + parsed);
    } else if (mode === 'WITHDRAW') {
      onUpdateCash(Math.max(0, currentCash - parsed));
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn font-mono">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center border border-cyan-500/40">
              <Wallet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white tracking-wide">
                MANAGE CASH BALANCE
              </h3>
              <p className="text-xs text-slate-400 font-sans mt-0.5">
                Current Balance: ₹{currentCash.toLocaleString()}
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

        {/* Mode Selector Tabs (Deposit / Withdraw / Set Exact) */}
        <div className="grid grid-cols-3 gap-1.5 bg-slate-950 p-1 rounded-2xl border border-slate-800 text-xs">
          <button
            type="button"
            onClick={() => {
              setMode('DEPOSIT');
              setError('');
            }}
            className={`py-2 rounded-xl font-bold flex items-center justify-center gap-1 transition-all ${
              mode === 'DEPOSIT'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Deposit</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setMode('WITHDRAW');
              setError('');
            }}
            className={`py-2 rounded-xl font-bold flex items-center justify-center gap-1 transition-all ${
              mode === 'WITHDRAW'
                ? 'bg-rose-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Minus className="w-3.5 h-3.5" />
            <span>Withdraw</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setMode('SET');
              setError('');
              if (amountInput === '100000') {
                setAmountInput(currentCash.toString());
              }
            }}
            className={`py-2 rounded-xl font-bold flex items-center justify-center gap-1 transition-all ${
              mode === 'SET'
                ? 'bg-cyan-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Set Exact</span>
          </button>
        </div>

        {/* Input Form without any restrictive HTML5 constraints */}
        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-slate-300 font-semibold text-xs flex items-center gap-1.5">
                <IndianRupee className="w-3.5 h-3.5 text-cyan-400" />
                <span>
                  {mode === 'SET' ? 'NEW EXACT BALANCE (₹)' : mode === 'DEPOSIT' ? 'DEPOSIT AMOUNT (₹)' : 'WITHDRAW AMOUNT (₹)'}
                </span>
              </label>
              <span className="text-[10px] text-emerald-400 font-semibold bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/60 flex items-center gap-1">
                <ShieldCheck className="w-3 h-3" />
                Free to enter any value
              </span>
            </div>

            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-cyan-400 font-bold text-sm">
                ₹
              </span>
              <input
                type="text"
                inputMode="decimal"
                value={amountInput}
                onChange={(e) => {
                  setAmountInput(e.target.value);
                  setError('');
                }}
                placeholder="Enter any amount (e.g. 50000, 100000, 500000)..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2.5 text-sm text-white font-bold focus:outline-none focus:border-cyan-500 font-mono"
                autoFocus
              />
            </div>

            {/* Presets */}
            <div className="space-y-1 pt-1">
              <div className="text-[10px] text-slate-400">Quick 1-Click Values:</div>
              <div className="grid grid-cols-4 gap-1.5">
                {(mode === 'SET'
                  ? [
                      { label: '₹2.5L', val: '250000' },
                      { label: '₹5L', val: '500000' },
                      { label: '₹10L', val: '1000000' },
                      { label: '₹25L', val: '2500000' },
                    ]
                  : [
                      { label: '₹25,000', val: '25000' },
                      { label: '₹50,000', val: '50000' },
                      { label: '₹1,00,000', val: '100000' },
                      { label: '₹5,00,000', val: '500000' },
                    ]
                ).map((p) => (
                  <button
                    key={p.label}
                    type="button"
                    onClick={() => {
                      setAmountInput(p.val);
                      setError('');
                    }}
                    className="py-1.5 rounded-lg text-[10px] font-bold bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700/80 transition-colors"
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Balance Preview Card */}
          <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 text-xs space-y-1.5">
            <div className="flex items-center justify-between text-slate-400">
              <span>Updated Cash Balance:</span>
              <span className="text-white font-bold text-sm">
                ₹{previewBalance.toLocaleString(undefined, { maximumFractionDigits: 2 })}
              </span>
            </div>
            <div className="flex items-center justify-between text-slate-400 text-[11px]">
              <span>Change Effect:</span>
              <span
                className={`font-bold ${
                  mode === 'SET'
                    ? 'text-cyan-400'
                    : mode === 'DEPOSIT'
                    ? 'text-emerald-400'
                    : 'text-rose-400'
                }`}
              >
                {mode === 'SET'
                  ? `Direct set to ₹${previewBalance.toLocaleString()}`
                  : `${mode === 'DEPOSIT' ? '+' : '-'}₹${numericValue.toLocaleString()}`}
              </span>
            </div>
          </div>

          {error && (
            <div className="p-2.5 rounded-xl bg-rose-950/60 border border-rose-800 text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-cyan-600 hover:bg-cyan-500 shadow-lg shadow-cyan-950/50 transition-colors"
            >
              Confirm Balance
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
