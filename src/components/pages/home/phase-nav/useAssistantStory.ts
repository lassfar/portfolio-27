import { TIMELINE } from "#/components/pages/home/timeline/config";
import { mpAt } from "#/components/three.js/star/config";
import { useGlide } from "#/stores/useGlide";
import { useJourneyScroll } from "#/stores/useJourneyScroll";
import { selectIsOpen, usePanelStore } from "#/stores/usePanelStore";
import { nextStopAt, type PhaseStop } from "./config";

export interface AssistantStory {
  /** The chapter to offer from here (null once Contact begins). */
  next: PhaseStop | null;
  /** Past the hero's first screen. */
  past: boolean;
  panelOpen: boolean;
  /** The scroll is gliding (any glide: the assistant's, a timeline star's). */
  gliding: boolean;
}

/**
 * Where the story is, for the navigation assistant (P27-85): zustand selectors only, so it
 * re-renders when one of these changes, not on every scroll frame (`next` is one of
 * PHASE_STOPS, a stable reference).
 */
export function useAssistantStory(): AssistantStory {
  const next = useJourneyScroll((s) => nextStopAt(s.progress));
  const past = useJourneyScroll((s) => s.progress >= mpAt(TIMELINE.showAfter));
  const panelOpen = usePanelStore(selectIsOpen);
  const gliding = useGlide((s) => s.by !== null);
  return { next, past, panelOpen, gliding };
}
