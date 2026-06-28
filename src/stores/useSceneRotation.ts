import { create } from "zustand";

/**
 * The current (damped) drag-rotation of the shared cosmic scene. The star's
 * `Universe` owns the pointer drag and publishes its rotation here each frame;
 * the Saturn `Planet` mirrors it (when non-interactive) so the starfield, star
 * and planet all turn together as one scene.
 *
 * Read with getState() inside useFrame — never subscribed, so writing every
 * frame triggers no React re-render.
 */
type SceneRotationState = {
  x: number;
  y: number;
  setRotation: (x: number, y: number) => void;
};

export const useSceneRotation = create<SceneRotationState>((set) => ({
  x: 0,
  y: 0,
  setRotation: (x, y) => set({ x, y }),
}));
