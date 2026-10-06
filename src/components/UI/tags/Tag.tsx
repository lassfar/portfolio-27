import Icon from "#/components/UI/icons/Icon";
import type { TagProps } from "#/components/UI/tags/tag.types";

/**
 * A small liquid-glass pill with an icon, for facts (Storybook: UI/Tag) — e.g. "4 photos",
 * "1 clip" under a panel's title (P27-80). Not interactive.
 */
const Tag = ({ icon, children }: TagProps) => (
  <span className="glass inline-flex items-center gap-2 rounded-full py-2 pr-3.5 pl-3 text-xs font-light tracking-wide text-light-peach">
    {icon && <Icon icon={icon} size={14} className="text-peach" />}
    {children}
  </span>
);

export default Tag;
