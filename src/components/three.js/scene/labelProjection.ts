import type { Camera, Object3D, Vector3 } from "three";

/**
 * useFrame priority for projecting the DOM labels that sit on 3D objects (the Earth's
 * pins, the Voyager's record): after the CameraRig (0) and the galaxy layer (0.5) have
 * placed everything for this frame, just before the composer draws it (1). The label
 * is then written in the same step, so it lands exactly where its object is drawn in
 * the same frame — no trailing behind a moving camera.
 */
export const LABEL_PRIORITY = 0.9;

/**
 * Project `object`'s world position to viewport CSS px — where a `position: fixed`
 * label should go — measured on the canvas itself (so it holds wherever the canvas
 * sits and whatever the mobile address bar does). `out` receives x, y and the
 * projected depth z. Returns false when the point is behind the camera.
 */
export function projectToViewport(
  object: Object3D,
  camera: Camera,
  canvas: HTMLCanvasElement,
  out: Vector3
): boolean {
  camera.updateMatrixWorld(); // the camera moved this frame; its matrices catch up at render
  object.getWorldPosition(out).project(camera);
  const r = canvas.getBoundingClientRect();
  const z = out.z;
  out.set(r.left + (out.x * 0.5 + 0.5) * r.width, r.top + (-out.y * 0.5 + 0.5) * r.height, z);
  return z < 1;
}
