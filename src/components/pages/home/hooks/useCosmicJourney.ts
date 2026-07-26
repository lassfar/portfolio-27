"use client";

import { RefObject } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger, SplitText } from "gsap/all";
import { useHeroScroll } from "#/stores/useHeroScroll";
import { useAboutScroll } from "#/stores/useAboutScroll";
import { useVoyageScroll } from "#/stores/useVoyageScroll";
import { JOURNEY } from "#/components/three.js/star/config";
import { clamp01, remap01 } from "#/components/three.js/star/utils";
import { addTextsScrollWriteIn } from "#/components/hooks/motions/texts/textsScrollWriteInMotion";
import { addConstellationAssembly } from "#/components/pages/home/skills/Skills";

gsap.registerPlugin(useGSAP, ScrollTrigger, SplitText);

export type CosmicJourneyRefs = {
  containerRef: RefObject<HTMLDivElement | null>;
  contentRef: RefObject<HTMLDivElement | null>;
  logoRef: RefObject<HTMLDivElement | null>;
  heroMarkerRef: RefObject<HTMLDivElement | null>;
  aboutRevealRef: RefObject<HTMLDivElement | null>;
  aboutTitleRef: RefObject<HTMLHeadingElement | null>;
  aboutPara1Ref: RefObject<HTMLParagraphElement | null>;
  aboutPara2Ref: RefObject<HTMLParagraphElement | null>;
  /** The Craft overlay root (slid up + faded by the journey). */
  craftRef: RefObject<HTMLDivElement | null>;
};

/**
 * The one pinned ScrollTrigger that drives the WHOLE cosmic story from a single
 * source of truth — so the shared canvas never unpins mid-journey and there are
 * no boundary jumps.
 *
 * Two progress spaces ride this pin (see `JOURNEY` in the star config):
 *   • mp — master progress, 0..1 over the pin. The tail phases (Craft cover /
 *     assemble / fade, then the Saturn fly-away) are mp fractions.
 *   • jp — journey progress, mp / journeyEnd. The star→Saturn→About block; its
 *     internal thresholds are jp fractions, unchanged by the tail.
 *
 * Everything visual is a deterministic function of progress (set every frame),
 * so the reveal, the Craft, and the fly-away all reverse perfectly on scroll-up.
 * Reduced motion skips the pin: the About + Craft are shown statically (the host
 * lays them out in normal flow) and the planet stays hidden.
 */
export default function useCosmicJourney(refs: CosmicJourneyRefs): void {
  const {
    containerRef,
    contentRef,
    logoRef,
    heroMarkerRef,
    aboutRevealRef,
    aboutTitleRef,
    aboutPara1Ref,
    aboutPara2Ref,
    craftRef,
  } = refs;

  useGSAP(
    () => {
      const reduce =
        typeof window !== "undefined" &&
        window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      if (reduce) {
        // No journey: show the About copy and the Craft statically (the host
        // flips the overlays to normal flow); the planet stays hidden.
        gsap.set(aboutRevealRef.current, { autoAlpha: 1, y: 0 });
        gsap.set(craftRef.current, { autoAlpha: 1, y: 0, clearProps: "transform" });
        return;
      }

      const setStar = useHeroScroll.getState().setProgress;
      const setAbout = useAboutScroll.getState().setProgress;
      const setVoyage = useVoyageScroll.getState().setProgress;

      const easeIn = gsap.parseEase("power2.in");
      const easeOut = gsap.parseEase("power2.out");
      const easeInOut = gsap.parseEase("power2.inOut");

      // Cached once (never re-queried per frame).
      const cosmos = containerRef.current?.querySelector<HTMLElement>(
        ".home-hero__canvas"
      );

      // ── About reveal/exit (deterministic, reversible) ──────────────────────
      const renderAbout = (p: number) => {
        const enterLin = remap01(p, JOURNEY.revealStart, JOURNEY.fillStart);
        const exitLin = remap01(p, JOURNEY.exitStart, 1);
        const enter = easeOut(enterLin);
        const exit = easeIn(exitLin);

        const block = aboutRevealRef.current;
        if (block) {
          block.style.opacity = String(enter * (1 - exit));
          block.style.transform = `translateY(${-40 * (1 - enter) - 80 * exit}px)`;
          block.style.filter = `blur(${16 * exit}px)`;
        }

        if (cosmos) {
          const k = enterLin * (1 - exitLin);
          cosmos.style.filter = `blur(${JOURNEY.revealBlur * k}px) brightness(${
            1 - (1 - JOURNEY.revealDim) * k
          })`;
        }
      };

      // ── Craft overlay: slides up over the Saturn, then fades to reveal it ───
      const renderCraft = (mp: number) => {
        const craft = craftRef.current;
        if (!craft) return;
        const cover = easeOut(remap01(mp, JOURNEY.journeyEnd, JOURNEY.craftCoverEnd));
        const fade = easeInOut(remap01(mp, JOURNEY.craftFadeStart, JOURNEY.craftFadeEnd));
        craft.style.transform = `translateY(${(1 - cover) * 100}%)`;
        craft.style.opacity = String(1 - fade);
        craft.style.visibility = cover > 0.001 && fade < 0.999 ? "visible" : "hidden";
      };

      renderAbout(0);
      renderCraft(0);

      // Paused, one-shot per-character write-ins for the two big overlay titles
      // (the Hero motion), toggled by progress rather than scrubbed.
      const makeTitleWriteIn = (el: HTMLElement | null) => {
        if (!el) return null;
        const split = new SplitText(el, { type: "words,chars" });
        const tween = gsap.from(split.chars, {
          opacity: 0,
          y: 24,
          stagger: 0.03,
          duration: 0.6,
          ease: "power3.out",
          paused: true,
        });
        return { split, tween, shown: false };
      };
      const aboutTitle = makeTitleWriteIn(aboutTitleRef.current);
      const craftTitle = makeTitleWriteIn(
        craftRef.current?.querySelector<HTMLElement>(".skills__title") ?? null
      );

      const toggleTitle = (
        t: ReturnType<typeof makeTitleWriteIn>,
        past: boolean
      ) => {
        if (!t) return;
        if (past && !t.shown) {
          t.shown = true;
          t.tween.play();
        } else if (!past && t.shown) {
          t.shown = false;
          t.tween.reverse();
        }
      };

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: containerRef.current,
          start: "top top",
          end: JOURNEY.pinLength,
          pin: true,
          scrub: 1,
          onUpdate: (self) => {
            const mp = self.progress; // master 0..1
            const jp = clamp01(mp / JOURNEY.journeyEnd); // journey 0..1
            setStar(clamp01(jp / JOURNEY.starSpan));
            setAbout(remap01(jp, JOURNEY.assembleStart, JOURNEY.assembleEnd));
            // Voyage spans flyAwayStart..pin end (0→1); its sub-phases (fly-away,
            // then the solar reveal) are voyage fractions in the R3F components.
            setVoyage(remap01(mp, JOURNEY.flyAwayStart, 1));
            renderAbout(jp);
            renderCraft(mp);
            toggleTitle(aboutTitle, jp >= JOURNEY.revealStart);
            // The Craft title writes in once the overlay has fully covered.
            toggleTitle(craftTitle, mp >= JOURNEY.craftCoverEnd);
          },
        },
      });

      // Timeline positions live in mp (0..1). The journey block is scaled by
      // journeyEnd so its jp-fraction thresholds land at the right mp.
      const JE = JOURNEY.journeyEnd;
      const contentExit = JOURNEY.contentExit * JE;

      tl.to(
        contentRef.current,
        { yPercent: -60, autoAlpha: 0, ease: "power1.in", duration: contentExit },
        0
      )
        .to(
          logoRef.current,
          { autoAlpha: 0, ease: "power1.in", duration: contentExit },
          0
        )
        .to(
          heroMarkerRef.current,
          { autoAlpha: 0, ease: "power1.in", duration: contentExit },
          0
        )
        // Spacer so the pin (and the scrubbed progress) spans the whole pin.
        .to({}, { duration: 1 - contentExit });

      // About description — scroll-scrubbed per-word write-in over fillStart..exitStart.
      const descSplits = addTextsScrollWriteIn(
        tl,
        [
          { ref: aboutPara1Ref, type: "words", weight: 1 },
          { ref: aboutPara2Ref, type: "words", weight: 1 },
        ],
        {
          at: JOURNEY.fillStart * JE,
          duration: (JOURNEY.exitStart - JOURNEY.fillStart) * JE,
        }
      );

      // Craft constellation — scrubbed assembly over the cover→fade window.
      addConstellationAssembly(tl, {
        at: JOURNEY.craftCoverEnd,
        duration: JOURNEY.constellationEnd - JOURNEY.craftCoverEnd,
      });

      return () => {
        setStar(0);
        setAbout(0);
        setVoyage(0);
        descSplits.forEach((s) => s.revert());
        aboutTitle?.tween.kill();
        aboutTitle?.split.revert();
        craftTitle?.tween.kill();
        craftTitle?.split.revert();
      };
    },
    { scope: containerRef }
  );
}
