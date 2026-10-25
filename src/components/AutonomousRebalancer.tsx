import React, { useState, useEffect, useMemo } from 'react';
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
  Settings2,
  Info,
  Lock,
  Unlock,
  Layers,
  BarChart2,
  Percent,
  Compass,
  FileSpreadsheet,
  AlertTriangle,
  Cpu,
  Brain,
  Award,
  Activity,
  Grid,
  PieChart as PieIcon,
  X,
  ExternalLink,
} from 'lucide-react';
import {
  PortfolioHolding,
  TargetAllocationModelType,
  RebalancePlan,
  RebalanceRecommendation,
  RebalanceConfigOptions,
  RebalanceDriftMode,
  RebalanceCadence,
} from '../types';
import { EducationalDisclaimer } from './EducationalDisclaimer';

interface AutonomousRebalancerProps {
  holdings: PortfolioHolding[];
  cashBalance?: number;
  onSelectStock: (symbol: string) => void;
  onOpenPaperTrade?: () => void;
  onExecuteBatchOrders?: (
    orders: Array<{ symbol: string; type: 'BUY' | 'SELL'; shares: number; price: number; reason: string }>
  ) => void;
  onExecuteOrder?: (order: { symbol: string; type: 'BUY' | 'SELL'; shares: number; price: number; reason: string }) => void;
}

interface ModelDefinition {
  type: TargetAllocationModelType;
  title: string;
  tag: string;
  category: 'ALPHA' | 'DEFENSIVE' | 'SYSTEMATIC' | 'CUSTOM';
  regime: string;
  desc: string;
  icon: React.ElementType;
}

const ALLOCATION_MODELS: ModelDefinition[] = [
  {
    type: 'ALPHA_RESEARCH',
    title: 'Alpha Research Conviction',
    tag: 'Recommended',
    category: 'ALPHA',
    regime: 'Bull / Trend Expansion',
    desc: 'Dynamically overweights high-conviction research leaders (score 80+) and trims underperforming assets (score <70).',
    icon: Zap,
  },
  {
    type: 'FINBERT_MOMENTUM_ALPHA',
    title: 'FinBERT NLP Sentiment & Momentum',
    tag: 'FinBERT AI',
    category: 'ALPHA',
    regime: 'News-Driven / High Momentum',
    desc: 'Multi-factor model scaling weights by ProsusAI/FinBERT news sentiment polarity score and medium-term technical trend.',
    icon: Brain,
  },
  {
    type: 'BALANCED_GROWTH',
    title: 'Institutional Balanced Growth',
    tag: 'Max 25% Sector',
    category: 'SYSTEMATIC',
    regime: 'Core All-Weather',
    desc: 'Quality compounders with strict 25% sector caps and fundamental growth factor weighting.',
    icon: TrendingUp,
  },
  {
    type: 'DEFENSIVE_CAPITAL',
    title: 'Defensive Capital Preservation',
    tag: 'Low Beta',
    category: 'DEFENSIVE',
    regime: 'High Volatility / Correction',
    desc: 'Prioritizes low-beta large-cap cash-flow leaders with risk-mitigation bounds.',
    icon: ShieldAlert,
  },
  {
    type: 'RISK_PARITY',
    title: 'Inverse Volatility / Risk Parity',
    tag: 'Risk Balanced',
    category: 'DEFENSIVE',
    regime: 'Macro Uncertainty',
    desc: 'Equalizes risk contribution by weighting assets inversely to 30-day realized volatility (σ).',
    icon: Scale,
  },
  {
    type: 'MIN_VARIANCE',
    title: 'Minimum Variance Anchor',
    tag: 'Min Volatility',
    category: 'DEFENSIVE',
    regime: 'Bear Market Defense',
    desc: 'Defensive quantitative portfolio allocation engineered to minimize total portfolio variance (Beta ~0.65-0.80).',
    icon: Activity,
  },
  {
    type: 'QUALITY_VALUE_DIVIDEND',
    title: 'Quality & Free Cash Flow Yield',
    tag: 'High ROE / Low Debt',
    category: 'SYSTEMATIC',
    regime: 'Value & Cycle Rotation',
    desc: 'Fundamental factor weighting tilted towards superior ROE (>20%), robust debt-to-equity (<0.5), and strong operating cash flows.',
    icon: Award,
  },
  {
    type: 'EQUAL_WEIGHT',
    title: 'Systematic Equal Weight',
    tag: 'Uniform 1/N',
    category: 'SYSTEMATIC',
    regime: 'Broad Market Breadth',
    desc: 'Uniform percentage distribution across all holdings to minimize single-stock concentration risk.',
    icon: Grid,
  },
  {
    type: 'SECTOR_CAPPED_EQUAL',
    title: 'Sector-Capped Equal Weight',
    tag: 'Max 20% Sector',
    category: 'SYSTEMATIC',
    regime: 'Diversified Core',
    desc: '1/N baseline with hard maximum 20% cap on any single industry sector, automatically redistributing excess.',
    icon: PieIcon,
  },
  {
    type: 'CUSTOM',
    title: 'Custom Allocation Studio',
    tag: 'Interactive',
    category: 'CUSTOM',
    regime: 'Discretionary Mandate',
    desc: 'Manually specify target allocation percentages per asset with asset locking and auto-normalization.',
    icon: Sliders,
  },
];

export const AutonomousRebalancer: React.FC<AutonomousRebalancerProps> = ({
  holdings,
  cashBalance = 1000000,
  onSelectStock,
  onOpenPaperTrade,
  onExecuteBatchOrders,
  onExecuteOrder,
}) => {
  const [selectedModel, setSelectedModel] = useState<TargetAllocationModelType>('ALPHA_RESEARCH');
  const [modelCategoryFilter, setModelCategoryFilter] = useState<'ALL' | 'ALPHA' | 'DEFENSIVE' | 'SYSTEMATIC' | 'CUSTOM'>('ALL');
  
  // Advanced Rebalance Engine Configuration Options
  const [config, setConfig] = useState<RebalanceConfigOptions>({
    driftMode: 'ABSOLUTE',
    driftThreshold: 2.5,
    cadence: 'CONTINUOUS_DRIFT',
    cashBufferPercent: 5, // 5% cash buffer reserve
    minTradeThreshold: 1000, // ₹1,000 anti-dust trade floor
    taxLossHarvesting: true,
    volatilitySpikeTrigger: true,
    finbertShockTrigger: true,
  });

  const [showConfigPanel, setShowConfigPanel] = useState<boolean>(false);
  const [showComparisonModal, setShowComparisonModal] = useState<boolean>(false);
  const [showCostBreakdownModal, setShowCostBreakdownModal] = useState<boolean>(false);
  const [orderFilter, setOrderFilter] = useState<'ALL' | 'BUY' | 'SELL' | 'BREACHED'>('ALL');

  // Custom Weight Sliders & Lock State
  const [lockedAssets, setLockedAssets] = useState<Record<string, boolean>>({});
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

  // Fetch or calculate rebalance plan from server
  const fetchRebalancePlan = async (
    model: TargetAllocationModelType = selectedModel,
    activeConfig: RebalanceConfigOptions = config
  ) => {
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
        config: activeConfig,
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

  // Trigger initial rebalance plan on mount or when holdings or model change
  useEffect(() => {
    fetchRebalancePlan(selectedModel, config);
  }, [holdings.length, selectedModel]);

  // Handle custom weight slider change with asset locking
  const handleCustomWeightChange = (symbol: string, newTargetVal: number) => {
    const symbols = holdings.map((h) => h.symbol);
    const clampedNew = Math.min(Math.max(newTargetVal, 0), 100);

    setCustomWeights((prev) => {
      const currentLockedSum = symbols
        .filter((s) => lockedAssets[s] && s !== symbol)
        .reduce((sum, s) => sum + (prev[s] || 0), 0);

      const maxAllowed = 100 - currentLockedSum;
      const finalNewVal = Math.min(clampedNew, maxAllowed);

      const unlockedOthers = symbols.filter((s) => !lockedAssets[s] && s !== symbol);
      const prevUnlockedOthersSum = unlockedOthers.reduce((sum, s) => sum + (prev[s] || 0), 0);

      const remainingToDistribute = Math.max(100 - currentLockedSum - finalNewVal, 0);

      const nextWeights: Record<string, number> = {
        ...prev,
        [symbol]: Number(finalNewVal.toFixed(1)),
      };

      if (unlockedOthers.length > 0) {
        if (prevUnlockedOthersSum > 0) {
          unlockedOthers.forEach((s) => {
            const prop = (prev[s] || 0) / prevUnlockedOthersSum;
            nextWeights[s] = Number((prop * remainingToDistribute).toFixed(1));
          });
        } else {
          const even = remainingToDistribute / unlockedOthers.length;
          unlockedOthers.forEach((s) => {
            nextWeights[s] = Number(even.toFixed(1));
          });
        }
      }

      return nextWeights;
    });
  };

  // Toggle asset lock
  const toggleAssetLock = (symbol: string) => {
    setLockedAssets((prev) => ({
      ...prev,
      [symbol]: !prev[symbol],
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

  // Quick custom weight presets
  const applyCustomPreset = (preset: 'EQUAL' | 'AI_SCORE' | 'RESET_CURRENT') => {
    const updated: Record<string, number> = {};
    if (preset === 'EQUAL') {
      const eq = Number((100 / holdings.length).toFixed(1));
      holdings.forEach((h) => {
        updated[h.symbol] = eq;
      });
    } else if (preset === 'AI_SCORE') {
      const scoreSum = holdings.reduce((sum, h) => sum + (h.researchScore || 70), 0);
      holdings.forEach((h) => {
        const sc = h.researchScore || 70;
        updated[h.symbol] = Number(((sc / scoreSum) * 100).toFixed(1));
      });
    } else {
      // RESET_CURRENT
      holdings.forEach((h) => {
        const w = totalValue > 0 ? (h.currentPrice * h.shares / totalValue) * 100 : 0;
        updated[h.symbol] = Number(w.toFixed(1));
      });
    }
    setCustomWeights(updated);
  };

  // Update config parameter and trigger recalculation
  const updateConfig = (updates: Partial<RebalanceConfigOptions>) => {
    const nextConfig = { ...config, ...updates };
    setConfig(nextConfig);
    fetchRebalancePlan(selectedModel, nextConfig);
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
        fetchRebalancePlan(selectedModel, config);
      }, 3500);
    }, 600);
  };

  const actionableCount = plan?.items?.filter((i) => i.action !== 'HOLD' && i.sharesToTrade > 0).length || 0;
  const customSum: number = Object.keys(customWeights).reduce(
    (acc, sym) => acc + (customWeights[sym] || 0),
    0
  );

  const filteredModels = useMemo(() => {
    if (modelCategoryFilter === 'ALL') return ALLOCATION_MODELS;
    return ALLOCATION_MODELS.filter((m) => m.category === modelCategoryFilter);
  }, [modelCategoryFilter]);

  const filteredItems = useMemo(() => {
    if (!plan?.items) return [];
    if (orderFilter === 'ALL') return plan.items;
    if (orderFilter === 'BUY') return plan.items.filter((i) => i.action === 'BUY');
    if (orderFilter === 'SELL') return plan.items.filter((i) => i.action === 'SELL');
    return plan.items.filter((i) => Math.abs(i.driftPercent) >= config.driftThreshold);
  }, [plan?.items, orderFilter, config.driftThreshold]);

  return (
    <div className="space-y-6">
      {/* Top Banner: Agent 14 Identity & Strategy Selector */}
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono text-cyan-400 mb-1">
              <Sparkles className="w-4 h-4 text-cyan-400 animate-pulse" />
              <span>AGENT 14 — DYNAMIC TARGET ALLOCATION & REBALANCING ENGINE</span>
              <span className="px-2 py-0.5 rounded-full bg-cyan-950/80 border border-cyan-800 text-[10px] text-cyan-300 font-bold">
                {plan?.aiDirectives?.modelUsed ? `Gemini (${plan.aiDirectives.modelUsed})` : 'Gemini Multi-Agent Online'}
              </span>
            </div>
            <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
              <span>Dynamic Target Allocation & Rebalancing Cockpit</span>
              <span className="text-xs px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-300 font-mono">
                10 Institutional Models
              </span>
            </h2>
            <p className="text-xs text-slate-400 mt-1 max-w-3xl leading-relaxed">
              Synthesizes algorithmic target allocations, calculates multi-asset drift tolerance corridors, models Indian STT transaction friction, and generates executable rebalancing orders directly into the Paper Trading Lab.
            </p>
          </div>

          <div className="flex items-center flex-wrap gap-2">
            <button
              onClick={() => setShowComparisonModal(true)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-cyan-800/60 text-xs font-mono transition-colors"
            >
              <BarChart2 className="w-3.5 h-3.5" />
              <span>Compare Models</span>
            </button>

            <button
              onClick={() => setShowConfigPanel(!showConfigPanel)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-mono transition-colors ${
                showConfigPanel
                  ? 'bg-cyan-600 text-white border-cyan-500'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
              }`}
            >
              <Settings2 className="w-3.5 h-3.5" />
              <span>Engine Options</span>
              <span className="text-[10px] px-1 rounded bg-black/40 text-cyan-300 font-bold">
                {config.driftMode.substring(0, 3)} ±{config.driftThreshold}%
              </span>
            </button>

            <button
              onClick={() => fetchRebalancePlan(selectedModel, config)}
              disabled={loading}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-mono transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-cyan-400 ${loading ? 'animate-spin' : ''}`} />
              <span>{loading ? 'Synthesizing...' : 'Re-calculate'}</span>
            </button>

            {onOpenPaperTrade && (
              <button
                onClick={onOpenPaperTrade}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-700 text-emerald-300 text-xs font-mono transition-colors"
              >
                <span>Paper Lab</span>
                <ExternalLink className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>

        {/* Collapsible Advanced Engine Options Configuration Drawer */}
        {showConfigPanel && (
          <div className="p-4 rounded-xl bg-slate-950 border border-cyan-900/60 shadow-inner space-y-4 animate-fadeIn">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div className="flex items-center gap-2 text-xs font-mono text-cyan-400 font-bold">
                <Settings2 className="w-4 h-4 text-cyan-400" />
                <span>DYNAMIC REBALANCING ENGINE PARAMETERS & CONSTRAINTS</span>
              </div>
              <button
                onClick={() => setShowConfigPanel(false)}
                className="text-slate-400 hover:text-white text-xs font-mono"
              >
                Done
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-xs font-mono">
              {/* Option 1: Drift Band Mode */}
              <div className="space-y-1.5 p-3 rounded-xl bg-slate-900/80 border border-slate-800">
                <div className="flex items-center justify-between">
                  <span className="text-slate-300 font-semibold">Tolerance Band Mode</span>
                  <span className="text-[10px] text-cyan-400">{config.driftMode}</span>
                </div>
                <div className="grid grid-cols-3 gap-1 pt-1">
                  {(['ABSOLUTE', 'RELATIVE', 'VOLATILITY_ADJUSTED'] as RebalanceDriftMode[]).map((mode) => (
                    <button
                      key={mode}
                      onClick={() => updateConfig({ driftMode: mode })}
                      className={`px-1.5 py-1 rounded text-[10px] font-bold transition-colors ${
                        config.driftMode === mode
                          ? 'bg-cyan-600 text-white'
                          : 'bg-slate-800 hover:bg-slate-700 text-slate-400'
                      }`}
                    >
                      {mode === 'ABSOLUTE' ? 'Absolute' : mode === 'RELATIVE' ? 'Relative' : 'Vol-Adj'}
                    </button>
                  ))}
                </div>
                <div className="pt-2 flex items-center justify-between text-[11px] text-slate-400">
                  <span>Drift Trigger:</span>
                  <span className="text-white font-bold">±{config.driftThreshold}%</span>
                </div>
                <div className="flex items-center gap-1 pt-0.5">
                  {[1.0, 2.5, 5.0, 10.0].map((val) => (
                    <button
                      key={val}
                      onClick={() => updateConfig({ driftThreshold: val })}
                      className={`flex-1 py-0.5 rounded text-[10px] font-mono ${
                        config.driftThreshold === val
                          ? 'bg-cyan-900 text-cyan-200 border border-cyan-700'
                          : 'bg-slate-800/80 text-slate-400 hover:text-white'
                      }`}
                    >
                      ±{val}%
                    </button>
                  ))}
                </div>
              </div>

              {/* Option 2: Cadence / Schedule */}
              <div className="space-y-1.5 p-3 rounded-xl bg-slate-900/80 border border-slate-800">
                <div className="flex items-center justify-between">
                  <span className="text-slate-300 font-semibold">Rebalance Cadence</span>
                  <span className="text-[10px] text-cyan-400">{config.cadence}</span>
                </div>
                <div className="grid grid-cols-2 gap-1.5 pt-1">
                  {[
                    { id: 'CONTINUOUS_DRIFT', label: 'Drift-Breach' },
                    { id: 'WEEKLY_MONDAY', label: 'Weekly Mon' },
                    { id: 'MONTHLY_START', label: 'Monthly' },
                    { id: 'QUARTERLY_WINDOW', label: 'Quarterly' },
                  ].map((cad) => (
                    <button
                      key={cad.id}
                      onClick={() => updateConfig({ cadence: cad.id as RebalanceCadence })}
                      className={`px-2 py-1 rounded text-[10px] font-bold transition-colors ${
                        config.cadence === cad.id
                          ? 'bg-cyan-600 text-white'
                          : 'bg-slate-800 hover:bg-slate-700 text-slate-400'
                      }`}
                    >
                      {cad.label}
                    </button>
                  ))}
                </div>
                <p className="text-[10px] text-slate-400 pt-1 leading-snug">
                  {config.cadence === 'CONTINUOUS_DRIFT'
                    ? 'Evaluates active positions continuously upon any tolerance band violation.'
                    : 'Batches execution to fixed institutional market calendar open.'}
                </p>
              </div>

              {/* Option 3: Cash Buffer Reserve */}
              <div className="space-y-1.5 p-3 rounded-xl bg-slate-900/80 border border-slate-800">
                <div className="flex items-center justify-between">
                  <span className="text-slate-300 font-semibold">Cash Buffer Reserve</span>
                  <span className="text-cyan-400 font-bold">{config.cashBufferPercent}%</span>
                </div>
                <div className="flex items-center gap-1 pt-1">
                  {[0, 5, 10, 15, 20].map((pct) => (
                    <button
                      key={pct}
                      onClick={() => updateConfig({ cashBufferPercent: pct })}
                      className={`flex-1 py-1 rounded text-[10px] font-mono font-bold ${
                        config.cashBufferPercent === pct
                          ? 'bg-cyan-900 text-cyan-200 border border-cyan-700'
                          : 'bg-slate-800/80 text-slate-400 hover:text-white'
                      }`}
                    >
                      {pct}%
                    </button>
                  ))}
                </div>
                <div className="pt-1.5 text-[10px] text-slate-400">
                  Target Reserve:{' '}
                  <span className="text-white font-bold">
                    ₹{Math.round((totalValue * config.cashBufferPercent) / 100).toLocaleString()}
                  </span>
                </div>
                <p className="text-[9px] text-slate-500">
                  Reserves dry powder cash to capitalize on market drawdowns without selling core holdings.
                </p>
              </div>

              {/* Option 4: Anti-Dust Floor & Risk Triggers */}
              <div className="space-y-1.5 p-3 rounded-xl bg-slate-900/80 border border-slate-800">
                <div className="flex items-center justify-between">
                  <span className="text-slate-300 font-semibold">Min Order Floor</span>
                  <span className="text-cyan-400 font-bold">₹{config.minTradeThreshold.toLocaleString()}</span>
                </div>
                <div className="flex items-center gap-1 pt-1">
                  {[0, 1000, 2500, 5000].map((val) => (
                    <button
                      key={val}
                      onClick={() => updateConfig({ minTradeThreshold: val })}
                      className={`flex-1 py-1 rounded text-[10px] font-mono ${
                        config.minTradeThreshold === val
                          ? 'bg-cyan-900 text-cyan-200 border border-cyan-700'
                          : 'bg-slate-800/80 text-slate-400 hover:text-white'
                      }`}
                    >
                      {val === 0 ? '₹0' : `₹${val / 1000}k`}
                    </button>
                  ))}
                </div>

                {/* Toggles */}
                <div className="pt-2 space-y-1">
                  <label className="flex items-center justify-between cursor-pointer text-[10px] text-slate-300">
                    <span>Tax-Loss Harvesting:</span>
                    <input
                      type="checkbox"
                      checked={config.taxLossHarvesting}
                      onChange={(e) => updateConfig({ taxLossHarvesting: e.target.checked })}
                      className="rounded accent-cyan-400"
                    />
                  </label>

                  <label className="flex items-center justify-between cursor-pointer text-[10px] text-slate-300">
                    <span>FinBERT Shock Guard (-0.40):</span>
                    <input
                      type="checkbox"
                      checked={config.finbertShockTrigger}
                      onChange={(e) => updateConfig({ finbertShockTrigger: e.target.checked })}
                      className="rounded accent-cyan-400"
                    />
                  </label>

                  <label className="flex items-center justify-between cursor-pointer text-[10px] text-slate-300">
                    <span>Vol Spike Guard (&gt;22%):</span>
                    <input
                      type="checkbox"
                      checked={config.volatilitySpikeTrigger}
                      onChange={(e) => updateConfig({ volatilitySpikeTrigger: e.target.checked })}
                      className="rounded accent-cyan-400"
                    />
                  </label>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Model Filter Category Pills */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
            <span className="uppercase tracking-wider">Select Allocation Strategy:</span>
            <div className="flex items-center gap-1">
              {(['ALL', 'ALPHA', 'DEFENSIVE', 'SYSTEMATIC', 'CUSTOM'] as const).map((cat) => (
                <button
                  key={cat}
                  onClick={() => setModelCategoryFilter(cat)}
                  className={`px-2 py-0.5 rounded text-[10px] transition-colors ${
                    modelCategoryFilter === cat
                      ? 'bg-cyan-900 text-cyan-200 font-bold border border-cyan-700'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {cat === 'ALL'
                    ? 'All (10)'
                    : cat === 'ALPHA'
                    ? 'Alpha & AI'
                    : cat === 'DEFENSIVE'
                    ? 'Defensive'
                    : cat === 'SYSTEMATIC'
                    ? 'Systematic'
                    : 'Custom'}
                </button>
              ))}
            </div>
          </div>

          {/* Model Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5">
            {filteredModels.map((m) => {
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
                        <Icon className={`w-3.5 h-3.5 shrink-0 ${isSelected ? 'text-cyan-400' : 'text-slate-400'}`} />
                        <span className="truncate">{m.title}</span>
                      </div>
                      <span
                        className={`text-[9px] px-1.5 py-0.5 rounded font-mono font-semibold shrink-0 ${
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
                  <div className="pt-2 text-[9px] font-mono text-cyan-400/80 flex items-center justify-between">
                    <span>{m.regime}</span>
                    {isSelected && <Check className="w-3 h-3 text-cyan-400" />}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Custom Weight Studio with Asset Locking if CUSTOM is selected */}
        {selectedModel === 'CUSTOM' && (
          <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs font-mono">
              <div className="flex items-center gap-2">
                <Sliders className="w-4 h-4 text-cyan-400" />
                <span className="text-cyan-400 font-bold">CUSTOM ALLOCATION STUDIO & ASSET LOCKING</span>
              </div>
              <div className="flex items-center flex-wrap gap-2">
                <span
                  className={`font-bold px-2 py-0.5 rounded text-xs ${
                    Math.abs(customSum - 100) < 0.5
                      ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                      : 'bg-amber-950 text-amber-300 border border-amber-800'
                  }`}
                >
                  Sum: {customSum.toFixed(1)}% {Math.abs(customSum - 100) >= 0.5 && '(Target 100%)'}
                </span>

                <button
                  onClick={handleNormalizeCustomWeights}
                  className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-[11px] font-mono border border-slate-700"
                >
                  Auto-Normalize 100%
                </button>

                <div className="flex items-center gap-1 border-l border-slate-800 pl-2">
                  <button
                    onClick={() => applyCustomPreset('EQUAL')}
                    className="px-2 py-1 bg-slate-900 hover:bg-slate-800 text-slate-400 text-[10px] rounded border border-slate-800"
                  >
                    1/N Equal
                  </button>
                  <button
                    onClick={() => applyCustomPreset('AI_SCORE')}
                    className="px-2 py-1 bg-slate-900 hover:bg-slate-800 text-slate-400 text-[10px] rounded border border-slate-800"
                  >
                    AI Score Tilt
                  </button>
                  <button
                    onClick={() => applyCustomPreset('RESET_CURRENT')}
                    className="px-2 py-1 bg-slate-900 hover:bg-slate-800 text-slate-400 text-[10px] rounded border border-slate-800"
                  >
                    Holdings Baseline
                  </button>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
              {holdings.map((h) => {
                const isLocked = Boolean(lockedAssets[h.symbol]);
                return (
                  <div
                    key={h.symbol}
                    className={`p-2.5 rounded-lg border space-y-1.5 transition-colors ${
                      isLocked ? 'bg-slate-900/40 border-amber-800/60' : 'bg-slate-900/70 border-slate-800'
                    }`}
                  >
                    <div className="flex justify-between items-center text-xs font-mono">
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => toggleAssetLock(h.symbol)}
                          title={isLocked ? 'Unlock Asset' : 'Lock Target Weight'}
                          className={`p-1 rounded transition-colors ${
                            isLocked ? 'bg-amber-900/60 text-amber-300' : 'text-slate-500 hover:text-slate-300'
                          }`}
                        >
                          {isLocked ? <Lock className="w-3 h-3" /> : <Unlock className="w-3 h-3" />}
                        </button>
                        <span className="text-white font-semibold">{h.symbol}</span>
                        <span className="text-[10px] text-slate-400">{h.sector}</span>
                      </div>
                      <span className="text-cyan-400 font-bold">
                        {(customWeights[h.symbol] || 0).toFixed(1)}%
                      </span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="60"
                      step="0.5"
                      disabled={isLocked}
                      value={customWeights[h.symbol] || 0}
                      onChange={(e) => handleCustomWeightChange(h.symbol, parseFloat(e.target.value))}
                      className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400 disabled:opacity-40"
                    />
                    <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                      <span>Cur: {totalValue > 0 ? ((h.currentPrice * h.shares / totalValue) * 100).toFixed(1) : 0}%</span>
                      <span>Score: {h.researchScore || 70}/100</span>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => fetchRebalancePlan('CUSTOM', config)}
                className="px-4 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-mono font-bold rounded-lg transition-colors shadow-md"
              >
                Apply Custom Targets
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Execution Feedback Notification */}
      {executedSuccessMsg && (
        <div className="p-4 rounded-xl bg-emerald-950/80 border border-emerald-700 text-emerald-200 text-xs font-mono flex items-center justify-between gap-3 shadow-lg animate-fadeIn">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{executedSuccessMsg}</span>
          </div>
          {onOpenPaperTrade && (
            <button
              onClick={onOpenPaperTrade}
              className="px-3 py-1 bg-emerald-900 hover:bg-emerald-800 text-white rounded font-bold text-xs"
            >
              View in Paper Lab &rarr;
            </button>
          )}
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
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-cyan-400" />
              <h3 className="text-xs font-bold text-white font-mono uppercase tracking-wider">
                Agent 14 Thesis & Allocation Rationale
              </h3>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono text-cyan-300 bg-cyan-950 border border-cyan-800 px-2 py-0.5 rounded">
                Model: {plan.modelName}
              </span>
              {plan.configApplied && (
                <span className="text-[10px] font-mono text-slate-300 bg-slate-800 px-2 py-0.5 rounded">
                  Drift: {plan.configApplied.driftMode} (±{plan.configApplied.driftThreshold}%)
                </span>
              )}
            </div>
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
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 w-full lg:w-auto">
              <div>
                <span className="text-[11px] text-slate-400 font-mono">Gross Turnover</span>
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
                <div className="flex items-center gap-1">
                  <span className="text-[11px] text-slate-400 font-mono">Transaction Friction</span>
                  <button
                    onClick={() => setShowCostBreakdownModal(true)}
                    className="text-cyan-400 hover:text-white"
                    title="View Indian Tax & Friction Breakdown"
                  >
                    <Info className="w-3 h-3" />
                  </button>
                </div>
                <div className="text-xl font-bold font-mono text-white mt-0.5">
                  ₹{plan.estimatedCost.toLocaleString()}
                </div>
                <button
                  onClick={() => setShowCostBreakdownModal(true)}
                  className="text-[10px] text-cyan-400 font-mono hover:underline"
                >
                  STT 0.1%, Brokerage & GST &rarr;
                </button>
              </div>

              <div>
                <span className="text-[11px] text-slate-400 font-mono">Cash Delta / Buffer</span>
                <div
                  className={`text-xl font-bold font-mono mt-0.5 ${
                    plan.netCashRequired > 0 ? 'text-amber-400' : 'text-emerald-400'
                  }`}
                >
                  {plan.netCashRequired > 0 ? `-₹${plan.netCashRequired.toLocaleString()}` : '+Cash Neutral'}
                </div>
                <span className="text-[10px] text-slate-400 font-mono">
                  Buffer Target: {plan.cashBufferPercent || 0}% (₹{(plan.cashBufferValue || 0).toLocaleString()})
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

      {/* Educational Use Disclaimer */}
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
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-400 font-mono">
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-200">
                RECOMMENDED BUY / SELL REBALANCE ORDERS ({filteredItems.length} ASSETS)
              </span>
              <span className="text-[10px] text-cyan-400 bg-slate-800 px-2 py-0.5 rounded">
                Tolerance: ±{config.driftThreshold}% ({config.driftMode})
              </span>
            </div>

            {/* Table Filter Tabs */}
            <div className="flex items-center gap-1.5">
              <span>Filter:</span>
              {(['ALL', 'BREACHED', 'BUY', 'SELL'] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setOrderFilter(f)}
                  className={`px-2 py-0.5 rounded text-[11px] font-mono transition-colors ${
                    orderFilter === f
                      ? 'bg-cyan-600 text-white font-bold'
                      : 'bg-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  {f === 'ALL'
                    ? 'All'
                    : f === 'BREACHED'
                    ? 'Drift Breached'
                    : f === 'BUY'
                    ? 'Buys Only'
                    : 'Sells Only'}
                </button>
              ))}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400">
                  <th className="py-3 px-3">Asset & Sector</th>
                  <th className="py-3 px-3 text-center">Factor Audit</th>
                  <th className="py-3 px-3 text-center">Current vs Target</th>
                  <th className="py-3 px-3 text-center">Drift Band</th>
                  <th className="py-3 px-3 text-center">Action Order</th>
                  <th className="py-3 px-3 text-right">Order Value</th>
                  <th className="py-3 px-3 text-left">Thesis Rationale</th>
                  <th className="py-3 px-3 text-center">Execute</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {filteredItems.map((item) => {
                  const isBuy = item.action === 'BUY';
                  const isSell = item.action === 'SELL';
                  const isHold = item.action === 'HOLD';
                  const isDriftBreach = Math.abs(item.driftPercent) >= config.driftThreshold;

                  return (
                    <tr
                      key={item.symbol}
                      className={`hover:bg-slate-800/40 transition-colors ${
                        item.filteredByMinThreshold ? 'opacity-70 bg-slate-950/30' : ''
                      }`}
                    >
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

                      {/* Factor Audit: Score, Vol, FinBERT Polarity */}
                      <td className="py-3.5 px-3 text-center">
                        <div className="flex flex-col items-center gap-0.5">
                          <span
                            className={`inline-block px-2 py-0.5 rounded-full font-bold text-[10px] ${
                              item.researchScore >= 80
                                ? 'bg-emerald-950 text-emerald-300 border border-emerald-700'
                                : item.researchScore >= 70
                                ? 'bg-cyan-950 text-cyan-300 border border-cyan-800'
                                : 'bg-amber-950 text-amber-300 border border-amber-800'
                            }`}
                          >
                            Score: {item.researchScore}/100
                          </span>
                          <div className="flex items-center gap-1 text-[9px] text-slate-400 font-mono mt-0.5">
                            <span>Vol: {item.volatility30d || 18}%</span>
                            <span>•</span>
                            <span
                              className={
                                (item.finbertSentimentPolarity || 0) >= 0.3
                                  ? 'text-emerald-400'
                                  : (item.finbertSentimentPolarity || 0) < 0
                                  ? 'text-rose-400'
                                  : 'text-slate-400'
                              }
                            >
                              FinBERT: {(item.finbertSentimentPolarity || 0) >= 0 ? '+' : ''}
                              {(item.finbertSentimentPolarity || 0).toFixed(2)}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Current vs Target Weights & Visual Dual Bar */}
                      <td className="py-3.5 px-3 min-w-[140px]">
                        <div className="flex justify-between text-[11px] mb-1">
                          <span className="text-slate-400 font-mono">
                            Cur: <strong className="text-white">{item.currentWeight.toFixed(1)}%</strong>
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
                            item.driftPercent > config.driftThreshold
                              ? 'bg-rose-950/80 text-rose-300 border border-rose-800'
                              : item.driftPercent < -config.driftThreshold
                              ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-800'
                              : 'bg-slate-800 text-slate-300'
                          }`}
                        >
                          {item.driftPercent > 0 ? '+' : ''}
                          {item.driftPercent.toFixed(1)}%
                        </span>
                        <div className="text-[9px] text-slate-400 mt-0.5">
                          {isDriftBreach ? (
                            <span className="text-amber-400 font-bold">Band Breached</span>
                          ) : (
                            <span className="text-slate-500">In Band (±{config.driftThreshold}%)</span>
                          )}
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
                          <div className="flex flex-col items-center">
                            <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-400 text-xs font-semibold">
                              HOLD (0)
                            </span>
                            {item.filteredByMinThreshold && (
                              <span className="text-[9px] text-amber-400/90 mt-0.5">
                                &lt; ₹{config.minTradeThreshold.toLocaleString()} floor
                              </span>
                            )}
                          </div>
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

                      {/* Thesis Reasoning */}
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

      {/* Model Strategy Comparison Matrix Modal */}
      {showComparisonModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-4xl w-full max-h-[85vh] flex flex-col shadow-2xl overflow-hidden animate-fadeIn">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BarChart2 className="w-4 h-4 text-cyan-400" />
                <h3 className="text-sm font-bold text-white font-mono uppercase tracking-wider">
                  Target Allocation Strategy Matrix (10 Models Compared)
                </h3>
              </div>
              <button
                onClick={() => setShowComparisonModal(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 overflow-y-auto space-y-4 text-xs font-mono">
              <p className="text-slate-300 font-sans text-xs">
                Review and compare all institutional target allocation frameworks. Selecting a model will update rebalancing recommendations and drift bands across your active holdings.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {ALLOCATION_MODELS.map((m) => {
                  const isSelected = selectedModel === m.type;
                  const Icon = m.icon;
                  return (
                    <div
                      key={m.type}
                      className={`p-3.5 rounded-xl border flex flex-col justify-between space-y-2 ${
                        isSelected
                          ? 'bg-cyan-950/60 border-cyan-500 shadow-md'
                          : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <div className="space-y-1">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 font-bold text-white">
                            <Icon className="w-4 h-4 text-cyan-400" />
                            <span>{m.title}</span>
                          </div>
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-cyan-300 font-semibold">
                            {m.tag}
                          </span>
                        </div>
                        <p className="text-[11px] font-sans text-slate-300 leading-relaxed">{m.desc}</p>
                      </div>

                      <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between">
                        <span className="text-[10px] text-slate-400">Regime: {m.regime}</span>
                        <button
                          onClick={() => {
                            setSelectedModel(m.type);
                            setShowComparisonModal(false);
                            fetchRebalancePlan(m.type, config);
                          }}
                          className={`px-3 py-1 rounded text-[11px] font-bold font-mono transition-colors ${
                            isSelected
                              ? 'bg-cyan-600 text-white cursor-default'
                              : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
                          }`}
                        >
                          {isSelected ? 'Active Model' : 'Apply Model'}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Indian STT & Transaction Friction Breakdown Modal */}
      {showCostBreakdownModal && plan?.costBreakdown && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full shadow-2xl overflow-hidden animate-fadeIn">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-cyan-400" />
                <h3 className="text-sm font-bold text-white font-mono uppercase tracking-wider">
                  Indian Market Rebalancing Friction Audit
                </h3>
              </div>
              <button
                onClick={() => setShowCostBreakdownModal(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-3 text-xs font-mono">
              <p className="text-slate-300 font-sans text-xs">
                Estimated regulatory, tax, and brokerage costs to execute the complete rebalance plan across National Stock Exchange (NSE) & BSE delivery orders:
              </p>

              <div className="space-y-2 p-3 bg-slate-950 rounded-xl border border-slate-800">
                <div className="flex justify-between text-slate-300">
                  <span>Securities Transaction Tax (STT 0.1%):</span>
                  <span className="text-white font-bold">₹{plan.costBreakdown.sttDelivery.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span>Exchange Turnover Charges (~0.00345%):</span>
                  <span className="text-white font-bold">₹{plan.costBreakdown.exchangeTurnoverFee.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span>Brokerage (₹20 flat per order):</span>
                  <span className="text-white font-bold">₹{plan.costBreakdown.brokerageFee.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span>GST (18% on brokerage & exchange fees):</span>
                  <span className="text-white font-bold">₹{plan.costBreakdown.gstAmount.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span>Stamp Duty (0.015% on buys):</span>
                  <span className="text-white font-bold">₹{plan.costBreakdown.stampDuty.toLocaleString()}</span>
                </div>
                <div className="border-t border-slate-800 pt-2 flex justify-between text-cyan-400 font-bold text-sm">
                  <span>Total Estimated Friction:</span>
                  <span>₹{plan.costBreakdown.totalFriction.toLocaleString()} ({plan.costBreakdown.frictionPercent}% bps)</span>
                </div>
              </div>

              <p className="text-[10px] text-slate-500 font-sans">
                Note: Anti-dust trade filtering is active (minimum order floor ₹{config.minTradeThreshold.toLocaleString()}) to eliminate small fractional trades that create disproportionate friction drag.
              </p>

              <button
                onClick={() => setShowCostBreakdownModal(false)}
                className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-bold font-mono text-xs transition-colors"
              >
                Close Audit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
