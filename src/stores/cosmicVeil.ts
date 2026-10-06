/**
 * How much the cosmos is veiled (blurred + dimmed) behind the overlays, 0..1 each —
 * `about` behind the About text, `contact` behind the Contact form (written by the
 * journey, `useCosmicJourney`, which drives both reveals), and `panel` behind the
 * panel's full view (its target, 0 or 1, written by ScenePanel; the scene eases toward
 * it). Read each frame by the scene's `VeilEffect` (BloomController). A plain object:
 * never subscribed, so it triggers no React re-render.
 */
export const cosmicVeil = { about: 0, contact: 0, panel: 0 };
