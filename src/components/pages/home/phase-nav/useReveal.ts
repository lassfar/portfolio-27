import gsap from "gsap";
import { SplitText } from "gsap/all";
import type { useGSAP } from "@gsap/react";
import { useEffect, useMemo, useRef, useState, type RefObject } from "react";
import { useTimeout } from "#/components/hooks/useTimeout";
import { PHASE_NAV, type AssistantVariant } from "./config";

gsap.registerPlugin(SplitText);

export type ContextSafe = ReturnType<typeof useGSAP>["contextSafe"];

export interface RevealRefs {
  orb: RefObject<HTMLButtonElement | null>;
  shell: RefObject<HTMLDivElement | null>;
  reveal: RefObject<HTMLDivElement | null>;
}

/**
 * How it was opened: a mouse resting on the orb (it stays while the pointer does), or a tap /
 * Enter (the button takes the focus, and folds back if it's left unused).
 */
export type GrowBy = "hover" | "tap";

export interface RevealActions {
  /** Grow the orb into the next chapter's button. */
  grow(by: GrowBy): void;
  /** Fold the button back into the orb (the growth, reversed); `refocus` moves focus to the orb. */
  fold(refocus?: boolean): void;
  /** Back to the orb at once (while out of sight). */
  reset(): void;
  /** Only the orb is out (no button growing, open or folding). */
  isIdle(): boolean;
}

type Tone = (alpha: number) => string;

/** A design token's colour (e.g. `--color-peach`) as an rgba() maker, so GSAP can tween it. */
function tone(css: CSSStyleDeclaration, token: string): Tone {
  const n = parseInt(css.getPropertyValue(token).trim().slice(1), 16);
  return (alpha) => `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${alpha})`;
}

/** The label writing in, letter by letter, as the pill lands: each letter's fade-up, and the gap between two. */
const LETTERS = { duration: 0.3, stagger: 0.025 };

/** Where the growing pill lands: the revealed button's own glass and ring (UI/Button's tones). */
const LANDING: Record<AssistantVariant, (t: { peach: Tone; frost: Tone }) => { fill: string; ring: string }> = {
  outline: ({ peach }) => ({ fill: peach(0.06), ring: peach(0.7) }),
  primary: ({ peach, frost }) => ({ fill: frost(0.1), ring: peach(0.55) }),
};

/**
 * The orb growing into the next chapter's button and folding back (P27-74; a hook since
 * P27-85): a shell that starts as the orb (its size, colour and layered glow) stretches into
 * the button's pill while cooling from peach to glass; the real button then takes over and
 * its label writes in, letter by letter. Folding back is the same, reversed. Returns whether
 * the button is open, and the actions (stable).
 */
export function useReveal(
  { orb, shell, reveal }: RevealRefs,
  contextSafe: ContextSafe,
  onFolded: () => void,
): [open: boolean, actions: RevealActions] {
  const [open, setOpen] = useState(false);
  const anim = useRef<{ tl: gsap.core.Timeline; split: SplitText } | null>(null);
  const out = useRef(false); // the button is out: growing, open or folding back
  const autoFold = useTimeout();
  const folded = useRef(onFolded);
  folded.current = onFolded;

  // The GSAP context reverts its timeline on unmount (and StrictMode's rehearsal): forget it.
  useEffect(
    () => () => {
      anim.current = null;
      out.current = false;
    },
    [],
  );

  const actions = useMemo<RevealActions>(() => {
    const glowOf = () => orb.current?.querySelector<HTMLElement>(".nav-assistant__glow") ?? null;

    /** Back to the orb, whichever way it got here (the fold's end, or a reset). Idempotent. */
    const finish = () => {
      const a = anim.current;
      if (!a) return;
      anim.current = null;
      a.tl.kill();
      a.split.revert(); // first: the label's own text is back before React renders it again
      const icon = reveal.current?.querySelector("[data-button-icon]");
      gsap.set([reveal.current, shell.current].filter(Boolean), { autoAlpha: 0 });
      const glow = glowOf();
      if (glow) gsap.set(glow, { clearProps: "opacity,visibility" });
      if (icon) gsap.set(icon, { clearProps: "opacity,visibility,transform" });
      out.current = false;
      autoFold.clear();
      setOpen(false);
      folded.current();
    };

    const fold = (refocus = false) => {
      const a = anim.current;
      if (!a || a.tl.reversed()) return;
      autoFold.clear();
      setOpen(false);
      a.tl.reverse();
      if (refocus) orb.current?.focus({ preventScroll: true });
    };

    const grow = contextSafe((by: GrowBy) => {
      const r = reveal.current;
      const sh = shell.current;
      const glow = glowOf();
      const label = r?.querySelector("[data-button-label]");
      if (!r || !sh || !glow || !label || out.current) return;
      out.current = true;
      setOpen(true);
      const split = new SplitText(label, { type: "chars" });
      const icon = r.querySelector("[data-button-icon]");
      const letters = icon ? [...split.chars, icon] : split.chars;
      const css = getComputedStyle(document.documentElement);
      const peach = tone(css, "--color-peach");
      const lightPeach = tone(css, "--color-light-peach");
      const darkPeach = tone(css, "--color-dark-peach");
      const landing = LANDING[PHASE_NAV.variant]({ peach, frost: tone(css, "--color-gray-slate") });
      const d = glow.getBoundingClientRect().width; // the orb as seen (hover grows it)
      const T = PHASE_NAV.revealSeconds;
      const tl = gsap
        .timeline({
          defaults: { ease: "sine.inOut" },
          // A tap or Enter hands the focus to the button; a resting mouse doesn't take it.
          onComplete: () => {
            if (by === "tap") r.querySelector("button")?.focus({ preventScroll: true });
          },
          onReverseComplete: finish,
        })
        .set(sh, {
          autoAlpha: 1,
          width: d,
          height: d,
          backgroundColor: peach(1),
          boxShadow: `0 0 6px 1px ${lightPeach(0.75)}, 0 0 14px 4px ${peach(0.55)}, 0 0 32px 10px ${darkPeach(0.22)}, inset 0 0 0 1px ${peach(0)}`,
        })
        .set(r, { autoAlpha: 0 })
        .set(letters, { autoAlpha: 0, y: 3 })
        .to(glow, { autoAlpha: 0, duration: T * 0.25 }, 0)
        .to(
          sh,
          {
            width: r.offsetWidth,
            height: r.offsetHeight,
            backgroundColor: landing.fill,
            boxShadow: `0 0 0px 0px ${lightPeach(0)}, 0 0 0px 0px ${peach(0)}, 0 0 0px 0px ${darkPeach(0)}, inset 0 0 0 1px ${landing.ring}`,
            duration: T,
          },
          0,
        )
        .to(r, { autoAlpha: 1, duration: T * 0.3 }, T * 0.8)
        .to(sh, { autoAlpha: 0, duration: T * 0.3 }, T * 0.95)
        .to(letters, { autoAlpha: 1, y: 0, ...LETTERS, ease: "sine.out" }, T * 0.9);
      anim.current = { tl, split };
      if (by === "tap") autoFold.set(() => fold(), PHASE_NAV.autoCloseSeconds);
    });

    return {
      grow,
      fold,
      reset: finish,
      isIdle: () => !out.current,
    };
  }, [autoFold, contextSafe, orb, reveal, shell]);

  return [open, actions];
}
