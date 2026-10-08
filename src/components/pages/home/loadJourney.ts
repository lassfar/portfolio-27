import { loadOnce } from "#/components/hooks/loadOnce";

/**
 * The journey's motion code (journeyMotion.ts), fetched once (P27-95): GSAP's scroll plugins
 * and what uses them. Static and light (no GSAP here), so the calm side can import it without
 * pulling the plugins in.
 */
export const loadJourneyMotion = loadOnce(() => import("#/components/pages/home/journeyMotion"));
