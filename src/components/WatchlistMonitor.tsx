import React, { useState } from 'react';
import {
  Bell,
  ShieldAlert,
  AlertTriangle,
  Play,
  CheckCircle2,
  RefreshCw,
  Clock,
  Send,
  Radio,
  Sliders,
  ExternalLink,
  TrendingUp,
  TrendingDown,
  Search,
  X,
} from 'lucide-react';
import { StockResearchData, WatchlistItem, TriggerEvent } from '../types';
import { EducationalDisclaimer } from './EducationalDisclaimer';

interface WatchlistMonitorProps {
  watchlist: WatchlistItem[];
  onSelectStock: (symbol: string) => void;
  onSimulateTrigger: (trigger: TriggerEvent) => void;
  monitoringActive: boolean;
  setMonitoringActive: (val: boolean) => void;
  recentAlerts: {
    id: string;
    symbol: string;
    type: string;
    message: string;
    timestamp: string;
    severity: 'info' | 'warning' | 'critical';
  }[];
}

export const WatchlistMonitor: React.FC<WatchlistMonitorProps> = ({
  watchlist,
  onSelectStock,
  onSimulateTrigger,
  monitoringActive,
  setMonitoringActive,
  recentAlerts,
}) => {
  const [pollingInterval, setPollingInterval] = React.useState<'30s' | '1m' | '5m'>('1m');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const filteredWatchlist = watchlist.filter((item) => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase().trim();
    return (
      item.symbol.toLowerCase().includes(query) ||
      item.name.toLowerCase().includes(query) ||
      (item.thesisStatus && item.thesisStatus.toLowerCase().includes(query))
    );
  });

  const triggers: { title: string; desc: string; trigger: TriggerEvent; color: string }[] = [
    {
      title: 'Simulate -5.2% Technical Breakdown (TCS)',
      desc: 'Price breaks below 50-day SMA on heavy volume. Triggers Technical & Risk Agent review.',
      trigger: {
        symbol: 'TCS',
        type: 'PRICE_DROP_5PCT',
        description: 'TCS breached 50-day SMA at ₹4,180 with volume 1.8x average.',
        timestamp: new Date().toLocaleTimeString(),
      },
      color: 'hover:border-rose-500 bg-rose-950/20 text-rose-300',
    },
    {
      title: 'Simulate Q3 Margin Compression (-80 bps)',
      desc: 'Quarterly financial filing reveals unexpected margin contraction. Triggers Fundamental Agent re-audit.',
      trigger: {
        symbol: 'TCS',
        type: 'EARNINGS_MARGIN_MISS',
        description: 'Operating margin compressed 80 bps to 23.9% due to project renegotiations.',
        timestamp: new Date().toLocaleTimeString(),
      },
      color: 'hover:border-amber-500 bg-amber-950/20 text-amber-300',
    },
    {
      title: 'Simulate Green Energy Capex Subsidy (RELIANCE)',
      desc: 'Government announces ₹18,000 Cr incentive for clean hydrogen. Triggers Sector & Bull Agent.',
      trigger: {
        symbol: 'RELIANCE',
        type: 'POSITIVE_POLICY_CATALYST',
        description: 'PLI expansion for electrolyzers accelerates New Energy monetization by 12 months.',
        timestamp: new Date().toLocaleTimeString(),
      },
      color: 'hover:border-emerald-500 bg-emerald-950/20 text-emerald-300',
    },
    {
      title: 'Simulate Regulatory Scrutiny Notice (HDFCBANK)',
      desc: 'RBI regulatory audit flags compliance enhancement timeline for unsecured credit.',
      trigger: {
        symbol: 'HDFCBANK',
        type: 'REGULATORY_SCRUTINY',
        description: 'Central bank advisory mandates additional risk-weighted asset provisions.',
        timestamp: new Date().toLocaleTimeString(),
      },
      color: 'hover:border-indigo-500 bg-indigo-950/20 text-indigo-300',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Top Monitor Dashboard Header */}
      <div className="p-4 sm:p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-cyan-400 mb-1">
            <Radio className="w-4 h-4 animate-pulse" />
            <span>CONTINUOUS MULTI-AGENT SURVEILLANCE BUS</span>
          </div>
          <h2 className="text-xl font-bold text-white tracking-tight">
            Autonomous Watchlist & Thesis Shift Detection
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Agents run continuous background evaluations to alert you: what changed, why it changed, and what evidence triggered it.
          </p>
        </div>

        {/* Monitoring Controls */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5 p-1 rounded-lg bg-slate-950 border border-slate-800 text-xs font-mono">
            <span className="px-2 text-slate-400 text-[11px]">Heartbeat:</span>
            {(['30s', '1m', '5m'] as const).map((interval) => (
              <button
                key={interval}
                onClick={() => setPollingInterval(interval)}
                className={`px-2 py-1 rounded transition-colors ${
                  pollingInterval === interval
                    ? 'bg-cyan-600 text-white font-bold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {interval}
              </button>
            ))}
          </div>

          <button
            onClick={() => setMonitoringActive(!monitoringActive)}
            className={`px-4 py-2 rounded-xl text-xs font-mono font-bold flex items-center gap-2 transition-all shadow-md ${
              monitoringActive
                ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-900/30'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
            }`}
          >
            <span className={`w-2 h-2 rounded-full ${monitoringActive ? 'bg-white animate-ping' : 'bg-slate-500'}`}></span>
            {monitoringActive ? 'Surveillance Active' : 'Surveillance Paused'}
          </button>
        </div>
      </div>

      {/* Main Grid: Watchlist Table + Autonomous Trigger Simulator */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Watchlist Table */}
        <div className="lg:col-span-7 space-y-4">
          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-400 font-mono">
              <div className="flex items-center gap-2">
                <span>WATCHLIST STOCKS ({filteredWatchlist.length} of {watchlist.length})</span>
                <span className="hidden sm:inline text-slate-600">•</span>
                <span className="text-[11px] text-slate-500">CLICK TO LOAD FULL RESEARCH</span>
              </div>

              {/* Search Watchlist input */}
              <div className="relative min-w-[140px] sm:min-w-[200px] w-full sm:w-auto">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Filter watchlist..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-8 pr-7 py-1.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500 font-mono"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400">
                    <th className="py-2.5 px-3">Symbol</th>
                    <th className="py-2.5 px-3">Price</th>
                    <th className="py-2.5 px-3">24h Chg</th>
                    <th className="py-2.5 px-3 text-center">Score</th>
                    <th className="py-2.5 px-3">Thesis Status</th>
                    <th className="py-2.5 px-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {filteredWatchlist.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-500">
                        No stocks matched "{searchQuery}". Try searching another symbol or name.
                      </td>
                    </tr>
                  ) : (
                    filteredWatchlist.map((item) => {
                      return (
                      <tr
                        key={item.symbol}
                        onClick={() => onSelectStock(item.symbol)}
                        className="hover:bg-slate-800/50 cursor-pointer transition-colors"
                      >
                        <td className="py-3 px-3">
                          <div className="font-bold text-white">{item.symbol}</div>
                          <div className="text-[10px] text-slate-400">{item.name}</div>
                        </td>
                        <td className="py-3 px-3 text-slate-200">
                          {item.currency}{item.price.toLocaleString()}
                        </td>
                        <td className={`py-3 px-3 font-semibold ${item.changePercent >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {item.changePercent >= 0 ? '+' : ''}{item.changePercent.toFixed(2)}%
                        </td>
                        <td className="py-3 px-3 text-center">
                          <span className={`px-2 py-0.5 rounded-full font-bold text-[11px] ${
                            item.committeeScore >= 75
                              ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                              : item.committeeScore >= 60
                              ? 'bg-amber-950 text-amber-300 border border-amber-800'
                              : 'bg-rose-950 text-rose-300 border border-rose-800'
                          }`}>
                            {item.committeeScore}
                          </span>
                        </td>
                        <td className="py-3 px-3">
                          {item.thesisChanged ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-400 animate-pulse">
                              <AlertTriangle className="w-3 h-3" /> Shift Detected
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[11px] text-emerald-400">
                              <CheckCircle2 className="w-3 h-3" /> Unchanged
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-3 text-right">
                          <span className="text-[11px] text-cyan-400 hover:underline">
                            View ➔
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
                </tbody>
              </table>
            </div>

            {/* Educational Use Disclaimer */}
            <EducationalDisclaimer
              variant="footer"
              actionContext="BUY_SELL_HOLD"
              className="mt-3"
            />
          </div>

          {/* Trigger Simulator Card */}
          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white font-mono flex items-center gap-2">
                <Sliders className="w-4 h-4 text-cyan-400" />
                Trigger Event Simulation Testing
              </h3>
              <span className="text-[11px] text-slate-400 font-mono">Test Agent Reactive Workflows</span>
            </div>
            <p className="text-xs text-slate-400">
              Fire test market shocks to see how FINAGENT autonomous agents intercept anomalies, recalculate risk, and update the investment thesis.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              {triggers.map((t, idx) => (
                <button
                  key={idx}
                  onClick={() => onSimulateTrigger(t.trigger)}
                  className={`p-3 rounded-xl border border-slate-800 text-left transition-all space-y-1 ${t.color}`}
                >
                  <div className="text-xs font-bold font-mono">{t.title}</div>
                  <p className="text-[11px] text-slate-300 leading-relaxed">{t.desc}</p>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right: Live Notifications Feed (Telegram / Push Preview) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Bell className="w-4 h-4 text-cyan-400" />
                <h3 className="text-sm font-bold text-white font-mono">DISPATCHED AGENT ALERTS</h3>
              </div>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-cyan-950 text-cyan-300 border border-cyan-800">
                TELEGRAM & PUSH SIMULATOR
              </span>
            </div>

            {/* Notification items */}
            <div className="space-y-3 max-h-[500px] overflow-y-auto">
              {recentAlerts.map((alert) => (
                <div
                  key={alert.id}
                  className={`p-3.5 rounded-xl border transition-all text-xs font-mono space-y-2 ${
                    alert.severity === 'critical'
                      ? 'border-rose-700/60 bg-rose-950/30 text-rose-200'
                      : alert.severity === 'warning'
                      ? 'border-amber-700/60 bg-amber-950/30 text-amber-200'
                      : 'border-cyan-700/60 bg-cyan-950/20 text-slate-200'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white">{alert.symbol}</span>
                      <span className="px-1.5 py-0.2 rounded text-[10px] bg-slate-800 text-slate-300">
                        {alert.type}
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-400 flex items-center gap-1">
                      <Clock className="w-3 h-3" /> {alert.timestamp}
                    </span>
                  </div>

                  <p className="text-xs text-slate-300 leading-relaxed font-sans">{alert.message}</p>

                  <div className="pt-2 border-t border-slate-800/60 flex items-center justify-between text-[10px] text-slate-400">
                    <span>Delivered via: Telegram Bot & Webhook</span>
                    <button
                      onClick={() => onSelectStock(alert.symbol)}
                      className="text-cyan-400 hover:underline flex items-center gap-1 font-semibold"
                    >
                      Audit Thesis <ExternalLink className="w-2.5 h-2.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
