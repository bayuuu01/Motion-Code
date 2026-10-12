/**
 * Core Deterministic Motion Engine Runtime for Xibay08 Motion Studio
 * Handles code compilation, isolated deterministic execution, frame evaluation,
 * and comprehensive API injection for setup() and draw().
 */

import { easings, cubicBezier, analyticSpring, SpringOptions } from './easings.ts';
import {
  clamp,
  lerp,
  inverseLerp,
  map,
  remap,
  smoothstep,
  loop,
  pingpong,
  stagger,
  keyframes,
  KeyframeTrack,
  lerpColor,
  hexToRgb,
  rgbToHex,
  rgba,
} from './math.ts';
import { createMulberry32, ProceduralNoise } from './prng.ts';
import {
  drawRect,
  drawRoundedRect,
  drawCircle,
  drawEllipse,
  drawLine,
  drawPolygon,
  drawStar,
  drawRing,
  drawTrimmedPath,
  drawSvgPath,
  drawDeterministicParticles,
  applyVignette,
  applyFilmGrain,
  DrawShapeOptions,
  Point2D,
  ParticleEmitterConfig,
} from './canvasHelpers.ts';

export interface AnimationConfig {
  width: number;
  height: number;
  fps: number;
  duration: number;
  backgroundColor?: string;
}

export interface RuntimeLogItem {
  id: string;
  type: 'log' | 'warn' | 'error' | 'info';
  message: string;
  timestamp: number;
  frame?: number;
}

export interface MotionApi {
  // State
  frame: number;
  time: number;
  progress: number;
  width: number;
  height: number;
  fps: number;
  duration: number;
  totalFrames: number;
  scale: number;
  aspectRatio: number;

  // Math & Interpolation
  clamp: (v: number, min: number, max: number) => number;
  lerp: (a: number, b: number, t: number) => number;
  inverseLerp: (a: number, b: number, v: number) => number;
  map: (v: number, inMin: number, inMax: number, outMin: number, outMax: number) => number;
  remap: (v: number, inMin: number, inMax: number, outMin: number, outMax: number) => number;
  smoothstep: (edge0: number, edge1: number, x: number) => number;
  stagger: (index: number, delay: number) => number;
  loop: (t: number, period: number) => number;
  pingpong: (t: number, period: number) => number;
  keyframes: (track: KeyframeTrack, ease?: (t: number) => number) => number;
  scene: (start: number, end: number, fn: (progress: number, localTime: number) => void) => void;

  // Easings & Spring Physics
  ease: typeof easings;
  easings: typeof easings;
  cubicBezier: typeof cubicBezier;
  spring: (opts?: SpringOptions, t?: number) => number;

  // Procedural Noise & Seeded Randomness
  noise: (x: number, y: number, z?: number) => number;
  fractalNoise: (x: number, y: number, octaves?: number, persistence?: number, lacunarity?: number) => number;
  random: (seed?: number) => number;
  randomRange: (min: number, max: number, seed?: number) => number;
  randomInt: (min: number, max: number, seed?: number) => number;
  pick: <T>(arr: T[], seed?: number) => T;
  shuffle: <T>(arr: T[], seed?: number) => T[];

  // 2D Canvas Helpers
  rect: (x: number, y: number, w: number, h: number, opts?: DrawShapeOptions) => void;
  roundedRect: (x: number, y: number, w: number, h: number, radius: number | number[], opts?: DrawShapeOptions) => void;
  circle: (x: number, y: number, radius: number, opts?: DrawShapeOptions) => void;
  ellipse: (x: number, y: number, rx: number, ry: number, rotation?: number, opts?: DrawShapeOptions) => void;
  line: (x1: number, y1: number, x2: number, y2: number, opts?: DrawShapeOptions) => void;
  polygon: (cx: number, cy: number, radius: number, sides: number, rotation?: number, opts?: DrawShapeOptions) => void;
  star: (cx: number, cy: number, innerR: number, outerR: number, points?: number, rotation?: number, opts?: DrawShapeOptions) => void;
  ring: (cx: number, cy: number, innerR: number, outerR: number, startA?: number, endA?: number, opts?: DrawShapeOptions) => void;
  grid: (spacing: number, opts?: DrawShapeOptions) => void;

  // Paths & AE-style Trim Path
  trimPath: (points: Point2D[], startT: number, endT: number, opts?: DrawShapeOptions) => void;
  svgPath: (d: string, opts?: DrawShapeOptions) => void;

  // Typography & Text
  typewriter: (text: string, progress: number) => string;

  // Color helpers
  lerpColor: (c1: string, c2: string, t: number) => string;
  hexToRgb: (hex: string) => { r: number; g: number; b: number; a?: number };
  rgbToHex: (r: number, g: number, b: number) => string;
  rgba: (r: number, g: number, b: number, a?: number) => string;

  // Particles & FX
  particles: (config?: ParticleEmitterConfig) => void;
  vignette: (intensity?: number, radius?: number) => void;
  filmGrain: (intensity?: number, seed?: number) => void;

  // Assets
  getImage: (name: string) => HTMLImageElement | null;
}

export interface CompiledMotionScript {
  config: AnimationConfig;
  setup?: (ctx: CanvasRenderingContext2D, api: MotionApi) => void;
  draw?: (ctx: CanvasRenderingContext2D, api: MotionApi) => void;
}

export class MotionRuntime {
  private noiseGenerator = new ProceduralNoise(1337);
  private assetImages = new Map<string, HTMLImageElement>();
  private logs: RuntimeLogItem[] = [];
  private onLogCallback?: (log: RuntimeLogItem) => void;

  constructor() {}

  public setLogCallback(cb: (log: RuntimeLogItem) => void) {
    this.onLogCallback = cb;
  }

  public registerAssetImage(name: string, img: HTMLImageElement) {
    this.assetImages.set(name, img);
  }

  public clearAssets() {
    this.assetImages.clear();
  }

  public getLogs(): RuntimeLogItem[] {
    return [...this.logs];
  }

  public clearLogs() {
    this.logs = [];
  }

  private addLog(type: 'log' | 'warn' | 'error' | 'info', message: string, frame?: number) {
    const item: RuntimeLogItem = {
      id: 'log_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
      type,
      message,
      timestamp: Date.now(),
      frame,
    };
    this.logs.push(item);
    if (this.logs.length > 500) this.logs.shift();
    this.onLogCallback?.(item);
  }

  /**
   * Compiles the user's JavaScript code string into executable module
   */
  public compile(codeString: string): { script?: CompiledMotionScript; error?: string; line?: number } {
    try {
      // Transform ES module export keywords to local exports object
      let sanitizedCode = codeString;
      sanitizedCode = sanitizedCode.replace(/export\s+const\s+config\s*=/g, 'exports.config =');
      sanitizedCode = sanitizedCode.replace(/export\s+function\s+setup/g, 'exports.setup = function setup');
      sanitizedCode = sanitizedCode.replace(/export\s+function\s+draw/g, 'exports.draw = function draw');
      sanitizedCode = sanitizedCode.replace(/export\s+default/g, 'exports.default =');

      // Wrap in sandbox function
      const wrappedFn = new Function(
        'exports',
        'require',
        `"use strict";\n${sanitizedCode}\nreturn exports;`
      );

      const exportsObj: { config?: AnimationConfig; setup?: any; draw?: any } = {};
      wrappedFn(exportsObj, () => {
        throw new Error('require() tidak diizinkan di sandbox browser');
      });

      const defaultConfig: AnimationConfig = {
        width: 1920,
        height: 1080,
        fps: 30,
        duration: 10,
        backgroundColor: '#0a0a0c',
      };

      const finalConfig: AnimationConfig = {
        ...defaultConfig,
        ...(exportsObj.config || {}),
      };

      return {
        script: {
          config: finalConfig,
          setup: typeof exportsObj.setup === 'function' ? exportsObj.setup : undefined,
          draw: typeof exportsObj.draw === 'function' ? exportsObj.draw : undefined,
        },
      };
    } catch (err: any) {
      let line: number | undefined;
      const stack = err?.stack || '';
      const lineMatch = stack.match(/<anonymous>:(\d+):(\d+)/) || stack.match(/eval.*?:(\d+):(\d+)/);
      if (lineMatch && lineMatch[1]) {
        // Adjust for line wrapper
        line = Math.max(1, parseInt(lineMatch[1], 10) - 2);
      }
      const message = err?.message || String(err);
      this.addLog('error', `Error Kompilasi: ${message}`);
      return { error: message, line };
    }
  }

  /**
   * Builds the deterministic MotionApi object for a specific frame
   */
  public createApi(
    frame: number,
    config: AnimationConfig,
    ctx: CanvasRenderingContext2D
  ): MotionApi {
    const fps = Math.max(1, config.fps);
    const duration = Math.max(0.1, config.duration);
    const totalFrames = Math.max(1, Math.round(fps * duration));
    const safeFrame = clamp(frame, 0, totalFrames - 1);
    const time = safeFrame / fps;
    const progress = totalFrames > 1 ? safeFrame / (totalFrames - 1) : 0;
    const width = config.width;
    const height = config.height;
    const scale = Math.min(width / 1920, height / 1080);
    const aspectRatio = width / height;

    // Seed per frame to guarantee complete reproducibility
    const frameSeed = (424242 + safeFrame * 179424673) >>> 0;
    const framePrng = createMulberry32(frameSeed);

    const api: MotionApi = {
      frame: safeFrame,
      time,
      progress,
      width,
      height,
      fps,
      duration,
      totalFrames,
      scale,
      aspectRatio,

      // Math
      clamp,
      lerp,
      inverseLerp,
      map,
      remap,
      smoothstep,
      stagger,
      loop,
      pingpong,
      keyframes: (track, ease) => keyframes(time, track, ease || easings.linear),
      scene: (start, end, fn) => {
        if (time >= start && time <= end) {
          const sceneDuration = end - start;
          const sceneProg = sceneDuration > 0 ? (time - start) / sceneDuration : 0;
          fn(sceneProg, time - start);
        }
      },

      // Easings & Spring
      ease: easings,
      easings: easings,
      cubicBezier,
      spring: (opts, timeOverride) => analyticSpring(opts || {}, timeOverride !== undefined ? timeOverride : time),

      // Procedural Noise
      noise: (x, y, z) => {
        if (z !== undefined) return this.noiseGenerator.noise3D(x, y, z);
        return this.noiseGenerator.noise2D(x, y);
      },
      fractalNoise: (x, y, octaves, persistence, lacunarity) => {
        return this.noiseGenerator.fractalNoise2D(x, y, octaves, persistence, lacunarity);
      },

      // Randomness
      random: (seed) => {
        if (seed !== undefined) return createMulberry32(seed)();
        return framePrng();
      },
      randomRange: (min, max, seed) => {
        const r = seed !== undefined ? createMulberry32(seed)() : framePrng();
        return min + r * (max - min);
      },
      randomInt: (min, max, seed) => {
        const r = seed !== undefined ? createMulberry32(seed)() : framePrng();
        return Math.floor(min + r * (max - min + 1));
      },
      pick: (arr, seed) => {
        if (!arr || arr.length === 0) return undefined as any;
        const r = seed !== undefined ? createMulberry32(seed)() : framePrng();
        return arr[Math.floor(r * arr.length)];
      },
      shuffle: (arr, seed) => {
        const copy = [...arr];
        const prng = seed !== undefined ? createMulberry32(seed) : framePrng;
        for (let i = copy.length - 1; i > 0; i--) {
          const j = Math.floor(prng() * (i + 1));
          [copy[i], copy[j]] = [copy[j], copy[i]];
        }
        return copy;
      },

      // 2D Canvas Helpers
      rect: (x, y, w, h, opts) => drawRect(ctx, x, y, w, h, opts),
      roundedRect: (x, y, w, h, r, opts) => drawRoundedRect(ctx, x, y, w, h, r, opts),
      circle: (x, y, r, opts) => drawCircle(ctx, x, y, r, opts),
      ellipse: (x, y, rx, ry, rot, opts) => drawEllipse(ctx, x, y, rx, ry, rot, opts),
      line: (x1, y1, x2, y2, opts) => drawLine(ctx, x1, y1, x2, y2, opts),
      polygon: (cx, cy, r, sides, rot, opts) => drawPolygon(ctx, cx, cy, r, sides, rot, opts),
      star: (cx, cy, inR, outR, pts, rot, opts) => drawStar(ctx, cx, cy, inR, outR, pts, rot, opts),
      ring: (cx, cy, inR, outR, sA, eA, opts) => drawRing(ctx, cx, cy, inR, outR, sA, eA, opts),
      grid: (spacing, opts) => {
        const step = Math.max(10, spacing);
        ctx.save();
        ctx.strokeStyle = (opts?.stroke as string) || 'rgba(255, 255, 255, 0.1)';
        ctx.lineWidth = opts?.lineWidth || 1;
        for (let gx = 0; gx <= width; gx += step) {
          ctx.beginPath();
          ctx.moveTo(gx, 0);
          ctx.lineTo(gx, height);
          ctx.stroke();
        }
        for (let gy = 0; gy <= height; gy += step) {
          ctx.beginPath();
          ctx.moveTo(0, gy);
          ctx.lineTo(width, gy);
          ctx.stroke();
        }
        ctx.restore();
      },

      // Paths
      trimPath: (points, sT, eT, opts) => drawTrimmedPath(ctx, points, sT, eT, opts),
      svgPath: (d, opts) => drawSvgPath(ctx, d, opts),

      // Text
      typewriter: (text, prog) => {
        const count = Math.round(clamp(prog, 0, 1) * text.length);
        return text.slice(0, count);
      },

      // Colors
      lerpColor,
      hexToRgb,
      rgbToHex,
      rgba,

      // Particles & Effects
      particles: (cfg) => drawDeterministicParticles(ctx, time, cfg),
      vignette: (intensity, radius) => applyVignette(ctx, width, height, intensity, radius),
      filmGrain: (intensity, seed) => applyFilmGrain(ctx, width, height, intensity, seed ?? frameSeed),

      // Assets
      getImage: (name: string) => this.assetImages.get(name) || null,
    };

    return api;
  }

  /**
   * Deterministically renders a frame onto the target canvas context.
   */
  public renderFrame(
    script: CompiledMotionScript,
    frame: number,
    canvas: HTMLCanvasElement
  ): { success: boolean; error?: string; executionTimeMs: number } {
    const startTime = performance.now();
    const ctx = canvas.getContext('2d');
    if (!ctx) return { success: false, error: 'Context 2D tidak tersedia', executionTimeMs: 0 };

    const config = script.config;
    // Set internal canvas resolution exactly matching config
    if (canvas.width !== config.width) canvas.width = config.width;
    if (canvas.height !== config.height) canvas.height = config.height;

    // Clear and fill default background
    ctx.save();
    ctx.clearRect(0, 0, config.width, config.height);
    if (config.backgroundColor !== 'transparent') {
      ctx.fillStyle = config.backgroundColor || '#0a0a0c';
      ctx.fillRect(0, 0, config.width, config.height);
    }
    ctx.restore();

    // If draw function exists, execute it with deterministic overrides
    if (script.draw) {
      const api = this.createApi(frame, config, ctx);

      // Deterministic environment overrides
      const originalRandom = Math.random;
      const originalDateNow = Date.now;
      const originalPerfNow = performance.now;
      const originalLog = console.log;
      const originalWarn = console.warn;
      const originalErr = console.error;

      // Seeded random for Math.random() calls inside user code
      const framePrng = createMulberry32(314159 + frame * 99991);
      Math.random = () => framePrng();
      Date.now = () => Math.round(api.time * 1000);
      performance.now = () => api.time * 1000;

      // Capture logs
      console.log = (...args) => {
        this.addLog('log', args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' '), frame);
      };
      console.warn = (...args) => {
        this.addLog('warn', args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' '), frame);
      };
      console.error = (...args) => {
        this.addLog('error', args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' '), frame);
      };

      try {
        ctx.save();
        script.draw(ctx, api);
        ctx.restore();
      } catch (err: any) {
        ctx.restore();
        const errMessage = err?.message || String(err);
        this.addLog('error', `Runtime Error [Frame ${frame}]: ${errMessage}`, frame);
        return {
          success: false,
          error: errMessage,
          executionTimeMs: performance.now() - startTime,
        };
      } finally {
        // Restore standard globals
        Math.random = originalRandom;
        Date.now = originalDateNow;
        performance.now = originalPerfNow;
        console.log = originalLog;
        console.warn = originalWarn;
        console.error = originalErr;
      }
    }

    const executionTimeMs = performance.now() - startTime;
    return { success: true, executionTimeMs };
  }
}
