import clsx from "clsx";
import { REVEAL } from "#/components/pages/home/book/layout";
import { BOOK } from "#/components/pages/home/story/copy";

/**
 * The calm book's ending (P27-93): after the Milky Way's "You are here", one glowing dot and
 * one line, alone on their page, before Contact.
 */
const Ending = () => (
  <section
    aria-label={BOOK.youAreHere}
    data-reveal
    className={clsx(
      REVEAL,
      "flex min-h-screen flex-col items-center justify-center gap-4.5 px-12 py-20 text-center md:px-6",
    )}
  >
    <span
      aria-hidden="true"
      className="mb-6.5 size-1.75 rounded-full bg-light-peach shadow-[0_0_0_7px_rgb(255_161_74/0.16),0_0_0_8px_rgb(255_161_74/0.5),0_0_30px_10px_rgb(255_161_74/0.18)]"
    />
    <p className="max-w-225 font-great-vibes text-[clamp(42px,6.2vw,86px)] leading-[1.12] text-white">
      {BOOK.ending}
    </p>
  </section>
);

export default Ending;
