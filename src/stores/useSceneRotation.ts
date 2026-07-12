import { create } from "zustand";

/**
 * The current rotation of the shared cosmic scene, published by the star's
 * `Universe` each frame and mirrored by the Saturn `Planet` so the starfield,
 * star and planet all turn together as ONE scene.
 *
 * `yaw` is already fully resolved by `Universe` (drag + idle drift + intro +
 * scroll, plus the assemble-into-pose settle), so Saturn simply mirrors it and
 * stays perfectly in sync with the 3D space.
 *
 * Read with getState() inside useFrame — never subscribed, so writing every
 * frame triggers no React re-render.
 */
type SceneRotationState = {
  pitch: number;
  yaw: number;
  setRotation: (pitch: number, yaw: number) => void;
};

export const useSceneRotation = create<SceneRotationState>((set) => ({
  pitch: 0,
  yaw: 0,
  setRotation: (pitch, yaw) => set({ pitch, yaw }),
}));
