"use client";

import { useGSAP } from "@gsap/react";
import clsx from "clsx";
import gsap from "gsap";
import { useRef } from "react";
import { PARKER_JOURNEY } from "#/components/three.js/parker/config";
import { journeyReadout, journeyScreen } from "#/components/three.js/parker/journeyScreen";
import { DRUMS, odometerDigits, stepsReached } from "./odometer";

gsap.registerPlugin(useGSAP);

/** The readout's fades, the digits' roll and a dot lighting (seconds). */
const FADE = { in: 0.4, out: 0.6 } as const;
const ROLL = 0.6;
const LIGHT = 0.4;

/** How long the number holds before screen readers are told (ms): not every roll. */
const SAY_AFTER_MS = 1000;

const DIGITS = Array.from({ length: 10 }, (_, i) => i);
const SMALL_CAPS = "font-krone-one text-3xs tracking-caps text-white/60 uppercase";

/**
 * How close Parker has come to the Sun yet (P27-118): a still readout in the bottom-right corner
 * while the Lab's journey line draws. A big number whose digits roll as the record drops, and a dot
 * for each new record it set, lighting up towards the last (which brings its line). The 3D line
 * publishes the number (`journeyScreen.readout`, then `journeyReadout.update`); GSAP moves it all
 * (the fades, the roll, the dots), only when something changes, so nothing re-renders. Screen
 * readers hear it once it holds, not on every roll. Under the panel, and away in its full view
 * (SceneLabelLayer).
 */
const ClosestYet = () => {
  const rootRef = useRef<HTMLDivElement>(null);
  const drumsRef = useRef<(HTMLSpanElement | null)[]>([]);
  const reelsRef = useRef<(HTMLSpanElement | null)[]>([]);
  const dotsRef = useRef<(HTMLSpanElement | null)[]>([]);
  const recordRef = useRef<HTMLSpanElement>(null);
  const statusRef = useRef<HTMLParagraphElement>(null);

  useGSAP(
    (_, contextSafe) => {
      if (!contextSafe) return;
      let shownBefore = false;
      let kmBefore = "";
      let recordBefore = false;
      let say = 0;
      const update = contextSafe(() => {
        const root = rootRef.current;
        if (!root) return;
        const { shown, km, record } = journeyScreen.readout;
        if (shown !== shownBefore) {
          shownBefore = shown;
          gsap.to(root, {
            autoAlpha: shown ? 1 : 0,
            duration: shown ? FADE.in : FADE.out,
            ease: shown ? "power2.out" : "power2.in",
            overwrite: "auto",
          });
        }
        if (km === kmBefore) return;
        // Not seen yet: the drums are simply there, on the first number.
        const roll = kmBefore && shown ? ROLL : 0;
        kmBefore = km;
        const reached = stepsReached(km, PARKER_JOURNEY.readout.steps);
        dotsRef.current.forEach((dot, i) => {
          if (!dot) return;
          const lit = i < reached;
          dot.dataset.lit = String(lit);
          gsap.to(dot.firstElementChild, {
            opacity: lit ? 1 : 0,
            duration: roll && LIGHT,
            overwrite: true,
          });
        });
        odometerDigits(km).forEach((digit, i) => {
          const drum = drumsRef.current[i];
          if (!drum) return;
          drum.hidden = digit === null;
          drum.dataset.digit = String(digit ?? 0);
          gsap.to(reelsRef.current[i], {
            yPercent: -10 * (digit ?? 0), // a reel is ten digits tall
            duration: roll,
            ease: "power3.out",
            overwrite: true,
          });
        });
        if (record !== recordBefore) {
          recordBefore = record;
          gsap.to(recordRef.current, { autoAlpha: record ? 1 : 0, duration: FADE.in });
        }
        window.clearTimeout(say);
        say = window.setTimeout(() => {
          const { label, unit } = PARKER_JOURNEY.readout;
          if (statusRef.current) statusRef.current.textContent = `${label}: ${km} ${unit}`;
        }, SAY_AFTER_MS);
      });
      journeyReadout.update = update;
      return () => {
        window.clearTimeout(say);
        if (journeyReadout.update === update) journeyReadout.update = null;
        // The journey can mount again (the mode switch): the line says it all again then.
        journeyScreen.readout.shown = false;
      };
    },
    { scope: rootRef },
  );

  return (
    <div
      ref={rootRef}
      data-closest-yet
      className="pointer-events-none invisible fixed right-4 bottom-3 z-45 flex flex-col items-end gap-1.5 opacity-0 [text-shadow:0_0_12px_var(--color-rich-black)] sm:right-8 sm:bottom-5 short:right-16"
    >
      <p ref={statusRef} role="status" className="sr-only" />
      <span
        aria-hidden="true"
        className="flex items-end font-sans text-[1.3125rem] leading-none font-light text-peach tabular-nums sm:text-[2.1rem] short:text-[1.3125rem]"
      >
        {Array.from({ length: DRUMS }, (_, i) => (
          <span key={i} className="contents">
            {i === DRUMS - 1 && <span>.</span>}
            <span
              ref={(el) => {
                drumsRef.current[i] = el;
              }}
              className="closest-yet__digit"
            >
              <span
                ref={(el) => {
                  reelsRef.current[i] = el;
                }}
                className="closest-yet__reel"
              >
                {DIGITS.map((digit) => (
                  <span key={digit}>{digit}</span>
                ))}
              </span>
            </span>
          </span>
        ))}
      </span>
      {/* On a phone or a short screen the words stack, to keep clear of the orb. */}
      <span
        aria-hidden="true"
        className={clsx(
          SMALL_CAPS,
          "flex flex-col items-end sm:flex-row sm:gap-[0.6em] short:flex-col short:gap-0",
        )}
      >
        <span>{PARKER_JOURNEY.readout.unit}</span>
        <span className="hidden sm:inline short:hidden">·</span>
        <span>{PARKER_JOURNEY.readout.label}</span>
      </span>
      <span aria-hidden="true" className="flex gap-1">
        {PARKER_JOURNEY.readout.steps.map((step, i) => (
          <span
            key={step}
            ref={(el) => {
              dotsRef.current[i] = el;
            }}
            data-lit="false"
            className="closest-yet__dot size-1 rounded-full bg-gray-slate/30"
          >
            <span className="block size-full rounded-full bg-peach opacity-0" />
          </span>
        ))}
      </span>
      {/* Its room is kept, so nothing shifts when it shows at the record. Not on a phone or a short
          screen, where the subtitles and the orb leave no room: every dot lit says it there. */}
      <span
        ref={recordRef}
        aria-hidden="true"
        className="invisible hidden text-right text-xs text-light-peach/80 opacity-0 sm:block short:hidden"
      >
        {PARKER_JOURNEY.readout.record}
      </span>
    </div>
  );
};

export default ClosestYet;
