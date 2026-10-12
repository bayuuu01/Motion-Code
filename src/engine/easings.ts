/**
 * Comprehensive Easing & Analytic Physics Suite for Xibay08 Motion Studio
 * Fully deterministic: all functions compute state purely from normalized time t or elapsed seconds.
 */

export type EasingFn = (t: number) => number;

export const easings = {
  linear: (t: number) => t,

  // Sine
  inSine: (t: number) => 1 - Math.cos((t * Math.PI) / 2),
  outSine: (t: number) => Math.sin((t * Math.PI) / 2),
  inOutSine: (t: number) => -(Math.cos(Math.PI * t) - 1) / 2,

  // Quad
  inQuad: (t: number) => t * t,
  outQuad: (t: number) => 1 - (1 - t) * (1 - t),
  inOutQuad: (t: number) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2),

  // Cubic
  inCubic: (t: number) => t * t * t,
  outCubic: (t: number) => 1 - Math.pow(1 - t, 3),
  inOutCubic: (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2),

  // Quart
  inQuart: (t: number) => t * t * t * t,
  outQuart: (t: number) => 1 - Math.pow(1 - t, 4),
  inOutQuart: (t: number) => (t < 0.5 ? 8 * t * t * t * t : 1 - Math.pow(-2 * t + 2, 4) / 2),

  // Quint
  inQuint: (t: number) => t * t * t * t * t,
  outQuint: (t: number) => 1 - Math.pow(1 - t, 5),
  inOutQuint: (t: number) => (t < 0.5 ? 16 * t * t * t * t * t : 1 - Math.pow(-2 * t + 2, 5) / 2),

  // Expo
  inExpo: (t: number) => (t === 0 ? 0 : Math.pow(2, 10 * t - 10)),
  outExpo: (t: number) => (t === 1 ? 1 : 1 - Math.pow(2, -10 * t)),
  inOutExpo: (t: number) => {
    if (t === 0) return 0;
    if (t === 1) return 1;
    return t < 0.5
      ? Math.pow(2, 20 * t - 10) / 2
      : (2 - Math.pow(2, -20 * t + 10)) / 2;
  },

  // Circ
  inCirc: (t: number) => 1 - Math.sqrt(1 - Math.pow(t, 2)),
  outCirc: (t: number) => Math.sqrt(1 - Math.pow(t - 1, 2)),
  inOutCirc: (t: number) =>
    t < 0.5
      ? (1 - Math.sqrt(1 - Math.pow(2 * t, 2))) / 2
      : (Math.sqrt(1 - Math.pow(-2 * t + 2, 2)) + 1) / 2,

  // Back
  inBack: (t: number) => {
    const c1 = 1.70158;
    const c3 = c1 + 1;
    return c3 * t * t * t - c1 * t * t;
  },
  outBack: (t: number) => {
    const c1 = 1.70158;
    const c3 = c1 + 1;
    return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
  },
  inOutBack: (t: number) => {
    const c1 = 1.70158;
    const c2 = c1 * 1.525;
    return t < 0.5
      ? (Math.pow(2 * t, 2) * ((c2 + 1) * 2 * t - c2)) / 2
      : (Math.pow(2 * t - 2, 2) * ((c2 + 1) * (t * 2 - 2) + c2) + 2) / 2;
  },

  // Elastic
  inElastic: (t: number) => {
    const c4 = (2 * Math.PI) / 3;
    if (t === 0) return 0;
    if (t === 1) return 1;
    return -Math.pow(2, 10 * t - 10) * Math.sin((t * 10 - 10.75) * c4);
  },
  outElastic: (t: number) => {
    const c4 = (2 * Math.PI) / 3;
    if (t === 0) return 0;
    if (t === 1) return 1;
    return Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * c4) + 1;
  },
  inOutElastic: (t: number) => {
    const c5 = (2 * Math.PI) / 4.5;
    if (t === 0) return 0;
    if (t === 1) return 1;
    return t < 0.5
      ? -(Math.pow(2, 20 * t - 10) * Math.sin((20 * t - 11.125) * c5)) / 2
      : (Math.pow(2, -20 * t + 10) * Math.sin((20 * t - 11.125) * c5)) / 2 + 1;
  },

  // Bounce
  outBounce: (t: number): number => {
    const n1 = 7.5625;
    const d1 = 2.75;
    if (t < 1 / d1) {
      return n1 * t * t;
    } else if (t < 2 / d1) {
      return n1 * (t -= 1.5 / d1) * t + 0.75;
    } else if (t < 2.5 / d1) {
      return n1 * (t -= 2.25 / d1) * t + 0.9375;
    } else {
      return n1 * (t -= 2.625 / d1) * t + 0.984375;
    }
  },
  inBounce: (t: number): number => {
    return 1 - easings.outBounce(1 - t);
  },
  inOutBounce: (t: number): number => {
    return t < 0.5
      ? (1 - easings.outBounce(1 - 2 * t)) / 2
      : (1 + easings.outBounce(2 * t - 1)) / 2;
  },
};

/**
 * Custom Cubic Bezier solver using binary subdivision + Newton-Raphson
 */
export function cubicBezier(x1: number, y1: number, x2: number, y2: number): (t: number) => number {
  return function (x: number): number {
    if (x <= 0) return 0;
    if (x >= 1) return 1;

    let t = x;
    // Newton-Raphson iteration
    for (let i = 0; i < 8; i++) {
      const currentX =
        3 * (1 - t) * (1 - t) * t * x1 +
        3 * (1 - t) * t * t * x2 +
        t * t * t;
      const dx =
        3 * (1 - t) * (1 - t) * x1 +
        6 * (1 - t) * t * (x2 - x1) +
        3 * t * t * (1 - x2);
      if (Math.abs(currentX - x) < 1e-5 || Math.abs(dx) < 1e-5) break;
      t -= (currentX - x) / dx;
    }

    t = Math.max(0, Math.min(1, t));
    return (
      3 * (1 - t) * (1 - t) * t * y1 +
      3 * (1 - t) * t * t * y2 +
      t * t * t
    );
  };
}

export interface SpringOptions {
  stiffness?: number; // k, e.g. 100
  damping?: number;   // c, e.g. 10
  mass?: number;      // m, e.g. 1
  initialVelocity?: number; // v0, e.g. 0
  target?: number;    // default 1
  start?: number;     // default 0
}

/**
 * Analytic Closed-Form Spring Equation:
 * Computes position at exact elapsed time t (seconds) deterministically.
 * No incremental iterative simulation loop needed; works forwards, backwards, and scrubs perfectly.
 */
export function analyticSpring(opts: SpringOptions, t: number): number {
  const {
    stiffness = 100,
    damping = 10,
    mass = 1,
    initialVelocity = 0,
    target = 1,
    start = 0,
  } = opts;

  if (t <= 0) return start;

  const m = Math.max(0.001, mass);
  const k = Math.max(0.001, stiffness);
  const c = Math.max(0, damping);

  const x0 = start - target; // initial displacement from equilibrium
  const v0 = initialVelocity;

  const omega0 = Math.sqrt(k / m); // undamped natural frequency
  const zeta = c / (2 * Math.sqrt(m * k)); // damping ratio

  let displacement = 0;

  if (zeta < 1) {
    // Underdamped (oscillates and settles)
    const omegaD = omega0 * Math.sqrt(1 - zeta * zeta);
    const decay = Math.exp(-zeta * omega0 * t);
    const A = x0;
    const B = (v0 + zeta * omega0 * x0) / omegaD;
    displacement = decay * (A * Math.cos(omegaD * t) + B * Math.sin(omegaD * t));
  } else if (Math.abs(zeta - 1) < 1e-4) {
    // Critically damped
    const decay = Math.exp(-omega0 * t);
    displacement = decay * (x0 + (v0 + omega0 * x0) * t);
  } else {
    // Overdamped
    const s = omega0 * Math.sqrt(zeta * zeta - 1);
    const r1 = -zeta * omega0 + s;
    const r2 = -zeta * omega0 - s;
    const c1 = (v0 - r2 * x0) / (2 * s);
    const c2 = x0 - c1;
    displacement = c1 * Math.exp(r1 * t) + c2 * Math.exp(r2 * t);
  }

  return target + displacement;
}
