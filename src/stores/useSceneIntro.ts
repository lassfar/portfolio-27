import { create } from "zustand";

/**
 * Progress (0→1) of the one-time intro scene spin. Driven by the Hero's text
 * intro GSAP timeline (so the spin finishes exactly when the text does) and
 * read by the star's `Universe` in useFrame to rotate the whole cosmos.
 */
type SceneIntroState = {
  progress: number;
  setProgress: (progress: number) => void;
};

export const useSceneIntro = create<SceneIntroState>((set) => ({
  progress: 0,
  setProgress: (progress) => set({ progress }),
}));
