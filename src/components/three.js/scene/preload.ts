import { loadOnce } from "#/components/hooks/loadOnce";

/**
 * The 3D scene's code (P27-94), from one import site (P27-95): the canvas (Hero's
 * `next/dynamic`) and its preloads share it, so the build makes one chunk. Fetched as the page
 * loads with motion on, and in the calm mode before a switch to motion mounts it, or as the
 * pointer or the focus lingers on the switch.
 */
export const loadScene = loadOnce(() => import("#/components/three.js/scene/CosmicScene"));

/** Fetches the 3D scene's code, if it hasn't been yet. */
export const preloadScene = (): Promise<unknown> => loadScene();
