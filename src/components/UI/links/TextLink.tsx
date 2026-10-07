import clsx from "clsx";
import type { ReactNode } from "react";
import { ArrowUpRight } from "lucide-react";
import Icon from "#/components/UI/icons/Icon";
import { CAPS_LABEL } from "#/components/UI/text/caps";
import type {
  TextLinkOwnProps,
  TextLinkProps,
  TextLinkVariant,
} from "#/components/UI/links/link.types";

const VARIANT: Record<TextLinkVariant, string> = {
  plain: "text-sm text-white/55",
  caps: CAPS_LABEL,
};

/** Its icons, sized to its text: the one before it, and the ↗ of an external link. */
const ICON_SIZE: Record<TextLinkVariant, { icon: number; external: number }> = {
  plain: { icon: 14, external: 12 },
  caps: { icon: 12, external: 10 },
};

/** Its `<a>`'s or `<button>`'s own props: all but the link's (and its children, laid out here). */
const elementOf = <T extends TextLinkOwnProps & { children?: ReactNode }>({
  variant: _variant,
  icon: _icon,
  external: _external,
  className: _className,
  children: _children,
  ...element
}: T) => element;

/**
 * A quiet text link (Storybook: UI/TextLink, P27-82): it turns peach on hover or keyboard
 * focus, with a 44px tap area on phones; an optional `icon` before its text (P27-81). With
 * `href` it's a link (`external` opens it in a new tab, with a small ↗); without, a button
 * that does something here. `className` places it.
 */
const TextLink = (props: TextLinkProps) => {
  const variant = props.variant ?? "plain";
  const className = clsx(
    "tap-target inline-flex cursor-pointer items-center gap-1.5 focus-ring transition-colors duration-300 hover:text-peach focus-visible:text-peach max-sm:relative",
    VARIANT[variant],
    props.className,
  );
  const content = (
    <>
      {props.icon && <Icon icon={props.icon} size={ICON_SIZE[variant].icon} />}
      {props.children}
      {props.external && (
        <>
          <Icon icon={ArrowUpRight} size={ICON_SIZE[variant].external} />
          <span className="sr-only"> (opens in a new tab)</span>
        </>
      )}
    </>
  );
  if (props.href !== undefined) {
    const newTab = props.external ? { target: "_blank", rel: "noopener noreferrer" } : {};
    return (
      <a {...elementOf(props)} {...newTab} className={className}>
        {content}
      </a>
    );
  }
  return (
    <button type="button" {...elementOf(props)} className={className}>
      {content}
    </button>
  );
};

export default TextLink;
