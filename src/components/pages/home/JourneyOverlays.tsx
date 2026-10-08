"use client";

import { useLoaded } from "#/components/hooks/useLoaded";
import { loadJourneyMotion } from "#/components/pages/home/loadJourney";
import { useGateLive } from "#/components/pages/home/motion/gateLive";

/**
 * The journey's parts around its scene (JourneyParts: the labels and panel, the timeline, the
 * title, the subtitles, the assistant), once the journey is the mode on screen (P27-95): their
 * code is fetched apart, so the calm mode never loads it.
 */
const JourneyOverlays = () => {
  const live = useGateLive();
  const journey = useLoaded(loadJourneyMotion, live);
  return live && journey ? <journey.JourneyParts /> : null;
};

export default JourneyOverlays;
