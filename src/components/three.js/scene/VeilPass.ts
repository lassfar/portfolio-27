import {
  HalfFloatType,
  ShaderMaterial,
  TextureDataType,
  Uniform,
  WebGLRenderer,
  WebGLRenderTarget,
} from "three";
import { KawaseBlurPass, KernelSize, Pass } from "postprocessing";

const VERT = /* glsl */ `
varying vec2 vUv;
void main(){ vUv = position.xy * 0.5 + 0.5; gl_Position = vec4(position.xy, 1.0, 1.0); }
`;

const FRAG = /* glsl */ `
uniform sampler2D inputBuffer;
uniform sampler2D blurBuffer;
uniform float uVeil;
uniform float uDim;
varying vec2 vUv;
void main(){
  vec4 sharp = texture2D(inputBuffer, vUv);
  vec4 c = uVeil > 0.0 ? mix(sharp, texture2D(blurBuffer, vUv), uVeil) : sharp;
  gl_FragColor = vec4(c.rgb * mix(1.0, uDim, uVeil), c.a);
}
`;

/**
 * Softens the whole rendered scene behind an overlay — blurred + dimmed by `veil`
 * (0 = untouched … 1 = fully veiled) — INSIDE WebGL, in the post-processing chain.
 *
 * (A CSS `filter: blur()` on the live WebGL canvas does the same job for The Maker,
 * but behind the contact form Chrome sometimes painted the filtered canvas fully
 * black; Opera didn't. Doing it here doesn't depend on the browser's compositor.)
 *
 * Kawase blur at half resolution, cross-faded in by `veil`; `dim` is a linear-light
 * brightness multiplier. With `veil` 0 it's a plain copy (the blur is skipped).
 */
export class VeilPass extends Pass {
  /** 0 = untouched … 1 = fully blurred + dimmed. */
  veil = 0;
  /** Linear brightness multiplier at full veil. */
  dim = 1;

  private readonly blurPass = new KawaseBlurPass({
    kernelSize: KernelSize.HUGE,
    resolutionScale: 0.5,
  });
  private readonly blurTarget = new WebGLRenderTarget(1, 1, {
    type: HalfFloatType,
    depthBuffer: false,
    stencilBuffer: false,
  });
  private readonly mixMaterial: ShaderMaterial;

  constructor() {
    super("VeilPass");
    this.mixMaterial = new ShaderMaterial({
      uniforms: {
        inputBuffer: new Uniform(null),
        blurBuffer: new Uniform(null),
        uVeil: new Uniform(0),
        uDim: new Uniform(1),
      },
      vertexShader: VERT,
      fragmentShader: FRAG,
      depthTest: false,
      depthWrite: false,
    });
    this.fullscreenMaterial = this.mixMaterial;
  }

  /** How far the blur spreads (1 = the kernel's default). */
  set spread(value: number) {
    this.blurPass.blurMaterial.scale = value;
  }

  override initialize(renderer: WebGLRenderer, alpha: boolean, frameBufferType: number) {
    this.blurPass.initialize(renderer, alpha, frameBufferType);
    if (frameBufferType !== undefined) this.blurTarget.texture.type = frameBufferType as TextureDataType;
  }

  override setSize(width: number, height: number) {
    this.blurPass.setSize(width, height);
    this.blurTarget.setSize(Math.max(1, Math.round(width / 2)), Math.max(1, Math.round(height / 2)));
  }

  override render(renderer: WebGLRenderer, inputBuffer: WebGLRenderTarget, outputBuffer: WebGLRenderTarget) {
    const u = this.mixMaterial.uniforms;
    const veil = this.veil > 0.001 ? this.veil : 0;
    u.inputBuffer.value = inputBuffer.texture;
    u.uVeil.value = veil;
    u.uDim.value = this.dim;
    if (veil > 0) {
      this.blurPass.render(renderer, inputBuffer, this.blurTarget);
      u.blurBuffer.value = this.blurTarget.texture;
    }
    renderer.setRenderTarget(this.renderToScreen ? null : outputBuffer);
    renderer.render(this.scene, this.camera);
  }

  override dispose() {
    this.blurPass.dispose();
    this.blurTarget.dispose();
    this.mixMaterial.dispose();
    super.dispose();
  }
}
