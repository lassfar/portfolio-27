import Hero from "#/components/pages/home/Hero";
import SceneOverlays from "#/components/pages/home/panel/SceneOverlays";
import StoryTimeline from "#/components/pages/home/timeline/StoryTimeline";
import StoryTitle from "#/components/pages/home/timeline/StoryTitle";
import StorySubtitles from "#/components/pages/home/subtitles/StorySubtitles";
import NavAssistant from "#/components/pages/home/phase-nav/NavAssistant";
import SmoothScrollProvider from "#/components/providers/SmoothScrollProvider";
import PerfHud from "#/components/three.js/scene/PerfHud";

/**
 * The journey (P27-93: the motion mode's side of the page): the story in motion, one pinned
 * 3D sequence driven by the scroll, with its overlays. The calm mode tells it as a book
 * instead (book/CalmBook); motion/ModeGate shows one or the other.
 */
const Journey = () => (
  <>
    {/* The whole cosmic journey lives in one pinned sequence inside Hero:
        star → explosion → Saturn → About reveal → The Craft (folded in as an
        overlay) → the Saturn flies away out into the wider voyage → dive to
        the interactive Earth. Smooth-scrolled (ScrollSmoother). */}
    <SmoothScrollProvider>
      <Hero />
    </SmoothScrollProvider>

    {/* The scene's labels and the panel they open: a place's photos (the Earth's pins),
        the Lab (Parker's memory card) — with the photo viewer. */}
    <SceneOverlays />

    {/* The story timeline: a rail on the left with one star per chapter. */}
    <StoryTimeline />

    {/* The story title: the current chapter, always visible on the left edge. */}
    <StoryTitle />

    {/* The story's subtitles: a line in Aymane's voice on each part with no words of its own. */}
    <StorySubtitles />

    {/* The navigation assistant: a glowing orb that opens into the next chapter's button. */}
    <NavAssistant />

    {/* ?perf only: live FPS and a per-chapter performance report. */}
    <PerfHud />
  </>
);

export default Journey;
