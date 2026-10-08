"use client";

import { useEffect } from "react";

/** How much of a part shows before it fades in. */
const THRESHOLD = 0.12;

/**
 * The calm book's fades (P27-93): each part marked `data-reveal` fades in (layout.ts, REVEAL)
 * the first time it shows, then stays. Opacity only: nothing moves. Renders nothing.
 */
const BookReveal = () => {
  useEffect(() => {
    const seen = new IntersectionObserver(
      (entries) =>
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.setAttribute("data-in", "");
          seen.unobserve(entry.target);
        }),
      { threshold: THRESHOLD },
    );
    document.querySelectorAll("[data-reveal]:not([data-in])").forEach((part) => seen.observe(part));
    return () => seen.disconnect();
  }, []);
  return null;
};

export default BookReveal;
