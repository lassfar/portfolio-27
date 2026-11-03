import Journey from "#/components/pages/home/Journey";
import CalmBook from "#/components/pages/home/book/CalmBook";
import PageLoader from "#/components/pages/home/loading/PageLoader";
import PageLoaderProgress from "#/components/pages/home/loading/PageLoaderProgress";
import ModeGate from "#/components/pages/home/motion/ModeGate";
import MotionSwitch from "#/components/pages/home/motion/MotionSwitch";
import SkipToContact from "#/components/pages/home/motion/SkipToContact";
import JsonLd from "./JsonLd";

export default function Home() {
  return (
    <main className="bg-rich-black">
      <JsonLd />
      {/* One page, two ways to tell the story (P27-93): the journey in motion, the book in
          the calm mode (reduced motion). The first paint shows the right one; a switch swaps
          them live, on the same chapter (P27-94). */}
      <ModeGate switchLive full={<Journey />} calm={<CalmBook />} />

      {/* The loading screen (P27-115): with motion, the planet sketched then inked while the
          journey loads, from the first paint until its 3D is drawn. */}
      <PageLoader />
      <PageLoaderProgress />

      {/* The "Reduce motion" switch, top-right: calm or full motion, for every visitor. Then
          "Skip to Contact" (P27-99): both portal into the page's controls, in this order. */}
      <MotionSwitch />
      <SkipToContact />
    </main>
  );
}
