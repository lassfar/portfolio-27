import { useEffect, useMemo, useRef } from "react";

export interface Timeout {
  /** Runs `fn` after `seconds`, replacing the one waiting. */
  set(fn: () => void, seconds: number): void;
  clear(): void;
}

/** One timer at a time, cleared on unmount (P27-85). Stable across renders. */
export function useTimeout(): Timeout {
  const id = useRef(0);
  useEffect(() => () => window.clearTimeout(id.current), []);
  return useMemo(
    () => ({
      set(fn, seconds) {
        window.clearTimeout(id.current);
        id.current = window.setTimeout(fn, seconds * 1000);
      },
      clear() {
        window.clearTimeout(id.current);
      },
    }),
    [],
  );
}
