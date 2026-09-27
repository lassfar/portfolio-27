import { clamp01, easeOutCubic, remap01 } from "#/components/three.js/star/utils";
import { useGalaxyScroll } from "#/stores/useGalaxyScroll";
import { useLabScroll } from "#/stores/useLabScroll";
import { useVoyageScroll } from "#/stores/useVoyageScroll";
import { PARKER_CAM, PARKER_FOCUS } from "#/components/three.js/parker/config";
import { SOLAR, VOYAGE } from "./config";

/**
 * How much the solar system is being RE-REVEALED for the galaxy finale (0..1).
 *
 * The system fades out for the Earth dive (each body multiplies its reveal by
 * `1 - earthFade`). For the finale, the camera pulls back from the Parker probe and the
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
 * How far the Lab has focused on the Parker Solar Probe (0..1): as the zoom into it
 * enters the empty stretch, the solar system fades so the probe stands alone (like the
 * Earth's full view). What fades is toggled in PARKER_FOCUS (the dev panel).
 */
export function labFocus(): number {
  const lab = clamp01(useLabScroll.getState().progress);
  const t = remap01(lab, PARKER_CAM.focus[0], PARKER_CAM.focus[1]);
  return t * t * (3 - 2 * t);
}

/**
 * How much the solar system is back after the Earth dive (0..1): as you leave the Earth
 * for the Parker Solar Probe (the Lab's overview) — faded again as the Lab focuses on the
 * probe (PARKER_FOCUS.fadeSystem) — and in the finale. Each body uses
 * `1 - suppress · (1 - systemReturn())`.
 */
export function systemReturn(): number {
  const lab = clamp01(useLabScroll.getState().progress);
  const labReturn = easeOutCubic(remap01(lab, SOLAR.labReturn[0], SOLAR.labReturn[1]));
  const focus = PARKER_FOCUS.fadeSystem ? labFocus() : 0;
  return Math.max(labReturn * (1 - focus), finaleReturn());
}

/** The same for the Sun, with its own toggle (PARKER_FOCUS.fadeSun). */
export function sunReturn(): number {
  const lab = clamp01(useLabScroll.getState().progress);
  const labReturn = easeOutCubic(remap01(lab, SOLAR.labReturn[0], SOLAR.labReturn[1]));
  const focus = PARKER_FOCUS.fadeSun ? labFocus() : 0;
  return Math.max(labReturn * (1 - focus), finaleReturn());
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

/**
 * The sibling planets' (and their moons', the asteroid belt's, the orbit lines')
 * visibility: fading in with the system, out for the Earth dive, back in as you leave
 * for the Parker Solar Probe and for the finale, and gone once the system is a speck.
 * Read inside useFrame.
 */
export function siblingReveal(): number {
  const voyage = useVoyageScroll.getState().progress;
  const earthFade = remap01(voyage, VOYAGE.earthFadeStart, VOYAGE.earthFadeEnd);
  return (
    easeOutCubic(remap01(voyage, SOLAR.revealStart, SOLAR.revealEnd)) *
    (1 - earthFade * (1 - systemReturn())) *
    finaleFarFade()
  );
}

/**
 * The Earth's (and the Moon's) visibility: in with the system and staying through the
 * dive (it's the destination) and after (you leave it for the Parker Solar Probe — it
 * stays a planet in the view) until the Lab focuses on the probe (with the rest of the
 * system — PARKER_FOCUS.fadeSystem), back for the finale, gone once the system is a
 * speck. Read inside useFrame.
 */
export function earthReveal(): number {
  const voyage = clamp01(useVoyageScroll.getState().progress);
  const focus = PARKER_FOCUS.fadeSystem ? labFocus() : 0;
  return (
    easeOutCubic(remap01(voyage, SOLAR.revealStart, SOLAR.revealEnd)) *
    (1 - focus * (1 - finaleReturn())) *
    finaleFarFade()
  );
}
