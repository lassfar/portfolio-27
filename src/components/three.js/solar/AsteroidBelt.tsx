"use client";

import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef, useState } from "react";
import { BufferAttribute, BufferGeometry, Color, NormalBlending, Points, ShaderMaterial } from "three";
import { useVoyageScroll } from "#/stores/useVoyageScroll";
import { ASTEROIDS, EARTH_ELEMENTS, orbitRadius, SOLAR_MOTION, SYSTEM_SHOWS_AT } from "./config";
import { systemTime } from "./orbits";
import { usePlanetTuning } from "./planetTuning";
import { siblingReveal } from "./reveal";
import { useDrawGate } from "#/components/three.js/scene/useDrawGate";
import { sceneBuilds } from "#/components/three.js/scene/sceneBuilds";
import { setHexIfChanged } from "#/components/three.js/scene/colorCache";

const DEG = Math.PI / 180;

/** A normally distributed random number (Box–Muller). */
const gaussian = () => Math.sqrt(-2 * Math.log(1 - Math.random())) * Math.cos(2 * Math.PI * Math.random());

/** Asteroids built per step of the build queue (~a fraction of a ms each). */
const BUILD_STEP = 2000;

/** The asteroids' orbits, as flat arrays (one entry per asteroid). */
type BeltOrbits = {
  a: Float32Array;
  ecc: Float32Array;
  incl: Float32Array;
  node: Float32Array;
  m0: Float32Array;
  kepler: Float32Array;
  bright: Float32Array;
};

const allocateBelt = (count: number): BeltOrbits => ({
  a: new Float32Array(count),
  ecc: new Float32Array(count),
  incl: new Float32Array(count),
  node: new Float32Array(count),
  m0: new Float32Array(count),
  kepler: new Float32Array(count),
  bright: new Float32Array(count),
});

/** Each asteroid's own orbit, built into `out`, pausing every BUILD_STEP asteroids (see sceneBuilds). */
function* buildBelt(count: number, out: BeltOrbits) {
  const { a, ecc, incl, node, m0, kepler, bright } = out;
  const earthR = orbitRadius(EARTH_ELEMENTS.au);
  const inGap = (au: number) => ASTEROIDS.gaps.some((g) => Math.abs(au - g) < ASTEROIDS.gapWidth);
  for (let i = 0; i < count; i++) {
    // Densest mid-belt (two uniforms → a triangle), mostly empty in the gaps.
    let au = 0;
    do {
      au = ASTEROIDS.inner + (ASTEROIDS.outer - ASTEROIDS.inner) * ((Math.random() + Math.random()) / 2);
    } while (inGap(au) && Math.random() < 0.9);
    a[i] = orbitRadius(au);
    ecc[i] = Math.random() * ASTEROIDS.ecc;
    incl[i] = Math.min(Math.abs(gaussian()) * ASTEROIDS.incl, 25) * DEG;
    node[i] = Math.random() * Math.PI * 2;
    m0[i] = Math.random() * Math.PI * 2;
    kepler[i] = Math.pow(earthR / a[i], 1.5); // × the Earth's pace = its mean motion
    bright[i] = 0.6 + Math.random() * 0.6;
    if ((i + 1) % BUILD_STEP === 0) yield;
  }
}

function toBeltGeometry(orbits: BeltOrbits): BufferGeometry {
  const g = new BufferGeometry();
  // (position is unused — the shader places each dot — but three needs one for the count.)
  g.setAttribute("position", new BufferAttribute(new Float32Array(orbits.a.length * 3), 3));
  g.setAttribute("aA", new BufferAttribute(orbits.a, 1));
  g.setAttribute("aE", new BufferAttribute(orbits.ecc, 1));
  g.setAttribute("aIncl", new BufferAttribute(orbits.incl, 1));
  g.setAttribute("aNode", new BufferAttribute(orbits.node, 1));
  g.setAttribute("aM0", new BufferAttribute(orbits.m0, 1));
  g.setAttribute("aKepler", new BufferAttribute(orbits.kepler, 1));
  g.setAttribute("aBright", new BufferAttribute(orbits.bright, 1));
  return g;
}

/**
 * The main asteroid belt between Mars and Jupiter (ASTEROIDS): thousands of faint dots,
 * each on its own orbit — its distance drawn from the real belt (densest mid-belt, with
 * the Kirkwood gaps cleared), a tilt and a slight oval — circling at its own Kepler
 * pace, so the belt slowly shears. The motion runs in the shader. Fades with the
 * sibling planets.
 */
const AsteroidBelt = () => {
  const pointsRef = useRef<Points>(null);
  const version = usePlanetTuning((s) => s.version); // bumped by the panel's shape values
  const isSmall = typeof window !== "undefined" && window.innerWidth < 768;

  // Its orbits are built in idle time, in story order (P27-86): the belt only shows with
  // the system, on the voyage. Until then an empty geometry stands in (it draws nothing).
  // `version` rebuilds them from the tuned ASTEROIDS / SOLAR_MOTION.
  const placeholder = useMemo(() => new BufferGeometry(), []);
  const [geometry, setGeometry] = useState<BufferGeometry | null>(null);
  useEffect(() => {
    const count = isSmall ? ASTEROIDS.countMobile : ASTEROIDS.count;
    const orbits = allocateBelt(count);
    return sceneBuilds.add({
      name: "Asteroid belt",
      neededAt: SYSTEM_SHOWS_AT,
      steps: buildBelt(count, orbits),
      onDone: () => setGeometry(toBeltGeometry(orbits)),
    });
  }, [isSmall, version]);
  useEffect(() => () => geometry?.dispose(), [geometry]);
  useEffect(() => () => placeholder.dispose(), [placeholder]);

  const material = useMemo(
    () =>
      new ShaderMaterial({
        transparent: true,
        depthWrite: false,
        blending: NormalBlending,
        uniforms: {
          uTime: { value: 0 },
          uPace: { value: SOLAR_MOTION.orbitPace },
          uSize: { value: 1 },
          uMaxSize: { value: ASTEROIDS.maxSize },
          uPixelRatio: { value: 1 },
          uReveal: { value: 0 },
          uBrightness: { value: ASTEROIDS.brightness },
          uColor: { value: new Color(ASTEROIDS.color) },
        },
        vertexShader: BELT_VERT,
        fragmentShader: BELT_FRAG,
      }),
    []
  );
  useEffect(() => () => material.dispose(), [material]);
  // Faded out (its shader draws nothing then) — skip the draw.
  useDrawGate(pointsRef, () => material.uniforms.uReveal.value > 0);

  useFrame((state) => {
    const u = material.uniforms;
    u.uTime.value = systemTime(state.clock.elapsedTime, useVoyageScroll.getState().progress);
    u.uPace.value = SOLAR_MOTION.orbitPace;
    u.uSize.value = ASTEROIDS.size * 55; // ≈ `size` px at the wide view's distance
    u.uMaxSize.value = ASTEROIDS.maxSize;
    u.uPixelRatio.value = state.viewport.dpr;
    u.uReveal.value = siblingReveal();
    u.uBrightness.value = ASTEROIDS.brightness;
    setHexIfChanged(u.uColor.value, ASTEROIDS.color);
    if (pointsRef.current) pointsRef.current.visible = ASTEROIDS.show;
  });

  return <points ref={pointsRef} geometry={geometry ?? placeholder} material={material} frustumCulled={false} />;
};

export default AsteroidBelt;

const BELT_VERT = /* glsl */ `
uniform float uTime, uPace, uSize, uMaxSize, uPixelRatio, uReveal, uBrightness;
uniform vec3 uColor;
attribute float aA, aE, aIncl, aNode, aM0, aKepler, aBright;
varying vec3 vColor;
void main(){
  if (uReveal <= 0.0) { gl_Position = vec4(2.0, 2.0, 2.0, 1.0); gl_PointSize = 0.0; vColor = vec3(0.0); return; }
  // Its own Kepler orbit: mean anomaly → (first-order) true anomaly + distance.
  float M = aM0 + uPace * aKepler * uTime;
  float nu = M + 2.0 * aE * sin(M);
  float r = aA * (1.0 - aE * cos(M));
  float cn = cos(aNode), sn = sin(aNode), ci = cos(aIncl), si = sin(aIncl);
  float cu = cos(nu), su = sin(nu);
  // Tilted about its node; ecliptic → display (north = +Y, counterclockwise).
  vec3 p = r * vec3(cn * cu - sn * su * ci, su * si, -(sn * cu + cn * su * ci));
  vec4 mv = modelViewMatrix * vec4(p, 1.0);
  gl_PointSize = min(uSize * uPixelRatio / -mv.z, uMaxSize * uPixelRatio);
  gl_Position = projectionMatrix * mv;
  vColor = uColor * aBright * uBrightness;
}
`;

const BELT_FRAG = /* glsl */ `
precision highp float;
uniform float uReveal;
varying vec3 vColor;
void main(){
  float d = length(gl_PointCoord - 0.5);
  if (d > 0.5) discard;
  float a = smoothstep(0.5, 0.15, d) * uReveal;
  if (a < 0.01) discard;
  gl_FragColor = vec4(vColor, a);
}
`;
