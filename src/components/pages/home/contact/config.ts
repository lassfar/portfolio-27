import { ContactLink } from "#/components/pages/home/contact/contact.types";

/** Where messages go (and the "Email" link). */
export const CONTACT_EMAIL = "aymanelassfar@outlook.com";

/** The quiet row of links under the form. */
export const CONTACT_LINKS: ContactLink[] = [
  { label: "Email", href: `mailto:${CONTACT_EMAIL}` },
  { label: "GitHub", href: "https://github.com/lassfar", external: true },
  { label: "LinkedIn", href: "https://www.linkedin.com/in/aymanelassfar/", external: true },
];

/**
 * Sending is VISUAL ONLY for now (P27-66 Phase 4): the form shows "sending", then the
 * thank-you, after this short beat. Wire a real service in `sendMessage` (Contact.tsx).
 */
export const CONTACT_SEND_DELAY_MS = 900;
