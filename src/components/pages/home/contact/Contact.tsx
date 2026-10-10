"use client";

import clsx from "clsx";
import { FormEvent, useRef, useState } from "react";
import { PenLine, Send } from "lucide-react";
import Button from "#/components/UI/buttons/Button";
import Field from "#/components/UI/forms/Field";
import TextLink from "#/components/UI/links/TextLink";
import Swash from "#/components/UI/swash/Swash";
import DisplayTitle from "#/components/UI/text/DisplayTitle";
import { TITLE_SWASH } from "#/components/pages/home/swashes";
import { CONTACT } from "#/components/pages/home/story/copy";
import { CONTACT_LINKS, mailtoWith } from "#/components/pages/home/contact/config";
import { contactDraft } from "#/components/pages/home/contact/draft";
import { sendMessage } from "#/components/pages/home/contact/send";
import { ContactMessage, ContactProps } from "#/components/pages/home/contact/contact.types";

type Status = "idle" | "sending" | "sent" | "failed";

/** The message as a mail: what they wrote, signed with their name. */
const mailBody = ({ name, message }: ContactMessage) => `${message}\n\n— ${name}`;

/**
 * Contact — the site's last beat. After the galaxy has fully resolved (and a short
 * pause on it), this fades in over the blurred, dimmed galaxy, like The Maker: a
 * cursive title that writes in, one warm line, then the form and the links rise in.
 *
 * Driven entirely by the master pinned journey (`useCosmicJourney` → renderContact):
 * the overlay's `.home-contact__piece`s are revealed one after another, so the whole
 * thing reverses on scroll-up. This component owns only the markup + the form state
 * (idle → sending → sent → "write another"). Messages go to Netlify Forms (P27-66, send.ts);
 * when one doesn't go through, it stays in the form, with a line saying so and a link that opens
 * the visitor's mail app with it. A message being written when the modes switch is carried over
 * (P27-94, contactDraft): the form opens with it.
 */
const Contact = ({ layout = "overlay", overlayRef, titleId, send = sendMessage }: ContactProps) => {
  const page = layout === "page";
  const formRef = useRef<HTMLFormElement | null>(null);
  const [status, setStatus] = useState<Status>("idle");
  const [failed, setFailed] = useState<ContactMessage | null>(null);
  const [draft] = useState(() => contactDraft.current);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (status === "sending") return;
    const data = new FormData(event.currentTarget);
    const message: ContactMessage = {
      name: String(data.get("name") ?? ""),
      email: String(data.get("email") ?? ""),
      message: String(data.get("message") ?? ""),
    };
    setStatus("sending");
    try {
      await send(message);
    } catch {
      setFailed(message);
      setStatus("failed");
      return;
    }
    formRef.current?.reset();
    contactDraft.current = null;
    setStatus("sent");
  };

  const sent = status === "sent";

  return (
    <div
      ref={overlayRef}
      className={clsx(
        "home-contact",
        page
          ? "relative z-20 min-h-svh"
          : "pointer-events-none invisible absolute inset-0 z-20 opacity-0",
        "flex flex-col items-center justify-center text-center",
        "px-10 py-16 md:px-6", // (wider on phones, so the fields clear the section spine)
      )}
    >
      {/* A soft dark vignette behind the form, so the text reads over the (softly
          blurred) galaxy while it still glows all around. Styled in globals.css (a
          class, not an inline colour — colour extensions rewrite inline colours before
          hydration, which made React log a mismatch). */}
      <div aria-hidden className="home-contact__vignette pointer-events-none absolute inset-0" />

      <div
        className={clsx(
          "home-contact__inner",
          "relative flex w-full max-w-2xl flex-col items-center",
          page ? "pointer-events-auto" : "pointer-events-none",
        )}
      >
        <DisplayTitle
          id={titleId}
          tabIndex={titleId ? -1 : undefined}
          size="lg"
          text={CONTACT.title}
          className="home-contact__title mb-1 outline-none"
        />
        {/* Its swash draws in once the title has written in (useCosmicJourney). */}
        <Swash
          {...TITLE_SWASH.contact}
          draw={page ? "mount" : "cue"}
          className="mb-4 w-48 sm:mb-5 sm:w-64"
        />

        <p
          className={clsx(
            "home-contact__intro",
            "font-light text-white/80",
            "text-base leading-relaxed text-balance sm:text-lg md:text-xl",
            "mb-8 max-w-xl sm:mb-10",
          )}
        >
          {CONTACT.intro}
        </p>

        <div className="relative w-full">
          <form
            ref={formRef}
            onSubmit={handleSubmit}
            inert={sent}
            aria-hidden={sent}
            className={clsx(
              "home-contact__form",
              "grid grid-cols-1 gap-x-8 gap-y-6 text-left sm:grid-cols-2",
              "transition-opacity duration-500",
              sent && "opacity-0",
            )}
          >
            <Field
              label={CONTACT.fields.name.label}
              name="name"
              type="text"
              required
              maxLength={80}
              autoComplete="name"
              defaultValue={draft?.name}
              placeholder={CONTACT.fields.name.placeholder}
              className="home-contact__piece"
            />
            <Field
              label={CONTACT.fields.email.label}
              name="email"
              type="email"
              required
              maxLength={120}
              autoComplete="email"
              defaultValue={draft?.email}
              placeholder={CONTACT.fields.email.placeholder}
              className="home-contact__piece"
            />
            <Field
              label={CONTACT.fields.message.label}
              multiline
              name="message"
              required
              rows={3}
              maxLength={2000}
              defaultValue={draft?.message}
              placeholder={CONTACT.fields.message.placeholder}
              className="home-contact__piece sm:col-span-2"
            />

            <div className="home-contact__piece flex justify-center pt-2 sm:col-span-2">
              <Button
                type="submit"
                label={status === "sending" ? CONTACT.sending : CONTACT.send}
                icon={Send}
                variant="outline"
                size="large"
                disabled={status === "sending"}
              />
            </div>

            {/* It didn't go through: the message stays, and their mail app can take it. */}
            {status === "failed" && failed && (
              <p
                role="alert"
                className={clsx(
                  "text-center text-sm font-light text-balance text-light-peach sm:col-span-2 sm:text-base",
                  "moving:animate-[fadeIn_0.6s_ease-out] calm:animate-[fade_0.3s_ease-out]",
                )}
              >
                {CONTACT.failed.line}{" "}
                <a
                  href={mailtoWith(CONTACT.failed.subject, mailBody(failed))}
                  className="text-peach underline underline-offset-4 focus-ring hover:text-light-peach"
                >
                  {CONTACT.failed.email}
                </a>
                .
              </p>
            )}
          </form>

          {/* The thank-you, in the form's place once it's sent. */}
          {sent && (
            <div
              role="status"
              className={clsx(
                "home-contact__sent",
                "absolute inset-0 flex flex-col items-center justify-center gap-3",
                // With motion it rises in; in calm it only fades (P27-92).
                "moving:animate-[fadeIn_0.6s_ease-out] calm:animate-[fade_0.3s_ease-out]",
              )}
            >
              <DisplayTitle as="h3" size="sm" text={CONTACT.thanks.title} />
              <Swash {...TITLE_SWASH.contact} delay={0.3} className="-mt-2 w-40 sm:w-48" />
              <p className="max-w-md text-base font-light text-white/75 sm:text-lg">
                {CONTACT.thanks.line}
              </p>
              <Button
                label={CONTACT.thanks.again}
                icon={PenLine}
                variant="secondary"
                size="medium"
                onClick={() => setStatus("idle")}
                className="mt-2"
              />
            </div>
          )}
        </div>

        <ul
          className={clsx(
            "home-contact__piece home-contact__links",
            "flex flex-wrap justify-center gap-x-8 gap-y-2",
            "mt-10 text-sm sm:mt-12",
          )}
        >
          {CONTACT_LINKS.map((link) => (
            <li key={link.label}>
              <TextLink href={link.href} icon={link.icon} external={link.external}>
                {link.label}
              </TextLink>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default Contact;
