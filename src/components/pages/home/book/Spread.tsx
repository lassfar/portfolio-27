import type { ReactNode } from "react";
import clsx from "clsx";
import { plainText } from "#/components/UI/text/accent";
import DisplayTitle from "#/components/UI/text/DisplayTitle";
import { chapterNumber, titleId } from "#/components/pages/home/book/chapters";
import { EYEBROW, REVEAL } from "#/components/pages/home/book/layout";
import { BOOK, CHAPTER_NAMES } from "#/components/pages/home/story/copy";
import type { ChapterId } from "#/components/pages/home/story/story.types";

type Props = {
  id: ChapterId;
  /** Its title: `*word*` in peach. */
  title: string;
  /** Its shape. */
  figure: ReactNode;
  /** The shape on the right, the words on the left: the spreads alternate. */
  flip?: boolean;
  /** Its words. */
  children: ReactNode;
};

/**
 * A chapter of the calm book (P27-93), a spread: its shape on one side, its words on the
 * other, alternating; on a phone, the shape above the words. Both fade in as they show. Its
 * heading takes the focus when the timeline jumps here (its ring shown from the keyboard).
 *
 * Screen readers hear the chapter once, from its heading: "Chapter 2 · The Maker: Small,
 * Patient Details", "Chapter 4 · The Earth" (P27-100). The eyebrow above it says the same, so
 * it's hidden from them, and the section isn't a named region. Then its words, then its shape:
 * first on screen, after the words in the page (CSS order), so heading navigation never hears
 * the next chapter's picture at the end of this one.
 */
const Spread = ({ id, title, figure, flip = false, children }: Props) => (
  <section
    id={id}
    className={clsx(
      // Room on the right for the timeline (BookTimeline), on phones too.
      "grid items-center gap-[clamp(28px,4vw,64px)] py-7.5 pr-12 pl-5",
      "md:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] md:py-18 md:pr-[clamp(64px,8vw,120px)] md:pl-[clamp(24px,6vw,96px)]",
    )}
  >
    <div data-reveal className={REVEAL}>
      <p className={EYEBROW} aria-hidden="true">
        {BOOK.chapter} {chapterNumber(id)} · <span className="text-peach">{CHAPTER_NAMES[id]}</span>
      </p>
      <DisplayTitle
        id={titleId(id)}
        tabIndex={-1}
        size="chapter"
        text={title}
        srPrefix={`${BOOK.chapter} ${chapterNumber(id)} · ${plainText(title) === CHAPTER_NAMES[id] ? "" : `${CHAPTER_NAMES[id]}: `}`}
        className="mt-2.5 mb-4 focus-ring"
      />
      {children}
    </div>
    <div data-reveal className={clsx(REVEAL, "order-first", flip && "md:order-last")}>
      {figure}
    </div>
  </section>
);

export default Spread;
