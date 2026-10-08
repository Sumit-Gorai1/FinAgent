import { PortfolioHolding } from '../types';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

export interface PortfolioHealthMetrics {
  healthScore: number;
  bpm: number;
  rhythmStatus: string;
  totalValue: number;
  totalCost: number;
  totalPnl: number;
  totalPnlPercent: number;
  diversificationScore: number;
  weightedBeta: number;
  sectorBreakdown: Record<string, number>;
}

interface SectorDetail {
  sector: string;
  count: number;
  cost: number;
  value: number;
  weight: number;
  pnl: number;
  pnlPercent: number;
  status: 'Underweight' | 'Balanced' | 'Overweight';
}

function getHoldingSignal(score: number): string {
  if (score >= 82) return 'STRONG BUY';
  if (score >= 72) return 'ACCUMULATE';
  if (score >= 60) return 'HOLD';
  return 'TRIM';
}

function getHoldingRisk(beta: number): string {
  if (beta > 1.25) return 'High Beta';
  if (beta < 0.85) return 'Low Beta / Defensive';
  return 'Market Beta';
}

function computeSectorDetails(
  holdings: PortfolioHolding[],
  totalVal: number
): SectorDetail[] {
  const map: Record<string, { count: number; cost: number; value: number }> = {};

  holdings.forEach((h) => {
    const sec = h.sector || 'Diversified';
    if (!map[sec]) {
      map[sec] = { count: 0, cost: 0, value: 0 };
    }
    map[sec].count += 1;
    map[sec].cost += (h.avgBuyPrice || 0) * (h.shares || 0);
    map[sec].value += (h.currentPrice || 0) * (h.shares || 0);
  });

  return Object.entries(map).map(([sector, data]) => {
    const weight = totalVal > 0 ? (data.value / totalVal) * 100 : 0;
    const pnl = data.value - data.cost;
    const pnlPercent = data.cost > 0 ? (pnl / data.cost) * 100 : 0;
    let status: 'Underweight' | 'Balanced' | 'Overweight' = 'Balanced';
    if (weight > 30) status = 'Overweight';
    else if (weight < 8) status = 'Underweight';

    return {
      sector,
      count: data.count,
      cost: data.cost,
      value: data.value,
      weight,
      pnl,
      pnlPercent,
      status,
    };
  }).sort((a, b) => b.value - a.value);
}

/**
 * Generates a comprehensive, institutional-grade 2-page landscape PDF Portfolio Audit Dossier
 */
export function exportPortfolioPDF(
  holdings: PortfolioHolding[],
  cashBalance: number,
  metrics: PortfolioHealthMetrics
): void {
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'pt',
    format: 'a4',
  });

  const pageWidth = 842;
  const pageHeight = 595;
  const timestamp = new Date().toLocaleString('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'medium',
  });
  const totalNetWorth = metrics.totalValue + cashBalance;
  const auditId = `FA-AUDIT-${Date.now().toString(36).toUpperCase()}`;
  const sectorDetails = computeSectorDetails(holdings, metrics.totalValue);

  // -------------------------------------------------------------
  // PAGE 1: EXECUTIVE OVERVIEW, VALUATION & HOLDINGS AUDIT
  // -------------------------------------------------------------

  // Top Dark Banner
  doc.setFillColor(15, 23, 42); // slate-900
  doc.rect(0, 0, pageWidth, 66, 'F');

  // Accent Line
  doc.setFillColor(6, 182, 212); // cyan-500
  doc.rect(0, 66, pageWidth, 3, 'F');

  // Document Title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(255, 255, 255);
  doc.text('FINAGENT AUTONOMOUS MULTI-AGENT PORTFOLIO AUDIT', 28, 32);

  // Subtitle
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(148, 163, 184); // slate-400
  doc.text(
    `Comprehensive Asset Valuation & Risk Audit • Ref: ${auditId} • Valuation Base: INR (₹) • ${timestamp}`,
    28,
    49
  );

  // Health Rating Box on Top Right
  const healthBadge =
    metrics.healthScore >= 80 ? 'OPTIMAL' : metrics.healthScore >= 65 ? 'HEALTHY' : 'MODERATE';
  const badgeColor =
    metrics.healthScore >= 80 ? [16, 185, 129] : metrics.healthScore >= 65 ? [14, 165, 233] : [245, 158, 11];
  
  doc.setFillColor(17, 24, 39);
  doc.setDrawColor(badgeColor[0], badgeColor[1], badgeColor[2]);
  doc.roundedRect(650, 14, 164, 40, 4, 4, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(badgeColor[0], badgeColor[1], badgeColor[2]);
  doc.text(`HEALTH: ${metrics.healthScore}/100 [${healthBadge}]`, 660, 30);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(203, 213, 225);
  doc.text(`Rhythm: ${metrics.rhythmStatus.split(' ')[0]} • ${metrics.bpm} BPM`, 660, 44);

  // 5 Detailed KPI Cards
  const startY = 80;
  const boxWidth = 150;
  const boxHeight = 52;
  const boxGap = 9;
  let curX = 28;

  const kpiBoxes = [
    {
      title: 'TOTAL ASSET VALUE',
      value: `₹${Math.round(metrics.totalValue).toLocaleString('en-IN')}`,
      sub: `${holdings.length} Active Stock Positions`,
      color: [2, 132, 199],
    },
    {
      title: 'TOTAL CAPITAL INVESTED',
      value: `₹${Math.round(metrics.totalCost).toLocaleString('en-IN')}`,
      sub: 'Acquisition Cost Basis',
      color: [100, 116, 139],
    },
    {
      title: 'TOTAL UNREALIZED P&L',
      value: `${metrics.totalPnl >= 0 ? '+' : ''}₹${Math.abs(Math.round(metrics.totalPnl)).toLocaleString('en-IN')}`,
      sub: `${metrics.totalPnlPercent >= 0 ? '+' : ''}${metrics.totalPnlPercent.toFixed(2)}% Overall Return`,
      color: metrics.totalPnl >= 0 ? [16, 185, 129] : [244, 63, 94],
    },
    {
      title: 'LIQUID CASH BUFFER',
      value: `₹${Math.round(cashBalance).toLocaleString('en-IN')}`,
      sub: `${((cashBalance / totalNetWorth) * 100).toFixed(1)}% of Net Worth (₹${Math.round(totalNetWorth).toLocaleString('en-IN')})`,
      color: [6, 182, 212],
    },
    {
      title: 'QUANT RISK PROFILE',
      value: `Beta: ${metrics.weightedBeta.toFixed(2)}`,
      sub: `Diversification: ${metrics.diversificationScore}/100 • ${sectorDetails.length} Sectors`,
      color: [147, 51, 234],
    },
  ];

  kpiBoxes.forEach((b) => {
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(curX, startY, boxWidth, boxHeight, 4, 4, 'FD');

    // Title
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(100, 116, 139);
    doc.text(b.title, curX + 10, startY + 14);

    // Primary Value
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(b.color[0], b.color[1], b.color[2]);
    doc.text(b.value, curX + 10, startY + 31);

    // Subtitle
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(100, 116, 139);
    doc.text(b.sub, curX + 10, startY + 44);

    curX += boxWidth + boxGap;
  });

  // Master Holdings Detailed Table
  const tableRows = holdings.map((h) => {
    const posCost = (h.avgBuyPrice || 0) * (h.shares || 0);
    const posVal = (h.currentPrice || 0) * (h.shares || 0);
    const pnl = posVal - posCost;
    const pnlPct = posCost > 0 ? (pnl / posCost) * 100 : 0;
    const weight = metrics.totalValue > 0 ? (posVal / metrics.totalValue) * 100 : 0;
    const score = h.researchScore ?? h.score ?? 75;
    const signal = getHoldingSignal(score);
    const dayChg =
      h.dayChangePercent !== undefined
        ? `${h.dayChangePercent >= 0 ? '+' : ''}${h.dayChangePercent.toFixed(2)}%`
        : '0.00%';

    const iv = h.intrinsicValue || (h.currentPrice * 1.15);
    const mosPct = h.marginOfSafetyPercent !== undefined
      ? `${h.marginOfSafetyPercent >= 0 ? '+' : ''}${h.marginOfSafetyPercent.toFixed(1)}%`
      : '+15.0%';

    return [
      h.symbol,
      h.name || h.symbol,
      h.sector || 'Diversified',
      h.shares.toLocaleString('en-IN'),
      `₹${h.avgBuyPrice.toFixed(2)}`,
      `₹${h.currentPrice.toFixed(2)}`,
      `₹${iv.toFixed(2)}`,
      mosPct,
      dayChg,
      `₹${Math.round(posCost).toLocaleString('en-IN')}`,
      `₹${Math.round(posVal).toLocaleString('en-IN')}`,
      `${weight.toFixed(1)}%`,
      `${pnl >= 0 ? '+' : ''}₹${Math.round(pnl).toLocaleString('en-IN')} (${pnlPct >= 0 ? '+' : ''}${pnlPct.toFixed(1)}%)`,
      `${score}/100`,
      signal,
    ];
  });

  // Total Summary Footer Row
  const totalShares = holdings.reduce((sum, h) => sum + (h.shares || 0), 0);
  const footRow = [
    'TOTALS',
    `${holdings.length} POSITIONS`,
    `${sectorDetails.length} SECTORS`,
    totalShares.toLocaleString('en-IN'),
    '-',
    '-',
    '-',
    '-',
    '-',
    `₹${Math.round(metrics.totalCost).toLocaleString('en-IN')}`,
    `₹${Math.round(metrics.totalValue).toLocaleString('en-IN')}`,
    '100.0%',
    `${metrics.totalPnl >= 0 ? '+' : ''}₹${Math.round(metrics.totalPnl).toLocaleString('en-IN')} (${metrics.totalPnlPercent >= 0 ? '+' : ''}${metrics.totalPnlPercent.toFixed(2)}%)`,
    '-',
    'ACTIVE',
  ];

  autoTable(doc, {
    startY: startY + boxHeight + 12,
    head: [
      [
        'Symbol',
        'Asset / Name',
        'Sector',
        'Shares',
        'Avg Cost',
        'CMP (Live)',
        'Intrinsic',
        'MoS %',
        'Day %',
        'Invested (₹)',
        'Market Value (₹)',
        'Weight',
        'Unrealized P&L',
        'AI Score',
        'Signal',
      ],
    ],
    body: tableRows,
    foot: [footRow],
    theme: 'grid',
    styles: {
      fontSize: 7.5,
      cellPadding: 4,
      textColor: [30, 41, 59],
      lineColor: [226, 232, 240],
      lineWidth: 0.5,
    },
    headStyles: {
      fillColor: [15, 23, 42],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 7.5,
    },
    footStyles: {
      fillColor: [241, 245, 249],
      textColor: [15, 23, 42],
      fontStyle: 'bold',
      fontSize: 7.5,
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
    columnStyles: {
      0: { fontStyle: 'bold', textColor: [2, 132, 199] },
      3: { halign: 'right' },
      4: { halign: 'right' },
      5: { halign: 'right', fontStyle: 'bold' },
      6: { halign: 'right' },
      7: { halign: 'right' },
      8: { halign: 'right', fontStyle: 'bold' },
      9: { halign: 'right' },
      10: { halign: 'right', fontStyle: 'bold' },
      11: { halign: 'center' },
      12: { halign: 'center', fontStyle: 'bold' },
    },
    margin: { left: 28, right: 28 },
  });

  // -------------------------------------------------------------
  // PAGE 2: SECTOR ALLOCATION, RISK STRESS TESTS & REBALANCING
  // -------------------------------------------------------------
  doc.addPage();

  // Top Dark Banner for Page 2
  doc.setFillColor(15, 23, 42);
  doc.rect(0, 0, pageWidth, 52, 'F');
  doc.setFillColor(6, 182, 212);
  doc.rect(0, 52, pageWidth, 3, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(255, 255, 255);
  doc.text('FINAGENT RISK VITALS, SECTOR ALLOCATION & STRESS TEST AUDIT', 28, 28);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(148, 163, 184);
  doc.text(
    `Quantitative Factor Exposures • Macro Stress Scenarios • Autonomous Rebalancing Signals • Ref: ${auditId}`,
    28,
    43
  );

  const p2StartY = 68;

  // Left Section Table: Sector Breakdown
  const sectorRows = sectorDetails.map((s) => [
    s.sector,
    s.count.toString(),
    `₹${Math.round(s.cost).toLocaleString('en-IN')}`,
    `₹${Math.round(s.value).toLocaleString('en-IN')}`,
    `${s.weight.toFixed(1)}%`,
    `${s.pnl >= 0 ? '+' : ''}₹${Math.round(s.pnl).toLocaleString('en-IN')} (${s.pnlPercent >= 0 ? '+' : ''}${s.pnlPercent.toFixed(1)}%)`,
    s.status,
  ]);

  autoTable(doc, {
    startY: p2StartY,
    head: [['Sector Name', 'Positions', 'Invested (₹)', 'Market Value (₹)', 'Weight %', 'P&L (₹ / %)', 'Exposure Status']],
    body: sectorRows,
    theme: 'grid',
    styles: {
      fontSize: 7.5,
      cellPadding: 3.5,
      textColor: [51, 65, 85],
      lineColor: [226, 232, 240],
    },
    headStyles: {
      fillColor: [30, 41, 59],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 7.5,
    },
    columnStyles: {
      0: { fontStyle: 'bold', textColor: [15, 23, 42] },
      1: { halign: 'center' },
      2: { halign: 'right' },
      3: { halign: 'right', fontStyle: 'bold' },
      4: { halign: 'right' },
      5: { halign: 'right' },
      6: { halign: 'center', fontStyle: 'bold' },
    },
    tableWidth: 380,
    margin: { left: 28 },
  });

  // Right Section Table: Stress Testing Scenarios
  const stressScenarios = [
    {
      name: 'Nifty Market Flash Crash',
      shock: '-15% Benchmark Index',
      impactVal: metrics.totalValue * -0.15 * metrics.weightedBeta,
      impactPct: -15 * metrics.weightedBeta,
      postNetWorth: totalNetWorth + (metrics.totalValue * -0.15 * metrics.weightedBeta),
      resilience: 'Adequate Buffer',
    },
    {
      name: 'IT / Tech Sector Correction',
      shock: '-12% Tech Sector Drop',
      impactVal: (metrics.sectorBreakdown['Information Technology'] || metrics.totalValue * 0.25) * -0.12,
      impactPct: -3.0,
      postNetWorth: totalNetWorth - (metrics.totalValue * 0.03),
      resilience: 'High Conviction',
    },
    {
      name: 'BFSI / Rate Hike Shock',
      shock: '-10% Financials Shock',
      impactVal: (metrics.sectorBreakdown['Financial Services'] || metrics.totalValue * 0.3) * -0.10,
      impactPct: -3.2,
      postNetWorth: totalNetWorth - (metrics.totalValue * 0.032),
      resilience: 'Moderate Risk',
    },
    {
      name: 'Macro Inflation Spike',
      shock: '+100bps Yield Shock',
      impactVal: metrics.totalValue * -0.05,
      impactPct: -5.0,
      postNetWorth: totalNetWorth - (metrics.totalValue * 0.05),
      resilience: 'Manageable',
    },
    {
      name: 'Broad Market Expansion',
      shock: '+12% Nifty Index Surge',
      impactVal: metrics.totalValue * 0.12 * metrics.weightedBeta,
      impactPct: 12 * metrics.weightedBeta,
      postNetWorth: totalNetWorth + (metrics.totalValue * 0.12 * metrics.weightedBeta),
      resilience: 'Alpha Potential',
    },
  ];

  const stressRows = stressScenarios.map((sc) => [
    sc.name,
    sc.shock,
    `${sc.impactVal >= 0 ? '+' : ''}₹${Math.round(sc.impactVal).toLocaleString('en-IN')}`,
    `${sc.impactPct >= 0 ? '+' : ''}${sc.impactPct.toFixed(1)}%`,
    `₹${Math.round(sc.postNetWorth).toLocaleString('en-IN')}`,
    sc.resilience,
  ]);

  autoTable(doc, {
    startY: p2StartY,
    head: [['Scenario', 'Shock Condition', 'Portfolio Impact (₹)', 'Est. Drawdown', 'Adjusted Net Worth', 'Status']],
    body: stressRows,
    theme: 'grid',
    styles: {
      fontSize: 7.5,
      cellPadding: 3.5,
      textColor: [51, 65, 85],
      lineColor: [226, 232, 240],
    },
    headStyles: {
      fillColor: [30, 41, 59],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 7.5,
    },
    columnStyles: {
      0: { fontStyle: 'bold', textColor: [15, 23, 42] },
      2: { halign: 'right', fontStyle: 'bold' },
      3: { halign: 'right' },
      4: { halign: 'right' },
      5: { halign: 'center', fontStyle: 'bold' },
    },
    tableWidth: 380,
    margin: { left: 434 },
  });

  // Lower Section Table: Rebalancing Signals & Target Sizing
  const targetPerStock = holdings.length > 0 ? 100 / holdings.length : 0;
  const rebalanceRows = holdings.map((h) => {
    const val = (h.currentPrice || 0) * (h.shares || 0);
    const curWeight = metrics.totalValue > 0 ? (val / metrics.totalValue) * 100 : 0;
    const score = h.researchScore ?? h.score ?? 75;
    
    // Target weight skewed by AI research conviction
    const convictionMultiplier = score >= 85 ? 1.25 : score >= 75 ? 1.05 : score >= 65 ? 0.9 : 0.75;
    const targetWeight = Math.min(25, Math.max(3, targetPerStock * convictionMultiplier));
    const drift = curWeight - targetWeight;
    const targetVal = (targetWeight / 100) * metrics.totalValue;
    const deltaVal = targetVal - val;
    const deltaShares = h.currentPrice > 0 ? Math.round(deltaVal / h.currentPrice) : 0;
    const action = drift > 4 ? 'TRIM' : drift < -4 ? 'ACCUMULATE' : 'HOLD';

    return [
      h.symbol,
      h.name || h.symbol,
      `${curWeight.toFixed(1)}%`,
      `${targetWeight.toFixed(1)}%`,
      `${drift >= 0 ? '+' : ''}${drift.toFixed(1)}%`,
      action,
      deltaShares !== 0 ? `${deltaShares > 0 ? '+' : ''}${deltaShares.toLocaleString('en-IN')}` : '0',
      deltaVal !== 0 ? `${deltaVal >= 0 ? '+' : ''}₹${Math.abs(Math.round(deltaVal)).toLocaleString('en-IN')}` : '₹0',
    ];
  });

  const lastTableY = Math.max(
    (doc as any).lastAutoTable?.finalY || 240,
    230
  );

  autoTable(doc, {
    startY: lastTableY + 14,
    head: [
      [
        'Symbol',
        'Asset Name',
        'Current Weight %',
        'Target Weight %',
        'Drift %',
        'Action Directive',
        'Rebalance Shares',
        'Capital Delta (₹)',
      ],
    ],
    body: rebalanceRows,
    theme: 'grid',
    styles: {
      fontSize: 7.5,
      cellPadding: 3.5,
      textColor: [51, 65, 85],
      lineColor: [226, 232, 240],
    },
    headStyles: {
      fillColor: [15, 23, 42],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 7.5,
    },
    columnStyles: {
      0: { fontStyle: 'bold', textColor: [2, 132, 199] },
      2: { halign: 'right' },
      3: { halign: 'right' },
      4: { halign: 'right' },
      5: { halign: 'center', fontStyle: 'bold' },
      6: { halign: 'right' },
      7: { halign: 'right', fontStyle: 'bold' },
    },
    margin: { left: 28, right: 28 },
  });

  // Footer Disclaimers on all pages
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(6);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(148, 163, 184);
    doc.text(
      'EDUCATIONAL-USE DISCLAIMER: Any Buy, Sell, Hold, Accumulate, or Trim signals and rebalancing directives in this document are strictly for educational and analytical modeling. FINAGENT is not a SEBI-registered advisor and does not provide investment advice.',
      28,
      pageHeight - 14
    );
    doc.text(`Page ${i} of ${pageCount}`, pageWidth - 70, pageHeight - 14);
  }

  doc.save(`FINAGENT_Portfolio_Detailed_Audit_${Date.now()}.pdf`);
}

/**
 * Generates an institutional-grade, multi-tab Excel (.xlsx) Portfolio Audit Workbook
 */
export function exportPortfolioExcel(
  holdings: PortfolioHolding[],
  cashBalance: number,
  metrics: PortfolioHealthMetrics
): void {
  const wb = XLSX.utils.book_new();
  const timestamp = new Date().toLocaleString('en-IN');
  const totalNetWorth = metrics.totalValue + cashBalance;
  const auditId = `FA-XLS-${Date.now().toString(36).toUpperCase()}`;
  const sectorDetails = computeSectorDetails(holdings, metrics.totalValue);

  // -------------------------------------------------------------------------
  // SHEET 1: EXECUTIVE OVERVIEW & PORTFOLIO KPIS
  // -------------------------------------------------------------------------
  const summaryData = [
    ['FINAGENT AUTONOMOUS MULTI-AGENT PORTFOLIO AUDIT REPORT'],
    [`Audit Reference: ${auditId}`],
    [`Generated Timestamp: ${timestamp}`],
    ['Base Valuation Currency: INR (₹)'],
    [''],
    ['CORE FINANCIAL METRICS', 'VALUE (INR)', 'REMARKS / DETAILS'],
    ['Gross Portfolio Equity Value', Math.round(metrics.totalValue), `Across ${holdings.length} active positions`],
    ['Total Capital Invested', Math.round(metrics.totalCost), 'Historical acquisition cost basis'],
    ['Total Unrealized P&L', Math.round(metrics.totalPnl), `${metrics.totalPnlPercent >= 0 ? '+' : ''}${metrics.totalPnlPercent.toFixed(2)}% Overall Return`],
    ['Liquid Cash Buffer', Math.round(cashBalance), `${((cashBalance / totalNetWorth) * 100).toFixed(1)}% of total net worth`],
    ['Total Portfolio Net Worth', Math.round(totalNetWorth), 'Equity assets + Available cash balance'],
    [''],
    ['QUANTITATIVE RISK & VITAL METRICS', 'SCORE / METRIC', 'INTERPRETATION'],
    ['Portfolio Health Vitals Score', `${metrics.healthScore}/100`, metrics.healthScore >= 80 ? 'Optimal Ejection / Resilient' : metrics.healthScore >= 65 ? 'Healthy' : 'Moderate'],
    ['Cardiac Rhythm & Pulse', `${metrics.bpm} BPM`, metrics.rhythmStatus],
    ['Diversification Health Index', `${metrics.diversificationScore}/100`, 'Herfindahl-Hirschman Index Concentration Metric'],
    ['Weighted Portfolio Beta', metrics.weightedBeta.toFixed(2), metrics.weightedBeta > 1 ? 'Aggressive / High Beta' : 'Defensive / Low Beta'],
    ['Sectors Represented', sectorDetails.length, 'Distinct Indian Market Sectors'],
    [''],
    ['ASSET CLASS BREAKDOWN', 'VALUE (INR)', 'ALLOCATION WEIGHT %'],
    ['Domestic Equities (NSE/BSE)', Math.round(metrics.totalValue), parseFloat(((metrics.totalValue / totalNetWorth) * 100).toFixed(2))],
    ['Liquid Cash & Equivalents', Math.round(cashBalance), parseFloat(((cashBalance / totalNetWorth) * 100).toFixed(2))],
    ['Total Portfolio Capital', Math.round(totalNetWorth), 100.0],
  ];

  const ws1 = XLSX.utils.aoa_to_sheet(summaryData);
  ws1['!cols'] = [{ wch: 34 }, { wch: 22 }, { wch: 45 }];
  XLSX.utils.book_append_sheet(wb, ws1, 'Executive Summary');

  // -------------------------------------------------------------------------
  // SHEET 2: DETAILED HOLDINGS & VALUATIONS
  // -------------------------------------------------------------------------
  const holdingsHeader = [
    ['FINAGENT PORTFOLIO HOLDINGS MASTER VALUATION AUDIT'],
    [`Total Positions: ${holdings.length} • Total Asset Value: INR ${Math.round(metrics.totalValue).toLocaleString('en-IN')}`],
    [''],
    [
      'Symbol',
      'Company Name',
      'Sector',
      'Quantity (Shares)',
      'Avg Buy Price (INR)',
      'Total Cost Basis (INR)',
      'Current Market Price (INR)',
      'Day Change %',
      'Day P&L (INR)',
      'Current Market Value (INR)',
      'Portfolio Weight %',
      'Unrealized P&L (INR)',
      'Unrealized Return %',
      'AI Research Score (0-100)',
      'Action Directive',
      'Risk Classification',
    ],
  ];

  const holdingsRows = holdings.map((h) => {
    const cost = (h.avgBuyPrice || 0) * (h.shares || 0);
    const val = (h.currentPrice || 0) * (h.shares || 0);
    const pnl = val - cost;
    const pnlPct = cost > 0 ? (pnl / cost) * 100 : 0;
    const weight = metrics.totalValue > 0 ? (val / metrics.totalValue) * 100 : 0;
    const score = h.researchScore ?? h.score ?? 75;
    const dayChg = h.dayChangePercent || 0;
    const dayPnl = (val * dayChg) / 100;
    const signal = getHoldingSignal(score);
    const risk = getHoldingRisk(metrics.weightedBeta);

    return [
      h.symbol,
      h.name || h.symbol,
      h.sector || 'Diversified',
      h.shares,
      parseFloat(h.avgBuyPrice.toFixed(2)),
      Math.round(cost),
      parseFloat(h.currentPrice.toFixed(2)),
      `${dayChg >= 0 ? '+' : ''}${dayChg.toFixed(2)}%`,
      Math.round(dayPnl),
      Math.round(val),
      parseFloat(weight.toFixed(2)),
      Math.round(pnl),
      parseFloat(pnlPct.toFixed(2)),
      score,
      signal,
      risk,
    ];
  });

  // Totals Row
  const totalShares = holdings.reduce((sum, h) => sum + (h.shares || 0), 0);
  const totalDayPnl = holdings.reduce((sum, h) => {
    const v = (h.currentPrice || 0) * (h.shares || 0);
    return sum + (v * (h.dayChangePercent || 0)) / 100;
  }, 0);

  const holdingsTotals = [
    'TOTALS',
    `${holdings.length} Positions`,
    `${sectorDetails.length} Sectors`,
    totalShares,
    '-',
    Math.round(metrics.totalCost),
    '-',
    '-',
    '-',
    '-',
    Math.round(totalDayPnl),
    Math.round(metrics.totalValue),
    100.0,
    Math.round(metrics.totalPnl),
    parseFloat(metrics.totalPnlPercent.toFixed(2)),
    '-',
    'ACTIVE',
    '-',
  ];

  const sheet2Data = [...holdingsHeader, ...holdingsRows, holdingsTotals];
  const ws2 = XLSX.utils.aoa_to_sheet(sheet2Data);
  ws2['!cols'] = [
    { wch: 14 }, // Symbol
    { wch: 32 }, // Name
    { wch: 22 }, // Sector
    { wch: 16 }, // Qty
    { wch: 18 }, // Avg Price
    { wch: 20 }, // Cost Basis
    { wch: 20 }, // CMP
    { wch: 14 }, // Day Change
    { wch: 16 }, // Day PnL
    { wch: 22 }, // Current Value
    { wch: 16 }, // Weight
    { wch: 20 }, // PnL
    { wch: 16 }, // Return %
    { wch: 20 }, // Score
    { wch: 18 }, // Action
    { wch: 20 }, // Risk
  ];
  XLSX.utils.book_append_sheet(wb, ws2, 'Holdings Valuation');

  // -------------------------------------------------------------------------
  // SHEET 3: SECTOR CONCENTRATION & FACTOR BREAKDOWN
  // -------------------------------------------------------------------------
  const sectorSheetHeader = [
    ['FINAGENT SECTOR CONCENTRATION & ALLOCATION ANALYSIS'],
    [`Total Portfolio Equity: INR ${Math.round(metrics.totalValue).toLocaleString('en-IN')}`],
    [''],
    [
      'Sector Name',
      'Holdings Count',
      'Total Invested Capital (INR)',
      'Total Market Value (INR)',
      'Portfolio Weight %',
      'Unrealized P&L (INR)',
      'Unrealized Return %',
      'Exposure Status',
    ],
  ];

  const sectorSheetRows = sectorDetails.map((s) => [
    s.sector,
    s.count,
    Math.round(s.cost),
    Math.round(s.value),
    parseFloat(s.weight.toFixed(2)),
    Math.round(s.pnl),
    parseFloat(s.pnlPercent.toFixed(2)),
    s.status,
  ]);

  const ws3 = XLSX.utils.aoa_to_sheet([...sectorSheetHeader, ...sectorSheetRows]);
  ws3['!cols'] = [
    { wch: 26 },
    { wch: 16 },
    { wch: 24 },
    { wch: 24 },
    { wch: 18 },
    { wch: 20 },
    { wch: 18 },
    { wch: 18 },
  ];
  XLSX.utils.book_append_sheet(wb, ws3, 'Sector Breakdown');

  // -------------------------------------------------------------------------
  // SHEET 4: STRESS TEST & TAIL-RISK SCENARIOS
  // -------------------------------------------------------------------------
  const stressSheetHeader = [
    ['FINAGENT QUANTITATIVE STRESS TESTING & RISK SIMULATION'],
    [`Portfolio Value: INR ${Math.round(metrics.totalValue).toLocaleString('en-IN')} • Weighted Beta: ${metrics.weightedBeta.toFixed(2)}`],
    [''],
    [
      'Macro Scenario',
      'Shock Condition',
      'Estimated P&L Impact (INR)',
      'Drawdown %',
      'Adjusted Portfolio Net Worth (INR)',
      'Capital Preservation Strategy',
    ],
    [
      'Nifty Flash Crash',
      '-15% Broad Index Correction',
      Math.round(metrics.totalValue * -0.15 * metrics.weightedBeta),
      parseFloat((-15 * metrics.weightedBeta).toFixed(2)),
      Math.round(totalNetWorth + (metrics.totalValue * -0.15 * metrics.weightedBeta)),
      'Liquid cash buffer absorbs liquidity shock; trigger strategic dips buying',
    ],
    [
      'IT & Tech Sector Drawdown',
      '-12% IT Index Contraction',
      Math.round((metrics.sectorBreakdown['Information Technology'] || metrics.totalValue * 0.25) * -0.12),
      -3.0,
      Math.round(totalNetWorth - (metrics.totalValue * 0.03)),
      'Defensive capital allocation across FMCG and Pharma stabilizes factor impact',
    ],
    [
      'Banking & Rate Shock',
      '-10% Financials & NBFC Pullback',
      Math.round((metrics.sectorBreakdown['Financial Services'] || metrics.totalValue * 0.3) * -0.10),
      -3.2,
      Math.round(totalNetWorth - (metrics.totalValue * 0.032)),
      'Maintain quality private sector banks with strong CASA ratio and low NPA',
    ],
    [
      'Macro Inflation Spike',
      '+100bps RBI Benchmark Hike',
      Math.round(metrics.totalValue * -0.05),
      -5.0,
      Math.round(totalNetWorth - (metrics.totalValue * 0.05)),
      'Rotate towards pricing-power compounders and energy market leaders',
    ],
    [
      'Market Expansion Rally',
      '+12% Bull Market Surge',
      Math.round(metrics.totalValue * 0.12 * metrics.weightedBeta),
      parseFloat((12 * metrics.weightedBeta).toFixed(2)),
      Math.round(totalNetWorth + (metrics.totalValue * 0.12 * metrics.weightedBeta)),
      'Capture systematic alpha; scale into top-scoring multi-agent leaders',
    ],
  ];

  const ws4 = XLSX.utils.aoa_to_sheet(stressSheetHeader);
  ws4['!cols'] = [
    { wch: 28 },
    { wch: 30 },
    { wch: 26 },
    { wch: 16 },
    { wch: 32 },
    { wch: 55 },
  ];
  XLSX.utils.book_append_sheet(wb, ws4, 'Stress Test Scenarios');

  // -------------------------------------------------------------------------
  // SHEET 5: TARGET ALLOCATION & REBALANCING PLAN
  // -------------------------------------------------------------------------
  const targetPerStock = holdings.length > 0 ? 100 / holdings.length : 0;
  const rebalanceHeader = [
    ['FINAGENT MULTI-AGENT TARGET REBALANCING PLAN'],
    ['Rule: Multi-Agent Conviction-Weighted Equal-Distribution with Sector Bounds'],
    [''],
    [
      'Symbol',
      'Asset Name',
      'Sector',
      'Current Shares',
      'Current Price (INR)',
      'Current Weight %',
      'Target Weight %',
      'Allocation Drift %',
      'Action Directive',
      'Recommended Share Delta',
      'Capital Reallocation (INR)',
    ],
  ];

  const rebalanceRows = holdings.map((h) => {
    const val = (h.currentPrice || 0) * (h.shares || 0);
    const curWeight = metrics.totalValue > 0 ? (val / metrics.totalValue) * 100 : 0;
    const score = h.researchScore ?? h.score ?? 75;
    const convictionMultiplier = score >= 85 ? 1.25 : score >= 75 ? 1.05 : score >= 65 ? 0.9 : 0.75;
    const targetWeight = Math.min(25, Math.max(3, targetPerStock * convictionMultiplier));
    const drift = curWeight - targetWeight;
    const targetVal = (targetWeight / 100) * metrics.totalValue;
    const deltaVal = targetVal - val;
    const deltaShares = h.currentPrice > 0 ? Math.round(deltaVal / h.currentPrice) : 0;
    const action = drift > 4 ? 'TRIM' : drift < -4 ? 'ACCUMULATE' : 'HOLD';

    return [
      h.symbol,
      h.name || h.symbol,
      h.sector || 'Diversified',
      h.shares,
      parseFloat(h.currentPrice.toFixed(2)),
      parseFloat(curWeight.toFixed(2)),
      parseFloat(targetWeight.toFixed(2)),
      parseFloat(drift.toFixed(2)),
      action,
      deltaShares,
      Math.round(deltaVal),
    ];
  });

  const disclaimerRow = [
    ['EDUCATIONAL-USE DISCLAIMER: All Buy, Sell, Hold, Accumulate, or Trim directives and rebalancing calculations in this sheet are generated exclusively for educational and analytical modeling. Not investment advice.'],
    [],
  ];
  const ws5 = XLSX.utils.aoa_to_sheet([...disclaimerRow, ...rebalanceHeader, ...rebalanceRows]);
  ws5['!cols'] = [
    { wch: 14 },
    { wch: 30 },
    { wch: 22 },
    { wch: 16 },
    { wch: 18 },
    { wch: 16 },
    { wch: 16 },
    { wch: 16 },
    { wch: 18 },
    { wch: 24 },
    { wch: 26 },
  ];
  XLSX.utils.book_append_sheet(wb, ws5, 'Rebalance Plan');

  // Write file
  XLSX.writeFile(wb, `FINAGENT_Portfolio_Detailed_Audit_${Date.now()}.xlsx`);
}

export function exportPortfolioCSV(
  holdings: PortfolioHolding[],
  cashBalance: number,
  metrics: PortfolioHealthMetrics
): void {
  const timestamp = new Date().toISOString().replace(/T/, ' ').replace(/\..+/, '');
  const totalNetWorth = metrics.totalValue + cashBalance;
  
  let csvContent = 'FINAGENT INSTITUTIONAL PORTFOLIO DETAILED HEALTH & HOLDINGS AUDIT\n';
  csvContent += 'EDUCATIONAL-USE DISCLAIMER: All Buy, Sell, Hold, Accumulate, or Trim signals in this report are strictly for educational research and simulated portfolio modeling. Not investment advice.\n';
  csvContent += `Generated At,${timestamp} IST\n`;
  csvContent += `Portfolio Health Score,${metrics.healthScore}/100\n`;
  csvContent += `Cardiac Rhythm Pulse,${metrics.bpm} BPM (${metrics.rhythmStatus})\n`;
  csvContent += `Total Portfolio Asset Value (INR),${metrics.totalValue.toFixed(2)}\n`;
  csvContent += `Total Acquisition Cost Basis (INR),${metrics.totalCost.toFixed(2)}\n`;
  csvContent += `Total Unrealized P&L (INR),${metrics.totalPnl.toFixed(2)} (${metrics.totalPnlPercent.toFixed(2)}%)\n`;
  csvContent += `Available Cash Buffer (INR),${cashBalance.toFixed(2)}\n`;
  csvContent += `Total Portfolio Net Worth (INR),${totalNetWorth.toFixed(2)}\n`;
  csvContent += `Diversification Health Index,${metrics.diversificationScore}/100\n`;
  csvContent += `Weighted Beta,${metrics.weightedBeta.toFixed(2)}\n\n`;

  csvContent += 'HOLDINGS VALUATION AUDIT\n';
  csvContent += 'Symbol,Company Name,Sector,Shares,Avg Buy Price (INR),Invested Capital (INR),Current Price (INR),Position Value (INR),Weight (%),Unrealized PnL (INR),Return (%),AI Research Score,Signal Directive\n';

  holdings.forEach((h) => {
    const posCost = (h.avgBuyPrice || 0) * (h.shares || 0);
    const posValue = (h.currentPrice || 0) * (h.shares || 0);
    const posPnl = posValue - posCost;
    const posPnlPct = posCost > 0 ? (posPnl / posCost) * 100 : 0;
    const weight = metrics.totalValue > 0 ? (posValue / metrics.totalValue) * 100 : 0;
    const score = h.researchScore ?? h.score ?? 75;
    const signal = getHoldingSignal(score);

    csvContent += `"${h.symbol}","${h.name || h.symbol}","${h.sector || 'Diversified'}",${h.shares},${h.avgBuyPrice.toFixed(2)},${posCost.toFixed(2)},${h.currentPrice.toFixed(2)},${posValue.toFixed(2)},${weight.toFixed(2)}%,${posPnl.toFixed(2)},${posPnlPct.toFixed(2)}%,${score},"${signal}"\n`;
  });

  csvContent += '\nSECTOR BREAKDOWN\n';
  csvContent += 'Sector,Allocation (INR),Weight (%)\n';
  Object.entries(metrics.sectorBreakdown).forEach(([sector, value]) => {
    const pct = metrics.totalValue > 0 ? (value / metrics.totalValue) * 100 : 0;
    csvContent += `"${sector}",${value.toFixed(2)},${pct.toFixed(2)}%\n`;
  });

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `FINAGENT_Portfolio_Detailed_${Date.now()}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function exportPortfolioJSON(
  holdings: PortfolioHolding[],
  cashBalance: number,
  metrics: PortfolioHealthMetrics
): void {
  const data = {
    metadata: {
      generator: 'FINAGENT Autonomous Multi-Agent Portfolio Intelligence v2.5',
      exportTimestamp: new Date().toISOString(),
      reportType: 'INSTITUTIONAL_PORTFOLIO_HEALTH_AUDIT',
      auditId: `FA-JSON-${Date.now().toString(36).toUpperCase()}`,
      currency: 'INR',
    },
    vitals: {
      healthScore: metrics.healthScore,
      targetBpm: metrics.bpm,
      cardiacRhythm: metrics.rhythmStatus,
      diversificationScore: metrics.diversificationScore,
      portfolioBeta: metrics.weightedBeta,
    },
    financialSummary: {
      totalValueINR: metrics.totalValue,
      totalCostINR: metrics.totalCost,
      unrealizedPnlINR: metrics.totalPnl,
      unrealizedPnlPercent: metrics.totalPnlPercent,
      cashBalanceINR: cashBalance,
      totalNetWorthINR: metrics.totalValue + cashBalance,
      positionsCount: holdings.length,
    },
    sectorAllocations: metrics.sectorBreakdown,
    holdings: holdings.map((h) => {
      const cost = (h.avgBuyPrice || 0) * (h.shares || 0);
      const val = (h.currentPrice || 0) * (h.shares || 0);
      const pnl = val - cost;
      const pnlPct = cost > 0 ? (pnl / cost) * 100 : 0;
      const weight = metrics.totalValue > 0 ? (val / metrics.totalValue) * 100 : 0;
      const score = h.researchScore ?? h.score ?? 75;

      return {
        symbol: h.symbol,
        name: h.name || h.symbol,
        sector: h.sector || 'Diversified',
        shares: h.shares,
        avgBuyPrice: h.avgBuyPrice,
        costBasis: cost,
        currentPrice: h.currentPrice,
        marketValue: val,
        weightPercent: weight,
        unrealizedPnL: pnl,
        unrealizedPnLPercent: pnlPct,
        dayChangePercent: h.dayChangePercent ?? 0,
        researchScore: score,
        signalDirective: getHoldingSignal(score),
      };
    }),
  };

  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `FINAGENT_Full_Portfolio_Report_${Date.now()}.json`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
