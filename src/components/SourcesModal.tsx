import React, { useState } from 'react';
import {
  X,
  Database,
  Globe2,
  TrendingUp,
  Coins,
  Cpu,
  Layers,
  Sparkles,
  FileText,
  ShieldAlert,
  CheckCircle2,
  Copy,
  ExternalLink,
  BookOpen,
  Scale,
  Clock,
  Code2,
  Brain,
} from 'lucide-react';

interface SourcesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SourcesModal: React.FC<SourcesModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'exchanges' | 'etfs' | 'models' | 'ai' | 'finbert' | 'typography' | 'persistence'>('exchanges');
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleCopySummary = () => {
    const text = `FINAGENT Data & Model Sources:
- Exchanges: NSE & BSE (2,570+ Equities, 6-digit BSE Scrip mapping, Level-2 Depth, Real-time Arbitrage)
- ETFs: 60+ Indian & Global ETFs (iNAV, tracking error, expense ratio, dynamic capital outlay)
- NLP Sentiment Model: ProsusAI/finbert on Hugging Face (https://huggingface.co/ProsusAI/finbert) trained on Financial PhraseBank (86% accuracy, 0.88 F1)
- Multi-Agent AI Engine: Google Gemini 2.5 API (@google/genai) across 10-Agent Autonomous Swarm
- Valuation: Two-Stage DCF, Graham Formula, Piotroski F-Score (9 criteria), Altman Z-Score
- Freshness: Strict <24h news wire filter (stale news discarded)
- Typography: Calibri with 6 weight grades & financial color grade hierarchy
- Persistence: LocalStorage for Watchlist (Add/Remove all stocks/ETFs), Portfolio & Paper Trading`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-4xl max-h-[90vh] bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden text-slate-100">
        {/* Header */}
        <div className="p-4 sm:p-6 border-b border-slate-800/80 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-cyan-950/80 border border-cyan-800/70 text-cyan-400">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-white tracking-tight">
                  FINAGENT Official Sources & Architecture Registry
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-cyan-950 text-cyan-300 border border-cyan-800">
                  SOURCES.md
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Verified Exchange Feeds, 60+ ETF Trackers, AI Models, Quantitative Formulas & Storage Schemas
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopySummary}
              className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-white text-xs font-mono flex items-center gap-1.5 transition-colors border border-slate-700"
              title="Copy Sources Summary"
            >
              {copied ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied' : 'Copy Summary'}</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-1 px-4 sm:px-6 pt-3 border-b border-slate-800/80 bg-slate-950/30 overflow-x-auto scrollbar-none">
          <button
            onClick={() => setActiveTab('exchanges')}
            className={`px-3 py-2 text-xs font-medium border-b-2 transition-all flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'exchanges'
                ? 'border-cyan-400 text-cyan-300 font-bold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Globe2 className="w-3.5 h-3.5" />
            NSE & BSE Feeds
          </button>
          <button
            onClick={() => setActiveTab('etfs')}
            className={`px-3 py-2 text-xs font-medium border-b-2 transition-all flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'etfs'
                ? 'border-amber-400 text-amber-300 font-bold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Coins className="w-3.5 h-3.5" />
            60+ ETFs Pipeline
          </button>
          <button
            onClick={() => setActiveTab('models')}
            className={`px-3 py-2 text-xs font-medium border-b-2 transition-all flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'models'
                ? 'border-emerald-400 text-emerald-300 font-bold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Scale className="w-3.5 h-3.5" />
            Valuation Formulas
          </button>
          <button
            onClick={() => setActiveTab('ai')}
            className={`px-3 py-2 text-xs font-medium border-b-2 transition-all flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'ai'
                ? 'border-violet-400 text-violet-300 font-bold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Cpu className="w-3.5 h-3.5" />
            10-Agent AI & News
          </button>
          <button
            onClick={() => setActiveTab('finbert')}
            className={`px-3 py-2 text-xs font-medium border-b-2 transition-all flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'finbert'
                ? 'border-violet-400 text-violet-300 font-bold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Brain className="w-3.5 h-3.5" />
            FinBERT NLP Model
          </button>
          <button
            onClick={() => setActiveTab('typography')}
            className={`px-3 py-2 text-xs font-medium border-b-2 transition-all flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'typography'
                ? 'border-blue-400 text-blue-300 font-bold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Code2 className="w-3.5 h-3.5" />
            Calibri & Grades
          </button>
          <button
            onClick={() => setActiveTab('persistence')}
            className={`px-3 py-2 text-xs font-medium border-b-2 transition-all flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'persistence'
                ? 'border-indigo-400 text-indigo-300 font-bold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            Watchlist & Storage
          </button>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5 text-xs text-slate-300 font-mono">
          {/* Exchanges Tab */}
          {activeTab === 'exchanges' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white text-sm flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse" />
                    National Stock Exchange of India (NSE)
                  </span>
                  <span className="text-[11px] text-cyan-400">2,570+ Listed Scrips</span>
                </div>
                <p className="text-slate-400">
                  Primary liquidity venue for real-time last-traded price (LTP), Level-2 5-depth orderbook, volume-weighted average price (VWAP), and market indices (NIFTY 50, NIFTY BANK, NIFTY IT, India VIX).
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 text-[11px]">
                  <div className="p-2 rounded-lg bg-slate-900 border border-slate-800">
                    <span className="text-slate-500 block">Protocol</span>
                    <span className="text-slate-200 font-semibold">REST + WebSocket Bus</span>
                  </div>
                  <div className="p-2 rounded-lg bg-slate-900 border border-slate-800">
                    <span className="text-slate-500 block">Polling Heartbeat</span>
                    <span className="text-slate-200 font-semibold">30s / 1m / 5m Selectable</span>
                  </div>
                  <div className="p-2 rounded-lg bg-slate-900 border border-slate-800">
                    <span className="text-slate-500 block">Depth Resolution</span>
                    <span className="text-slate-200 font-semibold">5-Level Bid/Ask Book</span>
                  </div>
                  <div className="p-2 rounded-lg bg-slate-900 border border-slate-800">
                    <span className="text-slate-500 block">Endpoints</span>
                    <span className="text-slate-200 font-semibold">/api/prices, /api/pipeline</span>
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white text-sm flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                    Bombay Stock Exchange (BSE)
                  </span>
                  <span className="text-[11px] text-emerald-400">6-Digit Scrip Registry</span>
                </div>
                <p className="text-slate-400">
                  Secondary venue providing dual-exchange quotes and 6-digit numeric scrip code resolution. Automatically evaluates inter-exchange arbitrage ($\Delta P = P_{'{NSE}'} - P_{'{BSE}'}$).
                </p>
                <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800/80 text-[11px] grid grid-cols-2 sm:grid-cols-3 gap-2">
                  <div>• RELIANCE: <span className="text-cyan-300">500325</span></div>
                  <div>• TCS: <span className="text-cyan-300">532540</span></div>
                  <div>• HDFCBANK: <span className="text-cyan-300">500180</span></div>
                  <div>• INFY: <span className="text-cyan-300">500209</span></div>
                  <div>• ICICIBANK: <span className="text-cyan-300">532174</span></div>
                  <div>• TATAMOTORS: <span className="text-cyan-300">500570</span></div>
                </div>
              </div>
            </div>
          )}

          {/* ETFs Tab */}
          {activeTab === 'etfs' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2">
                <span className="font-bold text-white text-sm flex items-center gap-2">
                  <Coins className="w-4 h-4 text-amber-400" />
                  Exchange Traded Funds (ETFs) Pipeline & Valuation
                </span>
                <p className="text-slate-400">
                  Comprehensive coverage of 60+ Indian and International ETFs across Equity Indices, Sectoral Baskets, Gold/Silver Commodities, Debt/Liquid instruments, and Global assets (Nasdaq-100, NYSE FANG+).
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 space-y-1">
                    <span className="text-amber-300 font-semibold block">Key Tracked ETF Tickers</span>
                    <p className="text-[11px] text-slate-400">
                      NIFTYBEES, BANKBEES, GOLDBEES, SILVERBEES, ITBEES, JUNIORBEES, MID150BEES, CPSEETF, MON100, MAFANG, LIQUIDBEES, BHARATBOND.
                    </p>
                  </div>
                  <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 space-y-1">
                    <span className="text-cyan-300 font-semibold block">Metrics & Analytics</span>
                    <p className="text-[11px] text-slate-400">
                      Live Indicative NAV (iNAV), Tracking Error (&lt; 0.08%), Total Expense Ratio (0.04%–0.49%), 30-Day Average Volume, and Dynamic Capital Outlay Calculator.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Models Tab */}
          {activeTab === 'models' && (
            <div className="space-y-3">
              <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800">
                <span className="font-bold text-emerald-300 block mb-1">1. Two-Stage Discounted Cash Flow (DCF)</span>
                <p className="text-[11px] text-slate-400 mb-2">
                  Computes enterprise intrinsic value by discounting projected Free Cash Flow to Firm (FCFF) at the Weighted Average Cost of Capital (WACC), plus perpetual terminal value capped at Indian GDP potential (4.5%–7.0%).
                </p>
                <code className="text-[11px] text-cyan-300 block bg-slate-900 p-2 rounded">
                  V = Σ [FCFF_t / (1 + WACC)^t] + [FCFF_n * (1 + g) / (WACC - g)] / (1 + WACC)^n
                </code>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800">
                <span className="font-bold text-amber-300 block mb-1">2. Benjamin Graham Intrinsic Formula</span>
                <p className="text-[11px] text-slate-400 mb-2">
                  Conservative quantitative benchmark combining earnings power and tangible balance sheet book value.
                </p>
                <code className="text-[11px] text-cyan-300 block bg-slate-900 p-2 rounded">
                  V_Graham = √(22.5 * EPS * BVPS)
                </code>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800">
                <span className="font-bold text-violet-300 block mb-1">3. Piotroski F-Score (9 Accounting Criteria)</span>
                <p className="text-[11px] text-slate-400">
                  Scores financial health across Profitability (Net Income, Operating Cash Flow, ROA, Accruals), Leverage/Liquidity (D/E, Current Ratio, Shares Outstanding), and Operating Efficiency (Gross Margin, Asset Turnover).
                </p>
              </div>
            </div>
          )}

          {/* AI & News Tab */}
          {activeTab === 'ai' && (
            <div className="space-y-3">
              <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2">
                <span className="font-bold text-white text-sm flex items-center gap-2">
                  <Cpu className="w-4 h-4 text-violet-400" />
                  10-Agent Autonomous Swarm & Gemini API
                </span>
                <p className="text-slate-400">
                  Integrated with Google Gemini 2.5 API using the modern @google/genai TypeScript SDK. Models are segregated by complexity: Gemini 2.5 Flash for high-frequency extraction, Gemini 2.5 Pro for adversarial bull/bear synthesis.
                </p>
                <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 text-[11px] text-slate-300 space-y-1">
                  <div>• Agent 1: Master Orchestrator | Agent 2: Price & Depth Sentinel</div>
                  <div>• Agent 3: Technical Quant | Agent 4: Fundamental Forensic Auditor</div>
                  <div>• Agent 5: Fresh News Wire (&lt;24h) | Agent 6: Macro Transmission</div>
                  <div>• Agent 7: Bull Thesis Advocate | Agent 8: Bear Risk Inquisitor</div>
                  <div>• Agent 9: Investment Committee | Agent 10: Autonomous Rebalancer</div>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2">
                <span className="font-bold text-rose-300 text-sm flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  Strictly Fresh Market News Wire Policy (&lt; 24h)
                </span>
                <p className="text-slate-400 text-[11px]">
                  All news items and corporate disclosures are strictly filtered for recency. News older than 24 hours is automatically discarded to prevent stale data contamination.
                </p>
              </div>
            </div>
          )}

          {/* FinBERT NLP Model Tab */}
          {activeTab === 'finbert' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white text-sm flex items-center gap-2">
                    <Brain className="w-4 h-4 text-violet-400" />
                    ProsusAI/finbert Financial NLP Sentiment Engine
                  </span>
                  <a
                    href="https://huggingface.co/ProsusAI/finbert"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[11px] text-cyan-400 hover:text-cyan-300 flex items-center gap-1 font-semibold"
                  >
                    <span>Hugging Face Hub</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
                <p className="text-slate-400">
                  FinBERT is a domain-specific BERT language model fine-tuned by Prosus AI for classifying financial sentiment across three granular classes: <span className="text-emerald-400 font-bold">positive</span>, <span className="text-slate-300 font-bold">neutral</span>, and <span className="text-rose-400 font-bold">negative</span>.
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-[11px]">
                  <div className="p-2 rounded-lg bg-slate-900 border border-slate-800">
                    <span className="text-slate-500 block">Base Architecture</span>
                    <span className="text-slate-200 font-semibold">BERT-base-uncased</span>
                  </div>
                  <div className="p-2 rounded-lg bg-slate-900 border border-slate-800">
                    <span className="text-slate-500 block">Benchmark Corpus</span>
                    <span className="text-slate-200 font-semibold">Financial PhraseBank</span>
                  </div>
                  <div className="p-2 rounded-lg bg-slate-900 border border-slate-800">
                    <span className="text-slate-500 block">Accuracy / F1</span>
                    <span className="text-emerald-400 font-semibold">86% / 0.88 Macro F1</span>
                  </div>
                  <div className="p-2 rounded-lg bg-slate-900 border border-slate-800">
                    <span className="text-slate-500 block">Output Space</span>
                    <span className="text-cyan-300 font-semibold">3-Class Softmax</span>
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2">
                <span className="font-bold text-cyan-300 text-xs block">Mathematical Polarity Formulation:</span>
                <p className="text-[11px] text-slate-400">
                  Every disclosure or headline is passed through the FinBERT token embeddings and softmax layer. The bounded Polarity Index is computed as:
                </p>
                <code className="text-[11px] text-cyan-300 block bg-slate-900 p-2.5 rounded font-mono">
                  Polarity = P(positive) - P(negative) ∈ [-1.000, +1.000]
                </code>
                <p className="text-[11px] text-slate-400 pt-1">
                  • <strong className="text-emerald-400">&gt; +0.15:</strong> Bullish Market Stance | • <strong className="text-slate-300">-0.15 to +0.15:</strong> Neutral / Informational | • <strong className="text-rose-400">&lt; -0.15:</strong> Bearish Risk
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2 text-[11px]">
                <span className="font-bold text-white text-xs block">API Integration Contracts:</span>
                <div className="space-y-1.5 text-slate-300 font-mono">
                  <div>• <code className="text-cyan-300">POST /api/finbert/analyze</code>: Batch or single-text inference with probabilities and polarity.</div>
                  <div>• <code className="text-cyan-300">GET /api/finbert/model-info</code>: Model specification, training corpus metadata, and evaluation metrics.</div>
                  <div>• <code className="text-cyan-300">GET /api/live-market/news/:symbol</code>: Augmented with per-headline FinBERT probability distributions.</div>
                </div>
              </div>
            </div>
          )}

          {/* Typography & Grades Tab */}
          {activeTab === 'typography' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-3">
                <span className="font-bold text-white text-sm">
                  Calibri Universal Typographic Hierarchy & Optical Grades
                </span>
                <p className="text-slate-400">
                  The interface is strictly styled using Calibri with local fallback and web font Carlito (metric-identical). Every financial surface utilizes standardized weight and color grades:
                </p>

                {/* Weight Grades Showcase */}
                <div className="space-y-1 pt-1">
                  <span className="text-[11px] text-slate-400 font-bold">Typographic Weight Grades:</span>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-[11px]">
                    <div className="p-2 rounded bg-slate-900 border border-slate-800">
                      <span className="text-slate-400 block text-[10px]">.grade-light (300)</span>
                      <span className="font-light text-slate-200">RELIANCE ₹1,268.50</span>
                    </div>
                    <div className="p-2 rounded bg-slate-900 border border-slate-800">
                      <span className="text-slate-400 block text-[10px]">.grade-regular (400)</span>
                      <span className="font-normal text-slate-200">RELIANCE ₹1,268.50</span>
                    </div>
                    <div className="p-2 rounded bg-slate-900 border border-slate-800">
                      <span className="text-slate-400 block text-[10px]">.grade-medium (500)</span>
                      <span className="font-medium text-slate-200">RELIANCE ₹1,268.50</span>
                    </div>
                    <div className="p-2 rounded bg-slate-900 border border-slate-800">
                      <span className="text-slate-400 block text-[10px]">.grade-semibold (600)</span>
                      <span className="font-semibold text-slate-200">RELIANCE ₹1,268.50</span>
                    </div>
                    <div className="p-2 rounded bg-slate-900 border border-slate-800">
                      <span className="text-slate-400 block text-[10px]">.grade-bold (700)</span>
                      <span className="font-bold text-slate-200">RELIANCE ₹1,268.50</span>
                    </div>
                    <div className="p-2 rounded bg-slate-900 border border-slate-800">
                      <span className="text-slate-400 block text-[10px]">.grade-black (900)</span>
                      <span className="font-black text-slate-200">RELIANCE ₹1,268.50</span>
                    </div>
                  </div>
                </div>

                {/* Color Grades Showcase */}
                <div className="space-y-1 pt-2">
                  <span className="text-[11px] text-slate-400 font-bold">Financial Color Grades:</span>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
                    <div className="p-2 rounded bg-slate-900 border border-slate-800">
                      <span className="text-slate-400 block text-[10px]">.text-grade-hero</span>
                      <span className="text-grade-hero font-bold">White Bold Hero</span>
                    </div>
                    <div className="p-2 rounded bg-slate-900 border border-slate-800">
                      <span className="text-slate-400 block text-[10px]">.text-grade-bullish</span>
                      <span className="text-grade-bullish">+2.45% Bullish</span>
                    </div>
                    <div className="p-2 rounded bg-slate-900 border border-slate-800">
                      <span className="text-slate-400 block text-[10px]">.text-grade-bearish</span>
                      <span className="text-grade-bearish">-1.80% Bearish</span>
                    </div>
                    <div className="p-2 rounded bg-slate-900 border border-slate-800">
                      <span className="text-slate-400 block text-[10px]">.text-grade-cyan</span>
                      <span className="text-grade-cyan">Live Cyan Tick</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Persistence Tab */}
          {activeTab === 'persistence' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2">
                <span className="font-bold text-white text-sm flex items-center gap-2">
                  <Layers className="w-4 h-4 text-indigo-400" />
                  Dynamic Watchlist & Storage Architecture
                </span>
                <p className="text-slate-400">
                  The stock and ETF watchlist supports dynamic addition and removal across the application. All holdings, balances, and orders persist in the browser:
                </p>
                <div className="space-y-2 pt-2">
                  <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-between">
                    <div>
                      <code className="text-cyan-300 font-bold">finagent_watchlist</code>
                      <span className="text-slate-400 block text-[11px]">
                        Dynamic array of tracked stocks and ETFs with add/remove state
                      </span>
                    </div>
                    <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800 text-[10px]">
                      Add/Remove Enabled
                    </span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-between">
                    <div>
                      <code className="text-cyan-300 font-bold">finagent_portfolio_holdings</code>
                      <span className="text-slate-400 block text-[11px]">
                        Allocated portfolio positions with weights, shares, and purchase costs
                      </span>
                    </div>
                    <span className="px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800 text-[10px]">
                      Persistent
                    </span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-between">
                    <div>
                      <code className="text-cyan-300 font-bold">finagent_cash_balance</code>
                      <span className="text-slate-400 block text-[11px]">
                        Virtual cash ledger (e.g. ₹10,00,000 INR default)
                      </span>
                    </div>
                    <span className="px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800 text-[10px]">
                      Persistent
                    </span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-between">
                    <div>
                      <code className="text-cyan-300 font-bold">finagent_paper_orders</code>
                      <span className="text-slate-400 block text-[11px]">
                        Simulated execution order ledger with audit timestamps
                      </span>
                    </div>
                    <span className="px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800 text-[10px]">
                      Persistent
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 sm:p-4 border-t border-slate-800 bg-slate-950 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs font-mono text-slate-400">
          <div className="flex items-center gap-2">
            <span className="text-emerald-400 font-bold">✓ 100% Synchronized</span>
            <span>•</span>
            <span>Referenced in root /SOURCES.md</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-semibold transition-colors"
          >
            Close Registry
          </button>
        </div>
      </div>
    </div>
  );
};
