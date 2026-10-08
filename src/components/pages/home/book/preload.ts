let loading: Promise<unknown> | null = null;

/**
 * Fetches the calm book's figures' code (P27-94), once: its dots and drawings, before a
 * switch into calm reveals it. A failed fetch can be tried again.
 */
export function preloadBook(): Promise<unknown> {
  loading ??= Promise.all([
    import("#/components/pages/home/book/dots/DotCanvas"),
    import("#/components/pages/home/book/drawings/CraftDrawing"),
    import("#/components/pages/home/book/drawings/ParkerDrawing"),
  ]).catch((error: unknown) => {
    loading = null;
    throw error;
  });
  return loading;
}
