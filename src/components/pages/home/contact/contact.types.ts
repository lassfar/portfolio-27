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
  /** How a message is sent (stories pass a stand-in); by default Netlify Forms (`send.ts`). */
  send?: SendMessage;
};

/** What a visitor sends through the form. */
export type ContactMessage = {
  name: string;
  email: string;
  message: string;
};

/** Sends a message, or throws when it couldn't (offline, a failed post): the form says so. */
export type SendMessage = (message: ContactMessage) => Promise<void>;

export type ContactLink = {
  label: string;
  href: string;
  /** Before its label (P27-81). */
  icon: LucideIcon;
  /** Opens in a new tab (profiles) — not for `mailto:`. */
  external?: boolean;
};
