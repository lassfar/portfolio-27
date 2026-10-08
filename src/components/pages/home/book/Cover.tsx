import clsx from "clsx";
import AccentText from "#/components/UI/text/AccentText";
import DisplayTitle from "#/components/UI/text/DisplayTitle";
import DotField from "#/components/pages/home/book/dots/DotField";
import { titleId } from "#/components/pages/home/book/chapters";
import { EYEBROW, VOICE_LINE } from "#/components/pages/home/book/layout";
import { BOOK, HERO, VOICE } from "#/components/pages/home/story/copy";

/**
 * The calm book's cover (P27-93), Origin: the star filling the screen, the words below it,
 * where a soft shadow keeps them readable. The words fade in at once (CSS: they need no
 * script), the star once its dots are drawn.
 */
const Cover = () => (
  <section
    id="origin"
    aria-labelledby={titleId("origin")}
    className="relative grid min-h-screen place-items-center overflow-hidden text-center"
  >
    <DotField shape="star" label={BOOK.figures.star} className="absolute inset-0" />
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 bg-radial-[ellipse_60%_40%_at_center_72%] from-rich-black/75 to-transparent"
    />
    <div className="relative z-1 mt-[28vh] max-w-205 animate-[fade_0.5s_ease-out] px-12 pt-30 pb-20 md:mt-[40vh] md:px-6">
      {/* A soft shade behind its small capitals: the star's lower point fades under them,
          so they read at 4.5:1 even where its dots run behind (WCAG 1.4.3). */}
      <p
        className={clsx(
          EYEBROW,
          "relative inline-block before:absolute before:-inset-x-16 before:-inset-y-5 before:-z-1 before:bg-radial-[closest-side] before:from-rich-black/95 before:from-50% before:to-transparent",
        )}
      >
        {HERO.eyebrow}
      </p>
      <DisplayTitle
        as="h1"
        id={titleId("origin")}
        tabIndex={-1}
        size="hero"
        text={HERO.headline}
        className="mt-2.5 mb-4 outline-none"
      />
      <p className="mx-auto max-w-140 text-[clamp(16px,1.6vw,19px)] leading-[1.7] text-white/75">
        {HERO.intro}
      </p>
      <p className={clsx(VOICE_LINE, "mt-8.5 inline-block text-left")}>
        <AccentText text={VOICE.origin} />
      </p>
      <p className="mt-11.5 font-krone-one text-[9px] tracking-[2px] text-white/55 uppercase">
        {BOOK.hint}
      </p>
    </div>
  </section>
);

export default Cover;
