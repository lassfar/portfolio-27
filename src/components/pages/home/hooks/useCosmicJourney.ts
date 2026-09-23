"use client";

import { RefObject } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger, SplitText } from "gsap/all";
import { useHeroScroll } from "#/stores/useHeroScroll";
import { useAboutScroll } from "#/stores/useAboutScroll";
import { useVoyageScroll } from "#/stores/useVoyageScroll";
import { useLabScroll } from "#/stores/useLabScroll";
import { useGalaxyScroll } from "#/stores/useGalaxyScroll";
import { journeyTrigger } from "#/stores/journeyTrigger";
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
  /** The Contact overlay root (faded in over the blurred galaxy at the end). */
  contactRef: RefObject<HTMLDivElement | null>;
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
 * so the reveal, the Craft, the fly-away and the Contact form all reverse perfectly
 * on scroll-up. Reduced motion skips the pin: the About, Craft + Contact are shown
 * statically (the host lays them out in normal flow) and the planet stays hidden.
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
    contactRef,
  } = refs;

  useGSAP(
    () => {
      const reduce =
        typeof window !== "undefined" &&
        window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      if (reduce) {
        // No journey: show the About copy, the Craft and the Contact statically
        // (the host flips the overlays to normal flow); the planet stays hidden.
        gsap.set(aboutRevealRef.current, { autoAlpha: 1, y: 0 });
        gsap.set(craftRef.current, { autoAlpha: 1, y: 0, clearProps: "transform" });
        gsap.set(contactRef.current, { autoAlpha: 1, y: 0 });
        return;
      }

      const setStar = useHeroScroll.getState().setProgress;
      const setAbout = useAboutScroll.getState().setProgress;
      const setVoyage = useVoyageScroll.getState().setProgress;
      const setLab = useLabScroll.getState().setProgress;
      const setGalaxy = useGalaxyScroll.getState().setProgress;

      const easeIn = gsap.parseEase("power2.in");
      const easeOut = gsap.parseEase("power2.out");
      const easeInOut = gsap.parseEase("power2.inOut");

      // Cached once (never re-queried per frame).
      const cosmos = containerRef.current?.querySelector<HTMLElement>(
        ".home-hero__canvas"
      );
      const contactInner = contactRef.current?.querySelector<HTMLElement>(
        ".home-contact__inner"
      );
      const contactPieces = Array.from(
        contactRef.current?.querySelectorAll<HTMLElement>(".home-contact__piece") ?? []
      );

      // ── The cosmos behind the overlays: blurred + dimmed under the About and
      //    the Contact (each passes its own 0..1 veil; they never overlap) ─────────
      const renderCosmos = (aboutVeil: number, contactVeil: number) => {
        if (!cosmos) return;
        const blur = Math.max(
          JOURNEY.revealBlur * aboutVeil,
          JOURNEY.contactBlur * contactVeil
        );
        const dim = Math.min(
          1 - (1 - JOURNEY.revealDim) * aboutVeil,
          1 - (1 - JOURNEY.contactDim) * contactVeil
        );
        cosmos.style.filter =
          blur > 0 || dim < 1 ? `blur(${blur}px) brightness(${dim})` : "none";
      };

      // ── About reveal/exit (deterministic, reversible) — returns its veil ──────
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

        return enterLin * (1 - exitLin);
      };

      // ── Craft overlay: slides up over the Saturn, then fades to reveal it ───
      const renderCraft = (mp: number) => {
        const craft = craftRef.current;
        if (!craft) return;
        const cover = easeOut(remap01(mp, JOURNEY.craftCoverStart, JOURNEY.craftCoverEnd));
        const fade = easeInOut(remap01(mp, JOURNEY.craftFadeStart, JOURNEY.craftFadeEnd));
        craft.style.transform = `translateY(${(1 - cover) * 100}%)`;
        craft.style.opacity = String(1 - fade);
        craft.style.visibility = cover > 0.001 && fade < 0.999 ? "visible" : "hidden";
      };

      // ── Contact: after a pause on the full galaxy, the block fades + slides in
      //    over it (like the About), then the fields → button → links rise in one
      //    after another. Returns its veil for the cosmos. ─────────────────────────
      const renderContact = (mp: number) => {
        const c = remap01(mp, JOURNEY.contactStart, JOURNEY.contactEnd);
        const enterLin = remap01(c, 0, 0.45);
        const enter = easeOut(enterLin);
        const block = contactRef.current;
        if (block) {
          block.style.opacity = String(enter);
          block.style.transform = `translateY(${-40 * (1 - enter)}px)`;
          block.style.visibility = enter > 0.001 ? "visible" : "hidden";
        }
        contactPieces.forEach((piece, i) => {
          const t = easeOut(remap01(c, 0.5 + i * 0.06, 0.75 + i * 0.06));
          piece.style.opacity = String(t);
          piece.style.transform = `translateY(${16 * (1 - t)}px)`;
          piece.style.visibility = t > 0.001 ? "visible" : "hidden"; // not tabbable while hidden
        });
        // The form only takes the pointer once it's in (drags reach space till then).
        if (contactInner) contactInner.style.pointerEvents = c >= 0.6 ? "auto" : "none";
        return enterLin;
      };

      renderCosmos(renderAbout(0), renderContact(0));
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
      const contactTitle = makeTitleWriteIn(
        contactRef.current?.querySelector<HTMLElement>(".home-contact__title") ?? null
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
            // Voyage spans flyAwayStart..voyageEnd (0→1); its sub-phases (fly-away,
            // solar reveal, Earth dive) are voyage fractions in the R3F components.
            // It clamps at 1 through the Earth dwell + the Lab, so the Earth holds.
            setVoyage(remap01(mp, JOURNEY.flyAwayStart, JOURNEY.voyageEnd));
            // The Lab (Earth→Voyager) beat runs AFTER the dwell: earthDwellEnd..galaxyStart.
            // Over [voyageEnd, earthDwellEnd] this stays 0, so the Earth just holds.
            setLab(remap01(mp, JOURNEY.earthDwellEnd, JOURNEY.galaxyStart));
            // The Galaxy finale runs over galaxyStart..galaxyEnd: the camera pulls back
            // from the Voyager, flies through stars, and the galaxy resolves.
            setGalaxy(remap01(mp, JOURNEY.galaxyStart, JOURNEY.galaxyEnd));
            renderCosmos(renderAbout(jp), renderContact(mp));
            renderCraft(mp);
            toggleTitle(aboutTitle, jp >= JOURNEY.revealStart);
            // The Craft title writes in once the overlay has fully covered.
            toggleTitle(craftTitle, mp >= JOURNEY.craftCoverEnd);
            // The Contact title writes in as its block starts to appear.
            toggleTitle(contactTitle, mp > JOURNEY.contactStart);
          },
        },
      });

      journeyTrigger.current = tl.scrollTrigger ?? null; // for dev "jump to" tools

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

      // Contact intro line — scroll-scrubbed per-word write-in, after the title.
      const contactSpan = JOURNEY.contactEnd - JOURNEY.contactStart;
      const contactIntroSplits = addTextsScrollWriteIn(
        tl,
        [
          {
            ref: {
              current:
                contactRef.current?.querySelector<HTMLElement>(".home-contact__intro") ??
                null,
            },
            type: "words",
          },
        ],
        { at: JOURNEY.contactStart + 0.2 * contactSpan, duration: 0.3 * contactSpan }
      );

      return () => {
        journeyTrigger.current = null;
        setStar(0);
        setAbout(0);
        setVoyage(0);
        setLab(0);
        setGalaxy(0);
        descSplits.forEach((s) => s.revert());
        contactIntroSplits.forEach((s) => s.revert());
        aboutTitle?.tween.kill();
        aboutTitle?.split.revert();
        craftTitle?.tween.kill();
        craftTitle?.split.revert();
        contactTitle?.tween.kill();
        contactTitle?.split.revert();
      };
    },
    { scope: containerRef }
  );
}
