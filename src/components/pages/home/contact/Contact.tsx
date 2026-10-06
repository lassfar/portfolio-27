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
import {
  CONTACT_LINKS,
  CONTACT_SEND_DELAY_MS,
} from "#/components/pages/home/contact/config";
import {
  ContactMessage,
  ContactProps,
} from "#/components/pages/home/contact/contact.types";

type Status = "idle" | "sending" | "sent";

/**
 * Sends a message. VISUAL ONLY for now (P27-66 Phase 4): it just waits a short beat
 * so the form can show "sending" → the thank-you. Wire a real service here.
 */
const sendMessage = (message: ContactMessage) =>
  new Promise<ContactMessage>((resolve) =>
    window.setTimeout(() => resolve(message), CONTACT_SEND_DELAY_MS)
  );

/**
 * Contact — the site's last beat. After the galaxy has fully resolved (and a short
 * pause on it), this fades in over the blurred, dimmed galaxy, like The Maker: a
 * cursive title that writes in, one warm line, then the form and the links rise in.
 *
 * Driven entirely by the master pinned journey (`useCosmicJourney` → renderContact):
 * the overlay's `.home-contact__piece`s are revealed one after another, so the whole
 * thing reverses on scroll-up. This component owns only the markup + the form state
 * (idle → sending → sent → "write another").
 */
const Contact = ({ overlayRef, reduced }: ContactProps) => {
  const formRef = useRef<HTMLFormElement | null>(null);
  const [status, setStatus] = useState<Status>("idle");

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (status === "sending") return;
    const data = new FormData(event.currentTarget);
    setStatus("sending");
    await sendMessage({
      name: String(data.get("name") ?? ""),
      email: String(data.get("email") ?? ""),
      message: String(data.get("message") ?? ""),
    });
    formRef.current?.reset();
    setStatus("sent");
  };

  const sent = status === "sent";

  return (
    <div
      ref={overlayRef}
      id="contact"
      className={clsx(
        "home-contact",
        reduced
          ? "relative z-20 min-h-screen"
          : "absolute inset-0 z-20 opacity-0 invisible pointer-events-none",
        "flex flex-col items-center justify-center text-center",
        "px-10 md:px-6 py-16" // (wider on phones, so the fields clear the section spine)
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
          "relative w-full max-w-2xl flex flex-col items-center",
          reduced ? "pointer-events-auto" : "pointer-events-none"
        )}
      >
        <DisplayTitle size="lg" text="Say *Hello*" className="home-contact__title mb-1" />
        {/* Its swash draws in once the title has written in (useCosmicJourney). */}
        <Swash {...TITLE_SWASH.contact} draw={reduced ? "mount" : "cue"} className="mb-4 w-48 sm:mb-5 sm:w-64" />

        <p
          className={clsx(
            "home-contact__intro",
            "text-white/80 font-light",
            "text-base sm:text-lg md:text-xl leading-relaxed text-balance",
            "max-w-xl mb-8 sm:mb-10"
          )}
        >
          Parker carries over a million names toward the Sun. Leave yours
          here, and I&rsquo;ll write back.
        </p>

        <div className="relative w-full">
          <form
            ref={formRef}
            onSubmit={handleSubmit}
            inert={sent}
            aria-hidden={sent}
            className={clsx(
              "home-contact__form",
              "grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-6 text-left",
              "transition-opacity duration-500",
              sent && "opacity-0"
            )}
          >
            <Field
              label="Name"
              name="name"
              type="text"
              required
              maxLength={80}
              autoComplete="name"
              placeholder="Your name"
              className="home-contact__piece"
            />
            <Field
              label="Email"
              name="email"
              type="email"
              required
              maxLength={120}
              autoComplete="email"
              placeholder="you@somewhere.com"
              className="home-contact__piece"
            />
            <Field
              label="Message"
              multiline
              name="message"
              required
              rows={3}
              maxLength={2000}
              placeholder="A project, a question, or just hello."
              className="home-contact__piece sm:col-span-2"
            />

            <div className="home-contact__piece sm:col-span-2 flex justify-center pt-2">
              <Button
                type="submit"
                label={status === "sending" ? "Sending…" : "Send it"}
                icon={Send}
                variant="outline"
                size="large"
                disabled={status === "sending"}
              />
            </div>
          </form>

          {/* The thank-you, in the form's place once it's sent. */}
          {sent && (
            <div
              role="status"
              className={clsx(
                "home-contact__sent",
                "absolute inset-0 flex flex-col items-center justify-center gap-3",
                "animate-[fadeIn_0.6s_ease-out]"
              )}
            >
              <DisplayTitle as="h3" size="sm" text="*Thank you*" />
              <Swash {...TITLE_SWASH.contact} delay={0.3} className="-mt-2 w-40 sm:w-48" />
              <p className="text-white/75 font-light text-base sm:text-lg max-w-md">
                Your message is on its way. I&rsquo;ll write back soon.
              </p>
              <Button
                label="Write another"
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
            "mt-10 sm:mt-12 text-sm"
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
