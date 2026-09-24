/**
 * How much the cosmos is veiled (blurred + dimmed) behind the Contact form, 0..1 —
 * written by the journey (`useCosmicJourney`, which drives the form's reveal) and read
 * each frame by the scene's `VeilPass`. A plain object: written every scroll update,
 * never subscribed, so it triggers no React re-render.
 */
export const cosmicVeil = { contact: 0 };
