"use client";

import clsx from "clsx";
import { FormEvent, useRef, useState } from "react";
import SectionMarker from "#/components/UI/SectionMarker";
import Button from "#/components/UI/buttons/Button";
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

const labelClass = clsx(
  "font-sans uppercase text-white/40",
  "text-[10px] sm:text-[11px] font-medium tracking-[0.3em]"
);
const fieldClass = clsx(
  "w-full bg-transparent rounded-none",
  "border-0 border-b border-white/20 focus:border-peach",
  "px-0 py-2 outline-none transition-colors duration-300",
  "text-white font-light text-base sm:text-lg",
  "placeholder:text-white/25"
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
      {/* Section spine — fades in with this block. */}
      <SectionMarker label="CONTACT" />

      <div
        className={clsx(
          "home-contact__inner",
          "w-full max-w-2xl flex flex-col items-center",
          reduced ? "pointer-events-auto" : "pointer-events-none"
        )}
      >
        <h2
          className={clsx(
            "home-contact__title",
            "font-great-vibes text-white",
            "text-6xl sm:text-7xl md:text-8xl leading-none",
            "mb-5 sm:mb-6"
          )}
        >
          <span>Say</span> <span className="text-peach">Hello</span>
        </h2>

        <p
          className={clsx(
            "home-contact__intro",
            "text-white/80 font-light",
            "text-base sm:text-lg md:text-xl leading-relaxed text-balance",
            "max-w-xl mb-8 sm:mb-10"
          )}
        >
          Voyager carries a message for whoever finds it. This one&rsquo;s mine
          &mdash; leave yours, and I&rsquo;ll write back.
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
            <label className="home-contact__piece flex flex-col gap-1">
              <span className={labelClass}>Name</span>
              <input
                name="name"
                type="text"
                required
                maxLength={80}
                autoComplete="name"
                placeholder="Your name"
                className={fieldClass}
              />
            </label>

            <label className="home-contact__piece flex flex-col gap-1">
              <span className={labelClass}>Email</span>
              <input
                name="email"
                type="email"
                required
                maxLength={120}
                autoComplete="email"
                placeholder="you@somewhere.com"
                className={fieldClass}
              />
            </label>

            <label className="home-contact__piece flex flex-col gap-1 sm:col-span-2">
              <span className={labelClass}>Message</span>
              <textarea
                name="message"
                required
                rows={3}
                maxLength={2000}
                placeholder="A project, a question, or just hello."
                className={clsx(fieldClass, "resize-none")}
              />
            </label>

            <div className="home-contact__piece sm:col-span-2 flex justify-center pt-2">
              <Button
                type="submit"
                label={status === "sending" ? "Sending…" : "Send it"}
                variant="outline"
                size="large"
                disabled={status === "sending"}
                className="disabled:opacity-60 disabled:cursor-default"
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
              <p className="font-great-vibes text-peach text-5xl sm:text-6xl leading-none">
                Thank you
              </p>
              <p className="text-white/75 font-light text-base sm:text-lg max-w-md">
                Your message is on its way. I&rsquo;ll write back soon.
              </p>
              <button
                type="button"
                onClick={() => setStatus("idle")}
                className={clsx(
                  labelClass,
                  "mt-2 cursor-pointer hover:text-peach transition-colors"
                )}
              >
                Write another
              </button>
            </div>
          )}
        </div>

        <ul
          className={clsx(
            "home-contact__piece home-contact__links",
            "flex flex-wrap justify-center gap-x-8 gap-y-2",
            "mt-10 sm:mt-12 text-sm text-white/55"
          )}
        >
          {CONTACT_LINKS.map((link) => (
            <li key={link.label}>
              <a
                href={link.href}
                {...(link.external
                  ? { target: "_blank", rel: "noopener noreferrer" }
                  : {})}
                className="hover:text-peach transition-colors duration-300"
              >
                {link.label}
              </a>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default Contact;
