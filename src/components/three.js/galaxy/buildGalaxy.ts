import { BufferGeometry, Color, Float32BufferAttribute, LinearSRGBColorSpace } from "three";
import { GALAXY, GALAXY_PALETTE as PAL } from "./config";

/**
 * Builds the realistic galaxy from ONE arm model into four point-cloud layers, so
 * the dust and glow sit exactly on the arms:
 *
 *   • stars  — the dots: a creamy bulge, dim neutral inter-arm stars, bright
 *              knotty arms (warm near the core → baby-blue outward), a faint halo.
 *   • knots  — coral-pink star-forming regions on each arm's OUTER edge + young
 *              blue clusters on the arm ridge (drawn above the dust).
 *   • glow   — big soft sprites: the milky light of stars too small to see.
 *   • dust   — dark-peach brown puffs along each arm's INNER edge (broken lanes,
 *              feathers crossing the arms, patches), multiplied onto the light.
 *
 * A straight port of `docs/prototypes/galaxy-zoom-realistic.html` — same seeded
 * RNG in the same order, so the galaxy is identical. Positions are in LOCAL units
 * (disc radius `GALAXY.discRadius`); the scene scales them by `GALAXY_SCALE`.
 *
 * Colours are stored as RAW screen (sRGB) values — no colour-management conversion —
 * because the galaxy is drawn into its own display-space layer, exactly like the
 * prototype, then converted to linear once (see `Galaxy.tsx`).
 */

export type GalaxyLayers = {
  stars: BufferGeometry;
  knots: BufferGeometry;
  glow: BufferGeometry;
  dust: BufferGeometry;
};

const TAU = Math.PI * 2;

function mulberry32(a: number) {
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function smoothstep(a: number, b: number, x: number) {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
}

// Seeded value noise (knotty arms, broken dust lanes, patchy dust).
function hash2(ix: number, iy: number) {
  let h =
    (Math.imul(ix, 374761393) + Math.imul(iy, 668265263) + Math.imul(GALAXY.seed, 1442695041)) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  h = h ^ (h >>> 16);
  return (h >>> 0) / 4294967296;
}
function vnoise(x: number, y: number) {
  const ix = Math.floor(x);
  const iy = Math.floor(y);
  const fx = x - ix;
  const fy = y - iy;
  const ux = fx * fx * (3 - 2 * fx);
  const uy = fy * fy * (3 - 2 * fy);
  const a = hash2(ix, iy);
  const b = hash2(ix + 1, iy);
  const c = hash2(ix, iy + 1);
  const d = hash2(ix + 1, iy + 1);
  return a + (b - a) * ux + (c - a) * uy + (a - b - c + d) * ux * uy;
}
function fbm(x: number, y: number) {
  return 0.65 * vnoise(x, y) + 0.35 * vnoise(x * 2.1 + 5.3, y * 2.1 + 1.7);
}

/** One point-cloud layer: every layer shares the same attributes. */
function makeLayer(rnd: () => number) {
  const pos: number[] = [];
  const col: number[] = [];
  const scl: number[] = [];
  const bri: number[] = [];
  const sed: number[] = [];
  const rn: number[] = [];
  return {
    push(x: number, y: number, z: number, c: Color, s: number, b: number, rNorm: number) {
      pos.push(x, y, z);
      col.push(c.r, c.g, c.b);
      scl.push(s);
      bri.push(b);
      sed.push(rnd());
      rn.push(Math.min(1, Math.max(0, rNorm)));
    },
    geom() {
      const g = new BufferGeometry();
      g.setAttribute("position", new Float32BufferAttribute(pos, 3));
      g.setAttribute("aColor", new Float32BufferAttribute(col, 3));
      g.setAttribute("aScale", new Float32BufferAttribute(scl, 1));
      g.setAttribute("aBright", new Float32BufferAttribute(bri, 1));
      g.setAttribute("aSeed", new Float32BufferAttribute(sed, 1));
      g.setAttribute("aRadiusNorm", new Float32BufferAttribute(rn, 1));
      return g;
    },
  };
}

/**
 * @param count star-dot count (desktop / mobile)
 * @param aux   density factor for the soft glow + disc dust patches (1 desktop)
 */
export function buildGalaxyLayers(count: number, aux = 1): GalaxyLayers {
  const rnd = mulberry32(GALAXY.seed);
  const gauss = (sigma: number) => {
    const u = 1 - rnd();
    const v = rnd();
    return sigma * Math.sqrt(-2 * Math.log(u)) * Math.cos(TAU * v);
  };
  const unitDir = (): [number, number, number] => {
    const u = rnd() * 2 - 1;
    const th = rnd() * TAU;
    const s = Math.sqrt(1 - u * u);
    return [s * Math.cos(th), u, s * Math.sin(th)];
  };

  // Brand palette + derived tones, as raw screen values (see the note above).
  const raw = (hex: string) => new Color().setStyle(hex, LinearSRGBColorSpace);
  const C = {
    peach: raw(PAL.peach),
    lpeach: raw(PAL.lpeach),
    dpeach: raw(PAL.dpeach),
    babyBlue: raw(PAL.babyBlue),
    lbabyBlue: raw(PAL.lbabyBlue),
    nebulaBlue: raw(PAL.nebulaBlue),
    coral: raw(PAL.coral),
    coreWhite: raw(PAL.coreWhite),
  };
  const CREAM = C.lpeach.clone().lerp(new Color(1, 1, 1), 0.35); // creamy core
  const PINK = C.coral.clone().lerp(C.lpeach, 0.35); // coral-pink star-forming regions
  // Dust tints are TRANSMISSION colours (multiplied onto the light behind).
  const DUST = C.dpeach.clone().multiplyScalar(0.35).lerp(new Color(0.2, 0.15, 0.13), 0.5);
  const DUST_RED = C.coral.clone().multiplyScalar(0.4).lerp(new Color(0.2, 0.13, 0.12), 0.5);
  const NEUTRAL = new Color(0.62, 0.63, 0.66); // old, dim inter-arm stars
  const STEEL = new Color(0.55, 0.66, 0.85); // arm haze
  const _c = new Color();

  const G_ = GALAXY;
  const N = count;
  const RMAX = G_.discRadius;
  const H0 = G_.discScaleLength;
  const R0 = 1.1;
  const RNORM = 1 - Math.exp(-RMAX / H0);
  const B = 1 / Math.tan((G_.pitchDeg * Math.PI) / 180);
  const sampleRadius = () => -H0 * Math.log(1 - rnd() * RNORM);
  const hz = (r: number) => G_.discThickness * (0.6 + 0.4 * Math.exp(-r / (RMAX * 0.5)));
  const armAngle = (r: number, k: number) =>
    k * (TAU / G_.armCount) + B * Math.log(Math.max(r, R0) / R0) + G_.armPhase;
  // Knotty arms: noise along (and across) each arm → dense clumps + gaps.
  const clumpAccept = (r: number, k: number, across: number) => {
    const n = fbm(r * G_.clumpFreq + k * 13.7, across * 2.0 + k * 7.1);
    return 1 - G_.clumpiness + G_.clumpiness * Math.min(1.4, smoothstep(0.28, 0.72, n) * 1.4);
  };
  const base = () => 0.82 + rnd() * 0.32;
  const jitter = () => 0.6 + rnd() * 0.8;
  // Young arm stars: warm near the core → baby-blue outward.
  const armColor = (rr: number): Color => {
    const t = Math.min(1, rr / RMAX);
    const ts = Math.min(1, Math.max(0, t + (rnd() - 0.5) * 0.12));
    if (ts < G_.tWarm) return _c.copy(C.lpeach).lerp(C.peach, smoothstep(0, G_.tWarm, ts));
    if (ts < G_.tBlue)
      return _c.copy(C.peach).lerp(C.babyBlue, smoothstep(G_.tWarm, G_.tBlue, ts));
    _c.copy(C.babyBlue).lerp(C.lbabyBlue, (ts - G_.tBlue) / (1 - G_.tBlue));
    if (rnd() < 0.25) _c.lerp(C.nebulaBlue, 0.4);
    return _c;
  };

  const S = makeLayer(rnd);
  const K = makeLayer(rnd);
  const G = makeLayer(rnd);
  const D = makeLayer(rnd);
  let c: Color;
  let b: number;
  let s: number;

  // ── STARS ──
  // 1 — bulge: old, creamy, smooth, dense toward the centre
  const nBulge = Math.round(N * 0.11);
  for (let i = 0; i < nBulge; i++) {
    const r = G_.bulgeRadius * Math.pow(rnd(), 1.8);
    const d = unitDir();
    c = _c.copy(CREAM).lerp(C.peach, Math.pow(r / G_.bulgeRadius, 0.8) * 0.7);
    b = (0.22 + 0.35 * (1 - r / G_.bulgeRadius)) * base();
    S.push(d[0] * r, d[1] * r * G_.bulgeFlatten, d[2] * r, c, 0.35 + rnd() * 0.4, b, r / RMAX);
  }
  // 2 — between the arms: old, dim, neutral (NOT blue — that's the young arms)
  const nDisc = Math.round(N * 0.22);
  for (let i = 0; i < nDisc; i++) {
    const r = sampleRadius();
    const phi = rnd() * TAU;
    const y = gauss(hz(r));
    c = _c.copy(C.peach).lerp(C.lbabyBlue, smoothstep(0.15, 0.85, r / RMAX)).lerp(NEUTRAL, 0.35);
    b = base() * G_.interArmDim;
    s = 0.45 + rnd() * 0.4;
    if (rnd() < 0.02) {
      s *= 1.8;
      b *= 1.8;
    }
    S.push(Math.cos(phi) * r, y, Math.sin(phi) * r, c, s, b, r / RMAX);
  }
  // 3 — spiral arms: young + bright, clumpy, thinned where the dust lane sits
  const nArm = Math.round(N * 0.5);
  const maxTries = nArm * 4;
  for (let got = 0, tries = 0; got < nArm && tries < maxTries; ) {
    tries++;
    const r = sampleRadius();
    const k = Math.floor(rnd() * G_.armCount);
    const sigmaPhi = G_.armWidth / Math.max(r, R0);
    const dPhi = gauss(sigmaPhi);
    const across = dPhi * r;
    if (rnd() > clumpAccept(r, k, across)) continue;
    if (across > G_.dustOffset * 0.7 && across < G_.dustOffset * 1.3 && rnd() < 0.35) continue;
    const phi = armAngle(r, k) + dPhi;
    const rr = Math.max(0, r + gauss(0.12 * r));
    const ridge = Math.exp(-(dPhi * dPhi) / (2 * Math.pow(0.45 * sigmaPhi, 2)));
    const y = gauss(hz(rr));
    c = _c.copy(armColor(rr));
    b = base() * (1 + G_.ridgeGain * ridge) * (0.45 + 0.55 * smoothstep(0.8, 3.2, rr)); // dimmer in the core
    s = jitter() * (1 + 0.4 * ridge);
    if (rnd() < 0.08) {
      c.copy(C.coreWhite); // hot young stars
      b *= 1.25;
    }
    if (rnd() < 0.03) {
      s *= 1.8; // resolved standouts
      b *= 1.5;
    }
    S.push(Math.cos(phi) * rr, y, Math.sin(phi) * rr, c, s, b, rr / RMAX);
    got++;
  }
  // 4 — faint round halo (depth)
  const nHalo = Math.round(N * 0.05);
  for (let i = 0; i < nHalo; i++) {
    const r = RMAX * (0.6 + 0.7 * Math.pow(rnd(), 2));
    const d = unitDir();
    c = _c.copy(C.coreWhite).lerp(C.lbabyBlue, rnd()).lerp(NEUTRAL, 0.3);
    S.push(d[0] * r, d[1] * r * 0.85, d[2] * r, c, 0.4 + rnd() * 0.35, base() * 0.3, r / RMAX);
  }

  // ── STAR-FORMING REGIONS (their own layer, drawn ABOVE the dust) ──
  // Many small coral-pink regions on the arms' OUTER edge, each made of a few
  // sub-clumps, with a soft pink glow.
  for (let i = 0; i < G_.hiiCount; i++) {
    const r = RMAX * (0.28 + 0.67 * Math.pow(rnd(), 0.8));
    const k = Math.floor(rnd() * G_.armCount);
    const phi = armAngle(r, k) - (G_.hiiOffset + gauss(0.12)) / r;
    const cx = Math.cos(phi) * r;
    const cz = Math.sin(phi) * r;
    const cy = gauss(hz(r) * 0.5);
    const regionB = 0.6 + rnd() * 0.8;
    const subs = 2 + Math.floor(rnd() * 3);
    for (let sc = 0; sc < subs; sc++) {
      const sx = cx + gauss(0.12);
      const sz = cz + gauss(0.12);
      const dots = 5 + Math.floor(rnd() * 9);
      for (let j = 0; j < dots; j++) {
        c = _c.copy(PINK).lerp(C.coral, rnd() * 0.5);
        b = base() * 1.6 * regionB;
        if (rnd() < 0.15) {
          c.copy(C.coreWhite).lerp(PINK, 0.3); // white-hot cores
          b *= 1.3;
        }
        K.push(sx + gauss(0.045), cy + gauss(0.03), sz + gauss(0.045), c, jitter() * 1.4, b, r / RMAX);
      }
    }
    G.push(cx, cy, cz, PINK, 0.9 + rnd() * 0.6, 0.9 * regionB, r / RMAX);
  }
  // Young blue clusters sitting ON the arm ridge.
  for (let i = 0; i < G_.blueClusters; i++) {
    const r = RMAX * (0.3 + 0.65 * rnd());
    const k = Math.floor(rnd() * G_.armCount);
    const phi = armAngle(r, k) + gauss(0.2) / r;
    const bx = Math.cos(phi) * r;
    const bz = Math.sin(phi) * r;
    const by = gauss(hz(r) * 0.5);
    const nd = 6 + Math.floor(rnd() * 7);
    for (let q = 0; q < nd; q++) {
      c = _c.copy(C.lbabyBlue).lerp(C.coreWhite, rnd() * 0.6);
      K.push(bx + gauss(0.05), by + gauss(0.03), bz + gauss(0.05), c, jitter() * 1.1, base() * 1.3, r / RMAX);
    }
    G.push(bx, by, bz, C.lbabyBlue, 0.7 + rnd() * 0.4, 0.45, r / RMAX);
  }

  // ── SOFT GLOW (the milky light of stars too small to see one by one) ──
  const nCoreGlow = Math.round(700 * aux);
  for (let i = 0; i < nCoreGlow; i++) {
    // core glow (faint: hundreds overlap here)
    const r = G_.bulgeRadius * 1.3 * Math.pow(rnd(), 1.4);
    const d = unitDir();
    c = _c.copy(CREAM).lerp(C.peach, (r / (G_.bulgeRadius * 1.3)) * 0.6);
    G.push(d[0] * r, d[1] * r * G_.bulgeFlatten, d[2] * r, c, 1.6 + rnd() * 2.2, 0.012, r / RMAX);
  }
  const nArmGlow = Math.round(5200 * aux);
  const maxGlowTries = Math.round(20000 * aux);
  for (let gArm = 0, gTries = 0; gArm < nArmGlow && gTries < maxGlowTries; ) {
    // arm glow
    gTries++;
    const r = sampleRadius();
    const k = Math.floor(rnd() * G_.armCount);
    const gs = (G_.armWidth * 1.25) / Math.max(r, R0);
    const gdp = gauss(gs);
    if (rnd() > clumpAccept(r, k, gdp * r)) continue;
    const phi = armAngle(r, k) + gdp;
    const gridge = Math.exp(-(gdp * gdp) / (2 * gs * gs));
    c = _c.copy(armColor(r)).lerp(STEEL, 0.35);
    G.push(
      Math.cos(phi) * r,
      gauss(hz(r)),
      Math.sin(phi) * r,
      c,
      1.0 + rnd() * 1.3,
      0.4 * (0.6 + 0.4 * gridge) * (0.12 + 0.88 * smoothstep(1.2, 4.0, r)),
      r / RMAX
    );
    gArm++;
  }
  const nDiscGlow = Math.round(1600 * aux);
  for (let i = 0; i < nDiscGlow; i++) {
    // faint disc glow
    const r = sampleRadius();
    const phi = rnd() * TAU;
    c = _c.copy(C.peach).lerp(STEEL, smoothstep(0.1, 0.8, r / RMAX)).lerp(NEUTRAL, 0.4);
    G.push(Math.cos(phi) * r, gauss(hz(r)), Math.sin(phi) * r, c, 1.8 + rnd() * 1.8, 0.16 * smoothstep(1.0, 3.5, r), r / RMAX);
  }

  // ── DUST (multiplied onto the light behind it, so it only darkens where there's
  //    light — invisible over empty space) ──
  // A filament along each arm's inner edge, broken up by noise, with a faint second
  // strand, short "feathers" crossing the arm, plus patchy dust across the disc.
  for (let k = 0; k < G_.armCount; k++) {
    for (let r = 1.0; r < RMAX * 0.97; r += 0.022) {
      const n = fbm(r * 1.6 + k * 9.1, k * 3.3 + 0.5);
      if (n < G_.dustBreak) continue; // gaps in the lane
      const strength = smoothstep(G_.dustBreak, G_.dustBreak + 0.25, n);
      const outer = 1 - smoothstep(0.8 * RMAX, 0.97 * RMAX, r);
      const laneOff = G_.dustOffset * (0.75 + 0.5 * vnoise(r * 2.4 + k * 5.0, 11.3)); // wandering lane
      const inner = 0.55 + 0.45 * smoothstep(1.0, 2.2, r); // lighter over the bright core
      const puffs = 3 + Math.floor(rnd() * 3);
      for (let p = 0; p < puffs; p++) {
        const ac = laneOff + gauss(G_.dustWidth);
        const rr = r + gauss(0.03);
        const phi = armAngle(rr, k) + ac / rr;
        c = _c.copy(DUST).lerp(DUST_RED, rnd() * 0.4);
        D.push(
          Math.cos(phi) * rr,
          gauss(hz(rr) * 0.4),
          Math.sin(phi) * rr,
          c,
          0.4 + rnd() * 0.6,
          strength * outer * inner * (0.25 + 0.75 * rnd() * rnd()),
          rr / RMAX
        );
      }
      if (rnd() < 0.35) {
        // a faint second strand
        const ac2 = laneOff + 0.2 + gauss(0.05);
        const rr = r + gauss(0.03);
        const phi = armAngle(rr, k) + ac2 / rr;
        c = _c.copy(DUST).lerp(DUST_RED, rnd() * 0.4);
        D.push(Math.cos(phi) * rr, gauss(hz(rr) * 0.4), Math.sin(phi) * rr, c, 0.35 + rnd() * 0.4, strength * outer * inner * 0.45 * rnd(), rr / RMAX);
      }
      if (r > 1.2 && rnd() < G_.featherRate) {
        // a feather crossing the arm
        const phiL = armAngle(r, k) + laneOff / r;
        const px0 = Math.cos(phiL) * r;
        const pz0 = Math.sin(phiL) * r;
        let tx = Math.cos(phiL) - B * Math.sin(phiL);
        let tz = Math.sin(phiL) + B * Math.cos(phiL);
        const tl = Math.hypot(tx, tz);
        tx /= tl;
        tz /= tl;
        const fa = 0.55 + rnd() * 0.3;
        let fx = Math.cos(phiL) * fa + tx * (1 - fa);
        let fz = Math.sin(phiL) * fa + tz * (1 - fa);
        const fl = Math.hypot(fx, fz);
        fx /= fl;
        fz /= fl;
        const len = 0.4 + rnd() * 1.1;
        const nf = 8 + Math.floor(len * 14);
        for (let f = 0; f < nf; f++) {
          const st = (f / nf) * len;
          const wob = gauss(0.03);
          const x = px0 + fx * st - fz * wob;
          const z = pz0 + fz * st + fx * wob;
          const rf = Math.hypot(x, z);
          c = _c.copy(DUST).lerp(DUST_RED, rnd() * 0.4);
          D.push(x, gauss(hz(rf) * 0.4), z, c, 0.5 + rnd() * 0.6, strength * outer * 0.8 * (1 - f / nf) * (0.5 + 0.5 * rnd()), rf / RMAX);
        }
      }
    }
  }
  const nPatches = Math.round(G_.dustPatches * aux);
  for (let i = 0; i < nPatches; i++) {
    // patchy dust across the disc
    const r = sampleRadius();
    const phi = rnd() * TAU;
    const x2 = Math.cos(phi) * r;
    const z2 = Math.sin(phi) * r;
    const m = fbm(x2 * 0.55 + 3.1, z2 * 0.55 + 7.7);
    if (m < 0.55) continue;
    c = _c.copy(DUST).lerp(DUST_RED, rnd() * 0.3);
    D.push(x2, gauss(hz(r) * 0.5), z2, c, 0.8 + rnd() * 1.2, (m - 0.55) * 0.8 * (1 - smoothstep(0.85 * RMAX, RMAX, r)), r / RMAX);
  }

  // ── SOFT EDGES (added last, so everything above stays identical) ──
  // The disc melts into the space around it instead of ending on a rim.
  // Sparse outer stars: their number falls off steadily past the disc edge, down to
  // the density of the deep field around the galaxy.
  const nOuter = Math.round(N * G_.outerStars);
  for (let i = 0; i < nOuter; i++) {
    const r = RMAX * (0.85 - 0.24 * Math.log(1 - rnd() * 0.94)); // 0.85 → ~1.5 RMAX
    const phi = rnd() * TAU;
    const y = gauss(hz(r) * (1.6 + (r / RMAX) * 1.4)); // puffier out here
    c = _c.copy(C.lbabyBlue).lerp(C.coreWhite, rnd() * 0.5).lerp(NEUTRAL, 0.35);
    b = base() * (0.22 + 0.3 * rnd()) * (1 - 0.5 * smoothstep(RMAX, 1.5 * RMAX, r));
    S.push(Math.cos(phi) * r, y, Math.sin(phi) * r, c, 0.4 + rnd() * 0.45, b, r / RMAX);
  }
  // A faint, wide glow envelope: big dim sprites thinning out well past the arms.
  const nEnvelope = G_.envelope > 0 ? Math.round(900 * aux) : 0;
  for (let i = 0; i < nEnvelope; i++) {
    const r = RMAX * (0.6 - 0.3 * Math.log(1 - rnd() * 0.93)); // 0.6 → ~1.4 RMAX
    const phi = rnd() * TAU;
    const fall = Math.exp(-Math.max(0, r / RMAX - 0.6) / 0.3);
    c = _c.copy(STEEL).lerp(C.lbabyBlue, 0.3).lerp(NEUTRAL, 0.35);
    G.push(
      Math.cos(phi) * r,
      gauss(hz(r) * 3),
      Math.sin(phi) * r,
      c,
      2.4 + rnd() * 1.8,
      0.05 * G_.envelope * fall,
      r / RMAX
    );
  }

  return { stars: S.geom(), knots: K.geom(), glow: G.geom(), dust: D.geom() };
}
