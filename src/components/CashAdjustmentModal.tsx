import React, { useState } from 'react';
import {
  X,
  Wallet,
  Plus,
  Minus,
  CheckCircle2,
  AlertCircle,
  IndianRupee,
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
  currentCash,
  onUpdateCash,
}) => {
  if (!isOpen) return null;

  const [mode, setMode] = useState<'DEPOSIT' | 'WITHDRAW'>('DEPOSIT');
  const [amount, setAmount] = useState<number>(100000); // 1 Lakh default
  const [error, setError] = useState<string>('');

  const previewBalance =
    mode === 'DEPOSIT' ? currentCash + amount : currentCash - amount;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (amount <= 0 || isNaN(amount)) {
      setError('Please specify a positive amount.');
      return;
    }
    if (mode === 'WITHDRAW' && amount > currentCash) {
      setError(`Cannot withdraw more than available cash (₹${currentCash.toLocaleString()}).`);
      return;
    }

    onUpdateCash(previewBalance);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn font-mono">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-5">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center border border-cyan-500/40">
              <Wallet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white tracking-wide">
                MANAGE VIRTUAL CASH
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

        {/* Mode Selector */}
        <div className="grid grid-cols-2 gap-2 bg-slate-950 p-1 rounded-2xl border border-slate-800 text-xs">
          <button
            type="button"
            onClick={() => {
              setMode('DEPOSIT');
              setError('');
            }}
            className={`py-2 rounded-xl font-bold flex items-center justify-center gap-1.5 transition-all ${
              mode === 'DEPOSIT'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Deposit Funds</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setMode('WITHDRAW');
              setError('');
            }}
            className={`py-2 rounded-xl font-bold flex items-center justify-center gap-1.5 transition-all ${
              mode === 'WITHDRAW'
                ? 'bg-rose-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Minus className="w-3.5 h-3.5" />
            <span>Withdraw Funds</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-slate-300 font-semibold text-xs">
              AMOUNT (₹)
            </label>
            <input
              type="number"
              min="1000"
              step="5000"
              value={amount}
              onChange={(e) => setAmount(Math.max(0, parseFloat(e.target.value) || 0))}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-white font-bold focus:outline-none focus:border-cyan-500"
              required
            />

            {/* Presets */}
            <div className="flex items-center gap-1.5 pt-1">
              {[
                { label: '+₹50k', val: 50000 },
                { label: '+₹1L', val: 100000 },
                { label: '+₹5L', val: 500000 },
                { label: '+₹10L', val: 1000000 },
              ].map((p) => (
                <button
                  key={p.label}
                  type="button"
                  onClick={() => setAmount(p.val)}
                  className="flex-1 py-1 rounded-lg text-[10px] bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors"
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 text-xs space-y-1.5">
            <div className="flex items-center justify-between text-slate-400">
              <span>Updated Cash Balance:</span>
              <span className="text-white font-bold text-sm">
                ₹{previewBalance.toLocaleString()}
              </span>
            </div>
            <div className="flex items-center justify-between text-slate-400">
              <span>Change Delta:</span>
              <span
                className={`font-bold ${
                  mode === 'DEPOSIT' ? 'text-emerald-400' : 'text-rose-400'
                }`}
              >
                {mode === 'DEPOSIT' ? '+' : '-'}₹{amount.toLocaleString()}
              </span>
            </div>
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-800 text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-cyan-600 hover:bg-cyan-500 shadow-lg"
            >
              Confirm Update
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
