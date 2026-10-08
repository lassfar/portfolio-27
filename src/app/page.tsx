import Journey from "#/components/pages/home/Journey";
import CalmBook from "#/components/pages/home/book/CalmBook";
import ModeGate from "#/components/pages/home/motion/ModeGate";
import MotionSwitch from "#/components/pages/home/motion/MotionSwitch";

export default function Home() {
  return (
    <main className="bg-rich-black">
      {/* One page, two ways to tell the story (P27-93): the journey in motion, the book in
          the calm mode (reduced motion). The first paint shows the right one. */}
      <ModeGate reloadOnChange full={<Journey />} calm={<CalmBook />} />

      {/* The "Reduce motion" switch, top-right: calm or full motion, for every visitor. */}
      <MotionSwitch />
    </main>
  );
}
