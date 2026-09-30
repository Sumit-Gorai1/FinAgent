import React, { useState, useMemo, useRef, useCallback } from 'react';
import {
  TrendingUp,
  TrendingDown,
  BarChart2,
  Activity,
  Layers,
  Maximize2,
  Minimize2,
  ExternalLink,
  Eye,
  EyeOff,
  Sliders,
  Crosshair,
  ShieldAlert,
  Zap,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import { StockResearchData } from '../types';
import { generateCandleChartData, CandleDataPoint } from '../utils/stockDataHelper';
import { TradingViewChart } from './TradingViewChart';

interface FinancialChartProps {
  stock: StockResearchData;
  height?: number;
}

export const FinancialChart: React.FC<FinancialChartProps> = ({
  stock,
  height = 440,
}) => {
  const [chartType, setChartType] = useState<'candlestick' | 'area' | 'tradingview'>('candlestick');
  const [timeframe, setTimeframe] = useState<'1D' | '1W' | '1M' | '3M' | '1Y'>('1M');
  
  // Technical Overlays & Oscillators State
  const [showSMA20, setShowSMA20] = useState(true);
  const [showSMA50, setShowSMA50] = useState(false);
  const [showEMA21, setShowEMA21] = useState(true);
  const [showBollinger, setShowBollinger] = useState(false);
  const [showSupportResistance, setShowSupportResistance] = useState(true);
  const [showVolume, setShowVolume] = useState(true);
  const [showRSI, setShowRSI] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Crosshair Tracking
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [crosshair, setCrosshair] = useState<{
    x: number;
    y: number;
    price: number;
    candleIndex: number;
  } | null>(null);

  // Generate verified dynamic multi-timeframe candles anchored to stock.price
  const data: CandleDataPoint[] = useMemo(() => {
    return generateCandleChartData(stock, timeframe);
  }, [stock, timeframe]);

  // Active display point (either crosshair candle or latest candle)
  const activePoint = useMemo(() => {
    if (crosshair && data[crosshair.candleIndex]) {
      return data[crosshair.candleIndex];
    }
    return data[data.length - 1];
  }, [crosshair, data]);

  // Price Domain Calculations
  const supportLvl = stock.technicals?.supportLevel || stock.price * 0.96;
  const resistanceLvl = stock.technicals?.resistanceLevel || stock.price * 1.04;

  const minPrice = useMemo(() => {
    const dataLows = data.map((d) => Math.min(d.low, d.lowerBB || d.low));
    if (showSupportResistance) dataLows.push(supportLvl);
    const min = Math.min(...dataLows);
    return Math.floor(min * 0.992);
  }, [data, showSupportResistance, supportLvl]);

  const maxPrice = useMemo(() => {
    const dataHighs = data.map((d) => Math.max(d.high, d.upperBB || d.high));
    if (showSupportResistance) dataHighs.push(resistanceLvl);
    const max = Math.max(...dataHighs);
    return Math.ceil(max * 1.008);
  }, [data, showSupportResistance, resistanceLvl]);

  const priceRange = Math.max(1, maxPrice - minPrice);

  // Max volume for volume bars & volume SMA
  const maxVolume = useMemo(() => {
    return Math.max(...data.map((d) => d.volume), 1);
  }, [data]);

  // Current market price line position
  const cmpY = useMemo(() => {
    return 20 + ((maxPrice - stock.price) / priceRange) * 240;
  }, [maxPrice, stock.price, priceRange]);

  // Support & Resistance Y positions
  const supY = 20 + ((maxPrice - supportLvl) / priceRange) * 240;
  const resY = 20 + ((maxPrice - resistanceLvl) / priceRange) * 240;

  // Handle Crosshair movement on SVG
  const handleMouseMove = useCallback(
    (e: React.MouseEvent<SVGSVGElement>) => {
      if (!svgRef.current || data.length === 0) return;
      const rect = svgRef.current.getBoundingClientRect();
      const clientX = e.clientX - rect.left;
      const clientY = e.clientY - rect.top;

      // Map clientX (0..rect.width) to SVG coordinate (0..1000)
      const svgX = (clientX / rect.width) * 1000;
      const clampedSvgX = Math.max(5, Math.min(945, svgX));

      // Map clientY to price
      const normY = Math.max(0, Math.min(1, (clientY / rect.height)));
      const calculatedPrice = maxPrice - normY * priceRange;

      // Find nearest candle
      const ratio = (clampedSvgX - 5) / 940;
      const nearestIdx = Math.max(0, Math.min(data.length - 1, Math.round(ratio * (data.length - 1))));

      setCrosshair({
        x: clampedSvgX,
        y: Math.max(15, Math.min(275, (clientY / rect.height) * 300)),
        price: calculatedPrice,
        candleIndex: nearestIdx,
      });
    },
    [data, maxPrice, priceRange]
  );

  const handleMouseLeave = useCallback(() => {
    setCrosshair(null);
  }, []);

  const isPositiveOverall = stock.change >= 0;

  // Candle price change from previous or open
  const candleChange = activePoint ? activePoint.close - activePoint.open : 0;
  const candleChangePct = activePoint && activePoint.open > 0 ? (candleChange / activePoint.open) * 100 : 0;

  // Chart Container Content
  const renderChartBody = () => (
    <div className="w-full flex-1 flex flex-col justify-between select-none">
      {chartType === 'tradingview' ? (
        <TradingViewChart symbol={stock.symbol} height={isFullscreen ? 650 : height} theme="dark" />
      ) : chartType === 'candlestick' ? (
        /* ================= CANDLESTICK SVG SUITE ================= */
        <div className="w-full flex-1 flex flex-col justify-between">
          {/* Main Price Canvas */}
          <div className="relative w-full h-[280px] sm:h-[300px] overflow-hidden">
            <svg
              ref={svgRef}
              className="w-full h-full overflow-visible cursor-crosshair"
              viewBox="0 0 1000 300"
              preserveAspectRatio="none"
              onMouseMove={handleMouseMove}
              onMouseLeave={handleMouseLeave}
            >
              <defs>
                {/* Bollinger Bands Shaded Fill */}
                <linearGradient id="bbBandGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.12" />
                  <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.04" />
                </linearGradient>
              </defs>

              {/* Horizontal Gridlines & Price Ticks */}
              {[0, 0.25, 0.5, 0.75, 1].map((pct, idx) => {
                const y = 20 + pct * 240;
                const priceVal = maxPrice - pct * priceRange;
                return (
                  <g key={idx}>
                    <line
                      x1="0"
                      y1={y}
                      x2="945"
                      y2={y}
                      stroke="#1e293b"
                      strokeDasharray="4 4"
                      strokeWidth="1"
                    />
                    <text
                      x="952"
                      y={y + 4}
                      fill="#64748b"
                      fontSize="10"
                      fontFamily="'Calibri', 'Carlito', Candara, 'Segoe UI', Arial, sans-serif"
                    >
                      {priceVal.toFixed(1)}
                    </text>
                  </g>
                );
              })}

              {/* Institutional Support & Resistance Levels */}
              {showSupportResistance && (
                <g>
                  {/* Resistance Band */}
                  {resY >= 10 && resY <= 280 && (
                    <g>
                      <line
                        x1="0"
                        y1={resY}
                        x2="945"
                        y2={resY}
                        stroke="#f43f5e"
                        strokeDasharray="3 3"
                        strokeWidth="1.2"
                        opacity="0.8"
                      />
                      <rect
                        x="948"
                        y={resY - 8}
                        width="48"
                        height="14"
                        rx="3"
                        fill="#881337"
                      />
                      <text
                        x="952"
                        y={resY + 3}
                        fill="#fecdd3"
                        fontSize="9"
                        fontWeight="bold"
                        fontFamily="'Calibri', 'Carlito', Candara, 'Segoe UI', Arial, sans-serif"
                      >
                        R: {resistanceLvl.toFixed(0)}
                      </text>
                    </g>
                  )}

                  {/* Support Band */}
                  {supY >= 10 && supY <= 280 && (
                    <g>
                      <line
                        x1="0"
                        y1={supY}
                        x2="945"
                        y2={supY}
                        stroke="#10b981"
                        strokeDasharray="3 3"
                        strokeWidth="1.2"
                        opacity="0.8"
                      />
                      <rect
                        x="948"
                        y={supY - 8}
                        width="48"
                        height="14"
                        rx="3"
                        fill="#064e3b"
                      />
                      <text
                        x="952"
                        y={supY + 3}
                        fill="#a7f3d0"
                        fontSize="9"
                        fontWeight="bold"
                        fontFamily="'Calibri', 'Carlito', Candara, 'Segoe UI', Arial, sans-serif"
                      >
                        S: {supportLvl.toFixed(0)}
                      </text>
                    </g>
                  )}
                </g>
              )}

              {/* Bollinger Bands Shaded Area */}
              {showBollinger && data.length > 1 && (
                <g>
                  {/* Area polygon between Upper and Lower BB */}
                  <polygon
                    points={[
                      ...data.map((d, i) => {
                        const x = (i / (data.length - 1)) * 940 + 5;
                        const y = 20 + ((maxPrice - (d.upperBB || d.close)) / priceRange) * 240;
                        return `${x},${Math.max(10, Math.min(280, y))}`;
                      }),
                      ...[...data].reverse().map((d, i) => {
                        const revIdx = data.length - 1 - i;
                        const x = (revIdx / (data.length - 1)) * 940 + 5;
                        const y = 20 + ((maxPrice - (d.lowerBB || d.close)) / priceRange) * 240;
                        return `${x},${Math.max(10, Math.min(280, y))}`;
                      }),
                    ].join(' ')}
                    fill="url(#bbBandGradient)"
                  />
                  {/* Upper BB Line */}
                  <path
                    d={data
                      .map((d, i) => {
                        const x = (i / (data.length - 1)) * 940 + 5;
                        const y = 20 + ((maxPrice - (d.upperBB || d.close)) / priceRange) * 240;
                        return `${i === 0 ? 'M' : 'L'} ${x} ${Math.max(10, Math.min(280, y))}`;
                      })
                      .join(' ')}
                    fill="none"
                    stroke="#38bdf8"
                    strokeWidth="1"
                    strokeDasharray="2 2"
                    opacity="0.8"
                  />
                  {/* Lower BB Line */}
                  <path
                    d={data
                      .map((d, i) => {
                        const x = (i / (data.length - 1)) * 940 + 5;
                        const y = 20 + ((maxPrice - (d.lowerBB || d.close)) / priceRange) * 240;
                        return `${i === 0 ? 'M' : 'L'} ${x} ${Math.max(10, Math.min(280, y))}`;
                      })
                      .join(' ')}
                    fill="none"
                    stroke="#38bdf8"
                    strokeWidth="1"
                    strokeDasharray="2 2"
                    opacity="0.8"
                  />
                </g>
              )}

              {/* SMA 20 Overlay Path */}
              {showSMA20 && data.length > 1 && (
                <path
                  d={data
                    .map((d, i) => {
                      const x = (i / (data.length - 1)) * 940 + 5;
                      const y = 20 + ((maxPrice - d.sma20) / priceRange) * 240;
                      return `${i === 0 ? 'M' : 'L'} ${x} ${Math.max(10, Math.min(280, y))}`;
                    })
                    .join(' ')}
                  fill="none"
                  stroke="#fbbf24"
                  strokeWidth="1.8"
                  strokeDasharray="3 3"
                />
              )}

              {/* SMA 50 Overlay Path */}
              {showSMA50 && data.length > 1 && (
                <path
                  d={data
                    .map((d, i) => {
                      const x = (i / (data.length - 1)) * 940 + 5;
                      const y = 20 + ((maxPrice - d.sma50) / priceRange) * 240;
                      return `${i === 0 ? 'M' : 'L'} ${x} ${Math.max(10, Math.min(280, y))}`;
                    })
                    .join(' ')}
                  fill="none"
                  stroke="#c084fc"
                  strokeWidth="1.8"
                  strokeDasharray="4 4"
                />
              )}

              {/* EMA 21 Fast Trendline */}
              {showEMA21 && data.length > 1 && (
                <path
                  d={data
                    .map((d, i) => {
                      const x = (i / (data.length - 1)) * 940 + 5;
                      const val = d.ema21 || d.close;
                      const y = 20 + ((maxPrice - val) / priceRange) * 240;
                      return `${i === 0 ? 'M' : 'L'} ${x} ${Math.max(10, Math.min(280, y))}`;
                    })
                    .join(' ')}
                  fill="none"
                  stroke="#06b6d4"
                  strokeWidth="1.5"
                  opacity="0.85"
                />
              )}

              {/* Current Market Price (CMP) Reference Line */}
              {cmpY >= 10 && cmpY <= 280 && (
                <g>
                  <line
                    x1="0"
                    y1={cmpY}
                    x2="945"
                    y2={cmpY}
                    stroke={isPositiveOverall ? '#10b981' : '#f43f5e'}
                    strokeDasharray="2 2"
                    strokeWidth="1.2"
                  />
                  <rect
                    x="948"
                    y={cmpY - 8}
                    width="48"
                    height="15"
                    rx="3"
                    fill={isPositiveOverall ? '#059669' : '#dc2626'}
                  />
                  <text
                    x="951"
                    y={cmpY + 3}
                    fill="#ffffff"
                    fontSize="9"
                    fontWeight="bold"
                    fontFamily="'Calibri', 'Carlito', Candara, 'Segoe UI', Arial, sans-serif"
                  >
                    {stock.currency}{stock.price.toFixed(1)}
                  </text>
                </g>
              )}

              {/* Candlesticks Rendering */}
              {data.map((candle, idx) => {
                const total = data.length;
                const candleWidth = Math.max(4, Math.min(22, 740 / total));
                const x = (idx / (total - 1 || 1)) * 940 + 5;

                const isGreen = candle.close >= candle.open;
                const candleColor = isGreen ? '#10b981' : '#f43f5e';

                const yHigh = 20 + ((maxPrice - candle.high) / priceRange) * 240;
                const yLow = 20 + ((maxPrice - candle.low) / priceRange) * 240;
                const yOpen = 20 + ((maxPrice - candle.open) / priceRange) * 240;
                const yClose = 20 + ((maxPrice - candle.close) / priceRange) * 240;

                const bodyY = Math.min(yOpen, yClose);
                const bodyHeight = Math.max(2, Math.abs(yClose - yOpen));

                const isCrosshairActive = crosshair && crosshair.candleIndex === idx;

                return (
                  <g key={idx} className="cursor-pointer">
                    {/* High-Low Wick Line */}
                    <line
                      x1={x}
                      y1={yHigh}
                      x2={x}
                      y2={yLow}
                      stroke={candleColor}
                      strokeWidth={isCrosshairActive ? '2.2' : '1.2'}
                    />

                    {/* Open-Close Candle Body */}
                    <rect
                      x={x - candleWidth / 2}
                      y={bodyY}
                      width={candleWidth}
                      height={bodyHeight}
                      fill={candleColor}
                      rx="1"
                      stroke={isCrosshairActive ? '#ffffff' : candleColor}
                      strokeWidth={isCrosshairActive ? '1.5' : '0.5'}
                    />

                    {/* Candle Hover Point marker */}
                    {isCrosshairActive && (
                      <circle
                        cx={x}
                        cy={yClose}
                        r="3.5"
                        fill="#ffffff"
                        stroke={candleColor}
                        strokeWidth="2"
                      />
                    )}
                  </g>
                );
              })}

              {/* Interactive Crosshair Lines & Cursor Label */}
              {crosshair && (
                <g className="pointer-events-none">
                  {/* Vertical Crosshair Line */}
                  <line
                    x1={crosshair.x}
                    y1="10"
                    x2={crosshair.x}
                    y2="280"
                    stroke="#94a3b8"
                    strokeDasharray="3 3"
                    strokeWidth="1"
                  />
                  {/* Horizontal Crosshair Line */}
                  <line
                    x1="0"
                    y1={crosshair.y}
                    x2="945"
                    y2={crosshair.y}
                    stroke="#94a3b8"
                    strokeDasharray="3 3"
                    strokeWidth="1"
                  />
                  {/* Active Crosshair Price Tag on Right Axis */}
                  <rect
                    x="948"
                    y={crosshair.y - 8}
                    width="48"
                    height="16"
                    rx="3"
                    fill="#0f172a"
                    stroke="#475569"
                    strokeWidth="1"
                  />
                  <text
                    x="951"
                    y={crosshair.y + 4}
                    fill="#f8fafc"
                    fontSize="9.5"
                    fontWeight="bold"
                    fontFamily="'Calibri', 'Carlito', Candara, 'Segoe UI', Arial, sans-serif"
                  >
                    {stock.currency}{crosshair.price.toFixed(1)}
                  </text>
                </g>
              )}
            </svg>
          </div>

          {/* Sub-Chart 1: Volume Histogram with 20-Period Moving Average */}
          {showVolume && (
            <div className="h-14 w-full pt-1.5 border-t border-slate-800/80 relative">
              <div className="absolute top-1 left-2 z-10 flex items-center gap-2 text-[10px] font-mono text-slate-400">
                <span>VOL: <strong className="text-slate-200">{(activePoint.volume / 1000).toFixed(1)}K</strong></span>
                {activePoint.volSma && (
                  <span className="text-amber-400/90">SMA20: {(activePoint.volSma / 1000).toFixed(1)}K</span>
                )}
              </div>
              <svg
                className="w-full h-full"
                viewBox="0 0 1000 50"
                preserveAspectRatio="none"
              >
                {/* Volume Bars */}
                {data.map((candle, idx) => {
                  const total = data.length;
                  const candleWidth = Math.max(3, Math.min(18, 700 / total));
                  const x = (idx / (total - 1 || 1)) * 940 + 5;
                  const isGreen = candle.close >= candle.open;
                  const volHeight = Math.max(2, (candle.volume / maxVolume) * 40);
                  const y = 48 - volHeight;
                  const isCrosshairActive = crosshair && crosshair.candleIndex === idx;

                  return (
                    <rect
                      key={idx}
                      x={x - candleWidth / 2}
                      y={y}
                      width={candleWidth}
                      height={volHeight}
                      fill={isGreen ? '#10b981' : '#f43f5e'}
                      fillOpacity={isCrosshairActive ? '1' : '0.45'}
                      rx="1"
                    />
                  );
                })}

                {/* Volume 20-Period SMA Line */}
                {data.length > 1 && (
                  <path
                    d={data
                      .map((d, i) => {
                        const x = (i / (data.length - 1)) * 940 + 5;
                        const smaVal = d.volSma || d.volume;
                        const y = 48 - Math.max(2, (smaVal / maxVolume) * 40);
                        return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
                      })
                      .join(' ')}
                    fill="none"
                    stroke="#f59e0b"
                    strokeWidth="1.2"
                    strokeDasharray="2 2"
                    opacity="0.8"
                  />
                )}
              </svg>
            </div>
          )}

          {/* Sub-Chart 2: RSI Oscillator Panel (14-Period) */}
          {showRSI && (
            <div className="h-16 w-full pt-1.5 border-t border-slate-800/80 relative">
              <div className="absolute top-1 left-2 z-10 flex items-center gap-2 text-[10px] font-mono">
                <span className="text-cyan-400 font-bold">RSI(14):</span>
                <strong className={
                  (activePoint.rsi || 50) >= 70
                    ? 'text-rose-400'
                    : (activePoint.rsi || 50) <= 30
                    ? 'text-emerald-400'
                    : 'text-slate-200'
                }>
                  {(activePoint.rsi || 55.4).toFixed(1)}
                </strong>
                <span className="text-[9px] text-slate-400">
                  {(activePoint.rsi || 50) >= 70
                    ? '• Overbought'
                    : (activePoint.rsi || 50) <= 30
                    ? '• Oversold'
                    : '• Balanced'}
                </span>
              </div>
              <svg
                className="w-full h-full"
                viewBox="0 0 1000 60"
                preserveAspectRatio="none"
              >
                {/* 70 Overbought line */}
                <line x1="0" y1="18" x2="945" y2="18" stroke="#f43f5e" strokeDasharray="3 3" strokeWidth="1" opacity="0.6" />
                <text x="952" y="21" fill="#f43f5e" fontSize="8" fontFamily="'Calibri', 'Carlito', Candara, 'Segoe UI', Arial, sans-serif">70</text>

                {/* 50 Midline */}
                <line x1="0" y1="30" x2="945" y2="30" stroke="#475569" strokeDasharray="2 2" strokeWidth="0.8" opacity="0.5" />

                {/* 30 Oversold line */}
                <line x1="0" y1="42" x2="945" y2="42" stroke="#10b981" strokeDasharray="3 3" strokeWidth="1" opacity="0.6" />
                <text x="952" y="45" fill="#10b981" fontSize="8" fontFamily="'Calibri', 'Carlito', Candara, 'Segoe UI', Arial, sans-serif">30</text>

                {/* RSI Shaded Channel 30..70 */}
                <rect x="0" y="18" width="945" height="24" fill="#6366f1" fillOpacity="0.05" />

                {/* RSI Curve */}
                {data.length > 1 && (
                  <path
                    d={data
                      .map((d, i) => {
                        const x = (i / (data.length - 1)) * 940 + 5;
                        const rsi = d.rsi || 50;
                        // Map RSI 0..100 to y 60..0
                        const y = 60 - (rsi / 100) * 60;
                        return `${i === 0 ? 'M' : 'L'} ${x} ${Math.max(4, Math.min(56, y))}`;
                      })
                      .join(' ')}
                    fill="none"
                    stroke="#a855f7"
                    strokeWidth="1.8"
                  />
                )}
              </svg>
            </div>
          )}

          {/* Bottom Dates Axis */}
          <div className="flex items-center justify-between text-[11px] font-mono text-slate-500 pt-1.5 border-t border-slate-800">
            {data
              .filter((_, i) => i === 0 || i === Math.floor(data.length / 4) || i === Math.floor(data.length / 2) || i === Math.floor((3 * data.length) / 4) || i === data.length - 1)
              .map((d, i) => (
                <span key={i}>{d.date}</span>
              ))}
          </div>
        </div>
      ) : (
        /* ================= RECHARTS AREA CHART ================= */
        <div className="w-full h-full min-h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="stockPriceGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="date" stroke="#64748b" tick={{ fontSize: 11 }} />
              <YAxis
                domain={['auto', 'auto']}
                stroke="#64748b"
                tick={{ fontSize: 11 }}
                tickFormatter={(val) => `${stock.currency}${val}`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#0f172a',
                  borderColor: '#334155',
                  borderRadius: '8px',
                  fontSize: '12px',
                  fontFamily: "'Calibri', 'Carlito', Candara, 'Segoe UI', Arial, sans-serif",
                }}
                labelStyle={{ color: '#94a3b8', fontWeight: 600 }}
                formatter={(val: any) => [`${stock.currency}${Number(val).toFixed(2)}`, 'Price']}
              />
              <Area
                type="monotone"
                dataKey="close"
                name="Close Price"
                stroke="#06b6d4"
                strokeWidth={2.5}
                fillOpacity={1}
                fill="url(#stockPriceGradient)"
              />
              {showSMA20 && (
                <Area
                  type="monotone"
                  dataKey="sma20"
                  name="SMA 20"
                  stroke="#fbbf24"
                  strokeWidth={1.8}
                  fill="none"
                  strokeDasharray="4 4"
                />
              )}
              {showSMA50 && (
                <Area
                  type="monotone"
                  dataKey="sma50"
                  name="SMA 50"
                  stroke="#c084fc"
                  strokeWidth={1.8}
                  fill="none"
                  strokeDasharray="4 4"
                />
              )}
              {showEMA21 && (
                <Area
                  type="monotone"
                  dataKey="ema21"
                  name="EMA 21"
                  stroke="#38bdf8"
                  strokeWidth={1.5}
                  fill="none"
                />
              )}
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );

  return (
    <>
      <div className="w-full max-w-full rounded-2xl bg-slate-900 border border-slate-800 shadow-xl overflow-hidden p-3 sm:p-5 flex flex-col gap-3">
        {/* Top Header Controls */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-3 border-b border-slate-800">
          {/* Left: Stock Ticker + Live OHLC Ribbon */}
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-base font-bold text-white font-mono flex items-center gap-2">
                <BarChart2 className="w-4 h-4 text-cyan-400" />
                <span>{stock.symbol}</span>
                <span className="text-xs text-slate-400 font-sans font-normal truncate max-w-[120px] sm:max-w-[200px]">
                  ({stock.name})
                </span>
              </span>

              <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-emerald-950/80 text-emerald-300 border border-emerald-700/80 inline-flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                LIVE CHART
              </span>

              <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-slate-800 text-slate-300 border border-slate-700 inline-flex items-center gap-1">
                <Crosshair className="w-3 h-3 text-cyan-400" />
                Crosshair Active
              </span>
            </div>

            {/* Active Candle Hover Info Ribbon */}
            {activePoint && (
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs font-mono mt-1.5 text-slate-300">
                <span>
                  <span className="text-slate-500">O: </span>
                  <strong className="text-slate-200">{stock.currency}{activePoint.open.toFixed(2)}</strong>
                </span>
                <span>
                  <span className="text-slate-500">H: </span>
                  <strong className="text-emerald-400">{stock.currency}{activePoint.high.toFixed(2)}</strong>
                </span>
                <span>
                  <span className="text-slate-500">L: </span>
                  <strong className="text-rose-400">{stock.currency}{activePoint.low.toFixed(2)}</strong>
                </span>
                <span>
                  <span className="text-slate-500">C: </span>
                  <strong className={activePoint.close >= activePoint.open ? 'text-emerald-400' : 'text-rose-400'}>
                    {stock.currency}{activePoint.close.toFixed(2)}
                  </strong>
                </span>
                <span>
                  <span className="text-slate-500">Chg: </span>
                  <strong className={candleChange >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                    {candleChange >= 0 ? '+' : ''}{candleChange.toFixed(2)} ({candleChangePct.toFixed(2)}%)
                  </strong>
                </span>
                <span>
                  <span className="text-slate-500">Vol: </span>
                  <span className="text-cyan-300">{(activePoint.volume / 1000).toFixed(1)}K</span>
                </span>
                <span className="text-slate-400 text-[11px] bg-slate-800/60 px-1.5 py-0.5 rounded">
                  {activePoint.date}
                </span>
              </div>
            )}
          </div>

          {/* Right: Chart Engine Selector & View Actions */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Chart View Modes */}
            <div className="flex items-center p-1 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono">
              <button
                onClick={() => setChartType('candlestick')}
                className={`px-2.5 py-1 rounded-lg font-bold flex items-center gap-1.5 transition-all ${
                  chartType === 'candlestick'
                    ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title="Interactive Candlestick Chart (OHLC)"
              >
                <BarChart2 className="w-3.5 h-3.5" />
                Candles
              </button>

              <button
                onClick={() => setChartType('area')}
                className={`px-2.5 py-1 rounded-lg font-bold flex items-center gap-1.5 transition-all ${
                  chartType === 'area'
                    ? 'bg-cyan-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title="Area Line Chart"
              >
                <Activity className="w-3.5 h-3.5" />
                Area
              </button>

              <button
                onClick={() => setChartType('tradingview')}
                className={`px-2.5 py-1 rounded-lg font-bold flex items-center gap-1.5 transition-all ${
                  chartType === 'tradingview'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title="TradingView Studio Embed"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                TV Studio
              </button>
            </div>

            {/* Timeframe Selector */}
            <div className="flex items-center p-1 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono">
              {(['1D', '1W', '1M', '3M', '1Y'] as const).map((tf) => (
                <button
                  key={tf}
                  onClick={() => setTimeframe(tf)}
                  className={`px-2 py-1 rounded-lg font-bold transition-all ${
                    timeframe === tf
                      ? 'bg-slate-700 text-white shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {tf}
                </button>
              ))}
            </div>

            {/* Maximize Fullscreen Toggle */}
            <button
              onClick={() => setIsFullscreen(true)}
              className="p-1.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-400 hover:text-white transition-colors"
              title="Maximize Technical Chart"
            >
              <Maximize2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Indicators Toolbar (Toggles for SMA, EMA, Bollinger Bands, S/R, Volume, RSI) */}
        {chartType !== 'tradingview' && (
          <div className="flex flex-wrap items-center justify-between gap-2 p-2 rounded-xl bg-slate-950/70 border border-slate-800 text-xs font-mono">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[11px] text-slate-400 flex items-center gap-1 font-sans">
                <Sliders className="w-3.5 h-3.5 text-cyan-400" />
                Overlays:
              </span>

              {/* SMA 20 Toggle */}
              <button
                onClick={() => setShowSMA20(!showSMA20)}
                className={`px-2 py-0.5 rounded text-[11px] transition-all flex items-center gap-1 ${
                  showSMA20
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold'
                    : 'bg-slate-900 text-slate-500 border border-slate-800 hover:text-slate-400'
                }`}
              >
                <span className="w-2 h-0.5 bg-amber-400 rounded-full"></span>
                SMA 20
              </button>

              {/* SMA 50 Toggle */}
              <button
                onClick={() => setShowSMA50(!showSMA50)}
                className={`px-2 py-0.5 rounded text-[11px] transition-all flex items-center gap-1 ${
                  showSMA50
                    ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40 font-bold'
                    : 'bg-slate-900 text-slate-500 border border-slate-800 hover:text-slate-400'
                }`}
              >
                <span className="w-2 h-0.5 bg-purple-400 rounded-full"></span>
                SMA 50
              </button>

              {/* EMA 21 Toggle */}
              <button
                onClick={() => setShowEMA21(!showEMA21)}
                className={`px-2 py-0.5 rounded text-[11px] transition-all flex items-center gap-1 ${
                  showEMA21
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-bold'
                    : 'bg-slate-900 text-slate-500 border border-slate-800 hover:text-slate-400'
                }`}
              >
                <span className="w-2 h-0.5 bg-cyan-400 rounded-full"></span>
                EMA 21
              </button>

              {/* Bollinger Bands Toggle */}
              <button
                onClick={() => setShowBollinger(!showBollinger)}
                className={`px-2 py-0.5 rounded text-[11px] transition-all flex items-center gap-1 ${
                  showBollinger
                    ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40 font-bold'
                    : 'bg-slate-900 text-slate-500 border border-slate-800 hover:text-slate-400'
                }`}
              >
                <Layers className="w-3 h-3 text-sky-400" />
                Bollinger Bands
              </button>

              {/* Support & Resistance Toggle */}
              <button
                onClick={() => setShowSupportResistance(!showSupportResistance)}
                className={`px-2 py-0.5 rounded text-[11px] transition-all flex items-center gap-1 ${
                  showSupportResistance
                    ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 font-bold'
                    : 'bg-slate-900 text-slate-500 border border-slate-800 hover:text-slate-400'
                }`}
              >
                <span className="w-2 h-0.5 bg-indigo-400 rounded-full"></span>
                Key S/R Pivots
              </button>
            </div>

            {/* Sub-panels (Volume & RSI) */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowVolume(!showVolume)}
                className={`px-2 py-0.5 rounded text-[11px] transition-all flex items-center gap-1 ${
                  showVolume
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold'
                    : 'bg-slate-900 text-slate-500 border border-slate-800 hover:text-slate-400'
                }`}
              >
                Volume + SMA
              </button>

              <button
                onClick={() => setShowRSI(!showRSI)}
                className={`px-2 py-0.5 rounded text-[11px] transition-all flex items-center gap-1 ${
                  showRSI
                    ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40 font-bold'
                    : 'bg-slate-900 text-slate-500 border border-slate-800 hover:text-slate-400'
                }`}
              >
                RSI (14)
              </button>
            </div>
          </div>
        )}

        {/* Primary Chart Area */}
        <div style={{ height: `${height}px` }} className="w-full relative">
          {renderChartBody()}
        </div>
      </div>

      {/* Fullscreen Technical Chart Modal */}
      {isFullscreen && (
        <div className="fixed inset-0 z-50 bg-slate-950/95 backdrop-blur-md p-4 sm:p-8 flex flex-col justify-between animate-in fade-in duration-150">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-cyan-950/60 border border-cyan-800 text-cyan-400">
                <BarChart2 className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white font-mono flex items-center gap-2">
                  {stock.symbol} — Pro Technical Suite
                  <span className="text-xs text-slate-400 font-normal">({stock.name})</span>
                </h2>
                <p className="text-xs text-slate-400 font-mono">
                  Full-Scale Charting • Level-2 Geometry • Multi-Oscillator Layout
                </p>
              </div>
            </div>

            <button
              onClick={() => setIsFullscreen(false)}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-all flex items-center gap-1.5 text-xs font-mono"
            >
              <Minimize2 className="w-4 h-4" />
              Close Studio
            </button>
          </div>

          <div className="flex-1 w-full my-4 bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between overflow-hidden">
            {renderChartBody()}
          </div>
        </div>
      )}
    </>
  );
};
