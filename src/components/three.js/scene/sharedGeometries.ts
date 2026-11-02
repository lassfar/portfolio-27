import { Pass } from "postprocessing";
import { type BufferGeometry, Sprite } from "three";

/** postprocessing's shared triangle (a static getter its types leave out). */
const fullscreenGeometry = () =>
  (Pass as unknown as { fullscreenGeometry: BufferGeometry }).fullscreenGeometry;

/**
 * Lets the canvas's renderer go once it unmounts (P27-104). Some geometries are made once for
 * the page and shared: the one three's sprites draw (the Sun's halo, the Parker marker), and
 * postprocessing's full-screen triangle (its composer would dispose it, but
 * @react-three/postprocessing never disposes the composer). Each renderer that draws them listens
 * for their dispose, and that listener kept the old renderer, its WebGL context and the journey's
 * whole tree after each mode switch. Disposing them drops the listeners; the next canvas uploads
 * them again.
 */
export function releaseSharedGeometries(): void {
  const sprite = new Sprite();
  sprite.geometry.dispose();
  sprite.material.dispose();
  fullscreenGeometry().dispose();
}
