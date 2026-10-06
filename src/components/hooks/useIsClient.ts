import { useSyncExternalStore } from "react";

const subscribe = () => () => {};

/**
 * Whether it renders in the browser (P27-85): false on the server and in the first client
 * render (no hydration mismatch), true after. For what needs the DOM, e.g. a portal to `<body>`.
 */
export function useIsClient(): boolean {
  return useSyncExternalStore(subscribe, () => true, () => false);
}
