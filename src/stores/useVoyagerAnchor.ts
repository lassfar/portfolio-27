import { create } from "zustand";

/**
 * Voyager's current world position, published each frame by its rig
 * (VoyagerMember) and read by the CameraRig so the camera can FLY TO the craft
 * after pulling back from Earth. Read with getState() inside useFrame — never
 * subscribed.
 */
type VoyagerAnchorState = {
  x: number;
  y: number;
  z: number;
  set: (x: number, y: number, z: number) => void;
};

export const useVoyagerAnchor = create<VoyagerAnchorState>((set) => ({
  x: 0,
  y: 0,
  z: 0,
  set: (x, y, z) => set({ x, y, z }),
}));
