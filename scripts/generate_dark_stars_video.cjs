const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const width = 1280;
const height = 720;
const fps = 25;
const duration = 6; // 6-second seamless loop
const totalFrames = fps * duration;

const outPath1 = path.join(process.cwd(), 'public/assets/videos/dark_cosmic_stars.mp4');
const outPath2 = path.join(process.cwd(), 'assets/videos/dark_cosmic_stars.mp4');

// Seeded random
let seed = 77889;
function rand() {
  seed = (seed * 16807) % 2147483647;
  return (seed - 1) / 2147483646;
}

// 1. 200 Deep Space Twinkling Stars
const stars = [];
for (let i = 0; i < 200; i++) {
  stars.push({
    x: Math.floor(rand() * width),
    y: Math.floor(rand() * height),
    baseR: 0.7 + rand() * 1.6,
    speed: 1.0 + Math.floor(rand() * 4), // Integer cycles for seamless loop
    phase: rand() * Math.PI * 2,
    color: rand() > 0.45 ? [255, 255, 255] : rand() > 0.4 ? [190, 230, 255] : [230, 215, 255],
  });
}

// 2. 26 Four-Point Diamond Starbursts (✦)
const sparkles = [];
for (let i = 0; i < 26; i++) {
  sparkles.push({
    x: Math.floor(30 + rand() * (width - 60)),
    y: Math.floor(25 + rand() * (height * 0.88)),
    rayLen: 7 + rand() * 15,
    speed: 1.0 + Math.floor(rand() * 3), // Integer cycles
    phase: rand() * Math.PI * 2,
    color: rand() > 0.5 ? [220, 240, 255] : [245, 235, 255],
  });
}

// Prepare ffmpeg spawn
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

function setPixel(x, y, r, g, b) {
  if (x < 0 || x >= width || y < 0 || y >= height) return;
  const idx = (y * width + x) * 3;
  frameBuffer[idx]     = Math.max(frameBuffer[idx], r);
  frameBuffer[idx + 1] = Math.max(frameBuffer[idx + 1], g);
  frameBuffer[idx + 2] = Math.max(frameBuffer[idx + 2], b);
}

function renderFrame(frameIdx) {
  const t = frameIdx / totalFrames; // 0.0 to 1.0
  const progressAngle = t * Math.PI * 2;

  // 1. Pitch-Dark Midnight Void Backdrop (#010308) with very subtle dark sapphire nebula aura
  for (let y = 0; y < height; y++) {
    const ny = y / height;
    for (let x = 0; x < width; x++) {
      const nx = (x - width * 0.5) / (width * 0.5);
      // Faint atmospheric aura at top center (very dark and moody)
      const dist = Math.sqrt(nx * nx * 1.6 + ny * ny * 3.5);
      const darkAura = Math.max(0, 1.0 - dist) * 0.22;

      const idx = (y * width + x) * 3;
      // Deep obsidian void base: (2, 4, 10)
      frameBuffer[idx]     = Math.min(255, Math.floor(2 + darkAura * 18));  // R (subtle dark indigo)
      frameBuffer[idx + 1] = Math.min(255, Math.floor(4 + darkAura * 22));  // G (faint deep teal)
      frameBuffer[idx + 2] = Math.min(255, Math.floor(10 + darkAura * 45)); // B (midnight sapphire)
    }
  }

  // 2. High-Contrast Twinkling Stars
  for (const s of stars) {
    const twinkle = 0.35 + 0.65 * Math.sin(progressAngle * s.speed + s.phase);
    if (twinkle < 0.1) continue;

    const r = Math.max(1, Math.round(s.baseR));
    const cr = Math.floor(s.color[0] * twinkle);
    const cg = Math.floor(s.color[1] * twinkle);
    const cb = Math.floor(s.color[2] * twinkle);

    for (let dy = -r; dy <= r; dy++) {
      for (let dx = -r; dx <= r; dx++) {
        if (dx * dx + dy * dy <= r * r) {
          setPixel(s.x + dx, s.y + dy, cr, cg, cb);
        }
      }
    }
  }

  // 3. Radiant 4-Point Diamond Starbursts (✦)
  for (const sp of sparkles) {
    const intensity = Math.max(0, Math.sin(progressAngle * sp.speed + sp.phase));
    if (intensity < 0.08) continue;

    const flare = Math.round(sp.rayLen * (0.6 + 0.4 * intensity));
    const [sr, sg, sb] = sp.color;

    // Glowing center diamond core
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        setPixel(sp.x + dx, sp.y + dy, Math.floor(sr * intensity), Math.floor(sg * intensity), Math.floor(sb * intensity));
      }
    }

    // Horizontal flare ray
    for (let dx = -flare; dx <= flare; dx++) {
      const falloff = 1 - Math.abs(dx) / (flare + 1);
      setPixel(
        sp.x + dx,
        sp.y,
        Math.floor(sr * intensity * falloff * 0.95),
        Math.floor(sg * intensity * falloff * 0.95),
        Math.floor(sb * intensity * falloff * 0.95)
      );
    }

    // Vertical flare ray
    for (let dy = -flare; dy <= flare; dy++) {
      const falloff = 1 - Math.abs(dy) / (flare + 1);
      setPixel(
        sp.x,
        sp.y + dy,
        Math.floor(sr * intensity * falloff * 0.95),
        Math.floor(sg * intensity * falloff * 0.95),
        Math.floor(sb * intensity * falloff * 0.95)
      );
    }
  }

  // 4. Subtle Shooting Star Streak across dark upper sky
  const shootProgress = (t * 2.0) % 1.0;
  if (shootProgress < 0.3) {
    const sT = shootProgress / 0.3;
    const startX = width * 0.25 + sT * 320;
    const startY = height * 0.12 + sT * 120;
    const len = 40;
    for (let l = 0; l < len; l++) {
      const sx = Math.floor(startX - l * 2.0);
      const sy = Math.floor(startY - l * 0.75);
      const falloff = (1 - l / len) * (1 - sT * 0.6);
      setPixel(sx, sy, Math.floor(230 * falloff), Math.floor(245 * falloff), Math.floor(255 * falloff));
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
    console.log('Successfully generated dark_cosmic_stars.mp4!');
  } else {
    console.error('ffmpeg failed with code', code);
  }
});
