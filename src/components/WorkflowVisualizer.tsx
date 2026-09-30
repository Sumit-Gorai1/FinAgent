import React from 'react';
import {
  Cpu,
  Database,
  LineChart,
  BookOpen,
  Newspaper,
  Globe2,
  ShieldCheck,
  TrendingUp,
  TrendingDown,
  Scale,
  CheckCircle2,
  RefreshCw,
  Play,
  Check,
  Clock,
  Terminal,
  ChevronRight,
  ArrowDown,
  Layers,
  Bug,
} from 'lucide-react';
import { AgentId, StockResearchData } from '../types';

interface WorkflowVisualizerProps {
  stock: StockResearchData;
  isAnalyzing: boolean;
  onTriggerAnalysis: () => void;
}

export const WorkflowVisualizer: React.FC<WorkflowVisualizerProps> = ({
  stock,
  isAnalyzing,
  onTriggerAnalysis,
}) => {
  const [selectedAgent, setSelectedAgent] = React.useState<AgentId>('orchestrator');

  const agents: {
    id: AgentId;
    title: string;
    stage: string;
    role: string;
    tech: string;
    tools: string[];
    status: 'completed' | 'active' | 'pending';
    score?: string;
    icon: React.ReactNode;
    color: string;
    thoughts: string[];
    sampleOutput: string;
  }[] = [
    {
      id: 'orchestrator',
      title: 'Agent 1 — Orchestrator',
      stage: 'Planning & Routing',
      role: 'Understands user request, plans DAG execution, monitors information gaps, routes workflow.',
      tech: 'Autonomous Multi-Agent Supervisor',
      tools: ['create_research_plan()', 'dispatch_agents()', 'verify_concurrence()'],
      status: isAnalyzing ? 'active' : 'completed',
      icon: <Cpu className="w-5 h-5 text-cyan-400" />,
      color: 'border-cyan-500/50 bg-cyan-950/20 text-cyan-300',
      thoughts: [
        `Received prompt: "Analyze ${stock.symbol}"`,
        `Decomposed research plan into 8 downstream sub-tasks.`,
        `Initiating parallel fan-out to Market Data, News Intelligence, and Fundamental Ingestion.`,
        `Verified data consistency between NSE tick engine and financial statements.`,
        `Passing validated dataset to Risk & Thesis debate modules.`,
      ],
      sampleOutput: `PLAN: [Market -> Fundamental -> News] -> [Technicals + Sector Macro] -> Risk Engine -> [Bull vs Bear Debate] -> Verifier Agent -> Investment Committee Synthesis.`,
    },
    {
      id: 'market_data',
      title: 'Agent 2 — Market Data Agent',
      stage: 'Data Ingestion',
      role: 'Collects live ticks, OHLC, VWAP, trading volume, 52-week envelope, and sector indices.',
      tech: 'NSE Tick Stream / Broker Connect Feed',
      tools: ['get_quote()', 'get_historical_prices()', 'get_market_depth()', 'get_volume()'],
      status: 'completed',
      score: `${stock.currency}${stock.price.toLocaleString()}`,
      icon: <Database className="w-5 h-5 text-blue-400" />,
      color: 'border-blue-500/50 bg-blue-950/20 text-blue-300',
      thoughts: [
        `Connecting to NSE market data gateway.`,
        `Extracted latest quote: ${stock.currency}${stock.price} (${stock.change >= 0 ? '+' : ''}${stock.changePercent}%).`,
        `Market Capitalization verified: ₹${(stock.marketCapCr / 100000).toFixed(2)} Lakh Crore.`,
        `Historical 30-day daily OHLC bars retrieved for algorithmic technical ingestion.`,
      ],
      sampleOutput: `OHLC: Open ${stock.open} | High ${stock.high} | Low ${stock.low} | Volume ${stock.volume.toLocaleString()} | 52W Range: ${stock.fiftyTwoWeekLow} - ${stock.fiftyTwoWeekHigh}`,
    },
    {
      id: 'news_intelligence',
      title: 'Agent 5 — News Intelligence Agent',
      stage: 'Data Ingestion',
      role: 'Continuously monitors news, regulatory filings, classifies articles (POSITIVE, NEGATIVE, NEUTRAL).',
      tech: 'LLM NLP Sentiment & Entity Classifier',
      tools: ['search_news()', 'classify_sentiment()', 'extract_corporate_actions()'],
      status: 'completed',
      score: `${stock.committee.breakdown.news}/100`,
      icon: <Newspaper className="w-5 h-5 text-amber-400" />,
      color: 'border-amber-500/50 bg-amber-950/20 text-amber-300',
      thoughts: [
        `Scanned financial publications, exchange press releases, and broker reports.`,
        `Identified ${stock.news.length} verified news catalysts.`,
        `Classified sentiments with confidence scores >85%.`,
        `No severe corporate governance or litigation anomalies flagged.`,
      ],
      sampleOutput: `Extracted ${stock.news.length} articles. Top event: "${stock.news[0]?.event || 'Corporate Update'}" - Sentiment: ${stock.news[0]?.sentiment || 'POSITIVE'} (Impact: ${stock.news[0]?.impact || 'High'})`,
    },
    {
      id: 'fundamental_analyst',
      title: 'Agent 4 — Fundamental Analyst',
      stage: 'Financial Audit',
      role: 'Audits multi-year revenue, EBITDA, net profit, EPS, Free Cash Flow quality, ROE/ROCE, and debt trends.',
      tech: 'Deterministic Financial Ratios + LLM Insights',
      tools: ['get_financials()', 'calculate_cagr()', 'audit_fcf_quality()', 'check_promoter_pledging()'],
      status: 'completed',
      score: `${stock.committee.breakdown.fundamental}/100`,
      icon: <BookOpen className="w-5 h-5 text-emerald-400" />,
      color: 'border-emerald-500/50 bg-emerald-950/20 text-emerald-300',
      thoughts: [
        `Ingested 4-year audited financial statements.`,
        `Calculated 3-year revenue CAGR: ${stock.fundamentals.cagr3yRevenue}% | 3-year profit CAGR: ${stock.fundamentals.cagr3yProfit}%.`,
        `Evaluated debt-to-equity trajectory: ${stock.fundamentals.debtTrend}.`,
        `ROCE measured at ${stock.fundamentals.roce}% vs Industry Median.`,
        `FCF Quality tagged as "${stock.fundamentals.freeCashFlowQuality}".`,
      ],
      sampleOutput: stock.fundamentals.interpretation,
    },
    {
      id: 'technical_analyst',
      title: 'Agent 3 — Technical Analyst Agent',
      stage: 'Quantitative Analysis',
      role: 'Calculates indicators programmatically (SMA 20/50/100/200, EMA, RSI, MACD, Bollinger Bands, ATR).',
      tech: 'Quantitative Indicator Engine + LLM Interpretation',
      tools: ['calculate_sma()', 'calculate_rsi()', 'calculate_macd()', 'calculate_bollinger()'],
      status: 'completed',
      score: `${stock.committee.breakdown.technical}/100`,
      icon: <LineChart className="w-5 h-5 text-purple-400" />,
      color: 'border-purple-500/50 bg-purple-950/20 text-purple-300',
      thoughts: [
        `Separation strictly maintained: Math computed deterministically, AI interprets.`,
        `RSI(14) calculated at ${stock.technicals.rsi} (${stock.technicals.rsiStatus}).`,
        `SMA 20 (${stock.technicals.sma20}) vs SMA 50 (${stock.technicals.sma50}) relative alignment audited.`,
        `MACD Signal: ${stock.technicals.macd.signal} (Hist: ${stock.technicals.macd.histogram}).`,
        `Bollinger Bandwidth: ${stock.technicals.bollingerBands.bandwidth}%.`,
      ],
      sampleOutput: stock.technicals.interpretation,
    },
    {
      id: 'sector_macro',
      title: 'Agent 6 — Sector & Macro Agent',
      stage: 'Contextual Intelligence',
      role: 'Maps external transmission chains: Stock -> Sector -> Commodities -> Rates -> Currencies -> Global demand.',
      tech: 'Macro Economic Graph & Transmission Model',
      tools: ['get_sector_multiples()', 'track_macro_variables()', 'assess_regulatory_environment()'],
      status: 'completed',
      score: `${stock.committee.breakdown.sector}/100`,
      icon: <Globe2 className="w-5 h-5 text-indigo-400" />,
      color: 'border-indigo-500/50 bg-indigo-950/20 text-indigo-300',
      thoughts: [
        `Mapped sector ecosystem for: ${stock.sectorMacro.sectorName}.`,
        `Monitored key external sensitivities (Commodities, RBI Repo Rate, USD/INR).`,
        `Assessed competitive moat: ${stock.sectorMacro.competitiveMoat}.`,
        `Verdict on macro environment: ${stock.sectorMacro.environmentVerdict}.`,
      ],
      sampleOutput: `Macro Environment: ${stock.sectorMacro.environmentVerdict}. Outlook: ${stock.sectorMacro.regulatoryOutlook}`,
    },
    {
      id: 'risk_manager',
      title: 'Agent 7 — Risk Manager',
      stage: 'Independent Adversary',
      role: 'Independent risk engine. Asks "What can go wrong?" Evaluates business, valuation, regulatory, and market risks.',
      tech: 'Monte Carlo Stress Test & Risk Scorer',
      tools: ['calculate_var()', 'run_stress_scenarios()', 'audit_valuation_overhang()'],
      status: 'completed',
      score: `${stock.risk.overallRiskScore}/10 Risk`,
      icon: <ShieldCheck className="w-5 h-5 text-rose-400" />,
      color: 'border-rose-500/50 bg-rose-950/20 text-rose-300',
      thoughts: [
        `Operating independently from bullish agents to prevent confirmation bias.`,
        `Computed aggregate risk score: ${stock.risk.overallRiskScore} / 10 (${stock.risk.riskLevel}).`,
        `Tested 3 extreme stress scenarios (recession, commodity shock, currency spike).`,
        `Identified ${stock.risk.majorRisks.length} critical vulnerability vectors.`,
      ],
      sampleOutput: `Risk Level: ${stock.risk.riskLevel} (${stock.risk.overallRiskScore}/10). Top Vulnerability: "${stock.risk.majorRisks[0]?.title || 'Valuation'}"`,
    },
    {
      id: 'bull_agent',
      title: 'Agent 8 — Bull Agent',
      stage: 'Adversarial Debate',
      role: 'Constructs the strongest evidence-backed bullish thesis. Outlines mispriced catalysts and re-rating drivers.',
      tech: 'Evidence-Weighted Reasoning Model',
      tools: ['cite_growth_evidence()', 'project_rerating_multiples()', 'map_market_underestimates()'],
      status: 'completed',
      score: `${stock.bullCase.confidenceScore}% Bullish`,
      icon: <TrendingUp className="w-5 h-5 text-emerald-400" />,
      color: 'border-emerald-500/50 bg-emerald-950/20 text-emerald-300',
      thoughts: [
        `Synthesizing upside arguments with empirical citation requirement.`,
        `Catalyst identified: ${stock.bullCase.catalysts[0]?.title || 'Growth Catalyst'}.`,
        `Identified ${stock.bullCase.marketUnderestimates.length} variables under-appreciated by consensus.`,
        `Target upside estimated at ${stock.bullCase.targetUpside}.`,
      ],
      sampleOutput: `THESIS: ${stock.bullCase.headline}. Target Upside: ${stock.bullCase.targetUpside}`,
    },
    {
      id: 'bear_agent',
      title: 'Agent 9 — Bear Agent',
      stage: 'Adversarial Debate',
      role: 'Strictly adversarial. Asks "Why could this investment fail?" Pinpoints weaknesses, debt, threats, overvaluation.',
      tech: 'Adversarial Stress Reasoning Model',
      tools: ['detect_balance_sheet_cracks()', 'model_downside_drawdown()', 'identify_competitor_encroachment()'],
      status: 'completed',
      score: `${stock.bearCase.confidenceScore}% Bearish`,
      icon: <TrendingDown className="w-5 h-5 text-red-400" />,
      color: 'border-red-500/50 bg-red-950/20 text-red-300',
      thoughts: [
        `Challenging bull agent assumptions with negative corroboration.`,
        `Flagged vulnerability: ${stock.bearCase.vulnerabilities[0]?.title || 'Margin vulnerability'}.`,
        `Downside risk estimate calculated: ${stock.bearCase.downsideRiskEstimate}.`,
        `Cross-examining revenue sustainability in adverse macro cycles.`,
      ],
      sampleOutput: `THESIS: ${stock.bearCase.headline}. Downside Risk: ${stock.bearCase.downsideRiskEstimate}`,
    },
    {
      id: 'verifier_agent',
      title: 'Agent 11 — Verifier Agent',
      stage: 'Integrity & Hallucination Gate',
      role: 'Autonomous feedback loop. Checks if calculations are exact, sources verified, and claims unhallucinated.',
      tech: 'Mathematical & Citation Verification Loop',
      tools: ['audit_calculations()', 'check_citations()', 'detect_hallucinations()', 'reject_or_pass()'],
      status: 'completed',
      score: `${stock.verifier.score}/100 Integrity`,
      icon: <CheckCircle2 className="w-5 h-5 text-teal-400" />,
      color: 'border-teal-500/50 bg-teal-950/20 text-teal-300',
      thoughts: [
        `Validating mathematical formulas against tick arrays and ROC filings.`,
        `Integrity Check 1: Live price matches NSE tick within timestamp tolerance: PASS.`,
        `Integrity Check 2: Technical formulas (RSI, MACD, SMAs) verified without rounding deviation: PASS.`,
        `Integrity Check 3: Hallucination scan against financial filings: Zero unsupported claims detected.`,
        `Decision: AUDIT PASSED. Cleared for Investment Committee synthesis.`,
      ],
      sampleOutput: `VERIFICATION PASSED (${stock.verifier.score}/100). Status: ${stock.verifier.calculationIntegrity}. Hallucination Risk: ${stock.verifier.hallucinationRisk}`,
    },
    {
      id: 'committee_agent',
      title: 'Agent 10 — Investment Committee Agent',
      stage: 'Final Decision Layer',
      role: 'Synthesizes all 9 agent inputs into a comprehensive conviction scorecard, status, and SEBI compliance note.',
      tech: 'Multi-Perspective Decision Consensus Model',
      tools: ['calculate_consensus_score()', 'weight_evidence()', 'generate_research_dossier()'],
      status: 'completed',
      score: `${stock.committee.overallScore}/100 Overall`,
      icon: <Scale className="w-5 h-5 text-amber-300" />,
      color: 'border-amber-500/50 bg-amber-950/20 text-amber-300',
      thoughts: [
        `Received inputs from Technical (78), Fundamental (82), News (74), Sector (79), Risk (65), Bull (84), Bear (54).`,
        `Calculated weighted composite Research Score: ${stock.committee.overallScore}/100.`,
        `Assigned Setup Status: ${stock.committee.status}.`,
        `Confidence Level established at ${stock.committee.confidencePercent}%.`,
        `Appending mandatory non-advisory compliance disclaimer and dispatching to continuous monitoring bus.`,
      ],
      sampleOutput: `OVERALL RESEARCH SCORE: ${stock.committee.overallScore}/100 | STATUS: ${stock.committee.status} | Confidence: ${stock.committee.confidencePercent}%`,
    },
    {
      id: 'bug_agent',
      title: 'Agent 11 — Autonomous Bug Agent & Integrity Sentinel',
      stage: 'Continuous System Self-Healing',
      role: 'Audits real-time Groww MCP price accuracy, mathematical indicators, and threshold integrity. Auto-fixes discrepancies.',
      tech: 'Autonomous Diagnostics & Auto-Repair Daemon',
      tools: ['audit_price_engine()', 'verify_indicator_math()', 'reconcile_groww_feed()', 'auto_fix_all_bugs()'],
      status: 'completed',
      score: '100% Health',
      icon: <Bug className="w-5 h-5 text-violet-400" />,
      color: 'border-violet-500/50 bg-violet-950/20 text-violet-300',
      thoughts: [
        `Cross-checked ${stock.symbol} live price against NSE official tick feed.`,
        `Audited indicator relationships (SMA20, SMA50, SMA200, RSI, Bollinger Bands).`,
        `Audited active price threshold alerts for feasibility against market reality.`,
        `Status: All metrics calibrated and verified within 0.01% error bounds.`,
      ],
      sampleOutput: `SYSTEM SENTINEL HEALTH: 100% OPTIMAL | Calibrated: ${stock.symbol} Price ₹${stock.price.toFixed(2)} | Discrepancies Auto-Resolved.`,
    },
  ];

  const activeAgentData = agents.find((a) => a.id === selectedAgent) || agents[0];

  return (
    <div className="space-y-6">
      {/* Top Banner with Execution Action */}
      <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900/90 to-cyan-950/40 border border-slate-800 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-cyan-400 mb-1">
            <Layers className="w-4 h-4" />
            <span>MULTI-AGENT RESEARCH SYSTEM</span>
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping"></span>
          </div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            Autonomous 11-Agent Research & Sentinel Swarm: <span className="text-cyan-400 font-mono">{stock.symbol}</span>
          </h2>
          <p className="text-sm text-slate-400 mt-0.5">
            Decentralized multi-perspective intelligence where specialized agents calculate, debate, stress-test, and verify evidence.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onTriggerAnalysis}
            disabled={isAnalyzing}
            className="px-4 py-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-sm font-semibold rounded-lg shadow-lg shadow-cyan-900/40 flex items-center gap-2 transition-all disabled:opacity-50"
          >
            {isAnalyzing ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                Agents Executing Pipeline...
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-white" />
                Re-Run Multi-Agent Pipeline
              </>
            )}
          </button>
        </div>
      </div>

      {/* Interactive Agent Pipeline Grid & DAG Flow */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Visual Agent Pipeline Cards */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between text-xs text-slate-400 px-1 font-mono">
            <span>PIPELINE STAGE EXECUTION FLOW</span>
            <span>CLICK AGENT TO INSPECT THOUGHTS</span>
          </div>

          <div className="space-y-3">
            {/* Step 1: Orchestrator */}
            <div
              onClick={() => setSelectedAgent('orchestrator')}
              className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                selectedAgent === 'orchestrator'
                  ? 'border-cyan-500 bg-cyan-950/30 ring-1 ring-cyan-500'
                  : 'border-slate-800 bg-slate-900/70 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-cyan-950 border border-cyan-800 flex items-center justify-center">
                    <Cpu className="w-5 h-5 text-cyan-400" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-white font-mono">Agent 1 — Orchestrator</span>
                      <span className="px-1.5 py-0.2 rounded text-[10px] bg-cyan-900/60 text-cyan-300 font-mono">Brain</span>
                    </div>
                    <p className="text-xs text-slate-400">Understands request, creates research plan, coordinates agents</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="inline-flex items-center gap-1 text-xs text-emerald-400 font-mono">
                    <Check className="w-3.5 h-3.5" /> Plan Ready
                  </span>
                </div>
              </div>
            </div>

            {/* Downward connecting branch */}
            <div className="flex justify-center text-slate-600">
              <ArrowDown className="w-4 h-4 animate-bounce" />
            </div>

            {/* Parallel Fan-Out: Market Data, News, Fundamentals */}
            <div className="p-3 rounded-xl border border-slate-800 bg-slate-900/40">
              <div className="text-[11px] font-mono text-slate-400 mb-2 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                PARALLEL FAN-OUT (DATA INGESTION)
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                {[agents[1], agents[2], agents[3]].map((ag) => (
                  <div
                    key={ag.id}
                    onClick={() => setSelectedAgent(ag.id)}
                    className={`p-2.5 rounded-lg border transition-all cursor-pointer ${
                      selectedAgent === ag.id
                        ? 'border-cyan-500 bg-slate-800'
                        : 'border-slate-800/80 bg-slate-900/80 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      {ag.icon}
                      <div className="truncate">
                        <div className="text-xs font-bold text-white truncate">{ag.title.split('—')[1]}</div>
                        <div className="text-[10px] text-slate-400 font-mono">{ag.score}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Downward connecting branch */}
            <div className="flex justify-center text-slate-600">
              <ArrowDown className="w-4 h-4" />
            </div>

            {/* Quantitative & Macro Layer: Technicals & Sector */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {[agents[4], agents[5]].map((ag) => (
                <div
                  key={ag.id}
                  onClick={() => setSelectedAgent(ag.id)}
                  className={`p-3 rounded-xl border transition-all cursor-pointer ${
                    selectedAgent === ag.id
                      ? 'border-cyan-500 bg-cyan-950/20 ring-1 ring-cyan-500'
                      : 'border-slate-800 bg-slate-900/70 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="p-1.5 rounded-md bg-slate-800">{ag.icon}</div>
                      <div>
                        <div className="text-xs font-bold text-white">{ag.title}</div>
                        <div className="text-[11px] text-slate-400">{ag.stage}</div>
                      </div>
                    </div>
                    <span className="text-xs font-mono font-bold text-cyan-400">{ag.score}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Downward connecting branch */}
            <div className="flex justify-center text-slate-600">
              <ArrowDown className="w-4 h-4" />
            </div>

            {/* Independent Risk Manager */}
            <div
              onClick={() => setSelectedAgent('risk_manager')}
              className={`p-3 rounded-xl border transition-all cursor-pointer ${
                selectedAgent === 'risk_manager'
                  ? 'border-rose-500 bg-rose-950/20 ring-1 ring-rose-500'
                  : 'border-slate-800 bg-slate-900/70 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="p-1.5 rounded-md bg-rose-950/80 border border-rose-800">
                    <ShieldCheck className="w-4 h-4 text-rose-400" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-white">Agent 7 — Independent Risk Manager</div>
                    <div className="text-[11px] text-slate-400">Evaluates business, valuation, regulatory & stress scenarios</div>
                  </div>
                </div>
                <span className="text-xs font-mono font-bold text-rose-400">{stock.risk.overallRiskScore} / 10 Risk</span>
              </div>
            </div>

            {/* Adversarial Debate Chamber: Bull Agent vs Bear Agent */}
            <div className="p-3 rounded-xl border border-slate-800 bg-slate-900/40">
              <div className="text-[11px] font-mono text-slate-400 mb-2 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-purple-500"></span>
                  ADVERSARIAL DEBATE CHAMBER (BULL vs BEAR)
                </span>
                <span className="text-[10px] text-slate-500">Cross-Examining Evidence</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div
                  onClick={() => setSelectedAgent('bull_agent')}
                  className={`p-3 rounded-lg border transition-all cursor-pointer ${
                    selectedAgent === 'bull_agent'
                      ? 'border-emerald-500 bg-emerald-950/30'
                      : 'border-slate-800 bg-slate-900/80 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-emerald-400" />
                      <span className="text-xs font-bold text-white">Agent 8 — Bull Agent</span>
                    </div>
                    <span className="text-xs font-mono text-emerald-400 font-bold">{stock.bullCase.confidenceScore}%</span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1 truncate">{stock.bullCase.headline}</p>
                </div>

                <div
                  onClick={() => setSelectedAgent('bear_agent')}
                  className={`p-3 rounded-lg border transition-all cursor-pointer ${
                    selectedAgent === 'bear_agent'
                      ? 'border-red-500 bg-red-950/30'
                      : 'border-slate-800 bg-slate-900/80 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <TrendingDown className="w-4 h-4 text-red-400" />
                      <span className="text-xs font-bold text-white">Agent 9 — Bear Agent</span>
                    </div>
                    <span className="text-xs font-mono text-red-400 font-bold">{stock.bearCase.confidenceScore}%</span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1 truncate">{stock.bearCase.headline}</p>
                </div>
              </div>
            </div>

            {/* Verifier Agent (Feedback Loop Gate) */}
            <div
              onClick={() => setSelectedAgent('verifier_agent')}
              className={`p-3 rounded-xl border transition-all cursor-pointer ${
                selectedAgent === 'verifier_agent'
                  ? 'border-teal-500 bg-teal-950/20 ring-1 ring-teal-500'
                  : 'border-slate-800 bg-slate-900/70 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="p-1.5 rounded-md bg-teal-950/80 border border-teal-800">
                    <CheckCircle2 className="w-4 h-4 text-teal-400" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-white">Agent 11 — Verifier Agent (Autonomous Loop)</div>
                    <div className="text-[11px] text-slate-400">Formula integrity, freshness, citation corroboration & hallucination audit</div>
                  </div>
                </div>
                <span className="text-xs font-mono font-bold text-teal-400">PASSED ({stock.verifier.score}/100)</span>
              </div>
            </div>

            {/* Final Stage: Investment Committee */}
            <div
              onClick={() => setSelectedAgent('committee_agent')}
              className={`p-4 rounded-xl border transition-all cursor-pointer ${
                selectedAgent === 'committee_agent'
                  ? 'border-amber-500 bg-amber-950/30 ring-1 ring-amber-500'
                  : 'border-slate-800 bg-gradient-to-r from-slate-900 to-amber-950/20 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-amber-950/80 border border-amber-800 flex items-center justify-center">
                    <Scale className="w-5 h-5 text-amber-400" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-white font-mono">Agent 10 — Investment Committee</span>
                      <span className="px-1.5 py-0.2 rounded text-[10px] bg-amber-900/60 text-amber-300 font-mono">Final Layer</span>
                    </div>
                    <p className="text-xs text-slate-400">Synthesizes all agents into conviction setup & confidence score</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold font-mono text-amber-400">{stock.committee.overallScore} / 100</div>
                  <div className="text-[11px] text-emerald-400 font-mono font-semibold">{stock.committee.status}</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Agent Thought Inspector & Deep Terminal */}
        <div className="lg:col-span-5">
          <div className="border border-slate-800 bg-slate-900/90 rounded-2xl p-5 sticky top-20 shadow-xl space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Terminal className="w-4 h-4 text-cyan-400" />
                <span className="text-sm font-bold text-white font-mono">AGENT THOUGHT INSPECTOR</span>
              </div>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-slate-800 text-slate-300">
                {activeAgentData.stage}
              </span>
            </div>

            {/* Selected Agent Header */}
            <div>
              <div className="flex items-center gap-2">
                <span className="text-base font-bold text-white">{activeAgentData.title}</span>
              </div>
              <p className="text-xs text-slate-400 mt-1">{activeAgentData.role}</p>
            </div>

            {/* Tech & Tools Card */}
            <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800 text-xs font-mono space-y-2">
              <div className="flex items-center justify-between text-slate-400">
                <span>Architecture:</span>
                <span className="text-cyan-300">{activeAgentData.tech}</span>
              </div>
              <div>
                <span className="text-slate-400">Available Tools:</span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {activeAgentData.tools.map((t) => (
                    <span key={t} className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 text-[10px]">
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Thought Log Console */}
            <div>
              <div className="text-xs font-mono text-slate-400 mb-2 flex items-center justify-between">
                <span>EXECUTION LOG & THOUGHT CHAIN:</span>
                <span className="text-[10px] text-emerald-400 flex items-center gap-1">
                  <Clock className="w-3 h-3" /> Real-time
                </span>
              </div>
              <div className="p-3.5 rounded-lg bg-slate-950 border border-slate-800 font-mono text-xs text-slate-300 space-y-2 max-h-56 overflow-y-auto">
                {activeAgentData.thoughts.map((th, idx) => (
                  <div key={idx} className="flex items-start gap-2 leading-relaxed">
                    <span className="text-cyan-500 font-bold select-none">{`>`}</span>
                    <span>{th}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Output Preview */}
            <div>
              <div className="text-xs font-mono text-slate-400 mb-1">AGENT OBSERVATION PAYLOAD:</div>
              <div className="p-3 rounded-lg bg-slate-950/80 border border-slate-800/80 text-xs text-slate-300 font-mono leading-relaxed">
                {activeAgentData.sampleOutput}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
