import Hero from "#/components/pages/home/Hero";
import JourneyOverlays from "#/components/pages/home/JourneyOverlays";
import SmoothScrollProvider from "#/components/providers/SmoothScrollProvider";

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

    {/* Around it: the scene's labels and panel, the story timeline and title, the
        subtitles, the navigation assistant (JourneyParts), fetched apart (P27-95). */}
    <JourneyOverlays />
  </>
);

export default Journey;
