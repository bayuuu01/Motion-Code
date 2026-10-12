/**
 * Template & Presets Gallery for Xibay08 Motion Studio
 * Includes PRD acceptance tests and rich motion graphics templates
 */

export interface MotionTemplate {
  id: string;
  title: string;
  category: 'Dasar' | 'Tipografi' | 'Partikel' | 'Infografis' | 'Brand & Logo' | 'Sci-Fi';
  description: string;
  tags: string[];
  code: string;
}

export const TEMPLATES: MotionTemplate[] = [
  {
    id: 'moving-box',
    title: 'Kotak Bergerak (Acceptance Test)',
    category: 'Dasar',
    description: 'Tes kriteria penerimaan PRD: Kotak berpindah dari kiri ke kanan dengan interpolasi dan pantulan deterministik.',
    tags: ['basic', 'acceptance', 'bounce', 'keyframes'],
    code: `export const config = {
  width: 1920,
  height: 1080,
  fps: 30,
  duration: 6,
  backgroundColor: '#090a10',
};

export function setup(ctx, api) {
  // Setup deterministik
}

export function draw(ctx, api) {
  const { time, width, height, keyframes, ease, circle, roundedRect, text } = api;

  // Background grid halus
  api.grid(80, { stroke: 'rgba(255, 255, 255, 0.04)', lineWidth: 1 });

  // Posisi X dihitung dari keyframe: diam di awal, lalu meluncur ke kanan dengan ease-out bounce
  const x = keyframes([
    [0.5, 300],
    [2.8, width - 300, ease.outBounce],
    [3.5, width - 300],
    [5.2, 300, ease.inOutCubic],
  ]);

  const y = height / 2;
  const size = 180;

  // Bayangan neon lembut
  ctx.save();
  ctx.shadowColor = '#6366f1';
  ctx.shadowBlur = 40;

  // Kotak utama
  roundedRect(x - size / 2, y - size / 2, size, size, 24, {
    fill: '#6366f1',
    stroke: '#a5b4fc',
    lineWidth: 4,
  });
  ctx.restore();

  // Inti bercahaya
  circle(x, y, 24, {
    fill: '#ffffff',
  });

  // Label koordinat
  ctx.fillStyle = '#94a3b8';
  ctx.font = '600 24px "Fira Code", monospace';
  ctx.textAlign = 'center';
  ctx.fillText(\`POSISI X: \${Math.round(x)}px | DETIK: \${time.toFixed(2)}s\`, width / 2, height - 100);
}
`,
  },
  {
    id: 'kinetic-typography',
    title: 'Judul Teks / Kinetic Typography',
    category: 'Tipografi',
    description: 'Animasi judul sinematik dengan spring physics, stagger per-karakter, dan garis aksen berpendar.',
    tags: ['typography', 'spring', 'stagger', 'glow'],
    code: `export const config = {
  width: 1920,
  height: 1080,
  fps: 30,
  duration: 8,
  backgroundColor: '#030712',
};

export function draw(ctx, api) {
  const { time, width, height, spring, ease, keyframes, lerpColor } = api;

  api.grid(100, { stroke: 'rgba(99, 102, 241, 0.05)' });

  const titleText = "XIBAY08 MOTION";
  const subtitle = "DETERMINISTIC CODE GRAPHICS";
  const letters = titleText.split('');

  ctx.save();
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  // Total lebar teks untuk perataan tengah
  const letterSpacing = 96;
  const startX = (width - (letters.length - 1) * letterSpacing) / 2;
  const centerY = height / 2 - 40;

  // Render setiap huruf dengan stagger & spring physics
  letters.forEach((char, index) => {
    const delay = index * 0.08;
    const localTime = Math.max(0, time - delay);

    // Spring entrance: melenting naik dari bawah
    const springY = spring({
      stiffness: 140,
      damping: 12,
      mass: 1,
      start: 120,
      target: 0
    }, localTime);

    // Skala pop-in
    const scale = spring({
      stiffness: 180,
      damping: 14,
      start: 0,
      target: 1
    }, localTime);

    // Opacity fade in
    const opacity = api.clamp(localTime * 4, 0, 1);

    const x = startX + index * letterSpacing;
    const y = centerY + springY;

    ctx.save();
    ctx.translate(x, y);
    ctx.scale(scale, scale);
    ctx.globalAlpha = opacity;

    // Gradien dinamis dan glow
    ctx.shadowColor = '#818cf8';
    ctx.shadowBlur = 30;

    ctx.font = '800 92px "Space Grotesk", sans-serif';
    ctx.fillStyle = lerpColor('#38bdf8', '#c084fc', index / letters.length);
    ctx.fillText(char, 0, 0);

    ctx.restore();
  });

  // Garis aksen beranimasi trim path
  const lineProgress = keyframes([
    [1.0, 0],
    [2.4, 1, ease.outExpo]
  ]);

  const lineW = 700 * lineProgress;
  api.roundedRect((width - lineW) / 2, centerY + 80, lineW, 4, 2, {
    fill: '#6366f1',
    shadowColor: '#818cf8',
    shadowBlur: 15,
  });

  // Subtitle typewriter
  const subProgress = keyframes([
    [1.8, 0],
    [3.5, 1, ease.linear]
  ]);
  const visibleSub = api.typewriter(subtitle, subProgress);

  ctx.font = '600 24px "Fira Code", monospace';
  ctx.fillStyle = '#94a3b8';
  ctx.letterSpacing = '8px';
  ctx.fillText(visibleSub, width / 2, centerY + 130);

  ctx.restore();

  // Partikel kosmik lembut di latar
  api.particles({ count: 60, seed: 101, speedMin: 20, speedMax: 80 });
  api.vignette(0.7, 0.85);
}
`,
  },
  {
    id: 'cosmic-vortex',
    title: 'Partikel Kosmik / Cosmic Vortex',
    category: 'Partikel',
    description: 'Ratusan partikel orbital prosedural yang mengalir dengan Simplex Noise 3D dan pendar warna spektrum.',
    tags: ['particles', 'simplex-noise', 'vortex', 'glow'],
    code: `export const config = {
  width: 1920,
  height: 1080,
  fps: 30,
  duration: 10,
  backgroundColor: '#020205',
};

export function draw(ctx, api) {
  const { time, width, height, noise, circle, lerpColor } = api;

  const cx = width / 2;
  const cy = height / 2;
  const totalParticles = 260;

  // Inti galaksi
  const corePulse = 1 + Math.sin(time * 3) * 0.15;
  circle(cx, cy, 50 * corePulse, {
    fill: 'rgba(129, 140, 248, 0.25)',
    shadowColor: '#818cf8',
    shadowBlur: 60,
  });
  circle(cx, cy, 18, {
    fill: '#ffffff',
    shadowColor: '#ffffff',
    shadowBlur: 20,
  });

  // Cincin orbital berputar
  for (let ring = 1; ring <= 3; ring++) {
    const rot = time * (0.2 / ring);
    api.ring(cx, cy, ring * 160 - 2, ring * 160 + 2, rot, rot + Math.PI * 1.5, {
      stroke: 'rgba(99, 102, 241, 0.15)',
      lineWidth: 2,
    });
  }

  // Partikel medan vektor (noise field)
  for (let i = 0; i < totalParticles; i++) {
    // Seed deterministik berbasis indeks partikel
    const seed = i * 997.13;
    const baseRadius = 80 + (i / totalParticles) * 520;
    const baseSpeed = 0.4 + (i % 7) * 0.15;

    // Sudut orbital + distorsi Simplex Noise
    const angle = time * baseSpeed + (i * 0.4);
    const noiseVal = noise(Math.cos(angle) * 1.5, Math.sin(angle) * 1.5, time * 0.3 + i * 0.05);

    const r = baseRadius + noiseVal * 90;
    const px = cx + Math.cos(angle) * r;
    const py = cy + Math.sin(angle) * r;

    const size = 2 + Math.abs(noiseVal) * 5;
    const color = lerpColor('#06b6d4', '#ec4899', (i / totalParticles));

    circle(px, py, size, {
      fill: color,
      opacity: 0.75 + noiseVal * 0.25,
      shadowColor: color,
      shadowBlur: 14,
    });
  }

  api.vignette(0.75, 0.9);
  api.filmGrain(0.04);
}
`,
  },
  {
    id: 'data-viz-hud',
    title: 'Grafik Bar / Data Viz HUD',
    category: 'Infografis',
    description: 'Dashboard infografis analitik futuristik dengan grafik batang dinamis, metrik angka, dan indikator persentase.',
    tags: ['charts', 'hud', 'data-viz', 'stagger'],
    code: `export const config = {
  width: 1920,
  height: 1080,
  fps: 30,
  duration: 8,
  backgroundColor: '#05070e',
};

export function draw(ctx, api) {
  const { time, width, height, ease, keyframes, spring, roundedRect, circle, text } = api;

  // Grid latar sci-fi
  api.grid(60, { stroke: 'rgba(30, 41, 59, 0.5)' });

  // Header Dashboard
  ctx.fillStyle = '#38bdf8';
  ctx.font = '700 20px "Space Grotesk", sans-serif';
  ctx.fillText('• REAL-TIME MOTION METRICS // SYSTEM V1.0', 160, 140);

  ctx.fillStyle = '#ffffff';
  ctx.font = '800 48px "Space Grotesk", sans-serif';
  ctx.fillText('DISTRIBUSI DATA & PERFORMA RENDER', 160, 200);

  // Kumpulan data bar
  const data = [
    { label: 'CPU LOAD', val: 78, color: '#38bdf8' },
    { label: 'GPU CORE', val: 92, color: '#818cf8' },
    { label: 'RAM MEM', val: 64, color: '#a855f7' },
    { label: 'FRAME SYNC', val: 88, color: '#ec4899' },
    { label: 'ENCODER', val: 96, color: '#10b981' },
    { label: 'BUFFER', val: 72, color: '#f59e0b' },
  ];

  const chartX = 160;
  const chartY = 320;
  const chartW = 1200;
  const chartH = 460;
  const barWidth = 90;
  const gap = (chartW - (data.length * barWidth)) / (data.length - 1);

  // Garis baseline chart
  api.line(chartX, chartY + chartH, chartX + chartW, chartY + chartH, {
    stroke: 'rgba(148, 163, 184, 0.2)',
    lineWidth: 2,
  });

  data.forEach((item, i) => {
    const delay = 0.4 + i * 0.15;
    const localTime = Math.max(0, time - delay);

    // Animasi pertumbuhan bar via Spring
    const grow = spring({
      stiffness: 110,
      damping: 12,
      start: 0,
      target: item.val / 100,
    }, localTime);

    const barH = chartH * grow;
    const bx = chartX + i * (barWidth + gap);
    const by = chartY + chartH - barH;

    // Glowing bar
    ctx.save();
    ctx.shadowColor = item.color;
    ctx.shadowBlur = 20;
    roundedRect(bx, by, barWidth, barH, [12, 12, 0, 0], {
      fill: item.color,
      opacity: 0.85,
    });
    ctx.restore();

    // Persentase di atas bar
    const displayedVal = Math.round(item.val * api.clamp(grow, 0, 1));
    ctx.fillStyle = '#ffffff';
    ctx.font = '700 24px "Fira Code", monospace';
    ctx.textAlign = 'center';
    ctx.fillText(\`\${displayedVal}%\`, bx + barWidth / 2, by - 16);

    // Label di bawah bar
    ctx.fillStyle = '#94a3b8';
    ctx.font = '600 16px "Space Grotesk", sans-serif';
    ctx.fillText(item.label, bx + barWidth / 2, chartY + chartH + 36);
  });

  // Widget samping: Circular progress meter
  const ringX = width - 340;
  const ringY = 520;
  const ringRadius = 110;
  const progressMeter = keyframes([
    [0.5, 0],
    [2.5, 0.87, ease.outCubic],
  ]);

  api.ring(ringX, ringY, ringRadius - 16, ringRadius, 0, Math.PI * 2, {
    fill: 'rgba(255, 255, 255, 0.05)',
  });
  api.ring(ringX, ringY, ringRadius - 16, ringRadius, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * progressMeter, {
    fill: '#818cf8',
    shadowColor: '#818cf8',
    shadowBlur: 25,
  });

  ctx.fillStyle = '#ffffff';
  ctx.font = '800 36px "Space Grotesk", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(\`\${Math.round(progressMeter * 100)}%\`, ringX, ringY + 8);
  ctx.fillStyle = '#94a3b8';
  ctx.font = '600 15px "Fira Code", monospace';
  ctx.fillText('OUTPUT EFFICIENCY', ringX, ringY + 44);

  api.vignette(0.6, 0.9);
}
`,
  },
  {
    id: 'waveform-ocean',
    title: 'Gelombang Sinus / Waveform Ocean',
    category: 'Dasar',
    description: 'Lapisan gelombang harmonik neon interaktif dengan efek aberasi warna dan titik puncak frekuensi.',
    tags: ['waves', 'sinus', 'harmonic', 'gradient'],
    code: `export const config = {
  width: 1920,
  height: 1080,
  fps: 30,
  duration: 9,
  backgroundColor: '#040711',
};

export function draw(ctx, api) {
  const { time, width, height, circle, lerpColor } = api;

  const waveLayers = [
    { freq: 0.003, amp: 90, speed: 1.8, color: '#38bdf8', yOffset: 0 },
    { freq: 0.004, amp: 120, speed: 2.2, color: '#6366f1', yOffset: 40 },
    { freq: 0.005, amp: 80, speed: 2.8, color: '#a855f7', yOffset: 80 },
    { freq: 0.0035, amp: 140, speed: 1.4, color: '#ec4899', yOffset: 120 },
  ];

  const baseY = height / 2 + 50;

  waveLayers.forEach((layer, idx) => {
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(0, height);

    for (let x = 0; x <= width; x += 15) {
      const y = baseY + layer.yOffset + Math.sin(x * layer.freq + time * layer.speed) * layer.amp
                + Math.cos(x * layer.freq * 0.5 - time * 0.8) * 30;
      if (x === 0) ctx.lineTo(x, y);
      else ctx.lineTo(x, y);
    }

    ctx.lineTo(width, height);
    ctx.closePath();

    ctx.fillStyle = lerpColor(layer.color, '#040711', 0.6);
    ctx.globalAlpha = 0.45;
    ctx.fill();

    // Stroke garis atas bercahaya
    ctx.strokeStyle = layer.color;
    ctx.lineWidth = 3;
    ctx.shadowColor = layer.color;
    ctx.shadowBlur = 25;
    ctx.globalAlpha = 0.9;
    ctx.stroke();

    ctx.restore();
  });

  // Titik puncak frekuensi mengapung
  for (let i = 0; i < 18; i++) {
    const fx = (i / 17) * width;
    const fy = baseY + Math.sin(fx * 0.004 + time * 2.2) * 120 + 40;
    circle(fx, fy, 4, {
      fill: '#ffffff',
      shadowColor: '#38bdf8',
      shadowBlur: 16,
    });
  }

  // Teks judul minimalis
  ctx.fillStyle = '#f8fafc';
  ctx.font = '700 32px "Space Grotesk", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('HARMONIC WAVEFORM OSCILLATOR', width / 2, 200);

  api.vignette(0.65, 0.88);
}
`,
  },
  {
    id: 'logo-reveal',
    title: 'Logo Reveal / Monogram Geometris',
    category: 'Brand & Logo',
    description: 'Animasi pembuka logo dengan teknik trim path, rotasi geometri bertumpuk, dan ledakan pendar cahaya.',
    tags: ['logo', 'reveal', 'trimpath', 'geometry'],
    code: `export const config = {
  width: 1920,
  height: 1080,
  fps: 30,
  duration: 7,
  backgroundColor: '#030308',
};

export function draw(ctx, api) {
  const { time, width, height, ease, keyframes, spring, circle, polygon, ring, star } = api;

  const cx = width / 2;
  const cy = height / 2 - 30;

  // Fase 1: Trim Path Lingkaran Luar (0 - 2s)
  const trimProgress = keyframes([
    [0.2, 0],
    [2.2, 1, ease.inOutCubic]
  ]);

  ring(cx, cy, 196, 204, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * trimProgress, {
    fill: '#6366f1',
    shadowColor: '#818cf8',
    shadowBlur: 35,
  });

  // Fase 2: Poligon geometris berputar muncul (1.2 - 3.5s)
  const polyScale = spring({
    stiffness: 120,
    damping: 11,
    start: 0,
    target: 1,
  }, Math.max(0, time - 1.0));

  const rotation = time * 0.8;
  polygon(cx, cy, 140 * polyScale, 6, rotation, {
    stroke: '#38bdf8',
    lineWidth: 4,
    shadowColor: '#38bdf8',
    shadowBlur: 20,
  });

  polygon(cx, cy, 90 * polyScale, 3, -rotation * 1.5, {
    stroke: '#ec4899',
    lineWidth: 3,
    shadowColor: '#ec4899',
    shadowBlur: 15,
  });

  // Bintang inti bercahaya meledak di tengah
  const coreFlash = keyframes([
    [2.0, 0],
    [2.5, 1, ease.outExpo],
    [4.0, 0.6, ease.outQuad]
  ]);

  if (coreFlash > 0) {
    star(cx, cy, 18 * coreFlash, 45 * coreFlash, 8, time * 2, {
      fill: '#ffffff',
      shadowColor: '#ffffff',
      shadowBlur: 40,
    });
  }

  // Fade in Nama Brand
  const textAlpha = keyframes([
    [2.6, 0],
    [3.8, 1, ease.outCubic]
  ]);

  ctx.save();
  ctx.globalAlpha = textAlpha;
  ctx.textAlign = 'center';
  ctx.fillStyle = '#ffffff';
  ctx.font = '800 48px "Space Grotesk", sans-serif';
  ctx.letterSpacing = '12px';
  ctx.shadowColor = '#6366f1';
  ctx.shadowBlur = 20;
  ctx.fillText('XIBAY STUDIO', cx, cy + 280);

  ctx.fillStyle = '#94a3b8';
  ctx.font = '600 18px "Fira Code", monospace';
  ctx.letterSpacing = '6px';
  ctx.fillText('PROCEDURAL MOTION ART', cx, cy + 330);
  ctx.restore();

  api.vignette(0.7, 0.9);
}
`,
  },
  {
    id: 'cyberpunk-hud',
    title: 'Cyberpunk Glitch / Hologram HUD',
    category: 'Sci-Fi',
    description: 'Antarmuka fiksi ilmiah canggih dengan cincin HUD berputar, garis bidik targeting, dan efek digital glitch.',
    tags: ['hud', 'cyberpunk', 'glitch', 'scifi'],
    code: `export const config = {
  width: 1920,
  height: 1080,
  fps: 30,
  duration: 8,
  backgroundColor: '#020617',
};

export function draw(ctx, api) {
  const { time, width, height, random, circle, ring, line, roundedRect } = api;

  const cx = width / 2;
  const cy = height / 2;

  // Efek Glitch sesekali
  const isGlitch = (time % 1.7) < 0.12;
  const glitchOffset = isGlitch ? (random() - 0.5) * 24 : 0;

  ctx.save();
  ctx.translate(glitchOffset, 0);

  // Background radar circles
  [120, 240, 360, 480].forEach((r, idx) => {
    circle(cx, cy, r, {
      stroke: 'rgba(56, 189, 248, 0.12)',
      lineWidth: 1,
      lineDash: idx % 2 === 0 ? [8, 8] : undefined,
    });
  });

  // Crosshairs
  line(cx - 520, cy, cx + 520, cy, { stroke: 'rgba(56, 189, 248, 0.25)', lineWidth: 1 });
  line(cx, cy - 380, cx, cy + 380, { stroke: 'rgba(56, 189, 248, 0.25)', lineWidth: 1 });

  // Rotating HUD arc segments
  ring(cx, cy, 280, 292, time * 0.6, time * 0.6 + Math.PI * 0.7, {
    fill: '#06b6d4',
    shadowColor: '#06b6d4',
    shadowBlur: 18,
  });

  ring(cx, cy, 280, 292, time * 0.6 + Math.PI, time * 0.6 + Math.PI * 1.5, {
    fill: '#06b6d4',
    shadowColor: '#06b6d4',
    shadowBlur: 18,
  });

  ring(cx, cy, 210, 216, -time * 1.2, -time * 1.2 + Math.PI * 1.2, {
    fill: '#f43f5e',
    shadowColor: '#f43f5e',
    shadowBlur: 14,
  });

  // Target lock box
  const targetPulse = 1 + Math.sin(time * 6) * 0.05;
  const tSize = 70 * targetPulse;
  roundedRect(cx - tSize, cy - tSize, tSize * 2, tSize * 2, 8, {
    stroke: '#38bdf8',
    lineWidth: 2,
    shadowColor: '#38bdf8',
    shadowBlur: 15,
  });

  // Data readout
  ctx.fillStyle = '#38bdf8';
  ctx.font = '700 16px "Fira Code", monospace';
  ctx.fillText(\`TARGET: LOCK // \${(api.progress * 100).toFixed(1)}%\`, cx + 90, cy - 90);
  ctx.fillStyle = '#94a3b8';
  ctx.fillText(\`COORD: [X: \${cx.toFixed(0)}, Y: \${cy.toFixed(0)}]\`, cx + 90, cy - 65);
  ctx.fillText(\`TIME SEC: \${time.toFixed(2)}s\`, cx + 90, cy - 40);

  ctx.restore();

  api.vignette(0.7, 0.85);
  api.filmGrain(0.06);
}
`,
  },
];
