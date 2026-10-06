import clsx from "clsx";
import type { CSSProperties } from "react";
import { Expand, Play } from "lucide-react";
import GlowCard from "#/components/UI/cards/GlowCard";
import type { GlowCardSize } from "#/components/UI/cards/card.types";
import Icon from "#/components/UI/icons/Icon";
import type { MediaItem } from "#/components/three.js/earth/data";
import { MediaThumb } from "./GalleryMedia";
import { RISE } from "#/components/pages/home/panel/layout";

export interface MediaCardProps {
  item: MediaItem;
  /** Its place in the place's media (the photo viewer opens there). */
  index: number;
  /** Its name for screen readers, when it has no caption ("London 02"). */
  name: string;
  size: GlowCardSize;
  className?: string;
  style?: CSSProperties;
  onOpen: () => void;
}

/**
 * A photo or a clip in a place's panel (P27-80): a glow card that opens the photo
 * viewer, its still brightening on hover, its caption sliding in; a clip shows a play
 * button. `data-photo` lets focus come back to it when the viewer closes.
 */
const MediaCard = ({ item, index, name, size, className, style, onOpen }: MediaCardProps) => (
  <GlowCard
    {...RISE}
    size={size}
    data-photo={index}
    aria-label={`Open ${item.caption ?? name}`}
    className={className}
    style={style}
    onClick={onOpen}
  >
    <span className="block transition-[filter] duration-500 ease-out-quint group-hover/card:brightness-108 group-hover/card:saturate-112 group-focus-visible/card:brightness-108 group-focus-visible/card:saturate-112">
      <MediaThumb item={item} index={index} />
    </span>
    {item.type === "video" && (
      <span className="glass absolute top-1/2 left-1/2 z-2 grid size-12 -translate-1/2 place-items-center rounded-full text-white">
        <Icon icon={Play} size={16} filled className="ml-0.5" />
      </span>
    )}
    <span
      className={clsx(
        "absolute inset-x-0 bottom-0 z-2 flex items-center justify-between gap-2 bg-linear-to-b from-transparent to-black/62 px-3.5 pt-7 pb-3 text-2xs tracking-wide text-white/90",
        "opacity-0 transition-opacity duration-250 group-hover/card:opacity-100 group-focus-visible/card:opacity-100",
      )}
    >
      <span>{item.caption ?? name}</span>
      <Icon icon={Expand} size={14} />
    </span>
  </GlowCard>
);

export default MediaCard;
