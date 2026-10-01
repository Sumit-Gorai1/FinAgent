# FINAGENT — Dashboard Snapshots & Visual Architecture Guide

This document provides a comprehensive visual reference, component blueprint, and interface breakdown for each of the primary dashboards and cockpits in **FINAGENT**.

---

## 📸 Executive Visual Showcase

### 1. Multi-Agent Stock Research Cockpit
![FINAGENT Stock Research Cockpit](/assets/research_cockpit.jpg)
*Real-time multi-agent research terminal featuring live tick price feeds, 10-agent consensus scorecard, interactive candlestick charting, moving average bands, and level-2 depth.*

---

### 2. Institutional Portfolio Intelligence & Heartbeat Monitor
![FINAGENT Portfolio Intelligence](/assets/portfolio_cockpit.jpg)
*Asset allocation metrics, P&L tracking, sector risk exposure distribution, portfolio health monitoring, and automated execution rebalancing.*

---

### 3. Industry Sector Performance Heatmap
![FINAGENT Sector Heatmap](/assets/sector_heatmap.jpg)
*Real-time sector performance tree-map visualizer grouping equities into canonical Indian industries with live capital flow indicators.*

---

## 🖥️ Screen-by-Screen Snapshot Specifications

```
╔════════════════════════════════════════════════════════════════════════════════════════════════════════╗
║                                 FINAGENT WORKSTATION NAVIGATION BAR                                    ║
║  [⚡ FINAGENT AI]   [Research] [All Stocks (2,570+)] [Sectors] [Watchlist] [Portfolio] [Paper Lab]   ║
║  [🔎 Search Symbol, Company Name, or BSE Code...]        [● NSE/BSE: 09:15-15:30 IST] [₹10L Virtual]  ║
╚════════════════════════════════════════════════════════════════════════════════════════════════════════╝
```

---

### Snapshot 1: Multi-Agent Stock Research Cockpit (`StockResearchView.tsx`)

#### Wireframe Blueprint:
```
┌────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ TICKER: RELIANCE  [NSE]  [POSITIVE RESEARCH SETUP]  [Sector Heatmap →]    │ LTP: ₹1,257.50 ▲ (+1.45%) │
│ Reliance Industries Limited • Energy & Retail • MCap: ₹17.02 Lakh Cr      │ Bid: ₹1,257.45 | Ask: ... │
├───────────────────────────────────────────────────────────────────────────┴───────────────────────────┤
│ [Quick Switch: RELIANCE | TCS | HDFCBANK | INFY | TATAMOTORS | ICICIBANK | SBIN | MARUTI | BAJFINANCE]│
├──────────────────────────────────────┬────────────────────────────────────────────────────────────────┤
│   INVESTMENT COMMITTEE SCORECARD     │            MULTI-AGENT EVALUATION MATRIX                       │
│             ┌───────┐                │  Fundamentals      [████████████░░░] 80/100 (High)             │
│             │  82   │ / 100          │  Technical Setup   [███████████░░░░] 74/100 (Med)              │
│             └───────┘                │  News Wire (<24h)  [██████████░░░░░] 72/100 (Med)              │
│      [POSITIVE CONVICTION]           │  Sector & Macro    [███████████░░░░] 76/100 (High)             │
│  Agent Confidence: 88%               │  Risk Protection   [█████████░░░░░░] 64/100 (Critical)         │
│  Evidence: 4 / 4 Agents Concur       │  Bull Conviction   [█████████████░░] 86/100 (Catalysts)        │
│                                      │  Primary Bull Drivers: ARPU growth, 5G standalone, Retail scale│
│  "High-conviction market leader      │  Critical Risks: Refining crack margins, capex deleveraging    │
│   demonstrating pricing power."      │                                                                │
├──────────────────────────────────────┴────────────────────────────────────────────────────────────────┤
│ [Tabs: Price Chart | DCF Model | Price Alerts | AI Copilot | Technicals | Fundamentals | News Wire... ]│
├───────────────────────────────────────────────────────────────────────────────────────────────────────┤
│  CANDLESTICK FINANCIAL CHART (1D | 1W | 1M | 1Y | 5Y)                                                 │
│   ┌────────────────────────────────────────────────────────────────────────────────────────────────┐  │
│   │   ▲                                 ┌─┐                                                        │  │
│   │  Price                           ┌──┘ └──┐         SMA 20: ₹1,248.50                           │  │
│   │                               ┌──┘       └──┐      SMA 50: ₹1,232.00                           │  │
│   │                         ┌─────┘             └───┐  EMA 21: ₹1,245.20                           │  │
│   │                      ┌──┘                                                                      │  │
│   │  Vol: [||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||]  │  │
│   └────────────────────────────────────────────────────────────────────────────────────────────────┘  │
│  Alert Anchors: [≥ ₹1,300 (Breakout Target)]   [≤ ₹1,210 (Stop-Loss Protection)]                      │
├───────────────────────────────────────────────────────────────────────────────────────────────────────┤
│  AGENT 5 — CURRENT MARKET NEWS WIRE (STRICTLY FRESH TODAY / < 24H)                                    │
│  ● 42m ago • LiveMint: "Jio Platforms announces 15% tariff revision; ARPU expected to breach ₹210"   │
│  ● 2h ago  • Economic Times: "Reliance Retail accelerates omni-channel footprint across Tier-2/3"     │
│  ● 4h ago  • Reuters: "Distillate crack spreads firm up in Asian trading session"                     │
└───────────────────────────────────────────────────────────────────────────────────────────────────────┘
```

#### Key Capabilities & Elements:
- **Hero Header**: Live LTP with animated tick flash, daily ₹ and % delta, bid/ask depth, 52-week range, and MCap.
- **Committee Score Gauge**: Circular SVG radial score (0–100) reflecting multi-agent consensus.
- **Dimensional Breakdown Bars**: Individual sub-scores for Fundamentals, Technicals, News Intelligence, Macro, Risk, and Bull Conviction.
- **Active Navigation Ribbon**: Instant switching between key benchmark assets without page reloads.
- **Interactive DCF Financial Model**: Live parametric sliders for Growth Rate, Discount Rate, Terminal Growth, and Target P/E with dynamic Margin of Safety (MoS) computation.
- **Strictly Fresh News Intelligence**: Automatic rejection of articles older than 24 hours to prevent stale thesis drift.

---

### Snapshot 2: All Listed Companies Directory & Exchange Explorer (`IndianStocksDirectoryView.tsx`)

#### Wireframe Blueprint:
```
┌────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ 🇮🇳 ALL LISTED INDIAN EQUITIES DIRECTORY (NSE & BSE)                                                    │
│ Search all 2,584 companies listed on National Stock Exchange and Bombay Stock Exchange.                │
├────────────────────────────────────────────────────────────────────────────────────────────────────────┤
│ [🔎 Search 2,584 stocks by Ticker, Legal Name, or 6-digit BSE Code...] [Clear Filters] [🔄 Refresh]  │
│ Exchange Filter:  [All (2,584)]  [NSE (2,578)]  [BSE (2,584)]  [Dual Listed (2,578)]  [BSE Only (6)]   │
│ Sector Filter:    [All Sectors] [Banking] [IT] [Energy] [Auto] [Pharma] [Metals] [FMCG] [Defence]      │
│ Sort By:          [Company Name ▼] [Market Price] [Symbol (A-Z)] [BSE Scrip Code]                      │
├────────────────────────────────────────────────────────────────────────────────────────────────────────┤
│ Showing 1 – 24 of 2,584 Companies                                              Page 1 of 108 [Next →]  │
├───────────────────────────────────┬───────────────────────────────────┬────────────────────────────────┤
│ RELIANCE                          │ TCS                               │ HDFCBANK                       │
│ Reliance Industries Limited       │ Tata Consultancy Services Ltd     │ HDFC Bank Limited              │
│ Sector: Energy & Power            │ Sector: Information Technology    │ Sector: Banking & Financials   │
│ [NSE & BSE Dual] • Scrip: 500325  │ [NSE & BSE Dual] • Scrip: 532540  │ [NSE & BSE Dual] • Scrip: 500180│
│ Series: EQ • ISIN: INE002A01018   │ Series: EQ • ISIN: INE467B01029   │ Series: EQ • ISIN: INE040A01034 │
│ ───────────────────────────────── │ ───────────────────────────────── │ ────────────────────────────── │
│ CMP: ₹1,257.50 (+1.45%)           │ CMP: ₹4,124.80 (-0.32%)           │ CMP: ₹968.20 (+0.85%)          │
│ [⚡ Analyze in Cockpit →]         │ [⚡ Analyze in Cockpit →]         │ [⚡ Analyze in Cockpit →]      │
└───────────────────────────────────┴───────────────────────────────────┴────────────────────────────────┘
```

#### Key Capabilities & Elements:
- **Comprehensive Master Catalog**: All 2,584 listed equities indexed with official corporate names, ISINs, and series codes.
- **6-Digit BSE Scrip Code Resolution**: Full support for finding stocks via numeric scrip IDs (`500325`, `532540`, `543320`).
- **Dual-Listing Badging**: Distinguishes dual-listed equities from BSE-exclusive micro-caps.
- **Live Batch Polling**: Auto-polls live market quotes for visible rows on the active pagination page.

---

### Snapshot 3: Real-Time Sector Performance Heatmap (`SectorHeatmap.tsx`)

#### Wireframe Blueprint:
```
┌────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ 🌐 REAL-TIME INDUSTRY SECTOR PERFORMANCE HEATMAP                                                       │
│ Cross-sector capital rotation, volume concentration, and performance gradients.                        │
├────────────────────────────────────────────────────────────────────────────────────────────────────────┤
│ Overall Market Breadth:  ▲ Advances: 1,482 (62%)  │  ▼ Declines: 840 (35%)  │  ● Unchanged: 62 (3%)    │
├────────────────────────────────────┬───────────────────────────────────┬───────────────────────────────┤
│ BANKING & FINANCIALS    [+1.84%] ▲ │ IT SERVICES            [-0.45%] ▼ │ AUTOMOTIVE & EV     [+2.15%] ▲│
│ ┌────────────────┬────────────────┐│ ┌────────────────┬────────────────┐│ ┌────────────────┬───────────┐ │
│ │ HDFCBANK       │ ICICIBANK      ││ │ TCS            │ INFY           ││ │ TATAMOTORS     │ MARUTI    │ │
│ │ ₹968.20        │ ₹1,245.00      ││ │ ₹4,124.80      │ ₹1,885.00      ││ │ ₹1,048.50      │ ₹12,450   │ │
│ │ +0.85% (Emerald│ +2.40% (Emerald││ │ -0.32% (Rose)  │ -0.68% (Rose)  ││ │ +3.20% (Emerald│ +1.10%    │ │
│ ├────────────────┼────────────────┤│ ├────────────────┼────────────────┤│ ├────────────────┼───────────┤ │
│ │ SBIN           │ AXISBANK       ││ │ WIPRO          │ TECHM          ││ │ M&M            │ BAJAJ-AUTO│ │
│ │ ₹824.50 +1.2%  │ ₹1,180.00 +1.6%││ │ ₹540.00 -0.2%  │ ₹1,620.00 -0.8%││ │ ₹2,840.00 +2.6%│ ₹9,820 +1%│ │
│ └────────────────┴────────────────┘│ └────────────────┴────────────────┘│ └────────────────┴───────────┘ │
├────────────────────────────────────┼───────────────────────────────────┼───────────────────────────────┤
│ ENERGY, OIL & GAS       [+1.22%] ▲ │ PHARMACEUTICALS        [+0.78%] ▲ │ METALS & MINING     [-1.12%] ▼│
│ RELIANCE: +1.45% | ONGC: +1.80%    │ SUNPHARMA: +1.10% | CIPLA: +0.45% │ TATASTEEL: -1.40% | JSW: -0.9%│
└────────────────────────────────────┴───────────────────────────────────┴───────────────────────────────┘
```

#### Key Capabilities & Elements:
- **Hierarchical Tree-Map Tiles**: Sized and grouped by market capitalization and industrial sectors.
- **Dynamic Gradient Shading**: Dark emerald for strong gains (`> +2%`), emerald for modest gains, dark rose for declines (`< -2%`), and slate for neutral consolidation.
- **Interactive Drill-Down**: Clicking any stock tile immediately routes to its full 10-agent research cockpit.

---

### Snapshot 4: Institutional Portfolio Intelligence (`PortfolioIntelligence.tsx`)

#### Wireframe Blueprint:
```
┌────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ 💼 INSTITUTIONAL PORTFOLIO INTELLIGENCE                                                                │
│ [💼 Active Holdings (5)]  [📊 Rebalancer]  [💓 Heartbeat]  [⚡ Stress Test]  [📄 PDF] [📊 Excel]        │
├──────────────────────────┬──────────────────────────┬──────────────────────────┬───────────────────────┤
│ TOTAL PORTFOLIO VALUE    │ UNREALIZED TOTAL GAIN    │ TODAY'S P&L              │ VIRTUAL CASH BALANCE  │
│ ₹24,85,400               │ +₹3,24,650 (+15.02%) ▲   │ +₹18,420 (+0.75%) ▲      │ ₹10,00,000 INR        │
├──────────────────────────┴──────────────────────────┴──────────────────────────┴───────────────────────┤
│ PORTFOLIO HOLDINGS AUDIT TABLE                                                                         │
│ Symbol     Sector          Shares    Avg Buy    CMP        Total P&L         Score  Weight   Actions    │
│ ────────────────────────────────────────────────────────────────────────────────────────────────────── │
│ RELIANCE   Energy & Power  500       ₹1,120.00  ₹1,257.50  +₹68,750 (+12.3%) 82     25.3%    [+][-][✎]  │
│ TCS        IT Services     200       ₹3,950.00  ₹4,124.80  +₹34,960 (+4.4%)  74     33.2%    [+][-][✎]  │
│ TATAMOTORS Auto & EV       800       ₹840.00    ₹1,048.50  +₹1,66,800 (+24%) 86     33.8%    [+][-][✎]  │
│ HDFCBANK   Banking & Fin   200       ₹920.00    ₹968.20    +₹9,640 (+5.2%)   79      7.8%    [+][-][✎]  │
├────────────────────────────────────────────────────────────────────────────────────────────────────────┤
│ ASSET ALLOCATION BY SECTOR                             MONTE CARLO VALUE-AT-RISK (VaR 95%)             │
│ [Donut Chart: Energy 25.3% | IT 33.2% | Auto 33.8%]    1-Month 95% Confidence VaR Limit: -₹84,200      │
└────────────────────────────────────────────────────────────────────────────────────────────────────────┘
```

#### Key Capabilities & Elements:
- **Real-Time P&L & Valuation**: Live position valuation calculated against real-time market ticks.
- **Position Action Modal**: Integrated Buy More, Trim Position, Edit Price/Shares, and Remove operations.
- **One-Click Export Engine**: Instant generation of branded **PDF Investment Reports** (`jsPDF`) and **Excel Spreadsheets** (`XLSX`).
- **Health Heartbeat Monitor**: Systemic risk scoring, concentration warnings, and beta volatility alerts.

---

### Snapshot 5: Autonomous Portfolio Rebalancer (`AutonomousRebalancer.tsx`)

#### Wireframe Blueprint:
```
┌────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ 🤖 AGENT 14: AUTONOMOUS PORTFOLIO REBALANCER                                                           │
│ Real-time execution planner realigning capital allocation with research conviction scores.            │
├────────────────────────────────────────────────────────────────────────────────────────────────────────┤
│ Model Strategy: [● Multi-Agent Alpha Conviction] [Balanced Growth] [Capital Preservation] [Equal-Weight]│
│ Total Turnover: ₹2,45,000 (9.8%)  │  Net Cash Required: ₹0  │  Estimated STT/Brokerage: ₹245           │
├────────────────────────────────────────────────────────────────────────────────────────────────────────┤
│ REBALANCING EXECUTION DIRECTIVES                                                                       │
│ Stock       Score   Current Wt   Target Wt   Drift     Execution Action          Rationale             │
│ ────────────────────────────────────────────────────────────────────────────────────────────────────── │
│ TATAMOTORS  86      33.8%        30.0%       -3.8%     SELL 30 Shares (~₹31k)    Lock in outsized alpha │
│ TCS         74      33.2%        20.0%       -13.2%    SELL 80 Shares (~₹330k)   Trim low score catalyst│
│ RELIANCE    82      25.3%        28.0%       +2.7%     BUY 54 Shares (~₹68k)     Overweight leader      │
│ HDFCBANK    79      7.8%         22.0%       +14.2%    BUY 365 Shares (~₹353k)   Deposit normalization  │
├────────────────────────────────────────────────────────────────────────────────────────────────────────┤
│ [⚡ Execute Rebalancing in Paper Trading Lab]                  [Download Execution Instructions PDF]  │
└────────────────────────────────────────────────────────────────────────────────────────────────────────┘
```

#### Key Capabilities & Elements:
- **Strategy Models**: Pre-built quantitative models (Alpha Conviction, Balanced Growth, Capital Preservation, Equal Weight, and Custom Targets).
- **Drift Optimization**: Compares live weights vs. model targets, ensuring sum of allocations equals 100%.
- **Actionable Execution Directives**: Clear BUY / TRIM share quantities with institutional rationale.

---

### Snapshot 6: Continuous Watchlist & Strategic Trigger Monitor (`WatchlistMonitor.tsx`)

#### Wireframe Blueprint:
```
┌────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ 🔔 CONTINUOUS WATCHLIST & REAL-TIME EVENT STREAM                                                      │
│ Autonomous surveillance monitoring price breakouts, volume surges, and RSI extremes.                   │
├────────────────────────────────────────────────────────────────────────────────────────────────────────┤
│ Active Watchlist Securities (8)                                            Surveillance Status: ACTIVE │
│ Symbol     CMP        24h Chg    20 SMA     RSI 14   Surveillance Alert Level   Quick Actions          │
│ ────────────────────────────────────────────────────────────────────────────────────────────────────── │
│ RELIANCE   ₹1,257.50  +1.45% ▲   ₹1,248.50  62.4     ● Normal Trading Band      [Set Alert] [Chart]    │
│ INFY       ₹1,885.00  -0.68% ▼   ₹1,892.00  38.2     ⚠️ Approaching Oversold    [Set Alert] [Chart]    │
│ TATAMOTORS ₹1,048.50  +3.20% ▲   ₹1,012.00  74.5     🚨 RSI Overbought (>70)    [Set Alert] [Chart]    │
├────────────────────────────────────────────────────────────────────────────────────────────────────────┤
│ RECENT SURVEILLANCE TRIGGERS (AUDIO CHIME ENABLED 🔔)                                                  │
│ • 14:15 IST — TATAMOTORS: 5-minute volume surged 280% above baseline. Potential institutional block.  │
│ • 13:40 IST — HDFCBANK: Crossed above 20-day SMA (₹965.00). Bullish momentum confirmation.           │
└────────────────────────────────────────────────────────────────────────────────────────────────────────┘
```

#### Key Capabilities & Elements:
- **Automated Event Detection**: Triggers on volume anomalies, moving average crosses, and overbought/oversold levels.
- **Web Audio Chimes**: Synthesizes audible alert tones upon triggering without external audio file dependencies.

---

### Snapshot 7: Virtual Paper Trading Lab (`PaperTradingLab.tsx`)

#### Wireframe Blueprint:
```
┌────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ 🧪 VIRTUAL PAPER TRADING LAB & EXECUTION SIMULATOR                                                    │
│ Virtual Capital: ₹10,00,000 INR  │  Realized P&L: +₹42,800  │  Simulated Execution Fill Rate: 99.8%     │
├────────────────────────────────────────┬───────────────────────────────────────────────────────────────┤
│ ORDER PLACEMENT CONSOLE                │ LIVE ORDER BOOK & TRANSACTION AUDIT LOG                      │
│ Asset: [RELIANCE - ₹1,257.50]          │ Order ID    Type   Shares  Price      Status      Time        │
│ Order Type: [● BUY / LONG] [SELL/SHORT]│ ───────────────────────────────────────────────────────────── │
│ Execution:  [● MARKET]     [LIMIT]     │ ORD-88231   BUY    100     ₹1,255.00  FILLED      14:10:22    │
│ Quantity:   [ 100 Shares ]             │ ORD-77192   TRIM   50      ₹4,130.00  FILLED      11:05:40    │
│ Total INR:  ₹1,25,750                  │                                                               │
│ Reason:     [Committee Consensus Signal│ HISTORICAL STRATEGY BACKTEST RESULTS (3 YEARS vs NIFTY 50)    │
│                                        │ Strategy CAGR: 24.8%  │  NIFTY 50: 14.2%  │  Alpha: +10.6%    │
│ [🚀 Transmit Simulated Paper Order]    │ Sharpe Ratio: 1.84   │  Max Drawdown: -11.8% (Benchmark: -18.4%) │
└────────────────────────────────────────┴───────────────────────────────────────────────────────────────┘
```

#### Key Capabilities & Elements:
- **Risk-Free Simulation**: Virtual capital seeded at ₹10 Lakhs INR.
- **Strategy Backtesting**: Multi-year quantitative performance verification against the NIFTY 50 index.

---

### Snapshot 8: Multi-Gateway Subscription & Billing Hub (`SubscriptionBillingHub.tsx`)

#### Wireframe Blueprint:
```
┌────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ 💳 SUBSCRIPTION BILLING & COMMERCIAL GATEWAY HUB                                                      │
│ Manage enterprise tiers, Razorpay INR gateways, UPI collect requests, and GST invoices.               │
├────────────────────────────────────────────────────────────────────────────────────────────────────────┤
│ ACTIVE SUBSCRIPTION: PRO QUANT INVESTOR  [● ACTIVE]  │  Billing Cycle: ₹3,999 / Month (INR)            │
├──────────────────────────┬──────────────────────────┬──────────────────────────────────────────────────┤
│ RETAIL INVESTOR          │ PRO QUANT INVESTOR       │ INSTITUTIONAL DESK                               │
│ ₹999 / Month             │ ₹3,999 / Month (Current) │ ₹14,999 / Month                                  │
│ • Daily Consensus Scores │ • All 2,570+ Equities    │ • Full 10-Agent Raw Telemetry                    │
│ • 5 Watchlist Securities │ • Agent 14 Rebalancer    │ • Real-Time SSE WebSocket Tick Feeds             │
│ • Basic Technical Charts │ • Real-Time Fresh News   │ • Direct API Access & Webhooks                   │
│ [Select Tier]            │ [Current Active Plan]    │ [Upgrade to Institutional]                       │
├──────────────────────────┴──────────────────────────┴──────────────────────────────────────────────────┤
│ INTEGRATED INDIAN PAYMENT RAILS:                                                                       │
│ [🟢 Razorpay Checkout]   [📱 UPI Collect (GPay / PhonePe / Paytm)]   [💳 Stripe Global Card Gateway]    │
│ [⚡ Instant Sandbox Test Activation (One-Click Testing for Evaluators)]                                 │
└────────────────────────────────────────────────────────────────────────────────────────────────────────┘
```

#### Key Capabilities & Elements:
- **Native INR Payments**: Direct integration with Razorpay orders in INR paise and UPI collect protocols.
- **GST Invoicing**: Downloadable tax-compliant invoices with GSTIN identification.
- **Sandbox Validator**: One-click test validation allowing evaluators to experience pro tier features immediately.

---

### Snapshot 9: Autonomous Bug Agent & System Self-Healing (`BugAgentModal.tsx`)

#### Wireframe Blueprint:
```
┌────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ 🛠️ AUTONOMOUS BUG AGENT & PLATFORM DIAGNOSTICS                                                        │
│ Continuous self-healing system validating market prices, quote feeds, schemas, and endpoints.         │
├────────────────────────────────────────────────────────────────────────────────────────────────────────┤
│ Diagnostic Status: ALL SYSTEMS OPERATIONAL (0 Fatal Errors)  │  Total Endpoints Audited: 18            │
├────────────────────────────────────────────────────────────────────────────────────────────────────────┤
│ DIAGNOSTIC AUDIT LOG                                                                                   │
│ [✓] Live Market Feed: Connected to Yahoo Finance & NSE/BSE Gateway (Latency: 142ms)                    │
│ [✓] 2,584 Equities Master File: Schema valid, ISINs indexed, BSE Scrip codes resolved                 │
│ [✓] Fresh News Wire: Filtering strictly for < 24h market releases (1-day news rejected)                │
│ [✓] Billing Rails: Razorpay, UPI, and Stripe configurations loaded                                     │
│ [✓] AI Engine: Gemini API active with automatic candidate model failover                               │
├────────────────────────────────────────────────────────────────────────────────────────────────────────┤
│ [🔄 Run Full Diagnostic Scan]                                    [⚡ Execute Autonomous Auto-Fix All]  │
└────────────────────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 🎨 Design System & Theming Specifications

| Attribute | Specification |
|---|---|
| **Background** | `bg-slate-950` (Deep obsidian dark theme) |
| **Card Surfaces** | `bg-slate-900/90` with subtle border `border-slate-800` |
| **Primary Accent** | `text-cyan-400` / `bg-cyan-600` (High-tech quantitative cyan) |
| **Positive / Bullish** | `text-emerald-400` / `bg-emerald-950/60` `border-emerald-800` |
| **Negative / Bearish** | `text-rose-400` / `bg-rose-950/60` `border-rose-800` |
| **Neutral / Warning** | `text-amber-400` / `bg-amber-950/60` `border-amber-800` |
| **Typography** | Sans: Inter / System UI; Numeric & Tickers: Monospace (`font-mono`) |
| **Responsive Breakpoints** | Full adaptive support across Mobile (`sm`), Tablet (`md`), and Desktop Cockpit (`lg`, `xl`) |

---

*FINAGENT — Developed for high-conviction quantitative equity analysis and portfolio intelligence.*
