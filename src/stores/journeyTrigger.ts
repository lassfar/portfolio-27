import type { ScrollTrigger } from "gsap/all";

/**
 * The one pinned journey ScrollTrigger (set by `useCosmicJourney`), so dev tools —
 * the galaxy tuning panel's "jump to" buttons — can scroll straight to a beat.
 */
export const journeyTrigger: { current: ScrollTrigger | null } = { current: null };
