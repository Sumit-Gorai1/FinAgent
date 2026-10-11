# FINAGENT — Official Sources & Data Pipeline Registry

> **Document Type:** Live Data Sources, API Contracts, Valuation Formulas & Model Registry  
> **Classification:** Production Architecture & Data Transparency Reference  
> **Status:** Current & Actively Synchronized with App Capabilities  
> **Last Updated:** October 2026 (Reflecting Full ETF Tracking, Watchlist Add/Remove Engine, Calibri Typography Grading, & Dual-Exchange Feeds)

---

## 📌 Executive Summary

**FINAGENT** operates an autonomous, institutional-grade equity research and portfolio intelligence pipeline. All insights, quantitative metrics, market depth books, valuation assessments, news extractions, and multi-agent consensus decisions are grounded in verified, real-time data sources and mathematically proven quantitative frameworks.

This document serves as the single source of truth for:
1. **Exchange Market Data Feeds** (NSE & BSE)
2. **Exchange Traded Funds (ETFs) Pipeline** (60+ Indian & Global ETFs)
3. **Multi-Agent AI Intelligence Engine** (Gemini 2.5 API via `@google/genai`)
4. **Quantitative Valuation Models & Financial Formulas** (DCF, Graham, Piotroski, Altman, CAPM)
5. **Fresh News & Corporate Filings Feeds** (Strictly < 24-hour freshness)
6. **Dynamic Watchlist & Portfolio Persistence Engine** (Local storage schemas & state contracts)
7. **Calibri Typographic Hierarchy & Optical Grade Palette** (Font specifications & color grades)
8. **SEBI Compliance & Educational Framework**

---

## 1. 🏛️ Primary Exchange Market Data Feeds

FINAGENT ingests and reconciles tick-level equity and index market data from India's two premier national exchanges:

### 1.1 National Stock Exchange of India (NSE)
- **Primary Role:** Benchmark liquidity, 5-level market depth (Level-2 orderbook), volume-weighted average price (VWAP), intraday candlestick rendering, volatility index (India VIX).
- **Coverage:** 2,570+ listed equity scrips across Large-Cap, Mid-Cap, and Small-Cap segments.
- **Tick Ingestion Protocol:** High-throughput streaming tick bus with automated heartbeat polling (`30s`, `1m`, `5m`) and fallback WebSocket simulation.
- **Key Ingested Fields:**
  - `LTP` (Last Traded Price)
  - `Change` & `ChangePercent` (relative to previous market close)
  - `DayHigh`, `DayLow`, `52WeekHigh`, `52WeekLow`
  - `Volume`, `TotalTurnover` (in ₹ Crores)
  - `BestBid`, `BestAsk`, `BidSize`, `AskSize`, `Spread` (in ₹ and basis points)
  - `VWAP` (Intraday Volume-Weighted Average Price)

### 1.2 Bombay Stock Exchange (BSE)
- **Primary Role:** Secondary liquidity venue, 6-digit numeric scrip code resolution, inter-exchange arbitrage monitoring, dual-exchange orderbook reconciliation.
- **BSE Scrip Code Mapping Engine:**
  - `RELIANCE` → BSE Code: `500325` | Group: `A`
  - `TCS` → BSE Code: `532540` | Group: `A`
  - `HDFCBANK` → BSE Code: `500180` | Group: `A`
  - `INFY` → BSE Code: `500209` | Group: `A`
  - `ICICIBANK` → BSE Code: `532174` | Group: `A`
  - `TATAMOTORS` → BSE Code: `500570` | Group: `A`
  - `SBIN` → BSE Code: `500112` | Group: `A`
  - `BHARTIARTL` → BSE Code: `532454` | Group: `A`
  - `ITC` → BSE Code: `500875` | Group: `A`
  - `LT` → BSE Code: `500510` | Group: `A`
- **Dual-Exchange Arbitrage Engine:**
  - Computes $\Delta P = P_{NSE} - P_{BSE}$ in real time.
  - Generates cross-venue arbitrage alerts whenever spread exceeds round-trip transaction costs (STT, exchange turnover fees, GST, SEBI turnover charge).

---

## 2. 🪙 Exchange Traded Funds (ETFs) Pipeline

FINAGENT provides full-spectrum surveillance and valuation of over 60 Indian and International ETFs listed on NSE and BSE, with instant capital outlay calculations and category filtering:

### 2.1 ETF Universe by Category
| Asset Class | Benchmark Tickers | Underlying Index / Asset | Tracking Metric |
| :--- | :--- | :--- | :--- |
| **Broad Market Equities** | `NIFTYBEES`, `JUNIORBEES`, `MID150BEES`, `BSLNIFTY`, `SETFNIF50` | Nifty 50, Nifty Next 50, Nifty Midcap 150 | Intraday NAV (iNAV), Tracking Error (< 0.08%) |
| **Sectoral & Thematic** | `BANKBEES`, `ITBEES`, `PHARMABEES`, `AUTOIETF`, `INFRABEES`, `CPSEETF` | Nifty Bank, Nifty IT, Nifty Pharma, CPSE PSU Basket | Sectoral beta, constituent dividend yield |
| **Commodities** | `GOLDBEES`, `SILVERBEES`, `HDFCGOLD`, `AXISGOLD`, `ICICIGOLD` | Physical Gold (99.5% purity), Physical Silver | LBMA London Spot Fix + Customs Duty + USD/INR |
| **Global / International** | `MON100`, `MAFANG`, `HDFCNASDAQ`, `MOTILALSP500` | NASDAQ-100, NYSE FANG+ Index, S&P 500 Index | Currency transmission (USD/INR), foreign market hours |
| **Debt & Cash Equivalents** | `LIQUIDBEES`, `BHARATBOND`, `SETF10GILT`, `ICICILIQ` | Overnight MIBOR, AAA PSU Debt, 10-Year GOI G-Sec | Daily dividend reinvestment (Fractional units) |

### 2.2 Live ETF Analytical Properties
- **Indicative Intraday NAV (iNAV):** Computed continuously from underlying constituent basket ticks.
- **Tracking Error (TE):** Standard deviation of the daily excess return of the ETF relative to its benchmark index.
- **Total Expense Ratio (TER):** Annualized management fee deducted directly from NAV (ranging from 0.04% to 0.49%).
- **Arbitrage Premium / Discount:** Premium or discount of the market LTP relative to iNAV, indicating Authorized Participant (AP) liquidity efficiency.

---

## 3. 🤖 Multi-Agent AI Intelligence Engine

FINAGENT’s analytical core utilizes the modern `@google/genai` TypeScript SDK with model segregation:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                       FINAGENT MULTI-AGENT SWARM (10 AGENTS)                │
├─────────────────┬───────────────────────────────────────────────────────────┤
│ Agent 1         │ Master Pipeline Orchestrator                              │
│ Agent 2         │ Real-time Price & Level-2 Market Depth Sentinel           │
│ Agent 3         │ Quantitative Technical Setup & Indicator Quant            │
│ Agent 4         │ Fundamental Forensic & Financial Health Auditor           │
│ Agent 5         │ Fresh Current Market News Wire Agent (< 24h filter)       │
│ Agent 6         │ Macro-Economic Transmission & Monetary Policy Agent       │
│ Agent 7         │ Adversarial Bull Thesis Advocate                          │
│ Agent 8         │ Adversarial Bear Risk Inquisitor                          │
│ Agent 9         │ Investment Committee Consensus & Synthesis Engine         │
│ Agent 10        │ Autonomous Portfolio Rebalancer & Execution Agent         │
└─────────────────┴───────────────────────────────────────────────────────────┘
```

### 3.1 Model Routing & Governance
- **`gemini-2.5-flash`:** Deployed for high-frequency extraction, technical pattern validation, real-time news freshness triage (<24h), and real-time chat co-pilot responses.
- **`gemini-2.5-pro`:** Deployed for high-conviction adversarial bull-versus-bear stress testing, forensic balance sheet auditing, and Investment Committee scorecard formulation.
- **Zero Hallucination Protocol:** Financial figures (EPS, PE, Debt/Equity, Free Cash Flow, Book Value) are strictly derived from the audited data layer and injected into the prompt context; the LLM is prohibited from guessing financial constants.

---

## 4. 📐 Quantitative Valuation Models & Mathematical Formulas

All intrinsic value projections and margin of safety calculations in FINAGENT are computed using deterministic mathematical formulas:

### 4.1 Two-Stage Discounted Cash Flow (DCF) Model
$$V_0 = \sum_{t=1}^{n} \frac{\text{FCFF}_0 \times (1 + g_1)^t}{(1 + \text{WACC})^t} + \frac{\text{Terminal Value}_n}{(1 + \text{WACC})^n}$$

Where:
$$\text{Terminal Value}_n = \frac{\text{FCFF}_n \times (1 + g_2)}{\text{WACC} - g_2}$$
- $\text{FCFF}_0$: Audited Free Cash Flow to Firm (Operating Cash Flow minus Capital Expenditures).
- $g_1$: Stage 1 Short-Term Growth Rate (User parameterized via interactive slider: 5%–25%).
- $g_2$: Stage 2 Perpetual Terminal Growth Rate (Capped at Indian Long-term GDP trend: 4.5%–7.0%).
- $\text{WACC}$: Weighted Average Cost of Capital:
  $$\text{WACC} = \left(\frac{E}{V} \times K_e\right) + \left(\frac{D}{V} \times K_d \times (1 - T)\right)$$
  - $K_e = R_f + \beta \times [E(R_m) - R_f]$ (Capital Asset Pricing Model)
  - $R_f$: 10-Year Indian Government Benchmark Bond Yield (~7.05%).
  - $[E(R_m) - R_f]$: Indian Equity Risk Premium (~6.2%).

### 4.2 Graham Intrinsic Value Formula
For asset-heavy and stable-earning franchises:
$$V_{\text{Graham}} = \sqrt{22.5 \times \text{EPS} \times \text{BVPS}}$$
- $\text{EPS}$: Trailing Twelve Month Diluted Earnings Per Share.
- $\text{BVPS}$: Book Value Per Share.
- Constant $22.5$: Corresponds to Benjamin Graham's maximum recommended P/E of 15.0 multiplied by P/B of 1.5.

### 4.3 Margin of Safety (MoS)
$$\text{Margin of Safety (\%)} = \left(\frac{V_{\text{Intrinsic}} - P_{\text{Market}}}{V_{\text{Intrinsic}}}\right) \times 100\%$$
- **MoS $\ge +20\%$:** Institutional Value Opportunity (Green Grade).
- **$0\% \le \text{MoS} < +20\%$:** Fair Valuation Range (Neutral Amber Grade).
- **$\text{MoS} < 0\%$:** Premium / Overvalued Relative to Fundamentals (Rose Grade).

### 4.4 Piotroski F-Score (9-Point Accounting Forensic Test)
The Fundamental Agent evaluates 9 binary accounting signals:
1. **Profitability:**
   - Positive Net Income ($+1$)
   - Positive Operating Cash Flow ($+1$)
   - ROA higher than prior year ($+1$)
   - Operating Cash Flow $>$ Net Income (Accrual Quality) ($+1$)
2. **Leverage, Liquidity & Source of Funds:**
   - Lower Long-Term Debt-to-Equity ratio than prior year ($+1$)
   - Higher Current Ratio than prior year ($+1$)
   - Zero shares diluted via rights or equity issuance ($+1$)
3. **Operating Efficiency:**
   - Higher Gross Margin than prior year ($+1$)
   - Higher Asset Turnover ratio than prior year ($+1$)
- **Score 8–9:** High Quality / Sound Balance Sheet
- **Score 0–3:** Weak Quality / Potential Accounting Red Flags

---

## 5. 📰 Fresh News Wire & Corporate Regulatory Filings

FINAGENT enforces an **uncompromising news freshness policy**:

### 5.1 Strictly Fresh News Policy (< 24 Hours)
- **Rule:** Market news, commentary, and earnings disclosures older than 24 hours are automatically flagged as stale and discarded from the active news wire.
- **Rationale:** Institutional trading decisions rely on breaking catalysts; stale commentary creates false technical or fundamental signals.
- **Timestamp Display:** All wire entries carry explicit elapsed timestamps (`12m ago`, `2h ago`, `5h ago`) with a live pulsing freshness indicator.

### 5.2 Regulatory & Macro Sources
- **Exchange Corporate Announcements:** SEBI LODR Regulation 30 filings, board meeting outcomes, quarterly investor presentations.
- **Reserve Bank of India (RBI):** Monetary Policy Committee (MPC) repo rate decisions, cash reserve ratio (CRR) revisions, inflation expectations surveys.
- **Ministry of Statistics & Programme Implementation (MoSPI):** Consumer Price Index (CPI) and Index of Industrial Production (IIP).

---

## 6. 💾 Dynamic Watchlist & Portfolio Persistence Engine

### 6.1 Watchlist Add/Remove Engine
Users can freely add or remove **any stock or ETF** across the application:
1. **From Watchlist Monitor View:**
   - **"+ Add Stock or ETF" Modal:** Full search covering all 2,570+ stocks and 60+ ETFs with category tabs, quick curated pills, and custom ticker creation.
   - **Quick Inline Add Form:** Enter ticker symbol directly in table header with auto-resolution against master catalog.
   - **Row-Level Trash Action:** Immediate one-click removal with animated toast feedback.
2. **From Stock Research Cockpit:**
   - Header **"★ Watchlist"** toggle button dynamically updates state (Add/Remove) for the active stock or ETF.
3. **From All Indian Stocks Directory:**
   - Star button on every stock card and table row instantly toggles watchlist inclusion.

### 6.2 Browser Persistence Schema
| Storage Key | Data Type | Schema / Payload | Sync Trigger |
| :--- | :--- | :--- | :--- |
| `finagent_watchlist` | JSON Array | `WatchlistItem[]` (symbol, name, price, changePercent, score, isEtf, sector, thesisStatus) | On Add / Remove / Reorder |
| `finagent_portfolio_holdings` | JSON Array | `PortfolioHolding[]` (symbol, shares, avgBuyPrice, currentPrice, weightPercent, dayChange) | On Trade / Add / Trim / Remove |
| `finagent_cash_balance` | Number | Numeric cash balance in INR (e.g. `₹10,00,000`) | On Trade Execution / Adjustment |
| `finagent_paper_orders` | JSON Array | `PaperOrder[]` (id, symbol, type, shares, price, totalAmount, timestamp, reason) | On Simulated Order Execution |
| `finagent_price_alerts` | JSON Array | `PriceAlert[]` (id, symbol, targetPrice, condition, note, status) | On Alert Creation / Trigger / Delete |
| `finagent_user` | JSON Object | `UserProfile` (email, displayName, id, role) | On Email Login / Session Restore |

---

## 7. 🔤 Calibri Typography & Optical Grade Palette

FINAGENT features a bespoke typographic hierarchy built around **Calibri** (with metric-identical Carlito web fallback), providing exceptional readability for tabular financial data:

### 7.1 Font Weight Grades
| Grade Class | Weight Value | Primary Application |
| :--- | :--- | :--- |
| `.grade-light` | `300` | Secondary metadata, exchange timestamps, disclaimer subtexts |
| `.grade-regular` | `400` | Body copy, financial report narratives, thesis descriptions |
| `.grade-medium` | `500` | Table cell data, metric labels, navigation links |
| `.grade-semibold` | `600` | Column headers, financial badges, score tags |
| `.grade-bold` | `700` | Primary stock prices, hero statistics, section headings |
| `.grade-black` | `900` | Massive price displays, executive ticker symbols |

### 7.2 Financial Surface Color Grades
| Color Grade Class | Hex / Color Value | Contextual Meaning |
| :--- | :--- | :--- |
| `.text-grade-hero` | `#ffffff` (Pure White, Shadowed) | Prominent stock prices, consensus score numbers |
| `.text-grade-primary` | `#f1f5f9` (Slate 100) | Primary cards, headings, active values |
| `.text-grade-secondary` | `#cbd5e1` (Slate 300) | Metric values, subheadings |
| `.text-grade-muted` | `#94a3b8` (Slate 400) | Column labels, supporting quantitative context |
| `.text-grade-dim` | `#64748b` (Slate 500) | Inactive labels, subtle boundaries, timestamps |
| `.text-grade-bullish` | `#34d399` (Emerald 400 Glowing) | Positive day returns, Buy thesis, high MoS, score $\ge 75$ |
| `.text-grade-bearish` | `#fb7185` (Rose 400 Glowing) | Negative day returns, Sell/Trim thesis, negative MoS, score $< 60$ |
| `.text-grade-cyan` | `#22d3ee` (Cyan 400) | Real-time ticks, active agent indicators, interactive actions |
| `.text-grade-gold` | `#fbbf24` (Amber 400) | ETF asset badges, commodity tags, caution alerts |
| `.text-grade-violet` | `#a78bfa` (Purple 400) | System diagnostics, autonomous bug agent telemetry |

---

## 8. ⚖️ SEBI Regulatory Framework & Compliance Notice

- **Non-Advisory Mandate:** FINAGENT is an educational, algorithmic modeling, and simulated research environment. It does **not** provide SEBI-registered individualized investment advisory or portfolio management services under SEBI (Investment Advisers) Regulations, 2013.
- **Zero Real-Capital Risk:** All trading actions within the Paper Trading Lab, Autonomous Rebalancer, and Quick Trade buttons execute in a sandboxed virtual ledger with zero real-money settlement or brokerage connections.
- **User Due Diligence:** Users must consult SEBI-registered financial advisors before executing capital market investments. Historical backtests and model valuations are hypothetical and not guaranteed.

---

*FINAGENT Architecture Team — Continuous Innovation for Quantitative Equity Research*
