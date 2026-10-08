import clsx from "clsx";
import AccentText from "#/components/UI/text/AccentText";
import BookReveal from "#/components/pages/home/book/BookReveal";
import Bridge from "#/components/pages/home/book/Bridge";
import BookTimeline from "#/components/pages/home/book/BookTimeline";
import Cover from "#/components/pages/home/book/Cover";
import Ending from "#/components/pages/home/book/Ending";
import { LabChip, PlaceChips } from "#/components/pages/home/book/PlaceChips";
import Spread from "#/components/pages/home/book/Spread";
import { titleId } from "#/components/pages/home/book/chapters";
import DotField from "#/components/pages/home/book/dots/DotField";
import LiveDrawing from "#/components/pages/home/book/drawings/LiveDrawing";
import { BODY, FIGURE, VOICE_LINE } from "#/components/pages/home/book/layout";
import Contact from "#/components/pages/home/contact/Contact";
import PanelHost from "#/components/pages/home/panel/PanelHost";
import { ABOUT, BOOK, CRAFT, VOICE } from "#/components/pages/home/story/copy";

/** A chapter's line in Aymane's voice: `spaced` after its words. */
const Voice = ({ text, spaced = false }: { text: string; spaced?: boolean }) => (
  <p className={clsx(VOICE_LINE, spaced && "mt-5.5")}>
    <AccentText text={text} />
  </p>
);

/**
 * The calm book (P27-93, the Epic P27-65): the story told as a book, not a movie, for the
 * calm mode (reduced motion). Seven chapters scrolled like pages, each shape beside its words;
 * bridges between them say what the motion used to show; then "You are here" and Contact.
 * Agreed in the prototype docs/design/mockups/14-calm-story.html.
 *
 * Nothing moves on its own: parts fade in as they show, the pointer lights the dots it
 * touches, the timeline (the journey's, on the right) jumps. No 3D: its words are the journey's (story/copy.ts), its shapes are
 * 2D. The places and Parker's memory card open the same panels as in the journey.
 */
const CalmBook = () => (
  <div className="relative bg-rich-black font-light text-white">
    {/* Without a script nothing would fade in: shown as they are. */}
    <noscript>
      <style>{"[data-reveal]{opacity:1}"}</style>
    </noscript>
    <BookTimeline />

    <Cover />
    <Bridge after="origin" />

    <Spread
      id="maker"
      title={ABOUT.title}
      figure={<DotField shape="saturn" label={BOOK.figures.saturn} className={FIGURE} />}
    >
      {ABOUT.paragraphs.map((paragraph) => (
        <p key={paragraph} className={BODY}>
          {paragraph}
        </p>
      ))}
      <Voice text={VOICE.maker} spaced />
    </Spread>
    <Bridge after="maker" />

    <Spread
      id="craft"
      flip
      title={CRAFT.title}
      figure={
        <figure role="img" aria-label={BOOK.figures.craft} className={clsx(FIGURE, "m-0")}>
          <LiveDrawing name="craft" />
        </figure>
      }
    >
      <p className={BODY}>{CRAFT.intro}</p>
      <p className={BODY}>{BOOK.craftKey}</p>
    </Spread>
    <Bridge after="craft" />

    <Spread
      id="earth"
      title={BOOK.titles.earth}
      figure={<DotField shape="earth" label={BOOK.figures.earth} className={FIGURE} />}
    >
      <Voice text={VOICE.earth} />
      <PlaceChips />
    </Spread>
    <Bridge after="earth" />

    <Spread
      id="lab"
      flip
      title={BOOK.titles.lab}
      figure={
        <DotField shape="sun" label={BOOK.figures.lab} className={FIGURE}>
          <LiveDrawing name="parker" />
        </DotField>
      }
    >
      <Voice text={VOICE.lab} />
      <LabChip />
    </Spread>
    <Bridge after="lab" />

    <Spread
      id="milky-way"
      title={BOOK.titles["milky-way"]}
      figure={<DotField shape="galaxy" label={BOOK.figures.galaxy} className={FIGURE} />}
    >
      <Voice text={VOICE["milky-way"]} />
    </Spread>

    <Ending />

    <section id="contact" aria-labelledby={titleId("contact")}>
      <Contact layout="page" titleId={titleId("contact")} />
    </section>

    <BookReveal />
    <PanelHost />
  </div>
);

export default CalmBook;
