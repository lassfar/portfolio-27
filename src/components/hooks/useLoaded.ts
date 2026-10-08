import { useEffect, useState } from "react";
import type { Loader } from "#/components/hooks/loadOnce";

/**
 * A module from `loader` once it has arrived, else null (P27-95): fetched only while `wanted`,
 * then rendered at once. Not `next/dynamic`: React holds a part that suspended back for ~300 ms
 * before showing it, so two in a row (the smoother, then the Hero's motion) held the journey
 * back by more than half a second.
 */
export function useLoaded<T>(loader: Loader<T>, wanted: boolean): T | null {
  const [arrived, setArrived] = useState(() => loader.loaded);
  useEffect(() => {
    if (arrived || !wanted) return;
    let current = true;
    loader().then(
      (found) => current && setArrived(found),
      () => undefined, // Not fetched: nothing to show (the switch has its own time-outs).
    );
    return () => {
      current = false;
    };
  }, [arrived, loader, wanted]);
  return arrived ?? loader.loaded;
}
