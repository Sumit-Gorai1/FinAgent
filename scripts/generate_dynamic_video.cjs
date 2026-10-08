const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const width = 1280;
const height = 720;
const fps = 25;
const duration = 6; // 6-second perfect loop
const totalFrames = fps * duration;

const outPath1 = path.join(process.cwd(), 'public/assets/videos/dynamic_market_motion.mp4');
const outPath2 = path.join(process.cwd(), 'assets/videos/dynamic_market_motion.mp4');

// Seeded random
let seed = 98765;
function rand() {
  seed = (seed * 16807) % 2147483647;
  return (seed - 1) / 2147483646;
}

// 1. Data Columns (Cyber Matrix streams)
const matrixColumns = [];
for (let c = 0; c < 24; c++) {
  matrixColumns.push({
    x: Math.floor(c * (width / 24) + (rand() * 20)),
    speed: 1 + Math.floor(rand() * 3), // Integer cycles
    length: 8 + Math.floor(rand() * 12),
    phase: rand() * Math.PI * 2,
    charWidth: 8,
    color: rand() > 0.4 ? [6, 182, 212] : [16, 185, 129], // Cyan or Emerald
  });
}

// 2. Candlestick series (12 bars across middle)
const candlesticks = [];
for (let i = 0; i < 14; i++) {
  const isGreen = i % 3 !== 2;
  candlesticks.push({
    x: Math.floor(80 + i * (width - 160) / 13),
    w: 22,
    baseY: height * 0.45 + (Math.sin(i * 0.5) * 60),
    baseH: 50 + (i % 4) * 25,
    wickUp: 35 + (i % 3) * 20,
    wickDn: 30 + (i % 2) * 25,
    isGreen,
    phase: i * 0.45,
  });
}

// 3. Floating glowing particles & constellation nodes
const nodes = [];
for (let i = 0; i < 40; i++) {
  nodes.push({
    x: Math.floor(rand() * width),
    y: Math.floor(rand() * height),
    baseR: 2 + rand() * 3.5,
    freq: 1 + Math.floor(rand() * 3),
    phase: rand() * Math.PI * 2,
    color: rand() > 0.6 ? [0, 242, 254] : rand() > 0.3 ? [16, 185, 129] : [168, 85, 247],
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

function setPixel(x, y, r, g, b, alpha = 1) {
  if (x < 0 || x >= width || y < 0 || y >= height) return;
  const idx = (y * width + x) * 3;
  if (alpha >= 1) {
    frameBuffer[idx]     = Math.max(frameBuffer[idx], r);
    frameBuffer[idx + 1] = Math.max(frameBuffer[idx + 1], g);
    frameBuffer[idx + 2] = Math.max(frameBuffer[idx + 2], b);
  } else {
    frameBuffer[idx]     = Math.min(255, frameBuffer[idx] + Math.floor(r * alpha));
    frameBuffer[idx + 1] = Math.min(255, frameBuffer[idx + 1] + Math.floor(g * alpha));
    frameBuffer[idx + 2] = Math.min(255, frameBuffer[idx + 2] + Math.floor(b * alpha));
  }
}

function renderFrame(frameIdx) {
  const t = frameIdx / totalFrames; // 0.0 to 1.0
  const progressAngle = t * Math.PI * 2;

  // 1. Cosmic Background with Deep Indigo / Cyan Nebula Glow
  for (let y = 0; y < height; y++) {
    const ny = y / height;
    for (let x = 0; x < width; x++) {
      const nx = (x - width * 0.5) / (width * 0.5);
      // Top radiant glow & center glow
      const dist = Math.sqrt(nx * nx * 1.8 + (ny - 0.3) * (ny - 0.3) * 2.8);
      const aura = Math.max(0, 1.0 - dist) * 0.55;

      const idx = (y * width + x) * 3;
      // Base dark obsidian + glowing ambient violet/cyan
      frameBuffer[idx]     = Math.min(255, Math.floor(4 + aura * 35));   // R
      frameBuffer[idx + 1] = Math.min(255, Math.floor(9 + aura * 70));   // G (cyan/emerald glow)
      frameBuffer[idx + 2] = Math.min(255, Math.floor(22 + aura * 110)); // B (indigo glow)
    }
  }

  // 2. Animated Perspective Financial Horizon Grid
  const gridSpacing = 48;
  const gridOffset = (t * gridSpacing * 2) % gridSpacing; // Scrolling grid
  for (let y = Math.floor(height * 0.55); y < height; y += 22) {
    const depth = (y - height * 0.55) / (height * 0.45);
    const alpha = depth * 0.35;
    for (let x = 0; x < width; x++) {
      setPixel(x, y, 6, 182, 212, alpha);
    }
  }
  // Vertical perspective rays
  for (let vx = 0; vx <= width; vx += 72) {
    const centerX = width * 0.5;
    const vanishY = height * 0.55;
    const targetX = centerX + (vx - centerX) * 1.6;
    for (let step = 0; step < 80; step++) {
      const s = step / 80;
      const px = Math.floor(centerX + (targetX - centerX) * s);
      const py = Math.floor(vanishY + (height - vanishY) * s);
      setPixel(px, py, 6, 182, 212, s * 0.28);
    }
  }

  // 3. Falling Matrix Data Streams
  for (const col of matrixColumns) {
    const headY = Math.floor(((t * col.speed * height) + (col.phase * 50)) % (height + 200)) - 100;
    const [cr, cg, cb] = col.color;
    for (let l = 0; l < col.length; l++) {
      const py = headY - l * 12;
      if (py >= 0 && py < height) {
        const brightness = (1 - l / col.length) * 0.75;
        for (let dx = -col.charWidth / 2; dx < col.charWidth / 2; dx++) {
          setPixel(Math.floor(col.x + dx), py, cr, cg, cb, brightness);
        }
      }
    }
  }

  // 4. Moving Spline / Glowing Price Curve
  for (let x = 0; x < width; x += 2) {
    const curveY = Math.floor(
      height * 0.42 +
      Math.sin(x * 0.006 + progressAngle) * 55 +
      Math.cos(x * 0.012 - progressAngle * 2) * 25
    );
    // Draw thick glowing spline
    for (let dy = -2; dy <= 2; dy++) {
      setPixel(x, curveY + dy, 0, 242, 254, 0.95);
      setPixel(x, curveY + dy * 2, 6, 182, 212, 0.5);
    }
  }

  // 5. Dynamic Candlestick Bars & Glowing Wicks
  for (const cs of candlesticks) {
    const osc = Math.sin(progressAngle * 2 + cs.phase) * 18;
    const bodyTop = Math.floor(cs.baseY + osc);
    const bodyH = Math.floor(cs.baseH + osc * 0.5);
    const bodyBottom = bodyTop + bodyH;
    const centerX = cs.x;

    const [br, bg, bb] = cs.isGreen ? [16, 185, 129] : [244, 63, 94]; // Emerald vs Rose

    // Draw Upper & Lower Wicks
    const wickTop = bodyTop - cs.wickUp;
    const wickBottom = bodyBottom + cs.wickDn;
    for (let py = wickTop; py < wickBottom; py++) {
      setPixel(centerX, py, br, bg, bb, 0.85);
      setPixel(centerX + 1, py, br, bg, bb, 0.4);
      setPixel(centerX - 1, py, br, bg, bb, 0.4);
    }

    // Draw Candlestick Body with luminous fill
    for (let py = bodyTop; py <= bodyBottom; py++) {
      for (let px = centerX - cs.w / 2; px <= centerX + cs.w / 2; px++) {
        setPixel(Math.floor(px), py, br, bg, bb, 0.8);
      }
    }
    // Luminous border around candlestick
    for (let py = bodyTop; py <= bodyBottom; py++) {
      setPixel(Math.floor(centerX - cs.w / 2), py, 255, 255, 255, 0.7);
      setPixel(Math.floor(centerX + cs.w / 2), py, 255, 255, 255, 0.7);
    }
  }

  // 6. Glowing Constellation Nodes & Connecting Laser Filaments
  for (let i = 0; i < nodes.length; i++) {
    const n = nodes[i];
    const pulse = 0.5 + 0.5 * Math.sin(progressAngle * n.freq + n.phase);
    const r = n.baseR * (0.8 + 0.4 * pulse);
    const [nr, ng, nb] = n.color;

    // Node circle
    const ir = Math.ceil(r);
    for (let dy = -ir; dy <= ir; dy++) {
      for (let dx = -ir; dx <= ir; dx++) {
        if (dx * dx + dy * dy <= r * r) {
          setPixel(Math.floor(n.x + dx), Math.floor(n.y + dy), nr, ng, nb, 0.9);
        }
      }
    }

    // Connect to nearby nodes
    for (let j = i + 1; j < nodes.length; j++) {
      const n2 = nodes[j];
      const dx = n.x - n2.x;
      const dy = n.y - n2.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < 160) {
        const lineAlpha = (1 - dist / 160) * 0.45 * pulse;
        for (let s = 0; s < 40; s++) {
          const ratio = s / 40;
          const px = Math.floor(n.x + (n2.x - n.x) * ratio);
          const py = Math.floor(n.y + (n2.y - n.y) * ratio);
          setPixel(px, py, nr, ng, nb, lineAlpha);
        }
      }
    }
  }

  ffmpeg.stdin.write(frameBuffer);
}

// Render all frames
for (let f = 0; f < totalFrames; f++) {
  renderFrame(f);
}

ffmpeg.stdin.end();

ffmpeg.on('close', (code) => {
  if (code === 0) {
    try {
      fs.copyFileSync(outPath1, outPath2);
    } catch {}
    console.log('Successfully generated dynamic_market_motion.mp4!');
  } else {
    console.error('ffmpeg failed with code', code);
  }
});
