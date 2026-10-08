/**
 * Viewports the toolbar's set doesn't have (P27-95), for a story's `parameters.viewport` with
 * its `globals.viewport` (the test runner doesn't apply `isRotated`).
 */
export const VIEWPORTS = {
  /** A phone held sideways: short and wide (568 × 320). */
  phoneSideways: {
    name: "Phone held sideways",
    styles: { width: "568px", height: "320px" },
    type: "mobile",
  },
} as const;

/** A story's viewport: a phone held sideways. */
export const sideways = {
  parameters: { viewport: { options: VIEWPORTS } },
  globals: { viewport: { value: "phoneSideways", isRotated: false } },
};
