import type { LucideIcon } from "lucide-react";
import { RefObject } from "react";

/** Where Contact sits: over the journey's galaxy, or on its own page (the calm book). */
export type ContactLayout = "overlay" | "page";

export type ContactProps = {
  /** "overlay": over the journey, revealed by it; "page": in the page's flow, shown as it is. */
  layout?: ContactLayout;
  /** The overlay's root — revealed (faded + slid in) by the master journey. */
  overlayRef?: RefObject<HTMLDivElement | null>;
  /** Its title's id, for the section it heads (`aria-labelledby`): the calm book's rail focuses it. */
  titleId?: string;
};

/** What a visitor sends through the form. */
export type ContactMessage = {
  name: string;
  email: string;
  message: string;
};

export type ContactLink = {
  label: string;
  href: string;
  /** Before its label (P27-81). */
  icon: LucideIcon;
  /** Opens in a new tab (profiles) — not for `mailto:`. */
  external?: boolean;
};
