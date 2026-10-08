import React, { useState, useMemo } from 'react';
import {
  Calculator,
  Sliders,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Scale,
  ShieldCheck,
  Target,
  Sparkles,
  Info,
  DollarSign,
  Layers,
  ArrowRight,
  HelpCircle,
} from 'lucide-react';
import { StockResearchData } from '../types';
import { calculateStockIntrinsicValue, getValuationBadgeConfig } from '../utils/stockValuationHelper';
import { EducationalDisclaimer } from './EducationalDisclaimer';

interface DynamicValuationModelProps {
  stock: StockResearchData;
}

export const DynamicValuationModel: React.FC<DynamicValuationModelProps> = ({ stock }) => {
  // Baseline defaults derived from fundamental metrics
  const initialIntrinsic = useMemo(() => {
    return stock.intrinsicValue || calculateStockIntrinsicValue(stock);
  }, [stock]);

  const defaultGrowth = initialIntrinsic.projectedGrowthRate;
  const isIndianStock = stock.currency === '₹' || stock.exchange === 'NSE' || stock.exchange === 'BSE' || !stock.currency;
  const defaultDiscountRate = initialIntrinsic.discountRate;
  const defaultTerminalGrowth = initialIntrinsic.terminalGrowthRate;
  const defaultPE = initialIntrinsic.targetPE;

  const [growthRate, setGrowthRate] = useState<number>(defaultGrowth);
  const [discountRate, setDiscountRate] = useState<number>(defaultDiscountRate);
  const [terminalGrowthRate, setTerminalGrowthRate] = useState<number>(defaultTerminalGrowth);
  const [targetPE, setTargetPE] = useState<number>(defaultPE);
  const [marginHurdle, setMarginHurdle] = useState<number>(15); // Desired Margin of Safety %
  const [activeScenario, setActiveScenario] = useState<'BASE' | 'CONSERVATIVE' | 'AGGRESSIVE' | 'CUSTOM'>('BASE');

  // Reset when stock changes
  React.useEffect(() => {
    setGrowthRate(defaultGrowth);
    setDiscountRate(defaultDiscountRate);
    setTerminalGrowthRate(defaultTerminalGrowth);
    setTargetPE(defaultPE);
    setActiveScenario('BASE');
  }, [stock.symbol, defaultGrowth, defaultDiscountRate, defaultTerminalGrowth, defaultPE]);

  // Compute live intrinsic valuation based on sliders
  const valuation = useMemo(() => {
    if (
      activeScenario === 'BASE' &&
      growthRate === defaultGrowth &&
      discountRate === defaultDiscountRate &&
      terminalGrowthRate === defaultTerminalGrowth &&
      targetPE === defaultPE
    ) {
      return stock.intrinsicValue || calculateStockIntrinsicValue(stock);
    }
    return calculateStockIntrinsicValue(stock, {
      growthRate,
      discountRate,
      terminalGrowthRate,
      targetPE,
    });
  }, [stock, growthRate, discountRate, terminalGrowthRate, targetPE, activeScenario, defaultGrowth, defaultDiscountRate, defaultTerminalGrowth, defaultPE]);

  const badgeConfig = getValuationBadgeConfig(valuation.valuationStatus);

  // Preset Handlers
  const handleApplyPreset = (preset: 'BASE' | 'CONSERVATIVE' | 'AGGRESSIVE') => {
    setActiveScenario(preset);
    if (preset === 'BASE') {
      setGrowthRate(defaultGrowth);
      setDiscountRate(defaultDiscountRate);
      setTerminalGrowthRate(defaultTerminalGrowth);
      setTargetPE(defaultPE);
    } else if (preset === 'CONSERVATIVE') {
      setGrowthRate(Math.max(4.0, Number((defaultGrowth * 0.7).toFixed(1))));
      setDiscountRate(isIndianStock ? 13.0 : 10.5);
      setTerminalGrowthRate(isIndianStock ? 3.5 : 2.0);
      setTargetPE(Math.max(12, Number((defaultPE * 0.8).toFixed(1))));
    } else if (preset === 'AGGRESSIVE') {
      setGrowthRate(Math.min(30.0, Number((defaultGrowth * 1.35).toFixed(1))));
      setDiscountRate(isIndianStock ? 10.0 : 8.0);
      setTerminalGrowthRate(isIndianStock ? 5.5 : 3.0);
      setTargetPE(Number((defaultPE * 1.15).toFixed(1)));
    }
  };

  const handleSliderChange = (setter: React.Dispatch<React.SetStateAction<number>>, val: number) => {
    setter(val);
    setActiveScenario('CUSTOM');
  };

  const isUndervalued = valuation.marginOfSafetyPercent >= marginHurdle;
  const priceDiff = valuation.blendedIntrinsicValue - stock.price;

  return (
    <div className="p-5 sm:p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-cyan-950/80 border border-cyan-800 text-cyan-400">
            <Scale className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-white tracking-wide">
                Institutional DCF Financial Valuation Engine
              </h2>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-cyan-950 text-cyan-300 border border-cyan-700">
                MULTI-MODEL DCF
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Deterministic valuation integrating Discounted Cash Flow, Benjamin Graham, Peter Lynch, and Relative Multiples.
            </p>
          </div>
        </div>

        {/* Preset Selector */}
        <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs font-semibold">
          <button
            onClick={() => handleApplyPreset('CONSERVATIVE')}
            className={`px-2.5 py-1 rounded-lg transition-all ${
              activeScenario === 'CONSERVATIVE'
                ? 'bg-slate-800 text-amber-300 shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Conservative
          </button>
          <button
            onClick={() => handleApplyPreset('BASE')}
            className={`px-2.5 py-1 rounded-lg transition-all ${
              activeScenario === 'BASE'
                ? 'bg-cyan-950 text-cyan-300 border border-cyan-700 shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Consensus Base
          </button>
          <button
            onClick={() => handleApplyPreset('AGGRESSIVE')}
            className={`px-2.5 py-1 rounded-lg transition-all ${
              activeScenario === 'AGGRESSIVE'
                ? 'bg-slate-800 text-emerald-300 shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Bull Growth
          </button>
          {activeScenario === 'CUSTOM' && (
            <button
              onClick={() => handleApplyPreset('BASE')}
              className="px-2 py-1 text-slate-500 hover:text-slate-300 flex items-center gap-1"
              title="Reset to base parameters"
            >
              <RefreshCw className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>

      {/* Main Intrinsic Value Hero Result */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left: Core Valuation Verdict Card */}
        <div className="lg:col-span-8 p-5 rounded-2xl bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 border border-slate-800 shadow-xl relative overflow-hidden">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <span className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider block">
                DCF Fair Value Target
              </span>
              <div className="flex items-baseline gap-3 mt-1">
                <span className="text-3xl sm:text-4xl font-bold text-white tracking-tight">
                  {stock.currency}{valuation.blendedIntrinsicValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
                <span className="text-xs text-slate-400">
                  per share
                </span>
              </div>
              <div className="flex items-center gap-2 mt-2 text-xs text-slate-400">
                <span>CMP: <strong className="text-slate-200">{stock.currency}{stock.price.toLocaleString(undefined, { minimumFractionDigits: 2 })}</strong></span>
                <span>•</span>
                <span>Variance: <strong className={priceDiff >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                  {priceDiff >= 0 ? '+' : ''}{stock.currency}{priceDiff.toFixed(2)}
                </strong></span>
              </div>
            </div>

            {/* Margin of Safety Display */}
            <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 text-left sm:text-right">
              <span className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider block">
                Margin of Safety (MoS)
              </span>
              <div
                className={`text-2xl sm:text-3xl font-bold mt-0.5 flex items-center sm:justify-end gap-1.5 ${
                  valuation.marginOfSafetyPercent >= 0 ? 'text-emerald-400' : 'text-rose-400'
                }`}
              >
                {valuation.marginOfSafetyPercent >= 0 ? (
                  <TrendingUp className="w-5 h-5" />
                ) : (
                  <TrendingDown className="w-5 h-5" />
                )}
                <span>
                  {valuation.marginOfSafetyPercent >= 0 ? '+' : ''}
                  {valuation.marginOfSafetyPercent}%
                </span>
              </div>
              <div className="mt-1">
                <span className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${badgeConfig.badgeBg}`}>
                  {badgeConfig.label}
                </span>
              </div>
            </div>
          </div>

          {/* Visual Margin of Safety Bar */}
          <div className="mt-5 pt-4 border-t border-slate-800/80">
            <div className="flex justify-between items-center text-xs mb-1.5">
              <span className="text-slate-400 font-medium">Margin of Safety Spectrum</span>
              <span className="text-slate-300 font-semibold">
                {valuation.marginOfSafetyPercent >= 0
                  ? `${valuation.marginOfSafetyPercent}% Discount to Fair Value`
                  : `${Math.abs(valuation.marginOfSafetyPercent)}% Premium over Fair Value`}
              </span>
            </div>
            <div className="w-full h-3 bg-slate-950 rounded-full overflow-hidden flex p-0.5 border border-slate-800">
              {/* Overvalued Zone */}
              <div className="w-1/3 h-full bg-rose-950/60 rounded-l-full relative flex items-center justify-center">
                <span className="text-[9px] text-rose-400 font-bold uppercase tracking-wider">Premium</span>
              </div>
              {/* Fair Value Zone */}
              <div className="w-1/3 h-full bg-blue-950/60 relative flex items-center justify-center border-x border-slate-800">
                <span className="text-[9px] text-blue-300 font-bold uppercase tracking-wider">Fair</span>
              </div>
              {/* Undervalued Zone */}
              <div className="w-1/3 h-full bg-emerald-950/60 rounded-r-full relative flex items-center justify-center">
                <span className="text-[9px] text-emerald-400 font-bold uppercase tracking-wider">Discount</span>
              </div>
            </div>
          </div>

          {/* Verdict Banner */}
          <div className="mt-4 p-3 rounded-xl bg-slate-950/70 border border-slate-800/80 flex items-start gap-2.5 text-xs">
            <Info className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
            <p className="text-slate-300 leading-relaxed">
              {valuation.verdict}
            </p>
          </div>
        </div>

        {/* Right: Reverse DCF & Market Expectation Card */}
        <div className="lg:col-span-4 p-5 rounded-2xl bg-slate-950 border border-slate-800 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider">
                Reverse DCF Analysis
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/10 text-amber-300 border border-amber-500/30">
                MARKET PRICING
              </span>
            </div>
            <h3 className="text-sm font-bold text-white mt-1">
              What Growth is Market Pricing In?
            </h3>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">
              To justify the current CMP of <strong>{stock.currency}{stock.price.toLocaleString()}</strong>, the market is discounting:
            </p>

            <div className="mt-4 p-3.5 rounded-xl bg-slate-900 border border-slate-800 text-center">
              <div className="text-3xl font-bold text-amber-400">
                {valuation.reverseDcfImpliedGrowth}%
              </div>
              <span className="text-[11px] text-slate-400 font-medium block mt-0.5">
                Implied 5-Year FCF CAGR
              </span>
            </div>

            <div className="mt-3 text-xs text-slate-400 space-y-1">
              <div className="flex justify-between">
                <span>Company Baseline Growth:</span>
                <strong className="text-cyan-400">{valuation.projectedGrowthRate.toFixed(1)}%</strong>
              </div>
              <div className="flex justify-between">
                <span>Spread (Your View - Market):</span>
                <strong className={valuation.projectedGrowthRate >= valuation.reverseDcfImpliedGrowth ? 'text-emerald-400' : 'text-rose-400'}>
                  {valuation.projectedGrowthRate >= valuation.reverseDcfImpliedGrowth ? '+' : ''}
                  {(valuation.projectedGrowthRate - valuation.reverseDcfImpliedGrowth).toFixed(1)}%
                </strong>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800/80 text-[11px] text-slate-400">
            {valuation.projectedGrowthRate > valuation.reverseDcfImpliedGrowth ? (
              <span className="text-emerald-400 flex items-center gap-1 font-semibold">
                <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                You expect higher growth than the market is pricing in.
              </span>
            ) : (
              <span className="text-amber-400 flex items-center gap-1 font-semibold">
                <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                Current price already discounts aggressive earnings growth.
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Model Matrix Comparison: 5 Independent Valuation Frameworks */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-cyan-400" />
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">
              Independent Valuation Model Breakdown
            </h3>
          </div>
          <span className="text-[11px] text-slate-400">
            Weights: DCF (35%) • Graham (25%) • Graham No (15%) • Lynch (15%) • Multiples (10%)
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* 1. DCF Model */}
          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 hover:border-cyan-500/50 transition-all">
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-400 font-semibold">DCF Cash Flow</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-cyan-950 text-cyan-300 font-bold border border-cyan-800">
                35% Wt
              </span>
            </div>
            <div className="text-lg font-bold text-white mt-1">
              {stock.currency}{valuation.dcfValue.toLocaleString()}
            </div>
            <div className="flex items-center justify-between text-[11px] mt-1">
              <span className="text-slate-400">Variance:</span>
              <span className={valuation.dcfValue >= stock.price ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
                {valuation.dcfValue >= stock.price ? '+' : ''}
                {(((valuation.dcfValue - stock.price) / stock.price) * 100).toFixed(1)}%
              </span>
            </div>
            <p className="text-[10px] text-slate-500 mt-2 line-clamp-2">
              5Y explicit cash flows + Gordon terminal value discounted at {discountRate}%.
            </p>
          </div>

          {/* 2. Graham Revised Formula */}
          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 hover:border-cyan-500/50 transition-all">
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-400 font-semibold">Graham Formula</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-cyan-950 text-cyan-300 font-bold border border-cyan-800">
                25% Wt
              </span>
            </div>
            <div className="text-lg font-bold text-white mt-1">
              {stock.currency}{valuation.grahamFormulaValue.toLocaleString()}
            </div>
            <div className="flex items-center justify-between text-[11px] mt-1">
              <span className="text-slate-400">Variance:</span>
              <span className={valuation.grahamFormulaValue >= stock.price ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
                {valuation.grahamFormulaValue >= stock.price ? '+' : ''}
                {(((valuation.grahamFormulaValue - stock.price) / stock.price) * 100).toFixed(1)}%
              </span>
            </div>
            <p className="text-[10px] text-slate-500 mt-2 line-clamp-2">
              Revised Benjamin Graham formula adjusted for AAA bond/G-sec yield.
            </p>
          </div>

          {/* 3. Benjamin Graham Number */}
          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 hover:border-cyan-500/50 transition-all">
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-400 font-semibold">Graham Number</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-cyan-950 text-cyan-300 font-bold border border-cyan-800">
                15% Wt
              </span>
            </div>
            <div className="text-lg font-bold text-white mt-1">
              {stock.currency}{valuation.grahamNumber.toLocaleString()}
            </div>
            <div className="flex items-center justify-between text-[11px] mt-1">
              <span className="text-slate-400">Variance:</span>
              <span className={valuation.grahamNumber >= stock.price ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
                {valuation.grahamNumber >= stock.price ? '+' : ''}
                {(((valuation.grahamNumber - stock.price) / stock.price) * 100).toFixed(1)}%
              </span>
            </div>
            <p className="text-[10px] text-slate-500 mt-2 line-clamp-2">
              Defensive floor derived from √(22.5 × EPS × Book Value).
            </p>
          </div>

          {/* 4. Peter Lynch Model */}
          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 hover:border-cyan-500/50 transition-all">
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-400 font-semibold">Peter Lynch Model</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-cyan-950 text-cyan-300 font-bold border border-cyan-800">
                15% Wt
              </span>
            </div>
            <div className="text-lg font-bold text-white mt-1">
              {stock.currency}{valuation.peterLynchValue.toLocaleString()}
            </div>
            <div className="flex items-center justify-between text-[11px] mt-1">
              <span className="text-slate-400">Variance:</span>
              <span className={valuation.peterLynchValue >= stock.price ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
                {valuation.peterLynchValue >= stock.price ? '+' : ''}
                {(((valuation.peterLynchValue - stock.price) / stock.price) * 100).toFixed(1)}%
              </span>
            </div>
            <p className="text-[10px] text-slate-500 mt-2 line-clamp-2">
              Growth parity fair value adjusted for dividend yield and PEG 1.0.
            </p>
          </div>

          {/* 5. Relative Multiples Model */}
          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 hover:border-cyan-500/50 transition-all">
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-400 font-semibold">Multiple Relative</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-cyan-950 text-cyan-300 font-bold border border-cyan-800">
                10% Wt
              </span>
            </div>
            <div className="text-lg font-bold text-white mt-1">
              {stock.currency}{valuation.multiplesFairValue.toLocaleString()}
            </div>
            <div className="flex items-center justify-between text-[11px] mt-1">
              <span className="text-slate-400">Variance:</span>
              <span className={valuation.multiplesFairValue >= stock.price ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
                {valuation.multiplesFairValue >= stock.price ? '+' : ''}
                {(((valuation.multiplesFairValue - stock.price) / stock.price) * 100).toFixed(1)}%
              </span>
            </div>
            <p className="text-[10px] text-slate-500 mt-2 line-clamp-2">
              Normalized P/E blended with industry median multiples.
            </p>
          </div>
        </div>
      </div>

      {/* Interactive Scenario Tuning Sliders */}
      <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sliders className="w-4 h-4 text-cyan-400" />
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">
              Sensitivity & Stress-Test Simulator
            </h4>
          </div>
          <span className="text-[11px] text-slate-400">
            Adjust core assumptions to instantly test valuation fragility
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Growth Slider */}
          <div className="space-y-1.5 p-3 rounded-lg bg-slate-900/60 border border-slate-800/80">
            <div className="flex justify-between text-xs font-medium">
              <span className="text-slate-300">5Y FCF Growth</span>
              <span className="text-cyan-400 font-bold">{growthRate.toFixed(1)}%</span>
            </div>
            <input
              type="range"
              min="2"
              max="35"
              step="0.5"
              value={growthRate}
              onChange={(e) => handleSliderChange(setGrowthRate, parseFloat(e.target.value))}
              className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
            />
            <div className="flex justify-between text-[10px] text-slate-500">
              <span>2% (Stagnant)</span>
              <span>35% (Hyper)</span>
            </div>
          </div>

          {/* Discount Rate / WACC Slider */}
          <div className="space-y-1.5 p-3 rounded-lg bg-slate-900/60 border border-slate-800/80">
            <div className="flex justify-between text-xs font-medium">
              <span className="text-slate-300">Discount Rate (WACC)</span>
              <span className="text-cyan-400 font-bold">{discountRate.toFixed(1)}%</span>
            </div>
            <input
              type="range"
              min="8"
              max="16"
              step="0.25"
              value={discountRate}
              onChange={(e) => handleSliderChange(setDiscountRate, parseFloat(e.target.value))}
              className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
            />
            <div className="flex justify-between text-[10px] text-slate-500">
              <span>8% (Low Risk)</span>
              <span>16% (High Risk)</span>
            </div>
          </div>

          {/* Terminal Growth Slider */}
          <div className="space-y-1.5 p-3 rounded-lg bg-slate-900/60 border border-slate-800/80">
            <div className="flex justify-between text-xs font-medium">
              <span className="text-slate-300">Terminal Growth Rate</span>
              <span className="text-cyan-400 font-bold">{terminalGrowthRate.toFixed(1)}%</span>
            </div>
            <input
              type="range"
              min="1.5"
              max="6.0"
              step="0.25"
              value={terminalGrowthRate}
              onChange={(e) => handleSliderChange(setTerminalGrowthRate, parseFloat(e.target.value))}
              className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
            />
            <div className="flex justify-between text-[10px] text-slate-500">
              <span>1.5% (Muted)</span>
              <span>6.0% (GDP+)</span>
            </div>
          </div>

          {/* Margin Hurdle Slider */}
          <div className="space-y-1.5 p-3 rounded-lg bg-slate-900/60 border border-slate-800/80">
            <div className="flex justify-between text-xs font-medium">
              <span className="text-slate-300">Desired MoS Hurdle</span>
              <span className="text-amber-400 font-bold">{marginHurdle}%</span>
            </div>
            <input
              type="range"
              min="5"
              max="30"
              step="1"
              value={marginHurdle}
              onChange={(e) => setMarginHurdle(parseInt(e.target.value))}
              className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-400"
            />
            <div className="flex justify-between text-[10px] text-slate-500">
              <span>5% (Slim)</span>
              <span>30% (Deep Value)</span>
            </div>
          </div>
        </div>
      </div>

      {/* 5-Year Explicit Forecast & Present Value Projections Table */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="text-slate-400 font-semibold uppercase tracking-wider">
            5-Year DCF Cash Flow Projections & Present Value (PV)
          </span>
          <span className="text-[11px] text-slate-500">
            All values per share in {stock.currency}
          </span>
        </div>

        <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-950">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 bg-slate-900/40">
                <th className="py-2.5 px-3">Period</th>
                <th className="py-2.5 px-3">Projected EPS</th>
                <th className="py-2.5 px-3">Projected FCF</th>
                <th className="py-2.5 px-3">Discount Factor</th>
                <th className="py-2.5 px-3 text-right">Present Value (PV)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {valuation.projections.map((p) => (
                <tr key={p.year} className="hover:bg-slate-900/40 transition-colors">
                  <td className="py-2.5 px-3 font-semibold text-white">{p.year}</td>
                  <td className="py-2.5 px-3 text-slate-300">{stock.currency}{p.projectedEPS.toFixed(2)}</td>
                  <td className="py-2.5 px-3 text-cyan-400 font-medium">{stock.currency}{p.fcfPerShare.toFixed(2)}</td>
                  <td className="py-2.5 px-3 text-slate-400">{p.discountFactor.toFixed(3)}x</td>
                  <td className="py-2.5 px-3 text-right font-bold text-white">
                    {stock.currency}{p.presentValue.toFixed(2)}
                  </td>
                </tr>
              ))}
              <tr className="bg-slate-900/70 font-semibold text-slate-200">
                <td className="py-2.5 px-3 text-amber-300 font-bold">Terminal Value</td>
                <td className="py-2.5 px-3 text-slate-400">Beyond Year 5</td>
                <td className="py-2.5 px-3 text-slate-400">g = {terminalGrowthRate}%</td>
                <td className="py-2.5 px-3 text-slate-400">PV of Perpetuity</td>
                <td className="py-2.5 px-3 text-right text-amber-300 font-bold">
                  {stock.currency}{(valuation.pvTerminal !== undefined ? valuation.pvTerminal : (valuation.dcfValue - valuation.projections.reduce((sum, p) => sum + p.presentValue, 0))).toFixed(2)}
                </td>
              </tr>
              {/* Total DCF Fair Value Reconciliation Row */}
              <tr className="bg-cyan-950/60 border-t-2 border-cyan-700/80 font-bold text-white text-xs">
                <td className="py-3 px-3 text-cyan-300 flex items-center gap-1.5 font-mono">
                  <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Total DCF Value</span>
                </td>
                <td colSpan={3} className="py-3 px-3 text-slate-300 font-mono text-[11px]">
                  5-Yr Cash Flows ({stock.currency}{(valuation.fiveYearPvSum ?? valuation.projections.reduce((sum, p) => sum + p.presentValue, 0)).toFixed(2)}) + Terminal PV ({stock.currency}{(valuation.pvTerminal ?? (valuation.dcfValue - valuation.projections.reduce((sum, p) => sum + p.presentValue, 0))).toFixed(2)})
                </td>
                <td className="py-3 px-3 text-right text-emerald-400 text-sm font-mono font-black">
                  {stock.currency}{valuation.dcfValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Educational Use Disclaimer */}
      <EducationalDisclaimer
        variant="compact"
        actionContext="BUY_SELL_HOLD"
        customText="Educational-Use Disclaimer: Institutional DCF, Benjamin Graham, Peter Lynch, and Relative Multiples valuation models produce mathematical approximations based on user inputs and assumptions. Undervalued/Overvalued metrics are for educational modeling only and do not constitute financial advice."
      />
    </div>
  );
};
