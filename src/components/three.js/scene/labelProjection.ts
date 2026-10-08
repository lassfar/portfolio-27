import type { Camera, Object3D, Vector3 } from "three";

/**
 * useFrame priority for projecting the DOM labels that sit on 3D objects (the Earth's
 * pins, the Voyager's record): after the CameraRig (0) and the galaxy layer (0.5) have
 * placed everything for this frame, just before the composer draws it (1). The label
 * is then written in the same step, so it lands exactly where its object is drawn in
 * the same frame — no trailing behind a moving camera.
 */
export const LABEL_PRIORITY = 0.9;

let rect: DOMRect | null = null;
let rectCanvas: HTMLCanvasElement | null = null;
let rectFrame = NaN;

/**
 * The canvas's rect, read once per frame (P27-78): every label projected in the same
 * frame shares it. (`document.timeline.currentTime` is the frame's timestamp, the same
 * for every callback in it.)
 */
function canvasRect(canvas: HTMLCanvasElement): DOMRect {
  const frame = Number(document.timeline.currentTime);
  if (!rect || rectCanvas !== canvas || rectFrame !== frame) {
    rect = canvas.getBoundingClientRect();
    rectCanvas = canvas;
    rectFrame = frame;
  }
  return rect;
}

/**
 * Forgets the canvas (P27-95): on unmount, so a canvas the mode switch removed (and the whole
 * journey it hung in) isn't kept in memory.
 */
export function releaseCanvasRect(): void {
  rect = null;
  rectCanvas = null;
}

/**
 * Project a world-space point to viewport CSS px — where a `position: fixed` label
 * should go — measured on the canvas itself (so it holds wherever the canvas sits and
 * whatever the mobile address bar does). `out` receives x, y and the projected depth z
 * (`point` may be `out`). Returns false when the point is behind the camera.
 */
export function projectPointToViewport(
  point: Vector3,
  camera: Camera,
  canvas: HTMLCanvasElement,
  out: Vector3,
): boolean {
  camera.updateMatrixWorld(); // the camera moved this frame; its matrices catch up at render
  out.copy(point).project(camera);
  const r = canvasRect(canvas);
  const z = out.z;
  out.set(r.left + (out.x * 0.5 + 0.5) * r.width, r.top + (-out.y * 0.5 + 0.5) * r.height, z);
  return z < 1;
}

/** The same for an object's world position. */
export function projectToViewport(
  object: Object3D,
  camera: Camera,
  canvas: HTMLCanvasElement,
  out: Vector3,
): boolean {
  return projectPointToViewport(object.getWorldPosition(out), camera, canvas, out);
}
