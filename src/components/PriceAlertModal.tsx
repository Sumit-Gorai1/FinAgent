import React from 'react';
import {
  Bell,
  X,
  Plus,
  Trash2,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Sparkles,
  CheckCircle2,
  Volume2,
  VolumeX,
  Play,
  Clock,
  Target,
  Info,
} from 'lucide-react';
import { PriceAlert, StockResearchData } from '../types';
import { playAlertChime } from '../utils/soundAlert';

interface PriceAlertModalProps {
  stock: StockResearchData;
  alerts: PriceAlert[];
  onClose: () => void;
  onAddAlert: (newAlert: Omit<PriceAlert, 'id' | 'createdAt' | 'status'>) => void;
  onDeleteAlert: (alertId: string) => void;
  onTriggerSimulatedAlert: (alert: PriceAlert) => void;
  initialTargetPrice?: number;
  initialCondition?: 'ABOVE' | 'BELOW';
  initialNote?: string;
}

export const PriceAlertModal: React.FC<PriceAlertModalProps> = ({
  stock,
  alerts,
  onClose,
  onAddAlert,
  onDeleteAlert,
  onTriggerSimulatedAlert,
  initialTargetPrice,
  initialCondition = 'ABOVE',
  initialNote = '',
}) => {
  const [condition, setCondition] = React.useState<'ABOVE' | 'BELOW'>(initialCondition);
  const [targetPrice, setTargetPrice] = React.useState<number>(
    initialTargetPrice || Math.round(condition === 'ABOVE' ? stock.price * 1.03 : stock.price * 0.97)
  );
  const [note, setNote] = React.useState<string>(initialNote);
  const [soundEnabled, setSoundEnabled] = React.useState<boolean>(true);
  const [activeTab, setActiveTab] = React.useState<'create' | 'list'>('create');
  const [simulatedPriceInput, setSimulatedPriceInput] = React.useState<number>(stock.price);

  // Filter alerts for current stock
  const stockAlerts = alerts.filter((a) => a.symbol === stock.symbol);
  const activeAlerts = stockAlerts.filter((a) => a.status === 'ACTIVE');
  const triggeredAlerts = stockAlerts.filter((a) => a.status === 'TRIGGERED');

  const diffPercent = stock.price > 0 ? ((targetPrice - stock.price) / stock.price) * 100 : 0;

  // Preset generators
  const applyPreset = (pct: number, cond: 'ABOVE' | 'BELOW', noteText: string) => {
    const calc = Math.round(stock.price * (1 + pct / 100));
    setTargetPrice(calc);
    setCondition(cond);
    setNote(noteText);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetPrice || targetPrice <= 0) return;

    if (soundEnabled) {
      playAlertChime('success');
    }

    onAddAlert({
      symbol: stock.symbol,
      stockName: stock.name,
      targetPrice,
      condition,
      createdPrice: stock.price,
      note: note.trim() || undefined,
    });

    setActiveTab('list');
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-6 animate-in fade-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-950/70 border border-cyan-800/60 flex items-center justify-center text-cyan-400">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white font-mono">
                  CUSTOM PRICE THRESHOLD ALERTS
                </h3>
                <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-cyan-950 border border-cyan-800 text-cyan-300 font-bold">
                  {stock.symbol}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Current Price: <strong className="text-white font-mono">{stock.currency}{stock.price.toLocaleString()}</strong> ({stock.changePercent >= 0 ? '+' : ''}{stock.changePercent.toFixed(2)}%)
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Toggle */}
        <div className="flex items-center gap-2 border-b border-slate-800/80 pb-2 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('create')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg transition-all ${
              activeTab === 'create'
                ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Plus className="w-3.5 h-3.5" />
            Create Alert
          </button>
          <button
            onClick={() => setActiveTab('list')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg transition-all ${
              activeTab === 'list'
                ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Bell className="w-3.5 h-3.5" />
            Active Alerts ({activeAlerts.length})
            {triggeredAlerts.length > 0 && (
              <span className="ml-1 px-1.5 py-0.2 rounded-full bg-amber-500/20 text-amber-300 text-[10px]">
                {triggeredAlerts.length} triggered
              </span>
            )}
          </button>
        </div>

        {/* TAB 1: Create New Alert Form */}
        {activeTab === 'create' && (
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Condition selector */}
            <div>
              <label className="block text-xs font-mono text-slate-300 mb-2">
                TRIGGER CONDITION
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setCondition('ABOVE')}
                  className={`p-3 rounded-xl border text-left flex items-center justify-between transition-all ${
                    condition === 'ABOVE'
                      ? 'bg-emerald-950/40 border-emerald-500 text-emerald-300 ring-1 ring-emerald-500/30'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
                      <TrendingUp className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold font-mono text-white">Rises Above (≥)</div>
                      <div className="text-[11px] text-slate-400">Breakout or profit target</div>
                    </div>
                  </div>
                  {condition === 'ABOVE' && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
                </button>

                <button
                  type="button"
                  onClick={() => setCondition('BELOW')}
                  className={`p-3 rounded-xl border text-left flex items-center justify-between transition-all ${
                    condition === 'BELOW'
                      ? 'bg-rose-950/40 border-rose-500 text-rose-300 ring-1 ring-rose-500/30'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-lg bg-rose-500/10 text-rose-400">
                      <TrendingDown className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold font-mono text-white">Falls Below (≤)</div>
                      <div className="text-[11px] text-slate-400">Stop-loss or dip accumulation</div>
                    </div>
                  </div>
                  {condition === 'BELOW' && <CheckCircle2 className="w-4 h-4 text-rose-400" />}
                </button>
              </div>
            </div>

            {/* Target Price input */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-mono text-slate-300">
                  TARGET PRICE THRESHOLD ({stock.currency})
                </label>
                <span className="text-xs font-mono">
                  {diffPercent > 0 ? (
                    <span className="text-emerald-400">+{diffPercent.toFixed(2)}% from current</span>
                  ) : diffPercent < 0 ? (
                    <span className="text-rose-400">{diffPercent.toFixed(2)}% from current</span>
                  ) : (
                    <span className="text-slate-400">At current market price</span>
                  )}
                </span>
              </div>

              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-mono text-slate-400 font-bold">
                  {stock.currency}
                </span>
                <input
                  type="number"
                  step="0.5"
                  value={targetPrice}
                  onChange={(e) => setTargetPrice(Number(e.target.value))}
                  required
                  className="w-full pl-8 pr-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-cyan-500 focus:outline-none text-white font-mono text-lg font-bold"
                />
              </div>

              {/* Quick Preset Buttons */}
              <div className="mt-3 flex flex-wrap gap-1.5 text-xs font-mono">
                <span className="text-slate-500 self-center text-[11px] mr-1">Quick Presets:</span>
                <button
                  type="button"
                  onClick={() => applyPreset(2, 'ABOVE', 'Short-term breakout +2%')}
                  className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                >
                  +2%
                </button>
                <button
                  type="button"
                  onClick={() => applyPreset(5, 'ABOVE', 'Momentum target +5%')}
                  className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                >
                  +5%
                </button>
                <button
                  type="button"
                  onClick={() => applyPreset(10, 'ABOVE', 'High conviction target +10%')}
                  className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                >
                  +10%
                </button>
                <button
                  type="button"
                  onClick={() => applyPreset(-3, 'BELOW', 'Trailing stop-loss -3%')}
                  className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-rose-300 hover:text-rose-200 transition-colors"
                >
                  -3% Stop
                </button>
                <button
                  type="button"
                  onClick={() => applyPreset(-5, 'BELOW', 'Support invalidation -5%')}
                  className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-rose-300 hover:text-rose-200 transition-colors"
                >
                  -5% Stop
                </button>
                {stock.technicals.sma20 && (
                  <button
                    type="button"
                    onClick={() => {
                      setTargetPrice(stock.technicals.sma20);
                      setCondition(stock.price > stock.technicals.sma20 ? 'BELOW' : 'ABOVE');
                      setNote(`Test of 20-Day SMA (₹${stock.technicals.sma20})`);
                    }}
                    className="px-2.5 py-1 rounded-lg bg-amber-950/50 border border-amber-800/40 text-amber-300 hover:bg-amber-900/50 transition-colors"
                  >
                    SMA 20 (₹{stock.technicals.sma20})
                  </button>
                )}
                {stock.fiftyTwoWeekHigh && (
                  <button
                    type="button"
                    onClick={() => {
                      setTargetPrice(stock.fiftyTwoWeekHigh);
                      setCondition('ABOVE');
                      setNote('52-Week High Breakout Test');
                    }}
                    className="px-2.5 py-1 rounded-lg bg-cyan-950/50 border border-cyan-800/40 text-cyan-300 hover:bg-cyan-900/50 transition-colors"
                  >
                    52W High (₹{stock.fiftyTwoWeekHigh})
                  </button>
                )}
              </div>
            </div>

            {/* Alert Note */}
            <div>
              <label className="block text-xs font-mono text-slate-300 mb-1.5">
                ALERT REASON / THESIS NOTE (OPTIONAL)
              </label>
              <input
                type="text"
                placeholder="e.g. Take 50% profit, Accumulate on support test, or Exit if invalidated"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                maxLength={100}
                className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 focus:border-cyan-500 focus:outline-none text-slate-200 text-xs font-sans placeholder:text-slate-600"
              />
            </div>

            {/* Notification settings */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950/60 border border-slate-800 text-xs">
              <div className="flex items-center gap-2 text-slate-300">
                <button
                  type="button"
                  onClick={() => setSoundEnabled(!soundEnabled)}
                  className={`p-1.5 rounded-lg border transition-all ${
                    soundEnabled
                      ? 'bg-cyan-950 text-cyan-400 border-cyan-800'
                      : 'bg-slate-800 text-slate-500 border-slate-700'
                  }`}
                >
                  {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                </button>
                <span>Terminal Audio Chime on Trigger</span>
              </div>
              <span className="text-[11px] text-slate-500 font-mono">In-App Banner Active</span>
            </div>

            {/* Submit Action */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs text-slate-400 hover:text-white font-mono"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2.5 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-mono font-bold text-xs rounded-xl shadow-lg shadow-cyan-900/30 flex items-center gap-2 transition-all"
              >
                <Bell className="w-4 h-4" />
                Activate Price Alert
              </button>
            </div>
          </form>
        )}

        {/* TAB 2: Existing Alerts List */}
        {activeTab === 'list' && (
          <div className="space-y-4">
            {stockAlerts.length === 0 ? (
              <div className="text-center py-8 px-4 rounded-xl border border-dashed border-slate-800 text-slate-400">
                <Bell className="w-8 h-8 mx-auto text-slate-600 mb-2" />
                <p className="text-xs">No price alerts set for {stock.symbol}.</p>
                <button
                  onClick={() => setActiveTab('create')}
                  className="mt-3 px-4 py-1.5 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-xs font-mono font-semibold hover:bg-cyan-500/20 transition-all"
                >
                  + Create First Alert
                </button>
              </div>
            ) : (
              <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
                {stockAlerts.map((alert) => {
                  const isAbove = alert.condition === 'ABOVE';
                  const isTriggered = alert.status === 'TRIGGERED';
                  const dist = ((alert.targetPrice - stock.price) / stock.price) * 100;

                  return (
                    <div
                      key={alert.id}
                      className={`p-3.5 rounded-xl border transition-all ${
                        isTriggered
                          ? 'bg-amber-950/20 border-amber-800/40 text-slate-300'
                          : 'bg-slate-950/80 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3">
                          <div
                            className={`p-2 rounded-xl mt-0.5 ${
                              isTriggered
                                ? 'bg-amber-500/20 text-amber-400'
                                : isAbove
                                ? 'bg-emerald-500/10 text-emerald-400'
                                : 'bg-rose-500/10 text-rose-400'
                            }`}
                          >
                            {isTriggered ? (
                              <CheckCircle2 className="w-4 h-4" />
                            ) : isAbove ? (
                              <TrendingUp className="w-4 h-4" />
                            ) : (
                              <TrendingDown className="w-4 h-4" />
                            )}
                          </div>

                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-sm font-bold text-white">
                                {isAbove ? '≥' : '≤'} {stock.currency}
                                {alert.targetPrice.toLocaleString()}
                              </span>
                              <span
                                className={`px-2 py-0.2 rounded text-[10px] font-mono font-bold uppercase ${
                                  isTriggered
                                    ? 'bg-amber-950 border border-amber-800 text-amber-300'
                                    : 'bg-cyan-950 border border-cyan-800 text-cyan-300'
                                }`}
                              >
                                {alert.status}
                              </span>
                              {!isTriggered && (
                                <span className="text-[11px] font-mono text-slate-400">
                                  ({dist >= 0 ? `+${dist.toFixed(1)}%` : `${dist.toFixed(1)}%`})
                                </span>
                              )}
                            </div>

                            {alert.note && (
                              <div className="text-xs text-slate-300 mt-1 italic">
                                "{alert.note}"
                              </div>
                            )}

                            <div className="flex items-center gap-3 text-[11px] text-slate-500 font-mono mt-1.5">
                              <span>Created at: {alert.createdAt}</span>
                              {isTriggered && alert.triggeredAt && (
                                <span className="text-amber-400 font-semibold">
                                  Triggered at: {alert.triggeredAt} (Price: {stock.currency}{alert.triggeredPrice})
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-1.5">
                          {!isTriggered && (
                            <button
                              type="button"
                              onClick={() => {
                                onTriggerSimulatedAlert(alert);
                                playAlertChime('alert');
                              }}
                              title="Test alert notification trigger"
                              className="px-2 py-1 rounded bg-slate-800 hover:bg-cyan-950 hover:text-cyan-400 text-slate-400 text-[11px] font-mono flex items-center gap-1 transition-colors border border-slate-700 hover:border-cyan-800"
                            >
                              <Play className="w-3 h-3" />
                              Test
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => onDeleteAlert(alert.id)}
                            className="p-1.5 text-slate-500 hover:text-rose-400 rounded hover:bg-slate-800 transition-colors"
                            title="Delete Alert"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Interactive Simulation Console */}
            <div className="pt-3 border-t border-slate-800/80 p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-mono text-slate-300 font-semibold flex items-center gap-1.5">
                  <Play className="w-3.5 h-3.5 text-cyan-400" />
                  Live Threshold Simulation Engine
                </span>
                <span className="text-[11px] text-slate-500">Test alerts in real-time</span>
              </div>
              <p className="text-[11px] text-slate-400">
                Simulate a sudden market tick or volatility jump to verify instant alert dispatch and chime.
              </p>
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="number"
                  value={simulatedPriceInput}
                  onChange={(e) => setSimulatedPriceInput(Number(e.target.value))}
                  className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-white font-mono text-xs w-36 focus:border-cyan-500 focus:outline-none"
                  placeholder="Simulated Price"
                />
                <button
                  type="button"
                  onClick={() => {
                    // Check all active alerts against this simulated price
                    activeAlerts.forEach((a) => {
                      const conditionMet =
                        (a.condition === 'ABOVE' && simulatedPriceInput >= a.targetPrice) ||
                        (a.condition === 'BELOW' && simulatedPriceInput <= a.targetPrice);
                      if (conditionMet) {
                        onTriggerSimulatedAlert({
                          ...a,
                          triggeredPrice: simulatedPriceInput,
                        });
                        playAlertChime('alert');
                      }
                    });
                  }}
                  className="px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-mono text-xs font-semibold flex items-center gap-1.5 transition-colors"
                >
                  Simulate Tick & Check
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
