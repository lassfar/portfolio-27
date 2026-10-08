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
 * heading takes the focus when the timeline jumps here (its ring shown from the keyboard), and
 * says the chapter's name first (P27-95: heading navigation reads "The Maker: Small, Patient
 * Details"), unless its title already is the name ("The Earth").
 */
const Spread = ({ id, title, figure, flip = false, children }: Props) => (
  <section
    id={id}
    aria-labelledby={titleId(id)}
    className={clsx(
      // Room on the right for the timeline (BookTimeline), on phones too.
      "grid items-center gap-[clamp(28px,4vw,64px)] py-7.5 pr-12 pl-5",
      "md:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] md:py-18 md:pr-[clamp(64px,8vw,120px)] md:pl-[clamp(24px,6vw,96px)]",
    )}
  >
    <div data-reveal className={clsx(REVEAL, flip && "md:order-2")}>
      {figure}
    </div>
    <div data-reveal className={REVEAL}>
      <p className={EYEBROW}>
        {BOOK.chapter} {chapterNumber(id)} · <span className="text-peach">{CHAPTER_NAMES[id]}</span>
      </p>
      <DisplayTitle
        id={titleId(id)}
        tabIndex={-1}
        size="chapter"
        text={title}
        srPrefix={plainText(title) === CHAPTER_NAMES[id] ? undefined : `${CHAPTER_NAMES[id]}: `}
        className="mt-2.5 mb-4 focus-ring"
      />
      {children}
    </div>
  </section>
);

export default Spread;
