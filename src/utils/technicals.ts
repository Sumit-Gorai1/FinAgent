/**
 * Deterministic Financial and Technical Math Engine
 * FINAGENT: Programmatic calculations for indicators, risk, and portfolio analytics
 */

export function calculateSMA(prices: number[], period: number): number {
  if (prices.length < period) return prices[prices.length - 1] || 0;
  const slice = prices.slice(prices.length - period);
  const sum = slice.reduce((acc, val) => acc + val, 0);
  return Number((sum / period).toFixed(2));
}

export function calculateEMA(prices: number[], period: number): number {
  if (prices.length < period) return prices[prices.length - 1] || 0;
  const multiplier = 2 / (period + 1);
  let ema = calculateSMA(prices.slice(0, period), period);
  for (let i = period; i < prices.length; i++) {
    ema = (prices[i] - ema) * multiplier + ema;
  }
  return Number(ema.toFixed(2));
}

export function calculateRSI(prices: number[], period = 14): number {
  if (prices.length <= period) return 50;
  let gains = 0;
  let losses = 0;

  for (let i = 1; i <= period; i++) {
    const diff = prices[i] - prices[i - 1];
    if (diff >= 0) gains += diff;
    else losses += Math.abs(diff);
  }

  let avgGain = gains / period;
  let avgLoss = losses / period;

  for (let i = period + 1; i < prices.length; i++) {
    const diff = prices[i] - prices[i - 1];
    if (diff >= 0) {
      avgGain = (avgGain * (period - 1) + diff) / period;
      avgLoss = (avgLoss * (period - 1)) / period;
    } else {
      avgGain = (avgGain * (period - 1)) / period;
      avgLoss = (avgLoss * (period - 1) + Math.abs(diff)) / period;
    }
  }

  if (avgLoss === 0) return 100;
  const rs = avgGain / avgLoss;
  const rsi = 100 - 100 / (1 + rs);
  return Number(rsi.toFixed(1));
}

export function calculateBollingerBands(prices: number[], period = 20, multiplier = 2) {
  const sma = calculateSMA(prices, period);
  const slice = prices.slice(-period);
  const variance =
    slice.reduce((acc, val) => acc + Math.pow(val - sma, 2), 0) / period;
  const stdDev = Math.sqrt(variance);

  const upper = Number((sma + multiplier * stdDev).toFixed(2));
  const lower = Number((sma - multiplier * stdDev).toFixed(2));
  const bandwidth = Number((((upper - lower) / sma) * 100).toFixed(2));

  return { upper, middle: sma, lower, bandwidth };
}

export function calculateMACD(prices: number[]) {
  const ema12 = calculateEMA(prices, 12);
  const ema26 = calculateEMA(prices, 26);
  const macdLine = Number((ema12 - ema26).toFixed(2));
  // Approximate signal line
  const signalLine = Number((macdLine * 0.82).toFixed(2));
  const histogram = Number((macdLine - signalLine).toFixed(2));
  const signal: 'Bullish' | 'Bearish' | 'Neutral' =
    histogram > 0.5 ? 'Bullish' : histogram < -0.5 ? 'Bearish' : 'Neutral';

  return { macdLine, signalLine, histogram, signal };
}

export function calculateMaxDrawdown(prices: number[]): number {
  if (prices.length === 0) return 0;
  let peak = prices[0];
  let maxDrawdown = 0;

  for (const p of prices) {
    if (p > peak) peak = p;
    const dd = (peak - p) / peak;
    if (dd > maxDrawdown) maxDrawdown = dd;
  }

  return Number((maxDrawdown * 100).toFixed(1));
}

export function calculateAnnualizedVolatility(prices: number[]): number {
  if (prices.length < 2) return 15.0;
  const returns: number[] = [];
  for (let i = 1; i < prices.length; i++) {
    returns.push(Math.log(prices[i] / prices[i - 1]));
  }
  const mean = returns.reduce((a, b) => a + b, 0) / returns.length;
  const variance =
    returns.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / (returns.length - 1);
  const dailyVol = Math.sqrt(variance);
  const annualized = dailyVol * Math.sqrt(252) * 100;
  return Number(annualized.toFixed(1));
}

export function calculateCorrelation(seriesA: number[], seriesB: number[]): number {
  const n = Math.min(seriesA.length, seriesB.length);
  if (n < 2) return 0.5;
  const meanA = seriesA.slice(-n).reduce((a, b) => a + b, 0) / n;
  const meanB = seriesB.slice(-n).reduce((a, b) => a + b, 0) / n;

  let num = 0;
  let denA = 0;
  let denB = 0;

  for (let i = 0; i < n; i++) {
    const diffA = seriesA[seriesA.length - n + i] - meanA;
    const diffB = seriesB[seriesB.length - n + i] - meanB;
    num += diffA * diffB;
    denA += diffA * diffA;
    denB += diffB * diffB;
  }

  const denom = Math.sqrt(denA * denB);
  if (denom === 0) return 0;
  return Number((num / denom).toFixed(2));
}
