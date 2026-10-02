import { WebGLRenderTarget, type BufferGeometry, type Camera, type Mesh, type Object3D, type Scene, type WebGLRenderer } from "three";

/**
 * Background shader compiles (P27-78). A shader compiled on the frame it first draws
 * stalls that frame: on Windows (ANGLE → Direct3D) often by 100+ ms, as a chapter
 * starts. `precompile` asks the driver to compile ahead, in parallel
 * (KHR_parallel_shader_compile), while nothing needs it yet. `compile` includes hidden
 * objects, so the Lab's probe or the orbit lines are ready before they ever show.
 */

let targetOf: () => WebGLRenderTarget | null = () => null;

/**
 * The render target the scene draws into (the composer's scene buffer). A shader's
 * variant depends on the bound target (its output colour space), so compiling for the
 * screen would build the wrong one.
 */
export function setWarmUpTarget(read: () => WebGLRenderTarget | null): void {
  targetOf = read;
}

/** Compile `object`'s shaders in the background; resolves when they're ready. */
export function precompile(
  gl: WebGLRenderer,
  object: Object3D,
  camera: Camera,
  scene: Scene | null = null,
): Promise<void> {
  const previous = gl.getRenderTarget();
  gl.setRenderTarget(targetOf());
  const ready = gl.compileAsync(object, camera, scene);
  gl.setRenderTarget(previous);
  // A failure only means it compiles on first draw, as before.
  return ready.then(
    () => undefined,
    () => undefined,
  );
}

let uploadTarget: WebGLRenderTarget | null = null;

/**
 * Upload `object`'s buffers to the GPU now: draw it once, offscreen, with zero points —
 * shown and unculled for that one draw. An object that stays hidden until later (the
 * Earth, the galaxy) would otherwise upload them on the frame it first shows.
 */
export function preupload(gl: WebGLRenderer, object: Object3D, camera: Camera): void {
  const restore: (() => void)[] = [];
  object.traverse((o) => {
    const { visible, frustumCulled } = o;
    o.visible = true;
    o.frustumCulled = false;
    restore.push(() => {
      o.visible = visible;
      o.frustumCulled = frustumCulled;
    });
    const geometry: BufferGeometry | undefined = (o as Mesh).geometry;
    if (geometry?.isBufferGeometry) {
      const count = geometry.drawRange.count;
      geometry.drawRange.count = 0;
      restore.push(() => {
        geometry.drawRange.count = count;
      });
    }
  });
  uploadTarget ??= new WebGLRenderTarget(1, 1);
  const previous = gl.getRenderTarget();
  const autoClear = gl.autoClear;
  gl.setRenderTarget(uploadTarget);
  gl.autoClear = false;
  gl.render(object, camera);
  gl.setRenderTarget(previous);
  gl.autoClear = autoClear;
  restore.forEach((undo) => undo());
}

/** Run `fn` when the browser is idle (at the latest after `timeout` ms). Returns the cancel. */
export function whenIdle(fn: () => void, timeout: number): () => void {
  if (typeof window.requestIdleCallback === "function") {
    const id = window.requestIdleCallback(fn, { timeout });
    return () => window.cancelIdleCallback(id);
  }
  const id = window.setTimeout(fn, timeout);
  return () => window.clearTimeout(id);
}
