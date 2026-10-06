/** Where on the screen a subtitle sits (its text aligned to the same side). */
export type SubtitlePlacement = "bottom-left" | "bottom-center" | "bottom-right";

/** One line of the story's subtitles: what it says, and where in the scroll it shows. */
export type StorySubtitle = {
  id: string;
  /** The line, in Aymane's voice; `*…*` marks its peach accent. */
  line: string;
  /** Where it shows ([from, to] master progress): it writes in at `from`, fades out at `to`. */
  window: [number, number];
  /** Off: kept, but never shown (e.g. where the chapter's own section already speaks). */
  enabled: boolean;
  /** Shown while the navigation assistant glides the visitor through it (off: only on their own scroll). */
  onAssistantGlide: boolean;
  /** Where it sits; SUBTITLE_PLACEMENT unless given. */
  placement?: SubtitlePlacement;
};

