import { BlendFunction, Effect, KawaseBlurPass, KernelSize } from "postprocessing";
import {
  HalfFloatType,
  TextureDataType,
  Uniform,
  WebGLRenderer,
  WebGLRenderTarget,
} from "three";
import type { BlurQuality } from "./performance";

const FRAG = /* glsl */ `
uniform sampler2D blurBuffer;
uniform float uVeil;
uniform float uDim;
void mainImage(const in vec4 inputColor, const in vec2 uv, out vec4 outputColor) {
  vec4 c = uVeil > 0.0 ? mix(inputColor, texture2D(blurBuffer, uv), uVeil) : inputColor;
  outputColor = vec4(c.rgb * uDim, c.a);
}
`;

type Blur = {
  pass: KawaseBlurPass;
  target: WebGLRenderTarget;
  resolutionScale: number;
  /** Device px the blur reaches per unit of scale (≈ √Σ(k+½)² over its kernel). */
  reach: number;
};

function makeBlur(kernelSize: KernelSize, resolutionScale: number): Blur {
  const pass = new KawaseBlurPass({ kernelSize, resolutionScale });
  // (kernelSequence exists at runtime but is missing from postprocessing's types.)
  const material = pass.blurMaterial as unknown as { kernelSequence: ArrayLike<number> };
  const kernel = Array.from(material.kernelSequence);
  return {
    pass,
    target: new WebGLRenderTarget(1, 1, {
      type: HalfFloatType,
      depthBuffer: false,
      stencilBuffer: false,
    }),
    resolutionScale,
    reach: Math.sqrt(kernel.reduce((sum, k) => sum + (k + 0.5) ** 2, 0)),
  };
}

/**
 * Softens the whole rendered scene behind an overlay — blurred + dimmed — INSIDE WebGL,
 * as an effect of the composer's final pass.
 *
 * (A CSS `filter: blur()` on the live WebGL canvas costs a full-screen blur in the
 * browser's compositor every frame, and behind the contact form Chrome sometimes
 * painted the filtered canvas fully black; Opera didn't. Doing it here depends on
 * neither.)
 *
 * It merges into the same pass as the bloom (P27-78): no full-screen pass or scene-sized
 * buffer of its own, only a small blur target. Two qualities (`PERFORMANCE.blurQuality`):
 * "heavy", the original Kawase blur (10 steps at ½ resolution), and "light" (7 steps at
 * ¼ resolution, ~6× cheaper), which spreads further per step to reach as far.
 * With `veil` 0 the blur is skipped.
 */
export class VeilEffect extends Effect {
  /** 0 = untouched … 1 = fully blurred. */
  veil = 0;
  /** Linear brightness multiplier (1 = untouched). */
  dim = 1;
  /** How far the blur reaches, in drawing-buffer px (about a Gaussian's σ). */
  radius = 0;
  quality: BlurQuality = "light";

  private readonly blurs: Record<BlurQuality, Blur> = {
    heavy: makeBlur(KernelSize.HUGE, 0.5),
    light: makeBlur(KernelSize.VERY_LARGE, 0.25),
  };

  constructor() {
    super("VeilEffect", FRAG, {
      blendFunction: BlendFunction.SRC,
      uniforms: new Map<string, Uniform>([
        ["blurBuffer", new Uniform(null)],
        ["uVeil", new Uniform(0)],
        ["uDim", new Uniform(1)],
      ]),
    });
  }

  /** The reach in the original's units: 1 = the heavy kernel's default spread. */
  set spread(value: number) {
    this.radius = value * this.blurs.heavy.reach;
  }

  override update(renderer: WebGLRenderer, inputBuffer: WebGLRenderTarget) {
    const veil = this.veil > 0.001 ? this.veil : 0;
    this.uniforms.get("uVeil")!.value = veil;
    this.uniforms.get("uDim")!.value = this.dim;
    if (veil === 0) return;
    const blur = this.blurs[this.quality];
    blur.pass.blurMaterial.scale = this.radius / blur.reach;
    blur.pass.render(renderer, inputBuffer, blur.target);
    this.uniforms.get("blurBuffer")!.value = blur.target.texture;
  }

  override initialize(renderer: WebGLRenderer, alpha: boolean, frameBufferType: number) {
    for (const blur of Object.values(this.blurs)) {
      blur.pass.initialize(renderer, alpha, frameBufferType);
      if (frameBufferType !== undefined) {
        blur.target.texture.type = frameBufferType as TextureDataType;
      }
    }
  }

  override setSize(width: number, height: number) {
    for (const blur of Object.values(this.blurs)) {
      blur.pass.setSize(width, height);
      blur.target.setSize(
        Math.max(1, Math.round(width * blur.resolutionScale)),
        Math.max(1, Math.round(height * blur.resolutionScale)),
      );
    }
  }

  override dispose() {
    for (const blur of Object.values(this.blurs)) {
      blur.pass.dispose();
      blur.target.dispose();
    }
    super.dispose();
  }
}
