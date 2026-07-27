import { create } from "zustand";

/**
 * The Earth's current world position, published each frame by its orbiting rig
 * (EarthMember) and read by the CameraRig so the camera can FLY TO the Earth and
 * track it — the Earth stays a normal member orbiting the sun on its own place;
 * only the camera moves. Read with getState() inside useFrame — never subscribed.
 */
type EarthAnchorState = {
  x: number;
  y: number;
  z: number;
  set: (x: number, y: number, z: number) => void;
};

export const useEarthAnchor = create<EarthAnchorState>((set) => ({
  x: 0,
  y: 0,
  z: 0,
  set: (x, y, z) => set({ x, y, z }),
}));
