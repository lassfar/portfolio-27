"use client";

import { forwardRef, useEffect, useMemo } from "react";
import { Uniform } from "three";
import { BlendFunction, Effect } from "postprocessing";

const FRAG = /* glsl */ `
uniform float uKnee;
uniform float uStrength;
vec3 toScreen(vec3 c) {
  return mix(c * 12.92, 1.055 * pow(max(c, 0.0), vec3(1.0 / 2.4)) - 0.055, step(0.0031308, c));
}
vec3 toLinear(vec3 c) {
  return mix(c / 12.92, pow((max(c, 0.0) + 0.055) / 1.055, vec3(2.4)), step(0.04045, c));
}
void mainImage(const in vec4 inputColor, const in vec2 uv, out vec4 outputColor) {
  // Work on SCREEN brightness (as tuned in the prototype), then back to linear.
  vec3 c = toScreen(inputColor.rgb);
  vec3 over = max(c - uKnee, 0.0);
  vec3 soft = min(c, vec3(uKnee)) + (1.0 - uKnee) * (1.0 - exp(-over / (1.0 - uKnee)));
  outputColor = vec4(toLinear(mix(c, soft, uStrength)), inputColor.a);
}
`;

/**
 * A camera-like highlight roll-off: SCREEN brightness above `knee` fades softly
 * toward white instead of clipping to a hard edge (the composer renders in
 * half-float, so there's headroom above 1). Below the knee nothing changes. `strength` (0..1)
 * blends it in — the galaxy finale ramps it so earlier beats are untouched.
 */
export class SoftHighlightsEffect extends Effect {
  constructor({ knee = 0.65, strength = 0 }: { knee?: number; strength?: number } = {}) {
    super("SoftHighlightsEffect", FRAG, {
      blendFunction: BlendFunction.NORMAL,
      uniforms: new Map<string, Uniform>([
        ["uKnee", new Uniform(knee)],
        ["uStrength", new Uniform(strength)],
      ]),
    });
  }

  get strength(): number {
    return this.uniforms.get("uStrength")!.value;
  }

  set strength(value: number) {
    this.uniforms.get("uStrength")!.value = value;
  }

  get knee(): number {
    return this.uniforms.get("uKnee")!.value;
  }

  set knee(value: number) {
    this.uniforms.get("uKnee")!.value = value;
  }
}

/** R3F wrapper — place inside `<EffectComposer>` after `<Bloom>`. */
export const SoftHighlights = forwardRef<SoftHighlightsEffect, { knee?: number }>(
  function SoftHighlights({ knee = 0.65 }, ref) {
    const effect = useMemo(() => new SoftHighlightsEffect({ knee }), [knee]);
    useEffect(() => () => effect.dispose(), [effect]); // (a new knee makes a new effect)
    return <primitive ref={ref} object={effect} dispose={null} />;
  }
);
