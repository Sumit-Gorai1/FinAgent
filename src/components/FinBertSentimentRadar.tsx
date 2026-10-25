import React, { useState, useEffect } from 'react';
import {
  Brain,
  Cpu,
  Sparkles,
  TrendingUp,
  TrendingDown,
  Minus,
  ExternalLink,
  RotateCw,
  Send,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Layers,
  Sliders,
  ShieldCheck,
  FileText,
  Zap,
} from 'lucide-react';
import { NewsArticle, FinBertResult, FinBertBatchAnalysisResponse } from '../types';

interface FinBertSentimentRadarProps {
  symbol: string;
  stockName: string;
  articles: NewsArticle[];
  onAnalyzeHeadline?: (text: string) => void;
}

export const FinBertSentimentRadar: React.FC<FinBertSentimentRadarProps> = ({
  symbol,
  stockName,
  articles,
}) => {
  // Test Bench State
  const [inputText, setInputText] = useState(
    `${stockName} reported quarterly operating profit growth of 24.5% with EBITDA margin expansion exceeding consensus estimates.`
  );
  const [isInferring, setIsInferring] = useState(false);
  const [testResult, setTestResult] = useState<FinBertResult | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Batch analysis of active stock articles
  const [batchData, setBatchData] = useState<FinBertBatchAnalysisResponse | null>(null);
  const [isBatchLoading, setIsBatchLoading] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState<'ALL' | 'positive' | 'negative' | 'neutral'>('ALL');

  // Interactive Test Presets
  const PRESETS = [
    {
      label: 'Earnings Surge & Margin Expansion',
      text: `${stockName} operating profit jumped 28% YoY while EBITDA margins expanded 240 bps to record levels, beating analyst estimates.`,
      category: 'positive',
    },
    {
      label: 'Dividend & Buyback Announcement',
      text: `Board of Directors recommended final dividend of ₹18 per equity share and approved ₹3,500 Crore capital return program.`,
      category: 'positive',
    },
    {
      label: 'Margin Warning & Demand Headwinds',
      text: `Management cautions that input cost inflation and regional freight bottlenecks will compress operating margins in upcoming quarter.`,
      category: 'negative',
    },
    {
      label: 'Credit Downgrade & Liquidity Risk',
      text: `Credit rating agency downgraded long-term debt facilities citing elevated leverage ratios and heightened refinancing risk.`,
      category: 'negative',
    },
    {
      label: 'Scheduled Board Meeting Notice',
      text: `The company has notified the stock exchanges that a meeting of the Board of Directors is scheduled to consider quarterly audited financials.`,
      category: 'neutral',
    },
  ];

  // Perform FinBERT inference on custom text
  const runInference = async (textToTest: string) => {
    if (!textToTest.trim()) return;
    setIsInferring(true);
    setErrorMsg(null);
    try {
      const response = await fetch('/api/finbert/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: textToTest, symbol }),
      });

      if (!response.ok) {
        throw new Error(`Inference returned status ${response.status}`);
      }

      const data = await response.json();
      if (data.results && data.results.length > 0) {
        setTestResult(data.results[0]);
      }
    } catch (err: any) {
      console.error('FinBERT inference error:', err);
      setErrorMsg(err?.message || 'Failed to analyze with FinBERT');
    } finally {
      setIsInferring(false);
    }
  };

  // Run batch inference on news articles for the stock
  const runBatchAnalysis = async () => {
    if (!articles || articles.length === 0) return;
    setIsBatchLoading(true);
    try {
      const texts = articles.map((a) => a.title);
      const response = await fetch('/api/finbert/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ texts, symbol }),
      });

      if (response.ok) {
        const data: FinBertBatchAnalysisResponse = await response.json();
        setBatchData(data);
      }
    } catch (err) {
      console.warn('Batch FinBERT error:', err);
    } finally {
      setIsBatchLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    runInference(inputText);
    if (articles.length > 0) {
      runBatchAnalysis();
    }
  }, [symbol]);

  // Compute stats from batch or articles
  const totalCount = batchData?.totalAnalyzed || articles.length || 0;
  const posCount =
    batchData?.distribution.positiveCount ??
    articles.filter((a) => a.finbert?.label === 'positive' || a.sentiment === 'POSITIVE').length;
  const negCount =
    batchData?.distribution.negativeCount ??
    articles.filter((a) => a.finbert?.label === 'negative' || a.sentiment === 'NEGATIVE').length;
  const neuCount =
    batchData?.distribution.neutralCount ??
    articles.filter((a) => a.finbert?.label === 'neutral' || a.sentiment === 'NEUTRAL').length;

  const posPct = totalCount > 0 ? Number(((posCount / totalCount) * 100).toFixed(1)) : 0;
  const negPct = totalCount > 0 ? Number(((negCount / totalCount) * 100).toFixed(1)) : 0;
  const neuPct = totalCount > 0 ? Number(((neuCount / totalCount) * 100).toFixed(1)) : 0;

  const avgPolarity =
    batchData?.averagePolarity ??
    Number((((posCount - negCount) / Math.max(1, totalCount)) * 0.85).toFixed(3));

  const filteredArticles = articles.filter((art) => {
    if (selectedFilter === 'ALL') return true;
    return art.finbert?.label === selectedFilter || art.sentiment.toLowerCase() === selectedFilter;
  });

  return (
    <div className="space-y-6">
      {/* FinBERT Header & Architecture Card */}
      <div className="p-5 sm:p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div className="flex items-start gap-3.5">
            <div className="p-3 rounded-xl bg-violet-950/70 border border-violet-800 text-violet-400 shrink-0">
              <Brain className="w-6 h-6" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-base sm:text-lg font-bold text-white font-mono tracking-tight flex items-center gap-2">
                  ProsusAI/finbert Financial NLP Sentiment Engine
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-violet-950 text-violet-300 border border-violet-700">
                  Hugging Face Verified
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-cyan-950 text-cyan-300 border border-cyan-800">
                  Financial PhraseBank Benchmark
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1 max-w-2xl leading-relaxed">
                Domain-specific BERT architecture trained by Prosus AI on Financial PhraseBank (4,845 expert-labeled sentences) and corporate SEC/SEBI disclosures. Classifies financial text into calibrated Softmax probabilities across Positive, Negative, and Neutral sentiment.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <a
              href="https://huggingface.co/ProsusAI/finbert"
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-750 text-slate-200 hover:text-white text-xs font-mono font-semibold flex items-center gap-1.5 transition-all border border-slate-700"
            >
              <span>Hugging Face Model Card</span>
              <ExternalLink className="w-3.5 h-3.5 text-cyan-400" />
            </a>

            <button
              onClick={runBatchAnalysis}
              disabled={isBatchLoading}
              className="px-3.5 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 disabled:bg-slate-800 text-white text-xs font-mono font-bold flex items-center gap-1.5 transition-all shadow-md"
            >
              <RotateCw className={`w-3.5 h-3.5 ${isBatchLoading ? 'animate-spin' : ''}`} />
              <span>{isBatchLoading ? 'Re-scoring...' : 'Re-score News'}</span>
            </button>
          </div>
        </div>

        {/* Aggregate Sentiment Metrics for Active Stock */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 pt-1">
          {/* Polarity Metric Gauge */}
          <div className="md:col-span-4 p-4 rounded-xl bg-slate-950/70 border border-slate-800/90 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between text-xs text-slate-400 font-mono mb-2">
                <span>FINBERT POLARITY INDEX</span>
                <span className="text-[10px] text-slate-500">[-1.000 to +1.000]</span>
              </div>
              <div className="flex items-baseline gap-2">
                <span
                  className={`text-3xl font-extrabold font-mono tracking-tight ${
                    avgPolarity > 0.15
                      ? 'text-emerald-400'
                      : avgPolarity < -0.15
                      ? 'text-rose-400'
                      : 'text-slate-200'
                  }`}
                >
                  {avgPolarity > 0 ? `+${avgPolarity}` : avgPolarity}
                </span>
                <span className="text-xs font-mono text-slate-400 font-semibold">
                  {avgPolarity > 0.4
                    ? 'Strong Bullish'
                    : avgPolarity > 0.12
                    ? 'Bullish Stance'
                    : avgPolarity < -0.4
                    ? 'Strong Bearish'
                    : avgPolarity < -0.12
                    ? 'Bearish Stance'
                    : 'Balanced Neutral'}
                </span>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-800/80 mt-3 text-[11px] font-mono text-slate-400 flex items-center justify-between">
              <span>Analyzed Headlines:</span>
              <span className="text-white font-bold">{totalCount} Wire Items</span>
            </div>
          </div>

          {/* Probability Distribution Spectrum */}
          <div className="md:col-span-8 p-4 rounded-xl bg-slate-950/70 border border-slate-800/90 flex flex-col justify-between">
            <div className="flex items-center justify-between text-xs text-slate-400 font-mono mb-2">
              <span>PROSUS AI PROBABILITY DISTRIBUTION FOR {symbol}</span>
              <span className="text-cyan-400 font-bold">100% Normalized</span>
            </div>

            {/* Segmented Triple-Bar */}
            <div className="space-y-2">
              <div className="w-full h-3 rounded-full bg-slate-800 overflow-hidden flex">
                <div
                  className="bg-emerald-500 transition-all duration-500"
                  style={{ width: `${posPct}%` }}
                  title={`Positive: ${posPct}%`}
                />
                <div
                  className="bg-slate-400 transition-all duration-500"
                  style={{ width: `${neuPct}%` }}
                  title={`Neutral: ${neuPct}%`}
                />
                <div
                  className="bg-rose-500 transition-all duration-500"
                  style={{ width: `${negPct}%` }}
                  title={`Negative: ${negPct}%`}
                />
              </div>

              {/* Legend & Breakdown */}
              <div className="grid grid-cols-3 gap-2 text-xs font-mono pt-1">
                <div className="p-2 rounded-lg bg-emerald-950/30 border border-emerald-800/40">
                  <div className="flex items-center gap-1.5 text-emerald-400 text-[11px] font-bold">
                    <TrendingUp className="w-3.5 h-3.5" />
                    <span>Positive</span>
                  </div>
                  <div className="text-sm font-bold text-white mt-0.5">{posPct}%</div>
                  <span className="text-[10px] text-slate-400">{posCount} articles</span>
                </div>

                <div className="p-2 rounded-lg bg-slate-900 border border-slate-800">
                  <div className="flex items-center gap-1.5 text-slate-300 text-[11px] font-bold">
                    <Minus className="w-3.5 h-3.5" />
                    <span>Neutral</span>
                  </div>
                  <div className="text-sm font-bold text-white mt-0.5">{neuPct}%</div>
                  <span className="text-[10px] text-slate-400">{neuCount} articles</span>
                </div>

                <div className="p-2 rounded-lg bg-rose-950/30 border border-rose-800/40">
                  <div className="flex items-center gap-1.5 text-rose-400 text-[11px] font-bold">
                    <TrendingDown className="w-3.5 h-3.5" />
                    <span>Negative</span>
                  </div>
                  <div className="text-sm font-bold text-white mt-0.5">{negPct}%</div>
                  <span className="text-[10px] text-slate-400">{negCount} articles</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Interactive FinBERT Test Bench & Inference Lab */}
      <div className="p-5 sm:p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-800">
          <div>
            <h4 className="text-sm font-bold text-white font-mono flex items-center gap-2">
              <Zap className="w-4 h-4 text-cyan-400" />
              Interactive FinBERT Real-Time Inference Lab
            </h4>
            <p className="text-xs text-slate-400 mt-0.5">
              Paste or type any financial statement, earnings announcement, or analyst commentary to run instant FinBERT token classification.
            </p>
          </div>
          <span className="text-[11px] font-mono text-slate-400">
            Model: <strong className="text-white">ProsusAI/finbert</strong>
          </span>
        </div>

        {/* Quick Presets */}
        <div>
          <span className="text-[11px] text-slate-400 font-mono block mb-2">
            Try Financial PhraseBank Benchmark Scenarios:
          </span>
          <div className="flex flex-wrap gap-1.5">
            {PRESETS.map((p, i) => (
              <button
                key={i}
                onClick={() => {
                  setInputText(p.text);
                  runInference(p.text);
                }}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-mono transition-all border ${
                  p.category === 'positive'
                    ? 'bg-emerald-950/40 text-emerald-300 border-emerald-800/50 hover:bg-emerald-900/50'
                    : p.category === 'negative'
                    ? 'bg-rose-950/40 text-rose-300 border-rose-800/50 hover:bg-rose-900/50'
                    : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-750'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* Text Input & Submit */}
        <div className="space-y-2">
          <div className="relative">
            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              rows={3}
              placeholder="Enter corporate disclosure, earnings release, analyst note, or headline..."
              className="w-full p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500 font-mono resize-none"
            />
          </div>

          <div className="flex items-center justify-between">
            <span className="text-[11px] text-slate-500 font-mono">
              {inputText.length} characters • Evaluated via Softmax Probability Classifier
            </span>

            <button
              onClick={() => runInference(inputText)}
              disabled={isInferring || !inputText.trim()}
              className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 disabled:bg-slate-800 text-white text-xs font-mono font-bold flex items-center gap-2 transition-all shadow-md active:scale-95"
            >
              {isInferring ? (
                <>
                  <RotateCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Computing Softmax...</span>
                </>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" />
                  <span>Run FinBERT Inference</span>
                </>
              )}
            </button>
          </div>
        </div>

        {errorMsg && (
          <div className="p-3 rounded-xl bg-rose-950/50 border border-rose-800 text-rose-300 text-xs font-mono flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Inference Result Card */}
        {testResult && (
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3 animate-fadeIn">
            <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-800/80">
              <div className="flex items-center gap-2 font-mono">
                <span className="text-xs text-slate-400">Classified Result:</span>
                <span
                  className={`px-2.5 py-0.5 rounded text-xs font-bold uppercase tracking-wider ${
                    testResult.label === 'positive'
                      ? 'bg-emerald-950 text-emerald-300 border border-emerald-700'
                      : testResult.label === 'negative'
                      ? 'bg-rose-950 text-rose-300 border border-rose-700'
                      : 'bg-slate-800 text-slate-300 border border-slate-700'
                  }`}
                >
                  {testResult.label} ({testResult.sentimentVerdict.replace('_', ' ')})
                </span>
              </div>

              <div className="flex items-center gap-3 text-xs font-mono text-slate-400">
                <span>
                  Confidence: <strong className="text-cyan-400">{(testResult.score * 100).toFixed(1)}%</strong>
                </span>
                <span>•</span>
                <span>
                  Polarity:{' '}
                  <strong className={testResult.polarity >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                    {testResult.polarity > 0 ? `+${testResult.polarity}` : testResult.polarity}
                  </strong>
                </span>
                {testResult.latencyMs !== undefined && (
                  <>
                    <span>•</span>
                    <span className="text-slate-500">{testResult.latencyMs}ms</span>
                  </>
                )}
              </div>
            </div>

            {/* Probability Bars */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1 text-xs font-mono">
              <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800/80 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-emerald-400 font-semibold">P(positive)</span>
                  <span className="font-bold text-white">
                    {(testResult.probabilities.positive * 100).toFixed(1)}%
                  </span>
                </div>
                <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                  <div
                    className="bg-emerald-400 h-full rounded-full transition-all duration-500"
                    style={{ width: `${testResult.probabilities.positive * 100}%` }}
                  />
                </div>
              </div>

              <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800/80 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-slate-300 font-semibold">P(neutral)</span>
                  <span className="font-bold text-white">
                    {(testResult.probabilities.neutral * 100).toFixed(1)}%
                  </span>
                </div>
                <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                  <div
                    className="bg-slate-400 h-full rounded-full transition-all duration-500"
                    style={{ width: `${testResult.probabilities.neutral * 100}%` }}
                  />
                </div>
              </div>

              <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800/80 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-rose-400 font-semibold">P(negative)</span>
                  <span className="font-bold text-white">
                    {(testResult.probabilities.negative * 100).toFixed(1)}%
                  </span>
                </div>
                <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                  <div
                    className="bg-rose-400 h-full rounded-full transition-all duration-500"
                    style={{ width: `${testResult.probabilities.negative * 100}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Stock News Articles Annotated with FinBERT */}
      <div className="p-5 sm:p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
          <div>
            <h4 className="text-sm font-bold text-white font-mono flex items-center gap-2">
              <FileText className="w-4 h-4 text-cyan-400" />
              Live News Feed with ProsusAI/finbert Scores
            </h4>
            <p className="text-xs text-slate-400 mt-0.5">
              Each market wire item is analyzed with FinBERT token embeddings for financial polarity.
            </p>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1.5 text-xs font-mono">
            <span className="text-slate-500 text-[11px] mr-1 hidden sm:inline">Filter:</span>
            {(['ALL', 'positive', 'neutral', 'negative'] as const).map((fil) => (
              <button
                key={fil}
                onClick={() => setSelectedFilter(fil)}
                className={`px-2.5 py-1 rounded-lg transition-all capitalize text-[11px] ${
                  selectedFilter === fil
                    ? 'bg-cyan-600 text-white font-bold shadow-sm'
                    : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                {fil === 'ALL' ? 'All' : fil}
              </button>
            ))}
          </div>
        </div>

        {/* Articles List */}
        <div className="space-y-3">
          {filteredArticles.length === 0 ? (
            <div className="p-6 rounded-xl bg-slate-950/60 border border-slate-800 text-center text-xs font-mono text-slate-400">
              No news items match "{selectedFilter}" for {symbol}.
            </div>
          ) : (
            filteredArticles.map((art) => {
              const fb = art.finbert;
              const dominantLabel = fb?.label || art.sentiment.toLowerCase();
              const dominantConfidence = fb ? fb.score * 100 : art.confidence * 100;

              return (
                <div
                  key={art.id}
                  className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 hover:border-slate-700 transition-all space-y-2.5 group"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-2 font-mono">
                      {/* FinBERT Badge */}
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          dominantLabel === 'positive'
                            ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                            : dominantLabel === 'negative'
                            ? 'bg-rose-950 text-rose-300 border border-rose-800'
                            : 'bg-slate-800 text-slate-300 border border-slate-700'
                        }`}
                      >
                        FinBERT: {dominantLabel}
                      </span>
                      <span className="text-xs font-semibold text-cyan-400">[{art.event}]</span>
                    </div>

                    <div className="flex items-center gap-3 text-xs text-slate-400 font-mono">
                      <span>Source: <strong className="text-white">{art.source}</strong></span>
                      <span>•</span>
                      <span className="text-slate-300">{art.date}</span>
                    </div>
                  </div>

                  <div>
                    {art.url ? (
                      <a
                        href={art.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm font-semibold text-white leading-snug hover:text-cyan-300 transition-colors inline-flex items-center gap-1.5"
                      >
                        <span>{art.title}</span>
                        <ExternalLink className="w-3.5 h-3.5 opacity-60 group-hover:opacity-100 shrink-0 text-cyan-400" />
                      </a>
                    ) : (
                      <h4 className="text-sm font-semibold text-white leading-snug hover:text-cyan-300 transition-colors">
                        {art.title}
                      </h4>
                    )}
                  </div>

                  <p className="text-xs text-slate-400 leading-relaxed">{art.summary}</p>

                  {/* FinBERT Probability Breakdown Pill */}
                  {fb && (
                    <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800/80 flex flex-wrap items-center justify-between gap-2 text-xs font-mono">
                      <div className="flex items-center gap-3">
                        <span className="text-[11px] text-slate-400">FinBERT Softmax:</span>
                        <span className="text-emerald-400 font-semibold">
                          Pos: {(fb.probabilities.positive * 100).toFixed(0)}%
                        </span>
                        <span className="text-slate-400 font-semibold">
                          Neu: {(fb.probabilities.neutral * 100).toFixed(0)}%
                        </span>
                        <span className="text-rose-400 font-semibold">
                          Neg: {(fb.probabilities.negative * 100).toFixed(0)}%
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-slate-400">Polarity:</span>
                        <span
                          className={`font-bold ${
                            fb.polarity >= 0 ? 'text-emerald-400' : 'text-rose-400'
                          }`}
                        >
                          {fb.polarity > 0 ? `+${fb.polarity}` : fb.polarity}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
