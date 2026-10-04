/** The part of a pointer event the lock reads. */
export type PointerSample = { pointerType: string; clientX: number; clientY: number };

/**
 * One drag's axis lock (P27-31): on a touch screen, a swipe means one thing — sideways
 * turns the object (Saturn, the Earth, the probe), up/down scrolls the story. The
 * swipe's axis is decided on its first move, by the same rule GSAP's scroll Observer
 * uses (`|dx| > |dy|` → sideways), so the two never both act on one swipe. A mouse or
 * a pen always drags, exactly as before.
 */
export function createTouchAxisLock() {
  let touch = false;
  let axis: "x" | "y" | null = null;
  let x0 = 0;
  let y0 = 0;
  return {
    /** A drag begins (pointer-down). */
    start(e: PointerSample): void {
      touch = e.pointerType === "touch";
      axis = null;
      x0 = e.clientX;
      y0 = e.clientY;
    },
    /** Whether this move may turn the object. */
    allows(e: PointerSample): boolean {
      if (!touch) return true;
      if (axis === null) {
        const dx = e.clientX - x0;
        const dy = e.clientY - y0;
        if (dx === 0 && dy === 0) return false;
        axis = Math.abs(dx) > Math.abs(dy) ? "x" : "y";
      }
      return axis === "x";
    },
  };
}
