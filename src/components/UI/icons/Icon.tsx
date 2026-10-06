import type { IconProps } from "#/components/UI/icons/icon.types";

/**
 * The stroke of every icon on the site, in Lucide's 24-unit grid: thinner than Lucide's
 * default (2), for the site's light type — the look validated in the P27-80 prototype.
 */
export const ICON_STROKE = 1.25;

/**
 * The site's icons (P27-80): a Lucide glyph drawn in one thin stroke (ICON_STROKE), in
 * the text colour. Decorative — hidden from screen readers; the control around it names it.
 */
const Icon = ({ icon: Glyph, size = 16, filled = false, className }: IconProps) => (
  <Glyph
    size={size}
    strokeWidth={ICON_STROKE}
    fill={filled ? "currentColor" : "none"}
    aria-hidden="true"
    focusable="false"
    className={className}
  />
);

export default Icon;
