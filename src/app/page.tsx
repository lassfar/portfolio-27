import Hero from "#/components/pages/home/Hero";
import SceneOverlays from "#/components/pages/home/panel/SceneOverlays";
import StoryTimeline from "#/components/pages/home/timeline/StoryTimeline";
import StoryTitle from "#/components/pages/home/timeline/StoryTitle";
import StorySubtitles from "#/components/pages/home/subtitles/StorySubtitles";
import NavAssistant from "#/components/pages/home/phase-nav/NavAssistant";
import PerfHud from "#/components/three.js/scene/PerfHud";
import MotionSwitch from "#/components/pages/home/motion/MotionSwitch";

export default function Home() {
  return (
    <main className="bg-rich-black">
      {/* The whole cosmic journey lives in one pinned sequence inside Hero:
          star → explosion → Saturn → About reveal → The Craft (folded in as an
          overlay) → the Saturn flies away out into the wider voyage → dive to
          the interactive Earth. */}
      <Hero />

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

      {/* The "Reduce motion" switch, top-right (with ?calm until the calm book ships). */}
      <MotionSwitch />
    </main>
  );
}
