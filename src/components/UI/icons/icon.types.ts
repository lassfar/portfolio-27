import type { LucideIcon } from "lucide-react";

export interface IconProps {
  /** The Lucide glyph, imported from `lucide-react` (e.g. `Camera`). */
  icon: LucideIcon;
  /** Its size in px (width and height). */
  size?: number;
  /** Filled with the text colour (e.g. a play triangle) instead of outlined. */
  filled?: boolean;
  className?: string;
}
