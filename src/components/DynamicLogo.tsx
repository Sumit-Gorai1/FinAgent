import React from 'react';

interface DynamicLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showBadge?: boolean;
  showSubtitle?: boolean;
  animated?: boolean;
  onClick?: () => void;
  className?: string;
}

export const DynamicLogo: React.FC<DynamicLogoProps> = ({
  size = 'md',
  showBadge = true,
  showSubtitle = true,
  animated = true,
  onClick,
  className = '',
}) => {
  const [isHovered, setIsHovered] = React.useState<boolean>(false);
  const [pulseCount, setPulseCount] = React.useState<number>(0);
  const [isClicked, setIsClicked] = React.useState<boolean>(false);

  // Dynamic dimension metrics based on size
  const iconDimensions = {
    sm: { box: 'w-8 h-8', svg: 32, text: 'text-lg', badge: 'text-[9px] px-1 py-0.2' },
    md: { box: 'w-11 h-11', svg: 44, text: 'text-xl', badge: 'text-[10px] px-1.5 py-0.5' },
    lg: { box: 'w-14 h-14', svg: 56, text: 'text-2xl', badge: 'text-[11px] px-2 py-0.5' },
    xl: { box: 'w-20 h-20', svg: 80, text: 'text-4xl', badge: 'text-xs px-2.5 py-1' },
  }[size];

  const handleClick = () => {
    setIsClicked(true);
    setPulseCount((prev) => prev + 1);
    setTimeout(() => setIsClicked(false), 800);
    if (onClick) {
      onClick();
    }
  };

  return (
    <div
      onClick={handleClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`group flex items-center gap-3 cursor-pointer select-none transition-all duration-300 ${
        isClicked ? 'scale-95' : 'hover:scale-[1.02]'
      } ${className}`}
      title="FINAGENT Stock Research & Intelligence Engine"
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleClick();
        }
      }}
    >
      {/* Dynamic Emblem Container */}
      <div
        className={`relative ${iconDimensions.box} flex items-center justify-center rounded-2xl bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-950/70 p-1 border border-slate-800 shadow-xl shadow-cyan-950/30 transition-all duration-500 ${
          isHovered
            ? 'border-cyan-500/70 shadow-2xl shadow-cyan-500/20 ring-2 ring-cyan-500/30'
            : 'hover:border-emerald-500/50'
        }`}
      >
        {/* Ambient Glow Aura */}
        <div
          className={`absolute inset-0 rounded-2xl bg-gradient-to-tr from-cyan-500/20 via-emerald-500/20 to-indigo-500/20 blur-md transition-opacity duration-500 pointer-events-none ${
            isHovered ? 'opacity-100' : 'opacity-40'
          }`}
        />

        {/* Sonar Shockwave on Click */}
        {isClicked && (
          <div className="absolute inset-0 rounded-2xl border-2 border-cyan-400 animate-ping pointer-events-none opacity-80" />
        )}

        {/* Dynamic SVG Icon */}
        <svg
          viewBox="0 0 100 100"
          className="w-full h-full relative z-10 overflow-visible"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            {/* Gradients */}
            <linearGradient id="finagentCyanGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#06b6d4" />
              <stop offset="50%" stopColor="#0ea5e9" />
              <stop offset="100%" stopColor="#3b82f6" />
            </linearGradient>

            <linearGradient id="finagentEmeraldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#10b981" />
              <stop offset="50%" stopColor="#14b8a6" />
              <stop offset="100%" stopColor="#06b6d4" />
            </linearGradient>

            <linearGradient id="finagentPrismGrad" x1="0%" y1="100%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.8" />
              <stop offset="50%" stopColor="#06b6d4" stopOpacity="0.9" />
              <stop offset="100%" stopColor="#10b981" stopOpacity="1" />
            </linearGradient>

            <radialGradient id="finagentCoreGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#38bdf8" stopOpacity="1" />
              <stop offset="50%" stopColor="#06b6d4" stopOpacity="0.6" />
              <stop offset="100%" stopColor="#06b6d4" stopOpacity="0" />
            </radialGradient>

            {/* Filter for glowing neon paths */}
            <filter id="neonGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="2.5" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* 1. Outer Swarm Orbital Trajectory (Counter-clockwise rotation) */}
          <circle
            cx="50"
            cy="50"
            r="44"
            fill="none"
            stroke="url(#finagentCyanGrad)"
            strokeWidth="1.2"
            strokeDasharray="6 12 24 8"
            strokeOpacity="0.5"
            className={animated ? 'origin-center animate-[spin_20s_linear_infinite]' : ''}
            style={{
              animationDirection: 'reverse',
              animationDuration: isHovered ? '6s' : '20s',
            }}
          />

          {/* 2. Inner Quant Horizon Orbit (Clockwise rotation with nodes) */}
          <g
            className={animated ? 'origin-center animate-[spin_12s_linear_infinite]' : ''}
            style={{ animationDuration: isHovered ? '4s' : '12s' }}
          >
            <circle
              cx="50"
              cy="50"
              r="36"
              fill="none"
              stroke="#1e293b"
              strokeWidth="1.5"
              strokeDasharray="8 6"
            />
            {/* Agent Node 1: Valuation Agent (Emerald) */}
            <circle cx="50" cy="14" r="3.5" fill="#10b981" filter="url(#neonGlow)">
              <animate attributeName="r" values="3;4.5;3" dur="2s" repeatCount="indefinite" />
            </circle>

            {/* Agent Node 2: Momentum & Risk Agent (Cyan) */}
            <circle cx="86" cy="50" r="3" fill="#06b6d4" filter="url(#neonGlow)">
              <animate attributeName="r" values="2.5;4;2.5" dur="1.6s" repeatCount="indefinite" />
            </circle>

            {/* Agent Node 3: Swarm Rebalancer (Indigo/Teal) */}
            <circle cx="24" cy="74" r="2.8" fill="#38bdf8" filter="url(#neonGlow)">
              <animate attributeName="r" values="2;3.8;2" dur="2.4s" repeatCount="indefinite" />
            </circle>
          </g>

          {/* 3. Central Sonar Beacon Ping (Breathing pulse ring) */}
          <circle
            cx="50"
            cy="50"
            r="28"
            fill="none"
            stroke="#10b981"
            strokeWidth="1"
            strokeOpacity="0.4"
          >
            {animated && (
              <animate
                attributeName="r"
                values="16;38;16"
                dur="3s"
                repeatCount="indefinite"
                ease="easeInOut"
              />
            )}
            {animated && (
              <animate
                attributeName="stroke-opacity"
                values="0.8;0.1;0.8"
                dur="3s"
                repeatCount="indefinite"
              />
            )}
          </circle>

          {/* 4. Core Dynamic Geometric Quant Monogram "F-A" Delta Prism */}
          {/* Main ascending diagonal vector (Financial Delta) */}
          <path
            d="M 28 68 L 48 24 L 54 24 L 74 68 L 65 68 L 51 37 L 37 68 Z"
            fill="url(#finagentPrismGrad)"
            filter="url(#neonGlow)"
            className="transition-all duration-300"
          />

          {/* Crossbar forming the 'F' and 'A' mathematical synthesis */}
          <path
            d="M 38 48 L 64 48"
            stroke="#ffffff"
            strokeWidth="3.2"
            strokeLinecap="round"
            strokeDasharray="26"
            strokeDashoffset={isHovered ? 0 : 4}
            className="transition-all duration-300"
          />

          {/* Upper cantilever arm forming the 'F' signature */}
          <path
            d="M 48 24 L 72 24"
            stroke="#38bdf8"
            strokeWidth="3"
            strokeLinecap="round"
            filter="url(#neonGlow)"
          />

          {/* 5. Central Quantum AI Nexus Node */}
          <circle cx="51" cy="48" r="6" fill="url(#finagentCoreGlow)" />
          <circle cx="51" cy="48" r="3" fill="#ffffff">
            {animated && (
              <animate
                attributeName="opacity"
                values="0.9;1;0.9"
                dur="1s"
                repeatCount="indefinite"
              />
            )}
          </circle>

          {/* 6. Dynamic Market Sparkline Ticker Bars at Base */}
          <g className="opacity-90">
            {/* Bar 1 */}
            <rect x="36" y="74" width="3" height="8" rx="1.5" fill="#10b981">
              {animated && (
                <animate
                  attributeName="height"
                  values="4;10;6;8;4"
                  dur="1.2s"
                  repeatCount="indefinite"
                />
              )}
              {animated && (
                <animate
                  attributeName="y"
                  values="78;72;76;74;78"
                  dur="1.2s"
                  repeatCount="indefinite"
                />
              )}
            </rect>

            {/* Bar 2 */}
            <rect x="43" y="72" width="3" height="10" rx="1.5" fill="#06b6d4">
              {animated && (
                <animate
                  attributeName="height"
                  values="10;5;12;7;10"
                  dur="1.5s"
                  repeatCount="indefinite"
                />
              )}
              {animated && (
                <animate
                  attributeName="y"
                  values="72;77;70;75;72"
                  dur="1.5s"
                  repeatCount="indefinite"
                />
              )}
            </rect>

            {/* Bar 3 */}
            <rect x="50" y="70" width="3" height="12" rx="1.5" fill="#38bdf8">
              {animated && (
                <animate
                  attributeName="height"
                  values="7;14;5;11;7"
                  dur="1.1s"
                  repeatCount="indefinite"
                />
              )}
              {animated && (
                <animate
                  attributeName="y"
                  values="75;68;77;71;75"
                  dur="1.1s"
                  repeatCount="indefinite"
                />
              )}
            </rect>

            {/* Bar 4 */}
            <rect x="57" y="73" width="3" height="9" rx="1.5" fill="#10b981">
              {animated && (
                <animate
                  attributeName="height"
                  values="9;6;12;4;9"
                  dur="1.4s"
                  repeatCount="indefinite"
                />
              )}
              {animated && (
                <animate
                  attributeName="y"
                  values="73;76;70;78;73"
                  dur="1.4s"
                  repeatCount="indefinite"
                />
              )}
            </rect>

            {/* Bar 5 */}
            <rect x="64" y="75" width="3" height="7" rx="1.5" fill="#2dd4bf">
              {animated && (
                <animate
                  attributeName="height"
                  values="5;11;7;13;5"
                  dur="1.3s"
                  repeatCount="indefinite"
                />
              )}
              {animated && (
                <animate
                  attributeName="y"
                  values="77;71;75;69;77"
                  dur="1.3s"
                  repeatCount="indefinite"
                />
              )}
            </rect>
          </g>
        </svg>

        {/* Orbiting Satellite Dot */}
        <div
          className={`absolute -top-1 -right-1 w-3 h-3 rounded-full bg-emerald-400 border-2 border-slate-950 shadow-md shadow-emerald-400/50 transition-all duration-300 ${
            isHovered ? 'scale-125 bg-cyan-400 shadow-cyan-400/80' : ''
          }`}
        >
          <div className="w-full h-full rounded-full bg-white animate-ping opacity-75" />
        </div>
      </div>

      {/* Dynamic Brand Typographic Identity */}
      <div className="flex flex-col">
        <div className="flex items-center gap-2">
          {/* Main Logo Text with dynamic gradient */}
          <div className="flex items-baseline font-mono tracking-tight leading-none">
            <span className={`font-extrabold text-white transition-colors duration-300 ${iconDimensions.text}`}>
              FIN
            </span>
            <span
              className={`font-black bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 bg-clip-text text-transparent transition-all duration-500 ${
                iconDimensions.text
              } ${isHovered ? 'tracking-wider drop-shadow-[0_0_12px_rgba(6,182,212,0.6)]' : ''}`}
            >
              AGENT
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
