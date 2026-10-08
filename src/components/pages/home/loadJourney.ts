import { loadOnce } from "#/components/hooks/loadOnce";
import { preloadScene } from "#/components/three.js/scene/preload";
import { isCalm } from "#/stores/useMotion";

/**
 * The journey's motion code (journeyMotion.ts), fetched once (P27-95): GSAP's scroll plugins
 * and what uses them. Static and light (no GSAP here), so the calm side can import it without
 * pulling the plugins in.
 */
export const loadJourneyMotion = loadOnce(() => import("#/components/pages/home/journeyMotion"));

// With motion on, the journey's code and the 3D are fetched as the page loads, alongside the
// page's own: the journey starts as soon as it is the mode on screen.
if (typeof window !== "undefined" && !isCalm()) {
  void loadJourneyMotion().catch(() => undefined);
  void preloadScene().catch(() => undefined);
}
