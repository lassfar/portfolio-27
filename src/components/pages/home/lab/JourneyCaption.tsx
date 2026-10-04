"use client";

import { useEffect, useRef } from "react";
import { PARKER_JOURNEY } from "#/components/three.js/parker/config";
import { clamp01, remap01 } from "#/components/three.js/star/utils";
import { useLabScroll } from "#/stores/useLabScroll";

/**
 * The Lab's caption (P27-72): what Parker's journey line means — it never flies
 * straight at the Sun, it loops, and every loop takes it a little closer. Shown at the
 * bottom left (clear of the story title and the navigation orb) while the loops draw
 * with the planets on screen (PARKER_JOURNEY.caption), fading with the scroll —
 * imperatively, so nothing re-renders as you scroll.
 */
const JourneyCaption = () => {
  const ref = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    let before = -1;
    const update = (progress: number) => {
      const el = ref.current;
      if (!el) return;
      const lab = clamp01(progress);
      const [from, to] = PARKER_JOURNEY.caption;
      const fade = PARKER_JOURNEY.captionFade;
      const opacity = lab > 0 ? Math.min(remap01(lab, from, from + fade), 1 - remap01(lab, to - fade, to)) : 0;
      const rounded = Math.round(opacity * 100) / 100;
      if (rounded === before) return;
      before = rounded;
      el.style.opacity = `${rounded}`;
      el.style.visibility = rounded > 0 ? "visible" : "hidden";
    };
    update(useLabScroll.getState().progress);
    return useLabScroll.subscribe((s) => update(s.progress));
  }, []);

  return (
    <p
      ref={ref}
      className="pointer-events-none fixed bottom-28 left-12 right-4 z-[35] max-w-[19rem] text-sm font-light leading-relaxed text-white/90 opacity-0 sm:left-20 sm:max-w-sm sm:text-base md:left-24"
      style={{ visibility: "hidden" }}
    >
      It never flies straight at the Sun. It loops &mdash; and every loop takes it{" "}
      <span className="text-peach">a little closer</span>. That&rsquo;s how I learn.
    </p>
  );
};

export default JourneyCaption;
