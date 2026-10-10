import { Mail } from "lucide-react";
import { GitHub, LinkedIn } from "#/components/UI/icons/brands";
import { ContactLink } from "#/components/pages/home/contact/contact.types";

/** Where messages go (and the "Email" link). */
export const CONTACT_EMAIL = "aymanelassfar@outlook.com";

/** A mail link to Aymane, filled in with a message (when sending failed, P27-66). */
export const mailtoWith = (subject: string, body: string) =>
  `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

/** The quiet row of links under the form. */
export const CONTACT_LINKS: ContactLink[] = [
  { label: "Email", href: `mailto:${CONTACT_EMAIL}`, icon: Mail },
  { label: "GitHub", href: "https://github.com/lassfar", icon: GitHub, external: true },
  {
    label: "LinkedIn",
    href: "https://www.linkedin.com/in/aymanelassfar/",
    icon: LinkedIn,
    external: true,
  },
];

/** The form's name in Netlify Forms (P27-66): the same as in public/__forms.html. */
export const CONTACT_FORM = "contact";

/** How long a send takes on the dev server, which has no Netlify (send.ts): "sending", then the thank-you. */
export const CONTACT_SEND_DELAY_MS = 900;
