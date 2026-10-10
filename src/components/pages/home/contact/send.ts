import { CONTACT_FORM, CONTACT_SEND_DELAY_MS } from "#/components/pages/home/contact/config";
import type { ContactMessage, SendMessage } from "#/components/pages/home/contact/contact.types";

/** Where the page posts: the hidden copy of the form Netlify detects (public/__forms.html). */
export const FORMS_PATH = "/__forms.html";

/** How long a send may take before it counts as failed (ms). */
const TIMEOUT_MS = 15_000;

/** The body Netlify Forms takes: URL-encoded (it takes no JSON), with the form's name. */
export const formBody = (message: ContactMessage): string =>
  new URLSearchParams({ "form-name": CONTACT_FORM, ...message }).toString();

/**
 * Posts a message to Netlify Forms (P27-66): it's kept in the site's dashboard and emailed to
 * Aymane. Throws when the browser is offline, the post fails or takes over 15 s, or Netlify
 * doesn't answer OK, so the form can say it didn't go through.
 */
export const sendToNetlify: SendMessage = async (message) => {
  if (!navigator.onLine) throw new Error("Offline");
  const response = await fetch(FORMS_PATH, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: formBody(message),
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  if (!response.ok) throw new Error(`Netlify Forms answered ${response.status}`);
};

/**
 * The dev server has no Netlify: a short wait instead, so the form's states can be checked
 * there (offline still fails).
 */
const simulateSend: SendMessage = () =>
  new Promise((resolve, reject) => {
    if (!navigator.onLine) reject(new Error("Offline"));
    else window.setTimeout(resolve, CONTACT_SEND_DELAY_MS);
  });

/** The site's sender: Netlify Forms in a production build, simulated on the dev server. */
export const sendMessage: SendMessage =
  process.env.NODE_ENV === "production" ? sendToNetlify : simulateSend;
