/**
 * How much the cosmos is veiled (blurred + dimmed) behind the overlays, 0..1 each —
 * `about` behind the About text, `contact` behind the Contact form. Written by the
 * journey (`useCosmicJourney`, which drives both reveals) and read each frame by the
 * scene's `VeilEffect`. A plain object: written every scroll update, never subscribed,
 * so it triggers no React re-render.
 */
export const cosmicVeil = { about: 0, contact: 0 };
