import clsx from "clsx";
import AccentText from "#/components/UI/text/AccentText";
import { BRIDGE_LINE, REVEAL } from "#/components/pages/home/book/layout";
import { BRIDGES, VOICE } from "#/components/pages/home/story/copy";
import type { ChapterId } from "#/components/pages/home/story/story.types";

/** A thin peach line, fading at both ends, above and below a bridge. */
const HAIRLINES =
  "before:h-8.5 before:w-px before:bg-linear-to-b before:from-transparent before:via-peach/50 before:to-transparent after:h-8.5 after:w-px after:bg-linear-to-b after:from-transparent after:via-peach/50 after:to-transparent";

/**
 * The bridge after a chapter of the calm book (P27-93): a line in Aymane's voice saying what
 * the motion used to show. A passage (The Voyage, The Way Out) sits between its two lines.
 */
const Bridge = ({ after }: { after: ChapterId }) => {
  const bridge = BRIDGES.find((b) => b.after === after);
  if (!bridge) return null;
  const [first, second] = bridge.lines;
  return (
    <div
      data-reveal
      className={clsx(REVEAL, HAIRLINES, "flex flex-col items-center gap-3 px-6 py-10 text-center")}
    >
      <p className={BRIDGE_LINE}>{first}</p>
      {"passage" in bridge && (
        <p className="my-2 max-w-155 text-[clamp(15px,1.4vw,17px)] leading-[1.7] text-white/82">
          <AccentText text={VOICE[bridge.passage]} />
        </p>
      )}
      {second && <p className={BRIDGE_LINE}>{second}</p>}
    </div>
  );
};

export default Bridge;
