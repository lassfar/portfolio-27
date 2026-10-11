/**
 * The scene's labels' ids: their chapter's words for screen readers take them into the reading
 * order, right after the chapter's lines (ChapterTexts, aria-owns: P27-100). They float over the
 * 3D, so in the page they come after everything.
 */
export const placeLabelId = (place: string) => `place-label-${place}`;
/** Parker's journey labels, by marker. */
export const journeyLabelId = (marker: number) => `journey-label-${marker}`;
/** The Lab's memory card. */
export const LAB_LABEL_ID = "lab-label";
