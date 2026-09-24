import { SIMPLEX_NOISE } from "#/components/three.js/planet/shaders";

/**
 * GLSL for the Sun's dotted shell (see Sun.tsx): a see-through ball of tightly packed
 * peach dots, with the glowing core (SunCore) inside.
 *
 * The dots use the Saturn / Earth dot style (scattered, varied, soft, distance-
 * attenuated) and ride the sphere: each one drifts a little ALONG the surface
 * (renormalised, so it keeps its radius) and turns with a slow differential rotation
 * (the equator a bit faster than the poles). The same points are drawn twice — the far
 * side, then (after the glowing core) the near side — so the core sits between them,
 * inside the ball.
 */
export const DOT_VERT = /* glsl */ `
uniform float uTime, uRadius, uSpin, uSwirl, uSize, uPixelRatio;
uniform float uShimmer, uShimmerSpeed, uBackDim, uSide; // uSide: 1 = near side, -1 = far side
uniform vec3 uCore, uMid, uEdge;
uniform float uSplit, uBrightness;
attribute float aScale, aBright, aSeed;
varying vec3 vColor;
${SIMPLEX_NOISE}
vec3 rotY(vec3 p, float a){ float c = cos(a), s = sin(a); return vec3(c*p.x + s*p.z, p.y, -s*p.x + c*p.z); }
void main(){
  float t = uTime;
  vec3 dir0 = normalize(position);
  float shell = length(position); // ~1, with the radial grain
  // Drift along the surface, then the slow (differential) turn.
  vec3 w = vec3(
    snoise(dir0 * 4.0 + vec3(0.0, 0.0, t * 0.12)),
    snoise(dir0 * 4.0 + vec3(17.0, 0.0, t * 0.12)),
    snoise(dir0 * 4.0 + vec3(0.0, 31.0, t * 0.12))
  );
  vec3 body = normalize(dir0 + uSwirl * w);
  vec3 dir = rotY(body, uSpin * t * (1.0 - 0.25 * body.y * body.y));

  vec4 mv = modelViewMatrix * vec4(dir * uRadius * shell, 1.0);
  float mu = dot(normalize(normalMatrix * dir), normalize(-mv.xyz)); // 1 = facing you, 0 = rim
  // Each pass draws one side of the ball.
  if (mu * uSide < 0.0) { gl_Position = vec4(2.0, 2.0, 2.0, 1.0); gl_PointSize = 0.0; vColor = vec3(0.0); return; }

  // The original Sun's gradient, across the disc as you see it: the centre colour →
  // (linear) → the middle colour at uSplit of the way out → the edge colour at the rim.
  float rho = sqrt(max(0.0, 1.0 - mu * mu)); // 0 at the disc's centre → 1 at its edge
  vec3 c = rho < uSplit
    ? mix(uCore, uMid, rho / uSplit)
    : mix(uMid, uEdge, (rho - uSplit) / max(1.0 - uSplit, 0.001));
  if (uSide < 0.0) c = mix(uEdge, c, 0.4) * uBackDim; // the far side, dimmer
  // A gentle shimmer (each dot on its own slow rhythm).
  c *= uBrightness * aBright * (1.0 + uShimmer * snoise(vec3(body * 6.0) + vec3(aSeed * 13.0, t * uShimmerSpeed, 0.0)));
  vColor = c;

  gl_PointSize = uSize * aScale * uPixelRatio / -mv.z;
  gl_Position = projectionMatrix * mv;
}
`;

export const DOT_FRAG = /* glsl */ `
precision highp float;
uniform float uReveal;
uniform float uSoftness; // 0.35 = the Saturn / Earth dot
varying vec3 vColor;
void main(){
  float d = length(gl_PointCoord - 0.5);
  if (d > 0.5) discard;
  float a = smoothstep(0.5, 0.5 - uSoftness, d) * uReveal; // soft round dots
  if (a < 0.01) discard;
  gl_FragColor = vec4(vColor, a);
}
`;
