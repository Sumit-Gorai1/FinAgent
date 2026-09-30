import React from 'react';
import {
  Bell,
  X,
  TrendingUp,
  TrendingDown,
  ArrowRight,
  ExternalLink,
  Volume2,
} from 'lucide-react';
import { PriceAlertNotification } from '../types';

interface PriceAlertNotificationBannerProps {
  notifications: PriceAlertNotification[];
  onDismiss: (id: string) => void;
  onSelectStock: (symbol: string) => void;
}

export const PriceAlertNotificationBanner: React.FC<PriceAlertNotificationBannerProps> = ({
  notifications,
  onDismiss,
  onSelectStock,
}) => {
  if (notifications.length === 0) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3 max-w-md w-full pointer-events-none">
      {notifications.map((notif, index) => {
        const isAbove = notif.condition === 'ABOVE';

        return (
          <div
            key={`${notif.id}-${index}`}
            className="pointer-events-auto bg-slate-900/95 backdrop-blur-md border border-cyan-500/50 rounded-2xl p-4 shadow-2xl shadow-cyan-950/40 animate-in slide-in-from-bottom-5 duration-300 ring-1 ring-cyan-500/30"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <div
                  className={`p-2.5 rounded-xl mt-0.5 shrink-0 animate-bounce ${
                    isAbove ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'
                  }`}
                >
                  {isAbove ? <TrendingUp className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />}
                </div>

                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded bg-cyan-950 border border-cyan-800 text-cyan-300 font-mono text-xs font-bold">
                      {notif.symbol}
                    </span>
                    <span className="text-xs font-bold font-mono text-white">
                      PRICE TARGET REACHED!
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {notif.timestamp}
                    </span>
                  </div>

                  <p className="text-xs text-slate-200 leading-relaxed font-sans">
                    Stock has {isAbove ? 'risen above' : 'fallen below'} target threshold{' '}
                    <strong className="text-cyan-400 font-mono">
                      ₹{notif.targetPrice.toLocaleString()}
                    </strong>{' '}
                    (Current: <strong className="text-white font-mono">₹{notif.currentPrice.toLocaleString()}</strong>).
                  </p>

                  {notif.note && (
                    <p className="text-[11px] text-slate-400 italic bg-slate-950/60 px-2 py-1 rounded border border-slate-800">
                      Note: "{notif.note}"
                    </p>
                  )}

                  <div className="pt-2 flex items-center gap-2">
                    <button
                      onClick={() => {
                        onSelectStock(notif.symbol);
                        onDismiss(notif.id);
                      }}
                      className="px-3 py-1 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-mono font-semibold rounded-lg flex items-center gap-1.5 transition-colors shadow-sm"
                    >
                      <span>Analyze {notif.symbol}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => onDismiss(notif.id)}
                      className="px-2.5 py-1 text-xs text-slate-400 hover:text-white font-mono rounded hover:bg-slate-800 transition-colors"
                    >
                      Dismiss
                    </button>
                  </div>
                </div>
              </div>

              <button
                onClick={() => onDismiss(notif.id)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
};
