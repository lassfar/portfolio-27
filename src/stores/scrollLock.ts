import { ScrollSmoother } from "gsap/all";

/**
 * A tiny lock registry over `ScrollSmoother.paused()`.
 *
 * Several independent features need to FREEZE the smooth scroll at the same time
 * and must not clobber each other's paused() state:
 *   • the overlay panels (Earth gallery / Lab experiments) — pause while open;
 *   • the journey's hard checkpoints (Earth arrival) — pause on arrival until a
 *     fresh forward gesture.
 *
 * The smoother is paused while ANY key holds a lock, and only resumes once every
 * key has released — so closing a panel while a checkpoint still holds keeps the
 * scroll frozen, and vice-versa.
 */
const locks = new Set<string>();

export function setScrollLock(key: string, on: boolean): void {
  const wasLocked = locks.size > 0;
  if (on) locks.add(key);
  else locks.delete(key);
  const isLocked = locks.size > 0;
  if (wasLocked !== isLocked) ScrollSmoother.get()?.paused(isLocked);
}
