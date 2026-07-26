import { create } from "zustand";

/**
 * The Saturn's current world position, published each frame by its rig and read
 * by the CameraRig so the camera can LOCK ONTO the Saturn (during the intro) and
 * fly OUT from it. The Saturn orbits on its own (time-based); scrolling only
 * moves the camera. Read with getState() inside useFrame — never subscribed.
 */
type SaturnAnchorState = {
  x: number;
  y: number;
  z: number;
  set: (x: number, y: number, z: number) => void;
};

export const useSaturnAnchor = create<SaturnAnchorState>((set) => ({
  x: 0,
  y: 0,
  z: 0,
  set: (x, y, z) => set({ x, y, z }),
}));
