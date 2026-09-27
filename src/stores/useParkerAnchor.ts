import { create } from "zustand";

/**
 * The Parker Solar Probe's current world position — on its real orbit, turned with the
 * solar system and flying with it in the finale — published each frame by its rig
 * (ParkerMember) and read by the CameraRig (to fly to it) and the probe (to draw it).
 * Read with getState() inside useFrame — never subscribed.
 */
type ParkerAnchorState = {
  x: number;
  y: number;
  z: number;
  set: (x: number, y: number, z: number) => void;
};

export const useParkerAnchor = create<ParkerAnchorState>((set) => ({
  x: 0,
  y: 0,
  z: 0,
  set: (x, y, z) => set({ x, y, z }),
}));
