import {
  ArrowDown,
  ArrowUpRight,
  Camera,
  ChevronLeft,
  ChevronRight,
  Expand,
  FlaskConical,
  Mail,
  Maximize2,
  MemoryStick,
  PanelRight,
  PenLine,
  Play,
  Send,
  Video,
  X,
} from "lucide-react";
import { GitHub, LinkedIn } from "#/components/UI/icons/brands";

/** The icons the site uses (P27-80, P27-81), by name. */
export const SITE_ICONS = {
  ArrowDown,
  ArrowUpRight,
  Camera,
  ChevronLeft,
  ChevronRight,
  Expand,
  FlaskConical,
  GitHub,
  LinkedIn,
  Mail,
  Maximize2,
  MemoryStick,
  PanelRight,
  PenLine,
  Play,
  Send,
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
