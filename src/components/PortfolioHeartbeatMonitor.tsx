import React, { useState, useEffect, useRef } from 'react';
import {
  Activity,
  Volume2,
  VolumeX,
  Sparkles,
  Info,
  Play,
  Radio,
  Heart,
} from 'lucide-react';
import { PortfolioHolding } from '../types';
import {
  playActiveSound,
  portfolioHeartbeatService,
} from '../utils/heartbeatAudio';
import { EducationalDisclaimer } from './EducationalDisclaimer';

interface PortfolioHeartbeatMonitorProps {
  holdings: PortfolioHolding[];
  cashBalance?: number;
  className?: string;
}

interface BloodParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  alpha: number;
  size: number;
  life: number;
  maxLife: number;
}

export const PortfolioHeartbeatMonitor: React.FC<PortfolioHeartbeatMonitorProps> = ({
  holdings,
  cashBalance = 1000000,
  className = '',
}) => {
  const [isPlayingAudio, setIsPlayingAudio] = useState<boolean>(portfolioHeartbeatService.isActive());
  const [soundMode, setSoundMode] = useState<'lub-dub' | 'beep'>('lub-dub');
  const [showInfo, setShowInfo] = useState<boolean>(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // 1. Calculate Portfolio Financial Vitals
  const totalValue = holdings.reduce((sum, h) => sum + h.currentPrice * h.shares, 0);
  const totalCost = holdings.reduce((sum, h) => sum + h.avgBuyPrice * h.shares, 0);
  const totalPnl = totalValue - totalCost;
  const totalPnlPercent = totalCost > 0 ? (totalPnl / totalCost) * 100 : 0;

  // Weighted Average Multi-Agent Research Score
  const weightedScore =
    totalValue > 0
      ? holdings.reduce((sum, h) => {
          const score = h.researchScore ?? h.score ?? 70;
          const weight = (h.currentPrice * h.shares) / totalValue;
          return sum + score * weight;
        }, 0)
      : 70;

  // Sector Diversification Factor (Herfindahl-Hirschman Index)
  const sectorAllocations: Record<string, number> = {};
  holdings.forEach((h) => {
    sectorAllocations[h.sector] = (sectorAllocations[h.sector] || 0) + (h.currentPrice * h.shares);
  });
  const sectorCount = Object.keys(sectorAllocations).length;
  const hhi = Object.values(sectorAllocations).reduce((sum, val) => {
    const share = totalValue > 0 ? (val / totalValue) * 100 : 0;
    return sum + (share * share);
  }, 0);

  const diversificationHealth = Math.max(20, Math.min(100, Math.round(100 - (hhi / 100))));

  // Overall Health Score: 0 - 100
  const pnlScore = Math.max(10, Math.min(100, Math.round(50 + totalPnlPercent * 2.5)));
  const cashRatio = cashBalance / (totalValue + cashBalance);
  const cashScore = Math.min(100, Math.round(cashRatio * 200) + 50);

  const rawHealth =
    weightedScore * 0.45 +
    diversificationHealth * 0.30 +
    pnlScore * 0.15 +
    cashScore * 0.10;

  const healthScore = Math.round(Math.max(15, Math.min(99, rawHealth)));

  // Derive pulse tempo and physiological stress from Health Score
  let targetBpm = 72;
  let rhythmStatus = 'Optimal Hemodynamic Flow';
  let rhythmBadgeBg = 'bg-emerald-950/80 border-emerald-700/60 text-emerald-300';
  let themeColorHex = '#10b981';
  let stressIntensity = 0.2;
  let diagnosisNote = 'Optimal hemodynamic balance with disciplined factor diversification and resilient conviction.';

  if (healthScore >= 85) {
    targetBpm = 62;
    rhythmStatus = 'Steady Laminar Ejection';
    rhythmBadgeBg = 'bg-emerald-950/80 border-emerald-700/60 text-emerald-300';
    themeColorHex = '#10b981';
    stressIntensity = 0.1;
    diagnosisNote = 'Resilient, high-conviction factor quality with minimal downside volatility.';
  } else if (healthScore >= 75) {
    targetBpm = 68;
    rhythmStatus = 'High-Quality Resilient Rhythm';
    rhythmBadgeBg = 'bg-emerald-950/80 border-emerald-700/60 text-emerald-300';
    themeColorHex = '#10b981';
    stressIntensity = 0.25;
    diagnosisNote = 'Strong structural health, balanced sector weights, and controlled drawdown.';
  } else if (healthScore >= 65) {
    targetBpm = 80;
    rhythmStatus = 'Active Market Volatility';
    rhythmBadgeBg = 'bg-cyan-950/80 border-cyan-700/60 text-cyan-300';
    themeColorHex = '#06b6d4';
    stressIntensity = 0.45;
    diagnosisNote = 'Moderate beta exposure. Some correlation overlap between tech and financial holdings.';
  } else if (healthScore >= 50) {
    targetBpm = 98;
    rhythmStatus = 'Elevated Factor Stress';
    rhythmBadgeBg = 'bg-amber-950/80 border-amber-700/60 text-amber-300';
    themeColorHex = '#f59e0b';
    stressIntensity = 0.7;
    diagnosisNote = 'Mild stress detected: Sector concentration or negative momentum dragging portfolio vitals.';
  } else {
    targetBpm = 124;
    rhythmStatus = 'Severe Volatility Compression';
    rhythmBadgeBg = 'bg-rose-950/80 border-rose-700/60 text-rose-300';
    themeColorHex = '#f43f5e';
    stressIntensity = 0.95;
    diagnosisNote = 'Elevated drawdown, high concentration risk, and deteriorating multi-agent conviction.';
  }

  // Synchronize audio service
  useEffect(() => {
    portfolioHeartbeatService.updateMetrics(targetBpm, stressIntensity, healthScore);
  }, [targetBpm, stressIntensity, healthScore]);

  useEffect(() => {
    const unsub = portfolioHeartbeatService.subscribe((active) => {
      setIsPlayingAudio(active);
    });
    return () => unsub();
  }, []);

  const handleToggleAudio = () => {
    const nextState = portfolioHeartbeatService.toggle(targetBpm, stressIntensity, healthScore);
    setIsPlayingAudio(nextState);
  };

  const handleToggleSoundMode = () => {
    const nextMode = soundMode === 'lub-dub' ? 'beep' : 'lub-dub';
    setSoundMode(nextMode);
    portfolioHeartbeatService.setSoundMode(nextMode);
  };

  const handleTestSingleBeat = () => {
    playActiveSound(targetBpm, stressIntensity, healthScore);
  };

  // ---------------------------------------------------------------------------
  // 2. Photorealistic Anatomical Heart Animation Engine
  // ---------------------------------------------------------------------------
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const updateCanvasDimensions = () => {
      const parent = canvas.parentElement;
      if (parent) {
        const rect = parent.getBoundingClientRect();
        if (rect.width > 0 && rect.height > 0) {
          canvas.width = Math.round(rect.width * (window.devicePixelRatio || 1));
          canvas.height = Math.round(rect.height * (window.devicePixelRatio || 1));
        }
      }
    };
    updateCanvasDimensions();

    const resizeObserver = new ResizeObserver(() => {
      updateCanvasDimensions();
    });
    if (canvas.parentElement) {
      resizeObserver.observe(canvas.parentElement);
    }

    let animationId: number;
    let bloodParticles: BloodParticle[] = [];

    const draw = (timestamp: number) => {
      const width = canvas.width;
      const height = canvas.height;
      if (width === 0 || height === 0) {
        animationId = requestAnimationFrame(draw);
        return;
      }

      const dpr = window.devicePixelRatio || 1;
      const cx = width / 2;
      const cy = height * 0.53;
      // Precision anatomical organ scale
      const baseScale = (Math.min(width, height) / 300) * 0.96;

      ctx.clearRect(0, 0, width, height);

      // Cardiac Cycle Calculation: 60,000ms / BPM
      const cycleMs = (60 / targetBpm) * 1000;
      const cycleTime = timestamp % cycleMs;
      const u = cycleTime / cycleMs; // fractional phase [0, 1)

      // Physiological Wringing / Torsional Kinematics:
      // u in [0.00, 0.12]: Atrial systole (atria compress ~6%, ventricles primed)
      // u in [0.12, 0.38]: Powerful Ventricular Systole (apex lifts upward, rotates ~3 deg counter-clockwise, lateral walls contract inward, aorta distends)
      // u in [0.38, 0.50]: Isovolumetric relaxation & elastic untwisting recoil
      // u in [0.50, 1.00]: Diastolic filling (gradual passive myocardial relaxation & refill)

      let ventricularScaleX = 1.0;
      let ventricularScaleY = 1.0;
      let apexLiftY = 0;
      let torsionAngle = 0;
      let atrialScale = 1.0;
      let aortaDistension = 1.0;
      let isSystole = false;
      let systoleIntensity = 0;
      let specularSheen = 0.3;

      if (u < 0.12) {
        // Atrial kick
        const p = Math.sin((u / 0.12) * Math.PI);
        atrialScale = 1.0 - 0.08 * p;
        ventricularScaleX = 1.0 + 0.015 * p;
        ventricularScaleY = 1.0 + 0.015 * p;
      } else if (u < 0.38) {
        // Ventricular systole (powerful wringing contraction)
        isSystole = true;
        const p = Math.sin(((u - 0.12) / 0.26) * Math.PI);
        systoleIntensity = p;
        // Inward radial squeeze + longitudinal shortening (apex draws up)
        ventricularScaleX = 1.0 - 0.15 * p;
        ventricularScaleY = 1.0 - 0.10 * p;
        apexLiftY = -12 * baseScale * p;
        torsionAngle = -0.05 * p; // Counter-clockwise twist of the apex!
        atrialScale = 1.0 + 0.04 * p;
        aortaDistension = 1.0 + 0.07 * p;
        specularSheen = 0.3 + 0.55 * p;

        // Ejection blood particles surging up through the aortic arch
        if (Math.random() < 0.7) {
          const angle = -Math.PI / 2 + (Math.random() - 0.5) * 0.45;
          const speed = (3.2 + Math.random() * 2.8) * dpr;
          bloodParticles.push({
            x: cx + (Math.random() - 0.5) * 10 * dpr,
            y: cy - 42 * baseScale,
            vx: Math.cos(angle) * speed * 0.35 + (Math.random() > 0.5 ? 0.6 : -0.3) * dpr,
            vy: Math.sin(angle) * speed,
            alpha: 1.0,
            size: (2.4 + Math.random() * 2.0) * dpr,
            life: 0,
            maxLife: 28 + Math.random() * 18,
          });
        }
      } else if (u < 0.50) {
        // Isovolumetric relaxation & untwisting
        const p = Math.sin(((u - 0.38) / 0.12) * Math.PI);
        ventricularScaleX = 0.95 + 0.03 * p;
        ventricularScaleY = 0.95 + 0.03 * p;
        apexLiftY = -4 * baseScale * (1 - p);
        torsionAngle = -0.015 * (1 - p);
        aortaDistension = 1.02;
        specularSheen = 0.35 - 0.1 * p;
      } else {
        // Diastolic expansion and filling
        const t = (u - 0.50) / 0.50;
        const smooth = 1 - Math.exp(-4 * t);
        ventricularScaleX = 0.96 + 0.04 * smooth;
        ventricularScaleY = 0.96 + 0.04 * smooth;
        apexLiftY = 0;
        torsionAngle = 0;
        aortaDistension = 1.0;
        specularSheen = 0.28;
      }

      // --- 1. Realistic Deep Pericardial Cavity Glow ---
      ctx.save();
      const cavityGrad = ctx.createRadialGradient(cx, cy, 15 * dpr, cx, cy, 155 * baseScale);
      cavityGrad.addColorStop(0, isSystole ? '#be123c24' : '#88133718');
      cavityGrad.addColorStop(0.55, '#4c05190c');
      cavityGrad.addColorStop(1, 'transparent');
      ctx.fillStyle = cavityGrad;
      ctx.fillRect(0, 0, width, height);
      ctx.restore();

      // --- 2. Master Anatomical Organ Drawing ---
      ctx.save();
      ctx.translate(cx, cy);

      // A. POSTERIOR GREAT VESSELS (Superior Vena Cava & Pulmonary Veins)
      // Superior Vena Cava (Right posterolateral, deep venous indigo/slate)
      ctx.save();
      ctx.beginPath();
      ctx.roundRect(-54 * baseScale, -122 * baseScale, 22 * baseScale, 62 * baseScale, 4 * dpr);
      const svcGrad = ctx.createLinearGradient(-54 * baseScale, 0, -32 * baseScale, 0);
      svcGrad.addColorStop(0, '#1e3a8a');
      svcGrad.addColorStop(0.3, '#3b82f6');
      svcGrad.addColorStop(0.7, '#1d4ed8');
      svcGrad.addColorStop(1, '#172554');
      ctx.fillStyle = svcGrad;
      ctx.fill();
      // Vessel lumen bevel
      ctx.beginPath();
      ctx.ellipse(-43 * baseScale, -122 * baseScale, 10 * baseScale, 3.5 * baseScale, 0, 0, Math.PI * 2);
      ctx.fillStyle = '#1e3a8a';
      ctx.fill();
      ctx.strokeStyle = '#60a5fa';
      ctx.lineWidth = 0.8 * dpr;
      ctx.stroke();
      ctx.restore();

      // Pulmonary Veins (Entering posterior left atrium)
      ctx.save();
      ctx.beginPath();
      ctx.ellipse(48 * baseScale, -38 * baseScale, 9 * baseScale, 14 * baseScale, 0.35, 0, Math.PI * 2);
      ctx.fillStyle = '#9f1239';
      ctx.fill();
      ctx.strokeStyle = '#f43f5e';
      ctx.lineWidth = 1 * dpr;
      ctx.stroke();
      ctx.restore();

      // B. ASCENDING AORTA & AORTIC ARCH (Luminous Arterial Crimson with 3D cylindrical lighting)
      ctx.save();
      ctx.scale(aortaDistension, 1.0);
      ctx.beginPath();
      // Realistic anatomic aortic arch curving from right-anterior to left-posterior
      ctx.moveTo(-18 * baseScale, -28 * baseScale);
      ctx.bezierCurveTo(-18 * baseScale, -96 * baseScale, 18 * baseScale, -130 * baseScale, 46 * baseScale, -90 * baseScale);
      ctx.bezierCurveTo(56 * baseScale, -72 * baseScale, 54 * baseScale, -36 * baseScale, 50 * baseScale, -6 * baseScale);
      ctx.lineTo(34 * baseScale, -6 * baseScale);
      ctx.bezierCurveTo(38 * baseScale, -36 * baseScale, 38 * baseScale, -60 * baseScale, 30 * baseScale, -76 * baseScale);
      ctx.bezierCurveTo(12 * baseScale, -98 * baseScale, -3 * baseScale, -82 * baseScale, -3 * baseScale, -28 * baseScale);
      ctx.closePath();

      // Realistic volumetric tubular gradient
      const aortaGrad = ctx.createLinearGradient(-18 * baseScale, -80 * baseScale, 50 * baseScale, -50 * baseScale);
      aortaGrad.addColorStop(0, '#9f1239');
      aortaGrad.addColorStop(0.25, '#e11d48');
      aortaGrad.addColorStop(0.55, '#f43f5e');
      aortaGrad.addColorStop(0.85, '#be123c');
      aortaGrad.addColorStop(1, '#4c0519');
      ctx.fillStyle = aortaGrad;
      ctx.shadowColor = '#e11d48';
      ctx.shadowBlur = (isSystole ? 16 : 8) * dpr;
      ctx.fill();
      ctx.shadowBlur = 0;

      // Cylindrical Specular Core Reflection along Aorta
      ctx.beginPath();
      ctx.moveTo(-10 * baseScale, -28 * baseScale);
      ctx.bezierCurveTo(-10 * baseScale, -88 * baseScale, 18 * baseScale, -118 * baseScale, 38 * baseScale, -86 * baseScale);
      ctx.strokeStyle = '#ffe4e6';
      ctx.lineWidth = 2.2 * dpr;
      ctx.globalAlpha = specularSheen * 0.7;
      ctx.stroke();
      ctx.globalAlpha = 1.0;

      // The 3 Great Aortic Arch Arteries
      // 1. Brachiocephalic Trunk, 2. Left Common Carotid, 3. Left Subclavian
      const drawAorticTrunk = (tx: number, ty: number, tw: number, th: number, angle: number) => {
        ctx.save();
        ctx.translate(tx * baseScale, ty * baseScale);
        ctx.rotate(angle);
        ctx.beginPath();
        ctx.roundRect(-tw * 0.5 * baseScale, -th * baseScale, tw * baseScale, th * baseScale, [3 * dpr, 3 * dpr, 0, 0]);
        const trunkGrad = ctx.createLinearGradient(-tw * 0.5 * baseScale, 0, tw * 0.5 * baseScale, 0);
        trunkGrad.addColorStop(0, '#9f1239');
        trunkGrad.addColorStop(0.4, '#f43f5e');
        trunkGrad.addColorStop(1, '#881337');
        ctx.fillStyle = trunkGrad;
        ctx.fill();
        // Beveled lumen opening
        ctx.beginPath();
        ctx.ellipse(0, -th * baseScale, tw * 0.5 * baseScale, 2.2 * baseScale, 0, 0, Math.PI * 2);
        ctx.fillStyle = '#fda4af';
        ctx.fill();
        ctx.strokeStyle = '#be123c';
        ctx.lineWidth = 0.8 * dpr;
        ctx.stroke();
        ctx.restore();
      };
      drawAorticTrunk(-6, -96, 11, 26, -0.16); // Brachiocephalic trunk
      drawAorticTrunk(12, -102, 9, 28, 0.04);  // Left common carotid
      drawAorticTrunk(28, -98, 9, 24, 0.24);  // Left subclavian
      ctx.restore();

      // C. PULMONARY TRUNK & BIFURCATION (Anterior cross over aorta)
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(-25 * baseScale, -24 * baseScale);
      ctx.bezierCurveTo(-28 * baseScale, -56 * baseScale, -14 * baseScale, -78 * baseScale, 8 * baseScale, -74 * baseScale);
      ctx.lineTo(3 * baseScale, -57 * baseScale);
      ctx.bezierCurveTo(-8 * baseScale, -60 * baseScale, -13 * baseScale, -46 * baseScale, -12 * baseScale, -24 * baseScale);
      ctx.closePath();
      const pulmGrad = ctx.createLinearGradient(-26 * baseScale, -75 * baseScale, 6 * baseScale, -25 * baseScale);
      pulmGrad.addColorStop(0, '#1d4ed8');
      pulmGrad.addColorStop(0.35, '#3b82f6');
      pulmGrad.addColorStop(0.7, '#2563eb');
      pulmGrad.addColorStop(1, '#1e3a8a');
      ctx.fillStyle = pulmGrad;
      ctx.fill();
      ctx.strokeStyle = '#60a5fa';
      ctx.lineWidth = 1.0 * dpr;
      ctx.globalAlpha = 0.4;
      ctx.stroke();
      ctx.globalAlpha = 1.0;
      ctx.restore();

      // D. RIGHT ATRIUM & AURICLE (Anatomical right, screen left, fleshy scalloped muscle)
      ctx.save();
      ctx.scale(atrialScale, atrialScale);
      ctx.beginPath();
      ctx.moveTo(-34 * baseScale, -24 * baseScale);
      ctx.bezierCurveTo(-66 * baseScale, -26 * baseScale, -74 * baseScale, 12 * baseScale, -56 * baseScale, 34 * baseScale);
      ctx.bezierCurveTo(-44 * baseScale, 38 * baseScale, -30 * baseScale, 22 * baseScale, -24 * baseScale, 6 * baseScale);
      ctx.closePath();
      const raGrad = ctx.createRadialGradient(-50 * baseScale, 4 * baseScale, 6 * baseScale, -50 * baseScale, 4 * baseScale, 38 * baseScale);
      raGrad.addColorStop(0, '#831843');
      raGrad.addColorStop(0.5, '#500724');
      raGrad.addColorStop(1, '#2a0212');
      ctx.fillStyle = raGrad;
      ctx.fill();
      // Auricle edge highlight
      ctx.strokeStyle = '#f472b6';
      ctx.lineWidth = 1.1 * dpr;
      ctx.globalAlpha = 0.35;
      ctx.stroke();
      ctx.globalAlpha = 1.0;
      ctx.restore();

      // E. LEFT AURICLE (Screen right, tucked beside pulmonary trunk)
      ctx.save();
      ctx.scale(atrialScale, atrialScale);
      ctx.beginPath();
      ctx.moveTo(28 * baseScale, -24 * baseScale);
      ctx.bezierCurveTo(56 * baseScale, -28 * baseScale, 64 * baseScale, 2 * baseScale, 50 * baseScale, 22 * baseScale);
      ctx.bezierCurveTo(39 * baseScale, 24 * baseScale, 32 * baseScale, 6 * baseScale, 27 * baseScale, -8 * baseScale);
      ctx.closePath();
      const laGrad = ctx.createLinearGradient(28 * baseScale, -24 * baseScale, 60 * baseScale, 20 * baseScale);
      laGrad.addColorStop(0, '#be123c');
      laGrad.addColorStop(0.6, '#881337');
      laGrad.addColorStop(1, '#4c0519');
      ctx.fillStyle = laGrad;
      ctx.fill();
      ctx.restore();

      // F. MAIN VENTRICLES (Left & Right Ventricles, Apex, Myocardial Fibers, Epicardial Fat & Coronary Network)
      ctx.save();
      // Apply physiological longitudinal shortening and torsional twist!
      ctx.translate(0, apexLiftY);
      ctx.rotate(torsionAngle);
      ctx.scale(ventricularScaleX, ventricularScaleY);

      // 1. Muscular Ventricular Mass Contour
      ctx.beginPath();
      ctx.moveTo(-45 * baseScale, 14 * baseScale);
      // Right ventricular border (acute margin)
      ctx.bezierCurveTo(-57 * baseScale, 45 * baseScale, -38 * baseScale, 82 * baseScale, -12 * baseScale, 100 * baseScale);
      // Left ventricular Apex (blunt conical tip angled to screen right)
      ctx.bezierCurveTo(4 * baseScale, 114 * baseScale, 21 * baseScale, 112 * baseScale, 30 * baseScale, 98 * baseScale);
      // Left ventricular lateral border (obtuse margin)
      ctx.bezierCurveTo(64 * baseScale, 76 * baseScale, 70 * baseScale, 32 * baseScale, 46 * baseScale, 12 * baseScale);
      // Coronary sulcus base
      ctx.bezierCurveTo(22 * baseScale, 4 * baseScale, -20 * baseScale, 4 * baseScale, -45 * baseScale, 14 * baseScale);
      ctx.closePath();

      // Deep 3D Volumetric Myocardial Shading
      // Radial falloff simulates organic curved 3D muscular volume illuminated from top-left
      const ventGrad = ctx.createRadialGradient(
        -8 * baseScale, 38 * baseScale, 12 * baseScale,
        14 * baseScale, 62 * baseScale, 88 * baseScale
      );
      ventGrad.addColorStop(0, '#f43f5e'); // Top specular illuminated zone
      ventGrad.addColorStop(0.28, '#e11d48'); // Rich arterial red myocardium
      ventGrad.addColorStop(0.60, '#9f1239'); // Deep cardiac muscle wall
      ventGrad.addColorStop(0.85, '#4c0519'); // Dense shadowed periphery
      ventGrad.addColorStop(1, '#20020a');    // Deep ambient occlusion edge
      ctx.fillStyle = ventGrad;
      ctx.shadowColor = isSystole ? '#f43f5e' : '#be123c';
      ctx.shadowBlur = (isSystole ? 24 : 10) * dpr;
      ctx.fill();
      ctx.shadowBlur = 0;

      // 2. Spiral Myocardial Muscle Fibers (Vortex fibers wrapping into apex)
      ctx.save();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 0.9 * dpr;
      ctx.globalAlpha = 0.12;
      for (let i = 0; i < 7; i++) {
        const startY = (24 + i * 11) * baseScale;
        ctx.beginPath();
        ctx.moveTo(-40 * baseScale + i * 4 * baseScale, startY);
        ctx.bezierCurveTo(
          -15 * baseScale, startY + 18 * baseScale,
          10 * baseScale, startY + 22 * baseScale,
          24 * baseScale - i * 2 * baseScale, 94 * baseScale
        );
        ctx.stroke();
      }
      ctx.restore();

      // 3. Epicardial Adipose Tissue (Fat Pads along coronary and interventricular grooves)
      // This is the quintessential marker of real human heart anatomy!
      ctx.save();
      // Atrioventricular groove fat cushion
      ctx.beginPath();
      ctx.moveTo(-42 * baseScale, 16 * baseScale);
      ctx.bezierCurveTo(-15 * baseScale, 8 * baseScale, 18 * baseScale, 8 * baseScale, 44 * baseScale, 14 * baseScale);
      ctx.lineWidth = 7.5 * baseScale;
      ctx.strokeStyle = '#fef08a38';
      ctx.stroke();

      // Anterior interventricular groove fat cushion
      ctx.beginPath();
      ctx.moveTo(-10 * baseScale, 12 * baseScale);
      ctx.bezierCurveTo(-5 * baseScale, 42 * baseScale, 6 * baseScale, 72 * baseScale, 16 * baseScale, 104 * baseScale);
      ctx.lineWidth = 9 * baseScale;
      ctx.strokeStyle = '#fde04728';
      ctx.stroke();

      // Fine textured adipose cells/lobules
      ctx.fillStyle = '#fef9c33d';
      const fatNodes = [
        [-12, 20], [-6, 34], [-2, 48], [4, 62], [8, 76], [13, 90],
        [-28, 14], [-18, 12], [8, 11], [24, 12], [35, 15]
      ];
      fatNodes.forEach(([fx, fy]) => {
        ctx.beginPath();
        ctx.arc(fx * baseScale, fy * baseScale, 3.2 * baseScale, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.restore();

      // 4. Anterior Interventricular Sulcus (Groove separating Left and Right Ventricles)
      ctx.beginPath();
      ctx.moveTo(-10 * baseScale, 10 * baseScale);
      ctx.bezierCurveTo(-6 * baseScale, 42 * baseScale, 5 * baseScale, 72 * baseScale, 15 * baseScale, 104 * baseScale);
      ctx.strokeStyle = '#380310';
      ctx.lineWidth = 4.2 * dpr;
      ctx.stroke();

      // 5. Coronary Vasculature Network
      // A. Great Cardiac Vein (Deep venous indigo/blue, runs alongside LAD)
      ctx.beginPath();
      ctx.moveTo(-13 * baseScale, 12 * baseScale);
      ctx.bezierCurveTo(-9 * baseScale, 43 * baseScale, 2 * baseScale, 73 * baseScale, 12 * baseScale, 103 * baseScale);
      ctx.strokeStyle = '#2563eb';
      ctx.lineWidth = 1.6 * dpr;
      ctx.globalAlpha = 0.75;
      ctx.stroke();
      ctx.globalAlpha = 1.0;

      // B. Left Anterior Descending (LAD) Coronary Artery ("Widowmaker")
      // Highly distinct arterial vessel pulsating with oxygenated blood
      ctx.beginPath();
      ctx.moveTo(-9 * baseScale, 10 * baseScale);
      ctx.bezierCurveTo(-5 * baseScale, 42 * baseScale, 6 * baseScale, 72 * baseScale, 15 * baseScale, 104 * baseScale);
      ctx.strokeStyle = isSystole ? '#ffe4e6' : '#f43f5e';
      ctx.lineWidth = 2.4 * dpr;
      ctx.shadowColor = '#f43f5e';
      ctx.shadowBlur = (isSystole ? 12 : 4) * dpr;
      ctx.stroke();

      // Diagonal Branches (D1, D2) spreading across Left Ventricular free wall
      const drawCoronaryBranch = (sx: number, sy: number, cx1: number, cy1: number, ex: number, ey: number, widthFactor: number) => {
        ctx.beginPath();
        ctx.moveTo(sx * baseScale, sy * baseScale);
        ctx.quadraticCurveTo(cx1 * baseScale, cy1 * baseScale, ex * baseScale, ey * baseScale);
        ctx.strokeStyle = isSystole ? '#ffe4e6' : '#fb7185';
        ctx.lineWidth = widthFactor * dpr;
        ctx.stroke();
      };
      // Diagonal branch 1
      drawCoronaryBranch(-7, 32, -22, 44, -36, 48, 1.5);
      // Diagonal branch 2
      drawCoronaryBranch(1, 54, 22, 62, 44, 66, 1.6);
      // Diagonal branch 3 (Apical perforator)
      drawCoronaryBranch(9, 80, 22, 86, 28, 95, 1.2);
      ctx.shadowBlur = 0;

      // 6. Wet Specular Sheen (Glistening Pericardial Fluid Reflections)
      ctx.save();
      // Broad curved anatomical highlight along left lateral convexity
      ctx.beginPath();
      ctx.moveTo(-44 * baseScale, 28 * baseScale);
      ctx.bezierCurveTo(-50 * baseScale, 52 * baseScale, -32 * baseScale, 80 * baseScale, -12 * baseScale, 92 * baseScale);
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2.4 * dpr;
      ctx.globalAlpha = specularSheen * 0.7;
      ctx.stroke();

      // Sharp secondary glistening droplet highlight near anterior crest
      ctx.beginPath();
      ctx.ellipse(-20 * baseScale, 38 * baseScale, 8 * baseScale, 2.5 * baseScale, -0.6, 0, Math.PI * 2);
      ctx.fillStyle = '#ffffff';
      ctx.globalAlpha = specularSheen * 0.55;
      ctx.fill();
      ctx.restore();

      ctx.restore(); // end ventricular transform

      ctx.restore(); // end master heart transform

      // --- 3. Ejection Blood Particles (Circulating through systemic arch) ---
      ctx.save();
      for (let i = bloodParticles.length - 1; i >= 0; i--) {
        const p = bloodParticles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.life++;
        p.alpha = Math.max(0, 1 - p.life / p.maxLife);

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 228, 230, ${p.alpha * 0.95})`;
        ctx.shadowColor = '#f43f5e';
        ctx.shadowBlur = 8 * dpr;
        ctx.fill();

        if (p.life >= p.maxLife) {
          bloodParticles.splice(i, 1);
        }
      }
      ctx.restore();

      // --- 4. Minimalist HUD Telemetry Overlay ---
      ctx.save();
      ctx.font = `bold ${Math.round(10 * dpr)}px 'Calibri', 'Carlito', Candara, 'Segoe UI', Arial, sans-serif`;
      ctx.fillStyle = isSystole ? themeColorHex : '#64748b';
      ctx.fillText(isSystole ? '• VENTRICULAR CONTRACTION' : '• DIASTOLIC REFILL', 14 * dpr, 18 * dpr);

      ctx.font = `${Math.round(9 * dpr)}px 'Calibri', 'Carlito', Candara, 'Segoe UI', Arial, sans-serif`;
      ctx.fillStyle = '#475569';
      ctx.fillText(`${targetBpm} BPM`, 14 * dpr, height - 12 * dpr);
      ctx.restore();

      animationId = requestAnimationFrame(draw);
    };

    animationId = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(animationId);
      resizeObserver.disconnect();
    };
  }, [targetBpm, themeColorHex, stressIntensity, healthScore]);

  const beatDurationSec = (60 / targetBpm).toFixed(2);

  return (
    <div
      className={`p-5 rounded-2xl bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 border border-slate-800 shadow-2xl space-y-4 font-mono ${className}`}
    >
      {/* Top Header: Clean Title & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="relative flex items-center justify-center">
            {/* Animated Pulsating Cardiac Icon */}
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center transition-transform"
              style={{
                backgroundColor: `${themeColorHex}18`,
                border: `1px solid ${themeColorHex}40`,
                animation: `pulse ${beatDurationSec}s ease-in-out infinite`,
              }}
            >
              <Heart
                className="w-5 h-5 transition-colors fill-current"
                style={{ color: themeColorHex }}
              />
            </div>

            {/* Ripple Shockwave Ring */}
            <div
              className="absolute inset-0 rounded-xl opacity-40 pointer-events-none"
              style={{
                border: `2px solid ${themeColorHex}`,
                animation: `ping ${beatDurationSec}s cubic-bezier(0, 0, 0.2, 1) infinite`,
              }}
            />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-white tracking-wide">
                PORTFOLIO HEALTH
              </h3>
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                LIVE
              </span>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Sound Mode Toggle */}
          <button
            onClick={handleToggleSoundMode}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-slate-300 text-xs font-mono transition-all border border-slate-700"
            title="Switch between mechanical valve sounds (lub-dub) and clinical monitor telemetry beep"
          >
            <Radio className="w-3 h-3 text-cyan-400" />
            <span>{soundMode === 'lub-dub' ? 'Valve S1/S2' : 'Monitor Beep'}</span>
          </button>

          {/* Test Sound */}
          <button
            onClick={handleTestSingleBeat}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-mono transition-all border border-slate-700"
            title="Sample a single heartbeat sound"
          >
            <Play className="w-3 h-3 text-cyan-400 fill-cyan-400" />
            <span>Test</span>
          </button>

          {/* Continuous Audio Toggle */}
          <button
            onClick={handleToggleAudio}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-all border shadow-lg ${
              isPlayingAudio
                ? 'bg-emerald-950/80 text-emerald-300 border-emerald-600 shadow-emerald-950/40'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white border-slate-700'
            }`}
            title={isPlayingAudio ? 'Mute Heartbeat Audio' : 'Listen to Live Heartbeat Audio'}
          >
            {isPlayingAudio ? (
              <>
                <Volume2 className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
                <span>Audio Active</span>
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              </>
            ) : (
              <>
                <VolumeX className="w-3.5 h-3.5 text-slate-400" />
                <span>Listen Heartbeat</span>
              </>
            )}
          </button>

          {/* Info Button */}
          <button
            onClick={() => setShowInfo(!showInfo)}
            className="p-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white border border-slate-700"
            title="How portfolio health vitals are calculated"
          >
            <Info className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Info Breakdown Card (Conditional) */}
      {showInfo && (
        <div className="p-3.5 rounded-xl bg-slate-950/90 border border-cyan-800/60 text-xs space-y-2 text-slate-300 font-sans animate-fadeIn">
          <div className="flex items-center gap-1.5 text-cyan-300 font-bold font-mono">
            <Sparkles className="w-3.5 h-3.5" />
            <span>PORTFOLIO HEALTH ATTRIBUTION</span>
          </div>
          <p className="leading-relaxed">
            Portfolio resilience is dynamically mapped to physiological rhythm.
            Higher portfolio health produces steady laminar cardiac ejection at an optimal cadence, while factor concentration and market drawdowns increase contraction frequency and systemic hemodynamic stress.
          </p>
        </div>
      )}

      {/* Main Grid: Real-Time Heart Pumping Chamber + Portfolio Health Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-center">
        {/* Left: Dedicated Anatomical Beating Heart Viewport */}
        <div className="lg:col-span-7 bg-slate-950 rounded-xl p-3 border border-slate-800/90 relative overflow-hidden shadow-inner flex flex-col gap-2">
          {/* Top Bar */}
          <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: themeColorHex }} />
              <span className="text-white font-medium">Real-Time Hemodynamic Motion</span>
            </div>
            <span className="text-slate-500 font-mono">{targetBpm} BPM</span>
          </div>

          {/* Heart Pumping Canvas Viewport */}
          <div className="w-full h-60 relative overflow-hidden rounded-lg bg-gradient-to-b from-slate-950 via-[#050811] to-slate-950 border border-slate-900 flex items-center justify-center">
            <canvas
              ref={canvasRef}
              width={640}
              height={240}
              className="w-full h-full block"
            />
          </div>

          {/* Bottom Telemetry Bar */}
          <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-900 font-mono">
            <div className="flex items-center gap-2">
              <span className="text-white font-bold">{rhythmStatus}</span>
              <span className="text-slate-600">•</span>
              <span className="text-slate-400">Stress: {Math.round(stressIntensity * 100)}%</span>
            </div>
            <span className="text-xs font-bold" style={{ color: themeColorHex }}>
              Status: {healthScore >= 75 ? 'Optimal Dynamic Flow' : healthScore >= 60 ? 'Active Market Volatility' : 'Defensive Compression'}
            </span>
          </div>
        </div>

        {/* Right: Portfolio Health Core Indicator Cards */}
        <div className="lg:col-span-5 grid grid-cols-2 gap-2.5">
          {/* Overall Health Score Card */}
          <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800/90 space-y-1">
            <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-bold">
              OVERALL HEALTH
            </span>
            <div className="flex items-baseline gap-1.5">
              <span
                className={`text-3xl font-extrabold tracking-tight font-mono ${
                  healthScore >= 75 ? 'text-emerald-400' : healthScore >= 60 ? 'text-cyan-400' : 'text-amber-400'
                }`}
              >
                {healthScore}
              </span>
              <span className="text-xs text-slate-400">/ 100</span>
            </div>
            <span className={`inline-block px-1.5 py-0.2 rounded text-[10px] font-bold border ${rhythmBadgeBg}`}>
              {healthScore >= 80 ? 'GRADE A RESILIENT' : healthScore >= 65 ? 'GRADE B SOLID' : 'REBALANCE NEEDED'}
            </span>
          </div>

          {/* Factor Diversification Card */}
          <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800/90 space-y-1">
            <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-bold">
              DIVERSIFICATION
            </span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-3xl font-extrabold tracking-tight font-mono text-cyan-400">
                {diversificationHealth}
              </span>
              <span className="text-xs text-slate-400">/ 100</span>
            </div>
            <span className="text-[10px] text-slate-400 block truncate">
              {sectorCount} Sectors (HHI {Math.round(hhi)})
            </span>
          </div>

          {/* Multi-Agent Conviction Card */}
          <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800/90 space-y-1">
            <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-bold">
              RESEARCH CONVICTION
            </span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-3xl font-extrabold tracking-tight font-mono text-purple-400">
                {Math.round(weightedScore)}
              </span>
              <span className="text-xs text-slate-400">/ 100</span>
            </div>
            <span className="text-[10px] text-slate-400 block truncate">
              Weighted Agent Average
            </span>
          </div>

          {/* Stress & Drawdown Risk Card */}
          <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800/90 space-y-1">
            <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-bold">
              STRESS INDEX
            </span>
            <div className="flex items-baseline gap-1.5">
              <span
                className={`text-3xl font-extrabold tracking-tight font-mono ${
                  stressIntensity <= 0.3 ? 'text-emerald-400' : stressIntensity <= 0.6 ? 'text-cyan-400' : 'text-amber-400'
                }`}
              >
                {Math.round(stressIntensity * 100)}%
              </span>
            </div>
            <span className="text-[10px] text-slate-400 block truncate">
              P&amp;L Trajectory: {totalPnlPercent >= 0 ? '+' : ''}{totalPnlPercent.toFixed(1)}%
            </span>
          </div>
        </div>
      </div>

      {/* Portfolio Health Diagnosis Footer */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/70 text-xs">
        <div className="flex items-center gap-2 text-slate-300 font-sans">
          <Activity className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
          <span>
            <strong className="text-white font-mono">Portfolio Health Diagnosis:</strong> {diagnosisNote}
          </span>
        </div>
        <div className="flex items-center gap-2 shrink-0 font-mono text-[11px] text-slate-400">
          <span>{sectorCount} Sectors Active</span>
          <span>•</span>
          <span>{holdings.length} Positions</span>
        </div>
      </div>

      {/* Educational Use Disclaimer */}
      <EducationalDisclaimer
        variant="footer"
        actionContext="BUY_SELL_HOLD"
        className="mt-2"
      />
    </div>
  );
};
