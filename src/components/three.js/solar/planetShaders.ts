import { SIMPLEX_NOISE } from "#/components/three.js/planet/shaders";

/**
 * GLSL for the planets and moons (see DottedBody.tsx): one surface model whose
 * uniforms (PlanetLook in config.ts) give each body its real features, drawn in the
 * Saturn's dot style and lit by the actual Sun.
 *
 * The dots aren't stored: each is built from its number (gl_VertexID) with a hash —
 * a random point on the sphere, its grain, size, brightness and seed — so a body can
 * hold many dots for a byte each. Level of detail: only the first `uLodCount` dots are
 * drawn (DottedBody picks how many from the body's size on screen) and the last few
 * fade, so dots appear and disappear smoothly as the camera moves.
 *
 * Every feature is noise on the body's own frame (its spin axis = local Y), and the
 * pattern rides with the dots:
 *   • bands — latitude belts / zones of uneven widths with turbulent edges; either
 *     two-tone or the Saturn's gradient (deep → dark → mid → light);
 *   • flowing belts — each dot streams east-west with its belt's jet (alternating from
 *     belt to belt), carrying the storms and streaks with it;
 *   • mottle — dark regions (Mars' maria, Mercury's craters) + lighter accent patches;
 *   • caps — bright polar caps;
 *   • spot — one oval storm (Jupiter's Great Red Spot, Neptune's Great Dark Spot);
 *   • clouds — thin bright streaks along the latitudes;
 *   • haze — a veil that softens every feature toward the base colour.
 * Plus the Saturn's grainy edge (rim dots drift outward and fade) and its twinkle.
 */
export const PLANET_VERT = /* glsl */ `
uniform float uTime, uSize, uPixelRatio, uAmbient, uReveal;
uniform float uRadius, uJitter;       // body radius + the radial grain of the dot shell
uniform float uLodCount, uLodFade;    // level of detail: dots drawn + the fading share
uniform float uRimStart, uRimScatter, uRimAmount; // the Saturn's grainy edge (faded out on small discs)
uniform float uDust, uDustReach, uDustOpacity, uDustBreath; // the Saturn's dust haze (big planets)
uniform vec3 uSunPos; // the Sun's world position — the light
uniform vec3 uBase, uDeep, uDark, uLight, uAccent, uSpotColor;
uniform float uBands, uBandContrast, uBandWarp, uFlow, uGradient;
uniform float uMottle, uMottleScale, uAccentPatches;
uniform float uCaps, uClouds, uHaze;
uniform vec4 uSpot; // latitude (rad), longitude (rad), half-height (rad), strength
uniform float uSpotAspect;
varying vec3 vColor;
varying float vSeed;
varying float vHidden;
varying float vRim;
varying float vLod;
varying float vDust;
${SIMPLEX_NOISE}

// A 32-bit integer hash (lowbias32) → a uniform random number in [0, 1].
uint hash(uint x) {
  x ^= x >> 16; x *= 0x7feb352du;
  x ^= x >> 15; x *= 0x846ca68bu;
  x ^= x >> 16;
  return x;
}
float rand(uint id, uint k) { return float(hash(id * 8u + k)) * (1.0 / 4294967295.0); }

vec3 surface(vec3 d, float t){
  float lat = asin(clamp(d.y, -1.0, 1.0));
  vec3 c = uBase;

  // (Each feature is skipped when it's off — uniform branches, so they're cheap.)
  // Belts + zones: two sines → uneven widths; turbulent, evolving edges.
  if (uBandContrast > 0.0) {
    float warp = uBandWarp * 0.35 * snoise(vec3(d.x * 2.0, d.y * 5.0, d.z * 2.0) + vec3(0.0, 0.0, t * uFlow));
    float b = 0.65 * sin(lat * uBands + warp) + 0.35 * sin(lat * uBands * 2.1 + 1.3 + warp * 1.3);
    vec3 twoTone = mix(uLight, uDark, smoothstep(-0.25, 0.25, b));
    // The Saturn's gradient across each stripe: deep → dark → mid (base) → light.
    float s = b * 0.5 + 0.5;
    vec3 gradient = s < 0.25
      ? mix(uDeep, uDark, s / 0.25)
      : (s < 0.55 ? mix(uDark, uBase, (s - 0.25) / 0.3) : mix(uBase, uLight, (s - 0.55) / 0.45));
    c = mix(c, mix(twoTone, gradient, uGradient), uBandContrast);
  }

  // Dark regions / craters, and lighter accent patches.
  if (uMottle > 0.0) {
    float n = 0.65 * snoise(d * uMottleScale) + 0.35 * snoise(d * uMottleScale * 2.3 + 7.0);
    c = mix(c, uDark, smoothstep(-0.1, 0.4, n) * uMottle);
  }
  if (uAccentPatches > 0.0) {
    float p = snoise(d * uMottleScale * 0.7 + 19.0);
    c = mix(c, uAccent, smoothstep(0.25, 0.7, p) * uAccentPatches);
  }

  // Thin bright cloud streaks along the latitudes.
  if (uClouds > 0.0) {
    float s = snoise(vec3(d.x * 1.5, d.y * 12.0, d.z * 1.5) + vec3(t * uFlow * 2.0, 0.0, 0.0));
    c = mix(c, uLight, smoothstep(0.45, 0.8, s) * uClouds);
  }

  // One oval storm (it drifts with its belt's jet — see main).
  if (uSpot.w > 0.0) {
    float lon = atan(d.z, d.x);
    float dl = mod(lon - uSpot.y + 3.14159265, 6.2831853) - 3.14159265;
    float e = pow(dl * cos(uSpot.x) / (uSpot.z * uSpotAspect), 2.0) + pow((lat - uSpot.x) / uSpot.z, 2.0);
    c = mix(c, uSpotColor, smoothstep(1.0, 0.35, e) * uSpot.w);
  }

  // Bright polar caps (0 = none), with a ragged edge.
  if (uCaps > 0.0) {
    float cap = smoothstep(uCaps, uCaps + 0.04, abs(d.y) + 0.03 * snoise(d * 8.0));
    c = mix(c, uLight, cap);
  }

  return mix(c, uBase, uHaze);
}

void main(){
  // Hidden for most of the page (before the voyage, the Earth, the Lab): skip all the
  // work, but stay mounted so the shader is compiled up front (no hitch on reveal).
  if (uReveal <= 0.0) {
    gl_Position = vec4(2.0, 2.0, 2.0, 1.0);
    gl_PointSize = 0.0;
    vColor = vec3(0.0);
    vSeed = 0.0;
    vHidden = 1.0;
    vRim = 0.0;
    vLod = 0.0;
    vDust = 0.0;
    return;
  }

  // Level of detail: the dots past uLodCount fade out over the next uLodFade share.
  float index = float(gl_VertexID);
  vLod = clamp((uLodCount * (1.0 + uLodFade) - index) / max(uLodCount * uLodFade, 1.0), 0.0, 1.0);

  // The dot, from its number: a random point on the sphere (like the Saturn's) with
  // its radial grain, size, brightness and seed.
  uint id = uint(gl_VertexID);
  float u = rand(id, 0u) * 2.0 - 1.0;
  float theta = rand(id, 1u) * 6.2831853;
  float ring = sqrt(1.0 - u * u);
  vec3 home = vec3(ring * cos(theta), u, ring * sin(theta));
  float r = uRadius * (1.0 + (rand(id, 2u) - 0.5) * uJitter);
  float scale = 0.6 + rand(id, 3u) * 0.8;
  float bright = 0.85 + rand(id, 4u) * 0.3;
  float seed = rand(id, 5u);
  // The Saturn's dust (big planets): a share of the dots float as a faint haze just
  // above the surface, breathing in and out.
  float dust = step(rand(id, 6u), uDust);
  vDust = dust;
  r = mix(r, uRadius * (1.0 + pow(rand(id, 7u), 1.5) * uDustReach), dust);
  r += dust * snoise(home * 2.2 + vec3(uTime * 0.08)) * uDustBreath * uRadius;

  // Its colour comes from its home, so the pattern rides with it…
  vec3 c = surface(home, uTime);
  // …as it streams east-west with its belt's jet (alternating belt to belt), keeping
  // its latitude: the belts flow.
  float jet = uTime * uFlow * sin(asin(home.y) * max(uBands, 1.0));
  float cj = cos(jet);
  float sj = sin(jet);
  vec3 d = vec3(cj * home.x + sj * home.z, home.y, -sj * home.x + cj * home.z);

  vec4 world = modelMatrix * vec4(d * r, 1.0);
  vec3 n = normalize(mat3(modelMatrix) * d);
  vec3 toCam = normalize(cameraPosition - world.xyz);
  float facing = dot(n, toCam);
  // Only the hemisphere facing the camera is drawn (the back one sits behind the core).
  // (The haze reaches past the silhouette, so its back half shows beyond the limb.)
  vHidden = step(facing, mix(-0.05, -0.6, dust));
  // The Saturn's grainy edge: near the rim, dots drift outward (and fade, by seed).
  float rim = smoothstep(uRimStart, 1.0, 1.0 - abs(facing)) * uRimAmount * (1.0 - dust);
  vRim = rim;
  world.xyz += n * rim * seed * uRimScatter * uRadius;

  // Lit by the Sun: a soft terminator, the night side kept faintly visible.
  float ndl = dot(n, normalize(uSunPos - world.xyz));
  float light = uAmbient + (1.0 - uAmbient) * smoothstep(-0.12, 0.45, ndl);
  light = mix(light, uAmbient + 0.25, dust); // the dust stays softly lit, like the Saturn's
  vColor = c * light * bright;
  vSeed = seed;

  vec4 mv = viewMatrix * world;
  // The Saturn's twinkle: each dot gently pulses in size.
  float tw = 0.5 + 0.5 * sin(uTime * 1.5 + seed * 6.2831);
  gl_PointSize = uSize * scale * (0.7 + tw * 0.4) * uPixelRatio / -mv.z;
  gl_Position = projectionMatrix * mv;
}
`;

export const PLANET_FRAG = /* glsl */ `
precision highp float;
uniform float uReveal, uThin, uBoost, uSoftness;
varying vec3 vColor;
varying float vSeed;
varying float vHidden;
varying float vRim;
varying float vLod;
varying float vDust;
uniform float uDustOpacity;
void main(){
  if (vSeed < uThin || vHidden > 0.5) discard;
  float d = length(gl_PointCoord - 0.5);
  if (d > 0.5) discard;
  float a = smoothstep(0.5, 0.5 - uSoftness, d) * uReveal * vLod; // soft round dots
  a *= 1.0 - vRim * vSeed * 0.85; // the grainy edge dissolves
  a *= mix(1.0, uDustOpacity, vDust); // the dust is faint
  if (a < 0.003) discard;
  // Held just under the bloom threshold, so the planets read as solid colour, not
  // white flares (only the Sun is meant to bloom).
  gl_FragColor = vec4(vColor * uBoost * 0.62, a);
}
`;
