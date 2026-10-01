# FINAGENT — Autonomous Multi-Agent Stock Research & Portfolio Intelligence Platform

[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-blue.svg)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19.0-61dafb.svg)](https://react.dev/)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-v4-38bdf8.svg)](https://tailwindcss.com/)
[![Express](https://img.shields.io/badge/Backend-Express%204-black.svg)](https://expressjs.com/)
[![Google Gemini API](https://img.shields.io/badge/AI%20Engine-Gemini%20API%20%40google%2Fgenai-8e24aa.svg)](https://ai.google.dev/)
[![Exchanges](https://img.shields.io/badge/Exchange%20Coverage-NSE%20%7C%20BSE%20(2%2C570%2B)-success.svg)](https://www.nseindia.com/)

---

## 📌 Executive Overview

**FINAGENT** is an institutional-grade, full-stack quantitative equity research and dynamic portfolio intelligence workstation designed for Indian equity markets (**National Stock Exchange of India (NSE)** and **Bombay Stock Exchange (BSE)**) and global benchmark assets.

Rather than relying on generic black-box predictions, FINAGENT deploys an **Orchestrated Multi-Agent AI Architecture** comprising over 10 specialized independent analytical agents. These agents conduct parallel fundamental audits, rigorous technical analysis, macro-economic transmission modeling, strictly fresh current market news extraction, and adversarial bull-versus-bear stress testing before synthesizing findings into an institutional Investment Committee Scorecard.

FINAGENT combines real-time streaming market data, 6-digit BSE scrip resolution, Level-2 depth monitoring, autonomous portfolio rebalancing, a simulated paper trading lab, real-time price threshold alerts with sound notifications, and multi-rail Indian payment gateway integration (Razorpay, UPI, Stripe).

---

## 🏛️ Multi-Agent Architecture

FINAGENT mirrors an institutional hedge fund research department. Each agent runs independently, citations and mathematical proofs are strictly segregated from qualitative reasoning, and an adversarial debate chamber tests the thesis prior to committee consensus:

```
                               ┌────────────────────────────────┐
                               │  Live Market Feeds & Catalog   │
                               │   NSE & BSE (2,570+ Equities)  │
                               └───────────────┬────────────────┘
                                               │
                                               ▼
                              ┌──────────────────────────────────┐
                              │ Agent 1: Master Orchestrator     │
                              │ Pipeline Sequencing & Synthesis  │
                              └────────────────┬─────────────────┘
                                               │
          ┌─────────────────────┬──────────────┴───────┬─────────────────────┐
          ▼                     ▼                      ▼                     ▼
┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐
│ Agent 2: Price   │  │ Agent 3: Quants  │  │ Agent 4: Value   │  │ Agent 5: Fresh   │
│ & Level-2 Depth  │  │ Technical Setup  │  │ & Fundamentals   │  │ News Wire (<24h) │
└──────────────────┘  └──────────────────┘  └──────────────────┘  └──────────────────┘
          │                     │                      │                     │
          └─────────────────────┼──────────────────────┴─────────────────────┘
                                │
          ┌─────────────────────┼──────────────────────┬─────────────────────┐
          ▼                     ▼                      ▼                     ▼
┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐
│ Agent 6: Macro & │  │ Agent 7: Risk &  │  │ Agent 8 & 9:     │  │ Agent 10: Proof  │
│ Sector Pipeline  │  │ Drawdown Guard   │  │ Bull/Bear Debate │  │ & Audit Verifier │
└──────────────────┘  └──────────────────┘  └──────────────────┘  └──────────────────┘
                                │
                                ▼
              ┌─────────────────────────────────────┐
              │ Investment Committee Consensus (0-100)│
              │ High-Conviction Research Directives │
              └──────────────────┬──────────────────┘
                                 │
                                 ▼
              ┌─────────────────────────────────────┐
              │ Agent 14: Autonomous Rebalancer     │
              │ Portfolio Realignment & Trade Directives
              └─────────────────────────────────────┘
```

### Agent Roles & Specifications:
1. **Agent 1 — Master Orchestrator**: Ingests user directives, retrieves market data, sequences analytical workflows, and aggregates the final consensus.
2. **Agent 2 — Level-2 Market Depth & Order Flow**: Monitors bid/ask spreads, order book imbalances, and trading session states (regular hours 09:15–15:30 IST vs. after-market).
3. **Agent 3 — Quantitative Technical Analyst**: Computes programmatic technical indicators: 20/50/200 SMAs, 21 EMA, RSI (14-period), Bollinger Bands, MACD, and breakout levels.
4. **Agent 4 — Fundamental Forensic Auditor**: Evaluates balance sheet quality, debt-to-equity trajectory, ROCE, ROE, 3-year revenue/profit CAGR, and Free Cash Flow durability.
5. **Agent 5 — Fresh News Intelligence Wire**: Continuously scans financial press wires (LiveMint, Economic Times, Reuters, CNBC-TV18, Business Standard) strictly within the active trading session (`< 24h`). Stale or 1-day-old news is discarded.
6. **Agent 6 — Macro & Sector Sensitivity Engine**: Models external transmission variables including interest rate policies, currency forex fluctuations, commodity input prices, and sectoral growth trends.
7. **Agent 7 — Risk Management & Capital Guard**: Calculates drawdown vulnerabilities, Beta metrics, downside risk hurdles, and stop-loss boundaries.
8. **Agents 8 & 9 — Adversarial Bull vs. Bear Debate Chamber**: Two strictly adversarial agents pit positive catalysts against critical vulnerabilities in an unconstrained debate.
9. **Agent 10 — Verifier & Independent Auditor**: Validates citations, verifies computational bounds, ensures no hallucinations, and logs proof audit trails.
10. **Agent 14 — Autonomous Portfolio Rebalancer**: Evaluates multi-asset portfolios against quantitative investment models (Alpha Conviction, Balanced Growth, Capital Preservation, Equal Weight), calculating exact share reallocations, drift percentages, and execution costs.

---

## 🚀 Key Modules & Cockpits

### 1. Stock Research Cockpit (`StockResearchView`)
- Comprehensive research dashboard for any of the 2,570+ listed companies.
- Real-time price banner with bid/ask spreads, live tick indicator, 52-week range, and market cap.
- Multi-timeframe interactive candlestick and financial charts with volume and technical overlays.
- Sub-tabs for:
  - **Price & Technical Chart**: Interactive charting, moving averages, RSI, and MACD.
  - **DCF Financial Model**: Interactive discounted cash flow sensitivity analysis with adjustable growth, discount rate, terminal growth, and target P/E sliders.
  - **Price Alerts**: Real-time conditional alert triggers (`≥` or `≤`) with browser/audio chimes.
  - **AI Copilot**: Context-aware generative assistant powered by Gemini API, capable of answering qualitative questions and recommending strategic stop-loss / breakout alerts.
  - **Technical Indicators**: Statistical breakdown of trend momentum and moving average crossovers.
  - **Fundamental Audit**: Annual and quarterly financial metrics (Revenue, EBITDA, Net Profit, EPS, ROCE, FCF).
  - **Current Market News Wire**: Real-time RSS financial intelligence strictly filtered for fresh articles from today (`< 24 hours`).
  - **Sector & Macro Transmission**: Visual transmission diagram from company to sector, rates, and net impact.
  - **Bull vs. Bear Debate**: Side-by-side arguments with cited evidence and projected upside/downside bands.
  - **Risk Manager Matrix**: Critical vulnerabilities, tail risks, and safety hurdles.
  - **Agent Memory & Audit Logs**: Full chronological transcript of agent actions and evidence.

### 2. All Listed Companies Directory (`IndianStocksDirectoryView` & Modal)
- Instantaneous search, filter, and pagination covering **all 2,584 listed companies** across the NSE and BSE.
- Search by ticker, company legal name, 6-digit BSE scrip code (e.g. `500325` for Reliance, `532540` for TCS), or ISIN.
- Categorization by industry sector (Banking & Financials, IT, Energy, Auto & EV, Pharmaceuticals, FMCG, Metals, Infrastructure, Defence, etc.).
- Dual-listing indicators (`NSE & BSE Dual` vs. `BSE Exclusive`).
- Live batch polling to refresh current market prices across visible companies.

### 3. Industry Sector Heatmap (`SectorHeatmap`)
- Color-coded performance visualization mapping market sectors and equities.
- Real-time tracking of sector trends, average daily percentage changes, and top gainers/losers.
- Available as a dedicated full-page view and embedded directly within the Stock Research cockpit.

### 4. Portfolio Intelligence Cockpit (`PortfolioIntelligence`)
- Real-time portfolio tracking: Total Portfolio Value, Day's P&L, Overall Unrealized Gain/Loss, and Cash Balance.
- Interactive multi-asset allocation and sector exposure charts.
- Portfolio Risk Matrix, Monte Carlo stress simulation, and VaR (Value at Risk) bounds.
- Portfolio Heartbeat Monitor with automated health scoring.
- Position Action Modal for quick Buy, Trim, Edit, and Delete operations.
- Export portfolio reports to professional **PDF (jsPDF-AutoTable)** and **Excel (XLSX)** with one click.

### 5. Autonomous Portfolio Rebalancer (`AutonomousRebalancer`)
- Rebalances portfolios according to institutional models:
  - **Multi-Agent Alpha Conviction Model**: Dynamically overweights top research scorers (80+) and trims lower-conviction holdings (<70).
  - **Institutional Balanced Growth Model**: Limits sector exposure to 25% max with fundamental tilts.
  - **Defensive Capital Preservation Model**: Prioritizes low-beta large-cap cash-flow leaders.
  - **Systematic Equal-Weight Model**: Allocates evenly across positions.
  - **Custom Model**: User-defined allocation weights.
- Calculates exact trade turnover, net cash requirement, STT/brokerage estimations, and generate institutional execution rationales.

### 6. Continuous Watchlist & Trigger Engine (`WatchlistMonitor`)
- Real-time monitoring of watchlisted securities.
- Automated triggers: Volume spikes, RSI extreme overbought/oversold, moving average crosses, and price breakouts.
- Built-in audio alerts via Web Audio synthesizer chimes.

### 7. Paper Trading Lab & Simulation (`PaperTradingLab`)
- Virtual trading engine seeded with **₹10,00,000 Virtual INR**.
- Limit and market paper order routing with simulated execution, slippage, and P&L tracking.
- Quantitative backtesting engine testing multi-agent alpha strategies over 1–5 year horizons against the NIFTY 50 benchmark.

### 8. Subscription Billing & Payment Gateway Hub (`SubscriptionBillingHub`)
- Three commercial subscription tiers: **Retail Investor**, **Pro Quant Investor**, and **Institutional Desk**.
- Native multi-currency Indian Rupee (INR) payment processing:
  - **Razorpay**: Direct INR gateway with auto-generated order IDs, checkout modal integration, and GST invoicing.
  - **UPI Collect**: Support for Google Pay, PhonePe, Paytm, and BHIM VPA handles.
  - **Stripe**: International and domestic card checkout sessions.
  - **Instant Sandbox Simulator**: One-click test validation for immediate demo provisioning.

### 9. Autonomous System Bug Agent (`BugAgentModal` & `server/bugAgent.ts`)
- Built-in self-healing diagnostic agent.
- Scans system files, verifies quote endpoints, benchmarks live market prices, and detects schema discrepancies.
- One-click "Auto-Fix All" button for automated platform self-repair.

### 10. Authentication & Security (`AuthModal`)
- Email authentication with 6-digit OTP verification and secure password login.
- Session persistence via LocalStorage and Bearer token headers.
- Tier entitlement synchronization.

---

## 🔌 API Gateway Specification

The application runs a unified full-stack architecture powered by Express and Vite. Below is the API reference:

### Real-Time Live Market Data
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/live-market/status` | Current trading session state (Open / Closed / Regular Hours) |
| `GET` | `/api/live-market/quote/:symbol` | Real-time quote for any NSE/BSE symbol or 6-digit BSE code |
| `GET` | `/api/live-market/quotes?symbols=...` | Batch quote resolver with auto-retry and multi-exchange routing |
| `GET` | `/api/live-market/candles/:symbol` | OHLC historical candle data (1D, 1W, 1M, 1Y, 5Y) |
| `GET` | `/api/live-market/news/:symbol` | Real-time RSS news intelligence strictly filtered to `< 24h` fresh releases |
| `GET` | `/api/live-market/stream` | Server-Sent Events (SSE) live price streaming connection |
| `GET` | `/api/market-benchmarks` | Key Indian & global indices (NIFTY 50, SENSEX, BANK NIFTY, NASDAQ) |

### Direct NSE & BSE Pipeline
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/exchange-pipeline/status` | Exchange connectivity status and latency metrics |
| `GET` | `/api/exchange-pipeline/indices` | Major exchange indices overview |
| `GET` | `/api/exchange-pipeline/all-stocks` | Paginated catalog of all 2,584 listed equities |
| `GET` | `/api/exchange-pipeline/depth/:symbol` | 5-level bid/ask market depth and order book |
| `GET` | `/api/exchange-pipeline/breadth` | Market advances, declines, and 52-week highs/lows ratio |
| `GET` | `/api/exchange-pipeline/stream` | SSE feed for exchange tick pipeline |

### Multi-Agent AI & Research
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/analyze` | Multi-agent orchestrated analysis powered by Google Gemini API |
| `POST` | `/api/ai-assistant` | Interactive AI research assistant with price alert recommendation logic |
| `POST` | `/api/portfolio/rebalance-advisor` | Agent 14 quantitative portfolio rebalancing engine |
| `POST` | `/api/paper-trade` | Virtual paper trade execution and order logging |
| `POST` | `/api/backtest` | Multi-year strategy backtest simulation against NIFTY 50 |

### Subscriptions & Indian Payment Gateways
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/subscription/plans` | Active subscription tiers and payment gateway capabilities |
| `POST` | `/api/subscription/razorpay/create-order` | Create Razorpay order in INR Paise |
| `POST` | `/api/subscription/razorpay/verify-payment` | Verify Razorpay HMAC signature and generate GST invoice |
| `POST` | `/api/subscription/upi/collect-request` | Dispatch UPI collect request (PhonePe, GPay, Paytm) |
| `POST` | `/api/subscription/checkout` | Create Stripe checkout session |
| `GET` | `/api/subscription/status` | Retrieve active subscription tier, dates, and billing history |
| `POST` | `/api/subscription/verify-session` | Verify completed session and upgrade account tier |
| `POST` | `/api/subscription/cancel` | Cancel active recurring subscription |

### Autonomous Bug Agent
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/bug-agent/audit` | Run full platform diagnostic scan |
| `POST` | `/api/bug-agent/auto-fix` | Execute automated self-healing across detected issues |
| `POST` | `/api/bug-agent/fix-bug` | Repair specific bug by identifier |
| `GET` | `/api/bug-agent/benchmark-prices` | Compare current cached prices against live exchange benchmarks |

### User Authentication
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/auth/send-code` | Dispatch 6-digit email OTP |
| `POST` | `/api/auth/login` | Authenticate via OTP or password |
| `GET` | `/api/auth/me` | Validate session token and return user profile |
| `POST` | `/api/auth/logout` | Terminate session |

---

## 🛠️ Technology Stack

| Layer | Technologies |
|---|---|
| **Frontend UI** | React 19, TypeScript, Tailwind CSS v4, Motion (Framer Motion), Lucide Icons |
| **Data Visualization** | Recharts, Custom Financial Canvas Charts, Dynamic Market Strips |
| **Backend Server** | Node.js, Express 4, TypeScript, TSX runtime, Server-Sent Events (SSE) |
| **AI & LLM Engine** | `@google/genai` TypeScript SDK (Gemini 3.8 Flash, Gemini 3.1 Flash Lite, Gemini Flash Latest with automatic failover) |
| **Market Data Feeds** | Yahoo Finance Chart API, Google News RSS Wires, NSE/BSE Direct Pipeline Gateway |
| **Payment Gateways** | Razorpay SDK, Stripe SDK, UPI Collect Protocol |
| **Export Engines** | jsPDF, jsPDF-AutoTable (PDF Reports), SheetJS XLSX (Excel Spreadsheets) |
| **Build & Bundling** | Vite 6, esbuild |

---

## 💻 Getting Started

### Prerequisites
- Node.js (v18.0.0 or higher)
- npm or bun

### Installation
```bash
# Clone the repository
git clone <repo-url>
cd finagent

# Install dependencies
npm install
```

### Environment Configuration
Create a `.env` file in the project root (reference `.env.example`):
```env
PORT=3000
NODE_ENV=development

# Google Gemini API Key for multi-agent synthesis and AI Copilot
GEMINI_API_KEY=your_gemini_api_key_here

# Payment Gateway Keys (Optional for live payments; sandbox works out of the box)
RAZORPAY_KEY_ID=
RAZORPAY_KEY_SECRET=
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
```

### Running Locally
```bash
# Start the full-stack development server (Express + Vite on Port 3000)
npm run dev

# Open your browser at http://localhost:3000
```

### Production Build
```bash
# Compile frontend assets and bundle backend server
npm run build

# Launch the compiled production server
npm start
```

### Code Quality & Validation
```bash
# Run TypeScript compilation audit
npm run lint
```

---

## ⚠️ Regulatory & Compliance Notice

FINAGENT is engineered strictly for **financial research, quantitative market modeling, and investor education**. It is **not** a SEBI-registered Investment Adviser (RIA) or Research Analyst (RA). Outputs generated by autonomous multi-agent algorithms, DCF models, and sentiment analyzers should not be construed as individualized investment, tax, or legal advice. Capital investments in equities and derivatives are subject to market risks. Always perform independent due diligence before committing financial capital.

---

## 📄 License

Proprietary and confidential. Developed for institutional equity analysis and algorithmic market intelligence. All rights reserved.
