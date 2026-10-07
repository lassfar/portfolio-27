/*
 * The navigation assistant around a glide of the scroll (P27-85): out of the way while the
 * story glides (folded back into its dot, then shrunk and dropped below the screen), back as
 * the orb once the story has settled. Pure: the hook (useGlideHide) runs what `liftStep` decides.
 */

/** Shown (as usual), folding its button back into the dot, on its way down, out of sight, or on its way back up. */
export type LiftPhase = "shown" | "folding" | "hiding" | "hidden" | "returning";

export type LiftEvent =
  | "glideStart" // a glide of the scroll began
  | "glideEnd" // it's over and the story has settled (done, or the visitor took the scroll back)
  | "foldDone" // the button is back in its dot
  | "hideDone" // the dot is out of sight
  | "returnDone"; // the dot is back

/** What to animate: fold the button into its dot, play the hide, play it back, jump to an end, or nothing. */
export type LiftMotion = "fold" | "play" | "reverse" | "snapHidden" | "snapShown" | "none";

export interface LiftContext {
  /** Whether the assistant should show at all (isAssistantVisible). */
  visible: boolean;
  /** Only the dot is out (no button growing, open or folding). */
  revealIdle: boolean;
  /** A glide is still running. */
  gliding: boolean;
}

export interface LiftStep {
  phase: LiftPhase;
  motion: LiftMotion;
  /** Set the button back into its dot at once (it's out of sight). */
  resetReveal: boolean;
}

/** The assistant shows past the hero's first screen, while there's a next chapter and no panel is open. */
export function isAssistantVisible({
  past,
  hasStop,
  panelOpen,
}: {
  past: boolean;
  hasStop: boolean;
  panelOpen: boolean;
}) {
  return past && hasStop && !panelOpen;
}

const step = (phase: LiftPhase, motion: LiftMotion = "none", resetReveal = false): LiftStep => ({
  phase,
  motion,
  resetReveal,
});

/**
 * The next phase and what to animate, for an event. On any glide, an open button first folds
 * back into its dot, then the dot shrinks and drops; once the glide is over and the story has
 * settled, the dot rises again. Where the assistant shouldn't show, it's put back at once (its
 * root stays hidden by CSS).
 */
export function liftStep(
  phase: LiftPhase,
  event: LiftEvent,
  { visible, revealIdle, gliding }: LiftContext,
): LiftStep {
  switch (event) {
    case "glideStart":
      if (phase === "shown") {
        if (!visible) return step("hidden", "snapHidden", !revealIdle);
        return revealIdle ? step("hiding", "play") : step("folding", "fold");
      }
      if (phase === "returning") return step("hiding", "play");
      return step(phase); // already folding, going or gone
    case "glideEnd":
      if (phase === "folding" || phase === "shown") return step(phase); // a fold finishes on its own (foldDone)
      if (!visible) return step("shown", "snapShown");
      return phase === "hidden" || phase === "hiding" ? step("returning", "reverse") : step(phase);
    case "foldDone":
      if (phase !== "folding") return step(phase);
      if (!gliding) return step("shown"); // the glide was already over: the dot just stays
      return visible ? step("hiding", "play") : step("hidden", "snapHidden");
    case "hideDone":
      return phase === "hiding" ? step("hidden") : step(phase);
    case "returnDone":
      return phase === "returning" ? step("shown") : step(phase);
  }
}
