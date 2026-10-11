"use client";

import clsx from "clsx";
import type { MouseEvent } from "react";
import { createPortal } from "react-dom";
import { useIsClient } from "#/components/hooks/useIsClient";
import { titleId } from "#/components/pages/home/book/chapters";
import { landInBook } from "#/components/pages/home/book/place";
import { JOURNEY_CONTACT_TITLE_ID } from "#/components/pages/home/contact/config";
import { loadJourneyMotion } from "#/components/pages/home/loadJourney";
import { PAGE_CONTROLS_ID } from "#/components/pages/home/motion/pageControls";
import { CONTACT } from "#/components/pages/home/story/copy";
import { isCalm } from "#/stores/useMotion";

/** How long the journey may take to be ready, then to show Contact once landed (ms). */
const READY_MS = 3000;
const SHOWN_MS = 1000;

/** Resolves once `el` is shown (the journey reveals Contact as it lands), or after `ms`. */
const whenShown = (el: HTMLElement, ms: number) =>
  new Promise<void>((resolve) => {
    const until = performance.now() + ms;
    const check = () => {
      if (getComputedStyle(el).visibility === "visible" || performance.now() >= until) resolve();
      else requestAnimationFrame(check);
    };
    check();
  });

/**
 * The focus to Contact's heading; once a message was sent (the form hidden and inert, the
 * thank-you in its place), to its "Write another".
 */
function focusContact(title: HTMLElement | null) {
  const target = title?.closest("[inert]")
    ? title.closest(".home-contact")?.querySelector<HTMLElement>(".home-contact__sent button")
    : title;
  target?.focus({ preventScroll: true });
}

/**
 * Takes the visitor to Contact at once, with the focus on it: the book scrolls to it; the
 * journey lands on it (its overlay revealed) once its scroll code is in.
 */
async function skipToContact() {
  if (isCalm()) {
    landInBook("contact", false);
    return focusContact(document.getElementById(titleId("contact")));
  }
  const journey = await loadJourneyMotion();
  if (!(await journey.waitForJourney(READY_MS))) return;
  journey.landJourney("contact");
  const title = document.getElementById(JOURNEY_CONTACT_TITLE_ID);
  if (!title) return;
  await whenShown(title, SHOWN_MS);
  focusContact(title);
}

/**
 * "Skip to Contact" (P27-99, WCAG 2.4.1): the second Tab stop, right after the Reduce motion
 * switch, so a keyboard or screen-reader visitor needn't cross the whole story (in the journey,
 * ~64 screens). Unseen until it has the focus, then a glass pill beside the switch (it only
 * fades: nothing moves, calm or not). Portalled into the page's controls after the switch, on
 * the client only like it: without JS the book shows, with everything in its flow.
 */
const SkipToContact = () => {
  const client = useIsClient();
  if (!client) return null;
  const skip = (event: MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault();
    void skipToContact();
  };
  return createPortal(
    <a
      href="#contact"
      onClick={skip}
      className={clsx(
        "fixed top-4.5 right-17 z-46 sm:top-6 sm:right-18.5",
        "flex h-10 items-center rounded-full glass px-4 text-sm whitespace-nowrap text-white focus-ring",
        "pointer-events-none opacity-0 transition-opacity duration-200",
        // Away while a panel is open, and under the mode switch's screen.
        "focus-visible:pointer-events-auto focus-visible:opacity-100 panel-open:invisible switching:invisible",
      )}
    >
      {CONTACT.skip}
    </a>,
    document.getElementById(PAGE_CONTROLS_ID) ?? document.body,
  );
};

export default SkipToContact;
