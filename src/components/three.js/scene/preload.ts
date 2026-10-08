let loading: Promise<unknown> | null = null;

/**
 * Fetches the 3D scene's code (P27-94), once: as the page loads with motion on (Hero), and in
 * the calm mode before a switch to motion mounts it, or as the pointer or the focus reaches
 * the switch. A failed fetch can be tried again.
 */
export function preloadScene(): Promise<unknown> {
  loading ??= import("#/components/three.js/scene/CosmicScene").catch((error: unknown) => {
    loading = null;
    throw error;
  });
  return loading;
}
