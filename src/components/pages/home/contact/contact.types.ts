import type { LucideIcon } from "lucide-react";
import { RefObject } from "react";

export type ContactProps = {
  /** The overlay root — revealed (faded + slid in) by the master journey. */
  overlayRef: RefObject<HTMLDivElement | null>;
  /** Reduced motion: laid out in normal flow, shown statically. */
  reduced: boolean;
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
