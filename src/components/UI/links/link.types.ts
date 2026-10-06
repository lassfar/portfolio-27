import type { ComponentProps } from "react";

export const TEXT_LINK_VARIANTS = ["plain", "caps"] as const;
/** `plain`: a quiet link in a list (Contact's links); `caps`: a quiet action under a form ("Write another"). */
export type TextLinkVariant = (typeof TEXT_LINK_VARIANTS)[number];

/** The link's own props; the rest go to its `<a>` or `<button>`. */
export interface TextLinkOwnProps {
  variant?: TextLinkVariant;
  /** Opens in a new tab (another site). */
  external?: boolean;
  /** Places it. */
  className?: string;
}

/** With `href` it's a link (`<a>`); without, a button that does something here. */
export type TextLinkProps = TextLinkOwnProps &
  (
    | ({ href: string } & Omit<ComponentProps<"a">, "className" | "href">)
    | ({ href?: undefined; external?: false } & Omit<ComponentProps<"button">, "className">)
  );
