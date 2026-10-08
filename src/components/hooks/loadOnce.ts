/** A module fetched once, and the module itself once it has arrived. */
export type Loader<T> = (() => Promise<T>) & { readonly loaded: T | null };

/**
 * Fetches a module once, for everyone who asks (P27-95): `next/dynamic` and a preload share
 * one import site, so the build makes one chunk. A failed fetch can be tried again. Once it
 * has arrived, `loaded` gives it at once (before anything from its chunk can mount).
 */
export function loadOnce<T>(load: () => Promise<T>): Loader<T> {
  let loading: Promise<T> | null = null;
  let loaded: T | null = null;
  const loader = () =>
    (loading ??= load().then(
      (arrived) => (loaded = arrived),
      (error: unknown) => {
        loading = null;
        throw error;
      },
    ));
  return Object.defineProperty(loader, "loaded", { get: () => loaded }) as Loader<T>;
}
