import gsap from "gsap";
import { useEffect, useLayoutEffect, useMemo, useRef, useState, type RefObject } from "react";
import { useJourneyScroll } from "#/stores/useJourneyScroll";
import { PHASE_NAV } from "./config";
import { liftStep, type LiftEvent, type LiftPhase } from "./lift";
import type { ContextSafe, RevealActions } from "./useReveal";

/**
 * The story counts as settled once its scroll progress has held still this long (ms): a glide's
 * tween ends before the smooth scroll has eased in (ScrollSmoother keeps moving ~1s after).
 */
const SETTLE_MS = 200;

export interface GlideHideOptions {
  /** The assistant's root (to know whether it had the focus). */
  root: RefObject<HTMLDivElement | null>;
  /** What moves: the dot (and the button around it). */
  lift: RefObject<HTMLDivElement | null>;
  /** Where the focus goes back to after a glide. */
  orb: RefObject<HTMLButtonElement | null>;
  gliding: boolean;
  /** Whether the assistant should show at all (isAssistantVisible). */
  visible: boolean;
  reveal: RevealActions;
}

export interface GlideHide {
  phase: LiftPhase;
  /** Tell it the button is back in its dot (useReveal's `onFolded`). */
  folded(): void;
}

/**
 * Out of the way while the story glides (P27-85): an open button folds back into its dot,
 * then the dot shrinks to PHASE_NAV.hideScale and drops below the screen's edge; once the glide
 * is over (done, or the visitor took the scroll back) and the story has settled, the same motion
 * plays back and the dot rises, breathing again. One paused GSAP timeline, played and reversed
 * as `liftStep` decides.
 */
export function useGlideHide(
  { root, lift, orb, gliding, visible, reveal }: GlideHideOptions,
  contextSafe: ContextSafe,
): GlideHide {
  const [phase, setPhase] = useState<LiftPhase>("shown");
  const current = useRef<LiftPhase>("shown");
  const timeline = useRef<gsap.core.Timeline | null>(null);
  const hadFocus = useRef(false); // the focus was in the assistant as it went: it comes back to the dot
  const live = useRef({ gliding, visible });
  live.current = { gliding, visible };

  // The GSAP context reverts the timeline on unmount (and StrictMode's rehearsal): rebuild it then.
  useEffect(
    () => () => {
      timeline.current = null;
    },
    [],
  );

  const dispatch = useMemo(() => {
    const build = contextSafe((el: HTMLElement) =>
      gsap
        .timeline({
          paused: true,
          onComplete: () => dispatch("hideDone"),
          onReverseComplete: () => dispatch("returnDone"),
        })
        // A 1s timeline, sped to PHASE_NAV.hideSeconds; its values read live (the dev panel).
        .to(
          el,
          {
            scale: () => PHASE_NAV.hideScale,
            y: () => PHASE_NAV.hideDrop,
            duration: 1,
            ease: "power2.in",
          },
          0,
        )
        // It fades only at the end, so most of the shrink and drop is seen.
        .to(el, { autoAlpha: 0, duration: 0.4, ease: "power1.in" }, 0.6),
    );

    const dispatch = (event: LiftEvent) => {
      const el = lift.current;
      if (!el) return;
      const tl = (timeline.current ??= build(el));
      const next = liftStep(current.current, event, {
        ...live.current,
        revealIdle: reveal.isIdle(),
      });
      if (event === "glideStart" && next.phase !== current.current) {
        hadFocus.current = root.current?.contains(document.activeElement) ?? false;
      }
      current.current = next.phase;
      if (next.resetReveal) reveal.reset();
      // Its speed is set only as it starts moving: in GSAP, playing backwards IS a negative time
      // scale, so setting it on a timeline just reversed would send it forward again (a hide).
      const speed = 1 / PHASE_NAV.hideSeconds;
      switch (next.motion) {
        case "fold":
          reveal.fold();
          break;
        case "play":
          if (tl.progress() === 0) tl.invalidate();
          tl.timeScale(speed).play();
          break;
        case "reverse":
          tl.timeScale(speed).reverse();
          break;
        case "snapHidden":
          tl.invalidate().progress(1, true).pause();
          break;
        case "snapShown":
          tl.pause().progress(0, true);
          hadFocus.current = false;
          break;
      }
      if (event === "returnDone" && next.phase === "shown" && hadFocus.current) {
        hadFocus.current = false;
        if (!document.activeElement || document.activeElement === document.body)
          orb.current?.focus({ preventScroll: true });
      }
      setPhase(next.phase);
    };
    return dispatch;
  }, [contextSafe, lift, orb, reveal, root]);

  // A glide starting hides it at once; it comes back once the glide is over and the story has
  // settled (no scroll progress for SETTLE_MS), not while the smooth scroll still eases in.
  useLayoutEffect(() => {
    if (gliding) {
      dispatch("glideStart");
      return;
    }
    let timer = 0;
    const settle = () => {
      window.clearTimeout(timer);
      timer = window.setTimeout(() => {
        unsubscribe();
        dispatch("glideEnd");
      }, SETTLE_MS);
    };
    const unsubscribe = useJourneyScroll.subscribe(settle);
    settle();
    return () => {
      window.clearTimeout(timer);
      unsubscribe();
    };
  }, [dispatch, gliding]);

  const folded = useMemo(() => () => dispatch("foldDone"), [dispatch]);
  return { phase, folded };
}
