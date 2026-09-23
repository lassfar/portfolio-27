import {
  HalfFloatType,
  Mesh,
  OrthographicCamera,
  PlaneGeometry,
  Scene,
  ShaderMaterial,
  Texture,
  WebGLRenderer,
  WebGLRenderTarget,
} from "three";
import { MipmapBlurPass } from "postprocessing";

const BRIGHT_VERT = /* glsl */ `
varying vec2 vUv;
void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }
`;

// Keep only the bright parts (like the prototype's UnrealBloom high-pass).
const BRIGHT_FRAG = /* glsl */ `
precision highp float;
uniform sampler2D tInput;
uniform float uThreshold;
varying vec2 vUv;
void main(){
  vec3 c = texture2D(tInput, vUv).rgb;
  float l = dot(c, vec3(0.299, 0.587, 0.114));
  gl_FragColor = vec4(c * smoothstep(uThreshold, uThreshold + 0.01, l), 1.0);
}
`;

/**
 * The galaxy's OWN bloom, done in screen (sRGB) values on the galaxy layer only —
 * like the prototype, whose bloom only ever saw the galaxy. (The site-wide bloom
 * works in linear light: at the same settings it spreads a wide grey veil over the
 * arms and blows the real Sun into an orange blob.)
 *
 * Bright-pass at half resolution → postprocessing's `MipmapBlurPass` (the blur the
 * site's `<Bloom>` uses). The result (`texture`) is added in `COMPOSITE_FRAG`.
 */
export class GalaxyBloom {
  private readonly bright = new WebGLRenderTarget(1, 1, {
    type: HalfFloatType,
    depthBuffer: false,
    stencilBuffer: false,
  });
  private readonly blur = new MipmapBlurPass();
  private readonly scene = new Scene();
  private readonly camera = new OrthographicCamera(-1, 1, 1, -1, 0, 1);
  private readonly material: ShaderMaterial;
  private readonly quad: Mesh;

  constructor(renderer: WebGLRenderer, { threshold, radius }: { threshold: number; radius: number }) {
    this.material = new ShaderMaterial({
      depthTest: false,
      depthWrite: false,
      uniforms: { tInput: { value: null }, uThreshold: { value: threshold } },
      vertexShader: BRIGHT_VERT,
      fragmentShader: BRIGHT_FRAG,
    });
    this.quad = new Mesh(new PlaneGeometry(2, 2), this.material);
    this.quad.frustumCulled = false;
    this.scene.add(this.quad);
    this.blur.levels = 8;
    this.blur.radius = radius;
    this.blur.initialize(renderer, true, HalfFloatType);
  }

  /** The blurred bright parts (half resolution). */
  get texture(): Texture {
    return this.blur.texture;
  }

  /** Screen brightness above which the galaxy blooms (live-tunable). */
  set threshold(value: number) {
    this.material.uniforms.uThreshold.value = value;
  }

  /** How far the bloom spreads, 0..1 (live-tunable). */
  set radius(value: number) {
    this.blur.radius = value;
  }

  /** Bloom the galaxy layer. Leaves the renderer's target changed — the caller restores it. */
  render(renderer: WebGLRenderer, input: WebGLRenderTarget) {
    const w = Math.max(1, Math.round(input.width / 2));
    const h = Math.max(1, Math.round(input.height / 2));
    if (this.bright.width !== w || this.bright.height !== h) {
      this.bright.setSize(w, h);
      this.blur.setSize(w, h);
    }
    this.material.uniforms.tInput.value = input.texture;
    renderer.setRenderTarget(this.bright);
    renderer.render(this.scene, this.camera);
    this.blur.render(renderer, this.bright, null);
  }

  dispose() {
    this.bright.dispose();
    this.blur.dispose();
    this.material.dispose();
    this.quad.geometry.dispose();
  }
}
