/**
 * GLSL for the realistic galaxy layers (see `Galaxy.tsx` / `buildGalaxy.ts`).
 *
 * Every galaxy layer applies the same tiny inner/outer `shear`, so the dust and glow
 * stay glued to the arms as they turn. Star dots keep a FIXED size on screen; the
 * soft glow and dust have a REAL size in space and fade out near the camera (the
 * "near fade"), so from inside the galaxy they only show in the distance.
 */

const SHEAR = /* glsl */ `
uniform float uTime, uDiff, uPixelRatio;
attribute vec3 aColor;
attribute float aScale, aBright, aSeed, aRadiusNorm;
vec3 shear(vec3 p, float rn){
  float ang = uDiff * uTime * (1.0 / (rn + 0.15) - 1.0);
  float cs = cos(ang), sn = sin(ang);
  return vec3(cs * p.x + sn * p.z, p.y, -sn * p.x + cs * p.z);
}
`;

/** Star dots + star-forming regions: the site's dot recipe, fixed on-screen size. */
export const DOT_VERT = /* glsl */ `
${SHEAR}
uniform float uSize;
varying vec3 vColor;
varying float vTw;
void main(){
  vColor = aColor * aBright;
  vec4 mv = modelViewMatrix * vec4(shear(position, aRadiusNorm), 1.0);
  vTw = 0.5 + 0.5 * sin(uTime * 1.5 + aSeed * 6.2831);
  gl_PointSize = uSize * aScale * uPixelRatio;
  gl_Position = projectionMatrix * mv;
}
`;

export const DOT_FRAG = /* glsl */ `
precision highp float;
uniform float uTwinkleAmt, uBoost, uReveal, uFlight;
varying vec3 vColor;
varying float vTw;
void main(){
  float d = length(gl_PointCoord - 0.5);
  if (d > 0.5) discard;
  float a = pow(smoothstep(0.5, 0.12, d), 1.6);
  float b = (1.0 - uTwinkleAmt) + uTwinkleAmt * vTw;
  // uFlight: the extra brightness during the flight out (GALAXY.flightBoost).
  gl_FragColor = vec4(vColor * b * uBoost * uFlight, a * uReveal);
}
`;

/**
 * Soft glow: big, faint, world-sized sprites (additive) that fade out up close.
 * Soft edges (`uEdgeSoft`): toward the rim the sprites grow larger and fainter, so
 * the outer glow is a smooth haze melting into space instead of separate puffs.
 */
export const GLOW_VERT = /* glsl */ `
${SHEAR}
uniform float uGlowSize, uNearA, uNearB, uEdgeSoft;
varying vec3 vColor;
varying float vNear;
void main(){
  float edge = uEdgeSoft * smoothstep(0.45, 1.0, aRadiusNorm);
  vColor = aColor * aBright * (1.0 - 0.6 * edge);
  vec4 mv = modelViewMatrix * vec4(shear(position, aRadiusNorm), 1.0);
  float dist = max(-mv.z, 0.001);
  vNear = smoothstep(uNearA, uNearB, dist);
  // Faded-out sprites get no size at all → no fill cost near the camera.
  float size = uGlowSize * aScale * (1.0 + 0.9 * edge);
  gl_PointSize = vNear < 0.004 ? 0.0 : min(size * uPixelRatio / dist, 200.0 * uPixelRatio);
  gl_Position = projectionMatrix * mv;
}
`;

export const GLOW_FRAG = /* glsl */ `
precision highp float;
uniform float uGlowAmt, uReveal;
varying vec3 vColor;
varying float vNear;
void main(){
  float d = length(gl_PointCoord - 0.5) * 2.0;
  if (d > 1.0) discard;
  float a = exp(-d * d * 4.5) * (1.0 - smoothstep(0.75, 1.0, d));
  gl_FragColor = vec4(vColor * uGlowAmt, a * vNear * uReveal);
}
`;

/**
 * Dust: world-sized puffs MULTIPLIED onto the light behind them (pure absorption —
 * invisible over empty space). three r180's MultiplyBlending needs premultiplied
 * alpha: blend = dst·src.rgb + dst·(1 − src.a), so outputting (tint·a, a) gives
 * dst · mix(1, tint, a) — how much light passes.
 */
export const DUST_VERT = /* glsl */ `
${SHEAR}
uniform float uDustSize, uNearA, uNearB;
varying vec3 vColor;
varying float vA;
void main(){
  vColor = aColor;
  vec4 mv = modelViewMatrix * vec4(shear(position, aRadiusNorm), 1.0);
  float dist = max(-mv.z, 0.001);
  vA = aBright * smoothstep(uNearA, uNearB, dist);
  gl_PointSize = vA < 0.004 ? 0.0 : min(uDustSize * aScale * uPixelRatio / dist, 90.0 * uPixelRatio);
  gl_Position = projectionMatrix * mv;
}
`;

export const DUST_FRAG = /* glsl */ `
precision highp float;
uniform float uDustOpacity, uReveal;
varying vec3 vColor;
varying float vA;
void main(){
  float d = length(gl_PointCoord - 0.5);
  if (d > 0.5) discard;
  float a = clamp(pow(smoothstep(0.5, 0.0, d), 1.3) * vA * uDustOpacity * uReveal, 0.0, 1.0);
  gl_FragColor = vec4(vColor * a, a);
}
`;

/** The core: a tight creamy centre + a broad warm halo (camera-facing plane). */
export const CORE_VERT = /* glsl */ `
varying vec2 vUv;
void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }
`;

export const CORE_FRAG = /* glsl */ `
precision highp float;
varying vec2 vUv;
uniform float uOpacity, uCoreLift;
void main(){
  float d = length(vUv - 0.5) * 2.0;
  float core = exp(-d * d * 18.0);
  float halo = exp(-d * d * 3.0) * 0.55;
  vec3 col = mix(vec3(1.0, 0.96, 0.90), vec3(0.95, 0.62, 0.30), smoothstep(0.0, 0.8, d));
  // uCoreLift: extra light in the tight centre only (never the wide halo, which fills
  // the screen from inside the galaxy) — see GALAXY.coreFlightBoost.
  float a = (core + halo) * uOpacity + core * uCoreLift;
  gl_FragColor = vec4(col, a * (1.0 - smoothstep(0.85, 1.0, d)));
}
`;

/**
 * Sparkly foreground stars: a tight core, a soft halo and a thin cross-shaped
 * sparkle. Laid out in the END view's camera space and drawn in the sky frame (see
 * `Galaxy.tsx`), so at rest they sit exactly on their designed spots, and a drag
 * turns them with the rest of space.
 */
export const SPARKLE_VERT = /* glsl */ `
uniform float uTime, uPixelRatio, uSparkSize;
attribute vec3 aColor;
attribute float aScale, aSeed;
varying vec3 vColor;
varying float vB;
void main(){
  vColor = aColor;
  vB = 0.85 + 0.15 * sin(uTime * 0.9 + aSeed * 6.2831);
  gl_PointSize = uSparkSize * aScale * uPixelRatio;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

/**
 * The deep field: tiny far stars all around the galaxy, in the galaxy's own dot
 * language (fixed on-screen size, raw screen colours).
 */
export const SPACE_STAR_VERT = /* glsl */ `
uniform float uPixelRatio, uSize;
attribute vec3 aColor;
attribute float aScale, aBright;
varying vec3 vColor;
void main(){
  vColor = aColor * aBright;
  gl_PointSize = uSize * aScale * uPixelRatio;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

export const SPACE_STAR_FRAG = /* glsl */ `
precision highp float;
uniform float uFade, uBright;
varying vec3 vColor;
void main(){
  float d = length(gl_PointCoord - 0.5);
  if (d > 0.5) discard;
  float a = pow(smoothstep(0.5, 0.12, d), 1.6);
  gl_FragColor = vec4(vColor * uBright, a * uFade);
}
`;

/**
 * Distant galaxies: tiny faint smudges — an elliptical glow (a disc seen at an angle)
 * with a bright core, and a hint of spiral arms on the spiral ones.
 */
export const FAR_GALAXY_VERT = /* glsl */ `
uniform float uPixelRatio, uSize;
attribute vec3 aColor;
attribute float aPx, aAxis, aAngle, aType, aBright, aSeed;
varying vec3 vColor;
varying float vAxis, vAngle, vType, vBright, vSeed;
void main(){
  vColor = aColor;
  vAxis = aAxis;
  vAngle = aAngle;
  vType = aType;
  vBright = aBright;
  vSeed = aSeed;
  gl_PointSize = aPx * uSize * uPixelRatio;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

export const FAR_GALAXY_FRAG = /* glsl */ `
precision highp float;
uniform float uFade, uBright;
varying vec3 vColor;
varying float vAxis, vAngle, vType, vBright, vSeed;
void main(){
  vec2 p = (gl_PointCoord - 0.5) * 2.0;
  float cs = cos(vAngle), sn = sin(vAngle);
  p = vec2(cs * p.x - sn * p.y, sn * p.x + cs * p.y);
  vec2 e = vec2(p.x, p.y / vAxis); // the tilted disc: an ellipse
  float r = length(e);
  if (r > 1.0) discard;
  float core = exp(-r * r * 45.0);
  float disc = exp(-r * 3.2);
  // atan(0, 0) is undefined in GLSL — NaN on some GPU backends, and one NaN pixel
  // spreads through the bloom blur into a black screen. Guard the exact centre.
  float th = r > 1e-4 ? atan(e.y, e.x) : 0.0;
  float arms = 0.5 + 0.5 * cos(2.0 * (th - 2.6 * log(r + 0.06)) + vSeed * 6.2831);
  disc *= mix(1.0, 0.3 + 1.2 * arms, vType);
  float edge = 1.0 - smoothstep(0.55, 1.0, r);
  vec3 col = mix(vColor, vec3(1.0, 0.95, 0.88), core);
  gl_FragColor = vec4(col, (core * 0.9 + disc * 0.75) * edge * vBright * uBright * uFade);
}
`;

export const SPARKLE_FRAG = /* glsl */ `
precision highp float;
uniform float uSpikes, uFade;
varying vec3 vColor;
varying float vB;
void main(){
  vec2 p = gl_PointCoord - 0.5;
  float r = length(p);
  float core = exp(-r * r * 900.0);
  float halo = exp(-r * r * 120.0) * 0.35;
  float sx = exp(-abs(p.y) * 220.0) * pow(max(0.0, 1.0 - abs(p.x) * 2.0), 2.0);
  float sy = exp(-abs(p.x) * 220.0) * pow(max(0.0, 1.0 - abs(p.y) * 2.0), 2.0);
  gl_FragColor = vec4(vColor, (core + halo + uSpikes * (sx + sy)) * vB * uFade);
}
`;

/**
 * Composite: the galaxy is drawn into its own layer in SCREEN (sRGB) values — the
 * same maths as the prototype — then added to the (linear) scene here, converted
 * once, with its own bloom (also in screen values).
 *
 * The prototype's canvas was OPAQUE with the page colour baked in, so its light
 * always sat on the same background. The site's canvas is see-through, and anything
 * that raises the canvas coverage (e.g. the bright Sun's spread) would lose the page
 * showing through and read as a dark patch. So, as the galaxy appears, this layer
 * adds the page colour itself (`uBg`, in screen values) and covers the canvas
 * fully (`uFill` 0 → 1): the galaxy then sits on exactly the prototype's background.
 */
export const COMPOSITE_VERT = /* glsl */ `
varying vec2 vUv;
void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }
`;

export const COMPOSITE_FRAG = /* glsl */ `
precision highp float;
uniform sampler2D tGalaxy;
uniform sampler2D tBloom;
uniform float uBloom;
uniform vec3 uBg;
uniform float uFill;
varying vec2 vUv;
vec3 srgbToLinear(vec3 c){
  return mix(c / 12.92, pow((max(c, 0.0) + 0.055) / 1.055, vec3(2.4)), step(0.04045, c));
}
void main(){
  // The galaxy layer + its own bloom, both in screen values (as in the prototype).
  vec3 g = texture2D(tGalaxy, vUv).rgb + uBloom * texture2D(tBloom, vUv).rgb;
  float cover = clamp(max(g.r, max(g.g, g.b)), 0.0, 1.0);
  gl_FragColor = vec4(srgbToLinear(g + uBg * uFill), mix(cover, 1.0, uFill));
}
`;
