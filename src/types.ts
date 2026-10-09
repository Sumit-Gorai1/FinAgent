export type AgentId =
  | 'orchestrator'
  | 'market_data'
  | 'technical_analyst'
  | 'fundamental_analyst'
  | 'news_intelligence'
  | 'sector_macro'
  | 'risk_manager'
  | 'bull_agent'
  | 'bear_agent'
  | 'verifier_agent'
  | 'committee_agent'
  | 'bug_agent';

export interface AgentInfo {
  id: AgentId;
  name: string;
  role: string;
  avatar: string;
  color: string;
  badge: string;
  status: 'idle' | 'running' | 'completed' | 'flagged' | 'debating';
}

export interface TechnicalIndicators {
  price: number;
  sma20: number;
  sma50: number;
  sma100: number;
  sma200: number;
  ema21: number;
  rsi: number;
  rsiStatus: 'Oversold' | 'Neutral' | 'Overbought';
  macd: {
    macdLine: number;
    signalLine: number;
    histogram: number;
    signal: 'Bullish' | 'Bearish' | 'Neutral';
  };
  bollingerBands: {
    upper: number;
    middle: number;
    lower: number;
    bandwidth: number;
  };
  atr14: number;
  supportLevel: number;
  resistanceLevel: number;
  volumeTrend: 'Surging' | 'Above Average' | 'Normal' | 'Drying Up';
  volatility30d: number;
  maxDrawdown1y: number;
  momentumScore: number;
  interpretation: string;
}

export interface FinancialMetric {
  year: string;
  revenue: number; // in Cr or Millions
  ebitda: number;
  netProfit: number;
  eps: number;
  operatingMargin: number; // %
  netMargin: number; // %
  freeCashFlow: number;
  debtToEquity: number;
}

export interface FundamentalData {
  companyName: string;
  sector: string;
  industry: string;
  marketCapCr: number;
  peRatio: number;
  industryPE: number;
  pbRatio: number;
  evToEbitda: number;
  roe: number;
  roce: number;
  dividendYield: number;
  promoterHolding: number;
  fiiDiiHolding: number;
  cagr3yRevenue: number;
  cagr3yProfit: number;
  cagr5yRevenue: number;
  freeCashFlowQuality: 'High' | 'Moderate' | 'Weak';
  debtTrend: 'Deleveraging' | 'Stable' | 'Elevating';
  marginTrend: 'Expanding' | 'Stable' | 'Contracting';
  quarterlyGrowthYoY: number;
  annualMetrics: FinancialMetric[];
  interpretation: string;
}

export interface NewsArticle {
  id: string;
  title: string;
  date: string;
  source: string;
  event: string;
  sentiment: 'POSITIVE' | 'NEGATIVE' | 'NEUTRAL';
  impact: 'High' | 'Medium' | 'Low';
  confidence: number;
  summary: string;
  tags: string[];
  url?: string;
  timestamp?: number;
  timeHorizon?: '2-4h' | '24h' | string;
}

export interface SectorMacroChain {
  sectorName: string;
  sectorTrend: 'Positive' | 'Neutral' | 'Challenging';
  sectorGrowthRate: number;
  macroFactors: {
    factor: string;
    trend: string;
    impactOnStock: 'Beneficial' | 'Neutral' | 'Adverse';
    detail: string;
  }[];
  regulatoryOutlook: string;
  competitiveMoat: string;
  environmentVerdict: 'Improving' | 'Stable' | 'Deteriorating';
}

export interface RiskEvaluation {
  overallRiskScore: number; // 1-10
  riskLevel: 'Low' | 'Moderate' | 'Elevated' | 'High';
  businessRisk: number;
  financialRisk: number;
  valuationRisk: number;
  regulatoryRisk: number;
  marketRisk: number;
  liquidityRisk: number;
  majorRisks: {
    title: string;
    severity: 'High' | 'Medium' | 'Low';
    description: string;
    mitigation: string;
  }[];
  stressTestScenarios: {
    scenario: string;
    projectedDrawdown: string;
    probability: string;
  }[];
}

export interface BullThesis {
  headline: string;
  confidenceScore: number;
  catalysts: {
    title: string;
    timeframe: string;
    evidence: string;
  }[];
  marketUnderestimates: string[];
  reRatingFactors: string[];
  targetUpside: string;
}

export interface BearThesis {
  headline: string;
  confidenceScore: number;
  vulnerabilities: {
    title: string;
    threat: string;
    evidence: string;
  }[];
  worstCaseScenarios: string[];
  downsideRiskEstimate: string;
}

export interface VerifierAudit {
  passed: boolean;
  score: number; // 0-100
  checks: {
    checkName: string;
    passed: boolean;
    evidence: string;
  }[];
  hallucinationRisk: 'None Detected' | 'Low' | 'Moderate';
  calculationIntegrity: '100% Deterministic Verified' | 'Needs Review';
  auditTimestamp: string;
}

export interface CommitteeScorecard {
  overallScore: number; // 0-100
  status: 'POSITIVE RESEARCH SETUP' | 'NEUTRAL CONSOLIDATION' | 'CAUTIOUS / ELEVATED RISK';
  confidencePercent: number;
  breakdown: {
    technical: number;
    fundamental: number;
    news: number;
    sector: number;
    risk: number;
    bullCase: number;
    bearCase: number;
  };
  mainReasons: string[];
  mainRisks: string[];
  executiveSummary: string;
  disclaimer: string;
}

export interface ThesisMemoryState {
  period: string; // e.g. "January 2026", "March 2026", "Current"
  fundamentalScore: number;
  technicalScore: number;
  riskScore: number;
  overallScore: number;
  verdict: string;
  keyDriver: string;
}

export interface IntrinsicValuationData {
  blendedIntrinsicValue: number;
  dcfValue: number;
  grahamFormulaValue: number;
  grahamNumber: number;
  peterLynchValue: number;
  multiplesFairValue: number;
  marginOfSafetyPercent: number; // ((Intrinsic - Price) / Price) * 100
  discountMarginOfSafety: number; // ((Intrinsic - Price) / Intrinsic) * 100
  valuationStatus: 'DEEP_VALUE' | 'UNDERVALUED' | 'FAIRLY_VALUED' | 'OVERVALUED' | 'HIGHLY_OVERVALUED';
  discountRate: number;
  projectedGrowthRate: number;
  terminalGrowthRate: number;
  reverseDcfImpliedGrowth: number;
  targetPE: number;
  projections: {
    year: string;
    fcfPerShare: number;
    projectedEPS: number;
    discountFactor: number;
    presentValue: number;
  }[];
  keyAssumptions: string[];
  verdict: string;
  valuationConfidence: number;
  terminalValue?: number;
  pvTerminal?: number;
  fiveYearPvSum?: number;
}

export interface StockResearchData {
  symbol: string;
  name: string;
  exchange: 'NSE' | 'BSE' | 'NSE & BSE' | 'NASDAQ' | 'NYSE';
  bseCode?: string;
  currency: string;
  price: number;
  change: number;
  changePercent: number;
  open: number;
  high: number;
  low: number;
  previousClose: number;
  volume: number;
  avgVolume: number;
  fiftyTwoWeekHigh: number;
  fiftyTwoWeekLow: number;
  marketCapCr: number;
  priceHistory: { date: string; close: number; volume: number; sma20?: number; sma50?: number }[];
  
  technicals: TechnicalIndicators;
  fundamentals: FundamentalData;
  news: NewsArticle[];
  sectorMacro: SectorMacroChain;
  risk: RiskEvaluation;
  bullCase: BullThesis;
  bearCase: BearThesis;
  verifier: VerifierAudit;
  committee: CommitteeScorecard;
  thesisHistory: ThesisMemoryState[];
  thesisChanged: boolean;
  thesisChangeAlert?: {
    previousStatus: string;
    currentStatus: string;
    reasons: string[];
    timestamp: string;
  };
  intrinsicValue?: IntrinsicValuationData;
}

export interface WorkflowStep {
  agentId: AgentId;
  agentName: string;
  status: 'pending' | 'active' | 'completed' | 'reviewing';
  durationMs?: number;
  logSummary: string;
  outputPreview?: string;
  confidence?: number;
}

export interface WatchlistItem {
  symbol: string;
  name: string;
  price: number;
  changePercent: number;
  score: number;
  statusTag: 'POSITIVE' | 'NEUTRAL' | 'CAUTION';
  thesisAlert?: string;
  lastAnalyzed: string;
  intrinsicValue?: number;
  marginOfSafetyPercent?: number;
}

export interface AlertNotification {
  id: string;
  symbol: string;
  title: string;
  timestamp: string;
  type: 'THESIS_CHANGE' | 'PRICE_SHOCK' | 'RISK_SPIKE' | 'RESULT_EVENT';
  previousVerdict: string;
  newVerdict: string;
  reasons: string[];
  dispatchedChannels: ('Telegram' | 'Email' | 'Push' | 'Dashboard')[];
  read: boolean;
}

export interface PortfolioHolding {
  symbol: string;
  name: string;
  shares: number;
  avgBuyPrice: number;
  currentPrice: number;
  weightPercent: number;
  sector: string;
  score: number;
  researchScore?: number;
  unrealizedPnL: number;
  unrealizedPnLPercent: number;
  dayChange?: number;
  dayChangePercent?: number;
  dayPnL?: number;
  previousClose?: number;
  priceFlash?: 'up' | 'down' | null;
  lastUpdated?: number;
  intrinsicValue?: number;
  marginOfSafetyPercent?: number;
  valuationStatus?: 'DEEP_VALUE' | 'UNDERVALUED' | 'FAIRLY_VALUED' | 'OVERVALUED' | 'HIGHLY_OVERVALUED';
}

export type TargetAllocationModelType =
  | 'ALPHA_RESEARCH'
  | 'BALANCED_GROWTH'
  | 'DEFENSIVE_CAPITAL'
  | 'EQUAL_WEIGHT'
  | 'CUSTOM';

export interface RebalanceRecommendation {
  symbol: string;
  name: string;
  sector: string;
  currentShares: number;
  currentPrice: number;
  currentWeight: number; // percentage
  currentValue: number;
  targetWeight: number; // percentage
  targetValue: number;
  driftPercent: number; // currentWeight - targetWeight
  action: 'BUY' | 'SELL' | 'HOLD';
  sharesToTrade: number;
  orderValue: number;
  postRebalanceWeight: number;
  researchScore: number;
  reasoning: string;
  urgency: 'HIGH' | 'MEDIUM' | 'LOW';
}

export interface RebalancePlan {
  modelType: TargetAllocationModelType;
  modelName: string;
  modelDescription: string;
  totalPortfolioValue: number;
  totalTurnover: number;
  totalTurnoverPercent: number;
  netCashRequired: number;
  estimatedCost: number;
  items: RebalanceRecommendation[];
  aiDirectives?: {
    summary: string;
    thesisShifts: string[];
    riskAssessment: string;
    modelUsed?: string;
  };
}

export interface PortfolioAnalytics {
  totalValue: number;
  totalInvested: number;
  unrealizedPnL: number;
  unrealizedPnLPercent: number;
  cashBalance: number;
  riskScore: number; // 0-10
  healthScore: number; // 0-100
  diversificationScore: number; // 0-100
  beta: number;
  maxDrawdown: number;
  sharpeRatio: number;
  sectorConcentration: { sector: string; weight: number; color: string }[];
  correlationWarnings: string[];
  aiRecommendations: string[];
}

export interface PaperTradeOrder {
  id: string;
  symbol: string;
  type: 'BUY' | 'SELL';
  shares: number;
  price: number;
  totalAmount: number;
  timestamp: string;
  agentSignalScore?: number;
  reason: string;
}

export type PaperOrder = PaperTradeOrder;

export interface TriggerEvent {
  symbol: string;
  type: string;
  description: string;
  timestamp: string;
}

export interface PriceAlert {
  id: string;
  symbol: string;
  stockName: string;
  targetPrice: number;
  condition: 'ABOVE' | 'BELOW';
  createdPrice: number;
  note?: string;
  status: 'ACTIVE' | 'TRIGGERED' | 'CANCELLED';
  createdAt: string;
  triggeredAt?: string;
  triggeredPrice?: number;
}

export interface PriceAlertNotification {
  id: string;
  alertId: string;
  symbol: string;
  stockName?: string;
  targetPrice: number;
  condition: 'ABOVE' | 'BELOW';
  currentPrice: number;
  timestamp: string;
  note?: string;
  read?: boolean;
}

export interface AssistantMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  suggestedAlertPrice?: number;
  suggestedAlertCondition?: 'ABOVE' | 'BELOW';
  suggestedAlertNote?: string;
}

export interface SystemBug {
  id: string;
  category: 'PRICE_ACCURACY' | 'INDICATOR_DRIFT' | 'FEED_LATENCY' | 'ALERT_INTEGRITY' | 'MEMORY_LEAK' | 'SCHEMA_WARNING';
  title: string;
  description: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  targetEntity: string;
  detectedValue: string;
  expectedValue: string;
  autoFixAvailable: boolean;
  status: 'DETECTED' | 'FIXING' | 'RESOLVED';
  detectedAt: string;
  resolvedAt?: string;
  fixActionDescription: string;
}

export interface BugAgentDiagnosticReport {
  timestamp: string;
  totalAudited: number;
  bugsFound: number;
  bugsFixed: number;
  systemHealthScore: number;
  integrityStatus: 'HEALTHY' | 'DEGRADED' | 'REPAIRED';
  subsystems: {
    priceEngine: { status: 'OPTIMAL' | 'WARNING' | 'ERROR'; checkedItems: number; issuesCount: number };
    indicatorMath: { status: 'OPTIMAL' | 'WARNING' | 'ERROR'; checkedItems: number; issuesCount: number };
    marketDataFeed: { status: 'OPTIMAL' | 'WARNING' | 'ERROR'; checkedItems: number; issuesCount: number };
    alertIntegrity: { status: 'OPTIMAL' | 'WARNING' | 'ERROR'; checkedItems: number; issuesCount: number };
    swarmMemory: { status: 'OPTIMAL' | 'WARNING' | 'ERROR'; checkedItems: number; issuesCount: number };
  };
  bugs: SystemBug[];
  diagnosticLog: string[];
}

export interface UserProfile {
  id: string;
  email: string;
  displayName: string;
  avatar?: string;
  tier: 'PRO_INVESTOR' | 'INSTITUTIONAL' | 'RETAIL';
  loginMethod: 'EMAIL_PASSWORD' | 'EMAIL_OTP' | 'MAGIC_LINK';
  lastLogin: string;
  createdAt: string;
  subscription?: UserSubscription;
  preferences?: {
    notificationsEnabled: boolean;
    defaultCurrency: string;
  };
}

export type SubscriptionPlanTier = 'free' | 'pro' | 'institutional';
export type BillingPeriod = 'monthly' | 'annual';

export interface SubscriptionPlan {
  id: SubscriptionPlanTier;
  name: string;
  tagline: string;
  priceINRMonthly: number;
  priceINRAnnual: number; // per year
  priceUSDMonthly: number;
  priceUSDAnnual: number;
  popular?: boolean;
  features: string[];
  limitations?: string[];
  stripePriceIdMonthly?: string;
  stripePriceIdAnnual?: string;
}

export interface UserSubscription {
  planId: SubscriptionPlanTier;
  status: 'active' | 'trialing' | 'past_due' | 'canceled' | 'none';
  billingPeriod: BillingPeriod;
  currency: 'INR' | 'USD';
  currentPeriodStart: string;
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  invoices: SubscriptionInvoice[];
}

export interface SubscriptionInvoice {
  id: string;
  invoiceNumber: string;
  date: string;
  amount: number;
  currency: 'INR' | 'USD';
  status: 'paid' | 'pending' | 'failed';
  planName: string;
  billingPeriod: BillingPeriod;
  paymentMethod: string;
  pdfDownloadUrl?: string;
}

export interface CheckoutSessionResponse {
  success: boolean;
  url?: string;
  sessionId?: string;
  mode: 'stripe_hosted' | 'sandbox_simulated';
  message?: string;
  error?: string;
  planId?: SubscriptionPlanTier;
}

export interface PipelineDepthEntry {
  price: number;
  quantity: number;
  orders: number;
}

export interface PipelineMarketDepth {
  symbol: string;
  exchange: 'NSE' | 'BSE';
  timestamp: string;
  buy: PipelineDepthEntry[];
  sell: PipelineDepthEntry[];
  totalBuyQty: number;
  totalSellQty: number;
}

export interface DualExchangeQuoteData {
  symbol: string;
  isin: string;
  companyName: string;
  sector: string;
  nse: {
    symbol: string;
    series: string;
    ltp: number;
    open: number;
    high: number;
    low: number;
    close: number;
    change: number;
    changePercent: number;
    volume: number;
    valueCr: number;
    vwap: number;
    week52High: number;
    week52Low: number;
    lowerCircuit: number;
    upperCircuit: number;
    status: 'ACTIVE' | 'PRE_OPEN' | 'POST_CLOSE';
  };
  bse: {
    scripCode: string;
    securityId: string;
    group: string;
    ltp: number;
    open: number;
    high: number;
    low: number;
    close: number;
    change: number;
    changePercent: number;
    volume: number;
    valueCr: number;
    vwap: number;
    week52High: number;
    week52Low: number;
    status: 'ACTIVE' | 'PRE_OPEN' | 'POST_CLOSE';
  };
  arbitrage: {
    spread: number;
    spreadPercent: number;
    favorableExchange: 'NSE' | 'BSE' | 'PAR';
    opportunity: boolean;
    recommendation: string;
  };
  lastUpdated: string;
}

export interface PipelineIndexItem {
  exchange: 'NSE' | 'BSE';
  symbol: string;
  name: string;
  value: number;
  change: number;
  changePercent: number;
  high: number;
  low: number;
  open: number;
  close: number;
  yearHigh: number;
  yearLow: number;
  volume: number;
  timestamp: string;
}

export interface PipelineMarketBreadth {
  exchange: 'NSE' | 'BSE';
  advances: number;
  declines: number;
  unchanged: number;
  ratio: number;
  totalTurnoverCr: number;
  totalTradedContracts: number;
  timestamp: string;
}

export interface NseBsePipelineStatus {
  success: boolean;
  pipeline: string;
  status: 'CONNECTED' | 'STREAMING' | 'RECONNECTING' | 'DEGRADED';
  timestamp: string;
  connectedAt: string;
  telemetry: {
    totalTicksProcessed: number;
    packetsPerSec: number;
    activeStreams: number;
  };
  gateways: {
    nse: {
      name: string;
      protocol: string;
      colocation: string;
      primaryHost: string;
      segment: string;
      latencyMs: number;
      status: 'CONNECTED' | 'DISCONNECTED';
      packetLossRate: string;
    };
    bse: {
      name: string;
      protocol: string;
      colocation: string;
      primaryHost: string;
      segment: string;
      latencyMs: number;
      status: 'CONNECTED' | 'DISCONNECTED';
      packetLossRate: string;
    };
  };
  supportedEquities: string[];
}




