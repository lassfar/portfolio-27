import { clamp01, easeOutCubic, remap01 } from "#/components/three.js/star/utils";
import { useGalaxyScroll } from "#/stores/useGalaxyScroll";
import { SOLAR } from "./config";

/**
 * How much the solar system is being RE-REVEALED for the galaxy finale (0..1).
 *
 * The system fades out for the Earth dive (each body multiplies its reveal by
 * `1 - earthFade`). For the finale, the camera pulls back from the Voyager and the
 * whole real system must return — so each body instead uses
 * `1 - suppress · (1 - finaleReturn())`, which is unchanged when finaleReturn is 0
 * (normal voyage/Earth-dive behaviour) and restores full opacity as it reaches 1.
 * Read inside useFrame; never subscribed.
 */
export function finaleReturn(): number {
  const galaxy = clamp01(useGalaxyScroll.getState().progress);
  return easeOutCubic(
    remap01(galaxy, SOLAR.finaleReturn[0], SOLAR.finaleReturn[1])
  );
}

/**
 * 1 while the planets + orbit lines are readable in the finale, fading to 0 once the
 * camera is far out and they're only a few pixels wide (their dark shaded dots would
 * otherwise smudge the galaxy). The Sun doesn't use this — it stays as the speck.
 */
export function finaleFarFade(): number {
  const galaxy = clamp01(useGalaxyScroll.getState().progress);
  return 1 - remap01(galaxy, SOLAR.finaleFarFade[0], SOLAR.finaleFarFade[1]);
}
