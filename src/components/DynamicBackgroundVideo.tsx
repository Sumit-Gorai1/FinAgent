import React, { useState, useEffect, useRef } from 'react';

export type BackgroundThemeId = 'dark_obsidian_stars' | 'deep_nebula_galaxy' | 'fluid_aurora';

interface BackgroundTheme {
  id: BackgroundThemeId;
  name: string;
  badge: string;
  videoSrc: string;
  accentColor: string;
  description: string;
  starColor: string;
}

const BACKGROUND_THEMES: BackgroundTheme[] = [
  {
    id: 'dark_obsidian_stars',
    name: 'Dark Obsidian Starfield',
    badge: 'DARK & STARS',
    videoSrc: '/assets/videos/dark_cosmic_stars.mp4',
    accentColor: '#38bdf8',
    starColor: '#ffffff',
    description: 'Pitch-dark midnight void with high-contrast twinkling diamond stars & 4-point starbursts',
  },
  {
    id: 'deep_nebula_galaxy',
    name: 'Deep Nebula Galaxy',
    badge: 'COSMIC DUST',
    videoSrc: '/assets/videos/dark_cosmic_stars.mp4',
    accentColor: '#a855f7',
    starColor: '#e0e7ff',
    description: 'Dark celestial cosmos with deep sapphire/violet nebula clouds and constellation bridges',
  },
  {
    id: 'fluid_aurora',
    name: 'Fluid Quantum Aurora',
    badge: 'KINETIC WAVES',
    videoSrc: '/assets/videos/fluid_quantum_aurora.mp4',
    accentColor: '#06b6d4',
    starColor: '#a5f3fc',
    description: 'Deep midnight abyss with undulating kinetic light ribbons',
  },
];

export interface DynamicBackgroundVideoProps {
  initialOpacity?: number;
}

interface StarParticle {
  x: number;
  y: number;
  baseRadius: number;
  alpha: number;
  speed: number;
  phase: number;
  color: string;
}

interface DiamondSparkle {
  x: number;
  y: number;
  rayLength: number;
  speed: number;
  phase: number;
  rotation: number;
  color: string;
  pulseScale: number;
}

interface ShootingStar {
  x: number;
  y: number;
  dx: number;
  dy: number;
  length: number;
  speed: number;
  life: number;
  maxLife: number;
  opacity: number;
}

interface CursorDust {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  alpha: number;
  decay: number;
  color: string;
  isSparkle: boolean;
}

export const DynamicBackgroundVideo: React.FC<DynamicBackgroundVideoProps> = ({
  initialOpacity = 0.75,
}) => {
  const [isEnabled, setIsEnabled] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('finagent_bg_video_enabled');
      return saved !== null ? saved === 'true' : true;
    } catch {
      return true;
    }
  });

  const [currentThemeId, setCurrentThemeId] = useState<BackgroundThemeId>(() => {
    try {
      const saved = localStorage.getItem('finagent_bg_video_theme');
      return (saved as BackgroundThemeId) || 'dark_obsidian_stars';
    } catch {
      return 'dark_obsidian_stars';
    }
  });

  const [opacityLevel, setOpacityLevel] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('finagent_bg_video_opacity');
      return saved ? parseFloat(saved) : initialOpacity;
    } catch {
      return initialOpacity;
    }
  });

  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [showShootingStars, setShowShootingStars] = useState<boolean>(true);
  const [enableCursorDust, setEnableCursorDust] = useState<boolean>(true);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const cursorDustRef = useRef<CursorDust[]>([]);

  const activeTheme = BACKGROUND_THEMES.find((t) => t.id === currentThemeId) || BACKGROUND_THEMES[0];

  // Sync preferences to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('finagent_bg_video_enabled', String(isEnabled));
      localStorage.setItem('finagent_bg_video_theme', currentThemeId);
      localStorage.setItem('finagent_bg_video_opacity', String(opacityLevel));
    } catch {}
  }, [isEnabled, currentThemeId, opacityLevel]);

  // Video play/pause handling
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (isEnabled && isPlaying) {
      video.play().catch(() => {});
    } else {
      video.pause();
    }
  }, [isEnabled, isPlaying, currentThemeId]);

  // Switch video source when theme changes
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    if (video.src !== activeTheme.videoSrc) {
      video.src = activeTheme.videoSrc;
      video.load();
      if (isEnabled && isPlaying) {
        video.play().catch(() => {});
      }
    }
  }, [activeTheme, isEnabled, isPlaying]);

  // Cursor dust interaction
  useEffect(() => {
    if (!enableCursorDust || !isEnabled) return;

    let lastSpawn = 0;
    const handleMouseMove = (e: MouseEvent) => {
      const now = performance.now();
      if (now - lastSpawn < 22) return;
      lastSpawn = now;

      const colors = ['#ffffff', '#bae6fd', '#e0e7ff', '#fef08a', '#a5f3fc'];
      const dustCount = Math.floor(Math.random() * 2) + 1;

      for (let i = 0; i < dustCount; i++) {
        cursorDustRef.current.push({
          x: e.clientX + (Math.random() - 0.5) * 16,
          y: e.clientY + (Math.random() - 0.5) * 16,
          vx: (Math.random() - 0.5) * 0.7,
          vy: -Math.random() * 0.9 - 0.2, // float upwards gently
          size: Math.random() * 2.8 + 1.2,
          alpha: 0.9,
          decay: Math.random() * 0.022 + 0.015,
          color: colors[Math.floor(Math.random() * colors.length)],
          isSparkle: Math.random() > 0.45,
        });
      }

      if (cursorDustRef.current.length > 60) {
        cursorDustRef.current.splice(0, cursorDustRef.current.length - 60);
      }
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [enableCursorDust, isEnabled]);

  // Dark Canvas Stars & Sparkles Engine
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !isEnabled) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    // 1. Initialize ~220 multi-magnitude twinkling stars
    const starColors = [
      'rgba(255, 255, 255, ',   // Pure Diamond White
      'rgba(186, 230, 253, ',   // Ice Blue
      'rgba(224, 231, 255, ',   // Stellar Lilac
      'rgba(254, 240, 138, ',   // Faint Starlight Gold
    ];
    const stars: StarParticle[] = [];
    const starCount = Math.min(240, Math.floor(width / 6));

    for (let i = 0; i < starCount; i++) {
      stars.push({
        x: Math.random() * width,
        y: Math.random() * height,
        baseRadius: Math.random() * 1.5 + 0.6,
        alpha: Math.random() * 0.75 + 0.25,
        speed: Math.random() * 0.028 + 0.008,
        phase: Math.random() * Math.PI * 2,
        color: starColors[Math.floor(Math.random() * starColors.length)],
      });
    }

    // 2. Initialize 28 radiant 4-point diamond starbursts (✦)
    const sparkles: DiamondSparkle[] = [];
    const sparkleColors = ['#ffffff', '#bae6fd', '#e0e7ff', '#c7d2fe', '#fef08a'];
    const sparkleCount = Math.min(30, Math.floor(width / 50));

    for (let i = 0; i < sparkleCount; i++) {
      sparkles.push({
        x: Math.random() * (width - 60) + 30,
        y: Math.random() * (height * 0.88) + 25,
        rayLength: Math.random() * 15 + 8,
        speed: Math.random() * 0.02 + 0.008,
        phase: Math.random() * Math.PI * 2,
        rotation: (Math.random() - 0.5) * 0.25,
        color: sparkleColors[Math.floor(Math.random() * sparkleColors.length)],
        pulseScale: Math.random() * 0.4 + 0.8,
      });
    }

    // 3. Shooting stars
    const shootingStars: ShootingStar[] = [];
    let lastShootingStar = 0;

    const maybeSpawnShootingStar = (timeNow: number) => {
      if (!showShootingStars) return;
      if (timeNow - lastShootingStar > 3000 + Math.random() * 3500) {
        lastShootingStar = timeNow;
        const angle = Math.PI / 4 + (Math.random() - 0.5) * 0.3;
        const speed = Math.random() * 7 + 10;
        shootingStars.push({
          x: Math.random() * (width * 0.8),
          y: Math.random() * (height * 0.35),
          dx: Math.cos(angle) * speed,
          dy: Math.sin(angle) * speed,
          length: Math.random() * 65 + 40,
          speed,
          life: 0,
          maxLife: Math.floor(Math.random() * 30 + 35),
          opacity: Math.random() * 0.55 + 0.45,
        });
      }
    };

    // Helper: Draw 4-point cross-flare diamond sparkle (✦)
    const drawDiamondSparkle = (
      cx: number,
      cy: number,
      ray: number,
      alpha: number,
      color: string,
      rotation: number
    ) => {
      ctx.save();
      ctx.translate(cx, cy);
      if (rotation) ctx.rotate(rotation);

      // Core glow
      const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, ray * 0.6);
      grad.addColorStop(0, `rgba(255, 255, 255, ${alpha})`);
      grad.addColorStop(0.4, `${color}${Math.floor(alpha * 160).toString(16).padStart(2, '0')}`);
      grad.addColorStop(1, 'transparent');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(0, 0, ray * 0.6, 0, Math.PI * 2);
      ctx.fill();

      // Horizontal ray
      const hGrad = ctx.createLinearGradient(-ray, 0, ray, 0);
      hGrad.addColorStop(0, 'transparent');
      hGrad.addColorStop(0.5, `rgba(255, 255, 255, ${alpha})`);
      hGrad.addColorStop(1, 'transparent');
      ctx.fillStyle = hGrad;
      ctx.beginPath();
      ctx.moveTo(-ray, 0);
      ctx.quadraticCurveTo(0, -ray * 0.16, ray, 0);
      ctx.quadraticCurveTo(0, ray * 0.16, -ray, 0);
      ctx.fill();

      // Vertical ray
      const vGrad = ctx.createLinearGradient(0, -ray, 0, ray);
      vGrad.addColorStop(0, 'transparent');
      vGrad.addColorStop(0.5, `rgba(255, 255, 255, ${alpha})`);
      vGrad.addColorStop(1, 'transparent');
      ctx.fillStyle = vGrad;
      ctx.beginPath();
      ctx.moveTo(0, -ray);
      ctx.quadraticCurveTo(-ray * 0.16, 0, 0, ray);
      ctx.quadraticCurveTo(ray * 0.16, 0, 0, -ray);
      ctx.fill();

      // Sharp central pip
      ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
      ctx.beginPath();
      ctx.arc(0, 0, Math.max(1, ray * 0.12), 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    };

    let animationTime = 0;

    const render = (timestamp: number) => {
      ctx.clearRect(0, 0, width, height);
      animationTime += 0.016;

      maybeSpawnShootingStar(timestamp);

      // 1. Draw Twinkling Micro-Stars
      for (let i = 0; i < stars.length; i++) {
        const s = stars[i];
        s.phase += s.speed;
        const currentAlpha = s.alpha * (0.35 + 0.65 * Math.sin(s.phase));
        if (currentAlpha <= 0) continue;

        ctx.beginPath();
        ctx.arc(s.x, s.y, s.baseRadius * (0.8 + 0.35 * Math.sin(s.phase * 0.8)), 0, Math.PI * 2);
        ctx.fillStyle = `${s.color}${currentAlpha})`;
        ctx.fill();
      }

      // 2. Draw 4-Point Diamond Starbursts (✦)
      for (let i = 0; i < sparkles.length; i++) {
        const sp = sparkles[i];
        sp.phase += sp.speed;
        const pulse = 0.5 + 0.5 * Math.sin(sp.phase);
        if (pulse < 0.08) continue;

        const effectiveRay = sp.rayLength * (0.5 + 0.5 * pulse) * sp.pulseScale;
        const effectiveAlpha = Math.min(1, pulse * 0.95);

        drawDiamondSparkle(
          sp.x,
          sp.y,
          effectiveRay,
          effectiveAlpha,
          sp.color,
          sp.rotation + Math.sin(sp.phase * 0.3) * 0.06
        );
      }

      // 3. Draw Shooting Stars
      for (let i = shootingStars.length - 1; i >= 0; i--) {
        const ss = shootingStars[i];
        ss.x += ss.dx;
        ss.y += ss.dy;
        ss.life++;

        const lifeRatio = ss.life / ss.maxLife;
        const currentAlpha = ss.opacity * Math.sin(lifeRatio * Math.PI);

        if (lifeRatio >= 1) {
          shootingStars.splice(i, 1);
          continue;
        }

        const tailX = ss.x - (ss.dx / ss.speed) * ss.length;
        const tailY = ss.y - (ss.dy / ss.speed) * ss.length;

        const grad = ctx.createLinearGradient(tailX, tailY, ss.x, ss.y);
        grad.addColorStop(0, 'transparent');
        grad.addColorStop(0.7, `rgba(186, 230, 253, ${currentAlpha * 0.65})`);
        grad.addColorStop(1, `rgba(255, 255, 255, ${currentAlpha})`);

        ctx.strokeStyle = grad;
        ctx.lineWidth = 1.8;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(tailX, tailY);
        ctx.lineTo(ss.x, ss.y);
        ctx.stroke();

        // Star head
        ctx.beginPath();
        ctx.arc(ss.x, ss.y, 2.2, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${currentAlpha})`;
        ctx.fill();
      }

      // 4. Draw Interactive Cursor Stardust
      const dust = cursorDustRef.current;
      for (let i = dust.length - 1; i >= 0; i--) {
        const d = dust[i];
        d.x += d.vx;
        d.y += d.vy;
        d.alpha -= d.decay;

        if (d.alpha <= 0) {
          dust.splice(i, 1);
          continue;
        }

        if (d.isSparkle) {
          drawDiamondSparkle(d.x, d.y, d.size * 2.2, d.alpha, d.color, animationTime * 2);
        } else {
          ctx.beginPath();
          ctx.arc(d.x, d.y, d.size, 0, Math.PI * 2);
          ctx.fillStyle = `${d.color}${Math.floor(d.alpha * 255).toString(16).padStart(2, '0')}`;
          ctx.fill();
        }
      }

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animId);
    };
  }, [isEnabled, showShootingStars, currentThemeId]);

  return (
    <>
      {/* Dark Cosmos & Starfield Fixed Underlay */}
      {isEnabled && (
        <div
          className="fixed inset-0 w-full h-full pointer-events-none -z-10 overflow-hidden select-none transition-opacity duration-700"
          style={{ opacity: opacityLevel }}
          aria-hidden="true"
        >
          {/* Pitch-Dark Deep Obsidian Base Layer */}
          <div className="absolute inset-0 bg-[#010309] pointer-events-none" />

          {/* High-Definition Looping Video Underlay */}
          <video
            ref={videoRef}
            src={activeTheme.videoSrc}
            autoPlay
            loop
            muted
            playsInline
            crossOrigin="anonymous"
            className="absolute inset-0 w-full h-full object-cover transform-gpu filter contrast-130 brightness-105"
          />

          {/* Subtle Dark Cosmic Sapphire Nebula Diffusion (Dark & Atmospheric) */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: `
                radial-gradient(ellipse 90% 50% at 50% -10%, rgba(30, 41, 59, 0.45), rgba(15, 23, 42, 0.35), transparent 70%),
                radial-gradient(circle 500px at 20% 30%, rgba(30, 58, 138, 0.18), transparent 70%),
                radial-gradient(circle 500px at 80% 35%, rgba(59, 7, 100, 0.16), transparent 70%),
                radial-gradient(ellipse 70% 35% at 50% 105%, rgba(15, 23, 42, 0.5), transparent 70%)
              `,
            }}
          />

          {/* Live High-Contrast Stars, 4-Point Starbursts & Meteors Canvas */}
          <canvas
            ref={canvasRef}
            className="absolute inset-0 w-full h-full pointer-events-none mix-blend-screen"
          />

          {/* Deep Space Vignette Scrim (Ensures true dark edges & contrast) */}
          <div className="absolute inset-0 bg-radial-gradient from-transparent via-transparent to-[#010309]/85 pointer-events-none" />
        </div>
      )}
    </>
  );
};
