import type { ContactMessage } from "#/components/pages/home/contact/contact.types";

/**
 * A message being written, carried across a mode switch (P27-94): the form is in both modes,
 * and the switch replaces one with the other. In memory only, never stored; gone once sent.
 */
export const contactDraft: { current: ContactMessage | null } = { current: null };

/** Keeps what's written in the form on the page, if anything (the mode switch, before the swap). */
export function keepDraft(): void {
  const form = document.querySelector<HTMLFormElement>("form.home-contact__form");
  if (!form) return;
  const data = new FormData(form);
  const draft: ContactMessage = {
    name: String(data.get("name") ?? ""),
    email: String(data.get("email") ?? ""),
    message: String(data.get("message") ?? ""),
  };
  contactDraft.current = Object.values(draft).some(Boolean) ? draft : null;
}
