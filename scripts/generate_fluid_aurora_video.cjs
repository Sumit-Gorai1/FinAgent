const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const width = 1280;
const height = 720;
const fps = 25;
const duration = 6; // 6-second seamless loop
const totalFrames = fps * duration;

const outPath1 = path.join(process.cwd(), 'public/assets/videos/fluid_quantum_aurora.mp4');
const outPath2 = path.join(process.cwd(), 'assets/videos/fluid_quantum_aurora.mp4');

// Floating glowing bokeh particles
const particles = [];
let seed = 45678;
function rand() {
  seed = (seed * 16807) % 2147483647;
  return (seed - 1) / 2147483646;
}

for (let i = 0; i < 45; i++) {
  particles.push({
    x: rand() * width,
    y: rand() * height,
    radius: 3 + rand() * 8,
    speedX: (rand() - 0.5) * 0.8,
    speedY: (rand() - 0.5) * 0.5,
    phase: rand() * Math.PI * 2,
    freq: 1 + Math.floor(rand() * 3),
    color: rand() > 0.6 ? [6, 182, 212] : rand() > 0.3 ? [16, 185, 129] : [139, 92, 246],
  });
}

const ffmpeg = spawn('ffmpeg', [
  '-y',
  '-f', 'rawvideo',
  '-vcodec', 'rawvideo',
  '-s', `${width}x${height}`,
  '-pix_fmt', 'rgb24',
  '-r', String(fps),
  '-i', '-',
  '-c:v', 'libx264',
  '-preset', 'fast',
  '-pix_fmt', 'yuv420p',
  '-movflags', '+faststart',
  outPath1
]);

ffmpeg.stderr.on('data', () => {});

const frameBuffer = Buffer.alloc(width * height * 3);

function renderFrame(frameIdx) {
  const t = frameIdx / totalFrames; // 0.0 to 1.0
  const progressAngle = t * Math.PI * 2;

  // 1. Organic Kinetic Aurora Wave Fields
  for (let y = 0; y < height; y++) {
    const ny = y / height;
    const wave1 = Math.sin(ny * 4.0 + progressAngle) * 0.25;
    const wave2 = Math.cos(ny * 2.5 - progressAngle * 2) * 0.2;

    for (let x = 0; x < width; x++) {
      const nx = x / width;
      // Fluid plasma field calculation
      const p1 = Math.sin(nx * 3.5 + wave1 + progressAngle);
      const p2 = Math.cos(ny * 3.0 + wave2 - progressAngle);
      const p3 = Math.sin((nx + ny) * 3.0 + progressAngle);
      const plasma = (p1 + p2 + p3) / 3.0; // -1.0 to 1.0

      // Color mapping: Midnight navy -> Cyan luminescence -> Emerald liquidity -> Violet aura
      const intensity = Math.max(0, plasma * 0.5 + 0.5); // 0.0 to 1.0

      // Radial vignette factor from center
      const dx = (nx - 0.5) * 1.5;
      const dy = (ny - 0.5) * 1.2;
      const vignette = Math.max(0, 1.0 - Math.sqrt(dx * dx + dy * dy) * 0.85);

      const r = Math.min(255, Math.floor((6 + intensity * 40 + Math.sin(progressAngle + nx) * 15) * vignette));
      const g = Math.min(255, Math.floor((12 + intensity * 95 + Math.cos(progressAngle + ny) * 25) * vignette));
      const b = Math.min(255, Math.floor((30 + intensity * 140 + Math.sin(progressAngle * 2) * 30) * vignette));

      const idx = (y * width + x) * 3;
      frameBuffer[idx]     = r;
      frameBuffer[idx + 1] = g;
      frameBuffer[idx + 2] = b;
    }
  }

  // 2. High-Tech Multi-Ribbon Light Curves (Fluid Market Energy Bands)
  const ribbons = [
    { freq: 0.004, amp: 75, offset: height * 0.45, color: [6, 182, 212], width: 5 },  // Electric Cyan
    { freq: 0.003, amp: 95, offset: height * 0.55, color: [16, 185, 129], width: 4 }, // Emerald Flow
    { freq: 0.005, amp: 65, offset: height * 0.38, color: [139, 92, 246], width: 4 }, // Stellar Violet
    { freq: 0.002, amp: 110, offset: height * 0.62, color: [56, 189, 248], width: 3 }, // Sky Blue
  ];

  for (const r of ribbons) {
    const [cr, cg, cb] = r.color;
    for (let x = 0; x < width; x++) {
      const cy = Math.floor(
        r.offset +
        Math.sin(x * r.freq + progressAngle) * r.amp +
        Math.cos(x * (r.freq * 1.5) - progressAngle * 1.5) * (r.amp * 0.4)
      );

      for (let dy = -r.width; dy <= r.width; dy++) {
        const py = cy + dy;
        if (py >= 0 && py < height) {
          const falloff = 1.0 - Math.abs(dy) / (r.width + 1);
          const idx = (py * width + x) * 3;
          frameBuffer[idx]     = Math.min(255, frameBuffer[idx] + Math.floor(cr * falloff * 0.85));
          frameBuffer[idx + 1] = Math.min(255, frameBuffer[idx + 1] + Math.floor(cg * falloff * 0.85));
          frameBuffer[idx + 2] = Math.min(255, frameBuffer[idx + 2] + Math.floor(cb * falloff * 0.85));
        }
      }
    }
  }

  // 3. Floating Bokeh Particles with Breathing Luminance
  for (const p of particles) {
    const pulse = 0.5 + 0.5 * Math.sin(progressAngle * p.freq + p.phase);
    const px = Math.floor(p.x);
    const py = Math.floor(p.y);
    const rad = Math.ceil(p.radius * (0.8 + 0.4 * pulse));
    const [pr, pg, pb] = p.color;

    for (let dy = -rad; dy <= rad; dy++) {
      const cy = py + dy;
      if (cy < 0 || cy >= height) continue;
      for (let dx = -rad; dx <= rad; dx++) {
        const cx = px + dx;
        if (cx < 0 || cx >= width) continue;
        const d2 = dx * dx + dy * dy;
        if (d2 <= rad * rad) {
          const alpha = (1.0 - Math.sqrt(d2) / rad) * pulse * 0.7;
          const idx = (cy * width + cx) * 3;
          frameBuffer[idx]     = Math.min(255, frameBuffer[idx] + Math.floor(pr * alpha));
          frameBuffer[idx + 1] = Math.min(255, frameBuffer[idx + 1] + Math.floor(pg * alpha));
          frameBuffer[idx + 2] = Math.min(255, frameBuffer[idx + 2] + Math.floor(pb * alpha));
        }
      }
    }
  }

  ffmpeg.stdin.write(frameBuffer);
}

for (let f = 0; f < totalFrames; f++) {
  renderFrame(f);
}

ffmpeg.stdin.end();

ffmpeg.on('close', (code) => {
  if (code === 0) {
    try {
      fs.copyFileSync(outPath1, outPath2);
    } catch {}
    console.log('Successfully generated fluid_quantum_aurora.mp4!');
  } else {
    console.error('ffmpeg failed with code', code);
  }
});
