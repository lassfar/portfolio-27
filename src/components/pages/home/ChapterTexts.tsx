import { plainText } from "#/components/UI/text/accent";
import { BOOK, BRIDGES, CHAPTER_NAMES, CRAFT, VOICE } from "#/components/pages/home/story/copy";
import type { ChapterId } from "#/components/pages/home/story/story.types";
import type { SceneChapter } from "./ChapterTexts.types";

/** The calm book's bridge after `chapter`: one or two lines. */
const after = (chapter: ChapterId): readonly string[] =>
  BRIDGES.find((bridge) => bridge.after === chapter)?.lines ?? [];

/** A passage, as the book tells it: its voice line between its bridge's two lines. */
const passage = (chapter: ChapterId, voice: string) => {
  const [first, ...rest] = after(chapter);
  return [first, voice, ...rest];
};

/** A chapter's words, and its heading: none where an overlay's own comes first. */
type ChapterText = { heading?: string; lines: readonly string[] };

/** Each one's words: what the calm book says of it (its bridges, its figure's words) around its voice line. */
const TEXTS: Record<SceneChapter, ChapterText> = {
  // Under the hero's h1: the star, its burst, Saturn.
  origin: { lines: [BOOK.figures.star, VOICE.origin, ...after("origin"), BOOK.figures.saturn] },
  // After the About's paragraphs, under its heading.
  maker: { lines: [VOICE.maker, ...after("maker")] },
  // The Craft's overlay shows only in its stretch of the scroll (hidden from screen readers):
  // its words are here, its constellation tool by tool.
  craft: {
    heading: `${CHAPTER_NAMES.craft}: ${plainText(CRAFT.title)}`,
    lines: [CRAFT.intro, BOOK.figures.craft],
  },
  voyage: { heading: CHAPTER_NAMES.voyage, lines: passage("craft", VOICE.voyage) },
  earth: { heading: CHAPTER_NAMES.earth, lines: [VOICE.earth, BOOK.figures.earth] },
  lab: { heading: CHAPTER_NAMES.lab, lines: [...after("earth"), VOICE.lab, BOOK.figures.lab] },
  "way-out": { heading: CHAPTER_NAMES["way-out"], lines: passage("lab", VOICE["way-out"]) },
  "milky-way": {
    heading: CHAPTER_NAMES["milky-way"],
    lines: [VOICE["milky-way"], BOOK.figures.galaxy, BOOK.ending],
  },
};

/**
 * The journey's words for screen readers (P27-100, WCAG 1.1.1): the chapters the 3D tells
 * alone (and the Craft, whose overlay shows only in its stretch), a heading each, and the lines around
 * the overlays' own words, unseen, in story order among the overlays (Hero.tsx). The canvas
 * itself is hidden from them. Rendered with the page, so crawlers read the whole story too.
 */
const ChapterTexts = ({ chapters }: { chapters: readonly SceneChapter[] }) => (
  <div className="sr-only">
    {chapters.map((id) => {
      const { heading, lines } = TEXTS[id];
      return (
        <div key={id}>
          {heading && <h2>{heading}</h2>}
          {lines.map((line) => (
            <p key={line}>{plainText(line)}</p>
          ))}
        </div>
      );
    })}
  </div>
);

export default ChapterTexts;
