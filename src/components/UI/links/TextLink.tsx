import clsx from "clsx";
import { CAPS_LABEL } from "#/components/UI/text/caps";
import type { TextLinkOwnProps, TextLinkProps, TextLinkVariant } from "#/components/UI/links/link.types";

const VARIANT: Record<TextLinkVariant, string> = {
  plain: "text-sm text-white/55",
  caps: CAPS_LABEL,
};

/** Its `<a>`'s or `<button>`'s own props: all but the link's. */
const elementOf = <T extends TextLinkOwnProps>({ variant: _variant, external: _external, className: _className, ...element }: T) =>
  element;

/**
 * A quiet text link (Storybook: UI/TextLink, P27-82): it turns peach on hover or keyboard
 * focus, with a 44px tap area on phones. With `href` it's a link (`external` opens it in a new
 * tab); without, a button ("Write another"). `className` places it.
 */
const TextLink = (props: TextLinkProps) => {
  const className = clsx(
    "tap-target cursor-pointer transition-colors duration-300 focus-ring hover:text-peach focus-visible:text-peach max-sm:relative",
    VARIANT[props.variant ?? "plain"],
    props.className,
  );
  if (props.href !== undefined) {
    const newTab = props.external ? { target: "_blank", rel: "noopener noreferrer" } : {};
    return <a {...elementOf(props)} {...newTab} className={className} />;
  }
  return <button type="button" {...elementOf(props)} className={className} />;
};

export default TextLink;
