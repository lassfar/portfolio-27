/**
 * How long a chapter must hold before its name is said (ms): a glide or a quick scroll passes
 * several, and only where it stops is worth hearing (P27-100).
 */
export const ANNOUNCE_SETTLE_MS = 600;

/** How long a said name stays in the live line (s): then cleared, so reading on doesn't meet it. */
export const ANNOUNCE_CLEAR_SECONDS = 4;

/**
 * Says each new chapter once it has held for `ms` (`say`, its index): `next` on every change.
 * The first one is only noted (the page just opened there), as is one passed `quiet` (a mode
 * switch lands there: its status line says it); a chapter is never said twice in a row.
 * Returns `next` and `stop` (a pending one is dropped).
 */
export function chapterAnnouncer(say: (index: number) => void, ms = ANNOUNCE_SETTLE_MS) {
  let said: number | null = null;
  let timer: ReturnType<typeof setTimeout> | undefined;
  return {
    next(index: number, quiet = false) {
      clearTimeout(timer);
      if (said === null || quiet) {
        said = index;
        return;
      }
      timer = setTimeout(() => {
        if (index === said) return;
        said = index;
        say(index);
      }, ms);
    },
    stop() {
      clearTimeout(timer);
    },
  };
}
