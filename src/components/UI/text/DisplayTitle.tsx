import clsx from "clsx";
import AccentText from "#/components/UI/text/AccentText";
import type { DisplayTitleProps, DisplayTitleSize } from "#/components/UI/text/text.types";

const SIZE: Record<DisplayTitleSize, string> = {
  hero: "text-4xl leading-tight sm:text-6xl lg:text-7xl xl:text-8xl", // the hero's headline: a longer line
  xl: "text-6xl leading-none sm:text-7xl md:text-8xl lg:text-9xl", // The Maker
  lg: "text-6xl leading-none sm:text-7xl md:text-8xl", // Contact
  md: "text-5xl leading-none sm:text-6xl md:text-7xl lg:text-8xl", // The Craft
  sm: "text-5xl leading-none sm:text-6xl", // the thank-you
  chapter: "text-[clamp(40px,5vw,66px)] leading-[1.02]", // a calm book chapter's, beside its figure (P27-93)
  panel: "text-display-sm sm:text-display", // a panel's full view
  "panel-side": "text-4xl leading-display sm:text-5xl", // the side panel
};

/**
 * The site's display title (Storybook: UI/DisplayTitle, P27-82): Great Vibes in white, its
 * key words (`*…*`) in peach — the hero's headline, the sections' titles, the panels'.
 * The page writes it in, letter by letter (GSAP SplitText); `className` places it.
 */
const DisplayTitle = ({ text, as: Tag = "h2", size, className, ...props }: DisplayTitleProps) => (
  <Tag
    {...props}
    className={clsx("font-great-vibes font-normal text-white", SIZE[size], className)}
  >
    <AccentText text={text} />
  </Tag>
);

export default DisplayTitle;
