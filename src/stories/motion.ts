import { useMotion } from "#/stores/useMotion";

/**
 * A story's `beforeEach`: the story in calm motion, as a visitor who chose it would see it
 * (P27-92), then back to the toolbar's choice. Through the store's state only: nothing is
 * saved in the browser, so no other story is left calm.
 */
export const inCalm = () => {
  useMotion.setState({ choice: "calm" });
  return () => useMotion.setState({ choice: null });
};
