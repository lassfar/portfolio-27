import Hero from "#/components/pages/home/Hero";
import EarthGallery from "#/components/pages/home/gallery/EarthGallery";
import LabExperiments from "#/components/pages/home/lab/LabExperiments";
import StoryTimeline from "#/components/pages/home/timeline/StoryTimeline";
import StoryTitle from "#/components/pages/home/timeline/StoryTitle";
import NavAssistant from "#/components/pages/home/phase-nav/NavAssistant";
import PerfHud from "#/components/three.js/scene/PerfHud";

export default function Home() {
  return (
    <main className="bg-rich-black">
      {/* The whole cosmic journey lives in one pinned sequence inside Hero:
          star → explosion → Saturn → About reveal → The Craft (folded in as an
          overlay) → the Saturn flies away out into the wider voyage → dive to
          the interactive Earth. */}
      <Hero />

      {/* Fixed DOM overlays (crisp media) opened by the Earth photo-pins. */}
      <EarthGallery />

      {/* Fixed DOM overlays for The Lab — opened by the Parker Solar Probe's memory card. */}
      <LabExperiments />

      {/* The story timeline: a rail on the left with one star per chapter. */}
      <StoryTimeline />

      {/* The story title: the current chapter, always visible on the left edge. */}
      <StoryTitle />

      {/* The navigation assistant: a glowing orb that opens into the next chapter's button. */}
      <NavAssistant />

      {/* ?perf only: live FPS and a per-chapter performance report. */}
      <PerfHud />
    </main>
  );
}
