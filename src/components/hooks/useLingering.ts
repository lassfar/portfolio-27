import { useState } from "react";

/**
 * The value, or — once it turns null — the last one it had (P27-80): an overlay keeps
 * showing what it showed while it fades out. For primitives (compared with `!==`).
 */
export function useLingering<T extends string | number>(value: T | null): T | null {
  const [last, setLast] = useState(value);
  if (value !== null && value !== last) setLast(value); // (React's "previous render" pattern)
  return value ?? last;
}
