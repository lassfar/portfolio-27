import {
  ArrowUpRight,
  Camera,
  ChevronLeft,
  ChevronRight,
  Expand,
  FlaskConical,
  Maximize2,
  MemoryStick,
  PanelRight,
  Play,
  Video,
  X,
} from "lucide-react";

/** The icons the site uses (P27-80), by name. */
export const SITE_ICONS = {
  ArrowUpRight,
  Camera,
  ChevronLeft,
  ChevronRight,
  Expand,
  FlaskConical,
  Maximize2,
  MemoryStick,
  PanelRight,
  Play,
  Video,
  X,
};

/**
 * An `icon` prop's control (P27-82): a component can't be typed into Controls, so the
 * story offers the site's icons by name and Storybook maps the name to the glyph.
 */
export const ICON_ARG_TYPE = {
  control: "select",
  options: Object.keys(SITE_ICONS),
  mapping: SITE_ICONS,
} as const;
