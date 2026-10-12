/**
 * High-performance 2D Canvas Helpers & Motion Effects
 * Supports procedural shapes, After Effects-style Trim Path, particle systems, and visual filters
 */

import { clamp, lerp } from './math.ts';
import { createMulberry32 } from './prng.ts';

export interface DrawShapeOptions {
  fill?: string | CanvasGradient | CanvasPattern | false;
  stroke?: string | CanvasGradient | CanvasPattern | false;
  lineWidth?: number;
  lineCap?: CanvasLineCap;
  lineJoin?: CanvasLineJoin;
  lineDash?: number[];
  opacity?: number;
  shadowColor?: string;
  shadowBlur?: number;
  shadowOffsetX?: number;
  shadowOffsetY?: number;
  blendMode?: GlobalCompositeOperation;
}

export function applyShapeStyles(ctx: CanvasRenderingContext2D, opts?: DrawShapeOptions) {
  if (!opts) return;
  if (opts.opacity !== undefined) ctx.globalAlpha = clamp(opts.opacity, 0, 1);
  if (opts.blendMode) ctx.globalCompositeOperation = opts.blendMode;
  if (opts.lineWidth !== undefined) ctx.lineWidth = opts.lineWidth;
  if (opts.lineCap) ctx.lineCap = opts.lineCap;
  if (opts.lineJoin) ctx.lineJoin = opts.lineJoin;
  if (opts.lineDash) ctx.setLineDash(opts.lineDash);
  if (opts.shadowColor) {
    ctx.shadowColor = opts.shadowColor;
    ctx.shadowBlur = opts.shadowBlur ?? 0;
    ctx.shadowOffsetX = opts.shadowOffsetX ?? 0;
    ctx.shadowOffsetY = opts.shadowOffsetY ?? 0;
  }
}

export function finishShape(ctx: CanvasRenderingContext2D, opts?: DrawShapeOptions) {
  const shouldFill = opts?.fill !== false && opts?.fill !== undefined;
  const shouldStroke = opts?.stroke !== false && opts?.stroke !== undefined;

  if (shouldFill) {
    ctx.fillStyle = opts.fill as string | CanvasGradient | CanvasPattern;
    ctx.fill();
  }
  if (shouldStroke) {
    ctx.strokeStyle = opts.stroke as string | CanvasGradient | CanvasPattern;
    ctx.stroke();
  }
}

// 1. Shapes
export function drawRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  opts?: DrawShapeOptions
) {
  ctx.save();
  applyShapeStyles(ctx, opts);
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  finishShape(ctx, opts);
  ctx.restore();
}

export function drawRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  radius: number | number[],
  opts?: DrawShapeOptions
) {
  ctx.save();
  applyShapeStyles(ctx, opts);
  ctx.beginPath();
  if (typeof ctx.roundRect === 'function') {
    ctx.roundRect(x, y, w, h, radius);
  } else {
    const r = typeof radius === 'number' ? radius : radius[0] || 0;
    ctx.rect(x, y, w, h);
  }
  finishShape(ctx, opts);
  ctx.restore();
}

export function drawCircle(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  radius: number,
  opts?: DrawShapeOptions
) {
  ctx.save();
  applyShapeStyles(ctx, opts);
  ctx.beginPath();
  ctx.arc(x, y, Math.max(0, radius), 0, Math.PI * 2);
  finishShape(ctx, opts);
  ctx.restore();
}

export function drawEllipse(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  radiusX: number,
  radiusY: number,
  rotation = 0,
  opts?: DrawShapeOptions
) {
  ctx.save();
  applyShapeStyles(ctx, opts);
  ctx.beginPath();
  ctx.ellipse(x, y, Math.max(0, radiusX), Math.max(0, radiusY), rotation, 0, Math.PI * 2);
  finishShape(ctx, opts);
  ctx.restore();
}

export function drawLine(
  ctx: CanvasRenderingContext2D,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  opts?: DrawShapeOptions
) {
  ctx.save();
  applyShapeStyles(ctx, opts);
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  if (opts?.stroke !== false) {
    ctx.strokeStyle = (opts?.stroke as string) || '#ffffff';
    ctx.stroke();
  }
  ctx.restore();
}

export function drawPolygon(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  radius: number,
  sides: number,
  rotation = 0,
  opts?: DrawShapeOptions
) {
  if (sides < 3) return;
  ctx.save();
  applyShapeStyles(ctx, opts);
  ctx.beginPath();
  for (let i = 0; i < sides; i++) {
    const angle = rotation + (i * 2 * Math.PI) / sides;
    const x = cx + radius * Math.cos(angle);
    const y = cy + radius * Math.sin(angle);
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
  finishShape(ctx, opts);
  ctx.restore();
}

export function drawStar(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  innerRadius: number,
  outerRadius: number,
  points = 5,
  rotation = 0,
  opts?: DrawShapeOptions
) {
  ctx.save();
  applyShapeStyles(ctx, opts);
  ctx.beginPath();
  const step = Math.PI / points;
  for (let i = 0; i < 2 * points; i++) {
    const r = i % 2 === 0 ? outerRadius : innerRadius;
    const angle = rotation + i * step - Math.PI / 2;
    const x = cx + r * Math.cos(angle);
    const y = cy + r * Math.sin(angle);
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
  finishShape(ctx, opts);
  ctx.restore();
}

export function drawRing(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  innerRadius: number,
  outerRadius: number,
  startAngle = 0,
  endAngle = Math.PI * 2,
  opts?: DrawShapeOptions
) {
  ctx.save();
  applyShapeStyles(ctx, opts);
  ctx.beginPath();
  ctx.arc(cx, cy, outerRadius, startAngle, endAngle, false);
  ctx.arc(cx, cy, innerRadius, endAngle, startAngle, true);
  ctx.closePath();
  finishShape(ctx, opts);
  ctx.restore();
}

// 2. Trim Path (After Effects style stroke trim animation)
export interface Point2D {
  x: number;
  y: number;
}

export function drawTrimmedPath(
  ctx: CanvasRenderingContext2D,
  points: Point2D[],
  startProgress: number, // 0 to 1
  endProgress: number,   // 0 to 1
  opts?: DrawShapeOptions
) {
  if (points.length < 2) return;
  const startT = clamp(Math.min(startProgress, endProgress), 0, 1);
  const endT = clamp(Math.max(startProgress, endProgress), 0, 1);
  if (Math.abs(endT - startT) < 1e-4) return;

  // Compute total length
  let totalLength = 0;
  const segmentLengths: number[] = [];
  for (let i = 0; i < points.length - 1; i++) {
    const dx = points[i + 1].x - points[i].x;
    const dy = points[i + 1].y - points[i].y;
    const len = Math.sqrt(dx * dx + dy * dy);
    segmentLengths.push(len);
    totalLength += len;
  }
  if (totalLength === 0) return;

  const targetStartDist = startT * totalLength;
  const targetEndDist = endT * totalLength;

  ctx.save();
  applyShapeStyles(ctx, opts);
  ctx.beginPath();

  let currentDist = 0;
  let hasStarted = false;

  for (let i = 0; i < points.length - 1; i++) {
    const segLen = segmentLengths[i];
    const segStart = currentDist;
    const segEnd = currentDist + segLen;

    if (targetEndDist >= segStart && targetStartDist <= segEnd) {
      // Overlaps this segment
      const t0 = clamp((targetStartDist - segStart) / segLen, 0, 1);
      const t1 = clamp((targetEndDist - segStart) / segLen, 0, 1);

      const p0x = lerp(points[i].x, points[i + 1].x, t0);
      const p0y = lerp(points[i].y, points[i + 1].y, t0);
      const p1x = lerp(points[i].x, points[i + 1].x, t1);
      const p1y = lerp(points[i].y, points[i + 1].y, t1);

      if (!hasStarted) {
        ctx.moveTo(p0x, p0y);
        hasStarted = true;
      }
      ctx.lineTo(p1x, p1y);
    }
    currentDist += segLen;
  }

  if (opts?.stroke !== false) {
    ctx.strokeStyle = (opts?.stroke as string) || '#ffffff';
    ctx.stroke();
  }
  ctx.restore();
}

// 3. SVG Path Render
export function drawSvgPath(
  ctx: CanvasRenderingContext2D,
  d: string,
  opts?: DrawShapeOptions
) {
  try {
    const path = new Path2D(d);
    ctx.save();
    applyShapeStyles(ctx, opts);
    if (opts?.fill !== false && opts?.fill !== undefined) {
      ctx.fillStyle = opts.fill as string;
      ctx.fill(path);
    }
    if (opts?.stroke !== false && opts?.stroke !== undefined) {
      ctx.strokeStyle = opts.stroke as string;
      ctx.stroke(path);
    }
    ctx.restore();
  } catch {
    // invalid SVG path string
  }
}

// 4. Deterministic Particle System
export interface ParticleEmitterConfig {
  count?: number;
  seed?: number;
  cx?: number;
  cy?: number;
  speedMin?: number;
  speedMax?: number;
  angleSpread?: number;
  radiusMin?: number;
  radiusMax?: number;
  colors?: string[];
  lifeDuration?: number; // seconds
}

export function drawDeterministicParticles(
  ctx: CanvasRenderingContext2D,
  time: number,
  config: ParticleEmitterConfig = {}
) {
  const {
    count = 100,
    seed = 42,
    cx = ctx.canvas.width / 2,
    cy = ctx.canvas.height / 2,
    speedMin = 50,
    speedMax = 200,
    radiusMin = 2,
    radiusMax = 6,
    colors = ['#38bdf8', '#818cf8', '#c084fc', '#f472b6'],
    lifeDuration = 3,
  } = config;

  const prng = createMulberry32(seed);

  for (let i = 0; i < count; i++) {
    // Generate deterministic fixed parameters for each particle index
    const baseAngle = prng() * Math.PI * 2;
    const speed = speedMin + prng() * (speedMax - speedMin);
    const maxRadius = radiusMin + prng() * (radiusMax - radiusMin);
    const colorIndex = Math.floor(prng() * colors.length);
    const timeOffset = prng() * lifeDuration;
    const curlFreq = 1 + prng() * 4;

    // Time cycle for this particle
    const particleTime = (time + timeOffset) % lifeDuration;
    const lifeRatio = particleTime / lifeDuration; // 0 to 1

    // Motion position
    const distance = speed * particleTime;
    const curl = Math.sin(particleTime * curlFreq) * 20 * lifeRatio;
    const px = cx + Math.cos(baseAngle) * distance - Math.sin(baseAngle) * curl;
    const py = cy + Math.sin(baseAngle) * distance + Math.cos(baseAngle) * curl;

    // Fade in and out
    const alpha = Math.sin(lifeRatio * Math.PI);
    const currentRadius = maxRadius * (1 - lifeRatio * 0.5);

    drawCircle(ctx, px, py, currentRadius, {
      fill: colors[colorIndex],
      opacity: alpha,
      shadowColor: colors[colorIndex],
      shadowBlur: 10,
    });
  }
}

// 5. Visual Post-Processing Filters
export function applyVignette(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  intensity = 0.6,
  radius = 0.8
) {
  const cx = width / 2;
  const cy = height / 2;
  const maxR = Math.sqrt(cx * cx + cy * cy) * radius;

  const grad = ctx.createRadialGradient(cx, cy, maxR * 0.4, cx, cy, maxR);
  grad.addColorStop(0, 'rgba(0, 0, 0, 0)');
  grad.addColorStop(1, `rgba(0, 0, 0, ${clamp(intensity, 0, 1)})`);

  ctx.save();
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, width, height);
  ctx.restore();
}

export function applyFilmGrain(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  intensity = 0.08,
  seed = 99
) {
  // Deterministic grain dots overlay
  const prng = createMulberry32(seed);
  const sampleCount = Math.floor((width * height) / 400);

  ctx.save();
  ctx.fillStyle = `rgba(255, 255, 255, ${clamp(intensity, 0, 1)})`;
  for (let i = 0; i < sampleCount; i++) {
    const gx = prng() * width;
    const gy = prng() * height;
    const size = 1 + prng() * 1.5;
    ctx.fillRect(gx, gy, size, size);
  }
  ctx.restore();
}
