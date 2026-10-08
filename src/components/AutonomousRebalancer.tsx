import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  RefreshCw,
  ArrowUpRight,
  ArrowDownRight,
  ShieldAlert,
  CheckCircle2,
  Sliders,
  TrendingUp,
  Scale,
  Zap,
  DollarSign,
  AlertCircle,
  HelpCircle,
  Play,
  Check,
  ChevronRight,
} from 'lucide-react';
import { PortfolioHolding, TargetAllocationModelType, RebalancePlan, RebalanceRecommendation } from '../types';
import { EducationalDisclaimer } from './EducationalDisclaimer';

interface AutonomousRebalancerProps {
  holdings: PortfolioHolding[];
  cashBalance?: number;
  onSelectStock: (symbol: string) => void;
  onExecuteBatchOrders?: (
    orders: Array<{ symbol: string; type: 'BUY' | 'SELL'; shares: number; price: number; reason: string }>
  ) => void;
  onExecuteOrder?: (order: { symbol: string; type: 'BUY' | 'SELL'; shares: number; price: number; reason: string }) => void;
}

export const AutonomousRebalancer: React.FC<AutonomousRebalancerProps> = ({
  holdings,
  cashBalance = 1000000,
  onSelectStock,
  onExecuteBatchOrders,
  onExecuteOrder,
}) => {
  const [selectedModel, setSelectedModel] = useState<TargetAllocationModelType>('ALPHA_RESEARCH');
  const [customWeights, setCustomWeights] = useState<Record<string, number>>(() => {
    const initial: Record<string, number> = {};
    if (holdings.length > 0) {
      const eq = Number((100 / holdings.length).toFixed(1));
      holdings.forEach((h) => {
        initial[h.symbol] = eq;
      });
    }
    return initial;
  });

  const [loading, setLoading] = useState<boolean>(false);
  const [plan, setPlan] = useState<RebalancePlan | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [executedSuccessMsg, setExecutedSuccessMsg] = useState<string | null>(null);
  const [executing, setExecuting] = useState<boolean>(false);

  // Total portfolio value
  const totalValue = holdings.reduce((sum, h) => sum + h.currentPrice * h.shares, 0);

  // Fetch or calculate rebalance plan from server Gemini agent
  const fetchRebalancePlan = async (model: TargetAllocationModelType = selectedModel) => {
    if (holdings.length === 0) return;
    setLoading(true);
    setError(null);
    setExecutedSuccessMsg(null);

    try {
      const payload = {
        holdings: holdings.map((h) => ({
          symbol: h.symbol,
          name: h.name,
          shares: h.shares,
          currentPrice: h.currentPrice,
          avgBuyPrice: h.avgBuyPrice,
          sector: h.sector,
          researchScore: h.researchScore ?? h.score ?? 70,
        })),
        totalValue,
        modelType: model,
        customTargets: model === 'CUSTOM' ? customWeights : undefined,
      };

      const res = await fetch('/api/portfolio/rebalance-advisor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (data.success && data.plan) {
        setPlan(data.plan);
      } else {
        throw new Error(data.error || 'Failed to generate rebalancing plan.');
      }
    } catch (err: any) {
      console.error('Rebalance fetch error:', err);
      setError(err?.message || 'Error communicating with Agent 14 Rebalancer.');
    } finally {
      setLoading(false);
    }
  };

  // Trigger initial rebalance plan on mount or when holdings change
  useEffect(() => {
    fetchRebalancePlan(selectedModel);
  }, [holdings.length, selectedModel]);

  // Handle custom weight slider change
  const handleCustomWeightChange = (symbol: string, value: number) => {
    setCustomWeights((prev) => ({
      ...prev,
      [symbol]: value,
    }));
  };

  // Normalize custom weights to sum to 100
  const handleNormalizeCustomWeights = () => {
    const sum = Object.keys(customWeights).reduce((acc, sym) => acc + (customWeights[sym] || 0), 0);
    if (sum === 0) return;
    const normalized: Record<string, number> = {};
    Object.keys(customWeights).forEach((sym) => {
      const val = customWeights[sym] || 0;
      normalized[sym] = Number(((val / sum) * 100).toFixed(1));
    });
    setCustomWeights(normalized);
  };

  // Execute single order
  const handleSingleOrderExecute = (item: RebalanceRecommendation) => {
    if (item.action === 'HOLD' || item.sharesToTrade <= 0) return;
    if (onExecuteOrder) {
      onExecuteOrder({
        symbol: item.symbol,
        type: item.action,
        shares: item.sharesToTrade,
        price: item.currentPrice,
        reason: `Agent 14 Rebalance: ${item.reasoning}`,
      });
      setExecutedSuccessMsg(`Executed ${item.action} of ${item.sharesToTrade} shares in ${item.symbol}!`);
      setTimeout(() => setExecutedSuccessMsg(null), 4000);
    }
  };

  // Execute full batch rebalance plan
  const handleExecuteAllOrders = () => {
    if (!plan || !plan.items) return;
    const actionableOrders = plan.items
      .filter((item) => item.action !== 'HOLD' && item.sharesToTrade > 0)
      .map((item) => ({
        symbol: item.symbol,
        type: item.action as 'BUY' | 'SELL',
        shares: item.sharesToTrade,
        price: item.currentPrice,
        reason: `Autonomous Rebalance (${plan.modelName}): ${item.reasoning}`,
      }));

    if (actionableOrders.length === 0) {
      setExecutedSuccessMsg('Portfolio is already perfectly aligned with target model. No trades required.');
      return;
    }

    setExecuting(true);
    setTimeout(() => {
      if (onExecuteBatchOrders) {
        onExecuteBatchOrders(actionableOrders);
      } else if (onExecuteOrder) {
        actionableOrders.forEach((o) => onExecuteOrder(o));
      }
      setExecuting(false);
      setExecutedSuccessMsg(
        `Successfully executed ${actionableOrders.length} autonomous rebalance orders! Portfolio realigned to ${plan.modelName}.`
      );
      setTimeout(() => {
        setExecutedSuccessMsg(null);
        fetchRebalancePlan(selectedModel);
      }, 3500);
    }, 600);
  };

  const actionableCount = plan?.items?.filter((i) => i.action !== 'HOLD' && i.sharesToTrade > 0).length || 0;
  const customSum: number = Object.keys(customWeights).reduce(
    (acc, sym) => acc + (customWeights[sym] || 0),
    0
  );

  return (
    <div className="space-y-6">
      {/* Top Banner: Agent 14 Identity & Strategy Selector */}
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono text-cyan-400 mb-1">
              <Sparkles className="w-4 h-4 text-cyan-400 animate-pulse" />
              <span>AGENT 14 — AUTONOMOUS PORTFOLIO REBALANCER</span>
              <span className="px-2 py-0.5 rounded-full bg-cyan-950/80 border border-cyan-800 text-[10px] text-cyan-300 font-bold">
                {plan?.aiDirectives?.modelUsed ? `Gemini (${plan.aiDirectives.modelUsed})` : 'Gemini AI Agent Active'}
              </span>
            </div>
            <h2 className="text-xl font-bold text-white tracking-tight">
              Dynamic Target Allocation & Rebalancing Engine
            </h2>
            <p className="text-xs text-slate-400 mt-1 max-w-2xl">
              Calculates recommended buy/sell orders to align active holdings with target allocation models, using multi-agent research scores and institutional risk bounds.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => fetchRebalancePlan(selectedModel)}
              disabled={loading}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-mono transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-cyan-400 ${loading ? 'animate-spin' : ''}`} />
              <span>{loading ? 'Synthesizing Shifts...' : 'Re-run Gemini Agent'}</span>
            </button>
          </div>
        </div>

        {/* Model Strategy Pills */}
        <div className="space-y-2">
          <div className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">
            Select Allocation Model:
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5">
            {[
              {
                type: 'ALPHA_RESEARCH' as TargetAllocationModelType,
                title: 'Alpha Research Conviction',
                tag: 'Recommended',
                desc: 'Weights dynamically proportional to multi-agent scores (80+ overweight, <70 trim).',
                icon: Zap,
              },
              {
                type: 'BALANCED_GROWTH' as TargetAllocationModelType,
                title: 'Balanced Growth',
                tag: 'Max 25% Sector',
                desc: 'Quality compounders with strict sector concentration caps.',
                icon: TrendingUp,
              },
              {
                type: 'DEFENSIVE_CAPITAL' as TargetAllocationModelType,
                title: 'Defensive Capital',
                tag: 'Low Beta',
                desc: 'Capital preservation tilt to high cash-flow large caps.',
                icon: ShieldAlert,
              },
              {
                type: 'EQUAL_WEIGHT' as TargetAllocationModelType,
                title: 'Equal Weight',
                tag: '20% Uniform',
                desc: 'Uniform percentage distribution across all holdings.',
                icon: Scale,
              },
              {
                type: 'CUSTOM' as TargetAllocationModelType,
                title: 'Custom Allocation',
                tag: 'User Sliders',
                desc: 'Manually specify target allocation percentages per asset.',
                icon: Sliders,
              },
            ].map((m) => {
              const isSelected = selectedModel === m.type;
              const Icon = m.icon;
              return (
                <button
                  key={m.type}
                  onClick={() => setSelectedModel(m.type)}
                  className={`p-3 rounded-xl text-left border transition-all flex flex-col justify-between ${
                    isSelected
                      ? 'bg-cyan-950/40 border-cyan-500 shadow-lg shadow-cyan-950/50'
                      : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between gap-1 mb-1.5">
                      <div className="flex items-center gap-1.5 font-bold text-xs font-mono text-white">
                        <Icon className={`w-3.5 h-3.5 ${isSelected ? 'text-cyan-400' : 'text-slate-400'}`} />
                        <span>{m.title}</span>
                      </div>
                      <span
                        className={`text-[9px] px-1.5 py-0.5 rounded font-mono font-semibold ${
                          isSelected
                            ? 'bg-cyan-900 text-cyan-200'
                            : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        {m.tag}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-400 line-clamp-2 leading-relaxed">{m.desc}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Custom Weight Sliders if CUSTOM is selected */}
        {selectedModel === 'CUSTOM' && (
          <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-cyan-400 font-bold">FINE-TUNE TARGET WEIGHTS</span>
              <div className="flex items-center gap-3">
                <span
                  className={`font-bold ${
                    Math.abs(customSum - 100) < 0.5 ? 'text-emerald-400' : 'text-amber-400'
                  }`}
                >
                  Total: {customSum.toFixed(1)}% {Math.abs(customSum - 100) >= 0.5 && '(Target 100%)'}
                </span>
                <button
                  onClick={handleNormalizeCustomWeights}
                  className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-[11px] font-mono border border-slate-700"
                >
                  Auto-Normalize to 100%
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
              {holdings.map((h) => (
                <div key={h.symbol} className="space-y-1">
                  <div className="flex justify-between text-xs font-mono">
                    <span className="text-white font-semibold">{h.symbol}</span>
                    <span className="text-cyan-400 font-bold">
                      {(customWeights[h.symbol] || 0).toFixed(1)}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="60"
                    step="1"
                    value={customWeights[h.symbol] || 0}
                    onChange={(e) => handleCustomWeightChange(h.symbol, parseFloat(e.target.value))}
                    className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
                  />
                </div>
              ))}
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => fetchRebalancePlan('CUSTOM')}
                className="px-4 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-mono font-bold rounded-lg transition-colors"
              >
                Apply Custom Targets
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Execution Feedback Notification */}
      {executedSuccessMsg && (
        <div className="p-4 rounded-xl bg-emerald-950/80 border border-emerald-700 text-emerald-200 text-xs font-mono flex items-center justify-between gap-3 shadow-lg">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{executedSuccessMsg}</span>
          </div>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-xl bg-rose-950/80 border border-rose-700 text-rose-200 text-xs font-mono flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Gemini Agent Directives Banner */}
      {plan?.aiDirectives && (
        <div className="p-5 rounded-2xl bg-gradient-to-r from-slate-900 via-cyan-950/30 to-slate-900 border border-cyan-800/40 shadow-xl space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-cyan-400" />
              <h3 className="text-xs font-bold text-white font-mono uppercase tracking-wider">
                Agent 14 Shift Thesis & Conviction Commentary
              </h3>
            </div>
            <span className="text-[10px] font-mono text-cyan-300 bg-cyan-950 border border-cyan-800 px-2 py-0.5 rounded">
              {plan.modelName}
            </span>
          </div>

          <p className="text-xs text-slate-200 leading-relaxed font-sans">
            {plan.aiDirectives.summary}
          </p>

          {plan.aiDirectives.thesisShifts && plan.aiDirectives.thesisShifts.length > 0 && (
            <div className="space-y-1.5 pt-1">
              <div className="text-[11px] font-mono text-cyan-400 font-semibold">Key Thesis Allocations:</div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {plan.aiDirectives.thesisShifts.map((shift, idx) => (
                  <div
                    key={idx}
                    className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800 text-xs text-slate-300 flex items-start gap-2"
                  >
                    <ChevronRight className="w-3.5 h-3.5 text-cyan-400 shrink-0 mt-0.5" />
                    <span className="text-[11px] font-sans">{shift}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {plan.aiDirectives.riskAssessment && (
            <div className="pt-1 text-[11px] text-slate-400 font-mono flex items-center gap-1.5">
              <ShieldAlert className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span>Risk Audit: {plan.aiDirectives.riskAssessment}</span>
            </div>
          )}
        </div>
      )}

      {/* Plan Execution Overview Cockpit */}
      {plan && (
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 w-full lg:w-auto">
              <div>
                <span className="text-[11px] text-slate-400 font-mono">Total Turnover</span>
                <div className="text-xl font-bold font-mono text-white mt-0.5">
                  ₹{plan.totalTurnover.toLocaleString()}
                </div>
                <span className="text-[10px] text-cyan-400 font-mono">
                  {plan.totalTurnoverPercent}% of portfolio
                </span>
              </div>

              <div>
                <span className="text-[11px] text-slate-400 font-mono">Actionable Orders</span>
                <div className="text-xl font-bold font-mono text-white mt-0.5">
                  {actionableCount} Trades
                </div>
                <span className="text-[10px] text-slate-400 font-mono">
                  {plan.items.filter((i) => i.action === 'BUY').length} Buys •{' '}
                  {plan.items.filter((i) => i.action === 'SELL').length} Sells
                </span>
              </div>

              <div>
                <span className="text-[11px] text-slate-400 font-mono">Estimated Friction</span>
                <div className="text-xl font-bold font-mono text-white mt-0.5">
                  ₹{plan.estimatedCost.toLocaleString()}
                </div>
                <span className="text-[10px] text-slate-400 font-mono">0.10% STT & Brokerage</span>
              </div>

              <div>
                <span className="text-[11px] text-slate-400 font-mono">Net Cash Delta</span>
                <div
                  className={`text-xl font-bold font-mono mt-0.5 ${
                    plan.netCashRequired > 0 ? 'text-amber-400' : 'text-emerald-400'
                  }`}
                >
                  {plan.netCashRequired > 0 ? `-₹${plan.netCashRequired.toLocaleString()}` : '+Cash Neutral'}
                </div>
                <span className="text-[10px] text-slate-400 font-mono">
                  Available: ₹{cashBalance.toLocaleString()}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <button
                onClick={handleExecuteAllOrders}
                disabled={executing || actionableCount === 0}
                className="w-full sm:w-auto px-5 py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-mono font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-950/40 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Play className={`w-4 h-4 fill-current ${executing ? 'animate-pulse' : ''}`} />
                <span>
                  {executing
                    ? 'Executing Orders...'
                    : actionableCount > 0
                    ? `Execute Rebalance Plan (${actionableCount} Orders)`
                    : 'Portfolio Already Aligned'}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Educational Use Disclaimer for Rebalance Recommendations */}
      {plan && (
        <EducationalDisclaimer
          variant="banner"
          actionContext="REBALANCE"
          className="my-1"
        />
      )}

      {/* Main Table: Holdings vs Targets & Order Recommendations */}
      {plan && (
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
          <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
            <span>RECOMMENDED BUY / SELL REBALANCE ORDERS ({plan.items.length} ASSETS)</span>
            <span>SCORES DRIVE WEIGHT ALLOCATION</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400">
                  <th className="py-3 px-3">Asset & Sector</th>
                  <th className="py-3 px-3 text-center">Research Score</th>
                  <th className="py-3 px-3 text-center">Current vs Target</th>
                  <th className="py-3 px-3 text-center">Allocation Drift</th>
                  <th className="py-3 px-3 text-center">Action Order</th>
                  <th className="py-3 px-3 text-right">Order Value</th>
                  <th className="py-3 px-3 text-left">Agent 14 Thesis Rationale</th>
                  <th className="py-3 px-3 text-center">Execute</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {plan.items.map((item) => {
                  const isBuy = item.action === 'BUY';
                  const isSell = item.action === 'SELL';
                  const isHold = item.action === 'HOLD';

                  return (
                    <tr key={item.symbol} className="hover:bg-slate-800/40 transition-colors">
                      {/* Asset & Sector */}
                      <td className="py-3.5 px-3">
                        <div
                          onClick={() => onSelectStock(item.symbol)}
                          className="font-bold text-white cursor-pointer hover:text-cyan-400 flex items-center gap-1.5"
                        >
                          <span>{item.symbol}</span>
                          <ArrowUpRight className="w-3 h-3 text-slate-500" />
                        </div>
                        <div className="text-[10px] text-slate-400">{item.sector}</div>
                        <div className="text-[10px] text-slate-400 font-mono">
                          {item.currentShares} sh @ ₹{item.currentPrice.toLocaleString()}
                        </div>
                      </td>

                      {/* Research Score */}
                      <td className="py-3.5 px-3 text-center">
                        <span
                          className={`inline-block px-2.5 py-1 rounded-full font-bold text-[10px] ${
                            item.researchScore >= 80
                              ? 'bg-emerald-950 text-emerald-300 border border-emerald-700'
                              : item.researchScore >= 70
                              ? 'bg-cyan-950 text-cyan-300 border border-cyan-800'
                              : 'bg-amber-950 text-amber-300 border border-amber-800'
                          }`}
                        >
                          {item.researchScore} / 100
                        </span>
                        <div className="text-[9px] text-slate-400 mt-0.5">
                          {item.researchScore >= 80
                            ? 'High Conviction'
                            : item.researchScore >= 70
                            ? 'Compounder'
                            : 'Thesis Trim'}
                        </div>
                      </td>

                      {/* Current vs Target Weights & Visual Dual Bar */}
                      <td className="py-3.5 px-3 min-w-[140px]">
                        <div className="flex justify-between text-[11px] mb-1">
                          <span className="text-slate-400 font-mono">
                            Curr: <strong className="text-white">{item.currentWeight.toFixed(1)}%</strong>
                          </span>
                          <span className="text-cyan-400 font-mono font-bold">
                            Tgt: {item.targetWeight.toFixed(1)}%
                          </span>
                        </div>
                        <div className="space-y-1">
                          {/* Current bar */}
                          <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-slate-400 rounded-full"
                              style={{ width: `${Math.min(item.currentWeight * 2.5, 100)}%` }}
                            ></div>
                          </div>
                          {/* Target bar */}
                          <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-cyan-400 rounded-full"
                              style={{ width: `${Math.min(item.targetWeight * 2.5, 100)}%` }}
                            ></div>
                          </div>
                        </div>
                      </td>

                      {/* Drift Percent */}
                      <td className="py-3.5 px-3 text-center">
                        <span
                          className={`px-2 py-0.5 rounded font-mono font-bold text-[11px] ${
                            item.driftPercent > 1
                              ? 'bg-rose-950/80 text-rose-300 border border-rose-800'
                              : item.driftPercent < -1
                              ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-800'
                              : 'bg-slate-800 text-slate-300'
                          }`}
                        >
                          {item.driftPercent > 0 ? '+' : ''}
                          {item.driftPercent.toFixed(1)}%
                        </span>
                        <div className="text-[9px] text-slate-400 mt-0.5">
                          {item.driftPercent > 1
                            ? 'Overweight'
                            : item.driftPercent < -1
                            ? 'Underweight'
                            : 'Aligned'}
                        </div>
                      </td>

                      {/* Recommended Action Order */}
                      <td className="py-3.5 px-3 text-center">
                        {isBuy && (
                          <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-950 border border-emerald-700 text-emerald-300 font-bold text-xs">
                            <ArrowUpRight className="w-3.5 h-3.5 text-emerald-400" />
                            <span>BUY +{item.sharesToTrade}</span>
                          </div>
                        )}
                        {isSell && (
                          <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-rose-950 border border-rose-700 text-rose-300 font-bold text-xs">
                            <ArrowDownRight className="w-3.5 h-3.5 text-rose-400" />
                            <span>SELL -{item.sharesToTrade}</span>
                          </div>
                        )}
                        {isHold && (
                          <span className="px-2.5 py-1 rounded-lg bg-slate-800 text-slate-400 text-xs font-semibold">
                            HOLD (0)
                          </span>
                        )}
                      </td>

                      {/* Order Value */}
                      <td className="py-3.5 px-3 text-right font-mono">
                        {item.orderValue > 0 ? (
                          <>
                            <div className="text-white font-bold">
                              ₹{item.orderValue.toLocaleString()}
                            </div>
                            <div className="text-[10px] text-slate-400">
                              Post: {item.postRebalanceWeight.toFixed(1)}%
                            </div>
                          </>
                        ) : (
                          <span className="text-slate-500">—</span>
                        )}
                      </td>

                      {/* AI Thesis Reasoning */}
                      <td className="py-3.5 px-3 max-w-xs">
                        <p className="text-[11px] font-sans text-slate-300 leading-snug">
                          {item.reasoning}
                        </p>
                      </td>

                      {/* Execute Single Button */}
                      <td className="py-3.5 px-3 text-center">
                        {!isHold && item.sharesToTrade > 0 ? (
                          <button
                            onClick={() => handleSingleOrderExecute(item)}
                            className={`px-2.5 py-1 rounded-lg text-[10px] font-bold font-mono transition-all ${
                              isBuy
                                ? 'bg-emerald-900/60 hover:bg-emerald-800 text-emerald-200 border border-emerald-700'
                                : 'bg-rose-900/60 hover:bg-rose-800 text-rose-200 border border-rose-700'
                            }`}
                          >
                            Trade
                          </button>
                        ) : (
                          <span className="text-slate-600 text-xs">✓</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <EducationalDisclaimer variant="footer" actionContext="REBALANCE" />
        </div>
      )}
    </div>
  );
};
