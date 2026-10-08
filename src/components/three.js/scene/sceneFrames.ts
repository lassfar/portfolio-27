/**
 * Frames the 3D scene has run (P27-94), drawn or skipped while covered (RenderPause): the
 * mode switch waits for a couple after landing, so the scene is in place, its shaders built,
 * before the transition screen fades. A plain counter, like the scene's other shared records.
 */
export const sceneFrames = { count: 0 };
